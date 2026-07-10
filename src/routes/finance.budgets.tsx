import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { AppShell, PageCard } from '@/components/app-shell';
import { FolderTree, Search, Plus, Edit, Target, PieChart, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/finance/budgets')({
  component: FinanceBudgets,
});

interface Budget {
  id: string;
  name: string;
  fiscalYear: string;
  totalAmount: number;
  spentAmount: number;
  status: 'active' | 'draft' | 'closed';
  department: string;
}

const initialBudgets: Budget[] = [
  { id: 'BGT-2024-01', name: 'الميزانية التشغيلية - النصف الأول', fiscalYear: '2024', totalAmount: 500000, spentAmount: 120000, status: 'active', department: 'الإدارة' },
  { id: 'BGT-2024-02', name: 'ميزانية الأنشطة الطلابية', fiscalYear: '2024', totalAmount: 50000, spentAmount: 48000, status: 'active', department: 'شؤون الطلاب' },
  { id: 'BGT-2024-03', name: 'ميزانية الصيانة والتطوير', fiscalYear: '2024', totalAmount: 100000, spentAmount: 95000, status: 'active', department: 'التشغيل والصيانة' },
];

function FinanceBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Form State
  const [formData, setFormData] = useState({ name: '', fiscalYear: '2024', totalAmount: 0, department: '' });

  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => 
      b.name.includes(searchTerm) || b.department.includes(searchTerm) || b.fiscalYear.includes(searchTerm)
    );
  }, [budgets, searchTerm]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBudget) {
      setBudgets(prev => prev.map(b => b.id === editingBudget.id ? { ...b, ...formData } : b));
      toast.success("تم تحديث الميزانية بنجاح");
    } else {
      const newBudget: Budget = {
        id: `BGT-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'draft',
        spentAmount: 0,
        ...formData
      };
      setBudgets(prev => [...prev, newBudget]);
      toast.success("تمت إضافة الميزانية بنجاح");
    }
    setIsAddOpen(false);
    setEditingBudget(null);
  };

  const openEdit = (b: Budget) => {
    setEditingBudget(b);
    setFormData({ name: b.name, fiscalYear: b.fiscalYear, totalAmount: b.totalAmount, department: b.department });
    setIsAddOpen(true);
  };

  const openAdd = () => {
    setEditingBudget(null);
    setFormData({ name: '', fiscalYear: '2024', totalAmount: 0, department: '' });
    setIsAddOpen(true);
  };

  const getStatusBadge = (status: string, spent: number, total: number) => {
    const percentage = (spent / total) * 100;
    
    if (status === 'closed') return <span className="bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs font-bold">مغلقة</span>;
    if (status === 'draft') return <span className="bg-amber-500/10 text-amber-600 px-2 py-1 rounded-md text-xs font-bold">مسودة</span>;
    
    if (percentage >= 90) return <span className="bg-danger/10 text-danger px-2 py-1 rounded-md text-xs font-bold">تجاوز الحد</span>;
    if (percentage >= 75) return <span className="bg-warning/10 text-warning px-2 py-1 rounded-md text-xs font-bold">تحذير</span>;
    
    return <span className="bg-success/10 text-success px-2 py-1 rounded-md text-xs font-bold">نشط</span>;
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance" },
        { label: "إدارة الميزانيات" },
      ]}
    >
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-3xl border border-border shadow-sm">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2 text-primary">
              <PieChart className="w-7 h-7" /> إدارة الميزانيات (Budgets)
            </h1>
            <p className="text-muted-foreground mt-1">تخطيط ومراقبة الميزانيات المالية للأقسام والمشاريع</p>
          </div>
          <button 
            onClick={openAdd}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25"
          >
            <Plus className="w-5 h-5" /> إنشاء ميزانية جديدة
          </button>
        </div>

        <PageCard>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="ابحث باسم الميزانية أو القسم..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-12 h-12 bg-muted/30 border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBudgets.length === 0 ? (
               <div className="col-span-full py-8 text-center text-muted-foreground font-bold border border-dashed rounded-xl">لا توجد ميزانيات مطابقة للبحث</div>
            ) : (
              filteredBudgets.map(b => {
                const percentage = Math.min((b.spentAmount / b.totalAmount) * 100, 100);
                const isOverBudget = percentage >= 100;
                
                return (
                  <div key={b.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-mono text-muted-foreground font-bold mb-1">{b.id} • {b.fiscalYear}</div>
                        <h3 className="font-black text-lg text-foreground">{b.name}</h3>
                        <div className="text-sm text-muted-foreground font-bold">{b.department}</div>
                      </div>
                      {getStatusBadge(b.status, b.spentAmount, b.totalAmount)}
                    </div>
                    
                    <div className="space-y-2 mt-auto">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-muted-foreground">المنصرف</span>
                        <span className="text-foreground">{b.spentAmount.toLocaleString()} / {b.totalAmount.toLocaleString()} ج.س</span>
                      </div>
                      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isOverBudget ? 'bg-danger' : percentage > 80 ? 'bg-warning' : 'bg-success'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-bold text-muted-foreground">
                        <span>{percentage.toFixed(1)}%</span>
                        <span>المتبقي: {(b.totalAmount - b.spentAmount).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <button 
                        onClick={() => openEdit(b)}
                        className="flex-1 bg-muted hover:bg-accent text-foreground font-bold py-2 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <Edit className="w-4 h-4" /> تعديل
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </PageCard>

        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />
            <div className="relative bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                <h3 className="font-black text-lg">{editingBudget ? 'تعديل الميزانية' : 'ميزانية جديدة'}</h3>
                <button type="button" onClick={() => setIsAddOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1.5">اسم الميزانية</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full h-11 bg-background border border-border rounded-xl px-4 font-bold outline-none"
                    placeholder="مثال: ميزانية الأنشطة الطلابية"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1.5">القسم المعني</label>
                  <input 
                    type="text" 
                    required
                    value={formData.department} 
                    onChange={e => setFormData({...formData, department: e.target.value})}
                    className="w-full h-11 bg-background border border-border rounded-xl px-4 font-bold outline-none"
                    placeholder="مثال: شؤون الطلاب"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1.5">السنة المالية</label>
                    <input 
                      type="text" 
                      required
                      value={formData.fiscalYear} 
                      onChange={e => setFormData({...formData, fiscalYear: e.target.value})}
                      className="w-full h-11 bg-background border border-border rounded-xl px-4 font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1.5">المبلغ الإجمالي</label>
                    <input 
                      type="number" 
                      required
                      min={0}
                      value={formData.totalAmount} 
                      onChange={e => setFormData({...formData, totalAmount: Number(e.target.value)})}
                      className="w-full h-11 bg-background border border-border rounded-xl px-4 font-bold outline-none"
                    />
                  </div>
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors">
                    حفظ الميزانية
                  </button>
                  <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 bg-muted text-foreground font-bold py-3 rounded-xl hover:bg-accent transition-colors">
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
