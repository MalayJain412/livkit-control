"""CreativeNest Admin API - Backend Service entrypoint.

This module wires the FastAPI application, CORS, MongoDB client lifecycle,
and includes the aggregated API router from the `api` package.
All endpoint implementations live in the domain routers under `api/`.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import os
import sys
from pathlib import Path

# Add workspace root to path for imports
# backend/main.py -> Admin-Panel/backend -> Admin-Panel -> workspace root
workspace_root = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
if workspace_root not in sys.path:
    sys.path.append(workspace_root)
from api.router import api_router

from dotenv import load_dotenv

load_dotenv()

# ============════════════════════════════════════════
# Lifespan Management for Services
# ============════════════════════════════════════════



# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Livekit Control Panel API",
    description="Livekit Control Panel",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],  # Allow all origins for development; restrict in production
    allow_credentials=True,
    # Include PATCH so browser preflight for edits succeeds
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ============════════════════════════════════════════
# Startup/Shutdown
# ============════════════════════════════════════════


# Include all API routers from the api package
app.include_router(api_router, prefix="/api/v1")


@app.get("/", include_in_schema=False)
async def root_page():
    # """Serve the backend intro page at the root URL.

    # This complements the `/api/v1/` root which also serves the same file
    # via the health router, so visiting `http://host:port/` renders
    # `intro.html` instead of returning 404.
    # """
    # intro_path = Path(__file__).parent / "intro.html"
    
    response = {"message": "  backend is running"}
    return response


port = int(os.getenv('port'))

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
    )
