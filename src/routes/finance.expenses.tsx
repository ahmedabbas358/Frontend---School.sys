import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Plus, TrendingDown, Search, Filter, Printer, Trash2, X, FileText, CreditCard, CheckCircle2, ShieldAlert, ArrowUpRight, DollarSign, Download, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { FinancialCard, SmartAlert, FilterBar } from "@/components/financial-components";
import { useGlobalStore, Expense } from "@/contexts/GlobalStoreContext";
import { useWorkflowEngine } from "@/engines/finance/useWorkflowEngine";
import { toast } from "sonner";
import { AdminModal } from "@/components/admin/admin-modal";
import { FinanceNavTabs } from "@/components/finance/finance-nav";

export const Route = createFileRoute("/finance/expenses")({
  component: FinanceExpenses,
});

function FinanceExpenses() {
  const { currency, allExpenses, allExpenseCategories, allStaff, addExpense, deleteExpense, allCashSessions, allTreasuries, allBankAccounts } = useGlobalStore();
  const { transitionExpenseStatus } = useWorkflowEngine();
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpenseVoucher, setSelectedExpenseVoucher] = useState<any | null>(null);
  const [deleteConfirmExpense, setDeleteConfirmExpense] = useState<Expense | null>(null);

  const [baseAmount, setBaseAmount] = useState<number | string>("");
  const [includeVat, setIncludeVat] = useState(false);

  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    title: "",
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    categoryId: "",
    beneficiary: "",
    method: "bank_transfer",
    notes: "",
    status: "submitted"
  });

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numBase = Number(baseAmount) || 0;
    const finalAmount = includeVat ? Math.round(numBase * 1.15) : numBase;

    if (!newExpense.title || !finalAmount || !newExpense.categoryId || !newExpense.beneficiary) {
      toast.error("يرجى تعبئة جميع الحقول الإلزامية");
      return;
    }

    const openSession = allCashSessions.find(s => s.status === 'open');
    const voucherId = `EXP-${Date.now().toString().slice(-6)}`;
    const expenseToSave = {
      ...newExpense,
      amount: finalAmount,
      sessionId: newExpense.method === "cash" && openSession ? openSession.id : undefined,
    };

    addExpense(expenseToSave as Expense);
    setSelectedExpenseVoucher({
      ...expenseToSave,
      id: voucherId,
      baseAmount: numBase,
      vatAmount: includeVat ? Math.round(numBase * 0.15) : 0,
      includeVat,
      date: newExpense.date || new Date().toISOString().split('T')[0],
    });

    toast.success("تم تسجيل طلب المصروف وسند الصرف بنجاح");
    setIsModalOpen(false);
    setNewExpense({
      title: "", amount: 0, date: new Date().toISOString().split('T')[0], categoryId: "", beneficiary: "", method: "bank_transfer", notes: "", status: "submitted"
    });
    setBaseAmount("");
    setIncludeVat(false);
  };

  const getCategoryName = (id: string) => allExpenseCategories.find(c => c.id === id)?.name || "غير مصنف";
  
  const getMethodLabel = (method: string) => {
    switch(method) {
      case "cash": return "نقدي (كاش)";
      case "bank_transfer": return "تحويل بنكي";
      case "card": return "بطاقة دفع";
      case "cheque": return "شيك مصرفي";
      default: return method;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "paid": return <Badge tone="success">تم الصرف والقيد</Badge>;
      case "approved": return <Badge tone="info">معتمد</Badge>;
      case "submitted": return <Badge tone="warning">مرفوع للاعتماد</Badge>;
      case "draft": return <Badge tone="neutral">مسودة</Badge>;
      default: return <Badge tone="neutral">{status}</Badge>;
    }
  };

  const printTemplates: PrintTemplate[] = [
    {
      id: "expenses-report",
      name: "تقرير المصروفات التشغيلية التفصيلي",
      category: "المالية والمحاسبة",
      type: "table",
      columns: [
        { label: "رقم السند", key: "id" },
        { label: "التصنيف", key: "categoryName" },
        { label: "بيان المصروف", key: "title" },
        { label: "المبلغ", key: "amountStr" },
        { label: "تاريخ الصرف", key: "date" },
        { label: "المستفيد", key: "beneficiary" },
        { label: "طريقة الدفع", key: "methodLabel" },
      ],
      description: "طباعة تقرير شامل بالمصروفات التشغيلية",
    }
  ];

  const filtered = useMemo(() => {
    return allExpenses.filter(exp => {
      if (q) {
        const qLower = q.toLowerCase();
        const matchTitle = exp.title.toLowerCase().includes(qLower);
        const matchBeneficiary = exp.beneficiary.toLowerCase().includes(qLower);
        const matchId = exp.id.toLowerCase().includes(qLower);
        if (!matchTitle && !matchBeneficiary && !matchId) return false;
      }
      if (categoryFilter && exp.categoryId !== categoryFilter) return false;
      if (statusFilter !== "all" && exp.status !== statusFilter) return false;
      return true;
    });
  }, [q, categoryFilter, statusFilter, allExpenses]);

  const aggregateStats = useMemo(() => {
    const totalAmount = filtered.reduce((acc, curr) => acc + curr.amount, 0);
    const paidAmount = filtered.filter(e => e.status === "paid").reduce((acc, curr) => acc + curr.amount, 0);
    const pendingAmount = totalAmount - paidAmount;
    return { totalAmount, paidAmount, pendingAmount, count: filtered.length };
  }, [filtered]);

  const printData = filtered.map(exp => ({
    ...exp,
    categoryName: getCategoryName(exp.categoryId),
    amountStr: `${exp.amount.toLocaleString()} ${currency}`,
    methodLabel: getMethodLabel(exp.method)
  }));

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error("لا توجد بيانات لتصديرها");
      return;
    }

    const headers = [
      "رقم السند",
      "التاريخ",
      "بيان المصروف",
      "التصنيف",
      "المستفيد",
      "المبلغ",
      "طريقة الدفع",
      "الحالة"
    ];

    const rows = filtered.map((e: any) => [
      e.id,
      e.date ? e.date.split("T")[0] : "",
      `"${e.title?.replace(/"/g, '""') || ''}"`,
      `"${getCategoryName(e.categoryId)}"`,
      `"${e.beneficiary?.replace(/"/g, '""') || ''}"`,
      e.amount || 0,
      `"${getMethodLabel(e.method)}"`,
      `"${e.status || ''}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `تقرير_المصروفات_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير تقرير المصروفات بنجاح");
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance/dashboard" },
        { label: "المصروفات التشغيلية والالتزامات" },
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
            <Printer className="h-4 w-4" /> طباعة تقرير المصروفات
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-danger px-3.5 text-xs font-extrabold text-white hover:bg-danger/90 shadow-sm"
          >
            <Plus className="h-4 w-4" /> تسجيل مصروف جديد
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <FinanceNavTabs activeTab="expenses" />
        
        <SmartAlert 
          type="info"
          title="نظام الاعتماد والقيود التلقائية"
          description="يتم ترحيل واعتماد بعض المصروفات آلياً من أنظمة أخرى (مثل مسير الرواتب والسلف في شؤون الموظفين). لا يمكن حذف أو تعديل هذه المصروفات من هنا لضمان التطابق المالي وقيد الدفتر العام."
        />

        {/* Aggregate KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FinancialCard 
            title="إجمالي المصروفات المسجلة" 
            value={aggregateStats.totalAmount} 
            currency={currency} 
            icon={TrendingDown} 
            colorClass="text-danger bg-danger" 
          />
          <FinancialCard 
            title="المصروفات المنفذة والمدفوعة" 
            value={aggregateStats.paidAmount} 
            currency={currency} 
            icon={CheckCircle2} 
            colorClass="text-success bg-success" 
          />
          <FinancialCard 
            title="تحت الاعتماد والتوريد" 
            value={aggregateStats.pendingAmount} 
            currency={currency} 
            icon={FileText} 
            colorClass="text-amber-500 bg-amber-500" 
          />
          <FinancialCard 
            title="عدد سندات الصرف" 
            value={aggregateStats.count} 
            currency="سند" 
            icon={CreditCard} 
            colorClass="text-primary bg-primary" 
          />
        </div>

        {/* Toolbar & Filters */}
        <FilterBar>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-extrabold">تصفية المصروفات</h2>
            {(categoryFilter || statusFilter !== "all" || q) && (
              <button 
                onClick={() => { setQ(""); setCategoryFilter(""); setStatusFilter("all"); }}
                className="text-xs font-bold text-danger hover:text-danger/80 bg-danger/10 px-2.5 py-0.5 rounded-full mr-2"
              >
                مسح الفلاتر ✕
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث بالبيان، المستفيد أو رقم السند..."
                className="h-11 w-full rounded-xl border border-border/80 bg-background/80 ps-10 pe-4 text-xs font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
              />
            </div>

            <select 
              className="h-11 rounded-xl border border-border/80 bg-background/80 px-3.5 text-xs font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">جميع فئات المصروفات</option>
              {allExpenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select 
              className="h-11 rounded-xl border border-border/80 bg-background/80 px-3.5 text-xs font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">جميع حالات الصرف</option>
              <option value="paid">تم الصرف والترحيل</option>
              <option value="approved">معتمد</option>
              <option value="submitted">مرفوع للاعتماد</option>
              <option value="draft">مسودة</option>
            </select>
          </div>
        </FilterBar>

        {/* Data Table */}
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <DataTable
            columns={[
              { key: "id", header: "رقم السند", cell: (r: any) => <span className="font-mono text-xs font-bold text-muted-foreground">{r.id}</span> },
              { key: "date", header: "التاريخ", cell: (r: any) => <span className="font-mono text-xs font-bold text-muted-foreground">{r.date ? r.date.split("T")[0] : "-"}</span> },
              { key: "title", header: "بيان المصروف", cell: (r: any) => <span className="font-extrabold text-sm">{r.title}</span> },
              { key: "category", header: "التصنيف", cell: (r: any) => <Badge tone="neutral">{getCategoryName(r.categoryId)}</Badge> },
              { key: "beneficiary", header: "المستفيد", cell: (r: any) => <span className="font-bold text-xs text-foreground">{r.beneficiary}</span> },
              { key: "amount", header: "المبلغ", cell: (r: any) => <span className="font-black text-danger tabular-nums text-base">{r.amount.toLocaleString()} {currency}</span> },
              { key: "method", header: "طريقة الدفع", cell: (r: any) => <span className="text-xs font-bold text-muted-foreground">{getMethodLabel(r.method)}</span> },
              { key: "status", header: "الحالة", cell: (r: any) => getStatusBadge(r.status || "submitted") },
              { key: "actions", header: "إجراءات", cell: (r: any) => (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setSelectedExpenseVoucher(r)}
                      className="text-xs font-bold text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-all"
                      title="معاينة وطباعة سند الصرف"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    {r.status !== "paid" && (
                      <button 
                        onClick={() => {
                          transitionExpenseStatus(r.id, "posted");
                          toast.success("تم صرف المصروف وقيده بالدفتر العام بنجاح");
                        }}
                        className="text-xs font-extrabold bg-success/10 text-success hover:bg-success hover:text-white px-2.5 py-1 rounded-lg transition-all"
                      >
                        صرف وترحيل
                      </button>
                    )}
                    <button 
                      onClick={() => setDeleteConfirmExpense(r)}
                      className="text-xs font-bold text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-all"
                      title="حذف المصروف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              }
            ]}
            rows={filtered}
            pageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
            empty="لا توجد مصروفات تطابق شروط الفلترة والبحث الحالية"
          />
        </div>
      </div>

      {/* --- Add Expense Modal with VAT & Session Awareness --- */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="تسجيل طلب ومصروف نفقة جديد"
        description="تسجيل سند صرف مالي وقيده في الحسابات والخزينة"
        icon={TrendingDown}
        tone="danger"
        maxWidth="lg"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground">بيان ووصف المصروف <span className="text-destructive">*</span></label>
            <input 
              type="text" 
              required 
              placeholder="مثال: شراء أحبار ومستلزمات مكتبية للإدارة" 
              value={newExpense.title}
              onChange={e => setNewExpense(prev => ({ ...prev, title: e.target.value }))}
              className="h-11 w-full rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all" 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">المبلغ الأساسي ({currency}) <span className="text-destructive">*</span></label>
              <div className="relative">
                <DollarSign className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="number" 
                  required 
                  min="1" 
                  placeholder="0.00" 
                  value={baseAmount}
                  onChange={e => setBaseAmount(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background/80 pr-10 pl-3.5 text-sm font-black tabular-nums text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all" 
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">تصنيف المصروف <span className="text-destructive">*</span></label>
              <select 
                required
                value={newExpense.categoryId}
                onChange={e => setNewExpense(prev => ({ ...prev, categoryId: e.target.value }))}
                className="h-11 w-full rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all cursor-pointer"
              >
                <option value="">-- اختر التصنيف --</option>
                {allExpenseCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* VAT Checkbox & Live Calculation */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/70">
              <input
                type="checkbox"
                id="vat-check"
                checked={includeVat}
                onChange={(e) => setIncludeVat(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="vat-check" className="text-xs font-bold text-foreground cursor-pointer flex-1">
                خاضع لضريبة القيمة المضافة (15% VAT)
              </label>
              {includeVat && Number(baseAmount) > 0 && (
                <Badge tone="primary" className="text-[10px] border-primary/30 text-primary">
                  + {Math.round(Number(baseAmount) * 0.15).toLocaleString()} {currency} ضريبة
                </Badge>
              )}
            </div>

            {includeVat && Number(baseAmount) > 0 && (
              <div className="grid grid-cols-3 gap-2 p-3 bg-primary/5 rounded-xl border border-primary/20 text-center text-xs font-mono">
                <div>
                  <span className="block text-[10px] font-sans text-muted-foreground">الأساسي</span>
                  <span className="font-bold text-foreground">{Number(baseAmount).toLocaleString()} {currency}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-sans text-muted-foreground">الضريبة 15%</span>
                  <span className="font-bold text-primary">{Math.round(Number(baseAmount) * 0.15).toLocaleString()} {currency}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-sans text-muted-foreground">الإجمالي النهائي</span>
                  <span className="font-black text-destructive">{Math.round(Number(baseAmount) * 1.15).toLocaleString()} {currency}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground">المستفيد / المورد / الموظف المستلم <span className="text-destructive">*</span></label>
            <input 
              type="text" 
              required 
              placeholder="اسم الشركة أو الفني أو الموظف المستلم..." 
              value={newExpense.beneficiary}
              onChange={e => setNewExpense(prev => ({ ...prev, beneficiary: e.target.value }))}
              className="h-11 w-full rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground">طريقة الدفع وسداد الصندوق <span className="text-destructive">*</span></label>
            <select 
              value={newExpense.method}
              onChange={e => setNewExpense(prev => ({ ...prev, method: e.target.value as any }))}
              className="h-11 w-full rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all cursor-pointer"
            >
              <option value="cash">نقدي (كاش من درج الخزينة)</option>
              <option value="bank_transfer">تحويل بنكي من حساب المدرسة</option>
              <option value="card">بطاقة دفع / مدى</option>
              <option value="cheque">شيك مصرفي</option>
            </select>
          </div>

          {newExpense.method === "cash" && (
            (() => {
              const openSession = allCashSessions.find(s => s.status === 'open');
              return (
                <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  openSession 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${openSession ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                    <span className="font-semibold">
                      {openSession 
                        ? `جلسة كاشير نشطة: ${(openSession as any).cashierName || (openSession as any).openedBy || openSession.userId || "أمين الخزينة"} (سيتم خصم المصروف من عهدتها مباشرة)`
                        : "تنبيه: لا توجد جلسة صندوق مفتوحة حالياً، سيتم قيد المصروف في الخزينة العامة"}
                    </span>
                  </div>
                </div>
              );
            })()
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground">ملاحظات ورقم الفاتورة المرفقة</label>
            <input 
              type="text" 
              placeholder="رقم الفاتورة الضريبية أو أي تفاصيل..." 
              value={newExpense.notes}
              onChange={e => setNewExpense(prev => ({ ...prev, notes: e.target.value }))}
              className="h-10 w-full rounded-xl border border-input bg-background/80 px-3.5 text-xs text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all" 
            />
          </div>

          <div className="pt-4 border-t border-border/70 flex justify-end gap-2.5">
            <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl px-5 h-11 text-xs font-semibold border border-input bg-background/80 hover:bg-accent transition-all active:scale-[0.98]">
              إلغاء
            </button>
            <button type="submit" className="rounded-xl bg-destructive px-6 h-11 text-xs font-extrabold text-destructive-foreground hover:bg-destructive/90 transition-all shadow-md active:scale-[0.98] flex items-center gap-2">
              <TrendingDown className="w-4 h-4" /> حفظ واعتماد سند الصرف
            </button>
          </div>
        </form>
      </AdminModal>

      {/* --- Official Printable Expense Voucher Modal --- */}
      <AdminModal
        isOpen={!!selectedExpenseVoucher}
        onClose={() => setSelectedExpenseVoucher(null)}
        title="معاينة سند صرف مالي رسمي"
        description="جاهز للطباعة والتوثيق المالي في الأرشيف"
        icon={FileText}
        tone="danger"
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-muted-foreground font-mono">سند صرف صادر آلياً من الإدارة المالية</span>
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
                onClick={() => setSelectedExpenseVoucher(null)}
                className="h-9 px-5 rounded-xl border border-input bg-background hover:bg-accent text-xs font-semibold transition-all"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        }
      >
        {selectedExpenseVoucher && (
          <div className="space-y-5 bg-card">
            {/* School Header */}
            <div className="flex justify-between items-center pb-4 border-b-2 border-destructive/20">
              <div className="text-right">
                <h2 className="text-sm font-black text-foreground">مجموعة مدارس الأفق النموذجية الأهلية</h2>
                <p className="text-[11px] text-muted-foreground">الإدارة المالية - قسم المصروفات والعهد</p>
                <p className="text-[10px] text-muted-foreground">الرقم الضريبي: 310294857200003</p>
              </div>
              <div className="text-center">
                <div className="border-2 border-destructive/40 rounded-2xl px-4 py-1.5 bg-destructive/5">
                  <span className="text-xs font-black text-destructive">سند صرف مالي معتمد</span>
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{selectedExpenseVoucher.id}</div>
                </div>
              </div>
              <div className="text-left font-mono text-[11px] text-muted-foreground">
                <div>التاريخ: {selectedExpenseVoucher.date ? selectedExpenseVoucher.date.split("T")[0] : "-"}</div>
                <div>الوقت: {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>

            {/* Voucher Main Content Table */}
            <div className="rounded-2xl border border-border/80 overflow-hidden divide-y divide-border/60 text-xs">
              <div className="flex items-center p-3 bg-muted/20">
                <span className="w-32 font-bold text-muted-foreground">يصرف إلى المكرم:</span>
                <span className="font-black text-foreground text-sm flex-1">{selectedExpenseVoucher.beneficiary}</span>
              </div>
              <div className="flex items-center p-3">
                <span className="w-32 font-bold text-muted-foreground">مبلغ وقدره:</span>
                <span className="font-mono font-black text-destructive text-base flex-1">
                  {selectedExpenseVoucher.amount.toLocaleString()} {currency}
                </span>
                <Badge tone="neutral" className="text-[10px]">{getMethodLabel(selectedExpenseVoucher.method)}</Badge>
              </div>
              <div className="flex items-center p-3 bg-muted/20">
                <span className="w-32 font-bold text-muted-foreground">وذلك عن بيان:</span>
                <span className="font-semibold text-foreground flex-1">{selectedExpenseVoucher.title}</span>
                <Badge tone="info" className="text-[10px]">{getCategoryName(selectedExpenseVoucher.categoryId)}</Badge>
              </div>
              {selectedExpenseVoucher.notes && (
                <div className="flex items-center p-3">
                  <span className="w-32 font-bold text-muted-foreground">ملاحظات ومرجع:</span>
                  <span className="text-muted-foreground flex-1">{selectedExpenseVoucher.notes}</span>
                </div>
              )}
            </div>

            {/* Signatures & Seal Area */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-dashed border-border/80 text-center text-xs">
              <div className="space-y-4">
                <span className="text-muted-foreground font-semibold">إعداد المحاسب المسؤول</span>
                <div className="h-10 border-b border-border/80 flex items-end justify-center pb-1 text-[10px] text-muted-foreground/60">
                  أمين الصندوق والخزينة
                </div>
              </div>
              <div className="space-y-4">
                <span className="text-muted-foreground font-semibold">اعتماد المدير المالي / المدير</span>
                <div className="h-10 border-b border-border/80 flex items-end justify-center pb-1 text-[10px] text-muted-foreground/60">
                  يعتمد للصرف
                </div>
              </div>
              <div className="space-y-4">
                <span className="text-muted-foreground font-semibold">توقيع المستلم للنفقة</span>
                <div className="h-10 border-b border-border/80 flex items-end justify-center pb-1 text-[10px] text-muted-foreground/60">
                  {selectedExpenseVoucher.beneficiary}
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
        title="تقرير المصروفات والنفقات التشغيلية"
        data={printData}
        templates={printTemplates}
      />

      {/* --- Delete Confirmation Luxury Modal --- */}
      <AdminModal
        isOpen={!!deleteConfirmExpense}
        onClose={() => setDeleteConfirmExpense(null)}
        title="تأكيد حذف سند المصروف"
        description="هل أنت متأكد من رغبتك في حذف سند المصروف التالي؟ لا يمكن التراجع عن هذا الإجراء."
        icon={AlertTriangle}
        tone="danger"
        maxWidth="md"
        footer={
          <div className="flex gap-3 w-full">
            <button 
              type="button"
              onClick={() => {
                if (deleteConfirmExpense) {
                  deleteExpense(deleteConfirmExpense.id);
                  toast.success("تم حذف سند المصروف بنجاح");
                  setDeleteConfirmExpense(null);
                }
              }}
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 font-extrabold py-2.5 rounded-xl shadow-md text-xs transition-all active:scale-[0.98]"
            >
              تأكيد الحذف
            </button>
            <button 
              type="button"
              onClick={() => setDeleteConfirmExpense(null)}
              className="flex-1 border border-input bg-background hover:bg-accent py-2.5 rounded-xl text-xs font-bold transition-all"
            >
              إلغاء
            </button>
          </div>
        }
      >
        {deleteConfirmExpense && (
          <div className="p-3.5 bg-muted/40 rounded-xl border border-border/70 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-bold">رقم السند:</span>
              <span className="font-mono font-bold text-foreground">{deleteConfirmExpense.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-bold">البيان:</span>
              <span className="font-extrabold text-foreground">{deleteConfirmExpense.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-bold">المستفيد:</span>
              <span className="font-bold text-foreground">{deleteConfirmExpense.beneficiary}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-bold">المبلغ:</span>
              <span className="font-black text-danger tabular-nums text-sm">{deleteConfirmExpense.amount.toLocaleString()} {currency}</span>
            </div>
          </div>
        )}
      </AdminModal>

    </AppShell>
  );
}
