/**
 * Sign-in (PRD §2): signed-out users on any /dashboard route see the sign-in
 * panel over the shell, never a separate page. Runs in local test mode
 * (no sign-in app ID, NEXT_PUBLIC_TEST_CONTROLS=true), which CI sets.
 */
import { expect, test } from "@playwright/test";

import { DashboardPage } from "./fixtures/pages";

const TEST_MODE = process.env.NEXT_PUBLIC_TEST_CONTROLS === "true";

test.describe("sign-in gate", () => {
  test("old /login and /signup links land on the dashboard gate", async ({ page }) => {
    const dash = new DashboardPage(page);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(dash.signInPanel()).toBeVisible();
    await page.goto("/signup");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("every dashboard route shows the sign-in panel in place when signed out", async ({ page }) => {
    const dash = new DashboardPage(page);
    for (const path of ["/dashboard", "/dashboard/terminal", "/dashboard/payouts"]) {
      await dash.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(dash.signInPanel()).toBeVisible();
    }
  });

  test("never names the sign-in vendor outside test mode copy", async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();
    const text = await dash.signInPanel().innerText();
    expect(text).toMatch(/Sign in to continue/);
    if (!TEST_MODE) expect(text).not.toMatch(/privy/i);
  });
});

test.describe("local test sign-in", () => {
  test.skip(!TEST_MODE, "Set NEXT_PUBLIC_TEST_CONTROLS=true with no sign-in app ID.");

  test("labels test mode, signs in, shows the shell and signs out", async ({ page }) => {
    const dash = new DashboardPage(page);
    await dash.goto();
    await expect(dash.signInPanel().getByText("Test mode · Privy app ID not set")).toBeVisible();
    await dash.continueAsTestUser().click();

    await expect(dash.accountMenu()).toBeVisible();
    // All app nav lives in the top header bar (no sidebar, no bottom tab bar).
    await expect(dash.nav()).toBeVisible();
    await expect(dash.brandLink()).toBeVisible();
    for (const name of ["Overview", "Challenges", "Terminal", "Payouts", "Wallet", "History"]) {
      await expect(dash.navLink(name)).toBeVisible();
    }
    await expect(dash.navLink("Overview")).toHaveAttribute("aria-current", "page");
    // The public transparency page is reachable from the app, and never active here.
    await expect(dash.secondaryNavLink("Transparency")).toHaveAttribute("href", "/transparency");
    await expect(dash.secondaryNavLink("Transparency")).not.toHaveAttribute("aria-current", "page");
    await expect(page.getByText("No active account")).toBeVisible();

    // The session survives a reload.
    await page.reload();
    await expect(dash.accountMenu()).toBeVisible();

    await dash.accountMenu().click();
    await expect(page.getByText("Your Propfund wallet")).toBeVisible();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(dash.signInPanel()).toBeVisible();
  });
});
