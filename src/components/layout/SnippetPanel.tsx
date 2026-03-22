"use client";

import { ChevronRight, Sparkles } from "lucide-react";
import { useState } from "react";

interface SnippetPanelProps {
  onInsert: (snippet: string) => void;
}

const SNIPPET_CATEGORIES = [
  {
    name: "Imports & Setup",
    snippets: [
      {
        label: "GenLayer Import",
        code: `from genlayer import *\nimport json\n`,
      },
      {
        label: "Contract Class",
        code: `class MyContract(gl.Contract):\n    result: str\n\n    def __init__(self):\n        self.result = ""\n`,
      },
    ],
  },
  {
    name: "Decorators",
    snippets: [
      {
        label: "@gl.public.write",
        code: `    @gl.public.write\n    def my_method(self) -> str:\n        pass\n`,
      },
      {
        label: "@gl.public.view",
        code: `    @gl.public.view\n    def get_data(self) -> str:\n        return self.result\n`,
      },
    ],
  },
  {
    name: "Web Access",
    snippets: [
      {
        label: "Web Render (text)",
        code: `        web_data = gl.nondet.web.render(\n            "https://example.com",\n            mode="text"\n        )\n`,
      },
      {
        label: "Web Render (html)",
        code: `        web_data = gl.nondet.web.render(\n            "https://example.com",\n            mode="html"\n        )\n`,
      },
    ],
  },
  {
    name: "LLM / AI",
    snippets: [
      {
        label: "Exec Prompt",
        code: `        result = gl.nondet.exec_prompt(\n            "Analyze the following data and provide insights"\n        )\n`,
      },
      {
        label: "Exec Prompt (f-string)",
        code: `        result = gl.nondet.exec_prompt(\n            f"""Analyze this data:\n{data}\n\nProvide a structured response."""\n        )\n`,
      },
    ],
  },
  {
    name: "Equivalence Principle",
    snippets: [
      {
        label: "Non-Comparative",
        code: `        result = gl.eq_principle.prompt_non_comparative(\n            task,\n            task="Describe the task",\n            criteria="Results should convey equivalent meaning"\n        )\n`,
      },
      {
        label: "Comparative",
        code: `        result = gl.eq_principle.prompt_comparative(\n            task,\n            task="Describe the task",\n            tolerance=0.05\n        )\n`,
      },
      {
        label: "Strict Equality",
        code: `        result = gl.eq_principle.strict_eq(task)\n`,
      },
    ],
  },
];

export default function SnippetPanel({ onInsert }: SnippetPanelProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    "Imports & Setup"
  );

  return (
    <div className="w-[280px] shrink-0 flex flex-col h-full bg-surface border-r border-border">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
        <Sparkles className="w-3.5 h-3.5 text-foreground" />
        <span className="text-[11px] font-display font-medium text-muted uppercase tracking-widest">
          Snippets
        </span>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {SNIPPET_CATEGORIES.map((cat) => (
          <div key={cat.name}>
            {/* Category header */}
            <button
              onClick={() =>
                setExpandedCategory(
                  expandedCategory === cat.name ? null : cat.name
                )
              }
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-none text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all duration-150"
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform ${
                  expandedCategory === cat.name ? "rotate-90" : ""
                }`}
              />
              {cat.name}
            </button>

            {/* Snippets */}
            {expandedCategory === cat.name && (
              <div className="ml-2 space-y-0.5 mt-0.5">
                {cat.snippets.map((snippet) => (
                  <button
                    key={snippet.label}
                    onClick={() => onInsert(snippet.code)}
                    className="w-full text-left px-2.5 py-1.5 rounded-none text-[11px] font-mono text-foreground/70 hover:bg-foreground hover:text-foreground border border-transparent hover:border-foreground transition-all duration-150"
                    title={`Insert: ${snippet.label}`}
                  >
                    {snippet.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border">
        <p className="text-[9px] text-muted/50 text-center">
          Click to insert at cursor
        </p>
      </div>
    </div>
  );
}
