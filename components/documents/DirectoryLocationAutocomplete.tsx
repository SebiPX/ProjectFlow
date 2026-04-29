import React, { useState, useEffect, useRef } from 'react';
import type { ApiLocation } from '../../lib/apiClient';

interface DirectoryLocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectCallback: (data: { name: string; address: string }) => void;
  locations: ApiLocation[];
  disabled?: boolean;
}

export const DirectoryLocationAutocomplete: React.FC<DirectoryLocationAutocompleteProps> = ({ 
  value, onChange, onSelectCallback, locations, disabled 
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
    
    return (locations || [])
      .filter(loc => loc.name?.toLowerCase().includes(lowerQuery))
      .slice(0, 8);
  }, [query, locations]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
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
        placeholder="Studio 1..."
        className="w-full bg-transparent font-medium text-lg border-b border-border focus:border-primary focus:outline-none pb-1 print:border-none print:p-0"
        disabled={disabled}
      />
      
      {isOpen && suggestions.length > 0 && !disabled && (
        <ul className="absolute z-20 w-full bg-card border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
          {suggestions.map((loc, i) => (
            <li 
              key={i} 
              className="p-3 border-b border-border/50 hover:bg-muted cursor-pointer text-sm transition-colors last:border-0"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevents input blur
                const newName = loc.name || '';
                const newAddress = loc.address || '';
                setQuery(newName);
                onChange(newName);
                onSelectCallback({ name: newName, address: newAddress });
                setIsOpen(false);
              }}
            >
              <div className="font-bold">{loc.name}</div>
              <div className="text-xs text-muted-foreground truncate">{loc.address || 'Keine Adresse hinterlegt'}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
