import { Timestamp } from "@react-native-firebase/firestore";

export type Home = {
  masterMac: string;
  activeEventId: string | null;
  requestedCache: boolean;
  lastPackage?: CacheEntry;
  lastSeen: Timestamp;
  registeredAt: Timestamp;
};

export type Node = {
  hid: string;
  nodeId: string;
  nickname: string;
  role: "master" | "slave";
  armed: boolean;
  requestedArmed: boolean;
  requestedRestart?: boolean;
  requestedShutDown?: boolean;
  batteryPct: number | null;
  reportType: "low_battery" | "not_transmitting" | "signal_weak" | null;
  sensorReading: number;
  movementPct: number;
  warningType: "fire" | "gas_leak" | null;
};

// One node's reading inside a package — no more nested `sensors`, no per-node isAlarm
export type CacheNodeReading = {
  batteryPct: number | null;
  reportType: "low_battery" | "not_transmitting" | "signal_weak" | null;
  sensorReading: number;
  movementPct: number;
  warningType: "fire" | "gas_leak" | null;
};

// A single package snapshot. `nodes` is a MAP keyed by nodeId, not an array.
export type CacheEntry = {
  packagePct: number;
  isAlarm: boolean;
  timestamp: Timestamp;   // now a real Timestamp, not a string
  nodes: Record<string, CacheNodeReading>;
};

export type Cache = {
  packages?: CacheEntry[];
  updatedAt: Timestamp;
};

export type UserHomeLink = {
  uid: string;
  hid: string;
  role: "owner" | "member";
};

export type SecuriFiEvent = {
  eid: string;
  hid: string;
  eventType: "intrusion" | "fire" | "gasLeak";
  startedAt: Timestamp;
  endedAt?: Timestamp;
  dismissedByUser?: boolean;
  falseAlarm?: boolean | string;
  falseAlarmDescription?: string;
  summary?: EventSummaryEntry[];   // see below — replaces the "Timestamps" idea
};

export type EventSummaryEntry = {
  timestamp: Timestamp;
  description: string;
};

export type Chunk = {
  cid: string;
  savedAt: Timestamp;
  packages: CacheEntry[];   // same shape as a live package now — no separate ChunkPackage type needed
};

export function normaliseEventType(
  raw?: string
): "intrusion" | "fire" | "gas_leak" {
  if (raw === "fire") return "fire";
  if (raw === "gasLeak" || raw === "gas_leak") return "gas_leak";
  return "intrusion";
}

export { Timestamp };
