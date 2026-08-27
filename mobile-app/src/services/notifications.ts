import {
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  requestPermission,
} from '@react-native-firebase/messaging';
import { apiFetch } from '@/services/api';
import { PermissionsAndroid, Platform } from 'react-native';

export async function registerForPushNotifications() {
  if (Platform.OS === 'ios') {
    console.log('[push] Skipping registration on iOS');
    return;
  }

  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Push notification permission denied');
      return;
    }
  }

  try {
    const messaging = getMessaging();
    await requestPermission(messaging);
    const token = await getToken(messaging);

    if (token) {
      await apiFetch('/users/me/fcm-token', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    }
  } catch (error) {
    console.warn('[push] Error registering push notifications:', error);
  }
}

export async function unregisterPushNotifications() {
  if (Platform.OS === 'ios') return;
  try {
    const messaging = getMessaging();
    const token = await getToken(messaging);
    if (token) {
      await apiFetch('/users/me/fcm-token', {
        method: 'DELETE',
        body: JSON.stringify({ token }),
      });
    }
  } catch (error) {
    console.warn('[push] Error unregistering push notifications:', error);
  }
}

/**
 * Listens for push notifications received while the app is in the foreground (Android).
 */
export function onForegroundNotification(callback: (message: any) => void) {
  if (Platform.OS === 'ios') return () => {};
  try {
    const messaging = getMessaging();
    return onMessage(messaging, callback);
  } catch (error) {
    console.warn('[push] Error setting up foreground notification listener:', error);
    return () => {};
  }
}

/**
 * Listens for notification interaction when the app is opened from background (Android).
 */
export function onNotificationOpened(callback: (message: any) => void) {
  if (Platform.OS === 'ios') return () => {};
  try {
    const messaging = getMessaging();
    return onNotificationOpenedApp(messaging, callback);
  } catch (error) {
    console.warn('[push] Error setting up notification opened listener:', error);
    return () => {};
  }
}

/**
 * Checks if the app was launched by tapping a notification from a quit state (Android).
 */
export async function getInitialPushNotification() {
  if (Platform.OS === 'ios') return null;
  try {
    const messaging = getMessaging();
    return await getInitialNotification(messaging);
  } catch (error) {
    console.warn('[push] Error getting initial notification:', error);
    return null;
  }
}