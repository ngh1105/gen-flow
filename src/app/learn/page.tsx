import Link from "next/link";
import {
  Blocks,
  ArrowLeft,
  Globe,
  Brain,
  Database,
  Zap,
  Shield,
  BookOpen,
  Code2,
  Cpu,
  Network,
} from "lucide-react";

const CONCEPTS = [
  {
    icon: Brain,
    title: "Intelligent Contracts",
    description:
      "Unlike traditional smart contracts, GenLayer's Intelligent Contracts can interact with AI (LLMs) and access real-time web data. They run on the GenVM — a virtual machine designed to handle non-deterministic operations through consensus.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Globe,
    title: "Web Data Access",
    description:
      "Use gl.nondet.web.render(url) to fetch live data from any website directly inside your contract. This enables price feeds, news analysis, social media monitoring and more — all verified through consensus.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    code: `web_data = gl.nondet.web.render(\n    "https://example.com",\n    mode="text"\n)`,
  },
  {
    icon: Cpu,
    title: "LLM Integration",
    description:
      "Call AI models directly from your contract using gl.nondet.exec_prompt(). The AI's response is validated through the Equivalence Principle to ensure consensus across validators.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    code: `result = gl.nondet.exec_prompt(\n    "Analyze this data and summarize"\n)`,
  },
  {
    icon: Shield,
    title: "Equivalence Principle",
    description:
      "Since AI and web data are non-deterministic (different each time), GenLayer uses the Equivalence Principle to reach consensus. Validators compare results and agree if they are 'equivalent enough'.",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    code: `# Non-comparative: results should mean the same\ngl.eq_principle.prompt_non_comparative(\n    task, task="...", criteria="..."\n)\n\n# Comparative: numeric values within tolerance\ngl.eq_principle.prompt_comparative(\n    task, task="...", tolerance=0.05\n)`,
  },
  {
    icon: Database,
    title: "Contract Storage",
    description:
      "State variables are declared as class attributes with types. Use @gl.public.write for methods that change state, and @gl.public.view for read-only methods.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    code: `class MyContract(gl.Contract):\n    result: str\n    count: int\n\n    @gl.public.write\n    def update(self, data: str):\n        self.result = data\n        self.count += 1\n\n    @gl.public.view\n    def get_result(self) -> str:\n        return self.result`,
  },
  {
    icon: Network,
    title: "Consensus & Validators",
    description:
      "When a write method is called, multiple validator nodes execute the contract independently. They compare results using the Equivalence Principle and reach consensus before committing to the blockchain.",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
  },
];

const API_REFERENCE = [
  { api: "from genlayer import *", desc: "Import GenLayer SDK" },
  { api: "gl.Contract", desc: "Base class for contracts" },
  { api: "@gl.public.write", desc: "State-changing method decorator" },
  { api: "@gl.public.view", desc: "Read-only method decorator" },
  { api: "gl.nondet.web.render(url, mode)", desc: "Fetch web page content" },
  { api: "gl.nondet.exec_prompt(prompt)", desc: "Call LLM with prompt" },
  { api: "gl.eq_principle.prompt_non_comparative()", desc: "Consensus (meaning-based)" },
  { api: "gl.eq_principle.prompt_comparative()", desc: "Consensus (numeric tolerance)" },
  { api: "gl.eq_principle.strict_eq()", desc: "Consensus (exact match)" },
];

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-accent-purple to-accent-blue">
              <Blocks className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-bold">
              Gen<span className="text-accent-purple">Flow</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Home
            </Link>
            <Link
              href="/builder"
              className="px-4 py-2 rounded-lg bg-accent-purple/15 text-accent-purple text-sm font-medium hover:bg-accent-purple/25 transition-all"
            >
              Open Builder
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-accent-purple" />
          <span className="text-sm font-semibold text-accent-purple uppercase tracking-wider">
            Quick Learn
          </span>
        </div>
        <h2 className="text-4xl font-bold mb-4">GenLayer Concepts</h2>
        <p className="text-muted text-lg max-w-2xl leading-relaxed">
          Everything you need to understand to build Intelligent Contracts with GenFlow.
          These concepts map directly to the visual nodes in the builder.
        </p>
      </div>

      {/* Concepts */}
      <div className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        {CONCEPTS.map((concept) => {
          const Icon = concept.icon;
          return (
            <div
              key={concept.title}
              className="p-6 rounded-xl border border-border bg-surface/50 hover:border-accent-purple/15 transition-all"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-lg ${concept.bg} shrink-0 mt-0.5`}
                >
                  <Icon className={`w-5 h-5 ${concept.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-bold mb-2 ${concept.color}`}>
                    {concept.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed mb-3">
                    {concept.description}
                  </p>
                  {concept.code && (
                    <div className="bg-background/80 border border-border rounded-lg p-4 overflow-x-auto">
                      <pre className="text-xs font-mono text-foreground/80 whitespace-pre">
                        {concept.code}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* API Reference */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="flex items-center gap-2 mb-6">
          <Code2 className="w-5 h-5 text-accent-blue" />
          <h3 className="text-2xl font-bold">API Quick Reference</h3>
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface/80">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wider">
                  API
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {API_REFERENCE.map((item, i) => (
                <tr
                  key={item.api}
                  className={`border-b border-border/50 ${i % 2 === 0 ? "bg-surface/30" : ""}`}
                >
                  <td className="px-4 py-2.5">
                    <code className="text-xs font-mono text-accent-purple bg-accent-purple/5 px-1.5 py-0.5 rounded">
                      {item.api}
                    </code>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-muted">{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6 pb-20 text-center">
        <p className="text-muted mb-4">Ready to put this knowledge into practice?</p>
        <Link
          href="/builder"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-accent-purple/20"
        >
          Open GenFlow Builder
          <Zap className="w-4 h-4" />
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Blocks className="w-4 h-4 text-accent-purple" />
            <span className="text-sm font-semibold">
              Gen<span className="text-accent-purple">Flow</span>
            </span>
          </div>
          <p className="text-xs text-muted">Built for the GenLayer Ecosystem</p>
        </div>
      </footer>
    </div>
  );
}
