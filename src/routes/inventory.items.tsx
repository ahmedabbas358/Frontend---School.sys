import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { 
  PackageOpen, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  History, 
  TrendingUp, 
  Calendar, 
  AlertCircle,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  Layers,
  CheckCircle2,
  X,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { useState, useMemo } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export const Route = createFileRoute("/inventory/items")({
  head: () => ({ meta: [{ title: "إدارة المستودعات والأصناف | منصة مدارس" }] }),
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
  const { 
    allInventoryItems, 
    allInventoryTransactions, 
    addInventoryItem, 
    updateInventoryItem, 
    deleteInventoryItem, 
    processInventoryTransaction, 
    addActivityLog,
    currency 
  } = useGlobalStore();

  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<'items' | 'transactions' | 'analytics'>('items');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  
  const [consumeItem, setConsumeItem] = useState<any | null>(null);
  const [consumeQuantity, setConsumeQuantity] = useState(1);
  const [consumeTo, setConsumeTo] = useState("");

  const [restockItem, setRestockItem] = useState<any | null>(null);
  const [restockQuantity, setRestockQuantity] = useState(10);
  const [restockSupplier, setRestockSupplier] = useState("");

  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any | null>(null);

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
  });

  const categories = useMemo(() => {
    const cats = new Set(allInventoryItems.map(i => i.category));
    return Array.from(cats);
  }, [allInventoryItems]);

  // Inventory KPI statistics
  const stats = useMemo(() => {
    const totalItems = allInventoryItems.length;
    const totalQuantity = allInventoryItems.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    const lowStock = allInventoryItems.filter(i => i.status === "low_stock").length;
    const outOfStock = allInventoryItems.filter(i => i.status === "out_of_stock" || i.quantity <= 0).length;
    const available = allInventoryItems.filter(i => i.status === "available" && i.quantity > 0).length;
    return { totalItems, totalQuantity, lowStock, outOfStock, available };
  }, [allInventoryItems]);

  const onSubmit = (data: ItemForm) => {
    if (editItem) {
      updateInventoryItem(editItem.id, data);
      addActivityLog({
        action: "update",
        category: "inventory",
        details: `تحديث بيانات الصنف المخزني: ${data.name} (${editItem.id})`,
        targetId: editItem.id,
        timestamp: new Date().toISOString(),
      });
      toast.success("تم تعديل الصنف بنجاح");
      setEditItem(null);
    } else {
      addInventoryItem(data);
      addActivityLog({
        action: "create",
        category: "inventory",
        details: `إضافة صنف جديد للمستودع: ${data.name} بكمية ${data.quantity}`,
        timestamp: new Date().toISOString(),
      });
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
    if (!consumeTo.trim()) {
      toast.error("يرجى تحديد جهة أو اسم المستلم");
      return;
    }
    try {
      processInventoryTransaction({
        type: "issue",
        itemId: consumeItem.id,
        quantity: consumeQuantity,
        by: "أمين المستودع",
        to: consumeTo.trim(),
      } as any);

      addActivityLog({
        action: "update",
        category: "inventory",
        details: `صرف كمية (${consumeQuantity}) من الصنف (${consumeItem.name}) لصالح: ${consumeTo}`,
        targetId: consumeItem.id,
        timestamp: new Date().toISOString(),
      });

      toast.success(`تم صرف ${consumeQuantity} وحدة من ${consumeItem.name}`);
      setConsumeItem(null);
      setConsumeQuantity(1);
      setConsumeTo("");
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ أثناء الصرف");
    }
  };

  const handleRestock = () => {
    if (!restockItem) return;
    if (restockQuantity <= 0) {
      toast.error("يرجى تحديد كمية موجبة صالحة للتوريد");
      return;
    }

    try {
      processInventoryTransaction({
        type: "return",
        itemId: restockItem.id,
        quantity: restockQuantity,
        by: "أمين المستودع",
        to: restockSupplier ? `توريد من: ${restockSupplier}` : "إذن توريد وإيداع بالمستودع",
      } as any);

      addActivityLog({
        action: "update",
        category: "inventory",
        details: `توريد كمية إضافية (${restockQuantity}) للصنف (${restockItem.name}) - المورد: ${restockSupplier || "محلي"}`,
        targetId: restockItem.id,
        timestamp: new Date().toISOString(),
      });

      toast.success(`تم توريد ${restockQuantity} وحدة للصنف ${restockItem.name} وتحديث الرصيد`);
      setRestockItem(null);
      setRestockQuantity(10);
      setRestockSupplier("");
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ أثناء التوريد");
    }
  };

  const handleDeleteItem = () => {
    if (!deleteConfirmItem) return;
    deleteInventoryItem(deleteConfirmItem.id);
    addActivityLog({
      action: "delete",
      category: "inventory",
      details: `حذف الصنف المخزني: ${deleteConfirmItem.name} (${deleteConfirmItem.id})`,
      targetId: deleteConfirmItem.id,
      timestamp: new Date().toISOString(),
    });
    toast.success(`تم حذف الصنف ${deleteConfirmItem.name} نهائياً`);
    setDeleteConfirmItem(null);
  };

  const filtered = useMemo(() => {
    return allInventoryItems.filter((i) => {
      if (filterStatus !== "all" && i.status !== filterStatus) return false;
      if (filterCategory !== "all" && i.category !== filterCategory) return false;
      if (q && !i.name.includes(q) && !i.id.includes(q)) return false;
      return true;
    });
  }, [q, filterStatus, filterCategory, allInventoryItems]);

  // CSV Export
  const exportInventoryCsv = () => {
    const headers = ["رقم الصنف", "اسم الصنف", "التصنيف", "السعر", "الكمية المتوفرة", "حالة المخزون"];
    const rows = filtered.map(item => [
      `"${item.id}"`,
      `"${item.name}"`,
      `"${item.category}"`,
      `"${item.price}"`,
      item.quantity,
      `"${item.status === 'available' ? 'متوفر' : item.status === 'low_stock' ? 'منخفض' : 'نفدت الكمية'}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `سجل_المستودع_المدرسي_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير ملف إكسل للمستودع بنجاح");
  };

  // Analytics Data
  const analyticsData = useMemo(() => {
    const issuedTxs = allInventoryTransactions.filter(t => t.type === 'issue');
    const monthlyIssues: Record<string, number> = {};
    const categoryIssues: Record<string, number> = {};

    issuedTxs.forEach(tx => {
      const month = tx.date ? tx.date.substring(0, 7) : "2026-09";
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
        { label: "المرافق والخدمات" },
        { label: "المستودع المركزي والمخزون" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={exportInventoryCsv}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> تصدير CSV
          </button>
          <button 
            onClick={() => {
              setEditItem(null);
              reset();
              setIsModalOpen(true);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
          >
            <Plus className="h-4 w-4" /> تعريف صنف جديد
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Banner Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">إجمالي الأصناف المسجلة</span>
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <PackageOpen className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black tabular-nums">{stats.totalItems}</div>
            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">{stats.available} صنف برصيد كافٍ</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">إجمالي القطع بالمخزن</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
                <Layers className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600 tabular-nums">{stats.totalQuantity}</div>
            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">وحدة مخزنية جاهزة للصرف</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">أصناف قاربت على النفاد</span>
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 grid place-items-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-amber-600 tabular-nums">{stats.lowStock}</div>
            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">تتطلب أمر شراء وتوريد</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">أصناف نفدت بالكامل</span>
              <div className="h-9 w-9 rounded-xl bg-danger/10 text-danger grid place-items-center">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-danger tabular-nums">{stats.outOfStock}</div>
            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">رصيد المخزن 0 وحدة</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1.5 space-x-reverse rounded-2xl bg-muted/60 p-1.5 w-full max-w-md mx-auto shadow-inner border border-border/60">
          <button 
            onClick={() => setActiveTab('items')} 
            className={`flex-1 rounded-xl py-2 text-xs font-black transition-all ${
              activeTab === 'items' 
                ? 'bg-background shadow-xs text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <PackageOpen className="h-4 w-4 inline-block ml-1.5" /> الأصناف والمخزون
          </button>
          <button 
            onClick={() => setActiveTab('transactions')} 
            className={`flex-1 rounded-xl py-2 text-xs font-black transition-all ${
              activeTab === 'transactions' 
                ? 'bg-background shadow-xs text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="h-4 w-4 inline-block ml-1.5" /> سجل الحركات ({allInventoryTransactions.length})
          </button>
          <button 
            onClick={() => setActiveTab('analytics')} 
            className={`flex-1 rounded-xl py-2 text-xs font-black transition-all ${
              activeTab === 'analytics' 
                ? 'bg-background shadow-xs text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="h-4 w-4 inline-block ml-1.5" /> التحليلات البيانية
          </button>
        </div>

        {/* Tab 1: Items List */}
        {activeTab === 'items' && (
          <>
            {/* Filter and Search Bar */}
            <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="ابحث باسم الصنف أو الكود..."
                    className="h-10 w-full rounded-xl border border-border/80 bg-background/80 ps-9 pe-3 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                  />
                </div>

                <div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border/80 bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 cursor-pointer"
                  >
                    <option value="all">كافة التصنيفات المخزنية</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border/80 bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 cursor-pointer"
                  >
                    <option value="all">كافة مستويات الرصيد</option>
                    <option value="available">متوفر بكثرة</option>
                    <option value="low_stock">منخفض المخزون</option>
                    <option value="out_of_stock">نفدت الكمية</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <PageCard>
              <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-2">
                  <PackageOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-black text-foreground">دليل الأصناف والمواد بالمستودع المركزي ({filtered.length})</h2>
                </div>
                <button
                  onClick={exportInventoryCsv}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" /> تصدير القائمة
                </button>
              </div>

              <DataTable
                rows={filtered}
                columns={[
                  { 
                    key: "id", 
                    header: "كود الصنف", 
                    cell: (r) => <span className="font-mono font-bold text-muted-foreground text-xs">{r.id}</span> 
                  },
                  { 
                    key: "name", 
                    header: "اسم الصنف", 
                    cell: (r) => (
                      <div className="font-bold text-foreground">
                        <span>{r.name}</span>
                        <div className="text-[11px] text-muted-foreground font-normal">{r.category}</div>
                      </div>
                    ) 
                  },
                  { 
                    key: "price", 
                    header: "السعر التقديري", 
                    cell: (r) => <span className="font-bold tabular-nums text-xs">{r.price.replace('{currency}', currency)}</span> 
                  },
                  { 
                    key: "quantity", 
                    header: "الرصيد الحالي", 
                    cell: (r) => (
                      <span className={`font-black text-base tabular-nums ${r.quantity <= 0 ? 'text-danger' : r.quantity < 10 ? 'text-amber-600' : 'text-foreground'}`}>
                        {r.quantity}
                      </span>
                    ) 
                  },
                  {
                    key: "status",
                    header: "مستوى المخزون",
                    cell: (r) => (
                      <Badge tone={r.status === "available" && r.quantity > 0 ? "success" : r.status === "low_stock" ? "warning" : "danger"}>
                        {r.status === "available" && r.quantity > 0 ? "متوفر" : r.status === "low_stock" ? "منخفض" : "نفدت الكمية"}
                      </Badge>
                    ),
                  },
                  {
                    key: "actions",
                    header: "الإجراءات المتاحة",
                    cell: (r) => (
                      <div className="flex justify-end gap-1.5 items-center">
                        <button 
                          onClick={() => { setRestockItem(r); setRestockQuantity(10); setRestockSupplier(""); }} 
                          className="px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold rounded-lg hover:bg-emerald-500/20 transition-colors"
                          title="توريد / زيادة كمية"
                        >
                          + توريد
                        </button>

                        <button 
                          onClick={() => { setConsumeItem(r); setConsumeQuantity(1); setConsumeTo(""); }} 
                          disabled={r.quantity <= 0}
                          className="px-2.5 py-1 text-xs bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-40"
                          title="صرف كمية لقسم أو طالب"
                        >
                          صرف
                        </button>

                        <button 
                          onClick={() => handleEdit(r)} 
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="تعديل بيانات الصنف"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button 
                          onClick={() => setDeleteConfirmItem(r)} 
                          className="rounded-lg p-1.5 text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                          title="حذف الصنف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  },
                ]}
                empty="لا توجد أصناف تطابق معايير البحث الحالية."
              />
            </PageCard>
          </>
        )}

        {/* Tab 2: Transactions */}
        {activeTab === 'transactions' && (
          <PageCard>
            <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <h2 className="text-base font-black text-foreground">سجل حركة المستودع (الصرف والإرجاع والتوريد)</h2>
              </div>
            </div>
            <DataTable
              rows={allInventoryTransactions}
              columns={[
                { key: "id", header: "رقم الحركة", cell: (r) => <span className="font-mono text-xs font-bold text-muted-foreground">{r.id}</span> },
                { key: "date", header: "التاريخ", cell: (r) => <div className="flex items-center gap-1 tabular-nums text-xs"><Calendar className="h-3.5 w-3.5 text-muted-foreground"/> {r.date}</div> },
                { key: "itemName", header: "الصنف", cell: (r) => <span className="font-bold text-primary">{r.itemName}</span> },
                { 
                  key: "type", 
                  header: "نوع الحركة", 
                  cell: (r) => (
                    <Badge tone={r.type === 'issue' ? 'warning' : 'success'}>
                      {r.type === 'issue' ? 'صرف' : 'توريد / إرجاع'}
                    </Badge>
                  ) 
                },
                { key: "quantity", header: "الكمية", cell: (r) => <span className="font-black tabular-nums">{r.quantity}</span> },
                { key: "to", header: "المستلم / الوجهة", cell: (r) => <span className="text-xs font-medium">{r.to}</span> },
                { key: "by", header: "المسؤول المعتمد", cell: (r) => <span className="text-xs font-bold">{r.by}</span> },
              ]}
              empty="لا توجد حركات مسجلة في المستودع حتى الآن."
            />
          </PageCard>
        )}

        {/* Tab 3: Analytics */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PageCard title="استهلاك المستودع شهرياً (الكميات المصروفة)">
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)' }} />
                    <Line type="monotone" dataKey="count" name="الكمية المصروفة" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: "#2563EB" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </PageCard>

            <PageCard title="توزيع حركة الصرف حسب الفئات المخزنية">
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)' }} />
                    <Bar dataKey="value" name="الكمية" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PageCard>
          </div>
        )}
      </div>

      {/* MODAL 1: Consume Stock Modal */}
      {consumeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 my-8 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/50 bg-gradient-to-r from-card via-card/95 to-amber-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shadow-inner border border-amber-500/20">
                  <ArrowDownLeft className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">إذن صرف من المستودع</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{consumeItem.name} • الرصيد الحالي: {consumeItem.quantity}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setConsumeItem(null); setConsumeQuantity(1); setConsumeTo(""); }}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">الكمية المراد صرفها (بحد أقصى {consumeItem.quantity})</label>
                <input
                  type="number"
                  min="1"
                  max={consumeItem.quantity}
                  value={consumeQuantity}
                  onChange={(e) => setConsumeQuantity(Number(e.target.value))}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-base font-black text-primary shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">الجهة أو الشخص المستلم <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={consumeTo}
                  onChange={(e) => setConsumeTo(e.target.value)}
                  placeholder="مثال: قسم الصيانة، أ. عبد الله، العيادة المدرسية، الصف الأول..."
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                />
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setConsumeItem(null); setConsumeQuantity(1); setConsumeTo(""); }}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border/80 hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConsume}
                  disabled={consumeQuantity <= 0 || consumeQuantity > consumeItem.quantity || !consumeTo.trim()}
                  className="rounded-xl bg-primary px-6 py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-40 active:scale-[0.98]"
                >
                  تأكيد إذن الصرف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Restock Item Modal */}
      {restockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 my-8 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/50 bg-gradient-to-r from-card via-card/95 to-emerald-500/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-500/20">
                  <ArrowUpRight className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">توريد وزيادة رصيد المستودع</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{restockItem.name} • الرصيد الحالي: {restockItem.quantity}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setRestockItem(null); setRestockQuantity(10); setRestockSupplier(""); }}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">الكمية الموردة الجديدة</label>
                <input
                  type="number"
                  min="1"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(Number(e.target.value))}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-base font-black text-emerald-600 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">اسم المورد / رقم فاتورة الشراء</label>
                <input
                  type="text"
                  value={restockSupplier}
                  onChange={(e) => setRestockSupplier(e.target.value)}
                  placeholder="مثال: شركة النور للقرطاسية، فاتورة توريد 104..."
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                الرصيد بعد التوريد سيصبح: <strong>{restockItem.quantity + restockQuantity}</strong> وحدة
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setRestockItem(null); setRestockQuantity(10); setRestockSupplier(""); }}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border/80 hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleRestock}
                  disabled={restockQuantity <= 0}
                  className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black text-white hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-40 active:scale-[0.98]"
                >
                  تأكيد التوريد والإيداع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Add / Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 my-8 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/50 bg-gradient-to-r from-card via-card/95 to-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-inner border border-primary/20">
                  <PackageOpen className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">{editItem ? 'تعديل بيانات الصنف' : 'تعريف صنف مخزني جديد'}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">تسجيل الأصناف والمعدات بالمستودع المدرسي</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); reset(); setEditItem(null); }}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">اسم الصنف <span className="text-destructive">*</span></label>
                <input
                  {...register("name")}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                  placeholder="مثال: زي مدرسي، مقاعد دراسية، حبر طابعة..."
                />
                {errors.name && <p className="text-xs font-bold text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">التصنيف المخزني <span className="text-destructive">*</span></label>
                <input
                  {...register("category")}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                  placeholder="قرطاسية، تجهيزات فصول، أجهزة تقنية، ملابس..."
                  list="categories-list"
                />
                <datalist id="categories-list">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
                {errors.category && <p className="text-xs font-bold text-destructive">{errors.category.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-black text-primary shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                  />
                  {errors.quantity && <p className="text-xs font-bold text-destructive">{errors.quantity.message}</p>}
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); reset(); setEditItem(null); }}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border/80 hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-6 py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-[0.98]"
                >
                  {editItem ? "حفظ التعديلات" : "إضافة الصنف للمستودع"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 my-8 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/50 bg-gradient-to-r from-card via-card/95 to-destructive/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center shadow-inner border border-destructive/20">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">تأكيد حذف الصنف</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">حذف الصنف نهائياً من قيود المستودع</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm font-bold text-foreground">
                هل أنت متأكد من رغبتك في حذف هذا الصنف من المستودع؟
              </p>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">اسم الصنف:</span>
                  <span className="font-bold text-foreground">{deleteConfirmItem.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">التصنيف:</span>
                  <span className="font-bold text-foreground">{deleteConfirmItem.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الكمية الحالية بالمستودع:</span>
                  <span className="font-black text-primary">{deleteConfirmItem.quantity} وحدة</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmItem(null)}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border/80 hover:bg-accent transition-colors"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  onClick={handleDeleteItem}
                  className="rounded-xl bg-destructive px-6 py-2.5 text-xs font-black text-destructive-foreground hover:bg-destructive/90 transition-all shadow-md shadow-destructive/20 active:scale-[0.98]"
                >
                  نعم، تأكيد الحذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
