import { beforeEach, describe, expect, it } from "vitest";
import { createBuilderSnapshot } from "@/lib/contractPersistence";
import { generateIntentDraft } from "@/lib/intentDraft";
import { createProjectDocument } from "@/lib/projectDocument";
import {
  getBuilderSnapshotFingerprint,
  getPreviewReviewFingerprint,
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
    builderSurface: "guided",
    guidedEntryStep: "idea",
    customCode: "",
    savedContracts: [],
    activeSavedContractId: null,
    hasUnsavedChanges: false,
    hasReviewedPreviewForCurrentDraft: false,
    previewReviewFingerprint: null,
    lastDraftSavedAt: null,
    lastNamedSaveAt: null,
    restoredDraftAt: null,
    baselineFingerprint,
    chatMessages: [],
    draftSummary: null,
    draftAssumptions: [],
    lastIntentConfidence: null,
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

describe("useFlowStore preview review gate", () => {
  it("marks the current draft as reviewed after opening preview", () => {
    useFlowStore.getState().markPreviewReviewed();

    expect(useFlowStore.getState().hasReviewedPreviewForCurrentDraft).toBe(true);
    expect(useFlowStore.getState().previewReviewFingerprint).toBeTypeOf("string");
  });

  it("resets preview review after a meaningful draft edit", () => {
    useFlowStore.getState().markPreviewReviewed();
    useFlowStore.getState().setContractName("Changed");

    expect(useFlowStore.getState().hasReviewedPreviewForCurrentDraft).toBe(false);
    expect(useFlowStore.getState().previewReviewFingerprint).toBeNull();
  });

  it("resets preview review after manual code edits", () => {
    useFlowStore.getState().markPreviewReviewed();
    useFlowStore.getState().setCustomCode("print('custom override')");

    expect(useFlowStore.getState().hasReviewedPreviewForCurrentDraft).toBe(false);
    expect(useFlowStore.getState().previewReviewFingerprint).toBeNull();
  });
});

describe("useFlowStore intent drafting", () => {
  it("accepts an intent draft and moves the guided flow into review mode", () => {
    const result = generateIntentDraft({
      brief:
        "Build a contract that fetches prices from https://example.com/feed and stores the latest result.",
    });

    useFlowStore.getState().applyIntentDraft(result, "price feed contract");

    const state = useFlowStore.getState();
    expect(state.guidedEntryStep).toBe("review");
    expect(state.chatMessages).toHaveLength(2);
    expect(state.draftSummary).toBeTruthy();
    expect(state.lastIntentConfidence).toBe(result.templateRecommendation.confidence);
  });

  it("treats an accepted intent draft as unsaved work", () => {
    const result = generateIntentDraft({
      brief:
        "Build a contract that fetches prices from https://example.com/feed and stores the latest result.",
    });

    useFlowStore.getState().applyIntentDraft(result, "price feed contract");

    const state = useFlowStore.getState();
    expect(state.hasUnsavedChanges).toBe(true);
    expect(state.activeSavedContractId).toBeNull();
  });

  it("preserves manual code overrides when applying an intent refinement", () => {
    const manualOverride = "print('manual override')";
    const currentSnapshot = createBuilderSnapshot({
      activeTemplateId: "simple-storage",
      nodes: [],
      edges: [],
      nodeData: {
        ...EMPTY_NODE_DATA,
        contractName: "StorageDraft",
      },
      customCode: manualOverride,
      editorMode: "visual",
    });
    const result = generateIntentDraft({
      brief: "Use a URL source instead and turn this into a price feed contract.",
      currentSnapshot,
      mode: "refine",
    });

    useFlowStore.setState({
      customCode: manualOverride,
      nodeData: currentSnapshot.nodeData,
    });
    useFlowStore.getState().applyIntentDraft(result, "Use a URL source instead.");

    expect(useFlowStore.getState().customCode).toBe(manualOverride);
  });
});

describe("useFlowStore project documents", () => {
  it("restores guided draft state from project JSON imports", () => {
    const snapshot = createBuilderSnapshot({
      activeTemplateId: "simple-storage",
      nodes: [],
      edges: [],
      nodeData: {
        ...EMPTY_NODE_DATA,
        contractName: "Imported Guided Draft",
      },
      customCode: "print('kept override')",
      editorMode: "visual",
    });
    const previewReviewFingerprint = getPreviewReviewFingerprint(snapshot);
    const document = createProjectDocument({
      name: "Imported Guided Draft",
      snapshot,
      session: {
        builderSurface: "guided",
        guidedEntryStep: "review",
        previewReviewFingerprint,
        chatMessages: [
          { id: "user-1", role: "user", content: "Build a guided draft" },
          { id: "assistant-1", role: "assistant", content: "Guided draft prepared." },
        ],
        draftSummary: "Imported guided summary",
        draftAssumptions: ["Assumption A"],
        lastIntentConfidence: "high",
      },
    });

    useFlowStore.getState().importProjectDocument(document);

    const state = useFlowStore.getState();
    expect(state.builderSurface).toBe("guided");
    expect(state.guidedEntryStep).toBe("review");
    expect(state.hasReviewedPreviewForCurrentDraft).toBe(true);
    expect(state.previewReviewFingerprint).toBe(previewReviewFingerprint);
    expect(state.chatMessages).toHaveLength(2);
    expect(state.draftSummary).toBe("Imported guided summary");
    expect(state.draftAssumptions).toEqual(["Assumption A"]);
    expect(state.lastIntentConfidence).toBe("high");
  });
});
