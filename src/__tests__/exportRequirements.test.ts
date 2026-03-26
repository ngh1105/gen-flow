import { describe, expect, it } from "vitest";

import {
  getBuilderStatus,
  getExportRequirements,
  getMissingExportLabels,
  isExportReady,
} from "@/lib/exportRequirements";
import type { NodeData } from "@/store/useFlowStore";

const EMPTY_NODE_DATA: NodeData = {
  contractName: "",
  url: "",
  prompt: "",
  numValidators: 3,
  storageName: "",
  storageFields: [],
  constructorArgs: [],
};

describe("export requirements", () => {
  it("always requires contract name", () => {
    const requirements = getExportRequirements(EMPTY_NODE_DATA, []);

    expect(requirements.find((item) => item.id === "contract-name")).toMatchObject({
      required: true,
      done: false,
    });
    expect(isExportReady(requirements)).toBe(false);
    expect(getMissingExportLabels(requirements)).toEqual(["Contract name"]);
  });

  it("requires prompt when an llm node is active", () => {
    const requirements = getExportRequirements(
      {
        ...EMPTY_NODE_DATA,
        contractName: "Demo",
      },
      [{ id: "n1", type: "llmPromptNode", position: { x: 0, y: 0 }, data: {} }]
    );

    expect(requirements.find((item) => item.id === "prompt")).toMatchObject({
      required: true,
      done: false,
    });
    expect(isExportReady(requirements)).toBe(false);
    expect(getMissingExportLabels(requirements)).toEqual(["Prompt"]);
  });

  it("requires url when a web fetch node is active", () => {
    const requirements = getExportRequirements(
      {
        ...EMPTY_NODE_DATA,
        contractName: "Demo",
      },
      [{ id: "n1", type: "webFetchNode", position: { x: 0, y: 0 }, data: {} }]
    );

    expect(requirements.find((item) => item.id === "url")).toMatchObject({
      required: true,
      done: false,
    });
    expect(isExportReady(requirements)).toBe(false);
    expect(getMissingExportLabels(requirements)).toEqual(["URL"]);
  });

  it("marks export ready when all active requirements are filled", () => {
    const requirements = getExportRequirements(
      {
        ...EMPTY_NODE_DATA,
        contractName: "Demo",
        prompt: "Analyze the dispute",
        url: "https://example.com",
      },
      [
        { id: "n1", type: "llmPromptNode", position: { x: 0, y: 0 }, data: {} },
        { id: "n2", type: "webFetchNode", position: { x: 0, y: 0 }, data: {} },
      ]
    );

    expect(isExportReady(requirements)).toBe(true);
    expect(getMissingExportLabels(requirements)).toEqual([]);
  });

  it("exposes blocker messages through the shared builder status model", () => {
    const status = getBuilderStatus(
      {
        ...EMPTY_NODE_DATA,
        contractName: "Demo",
      },
      [{ id: "n1", type: "webFetchNode", position: { x: 0, y: 0 }, data: {} }]
    );

    expect(status.readyToExport).toBe(false);
    expect(status.summary).toContain("Missing URL");
    expect(status.blockers).toEqual([
      expect.objectContaining({
        id: "url",
        label: "URL",
      }),
    ]);
  });

  it("surfaces flow guidance even when export is technically ready", () => {
    const status = getBuilderStatus(
      {
        ...EMPTY_NODE_DATA,
        contractName: "Demo",
        prompt: "Review the payload",
      },
      [
        { id: "n0", type: "initNode", position: { x: 0, y: 0 }, data: {} },
        { id: "n1", type: "llmPromptNode", position: { x: 0, y: 0 }, data: {} },
      ],
      {
        activeTemplateId: "custom-compose",
      }
    );

    expect(status.readyToExport).toBe(true);
    expect(status.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "llm-no-sink",
        }),
      ])
    );
    expect(status.nextBestStep).toMatchObject({
      actionType: "add-node",
      nodeType: "outputNode",
    });
  });

  it("requires preview review before export in guided template mode", () => {
    const status = getBuilderStatus(
      {
        ...EMPTY_NODE_DATA,
        contractName: "Demo",
      },
      [{ id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} }],
      {
        activeTemplateId: "simple-storage",
        enforcePreviewReview: true,
        previewReviewed: false,
      }
    );

    expect(status.readyToExport).toBe(false);
    expect(status.preview).toMatchObject({
      required: true,
      reviewed: false,
      blocked: true,
    });
    expect(status.summary).toContain("Preview");
  });

  it("allows export once preview has been reviewed for the current draft", () => {
    const status = getBuilderStatus(
      {
        ...EMPTY_NODE_DATA,
        contractName: "Demo",
      },
      [{ id: "n1", type: "initNode", position: { x: 0, y: 0 }, data: {} }],
      {
        activeTemplateId: "simple-storage",
        enforcePreviewReview: true,
        previewReviewed: true,
      }
    );

    expect(status.readyToExport).toBe(true);
    expect(status.preview.blocked).toBe(false);
  });
});
