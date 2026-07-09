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
  const [newSubject, setNewSubject] = useState({ name: "", code: "", grade: "", fee: 0 });

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
    if (newSubject.grade === "") {
      toast.error("يجب اختيار فصل دراسي للمادة");
      return;
    }
    
    try {
      addSubject({
        name: newSubject.name,
        code: newSubject.code,
        creditHours: 1,
        stage: stage,
        grades: [newSubject.grade],
        fee: newSubject.fee > 0 ? newSubject.fee : undefined
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ المادة");
      return;
    }
    
    toast.success("تمت إضافة المادة الدراسية بنجاح");
    setIsModalOpen(false);
    setNewSubject({ name: "", code: "", grade: "", fee: 0 });
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

        {availableGrades.filter(g => !filterGrade || filterGrade === g).map(grade => {
          const gradeSubjects = filteredSubjects.filter(s => s.grades?.includes(grade));
          
          if (gradeSubjects.length === 0 && filterGrade) return null;

          return (
            <PageCard key={grade}>
              <div className="flex items-center gap-3 mb-4 border-b border-border/10 pb-4">
                <div className="bg-primary/10 text-primary p-2 rounded-lg">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">مواد {grade}</h3>
                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs font-bold mr-auto">
                  {gradeSubjects.length} مادة
                </span>
              </div>
              
              {gradeSubjects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gradeSubjects.map(s => (
                    <div key={s.id} className="relative group bg-background border border-border/50 rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-bold text-primary bg-primary/5 border border-primary/10 px-2.5 py-1 rounded-md text-xs tracking-wider uppercase">
                          {s.code}
                        </span>
                        <button 
                          onClick={() => {
                            if(confirm("هل أنت متأكد من حذف هذه المادة؟")) {
                              deleteSubject(s.id);
                              toast.success("تم الحذف بنجاح");
                            }
                          }}
                          className="text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-danger/10 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <h4 className="text-base font-bold mb-1 text-foreground">{s.name}</h4>
                      
                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/40">
                        <span className="text-xs font-medium text-muted-foreground">الرسوم الدراسية</span>
                        {s.fee ? (
                          <span className="font-black text-danger text-sm tabular-nums">{s.fee} {currency}</span>
                        ) : (
                          <span className="text-success text-[10px] font-black bg-success/10 px-2 py-1 rounded tracking-wide">مجانًا</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/50">
                  <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">لا توجد مواد دراسية مخصصة لهذا الفصل بعد.</p>
                </div>
              )}
            </PageCard>
          );
        })}
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
                <label className="mb-2 block text-sm font-medium text-muted-foreground">تخصيص الفصل الدراسي (إلزامي) <span className="text-danger">*</span></label>
                <select
                  required
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                  value={newSubject.grade}
                  onChange={(e) => setNewSubject({ ...newSubject, grade: e.target.value })}
                >
                  <option value="" disabled>اختر الفصل الدراسي...</option>
                  {availableGrades.map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
                <span className="block text-xs text-muted-foreground mt-2">يتم ربط المادة بصف واحد فقط، إذا أردت نفس المادة لصف آخر قم بإضافتها مرة أخرى لذلك الصف.</span>
              </div>

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
