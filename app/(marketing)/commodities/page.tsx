import type { Metadata } from "next";
import { MarketPage } from "@/components/propfund/MarketPage";
import { marketContent } from "@/components/propfund/site-data";

export const metadata: Metadata = {
  title: "Commodities trading challenge | Propfund",
  description: "Trade gold, silver, copper, platinum, natural gas, and WTI oil in a one-step simulated challenge.",
};

export default function CommoditiesPage() {
  return <MarketPage market={marketContent.commodities} />;
}