from fastapi import APIRouter, Depends, HTTPException
from deps import get_current_uid
from schemas import RenameNodeRequest
import database as db

router = APIRouter(prefix="/nodes", tags=["nodes"])


@router.patch("/{hid}/{node_id}")
async def rename_node(hid: str, node_id: str, body: RenameNodeRequest, uid: str = Depends(get_current_uid)):
    if not db.user_is_linked_to_home(uid, hid):
        raise HTTPException(status_code=403, detail="Not linked to this home")

    node = db.get_node(hid, node_id)
    if node is None:
        raise HTTPException(status_code=404, detail="Node not found")

    db.rename_node(hid, node_id, body.nickname)
    return {"hid": hid, "nodeId": node_id, "nickname": body.nickname}