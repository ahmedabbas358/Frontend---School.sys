import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { CreditCard, Plus, Search, Filter, Printer, Receipt, DollarSign, CheckCircle2, X, Trash2, Calendar, FileText } from "lucide-react";
import { useState, useMemo } from "react";
import { FinancialCard, FilterBar } from "@/components/financial-components";
import { useGlobalStore, Payment } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage } from "@/lib/school-structure";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/finance/payments")({
  component: FinancePayments,
});

const paymentSchema = z.object({
  invoiceId: z.string().min(1, "رقم الفاتورة مطلوب"),
  amount: z.coerce.number().min(1, "المبلغ يجب أن يكون أكبر من صفر"),
  method: z.enum(["cash", "bank_transfer", "card", "cheque"], { required_error: "طريقة الدفع مطلوبة" }),
  notes: z.string().optional(),
});

type PaymentForm = z.infer<typeof paymentSchema>;

function FinancePayments() {
  const { currency, activeStageInvoices, allPayments, addPayment, activeStageSections, activeStageStudents } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  const [q, setQ] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const unpaidInvoices = useMemo(() => activeStageInvoices.filter(i => i.status !== "paid" && i.status !== "cancelled"), [activeStageInvoices]);

  const stageInvoiceIds = useMemo(() => new Set(activeStageInvoices.map(i => i.id)), [activeStageInvoices]);
  const stageStudentIds = useMemo(() => new Set(activeStageStudents.map(s => s.id)), [activeStageStudents]);

  // Include payments linked via invoiceId or studentId in active stage
  const activeStagePayments = useMemo(() => {
    return allPayments.filter(p => (p.invoiceId && stageInvoiceIds.has(p.invoiceId)) || (p.studentId && stageStudentIds.has(p.studentId)));
  }, [allPayments, stageInvoiceIds, stageStudentIds]);

  // Student lookup map
  const studentMap = useMemo(() => {
    const map = new Map<string, typeof activeStageStudents[0]>();
    activeStageStudents.forEach(s => map.set(s.id, s));
    return map;
  }, [activeStageStudents]);

  // Invoice lookup map
  const invoiceMap = useMemo(() => {
    const map = new Map<string, typeof activeStageInvoices[0]>();
    activeStageInvoices.forEach(i => map.set(i.id, i));
    return map;
  }, [activeStageInvoices]);

  // Available grades
  const uniqueGrades = useMemo(() => {
    return getGradesForStage(stage);
  }, [stage]);

  // Available sections for selected grade
  const availableSections = useMemo(() => {
    let sections = gradeFilter ? activeStageSections.filter(s => s.grade === gradeFilter) : activeStageSections;
    return [...sections].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [activeStageSections, gradeFilter]);

  const printTemplates: PrintTemplate[] = useMemo(() => {
    return [
      {
        id: "payments_report", name: "سجل سندات القبض التفصيلي", category: "المالية والمحاسبة", type: "table",
        columns: [
          { key: "id", label: "رقم السند" },
          { key: "studentName", label: "اسم الطالب / الجهة" },
          { key: "amount", label: "المبلغ المحصل" },
          { key: "date", label: "تاريخ الدفع" },
          { key: "method", label: "طريقة الدفع", render: (r) => getMethodLabel(r.method) },
        ]
      }
    ];
  }, []);

  const getMethodLabel = (method: string) => {
    switch(method) {
      case "cash": return "نقدي (كاش)";
      case "bank_transfer": return "تحويل بنكي";
      case "card": return "بطاقة (مدى/فيزا)";
      case "cheque": return "شيك مصرفي";
      default: return method;
    }
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
  });

  const onSubmit = (data: PaymentForm) => {
    addPayment({
      invoiceId: data.invoiceId, 
      amount: data.amount, 
      method: data.method, 
      date: new Date().toISOString().split("T")[0]
    });
    toast.success(`تم إخراج سند قبض بمبلغ ${data.amount.toLocaleString()} ${currency} للفاتورة ${data.invoiceId} بنجاح`);
    setIsModalOpen(false);
    reset();
  };

  const filteredPayments = useMemo(() => {
    return activeStagePayments.map(p => {
      const inv = p.invoiceId ? invoiceMap.get(p.invoiceId) : undefined;
      const student = inv ? studentMap.get(inv.studentId) : p.studentId ? studentMap.get(p.studentId) : undefined;
      return {
        ...p,
        studentName: inv?.studentName || student?.name || "غير محدد",
        studentGrade: student?.grade || "",
        studentSectionId: student?.sectionId || "",
        invoiceTitle: inv?.title || "سداد حساب طالب",
      };
    }).filter(p => {
      if (q) {
        const qLower = q.toLowerCase();
        const matchName = p.studentName.toLowerCase().includes(qLower);
        const matchId = p.id.toLowerCase().includes(qLower);
        const matchInv = p.invoiceId?.toLowerCase().includes(qLower);
        if (!matchName && !matchId && !matchInv) return false;
      }
      if (gradeFilter && p.studentGrade !== gradeFilter) return false;
      if (sectionFilter && p.studentSectionId !== sectionFilter) return false;
      if (methodFilter !== "all" && p.method !== methodFilter) return false;
      return true;
    });
  }, [q, activeStagePayments, invoiceMap, studentMap, gradeFilter, sectionFilter, methodFilter]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const cashSum = filteredPayments.filter(p => p.method === "cash").reduce((sum, p) => sum + p.amount, 0);
    const bankSum = filteredPayments.filter(p => p.method === "bank_transfer").reduce((sum, p) => sum + p.amount, 0);
    const cardSum = filteredPayments.filter(p => p.method === "card" || p.method === "cheque").reduce((sum, p) => sum + p.amount, 0);
    return { totalCollected, totalCount: filteredPayments.length, cashSum, bankSum, cardSum };
  }, [filteredPayments]);

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance/dashboard" },
        { label: "سندات القبض والمقبوضات" },
      ]}
      actions={
        <div className="flex gap-2">
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-card border border-border px-3.5 text-xs font-extrabold hover:bg-accent shadow-sm"
          >
            <Printer className="h-4 w-4" /> طباعة سجل السندات
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-xs font-extrabold text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Plus className="h-4 w-4" /> إصدار سند قبض
          </button>
        </div>
      }
    >
      <div className="space-y-6 pb-20 animate-in fade-in duration-500">
        
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <PageCard className="p-4 flex items-center gap-4 bg-card border border-border/50 rounded-2xl shadow-sm">
            <div className="p-3 bg-success/10 text-success rounded-xl"><DollarSign className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي المتحصلات المقبوضة</p>
              <p className="text-xl font-black tabular-nums text-success">{summaryStats.totalCollected.toLocaleString()} {currency}</p>
            </div>
          </PageCard>
          <PageCard className="p-4 flex items-center gap-4 border-l-4 border-l-primary rounded-2xl shadow-sm">
            <div className="p-3 bg-primary/10 text-primary rounded-xl"><Receipt className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">عدد سندات القبض</p>
              <p className="text-xl font-black tabular-nums">{summaryStats.totalCount} سند</p>
            </div>
          </PageCard>
          <PageCard className="p-4 flex items-center gap-4 border-l-4 border-l-emerald-500 rounded-2xl shadow-sm">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl"><CreditCard className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">التحصيل النقدي (كاش)</p>
              <p className="text-lg font-extrabold tabular-nums text-emerald-600">{summaryStats.cashSum.toLocaleString()} {currency}</p>
            </div>
          </PageCard>
          <PageCard className="p-4 flex items-center gap-4 border-l-4 border-l-blue-500 rounded-2xl shadow-sm">
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl"><CreditCard className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">تحصيلات البنوك والشبكة</p>
              <p className="text-lg font-extrabold tabular-nums text-blue-600">{(summaryStats.bankSum + summaryStats.cardSum).toLocaleString()} {currency}</p>
            </div>
          </PageCard>
        </div>

        {/* Filters Bar */}
        <FilterBar>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-extrabold">تصفية السندات والمقبوضات</h2>
            {(gradeFilter || sectionFilter || methodFilter !== "all" || q) && (
              <button 
                onClick={() => { setQ(""); setGradeFilter(""); setSectionFilter(""); setMethodFilter("all"); }}
                className="text-xs font-bold text-danger hover:text-danger/80 bg-danger/10 px-2.5 py-0.5 rounded-full mr-2"
              >
                إعادة ضبط ✕
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث برقم السند، الفاتورة أو الاسم..."
                className="h-9 w-full rounded-xl border border-border/60 bg-background pr-9 pl-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <select 
              className="h-9 rounded-xl border border-border/60 bg-background px-2.5 text-xs font-bold cursor-pointer outline-none"
              value={gradeFilter}
              onChange={e => { setGradeFilter(e.target.value); setSectionFilter(""); }}
            >
              <option value="">جميع الصفوف</option>
              {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select 
              className="h-9 rounded-xl border border-border/60 bg-background px-2.5 text-xs font-bold cursor-pointer outline-none"
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
            >
              <option value="">جميع الشعب</option>
              {availableSections.map(s => <option key={s.id} value={s.id}>{s.grade} - شعبة {s.name}</option>)}
            </select>
            <select 
              className="h-9 rounded-xl border border-border/60 bg-background px-2.5 text-xs font-bold cursor-pointer outline-none"
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
            >
              <option value="all">جميع طرق الدفع</option>
              <option value="cash">نقدي (كاش)</option>
              <option value="bank_transfer">تحويل بنكي</option>
              <option value="card">بطاقة إلكترونية</option>
              <option value="cheque">شيك مصرفي</option>
            </select>
          </div>
        </FilterBar>

        {/* Data Table */}
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <DataTable
            columns={[
              { 
                key: "id", 
                header: "رقم السند", 
                cell: (r: any) => <span className="font-mono text-xs font-black text-primary">{r.id}</span> 
              },
              { 
                key: "date", 
                header: "تاريخ الدفع", 
                cell: (r: any) => <span className="font-mono text-xs font-bold text-muted-foreground">{r.date ? r.date.split("T")[0] : "-"}</span> 
              },
              { 
                key: "studentName", 
                header: "اسم الطالب / الجهة", 
                cell: (r: any) => (
                  <div>
                    <div className="font-extrabold text-sm">{r.studentName}</div>
                    <div className="text-xs text-muted-foreground">{r.invoiceTitle}</div>
                  </div>
                )
              },
              { 
                key: "invoiceId", 
                header: "رقم الفاتورة والمرجع", 
                cell: (r: any) => <span className="font-mono text-xs font-bold bg-muted/50 px-2 py-0.5 rounded-md border">{r.invoiceId || r.referenceNo || "سند مباشر"}</span> 
              },
              { 
                key: "method", 
                header: "طريقة الدفع", 
                cell: (r: any) => (
                  <Badge tone={r.method === "cash" ? "success" : r.method === "bank_transfer" ? "info" : "warning"}>
                    {getMethodLabel(r.method)}
                  </Badge>
                )
              },
              { 
                key: "amount", 
                header: "المبلغ المحصل", 
                cell: (r: any) => <span className="font-black text-success tabular-nums text-base">{r.amount.toLocaleString()} {currency}</span> 
              },
              { 
                key: "actions", 
                header: "طباعة ومعاينة", 
                cell: (r: any) => (
                  <button 
                    onClick={() => setSelectedReceipt(r)}
                    className="text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" /> طباعة السند
                  </button>
                )
              }
            ]}
            rows={filteredPayments}
            pageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
            empty="لا توجد سندات قبض تطابق شروط التصفية والبحث"
          />
        </div>
      </div>

      {/* --- New Payment Receipt Issuance Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
              <h3 className="text-base font-extrabold flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" /> إصدار سند قبض مالي جديد</h3>
              <button onClick={() => { setIsModalOpen(false); reset(); }} className="rounded-xl p-1.5 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-muted-foreground">الفاتورة المستهدفة <span className="text-danger">*</span></label>
                <select
                  {...register("invoiceId")}
                  className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">-- اختر الفاتورة المطلوب سدادها --</option>
                  {unpaidInvoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.id} - {inv.studentName} (المتبقي: {((inv.netAmount ?? inv.amount) - inv.paid).toLocaleString()} {currency})
                    </option>
                  ))}
                </select>
                {errors.invoiceId && <p className="mt-1 text-xs text-danger font-bold">{errors.invoiceId.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-muted-foreground">المبلغ المحصل ({currency}) <span className="text-danger">*</span></label>
                <input
                  type="number"
                  {...register("amount")}
                  placeholder="أدخل المبلغ..."
                  className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/40"
                />
                {errors.amount && <p className="mt-1 text-xs text-danger font-bold">{errors.amount.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-muted-foreground">طريقة السداد وتوريد الخزينة <span className="text-danger">*</span></label>
                <select
                  {...register("method")}
                  className="h-10 w-full rounded-xl border border-border/60 bg-background px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="cash">نقدي (كاش - الخزينة الرئيسية)</option>
                  <option value="card">شبكة ومدى (الحساب البنكي)</option>
                  <option value="bank_transfer">حوالة بنكية مباشرة</option>
                  <option value="cheque">شيك مصرفي مالي</option>
                </select>
                {errors.method && <p className="mt-1 text-xs text-danger font-bold">{errors.method.message}</p>}
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); reset(); }}
                  className="h-10 rounded-xl px-4 text-xs font-bold hover:bg-accent"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-xl bg-primary px-6 text-xs font-extrabold text-primary-foreground hover:bg-primary/90 shadow-sm"
                >
                  تأكيد وحفظ السند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Single Receipt Print Modal --- */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border overflow-hidden p-6 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-border/50">
              <h3 className="font-extrabold text-lg flex items-center gap-2"><Receipt className="w-6 h-6 text-primary" /> سند قبض مالي رسمي</h3>
              <button onClick={() => setSelectedReceipt(null)} className="p-1 hover:bg-accent rounded-xl"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 bg-muted/30 rounded-2xl border border-border/60 space-y-3 font-bold text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">رقم السند:</span>
                <span className="font-mono font-black text-primary">{selectedReceipt.id}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">تاريخ الإصدار:</span>
                <span>{selectedReceipt.date ? selectedReceipt.date.split("T")[0] : "-"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">استلمنا من الطالب/الجهة:</span>
                <span className="font-extrabold">{selectedReceipt.studentName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">رقم الفاتورة/البيان:</span>
                <span>{selectedReceipt.invoiceTitle} ({selectedReceipt.invoiceId || "سند مباشر"})</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">طريقة الدفع:</span>
                <span>{getMethodLabel(selectedReceipt.method)}</span>
              </div>
              <div className="flex justify-between pt-2 text-base">
                <span className="text-muted-foreground">المبلغ المحصل:</span>
                <span className="font-black text-success tabular-nums">{selectedReceipt.amount.toLocaleString()} {currency}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => { window.print(); setSelectedReceipt(null); }}
                className="flex-1 btn-primary py-2.5 rounded-xl font-extrabold flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> طباعة السند الآن
              </button>
              <button 
                onClick={() => setSelectedReceipt(null)} 
                className="btn-secondary px-6 rounded-xl font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Advanced Print Engine --- */}
      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title={`سجل سندات القبض والتحصيلات - ${getStageLabel(stage)}`}
        data={filteredPayments}
        templates={printTemplates}
      />

    </AppShell>
  );
}
