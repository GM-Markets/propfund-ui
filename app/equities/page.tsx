import type { Metadata } from "next";
import { MarketPage } from "../../components/propfund/MarketPage";
import { marketContent } from "../../components/propfund/site-data";
export const metadata: Metadata = { title: "Equities evaluations | Propfund", description: "One-step simulated equities evaluations across 1,000+ US stocks and sector ETFs." };
export default function EquitiesPage() { return <MarketPage market={marketContent.equities} />; }