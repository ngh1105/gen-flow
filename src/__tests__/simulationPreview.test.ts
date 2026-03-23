import { describe, expect, it } from "vitest";

import { getPreviewScenario } from "@/lib/simulationPreview";
import type { NodeData } from "@/store/useFlowStore";

const BASE_NODE_DATA: NodeData = {
  contractName: "PreviewDemo",
  url: "https://example.com/feed",
  prompt: "Review the fetched signal and return a verdict.",
  numValidators: 3,
  storageName: "",
  storageFields: [],
  constructorArgs: [],
};

describe("simulation preview", () => {
  it("derives sample inputs, dependencies, and methods from the current flow", () => {
    const scenario = getPreviewScenario({
      activeTemplateId: "custom-compose",
      nodeData: BASE_NODE_DATA,
      nodes: [
        { id: "init-1", type: "initNode", position: { x: 0, y: 0 }, data: {} },
        { id: "web-1", type: "webFetchNode", position: { x: 0, y: 120 }, data: {} },
        { id: "llm-1", type: "llmPromptNode", position: { x: 0, y: 240 }, data: {} },
        { id: "consensus-1", type: "consensusNode", position: { x: 0, y: 360 }, data: {} },
        { id: "output-1", type: "outputNode", position: { x: 0, y: 480 }, data: {} },
      ],
      edges: [
        { id: "e1", source: "init-1", target: "web-1" },
        { id: "e2", source: "web-1", target: "llm-1" },
      ],
    });

    expect(scenario.inputs.map((input) => input.label)).toEqual(
      expect.arrayContaining(["Data source URL", "AI instruction"])
    );
    expect(scenario.result.dependencies).toEqual(
      expect.arrayContaining([
        "Web / API access",
        "LLM prompt execution",
        "Validator consensus",
      ])
    );
    expect(scenario.result.methods).toEqual(
      expect.arrayContaining(["analyze", "get_result"])
    );
    expect(scenario.steps).toHaveLength(5);
  });

  it("falls back to on-chain state only when no external dependencies are present", () => {
    const scenario = getPreviewScenario({
      activeTemplateId: "simple-storage",
      nodeData: {
        ...BASE_NODE_DATA,
        prompt: "",
        url: "",
      },
      nodes: [
        { id: "init-1", type: "initNode", position: { x: 0, y: 0 }, data: {} },
        { id: "storage-1", type: "storageNode", position: { x: 0, y: 120 }, data: {} },
        { id: "output-1", type: "outputNode", position: { x: 0, y: 240 }, data: {} },
      ],
      edges: [],
    });

    expect(scenario.result.dependencies).toContain("On-chain state only");
    expect(scenario.result.methods.length).toBeGreaterThan(0);
  });
});
