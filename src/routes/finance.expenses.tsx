import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Plus, TrendingDown, Search, Filter, Printer, Trash2, X } from "lucide-react";
import { useState, useMemo } from "react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { useGlobalStore, Expense } from "@/contexts/GlobalStoreContext";
import { toast } from "sonner";

export const Route = createFileRoute("/finance/expenses")({
  component: FinanceExpenses,
});

function FinanceExpenses() {
  const { currency, allExpenses, allExpenseCategories, addExpense, deleteExpense  } = useGlobalStore();
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
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
        { key: "beneficiary", label: "صرفنا للمكرم", type: "text" },
        { key: "title", label: "وذلك عبارة عن", type: "text" }
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
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_200px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="البحث في البيان، المستفيد، رقم السند..."
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
        </div>

        <PageCard>
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
            <TrendingDown className="h-5 w-5 text-danger" />
            <h2 className="text-lg font-bold">سجل المصروفات التشغيلية</h2>
          </div>
          <DataTable
            rows={filtered}
            columns={[
              { key: "id", header: "رقم السند", cell: (r) => <span className="font-bold">{r.id}</span> },
              { key: "title", header: "البيان", cell: (r) => <span className="font-medium">{r.title}</span> },
              { key: "category", header: "التصنيف", cell: (r) => <span className="text-sm font-medium px-2 py-1 bg-accent rounded-md">{getCategoryName(r.categoryId)}</span> },
              { key: "amount", header: "المبلغ", cell: (r) => <span className="font-bold text-danger text-lg">{r.amount.toLocaleString()} {currency}</span> },
              { key: "date", header: "التاريخ", cell: (r) => r.date },
              { key: "beneficiary", header: "المستفيد", cell: (r) => r.beneficiary },
              { key: "method", header: "طريقة الدفع", cell: (r) => getMethodLabel(r.method) },
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
                    <button 
                      onClick={() => {
                        if(confirm("هل أنت متأكد من حذف هذا السند؟")) {
                          deleteExpense(r.id);
                          toast.success("تم الحذف بنجاح");
                        }
                      }}
                      className="rounded-md p-2 text-danger hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </PageCard>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-danger/5 p-6 flex items-center justify-between border-b border-border/50">
              <h2 className="text-2xl font-black flex items-center gap-2 text-danger">
                <TrendingDown className="h-6 w-6" /> سند صرف جديد
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-accent transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddExpense} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">المبلغ (ر.س) <span className="text-danger">*</span></label>
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
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">الجهة المستفيدة <span className="text-danger">*</span></label>
                  <input
                    required
                    type="text"
                    placeholder="اسم الشركة أو المورد أو الموظف"
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-danger focus:outline-none focus:ring-1 focus:ring-danger transition-colors"
                    value={newExpense.beneficiary}
                    onChange={e => setNewExpense({...newExpense, beneficiary: e.target.value})}
                  />
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
