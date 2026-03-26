import { describe, expect, it } from "vitest";

import { getTemplateFormDefinition } from "@/lib/templateForm";
import type { NodeData } from "@/store/useFlowStore";

const EMPTY_NODE_DATA: NodeData = {
  contractName: "",
  url: "",
  prompt: "",
  numValidators: 3,
  storageName: "",
  storageFields: [],
  constructorArgs: [],
};

describe("templateForm", () => {
  it("includes source and AI sections when the active template needs them", () => {
    const definition = getTemplateFormDefinition({
      templateName: "Onchain Justice",
      nodeData: EMPTY_NODE_DATA,
      nodes: [
        { id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} },
        { id: "n2", type: "webFetchNode", position: { x: 0, y: 0 }, data: {} },
        { id: "n3", type: "llmPromptNode", position: { x: 0, y: 0 }, data: {} },
      ],
    });

    expect(definition.sections.map((section) => section.id)).toEqual(
      expect.arrayContaining(["basics", "source", "ai-behavior", "launch-settings"])
    );
  });

  it("marks required guided fields as done when the user filled them", () => {
    const definition = getTemplateFormDefinition({
      templateName: "Oracle Benchmark",
      nodeData: {
        ...EMPTY_NODE_DATA,
        contractName: "Oracle Benchmark",
        url: "https://example.com/feed",
        prompt: "Compare the source result and produce a verdict.",
      },
      nodes: [
        { id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} },
        { id: "n2", type: "webFetchNode", position: { x: 0, y: 0 }, data: {} },
        { id: "n3", type: "llmPromptNode", position: { x: 0, y: 0 }, data: {} },
      ],
    });

    const fields = definition.sections.flatMap((section) => section.fields);
    expect(fields.find((field) => field.id === "contract-name")?.done).toBe(true);
    expect(fields.find((field) => field.id === "url")?.done).toBe(true);
    expect(fields.find((field) => field.id === "prompt")?.done).toBe(true);
  });
});
