"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import {
  ArrowLeft,
  ArrowRight,
  FlaskConical,
  FolderOpen,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import Header from "@/components/layout/Header";
import CanvasPanel from "@/components/layout/CanvasPanel";
import CodePanel from "@/components/layout/CodePanel";
import NodeSidebar from "@/components/layout/NodeSidebar";
import GuidedSetupPanel from "@/components/layout/GuidedSetupPanel";
import IdeaStartPanel from "@/components/layout/IdeaStartPanel";
import CodeEditorMode from "@/components/layout/CodeEditorMode";
import WelcomeOverlay from "@/components/layout/WelcomeOverlay";
import ResponsiveWarning from "@/components/layout/ResponsiveWarning";
import MyContractsPanel from "@/components/layout/MyContractsPanel";
import SimulationPreviewPanel from "@/components/layout/SimulationPreviewPanel";
import WizardOverlay from "@/components/layout/WizardOverlay";
import {
  WELCOME_DISMISSED_KEY,
  WIZARD_AUTO_OPEN_KEY,
} from "@/lib/builderUiKeys";
import BuilderSessionController from "@/components/layout/BuilderSessionController";
import { getBuilderStatus } from "@/lib/exportRequirements";
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
  const builderSurface = useFlowStore((s) => s.builderSurface);
  const guidedEntryStep = useFlowStore((s) => s.guidedEntryStep);
  const activeTemplateId = useFlowStore((s) => s.activeTemplateId);
  const hasUnsavedChanges = useFlowStore((s) => s.hasUnsavedChanges);
  const hasReviewedPreviewForCurrentDraft = useFlowStore(
    (s) => s.hasReviewedPreviewForCurrentDraft
  );
  const setBuilderSurface = useFlowStore((s) => s.setBuilderSurface);
  const lastDraftSavedAt = useFlowStore((s) => s.lastDraftSavedAt);
  const lastNamedSaveAt = useFlowStore((s) => s.lastNamedSaveAt);
  const nodeData = useFlowStore((s) => s.nodeData);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const restoredDraftAt = useFlowStore((s) => s.restoredDraftAt);
  const dismissDraftRecoveryNotice = useFlowStore((s) => s.dismissDraftRecoveryNotice);
  const [contractsOpen, setContractsOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [wizardAutoDismissed, setWizardAutoDismissed] = useState(false);
  const [draggedNodeLabel, setDraggedNodeLabel] = useState<string | null>(null);
  const visualModeLabel =
    activeTemplateId === "custom-compose"
      ? "Advanced Compose"
      : builderSurface === "advanced"
        ? "Template Developer Tools"
        : "Guided Setup";
  const effectiveDraggedNodeLabel =
    editorMode === "visual" && activeTemplateId === "custom-compose"
      ? draggedNodeLabel
      : null;
  const showGuidedWorkspace =
    editorMode === "visual" &&
    activeTemplateId !== "custom-compose" &&
    builderSurface === "guided";
  const showIdeaEntry = showGuidedWorkspace && guidedEntryStep === "idea";
  const showAdvancedVisualWorkspace =
    editorMode === "visual" && !showGuidedWorkspace;

  const builderStatus = useMemo(
    () =>
      getBuilderStatus(nodeData, nodes, {
        activeTemplateId,
        edges,
        enforcePreviewReview: showGuidedWorkspace,
        previewReviewed: hasReviewedPreviewForCurrentDraft,
      }),
    [
      activeTemplateId,
      edges,
      hasReviewedPreviewForCurrentDraft,
      nodeData,
      nodes,
      showGuidedWorkspace,
    ]
  );
  const guidedPrimaryAction = showIdeaEntry
    ? {
        label: "Describe your idea",
        hint: "Start with a plain-language brief. GenFlow will prepare the first draft for you.",
        onClick: () => {
          document
            .querySelector<HTMLElement>('[data-testid="idea-brief-input"]')
            ?.focus();
        },
      }
    : showGuidedWorkspace
    ? builderStatus.blockers.length > 0
      ? {
          label: "Start here",
          hint: "Fill the required answers in the guided form below.",
          onClick: () => {
            document
              .querySelector<HTMLElement>('[data-testid="guided-primary-form"]')
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          },
        }
      : builderStatus.preview.blocked
        ? {
            label: "Review preview",
            hint: "Preview is the required final check before export.",
            onClick: () => setPreviewOpen(true),
          }
        : {
            label: "Export contract",
            hint: "Your guided draft is ready to export.",
            onClick: () => {
              document
                .querySelector<HTMLElement>('[data-testid="guided-export-button"]')
                ?.click();
            },
          }
    : null;

  if (!mounted) {
    return <div className="h-screen bg-background" />;
  }
  const shouldAutoOpenWizard =
    !wizardAutoDismissed &&
    editorMode === "visual" &&
    activeTemplateId !== "custom-compose" &&
    !hasUnsavedChanges &&
    !restoredDraftAt &&
    !lastNamedSaveAt &&
    !lastDraftSavedAt &&
    typeof window !== "undefined" &&
    Boolean(window.localStorage.getItem(WELCOME_DISMISSED_KEY)) &&
    !window.localStorage.getItem(WIZARD_AUTO_OPEN_KEY);
  const effectiveWizardOpen = wizardOpen || shouldAutoOpenWizard;
  const handleWizardClose = () => {
    if (typeof window !== "undefined" && shouldAutoOpenWizard) {
      window.localStorage.setItem(WIZARD_AUTO_OPEN_KEY, "true");
      setWizardAutoDismissed(true);
    }

    setWizardOpen(false);
  };

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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-surface/70 px-4 py-3 backdrop-blur-xl md:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {guidedPrimaryAction && (
            <button
              onClick={guidedPrimaryAction.onClick}
              data-testid="guided-toolbar-primary-action"
              className="flex items-center gap-2 rounded-2xl border border-accent-blue/40 bg-accent-blue px-4 py-2 text-xs font-semibold text-background shadow-[0_12px_40px_rgba(56,189,248,0.24)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-accent-blue/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-blue/30"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              {guidedPrimaryAction.label}
            </button>
          )}
          <button
            onClick={() => setWizardOpen(true)}
            data-testid="open-wizard-button"
            className="flex items-center gap-1.5 rounded-2xl border border-border bg-background/70 px-3 py-2 text-xs font-medium text-muted transition-all duration-150 hover:border-accent-purple/50 hover:text-accent-purple focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-purple/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Smart Wizard
          </button>
          <span className="hidden md:block text-[11px] text-muted">
            {guidedPrimaryAction
              ? guidedPrimaryAction.hint
              : "Use the wizard when you want help choosing a starting point."}
          </span>
          <span className="text-[10px] text-muted uppercase tracking-widest font-display font-medium">
            {editorMode === "visual"
              ? showGuidedWorkspace
                ? "Guided Builder"
                : "Developer Tools"
              : "Advanced Code"}
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
        <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
          <div className="xl:hidden min-w-0 text-left sm:text-right">
            <p className="text-[10px] font-display font-medium uppercase tracking-widest text-foreground">
              {draftStateLabel}
            </p>
            <p className="text-[10px] text-muted">{draftStateHint}</p>
          </div>
          <button
            onClick={() => setContractsOpen(true)}
            data-testid="open-contracts-button"
            className="flex items-center gap-1.5 rounded-2xl border border-border bg-background/70 px-3 py-2 text-xs font-medium text-muted transition-all duration-150 hover:border-accent-blue/50 hover:text-accent-blue focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-blue/20"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            My Contracts
          </button>
          {!guidedPrimaryAction && (
            <button
              onClick={() => setPreviewOpen(true)}
              data-testid="open-simulation-preview"
              className="flex items-center gap-1.5 rounded-2xl border border-border bg-background/70 px-3 py-2 text-xs font-medium text-muted transition-all duration-150 hover:border-accent-blue/50 hover:text-accent-blue focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-blue/20"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Preview
            </button>
          )}
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
        {showIdeaEntry ? (
          <IdeaStartPanel onOpenWizard={() => setWizardOpen(true)} />
        ) : showGuidedWorkspace ? (
          <GuidedSetupPanel
            onOpenWizard={() => setWizardOpen(true)}
            onOpenPreview={() => setPreviewOpen(true)}
            onOpenContracts={() => setContractsOpen(true)}
            onOpenAdvanced={() => setBuilderSurface("advanced")}
          />
        ) : showAdvancedVisualWorkspace ? (
          <>
            {activeTemplateId === "custom-compose" ? (
              <NodeSidebar onDragStateChange={setDraggedNodeLabel} />
            ) : (
              <div className="flex w-[300px] shrink-0 flex-col border-r border-border bg-surface/80">
                <div className="border-b border-border px-4 py-4">
                  <div className="flex items-start gap-2">
                    <Wrench className="mt-0.5 h-4 w-4 text-foreground" />
                    <div>
                      <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                        Developer Tools
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        You are viewing the technical workspace for this guided draft.
                      </p>
                      <p className="mt-2 text-[11px] leading-relaxed text-muted">
                        The setup answers and autosaved draft are still preserved. Return to guided setup any time.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBuilderSurface("guided")}
                    data-testid="advanced-return-guided"
                    className="mt-4 inline-flex items-center gap-1.5 border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-all duration-150 hover:bg-surface-hover"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Return To Guided Setup
                  </button>
                </div>

                <div className="border-b border-border px-4 py-4">
                  <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                    Available here
                  </p>
                  <div className="mt-3 space-y-2 text-[11px] text-muted">
                    <p>Read-only template canvas for inspection.</p>
                    <p>Generated Python and export checklist.</p>
                    <p>Advanced Code stays in the top-right menu.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 h-full">
              <CanvasPanel draggedNodeLabel={effectiveDraggedNodeLabel} />
            </div>

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
        open={effectiveWizardOpen}
        onClose={handleWizardClose}
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
