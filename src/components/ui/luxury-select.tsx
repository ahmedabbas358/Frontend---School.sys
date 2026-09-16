import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, Search, X, Sparkles, AlertCircle } from "lucide-react";

export interface LuxurySelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeTone?: "primary" | "success" | "warning" | "danger" | "muted";
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export interface LuxurySelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: (LuxurySelectOption | string)[];
  placeholder?: string;
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  disabledHint?: string;
  onDisabledClick?: () => void;
  searchable?: boolean;
  clearable?: boolean;
  showCountBadge?: boolean;
  popoverClassName?: string;
  className?: string;
  triggerClassName?: string;
  size?: "sm" | "md" | "lg";
}

export function LuxurySelect({
  value,
  onChange,
  options,
  placeholder = "-- اختر من القائمة --",
  label,
  icon: TriggerIcon,
  required = false,
  error,
  disabled = false,
  disabledHint,
  onDisabledClick,
  searchable,
  clearable = false,
  showCountBadge = false,
  popoverClassName = "",
  className = "",
  triggerClassName = "",
  size = "md",
}: LuxurySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options array
  const normalizedOptions: LuxurySelectOption[] = useMemo(() => {
    return (options || []).map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Should we enable search? (auto-enable if > 6 options unless explicitly set)
  const isSearchEnabled = searchable !== undefined ? searchable : normalizedOptions.length > 6;

  // Selected option
  const selectedOption = normalizedOptions.find((o) => o.value === value);

  // Filtered options based on search
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return normalizedOptions;
    const q = search.toLowerCase();
    return normalizedOptions.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel && o.sublabel.toLowerCase().includes(q)) ||
        (o.badge && o.badge.toLowerCase().includes(q))
    );
  }, [normalizedOptions, search]);

  // Outside click listener
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowTooltip(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

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
    setIsOpen((prev) => !prev);
    if (!isOpen) setSearch("");
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  const heightClass = size === "sm" ? "h-9 text-xs" : size === "lg" ? "h-13 text-base" : "h-11 sm:h-12 text-xs sm:text-sm";

  return (
    <div className={`relative space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-foreground mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            {TriggerIcon && <TriggerIcon className="w-3.5 h-3.5 text-primary" />}
            <span>{label}</span>
            {required && <span className="text-danger font-black">*</span>}
          </span>
          {disabled && disabledHint && (
            <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-400/15 px-2.5 py-0.5 rounded-lg border border-amber-500/25">
              {disabledHint}
            </span>
          )}
        </label>
      )}

      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleTriggerClick}
        className={`group relative flex items-center justify-between w-full ${heightClass} rounded-2xl border px-3.5 sm:px-4 font-bold transition-all duration-200 outline-none select-none ${
          disabled
            ? disabledHint
              ? "cursor-pointer border-dashed border-amber-500/40 dark:border-amber-400/40 bg-amber-500/[0.04] dark:bg-amber-400/[0.05] text-amber-800 dark:text-amber-200 hover:bg-amber-500/[0.08] hover:border-amber-500/60 shadow-xs active:scale-[0.99]"
              : "cursor-not-allowed border-dashed border-border/70 bg-muted/10 text-muted-foreground/60"
            : error
            ? "border-danger ring-2 ring-danger/20 bg-background text-foreground"
            : isOpen
            ? "border-primary ring-4 ring-primary/20 bg-background text-foreground shadow-lg glow-primary backdrop-blur-2xl"
            : "border-border/80 dark:border-border/70 bg-card/90 dark:bg-card/95 backdrop-blur-xl hover:bg-card hover:border-primary/60 text-foreground shadow-xs hover:shadow-md"
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedOption?.icon ? (
            <selectedOption.icon className="h-4 w-4 shrink-0 text-primary" />
          ) : TriggerIcon && !label ? (
            <TriggerIcon className={`h-4 w-4 shrink-0 transition-colors ${
              disabled 
                ? disabledHint
                  ? "text-amber-500"
                  : "text-muted-foreground/50" 
                : isOpen 
                ? "text-primary" 
                : "text-muted-foreground group-hover:text-primary"
            }`} />
          ) : null}

          <span className="truncate flex-1 text-right">
            {selectedOption ? (
              <span className="flex items-center gap-2">
                <span className="font-extrabold text-foreground">{selectedOption.label}</span>
                {selectedOption.sublabel && (
                  <span className="text-[11px] text-muted-foreground font-normal">
                    ({selectedOption.sublabel})
                  </span>
                )}
                {selectedOption.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-black border border-primary/20">
                    {selectedOption.badge}
                  </span>
                )}
              </span>
            ) : (
              <span className={disabled ? "font-medium" : "text-muted-foreground/60 font-semibold"}>
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

        <div className="flex items-center gap-1.5 shrink-0 me-0.5">
          {clearable && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {!disabled && showCountBadge && normalizedOptions.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-black tabular-nums">
              <span>{normalizedOptions.length}</span>
              <span className="text-[9px] opacity-80">متاح</span>
            </span>
          )}

          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
              disabled
                ? disabledHint
                  ? "text-amber-500/70"
                  : "text-muted-foreground/40"
                : isOpen
                ? "rotate-180 text-primary"
                : "text-muted-foreground opacity-70 group-hover:text-primary"
            }`}
          />
        </div>
      </div>

      {/* Tooltip for Disabled Guidance */}
      {showTooltip && disabledHint && (
        <div className="absolute -top-11 start-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-black px-3.5 py-1.5 rounded-xl shadow-2xl border border-white/20 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{disabledHint}</span>
        </div>
      )}

      {error && <p className="text-[11px] font-bold text-danger mt-1">{error}</p>}

      {/* Popover Dropdown Menu */}
      {isOpen && !disabled && (
        <div className={`absolute z-50 min-w-full min-w-[220px] max-w-[420px] start-0 mt-2 rounded-2xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top ${popoverClassName}`}>
          {/* Search Box if enabled */}
          {isSearchEnabled && (
            <div className="p-2.5 border-b border-border/60 flex items-center gap-2 bg-muted/30">
              <Search className="h-4 w-4 text-primary shrink-0 opacity-80" />
              <input
                autoFocus
                type="text"
                placeholder="ابحث في الخيارات..."
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
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar-modal space-y-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-7 text-center space-y-2">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-muted/50 mx-auto text-muted-foreground">
                  <Search className="w-5 h-5 opacity-40" />
                </div>
                <div className="text-xs font-bold text-muted-foreground">لا توجد خيارات مطابقة للبحث</div>
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value === opt.value;
                const OptionIcon = opt.icon;

                return (
                  <div
                    key={opt.value}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    className={`px-3 py-2.5 text-xs sm:text-sm rounded-xl cursor-pointer flex items-center justify-between transition-all active:scale-[0.99] ${
                      opt.disabled
                        ? "opacity-50 cursor-not-allowed bg-muted/20"
                        : isSelected
                        ? "bg-primary text-primary-foreground font-black shadow-sm glow-primary"
                        : "text-foreground hover:bg-muted/70 font-semibold"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {OptionIcon ? (
                        <OptionIcon className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-primary"}`} />
                      ) : null}
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span
                            className={`text-[11px] truncate font-normal ${
                              isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                            }`}
                          >
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 me-1">
                      {opt.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-lg font-extrabold ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-muted text-muted-foreground border border-border/50"
                          }`}
                        >
                          {opt.badge}
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
