"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import {
  AlertTriangle,
  Check,
  Code2,
  Copy,
  Download,
  Loader2,
  Sparkles,
} from "lucide-react";

import { generateCode } from "@/engine/codeGenerator";
import type { LintDiagnostic } from "@/engine/genvm-linter";
import { registerGenVMLinter, runLinterOnCode } from "@/engine/monacoGenVM";
import { resolveBuilderCode } from "@/lib/builderCode";
import { getBuilderStatus } from "@/lib/exportRequirements";
import { getNodeLabel } from "@/lib/nodeCatalog";
import { useFlowStore } from "@/store/useFlowStore";
import LinterPanel from "./LinterPanel";
import SnippetPanel from "./SnippetPanel";

export default function CodeEditorMode() {
  const nodeData = useFlowStore((s) => s.nodeData);
  const activeTemplateId = useFlowStore((s) => s.activeTemplateId);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const customCode = useFlowStore((s) => s.customCode);
  const hasReviewedPreviewForCurrentDraft = useFlowStore(
    (s) => s.hasReviewedPreviewForCurrentDraft
  );
  const setCustomCode = useFlowStore((s) => s.setCustomCode);
  const [copied, setCopied] = useState(false);
  const [diagnostics, setDiagnostics] = useState<LintDiagnostic[]>([]);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const generatedCode = generateCode(nodeData, activeTemplateId, nodes);
  const displayCode = resolveBuilderCode(generatedCode, customCode);
  const hasManualEdits = customCode.trim().length > 0;
  const hasDivergedFromGenerated =
    hasManualEdits && customCode.trim() !== generatedCode.trim();
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
  const activeNodeLabels = useMemo(
    () =>
      Array.from(
        new Set(nodes.map((node) => getNodeLabel(node.type ?? "unknown")))
      ).sort(
        (first, second) => first.localeCompare(second)
      ),
    [nodes]
  );

  useEffect(() => {
    setDiagnostics(runLinterOnCode(displayCode));
  }, [displayCode]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    registerGenVMLinter(editor, monaco, setDiagnostics);
    setDiagnostics(runLinterOnCode(displayCode));
  };

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(displayCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [displayCode]);

  const handleDownload = useCallback(() => {
    if (!builderStatus.readyToExport) {
      return;
    }

    const contractName = nodeData.contractName.trim() || "my_contract";
    const fileName = `${contractName.toLowerCase().replace(/\s+/g, "_")}.py`;
    const blob = new Blob([displayCode], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [builderStatus.readyToExport, displayCode, nodeData.contractName]);

  const handleInsertSnippet = useCallback(
    (snippet: string) => {
      const editor = editorRef.current;
      if (editor) {
        const position = editor.getPosition();
        if (position) {
          editor.executeEdits("snippet-insert", [
            {
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              },
              text: snippet,
            },
          ]);
          editor.focus();
        }
      }

      if (editor) {
        setCustomCode(editor.getValue());
      }
    },
    [setCustomCode]
  );

  return (
    <div className="flex flex-1 h-full w-full">
      <SnippetPanel
        onInsert={handleInsertSnippet}
        activeNodeTypes={nodes.map((node) => node.type ?? "unknown")}
        recommendedNodeTypes={builderStatus.health.recommendedNodeTypes}
        issueTitles={builderStatus.warnings.map((warning) => warning.label)}
      />

      <div className="flex flex-col flex-1 border-border min-w-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-foreground" />
            <span className="text-sm font-display font-medium">Code Editor</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground text-background font-mono">
              editable
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCustomCode("")}
              aria-label="Reset editor to generated code"
              className="px-2 py-1.5 rounded-none text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover border border-border transition-all duration-150"
              title="Reset to generated code"
            >
              Reset
            </button>
            <button
              onClick={handleDownload}
              data-testid="editor-download-button"
              aria-disabled={!builderStatus.readyToExport}
              aria-label={
                builderStatus.readyToExport
                  ? "Download current editor code"
                  : builderStatus.preview.blocked
                    ? "Open Preview for this draft before exporting"
                    : "Resolve builder blockers before exporting"
              }
              className={`flex items-center gap-1 px-2 py-1.5 rounded-none text-xs font-medium border transition-all duration-150 ${
                builderStatus.readyToExport
                  ? "bg-foreground text-background hover:opacity-90 active:scale-[0.98] border-foreground"
                  : "cursor-not-allowed border-border bg-border text-muted opacity-40"
              }`}
              title={
                builderStatus.readyToExport
                  ? "Download .py file"
                  : builderStatus.preview.blocked
                    ? "Open Preview for this draft before exporting"
                    : "Resolve builder blockers before exporting"
              }
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCopy}
              aria-label="Copy current editor code"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium transition-all duration-150 ${
                copied
                  ? "bg-foreground text-background hover:opacity-90 active:scale-[0.98] copy-success"
                  : "bg-foreground text-background hover:opacity-90 active:scale-[0.98] border border-foreground"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div
          data-testid="code-mode-preflight"
          className="border-b border-border bg-background/70 px-4 py-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
                Builder Preflight
              </p>
              <p className="mt-1 text-xs text-foreground">
                {builderStatus.summary}
              </p>
            </div>
            <span className="border border-border bg-surface px-2 py-0.5 text-[10px] uppercase tracking-widest text-foreground">
              {builderStatus.readyToExport ? "Ready" : "Blocked"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {builderStatus.requirements
              .filter((requirement) => requirement.required)
              .map((requirement) => (
                <span
                  key={requirement.id}
                  className={`border px-2 py-1 text-[11px] ${
                    requirement.done
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-surface text-foreground"
                  }`}
                >
                  {requirement.label}: {requirement.done ? "done" : "required"}
                </span>
              ))}
          </div>

          {builderStatus.blockers.length > 0 && (
            <div className="mt-3 space-y-1 border border-border bg-surface px-3 py-2 text-[11px] text-muted">
              {builderStatus.blockers.map((blocker) => (
                <p key={blocker.id}>{blocker.message}</p>
              ))}
            </div>
          )}

          {builderStatus.warnings.length > 0 && (
            <div className="mt-3 space-y-1 border border-border bg-background px-3 py-2 text-[11px] text-muted">
              <p className="font-display text-[10px] uppercase tracking-widest text-foreground">
                Graph health
              </p>
              {builderStatus.warnings.slice(0, 3).map((warning) => (
                <p key={warning.id}>{warning.message}</p>
              ))}
            </div>
          )}

          {hasDivergedFromGenerated && (
            <div
              data-testid="code-mode-divergence-warning"
              className="mt-3 flex items-start gap-2 border border-border bg-surface px-3 py-2"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 text-foreground" />
              <div>
                <p className="text-[11px] font-medium text-foreground">
                  Manual edits have diverged from the current graph output.
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  Visual changes still update the generated base code, but this editor is currently showing your override until you press Reset.
                </p>
              </div>
            </div>
          )}

          <div className="mt-3">
            <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
              Graph decisions in this code
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {activeNodeLabels.map((label) => (
                <span
                  key={label}
                  className="border border-border bg-surface px-2 py-1 text-[11px] text-foreground"
                >
                  {label}
                </span>
              ))}
            </div>
            {builderStatus.nextBestStep && (
              <p className="mt-2 text-[11px] text-muted">
                Next best step:{" "}
                <span className="text-foreground">{builderStatus.nextBestStep.label}</span>
              </p>
            )}
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted">
              <Sparkles className="h-3.5 w-3.5 text-foreground" />
              Snippet suggestions now follow the active graph and health issues.
            </p>
          </div>
        </div>

        <div className="flex-1 monaco-container">
          <Editor
            height="100%"
            language="python"
            theme="vs-dark"
            value={displayCode}
            onChange={(value) => setCustomCode(value || "")}
            onMount={handleEditorMount}
            options={{
              readOnly: false,
              minimap: { enabled: false },
              fontSize: 14,
              lineHeight: 22,
              fontFamily: "var(--font-geist-mono), 'Fira Code', monospace",
              fontLigatures: true,
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
              renderLineHighlight: "gutter",
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              overviewRulerBorder: false,
              scrollbar: {
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6,
              },
              wordWrap: "on",
              tabSize: 4,
              insertSpaces: true,
              autoIndent: "full",
              formatOnPaste: true,
            }}
            loading={
              <div className="flex items-center justify-center h-full gap-2 text-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading editor...</span>
              </div>
            }
          />
        </div>

        <LinterPanel diagnostics={diagnostics} />
      </div>
    </div>
  );
}
