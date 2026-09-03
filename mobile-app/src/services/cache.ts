import { doc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';

export function subscribeToHomeCache(
  hid: string,
  callback: (packages: import('@/types/firestore').ChunkPackage[]) => void
) {
  const firestore = getFirestore();
  const cacheRef = doc(firestore, 'cache', hid);

  return onSnapshot(
    cacheRef,
    (snapshot) => {
      const data = snapshot.data();
      callback((data?.packages as any[]) ?? []);
    },
    (error) => console.error('[home cache] listener error:', error)
  );
}