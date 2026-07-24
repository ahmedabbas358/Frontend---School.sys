import React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ArrowDownRight, AlertCircle, CheckCircle2, Clock, XCircle, FileText, Wallet, CreditCard, Filter, Calendar } from "lucide-react";
import { Badge } from "./app-shell";

export function FinancialCard({ 
  title, 
  value, 
  currency = '', 
  trend, 
  icon: Icon, 
  colorClass 
}: { 
  title: string; 
  value: number; 
  currency?: string; 
  trend?: { value: number; isPositive: boolean; label: string };
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}) {
  const isPrimary = colorClass.includes("primary");
  const isSuccess = colorClass.includes("success") || colorClass.includes("emerald");
  const isDanger = colorClass.includes("danger") || colorClass.includes("rose");
  const isWarning = colorClass.includes("warning") || colorClass.includes("amber");

  const badgeBg = isPrimary ? "bg-primary/10 text-primary" : 
                  isSuccess ? "bg-emerald-500/10 text-emerald-600" : 
                  isDanger ? "bg-rose-500/10 text-rose-600" : 
                  isWarning ? "bg-amber-500/10 text-amber-600" : 
                  "bg-muted text-muted-foreground";

  const numColor = isPrimary ? "text-primary" : 
                   isSuccess ? "text-emerald-600" : 
                   isDanger ? "text-rose-600" : 
                   isWarning ? "text-amber-600" : 
                   "text-foreground";

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between h-full min-h-[110px]">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-xs sm:text-sm font-bold text-muted-foreground leading-tight line-clamp-2">{title}</h3>
        <div className={`p-2.5 rounded-xl shrink-0 ${badgeBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-1 mt-auto">
        <div className={`text-xl sm:text-2xl font-black tabular-nums whitespace-nowrap ${numColor}`}>
          {value.toLocaleString()} {currency && <span className="text-xs sm:text-sm font-extrabold text-muted-foreground mr-1">{currency}</span>}
        </div>
        {trend && (
          <span className={`text-xs font-bold flex items-center gap-0.5 shrink-0 ${trend.isPositive ? "text-emerald-600" : "text-rose-600"}`}>
            {trend.isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}

export function FinancialSummaryCard({
  title,
  total,
  paid,
  currency,
  icon: Icon = Wallet
}: {
  title: string;
  total: number;
  paid: number;
  currency: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const percentage = total > 0 ? (paid / total) * 100 : 0;
  const due = Math.max(0, total - paid);

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="font-bold">{title}</h3>
        </div>
        <span className="text-xl font-black">{total.toLocaleString()} {currency}</span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm font-bold">
          <span className="text-success">المحصل: {paid.toLocaleString()} {currency}</span>
          <span className="text-danger">المتبقي: {due.toLocaleString()} {currency}</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-success transition-all" style={{ width: `${Math.min(percentage, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

export function AmountDisplay({ amount, currency, type = "neutral", showSign = false }: { amount: number; currency: string; type?: "positive" | "negative" | "neutral"; showSign?: boolean }) {
  const isPositive = type === "positive";
  const isNegative = type === "negative";
  const color = isPositive ? "text-success" : isNegative ? "text-danger" : "text-foreground";
  const sign = showSign ? (isPositive ? "+" : isNegative ? "-" : "") : "";
  
  return (
    <span className={`font-black tabular-nums ${color}`}>
      {sign}{amount.toLocaleString()} {currency}
    </span>
  );
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  if (status === 'paid' || status === 'completed' || status === 'approved') return <Badge tone="success">{label || 'مكتمل'}</Badge>;
  if (status === 'partial' || status === 'pending') return <Badge tone="primary">{label || 'جزئي / معلق'}</Badge>;
  if (status === 'overdue' || status === 'rejected' || status === 'cancelled' || status === 'issued') return <Badge tone="danger">{label || 'متأخر / غير مدفوع'}</Badge>;
  if (status === 'draft') return <Badge tone="neutral">{label || 'مسودة'}</Badge>;
  return <Badge tone="neutral">{label || status}</Badge>;
}

export function FinancialWorkflowBadge({ status }: { status: "draft" | "pending_review" | "approved" | "paid" | "rejected" | "cancelled" }) {
  switch(status) {
    case "draft": return <Badge tone="neutral"><FileText className="w-3 h-3 ml-1" /> مسودة</Badge>;
    case "pending_review": return <Badge tone="warning"><Clock className="w-3 h-3 ml-1" /> قيد المراجعة</Badge>;
    case "approved": return <Badge tone="primary"><CheckCircle2 className="w-3 h-3 ml-1" /> معتمد</Badge>;
    case "paid": return <Badge tone="success"><CheckCircle2 className="w-3 h-3 ml-1" /> تم الدفع/التحصيل</Badge>;
    case "rejected": return <Badge tone="danger"><XCircle className="w-3 h-3 ml-1" /> مرفوض</Badge>;
    case "cancelled": return <Badge tone="danger"><XCircle className="w-3 h-3 ml-1" /> ملغي</Badge>;
    default: return null;
  }
}

export function PaymentMethodBadge({ method }: { method: string }) {
  switch (method) {
    case "cash": return <Badge tone="success">نقدي</Badge>;
    case "bank_transfer": return <Badge tone="primary">حوالة بنكية</Badge>;
    case "card": return <Badge tone="warning">بطاقة (مدى/فيزا)</Badge>;
    case "cheque": return <Badge tone="neutral">شيك</Badge>;
    default: return <Badge tone="neutral">{method}</Badge>;
  }
}

export interface FinancialTransaction {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  amount: number;
  type: "income" | "expense" | "discount" | "neutral";
  currency: string;
  method?: string;
  link?: string;
}

export function FinancialTimeline({ transactions }: { transactions: FinancialTransaction[] }) {
  if (transactions.length === 0) {
    return <EmptyState title="لا توجد حركات مالية" description="لم يتم تسجيل أي حركات مالية حتى الآن." icon={FileText} />;
  }

  return (
    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
      {transactions.map(t => {
        let typeColor = "text-muted-foreground bg-muted";
        let typeBorder = "border-border/50";
        let sign = "";
        let colorClass = "text-muted-foreground";
        
        if (t.type === "income") {
          typeColor = "text-success bg-success/10";
          typeBorder = "border-success/30 hover:border-success/60";
          sign = "+";
          colorClass = "text-success";
        } else if (t.type === "expense") {
          typeColor = "text-danger bg-danger/10";
          typeBorder = "border-danger/30 hover:border-danger/60";
          sign = "-";
          colorClass = "text-danger";
        } else if (t.type === "discount") {
          typeColor = "text-warning bg-warning/10";
          typeBorder = "border-warning/30 hover:border-warning/60";
          sign = "-";
          colorClass = "text-warning";
        }

        return (
          <div key={t.id} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}>
            {/* Timeline dot */}
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${typeColor} z-10`}>
              {t.type === "income" ? <ArrowDownRight className="w-5 h-5" /> : 
               t.type === "expense" ? <ArrowUpRight className="w-5 h-5" /> :
               t.type === "discount" ? <CreditCard className="w-5 h-5" /> :
               <FileText className="w-5 h-5" />}
            </div>
            
            {/* Card */}
            <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border bg-card shadow-sm transition-all ${typeBorder}`}>
              <div className="flex justify-between items-start mb-1">
                {t.link ? (
                  <Link to={t.link} className="font-bold text-sm text-foreground hover:text-primary transition-colors hover:underline">
                    {t.title}
                  </Link>
                ) : (
                  <p className="font-bold text-sm">{t.title}</p>
                )}
                <span className={`font-black tabular-nums text-sm ${colorClass}`}>
                  {sign}{t.amount.toLocaleString()} {t.currency}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t.date} • {t.subtitle}</p>
              {t.method && (
                <div className="mt-2">
                  <PaymentMethodBadge method={t.method} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Legacy for backward compatibility
export function TransactionTimeline({ transactions }: { transactions: FinancialTransaction[] }) {
  return <FinancialTimeline transactions={transactions} />;
}

export function MiniBarChart({ data, height = 60 }: { data: number[]; height?: number }) {
  const max = Math.max(...data, 1);
  
  return (
    <div className="flex items-end gap-1 w-full" style={{ height }}>
      {data.map((value, i) => (
        <div 
          key={i} 
          className="flex-1 bg-primary/20 rounded-t-sm hover:bg-primary transition-colors relative group"
          style={{ height: `${(value / max) * 100}%` }}
        >
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 shadow-sm border border-border">
            {value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProgressRing({ value, max, size = 120, strokeWidth = 12, colorClass = "text-primary" }: { value: number; max: number; size?: number; strokeWidth?: number; colorClass?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-muted/30"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={colorClass}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl font-black">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}

export function SmartAlert({ title, description, actionLabel, onAction, type = "warning" }: { title: string; description: string; actionLabel?: string; onAction?: () => void; type?: "warning" | "danger" | "info" }) {
  const bg = type === "warning" ? "bg-warning/10 border-warning/30" : type === "danger" ? "bg-danger/10 border-danger/30" : "bg-primary/10 border-primary/30";
  const textColor = type === "warning" ? "text-warning" : type === "danger" ? "text-danger" : "text-primary";
  const iconColor = type === "warning" ? "text-warning" : type === "danger" ? "text-danger" : "text-primary";
  
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${bg}`}>
      <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${iconColor}`} />
      <div className="flex-1">
        <h4 className={`text-sm font-bold ${textColor}`}>{title}</h4>
        <p className={`text-sm mt-1 opacity-90 ${textColor}`}>{description}</p>
        {actionLabel && onAction && (
          <button 
            onClick={onAction}
            className={`mt-3 text-xs font-bold px-3 py-1.5 rounded-md border transition-colors ${type === 'warning' ? 'border-warning/50 hover:bg-warning/20' : type === 'danger' ? 'border-danger/50 hover:bg-danger/20' : 'border-primary/50 hover:bg-primary/20'} ${textColor}`}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title, description, icon: Icon, actionLabel, onAction }: { title: string; description: string; icon: React.ComponentType<{ className?: string }>; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border/60 rounded-2xl bg-muted/20">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function FilterBar({ children, onClear }: { children: React.ReactNode; onClear?: () => void }) {
  return (
    <div className="bg-card border border-border/60 rounded-2xl p-3.5 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex-1 w-full">
        {children}
      </div>
      {onClear && (
        <button 
          onClick={onClear}
          className="text-xs font-extrabold text-rose-600 hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl transition-all shrink-0 self-end md:self-center"
        >
          إعادة ضبط التصفية ✕
        </button>
      )}
    </div>
  );
}

export function AcademicYearSelector({ value, onChange, years }: { value: string; onChange: (val: string) => void; years: { id: string; name: string }[] }) {
  return (
    <div className="flex items-center gap-2">
      <div className="p-1.5 bg-primary/10 text-primary rounded-md">
        <Calendar className="w-4 h-4" />
      </div>
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer pr-1"
      >
        <option value="all">جميع السنوات</option>
        {years.map(y => (
          <option key={y.id} value={y.id}>{y.name}</option>
        ))}
      </select>
    </div>
  );
}
