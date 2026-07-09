import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { useMemo, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Users, ArrowUpRight, ArrowDownRight, Printer, AlertTriangle, FileText, Plus, ArrowRight, User } from "lucide-react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { FinancialCard, FinancialTimeline, MiniBarChart, ProgressRing, FinancialSummaryCard, FilterBar, AcademicYearSelector, EmptyState } from "@/components/financial-components";

export const Route = createFileRoute("/finance/dashboard")({
  component: FinanceDashboard,
});

function FinanceDashboard() {
  const { stage, getStageLabel } = useStage();
  const { currency, activeStageInvoices, allExpenses, allPayments, activeStageStaff, currentAcademicYearId, academicYears } = useGlobalStore();
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentAcademicYearId);

  // Filter data by selected year (if 'all', use all data, else filter)
  const filteredInvoices = useMemo(() => {
    return activeStageInvoices; // Invoices are tied to stage but usually we would filter by year if they had one. For now, use activeStageInvoices.
  }, [activeStageInvoices, selectedYear]);

  // Calculate Revenue Metrics
  const revenueStats = useMemo(() => {
    const totalExpected = filteredInvoices.reduce((sum, inv) => sum + (inv.netAmount ?? inv.amount), 0);
    const totalPaid = filteredInvoices.reduce((sum, inv) => sum + inv.paid, 0);
    const totalDue = totalExpected - totalPaid;
    const totalDiscounts = filteredInvoices.reduce((sum, inv) => sum + (inv.discountAmount || 0), 0);
    return { totalExpected, totalPaid, totalDue, totalDiscounts };
  }, [filteredInvoices]);

  // Calculate Expense Metrics
  const expenseStats = useMemo(() => {
    const totalExpenses = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    return { totalExpenses };
  }, [allExpenses, selectedYear]);

  // Payroll Metrics
  const payrollStats = useMemo(() => {
    const estimatedPayroll = activeStageStaff.filter(s => !s.isDeleted && s.status !== "terminated").reduce((sum, staff) => sum + (staff.basicSalary || 0), 0);
    return { estimatedPayroll, paidPayroll: 0 }; // In a real app we'd track paid payroll
  }, [activeStageStaff]);

  const netBalance = revenueStats.totalPaid - expenseStats.totalExpenses;

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

      const expense = allExpenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === m.month && d.getFullYear() === m.year;
      }).reduce((sum, e) => sum + e.amount, 0);

      // MiniBarChart expects a single value, let's show net balance per month
      // Alternatively, we can just show income.
      return income > 0 ? income : 0; 
    });
  }, [allPayments, allExpenses]);

  const studentsWithArrears = useMemo(() => {
    const map = new Map<string, { studentId: string, studentName: string, amount: number }>();
    filteredInvoices.forEach(inv => {
      const due = (inv.netAmount ?? inv.amount) - inv.paid;
      if (due > 0 && (inv.status === 'issued' || inv.status === 'partial' || inv.status === 'overdue')) {
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
          <AcademicYearSelector value={selectedYear} onChange={setSelectedYear} years={academicYears} />
        </FilterBar>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/finance/invoices" className="flex items-center gap-3 p-4 bg-card border border-border/50 rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all group">
            <div className="p-2 bg-primary/10 text-primary rounded-xl group-hover:scale-110 transition-transform"><Plus className="w-5 h-5" /></div>
            <div className="font-bold text-sm">إصدار فاتورة</div>
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
        </div>

        {/* Core KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FinancialCard 
            title="الرصيد الصافي المتاح" 
            value={netBalance} 
            currency={currency} 
            icon={Wallet} 
            colorClass="text-primary bg-primary" 
          />
          <FinancialCard 
            title="إجمالي التحصيلات" 
            value={revenueStats.totalPaid} 
            currency={currency} 
            icon={TrendingUp} 
            colorClass="text-success bg-success" 
          />
          <FinancialCard 
            title="المصروفات التشغيلية" 
            value={expenseStats.totalExpenses} 
            currency={currency} 
            icon={TrendingDown} 
            colorClass="text-danger bg-danger" 
          />
          <FinancialCard 
            title="إجمالي المتأخرات" 
            value={revenueStats.totalDue} 
            currency={currency} 
            icon={AlertTriangle} 
            colorClass="text-warning bg-warning" 
          />
        </div>

        {/* Detailed Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FinancialSummaryCard 
            title="تحصيل الرسوم الدراسية"
            total={revenueStats.totalExpected}
            paid={revenueStats.totalPaid}
            currency={currency}
            icon={Wallet}
          />
          <FinancialSummaryCard 
            title="صرف رواتب الموظفين (تقديري)"
            total={payrollStats.estimatedPayroll}
            paid={payrollStats.paidPayroll}
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
                          <Link to={`/students/${s.studentId}`} className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                            الملف المالي <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                      <div className="text-danger font-black text-sm">
                        {s.amount.toLocaleString()} {currency}
                      </div>
                    </div>
                  ))}
                  <Link to="/finance/invoices" className="block w-full py-2 mt-2 text-center text-sm font-bold text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                    عرض جميع المتأخرات
                  </Link>
                </div>
              )}
            </PageCard>

            <PageCard title="الإيرادات (6 أشهر)" className="mt-6">
              <div className="h-48 flex flex-col justify-end mt-4">
                <MiniBarChart data={chartData} height={150} />
                <div className="flex justify-between mt-4 text-xs font-bold text-muted-foreground border-t border-border/50 pt-2">
                  <span>الشهر -5</span><span>-4</span><span>-3</span><span>-2</span><span>الشهر الماضي</span><span>الشهر الحالي</span>
                </div>
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
                    <p className="text-2xl font-black text-green-600">{revenueStats.totalPaid.toLocaleString()} {currency}</p>
                  </div>
                  <div className="border p-4 rounded-xl bg-red-50 text-center">
                    <p className="text-sm text-gray-500 font-bold mb-1">إجمالي المصروفات</p>
                    <p className="text-2xl font-black text-red-600">{expenseStats.totalExpenses.toLocaleString()} {currency}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-bold mb-4 border-b pb-2">تفاصيل الرسوم</h3>
                    <table className="w-full text-sm mb-6">
                      <tbody>
                        <tr className="border-b"><td className="py-2 px-2">إجمالي المتوقع</td><td className="text-left font-bold">{revenueStats.totalExpected.toLocaleString()}</td></tr>
                        <tr className="border-b"><td className="py-2 px-2">المحصل</td><td className="text-left font-bold text-green-600">{revenueStats.totalPaid.toLocaleString()}</td></tr>
                        <tr className="border-b"><td className="py-2 px-2">المتأخرات</td><td className="text-left font-bold text-red-600">{revenueStats.totalDue.toLocaleString()}</td></tr>
                        <tr className="border-b"><td className="py-2 px-2">إجمالي الخصومات</td><td className="text-left font-bold text-orange-600">{revenueStats.totalDiscounts.toLocaleString()}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-4 border-b pb-2">الرواتب المتوقعة (أساسي)</h3>
                    <p className="text-2xl font-black text-blue-600 text-center mt-4">
                      {payrollStats.estimatedPayroll.toLocaleString()} {currency}
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
