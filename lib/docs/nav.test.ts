import { describe, expect, it } from "vitest";

import { getAdjacentArticles, getHelpArticle, HELP_ARTICLES, HELP_FOR_ROUTE, HELP_NAV } from "./nav";

describe("HELP_NAV", () => {
  it("lists the PRD §11 help articles in order", () => {
    expect(HELP_ARTICLES.map((item) => item.label)).toEqual([
      "Getting started",
      "Sign-in and wallet",
      "Paying for a challenge",
      "Challenge rules",
      "Funded account",
      "Payouts and identity verification",
      "Violations",
      "FAQ",
    ]);
  });

  it("every item has a label, a description and a /help href built from its slug", () => {
    for (const group of HELP_NAV) {
      expect(group.items.length).toBeGreaterThan(0);
      for (const item of group.items) {
        expect(item.label.trim().length).toBeGreaterThan(0);
        expect(item.description.trim().length).toBeGreaterThan(0);
        expect(item.href).toBe(`/help/${item.slug}`);
      }
    }
  });

  it("has no developer docs (no API, OAuth, API keys, webhooks or quickstart)", () => {
    const text = JSON.stringify(HELP_NAV).toLowerCase();
    for (const term of ["api", "oauth", "webhook", "quickstart", "/docs"]) {
      expect(text).not.toContain(term);
    }
  });

  it("has no duplicate slugs", () => {
    const slugs = HELP_ARTICLES.map((item) => item.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("finds articles and their neighbours", () => {
    expect(getHelpArticle("faq")?.label).toBe("FAQ");
    expect(getHelpArticle("api-reference")).toBeUndefined();
    expect(getAdjacentArticles("getting-started")).toEqual({ previous: undefined, next: HELP_ARTICLES[1] });
    expect(getAdjacentArticles("faq").next).toBeUndefined();
    expect(getAdjacentArticles("missing")).toEqual({});
  });
});

describe("HELP_FOR_ROUTE", () => {
  it("maps dashboard routes to help articles in the nav", () => {
    const hrefs = new Set(HELP_ARTICLES.map((item) => item.href));
    for (const [route, href] of Object.entries(HELP_FOR_ROUTE)) {
      expect(route.startsWith("/dashboard")).toBe(true);
      expect(hrefs.has(href)).toBe(true);
    }
  });
});
