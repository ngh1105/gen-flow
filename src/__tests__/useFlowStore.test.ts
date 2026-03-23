import { beforeEach, describe, expect, it } from "vitest";
import {
  getBuilderSnapshotFingerprint,
  migrateNodeData,
  sanitizeSavedNodes,
  sanitizeSavedEdges,
  sanitizeSavedCustomCode,
  useFlowStore,
  type NodeData,
} from "@/store/useFlowStore";

const EMPTY_NODE_DATA: NodeData = {
  contractName: "",
  url: "",
  prompt: "",
  numValidators: 3,
  storageName: "",
  storageFields: [],
  constructorArgs: [],
};

beforeEach(() => {
  const baselineFingerprint = getBuilderSnapshotFingerprint({
    activeTemplateId: "simple-storage",
    nodes: [],
    edges: [],
    nodeData: EMPTY_NODE_DATA,
    customCode: "",
    editorMode: "visual",
  });
  useFlowStore.setState({
    activeTemplateId: "simple-storage",
    nodes: [],
    edges: [],
    nodeData: EMPTY_NODE_DATA,
    editorMode: "visual",
    customCode: "",
    savedContracts: [],
    activeSavedContractId: null,
    hasUnsavedChanges: false,
    lastDraftSavedAt: null,
    lastNamedSaveAt: null,
    restoredDraftAt: null,
    baselineFingerprint,
  });
});

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

describe("useFlowStore custom-compose guards", () => {
  it("ignores addNode outside custom-compose", () => {
    useFlowStore.getState().addNode("llmPromptNode", { x: 10, y: 20 });
    expect(useFlowStore.getState().nodes).toHaveLength(0);
  });

  it("allows addNode in custom-compose", () => {
    useFlowStore.setState({ activeTemplateId: "custom-compose" });
    useFlowStore.getState().addNode("llmPromptNode", { x: 10, y: 20 });

    const nodes = useFlowStore.getState().nodes;
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe("llmPromptNode");
  });

  it("ignores new edge connections outside custom-compose", () => {
    useFlowStore.setState({
      nodes: [
        { id: "a", type: "initNode", position: { x: 0, y: 0 }, data: {} },
        { id: "b", type: "outputNode", position: { x: 10, y: 10 }, data: {} },
      ],
    });

    useFlowStore.getState().onConnect({ source: "a", target: "b" });
    expect(useFlowStore.getState().edges).toHaveLength(0);
  });

  it("allows new edge connections in custom-compose", () => {
    useFlowStore.setState({
      activeTemplateId: "custom-compose",
      nodes: [
        { id: "a", type: "initNode", position: { x: 0, y: 0 }, data: {} },
        { id: "b", type: "outputNode", position: { x: 10, y: 10 }, data: {} },
      ],
    });

    useFlowStore.getState().onConnect({ source: "a", target: "b" });

    const edges = useFlowStore.getState().edges;
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe("a");
    expect(edges[0].target).toBe("b");
  });
});

describe("useFlowStore dirty tracking", () => {
  it("marks the current draft dirty after edits", () => {
    useFlowStore.getState().setContractName("Dirty");

    expect(useFlowStore.getState().hasUnsavedChanges).toBe(true);
  });

  it("resets dirty state after saving a named contract", () => {
    useFlowStore.getState().setContractName("Saved");
    useFlowStore.getState().saveContract("Saved");

    expect(useFlowStore.getState().hasUnsavedChanges).toBe(false);
    expect(useFlowStore.getState().activeSavedContractId).toBeTruthy();
    expect(useFlowStore.getState().lastNamedSaveAt).toBeTypeOf("number");
  });
});
