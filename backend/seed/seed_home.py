"""
seed_home.py — creates/overwrites the home doc at homes/{HID}.
Run this FIRST — the other seed scripts assume this home already exists.

Matches HomeDoc (models.py): masterMac, activeEventId, requestedCache,
lastPackage, lastSeen, registeredAt.

Usage:
    pip install firebase-admin --break-system-packages
    python seed_home.py
"""

from datetime import datetime, timezone

from seed_config import db, HID, MASTER_MAC, NODE_IDS

now = datetime.now(timezone.utc)

# lastPackage mirrors a real CacheEntry — see seed_cache.py for the
# authoritative shape. Kept minimal/idle here since seed_cache.py's
# rolling window is the source of truth for "current" readings.
last_package = {
    "packagePct": 4,
    "isAlarm": False,
    "timestamp": now,
    "nodes": {
        NODE_IDS[0]: {
            "batteryPct": 92,
            "reportType": None,
            "sensorReading": 118,
            "movementPct": 2,
            "warningType": None,
        },
        NODE_IDS[1]: {
            "batteryPct": 92,
            "reportType": None,
            "sensorReading": 118,
            "movementPct": 2,
            "warningType": None,
        },
        NODE_IDS[2]: {
            "batteryPct": 92,
            "reportType": None,
            "sensorReading": 118,
            "movementPct": 2,
            "warningType": None,
        },
    },
}

home = {
    "masterMac": MASTER_MAC,
    "activeEventId": None,   # set to a real eid manually to simulate an active alert
    "requestedCache": False,
    "lastPackage": last_package,
    "lastSeen": now,
    "registeredAt": now,
}


def main():
    db.collection("homes").document(HID).set(home)
    print(f"Seeded home doc for hid={HID}")


if __name__ == "__main__":
    main()