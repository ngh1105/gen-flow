import { describe, expect, it } from "vitest";

import { createBuilderSnapshotFromTemplate } from "@/lib/contractPersistence";
import { generateIntentDraft } from "@/lib/intentDraft";

describe("intentDraft", () => {
  it("maps a price feed brief to a price-oriented template with prefilled values", () => {
    const result = generateIntentDraft({
      brief:
        "Build a contract that fetches prices from https://example.com/feed and stores the latest result.",
    });

    expect(["price-oracle", "prediction-market", "oracle-benchmark"]).toContain(
      result.patch.templateId
    );
    expect(result.patch.nodeData.url).toBe("https://example.com/feed");
    expect(result.patch.nodeData.contractName).toBeTruthy();
    expect(result.fieldSuggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "url" }),
        expect.objectContaining({ id: "contractName" }),
      ])
    );
  });

  it("returns assumptions and an alternative when the brief is vague", () => {
    const result = generateIntentDraft({
      brief: "Make something smart that helps users decide what to do next.",
    });

    expect(result.templateRecommendation.confidence).toBe("low");
    expect(result.assumptions.length).toBeGreaterThan(0);
    expect(result.templateRecommendation.alternativeTemplateId).toBeTruthy();
  });

  it("proposes concrete changes during refinement against the current draft", () => {
    const snapshot = createBuilderSnapshotFromTemplate("simple-storage");
    snapshot.nodeData.contractName = "StorageDraft";

    const result = generateIntentDraft({
      brief: "Use a URL source instead and turn this into a price feed contract.",
      currentSnapshot: snapshot,
      mode: "refine",
    });

    expect(result.patch.changedFields).toContain("templateId");
    expect(result.patch.changedFields).toContain("url");
    expect(result.summary).toContain("Updated");
  });
});
