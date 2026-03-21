"use client";

import { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { Copy, Check, Code2, Loader2, Download } from "lucide-react";

import { useFlowStore } from "@/store/useFlowStore";
import { generateCode } from "@/engine/codeGenerator";

export default function CodePanel() {
  const nodeData = useFlowStore((s) => s.nodeData);
  const activeTemplateId = useFlowStore((s) => s.activeTemplateId);
  const nodes = useFlowStore((s) => s.nodes);
  const [copied, setCopied] = useState(false);

  const code = generateCode(nodeData, activeTemplateId, nodes);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const handleDownload = useCallback(() => {
    const contractName = nodeData.contractName.trim() || "my_contract";
    const fileName = `${contractName.toLowerCase().replace(/\s+/g, "_")}.py`;
    const blob = new Blob([code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [code, nodeData.contractName]);

  // Validate based on ACTIVE NODE TYPES on the canvas, not generated code content.
  // This avoids false-blocking templates that internally use exec_prompt/nondet.web
  // (e.g. Price Oracle) as those don't have corresponding user-facing input fields.
  const activeNodeTypes = new Set(nodes.map((n) => n.type));
  const needsUrl = activeNodeTypes.has("webFetchNode");
  // httpNode: URL is hardcoded in code gen, not user-inputtable — don't block export
  const needsPrompt = activeNodeTypes.has("llmPromptNode");
  const isComplete =
    nodeData.contractName.trim() !== "" &&
    (!needsUrl || nodeData.url.trim() !== "") &&
    (!needsPrompt || nodeData.prompt.trim() !== "");

  return (
    <div className="flex flex-col h-full border-l border-border bg-surface">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-accent-purple" />
          <span className="text-sm font-semibold">Generated Code</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-purple/10 text-accent-purple font-mono">
            .py
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={!isComplete}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !isComplete
                ? "opacity-40 cursor-not-allowed bg-border text-muted"
                : "bg-accent-green/15 text-accent-green hover:bg-accent-green/25 border border-accent-green/25 hover:border-accent-green/40"
            }`}
            title={!isComplete ? "Fill all fields" : "Download .py file"}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          {/* Copy Button */}
          <button
            onClick={handleCopy}
            disabled={!isComplete}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${
                !isComplete
                  ? "opacity-40 cursor-not-allowed bg-border text-muted"
                  : copied
                    ? "bg-accent-green/20 text-accent-green copy-success"
                    : "bg-accent-purple/15 text-accent-purple hover:bg-accent-purple/25 border border-accent-purple/25 hover:border-accent-purple/40"
              }
            `}
            title={!isComplete ? "Fill all fields to enable copy" : "Copy to clipboard"}
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

      {/* Monaco Editor */}
      <div className="flex-1 monaco-container">
        <Editor
          height="100%"
          language="python"
          theme="vs-dark"
          value={code}
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
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            scrollbar: {
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
            wordWrap: "on",
            contextmenu: false,
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
  );
}
