import { z } from "zod"
import { OG_CHAIN } from "@/lib/chain-config"

export type Permission = "allowed" | "paid" | "denied"

export type Dataset = {
  id: string
  name: string
  description: string
  type: string
  samples: number
  owner: string
  permissions: {
    training: Permission
    fineTuning: Permission
    inference: Permission
    research: Permission
    commercial: Permission
    redistribution: Permission
  }
  price: number
  isPrivate: boolean
  hash: string
  createdAt: string
  updatedAt: string
  status: "active" | "revoked"
  version: number
  licenseDurationDays: number
  chainDatasetId?: string
  registryTxHash?: string
  storageRoot?: string
  storageTxHash?: string
}

export type License = {
  id: string
  datasetId: string
  datasetName: string
  purpose: string
  price: number
  issuedAt: string
  validUntil: string
  status: "ACTIVE" | "PENDING" | "FAILED"
  receiptHash: string
  signature?: string
  paymentTxHash?: string
  verification: "local" | "wallet" | "payment"
  chainLicenseId?: string
  contractTxHash?: string
}

export const OG_NETWORK = {
  chainId: OG_CHAIN.chainId,
  chainName: OG_CHAIN.chainName,
  nativeCurrency: OG_CHAIN.nativeCurrency,
  rpcUrls: [OG_CHAIN.rpcUrl],
  blockExplorerUrls: [OG_CHAIN.explorerUrl],
}

export const PURPOSES = ["Research", "AI training", "Commercial training", "Fine-tuning", "Inference"]

export const DEFAULT_PERMISSIONS: Dataset["permissions"] = {
  training: "allowed",
  fineTuning: "allowed",
  inference: "allowed",
  research: "allowed",
  commercial: "paid",
  redistribution: "denied",
}

export const DEMO_DATASETS: Dataset[] = []

const permissionSchema = z.enum(["allowed", "paid", "denied"])
const permissionsSchema = z.object({
  training: permissionSchema,
  fineTuning: permissionSchema,
  inference: permissionSchema,
  research: permissionSchema,
  commercial: permissionSchema,
  redistribution: permissionSchema,
})

export const datasetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(1000),
  type: z.string().min(1).max(40),
  samples: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  owner: z.string().min(1),
  permissions: permissionsSchema,
  price: z.number().nonnegative().max(1_000_000),
  isPrivate: z.boolean(),
  hash: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  status: z.enum(["active", "revoked"]).optional(),
  version: z.number().int().positive().optional(),
  licenseDurationDays: z.number().int().min(1).max(3650).optional(),
  chainDatasetId: z.string().optional(),
  registryTxHash: z.string().optional(),
  storageRoot: z.string().optional(),
  storageTxHash: z.string().optional(),
}).transform((dataset) => ({
  ...dataset,
  updatedAt: dataset.updatedAt ?? dataset.createdAt,
  status: dataset.status ?? "active" as const,
  version: dataset.version ?? 1,
  licenseDurationDays: dataset.licenseDurationDays ?? 365,
}))

export const licenseSchema = z.object({
  id: z.string().min(1),
  datasetId: z.string().min(1),
  datasetName: z.string().min(1),
  purpose: z.string().min(1),
  price: z.number().nonnegative().max(1_000_000),
  issuedAt: z.string().datetime(),
  validUntil: z.string().datetime(),
  status: z.enum(["ACTIVE", "PENDING", "FAILED"]),
  receiptHash: z.string().min(1),
  signature: z.string().optional(),
  paymentTxHash: z.string().optional(),
  verification: z.enum(["local", "wallet", "payment"]).optional(),
  chainLicenseId: z.string().optional(),
  contractTxHash: z.string().optional(),
}).transform((license) => ({ ...license, verification: license.verification ?? (license.signature ? "wallet" as const : "local" as const) }))

export const workspaceSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  datasets: z.array(datasetSchema),
  licenses: z.array(licenseSchema),
})

export function makeId(prefix: string) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)
  return `${prefix}_${random}`
}

export function shortAddress(value: string) {
  return value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
}

export function isEvmAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value)
}

export function parseOgToWeiHex(value: number) {
  const normalized = value.toFixed(18).replace(/0+$/, "").replace(/\.$/, "")
  const [whole, fraction = ""] = normalized.split(".")
  const wei = BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, "0"))
  return `0x${wei.toString(16)}`
}

export function receiptStatus(license: License) {
  if (license.status !== "ACTIVE") return license.status
  return new Date(license.validUntil).getTime() < Date.now() ? "EXPIRED" : "ACTIVE"
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.style.display = "none"
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

export function permissionLabel(permission: Permission) {
  return permission === "paid" ? "Paid" : permission === "allowed" ? "Allowed" : "Denied"
}

export function permissionClass(permission: Permission) {
  return permission === "paid" ? "status status-paid" : permission === "allowed" ? "status status-allowed" : "status status-denied"
}

export function permissionForPurpose(dataset: Dataset, purpose: string): Permission {
  if (purpose === "Research") return dataset.permissions.research
  if (purpose === "Fine-tuning") return dataset.permissions.fineTuning
  if (purpose === "Inference") return dataset.permissions.inference
  if (purpose === "Commercial training") return dataset.permissions.commercial
  return dataset.permissions.training
}

export async function hashValue(value: string) {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const bytes = new TextEncoder().encode(value)
    const digest = await crypto.subtle.digest("SHA-256", bytes)
    return `0x${Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")}`
  }
  return `local:${makeId("receipt")}`
}
