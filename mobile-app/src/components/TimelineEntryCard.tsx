import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { colors } from '@/theme/colors';
import type { TimelineEntry } from '@/types/timeline';

const TRUNCATE_LENGTH = 100;

const TITLE_COLORS: Record<TimelineEntry['type'], string> = {
  break_in: '#B3453D',
  fire: '#C43D2E',
  gas_leak: '#D96827',
  nodes_on: colors.text,
  nodes_off: colors.text,
  small_movement: colors.text,
  false_alarm: colors.text,
};

type Props = {
  entry: TimelineEntry;
  isLast: boolean;
};

export function TimelineEntryCard({ entry, isLast }: Props) {
  const [expanded, setExpanded] = useState(false);

  const needsTruncation = (entry.description?.length ?? 0) > TRUNCATE_LENGTH;
  const displayText =
    !entry.description || expanded || !needsTruncation
      ? entry.description
      : entry.description.slice(0, TRUNCATE_LENGTH).trimEnd();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.date}>{entry.date}</Text>
      <Text
        style={[
          styles.title,
          { color: TITLE_COLORS[entry.type] },
          !entry.description && { marginBottom: 0 },
        ]}
      >
        {entry.title}
      </Text>

      {entry.description && (
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>
            {displayText}
            {needsTruncation && !expanded && '… '}
            {needsTruncation && (
              <Text style={styles.readMore} onPress={() => setExpanded((prev) => !prev)}>
                {expanded ? ' Show less' : 'Read more'}
              </Text>
            )}
          </Text>
        </View>
      )}

      {!isLast && (
        <View style={styles.connectorContainer}>
          <Svg width={16} height={46} viewBox="0 0 16 48">
            <Line
              x1={8}
              y1={0}
              x2={8}
              y2={40}
              stroke={colors.accent}
              strokeWidth={2}
            />
            <Path
              d="M 3 34 L 8 40 L 13 34"
              stroke={colors.accent}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </Svg>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', paddingHorizontal: 24 },
  date: {
    fontFamily: 'SF-Pro-Text-Regular',
    fontSize: 15,
    color: colors.text,
    marginBottom: 2,
  },
  title: {
    fontFamily: 'SF-Pro-Text-Bold',
    fontSize: 20,
    marginBottom: 8,
  },
  descriptionCard: {
    backgroundColor: colors.bgSecondary1,
    borderColor: colors.bgSecondary2,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  descriptionText: {
    fontFamily: 'SF-Pro-Text-Regular',
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  readMore: {
    fontFamily: 'SF-Pro-Text-Bold',
    fontSize: 14,
    color: colors.accent,
  },
  connectorContainer: {
    alignSelf: 'flex-start',
    marginLeft: 12,
    marginVertical: 10,
  },
});