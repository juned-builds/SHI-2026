import { PipelineStage, DeliverableId, DeliverablePipelineItem } from "../types";
import { DELIVERABLES_CATALOG } from "./transformationOptions";

export const INITIAL_PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "validate_source",
    title: "1. Source Content Verification",
    description: "Validating integrity, word distribution, and character limits of source text.",
    status: "pending",
    detail: "Zero loss validation across in-memory buffers",
  },
  {
    id: "formulate_constraints",
    title: "2. Transformation Constraints Formulation",
    description: "Structuring tone, target audience persona, and localization rules.",
    status: "pending",
    detail: "Synthesizing editorial rules and language targets",
  },
  {
    id: "gemini_execution",
    title: "3. Gemini GenAI Engine Execution",
    description: "Executing structured AI transformation through FastAPI backend.",
    status: "pending",
    detail: "Synthesizing multi-deliverable JSON output via Google GenAI SDK",
  },
  {
    id: "synthesize_deliverables",
    title: "4. Deliverables Synthesized & Validated",
    description: "Transformations validated and formatted for review.",
    status: "pending",
    detail: "Multi-format outputs ready for consumption",
  },
];

export function createDeliverablePipelineItems(
  deliverableIds: DeliverableId[]
): DeliverablePipelineItem[] {
  return deliverableIds.map((id) => {
    const meta = DELIVERABLES_CATALOG.find((d) => d.id === id);
    return {
      deliverableId: id,
      name: meta?.name || id,
      description: meta?.description || "",
      category: meta?.category || "general",
      status: "queued",
      promptSchemaReady: false,
    };
  });
}
