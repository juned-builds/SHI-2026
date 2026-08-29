import uuid
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.schemas.generation import (
    GenerationRequest,
    GeneratedDeliverable,
    GenerationResponse,
    ALLOWED_DELIVERABLES,
)
from app.services.prompt_builder import (
    build_system_instruction,
    build_transformation_prompt,
    DELIVERABLE_SPECIFICATIONS,
)
from app.services.gemini_service import get_gemini_service, GeminiService
from app.core.config import settings

logger = logging.getLogger(__name__)


def _format_markdown_fallback(deliverable_id: str, data: Dict[str, Any], title: str) -> str:
    """Helper to synthesize a readable markdown representation if model returns structured fields."""
    lines = [f"# {title}\n"]

    if deliverable_id == "executive_summary":
        if "summary" in data:
            lines.append(f"## Executive Overview\n{data['summary']}\n")
        if "key_points" in data and isinstance(data["key_points"], list):
            lines.append("## Key Strategic Points")
            for p in data["key_points"]:
                lines.append(f"- {p}")
            lines.append("")
        if "important_findings" in data and isinstance(data["important_findings"], list):
            lines.append("## Important Findings")
            for f in data["important_findings"]:
                lines.append(f"- {f}")
            lines.append("")
        if "recommended_actions" in data and isinstance(data["recommended_actions"], list):
            lines.append("## Recommended Actions")
            for a in data["recommended_actions"]:
                lines.append(f"- {a}")

    elif deliverable_id == "linkedin_post":
        if "hook" in data:
            lines.append(f"{data['hook']}\n")
        if "body" in data:
            lines.append(f"{data['body']}\n")
        if "call_to_action" in data:
            lines.append(f"👉 {data['call_to_action']}\n")
        if "hashtags" in data and isinstance(data["hashtags"], list):
            lines.append(" ".join(data["hashtags"]))

    elif deliverable_id == "twitter_post":
        if "thread_posts" in data and isinstance(data["thread_posts"], list):
            for i, tweet in enumerate(data["thread_posts"], 1):
                lines.append(f"**Post {i}/{len(data['thread_posts'])}**\n{tweet}\n")
        if "key_takeaway" in data:
            lines.append(f"💡 Key Takeaway: {data['key_takeaway']}\n")
        if "hashtags" in data and isinstance(data["hashtags"], list):
            lines.append(" ".join(data["hashtags"]))

    elif deliverable_id == "advisory":
        if "context" in data:
            lines.append(f"## Context & Background\n{data['context']}\n")
        if "key_information" in data and isinstance(data["key_information"], list):
            lines.append("## Key Information")
            for info in data["key_information"]:
                lines.append(f"- {info}")
            lines.append("")
        if "action_items" in data and isinstance(data["action_items"], list):
            lines.append("## Action Items")
            for act in data["action_items"]:
                lines.append(f"- {act}")
            lines.append("")
        if "cautions_or_notes" in data and isinstance(data["cautions_or_notes"], list):
            lines.append("## Cautions & Notes")
            for c in data["cautions_or_notes"]:
                lines.append(f"- ⚠️ {c}")

    elif deliverable_id == "infographic":
        if "core_message" in data:
            lines.append(f"**Core Message**: {data['core_message']}\n")
        if "key_facts_and_metrics" in data and isinstance(data["key_facts_and_metrics"], list):
            lines.append("## Anchor Metrics & Facts")
            for metric in data["key_facts_and_metrics"]:
                lines.append(f"- 📊 {metric}")
            lines.append("")
        if "sections" in data and isinstance(data["sections"], list):
            lines.append("## Infographic Sections")
            for s in data["sections"]:
                heading = s.get("heading", "Section")
                content = s.get("content", "")
                visual = s.get("visual_cue", "")
                lines.append(f"### {heading}")
                lines.append(f"{content}")
                if visual:
                    lines.append(f"*Visual Direction: {visual}*\n")
        if "visual_layout_guidance" in data:
            lines.append(f"## Visual Layout Guidance\n{data['visual_layout_guidance']}")

    elif deliverable_id == "presentation":
        if "slides" in data and isinstance(data["slides"], list):
            for slide in data["slides"]:
                num = slide.get("slide_number", "")
                stitle = slide.get("slide_title", "Slide")
                lines.append(f"## Slide {num}: {stitle}")
                bullets = slide.get("bullet_points", [])
                if isinstance(bullets, list):
                    for b in bullets:
                        lines.append(f"- {b}")
                if "visual_concept" in slide:
                    lines.append(f"\n*Visual Concept: {slide['visual_concept']}*")
                if "speaker_notes" in slide:
                    lines.append(f"\n> **Speaker Notes:** {slide['speaker_notes']}\n")

    elif deliverable_id == "video_package":
        if "duration_guidance" in data:
            lines.append(f"**Target Duration:** {data['duration_guidance']}\n")
        if "scenes" in data and isinstance(data["scenes"], list):
            lines.append("## Scene Breakdown")
            for scene in data["scenes"]:
                snum = scene.get("scene_number", "")
                lines.append(f"### Scene {snum}")
                if "visual_direction" in scene:
                    lines.append(f"**Visual:** {scene['visual_direction']}")
                if "narration_script" in scene:
                    lines.append(f"**Narration:** \"{scene['narration_script']}\"")
                if "on_screen_text" in scene:
                    lines.append(f"**On-Screen Text:** {scene['on_screen_text']}\n")
        if "subtitles" in data:
            lines.append(f"## Full Subtitles Transcript\n{data['subtitles']}")

    else:
        # Generic fallback string formatting
        for k, v in data.items():
            lines.append(f"**{k.replace('_', ' ').title()}**: {v}")

    return "\n".join(lines).strip()


class GenerationService:
    """Orchestrates content transformation requests with Gemini AI."""

    def __init__(self, gemini_service: Optional[GeminiService] = None):
        self._gemini_service = gemini_service

    def _get_gemini(self) -> GeminiService:
        if self._gemini_service is not None:
            return self._gemini_service
        return get_gemini_service()

    def execute_transformation(self, request: GenerationRequest) -> GenerationResponse:
        """Execute transformation and synthesize structured deliverables."""
        session_id = f"gen_session_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        # Build prompt & system instructions
        system_instruction = build_system_instruction()
        prompt = build_transformation_prompt(request)

        gemini = self._get_gemini()

        try:
            raw_result = gemini.generate_json_content(
                prompt=prompt,
                system_instruction=system_instruction,
            )
        except Exception as exc:
            logger.error(f"Generation execution failed: {str(exc)}")
            return GenerationResponse(
                success=False,
                sessionId=session_id,
                status="failed",
                model=settings.GEMINI_MODEL,
                deliverables=[],
                error=str(exc),
                generatedAt=now_iso,
            )

        # Parse and validate the returned deliverables against requested IDs
        parsed_deliverables: List[GeneratedDeliverable] = []
        raw_deliverables_list = raw_result.get("deliverables", []) if isinstance(raw_result, dict) else []

        # Create mapping of deliverableId -> item
        deliverables_by_id: Dict[str, Dict[str, Any]] = {}
        if isinstance(raw_deliverables_list, list):
            for item in raw_deliverables_list:
                if isinstance(item, dict) and "deliverableId" in item:
                    deliverables_by_id[str(item["deliverableId"])] = item

        for d_id in request.deliverables:
            spec = DELIVERABLE_SPECIFICATIONS.get(d_id, {"name": d_id.replace("_", " ").title()})
            default_title = spec.get("name", d_id.title())

            if d_id in deliverables_by_id:
                raw_item = deliverables_by_id[d_id]
                title = raw_item.get("title") or default_title
                structured_data = raw_item.get("structuredData")
                if not isinstance(structured_data, dict):
                    structured_data = {}

                # If content is provided and is string, use it; otherwise generate markdown from structuredData
                content = raw_item.get("content")
                if not content or not isinstance(content, str) or not content.strip():
                    content = _format_markdown_fallback(d_id, structured_data, title)
                else:
                    content = content.strip()

                parsed_deliverables.append(
                    GeneratedDeliverable(
                        deliverableId=d_id,
                        title=title,
                        content=content,
                        structuredData=structured_data,
                        status="completed",
                    )
                )
            else:
                # Deliverable was requested but missing in model output
                logger.warning(f"Deliverable '{d_id}' requested but missing in Gemini output payload.")
                parsed_deliverables.append(
                    GeneratedDeliverable(
                        deliverableId=d_id,
                        title=default_title,
                        content=f"Deliverable generation could not be completed for {default_title}.",
                        structuredData=None,
                        status="failed",
                        error=f"Model output was missing requested deliverable '{d_id}'.",
                    )
                )

        completed_count = sum(1 for d in parsed_deliverables if d.status == "completed")
        overall_status = "completed" if completed_count == len(request.deliverables) else ("partial" if completed_count > 0 else "failed")

        return GenerationResponse(
            success=completed_count > 0,
            sessionId=session_id,
            status=overall_status,
            model=settings.GEMINI_MODEL,
            deliverables=parsed_deliverables,
            error=None if overall_status == "completed" else f"Completed {completed_count}/{len(request.deliverables)} deliverables.",
            generatedAt=now_iso,
        )


# Singleton instance
_generation_service_instance: Optional[GenerationService] = None


def get_generation_service() -> GenerationService:
    global _generation_service_instance
    if _generation_service_instance is None:
        _generation_service_instance = GenerationService()
    return _generation_service_instance
