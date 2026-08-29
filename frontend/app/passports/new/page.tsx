import type { Metadata } from "next"
import { NewPassportPage } from "@/components/new-passport-page"
export const metadata: Metadata = { title: "Create Data Passport | ConsentLayer", description: "Define machine-readable permissions, pricing, privacy, and license validity for a dataset." }
export default function Page() { return <NewPassportPage /> }
