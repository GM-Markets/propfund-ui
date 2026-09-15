import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import {
  ApiReferenceExplorer,
  type RefArea,
} from "@/components/docs/api-reference-explorer";
import { Callout } from "@/components/docs/blocks";
import {
  API_CATALOG,
  AUTH_LABEL,
  TOTAL_ENDPOINTS,
  type AuthKind,
  type Endpoint,
} from "@/lib/docs/api-catalog";
import { highlight } from "@/lib/docs/highlight";
import { DESK_API_KEY_PLACEHOLDER, PUBLIC_VAN_BASE } from "@/lib/docs/public-api";

export const metadata = { title: "API reference" };

const BASE = PUBLIC_VAN_BASE;
const SWAGGER_URL = `${BASE}/docs`;

const BEARER: Record<AuthKind, string | null> = {
  public: null,
  provider: null,
  desk: null,
  app: "<privy_identity_token>",
  user: "<privy_identity_token>",
  admin: "<admin_token>",
  partner: "<desk_api_key>",
  "partner-trader": "<desk_api_key>",
  "partner-session": "<desk_api_key>",
};

function buildCurl(ep: Endpoint): string {
  const lines: string[] = [`curl -X ${ep.method} ${BASE}${ep.path} \\`];
  if (ep.auth === "desk") {
    lines.push(`  -H "X-Api-Key: ${DESK_API_KEY_PLACEHOLDER}" \\`);
  } else {
    const bearer = BEARER[ep.auth];
    if (bearer) lines.push(`  -H "Authorization: Bearer ${bearer}" \\`);
  }
  if (ep.auth === "partner-trader") lines.push(`  -H "Trader-ID: <hl_wallet | subaccount_id>" \\`);
  if (ep.note?.includes("X-Prop-Account") || ep.auth === "desk") {
    lines.push(`  -H "X-Prop-Account: <prop_account_id>" \\`);
  }
  if (ep.request) {
    lines.push(`  -H "Content-Type: application/json" \\`);
    lines.push(`  -d '${ep.request}'`);
  } else {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/ \\$/, "");
  }
  return lines.join("\n");
}

async function toRefArea(area: (typeof API_CATALOG)[number]): Promise<RefArea> {
  const endpoints = await Promise.all(
    area.endpoints.map(async (ep) => {
      const curl = buildCurl(ep);
      return {
        method: ep.method,
        path: ep.path,
        summary: ep.summary,
        authLabel: AUTH_LABEL[ep.auth],
        note: ep.note,
        runOp: ep.runOp,
        curl,
        curlHtml: await highlight(curl, "bash"),
        requestHtml: ep.request ? await highlight(ep.request, "json") : undefined,
        responseHtml: ep.response ? await highlight(ep.response, "json") : undefined,
      };
    }),
  );
  return {
    id: area.id,
    title: area.title,
    description: area.description,
    docHref: area.docHref,
    endpoints,
  };
}

export default async function ApiReferencePage() {
  const areas = await Promise.all(API_CATALOG.map(toRefArea));

  return (
    <>
      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">Reference</p>
        <h1 className="text-3xl font-semibold tracking-tight">API reference</h1>
        <p className="text-lg text-muted-foreground">
          Every endpoint across the Hyperscaled API — {TOTAL_ENDPOINTS}+ routes
          spanning auth, KYC, payments, payouts, trading, webhooks, admin, and
          the legacy partner-key surface. Search, copy a cURL, and run reads live.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href={SWAGGER_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-secondary/60"
          >
            Open Swagger UI <ArrowUpRight className="size-3.5" />
          </Link>
          <Link
            href={`${BASE}/openapi.json`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-secondary/60"
          >
            openapi.json <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </header>

      <Callout type="tip" title="Run reads without leaving the page">
        Endpoints marked with a “Run it now” button execute live against your
        environment using your signed-in dashboard session. Bot examples use{" "}
        <code>X-Api-Key</code> against <code>https://gate.propfund.io/van</code>.
        Sign in first for in-page reads.
      </Callout>

      <ApiReferenceExplorer areas={areas} />
    </>
  );
}
