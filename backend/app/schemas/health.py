from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Schema for service health verification."""
    status: str = Field(default="ok", description="Operational status of the service")
    service: str = Field(default="content-transformation-api", description="Service identifier")
