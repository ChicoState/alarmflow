import notifee, {
  TriggerType,
  TimestampTrigger,
  AndroidImportance,
  AndroidCategory,
  EventType,
  Event,
} from '@notifee/react-native';
import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';

// ========================== //
// CONSTANTS
// ========================== //
const CHANNEL_ID = 'alarm_channel';
const CHANNEL_NAME = 'Alarm Notifications';

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
// CHANNEL SETUP
// ========================== //
/**
 * Creates the Android notification channel with alarm-level importance.
 * Must be called once before scheduling any notifications.
 */
export async function createAlarmChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: CHANNEL_NAME,
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });
}


// ========================== //
// PERMISSIONS
// ========================== //
/**
 * Requests all permissions needed for reliable alarm delivery:
 *  - Notification permission (Android 13+)
 *  - Exact alarm permission (Android 12+)
 *  - Battery optimization exemption (prevents doze from killing triggers)
 *
 * Returns true only if ALL required permissions are granted.
 */
export async function requestAlarmPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  // 1. POST_NOTIFICATIONS (Android 13+ / API 33+)
  if (Platform.Version >= 33) {
    const notifPerm = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (notifPerm !== PermissionsAndroid.RESULTS.GRANTED) {
      Alert.alert(
        'Notification Permission Required',
        'Alarm Flow needs notification permission to alert you. Please enable it in Settings.',
        [
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return false;
    }
  }

  // 2. SCHEDULE_EXACT_ALARM (Android 12+ / API 31+)
  if (Platform.Version >= 31) {
    const exactAlarmSettings = await notifee.getNotificationSettings();
    // android.alarm is 1 when allowed, 2 when denied
    if (exactAlarmSettings.android.alarm !== 1) {
      Alert.alert(
        'Exact Alarm Permission Required',
        'Alarm Flow needs the "Alarms & reminders" permission to fire alarms on time.',
        [
          {
            text: 'Open Settings',
            onPress: () => notifee.openAlarmPermissionSettings(),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return false;
    }
  }

  // 3. Battery optimization exemption
  const batteryOptimized = await notifee.isBatteryOptimizationEnabled();
  if (batteryOptimized) {
    Alert.alert(
      'Battery Optimization',
      'For reliable alarms, please disable battery optimization for Alarm Flow.',
      [
        {
          text: 'Open Settings',
          onPress: () => notifee.openBatteryOptimizationSettings(),
        },
        { text: 'Skip', style: 'cancel' },
      ]
    );
    // Not a hard block — alarms may still work, just less reliably
  }

  return true;
}


// ========================== //
// SCHEDULING
// ========================== //
/**
 * Schedules OS-level trigger notifications for every alarm in a set.
 * Each alarm becomes an independent Notifee TimestampTrigger that fires
 * even when the app is closed or the screen is locked.
 *
 * Returns the array of notification IDs so they can be stored with the AlarmSet.
 */
export async function scheduleAlarmSet(
  startDate: Date,
  endDate: Date,
  intervalMinutes: number
): Promise<{ count: number; notificationIds: string[] }> {
  const intervalMs = intervalMinutes * 60 * 1000;
  const notificationIds: string[] = [];
  let current = new Date(startDate);
  const now = Date.now();

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
            sound: 'default',
            fullScreenAction: { id: 'default' }, // wake screen
            pressAction: { id: 'default' },
          },
        },
        trigger
      );

      notificationIds.push(id);
    }

    index++;
    current = new Date(current.getTime() + intervalMs);
  }

  return { count: index, notificationIds };
}


// ========================== //
// CANCELLATION
// ========================== //
/**
 * Cancels all scheduled trigger notifications for a given alarm set.
 */
export async function cancelAlarmSet(notificationIds: string[]): Promise<void> {
  for (const id of notificationIds) {
    await notifee.cancelTriggerNotification(id);
  }
}

/**
 * Cancels every trigger notification managed by Notifee.
 */
export async function cancelAllAlarms(): Promise<void> {
  await notifee.cancelTriggerNotifications();
}


// ========================== //
// BACKGROUND EVENT HANDLER
// ========================== //
/**
 * Must be registered at the top level (index.js) so the OS can
 * deliver events even when the JS runtime has been killed.
 */
export function onBackgroundEvent(): (event: Event) => Promise<void> {
  return async ({ type, detail }: Event) => {
    // When user dismisses or presses the notification, clean up
    if (
      type === EventType.DISMISSED ||
      type === EventType.PRESS
    ) {
      if (detail.notification?.id) {
        await notifee.cancelNotification(detail.notification.id);
      }
    }
  };
}
