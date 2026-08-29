import type { Metadata } from "next"
import { ComputePage } from "@/components/compute-page"

export const metadata: Metadata = { title: "0G Compute | ConsentLayer", description: "Run permission-aware AI inference through the 0G Compute gateway." }
export default function Page() { return <ComputePage /> }
