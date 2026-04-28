import React, { useState, useEffect, useRef } from 'react';
import type { ApiFreelancer } from '../../lib/apiClient';

interface ContactAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectCallback: (data: { name: string; role: string; email: string; phone: string }) => void;
  profiles: any[];
  freelancers: ApiFreelancer[];
  clientContacts?: any[];
  disabled?: boolean;
}

export const ContactAutocomplete: React.FC<ContactAutocompleteProps> = ({ 
  value, onChange, onSelectCallback, profiles, freelancers, clientContacts = [], disabled 
}) => {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = React.useMemo(() => {
    const lowerQuery = (query || '').toLowerCase();
    
    const profileMatches = (profiles || [])
      .filter(p => p.full_name?.toLowerCase().includes(lowerQuery))
      .map(p => ({
        id: p.id,
        name: p.full_name || '',
        role: p.role || 'Team',
        email: p.email || '',
        phone: '',
        type: 'Team'
      }));

    const freelancerMatches = (freelancers || [])
      .filter(f => {
        const name = `${f.first_name || ''} ${f.last_name || ''}`.trim();
        return name.toLowerCase().includes(lowerQuery) || (f.company && f.company.toLowerCase().includes(lowerQuery));
      })
      .map(f => {
        const name = `${f.first_name || ''} ${f.last_name || ''}`.trim();
        return {
          id: f.id,
          name: name || f.company || '',
          role: f.category || 'Freelancer',
          email: f.email || '',
          phone: f.phone || '',
          type: 'Crew'
        };
      });

    const clientMatches = (clientContacts || [])
      .filter(c => c.full_name?.toLowerCase().includes(lowerQuery))
      .map(c => ({
        id: c.id,
        name: c.full_name || '',
        role: c.position || 'Kunde',
        email: c.email || '',
        phone: c.phone || '',
        type: 'Kunde'
      }));

    return [...profileMatches, ...freelancerMatches, ...clientMatches].slice(0, 8);
  }, [query, profiles, freelancers, clientContacts]);

  return (
    <div className="relative w-1/2" ref={wrapperRef}>
      <input
        type="text"
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onBlur={() => {
          if (query !== value) {
            onChange(query);
          }
        }}
        placeholder="Name..."
        className="font-bold bg-transparent focus:ring-1 focus:ring-primary rounded outline-none w-full print:p-0"
        disabled={disabled}
      />
      
      {isOpen && suggestions.length > 0 && !disabled && (
        <ul className="absolute z-20 w-80 bg-card border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
          {suggestions.map((s, i) => (
            <li 
              key={i} 
              className="p-3 border-b border-border/50 hover:bg-muted cursor-pointer text-sm transition-colors last:border-0"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevents input blur
                setQuery(s.name);
                onChange(s.name);
                onSelectCallback({ name: s.name, role: s.role, email: s.email, phone: s.phone });
                setIsOpen(false);
              }}
            >
              <div className="font-bold">{s.name}</div>
              <div className="text-xs text-muted-foreground">{s.type} &middot; {s.role}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
