"use client"

import { Database, Download, HardDrive, Network, Trash2, Upload, Wallet } from "lucide-react"
import { ChangeEvent, useRef, useState } from "react"
import { AppHeader, AppNotice } from "@/components/app-header"
import { useConsent } from "@/components/consent-provider"
import { shortAddress } from "@/lib/consent-data"
import { OG_CHAIN } from "@/lib/chain-config"

export function SettingsPage() {
  const { datasets, licenses, wallet, networkReady, connectWallet, exportWorkspace, importWorkspace, resetWorkspace, showNotice } = useConsent()
  const inputRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  async function restore(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (file.size > 5_000_000) { showNotice("Backup files must be smaller than 5 MB.", "error"); return }
    try { importWorkspace(JSON.parse(await file.text())) }
    catch { showNotice("The selected file is not valid JSON.", "error") }
  }

  return <main className="app-shell"><AppHeader app /><section className="page-section settings-page"><div className="section-heading-row"><div><span className="section-kicker">Settings</span><h1>Your workspace, under your control.</h1><p>Review the active network and manage the browser data that powers this prototype.</p></div></div><div className="settings-grid"><section className="panel settings-panel"><div className="settings-panel-head"><span className="metric-icon"><Network size={18} /></span><div><span className="section-kicker">Connection</span><h2>{OG_CHAIN.chainName}</h2></div></div><dl className="settings-list"><div><dt>Chain ID</dt><dd>{Number.parseInt(OG_CHAIN.chainId, 16)}</dd></div><div><dt>Wallet</dt><dd>{wallet ? shortAddress(wallet) : "Not connected"}</dd></div><div><dt>Network state</dt><dd className={networkReady ? "allowed-text" : "denied-text"}>{networkReady ? "Ready" : "Not connected"}</dd></div><div><dt>RPC</dt><dd className="mono-value">{OG_CHAIN.rpcUrl.replace(/^https?:\/\//, "")}</dd></div></dl><button className="button button-dark" onClick={connectWallet}><Wallet size={15} /> {wallet && networkReady ? "Reconnect wallet" : "Connect to 0G"}</button></section><section className="panel settings-panel"><div className="settings-panel-head"><span className="metric-icon"><HardDrive size={18} /></span><div><span className="section-kicker">Local data</span><h2>Backup and restore</h2></div></div><p>Passports and receipts are stored in this browser. Export a JSON backup before clearing site data or changing devices.</p><div className="workspace-summary"><span><Database size={15} /> {datasets.length} passport{datasets.length === 1 ? "" : "s"}</span><span><Download size={15} /> {licenses.length} receipt{licenses.length === 1 ? "" : "s"}</span></div><div className="settings-actions"><button className="button button-dark" onClick={exportWorkspace}><Download size={15} /> Export backup</button><button className="button button-outline" onClick={() => inputRef.current?.click()}><Upload size={15} /> Restore backup</button><input ref={inputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={restore} /></div></section><section className="panel settings-panel settings-danger"><div className="settings-panel-head"><span className="metric-icon danger-icon"><Trash2 size={18} /></span><div><span className="section-kicker">Danger zone</span><h2>Reset local workspace</h2></div></div><p>This permanently removes all passports and receipts saved by ConsentLayer in this browser. It cannot reverse completed 0G transactions.</p>{confirmReset ? <div className="settings-actions"><button className="button button-danger" onClick={() => { resetWorkspace(); setConfirmReset(false) }}><Trash2 size={15} /> Confirm reset</button><button className="button button-outline" onClick={() => setConfirmReset(false)}>Cancel</button></div> : <button className="button button-outline danger-text" onClick={() => setConfirmReset(true)}>Reset workspace</button>}</section></div></section><AppNotice /></main>
}
