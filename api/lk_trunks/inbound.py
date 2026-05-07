from fastapi import APIRouter, HTTPException

from models.lk_trunks.inbound import (
    CreateInboundTrunkRequest,
    CreateInboundTrunkResponse,
    SingleTrunkSidePayload,
    UpdateInboundTrunkResponse,
    UpdateInboundTrunkUnifiedRequest,
    DeleteInboundTrunkResponse,
)
from services.lk_trunks import inbound as trunks_service

router = APIRouter(
    prefix="/lk-trunks/inbound", tags=["lk-trunks-inbound"]
)  # /api/v1/lk-trunks/inbound


@router.post("", response_model=CreateInboundTrunkResponse)
async def create_inbound_trunk(request: CreateInboundTrunkRequest):
    """Create a new inbound SIP trunk in LiveKit."""

    try:
        result = await trunks_service.create_inbound_trunk(request)
        return result
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("", response_model=SingleTrunkSidePayload)
async def list_inbound_trunks():
    """List inbound SIP trunks from LiveKit."""

    try:
        data = await trunks_service.list_inbound_trunks()
        return {"success": True, "data": data}
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch inbound trunks from LiveKit: {exc}",
        ) from exc


@router.put("/update-unified", response_model=UpdateInboundTrunkResponse)
async def update_inbound_trunk_unified(
    request: UpdateInboundTrunkUnifiedRequest,
):
    """Update inbound trunk fields by applying add/remove list changes."""

    has_list_changes = any(
        (
            request.add_numbers,
            request.remove_numbers,
            request.add_allowed_numbers,
            request.remove_allowed_numbers,
            request.add_allowed_addresses,
            request.remove_allowed_addresses,
        )
    )
    if not has_list_changes and request.name is None and request.metadata is None:
        raise HTTPException(
            status_code=400,
            detail="No updates provided. Supply add/remove lists or name/metadata.",
        )

    try:
        result = await trunks_service.update_inbound_trunk_unified(request)
        return result
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete("/{trunk_id}", response_model=DeleteInboundTrunkResponse)
async def delete_inbound_trunk(trunk_id: str):
    """Delete an inbound trunk from LiveKit."""

    try:
        await trunks_service.delete_inbound_trunk(trunk_id)
        return {
            "success": True,
            "message": f"Inbound trunk with ID {trunk_id} deleted successfully.",
            "trunk_id": trunk_id,
        }
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
