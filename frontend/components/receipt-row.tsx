"use client"

import { Check, CheckCircle2, Clock3, Copy, Download, ExternalLink, XCircle } from "lucide-react"
import { useState } from "react"
import { downloadJson, formatDate, License, receiptStatus } from "@/lib/consent-data"

export function ReceiptRow({ license }: { license: License }) {
  const [copied, setCopied] = useState(false)
  const status = receiptStatus(license)
  const verification = license.verification === "payment" ? "0G payment" : license.verification === "wallet" ? "Wallet signed" : "Local only"
  async function copyHash() {
    try { await navigator.clipboard?.writeText(license.receiptHash); setCopied(true); window.setTimeout(() => setCopied(false), 1500) } catch {}
  }
  const StatusIcon = status === "ACTIVE" ? CheckCircle2 : status === "PENDING" ? Clock3 : XCircle
  return <div className="receipt-row"><div className={`receipt-status receipt-${status.toLowerCase()}`}><StatusIcon size={18} /><span>{status}</span></div><div className="receipt-main"><strong>{license.datasetName}</strong><span>{license.purpose} · {verification} · issued {formatDate(license.issuedAt)}</span></div><div className="receipt-price"><strong>{license.price === 0 ? "Free" : `${license.price} 0G`}</strong><span>valid until {formatDate(license.validUntil)}</span></div><div className="receipt-tools"><button className="hash-button" onClick={copyHash} title="Copy receipt hash" aria-label="Copy receipt hash"><code>{license.receiptHash}</code>{copied ? <Check size={14} /> : <Copy size={14} />}</button><button className="icon-button" onClick={() => downloadJson(`${license.id}.receipt.json`, license)} title="Download receipt JSON" aria-label="Download receipt JSON"><Download size={14} /></button>{license.paymentTxHash && <a className="icon-button" href={`https://chainscan-galileo.0g.ai/tx/${license.paymentTxHash}`} target="_blank" rel="noreferrer" title="View payment on ChainScan" aria-label="View payment on ChainScan"><ExternalLink size={14} /></a>}</div></div>
}
