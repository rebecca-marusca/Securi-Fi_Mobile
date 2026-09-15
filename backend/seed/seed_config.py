"""
seed_config.py — shared constants AND the shared Firebase app/client.
Every seed_*.py script imports `db` from here instead of initializing
its own app, so seed_all.py can import all of them without hitting a
"default app already exists" error.
"""

import firebase_admin
from firebase_admin import credentials, firestore

SERVICE_ACCOUNT_PATH = "../serviceAccountKey.json"
HID = "stefan"
MASTER_MAC = "58:E6:C5:12:05:E0"  # must match the node with role="master"
NODE_IDS = ["stefannode_1", "stefannode_2", "stefannode_3"]

if not firebase_admin._apps:
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()