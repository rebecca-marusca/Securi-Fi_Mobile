import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {View,Text,Pressable,StyleSheet,LayoutChangeEvent,StyleProp,ViewStyle,PanResponder,Animated,Easing,} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from "@/theme/colors";
import { LinearGradient } from "expo-linear-gradient";
import { RoomNode, DEFAULT_NODES } from "@/services/userProfile";

const STORAGE_KEY = '@room_nodes_positions_v1';

const NODE_RADIUS = 20;
const RANGE_RADIUS = 80;
const WRAPPER_WIDTH = 80;
const LABEL_HEIGHT = 22;

/* Draggable Room Node Component -------------------------------------------------- */

interface RoomNodeItemProps {
  node: RoomNode;
  canvasSize: { width: number; height: number };
  editMode: boolean;
  onNodePress: (node: RoomNode) => void;
  onNodeMove: (id: string, x: number, y: number) => void;
}

const RoomNodeItem: React.FC<RoomNodeItemProps> = ({
  node,
  canvasSize,
  editMode,
  onNodePress,
  onNodeMove,
}) => {
  const left = node.x * canvasSize.width - WRAPPER_WIDTH / 2;
  const top = node.y * canvasSize.height - NODE_RADIUS;

  const propsRef = React.useRef({ node, canvasSize, editMode, onNodePress, onNodeMove });
  propsRef.current = { node, canvasSize, editMode, onNodePress, onNodeMove };

  const initialPos = React.useRef({ x: node.x, y: node.y });

  /* Pulse Animation Logic ------------------------------------------------------- */

  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, [pulseAnim]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [NODE_RADIUS / RANGE_RADIUS, 1],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.2, 0.7, 1],
    outputRange: [0.6, 0.4, 0.15, 0],
  });

  /* Gesture Responder ----------------------------------------------------------- */

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => propsRef.current.editMode,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          propsRef.current.editMode &&
          (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2),

        onPanResponderGrant: () => {
          initialPos.current = {
            x: propsRef.current.node.x,
            y: propsRef.current.node.y,
          };
        },

        onPanResponderMove: (_, gestureState) => {
          const { canvasSize, node, onNodeMove } = propsRef.current;
          if (!canvasSize.width || !canvasSize.height) return;

          const startPxX = initialPos.current.x * canvasSize.width;
          const startPxY = initialPos.current.y * canvasSize.height;

          let pxX = startPxX + gestureState.dx;
          let pxY = startPxY + gestureState.dy;

          pxX = Math.max(NODE_RADIUS, Math.min(canvasSize.width - NODE_RADIUS, pxX));
          pxY = Math.max(NODE_RADIUS, Math.min(canvasSize.height - NODE_RADIUS - LABEL_HEIGHT, pxY));

          onNodeMove(node.id, pxX / canvasSize.width, pxY / canvasSize.height);
        },

        onPanResponderRelease: (_, gestureState) => {
          const distance = Math.hypot(gestureState.dx, gestureState.dy);
          if (distance < 6) {
            propsRef.current.onNodePress(propsRef.current.node);
          }
        },
      }),
    []
  );

  return (
    <View
      style={[
        styles.nodeWrapper,
        { left, top, width: WRAPPER_WIDTH, height: NODE_RADIUS * 2 + LABEL_HEIGHT },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.rangeCircle,
          styles.pulseWave,
          {
            width: RANGE_RADIUS * 2,
            height: RANGE_RADIUS * 2,
            borderRadius: RANGE_RADIUS,
            top: NODE_RADIUS - RANGE_RADIUS,
            left: (WRAPPER_WIDTH - RANGE_RADIUS * 2) / 2,
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
          },
        ]}
      />

      <View
        {...(editMode ? panResponder.panHandlers : {})}
        style={styles.nodeCircle}
      >
        <LinearGradient
          colors={["rgba(137, 137, 137, 0.25)", "transparent"]}
          style={styles.innerShadowGradient}
          pointerEvents="none"
        />
      </View>

      <View style={styles.nodeLabelWrap} pointerEvents="none">
        <Text style={styles.nodeLabel} numberOfLines={1} ellipsizeMode="tail">
          {node.name}
        </Text>
      </View>
    </View>
  );
};

interface RoomNodeGraphProps {
  nodes?: RoomNode[];
  initialNodes?: RoomNode[];
  style?: StyleProp<ViewStyle>;
}

/* Main Component ----------------------------------------------------------------- */

const RoomNodeGraph: React.FC<RoomNodeGraphProps> = ({
  nodes: externalNodes,
  initialNodes = DEFAULT_NODES,
  style,
}) => {
  const [nodes, setNodes] = useState<RoomNode[]>(initialNodes);
  const [editMode, setEditMode] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync external DB node nicknames while preserving positions
  useEffect(() => {
    if (!externalNodes || externalNodes.length === 0) return;
    const defaultPositions = [
      { x: 0.28, y: 0.45 },
      { x: 0.72, y: 0.28 },
      { x: 0.58, y: 0.75 },
    ];
    setNodes((prev) => {
      return externalNodes.map((extNode, idx) => {
        const existing = prev.find((p) => p.id === extNode.id);
        const fallbackPos = defaultPositions[idx % defaultPositions.length];
        return {
          id: extNode.id,
          name: extNode.name,
          x: existing ? existing.x : extNode.x ?? fallbackPos.x,
          y: existing ? existing.y : extNode.y ?? fallbackPos.y,
        };
      });
    });
  }, [externalNodes]);

  // 1. Load saved node positions on mount
  useEffect(() => {
    const loadSavedNodes = async () => {
      try {
        const savedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedData) {
          setNodes(JSON.parse(savedData));
        }
      } catch (error) {
        console.error("Failed to load node positions:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSavedNodes();
  }, []);

  // 2. Persist node positions whenever nodes update (after initial load)
  useEffect(() => {
    if (!isLoaded) return;

    const saveNodes = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
      } catch (error) {
        console.error("Failed to save node positions:", error);
      }
    };

    saveNodes();
  }, [nodes, isLoaded]);

  const handleCanvasLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasSize({ width, height });
  }, []);

  const handleNodeMove = useCallback((id: string, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, x, y } : n))
    );
  }, []);

  const handleNodePress = useCallback((node: RoomNode) => {
    if (!editMode) return;
  }, [editMode]);

  const toggleEditMode = useCallback(() => {
    setEditMode((prev) => !prev);
  }, []);

  return (
    <View style={[styles.card, style]}>
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
  );
};

export default RoomNodeGraph;

/* Styles ------------------------------------------------------------------------- */

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
    zIndex: 10,
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
  nodeWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  rangeCircle: {
    position: 'absolute',
    backgroundColor: 'rgb(255, 0, 0)',
  },
  pulseWave: {
    backgroundColor: 'rgba(0, 216, 36, 0.33)',
    borderWidth: 5,
    borderColor: 'rgba(0, 216, 36, 0.12)',
  },
  nodeCircle: {
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
    borderRadius: NODE_RADIUS,
    borderWidth: 5,
    borderColor: colors.accent,
    backgroundColor: colors.base,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 2,
  },
  innerShadowGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  nodeLabelWrap: {
    marginTop: 4,
    width: '100%',
    zIndex: 2,
  },
  nodeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
});