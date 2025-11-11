import logging
from fastapi import FastAPI
from .socket import socket_app
from .db import shutdown_db_client, ensure_indexes
from ..middleware.cors import apply_cors
from ..routes.index import api_router


def create_app() -> FastAPI:
    app = FastAPI()

    # Include routers
    app.include_router(api_router)

    # Mount Socket.IO
    app.mount("/socket.io", socket_app)

    # Middleware
    apply_cors(app)

    # Logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    @app.on_event("startup")
    async def _startup():
        await ensure_indexes()

    @app.on_event("shutdown")
    async def _shutdown_db_client():
        await shutdown_db_client()

    return app
