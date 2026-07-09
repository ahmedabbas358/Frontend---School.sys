import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Plus, TrendingDown, Search, Filter, Printer, Trash2, X, FileText, CreditCard, CheckCircle2 } from "lucide-react";
import { useState, useMemo } from "react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { FinancialCard, SmartAlert, FilterBar } from "@/components/financial-components";
import { useGlobalStore, Expense } from "@/contexts/GlobalStoreContext";
import { toast } from "sonner";

export const Route = createFileRoute("/finance/expenses")({
  component: FinanceExpenses,
});

function FinanceExpenses() {
  const { currency, allExpenses, allExpenseCategories, allStaff, addExpense, deleteExpense, submitExpense, approveExpense, postExpense } = useGlobalStore();
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [beneficiaryType, setBeneficiaryType] = useState<"manual" | "staff">("manual");
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintSingleOpen, setIsPrintSingleOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);

  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    title: "",
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    categoryId: "",
    beneficiary: "",
    method: "bank_transfer",
    notes: ""
  });

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount || !newExpense.categoryId || !newExpense.beneficiary) {
      toast.error("يرجى تعبئة الحقول المطلوبة");
      return;
    }
    addExpense(newExpense as Expense);
    toast.success("تم تسجيل المصروف بنجاح");
    setIsModalOpen(false);
    setNewExpense({
      title: "", amount: 0, date: new Date().toISOString().split('T')[0], categoryId: "", beneficiary: "", method: "bank_transfer", notes: ""
    });
  };

  const getCategoryName = (id: string) => allExpenseCategories.find(c => c.id === id)?.name || "غير مصنف";
  
  const getMethodLabel = (method: string) => {
    switch(method) {
      case "cash": return "نقدي";
      case "bank_transfer": return "حوالة بنكية";
      case "card": return "بطاقة (مدى/فيزا)";
      case "cheque": return "شيك";
      default: return method;
    }
  };

  const printTemplates: PrintTemplate[] = [
    {
      id: "expenses-report",
      name: "تقرير المصروفات",
      category: "المالية",
      type: "table",
      columns: [
        { label: "رقم السند", key: "id" },
        { label: "التصنيف", key: "categoryName" },
        { label: "البيان", key: "title" },
        { label: "المبلغ", key: "amountStr" },
        { label: "التاريخ", key: "date" },
        { label: "المستفيد", key: "beneficiary" },
        { label: "طريقة الدفع", key: "methodLabel" },
      ],
      description: "طباعة تقرير شامل بالمصروفات التشغيلية",
    },
    {
      id: "expense-voucher",
      name: "سند صرف",
      category: "المالية",
      type: "receipt",
      columns: [
        { label: "المبلغ", key: "amountStr" },
      ],
      customControls: [
        { key: "beneficiary", label: "صرفنا للمكرم", type: "text", defaultValue: "" },
        { key: "title", label: "وذلك عبارة عن", type: "text", defaultValue: "" }
      ]
    }
  ];

  const filtered = useMemo(() => {
    return allExpenses.filter(exp => {
      if (q && !exp.title.includes(q) && !exp.beneficiary.includes(q) && !exp.id.includes(q)) return false;
      if (categoryFilter && exp.categoryId !== categoryFilter) return false;
      return true;
    });
  }, [q, categoryFilter, allExpenses]);

  const printData = filtered.map(exp => ({
    ...exp,
    categoryName: getCategoryName(exp.categoryId),
    amountStr: `${exp.amount.toLocaleString()} {currency}`,
    methodLabel: getMethodLabel(exp.method)
  }));

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المالية والمحاسبة" },
        { label: "المصروفات" },
      ]}
      actions={
        <div className="flex gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-danger px-3 text-sm font-bold text-danger-foreground hover:bg-danger/90"
          >
            <Plus className="h-4 w-4" /> تسجيل مصروف جديد
          </button>
          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary/10 px-4 text-sm font-bold text-primary hover:bg-primary/20 transition-all border border-primary/20"
          >
            <Printer className="h-4 w-4" /> طباعة التقرير
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        
        <SmartAlert 
          type="info"
          title="نظام التكامل المالي النشط"
          description="يتم ترحيل واعتماد بعض المصروفات آلياً من أنظمة أخرى (مثل مسير الرواتب والسلف في شؤون الموظفين). لا يمكن حذف أو تعديل هذه المصروفات من هنا لضمان التطابق المالي."
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
          <FinancialCard 
            title="إجمالي المصروفات" 
            value={filtered.reduce((acc, curr) => acc + curr.amount, 0)} 
            currency={currency} 
            icon={TrendingDown} 
            colorClass="text-danger bg-danger" 
          />
          <FinancialCard 
            title="المصروفات الآلية (رواتب/سلف)" 
            value={filtered.filter(e => e.categoryId === "EXPCAT-1" || e.categoryId === "EXPCAT-6").reduce((acc, curr) => acc + curr.amount, 0)} 
            currency={currency} 
            icon={FileText} 
            colorClass="text-primary bg-primary" 
          />
          <FinancialCard 
            title="المصروفات اليدوية" 
            value={filtered.filter(e => e.categoryId !== "EXPCAT-1" && e.categoryId !== "EXPCAT-6").reduce((acc, curr) => acc + curr.amount, 0)} 
            currency={currency} 
            icon={CreditCard} 
            colorClass="text-warning bg-warning" 
          />
          <FinancialCard 
            title="إجمالي العمليات" 
            value={filtered.length} 
            currency="" 
            icon={FileText} 
            colorClass="text-foreground bg-muted" 
          />
        </div>

        <FilterBar>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-danger" />
            <h2 className="text-lg font-bold">سجل المصروفات التشغيلية</h2>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="البحث في البيان، المستفيد..."
                className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <select 
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">كل التصنيفات</option>
              {allExpenseCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </FilterBar>

        <PageCard>
          <DataTable
            rows={filtered}
            columns={[
              { key: "id", header: "رقم السند", cell: (r) => <span className="font-bold">{r.id}</span> },
              { key: "title", header: "البيان", cell: (r) => <div className="flex flex-col"><span className="font-medium">{r.title}</span>{(r.categoryId === "EXPCAT-1" || r.categoryId === "EXPCAT-6") && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded mt-1 w-max font-bold border border-primary/20">قيد آلي - شؤون الموظفين</span>}</div> },
              { key: "category", header: "التصنيف", cell: (r) => <span className="text-sm font-medium px-2 py-1 bg-accent rounded-md">{getCategoryName(r.categoryId)}</span> },
              { key: "amount", header: "المبلغ", cell: (r) => <span className="font-bold text-danger text-lg">{r.amount.toLocaleString()} {currency}</span> },
              { key: "date", header: "التاريخ", cell: (r) => r.date },
              { key: "beneficiary", header: "المستفيد", cell: (r) => r.beneficiary },
              { key: "method", header: "طريقة الدفع", cell: (r) => getMethodLabel(r.method) },
              {
                key: "status",
                header: "الحالة",
                cell: (r) => {
                  const statusColors: any = { draft: "neutral", submitted: "warning", approved: "success", posted: "primary" };
                  const statusLabels: any = { draft: "مسودة", submitted: "بانتظار الموافقة", approved: "معتمد", posted: "مرحّل" };
                  return (
                    <span className={`text-xs font-bold px-2 py-1 rounded bg-${statusColors[r.status || "draft"]}/10 text-${statusColors[r.status || "draft"]}`}>
                      {statusLabels[r.status || "draft"]}
                    </span>
                  );
                }
              },
              {
                key: "actions",
                header: "إعدادات",
                cell: (r) => (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        const fullExpense = {
                          ...r,
                          categoryName: getCategoryName(r.categoryId),
                          amountStr: `${r.amount.toLocaleString()} {currency}`,
                          methodLabel: getMethodLabel(r.method)
                        };
                        setSelectedExpense(fullExpense);
                        setIsPrintSingleOpen(true);
                      }}
                      className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
                      title="طباعة سند صرف"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    {(r.categoryId !== "EXPCAT-1" && r.categoryId !== "EXPCAT-6") && (!r.status || r.status === "draft") && (
                      <button 
                        onClick={() => {
                          submitExpense(r.id);
                          toast.success("تم تقديم المصروف للموافقة");
                        }}
                        className="rounded-md p-2 text-warning hover:bg-warning/10 transition-colors"
                        title="تقديم للموافقة"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    )}
                    {(r.categoryId !== "EXPCAT-1" && r.categoryId !== "EXPCAT-6") && r.status === "submitted" && (
                      <button 
                        onClick={() => {
                          approveExpense(r.id);
                          toast.success("تم اعتماد المصروف");
                        }}
                        className="rounded-md p-2 text-success hover:bg-success/10 transition-colors"
                        title="اعتماد المصروف"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                    {(r.categoryId !== "EXPCAT-1" && r.categoryId !== "EXPCAT-6") && r.status === "approved" && (
                      <button 
                        onClick={() => {
                          if(confirm("هل أنت متأكد من ترحيل المصروف؟ سيتم توليد قيد محاسبي.")) {
                            postExpense(r.id);
                            toast.success("تم ترحيل المصروف بنجاح");
                          }
                        }}
                        className="rounded-md p-2 text-primary hover:bg-primary/10 transition-colors"
                        title="ترحيل وإنشاء قيد محاسبي"
                      >
                        <CreditCard className="h-4 w-4" />
                      </button>
                    )}
                    {(r.categoryId !== "EXPCAT-1" && r.categoryId !== "EXPCAT-6" && r.status !== "posted") && (
                      <button 
                        onClick={() => {
                          if(confirm("هل أنت متأكد من حذف هذا السند؟")) {
                            deleteExpense(r.id);
                            toast.success("تم الحذف بنجاح");
                          }
                        }}
                        className="rounded-md p-2 text-danger hover:bg-danger/10 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </PageCard>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-3xl bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-danger/5 p-6 flex items-center justify-between border-b border-border/50">
              <h2 className="text-2xl font-black flex items-center gap-2 text-danger">
                <TrendingDown className="h-6 w-6" /> سند صرف جديد
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-accent transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            
            <form onSubmit={handleAddExpense} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">بيان المصروف <span className="text-danger">*</span></label>
                  <input
                    required
                    type="text"
                    placeholder="مثال: فاتورة كهرباء شهر سبتمبر"
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger transition-colors"
                    value={newExpense.title}
                    onChange={e => setNewExpense({...newExpense, title: e.target.value})}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">التصنيف المحاسبي <span className="text-danger">*</span></label>
                  <select
                    required
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger transition-colors"
                    value={newExpense.categoryId}
                    onChange={e => setNewExpense({...newExpense, categoryId: e.target.value})}
                  >
                    <option value="">-- اختر التصنيف --</option>
                    {allExpenseCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">المبلغ ({currency}) <span className="text-danger">*</span></label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-black text-xl text-danger focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger transition-colors tabular-nums"
                    value={newExpense.amount || ""}
                    onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">نوع المستفيد <span className="text-danger">*</span></label>
                  <select
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger transition-colors mb-2"
                    value={beneficiaryType}
                    onChange={e => {
                      setBeneficiaryType(e.target.value as any);
                      setNewExpense({...newExpense, beneficiary: ""});
                    }}
                  >
                    <option value="manual">جهة خارجية / أخرى</option>
                    <option value="staff">موظف (مورد بشري)</option>
                  </select>

                  {beneficiaryType === "manual" ? (
                    <input
                      required
                      type="text"
                      placeholder="اسم الشركة أو المورد"
                      className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger transition-colors"
                      value={newExpense.beneficiary}
                      onChange={e => setNewExpense({...newExpense, beneficiary: e.target.value})}
                    />
                  ) : (
                    <select
                      required
                      className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger transition-colors"
                      value={newExpense.beneficiary}
                      onChange={e => setNewExpense({...newExpense, beneficiary: e.target.value})}
                    >
                      <option value="">-- اختر الموظف --</option>
                      {allStaff.map(s => (
                        <option key={s.id} value={s.name}>{s.name} - {s.role}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">طريقة الدفع <span className="text-danger">*</span></label>
                  <select
                    required
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger transition-colors"
                    value={newExpense.method}
                    onChange={e => setNewExpense({...newExpense, method: e.target.value as any})}
                  >
                    <option value="bank_transfer">حوالة بنكية</option>
                    <option value="card">بطاقة مدى / فيزا</option>
                    <option value="cash">نقدي (صندوق)</option>
                    <option value="cheque">شيك مصدق</option>
                  </select>
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">التاريخ</label>
                  <input
                    required
                    type="date"
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-medium focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger transition-colors"
                    value={newExpense.date}
                    onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">رقم المرجع (اختياري)</label>
                  <input
                    type="text"
                    placeholder="رقم الحوالة أو الشيك"
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-medium focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger transition-colors"
                    value={newExpense.referenceNo || ""}
                    onChange={e => setNewExpense({...newExpense, referenceNo: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">ملاحظات إضافية (اختياري)</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-medium focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger transition-colors resize-none"
                    value={newExpense.notes || ""}
                    onChange={e => setNewExpense({...newExpense, notes: e.target.value})}
                  ></textarea>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-border/50 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-5 py-2.5 font-bold hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="rounded-xl bg-danger px-8 py-2.5 font-bold text-danger-foreground hover:bg-danger/90 transition-colors shadow-sm flex items-center gap-2"
                >
                  <TrendingDown className="h-4 w-4" /> حفظ السند واعتماد الصرف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedExpense && (
        <AdvancedPrintEngine 
          isOpen={isPrintSingleOpen} 
          onClose={() => {
            setIsPrintSingleOpen(false);
            setSelectedExpense(null);
          }} 
          title={`سند صرف رقم - ${selectedExpense.id}`}
          data={[selectedExpense]}
          templates={[printTemplates[1]]} 
        />
      )}

      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title="تقرير المصروفات التشغيلية"
        data={printData}
        templates={[printTemplates[0]]} 
      />
    </AppShell>
  );
}
