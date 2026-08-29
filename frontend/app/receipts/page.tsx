import type { Metadata } from "next"
import { ReceiptsPage } from "@/components/receipts-page"
export const metadata: Metadata = { title: "License Receipts | ConsentLayer", description: "Review local, signed, and 0G payment-backed AI data licenses." }
export default function Page() { return <ReceiptsPage /> }
