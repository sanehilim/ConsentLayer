import type { Metadata } from "next"
import { MarketplacePage } from "@/components/marketplace-page"
export const metadata: Metadata = { title: "Data Marketplace | ConsentLayer", description: "Discover active datasets with machine-readable AI usage permissions." }
export default function Page() { return <MarketplacePage /> }
