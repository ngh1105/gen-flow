"use client";

import { createBuilderSnapshotFromTemplate } from "@/lib/contractPersistence";
import type { BuilderSnapshot, NodeData } from "@/store/useFlowStore";

export type IntentConfidence = "high" | "medium" | "low";

export interface IntentDraftRequest {
  brief: string;
  currentSnapshot?: BuilderSnapshot;
  mode?: "create" | "refine";
}

export interface IntentAssumption {
  id: string;
  message: string;
}

export interface TemplateRecommendation {
  templateId: string;
  confidence: IntentConfidence;
  reason: string;
  alternativeTemplateId?: string;
  alternativeReason?: string;
}

export interface DraftFieldSuggestion {
  id: keyof NodeData;
  label: string;
  value: string | number;
  reason: string;
}

export interface BuilderDraftPatch {
  templateId: string;
  nodeData: Partial<NodeData>;
  changedFields: Array<keyof NodeData | "templateId">;
  resetFields: Array<keyof NodeData>;
}

export interface IntentDraftResult {
  summary: string;
  assistantMessage: string;
  assumptions: IntentAssumption[];
  templateRecommendation: TemplateRecommendation;
  fieldSuggestions: DraftFieldSuggestion[];
  patch: BuilderDraftPatch;
}

const DEFAULT_URL = "https://example.com/source";

const FIELD_LABELS: Record<keyof NodeData, string> = {
  contractName: "Contract name",
  url: "Source URL",
  prompt: "AI instruction",
  numValidators: "Validator count",
  storageName: "State name",
  storageFields: "Saved fields",
  constructorArgs: "Launch inputs",
};

const TEMPLATE_LABELS: Record<string, string> = {
  "simple-storage": "Simple Storage",
  "ai-governance": "AI Governance",
  "future-of-work": "Future of Work",
  "onchain-justice": "Onchain Justice",
  "oracle-benchmark": "Oracle Benchmark",
  "dao-vote": "DAO Vote",
  "price-oracle": "Price Oracle",
  "content-filter": "Content Filter",
  "prediction-market": "Prediction Market",
  "ai-game": "AI Game",
  "ai-arbitrator": "AI Arbitrator",
  "custom-compose": "Custom Compose",
};

function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function extractUrl(brief: string): string | null {
  const match = brief.match(/https?:\/\/[^\s)]+/i);
  return match?.[0] ?? null;
}

function extractNamedContract(brief: string): string | null {
  const namedMatch = brief.match(
    /(?:called|named)\s+["“]?([a-zA-Z][a-zA-Z0-9\s_-]{2,40})["”]?/i
  );
  if (!namedMatch) return null;
  return titleCase(namedMatch[1].trim());
}

function guessContractName(templateId: string, brief: string): string {
  const explicitName = extractNamedContract(brief);
  if (explicitName) return explicitName;

  const templateBase =
    {
      "simple-storage": "SimpleStorage",
      "ai-governance": "AIGovernance",
      "future-of-work": "FutureOfWork",
      "onchain-justice": "OnchainJustice",
      "oracle-benchmark": "OracleBenchmark",
      "dao-vote": "DAOVote",
      "price-oracle": "PriceOracle",
      "content-filter": "ContentFilter",
      "prediction-market": "PredictionMarket",
      "ai-game": "AIGame",
      "ai-arbitrator": "AIArbitrator",
      "custom-compose": "CustomContract",
    }[templateId] ?? "GenFlowContract";

  const nounish = brief
    .replace(/https?:\/\/[^\s)]+/gi, "")
    .split(/[^a-zA-Z0-9]+/)
    .filter((part) => part.length > 2)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");

  return nounish ? `${nounish}${templateBase}` : templateBase;
}

function getSignals(brief: string) {
  const text = brief.toLowerCase();
  const hasWeb =
    /(web|api|url|fetch|website|page|http|feed|source|oracle)/.test(text);
  const hasAI =
    /(ai|llm|model|judge|moderate|classify|analy[sz]e|summari[sz]e|decide|score)/.test(
      text
    );
  const hasGovernance = /(governance|proposal|delegate|policy|committee)/.test(text);
  const hasVote = /(vote|voting|dao|ballot)/.test(text);
  const hasPrediction = /(prediction|market|settle|outcome|bet|winner)/.test(text);
  const hasPrice = /(price|pricing|benchmark|quote|asset)/.test(text);
  const hasModeration = /(moderation|moderate|filter|unsafe|content)/.test(text);
  const hasJustice = /(dispute|justice|evidence|ruling|policy|appeal|case)/.test(text);
  const hasStorage = /(store|save|registry|record|database|profile|ledger)/.test(text);
  const hasGame = /(game|match|round|player)/.test(text);
  return {
    hasWeb,
    hasAI,
    hasGovernance,
    hasVote,
    hasPrediction,
    hasPrice,
    hasModeration,
    hasJustice,
    hasStorage,
    hasGame,
  };
}

function recommendTemplate(brief: string, currentTemplateId?: string): TemplateRecommendation {
  const signals = getSignals(brief);
  const scored: Array<{ templateId: string; score: number; reason: string }> = [];

  const push = (templateId: string, score: number, reason: string) => {
    scored.push({ templateId, score, reason });
  };

  if (signals.hasVote) push("dao-vote", 0.96, "The request sounds like a voting or DAO flow.");
  if (signals.hasGovernance)
    push("ai-governance", 0.95, "The request sounds like a governance coordination flow.");
  if (signals.hasJustice)
    push(
      "onchain-justice",
      signals.hasWeb || signals.hasAI ? 0.94 : 0.82,
      "The request sounds like a dispute, evidence, or policy review flow."
    );
  if (signals.hasModeration)
    push("content-filter", 0.93, "The request sounds like a moderation or classification flow.");
  if (signals.hasPrediction)
    push(
      "prediction-market",
      signals.hasWeb ? 0.94 : 0.84,
      "The request sounds like a settlement or outcome flow."
    );
  if (signals.hasPrice)
    push(
      "price-oracle",
      signals.hasPrediction ? 0.82 : 0.95,
      "The request sounds like a price or market data flow."
    );
  if (signals.hasGame)
    push("ai-game", 0.9, "The request sounds like a game or round-based decision flow.");
  if (signals.hasStorage && !signals.hasAI && !signals.hasWeb)
    push("simple-storage", 0.95, "The request sounds like a storage-first contract.");
  if (signals.hasAI && signals.hasWeb && !signals.hasJustice)
    push("ai-arbitrator", 0.88, "The request combines AI behavior with external data.");
  if (signals.hasAI && !signals.hasWeb && !signals.hasGovernance && !signals.hasModeration)
    push("ai-governance", 0.76, "The request needs AI-backed decision making.");
  if (signals.hasWeb && !signals.hasAI && !signals.hasPrediction && !signals.hasPrice)
    push("oracle-benchmark", 0.74, "The request reads from an external source.");

  if (currentTemplateId) {
    push(currentTemplateId, 0.72, "The refinement still overlaps with the current contract draft.");
  }

  if (scored.length === 0) {
    return {
      templateId: currentTemplateId ?? "custom-compose",
      confidence: "low",
      reason:
        "The request is broad, so GenFlow is keeping the safest draft shape until you refine it.",
      alternativeTemplateId: currentTemplateId
        ? undefined
        : "ai-governance",
      alternativeReason: currentTemplateId
        ? undefined
        : "If you expect AI-backed decisions, AI Governance is the best broad starting point.",
    };
  }

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  const alternative = scored.find((candidate) => candidate.templateId !== best.templateId);
  const confidence: IntentConfidence =
    best.score >= 0.9 ? "high" : best.score >= 0.8 ? "medium" : "low";

  return {
    templateId: best.templateId,
    confidence,
    reason: best.reason,
    alternativeTemplateId:
      confidence === "low" || (alternative && alternative.score >= best.score - 0.08)
        ? alternative?.templateId ?? (best.templateId === "custom-compose" ? "ai-governance" : "custom-compose")
        : undefined,
    alternativeReason:
      confidence === "low" || (alternative && alternative.score >= best.score - 0.08)
        ? alternative?.reason ??
          (best.templateId === "custom-compose"
            ? "If you expect AI-backed decisions, AI Governance is the strongest broad preset."
            : "If this draft still feels too opinionated, Custom Compose keeps the flow flexible.")
        : undefined,
  };
}

function buildNodeDataPatch(
  brief: string,
  templateId: string,
  currentNodeData?: NodeData
): Partial<NodeData> {
  const signals = getSignals(brief);
  const extractedUrl = extractUrl(brief);
  const nodeData: Partial<NodeData> = {
    contractName:
      currentNodeData?.contractName?.trim() || guessContractName(templateId, brief),
    prompt:
      signals.hasAI || templateId === "content-filter" || templateId === "onchain-justice"
        ? brief.trim()
        : currentNodeData?.prompt ?? "",
    url:
      extractedUrl ??
      (signals.hasWeb || templateId === "price-oracle" || templateId === "prediction-market"
        ? currentNodeData?.url || DEFAULT_URL
        : ""),
    numValidators:
      signals.hasAI || signals.hasPrediction || signals.hasJustice
        ? currentNodeData?.numValidators ?? 3
        : 1,
    storageName:
      currentNodeData?.storageName ||
      (signals.hasStorage ? "records" : templateId === "price-oracle" ? "latest_price" : ""),
    storageFields: currentNodeData?.storageFields ?? [],
    constructorArgs: currentNodeData?.constructorArgs ?? [],
  };

  if (!signals.hasAI && !templateId.includes("ai") && templateId !== "content-filter") {
    nodeData.prompt = currentNodeData?.prompt ?? "";
  }

  return nodeData;
}

function toFieldSuggestions(nodeData: Partial<NodeData>, brief: string): DraftFieldSuggestion[] {
  const suggestions: DraftFieldSuggestion[] = [];
  for (const key of Object.keys(nodeData) as Array<keyof NodeData>) {
    const value = nodeData[key];
    if (
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      continue;
    }

    suggestions.push({
      id: key,
      label: FIELD_LABELS[key],
      value: typeof value === "number" ? value : Array.isArray(value) ? value.length : value,
      reason:
        key === "prompt"
          ? "Copied from your idea so the draft already has an instruction."
          : key === "url"
            ? "Filled from the request or added as a placeholder because this draft needs a source."
            : key === "contractName"
              ? "Generated from the idea so the export already has a useful name."
              : `Prepared from your idea: ${brief.slice(0, 80)}${brief.length > 80 ? "..." : ""}`,
    });
  }
  return suggestions;
}

function compareNodeData(
  current: NodeData,
  next: Partial<NodeData>
): Pick<BuilderDraftPatch, "changedFields" | "resetFields"> {
  const changedFields: Array<keyof NodeData> = [];
  const resetFields: Array<keyof NodeData> = [];

  for (const key of Object.keys(FIELD_LABELS) as Array<keyof NodeData>) {
    const nextValue = next[key];
    if (nextValue === undefined) continue;

    const currentValue = current[key];
    const same = JSON.stringify(currentValue) === JSON.stringify(nextValue);
    if (!same) {
      changedFields.push(key);
      const nextIsEmpty =
        nextValue === "" || (Array.isArray(nextValue) && nextValue.length === 0);
      if (nextIsEmpty) {
        resetFields.push(key);
      }
    }
  }

  return { changedFields, resetFields };
}

export function generateIntentDraft({
  brief,
  currentSnapshot,
  mode = "create",
}: IntentDraftRequest): IntentDraftResult {
  const trimmed = brief.trim();
  const recommendation = recommendTemplate(trimmed, currentSnapshot?.activeTemplateId);
  const patchNodeData = buildNodeDataPatch(
    trimmed,
    recommendation.templateId,
    currentSnapshot?.nodeData
  );
  const snapshotBase = currentSnapshot ?? createBuilderSnapshotFromTemplate(recommendation.templateId);
  const compared = compareNodeData(snapshotBase.nodeData, patchNodeData);
  const changedFields: Array<keyof NodeData | "templateId"> =
    recommendation.templateId !== snapshotBase.activeTemplateId
      ? ["templateId", ...compared.changedFields]
      : compared.changedFields;

  const assumptions: IntentAssumption[] = [];
  if (patchNodeData.url === DEFAULT_URL) {
    assumptions.push({
      id: "missing-url",
      message: "I added a placeholder source URL because this draft expects outside data.",
    });
  }
  if (recommendation.confidence === "low") {
    assumptions.push({
      id: "low-confidence-fit",
      message:
        "This is a broad match. Review the contract type before accepting the draft.",
    });
  }
  if ((patchNodeData.prompt ?? "").trim().length === 0 && getSignals(trimmed).hasAI) {
    assumptions.push({
      id: "prompt-needed",
      message: "You will still need to clarify the AI instruction before export.",
    });
  }

  const templateLabel = TEMPLATE_LABELS[recommendation.templateId] ?? recommendation.templateId;
  const summary =
    mode === "refine"
      ? `Updated the draft toward ${templateLabel}. Review the proposed changes before applying them.`
      : `Prepared a ${templateLabel} draft from your idea. Review the contract type and key details before continuing.`;

  return {
    summary,
    assistantMessage:
      mode === "refine"
        ? `I found a refinement path for ${templateLabel}.`
        : `I translated your idea into a ${templateLabel} draft.`,
    assumptions,
    templateRecommendation: recommendation,
    fieldSuggestions: toFieldSuggestions(patchNodeData, trimmed),
    patch: {
      templateId: recommendation.templateId,
      nodeData: patchNodeData,
      changedFields,
      resetFields: compared.resetFields,
    },
  };
}

export function getStarterPrompts(): string[] {
  return [
    "Build a contract that fetches a price feed and stores the latest result.",
    "Create a governance contract that asks AI to review proposals and recommend actions.",
    "I need a moderation contract that classifies user submissions and returns a verdict.",
  ];
}
