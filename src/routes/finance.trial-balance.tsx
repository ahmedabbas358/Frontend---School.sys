import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { DollarSign, Printer, Download, Filter, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useState, useMemo } from "react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { FinancialCard, FilterBar } from "@/components/financial-components";
import { useLedger } from "@/hooks/useLedger";

export const Route = createFileRoute("/finance/trial-balance")({
  component: TrialBalance,
});

function TrialBalance() {
  const { currency } = useGlobalStore();
  const { getTrialBalance, postedLines } = useLedger();
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [showZeroBalances, setShowZeroBalances] = useState(false);

  const trialBalance = useMemo(() => {
    let tb = getTrialBalance();
    if (!showZeroBalances) {
      tb = tb.filter((acc: any) => acc.balance !== 0 || acc.isGroupAccount);
    }
    return tb;
  }, [getTrialBalance, showZeroBalances, postedLines]);

  const totals = useMemo(() => {
    // Only sum base level accounts (not group accounts) to avoid double counting
    const detailAccounts = trialBalance.filter((acc: any) => !acc.isGroupAccount);
    const debitTotal = detailAccounts.filter((acc: any) => acc.isDebit).reduce((sum: number, acc: any) => sum + acc.balance, 0);
    const creditTotal = detailAccounts.filter((acc: any) => !acc.isDebit).reduce((sum: number, acc: any) => sum + acc.balance, 0);
    return { debit: debitTotal, credit: creditTotal };
  }, [trialBalance]);

  const isBalanced = totals.debit === totals.credit;

  const printTemplates: PrintTemplate[] = [
    {
      id: "trial-balance-report",
      name: "ميزان المراجعة بالمجاميع والأرصدة",
      category: "التقارير المالية",
      type: "table",
      columns: [
        { label: "رقم الحساب", key: "code" },
        { label: "اسم الحساب", key: "name" },
        { label: "الرصيد المدين", key: "debitBalance" },
        { label: "الرصيد الدائن", key: "creditBalance" },
      ]
    }
  ];

  const printData = trialBalance.map((acc: any) => ({
    ...acc,
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
          <button onClick={() => setIsPrintOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm hover:bg-accent font-bold">
            <Printer className="h-4 w-4" /> طباعة
          </button>
          <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm hover:bg-accent font-bold">
            <Download className="h-4 w-4" /> تصدير PDF/Excel
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        
        <FilterBar>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">ميزان المراجعة (Trial Balance)</h2>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showZeroBalances} onChange={(e) => setShowZeroBalances(e.target.checked)} className="rounded border-input text-primary" />
              إظهار الأرصدة الصفرية
            </label>
          </div>
        </FilterBar>

        <div className="grid gap-6 md:grid-cols-3">
          <FinancialCard 
            title="إجمالي الأرصدة المدينة" 
            value={totals.debit} 
            currency={currency} 
            icon={TrendingDown} 
            colorClass="text-danger bg-danger/10" 
          />
          <FinancialCard 
            title="إجمالي الأرصدة الدائنة" 
            value={totals.credit} 
            currency={currency} 
            icon={TrendingUp} 
            colorClass="text-success bg-success/10" 
          />
          <div className={`rounded-xl border p-4 shadow-sm flex flex-col justify-center items-center gap-2 ${isBalanced ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5'}`}>
            <h3 className="text-sm font-bold text-muted-foreground">حالة الميزان</h3>
            {isBalanced ? (
              <Badge tone="success" className="bg-success text-success-foreground text-lg py-1 px-4">متوازن ✅</Badge>
            ) : (
              <Badge tone="danger" className="text-lg py-1 px-4">غير متوازن ❌ (فارق {Math.abs(totals.debit - totals.credit).toLocaleString()} {currency})</Badge>
            )}
          </div>
        </div>

        <PageCard>
          <DataTable
            rows={trialBalance}
            columns={[
              { key: "code", header: "رمز الحساب", cell: (r: any) => <span className={`font-mono ${r.isGroupAccount ? 'font-bold text-primary' : ''}`}>{r.code}</span> },
              { key: "name", header: "اسم الحساب", cell: (r: any) => (
                <div style={{ paddingRight: `${(r.level || 1) * 1.5 - 1.5}rem` }} className={r.isGroupAccount ? 'font-bold' : ''}>
                  {r.name}
                </div>
              )},
              { key: "type", header: "التصنيف", cell: (r: any) => <Badge tone="info">{r.type === 'asset' ? 'أصل' : r.type === 'liability' ? 'خصم' : r.type === 'equity' ? 'ملكية' : r.type === 'revenue' ? 'إيراد' : 'مصروف'}</Badge> },
              { key: "debitBalance", header: "رصيد مدين", cell: (r: any) => <span className={r.isGroupAccount ? 'font-bold text-lg' : ''}>{r.isDebit && r.balance !== 0 ? `${r.balance.toLocaleString()} ${currency}` : '-'}</span> },
              { key: "creditBalance", header: "رصيد دائن", cell: (r: any) => <span className={r.isGroupAccount ? 'font-bold text-lg' : ''}>{!r.isDebit && r.balance !== 0 ? `${r.balance.toLocaleString()} ${currency}` : '-'}</span> },
            ]}
          />
        </PageCard>
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
