"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DOCS_NAV } from "@/lib/docs/nav";
import { cn } from "@/lib/utils";

export function DocsSidebar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Documentation" className="space-y-6">
      {DOCS_NAV.map((group) => (
        <div key={group.title}>
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block rounded-md px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-secondary font-medium text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
