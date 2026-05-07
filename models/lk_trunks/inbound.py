from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class SingleTrunkSidePayload(BaseModel):
    """Response model for inbound trunks endpoints.

    We keep the trunk payload loose so the UI can adapt to
    the LiveKit protobuf → dict structure without tight coupling.
    """

    success: bool
    data: Dict[str, Any]


class CreateInboundTrunkRequest(BaseModel):
    """Request model for creating a new inbound trunk."""

    name: str
    numbers: List[str]
    krisp_enabled: bool = True


class CreateInboundTrunkResponse(BaseModel):
    """Response model for inbound trunk creation operations."""

    success: bool
    message: str


class UpdateInboundTrunkUnifiedRequest(BaseModel):
    """Request model for unified inbound trunk updates.

    Supports add/remove list operations, plus optional name/metadata updates.
    """

    trunk_id: str
    add_numbers: Optional[List[str]] = None
    remove_numbers: Optional[List[str]] = None
    add_allowed_numbers: Optional[List[str]] = None
    remove_allowed_numbers: Optional[List[str]] = None
    add_allowed_addresses: Optional[List[str]] = None
    remove_allowed_addresses: Optional[List[str]] = None
    name: Optional[str] = None
    metadata: Optional[str] = None


class UpdateInboundTrunkResponse(BaseModel):
    """Response model for inbound trunk update operations."""

    success: bool
    message: str
    trunk: Dict[str, Any]


class DeleteInboundTrunkResponse(BaseModel):
    """Response model for deleting an inbound trunk."""

    success: bool
    message: str
    trunk_id: str
