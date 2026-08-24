import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "@react-native-firebase/firestore";

export type Node = {
  id: string;
  name: string;
  room: string;
  status: "online" | "offline";
};

export function subscribeToNodesForHome(
  hid: string,
  onChange: (nodes: Node[]) => void
) {
  const q = query(collection(getFirestore(), 'nodes'), where('hid', '==', hid));
  return onSnapshot(
    q,
    (snapshot) => onChange(snapshot.docs.map((d) => d.data() as Node)),
    (error) => console.error('subscribeToNodesForHome error:', error)
  );
}

export async function renameNode(
  nodeId: string,
  newName: string,
): Promise<void> {
  await updateDoc(doc(getFirestore(), "nodes", nodeId), { name: newName });
}
