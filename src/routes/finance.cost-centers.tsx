import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo, useEffect } from 'react';
import { AppShell, PageCard, Badge } from '@/components/app-shell';
import { DataTable } from '@/components/data-table';
import { useGlobalStore } from '@/contexts/GlobalStoreContext';
import { AdminModal } from '@/components/admin/admin-modal';
import { FinanceNavTabs } from '@/components/finance/finance-nav';
import { 
  Target, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Briefcase, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Layers, 
  BarChart3,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/finance/cost-centers')({
  component: FinanceCostCenters,
});

export interface CostCenterRecord {
  id: string;
  code: string;
  name: string;
  department: string;
  manager?: string;
  allocatedBudget: number;
  description?: string;
  status: "active" | "inactive";
}

const defaultCostCenters: CostCenterRecord[] = [
  { id: 'CC-001', code: 'ADM-01', name: 'الإدارة العامة والتشغيل', department: 'الإدارة', manager: 'خالد القحطاني', allocatedBudget: 500000, description: 'مصروفات الإدارة والخدمات المركزية', status: 'active' },
  { id: 'CC-002', code: 'EDU-01', name: 'الشؤون الأكاديمية والتعليمية', department: 'التعليم', manager: 'أ. محمد السعيد', allocatedBudget: 1200000, description: 'رواتب المعلمين وتجهيزات الفصول والمعامل', status: 'active' },
  { id: 'CC-003', code: 'BUS-01', name: 'إدارة الحركة والنقل المدرسي', department: 'الخدمات', manager: 'سعد القحطاني', allocatedBudget: 350000, description: 'وقود وصيانة أسطول الحافلات والمشرفين', status: 'active' },
  { id: 'CC-004', code: 'FAC-01', name: 'المرافق والصيانة العامة', department: 'التشغيل', manager: 'م. حسام الدين', allocatedBudget: 250000, description: 'صيانة المباني والتكييف والكهرباء', status: 'active' },
  { id: 'CC-005', code: 'ACT-01', name: 'الأنشطة والرياضة والرحلات', department: 'شؤون الطلاب', manager: 'وليد تركي', allocatedBudget: 150000, description: 'المسابقات والأنشطة اللاصفية والجوائز', status: 'active' },
];

function FinanceCostCenters() {
  const { currency, allExpenses } = useGlobalStore();

  const [costCenters, setCostCenters] = useState<CostCenterRecord[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("darasi_cost_centers") : null;
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultCostCenters;
  });

  useEffect(() => {
    try {
      localStorage.setItem("darasi_cost_centers", JSON.stringify(costCenters));
    } catch {}
  }, [costCenters]);

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingCC, setEditingCC] = useState<CostCenterRecord | null>(null);
  const [deleteModalCC, setDeleteModalCC] = useState<CostCenterRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department: 'الإدارة',
    manager: '',
    allocatedBudget: 0,
    description: '',
    status: 'active' as 'active' | 'inactive'
  });

  // Calculate actual spending per cost center from real expenses
  const costCentersWithSpending = useMemo(() => {
    return costCenters.map(cc => {
      // Find expenses matching costCenterId or department/category title
      const directExpenses = (allExpenses || []).filter(e => {
        if (e.costCenterId) return e.costCenterId === cc.id;
        const text = (e.title + " " + (e.notes || "")).toLowerCase();
        return text.includes(cc.name.toLowerCase()) || text.includes(cc.department.toLowerCase());
      });

      const spentAmount = directExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const remainingBudget = Math.max(0, cc.allocatedBudget - spentAmount);
      const percentage = cc.allocatedBudget > 0 ? (spentAmount / cc.allocatedBudget) * 100 : 0;

      return {
        ...cc,
        spentAmount,
        remainingBudget,
        percentage: Math.min(percentage, 100),
        isOverBudget: spentAmount > cc.allocatedBudget,
        expensesCount: directExpenses.length
      };
    });
  }, [costCenters, allExpenses]);

  const filteredCCs = useMemo(() => {
    return costCentersWithSpending.filter(cc => {
      const matchSearch = cc.name.includes(searchTerm) || cc.code.includes(searchTerm) || (cc.manager || '').includes(searchTerm);
      const matchDept = departmentFilter === 'all' || cc.department === departmentFilter;
      return matchSearch && matchDept;
    });
  }, [costCentersWithSpending, searchTerm, departmentFilter]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const totalCenters = costCentersWithSpending.length;
    const totalAllocated = costCentersWithSpending.reduce((sum, cc) => sum + cc.allocatedBudget, 0);
    const totalSpent = costCentersWithSpending.reduce((sum, cc) => sum + cc.spentAmount, 0);
    const overBudgetCount = costCentersWithSpending.filter(cc => cc.isOverBudget).length;
    return { totalCenters, totalAllocated, totalSpent, overBudgetCount };
  }, [costCentersWithSpending]);

  const departments = useMemo(() => {
    return Array.from(new Set(costCenters.map(c => c.department)));
  }, [costCenters]);

  const openAdd = () => {
    setEditingCC(null);
    setFormData({
      code: `CC-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      department: 'الإدارة',
      manager: '',
      allocatedBudget: 0,
      description: '',
      status: 'active'
    });
    setIsAddEditOpen(true);
  };

  const openEdit = (cc: CostCenterRecord) => {
    setEditingCC(cc);
    setFormData({
      code: cc.code,
      name: cc.name,
      department: cc.department,
      manager: cc.manager || '',
      allocatedBudget: cc.allocatedBudget,
      description: cc.description || '',
      status: cc.status
    });
    setIsAddEditOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("يرجى إدخال اسم ورمز مركز التكلفة");
      return;
    }

    if (editingCC) {
      setCostCenters(prev => prev.map(c => c.id === editingCC.id ? { ...c, ...formData } : c));
      toast.success("تم تحديث مركز التكلفة بنجاح");
    } else {
      const newCC: CostCenterRecord = {
        id: `CC-${Math.floor(1000 + Math.random() * 9000)}`,
        ...formData
      };
      setCostCenters(prev => [newCC, ...prev]);
      toast.success("تم إنشاء مركز التكلفة بنجاح");
    }
    setIsAddEditOpen(false);
    setEditingCC(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteModalCC) return;
    setCostCenters(prev => prev.filter(c => c.id !== deleteModalCC.id));
    toast.success(`تم حذف مركز التكلفة (${deleteModalCC.name}) بنجاح`);
    setDeleteModalCC(null);
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = ["الرمز", "اسم المركز", "القسم / الإدارة", "المسؤول", "الميزانية المخصصة", "المصروف الفعلي", "المتبقي", "الحالة"];
    const rows = costCentersWithSpending.map(c => [
      `"${c.code}"`,
      `"${c.name}"`,
      `"${c.department}"`,
      `"${c.manager || '-'}"`,
      c.allocatedBudget,
      c.spentAmount,
      c.remainingBudget,
      `"${c.status === 'active' ? 'نشط' : 'معطل'}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `cost_centers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير مراكز التكلفة إلى CSV بنجاح");
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance" },
        { label: "مراكز التكلفة" },
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
            <Plus className="w-4 h-4" /> إضافة مركز تكلفة جديد
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        {/* Unified Finance Navigation Tabs */}
        <FinanceNavTabs activeTab="cost-centers" />
        
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PageCard className="p-5 flex items-center gap-4 bg-card border border-border/60 rounded-3xl shadow-sm">
            <div className="p-3.5 bg-primary/10 text-primary rounded-2xl shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي مراكز التكلفة</p>
              <p className="text-2xl font-black text-foreground tabular-nums mt-0.5">{stats.totalCenters}</p>
            </div>
          </PageCard>

          <PageCard className="p-5 flex items-center gap-4 bg-card border border-border/60 rounded-3xl shadow-sm">
            <div className="p-3.5 bg-blue-500/10 text-blue-600 rounded-2xl shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي المخصص المالي</p>
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
              <p className="text-xs font-bold text-muted-foreground">المصروف الفعلي حتى الآن</p>
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
              <p className="text-xs font-bold text-muted-foreground">نسبة استهلاك الميزانيات</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl font-black text-foreground">
                  {stats.totalAllocated > 0 ? Math.round((stats.totalSpent / stats.totalAllocated) * 100) : 0}%
                </span>
                {stats.overBudgetCount > 0 ? (
                  <Badge tone="danger" className="text-[10px]">{stats.overBudgetCount} تجاوز</Badge>
                ) : (
                  <Badge tone="success" className="text-[10px]">ضمن الخطة</Badge>
                )}
              </div>
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
                placeholder="ابحث بالاسم، الرمز، أو اسم المدير المسؤول..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 h-11 bg-muted/30 border border-border/70 rounded-xl text-xs font-bold focus:border-primary focus:ring-4 focus:ring-primary/15 outline-none transition-all"
              />
            </div>

            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="h-11 px-3.5 rounded-xl border border-border/70 bg-card text-xs font-bold outline-none focus:border-primary cursor-pointer w-full sm:w-auto"
            >
              <option value="all">جميع الأقسام والإدارات</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </PageCard>

        {/* Cost Centers Data Table */}
        <PageCard className="p-0 overflow-hidden">
          <DataTable
            columns={[
              { 
                key: "code", 
                header: "الرمز", 
                cell: (r: any) => <span className="font-mono font-black text-xs text-primary">{r.code}</span> 
              },
              { 
                key: "name", 
                header: "مركز التكلفة", 
                cell: (r: any) => (
                  <div>
                    <div className="font-black text-sm text-foreground">{r.name}</div>
                    {r.description && <div className="text-[11px] text-muted-foreground">{r.description}</div>}
                  </div>
                ) 
              },
              { 
                key: "department", 
                header: "القسم / الإدارة", 
                cell: (r: any) => <Badge tone="neutral" className="text-xs font-bold">{r.department}</Badge> 
              },
              { 
                key: "manager", 
                header: "المشرف المسؤول", 
                cell: (r: any) => <span className="text-xs font-bold text-foreground">{r.manager || "-"}</span> 
              },
              { 
                key: "allocatedBudget", 
                header: "الميزانية المخصصة", 
                cell: (r: any) => <span className="font-black text-xs tabular-nums text-foreground">{r.allocatedBudget.toLocaleString()} {currency}</span> 
              },
              { 
                key: "spendingProgress", 
                header: "الاستهلاك والإنفاق الفعلي", 
                cell: (r: any) => (
                  <div className="w-36 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className={r.isOverBudget ? "text-danger" : "text-foreground"}>
                        {r.spentAmount.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">{Math.round(r.percentage)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          r.isOverBudget ? "bg-danger" : r.percentage > 80 ? "bg-amber-500" : "bg-emerald-500"
                        }`} 
                        style={{ width: `${Math.min(r.percentage, 100)}%` }} 
                      />
                    </div>
                  </div>
                ) 
              },
              { 
                key: "status", 
                header: "الحالة", 
                cell: (r: any) => (
                  <Badge tone={r.status === "active" ? "success" : "neutral"} className="text-[10px]">
                    {r.status === "active" ? "نشط" : "معطل"}
                  </Badge>
                ) 
              },
              { 
                key: "actions", 
                header: "إجراءات", 
                cell: (r: any) => (
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => openEdit(r)}
                      className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white transition-all text-xs cursor-pointer"
                      title="تعديل مركز التكلفة"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setDeleteModalCC(r)}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-all text-xs cursor-pointer"
                      title="حذف مركز التكلفة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) 
              }
            ]}
            rows={filteredCCs}
            pageSize={10}
            pageSizeOptions={[10, 25, 50]}
            empty="لا توجد مراكز تكلفة مطابقة لخيارات التصفية"
          />
        </PageCard>
      </div>

      {/* --- Add / Edit Cost Center Modal --- */}
      <AdminModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingCC ? "تعديل مركز التكلفة" : "إضافة مركز تكلفة جديد"}
        description="تحديد الميزانية والقسم والمشرف المالي"
        icon={Target}
        tone="primary"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-black text-foreground mb-1.5">
                رمز المركز <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="ADM-01"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-xs font-mono font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-foreground mb-1.5">
                القسم / الإدارة التابعة <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                list="departments-list"
                placeholder="مثال: الإدارة، التعليم..."
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
              />
              <datalist id="departments-list">
                <option value="الإدارة العامة" />
                <option value="التعليم والشؤون الأكاديمية" />
                <option value="الخدمات والنقل" />
                <option value="المرافق والتشغيل" />
                <option value="شؤون الطلاب والأنشطة" />
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-foreground mb-1.5">
              اسم مركز التكلفة <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: الشؤون التعليمية والمختبرات"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-black text-foreground mb-1.5">
                المشرف / المسؤول
              </label>
              <input
                type="text"
                placeholder="اسم المسؤول المالي للمركز"
                value={formData.manager}
                onChange={e => setFormData({ ...formData, manager: e.target.value })}
                className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-foreground mb-1.5">
                الميزانية التقديرية ({currency})
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formData.allocatedBudget || ""}
                onChange={e => setFormData({ ...formData, allocatedBudget: Number(e.target.value) || 0 })}
                className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-black tabular-nums outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all text-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-foreground mb-1.5">
              الوصف والغرض من مركز التكلفة
            </label>
            <textarea
              rows={2}
              placeholder="ملاحظات توضيحية حول طبيعة المصروفات المندرجة..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
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
              <CheckCircle2 className="w-4 h-4" /> {editingCC ? "حفظ التعديلات" : "إنشاء مركز التكلفة"}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* --- Delete Confirmation Modal --- */}
      <AdminModal
        isOpen={!!deleteModalCC}
        onClose={() => setDeleteModalCC(null)}
        title="تأكيد حذف مركز التكلفة"
        description={deleteModalCC ? `${deleteModalCC.name} (${deleteModalCC.code})` : ""}
        icon={AlertTriangle}
        tone="danger"
        maxWidth="md"
      >
        {deleteModalCC && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs font-bold text-rose-700 dark:text-rose-400 space-y-1">
              <p>هل أنت متأكد من حذف مركز التكلفة هذا؟</p>
              <p className="text-[11px] text-muted-foreground">
                المصروفات التاريخية المرتبطة بهذا المركز ستبقى محفوظة محاسبياً ولكن سيتم فك ارتباط المركز بها.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteModalCC(null)}
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
