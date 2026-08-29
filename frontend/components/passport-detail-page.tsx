"use client"

import { ArrowLeft, Check, CheckCircle2, Download, ExternalLink, Fingerprint, LockKeyhole, ShieldX, X } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { AppHeader, AppNotice } from "@/components/app-header"
import { useConsent } from "@/components/consent-provider"
import { downloadJson, formatDate, formatNumber, isEvmAddress, permissionClass, permissionForPurpose, permissionLabel, PURPOSES, shortAddress } from "@/lib/consent-data"
import { OG_CHAIN } from "@/lib/chain-config"

export function PassportDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { datasets, issueLicense, revokeDataset, wallet } = useConsent()
  const dataset = datasets.find((item) => item.id === params.id)
  const [purpose, setPurpose] = useState(PURPOSES[0])
  const [issuing, setIssuing] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(false)

  if (!dataset) return <main className="app-shell"><AppHeader app /><section className="page-section"><span className="section-kicker">Passport not found</span><h1>This dataset is no longer in this workspace.</h1><Link href="/marketplace" className="button button-dark">Back to marketplace</Link></section></main>

  const decision = permissionForPurpose(dataset, purpose)
  const price = decision === "paid" ? dataset.price : 0
  const ownsDataset = dataset.owner === "Local workspace" || Boolean(wallet && dataset.owner.toLowerCase() === wallet.toLowerCase())
  const canIssue = dataset.status === "active" && decision !== "denied"

  async function requestLicense() {
    setIssuing(true)
    try { if (await issueLicense(dataset!, purpose)) router.push("/receipts") }
    finally { setIssuing(false) }
  }

  async function confirmRevocation() {
    if (await revokeDataset(dataset!.id)) setConfirmRevoke(false)
  }

  return <main className="app-shell"><AppHeader app /><section className="page-section passport-detail-page"><Link href="/marketplace" className="back-link"><ArrowLeft size={15} /> Marketplace</Link><div className="passport-detail-head"><div><span className="section-kicker">Data Passport · v{dataset.version}</span><h1>{dataset.name}</h1><p>{dataset.description}</p></div><div className="passport-head-actions"><span className={dataset.isPrivate ? "privacy-badge private passport-privacy" : "privacy-badge passport-privacy"}>{dataset.isPrivate ? "Private metadata" : "Open metadata"}</span><button className="button button-outline button-small" onClick={() => downloadJson(`${dataset.id}.passport.json`, dataset)}><Download size={14} /> Export passport</button></div></div><div className="passport-detail-grid"><div className="panel passport-sheet"><div className="sheet-top"><div><span className="section-kicker">Policy status</span><h3 className={dataset.status === "revoked" ? "revoked-text" : ""}>{dataset.status === "revoked" ? <ShieldX size={18} /> : <CheckCircle2 size={18} />} {dataset.status === "revoked" ? "Revoked" : "Active"}</h3></div>{isEvmAddress(dataset.owner) && <a href={`${OG_CHAIN.explorerUrl}/address/${dataset.owner}`} target="_blank" rel="noreferrer" className="text-button">View owner on ChainScan <ExternalLink size={14} /></a>}</div><div className="passport-facts"><div><span>Dataset type</span><strong>{dataset.type}</strong></div><div><span>Records</span><strong>{formatNumber(dataset.samples)}</strong></div><div><span>Owner</span><strong title={dataset.owner}>{isEvmAddress(dataset.owner) ? shortAddress(dataset.owner) : dataset.owner}</strong></div><div><span>Registered</span><strong>{formatDate(dataset.createdAt)}</strong></div><div><span>Provenance hash</span><strong className="mono-value">{dataset.hash}</strong></div><div><span>File handling</span><strong><LockKeyhole size={14} /> External</strong></div></div><div className="permission-table"><div className="permission-table-head"><span>Permission</span><span>Decision</span></div><PermissionRow label="AI training" value={dataset.permissions.training} /><PermissionRow label="Fine-tuning" value={dataset.permissions.fineTuning} /><PermissionRow label="Inference" value={dataset.permissions.inference} /><PermissionRow label="Research" value={dataset.permissions.research} /><PermissionRow label="Commercial use" value={dataset.permissions.commercial} /><PermissionRow label="Redistribution" value={dataset.permissions.redistribution} /></div>{ownsDataset && dataset.status === "active" && <div className="owner-controls">{confirmRevoke ? <><span>Stop all future licenses?</span><button className="text-button danger-text" onClick={confirmRevocation}>Confirm revoke</button><button className="text-button" onClick={() => setConfirmRevoke(false)}>Cancel</button></> : <button className="text-button danger-text" onClick={() => setConfirmRevoke(true)}><ShieldX size={14} /> Revoke passport</button>}<small>Existing receipts remain valid until their original expiry.</small></div>}</div><aside className="panel license-panel"><div className="license-panel-icon"><Fingerprint size={21} /></div><span className="section-kicker">Request access</span><h3>Issue a license</h3><p>Choose the intended use. The passport decides whether it is free, paid, or blocked.</p><label className="purpose-label">Intended use<select value={purpose} onChange={(event) => setPurpose(event.target.value)}>{PURPOSES.map((item) => <option key={item}>{item}</option>)}</select></label><div className="license-terms"><div><span>Decision</span><strong className={decision === "denied" ? "denied-text" : "allowed-text"}>{dataset.status === "revoked" ? "Revoked" : permissionLabel(decision)}</strong></div><div><span>Price</span><strong>{!canIssue ? "Unavailable" : price === 0 ? "Free" : `${price} 0G`}</strong></div><div><span>Validity</span><strong>{dataset.licenseDurationDays} days</strong></div></div><button className="button button-teal button-large full-button" disabled={!canIssue || issuing} onClick={requestLicense}>{!canIssue ? <><X size={16} /> {dataset.status === "revoked" ? "Passport revoked" : "Use not permitted"}</> : issuing ? "Waiting for wallet…" : decision === "paid" ? <>Pay {price} 0G & issue <Check size={16} /></> : <>{wallet ? "Sign & issue license" : "Issue local receipt"} <Check size={16} /></>}</button><small className="license-note">{decision === "paid" ? "Paid access submits a native 0G Galileo transaction to the owner. Activation follows chain confirmation." : wallet ? "Your wallet will sign the license terms." : "Without a wallet, this free receipt is verifiable only inside your local workspace."}</small></aside></div></section><AppNotice /></main>
}

function PermissionRow({ label, value }: { label: string; value: "allowed" | "paid" | "denied" }) {
  return <div className="permission-table-row"><span>{label}</span><span className={permissionClass(value)}>{value === "denied" ? <X size={13} /> : <Check size={13} />} {permissionLabel(value)}</span></div>
}
