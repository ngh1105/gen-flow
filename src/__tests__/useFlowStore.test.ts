import { describe, expect, it } from "vitest";
import {
  migrateNodeData,
  sanitizeSavedNodes,
  sanitizeSavedEdges,
  sanitizeSavedCustomCode,
  type NodeData,
} from "@/store/useFlowStore";

describe("useFlowStore migrateNodeData", () => {
  it("falls back unknown field/arg types to str and drops malformed entries", () => {
    const migrated = migrateNodeData({
      contractName: "Demo",
      storageFields: [
        { id: "sf-1", name: "a", type: "u256" },
        { id: "sf-2", name: "b", type: "UnknownType" },
        { id: "", name: "c", type: "str" },
      ],
      constructorArgs: [
        { id: "ca-1", name: "x", type: "DynArray[str]" },
        { id: "ca-2", name: "y", type: "NotAllowed" },
        { id: "", name: "z", type: "str" },
      ],
    });

    expect(migrated.storageFields).toHaveLength(2);
    expect(migrated.storageFields[0].type).toBe("u256");
    expect(migrated.storageFields[1].type).toBe("str");

    expect(migrated.constructorArgs).toHaveLength(2);
    expect(migrated.constructorArgs[0].type).toBe("DynArray[str]");
    expect(migrated.constructorArgs[1].type).toBe("str");
  });

  it("normalizes non-array field containers to empty arrays", () => {
    const raw = { storageFields: "oops", constructorArgs: 123 } as unknown as Partial<NodeData>;
    const migrated = migrateNodeData(raw);
    expect(Array.isArray(migrated.storageFields)).toBe(true);
    expect(Array.isArray(migrated.constructorArgs)).toBe(true);
    expect(migrated.storageFields).toHaveLength(0);
    expect(migrated.constructorArgs).toHaveLength(0);
  });
});

describe("saved contract graph sanitizers", () => {
  it("keeps valid nodes and drops malformed nodes", () => {
    const nodes = sanitizeSavedNodes([
      { id: "n1", type: "initNode", position: { x: 10, y: 20 }, data: {} },
      { id: "", type: "storageNode", position: { x: 0, y: 0 }, data: {} },
      { type: "llmPromptNode" },
      { id: "n2", type: "storageNode", position: { x: 5 }, data: null },
    ]);

    expect(nodes).toHaveLength(2);
    expect(nodes[0].id).toBe("n1");
    expect(nodes[1].id).toBe("n2");
    // fallback defaults should be applied for partial/invalid nested fields
    expect(nodes[1].position.y).toBe(0);
  });

  it("drops dangling or malformed edges based on known node ids", () => {
    const nodeIds = new Set(["n1", "n2"]);
    const edges = sanitizeSavedEdges(
      [
        { id: "e1", source: "n1", target: "n2" },
        { id: "e2", source: "n1", target: "missing" },
        { id: "", source: "n1", target: "n2" },
        { source: "n1", target: "n2" },
      ],
      nodeIds
    );

    expect(edges).toHaveLength(1);
    expect(edges[0].id).toBe("e1");
  });
});

describe("saved contract custom code sanitizer", () => {
  it("keeps valid string as-is", () => {
    expect(sanitizeSavedCustomCode("print('ok')")).toBe("print('ok')");
  });

  it("normalizes non-string customCode to empty string", () => {
    expect(sanitizeSavedCustomCode(undefined)).toBe("");
    expect(sanitizeSavedCustomCode(123)).toBe("");
    expect(sanitizeSavedCustomCode({})).toBe("");
  });
});
