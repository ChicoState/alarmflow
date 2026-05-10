import notifee, { TriggerType, EventType } from '@notifee/react-native';
import { Alert, AlertButton } from 'react-native';
import {
  scheduleAlarmSet,
  showAlertAsync,
  onBackgroundEvent,
} from '../AlarmScheduler';

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createTriggerNotification: jest.fn(),
    cancelDisplayedNotification: jest.fn(),
  },
  TriggerType: {
    TIMESTAMP: 'timestamp',
  },
  AndroidImportance: {
    HIGH: 'high',
  },
  AndroidCategory: {
    ALARM: 'alarm',
  },
  AndroidVisibility: {
    PUBLIC: 'public',
  },
  EventType: {
    ACTION_PRESS: 'action_press',
    PRESS: 'press',
    DISMISSED: 'dismissed',
    DELIVERED: 'delivered',
    TRIGGER_NOTIFICATION_CREATED: 'trigger_notification_created',
  },
}));

// ============================================================ //
// scheduleAlarmSet
// ============================================================ //
describe('scheduleAlarmSet', () => {
  const createTriggerNotification = notifee.createTriggerNotification as jest.Mock;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-01-01T08:00:00.000Z').getTime());
    // Sequential id generator that scales to any number of scheduled alarms,
    // unlike chained mockResolvedValueOnce which has to match exactly.
    let counter = 0;
    createTriggerNotification.mockImplementation(async () => {
      counter += 1;
      return `notification-${counter}`;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    createTriggerNotification.mockReset();
  });

  it('schedules one trigger notification for each future interval', async () => {
    const startDate = new Date('2026-01-01T08:01:00.000Z');
    const endDate = new Date('2026-01-01T08:03:00.000Z');

    const result = await scheduleAlarmSet(startDate, endDate, 1);

    expect(result).toEqual({
      count: 3,
      notificationIds: ['notification-1', 'notification-2', 'notification-3'],
    });
    expect(createTriggerNotification).toHaveBeenCalledTimes(3);
    expect(createTriggerNotification.mock.calls.map(([, trigger]) => trigger)).toEqual([
      {
        type: TriggerType.TIMESTAMP,
        timestamp: new Date('2026-01-01T08:01:00.000Z').getTime(),
        alarmManager: { allowWhileIdle: true },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: new Date('2026-01-01T08:02:00.000Z').getTime(),
        alarmManager: { allowWhileIdle: true },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: new Date('2026-01-01T08:03:00.000Z').getTime(),
        alarmManager: { allowWhileIdle: true },
      },
    ]);
    expect(createTriggerNotification.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        title: 'Alarm Flow',
        android: expect.objectContaining({
          channelId: 'alarm_channel',
          loopSound: true,
          actions: [
            {
              title: 'Dismiss',
              pressAction: { id: 'dismiss_alarm' },
            },
          ],
        }),
      }),
    );
  });

  it('skips intervals that are in the past but schedules later ones', async () => {
    // "now" is 08:00:00. Start at 07:58 (past), end at 08:02 (future).
    // Expected fires at 07:58, 07:59, 08:00, 08:01, 08:02.
    // Of those, only times STRICTLY > now should schedule: 08:01, 08:02.
    // (08:00:00 equals now, and the impl uses `> now`, so it's skipped.)
    const startDate = new Date('2026-01-01T07:58:00.000Z');
    const endDate = new Date('2026-01-01T08:02:00.000Z');

    const result = await scheduleAlarmSet(startDate, endDate, 1);

    expect(result.count).toBe(2);
    expect(result.notificationIds).toEqual(['notification-1', 'notification-2']);
    expect(createTriggerNotification).toHaveBeenCalledTimes(2);
    expect(createTriggerNotification.mock.calls.map(([, t]) => t.timestamp)).toEqual([
      new Date('2026-01-01T08:01:00.000Z').getTime(),
      new Date('2026-01-01T08:02:00.000Z').getTime(),
    ]);
  });

  it('schedules nothing when the entire range is in the past', async () => {
    const startDate = new Date('2026-01-01T07:50:00.000Z');
    const endDate = new Date('2026-01-01T07:55:00.000Z');

    const result = await scheduleAlarmSet(startDate, endDate, 1);

    expect(result).toEqual({ count: 0, notificationIds: [] });
    expect(createTriggerNotification).not.toHaveBeenCalled();
  });

  it('schedules a single alarm when start equals end and is in the future', async () => {
    const date = new Date('2026-01-01T08:05:00.000Z');

    const result = await scheduleAlarmSet(date, date, 5);

    expect(result.count).toBe(1);
    expect(createTriggerNotification).toHaveBeenCalledTimes(1);
    expect(createTriggerNotification.mock.calls[0][1].timestamp).toBe(date.getTime());
  });

  it('honors interval larger than the range (only the start fires)', async () => {
    // 5-minute interval inside a 2-minute window: just the start.
    const startDate = new Date('2026-01-01T08:01:00.000Z');
    const endDate = new Date('2026-01-01T08:03:00.000Z');

    const result = await scheduleAlarmSet(startDate, endDate, 5);

    expect(result.count).toBe(1);
    expect(createTriggerNotification).toHaveBeenCalledTimes(1);
    expect(createTriggerNotification.mock.calls[0][1].timestamp).toBe(startDate.getTime());
  });

  it('numbers alarm bodies by absolute index, not by scheduled count', async () => {
    // When some intervals are skipped because they're in the past, the
    // user-visible "Alarm #N" should still reflect the alarm's position
    // in the original sequence, not its position among scheduled ones.
    //
    // Range 07:59 → 08:02 at 1m interval, now=08:00:00:
    //   index 0 (07:59) — past, skipped
    //   index 1 (08:00) — equals now, skipped
    //   index 2 (08:01) — scheduled, body should say "Alarm #3"
    //   index 3 (08:02) — scheduled, body should say "Alarm #4"
    const startDate = new Date('2026-01-01T07:59:00.000Z');
    const endDate = new Date('2026-01-01T08:02:00.000Z');

    await scheduleAlarmSet(startDate, endDate, 1);

    expect(createTriggerNotification).toHaveBeenCalledTimes(2);
    const bodies = createTriggerNotification.mock.calls.map(([n]) => n.body as string);
    expect(bodies[0]).toMatch(/^Alarm #3 — /);
    expect(bodies[1]).toMatch(/^Alarm #4 — /);
  });

  it('configures each notification with full alarm-style payload', async () => {
    const startDate = new Date('2026-01-01T08:05:00.000Z');
    await scheduleAlarmSet(startDate, startDate, 1);

    const [notification] = createTriggerNotification.mock.calls[0];
    expect(notification.android).toEqual(
      expect.objectContaining({
        channelId: 'alarm_channel',
        importance: 'high',
        category: 'alarm',
        visibility: 'public',
        sound: 'default',
        loopSound: true,
        ongoing: true,
        autoCancel: false,
        fullScreenAction: { id: 'default' },
        pressAction: { id: 'default' },
      }),
    );
    expect(notification.android.vibrationPattern).toEqual([
      300, 500, 300, 500, 300, 500, 300, 500,
    ]);
  });
});

// ============================================================ //
// showAlertAsync
// ============================================================ //
describe('showAlertAsync', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('forwards title, message, and buttons to Alert.alert', async () => {
    const buttons: AlertButton[] = [
      { text: 'OK', onPress: jest.fn() },
      { text: 'Cancel', style: 'cancel' },
    ];

    // Don't await — Alert.alert is mocked to no-op, so the promise will
    // only settle when we manually invoke a wrapped onPress / onDismiss.
    const promise = showAlertAsync('Title', 'Message body', buttons);

    expect(alertSpy).toHaveBeenCalledTimes(1);
    const [title, message, wrappedButtons, options] = alertSpy.mock.calls[0];
    expect(title).toBe('Title');
    expect(message).toBe('Message body');
    expect(wrappedButtons).toHaveLength(2);
    expect(options).toEqual({ cancelable: true, onDismiss: expect.any(Function) });

    // Resolve so the test doesn't leave a dangling promise.
    options.onDismiss();
    await promise;
  });

  it('resolves the promise when a button is pressed', async () => {
    const onPress = jest.fn();
    const promise = showAlertAsync('T', 'M', [{ text: 'OK', onPress }]);

    const wrappedButtons = alertSpy.mock.calls[0][2] as AlertButton[];
    wrappedButtons[0].onPress?.('value');

    await expect(promise).resolves.toBeUndefined();
    expect(onPress).toHaveBeenCalledWith('value');
  });

  it('resolves the promise when the alert is dismissed without a button press', async () => {
    const promise = showAlertAsync('T', 'M', [{ text: 'OK' }]);

    const options = alertSpy.mock.calls[0][3];
    options.onDismiss();

    await expect(promise).resolves.toBeUndefined();
  });

  it('still resolves even if a button onPress throws', async () => {
    const onPress = jest.fn(() => {
      throw new Error('boom');
    });
    const promise = showAlertAsync('T', 'M', [{ text: 'OK', onPress }]);

    const wrappedButtons = alertSpy.mock.calls[0][2] as AlertButton[];
    // The wrapper uses try/finally, so the throw propagates out of the
    // button callback BUT the promise still settles.
    expect(() => wrappedButtons[0].onPress?.()).toThrow('boom');

    await expect(promise).resolves.toBeUndefined();
  });

  it('serializes concurrent calls so only one alert shows at a time', async () => {
    const firstButtons: AlertButton[] = [{ text: 'A' }];
    const secondButtons: AlertButton[] = [{ text: 'B' }];
    const thirdButtons: AlertButton[] = [{ text: 'C' }];

    const p1 = showAlertAsync('First', 'msg1', firstButtons);
    const p2 = showAlertAsync('Second', 'msg2', secondButtons);
    const p3 = showAlertAsync('Third', 'msg3', thirdButtons);

    // Only the first should have actually invoked Alert.alert. The
    // others are queued behind it.
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toBe('First');

    // Settle the first → second should now appear.
    alertSpy.mock.calls[0][3].onDismiss();
    await p1;
    expect(alertSpy).toHaveBeenCalledTimes(2);
    expect(alertSpy.mock.calls[1][0]).toBe('Second');

    // Settle the second → third should now appear.
    alertSpy.mock.calls[1][3].onDismiss();
    await p2;
    expect(alertSpy).toHaveBeenCalledTimes(3);
    expect(alertSpy.mock.calls[2][0]).toBe('Third');

    alertSpy.mock.calls[2][3].onDismiss();
    await p3;
  });
});

// ============================================================ //
// handleAlarmEvent (via onBackgroundEvent)
// ============================================================ //
describe('alarm event handler', () => {
  const cancelDisplayedNotification = notifee.cancelDisplayedNotification as jest.Mock;
  const handler = onBackgroundEvent();

  beforeEach(() => {
    cancelDisplayedNotification.mockReset();
    cancelDisplayedNotification.mockResolvedValue(undefined);
  });

  it('cancels the displayed notification on ACTION_PRESS', async () => {
    await handler({
      type: EventType.ACTION_PRESS,
      detail: { notification: { id: 'abc' } },
    } as any);

    expect(cancelDisplayedNotification).toHaveBeenCalledTimes(1);
    expect(cancelDisplayedNotification).toHaveBeenCalledWith('abc');
  });

  it('cancels the displayed notification on PRESS', async () => {
    await handler({
      type: EventType.PRESS,
      detail: { notification: { id: 'xyz' } },
    } as any);

    expect(cancelDisplayedNotification).toHaveBeenCalledWith('xyz');
  });

  it('cancels the displayed notification on DISMISSED', async () => {
    await handler({
      type: EventType.DISMISSED,
      detail: { notification: { id: 'def' } },
    } as any);

    expect(cancelDisplayedNotification).toHaveBeenCalledWith('def');
  });

  it('ignores events for other types', async () => {
    await handler({
      type: (EventType as any).DELIVERED,
      detail: { notification: { id: 'ghi' } },
    } as any);
    await handler({
      type: (EventType as any).TRIGGER_NOTIFICATION_CREATED,
      detail: { notification: { id: 'jkl' } },
    } as any);

    expect(cancelDisplayedNotification).not.toHaveBeenCalled();
  });

  it('does nothing when the event has no notification id', async () => {
    await handler({
      type: EventType.PRESS,
      detail: {},
    } as any);
    await handler({
      type: EventType.PRESS,
      detail: { notification: {} },
    } as any);

    expect(cancelDisplayedNotification).not.toHaveBeenCalled();
  });
});