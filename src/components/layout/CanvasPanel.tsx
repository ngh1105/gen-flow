"use client";

import { useMemo, useCallback, useRef } from "react";
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

export default function CanvasPanel() {
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

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, nodeData, addNode } =
    useFlowStore();

  // Dynamic edge styling based on validation
  const styledEdges: Edge[] = useMemo(() => {
    const isInitValid = nodeData.contractName.trim() !== "";
    const isUrlValid = nodeData.url.trim() !== "";

    // Build a map of node id -> node type for dynamic lookup
    const nodeTypeMap = new Map(nodes.map((n) => [n.id, n.type]));

    return edges.map((edge) => {
      const sourceType = nodeTypeMap.get(edge.source);
      let isValid = true; // default valid for unknown sources

      if (sourceType === "initNode") isValid = isInitValid;
      else if (sourceType === "webFetchNode") isValid = isInitValid && isUrlValid;
      else if (sourceType === "httpNode") isValid = isInitValid && isUrlValid;

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

  // Handle drag-and-drop from sidebar
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, position);
    },
    [screenToFlowPosition, addNode]
  );

  return (
    <div ref={reactFlowWrapper} className="relative w-full h-full canvas-bg">
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
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
          className="!bg-surface !border-border !rounded-lg !shadow-lg [&>button]:!bg-surface [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-surface-hover"
          showInteractive={false}
        />
      </ReactFlow>

      {/* Watermark */}
      <div className="absolute bottom-4 left-4 text-[11px] text-muted/40 pointer-events-none select-none">
        GenFlow Canvas · Drag nodes to rearrange
      </div>
    </div>
  );
}
