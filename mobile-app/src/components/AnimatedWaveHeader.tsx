import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from "@/theme/colors";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WAVE_WIDTH = SCREEN_WIDTH * 2;

// 1. Define Props Interface for WaveLayer
interface WaveLayerProps {
  duration: number;
  opacity: number;
  color: string;
  height?: number;
}

function WaveLayer({
  duration,
  opacity,
  color,
  height = 120,
}: WaveLayerProps) {
  const translateX = useSharedValue<number>(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(-SCREEN_WIDTH, {
        duration,
        easing: Easing.linear,
      }),
      -1, // Infinite loop
      false // Smooth continuous loop (no reverse)
    );
  }, [duration, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const pathD = `
    M 0 0 
    H ${WAVE_WIDTH} 
    V ${height - 30} 
    Q ${WAVE_WIDTH - SCREEN_WIDTH * 0.25} ${height}, ${WAVE_WIDTH - SCREEN_WIDTH * 0.5} ${height - 30} 
    T ${WAVE_WIDTH - SCREEN_WIDTH} ${height - 30} 
    T ${WAVE_WIDTH - SCREEN_WIDTH * 1.5} ${height - 30} 
    T 0 ${height - 30} 
    Z
  `;

  return (
    <Animated.View style={[styles.waveContainer, { height }, animatedStyle]}>
      <Svg width={WAVE_WIDTH} height={height} viewBox={`0 0 ${WAVE_WIDTH} ${height}`}>
        <Path d={pathD} fill={color} opacity={opacity} />
      </Svg>
    </Animated.View>
  );
};

type AnimatedWaveHeaderProps = {
  color1: string;
  color2: string;
  color3: string;
};

export default function AnimatedWaveHeader({
  color3,
  color2 ,
  color1,
}: AnimatedWaveHeaderProps) {
  return (
    <View style={styles.outerContainer}>
      <View style={[styles.topExtension, { backgroundColor: color1 }]} />
      <View style={styles.headerContainer}>
        <WaveLayer
          color={color3}
          opacity={0.4}
          duration={16000}
          height={140}
        />
        <WaveLayer
          color={color2}
          opacity={0.7}
          duration={12000}
          height={130}
        />
        <WaveLayer
          color={color1}
          opacity={1.0}
          duration={8000}
          height={120}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topExtension: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    height: 1000,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    overflow: 'hidden',
  },
  waveContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: WAVE_WIDTH,
  },
});