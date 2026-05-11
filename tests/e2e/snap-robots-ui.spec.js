// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Digital SNAP Robots (interfaces/digital-pru-snap-robots.html)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/digital-pru-snap-robots.html");
  });

  test("hero, command area, track upload, canvas, dual robots, log", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: /Digital SNAP Robots/i })).toBeVisible();
    await expect(page.locator("#cmd")).toBeVisible();
    await expect(page.locator("#track")).toBeVisible();
    await expect(page.locator("#apiBase")).toBeVisible();
    await expect(page.locator("#wh-canvas")).toBeVisible();
    await expect(page.locator("#btnRun")).toBeVisible();
    await expect(page.locator("#btnStop")).toBeVisible();
    await expect(page.locator("#log")).toBeVisible();
    await expect(page.locator("#bot-a-root")).toBeVisible();
    await expect(page.locator("#carbonHud")).toContainText(/Carbon \(sim\)/i);
    await expect(page.locator("footer").getByText(/simulated Carbon-layer awareness/i)).toBeVisible();
  });

  test("Run SNAP without file → log asks for audio", async ({ page }) => {
    await page.locator("#btnRun").click();
    await expect(page.locator("#log")).toContainText(/Pick an audio file/i);
  });

  test("Three.js warehouse boot logs (Poly Haven / HDRI / three.js)", async ({ page }) => {
    const log = page.locator("#log");
    await expect(log).toContainText(/Warehouse sim|HDRI loaded|HDRI: all Poly Haven fallbacks/i, {
      timeout: 120000,
    });
  });

  test("optional API placeholder and warehouse credit strip", async ({ page }) => {
    await expect(page.locator("#apiBase")).toHaveAttribute("placeholder", /127\.0\.0\.1:8000/);
    await expect(page.locator(".asset-credit")).toContainText(/Poly Haven/i);
    await expect(page.locator(".asset-credit")).toContainText(/three\.js/i);
  });
});
