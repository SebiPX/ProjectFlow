import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { updateClient, uploadClientLogo, updateClientLogo, deleteClientLogo, getClientLogoSignedUrl } from '../services/api/clients';
import {
  getClientContacts,
  createClientContact,
  updateClientContact,
  deleteClientContact
} from '../services/api/clientContacts';
import type { Client, ClientContact } from '../types/supabase';
import { Icon } from './ui/Icon';

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
  isNew?: boolean;
  isDeleted?: boolean;
}

export const ClientEditModal: React.FC<ClientEditModalProps> = ({ isOpen, onClose, client }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    company_name: client.company_name,
    address_line1: client.address_line1 || '',
    zip_code: client.zip_code || '',
    city: client.city || '',
    country: client.country || 'Germany',
    vat_id: client.vat_id || '',
    payment_terms_days: client.payment_terms_days?.toString() || '30',
    website: client.website || '',
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

        if (contact.isNew) {
          // Create new contact
          await createClientContact({
            client_id: client.id,
            ...contactData,
          });
        } else if (contact.id) {
          // Update existing contact
          await updateClientContact(contact.id, contactData);
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
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Edit Client</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Icon path="M6 18L18 6M6 6l12 12" className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Company Name */}
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-gray-300 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              id="company_name"
              required
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter company name"
            />
          </div>

          {/* Company Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Company Logo
            </label>
            <div className="flex items-center gap-4">
              {logoPreview || currentLogoUrl ? (
                <img
                  src={logoPreview || currentLogoUrl || ''}
                  alt="Logo"
                  className="w-20 h-20 rounded-lg object-cover border-2 border-gray-600"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
                  <Icon path="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-8 h-8 text-gray-500" />
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg cursor-pointer transition-colors"
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
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label htmlFor="address_line1" className="block text-sm font-medium text-gray-300 mb-2">
              Address
            </label>
            <input
              type="text"
              id="address_line1"
              value={formData.address_line1}
              onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Street and house number"
            />
          </div>

          {/* City & ZIP Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="zip_code" className="block text-sm font-medium text-gray-300 mb-2">
                ZIP Code
              </label>
              <input
                type="text"
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12345"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
                City
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="City"
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">
              Country
            </label>
            <select
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label htmlFor="vat_id" className="block text-sm font-medium text-gray-300 mb-2">
                VAT ID
              </label>
              <input
                type="text"
                id="vat_id"
                value={formData.vat_id}
                onChange={(e) => setFormData({ ...formData, vat_id: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="DE123456789"
              />
            </div>

            <div>
              <label htmlFor="payment_terms_days" className="block text-sm font-medium text-gray-300 mb-2">
                Payment Terms (Days)
              </label>
              <input
                type="number"
                id="payment_terms_days"
                min="0"
                value={formData.payment_terms_days}
                onChange={(e) => setFormData({ ...formData, payment_terms_days: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="30"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-2">
              Website
            </label>
            <input
              type="url"
              id="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          </div>

          {/* Contact Persons Section */}
          <div className="pt-6 border-t border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Contact Persons</h3>
              <button
                type="button"
                onClick={addContact}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                <Icon path="M12 6v6m0 0v6m0-6h6m-6 0H6" className="w-4 h-4" />
                Add Contact
              </button>
            </div>

            <div className="space-y-4">
              {contacts.filter(c => !c.isDeleted).map((contact, index) => (
                <div key={contact.id || index} className="bg-gray-700/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-gray-300">
                      Contact {index + 1}
                      {!contact.isNew && contact.id && (
                        <span className="ml-2 text-xs text-blue-400">(Existing)</span>
                      )}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Remove contact"
                    >
                      <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={contact.full_name}
                        onChange={(e) => updateContact(index, 'full_name', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Position
                      </label>
                      <input
                        type="text"
                        value={contact.position}
                        onChange={(e) => updateContact(index, 'position', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Marketing Manager"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(e) => updateContact(index, 'email', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={contact.phone}
                        onChange={(e) => updateContact(index, 'phone', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+49 123 456789"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={contact.notes}
                      onChange={(e) => updateContact(index, 'notes', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`primary-${index}`}
                      checked={contact.is_primary}
                      onChange={(e) => updateContact(index, 'is_primary', e.target.checked)}
                      className="w-4 h-4 bg-gray-700 border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor={`primary-${index}`} className="ml-2 text-xs text-gray-300">
                      Primary Contact
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              disabled={updateMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
