import pytest
from pydantic import ValidationError
from app.schemas.generation import GenerationRequest, GeneratedDeliverable, GenerationResponse


def test_valid_generation_request():
    req = GenerationRequest(
        sourceType="text",
        sourceText="Artificial intelligence in healthcare offers diagnostic precision and workflow optimization.",
        sourceMetadata={"wordCount": 10, "charCount": 85},
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
    assert req.sourceText.startswith("Artificial intelligence")
    assert len(req.deliverables) == 2
    assert req.audience == "c_suite_executives"


def test_empty_source_text_fails():
    with pytest.raises(ValidationError) as exc:
        GenerationRequest(
            sourceType="text",
            sourceText="   ",
            audience="general_public",
            tone="formal_authoritative",
            language="english",
            detailLevel="standard",
            objective="inform_summarize",
            contentStyle="bulleted_structured",
            deliverables=["executive_summary"],
        )
    assert "sourceText cannot be empty" in str(exc.value)


def test_too_short_source_text_fails():
    with pytest.raises(ValidationError) as exc:
        GenerationRequest(
            sourceType="text",
            sourceText="short",
            audience="general_public",
            tone="formal_authoritative",
            language="english",
            detailLevel="standard",
            objective="inform_summarize",
            contentStyle="bulleted_structured",
            deliverables=["executive_summary"],
        )
    assert "sourceText is too short" in str(exc.value)


def test_empty_deliverables_fails():
    with pytest.raises(ValidationError) as exc:
        GenerationRequest(
            sourceType="text",
            sourceText="This is valid source text with enough characters to pass length check.",
            audience="general_public",
            tone="formal_authoritative",
            language="english",
            detailLevel="standard",
            objective="inform_summarize",
            contentStyle="bulleted_structured",
            deliverables=[],
        )
    assert "At least one deliverable must be selected" in str(exc.value)


def test_invalid_deliverable_id_fails():
    with pytest.raises(ValidationError) as exc:
        GenerationRequest(
            sourceType="text",
            sourceText="This is valid source text with enough characters to pass length check.",
            audience="general_public",
            tone="formal_authoritative",
            language="english",
            detailLevel="standard",
            objective="inform_summarize",
            contentStyle="bulleted_structured",
            deliverables=["invalid_deliverable_id_xyz"],
        )
    assert "Invalid deliverable ID(s)" in str(exc.value)


def test_invalid_audience_fails():
    with pytest.raises(ValidationError) as exc:
        GenerationRequest(
            sourceType="text",
            sourceText="This is valid source text with enough characters to pass length check.",
            audience="invalid_audience_name",
            tone="formal_authoritative",
            language="english",
            detailLevel="standard",
            objective="inform_summarize",
            contentStyle="bulleted_structured",
            deliverables=["executive_summary"],
        )
    assert "Invalid audience" in str(exc.value)


def test_custom_audience_and_language_success():
    req = GenerationRequest(
        sourceType="text",
        sourceText="Valid source material for custom audience test case.",
        audience="custom",
        customAudience="Biomedical laboratory researchers in Delhi",
        tone="technical_analytical",
        language="other",
        customLanguage="Tamil",
        detailLevel="comprehensive",
        objective="educate_train",
        contentStyle="academic_formal",
        deliverables=["advisory", "presentation"],
    )
    assert req.customAudience == "Biomedical laboratory researchers in Delhi"
    assert req.customLanguage == "Tamil"
