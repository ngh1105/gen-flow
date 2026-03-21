"use client";

import { useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Copy, Check, Download, Loader2, Code2 } from "lucide-react";
import { useState, useCallback } from "react";

import { useFlowStore } from "@/store/useFlowStore";
import { generateCode } from "@/engine/codeGenerator";
import SnippetPanel from "./SnippetPanel";

export default function CodeEditorMode() {
  const nodeData = useFlowStore((s) => s.nodeData);
  const activeTemplateId = useFlowStore((s) => s.activeTemplateId);
  const nodes = useFlowStore((s) => s.nodes);
  const customCode = useFlowStore((s) => s.customCode);
  const setCustomCode = useFlowStore((s) => s.setCustomCode);
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  // Use custom code if available, else generated code
  const generatedCode = generateCode(nodeData, activeTemplateId, nodes);
  const displayCode = customCode || generatedCode;

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
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
    <div className="flex h-full">
      {/* Main editor area */}
      <div className="flex flex-col flex-1 border-r border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-accent-purple" />
            <span className="text-sm font-semibold">Code Editor</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-green/10 text-accent-green font-mono">
              editable
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCustomCode("")}
              className="px-2 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover border border-border transition-all"
              title="Reset to generated code"
            >
              Reset
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-accent-green/15 text-accent-green hover:bg-accent-green/25 border border-accent-green/25 transition-all"
              title="Download .py file"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                copied
                  ? "bg-accent-green/20 text-accent-green copy-success"
                  : "bg-accent-purple/15 text-accent-purple hover:bg-accent-purple/25 border border-accent-purple/25"
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
      </div>

      {/* Snippet Panel (right side) */}
      <SnippetPanel onInsert={handleInsertSnippet} />
    </div>
  );
}
