from fastapi import APIRouter, Depends, HTTPException
from deps import get_current_uid
from schemas import PairHomeRequest, PairHomeResponse
import database as db

router = APIRouter(prefix="/homes", tags=["homes"])


@router.post("/pair", response_model=PairHomeResponse, status_code=201)
async def pair_home(body: PairHomeRequest, uid: str = Depends(get_current_uid)):
    home = db.get_home_by_mac(body.master_mac)

    if home is None:
        # The home doc is created by the server the first time hardware
        # sends telemetry — if it's not found, the device likely hasn't
        # powered on / connected to the broker yet, not a user error.
        raise HTTPException(
            status_code=404,
            detail="No device found with that MAC address. Make sure it's powered on and connected."
        )

    hid = home["hid"]
    existing_link = db.get_link(uid, hid)
    if existing_link is not None:
        raise HTTPException(status_code=409, detail="You're already linked to this home.")

    db.link_user_to_home(uid, hid, role="owner")

    return PairHomeResponse(hid=hid, master_mac=body.master_mac, role="owner")


@router.post("/{hid}/arm")
async def arm_home(hid: str, uid: str = Depends(get_current_uid)):
    if not db.user_is_linked_to_home(uid, hid):
        raise HTTPException(status_code=403, detail="Not linked to this home")
    db.set_nodes_requested_armed(hid, True)
    return {"status": "requested", "requestedArmed": True}


@router.post("/{hid}/disarm")
async def disarm_home(hid: str, uid: str = Depends(get_current_uid)):
    if not db.user_is_linked_to_home(uid, hid):
        raise HTTPException(status_code=403, detail="Not linked to this home")
    db.set_nodes_requested_armed(hid, False)
    return {"status": "requested", "requestedArmed": False}