import type { Edge, Node } from "@xyflow/react";

import {
  getFlowHealthReport,
  type BuilderRecommendation,
  type FlowHealthIssue,
} from "@/lib/flowHealth";
import type { NodeData } from "@/store/useFlowStore";

type RequirementId = "contract-name" | "url" | "prompt";

export interface ExportRequirement {
  id: RequirementId;
  label: string;
  required: boolean;
  done: boolean;
  message: string;
}

export interface BuilderIssue {
  id: string;
  label: string;
  message: string;
  severity: "error" | "warning" | "suggestion";
}

export interface BuilderStatus {
  requirements: ExportRequirement[];
  blockers: BuilderIssue[];
  warnings: BuilderIssue[];
  preview: {
    required: boolean;
    reviewed: boolean;
    blocked: boolean;
    message: string;
  };
  health: {
    issues: FlowHealthIssue[];
    missingNodeTypes: string[];
    recommendedNodeTypes: string[];
    summary: string;
  };
  nextBestStep: BuilderRecommendation | null;
  readyToExport: boolean;
  summary: string;
}

function requirementToIssue(requirement: ExportRequirement): BuilderIssue {
  return {
    id: requirement.id,
    label: requirement.label,
    message: requirement.message,
    severity: "error",
  };
}

function healthIssueToBuilderIssue(issue: FlowHealthIssue): BuilderIssue {
  return {
    id: issue.id,
    label: issue.title,
    message: issue.message,
    severity: issue.severity,
  };
}

function getRequirementRecommendation(
  requirement: ExportRequirement
): BuilderRecommendation {
  const focusTarget =
    requirement.id === "contract-name"
      ? "contract-name-input"
      : requirement.id === "url"
        ? "url-input"
        : "prompt-input";

  return {
    id: `focus-${requirement.id}`,
    label: `Complete ${requirement.label}`,
    description: requirement.message,
    actionType: "focus-input",
    severity: "error",
    target: focusTarget,
  };
}

export function getExportRequirements(
  nodeData: NodeData,
  nodes: Node[]
): ExportRequirement[] {
  const activeNodeTypes = new Set(nodes.map((node) => node.type ?? "unknown"));

  return [
    {
      id: "contract-name",
      label: "Contract name",
      required: true,
      done: nodeData.contractName.trim() !== "",
      message:
        "Add a contract name so GenFlow can generate the Python class and export filename.",
    },
    {
      id: "prompt",
      label: "Prompt",
      required: activeNodeTypes.has("llmPromptNode"),
      done: nodeData.prompt.trim() !== "",
      message:
        "LLM Prompt nodes need an instruction before GenFlow can export the contract.",
    },
    {
      id: "url",
      label: "URL",
      required:
        activeNodeTypes.has("webFetchNode") || activeNodeTypes.has("httpNode"),
      done: nodeData.url.trim() !== "",
      message:
        "Web Fetch and HTTP Request nodes need a source URL before GenFlow can export the contract.",
    },
  ];
}

export function getBuilderStatus(
  nodeData: NodeData,
  nodes: Node[],
  options: {
    activeTemplateId?: string;
    edges?: Edge[];
    enforcePreviewReview?: boolean;
    previewReviewed?: boolean;
  } = {}
): BuilderStatus {
  const requirements = getExportRequirements(nodeData, nodes);
  const blockers = requirements
    .filter((requirement) => requirement.required && !requirement.done)
    .map(requirementToIssue);
  const previewRequired =
    options.enforcePreviewReview === true &&
    (options.activeTemplateId ?? "custom-compose") !== "custom-compose";
  const previewReviewed = !previewRequired || options.previewReviewed === true;
  const previewBlocked = previewRequired && !previewReviewed;
  const readyToExport = blockers.length === 0 && !previewBlocked;
  const healthReport = getFlowHealthReport({
    activeTemplateId: options.activeTemplateId ?? "custom-compose",
    nodeData,
    nodes,
    edges: options.edges,
  });
  const warnings = healthReport.issues.map(healthIssueToBuilderIssue);
  const nextBestStep =
    blockers.length > 0
      ? getRequirementRecommendation(
          requirements.find(
            (requirement) =>
              requirement.required && requirement.done === false
          )!
        )
      : healthReport.nextBestStep;

  return {
    requirements,
    blockers,
    warnings,
    preview: {
      required: previewRequired,
      reviewed: previewReviewed,
      blocked: previewBlocked,
      message: previewBlocked
        ? "Open Preview once for the current draft before exporting."
        : previewRequired
          ? "Preview reviewed for the current draft."
          : "Preview review is optional in this workspace.",
    },
    health: {
      issues: healthReport.issues,
      missingNodeTypes: healthReport.missingNodeTypes,
      recommendedNodeTypes: healthReport.recommendedNodeTypes,
      summary: healthReport.summary,
    },
    nextBestStep,
    readyToExport,
    summary:
      blockers.length > 0
        ? `Missing ${blockers.map((item) => item.label).join(", ")}`
        : previewBlocked
          ? "Preview this draft before export"
        : warnings.length > 0
          ? `Ready to export with ${warnings.length} flow warning${warnings.length > 1 ? "s" : ""}`
          : "Ready to export",
  };
}

export function isExportReady(requirements: ExportRequirement[]): boolean {
  return requirements.every(
    (requirement) => !requirement.required || requirement.done
  );
}

export function getMissingExportLabels(
  requirements: ExportRequirement[]
): string[] {
  return requirements
    .filter((requirement) => requirement.required && !requirement.done)
    .map((requirement) => requirement.label);
}
