from fastapi import APIRouter

from . import health
from .lk_trunks import (
    inbound as trunks_inbound,
    outbound as trunks_outbound,
    dispatch as dispatch_rules,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(trunks_inbound.router)
api_router.include_router(trunks_outbound.router)
api_router.include_router(dispatch_rules.router)
