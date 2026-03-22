import Link from "next/link";
import {
  Blocks,
  ArrowRight,
  Layers,
  Code2,
  Globe,
  Brain,
  Database,
  Zap,
  Scale,
  Vote,
  TrendingUp,
  Shield,
  Github,
  Sparkles,
  MousePointerClick,
  FolderOpen,
  HardDrive,
  Trophy,
  Gamepad2,
  Puzzle,
  Coins,
  Link2,
  Radio,
  ListPlus,
  Map,
  Send,
  GitBranch,
  Search,
} from "lucide-react";

const TEMPLATES = [
  {
    name: "AI Arbitrator",
    description: "Fetch web data and use AI to analyze it with consensus validation.",
    icon: Scale,
    color: "bg-surface border border-border",
    tag: "AI Analysis",
  },
  {
    name: "DAO Vote",
    description: "Create decentralized proposals with AI-evaluated voting.",
    icon: Vote,
    color: "bg-surface border border-border",
    tag: "Governance",
  },
  {
    name: "Price Oracle",
    description: "Fetch real-time price data with comparative consensus.",
    icon: TrendingUp,
    color: "bg-surface border border-border",
    tag: "DeFi",
  },
  {
    name: "Content Filter",
    description: "AI-powered content moderation with event emission.",
    icon: Shield,
    color: "bg-surface border border-border",
    tag: "Moderation",
  },
  {
    name: "Simple Storage",
    description: "Basic on-chain CRUD — read and write string data.",
    icon: HardDrive,
    color: "bg-surface border border-border",
    tag: "Storage",
  },
  {
    name: "Prediction Market",
    description: "Fetch match results and resolve predictions with AI + strict consensus.",
    icon: Trophy,
    color: "bg-surface border border-border",
    tag: "DeFi",
  },
  {
    name: "AI Game",
    description: "Interactive AI game — players challenge AI, consensus decides.",
    icon: Gamepad2,
    color: "bg-surface border border-border",
    tag: "Game",
  },
  {
    name: "Custom Compose",
    description: "Start blank, drag blocks, and compose your own contract logic.",
    icon: Puzzle,
    color: "bg-surface border border-border",
    tag: "Custom",
  },
];

const FEATURES = [
  {
    icon: Layers,
    title: "Visual Builder",
    description: "Drag & drop nodes on a canvas to design your contract logic visually.",
    color: "text-foreground",
    bg: "bg-surface",
  },
  {
    icon: Code2,
    title: "Code Editor",
    description: "Switch to full code mode with syntax highlighting and GenLayer snippets.",
    color: "text-foreground",
    bg: "bg-surface",
  },
  {
    icon: MousePointerClick,
    title: "16 Node Types",
    description: "Init, Web, LLM, Storage, Payable, ContractCall, Events, DynArray, TreeMap, and more.",
    color: "text-foreground",
    bg: "bg-surface",
  },
  {
    icon: FolderOpen,
    title: "Contract Manager",
    description: "Save, load, and download your contracts. All stored locally in your browser.",
    color: "text-foreground",
    bg: "bg-surface",
  },
];

const STEPS = [
  { num: "01", title: "Pick a Template", desc: "Choose from 8 pre-built contract templates" },
  { num: "02", title: "Design Visually", desc: "Drag nodes, connect edges, fill in your data" },
  { num: "03", title: "Generate Code", desc: "Python code updates in real-time as you build" },
  { num: "04", title: "Export & Deploy", desc: "Copy or download .py file for GenLayer Studio" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-surface/80 ">
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

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 canvas-bg" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-surface-hover border border-foreground mb-6">
            <Sparkles className="w-3.5 h-3.5 text-foreground" />
            <span className="text-xs font-medium text-foreground">
              No-Code Visual Builder for GenLayer
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

          <p className="text-lg text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Drag & drop visual blocks to create AI-powered smart contracts on GenLayer.
            Real-time Python code generation. Zero backend. 100% in your browser.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/builder"
              className="flex items-center gap-2 px-8 py-3.5 rounded-none bg-foreground text-background text-base font-display font-medium hover:opacity-90 transition-all duration-150 shadow-none shadow-none"
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

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-14">
            {[
              { value: "8", label: "Templates" },
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

      {/* Features Grid */}
      <section className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h3 className="text-3xl font-bold mb-3">Everything You Need</h3>
            <p className="text-muted max-w-lg mx-auto">
              A complete toolkit for building GenLayer Intelligent Contracts — visually or with code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-5 rounded-none border border-border bg-surface/50 hover:border-foreground hover:bg-surface-hover transition-all duration-150 group"
                >
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-none ${feature.bg} mb-4`}
                  >
                    <Icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <h4 className="text-sm font-display font-medium mb-1.5">{feature.title}</h4>
                  <p className="text-xs text-muted leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section className="py-20 border-t border-border bg-surface/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h3 className="text-3xl font-bold mb-3">Ready-Made Templates</h3>
            <p className="text-muted max-w-lg mx-auto">
              Start with a pre-built template and customize it to your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATES.map((template) => {
              const Icon = template.icon;
              return (
                <div
                  key={template.name}
                  className="flex items-start gap-4 p-5 rounded-none border border-border bg-surface/50 hover:border-foreground transition-all duration-150 group"
                >
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-none ${template.color} shrink-0`}
                  >
                    <Icon className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold">{template.name}</h4>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-border/60 text-muted/80 font-mono">
                        {template.tag}
                      </span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">{template.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h3 className="text-3xl font-bold mb-3">How It Works</h3>
            <p className="text-muted max-w-lg mx-auto">
              From idea to deployable contract in 4 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative text-center">
                <div className="text-4xl font-bold text-foreground/20 mb-3 font-mono">
                  {step.num}
                </div>
                <h4 className="text-sm font-bold mb-1.5">{step.title}</h4>
                <p className="text-xs text-muted leading-relaxed">{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-6 -right-3 text-muted/20">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Node Types */}
      <section className="py-20 border-t border-border bg-surface/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h3 className="text-3xl font-bold mb-3">16 Node Types</h3>
            <p className="text-muted max-w-lg mx-auto">
              Composable node types that cover the full GenLayer API surface.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { icon: Blocks,       label: "Init",          color: "text-foreground", bg: "bg-surface" },
              { icon: Globe,        label: "Web Fetch",     color: "text-foreground",    bg: "bg-surface" },
              { icon: Brain,        label: "LLM",           color: "text-foreground",  bg: "bg-surface" },
              { icon: Database,     label: "Storage",       color: "text-foreground",  bg: "bg-surface" },
              { icon: Zap,          label: "Events",        color: "text-foreground",  bg: "bg-surface" },
              { icon: ArrowRight,   label: "Output",        color: "text-foreground",    bg: "bg-surface" },
              { icon: Coins,        label: "Payable",       color: "text-foreground",   bg: "bg-surface" },
              { icon: Link2,        label: "Contract Call", color: "text-foreground",    bg: "bg-surface" },
              { icon: Radio,        label: "Event Emit",    color: "text-foreground",    bg: "bg-surface" },
              { icon: ListPlus,     label: "DynArray",      color: "text-foreground",  bg: "bg-surface" },
              { icon: Map,          label: "TreeMap",       color: "text-foreground",  bg: "bg-surface" },
              { icon: Send,         label: "HTTP",          color: "text-foreground",     bg: "bg-surface" },
              { icon: Shield,       label: "Access Ctrl",   color: "text-foreground", bg: "bg-surface" },
              { icon: GitBranch,    label: "Consensus",     color: "text-foreground",    bg: "bg-surface" },
              { icon: Search,       label: "VecDB",         color: "text-foreground",    bg: "bg-surface" },
              { icon: Layers,       label: "EVM Bridge",    color: "text-foreground",   bg: "bg-surface" },
            ].map((node) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.label}
                  className={`flex flex-col items-center gap-2 p-4 rounded-none border border-border ${node.bg} active:scale-[0.98] transition-transform`}
                >
                  <Icon className={`w-6 h-6 ${node.color}`} />
                  <span className={`text-[10px] font-display font-medium ${node.color} text-center`}>{node.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-border">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h3 className="text-4xl font-bold mb-4">
            Ready to Build?
          </h3>
          <p className="text-muted max-w-md mx-auto mb-8">
            Jump into the visual builder and create your first GenLayer Intelligent Contract in minutes.
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-none bg-foreground text-background text-lg font-display font-medium hover:opacity-90 transition-all duration-150 shadow-none shadow-none"
          >
            Open GenFlow Builder
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Blocks className="w-4 h-4 text-foreground" />
            <span className="text-sm font-display font-medium">
              Gen<span className="text-foreground">Flow</span>
            </span>
            <span className="text-xs text-muted">· Visual Builder for GenLayer</span>
          </div>
          <p className="text-xs text-muted">
            Built for the GenLayer Ecosystem · 100% Client-Side
          </p>
        </div>
      </footer>
    </div>
  );
}
