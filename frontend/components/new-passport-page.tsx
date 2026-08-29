"use client"

import { ArrowRight, LockKeyhole, UploadCloud } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { AppHeader, AppNotice } from "@/components/app-header"
import { useConsent } from "@/components/consent-provider"
import { DEFAULT_PERMISSIONS, Dataset, downloadJson, Permission } from "@/lib/consent-data"
import { uploadEncryptedTo0g } from "@/lib/storage"

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024

export function NewPassportPage() {
  const { createDataset, wallet } = useConsent()
  const router = useRouter()
  const [form, setForm] = useState({ name: "", description: "", type: "Images", samples: "", price: "", licenseDurationDays: "365", isPrivate: true, permissions: DEFAULT_PERMISSIONS })
  const [datasetFile, setDatasetFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [stage, setStage] = useState("")
  const [error, setError] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const samples = Number(form.samples)
    const price = Number(form.price || 0)
    const licenseDurationDays = Number(form.licenseDurationDays)
    const hasPaidPermission = Object.values(form.permissions).includes("paid")
    if (!form.name.trim() || !form.description.trim()) { setError("Add a clear dataset name and description."); return }
    if (!Number.isInteger(samples) || samples < 1) { setError("Records must be a whole number greater than zero."); return }
    if (!Number.isFinite(price) || price < 0 || price > 1_000_000 || (hasPaidPermission && price <= 0)) { setError("Set a valid price between 0 and 1,000,000 0G; paid permissions require more than zero."); return }
    if (!Number.isInteger(licenseDurationDays) || licenseDurationDays < 1 || licenseDurationDays > 3650) { setError("License validity must be between 1 and 3,650 days."); return }
    if (hasPaidPermission && !wallet) { setError("Connect a wallet before publishing paid permissions so payments have a valid recipient."); return }
    if (datasetFile && !wallet) { setError("Connect a wallet before uploading an encrypted file to 0G Storage."); return }
    if (datasetFile && datasetFile.size > MAX_UPLOAD_BYTES) { setError("The browser upload limit is 100 MB. Use a smaller file for this testnet flow."); return }

    setError("")
    setSaving(true)
    try {
      let storage: { rootHash: string; txHash: string; key: string } | undefined
      if (datasetFile) {
        setStage("Encrypting and uploading to 0G Storage…")
        storage = await uploadEncryptedTo0g(datasetFile)
      }
      setStage("Publishing passport…")
      const id = await createDataset({
        name: form.name.trim(), description: form.description.trim(), type: form.type,
        samples, price, licenseDurationDays, isPrivate: form.isPrivate, permissions: form.permissions,
        storageRoot: storage?.rootHash, storageTxHash: storage?.txHash,
      })
      if (storage && datasetFile) {
        downloadJson(`consentlayer-${id}-owner-key.json`, {
          warning: "Owner recovery material. Keep offline and never publish or share without validating an active license.",
          datasetId: id, filename: datasetFile.name, storageRoot: storage.rootHash,
          storageTxHash: storage.txHash, encryption: "AES-256", keyHex: storage.key,
        })
      }
      router.push(`/passports/${id}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The passport could not be published.")
    } finally { setSaving(false); setStage("") }
  }

  function setPermission(key: keyof Dataset["permissions"], value: Permission) {
    setForm((current) => ({ ...current, permissions: { ...current.permissions, [key]: value } }))
  }

  return <main className="app-shell"><AppHeader app /><section className="page-section form-page"><div className="form-intro"><span className="section-kicker">New dataset</span><h1>Create a Data Passport.</h1><p>Make your data understandable before anyone requests it. Set the rules once; every license request will use them.</p><div className="form-callout"><LockKeyhole size={18} /><span><strong>Encrypted storage</strong><small>Optional files are encrypted in your browser and uploaded to 0G Storage. You remain responsible for the downloaded recovery key.</small></span></div></div><form className="passport-form" onSubmit={submit} noValidate><label>Dataset name<input autoFocus required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Coastal Speech v1" /></label><label>Description<textarea required maxLength={1000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="A short description requesters can understand." rows={4} /></label><div className="form-row"><label>Data type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Images</option><option>Audio</option><option>Text</option><option>Video</option><option>Tabular</option></select></label><label>Records<input required type="number" min="1" step="1" value={form.samples} onChange={(event) => setForm({ ...form, samples: event.target.value })} placeholder="42000" /></label></div><label className="file-field"><span><UploadCloud size={17} /><strong>Dataset file <small>Optional · max 100 MB</small></strong></span><input type="file" onChange={(event) => setDatasetFile(event.target.files?.[0] ?? null)} /><small>{datasetFile ? `${datasetFile.name} · ${(datasetFile.size / 1024 / 1024).toFixed(2)} MB` : "Connect a wallet to encrypt and upload through 0G Storage."}</small></label><fieldset className="permission-fieldset"><legend>AI usage permissions</legend><div className="permission-form-grid"><PermissionField label="AI training" value={form.permissions.training} onChange={(value) => setPermission("training", value)} /><PermissionField label="Fine-tuning" value={form.permissions.fineTuning} onChange={(value) => setPermission("fineTuning", value)} /><PermissionField label="Inference" value={form.permissions.inference} onChange={(value) => setPermission("inference", value)} /><PermissionField label="Research" value={form.permissions.research} onChange={(value) => setPermission("research", value)} /><PermissionField label="Commercial use" value={form.permissions.commercial} onChange={(value) => setPermission("commercial", value)} /><PermissionField label="Redistribution" value={form.permissions.redistribution} onChange={(value) => setPermission("redistribution", value)} /></div></fieldset><div className="form-row"><label>Paid-use price (0G)<input type="number" min="0" step="0.0001" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="50" /></label><label>License validity (days)<input type="number" min="1" max="3650" step="1" value={form.licenseDurationDays} onChange={(event) => setForm({ ...form, licenseDurationDays: event.target.value })} /></label></div><label className="checkbox-label"><input type="checkbox" checked={form.isPrivate} onChange={(event) => setForm({ ...form, isPrivate: event.target.checked })} /><span><strong>Mark dataset as private</strong><small>The passport metadata remains visible. Encrypted bytes are not readable without the separately held key.</small></span></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><Link href="/dashboard" className="button button-outline">Cancel</Link><button type="submit" className="button button-dark" disabled={saving}>{saving ? stage || "Saving…" : "Create passport"} {!saving && <ArrowRight size={16} />}</button></div><p className="form-footnote">{wallet ? "Ownership and optional storage uploads use your connected wallet." : "Local passports can offer free metadata access only. Connect a wallet for storage, onchain registration, or paid licenses."}</p></form></section><AppNotice /></main>
}

function PermissionField({ label, value, onChange }: { label: string; value: Permission; onChange: (value: Permission) => void }) {
  return <label className="permission-field">{label}<select value={value} onChange={(event) => onChange(event.target.value as Permission)}><option value="allowed">Allow · free</option><option value="paid">Allow · paid</option><option value="denied">Deny</option></select></label>
}
