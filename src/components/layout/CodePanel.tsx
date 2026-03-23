"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Editor from "@monaco-editor/react";
import {
  Copy,
  Check,
  CheckCircle2,
  CircleDashed,
  Code2,
  Loader2,
  Download,
} from "lucide-react";

import { useFlowStore } from "@/store/useFlowStore";
import { generateCode } from "@/engine/codeGenerator";
import { registerGenVMLinter, runLinterOnCode } from "@/engine/monacoGenVM";
import type { LintDiagnostic } from "@/engine/genvm-linter";
import {
  getBuilderStatus,
} from "@/lib/exportRequirements";
import { addBuilderBreadcrumb } from "@/lib/telemetry";
import LinterPanel from "./LinterPanel";

export default function CodePanel() {
  const nodeData = useFlowStore((s) => s.nodeData);
  const activeTemplateId = useFlowStore((s) => s.activeTemplateId);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const [copied, setCopied] = useState(false);
  const [diagnostics, setDiagnostics] = useState<LintDiagnostic[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monacoRef = useRef<any>(null);

  const code = generateCode(nodeData, activeTemplateId, nodes);
  const builderStatus = useMemo(
    () =>
      getBuilderStatus(nodeData, nodes, {
        activeTemplateId,
        edges,
      }),
    [activeTemplateId, edges, nodeData, nodes]
  );
  const visibleRequirements = builderStatus.requirements.filter(
    (requirement) => requirement.required
  );
  const missingLabels = builderStatus.blockers.map((requirement) => requirement.label);
  const isComplete = builderStatus.readyToExport;
  const exportTitle = isComplete
    ? "Download .py file"
    : `Missing: ${missingLabels.join(", ")}`;

  // Re-lint whenever generated code changes (node data, template switch, etc.)
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) {
      // Editor not mounted yet - just update diagnostics state
      runLinterOnCode(code, setDiagnostics);
      return;
    }
    // Editor is mounted: push markers AND update state
    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    const diags = runLinterOnCode(code);
    setTimeout(() => {
      setDiagnostics(diags);
    }, 0);
    if (model) {
      const markers = diags.map((d) => ({
        severity:
          d.severity === "error"
            ? monaco.MarkerSeverity.Error
            : d.severity === "warning"
              ? monaco.MarkerSeverity.Warning
              : monaco.MarkerSeverity.Info,
        startLineNumber: d.line,
        startColumn: d.startCol,
        endLineNumber: d.line,
        endColumn: d.endCol,
        message: d.message,
        code: d.ruleId,
        source: "GenVM Linter",
      }));
      monaco.editor.setModelMarkers(model, "genvm-linter", markers);
    }
  }, [code]);

  const handleCopy = useCallback(() => {
    if (!isComplete) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code, isComplete]);

  const handleDownload = useCallback(() => {
    if (!isComplete) {
      addBuilderBreadcrumb("export_blocked", {
        templateId: activeTemplateId,
        blockerIds: missingLabels,
      });
      return;
    }
    const contractName = nodeData.contractName.trim() || "my_contract";
    const fileName = `${contractName.toLowerCase().replace(/\s+/g, "_")}.py`;
    const blob = new Blob([code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    addBuilderBreadcrumb("export_success", {
      templateId: activeTemplateId,
      readyToExport: true,
      blockerIds: [],
    });
  }, [activeTemplateId, code, isComplete, missingLabels, nodeData.contractName]);

  // Jump to a specific line in Monaco
  const handleJumpToLine = useCallback((line: number) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(line);
      editorRef.current.setPosition({ lineNumber: line, column: 1 });
      editorRef.current.focus();
    }
  }, []);

  // Lint severity summary for header badge
  const errorCount = diagnostics.filter((d) => d.severity === "error").length;
  const warnCount = diagnostics.filter((d) => d.severity === "warning").length;

  return (
    <div className="flex flex-col h-full border-l border-border bg-surface">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-foreground" />
          <span className="text-sm font-display font-medium">Generated Code</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground text-background hover:opacity-90 active:scale-[0.98] font-mono">
            .py
          </span>
          {diagnostics.length > 0 && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-none font-mono ${errorCount > 0 ? "bg-foreground text-background font-bold border border-foreground" : "bg-surface text-foreground"}`}>
              {errorCount > 0 ? `${errorCount} error${errorCount > 1 ? "s" : ""}` : `${warnCount} warning${warnCount > 1 ? "s" : ""}`}
            </span>
          )}
          {diagnostics.length === 0 && code.trim() && (
            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-foreground text-background hover:opacity-90 active:scale-[0.98]">
              OK
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            aria-disabled={!isComplete}
            data-testid="generated-download-button"
            className={`flex items-center gap-1 px-2 py-1.5 rounded-none text-xs font-medium transition-all duration-150 ${
              !isComplete
                ? "opacity-40 cursor-not-allowed bg-border text-muted"
                : "bg-foreground text-background hover:opacity-90 active:scale-[0.98] hover:bg-foreground border border-foreground hover:border-foreground"
            }`}
            title={exportTitle}
            aria-label={exportTitle}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            aria-disabled={!isComplete}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium transition-all duration-150
              ${
                !isComplete
                  ? "opacity-40 cursor-not-allowed bg-border text-muted"
                  : copied
                    ? "bg-foreground text-background hover:opacity-90 active:scale-[0.98] copy-success"
                  : "bg-foreground text-background hover:opacity-90 active:scale-[0.98] hover:bg-foreground border border-foreground hover:border-foreground"
              }
            `}
            title={isComplete ? "Copy to clipboard" : exportTitle}
            aria-label={isComplete ? "Copy generated code" : exportTitle}
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

      <div className="px-4 py-2 border-b border-border bg-background/60 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
              Export Checklist
            </p>
            <p className="mt-1 text-[11px] text-muted">
              Fill the required inputs for the active nodes before export.
            </p>
          </div>
          <span
            className={`px-2 py-0.5 text-[10px] font-display font-medium uppercase tracking-widest rounded-none border ${
              isComplete
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-surface text-foreground"
            }`}
          >
            {isComplete ? "Ready" : "Action Needed"}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {visibleRequirements.map((requirement) => (
            <div
              key={requirement.id}
              data-testid={`export-check-${requirement.id}`}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-none border text-[11px] ${
                requirement.done
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface text-foreground"
              }`}
            >
              {requirement.done ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <CircleDashed className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{requirement.label}</span>
              <span className={`${requirement.done ? "text-background/80" : "text-muted"}`}>
                {requirement.done ? "done" : "required"}
              </span>
            </div>
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
              Flow guidance
            </p>
            {builderStatus.warnings.slice(0, 2).map((warning) => (
              <p key={warning.id}>{warning.message}</p>
            ))}
          </div>
        )}
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 monaco-container min-h-0">
        <Editor
          height="100%"
          language="python"
          theme="vs-dark"
          value={code}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
            registerGenVMLinter(editor, monaco, setDiagnostics);
          }}
          onChange={() => {
            // Editor is read-only for generated code, but linter runs via onMount listener
          }}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 20,
            fontFamily: "var(--font-geist-mono), 'Fira Code', monospace",
            fontLigatures: true,
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: "none",
            overviewRulerLanes: 1,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
            wordWrap: "on",
            contextmenu: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full gap-2 text-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading editor...</span>
            </div>
          }
        />
      </div>

      {/* Linter Panel */}
      <LinterPanel diagnostics={diagnostics} onJumpToLine={handleJumpToLine} />
    </div>
  );
}
