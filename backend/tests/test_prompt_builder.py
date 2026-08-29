from app.schemas.generation import GenerationRequest
from app.services.prompt_builder import (
    build_system_instruction,
    build_transformation_prompt,
    DELIVERABLE_SPECIFICATIONS,
)


def test_build_system_instruction_contains_integrity_rules():
    instruction = build_system_instruction()
    assert "Content Transformation Engine" in instruction
    assert "Strictly preserve all names, numbers, dates" in instruction
    assert "Do NOT hallucinate" in instruction


def test_build_transformation_prompt_includes_all_dimensions():
    req = GenerationRequest(
        sourceType="text",
        sourceText="Source text detailing green hydrogen production efficiencies in 2026.",
        audience="investors_shareholders",
        customAudience="",
        tone="professional_objective",
        language="english",
        customLanguage="",
        detailLevel="comprehensive",
        objective="persuade_convert",
        contentStyle="executive_briefing",
        deliverables=["executive_summary", "presentation", "infographic"],
    )

    prompt = build_transformation_prompt(req)

    # Check 6 dimensions
    assert "TARGET AUDIENCE:" in prompt
    assert "Investors, Board Members & Shareholders" in prompt
    assert "COMMUNICATION TONE:" in prompt
    assert "Professional & Objective" in prompt
    assert "TARGET LANGUAGE:" in prompt
    assert "English" in prompt
    assert "DETAIL LEVEL:" in prompt
    assert "Comprehensive" in prompt
    assert "COMMUNICATION OBJECTIVE:" in prompt
    assert "Persuade & Convert" in prompt
    assert "CONTENT STYLE:" in prompt
    assert "Executive Briefing" in prompt

    # Check deliverables
    assert "executive_summary" in prompt
    assert "presentation" in prompt
    assert "infographic" in prompt

    # Check source text separation
    assert "--- BEGIN SOURCE TEXT ---" in prompt
    assert req.sourceText in prompt
    assert "--- END SOURCE TEXT ---" in prompt
