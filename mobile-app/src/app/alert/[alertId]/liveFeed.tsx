import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useActiveAlert } from '@/contexts/AlertContext';
import { useHome } from '@/hooks/useHome';
import { subscribeToNodesForHome, type FirestoreNode } from '@/services/nodes';
import { subscribeToEventChunks } from '@/services/events';
import { bootstrapLiveCache, subscribeToLastPackage } from '@/services/cache';
import { buildPlayByPlayFromPackages } from '@/utils/eventDescriptions';
import type { Chunk, CacheEntry } from '@/types/firestore';
import { colors } from '@/theme/colors';
import AnimatedWaveHeader from '@/components/AnimatedWaveHeader';
import { SymbolView } from 'expo-symbols';

export default function LiveFeedScreen() {
  const router = useRouter();
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const { activeAlert } = useActiveAlert();
  const { hid } = useHome();

  const currentAlertId = alertId || activeAlert?.alertId;
  const eventHomeId = activeAlert?.hid ?? hid;

  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [rollingWindow, setRollingWindow] = useState<CacheEntry[]>([]);
  const [dbNodes, setDbNodes] = useState<FirestoreNode[]>([]);

  useEffect(() => {
    if (!hid) return;
    return subscribeToNodesForHome(hid, setDbNodes);
  }, [hid]);

  useEffect(() => {
    if (!currentAlertId || !eventHomeId) return;
    return subscribeToEventChunks(eventHomeId, currentAlertId, setChunks);
  }, [currentAlertId, eventHomeId]);

  // Bootstrap once, then switch to the cheap per-package listener
  useEffect(() => {
    if (!eventHomeId) return;
    let cancelled = false;

    bootstrapLiveCache(eventHomeId).then((initial) => {
      if (!cancelled) setRollingWindow(initial.slice(-60));
    });

    const unsub = subscribeToLastPackage(eventHomeId, (pkg) => {
      setRollingWindow((prev) => {
        const last = prev[prev.length - 1];
        // dedupe against the bootstrap/previous package by timestamp
        if (last && JSON.stringify(last.timestamp) === JSON.stringify(pkg.timestamp)) return prev;
        const next = [...prev, pkg];
        return next.length > 60 ? next.slice(next.length - 60) : next;
      });
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, [eventHomeId]);

  const nodeNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const node of dbNodes) {
      if (node.nodeId && node.nickname) map[node.nodeId] = node.nickname;
    }
    return map;
  }, [dbNodes]);

  // Flushed chunk history is the older tail; rollingWindow (bootstrap + live) is the recent tail.
  const allPackages = useMemo(() => {
    const flushed = chunks.flatMap((chunk) => chunk.packages ?? []);
    return [...flushed, ...rollingWindow];
  }, [chunks, rollingWindow]);

  const descriptionLines = useMemo(
    () => buildPlayByPlayFromPackages(allPackages, nodeNameMap),
    [allPackages, nodeNameMap]
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AnimatedWaveHeader 
          color1={ colors.redWave1 }
          color2={ colors.redWave2 }
          color3={ colors.redWave3 }
        />
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back to alert"
          >
            <SymbolView name="chevron.left" size={24} tintColor={colors.text} />
          </Pressable>
          <Text style={styles.title}>Live Feed</Text>
        </View>
        {descriptionLines.map((line, i) => (
          <Text key={i} style={styles.line}>
            {line.parts.map((part, j) =>
              'bold' in part && part.bold ? (
                <Text key={j} style={styles.bold}>{part.text}</Text>
              ) : (
                <Text key={j}>{part.text}</Text>
              )
            )}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.base },
  header: { paddingTop: 145, paddingBottom: 12, alignItems: "center" },
  backButton: {
    position: "absolute",
    left: 0,
    top: 141,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: 'SF-Pro-Text-Bold', fontSize: 30, color: colors.redWave3 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  line: { marginTop: 10, fontFamily: 'SF-Pro-Text-Regular', fontSize: 14, color: colors.text, marginBottom: 10, lineHeight: 20 },
  bold: { fontFamily: 'SF-Pro-Text-Bold' },
});