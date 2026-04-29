import React, { useState, useRef, useEffect } from 'react';

interface MultiPersonSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
}

export const MultiPersonSelect: React.FC<MultiPersonSelectProps> = ({ value, onChange, options, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedNames = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleName = (name: string) => {
    let next;
    if (selectedNames.includes(name)) {
      next = selectedNames.filter(n => n !== name);
    } else {
      next = [...selectedNames, name];
    }
    onChange(next.join(', '));
  };

  const addCustom = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customInput.trim()) {
      e.preventDefault();
      if (!selectedNames.includes(customInput.trim())) {
        onChange([...selectedNames, customInput.trim()].join(', '));
      }
      setCustomInput('');
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[30px] p-1 bg-transparent hover:bg-muted/50 focus:ring-1 focus:ring-primary rounded cursor-pointer print:p-0 flex flex-wrap gap-1 items-center ${disabled ? 'opacity-70' : ''}`}
      >
        {selectedNames.length === 0 ? (
          <span className="text-muted-foreground text-sm">Wer...</span>
        ) : (
          selectedNames.map((name, index) => (
            <span key={name} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded print:bg-transparent print:p-0 print:text-black">
              {name}{index < selectedNames.length - 1 && <span className="hidden print:inline">, </span>}
              {!disabled && (
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleName(name); }} 
                  className="ml-1 hover:text-red-500 print:hidden"
                >
                  &times;
                </button>
              )}
            </span>
          ))
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-30 top-full left-0 w-64 bg-card border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto flex flex-col print:hidden">
          <div className="p-2 border-b border-border/50 sticky top-0 bg-card z-10">
            <input 
              type="text" 
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={addCustom}
              placeholder="Name tippen + Enter..."
              className="w-full text-sm bg-transparent border border-border rounded p-1 focus:border-primary focus:outline-none mb-2"
            />
            {options.length > 0 && !customInput && (
              <label className="flex items-center p-1 hover:bg-muted cursor-pointer text-sm font-semibold border border-border/50 rounded bg-muted/20">
                <input 
                  type="checkbox" 
                  checked={options.every(opt => selectedNames.includes(opt))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const newSelected = Array.from(new Set([...selectedNames, ...options]));
                      onChange(newSelected.join(', '));
                    } else {
                      const newSelected = selectedNames.filter(name => !options.includes(name));
                      onChange(newSelected.join(', '));
                    }
                  }}
                  className="mr-2 ml-1"
                />
                Alle auswählen
              </label>
            )}
          </div>
          {options.length === 0 && !customInput && (
            <div className="p-3 text-sm text-muted-foreground italic">Keine Kontakte im Dokument.</div>
          )}
          {options
            .filter(opt => opt.toLowerCase().includes(customInput.toLowerCase()))
            .map((opt, i) => {
            const isSelected = selectedNames.includes(opt);
            return (
              <label key={i} className="flex items-center p-2 hover:bg-muted cursor-pointer text-sm border-b border-border/50 last:border-0">
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  onChange={() => toggleName(opt)}
                  className="mr-2"
                />
                {opt}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};
