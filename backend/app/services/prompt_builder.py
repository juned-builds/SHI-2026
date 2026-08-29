import json
from typing import Dict, Any, List
from app.schemas.generation import GenerationRequest

# Dimension human-readable label lookups
AUDIENCE_LABELS = {
    "general_public": "General Public / Broad Citizen Audience",
    "government_officials": "Government Officials, Policy Makers & Civil Servants",
    "executives": "Executives, Directors & C-Suite Leadership",
    "c_suite_executives": "C-Suite & Executive Leadership",
    "technical_professionals": "Technical Professionals, Engineers & Domain Specialists",
    "technical_experts": "Technical Experts, Engineers & Developers",
    "students_learners": "Students & Academic Learners",
    "youth_students": "Youth & Students",
    "media_journalists": "Media Outlets, Journalists & Reporters",
    "internal_organization": "Internal Organization & Departmental Employees",
    "investors_shareholders": "Investors, Board Members & Shareholders",
    "operational_teams": "Operational Teams & Frontline Staff",
    "academic_researchers": "Academic Researchers & Subject Specialists",
    "seniors_retirees": "Seniors & Retirees",
    "custom": "Custom Specified Audience",
}

TONE_LABELS = {
    "professional": "Professional & Workplace-Standard (Polished, balanced, authoritative)",
    "formal": "Formal & Institutional (Diplomatic, official, legally precise)",
    "informative": "Informative & Fact-Focused (Clear, educational, structured)",
    "conversational": "Conversational & Approachable (Engaging, warm, accessible)",
    "persuasive": "Persuasive & Compelling (Visionary, rallying, action-driving)",
    "urgent": "Urgent & Critical (Decisive, high-priority, action-oriented)",
    "neutral": "Neutral & Unbiased (Objective, analytical, balanced)",
    "formal_authoritative": "Formal & Authoritative (Official, institutional, legally precise)",
    "professional_objective": "Professional & Objective (Balanced, analytical, corporate standard)",
    "conversational_approachable": "Conversational & Approachable (Engaging, warm, accessible)",
    "inspirational_persuasive": "Inspirational & Persuasive (Motivating, rallying, visionary)",
    "empathic_supportive": "Empathic & Supportive (Caring, community-centric, understanding)",
    "technical_analytical": "Technical & Analytical (Data-rich, rigorous, specialized)",
    "urgent_critical": "Urgent & Critical (Decisive, high-priority, action-oriented)",
}

LANGUAGE_LABELS = {
    "english": "English",
    "hindi": "Hindi (हिन्दी)",
    "marathi": "Marathi (मराठी)",
    "tamil": "Tamil (தமிழ்)",
    "telugu": "Telugu (తెలుగు)",
    "bengali": "Bengali (বাংলা)",
    "gujarati": "Gujarati (ગુજરાતી)",
    "kannada": "Kannada (ಕನ್ನಡ)",
    "malayalam": "Malayalam (മലയാളം)",
    "spanish": "Spanish (Español)",
    "french": "French (Français)",
    "german": "German (Deutsch)",
    "japanese": "Japanese (日本語)",
    "mandarin": "Mandarin Chinese (中文)",
    "arabic": "Arabic (العربية)",
    "other": "Custom Target Language",
}

DETAIL_LEVEL_LABELS = {
    "concise": "Concise (High-impact bullet points, tightly constrained, 1-2 min scan)",
    "standard": "Standard (Balanced overview covering primary findings and context)",
    "detailed": "Detailed (Thorough breakdown with rationale and context)",
    "comprehensive": "Comprehensive (Deep-dive analysis covering complete background)",
    "exhaustive": "Exhaustive (Exhaustive analysis covering edge cases and full implications)",
}

OBJECTIVE_LABELS = {
    "inform": "Inform (Deliver factual, transparent information clearly and accurately)",
    "educate": "Educate (Build foundational understanding with step-by-step context)",
    "summarize": "Summarize (Extract core takeaways and synthesize critical highlights)",
    "alert_advise": "Alert & Advise (Communicate guidance, warnings, or immediate action items)",
    "persuade": "Persuade (Influence stakeholder decisions and encourage strategic alignment)",
    "explain": "Explain (Demystify complex workflows, mechanisms, or domain logic)",
    "promote_engage": "Promote & Engage (Drive public engagement, awareness, and community interest)",
    "inform_summarize": "Inform & Summarize (Synthesize key facts accurately without bias)",
    "persuade_convert": "Persuade & Convert (Build conviction and drive buy-in)",
    "educate_train": "Educate & Train (Break down complex ideas into step-by-step learning)",
    "engage_entertain": "Engage & Spark Dialogue (Generate resonance and interaction)",
    "advise_warn": "Advise & Issue Guidance (Provide recommendations or risk cautions)",
}

CONTENT_STYLE_LABELS = {
    "executive": "Executive (High-level strategic briefing with decision points and metrics)",
    "news_editorial": "News / Editorial (Journalistic inverted pyramid structure with strong headlines)",
    "technical": "Technical (Precise terminology, structured specifications, and logic)",
    "educational": "Educational (Modular explanations, illustrative analogies, and summaries)",
    "social_media": "Social Media (Hook-driven, snackable formatting with hashtags and callouts)",
    "public_advisory": "Public Advisory (Direct citizen-oriented instructions, FAQs, and action tables)",
    "storytelling": "Storytelling (Narrative arc connecting real-world challenges to solutions)",
    "minimal_direct": "Minimal & Direct (Ultra-lean, zero filler, essential takeaways only)",
    "narrative_storytelling": "Narrative & Storytelling (Arc-driven, illustrative scenarios)",
    "bulleted_structured": "Bulleted & Highly Structured (Categorized lists, headers, scannable)",
    "academic_formal": "Academic & Formal (Structured abstracts, methodological rigor)",
    "journalistic_punchy": "Journalistic & Punchy (Inverted pyramid, compelling headlines)",
    "executive_briefing": "Executive Briefing (Decisions, financial impacts, action items)",
}

DELIVERABLE_SPECIFICATIONS = {
    "executive_summary": {
        "name": "Executive Summary",
        "description": "High-level synthesis for leadership and decision-makers",
        "json_structure": {
            "title": "string: Title of the executive summary",
            "summary": "string: 2-3 paragraph executive overview",
            "key_points": ["string: 3-5 core strategic highlights"],
            "important_findings": ["string: critical findings or quantitative insights"],
            "recommended_actions": ["string: 2-4 recommended next steps or decisions"]
        }
    },
    "linkedin_post": {
        "name": "LinkedIn Thought Leadership Post",
        "description": "Professional social post optimized for LinkedIn engagement",
        "json_structure": {
            "hook": "string: compelling first 1-2 opening lines",
            "body": "string: core post text formatted with clean line breaks and emojis/bullets where appropriate",
            "call_to_action": "string: closing question or prompt to encourage discussion",
            "hashtags": ["string: 3-5 relevant industry hashtags starting with #"]
        }
    },
    "twitter_post": {
        "name": "Twitter / X Post & Thread",
        "description": "Concise, punchy thread or post for fast consumption",
        "json_structure": {
            "thread_posts": ["string: List of 1-4 numbered or standalone tweet blocks, max 280 chars each"],
            "key_takeaway": "string: one-line summary takeaway",
            "hashtags": ["string: 2-4 relevant hashtags"]
        }
    },
    "advisory": {
        "name": "Official Advisory & Policy Notice",
        "description": "Structured operational notice, guidance, or critical advisory",
        "json_structure": {
            "title": "string: Advisory title",
            "context": "string: background context and situation assessment",
            "key_information": ["string: official facts and points of note"],
            "action_items": ["string: immediate operational steps or requirements"],
            "cautions_or_notes": ["string: risk caveats, compliance notes, or timelines"]
        }
    },
    "infographic": {
        "name": "Infographic Architecture Plan",
        "description": "Content blueprint, data callouts, and visual layout guide for visual designers",
        "json_structure": {
            "title": "string: Infographic headline",
            "core_message": "string: primary takeaway",
            "key_facts_and_metrics": ["string: 3-5 standalone stats, metrics, or anchor facts"],
            "sections": [
                {
                    "heading": "string: section header",
                    "content": "string: concise narrative or stats for this visual section",
                    "visual_cue": "string: icon, chart type, or illustration concept"
                }
            ],
            "visual_layout_guidance": "string: design layout tips (e.g. vertical timeline, comparison grid, 3-step hierarchy)"
        }
    },
    "presentation": {
        "name": "Presentation Deck Content & Speaker Notes",
        "description": "Slide deck narrative structure with visual layout ideas and speaker notes",
        "json_structure": {
            "title": "string: Presentation deck title",
            "total_slides": "integer: total number of slides (3 to 6 slides)",
            "slides": [
                {
                    "slide_number": "integer",
                    "slide_title": "string: slide header",
                    "bullet_points": ["string: 3-4 concise slide bullet points"],
                    "visual_concept": "string: suggested diagram, chart, or layout for this slide",
                    "speaker_notes": "string: script notes for the presenter"
                }
            ]
        }
    },
    "video_package": {
        "name": "Video Package (Script, Scene Direction & Narration)",
        "description": "Comprehensive video package containing scene-by-scene script, visual directions, and narration",
        "json_structure": {
            "title": "string: Video package title",
            "duration_guidance": "string: estimated video duration (e.g. 60-90 seconds)",
            "scenes": [
                {
                    "scene_number": "integer",
                    "visual_direction": "string: camera angle, b-roll, motion graphics instruction",
                    "narration_script": "string: exact spoken voiceover line",
                    "on_screen_text": "string: lower-third or overlay title text"
                }
            ],
            "subtitles": "string: clean continuous transcript for subtitle generation"
        }
    }
}


def build_system_instruction() -> str:
    """Build the overarching system instructions for the GenAI transformation engine."""
    return (
        "You are the Core GenAI Content Transformation Engine for SIH 26154: 'Gen AI Platform for Automated Content Transformation'.\n"
        "Your mission is to perform rigorous, multi-deliverable content transformations on source text with strict fidelity, "
        "impeccable structural alignment, and full adherence to specified audience, tone, language, detail, objective, and style parameters.\n\n"
        "CRITICAL CONTENT INTEGRITY & SAFETY MANDATES:\n"
        "1. Strictly preserve all names, numbers, dates, locations, and facts from the source.\n"
        "2. Do NOT hallucinate or fabricate unsupported statistics or factual claims.\n"
        "3. Explicitly distinguish between source-derived facts and synthesized recommendations.\n"
        "4. If target language is non-English, translate and localize naturally while preserving exact numbers and technical accuracy.\n"
        "5. Output must strictly be valid JSON conforming to the requested schema.\n"
    )


def build_transformation_prompt(request: GenerationRequest) -> str:
    """Build the complete generation prompt incorporating all transformation parameters and requested deliverables."""
    # Resolve dimension strings
    audience_str = request.customAudience.strip() if request.audience == "custom" and request.customAudience.strip() else AUDIENCE_LABELS.get(request.audience, request.audience)
    tone_str = TONE_LABELS.get(request.tone, request.tone)
    language_str = request.customLanguage.strip() if request.language == "other" and request.customLanguage.strip() else LANGUAGE_LABELS.get(request.language, request.language)
    detail_str = DETAIL_LEVEL_LABELS.get(request.detailLevel, request.detailLevel)
    objective_str = OBJECTIVE_LABELS.get(request.objective, request.objective)
    style_str = CONTENT_STYLE_LABELS.get(request.contentStyle, request.contentStyle)

    # Deliverable specifications breakdown
    deliverables_info = []
    for d_id in request.deliverables:
        spec = DELIVERABLE_SPECIFICATIONS.get(d_id)
        if spec:
            deliverables_info.append(
                f"### Deliverable ID: \"{d_id}\"\n"
                f"- Name: {spec['name']}\n"
                f"- Objective: {spec['description']}\n"
                f"- Expected JSON structuredData layout:\n{json.dumps(spec['json_structure'], indent=2)}"
            )

    deliverables_block = "\n\n".join(deliverables_info)

    prompt = f"""=== TRANSFORMATION MATRIX PARAMETERS ===
1. TARGET AUDIENCE:
   {audience_str}

2. COMMUNICATION TONE:
   {tone_str}

3. TARGET LANGUAGE:
   {language_str} (Ensure all generated deliverables are authored in this target language!)

4. DETAIL LEVEL:
   {detail_str}

5. COMMUNICATION OBJECTIVE:
   {objective_str}

6. CONTENT STYLE:
   {style_str}

=== REQUESTED DELIVERABLES ({len(request.deliverables)}) ===
You MUST generate an entry in the deliverables array for EVERY ONE of the following deliverable IDs:
{deliverables_block}

=== RAW SOURCE MATERIAL ===
--- BEGIN SOURCE TEXT ---
{request.sourceText}
--- END SOURCE TEXT ---

=== OUTPUT JSON CONTRACT ===
You must return a single JSON object with the following schema:
{{
  "deliverables": [
    {{
      "deliverableId": "one of the requested deliverable IDs (e.g. executive_summary)",
      "title": "A crisp, descriptive title for this deliverable",
      "content": "A beautifully formatted markdown representation of the deliverable ready for immediate copy-pasting or rendering",
      "structuredData": {{ ... the structured fields matching the deliverable specification above ... }}
    }}
  ]
}}

Ensure every requested deliverable ID ({', '.join(request.deliverables)}) is present in the deliverables list.
Return ONLY valid JSON.
"""
    return prompt
