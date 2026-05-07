from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class SingleTrunkSidePayload(BaseModel):
    """Response model for outbound trunks endpoints."""

    success: bool
    data: Dict[str, Any]


class CreateOutboundTrunkRequest(BaseModel):
    """Request model for creating a new outbound SIP trunk."""

    name: str
    address: str
    numbers: List[str]
    transport: str  # "udp", "tcp", or "tls"
    auth_username: str
    auth_password: str


class CreateOutboundTrunkResponse(BaseModel):
    """Response model for outbound trunk creation operations."""

    success: bool
    message: str
    trunk_id: str


class UpdateOutboundTrunkUnifiedRequest(BaseModel):
    """Request model for unified outbound trunk updates.

    Mirrors the inbound unified update style: list fields are sent as add/remove
    diffs and scalar fields are included only when changed.
    """

    trunk_id: str
    name: Optional[str] = None
    metadata: Optional[str] = None
    address: Optional[str] = None
    transport: Optional[str] = None  # "udp", "tcp", or "tls"
    auth_username: Optional[str] = None
    auth_password: Optional[str] = None
    add_numbers: Optional[List[str]] = None
    remove_numbers: Optional[List[str]] = None


class UpdateOutboundTrunkResponse(BaseModel):
    """Response model for outbound trunk update operations."""

    success: bool
    message: str
    trunk: Dict[str, Any]


class DeleteOutboundTrunkResponse(BaseModel):
    """Response model for deleting an outbound trunk."""

    success: bool
    message: str
    trunk_id: str
