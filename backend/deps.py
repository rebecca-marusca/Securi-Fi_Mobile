## auth dependencies

from firebase_admin import auth as fb_auth
from fastapi import Header, HTTPException
from typing import Optional

async def get_current_uid(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed bearer token")
    token = authorization.removeprefix("Bearer ")
    try:
        decoded = fb_auth.verify_id_token(token)
        return decoded["uid"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")