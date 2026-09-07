import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { PackageOpen, Plus, Search, Trash2, Edit2, History, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export const Route = createFileRoute("/inventory/items")({
  component: InventoryItems,
});

const itemSchema = z.object({
  name: z.string().min(2, "اسم الصنف مطلوب"),
  category: z.string().min(2, "التصنيف مطلوب"),
  price: z.string().min(1, "سعر الصنف مطلوب"),
  quantity: z.coerce.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
});

type ItemForm = z.infer<typeof itemSchema>;

function InventoryItems() {
  const { allInventoryItems, allInventoryTransactions, addInventoryItem, updateInventoryItem, deleteInventoryItem, processInventoryTransaction, currency } = useGlobalStore();
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<'items' | 'transactions' | 'analytics'>('items');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  
  const [consumeItem, setConsumeItem] = useState<any | null>(null);
  const [consumeQuantity, setConsumeQuantity] = useState(1);
  const [consumeTo, setConsumeTo] = useState("");

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
  });

  const categories = useMemo(() => {
    const cats = new Set(allInventoryItems.map(i => i.category));
    return Array.from(cats);
  }, [allInventoryItems]);

  const onSubmit = (data: ItemForm) => {
    if (editItem) {
      updateInventoryItem(editItem.id, data);
      toast.success("تم تعديل الصنف بنجاح");
      setEditItem(null);
    } else {
      addInventoryItem(data);
      toast.success("تمت إضافة الصنف إلى المستودع بنجاح");
    }
    setIsModalOpen(false);
    reset();
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    setValue("name", item.name);
    setValue("category", item.category);
    setValue("price", item.price);
    setValue("quantity", item.quantity);
    setIsModalOpen(true);
  };

  const handleConsume = () => {
    if (!consumeItem) return;
    if (!consumeTo) {
      toast.error("يرجى تحديد المستلم");
      return;
    }
    try {
      processInventoryTransaction({
        type: "issue",
        itemId: consumeItem.id,
        quantity: consumeQuantity,
        by: "Admin",
        to: consumeTo,
      } as any); 
      toast.success(`تم صرف ${consumeQuantity} من ${consumeItem.name}`);
      setConsumeItem(null);
      setConsumeQuantity(1);
      setConsumeTo("");
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    }
  };

  const filtered = useMemo(() => {
    return allInventoryItems.filter((i) => {
      if (filterStatus !== "all" && i.status !== filterStatus) return false;
      if (filterCategory !== "all" && i.category !== filterCategory) return false;
      if (q && !i.name.includes(q) && !i.id.includes(q)) return false;
      return true;
    });
  }, [q, filterStatus, filterCategory, allInventoryItems]);

  // Analytics Data
  const analyticsData = useMemo(() => {
    const issuedTxs = allInventoryTransactions.filter(t => t.type === 'issue');
    const monthlyIssues: Record<string, number> = {};
    const categoryIssues: Record<string, number> = {};

    issuedTxs.forEach(tx => {
      const month = tx.date.substring(0, 7);
      monthlyIssues[month] = (monthlyIssues[month] || 0) + tx.quantity;
      
      const item = allInventoryItems.find(i => i.id === tx.itemId);
      if (item) {
        categoryIssues[item.category] = (categoryIssues[item.category] || 0) + tx.quantity;
      }
    });

    return {
      monthly: Object.entries(monthlyIssues).map(([month, count]) => ({ month, count })).sort((a, b) => a.month.localeCompare(b.month)),
      byCategory: Object.entries(categoryIssues).map(([name, value]) => ({ name, value }))
    };
  }, [allInventoryTransactions, allInventoryItems]);

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المستودعات" },
        { label: "الأصناف والمواد" },
      ]}
      actions={
        <button 
          onClick={() => {
            setEditItem(null);
            reset();
            setIsModalOpen(true);
          }}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> تعريف صنف جديد
        </button>
      }
    >
      <div className="space-y-4">
        
        {/* Tabs */}
        <div className="flex space-x-1 space-x-reverse rounded-xl bg-muted/50 p-1 w-full max-w-md mx-auto mb-6">
          <button onClick={() => setActiveTab('items')} className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${activeTab === 'items' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:bg-background/50'}`}>
            <PackageOpen className="h-4 w-4 inline-block ml-2" /> الأصناف والمخزون
          </button>
          <button onClick={() => setActiveTab('transactions')} className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${activeTab === 'transactions' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:bg-background/50'}`}>
            <History className="h-4 w-4 inline-block ml-2" /> سجل الصرف
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:bg-background/50'}`}>
            <TrendingUp className="h-4 w-4 inline-block ml-2" /> التحليلات
          </button>
        </div>

        {/* Consume Item Modal */}
        {consumeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
            <div className="w-full max-w-md rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 my-8">
              <div className="p-6 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shadow-inner border border-amber-500/20">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">صرف كمية من المخزون</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{consumeItem.name} (المتوفر حالياً: {consumeItem.quantity})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setConsumeItem(null); setConsumeQuantity(1); setConsumeTo(""); }}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">الكمية المراد صرفها</label>
                  <input
                    type="number"
                    min="1"
                    max={consumeItem.quantity}
                    value={consumeQuantity}
                    onChange={(e) => setConsumeQuantity(Number(e.target.value))}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">المستلم (طالب / موظف / قسم)</label>
                  <input
                    type="text"
                    value={consumeTo}
                    onChange={(e) => setConsumeTo(e.target.value)}
                    placeholder="مثال: قسم الصيانة، أ. عبد الله، عيادة المدرسة..."
                    className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                  />
                </div>

                <div className="pt-4 border-t border-border/50 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setConsumeItem(null); setConsumeQuantity(1); setConsumeTo(""); }}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold border border-border/80 hover:bg-accent transition-colors active:scale-[0.98]"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleConsume}
                    disabled={consumeQuantity <= 0 || consumeQuantity > consumeItem.quantity || !consumeTo}
                    className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 active:scale-[0.98]"
                  >
                    تأكيد إذن الصرف
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Item Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
            <div className="w-full max-w-md rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 my-8">
              <div className="p-6 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-inner border border-primary/20">
                    <PackageOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{editItem ? 'تعديل بيانات الصنف' : 'تعريف صنف مخزني جديد'}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">تسجيل الأصناف بالمستودع المركزي وتحديد الكميات</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); reset(); setEditItem(null); }}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">اسم الصنف <span className="text-destructive">*</span></label>
                  <input
                    {...register("name")}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                    placeholder="مثال: زي رياضي مقاس L"
                  />
                  {errors.name && <p className="text-xs font-bold text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">التصنيف المخزني <span className="text-destructive">*</span></label>
                  <input
                    {...register("category")}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                    placeholder="أزياء، قرطاسية، أجهزة، لوازم معمل..."
                    list="categories-list"
                  />
                  <datalist id="categories-list">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                  {errors.category && <p className="text-xs font-bold text-destructive">{errors.category.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">السعر التقديري <span className="text-destructive">*</span></label>
                  <input
                    {...register("price")}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                    placeholder={`مثال: 50 ${currency}`}
                  />
                  {errors.price && <p className="text-xs font-bold text-destructive">{errors.price.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">الكمية الافتتاحية <span className="text-destructive">*</span></label>
                  <input
                    type="number"
                    {...register("quantity")}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                  />
                  {errors.quantity && <p className="text-xs font-bold text-destructive">{errors.quantity.message}</p>}
                </div>

                <div className="pt-4 border-t border-border/50 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); reset(); setEditItem(null); }}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold border border-border/80 hover:bg-accent transition-colors active:scale-[0.98]"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-[0.98]"
                  >
                    {editItem ? 'حفظ التعديلات' : 'إضافة الصنف'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <>
            <div className="rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur-xl shadow-sm">
              <div className="grid gap-3.5 md:grid-cols-[1fr_200px_200px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="البحث في أصناف المستودع..."
                    className="h-11 w-full rounded-xl border border-border/80 bg-background/80 ps-10 pe-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="h-11 rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer"
                >
                  <option value="all">كل التصنيفات</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-11 rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer"
                >
                  <option value="all">حالة المخزون (الكل)</option>
                  <option value="available">متوفر</option>
                  <option value="low_stock">منخفض المخزون</option>
                  <option value="out_of_stock">نفدت الكمية</option>
                </select>
              </div>
            </div>

            <PageCard>
              <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
                <PackageOpen className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">دليل الأصناف والمواد (المستودع المركزي)</h2>
              </div>
              <DataTable
                rows={filtered}
                columns={[
                  { key: "id", header: "رقم الصنف", cell: (r) => <span className="font-bold text-muted-foreground text-xs">{r.id}</span> },
                  { key: "name", header: "اسم الصنف", cell: (r) => <span className="font-bold text-primary">{r.name}</span> },
                  { key: "category", header: "التصنيف", cell: (r) => r.category },
                  { key: "price", header: "السعر", cell: (r) => r.price.replace('{currency}', currency) },
                  { key: "quantity", header: "الكمية المتوفرة", cell: (r) => <span className="font-bold text-lg">{r.quantity}</span> },
                  {
                    key: "status",
                    header: "مستوى المخزون",
                    cell: (r) => (
                      <Badge tone={r.status === "available" ? "success" : r.status === "low_stock" ? "warning" : "danger"}>
                        {r.status === "available" ? "متوفر" : r.status === "low_stock" ? "منخفض المخزون" : "نفدت الكمية"}
                      </Badge>
                    ),
                  },
                  {
                    key: "actions",
                    header: "",
                    cell: (r) => (
                      <div className="flex justify-end gap-2 items-center">
                        <button 
                          onClick={() => { setConsumeItem(r); setConsumeQuantity(1); setConsumeTo(""); }} 
                          disabled={r.quantity <= 0}
                          className="px-4 py-1.5 text-sm bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                          صرف
                        </button>
                        <button onClick={() => handleEdit(r)} className="rounded-md p-2 text-primary hover:bg-primary/10 transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => { if(confirm('هل أنت متأكد من الحذف؟')) deleteInventoryItem(r.id); }} className="rounded-md p-2 text-danger hover:bg-danger/10 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  },
                ]}
                empty="لا توجد أصناف تطابق معايير البحث."
              />
            </PageCard>
          </>
        )}

        {activeTab === 'transactions' && (
          <PageCard>
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
              <History className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">سجل حركة المستودع (الصرف والإرجاع)</h2>
            </div>
            <DataTable
              rows={allInventoryTransactions}
              columns={[
                { key: "id", header: "رقم الحركة", cell: (r) => <span className="font-bold text-muted-foreground text-xs">{r.id}</span> },
                { key: "date", header: "التاريخ", cell: (r) => <div className="flex items-center gap-1"><Calendar className="h-3 w-3 text-muted-foreground"/> {r.date}</div> },
                { key: "itemName", header: "الصنف", cell: (r) => <span className="font-bold text-primary">{r.itemName}</span> },
                { 
                  key: "type", 
                  header: "نوع الحركة", 
                  cell: (r) => (
                    <Badge tone={r.type === 'issue' ? 'warning' : 'success'}>
                      {r.type === 'issue' ? 'صرف' : 'إرجاع/توريد'}
                    </Badge>
                  ) 
                },
                { key: "quantity", header: "الكمية", cell: (r) => <span className="font-bold">{r.quantity}</span> },
                { key: "to", header: "المستلم / الوجهة", cell: (r) => r.to },
                { key: "by", header: "المسؤول", cell: (r) => r.by },
              ]}
              empty="لا توجد حركات مسجلة في المستودع."
            />
          </PageCard>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PageCard title="استهلاك المستودع شهرياً (كميات)">
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="month" tick={{fill: '#888'}} />
                    <YAxis tick={{fill: '#888'}} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="count" name="الكمية المصروفة" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r: 4, fill: "hsl(var(--primary))"}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </PageCard>

            <PageCard title="توزيع الصرف حسب التصنيف">
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="name" tick={{fill: '#888'}} />
                    <YAxis tick={{fill: '#888'}} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{fill: 'transparent'}} />
                    <Bar dataKey="value" name="الكمية" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PageCard>
          </div>
        )}

      </div>
    </AppShell>
  );
}
