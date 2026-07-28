import type { Metadata } from "next";
import { MarketPage } from "../../components/propfund/MarketPage";
import { marketContent } from "../../components/propfund/site-data";
export const metadata: Metadata = { title: "Crypto evaluations | Propfund", description: "One-step simulated crypto evaluations across 30 supported assets." };
export default function CryptoPage() { return <MarketPage market={marketContent.crypto} />; }