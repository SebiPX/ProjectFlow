import React, { useState, useEffect } from 'react';
import { getToken, API_URL } from '../lib/apiClient';
import { 
  FileText, 
  Search, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Printer, 
  LayoutGrid, 
  Sliders, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Settings,
  ArrowRightLeft,
  Info
} from 'lucide-react';

// 10 Logical Groupings
const LOGICAL_GROUPS = [
  { id: 1, name: 'Konzeption & Kreation', description: 'Briefing, Konzeption, Scribbles, Design & Entwürfe' },
  { id: 2, name: 'Projektmanagement', description: 'Steuerung, Koordination, Beratung & Admin' },
  { id: 3, name: 'Standorte', description: 'Recherche, Anfragen & Locationchecks' },
  { id: 4, name: 'Technische Planung', description: 'Pläne, Machbarkeitsprüfung & Statik' },
  { id: 5, name: 'Produktion', description: 'Messebau, Deko, Catering, Technik, Show & Personal' },
  { id: 6, name: 'Digital', description: 'Landingpages, QR-Codes, Registrierung & Mailings' },
  { id: 7, name: 'Logistik', description: 'Auf-/Abbau, Transporte, Hotel & Shuttles' },
  { id: 8, name: 'Betrieb', description: 'Security, Brandschutz & Versicherungen' },
  { id: 9, name: 'Kommunikation', description: 'Foto/Video, Radio, Marketing & Kooperationen' },
  { id: 10, name: 'Projektabschluss', description: 'Debriefing & Abschlussreport' }
];

interface MocoItem {
  id: number;
  type: 'item' | 'title';
  title: string;
  description: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  net_total: number;
  optional?: boolean;
  manualGroup?: string; // Overrides the auto-assigned group
}

interface MocoOffer {
  id: number;
  identifier: string | null;
  title: string;
  date: string;
  due_date: string | null;
  currency: string;
  net_total: number;
  tax: number;
  gross_total: number;
  recipient_address: string;
  items: MocoItem[];
  company?: { name: string };
  project?: { id: number; name: string };
}

export const MocoOffers: React.FC = () => {
  const [offerId, setOfferId] = useState<string>('2310479');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState<MocoOffer | null>(null);
  const [items, setItems] = useState<MocoItem[]>([]);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Konzeption & Kreation': true,
    'Projektmanagement': true,
    'Standorte': true,
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlyNonZero, setShowOnlyNonZero] = useState<boolean>(false);

  // Auto-Grouping Algorithm based on Keywords
  const determineGroup = (item: MocoItem): string => {
    if (item.manualGroup) return item.manualGroup;

    const titleLower = item.title.toLowerCase();
    const descLower = (item.description || '').toLowerCase();
    const textToSearch = `${titleLower} ${descLower}`;

    // 10. Nachbereitung / Projektabschluss
    if (textToSearch.includes('nachbereitung') || textToSearch.includes('debrief') || textToSearch.includes('abschlussreport') || textToSearch.includes('abschluss')) {
      return 'Projektabschluss';
    }
    // 8. Betrieb / Security
    if (textToSearch.includes('security') || textToSearch.includes('bewachung') || textToSearch.includes('versicherung') || textToSearch.includes('brandschutz') || textToSearch.includes('brandwache') || textToSearch.includes('sanitäter') || textToSearch.includes('betrieb')) {
      return 'Betrieb';
    }
    // 9. Kommunikation / Foto / Video / Radio
    if (textToSearch.includes('radio') || textToSearch.includes('foto') || textToSearch.includes('video') || textToSearch.includes('fotograf') || textToSearch.includes('videograph') || textToSearch.includes('layout druckdaten') || textToSearch.includes('druckdaten') || textToSearch.includes('kommunikation')) {
      return 'Kommunikation';
    }
    // 7. Logistik / Transport / Aufbau / Übernachtung / Hotel
    if (textToSearch.includes('logistik') || textToSearch.includes('transport') || textToSearch.includes('spedition') || textToSearch.includes('lagerung') || textToSearch.includes('aufbau') || textToSearch.includes('abbau') || textToSearch.includes('shuttle') || textToSearch.includes('transfer') || textToSearch.includes('hotel') || textToSearch.includes('übernachtung') || textToSearch.includes('reisekosten') || textToSearch.includes('verpflegung')) {
      return 'Logistik';
    }
    // 6. Digital
    if (textToSearch.includes('landingpage') || textToSearch.includes('qr-code') || textToSearch.includes('tracking') || textToSearch.includes('analytics') || textToSearch.includes('registrierungsplattform') || textToSearch.includes('mailings') || textToSearch.includes('digital')) {
      return 'Digital';
    }
    // 4. Technische Planung
    if (textToSearch.includes('machbarkeitsprüfung') || textToSearch.includes('statik') || textToSearch.includes('cad-planung') || textToSearch.includes('genehmigungsfähiger plan') || textToSearch.includes('aufrissplanung')) {
      return 'Technische Planung';
    }
    // 3. Standorte
    if (textToSearch.includes('standort') || textToSearch.includes('fläche') || textToSearch.includes('location') || textToSearch.includes('miete')) {
      return 'Standorte';
    }
    // 1. Konzeption & Kreation
    if (textToSearch.includes('konzept') || textToSearch.includes('kreation') || textToSearch.includes('ideenfindung') || textToSearch.includes('creative direction') || textToSearch.includes('art direction') || textToSearch.includes('kreativ') || textToSearch.includes('entwürfe') || textToSearch.includes('scribbles') || textToSearch.includes('renderings') || textToSearch.includes('design') || textToSearch.includes('layout')) {
      return 'Konzeption & Kreation';
    }
    // 2. Projektmanagement
    if (textToSearch.includes('projektmanagement') || textToSearch.includes('projektsteuerung') || textToSearch.includes('organisation') || textToSearch.includes('planung') || textToSearch.includes('dienstleistersteuerung') || textToSearch.includes('controlling') || textToSearch.includes('geschäftsführung') || textToSearch.includes('pm') || textToSearch.includes('projectmanager')) {
      return 'Projektmanagement';
    }
    // 5. Produktion (Default for Event/Technik/Messebau/Catering/Show items)
    if (textToSearch.includes('produktion') || textToSearch.includes('bühnenbau') || textToSearch.includes('kulissenbau') || textToSearch.includes('messebau') || textToSearch.includes('branding') || textToSearch.includes('beklebung') || textToSearch.includes('qualitätskontrolle') || textToSearch.includes('abnahme') || textToSearch.includes('testaufbau') || textToSearch.includes('probeaufbau') || textToSearch.includes('catering') || textToSearch.includes('speisen') || textToSearch.includes('getränke') || textToSearch.includes('ausstattung') || textToSearch.includes('mobiliar') || textToSearch.includes('deko') || textToSearch.includes('blumen') || textToSearch.includes('bühnendekoration') || textToSearch.includes('show') || textToSearch.includes('entertainment') || textToSearch.includes('bespielung') || textToSearch.includes('technik') || textToSearch.includes('equipment') || textToSearch.includes('crew') || textToSearch.includes('personal') || textToSearch.includes('host*ess') || textToSearch.includes('runner') || textToSearch.includes('dolmetscher') || textToSearch.includes('fremdleistungen')) {
      return 'Produktion';
    }

    // Default Fallback
    return 'Konzeption & Kreation';
  };

  const fetchOffer = async (idToFetch: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/agency/offers/${idToFetch}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error(`KVA mit ID ${idToFetch} konnte nicht geladen werden (MOCO returned ${res.status}).`);
      }
      
      const data: MocoOffer = await res.json();
      setOffer(data);
      
      // Clean up items (remove intermediate subtotal headers as we will calculate our own sub-group totals!)
      const cleanedItems = (data.items || [])
        .filter(item => {
          // Filter out moco's built-in 'Zwischensumme' or purely section dividers to avoid confusion
          const t = (item.title || '').toLowerCase();
          return t !== 'zwischensumme' && t !== 'fremdleistungen' && t !== 'agenturservices';
        })
        .map(item => ({
          ...item,
          // Calculate active net_total
          net_total: (item.quantity || 0) * (item.unit_price || 0),
          optional: item.optional || false
        }));
        
      setItems(cleanedItems);
    } catch (err: any) {
      setError(err.message || 'Ein unbekannter Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffer(offerId);
  }, []);

  const handleGroupChange = (itemId: number, newGroupName: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, manualGroup: newGroupName };
      }
      return item;
    }));
  };

  const handleItemValueChange = (itemId: number, field: 'quantity' | 'unit_price', val: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [field]: val };
        updated.net_total = (updated.quantity || 0) * (updated.unit_price || 0);
        return updated;
      }
      return item;
    }));
  };

  const handleToggleOptional = (itemId: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, optional: !item.optional };
      }
      return item;
    }));
  };

  const toggleGroupExpanded = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Group items by their active group (auto or manual)
  const groupedItems: Record<string, MocoItem[]> = {};
  LOGICAL_GROUPS.forEach(g => {
    groupedItems[g.name] = [];
  });

  items.forEach(item => {
    const group = determineGroup(item);
    if (!groupedItems[group]) {
      groupedItems[group] = [];
    }
    
    // Apply filters
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPrice = !showOnlyNonZero || (item.net_total > 0);
    
    if (matchesSearch && matchesPrice) {
      groupedItems[group].push(item);
    }
  });

  // Calculate totals
  const getGroupTotal = (groupName: string): number => {
    return (groupedItems[groupName] || [])
      .filter(item => !item.optional) // Exclude optional items from total
      .reduce((sum, item) => sum + (item.net_total || 0), 0);
  };

  const grandNetTotal = LOGICAL_GROUPS.reduce((sum, g) => sum + getGroupTotal(g.name), 0);
  const taxRate = offer?.tax || 19;
  const taxValue = (grandNetTotal * taxRate) / 100;
  const grandGrossTotal = grandNetTotal + taxValue;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Structured KVA Presenter (MOCO)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualisiere, strukturiere und gruppiere MOCO Angebote live in 10 logische Kategorien.
          </p>
        </div>
        
        {/* API Loader */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={offerId}
              onChange={(e) => setOfferId(e.target.value)}
              placeholder="MOCO Angebot ID"
              className="w-40 px-3 py-1.5 bg-input border border-border rounded-md text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={() => fetchOffer(offerId)}
            disabled={loading || !offerId}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Laden
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/25 rounded-lg text-red-500 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {offer && (
        <>
          {/* Tabs and Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-1">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1.5 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'edit' 
                    ? 'border-primary text-foreground' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sliders className="w-4 h-4" />
                Strukturieren & Editieren
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'preview' 
                    ? 'border-primary text-foreground' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Eye className="w-4 h-4" />
                Drucken / PDF Vorschau
              </button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Positionen durchsuchen..."
                  className="pl-8 pr-3 py-1 bg-input border border-border rounded-md text-sm w-56 focus:outline-none"
                />
              </div>

              {/* Filters */}
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showOnlyNonZero}
                  onChange={(e) => setShowOnlyNonZero(e.target.checked)}
                  className="rounded border-border bg-input text-primary focus:ring-primary"
                />
                Nur bepreiste Positionen
              </label>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1 border border-border rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition"
              >
                <Printer className="w-4 h-4" />
                Drucken
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card p-4 border border-border rounded-lg shadow-sm">
              <p className="text-xs text-muted-foreground uppercase font-medium">Projekt & Kunde</p>
              <p className="font-semibold text-foreground mt-1 truncate">{offer.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{offer.recipient_address.split('\n')[0]}</p>
            </div>
            <div className="bg-card p-4 border border-border rounded-lg shadow-sm">
              <p className="text-xs text-muted-foreground uppercase font-medium">KVA ID & Datum</p>
              <p className="font-semibold text-foreground mt-1">{offer.identifier || 'Entwurf'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Erstellt am {new Date(offer.date).toLocaleDateString('de-DE')}</p>
            </div>
            <div className="bg-card p-4 border border-border rounded-lg shadow-sm">
              <p className="text-xs text-muted-foreground uppercase font-medium">Gesamtsumme (Netto)</p>
              <p className="font-semibold text-primary text-lg mt-1">
                {grandNetTotal.toLocaleString('de-DE', { style: 'currency', currency: offer.currency })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Ohne optionale Positionen</p>
            </div>
            <div className="bg-card p-4 border border-border rounded-lg shadow-sm">
              <p className="text-xs text-muted-foreground uppercase font-medium">Gesamtsumme (Brutto)</p>
              <p className="font-semibold text-foreground text-lg mt-1">
                {grandGrossTotal.toLocaleString('de-DE', { style: 'currency', currency: offer.currency })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Inkl. {taxRate}% MwSt.</p>
            </div>
          </div>

          {activeTab === 'edit' ? (
            /* Structuring and Editing View */
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-sm text-foreground flex gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Wie es funktioniert:</p>
                  <p className="text-muted-foreground mt-0.5">
                    Die {items.length} Positionen aus MOCO wurden automatisch den 10 logischen Bereichen zugeordnet. 
                    Du kannst über das <ArrowRightLeft className="inline w-3.5 h-3.5 mx-0.5 text-primary" /> Symbol rechts an jedem Item 
                    die Position in eine andere Gruppe verschieben. Subtotale berechnen sich live.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {LOGICAL_GROUPS.map((group) => {
                  const itemsInGroup = groupedItems[group.name] || [];
                  const groupTotal = getGroupTotal(group.name);
                  const isExpanded = !!expandedGroups[group.name];

                  if (itemsInGroup.length === 0 && showOnlyNonZero) return null;

                  return (
                    <div key={group.name} className="bg-card border border-border rounded-lg overflow-hidden transition-all shadow-sm">
                      {/* Accordion Header */}
                      <div 
                        onClick={() => toggleGroupExpanded(group.name)}
                        className="flex items-center justify-between p-4 bg-muted/45 hover:bg-muted/75 transition cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                            {group.id}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{group.name}</h3>
                            <p className="text-xs text-muted-foreground">{group.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground uppercase font-medium block">Bereich Summe</span>
                            <span className="font-bold text-foreground">
                              {groupTotal.toLocaleString('de-DE', { style: 'currency', currency: offer.currency })}
                            </span>
                          </div>
                          <span className="text-xs px-2.5 py-1 bg-accent border border-border rounded-full text-accent-foreground font-semibold">
                            {itemsInGroup.length} Positionen
                          </span>
                          {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                        </div>
                      </div>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="border-t border-border overflow-x-auto">
                          {itemsInGroup.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground text-sm">
                              Keine Positionen in dieser Gruppe. Ziehe Positionen hierher oder weise sie dieser Gruppe zu.
                            </div>
                          ) : (
                            <table className="w-full text-left border-collapse min-w-[700px]">
                              <thead>
                                <tr className="border-b border-border bg-muted/10 text-xs font-semibold text-muted-foreground uppercase">
                                  <th className="p-3 w-8">#</th>
                                  <th className="p-3">Position</th>
                                  <th className="p-3 w-28">Menge</th>
                                  <th className="p-3 w-28">Einheit</th>
                                  <th className="p-3 w-32">Einzelpreis</th>
                                  <th className="p-3 w-36 text-right">Summe</th>
                                  <th className="p-3 w-40 text-center">Gruppe ändern</th>
                                  <th className="p-3 w-24 text-center">Option</th>
                                </tr>
                              </thead>
                              <tbody>
                                {itemsInGroup.map((item, idx) => (
                                  <tr 
                                    key={item.id} 
                                    className={`border-b border-border/75 hover:bg-muted/10 text-sm transition-colors ${
                                      item.optional ? 'opacity-65 bg-muted/5' : ''
                                    }`}
                                  >
                                    <td className="p-3 text-muted-foreground text-xs">{idx + 1}</td>
                                    <td className="p-3 max-w-sm">
                                      <p className="font-medium text-foreground">{item.title}</p>
                                      {item.description && (
                                        <div 
                                          className="text-xs text-muted-foreground mt-1 max-h-16 overflow-y-auto"
                                          dangerouslySetInnerHTML={{ __html: item.description }}
                                        />
                                      )}
                                    </td>
                                    
                                    {/* Edit quantity */}
                                    <td className="p-3">
                                      <input
                                        type="number"
                                        value={item.quantity || 0}
                                        onChange={(e) => handleItemValueChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                        className="w-full bg-input border border-border rounded px-2 py-1 text-center text-sm"
                                        step="0.25"
                                      />
                                    </td>

                                    {/* Unit */}
                                    <td className="p-3">
                                      <span className="text-xs text-muted-foreground">{item.unit || '—'}</span>
                                    </td>

                                    {/* Edit unit price */}
                                    <td className="p-3">
                                      <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                                        <input
                                          type="number"
                                          value={item.unit_price || 0}
                                          onChange={(e) => handleItemValueChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                          className="w-full bg-input border border-border rounded pl-5 pr-2 py-1 text-right text-sm"
                                          step="5"
                                        />
                                      </div>
                                    </td>

                                    {/* Net total */}
                                    <td className="p-3 text-right font-medium">
                                      {item.net_total.toLocaleString('de-DE', { style: 'currency', currency: offer.currency })}
                                      {item.optional && <span className="block text-[10px] text-orange-500">(Optional)</span>}
                                    </td>

                                    {/* Category reassignment dropdown */}
                                    <td className="p-3 text-center">
                                      <select
                                        value={determineGroup(item)}
                                        onChange={(e) => handleGroupChange(item.id, e.target.value)}
                                        className="bg-input border border-border rounded text-xs px-2 py-1 focus:ring-1 focus:ring-primary focus:outline-none w-full"
                                      >
                                        {LOGICAL_GROUPS.map(g => (
                                          <option key={g.id} value={g.name}>{g.name}</option>
                                        ))}
                                      </select>
                                    </td>

                                    {/* Toggle Optional */}
                                    <td className="p-3 text-center">
                                      <button
                                        onClick={() => handleToggleOptional(item.id)}
                                        className={`px-2 py-1 rounded text-xs font-semibold border ${
                                          item.optional
                                            ? 'bg-orange-500/15 text-orange-500 border-orange-500/25'
                                            : 'bg-muted border-border text-muted-foreground hover:bg-accent'
                                        }`}
                                      >
                                        {item.optional ? 'Ja' : 'Nein'}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* PRINT PREVIEW / CLIENT KVA VIEW */
            <div className="bg-white text-slate-800 p-8 md:p-12 border border-slate-200 rounded-lg shadow-md max-w-5xl mx-auto font-sans" id="printable-kva">
              
              {/* Cover/Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-8">
                <div>
                  <div className="text-2xl font-black text-slate-900 tracking-wider">PIXELSCHICKERIA</div>
                  <div className="text-[10px] tracking-widest text-slate-500 font-bold uppercase mt-1">Creative Agency & Studio</div>
                  
                  <div className="text-xs text-slate-500 mt-6 space-y-1">
                    <p>PIXELSCHICKERIA</p>
                    <p>Gärtnerplatz 1</p>
                    <p>80469 München</p>
                    <p>info@pixelschickeria.com</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-bold text-slate-900">KOSTENVORANSCHLAG (KVA)</div>
                  <div className="text-xs text-slate-500 mt-1">Strukturierte Übersicht</div>
                  
                  <div className="text-xs text-slate-600 mt-6 space-y-1.5">
                    <p><strong className="text-slate-800">Projekt:</strong> {offer.title}</p>
                    <p><strong className="text-slate-800">Datum:</strong> {new Date(offer.date).toLocaleDateString('de-DE')}</p>
                    <p><strong className="text-slate-800">KVA-Nummer:</strong> {offer.identifier || 'Entwurf'}</p>
                    <p><strong className="text-slate-800">Gültigkeit:</strong> 30 Tage</p>
                  </div>
                </div>
              </div>

              {/* Client Address */}
              <div className="py-6 text-xs text-slate-600">
                <div className="text-slate-400 uppercase tracking-wider font-semibold text-[10px] mb-2">Empfänger</div>
                <div className="whitespace-pre-line leading-relaxed font-medium text-slate-800">
                  {offer.recipient_address}
                </div>
              </div>

              {/* Structured Tables */}
              <div className="mt-8 space-y-8">
                {LOGICAL_GROUPS.map((group) => {
                  const itemsInGroup = groupedItems[group.name] || [];
                  const groupTotal = getGroupTotal(group.name);

                  // In preview we do not show empty groups
                  if (itemsInGroup.length === 0) return null;

                  return (
                    <div key={group.name} className="space-y-2">
                      {/* Group Header */}
                      <div className="flex justify-between items-end border-b border-slate-900 pb-1.5">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span className="bg-slate-900 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                            {group.id}
                          </span>
                          {group.name}
                        </h3>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900">
                            Summe: {groupTotal.toLocaleString('de-DE', { style: 'currency', currency: offer.currency })}
                          </span>
                        </div>
                      </div>

                      {/* Group Items */}
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-slate-400 font-semibold border-b border-slate-100 text-[10px] uppercase">
                            <th className="py-2 text-left w-8">Pos.</th>
                            <th className="py-2 text-left">Leistungsbeschreibung</th>
                            <th className="py-2 text-center w-16">Menge</th>
                            <th className="py-2 text-center w-20">Einheit</th>
                            <th className="py-2 text-right w-24">Einzelpreis</th>
                            <th className="py-2 text-right w-28">Gesamtpreis</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemsInGroup.map((item, idx) => (
                            <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="py-2.5 text-slate-400 font-medium">{group.id}.{idx + 1}</td>
                              <td className="py-2.5 pr-4">
                                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                  {item.title}
                                  {item.optional && (
                                    <span className="text-[9px] bg-orange-100 text-orange-800 px-1.5 py-0.25 rounded font-bold uppercase tracking-wide">
                                      Optional
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <div 
                                    className="text-slate-500 mt-1 max-w-2xl leading-relaxed select-none"
                                    dangerouslySetInnerHTML={{ __html: item.description }}
                                  />
                                )}
                              </td>
                              <td className="py-2.5 text-center text-slate-800 font-medium">
                                {item.quantity !== null && item.quantity > 0 ? item.quantity : '—'}
                              </td>
                              <td className="py-2.5 text-center text-slate-500">{item.unit || '—'}</td>
                              <td className="py-2.5 text-right text-slate-800">
                                {item.unit_price !== null && item.unit_price > 0 
                                  ? item.unit_price.toLocaleString('de-DE', { style: 'currency', currency: offer.currency }) 
                                  : '—'}
                              </td>
                              <td className="py-2.5 text-right font-bold text-slate-900">
                                {item.net_total > 0 
                                  ? item.net_total.toLocaleString('de-DE', { style: 'currency', currency: offer.currency }) 
                                  : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Summary Block */}
              <div className="mt-12 border-t border-slate-200 pt-6 flex justify-end">
                <div className="w-80 space-y-2 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span>Netto-Gesamtsumme:</span>
                    <span className="font-semibold text-slate-900">
                      {grandNetTotal.toLocaleString('de-DE', { style: 'currency', currency: offer.currency })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>zzgl. {taxRate}% MwSt:</span>
                    <span>
                      {taxValue.toLocaleString('de-DE', { style: 'currency', currency: offer.currency })}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-slate-200 pt-2 text-slate-900">
                    <span>Brutto-Gesamtsumme:</span>
                    <span>
                      {grandGrossTotal.toLocaleString('de-DE', { style: 'currency', currency: offer.currency })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Disclaimer / Footer */}
              <div className="mt-16 border-t border-slate-100 pt-6 text-[10px] text-slate-400 leading-relaxed grid grid-cols-3 gap-8">
                <div>
                  <p className="font-bold uppercase tracking-wider text-[8px] mb-1">Zahlungsbedingungen</p>
                  <p>50% Anzahlung bei Projektbeauftragung</p>
                  <p>50% Restzahlung nach erbrachter Leistung</p>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wider text-[8px] mb-1">Geschäftsbedingungen</p>
                  <p>Es gelten die AGB der PIXELSCHICKERIA GmbH.</p>
                  <p>Erfüllungsort und Gerichtsstand ist München.</p>
                </div>
                <div className="text-right">
                  <p className="font-bold uppercase tracking-wider text-[8px] mb-1">Vielen Dank</p>
                  <p>Wir freuen uns auf die kreative Zusammenarbeit!</p>
                </div>
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
};
