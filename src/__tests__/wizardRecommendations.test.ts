import { describe, expect, it } from "vitest";

import { getWizardRecommendation } from "@/lib/wizardRecommendations";

describe("wizard recommendations", () => {
  it("maps storage flows to simple storage", () => {
    expect(
      getWizardRecommendation({
        goal: "store",
        dataSource: "none",
        consensus: "none",
      }).templateId
    ).toBe("simple-storage");
  });

  it("maps mixed-source analysis to future of work", () => {
    expect(
      getWizardRecommendation({
        goal: "analyze",
        dataSource: "both",
        consensus: "non_comparative",
      }).templateId
    ).toBe("future-of-work");
  });

  it("maps comparative web analysis to oracle benchmark", () => {
    expect(
      getWizardRecommendation({
        goal: "analyze",
        dataSource: "web",
        consensus: "comparative",
      }).templateId
    ).toBe("oracle-benchmark");
  });

  it("maps user-driven comparative AI decisions to AI gaming", () => {
    expect(
      getWizardRecommendation({
        goal: "ai",
        dataSource: "user",
        consensus: "comparative",
      }).templateId
    ).toBe("ai-game");
  });

  it("maps evidence-backed AI decisions to onchain justice", () => {
    expect(
      getWizardRecommendation({
        goal: "ai",
        dataSource: "web",
        consensus: "non_comparative",
      }).templateId
    ).toBe("onchain-justice");
  });

  it("maps predictive web flows to prediction markets", () => {
    expect(
      getWizardRecommendation({
        goal: "predict",
        dataSource: "web",
        consensus: "strict",
      }).templateId
    ).toBe("prediction-market");
  });

  it("includes caution and an alternative for low-confidence branches", () => {
    const recommendation = getWizardRecommendation({
      goal: "predict",
      dataSource: "none",
      consensus: "strict",
    });

    expect(recommendation.templateId).toBe("custom-compose");
    expect(recommendation.confidence).toBe("low");
    expect(recommendation.caution).toBeTruthy();
    expect(recommendation.alternativeTemplateId).toBe("prediction-market");
  });

  it("marks broad web analysis as medium confidence", () => {
    const recommendation = getWizardRecommendation({
      goal: "analyze",
      dataSource: "web",
      consensus: "non_comparative",
    });

    expect(recommendation.templateId).toBe("ai-arbitrator");
    expect(recommendation.confidence).toBe("medium");
    expect(recommendation.alternativeTemplateId).toBe("onchain-justice");
  });
});
