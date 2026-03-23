import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { createFinancialDocument, updateFinancialDocument } from '../services/api/financialDocuments';
import { getServiceModulesWithPricing } from '../services/api/serviceModules';
import { getSeniorityLevels } from '../services/api/seniorityLevels';
import { Icon } from './ui/Icon';
import { DocType, DocStatus, FinancialDocument, FinancialItem } from '../types/supabase';

interface FinancialDocumentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    document?: FinancialDocument & { items: FinancialItem[] }; // For edit mode
}

// Temporary type for form items before submission
interface FormItem {
    id: string; // temp id for key
    service_module_id: string;
    seniority_level_id: string;
    position_title: string;
    description: string;
    quantity: number;
    unit_price: number;
}

export const FinancialDocumentFormModal: React.FC<FinancialDocumentFormModalProps> = ({
    isOpen,
    onClose,
    projectId,
    document
}) => {
    const queryClient = useQueryClient();
    const isEditMode = !!document;

    const [formData, setFormData] = useState({
        type: document?.type || DocType.Quote,
        status: document?.status || DocStatus.Draft,
        document_number: document?.document_number || '',
        date_issued: document?.date_issued || new Date().toISOString().split('T')[0],
        due_date: document?.due_date || '',
        vat_percent: document?.vat_percent || 19,
    });

    const [items, setItems] = useState<FormItem[]>([]);

    // Initialize items on edit
    useEffect(() => {
        if (document?.items) {
            setItems(document.items.map(item => ({
                id: item.id,
                service_module_id: item.service_module_id || '',
                seniority_level_id: item.seniority_level_id || '',
                position_title: item.position_title,
                description: item.description || '',
                quantity: item.quantity,
                unit_price: item.unit_price,
            })));
        } else {
            // Default empty item
            setItems([{
                id: Date.now().toString(),
                service_module_id: '',
                seniority_level_id: '',
                position_title: '',
                description: '',
                quantity: 1,
                unit_price: 0,
            }]);
        }
    }, [document]);

    // Fetch catalogs with pricing for smart client-side logic
    const { data: serviceModules = [] } = useQuery({
        queryKey: ['service-modules-with-pricing'],
        queryFn: getServiceModulesWithPricing,
        enabled: isOpen,
    });

    const { data: seniorityLevels = [] } = useQuery({
        queryKey: ['seniority-levels'],
        queryFn: getSeniorityLevels,
        enabled: isOpen,
    });

    // Calculate totals
    const totalNet = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const totalVat = totalNet * (formData.vat_percent / 100);
    const totalGross = totalNet + totalVat;

    // Mutation
    const mutation = useMutation({
        mutationFn: async () => {
            const docData = {
                project_id: projectId,
                type: formData.type,
                status: formData.status,
                document_number: formData.document_number,
                date_issued: formData.date_issued,
                due_date: formData.due_date || null,
                total_net: totalNet,
                vat_percent: formData.vat_percent,
                total_gross: totalGross,
            };

            const itemsData = items.map(item => ({
                service_module_id: (item.service_module_id && item.service_module_id.trim() !== '') ? item.service_module_id : null,
                seniority_level_id: (item.seniority_level_id && item.seniority_level_id.trim() !== '') ? item.seniority_level_id : null,
                position_title: item.position_title,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
            }));

            if (isEditMode && document) {
                return updateFinancialDocument(document.id, docData, itemsData);
            } else {
                return createFinancialDocument(docData, itemsData);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financial-documents', projectId] });
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
            queryClient.invalidateQueries({ queryKey: ['project-margin', projectId] }); // Update margin card immediately
            toast.success(`Document ${isEditMode ? 'updated' : 'created'} successfully!`);
            onClose();
        },
        onError: (error: any) => {
            console.error('Full save error:', error);
            const errorDetails = error.details || error.hint || error.message || 'Unknown error';
            toast.error(`Failed to save document: ${error.message} (${errorDetails})`);
        },
    });

    // Item handlers
    const handleAddItem = () => {
        setItems([...items, {
            id: Date.now().toString(),
            service_module_id: '',
            seniority_level_id: '',
            position_title: '',
            description: '',
            quantity: 1,
            unit_price: 0,
        }]);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length === 1) return; // Keep at least one
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index], [field]: value };
        newItems[index] = item;
        setItems(newItems);
    };

    // Smart Service Selection Handler
    const handleServiceSelection = (index: number, moduleId: string, levelId: string) => {
        const newItems = [...items];
        const item = newItems[index];

        // Find the module and its pricing details (client-side!)
        const module = serviceModules.find(m => m.id === moduleId);

        // Auto-select Level if module changed and level is empty
        let finalLevelId = levelId;
        if (moduleId && !levelId && module?.pricing?.length) {
            // 1. Try to find "Professional" (standard)
            const standardPrice = module.pricing.find(p => p.seniority_level?.level_name === 'Professional');
            // 2. Fallback to the first available pricing
            const defaultPrice = standardPrice || module.pricing[0];

            if (defaultPrice) {
                finalLevelId = defaultPrice.seniority_level_id;
            }
        }

        // Update IDs
        item.service_module_id = moduleId;
        item.seniority_level_id = finalLevelId;

        // Apply Pricing & Title
        if (module) {
            // 1. Auto-fill Description (if empty or if module changed)
            // We only overwrite if it's currently empty OR if we assume the user just picked a new service and wants the default
            // To be safe, let's only fill if it's empty to avoid overwriting user custom text,
            // UNLESS the user explicitly swapped the service module (which implies a reset).
            // Given the flow, let's auto-fill if the item description is empty OR equals the title (legacy check).
            // Simplest UX: If the field is empty, fill it.
            if (!item.description || item.description.trim() === '') {
                item.description = module.description || '';
            }

            if (finalLevelId) {
                const pricing = module.pricing?.find(p => p.seniority_level_id === finalLevelId);

                if (pricing) {
                    // Auto-update price!
                    item.unit_price = pricing.rate;

                    // Auto-update title if empty
                    const levelName = pricing.seniority_level?.level_name || 'Standard';
                    if (!item.position_title || item.position_title === '') {
                        item.position_title = `${module.service_module} (${levelName})`;
                    }
                } else {
                    // Module + Level selected, but no pricing found (edge case)
                    item.unit_price = 0;
                }
            } else {
                // Only Module selected (no pricing found yet)
                if (!item.position_title) {
                    item.position_title = module.service_module;
                }
            }
        }

        setItems(newItems);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-border">
                    <h2 className="text-2xl font-bold text-foreground">
                        {isEditMode ? 'Edit' : 'New'} Financial Document
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Document Details */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-background/50 p-4 rounded-lg">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Type</label>
                            <select
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as DocType })}
                                className="w-full bg-muted border-input rounded-md text-foreground"
                            >
                                <option value={DocType.Quote}>Quote (KVA)</option>
                                <option value={DocType.Invoice}>Invoice (Rechnung)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as DocStatus })}
                                className="w-full bg-muted border-input rounded-md text-foreground"
                            >
                                <option value={DocStatus.Draft}>Draft</option>
                                <option value={DocStatus.Sent}>Sent</option>
                                <option value={DocStatus.Approved}>Approved</option>
                                <option value={DocStatus.Paid}>Paid</option>
                                <option value={DocStatus.Cancelled}>Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Date Issued</label>
                            <input
                                type="date"
                                value={formData.date_issued}
                                onChange={e => setFormData({ ...formData, date_issued: e.target.value })}
                                className="w-full bg-muted border-input rounded-md text-foreground"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Document No.</label>
                            <input
                                type="text"
                                value={formData.document_number}
                                onChange={e => setFormData({ ...formData, document_number: e.target.value })}
                                placeholder="Auto or Manual"
                                className="w-full bg-muted border-input rounded-md text-foreground"
                            />
                        </div>
                    </div>

                    {/* Line Items */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-medium text-foreground">Line Items</h3>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded"
                            >
                                + Add Item
                            </button>
                        </div>

                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-muted-foreground text-xs border-b border-border">
                                    <th className="py-2 w-[25%]">Service (Standard)</th>
                                    <th className="py-2 w-[25%]">Position / Desc</th>
                                    <th className="py-2 w-[10%] text-center">Qty</th>
                                    <th className="py-2 w-[15%] text-right">Price</th>
                                    <th className="py-2 w-[15%] text-right">Total</th>
                                    <th className="py-2 w-[5%]"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {items.map((item, index) => (
                                    <tr key={item.id} className="group hover:bg-muted/30">
                                        <td className="py-3 pr-2 align-top">
                                            {/* Service Selectors */}
                                            <div className="flex flex-col gap-1">
                                                <select
                                                    value={item.service_module_id}
                                                    onChange={(e) => handleServiceSelection(index, e.target.value, item.seniority_level_id)}
                                                    className="w-full bg-muted border-input rounded text-sm text-foreground px-2 py-1"
                                                >
                                                    <option value="">Select Service...</option>
                                                    {serviceModules.filter(m => m.is_active).map(m => (
                                                        <option key={m.id} value={m.id}>{m.service_module} ({m.category})</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={item.seniority_level_id}
                                                    onChange={(e) => handleServiceSelection(index, item.service_module_id, e.target.value)}
                                                    disabled={!item.service_module_id}
                                                    className="w-full bg-muted border-input rounded text-sm text-foreground px-2 py-1 disabled:opacity-50"
                                                >
                                                    <option value="">Select Level...</option>
                                                    {seniorityLevels.filter(l => l.is_active).map(l => (
                                                        <option key={l.id} value={l.id}>{l.level_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="py-3 pr-2 align-top">
                                            <div className="flex flex-col gap-1">
                                                <input
                                                    type="text"
                                                    value={item.position_title}
                                                    onChange={(e) => handleItemChange(index, 'position_title', e.target.value)}
                                                    placeholder="Position Title"
                                                    className="w-full bg-muted border-input rounded text-sm text-foreground px-2 py-1 placeholder-gray-500 font-medium"
                                                />
                                                <textarea
                                                    rows={1}
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                    placeholder="Description (optional)"
                                                    className="w-full bg-muted border-input rounded text-sm text-foreground px-2 py-1 placeholder-gray-500"
                                                />
                                            </div>
                                        </td>
                                        <td className="py-3 px-2 align-top">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                className="w-full bg-muted border-input rounded text-sm text-foreground px-2 py-1 text-center"
                                            />
                                        </td>
                                        <td className="py-3 px-2 align-top">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unit_price}
                                                onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                className="w-full bg-muted border-input rounded text-sm text-foreground px-2 py-1 text-right"
                                            />
                                        </td>
                                        <td className="py-3 px-2 align-top text-right font-medium text-foreground">
                                            {(item.quantity * item.unit_price).toFixed(2)} €
                                        </td>
                                        <td className="py-3 align-middle text-center">
                                            <button
                                                onClick={() => handleRemoveItem(index)}
                                                className="text-muted-foreground hover:text-red-400"
                                                title="Remove Item"
                                            >
                                                <Icon path="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end border-t border-border pt-4">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal (Net):</span>
                                <span>{totalNet.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground items-center">
                                <span>VAT ({formData.vat_percent}%):</span>
                                <span className="text-sm">{totalVat.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between text-foreground font-bold text-lg border-t border-input pt-2">
                                <span>Total (Gross):</span>
                                <span>{totalGross.toFixed(2)} €</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-border flex justify-end gap-3 bg-background/50 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-muted hover:bg-muted/80 text-foreground rounded transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending}
                        className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded transition-colors disabled:opacity-50"
                    >
                        {mutation.isPending ? 'Saving...' : 'Save Document'}
                    </button>
                </div>
            </div>
        </div>
    );
};
