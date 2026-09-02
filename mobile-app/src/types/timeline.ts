export type TimelineEntryType =
  | 'intrusion'
  | 'fire'
  | 'gas_leak';

export type TimelineDescriptionPart = {
  text: string;
  bold?: boolean;
};

export type TimelineDescriptionLine = {
  parts: TimelineDescriptionPart[];
};

export type TimelineEntry = {
  id: string;
  eventType: TimelineEntryType;
  date: string; // display-formatted for now — will derive from a Firestore Timestamp later
  title: string;
  description?: string;
  descriptionLines?: TimelineDescriptionLine[];
  startTime?: string; // formatted as HH:MM
  endTime?: string; // formatted as HH:MM
  rawStartedAt?: any; // raw timestamp for grouping
};
