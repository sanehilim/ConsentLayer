import type { Metadata } from "next"
import { DashboardPage } from "@/components/dashboard-page"
export const metadata: Metadata = { title: "Dashboard | ConsentLayer", description: "Review your dataset passports, active licenses, and confirmed 0G volume." }
export default function Page() { return <DashboardPage /> }
