import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "@react-native-firebase/firestore";
import { apiFetch } from '@/services/api';

export type Node = {
  id: string;
  name: string;
  room: string;
  status: "online" | "offline";
};

export function subscribeToNodesForHome(
  hid: string,
  onChange: (nodes: any[]) => void
) {
  const q = query(collection(getFirestore(), 'nodes'), where('hid', '==', hid));
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (error) => console.error('subscribeToNodesForHome error:', error)
  );
}

export async function renameNode(hid: string, nodeId: string, nickname: string) {
  const response = await apiFetch(`/nodes/${hid}/${nodeId}`, {
    method: 'PATCH',
    body: JSON.stringify({ nickname }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail ?? 'Failed to rename node');
  }
  return response.json();
}
