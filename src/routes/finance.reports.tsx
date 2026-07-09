import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useMemo, useState } from "react";
import { PieChart, TrendingUp, TrendingDown, Filter, FileText, User, Users } from "lucide-react";
import { FinancialCard, FilterBar, AcademicYearSelector } from "@/components/financial-components";
import { DataTable } from "@/components/data-table";

export const Route = createFileRoute("/finance/reports")({
  component: FinanceReports,
});

function FinanceReports() {
  const { 
    allJournalEntries, allJournalLines, allAccounts, 
    allAcademicYears, currentAcademicYearId, 
    allStudents, allStaff, currency
  } = useGlobalStore();
  
  const [selectedYear, setSelectedYear] = useState(currentAcademicYearId);
  const [reportType, setReportType] = useState<"income" | "cashflow" | "entity">("income");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");

  const filteredJEs = useMemo(() => {
    return allJournalEntries.filter(je => je.academicYearId === selectedYear && je.status === "posted");
  }, [allJournalEntries, selectedYear]);

  // Income Statement (Revenue - Expense)
  const incomeStatement = useMemo(() => {
    let totalRevenue = 0;
    let totalExpense = 0;
    
    // Revenue allAccounts (4xx), Expense allAccounts (5xx)
    const revenueLines = allJournalLines.filter(jl => {
      const acc = allAccounts.find(a => a.id === jl.accountId);
      return acc?.type === "revenue" && filteredJEs.some(je => je.id === jl.journalEntryId);
    });
    
    const expenseLines = allJournalLines.filter(jl => {
      const acc = allAccounts.find(a => a.id === jl.accountId);
      return acc?.type === "expense" && filteredJEs.some(je => je.id === jl.journalEntryId);
    });

    totalRevenue = revenueLines.reduce((acc, curr) => acc + curr.credit - curr.debit, 0);
    totalExpense = expenseLines.reduce((acc, curr) => acc + curr.debit - curr.credit, 0);

    return { totalRevenue, totalExpense, netIncome: totalRevenue - totalExpense };
  }, [allJournalLines, filteredJEs, allAccounts]);

  // Entity specific transactions
  const entityTransactions = useMemo(() => {
    if (!selectedEntityId) return [];
    
    return allJournalLines
      .filter(jl => jl.referenceId === selectedEntityId && filteredJEs.some(je => je.id === jl.journalEntryId))
      .map(jl => {
        const je = filteredJEs.find(j => j.id === jl.journalEntryId);
        const account = allAccounts.find(a => a.id === jl.accountId);
        return {
          id: jl.id,
          date: je?.date || "",
          description: je?.description || "",
          accountName: account?.name || "",
          debit: jl.debit,
          credit: jl.credit
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allJournalLines, filteredJEs, selectedEntityId, allAccounts]);

  // Cash flow proxy (very simplified: Net movement on Cash/Bank allAccounts)
  const cashFlow = useMemo(() => {
    let inflow = 0;
    let outflow = 0;

    allJournalLines.forEach(jl => {
      const acc = allAccounts.find(a => a.id === jl.accountId);
      if (acc?.type === "asset" && (acc.name.includes("صندوق") || acc.name.includes("بنك"))) {
        if (filteredJEs.some(je => je.id === jl.journalEntryId)) {
          inflow += jl.debit;
          outflow += jl.credit;
        }
      }
    });

    return { inflow, outflow, netCash: inflow - outflow };
  }, [allJournalLines, filteredJEs, allAccounts]);

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance" },
        { label: "التقارير المالية" },
      ]}
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <FilterBar>
          <div className="flex items-center gap-4">
            <AcademicYearSelector value={selectedYear ?? ''} onChange={setSelectedYear} years={allAcademicYears} />
            <select 
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
            >
              <option value="income">قائمة الدخل</option>
              <option value="cashflow">التدفقات النقدية</option>
              <option value="entity">تقارير الكيانات</option>
            </select>
          </div>
        </FilterBar>

        {reportType === "income" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FinancialCard 
                title="إجمالي الإيرادات" 
                value={incomeStatement.totalRevenue} 
                currency={currency} 
                icon={TrendingUp} 
                colorClass="text-success bg-success" 
              />
              <FinancialCard 
                title="إجمالي المصروفات" 
                value={incomeStatement.totalExpense} 
                currency={currency} 
                icon={TrendingDown} 
                colorClass="text-danger bg-danger" 
              />
              <FinancialCard 
                title="صافي الدخل" 
                value={incomeStatement.netIncome} 
                currency={currency} 
                icon={PieChart} 
                colorClass="text-primary bg-primary" 
              />
            </div>
            
            <PageCard title="تحليل قائمة الدخل المبسطة">
              <div className="p-4 border rounded-xl bg-card">
                <p className="text-sm text-muted-foreground mb-4">هذا التقرير يعتمد على الحركات المقيدة في دفتر الأستاذ لحسابات الإيرادات والمصروفات.</p>
                <div className="space-y-3 font-bold">
                  <div className="flex justify-between items-center p-3 border-b border-border/50">
                    <span>إجمالي الإيرادات (الأنشطة التعليمية وغيرها)</span>
                    <span className="text-success">{incomeStatement.totalRevenue.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border-b border-border/50">
                    <span>إجمالي المصروفات (التشغيلية والرواتب)</span>
                    <span className="text-danger">{incomeStatement.totalExpense.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg text-lg">
                    <span>صافي الدخل للفترة</span>
                    <span className={incomeStatement.netIncome >= 0 ? "text-primary" : "text-danger"}>
                      {incomeStatement.netIncome.toLocaleString()} {currency}
                    </span>
                  </div>
                </div>
              </div>
            </PageCard>
          </div>
        )}

        {reportType === "cashflow" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FinancialCard 
                title="التدفقات النقدية الداخلة" 
                value={cashFlow.inflow} 
                currency={currency} 
                icon={TrendingUp} 
                colorClass="text-success bg-success" 
              />
              <FinancialCard 
                title="التدفقات النقدية الخارجة" 
                value={cashFlow.outflow} 
                currency={currency} 
                icon={TrendingDown} 
                colorClass="text-danger bg-danger" 
              />
              <FinancialCard 
                title="صافي التغير في النقد" 
                value={cashFlow.netCash} 
                currency={currency} 
                icon={PieChart} 
                colorClass="text-primary bg-primary" 
              />
            </div>

            <PageCard title="تحليل التدفقات النقدية">
               <div className="p-4 border rounded-xl bg-card text-center text-muted-foreground text-sm font-bold">
                 تحليل حركة النقد في حسابات الصندوق والبنك عن السنة المالية المحددة.
               </div>
            </PageCard>
          </div>
        )}

        {reportType === "entity" && (
          <div className="space-y-6">
            <FilterBar>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">اختر الكيان:</span>
                <select 
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                >
                  <option value="">-- اختر كيان --</option>
                  <optgroup label="الطلاب">
                    {allStudents.map(s => <option key={s.id} value={s.id}>{s.name} (طالب)</option>)}
                  </optgroup>
                  <optgroup label="الموظفون">
                    {allStaff.map(s => <option key={s.id} value={s.id}>{s.name} (موظف)</option>)}
                  </optgroup>
                </select>
              </div>
            </FilterBar>

            {selectedEntityId ? (
              <PageCard title="كشف الحركات المحاسبية للكيان">
                <DataTable 
                  rows={entityTransactions}
                  columns={[
                    { key: "date", header: "التاريخ", cell: (r) => r.date },
                    { key: "accountName", header: "الحساب", cell: (r) => <span className="font-bold text-sm bg-muted px-2 py-1 rounded">{r.accountName}</span> },
                    { key: "description", header: "البيان", cell: (r) => r.description },
                    { key: "debit", header: "مدين", cell: (r) => r.debit > 0 ? <span className="text-success font-black">{r.debit.toLocaleString()}</span> : "-" },
                    { key: "credit", header: "دائن", cell: (r) => r.credit > 0 ? <span className="text-danger font-black">{r.credit.toLocaleString()}</span> : "-" },
                  ]}
                />
              </PageCard>
            ) : (
              <PageCard>
                <div className="py-12 text-center flex flex-col items-center justify-center text-muted-foreground">
                  <User className="w-12 h-12 mb-4 opacity-50" />
                  <p className="font-bold">الرجاء تحديد كيان لعرض كشف حساب الحركات التفصيلي له.</p>
                </div>
              </PageCard>
            )}
          </div>
        )}

      </div>
    </AppShell>
  );
}
