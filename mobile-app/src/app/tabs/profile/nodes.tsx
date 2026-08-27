import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToUserHomeLinks } from "@/services/homes";
import { renameNode, subscribeToNodesForHome, type FirestoreNode } from "@/services/nodes";
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

function ArmedBadge({ armed, requestedArmed }: { armed: boolean; requestedArmed: boolean }) {
  const isPending = armed !== requestedArmed;
  const label = isPending
    ? requestedArmed ? "Arming…" : "Disarming…"
    : armed ? "Armed" : "Disarmed";
  const bg = armed ? colors.accent : "#C4C4C7";
  return (
    <View style={[badgeStyles.badge, { backgroundColor: bg }]}>
      <Text style={badgeStyles.text}>{label}</Text>
    </View>
  );
}

function WarningDots({ warnings }: { warnings: FirestoreNode["warnings"] | undefined }) {
  if (!warnings) return null;
  const active = [
    warnings.lowBattery && "Low battery",
    warnings.notTransmitting && "Not transmitting",
    warnings.signalWeak && "Weak signal",
  ].filter(Boolean) as string[];
  if (active.length === 0) return null;
  return (
    <View style={badgeStyles.warningRow}>
      {active.map((w) => (
        <View key={w} style={badgeStyles.warningBadge}>
          <Text style={badgeStyles.warningText}>{w}</Text>
        </View>
      ))}
    </View>
  );
}

export default function NodesScreen() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<FirestoreNode[]>([]);
  const [hid, setHid] = useState<string | null>(null);

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
      return;
    }
    const unsubscribe = subscribeToNodesForHome(hid, setNodes);
    return unsubscribe;
  }, [hid]);

  const handleRename = (node: FirestoreNode) => {
    const nodeHid = node.hid;
    Alert.prompt(
      "Rename node",
      undefined,
      async (newName) => {
        if (newName && newName.trim() && nodeHid) {
          await renameNode(nodeHid, node.nodeId, newName.trim());
        }
      },
      "plain-text",
      node.nickname,
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
            key={node.nodeId || node.id || index}
            style={[styles.row, index === nodes.length - 1 && styles.lastRow]}
          >
            <View style={styles.nodeInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.nodeName}>{node.nickname}</Text>
                <Text style={styles.roleTag}>{node.role}</Text>
              </View>
              <WarningDots warnings={node.warnings} />
            </View>
            <View style={styles.rightCol}>
              <ArmedBadge armed={node.armed} requestedArmed={node.requestedArmed} />
              <TouchableOpacity onPress={() => handleRename(node)} style={styles.renameBtn}>
                <SymbolView name="pencil" size={18} tintColor={colors.accent} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAddNode}>
        <Text style={styles.addButtonText}>Add node</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 11,
    color: colors.base,
  },
  warningRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  warningBadge: {
    backgroundColor: "#FFC107",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  warningText: {
    fontFamily: "SF-Pro-Text-Regular",
    fontSize: 10,
    color: "#333",
  },
});

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
  nodeInfo: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nodeName: {
    fontFamily: "SF-Pro-Text-Regular",
    fontSize: 16,
    color: colors.text,
  },
  roleTag: {
    fontFamily: "SF-Pro-Text-Regular",
    fontSize: 11,
    color: colors.textMuted,
  },
  rightCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  renameBtn: {
    padding: 4,
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

