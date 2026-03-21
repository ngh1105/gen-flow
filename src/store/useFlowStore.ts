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

export interface NodeData {
  contractName: string;
  url: string;
  prompt: string;
  numValidators: number;
  storageName: string;
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

function loadSavedContracts(): SavedContract[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("genflow-contracts");
    return stored ? JSON.parse(stored) : [];
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

let nodeIdCounter = maxNodeId(defaultTemplate.defaultNodes);

export const useFlowStore = create<FlowState>((set, get) => ({
  activeTemplateId: defaultTemplate.id,
  nodes: defaultTemplate.defaultNodes,
  edges: defaultTemplate.defaultEdges,
  nodeData: {
    contractName: "",
    url: "",
    prompt: "",
    numValidators: 3,
    storageName: "",
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

  switchTemplate: (templateId) => {
    const template = getTemplate(templateId);
    if (!template) return;

    set({
      activeTemplateId: templateId,
      nodes: template.defaultNodes,
      edges: template.defaultEdges,
      customCode: "",
      nodeData: {
        contractName: "",
        url: "",
        prompt: "",
        numValidators: 3,
        storageName: "",
      },
    });
  },

  setEditorMode: (mode) => set({ editorMode: mode }),

  setCustomCode: (code) => set({ customCode: code }),

  saveContract: (name) => {
    const state = get();
    const contract: SavedContract = {
      id: `contract-${Date.now()}`,
      name,
      templateId: state.activeTemplateId,
      nodeData: { ...state.nodeData },
      customCode: state.customCode,
      nodes: state.nodes,
      edges: state.edges,
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

    set({
      activeTemplateId: contract.templateId,
      nodes: contract.nodes || template.defaultNodes,
      edges: contract.edges || template.defaultEdges,
      nodeData: { ...contract.nodeData },
      customCode: contract.customCode,
    });
    // Sync counter so newly dragged nodes don't collide with loaded node IDs
    nodeIdCounter = maxNodeId(contract.nodes || template.defaultNodes);
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
