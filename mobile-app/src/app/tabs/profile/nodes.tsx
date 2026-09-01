import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToUserHomeLinks } from "@/services/homes";
import {
  renameNode,
  subscribeToNodesForHome,
  type FirestoreNode,
} from "@/services/nodes";
import { colors } from "@/theme/colors";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function NodesScreen() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<FirestoreNode[]>([]);
  const [hid, setHid] = useState<string | null>(null);

  // Local state to track modified nicknames before saving
  const [nodeNames, setNodeNames] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserHomeLinks(user.uid, (links) => {
      setHid(links[0]?.hid ?? null);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!hid) {
      setNodes([]);
      setNodeNames({});
      return;
    }

    const unsubscribe = subscribeToNodesForHome(hid, (fetchedNodes) => {
      setNodes(fetchedNodes);

      // Initialize local input values with fetched node names
      const initialNames: Record<string, string> = {};
      fetchedNodes.forEach((node) => {
        const id = node.nodeId || node.id;
        if (id) {
          initialNames[id] = node.nickname || "";
        }
      });
      setNodeNames(initialNames);
    });

    return unsubscribe;
  }, [hid]);

  const handleNameChange = (nodeKey: string, text: string) => {
    setNodeNames((prev) => ({
      ...prev,
      [nodeKey]: text,
    }));
  };

  const handleSaveChanges = async () => {
    if (!hid) return;

    setIsSaving(true);
    try {
      const updatePromises = nodes.map(async (node) => {
        const key = node.nodeId || node.id;
        if (!key) return;

        const currentName = node.nickname ?? "";
        const updatedName = (nodeNames[key] ?? "").trim();

        // Only issue a write request if the nickname has actually changed
        if (updatedName && updatedName !== currentName) {
          await renameNode(hid, node.nodeId, updatedName);
        }
      });

      await Promise.all(updatePromises);
      Alert.alert("Success", "Node configurations updated successfully.");
    } catch (error) {
      console.error("Failed to rename nodes:", error);
      Alert.alert("Error", "Could not save node changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNode = () => {
    // TODO: wire into BLE/SoftAP provisioning flow
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader title="Configure nodes" />

      {/* Nodes Section */}
      <View style={styles.section}>

        {nodes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No connected nodes found</Text>
          </View>
        ) : (
          <View style={styles.nodesList}>
            {nodes.map((node, index) => {
              const nodeKey = node.nodeId || node.id || String(index);

              return (
                <View key={nodeKey} style={styles.nodeCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.inputLabel}>Name</Text>
                    {node.role ? (
                      <Text style={styles.roleTag}>{node.role}</Text>
                    ) : null}
                  </View>

                  <TextInput
                    style={styles.input}
                    value={nodeNames[nodeKey] ?? ""}
                    onChangeText={(text) => handleNameChange(nodeKey, text)}
                    placeholder="Enter node name"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionGroup}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveChanges}
          disabled={isSaving || nodes.length === 0}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.base} />
          ) : (
            <Text style={styles.saveButtonText}>Save changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddNode}
          activeOpacity={0.7}
        >
          <Text style={styles.addButtonText}>Add new node</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  nodesList: {
    gap: 12,
  },
  nodeCard: {
    backgroundColor: colors.bgSecondary1,
    borderColor: colors.bgSecondary2,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  inputLabel: {
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 12,
    color: colors.textMuted,
  },
  roleTag: {
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 12,
    color: colors.textMuted,
  },
  input: {
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 16,
    color: colors.text,
    paddingVertical: 6,
  },
  emptyCard: {
    backgroundColor: colors.bgSecondary1,
    borderColor: colors.bgSecondary2,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 14,
    color: colors.textMuted,
  },
  actionGroup: {
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    alignSelf: "center",
    width: "100%",
    height: 48,
    backgroundColor: colors.accent,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12
  },
  saveButtonText: {
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 16,
    color: colors.base,
  },
  addButton: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.base,
    borderColor: colors.bgSecondary2,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 14,
    color: colors.textMuted,
  },
});