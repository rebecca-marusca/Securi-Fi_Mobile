import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import type { Cache } from '@/types/firestore';

export function subscribeToHomeCache(
  hid: string,
  callback: (cache: Cache | null) => void
) {
  const firestore = getFirestore();
  const cacheRef = doc(firestore, 'cache', hid);

  return onSnapshot(
    cacheRef,
    (snapshot) => {
      callback(snapshot.exists() ? (snapshot.data() as Cache) : null);
    },
    (error) => console.error('[home cache] listener error:', error)
  );
}