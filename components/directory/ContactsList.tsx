import React, { useEffect, useState, useMemo } from 'react';
import { directory, ApiFreelancer } from '../../lib/apiClient';
import { useAuth } from '../../lib/AuthContext';
import { Users, Search, Mail, Phone, Globe, MapPin, Plus, Pencil } from 'lucide-react';
import { FreelancerFormModal } from './FreelancerFormModal';

export const ContactsList: React.FC = () => {
    const { profile } = useAuth();
    const isAdmin = profile?.role === 'admin';
    
    const [freelancers, setFreelancers] = useState<ApiFreelancer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Alle');
    
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedFreelancer, setSelectedFreelancer] = useState<ApiFreelancer | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await directory.freelancers.list();
            setFreelancers(data);
        } catch (error) {
            console.error('Failed to fetch contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => {
        const cats = new Set<string>();
        freelancers.forEach(f => f.category && cats.add(f.category));
        return ['Alle', ...Array.from(cats).sort()];
    }, [freelancers]);

    const filtered = useMemo(() => {
        return freelancers.filter(f => {
            const matchSearch = !search || 
                [f.first_name, f.last_name, f.company, f.city, f.category, f.notes]
                .some(field => field?.toLowerCase().includes(search.toLowerCase()));
            const matchKat = categoryFilter === 'Alle' || f.category === categoryFilter;
            return matchSearch && matchKat;
        });
    }, [freelancers, search, categoryFilter]);

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
                        <Users className="text-primary" size={24} /> Contacts & Crew
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Agentur-Netzwerk ({filtered.length} Einträge)
                    </p>
                </div>
                <button
                    onClick={() => { setSelectedFreelancer(null); setModalOpen(true); }}
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
                        placeholder="Name, Firma, Stadt oder Skill suchen..."
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(contact => (
                    <div key={contact.id} className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative group">
                        <button 
                            onClick={() => { setSelectedFreelancer(contact); setModalOpen(true); }}
                            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-primary bg-background/50 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-all border border-border"
                        >
                            <Pencil size={14} />
                        </button>

                        <div className="mb-3 pr-8">
                            <h3 className="text-lg font-bold text-foreground">
                                {contact.first_name} {contact.last_name}
                            </h3>
                            {contact.company && (
                                <p className="text-sm font-medium text-primary mt-0.5">{contact.company}</p>
                            )}
                        </div>
                        
                        {contact.category && (
                            <span className="inline-block px-2.5 py-1 bg-muted rounded-md text-xs text-muted-foreground font-medium mb-4">
                                {contact.category}
                            </span>
                        )}

                        <div className="space-y-2 text-sm text-muted-foreground mt-2">
                            {(contact.city || contact.country) && (
                                <div className="flex items-start gap-2">
                                    <MapPin size={16} className="shrink-0 mt-0.5 opacity-70" />
                                    <span>{[contact.city, contact.country].filter(Boolean).join(', ')}</span>
                                </div>
                            )}
                            {contact.email && (
                                <div className="flex items-center gap-2">
                                    <Mail size={16} className="shrink-0 opacity-70" />
                                    <a href={`mailto:${contact.email}`} className="hover:text-primary transition-colors truncate">{contact.email}</a>
                                </div>
                            )}
                            {contact.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone size={16} className="shrink-0 opacity-70" />
                                    <a href={`tel:${contact.phone}`} className="hover:text-primary transition-colors">{contact.phone}</a>
                                </div>
                            )}
                            {contact.website && (
                                <div className="flex items-center gap-2">
                                    <Globe size={16} className="shrink-0 opacity-70" />
                                    <a href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors truncate">
                                        {contact.website.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            )}
                        </div>

                        {contact.notes && (
                            <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground/90 whitespace-pre-wrap line-clamp-3 group-hover:line-clamp-none transition-all">
                                {contact.notes}
                            </div>
                        )}

                        {isAdmin && contact.daily_rate && (
                            <div className="mt-4 pt-3 border-t border-border/50 font-medium text-emerald-500/90 flex justify-between items-center">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Tagessatz</span>
                                €{contact.daily_rate}
                            </div>
                        )}
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-card border border-border rounded-xl border-dashed">
                        Keine Kontakte gefunden.
                    </div>
                )}
            </div>
            
            <FreelancerFormModal 
                isOpen={isModalOpen} 
                onClose={() => setModalOpen(false)} 
                onSave={fetchData} 
                freelancer={selectedFreelancer}
                existingCategories={categories.filter(c => c !== 'Alle')}
            />
        </div>
    );
};
