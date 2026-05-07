from typing import Any, Dict, Optional

from dotenv import load_dotenv, find_dotenv
from google.protobuf.json_format import MessageToDict
from livekit import api
from livekit.protocol.models import ListUpdate
from livekit.protocol.sip import (
    CreateSIPOutboundTrunkRequest,
    SIPOutboundTrunkInfo,
    SIPTransport,
    ListSIPOutboundTrunkRequest,
    DeleteSIPTrunkRequest,
)

from api.lk_trunks.outbound import (
    CreateOutboundTrunkRequest,
    UpdateOutboundTrunkUnifiedRequest,
)
from .inbound import _create_livekit_client

# Load LiveKit-related environment variables once
load_dotenv(find_dotenv())


def _proto_to_dict(message: Any) -> Dict[str, Any]:
    """Convert a protobuf message to a plain dict suitable for JSON responses."""

    return MessageToDict(message, preserving_proto_field_name=True)


async def list_outbound_trunks() -> Dict[str, Any]:
    """Return outbound SIP trunks from LiveKit as a JSON-serializable dict."""

    client = await _create_livekit_client()
    try:
        request = ListSIPOutboundTrunkRequest()
        outbound = await client.sip.list_sip_outbound_trunk(request)
        return _proto_to_dict(outbound)
    finally:
        await client.aclose()


async def create_outbound_trunk(data: CreateOutboundTrunkRequest) -> Dict[str, Any]:
    """Create a new outbound SIP trunk in LiveKit."""

    client = await _create_livekit_client()
    try:
        transport_enum = _map_transport(data.transport)

        trunk_info = SIPOutboundTrunkInfo(
            name=data.name,
            address=data.address,
            numbers=data.numbers,
            transport=transport_enum,
            auth_username=data.auth_username.strip(),
            auth_password=data.auth_password.strip(),
        )

        request = CreateSIPOutboundTrunkRequest(trunk=trunk_info)
        trunk = await client.sip.create_sip_outbound_trunk(request)

        return {
            "success": True,
            "message": "Outbound trunk created successfully",
            "trunk_id": trunk.sip_trunk_id,
        }
    except Exception as e:
        raise
    finally:
        await client.aclose()


def _map_transport(transport: Optional[str]):
    """Map a string transport value to the corresponding SIPTransport enum.

    Accepts "udp", "tcp", or "tls" (case-insensitive). Returns None when
    transport is None so that the field can be omitted in partial updates.
    """

    if not transport:
        return None

    transport = transport.strip().lower()

    if transport == "udp":
        return SIPTransport.SIP_TRANSPORT_UDP

    if transport == "tcp":
        return SIPTransport.SIP_TRANSPORT_TCP

    if transport == "tls":
        return SIPTransport.SIP_TRANSPORT_TLS

    raise ValueError(
        f"Invalid transport value '{transport}'. Expected one of: udp, tcp, tls"
    )


async def update_outbound_trunk_unified(
    data: UpdateOutboundTrunkUnifiedRequest,
) -> Dict[str, Any]:
    """Unified outbound trunk update.

    Applies list diffs (add/remove numbers) and any provided scalar fields in a
    single LiveKit update_sip_outbound_trunk_fields call.
    """

    has_list_updates = bool(data.add_numbers or data.remove_numbers)
    has_scalar_updates = any(
        value is not None
        for value in (
            data.name,
            data.metadata,
            data.address,
            data.transport,
            data.auth_username,
            data.auth_password,
        )
    )

    if not has_list_updates and not has_scalar_updates:
        raise ValueError("No changes provided")

    client = await _create_livekit_client()
    try:
        numbers_param = None
        if has_list_updates:
            numbers_param = ListUpdate(
                add=data.add_numbers or None,
                remove=data.remove_numbers or None,
            )

        transport_enum = _map_transport(data.transport)

        trunk = await client.sip.update_sip_outbound_trunk_fields(
            trunk_id=data.trunk_id,
            address=data.address,
            transport=transport_enum,
            numbers=numbers_param,
            auth_username=data.auth_username,
            auth_password=data.auth_password,
            name=data.name,
            metadata=data.metadata,
        )

        return {
            "success": True,
            "message": "Trunk updated successfully",
            "trunk": _proto_to_dict(trunk),
        }
    finally:
        await client.aclose()


async def delete_outbound_trunk(trunk_id: str) -> None:
    """Delete an outbound trunk from LiveKit by its ID."""

    client = await _create_livekit_client()
    try:
        req = DeleteSIPTrunkRequest(sip_trunk_id=trunk_id)
        await client.sip.delete_sip_trunk(req)
    finally:
        await client.aclose()
