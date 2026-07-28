import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Propfund landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Propfund \| One-Step Trading Evaluations<\/title>/i);
  assert.match(html, /Pass once\./);
  assert.match(html, /Keep the upside\./);
  assert.match(html, /Trade the markets you know\./);
  assert.match(html, /One evaluation\. Then you trade\./);
  assert.match(html, /A few things traders usually ask\./i);
  assert.match(html, /100% eligible/i);
  assert.doesNotMatch(html, /Powered by Vanta|Vanta-backed|Vanta Trading|GMM at the front\. Vanta underneath\./i);
  assert.match(html, /simulated trading evaluations/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
});

test("renders every program, market, pricing, and legal route", async () => {
  const routes = [
    ["/how-it-works", /Pass once\. Know what comes next/i],
    ["/forex", /Trade your session\. Take your time/i],
    ["/crypto", /Trade crypto on your schedule/i],
    ["/equities", /More than 1,000 ways to find your setup/i],
    ["/rules", /Trading rules/i],
    ["/pricing", /evaluation fee/i],
    ["/privacy-policy", /Privacy policy/i],
    ["/terms-of-service", /Terms of service/i],
    ["/refund-policy", /Refund policy/i],
  ];

  for (const [pathname, content] of routes) {
    const response = await render(pathname);
    assert.equal(response.status, 200, `${pathname} should render`);
    const html = await response.text();
    assert.match(html, content);
    assert.match(html, /propfund/i);
    assert.doesNotMatch(html, /vantatrading\.io|Vanta Trading/i);
  }
});

test("shows final Propfund fees without reference-price language", async () => {
  const response = await render("/pricing");
  const html = await response.text();
  for (const fee of ["$12", "$19.50", "$42", "$79.50", "$149.50"]) {
    assert.match(html, new RegExp(fee.replace("$", "\\$")));
  }
  assert.doesNotMatch(html, /reference price|was \$|50% off|strikethrough/i);
});

test("keeps the finished site free of starter preview code", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /vantatrading|https?:\/\//i);
  assert.match(page, /hero-feature-grid/);
  assert.match(page, /comparison-table-section/);
  assert.match(layout, /Propfund \| One-Step Trading Evaluations/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await access(new URL("../public/og.png", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview", projectRoot)));
});