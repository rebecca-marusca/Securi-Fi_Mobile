"""
seed_config.py — shared constants AND the shared Firebase app/client.
Every seed_*.py script imports `db` from here instead of initializing
its own app — needed so seed_all.py can import all scripts without
hitting a "default app already exists" error.
"""

import firebase_admin
from firebase_admin import credentials, firestore

SERVICE_ACCOUNT_PATH = "../serviceAccountKey.json"
HID = "53dea655-eedb-4ef1-a261-efc7a7ff43db"
MASTER_MAC = "AA:BB:CC:DD:EE:FF"  # must match the node with role="master"
NODE_IDS = ["node_rebecca1", "node_rebecca2", "node_rebecca3"]

if not firebase_admin._apps:
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()