"use client";

import { ChevronRight, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

interface SnippetPanelProps {
  onInsert: (snippet: string) => void;
  activeNodeTypes?: string[];
  recommendedNodeTypes?: string[];
  issueTitles?: string[];
}

interface SnippetCategory {
  name: string;
  snippets: Array<{
    label: string;
    code: string;
  }>;
}

const BASE_SNIPPET_CATEGORIES: SnippetCategory[] = [
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

function getContextualCategory(
  activeNodeTypes: string[],
  recommendedNodeTypes: string[]
): SnippetCategory | null {
  const active = new Set(activeNodeTypes);
  const recommended = new Set(recommendedNodeTypes);
  const snippets: SnippetCategory["snippets"] = [];

  if (active.has("webFetchNode") || active.has("httpNode")) {
    snippets.push({
      label: "Fetch + Parse",
      code: `        source_text = gl.nondet.web.render(\n            "https://example.com/feed",\n            mode="text"\n        )\n        payload = json.loads(source_text)\n`,
    });
  }

  if (active.has("llmPromptNode") || recommended.has("llmPromptNode")) {
    snippets.push({
      label: "Structured AI Task",
      code: `        result = gl.nondet.exec_prompt(\n            f"""Review the evidence below and respond with only valid JSON.\n\nEvidence:\n{evidence}\n"""\n        )\n`,
    });
  }

  if (active.has("consensusNode") || recommended.has("consensusNode")) {
    snippets.push({
      label: "Consensus Wrapper",
      code: `        agreed_result = gl.eq_principle.prompt_non_comparative(\n            task,\n            task="Describe the validator task",\n            criteria="Results should preserve the same meaning"\n        )\n`,
    });
  }

  if (active.has("accessControlNode") || recommended.has("accessControlNode")) {
    snippets.push({
      label: "Owner Guard",
      code: `    def _only_owner(self):\n        if gl.message.sender_address != self.owner:\n            raise gl.vm.UserError("Only owner allowed")\n`,
    });
  }

  if (snippets.length === 0) return null;

  return {
    name: "Contextual",
    snippets,
  };
}

export default function SnippetPanel({
  onInsert,
  activeNodeTypes = [],
  recommendedNodeTypes = [],
  issueTitles = [],
}: SnippetPanelProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    "Contextual"
  );
  const contextualCategory = useMemo(
    () => getContextualCategory(activeNodeTypes, recommendedNodeTypes),
    [activeNodeTypes, recommendedNodeTypes]
  );
  const categories = useMemo(
    () =>
      contextualCategory
        ? [contextualCategory, ...BASE_SNIPPET_CATEGORIES]
        : BASE_SNIPPET_CATEGORIES,
    [contextualCategory]
  );

  return (
    <div className="w-[300px] shrink-0 flex flex-col h-full bg-surface border-r border-border">
      <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
        <Sparkles className="w-3.5 h-3.5 text-foreground" />
        <span className="text-[11px] font-display font-medium text-muted uppercase tracking-widest">
          Snippets
        </span>
      </div>

      <div className="border-b border-border px-3 py-2 bg-background/70">
        <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
          Context
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          {issueTitles.length > 0
            ? `Suggestions follow the active flow and current issues, starting with ${issueTitles[0].toLowerCase()}.`
            : "Suggestions follow the active flow even when you override generated code manually."}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {categories.map((category) => (
          <div key={category.name}>
            <button
              onClick={() =>
                setExpandedCategory(
                  expandedCategory === category.name ? null : category.name
                )
              }
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-none text-xs font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-all duration-150"
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform ${
                  expandedCategory === category.name ? "rotate-90" : ""
                }`}
              />
              {category.name}
            </button>

            {expandedCategory === category.name && (
              <div className="ml-2 space-y-0.5 mt-0.5">
                {category.snippets.map((snippet) => (
                  <button
                    key={snippet.label}
                    onClick={() => onInsert(snippet.code)}
                    className="w-full text-left px-2.5 py-1.5 rounded-none text-[11px] font-mono text-foreground/70 hover:bg-foreground hover:text-background border border-transparent hover:border-foreground transition-all duration-150"
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

      <div className="px-3 py-2 border-t border-border">
        <p className="text-[9px] text-muted/50 text-center">
          Click to insert at cursor
        </p>
      </div>
    </div>
  );
}
