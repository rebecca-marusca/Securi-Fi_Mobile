
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToUserHomeLinks } from "@/services/homes";
import {
  renameNode,
  subscribeToNodesForHome,
  type FirestoreNode,
} from "@/services/nodes";
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

function ArmedBadge({
  armed,
  requestedArmed,
}: {
  armed: boolean;
  requestedArmed: boolean;
}) {
  const isPending = armed !== requestedArmed;

  let label: string;
  let bg: string;

  if (isPending) {
    label = requestedArmed ? "Arming..." : "Disarming...";
    bg = colors.intermediate;
  } else if (armed) {
    label = "Armed";
    bg = colors.accent;
  } else {
    label = "Disarmed";
    bg = colors.black;
  }

  return (
    <View style={[badgeStyles.badge, { backgroundColor: bg }]}>
      <Text style={badgeStyles.text}>{label}</Text>
    </View>
  );
}

function WarningDots({
  warnings,
}: {
  warnings: FirestoreNode["warnings"] | undefined;
}) {
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader title="Configure nodes" />

      <View style={styles.card}>
        {nodes.map((node, index) => (
          <View
            key={node.nodeId || node.id || index}
            style={[
              styles.row,
              index === nodes.length - 1 && styles.lastRow,
            ]}
          >
            <View style={styles.nodeInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.nodeName}>{node.nickname}</Text>
                <Text style={styles.roleTag}>{node.role}</Text>
              </View>

              <WarningDots warnings={node.warnings} />
            </View>

            <View style={styles.rightCol}>
              <ArmedBadge
                armed={node.armed}
                requestedArmed={node.requestedArmed}
              />

              <TouchableOpacity
                onPress={() => handleRename(node)}
                style={styles.renameBtn}
              >
                <SymbolView
                  name="pencil.line"
                  size={22}
                  tintColor={colors.accent}
                />
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
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  text: {
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 12,
    color: colors.base,
  },
  warningRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 5,
  },
  warningBadge: {
    backgroundColor: "#FFC107",
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  warningText: {
    fontFamily: "SF-Pro-Text-Regular",
    fontSize: 11,
    color: "#333",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
    paddingTop: 60,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    marginTop: 24,
    backgroundColor: colors.bgSecondary1,
    borderColor: colors.bgSecondary2,
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 18,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.text,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  nodeInfo: {
    flex: 1,
    marginRight: 13,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 9,
  },
  nodeName: {
    fontFamily: "SF-Pro-Text-Regular",
    fontSize: 17,
    color: colors.text,
  },
  roleTag: {
    fontFamily: "SF-Pro-Text-Regular",
    fontSize: 12,
    color: colors.textMuted,
  },
  rightCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  renameBtn: {
    padding: 5,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 33,
    width: 132,
    alignSelf: "center",
    minHeight: 52,
  },
  addButtonText: {
    color: colors.base,
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 17,
  },
});

