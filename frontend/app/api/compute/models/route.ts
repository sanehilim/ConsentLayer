import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  const apiKey = process.env.OG_COMPUTE_API_KEY
  const baseUrl = process.env.OG_COMPUTE_BASE_URL || "https://router-api.0g.ai/v1"
  if (!apiKey) return NextResponse.json({ error: "Compute is not configured on this deployment." }, { status: 503 })
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/models`, { headers: { Authorization: `Bearer ${apiKey}` }, next: { revalidate: 60 } })
    const body = await response.json()
    return NextResponse.json(body, { status: response.status })
  } catch { return NextResponse.json({ error: "Compute provider is unavailable." }, { status: 502 }) }
}
