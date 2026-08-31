import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, Easing } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/theme/colors";
import { RoomNodeWithColor } from './RoomNodeMap';

export const NODE_RADIUS = 20;
export const RANGE_RADIUS = 80;
export const WRAPPER_WIDTH = 80;
export const LABEL_HEIGHT = 22;

export interface RoomNodeItemProps {
  node: RoomNodeWithColor;
  canvasSize: { width: number; height: number };
  editMode: boolean;
  onNodePress: (node: RoomNodeWithColor) => void;
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

  const propsRef = useRef({ node, canvasSize, editMode, onNodePress, onNodeMove });
  propsRef.current = { node, canvasSize, editMode, onNodePress, onNodeMove };
  const initialPos = useRef({ x: node.x, y: node.y });

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

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
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
          const { canvasSize, node, editMode, onNodeMove } = propsRef.current;
          if (!editMode) return;
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
          if (!propsRef.current.editMode && distance < 6) {
            propsRef.current.onNodePress(propsRef.current.node);
          }
        },
      }),
    []
  );

  // Active color passed from prop or fallback to default theme accent
  const activeColor = node.color || colors.accent;

  return (
    <View style={[styles.nodeWrapper, { left, top }]}>
      {/* Pulsing Wave Circle */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.rangeCircle,
          {
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
            backgroundColor: activeColor,
            borderColor: activeColor,
            borderWidth: 3,
          },
        ]}
      />

      {/* Main Node Circle */}
      <View
        {...panResponder.panHandlers}
        style={[styles.nodeCircle, { borderColor: activeColor }]}
      >
        <LinearGradient
          colors={["rgba(137, 137, 137, 0.25)", "transparent"]}
          style={styles.innerShadowGradient}
          pointerEvents="none"
        />
      </View>

      {/* Label */}
      <View style={styles.nodeLabelWrap} pointerEvents="none">
        <Text style={styles.nodeLabel} numberOfLines={1} ellipsizeMode="tail">
          {node.name}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nodeWrapper: {
    position: 'absolute',
    alignItems: 'center',
    width: WRAPPER_WIDTH,
    height: NODE_RADIUS * 2 + LABEL_HEIGHT,
  },
  rangeCircle: {
    position: 'absolute',
    width: RANGE_RADIUS * 2,
    height: RANGE_RADIUS * 2,
    borderRadius: RANGE_RADIUS,
    top: NODE_RADIUS - RANGE_RADIUS,
    left: (WRAPPER_WIDTH - RANGE_RADIUS * 2) / 2,
  },
  nodeCircle: {
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
    borderRadius: NODE_RADIUS,
    borderWidth: 5,
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

export default RoomNodeItem;