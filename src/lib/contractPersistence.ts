"use client";

import type { Edge, Node } from "@xyflow/react";

import { getDefaultTemplate, getTemplate } from "@/engine/templateRegistry";
import type {
  BuilderSnapshot,
  EditorMode,
  NodeData,
  SavedContract,
  WorkingSession,
} from "@/store/useFlowStore";

export const SAVED_CONTRACTS_STORAGE_KEY = "genflow-contracts";
export const WORKING_SESSION_STORAGE_KEY = "genflow-working-session";
export const CURRENT_SAVED_CONTRACT_SCHEMA_VERSION = 1;
export const CURRENT_WORKING_SESSION_SCHEMA_VERSION = 1;

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

function getStorage(): Storage | null {
  if (typeof globalThis.localStorage === "undefined") return null;
  return globalThis.localStorage;
}

function sanitizeEditorMode(value: unknown): EditorMode {
  return value === "code" ? "code" : "visual";
}

function sanitizeStorageField(
  value: unknown
): { id: string; name: string; type: string } | null {
  if (!value || typeof value !== "object") return null;
  const field = value as Record<string, unknown>;
  if (typeof field.id !== "string" || field.id.length === 0) return null;
  if (typeof field.name !== "string") return null;

  return {
    id: field.id,
    name: field.name,
    type:
      typeof field.type === "string" && ALLOWED_GENVM_TYPES.has(field.type)
        ? field.type
        : "str",
  };
}

function sanitizeConstructorArg(
  value: unknown
): { id: string; name: string; type: string } | null {
  if (!value || typeof value !== "object") return null;
  const arg = value as Record<string, unknown>;
  if (typeof arg.id !== "string" || arg.id.length === 0) return null;
  if (typeof arg.name !== "string") return null;

  return {
    id: arg.id,
    name: arg.name,
    type:
      typeof arg.type === "string" && ALLOWED_GENVM_TYPES.has(arg.type)
        ? arg.type
        : "str",
  };
}

export function createEmptyNodeData(): NodeData {
  return {
    contractName: "",
    url: "",
    prompt: "",
    numValidators: 3,
    storageName: "",
    storageFields: [],
    constructorArgs: [],
  };
}

export function migrateNodeData(raw: Partial<NodeData>): NodeData {
  const rawFields = Array.isArray(raw.storageFields) ? raw.storageFields : [];
  const rawArgs = Array.isArray(raw.constructorArgs) ? raw.constructorArgs : [];

  return {
    contractName: typeof raw.contractName === "string" ? raw.contractName : "",
    url: typeof raw.url === "string" ? raw.url : "",
    prompt: typeof raw.prompt === "string" ? raw.prompt : "",
    numValidators:
      typeof raw.numValidators === "number" ? raw.numValidators : 3,
    storageName: typeof raw.storageName === "string" ? raw.storageName : "",
    storageFields: rawFields
      .map(sanitizeStorageField)
      .filter((field): field is NonNullable<ReturnType<typeof sanitizeStorageField>> => field !== null),
    constructorArgs: rawArgs
      .map(sanitizeConstructorArg)
      .filter((arg): arg is NonNullable<ReturnType<typeof sanitizeConstructorArg>> => arg !== null),
  };
}

function sanitizeNode(value: unknown): Node | null {
  if (!value || typeof value !== "object") return null;
  const node = value as Record<string, unknown>;
  if (typeof node.id !== "string" || node.id.length === 0) return null;
  if (typeof node.type !== "string" || node.type.length === 0) return null;

  const positionRaw =
    typeof node.position === "object" && node.position !== null
      ? (node.position as Record<string, unknown>)
      : null;

  return {
    ...(node as unknown as Node),
    id: node.id,
    type: node.type,
    position: {
      x: typeof positionRaw?.x === "number" ? positionRaw.x : 0,
      y: typeof positionRaw?.y === "number" ? positionRaw.y : 0,
    },
    data:
      typeof node.data === "object" && node.data !== null
        ? (node.data as Node["data"])
        : ({} as Node["data"]),
  };
}

function sanitizeEdge(value: unknown): Edge | null {
  if (!value || typeof value !== "object") return null;
  const edge = value as Record<string, unknown>;
  if (typeof edge.id !== "string" || edge.id.length === 0) return null;
  if (typeof edge.source !== "string" || edge.source.length === 0) return null;
  if (typeof edge.target !== "string" || edge.target.length === 0) return null;

  return {
    ...(edge as unknown as Edge),
    id: edge.id,
    source: edge.source,
    target: edge.target,
  };
}

export function sanitizeSavedNodes(input: unknown): Node[] {
  if (!Array.isArray(input)) return [];
  return input.map(sanitizeNode).filter((node): node is Node => node !== null);
}

export function sanitizeSavedEdges(
  input: unknown,
  nodeIds: Set<string>
): Edge[] {
  if (!Array.isArray(input)) return [];

  return input
    .map(sanitizeEdge)
    .filter((edge): edge is Edge => edge !== null)
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
}

export function sanitizeSavedCustomCode(input: unknown): string {
  return typeof input === "string" ? input : "";
}

export function createBuilderSnapshotFromTemplate(
  templateId: string,
  editorMode: EditorMode = "visual"
): BuilderSnapshot {
  const template = getTemplate(templateId) ?? defaultTemplate;

  return {
    activeTemplateId: template.id,
    nodes: sanitizeSavedNodes(template.defaultNodes),
    edges: sanitizeSavedEdges(
      template.defaultEdges,
      new Set(template.defaultNodes.map((node) => node.id))
    ),
    nodeData: createEmptyNodeData(),
    customCode: "",
    editorMode,
  };
}

export function createBuilderSnapshot(
  raw: Pick<BuilderSnapshot, "activeTemplateId"> & {
    nodes?: unknown;
    edges?: unknown;
    nodeData?: Partial<NodeData>;
    customCode?: unknown;
    editorMode?: unknown;
  }
): BuilderSnapshot {
  const fallback = createBuilderSnapshotFromTemplate(
    raw.activeTemplateId,
    sanitizeEditorMode(raw.editorMode)
  );
  const nodes = sanitizeSavedNodes(raw.nodes);
  const safeNodes = nodes.length > 0 ? nodes : fallback.nodes;
  const nodeIds = new Set(safeNodes.map((node) => node.id));
  const edges = sanitizeSavedEdges(raw.edges, nodeIds);

  return {
    activeTemplateId: fallback.activeTemplateId,
    nodes: safeNodes,
    edges: edges.length > 0 || nodes.length > 0 ? edges : fallback.edges,
    nodeData: migrateNodeData(raw.nodeData ?? {}),
    customCode: sanitizeSavedCustomCode(raw.customCode),
    editorMode: sanitizeEditorMode(raw.editorMode),
  };
}

export function getBuilderSnapshotFingerprint(
  snapshot: BuilderSnapshot
): string {
  return JSON.stringify({
    activeTemplateId: snapshot.activeTemplateId,
    nodeData: snapshot.nodeData,
    customCode: snapshot.customCode,
    editorMode: snapshot.editorMode,
    nodes: snapshot.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
    })),
    edges: snapshot.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
    })),
  });
}

export function toBuilderSnapshot(session: WorkingSession): BuilderSnapshot {
  return createBuilderSnapshot({
    activeTemplateId: session.activeTemplateId,
    nodeData: session.nodeData,
    customCode: session.customCode,
    nodes: session.nodes,
    edges: session.edges,
    editorMode: session.editorMode,
  });
}

function migrateSavedContractRecord(
  record: Record<string, unknown>
): SavedContract | null {
  const version =
    typeof record.schemaVersion === "number" ? record.schemaVersion : 0;

  if (version > CURRENT_SAVED_CONTRACT_SCHEMA_VERSION) return null;

  const migrated: Record<string, unknown> =
    version === 0
      ? { ...record, schemaVersion: CURRENT_SAVED_CONTRACT_SCHEMA_VERSION }
      : record;

  if (typeof migrated.id !== "string" || migrated.id.length === 0) return null;
  if (typeof migrated.name !== "string") return null;
  if (typeof migrated.templateId !== "string") return null;

  const snapshot = createBuilderSnapshot({
    activeTemplateId: migrated.templateId,
    nodeData:
      typeof migrated.nodeData === "object" && migrated.nodeData !== null
        ? (migrated.nodeData as Partial<NodeData>)
        : createEmptyNodeData(),
    customCode: migrated.customCode,
    nodes: migrated.nodes,
    edges: migrated.edges,
    editorMode: "visual",
  });

  return {
    id: migrated.id,
    schemaVersion: CURRENT_SAVED_CONTRACT_SCHEMA_VERSION,
    name: migrated.name,
    templateId: snapshot.activeTemplateId,
    nodeData: snapshot.nodeData,
    customCode: snapshot.customCode,
    nodes: snapshot.nodes,
    edges: snapshot.edges,
    savedAt:
      typeof migrated.savedAt === "number" && Number.isFinite(migrated.savedAt)
        ? migrated.savedAt
        : Date.now(),
  };
}

function migrateWorkingSessionRecord(
  record: Record<string, unknown>
): WorkingSession | null {
  const version =
    typeof record.schemaVersion === "number" ? record.schemaVersion : 0;

  if (version > CURRENT_WORKING_SESSION_SCHEMA_VERSION) return null;

  const migrated: Record<string, unknown> =
    version === 0
      ? { ...record, schemaVersion: CURRENT_WORKING_SESSION_SCHEMA_VERSION }
      : record;

  if (typeof migrated.activeTemplateId !== "string") return null;

  const snapshot = createBuilderSnapshot({
    activeTemplateId: migrated.activeTemplateId,
    nodeData:
      typeof migrated.nodeData === "object" && migrated.nodeData !== null
        ? (migrated.nodeData as Partial<NodeData>)
        : createEmptyNodeData(),
    customCode: migrated.customCode,
    nodes: migrated.nodes,
    edges: migrated.edges,
    editorMode: sanitizeEditorMode(migrated.editorMode),
  });

  const baselineFingerprint =
    typeof migrated.baselineFingerprint === "string" &&
    migrated.baselineFingerprint.length > 0
      ? migrated.baselineFingerprint
      : getBuilderSnapshotFingerprint(snapshot);

  return {
    schemaVersion: CURRENT_WORKING_SESSION_SCHEMA_VERSION,
    updatedAt:
      typeof migrated.updatedAt === "number" && Number.isFinite(migrated.updatedAt)
        ? migrated.updatedAt
        : Date.now(),
    activeTemplateId: snapshot.activeTemplateId,
    nodeData: snapshot.nodeData,
    customCode: snapshot.customCode,
    nodes: snapshot.nodes,
    edges: snapshot.edges,
    editorMode: snapshot.editorMode,
    baselineFingerprint,
    activeSavedContractId:
      typeof migrated.activeSavedContractId === "string" &&
      migrated.activeSavedContractId.length > 0
        ? migrated.activeSavedContractId
        : null,
    lastNamedSaveAt:
      typeof migrated.lastNamedSaveAt === "number" &&
      Number.isFinite(migrated.lastNamedSaveAt)
        ? migrated.lastNamedSaveAt
        : null,
  };
}

export function loadSavedContracts(): SavedContract[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const stored = storage.getItem(SAVED_CONTRACTS_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) =>
        item && typeof item === "object"
          ? migrateSavedContractRecord(item as Record<string, unknown>)
          : null
      )
      .filter((contract): contract is SavedContract => contract !== null);
  } catch {
    return [];
  }
}

export function persistSavedContracts(contracts: SavedContract[]) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(SAVED_CONTRACTS_STORAGE_KEY, JSON.stringify(contracts));
}

export function loadWorkingSession(): WorkingSession | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const stored = storage.getItem(WORKING_SESSION_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return null;

    return migrateWorkingSessionRecord(parsed as Record<string, unknown>);
  } catch {
    return null;
  }
}

export function persistWorkingSession(session: WorkingSession) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(WORKING_SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function hasMeaningfulWorkingSession(session: WorkingSession): boolean {
  const cleanSnapshot = createBuilderSnapshotFromTemplate(
    session.activeTemplateId,
    session.editorMode
  );

  return (
    getBuilderSnapshotFingerprint(cleanSnapshot) !==
    getBuilderSnapshotFingerprint(toBuilderSnapshot(session))
  );
}
