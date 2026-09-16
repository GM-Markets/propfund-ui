import * as React from "react";

import { MaterialIcon } from "@/components/propfund/MaterialIcon";

/** Plain data table for rules, fees and status tables in help articles. Stacks into cards on small screens. */
export function DataTable({
  caption,
  head,
  rows,
}: {
  caption?: string;
  head: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="help-table">
      <table data-cols={head.length}>
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) =>
                j === 0 ? (
                  <th key={j} scope="row" data-label={head[j]}>{cell}</th>
                ) : (
                  <td key={j} data-label={head[j]}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const calloutIcons = { info: "info", warning: "warning", tip: "lightbulb" } as const;

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: keyof typeof calloutIcons;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`help-callout help-callout-${type}`} role={type === "warning" ? "note" : undefined}>
      <MaterialIcon name={calloutIcons[type]} />
      <div>
        {title && <strong>{title}</strong>}
        <div>{children}</div>
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
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="help-section" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {description && <p className="help-section-lede">{description}</p>}
      {children}
    </section>
  );
}

/** Numbered steps, e.g. a deposit flow. */
export function Steps({ items }: { items: { title: string; body: React.ReactNode }[] }) {
  return (
    <ol className="help-steps">
      {items.map((item) => (
        <li key={item.title}>
          <strong>{item.title}</strong>
          <p>{item.body}</p>
        </li>
      ))}
    </ol>
  );
}
