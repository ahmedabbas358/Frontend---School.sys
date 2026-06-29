import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage, isItemAllowedForGrade } from "@/lib/school-structure";
import { Plus, Trash2, X, BookOpen, Hash, Search, Filter, Layers } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/academic/subjects")({
  component: AcademicSubjectsPage,
});

function AcademicSubjectsPage() {
  const { currency, activeStageSubjects, activeStageSections, addSubject, deleteSubject  } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [newSubject, setNewSubject] = useState({ name: "", code: "", applyToAll: false, grades: [] as string[], fee: 0 });

  const availableGrades = useMemo(() => getGradesForStage(stage), [stage]);
  const filteredSubjects = useMemo(() => {
    return activeStageSubjects.filter((subject) => {
      if (filterGrade && !isItemAllowedForGrade(subject, stage, filterGrade)) return false;
      if (search) {
        const q = search.trim().toLowerCase();
        return subject.name.toLowerCase().includes(q) || subject.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activeStageSubjects, filterGrade, search, stage]);

  const sectionsCount = filterGrade
    ? activeStageSections.filter(section => section.grade === filterGrade).length
    : activeStageSections.length;

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name || !newSubject.code) {
      toast.error("الرجاء تعبئة جميع الحقول الإلزامية");
      return;
    }
    
    try {
      addSubject({
        name: newSubject.name,
        code: newSubject.code,
        creditHours: 1,
        stage: newSubject.applyToAll ? "all" : stage,
        grades: newSubject.applyToAll ? undefined : newSubject.grades,
        fee: newSubject.fee > 0 ? newSubject.fee : undefined
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ المادة");
      return;
    }
    
    toast.success("تمت إضافة المادة الدراسية بنجاح");
    setIsModalOpen(false);
    setNewSubject({ name: "", code: "", applyToAll: false, grades: [], fee: 0 });
  };

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الإدارة الأكاديمية" }, { label: "المواد الدراسية" }]}
      actions={
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:scale-105"
        >
          <Plus className="h-4 w-4" /> مادة جديدة
        </button>
      }
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm glass">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">المواد المطابقة</p>
                <p className="text-2xl font-bold">{filteredSubjects.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm glass">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-warning/10 p-3 text-warning">
                <Hash className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">المرحلة النشطة</p>
                <p className="text-xl font-bold mt-1">{getStageLabel(stage)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm glass">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-success/10 p-3 text-success">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">الشعب المرتبطة</p>
                <p className="text-2xl font-bold">{sectionsCount}</p>
              </div>
            </div>
          </div>
        </div>

        <PageCard title="فرز المواد" description="المواد هنا متزامنة مع فصول المرحلة، وأي تخصيص يظهر فوراً في الاختبارات والإسناد التدريسي.">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="بحث باسم المادة أو الرمز..."
                className="h-11 w-full rounded-xl border border-border/50 bg-background pr-10 pl-4 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={filterGrade}
                onChange={event => setFilterGrade(event.target.value)}
                className="h-11 w-full rounded-xl border border-border/50 bg-background pr-10 pl-4 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
              >
                <option value="">كل الفصول</option>
                {availableGrades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
              </select>
            </div>
          </div>
        </PageCard>

        <PageCard>
          <DataTable
            rows={filteredSubjects}
            empty={filterGrade ? "لا توجد مواد مخصصة لهذا الفصل." : "لا توجد مواد دراسية مسجلة في هذه المرحلة بعد."}
            columns={[
              { 
                key: "c", header: "رمز المادة", 
                cell: (s) => (
                  <span className="tabular font-bold text-primary bg-primary/10 px-2 py-1 rounded-md text-xs">
                    {s.code}
                  </span>
                ) 
              },
              { 
                key: "n", header: "اسم المادة", 
                cell: (s) => (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base">{s.name}</span>
                      {s.stage === "all" && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">مشترك لكل المراحل</span>}
                      {s.stage !== "all" && (!s.grades || s.grades.length === 0) && <span className="text-[10px] bg-success/10 px-2 py-0.5 rounded-full text-success">كل فصول المرحلة</span>}
                    </div>
                    {s.grades && s.grades.length > 0 && s.stage !== "all" && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {s.grades.map(g => (
                          <span key={g} className="text-[10px] bg-primary/5 text-primary px-1.5 py-0.5 rounded border border-primary/10">{g}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ) 
              },

              { 
                key: "f", header: "رسوم المادة", 
                cell: (s) => s.fee ? <span className="tabular font-bold text-danger">{s.fee} {currency}</span> : <span className="text-muted-foreground text-xs">مجانًا</span>
              },
              {
                key: "act", header: "",
                cell: (s) => (
                  <div className="flex gap-1 justify-end">
                    <button 
                      onClick={() => {
                        if(confirm("هل أنت متأكد من حذف هذه المادة؟")) {
                          deleteSubject(s.id);
                          toast.success("تم الحذف بنجاح");
                        }
                      }}
                      className="rounded-lg p-2 text-danger hover:bg-danger/10 transition-colors" title="حذف"
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

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">إضافة مادة دراسية جديدة</h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-accent transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">اسم المادة *</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: علم الأحياء"
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  value={newSubject.name}
                  onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">رمز المادة *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: BIO101"
                    className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    value={newSubject.code}
                    onChange={e => setNewSubject({...newSubject, code: e.target.value})}
                  />
                </div>

              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">الرسوم الإضافية للمادة (اختياري)</label>
                <input 
                  type="number" 
                  min="0"
                  placeholder="مثال: رسوم معمل أو نشاط"
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  value={newSubject.fee || ""}
                  onChange={e => setNewSubject({...newSubject, fee: Number(e.target.value)})}
                />
                <span className="block text-xs text-muted-foreground mt-1">تترك فارغة إذا كانت المادة مجانية وتندرج ضمن الرسوم الدراسية الأساسية.</span>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 rounded-xl border border-border/50 p-4 cursor-pointer hover:bg-accent/30 transition-colors">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    checked={newSubject.applyToAll}
                    onChange={e => setNewSubject({...newSubject, applyToAll: e.target.checked, grades: []})}
                  />
                  <div>
                    <span className="block text-sm font-bold">تطبيق على جميع المراحل</span>
                    <span className="block text-xs text-muted-foreground">حدد هذا الخيار إذا كانت المادة (مثل القرآن الكريم) تدرس في جميع المراحل.</span>
                  </div>
                </label>
              </div>

              {!newSubject.applyToAll && availableGrades.length > 0 && (
                <div className="pt-2">
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">تخصيص للفصول (اختياري)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableGrades.map((grade) => (
                      <label key={grade} className="flex items-center gap-2 rounded-lg border border-border/50 p-2 cursor-pointer hover:bg-accent/20 transition-colors">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          checked={newSubject.grades.includes(grade)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewSubject({ ...newSubject, grades: [...newSubject.grades, grade] });
                            } else {
                              setNewSubject({ ...newSubject, grades: newSubject.grades.filter(g => g !== grade) });
                            }
                          }}
                        />
                        <span className="text-sm font-medium">{grade}</span>
                      </label>
                    ))}
                  </div>
                  <span className="block text-xs text-muted-foreground mt-1">إذا لم يتم تحديد أي فصل، ستكون المادة متاحة لجميع فصول هذه المرحلة.</span>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 font-medium hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="rounded-xl bg-primary px-6 py-2 font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  حفظ المادة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
