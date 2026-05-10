import notifee, { TriggerType } from '@notifee/react-native';
import { scheduleAlarmSet } from '../AlarmScheduler';

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createTriggerNotification: jest.fn(),
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
  },
}));

describe('scheduleAlarmSet', () => {
  const createTriggerNotification = notifee.createTriggerNotification as jest.Mock;

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-01-01T08:00:00.000Z').getTime());
    createTriggerNotification
      .mockResolvedValueOnce('notification-1')
      .mockResolvedValueOnce('notification-2')
      .mockResolvedValueOnce('notification-3');
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
});
