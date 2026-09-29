import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { CreditCard, Plus, Search, Filter, Printer, Receipt, DollarSign, CheckCircle2, X, Trash2, Calendar, FileText, Download } from "lucide-react";
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
import { AdminModal } from "@/components/admin/admin-modal";
import { FinanceNavTabs } from "@/components/finance/finance-nav";

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
  const { 
    currency, 
    activeStageInvoices, 
    allPayments, 
    addPayment, 
    activeStageSections, 
    activeStageStudents,
    allCashSessions,
    allTreasuries,
    allBankAccounts
  } = useGlobalStore();
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

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { method: "cash" }
  });

  const selectedInvoiceId = watch("invoiceId");
  const selectedMethod = watch("method");
  const selectedInvObj = useMemo(() => unpaidInvoices.find(i => i.id === selectedInvoiceId), [unpaidInvoices, selectedInvoiceId]);
  const openCashSession = useMemo(() => allCashSessions.find(s => s.status === "open"), [allCashSessions]);

  const onSubmit = (data: PaymentForm) => {
    const activeSession = data.method === "cash" ? openCashSession : undefined;
    const inv = invoiceMap.get(data.invoiceId);
    const student = inv ? studentMap.get(inv.studentId) : undefined;
    const receiptId = `REC-${Date.now().toString().slice(-6)}`;

    addPayment({
      invoiceId: data.invoiceId, 
      amount: data.amount, 
      method: data.method, 
      date: new Date().toISOString().split("T")[0],
      sessionId: activeSession?.id,
    } as any);

    setSelectedReceipt({
      id: receiptId,
      invoiceId: data.invoiceId,
      invoiceTitle: inv?.title || "سداد رسوم دراسية",
      studentName: inv?.studentName || student?.name || "طالب محدد",
      studentGrade: student?.grade || "",
      amount: data.amount,
      method: data.method,
      date: new Date().toISOString().split("T")[0],
      cashier: activeSession?.cashierName || "أمين الصندوق والخزينة",
      notes: data.notes || "سداد قسط دراسي معتمد",
    });

    toast.success(`تم قيد سند قبض بمبلغ ${data.amount.toLocaleString()} ${currency} للفاتورة بنجاح`);
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

  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      toast.error("لا توجد مقبوضات لتصديرها");
      return;
    }

    const headers = [
      "رقم السند",
      "اسم الطالب",
      "الصف",
      "رقم الفاتورة والمرجع",
      "المبلغ المحصل",
      "تاريخ الدفع",
      "طريقة الدفع",
      "الملاحظات"
    ];

    const rows = filteredPayments.map((p: any) => [
      p.id,
      `"${p.studentName?.replace(/"/g, '""') || ''}"`,
      `"${p.studentGrade || ''}"`,
      `"${p.invoiceId || p.referenceNo || ''}"`,
      p.amount || 0,
      p.date || "",
      `"${getMethodLabel(p.method)}"`,
      `"${p.notes?.replace(/"/g, '""') || ''}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `سندات_القبض_${getStageLabel(stage)}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير سجل سندات القبض بنجاح");
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance/dashboard" },
        { label: "سندات القبض والمقبوضات" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-card border border-border px-3.5 text-xs font-bold hover:bg-accent shadow-sm"
          >
            <Download className="h-4 w-4 text-primary" /> تصدير CSV
          </button>
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
        <FinanceNavTabs activeTab="payments" />

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
              <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث برقم السند، الفاتورة أو الاسم..."
                className="h-10 w-full rounded-xl border border-input bg-card/90 ps-9 pe-3 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs placeholder:text-muted-foreground/70"
              />
            </div>
            <select 
              className="h-10 rounded-xl border border-input bg-card/90 px-3 text-xs font-semibold cursor-pointer outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
              value={gradeFilter}
              onChange={e => { setGradeFilter(e.target.value); setSectionFilter(""); }}
            >
              <option value="">جميع الصفوف</option>
              {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select 
              className="h-10 rounded-xl border border-input bg-card/90 px-3 text-xs font-semibold cursor-pointer outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
            >
              <option value="">جميع الشعب</option>
              {availableSections.map(s => <option key={s.id} value={s.id}>{s.grade} - شعبة {s.name}</option>)}
            </select>
            <select 
              className="h-10 rounded-xl border border-input bg-card/90 px-3 text-xs font-semibold cursor-pointer outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
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
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); reset(); }}
        title="إصدار سند قبض مالي رسمي"
        description="توريد دفعة أو قسط لحساب الفاتورة المحددة وربطه بالخزينة"
        icon={Receipt}
        tone="success"
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-foreground">الفاتورة المستهدفة <span className="text-destructive">*</span></label>
            <select
              {...register("invoiceId")}
              className="h-11 w-full rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all cursor-pointer"
            >
              <option value="">-- اختر الفاتورة المطلوب سدادها --</option>
              {unpaidInvoices.map(inv => {
                const remaining = (inv.netAmount ?? inv.amount) - inv.paid;
                return (
                  <option key={inv.id} value={inv.id}>
                    {inv.id} - {inv.studentName} (المتبقي: {remaining.toLocaleString()} {currency})
                  </option>
                );
              })}
            </select>
            {errors.invoiceId && <p className="mt-1 text-xs text-destructive font-bold">{errors.invoiceId.message}</p>}
          </div>

          {selectedInvObj && (
            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground">اسم الطالب: {selectedInvObj.studentName}</span>
                <Badge tone="neutral" className="text-[10px] bg-background">فاتورة #{selectedInvObj.id}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
                <div className="p-2 rounded-xl bg-background border border-border/60">
                  <div className="text-[10px] text-muted-foreground font-sans">الإجمالي</div>
                  <div className="font-black text-foreground">{((selectedInvObj.netAmount ?? selectedInvObj.amount)).toLocaleString()} {currency}</div>
                </div>
                <div className="p-2 rounded-xl bg-background border border-border/60">
                  <div className="text-[10px] text-muted-foreground font-sans">المدفوع</div>
                  <div className="font-black text-emerald-600 dark:text-emerald-400">{selectedInvObj.paid.toLocaleString()} {currency}</div>
                </div>
                <div className="p-2 rounded-xl bg-background border border-border/60">
                  <div className="text-[10px] text-muted-foreground font-sans">المتبقي المطلوب</div>
                  <div className="font-black text-amber-600 dark:text-amber-400">
                    {((selectedInvObj.netAmount ?? selectedInvObj.amount) - selectedInvObj.paid).toLocaleString()} {currency}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-muted-foreground">تعبئة سريعة:</span>
                {(() => {
                  const rem = (selectedInvObj.netAmount ?? selectedInvObj.amount) - selectedInvObj.paid;
                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => setValue("amount", rem)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-all"
                      >
                        كامل المتبقي (100%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue("amount", Math.round(rem / 2))}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-all"
                      >
                        النصف (50%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setValue("amount", Math.round(rem / 4))}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-all"
                      >
                        الربع (25%)
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-bold text-foreground">المبلغ المحصل ({currency}) <span className="text-destructive">*</span></label>
            <div className="relative">
              <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                {...register("amount")}
                placeholder="أدخل المبلغ المحصل..."
                className="h-11 w-full rounded-xl border border-input bg-background/80 pr-10 pl-3.5 text-sm font-black tabular-nums text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60"
              />
            </div>
            {errors.amount && <p className="mt-1 text-xs text-destructive font-bold">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-foreground">طريقة السداد وقناة الإيداع <span className="text-destructive">*</span></label>
            <select
              {...register("method")}
              className="h-11 w-full rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all cursor-pointer"
            >
              <option value="cash">نقدي (كاش - الخزينة والصندوق المباشر)</option>
              <option value="card">شبكة ومدى (الحساب البنكي المدرسي)</option>
              <option value="bank_transfer">حوالة بنكية مباشرة</option>
              <option value="cheque">شيك مصرفي مالي</option>
            </select>
            {errors.method && <p className="mt-1 text-xs text-destructive font-bold">{errors.method.message}</p>}
          </div>

          {selectedMethod === "cash" && (
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              openCashSession 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${openCashSession ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span className="font-semibold">
                  {openCashSession 
                    ? `جلسة صندوق نشطة: ${(openCashSession as any).cashierName || (openCashSession as any).openedBy || (openCashSession as any).userId || "أمين الخزينة"} (سيتم تقييد السند بالوردية آلياً)` 
                    : "تنبيه: لا توجد جلسة كاشير مفتوحة حالياً، سيتم قيد المبلغ في الخزينة العامة"}
                </span>
              </div>
              {openCashSession && (
                <Badge tone="success" className="border-emerald-500/40 text-[10px]">جلسة مفتوحة</Badge>
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-bold text-foreground">ملاحظات أو رقم المرجع (اختياري)</label>
            <input
              type="text"
              {...register("notes")}
              placeholder="مثال: رقم الحوالة، اسم المودع، رقم الشيك..."
              className="h-10 w-full rounded-xl border border-input bg-background/80 px-3.5 text-xs text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2.5 pt-3 border-t border-border/70">
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); reset(); }}
              className="h-11 rounded-xl px-5 text-xs font-semibold border border-input bg-background/80 hover:bg-accent active:scale-[0.98] transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 text-xs font-black text-white hover:from-emerald-500 hover:to-teal-500 shadow-lg active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Receipt className="w-4 h-4" /> تأكيد وقيد السند
            </button>
          </div>
        </form>
      </AdminModal>

      {/* --- Luxury Printable Official Receipt Voucher Modal --- */}
      <AdminModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title="معاينة سند القبض الرسمي المعتمد"
        description="جاهز للطباعة والتسليم الفوري لولي الأمر"
        icon={Receipt}
        tone="primary"
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-muted-foreground font-mono">سند قبض صادر آلياً من نظام إدارة المدارس</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow hover:bg-primary/90 transition-all"
              >
                <Printer className="w-3.5 h-3.5" /> طباعة
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="h-9 px-4 rounded-xl border border-input bg-background hover:bg-accent text-xs font-semibold transition-all"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        }
      >
        {selectedReceipt && (
          <div className="space-y-5 bg-card" id="printable-receipt-card">
            {/* School Header */}
            <div className="flex justify-between items-center pb-4 border-b-2 border-primary/20">
              <div className="text-right">
                <h2 className="text-sm font-black text-foreground">مجموعة مدارس الأفق النموذجية الأهلية</h2>
                <p className="text-[11px] text-muted-foreground">الإدارة المالية والحسابات العامة</p>
                <p className="text-[10px] text-muted-foreground">الرقم الضريبي: 310294857200003</p>
              </div>
              <div className="text-center">
                <div className="border-2 border-primary/40 rounded-2xl px-4 py-1.5 bg-primary/5">
                  <span className="text-xs font-black text-primary">سند قبض مالي معتمد</span>
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{selectedReceipt.id}</div>
                </div>
              </div>
              <div className="text-left font-mono text-[11px] text-muted-foreground">
                <div>التاريخ: {selectedReceipt.date}</div>
                <div>الوقت: {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>

            {/* Voucher Main Content Table */}
            <div className="rounded-2xl border border-border/80 overflow-hidden divide-y divide-border/60 text-xs">
              <div className="flex items-center p-3 bg-muted/20">
                <span className="w-32 font-bold text-muted-foreground">استلمنا من الطالب:</span>
                <span className="font-black text-foreground text-sm flex-1">{selectedReceipt.studentName}</span>
                {selectedReceipt.studentGrade && (
                  <Badge tone="neutral" className="text-[10px]">{selectedReceipt.studentGrade}</Badge>
                )}
              </div>
              <div className="flex items-center p-3">
                <span className="w-32 font-bold text-muted-foreground">مبلغ وقدره:</span>
                <span className="font-mono font-black text-primary text-base flex-1">
                  {selectedReceipt.amount.toLocaleString()} {currency}
                </span>
                <Badge tone="primary" className="text-[10px]">{getMethodLabel(selectedReceipt.method)}</Badge>
              </div>
              <div className="flex items-center p-3 bg-muted/20">
                <span className="w-32 font-bold text-muted-foreground">وذلك عن:</span>
                <span className="font-semibold text-foreground flex-1">
                  {selectedReceipt.invoiceTitle} {selectedReceipt.invoiceId ? `(فاتورة #${selectedReceipt.invoiceId})` : ""}
                </span>
              </div>
              {selectedReceipt.notes && (
                <div className="flex items-center p-3">
                  <span className="w-32 font-bold text-muted-foreground">ملاحظات وبيان:</span>
                  <span className="text-muted-foreground flex-1">{selectedReceipt.notes}</span>
                </div>
              )}
              <div className="flex items-center p-3 bg-muted/20">
                <span className="w-32 font-bold text-muted-foreground">المستلم / أمين الصندوق:</span>
                <span className="font-bold text-foreground flex-1">{selectedReceipt.cashier}</span>
              </div>
            </div>

            {/* Signatures & Seal Area */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-dashed border-border/80 text-center text-xs">
              <div className="space-y-4">
                <span className="text-muted-foreground font-semibold">توقيع المستلم (أمين الصندوق)</span>
                <div className="h-10 border-b border-border/80 font-mono text-[10px] text-muted-foreground/60 flex items-end justify-center pb-1">
                  {selectedReceipt.cashier}
                </div>
              </div>
              <div className="space-y-4">
                <span className="text-muted-foreground font-semibold">توقيع المودع / ولي الأمر</span>
                <div className="h-10 border-b border-border/80 flex items-end justify-center pb-1 text-[10px] text-muted-foreground/60">
                  ..........................
                </div>
              </div>
              <div className="space-y-2 flex flex-col items-center justify-center">
                <span className="text-muted-foreground font-semibold">الختم المالي الرسمي</span>
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center text-[10px] font-black text-primary/70 rotate-[-12deg] bg-primary/5">
                  معتمد مالي
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminModal>

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
