/**
 * Page-object helpers for the e2e specs.
 *
 * Keep selectors here (not inside specs) so a markup change only needs a single
 * edit. Page-object pattern.
 */
import { expect, type Locator, type Page } from "@playwright/test";

export class MarketingPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/");
  }

  heroHeading(): Locator {
    return this.page.getByRole("heading", { level: 1 });
  }

  navLink(name: string | RegExp): Locator {
    return this.page.getByRole("banner").getByRole("link", { name });
  }
}

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto(path = "/dashboard") {
    await this.page.goto(path);
  }

  /** The sign-in panel shown over the blurred shell when signed out. */
  signInPanel(): Locator {
    return this.page.getByRole("dialog", { name: "Sign in to continue" });
  }

  /** Local test sign-in (no sign-in app ID + NEXT_PUBLIC_TEST_CONTROLS=true). */
  continueAsTestUser(): Locator {
    return this.page.getByRole("button", { name: "Continue as test user" });
  }

  /** The app nav inside the top header bar (inline on lg+, scrolling row below lg). */
  nav(): Locator {
    return this.page.getByRole("banner").getByRole("navigation", { name: "App" });
  }

  navLink(name: string): Locator {
    return this.nav().getByRole("link", { name, exact: true });
  }

  /** Public pages linked after the divider; never marked as the current page. */
  secondaryNavLink(name: string): Locator {
    return this.nav().getByRole("link", { name: new RegExp(`^${name}$`) });
  }

  brandLink(): Locator {
    return this.page.getByRole("banner").getByRole("link", { name: "Propfund overview" });
  }

  accountMenu(): Locator {
    return this.page.getByRole("button", { name: "Account menu" });
  }

  testControls(): Locator {
    return this.page.getByRole("button", { name: "Test controls" });
  }

  async signInAsTestUser() {
    await this.goto();
    await expect(this.signInPanel()).toBeVisible();
    await this.continueAsTestUser().click();
    await expect(this.accountMenu()).toBeVisible();
  }
}

export class HelpPage {
  constructor(private readonly page: Page) {}

  async goto(path = "/help") {
    await this.page.goto(path);
  }

  /** Desktop sidebar link (the mobile list is a separate, collapsed nav). */
  sidebarLink(name: string): Locator {
    return this.page.locator(".help-sidebar").getByRole("link", { name, exact: true });
  }
}

export class TransparencyPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/transparency");
  }

  sectionNavLink(name: string): Locator {
    return this.page.getByRole("navigation", { name: "Transparency sections" }).getByRole("link", { name, exact: true });
  }

  sampleBadges(): Locator {
    return this.page.getByText("Sample data", { exact: true });
  }
}

/** True when the document is wider than the viewport (horizontal page scroll). */
export async function hasHorizontalPageScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}

/** Asserts the browser is still on the given pathname (no client redirect). */
export async function expectPathname(page: Page, pathname: string) {
  await expect(page).toHaveURL(new RegExp(`${pathname.replace(/\//g, "\\/")}(\\?.*)?$`));
}
