import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { usePaymentEngine } from "@/engines/finance/usePaymentEngine";
import { Search, Filter, Printer, CheckCircle2, AlertTriangle, Users, Wallet, CreditCard, ChevronDown, Plus, X } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/finance/students")({
  component: FinanceStudents,
});

function FinanceStudents() {
  const { stage, getStageLabel } = useStage();
  const { activeStageStudents, activeStageInvoices, currency, allPayments, addInvoice } = useGlobalStore();
  const { receiveLumpSumPayment } = usePaymentEngine();
  
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | arrears | paid
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  // Compute financial stats per student
  const studentFinancials = useMemo(() => {
    return activeStageStudents.map(student => {
      const studentInvoices = activeStageInvoices.filter(inv => inv.studentId === student.id && inv.status !== "cancelled");
      
      const totalFees = studentInvoices.reduce((sum, inv) => sum + (inv.netAmount ?? inv.amount), 0);
      const totalPaid = studentInvoices.reduce((sum, inv) => sum + inv.paid, 0);
      const totalDue = totalFees - totalPaid;

      return {
        ...student,
        totalFees,
        totalPaid,
        totalDue,
        invoices: studentInvoices
      };
    }).filter(s => {
      if (q && !s.name.includes(q) && !s.id.includes(q)) return false;
      if (statusFilter === "arrears" && s.totalDue <= 0) return false;
      if (statusFilter === "paid" && (s.totalDue > 0 || s.totalFees === 0)) return false;
      return true;
    });
  }, [activeStageStudents, activeStageInvoices, q, statusFilter]);

  // Aggregate Stats
  const aggregateStats = useMemo(() => {
    let totalExpected = 0;
    let totalCollected = 0;
    let totalArrears = 0;
    studentFinancials.forEach(s => {
      totalExpected += s.totalFees;
      totalCollected += s.totalPaid;
      totalArrears += s.totalDue;
    });
    return { totalExpected, totalCollected, totalArrears, count: studentFinancials.length };
  }, [studentFinancials]);

  const [statementModalData, setStatementModalData] = useState<any | null>(null);

  const [paymentModalData, setPaymentModalData] = useState<{ studentId: string, studentName: string } | null>(null);
  const [chargeModalData, setChargeModalData] = useState<{ studentId: string, studentName: string } | null>(null);

  const handleRecordPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!paymentModalData) return;
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    const method = formData.get("method") as "cash" | "bank_transfer" | "card" | "cheque";
    const notes = formData.get("notes") as string;
    
    try {
      receiveLumpSumPayment(
        paymentModalData.studentId, 
        amount, 
        method, 
        "gl-treasury-main" // Assuming default treasury
      );
      toast.success("تم تسجيل الدفعة بنجاح وتوليد القيود المحاسبية");
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء تسجيل الدفعة");
    }
    setPaymentModalData(null);
  };

  const handleAddCharge = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!chargeModalData) return;
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    const title = formData.get("title") as string;
    
    addInvoice({
      studentId: chargeModalData.studentId,
      studentName: chargeModalData.studentName,
      stage,
      amount,
      title,
      dueDate: new Date().toISOString().split("T")[0],
      issueDate: new Date().toISOString().split("T")[0],
    });
    toast.success("تم إضافة الرسوم بنجاح");
    setChargeModalData(null);
  };



  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance" },
        { label: "المالية الطلابية" },
      ]}
      actions={
        <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 text-sm font-bold shadow-sm hover:bg-primary/90 transition-all">
          <Printer className="h-4 w-4" /> طباعة كشف المتأخرات
        </button>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        
        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <PageCard className="p-4 flex items-center gap-4 bg-primary/5 border-primary/20">
            <div className="p-3 bg-primary/10 text-primary rounded-xl"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-bold text-muted-foreground">عدد الطلاب</p>
              <p className="text-2xl font-black">{aggregateStats.count}</p>
            </div>
          </PageCard>
          <PageCard className="p-4 flex items-center gap-4 border-l-4 border-l-blue-500">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Wallet className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-bold text-muted-foreground">إجمالي الرسوم المستحقة</p>
              <p className="text-xl font-black">{aggregateStats.totalExpected.toLocaleString()} {currency}</p>
            </div>
          </PageCard>
          <PageCard className="p-4 flex items-center gap-4 border-l-4 border-l-success">
            <div className="p-3 bg-success/10 text-success rounded-xl"><CheckCircle2 className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-bold text-muted-foreground">المدفوع (المحصل)</p>
              <p className="text-xl font-black text-success">{aggregateStats.totalCollected.toLocaleString()} {currency}</p>
            </div>
          </PageCard>
          <PageCard className="p-4 flex items-center gap-4 border-l-4 border-l-danger">
            <div className="p-3 bg-danger/10 text-danger rounded-xl"><AlertTriangle className="w-6 h-6" /></div>
            <div>
              <p className="text-sm font-bold text-muted-foreground">المتبقي (المتأخرات)</p>
              <p className="text-xl font-black text-danger">{aggregateStats.totalArrears.toLocaleString()} {currency}</p>
            </div>
          </PageCard>
        </div>

        {/* Toolbar */}
        <PageCard className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-card">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="البحث باسم الطالب أو الرقم..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-4 pr-10 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">جميع الحالات المالية</option>
              <option value="arrears">عليهم متأخرات فقط</option>
              <option value="paid">مسددين بالكامل</option>
            </select>
          </div>
        </PageCard>

        {/* List */}
        <div className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
          <DataTable
            columns={[
              { key: "id", header: "رقم الطالب", cell: (r: any) => <span className="text-muted-foreground font-mono">{r.id}</span> },
              { key: "name", header: "اسم الطالب", cell: (r: any) => (
                  <div>
                    <div className="font-bold">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.grade}</div>
                  </div>
                )
              },
              { key: "totalFees", header: "إجمالي الرسوم", cell: (r: any) => <span className="font-medium">{r.totalFees.toLocaleString()} {currency}</span> },
              { key: "totalPaid", header: "المدفوع", cell: (r: any) => <span className="text-success font-bold">{r.totalPaid.toLocaleString()} {currency}</span> },
              { key: "totalDue", header: "المتبقي (متأخرات)", cell: (r: any) => (
                  <span className={r.totalDue > 0 ? "text-danger font-black" : "text-muted-foreground"}>
                    {r.totalDue.toLocaleString()} {currency}
                  </span>
                )
              },
              { key: "status", header: "الحالة", cell: (r: any) => (
                  r.totalDue > 0 
                    ? <Badge variant="danger"><AlertTriangle className="w-3 h-3 ml-1" /> متأخرات</Badge>
                    : r.totalFees > 0 
                      ? <Badge variant="success"><CheckCircle2 className="w-3 h-3 ml-1" /> مسدد بالكامل</Badge>
                      : <Badge variant="secondary">لا يوجد رسوم</Badge>
                )
              },
              { key: "actions", header: "إجراءات", cell: (r: any) => (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setStatementModalData(r); }}
                    className="text-sm font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    كشف الحساب
                  </button>
                )
              }
            ]}
            rows={studentFinancials}
            onRowClick={(r) => setStatementModalData(r)}
            pageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      </div>

      {/* Statement Modal */}
      {statementModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-4xl rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/30 shrink-0">
              <h3 className="font-black text-lg flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" /> كشف حساب الطالب: {statementModalData.name}
              </h3>
              <button onClick={() => setStatementModalData(null)} className="p-1 hover:bg-accent rounded-md"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4 flex gap-2 shrink-0 border-b border-border/50 bg-background">
              <button onClick={() => setChargeModalData({ studentId: statementModalData.id, studentName: statementModalData.name })} className="btn-secondary text-sm h-9"><Plus className="w-4 h-4 ml-1"/> إضافة رسوم جديدة</button>
              <button onClick={() => setPaymentModalData({ studentId: statementModalData.id, studentName: statementModalData.name })} className="btn-primary text-sm h-9 bg-success hover:bg-success/90"><CreditCard className="w-4 h-4 ml-1"/> تسجيل دفعة (سند قبض)</button>
            </div>

            <div className="p-4 overflow-y-auto custom-scrollbar">
              {statementModalData.invoices.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground font-bold bg-muted/30 rounded-xl border border-dashed border-border/60">
                  لا توجد حركات مالية مسجلة لهذا الطالب
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border/50 bg-background shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border/50">
                      <tr>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground">التاريخ</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground">البيان</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground">المبلغ</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground">الخصم</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground">الصافي</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground">المدفوع</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground">المتبقي</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {statementModalData.invoices.map((inv: any) => {
                        const net = inv.netAmount ?? inv.amount;
                        const due = net - inv.paid;
                        return (
                          <tr key={inv.id} className="hover:bg-accent/20 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs">{inv.issueDate || inv.dueDate}</td>
                            <td className="px-4 py-3 font-bold">{inv.title}</td>
                            <td className="px-4 py-3 text-muted-foreground">{inv.amount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-orange-500">{inv.discountAmount ? inv.discountAmount.toLocaleString() : '-'}</td>
                            <td className="px-4 py-3 font-bold">{net.toLocaleString()}</td>
                            <td className="px-4 py-3 text-success font-bold">{inv.paid > 0 ? inv.paid.toLocaleString() : '-'}</td>
                            <td className="px-4 py-3 text-danger font-black">{due > 0 ? due.toLocaleString() : '-'}</td>
                            <td className="px-4 py-3">
                              {inv.status === "paid" ? <Badge variant="success">مسدد</Badge> : inv.status === "partial" ? <Badge variant="warning">مسدد جزئياً</Badge> : <Badge variant="secondary">مستحق</Badge>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/30">
              <h3 className="font-bold flex items-center gap-2"><CreditCard className="w-5 h-5 text-success" /> تسجيل دفعة جديدة</h3>
              <button onClick={() => setPaymentModalData(null)} className="p-1 hover:bg-accent rounded-md"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">اسم الطالب</label>
                <div className="p-2 bg-muted rounded-lg font-bold">{paymentModalData.studentName}</div>
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">المبلغ ({currency})</label>
                <input type="number" name="amount" required min="1" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">طريقة الدفع</label>
                <select name="method" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50">
                  <option value="cash">نقداً (كاش)</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">ملاحظات / رقم الحوالة</label>
                <input type="text" name="notes" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 btn-primary bg-success hover:bg-success/90">تأكيد التسجيل</button>
                <button type="button" onClick={() => setPaymentModalData(null)} className="flex-1 btn-secondary">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Charge Modal */}
      {chargeModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/30">
              <h3 className="font-bold flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> إضافة رسوم جديدة</h3>
              <button onClick={() => setChargeModalData(null)} className="p-1 hover:bg-accent rounded-md"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddCharge} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">اسم الطالب</label>
                <div className="p-2 bg-muted rounded-lg font-bold">{chargeModalData.studentName}</div>
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">وصف الرسوم</label>
                <input type="text" name="title" required placeholder="مثال: رسوم زي مدرسي" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">المبلغ ({currency})</label>
                <input type="number" name="amount" required min="1" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 btn-primary">تأكيد الإضافة</button>
                <button type="button" onClick={() => setChargeModalData(null)} className="flex-1 btn-secondary">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AppShell>
  );
}
