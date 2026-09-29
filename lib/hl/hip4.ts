export type Hip4Market = {
  coin: string;
  wire: string;
  mid: number;
  max_leverage: number;
  label: string;
  dex: string;
  kind: "hip4";
};

type OutcomeSide = { name?: unknown };
type RawOutcome = {
  outcome?: unknown;
  name?: unknown;
  description?: unknown;
  sideSpecs?: unknown;
};
type RawQuestion = {
  question?: unknown;
  name?: unknown;
  description?: unknown;
  fallbackOutcome?: unknown;
  namedOutcomes?: unknown;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function asName(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asInt(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

export function parseOutcomeFields(description: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of description.split("|")) {
    const split = part.indexOf(":");
    if (split <= 0) continue;
    out[part.slice(0, split).trim()] = part.slice(split + 1).trim();
  }
  return out;
}

export function formatOutcomeWhen(raw: string | undefined): string {
  if (!raw) return "";
  const match = /^(\d{4})(\d{2})(\d{2})/.exec(raw);
  if (!match) return raw;
  const month = MONTHS[Number(match[2]) - 1];
  if (!month) return raw;
  return `${month} ${Number(match[3])}`;
}

export function formatOutcomeMoney(raw: string | undefined): string {
  if (!raw) return "";
  const n = Number(raw);
  if (!Number.isFinite(n)) return raw;
  return n >= 1000
    ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
    : `$${n}`;
}

function sideTitle(spec: string, fields: Record<string, string>, fallback: string): string {
  const raw = spec.replace(/^template:/, "");
  if (raw === "Yes" || raw === "No") return raw;
  const interpolated = raw.replace(/\{(\w+)\}/g, (_, key: string) => fields[key] ?? "");
  return interpolated.trim() || fallback;
}

export function formatHip4Label(
  outcome: { name?: string; description?: string },
  sideIndex: number,
  question?: { description?: string } | null,
): string {
  const fields = {
    ...parseOutcomeFields(question?.description ?? ""),
    ...parseOutcomeFields(outcome.description ?? ""),
  };
  const template = (outcome.name ?? "").replace(/^template:/, "");
  const fallbackSide = sideIndex === 0 ? "Yes" : "No";
  const side = fallbackSide;
  const when = formatOutcomeWhen(fields.time || fields.expiry || fields.dateTime || fields.resolutionDeadline);
  const asset = (fields.perp || fields.underlying || "").toUpperCase();

  if (template === "priceTouch") {
    return [asset, "touch", formatOutcomeMoney(fields.target), when, "·", side].filter(Boolean).join(" ");
  }
  if (template === "binaryPrice" || fields.class === "priceBinary") {
    return [asset, "≥", formatOutcomeMoney(fields.threshold || fields.targetPrice), when, "·", side]
      .filter(Boolean)
      .join(" ");
  }
  if (template === "companyIpoConfirmed") {
    return [fields.company, "IPO", when ? `by ${when}` : "", "·", side].filter(Boolean).join(" ");
  }
  if (template === "sportsContestWinner") {
    const a = fields.shortNameA || fields.participantA || "A";
    const b = fields.shortNameB || fields.participantB || "B";
    const pick = sideIndex === 0 ? a : b;
    return `${a} vs ${b} · ${pick}`;
  }
  if (fields.participant) {
    const league = fields.competition || fields.sport || "";
    return [fields.participant, league, "·", side].filter(Boolean).join(" ");
  }
  if (template.toLowerCase().includes("fallback") || fields.other === "other" || outcome.description === "other") {
    const league = fields.competition || "Other";
    return `${league} · Other · ${side}`;
  }
  if (template.startsWith("policyRate")) {
    const kind =
      template === "policyRateIncrease" ? "hike" : template === "policyRateDecrease" ? "cut" : "hold";
    return `Rate ${kind} · ${side}`;
  }
  return [`#${template || "outcome"}`, when, "·", side].filter(Boolean).join(" ");
}

export function hip4Wire(outcomeId: number, sideIndex: number): string {
  return `#${outcomeId}${sideIndex}`;
}

export function parseOutcomeCatalog(payload: unknown, mids?: Record<string, string>): Hip4Market[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as { outcomes?: unknown; questions?: unknown };
  const outcomes = Array.isArray(root.outcomes) ? (root.outcomes as RawOutcome[]) : [];
  const questions = Array.isArray(root.questions) ? (root.questions as RawQuestion[]) : [];
  const questionByOutcome = new Map<number, RawQuestion>();
  for (const question of questions) {
    const named = Array.isArray(question.namedOutcomes) ? question.namedOutcomes : [];
    const ids = [...named, question.fallbackOutcome];
    for (const raw of ids) {
      const id = asInt(raw);
      if (id != null) questionByOutcome.set(id, question);
    }
  }

  const out: Hip4Market[] = [];
  for (const row of outcomes) {
    const id = asInt(row.outcome);
    if (id == null) continue;
    const specs = Array.isArray(row.sideSpecs) ? (row.sideSpecs as OutcomeSide[]) : [{}, {}];
    const question = questionByOutcome.get(id);
    const sides = specs.length >= 2 ? specs.slice(0, 2) : [{ name: "Yes" }, { name: "No" }];
    sides.forEach((spec, sideIndex) => {
      const wire = hip4Wire(id, sideIndex);
      const fields = {
        ...parseOutcomeFields(asName(question?.description)),
        ...parseOutcomeFields(asName(row.description)),
      };
      const title = formatHip4Label(
        { name: asName(row.name), description: asName(row.description) },
        sideIndex,
        question ? { description: asName(question.description) } : null,
      );
      const sideName = sideTitle(asName(spec.name), fields, sideIndex === 0 ? "Yes" : "No");
      const label = title.includes(sideName) ? title : `${title} · ${sideName}`;
      const mid = Number(mids?.[wire] ?? 0);
      out.push({
        coin: wire,
        wire,
        mid: Number.isFinite(mid) && mid > 0 ? mid : 0,
        max_leverage: 1,
        label,
        dex: "out",
        kind: "hip4",
      });
    });
  }
  return out.sort((a, b) => a.label.localeCompare(b.label) || a.coin.localeCompare(b.coin));
}
