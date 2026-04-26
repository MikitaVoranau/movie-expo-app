import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const NOTIF_ENABLED_KEY = 'notifications_enabled';
const NOTIF_HOUR_KEY = 'notifications_hour';
const NOTIF_IDENTIFIER = 'watchlist_weekly_reminder';

export const DEFAULT_NOTIF_HOUR = 19; 

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getNotificationsEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(NOTIF_ENABLED_KEY);
  return val === 'true';
}

export async function getNotificationHour(): Promise<number> {
  const val = await AsyncStorage.getItem(NOTIF_HOUR_KEY);
  return val ? parseInt(val, 10) : DEFAULT_NOTIF_HOUR;
}

export async function scheduleWeeklyReminder(hour: number, title: string, body: string): Promise<void> {
  
  await Notifications.cancelScheduledNotificationAsync(NOTIF_IDENTIFIER).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIF_IDENTIFIER,
    content: { title, body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 6, 
      hour,
      minute: 0,
    },
  });
}

export async function cancelWeeklyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIF_IDENTIFIER).catch(() => {});
}

export async function setNotificationsEnabled(
  enabled: boolean,
  hour: number,
  title: string,
  body: string
): Promise<boolean> {
  await AsyncStorage.setItem(NOTIF_ENABLED_KEY, String(enabled));
  await AsyncStorage.setItem(NOTIF_HOUR_KEY, String(hour));

  if (enabled) {
    const granted = await requestNotificationPermission();
    if (!granted) {
      await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'false');
      return false;
    }
    await scheduleWeeklyReminder(hour, title, body);
  } else {
    await cancelWeeklyReminder();
  }
  return enabled;
}
