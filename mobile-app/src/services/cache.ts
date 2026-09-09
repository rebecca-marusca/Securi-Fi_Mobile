import { doc, getDoc, getFirestore, onSnapshot, updateDoc } from '@react-native-firebase/firestore';
import type { CacheEntry } from '@/types/firestore';

// One-time: ask the server to dump its in-memory cache into Firestore,
// then read it once to seed the local rolling window. Only needed when
// there's an active event and you don't already have a live window going.
export async function bootstrapLiveCache(hid: string): Promise<CacheEntry[]> {
  const firestore = getFirestore();
  await updateDoc(doc(firestore, 'homes', hid), { requestedCache: true });

  // Server clears requestedCache back to false once it's dumped — poll
  // briefly for that, since there's no other completion signal.
  const cacheRef = doc(firestore, 'cache', hid);
  for (let attempt = 0; attempt < 10; attempt++) {
    const snap = await getDoc(cacheRef);
    const data = snap.data();
    if (data?.packages) return data.packages as CacheEntry[];
    await new Promise((r) => setTimeout(r, 200));
  }
  return [];
}

// Ongoing: listen only to the home doc's lastPackage field — cheap,
// fires once per real package instead of re-reading the whole array.
export function subscribeToLastPackage(
  hid: string,
  callback: (pkg: CacheEntry) => void
) {
  const firestore = getFirestore();
  return onSnapshot(
    doc(firestore, 'homes', hid),
    (snap) => {
      const lastPackage = snap.data()?.lastPackage;
      if (lastPackage) callback(lastPackage as CacheEntry);
    },
    (error) => console.error('[last package] listener error:', error)
  );
}