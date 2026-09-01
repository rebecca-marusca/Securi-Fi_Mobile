export type TimelineEntryType =
  | 'break_in'
  | 'nodes_on'
  | 'nodes_off'
  | 'false_alarm'
  | 'fire'
  | 'gas_leak';

export type TimelineEntry = {
  id: string;
  type: TimelineEntryType;
  date: string; // display-formatted for now — will derive from a Firestore Timestamp later
  title: string;
  description?: string;
  startTime?: string; // formatted as HH:MM
  endTime?: string; // formatted as HH:MM
  rawStartedAt?: any; // raw timestamp for grouping
};