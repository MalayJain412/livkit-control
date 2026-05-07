from fastapi import APIRouter
from fastapi.responses import FileResponse


router = APIRouter(tags=["health"])


@router.get("/")
async def root():
    """Root endpoint - returns API status page."""
    response = {"message": "  backend is running"}
    return response


@router.get("/health")
async def health_check():
    """Health check endpoint."""

    return {
        "status": "ok",
    }
