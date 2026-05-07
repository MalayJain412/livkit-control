from fastapi import APIRouter, HTTPException

from models.lk_trunks.dispatch import (
    CreateDispatchRuleRequest,
    CreateDispatchRuleResponse,
    DeleteDispatchRuleResponse,
    DispatchRulesPayload,
    UpdateDispatchRuleRequest,
    UpdateDispatchRuleResponse,
)
from services.lk_trunks import dispatch as trunks_service

router = APIRouter(
    prefix="/lk-trunks/dispatch", tags=["lk-trunks-dispatch-rules"]
)  # /api/v1/lk-trunks/dispatch


@router.get("", response_model=DispatchRulesPayload)
async def list_dispatch_rules():
    """List dispatch rules from LiveKit."""

    try:
        # Placeholder for actual service call to fetch dispatch rules
        data = await trunks_service.list_dispatch_rules()
        return {"success": True, "data": data}
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch dispatch rules from LiveKit: {exc}",
        ) from exc


@router.post("", response_model=CreateDispatchRuleResponse)
async def create_dispatch_rule(request: CreateDispatchRuleRequest):
    """Create a new SIP dispatch rule in LiveKit."""

    try:
        result = await trunks_service.create_dispatch_rule(request)
        return result
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.delete("/{dispatch_rule_id}", response_model=DeleteDispatchRuleResponse)
async def delete_dispatch_rule(dispatch_rule_id: str):
    """Delete a SIP dispatch rule in LiveKit."""
    try:
        result = await trunks_service.delete_dispatch_rule(dispatch_rule_id)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/{dispatch_rule_id}", response_model=UpdateDispatchRuleResponse)
async def update_dispatch_rule(
    dispatch_rule_id: str, request: UpdateDispatchRuleRequest
):
    """Update (replace) a SIP dispatch rule in LiveKit."""

    try:
        return await trunks_service.update_dispatch_rule(dispatch_rule_id, request)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
