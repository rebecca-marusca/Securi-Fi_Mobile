import type { TimelineDescriptionLine } from "@/types/timeline";
import type { ChunkPackage } from "@/types/firestore";

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

export function describeNodeReading(
  node: ChunkPackage["nodes"][number],
  nodeNameMap: Record<string, string>
): TimelineDescriptionLine["parts"] | null {
  const nodeName = getNodeDisplayName(node.nodeId, nodeNameMap);

  if (node.sensors?.flame) return [bold(nodeName), text(" detected "), bold("flame or smoke"), text(".\n")];
  if (node.sensors?.gas) return [bold(nodeName), text(" detected "), bold("gas"), text(".\n")];
  if (node.isAlarm) return [bold(nodeName), text(" reported an "), bold("alarm"), text(".\n")];
  if (node.movementPct > 0) {
    return [bold(nodeName), text(" registered "), bold(`${node.movementPct}%`), text(` movement`), text(".\n")];
  }
  return null;
}

export function describePackage(pkg: ChunkPackage, nodeNameMap: Record<string, string>): TimelineDescriptionLine {
  const observations: TimelineDescriptionLine["parts"][] = [];
  const warning = friendlyWarning(pkg.warningType ?? pkg.warning_type);

  for (const node of pkg.nodes ?? []) {
    const observation = describeNodeReading(node, nodeNameMap);
    if (observation) observations.push(observation);
  }

  return {
    parts: [
      bold(formatPackageTime(pkg.timestamp)),
      text("  "),
      ...(warning ? [bold(warning), bold(":\n")] : []),
      ...(observations.length
        ? observations.flatMap((observation) => [...observation])
        : [text("Sensors continued monitoring.")]),
    ],
  };
}

// Sorts and describes a flat list of packages — used by both the
// finished-event flow (timeline.tsx, packages from chunks) and the
// live flow (Alert screen, packages from chunks + the unflushed cache tail).
export function buildPlayByPlayFromPackages(
  packages: ChunkPackage[],
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