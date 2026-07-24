import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { Wallet, Plus, CheckCircle2, XCircle, Clock, ArrowRightLeft, ArrowDownRight, ArrowUpRight, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
const uuidv4 = () => Math.random().toString(36).substr(2, 9);

export const Route = createFileRoute("/finance/treasury")({
  component: FinanceTreasury,
});

function FinanceTreasury() {
  const { allTreasuries, allCashSessions, allPayments, allExpenses, allExpenseCategories, openCashSession, closeCashSession, currency, addPayment, addExpense, currentAcademicYearId } = useGlobalStore();
  
  const [selectedTreasury, setSelectedTreasury] = useState<string | null>(null);
  
  const [openSessionModal, setOpenSessionModal] = useState<boolean>(false);
  const [closeSessionModalData, setCloseSessionModalData] = useState<{ sessionId: string, expectedBalance: number } | null>(null);

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
                            onClick={() => setCloseSessionModalData({ sessionId: activeSession.id, expectedBalance: currentCalculatedBalance })}
                            className="bg-danger/10 text-danger hover:bg-danger hover:text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                          >
                            إنهاء وإغلاق الجلسة
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
      {openSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/30">
              <h3 className="font-bold flex items-center gap-2"><Wallet className="w-5 h-5 text-primary" /> فتح جلسة نقدية</h3>
              <button onClick={() => setOpenSessionModal(false)} className="p-1 hover:bg-accent rounded-md"><XCircle className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleOpenSession} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">رصيد الفتح الفعلي ({currency})</label>
                <input type="number" name="openingBalance" required min="0" defaultValue={allTreasuries.find(t => t.id === selectedTreasury)?.balance || 0} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 text-xl font-bold" />
                <p className="text-xs text-muted-foreground mt-1">قم بعد النقدية الموجودة فعلياً في الصندوق الآن لتسجيل رصيد بداية المدة للجلسة.</p>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 btn-primary">تأكيد وفتح الجلسة</button>
                <button type="button" onClick={() => setOpenSessionModal(false)} className="flex-1 btn-secondary">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Session Modal */}
      {closeSessionModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl shadow-danger/10 border border-border overflow-hidden">
            <div className="p-4 border-b border-border/50 flex justify-between items-center bg-danger/5">
              <h3 className="font-bold flex items-center gap-2 text-danger"><CheckCircle2 className="w-5 h-5" /> إغلاق الجلسة ومطابقة النقدية</h3>
              <button onClick={() => setCloseSessionModalData(null)} className="p-1 hover:bg-accent rounded-md"><XCircle className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCloseSession} className="p-6 space-y-4">
              <div className="p-4 bg-muted rounded-xl flex justify-between items-center border border-border/50">
                <span className="text-sm font-bold text-muted-foreground">الرصيد الدفتري المتوقع:</span>
                <span className="font-black text-2xl">{closeSessionModalData.expectedBalance.toLocaleString()} {currency}</span>
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">الرصيد الفعلي (الموجود بالدرج) ({currency})</label>
                <input type="number" name="actualClosingBalance" required min="0" className="w-full px-4 py-3 border-2 border-primary/20 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 text-2xl font-black transition-all" />
                <p className="text-xs text-muted-foreground mt-1">أدخل المبلغ الموجود فعلياً بعد عدّه لمطابقته مع النظام</p>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 btn-primary bg-danger hover:bg-danger/90">تأكيد وإغلاق الجلسة</button>
                <button type="button" onClick={() => setCloseSessionModalData(null)} className="flex-1 btn-secondary">رجوع</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border/50 flex justify-between items-center bg-success/5">
              <h3 className="font-bold flex items-center gap-2 text-success"><ArrowDownRight className="w-5 h-5" /> إصدار سند قبض عام</h3>
              <button onClick={() => setReceiptModal(null)} className="p-1 hover:bg-accent rounded-md"><XCircle className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddReceipt} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 lg:col-span-1">
                  <label className="block text-sm font-bold text-muted-foreground mb-1">المبلغ ({currency})</label>
                  <input type="number" name="amount" required min="1" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-success/50 font-bold" />
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <label className="block text-sm font-bold text-muted-foreground mb-1">طريقة الدفع</label>
                  <select name="method" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-success/50">
                    <option value="cash">نقدي</option>
                    <option value="card">بطاقة / شبكة</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="cheque">شيك</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-muted-foreground mb-1">البيان / ملاحظات</label>
                  <input type="text" name="notes" required placeholder="مثال: إيرادات متفرقة, بيع زي مدرسي..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-success/50" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-muted-foreground mb-1">رقم المرجع (اختياري)</label>
                  <input type="text" name="referenceNo" placeholder="رقم إيصال أو عملية بنكية" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-success/50" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 btn-primary bg-success hover:bg-success/90">حفظ وطباعة</button>
                <button type="button" onClick={() => setReceiptModal(null)} className="flex-1 btn-secondary">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {expenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border/50 flex justify-between items-center bg-danger/5">
              <h3 className="font-bold flex items-center gap-2 text-danger"><ArrowUpRight className="w-5 h-5" /> إصدار سند صرف</h3>
              <button onClick={() => setExpenseModal(null)} className="p-1 hover:bg-accent rounded-md"><XCircle className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-muted-foreground mb-1">عنوان المصروف</label>
                  <input type="text" name="title" required placeholder="مثال: صيانة كهرباء, مشتريات بوفيه..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-danger/50" />
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <label className="block text-sm font-bold text-muted-foreground mb-1">المبلغ ({currency})</label>
                  <input type="number" name="amount" required min="1" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-danger/50 font-bold text-danger" />
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <label className="block text-sm font-bold text-muted-foreground mb-1">التصنيف</label>
                  <select name="categoryId" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-danger/50">
                    {allExpenseCategories?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <label className="block text-sm font-bold text-muted-foreground mb-1">المستفيد</label>
                  <input type="text" name="beneficiary" required placeholder="اسم المستلم / الشركة" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-danger/50" />
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <label className="block text-sm font-bold text-muted-foreground mb-1">طريقة الدفع</label>
                  <select name="method" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-danger/50">
                    <option value="cash">نقدي</option>
                    <option value="card">بطاقة / شبكة</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="cheque">شيك</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-muted-foreground mb-1">رقم المرجع وملاحظات (اختياري)</label>
                  <input type="text" name="notes" placeholder="تفاصيل إضافية..." className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-danger/50" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 btn-primary bg-danger hover:bg-danger/90">اعتماد وصرف</button>
                <button type="button" onClick={() => setExpenseModal(null)} className="flex-1 btn-secondary">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AppShell>
  );
}
