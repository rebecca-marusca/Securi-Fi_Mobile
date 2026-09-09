import type { TimelineDescriptionLine } from "@/types/timeline";
import type { CacheEntry, CacheNodeReading, Timestamp } from "@/types/firestore";

export function toDate(timestamp: Timestamp | string | Date): Date {
  if (timestamp instanceof Date) return timestamp;
  if (typeof (timestamp as any)?.toDate === "function") return (timestamp as any).toDate();
  if (typeof (timestamp as any)?.seconds === "number") return new Date((timestamp as any).seconds * 1000);
  return new Date(timestamp as string);
}

export function timestampToMillis(timestamp?: Timestamp | string | Date | null): number {
  if (!timestamp) return 0;
  const date = toDate(timestamp);
  return isNaN(date.getTime()) ? 0 : date.getTime();
}

export function formatPackageTime(timestamp?: Timestamp | string): string {
  if (!timestamp) return "Time unavailable";
  const date = toDate(timestamp);
  if (isNaN(date.getTime())) return "Time unavailable";
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

function getNodeDisplayName(nodeId: string, nodeNameMap: Record<string, string>): string {
  return nodeNameMap[nodeId] || `Node ${nodeId}`;
}

function describeNodeReading(
  nodeId: string,
  reading: CacheNodeReading,
  nodeNameMap: Record<string, string>
): TimelineDescriptionLine["parts"] | null {
  const nodeName = getNodeDisplayName(nodeId, nodeNameMap);

  if (reading.warningType === "fire") return [bold(nodeName), text(" detected "), bold("flame or smoke"), text(".\n")];
  if (reading.warningType === "gas_leak") return [bold(nodeName), text(" detected "), bold("gas"), text(".\n")];
  if (reading.movementPct > 0) {
    return [bold(nodeName), text(" registered "), bold(`${reading.movementPct}%`), text(" movement"), text(".\n")];
  }
  return null;
}

export function describePackage(pkg: CacheEntry, nodeNameMap: Record<string, string>): TimelineDescriptionLine {
  const observations: TimelineDescriptionLine["parts"][] = [];

  for (const [nodeId, reading] of Object.entries(pkg.nodes ?? {})) {
    const observation = describeNodeReading(nodeId, reading, nodeNameMap);
    if (observation) observations.push(observation);
  }

  return {
    parts: [
      bold(formatPackageTime(pkg.timestamp)),
      text("  "),
      ...(observations.length
        ? observations.flatMap((o) => o)
        : [text("Sensors continued monitoring.")]),
    ],
  };
}

export function buildPlayByPlayFromPackages(
  packages: CacheEntry[],
  nodeNameMap: Record<string, string>
): TimelineDescriptionLine[] {
  const sorted = [...packages].sort(
    (a, b) => toDate(a.timestamp).getTime() - toDate(b.timestamp).getTime()
  );

  if (!sorted.length) {
    return [{ parts: [text("No sensor samples were saved for this event.")] }];
  }

  return sorted.map((pkg) => describePackage(pkg, nodeNameMap));
}