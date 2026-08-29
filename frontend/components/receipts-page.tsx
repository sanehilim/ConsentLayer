"use client"

import { FileCheck2, RefreshCw } from "lucide-react"
import { useState } from "react"
import { AppHeader, AppNotice } from "@/components/app-header"
import { ReceiptRow } from "@/components/receipt-row"
import { useConsent } from "@/components/consent-provider"

export function ReceiptsPage() {
  const { licenses, clearLicenses, refreshTransactions } = useConsent()
  const [confirmClear, setConfirmClear] = useState(false)
  const hasPending = licenses.some((license) => license.status === "PENDING")
  return <main className="app-shell"><AppHeader app /><section className="page-section"><div className="section-heading-row"><div><span className="section-kicker">Audit trail</span><h1>Every permission leaves a receipt.</h1><p>Review local, wallet-signed, and payment-backed licenses with their purpose and validity.</p></div>{licenses.length > 0 && <div className="section-actions">{hasPending && <button className="button button-outline button-small" onClick={refreshTransactions}><RefreshCw size={14} /> Refresh payments</button>}{confirmClear ? <><button className="text-button danger-text" onClick={() => { clearLicenses(); setConfirmClear(false) }}>Confirm clear</button><button className="text-button" onClick={() => setConfirmClear(false)}>Cancel</button></> : <button className="text-button danger-text" onClick={() => setConfirmClear(true)}>Clear receipts</button>}</div>}</div>{licenses.length === 0 ? <div className="empty-state receipts-empty"><span className="empty-icon"><FileCheck2 size={22} /></span><h4>No receipts yet</h4><p>Choose a dataset in the marketplace to issue your first license.</p></div> : <div className="receipt-list page-receipts">{licenses.map((license) => <ReceiptRow key={license.id} license={license} />)}</div>}</section><AppNotice /></main>
}
