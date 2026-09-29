import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { Wallet, Plus, CheckCircle2, XCircle, Clock, ArrowRightLeft, ArrowDownRight, ArrowUpRight, FileText, Calculator, AlertCircle, Coins, DollarSign, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminModal } from "@/components/admin/admin-modal";
import { FinanceNavTabs } from "@/components/finance/finance-nav";
const uuidv4 = () => Math.random().toString(36).substr(2, 9);

export const Route = createFileRoute("/finance/treasury")({
  component: FinanceTreasury,
});

function FinanceTreasury() {
  const { allTreasuries, allCashSessions, allPayments, allExpenses, allExpenseCategories, openCashSession, closeCashSession, currency, addPayment, addExpense, currentAcademicYearId } = useGlobalStore();
  
  const [selectedTreasury, setSelectedTreasury] = useState<string | null>(null);
  
  const [openSessionModal, setOpenSessionModal] = useState<boolean>(false);
  const [openingBalanceInput, setOpeningBalanceInput] = useState<number | string>("");
  const [closeSessionModalData, setCloseSessionModalData] = useState<{ sessionId: string, expectedBalance: number } | null>(null);
  const [actualBalanceInput, setActualBalanceInput] = useState<number | string>("");
  const [showDenominations, setShowDenominations] = useState(false);
  const [denominations, setDenominations] = useState<Record<number, number>>({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    1: 0,
  });

  const updateDenomination = (denom: number, count: number) => {
    const updated = { ...denominations, [denom]: Math.max(0, count) };
    setDenominations(updated);
    const sum = Object.entries(updated).reduce((acc, [d, c]) => acc + Number(d) * c, 0);
    setActualBalanceInput(sum);
  };

  const [receiptModal, setReceiptModal] = useState<{ sessionId: string, treasuryId: string } | null>(null);
  const [expenseModal, setExpenseModal] = useState<{ sessionId: string, treasuryId: string } | null>(null);

  const activeTreasuries = allTreasuries.filter(t => t.status === "active");

  const handleOpenSession = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTreasury) return;
    const formData = new FormData(e.currentTarget);
    const openingBalance = Number(formData.get("openingBalance"));
    
    openCashSession(selectedTreasury, "U-1001", openingBalance);
    toast.success("تم فتح الجلسة النقدية بنجاح");
    setOpenSessionModal(false);
  };

  const handleCloseSession = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!closeSessionModalData) return;
    const formData = new FormData(e.currentTarget);
    const actualClosingBalance = Number(formData.get("actualClosingBalance"));
    
    closeCashSession(closeSessionModalData.sessionId, actualClosingBalance);
    toast.success("تم إغلاق الجلسة ومطابقة النقدية");
    setCloseSessionModalData(null);
  };

  const handleAddReceipt = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!receiptModal) return;
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    const notes = formData.get("notes") as string;
    const referenceNo = formData.get("referenceNo") as string;
    const method = formData.get("method") as any;

    addPayment({
      amount,
      date: new Date().toISOString(),
      method,
      referenceNo,
      notes,
      sessionId: receiptModal.sessionId,
    });
    toast.success("تم إصدار سند القبض بنجاح");
    setReceiptModal(null);
  };

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!expenseModal) return;
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    const title = formData.get("title") as string;
    const beneficiary = formData.get("beneficiary") as string;
    const categoryId = formData.get("categoryId") as string;
    const notes = formData.get("notes") as string;
    const referenceNo = formData.get("referenceNo") as string;
    const method = formData.get("method") as any;

    addExpense({
      title,
      amount,
      date: new Date().toISOString(),
      categoryId,
      beneficiary,
      method,
      referenceNo,
      notes,
      status: "paid",
      sessionId: expenseModal.sessionId,
    });
    toast.success("تم إصدار سند الصرف بنجاح");
    setExpenseModal(null);
  };

  const getSessionTransactions = (sessionId: string) => {
    const receipts = allPayments.filter(p => p.sessionId === sessionId).map(p => ({
      id: p.id,
      date: p.date,
      type: 'receipt',
      amount: p.amount,
      description: p.notes || "سند قبض عام",
      method: p.method,
      reference: p.referenceNo
    }));

    const expenses = allExpenses.filter(e => e.sessionId === sessionId).map(e => ({
      id: e.id,
      date: e.date,
      type: 'expense',
      amount: e.amount,
      description: e.title,
      beneficiary: e.beneficiary,
      method: e.method,
      reference: e.referenceNo
    }));

    return [...receipts, ...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance" },
        { label: "إدارة الخزينة والتحصيل" },
      ]}
      actions={
        <button 
          onClick={() => {
            if (!selectedTreasury) {
              toast.error("الرجاء اختيار صندوق أولاً");
              return;
            }
            const hasOpenSession = allCashSessions.some(s => s.treasuryId === selectedTreasury && s.status === "open");
            if (hasOpenSession) {
              toast.error("يوجد جلسة مفتوحة بالفعل لهذا الصندوق");
              return;
            }
            setOpenSessionModal(true);
          }}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 text-sm font-bold shadow-sm hover:bg-primary/90 transition-all"
        >
          <Plus className="h-4 w-4" /> فتح جلسة نقدية جديدة
        </button>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <FinanceNavTabs activeTab="treasury" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Treasuries List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-primary" /> الصناديق
            </h3>
            {activeTreasuries.map(treasury => {
              const activeSession = allCashSessions.find(s => s.treasuryId === treasury.id && s.status === "open");
              
              return (
                <div 
                  key={treasury.id}
                  onClick={() => setSelectedTreasury(treasury.id)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedTreasury === treasury.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border/50 bg-card hover:border-primary/30 hover:shadow-sm'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg">{treasury.name}</h4>
                    {activeSession ? (
                      <Badge tone="success" className="animate-pulse shadow-sm shadow-success/20">مفتوح</Badge>
                    ) : (
                      <Badge tone="neutral">مغلق</Badge>
                    )}
                  </div>
                  <div className="text-2xl font-black text-primary mt-2">
                    {treasury.balance.toLocaleString()} {currency}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">GL Account: {treasury.accountId}</p>
                </div>
              );
            })}
          </div>

          {/* Treasury Details / Cash Sessions */}
          <div className="lg:col-span-3">
            {!selectedTreasury ? (
              <PageCard className="h-[600px] flex flex-col items-center justify-center p-12 text-center border-dashed">
                <Wallet className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-2xl font-bold text-muted-foreground">اختر صندوقاً للإدارة</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">قم بتحديد الصندوق لفتح الجلسات النقدية وإصدار سندات القبض والصرف وإدارة السيولة النقدية اليومية.</p>
              </PageCard>
            ) : (
              <div className="space-y-6">
                {/* Active Session Dashboard */}
                {allCashSessions.find(s => s.treasuryId === selectedTreasury && s.status === "open") && (
                  (() => {
                    const activeSession = allCashSessions.find(s => s.treasuryId === selectedTreasury && s.status === "open")!;
                    const transactions = getSessionTransactions(activeSession.id);
                    const totalReceipts = transactions.filter(t => t.type === 'receipt').reduce((sum, t) => sum + t.amount, 0);
                    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                    const currentCalculatedBalance = activeSession.openingBalance + totalReceipts - totalExpenses;

                    return (
                      <PageCard className="border-primary/20 shadow-lg shadow-primary/5 overflow-hidden">
                        <div className="bg-primary/5 p-4 -mx-6 -mt-6 mb-6 border-b border-primary/10 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-success/10 rounded-full text-success">
                              <Clock className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-primary">جلسة نقدية نشطة</h3>
                              <p className="text-sm text-muted-foreground">مفتوحة بواسطة: {activeSession.openedBy} - {new Date(activeSession.openedAt).toLocaleString('ar-EG')}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setCloseSessionModalData({ sessionId: activeSession.id, expectedBalance: currentCalculatedBalance });
                              setActualBalanceInput(currentCalculatedBalance);
                              setShowDenominations(false);
                              setDenominations({ 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0 });
                            }}
                            className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" /> إنهاء وإغلاق الجلسة ومطابقة النقدية
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="p-4 rounded-xl border border-border/50 bg-card">
                            <div className="text-sm font-bold text-muted-foreground mb-1">رصيد الفتح</div>
                            <div className="text-2xl font-black">{activeSession.openingBalance.toLocaleString()}</div>
                          </div>
                          <div className="p-4 rounded-xl border border-success/30 bg-success/5">
                            <div className="text-sm font-bold text-success mb-1 flex justify-between">
                              إجمالي المقبوضات <ArrowDownRight className="w-4 h-4" />
                            </div>
                            <div className="text-2xl font-black text-success">+{totalReceipts.toLocaleString()}</div>
                          </div>
                          <div className="p-4 rounded-xl border border-danger/30 bg-danger/5">
                            <div className="text-sm font-bold text-danger mb-1 flex justify-between">
                              إجمالي المصروفات <ArrowUpRight className="w-4 h-4" />
                            </div>
                            <div className="text-2xl font-black text-danger">-{totalExpenses.toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="flex gap-4 mb-6">
                          <button 
                            onClick={() => setReceiptModal({ sessionId: activeSession.id, treasuryId: selectedTreasury })}
                            className="flex-1 flex items-center justify-center gap-2 bg-success text-white py-3 rounded-xl font-bold hover:bg-success/90 transition-colors shadow-sm"
                          >
                            <ArrowDownRight className="w-5 h-5" /> إصدار سند قبض (إيراد)
                          </button>
                          <button 
                            onClick={() => setExpenseModal({ sessionId: activeSession.id, treasuryId: selectedTreasury })}
                            className="flex-1 flex items-center justify-center gap-2 bg-danger text-white py-3 rounded-xl font-bold hover:bg-danger/90 transition-colors shadow-sm"
                          >
                            <ArrowUpRight className="w-5 h-5" /> إصدار سند صرف (مصروف)
                          </button>
                        </div>

                        {transactions.length > 0 ? (
                          <div className="border rounded-lg overflow-hidden">
                            <div className="bg-muted px-4 py-2 text-sm font-bold border-b flex justify-between items-center">
                              <span>حركات الجلسة الحالية</span>
                              <Badge tone="primary">{transactions.length} حركة</Badge>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                              {transactions.map(t => (
                                <div key={t.id} className="p-3 border-b last:border-0 hover:bg-muted/30 flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${t.type === 'receipt' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                      {t.type === 'receipt' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                    </div>
                                    <div>
                                      <div className="font-bold text-sm">{t.description}</div>
                                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                                        <span>{new Date(t.date).toLocaleTimeString('ar-EG')}</span>
                                        {t.method && <Badge tone="neutral" className="text-[10px] scale-90 origin-right">{t.method}</Badge>}
                                      </div>
                                    </div>
                                  </div>
                                  <div className={`font-black ${t.type === 'receipt' ? 'text-success' : 'text-danger'}`}>
                                    {t.type === 'receipt' ? '+' : '-'}{t.amount.toLocaleString()} {currency}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground">
                            لا توجد حركات مالية في هذه الجلسة حتى الآن
                          </div>
                        )}
                      </PageCard>
                    );
                  })()
                )}

                {/* Historical Sessions */}
                <PageCard>
                  <h3 className="text-xl font-black mb-6">سجل جلسات النقدية (تاريخي)</h3>
                  <DataTable
                    columns={[
                      { key: "sessionInfo", header: "معلومات الجلسة", cell: (session: any) => (
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${session.status === 'open' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                              {session.status === 'open' ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="font-bold text-sm">{session.openedBy}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {new Date(session.openedAt).toLocaleString('ar-EG')}
                              </div>
                            </div>
                          </div>
                        )
                      },
                      { key: "openingBalance", header: "رصيد الفتح", cell: (session: any) => (
                          <span className="font-medium">{session.openingBalance.toLocaleString()}</span>
                        )
                      },
                      { key: "closingBalance", header: "الرصيد الفعلي (للإغلاق)", cell: (session: any) => (
                          <span className="font-bold">{session.actualClosingBalance !== undefined ? session.actualClosingBalance.toLocaleString() : '-'}</span>
                        )
                      },
                      { key: "status", header: "الحالة والمطابقة", cell: (session: any) => (
                          session.status === 'open' ? (
                            <Badge tone="success" className="animate-pulse shadow-sm shadow-success/20">مفتوحة</Badge>
                          ) : (
                            <Badge tone={session.difference === 0 ? "success" : "danger"}>
                              {session.difference === 0 ? "مطابق" : `فروقات: ${session.difference}`}
                            </Badge>
                          )
                        )
                      }
                    ]}
                    rows={allCashSessions.filter(s => s.treasuryId === selectedTreasury)}
                    pageSize={10}
                    pageSizeOptions={[5, 10, 25, 50]}
                  />
                </PageCard>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modals */}
      {/* Open Session Modal */}
      <AdminModal
        isOpen={openSessionModal}
        onClose={() => setOpenSessionModal(false)}
        title="فتح وردية / جلسة نقدية جديدة"
        description="تسجيل رصيد بداية العهدة لفتح الصندوق والمباشرة بالعمليات"
        icon={Wallet}
        tone="primary"
        maxWidth="lg"
      >
        <form onSubmit={handleOpenSession} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/70 flex items-center justify-between text-xs">
            <div>
              <span className="text-muted-foreground block font-bold">الصندوق المستهدف:</span>
              <span className="font-extrabold text-foreground text-sm">
                {allTreasuries.find(t => t.id === selectedTreasury)?.name || "الصندوق الرئيسي"}
              </span>
            </div>
            <div className="text-left font-mono">
              <span className="text-muted-foreground block text-[10px]">الرصيد الدفتري المسجل:</span>
              <span className="font-black text-primary text-sm">
                {(allTreasuries.find(t => t.id === selectedTreasury)?.balance || 0).toLocaleString()} {currency}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              رصيد الفتح الفعلي بالدرج ({currency}) <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="number" 
                name="openingBalance" 
                required 
                min="0" 
                value={openingBalanceInput}
                onChange={(e) => setOpeningBalanceInput(e.target.value)}
                placeholder="0.00"
                className="w-full h-12 rounded-xl border border-input bg-background/80 pr-10 pl-4 text-xl font-black tabular-nums text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all" 
              />
            </div>
            
            {/* Presets */}
            <div className="flex items-center gap-1.5 mt-2 text-[11px]">
              <span className="text-muted-foreground">خيارات سريعة:</span>
              <button
                type="button"
                onClick={() => setOpeningBalanceInput(allTreasuries.find(t => t.id === selectedTreasury)?.balance || 0)}
                className="px-2 py-0.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold transition-all"
              >
                نفس الرصيد الدفتري
              </button>
              <button
                type="button"
                onClick={() => setOpeningBalanceInput(0)}
                className="px-2 py-0.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-bold transition-all"
              >
                درج فارغ (0)
              </button>
              <button
                type="button"
                onClick={() => setOpeningBalanceInput(500)}
                className="px-2 py-0.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-bold transition-all"
              >
                عهدة 500
              </button>
              <button
                type="button"
                onClick={() => setOpeningBalanceInput(1000)}
                className="px-2 py-0.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-bold transition-all"
              >
                عهدة 1,000
              </button>
            </div>
          </div>

          <div className="pt-4 flex gap-2.5 border-t border-border/70">
            <button type="button" onClick={() => setOpenSessionModal(false)} className="h-11 px-5 rounded-xl border border-input bg-background/80 hover:bg-accent text-xs font-semibold active:scale-[0.98] transition-all">
              إلغاء
            </button>
            <button type="submit" className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-extrabold text-xs shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all glow-primary flex items-center justify-center gap-2">
              <Wallet className="w-4 h-4" /> تأكيد وفتح الجلسة
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Close Session Modal with Denomination Counter & Live Difference */}
      <AdminModal
        isOpen={!!closeSessionModalData}
        onClose={() => setCloseSessionModalData(null)}
        title="جرد وإغلاق الجلسة ومطابقة النقدية"
        description="جرد محتويات الدرج الفعلي ومقارنته بالرصيد الدفتري المسجل للنظام"
        icon={CheckCircle2}
        tone="danger"
        maxWidth="xl"
      >
        {closeSessionModalData && (
          <form onSubmit={handleCloseSession} className="space-y-4">
            {/* Expected vs Actual Summary Card */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-2xl border border-border/70">
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground">الرصيد الدفتري المتوقع:</span>
                <div className="font-black text-xl tabular-nums text-foreground">
                  {closeSessionModalData.expectedBalance.toLocaleString()} {currency}
                </div>
              </div>
              <div className="space-y-1 text-left">
                <span className="text-xs font-bold text-muted-foreground">المبلغ الفعلي المدخل:</span>
                <div className="font-black text-xl tabular-nums text-primary">
                  {(Number(actualBalanceInput) || 0).toLocaleString()} {currency}
                </div>
              </div>
            </div>

            {/* Live Match / Discrepancy Status */}
            {(() => {
              const actual = Number(actualBalanceInput) || 0;
              const expected = closeSessionModalData.expectedBalance;
              const diff = actual - expected;

              if (diff === 0) {
                return (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>مطابقة تامة ومثالية (لا يوجد أي عجز أو فائض)</span>
                    </div>
                    <Badge className="bg-emerald-600 text-white font-mono">0 {currency}</Badge>
                  </div>
                );
              } else if (diff > 0) {
                return (
                  <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="w-4 h-4 text-blue-500" />
                      <span>يوجد فائض نقدي بالدرج عن الرصيد المسجل:</span>
                    </div>
                    <Badge className="bg-blue-600 text-white font-mono">+{diff.toLocaleString()} {currency}</Badge>
                  </div>
                );
              } else {
                return (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      <span>تنبيه: يوجد عجز نقدي في الدرج بمقدار:</span>
                    </div>
                    <Badge className="bg-rose-600 text-white font-mono">{diff.toLocaleString()} {currency}</Badge>
                  </div>
                );
              }
            })()}

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-foreground">
                  الرصيد الفعلي الموجود بالدرج ({currency}) <span className="text-destructive">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowDenominations(!showDenominations)}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  {showDenominations ? "إخفاء حاسبة الفئات" : "استخدام حاسبة الفئات النقدية"}
                </button>
              </div>
              <input 
                type="number" 
                name="actualClosingBalance" 
                required 
                min="0" 
                value={actualBalanceInput}
                onChange={(e) => setActualBalanceInput(e.target.value)}
                className="w-full h-12 rounded-xl border-2 border-primary/30 bg-background/90 px-4 text-2xl font-black tabular-nums text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all" 
              />
            </div>

            {/* Denominations Calculator Grid */}
            {showDenominations && (
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3 animate-in fade-in duration-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-foreground flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-500" /> عدّ فئات النقد الورقي والمعدني:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDenominations({ 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0 });
                      setActualBalanceInput(0);
                    }}
                    className="text-[11px] text-muted-foreground hover:text-destructive underline"
                  >
                    تصفير العداد
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[500, 200, 100, 50, 20, 10, 5, 1].map((denom) => (
                    <div key={denom} className="p-2 rounded-xl bg-background border border-border/60 text-center space-y-1">
                      <div className="font-bold text-[11px] text-muted-foreground">فئة {denom} ر.س</div>
                      <input
                        type="number"
                        min="0"
                        value={denominations[denom] || ""}
                        placeholder="0"
                        onChange={(e) => updateDenomination(denom, Number(e.target.value) || 0)}
                        className="h-8 w-full text-center font-black tabular-nums text-foreground border border-input rounded-lg text-xs outline-none focus:border-primary"
                      />
                      <div className="text-[10px] text-primary font-mono font-bold">
                        = {((denominations[denom] || 0) * denom).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 flex gap-2.5 border-t border-border/70">
              <button type="button" onClick={() => setCloseSessionModalData(null)} className="h-11 px-5 rounded-xl border border-input bg-background/80 hover:bg-accent text-xs font-semibold active:scale-[0.98] transition-all">
                رجوع
              </button>
              <button type="submit" className="flex-1 h-11 rounded-xl bg-gradient-to-r from-destructive to-rose-600 text-white font-extrabold text-xs shadow-md hover:from-destructive/90 hover:to-rose-600/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> تأكيد الإغلاق وترحيل المطابقة
              </button>
            </div>
          </form>
        )}
      </AdminModal>

      {/* Receipt Modal */}
      <AdminModal
        isOpen={!!receiptModal}
        onClose={() => setReceiptModal(null)}
        title="إصدار سند قبض وإيداع نقدي"
        description="توريد مبالغ نقدية إضافية لحساب الجلسة المفتوحة"
        icon={ArrowDownRight}
        tone="success"
        maxWidth="lg"
      >
        <form onSubmit={handleAddReceipt} className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-foreground mb-1.5">المبلغ ({currency}) <span className="text-destructive">*</span></label>
              <div className="relative">
                <DollarSign className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="number" 
                  name="amount" 
                  required 
                  min="1" 
                  placeholder="0.00"
                  className="w-full h-11 rounded-xl border border-input bg-background/80 pr-10 pl-3.5 text-sm font-black tabular-nums text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all" 
                />
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-foreground mb-1.5">طريقة الدفع <span className="text-destructive">*</span></label>
              <select name="method" required className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all cursor-pointer">
                <option value="cash">نقدي (كاش بالدرج)</option>
                <option value="card">بطاقة / مدى</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="cheque">شيك مصرفي</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-foreground mb-1.5">البيان ومصدر الإيراد <span className="text-destructive">*</span></label>
              <input 
                type="text" 
                name="notes" 
                required 
                placeholder="مثال: إيرادات بوفيه، بيع كتب، توريد عهدة إضافية..." 
                className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60" 
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-foreground mb-1.5">رقم المرجع (اختياري)</label>
              <input 
                type="text" 
                name="referenceNo" 
                placeholder="رقم إيصال أو عملية بنكية" 
                className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60" 
              />
            </div>
          </div>
          <div className="pt-4 flex gap-2.5 border-t border-border/70">
            <button type="button" onClick={() => setReceiptModal(null)} className="h-11 px-5 rounded-xl border border-input bg-background/80 hover:bg-accent text-xs font-semibold active:scale-[0.98] transition-all">
              إلغاء
            </button>
            <button type="submit" className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs shadow-md hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <ArrowDownRight className="w-4 h-4" /> حفظ وتوريد النقدية
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Expense Modal */}
      <AdminModal
        isOpen={!!expenseModal}
        onClose={() => setExpenseModal(null)}
        title="إصدار سند صرف نقدي فوري"
        description="صرف مبلغ مالي لمستفيد مع خصمه المباشر من رصيد الجلسة"
        icon={ArrowUpRight}
        tone="danger"
        maxWidth="lg"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-foreground mb-1.5">عنوان وبند المصروف <span className="text-destructive">*</span></label>
              <input 
                type="text" 
                name="title" 
                required 
                placeholder="مثال: صيانة طارئة، مشتريات ضيافة، أدوات نظافة..." 
                className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60" 
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-foreground mb-1.5">المبلغ المصروف ({currency}) <span className="text-destructive">*</span></label>
              <div className="relative">
                <DollarSign className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="number" 
                  name="amount" 
                  required 
                  min="1" 
                  placeholder="0.00"
                  className="w-full h-11 rounded-xl border border-input bg-background/80 pr-10 pl-3.5 text-sm font-black tabular-nums text-destructive outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all" 
                />
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-foreground mb-1.5">التصنيف المالي <span className="text-destructive">*</span></label>
              <select name="categoryId" required className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all cursor-pointer">
                {allExpenseCategories?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-foreground mb-1.5">المستفيد / المستلم <span className="text-destructive">*</span></label>
              <input 
                type="text" 
                name="beneficiary" 
                required 
                placeholder="اسم الفني أو الشركة المستلمة" 
                className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60" 
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-foreground mb-1.5">طريقة الدفع <span className="text-destructive">*</span></label>
              <select name="method" required className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all cursor-pointer">
                <option value="cash">نقدي (كاش من الدرج)</option>
                <option value="card">بطاقة / مدى</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="cheque">شيك مصرفي</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-foreground mb-1.5">رقم المرجع وملاحظات (اختياري)</label>
              <input 
                type="text" 
                name="notes" 
                placeholder="تفاصيل إضافية أو رقم الفاتورة المرفقة..." 
                className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60" 
              />
            </div>
          </div>
          <div className="pt-4 flex gap-2.5 border-t border-border/70">
            <button type="button" onClick={() => setExpenseModal(null)} className="h-11 px-5 rounded-xl border border-input bg-background/80 hover:bg-accent text-xs font-semibold active:scale-[0.98] transition-all">
              إلغاء
            </button>
            <button type="submit" className="flex-1 h-11 rounded-xl bg-destructive text-destructive-foreground font-extrabold text-xs shadow-md hover:bg-destructive/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <ArrowUpRight className="w-4 h-4" /> اعتماد وصرف المبلغ
            </button>
          </div>
        </form>
      </AdminModal>

    </AppShell>
  );
}
