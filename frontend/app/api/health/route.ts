import { NextResponse } from "next/server"
import { IS_ONCHAIN_CONFIGURED, OG_CHAIN } from "@/lib/chain-config"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "consentlayer",
    network: { name: OG_CHAIN.chainName, chainId: Number.parseInt(OG_CHAIN.chainId, 16) },
    modes: {
      registry: IS_ONCHAIN_CONFIGURED ? "onchain" : "local-preview",
      compute: process.env.OG_COMPUTE_API_KEY ? "configured" : "unconfigured",
      persistence: "browser-local",
    },
    timestamp: new Date().toISOString(),
  })
}
