"use client";

import { create } from "zustand";
import {
  type Edge,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from "@xyflow/react";

import {
  CURRENT_SAVED_CONTRACT_SCHEMA_VERSION,
  createBuilderSnapshot,
  createBuilderSnapshotFromTemplate,
  getBuilderSnapshotFingerprint,
  hasMeaningfulWorkingSession,
  loadSavedContracts,
  loadWorkingSession,
  persistSavedContracts,
  sanitizeSavedCustomCode,
  sanitizeSavedEdges,
  sanitizeSavedNodes,
} from "@/lib/contractPersistence";
import {
  buildImportedSnapshot,
  type ProjectDocument,
} from "@/lib/projectDocument";
import { getDefaultTemplate, getTemplate } from "@/engine/templateRegistry";
import { addBuilderBreadcrumb } from "@/lib/telemetry";

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

export type EditorMode = "visual" | "code";

export interface BuilderSnapshot {
  activeTemplateId: string;
  nodes: Node[];
  edges: Edge[];
  nodeData: NodeData;
  customCode: string;
  editorMode: EditorMode;
}

export interface SavedContract {
  id: string;
  schemaVersion: number;
  name: string;
  templateId: string;
  nodeData: NodeData;
  customCode: string;
  nodes: Node[];
  edges: Edge[];
  savedAt: number;
}

export interface WorkingSession extends BuilderSnapshot {
  schemaVersion: number;
  updatedAt: number;
  baselineFingerprint: string;
  activeSavedContractId: string | null;
  lastNamedSaveAt: number | null;
}

interface FlowState extends BuilderSnapshot {
  savedContracts: SavedContract[];
  activeSavedContractId: string | null;
  hasUnsavedChanges: boolean;
  lastDraftSavedAt: number | null;
  lastNamedSaveAt: number | null;
  restoredDraftAt: number | null;
  baselineFingerprint: string;

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  setContractName: (value: string) => void;
  setUrl: (value: string) => void;
  setPrompt: (value: string) => void;
  setNumValidators: (value: number) => void;
  setStorageName: (value: string) => void;

  addStorageField: () => void;
  updateStorageField: (id: string, updates: Partial<Omit<StorageField, "id">>) => void;
  removeStorageField: (id: string) => void;

  addConstructorArg: () => void;
  updateConstructorArg: (id: string, updates: Partial<Omit<ConstructorArg, "id">>) => void;
  removeConstructorArg: (id: string) => void;

  switchTemplate: (templateId: string) => void;
  setEditorMode: (mode: EditorMode) => void;
  setCustomCode: (code: string) => void;

  saveContract: (name: string) => void;
  loadContract: (id: string) => void;
  deleteContract: (id: string) => void;
  importProjectDocument: (document: ProjectDocument) => void;

  addNode: (type: string, position: { x: number; y: number }) => void;

  syncDraftPersistence: (savedAt: number, hasUnsavedChanges: boolean) => void;
  dismissDraftRecoveryNotice: () => void;
}

const defaultTemplate = getDefaultTemplate();
const CUSTOM_COMPOSE_TEMPLATE_ID = "custom-compose";

const restoredSession = loadWorkingSession();
const initialSnapshot = restoredSession
  ? createBuilderSnapshot(restoredSession)
  : createBuilderSnapshotFromTemplate(defaultTemplate.id);
const initialSavedContracts = loadSavedContracts();
const initialBaselineFingerprint =
  restoredSession?.baselineFingerprint ??
  getBuilderSnapshotFingerprint(initialSnapshot);
const initialHasUnsavedChanges =
  getBuilderSnapshotFingerprint(initialSnapshot) !== initialBaselineFingerprint;

function deepClone<T>(value: T): T {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function makeId(prefix: string): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function maxNodeId(nodes: Node[]): number {
  let max = 100;

  for (const node of nodes) {
    const value = Number.parseInt(node.id.replace(/^node-/, ""), 10);
    if (!Number.isNaN(value) && value >= max) max = value + 1;
  }

  return max;
}

let nodeIdCounter = maxNodeId(initialSnapshot.nodes);

export const useFlowStore = create<FlowState>((set, get) => {
  const syncDirtyState = () => {
    const state = get();
    const fingerprint = getBuilderSnapshotFingerprint({
      activeTemplateId: state.activeTemplateId,
      nodes: state.nodes,
      edges: state.edges,
      nodeData: state.nodeData,
      customCode: state.customCode,
      editorMode: state.editorMode,
    });
    const hasUnsavedChanges = fingerprint !== state.baselineFingerprint;

    if (hasUnsavedChanges !== state.hasUnsavedChanges) {
      set({ hasUnsavedChanges });
    }
  };

  const applyWorkingMutation = (
    recipe: (state: FlowState) => Partial<FlowState>
  ) => {
    set((state) => recipe(state));
    syncDirtyState();
  };

  return {
    activeTemplateId: initialSnapshot.activeTemplateId,
    nodes: deepClone(initialSnapshot.nodes),
    edges: deepClone(initialSnapshot.edges),
    nodeData: deepClone(initialSnapshot.nodeData),
    customCode: initialSnapshot.customCode,
    editorMode: initialSnapshot.editorMode,

    savedContracts: initialSavedContracts,
    activeSavedContractId: restoredSession?.activeSavedContractId ?? null,
    hasUnsavedChanges: initialHasUnsavedChanges,
    lastDraftSavedAt: restoredSession?.updatedAt ?? null,
    lastNamedSaveAt: restoredSession?.lastNamedSaveAt ?? null,
    restoredDraftAt:
      restoredSession && hasMeaningfulWorkingSession(restoredSession)
        ? restoredSession.updatedAt
        : null,
    baselineFingerprint: initialBaselineFingerprint,

    onNodesChange: (changes) => {
      applyWorkingMutation((state) => ({
        nodes: applyNodeChanges(changes, state.nodes),
      }));
    },

    onEdgesChange: (changes) => {
      applyWorkingMutation((state) => ({
        edges: applyEdgeChanges(changes, state.edges),
      }));
    },

    onConnect: (connection) => {
      if (get().activeTemplateId !== CUSTOM_COMPOSE_TEMPLATE_ID) return;

      applyWorkingMutation((state) => ({
        edges: addEdge({ ...connection, animated: true }, state.edges),
      }));
    },

    setContractName: (value) => {
      applyWorkingMutation((state) => ({
        nodeData: { ...state.nodeData, contractName: value },
      }));
    },

    setUrl: (value) => {
      applyWorkingMutation((state) => ({
        nodeData: { ...state.nodeData, url: value },
      }));
    },

    setPrompt: (value) => {
      applyWorkingMutation((state) => ({
        nodeData: { ...state.nodeData, prompt: value },
      }));
    },

    setNumValidators: (value) => {
      applyWorkingMutation((state) => ({
        nodeData: { ...state.nodeData, numValidators: value },
      }));
    },

    setStorageName: (value) => {
      applyWorkingMutation((state) => ({
        nodeData: { ...state.nodeData, storageName: value },
      }));
    },

    addStorageField: () => {
      applyWorkingMutation((state) => ({
        nodeData: {
          ...state.nodeData,
          storageFields: [
            ...state.nodeData.storageFields,
            { id: makeId("sf"), name: "", type: "str" },
          ],
        },
      }));
    },

    updateStorageField: (id, updates) => {
      applyWorkingMutation((state) => ({
        nodeData: {
          ...state.nodeData,
          storageFields: state.nodeData.storageFields.map((field) =>
            field.id === id ? { ...field, ...updates } : field
          ),
        },
      }));
    },

    removeStorageField: (id) => {
      applyWorkingMutation((state) => ({
        nodeData: {
          ...state.nodeData,
          storageFields: state.nodeData.storageFields.filter(
            (field) => field.id !== id
          ),
        },
      }));
    },

    addConstructorArg: () => {
      applyWorkingMutation((state) => ({
        nodeData: {
          ...state.nodeData,
          constructorArgs: [
            ...state.nodeData.constructorArgs,
            { id: makeId("ca"), name: "", type: "str" },
          ],
        },
      }));
    },

    updateConstructorArg: (id, updates) => {
      applyWorkingMutation((state) => ({
        nodeData: {
          ...state.nodeData,
          constructorArgs: state.nodeData.constructorArgs.map((arg) =>
            arg.id === id ? { ...arg, ...updates } : arg
          ),
        },
      }));
    },

    removeConstructorArg: (id) => {
      applyWorkingMutation((state) => ({
        nodeData: {
          ...state.nodeData,
          constructorArgs: state.nodeData.constructorArgs.filter(
            (arg) => arg.id !== id
          ),
        },
      }));
    },

    switchTemplate: (templateId) => {
      const template = getTemplate(templateId);
      if (!template) return;

      const snapshot = createBuilderSnapshotFromTemplate(
        templateId,
        get().editorMode
      );
      const baselineFingerprint = getBuilderSnapshotFingerprint(snapshot);

      set({
        activeTemplateId: snapshot.activeTemplateId,
        nodes: deepClone(snapshot.nodes),
        edges: deepClone(snapshot.edges),
        nodeData: deepClone(snapshot.nodeData),
        customCode: snapshot.customCode,
        activeSavedContractId: null,
        hasUnsavedChanges: false,
        lastNamedSaveAt: null,
        restoredDraftAt: null,
        baselineFingerprint,
      });

      nodeIdCounter = maxNodeId(snapshot.nodes);
      addBuilderBreadcrumb("template_switched", {
        templateId,
        editorMode: get().editorMode,
      });
    },

    setEditorMode: (mode) => {
      applyWorkingMutation(() => ({ editorMode: mode }));
    },

    setCustomCode: (code) => {
      applyWorkingMutation(() => ({ customCode: code }));
    },

    saveContract: (name) => {
      const state = get();
      const savedAt = Date.now();
      const contract: SavedContract = {
        id: makeId("contract"),
        schemaVersion: CURRENT_SAVED_CONTRACT_SCHEMA_VERSION,
        name,
        templateId: state.activeTemplateId,
        nodeData: deepClone(state.nodeData),
        customCode: state.customCode,
        nodes: deepClone(state.nodes),
        edges: deepClone(state.edges),
        savedAt,
      };
      const updatedContracts = [...state.savedContracts, contract];
      const baselineFingerprint = getBuilderSnapshotFingerprint({
        activeTemplateId: state.activeTemplateId,
        nodes: state.nodes,
        edges: state.edges,
        nodeData: state.nodeData,
        customCode: state.customCode,
        editorMode: state.editorMode,
      });

      persistSavedContracts(updatedContracts);
      set({
        savedContracts: updatedContracts,
        activeSavedContractId: contract.id,
        hasUnsavedChanges: false,
        lastNamedSaveAt: savedAt,
        baselineFingerprint,
        restoredDraftAt: null,
      });
    },

    loadContract: (id) => {
      const state = get();
      const contract = state.savedContracts.find((item) => item.id === id);
      if (!contract) return;

      const template = getTemplate(contract.templateId);
      if (!template) return;

      const parsedNodes = sanitizeSavedNodes(contract.nodes);
      const useTemplateNodes = parsedNodes.length === 0;
      const safeNodes = useTemplateNodes
        ? deepClone(template.defaultNodes)
        : deepClone(parsedNodes);
      const nodeIds = new Set(safeNodes.map((node) => node.id));
      const parsedEdges = sanitizeSavedEdges(contract.edges, nodeIds);
      const safeEdges =
        useTemplateNodes && parsedEdges.length === 0
          ? deepClone(template.defaultEdges)
          : deepClone(parsedEdges);

      const snapshot = createBuilderSnapshot({
        activeTemplateId: contract.templateId,
        nodeData: contract.nodeData,
        customCode: sanitizeSavedCustomCode(contract.customCode),
        nodes: safeNodes,
        edges: safeEdges,
        editorMode: state.editorMode,
      });
      const baselineFingerprint = getBuilderSnapshotFingerprint(snapshot);

      set({
        activeTemplateId: snapshot.activeTemplateId,
        nodes: snapshot.nodes,
        edges: snapshot.edges,
        nodeData: snapshot.nodeData,
        customCode: snapshot.customCode,
        editorMode: state.editorMode,
        activeSavedContractId: contract.id,
        hasUnsavedChanges: false,
        lastNamedSaveAt: contract.savedAt,
        restoredDraftAt: null,
        baselineFingerprint,
      });

      nodeIdCounter = maxNodeId(snapshot.nodes);
    },

    deleteContract: (id) => {
      const state = get();
      const updatedContracts = state.savedContracts.filter(
        (contract) => contract.id !== id
      );
      const isActive = state.activeSavedContractId === id;

      persistSavedContracts(updatedContracts);
      set({
        savedContracts: updatedContracts,
        activeSavedContractId: isActive ? null : state.activeSavedContractId,
        lastNamedSaveAt: isActive ? null : state.lastNamedSaveAt,
      });
    },

    importProjectDocument: (document) => {
      const snapshot = buildImportedSnapshot(document, get().editorMode);
      const baselineFingerprint = getBuilderSnapshotFingerprint(snapshot);

      set({
        activeTemplateId: snapshot.activeTemplateId,
        nodes: deepClone(snapshot.nodes),
        edges: deepClone(snapshot.edges),
        nodeData: deepClone(snapshot.nodeData),
        customCode: snapshot.customCode,
        editorMode: snapshot.editorMode,
        activeSavedContractId: null,
        hasUnsavedChanges: false,
        lastNamedSaveAt: document.metadata.lastNamedSaveAt,
        restoredDraftAt: null,
        baselineFingerprint,
      });

      nodeIdCounter = maxNodeId(snapshot.nodes);
      addBuilderBreadcrumb("project_document_imported", {
        templateId: snapshot.activeTemplateId,
        importedName: document.metadata.name,
      });
    },

    addNode: (type, position) => {
      if (get().activeTemplateId !== CUSTOM_COMPOSE_TEMPLATE_ID) return;

      applyWorkingMutation((state) => ({
        nodes: [
          ...state.nodes,
          {
            id: `node-${nodeIdCounter++}`,
            type,
            position,
            data: {},
          },
        ],
      }));
    },

    syncDraftPersistence: (savedAt, hasUnsavedChanges) => {
      const state = get();
      if (
        state.lastDraftSavedAt === savedAt &&
        state.hasUnsavedChanges === hasUnsavedChanges
      ) {
        return;
      }

      set({
        lastDraftSavedAt: savedAt,
        hasUnsavedChanges,
      });
    },

    dismissDraftRecoveryNotice: () => {
      set({ restoredDraftAt: null });
    },
  };
});

export {
  getBuilderSnapshotFingerprint,
  migrateNodeData,
  sanitizeSavedCustomCode,
  sanitizeSavedEdges,
  sanitizeSavedNodes,
} from "@/lib/contractPersistence";
