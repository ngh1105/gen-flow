import { describe, expect, it } from "vitest";

import { getAllTemplates, getTemplate } from "@/engine/templateRegistry";

describe("template registry", () => {
  it("keeps template ids unique", () => {
    const ids = getAllTemplates().map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("registers the new featured templates", () => {
    const featuredIds = getAllTemplates()
      .filter((template) => template.featured)
      .map((template) => template.id);

    expect(featuredIds).toEqual(
      expect.arrayContaining([
        "ai-governance",
        "prediction-market",
        "ai-game",
        "future-of-work",
        "onchain-justice",
        "oracle-benchmark",
      ])
    );
  });

  it("resolves newly added templates by id", () => {
    expect(getTemplate("ai-governance")?.name).toBe("AI Governance");
    expect(getTemplate("future-of-work")?.name).toBe("Future of Work");
    expect(getTemplate("onchain-justice")?.name).toBe("Onchain Justice");
    expect(getTemplate("oracle-benchmark")?.name).toBe("Oracle Benchmark");
  });
});
