import type { Timestamp } from "@react-native-firebase/firestore";

export type Home = {
  masterMac: string;
  armed: boolean;
  requestedArmed: boolean;
  activeEventId: string | null;
  lastSeen: Timestamp;
  registeredAt: Timestamp;
};

export type NodeWarnings = {
  lowBattery: boolean;
  notTransmitting: boolean;
  signalWeak: boolean;
};

export type Node = {
  hid: string;
  nodeId: string;
  nickname: string;
  role: "master" | "slave";
  warnings: NodeWarnings;
};

export type CacheReading = {
  probability: number;
  state: string;
  sensors: { flame: boolean; gas: boolean };
  rawMq2Reading: number;
  movementPct: number;
};

export type Cache = {
  overallReading: number;
  nodeReadings: Record<string, CacheReading>;
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
  peakProbability: number;
  avgProbability: number;
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