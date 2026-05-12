// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Snap robots demo (interfaces/digital-pru-snap-robots.html)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/digital-pru-snap-robots.html");
  });

  test("heading, controls, canvas, dual robots, Go and Stop", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: /Digital Pru.*sim command deck/i })).toBeVisible();
    await expect(page.locator("#cmd")).toBeVisible();
    await expect(page.locator("#track")).toBeVisible();
    await expect(page.locator("#wh-canvas")).toBeVisible();
    await expect(page.locator("#btnGo")).toBeVisible();
    await expect(page.locator("#btnStop")).toBeVisible();
    await expect(page.locator("#playStatus")).toBeVisible();
    await expect(page.locator("#bot-a-root")).toBeVisible();
    await expect(page.locator("#bot-b-root")).toBeVisible();
  });

  test("Go without file → status asks for audio", async ({ page }) => {
    await page.locator("#btnGo").click();
    await expect(page.locator("#playStatus")).toContainText(/Choose an audio file/i);
  });

  test("Three.js warehouse scene becomes ready", async ({ page }) => {
    await expect(page.locator("#wh-stage")).toHaveAttribute("data-gl", "ok", { timeout: 120000 });
  });

  test("site map link", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Site map/i })).toHaveAttribute("href", "/surfaces.html");
  });
});
