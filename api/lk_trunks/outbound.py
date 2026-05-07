from fastapi import APIRouter, HTTPException

from models.lk_trunks.outbound import (
    CreateOutboundTrunkRequest,
    CreateOutboundTrunkResponse,
    SingleTrunkSidePayload,
    DeleteOutboundTrunkResponse,
    UpdateOutboundTrunkResponse,
    UpdateOutboundTrunkUnifiedRequest,
)
from services.lk_trunks import outbound as trunks_service

router = APIRouter(
    prefix="/lk-trunks/outbound", tags=["lk-trunks-outbound"]
)  # /api/v1/lk-trunks/outbound


@router.post("", response_model=CreateOutboundTrunkResponse)
async def create_outbound_trunk(request: CreateOutboundTrunkRequest):
    """Create a new outbound SIP trunk in LiveKit."""

    try:
        result = await trunks_service.create_outbound_trunk(request)
        return result
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("", response_model=SingleTrunkSidePayload)
async def list_outbound_trunks():
    """List outbound SIP trunks from LiveKit."""

    try:
        data = await trunks_service.list_outbound_trunks()
        return {"success": True, "data": data}
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch outbound trunks from LiveKit: {exc}",
        ) from exc


@router.put("/update-unified", response_model=UpdateOutboundTrunkResponse)
async def update_outbound_trunk_unified(request: UpdateOutboundTrunkUnifiedRequest):
    """Unified outbound trunk update.

    Accepts scalar field changes plus numbers add/remove diffs and applies them
    in a single LiveKit update.
    """

    try:
        result = await trunks_service.update_outbound_trunk_unified(request)
        return result
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete("/{trunk_id}", response_model=DeleteOutboundTrunkResponse)
async def delete_outbound_trunk(trunk_id: str):
    """Delete an outbound trunk from LiveKit."""

    try:
        await trunks_service.delete_outbound_trunk(trunk_id)
        return {
            "success": True,
            "message": f"Outbound trunk with ID {trunk_id} deleted successfully.",
            "trunk_id": trunk_id,
        }
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
