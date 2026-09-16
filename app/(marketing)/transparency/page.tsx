import type { Metadata } from "next";

import { HeroDotField } from "@/components/propfund/HeroDotField";
import { PageFrame } from "@/components/propfund/SiteChrome";
import { SampleBadge, TransparencyDashboard } from "@/components/propfund/TransparencyDashboard";
import { getPublishedAddresses } from "@/components/propfund/transparency-config";
import { getTransparencyData, parseTransparencyScale } from "@/components/propfund/transparency-data";
import { formatLongDate } from "@/components/propfund/transparency-format";

export const metadata: Metadata = {
  title: "Transparency | Propfund",
  description: "Challenge, payout and treasury figures, updated daily.",
};

/**
 * `?scale=small|medium|mega` picks the size of the sample business for design
 * review (test controls link to it). Without it the default dataset is shown.
 */
export default async function TransparencyPage({
  searchParams,
}: {
  searchParams: Promise<{ scale?: string | string[] }>;
}) {
  const { scale } = await searchParams;
  const data = getTransparencyData(parseTransparencyScale(scale) ?? undefined);
  const addresses = getPublishedAddresses();

  return (
    <PageFrame>
      <section className="tp-hero">
        <HeroDotField />
        <div className="route-container">
          {data.mode === "sample" && <SampleBadge tone="light" />}
          <h1>Transparency<span>by the numbers</span></h1>
          <p>Challenge, payout and treasury figures, updated daily.</p>
          <small>
            {data.mode === "sample"
              ? `Illustrative sample figures to ${formatLongDate(data.asOf)}. Real figures replace them once Propfund is live.`
              : `Figures to ${formatLongDate(data.asOf)}, UTC.`}
          </small>
        </div>
      </section>
      <TransparencyDashboard addresses={addresses} data={data} />
    </PageFrame>
  );
}
