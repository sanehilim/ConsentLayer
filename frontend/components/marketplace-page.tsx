"use client"

import { Plus, Search } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { AppHeader, AppNotice } from "@/components/app-header"
import { DatasetCard } from "@/components/dataset-card"
import { useConsent } from "@/components/consent-provider"

export function MarketplacePage() {
  const { datasets } = useConsent()
  const [query, setQuery] = useState("")
  const available = useMemo(() => datasets.filter((dataset) => dataset.status === "active"), [datasets])
  const filtered = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (terms.length === 0) return available
    return available.filter((dataset) => {
      const searchable = `${dataset.name} ${dataset.description} ${dataset.type}`.toLowerCase()
      return terms.every((term) => searchable.includes(term))
    })
  }, [available, query])
  return <main className="app-shell"><AppHeader /><section className="page-section"><div className="section-heading-row"><div><span className="section-kicker">Open catalog</span><h1>Find a dataset with terms you can trust.</h1><p>Every listing includes a clear use policy, price, privacy state, and provenance hash.</p></div></div><div className="catalog-toolbar"><label className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search datasets, types, or use cases" /></label><span>{filtered.length} passport{filtered.length === 1 ? "" : "s"}</span></div>{filtered.length === 0 ? <div className="empty-state"><h4>{available.length === 0 ? "The catalog is ready for its first passport" : "No matching passports"}</h4><p>{available.length === 0 ? "Register a real dataset to make it discoverable here." : "Try a different search term."}</p>{available.length === 0 && <Link href="/passports/new" className="button button-dark"><Plus size={15} /> Create passport</Link>}</div> : <div className="dataset-grid">{filtered.map((dataset) => <DatasetCard key={dataset.id} dataset={dataset} />)}</div>}</section><AppNotice /></main>
}
