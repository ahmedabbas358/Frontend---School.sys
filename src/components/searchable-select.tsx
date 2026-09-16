import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, Sparkles, AlertCircle } from "lucide-react";

export interface SearchableSelectOption {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SearchableSelectProps {
  value: string; // the id of the selected option
  onChange: (val: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  allowClear?: boolean;
  disabled?: boolean;
  disabledHint?: string;
  onDisabledClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  variant?: "default" | "guided";
}

export function SearchableSelect({ 
  value, 
  onChange, 
  options,
  placeholder = "-- اختر --",
  searchPlaceholder = "ابحث هنا...",
  emptyMessage = "لا توجد نتائج مطابقة",
  allowClear = false,
  disabled = false,
  disabledHint,
  onDisabledClick,
  icon: TriggerIcon,
  className = "",
  variant = "default"
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowTooltip(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => 
    o.title.toLowerCase().includes(search.toLowerCase()) || 
    (o.subtitle && o.subtitle.toLowerCase().includes(search.toLowerCase())) ||
    (o.badge && o.badge.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedOption = options.find(o => o.id === value);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

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

  const handleTriggerClick = () => {
    if (disabled) {
      if (disabledHint) {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 3000);
      }
      if (onDisabledClick) {
        onDisabledClick();
      }
      return;
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`} ref={ref} onKeyDown={handleKeyDown}>
      {/* Main Select Button Container */}
      <div 
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        onClick={handleTriggerClick}
        className={`group relative flex items-center justify-between w-full h-12 rounded-2xl border px-3.5 sm:px-4 text-xs sm:text-sm font-bold transition-all duration-200 outline-none select-none ${
          disabled
            ? disabledHint
              ? "cursor-pointer border-dashed border-amber-500/40 dark:border-amber-400/40 bg-amber-500/[0.04] dark:bg-amber-400/[0.05] text-amber-800 dark:text-amber-200 hover:bg-amber-500/[0.08] hover:border-amber-500/60 shadow-xs active:scale-[0.99]"
              : "cursor-not-allowed border-dashed border-border/70 bg-muted/10 text-muted-foreground/60"
            : isOpen
            ? "border-primary ring-4 ring-primary/20 bg-background text-foreground shadow-lg glow-primary backdrop-blur-2xl"
            : "border-border/80 dark:border-border/70 bg-card/90 dark:bg-card/95 backdrop-blur-xl hover:bg-card hover:border-primary/60 text-foreground shadow-xs hover:shadow-md"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {TriggerIcon ? (
            <TriggerIcon className={`h-4 w-4 shrink-0 transition-colors ${
              disabled 
                ? disabledHint
                  ? "text-amber-500"
                  : "text-muted-foreground/50" 
                : isOpen 
                ? "text-primary" 
                : "text-muted-foreground group-hover:text-primary"
            }`} />
          ) : selectedOption?.icon ? (
            <selectedOption.icon className="h-4 w-4 shrink-0 text-primary" />
          ) : null}

          <span className="truncate flex-1 text-right">
            {selectedOption ? (
              <span className="flex items-center gap-2">
                <span className="font-extrabold text-foreground">{selectedOption.title}</span>
                {selectedOption.subtitle && (
                  <span className="text-[11px] text-muted-foreground font-normal">
                    ({selectedOption.subtitle})
                  </span>
                )}
                {selectedOption.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-black border border-primary/20">
                    {selectedOption.badge}
                  </span>
                )}
              </span>
            ) : (
              <span className={`flex items-center gap-1.5 ${
                disabled 
                  ? "font-medium" 
                  : "text-muted-foreground/60 font-semibold"
              }`}>
                {disabled && disabledHint ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-400/15 px-2.5 py-1 rounded-xl border border-amber-500/30 shadow-xs animate-in fade-in duration-150">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
                    <span>{disabledHint}</span>
                  </span>
                ) : (
                  placeholder
                )}
              </span>
            )}
          </span>
        </div>

        {/* Action icons on end */}
        <div className="flex items-center gap-1.5 shrink-0 me-0.5">
          {!disabled && options.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-black tabular-nums">
              <span>{options.length}</span>
              <span className="text-[9px] opacity-80">متاح</span>
            </span>
          )}
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
            disabled 
              ? disabledHint
                ? "text-amber-500/70"
                : "text-muted-foreground/40" 
              : isOpen 
              ? "rotate-180 text-primary" 
              : "text-muted-foreground opacity-70 group-hover:text-primary"
          }`} />
        </div>
      </div>

      {/* Disabled Interactive Guidance Tooltip */}
      {showTooltip && disabledHint && (
        <div className="absolute -top-11 start-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-black px-3.5 py-1.5 rounded-xl shadow-2xl border border-white/20 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{disabledHint}</span>
        </div>
      )}

      {/* Popover Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 rounded-2xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Search Header */}
          <div className="p-2.5 border-b border-border/60 flex items-center gap-2 bg-muted/30">
            <Search className="h-4 w-4 text-primary shrink-0 opacity-80" />
            <input 
              autoFocus
              type="text" 
              placeholder={searchPlaceholder} 
              className="w-full bg-transparent border-none focus:outline-none text-xs sm:text-sm font-bold placeholder:text-muted-foreground/60 text-foreground"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button 
                type="button" 
                onClick={() => setSearch("")}
                className="text-[11px] font-bold text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded-md hover:bg-muted"
              >
                مسح
              </button>
            )}
          </div>

          {/* Options Scroll List */}
          <div className="max-h-64 overflow-y-auto p-1.5 custom-scrollbar-modal space-y-1">
            {allowClear && (
              <div 
                className={`px-3 py-2.5 text-xs sm:text-sm rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                  !value ? "bg-primary/10 text-primary font-black" : "text-muted-foreground hover:bg-muted/60"
                }`}
                onClick={() => { onChange(""); setIsOpen(false); setSearch(""); }}
              >
                <span>بدون تحديد</span>
                {!value && <Check className="h-4 w-4" />}
              </div>
            )}
            
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center space-y-2">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-muted/50 mx-auto text-muted-foreground">
                  <Search className="w-5 h-5 opacity-40" />
                </div>
                <div className="text-xs font-bold text-muted-foreground">{emptyMessage}</div>
              </div>
            ) : (
              filteredOptions.map((t, idx) => {
                const isSelected = value === t.id;
                const isHighlighted = idx === highlightedIndex;
                const OptionIcon = t.icon;

                return (
                  <div 
                    key={t.id}
                    className={`px-3 py-2.5 text-xs sm:text-sm rounded-xl cursor-pointer flex items-center justify-between transition-all active:scale-[0.99] ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-black shadow-sm glow-primary"
                        : isHighlighted
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-foreground hover:bg-muted/70 font-semibold"
                    }`}
                    onClick={() => { onChange(t.id); setIsOpen(false); setSearch(""); }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {OptionIcon ? (
                        <OptionIcon className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-primary"}`} />
                      ) : null}
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="truncate">{t.title}</span>
                        {t.subtitle && (
                          <span className={`text-[11px] truncate font-normal ${
                            isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                          }`}>
                            {t.subtitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 me-1">
                      {t.badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-extrabold ${
                          isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground border border-border/50"
                        }`}>
                          {t.badge}
                        </span>
                      )}
                      {isSelected && <Check className="h-4 w-4 shrink-0 font-black text-white" />}
                    </div>
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
