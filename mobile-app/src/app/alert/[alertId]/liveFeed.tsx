import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useActiveAlert } from '@/contexts/AlertContext';
import { useHome } from '@/hooks/useHome';
import { subscribeToNodesForHome, type FirestoreNode } from '@/services/nodes';
import { subscribeToEventChunks } from '@/services/events';
import { bootstrapLiveCache, subscribeToLastPackage } from '@/services/cache';
import { buildPlayByPlayFromPackages } from '@/utils/eventDescriptions';
import type { Chunk, CacheEntry } from '@/types/firestore';
import { colors } from '@/theme/colors';

export default function LiveFeedScreen() {
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
    () => buildPlayByPlayFromPackages(allPackages, nodeNameMap).reverse(),
    [allPackages, nodeNameMap]
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <ScreenHeader
        title="Activity Monitor"
        titleColor={colors.redWave3}
        iconColor={colors.redWave3}
      />

      <View style={styles.section}>
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  content: {
    alignContent: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  section: {
    marginTop: 8,
  },
  line: {
    fontFamily: 'SF-Pro-Text-Regular',
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  bold: {
    fontFamily: 'SF-Pro-Text-Bold',
  },
});