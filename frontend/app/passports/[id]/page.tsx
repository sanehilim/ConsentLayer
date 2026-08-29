import type { Metadata } from "next"
import { PassportDetailPage } from "@/components/passport-detail-page"
export const metadata: Metadata = { title: "Data Passport | ConsentLayer", description: "Inspect dataset permissions and issue an AI data license." }
export default function Page() { return <PassportDetailPage /> }
