import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  Brain,
  Code2,
  Coins,
  Database,
  FolderOpen,
  Github,
  GitBranch,
  Globe,
  Layers,
  Link2,
  ListPlus,
  Map,
  MousePointerClick,
  Radio,
  Search,
  Send,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";

import { getAllTemplates } from "@/engine/templateRegistry";
import { TEMPLATE_ICON_MAP } from "@/lib/templateIcons";

const ALL_TEMPLATES = getAllTemplates();
const FEATURED_TEMPLATES = ALL_TEMPLATES.filter((template) => template.featured);
const CORE_TEMPLATES = ALL_TEMPLATES.filter(
  (template) => !template.featured && template.id !== "custom-compose"
);
const CUSTOM_COMPOSE_TEMPLATE = ALL_TEMPLATES.find(
  (template) => template.id === "custom-compose"
);
const TEMPLATE_COUNT = ALL_TEMPLATES.length;

const FEATURES = [
  {
    icon: Layers,
    title: "Template-First Builder",
    description:
      "Start from ready-made contract flows, or switch to Custom Compose for drag-and-drop generation.",
  },
  {
    icon: Code2,
    title: "Code Editor",
    description:
      "Switch to full code mode when you need manual refinement, lint feedback, and snippet insertion.",
  },
  {
    icon: MousePointerClick,
    title: "16 Node Types",
    description:
      "Web, LLM, storage, payable, consensus, bridge, HTTP, and more for block-by-block composition.",
  },
  {
    icon: FolderOpen,
    title: "Contract Manager",
    description:
      "Save, load, and download contracts locally without needing a backend.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Pick a Starting Point",
    desc: `Choose from ${TEMPLATE_COUNT} templates or start from Custom Compose.`,
  },
  {
    num: "02",
    title: "Fill or Compose",
    desc: "Template mode uses node inputs. Custom Compose lets you drag nodes and optional edges.",
  },
  {
    num: "03",
    title: "Review Generated Python",
    desc: "Code updates from template inputs or from the active compose graph in real time.",
  },
  {
    num: "04",
    title: "Refine and Export",
    desc: "Use Code Mode for manual edits, then copy or download the final contract.",
  },
];

const NODE_TYPES = [
  { icon: Blocks, label: "Init" },
  { icon: Globe, label: "Web Fetch" },
  { icon: Brain, label: "LLM" },
  { icon: Database, label: "Storage" },
  { icon: Zap, label: "Events" },
  { icon: ArrowRight, label: "Output" },
  { icon: Coins, label: "Payable" },
  { icon: Link2, label: "Contract Call" },
  { icon: Radio, label: "Event Emit" },
  { icon: ListPlus, label: "DynArray" },
  { icon: Map, label: "TreeMap" },
  { icon: Send, label: "HTTP" },
  { icon: Shield, label: "Access Ctrl" },
  { icon: GitBranch, label: "Consensus" },
  { icon: Search, label: "VecDB" },
  { icon: Layers, label: "EVM Bridge" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border bg-surface/80">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Blocks className="w-5 h-5 text-foreground" />
            <div>
              <h1 className="text-base font-bold tracking-tight leading-none">
                Gen<span className="text-foreground">Flow</span>
              </h1>
              <p className="text-[10px] text-muted leading-none mt-0.5">
                Visual Builder for GenLayer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/learn"
              className="text-sm text-muted hover:text-foreground transition-colors duration-150"
            >
              Learn
            </Link>
            <a
              href="https://github.com/genflow-labs/genflow"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-8 h-8 rounded-none border border-border hover:border-foreground hover:bg-surface-hover transition-all duration-150"
            >
              <Github className="w-4 h-4 text-muted" />
            </a>
            <Link
              href="/builder"
              className="flex items-center gap-1.5 px-4 py-2 rounded-none bg-foreground text-background text-sm font-display font-medium hover:opacity-90 transition-all duration-150"
            >
              Open Builder
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 canvas-bg" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-surface-hover border border-foreground mb-6">
            <Sparkles className="w-3.5 h-3.5 text-foreground" />
            <span className="text-xs font-medium text-foreground">
              Template-first builder with Custom Compose
            </span>
          </div>

          <h2 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Build{" "}
            <span className="bg-foreground bg-clip-text text-transparent">
              Intelligent Contracts
            </span>
            <br />
            Without Writing Code
          </h2>

          <p className="text-lg text-muted max-w-3xl mx-auto mb-10 leading-relaxed">
            Start from rich contract templates for common use cases, or switch to Custom Compose
            when you want drag-and-drop generation block by block. Python updates in real time,
            fully in your browser.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/builder"
              className="flex items-center gap-2 px-8 py-3.5 rounded-none bg-foreground text-background text-base font-display font-medium hover:opacity-90 transition-all duration-150"
            >
              Start Building
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/learn"
              className="flex items-center gap-2 px-8 py-3.5 rounded-none border border-border text-foreground text-base font-medium hover:bg-surface-hover transition-all duration-150"
            >
              Learn More
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 mt-14">
            {[
              { value: TEMPLATE_COUNT.toString(), label: "Templates" },
              { value: "16", label: "Node Types" },
              { value: "0", label: "Lines of Code Needed" },
              { value: "$0", label: "Server Cost" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h3 className="text-3xl font-bold mb-3">Everything You Need</h3>
            <p className="text-muted max-w-xl mx-auto">
              Build fast with templates, go deeper with composition, then finish in code when needed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-5 rounded-none border border-border bg-surface/50 hover:border-foreground hover:bg-surface-hover transition-all duration-150"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-none bg-surface mb-4">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <h4 className="text-sm font-display font-medium mb-1.5">{feature.title}</h4>
                  <p className="text-xs text-muted leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border bg-surface/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h3 className="text-3xl font-bold mb-3">Featured Use-Case Templates</h3>
            <p className="text-muted max-w-xl mx-auto">
              Start from richer business flows, then adjust inputs or switch to code for the last mile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {FEATURED_TEMPLATES.map((template) => {
              const Icon = TEMPLATE_ICON_MAP[template.icon] || Blocks;
              return (
                <div
                  key={template.id}
                  className="flex h-full flex-col gap-4 p-5 rounded-none border border-border bg-surface/50 hover:border-foreground transition-all duration-150"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-none bg-surface border border-border shrink-0">
                    <Icon className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-bold">{template.name}</h4>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-border/60 text-muted/80 font-mono">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">{template.description}</p>
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {template.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-none bg-background border border-border text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {CUSTOM_COMPOSE_TEMPLATE && (
              <div className="p-5 rounded-none border border-foreground bg-foreground text-background">
                <div className="flex items-center gap-2 mb-2">
                  <MousePointerClick className="w-4 h-4" />
                  <h4 className="text-sm font-bold">{CUSTOM_COMPOSE_TEMPLATE.name}</h4>
                </div>
                <p className="text-xs text-background/80 leading-relaxed">
                  Drag nodes from the sidebar, add optional edges, and let the compose engine build
                  methods, imports, fields, guards, and helpers from the active graph.
                </p>
              </div>
            )}

            <div className="p-5 rounded-none border border-border bg-surface/50">
              <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted mb-2">
                Core Templates
              </p>
              <p className="text-xs text-muted leading-relaxed mb-3">
                The builder also includes smaller starting points for storage, moderation, voting,
                and analysis.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CORE_TEMPLATES.map((template) => (
                  <span
                    key={template.id}
                    className="text-[10px] px-2 py-0.5 rounded-none bg-background border border-border text-muted"
                  >
                    {template.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h3 className="text-3xl font-bold mb-3">How It Works</h3>
            <p className="text-muted max-w-lg mx-auto">
              Template mode and Custom Compose are different on purpose. The workflow below reflects the actual app behavior.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((step, index) => (
              <div key={step.num} className="relative text-center">
                <div className="text-4xl font-bold text-foreground/20 mb-3 font-mono">
                  {step.num}
                </div>
                <h4 className="text-sm font-bold mb-1.5">{step.title}</h4>
                <p className="text-xs text-muted leading-relaxed">{step.desc}</p>
                {index < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-6 -right-3 text-muted/20">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border bg-surface/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h3 className="text-3xl font-bold mb-3">16 Node Types</h3>
            <p className="text-muted max-w-lg mx-auto">
              These nodes are available for composition, and they become drag-and-drop building blocks in Custom Compose.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {NODE_TYPES.map((node) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.label}
                  className="flex flex-col items-center gap-2 p-4 rounded-none border border-border bg-surface transition-transform"
                >
                  <Icon className="w-6 h-6 text-foreground" />
                  <span className="text-[10px] font-display font-medium text-foreground text-center">
                    {node.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h3 className="text-4xl font-bold mb-4">Ready to Build?</h3>
          <p className="text-muted max-w-md mx-auto mb-8">
            Open the builder, choose a template or Custom Compose, and generate your first contract in minutes.
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-none bg-foreground text-background text-lg font-display font-medium hover:opacity-90 transition-all duration-150"
          >
            Open GenFlow Builder
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Blocks className="w-4 h-4 text-foreground" />
            <span className="text-sm font-display font-medium">
              Gen<span className="text-foreground">Flow</span>
            </span>
            <span className="text-xs text-muted">· Visual Builder for GenLayer</span>
          </div>
          <p className="text-xs text-muted">Template-first builder · 100% client-side</p>
        </div>
      </footer>
    </div>
  );
}
