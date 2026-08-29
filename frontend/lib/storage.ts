import { BrowserProvider } from "ethers"
import { OG_CHAIN } from "@/lib/chain-config"

export type StorageUpload = { rootHash: string; txHash: string }

/** Uploads a browser File to 0G Storage with client-side AES-256 encryption. */
export async function uploadEncryptedTo0g(file: File): Promise<StorageUpload & { key: string }> {
  if (!window.ethereum) throw new Error("Connect a wallet before uploading to 0G Storage.")
  const { Blob: ZgBlob, Indexer } = await import("@0gfoundation/0g-storage-ts-sdk")
  const provider = new BrowserProvider(window.ethereum as never)
  const signer = await provider.getSigner()
  const keyBytes = crypto.getRandomValues(new Uint8Array(32))
  const key = Array.from(keyBytes).map((byte) => byte.toString(16).padStart(2, "0")).join("")
  const blob = new ZgBlob(file)
  const [tree, treeError] = await blob.merkleTree()
  if (treeError) throw new Error(`Could not build a storage Merkle tree: ${treeError}`)
  const indexer = new Indexer(OG_CHAIN.storageIndexerUrl)
  const [tx, uploadError] = await indexer.upload(blob, OG_CHAIN.rpcUrl, signer, { encryption: { type: "aes256", key: keyBytes } })
  if (uploadError) throw new Error(`0G Storage upload failed: ${uploadError}`)
  if ("rootHash" in tx) return { rootHash: tx.rootHash || tree?.rootHash() || "", txHash: tx.txHash, key }
  return { rootHash: tx.rootHashes[0] || tree?.rootHash() || "", txHash: tx.txHashes[0] || "", key }
}
