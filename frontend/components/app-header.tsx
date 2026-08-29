"use client"

import { ExternalLink, Layers3, Menu, Plus, Wallet, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { shortAddress } from "@/lib/consent-data"
import { useConsent } from "@/components/consent-provider"

export function AppHeader(_props: { app?: boolean }) {
  const { wallet, connectWallet } = useConsent()
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const navClass = (href: string) => pathname === href || pathname.startsWith(`${href}/`) ? "nav-link active" : "nav-link"
  return <header className="site-header"><div className="nav-wrap"><Link href="/" className="brand" onClick={() => setOpen(false)}><span className="brand-mark"><Layers3 size={18} strokeWidth={2.2} /></span><span>ConsentLayer</span></Link><nav className={open ? "main-nav mobile-open" : "main-nav"} aria-label="Primary navigation"><Link href="/dashboard" className={navClass("/dashboard")} onClick={() => setOpen(false)}>Dashboard</Link><Link href="/marketplace" className={navClass("/marketplace")} onClick={() => setOpen(false)}>Marketplace</Link><Link href="/receipts" className={navClass("/receipts")} onClick={() => setOpen(false)}>Receipts</Link><Link href="/compute" className={navClass("/compute")} onClick={() => setOpen(false)}>Compute</Link><Link href="/settings" className={navClass("/settings")} onClick={() => setOpen(false)}>Settings</Link><a href="https://docs.0g.ai/" target="_blank" rel="noreferrer" className="nav-link" onClick={() => setOpen(false)}>0G docs <ExternalLink size={13} /></a><div className="mobile-actions"><button className="button button-ghost" onClick={connectWallet}><Wallet size={16} /> {wallet ? shortAddress(wallet) : "Connect wallet"}</button><Link href="/passports/new" className="button button-dark" onClick={() => setOpen(false)}><Plus size={16} /> Create passport</Link></div></nav><div className="header-actions"><button className="button button-ghost wallet-button" onClick={connectWallet}><Wallet size={16} /> {wallet ? shortAddress(wallet) : "Connect wallet"}</button><Link href="/passports/new" className="button button-dark"><Plus size={16} /> Create passport</Link></div><button className="menu-button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Toggle navigation">{open ? <X size={22} /> : <Menu size={22} />}</button></div></header>
}

export function AppNotice() {
  const { notice, dismissNotice } = useConsent()
  if (!notice) return null
  return <div className={`notice notice-${notice.kind}`} role="status"><span>{notice.kind === "success" ? "✓" : notice.kind === "error" ? "!" : "i"}</span>{notice.text}<button onClick={dismissNotice} aria-label="Dismiss notice">×</button></div>
}
