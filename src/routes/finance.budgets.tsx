import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo, useEffect } from 'react';
import { AppShell, PageCard, Badge } from '@/components/app-shell';
import { useGlobalStore } from '@/contexts/GlobalStoreContext';
import { AdminModal } from '@/components/admin/admin-modal';
import { FinanceNavTabs } from '@/components/finance/finance-nav';
import { 
  PieChart, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  X, 
  DollarSign, 
  Building2, 
  Calendar,
  Lock,
  Unlock
} from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/finance/budgets')({
  component: FinanceBudgets,
});

export interface BudgetRecord {
  id: string;
  name: string;
  fiscalYear: string;
  department: string;
  totalAmount: number;
  spentAmount: number;
  status: 'active' | 'draft' | 'closed';
  notes?: string;
}

const defaultBudgets: BudgetRecord[] = [
  { id: 'BGT-2026-01', name: 'الميزانية التشغيلية المركزية - الفصل الثاني', fiscalYear: '1446 - 1447 هـ', totalAmount: 850000, spentAmount: 320000, status: 'active', department: 'الإدارة العامة', notes: 'تشمل الفواتير والضيافة والتكاليف الإدارية' },
  { id: 'BGT-2026-02', name: 'ميزانية الأنشطة الطلابية والرحلات', fiscalYear: '1446 - 1447 هـ', totalAmount: 120000, spentAmount: 95000, status: 'active', department: 'شؤون الطلاب', notes: 'الجوائز والمعسكرات والنشاط الكشفي' },
  { id: 'BGT-2026-03', name: 'ميزانية الصيانة الدورية والتطوير الهندسي', fiscalYear: '1446 - 1447 هـ', totalAmount: 250000, spentAmount: 230000, status: 'active', department: 'التشغيل والصيانة', notes: 'عقود المصاعد والتكييف والأمن والسلامة' },
  { id: 'BGT-2026-04', name: 'ميزانية شراء الأجهزة والتقنية التعليمية', fiscalYear: '1446 - 1447 هـ', totalAmount: 400000, spentAmount: 150000, status: 'draft', department: 'تقنية المعلومات', notes: 'تحديث أجهزة الحاسب وشبكة الواي فاي' },
];

function FinanceBudgets() {
  const { currency, allAcademicYears, currentAcademicYear, allExpenses } = useGlobalStore();

  const [budgets, setBudgets] = useState<BudgetRecord[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_budgets") : null;
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultBudgets;
  });

  useEffect(() => {
    try {
      localStorage.setItem("darasi_budgets", JSON.stringify(budgets));
    } catch {}
  }, [budgets]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'closed'>('all');

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetRecord | null>(null);
  const [deleteModalBudget, setDeleteModalBudget] = useState<BudgetRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    fiscalYear: currentAcademicYear?.name || '1446 - 1447 هـ',
    department: 'الإدارة العامة',
    totalAmount: 0,
    status: 'active' as 'active' | 'draft' | 'closed',
    notes: ''
  });

  // Calculate live spending from expenses where title/notes match department
  const budgetsWithLiveSpending = useMemo(() => {
    return budgets.map(b => {
      const relatedExpenses = (allExpenses || []).filter(e => {
        const text = (e.title + " " + (e.notes || "")).toLowerCase();
        return text.includes(b.department.toLowerCase()) || text.includes(b.name.toLowerCase());
      });

      const liveSpent = relatedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const effectiveSpent = Math.max(b.spentAmount, liveSpent);
      const remaining = Math.max(0, b.totalAmount - effectiveSpent);
      const percentage = b.totalAmount > 0 ? (effectiveSpent / b.totalAmount) * 100 : 0;

      return {
        ...b,
        spentAmount: effectiveSpent,
        remaining,
        percentage: Math.min(percentage, 100),
        isOverBudget: effectiveSpent > b.totalAmount,
      };
    });
  }, [budgets, allExpenses]);

  const filteredBudgets = useMemo(() => {
    return budgetsWithLiveSpending.filter(b => {
      const matchSearch = b.name.includes(searchTerm) || b.department.includes(searchTerm) || b.fiscalYear.includes(searchTerm);
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [budgetsWithLiveSpending, searchTerm, statusFilter]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const totalAllocated = budgetsWithLiveSpending.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalSpent = budgetsWithLiveSpending.reduce((sum, b) => sum + b.spentAmount, 0);
    const activeCount = budgetsWithLiveSpending.filter(b => b.status === 'active').length;
    const overLimitCount = budgetsWithLiveSpending.filter(b => b.percentage >= 90).length;
    return { totalAllocated, totalSpent, activeCount, overLimitCount };
  }, [budgetsWithLiveSpending]);

  const openAdd = () => {
    setEditingBudget(null);
    setFormData({
      name: '',
      fiscalYear: currentAcademicYear?.name || '1446 - 1447 هـ',
      department: 'الإدارة العامة',
      totalAmount: 0,
      status: 'active',
      notes: ''
    });
    setIsAddEditOpen(true);
  };

  const openEdit = (b: BudgetRecord) => {
    setEditingBudget(b);
    setFormData({
      name: b.name,
      fiscalYear: b.fiscalYear,
      department: b.department,
      totalAmount: b.totalAmount,
      status: b.status,
      notes: b.notes || ''
    });
    setIsAddEditOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.totalAmount <= 0) {
      toast.error("يرجى إدخال اسم الميزانية وتحديد مبلغ تقديري صالح");
      return;
    }

    if (editingBudget) {
      setBudgets(prev => prev.map(b => b.id === editingBudget.id ? { ...b, ...formData } : b));
      toast.success("تم تحديث الميزانية بنجاح");
    } else {
      const newBudget: BudgetRecord = {
        id: `BGT-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`,
        spentAmount: 0,
        ...formData
      };
      setBudgets(prev => [newBudget, ...prev]);
      toast.success("تم إنشاء الميزانية بنجاح");
    }
    setIsAddEditOpen(false);
    setEditingBudget(null);
  };

  const toggleStatus = (budget: BudgetRecord) => {
    const nextStatus = budget.status === 'draft' ? 'active' : budget.status === 'active' ? 'closed' : 'active';
    setBudgets(prev => prev.map(b => b.id === budget.id ? { ...b, status: nextStatus } : b));
    toast.success(`تم تغيير حالة الميزانية إلى: ${nextStatus === 'active' ? 'نشطة' : nextStatus === 'closed' ? 'مغلقة' : 'مسودة'}`);
  };

  const handleConfirmDelete = () => {
    if (!deleteModalBudget) return;
    setBudgets(prev => prev.filter(b => b.id !== deleteModalBudget.id));
    toast.success(`تم حذف الميزانية (${deleteModalBudget.name}) بنجاح`);
    setDeleteModalBudget(null);
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = ["معرف الميزانية", "اسم الميزانية", "السنة المالية", "القسم / الإدارة", "المبلغ التقديري", "المصروف الفعلي", "المتبقي", "الحالة"];
    const rows = budgetsWithLiveSpending.map(b => [
      `"${b.id}"`,
      `"${b.name}"`,
      `"${b.fiscalYear}"`,
      `"${b.department}"`,
      b.totalAmount,
      b.spentAmount,
      b.remaining,
      `"${b.status === 'active' ? 'نشطة' : b.status === 'closed' ? 'مغلقة' : 'مسودة'}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `budgets_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير الميزانيات إلى CSV بنجاح");
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance" },
        { label: "إدارة الميزانيات التقديرية" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button 
            onClick={exportToCSV}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3.5 text-xs font-black text-foreground shadow-sm hover:bg-accent transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-primary" /> تصدير CSV
          </button>
          <button 
            onClick={openAdd}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 text-xs font-black shadow-md hover:bg-primary/90 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> إنشاء ميزانية جديدة
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        {/* Unified Finance Navigation Tabs */}
        <FinanceNavTabs activeTab="budgets" />
        
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PageCard className="p-5 flex items-center gap-4 bg-card border border-border/60 rounded-3xl shadow-sm">
            <div className="p-3.5 bg-primary/10 text-primary rounded-2xl shrink-0">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي الموازنات المعتمدة</p>
              <p className="text-2xl font-black text-foreground tabular-nums mt-0.5">
                {stats.totalAllocated.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">{currency}</span>
              </p>
            </div>
          </PageCard>

          <PageCard className="p-5 flex items-center gap-4 bg-card border border-border/60 rounded-3xl shadow-sm">
            <div className="p-3.5 bg-amber-500/10 text-amber-600 rounded-2xl shrink-0">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي المنصرف الفعلي</p>
              <p className="text-2xl font-black text-amber-600 tabular-nums mt-0.5">
                {stats.totalSpent.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">{currency}</span>
              </p>
            </div>
          </PageCard>

          <PageCard className="p-5 flex items-center gap-4 bg-card border border-border/60 rounded-3xl shadow-sm">
            <div className="p-3.5 bg-emerald-500/10 text-emerald-600 rounded-2xl shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">الميزانيات النشطة</p>
              <p className="text-2xl font-black text-foreground tabular-nums mt-0.5">{stats.activeCount} ميزانية</p>
            </div>
          </PageCard>

          <PageCard className="p-5 flex items-center gap-4 bg-card border border-border/60 rounded-3xl shadow-sm">
            <div className="p-3.5 bg-rose-500/10 text-rose-600 rounded-2xl shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">ميزانيات قاربت النفاد (90%+)</p>
              <p className="text-2xl font-black text-rose-600 tabular-nums mt-0.5">{stats.overLimitCount} ميزانية</p>
            </div>
          </PageCard>
        </div>

        {/* Filter & Search Bar */}
        <PageCard className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="ابحث باسم الميزانية، القسم، أو السنة المالية..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 h-11 bg-muted/30 border border-border/70 rounded-xl text-xs font-bold focus:border-primary focus:ring-4 focus:ring-primary/15 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              {(['all', 'active', 'draft', 'closed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`h-9 px-3.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    statusFilter === st 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'bg-muted/40 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {st === 'all' ? 'الكل' : st === 'active' ? 'نشطة' : st === 'draft' ? 'مسودة' : 'مغلقة'}
                </button>
              ))}
            </div>
          </div>
        </PageCard>

        {/* Budgets Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBudgets.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-card border border-dashed border-border/70 rounded-3xl text-muted-foreground">
              <PieChart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <h4 className="font-black text-base text-foreground">لا توجد ميزانيات مطابقة</h4>
              <p className="text-xs text-muted-foreground mt-1">جرّب تغيير عبارة البحث أو إضافة ميزانية جديدة</p>
            </div>
          ) : (
            filteredBudgets.map(b => (
              <div 
                key={b.id} 
                className="bg-card border border-border/70 rounded-3xl p-5 hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden group"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[11px] font-mono font-bold text-muted-foreground">{b.id} • {b.fiscalYear}</span>
                    <Badge 
                      tone={b.status === 'active' ? 'success' : b.status === 'closed' ? 'neutral' : 'warning'} 
                      className="text-[10px]"
                    >
                      {b.status === 'active' ? 'نشطة' : b.status === 'closed' ? 'مغلقة' : 'مسودة'}
                    </Badge>
                  </div>

                  <h3 className="font-black text-base text-foreground group-hover:text-primary transition-colors">{b.name}</h3>
                  <div className="text-xs font-bold text-muted-foreground mt-0.5">{b.department}</div>

                  {b.notes && (
                    <p className="text-[11px] text-muted-foreground/80 mt-2 line-clamp-2">{b.notes}</p>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-border/50 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-muted-foreground">الإنفاق حتى الآن:</span>
                    <span className="text-lg font-black tabular-nums text-foreground">
                      {b.spentAmount.toLocaleString()} / <span className="text-sm font-bold text-muted-foreground">{b.totalAmount.toLocaleString()} {currency}</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          b.isOverBudget ? 'bg-danger' : b.percentage >= 90 ? 'bg-rose-500' : b.percentage >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(b.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                      <span>المتبقي: {b.remaining.toLocaleString()} {currency}</span>
                      <span className={b.percentage >= 90 ? 'text-danger font-black' : ''}>{Math.round(b.percentage)}%</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => toggleStatus(b)}
                      className="text-[11px] font-extrabold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {b.status === 'closed' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {b.status === 'draft' ? 'اعتماد ونشر' : b.status === 'active' ? 'إغلاق الميزانية' : 'إعادة تفعيل'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(b)}
                        className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white transition-all text-xs cursor-pointer"
                        title="تعديل الميزانية"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteModalBudget(b)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-all text-xs cursor-pointer"
                        title="حذف الميزانية"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- Add / Edit Budget Modal --- */}
      <AdminModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingBudget ? "تعديل الميزانية التقديرية" : "إنشاء ميزانية تقديرية جديدة"}
        description="تحديد السقف المالي والجهة المسؤولة"
        icon={PieChart}
        tone="primary"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-foreground mb-1.5">
              اسم وعنوان الميزانية <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: ميزانية الأنشطة الطلابية والرحلات"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-black text-foreground mb-1.5">
                السنة المالية
              </label>
              <input
                type="text"
                value={formData.fiscalYear}
                onChange={e => setFormData({ ...formData, fiscalYear: e.target.value })}
                className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-xs font-bold outline-none focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-foreground mb-1.5">
                القسم / الإدارة التابعة <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                list="budget-depts"
                placeholder="الإدارة العامة"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-xs font-bold outline-none focus:border-primary transition-all"
              />
              <datalist id="budget-depts">
                <option value="الإدارة العامة" />
                <option value="شؤون الطلاب" />
                <option value="التشغيل والصيانة" />
                <option value="تقنية المعلومات" />
                <option value="الشؤون الأكاديمية" />
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-black text-foreground mb-1.5">
                المبلغ التقديري المخصص ({currency}) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="0.00"
                value={formData.totalAmount || ""}
                onChange={e => setFormData({ ...formData, totalAmount: Number(e.target.value) || 0 })}
                className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-black tabular-nums outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all text-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-foreground mb-1.5">الحالة</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-3.5 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="active">نشطة ومعتمدة ✅</option>
                <option value="draft">مسودة قيد المراجعة 📝</option>
                <option value="closed">مغلقة ومؤرشفة 🔒</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-foreground mb-1.5">
              ملاحظات وتفاصيل التخصيص
            </label>
            <textarea
              rows={2}
              placeholder="ملاحظات حول نطاق الصرف وأوجه استخدام الميزانية..."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-3 rounded-xl border border-border/80 bg-background/80 text-xs font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2.5 border-t border-border/60">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="h-11 px-5 rounded-xl border border-border/80 bg-background hover:bg-accent text-xs font-bold transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="h-11 px-6 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> {editingBudget ? "حفظ التعديلات" : "اعتماد الميزانية"}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* --- Delete Confirmation Modal --- */}
      <AdminModal
        isOpen={!!deleteModalBudget}
        onClose={() => setDeleteModalBudget(null)}
        title="تأكيد حذف الميزانية"
        description={deleteModalBudget?.name || ""}
        icon={AlertTriangle}
        tone="danger"
        maxWidth="md"
      >
        {deleteModalBudget && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs font-bold text-rose-700 dark:text-rose-400 space-y-1">
              <p>هل أنت متأكد من حذف هذه الميزانية التقديرية؟</p>
              <p className="text-[11px] text-muted-foreground">
                المبلغ المقدر: <strong>{deleteModalBudget.totalAmount.toLocaleString()} {currency}</strong>
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModalBudget(null)}
                className="h-10 px-5 rounded-xl border border-border/80 bg-background hover:bg-accent text-xs font-bold transition-all cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="h-10 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition-all cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        )}
      </AdminModal>

    </AppShell>
  );
}
