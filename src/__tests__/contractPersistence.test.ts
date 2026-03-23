import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CURRENT_SAVED_CONTRACT_SCHEMA_VERSION,
  CURRENT_WORKING_SESSION_SCHEMA_VERSION,
  SAVED_CONTRACTS_STORAGE_KEY,
  WORKING_SESSION_STORAGE_KEY,
  hasMeaningfulWorkingSession,
  loadSavedContracts,
  loadWorkingSession,
} from "@/lib/contractPersistence";

function createMockStorage(): Storage {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => (store.has(key) ? store.get(key)! : null)),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    get length() {
      return store.size;
    },
  } as Storage;
}

beforeEach(() => {
  vi.stubGlobal("localStorage", createMockStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("contract persistence", () => {
  it("migrates legacy saved contracts to the current schema version", () => {
    localStorage.setItem(
      SAVED_CONTRACTS_STORAGE_KEY,
      JSON.stringify([
        {
          id: "legacy-contract",
          name: "Legacy",
          templateId: "simple-storage",
          nodeData: {
            contractName: "Legacy",
            storageFields: [{ id: "sf-1", name: "count", type: "UnknownType" }],
          },
          nodes: [{ id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} }],
          edges: [],
          customCode: 42,
          savedAt: 100,
        },
      ])
    );

    const contracts = loadSavedContracts();

    expect(contracts).toHaveLength(1);
    expect(contracts[0].schemaVersion).toBe(CURRENT_SAVED_CONTRACT_SCHEMA_VERSION);
    expect(contracts[0].customCode).toBe("");
    expect(contracts[0].nodeData.storageFields[0].type).toBe("str");
  });

  it("drops malformed saved contracts while keeping valid ones", () => {
    localStorage.setItem(
      SAVED_CONTRACTS_STORAGE_KEY,
      JSON.stringify([
        { id: "ok", name: "Valid", templateId: "simple-storage", nodeData: {}, nodes: [], edges: [] },
        { id: "", name: "Broken", templateId: "simple-storage" },
        "nope",
      ])
    );

    const contracts = loadSavedContracts();

    expect(contracts.map((contract) => contract.id)).toEqual(["ok"]);
  });

  it("loads and normalizes working sessions with baseline metadata", () => {
    localStorage.setItem(
      WORKING_SESSION_STORAGE_KEY,
      JSON.stringify({
        activeTemplateId: "custom-compose",
        nodeData: {
          contractName: "Recovered",
          prompt: "Score the request",
        },
        nodes: [
          { id: "node-101", type: "initNode", position: { x: 0, y: 0 }, data: {} },
          { id: "node-102", type: "llmPromptNode", position: { x: 120, y: 0 }, data: {} },
        ],
        edges: [{ id: "e1", source: "node-101", target: "node-102" }],
        customCode: "print('draft')",
        editorMode: "code",
        activeSavedContractId: "contract-1",
        lastNamedSaveAt: 222,
        updatedAt: 333,
      })
    );

    const session = loadWorkingSession();

    expect(session).not.toBeNull();
    expect(session?.schemaVersion).toBe(CURRENT_WORKING_SESSION_SCHEMA_VERSION);
    expect(session?.editorMode).toBe("code");
    expect(session?.activeSavedContractId).toBe("contract-1");
    expect(session?.lastNamedSaveAt).toBe(222);
    expect(session?.baselineFingerprint.length).toBeGreaterThan(0);
    expect(hasMeaningfulWorkingSession(session!)).toBe(true);
  });
});
