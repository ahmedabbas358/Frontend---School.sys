import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { Plus, Pencil, Trash2, Settings, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStage } from "@/contexts/StageContext";

export const Route = createFileRoute("/exams/types")({
  head: () => ({ meta: [{ title: "أنواع الاختبارات" }] }),
  component: ExamTypesPage,
});

function ExamTypesPage() {
  const { activeStageExamTypes, addExamType, updateExamType, deleteExamType, examGradingMode, setExamGradingMode, activeStageSubjects } = useGlobalStore();
  const { stage, getStageLabel } = useStage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", weight: 10, subjectId: "" });

  const handleOpenModal = (type?: { id: string, name: string, weight: number, subjectId?: string }) => {
    if (type) {
      setEditingId(type.id);
      setFormData({ name: type.name, weight: type.weight, subjectId: type.subjectId || "" });
    } else {
      setEditingId(null);
      setFormData({ name: "", weight: 10, subjectId: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("الرجاء إدخال اسم نوع الاختبار");
    if (formData.weight <= 0) return toast.error("يجب أن يكون الوزن أكبر من صفر");

    if (editingId) {
      updateExamType(editingId, formData);
      toast.success("تم تحديث نوع الاختبار بنجاح");
    } else {
      addExamType({ ...formData, stage });
      toast.success("تمت إضافة نوع الاختبار بنجاح");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا النوع؟ قد يؤثر ذلك على الاختبارات المرتبطة به.")) {
      deleteExamType(id);
      toast.success("تم الحذف بنجاح");
    }
  };

  return (
    <AppShell 
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الاختبارات", to: "/exams" }, { label: "الأنواع والإعدادات" }]}
      actions={
        <button 
          onClick={() => handleOpenModal()}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:scale-105"
        >
          <Plus className="h-4 w-4" /> إضافة نوع جديد
        </button>
      }
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Settings Card */}
        <PageCard title="إعدادات نظام التقييم" description={`التحكم في طريقة احتساب التقييم لمرحلة ${getStageLabel(stage)}`}>
          <div className="flex items-center gap-6 p-4 rounded-2xl border border-border/50 bg-card shadow-sm">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary">
              <Settings className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">نظام تقييم الاختبارات</h3>
              <p className="text-sm text-muted-foreground mt-1">اختر ما إذا كنت تريد تقييم الاختبارات بناءً على درجات مخصصة (مثال: من 20) أو كنسبة مئوية من 100%.</p>
            </div>
            <div className="flex bg-muted p-1 rounded-xl">
              <button
                onClick={() => { setExamGradingMode("marks"); toast.success("تم التبديل إلى نظام الدرجات"); }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${examGradingMode === "marks" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                درجات مخصصة
              </button>
              <button
                onClick={() => { setExamGradingMode("percentage"); toast.success("تم التبديل إلى نظام النسبة المئوية"); }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${examGradingMode === "percentage" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                نسبة مئوية (%)
              </button>
            </div>
          </div>
        </PageCard>

        {/* Types Table */}
        <PageCard title={`أنواع الاختبارات (${getStageLabel(stage)})`} description="إدارة المسميات والأوزان الخاصة باختبارات هذه المرحلة">
          <DataTable 
            rows={activeStageExamTypes}
            columns={[
              { key: "n", header: "اسم النوع", cell: (t) => <span className="font-bold text-lg text-primary">{t.name}</span> },
              { 
                key: "w", 
                header: "الوزن النسبي", 
                cell: (t) => (
                  <span className="tabular-nums font-bold px-3 py-1 rounded-lg bg-accent border border-border">
                    {t.weight} %
                  </span>
                ) 
              },
              {
                key: "subj",
                header: "الارتباط بمادة",
                cell: (t) => t.subjectId ? (
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">
                    مخصص: {activeStageSubjects.find(s => s.id === t.subjectId)?.name || 'غير معروف'}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">عام (كل المواد)</span>
                )
              },
              { 
                key: "act", 
                header: "إجراءات", 
                cell: (t) => (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenModal(t)}
                      className="rounded-lg p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="تعديل"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(t.id)}
                      className="rounded-lg p-2 text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              },
            ]}
            empty="لا توجد أنواع اختبارات مضافة حالياً."
          />
        </PageCard>

      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50">
              <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
                {editingId ? "تعديل نوع الاختبار" : "إضافة نوع اختبار جديد"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-accent transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-muted-foreground">اسم النوع <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: اختبار قصير، فصلي..."
                  className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-muted-foreground">الوزن النسبي (%) <span className="text-danger">*</span></label>
                <input 
                  type="number" 
                  min="1" max="100"
                  required
                  className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-left"
                  dir="ltr"
                  value={formData.weight}
                  onChange={e => setFormData({...formData, weight: Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-muted-foreground">تخصيص لمادة معينة (اختياري)</label>
                <select 
                  className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                  value={formData.subjectId}
                  onChange={e => setFormData({...formData, subjectId: e.target.value})}
                >
                  <option value="">عام (يظهر لجميع المواد)</option>
                  {activeStageSubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">إذا اخترت مادة، فلن يظهر هذا النوع إلا عند جدولة اختبار لهذه المادة المحددة.</p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-5 py-2.5 font-bold hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm hover:scale-105"
                >
                  <Save className="h-4 w-4" /> حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
