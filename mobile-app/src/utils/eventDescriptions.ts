import type { TimelineDescriptionLine } from "@/types/timeline";
import type { CacheEntry, CacheNodeReading } from "@/types/firestore";

export function formatPackageTime(timestamp?: string): string {
  if (!timestamp) return "Time unavailable";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return timestamp;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function friendlyWarning(warning?: string | null): string | null {
  if (!warning) return null;
  return warning.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function bold(text: string): TimelineDescriptionLine["parts"][number] {
  return { text, bold: true };
}

export function text(text: string): TimelineDescriptionLine["parts"][number] {
  return { text };
}

export function getNodeDisplayName(nodeId?: string, nodeNameMap?: Record<string, string>): string {
  if (!nodeId) return "";
  return nodeNameMap?.[nodeId] || `Node ${nodeId}`;
}

function getNodeEntries(pkg: CacheEntry): Array<[string, CacheNodeReading]> {
  const nodes = pkg.nodes as unknown;
  if (Array.isArray(nodes)) {
    return nodes
      .filter((reading): reading is CacheNodeReading & { nodeId: string } =>
        typeof reading?.nodeId === "string"
      )
      .map((reading) => [reading.nodeId, reading]);
  }

  return Object.entries((nodes ?? {}) as Record<string, CacheNodeReading>).map(
    ([nodeId, reading]) => {
      const readingWithId = reading as CacheNodeReading & { nodeId?: string };
      return [readingWithId.nodeId || nodeId, reading];
    }
  );
}

/**
 * Describes a single node's reading within a CacheEntry.
 * Checks warningType ("fire", "gas_leak") and movementPct.
 */
export function describeNodeReading(
  nodeId: string,
  reading: CacheNodeReading,
  nodeNameMap: Record<string, string>
): TimelineDescriptionLine["parts"] | null {
  const nodeName = getNodeDisplayName(nodeId, nodeNameMap);

  if (reading.warningType === "fire") {
    return [bold(nodeName), text(" detected "), bold("flame or smoke"), text(".\n")];
  }
  if (reading.warningType === "gas_leak") {
    return [bold(nodeName), text(" detected "), bold("gas"), text(".\n")];
  }
  if (reading.movementPct > 0) {
    return [
      bold(nodeName),
      text(" registered "),
      bold(`${reading.movementPct}%`),
      text(` movement`),
      text(".\n"),
    ];
  }
  return null;
}

/**
 * Produces a single description line for one CacheEntry (telemetry package).
 * Iterates nodes as a Record<nodeId, CacheNodeReading>.
 */
export function describePackage(
  pkg: CacheEntry,
  nodeNameMap: Record<string, string>
): TimelineDescriptionLine {
  const observations: TimelineDescriptionLine["parts"][] = [];

  // Surface the most severe warning across all nodes for the timestamp line
  const allNodes = getNodeEntries(pkg);
  const topWarning = allNodes
    .map(([, r]) => r.warningType)
    .find((w) => w != null) ?? null;
  const warningLabel = friendlyWarning(topWarning);

  for (const [nodeId, reading] of allNodes) {
    const observation = describeNodeReading(nodeId, reading, nodeNameMap);
    if (observation) observations.push(observation);
  }

  return {
    parts: [
      bold(formatPackageTime(pkg.timestamp)),
      text("  "),
      ...(warningLabel ? [bold(warningLabel), bold(":\n")] : []),
      ...(observations.length
        ? observations.flatMap((obs) => [...obs])
        : [text("Sensors continued monitoring.")]),
    ],
  };
}

/**
 * Sorts and describes a flat list of CacheEntry packages.
 * Used by both the finished-event flow (timeline.tsx, packages from chunks)
 * and the live flow (alert screen, packages from chunks + on-demand cache).
 *
 * NOTE: In a future update a colleague will replace this with a highlights-only
 * summary for finished events displayed in the timeline.
 */
export function buildPlayByPlayFromPackages(
  packages: CacheEntry[],
  nodeNameMap: Record<string, string>
): TimelineDescriptionLine[] {
  const sorted = [...packages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (!sorted.length) {
    return [{ parts: [text("No sensor samples were saved for this event.")] }];
  }

  return sorted.map((pkg) => describePackage(pkg, nodeNameMap));
}