import { forwardRef, useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { colors } from '@/theme/colors';
import { LinearGradient } from "expo-linear-gradient";
import { FinalToggleRow } from "@/components/ToggleRow";
import { type FirestoreNode, subscribeToNodesForHome, armNode, disarmNode } from "@/services/nodes";
import { useHome } from "@/hooks/useHome";

export interface SelectedNodeData {
  id: string;
  name: string;
  isArmed?: boolean;
}

interface NodeControlSheetProps {
  selectedNode: SelectedNodeData | null;
  onRestart?: (nodeId: string) => Promise<void> | void;
  onShutdown?: (nodeId: string) => Promise<void> | void;
}

export const NodeControlSheet = forwardRef<BottomSheetModal, NodeControlSheetProps>(
  ({ selectedNode, onRestart, onShutdown }, ref) => {
    const snapPoints = useMemo(() => ['35%'], []);
    const { home, hid, isLoading } = useHome();
    const [dbNodes, setDbNodes] = useState<FirestoreNode[]>([]);
    const [optimisticArmed, setOptimisticArmed] = useState(false);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    // Subscribe to all nodes for this home to get real-time updates
    useEffect(() => {
      if (!hid) return;
      const unsub = subscribeToNodesForHome(hid, setDbNodes);
      return unsub;
    }, [hid]);

    // Derive the armed state for THIS SPECIFIC node from Firestore
    const currentNode = dbNodes.find((n) => n.id === selectedNode?.id || n.nodeId === selectedNode?.id);
    const derivedRequestedArmed = currentNode?.requestedArmed ?? false;

    // Reconcile optimisticArmed with the real Firestore value
    useEffect(() => {
      setOptimisticArmed(derivedRequestedArmed);
    }, [derivedRequestedArmed]);

    if (!selectedNode) return null;

    const handleRestart = () => {
      if (selectedNode) onRestart?.(selectedNode.id);
    };

    const handleShutdown = () => {
      if (selectedNode) onShutdown?.(selectedNode.id);
    };

    /**
     * Same pattern as home.tsx toggle:
     * 1. Show change immediately (optimisticArmed)
     * 2. Send request to server (armNode/disarmNode)
     * 3. Firestore listener updates dbNodes → derivedRequestedArmed → reconciles optimisticArmed
     * 4. Roll back on failure
     */
    const handleToggle = async (value: boolean) => {
      if (!hid || !selectedNode) return;
      setOptimisticArmed(value); // Optimistic update: show change immediately
      try {
        if (value) {
          await armNode(hid, selectedNode.id); // Arm this specific node
        } else {
          await disarmNode(hid, selectedNode.id); // Disarm this specific node
        }
        // No further action needed — subscribeToNodesForHome listener
        // will receive the updated node and reconcile optimisticArmed
      } catch (err) {
        console.error('Failed to toggle node armed state:', err);
        setOptimisticArmed(!value); // Roll back on failure
        Alert.alert('Error', 'Could not update the node state. Please try again.');
      }
    };
    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.container}>
          {/* Node Information */}
          <View style={styles.header}>
            <Text style={styles.nodeName}>{selectedNode.name}</Text>
            <View>
              
              <FinalToggleRow
                label={optimisticArmed ? "Armed" : "Disarmed"}
                value={optimisticArmed}
                onValueChange={handleToggle}
                disabled={!hid || isLoading}
              />
            </View>
          </View>

          {/* Server Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.restartButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleRestart}
            >
              <Text style={styles.restartText}>Restart</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.shutdownButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleShutdown}
            >
              <Text style={styles.shutdownText}>Shut Down</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.base,
  },
  handleIndicator: {
    backgroundColor: colors.accent,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 15,
    alignItems: 'center',
    paddingBottom: 50
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
  },
  nodeName: {
    fontSize: 22,
    fontFamily: "SF-Pro-Text-Bold",
    color: colors.accent,
    marginBottom: 10,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  statusArmed: {
    backgroundColor: colors.noMovement,
  },
  statusDisarmed: {
    backgroundColor: colors.redWave2,
    borderWidth: 1,
    borderColor: colors.redWave1,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.base,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '90%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  restartButton: {
    backgroundColor: colors.textMuted,
  },
  shutdownButton: {
    backgroundColor: colors.redWave1,
  },
  restartText: {
    fontSize: 15,
    fontFamily: "SF-Pro-Text-Bold",
    color: colors.base,
  },

  shutdownText: {
    fontSize: 15,
    fontFamily: "SF-Pro-Text-Bold",
    color: colors.base,
  },

  innerShadowGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
});