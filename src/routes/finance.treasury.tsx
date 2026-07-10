import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { Wallet, Plus, CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/finance/treasury")({
  component: FinanceTreasury,
});

function FinanceTreasury() {
  const { allTreasuries, allCashSessions, currency, openCashSession, closeCashSession } = useGlobalStore();
  const [selectedTreasury, setSelectedTreasury] = useState<string | null>(null);
  
  const [openSessionModal, setOpenSessionModal] = useState<boolean>(false);
  const [closeSessionModalData, setCloseSessionModalData] = useState<{ sessionId: string, expectedBalance: number } | null>(null);

  const handleOpenSession = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTreasury) return;
    const formData = new FormData(e.currentTarget);
    const openingBalance = Number(formData.get("openingBalance"));
    
    openCashSession(selectedTreasury, openingBalance);
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

  const activeTreasuries = allTreasuries.filter(t => t.status === "active");

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance" },
        { label: "الخزينة (الصندوق)" },
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Treasuries List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-primary" /> صناديق الكاش
            </h3>
            {activeTreasuries.map(treasury => {
              const activeSession = allCashSessions.find(s => s.treasuryId === treasury.id && s.status === "open");
              
              return (
                <div 
                  key={treasury.id}
                  onClick={() => setSelectedTreasury(treasury.id)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedTreasury === treasury.id ? 'border-primary bg-primary/5' : 'border-border/50 bg-card hover:border-primary/30'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg">{treasury.name}</h4>
                    {activeSession ? (
                      <Badge variant="success" className="animate-pulse">جلسة مفتوحة</Badge>
                    ) : (
                      <Badge variant="secondary">مغلق</Badge>
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

          {/* Cash Sessions for Selected Treasury */}
          <div className="lg:col-span-2">
            {!selectedTreasury ? (
              <PageCard className="h-full flex flex-col items-center justify-center p-12 text-center border-dashed">
                <Wallet className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-muted-foreground">اختر صندوقاً لعرض الجلسات النقدية</h3>
                <p className="text-sm text-muted-foreground mt-2">يمكنك فتح وإغلاق الجلسات النقدية ومطابقة النقدية في الصندوق</p>
              </PageCard>
            ) : (
              <PageCard className="h-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black">جلسات النقدية للصندوق</h3>
                </div>
                
                <div className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
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
                      { key: "closingBalance", header: "الرصيد الفعلي", cell: (session: any) => (
                          <span className="font-bold">{session.actualClosingBalance ? session.actualClosingBalance.toLocaleString() : '-'}</span>
                        )
                      },
                      { key: "status", header: "الحالة والمطابقة", cell: (session: any) => (
                          session.status === 'open' ? (
                            <Badge variant="success" className="animate-pulse">مفتوحة</Badge>
                          ) : (
                            <Badge variant={session.difference === 0 ? "success" : "danger"}>
                              {session.difference === 0 ? "مطابق" : `فروقات: ${session.difference}`}
                            </Badge>
                          )
                        )
                      },
                      { key: "actions", header: "إجراءات", cell: (session: any) => (
                          session.status === 'open' ? (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const treasury = allTreasuries.find(t => t.id === session.treasuryId);
                                const expectedClosing = treasury?.balance ?? session.openingBalance;
                                setCloseSessionModalData({ sessionId: session.id, expectedBalance: expectedClosing });
                              }}
                              className="text-xs font-bold bg-danger/10 text-danger hover:bg-danger hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                            >
                              إغلاق الجلسة
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">مغلقة</span>
                          )
                        )
                      }
                    ]}
                    rows={allCashSessions.filter(s => s.treasuryId === selectedTreasury)}
                    pageSize={10}
                    pageSizeOptions={[5, 10, 25, 50]}
                  />
                </div>
              </PageCard>
            )}
          </div>

        </div>
      </div>

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
                <input type="number" name="openingBalance" required min="0" defaultValue={allTreasuries.find(t => t.id === selectedTreasury)?.balance || 0} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50" />
                <p className="text-xs text-muted-foreground mt-1">قم بعد النقدية الموجودة فعلياً في الصندوق الآن</p>
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
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/30">
              <h3 className="font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-danger" /> إغلاق الجلسة ومطابقة النقدية</h3>
              <button onClick={() => setCloseSessionModalData(null)} className="p-1 hover:bg-accent rounded-md"><XCircle className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCloseSession} className="p-6 space-y-4">
              <div className="p-3 bg-muted rounded-lg flex justify-between items-center">
                <span className="text-sm font-bold text-muted-foreground">الرصيد الدفتري المتوقع:</span>
                <span className="font-black text-lg">{closeSessionModalData.expectedBalance.toLocaleString()} {currency}</span>
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">الرصيد الفعلي (الموجود بالدرج) ({currency})</label>
                <input type="number" name="actualClosingBalance" required min="0" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 text-xl font-bold" />
                <p className="text-xs text-muted-foreground mt-1">أدخل المبلغ الموجود فعلياً بعد عدّه</p>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 btn-primary bg-danger hover:bg-danger/90">إغلاق الجلسة</button>
                <button type="button" onClick={() => setCloseSessionModalData(null)} className="flex-1 btn-secondary">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}


    </AppShell>
  );
}
