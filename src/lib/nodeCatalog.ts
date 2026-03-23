export interface NodeCatalogEntry {
  type: string;
  label: string;
  description: string;
}

export const NODE_LIBRARY: NodeCatalogEntry[] = [
  {
    type: "initNode",
    label: "Init Contract",
    description: "Contract name and constructor setup",
  },
  {
    type: "webFetchNode",
    label: "Web Fetch",
    description: "Fetch live data from a URL",
  },
  {
    type: "llmPromptNode",
    label: "LLM Prompt",
    description: "Run AI analysis with a prompt",
  },
  {
    type: "storageNode",
    label: "Storage",
    description: "Persist on-chain contract state",
  },
  {
    type: "eventNode",
    label: "Event Emitter",
    description: "Track activity or emit simple event state",
  },
  {
    type: "outputNode",
    label: "Output",
    description: "Expose a result through a view method",
  },
  {
    type: "payableNode",
    label: "Payable",
    description: "Accept token transfers",
  },
  {
    type: "contractCallNode",
    label: "Contract Call",
    description: "Call another contract",
  },
  {
    type: "eventEmitNode",
    label: "Event Emit",
    description: "Emit a typed GenLayer event",
  },
  {
    type: "dynArrayNode",
    label: "DynArray",
    description: "Dynamic array storage helpers",
  },
  {
    type: "treeMapNode",
    label: "TreeMap",
    description: "Key-value mapping storage helpers",
  },
  {
    type: "httpNode",
    label: "HTTP Request",
    description: "Call an external API endpoint",
  },
  {
    type: "accessControlNode",
    label: "Access Control",
    description: "Owner-only write guards",
  },
  {
    type: "consensusNode",
    label: "Consensus",
    description: "Wrap non-deterministic logic with consensus",
  },
  {
    type: "vecDBNode",
    label: "VecDB Search",
    description: "Semantic search and vector storage",
  },
  {
    type: "evmBridgeNode",
    label: "EVM Bridge",
    description: "Bridge to an EVM contract interface",
  },
];

export const NODE_LABELS = Object.fromEntries(
  NODE_LIBRARY.map((entry) => [entry.type, entry.label])
) as Record<string, string>;

export function getNodeLabel(nodeType: string): string {
  return NODE_LABELS[nodeType] ?? nodeType;
}
