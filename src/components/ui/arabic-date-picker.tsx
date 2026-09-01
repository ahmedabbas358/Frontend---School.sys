import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Clock
} from "lucide-react";

export interface ArabicDatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  minYear?: number;
  maxYear?: number;
}

const ARABIC_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const ARABIC_WEEKDAYS = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

export function ArabicDatePicker({
  value,
  onChange,
  label,
  placeholder = "اختر التاريخ...",
  required,
  error,
  disabled,
  className = "",
  minYear = 1990,
  maxYear = new Date().getFullYear() + 5,
}: ArabicDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date
  const initialDate = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parts = value.split("-").map(Number);
      return { year: parts[0], month: parts[1] - 1, day: parts[2] };
    }
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(initialDate.year);
  const [viewMonth, setViewMonth] = useState<number>(initialDate.month);
  const [decadeStart, setDecadeStart] = useState<number>(Math.floor(initialDate.year / 12) * 12);

  // Synchronize view state when value changes
  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parts = value.split("-").map(Number);
      setViewYear(parts[0]);
      setViewMonth(parts[1] - 1);
      setDecadeStart(Math.floor(parts[0] / 12) * 12);
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setViewMode("days");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Compute days in month
  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  // Starting weekday of the month (0 = Sunday)
  const firstDayWeekday = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).getDay();
  }, [viewYear, viewMonth]);

  // Selected date components
  const selectedParts = useMemo(() => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [y, m, d] = value.split("-").map(Number);
    return { year: y, month: m - 1, day: d };
  }, [value]);

  // Formatted display text
  const displayFormattedDate = useMemo(() => {
    if (!value || !selectedParts) return "";
    const dateObj = new Date(selectedParts.year, selectedParts.month, selectedParts.day);
    const formatted = dateObj.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return `${formatted} (${value})`;
  }, [value, selectedParts]);

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const newDateStr = `${viewYear}-${formattedMonth}-${formattedDay}`;
    onChange(newDateStr);
    setIsOpen(false);
    setViewMode("days");
  };

  const handleSelectMonth = (monthIndex: number) => {
    setViewMonth(monthIndex);
    setViewMode("days");
  };

  const handleSelectYear = (year: number) => {
    setViewYear(year);
    setViewMode("months");
  };

  const handlePrev = () => {
    if (viewMode === "days") {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear((y) => y - 1);
      } else {
        setViewMonth((m) => m - 1);
      }
    } else if (viewMode === "years") {
      setDecadeStart((d) => d - 12);
    } else if (viewMode === "months") {
      setViewYear((y) => y - 1);
    }
  };

  const handleNext = () => {
    if (viewMode === "days") {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear((y) => y + 1);
      } else {
        setViewMonth((m) => m + 1);
      }
    } else if (viewMode === "years") {
      setDecadeStart((d) => d + 12);
    } else if (viewMode === "months") {
      setViewYear((y) => y + 1);
    }
  };

  return (
    <div className={`relative flex flex-col gap-1 ${className}`} ref={containerRef} dir="rtl">
      {label && (
        <label className="text-xs font-bold text-foreground">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      {/* Main Trigger Input Button */}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen((v) => !v);
              setViewMode("days");
            }
          }}
          className={`flex h-11 w-full items-center justify-between rounded-xl border px-3.5 text-xs text-right transition-all shadow-xs outline-none ${
            error
              ? "border-danger bg-danger/5 text-danger"
              : isOpen
              ? "border-primary ring-2 ring-primary/20 bg-background text-foreground"
              : "border-input bg-background hover:border-primary/50 text-foreground"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CalendarIcon className={`w-4 h-4 shrink-0 ${value ? "text-primary" : "text-muted-foreground opacity-60"}`} />
            {value ? (
              <span className="font-bold text-foreground truncate">{displayFormattedDate}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {value && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                title="مسح التاريخ"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
              تقويم
            </span>
          </div>
        </button>
      </div>

      {error && <p className="text-[11px] font-bold text-danger mt-0.5">{error}</p>}

      {/* =========================================================
          Ultra-Compact Custom Calendar Dialog (No native select popups!)
          ========================================================= */}
      {isOpen && (
        <div className="absolute top-full right-0 z-[100] mt-1.5 w-72 sm:w-80 rounded-2xl border border-border bg-card/95 backdrop-blur-xl p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header Navigation & Mode Switching */}
          <div className="flex items-center justify-between gap-1 mb-2.5 border-b border-border/60 pb-2">
            <button
              type="button"
              onClick={handlePrev}
              className="grid h-7 w-7 place-items-center rounded-lg bg-muted/60 hover:bg-accent text-foreground transition-colors"
              title="السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Clickable Month & Year Header for Fast Interactive Switching */}
            <div className="flex items-center gap-1.5">
              {viewMode === "days" && (
                <>
                  <button
                    type="button"
                    onClick={() => setViewMode("months")}
                    className="px-2.5 py-1 rounded-lg hover:bg-accent font-extrabold text-xs text-foreground transition-colors"
                  >
                    {ARABIC_MONTHS[viewMonth]}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("years")}
                    className="px-2.5 py-1 rounded-lg hover:bg-accent font-extrabold text-xs text-primary transition-colors tabular-nums"
                  >
                    {viewYear} مـ
                  </button>
                </>
              )}

              {viewMode === "months" && (
                <button
                  type="button"
                  onClick={() => setViewMode("years")}
                  className="px-3 py-1 rounded-lg bg-primary/10 text-primary font-black text-xs transition-colors tabular-nums"
                >
                  اختر الشهر لعام {viewYear} مـ
                </button>
              )}

              {viewMode === "years" && (
                <span className="px-2 py-1 font-black text-xs text-primary tabular-nums">
                  {decadeStart} - {decadeStart + 11} مـ
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="grid h-7 w-7 place-items-center rounded-lg bg-muted/60 hover:bg-accent text-foreground transition-colors"
              title="التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* VIEW 1: Days Grid */}
          {viewMode === "days" && (
            <div>
              {/* Weekday Names */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {ARABIC_WEEKDAYS.map((wd, i) => (
                  <span key={i} className="text-[11px] font-extrabold text-muted-foreground py-0.5">
                    {wd}
                  </span>
                ))}
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty leading padding slots */}
                {Array.from({ length: firstDayWeekday }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-7 w-7" />
                ))}

                {/* Days in Month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSelected =
                    selectedParts &&
                    selectedParts.year === viewYear &&
                    selectedParts.month === viewMonth &&
                    selectedParts.day === dayNum;

                  const isToday =
                    new Date().getFullYear() === viewYear &&
                    new Date().getMonth() === viewMonth &&
                    new Date().getDate() === dayNum;

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => handleSelectDay(dayNum)}
                      className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm font-black scale-105"
                          : isToday
                          ? "border border-primary text-primary font-black bg-primary/5 hover:bg-primary/20"
                          : "hover:bg-accent text-foreground"
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: 12-Months Inline Grid */}
          {viewMode === "months" && (
            <div className="grid grid-cols-3 gap-1.5 py-1">
              {ARABIC_MONTHS.map((m, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectMonth(idx)}
                  className={`p-2 rounded-xl text-xs font-bold transition-all ${
                    viewMonth === idx
                      ? "bg-primary text-primary-foreground font-black shadow-sm"
                      : "bg-muted/40 hover:bg-accent text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* VIEW 3: 12-Years Decade Inline Grid */}
          {viewMode === "years" && (
            <div className="grid grid-cols-3 gap-1.5 py-1">
              {Array.from({ length: 12 }).map((_, i) => {
                const yearNum = decadeStart + i;
                const isSelected = viewYear === yearNum;
                return (
                  <button
                    key={yearNum}
                    type="button"
                    onClick={() => handleSelectYear(yearNum)}
                    className={`p-2 rounded-xl text-xs font-bold tabular-nums transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-black shadow-sm"
                        : "bg-muted/40 hover:bg-accent text-foreground"
                    }`}
                  >
                    {yearNum}
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer Quick Shortcuts */}
          <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const str = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                onChange(str);
                setIsOpen(false);
              }}
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
            >
              <Clock className="w-3 h-3" />
              <span>اليوم</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-muted-foreground hover:text-foreground"
            >
              إغلاق
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
