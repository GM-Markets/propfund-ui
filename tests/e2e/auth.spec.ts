/**
 * Auth page tests for Privy login. Email/password signup now redirects here.
 */
import { expect, test } from "@playwright/test";

test.describe("login page", () => {
  test("renders sign-in", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Start your evaluation/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue/i })).toBeVisible();
  });
});

test.describe("legacy auth routes", () => {
  test("signup redirects to login", async ({ page }) => {
    await page.goto("/signup");
    await expect(page).toHaveURL(/\/login/);
  });

  test("reset-password redirects to login", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page).toHaveURL(/\/login/);
  });
});
