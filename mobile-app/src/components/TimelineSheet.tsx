import { forwardRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { colors } from '@/theme/colors';
import { TimelineEntryCard } from '@/components/TimelineEntryCard';
import type { TimelineEntry } from '@/types/timeline';

const MOCK_ENTRIES: TimelineEntry[] = [
  {
    id: '1',
    eventType: 'intrusion',
    date: '08.09.2026',
    title: 'INTRUSION DETECTED',
    description:
      'First detection at 10:00 AM. Movement amplifies at 10:02 AM next to Kitchen node, and the system automatically notified all registered users.',
  },
];

type TimelineSheetProps = {
  entry?: TimelineEntry | null;
  entries?: TimelineEntry[];
};

export const TimelineSheet = forwardRef<BottomSheet, TimelineSheetProps>(({ entry, entries }, ref) => {
  const displayEntries = entries && entries.length > 0
    ? entries
    : entry
    ? [entry]
    : MOCK_ENTRIES.slice(0, 1);

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
      enableDynamicSizing // Automatically resizes to fit children
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.content}>
        {displayEntries.map((item, index) => (
          <TimelineEntryCard
            key={item.id || index}
            entry={item}
            isLast={index === displayEntries.length - 1}
          />
        ))}
      </BottomSheetView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.base,
  },
  handleIndicator: {
    backgroundColor: "#B3453D",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
});