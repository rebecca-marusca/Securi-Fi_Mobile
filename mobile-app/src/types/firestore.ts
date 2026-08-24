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

export type SecuriFiEvent = {
  hid: string;
  startedAt: Timestamp;
  endedAt: Timestamp | null;
  peakProbability: number;
  avgProbability: number;
  dismissedByUser: boolean;
  falseAlarm: string | null;
};

export type UserHomeLink = {
  uid: string;
  hid: string;
  role: "owner" | "member";
};