import type { Metadata } from "next";
import { MarketPage } from "@/components/propfund/MarketPage";
import { marketContent } from "@/components/propfund/site-data";
export const metadata: Metadata = { title: "Crypto challenges | Propfund", description: "One-step simulated crypto challenges across 30 supported assets." };
export default function CryptoPage() { return <MarketPage market={marketContent.crypto} />; }