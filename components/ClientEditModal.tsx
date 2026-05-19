import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useAuth } from '../lib/AuthContext';
import { updateClient, uploadClientLogo, updateClientLogo, deleteClientLogo, getClientLogoSignedUrl, manageClientLogin, revokeClientLogin } from '../services/api/clients';
import {
  getClientContacts,
  createClientContact,
  updateClientContact,
  deleteClientContact
} from '../services/api/clientContacts';
import type { Client, ClientContact } from '../types/supabase';
import { Icon } from './ui/Icon';
import CreatableSelect from 'react-select/creatable';

interface ClientEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

interface ContactFormData {
  id?: string;
  full_name: string;
  position: string;
  email: string;
  phone: string;
  is_primary: boolean;
  notes: string;
  has_login?: boolean;
  original_has_login?: boolean;
  password?: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

export const ClientEditModal: React.FC<ClientEditModalProps> = ({ isOpen, onClose, client }) => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    company_name: client.company_name,
    address_line1: client.address_line1 || '',
    zip_code: client.zip_code || '',
    city: client.city || '',
    country: client.country || 'Germany',
    vat_id: client.vat_id || '',
    payment_terms_days: client.payment_terms_days?.toString() || '30',
    website: client.website || '',
    brands: client.brands || [],
  });

  const [contacts, setContacts] = useState<ContactFormData[]>([]);
  
  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);

  const { data: existingContacts } = useQuery({
    queryKey: ['clientContacts', client.id],
    queryFn: () => getClientContacts(client.id),
    enabled: isOpen,
  });

  // Update form data when client changes
  useEffect(() => {
    setFormData({
      company_name: client.company_name,
      address_line1: client.address_line1 || '',
      zip_code: client.zip_code || '',
      city: client.city || '',
      country: client.country || 'Germany',
      vat_id: client.vat_id || '',
      payment_terms_days: client.payment_terms_days?.toString() || '30',
      website: client.website || '',
      brands: client.brands || [],
    });
  }, [client]);

  // Load existing contacts
  useEffect(() => {
    if (existingContacts) {
      if (existingContacts.length > 0) {
        setContacts(existingContacts.map(c => ({
          id: c.id,
          full_name: c.full_name,
          position: c.position || '',
          email: c.email || '',
          phone: c.phone || '',
          is_primary: c.is_primary || false,
          notes: c.notes || '',
          has_login: (c as any).has_login || false,
          original_has_login: (c as any).has_login || false,
          password: '',
          isNew: false,
        })));
      } else {
        // If no contacts exist, show one empty form
        setContacts([{
          full_name: '',
          position: '',
          email: '',
          phone: '',
          is_primary: true,
          notes: '',
          has_login: false,
          password: '',
          isNew: true,
        }]);
      }
    }
  }, [existingContacts]);

  // Load current logo
  useEffect(() => {
    if (client.logo_url && !logoPreview) {
      getClientLogoSignedUrl(client.logo_url)
        .then(url => setCurrentLogoUrl(url))
        .catch(err => {
          console.error('Error loading client logo:', err);
          setCurrentLogoUrl(null);
        });
    }
  }, [client.logo_url, logoPreview]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Update client mutation
  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Client>) => updateClient(client.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client updated successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to update client: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company_name.trim()) {
      toast.error('Company name is required');
      return;
    }

    try {
      // Update client
      await updateMutation.mutateAsync({
        company_name: formData.company_name.trim(),
        address_line1: formData.address_line1.trim() || null,
        zip_code: formData.zip_code.trim() || null,
        city: formData.city.trim() || null,
        country: formData.country || 'Germany',
        vat_id: formData.vat_id.trim() || null,
        payment_terms_days: formData.payment_terms_days ? parseInt(formData.payment_terms_days) : 30,
        website: formData.website.trim() || null,
        brands: formData.brands,
      });

      // Upload new logo if selected
      if (logoFile) {
        // Delete old logo if exists
        if (client.logo_url) {
          await deleteClientLogo(client.logo_url);
        }
        const logoPath = await uploadClientLogo(client.id, logoFile);
        await updateClientLogo(client.id, logoPath);
      }

      // Process contacts
      for (const contact of contacts) {
        // Skip if marked for deletion
        if (contact.isDeleted) {
          if (contact.id) {
            await deleteClientContact(contact.id);
          }
          continue;
        }

        // Skip empty contacts
        if (!contact.full_name.trim() && !contact.email.trim()) {
          continue;
        }

        const contactData = {
          full_name: contact.full_name.trim(),
          position: contact.position.trim() || null,
          email: contact.email.trim() || null,
          phone: contact.phone.trim() || null,
          is_primary: contact.is_primary,
          notes: contact.notes.trim() || null,
        };

        let currentContactId = contact.id;

        if (contact.isNew) {
          // Create new contact
          const newContact = await createClientContact({
            client_id: client.id,
            ...contactData,
          });
          currentContactId = newContact.id;
        } else if (contact.id) {
          // Update existing contact
          await updateClientContact(contact.id, contactData);
        }

        // Manage Login
        if (currentContactId && contact.email) {
          if (contact.has_login && contact.password) {
            // Needs to create or update password
            await manageClientLogin(currentContactId, contact.password);
          } else if (!contact.has_login && contact.original_has_login) {
            // Access was revoked
            await revokeClientLogin(currentContactId);
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clientContacts', client.id] });
      toast.success('Client and contacts updated successfully!');
      onClose();
    } catch (error: any) {
      toast.error(`Failed to update client: ${error.message}`);
    }
  };

  const addContact = () => {
    setContacts([
      ...contacts,
      {
        full_name: '',
        position: '',
        email: '',
        phone: '',
        is_primary: false,
        notes: '',
        has_login: false,
        password: '',
        isNew: true,
      },
    ]);
  };

  const removeContact = (index: number) => {
    const contact = contacts[index];
    if (contact.isNew) {
      // If it's a new contact, just remove it from the array
      setContacts(contacts.filter((_, i) => i !== index));
    } else {
      // If it's an existing contact, mark it for deletion
      const updated = [...contacts];
      updated[index] = { ...updated[index], isDeleted: true };
      setContacts(updated);
    }
  };

  const updateContact = (index: number, field: keyof ContactFormData, value: string | boolean) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };

    // If setting a contact as primary, unset all others
    if (field === 'is_primary' && value === true) {
      updated.forEach((contact, i) => {
        if (i !== index) contact.is_primary = false;
      });
    }

    setContacts(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">Edit Client</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Company Name */}
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-muted-foreground mb-2">
              Company Name *
            </label>
            <input
              type="text"
              id="company_name"
              required
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter company name"
            />
          </div>

          {/* Company Logo */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Company Logo
            </label>
            <div className="flex items-center gap-4">
              {logoPreview || currentLogoUrl ? (
                <img
                  src={logoPreview || currentLogoUrl || ''}
                  alt="Logo"
                  className="w-20 h-20 rounded-lg object-cover border-2 border-input"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-muted border-2 border-input flex items-center justify-center">
                  <Icon path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  id="logo-upload-edit"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <label
                  htmlFor="logo-upload-edit"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded-lg cursor-pointer transition-colors"
                >
                  <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" className="w-4 h-4" />
                  {currentLogoUrl || logoPreview ? 'Change Logo' : 'Upload Logo'}
                </label>
                {logoFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                    }}
                    className="ml-2 text-sm text-red-400 hover:text-red-300"
                  >
                    Cancel
                  </button>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address_line1" className="block text-sm font-medium text-muted-foreground mb-2">
              Address
            </label>
            <input
              type="text"
              id="address_line1"
              value={formData.address_line1}
              onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Street and house number"
            />
          </div>

          {/* City & ZIP Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="zip_code" className="block text-sm font-medium text-muted-foreground mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="12345"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-muted-foreground mb-2">
                City
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="City"
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-muted-foreground mb-2">
              Country
            </label>
            <select
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Germany">Germany</option>
              <option value="Austria">Austria</option>
              <option value="Switzerland">Switzerland</option>
              <option value="Netherlands">Netherlands</option>
              <option value="Belgium">Belgium</option>
              <option value="France">France</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* VAT ID & Payment Terms Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="vat_id" className="block text-sm font-medium text-muted-foreground mb-2">
                VAT ID
              </label>
              <input
                type="text"
                id="vat_id"
                value={formData.vat_id}
                onChange={(e) => setFormData({ ...formData, vat_id: e.target.value })}
                className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="DE123456789"
              />
            </div>

            <div>
              <label htmlFor="payment_terms_days" className="block text-sm font-medium text-muted-foreground mb-2">
                Payment Terms (Days)
              </label>
              <input
                type="number"
                id="payment_terms_days"
                min="0"
                value={formData.payment_terms_days}
                onChange={(e) => setFormData({ ...formData, payment_terms_days: e.target.value })}
                className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="30"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-muted-foreground mb-2">
              Website
            </label>
            <input
              type="url"
              id="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://example.com"
            />
          </div>

          {/* Brands */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Client Brands (Tags / Shows)
            </label>
            <CreatableSelect
              isMulti
              placeholder="Add brands e.g. DMAX, TLC, Warner..."
              value={formData.brands.map(b => ({ value: b, label: b }))}
              onChange={(selected) => setFormData({ ...formData, brands: selected ? selected.map(s => s.value) : [] })}
              className="w-full text-sm"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: 'hsl(var(--muted))',
                  borderColor: 'hsl(var(--input))',
                  color: 'hsl(var(--foreground))',
                  borderRadius: '0.5rem',
                  minHeight: '42px',
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: 'hsl(var(--muted))',
                  border: '1px solid hsl(var(--input))',
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                  color: 'hsl(var(--foreground))',
                  cursor: 'pointer',
                  '&:active': {
                    backgroundColor: 'hsl(var(--primary) / 0.2)',
                  },
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: 'hsl(var(--primary) / 0.2)',
                  borderRadius: '4px',
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: 'hsl(var(--primary))',
                  fontWeight: 500,
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: 'hsl(var(--primary))',
                  ':hover': {
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'white',
                  },
                }),
                input: (base) => ({
                  ...base,
                  color: 'hsl(var(--foreground))',
                }),
              }}
            />
          </div>

          {/* Contact Persons Section */}
          <div className="pt-6 border-t border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Contact Persons</h3>
              <button
                type="button"
                onClick={addContact}
                className="px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                <Icon path="M12 6v6m0 0v6m0-6h6m-6 0H6" className="w-4 h-4" />
                Add Contact
              </button>
            </div>

            <div className="space-y-4">
              {contacts.filter(c => !c.isDeleted).map((contact, index) => (
                <div key={contact.id || index} className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                        Contact {index + 1}
                        {!contact.isNew && contact.id && (
                          <span className="ml-2 text-xs text-primary">(Existing)</span>
                        )}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="text-red-400 hover:text-red-300 transition-colors mt-1"
                      title="Remove contact"
                    >
                      <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={contact.full_name}
                        onChange={(e) => updateContact(index, 'full_name', e.target.value)}
                        className="w-full px-3 py-2 bg-muted border border-input rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Position
                      </label>
                      <input
                        type="text"
                        value={contact.position}
                        onChange={(e) => updateContact(index, 'position', e.target.value)}
                        className="w-full px-3 py-2 bg-muted border border-input rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Marketing Manager"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(e) => updateContact(index, 'email', e.target.value)}
                        className="w-full px-3 py-2 bg-muted border border-input rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={contact.phone}
                        onChange={(e) => updateContact(index, 'phone', e.target.value)}
                        className="w-full px-3 py-2 bg-muted border border-input rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="+49 123 456789"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Notes
                    </label>
                    <textarea
                      value={contact.notes}
                      onChange={(e) => updateContact(index, 'notes', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-muted border border-input rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`primary-${index}`}
                      checked={contact.is_primary}
                      onChange={(e) => updateContact(index, 'is_primary', e.target.checked)}
                      className="w-4 h-4 bg-muted border-input rounded focus:ring-2 focus:ring-primary"
                    />
                    <label htmlFor={`primary-${index}`} className="ml-2 text-xs text-muted-foreground">
                      Primary Contact
                    </label>
                  </div>

                  {/* Login Management */}
                  {profile?.role === 'superadmin' && (
                    <div className="bg-background/50 p-3 rounded border border-border space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`access-${index}`}
                          checked={contact.has_login || false}
                          onChange={(e) => updateContact(index, 'has_login', e.target.checked)}
                          className="w-4 h-4 bg-muted border-input rounded focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!contact.email}
                        />
                        <label htmlFor={`access-${index}`} className={`ml-2 text-sm font-medium ${contact.email ? 'text-foreground' : 'text-muted-foreground'}`}>
                          Zugang gewährt (Client Portal)
                        </label>
                        {!contact.email && (
                          <span className="ml-2 text-xs text-muted-foreground">(Email required)</span>
                        )}
                      </div>
                      
                      {contact.has_login && (
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                            Passwort {contact.original_has_login ? '(Optional: Neues Passwort setzen)' : '*'}
                          </label>
                          <input
                            type="text"
                            value={contact.password || ''}
                            onChange={(e) => updateContact(index, 'password', e.target.value)}
                            className="w-full px-3 py-2 bg-muted border border-input rounded text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Min. 6 characters"
                            required={!contact.original_has_login}
                            minLength={6}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
              disabled={updateMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                'Update Client'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
