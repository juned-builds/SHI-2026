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
    id: "assemble_schemas",
    title: "3. Deliverable Schemas & Prompts Assembly",
    description: "Generating JSON schemas and context payloads for each selected deliverable.",
    status: "pending",
    detail: "Mapping deliverable templates to configuration matrix",
  },
  {
    id: "pipeline_ready",
    title: "4. Generation Pipeline Staged",
    description: "Pipeline ready for GenAI model execution.",
    status: "pending",
    detail: "Local preparation complete — staged for future AI execution engine",
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
