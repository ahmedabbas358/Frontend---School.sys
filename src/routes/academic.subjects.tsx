import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge, formatCurrency } from "@/components/app-shell";
import { useGlobalStore, Subject } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage } from "@/lib/school-structure";
import { 
  Plus, 
  Trash2, 
  X, 
  BookOpen, 
  Hash, 
  Search, 
  Filter, 
  Layers, 
  GraduationCap, 
  Clock, 
  DollarSign, 
  Sparkles,
  Users,
  Pencil,
  Check,
  Building2,
  FileText
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/academic/subjects")({
  head: () => ({
    meta: [
      { title: "المواد والمقررات الدراسية | منصة مدارس" },
      { name: "description", content: "إدارة الخطة الدراسية والمناهج وتوزيع الساعات التدريسية والمواد." },
    ],
  }),
  component: AcademicSubjectsPage,
});

function AcademicSubjectsPage() {
  const { 
    currency, 
    activeStageSubjects, 
    activeStageSections, 
    allTeachingAssignments,
    allStaff,
    addSubject, 
    deleteSubject  
  } = useGlobalStore();

  const { stage, getStageLabel } = useStage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [newSubject, setNewSubject] = useState<{
    name: string;
    code: string;
    grade: string;
    creditHours: number;
    fee: number;
  }>({ 
    name: "", 
    code: "", 
    grade: "", 
    creditHours: 4, 
    fee: 0 
  });

  const availableGrades = useMemo(() => {
    try {
      return getGradesForStage(stage) || [];
    } catch {
      return [];
    }
  }, [stage]);

  // Filter subjects safely
  const filteredSubjects = useMemo(() => {
    if (!activeStageSubjects) return [];
    return activeStageSubjects.filter((subject) => {
      if (!subject) return false;
      
      // Filter by Grade
      if (filterGrade !== "all") {
        const matchesGrade = 
          !subject.grades || 
          subject.grades.length === 0 || 
          subject.grades.includes(filterGrade) ||
          subject.grades.some(g => g.includes(filterGrade) || filterGrade.includes(g));
        if (!matchesGrade) return false;
      }

      // Filter by Search Query
      if (search) {
        const q = search.trim().toLowerCase();
        const nameMatch = subject.name?.toLowerCase().includes(q) || false;
        const codeMatch = subject.code?.toLowerCase().includes(q) || false;
        if (!nameMatch && !codeMatch) return false;
      }

      return true;
    });
  }, [activeStageSubjects, filterGrade, search]);

  // Compute stats
  const totalCreditHours = useMemo(() => {
    return filteredSubjects.reduce((acc, curr) => acc + (curr.creditHours || 0), 0);
  }, [filteredSubjects]);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name.trim() || !newSubject.code.trim()) {
      toast.error("الرجاء تعبئة اسم المادة ورمزها");
      return;
    }
    if (!newSubject.grade) {
      toast.error("يرجى اختيار الصف الدراسي المستهدف");
      return;
    }
    
    try {
      addSubject({
        name: newSubject.name.trim(),
        code: newSubject.code.trim().toUpperCase(),
        creditHours: Number(newSubject.creditHours) || 4,
        stage: stage,
        grades: [newSubject.grade],
        fee: newSubject.fee > 0 ? Number(newSubject.fee) : undefined
      });
      toast.success(`تمت إضافة مادة "${newSubject.name}" بنجاح`);
      setIsModalOpen(false);
      setNewSubject({ name: "", code: "", grade: "", creditHours: 4, fee: 0 });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ المادة");
    }
  };

  return (
    <AppShell
      title={`المواد والمقررات الدراسية — ${getStageLabel(stage)}`}
      breadcrumb={[
        { label: "الرئيسية", to: "/" }, 
        { label: "الإدارة الأكاديمية", to: "/academic/subjects" }, 
        { label: "المواد الدراسية" }
      ]}
      actions={
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-black rounded-xl hover:bg-primary/90 transition-all shadow-md glow-primary hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" /> 
          <span>إضافة مادة جديدة</span>
        </button>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-300">
        
        {/* =========================================================
            Summary Stats Cards
            ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-3xl border border-border/70 glass-card p-4 shadow-sm flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/10 text-blue-500 shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground">إجمالي المواد النشطة</p>
              <p className="text-2xl font-black text-foreground mt-0.5">{filteredSubjects.length}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 glass-card p-4 shadow-sm flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground">إجمالي الحصص الأسبوعية</p>
              <p className="text-2xl font-black text-foreground mt-0.5">{totalCreditHours} حصة</p>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 glass-card p-4 shadow-sm flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground">الشُعب الدراسية المرتبطة</p>
              <p className="text-2xl font-black text-foreground mt-0.5">{activeStageSections.length} شعبة</p>
            </div>
          </div>
        </div>

        {/* =========================================================
            Grade Filtering Navigation Pills
            ========================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <button
            onClick={() => setFilterGrade("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all shadow-xs ${
              filterGrade === "all"
                ? "bg-primary text-primary-foreground shadow-md glow-primary scale-[1.02]"
                : "bg-card hover:bg-accent border border-border/70 text-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>جميع المواد</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
              filterGrade === "all" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
            }`}>
              {activeStageSubjects.length}
            </span>
          </button>

          {availableGrades.map((grade) => {
            const count = activeStageSubjects.filter(s => 
              !s.grades || s.grades.length === 0 || s.grades.includes(grade) || s.grades.some(g => g.includes(grade) || grade.includes(g))
            ).length;
            const isSelected = filterGrade === grade;
            return (
              <button
                key={grade}
                onClick={() => setFilterGrade(grade)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all shadow-xs ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-md glow-primary scale-[1.02]"
                    : "bg-card hover:bg-accent border border-border/70 text-foreground"
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>{grade}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                  isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* =========================================================
            Search Bar
            ========================================================= */}
        <div className="relative">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم المقرر الدراسي أو الرمز (مثل MATH101)..."
            className="w-full h-11 rounded-2xl border border-input/80 bg-card/90 ps-10 pe-10 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 shadow-xs transition-all placeholder:text-muted-foreground/70"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute end-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* =========================================================
            Subject Cards Breakdown
            ========================================================= */}
        <div className="space-y-6">
          {availableGrades
            .filter(g => filterGrade === "all" || filterGrade === g)
            .map((grade) => {
              const gradeSubjects = filteredSubjects.filter(s => 
                !s.grades || s.grades.length === 0 || s.grades.includes(grade) || s.grades.some(g => g.includes(grade) || grade.includes(g))
              );

              if (gradeSubjects.length === 0 && filterGrade !== "all") {
                return (
                  <PageCard key={grade} className="p-8 text-center border-dashed">
                    <BookOpen className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                    <h3 className="font-extrabold text-sm text-foreground">لا توجد مواد مسجلة لهذا الصف</h3>
                    <p className="text-xs text-muted-foreground mt-1">يمكنك إضافة مقرر دراسي جديد عبر زر "إضافة مادة جديدة"</p>
                  </PageCard>
                );
              }

              if (gradeSubjects.length === 0) return null;

              return (
                <div key={grade} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <h3 className="font-black text-sm text-foreground">{grade}</h3>
                    </div>
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {gradeSubjects.length} مقررات
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gradeSubjects.map((s) => {
                      // Find assigned teachers for this subject
                      const assignments = allTeachingAssignments.filter(ta => ta.subjectId === s.id);
                      const teacherNames = Array.from(new Set(assignments.map(ta => {
                        const staff = allStaff.find(st => st.id === ta.teacherId);
                        return staff?.name;
                      }).filter(Boolean)));

                      return (
                        <div 
                          key={`${grade}-${s.id}`} 
                          className="p-4 rounded-3xl border border-border/70 glass-card hover:border-primary/50 shadow-sm transition-all hover-lift flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Top */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary font-black text-xs tracking-wider" dir="ltr">
                                {s.code}
                              </span>
                              <button 
                                onClick={() => {
                                  if (confirm(`هل أنت متأكد من حذف مادة "${s.name}"؟`)) {
                                    deleteSubject(s.id);
                                    toast.success("تم حذف المادة بنجاح");
                                  }
                                }}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                                title="حذف المادة"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Subject Title */}
                            <h4 className="font-extrabold text-sm text-foreground mb-1.5 leading-snug">
                              {s.name}
                            </h4>

                            {/* Weekly load & Teacher assignment */}
                            <div className="space-y-1.5 text-xs text-muted-foreground my-3 p-2.5 rounded-2xl bg-muted/30 border border-border/40">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-primary" />
                                  <span>الحصص الأسبوعية:</span>
                                </span>
                                <span className="font-extrabold text-foreground">{s.creditHours || 4} حصص</span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-blue-500" />
                                  <span>المعلمون المسندون:</span>
                                </span>
                                <span className="font-bold text-foreground truncate max-w-[120px]">
                                  {teacherNames.length > 0 ? teacherNames.join("، ") : "غير مسند"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Fee Status Footer */}
                          <div className="pt-2.5 border-t border-border/40 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground text-[11px] font-bold">الرسوم الإضافية:</span>
                            {s.fee && s.fee > 0 ? (
                              <span className="font-black text-danger">{formatCurrency(s.fee, currency)}</span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10">
                                مجانية (ضمن المصروفات)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>

      </div>

      {/* =========================================================
          Add Subject Modal
          ========================================================= */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-md bg-card/98 dark:bg-card/95 border border-border/80 shadow-2xl backdrop-blur-2xl rounded-3xl p-6 sm:p-7 overflow-hidden animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-foreground">إضافة مقرر دراسي جديد</h3>
                  <p className="text-xs text-muted-foreground">تحديد مادة دراسية وتوزيع ساعاتها وصفها المستهدف</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/85 mb-1.5">اسم المادة الدراسية <span className="text-destructive">*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: الرياضيات المتقدمة"
                  className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60"
                  value={newSubject.name}
                  onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground/85 mb-1.5">رمز المادة <span className="text-destructive">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="MATH102"
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 uppercase tracking-wider transition-all placeholder:text-muted-foreground/60"
                    dir="ltr"
                    value={newSubject.code}
                    onChange={e => setNewSubject({...newSubject, code: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground/85 mb-1.5">الحصص الأسبوعية</label>
                  <input 
                    type="number" 
                    min="1"
                    max="20"
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                    value={newSubject.creditHours}
                    onChange={e => setNewSubject({...newSubject, creditHours: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/85 mb-1.5">الصف الدراسي المستهدف <span className="text-destructive">*</span></label>
                <select
                  required
                  className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 cursor-pointer transition-all"
                  value={newSubject.grade}
                  onChange={(e) => setNewSubject({ ...newSubject, grade: e.target.value })}
                >
                  <option value="">-- اختر الصف الدراسي --</option>
                  {availableGrades.map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/85 mb-1.5">الرسوم الإضافية (اختياري)</label>
                <input 
                  type="number" 
                  min="0"
                  placeholder="0 (مجانية تلقائياً)"
                  className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60"
                  value={newSubject.fee || ""}
                  onChange={e => setNewSubject({...newSubject, fee: Number(e.target.value)})}
                />
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-input bg-background/80 text-xs font-semibold hover:bg-accent active:scale-[0.98] transition-all"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all glow-primary"
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
