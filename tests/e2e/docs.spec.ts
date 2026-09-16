/**
 * Help center tests. The developer docs were removed; /docs and every old
 * /docs/* path redirect to /help.
 */
import { expect, test } from "@playwright/test";

import { hasHorizontalPageScroll, HelpPage } from "./fixtures/pages";

test.describe("help center", () => {
  test("the index lists the trader articles", async ({ page }) => {
    const help = new HelpPage(page);
    await help.goto();

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Help center");
    for (const name of ["Getting started", "Paying for a challenge", "Payouts and identity verification", "FAQ"]) {
      await expect(help.sidebarLink(name)).toBeVisible();
    }
  });

  test("navigates to an article", async ({ page }) => {
    const help = new HelpPage(page);
    await help.goto();
    await help.sidebarLink("Paying for a challenge").click();
    await expect(page).toHaveURL(/\/help\/paying-for-a-challenge$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Paying for a challenge");
    await expect(page.getByText(/Send only USDC or USDT on Arbitrum, Ethereum, Base or BNB Chain/)).toBeVisible();
  });

  for (const path of ["/docs", "/docs/api-reference", "/docs/authentication", "/docs/quickstart"]) {
    test(`${path} redirects to /help`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/help$/);
    });
  }

  test("articles have no horizontal page scroll at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/help/challenge-rules");
    expect(await hasHorizontalPageScroll(page)).toBe(false);
  });
});
