import React, { useEffect } from "react";
import { X, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  subtitle?: string;
  icon?: LucideIcon | React.ReactNode;
  tone?: "primary" | "danger" | "warning" | "success" | "amber" | "purple" | "info";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const TONE_STYLES = {
  primary: {
    headerBg: "bg-gradient-to-r from-primary/15 via-primary/5 to-transparent",
    iconBg: "bg-primary/20 text-primary border-primary/30",
    badge: "border-primary/20 text-primary",
  },
  danger: {
    headerBg: "bg-gradient-to-r from-destructive/15 via-destructive/5 to-transparent",
    iconBg: "bg-destructive/20 text-destructive border-destructive/30",
    badge: "border-destructive/20 text-destructive",
  },
  warning: {
    headerBg: "bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent",
    iconBg: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
    badge: "border-amber-500/20 text-amber-600 dark:text-amber-400",
  },
  amber: {
    headerBg: "bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent",
    iconBg: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
    badge: "border-amber-500/20 text-amber-600 dark:text-amber-400",
  },
  success: {
    headerBg: "bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent",
    iconBg: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    badge: "border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  },
  purple: {
    headerBg: "bg-gradient-to-r from-purple-500/15 via-purple-500/5 to-transparent",
    iconBg: "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30",
    badge: "border-purple-500/20 text-purple-600 dark:text-purple-400",
  },
  info: {
    headerBg: "bg-gradient-to-r from-sky-500/15 via-sky-500/5 to-transparent",
    iconBg: "bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30",
    badge: "border-sky-500/20 text-sky-600 dark:text-sky-400",
  },
};

const MAX_WIDTHS: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  full: "max-w-[96vw]",
};

export function AdminModal({
  isOpen,
  onClose,
  title,
  description,
  subtitle,
  icon,
  tone = "primary",
  maxWidth,
  size,
  children,
  footer,
  className,
}: AdminModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    // Lock body scroll while modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentTone = TONE_STYLES[tone] || TONE_STYLES.primary;
  const effectiveDescription = description || subtitle;
  const widthKey = (maxWidth || size || "lg") as string;
  const widthClass = MAX_WIDTHS[widthKey] || "max-w-lg";

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return (
        <div
          className={cn(
            "h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs transition-transform hover:scale-105",
            currentTone.iconBg
          )}
        >
          {icon}
        </div>
      );
    }
    const IconComponent = icon as LucideIcon;
    return (
      <div
        className={cn(
          "h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs transition-transform hover:scale-105",
          currentTone.iconBg
        )}
      >
        <IconComponent className="h-5 w-5" />
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/70 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className={cn(
          "bg-card/98 dark:bg-card/95 border border-border/80 shadow-2xl rounded-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-border/50",
          widthClass,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div
          className={cn(
            "p-5 sm:p-6 border-b border-border/70 flex items-center justify-between shrink-0 relative",
            currentTone.headerBg
          )}
        >
          <div className="flex items-center gap-3.5 min-w-0 pr-1">
            {renderIcon()}
            <div className="min-w-0">
              <h3 className="font-black text-base sm:text-lg text-foreground tracking-tight truncate">
                {title}
              </h3>
              {effectiveDescription && (
                <p className="text-xs text-muted-foreground font-bold mt-0.5 leading-relaxed line-clamp-2">
                  {effectiveDescription}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center transition-all active:scale-95 shrink-0 ms-2 cursor-pointer shadow-2xs"
            title="إغلاق النافذة (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {children}
        </div>

        {/* Sticky Footer */}
        {footer && (
          <div className="p-4 sm:p-5 border-t border-border/70 bg-muted/20 backdrop-blur-xs flex items-center justify-end gap-2.5 shrink-0 flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
