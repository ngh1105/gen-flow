import {
  FileCode,
  Globe,
  Brain,
  Database,
  Zap,
  ArrowDownToLine,
  GripVertical,
  Coins,
  Link2,
  Radio,
  ListPlus,
  Map,
  Send,
  Shield,
  GitBranch,
  Search,
  Layers,
} from "lucide-react";

const NODE_TYPES = [
  {
    type: "initNode",
    label: "Init Contract",
    icon: FileCode,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    description: "Contract name & setup",
  },
  {
    type: "webFetchNode",
    label: "Web Fetch",
    icon: Globe,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    description: "Fetch data from URL",
  },
  {
    type: "llmPromptNode",
    label: "LLM Prompt",
    icon: Brain,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    description: "AI analysis with prompt",
  },
  {
    type: "storageNode",
    label: "Storage",
    icon: Database,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    description: "On-chain state variables",
  },
  {
    type: "eventNode",
    label: "Event Emitter",
    icon: Zap,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    description: "Emit on-chain events",
  },
  {
    type: "outputNode",
    label: "Output",
    icon: ArrowDownToLine,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    description: "Return value",
  },
  {
    type: "payableNode",
    label: "Payable",
    icon: Coins,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    description: "Accept token transfers",
  },
  {
    type: "contractCallNode",
    label: "Contract Call",
    icon: Link2,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    description: "Call other contracts",
  },
  {
    type: "eventEmitNode",
    label: "Event Emit",
    icon: Radio,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    description: "gl.Event + .emit()",
  },
  {
    type: "dynArrayNode",
    label: "DynArray",
    icon: ListPlus,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    description: "Dynamic array storage",
  },
  {
    type: "treeMapNode",
    label: "TreeMap",
    icon: Map,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    description: "Key-value mapping",
  },
  {
    type: "httpNode",
    label: "HTTP Request",
    icon: Send,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    description: "GET/POST/DELETE API",
  },
  {
    type: "accessControlNode",
    label: "Access Control",
    icon: Shield,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    description: "Owner/admin guards",
  },
  {
    type: "consensusNode",
    label: "Consensus",
    icon: GitBranch,
    color: "text-lime-400",
    bg: "bg-lime-500/10",
    border: "border-lime-500/20",
    description: "Custom run_nondet",
  },
  {
    type: "vecDBNode",
    label: "VecDB Search",
    icon: Search,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    description: "Semantic knn search",
  },
  {
    type: "evmBridgeNode",
    label: "EVM Bridge",
    icon: Layers,
    color: "text-slate-300",
    bg: "bg-slate-500/10",
    border: "border-slate-400/20",
    description: "Cross-chain ERC20",
  },
];

export default function NodeSidebar() {
  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: string
  ) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex flex-col h-full border-r border-border bg-surface/80 backdrop-blur-md w-[200px] shrink-0">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border">
        <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wider">
          Node Library
        </h3>
      </div>

      {/* Node items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {NODE_TYPES.map((node) => {
          const Icon = node.icon;
          return (
            <div
              key={node.type}
              draggable
              onDragStart={(e) => onDragStart(e, node.type)}
              className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-lg border ${node.border} ${node.bg} cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-all select-none`}
            >
              <GripVertical className="w-3 h-3 text-muted/40 group-hover:text-muted/70 shrink-0 transition-colors" />
              <Icon className={`w-4 h-4 ${node.color} shrink-0`} />
              <div className="min-w-0">
                <p className={`text-xs font-semibold ${node.color} leading-tight truncate`}>
                  {node.label}
                </p>
                <p className="text-[9px] text-muted/60 leading-tight truncate">
                  {node.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-border">
        <p className="text-[9px] text-muted/50 text-center">
          Drag nodes onto canvas
        </p>
      </div>
    </div>
  );
}
