import { describe, expect, it } from "vitest";

import { getFlowHealthReport } from "@/lib/flowHealth";
import type { NodeData } from "@/store/useFlowStore";

const EMPTY_NODE_DATA: NodeData = {
  contractName: "Demo",
  url: "",
  prompt: "",
  numValidators: 3,
  storageName: "",
  storageFields: [],
  constructorArgs: [],
};

describe("flow health", () => {
  it("prioritizes missing sinks for AI flows", () => {
    const report = getFlowHealthReport({
      activeTemplateId: "custom-compose",
      nodeData: {
        ...EMPTY_NODE_DATA,
        prompt: "Review the input",
      },
      nodes: [
        { id: "init-1", type: "initNode", position: { x: 0, y: 0 }, data: {} },
        { id: "llm-1", type: "llmPromptNode", position: { x: 0, y: 120 }, data: {} },
      ],
      edges: [],
    });

    expect(report.recommendedNodeTypes).toEqual(
      expect.arrayContaining(["outputNode", "consensusNode"])
    );
    expect(report.nextBestStep).toMatchObject({
      actionType: "add-node",
      nodeType: "outputNode",
    });
  });

  it("flags payable flows without access control", () => {
    const report = getFlowHealthReport({
      activeTemplateId: "custom-compose",
      nodeData: EMPTY_NODE_DATA,
      nodes: [
        { id: "init-1", type: "initNode", position: { x: 0, y: 0 }, data: {} },
        { id: "pay-1", type: "payableNode", position: { x: 0, y: 120 }, data: {} },
      ],
      edges: [],
    });

    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "payable-no-guard",
          severity: "warning",
        }),
      ])
    );
    expect(report.recommendedNodeTypes).toContain("accessControlNode");
  });

  it("suggests a stronger preset when the custom graph matches a known template", () => {
    const report = getFlowHealthReport({
      activeTemplateId: "custom-compose",
      nodeData: {
        ...EMPTY_NODE_DATA,
        url: "https://example.com/rules",
        prompt: "Review the dispute",
      },
      nodes: [
        { id: "init-1", type: "initNode", position: { x: 0, y: 0 }, data: {} },
        { id: "storage-1", type: "storageNode", position: { x: 0, y: 120 }, data: {} },
        { id: "web-1", type: "webFetchNode", position: { x: 0, y: 240 }, data: {} },
        { id: "llm-1", type: "llmPromptNode", position: { x: 0, y: 360 }, data: {} },
        { id: "consensus-1", type: "consensusNode", position: { x: 0, y: 480 }, data: {} },
        { id: "output-1", type: "outputNode", position: { x: 0, y: 600 }, data: {} },
      ],
      edges: [
        { id: "e1", source: "init-1", target: "storage-1" },
        { id: "e2", source: "storage-1", target: "web-1" },
        { id: "e3", source: "web-1", target: "llm-1" },
        { id: "e4", source: "llm-1", target: "consensus-1" },
        { id: "e5", source: "consensus-1", target: "output-1" },
      ],
    });

    expect(report.templateSuggestion).not.toBeNull();
    expect(["onchain-justice", "prediction-market"]).toContain(
      report.templateSuggestion?.templateId
    );
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.stringMatching(/^template-fit-/),
        }),
      ])
    );
  });
});
