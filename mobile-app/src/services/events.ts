import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
} from '@react-native-firebase/firestore';
import type { Chunk, SecuriFiEvent } from '@/types/firestore';
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
  callback: (events: Array<SecuriFiEvent & { chunks: Chunk[] }>) => void
) {
  const firestore = getFirestore();
  const eventsQuery = query(
    collection(firestore, 'home_events', hid, 'events'),
    orderBy('startedAt', 'desc')
  );
  const chunksByEvent = new Map<string, Chunk[]>();
  const chunkUnsubscribes = new Map<string, () => void>();
  let events: SecuriFiEvent[] = [];

  const publish = () => {
    callback(events.map((event) => ({
      ...event,
      chunks: chunksByEvent.get(event.eid) ?? [],
    })));
  };

  const unsubscribeEvents = onSnapshot(
    eventsQuery,
    (snapshot) => {
      events = snapshot.docs.map(
        (doc) => ({ eid: doc.id, ...doc.data() } as SecuriFiEvent)
      );
      const eventIds = new Set(events.map((event) => event.eid));

      for (const [eid, unsubscribe] of chunkUnsubscribes) {
        if (!eventIds.has(eid)) {
          unsubscribe();
          chunkUnsubscribes.delete(eid);
          chunksByEvent.delete(eid);
        }
      }

      for (const eid of eventIds) {
        if (chunkUnsubscribes.has(eid)) continue;

        const chunksQuery = query(
          collection(firestore, 'home_events', hid, 'events', eid, 'chunks'),
          orderBy('savedAt', 'asc')
        );
        const unsubscribeChunks = onSnapshot(
          chunksQuery,
          (chunkSnapshot) => {
            chunksByEvent.set(eid, chunkSnapshot.docs.map(
              (doc) => ({ cid: doc.id, ...doc.data() } as Chunk)
            ));
            publish();
          },
          (error) => console.error(`[timeline] chunks listener error for ${eid}:`, error)
        );
        chunkUnsubscribes.set(eid, unsubscribeChunks);
      }

      publish();
    },
    (error) => console.error('[timeline] events listener error:', error)
  );

  return () => {
    unsubscribeEvents();
    for (const unsubscribe of chunkUnsubscribes.values()) unsubscribe();
    chunkUnsubscribes.clear();
  };
}

export function subscribeToEventChunks(
  hid: string,
  eid: string,
  callback: (chunks: Chunk[]) => void
) {
  const firestore = getFirestore();
  const chunksQuery = query(
    collection(firestore, 'home_events', hid, 'events', eid, 'chunks'),
    orderBy('savedAt', 'asc')
  );

  return onSnapshot(
    chunksQuery,
    (snapshot) => {
      const chunks = snapshot.docs.map(
        (doc) => ({ cid: doc.id, ...doc.data() } as Chunk)
      );
      callback(chunks);
    },
    (error) => console.error(`[event chunks] listener error for ${eid}:`, error)
  );
}