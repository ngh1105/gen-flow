import type { Edge } from "@xyflow/react";

export const initialEdges: Edge[] = [
  {
    id: "edge-init-webfetch",
    source: "init-1",
    target: "webfetch-1",
    animated: true,
  },
  {
    id: "edge-webfetch-llm",
    source: "webfetch-1",
    target: "llmprompt-1",
    animated: true,
  },
];
