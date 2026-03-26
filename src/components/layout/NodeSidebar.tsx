import {
  Plus,
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
  Lock,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, type DragEvent } from "react";
import { useReactFlow } from "@xyflow/react";

import { getBuilderStatus } from "@/lib/exportRequirements";
import { NODE_LIBRARY } from "@/lib/nodeCatalog";
import { useFlowStore } from "@/store/useFlowStore";

const NODE_ICONS: Record<string, LucideIcon> = {
  initNode: FileCode,
  webFetchNode: Globe,
  llmPromptNode: Brain,
  storageNode: Database,
  eventNode: Zap,
  outputNode: ArrowDownToLine,
  payableNode: Coins,
  contractCallNode: Link2,
  eventEmitNode: Radio,
  dynArrayNode: ListPlus,
  treeMapNode: Map,
  httpNode: Send,
  accessControlNode: Shield,
  consensusNode: GitBranch,
  vecDBNode: Search,
  evmBridgeNode: Layers,
};

interface NodeSidebarProps {
  onDragStateChange?: (label: string | null) => void;
}

export default function NodeSidebar({ onDragStateChange }: NodeSidebarProps) {
  const activeTemplateId = useFlowStore((s) => s.activeTemplateId);
  const addNode = useFlowStore((s) => s.addNode);
  const nodeData = useFlowStore((s) => s.nodeData);
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const isCustomCompose = activeTemplateId === "custom-compose";
  const { screenToFlowPosition } = useReactFlow();
  const clickAddCountRef = useRef(0);
  const builderStatus = useMemo(
    () =>
      getBuilderStatus(nodeData, nodes, {
        activeTemplateId,
        edges,
      }),
    [activeTemplateId, edges, nodeData, nodes]
  );
  const missingNodeTypes = useMemo(
    () => new Set(builderStatus.health.missingNodeTypes),
    [builderStatus.health.missingNodeTypes]
  );
  const recommendedNodeTypes = useMemo(
    () => new Set(builderStatus.health.recommendedNodeTypes),
    [builderStatus.health.recommendedNodeTypes]
  );

  useEffect(() => {
    clickAddCountRef.current = 0;
    onDragStateChange?.(null);
  }, [activeTemplateId, onDragStateChange]);

  const getCanvasCenterPosition = useCallback(() => {
    const canvas = document.querySelector<HTMLElement>(
      '[data-testid="builder-canvas-wrapper"]'
    );

    if (!canvas) {
      return { x: 350, y: 180 };
    }

    const rect = canvas.getBoundingClientRect();
    return screenToFlowPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }, [screenToFlowPosition]);

  const handleAddNode = useCallback(
    (nodeType: string) => {
      if (!isCustomCompose) return;

      const center = getCanvasCenterPosition();
      const offset = (clickAddCountRef.current % 6) * 36;
      clickAddCountRef.current += 1;

      addNode(nodeType, {
        x: center.x + offset,
        y: center.y + offset,
      });
    },
    [addNode, getCanvasCenterPosition, isCustomCompose]
  );

  const onDragStart = (
    event: DragEvent<HTMLDivElement>,
    nodeType: string,
    nodeLabel: string
  ) => {
    if (!isCustomCompose) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
    onDragStateChange?.(nodeLabel);
  };

  const onDragEnd = () => {
    onDragStateChange?.(null);
  };

  return (
    <div className="flex flex-col h-full border-r border-border bg-surface/80 w-[220px] shrink-0">
      <div className="px-3 py-3 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-display font-medium text-muted uppercase tracking-widest">
            Advanced Blocks
          </h3>
          <span className="text-[9px] text-muted/60 font-mono">
            {isCustomCompose ? "compose" : "locked"}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-muted/55 leading-tight">
          {isCustomCompose
            ? "Advanced mode: drag blocks into the canvas or click Add."
            : "Switch to Custom Compose to add new blocks."}
        </p>
        {builderStatus.health.recommendedNodeTypes.length > 0 && (
          <p className="mt-2 text-[10px] leading-tight text-foreground">
            Guidance is highlighting the next suggested node types below.
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {NODE_LIBRARY.map((node) => {
          const Icon = NODE_ICONS[node.type] ?? Layers;
          const isMissing = missingNodeTypes.has(node.type);
          const isRecommended = recommendedNodeTypes.has(node.type);

          return (
            <div
              key={node.type}
              data-testid={`sidebar-node-${node.type}`}
              draggable={isCustomCompose}
              aria-disabled={!isCustomCompose}
              onDragStart={(event) => onDragStart(event, node.type, node.label)}
              onDragEnd={onDragEnd}
              title={
                isCustomCompose
                  ? `Drag ${node.label} to canvas`
                  : "Available in Custom Compose only"
              }
              className={`group flex items-center gap-2 px-2.5 py-2 rounded-none border transition-all duration-150 select-none ${
                isCustomCompose
                  ? "border-border bg-surface cursor-grab active:cursor-grabbing active:scale-[0.98]"
                  : "border-border/60 bg-surface/50 opacity-55 cursor-not-allowed"
              } ${
                isMissing
                  ? "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
                  : ""
              }`}
            >
              {isCustomCompose ? (
                <GripVertical className="w-3 h-3 text-muted/40 group-hover:text-muted/70 shrink-0 transition-colors duration-150" />
              ) : (
                <Lock className="w-3 h-3 text-muted/40 shrink-0" />
              )}
              <Icon className="w-4 h-4 text-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-display font-medium text-foreground leading-tight truncate">
                    {node.label}
                  </p>
                  {isMissing && (
                    <span
                      data-testid={`sidebar-badge-${node.type}`}
                      className="border border-foreground bg-foreground px-1 py-0.5 text-[8px] uppercase tracking-widest text-background"
                    >
                      Missing
                    </span>
                  )}
                  {!isMissing && isRecommended && (
                    <span
                      data-testid={`sidebar-badge-${node.type}`}
                      className="border border-border bg-background px-1 py-0.5 text-[8px] uppercase tracking-widest text-foreground"
                    >
                      Suggested
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-muted/60 leading-tight">
                  {node.description}
                </p>
              </div>
              <button
                type="button"
                draggable={false}
                data-testid={`sidebar-add-${node.type}`}
                onClick={(event) => {
                  event.stopPropagation();
                  handleAddNode(node.type);
                }}
                disabled={!isCustomCompose}
                className={`ml-auto shrink-0 px-2 py-1 rounded-none text-[10px] font-display font-medium uppercase tracking-widest border transition-all duration-150 ${
                  isCustomCompose
                    ? "border-foreground bg-background text-foreground hover:bg-foreground hover:text-background"
                    : "border-border/60 bg-background text-muted/60 cursor-not-allowed"
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  Add
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="px-3 py-2 border-t border-border">
        <p className="text-[9px] text-muted/50 text-center">
          {isCustomCompose
            ? "Drag or click Add to compose"
            : "Template mode is view-only for logic"}
        </p>
      </div>
    </div>
  );
}
