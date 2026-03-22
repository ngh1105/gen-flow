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
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
    description: "Contract name & setup",
  },
  {
    type: "webFetchNode",
    label: "Web Fetch",
    icon: Globe,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
    description: "Fetch data from URL",
  },
  {
    type: "llmPromptNode",
    label: "LLM Prompt",
    icon: Brain,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
    description: "AI analysis with prompt",
  },
  {
    type: "storageNode",
    label: "Storage",
    icon: Database,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
    description: "On-chain state variables",
  },
  {
    type: "eventNode",
    label: "Event Emitter",
    icon: Zap,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
    description: "Emit on-chain events",
  },
  {
    type: "outputNode",
    label: "Output",
    icon: ArrowDownToLine,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
    description: "Return value",
  },
  {
    type: "payableNode",
    label: "Payable",
    icon: Coins,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
    description: "Accept token transfers",
  },
  {
    type: "contractCallNode",
    label: "Contract Call",
    icon: Link2,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
    description: "Call other contracts",
  },
  {
    type: "eventEmitNode",
    label: "Event Emit",
    icon: Radio,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
    description: "gl.Event + .emit()",
  },
  {
    type: "dynArrayNode",
    label: "DynArray",
    icon: ListPlus,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
    description: "Dynamic array storage",
  },
  {
    type: "treeMapNode",
    label: "TreeMap",
    icon: Map,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
    description: "Key-value mapping",
  },
  {
    type: "httpNode",
    label: "HTTP Request",
    icon: Send,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
    description: "GET/POST/DELETE API",
  },
  {
    type: "accessControlNode",
    label: "Access Control",
    icon: Shield,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
    description: "Owner/admin guards",
  },
  {
    type: "consensusNode",
    label: "Consensus",
    icon: GitBranch,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
    description: "Custom run_nondet",
  },
  {
    type: "vecDBNode",
    label: "VecDB Search",
    icon: Search,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
    description: "Semantic knn search",
  },
  {
    type: "evmBridgeNode",
    label: "EVM Bridge",
    icon: Layers,
    color: "text-foreground",
    bg: "bg-surface",
    border: "border-border",
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
    <div className="flex flex-col h-full border-r border-border bg-surface/80  w-[200px] shrink-0">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border">
        <h3 className="text-[11px] font-display font-medium text-muted uppercase tracking-widest">
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
              className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-none border ${node.border} ${node.bg} cursor-grab active:cursor-grabbing active:scale-[0.98] transition-all duration-150 select-none`}
            >
              <GripVertical className="w-3 h-3 text-muted/40 group-hover:text-muted/70 shrink-0 transition-colors duration-150" />
              <Icon className={`w-4 h-4 ${node.color} shrink-0`} />
              <div className="min-w-0">
                <p className={`text-xs font-display font-medium ${node.color} leading-tight truncate`}>
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
