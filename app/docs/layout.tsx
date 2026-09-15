import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, LayoutDashboard } from "lucide-react";

import { Brand } from "@/components/brand";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { DocsToc } from "@/components/docs/toc";
import { PageFade } from "@/components/motion/page-fade";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";
import { PUBLIC_VAN_BASE } from "@/lib/docs/public-api";

export const metadata: Metadata = {
  title: {
    default: "Docs",
    template: `%s · ${BRAND_NAME} Docs`,
  },
  description:
    "Developer documentation for building on hyperscaled-api: auth, KYC, payments, payouts, trading, API keys and webhooks.",
};

const SWAGGER_URL = `${PUBLIC_VAN_BASE}/docs`;

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border glass">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Brand />
          </Link>
          <span className="hidden items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground sm:inline-flex">
            <BookOpen className="size-3" /> Docs
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/docs/api-reference">API reference</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <a href={SWAGGER_URL} target="_blank" rel="noreferrer">
                OpenAPI <ArrowUpRight className="size-3.5" />
              </a>
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard">
                <LayoutDashboard className="size-3.5" /> Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6">
        <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-56 shrink-0 overflow-y-auto lg:block">
          <DocsSidebar />
        </aside>
        <main className="min-w-0 flex-1 pb-16">
          <article className="max-w-3xl [&_h2]:scroll-mt-28 [&_h3]:scroll-mt-28">
            <PageFade className="space-y-12">{children}</PageFade>
          </article>
        </main>
        <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-56 shrink-0 overflow-y-auto xl:block">
          <DocsToc />
        </aside>
      </div>
    </div>
  );
}
