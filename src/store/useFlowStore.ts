import { create } from "zustand";
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";

import { getDefaultTemplate, getTemplate } from "@/engine/templateRegistry";

export interface StorageField {
  id: string;
  name: string;
  type: string;
}

export interface ConstructorArg {
  id: string;
  name: string;
  type: string;
}

export interface NodeData {
  contractName: string;
  url: string;
  prompt: string;
  numValidators: number;
  storageName: string;
  storageFields: StorageField[];
  constructorArgs: ConstructorArg[];
}

export interface SavedContract {
  id: string;
  name: string;
  templateId: string;
  nodeData: NodeData;
  customCode: string;
  nodes: Node[];
  edges: Edge[];
  savedAt: number;
}

interface FlowState {
  // Template
  activeTemplateId: string;

  // React Flow
  nodes: Node[];
  edges: Edge[];
  nodeData: NodeData;

  // Editor mode
  editorMode: "visual" | "code";
  customCode: string;

  // Saved contracts
  savedContracts: SavedContract[];

  // React Flow event handlers
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  // Data update actions
  setContractName: (value: string) => void;
  setUrl: (value: string) => void;
  setPrompt: (value: string) => void;
  setNumValidators: (value: number) => void;
  setStorageName: (value: string) => void;

  // Dynamic storage fields
  addStorageField: () => void;
  updateStorageField: (id: string, updates: Partial<Omit<StorageField, "id">>) => void;
  removeStorageField: (id: string) => void;

  // Constructor args
  addConstructorArg: () => void;
  updateConstructorArg: (id: string, updates: Partial<Omit<ConstructorArg, "id">>) => void;
  removeConstructorArg: (id: string) => void;

  // Template actions
  switchTemplate: (templateId: string) => void;

  // Editor mode actions
  setEditorMode: (mode: "visual" | "code") => void;
  setCustomCode: (code: string) => void;

  // Contract management
  saveContract: (name: string) => void;
  loadContract: (id: string) => void;
  deleteContract: (id: string) => void;

  // Node management (drag from sidebar)
  addNode: (type: string, position: { x: number; y: number }) => void;
}

const defaultTemplate = getDefaultTemplate();

const ALLOWED_GENVM_TYPES = new Set([
  "str",
  "bool",
  "u256",
  "u128",
  "u64",
  "u32",
  "i256",
  "bigint",
  "Address",
  "DynArray[str]",
  "DynArray[u256]",
  "DynArray[Address]",
  "TreeMap[str, str]",
  "TreeMap[Address, str]",
  "TreeMap[Address, u256]",
]);

/** Sanitize a single StorageField — repairs or rejects each item individually */
function sanitizeStorageField(x: unknown): StorageField | null {
  if (!x || typeof x !== "object") return null;
  const f = x as Record<string, unknown>;
  if (typeof f.id !== "string" || f.id.length === 0) return null;
  if (typeof f.name !== "string") return null;
  return {
    id: f.id,
    name: f.name,
    // Recover unknown or invalid types to default 'str' rather than dropping the field
    type: typeof f.type === "string" && ALLOWED_GENVM_TYPES.has(f.type) ? f.type : "str",
  };
}

/** Sanitize a single ConstructorArg — repairs or rejects each item individually */
function sanitizeConstructorArg(x: unknown): ConstructorArg | null {
  if (!x || typeof x !== "object") return null;
  const a = x as Record<string, unknown>;
  if (typeof a.id !== "string" || a.id.length === 0) return null;
  if (typeof a.name !== "string") return null;
  return {
    id: a.id,
    name: a.name,
    type: typeof a.type === "string" && ALLOWED_GENVM_TYPES.has(a.type) ? a.type : "str",
  };
}

/** Migrate old NodeData shapes to current schema — safe to run on any version */
export function migrateNodeData(raw: Partial<NodeData>): NodeData {
  const rawFields = Array.isArray(raw.storageFields) ? raw.storageFields : [];
  const rawArgs   = Array.isArray(raw.constructorArgs) ? raw.constructorArgs : [];
  return {
    contractName: typeof raw.contractName === "string" ? raw.contractName : "",
    url:          typeof raw.url          === "string" ? raw.url          : "",
    prompt:       typeof raw.prompt       === "string" ? raw.prompt       : "",
    numValidators: typeof raw.numValidators === "number" ? raw.numValidators : 3,
    storageName:  typeof raw.storageName  === "string" ? raw.storageName  : "",
    storageFields:   rawFields.map(sanitizeStorageField).filter((f): f is StorageField => f !== null),
    constructorArgs: rawArgs.map(sanitizeConstructorArg).filter((a): a is ConstructorArg => a !== null),
  };
}

function sanitizeNode(x: unknown): Node | null {
  if (!x || typeof x !== "object") return null;
  const n = x as Record<string, unknown>;
  if (typeof n.id !== "string" || n.id.length === 0) return null;
  if (typeof n.type !== "string" || n.type.length === 0) return null;

  const positionRaw = (typeof n.position === "object" && n.position !== null)
    ? (n.position as Record<string, unknown>)
    : null;

  const position = {
    x: typeof positionRaw?.x === "number" ? positionRaw.x : 0,
    y: typeof positionRaw?.y === "number" ? positionRaw.y : 0,
  };

  const data = (typeof n.data === "object" && n.data !== null) ? n.data : {};
  return {
    ...(n as unknown as Node),
    id: n.id,
    type: n.type,
    position,
    data: data as Node["data"],
  };
}

function sanitizeEdge(x: unknown): Edge | null {
  if (!x || typeof x !== "object") return null;
  const e = x as Record<string, unknown>;
  if (typeof e.id !== "string" || e.id.length === 0) return null;
  if (typeof e.source !== "string" || e.source.length === 0) return null;
  if (typeof e.target !== "string" || e.target.length === 0) return null;
  return {
    ...(e as unknown as Edge),
    id: e.id,
    source: e.source,
    target: e.target,
  };
}

export function sanitizeSavedNodes(input: unknown): Node[] {
  if (!Array.isArray(input)) return [];
  return input.map(sanitizeNode).filter((n): n is Node => n !== null);
}

export function sanitizeSavedEdges(input: unknown, nodeIds: Set<string>): Edge[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(sanitizeEdge)
    .filter((e): e is Edge => e !== null)
    .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
}

export function sanitizeSavedCustomCode(input: unknown): string {
  return typeof input === "string" ? input : "";
}

/** Runtime schema guard — rejects corrupted or tampered SavedContract entries */
function isValidSavedContract(obj: unknown): obj is SavedContract {
  if (typeof obj !== "object" || obj === null) return false;
  const c = obj as Record<string, unknown>;
  return (
    typeof c.id === "string" && c.id.length > 0 &&
    typeof c.name === "string" &&
    typeof c.templateId === "string" &&
    (c.nodeData === undefined || typeof c.nodeData === "object") &&
    (c.customCode === undefined || typeof c.customCode === "string") &&
    (c.nodes === undefined || Array.isArray(c.nodes)) &&
    (c.edges === undefined || Array.isArray(c.edges))
  );
}

function loadSavedContracts(): SavedContract[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("genflow-contracts");
    if (!stored) return [];
    const parsed: unknown[] = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    // Filter malformed entries, then migrate nodeData to current schema
    return parsed
      .filter(isValidSavedContract)
      .map((c) => ({ ...c, nodeData: migrateNodeData(c.nodeData) }));
  } catch {
    return [];
  }
}

function persistContracts(contracts: SavedContract[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("genflow-contracts", JSON.stringify(contracts));
}

/** Derives next safe counter value from a node list */
function maxNodeId(nodes: Node[]): number {
  let max = 100;
  for (const n of nodes) {
    const num = parseInt(n.id.replace(/^node-/, ""), 10);
    if (!isNaN(num) && num >= max) max = num + 1;
  }
  return max;
}

function deepClone<T>(value: T): T {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function makeId(prefix: string): string {
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function") {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

let nodeIdCounter = maxNodeId(defaultTemplate.defaultNodes);

export const useFlowStore = create<FlowState>((set, get) => ({
  activeTemplateId: defaultTemplate.id,
  nodes: deepClone(defaultTemplate.defaultNodes),
  edges: deepClone(defaultTemplate.defaultEdges),
  nodeData: {
    contractName: "",
    url: "",
    prompt: "",
    numValidators: 3,
    storageName: "",
    storageFields: [],
    constructorArgs: [],
  },

  editorMode: "visual",
  customCode: "",
  savedContracts: loadSavedContracts(),

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    set({ edges: addEdge({ ...connection, animated: true }, get().edges) });
  },

  setContractName: (value) =>
    set((state) => ({ nodeData: { ...state.nodeData, contractName: value } })),

  setUrl: (value) =>
    set((state) => ({ nodeData: { ...state.nodeData, url: value } })),

  setPrompt: (value) =>
    set((state) => ({ nodeData: { ...state.nodeData, prompt: value } })),

  setNumValidators: (value) =>
    set((state) => ({ nodeData: { ...state.nodeData, numValidators: value } })),

  setStorageName: (value) =>
    set((state) => ({ nodeData: { ...state.nodeData, storageName: value } })),

  addStorageField: () =>
    set((state) => ({
      nodeData: {
        ...state.nodeData,
        storageFields: [
          ...state.nodeData.storageFields,
          { id: makeId("sf"), name: "", type: "str" },
        ],
      },
    })),

  updateStorageField: (id, updates) =>
    set((state) => ({
      nodeData: {
        ...state.nodeData,
        storageFields: state.nodeData.storageFields.map((f) =>
          f.id === id ? { ...f, ...updates } : f
        ),
      },
    })),

  removeStorageField: (id) =>
    set((state) => ({
      nodeData: {
        ...state.nodeData,
        storageFields: state.nodeData.storageFields.filter((f) => f.id !== id),
      },
    })),

  addConstructorArg: () =>
    set((state) => ({
      nodeData: {
        ...state.nodeData,
        constructorArgs: [
          ...state.nodeData.constructorArgs,
          { id: makeId("ca"), name: "", type: "str" },
        ],
      },
    })),

  updateConstructorArg: (id, updates) =>
    set((state) => ({
      nodeData: {
        ...state.nodeData,
        constructorArgs: state.nodeData.constructorArgs.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      },
    })),

  removeConstructorArg: (id) =>
    set((state) => ({
      nodeData: {
        ...state.nodeData,
        constructorArgs: state.nodeData.constructorArgs.filter((a) => a.id !== id),
      },
    })),

  switchTemplate: (templateId) => {
    const template = getTemplate(templateId);
    if (!template) return;

    set({
      activeTemplateId: templateId,
      nodes: deepClone(template.defaultNodes),
      edges: deepClone(template.defaultEdges),
      customCode: "",
      nodeData: {
        contractName: "",
        url: "",
        prompt: "",
        numValidators: 3,
        storageName: "",
        storageFields: [],
        constructorArgs: [],
      },
    });
  },

  setEditorMode: (mode) => set({ editorMode: mode }),

  setCustomCode: (code) => set({ customCode: code }),

  saveContract: (name) => {
    const state = get();
    const contract: SavedContract = {
      id: makeId("contract"),
      name,
      templateId: state.activeTemplateId,
      nodeData: deepClone(state.nodeData),
      customCode: state.customCode,
      nodes: deepClone(state.nodes),
      edges: deepClone(state.edges),
      savedAt: Date.now(),
    };
    const updated = [...state.savedContracts, contract];
    persistContracts(updated);
    set({ savedContracts: updated });
  },

  loadContract: (id) => {
    const state = get();
    const contract = state.savedContracts.find((c) => c.id === id);
    if (!contract) return;

    const template = getTemplate(contract.templateId);
    if (!template) return;

    const parsedNodes = sanitizeSavedNodes(contract.nodes);
    const useTemplateNodes = parsedNodes.length === 0;
    const safeNodes = useTemplateNodes
      ? deepClone(template.defaultNodes)
      : deepClone(parsedNodes);
    const nodeIds = new Set(safeNodes.map((n) => n.id));

    const parsedEdges = sanitizeSavedEdges(contract.edges, nodeIds);
    const safeEdges = useTemplateNodes && parsedEdges.length === 0
      ? deepClone(template.defaultEdges)
      : deepClone(parsedEdges);

    const safeCode = sanitizeSavedCustomCode(contract.customCode);

    set({
      activeTemplateId: contract.templateId,
      nodes: safeNodes,
      edges: safeEdges,
      nodeData: migrateNodeData(contract.nodeData),
      customCode: safeCode,
    });
    // Sync counter so newly dragged nodes don't collide with loaded node IDs
    nodeIdCounter = maxNodeId(safeNodes);
  },

  deleteContract: (id) => {
    const updated = get().savedContracts.filter((c) => c.id !== id);
    persistContracts(updated);
    set({ savedContracts: updated });
  },

  addNode: (type, position) => {
    const newNode: Node = {
      id: `node-${nodeIdCounter++}`,
      type,
      position,
      data: {},
    };
    set((state) => ({ nodes: [...state.nodes, newNode] }));
  },
}));
