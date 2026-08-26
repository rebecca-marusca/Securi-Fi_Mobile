"""
seed_nodes.py — pushes fake node docs into Firestore (nodes/{hid}_{nodeId})
so the app has something to render before real hardware is connected.

Usage:
    pip install firebase-admin --break-system-packages
    python seed_nodes.py

Uses the SAME HID and NODE_IDS as seed_events.py — keep these in sync so
the fire/gasLeak/nodeStatus events you already seeded reference nodes
that actually exist.
"""

import firebase_admin
from firebase_admin import credentials, firestore

# ---- CONFIG — fill these in (match seed_events.py) ----
SERVICE_ACCOUNT_PATH = "serviceAccountKey.json"
HID = "53dea655-eedb-4ef1-a261-efc7a7ff43db"
NODE_IDS = ["node_rebecca1", "node_rebecca2", "node_rebecca3"] 
# ---------------------------------------------------------

cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

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
    },
    {
        "nodeId": NODE_IDS[1],
        "hid": HID,
        "nickname": "Front Door",
        "role": "slave",
        "warnings": {
            "lowBattery": False,
            "notTransmitting": False,
            "signalWeak": False,
        },
    },
    {
        "nodeId": NODE_IDS[2],
        "hid": HID,
        "nickname": "Kitchen",
        "role": "slave",
        "warnings": {
            "lowBattery": False,
            "notTransmitting": False,
            "signalWeak": False,
        },
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