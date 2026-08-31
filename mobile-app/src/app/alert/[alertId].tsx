import AnimatedWaveHeader from '@/components/AnimatedWaveHeader';
import { colors } from '@/theme/colors';
import { useRouter } from "expo-router";
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { StyleSheet, Text, View, Pressable} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RoomNodeMapEmergency } from '@/components/homepage-map/RoomNodeMap';
import { useRef, useState } from 'react'
import BottomSheet from "@gorhom/bottom-sheet"
import { TimelineSheet } from '@/components/TimelineSheet';

export default function AlertScreen() {
    const router = useRouter();
    const { signOut } = useAuth();
    const { profile } = useUserProfile();
    const timelineSheetRef = useRef<BottomSheet>(null);
    const [sheetVisible, setSheetVisible] = useState(false);

    return (

      <View style={styles.container}>
        <AnimatedWaveHeader 
          color1={colors.redWave1}
          color2={colors.redWave2}
          color3={colors.redWave3}
        />
      
      <View style={styles.content}>
        <View style={styles.headerTextContainer}>
            <Text style={styles.subtitle}>BREAK-IN DETECTED</Text>
        </View>

        <RoomNodeMapEmergency
          initialNodes={[
            { id: 'kitchen', name: 'Kitchen', x: 0.28, y: 0.45, color: colors.redWave3 },
            { id: 'living-room', name: 'Living room', x: 0.72, y: 0.28, color: colors.redWave3 },
            { id: 'bedroom', name: 'Bedroom', x: 0.58, y: 0.75, color: colors.redWave3 },
          ]}
        />

        <View style={styles.statusPill}>
          <LinearGradient
            colors={["rgba(33, 2, 2, 0.25)", "transparent"]}
            style={styles.innerShadowGradient}
          />
          <Text style={styles.statusText}>Movement detected</Text>
        </View>

        <Pressable style={styles.buttonE}>
          <LinearGradient
            colors={["rgba(33, 2, 2, 0.25)", "transparent"]}
            style={styles.innerShadowGradient}
          />
          <Text style={styles.buttonText}>CALL EMERGENCY</Text>
        </Pressable>

        <Pressable style={styles.buttonT} onPress={() =>  timelineSheetRef.current?.expand()}>
          <LinearGradient
            colors={["rgba(2, 33, 23, 0.25)", "transparent"]}
            style={styles.innerShadowGradient}
          />
          <Text style={styles.buttonText}>TIMELINE</Text>
        </Pressable>

        <TimelineSheet ref={timelineSheetRef} />
      </View>
    </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 125,
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 27,
    fontFamily: "SF-Pro-Text-Bold",
    color: colors.redWave1,
    marginTop: 35,
  },
  cardPlaceholderText: {
    color: colors.redWave1,
    fontFamily: "SF-Pro-Text-Semibold",
  },
  statusPill: {
    backgroundColor: colors.redWave1,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: -3,
    overflow: 'hidden',
  },
  buttonE: {
    backgroundColor: colors.redWave1,
    width: 320,
    height: 50,
    borderRadius: 1000,
    marginTop: 30,
    justifyContent: "center",
    overflow: 'hidden',
  },
  buttonT: {
    backgroundColor: colors.textMuted,
    width: 320,
    height: 50,
    borderRadius: 1000,
    marginTop: 30,
    justifyContent: "center",
    overflow: 'hidden',
  },
  buttonText: {
    color: colors.base,
    alignSelf: "center",
    fontFamily: "SF-Pro-Text-Bold",
    fontSize: 15,
  },
  statusText: {
    color: colors.base,
    fontFamily: "SF-Pro-Text-Semibold",
    fontSize: 15,
  },
  innerShadowGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 10,
  },
});