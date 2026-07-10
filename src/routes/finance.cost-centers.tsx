import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { AppShell, PageCard } from '@/components/app-shell';
import { FolderTree, Search, Plus, Edit, Briefcase, Eye, Target } from 'lucide-react';
import { toast } from 'sonner';
import { CostCenter } from '../core/finance/types';

export const Route = createFileRoute('/finance/cost-centers')({
  component: FinanceCostCenters,
});

const initialCostCenters: CostCenter[] = [
  { id: 'CC-001', code: 'ADM-01', name: 'الإدارة العامة', description: 'مركز تكلفة يخص مصروفات الإدارة' },
  { id: 'CC-002', code: 'EDU-01', name: 'القسم التعليمي', description: 'مصروفات الفصول والمعلمين' },
  { id: 'CC-003', code: 'BUS-01', name: 'قسم الحركة والمواصلات', description: 'مصروفات الحافلات المدرسية' },
];

function FinanceCostCenters() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>(initialCostCenters);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCC, setEditingCC] = useState<CostCenter | null>(null);

  // Form State
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });

  const filteredCCs = useMemo(() => {
    return costCenters.filter(cc => 
      cc.name.includes(searchTerm) || cc.code.includes(searchTerm)
    );
  }, [costCenters, searchTerm]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCC) {
      setCostCenters(prev => prev.map(c => c.id === editingCC.id ? { ...c, ...formData } : c));
      toast.success("تم تحديث مركز التكلفة بنجاح");
    } else {
      const newCC: CostCenter = {
        id: `CC-${Math.floor(1000 + Math.random() * 9000)}`,
        ...formData
      };
      setCostCenters(prev => [...prev, newCC]);
      toast.success("تمت إضافة مركز التكلفة بنجاح");
    }
    setIsAddOpen(false);
    setEditingCC(null);
  };

  const openEdit = (cc: CostCenter) => {
    setEditingCC(cc);
    setFormData({ name: cc.name, code: cc.code, description: cc.description || '' });
    setIsAddOpen(true);
  };

  const openAdd = () => {
    setEditingCC(null);
    setFormData({ name: '', code: '', description: '' });
    setIsAddOpen(true);
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance" },
        { label: "مراكز التكلفة" },
      ]}
    >
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-3xl border border-border shadow-sm">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2 text-primary">
              <Target className="w-7 h-7" /> مراكز التكلفة (Cost Centers)
            </h1>
            <p className="text-muted-foreground mt-1">إدارة وتوزيع المصروفات والإيرادات على الأقسام المختلفة</p>
          </div>
          <button 
            onClick={openAdd}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25"
          >
            <Plus className="w-5 h-5" /> إضافة مركز جديد
          </button>
        </div>

        <PageCard>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="ابحث باسم أو رمز المركز..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-12 h-12 bg-muted/30 border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-right">
              <thead className="bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="py-3 px-4 font-bold w-24">الرمز</th>
                  <th className="py-3 px-4 font-bold">اسم المركز</th>
                  <th className="py-3 px-4 font-bold">الوصف</th>
                  <th className="py-3 px-4 font-bold w-32 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredCCs.length === 0 ? (
                   <tr>
                     <td colSpan={4} className="py-8 text-center text-muted-foreground font-bold">لا توجد مراكز تكلفة مطابقة</td>
                   </tr>
                ) : (
                  filteredCCs.map(cc => (
                    <tr key={cc.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-muted-foreground">{cc.code}</td>
                      <td className="py-3 px-4 font-bold">{cc.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{cc.description || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => openEdit(cc)} 
                            className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg hover:bg-amber-500/20 transition-colors" 
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </PageCard>

        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />
            <div className="relative bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                <h3 className="font-black text-lg">{editingCC ? 'تعديل مركز تكلفة' : 'مركز تكلفة جديد'}</h3>
                <button type="button" onClick={() => setIsAddOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1.5">رمز المركز</label>
                  <input 
                    type="text" 
                    required
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    className="w-full h-11 bg-background border border-border rounded-xl px-4 font-mono outline-none"
                    placeholder="مثال: ADM-01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1.5">اسم المركز</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full h-11 bg-background border border-border rounded-xl px-4 font-bold outline-none"
                    placeholder="مثال: الإدارة العامة"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1.5">وصف المركز</label>
                  <input 
                    type="text" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full h-11 bg-background border border-border rounded-xl px-4 outline-none"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors">
                    حفظ المركز
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
