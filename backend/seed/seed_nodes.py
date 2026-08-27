"""
seed_nodes.py — pushes fake node docs into Firestore (nodes/{hid}_{nodeId}).

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
        "warnings": {
            "lowBattery": False,
            "notTransmitting": False,
            "signalWeak": False,
        },
        "armed": True,
        "requestedArmed": True,   # in sync — settled "armed" state
    },
    {
        "nodeId": NODE_IDS[1],
        "hid": HID,
        "nickname": "Front Door",
        "role": "slave",
        "warnings": {
            "lowBattery": True,   # exercise the low-battery warning UI
            "notTransmitting": False,
            "signalWeak": False,
        },
        "armed": True,
        "requestedArmed": True,  # mismatch — exercises "Arming…" UI state
    },
    {
        "hid": HID,
        "nickname": "Kitchen",
        "role": "slave",
        "warnings": {
            "lowBattery": False,
            "notTransmitting": False,
            "signalWeak": True,   # exercise the weak-signal warning UI
        },
        "armed": True,
        "requestedArmed": True,  # in sync — settled "disarmed" state
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