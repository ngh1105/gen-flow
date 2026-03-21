import type { Node } from "@xyflow/react";

export const initialNodes: Node[] = [
  {
    id: "init-1",
    type: "initNode",
    position: { x: 250, y: 0 },
    data: {},
  },
  {
    id: "webfetch-1",
    type: "webFetchNode",
    position: { x: 250, y: 200 },
    data: {},
  },
  {
    id: "llmprompt-1",
    type: "llmPromptNode",
    position: { x: 250, y: 420 },
    data: {},
  },
];
