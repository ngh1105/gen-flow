import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("genflow-welcome-dismissed-v2", "true");
    localStorage.removeItem("genflow-contracts");
  });
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
  await expect(savedRow).toHaveCount(0);
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

test("builder supports switching between visual and code mode", async ({ page }) => {
  await page.goto("/builder");

  await page.getByTestId("mode-toggle-code").click();
  await expect(page.getByTestId("editor-download-button")).toBeVisible();

  await page.getByTestId("mode-toggle-visual").click();
  await expect(page.getByTestId("generated-download-button")).toBeVisible();
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
