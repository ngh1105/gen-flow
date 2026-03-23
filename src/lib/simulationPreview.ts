import type { Edge, Node } from "@xyflow/react";

import { generateCode } from "@/engine/codeGenerator";
import { getNodeLabel } from "@/lib/nodeCatalog";
import type { NodeData } from "@/store/useFlowStore";

export interface PreviewInput {
  id: string;
  label: string;
  type: string;
  sampleValue: string;
  required: boolean;
}

export interface PreviewStep {
  id: string;
  title: string;
  description: string;
  nodeType?: string;
}

export interface PreviewResult {
  methods: string[];
  dependencies: string[];
  expectedInputs: string[];
  summary: string;
}

export interface PreviewScenario {
  title: string;
  description: string;
  inputs: PreviewInput[];
  steps: PreviewStep[];
  result: PreviewResult;
}

function parsePublicMethods(code: string): string[] {
  const methodMatches = Array.from(
    code.matchAll(/^\s+def\s+([a-zA-Z_][a-zA-Z0-9_]*)\(/gm)
  )
    .map((match) => match[1])
    .filter((name) => name !== "__init__" && !name.startsWith("_"));

  return Array.from(new Set(methodMatches));
}

function getDependencies(code: string): string[] {
  const dependencies: string[] = [];

  if (code.includes("gl.nondet.web.render") || code.includes("gl.nondet.web.get")) {
    dependencies.push("Web / API access");
  }

  if (code.includes("gl.nondet.exec_prompt")) {
    dependencies.push("LLM prompt execution");
  }

  if (code.includes("gl.vm.run_nondet") || code.includes("gl.eq_principle")) {
    dependencies.push("Validator consensus");
  }

  if (code.includes("VecDB(") || code.includes("genlayer_embeddings")) {
    dependencies.push("Vector search");
  }

  if (code.includes("@gl.evm.contract_interface")) {
    dependencies.push("EVM bridge");
  }

  if (code.includes("@gl.public.write.payable")) {
    dependencies.push("Payable writes");
  }

  if (dependencies.length === 0) {
    dependencies.push("On-chain state only");
  }

  return dependencies;
}

function buildInputs(nodeData: NodeData, nodeTypes: Set<string>): PreviewInput[] {
  const inputs: PreviewInput[] = [];

  if (nodeTypes.has("webFetchNode") || nodeTypes.has("httpNode")) {
    inputs.push({
      id: "preview-url",
      label: "Data source URL",
      type: "url",
      sampleValue: nodeData.url || "https://example.com/data",
      required: true,
    });
  }

  if (nodeTypes.has("llmPromptNode")) {
    inputs.push({
      id: "preview-prompt",
      label: "AI instruction",
      type: "textarea",
      sampleValue:
        nodeData.prompt || "Review the input and return a structured response.",
      required: true,
    });
  }

  for (const arg of nodeData.constructorArgs) {
    inputs.push({
      id: `preview-ctor-${arg.id}`,
      label: arg.name || "constructor_arg",
      type: arg.type,
      sampleValue:
        arg.type === "bool"
          ? "false"
          : arg.type.toLowerCase().includes("address")
            ? "0x1234..."
            : "sample",
      required: true,
    });
  }

  if (nodeTypes.has("storageNode")) {
    inputs.push({
      id: "preview-runtime-storage",
      label: "Runtime write input",
      type: "str",
      sampleValue: "updated value",
      required: false,
    });
  }

  if (nodeTypes.has("llmPromptNode") && !nodeTypes.has("payableNode")) {
    inputs.push({
      id: "preview-runtime-payload",
      label: "Method input payload",
      type: "str",
      sampleValue: "Sample submission for evaluation",
      required: false,
    });
  }

  return inputs;
}

function buildStepDescription(nodeType: string, nodeData: NodeData): string {
  switch (nodeType) {
    case "initNode":
      return `Initialize ${nodeData.contractName || "the contract"} and any constructor-backed state.`;
    case "webFetchNode":
      return `Fetch live source data from ${nodeData.url || "the configured URL"}.`;
    case "llmPromptNode":
      return `Run the active AI prompt${nodeData.prompt ? `: "${nodeData.prompt.slice(0, 60)}"` : ""}.`;
    case "storageNode":
      return "Persist or update on-chain state for later reads.";
    case "outputNode":
      return "Expose the latest result through a public view method.";
    case "consensusNode":
      return "Have validators agree on the non-deterministic result before finalizing it.";
    case "accessControlNode":
      return "Restrict writes to the contract owner or an approved caller.";
    case "payableNode":
      return "Accept value transfers while updating contract state.";
    case "contractCallNode":
      return "Call another contract and record the returned result.";
    case "vecDBNode":
      return "Store or search semantic embeddings for later retrieval.";
    default:
      return `Apply the ${getNodeLabel(nodeType)} capability as part of the flow.`;
  }
}

export function getPreviewScenario(params: {
  activeTemplateId: string;
  nodeData: NodeData;
  nodes: Node[];
  edges?: Edge[];
  generatedCode?: string;
}): PreviewScenario {
  const { activeTemplateId, nodeData, nodes } = params;
  const code =
    params.generatedCode ??
    generateCode(nodeData, activeTemplateId, nodes);
  const nodeTypes = new Set(nodes.map((node) => node.type ?? "unknown"));
  const methods = parsePublicMethods(code);
  const dependencies = getDependencies(code);
  const inputs = buildInputs(nodeData, nodeTypes);
  const steps = nodes.map((node, index) => {
    const nodeType = node.type ?? "unknown";

    return {
      id: `preview-step-${node.id}`,
      title: `${String(index + 1).padStart(2, "0")} ${getNodeLabel(nodeType)}`,
      description: buildStepDescription(nodeType, nodeData),
      nodeType,
    };
  });

  return {
    title: nodeData.contractName || "GenFlow Contract Preview",
    description:
      activeTemplateId === "custom-compose"
        ? "Client-side walkthrough of the current composed graph."
        : "Client-side walkthrough of the selected template with your current inputs.",
    inputs,
    steps,
    result: {
      methods,
      dependencies,
      expectedInputs: inputs.map((input) => input.label),
      summary: `This preview estimates what the current graph expects and exposes. It does not execute GenLayer code or validate runtime correctness.`,
    },
  };
}
