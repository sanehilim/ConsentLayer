export const OG_CHAIN = {
  chainId: process.env.NEXT_PUBLIC_OG_CHAIN_ID || "0x40da",
  chainName: process.env.NEXT_PUBLIC_OG_CHAIN_NAME || "0G-Galileo-Testnet",
  rpcUrl: process.env.NEXT_PUBLIC_OG_RPC_URL || "https://evmrpc-testnet.0g.ai",
  explorerUrl: process.env.NEXT_PUBLIC_OG_EXPLORER_URL || "https://chainscan-galileo.0g.ai",
  faucetUrl: process.env.NEXT_PUBLIC_OG_FAUCET_URL || "https://faucet.0g.ai",
  storageIndexerUrl: process.env.NEXT_PUBLIC_OG_STORAGE_INDEXER_URL || "https://indexer-storage-testnet-turbo.0g.ai",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
}

export const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_CONSENTLAYER_REGISTRY_ADDRESS || ""
export const IS_ONCHAIN_CONFIGURED = /^0x[a-fA-F0-9]{40}$/.test(REGISTRY_ADDRESS)
