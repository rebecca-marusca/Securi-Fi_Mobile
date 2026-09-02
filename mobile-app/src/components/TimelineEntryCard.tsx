import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme/colors';
import type { TimelineDescriptionLine, TimelineEntry } from '@/types/timeline';

const TRUNCATE_LENGTH = 100;
const COLLAPSED_LINE_COUNT = 4;

const TITLE_COLORS: Record<TimelineEntry['eventType'], string> = {
  intrusion: '#9c1818',
  fire: '#EA580C',
  gas_leak: '#D97706',
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

function flattenDescriptionLine(line: TimelineDescriptionLine): string {
  return line.parts.map((part) => part.text).join('');
}

function renderDescriptionLine(line: TimelineDescriptionLine, lineIndex: number) {
  return (
    <Text key={lineIndex} style={styles.descriptionLine}>
      {line.parts.map((part, partIndex) => (
        <Text
          key={`${lineIndex}-${partIndex}`}
          style={part.bold ? styles.descriptionStrong : undefined}
        >
          {part.text}
        </Text>
      ))}
    </Text>
  );
}

export function TimelineEntryCard({ entry, isLast, needsDivider, hideDate }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const richDescription = entry.descriptionLines ?? [];
  const hasRichDescription = richDescription.length > 0;
  const plainDescription = entry.description ?? richDescription.map(flattenDescriptionLine).join('\n');
  const needsTruncation = !hasRichDescription && (plainDescription?.length ?? 0) > TRUNCATE_LENGTH;
  const needsLineTruncation = hasRichDescription && richDescription.length > COLLAPSED_LINE_COUNT;
  const visibleLines =
    expanded || !needsLineTruncation
      ? richDescription
      : richDescription.slice(0, COLLAPSED_LINE_COUNT);
  const displayText =
    !plainDescription || expanded || !needsTruncation
      ? plainDescription
      : plainDescription.slice(0, TRUNCATE_LENGTH).trimEnd();

  const hasDescription = hasRichDescription || !!plainDescription;
  const showDescription = hasDescription && revealed;
  const titleColor = TITLE_COLORS[entry.eventType];

  return (
    <View style={styles.wrapper}>
      {!hideDate ? (
        <View style={styles.dateTimeRow}>
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

      {hasDescription ? (
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
          {hasRichDescription ? (
            <>
              {visibleLines.map(renderDescriptionLine)}
              {needsLineTruncation && (
                <Text style={styles.readMore} onPress={() => setExpanded((prev) => !prev)}>
                  {expanded ? 'Show less' : `Read ${richDescription.length - visibleLines.length} more`}
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.descriptionText}>
              {displayText}
              {needsTruncation && !expanded && '... '}
              {needsTruncation && (
                <Text style={styles.readMore} onPress={() => setExpanded((prev) => !prev)}>
                  {expanded ? ' Show less' : 'Read more'}
                </Text>
              )}
            </Text>
          )}
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
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: "baseline",
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
    paddingLeft: 8,
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
  descriptionLine: {
    fontFamily: 'SF-Pro-Text-Regular',
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 6,
  },
  descriptionStrong: {
    fontFamily: 'SF-Pro-Text-Semibold',
    color: colors.textMuted,
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
