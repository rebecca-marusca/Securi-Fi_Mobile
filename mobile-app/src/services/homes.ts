import { getFirestore, collection, query, where, doc, onSnapshot } from '@react-native-firebase/firestore';
import type { Home, UserHomeLink } from '@/types/firestore';
import { apiFetch } from '@/services/api';

export function subscribeToUserHomeLinks(
  uid: string,
  onChange: (links: UserHomeLink[]) => void
) {
  const q = query(collection(getFirestore(), 'userHomeLinks'), where('uid', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => d.data() as UserHomeLink)),
    (error) => console.error('subscribeToUserHomeLinks error:', error)
  );
}

export function subscribeToHome(
  hid: string,
  onChange: (home: (Home & { hid: string }) | null) => void
) {
  const ref = doc(getFirestore(), 'homes', hid);
  return onSnapshot(
    ref,
    (snap) => onChange(snap.exists() ? { hid: snap.id, ...(snap.data() as Home) } : null),
    (error) => console.error('subscribeToHome error:', error)
  );
}

export async function armHome(hid: string) {
  const response = await apiFetch(`/homes/${hid}/arm`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to arm home');
  return response.json();
}

export async function disarmHome(hid: string) {
  const response = await apiFetch(`/homes/${hid}/disarm`, { method: 'POST' });
  if (!response.ok) throw new Error('Failed to disarm home');
  return response.json();
}