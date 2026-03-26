import {
  createBuilderSnapshot,
  createBuilderSnapshotFromTemplate,
  getBuilderSnapshotFingerprint,
} from "@/lib/contractPersistence";
import type { IntentConfidence } from "@/lib/intentDraft";
import type {
  BuilderSnapshot,
  BuilderSurface,
  ChatMessage,
  EditorMode,
  GuidedEntryStep,
  NodeData,
} from "@/store/useFlowStore";

export const CURRENT_PROJECT_DOCUMENT_VERSION = 2;

export interface ProjectDocumentMetadata {
  name: string;
  exportedAt: number;
  activeSavedContractId: string | null;
  lastNamedSaveAt: number | null;
  lastDraftSavedAt: number | null;
}

export interface ProjectDocumentSession {
  builderSurface: BuilderSurface;
  guidedEntryStep: GuidedEntryStep;
  previewReviewFingerprint: string | null;
  chatMessages: ChatMessage[];
  draftSummary: string | null;
  draftAssumptions: string[];
  lastIntentConfidence: IntentConfidence | null;
}

export interface ProjectDocument {
  documentType: "genflow-project";
  schemaVersion: number;
  metadata: ProjectDocumentMetadata;
  session: ProjectDocumentSession;
  snapshot: BuilderSnapshot;
}

function sanitizeBuilderSurface(value: unknown): BuilderSurface {
  return value === "advanced" ? "advanced" : "guided";
}

function sanitizeGuidedEntryStep(value: unknown): GuidedEntryStep {
  return value === "review" ? "review" : "idea";
}

function sanitizeIntentConfidence(value: unknown): IntentConfidence | null {
  return value === "high" || value === "medium" || value === "low" ? value : null;
}

function sanitizeChatMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const message = item as Record<string, unknown>;
      if (typeof message.id !== "string" || typeof message.content !== "string") {
        return null;
      }

      return {
        id: message.id,
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      } satisfies ChatMessage;
    })
    .filter((message): message is ChatMessage => message !== null);
}

function createDefaultSession(snapshot: BuilderSnapshot): ProjectDocumentSession {
  const cleanSnapshot = createBuilderSnapshotFromTemplate(
    snapshot.activeTemplateId,
    snapshot.editorMode
  );
  const guidedEntryStep: GuidedEntryStep =
    getBuilderSnapshotFingerprint(cleanSnapshot) !==
    getBuilderSnapshotFingerprint(snapshot)
      ? "review"
      : "idea";

  return {
    builderSurface:
      snapshot.activeTemplateId === "custom-compose" || snapshot.editorMode === "code"
        ? "advanced"
        : "guided",
    guidedEntryStep,
    previewReviewFingerprint: null,
    chatMessages: [],
    draftSummary: null,
    draftAssumptions: [],
    lastIntentConfidence: null,
  };
}

function sanitizeSession(
  value: unknown,
  snapshot: BuilderSnapshot
): ProjectDocumentSession {
  const defaults = createDefaultSession(snapshot);
  const session =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  return {
    builderSurface:
      snapshot.activeTemplateId === "custom-compose" || snapshot.editorMode === "code"
        ? "advanced"
        : session.builderSurface === "advanced" || session.builderSurface === "guided"
          ? sanitizeBuilderSurface(session.builderSurface)
          : defaults.builderSurface,
    guidedEntryStep:
      session.guidedEntryStep === "review" || session.guidedEntryStep === "idea"
        ? sanitizeGuidedEntryStep(session.guidedEntryStep)
        : defaults.guidedEntryStep,
    previewReviewFingerprint:
      typeof session.previewReviewFingerprint === "string" &&
      session.previewReviewFingerprint.length > 0
        ? session.previewReviewFingerprint
        : defaults.previewReviewFingerprint,
    chatMessages: sanitizeChatMessages(session.chatMessages),
    draftSummary:
      typeof session.draftSummary === "string" && session.draftSummary.trim().length > 0
        ? session.draftSummary
        : defaults.draftSummary,
    draftAssumptions: Array.isArray(session.draftAssumptions)
      ? session.draftAssumptions.filter(
          (item): item is string => typeof item === "string" && item.trim().length > 0
        )
      : defaults.draftAssumptions,
    lastIntentConfidence: sanitizeIntentConfidence(session.lastIntentConfidence),
  };
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
    session: sanitizeSession(workingRecord.session, snapshot),
    snapshot,
  };
}

export function createProjectDocument(params: {
  name?: string;
  snapshot: BuilderSnapshot;
  activeSavedContractId?: string | null;
  lastNamedSaveAt?: number | null;
  lastDraftSavedAt?: number | null;
  session?: Partial<ProjectDocumentSession>;
}): ProjectDocument {
  const snapshot = createBuilderSnapshot(params.snapshot);
  const session = params.session ?? {};

  return {
    documentType: "genflow-project",
    schemaVersion: CURRENT_PROJECT_DOCUMENT_VERSION,
    metadata: {
      name: params.name?.trim() || snapshot.nodeData.contractName || "GenFlow Project",
      exportedAt: Date.now(),
      activeSavedContractId: params.activeSavedContractId ?? null,
      lastNamedSaveAt: params.lastNamedSaveAt ?? null,
      lastDraftSavedAt: params.lastDraftSavedAt ?? null,
    },
    session: sanitizeSession(session, snapshot),
    snapshot,
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
