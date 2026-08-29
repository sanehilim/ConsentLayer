"use client"

import { Bot, Send, ShieldCheck } from "lucide-react"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { AppHeader, AppNotice } from "@/components/app-header"
import { useConsent } from "@/components/consent-provider"
import { receiptStatus } from "@/lib/consent-data"

type Model = { id: string; name?: string }
type Message = { role: "user" | "assistant"; content: string }

export function ComputePage() {
  const { datasets, licenses, showNotice } = useConsent()
  const [models, setModels] = useState<Model[]>([])
  const [model, setModel] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [prompt, setPrompt] = useState("")
  const [loadingModels, setLoadingModels] = useState(true)
  const [sending, setSending] = useState(false)
  const licensedDatasets = useMemo(() => datasets.filter((dataset) => licenses.some((license) => license.datasetId === dataset.id && license.purpose === "Inference" && receiptStatus(license) === "ACTIVE")), [datasets, licenses])
  useEffect(() => {
    fetch("/api/compute/models").then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "Could not load models."); const list = Array.isArray(body.data) ? body.data : Array.isArray(body.models) ? body.models : []; setModels(list); setModel(list[0]?.id || "") }).catch((error) => showNotice(error instanceof Error ? error.message : "Could not load models.", "error")).finally(() => setLoadingModels(false))
  }, [showNotice])

  async function send(event: FormEvent) {
    event.preventDefault()
    const cleanPrompt = prompt.trim()
    if (!cleanPrompt || !model || sending) return
    if (licensedDatasets.length === 0) { showNotice("Issue an active Inference license before using Compute.", "error"); return }
    const nextMessages = [...messages, { role: "user" as const, content: cleanPrompt }]
    setMessages(nextMessages); setPrompt(""); setSending(true)
    try {
      const response = await fetch("/api/compute/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model, messages: nextMessages }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || "Compute request failed.")
      const content = body.choices?.[0]?.message?.content
      if (typeof content !== "string") throw new Error("Compute returned no assistant message.")
      setMessages((current) => [...current, { role: "assistant", content }])
    } catch (error) { setMessages(messages); showNotice(error instanceof Error ? error.message : "Compute request failed.", "error") }
    finally { setSending(false) }
  }

  return <main className="app-shell"><AppHeader app /><section className="page-section compute-page"><div className="section-heading-row"><div><span className="section-kicker">0G Compute</span><h1>Use an AI service after permission is granted.</h1><p>Inference requests are routed through the server-side 0G gateway. An active Inference license is required before a prompt is sent.</p></div></div><div className="compute-grid"><section className="panel compute-chat"><div className="compute-toolbar"><div className="compute-title"><span className="metric-icon"><Bot size={18} /></span><div><span className="section-kicker">Inference workspace</span><h2>Permission-aware chat</h2></div></div><label>Model<select value={model} onChange={(event) => setModel(event.target.value)} disabled={loadingModels || models.length === 0}><option value="">{loadingModels ? "Loading models…" : models.length ? "Select a model" : "No models configured"}</option>{models.map((item) => <option key={item.id} value={item.id}>{item.name || item.id}</option>)}</select></label></div><div className="compute-messages" aria-live="polite">{messages.length === 0 ? <div className="compute-empty"><ShieldCheck size={22} /><strong>{licensedDatasets.length ? "Your inference license is active." : "No active inference license."}</strong><span>{licensedDatasets.length ? "Send a prompt to the selected 0G Compute model." : "Create a passport, allow Inference, then issue a license."}</span></div> : messages.map((message, index) => <div key={`${message.role}-${index}`} className={`compute-message ${message.role}`}><span>{message.role === "user" ? "You" : "0G"}</span><p>{message.content}</p></div>)}</div><form className="compute-form" onSubmit={send}><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask the licensed AI service something…" rows={2} maxLength={20_000} /><button className="button button-dark" type="submit" disabled={sending || !model}>{sending ? "Sending…" : "Send prompt"} <Send size={15} /></button></form></section><aside className="panel compute-side"><span className="section-kicker">Access check</span><h2>{licensedDatasets.length ? "Permission verified" : "Permission required"}</h2><p>{licensedDatasets.length ? "This workspace has an active Inference license. The Compute API key remains server-side." : "Compute is intentionally blocked until an active Inference license exists."}</p>{licensedDatasets.length > 0 && <div className="compute-license-list">{licensedDatasets.map((dataset) => <span key={dataset.id}><ShieldCheck size={14} /> {dataset.name}</span>)}</div>}</aside></div></section><AppNotice /></main>
}
