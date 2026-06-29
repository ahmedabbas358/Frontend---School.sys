import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { useMemo } from "react";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Users, ArrowUpRight, ArrowDownRight, Printer } from "lucide-react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { useState } from "react";

export const Route = createFileRoute("/finance/dashboard")({
  component: FinanceDashboard,
});

function FinanceDashboard() {
  const { stage, getStageLabel } = useStage();
  const { currency, activeStageInvoices, allExpenses, allPayments, activeStageStaff } = useGlobalStore();
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Calculate Revenue Metrics
  const revenueStats = useMemo(() => {
    const totalExpected = activeStageInvoices.reduce((sum, inv) => sum + (inv.netAmount ?? inv.amount), 0);
    const totalPaid = activeStageInvoices.reduce((sum, inv) => sum + inv.paid, 0);
    const totalDue = totalExpected - totalPaid;
    return { totalExpected, totalPaid, totalDue };
  }, [activeStageInvoices]);

  // Calculate Expense Metrics
  const expenseStats = useMemo(() => {
    const totalExpenses = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    // Rough estimate of monthly payroll based on basic salary
    const estimatedPayroll = activeStageStaff.reduce((sum, staff) => sum + (staff.basicSalary || 0), 0);
    return { totalExpenses, estimatedPayroll };
  }, [allExpenses, activeStageStaff]);

  const netBalance = revenueStats.totalPaid - expenseStats.totalExpenses;

  const recentPayments = useMemo(() => {
    return [...allPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [allPayments]);

  const recentExpenses = useMemo(() => {
    return [...allExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [allExpenses]);

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المالية والمحاسبة" },
        { label: "لوحة البيانات المالية" },
      ]}
      actions={
        <button 
          onClick={() => setIsPrintOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary/10 px-4 text-sm font-bold text-primary hover:bg-primary/20 transition-all border border-primary/20"
        >
          <Printer className="h-4 w-4" /> طباعة الملخص
        </button>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* Top Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 text-primary-foreground shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -ml-10 -mt-10"></div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><Wallet className="h-6 w-6 text-white" /></div>
              <h3 className="text-lg font-bold">الرصيد الصافي المتاح</h3>
            </div>
            <p className="text-4xl font-black tabular-nums relative z-10">{netBalance.toLocaleString()} <span className="text-xl font-bold">{currency}</span></p>
            <p className="text-sm text-primary-foreground/80 mt-2 font-medium relative z-10">الفرق بين التحصيلات والمصروفات</p>
          </div>

          <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-success/10 rounded-2xl"><TrendingUp className="h-6 w-6 text-success" /></div>
              <h3 className="text-lg font-bold">إجمالي التحصيلات</h3>
            </div>
            <p className="text-3xl font-black text-success tabular-nums">{revenueStats.totalPaid.toLocaleString()} <span className="text-lg font-bold">{currency}</span></p>
            <div className="mt-2 text-sm text-muted-foreground flex justify-between font-bold">
              <span>المتبقي للتحصيل:</span>
              <span className="text-danger">{revenueStats.totalDue.toLocaleString()} {currency}</span>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-danger/10 rounded-2xl"><TrendingDown className="h-6 w-6 text-danger" /></div>
              <h3 className="text-lg font-bold">إجمالي المصروفات</h3>
            </div>
            <p className="text-3xl font-black text-danger tabular-nums">{expenseStats.totalExpenses.toLocaleString()} <span className="text-lg font-bold">{currency}</span></p>
            <div className="mt-2 text-sm text-muted-foreground flex justify-between font-bold">
              <span>الرواتب التقديرية (شهرياً):</span>
              <span>{expenseStats.estimatedPayroll.toLocaleString()} {currency}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PageCard title="أحدث المقبوضات (تحصيلات الطلاب)">
            {recentPayments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا توجد تحصيلات مسجلة</p>
            ) : (
              <div className="space-y-4">
                {recentPayments.map(p => {
                  const invoice = activeStageInvoices.find(i => i.id === p.invoiceId);
                  return (
                    <div key={p.id} className="flex justify-between items-center p-4 border border-border/50 rounded-2xl bg-background hover:border-success/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-success/10 text-success"><ArrowDownRight className="h-5 w-5" /></div>
                        <div>
                          <p className="font-bold text-sm">{invoice?.studentName || 'غير معروف'}</p>
                          <p className="text-xs text-muted-foreground">{p.date} • {p.method}</p>
                        </div>
                      </div>
                      <span className="font-black text-success">+{p.amount.toLocaleString()} {currency}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </PageCard>

          <PageCard title="أحدث المصروفات">
            {recentExpenses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">لا توجد مصروفات مسجلة</p>
            ) : (
              <div className="space-y-4">
                {recentExpenses.map(e => (
                  <div key={e.id} className="flex justify-between items-center p-4 border border-border/50 rounded-2xl bg-background hover:border-danger/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-danger/10 text-danger"><ArrowUpRight className="h-5 w-5" /></div>
                      <div>
                        <p className="font-bold text-sm">{e.title}</p>
                        <p className="text-xs text-muted-foreground">{e.date} • {e.beneficiary}</p>
                      </div>
                    </div>
                    <span className="font-black text-danger">-{e.amount.toLocaleString()} {currency}</span>
                  </div>
                ))}
              </div>
            )}
          </PageCard>
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
                    <h3 className="text-lg font-bold mb-4 border-b pb-2">أحدث التحصيلات</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50"><th className="text-right py-2 px-2">البيان</th><th className="text-left py-2 px-2">المبلغ</th></tr>
                      </thead>
                      <tbody>
                        {recentPayments.map(p => {
                          const invoice = activeStageInvoices.find(i => i.id === p.invoiceId);
                          return (
                            <tr key={p.id} className="border-b">
                              <td className="py-2 px-2">{invoice?.studentName || 'غير معروف'} - {p.date}</td>
                              <td className="text-left font-bold text-green-600 py-2 px-2">+{p.amount.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-4 border-b pb-2">أحدث المصروفات</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50"><th className="text-right py-2 px-2">البيان</th><th className="text-left py-2 px-2">المبلغ</th></tr>
                      </thead>
                      <tbody>
                        {recentExpenses.map(e => (
                          <tr key={e.id} className="border-b">
                            <td className="py-2 px-2">{e.title} - {e.date}</td>
                            <td className="text-left font-bold text-red-600 py-2 px-2">-{e.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
