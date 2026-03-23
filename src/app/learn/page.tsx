import Link from "next/link";
import {
  Blocks,
  ArrowLeft,
  BookOpen,
  Layers,
  Puzzle,
  Code2,
  MousePointerClick,
  GitBranch,
  Database,
  Globe,
  Brain,
  Download,
  FlaskConical,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const MODES = [
  {
    icon: Layers,
    title: "Template Mode",
    description:
      "Choose a ready-made contract such as AI Arbitrator or Simple Storage. The generated Python comes from the template plus the inputs you fill in the nodes.",
    details:
      "Template layouts are locked so you can inspect the flow without accidentally thinking layout edits change logic.",
  },
  {
    icon: Puzzle,
    title: "Custom Compose",
    description:
      "This is the mode where drag-and-drop changes the generated code. Every node you add enables a capability in the compose engine.",
    details:
      "Adding or removing node types updates imports, fields, methods, guards, and helper functions in the Python output.",
  },
  {
    icon: Code2,
    title: "Code Mode",
    description:
      "Switch from visual to editable Monaco when you want to refine or extend the generated contract manually.",
    details:
      "Once you edit code directly, that custom code becomes the active source until you press Reset.",
  },
];

const DRAG_FLOW = [
  {
    step: "01",
    title: "Pick the right mode first",
    body: "Use a prebuilt template when you want a fixed contract skeleton. Use Custom Compose when you want the sidebar cards to add new features to the contract.",
    icon: Layers,
  },
  {
    step: "02",
    title: "Drag a card or click Add",
    body: "In Custom Compose, dragging a card onto the canvas or clicking Add creates a new node in the global store with its own id, type, and position.",
    icon: MousePointerClick,
  },
  {
    step: "03",
    title: "Connect cards to explain the flow",
    body: "Connections help you organize and read the contract flow. Today, connections are visual structure; feature generation is driven by which node types exist on the canvas.",
    icon: GitBranch,
  },
  {
    step: "04",
    title: "Fill the node inputs",
    body: "Fields such as contract name, URL, prompt, storage fields, and constructor args update the data model that code generation consumes.",
    icon: Database,
  },
  {
    step: "05",
    title: "Review, refine, and export",
    body: "The code panel updates in real time. Use the export checklist to see what is still missing, then switch to Code Mode only for manual adjustments.",
    icon: Download,
  },
];

const SYNC_RULES = [
  {
    action: "Move a node on the canvas",
    effect: "In Custom Compose this only changes layout. Template Mode keeps layout locked.",
  },
  {
    action: "Add a node in Custom Compose",
    effect: "Changes generated code by enabling that capability in composeCode().",
  },
  {
    action: "Add a connection in Custom Compose",
    effect: "Saves visual flow. Current generator does not derive method order from edges yet.",
  },
  {
    action: "Fill Init / URL / Prompt inputs",
    effect: "Immediately updates placeholders or composed code output.",
  },
  {
    action: "Edit code in Code Mode",
    effect: "Custom code overrides generated code until Reset is pressed.",
  },
  {
    action: "Switch template",
    effect: "Resets the canvas to that template's default graph and clears custom code.",
  },
];

const COMBINATIONS = [
  {
    title: "Web Fetch + LLM Prompt + Output",
    result:
      "Generate a contract that fetches external data, runs AI analysis, and returns the result through a public method.",
    icon: Globe,
  },
  {
    title: "Payable + Access Control",
    result:
      "Add token receiving logic plus owner-only protection for state-changing methods.",
    icon: ShieldCheck,
  },
  {
    title: "Storage + DynArray or TreeMap",
    result:
      "Persist values on-chain and expose list/map style read methods in the generated Python.",
    icon: Database,
  },
  {
    title: "Web Fetch + LLM + Consensus",
    result:
      "Wrap non-deterministic actions with GenLayer consensus helpers and keep the result in contract state.",
    icon: Brain,
  },
];

const QUICK_REFERENCE = [
  {
    label: "Prebuilt template",
    value: "Fixed code skeleton + node inputs",
  },
  {
    label: "Custom Compose",
    value: "Node presence changes generated code",
  },
  {
    label: "Edges",
    value: "Visual flow, not code ordering",
  },
  {
    label: "Code Mode",
    value: "Manual override until Reset",
  },
  {
    label: "Export gate",
    value: "Uses a checklist: contract name plus any active prompt or URL inputs",
  },
];

const INTELLIGENCE_FEATURES = [
  {
    title: "Flow Health",
    body: "GenFlow now evaluates the active graph for weak combinations, disconnected logic, and missing next steps. The canvas, sidebar, and code panels read from the same shared guidance model.",
    icon: Sparkles,
  },
  {
    title: "Project JSON",
    body: "Export a versioned GenFlow project document when you want to move the current builder state between sessions or machines without relying on browser localStorage alone.",
    icon: Download,
  },
  {
    title: "Behavior Preview",
    body: "Open Preview to inspect mocked inputs, execution steps, methods, and dependencies before export. It is a planning aid, not runtime validation.",
    icon: FlaskConical,
  },
];

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border bg-surface/80">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-none bg-foreground">
              <Blocks className="w-5 h-5 text-background" />
            </div>
            <span className="text-base font-bold">
              Gen<span className="text-foreground">Flow</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors duration-150"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Home
            </Link>
            <Link
              href="/builder"
              className="px-4 py-2 rounded-none bg-surface-hover text-foreground text-sm font-medium hover:bg-surface-hover transition-all duration-150"
            >
              Open Builder
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-foreground" />
          <span className="text-sm font-display font-medium text-foreground uppercase tracking-widest">
            Builder Guide
          </span>
        </div>
        <h1 className="text-4xl font-bold mb-4">How drag, nodes, and code work together</h1>
        <p className="text-muted text-lg max-w-3xl leading-relaxed">
          GenFlow has two different visual behaviors: prebuilt templates and Custom Compose.
          Understanding that split is the key to using drag-and-drop correctly and knowing
          when the Python output will actually change.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.title}
                className="border border-border bg-surface/50 p-5 rounded-none"
              >
                <div className="w-10 h-10 flex items-center justify-center bg-surface border border-border mb-4">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <h2 className="text-lg font-bold mb-2">{mode.title}</h2>
                <p className="text-sm text-muted leading-relaxed mb-3">{mode.description}</p>
                <p className="text-xs text-foreground/75 leading-relaxed">{mode.details}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="flex items-center gap-2 mb-6">
          <MousePointerClick className="w-5 h-5 text-foreground" />
          <h2 className="text-2xl font-bold">Drag and combine flow</h2>
        </div>
        <div className="space-y-4">
          {DRAG_FLOW.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="border border-border bg-surface/40 p-5 rounded-none flex items-start gap-4"
              >
                <div className="w-12 h-12 flex items-center justify-center border border-border bg-surface shrink-0">
                  <span className="text-xs font-mono text-foreground">{item.step}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-foreground" />
                    <h3 className="text-base font-bold">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{item.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="flex items-center gap-2 mb-6">
          <Code2 className="w-5 h-5 text-foreground" />
          <h2 className="text-2xl font-bold">What actually changes code</h2>
        </div>
        <div className="border border-border overflow-hidden rounded-none">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface/80">
                <th className="text-left px-4 py-3 text-xs font-display font-medium text-muted uppercase tracking-widest">
                  Action
                </th>
                <th className="text-left px-4 py-3 text-xs font-display font-medium text-muted uppercase tracking-widest">
                  Effect
                </th>
              </tr>
            </thead>
            <tbody>
              {SYNC_RULES.map((rule, index) => (
                <tr
                  key={rule.action}
                  className={index % 2 === 0 ? "bg-surface/30" : "bg-background"}
                >
                  <td className="px-4 py-3 text-sm font-medium">{rule.action}</td>
                  <td className="px-4 py-3 text-sm text-muted">{rule.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="border border-border bg-surface/40 p-6 rounded-none">
            <h2 className="text-2xl font-bold mb-4">Recommended working pattern</h2>
            <div className="space-y-3 text-sm text-muted leading-relaxed">
              <p>
                If you want speed, start with a prebuilt template. Fill the node inputs, read the
                generated code, and only switch to Code Mode when the template gets you 80-90% of
                the way there.
              </p>
              <p>
                If you want composition freedom, start directly in Custom Compose. Add only the
                capabilities you need, then use Code Mode for the last-mile edits that are too
                specific for the visual generator.
              </p>
              <p>
                After manual edits, remember that the editor is now using custom code. If you want
                to go back to visual output, press <strong className="text-foreground">Reset</strong> in
                Code Mode.
              </p>
              <div className="border border-border bg-background p-4 rounded-none">
                <div className="flex items-center gap-2 mb-2">
                  <RotateCcw className="w-4 h-4 text-foreground" />
                  <span className="text-sm font-bold text-foreground">Important reset rule</span>
                </div>
                <p className="text-sm text-muted">
                  Visual generation and manual editing are intentionally separate. Generated code is
                  the base layer. Custom code is the override layer.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border border-border bg-surface/40 p-5 rounded-none">
              <h2 className="text-xl font-bold mb-4">Quick reference</h2>
              <div className="space-y-3">
                {QUICK_REFERENCE.map((item) => (
                  <div key={item.label}>
                    <p className="text-xs uppercase tracking-widest text-muted font-display font-medium">
                      {item.label}
                    </p>
                    <p className="text-sm text-foreground/85 mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="flex items-center gap-2 mb-6">
          <Puzzle className="w-5 h-5 text-foreground" />
          <h2 className="text-2xl font-bold">Good node combinations</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMBINATIONS.map((combo) => {
            const Icon = combo.icon;
            return (
              <div
                key={combo.title}
                className="border border-border bg-surface/40 p-5 rounded-none"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-foreground" />
                  <h3 className="text-base font-bold">{combo.title}</h3>
                </div>
                <p className="text-sm text-muted leading-relaxed">{combo.result}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-foreground" />
          <h2 className="text-2xl font-bold">Builder intelligence features</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INTELLIGENCE_FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="border border-border bg-surface/40 p-5 rounded-none"
              >
                <div className="w-10 h-10 flex items-center justify-center bg-surface border border-border mb-4">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{item.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-20 text-center">
        <p className="text-muted mb-4">
          Use prebuilt templates for speed and Custom Compose for feature-by-feature assembly.
        </p>
        <Link
          href="/builder"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-none bg-foreground text-background font-display font-medium hover:opacity-90 transition-all duration-150"
        >
          Open GenFlow Builder
          <MousePointerClick className="w-4 h-4" />
        </Link>
      </div>

      <footer className="border-t border-border py-6">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Blocks className="w-4 h-4 text-foreground" />
            <span className="text-sm font-display font-medium">
              Gen<span className="text-foreground">Flow</span>
            </span>
          </div>
          <p className="text-xs text-muted">Builder guide for drag, compose, and code mode</p>
        </div>
      </footer>
    </div>
  );
}
