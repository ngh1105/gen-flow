"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Copy, Check, Download, Loader2, Code2 } from "lucide-react";

import { useFlowStore } from "@/store/useFlowStore";
import { generateCode } from "@/engine/codeGenerator";
import SnippetPanel from "./SnippetPanel";
import LinterPanel from "./LinterPanel";
import { registerGenVMLinter, runLinterOnCode } from "@/engine/monacoGenVM";
import type { LintDiagnostic } from "@/engine/genvm-linter";

export default function CodeEditorMode() {
  const nodeData = useFlowStore((s) => s.nodeData);
  const activeTemplateId = useFlowStore((s) => s.activeTemplateId);
  const nodes = useFlowStore((s) => s.nodes);
  const customCode = useFlowStore((s) => s.customCode);
  const setCustomCode = useFlowStore((s) => s.setCustomCode);
  const [copied, setCopied] = useState(false);
  const [diagnostics, setDiagnostics] = useState<LintDiagnostic[]>([]);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  // Use custom code if available, else generated code
  const generatedCode = generateCode(nodeData, activeTemplateId, nodes);
  const displayCode = customCode || generatedCode;

  // Re-run linter panel diagnostics whenever displayed code changes.
  // Monaco marker squiggles are already handled by registerGenVMLinter's
  // onDidChangeModelContent listener — no additional sync needed here.
  useEffect(() => {
    setDiagnostics(runLinterOnCode(displayCode));
  }, [displayCode]);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    registerGenVMLinter(editor, monaco, setDiagnostics);
    // Initial lint
    const results = runLinterOnCode(displayCode);
    setDiagnostics(results);
  };

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(displayCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [displayCode]);

  const handleDownload = useCallback(() => {
    const contractName = nodeData.contractName.trim() || "my_contract";
    const fileName = `${contractName.toLowerCase().replace(/\s+/g, "_")}.py`;
    const blob = new Blob([displayCode], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [displayCode, nodeData.contractName]);

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
      // Also update store
      if (editor) {
        const newValue = editor.getValue();
        setCustomCode(newValue);
      }
    },
    [setCustomCode]
  );

  return (
    <div className="flex flex-1 h-full w-full">
      {/* Snippet Panel (left side) */}
      <SnippetPanel onInsert={handleInsertSnippet} />

      {/* Main editor area */}
      <div className="flex flex-col flex-1 border-border min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-foreground" />
            <span className="text-sm font-display font-medium">Code Editor</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground text-background hover:opacity-90 active:scale-[0.98] font-mono">
              editable
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCustomCode("")}
              className="px-2 py-1.5 rounded-none text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover border border-border transition-all duration-150"
              title="Reset to generated code"
            >
              Reset
            </button>
            <button
              onClick={handleDownload}
              data-testid="editor-download-button"
              className="flex items-center gap-1 px-2 py-1.5 rounded-none text-xs font-medium bg-foreground text-background hover:opacity-90 active:scale-[0.98] hover:bg-foreground border border-foreground transition-all duration-150"
              title="Download .py file"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium transition-all duration-150 ${
                copied
                  ? "bg-foreground text-background hover:opacity-90 active:scale-[0.98] copy-success"
                  : "bg-foreground text-background hover:opacity-90 active:scale-[0.98] hover:bg-foreground border border-foreground"
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

        {/* Editable Monaco */}
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
        {/* Linter Panel — active in editable editor */}
        <LinterPanel diagnostics={diagnostics} />
      </div>
    </div>
  );
}
