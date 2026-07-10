import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { useMemo, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Users, ArrowUpRight, ArrowDownRight, Printer, AlertTriangle, FileText, Plus, ArrowRight, User } from "lucide-react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { FinancialCard, FinancialTimeline, ProgressRing, FinancialSummaryCard, FilterBar, AcademicYearSelector, EmptyState } from "@/components/financial-components";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/finance/dashboard")({
  component: FinanceDashboard,
});

function FinanceDashboard() {
  const { stage, getStageLabel } = useStage();
  const { currency, activeStageInvoices, allExpenses, allPayments, currentAcademicYearId, allAcademicYears, allTreasuries, allBankAccounts, allVendors, generateBulkData } = useGlobalStore();
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentAcademicYearId);

  // Filter data by selected year (if 'all', use all data, else filter)
  const filteredInvoices = useMemo(() => {
    return activeStageInvoices; 
  }, [activeStageInvoices, selectedYear]);

  // Command Center Metrics
  const commandStats = useMemo(() => {
    const totalTreasury = allTreasuries.filter(t => t.status === "active").reduce((sum, t) => sum + t.balance, 0);
    const totalBank = allBankAccounts.filter(b => b.status === "active").reduce((sum, b) => sum + b.balance, 0);
    
    // Receivables: Unpaid invoices
    const totalReceivables = filteredInvoices.reduce((sum, inv) => {
       const due = (inv.netAmount ?? inv.amount) - inv.paid;
       return due > 0 && inv.status !== "cancelled" ? sum + due : sum;
    }, 0);

    // Payables: Unpaid expenses + Vendor balances
    const unpaidExpenses = allExpenses.filter(e => e.status !== "posted" && e.status !== "cancelled" && e.status !== "paid").reduce((sum, e) => sum + e.amount, 0);
    const vendorBalances = allVendors.reduce((sum, v) => sum + v.balance, 0);
    const totalPayables = unpaidExpenses + vendorBalances;

    return { totalTreasury, totalBank, totalReceivables, totalPayables, unpaidExpenses };
  }, [allTreasuries, allBankAccounts, filteredInvoices, allExpenses, allVendors]);

  const netBalance = commandStats.totalTreasury + commandStats.totalBank;

  const recentTransactions = useMemo(() => {
    const payments = allPayments.map(p => {
      const invoice = activeStageInvoices.find(i => i.id === p.invoiceId);
      return {
        id: `p-${p.id}`,
        date: p.date,
        title: `تحصيل رسوم - ${invoice?.studentName || "طالب"}`,
        subtitle: p.method,
        amount: p.amount,
        type: "income" as const,
        currency,
        method: p.method,
        link: "/finance/invoices"
      };
    });
    const expenses = allExpenses.map(e => ({
      id: `e-${e.id}`,
      date: e.date,
      title: e.title,
      subtitle: e.beneficiary,
      amount: e.amount,
      type: "expense" as const,
      currency,
      method: e.method,
      link: "/finance/expenses"
    }));
    return [...payments, ...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [allPayments, allExpenses, activeStageInvoices, currency]);

  const chartData = useMemo(() => {
    // Generate last 6 months revenue vs expenses
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { month: d.getMonth(), year: d.getFullYear(), label: d.toLocaleString('ar-EG', { month: 'short' }) };
    });

    return months.map(m => {
      const income = allPayments.filter(p => {
        const d = new Date(p.date);
        return d.getMonth() === m.month && d.getFullYear() === m.year;
      }).reduce((sum, p) => sum + p.amount, 0);

      return { month: m.label, income, allExpenses, balance: income - expense };
    });
  }, [allPayments, allExpenses]);

  const studentsWithArrears = useMemo(() => {
    const map = new Map<string, { studentId: string, studentName: string, amount: number }>();
    filteredInvoices.forEach(inv => {
      const due = (inv.netAmount ?? inv.amount) - inv.paid;
      if (due > 0 && (inv.status === 'issued' || inv.status === 'partial')) {
        if (!map.has(inv.studentId)) {
          map.set(inv.studentId, { studentId: inv.studentId, studentName: inv.studentName, amount: 0 });
        }
        map.get(inv.studentId)!.amount += due;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [filteredInvoices]);

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي" },
        { label: "اللوحة المالية" },
      ]}
      actions={
        <button 
          onClick={() => setIsPrintOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 text-sm font-bold shadow-sm hover:bg-primary/90 transition-all"
        >
          <Printer className="h-4 w-4" /> طباعة الملخص
        </button>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        
        <FilterBar>
          <AcademicYearSelector value={selectedYear ?? ''} onChange={setSelectedYear} years={allAcademicYears} />
        </FilterBar>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/finance/students" className="flex items-center gap-3 p-4 bg-card border border-border/50 rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all group">
            <div className="p-2 bg-primary/10 text-primary rounded-xl group-hover:scale-110 transition-transform"><Users className="w-5 h-5" /></div>
            <div className="font-bold text-sm">المالية الطلابية</div>
          </Link>
          <Link to="/finance/payments" className="flex items-center gap-3 p-4 bg-card border border-border/50 rounded-2xl hover:border-success/50 hover:bg-success/5 transition-all group">
            <div className="p-2 bg-success/10 text-success rounded-xl group-hover:scale-110 transition-transform"><ArrowDownRight className="w-5 h-5" /></div>
            <div className="font-bold text-sm">سند قبض</div>
          </Link>
          <Link to="/finance/expenses" className="flex items-center gap-3 p-4 bg-card border border-border/50 rounded-2xl hover:border-danger/50 hover:bg-danger/5 transition-all group">
            <div className="p-2 bg-danger/10 text-danger rounded-xl group-hover:scale-110 transition-transform"><ArrowUpRight className="w-5 h-5" /></div>
            <div className="font-bold text-sm">تسجيل مصروف</div>
          </Link>
          <Link to="/hr/payroll" className="flex items-center gap-3 p-4 bg-card border border-border/50 rounded-2xl hover:border-warning/50 hover:bg-warning/5 transition-all group">
            <div className="p-2 bg-warning/10 text-warning rounded-xl group-hover:scale-110 transition-transform"><Users className="w-5 h-5" /></div>
            <div className="font-bold text-sm">مسير الرواتب</div>
          </Link>
          <button onClick={() => { generateBulkData(100); toast.success("تم توليد 100 سجل محاكاة بنجاح"); }} className="flex items-center gap-3 p-4 bg-card border border-border/50 rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all group text-right">
            <div className="p-2 bg-primary/10 text-primary rounded-xl group-hover:scale-110 transition-transform"><Plus className="w-5 h-5" /></div>
            <div className="font-bold text-sm">توليد بيانات تجريبية (100)</div>
          </button>
        </div>

        {/* Core KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FinancialCard 
            title="رصيد الخزائن النقدية" 
            value={commandStats.totalTreasury} 
            currency={currency} 
            icon={Wallet} 
            colorClass="text-emerald-600 bg-emerald-500" 
          />
          <FinancialCard 
            title="رصيد الحسابات البنكية" 
            value={commandStats.totalBank} 
            currency={currency} 
            icon={Building} 
            colorClass="text-blue-600 bg-blue-500" 
          />
          <FinancialCard 
            title="إجمالي الذمم المدينة (مستحقات)" 
            value={commandStats.totalReceivables} 
            currency={currency} 
            icon={TrendingUp} 
            colorClass="text-amber-600 bg-amber-500" 
          />
          <FinancialCard 
            title="الذمم الدائنة والمصروفات المستحقة" 
            value={commandStats.totalPayables} 
            currency={currency} 
            icon={AlertTriangle} 
            colorClass="text-rose-600 bg-rose-500" 
          />
        </div>

        {/* Detailed Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FinancialSummaryCard 
            title="موقف السيولة النقدية"
            total={commandStats.totalTreasury + commandStats.totalBank}
            paid={commandStats.totalTreasury}
            currency={currency}
            icon={Wallet}
          />
          <FinancialSummaryCard 
            title="موقف الدائنين (موردين + مصروفات قيد الاعتماد)"
            total={commandStats.totalPayables}
            paid={commandStats.unpaidExpenses}
            currency={currency}
            icon={Users}
          />
        </div>

        {/* Advanced Views */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <PageCard title="أحدث الحركات المالية">
              <FinancialTimeline transactions={recentTransactions} />
            </PageCard>
          </div>

          {/* Arrears List */}
          <div>
            <PageCard title="أعلى المتأخرات">
              {studentsWithArrears.length === 0 ? (
                <div className="py-8 text-center text-sm font-bold text-muted-foreground bg-muted/20 rounded-xl">
                  لا توجد متأخرات حالياً.
                </div>
              ) : (
                <div className="space-y-3">
                  {studentsWithArrears.map(s => (
                    <div key={s.studentId} className="flex items-center justify-between p-3 border border-border/50 rounded-xl bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-full">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="text-sm font-bold">{s.studentName}</div>
                          <Link to={`/finance/students`} className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                            الملف المالي <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                      <div className="text-danger font-black text-sm">
                        {s.amount.toLocaleString()} {currency}
                      </div>
                    </div>
                  ))}
                  <Link to="/finance/students" className="block w-full py-2 mt-2 text-center text-sm font-bold text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                    عرض جميع المتأخرات
                  </Link>
                </div>
              )}
            </PageCard>

            <PageCard title="الإيرادات (6 أشهر)" className="mt-6">
              <div className="h-64 mt-4" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString()} ${currency}`, '']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="income" name="الإيرادات" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="expense" name="المصروفات" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Line type="monotone" dataKey="balance" name="الصافي" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </PageCard>
          </div>
        </div>
      </div>

      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title={`الملخص المالي - ${getStageLabel(stage)}`}
        data={[{ id: "1" }]} // Dummy data just to render the document template
        templates={[
          {
            id: "dashboard-summary",
            name: "الملخص المالي",
            category: "المالية والمحاسبة",
            type: "document",
            renderDocument: () => (
              <div className="space-y-6" dir="rtl">
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="border p-4 rounded-xl bg-gray-50 text-center">
                    <p className="text-sm text-gray-500 font-bold mb-1">الرصيد الصافي</p>
                    <p className="text-2xl font-black">{netBalance.toLocaleString()} {currency}</p>
                  </div>
                  <div className="border p-4 rounded-xl bg-green-50 text-center">
                    <p className="text-sm text-gray-500 font-bold mb-1">إجمالي التحصيلات</p>
                    <p className="text-2xl font-black text-green-600">{[].totalPaid.toLocaleString()} {currency}</p>
                  </div>
                  <div className="border p-4 rounded-xl bg-red-50 text-center">
                    <p className="text-sm text-gray-500 font-bold mb-1">إجمالي المصروفات</p>
                    <p className="text-2xl font-black text-red-600">{[].totalExpenses.toLocaleString()} {currency}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-bold mb-4 border-b pb-2">تفاصيل السيولة والذمم</h3>
                    <table className="w-full text-sm mb-6">
                      <tbody>
                        <tr className="border-b"><td className="py-2 px-2">إجمالي الخزائن</td><td className="text-left font-bold">{commandStats.totalTreasury.toLocaleString()}</td></tr>
                        <tr className="border-b"><td className="py-2 px-2">إجمالي البنوك</td><td className="text-left font-bold">{commandStats.totalBank.toLocaleString()}</td></tr>
                        <tr className="border-b"><td className="py-2 px-2">إجمالي المتأخرات (لصالحنا)</td><td className="text-left font-bold text-green-600">{commandStats.totalReceivables.toLocaleString()}</td></tr>
                        <tr className="border-b"><td className="py-2 px-2">إجمالي المستحقات (علينا)</td><td className="text-left font-bold text-red-600">{commandStats.totalPayables.toLocaleString()}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-4 border-b pb-2">السيولة المتاحة</h3>
                    <p className="text-2xl font-black text-blue-600 text-center mt-4">
                      {netBalance.toLocaleString()} {currency}
                    </p>
                  </div>
                </div>
              </div>
            )
          }
        ]}
      />
    </AppShell>
  );
}
