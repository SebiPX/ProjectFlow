import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getClients } from '../services/api/clients';
import { ClientFormModal } from './ClientFormModal';
import { ClientEditModal } from './ClientEditModal';
import type { Client } from '../types/supabase';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { ClientLogo } from './ui/ClientLogo';

interface ClientListProps {
  searchQuery?: string;
}

export const ClientList: React.FC<ClientListProps> = ({ searchQuery = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-foreground text-xl">Loading clients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500 text-xl">Error loading clients. Please try again.</div>
      </div>
    );
  }

  const filteredClients = clients.filter(client => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      client.company_name?.toLowerCase().includes(query) ||
      client.city?.toLowerCase().includes(query) ||
      client.country?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Clients</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-lg flex items-center"
        >
          <Icon path="M12 6v6m0 0v6m0-6h6m-6 0H6" className="h-5 w-5 mr-2" />
          New Client
        </button>
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center text-muted-foreground mt-12">
          <p className="text-xl">No clients found.</p>
          <p className="mt-2 text-sm">{searchQuery ? 'Try adjusting your search terms.' : 'Create your first client to get started!'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:border-primary transition-all duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-1">{client.company_name}</h3>
                    {client.city && client.country && (
                      <p className="text-sm text-muted-foreground">
                        {client.city}, {client.country}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingClient(client)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                      title="Edit client"
                    >
                      <Icon
                        path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        className="w-5 h-5"
                      />
                    </button>
                    <ClientLogo
                      logoPath={client.logo_url}
                      companyName={client.company_name}
                      className="w-12 h-12 rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {client.address_line1 && (
                    <div className="flex items-start text-muted-foreground">
                      <Icon path="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{client.address_line1}</p>
                        {(client.zip_code || client.city) && (
                          <p>{client.zip_code} {client.city}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {client.vat_id && (
                    <div className="flex items-center text-muted-foreground">
                      <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="text-xs">VAT: {client.vat_id}</span>
                    </div>
                  )}

                  {client.website && (
                    <div className="flex items-center text-muted-foreground">
                      <Icon path="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" className="w-4 h-4 mr-2 flex-shrink-0" />
                      <a
                        href={client.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-blue-300 text-xs truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {client.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}

                  {/* Contact Person */}
                  {client.contacts && client.contacts.length > 0 && (() => {
                    const primaryContact = client.contacts.find(c => c.is_primary) || client.contacts[0];
                    return (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-2">Primary Contact</p>
                        <div className="space-y-1">
                          <div className="flex items-center text-muted-foreground">
                            <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="text-xs font-medium">{primaryContact.full_name}</span>
                            {primaryContact.position && (
                              <span className="text-xs text-muted-foreground ml-2">({primaryContact.position})</span>
                            )}
                          </div>
                          {primaryContact.email && (
                            <div className="flex items-center text-muted-foreground">
                              <Icon path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" className="w-4 h-4 mr-2 flex-shrink-0" />
                              <a
                                href={`mailto:${primaryContact.email}`}
                                className="text-xs text-primary hover:text-blue-300 truncate"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {primaryContact.email}
                              </a>
                            </div>
                          )}
                          {primaryContact.phone && (
                            <div className="flex items-center text-muted-foreground">
                              <Icon path="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" className="w-4 h-4 mr-2 flex-shrink-0" />
                              <span className="text-xs">{primaryContact.phone}</span>
                            </div>
                          )}
                          {client.contacts.length > 1 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              +{client.contacts.length - 1} more contact{client.contacts.length - 1 !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {client.payment_terms_days !== undefined && (
                    <div className="flex items-center text-muted-foreground text-xs mt-4 pt-4 border-t border-border">
                      <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>Payment terms: {client.payment_terms_days} days</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {editingClient && (
        <ClientEditModal
          isOpen={!!editingClient}
          onClose={() => setEditingClient(null)}
          client={editingClient}
        />
      )}
    </div>
  );
};
