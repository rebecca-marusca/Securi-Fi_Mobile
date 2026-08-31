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
  falseAlarm?: boolean | string;
};

type IntrusionEvent = BaseEvent & {
  type: 'intrusion';
  endedAt?: Timestamp;
};

type HazardEvent = BaseEvent & {
  type: 'fire' | 'gasLeak';
  rawReading?: number;
  endedAt?: Timestamp;
};

type NodeStatusEvent = BaseEvent & {
  type: 'nodeStatus';
  nodeId: string;
  nodeAction: 'on' | 'off';
};

export type SecuriFiEvent = IntrusionEvent | HazardEvent | NodeStatusEvent;