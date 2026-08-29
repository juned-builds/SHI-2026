from fastapi import APIRouter
from app.api.v1.endpoints import health, generation

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(generation.router, prefix="/v1/generation", tags=["Generation"])
api_router.include_router(generation.router, prefix="/generation", tags=["Generation"])

