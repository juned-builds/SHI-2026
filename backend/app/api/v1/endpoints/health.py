from fastapi import APIRouter
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Returns service status to verify the backend is running correctly.",
)
async def health_check() -> HealthResponse:
    """Service health verification endpoint."""
    return HealthResponse(
        status="ok",
        service="content-transformation-api",
    )
