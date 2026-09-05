from fastapi import APIRouter, Depends, HTTPException
from deps import get_current_uid
from schemas import RenameNodeRequest, NodeResponse, ArmNodeResponse, NodeActionResponse
import database as db

router = APIRouter(prefix="/nodes", tags=["nodes"])


@router.get("/{hid}", response_model=list[NodeResponse])
async def list_nodes(hid: str, uid: str = Depends(get_current_uid)):
    if not db.user_is_linked_to_home(uid, hid):
        raise HTTPException(status_code=403, detail="Not linked to this home")
    return db.get_nodes_for_home(hid)


@router.patch("/{hid}/{node_id}")
async def rename_node(hid: str, node_id: str, body: RenameNodeRequest, uid: str = Depends(get_current_uid)):
    if not db.user_is_linked_to_home(uid, hid):
        raise HTTPException(status_code=403, detail="Not linked to this home")

    node = db.get_node(hid, node_id)
    if node is None:
        raise HTTPException(status_code=404, detail="Node not found")

    db.rename_node(hid, node_id, body.nickname)
    return {"hid": hid, "nodeId": node_id, "nickname": body.nickname}


@router.post("/{hid}/{node_id}/arm", response_model=ArmNodeResponse)
async def arm_node(hid: str, node_id: str, uid: str = Depends(get_current_uid)):
    if not db.user_is_linked_to_home(uid, hid):
        raise HTTPException(status_code=403, detail="Not linked to this home")

    node = db.get_node(hid, node_id)
    if node is None:
        raise HTTPException(status_code=404, detail="Node not found")

    db.set_node_requested_armed(hid, node_id, True)
    return ArmNodeResponse(hid=hid, node_id=node_id, requested_armed=True)


@router.post("/{hid}/{node_id}/disarm", response_model=ArmNodeResponse)
async def disarm_node(hid: str, node_id: str, uid: str = Depends(get_current_uid)):
    if not db.user_is_linked_to_home(uid, hid):
        raise HTTPException(status_code=403, detail="Not linked to this home")

    node = db.get_node(hid, node_id)
    if node is None:
        raise HTTPException(status_code=404, detail="Node not found")

    db.set_node_requested_armed(hid, node_id, False)
    return ArmNodeResponse(hid=hid, node_id=node_id, requested_armed=False)


@router.post("/{hid}/{node_id}/restart", response_model=NodeActionResponse)
async def restart_node(hid: str, node_id: str, uid: str = Depends(get_current_uid)):
    if not db.user_is_linked_to_home(uid, hid):
        raise HTTPException(status_code=403, detail="Not linked to this home")
    if db.get_node(hid, node_id) is None:
        raise HTTPException(status_code=404, detail="Node not found")

    db.set_node_requested_action(hid, node_id, "restart")
    return NodeActionResponse(hid=hid, node_id=node_id, requested_restart=True)


@router.post("/{hid}/{node_id}/shutdown", response_model=NodeActionResponse)
async def shutdown_node(hid: str, node_id: str, uid: str = Depends(get_current_uid)):
    if not db.user_is_linked_to_home(uid, hid):
        raise HTTPException(status_code=403, detail="Not linked to this home")
    if db.get_node(hid, node_id) is None:
        raise HTTPException(status_code=404, detail="Node not found")

    db.set_node_requested_action(hid, node_id, "shut_down")
    return NodeActionResponse(hid=hid, node_id=node_id, requested_shut_down=True)
