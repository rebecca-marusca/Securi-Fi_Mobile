import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent, StyleProp, ViewStyle, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

import { colors } from "@/theme/colors";
import { RoomNode } from "@/services/userProfile";
import RoomNodeItem from './RoomNodeItem';
import { NodeControlSheet, SelectedNodeData } from '../NodeControlSheet';
import { useHomeCache } from '@/hooks/useHomeCache';

export interface RoomNodeWithColor extends RoomNode {
  color?: string;
  isArmed?: boolean;
}

interface RoomNodeMapProps {
  initialNodes?: RoomNodeWithColor[];
  hid?: string | null;
  style?: StyleProp<ViewStyle>;
  isEmergency?: boolean;
}

const STORAGE_KEY = '@room_nodes_positions_v1';

export const RoomNodeMap: React.FC<RoomNodeMapProps> = ({
  initialNodes = [],
  hid,
  style,
  isEmergency = false,
}) => {
  const [nodes, setNodes] = useState<RoomNodeWithColor[]>([]);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  
  const [selectedNode, setSelectedNode] = useState<SelectedNodeData | null>(null);
  const sheetRef = useRef<BottomSheetModal>(null);
  const { cache } = useHomeCache(hid);

  const activeEditMode = !isEmergency && editMode;

  const displayNodes = useMemo(() => nodes.map((node) => {
    const movementPct = cache?.nodeReadings?.[node.id]?.movementPct;
    let movementColor = colors.noMovement;

    if (movementPct !== undefined && movementPct >= 100 && movementPct <= 140) {
      movementColor = colors.slightMovement;
    } else if (movementPct !== undefined && movementPct > 140) {
      movementColor = colors.redWave1;
    }

    return { ...node, color: movementColor };
  }), [cache, nodes]);

  // --- 1. LOAD & MERGE POSITIONS (Runs ONCE when initialNodes receives items) ---
  useEffect(() => {
    // Wait until Firestore actually gives us nodes
    if (initialNodes.length === 0 || isLoaded) return;

    async function loadSavedPositions() {
      try {
        const savedJson = await AsyncStorage.getItem(STORAGE_KEY);
        
        if (savedJson) {
          const savedNodes: { id: string; x: number; y: number }[] = JSON.parse(savedJson);
          
          const mergedNodes = initialNodes.map((propNode) => {
            const savedPosition = savedNodes.find((saved) => saved.id === propNode.id);
            return {
              ...propNode,
              x: savedPosition ? savedPosition.x : propNode.x,
              y: savedPosition ? savedPosition.y : propNode.y,
            };
          });

          setNodes(mergedNodes);
        } else {
          setNodes(initialNodes);
        }
      } catch (error) {
        console.error('Failed to load room node positions:', error);
        setNodes(initialNodes);
      } finally {
        setIsLoaded(true);
      }
    }

    loadSavedPositions();
  }, [initialNodes, isLoaded]);

  // --- 2. SYNC NAME/ARMED METADATA FROM FIRESTORE ---
  useEffect(() => {
    if (!isLoaded || initialNodes.length === 0) return;

    setNodes((prevNodes) =>
      initialNodes.map((propNode) => {
        const existingNode = prevNodes.find((n) => n.id === propNode.id);
        // Retain local x/y position if present; update names/props from parent
        return {
          ...propNode,
          x: existingNode ? existingNode.x : propNode.x,
          y: existingNode ? existingNode.y : propNode.y,
        };
      })
    );
  }, [initialNodes, isLoaded]);

  // --- 3. SAVE POSITIONS ON MOVE ---
  useEffect(() => {
    // Crucial: Only save AFTER initial storage load is done and nodes are present
    if (!isLoaded || nodes.length === 0) return;

    async function savePositions() {
      try {
        const positionsToSave = nodes.map((node) => ({
          id: node.id,
          x: node.x,
          y: node.y,
        }));
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(positionsToSave));
      } catch (error) {
        console.error('Failed to save room node positions:', error);
      }
    }

    savePositions();
  }, [nodes, isLoaded]);

  // --- 4. OPEN BOTTOM SHEET WHEN A NODE IS TAPPED ---
  useEffect(() => {
    if (selectedNode) {
      const timer = setTimeout(() => {
        sheetRef.current?.present();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedNode]);

  // --- HANDLERS ---
  const handleCanvasLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasSize({ width, height });
  };

  const toggleEditMode = () => {
    if (isEmergency) return;
    setEditMode(!editMode);
  };

  const handleNodePress = (node: RoomNodeWithColor) => {
    if (activeEditMode) return;

    setSelectedNode({
      id: node.id,
      name: node.name,
      isArmed: node.isArmed ?? true,
    });
  };

  const handleNodeMove = (id: string, newX: number, newY: number) => {
    if (!activeEditMode) return;
    
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === id ? { ...node, x: newX, y: newY } : node
      )
    );
  };

  const handleRestart = (nodeId: string) => {
    const target = nodes.find((n) => n.id === nodeId);
    Alert.alert('Node Action', `Restarting ${target?.name || 'node'}...`);
    sheetRef.current?.dismiss();
    setSelectedNode(null);
  };

  const handleShutdown = (nodeId: string) => {
    const target = nodes.find((n) => n.id === nodeId);
    Alert.alert('Node Action', `Shutting down ${target?.name || 'node'}...`);
    sheetRef.current?.dismiss();
    setSelectedNode(null);
  };

  return (
    <>
      <View style={[styles.card, style]}>
        {!isEmergency && (
          <View style={styles.cardTopRow} pointerEvents="box-none">
            <Pressable
              style={[styles.editBtn, activeEditMode && styles.editBtnActive]}
              onPress={toggleEditMode}
            >
              <Text style={[styles.editBtnText, activeEditMode && styles.editBtnTextActive]}>
                {activeEditMode ? 'Done' : 'Edit'}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.canvas} onLayout={handleCanvasLayout}>
          {canvasSize.width > 0 &&
            displayNodes.map((node) => (
              <RoomNodeItem
                key={node.id}
                node={node}
                canvasSize={canvasSize}
                editMode={activeEditMode}
                onNodePress={handleNodePress}
                onNodeMove={handleNodeMove}
              />
            ))}
        </View>
      </View>

      <NodeControlSheet
        ref={sheetRef}
        selectedNode={selectedNode}
        onRestart={handleRestart}
        onShutdown={handleShutdown}
      />
    </>
  );
};

export const RoomNodeMapNormal: React.FC<Omit<RoomNodeMapProps, 'isEmergency'>> = (props) => (
  <RoomNodeMap {...props} isEmergency={false} />
);

export const RoomNodeMapEmergency: React.FC<Omit<RoomNodeMapProps, 'isEmergency'>> = (props) => (
  <RoomNodeMap {...props} isEmergency={true} />
);

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.bgSecondary1,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.noMovement,
    overflow: 'hidden',
  },
  cardTopRow: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  editBtn: {
    backgroundColor: colors.base,
    paddingHorizontal: 19,
    paddingVertical: 6,
    borderRadius: 14,
  },
  editBtnActive: {
    backgroundColor: colors.accent,
  },
  editBtnText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  editBtnTextActive: {
    color: colors.base,
  },
  canvas: {
    height: 320,
    width: '100%',
  },
});

export default RoomNodeMap;