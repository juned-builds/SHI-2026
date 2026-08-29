from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.gemini_service import set_gemini_service, GeminiService

client = TestClient(app)


def test_generation_endpoint_success_with_mock():
    mock_gemini = MagicMock(spec=GeminiService)
    mock_gemini.generate_json_content.return_value = {
        "deliverables": [
            {
                "deliverableId": "executive_summary",
                "title": "Clean Energy Executive Brief",
                "content": "# Clean Energy Executive Brief\nSolar and wind grew 35% in 2026.",
                "structuredData": {
                    "summary": "Solar and wind grew 35% in 2026.",
                    "key_points": ["35% growth in grid installations"],
                    "important_findings": ["Cost parity achieved in 80% of markets"],
                    "recommended_actions": ["Deploy storage reserves"]
                }
            }
        ]
    }
    set_gemini_service(mock_gemini)

    payload = {
        "sourceType": "text",
        "sourceText": "Renewable energy installations surged by 35% in 2026, reaching cost parity across most regional markets.",
        "sourceMetadata": {"wordCount": 16, "charCount": 105},
        "audience": "c_suite_executives",
        "customAudience": "",
        "tone": "formal_authoritative",
        "language": "english",
        "customLanguage": "",
        "detailLevel": "concise",
        "objective": "inform_summarize",
        "contentStyle": "executive_briefing",
        "deliverables": ["executive_summary"],
    }

    response = client.post("/api/v1/generation/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "completed"
    assert len(data["deliverables"]) == 1
    assert data["deliverables"][0]["deliverableId"] == "executive_summary"
    assert data["deliverables"][0]["status"] == "completed"
    assert "Clean Energy" in data["deliverables"][0]["title"]


def test_generation_endpoint_missing_source_fails_validation():
    payload = {
        "sourceType": "text",
        "sourceText": "",  # Empty
        "audience": "general_public",
        "tone": "formal_authoritative",
        "language": "english",
        "detailLevel": "standard",
        "objective": "inform_summarize",
        "contentStyle": "bulleted_structured",
        "deliverables": ["executive_summary"],
    }

    response = client.post("/api/v1/generation/generate", json=payload)
    assert response.status_code == 422  # Unprocessable Entity from Pydantic


def test_generation_endpoint_missing_deliverables_fails_validation():
    payload = {
        "sourceType": "text",
        "sourceText": "Valid source content text for validation testing purposes.",
        "audience": "general_public",
        "tone": "formal_authoritative",
        "language": "english",
        "detailLevel": "standard",
        "objective": "inform_summarize",
        "contentStyle": "bulleted_structured",
        "deliverables": [],  # Empty
    }

    response = client.post("/api/v1/generation/generate", json=payload)
    assert response.status_code == 422


def test_generation_endpoint_handles_unconfigured_api_key():
    # Service without API key and without client
    unconfigured_gemini = GeminiService(api_key="", client=None)
    set_gemini_service(unconfigured_gemini)

    payload = {
        "sourceType": "text",
        "sourceText": "Valid source content text for validation testing purposes.",
        "audience": "general_public",
        "tone": "formal_authoritative",
        "language": "english",
        "detailLevel": "standard",
        "objective": "inform_summarize",
        "contentStyle": "bulleted_structured",
        "deliverables": ["executive_summary"],
    }

    response = client.post("/api/v1/generation/generate", json=payload)
    assert response.status_code == 500
    data = response.json()
    assert "GEMINI_API_KEY" in data["detail"]
