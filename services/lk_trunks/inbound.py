from typing import Any, Dict, List, Optional

import asyncio

from dotenv import load_dotenv, find_dotenv
from google.protobuf.json_format import MessageToDict
from livekit import api
from livekit.protocol.sip import ListSIPInboundTrunkRequest, DeleteSIPTrunkRequest
from livekit.protocol.models import ListUpdate

from api.lk_trunks.inbound import (
    CreateInboundTrunkRequest,
    UpdateInboundTrunkUnifiedRequest,
)

# Load LiveKit-related environment variables once
load_dotenv(find_dotenv())


async def _create_livekit_client() -> api.LiveKitAPI:
    """Create a LiveKit API client.

    Configuration (host, API key, secret) is expected to come from environment variables.
    """

    return api.LiveKitAPI()


def _proto_to_dict(message: Any) -> Dict[str, Any]:
    """Convert a protobuf message to a plain dict suitable for JSON responses."""

    return MessageToDict(message, preserving_proto_field_name=True)


def _get_value(obj: Any, name: str) -> Any:
    if isinstance(obj, dict):
        return obj.get(name)
    return getattr(obj, name, None)


def _extract_trunk_id(trunk: Any) -> Any:
    return (
        _get_value(trunk, "sip_trunk_id")
        or _get_value(trunk, "trunk_id")
        or _get_value(trunk, "id")
    )


def _extract_list_from_response(response: Any) -> list[Any]:
    for attr in ("items", "trunks", "sip_trunks", "inbound_trunks"):
        if hasattr(response, attr):
            items = getattr(response, attr) or []
            return list(items)

    response_dict = _proto_to_dict(response)
    for key in ("items", "trunks", "sip_trunks", "inbound_trunks"):
        items = response_dict.get(key)
        if isinstance(items, list):
            return items

    return []


def _apply_add_remove(
    existing: Any,
    add_list: Optional[List[str]],
    remove_list: Optional[List[str]],
) -> List[str]:
    current = list(existing or [])
    seen = set(current)

    for value in add_list or []:
        if value not in seen:
            current.append(value)
            seen.add(value)

    remove_set = set(remove_list or [])
    if remove_set:
        current = [value for value in current if value not in remove_set]

    return current


async def list_inbound_trunks() -> Dict[str, Any]:
    """Return inbound SIP trunks from LiveKit as a JSON-serializable dict."""

    client = await _create_livekit_client()
    try:
        request = ListSIPInboundTrunkRequest()
        inbound = await client.sip.list_sip_inbound_trunk(request)
        return _proto_to_dict(inbound)
    finally:
        await client.aclose()


async def create_inbound_trunk(data: CreateInboundTrunkRequest) -> Dict[str, Any]:
    """Create a new inbound SIP trunk in LiveKit."""

    client = await _create_livekit_client()
    try:
        trunk_info = api.SIPInboundTrunkInfo(
            name=data.name,
            numbers=data.numbers,
            krisp_enabled=data.krisp_enabled,
        )

        request = api.CreateSIPInboundTrunkRequest(trunk=trunk_info)
        await client.sip.create_inbound_trunk(request)

        return {
            "success": True,
            "message": "Inbound trunk created successfully",
        }
    finally:
        await client.aclose()


async def update_inbound_trunk_unified(
    data: UpdateInboundTrunkUnifiedRequest,
) -> Dict[str, Any]:
    """Update inbound trunk fields by applying add/remove list changes and replacing."""

    client = await _create_livekit_client()
    try:
        request = ListSIPInboundTrunkRequest()
        response = await client.sip.list_sip_inbound_trunk(request)
        trunks = _extract_list_from_response(response)

        existing = None
        for trunk in trunks:
            if _extract_trunk_id(trunk) == data.trunk_id:
                existing = trunk
                break

        if existing is None:
            raise ValueError(f"Trunk not found: {data.trunk_id}")

        numbers = _apply_add_remove(
            _get_value(existing, "numbers"),
            data.add_numbers,
            data.remove_numbers,
        )
        allowed_numbers = _apply_add_remove(
            _get_value(existing, "allowed_numbers"),
            data.add_allowed_numbers,
            data.remove_allowed_numbers,
        )
        allowed_addresses = _apply_add_remove(
            _get_value(existing, "allowed_addresses"),
            data.add_allowed_addresses,
            data.remove_allowed_addresses,
        )

        existing_krisp_enabled = _get_value(existing, "krisp_enabled")
        if existing_krisp_enabled is None:
            existing_krisp_enabled = True

        trunk_info = api.SIPInboundTrunkInfo(
            sip_trunk_id=data.trunk_id,
            name=(data.name if data.name is not None else _get_value(existing, "name")),
            metadata=(
                data.metadata
                if data.metadata is not None
                else _get_value(existing, "metadata")
            ),
            numbers=numbers,
            allowed_numbers=allowed_numbers,
            allowed_addresses=allowed_addresses,
            auth_username=_get_value(existing, "auth_username"),
            auth_password=_get_value(existing, "auth_password"),
            headers=_get_value(existing, "headers"),
            headers_to_attributes=_get_value(existing, "headers_to_attributes"),
            attributes_to_headers=_get_value(existing, "attributes_to_headers"),
            include_headers=_get_value(existing, "include_headers"),
            ringing_timeout=_get_value(existing, "ringing_timeout"),
            max_call_duration=_get_value(existing, "max_call_duration"),
            krisp_enabled=existing_krisp_enabled,
            media_encryption=_get_value(existing, "media_encryption"),
        )

        trunk = await client.sip.update_inbound_trunk(data.trunk_id, trunk_info)

        return {
            "success": True,
            "message": "Trunk updated successfully",
            "trunk": _proto_to_dict(trunk),
        }
    finally:
        await client.aclose()


async def delete_inbound_trunk(trunk_id: str) -> None:
    """Delete an inbound trunk from LiveKit by its ID."""

    client = await _create_livekit_client()
    try:
        req = DeleteSIPTrunkRequest(sip_trunk_id=trunk_id)
        await client.sip.delete_sip_trunk(req)
    finally:
        await client.aclose()
