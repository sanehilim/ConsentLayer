import type { Metadata } from "next"
import { SettingsPage } from "@/components/settings-page"

export const metadata: Metadata = {
  title: "Settings | ConsentLayer",
  description: "Manage your ConsentLayer wallet connection and local workspace backups.",
}

export default function Page() { return <SettingsPage /> }
