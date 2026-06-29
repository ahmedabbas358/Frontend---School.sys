import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { CreditCard, Plus, Search, Filter, Printer, Receipt, DollarSign, CheckCircle2, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
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
});

type PaymentForm = z.infer<typeof paymentSchema>;

function FinancePayments() {
  const { currency, activeStageInvoices, allPayments, addPayment, activeStageSections, activeStageStudents  } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  const [q, setQ] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isPrintSingleOpen, setIsPrintSingleOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const unpaidInvoices = useMemo(() => activeStageInvoices.filter(i => i.status !== "paid" && i.status !== "cancelled"), [activeStageInvoices]);

  const stageInvoiceIds = useMemo(() => new Set(activeStageInvoices.map(i => i.id)), [activeStageInvoices]);
  const activeStagePayments = useMemo(() => allPayments.filter(p => stageInvoiceIds.has(p.invoiceId)), [allPayments, stageInvoiceIds]);

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
        id: "payments_report", name: "سجل سندات القبض", category: "المالية والمحاسبة", type: "table",
        columns: [
          { key: "id", label: "رقم السند" },
          { key: "invoiceId", label: "رقم الفاتورة" },
          { key: "studentName", label: "الطالب" },
          { key: "amount", label: "المبلغ المحصل" },
          { key: "date", label: "تاريخ الدفع" },
          { key: "method", label: "طريقة الدفع", render: (r) => getMethodLabel(r.method) },
        ]
      },
      {
        id: "payment_receipts", name: "طباعة سند القبض", category: "المالية والمحاسبة", type: "receipt",
        columns: [
          { label: "المبلغ المحصل", key: "amount" },
        ],
        customControls: [
          { key: "receiptReason", label: "البيان", type: "text", defaultValue: "دفعة من الرسوم الدراسية" }
        ]
      }
    ];
  }, []);

  const getMethodLabel = (method: string) => {
    switch(method) {
      case "cash": return "نقدي";
      case "bank_transfer": return "حوالة بنكية";
      case "card": return "بطاقة (مدى/فيزا)";
      case "cheque": return "شيك";
      default: return method;
    }
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
  });

  const onSubmit = (data: PaymentForm) => {
    addPayment(data.invoiceId, data.amount, data.method);
    toast.success(`تم تسجيل دفعة بقيمة ${data.amount} ${currency} للفاتورة ${data.invoiceId}`);
    setIsModalOpen(false);
    reset();
  };

  const filteredPayments = useMemo(() => {
    return activeStagePayments.map(p => {
      const inv = invoiceMap.get(p.invoiceId);
      const student = inv ? studentMap.get(inv.studentId) : undefined;
      return {
        ...p,
        studentName: inv?.studentName || "غير معروف",
        studentGrade: student?.grade || "",
        studentSectionId: student?.sectionId || "",
      };
    }).filter(p => {
      if (q && !p.studentName.includes(q) && !p.id.includes(q) && !p.invoiceId.includes(q)) return false;
      if (gradeFilter && p.studentGrade !== gradeFilter) return false;
      if (sectionFilter && p.studentSectionId !== sectionFilter) return false;
      return true;
    });
  }, [q, activeStagePayments, invoiceMap, studentMap, gradeFilter, sectionFilter]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const cashCount = filteredPayments.filter(p => p.method === "cash").length;
    const transferCount = filteredPayments.filter(p => p.method === "bank_transfer").length;
    const cardCount = filteredPayments.filter(p => p.method === "card" || p.method === "cheque").length;
    return { totalCollected, total: filteredPayments.length, cashCount, transferCount, cardCount };
  }, [filteredPayments]);

  // Get section display name
  const getSectionDisplay = (studentId: string) => {
    const student = studentMap.get(studentId);
    if (!student?.sectionId) return "";
    const section = activeStageSections.find(s => s.id === student.sectionId);
    return section ? `${section.name}` : "";
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المالية والمحاسبة" },
        { label: "سندات القبض والدفع" },
      ]}
      actions={
        <div className="flex gap-2">
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-card border border-border px-3 text-sm font-bold hover:bg-accent"
          >
            <Printer className="h-4 w-4" /> طباعة السجلات
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> إصدار سند قبض
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground">إجمالي المحصلات</p>
                <p className="mt-1 text-xl font-black text-success tabular-nums">{summaryStats.totalCollected.toLocaleString()} <span className="text-sm font-bold">{currency}</span></p>
              </div>
              <div className="rounded-full bg-success/10 p-2 text-success"><DollarSign className="h-4 w-4" /></div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground">عدد سندات القبض</p>
                <p className="mt-1 text-xl font-black text-primary tabular-nums">{summaryStats.total}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-2 text-primary"><Receipt className="h-4 w-4" /></div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs font-bold text-muted-foreground mb-2">طرق الدفع</p>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> {summaryStats.cashCount} نقدي</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> {summaryStats.transferCount} تحويل</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> {summaryStats.cardCount} بطاقة/شيك</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" /> تسجيل دفعة جديدة</h3>
                <button onClick={() => { setIsModalOpen(false); reset(); }} className="rounded-full p-2 hover:bg-accent transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">الفاتورة المستهدفة <span className="text-danger">*</span></label>
                  <select
                    {...register("invoiceId")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-ring focus:ring-2 outline-none"
                  >
                    <option value="">-- اختر الفاتورة --</option>
                    {unpaidInvoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.id} - {inv.studentName} (المتبقي: {(inv.netAmount ?? inv.amount) - inv.paid} {currency})
                      </option>
                    ))}
                  </select>
                  {errors.invoiceId && <p className="mt-1 text-xs text-danger">{errors.invoiceId.message}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">المبلغ المحصل ({currency}) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    {...register("amount")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-ring focus:ring-2 outline-none"
                  />
                  {errors.amount && <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">طريقة الدفع <span className="text-danger">*</span></label>
                  <select
                    {...register("method")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-ring focus:ring-2 outline-none"
                  >
                    <option value="cash">نقدي (كاش)</option>
                    <option value="card">شبكة (مدى/بطاقة ائتمانية)</option>
                    <option value="bank_transfer">حوالة بنكية</option>
                    <option value="cheque">شيك</option>
                  </select>
                  {errors.method && <p className="mt-1 text-xs text-danger">{errors.method.message}</p>}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); reset(); }}
                    className="h-10 rounded-lg px-4 text-sm font-medium hover:bg-accent"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="h-10 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    حفظ الدفعة
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-primary">فلاتر التصفية</span>
            {(gradeFilter || sectionFilter || q) && (
              <button 
                onClick={() => { setQ(""); setGradeFilter(""); setSectionFilter(""); }}
                className="mr-auto text-xs font-bold text-danger hover:text-danger/80 transition-colors bg-danger/10 px-3 py-1 rounded-full"
              >
                مسح الكل ✕
              </button>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`البحث برقم السند أو الفاتورة أو اسم الطالب...`}
                className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <select 
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold cursor-pointer"
              value={gradeFilter}
              onChange={e => { setGradeFilter(e.target.value); setSectionFilter(""); }}
            >
              <option value="">الفصل (الكل)</option>
              {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select 
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold cursor-pointer"
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
              disabled={!gradeFilter}
            >
              <option value="">الشعبة (الكل)</option>
              {availableSections.map(s => <option key={s.id} value={s.id}>شعبة {s.name}</option>)}
            </select>
          </div>
        </div>

        <PageCard>
          <div className="mb-4 flex flex-col gap-1 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">سجل سندات القبض</h2>
            </div>
            <p className="text-sm text-muted-foreground">المدفوعات الخاصة بمرحلة: {getStageLabel(stage)} {gradeFilter && `— ${gradeFilter}`} {sectionFilter && `— شعبة ${availableSections.find(s=>s.id===sectionFilter)?.name}`}</p>
          </div>
          
          <DataTable
            rows={filteredPayments}
            columns={[
              { key: "id", header: "رقم السند", cell: (r) => <span className="font-bold">{r.id}</span> },
              { key: "invoiceId", header: "رقم الفاتورة", cell: (r) => <span className="font-medium text-muted-foreground">{r.invoiceId}</span> },
              { key: "student", header: "الطالب", cell: (r) => {
                const inv = invoiceMap.get(r.invoiceId);
                const sectionName = inv ? getSectionDisplay(inv.studentId) : "";
                return (
                  <div>
                    <span className="font-medium text-primary block">{r.studentName}</span>
                    {sectionName && <span className="text-xs text-muted-foreground">شعبة {sectionName}</span>}
                  </div>
                );
              }},
              { key: "amount", header: "المبلغ المحصل", cell: (r) => <span className="text-success font-bold text-lg">{r.amount.toLocaleString()} {currency}</span> },
              { key: "date", header: "تاريخ الدفع", cell: (r) => r.date },
              {
                key: "method",
                header: "طريقة الدفع",
                cell: (r) => (
                  <Badge tone={r.method === "cash" ? "success" : r.method === "bank_transfer" ? "primary" : r.method === "card" ? "warning" : "neutral"}>
                    {getMethodLabel(r.method)}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "إجراءات",
                cell: (r) => (
                  <button 
                    onClick={() => {
                      setSelectedPayment(r);
                      setIsPrintSingleOpen(true);
                    }}
                    className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
                    title="طباعة سند القبض"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                )
              }
            ]}
            empty={`لا توجد مدفوعات مسجلة لهذه المرحلة.`}
          />
        </PageCard>
      </div>

      {selectedPayment && (
        <AdvancedPrintEngine 
          isOpen={isPrintSingleOpen} 
          onClose={() => {
            setIsPrintSingleOpen(false);
            setSelectedPayment(null);
          }} 
          title={`سند قبض رقم - ${selectedPayment.id}`}
          data={[selectedPayment]}
          templates={[printTemplates[1]]}
        />
      )}

      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title="كشف المدفوعات والمحصلات"
        subtitle={`للمرحلة: ${getStageLabel(stage)}`}
        data={filteredPayments}
        templates={printTemplates}
      />
    </AppShell>
  );
}
