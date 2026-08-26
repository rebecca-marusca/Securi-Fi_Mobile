from fastapi import APIRouter, Depends
from deps import get_current_uid
from schemas import FcmTokenRequest
import database as db

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/me/fcm-token")
async def register_fcm_token(body: FcmTokenRequest, uid: str = Depends(get_current_uid)):
    db.add_fcm_token(uid, body.token)
    return {"status": "registered"}

@router.delete("/me/fcm-token")
async def unregister_fcm_token(body: FcmTokenRequest, uid: str = Depends(get_current_uid)):
    db.remove_fcm_token(uid, body.token)
    return {"status": "removed"}