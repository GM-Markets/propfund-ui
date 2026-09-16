/**
 * Public site smoke tests. These render entirely from local data, so they run
 * against a bare `pnpm dev` with no backend or credentials.
 */
import { expect, test } from "@playwright/test";

import { hasHorizontalPageScroll, MarketingPage, TransparencyPage } from "./fixtures/pages";

test.describe("landing page", () => {
  test("renders the hero and primary CTA", async ({ page }) => {
    const home = new MarketingPage(page);
    await home.goto();

    await expect(home.heroHeading()).toContainText(/Pass once/i);
    await expect(home.navLink("Start challenge")).toHaveAttribute("href", "/dashboard/challenges");
  });

  test("the header links to Transparency and Help", async ({ page }) => {
    const home = new MarketingPage(page);
    await home.goto();
    await expect(home.navLink("Transparency")).toHaveAttribute("href", "/transparency");
    await expect(home.navLink("Help")).toHaveAttribute("href", "/help");
  });

  test("package CTAs carry the package id", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("link", { name: /Start \$100K challenge/ })).toHaveAttribute("href", "/dashboard/challenges?package=elite");
  });

  test("links to the numbers and never mentions a waitlist", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /See the numbers/ })).toHaveAttribute("href", "/transparency");
    await expect(page.getByText(/waitlist|request access/i)).toHaveCount(0);
    await expect(page.getByText(/USDC on Base/)).toHaveCount(0);
  });

  test("the old request-access route goes to challenges", async ({ page }) => {
    const response = await page.request.get("/request-access", { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.headers().location).toContain("/dashboard/challenges");
  });
});

test.describe("transparency page", () => {
  test("shows sample badges, every section and unpublished addresses", async ({ page }) => {
    const transparency = new TransparencyPage(page);
    await transparency.goto();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Transparency");
    expect(await transparency.sampleBadges().count()).toBeGreaterThan(5);
    for (const name of ["Overview", "Activity", "Revenue", "Challenges", "Trading", "Funded", "Payouts", "Risk", "Addresses"]) {
      await expect(transparency.sectionNavLink(name)).toBeVisible();
    }
    // Without NEXT_PUBLIC_PAYOUT_WALLET_ARBITRUM / NEXT_PUBLIC_TREASURY_ADDRESSES nothing is invented.
    if (!process.env.NEXT_PUBLIC_PAYOUT_WALLET_ARBITRUM) {
      await expect(page.getByText("Published at launch").first()).toBeVisible();
    }
  });

  test("range switches change the chart", async ({ page }) => {
    await page.goto("/transparency");
    const card = page.locator(".tp-card").filter({ hasText: "Fee revenue" });
    await card.getByRole("button", { name: "7d" }).click();
    await expect(card.getByRole("button", { name: "7d" })).toHaveAttribute("aria-pressed", "true");
  });

  test("has no horizontal page scroll at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/transparency");
    await expect(page.getByRole("navigation", { name: "Transparency sections" })).toBeVisible();
    expect(await hasHorizontalPageScroll(page)).toBe(false);
  });
});
