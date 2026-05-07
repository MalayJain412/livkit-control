from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class DispatchRulesPayload(BaseModel):
    """Response model for dispatch rules endpoint."""

    success: bool
    data: Dict[str, Any]


class DispatchAgent(BaseModel):
    agent_name: str
    metadata: Optional[str] = None


class UpdateDispatchAgent(BaseModel):
    agent_name: str
    metadata: Optional[str] = None


class CreateDispatchRuleRequest(BaseModel):
    name: str
    trunk_ids: List[str]

    # rule config
    room_prefix: str = "call-"

    # agents
    agents: List[DispatchAgent]


class CreateDispatchRuleResponse(BaseModel):
    success: bool
    message: str
    dispatch_rule_id: str


class DeleteDispatchRuleRequest(BaseModel):
    """Request model for deleting an inbound trunk."""

    dispatch_rule_id: str


class DeleteDispatchRuleResponse(BaseModel):
    """Response model for deleting an inbound trunk."""

    success: bool
    message: str
    dispatch_rule_id: str


class UpdateDispatchRuleRequest(BaseModel):
    name: Optional[str] = None
    trunk_ids: Optional[List[str]] = None

    # Rule types
    room_prefix: Optional[str] = None  # individual
    room_name: Optional[str] = None  # direct
    pin: Optional[str] = None

    # Metadata
    metadata: Optional[str] = None

    # Agents
    agents: Optional[List[UpdateDispatchAgent]] = None


class UpdateDispatchRuleResponse(BaseModel):
    success: bool
    message: str
    dispatch_rule_id: str
