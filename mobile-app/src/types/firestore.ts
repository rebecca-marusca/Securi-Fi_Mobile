import type { Timestamp } from "@react-native-firebase/firestore";

// ─── Homes ────────────────────────────────────────────────────────────────────

export type Home = {
  masterMac: string;
  activeEventId: string | null;
  /** Written by the server on every telemetry tick — the most recent CacheEntry. */
  lastPackage?: CacheEntry | null;
  /** Set to true by the app to request a full in-memory cache dump to cache/{hid}. */
  requestedCache: boolean;
  lastSeen: Timestamp;
  registeredAt: Timestamp;
};

// ─── Nodes ────────────────────────────────────────────────────────────────────

/**
 * Flat telemetry fields written by the server into nodes/{hid}_{nodeId}.
 * The old nested `warnings` / `sensors` sub-objects are gone.
 */
export type Node = {
  hid: string;
  nodeId: string;
  nickname: string;
  role: "master" | "slave";

  /** Latest battery reading from telemetry (null if never received). */
  batteryPct: number | null;
  /** "low_battery" | "not_transmitting" | "signal_weak" | null */
  reportType: string | null;
  /** Latest raw MQ2 gas sensor reading. */
  sensorReading: number;
  /** Latest movement percentage (0-200). */
  movementPct: number;
  /** "fire" | "gas_leak" | null */
  warningType: string | null;

  armed: boolean;
  requestedArmed: boolean;
};

export type UserHomeLink = {
  uid: string;
  hid: string;
  role: "owner" | "member";
};

// ─── Cache ────────────────────────────────────────────────────────────────────

/**
 * Per-node snapshot within a CacheEntry — matches server's CacheNodeReadingDoc.
 * Keyed by nodeId in CacheEntry.nodes.
 */
export type CacheNodeReading = {
  batteryPct: number | null;
  /** "low_battery" | "not_transmitting" | "signal_weak" | null */
  reportType: string | null;
  sensorReading: number;
  movementPct: number;
  /** "fire" | "gas_leak" | null */
  warningType: string | null;
};

/**
 * One telemetry package summary — matches server's CacheEntry model.
 * Written to:
 *   - homes/{hid}.lastPackage  (latest only, on every tick)
 *   - cache/{hid}.packages[]   (full 60-entry ring, on demand)
 *   - home_events/{hid}/events/{eid}/chunks/{cid}.packages[]  (event history)
 */
export type CacheEntry = {
  packagePct: number;
  isAlarm: boolean;
  /** ISO-8601 string — server always writes datetime.isoformat() */
  timestamp: string;
  /** Keyed by nodeId */
  nodes: Record<string, CacheNodeReading>;
};

/** Full cache document written to cache/{hid} on demand. */
export type CacheDoc = {
  packages: CacheEntry[];
  updatedAt: Timestamp;
};

// ─── Events ───────────────────────────────────────────────────────────────────

type BaseEvent = {
  eid: string;
  hid: string;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  falseAlarm?: boolean | string | null;
  falseAlarmDescription?: string | null;
  dismissedByUser?: boolean;
};

type IntrusionEvent = BaseEvent & {
  eventType: "intrusion";
};

type HazardEvent = BaseEvent & {
  /**
   * Server writes "fire" and "gas_leak".
   * Older documents may have "gasLeak" — use normaliseEventType() to handle both.
   */
  eventType: "fire" | "gas_leak" | "gasLeak";
};

export type SecuriFiEvent = IntrusionEvent | HazardEvent;

/** Normalise legacy "gasLeak" → "gas_leak" for display logic. */
export function normaliseEventType(
  raw: string
): "intrusion" | "fire" | "gas_leak" {
  if (raw === "gasLeak") return "gas_leak";
  if (raw === "fire") return "fire";
  if (raw === "gas_leak") return "gas_leak";
  return "intrusion";
}

// ─── Event chunks ─────────────────────────────────────────────────────────────

export type Chunk = {
  cid: string;
  savedAt: Timestamp;
  packages: CacheEntry[];
};
