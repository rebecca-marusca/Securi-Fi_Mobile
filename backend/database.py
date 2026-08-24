import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone
from typing import Optional

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

print("[Backend DB] Firebase connected :D")


# ============================================================
# Users
# ============================================================

def create_user_profile(uid: str, email: str, phone_number: str, display_name: str = ""):
    db.collection("users").document(uid).set({
        "email": email,
        "phoneNumber": phone_number,
        "displayName": display_name,
        "photoURL": None,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "fcmTokens": [],
    }, merge=True)


def get_user_profile(uid: str) -> Optional[dict]:
    doc = db.collection("users").document(uid).get()
    return doc.to_dict() if doc.exists else None


def add_fcm_token(uid: str, token: str):
    db.collection("users").document(uid).update({
        "fcmTokens": firestore.ArrayUnion([token])
    })


def remove_fcm_token(uid: str, token: str):
    db.collection("users").document(uid).update({
        "fcmTokens": firestore.ArrayRemove([token])
    })


# ============================================================
# Homes
# ============================================================

def get_home_by_mac(master_mac: str) -> Optional[dict]:
    query = db.collection("homes").where("masterMac", "==", master_mac).limit(1).stream()
    for doc in query:
        return {"hid": doc.id, **doc.to_dict()}
    return None


def get_home(hid: str) -> Optional[dict]:
    doc = db.collection("homes").document(hid).get()
    return doc.to_dict() if doc.exists else None


def set_requested_armed(hid: str, requested_armed: bool):
    # The server watches this field and relays the command to hardware.
    db.collection("homes").document(hid).update({"requestedArmed": requested_armed})


# ============================================================
# User <-> Home links
# ============================================================

def link_user_to_home(uid: str, hid: str, role: str = "owner"):
    db.collection("userHomeLinks").document(f"{uid}_{hid}").set({
        "uid": uid,
        "hid": hid,
        "role": role,
    })


def unlink_user_from_home(uid: str, hid: str):
    db.collection("userHomeLinks").document(f"{uid}_{hid}").delete()


def get_link(uid: str, hid: str) -> Optional[dict]:
    doc = db.collection("userHomeLinks").document(f"{uid}_{hid}").get()
    return doc.to_dict() if doc.exists else None


def user_is_linked_to_home(uid: str, hid: str) -> bool:
    return get_link(uid, hid) is not None


def get_homes_for_user(uid: str) -> list[dict]:
    links = db.collection("userHomeLinks").where("uid", "==", uid).stream()
    return [link.to_dict() for link in links]


# ============================================================
# Nodes
# ============================================================

def get_node(hid: str, node_id: str) -> Optional[dict]:
    doc = db.collection("nodes").document(f"{hid}_{node_id}").get()
    return doc.to_dict() if doc.exists else None

def rename_node(hid: str, node_id: str, nickname: str):
    db.collection("nodes").document(f"{hid}_{node_id}").update({"nickname": nickname})


# ============================================================
# Events
# ============================================================

def dismiss_event(eid: str, false_alarm_description: Optional[str] = None):
    update_data = {"dismissedByUser": True}
    if false_alarm_description is not None:
        update_data["falseAlarm"] = false_alarm_description
    db.collection("events").document(eid).update(update_data)
    
def get_event(eid: str) -> Optional[dict]:
    doc = db.collection("events").document(eid).get()
    return doc.to_dict() if doc.exists else None