import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/contexts/AuthContext";
import { renameNode, subscribeToUserNodes, type Node } from "@/services/nodes";
import { colors } from "@/theme/colors";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function NodesScreen() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<Node[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserNodes(user.uid, setNodes);
    return unsubscribe;
  }, [user]);

  const handleRename = (node: Node) => {
    Alert.prompt(
      "Rename node",
      undefined,
      async (newName) => {
        if (newName && newName.trim()) {
          await renameNode(node.id, newName.trim());
        }
      },
      "plain-text",
      node.name,
    );
  };

  const handleAddNode = () => {
    // TODO: wire into BLE/SoftAP provisioning flow
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Configure nodes" />

      <View style={styles.card}>
        {nodes.map((node, index) => (
          <View
            key={node.id}
            style={[styles.row, index === nodes.length - 1 && styles.lastRow]}
          >
            <Text style={styles.nodeName}>{node.name}</Text>
            <TouchableOpacity onPress={() => handleRename(node)}>
              <SymbolView name="pencil" size={18} tintColor={colors.accent} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAddNode}>
        <Text style={styles.addButtonText}>Add node</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.base, paddingTop: 60 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e5df",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  nodeName: {
    fontFamily: "SF-Pro-Text-Regular",
    fontSize: 16,
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    width: 120,
    alignSelf: "center",
    minHeight: 48,
  },
  addButtonText: {
    color: colors.base,
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 16,
  },
});
