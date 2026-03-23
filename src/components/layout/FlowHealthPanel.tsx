"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Lightbulb } from "lucide-react";
import { useReactFlow } from "@xyflow/react";

import ConfirmationDialog from "@/components/layout/ConfirmationDialog";
import { getBuilderStatus } from "@/lib/exportRequirements";
import { addBuilderBreadcrumb, captureBuilderEvent } from "@/lib/telemetry";
import { getNodeLabel } from "@/lib/nodeCatalog";
import { useFlowStore } from "@/store/useFlowStore";

export default function FlowHealthPanel() {
  const activeTemplateId = useFlowStore((state) => state.activeTemplateId);
  const nodeData = useFlowStore((state) => state.nodeData);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const addNode = useFlowStore((state) => state.addNode);
  const switchTemplate = useFlowStore((state) => state.switchTemplate);
  const hasUnsavedChanges = useFlowStore((state) => state.hasUnsavedChanges);
  const { fitView, screenToFlowPosition } = useReactFlow();
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);
  const reportedSignatureRef = useRef<string>("");

  const builderStatus = useMemo(
    () =>
      getBuilderStatus(nodeData, nodes, {
        activeTemplateId,
        edges,
      }),
    [activeTemplateId, edges, nodeData, nodes]
  );
  const visibleIssues = useMemo(
    () => [...builderStatus.blockers, ...builderStatus.warnings].slice(0, 4),
    [builderStatus.blockers, builderStatus.warnings]
  );

  useEffect(() => {
    const issueIds = visibleIssues.map((issue) => issue.id);
    if (issueIds.length === 0) return;

    const signature = issueIds.join(",");
    if (reportedSignatureRef.current === signature) return;

    captureBuilderEvent("flow_health_issues_visible", {
      templateId: activeTemplateId,
      issueIds: signature,
      readyToExport: builderStatus.readyToExport,
    });
    reportedSignatureRef.current = signature;
  }, [activeTemplateId, builderStatus.readyToExport, visibleIssues]);

  const focusTarget = useCallback((target: string) => {
    const element = document.querySelector<HTMLElement>(
      `[data-testid="${target}"]`
    );

    if (!element) return false;

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
    window.setTimeout(() => {
      element.focus();
    }, 120);

    return true;
  }, []);

  const addRecommendedNode = useCallback(
    (nodeType: string) => {
      if (activeTemplateId !== "custom-compose") return false;

      const canvas = document.querySelector<HTMLElement>(
        '[data-testid="builder-canvas-wrapper"]'
      );
      if (!canvas) return false;

      const rect = canvas.getBoundingClientRect();
      const center = screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });

      addNode(nodeType, center);
      return true;
    },
    [activeTemplateId, addNode, screenToFlowPosition]
  );

  const executeTemplateSwitch = useCallback(
    (templateId: string) => {
      switchTemplate(templateId);
      captureBuilderEvent("template_switch_recommended_accepted", {
        templateId,
        source: "flow_health",
      });
      setPendingTemplateId(null);
      setLastActionMessage(`Switched to ${templateId}.`);
    },
    [switchTemplate]
  );

  const handleQuickAction = () => {
    const recommendation = builderStatus.nextBestStep;
    if (!recommendation) return;

    const target =
      recommendation.target ??
      recommendation.nodeType ??
      recommendation.templateId;

    addBuilderBreadcrumb("flow_health_quick_action", {
      actionType: recommendation.actionType,
      target,
    });
    captureBuilderEvent("flow_health_quick_action", {
      actionType: recommendation.actionType,
      target,
      templateId: activeTemplateId,
    });

    if (recommendation.actionType === "focus-input" && recommendation.target) {
      if (focusTarget(recommendation.target)) {
        setLastActionMessage(`Focused ${recommendation.label.toLowerCase()}.`);
      }
      return;
    }

    if (recommendation.actionType === "add-node" && recommendation.nodeType) {
      if (addRecommendedNode(recommendation.nodeType)) {
        setLastActionMessage(`Added ${getNodeLabel(recommendation.nodeType)}.`);
      }
      return;
    }

    if (recommendation.actionType === "switch-template" && recommendation.templateId) {
      if (hasUnsavedChanges) {
        setPendingTemplateId(recommendation.templateId);
        return;
      }
      executeTemplateSwitch(recommendation.templateId);
      return;
    }

    fitView({ padding: 0.25, duration: 300 });
    setLastActionMessage("Centered the current graph for review.");
  };

  return (
    <>
      <div
        data-testid="flow-health-panel"
        className="absolute right-4 top-4 z-10 w-[340px] border border-border bg-background/95 backdrop-blur-sm"
      >
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {visibleIssues.length > 0 ? (
                <AlertTriangle className="h-4 w-4 text-foreground" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-foreground" />
              )}
              <div>
                <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                  Flow Health
                </p>
                <p className="mt-1 text-xs text-foreground">{builderStatus.summary}</p>
              </div>
            </div>
            <span className="border border-border bg-surface px-2 py-0.5 text-[10px] uppercase tracking-widest text-foreground">
              {visibleIssues.length === 0 ? "Healthy" : `${visibleIssues.length} issue${visibleIssues.length > 1 ? "s" : ""}`}
            </span>
          </div>
        </div>

        {builderStatus.nextBestStep && (
          <div className="border-b border-border px-4 py-3" data-testid="flow-health-next-step">
            <div className="flex items-start gap-2">
              <Lightbulb className="mt-0.5 h-4 w-4 text-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                  Next Best Step
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {builderStatus.nextBestStep.label}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  {builderStatus.nextBestStep.description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickAction}
              data-testid="flow-health-quick-action"
              className="mt-3 inline-flex items-center gap-1.5 border border-foreground bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-all duration-150 hover:opacity-90"
            >
              {builderStatus.nextBestStep.actionType === "add-node" ? "Apply Suggestion" : "Take Step"}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="px-4 py-3">
          {visibleIssues.length === 0 ? (
            <p className="text-[11px] leading-relaxed text-muted">
              The current graph has no outstanding flow-health issues. You can keep refining the canvas or move to code/export.
            </p>
          ) : (
            <div className="space-y-2">
              {visibleIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="border border-border bg-surface px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-foreground">{issue.label}</p>
                    <span className="text-[9px] uppercase tracking-widest text-muted">
                      {issue.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">
                    {issue.message}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div aria-live="polite" className="min-h-[18px] pt-2 text-[11px] text-muted">
            {lastActionMessage}
          </div>
        </div>
      </div>

      <ConfirmationDialog
        open={pendingTemplateId !== null}
        title="Replace current draft?"
        description="Switching to the suggested preset replaces the current canvas layout. Your latest draft stays autosaved in this browser, but the visible graph will change immediately."
        confirmLabel="Switch Template"
        onClose={() => setPendingTemplateId(null)}
        onConfirm={() => {
          if (!pendingTemplateId) return;
          executeTemplateSwitch(pendingTemplateId);
        }}
      />
    </>
  );
}
