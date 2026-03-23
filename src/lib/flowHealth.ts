import type { Edge, Node } from "@xyflow/react";

import { getAllTemplates, getTemplate } from "@/engine/templateRegistry";
import { getNodeLabel } from "@/lib/nodeCatalog";
import type { NodeData } from "@/store/useFlowStore";

export type FlowHealthSeverity = "error" | "warning" | "suggestion";
export type BuilderRecommendationAction =
  | "focus-input"
  | "add-node"
  | "switch-template"
  | "review-graph";

export interface BuilderRecommendation {
  id: string;
  label: string;
  description: string;
  actionType: BuilderRecommendationAction;
  severity: FlowHealthSeverity;
  target?: string;
  nodeType?: string;
  templateId?: string;
}

export interface FlowHealthIssue {
  id: string;
  severity: FlowHealthSeverity;
  title: string;
  message: string;
  relatedNodeTypes: string[];
  recommendation?: BuilderRecommendation;
}

export interface TemplateSuggestion {
  templateId: string;
  templateName: string;
  score: number;
  reason: string;
}

export interface FlowHealthReport {
  issues: FlowHealthIssue[];
  missingNodeTypes: string[];
  recommendedNodeTypes: string[];
  nextBestStep: BuilderRecommendation | null;
  templateSuggestion: TemplateSuggestion | null;
  summary: string;
}

const CUSTOM_COMPOSE_TEMPLATE_ID = "custom-compose";
const SEVERITY_ORDER: Record<FlowHealthSeverity, number> = {
  error: 0,
  warning: 1,
  suggestion: 2,
};

function getNodeTypes(nodes: Node[]): Set<string> {
  return new Set(nodes.map((node) => node.type ?? "unknown"));
}

function getDegreeMap(nodes: Node[], edges: Edge[]): Map<string, number> {
  const degreeMap = new Map<string, number>();

  for (const node of nodes) {
    degreeMap.set(node.id, 0);
  }

  for (const edge of edges) {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) ?? 0) + 1);
    degreeMap.set(edge.target, (degreeMap.get(edge.target) ?? 0) + 1);
  }

  return degreeMap;
}

function compareIssues(first: FlowHealthIssue, second: FlowHealthIssue): number {
  const severityDiff =
    SEVERITY_ORDER[first.severity] - SEVERITY_ORDER[second.severity];
  if (severityDiff !== 0) return severityDiff;

  return first.title.localeCompare(second.title);
}

function findTemplateSuggestion(
  activeTemplateId: string,
  activeNodeTypes: Set<string>
): TemplateSuggestion | null {
  if (activeNodeTypes.size < 2) return null;

  const candidates = getAllTemplates().filter(
    (template) => template.id !== CUSTOM_COMPOSE_TEMPLATE_ID
  );
  const activeTemplate = getTemplate(activeTemplateId);

  const getScore = (templateId: string): number => {
    const template = getTemplate(templateId);
    if (!template) return 0;

    const templateNodeTypes = new Set(
      template.defaultNodes.map((node) => node.type ?? "unknown")
    );
    const overlap = Array.from(activeNodeTypes).filter((type) =>
      templateNodeTypes.has(type)
    );

    if (overlap.length === 0) return 0;

    const coverage = overlap.length / templateNodeTypes.size;
    const precision = overlap.length / activeNodeTypes.size;
    return coverage * 0.7 + precision * 0.3;
  };

  const currentScore = activeTemplate ? getScore(activeTemplate.id) : 0;
  const ranked = candidates
    .map((template) => {
      const templateNodeTypes = new Set(
        template.defaultNodes.map((node) => node.type ?? "unknown")
      );
      const overlap = Array.from(activeNodeTypes).filter((type) =>
        templateNodeTypes.has(type)
      );
      const score = getScore(template.id);

      return {
        template,
        overlap,
        score,
      };
    })
    .sort((first, second) => second.score - first.score);

  const best = ranked[0];
  if (!best) return null;
  if (best.template.id === activeTemplateId) return null;
  if (best.overlap.length < 2 || best.score < 0.65) return null;
  if (
    activeTemplateId !== CUSTOM_COMPOSE_TEMPLATE_ID &&
    best.score <= currentScore + 0.15
  ) {
    return null;
  }

  return {
    templateId: best.template.id,
    templateName: best.template.name,
    score: Number(best.score.toFixed(2)),
    reason: `Current graph already matches ${best.overlap
      .slice(0, 3)
      .map((type) => getNodeLabel(type))
      .join(", ")}.`,
  };
}

function buildGraphSummary(issues: FlowHealthIssue[]): string {
  if (issues.length === 0) return "Flow looks healthy";
  const headline = issues[0];
  return `${headline.title}: ${headline.message}`;
}

export function getFlowHealthReport(params: {
  activeTemplateId: string;
  nodeData: NodeData;
  nodes: Node[];
  edges?: Edge[];
}): FlowHealthReport {
  const { activeTemplateId, nodes } = params;
  const edges = params.edges ?? [];
  const issues: FlowHealthIssue[] = [];
  const missingNodeTypes = new Set<string>();
  const recommendedNodeTypes = new Set<string>();
  const activeNodeTypes = getNodeTypes(nodes);
  const degreeMap = getDegreeMap(nodes, edges);
  const isCustomCompose = activeTemplateId === CUSTOM_COMPOSE_TEMPLATE_ID;

  const pushIssue = (
    issue: FlowHealthIssue,
    options?: {
      missingNodeType?: string;
      recommendedNodeType?: string;
    }
  ) => {
    if (!issues.some((existing) => existing.id === issue.id)) {
      issues.push(issue);
    }

    if (options?.missingNodeType) {
      missingNodeTypes.add(options.missingNodeType);
    }

    if (options?.recommendedNodeType) {
      recommendedNodeTypes.add(options.recommendedNodeType);
    }
  };

  if (!activeNodeTypes.has("initNode")) {
    pushIssue(
      {
        id: "missing-init",
        severity: "error",
        title: "Init Contract is missing",
        message:
          "Add an Init Contract node so the graph has a contract shell and configurable inputs.",
        relatedNodeTypes: ["initNode"],
        recommendation: {
          id: "add-init-node",
          label: "Add Init Contract",
          description: "Create the contract shell first.",
          actionType: "add-node",
          severity: "error",
          nodeType: "initNode",
        },
      },
      { missingNodeType: "initNode" }
    );
  }

  if (isCustomCompose && nodes.length > 2 && edges.length === 0) {
    pushIssue({
      id: "no-connections",
      severity: "warning",
      title: "Flow shape is still disconnected",
      message:
        "Connect the active nodes so the canvas explains execution order and data flow to reviewers.",
      relatedNodeTypes: Array.from(activeNodeTypes),
      recommendation: {
        id: "review-graph-connections",
        label: "Connect the active nodes",
        description: "Use edges to explain how the flow moves from step to step.",
        actionType: "review-graph",
        severity: "warning",
      },
    });
  }

  if (isCustomCompose && edges.length > 0) {
    const orphanNode = nodes.find((node) => {
      if ((node.type ?? "unknown") === "initNode") return false;
      return (degreeMap.get(node.id) ?? 0) === 0;
    });

    if (orphanNode) {
      const orphanType = orphanNode.type ?? "unknown";
      pushIssue({
        id: `orphan-${orphanNode.id}`,
        severity: "warning",
        title: `${getNodeLabel(orphanType)} is disconnected`,
        message:
          "Connect this node into the flow so it is obvious why the capability exists in the contract.",
        relatedNodeTypes: [orphanType],
      });
    }
  }

  if (
    activeNodeTypes.has("webFetchNode") &&
    !activeNodeTypes.has("llmPromptNode") &&
    !activeNodeTypes.has("outputNode")
  ) {
    pushIssue(
      {
        id: "web-fetch-no-consumer",
        severity: "warning",
        title: "Web data has no visible consumer",
        message:
          "Fetched data should usually feed an LLM step or an Output node so the contract exposes what was retrieved.",
        relatedNodeTypes: ["webFetchNode"],
        recommendation: {
          id: "add-output-node",
          label: "Add Output",
          description: "Expose the fetched result through a view method.",
          actionType: "add-node",
          severity: "warning",
          nodeType: "outputNode",
        },
      },
      { recommendedNodeType: "outputNode" }
    );
  }

  if (
    activeNodeTypes.has("llmPromptNode") &&
    !activeNodeTypes.has("outputNode") &&
    !activeNodeTypes.has("storageNode")
  ) {
    pushIssue(
      {
        id: "llm-no-sink",
        severity: "warning",
        title: "AI output has nowhere to land",
        message:
          "Add Output or Storage so the graph shows where the model result is exposed or persisted.",
        relatedNodeTypes: ["llmPromptNode"],
        recommendation: {
          id: "add-output-for-llm",
          label: "Add Output",
          description: "Expose the generated result through a public view method.",
          actionType: "add-node",
          severity: "warning",
          nodeType: "outputNode",
        },
      },
      { recommendedNodeType: "outputNode" }
    );
  }

  if (
    activeNodeTypes.has("llmPromptNode") &&
    !activeNodeTypes.has("consensusNode")
  ) {
    pushIssue(
      {
        id: "llm-no-consensus",
        severity: "suggestion",
        title: "AI flow can be hardened with consensus",
        message:
          "Add Consensus when validators need to converge on a non-deterministic AI result before export or review.",
        relatedNodeTypes: ["llmPromptNode"],
        recommendation: {
          id: "add-consensus-node",
          label: "Add Consensus",
          description: "Wrap AI output in a validator agreement step.",
          actionType: "add-node",
          severity: "suggestion",
          nodeType: "consensusNode",
        },
      },
      { recommendedNodeType: "consensusNode" }
    );
  }

  if (
    activeNodeTypes.has("consensusNode") &&
    !activeNodeTypes.has("llmPromptNode") &&
    !activeNodeTypes.has("webFetchNode") &&
    !activeNodeTypes.has("httpNode")
  ) {
    pushIssue(
      {
        id: "consensus-no-source",
        severity: "warning",
        title: "Consensus has no non-deterministic source",
        message:
          "Consensus is most useful after web, AI, or API work. Add a source node so the validator step has something to evaluate.",
        relatedNodeTypes: ["consensusNode"],
        recommendation: {
          id: "add-llm-for-consensus",
          label: "Add LLM Prompt",
          description: "Create a non-deterministic step for consensus to wrap.",
          actionType: "add-node",
          severity: "warning",
          nodeType: "llmPromptNode",
        },
      },
      { recommendedNodeType: "llmPromptNode" }
    );
  }

  if (
    activeNodeTypes.has("payableNode") &&
    !activeNodeTypes.has("accessControlNode")
  ) {
    pushIssue(
      {
        id: "payable-no-guard",
        severity: "warning",
        title: "Payable flow is missing an access guard",
        message:
          "Add Access Control so token-handling paths are clearly protected by an owner check.",
        relatedNodeTypes: ["payableNode"],
        recommendation: {
          id: "add-access-control",
          label: "Add Access Control",
          description: "Protect write paths before handling value.",
          actionType: "add-node",
          severity: "warning",
          nodeType: "accessControlNode",
        },
      },
      { recommendedNodeType: "accessControlNode" }
    );
  }

  if (
    (activeNodeTypes.has("dynArrayNode") || activeNodeTypes.has("treeMapNode")) &&
    !activeNodeTypes.has("storageNode")
  ) {
    pushIssue(
      {
        id: "collection-no-storage",
        severity: "warning",
        title: "Collection helpers need storage context",
        message:
          "Add Storage so array or map helpers are anchored in an explicit on-chain state model.",
        relatedNodeTypes: ["dynArrayNode", "treeMapNode"],
        recommendation: {
          id: "add-storage-node",
          label: "Add Storage",
          description: "Anchor collection helpers in persisted contract state.",
          actionType: "add-node",
          severity: "warning",
          nodeType: "storageNode",
        },
      },
      { recommendedNodeType: "storageNode" }
    );
  }

  if (
    activeNodeTypes.has("vecDBNode") &&
    !activeNodeTypes.has("llmPromptNode")
  ) {
    pushIssue(
      {
        id: "vecdb-no-retrieval-consumer",
        severity: "suggestion",
        title: "Vector search is stronger with an AI consumer",
        message:
          "Add LLM Prompt if you want retrieved semantic context to drive a contract decision instead of only storing embeddings.",
        relatedNodeTypes: ["vecDBNode"],
        recommendation: {
          id: "add-llm-for-vecdb",
          label: "Add LLM Prompt",
          description: "Use retrieved context in a generated decision step.",
          actionType: "add-node",
          severity: "suggestion",
          nodeType: "llmPromptNode",
        },
      },
      { recommendedNodeType: "llmPromptNode" }
    );
  }

  if (
    activeNodeTypes.has("contractCallNode") &&
    !activeNodeTypes.has("outputNode") &&
    !activeNodeTypes.has("storageNode")
  ) {
    pushIssue(
      {
        id: "contract-call-no-result",
        severity: "suggestion",
        title: "External call result is not surfaced",
        message:
          "Add Output or Storage so downstream users can inspect what the external call returned.",
        relatedNodeTypes: ["contractCallNode"],
        recommendation: {
          id: "add-output-for-contract-call",
          label: "Add Output",
          description: "Expose the external call result through a view method.",
          actionType: "add-node",
          severity: "suggestion",
          nodeType: "outputNode",
        },
      },
      { recommendedNodeType: "outputNode" }
    );
  }

  const templateSuggestion = findTemplateSuggestion(
    activeTemplateId,
    activeNodeTypes
  );

  if (templateSuggestion) {
    pushIssue({
      id: `template-fit-${templateSuggestion.templateId}`,
      severity: "suggestion",
      title: `${templateSuggestion.templateName} may fit better`,
      message: templateSuggestion.reason,
      relatedNodeTypes: Array.from(activeNodeTypes),
      recommendation: {
        id: `switch-template-${templateSuggestion.templateId}`,
        label: `Switch to ${templateSuggestion.templateName}`,
        description:
          "Use the preset when your current graph already matches a known product flow.",
        actionType: "switch-template",
        severity: "suggestion",
        templateId: templateSuggestion.templateId,
      },
    });
  }

  const sortedIssues = [...issues].sort(compareIssues);
  const nextBestStep =
    sortedIssues.find((issue) => issue.recommendation)?.recommendation ?? null;

  return {
    issues: sortedIssues,
    missingNodeTypes: Array.from(missingNodeTypes),
    recommendedNodeTypes: Array.from(recommendedNodeTypes),
    nextBestStep,
    templateSuggestion,
    summary: buildGraphSummary(sortedIssues),
  };
}
