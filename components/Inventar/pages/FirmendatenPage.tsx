import { useState } from 'react'
import { Building2, Landmark, Plus, Pencil, Trash2, Check, X, FileText, Upload, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Firmendatum } from '../types'

interface Props {
  firmendaten: Firmendatum[]
  onCreate: (entry: Omit<Firmendatum, 'id' | 'created_at' | 'updated_at'>) => Promise<Firmendatum>
  onUpdate: (id: string, updates: Partial<Firmendatum>) => Promise<Firmendatum>
  onDelete: (id: string) => Promise<void>
}

const inputCls = 'w-full px-2 py-1.5 bg-background border border-input rounded-lg text-xs text-foreground placeholder-slate-500 focus:outline-none focus:border-brand-500'

type Kat = 'Bankverbindung' | 'Handelsregister' | 'DUNS'

function emptyEintrag(kat: Kat): Omit<Firmendatum, 'id' | 'created_at' | 'updated_at'> {
  return { kategorie: kat, bezeichner: '', wert: '', anmerkung: '', datei_name: '', sort_order: 99 }
}

function getFileName(urlOrName: string) {
  if (!urlOrName) return ''
  if (urlOrName.startsWith('http://') || urlOrName.startsWith('https://')) {
    try {
      const decoded = decodeURIComponent(urlOrName)
      const parts = decoded.split('/')
      return parts[parts.length - 1] || urlOrName
    } catch {
      return urlOrName.split('/').pop() || urlOrName
    }
  }
  return urlOrName
}

// ── Bankverbindung section ──────────────────────────────────
function BankSection({ rows, onEdit, onDelete, onAdd }: {
  rows: Firmendatum[]
  onEdit: (f: Firmendatum) => void
  onDelete: (id: string, label: string | null) => void
  onAdd: () => void
}) {
  return (
    <div className="bg-card/60 border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-background/40">
        <div className="flex items-center gap-2.5">
          <Landmark size={18} className="text-brand-400" />
          <h2 className="font-semibold text-foreground">Bankverbindung</h2>
          <span className="text-xs text-muted-foreground">{rows.length} Einträge</span>
        </div>
        <button onClick={onAdd} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-foreground text-xs font-semibold rounded-lg transition-colors">
          <Plus size={13} /> Neu
        </button>
      </div>
      <div className="divide-y divide-slate-700/50">
        {rows.map(f => (
          <div key={f.id} className="flex items-start gap-4 px-5 py-3 hover:bg-muted/20 transition-colors group">
            <span className="w-40 shrink-0 text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-0.5">
              {f.bezeichner || (f.kategorie === 'DUNS' ? 'D-U-N-S' : '')}
            </span>
            <div className="flex-1 min-w-0">
              <span className={`font-mono text-sm text-foreground break-all select-all ${f.kategorie === 'DUNS' ? 'font-semibold' : ''}`}>
                {f.wert || '–'}
              </span>
              {f.anmerkung && (
                <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{f.anmerkung}</p>
              )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => onEdit(f)} className="p-1.5 text-muted-foreground hover:text-brand-400 transition-colors"><Pencil size={13} /></button>
              <button onClick={() => onDelete(f.id, f.bezeichner)} className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Handelsregister section ─────────────────────────────────
function RegisterSection({ rows, onEdit, onDelete, onAdd, onUploadFile, onRemoveFile, uploadingId }: {
  rows: Firmendatum[]
  onEdit: (f: Firmendatum) => void
  onDelete: (id: string, label: string | null) => void
  onAdd: () => void
  onUploadFile: (id: string, file: File) => void
  onRemoveFile: (id: string) => void
  uploadingId: string | null
}) {
  return (
    <div className="bg-card/60 border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-background/40">
        <div className="flex items-center gap-2.5">
          <FileText size={18} className="text-brand-400" />
          <h2 className="font-semibold text-foreground">Handelsregister</h2>
          <span className="text-xs text-muted-foreground">{rows.length} Einträge</span>
        </div>
        <button onClick={onAdd} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-foreground text-xs font-semibold rounded-lg transition-colors">
          <Plus size={13} /> Neu
        </button>
      </div>
      <div className="divide-y divide-slate-700/50">
        {rows.map(f => (
          <div key={f.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors group">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">{f.bezeichner}</p>
              {f.anmerkung && <p className="text-xs text-muted-foreground mt-0.5">{f.anmerkung}</p>}
              
              <div className="mt-1.5 flex items-center gap-2">
                {uploadingId === f.id ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 border border-border rounded-lg px-2.5 py-1">
                    <Loader2 size={11} className="animate-spin text-brand-400" />
                    Wird hochgeladen...
                  </span>
                ) : f.datei_name ? (
                  <span className="inline-flex items-center gap-1 bg-muted/50 border border-input rounded-lg pr-1 pl-2.5 py-0.5 text-xs text-muted-foreground">
                    <a
                      href={f.datei_name.startsWith('http') ? f.datei_name : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 font-medium ${
                        f.datei_name.startsWith('http')
                          ? 'text-brand-400 hover:text-brand-300 transition-colors'
                          : ''
                      }`}
                    >
                      <FileText size={11} className="text-current" />
                      {getFileName(f.datei_name)}
                    </a>
                    <button
                      onClick={() => onRemoveFile(f.id)}
                      title="Datei entfernen"
                      className="p-1 hover:text-red-400 transition-colors text-muted-foreground"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ) : (
                  <label className="inline-flex items-center gap-1.5 text-xs text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded-lg px-2.5 py-1 cursor-pointer transition-all">
                    <Upload size={11} className="text-brand-400" />
                    <span>PDF hochladen</span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) onUploadFile(f.id, file)
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => onEdit(f)} className="p-1.5 text-muted-foreground hover:text-brand-400 transition-colors"><Pencil size={13} /></button>
              <button onClick={() => onDelete(f.id, f.bezeichner)} className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Edit / Add Modal ────────────────────────────────────────
function EditModal({ entry, onSave, onClose, saving }: {
  entry: Omit<Firmendatum, 'id' | 'created_at' | 'updated_at'>
  onSave: (data: typeof entry) => void
  onClose: () => void
  saving: boolean
}) {
  const [data, setData] = useState({ ...entry })
  const [uploading, setUploading] = useState(false)
  const set = (k: keyof typeof data, v: string) => setData(p => ({ ...p, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">
            {entry.bezeichner ? `Bearbeiten: ${entry.bezeichner}` : 'Neuer Eintrag'}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block">
            <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Kategorie</span>
            <select value={data.kategorie} onChange={e => set('kategorie', e.target.value as Kat)}
              className={inputCls + ' cursor-pointer'}>
              <option value="Bankverbindung">Bankverbindung</option>
              <option value="Handelsregister">Handelsregister</option>
              <option value="DUNS">D-U-N-S Nummer</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Bezeichner / Name</span>
            <input value={data.bezeichner || ''} onChange={e => set('bezeichner', e.target.value)} className={inputCls} placeholder="z.B. IBAN oder HRB 209335" />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Wert</span>
            <input value={data.wert || ''} onChange={e => set('wert', e.target.value)} className={inputCls} placeholder="Inhalt / Wert" />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Anmerkung</span>
            <textarea value={data.anmerkung || ''} onChange={e => set('anmerkung', e.target.value)}
              className={inputCls + ' resize-none h-20'} placeholder="Zusätzliche Infos" />
          </label>
          {data.kategorie === 'Handelsregister' && (
            <div className="block">
              <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">PDF Dokument</span>
              {uploading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 border border-border rounded-lg p-2.5">
                  <Loader2 size={13} className="animate-spin text-brand-400" />
                  <span>Wird hochgeladen...</span>
                </div>
              ) : data.datei_name ? (
                <div className="flex items-center justify-between bg-muted/50 border border-input rounded-lg p-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 truncate max-w-[80%] font-medium text-brand-400">
                    <FileText size={13} />
                    {getFileName(data.datei_name)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setData(p => ({ ...p, datei_name: '' }))}
                    className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
                    title="Datei entfernen"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border border-dashed border-input hover:border-brand-500/50 hover:bg-brand-500/5 rounded-lg py-4 cursor-pointer transition-all">
                  <Upload size={14} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Klicken zum Hochladen (PDF)</span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploading(true)
                      try {
                        const { uploadFile } = await import('../../../lib/apiClient')
                        const url = await uploadFile(file, 'firmendaten')
                        setData(p => ({ ...p, datei_name: url }))
                        toast.success('Datei erfolgreich hochgeladen')
                      } catch (err: any) {
                        toast.error(err.message || 'Upload failed')
                      } finally {
                        setUploading(false)
                      }
                    }}
                  />
                </label>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg transition-colors">Abbrechen</button>
          <button onClick={() => onSave(data)} disabled={saving || uploading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-foreground text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
            {saving || uploading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Speichern
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────
export function FirmendatenPage({ firmendaten, onCreate, onUpdate, onDelete }: Props) {
  const [modal, setModal] = useState<{
    mode: 'edit' | 'add'
    data: Omit<Firmendatum, 'id' | 'created_at' | 'updated_at'>
    id?: string
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  const bankRows = firmendaten.filter(f => f.kategorie === 'Bankverbindung')
  const registerRows = firmendaten.filter(f => f.kategorie === 'Handelsregister')
  const dunsRows = firmendaten.filter(f => f.kategorie === 'DUNS')

  function openEdit(f: Firmendatum) {
    setModal({ mode: 'edit', id: f.id, data: { kategorie: f.kategorie, bezeichner: f.bezeichner, wert: f.wert, anmerkung: f.anmerkung, datei_name: f.datei_name, sort_order: f.sort_order } })
  }
  function openAdd(kat: Kat) {
    setModal({ mode: 'add', data: emptyEintrag(kat) })
  }

  async function handleDelete(id: string, label: string | null) {
    if (!confirm(`"${label || 'Eintrag'}" wirklich löschen?`)) return
    try { await onDelete(id); toast.success('Gelöscht') }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Fehler') }
  }

  async function handleSave(data: Omit<Firmendatum, 'id' | 'created_at' | 'updated_at'>) {
    setSaving(true)
    try {
      if (modal?.mode === 'edit' && modal.id) {
        await onUpdate(modal.id, data)
        toast.success('Gespeichert')
      } else {
        await onCreate(data)
        toast.success('Hinzugefügt')
      }
      setModal(null)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Fehler')
    } finally {
      setSaving(false)
    }
  }

  async function handleFileUpload(id: string, file: File) {
    setUploadingId(id)
    try {
      const { uploadFile } = await import('../../../lib/apiClient')
      const fileUrl = await uploadFile(file, 'firmendaten')
      await onUpdate(id, { datei_name: fileUrl })
      toast.success('PDF erfolgreich hochgeladen')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Upload fehlgeschlagen')
    } finally {
      setUploadingId(null)
    }
  }

  async function handleFileRemove(id: string) {
    if (!confirm('Möchten Sie das PDF-Dokument wirklich entfernen?')) return
    try {
      await onUpdate(id, { datei_name: '' })
      toast.success('Dokument entfernt')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Entfernen fehlgeschlagen')
    }
  }

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <Building2 size={24} className="text-brand-400" /> Firmendaten
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Bankverbindung & Handelsregister — nur für Admins sichtbar</p>
      </div>

      <BankSection
        rows={[...bankRows, ...dunsRows]}
        onEdit={openEdit}
        onDelete={handleDelete}
        onAdd={() => openAdd('Bankverbindung')}
      />

      <RegisterSection
        rows={registerRows}
        onEdit={openEdit}
        onDelete={handleDelete}
        onAdd={() => openAdd('Handelsregister')}
        onUploadFile={handleFileUpload}
        onRemoveFile={handleFileRemove}
        uploadingId={uploadingId}
      />

      {/* Edit/Add Modal */}
      {modal && (
        <EditModal
          entry={modal.data}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
    </div>
  )
}


