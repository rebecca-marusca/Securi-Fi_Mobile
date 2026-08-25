import { forwardRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { colors } from '@/theme/colors';
import { TimelineEntryCard } from '@/components/TimelineEntryCard';
import type { TimelineEntry } from '@/types/timeline';

const MOCK_ENTRIES: TimelineEntry[] = [
  {
    id: '1',
    type: 'break_in',
    date: '08.09.2026',
    title: 'BREAK-IN DETECTED',
    description:
      'First detection at 10:00 AM. Movement amplifies at 10:02 AM next to Kitchen node, and the system automatically notified all registered users.',
  },
  { id: '2', type: 'nodes_on', date: '06.10.2026', title: 'NODES TURNED ON' },
];

export const TimelineSheet = forwardRef<BottomSheet>((_, ref) => {
  const snapPoints = useMemo(() => ['50%', '85%'], []);
  const latestEntry = MOCK_ENTRIES[0];

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

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {latestEntry && (
            <TimelineEntryCard
              key={latestEntry.id}
              entry={latestEntry}
              isLast={true}
            />
          )}
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.base,
  },
  handleIndicator: {
    backgroundColor: colors.accent,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
});