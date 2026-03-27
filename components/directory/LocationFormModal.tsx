import React, { useState, useEffect } from 'react';
import { ApiLocation, directory } from '../../lib/apiClient';
import { useAuth } from '../../lib/AuthContext';
import { X, Save, Trash2 } from 'lucide-react';

interface LocationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    location?: ApiLocation | null;
}

export const LocationFormModal: React.FC<LocationFormModalProps> = ({ isOpen, onClose, onSave, location }) => {
    const { profile } = useAuth();
    const isAdmin = profile?.role === 'admin';
    
    const [formData, setFormData] = useState<Partial<ApiLocation>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (location) {
            setFormData({ ...location });
        } else {
            setFormData({});
        }
    }, [location, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (location?.id) {
                await directory.locations.update(location.id, formData);
            } else {
                await directory.locations.create(formData);
            }
            onSave();
            onClose();
        } catch (error) {
            console.error("Failed to save location", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!location?.id) return;
        if (!confirm('Wirklich löschen?')) return;
        
        setIsDeleting(true);
        try {
            await directory.locations.delete(location.id);
            onSave();
            onClose();
        } catch (error) {
            console.error("Failed to delete location", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const inputClass = "w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary";
    const labelClass = "block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-xl font-bold">{location ? 'Location bearbeiten' : 'Neue Location'}</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className={labelClass}>Name</label>
                            <input name="name" value={formData.name || ''} onChange={handleChange} className={inputClass} placeholder="Studio Name" required />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClass}>Kategorie</label>
                            <input name="category" value={formData.category || ''} onChange={handleChange} className={inputClass} placeholder="z.B. Fotostudio" />
                        </div>
                        
                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClass}>Kontaktperson</label>
                            <input name="contact_person" value={formData.contact_person || ''} onChange={handleChange} className={inputClass} placeholder="Ansprechpartner" />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClass}>Fläche (m²)</label>
                            <input type="number" name="sqm" value={formData.sqm || ''} onChange={handleChange} className={inputClass} placeholder="100" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClass}>Kapazität (PAX)</label>
                            <input type="number" name="pax" value={formData.pax || ''} onChange={handleChange} className={inputClass} placeholder="50" />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClass}>Tageskosten (€)</label>
                            <input type="number" name="cost" value={formData.cost || ''} onChange={handleChange} className={inputClass} placeholder="1200" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClass}>Zusatzkosten / Setup (€)</label>
                            <input type="number" name="setup_cost" value={formData.setup_cost || ''} onChange={handleChange} className={inputClass} placeholder="150" />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClass}>Email</label>
                            <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className={inputClass} placeholder="info@..." />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClass}>Telefon</label>
                            <input name="phone" value={formData.phone || ''} onChange={handleChange} className={inputClass} placeholder="+49..." />
                        </div>

                        <div className="col-span-2 lg:col-span-1">
                            <label className={labelClass}>Adresse</label>
                            <input name="address" value={formData.address || ''} onChange={handleChange} className={inputClass} placeholder="Straße 123" />
                        </div>
                        <div className="col-span-1 sm:col-span-1 lg:col-span-1 flex gap-3">
                            <div className="flex-1">
                                <label className={labelClass}>Stadt</label>
                                <input name="city" value={formData.city || ''} onChange={handleChange} className={inputClass} placeholder="Berlin" />
                            </div>
                            <div className="w-1/3">
                                <label className={labelClass}>Land</label>
                                <input name="country" value={formData.country || ''} onChange={handleChange} className={inputClass} placeholder="DE" />
                            </div>
                        </div>
                        
                        <div className="col-span-2">
                            <label className={labelClass}>Website</label>
                            <input type="url" name="website" value={formData.website || ''} onChange={handleChange} className={inputClass} placeholder="https://..." />
                        </div>

                        <div className="col-span-2">
                            <label className={labelClass}>Anmerkungen</label>
                            <textarea name="notes" value={formData.notes || ''} onChange={handleChange} className={inputClass} rows={4} placeholder="Zusätzliche Infos..." />
                        </div>
                    </div>
                </form>

                <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
                    {location ? (
                        isAdmin ? (
                            <button type="button" onClick={handleDelete} disabled={isDeleting} className="flex items-center gap-2 text-red-500 hover:text-red-400 px-3 py-2 text-sm font-medium transition-colors">
                                <Trash2 size={16} /> Löschen
                            </button>
                        ) : <div />
                    ) : <div />}
                    
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            Abbrechen
                        </button>
                        <button type="submit" onClick={handleSubmit} disabled={isSaving} className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                            <Save size={16} /> {isSaving ? 'Speichern...' : 'Speichern'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
