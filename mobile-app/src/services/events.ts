import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from '@react-native-firebase/firestore';
import type { SecuriFiEvent } from '@/types/firestore';
import { apiFetch } from '@/services/api';

export async function dismissEvent(eid: string, falseAlarmDescription?: string) {
  const response = await apiFetch(`/events/${eid}/dismiss`, {
    method: 'POST',
    body: JSON.stringify({ false_alarm: falseAlarmDescription ?? null }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail ?? 'Failed to dismiss event');
  }
  return response.json();
}

export function subscribeToTimeline(
  hid: string,
  callback: (events: SecuriFiEvent[]) => void
) {
  const q = query(
    collection(getFirestore(), 'events'),
    where('hid', '==', hid),
    orderBy('startedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const events = snapshot.docs.map(
        (doc) => ({ eid: doc.id, ...doc.data() } as SecuriFiEvent)
      );
      callback(events);
    },
    (error) => console.error('[timeline] listener error:', error)
  );
}