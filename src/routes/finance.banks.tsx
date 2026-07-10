import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { Building2, Plus, ArrowRightLeft, Upload, FileText, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/finance/banks")({
  component: FinanceBanks,
});

function FinanceBanks() {
  const { allBankAccounts, currency } = useGlobalStore();
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  const activeBanks = allBankAccounts.filter(b => b.status === "active");

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance" },
        { label: "الحسابات البنكية" },
      ]}
      actions={
        <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 text-sm font-bold shadow-sm hover:bg-primary/90 transition-all">
          <Plus className="h-4 w-4" /> إضافة حساب بنكي
        </button>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PageCard className="p-6 flex flex-col justify-center items-center text-center bg-blue-500/5 border-blue-500/20">
            <Building2 className="w-10 h-10 text-blue-500 mb-2" />
            <p className="text-sm font-bold text-muted-foreground">إجمالي الأرصدة البنكية</p>
            <p className="text-3xl font-black mt-2">
              {activeBanks.reduce((sum, b) => sum + b.balance, 0).toLocaleString()} {currency}
            </p>
          </PageCard>
          <PageCard className="p-6 flex flex-col justify-center items-center text-center">
            <ArrowRightLeft className="w-10 h-10 text-emerald-500 mb-2" />
            <p className="text-sm font-bold text-muted-foreground">حركات الإيداع (هذا الشهر)</p>
            <p className="text-3xl font-black mt-2">0 {currency}</p>
          </PageCard>
          <PageCard className="p-6 flex flex-col justify-center items-center text-center">
            <ArrowRightLeft className="w-10 h-10 text-rose-500 mb-2" />
            <p className="text-sm font-bold text-muted-foreground">حركات السحب (هذا الشهر)</p>
            <p className="text-3xl font-black mt-2">0 {currency}</p>
          </PageCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Banks List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-primary" /> الحسابات المتوفرة
            </h3>
            {activeBanks.map(bank => (
              <div 
                key={bank.id}
                onClick={() => setSelectedBank(bank.id)}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedBank === bank.id ? 'border-primary bg-primary/5' : 'border-border/50 bg-card hover:border-primary/30'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-lg">{bank.bankName}</h4>
                  <Badge variant="success">نشط</Badge>
                </div>
                <div className="text-sm font-bold text-muted-foreground mb-4">{bank.accountName} - {bank.accountNumber}</div>
                <div className="text-2xl font-black text-primary">
                  {bank.balance.toLocaleString()} {currency}
                </div>
              </div>
            ))}
          </div>

          {/* Bank Reconciliation for Selected Bank */}
          <div className="lg:col-span-2">
            {!selectedBank ? (
              <PageCard className="h-full flex flex-col items-center justify-center p-12 text-center border-dashed">
                <Building2 className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-muted-foreground">اختر حساباً بنكياً لعرض التفاصيل</h3>
                <p className="text-sm text-muted-foreground mt-2">يمكنك استعراض كشف الحساب وعمل المطابقة البنكية</p>
              </PageCard>
            ) : (
              <PageCard className="h-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black">المطابقة البنكية (Bank Reconciliation)</h3>
                  <button className="btn-secondary text-xs h-8"><Upload className="w-3 h-3 ml-1" /> رفع كشف حساب (CSV)</button>
                </div>
                
                <div className="p-8 border border-dashed border-border/50 rounded-xl bg-muted/10 text-center flex flex-col items-center justify-center">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-lg font-bold text-muted-foreground">ميزة المطابقة البنكية الآلية</p>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                    قم برفع كشف الحساب البنكي بصيغة CSV أو Excel ليقوم النظام بمطابقة الحركات آلياً مع القيود المحاسبية المسجلة.
                  </p>
                  <button className="btn-primary mt-6"><CheckCircle2 className="w-4 h-4 ml-1" /> ابدأ المطابقة اليدوية</button>
                </div>
              </PageCard>
            )}
          </div>

        </div>
      </div>
    </AppShell>
  );
}
