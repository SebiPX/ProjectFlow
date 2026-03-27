import React, { useEffect, useState, useMemo } from 'react';
import { directory, ApiLocation } from '../../lib/apiClient';
import { Building2, Search, MapPin, ExternalLink, Euro, Maximize, Users, Plus, Pencil } from 'lucide-react';
import { LocationFormModal } from './LocationFormModal';

export const LocationsList: React.FC = () => {
    const [locations, setLocations] = useState<ApiLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Alle');
    
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<ApiLocation | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await directory.locations.list();
            setLocations(data);
        } catch (error) {
            console.error('Failed to fetch locations:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => {
        const cats = new Set<string>();
        locations.forEach(l => l.category && cats.add(l.category));
        return ['Alle', ...Array.from(cats).sort()];
    }, [locations]);

    const filtered = useMemo(() => {
        return locations.filter(l => {
            const matchSearch = !search || 
                [l.name, l.city, l.category, l.notes, l.address]
                .some(field => field?.toLowerCase().includes(search.toLowerCase()));
            const matchKat = categoryFilter === 'Alle' || l.category === categoryFilter;
            return matchSearch && matchKat;
        });
    }, [locations, search, categoryFilter]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3 text-foreground">
                        <Building2 className="text-primary" size={24} /> Locations & Studios
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Drehorte, Studios & Event Spaces ({filtered.length} Einträge)
                    </p>
                </div>
                <button
                    onClick={() => { setSelectedLocation(null); setModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                >
                    <Plus size={18} /> Neu
                </button>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Name, Stadt oder Stichwort..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                    />
                </div>
                <div className="flex bg-card p-1 rounded-xl border border-border overflow-x-auto">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                                categoryFilter === cat
                                    ? 'bg-primary text-primary-foreground font-medium'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map(loc => (
                    <div key={loc.id} className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col relative group">
                        <button 
                            onClick={() => { setSelectedLocation(loc); setModalOpen(true); }}
                            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-primary bg-background/50 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-all border border-border z-10"
                        >
                            <Pencil size={14} />
                        </button>
                        
                        <div className="p-5 border-b border-border/50 bg-muted/20">
                            <div className="flex justify-between items-start gap-3 pr-8">
                                <h3 className="text-xl font-bold text-foreground leading-tight flex-1">
                                    {loc.name}
                                </h3>
                                {loc.category && (
                                    <span className="px-2 py-1 bg-border/50 rounded text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 mt-1">
                                        {loc.category}
                                    </span>
                                )}
                            </div>
                            
                            {(loc.city || loc.address) && (
                                <div className="flex items-start gap-1.5 text-sm text-muted-foreground mt-3">
                                    <MapPin size={15} className="mt-0.5 shrink-0 text-primary/70" />
                                    <span>{[loc.address, loc.city, loc.country].filter(Boolean).join(', ')}</span>
                                </div>
                            )}
                        </div>

                        <div className="p-5 flex flex-wrap gap-4 bg-muted/10 border-b border-border/50">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Fläche</span>
                                <div className="text-foreground font-semibold flex items-center gap-1 mt-0.5">
                                    <Maximize size={14} className="opacity-50" />
                                    {loc.sqm ? `${loc.sqm} m²` : '-'}
                                </div>
                            </div>
                            <div className="w-px bg-border/50 my-1" />
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Kapazität</span>
                                <div className="text-foreground font-semibold flex items-center gap-1 mt-0.5">
                                    <Users size={14} className="opacity-50" />
                                    {loc.pax ? `${loc.pax} PAX` : '-'}
                                </div>
                            </div>
                            <div className="w-px bg-border/50 my-1" />
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Kosten / Tag</span>
                                <div className="text-emerald-500/90 font-semibold flex items-center gap-1 mt-0.5">
                                    <Euro size={14} className="currentColor" />
                                    {loc.cost ? `${loc.cost}` : '-'}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col">
                            {loc.notes && (
                                <p className="text-sm text-muted-foreground/90 whitespace-pre-wrap mb-4 flex-1">
                                    {loc.notes}
                                </p>
                            )}

                            <div className="pt-4 border-t border-border/50 mt-auto text-xs grid grid-cols-2 gap-y-2">
                                {loc.contact_person && (
                                    <div className="col-span-2 text-foreground/80"><span className="text-muted-foreground">Kontakt:</span> {loc.contact_person}</div>
                                )}
                                {loc.phone && (
                                    <div className="col-span-2 text-foreground/80"><span className="text-muted-foreground">Tel:</span> {loc.phone}</div>
                                )}
                                {loc.email && (
                                    <div className="col-span-2 truncate"><a href={`mailto:${loc.email}`} className="hover:text-primary transition-colors">{loc.email}</a></div>
                                )}
                                {loc.website && (
                                    <div className="col-span-2 truncate text-right text-primary">
                                        <a href={loc.website.startsWith('http') ? loc.website : `https://${loc.website}`} target="_blank" rel="noreferrer" className="hover:underline flex items-center justify-end gap-1">
                                            Website <ExternalLink size={12} />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-card border border-border rounded-xl border-dashed">
                        Keine Locations gefunden.
                    </div>
                )}
            </div>
            
            <LocationFormModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onSave={fetchData}
                location={selectedLocation}
                existingCategories={categories.filter(c => c !== 'Alle')}
            />
        </div>
    );
};
