import { useState, useMemo, useEffect } from 'react'
import { 
    KeyRound, Plus, Pencil, Trash2, Check, X, Eye, EyeOff, 
    ExternalLink, Search, Tag, Building, Copy, ShieldAlert
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { Login } from '../types'

interface Props {
  logins: Login[]
  isAdmin: boolean
  isGF?: boolean
  onCreate: (entry: Omit<Login, 'id' | 'created_at' | 'updated_at'>) => Promise<Login>
  onUpdate: (id: string, updates: Partial<Login>) => Promise<Login>
  onDelete: (id: string) => Promise<void>
}

const KATEGORIEN = ['Alle', 'Interne Logins', 'Externe Logins', 'Social Media']

function emptyLogin(): Omit<Login, 'id' | 'created_at' | 'updated_at'> {
  return { name: '', website: '', login_name: '', passwort: '', anmerkung: '', kategorie: 'Interne Logins', is_gf_only: false }
}

export function LoginsPage({ logins, isAdmin, isGF, onCreate, onUpdate, onDelete }: Props) {
  const [search, setSearch] = useState('')
  const [kat, setKat] = useState('Alle')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Password reveal states
  const [revealIds, setRevealIds] = useState<Record<string, boolean>>({})

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLogin, setEditingLogin] = useState<Login | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Omit<Login, 'id' | 'created_at' | 'updated_at'>>(emptyLogin())

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return logins.filter(l => {
      // 1. Enforce access control: non-GF users can NEVER see GF-only logins
      if (l.is_gf_only && !isGF) return false

      // 2. Category / GF Filter check
      let matchKat = false
      if (kat === 'Alle') {
        matchKat = true
      } else if (kat === 'GF') {
        matchKat = !!l.is_gf_only
      } else {
        matchKat = !!l.kategorie?.includes(kat)
      }

      // 3. Search query check
      const matchQ = !q || [l.name, l.website, l.login_name, l.anmerkung]
        .some(f => f?.toLowerCase().includes(q))

      return matchKat && matchQ
    })
  }, [logins, search, kat, isGF])

  const handleCopy = (text: string, id: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setCopiedField(field)
    toast.success('Kopiert!')
    setTimeout(() => {
      setCopiedId(null)
      setCopiedField(null)
    }, 1500)
  }

  const toggleReveal = (id: string) => {
    setRevealIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const openCreateModal = () => {
    setEditingLogin(null)
    setFormData(emptyLogin())
    setIsModalOpen(true)
  }

  const openEditModal = (login: Login) => {
    setEditingLogin(login)
    setFormData({
      name: login.name || '',
      website: login.website || '',
      login_name: login.login_name || '',
      passwort: login.passwort || '',
      anmerkung: login.anmerkung || '',
      kategorie: login.kategorie || 'Interne Logins',
      is_gf_only: login.is_gf_only || false
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
        toast.error('Name ist erforderlich.')
        return
    }

    setSaving(true)
    try {
        if (editingLogin) {
            await onUpdate(editingLogin.id, formData)
            toast.success('Login erfolgreich aktualisiert')
        } else {
            await onCreate(formData)
            toast.success('Login erfolgreich erstellt')
        }
        setIsModalOpen(false)
    } catch (err: any) {
        toast.error('Fehler beim Speichern: ' + (err.message || err))
    } finally {
        setSaving(false)
    }
  }

  const handleDeleteClick = async (id: string, name: string | null) => {
    if (!confirm(`"${name || 'Eintrag'}" wirklich löschen?`)) return
    try { 
      await onDelete(id)
      toast.success('Gelöscht') 
    } catch (e: any) { 
      toast.error(e.message || 'Fehler beim Löschen') 
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-foreground tracking-tight">
            <KeyRound className="text-primary w-7 h-7" /> Logins & Passwörter
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Passwörter & Accounts ({filtered.length} von {logins.length} Einträgen)
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={18} /> Login hinzufügen
          </button>
        )}
      </div>

      {/* Filters Area */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Name, Website oder Benutzername suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card hover:bg-card/80 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all placeholder:text-muted-foreground/60 text-sm shadow-sm"
          />
        </div>

        {/* Categories filters */}
        <div className="flex bg-card p-1.5 rounded-xl border border-border overflow-x-auto gap-1 scrollbar-none shadow-sm">
          {KATEGORIEN.map(k => (
            <button
              key={k}
              onClick={() => setKat(k)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                kat === k
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              {k}
            </button>
          ))}
          {isGF && (
            <button
              onClick={() => setKat('GF')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                kat === 'GF'
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                  : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
              }`}
            >
              GF Only
            </button>
          )}
        </div>
      </div>

      {/* Logins Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-card rounded-2xl border border-border shadow-sm">
          <ShieldAlert className="text-muted-foreground/40 w-12 h-12 mb-3" />
          <h3 className="font-semibold text-lg text-foreground">Keine Logins gefunden</h3>
          <p className="text-muted-foreground text-sm mt-1 text-center max-w-sm">
            Passe deine Suche oder die Kategorie an, um andere Einträge anzuzeigen.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[25%]">Name / Kategorie</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[35%]">Anmeldedaten</th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[34%]">Notizen & Anmerkungen</th>
                  {isAdmin && <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right w-[6%]">Aktion</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map(l => (
                  <tr key={l.id} className="hover:bg-muted/10 transition-colors group">
                    {/* Name & Kategorie */}
                    <td className="p-4 valign-top align-top">
                      <div className="space-y-1.5">
                        <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          <Building size={16} className="text-muted-foreground shrink-0" />
                          {l.name}
                          {l.is_gf_only && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold uppercase tracking-wider shrink-0">
                              GF
                            </span>
                          )}
                        </div>
                        {l.kategorie && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary uppercase tracking-wide">
                            <Tag size={10} />
                            {l.kategorie}
                          </div>
                        )}
                        {l.website && (
                          <a 
                            href={l.website.startsWith('http') ? l.website : `https://${l.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1 text-xs text-primary hover:underline hover:text-primary/80 transition-colors"
                          >
                            <ExternalLink size={12} />
                            Website öffnen
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Benutzername & Passwort */}
                    <td className="p-4 valign-top align-top">
                      <div className="space-y-2">
                        {l.login_name && (
                          <div className="flex items-center gap-2 group/btn">
                            <span className="text-xs text-muted-foreground font-medium shrink-0 w-16">User:</span>
                            <span className="text-xs font-mono text-foreground bg-muted/40 px-2 py-1 rounded select-all max-w-[200px] truncate">
                              {l.login_name}
                            </span>
                            <button 
                              onClick={() => handleCopy(l.login_name || '', l.id, 'username')}
                              className="text-muted-foreground hover:text-foreground opacity-0 group-hover/btn:opacity-100 transition-opacity"
                              title="Benutzername kopieren"
                            >
                              {copiedId === l.id && copiedField === 'username' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                            </button>
                          </div>
                        )}
                        {l.passwort && (
                          <div className="flex items-center gap-2 group/btn">
                            <span className="text-xs text-muted-foreground font-medium shrink-0 w-16">Passwort:</span>
                            <span className="text-xs font-mono text-foreground bg-muted/40 px-2 py-1 rounded select-all max-w-[200px] truncate">
                              {revealIds[l.id] ? l.passwort : '••••••••'}
                            </span>
                            <button 
                              onClick={() => toggleReveal(l.id)}
                              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                              title={revealIds[l.id] ? "Passwort verbergen" : "Passwort anzeigen"}
                            >
                              {revealIds[l.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            <button 
                              onClick={() => handleCopy(l.passwort || '', l.id, 'passwort')}
                              className="text-muted-foreground hover:text-foreground opacity-0 group-hover/btn:opacity-100 transition-opacity shrink-0"
                              title="Passwort kopieren"
                            >
                              {copiedId === l.id && copiedField === 'passwort' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                            </button>
                          </div>
                        )}
                        {!l.login_name && !l.passwort && (
                          <span className="text-xs text-muted-foreground/60 italic">Keine Login-Daten</span>
                        )}
                      </div>
                    </td>

                    {/* Anmerkungen */}
                    <td className="p-4 valign-top align-top text-xs space-y-2">
                      {l.anmerkung ? (
                        <div className="text-muted-foreground leading-relaxed">
                          {l.anmerkung}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50 italic">Keine Bemerkungen</span>
                      )}
                    </td>

                    {/* Actions */}
                    {isAdmin && (
                      <td className="p-4 valign-middle align-middle text-right">
                        {(!l.is_gf_only || isGF) && (
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(l)}
                              className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                              title="Bearbeiten"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(l.id, l.name)}
                              className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                              title="Löschen"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/60">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                {editingLogin ? <Pencil size={18} className="text-primary" /> : <Plus size={18} className="text-primary" />}
                {editingLogin ? 'Login bearbeiten' : 'Neues Login hinzufügen'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Primary Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                    placeholder="z.B. Adobe Cloud"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Kategorie</label>
                  <select
                    value={formData.kategorie || 'Interne Logins'}
                    onChange={(e) => setFormData(prev => ({ ...prev, kategorie: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm cursor-pointer"
                  >
                    <option value="Interne Logins">Interne Logins</option>
                    <option value="Externe Logins">Externe Logins</option>
                    <option value="Social Media">Social Media</option>
                  </select>
                </div>
              </div>

              {/* Credentials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/40 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Benutzername</label>
                  <input
                    type="text"
                    value={formData.login_name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, login_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                    placeholder="E-Mail oder Login-Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Passwort</label>
                  <input
                    type="text"
                    value={formData.passwort || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, passwort: e.target.value }))}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                    placeholder="Passwort"
                  />
                </div>
              </div>

              {/* Website */}
              <div className="border-t border-border/40 pt-4">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Website / Login-Link</label>
                <input
                  type="text"
                  value={formData.website || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                  placeholder="https://..."
                />
              </div>

              {/* Anmerkung */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Bemerkung / Anmerkung</label>
                <textarea
                  value={formData.anmerkung || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, anmerkung: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm h-20 resize-none"
                  placeholder="Zusätzliche Infos..."
                />
              </div>

              {/* GF-Only checkbox (GF only) */}
              {isGF && (
                <div className="flex items-center gap-2 border-t border-border/40 pt-4">
                  <input
                    type="checkbox"
                    id="is_gf_only"
                    checked={formData.is_gf_only || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_gf_only: e.target.checked }))}
                    className="w-4 h-4 rounded bg-background border-border text-red-600 focus:ring-red-500/50"
                  />
                  <label htmlFor="is_gf_only" className="text-xs font-bold text-red-400 uppercase tracking-wide cursor-pointer">
                    GF Only (Eintrag nur für GF & Superadmin sichtbar)
                  </label>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-xl hover:bg-muted text-foreground text-sm font-semibold transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
