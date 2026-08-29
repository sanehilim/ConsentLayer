import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"
const requestSchema = z.object({ model: z.string().min(1).max(160), messages: z.array(z.object({ role: z.enum(["system", "user", "assistant"]), content: z.string().min(1).max(20_000) })).min(1).max(40) })

export async function POST(request: Request) {
  const apiKey = process.env.OG_COMPUTE_API_KEY
  const baseUrl = process.env.OG_COMPUTE_BASE_URL || "https://router-api.0g.ai/v1"
  if (!apiKey) return NextResponse.json({ error: "Compute is not configured on this deployment." }, { status: 503 })
  try {
    const payload = requestSchema.safeParse(await request.json())
    if (!payload.success) return NextResponse.json({ error: "Invalid compute request." }, { status: 400 })
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(payload.data), cache: "no-store" })
    const body = await response.json()
    return NextResponse.json(body, { status: response.status })
  } catch { return NextResponse.json({ error: "Compute provider is unavailable." }, { status: 502 }) }
}
