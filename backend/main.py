import firebase_admin
from firebase_admin import credentials, auth as fb_auth, firestore
from fastapi import FastAPI, Header, HTTPException, Depends
from datetime import datetime, timezone
from routers import homes, nodes, events, users
db = firestore.client()

app = FastAPI()

app.include_router(homes.router)
app.include_router(nodes.router)
app.include_router(events.router)
app.include_router(users.router)

def user_is_linked_to_home(uid: str, hid: str) -> bool:
    link = db.collection("userHomeLinks").document(f"{uid}_{hid}").get()
    return link.exists