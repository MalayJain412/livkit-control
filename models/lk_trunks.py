from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class TrunksPayload(BaseModel):
    """Wrapper around the raw trunks payloads from LiveKit.

    We keep this intentionally loose (Dict[str, Any]) because the LiveKit
    protobuf → dict structure may evolve, and the Admin UI can pick the
    fields it needs.
    """

    inbound: Dict[str, Any]
    outbound: Dict[str, Any]


class TrunksResponse(BaseModel):
    """Response model for the combined trunks endpoint."""

    success: bool
    data: TrunksPayload


class SingleTrunkSidePayload(BaseModel):
    """Response model for the single-side (inbound/outbound) endpoints."""

    success: bool
    data: Dict[str, Any]


class UpdateInboundTrunkRequest(BaseModel):
    """Request model for updating a trunk's configuration."""

    trunk_id: str
    numbers_to_add: Optional[List[str]] = None
    allowed_numbers: Optional[List[str]] = None
    name: Optional[str] = None


class UpdateInboundTrunkResponse(BaseModel):
    """Response model for trunk update operations."""

    status: bool
    message: str
    trunk_id: str
