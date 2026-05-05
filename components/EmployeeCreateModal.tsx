import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import { admin } from '../lib/apiClient';

interface EmployeeCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const EmployeeCreateModal: React.FC<EmployeeCreateModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'creative'
    });
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        if (!formData.email || !formData.password || !formData.full_name) {
            toast.error('Bitte füllen Sie alle Pflichtfelder aus.');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Das Passwort muss mindestens 6 Zeichen lang sein.');
            return;
        }

        setIsSaving(true);
        try {
            await admin.createUser(formData);
            toast.success('Nutzer erfolgreich angelegt!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to create user:', error);
            toast.error(error.message || 'Fehler beim Anlegen des Nutzers');
        } finally {
            setIsSaving(false);
        }
    };

    const inputClass = "w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary";
    const labelClass = "block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold">Neuen Nutzer anlegen</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className={labelClass}>Vollständiger Name</label>
                        <input
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="Max Mustermann"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>E-Mail</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="max@example.com"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Passwort (Min. 6 Zeichen)</label>
                        <input
                            type="text" // using text so admin can see what they type for the user
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="Ein sicheres Passwort..."
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Rolle</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className={inputClass}
                        >
                            <option value="creative">Creative</option>
                            <option value="pjm">Projektmanager (PjM)</option>
                            <option value="admin">Administrator</option>
                            <option value="freelancer">Freelancer</option>
                            <option value="client">Client</option>
                            <option value="guest">Gast</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-border bg-muted/20">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        disabled={isSaving}
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving ? 'Speichern...' : 'Nutzer anlegen'}
                    </button>
                </div>
            </div>
        </div>
    );
};
