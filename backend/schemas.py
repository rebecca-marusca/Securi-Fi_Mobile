from datetime import datetime
from enum import Enum
import re
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

MAC_PATTERN = re.compile(r"^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$")

class PairHomeRequest(BaseModel):
    master_mac: str

    @field_validator("master_mac")
    @classmethod
    def validate_mac_format(cls, v: str) -> str:
        v = v.strip().upper()
        if not MAC_PATTERN.match(v):
            raise ValueError("master_mac must be a valid MAC address, e.g. 58:E6:C5:12:05:E0")
        return v


class PairHomeResponse(BaseModel):
    hid: str
    master_mac: str
    role: str
    
class RenameNodeRequest(BaseModel):
    nickname: str

    @field_validator("nickname")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("nickname cannot be empty")
        if len(v) > 20:
            raise ValueError("nickname must be 20 characters or fewer")
        return v
    
class DismissEventRequest(BaseModel):
    false_alarm: Optional[str] = None
    
class FcmTokenRequest(BaseModel):
    token: str
    
class EventType(str, Enum):
    INTRUSION = "intrusion"
    FIRE = "fire"
    GAS_LEAK = "gasLeak"
    NODE_STATUS = "nodeStatus"
    
class EventDoc(BaseModel):
    hid: str
    type: EventType
    started_at: datetime = Field(alias="startedAt")
    ended_at: Optional[datetime] = Field(None, alias="endedAt")
    peak_probability: Optional[float] = Field(None, alias="peakProbability")
    avg_probability: Optional[float] = Field(None, alias="avgProbability")
    dismissed_by_user: Optional[bool] = Field(None, alias="dismissedByUser")
    false_alarm: Optional[bool] = Field(None, alias="falseAlarm")
    node_id: Optional[str] = Field(None, alias="nodeId")
    node_action: Optional[str] = Field(None, alias="nodeAction")

    model_config = ConfigDict(populate_by_name=True)
    
