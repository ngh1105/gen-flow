import { readFile } from "node:fs/promises";

import { test, expect, type Page } from "@playwright/test";

async function dragSidebarNodeToCanvas(page: Page, nodeType: string) {
  const source = page.getByTestId(`sidebar-node-${nodeType}`);
  const target = page.getByTestId("builder-canvas");
  const box = await target.boundingBox();

  if (!box) {
    throw new Error("Canvas bounding box not available");
  }

  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  const clientX = box.x + box.width / 2;
  const clientY = box.y + box.height / 2;

  await source.dispatchEvent("dragstart", { dataTransfer });
  await target.dispatchEvent("dragenter", { dataTransfer, clientX, clientY });
  await target.dispatchEvent("dragover", { dataTransfer, clientX, clientY });
  await target.dispatchEvent("drop", { dataTransfer, clientX, clientY });
  await source.dispatchEvent("dragend", { dataTransfer });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("preserve-working-session") !== "true") {
      localStorage.removeItem("genflow-contracts");
      localStorage.removeItem("genflow-working-session");
    }
    localStorage.setItem("genflow-welcome-dismissed-v2", "true");
    localStorage.setItem("genflow-welcome-dismissed-v3", "true");
  });
});

test("first-time onboarding can launch Smart Wizard from the welcome overlay", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.removeItem("genflow-welcome-dismissed-v3");
  });

  await page.goto("/builder");

  await expect(page.getByTestId("welcome-open-wizard")).toBeVisible();
  await page.getByTestId("welcome-open-wizard").click();
  await expect(page.getByTestId("wizard-overlay")).toBeVisible();
});

test("landing page can navigate to builder", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /Build Intelligent Contracts/i })
  ).toBeVisible();

  await page.getByRole("link", { name: "Open Builder" }).first().click();
  await expect(page).toHaveURL(/\/builder$/);
  await expect(page.getByText("Node Library")).toBeVisible();
});

test("builder supports template switch and local save/delete flow", async ({ page }) => {
  await page.goto("/builder");
  await expect(page.getByText("Node Library")).toBeVisible();

  await page.getByTestId("template-switcher-trigger").click();
  await page.getByTestId("template-option-simple-storage").click();
  await expect(page.getByTestId("template-switcher-trigger")).toContainText("Simple Storage");

  const contractNameInput = page.getByTestId("contract-name-input");
  await contractNameInput.fill("SmokeContract");
  await expect(contractNameInput).toHaveValue("SmokeContract");

  await page.getByTestId("open-contracts-button").click();
  const panel = page.getByTestId("my-contracts-panel");
  await expect(panel).toBeVisible();

  await page.getByTestId("save-current-contract").click();
  await page.getByTestId("save-contract-name-input").fill("smoke-contract-1");
  await page.getByTestId("confirm-save-contract").click();

  const savedRow = panel
    .locator('[data-testid^="saved-contract-row-"]')
    .filter({ hasText: "smoke-contract-1" });
  await expect(savedRow).toHaveCount(1);

  await savedRow.hover();
  await savedRow.locator('[data-testid^="delete-contract-"]').click();
  await page.getByRole("button", { name: "Delete Contract" }).click();
  await expect(savedRow).toHaveCount(0);
});

test("template switching confirms before replacing an unsaved draft", async ({ page }) => {
  await page.goto("/builder");

  await page.getByTestId("contract-name-input").fill("Unsaved Draft");
  await page.getByTestId("template-switcher-trigger").click();
  await page.getByTestId("template-option-simple-storage").click();

  await expect(page.getByRole("dialog", { name: "Replace current draft?" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("dialog", { name: "Replace current draft?" })).toHaveCount(0);
  await expect(page.getByTestId("template-switcher-trigger")).not.toContainText("Simple Storage");

  await page.getByTestId("template-switcher-trigger").click();
  await page.getByTestId("template-option-simple-storage").click();
  await page.getByRole("button", { name: "Load Template" }).click();

  await expect(page.getByTestId("template-switcher-trigger")).toContainText("Simple Storage");
});

test("builder can load a previously saved contract state", async ({ page }) => {
  await page.goto("/builder");

  await page.getByTestId("template-switcher-trigger").click();
  await page.getByTestId("template-option-simple-storage").click();

  const contractNameInput = page.getByTestId("contract-name-input");
  await contractNameInput.fill("OriginalContract");

  await page.getByTestId("open-contracts-button").click();
  const panel = page.getByTestId("my-contracts-panel");
  await expect(panel).toBeVisible();

  await page.getByTestId("save-current-contract").click();
  await page.getByTestId("save-contract-name-input").fill("load-target");
  await page.getByTestId("confirm-save-contract").click();

  await contractNameInput.fill("ChangedContract");
  await expect(contractNameInput).toHaveValue("ChangedContract");

  const savedRow = panel
    .locator('[data-testid^="saved-contract-row-"]')
    .filter({ hasText: "load-target" });
  await expect(savedRow).toHaveCount(1);

  await savedRow.locator('[data-testid^="load-contract-"]').click({ force: true });
  await expect(contractNameInput).toHaveValue("OriginalContract");
});

test("loading a named contract warns before replacing unsaved edits", async ({ page }) => {
  await page.goto("/builder");

  await page.getByTestId("template-switcher-trigger").click();
  await page.getByTestId("template-option-simple-storage").click();
  const contractNameInput = page.getByTestId("contract-name-input");

  await contractNameInput.fill("SavedBaseline");
  await page.getByTestId("open-contracts-button").click();
  await page.getByTestId("save-current-contract").click();
  await page.getByTestId("save-contract-name-input").fill("draft-to-load");
  await page.getByTestId("confirm-save-contract").click();

  await contractNameInput.fill("SecondBaseline");
  await page.getByTestId("save-current-contract").click();
  await page.getByTestId("save-contract-name-input").fill("current-active");
  await page.getByTestId("confirm-save-contract").click();

  await contractNameInput.fill("UnsavedReplacement");

  const savedRow = page
    .locator('[data-testid^="saved-contract-row-"]')
    .filter({ hasText: "draft-to-load" });
  await savedRow.locator('[data-testid^="load-contract-"]').click({ force: true });

  await expect(page.getByRole("dialog", { name: "Load a saved contract?" })).toBeVisible();
  await page.getByRole("button", { name: "Load Contract" }).click();
  await expect(contractNameInput).toHaveValue("SavedBaseline");
});

test("deleting a named contract requires confirmation", async ({ page }) => {
  await page.goto("/builder");

  await page.getByTestId("open-contracts-button").click();
  await page.getByTestId("save-current-contract").click();
  await page.getByTestId("save-contract-name-input").fill("delete-target");
  await page.getByTestId("confirm-save-contract").click();

  const savedRow = page
    .locator('[data-testid^="saved-contract-row-"]')
    .filter({ hasText: "delete-target" });
  await savedRow.locator('[data-testid^="delete-contract-"]').click();

  await expect(page.getByRole("dialog", { name: "Delete this named contract?" })).toBeVisible();
  await page.getByRole("button", { name: "Delete Contract" }).click();
  await expect(savedRow).toHaveCount(0);
});

test("builder supports switching between visual and code mode", async ({ page }) => {
  await page.goto("/builder");

  await page.getByTestId("mode-toggle-code").click();
  await expect(page.getByTestId("editor-download-button")).toBeVisible();

  await page.getByTestId("mode-toggle-visual").click();
  await expect(page.getByTestId("generated-download-button")).toBeVisible();
});

test("builder restores the autosaved draft after reload", async ({ page }) => {
  await page.goto("/builder");

  await page.getByTestId("contract-name-input").fill("Recovered Draft");
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    sessionStorage.setItem("preserve-working-session", "true");
  });
  await page.reload();

  await expect(page.getByTestId("draft-restored-banner")).toBeVisible();
  await expect(page.getByTestId("contract-name-input")).toHaveValue("Recovered Draft");
  await page.evaluate(() => {
    sessionStorage.removeItem("preserve-working-session");
  });
});

test("builder can export generated python contract", async ({ page }) => {
  await page.goto("/builder");

  await page.getByTestId("template-switcher-trigger").click();
  await page.getByTestId("template-option-simple-storage").click();

  await page.getByTestId("contract-name-input").fill("Export Smoke");
  const downloadButton = page.getByTestId("generated-download-button");
  await expect(downloadButton).toBeEnabled();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    downloadButton.click(),
  ]);

  expect(download.suggestedFilename()).toBe("export_smoke.py");
});

test("template mode keeps node adding locked for prebuilt flows", async ({ page }) => {
  await page.goto("/builder");

  await page.getByTestId("template-switcher-trigger").click();
  await page.getByTestId("template-option-simple-storage").click();
  await expect(page.getByTestId("template-switcher-trigger")).toContainText("Simple Storage");

  await expect(page.getByTestId("sidebar-add-llmPromptNode")).toBeDisabled();
  await expect(page.getByTestId("builder-canvas-wrapper").getByText("Template Mode")).toBeVisible();
  await expect(page.locator(".react-flow__node")).toHaveCount(3);
});

test("custom compose drag-and-drop changes generation rules and exported code", async ({
  page,
}) => {
  await page.goto("/builder");

  await page.getByTestId("template-switcher-trigger").click();
  await page.getByTestId("template-option-custom-compose").click();
  await expect(page.getByTestId("template-switcher-trigger")).toContainText("Custom Compose");

  await page.getByTestId("contract-name-input").fill("Compose Smoke");
  const downloadButton = page.getByTestId("generated-download-button");
  await expect(downloadButton).toBeEnabled();

  const source = page.getByTestId("sidebar-node-llmPromptNode");
  const target = page.getByTestId("builder-canvas");
  const box = await target.boundingBox();

  if (!box) {
    throw new Error("Canvas bounding box not available");
  }

  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  const clientX = box.x + box.width / 2;
  const clientY = box.y + box.height / 2;

  await source.dispatchEvent("dragstart", { dataTransfer });
  await expect(page.getByTestId("canvas-drop-overlay")).toContainText("LLM Prompt");
  await target.dispatchEvent("dragenter", { dataTransfer, clientX, clientY });
  await target.dispatchEvent("dragover", { dataTransfer, clientX, clientY });
  await target.dispatchEvent("drop", { dataTransfer, clientX, clientY });
  await source.dispatchEvent("dragend", { dataTransfer });
  await expect(page.getByTestId("canvas-drop-overlay")).toHaveCount(0);
  await expect(downloadButton).toBeDisabled();

  await page.getByTestId("prompt-input").fill("Summarize the player input and return a verdict.");
  await expect(downloadButton).toBeEnabled();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    downloadButton.click(),
  ]);

  expect(download.suggestedFilename()).toBe("compose_smoke.py");

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const content = await readFile(downloadPath!, "utf8");
  expect(content).toContain("def process(self, input_data: str) -> str:");
  expect(content).toContain("gl.nondet.exec_prompt");
  expect(content).toContain('task="Process input with AI"');
});

test("custom compose web fetch requires a URL before export and writes fetch code", async ({
  page,
}) => {
  await page.goto("/builder");

  await page.getByTestId("template-switcher-trigger").click();
  await page.getByTestId("template-option-custom-compose").click();
  await expect(page.getByTestId("template-switcher-trigger")).toContainText("Custom Compose");

  await page.getByTestId("contract-name-input").fill("Web Fetch Smoke");
  const downloadButton = page.getByTestId("generated-download-button");
  await expect(downloadButton).toBeEnabled();

  await dragSidebarNodeToCanvas(page, "webFetchNode");
  await expect(downloadButton).toBeDisabled();

  await page.getByTestId("url-input").fill("https://example.com/feed");
  await expect(downloadButton).toBeEnabled();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    downloadButton.click(),
  ]);

  expect(download.suggestedFilename()).toBe("web_fetch_smoke.py");

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const content = await readFile(downloadPath!, "utf8");
  expect(content).toContain("def fetch_data(self) -> str:");
  expect(content).toContain('gl.nondet.web.render(');
  expect(content).toContain('"https://example.com/feed"');
});

test("custom compose click-to-add updates checklist without drag and drop", async ({
  page,
}) => {
  await page.goto("/builder");

  await page.getByTestId("template-switcher-trigger").click();
  await page.getByTestId("template-option-custom-compose").click();
  await expect(page.getByTestId("canvas-empty-callout")).toBeVisible();
  await expect(page.locator(".react-flow__node")).toHaveCount(1);

  await page.getByTestId("sidebar-add-llmPromptNode").click();
  await expect(page.locator(".react-flow__node")).toHaveCount(2);
  await expect(page.getByTestId("canvas-empty-callout")).toHaveCount(0);
  await expect(page.getByTestId("export-check-contract-name")).toContainText("required");
  await expect(page.getByTestId("export-check-prompt")).toContainText("required");

  await page.getByTestId("contract-name-input").fill("Click Add Smoke");
  await expect(page.getByTestId("export-check-contract-name")).toContainText("done");

  await page.getByTestId("prompt-input").fill("Score the request and respond with a verdict.");
  await expect(page.getByTestId("export-check-prompt")).toContainText("done");
  await expect(page.getByTestId("generated-download-button")).toBeEnabled();
});

test("flow health quick action can add the recommended node", async ({ page }) => {
  await page.goto("/builder");

  await page.getByTestId("template-switcher-trigger").click();
  await page.getByTestId("template-option-custom-compose").click();
  await page.getByTestId("contract-name-input").fill("Health Smoke");
  await page.getByTestId("sidebar-add-llmPromptNode").click();
  await page.getByTestId("prompt-input").fill("Review the request and return a verdict.");

  await expect(page.getByTestId("flow-health-next-step")).toContainText("Add Output");
  await page.getByTestId("flow-health-quick-action").click();

  await expect(page.locator(".react-flow__node")).toHaveCount(3);
});

test("project JSON export and import restores the builder state", async ({ page }) => {
  await page.goto("/builder");

  await page.getByTestId("template-switcher-trigger").click();
  await page.getByTestId("template-option-custom-compose").click();
  await page.getByTestId("contract-name-input").fill("Portable Smoke");
  await page.getByTestId("sidebar-add-llmPromptNode").click();
  await page
    .getByTestId("prompt-input")
    .fill("Analyze the submission and return a structured result.");

  await page.getByTestId("open-contracts-button").click();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("export-project-document").click(),
  ]);

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  await page.getByTestId("contract-name-input").fill("Changed After Export");

  await page
    .locator('input[type="file"]')
    .setInputFiles(downloadPath!);
  const importDialog = page.getByRole("dialog", { name: "Import this project JSON?" });
  await expect(importDialog).toBeVisible();
  await importDialog.getByRole("button", { name: "Import Project" }).click();

  await expect(page.getByTestId("contract-name-input")).toHaveValue("Portable Smoke");
  await expect(page.getByTestId("prompt-input")).toHaveValue(
    "Analyze the submission and return a structured result."
  );
});

test("behavior preview summarizes the current graph", async ({ page }) => {
  await page.goto("/builder");

  await page.getByTestId("template-switcher-trigger").click();
  await page.getByTestId("template-option-custom-compose").click();
  await page.getByTestId("contract-name-input").fill("Preview Smoke");
  await dragSidebarNodeToCanvas(page, "webFetchNode");
  await dragSidebarNodeToCanvas(page, "llmPromptNode");
  await page.getByTestId("url-input").fill("https://example.com/feed");
  await page
    .getByTestId("prompt-input")
    .fill("Review the fetched data and return a concise verdict.");

  await page.getByTestId("open-simulation-preview").click();
  await expect(page.getByTestId("simulation-preview-panel")).toBeVisible();
  await expect(
    page.getByTestId("simulation-preview-input-preview-url")
  ).toHaveValue("https://example.com/feed");
  await expect(page.getByTestId("simulation-preview-panel")).toContainText("LLM prompt execution");
  await expect(page.getByTestId("simulation-preview-step")).toHaveCount(3);
});

test("wizard recommends Onchain Justice and loads the matching template", async ({
  page,
}) => {
  await page.goto("/builder");

  await page.getByTestId("open-wizard-button").click();
  await expect(page.getByTestId("wizard-overlay")).toBeVisible();

  await page.getByTestId("wizard-goal-ai").click();
  await page.getByTestId("wizard-next-button").click();
  await page.getByTestId("wizard-data-web").click();
  await page.getByTestId("wizard-next-button").click();
  await page.getByTestId("wizard-consensus-non_comparative").click();
  await page.getByTestId("wizard-next-button").click();

  await expect(page.getByTestId("wizard-recommendation-name")).toContainText("Onchain Justice");
  await page.getByTestId("wizard-start-building").click();
  await expect(page.getByTestId("template-switcher-trigger")).toContainText("Onchain Justice");

  await page.getByTestId("contract-name-input").fill("Justice Smoke");
  const downloadButton = page.getByTestId("generated-download-button");
  await expect(downloadButton).toBeDisabled();

  await page.getByTestId("url-input").fill("https://example.com/rules");
  await page
    .getByTestId("prompt-input")
    .fill("Review the dispute summary, evidence bundle, and policy text to produce a fair ruling.");
  await expect(downloadButton).toBeEnabled();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    downloadButton.click(),
  ]);

  expect(download.suggestedFilename()).toBe("justice_smoke.py");

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const content = await readFile(downloadPath!, "utf8");
  expect(content).toContain("Template: Onchain Justice");
  expect(content).toContain("def resolve_case(self) -> str:");
  expect(content).toContain('"https://example.com/rules"');
  expect(content).toContain("Resolve a dispute from evidence and policy");
});

test("featured AI Governance template exports governance consensus code", async ({
  page,
}) => {
  await page.goto("/builder");

  await page.getByTestId("template-switcher-trigger").click();
  await page.getByTestId("template-option-ai-governance").click();
  await expect(page.getByTestId("template-switcher-trigger")).toContainText("AI Governance");

  await page.getByTestId("contract-name-input").fill("Governance Smoke");
  const downloadButton = page.getByTestId("generated-download-button");
  await expect(downloadButton).toBeDisabled();

  await page
    .getByTestId("prompt-input")
    .fill("Recommend a governance decision with structured actions and rationale.");
  await expect(downloadButton).toBeEnabled();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    downloadButton.click(),
  ]);

  expect(download.suggestedFilename()).toBe("governance_smoke.py");

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();

  const content = await readFile(downloadPath!, "utf8");
  expect(content).toContain("Template: AI Governance");
  expect(content).toContain("def coordinate(self, context: str) -> str:");
  expect(content).toContain("Coordinate a governance decision");
  expect(content).toContain(
    "Recommend a governance decision with structured actions and rationale."
  );
});

test("small screens show the unsupported viewport recovery message", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto("/builder");

  await expect(page.getByTestId("unsupported-viewport-dialog")).toBeVisible();
  await expect(page.getByText(/Your current browser draft will restore on desktop/i)).toBeVisible();
});

test("wizard closes on Escape and returns focus to the opener", async ({ page }) => {
  await page.goto("/builder");

  const openWizardButton = page.getByTestId("open-wizard-button");
  await openWizardButton.click();
  await expect(page.getByTestId("wizard-overlay")).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(page.getByTestId("wizard-overlay")).toHaveCount(0);
  await expect(openWizardButton).toBeFocused();
});
