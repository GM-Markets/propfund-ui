"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { HELP_NAV } from "@/lib/docs/nav";

function SidebarLinks({ pathname }: { pathname: string }) {
  return (
    <>
      <Link className={pathname === "/help" ? "active" : ""} href="/help" aria-current={pathname === "/help" ? "page" : undefined}>Help center</Link>
      {HELP_NAV.map((group) => (
        <div className="help-nav-group" key={group.title}>
          <p>{group.title}</p>
          <ul>
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link className={active ? "active" : ""} href={item.href} aria-current={active ? "page" : undefined}>{item.label}</Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

/** Help center article list: a sticky sidebar on desktop, a collapsible list on mobile. */
export function DocsSidebar() {
  const pathname = usePathname() ?? "/help";
  const current = HELP_NAV.flatMap((group) => group.items).find((item) => item.href === pathname);
  return (
    <>
      <nav className="help-sidebar" aria-label="Help articles">
        <SidebarLinks pathname={pathname} />
      </nav>
      <details className="help-sidebar-mobile" key={pathname}>
        <summary><span>Articles</span><strong>{current?.label ?? "Help center"}</strong></summary>
        <nav aria-label="Help articles">
          <SidebarLinks pathname={pathname} />
        </nav>
      </details>
    </>
  );
}
