import type { Node, Edge } from "@xyflow/react";

import { aiArbitratorTemplate } from "./templates/aiArbitratorTemplate";
import { daoVoteTemplate } from "./templates/daoVoteTemplate";
import { priceOracleTemplate } from "./templates/priceOracleTemplate";
import { contentFilterTemplate } from "./templates/contentFilterTemplate";
import { simpleStorageTemplate } from "./templates/simpleStorageTemplate";
import { predictionMarketTemplate } from "./templates/predictionMarketTemplate";
import { aiGameTemplate } from "./templates/aiGameTemplate";
import { customComposeTemplate } from "./templates/customComposeTemplate";
import { aiGovernanceTemplate } from "./templates/aiGovernanceTemplate";
import { futureOfWorkTemplate } from "./templates/futureOfWorkTemplate";
import { onchainJusticeTemplate } from "./templates/onchainJusticeTemplate";
import { oracleBenchmarkTemplate } from "./templates/oracleBenchmarkTemplate";

export interface ContractTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  tags?: string[];
  featured?: boolean;
  placeholders: string[];
  requiredNodes: string[];
  defaultNodes: Node[];
  defaultEdges: Edge[];
  template: string;
}

const templates: ContractTemplate[] = [
  customComposeTemplate,
  aiGovernanceTemplate,
  predictionMarketTemplate,
  aiGameTemplate,
  futureOfWorkTemplate,
  onchainJusticeTemplate,
  oracleBenchmarkTemplate,
  aiArbitratorTemplate,
  daoVoteTemplate,
  priceOracleTemplate,
  contentFilterTemplate,
  simpleStorageTemplate,
];

export function getTemplate(id: string): ContractTemplate | undefined {
  return templates.find((t) => t.id === id);
}

export function getAllTemplates(): ContractTemplate[] {
  return templates;
}

export function getDefaultTemplate(): ContractTemplate {
  return aiArbitratorTemplate;
}
