/**
 * End-to-end happy path on the local mock service (PRD §12):
 * test sign-in → buy a challenge → trade → close.
 *
 * The screens are built on top of the foundation, so this spec is opt-in and
 * selectors may need updating as screens land. Run with:
 *   E2E_RUN_ONBOARDING=1 NEXT_PUBLIC_TEST_CONTROLS=true pnpm test:e2e tests/e2e/onboarding.spec.ts
 */
import { expect, test } from "@playwright/test";

import { DashboardPage } from "./fixtures/pages";

test.describe("onboarding happy path", () => {
  test.skip(
    !process.env.E2E_RUN_ONBOARDING || process.env.NEXT_PUBLIC_TEST_CONTROLS !== "true",
    "Set E2E_RUN_ONBOARDING=1 and NEXT_PUBLIC_TEST_CONTROLS=true (no sign-in app ID).",
  );

  test("sign in, buy a challenge by card, trade, close", async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.signInAsTestUser();

    // Challenges → checkout sheet → card (test mode) → account created.
    await dash.navLink("Challenges").click();
    await expect(page).toHaveURL(/\/dashboard\/challenges$/);
    await page.getByRole("button", { name: /Core/ }).first().click();
    await page.getByRole("checkbox", { name: "I agree to the Trading Rules and Terms" }).check();
    await page.getByRole("button", { name: /Pay by card/i }).click();
    await page.getByRole("button", { name: /Complete test payment/i }).click();
    await expect(page.getByTestId("header-equity")).toHaveText("$10,000.00");

    // Terminal → market buy → close.
    await dash.navLink("Terminal").click();
    await expect(page).toHaveURL(/\/dashboard\/terminal$/);
    await page.getByRole("button", { name: "Buy", exact: true }).click();
    await page.getByLabel(/Size/i).fill("1000");
    await page.getByRole("button", { name: /Place buy order/i }).click();
    await expect(page.getByRole("tab", { name: /Positions/ })).toContainText("1");

    await page.getByRole("button", { name: "Close" }).first().click();
    await expect(page.getByRole("tab", { name: /Positions/ })).not.toContainText("1");
  });
});
