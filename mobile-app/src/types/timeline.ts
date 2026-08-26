export type TimelineEntryType =
  | 'break_in'
  | 'nodes_on'
  | 'nodes_off'
  | 'small_movement'
  | 'false_alarm'
  | 'fire'
  | 'gas_leak';

export type TimelineEntry = {
  id: string;
  type: TimelineEntryType;
  date: string; // display-formatted for now — will derive from a Firestore Timestamp later
  title: string;
  description?: string;
};