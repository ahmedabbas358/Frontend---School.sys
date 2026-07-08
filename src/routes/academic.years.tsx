import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { 
  Plus, Pencil, Calendar, CheckCircle2, X
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/academic/years")({
  head: () => ({ meta: [{ title: "السنوات الدراسية | منصة مدارس" }] }),
  component: AcademicYearsSimple,
});

function AcademicYearsSimple() {
  const { 
    allAcademicYears,
    updateAcademicYear,
    addAcademicYear
  } = useGlobalStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "", startDate: "", endDate: "", isCurrent: false
  });

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", startDate: "", endDate: "", isCurrent: false });
    setIsModalOpen(true);
  };

  const openEditModal = (year: any) => {
    setEditingId(year.id);
    setFormData({ name: year.name, startDate: year.startDate, endDate: year.endDate, isCurrent: year.isCurrent });
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

  return (
    <AppShell>
      <div className="flex flex-col h-full animate-in fade-in">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              السنوات الدراسية
            </h1>
            <p className="text-muted-foreground">
              إدارة فترات وتواريخ الأعوام الدراسية للنظام. يتم بدء عام جديد بسجل فارغ كلياً.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
            >
              <Plus className="h-5 w-5" /> سنة دراسية جديدة
            </button>
          </div>
        </div>

        <PageCard className="border-border">
          <table className="w-full text-sm text-right">
            <thead className="bg-muted">
              <tr>
                <th className="p-4 font-bold rounded-tr-lg">اسم السنة الدراسية</th>
                <th className="p-4 font-bold">تاريخ البداية</th>
                <th className="p-4 font-bold">تاريخ النهاية</th>
                <th className="p-4 font-bold">الحالة</th>
                <th className="p-4 font-bold rounded-tl-lg text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {allAcademicYears.map(year => (
                <tr key={year.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                  <td className="p-4 font-bold">{year.name}</td>
                  <td className="p-4 font-bold text-muted-foreground" dir="ltr">{year.startDate}</td>
                  <td className="p-4 font-bold text-muted-foreground" dir="ltr">{year.endDate}</td>
                  <td className="p-4">
                    {year.isCurrent ? (
                      <Badge tone="success"><CheckCircle2 className="h-3 w-3 mr-1"/> نشط حالياً</Badge>
                    ) : (
                      <Badge tone="neutral">منتهي</Badge>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => openEditModal(year)}
                      className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PageCard>

        {/* Modal for Add / Edit */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95">
              <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-lg">{editingId ? "تعديل سنة دراسية" : "إضافة سنة دراسية جديدة"}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-4 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">اسم السنة الدراسية *</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="مثال: ١٤٤٥ / ١٤٤٦ هـ" 
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 outline-none focus:border-primary transition-colors" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">تاريخ البداية *</label>
                    <input 
                      type="date" 
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 outline-none focus:border-primary transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1">تاريخ النهاية *</label>
                    <input 
                      type="date" 
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 outline-none focus:border-primary transition-colors" 
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="isCurrent"
                    checked={formData.isCurrent}
                    onChange={(e) => setFormData({...formData, isCurrent: e.target.checked})}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="isCurrent" className="text-sm font-bold cursor-pointer">
                    تعيين كعام دراسي نشط (حالي)
                  </label>
                </div>
                <p className="text-xs text-warning mt-1">تنبيه: تفعيل هذا العام سيبدأ السجلات من جديد بشكل فارغ.</p>

                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-accent rounded-xl transition-colors">إلغاء</button>
                  <button type="submit" className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl transition-colors">حفظ السنة الدراسية</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
