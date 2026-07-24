import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useMemo, useState } from "react";
import { PieChart, TrendingUp, TrendingDown, Filter, FileText, User, Users, BarChart3, Wallet, CreditCard, Building2, ArrowUpRight, ArrowDownRight, Download, Printer, Calendar, Scale, Layers, Search, ChevronDown, ChevronUp, Info, Target, AlertTriangle, CheckCircle2, ArrowRightLeft } from "lucide-react";
import { FinancialCard, FilterBar, AcademicYearSelector } from "@/components/financial-components";
import { DataTable } from "@/components/data-table";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/finance/reports")({
  component: FinanceReports,
});

function FinanceReports() {
  const { 
    allJournalEntries, allJournalLines, allAccounts, 
    allAcademicYears, currentAcademicYearId, 
    allStudents, allStaff, allPayments, allExpenses, allInvoices,
    currency
  } = useGlobalStore();
  
  const [selectedYear, setSelectedYear] = useState(currentAcademicYearId);
  const [reportType, setReportType] = useState<"income" | "cashflow" | "entity" | "balancesheet" | "aging" | "collection">("income");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [entityType, setEntityType] = useState<"student" | "staff">("student");
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [expandSections, setExpandSections] = useState<Set<string>>(new Set(["revenue", "expense", "operating", "investing"]));

  const toggleSection = (s: string) => {
    setExpandSections(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  const filteredJEs = useMemo(() => {
    let jes = allJournalEntries.filter(je => je.academicYearId === selectedYear && je.status === "posted");
    if (dateRange.from) jes = jes.filter(je => je.date >= dateRange.from);
    if (dateRange.to) jes = jes.filter(je => je.date <= dateRange.to);
    return jes;
  }, [allJournalEntries, selectedYear, dateRange]);

  // ─── Income Statement ─────────────────────────────
  const incomeStatement = useMemo(() => {
    const revenueAccounts: Record<string, { name: string; amount: number }> = {};
    const expenseAccounts: Record<string, { name: string; amount: number }> = {};

    allJournalLines.forEach(jl => {
      if (!filteredJEs.some(je => je.id === jl.journalEntryId)) return;
      const account = allAccounts.find(a => a.id === jl.accountId);
      if (!account) return;

      if (account.type === "revenue") {
        if (!revenueAccounts[jl.accountId]) revenueAccounts[jl.accountId] = { name: account.name, amount: 0 };
        revenueAccounts[jl.accountId].amount += jl.credit - jl.debit;
      }
      if (account.type === "expense") {
        if (!expenseAccounts[jl.accountId]) expenseAccounts[jl.accountId] = { name: account.name, amount: 0 };
        expenseAccounts[jl.accountId].amount += jl.debit - jl.credit;
      }
    });

    const totalRevenue = Object.values(revenueAccounts).reduce((s, a) => s + a.amount, 0);
    const totalExpense = Object.values(expenseAccounts).reduce((s, a) => s + a.amount, 0);

    return {
      revenueItems: Object.entries(revenueAccounts).map(([id, d]) => ({ id, ...d })).sort((a, b) => b.amount - a.amount),
      expenseItems: Object.entries(expenseAccounts).map(([id, d]) => ({ id, ...d })).sort((a, b) => b.amount - a.amount),
      totalRevenue,
      totalExpense,
      netIncome: totalRevenue - totalExpense,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpense) / totalRevenue * 100) : 0,
    };
  }, [allJournalLines, filteredJEs, allAccounts]);

  // ─── Balance Sheet ─────────────────────────────
  const balanceSheet = useMemo(() => {
    const calc = (type: string) => {
      const items: { name: string; amount: number }[] = [];
      allAccounts.filter(a => a.type === type && a.isActive !== false).forEach(account => {
        let balance = 0;
        allJournalLines.forEach(jl => {
          if (jl.accountId === account.id && filteredJEs.some(je => je.id === jl.journalEntryId)) {
            if (type === "asset") balance += jl.debit - jl.credit;
            else balance += jl.credit - jl.debit;
          }
        });
        if (balance !== 0) items.push({ name: account.name, amount: balance });
      });
      return { items: items.sort((a, b) => b.amount - a.amount), total: items.reduce((s, i) => s + i.amount, 0) };
    };

    const assets = calc("asset");
    const liabilities = calc("liability");
    const equity = calc("equity");

    return { assets, liabilities, equity, isBalanced: Math.abs(assets.total - (liabilities.total + equity.total)) < 0.01 };
  }, [allAccounts, allJournalLines, filteredJEs]);

  // ─── Cash Flow ─────────────────────────────
  const cashFlow = useMemo(() => {
    let operatingIn = 0, operatingOut = 0;
    let investingIn = 0, investingOut = 0;

    allJournalLines.forEach(jl => {
      if (!filteredJEs.some(je => je.id === jl.journalEntryId)) return;
      // Cash and bank accounts
      if (jl.accountId === "ACC-1101" || jl.accountId === "ACC-1102") {
        operatingIn += jl.debit;
        operatingOut += jl.credit;
      }
    });

    return {
      operatingIn, operatingOut, netOperating: operatingIn - operatingOut,
      investingIn, investingOut, netInvesting: investingIn - investingOut,
      netCash: (operatingIn - operatingOut) + (investingIn - investingOut),
    };
  }, [allJournalLines, filteredJEs]);

  // ─── Entity Transactions ─────────────────────────────
  const entityTransactions = useMemo(() => {
    if (!selectedEntityId) return [];
    return allJournalLines
      .filter(jl => jl.referenceId === selectedEntityId && filteredJEs.some(je => je.id === jl.journalEntryId))
      .map(jl => {
        const je = filteredJEs.find(j => j.id === jl.journalEntryId);
        const account = allAccounts.find(a => a.id === jl.accountId);
        return { id: jl.id, date: je?.date || "", description: je?.description || "", accountName: account?.name || "", debit: jl.debit, credit: jl.credit };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allJournalLines, filteredJEs, selectedEntityId, allAccounts]);

  // ─── Collection Rate ─────────────────────────────
  const collectionStats = useMemo(() => {
    const totalInvoiced = allInvoices.reduce((s, inv) => s + (inv.amount || 0), 0);
    const totalPaid = allPayments.reduce((s, p) => s + p.amount, 0);
    const totalExpensed = allExpenses.reduce((s, e) => s + e.amount, 0);
    const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced * 100) : 0;
    const outstanding = totalInvoiced - totalPaid;
    return { totalInvoiced, totalPaid, totalExpensed, collectionRate, outstanding };
  }, [allInvoices, allPayments, allExpenses]);

  const entityBalance = useMemo(() => {
    const totalDebit = entityTransactions.reduce((s, t) => s + t.debit, 0);
    const totalCredit = entityTransactions.reduce((s, t) => s + t.credit, 0);
    return { debit: totalDebit, credit: totalCredit, net: totalDebit - totalCredit };
  }, [entityTransactions]);

  const reportTabs = [
    { id: "income", label: "قائمة الدخل", icon: TrendingUp },
    { id: "balancesheet", label: "المركز المالي", icon: Scale },
    { id: "cashflow", label: "التدفقات النقدية", icon: ArrowRightLeft },
    { id: "collection", label: "التحصيل والأداء", icon: Target },
    { id: "entity", label: "كشوف الكيانات", icon: Users },
  ];

  const printTemplates: PrintTemplate[] = [
    { id: "income-statement", name: "قائمة الدخل", category: "التقارير المالية", type: "table", columns: [
      { label: "البيان", key: "name" }, { label: "المبلغ", key: "amount" },
    ] },
  ];

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance/dashboard" },
        { label: "التقارير المالية" },
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
        
        {/* Filters Bar */}
        <FilterBar>
          <div className="flex flex-wrap items-center gap-3 w-full">
            <AcademicYearSelector value={selectedYear ?? ''} onChange={setSelectedYear} years={allAcademicYears} />
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <input type="date" value={dateRange.from} onChange={(e) => setDateRange(p => ({...p, from: e.target.value}))} className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-bold" placeholder="من" />
              <span className="text-muted-foreground text-sm font-bold">إلى</span>
              <input type="date" value={dateRange.to} onChange={(e) => setDateRange(p => ({...p, to: e.target.value}))} className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-bold" placeholder="إلى" />
            </div>
          </div>
        </FilterBar>

        {/* Report Type Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {reportTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black whitespace-nowrap transition-all ${
                reportType === tab.id 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "bg-card border border-border hover:bg-accent"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Income Statement ─── */}
        {reportType === "income" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FinancialCard title="إجمالي الإيرادات" value={incomeStatement.totalRevenue} currency={currency} icon={TrendingUp} colorClass="text-emerald-600 bg-emerald-500" />
              <FinancialCard title="إجمالي المصروفات" value={incomeStatement.totalExpense} currency={currency} icon={TrendingDown} colorClass="text-rose-600 bg-rose-500" />
              <FinancialCard title="صافي الدخل" value={incomeStatement.netIncome} currency={currency} icon={Wallet} colorClass="text-primary bg-primary" />
              <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col justify-center items-center gap-1">
                <PieChart className={`w-6 h-6 ${incomeStatement.profitMargin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
                <span className="text-xs font-bold text-muted-foreground">هامش الربح</span>
                <span className={`text-2xl font-black ${incomeStatement.profitMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {incomeStatement.profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Section */}
              <PageCard className="p-0 overflow-hidden">
                <button onClick={() => toggleSection("revenue")} className="w-full flex justify-between items-center p-5 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-right">
                      <h3 className="font-black text-lg text-emerald-700 dark:text-emerald-400">الإيرادات</h3>
                      <p className="text-xs text-muted-foreground font-bold">{incomeStatement.revenueItems.length} حساب</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-lg text-emerald-600 tabular-nums">{incomeStatement.totalRevenue.toLocaleString()} {currency}</span>
                    {expandSections.has("revenue") ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>
                {expandSections.has("revenue") && (
                  <div className="divide-y divide-border/30">
                    {incomeStatement.revenueItems.map((item, i) => (
                      <div key={item.id} className="flex justify-between items-center px-5 py-3 hover:bg-accent/20 transition-all">
                        <span className="font-bold text-sm">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(item.amount / (incomeStatement.totalRevenue || 1) * 100)}%` }} />
                          </div>
                          <span className="font-black tabular-nums text-emerald-600 text-sm min-w-[100px] text-left">{item.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                    {incomeStatement.revenueItems.length === 0 && (
                      <div className="py-8 text-center text-muted-foreground font-bold text-sm">لا توجد إيرادات مسجلة</div>
                    )}
                  </div>
                )}
              </PageCard>

              {/* Expense Section */}
              <PageCard className="p-0 overflow-hidden">
                <button onClick={() => toggleSection("expense")} className="w-full flex justify-between items-center p-5 bg-rose-500/5 hover:bg-rose-500/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-rose-600" />
                    </div>
                    <div className="text-right">
                      <h3 className="font-black text-lg text-rose-700 dark:text-rose-400">المصروفات</h3>
                      <p className="text-xs text-muted-foreground font-bold">{incomeStatement.expenseItems.length} حساب</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-lg text-rose-600 tabular-nums">{incomeStatement.totalExpense.toLocaleString()} {currency}</span>
                    {expandSections.has("expense") ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>
                {expandSections.has("expense") && (
                  <div className="divide-y divide-border/30">
                    {incomeStatement.expenseItems.map((item, i) => (
                      <div key={item.id} className="flex justify-between items-center px-5 py-3 hover:bg-accent/20 transition-all">
                        <span className="font-bold text-sm">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(item.amount / (incomeStatement.totalExpense || 1) * 100)}%` }} />
                          </div>
                          <span className="font-black tabular-nums text-rose-600 text-sm min-w-[100px] text-left">{item.amount.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                    {incomeStatement.expenseItems.length === 0 && (
                      <div className="py-8 text-center text-muted-foreground font-bold text-sm">لا توجد مصروفات مسجلة</div>
                    )}
                  </div>
                )}
              </PageCard>
            </div>

            {/* Net Income Summary */}
            <PageCard className={`p-6 border-2 ${incomeStatement.netIncome >= 0 ? 'border-emerald-500/20 bg-gradient-to-bl from-emerald-500/5 to-transparent' : 'border-rose-500/20 bg-gradient-to-bl from-rose-500/5 to-transparent'}`}>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  {incomeStatement.netIncome >= 0 ? <CheckCircle2 className="w-8 h-8 text-emerald-600" /> : <AlertTriangle className="w-8 h-8 text-rose-600" />}
                  <div>
                    <h3 className="font-black text-xl">{incomeStatement.netIncome >= 0 ? 'صافي الربح' : 'صافي الخسارة'}</h3>
                    <p className="text-sm text-muted-foreground font-bold">للفترة المالية المحددة</p>
                  </div>
                </div>
                <span className={`text-3xl font-black tabular-nums ${incomeStatement.netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {Math.abs(incomeStatement.netIncome).toLocaleString()} {currency}
                </span>
              </div>
            </PageCard>
          </div>
        )}

        {/* ─── Balance Sheet ─── */}
        {reportType === "balancesheet" && (
          <div className="space-y-6">
            <div className={`rounded-2xl border-2 p-5 ${balanceSheet.isBalanced ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Scale className={`w-7 h-7 ${balanceSheet.isBalanced ? 'text-emerald-600' : 'text-rose-600'}`} />
                  <div>
                    <h3 className="font-black text-xl">قائمة المركز المالي (Balance Sheet)</h3>
                    <p className="text-sm text-muted-foreground font-bold">
                      الأصول = الخصوم + حقوق الملكية
                    </p>
                  </div>
                </div>
                <Badge tone={balanceSheet.isBalanced ? "success" : "danger"} className="font-black text-base px-4 py-2">
                  {balanceSheet.isBalanced ? "متوازنة ✅" : "غير متوازنة ❌"}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FinancialCard title="إجمالي الأصول" value={balanceSheet.assets.total} currency={currency} icon={Building2} colorClass="text-blue-600 bg-blue-500" />
              <FinancialCard title="إجمالي الخصوم" value={balanceSheet.liabilities.total} currency={currency} icon={CreditCard} colorClass="text-rose-600 bg-rose-500" />
              <FinancialCard title="حقوق الملكية" value={balanceSheet.equity.total} currency={currency} icon={Layers} colorClass="text-purple-600 bg-purple-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assets */}
              <PageCard className="p-0 overflow-hidden">
                <div className="p-5 bg-blue-500/5 border-b border-border/30">
                  <h3 className="font-black text-lg text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    <Building2 className="w-5 h-5" /> الأصول
                  </h3>
                </div>
                <div className="divide-y divide-border/30">
                  {balanceSheet.assets.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center px-5 py-3 hover:bg-accent/20 transition-all">
                      <span className="font-bold text-sm">{item.name}</span>
                      <span className="font-black tabular-nums text-blue-600 text-sm">{item.amount.toLocaleString()} {currency}</span>
                    </div>
                  ))}
                  {balanceSheet.assets.items.length === 0 && <div className="py-6 text-center text-muted-foreground text-sm font-bold">لا توجد أصول</div>}
                  <div className="flex justify-between items-center px-5 py-3 bg-blue-500/5 font-black">
                    <span>الإجمالي</span>
                    <span className="text-blue-600 tabular-nums">{balanceSheet.assets.total.toLocaleString()} {currency}</span>
                  </div>
                </div>
              </PageCard>

              {/* Liabilities + Equity */}
              <PageCard className="p-0 overflow-hidden">
                <div className="p-5 bg-rose-500/5 border-b border-border/30">
                  <h3 className="font-black text-lg text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" /> الخصوم وحقوق الملكية
                  </h3>
                </div>
                <div className="divide-y divide-border/30">
                  {balanceSheet.liabilities.items.length > 0 && (
                    <div className="px-5 py-2 bg-rose-500/5 text-xs font-black text-rose-600">الخصوم</div>
                  )}
                  {balanceSheet.liabilities.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center px-5 py-3 hover:bg-accent/20 transition-all">
                      <span className="font-bold text-sm">{item.name}</span>
                      <span className="font-black tabular-nums text-rose-600 text-sm">{item.amount.toLocaleString()} {currency}</span>
                    </div>
                  ))}
                  {balanceSheet.equity.items.length > 0 && (
                    <div className="px-5 py-2 bg-purple-500/5 text-xs font-black text-purple-600">حقوق الملكية</div>
                  )}
                  {balanceSheet.equity.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center px-5 py-3 hover:bg-accent/20 transition-all">
                      <span className="font-bold text-sm">{item.name}</span>
                      <span className="font-black tabular-nums text-purple-600 text-sm">{item.amount.toLocaleString()} {currency}</span>
                    </div>
                  ))}
                  {balanceSheet.liabilities.items.length === 0 && balanceSheet.equity.items.length === 0 && (
                    <div className="py-6 text-center text-muted-foreground text-sm font-bold">لا توجد خصوم أو حقوق ملكية</div>
                  )}
                  <div className="flex justify-between items-center px-5 py-3 bg-muted/30 font-black">
                    <span>الإجمالي</span>
                    <span className="text-foreground tabular-nums">{(balanceSheet.liabilities.total + balanceSheet.equity.total).toLocaleString()} {currency}</span>
                  </div>
                </div>
              </PageCard>
            </div>
          </div>
        )}

        {/* ─── Cash Flow ─── */}
        {reportType === "cashflow" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FinancialCard title="التدفقات الداخلة" value={cashFlow.operatingIn} currency={currency} icon={ArrowDownRight} colorClass="text-emerald-600 bg-emerald-500" />
              <FinancialCard title="التدفقات الخارجة" value={cashFlow.operatingOut} currency={currency} icon={ArrowUpRight} colorClass="text-rose-600 bg-rose-500" />
              <FinancialCard title="صافي التدفق النقدي" value={cashFlow.netCash} currency={currency} icon={Wallet} colorClass="text-primary bg-primary" />
            </div>

            <PageCard className="p-6">
              <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-primary" /> قائمة التدفقات النقدية
              </h3>
              <div className="space-y-3">
                <div className="rounded-xl border bg-emerald-500/5 border-emerald-500/20 p-4">
                  <h4 className="font-black text-emerald-700 dark:text-emerald-400 mb-3">التدفقات من الأنشطة التشغيلية</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-border/20">
                      <span className="font-bold text-sm">المتحصلات النقدية (تحصيل رسوم، مقبوضات)</span>
                      <span className="font-black tabular-nums text-emerald-600">{cashFlow.operatingIn.toLocaleString()} {currency}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/20">
                      <span className="font-bold text-sm">المدفوعات النقدية (مصروفات، رواتب)</span>
                      <span className="font-black tabular-nums text-rose-600">({cashFlow.operatingOut.toLocaleString()}) {currency}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 bg-muted/30 rounded-lg px-3">
                      <span className="font-black">صافي التدفق التشغيلي</span>
                      <span className={`font-black text-lg tabular-nums ${cashFlow.netOperating >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {cashFlow.netOperating.toLocaleString()} {currency}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-lg">صافي التغير في النقد والنقد المعادل</span>
                    <span className={`font-black text-2xl tabular-nums ${cashFlow.netCash >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {cashFlow.netCash.toLocaleString()} {currency}
                    </span>
                  </div>
                </div>
              </div>
            </PageCard>
          </div>
        )}

        {/* ─── Collection & Performance ─── */}
        {reportType === "collection" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FinancialCard title="إجمالي الفوترة" value={collectionStats.totalInvoiced} currency={currency} icon={FileText} colorClass="text-blue-600 bg-blue-500" />
              <FinancialCard title="إجمالي التحصيل" value={collectionStats.totalPaid} currency={currency} icon={Wallet} colorClass="text-emerald-600 bg-emerald-500" />
              <FinancialCard title="المبالغ المعلقة" value={collectionStats.outstanding} currency={currency} icon={AlertTriangle} colorClass="text-amber-600 bg-amber-500" />
              <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col justify-center items-center gap-1">
                <Target className={`w-6 h-6 ${collectionStats.collectionRate >= 80 ? 'text-emerald-500' : collectionStats.collectionRate >= 50 ? 'text-amber-500' : 'text-rose-500'}`} />
                <span className="text-xs font-bold text-muted-foreground">نسبة التحصيل</span>
                <span className={`text-3xl font-black ${collectionStats.collectionRate >= 80 ? 'text-emerald-600' : collectionStats.collectionRate >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {collectionStats.collectionRate.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Collection Progress Bar */}
            <PageCard className="p-6">
              <h3 className="font-black text-base mb-4">مؤشر التحصيل العام</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-bold text-muted-foreground">
                  <span>المحصّل: {collectionStats.totalPaid.toLocaleString()} {currency}</span>
                  <span>الإجمالي: {collectionStats.totalInvoiced.toLocaleString()} {currency}</span>
                </div>
                <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      collectionStats.collectionRate >= 80 ? 'bg-gradient-to-l from-emerald-400 to-emerald-600' :
                      collectionStats.collectionRate >= 50 ? 'bg-gradient-to-l from-amber-400 to-amber-600' :
                      'bg-gradient-to-l from-rose-400 to-rose-600'
                    }`}
                    style={{ width: `${Math.min(collectionStats.collectionRate, 100)}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 bg-muted/30 rounded-xl">
                    <p className="text-xs font-bold text-muted-foreground">عدد الفواتير</p>
                    <p className="text-xl font-black">{allInvoices.length}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-xl">
                    <p className="text-xs font-bold text-muted-foreground">عدد المدفوعات</p>
                    <p className="text-xl font-black">{allPayments.length}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-xl">
                    <p className="text-xs font-bold text-muted-foreground">عدد المصروفات</p>
                    <p className="text-xl font-black">{allExpenses.length}</p>
                  </div>
                </div>
              </div>
            </PageCard>
          </div>
        )}

        {/* ─── Entity Reports ─── */}
        {reportType === "entity" && (
          <div className="space-y-6">
            <FilterBar>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 bg-background border border-border rounded-xl overflow-hidden">
                  <button 
                    onClick={() => { setEntityType("student"); setSelectedEntityId(""); }}
                    className={`px-4 py-2 text-sm font-bold transition-all ${entityType === "student" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                  >
                    <User className="w-4 h-4 inline-block ml-1" /> طلاب
                  </button>
                  <button 
                    onClick={() => { setEntityType("staff"); setSelectedEntityId(""); }}
                    className={`px-4 py-2 text-sm font-bold transition-all ${entityType === "staff" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                  >
                    <Users className="w-4 h-4 inline-block ml-1" /> موظفون
                  </button>
                </div>
                <select 
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-bold min-w-[250px]"
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                >
                  <option value="">-- اختر {entityType === "student" ? "طالب" : "موظف"} --</option>
                  {entityType === "student" 
                    ? allStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                    : allStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                  }
                </select>
              </div>
            </FilterBar>

            {selectedEntityId ? (
              <div className="space-y-4">
                {/* Entity Balance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FinancialCard title="إجمالي المدين" value={entityBalance.debit} currency={currency} icon={TrendingDown} colorClass="text-rose-600 bg-rose-500" />
                  <FinancialCard title="إجمالي الدائن" value={entityBalance.credit} currency={currency} icon={TrendingUp} colorClass="text-emerald-600 bg-emerald-500" />
                  <FinancialCard title="صافي الرصيد" value={entityBalance.net} currency={currency} icon={Scale} colorClass="text-primary bg-primary" />
                </div>

                <PageCard title="كشف الحركات المحاسبية التفصيلي">
                  <DataTable 
                    rows={entityTransactions}
                    columns={[
                      { key: "date", header: "التاريخ", cell: (r) => <span className="font-bold text-sm tabular-nums">{r.date}</span> },
                      { key: "accountName", header: "الحساب", cell: (r) => <span className="font-bold text-xs bg-muted px-2 py-1 rounded-lg">{r.accountName}</span> },
                      { key: "description", header: "البيان", cell: (r) => <span className="text-sm font-bold">{r.description}</span> },
                      { key: "debit", header: "مدين", cell: (r) => r.debit > 0 ? <span className="text-rose-600 font-black tabular-nums">{r.debit.toLocaleString()}</span> : <span className="text-muted-foreground/30">-</span> },
                      { key: "credit", header: "دائن", cell: (r) => r.credit > 0 ? <span className="text-emerald-600 font-black tabular-nums">{r.credit.toLocaleString()}</span> : <span className="text-muted-foreground/30">-</span> },
                    ]}
                  />
                </PageCard>
              </div>
            ) : (
              <PageCard>
                <div className="py-16 text-center flex flex-col items-center justify-center text-muted-foreground">
                  <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                    <User className="w-10 h-10 opacity-30" />
                  </div>
                  <p className="font-black text-lg">اختر كياناً لعرض كشف حسابه</p>
                  <p className="text-sm font-bold mt-1">حدد طالباً أو موظفاً لاستعراض جميع حركاته المالية بالتفصيل</p>
                </div>
              </PageCard>
            )}
          </div>
        )}
      </div>

      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="التقارير المالية"
        data={incomeStatement.revenueItems.concat(incomeStatement.expenseItems)}
        templates={printTemplates}
      />
    </AppShell>
  );
}
