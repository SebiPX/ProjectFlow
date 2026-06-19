import React, { useEffect, useState, useMemo } from 'react';
import { accounts, Account, uploadFile } from '../lib/apiClient';
import { 
    Search, Copy, Check, Plus, Pencil, Trash2, Eye, EyeOff, 
    ExternalLink, ShieldAlert, KeyRound, Building, Mail, Phone, MapPin, Tag, FileText, X, Upload
} from 'lucide-react';
import { toast } from 'react-toastify';

interface AccountListProps {
    searchQuery?: string;
}

export const AccountList: React.FC<AccountListProps> = ({ searchQuery = '' }) => {
    const [list, setList] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [localSearch, setLocalSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Alle');
    
    // Copy tracking states
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Password reveal states
    const [revealIds, setRevealIds] = useState<Record<string, boolean>>({});

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [formData, setFormData] = useState<Omit<Account, 'id' | 'created_at' | 'updated_at'>>({
        firma: '',
        kategorie: '',
        bemerkung: '',
        website: '',
        benutzername: '',
        passwort: '',
        kundennummer: '',
        strasse: '',
        telefonnummer: '',
        email: '',
        sonstiges: '',
        dokumente: ''
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    // Sync search from global navigation if present
    useEffect(() => {
        if (searchQuery) {
            setLocalSearch(searchQuery);
        }
    }, [searchQuery]);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const data = await accounts.list();
            setList(data);
        } catch (err: any) {
            toast.error('Accounts konnten nicht geladen werden: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Extract categories
    const categories = useMemo(() => {
        const cats = new Set<string>();
        list.forEach(a => a.kategorie && cats.add(a.kategorie.trim()));
        return ['Alle', ...Array.from(cats).sort()];
    }, [list]);

    // Filter accounts
    const filtered = useMemo(() => {
        const query = localSearch.toLowerCase();
        return list.filter(a => {
            const matchesSearch = !query || 
                [a.firma, a.kategorie, a.benutzername, a.email, a.bemerkung, a.sonstiges, a.kundennummer]
                .some(field => field?.toLowerCase().includes(query));
            const matchesCategory = categoryFilter === 'Alle' || a.kategorie === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [list, localSearch, categoryFilter]);

    const handleCopy = (text: string, id: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setCopiedField(field);
        toast.success('Kopiert!');
        setTimeout(() => {
            setCopiedId(null);
            setCopiedField(null);
        }, 1500);
    };

    const toggleReveal = (id: string) => {
        setRevealIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const openCreateModal = () => {
        setEditingAccount(null);
        setFormData({
            firma: '',
            kategorie: '',
            bemerkung: '',
            website: '',
            benutzername: '',
            passwort: '',
            kundennummer: '',
            strasse: '',
            telefonnummer: '',
            email: '',
            sonstiges: '',
            dokumente: ''
        });
        setIsModalOpen(true);
    };

    const openEditModal = (account: Account) => {
        setEditingAccount(account);
        setFormData({
            firma: account.firma || '',
            kategorie: account.kategorie || '',
            bemerkung: account.bemerkung || '',
            website: account.website || '',
            benutzername: account.benutzername || '',
            passwort: account.passwort || '',
            kundennummer: account.kundennummer || '',
            strasse: account.strasse || '',
            telefonnummer: account.telefonnummer || '',
            email: account.email || '',
            sonstiges: account.sonstiges || '',
            dokumente: account.dokumente || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.firma) {
            toast.error('Firmenname ist erforderlich.');
            return;
        }

        try {
            if (editingAccount) {
                const updated = await accounts.update(editingAccount.id, formData);
                setList(prev => prev.map(a => a.id === editingAccount.id ? updated : a));
                toast.success('Account erfolgreich aktualisiert');
            } else {
                const created = await accounts.create(formData);
                setList(prev => [...prev, created].sort((a, b) => a.firma.localeCompare(b.firma)));
                toast.success('Account erfolgreich erstellt');
            }
            setIsModalOpen(false);
        } catch (err: any) {
            toast.error('Fehler beim Speichern: ' + err.message);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Möchtest du den Account "${name}" wirklich löschen?`)) return;

        try {
            await accounts.delete(id);
            setList(prev => prev.filter(a => a.id !== id));
            toast.success('Account erfolgreich gelöscht');
        } catch (err: any) {
            toast.error('Fehler beim Löschen: ' + err.message);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadFile(file, 'accounts');
            setFormData(prev => ({ ...prev, dokumente: url }));
            toast.success('Dokument erfolgreich hochgeladen!');
        } catch (err: any) {
            toast.error('Upload fehlgeschlagen: ' + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm">Accountliste wird geladen...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3 text-foreground tracking-tight">
                        <KeyRound className="text-primary w-7 h-7" /> Accountliste
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Gespiegelte Airtable-Verbindungen & Anmeldedaten ({filtered.length} von {list.length} Einträgen)
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <Plus size={18} /> Account hinzufügen
                </button>
            </div>

            {/* Filters Area */}
            <div className="space-y-4">
                {/* Search Inputs */}
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Firma, Login, Kundennummer oder Anmerkung suchen..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-card hover:bg-card/80 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all placeholder:text-muted-foreground/60 text-sm shadow-sm"
                    />
                </div>

                {/* Categories filter tag list */}
                <div className="flex bg-card p-1.5 rounded-xl border border-border overflow-x-auto gap-1 scrollbar-none shadow-sm">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                                categoryFilter === cat
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Accounts Table Grid */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-card rounded-2xl border border-border shadow-sm">
                    <ShieldAlert className="text-muted-foreground/40 w-12 h-12 mb-3" />
                    <h3 className="font-semibold text-lg text-foreground">Keine Accounts gefunden</h3>
                    <p className="text-muted-foreground text-sm mt-1 text-center max-w-sm">
                        Passe deine Suche oder die ausgewählte Kategorie an, um andere Einträge anzuzeigen.
                    </p>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-border bg-muted/20">
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[22%]">Firma / Kategorie</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[28%]">Anmeldedaten</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[22%]">Kontaktdaten</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-[22%]">Notizen & Anmerkungen</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right w-[6%]">Aktion</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filtered.map(acc => (
                                    <tr key={acc.id} className="hover:bg-muted/10 transition-colors group">
                                        {/* Firma & Kategorie */}
                                        <td className="p-4 valign-top align-top">
                                            <div className="space-y-1.5">
                                                <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                                                    <Building size={16} className="text-muted-foreground shrink-0" />
                                                    {acc.firma}
                                                </div>
                                                {acc.kategorie && (
                                                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary uppercase tracking-wide">
                                                        <Tag size={10} />
                                                        {acc.kategorie}
                                                    </div>
                                                )}
                                                {acc.website && (
                                                    <a 
                                                        href={acc.website.startsWith('http') ? acc.website : `https://${acc.website}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="flex items-center gap-1 text-xs text-primary hover:underline hover:text-primary/80 transition-colors"
                                                    >
                                                        <ExternalLink size={12} />
                                                        Website aufrufen
                                                    </a>
                                                )}
                                            </div>
                                        </td>

                                        {/* Benutzername & Passwort */}
                                        <td className="p-4 valign-top align-top">
                                            <div className="space-y-2">
                                                {acc.benutzername && (
                                                    <div className="flex items-center gap-2 group/btn">
                                                        <span className="text-xs text-muted-foreground font-medium shrink-0 w-16">User:</span>
                                                        <span className="text-xs font-mono text-foreground bg-muted/40 px-2 py-1 rounded select-all max-w-[150px] truncate">{acc.benutzername}</span>
                                                        <button 
                                                            onClick={() => handleCopy(acc.benutzername || '', acc.id, 'username')}
                                                            className="text-muted-foreground hover:text-foreground opacity-0 group-hover/btn:opacity-100 transition-opacity"
                                                            title="Benutzername kopieren"
                                                        >
                                                            {copiedId === acc.id && copiedField === 'username' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                                        </button>
                                                    </div>
                                                )}
                                                {acc.passwort && (
                                                    <div className="flex items-center gap-2 group/btn">
                                                        <span className="text-xs text-muted-foreground font-medium shrink-0 w-16">Passwort:</span>
                                                        <span className="text-xs font-mono text-foreground bg-muted/40 px-2 py-1 rounded select-all max-w-[150px] truncate">
                                                            {revealIds[acc.id] ? acc.passwort : '••••••••'}
                                                        </span>
                                                        <button 
                                                            onClick={() => toggleReveal(acc.id)}
                                                            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                                            title={revealIds[acc.id] ? "Passwort verbergen" : "Passwort anzeigen"}
                                                        >
                                                            {revealIds[acc.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                                                        </button>
                                                        <button 
                                                            onClick={() => handleCopy(acc.passwort || '', acc.id, 'passwort')}
                                                            className="text-muted-foreground hover:text-foreground opacity-0 group-hover/btn:opacity-100 transition-opacity shrink-0"
                                                            title="Passwort kopieren"
                                                        >
                                                            {copiedId === acc.id && copiedField === 'passwort' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                                                        </button>
                                                    </div>
                                                )}
                                                {!acc.benutzername && !acc.passwort && (
                                                    <span className="text-xs text-muted-foreground/60 italic">Keine Login-Daten</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Kontaktdaten */}
                                        <td className="p-4 valign-top align-top text-xs space-y-1.5">
                                            {acc.email && (
                                                <div className="flex items-center gap-1.5 text-foreground max-w-full truncate">
                                                    <Mail size={13} className="text-muted-foreground shrink-0" />
                                                    <a href={`mailto:${acc.email}`} className="hover:underline hover:text-primary">{acc.email}</a>
                                                </div>
                                            )}
                                            {acc.telefonnummer && (
                                                <div className="flex items-center gap-1.5 text-foreground">
                                                    <Phone size={13} className="text-muted-foreground shrink-0" />
                                                    <span>{acc.telefonnummer}</span>
                                                </div>
                                            )}
                                            {acc.strasse && (
                                                <div className="flex items-start gap-1.5 text-foreground">
                                                    <MapPin size={13} className="text-muted-foreground shrink-0 mt-0.5" />
                                                    <span className="leading-tight">{acc.strasse}</span>
                                                </div>
                                            )}
                                            {!acc.email && !acc.telefonnummer && !acc.strasse && (
                                                <span className="text-xs text-muted-foreground/60 italic">Keine Kontaktinfos</span>
                                            )}
                                        </td>

                                        {/* Notizen, Bemerkungen, etc. */}
                                        <td className="p-4 valign-top align-top text-xs space-y-2 max-w-xs">
                                            {acc.bemerkung && (
                                                <div className="text-foreground leading-relaxed">
                                                    {acc.bemerkung}
                                                </div>
                                            )}
                                            {acc.kundennummer && (
                                                <div className="text-[11px] font-semibold text-muted-foreground bg-muted/30 px-2 py-0.5 rounded inline-block">
                                                    Kd-Nr: {acc.kundennummer}
                                                </div>
                                            )}
                                            {acc.sonstiges && (
                                                <div className="text-muted-foreground/90 border-t border-border/40 pt-1.5">
                                                    <span className="font-semibold text-foreground/80">Sonstiges:</span> {acc.sonstiges}
                                                </div>
                                            )}
                                            {acc.dokumente && (
                                                <div className="border-t border-border/40 pt-1.5 space-y-1">
                                                    <div className="flex items-center gap-1.5 text-[11px]">
                                                        <FileText size={12} className="text-muted-foreground shrink-0" />
                                                        <button 
                                                            onClick={() => { setPreviewUrl(acc.dokumente || ''); setPreviewTitle(acc.firma); }}
                                                            className="text-primary hover:underline font-semibold text-left truncate"
                                                            title="Vorschau anzeigen"
                                                        >
                                                            Vorschau anzeigen
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[11px]">
                                                        <ExternalLink size={12} className="text-muted-foreground shrink-0" />
                                                        <a 
                                                            href={acc.dokumente.startsWith('http') ? acc.dokumente : `https://${acc.dokumente}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="text-muted-foreground hover:text-foreground hover:underline truncate"
                                                            title={acc.dokumente}
                                                        >
                                                            Link öffnen
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </td>

                                        {/* Edit / Delete Actions */}
                                        <td className="p-4 valign-middle align-middle text-right">
                                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(acc)}
                                                    className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                                                    title="Bearbeiten"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(acc.id, acc.firma)}
                                                    className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                                                    title="Löschen"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
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
                    <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-border/60">
                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                {editingAccount ? <Pencil size={18} className="text-primary" /> : <Plus size={18} className="text-primary" />}
                                {editingAccount ? 'Account bearbeiten' : 'Neuen Account hinzufügen'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content Form */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Primary Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Firma *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.firma}
                                        onChange={(e) => setFormData(prev => ({ ...prev, firma: e.target.value }))}
                                        className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                                        placeholder="z.B. Adobe Creative Cloud"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Kategorie</label>
                                    <input
                                        type="text"
                                        value={formData.kategorie || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, kategorie: e.target.value }))}
                                        className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                                        placeholder="z.B. Software, Intern, Cloud"
                                    />
                                </div>
                            </div>

                            {/* Credentials */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/40 pt-4">
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Benutzername</label>
                                    <input
                                        type="text"
                                        value={formData.benutzername || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, benutzername: e.target.value }))}
                                        className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                                        placeholder="E-Mail oder Alias"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Passwort</label>
                                    <input
                                        type="text"
                                        value={formData.passwort || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, passwort: e.target.value }))}
                                        className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                                        placeholder="Sicheres Passwort"
                                    />
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border/40 pt-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">E-Mail Adresse</label>
                                    <input
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                                        placeholder="kontakt@partner.de"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Telefonnummer</label>
                                    <input
                                        type="text"
                                        value={formData.telefonnummer || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, telefonnummer: e.target.value }))}
                                        className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                                        placeholder="+49..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Website / Login-Link</label>
                                    <input
                                        type="text"
                                        value={formData.website || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                        className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Strasse & Ort</label>
                                    <input
                                        type="text"
                                        value={formData.strasse || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, strasse: e.target.value }))}
                                        className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                                        placeholder="Musterweg 1, 80331 München"
                                    />
                                </div>
                            </div>

                            {/* Additional metadata */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/40 pt-4">
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Kundennummer</label>
                                    <input
                                        type="text"
                                        value={formData.kundennummer || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, kundennummer: e.target.value }))}
                                        className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                                        placeholder="Kunden-ID / Nummer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                                        Dokumente (SharePoint-Link oder Datei hochladen)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.dokumente || ''}
                                            onChange={(e) => setFormData(prev => ({ ...prev, dokumente: e.target.value }))}
                                            className="flex-1 px-3 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                                            placeholder="Link zu Verträgen/Details oder hochladen →"
                                        />
                                        <label className="flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 border border-border text-foreground hover:text-primary rounded-xl cursor-pointer transition-colors text-sm shrink-0">
                                            {isUploading ? (
                                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Upload size={16} />
                                            )}
                                            <span>Hochladen</span>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                onChange={handleFileUpload} 
                                                disabled={isUploading}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Bemerkung</label>
                                <textarea
                                    value={formData.bemerkung || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bemerkung: e.target.value }))}
                                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm h-16 resize-none"
                                    placeholder="Allgemeine Bemerkung..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Sonstiges</label>
                                <input
                                    type="text"
                                    value={formData.sonstiges || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, sonstiges: e.target.value }))}
                                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-sm"
                                    placeholder="Sonstige relevante Informationen"
                                />
                            </div>

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
                                    className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
                                >
                                    Speichern
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewUrl && (
                <div 
                    className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => { setPreviewUrl(null); setPreviewTitle(null); }}
                >
                    <div 
                        className="bg-card border border-border w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Preview Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border/60 bg-muted/10">
                            <h2 className="text-sm font-bold text-foreground truncate max-w-lg">
                                Dokumentenvorschau - {previewTitle || 'Account'}
                            </h2>
                            <button
                                onClick={() => { setPreviewUrl(null); setPreviewTitle(null); }}
                                className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Preview Content */}
                        <div className="flex-1 overflow-auto bg-muted/20 p-6 flex items-center justify-center min-h-[50vh]">
                            {(() => {
                                const url = previewUrl.toLowerCase();
                                const isImage = url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/) || url.startsWith('data:image/');
                                const isPDF = url.endsWith('.pdf') || url.includes('/pdf') || url.includes('type=pdf');
                                
                                if (isImage) {
                                    return (
                                        <img 
                                            src={previewUrl} 
                                            alt={previewTitle || "Vorschau"} 
                                            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md"
                                        />
                                    );
                                } else if (isPDF) {
                                    return (
                                        <iframe 
                                            src={previewUrl} 
                                            className="w-full h-[70vh] rounded-lg border border-border bg-white" 
                                            title="PDF Vorschau"
                                        />
                                    );
                                } else {
                                    return (
                                        <div className="text-center space-y-4 py-8">
                                            <FileText className="mx-auto text-muted-foreground w-16 h-16" />
                                            <div>
                                                <h3 className="font-semibold text-lg text-foreground">Direkte Vorschau nicht möglich</h3>
                                                <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                                                    Dieses Format kann nicht direkt im Browser gerendert werden. Du kannst das Dokument in einem neuen Tab öffnen.
                                                </p>
                                            </div>
                                            <a 
                                                href={previewUrl.startsWith('http') ? previewUrl : `https://${previewUrl}`}
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 shadow-md transition-colors text-sm"
                                            >
                                                <ExternalLink size={16} />
                                                Dokument in neuem Tab öffnen
                                            </a>
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
