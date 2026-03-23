import { describe, expect, it } from "vitest";

import {
  createProjectDocument,
  parseProjectDocument,
  serializeProjectDocument,
} from "@/lib/projectDocument";
import type { BuilderSnapshot } from "@/store/useFlowStore";

const SNAPSHOT: BuilderSnapshot = {
  activeTemplateId: "custom-compose",
  nodes: [
    { id: "init-1", type: "initNode", position: { x: 0, y: 0 }, data: {} },
    { id: "llm-1", type: "llmPromptNode", position: { x: 120, y: 120 }, data: {} },
  ],
  edges: [{ id: "e1", source: "init-1", target: "llm-1" }],
  nodeData: {
    contractName: "PortableDemo",
    url: "",
    prompt: "Analyze the payload",
    numValidators: 3,
    storageName: "",
    storageFields: [],
    constructorArgs: [],
  },
  customCode: "print('manual override')",
  editorMode: "code",
};

describe("project documents", () => {
  it("round-trips a versioned project document", () => {
    const document = createProjectDocument({
      name: "Portable Demo",
      snapshot: SNAPSHOT,
      lastNamedSaveAt: 123,
      lastDraftSavedAt: 456,
    });

    const parsed = parseProjectDocument(serializeProjectDocument(document));

    expect(parsed.documentType).toBe("genflow-project");
    expect(parsed.snapshot.activeTemplateId).toBe("custom-compose");
    expect(parsed.snapshot.nodeData.contractName).toBe("PortableDemo");
    expect(parsed.snapshot.customCode).toBe("print('manual override')");
    expect(parsed.metadata.lastNamedSaveAt).toBe(123);
  });

  it("rejects non-GenFlow JSON", () => {
    expect(() => parseProjectDocument(JSON.stringify({ hello: "world" }))).toThrow(
      /not a GenFlow project JSON document/i
    );
  });

  it("migrates a legacy snapshot-shaped payload", () => {
    const parsed = parseProjectDocument(
      JSON.stringify({
        activeTemplateId: "simple-storage",
        name: "Legacy Demo",
        nodeData: {
          contractName: "LegacyDemo",
        },
        nodes: [
          { id: "init-1", type: "initNode", position: { x: 0, y: 0 }, data: {} },
        ],
        edges: [],
        customCode: 42,
        editorMode: "visual",
      })
    );

    expect(parsed.documentType).toBe("genflow-project");
    expect(parsed.metadata.name).toBe("Legacy Demo");
    expect(parsed.snapshot.activeTemplateId).toBe("simple-storage");
    expect(parsed.snapshot.customCode).toBe("");
  });
});
