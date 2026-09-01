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
    {
        "hid": HID,
        "type": "intrusion",
        "startedAt": ts(15),
        "dismissedByUser": False,
        "falseAlarm": False,
        "endedAt": ts(8)
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
    # --- Fire
    {
        "hid": HID,
        "type": "fire",
        "startedAt": ts(60 * 24 * 29),
        "nodeId": NODE_IDS[0],
        "rawReading": 312.5,
        "dismissedByUser": False,
        "falseAlarm": False,
        "endedAt": ts(60 * 24 * 29 - 10),
    },
    # --- Gas leak 
    {
        "hid": HID,
        "type": "gasLeak",
        "startedAt": ts(60 * 24 * 70),
        "nodeId": NODE_IDS[2],
        "rawReading": 540.2,
        "dismissedByUser": False,
        "falseAlarm": False,
        "endedAt": ts(60 * 24 * 70 - 4),
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