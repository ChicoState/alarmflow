jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn(() => Promise.resolve()),
    createTriggerNotification: jest.fn(() => Promise.resolve('notification-id')),
    cancelTriggerNotification: jest.fn(() => Promise.resolve()),
    cancelDisplayedNotification: jest.fn(() => Promise.resolve()),
    cancelTriggerNotifications: jest.fn(() => Promise.resolve()),
    cancelAllNotifications: jest.fn(() => Promise.resolve()),
    getNotificationSettings: jest.fn(() =>
      Promise.resolve({ android: { alarm: 1 } })
    ),
    isBatteryOptimizationEnabled: jest.fn(() => Promise.resolve(false)),
    openAlarmPermissionSettings: jest.fn(),
    openBatteryOptimizationSettings: jest.fn(),
    onForegroundEvent: jest.fn(() => jest.fn()),
    onBackgroundEvent: jest.fn(),
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
