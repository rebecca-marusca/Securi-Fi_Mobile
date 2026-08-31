"""
seed_cache.py — creates/overwrites the live cache doc at cache/{HID},
matching the Cache/CacheReading types (overallReading + per-node nodeReadings).

This is the doc your Home screen reads for live sensor state — separate
from the events/nodes seed data, and meant to be re-run any time you want
to simulate a new "tick" of incoming telemetry.

Usage:
    pip install firebase-admin --break-system-packages
    python seed_cache.py
"""

from datetime import datetime, timezone

from seed_config import db, HID, NODE_IDS

now = datetime.now(timezone.utc)

node_readings = {
    # node_1 — master, calm/idle reading
    NODE_IDS[0]: {
        "nodeId": NODE_IDS[0],
        "state": "idle",
        "rawMq2Reading": 120,
        "movementPct": 2,
        "isAlarm": False,
        "sensors": {
            "flame": False,
            "gas": False,
            "batteryPct": 92,
        },
    },
    # node_2 — slightly elevated movement, still not a threat
    NODE_IDS[1]: {
        "nodeId": NODE_IDS[1],
        "state": "active",
        "rawMq2Reading": 165,
        "movementPct": 28,
        "isAlarm": False,
        "sensors": {
            "flame": False,
            "gas": False,
            "batteryPct": 41,   # matches lowBattery=True in seed_nodes.py
        },
    },
    # node_3 — high reading, gas sensor tripped (pairs with the active
    # gasLeak event in seed_events.py for a consistent live+timeline story)
    NODE_IDS[2]: {
        "nodeId": NODE_IDS[2],
        "state": "alert",
        "rawMq2Reading": 612,
        "movementPct": 5,
        "isAlarm": True,
        "sensors": {
            "flame": False,
            "gas": True,
            "batteryPct": 77,
        },
    },
}

cache = {
    "packages": [
        {
            "timestamp": now.isoformat(),
            "warningType": None,
            "isAlarm": False,
            "packageMovementPct": 12,
            "nodes": list(node_readings.values()),
        }
    ],
    "alarmCount": 0,
    "idleStreak": 10,
    "isAlarm": False,
    "nodeReadings": node_readings,
    "updatedAt": now,
}


def main():
    db.collection("cache").document(HID).set(cache)
    print(f"Seeded cache doc for hid={HID}")


if __name__ == "__main__":
    main()