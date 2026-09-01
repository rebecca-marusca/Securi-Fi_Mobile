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
        # endedAt intentionally omitted — represents "still active"
    }
]


def main():
    batch = db.batch()
    events_ref = db.collection("events")
    active_eid = None

    for event in events:
        doc_ref = events_ref.document()  # auto-generated eid
        batch.set(doc_ref, event)

        # If this event is active (no endedAt and not dismissed), pick its ID
        if not event.get("endedAt") and not event.get("dismissedByUser") and active_eid is None:
            active_eid = doc_ref.id

    batch.commit()

    # Update the home document's activeEventId field
    db.collection("homes").document(HID).update({
        "activeEventId": active_eid
    })
    print(f"Seeded {len(events)} events into 'events' collection for hid={HID}")
    print(f"Updated homes/{HID} with activeEventId={active_eid}")


if __name__ == "__main__":
    main()