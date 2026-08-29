from unittest.mock import MagicMock
import pytest
from app.schemas.generation import GenerationRequest
from app.services.generation_service import GenerationService
from app.services.gemini_service import GeminiService


def test_generation_service_successful_mock():
    mock_gemini = MagicMock(spec=GeminiService)
    mock_gemini.generate_json_content.return_value = {
        "deliverables": [
            {
                "deliverableId": "executive_summary",
                "title": "Executive Summary: Clean Energy 2026",
                "content": "# Executive Summary\nClean energy scaling accelerated by 40% in Q2.",
                "structuredData": {
                    "summary": "Clean energy scaling accelerated by 40% in Q2.",
                    "key_points": ["40% increase in capacity", "Solar adoption doubled"],
                    "important_findings": ["Cost per MWh dropped 18%"],
                    "recommended_actions": ["Accelerate grid interconnections"]
                }
            },
            {
                "deliverableId": "linkedin_post",
                "title": "LinkedIn Post: Clean Energy Milestone",
                "content": "Exciting milestones in clean energy! 🚀\nSolar adoption doubled.",
                "structuredData": {
                    "hook": "Exciting milestones in clean energy! 🚀",
                    "body": "Solar adoption doubled with costs dropping 18%.",
                    "call_to_action": "How is your organization adapting?",
                    "hashtags": ["#CleanEnergy", "#Sustainability", "#Leadership"]
                }
            }
        ]
    }

    service = GenerationService(gemini_service=mock_gemini)

    req = GenerationRequest(
        sourceType="text",
        sourceText="Comprehensive report on renewable clean energy infrastructure milestones in 2026.",
        audience="c_suite_executives",
        customAudience="",
        tone="formal_authoritative",
        language="english",
        customLanguage="",
        detailLevel="standard",
        objective="inform_summarize",
        contentStyle="executive_briefing",
        deliverables=["executive_summary", "linkedin_post"],
    )

    response = service.execute_transformation(req)

    assert response.success is True
    assert response.status == "completed"
    assert len(response.deliverables) == 2
    assert response.deliverables[0].deliverableId == "executive_summary"
    assert response.deliverables[0].status == "completed"
    assert response.deliverables[1].deliverableId == "linkedin_post"
    assert response.deliverables[1].status == "completed"
    assert response.sessionId.startswith("gen_session_")


def test_generation_service_handles_missing_deliverables_gracefully():
    mock_gemini = MagicMock(spec=GeminiService)
    # Return only executive_summary when two were requested
    mock_gemini.generate_json_content.return_value = {
        "deliverables": [
            {
                "deliverableId": "executive_summary",
                "title": "Executive Summary",
                "content": "Summary text here.",
                "structuredData": {}
            }
        ]
    }

    service = GenerationService(gemini_service=mock_gemini)

    req = GenerationRequest(
        sourceType="text",
        sourceText="Source text with enough characters for validation check.",
        audience="general_public",
        tone="professional_objective",
        language="english",
        detailLevel="standard",
        objective="inform_summarize",
        contentStyle="bulleted_structured",
        deliverables=["executive_summary", "advisory"],
    )

    response = service.execute_transformation(req)

    assert response.status == "partial"
    assert len(response.deliverables) == 2
    assert response.deliverables[0].status == "completed"
    assert response.deliverables[1].status == "failed"
    assert "missing" in response.deliverables[1].error.lower()


def test_generation_service_handles_gemini_error():
    mock_gemini = MagicMock(spec=GeminiService)
    mock_gemini.generate_json_content.side_effect = RuntimeError("Gemini quota exceeded")

    service = GenerationService(gemini_service=mock_gemini)

    req = GenerationRequest(
        sourceType="text",
        sourceText="Source text with enough characters for validation check.",
        audience="general_public",
        tone="professional_objective",
        language="english",
        detailLevel="standard",
        objective="inform_summarize",
        contentStyle="bulleted_structured",
        deliverables=["executive_summary"],
    )

    response = service.execute_transformation(req)

    assert response.success is False
    assert response.status == "failed"
    assert "Gemini quota exceeded" in response.error
