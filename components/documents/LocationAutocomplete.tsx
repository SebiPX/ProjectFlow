import React, { useState, useEffect, useRef } from 'react';

interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectCallback: (lat: string, lon: string, address: string) => void;
  disabled?: boolean;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({ value, onChange, onSelectCallback, disabled }) => {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const searchLocation = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      // Nominatim is free to use without API Key, 1 request / second limit.
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=5`);
      const data = await res.json();
      setResults(data);
      setIsOpen(true);
    } catch (e) {
      console.error('Error fetching location from Nominatim', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Only search if user actually typed something new and popup is active
      if (query !== value && isOpen) {
        searchLocation(query);
      }
    }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [query, isOpen]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <textarea
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onBlur={() => {
          // If the user clicks away, try to save whatever they typed
          onChange(query);
        }}
        placeholder="Musterstraße 1..."
        className="w-full bg-transparent text-sm border border-transparent hover:border-border focus:border-primary rounded resize-none h-16 p-1 focus:outline-none print:border-none print:p-0"
        disabled={disabled}
      />
      {isLoading && <div className="absolute right-2 top-2 text-xs text-muted-foreground">Sucht...</div>}
      
      {isOpen && results.length > 0 && !disabled && (
        <ul className="absolute z-10 w-full bg-card border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
          {results.map((r, i) => (
            <li 
              key={i} 
              className="p-3 border-b border-border/50 hover:bg-muted cursor-pointer text-sm transition-colors last:border-0"
              onClick={() => {
                setQuery(r.display_name);
                onChange(r.display_name);
                onSelectCallback(r.lat, r.lon, r.display_name);
                setIsOpen(false);
              }}
            >
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
