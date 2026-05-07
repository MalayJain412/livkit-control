from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException

from dotenv import load_dotenv, find_dotenv
from google.protobuf.json_format import MessageToDict
from livekit import api

from livekit.protocol.sip import DeleteSIPDispatchRuleRequest

from api.lk_trunks.dispatch import (
    CreateDispatchRuleRequest,
    UpdateDispatchRuleRequest,
)

# Load LiveKit-related environment variables once
load_dotenv(find_dotenv())


def _proto_to_dict(message: Any) -> Dict[str, Any]:
    """Convert a protobuf message to a plain dict suitable for JSON responses."""

    return MessageToDict(message, preserving_proto_field_name=True)


async def _create_livekit_client() -> api.LiveKitAPI:
    """Create a LiveKit API client.

    Configuration (host, API key, secret) is expected to come from environment variables.
    """

    return api.LiveKitAPI()


async def list_dispatch_rules() -> Dict[str, Any]:
    """Return SIP dispatch rules from LiveKit as a JSON-serializable dict."""

    client = await _create_livekit_client()
    try:
        request = api.ListSIPDispatchRuleRequest()
        rules = await client.sip.list_sip_dispatch_rule(request)
        return _proto_to_dict(rules)
    finally:
        await client.aclose()


async def create_dispatch_rule(request: CreateDispatchRuleRequest) -> Dict[str, Any]:
    """Create a new SIP dispatch rule in LiveKit."""

    client = await _create_livekit_client()

    try:
        # 1 Build agents list
        agents = [
            api.RoomAgentDispatch(agent_name=a.agent_name, metadata=a.metadata or "")
            for a in request.agents
        ]

        # 2. Build the disaptch rule
        rule = api.SIPDispatchRule(
            dispatch_rule_individual=api.SIPDispatchRuleIndividual(
                room_prefix=request.room_prefix,
            )
        )

        # 3. Build request
        lk_request = api.CreateSIPDispatchRuleRequest(
            dispatch_rule=api.SIPDispatchRuleInfo(
                rule=rule,
                name=request.name,
                trunk_ids=request.trunk_ids,
                room_config=api.RoomConfiguration(agents=agents),
            )
        )

        # 4 Call Livekit API
        dispatch = await client.sip.create_sip_dispatch_rule(lk_request)

        dispatch_id = dispatch.sip_dispatch_rule_id

        return {
            "success": True,
            "message": "Dispatch rule created successfully",
            "dispatch_rule_id": dispatch_id,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LiveKit error: {str(e)}") from e

    finally:
        await client.aclose()


async def delete_dispatch_rule(sip_dispatch_rule_id: str) -> Dict[str, Any]:
    """Delete a SIP dispatch rule in LiveKit."""
    client = await _create_livekit_client()

    try:
        req = DeleteSIPDispatchRuleRequest(sip_dispatch_rule_id=sip_dispatch_rule_id)
        await client.sip.delete_dispatch_rule(req)

        return {
            "success": True,
            "message": f"Dispatch rule {sip_dispatch_rule_id} deleted successfully",
            "dispatch_rule_id": sip_dispatch_rule_id,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LiveKit error: {str(e)}")

    finally:
        await client.aclose()


def _extract_dispatch_rules_list(raw: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract dispatch rules array from the list response dict."""

    if not raw or not isinstance(raw, dict):
        return []

    # Most commonly: {"sip_dispatch_rules": [ ... ]}
    for key in ("sip_dispatch_rules", "rules", "items"):
        value = raw.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]

    return []


def _get_value(obj: Any, key: str, default: Any = None) -> Any:
    if isinstance(obj, dict):
        return obj.get(key, default)
    return default


def _parse_existing_rule_type(
    existing_rule: Dict[str, Any],
) -> Tuple[str, Dict[str, Any]]:
    """Return (type, config_dict) where type is 'direct' or 'individual'."""

    if not isinstance(existing_rule, dict):
        return ("individual", {"room_prefix": "call-"})

    direct = existing_rule.get("dispatch_rule_direct")
    if isinstance(direct, dict):
        return ("direct", direct)

    individual = existing_rule.get("dispatch_rule_individual")
    if isinstance(individual, dict):
        return ("individual", individual)

    # Default if shape is unexpected
    return ("individual", {"room_prefix": "call-"})


def _build_dispatch_rule(
    existing: Dict[str, Any], request: UpdateDispatchRuleRequest
) -> api.SIPDispatchRule:
    """Build SIPDispatchRule with safe merge of type-specific fields."""

    existing_rule = _get_value(existing, "rule") or {}
    existing_type, existing_cfg = _parse_existing_rule_type(existing_rule)

    # Explicit override: room_name provided => direct
    if request.room_name is not None:
        pin = request.pin
        if pin is None and existing_type == "direct":
            pin = _get_value(existing_cfg, "pin")

        return api.SIPDispatchRule(
            dispatch_rule_direct=api.SIPDispatchRuleDirect(
                room_name=request.room_name,
                pin=pin,
            )
        )

    # Explicit override: room_prefix provided => individual
    if request.room_prefix is not None:
        return api.SIPDispatchRule(
            dispatch_rule_individual=api.SIPDispatchRuleIndividual(
                room_prefix=request.room_prefix or "call-",
            )
        )

    # No explicit type fields provided: preserve existing rule type/config
    if existing_type == "direct":
        return api.SIPDispatchRule(
            dispatch_rule_direct=api.SIPDispatchRuleDirect(
                room_name=_get_value(existing_cfg, "room_name"),
                pin=_get_value(existing_cfg, "pin"),
            )
        )

    return api.SIPDispatchRule(
        dispatch_rule_individual=api.SIPDispatchRuleIndividual(
            room_prefix=_get_value(existing_cfg, "room_prefix") or "call-",
        )
    )


def _build_room_config(
    existing: Dict[str, Any], request: UpdateDispatchRuleRequest
) -> Optional[Any]:
    """Build RoomConfiguration.

    - If request.agents is None: preserve the existing room_config as-is.
    - If request.agents is provided: replace agents list entirely.
    """

    if request.agents is None:
        existing_room_config = _get_value(existing, "room_config")
        return existing_room_config

    agents = [
        api.RoomAgentDispatch(agent_name=a.agent_name, metadata=a.metadata or "")
        for a in (request.agents or [])
    ]
    return api.RoomConfiguration(agents=agents)


async def update_dispatch_rule(
    dispatch_rule_id: str,
    request: UpdateDispatchRuleRequest,
) -> Dict[str, Any]:
    """Update (replace) a SIP dispatch rule in LiveKit.

    Dispatch rules are treated as **full replace** operations. To prevent
    accidentally wiping fields, we first fetch the existing rule and merge any
    omitted fields, then send a complete SIPDispatchRuleInfo to
    update_sip_dispatch_rule.
    """

    client = await _create_livekit_client()
    try:
        # 1) Fetch existing rule
        list_resp = await client.sip.list_sip_dispatch_rule(
            api.ListSIPDispatchRuleRequest()
        )
        list_dict = _proto_to_dict(list_resp)
        rules = _extract_dispatch_rules_list(list_dict)

        existing = None
        for rule in rules:
            rule_id = rule.get("sip_dispatch_rule_id") or rule.get("dispatch_rule_id")
            if rule_id == dispatch_rule_id:
                existing = rule
                break

        if existing is None:
            raise HTTPException(
                status_code=404, detail=f"Dispatch rule not found: {dispatch_rule_id}"
            )

        # 2) Merge scalar fields
        name = (
            request.name if request.name is not None else _get_value(existing, "name")
        )
        metadata = (
            request.metadata
            if request.metadata is not None
            else _get_value(existing, "metadata")
        )
        trunk_ids = (
            request.trunk_ids
            if request.trunk_ids is not None
            else _get_value(existing, "trunk_ids")
        )

        # 3) Merge rule type/config
        rule = _build_dispatch_rule(existing, request)

        # 4) Merge room_config/agents
        room_config = _build_room_config(existing, request)

        # 5) Preserve additional fields to avoid data loss
        rule_info = api.SIPDispatchRuleInfo(
            sip_dispatch_rule_id=dispatch_rule_id,
            rule=rule,
            name=name,
            trunk_ids=trunk_ids,
            metadata=metadata,
            room_config=room_config,
            hide_phone_number=_get_value(existing, "hide_phone_number"),
            inbound_numbers=_get_value(existing, "inbound_numbers"),
            numbers=_get_value(existing, "numbers"),
            attributes=_get_value(existing, "attributes"),
            room_preset=_get_value(existing, "room_preset"),
            krisp_enabled=_get_value(existing, "krisp_enabled"),
            media_encryption=_get_value(existing, "media_encryption"),
        )

        # 6) LiveKit replace call
        dispatch = await client.sip.update_sip_dispatch_rule(
            dispatch_rule_id, rule_info
        )

        dispatch_id = (
            getattr(dispatch, "sip_dispatch_rule_id", None) or dispatch_rule_id
        )
        return {
            "success": True,
            "message": "Dispatch rule updated successfully",
            "dispatch_rule_id": dispatch_id,
        }

    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"LiveKit error: {str(e)}") from e
    finally:
        await client.aclose()
