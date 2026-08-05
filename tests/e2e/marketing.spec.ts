/**
 * Marketing / landing page smoke tests. These render entirely from local data
 * (no hyperscaled-api calls), so they run against a bare `pnpm dev` with no
 * backend, database, or credentials.
 */
import { expect, test } from "@playwright/test";

import { MarketingPage } from "./fixtures/pages";

test.describe("landing page", () => {
  test("renders the hero and primary CTAs", async ({ page }) => {
    const home = new MarketingPage(page);
    await home.goto();

    await expect(home.heroHeading()).toContainText(/Pass the evaluation/i);
    await expect(home.navLink("How it works")).toBeVisible();
    await expect(home.headerStartEvaluationButton()).toBeVisible();
  });

  test("'Start evaluation' opens the evaluation dialog", async ({ page }) => {
    const home = new MarketingPage(page);
    await home.goto();
    await home.headerStartEvaluationButton().click();
    await expect(home.evaluationDialog()).toBeVisible();
  });

  test("'How it works' opens the program guide", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /How it works/i }).first().click();
    await expect(page).toHaveURL(/\/how-it-works$/);
  });

  test("the header rules link opens the rules page", async ({ page }) => {
    const home = new MarketingPage(page);
    await home.goto();
    await home.navLink("Rules").click();
    await expect(page).toHaveURL(/\/rules$/);
  });
});
