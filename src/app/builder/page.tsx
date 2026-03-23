"use client";

import { useState, useSyncExternalStore } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { FlaskConical, FolderOpen, Sparkles, X } from "lucide-react";
import Header from "@/components/layout/Header";
import CanvasPanel from "@/components/layout/CanvasPanel";
import CodePanel from "@/components/layout/CodePanel";
import NodeSidebar from "@/components/layout/NodeSidebar";
import CodeEditorMode from "@/components/layout/CodeEditorMode";
import WelcomeOverlay from "@/components/layout/WelcomeOverlay";
import ResponsiveWarning from "@/components/layout/ResponsiveWarning";
import MyContractsPanel from "@/components/layout/MyContractsPanel";
import SimulationPreviewPanel from "@/components/layout/SimulationPreviewPanel";
import WizardOverlay from "@/components/layout/WizardOverlay";
import BuilderSessionController from "@/components/layout/BuilderSessionController";
import { useFlowStore } from "@/store/useFlowStore";

function formatTime(value: number | null): string {
  if (!value) return "Autosave pending";
  return `Autosaved ${new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function BuilderContent() {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const editorMode = useFlowStore((s) => s.editorMode);
  const activeTemplateId = useFlowStore((s) => s.activeTemplateId);
  const hasUnsavedChanges = useFlowStore((s) => s.hasUnsavedChanges);
  const lastDraftSavedAt = useFlowStore((s) => s.lastDraftSavedAt);
  const lastNamedSaveAt = useFlowStore((s) => s.lastNamedSaveAt);
  const restoredDraftAt = useFlowStore((s) => s.restoredDraftAt);
  const dismissDraftRecoveryNotice = useFlowStore((s) => s.dismissDraftRecoveryNotice);
  const [contractsOpen, setContractsOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [draggedNodeLabel, setDraggedNodeLabel] = useState<string | null>(null);
  const visualModeLabel =
    activeTemplateId === "custom-compose" ? "Custom Compose" : "Template Mode";
  const effectiveDraggedNodeLabel =
    editorMode === "visual" && activeTemplateId === "custom-compose"
      ? draggedNodeLabel
      : null;

  if (!mounted) {
    return <div className="h-screen bg-background" />;
  }
  const draftStateLabel = hasUnsavedChanges
    ? "Unsaved Changes"
    : lastNamedSaveAt
      ? "Saved Draft"
      : "Draft Only";
  const draftStateHint = lastNamedSaveAt
    ? `Last named save ${new Date(lastNamedSaveAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : formatTime(lastDraftSavedAt);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <BuilderSessionController />

      {/* Header */}
      <Header />

      {/* Toolbar row */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border bg-surface/50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWizardOpen(true)}
            data-testid="open-wizard-button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-medium text-foreground hover:bg-surface-hover border border-foreground transition-all duration-150"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Wizard
          </button>
          <button
            onClick={() => setPreviewOpen(true)}
            data-testid="open-simulation-preview"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover border border-border transition-all duration-150"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Preview
          </button>
          <span className="text-[10px] text-muted uppercase tracking-widest font-display font-medium">
            {editorMode === "visual" ? "Visual Builder" : "Code Editor"}
          </span>
          {editorMode === "visual" && (
            <span className="px-2 py-0.5 text-[10px] font-display font-medium uppercase tracking-widest rounded-none bg-background text-foreground border border-border">
              {visualModeLabel}
            </span>
          )}
          <div className="hidden xl:flex items-center gap-2 px-2 py-1 border border-border bg-background">
            <span className="text-[10px] font-display font-medium uppercase tracking-widest text-foreground">
              {draftStateLabel}
            </span>
            <span className="text-[10px] text-muted">
              {draftStateHint}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="xl:hidden text-right">
            <p className="text-[10px] font-display font-medium uppercase tracking-widest text-foreground">
              {draftStateLabel}
            </p>
            <p className="text-[10px] text-muted">{draftStateHint}</p>
          </div>
          <button
            onClick={() => setContractsOpen(true)}
            data-testid="open-contracts-button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover border border-border transition-all duration-150"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            My Contracts
          </button>
        </div>
      </div>

      {restoredDraftAt && (
        <div
          className="flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-2"
          data-testid="draft-restored-banner"
        >
          <div>
            <p className="text-[10px] font-display font-medium uppercase tracking-widest text-foreground">
              Draft Restored
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              Recovered your last builder session from{" "}
              {new Date(restoredDraftAt).toLocaleString()}.
            </p>
          </div>
          <button
            type="button"
            onClick={dismissDraftRecoveryNotice}
            className="flex items-center gap-1 border border-border px-2 py-1 text-[10px] uppercase tracking-widest text-muted transition-all duration-150 hover:bg-surface-hover hover:text-foreground"
            aria-label="Dismiss restored draft notice"
          >
            <X className="h-3.5 w-3.5" />
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {editorMode === "visual" ? (
          <>
            {/* Left: Node Sidebar */}
            <NodeSidebar onDragStateChange={setDraggedNodeLabel} />

            {/* Center: Canvas */}
            <div className="flex-1 h-full">
              <CanvasPanel draggedNodeLabel={effectiveDraggedNodeLabel} />
            </div>

            {/* Right: Code Panel 30% */}
            <div className="w-[30%] h-full">
              <CodePanel />
            </div>
          </>
        ) : (
          /* Code Mode: Full-width editor */
          <CodeEditorMode />
        )}
      </div>

      {/* Overlays */}
      <WelcomeOverlay onOpenWizard={() => setWizardOpen(true)} />
      <ResponsiveWarning />
      <MyContractsPanel
        open={contractsOpen}
        onClose={() => setContractsOpen(false)}
      />
      <SimulationPreviewPanel
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
      <WizardOverlay
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <ReactFlowProvider>
      <BuilderContent />
    </ReactFlowProvider>
  );
}
