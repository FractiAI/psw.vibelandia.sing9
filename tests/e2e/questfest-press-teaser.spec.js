const { test, expect } = require("@playwright/test");

test.describe("QUESTFEST press FEATURE teaser", () => {
  test("teaser links to full press release and archive", async ({ page }) => {
    await page.goto("/vibelandia-questfest.html");
    const feature = page.locator(".qf-feature");
    await expect(feature).toBeVisible();
    await expect(feature.locator(".badge")).toContainText(/FEATURE/i);
    const main = feature.locator("a.main");
    await expect(main).toHaveAttribute("href", /press-release-hit-factory-30-day-showdown-may-2026\.html/);
    await main.click();
    await expect(page).toHaveURL(/press-release-hit-factory-30-day-showdown-may-2026\.html/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/30-day showdown/i);
  });
});
