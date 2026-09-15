"""
seed_cache.py — creates/overwrites the live cache doc at cache/{HID}.

Matches Cache (types/firestore.ts) / what dump_cache_to_firestore actually
writes: just {packages: [CacheEntry], updatedAt} — no more alarmCount,
idleStreak, isAlarm, or nodeReadings at the top level; those were dropped
when Stefan moved to the in-memory cache + requestedCache/lastPackage flow.

Each CacheEntry.nodes is a MAP keyed by nodeId (not an array), matching
CacheNodeReadingDoc's flattened, no-nested-sensors shape.

Usage:
    pip install firebase-admin --break-system-packages
    python seed_cache.py
"""

from datetime import datetime, timedelta, timezone

from seed_config import db, HID, NODE_IDS

now = datetime.now(timezone.utc)


def ts(seconds_ago: int) -> datetime:
    return now - timedelta(seconds=seconds_ago)


def make_package(seconds_ago: int, package_pct: int, is_alarm: bool, node_overrides: dict) -> dict:
    """node_overrides: {node_id: {field: value, ...}} — merged over calm defaults."""
    defaults = {
        "batteryPct": 90,
        "reportType": None,
        "sensorReading": 120,
        "movementPct": 2,
        "warningType": None,
    }

    nodes = {}
    for node_id in NODE_IDS:
        reading = dict(defaults)
        reading.update(node_overrides.get(node_id, {}))
        nodes[node_id] = reading

    return {
        "packagePct": package_pct,
        "isAlarm": is_alarm,
        "timestamp": ts(seconds_ago),
        "nodes": nodes,
    }


# A rolling window telling a small story: calm, then a movement spike near
# the end — gives the live feed / Alert screen something to actually render.
packages = [
    make_package(9, 3, False, {}),
    make_package(8, 4, False, {}),
    make_package(7, 5, False, {NODE_IDS[1]: {"batteryPct": 41}}),
    make_package(6, 6, False, {NODE_IDS[1]: {"batteryPct": 41}}),
    make_package(5, 8, False, {NODE_IDS[1]: {"batteryPct": 41}}),
    make_package(
        4, 152, True,
        {
            NODE_IDS[0]: {"movementPct": 160},
            NODE_IDS[1]: {"movementPct": 145, "batteryPct": 41},
        },
    ),
    make_package(
        3, 168, True,
        {
            NODE_IDS[0]: {"movementPct": 175},
            NODE_IDS[1]: {"movementPct": 160, "batteryPct": 41},
        },
    ),
    make_package(
        2, 90, True,
        {
            NODE_IDS[2]: {"warningType": "gas_leak", "sensorReading": 612, "movementPct": 5},
        },
    ),
    make_package(1, 40, False, {NODE_IDS[1]: {"batteryPct": 41}}),
    make_package(0, 6, False, {NODE_IDS[1]: {"batteryPct": 41}}),
]

cache = {
    "packages": packages,
    "updatedAt": now,
}


def main():
    db.collection("cache").document(HID).set(cache)
    print(f"Seeded cache doc for hid={HID} ({len(packages)} packages)")


if __name__ == "__main__":
    main()