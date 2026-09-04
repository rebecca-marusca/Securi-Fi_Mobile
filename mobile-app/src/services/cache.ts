import {
  doc,
  getFirestore,
  onSnapshot,
  updateDoc,
} from '@react-native-firebase/firestore';
import type { CacheDoc, CacheEntry } from '@/types/firestore';

/**
 * Requests the server to flush its in-memory cache to cache/{hid}.
 * The server watches homes/{hid}.requestedCache and writes the full
 * 60-entry ring buffer when it is set to true, then resets it to false.
 */
export async function requestCacheForHome(hid: string): Promise<void> {
  const firestore = getFirestore();
  const homeRef = doc(firestore, 'homes', hid);
  await updateDoc(homeRef, { requestedCache: true });
}

/**
 * Subscribes to the on-demand cache document at cache/{hid}.
 * Call requestCacheForHome(hid) first to trigger the server dump.
 * Returns null until the server has written the document.
 */
export function subscribeToOnDemandCache(
  hid: string,
  callback: (packages: CacheEntry[] | null) => void
) {
  const firestore = getFirestore();
  const cacheRef = doc(firestore, 'cache', hid);

  return onSnapshot(
    cacheRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      const data = snapshot.data() as CacheDoc;
      callback(data.packages ?? null);
    },
    (error) => console.error('[cache] listener error:', error)
  );
}