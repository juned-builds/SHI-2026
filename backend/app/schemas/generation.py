from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


ALLOWED_DELIVERABLES = {
    "executive_summary",
    "linkedin_post",
    "twitter_post",
    "advisory",
    "infographic",
    "presentation",
    "video_package",
}

ALLOWED_AUDIENCES = {
    "general_public",
    "government_officials",
    "executives",
    "technical_professionals",
    "students_learners",
    "media_journalists",
    "internal_organization",
    "c_suite_executives",
    "technical_experts",
    "investors_shareholders",
    "operational_teams",
    "academic_researchers",
    "youth_students",
    "seniors_retirees",
    "custom",
}

ALLOWED_TONES = {
    "professional",
    "formal",
    "informative",
    "conversational",
    "persuasive",
    "urgent",
    "neutral",
    "formal_authoritative",
    "professional_objective",
    "conversational_approachable",
    "inspirational_persuasive",
    "empathic_supportive",
    "technical_analytical",
    "urgent_critical",
}

ALLOWED_LANGUAGES = {
    "english",
    "hindi",
    "marathi",
    "tamil",
    "telugu",
    "bengali",
    "gujarati",
    "kannada",
    "malayalam",
    "spanish",
    "french",
    "german",
    "japanese",
    "mandarin",
    "arabic",
    "other",
}

ALLOWED_DETAIL_LEVELS = {
    "concise",
    "standard",
    "detailed",
    "comprehensive",
    "exhaustive",
}

ALLOWED_OBJECTIVES = {
    "inform",
    "educate",
    "summarize",
    "alert_advise",
    "persuade",
    "explain",
    "promote_engage",
    "inform_summarize",
    "persuade_convert",
    "educate_train",
    "engage_entertain",
    "advise_warn",
}

ALLOWED_CONTENT_STYLES = {
    "executive",
    "news_editorial",
    "technical",
    "educational",
    "social_media",
    "public_advisory",
    "storytelling",
    "minimal_direct",
    "narrative_storytelling",
    "bulleted_structured",
    "academic_formal",
    "journalistic_punchy",
    "executive_briefing",
}


class GenerationRequest(BaseModel):
    """Strongly-typed payload received from the frontend GenerationSession."""
    sourceType: str = Field(default="text", description="Source format: text or file")
    sourceText: str = Field(..., description="Raw text content extracted or pasted by the user")
    sourceMetadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Metadata like filename, wordCount, charCount")
    
    audience: str = Field(..., description="Target audience identifier")
    customAudience: Optional[str] = Field(default="", description="Custom audience description if audience is custom")
    
    tone: str = Field(..., description="Communication tone identifier")
    
    language: str = Field(..., description="Target language identifier")
    customLanguage: Optional[str] = Field(default="", description="Custom language name if language is other")
    
    detailLevel: str = Field(..., description="Detail level: concise, standard, comprehensive, exhaustive")
    objective: str = Field(..., description="Primary communication objective")
    contentStyle: str = Field(..., description="Content presentation style")
    
    deliverables: List[str] = Field(..., description="List of target deliverable IDs")

    @field_validator("sourceText")
    @classmethod
    def validate_source_text(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("sourceText cannot be empty or whitespace only.")
        if len(stripped) < 10:
            raise ValueError("sourceText is too short for meaningful transformation (minimum 10 characters).")
        return stripped

    @field_validator("deliverables")
    @classmethod
    def validate_deliverables(cls, v: List[str]) -> List[str]:
        if not v or len(v) == 0:
            raise ValueError("At least one deliverable must be selected.")
        invalid = [d for d in v if d not in ALLOWED_DELIVERABLES]
        if invalid:
            raise ValueError(f"Invalid deliverable ID(s): {', '.join(invalid)}. Allowed: {', '.join(sorted(ALLOWED_DELIVERABLES))}")
        # Deduplicate while preserving order
        return list(dict.fromkeys(v))

    @field_validator("audience")
    @classmethod
    def validate_audience(cls, v: str) -> str:
        if v not in ALLOWED_AUDIENCES:
            raise ValueError(f"Invalid audience '{v}'. Allowed: {', '.join(sorted(ALLOWED_AUDIENCES))}")
        return v

    @field_validator("tone")
    @classmethod
    def validate_tone(cls, v: str) -> str:
        if v not in ALLOWED_TONES:
            raise ValueError(f"Invalid tone '{v}'. Allowed: {', '.join(sorted(ALLOWED_TONES))}")
        return v

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        if v not in ALLOWED_LANGUAGES:
            raise ValueError(f"Invalid language '{v}'. Allowed: {', '.join(sorted(ALLOWED_LANGUAGES))}")
        return v

    @field_validator("detailLevel")
    @classmethod
    def validate_detail_level(cls, v: str) -> str:
        if v not in ALLOWED_DETAIL_LEVELS:
            raise ValueError(f"Invalid detailLevel '{v}'. Allowed: {', '.join(sorted(ALLOWED_DETAIL_LEVELS))}")
        return v

    @field_validator("objective")
    @classmethod
    def validate_objective(cls, v: str) -> str:
        if v not in ALLOWED_OBJECTIVES:
            raise ValueError(f"Invalid objective '{v}'. Allowed: {', '.join(sorted(ALLOWED_OBJECTIVES))}")
        return v

    @field_validator("contentStyle")
    @classmethod
    def validate_content_style(cls, v: str) -> str:
        if v not in ALLOWED_CONTENT_STYLES:
            raise ValueError(f"Invalid contentStyle '{v}'. Allowed: {', '.join(sorted(ALLOWED_CONTENT_STYLES))}")
        return v


class GeneratedDeliverable(BaseModel):
    """Structured result for an individual transformed deliverable."""
    deliverableId: str = Field(..., description="Unique deliverable identifier")
    title: str = Field(..., description="Deliverable title")
    content: str = Field(..., description="Formatted markdown/text content")
    structuredData: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Structured key-value breakdown (slides, scenes, key points, hashtags, sections, etc.)"
    )
    status: str = Field(default="completed", description="Deliverable status: completed or failed")
    error: Optional[str] = Field(default=None, description="Error message if generation failed for this deliverable")


class GenerationResponse(BaseModel):
    """Normalized response payload returned to the frontend."""
    success: bool = Field(..., description="Whether generation succeeded overall")
    sessionId: str = Field(..., description="Session identifier for tracking")
    status: str = Field(..., description="Status: completed, partial, or failed")
    model: Optional[str] = Field(default=None, description="Gemini model name used for generation")
    deliverables: List[GeneratedDeliverable] = Field(default_factory=list, description="List of generated deliverables")
    error: Optional[str] = Field(default=None, description="Global error message if entire generation failed")
    generatedAt: str = Field(..., description="ISO 8601 timestamp of generation completion")
