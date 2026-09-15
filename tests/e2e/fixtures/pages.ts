/**
 * Page-object helpers for the e2e specs.
 *
 * Keep selectors here (not inside specs) so a markup change only needs a single
 * edit. Modeled after vanta-ui's `fixtures/onboarding.ts` page objects.
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

  headerStartEvaluationButton(): Locator {
    return this.page.getByRole("banner").getByRole("link", { name: "Start evaluation", exact: true });
  }
}

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  email(): Locator {
    return this.page.locator('input[name="email"]');
  }

  password(): Locator {
    return this.page.locator('input[name="password"]');
  }

  submit(): Locator {
    return this.page.getByRole("button", { name: /continue/i });
  }

  async fill(email: string, password: string) {
    await this.email().fill(email);
    await this.password().fill(password);
  }
}

export class SignupPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/signup");
  }

  email(): Locator {
    return this.page.locator('input[name="email"]');
  }

  password(): Locator {
    return this.page.locator('input[name="password"]');
  }

  submit(): Locator {
    return this.page.getByRole("button", { name: /create account/i });
  }
}

export class RequestAccessPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/request-access");
  }

  field(name: string): Locator {
    return this.page.locator(`[name="${name}"]`);
  }

  submit(): Locator {
    return this.page.getByRole("button", { name: /request access/i });
  }
}

export class DocsPage {
  constructor(private readonly page: Page) {}

  async goto(path = "/docs") {
    await this.page.goto(path);
  }

  sidebarLink(name: string): Locator {
    return this.page.getByRole("navigation", { name: "Documentation" }).getByRole("link", { name, exact: true });
  }
}

/** Asserts the browser is still on the given pathname (no client redirect). */
export async function expectPathname(page: Page, pathname: string) {
  await expect(page).toHaveURL(new RegExp(`${pathname.replace(/\//g, "\\/")}(\\?.*)?$`));
}
