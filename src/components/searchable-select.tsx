import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";

export interface SearchableSelectOption {
  id: string;
  title: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  value: string; // the id of the selected option
  onChange: (val: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  allowClear?: boolean;
}

export function SearchableSelect({ 
  value, 
  onChange, 
  options,
  placeholder = "-- اختر --",
  searchPlaceholder = "ابحث...",
  emptyMessage = "لا توجد نتائج",
  allowClear = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => 
    o.title.toLowerCase().includes(search.toLowerCase()) || 
    (o.subtitle && o.subtitle.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedOption = options.find(o => o.id === value);

  return (
    <div className="relative" ref={ref}>
      <div 
        className="flex items-center justify-between w-full h-12 rounded-2xl border border-border/50 bg-background px-4 cursor-pointer hover:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-sm font-bold ${selectedOption ? "text-foreground" : "text-muted-foreground"}`}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {selectedOption.title}
              {selectedOption.subtitle && <span className="text-xs opacity-70 font-normal">({selectedOption.subtitle})</span>}
            </span>
          ) : placeholder}
        </span>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 rounded-2xl border border-border bg-card shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-border flex items-center gap-2 bg-background/50">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input 
              autoFocus
              type="text" 
              placeholder={searchPlaceholder} 
              className="w-full bg-transparent border-none focus:outline-none text-sm font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {allowClear && (
              <div 
                className={`px-3 py-2.5 text-sm rounded-xl cursor-pointer flex items-center justify-between hover:bg-accent ${!value ? "bg-primary/10 text-primary font-bold" : "font-medium"}`}
                onClick={() => { onChange(""); setIsOpen(false); setSearch(""); }}
              >
                <span>بدون اختيار</span>
                {!value && <Check className="h-4 w-4" />}
              </div>
            )}
            
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-center text-muted-foreground font-bold">{emptyMessage}</div>
            ) : (
              filteredOptions.map(t => (
                <div 
                  key={t.id}
                  className={`px-3 py-2.5 text-sm rounded-xl cursor-pointer flex items-center justify-between hover:bg-accent transition-colors ${value === t.id ? "bg-primary/10 text-primary font-bold" : "font-medium"}`}
                  onClick={() => { onChange(t.id); setIsOpen(false); setSearch(""); }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span>{t.title}</span>
                    {t.subtitle && <span className="text-[11px] text-muted-foreground opacity-80">{t.subtitle}</span>}
                  </div>
                  {value === t.id && <Check className="h-4 w-4" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
