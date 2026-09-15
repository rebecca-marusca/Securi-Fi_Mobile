"""
seed_nodes.py — pushes fake node docs into Firestore (nodes/{hid}_{nodeId}).

Matches NodeDoc (models.py): hid, nodeId, nickname, role, batteryPct,
reportType, sensorReading, movementPct, warningType, armed, requestedArmed
(+ requestedRestart / requestedShutDown, which are only ever cleared to
False server-side in what we've seen so far — included here as False).

Usage:
    pip install firebase-admin --break-system-packages
    python seed_nodes.py
"""

from seed_config import db, HID, NODE_IDS

nodes = [
    {
        "nodeId": NODE_IDS[0],
        "hid": HID,
        "nickname": "Living Room",
        "role": "master",
        "batteryPct": 92,
        "reportType": None,
        "sensorReading": 118,
        "movementPct": 2,
        "warningType": None,
        "armed": True,
        "requestedArmed": True,     # in sync — settled "armed" state
        "requestedRestart": False,
        "requestedShutDown": False,
    },
    {
        "nodeId": NODE_IDS[1],
        "hid": HID,
        "nickname": "Front Door",
        "role": "slave",
        "batteryPct": 41,
        "reportType": "low_battery",   # exercises the low-battery status branch
        "sensorReading": 165,
        "movementPct": 28,
        "warningType": None,
        "armed": False,
        "requestedArmed": True,     # mismatch — exercises the "Arming…" UI state
        "requestedRestart": False,
        "requestedShutDown": False,
    },
    {
        "nodeId": NODE_IDS[2],
        "hid": HID,
        "nickname": "Kitchen",
        "role": "slave",
        "batteryPct": 77,
        "reportType": None,
        "sensorReading": 612,
        "movementPct": 5,
        "warningType": "gas_leak",     # exercises the hazard-warning status branch
        "armed": False,
        "requestedArmed": False,    # in sync — settled "disarmed" state
        "requestedRestart": False,
        "requestedShutDown": False,
    },
]


def main():
    batch = db.batch()
    nodes_ref = db.collection("nodes")

    for node in nodes:
        doc_id = f"{HID}_{node['nodeId']}"
        batch.set(nodes_ref.document(doc_id), node)

    batch.commit()
    print(f"Seeded {len(nodes)} node docs for hid={HID}")


if __name__ == "__main__":
    main()