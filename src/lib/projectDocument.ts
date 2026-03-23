import { createBuilderSnapshot } from "@/lib/contractPersistence";
import type { BuilderSnapshot, EditorMode, NodeData } from "@/store/useFlowStore";

export const CURRENT_PROJECT_DOCUMENT_VERSION = 1;

export interface ProjectDocumentMetadata {
  name: string;
  exportedAt: number;
  activeSavedContractId: string | null;
  lastNamedSaveAt: number | null;
  lastDraftSavedAt: number | null;
}

export interface ProjectDocument {
  documentType: "genflow-project";
  schemaVersion: number;
  metadata: ProjectDocumentMetadata;
  snapshot: BuilderSnapshot;
}

function sanitizeMetadata(value: unknown): ProjectDocumentMetadata {
  const metadata =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  return {
    name:
      typeof metadata.name === "string" && metadata.name.trim().length > 0
        ? metadata.name
        : "GenFlow Project",
    exportedAt:
      typeof metadata.exportedAt === "number" &&
      Number.isFinite(metadata.exportedAt)
        ? metadata.exportedAt
        : Date.now(),
    activeSavedContractId:
      typeof metadata.activeSavedContractId === "string" &&
      metadata.activeSavedContractId.length > 0
        ? metadata.activeSavedContractId
        : null,
    lastNamedSaveAt:
      typeof metadata.lastNamedSaveAt === "number" &&
      Number.isFinite(metadata.lastNamedSaveAt)
        ? metadata.lastNamedSaveAt
        : null,
    lastDraftSavedAt:
      typeof metadata.lastDraftSavedAt === "number" &&
      Number.isFinite(metadata.lastDraftSavedAt)
        ? metadata.lastDraftSavedAt
        : null,
  };
}

function migrateProjectDocumentRecord(record: Record<string, unknown>): ProjectDocument {
  const version =
    typeof record.schemaVersion === "number" ? record.schemaVersion : 0;

  if (version > CURRENT_PROJECT_DOCUMENT_VERSION) {
    throw new Error(
      `Unsupported GenFlow project schema version: ${String(record.schemaVersion)}`
    );
  }

  const isCurrentShape =
    record.documentType === "genflow-project" &&
    record.snapshot &&
    typeof record.snapshot === "object";

  const workingRecord =
    isCurrentShape && version === CURRENT_PROJECT_DOCUMENT_VERSION
      ? record
      : {
          documentType: "genflow-project",
          schemaVersion: CURRENT_PROJECT_DOCUMENT_VERSION,
          metadata: record.metadata ?? {
            name:
              typeof record.name === "string" && record.name.trim().length > 0
                ? record.name
                : "Imported GenFlow Project",
          },
          snapshot: isCurrentShape ? record.snapshot : record,
        };

  const snapshotRaw =
    typeof workingRecord.snapshot === "object" && workingRecord.snapshot !== null
      ? (workingRecord.snapshot as Record<string, unknown>)
      : {};
  const activeTemplateId =
    typeof snapshotRaw.activeTemplateId === "string"
      ? snapshotRaw.activeTemplateId
      : typeof workingRecord.activeTemplateId === "string"
        ? (workingRecord.activeTemplateId as string)
        : "custom-compose";

  const snapshot = createBuilderSnapshot({
    activeTemplateId,
    nodeData:
      typeof snapshotRaw.nodeData === "object" && snapshotRaw.nodeData !== null
        ? (snapshotRaw.nodeData as Partial<NodeData>)
        : undefined,
    customCode: snapshotRaw.customCode,
    nodes: snapshotRaw.nodes,
    edges: snapshotRaw.edges,
    editorMode: snapshotRaw.editorMode,
  });

  return {
    documentType: "genflow-project",
    schemaVersion: CURRENT_PROJECT_DOCUMENT_VERSION,
    metadata: sanitizeMetadata(workingRecord.metadata),
    snapshot,
  };
}

export function createProjectDocument(params: {
  name?: string;
  snapshot: BuilderSnapshot;
  activeSavedContractId?: string | null;
  lastNamedSaveAt?: number | null;
  lastDraftSavedAt?: number | null;
}): ProjectDocument {
  return {
    documentType: "genflow-project",
    schemaVersion: CURRENT_PROJECT_DOCUMENT_VERSION,
    metadata: {
      name: params.name?.trim() || params.snapshot.nodeData.contractName || "GenFlow Project",
      exportedAt: Date.now(),
      activeSavedContractId: params.activeSavedContractId ?? null,
      lastNamedSaveAt: params.lastNamedSaveAt ?? null,
      lastDraftSavedAt: params.lastDraftSavedAt ?? null,
    },
    snapshot: createBuilderSnapshot(params.snapshot),
  };
}

export function serializeProjectDocument(document: ProjectDocument): string {
  return JSON.stringify(document, null, 2);
}

export function parseProjectDocument(input: string): ProjectDocument {
  const parsed = JSON.parse(input);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid GenFlow project document.");
  }

  const record = parsed as Record<string, unknown>;
  if (
    record.documentType !== "genflow-project" &&
    typeof record.activeTemplateId !== "string"
  ) {
    throw new Error("This file is not a GenFlow project JSON document.");
  }

  return migrateProjectDocumentRecord(record);
}

export function buildImportedSnapshot(
  document: ProjectDocument,
  editorMode?: EditorMode
): BuilderSnapshot {
  return createBuilderSnapshot({
    ...document.snapshot,
    editorMode: editorMode ?? document.snapshot.editorMode,
  });
}
