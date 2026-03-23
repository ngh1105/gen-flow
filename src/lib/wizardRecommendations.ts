export interface WizardAnswers {
  goal: string;
  dataSource: string;
  consensus: string;
}

export type WizardRecommendationConfidence = "high" | "medium" | "low";

export interface WizardRecommendation {
  templateId: string;
  reason: string;
  confidence: WizardRecommendationConfidence;
  caution?: string;
  alternativeTemplateId?: string;
  alternativeReason?: string;
}

function recommendation(
  templateId: string,
  reason: string,
  options: Omit<WizardRecommendation, "templateId" | "reason"> = {
    confidence: "high",
  }
): WizardRecommendation {
  return {
    templateId,
    reason,
    confidence: options.confidence,
    caution: options.caution,
    alternativeTemplateId: options.alternativeTemplateId,
    alternativeReason: options.alternativeReason,
  };
}

export function getWizardRecommendation(
  answers: WizardAnswers
): WizardRecommendation {
  const { goal, dataSource, consensus } = answers;

  if (goal === "custom") {
    return recommendation(
      "custom-compose",
      "Use Custom Compose when you want full block-by-block control instead of a fixed product flow.",
      {
        confidence: "high",
      }
    );
  }

  if (goal === "store") {
    return recommendation(
      "simple-storage",
      "Simple Storage is the direct fit for contracts centered on on-chain state without external evidence.",
      {
        confidence: "high",
      }
    );
  }

  if (goal === "predict") {
    if (dataSource === "web" || dataSource === "both") {
      return recommendation(
        "prediction-market",
        "Prediction Markets fits outcome settlement when validators need live evidence before resolving a result.",
        {
          confidence: "high",
        }
      );
    }

    return recommendation(
      "custom-compose",
      "Outcome flows without external evidence are too specific for a preset, so Custom Compose is the safer starting point.",
      {
        confidence: "low",
        caution:
          "No preset currently models predictive logic without a live evidence source, so you will need to compose the settlement flow yourself.",
        alternativeTemplateId: "prediction-market",
        alternativeReason:
          "If you can add a live source for settlement evidence, Prediction Market gives you a clearer preset structure.",
      }
    );
  }

  if (goal === "analyze") {
    if (dataSource === "both") {
      return recommendation(
        "future-of-work",
        "Future of Work combines user submissions with live rubric or policy data, which matches mixed-source review flows.",
        {
          confidence: "high",
        }
      );
    }

    if (dataSource === "web" && consensus === "comparative") {
      return recommendation(
        "oracle-benchmark",
        "Oracle Benchmark is the best fit when you want to compare or benchmark live source signals with structured output.",
        {
          confidence: "high",
        }
      );
    }

    if (dataSource === "web") {
      return recommendation(
        "ai-arbitrator",
        "AI Arbitrator is the broad preset for web-sourced analysis and semantically validated AI conclusions.",
        {
          confidence: "medium",
          caution:
            "This is a broad analysis preset. If you expect policy text, disputes, or formal evidence bundles, a more opinionated template may fit better.",
          alternativeTemplateId: "onchain-justice",
          alternativeReason:
            "Onchain Justice is stronger when the workflow is explicitly about disputes, evidence review, or policy-backed rulings.",
        }
      );
    }

    return recommendation(
      "custom-compose",
      "Pure user-input analysis does not map cleanly to a featured preset, so Custom Compose keeps the flow honest.",
      {
        confidence: "low",
        caution:
          "The current preset library is weaker for analysis flows that rely only on user-provided input.",
        alternativeTemplateId: "future-of-work",
        alternativeReason:
          "If you later add rubric or policy data from the web, Future of Work becomes a stronger preset starting point.",
      }
    );
  }

  if (goal === "ai") {
    if (dataSource === "web" || dataSource === "both") {
      return recommendation(
        "onchain-justice",
        "Onchain Justice is the strongest preset when AI decisions depend on external evidence, policy text, or dispute context.",
        {
          confidence: "high",
        }
      );
    }

    if (dataSource === "user" && consensus === "comparative") {
      return recommendation(
        "ai-game",
        "AI Gaming fits comparative decision loops where users submit input and validators must agree on the round outcome.",
        {
          confidence: "high",
        }
      );
    }

    if (dataSource === "user" && consensus === "strict") {
      return recommendation(
        "content-filter",
        "Content Filter is the better preset when AI must classify user input into a constrained moderation-style result.",
        {
          confidence: "high",
        }
      );
    }

    return recommendation(
      "ai-governance",
      "AI Governance is the best default for AI-backed coordination, proposals, and non-deterministic decisions without external evidence.",
      {
        confidence: "medium",
        caution:
          "This is the broad default for AI coordination. If you want moderation or game-like outcomes, a more specific preset may be tighter.",
        alternativeTemplateId: "content-filter",
        alternativeReason:
          "Choose Content Filter when the decision is really a bounded accept/reject or moderation-style classification flow.",
      }
    );
  }

  return recommendation(
    "custom-compose",
    "No preset is a clean match for these choices, so Custom Compose is the safest recommendation.",
    {
      confidence: "low",
      caution:
        "The selected answers do not map cleanly to an existing opinionated preset.",
    }
  );
}
