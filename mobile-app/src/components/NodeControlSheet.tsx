import { forwardRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { colors } from '@/theme/colors';
import { LinearGradient } from "expo-linear-gradient";

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

    if (!selectedNode) return null;

    const handleRestart = () => {
      if (selectedNode) onRestart?.(selectedNode.id);
    };

    const handleShutdown = () => {
      if (selectedNode) onShutdown?.(selectedNode.id);
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
            <View
              style={[
                styles.statusBadge,
                selectedNode.isArmed ? styles.statusArmed : styles.statusDisarmed,
              ]}
            >
              <LinearGradient
                colors={["rgba(5, 33, 2, 0.15)", "transparent"]}
                style={styles.innerShadowGradient}
              />
              <Text style={styles.statusText}>
                <LinearGradient
                  colors={["rgba(5, 33, 2, 0.25)", "transparent"]}
                  style={styles.innerShadowGradient}
                />
                {selectedNode.isArmed ? 'ARMED' : 'DISARMED'}
              </Text>
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
              <LinearGradient
                colors={["rgba(5, 36, 7, 0.14)", "transparent"]}
                style={styles.innerShadowGradient}
                pointerEvents="none"
              />
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
              <LinearGradient
                colors={["rgba(33, 2, 2, 0.13)", "transparent"]}
                style={styles.innerShadowGradient}
                pointerEvents="none"
              />
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
    paddingTop:15,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  nodeName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.accent,
    textDecorationLine: 'underline',
    marginBottom: 15,
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
    width: '100%',
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
    backgroundColor: colors.bgSecondary2,
  },
  shutdownButton: {
    backgroundColor: colors.redWave3,
  },
  restartText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent,
  },
  shutdownText: {
    fontSize: 15,
    fontWeight: '600',
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