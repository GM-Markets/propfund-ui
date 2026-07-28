import type { Metadata } from "next";
import { MarketPage } from "../../components/propfund/MarketPage";
import { marketContent } from "../../components/propfund/site-data";
export const metadata: Metadata = { title: "Forex evaluations | Propfund", description: "One-step simulated Forex evaluations across 29 supported currency pairs." };
export default function ForexPage() { return <MarketPage market={marketContent.forex} />; }