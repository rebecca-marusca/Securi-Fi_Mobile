import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme/colors';
import type { TimelineEntry } from '@/types/timeline';

const TRUNCATE_LENGTH = 100;

const TITLE_COLORS: Record<TimelineEntry['type'], string> = {
  break_in: '#B3453D',
  fire: '#C43D2E',
  gas_leak: '#D96827',
  nodes_on: colors.text,
  nodes_off: colors.text,
  false_alarm: colors.text,
};

type Props = {
  entry: TimelineEntry;
  isLast: boolean;
  needsDivider?: boolean;
  hideDate?: boolean;
};

function Chevron({ expanded, color }: { expanded: boolean; color: string }) {
  return (
    <View style={[styles.chevronWrapper, expanded && styles.chevronExpanded]}>
      <Svg width={12} height={12} viewBox="0 0 12 12">
        <Path
          d="M3 2 L8 6 L3 10"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

export function TimelineEntryCard({ entry, isLast, needsDivider, hideDate }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const needsTruncation = (entry.description?.length ?? 0) > TRUNCATE_LENGTH;
  const displayText =
    !entry.description || expanded || !needsTruncation
      ? entry.description
      : entry.description.slice(0, TRUNCATE_LENGTH).trimEnd();

  const showDescription = entry.description && revealed;
  const titleColor = TITLE_COLORS[entry.type];

  return (
    <View style={styles.wrapper}>
      {!hideDate ? (
        <View style={styles.dateTimeColumn}>
          <Text style={styles.date}>{entry.date}</Text>
          {entry.startTime && (
            <Text style={styles.time}>
              {entry.startTime}
              {entry.endTime && ` - ${entry.endTime}`}
            </Text>
          )}
        </View>
      ) : entry.startTime ? (
        <Text style={styles.timeOnly}>
          {entry.startTime}
          {entry.endTime && ` - ${entry.endTime}`}
        </Text>
      ) : null}

      {entry.description ? (
        <Pressable
          style={[styles.titleRow, !showDescription && { marginBottom: 0 }]}
          onPress={() => setRevealed((prev) => !prev)}
        >
          <Text style={[styles.title, { color: titleColor }]}>{entry.title}</Text>
          <Chevron expanded={!!showDescription} color={titleColor} />
        </Pressable>
      ) : (
        <Text style={[styles.title, { color: titleColor }, { marginBottom: 0 }]}>
          {entry.title}
        </Text>
      )}

      {showDescription && (
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

      {needsDivider && <View style={styles.divider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { 
    width: '100%', 
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  dateTimeColumn: {
    flexDirection: 'column',
    marginBottom: 2,
  },
  date: {
    fontFamily: 'SF-Pro-Text-Regular',
    fontSize: 15,
    color: colors.text,
  },
  time: {
    fontFamily: 'SF-Pro-Text-Regular',
    fontSize: 13,
    color: colors.textMuted,
    paddingTop: 8,
    paddingBottom: 8,
  },
  timeOnly: {
    fontFamily: 'SF-Pro-Text-Regular',
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'SF-Pro-Text-Bold',
    fontSize: 20,
  },
  chevronWrapper: {
    marginLeft: 6,
    marginTop: 3.5,
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  descriptionCard: {
    backgroundColor: colors.bgSecondary1,
    borderColor: colors.bgSecondary2,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
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
  divider: {
    height: 1,
    backgroundColor: colors.bgSecondary2,
    marginTop: 20,
  },
});