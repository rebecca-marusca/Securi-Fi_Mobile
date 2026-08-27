"""
seed_home.py — creates/overwrites the home doc at homes/{HID}.
Run this FIRST — the other seed scripts assume this home already exists.

Usage:
    pip install firebase-admin --break-system-packages
    python seed_home.py
"""

from datetime import datetime, timezone

from seed_config import db, HID, MASTER_MAC

now = datetime.now(timezone.utc)

home = {
    "masterMac": MASTER_MAC,
    "activeEventId": None,   # set to an eid manually if you want to test the "active alert" path
    "lastSeen": now,
    "registeredAt": now,
}


def main():
    db.collection("homes").document(HID).set(home)
    print(f"Seeded home doc for hid={HID}")


if __name__ == "__main__":
    main()