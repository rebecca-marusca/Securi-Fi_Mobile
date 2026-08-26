from fastapi import APIRouter, Depends, HTTPException
from deps import get_current_uid
from schemas import DismissEventRequest
import database as db

router = APIRouter(prefix="/events", tags=["events"])

@router.post("/{eid}/dismiss")
async def dismiss_event(eid: str, body: DismissEventRequest, uid: str = Depends(get_current_uid)):
    event = db.get_event(eid)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if not db.user_is_linked_to_home(uid, event["hid"]):
        raise HTTPException(status_code=403, detail="Not linked to this home")
    
    db.dismiss_event(eid, false_alarm_description=body.false_alarm)
    return {"eid": eid, "dismissed": True}
