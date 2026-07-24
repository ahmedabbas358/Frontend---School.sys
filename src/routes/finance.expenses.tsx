import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Plus, TrendingDown, Search, Filter, Printer, Trash2, X, FileText, CreditCard, CheckCircle2, ShieldAlert, ArrowUpRight, DollarSign } from "lucide-react";
import { useState, useMemo } from "react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { FinancialCard, SmartAlert, FilterBar } from "@/components/financial-components";
import { useGlobalStore, Expense } from "@/contexts/GlobalStoreContext";
import { useWorkflowEngine } from "@/engines/finance/useWorkflowEngine";
import { toast } from "sonner";

export const Route = createFileRoute("/finance/expenses")({
  component: FinanceExpenses,
});

function FinanceExpenses() {
  const { currency, allExpenses, allExpenseCategories, allStaff, addExpense, deleteExpense } = useGlobalStore();
  const { transitionExpenseStatus } = useWorkflowEngine();
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    if (!newExpense.title || !newExpense.amount || !newExpense.categoryId || !newExpense.beneficiary) {
      toast.error("يرجى تعبئة جميع الحقول الإلزامية");
      return;
    }
    addExpense(newExpense as Expense);
    toast.success("تم تسجيل طلب المصروف بنجاح وسند الدفع");
    setIsModalOpen(false);
    setNewExpense({
      title: "", amount: 0, date: new Date().toISOString().split('T')[0], categoryId: "", beneficiary: "", method: "bank_transfer", notes: "", status: "submitted"
    });
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

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance/dashboard" },
        { label: "المصروفات التشغيلية والالتزامات" },
      ]}
      actions={
        <div className="flex gap-2">
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
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث بالبيان، المستفيد أو رقم السند..."
                className="h-9 w-full rounded-xl border border-border/60 bg-background pr-9 pl-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <select 
              className="h-9 rounded-xl border border-border/60 bg-background px-2.5 text-xs font-bold cursor-pointer outline-none"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">جميع فئات المصروفات</option>
              {allExpenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select 
              className="h-9 rounded-xl border border-border/60 bg-background px-2.5 text-xs font-bold cursor-pointer outline-none"
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
                      onClick={() => {
                        deleteExpense(r.id);
                        toast.success("تم حذف المصروف بنجاح");
                      }}
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

      {/* --- Add Expense Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border/50 flex justify-between items-center bg-danger/10">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-danger">
                <Plus className="w-5 h-5" /> تسجيل طلب مصروف ونفقة جديدة
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">بيان ووصف المصروف <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  required 
                  placeholder="مثال: شراء أحبار ومستلزمات مكتبية" 
                  value={newExpense.title}
                  onChange={e => setNewExpense(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-sm focus:ring-2 focus:ring-danger/50 outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">المبلغ المطلوب ({currency}) <span className="text-danger">*</span></label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    placeholder="أدخل المبلغ..." 
                    value={newExpense.amount || ""}
                    onChange={e => setNewExpense(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-base focus:ring-2 focus:ring-danger/50 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">تصنيف المصروف <span className="text-danger">*</span></label>
                  <select 
                    required
                    value={newExpense.categoryId}
                    onChange={e => setNewExpense(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-xs focus:ring-2 focus:ring-danger/50 outline-none"
                  >
                    <option value="">-- اختر التصنيف --</option>
                    {allExpenseCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">المستفيد / المورد / الموظف <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  required 
                  placeholder="اسم الشركة أو الموظف المستلم..." 
                  value={newExpense.beneficiary}
                  onChange={e => setNewExpense(prev => ({ ...prev, beneficiary: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-sm focus:ring-2 focus:ring-danger/50 outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">طريقة الدفع وسداد الصندوق</label>
                <select 
                  value={newExpense.method}
                  onChange={e => setNewExpense(prev => ({ ...prev, method: e.target.value as any }))}
                  className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-sm focus:ring-2 focus:ring-danger/50 outline-none"
                >
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="cash">نقدي (كاش الخزينة)</option>
                  <option value="card">بطاقة دفع</option>
                  <option value="cheque">شيك مصرفي</option>
                </select>
              </div>

              <div className="pt-3 flex gap-3">
                <button type="submit" className="flex-1 btn-primary bg-danger hover:bg-danger/90 font-extrabold py-2.5 rounded-xl">حفظ وسجل المصروف</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary py-2.5 rounded-xl">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Advanced Print Engine --- */}
      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="تقرير المصروفات والنفقات التشغيلية"
        data={printData}
        templates={printTemplates}
      />

    </AppShell>
  );
}
