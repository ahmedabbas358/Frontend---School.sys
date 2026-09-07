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
  const [highlightedIndex, setHighlightedIndex] = useState(0);
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

  useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % Math.max(filteredOptions.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % Math.max(filteredOptions.length, 1));
    } else if (e.key === "Enter" && filteredOptions[highlightedIndex]) {
      e.preventDefault();
      onChange(filteredOptions[highlightedIndex].id);
      setIsOpen(false);
      setSearch("");
    }
  };

  return (
    <div className="relative" ref={ref} onKeyDown={handleKeyDown}>
      <div 
        tabIndex={0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex items-center justify-between w-full h-11 rounded-xl border px-3.5 text-sm cursor-pointer transition-all duration-200 shadow-xs outline-none ${
          isOpen
            ? "border-primary ring-4 ring-primary/15 bg-background text-foreground"
            : "border-input bg-background/80 hover:border-primary/45 text-foreground"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-xs sm:text-sm font-semibold truncate ${selectedOption ? "text-foreground" : "text-muted-foreground/60"}`}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              <span className="font-bold">{selectedOption.title}</span>
              {selectedOption.subtitle && <span className="text-xs text-muted-foreground font-normal">({selectedOption.subtitle})</span>}
            </span>
          ) : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground opacity-70 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 rounded-2xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2.5 border-b border-border/60 flex items-center gap-2 bg-muted/20">
            <Search className="h-4 w-4 text-muted-foreground opacity-60 shrink-0" />
            <input 
              autoFocus
              type="text" 
              placeholder={searchPlaceholder} 
              className="w-full bg-transparent border-none focus:outline-none text-xs sm:text-sm font-medium placeholder:text-muted-foreground/60 text-foreground"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar-modal space-y-0.5">
            {allowClear && (
              <div 
                className={`px-3 py-2 text-xs sm:text-sm rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                  !value ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted/60"
                }`}
                onClick={() => { onChange(""); setIsOpen(false); setSearch(""); }}
              >
                <span>بدون اختيار</span>
                {!value && <Check className="h-4 w-4" />}
              </div>
            )}
            
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-xs sm:text-sm text-center text-muted-foreground font-medium">{emptyMessage}</div>
            ) : (
              filteredOptions.map((t, idx) => {
                const isSelected = value === t.id;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <div 
                    key={t.id}
                    className={`px-3 py-2 text-xs sm:text-sm rounded-xl cursor-pointer flex items-center justify-between transition-all active:scale-[0.99] ${
                      isSelected
                        ? "bg-primary/10 text-primary font-bold"
                        : isHighlighted
                        ? "bg-muted text-foreground font-medium"
                        : "text-foreground hover:bg-muted/60 font-medium"
                    }`}
                    onClick={() => { onChange(t.id); setIsOpen(false); setSearch(""); }}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="truncate">{t.title}</span>
                      {t.subtitle && <span className="text-[11px] text-muted-foreground opacity-80 truncate">{t.subtitle}</span>}
                    </div>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-primary font-bold" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
