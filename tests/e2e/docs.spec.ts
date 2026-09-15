/**
 * Docs navigation tests. The docs render from a local catalog/nav (no backend),
 * so these run against a bare dev server. We deliberately do NOT click the
 * "Run it now" panels — those call the live API and are covered elsewhere.
 */
import { expect, test } from "@playwright/test";

import { DocsPage } from "./fixtures/pages";

test.describe("docs", () => {
  test("the index renders with the sidebar groups", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.goto();

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(docs.sidebarLink("Quickstart")).toBeVisible();
    await expect(docs.sidebarLink("Authentication")).toBeVisible();
    await expect(docs.sidebarLink("Full API reference")).toBeVisible();
  });

  test("navigates from the index to the quickstart", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.goto();
    await docs.sidebarLink("Quickstart").click();
    await expect(page).toHaveURL(/\/docs\/quickstart$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("navigates to the authentication page", async ({ page }) => {
    const docs = new DocsPage(page);
    await docs.goto();
    await docs.sidebarLink("Authentication").click();
    await expect(page).toHaveURL(/\/docs\/authentication$/);
  });

  test("renders the full API reference", async ({ page }) => {
    await page.goto("/docs/api-reference");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // The reference lists real endpoints from the catalog.
    await expect(page.getByText("/v2/me").first()).toBeVisible();
  });
});
