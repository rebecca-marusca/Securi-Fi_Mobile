"""
seed_events.py — pushes fake intrusion / fire / gasLeak / nodeStatus events
into Firestore for frontend testing.

Usage:
    pip install firebase-admin --break-system-packages
    python seed_events.py

Fill in HID and NODE_IDS below before running — this does NOT create a
matching home doc, so point it at a home that already exists (or your
dev home) or the app's home-scoped listeners won't have anything to
attach the events to.
"""

from datetime import datetime, timedelta, timezone

import firebase_admin
from firebase_admin import credentials, firestore

# ---- CONFIG — fill these in ----
SERVICE_ACCOUNT_PATH = "serviceAccountKey.json"  # path to your backend's key
HID = "53dea655-eedb-4ef1-a261-efc7a7ff43db"
NODE_IDS = ["node_rebecca1", "node_rebecca2", "node_rebecca3"]  # replace with real node ids if you have them
# ---------------------------------

cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

now = datetime.now(timezone.utc)


def ts(minutes_ago: int) -> datetime:
    return now - timedelta(minutes=minutes_ago)


events = [
    # --- Intrusion: currently ACTIVE (no endedAt) ---
    {
        "hid": HID,
        "type": "intrusion",
        "startedAt": ts(2),
        "peakProbability": 0.91,
        "avgProbability": 0.78,
        "dismissedByUser": False,
        "falseAlarm": False,
        # endedAt intentionally omitted — represents "still active"
    },
    # --- Intrusion: past, dismissed, real ---
    {
        "hid": HID,
        "type": "intrusion",
        "startedAt": ts(180),
        "endedAt": ts(175),
        "peakProbability": 0.85,
        "avgProbability": 0.6,
        "dismissedByUser": True,
        "falseAlarm": False,
    },
    # --- Intrusion: past, dismissed, flagged as false alarm ---
    {
        "hid": HID,
        "type": "intrusion",
        "startedAt": ts(60 * 24),  # 1 day ago
        "endedAt": ts(60 * 24 - 5),
        "peakProbability": 0.42,
        "avgProbability": 0.3,
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
        # endedAt omitted — active
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
