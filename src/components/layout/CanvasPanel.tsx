"use client";

import { useMemo, useCallback, useRef, type DragEvent } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  type Edge,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useFlowStore } from "@/store/useFlowStore";
import InitNode from "@/components/nodes/InitNode";
import WebFetchNode from "@/components/nodes/WebFetchNode";
import LLMPromptNode from "@/components/nodes/LLMPromptNode";
import StorageNode from "@/components/nodes/StorageNode";
import EventNode from "@/components/nodes/EventNode";
import OutputNode from "@/components/nodes/OutputNode";
import PayableNode from "@/components/nodes/PayableNode";
import ContractCallNode from "@/components/nodes/ContractCallNode";
import EventEmitNode from "@/components/nodes/EventEmitNode";
import DynArrayNode from "@/components/nodes/DynArrayNode";
import TreeMapNode from "@/components/nodes/TreeMapNode";
import HTTPNode from "@/components/nodes/HTTPNode";
import AccessControlNode from "@/components/nodes/AccessControlNode";
import ConsensusNode from "@/components/nodes/ConsensusNode";
import VecDBNode from "@/components/nodes/VecDBNode";
import EVMBridgeNode from "@/components/nodes/EVMBridgeNode";
import FlowHealthPanel from "@/components/layout/FlowHealthPanel";

interface CanvasPanelProps {
  draggedNodeLabel?: string | null;
}

export default function CanvasPanel({ draggedNodeLabel = null }: CanvasPanelProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodeTypes = useMemo(
    () => ({
      initNode: InitNode,
      webFetchNode: WebFetchNode,
      llmPromptNode: LLMPromptNode,
      storageNode: StorageNode,
      eventNode: EventNode,
      outputNode: OutputNode,
      payableNode: PayableNode,
      contractCallNode: ContractCallNode,
      eventEmitNode: EventEmitNode,
      dynArrayNode: DynArrayNode,
      treeMapNode: TreeMapNode,
      httpNode: HTTPNode,
      accessControlNode: AccessControlNode,
      consensusNode: ConsensusNode,
      vecDBNode: VecDBNode,
      evmBridgeNode: EVMBridgeNode,
    }),
    []
  );

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    nodeData,
    addNode,
    activeTemplateId,
  } = useFlowStore();
  const isCustomCompose = activeTemplateId === "custom-compose";
  const modeTitle = isCustomCompose ? "Custom Compose" : "Template Mode";
  const modeDescription = isCustomCompose
    ? "Advanced block-by-block mode. Active blocks drive code generation."
    : "Developer canvas for the current guided template. This view is read-only unless you switch into Custom Compose.";
  const isNearEmptyCompose = isCustomCompose && nodes.length <= 1;

  const styledEdges: Edge[] = useMemo(() => {
    const isInitValid = nodeData.contractName.trim() !== "";
    const isUrlValid = nodeData.url.trim() !== "";
    const nodeTypeMap = new Map(nodes.map((n) => [n.id, n.type]));

    return edges.map((edge) => {
      const sourceType = nodeTypeMap.get(edge.source);
      let isValid = true;

      if (sourceType === "initNode") isValid = isInitValid;
      else if (sourceType === "webFetchNode") isValid = isInitValid && isUrlValid;
      else if (sourceType === "httpNode") isValid = isInitValid;

      return {
        ...edge,
        animated: true,
        style: {
          stroke: isValid ? "#22c55e" : "rgba(139, 92, 246, 0.4)",
          strokeWidth: isValid ? 2 : 1.5,
        },
      };
    });
  }, [edges, nodes, nodeData.contractName, nodeData.url]);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = isCustomCompose ? "move" : "none";
  }, [isCustomCompose]);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !isCustomCompose) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [screenToFlowPosition, addNode, isCustomCompose]
  );

  return (
    <div
      ref={reactFlowWrapper}
      data-testid="builder-canvas-wrapper"
      className="relative w-full h-full canvas-bg"
    >
      <ReactFlow
        data-testid="builder-canvas"
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={isCustomCompose ? onConnect : undefined}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        nodesDraggable={isCustomCompose}
        nodesConnectable={isCustomCompose}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        className="!bg-transparent"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(113, 113, 122, 0.15)"
        />
        <Controls
          className="!bg-surface !border-border !rounded-none !shadow-none [&>button]:!bg-surface [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-surface-hover"
          showInteractive={false}
        />
      </ReactFlow>

      <div className="absolute left-4 top-4 max-w-[340px] border border-border bg-surface/90 px-3 py-2 pointer-events-none">
        <p className="text-[10px] font-display font-medium uppercase tracking-widest text-foreground">
          {modeTitle}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          {modeDescription}
        </p>
        {isCustomCompose && (
          <p className="mt-2 text-[10px] leading-relaxed text-muted/80">
            Connections help organize flow; code generation is driven by active blocks.
          </p>
        )}
      </div>

      <FlowHealthPanel />

      {draggedNodeLabel && isCustomCompose && (
        <div
          data-testid="canvas-drop-overlay"
          className="absolute inset-6 flex items-center justify-center border border-dashed border-foreground bg-background/70 text-center pointer-events-none"
        >
          <div className="px-5 py-4 border border-border bg-surface/95">
            <p className="text-[10px] font-display font-medium uppercase tracking-widest text-foreground">
              Drop here to add
            </p>
            <p className="mt-2 text-lg font-display font-medium text-foreground">
              {draggedNodeLabel}
            </p>
          </div>
        </div>
      )}

      {isNearEmptyCompose && !draggedNodeLabel && (
        <div
          data-testid="canvas-empty-callout"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-dashed border-border bg-surface/80 px-5 py-4 pointer-events-none"
        >
          <p className="text-[10px] font-display font-medium uppercase tracking-widest text-muted">
            Start composing
          </p>
          <p className="mt-1 text-sm text-foreground">
            Drag or click a node to start composing.
          </p>
        </div>
      )}

      <div className="absolute bottom-4 left-4 text-[11px] text-muted/50 pointer-events-none select-none">
        {isCustomCompose
          ? "Advanced canvas - add blocks by drag or click, then arrange the flow"
          : "Template canvas - inspect the contract structure while guided setup stays primary"}
      </div>
    </div>
  );
}
