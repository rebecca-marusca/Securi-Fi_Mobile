import { getMessaging, getToken } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { apiFetch } from '@/services/api';
import { Platform } from 'react-native';

export async function registerForPushNotifications() {

  if (Platform.OS === 'ios') {
    if (Platform.OS === 'ios') {
      console.log('[push] Skipping registration on iOS');
      return;
    }
  }

  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== 'granted') {
    console.log('Push notification permission denied');
    return;
  }

  const messaging = getMessaging();
  const token = await getToken(messaging);

  await apiFetch('/users/me/fcm-token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function unregisterPushNotifications() {
  if (Platform.OS === 'ios') return;
  const messaging = getMessaging();
  const token = await getToken(messaging);
  await apiFetch('/users/me/fcm-token', {
    method: 'DELETE',
    body: JSON.stringify({ token }),
  });
}