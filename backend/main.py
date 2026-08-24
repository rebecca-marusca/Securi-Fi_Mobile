import firebase_admin
from firebase_admin import credentials, auth as fb_auth, firestore
from fastapi import FastAPI, Header, HTTPException, Depends
from datetime import datetime, timezone
from routers import homes, nodes

cred = credentials.Certificate('serviceAccountKey.json')
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
db = firestore.client()

app = FastAPI()

app.include_router(homes.router)
app.include_router(nodes.router)


def user_is_linked_to_home(uid: str, hid: str) -> bool:
    link = db.collection("userHomeLinks").document(f"{uid}_{hid}").get()
    return link.exists