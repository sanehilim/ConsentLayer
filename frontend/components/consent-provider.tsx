"use client"

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Dataset, datasetSchema, DEMO_DATASETS, downloadJson, hashValue, License, licenseSchema, makeId, OG_NETWORK, parseOgToWeiHex, permissionForPurpose, workspaceSchema } from "@/lib/consent-data"
import { BrowserProvider, Contract, keccak256, toUtf8Bytes, ZeroHash } from "ethers"
import { IS_ONCHAIN_CONFIGURED, OG_CHAIN, REGISTRY_ADDRESS } from "@/lib/chain-config"
import { REGISTRY_ABI } from "@/lib/registry-abi"

type Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on?: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
}
declare global { interface Window { ethereum?: Provider } }

type Notice = { kind: "success" | "error" | "info"; text: string }
type CreateInput = Omit<Dataset, "id" | "owner" | "hash" | "createdAt" | "updatedAt" | "status" | "version">
type ConsentContextValue = {
  datasets: Dataset[]
  licenses: License[]
  wallet: string | null
  networkReady: boolean
  hydrated: boolean
  notice: Notice | null
  connectWallet: () => Promise<void>
  dismissNotice: () => void
  showNotice: (text: string, kind?: Notice["kind"]) => void
  createDataset: (input: CreateInput) => Promise<string>
  issueLicense: (dataset: Dataset, purpose: string) => Promise<boolean>
  revokeDataset: (id: string) => Promise<boolean>
  refreshTransactions: () => Promise<void>
  exportWorkspace: () => void
  importWorkspace: (data: unknown) => boolean
  resetWorkspace: () => void
  clearLicenses: () => void
}

const DATASETS_KEY = "consentlayer.datasets"
const LICENSES_KEY = "consentlayer.licenses"
const ConsentContext = createContext<ConsentContextValue | null>(null)

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message
  return fallback
}

function browserProvider() {
  if (!window.ethereum) return null
  return new BrowserProvider(window.ethereum as never)
}

function registryContract(runner: unknown) {
  return new Contract(REGISTRY_ADDRESS, REGISTRY_ABI, runner as never)
}

function chainDatasetId(id: string) { return keccak256(toUtf8Bytes(id)) }
function chainPurposeId(purpose: string) { return keccak256(toUtf8Bytes(purpose)) }
function asBytes32Hash(value: string) { return /^0x[0-9a-fA-F]{64}$/.test(value) ? value : ZeroHash }

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [datasets, setDatasets] = useState<Dataset[]>(DEMO_DATASETS)
  const [licenses, setLicenses] = useState<License[]>([])
  const [wallet, setWallet] = useState<string | null>(null)
  const [networkReady, setNetworkReady] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const showNotice = useCallback((text: string, kind: Notice["kind"] = "info") => setNotice({ text, kind }), [])

  useEffect(() => {
    function readWorkspace() {
      try {
        const savedDatasets = window.localStorage.getItem(DATASETS_KEY)
        const savedLicenses = window.localStorage.getItem(LICENSES_KEY)
        if (savedDatasets) {
          const parsed = datasetSchema.array().safeParse(JSON.parse(savedDatasets))
          if (parsed.success) setDatasets(parsed.data)
          else showNotice("Some saved passport data was invalid and was not loaded.", "error")
        }
        if (savedLicenses) {
          const parsed = licenseSchema.array().safeParse(JSON.parse(savedLicenses))
          if (parsed.success) setLicenses(parsed.data)
          else showNotice("Some saved receipt data was invalid and was not loaded.", "error")
        }
      } catch {
        showNotice("Local storage is unavailable; changes will last only for this session.", "info")
      } finally { setHydrated(true) }
    }
    async function readWallet() {
      const provider = window.ethereum
      if (!provider) return
      try {
        const [accounts, chainId] = await Promise.all([
          provider.request({ method: "eth_accounts" }) as Promise<string[]>,
          provider.request({ method: "eth_chainId" }) as Promise<string>,
        ])
        setWallet(accounts[0] ?? null)
        setNetworkReady(chainId.toLowerCase() === OG_NETWORK.chainId)
      } catch { setWallet(null); setNetworkReady(false) }
    }
    readWorkspace()
    readWallet()
  }, [showNotice])

  useEffect(() => { if (hydrated) try { window.localStorage.setItem(DATASETS_KEY, JSON.stringify(datasets)) } catch {} }, [datasets, hydrated])
  useEffect(() => { if (hydrated) try { window.localStorage.setItem(LICENSES_KEY, JSON.stringify(licenses)) } catch {} }, [licenses, hydrated])
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(null), 5000); return () => window.clearTimeout(timer) }, [notice])

  useEffect(() => {
    const provider = window.ethereum
    if (!provider?.on) return
    const accountsChanged = (...args: unknown[]) => setWallet((args[0] as string[] | undefined)?.[0] ?? null)
    const chainChanged = (...args: unknown[]) => setNetworkReady(String(args[0]).toLowerCase() === OG_NETWORK.chainId)
    provider.on("accountsChanged", accountsChanged)
    provider.on("chainChanged", chainChanged)
    return () => { provider.removeListener?.("accountsChanged", accountsChanged); provider.removeListener?.("chainChanged", chainChanged) }
  }, [])

  useEffect(() => {
    function syncStorage(event: StorageEvent) {
      try {
        if (event.key === DATASETS_KEY && event.newValue) {
          const parsed = datasetSchema.array().safeParse(JSON.parse(event.newValue))
          if (parsed.success) setDatasets(parsed.data)
        }
        if (event.key === LICENSES_KEY && event.newValue) {
          const parsed = licenseSchema.array().safeParse(JSON.parse(event.newValue))
          if (parsed.success) setLicenses(parsed.data)
        }
      } catch {}
    }
    window.addEventListener("storage", syncStorage)
    return () => window.removeEventListener("storage", syncStorage)
  }, [])

  async function switchToOg(provider: Provider) {
    try { await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: OG_NETWORK.chainId }] }) }
    catch (error) {
      if ((error as { code?: number }).code === 4902) await provider.request({ method: "wallet_addEthereumChain", params: [OG_NETWORK] })
      else throw error
    }
    setNetworkReady(true)
  }

  async function connectWallet() {
    const provider = window.ethereum
    if (!provider) { showNotice("No wallet detected. Install MetaMask or Rabby to connect to 0G Galileo.", "error"); return }
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[]
      await switchToOg(provider)
      setWallet(accounts[0] ?? null)
      showNotice("Wallet connected to 0G Galileo.", "success")
    } catch (error) { showNotice(errorMessage(error, "Wallet connection was cancelled."), "error") }
  }

  async function createDataset(input: CreateInput) {
    const now = new Date().toISOString()
    const hash = await hashValue(`${input.name}:${input.description}:${now}`)
    const id = makeId("cl")
    const dataset: Dataset = { ...input, id, owner: wallet ?? "Local workspace", hash, createdAt: now, updatedAt: now, status: "active", version: 1 }
    if (IS_ONCHAIN_CONFIGURED && wallet && window.ethereum) {
      try {
        const provider = browserProvider()
        if (!provider) throw new Error("Wallet provider unavailable.")
        await switchToOg(window.ethereum)
        const signer = await provider.getSigner()
        const contract = registryContract(signer)
        const tx = await contract.createDataset(chainDatasetId(id), asBytes32Hash(hash), ZeroHash, parseOgToWeiHex(input.price), BigInt(input.licenseDurationDays) * 86_400n)
        const receipt = await tx.wait(2)
        dataset.chainDatasetId = chainDatasetId(id)
        dataset.registryTxHash = receipt.hash
      } catch (error) {
        showNotice(errorMessage(error, "Could not register the passport on 0G."), "error")
        throw error
      }
    }
    setDatasets((current) => [dataset, ...current])
    showNotice(dataset.registryTxHash ? "Data Passport registered on 0G Galileo." : wallet ? "Data Passport created for your connected wallet." : "Passport saved locally in this browser.", "success")
    return dataset.id
  }

  async function issueLicense(dataset: Dataset, purpose: string) {
    if (dataset.status === "revoked") { showNotice("This passport is revoked and no longer accepts new licenses.", "error"); return false }
    const decision = permissionForPurpose(dataset, purpose)
    if (decision === "denied") { showNotice(`${purpose} is not permitted by this Data Passport.`, "error"); return false }
    const issuedAt = new Date()
    const validUntil = new Date(issuedAt.getTime() + dataset.licenseDurationDays * 86_400_000)
    const price = decision === "paid" ? dataset.price : 0
    let signature: string | undefined
    let paymentTxHash: string | undefined
    let status: License["status"] = "ACTIVE"
    let verification: License["verification"] = "local"

    if (decision === "paid") {
      const provider = window.ethereum
      if (!provider) { showNotice("A browser wallet is required for paid licenses.", "error"); return false }
      if (!/^0x[a-fA-F0-9]{40}$/.test(dataset.owner)) { showNotice("This passport has no valid payment wallet. Its owner must recreate it while connected.", "error"); return false }
      try {
        const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[]
        const payer = accounts[0]
        if (!payer) throw new Error("No wallet account is available.")
        await switchToOg(provider)
        setWallet(payer)
        paymentTxHash = await provider.request({ method: "eth_sendTransaction", params: [{ from: payer, to: dataset.owner, value: parseOgToWeiHex(price) }] }) as string
        status = "PENDING"
        verification = "payment"
      } catch (error) { showNotice(errorMessage(error, "Payment was cancelled. No license was issued."), "error"); return false }
    } else if (wallet && window.ethereum) {
      try {
        signature = await window.ethereum.request({ method: "personal_sign", params: [`ConsentLayer license\nDataset: ${dataset.name}\nPurpose: ${purpose}\nPrice: 0 0G\nIssued: ${issuedAt.toISOString()}\nValid until: ${validUntil.toISOString()}`, wallet] }) as string
        verification = "wallet"
      } catch { showNotice("Signature cancelled. The license was not issued.", "error"); return false }
    }

    const receiptHash = await hashValue(`${dataset.id}:${purpose}:${issuedAt.toISOString()}:${paymentTxHash ?? signature ?? "local"}`)
    const license: License = { id: makeId("CL"), datasetId: dataset.id, datasetName: dataset.name, purpose, price, issuedAt: issuedAt.toISOString(), validUntil: validUntil.toISOString(), status, receiptHash, signature, paymentTxHash, verification }
    setLicenses((current) => [license, ...current])
    showNotice(paymentTxHash ? "Payment submitted. The receipt will activate after confirmation." : signature ? "License signed and receipt recorded." : "Local license receipt created.", "success")
    return true
  }

  function revokeDataset(id: string) {
    const dataset = datasets.find((item) => item.id === id)
    if (!dataset) return false
    const ownsDataset = dataset.owner === "Local workspace" || Boolean(wallet && dataset.owner.toLowerCase() === wallet.toLowerCase())
    if (!ownsDataset) { showNotice("Only the passport owner can revoke it.", "error"); return false }
    setDatasets((current) => current.map((item) => item.id === id ? { ...item, status: "revoked", version: item.version + 1, updatedAt: new Date().toISOString() } : item))
    showNotice("Passport revoked. Existing licenses keep their original validity.", "success")
    return true
  }

  async function refreshTransactions() {
    const provider = window.ethereum
    const pending = licenses.filter((license) => license.status === "PENDING" && license.paymentTxHash)
    if (!provider || pending.length === 0) { showNotice(pending.length === 0 ? "There are no pending payments." : "Connect the wallet provider used for these payments.", "info"); return }
    try {
      const results = await Promise.all(pending.map(async (license) => ({ id: license.id, receipt: await provider.request({ method: "eth_getTransactionReceipt", params: [license.paymentTxHash] }) as { status?: string } | null })))
      const updates = new Map(results.filter((result) => result.receipt).map((result) => [result.id, result.receipt?.status === "0x1" ? "ACTIVE" as const : "FAILED" as const]))
      setLicenses((current) => current.map((license) => updates.has(license.id) ? { ...license, status: updates.get(license.id)! } : license))
      showNotice(updates.size ? `${updates.size} payment receipt${updates.size === 1 ? "" : "s"} updated.` : "Payments are still waiting for confirmation.", updates.size ? "success" : "info")
    } catch (error) { showNotice(errorMessage(error, "Could not refresh payment receipts."), "error") }
  }

  function exportWorkspace() {
    downloadJson(`consentlayer-backup-${new Date().toISOString().slice(0, 10)}.json`, { version: 1, exportedAt: new Date().toISOString(), datasets, licenses })
    showNotice("Workspace backup downloaded.", "success")
  }
  function importWorkspace(data: unknown) {
    const parsed = workspaceSchema.safeParse(data)
    if (!parsed.success) { showNotice("That file is not a valid ConsentLayer workspace backup.", "error"); return false }
    setDatasets(parsed.data.datasets); setLicenses(parsed.data.licenses); showNotice("Workspace restored from backup.", "success"); return true
  }
  function resetWorkspace() { setDatasets([]); setLicenses([]); showNotice("Local workspace reset.", "info") }

  const value = useMemo<ConsentContextValue>(() => ({
    datasets, licenses, wallet, networkReady, hydrated, notice, connectWallet, dismissNotice: () => setNotice(null), showNotice, createDataset, issueLicense, revokeDataset, refreshTransactions, exportWorkspace, importWorkspace, resetWorkspace,
    clearLicenses: () => { setLicenses([]); showNotice("Local receipts cleared.", "info") },
  }), [datasets, licenses, wallet, networkReady, hydrated, notice, showNotice])
  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
}

export function useConsent() {
  const context = useContext(ConsentContext)
  if (!context) throw new Error("useConsent must be used inside ConsentProvider")
  return context
}
