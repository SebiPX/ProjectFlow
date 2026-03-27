import React, { useState, useEffect } from 'react';
import { ApiFreelancer, directory } from '../../lib/apiClient';
import { useAuth } from '../../lib/AuthContext';
import { X, Save, Trash2 } from 'lucide-react';

interface FreelancerFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    freelancer?: ApiFreelancer | null;
    existingCategories?: string[];
}

export const FreelancerFormModal: React.FC<FreelancerFormModalProps> = ({ isOpen, onClose, onSave, freelancer, existingCategories = [] }) => {
    const { profile } = useAuth();
    const isAdmin = profile?.role === 'admin';
    
    const [formData, setFormData] = useState<Partial<ApiFreelancer>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (freelancer) {
            setFormData({ ...freelancer });
        } else {
            setFormData({});
        }
    }, [freelancer, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (freelancer?.id) {
                await directory.freelancers.update(freelancer.id, formData);
            } else {
                await directory.freelancers.create(formData);
            }
            onSave();
            onClose();
        } catch (error) {
            console.error("Failed to save freelancer", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!freelancer?.id) return;
        if (!confirm('Wirklich löschen?')) return;
        
        setIsDeleting(true);
        try {
            await directory.freelancers.delete(freelancer.id);
            onSave();
            onClose();
        } catch (error) {
            console.error("Failed to delete freelancer", error);
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
                    <h2 className="text-xl font-bold">{freelancer ? 'Freelancer bearbeiten' : 'Neuer Freelancer'}</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClass}>Vorname</label>
                            <input name="first_name" value={formData.first_name || ''} onChange={handleChange} className={inputClass} placeholder="Max" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClass}>Nachname</label>
                            <input name="last_name" value={formData.last_name || ''} onChange={handleChange} className={inputClass} placeholder="Mustermann" required={!formData.company} />
                        </div>
                        
                        <div className="col-span-2">
                            <label className={labelClass}>Firma</label>
                            <input name="company" value={formData.company || ''} onChange={handleChange} className={inputClass} placeholder="Mustermann GmbH" required={!formData.last_name} />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClass}>Kategorie / Skill</label>
                            <input 
                                list="freelancer-categories"
                                name="category" 
                                value={formData.category || ''} 
                                onChange={handleChange} 
                                className={inputClass} 
                                placeholder="Auswählen oder eintippen..." 
                            />
                            <datalist id="freelancer-categories">
                                {existingCategories.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                        
                        {isAdmin && (
                            <div className="col-span-2 sm:col-span-1">
                                <label className={labelClass}>Tagessatz (€)</label>
                                <input type="number" name="daily_rate" value={formData.daily_rate || ''} onChange={handleChange} className={inputClass} placeholder="0.00" />
                            </div>
                        )}

                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClass}>Email</label>
                            <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className={inputClass} placeholder="max@example.com" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClass}>Telefon</label>
                            <input name="phone" value={formData.phone || ''} onChange={handleChange} className={inputClass} placeholder="+49..." />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClass}>Stadt</label>
                            <input name="city" value={formData.city || ''} onChange={handleChange} className={inputClass} placeholder="Berlin" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className={labelClass}>Land</label>
                            <input name="country" value={formData.country || ''} onChange={handleChange} className={inputClass} placeholder="Deutschland" />
                        </div>
                        
                        <div className="col-span-2">
                            <label className={labelClass}>Website / Portfolio</label>
                            <input type="url" name="website" value={formData.website || ''} onChange={handleChange} className={inputClass} placeholder="https://..." />
                        </div>

                        <div className="col-span-2">
                            <label className={labelClass}>Anmerkungen</label>
                            <textarea name="notes" value={formData.notes || ''} onChange={handleChange} className={inputClass} rows={4} placeholder="Zusätzliche Infos..." />
                        </div>
                    </div>
                </form>

                <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
                    {freelancer ? (
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
