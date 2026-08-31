"""
seed_events.py — pushes fake intrusion / fire / gasLeak / nodeStatus events
into Firestore, matching the frontend SecuriFiEvent union (types/firestore.ts).

Usage:
    pip install firebase-admin --break-system-packages
    python seed_events.py
"""

from datetime import datetime, timedelta, timezone

from seed_config import db, HID, NODE_IDS

now = datetime.now(timezone.utc)


def ts(minutes_ago: int) -> datetime:
    return now - timedelta(minutes=minutes_ago)


events = [
    # --- Intrusion: currently ACTIVE (no endedAt) ---
    {
        "hid": HID,
        "type": "intrusion",
        "startedAt": ts(2),
        "dismissedByUser": False,
        "falseAlarm": False,
        "endedAt": ts(1)
    },
    # --- Intrusion
    {
        "hid": HID,
        "type": "intrusion",
        "startedAt": ts(180),
        "endedAt": ts(175),
        "dismissedByUser": False,
        "falseAlarm": False,
    },
    # --- Intrusion: past, dismissed, flagged as false alarm ---
    {
        "hid": HID,
        "type": "intrusion",
        "startedAt": ts(60 * 24),  # 1 day ago
        "endedAt": ts(60 * 24 - 5),
        "dismissedByUser": True,
        "falseAlarm": True,
    },
    # --- Fire: active ---
    {
        "hid": HID,
        "type": "fire",
        "startedAt": ts(10),
        "nodeId": NODE_IDS[0],
        "rawReading": 312.5,
        "dismissedByUser": False,
        "falseAlarm": False,
        "endedAt": ts(8),
    },
    # --- Fire: past, dismissed ---
    {
        "hid": HID,
        "type": "fire",
        "startedAt": ts(60 * 48),  # 2 days ago
        "endedAt": ts(60 * 48 - 3),
        "nodeId": NODE_IDS[1],
        "rawReading": 289.0,
        "dismissedByUser": True,
        "falseAlarm": False,
    },
    # --- Gas leak: active ---
    {
        "hid": HID,
        "type": "gasLeak",
        "startedAt": ts(5),
        "nodeId": NODE_IDS[2],
        "rawReading": 540.2,
        "dismissedByUser": False,
        "falseAlarm": False,
        "endedAt": ts(2),
    },
    # --- Gas leak: past, dismissed, false alarm ---
    {
        "hid": HID,
        "type": "gasLeak",
        "startedAt": ts(60 * 24 * 3),  # 3 days ago
        "endedAt": ts(60 * 24 * 3 - 8),
        "nodeId": NODE_IDS[0],
        "rawReading": 180.0,
        "dismissedByUser": True,
        "falseAlarm": True,
    },
    # --- Node status: nodes going on/off, scattered through the timeline ---
    {
        "hid": HID,
        "type": "nodeStatus",
        "startedAt": ts(30),
        "nodeId": NODE_IDS[0],
        "nodeAction": "on",
    },
    {
        "hid": HID,
        "type": "nodeStatus",
        "startedAt": ts(60 * 6),  # 6 hours ago
        "nodeId": NODE_IDS[1],
        "nodeAction": "off",
    },
    {
        "hid": HID,
        "type": "nodeStatus",
        "startedAt": ts(60 * 6 - 2),
        "nodeId": NODE_IDS[1],
        "nodeAction": "on",
    },
]


def main():
    batch = db.batch()
    events_ref = db.collection("events")

    for event in events:
        doc_ref = events_ref.document()  # auto-generated eid
        batch.set(doc_ref, event)

    batch.commit()
    print(f"Seeded {len(events)} events into 'events' collection for hid={HID}")


if __name__ == "__main__":
    main()