import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Printer, Download, TrendingUp, TrendingDown, Scale, Search, Filter, ChevronDown, ChevronUp, BarChart3, Eye, EyeOff, Layers, RefreshCw, AlertTriangle, CheckCircle2, ArrowUpDown, Calendar, FileSpreadsheet, Info } from "lucide-react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useState, useMemo, useCallback } from "react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { FinancialCard, FilterBar, AcademicYearSelector } from "@/components/financial-components";
import { useLedger } from "@/hooks/useLedger";

export const Route = createFileRoute("/finance/trial-balance")({
  component: TrialBalance,
});

function TrialBalance() {
  const { currency, allAcademicYears, currentAcademicYearId, allAccounts, allJournalEntries, allJournalLines } = useGlobalStore();
  const { getTrialBalance, postedLines } = useLedger();
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [showZeroBalances, setShowZeroBalances] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState(currentAcademicYearId ?? "");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["asset", "liability", "equity", "revenue", "expense"]));
  const [sortField, setSortField] = useState<"code" | "name" | "balance">("code");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterType, setFilterType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [showDetails, setShowDetails] = useState(false);

  const trialBalance = useMemo(() => {
    let tb = getTrialBalance();
    if (!showZeroBalances) {
      tb = tb.filter((acc: any) => acc.balance !== 0 || acc.isGroupAccount);
    }
    if (searchTerm) {
      tb = tb.filter((acc: any) =>
        acc.name?.includes(searchTerm) || acc.code?.includes(searchTerm)
      );
    }
    if (filterType !== "all") {
      tb = tb.filter((acc: any) => acc.type === filterType);
    }
    // Sort
    tb.sort((a: any, b: any) => {
      let va = a[sortField], vb = b[sortField];
      if (sortField === "balance") {
        va = Math.abs(a.balance);
        vb = Math.abs(b.balance);
      }
      if (typeof va === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc" ? va - vb : vb - va;
    });
    return tb;
  }, [getTrialBalance, showZeroBalances, postedLines, searchTerm, filterType, sortField, sortDir]);

  const totals = useMemo(() => {
    const detailAccounts = trialBalance.filter((acc: any) => !acc.isGroupAccount);
    const debitTotal = detailAccounts.filter((acc: any) => acc.isDebit).reduce((sum: number, acc: any) => sum + acc.balance, 0);
    const creditTotal = detailAccounts.filter((acc: any) => !acc.isDebit).reduce((sum: number, acc: any) => sum + acc.balance, 0);
    const totalAccounts = detailAccounts.length;
    const debitAccounts = detailAccounts.filter((acc: any) => acc.isDebit && acc.balance !== 0).length;
    const creditAccounts = detailAccounts.filter((acc: any) => !acc.isDebit && acc.balance !== 0).length;
    const zeroAccounts = detailAccounts.filter((acc: any) => acc.balance === 0).length;
    return { debit: debitTotal, credit: creditTotal, totalAccounts, debitAccounts, creditAccounts, zeroAccounts };
  }, [trialBalance]);

  const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01;

  // Group by type for cards view
  const groupedByType = useMemo(() => {
    const groups: Record<string, any[]> = { asset: [], liability: [], equity: [], revenue: [], expense: [] };
    trialBalance.filter((a: any) => !a.isGroupAccount).forEach((acc: any) => {
      if (groups[acc.type]) groups[acc.type].push(acc);
    });
    return groups;
  }, [trialBalance]);

  const toggleGroup = (type: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const toggleSort = (field: "code" | "name" | "balance") => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const typeLabels: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    asset: { label: "الأصول", color: "text-blue-600", bg: "bg-blue-500/10", icon: TrendingUp },
    liability: { label: "الخصوم", color: "text-rose-600", bg: "bg-rose-500/10", icon: TrendingDown },
    equity: { label: "حقوق الملكية", color: "text-purple-600", bg: "bg-purple-500/10", icon: Layers },
    revenue: { label: "الإيرادات", color: "text-emerald-600", bg: "bg-emerald-500/10", icon: TrendingUp },
    expense: { label: "المصروفات", color: "text-orange-600", bg: "bg-orange-500/10", icon: TrendingDown },
  };

  const printTemplates: PrintTemplate[] = [
    {
      id: "trial-balance-report",
      name: "ميزان المراجعة بالمجاميع والأرصدة",
      category: "التقارير المالية",
      type: "table",
      columns: [
        { label: "رقم الحساب", key: "code" },
        { label: "اسم الحساب", key: "name" },
        { label: "التصنيف", key: "typeName" },
        { label: "الرصيد المدين", key: "debitBalance" },
        { label: "الرصيد الدائن", key: "creditBalance" },
      ]
    }
  ];

  const printData = trialBalance.map((acc: any) => ({
    ...acc,
    typeName: typeLabels[acc.type]?.label || acc.type,
    debitBalance: acc.isDebit && acc.balance !== 0 ? acc.balance.toLocaleString() : "-",
    creditBalance: !acc.isDebit && acc.balance !== 0 ? acc.balance.toLocaleString() : "-",
  }));

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المالية", to: "/finance/dashboard" },
        { label: "ميزان المراجعة" },
      ]}
      actions={
        <div className="flex gap-2">
          <button onClick={() => setIsPrintOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm hover:bg-accent font-bold transition-all">
            <Printer className="h-4 w-4" /> طباعة
          </button>
          <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm hover:bg-accent font-bold transition-all">
            <Download className="h-4 w-4" /> تصدير
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        
        {/* Header with Balance Status */}
        <div className={`rounded-2xl border-2 p-6 transition-all ${isBalanced ? 'border-emerald-500/30 bg-gradient-to-bl from-emerald-500/5 to-transparent' : 'border-rose-500/30 bg-gradient-to-bl from-rose-500/5 to-transparent'}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl ${isBalanced ? 'bg-emerald-500/10' : 'bg-rose-500/10'} flex items-center justify-center`}>
                <Scale className={`w-7 h-7 ${isBalanced ? 'text-emerald-600' : 'text-rose-600'}`} />
              </div>
              <div>
                <h2 className="text-2xl font-black">ميزان المراجعة (Trial Balance)</h2>
                <p className="text-sm text-muted-foreground font-bold mt-0.5">
                  عرض الأرصدة المدينة والدائنة لجميع الحسابات
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isBalanced ? (
                <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-5 py-2.5 rounded-xl font-black text-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6" /> متوازن ✅
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-rose-500/10 text-rose-700 dark:text-rose-400 px-5 py-2.5 rounded-xl font-black text-lg border border-rose-500/20">
                  <AlertTriangle className="w-6 h-6" /> غير متوازن ❌
                  <span className="text-sm font-bold">(فارق {Math.abs(totals.debit - totals.credit).toLocaleString()} {currency})</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <FinancialCard 
            title="إجمالي مدين" 
            value={totals.debit} 
            currency={currency} 
            icon={TrendingDown} 
            colorClass="text-rose-600 bg-rose-500" 
          />
          <FinancialCard 
            title="إجمالي دائن" 
            value={totals.credit} 
            currency={currency} 
            icon={TrendingUp} 
            colorClass="text-emerald-600 bg-emerald-500" 
          />
          <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col justify-center items-center gap-1">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-bold text-muted-foreground">عدد الحسابات النشطة</span>
            <span className="text-2xl font-black">{totals.debitAccounts + totals.creditAccounts}</span>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col justify-center items-center gap-1">
            <Info className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold text-muted-foreground">حسابات مدينة</span>
            <span className="text-2xl font-black text-rose-600">{totals.debitAccounts}</span>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col justify-center items-center gap-1">
            <Info className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-bold text-muted-foreground">حسابات دائنة</span>
            <span className="text-2xl font-black text-emerald-600">{totals.creditAccounts}</span>
          </div>
        </div>

        {/* Advanced Filters */}
        <FilterBar>
          <div className="flex flex-wrap items-center gap-3 w-full">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="ابحث برمز أو اسم الحساب..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 h-10 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-bold"
              />
            </div>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-bold min-w-[140px]"
            >
              <option value="all">جميع التصنيفات</option>
              <option value="asset">الأصول</option>
              <option value="liability">الخصوم</option>
              <option value="equity">حقوق الملكية</option>
              <option value="revenue">الإيرادات</option>
              <option value="expense">المصروفات</option>
            </select>
            <label className="flex items-center gap-2 text-sm font-bold cursor-pointer bg-background border border-border px-3 py-2 rounded-xl hover:bg-accent transition-all">
              <input 
                type="checkbox" 
                checked={showZeroBalances} 
                onChange={(e) => setShowZeroBalances(e.target.checked)} 
                className="rounded border-input text-primary w-4 h-4" 
              />
              إظهار الصفرية
            </label>
            <div className="flex items-center gap-1 bg-background border border-border rounded-xl overflow-hidden">
              <button 
                onClick={() => setViewMode("table")} 
                className={`px-3 py-2 text-sm font-bold transition-all ${viewMode === "table" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("cards")} 
                className={`px-3 py-2 text-sm font-bold transition-all ${viewMode === "cards" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>
          </div>
        </FilterBar>

        {/* Table View */}
        {viewMode === "table" && (
          <PageCard>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-right py-3 px-4 font-black">
                      <button onClick={() => toggleSort("code")} className="flex items-center gap-1 hover:text-primary transition-colors">
                        رمز الحساب <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    </th>
                    <th className="text-right py-3 px-4 font-black">
                      <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-primary transition-colors">
                        اسم الحساب <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    </th>
                    <th className="text-right py-3 px-4 font-black">التصنيف</th>
                    <th className="text-left py-3 px-4 font-black">
                      <button onClick={() => toggleSort("balance")} className="flex items-center gap-1 hover:text-primary transition-colors">
                        رصيد مدين <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-black">
                      <button onClick={() => toggleSort("balance")} className="flex items-center gap-1 hover:text-primary transition-colors">
                        رصيد دائن <ArrowUpDown className="w-3.5 h-3.5" />
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 font-black">النسبة</th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalance.map((acc: any, i: number) => {
                    const maxBalance = Math.max(totals.debit, totals.credit) || 1;
                    const percentage = ((Math.abs(acc.balance) / maxBalance) * 100).toFixed(1);
                    return (
                      <tr 
                        key={acc.id || i} 
                        className={`border-b border-border/30 transition-all hover:bg-accent/30 ${acc.isGroupAccount ? 'bg-muted/40' : ''}`}
                      >
                        <td className="py-3 px-4">
                          <span className={`font-mono text-sm ${acc.isGroupAccount ? 'font-black text-primary text-base' : 'font-bold text-muted-foreground'}`}>
                            {acc.code}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div 
                            style={{ paddingRight: `${(acc.level || 1) * 1.2 - 1.2}rem` }} 
                            className={acc.isGroupAccount ? 'font-black text-base' : 'font-bold'}
                          >
                            {acc.name}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${typeLabels[acc.type]?.bg || ''} ${typeLabels[acc.type]?.color || ''}`}>
                            {typeLabels[acc.type]?.label || acc.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`tabular-nums ${acc.isGroupAccount ? 'font-black text-base' : 'font-bold'}`}>
                            {acc.isDebit && acc.balance !== 0 
                              ? <span className="text-rose-600">{acc.balance.toLocaleString()} {currency}</span> 
                              : <span className="text-muted-foreground/40">-</span>}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`tabular-nums ${acc.isGroupAccount ? 'font-black text-base' : 'font-bold'}`}>
                            {!acc.isDebit && acc.balance !== 0 
                              ? <span className="text-emerald-600">{acc.balance.toLocaleString()} {currency}</span> 
                              : <span className="text-muted-foreground/40">-</span>}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {!acc.isGroupAccount && acc.balance !== 0 && (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${acc.isDebit ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(Number(percentage), 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-muted-foreground tabular-nums">{percentage}%</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-primary/30 bg-primary/5">
                    <td colSpan={3} className="py-4 px-4 font-black text-lg text-primary">الإجمالي</td>
                    <td className="py-4 px-4">
                      <span className="font-black text-lg text-rose-600 tabular-nums">{totals.debit.toLocaleString()} {currency}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-black text-lg text-emerald-600 tabular-nums">{totals.credit.toLocaleString()} {currency}</span>
                    </td>
                    <td className="py-4 px-4">
                      {isBalanced ? (
                        <Badge tone="success" className="text-sm font-black">متوازن</Badge>
                      ) : (
                        <Badge tone="danger" className="text-sm font-black">فارق: {Math.abs(totals.debit - totals.credit).toLocaleString()}</Badge>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </PageCard>
        )}

        {/* Cards View (Grouped by Type) */}
        {viewMode === "cards" && (
          <div className="space-y-4">
            {Object.entries(groupedByType).map(([type, accounts]) => {
              const meta = typeLabels[type];
              if (!meta || accounts.length === 0) return null;
              const groupDebit = accounts.filter(a => a.isDebit).reduce((s: number, a: any) => s + a.balance, 0);
              const groupCredit = accounts.filter(a => !a.isDebit).reduce((s: number, a: any) => s + a.balance, 0);
              const isOpen = expandedGroups.has(type);

              return (
                <div key={type} className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                  <button 
                    onClick={() => toggleGroup(type)}
                    className={`w-full flex justify-between items-center p-5 hover:bg-accent/30 transition-all ${meta.bg}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center`}>
                        <meta.icon className={`w-5 h-5 ${meta.color}`} />
                      </div>
                      <div className="text-right">
                        <h3 className={`font-black text-lg ${meta.color}`}>{meta.label}</h3>
                        <p className="text-xs text-muted-foreground font-bold">{accounts.length} حساب</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-left">
                        <p className="text-xs font-bold text-muted-foreground">مدين</p>
                        <p className="font-black text-rose-600 tabular-nums">{groupDebit.toLocaleString()}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-muted-foreground">دائن</p>
                        <p className="font-black text-emerald-600 tabular-nums">{groupCredit.toLocaleString()}</p>
                      </div>
                      {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-border/50 divide-y divide-border/30">
                      {accounts.map((acc: any, i: number) => (
                        <div key={acc.id || i} className="flex justify-between items-center px-5 py-3 hover:bg-accent/20 transition-all">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-muted-foreground font-bold bg-muted px-2 py-0.5 rounded">{acc.code}</span>
                            <span className="font-bold text-sm">{acc.name}</span>
                          </div>
                          <div className="flex items-center gap-6">
                            <span className={`font-black tabular-nums text-sm ${acc.isDebit ? 'text-rose-600' : 'text-muted-foreground/30'}`}>
                              {acc.isDebit && acc.balance !== 0 ? `${acc.balance.toLocaleString()} ${currency}` : '-'}
                            </span>
                            <span className={`font-black tabular-nums text-sm ${!acc.isDebit ? 'text-emerald-600' : 'text-muted-foreground/30'}`}>
                              {!acc.isDebit && acc.balance !== 0 ? `${acc.balance.toLocaleString()} ${currency}` : '-'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PageCard className="p-5">
            <h4 className="font-black text-base mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> توزيع الأرصدة حسب التصنيف
            </h4>
            <div className="space-y-3">
              {Object.entries(groupedByType).map(([type, accounts]) => {
                const meta = typeLabels[type];
                if (!meta) return null;
                const total = accounts.reduce((s: number, a: any) => s + Math.abs(a.balance), 0);
                const maxTotal = Object.values(groupedByType).reduce((max, accs) => {
                  const t = accs.reduce((s: number, a: any) => s + Math.abs(a.balance), 0);
                  return t > max ? t : max;
                }, 0) || 1;
                const pct = (total / maxTotal * 100).toFixed(0);
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className={`text-xs font-black w-20 text-right ${meta.color}`}>{meta.label}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${meta.bg.replace('/10', '')}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-black tabular-nums w-24 text-left">{total.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </PageCard>
          <PageCard className="p-5">
            <h4 className="font-black text-base mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" /> ملخص سريع
            </h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center p-2.5 bg-muted/30 rounded-lg">
                <span className="font-bold text-muted-foreground">إجمالي الحسابات المسجلة</span>
                <span className="font-black">{allAccounts.length}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-muted/30 rounded-lg">
                <span className="font-bold text-muted-foreground">حسابات بأرصدة نشطة</span>
                <span className="font-black text-primary">{totals.debitAccounts + totals.creditAccounts}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-muted/30 rounded-lg">
                <span className="font-bold text-muted-foreground">حسابات صفرية</span>
                <span className="font-black text-amber-600">{totals.zeroAccounts}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-muted/30 rounded-lg">
                <span className="font-bold text-muted-foreground">فارق الميزان</span>
                <span className={`font-black ${isBalanced ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {Math.abs(totals.debit - totals.credit).toLocaleString()} {currency}
                </span>
              </div>
            </div>
          </PageCard>
        </div>
      </div>

      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="ميزان المراجعة"
        data={printData}
        templates={printTemplates}
      />
    </AppShell>
  );
}
