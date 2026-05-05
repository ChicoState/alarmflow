import notifee, {
  TriggerType,
  TimestampTrigger,
  AndroidImportance,
  AndroidCategory,
  AndroidVisibility,
  EventType,
  Event,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Platform,
  PermissionsAndroid,
  Linking,
  Alert,
  AlertButton,
} from 'react-native';

// ========================== //
// CONSTANTS
// ========================== //
const CHANNEL_ID = 'alarm_channel'; // bumped: changing channel sound/importance
                                       // requires a new channel id, Android caches
                                       // the original settings on the old one.
const CHANNEL_NAME = 'Alarm Notifications';

// Persisted user preferences
const BATTERY_OPT_DISMISSED_KEY = 'BATTERY_OPT_PROMPT_DISMISSED';

// Action IDs
const DISMISS_ACTION_ID = 'dismiss_alarm';

// ========================== //
// TYPES
// ========================== //
export interface AlarmSet {
  id: string;
  start: string;           // ISO string for precise reconstruction
  end: string;             // ISO string
  interval: number;        // minutes
  count: number;           // num of individual alarms in the set
  active: boolean;
  notificationIds: string[]; // track scheduled notifee trigger IDs
}


// ========================== //
// INTERNAL: SERIALIZED ALERTS
// ========================== //
/**
 * `Alert.alert` is fire-and-forget — it returns immediately and does NOT
 * wait for the user to dismiss it. When several permission checks fail in
 * a row (or when the caller fires its own Alert right after this function
 * returns), the dialogs stack on top of each other.
 *
 * This helper:
 *   1) wraps Alert.alert in a Promise that only resolves once the user
 *      taps a button OR dismisses the dialog, AND
 *   2) serializes through a module-level queue so that even if multiple
 *      callers request an alert concurrently, they appear one-at-a-time.
 *
 * That kills the "overlapping popups" bug at its source.
 */
let alertChain: Promise<void> = Promise.resolve();

export function showAlertAsync(
  title: string,
  message: string,
  buttons: AlertButton[],
): Promise<void> {
  const next = alertChain.then(
    () =>
      new Promise<void>((resolve) => {
        let settled = false;
        const settle = () => {
          if (settled) return;
          settled = true;
          resolve();
        };

        const wrappedButtons: AlertButton[] = buttons.map((btn) => ({
          ...btn,
          onPress: (value?: string) => {
            try {
              btn.onPress?.(value);
            } finally {
              settle();
            }
          },
        }));

        Alert.alert(title, message, wrappedButtons, {
          cancelable: true,
          onDismiss: settle,
        });
      }),
  );

  // Keep the chain alive even if a previous link rejects.
  alertChain = next.catch(() => undefined);
  return next;
}


// ========================== //
// CHANNEL SETUP
// ========================== //
/**
 * Creates the Android notification channel configured for ALARM behavior:
 *  - importance HIGH so it heads-up
 *  - bypasses DND (alarm category)
 *  - uses default alarm stream so volume follows the alarm slider
 *
 * NOTE: Once a channel is created, its importance/sound CANNOT be changed
 * by the app — the user owns those settings. That's why we use a v2 id;
 * if the previous app build created the old channel, we leave it alone
 * and use this fresh one with the correct alarm config.
 */
export async function createAlarmChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: CHANNEL_NAME,
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    vibrationPattern: [300, 500, 300, 500],
    bypassDnd: true,
    visibility: AndroidVisibility.PUBLIC,
  });
}


// ========================== //
// PERMISSIONS
// ========================== //
/**
 * Guard against concurrent invocations. If the user taps "Create Alarm"
 * twice quickly, or a useEffect fires alongside a button press, we want
 * a single permission flow — not two racing flows that stack alerts.
 */
let pendingPermissionRequest: Promise<boolean> | null = null;

/**
 * Requests permissions needed for reliable alarm delivery:
 *  - Notification permission (Android 13+) — REQUIRED, blocks if denied
 *  - Exact alarm permission (Android 12+) — REQUIRED, blocks if denied
 *  - Battery optimization exemption — OPTIONAL soft prompt, asked at most ONCE
 *
 * The battery prompt persists the user's "Skip" choice in AsyncStorage so
 * we don't badger them on every Create Alarm tap. They can re-trigger the
 * prompt manually via resetBatteryOptimizationPrompt() if we ever expose
 * a settings screen for it.
 */
export async function requestAlarmPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  // De-dupe concurrent callers — return the in-flight promise.
  if (pendingPermissionRequest) return pendingPermissionRequest;

  pendingPermissionRequest = (async (): Promise<boolean> => {
    try {
      // 1. POST_NOTIFICATIONS (Android 13+ / API 33+)
      if (Platform.Version >= 33) {
        const notifPerm = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (notifPerm !== PermissionsAndroid.RESULTS.GRANTED) {
          await showAlertAsync(
            'Notification Permission Required',
            'Alarm Flow needs notification permission to alert you. Please enable it in Settings.',
            [
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
              { text: 'Cancel', style: 'cancel' },
            ],
          );
          return false;
        }
      }

      // 2. SCHEDULE_EXACT_ALARM (Android 12+ / API 31+)
      if (Platform.Version >= 31) {
        const exactAlarmSettings = await notifee.getNotificationSettings();
        // android.alarm is 1 when allowed, 2 when denied
        if (exactAlarmSettings.android.alarm !== 1) {
          await showAlertAsync(
            'Exact Alarm Permission Required',
            'Alarm Flow needs the "Alarms & reminders" permission to fire alarms on time.',
            [
              {
                text: 'Open Settings',
                onPress: () => notifee.openAlarmPermissionSettings(),
              },
              { text: 'Cancel', style: 'cancel' },
            ],
          );
          return false;
        }
      }

      // 3. Battery optimization — soft, ask-once.
      //
      // We only show this prompt if BOTH:
      //   (a) the OS still has us battery-optimized, AND
      //   (b) the user hasn't already dismissed/skipped this prompt.
      //
      // If the user opens settings and disables optimization, condition
      // (a) becomes false on the next call and we never ask again.
      // If they tap "Skip", we set the flag in (b) and never ask again
      // unless explicitly reset.
      const dismissed = await AsyncStorage.getItem(BATTERY_OPT_DISMISSED_KEY);
      if (dismissed !== 'true') {
        const batteryOptimized = await notifee.isBatteryOptimizationEnabled();
        if (batteryOptimized) {
          await showAlertAsync(
            'Battery Optimization',
            'For reliable alarms, please disable battery optimization for Alarm Flow. You can change this later in your phone Settings.',
            [
              {
                text: 'Open Settings',
                onPress: async () => {
                  // Treat opening settings as "they handled it" — we don't
                  // re-prompt. If they don't actually flip the switch, the
                  // OS-level optimization stays on but they made the call.
                  await AsyncStorage.setItem(BATTERY_OPT_DISMISSED_KEY, 'true');
                  notifee.openBatteryOptimizationSettings();
                },
              },
              {
                text: 'Skip',
                style: 'cancel',
                onPress: async () => {
                  await AsyncStorage.setItem(BATTERY_OPT_DISMISSED_KEY, 'true');
                },
              },
            ],
          );
        }
      }

      return true;
    } finally {
      pendingPermissionRequest = null;
    }
  })();

  return pendingPermissionRequest;
}

/**
 * Clears the persisted "user dismissed battery optimization prompt" flag.
 * Call this if you add a settings screen with a "Re-check battery settings"
 * button.
 */
export async function resetBatteryOptimizationPrompt(): Promise<void> {
  await AsyncStorage.removeItem(BATTERY_OPT_DISMISSED_KEY);
}


// ========================== //
// SCHEDULING
// ========================== //
/**
 * Schedules OS-level alarm trigger notifications for every alarm in a set.
 *
 * Each alarm is configured to RING (not ping) until the user dismisses it:
 *   - category: ALARM         — bypasses DND, treated as alarm by OS
 *   - loopSound: true         — sound restarts continuously
 *   - ongoing: true           — user can't swipe it away accidentally
 *   - autoCancel: false       — tapping the body doesn't dismiss
 *   - fullScreenAction        — pops over lockscreen (requires
 *                               USE_FULL_SCREEN_INTENT in AndroidManifest)
 *   - explicit "Dismiss" action — the only clean way to silence it
 *   - importance HIGH + alarm category + asForegroundService keeps the
 *     sound playing even if the system tries to throttle the notification
 */
export async function scheduleAlarmSet(
  startDate: Date,
  endDate: Date,
  intervalMinutes: number,
): Promise<{ count: number; notificationIds: string[] }> {
  const intervalMs = intervalMinutes * 60 * 1000;
  const notificationIds: string[] = [];
  let current = new Date(startDate);
  const now = Date.now();

  let scheduledCount = 0;
  let index = 0;
  while (current <= endDate) {
    // Only schedule future alarms (skip times that already passed)
    if (current.getTime() > now) {
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: current.getTime(),
        alarmManager: {
          allowWhileIdle: true, // fires during Doze mode
        },
      };

      const timeLabel = current.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      const id = await notifee.createTriggerNotification(
        {
          title: 'Alarm Flow',
          body: `Alarm #${index + 1} — ${timeLabel}`,
          android: {
            channelId: CHANNEL_ID,
            importance: AndroidImportance.HIGH,
            category: AndroidCategory.ALARM,
            visibility: AndroidVisibility.PUBLIC,

            // RING, don't ping ----------------------------------------
            sound: 'default',
            loopSound: true,
            // Vibrate in a long pattern so it feels like an alarm
            vibrationPattern: [300, 500, 300, 500, 300, 500, 300, 500],

            // Persist on screen until dismissed
            ongoing: true,
            autoCancel: false,

            // Pop over the lockscreen / wake the device
            fullScreenAction: { id: 'default' },
            pressAction: { id: 'default' },

            // Explicit dismiss button — the user-facing way to silence it
            actions: [
              {
                title: 'Dismiss',
                pressAction: { id: DISMISS_ACTION_ID },
              },
            ],
          },
        },
        trigger,
      );

      notificationIds.push(id);
      scheduledCount++;
    }

    index++;
    current = new Date(current.getTime() + intervalMs);
  }

  return { count: scheduledCount, notificationIds };
}


// ========================== //
// CANCELLATION
// ========================== //
export async function cancelAlarmSet(notificationIds: string[]): Promise<void> {
  for (const id of notificationIds) {
    await notifee.cancelTriggerNotification(id);
    // Also cancel any *displayed* copy of this notification (in case it
    // already fired and is currently ringing).
    await notifee.cancelDisplayedNotification(id);
  }
}

export async function cancelAllAlarms(): Promise<void> {
  await notifee.cancelTriggerNotifications();
  await notifee.cancelAllNotifications();
}


// ========================== //
// EVENT HANDLERS
// ========================== //
/**
 * Shared handler logic. When the user dismisses the alarm — by tapping
 * the body, the Dismiss action, or swiping when permitted — we cancel
 * the displayed notification, which stops the looping sound.
 *
 * Without this, `loopSound: true` will keep ringing until the trigger
 * timeout, even after the user interacts with it.
 */
async function handleAlarmEvent({ type, detail }: Event): Promise<void> {
  const notificationId = detail.notification?.id;
  if (!notificationId) return;

  switch (type) {
    case EventType.ACTION_PRESS:
    case EventType.PRESS:
    case EventType.DISMISSED:
      // Stops the looping sound and removes from the shade.
      await notifee.cancelDisplayedNotification(notificationId);
      break;
    default:
      break;
  }
}

/**
 * Foreground handler — register inside App via useEffect.
 * Returns the unsubscribe function notifee gives us.
 */
export function registerForegroundHandler(): () => void {
  return notifee.onForegroundEvent(handleAlarmEvent);
}

/**
 * Background handler — register at the top of index.js BEFORE
 * AppRegistry.registerComponent so the OS can wake JS even if the app
 * was force-closed.
 */
export function onBackgroundEvent(): (event: Event) => Promise<void> {
  return handleAlarmEvent;
}
