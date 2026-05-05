import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ApiLocation, ApiLocationAsset, directory, uploadFile, downloadAsset } from '../../lib/apiClient';
import { useAuth } from '../../lib/AuthContext';
import { X, Save, Trash2, Upload, File as FileIconLucide, Image as ImageIconLucide, Download, Eye } from 'lucide-react';
import { AssetPreviewModal } from '../AssetPreviewModal';

interface LocationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    location?: ApiLocation | null;
    existingCategories?: string[];
}

export const LocationFormModal: React.FC<LocationFormModalProps> = ({ isOpen, onClose, onSave, location, existingCategories = [] }) => {
    const { profile } = useAuth();
    const isAdmin = profile?.role === 'admin';
    
    const [activeTab, setActiveTab] = useState<'details' | 'assets'>('details');
    const [formData, setFormData] = useState<Partial<ApiLocation>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Assets state
    const [assets, setAssets] = useState<ApiLocationAsset[]>([]);
    const [isLoadingAssets, setIsLoadingAssets] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewAsset, setPreviewAsset] = useState<ApiLocationAsset | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (location) {
            setFormData({ ...location });
            if (isOpen) {
                fetchAssets(location.id);
            }
        } else {
            setFormData({});
            setAssets([]);
        }
        if (!isOpen) {
            setActiveTab('details');
            setPreviewAsset(null);
        }
    }, [location, isOpen]);

    const fetchAssets = async (locationId: string) => {
        setIsLoadingAssets(true);
        try {
            const data = await directory.locations.assets.list(locationId);
            setAssets(data);
        } catch (error) {
            console.error('Failed to fetch location assets:', error);
        } finally {
            setIsLoadingAssets(false);
        }
    };

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

    // Asset handlers
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !location?.id) return;

        setIsUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const storage_path = await uploadFile(file, 'directory_locations');
                
                await directory.locations.assets.create(location.id, {
                    name: file.name,
                    storage_path,
                    file_type: file.type || 'application/octet-stream',
                    file_size: file.size,
                });
            }
            await fetchAssets(location.id);
        } catch (error) {
            console.error("Failed to upload assets:", error);
            alert("Upload fehlgeschlagen.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteAsset = async (assetId: string) => {
        if (!confirm('Datei wirklich löschen?')) return;
        try {
            await directory.locations.assets.delete(assetId);
            setAssets(prev => prev.filter(a => a.id !== assetId));
        } catch (error) {
            console.error('Failed to delete asset', error);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
    };

    const inputClass = "w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary";
    const labelClass = "block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2";

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                <div className="bg-card w-full max-w-2xl rounded-2xl shadow-xl border border-border flex flex-col max-h-[90vh]">
                    <div className="flex flex-col px-6 pt-4 border-b border-border">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">{location ? 'Location bearbeiten' : 'Neue Location'}</h2>
                            <button onClick={onClose} className="p-2 -mr-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        {location && (
                            <div className="flex gap-4 border-b border-transparent">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('details')}
                                    className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
                                >
                                    Details
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('assets')}
                                    className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'assets' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
                                >
                                    Dateien & Bilder
                                    {assets.length > 0 && (
                                        <span className="bg-muted px-1.5 py-0.5 rounded text-xs">{assets.length}</span>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'details' ? (
                            <form id="location-form" onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className={labelClass}>Name</label>
                                        <input name="name" value={formData.name || ''} onChange={handleChange} className={inputClass} placeholder="Studio Name" required />
                                    </div>

                                    <div className="col-span-2 sm:col-span-1">
                                        <label className={labelClass}>Kategorie</label>
                                        <input 
                                            list="location-categories"
                                            name="category" 
                                            value={formData.category || ''} 
                                            onChange={handleChange} 
                                            className={inputClass} 
                                            placeholder="Auswählen oder eintippen..." 
                                        />
                                        <datalist id="location-categories">
                                            {existingCategories.map(c => <option key={c} value={c} />)}
                                        </datalist>
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
                        ) : (
                            <div className="space-y-6">
                                {/* Upload Zone */}
                                <div 
                                    className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center bg-muted/30 hover:bg-muted/50 transition-colors relative"
                                >
                                    <input 
                                        type="file" 
                                        multiple 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                        onChange={handleFileUpload}
                                        ref={fileInputRef}
                                        disabled={isUploading}
                                    />
                                    <div className="bg-primary/10 p-4 rounded-full mb-4">
                                        <Upload className="text-primary" size={24} />
                                    </div>
                                    <h3 className="font-bold mb-1">Dateien hier ablegen</h3>
                                    <p className="text-sm text-muted-foreground mb-4">oder klicken um Dateien auszuwählen</p>
                                    <button 
                                        type="button"
                                        disabled={isUploading}
                                        className="px-4 py-2 bg-secondary text-secondary-foreground text-sm font-semibold rounded-lg hover:bg-secondary/80 pointer-events-none"
                                    >
                                        {isUploading ? 'Wird hochgeladen...' : 'Durchsuchen'}
                                    </button>
                                </div>

                                {/* Asset List */}
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Hochgeladene Dateien ({assets.length})</h3>
                                    
                                    {isLoadingAssets ? (
                                        <div className="flex justify-center py-8">
                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : assets.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-border border-dashed">
                                            Noch keine Dateien vorhanden.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {assets.map(asset => {
                                                const isImage = asset.file_type?.startsWith('image/') || asset.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                                                return (
                                                    <div key={asset.id} className="flex items-center p-3 bg-card border border-border rounded-xl shadow-sm hover:border-primary/30 transition-colors group">
                                                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 mr-3 overflow-hidden">
                                                            {isImage ? (
                                                                <ImageIconLucide size={18} />
                                                            ) : (
                                                                <FileIconLucide size={18} />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0 mr-3">
                                                            <p className="text-sm font-medium text-foreground truncate" title={asset.name}>{asset.name}</p>
                                                            <p className="text-xs text-muted-foreground">{formatFileSize(asset.file_size || 0)}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                type="button"
                                                                onClick={() => setPreviewAsset(asset)}
                                                                className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-muted"
                                                                title="Vorschau"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => downloadAsset(asset.storage_path, asset.name)}
                                                                className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-muted"
                                                                title="Download"
                                                            >
                                                                <Download size={16} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteAsset(asset.id)}
                                                                className="p-1.5 text-muted-foreground hover:text-red-500 rounded-md hover:bg-red-500/10"
                                                                title="Löschen"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20 shrink-0">
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
                            <button type="submit" form="location-form" onClick={activeTab === 'details' ? undefined : () => {
                                // If not on details tab, clicking save should just trigger the form submission manually or we handle it
                                handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                            }} disabled={isSaving || activeTab !== 'details' && !location} className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                                <Save size={16} /> {isSaving ? 'Speichern...' : 'Speichern'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Asset Preview Modal */}
            <AssetPreviewModal
                isOpen={!!previewAsset}
                onClose={() => setPreviewAsset(null)}
                asset={previewAsset as any}
                onDownload={previewAsset ? () => downloadAsset(previewAsset.storage_path, previewAsset.name) : undefined}
            />
        </>
    );
};
