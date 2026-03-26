"use client";

import { useMemo } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Eye,
  FolderOpen,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";

import { generateCode } from "@/engine/codeGenerator";
import { getTemplate } from "@/engine/templateRegistry";
import IntentRefinementPanel from "@/components/layout/IntentRefinementPanel";
import { resolveBuilderCode } from "@/lib/builderCode";
import { getBuilderStatus } from "@/lib/exportRequirements";
import { addBuilderBreadcrumb } from "@/lib/telemetry";
import {
  getTemplateFormDefinition,
  type TemplateFormField,
} from "@/lib/templateForm";
import { useFlowStore } from "@/store/useFlowStore";

const GENVM_TYPES = [
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
] as const;

const VALIDATOR_OPTIONS = [1, 3, 5] as const;

interface GuidedSetupPanelProps {
  onOpenWizard: () => void;
  onOpenPreview: () => void;
  onOpenContracts: () => void;
  onOpenAdvanced: () => void;
}

function makeExportFileName(contractName: string): string {
  return `${(contractName.trim() || "my_contract")
    .toLowerCase()
    .replace(/\s+/g, "_")}.py`;
}

function StepBadge({
  step,
  title,
  detail,
  complete,
}: {
  step: string;
  title: string;
  detail: string;
  complete: boolean;
}) {
  return (
    <div className="border border-border bg-background px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
            Step {step}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">{title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">{detail}</p>
        </div>
        <span
          className={`border px-2 py-0.5 text-[10px] uppercase tracking-widest ${
            complete
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-surface text-foreground"
          }`}
        >
          {complete ? "Done" : "Open"}
        </span>
      </div>
    </div>
  );
}

function FieldStatus({ field }: { field: TemplateFormField }) {
  return (
    <div className="mb-2 flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-foreground">{field.label}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">{field.helpText}</p>
      </div>
      <span
        className={`shrink-0 border px-2 py-0.5 text-[10px] uppercase tracking-widest ${
          field.done
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-surface text-foreground"
        }`}
      >
        {field.required ? (field.done ? "Ready" : "Needed") : field.done ? "Set" : "Optional"}
      </span>
    </div>
  );
}

export default function GuidedSetupPanel({
  onOpenWizard,
  onOpenPreview,
  onOpenContracts,
  onOpenAdvanced,
}: GuidedSetupPanelProps) {
  const activeTemplateId = useFlowStore((state) => state.activeTemplateId);
  const nodeData = useFlowStore((state) => state.nodeData);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const hasUnsavedChanges = useFlowStore((state) => state.hasUnsavedChanges);
  const hasReviewedPreviewForCurrentDraft = useFlowStore(
    (state) => state.hasReviewedPreviewForCurrentDraft
  );
  const lastNamedSaveAt = useFlowStore((state) => state.lastNamedSaveAt);
  const draftSummary = useFlowStore((state) => state.draftSummary);
  const draftAssumptions = useFlowStore((state) => state.draftAssumptions);
  const chatMessages = useFlowStore((state) => state.chatMessages);
  const customCode = useFlowStore((state) => state.customCode);
  const setContractName = useFlowStore((state) => state.setContractName);
  const setUrl = useFlowStore((state) => state.setUrl);
  const setPrompt = useFlowStore((state) => state.setPrompt);
  const setNumValidators = useFlowStore((state) => state.setNumValidators);
  const setStorageName = useFlowStore((state) => state.setStorageName);
  const addStorageField = useFlowStore((state) => state.addStorageField);
  const updateStorageField = useFlowStore((state) => state.updateStorageField);
  const removeStorageField = useFlowStore((state) => state.removeStorageField);
  const addConstructorArg = useFlowStore((state) => state.addConstructorArg);
  const updateConstructorArg = useFlowStore((state) => state.updateConstructorArg);
  const removeConstructorArg = useFlowStore((state) => state.removeConstructorArg);

  const template = getTemplate(activeTemplateId);
  const builderStatus = useMemo(
    () =>
      getBuilderStatus(nodeData, nodes, {
        activeTemplateId,
        edges,
        enforcePreviewReview: true,
        previewReviewed: hasReviewedPreviewForCurrentDraft,
      }),
    [activeTemplateId, edges, hasReviewedPreviewForCurrentDraft, nodeData, nodes]
  );
  const formDefinition = useMemo(
    () =>
      getTemplateFormDefinition({
        templateName: template?.name ?? "Current template",
        nodeData,
        nodes,
      }),
    [nodeData, nodes, template?.name]
  );

  const handleExport = () => {
    if (!builderStatus.readyToExport) {
      addBuilderBreadcrumb("export_blocked", {
        templateId: activeTemplateId,
        blockerIds: [
          ...builderStatus.blockers.map((item) => item.id),
          ...(builderStatus.preview.blocked ? ["preview-review"] : []),
        ],
      });

      if (builderStatus.preview.blocked) {
        onOpenPreview();
      }
      return;
    }

    const generatedCode = generateCode(nodeData, activeTemplateId, nodes);
    const code = resolveBuilderCode(generatedCode, customCode);
    const fileName = makeExportFileName(nodeData.contractName);
    const blob = new Blob([code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);

    addBuilderBreadcrumb("export_success", {
      templateId: activeTemplateId,
      readyToExport: true,
      blockerIds: [],
    });
  };
  const primaryAction =
    builderStatus.blockers.length > 0
      ? {
          title: "Start here",
          description:
            "Complete the required answers below first. You do not need to open developer tools.",
          label: "Fill required answers",
          onClick: () => {
            document
              .querySelector<HTMLElement>('[data-testid="guided-primary-form"]')
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          },
        }
      : builderStatus.preview.blocked
        ? {
            title: "Next step",
            description:
              "Open Preview now. This is the required final review before export unlocks.",
            label: "Open Preview",
            onClick: onOpenPreview,
          }
        : {
            title: "Ready to export",
            description:
              "This guided draft has everything required. Export now or save a named checkpoint first.",
            label: "Export Python",
            onClick: handleExport,
          };

  return (
    <section
      data-testid="no-code-setup-panel"
      className="flex h-full flex-1 overflow-y-auto bg-surface/80"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-6 xl:flex-row">
        <div className="min-w-0 flex-1 space-y-5">
          <div className="border border-border bg-background px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-foreground" />
                  <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                    Draft Review
                  </p>
                </div>
                <h2 className="mt-2 text-2xl font-display font-medium text-foreground">
                  {formDefinition.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {draftSummary ?? formDefinition.description}
                </p>
                {chatMessages.length > 0 && (
                  <p className="mt-2 text-[11px] text-muted">
                    Built from your idea in {chatMessages.length / 2 >= 1 ? "chat-first" : "guided"} mode.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onOpenWizard}
                data-testid="guided-open-wizard"
                className="inline-flex items-center gap-1.5 border border-foreground bg-foreground px-3 py-2 text-xs font-medium text-background transition-all duration-150 hover:opacity-90"
              >
                Smart Wizard
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <StepBadge
                step="1"
                title="Choose a contract type"
                detail={template?.description ?? "Pick the starting point that fits your use case."}
                complete
              />
              <StepBadge
                step="2"
                title="Fill the setup answers"
                detail="Complete the required fields below. GenFlow keeps the structure behind the scenes."
                complete={builderStatus.blockers.length === 0}
              />
              <StepBadge
                step="3"
                title="Review the preview"
                detail={builderStatus.preview.message}
                complete={!builderStatus.preview.blocked}
              />
              <StepBadge
                step="4"
                title="Save or export"
                detail="Keep a named checkpoint if you want to return later, then export the Python contract."
                complete={builderStatus.readyToExport}
              />
            </div>
          </div>

          <div className="border border-foreground bg-foreground px-5 py-5 text-background">
            <p className="text-[10px] font-display font-medium uppercase tracking-widest text-background/70">
              {primaryAction.title}
            </p>
            <p className="mt-2 text-lg font-display font-medium">
              {primaryAction.label}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-background/80">
              {primaryAction.description}
            </p>
            <button
              type="button"
              onClick={primaryAction.onClick}
              data-testid="guided-next-step-button"
              className="mt-4 inline-flex items-center gap-1.5 border border-background bg-background px-3 py-2 text-xs font-medium text-foreground transition-all duration-150 hover:bg-background/90"
            >
              {primaryAction.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {draftAssumptions.length > 0 && (
            <div className="border border-border bg-background px-5 py-5">
              <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                Review these assumptions
              </p>
              <div className="mt-3 space-y-2 text-[11px] leading-relaxed text-muted">
                {draftAssumptions.map((assumption) => (
                  <p key={assumption}>{assumption}</p>
                ))}
              </div>
            </div>
          )}

          <div data-testid="guided-primary-form" className="space-y-5">
            {formDefinition.sections.map((section) => (
              <div key={section.id} className="border border-border bg-background px-5 py-5">
              <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                {section.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{section.description}</p>

              <div className="mt-4 space-y-4">
                {section.fields.map((field) => (
                  <div key={field.id} className="border border-border bg-surface px-4 py-4">
                    <FieldStatus field={field} />

                    {field.kind === "text" && (
                      <input
                        type="text"
                        value={nodeData.contractName}
                        onChange={(event) => setContractName(event.target.value)}
                        placeholder="MyContract"
                        data-testid="contract-name-input"
                        className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-foreground focus:outline-none"
                      />
                    )}

                    {field.kind === "url" && (
                      <input
                        type="url"
                        value={nodeData.url}
                        onChange={(event) => setUrl(event.target.value)}
                        placeholder="https://example.com/data"
                        data-testid="url-input"
                        className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-foreground focus:outline-none"
                      />
                    )}

                    {field.kind === "textarea" && (
                      <textarea
                        value={nodeData.prompt}
                        onChange={(event) => setPrompt(event.target.value)}
                        placeholder="Explain what the contract should decide or return..."
                        rows={4}
                        data-testid="prompt-input"
                        className="w-full resize-none border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-foreground focus:outline-none"
                      />
                    )}

                    {field.kind === "validator-choice" && (
                      <div className="flex gap-2">
                        {VALIDATOR_OPTIONS.map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setNumValidators(value)}
                            className={`flex-1 border px-3 py-2 text-sm transition-all duration-150 ${
                              nodeData.numValidators === value
                                ? "border-foreground bg-foreground text-background"
                                : "border-border bg-background text-foreground hover:bg-surface-hover"
                            }`}
                          >
                            {value} validators
                          </button>
                        ))}
                      </div>
                    )}

                    {field.kind === "storage-name" && (
                      <input
                        type="text"
                        value={nodeData.storageName}
                        onChange={(event) => setStorageName(event.target.value)}
                        placeholder="data"
                        className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-foreground focus:outline-none"
                      />
                    )}

                    {field.kind === "storage-fields" && (
                      <div className="space-y-2">
                        {nodeData.storageFields.map((storageField) => (
                          <div key={storageField.id} className="grid gap-2 md:grid-cols-[1fr_180px_auto]">
                            <input
                              type="text"
                              value={storageField.name}
                              onChange={(event) =>
                                updateStorageField(storageField.id, {
                                  name: event.target.value.replace(/[^a-zA-Z0-9_]/g, ""),
                                })
                              }
                              placeholder="field_name"
                              className="border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-foreground focus:outline-none"
                            />
                            <select
                              value={storageField.type}
                              onChange={(event) =>
                                updateStorageField(storageField.id, {
                                  type: event.target.value,
                                })
                              }
                              className="border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none"
                            >
                              {GENVM_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeStorageField(storageField.id)}
                              aria-label={`Remove ${storageField.name || "storage field"}`}
                              className="inline-flex items-center justify-center border border-border bg-background px-3 py-2 text-foreground transition-all duration-150 hover:bg-surface-hover"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={addStorageField}
                          className="border border-border bg-background px-3 py-2 text-sm text-foreground transition-all duration-150 hover:bg-surface-hover"
                        >
                          Add saved field
                        </button>
                      </div>
                    )}

                    {field.kind === "constructor-args" && (
                      <div className="space-y-2">
                        {nodeData.constructorArgs.map((arg) => (
                          <div key={arg.id} className="grid gap-2 md:grid-cols-[1fr_180px_auto]">
                            <input
                              type="text"
                              value={arg.name}
                              onChange={(event) =>
                                updateConstructorArg(arg.id, {
                                  name: event.target.value.replace(/[^a-zA-Z0-9_]/g, ""),
                                })
                              }
                              placeholder="setup_value"
                              className="border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-foreground focus:outline-none"
                            />
                            <select
                              value={arg.type}
                              onChange={(event) =>
                                updateConstructorArg(arg.id, {
                                  type: event.target.value,
                                })
                              }
                              className="border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none"
                            >
                              {GENVM_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => removeConstructorArg(arg.id)}
                              aria-label={`Remove ${arg.name || "constructor input"}`}
                              className="inline-flex items-center justify-center border border-border bg-background px-3 py-2 text-foreground transition-all duration-150 hover:bg-surface-hover"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={addConstructorArg}
                          className="border border-border bg-background px-3 py-2 text-sm text-foreground transition-all duration-150 hover:bg-surface-hover"
                        >
                          Add launch input
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="w-full shrink-0 space-y-4 xl:w-[360px]">
          <div className="border border-border bg-background px-4 py-4">
            <IntentRefinementPanel />
          </div>

          <div className="border border-border bg-background px-4 py-4">
            <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
              Preview Check
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {builderStatus.preview.blocked
                ? "Preview still needs review"
                : "Preview reviewed for this draft"}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              {builderStatus.preview.message}
            </p>
            <button
              type="button"
              onClick={onOpenPreview}
              data-testid="guided-open-preview"
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-all duration-150 hover:bg-surface-hover"
            >
              <Eye className="h-3.5 w-3.5" />
              Open Preview
            </button>
          </div>

          <div className="border border-border bg-background px-4 py-4">
            <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
              Current Status
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">{builderStatus.summary}</p>

            {builderStatus.blockers.length > 0 && (
              <div className="mt-3 space-y-2">
                {builderStatus.blockers.map((blocker) => (
                  <div key={blocker.id} className="border border-border bg-surface px-3 py-2">
                    <p className="text-xs font-medium text-foreground">{blocker.label}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted">
                      {blocker.message}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {builderStatus.readyToExport && (
              <div className="mt-3 flex items-center gap-2 border border-foreground bg-foreground px-3 py-2 text-background">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <p className="text-[11px] leading-relaxed">
                  This draft is ready to export as Python.
                </p>
              </div>
            )}
          </div>

          <div className="border border-border bg-background px-4 py-4">
            <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
              Save And Export
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              {lastNamedSaveAt
                ? "You already have a named save. Create another milestone if you want a new checkpoint."
                : "Create a named save if you want a reusable checkpoint in this browser."}
            </p>

            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={onOpenContracts}
                data-testid="guided-open-contracts"
                className="inline-flex items-center justify-center gap-1.5 border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-all duration-150 hover:bg-surface-hover"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                {lastNamedSaveAt ? "Open My Contracts" : "Save This Draft"}
              </button>
              <button
                type="button"
                onClick={handleExport}
                data-testid="guided-export-button"
                className={`inline-flex items-center justify-center gap-1.5 border px-3 py-2 text-xs font-medium transition-all duration-150 ${
                  builderStatus.readyToExport
                    ? "border-foreground bg-foreground text-background hover:opacity-90"
                    : "border-border bg-border text-muted"
                }`}
              >
                <Download className="h-3.5 w-3.5" />
                {builderStatus.preview.blocked ? "Review Preview To Export" : "Export Python"}
              </button>
            </div>

            <p className="mt-2 text-[10px] text-muted">
              Export file: <span className="text-foreground">{makeExportFileName(nodeData.contractName)}</span>
            </p>
          </div>

          <div className="border border-border bg-background px-4 py-4">
            <div className="flex items-start gap-2">
              <Wrench className="mt-0.5 h-4 w-4 text-foreground" />
              <div>
                <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                  Advanced Tools
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  Developer tools are optional. Your guided draft stays intact if you inspect the read-only canvas or open code controls.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenAdvanced}
              data-testid="guided-open-advanced"
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-all duration-150 hover:bg-surface-hover"
            >
              <Wrench className="h-3.5 w-3.5" />
              Open Developer Tools
            </button>
            {hasUnsavedChanges && (
              <p className="mt-2 text-[10px] text-muted">
                Your latest guided answers are still autosaved while you inspect advanced tools.
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
