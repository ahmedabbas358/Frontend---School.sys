import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { Plus, Pencil, Trash2, X, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/academic/years")({
  head: () => ({ meta: [{ title: "السنوات الدراسية" }] }),
  component: AcademicYearsPage,
});

function AcademicYearsPage() {
  const { allAcademicYears, addAcademicYear, updateAcademicYear } = useGlobalStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    isCurrent: false
  });

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", startDate: "", endDate: "", isCurrent: false });
    setIsModalOpen(true);
  };

  const openEditModal = (year: any) => {
    setEditingId(year.id);
    setFormData({ 
      name: year.name, 
      startDate: year.startDate, 
      endDate: year.endDate, 
      isCurrent: year.isCurrent 
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("يرجى تعبئة جميع الحقول الإلزامية");
      return;
    }

    if (editingId) {
      updateAcademicYear(editingId, formData);
      toast.success("تم تعديل السنة الدراسية بنجاح");
    } else {
      addAcademicYear(formData);
      toast.success("تمت إضافة السنة الدراسية بنجاح");
    }
    
    setIsModalOpen(false);
  };

  const handleSetCurrent = (id: string) => {
    updateAcademicYear(id, { isCurrent: true });
    toast.success("تم تعيين السنة كسنة حالية مفعلة");
  };

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الإدارة الأكاديمية" }, { label: "السنوات الدراسية" }]}
      actions={
        <button 
          onClick={openAddModal}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:scale-105"
        >
          <Plus className="h-4 w-4" /> سنة جديدة
        </button>
      }
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm glass flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">إجمالي السنوات المسجلة</p>
              <p className="text-2xl font-bold">{allAcademicYears.length}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm glass flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">السنة الدراسية المفعلة حالياً</p>
              <p className="text-xl font-bold mt-1 text-primary">{allAcademicYears.find(y => y.isCurrent)?.name || "لا يوجد"}</p>
            </div>
            <Badge tone="success" className="h-8">نشط</Badge>
          </div>
        </div>

        <PageCard>
          <DataTable
            rows={allAcademicYears}
            columns={[
              { key: "n", header: "اسم السنة", cell: (r) => <span className="font-bold text-lg">{r.name}</span> },
              { key: "s", header: "تاريخ البداية", cell: (r) => <span className="tabular font-medium text-muted-foreground">{r.startDate}</span> },
              { key: "e", header: "تاريخ النهاية", cell: (r) => <span className="tabular font-medium text-muted-foreground">{r.endDate}</span> },
              { 
                key: "st", 
                header: "الحالة", 
                cell: (r) => (
                  <Badge tone={r.isCurrent ? "success" : "neutral"} className="px-3 py-1 font-bold">
                    {r.isCurrent ? "السنة الحالية" : "منتهية / غير مفعلة"}
                  </Badge>
                ) 
              },
              {
                key: "act",
                header: "إجراءات",
                cell: (r) => (
                  <div className="flex gap-2 justify-end">
                    {!r.isCurrent && (
                      <button 
                        onClick={() => handleSetCurrent(r.id)}
                        className="rounded-lg p-2 text-success hover:bg-success/10 transition-colors" 
                        title="تعيين كسنة حالية"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => openEditModal(r)}
                      className="rounded-lg p-2 text-primary hover:bg-primary/10 transition-colors" 
                      title="تعديل"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg p-2 text-danger hover:bg-danger/10 transition-colors" title="حذف">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </PageCard>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingId ? "تعديل السنة الدراسية" : "إضافة سنة دراسية جديدة"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-accent transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">اسم السنة (مثال: ١٤٤٥ هـ) *</label>
                <input
                  required
                  placeholder="مثال: ١٤٤٦ هـ"
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-muted-foreground">تاريخ البداية *</label>
                  <input
                    required
                    type="date"
                    className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold tabular-nums"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-muted-foreground">تاريخ النهاية *</label>
                  <input
                    required
                    type="date"
                    className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold tabular-nums"
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 border border-border/50 rounded-xl cursor-pointer hover:bg-accent/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.isCurrent}
                  onChange={(e) => setFormData({...formData, isCurrent: e.target.checked})}
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
                <span className="font-bold text-sm">تعيين هذه السنة كسنة دراسية حالية مفعلة</span>
              </label>

              <div className="pt-5 mt-2 border-t border-border/50 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-5 py-2.5 font-bold hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="rounded-xl bg-primary px-8 py-2.5 font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm hover:shadow-md hover:scale-105"
                >
                  {editingId ? "حفظ التعديلات" : "إضافة السنة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
