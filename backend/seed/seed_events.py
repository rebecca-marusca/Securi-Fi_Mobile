"""
seed_events.py — pushes fake events into home_events/{HID}/events/{eid},
each with a chunks/{cid} subcollection matching the current schema.

Matches EventDoc (models.py): hid, eventType, startedAt, endedAt,
falseAlarm, falseAlarmDescription. No more nodeId/rawReading on the event
doc itself — per-node hazard detail now lives inside each package.

Chunk packages reuse the exact same CacheEntry shape as seed_cache.py
(packagePct, isAlarm, timestamp, nodes-as-a-map) — chunks are just
flushed batches of what was in the live cache.

NOTE: eventType is seeded here as camelCase ("gasLeak"), matching
types/firestore.ts and the app's switch statements. Stefan's EventDoc
docstring says "gas_leak" (snake_case) — confirm which one his server
actually writes before relying on this for cross-system integration
testing, not just UI testing. See the flag in chat for details.

NOTE: `summary` (the condensed post-event description) is seeded here
as an example of the shape discussed for Timeline, but close_event()
doesn't compute/write it yet server-side as of the last database.py
you shared — remove this field from real usage until that ships.

Usage:
    pip install firebase-admin --break-system-packages
    python seed_events.py
"""

import uuid
from datetime import datetime, timedelta, timezone

from seed_config import db, HID, NODE_IDS

now = datetime.now(timezone.utc)


def ts(minutes_ago: int = 0, seconds_ago: int = 0) -> datetime:
    return now - timedelta(minutes=minutes_ago, seconds=seconds_ago)


def make_package(when: datetime, package_pct: int, is_alarm: bool, node_overrides: dict) -> dict:
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
        "timestamp": when,
        "nodes": nodes,
    }


def write_chunks(eid: str, chunks: list[list[dict]]):
    """chunks: list of package-lists — each inner list becomes one chunk doc."""
    for i, packages in enumerate(chunks):
        cid = f"{i:05d}"
        (
            db.collection("home_events").document(HID)
            .collection("events").document(eid)
            .collection("chunks").document(cid)
            .set({
                "savedAt": packages[-1]["timestamp"] if packages else now,
                "packages": packages,
            })
        )


# --- Event 1: ACTIVE intrusion, in progress right now ---
intrusion_eid = str(uuid.uuid4())
intrusion_event = {
    "hid": HID,
    "eventType": "intrusion",
    "startedAt": ts(minutes_ago=60),
    "endedAt": ts(minutes_ago=15),
    "falseAlarm": False,
    "falseAlarmDescription": None,
    "summary": [
        {"timestamp": ts(minutes_ago=60), "description": "First detection of movement, near Bedroom"},
        {"timestamp": ts(minutes_ago=35), "description": "Most amount of movement detected: 98%"},
        {"timestamp": ts(minutes_ago=15), "description": "Sensors returned to normal, movement ceased."},
    ],
}
# --- Event 0: ACTIVE intrusion, chunks ---
intrusion_chunks = [
    [
        make_package(ts(minutes_ago=60, seconds_ago=-i), 20 + i * 5, i > 3, {
            NODE_IDS[1]: {"movementPct": 10 + i * 8},
        })
        for i in range(0, 12)
    ],
]

# --- Event 2: CLOSED fire event, resolved ---
fire_eid = str(uuid.uuid4())
fire_event = {
    "hid": HID,
    "eventType": "fire",
    "startedAt": ts(minutes_ago=180),
    "endedAt": ts(minutes_ago=175),
    "falseAlarm": False,
    "falseAlarmDescription": None,
    # Speculative — see NOTE above. Remove until close_event() actually writes this.
    "summary": [
        {"timestamp": ts(minutes_ago=180), "description": "First detection of flame/smoke"},
        {"timestamp": ts(minutes_ago=177), "description": "Highest reading: 79%"},
        {"timestamp": ts(minutes_ago=175), "description": "Sensors returned to normal"},
    ],
}
fire_chunks = [
    [
        make_package(ts(minutes_ago=180, seconds_ago=-i), 80 + i, i > 2, {
            NODE_IDS[0]: {"warningType": "fire", "sensorReading": 340 + i},
        })
        for i in range(0, 10)
    ],
]

# --- Event 3: CLOSED gas leak, dismissed as a false alarm ---
gas_eid = str(uuid.uuid4())
gas_event = {
    "hid": HID,
    "eventType": "gasLeak",
    "startedAt": ts(minutes_ago=60 * 24),
    "endedAt": ts(minutes_ago=60 * 24 - 8),
    "falseAlarm": True,
    "falseAlarmDescription": "Aerosol spray near the Kitchen node, not an actual leak.",
}
gas_chunks = [
    [
        make_package(ts(minutes_ago=60 * 24, seconds_ago=-i), 60, False, {
            NODE_IDS[2]: {"warningType": "gas_leak", "sensorReading": 480 + i * 5},
        })
        for i in range(0, 10)
    ],
]

events = [
    (intrusion_eid, intrusion_event, intrusion_chunks),
    (fire_eid, fire_event, fire_chunks),
    (gas_eid, gas_event, gas_chunks),
]


def main():
    batch = db.batch()
    events_ref = db.collection("home_events").document(HID).collection("events")

    for eid, event, _ in events:
        batch.set(events_ref.document(eid), event)

    batch.commit()

    for eid, _, chunks in events:
        write_chunks(eid, chunks)

    # Point the home doc at the active event, so Alert screen has something
    # to pick up. Comment out if you want a "no active alert" state instead.
    db.collection("homes").document(HID).update({"activeEventId": intrusion_eid})

    print(f"Seeded {len(events)} events for hid={HID}")
    print(f"  intrusion_eid={intrusion_eid} (intrusion, in progress)")
    print(f"  fire_eid={fire_eid} (closed)")
    print(f"  gas_eid={gas_eid} (closed, false alarm)")


if __name__ == "__main__":
    main()