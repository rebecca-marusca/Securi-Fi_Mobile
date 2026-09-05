import {
  collection,
  getFirestore,
  onSnapshot,
  query,
  where,
} from "@react-native-firebase/firestore";
import { apiFetch } from '@/services/api';
import type { Node } from '@/types/firestore';

/** Shape as stored in Firestore — use this wherever you need the full node doc. */
export type FirestoreNode = Node & { id: string };

export function subscribeToNodesForHome(
  hid: string,
  onChange: (nodes: FirestoreNode[]) => void
) {
  const q = query(collection(getFirestore(), 'nodes'), where('hid', '==', hid));
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreNode))),
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

export async function armNode(hid: string, nodeId: string) {
  const response = await apiFetch(`/nodes/${hid}/${nodeId}/arm`, { method: 'POST' });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail ?? 'Failed to arm node');
  }
  return response.json();
}

export async function disarmNode(hid: string, nodeId: string) {
  const response = await apiFetch(`/nodes/${hid}/${nodeId}/disarm`, { method: 'POST' });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail ?? 'Failed to disarm node');
  }
  return response.json();
}

async function requestNodeAction(hid: string, nodeId: string, action: 'restart' | 'shutdown') {
  const response = await apiFetch(`/nodes/${hid}/${nodeId}/${action}`, { method: 'POST' });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail ?? `Failed to request node ${action}`);
  }
  return response.json();
}

export function restartNode(hid: string, nodeId: string) {
  return requestNodeAction(hid, nodeId, 'restart');
}

export function shutdownNode(hid: string, nodeId: string) {
  return requestNodeAction(hid, nodeId, 'shutdown');
}
