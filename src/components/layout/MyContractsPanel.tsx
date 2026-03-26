"use client";

import { useMemo, useRef, useState } from "react";
import {
  Download,
  FileCode,
  FolderOpen,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import ConfirmationDialog from "@/components/layout/ConfirmationDialog";
import { useDialogFocusTrap } from "@/hooks/useDialogFocusTrap";
import { getBuilderStatus } from "@/lib/exportRequirements";
import {
  createProjectDocument,
  parseProjectDocument,
  serializeProjectDocument,
  type ProjectDocument,
} from "@/lib/projectDocument";
import { addBuilderBreadcrumb, captureBuilderEvent } from "@/lib/telemetry";
import { useFlowStore } from "@/store/useFlowStore";

interface MyContractsPanelProps {
  open: boolean;
  onClose: () => void;
}

function formatTimestamp(value: number | null): string {
  if (!value) return "Not yet";
  return new Date(value).toLocaleString();
}

export default function MyContractsPanel({
  open,
  onClose,
}: MyContractsPanelProps) {
  const savedContracts = useFlowStore((state) => state.savedContracts);
  const loadContract = useFlowStore((state) => state.loadContract);
  const deleteContract = useFlowStore((state) => state.deleteContract);
  const saveContract = useFlowStore((state) => state.saveContract);
  const nodeData = useFlowStore((state) => state.nodeData);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const customCode = useFlowStore((state) => state.customCode);
  const editorMode = useFlowStore((state) => state.editorMode);
  const activeTemplateId = useFlowStore((state) => state.activeTemplateId);
  const activeSavedContractId = useFlowStore((state) => state.activeSavedContractId);
  const hasUnsavedChanges = useFlowStore((state) => state.hasUnsavedChanges);
  const hasReviewedPreviewForCurrentDraft = useFlowStore(
    (state) => state.hasReviewedPreviewForCurrentDraft
  );
  const lastDraftSavedAt = useFlowStore((state) => state.lastDraftSavedAt);
  const lastNamedSaveAt = useFlowStore((state) => state.lastNamedSaveAt);
  const builderSurface = useFlowStore((state) => state.builderSurface);
  const guidedEntryStep = useFlowStore((state) => state.guidedEntryStep);
  const previewReviewFingerprint = useFlowStore(
    (state) => state.previewReviewFingerprint
  );
  const chatMessages = useFlowStore((state) => state.chatMessages);
  const draftSummary = useFlowStore((state) => state.draftSummary);
  const draftAssumptions = useFlowStore((state) => state.draftAssumptions);
  const lastIntentConfidence = useFlowStore((state) => state.lastIntentConfidence);
  const importProjectDocument = useFlowStore((state) => state.importProjectDocument);
  const dialogRef = useDialogFocusTrap({ open, onClose });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [saveName, setSaveName] = useState("");
  const [showSave, setShowSave] = useState(false);
  const [pendingLoadId, setPendingLoadId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<ProjectDocument | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const builderStatus = useMemo(
    () =>
      getBuilderStatus(nodeData, nodes, {
        activeTemplateId,
        edges,
        enforcePreviewReview: activeTemplateId !== "custom-compose",
        previewReviewed: hasReviewedPreviewForCurrentDraft,
      }),
    [
      activeTemplateId,
      edges,
      hasReviewedPreviewForCurrentDraft,
      nodeData,
      nodes,
    ]
  );

  const pendingLoadContract = savedContracts.find((contract) => contract.id === pendingLoadId);
  const pendingDeleteContract = savedContracts.find(
    (contract) => contract.id === pendingDeleteId
  );

  const handleSave = () => {
    const name = saveName.trim() || nodeData.contractName || "Untitled Contract";
    saveContract(name);
    setStatusMessage(`Saved "${name}" as a named contract.`);
    addBuilderBreadcrumb("contract_saved", {
      templateId: activeTemplateId,
      contractCount: savedContracts.length + 1,
      readyToExport: builderStatus.readyToExport,
    });
    setSaveName("");
    setShowSave(false);
  };

  const handleExportProject = () => {
    const projectDocument = createProjectDocument({
      name: nodeData.contractName || "GenFlow Project",
      snapshot: {
        activeTemplateId,
        nodes,
        edges,
        nodeData,
        customCode,
        editorMode,
      },
      activeSavedContractId,
      lastNamedSaveAt,
      lastDraftSavedAt,
      session: {
        builderSurface,
        guidedEntryStep,
        previewReviewFingerprint,
        chatMessages,
        draftSummary,
        draftAssumptions,
        lastIntentConfidence,
      },
    });
    const fileName = `${projectDocument.metadata.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || "genflow_project"}.genflow.json`;
    const blob = new Blob([serializeProjectDocument(projectDocument)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatusMessage(`Exported project JSON as "${fileName}".`);
    captureBuilderEvent("project_document_exported", {
      templateId: activeTemplateId,
      nodeCount: nodes.length,
      hasCustomCode: Boolean(customCode.trim()),
    });
  };

  const executeImport = (document: ProjectDocument) => {
    importProjectDocument(document);
    setStatusMessage(`Imported "${document.metadata.name}" into the builder.`);
    captureBuilderEvent("project_document_imported", {
      templateId: document.snapshot.activeTemplateId,
      importedName: document.metadata.name,
      nodeCount: document.snapshot.nodes.length,
    });
    setPendingImport(null);
    onClose();
  };

  const handleImportFile = async (file: File | null) => {
    if (!file) return;

    try {
      const content = await file.text();
      const document = parseProjectDocument(content);

      if (hasUnsavedChanges) {
        setPendingImport(document);
        return;
      }

      executeImport(document);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Could not import this project file."
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const executeLoad = (id: string) => {
    loadContract(id);
    const contract = savedContracts.find((item) => item.id === id);
    setStatusMessage(
      contract ? `Loaded "${contract.name}" into the current builder.` : "Loaded contract."
    );
    addBuilderBreadcrumb("contract_loaded", {
      contractId: id,
      hadUnsavedChanges: hasUnsavedChanges,
    });
    setPendingLoadId(null);
    onClose();
  };

  const executeDelete = (id: string) => {
    const contract = savedContracts.find((item) => item.id === id);
    deleteContract(id);
    setStatusMessage(
      contract ? `Deleted "${contract.name}" from named saves.` : "Deleted contract."
    );
    addBuilderBreadcrumb("contract_deleted", {
      contractId: id,
      wasActive: activeSavedContractId === id,
    });
    setPendingDeleteId(null);
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-contracts-title"
        aria-describedby="my-contracts-description"
        tabIndex={-1}
        data-testid="my-contracts-panel"
        className="fixed top-0 right-0 z-[90] flex h-full w-[380px] flex-col border-l border-border bg-surface shadow-none outline-none"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-foreground" />
            <div>
              <span
                id="my-contracts-title"
                className="text-sm font-display font-medium"
              >
                My Contracts
              </span>
              <p
                id="my-contracts-description"
                className="text-[10px] text-muted"
              >
                Named saves live separately from your autosaved working draft.
              </p>
            </div>
            <span className="rounded-none bg-foreground px-1.5 py-0.5 font-mono text-[10px] text-background">
              {savedContracts.length}
            </span>
          </div>
          <button
            onClick={onClose}
            data-testid="close-contracts-panel"
            aria-label="Close My Contracts panel"
            className="rounded-none p-1 text-muted transition-colors duration-150 hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-border bg-background/60 px-4 py-3">
          <div className="border border-border bg-background px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-display font-medium uppercase tracking-widest text-foreground">
                  Current Draft
                </p>
                <p className="mt-1 text-xs text-muted">
                  {builderStatus.summary}.{" "}
                  {hasUnsavedChanges
                    ? "Unsaved edits since the last named save."
                    : lastNamedSaveAt
                      ? "Draft matches the last named save state."
                      : "Autosaved working draft with no named checkpoint yet."}
                </p>
              </div>
              <span
                className={`border px-2 py-0.5 text-[10px] font-display font-medium uppercase tracking-widest ${
                  hasUnsavedChanges
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-surface text-foreground"
                }`}
              >
                {hasUnsavedChanges ? "Unsaved" : lastNamedSaveAt ? "Saved" : "Draft Only"}
              </span>
            </div>

            <div className="mt-3 grid gap-2 text-[11px] text-muted">
              <p>Autosaved: {formatTimestamp(lastDraftSavedAt)}</p>
              <p>Last named save: {formatTimestamp(lastNamedSaveAt)}</p>
              <p>Active template: {activeTemplateId}</p>
            </div>

            {builderStatus.blockers.length > 0 && (
              <div className="mt-3 space-y-1 border border-border bg-surface px-3 py-2 text-[11px] text-muted">
                <p className="font-display text-[10px] uppercase tracking-widest text-foreground">
                  Export blockers
                </p>
                {builderStatus.blockers.map((blocker) => (
                  <p key={blocker.id}>{blocker.message}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-b border-border px-4 py-3">
          {showSave ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(event) => setSaveName(event.target.value)}
                placeholder="Contract name..."
                data-testid="save-contract-name-input"
                className="flex-1 border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted/50 focus:border-foreground focus:outline-none"
                onKeyDown={(event) => event.key === "Enter" && handleSave()}
                autoFocus
              />
              <button
                onClick={handleSave}
                data-testid="confirm-save-contract"
                className="border border-foreground bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-all duration-150 hover:bg-foreground hover:opacity-90"
              >
                Save
              </button>
              <button
                onClick={() => setShowSave(false)}
                aria-label="Cancel save contract"
                className="rounded-none p-1.5 text-muted transition-all duration-150 hover:bg-surface-hover hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSave(true)}
              data-testid="save-current-contract"
              className="flex w-full items-center justify-center gap-2 rounded-none border border-foreground bg-foreground px-3 py-2 text-xs font-medium text-background transition-all duration-150 hover:bg-foreground hover:opacity-90"
            >
              <Save className="h-3.5 w-3.5" />
              Save Current Draft
            </button>
          )}

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExportProject}
              data-testid="export-project-document"
              className="flex items-center justify-center gap-2 rounded-none border border-border bg-background px-3 py-2 text-[11px] font-medium text-foreground transition-all duration-150 hover:bg-surface-hover"
            >
              <Download className="h-3.5 w-3.5" />
              Export Project JSON
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              data-testid="import-project-document"
              className="flex items-center justify-center gap-2 rounded-none border border-border bg-background px-3 py-2 text-[11px] font-medium text-foreground transition-all duration-150 hover:bg-surface-hover"
            >
              <Upload className="h-3.5 w-3.5" />
              Import Project JSON
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json,.genflow.json"
            className="hidden"
            onChange={(event) =>
              handleImportFile(event.currentTarget.files?.[0] ?? null)
            }
          />

          <div aria-live="polite" className="min-h-[20px] pt-2 text-[11px] text-muted">
            {statusMessage}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {savedContracts.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted">
              <FileCode className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">No named contracts yet</p>
              <p className="mt-1 text-xs opacity-60">
                Save the current draft to keep a reusable checkpoint.
              </p>
            </div>
          ) : (
            savedContracts
              .slice()
              .sort((first, second) => second.savedAt - first.savedAt)
              .map((contract) => (
                <div
                  key={contract.id}
                  data-testid={`saved-contract-row-${contract.id}`}
                  className={`group flex items-center gap-3 rounded-none border px-3 py-2.5 transition-all duration-150 ${
                    contract.id === activeSavedContractId
                      ? "border-foreground bg-background"
                      : "border-border bg-background hover:border-foreground hover:bg-surface-hover"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{contract.name}</p>
                      {contract.id === activeSavedContractId && (
                        <span className="border border-foreground bg-foreground px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-background">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted">
                      {contract.templateId} · {new Date(contract.savedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-100 transition-all duration-150 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <button
                      onClick={() => {
                        if (hasUnsavedChanges && contract.id !== activeSavedContractId) {
                          setPendingLoadId(contract.id);
                          return;
                        }
                        executeLoad(contract.id);
                      }}
                      data-testid={`load-contract-${contract.id}`}
                      aria-label={`Load ${contract.name}`}
                      className="rounded-none p-1.5 text-foreground transition-colors duration-150 hover:bg-foreground hover:text-background"
                      title="Load contract"
                    >
                      <Upload className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setPendingDeleteId(contract.id)}
                      data-testid={`delete-contract-${contract.id}`}
                      aria-label={`Delete ${contract.name}`}
                      className="rounded-none p-1.5 text-foreground transition-colors duration-150 hover:bg-foreground hover:text-background"
                      title="Delete contract"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={pendingLoadContract !== undefined && pendingLoadContract !== null}
        title="Load a saved contract?"
        description={`Loading "${pendingLoadContract?.name ?? "this contract"}" replaces the current canvas view. Your latest draft is autosaved in this browser.`}
        confirmLabel="Load Contract"
        onClose={() => setPendingLoadId(null)}
        onConfirm={() => {
          if (!pendingLoadId) return;
          executeLoad(pendingLoadId);
        }}
      />

      <ConfirmationDialog
        open={pendingDeleteContract !== undefined && pendingDeleteContract !== null}
        title="Delete this named contract?"
        description={
          pendingDeleteContract?.id === activeSavedContractId
            ? `Deleting "${pendingDeleteContract?.name ?? "this contract"}" removes the named save. The current builder stays open as a draft only.`
            : `Delete "${pendingDeleteContract?.name ?? "this contract"}" from your named saves? This cannot be undone.`
        }
        confirmLabel="Delete Contract"
        tone="danger"
        onClose={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (!pendingDeleteId) return;
          executeDelete(pendingDeleteId);
        }}
      />

      <ConfirmationDialog
        open={pendingImport !== null}
        title="Import this project JSON?"
        description={`Importing "${pendingImport?.metadata.name ?? "this project"}" replaces the current canvas view. Your latest local draft stays autosaved in this browser.`}
        confirmLabel="Import Project"
        onClose={() => setPendingImport(null)}
        onConfirm={() => {
          if (!pendingImport) return;
          executeImport(pendingImport);
        }}
      />
    </>
  );
}
