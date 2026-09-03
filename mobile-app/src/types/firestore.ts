import type { Timestamp } from "@react-native-firebase/firestore";

export type Home = {
  masterMac: string;
  activeEventId: string | null;
  lastSeen: Timestamp;
  registeredAt: Timestamp;
};

export type NodeWarnings = {
  lowBattery: boolean;
  notTransmitting: boolean;
  signalWeak: boolean;
};

export type NodeSensors = {
  flame: boolean;
  gas: boolean;
  batteryPct: number | null;
};

export type Node = {
  hid: string;
  nodeId: string;
  nickname: string;
  role: "master" | "slave";
  armed: boolean;
  requestedArmed: boolean;
  warnings: NodeWarnings;
};

export type CacheNodeReading = {
  nodeId?: string;
  state: string;
  rawMq2Reading: number;
  movementPct: number;
  isAlarm: boolean;
  sensors: NodeSensors;
};

export type CacheEntry = {
  timestamp: string;
  warningType?: string | null;
  isAlarm: boolean;
  packageMovementPct: number;
  nodes: CacheNodeReading[];
};

export type Cache = {
  packages?: CacheEntry[];
  alarmCount: number;
  idleStreak: number;
  isAlarm: boolean;
  nodeReadings: Record<string, CacheNodeReading>;
  updatedAt: Timestamp;
};

export type UserHomeLink = {
  uid: string;
  hid: string;
  role: "owner" | "member";
};

type BaseEvent = {
  eid: string;
  hid: string;
  startedAt: Timestamp;
  nodeId?: string;
  dismissedByUser?: boolean;
  // `falseAlarm` is currently a reason string. Keep boolean support while the
  // dismissal flow is being migrated so older event documents remain readable.
  falseAlarm?: boolean | string | null;
};

type IntrusionEvent = BaseEvent & {
  eventType: 'intrusion';
  endedAt?: Timestamp;
};

type HazardEvent = BaseEvent & {
  eventType: 'fire' | 'gasLeak';
  rawReading?: number;
  endedAt?: Timestamp;
};

export type SecuriFiEvent = IntrusionEvent | HazardEvent;

export type Chunk = {
  cid: string;
  savedAt: Timestamp;
  packages: ChunkPackage[];
};

export type ChunkPackage = {
  timestamp: string;
  warningType?: string | null;
  // Legacy chunks used snake_case. New chunks are written with `warningType`.
  warning_type?: string | null;
  packageMovementPct: number;
  isAlarm: boolean;
  nodes: ChunkNodeReading[];
};

export type ChunkNodeReading = {
  nodeId?: string;
  state: string;
  movementPct: number;
  rawMq2Reading: number;
  isAlarm: boolean;
  sensors: ChunkSensors;
};

export type ChunkSensors = {
  flame: boolean;
  gas: boolean;
  batteryPct?: number | null;
  battery_pct?: number | null;
};
