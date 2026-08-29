import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas.generation import GenerationRequest, GenerationResponse
from app.services.generation_service import get_generation_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/generate",
    response_model=GenerationResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute GenAI content transformation",
    description="Transforms input source text into structured multi-deliverable outputs using the configured Gemini AI engine.",
)
async def generate_transformation(
    request: GenerationRequest,
) -> GenerationResponse:
    """Primary endpoint for executing structured Gemini transformations."""
    try:
        service = get_generation_service()
        response = service.execute_transformation(request)
        
        if not response.success and response.error:
            # If completely failed due to configuration/quota/internal errors
            if "GEMINI_API_KEY" in response.error:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=response.error,
                )
            if "quota" in response.error.lower() or "rate limit" in response.error.lower():
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Gemini API rate limit or quota exceeded. Please try again in a few moments.",
                )

        return response

    except HTTPException:
        raise
    except ValueError as ve:
        logger.warning(f"Validation error during generation: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except RuntimeError as re:
        logger.error(f"Runtime error during generation: {str(re)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(re),
        )
    except Exception as exc:
        logger.error(f"Unexpected error during generation: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during AI transformation. Please try again.",
        )
