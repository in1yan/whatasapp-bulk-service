from fastapi import APIRouter

from app.api.v1.endpoints import health, whatsapp, bulk

api_router = APIRouter()

api_router.include_router(
    health.router,
    tags=["health"],
)
api_router.include_router(
    whatsapp.router,
    tags=["whatsapp"],
)
api_router.include_router(
    bulk.router,
    prefix="/bulk",
    tags=["bulk"],
)
