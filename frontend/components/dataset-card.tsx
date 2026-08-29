import Link from "next/link"
import type { ReactNode } from "react"
import { Check, Database, ExternalLink, X } from "lucide-react"
import { Dataset, formatNumber, permissionClass, permissionLabel, shortAddress } from "@/lib/consent-data"

export function DatasetCard({ dataset }: { dataset: Dataset }) {
  return <article className="dataset-card"><div className="dataset-card-head"><span className="dataset-type">{dataset.type}</span><span className={dataset.status === "revoked" ? "privacy-badge revoked-text" : dataset.isPrivate ? "privacy-badge private" : "privacy-badge"}>{dataset.status === "revoked" ? "Revoked" : dataset.isPrivate ? "Private" : "Open"}</span></div><h4>{dataset.name}</h4><p>{dataset.description}</p><div className="dataset-meta"><span>{formatNumber(dataset.samples)} records</span><span>{shortAddress(dataset.owner)}</span></div><div className="permission-stack"><PermissionPill label="Training" value={dataset.permissions.training} /><PermissionPill label="Fine-tuning" value={dataset.permissions.fineTuning} /><PermissionPill label="Inference" value={dataset.permissions.inference} /><PermissionPill label="Research" value={dataset.permissions.research} /><PermissionPill label="Redistribution" value={dataset.permissions.redistribution} /></div><div className="dataset-card-foot"><div><small>Commercial use</small><strong>{dataset.status === "revoked" || dataset.permissions.commercial === "denied" ? "Unavailable" : dataset.permissions.commercial === "allowed" || dataset.price === 0 ? "Free" : `${dataset.price} 0G`}</strong></div><Link className="button button-dark button-small" href={`/passports/${dataset.id}`}>View passport <ExternalLink size={14} /></Link></div></article>
}

export function PassportRow({ dataset }: { dataset: Dataset }) {
  return <div className="passport-row"><div className="passport-leading"><span className="dataset-type">{dataset.type}</span><div><strong>{dataset.name}</strong><small>{formatNumber(dataset.samples)} records · {dataset.status === "revoked" ? "Revoked" : dataset.isPrivate ? "Private" : "Public"}</small></div></div><div className="passport-permissions"><span className={dataset.status === "revoked" ? "status status-denied" : permissionClass(dataset.permissions.training)}>Training {dataset.status === "revoked" ? "Revoked" : permissionLabel(dataset.permissions.training)}</span><span className={dataset.status === "revoked" ? "status status-denied" : permissionClass(dataset.permissions.commercial)}>Commercial {dataset.status === "revoked" ? "Revoked" : dataset.price === 0 ? "Free" : `${dataset.price} 0G`}</span></div><Link className="icon-button" href={`/passports/${dataset.id}`} aria-label={`View ${dataset.name} passport`}><ExternalLink size={16} /></Link></div>
}

function PermissionPill({ label, value }: { label: string; value: Dataset["permissions"][keyof Dataset["permissions"]] }) {
  return <span className={permissionClass(value)}>{value === "denied" ? <X size={13} /> : <Check size={13} />} {label}</span>
}

export function MetricCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) {
  return <div className="metric-card"><span className="metric-icon">{icon}</span><span className="metric-label">{label}</span><strong>{value}</strong><small>{detail}</small></div>
}
