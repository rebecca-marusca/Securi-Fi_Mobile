import re
from pydantic import BaseModel, field_validator

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