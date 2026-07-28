import type { Metadata } from "next";
import { MarketPage } from "@/components/propfund/MarketPage";
import { marketContent } from "@/components/propfund/site-data";

export const metadata: Metadata = {
  title: "Commodities trading evaluation | Propfund",
  description: "Trade gold, silver, copper, platinum, natural gas, and WTI oil in a one-step simulated evaluation.",
};

export default function CommoditiesPage() {
  return <MarketPage market={marketContent.commodities} />;
}