import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent, StyleProp, ViewStyle, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

import { colors } from "@/theme/colors";
import { RoomNode } from "@/services/userProfile";
import RoomNodeItem from './RoomNodeItem';
import { NodeControlSheet, SelectedNodeData } from '../NodeControlSheet';

export interface RoomNodeWithColor extends RoomNode {
  color?: string;
  isArmed?: boolean;
}

interface RoomNodeMapProps {
  initialNodes?: RoomNodeWithColor[];
  style?: StyleProp<ViewStyle>;
}

const STORAGE_KEY = '@room_nodes_positions_v1';

const RoomNodeMap: React.FC<RoomNodeMapProps> = ({
  initialNodes = [],
  style,
}) => {
  // --- STATE & REFS ---
  const [nodes, setNodes] = useState<RoomNodeWithColor[]>(initialNodes);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  
  // Active node selected for the Bottom Sheet control modal
  const [selectedNode, setSelectedNode] = useState<SelectedNodeData | null>(null);

  // BottomSheet ref
  const sheetRef = useRef<BottomSheetModal>(null);

  // --- 1. LOAD & MERGE POSITIONS ON MOUNT ---
  useEffect(() => {
    async function loadSavedPositions() {
      try {
        const savedJson = await AsyncStorage.getItem(STORAGE_KEY);
        
        if (savedJson) {
          const savedNodes: { id: string; x: number; y: number }[] = JSON.parse(savedJson);
          
          // Merge stored (X, Y) positions with fresh initialNodes props
          // This keeps coordinates saved while updating colors/names from HomeScreen
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
  }, []);

  // --- 2. SYNC PROP CHANGES (e.g. status/color updates from HomeScreen) ---
  useEffect(() => {
    if (!isLoaded) return;

    setNodes((prevNodes) =>
      initialNodes.map((propNode) => {
        const existingNode = prevNodes.find((n) => n.id === propNode.id);
        return {
          ...propNode,
          x: existingNode ? existingNode.x : propNode.x,
          y: existingNode ? existingNode.y : propNode.y,
        };
      })
    );
  }, [initialNodes, isLoaded]);

  // --- 3. SAVE POSITIONS ON POSITION MOVE ---
  useEffect(() => {
    if (!isLoaded) return;

    async function savePositions() {
      try {
        // Save only coordinates and ID to keep storage light
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
      // Small timeout ensures the bottom sheet has mounted with data before expanding
      const timer = setTimeout(() => {
        sheetRef.current?.present();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedNode]);

  // --- HANDLERS ---
  
  // Canvas layout measurement
  const handleCanvasLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasSize({ width, height });
  };

  // Toggle layout drag mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // Node press handler
  const handleNodePress = (node: RoomNodeWithColor) => {
    if (editMode) return; // Disable sheet modal while dragging node positions

    setSelectedNode({
      id: node.id,
      name: node.name,
      isArmed: node.isArmed ?? true,
    });
  };

  // Drag update handler
  const handleNodeMove = (id: string, newX: number, newY: number) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === id ? { ...node, x: newX, y: newY } : node
      )
    );
  };

  // Restart handler
  const handleRestart = (nodeId: string) => {
    const target = nodes.find((n) => n.id === nodeId);
    Alert.alert('Node Action', `Restarting ${target?.name || 'node'}...`);
    sheetRef.current?.dismiss();
    setSelectedNode(null);
  };

  // Shutdown handler
  const handleShutdown = (nodeId: string) => {
    const target = nodes.find((n) => n.id === nodeId);
    Alert.alert('Node Action', `Shutting down ${target?.name || 'node'}...`);
    sheetRef.current?.dismiss();
    setSelectedNode(null);
  };

  // --- RENDER ---
  return (
    <>
      <View style={[styles.card, style]}>
        {/* Header Toggle Button */}
        <View style={styles.cardTopRow} pointerEvents="box-none">
          <Pressable
            style={[styles.editBtn, editMode && styles.editBtnActive]}
            onPress={toggleEditMode}
          >
            <Text style={[styles.editBtnText, editMode && styles.editBtnTextActive]}>
              {editMode ? 'Done' : 'Edit'}
            </Text>
          </Pressable>
        </View>

        {/* Map Canvas */}
        <View style={styles.canvas} onLayout={handleCanvasLayout}>
          {canvasSize.width > 0 &&
            nodes.map((node) => (
              <RoomNodeItem
                key={node.id}
                node={node}
                canvasSize={canvasSize}
                editMode={editMode}
                onNodePress={handleNodePress}
                onNodeMove={handleNodeMove}
              />
            ))}
        </View>
      </View>

      {/* Control Bottom Sheet Modal */}
      <NodeControlSheet
        ref={sheetRef}
        selectedNode={selectedNode}
        onRestart={handleRestart}
        onShutdown={handleShutdown}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.bgSecondary2,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.accent,
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