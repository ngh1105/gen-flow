import { beforeEach, describe, expect, it } from "vitest";

import {
  WORKING_SESSION_STORAGE_KEY,
  getPreviewReviewFingerprint,
  loadWorkingSession,
} from "@/lib/contractPersistence";

function createStorageMock(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", {
    value: createStorageMock(),
    configurable: true,
    writable: true,
  });
});

describe("working session persistence", () => {
  it("migrates legacy template drafts back into review mode", () => {
    globalThis.localStorage.setItem(
      WORKING_SESSION_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        updatedAt: 123,
        activeTemplateId: "simple-storage",
        nodeData: {
          contractName: "Recovered Draft",
        },
        customCode: "",
        nodes: [{ id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} }],
        edges: [],
        editorMode: "visual",
        baselineFingerprint: "baseline",
        activeSavedContractId: null,
        lastNamedSaveAt: null,
      })
    );

    const session = loadWorkingSession();

    expect(session).not.toBeNull();
    expect(session?.guidedEntryStep).toBe("review");
    expect(session?.builderSurface).toBe("guided");
  });

  it("restores builder surface and preview review fingerprint", () => {
    const previewReviewFingerprint = getPreviewReviewFingerprint({
      activeTemplateId: "simple-storage",
      nodeData: {
        contractName: "Preview Gate",
        url: "",
        prompt: "",
        numValidators: 3,
        storageName: "",
        storageFields: [],
        constructorArgs: [],
      },
      customCode: "",
      nodes: [{ id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} }],
      edges: [],
    });

    globalThis.localStorage.setItem(
      WORKING_SESSION_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        updatedAt: 123,
        activeTemplateId: "simple-storage",
        nodeData: {
          contractName: "Preview Gate",
        },
        customCode: "",
        nodes: [{ id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} }],
        edges: [],
        editorMode: "visual",
        baselineFingerprint: "baseline",
        activeSavedContractId: null,
        lastNamedSaveAt: null,
        builderSurface: "advanced",
        guidedEntryStep: "review",
        previewReviewFingerprint,
        chatMessages: [],
        draftSummary: "summary",
        draftAssumptions: [],
        lastIntentConfidence: "high",
      })
    );

    const session = loadWorkingSession();

    expect(session).not.toBeNull();
    expect(session?.builderSurface).toBe("advanced");
    expect(session?.previewReviewFingerprint).toBe(previewReviewFingerprint);
  });
});
