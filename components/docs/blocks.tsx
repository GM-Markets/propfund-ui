import * as React from "react";
import { Info, TriangleAlert, Lightbulb } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const METHOD_STYLES: Record<string, string> = {
  GET: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  POST: "text-success border-success/30 bg-success/10",
  PUT: "text-warning border-warning/30 bg-warning/10",
  PATCH: "text-warning border-warning/30 bg-warning/10",
  DELETE: "text-destructive border-destructive/30 bg-destructive/10",
};

export function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold",
        METHOD_STYLES[method] ?? "text-muted-foreground border-border",
      )}
    >
      {method}
    </span>
  );
}

export function Endpoint({
  method,
  path,
  auth,
  children,
}: {
  method: string;
  path: string;
  auth?: "user" | "app" | "public" | "desk";
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2">
        <MethodBadge method={method} />
        <code className="font-mono text-sm">{path}</code>
        {auth && (
          <Badge
            variant={auth === "public" ? "secondary" : "outline"}
            className="ml-auto text-[11px]"
          >
            {auth === "desk" ? "X-Api-Key" : auth === "user" || auth === "app" ? "Privy Bearer" : "Public"}
          </Badge>
        )}
      </div>
      {children}
    </div>
  );
}

export type Param = {
  name: string;
  type: string;
  required?: boolean;
  desc: string;
};

export function ParamTable({ title, rows }: { title?: string; rows: Param[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {title && (
        <div className="border-b border-border bg-secondary/40 px-3 py-2 text-xs font-medium text-muted-foreground">
          {title}
        </div>
      )}
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-border/60 last:border-0">
              <td className="whitespace-nowrap px-3 py-2 align-top">
                <code className="font-mono text-xs text-foreground">{r.name}</code>
              </td>
              <td className="whitespace-nowrap px-3 py-2 align-top">
                <span className="font-mono text-xs text-muted-foreground">{r.type}</span>
              </td>
              <td className="px-3 py-2 align-top">
                {r.required ? (
                  <Badge variant="outline" className="text-[10px]">
                    required
                  </Badge>
                ) : (
                  <span className="text-[10px] text-muted-foreground/60">optional</span>
                )}
              </td>
              <td className="px-3 py-2 align-top text-muted-foreground">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: "info" | "warning" | "tip";
  title?: string;
  children: React.ReactNode;
}) {
  const Icon = type === "warning" ? TriangleAlert : type === "tip" ? Lightbulb : Info;
  const tone =
    type === "warning"
      ? "border-warning/30 bg-warning/5 text-warning"
      : type === "tip"
        ? "border-primary/30 bg-primary/5 text-primary"
        : "border-sky-400/30 bg-sky-400/5 text-sky-400";
  return (
    <div className={cn("flex gap-3 rounded-lg border p-4", tone)}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1 text-sm text-foreground/90">
        {title && <p className="font-medium text-foreground">{title}</p>}
        <div className="text-muted-foreground [&_a]:text-primary [&_a]:underline">
          {children}
        </div>
      </div>
    </div>
  );
}

export function DocSection({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 space-y-5 pt-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold leading-tight tracking-tight">{title}</h2>
        {description && (
          <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}
