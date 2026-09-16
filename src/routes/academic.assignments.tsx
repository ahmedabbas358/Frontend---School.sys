import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage, isItemAllowedForGrade, isGradeMatch } from "@/lib/school-structure";
import { SearchableSelect } from "@/components/searchable-select";
import { LuxurySelect } from "@/components/ui/luxury-select";
import { TeacherPicker } from "@/components/teacher-picker";
import { Plus, Trash2, Users, Printer, Search, Filter, BookOpen, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/academic/assignments")({
  head: () => ({ meta: [{ title: "الإسناد التدريسي" }] }),
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const { stage, getStageLabel } = useStage();
  const { 
    activeStageStaff, 
    activeStageSubjects, 
    activeStageSections, 
    activeStageTeachingAssignments, 
    addTeachingAssignment, 
    deleteTeachingAssignment,
    allAcademicYears
  } = useGlobalStore();

  const [form, setForm] = useState({ teacherId: "", grade: "", subjectId: "", sectionId: "" });
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const currentYear = allAcademicYears.find(y => y.isCurrent) || allAcademicYears[0];

  const teachersList = useMemo(() => activeStageStaff
    .filter(s => s.role.includes("معلم") || s.role.includes("مربي"))
    .map(t => ({ id: t.id, title: t.name, subtitle: t.role, icon: Users })), [activeStageStaff]);

  const grades = useMemo(() => getGradesForStage(stage), [stage]);

  const formSections = useMemo(() => (
    form.grade ? activeStageSections.filter(section => isGradeMatch(section.grade, form.grade)) : []
  ), [activeStageSections, form.grade]);

  const subjectsList = useMemo(() => activeStageSubjects
    .filter(subject => form.grade && isItemAllowedForGrade(subject, stage, form.grade))
    .map(s => ({ id: s.id, title: s.name, subtitle: s.code, icon: BookOpen })), [activeStageSubjects, form.grade, stage]);

  const sectionsList = useMemo(() => formSections
    .map(s => ({ id: s.id, title: `شعبة ${s.name}`, subtitle: s.roomName || s.grade, badge: `سعة: ${s.capacity || 30}`, icon: Filter })), [formSections]);

  const filterSections = useMemo(() => (
    filterGrade ? activeStageSections.filter(section => isGradeMatch(section.grade, filterGrade)) : activeStageSections
  ), [activeStageSections, filterGrade]);

  const filteredAssignments = useMemo(() => {
    return activeStageTeachingAssignments.filter(assignment => {
      const sec = activeStageSections.find(s => s.id === assignment.sectionId);
      const teacher = activeStageStaff.find(s => s.id === assignment.teacherId);
      const subject = activeStageSubjects.find(s => s.id === assignment.subjectId);
      if (!sec) return false;
      if (filterGrade && sec.grade !== filterGrade) return false;
      if (filterSection && sec.id !== filterSection) return false;
      if (search) {
        const q = search.trim();
        if (!teacher?.name.includes(q) && !subject?.name.includes(q) && !sec.name.includes(q)) return false;
      }
      return true;
    });
  }, [activeStageSections, activeStageStaff, activeStageSubjects, activeStageTeachingAssignments, filterGrade, filterSection, search]);

  const add = () => {
    if (!form.teacherId || !form.subjectId || !form.sectionId) {
      toast.error("يرجى تعبئة جميع الحقول بشكل صحيح");
      return;
    }
    
    // Check for duplicates
    const exists = activeStageTeachingAssignments.find(a => 
      a.sectionId === form.sectionId && a.subjectId === form.subjectId && a.teacherId === form.teacherId
    );
    if (exists) {
      toast.error("هذا الإسناد موجود مسبقاً");
      return;
    }

    try {
      addTeachingAssignment({
        teacherId: form.teacherId,
        subjectId: form.subjectId,
        sectionId: form.sectionId,
        yearId: currentYear?.id || "Y-1002",
        stage
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إضافة الإسناد");
      return;
    }
    setForm({ teacherId: "", grade: "", subjectId: "", sectionId: "" });
    toast.success("تم إضافة الإسناد بنجاح");
  };

  const printData = useMemo(() => {
    return filteredAssignments.map(r => {
      const sec = activeStageSections.find((s) => s.id === r.sectionId);
      const t = activeStageStaff.find((s) => s.id === r.teacherId);
      const sub = activeStageSubjects.find((s) => s.id === r.subjectId);
      const y = allAcademicYears.find((y) => y.id === r.yearId);
      return {
        id: r.id,
        teacher: t?.name || "معلم محذوف",
        subject: sub?.name || "مادة محذوفة",
        section: sec ? `${sec.grade} - شعبة ${sec.name}` : "شعبة محذوفة",
        year: y?.name || "غير محدد"
      };
    });
  }, [filteredAssignments, activeStageSections, activeStageStaff, activeStageSubjects, allAcademicYears]);

  const printTemplates: PrintTemplate[] = [
    {
      id: "assignments-list",
      name: "كشف الإسناد التدريسي",
      category: "الإدارة الأكاديمية",
      type: "table",
      columns: [
        { label: "المعلم", key: "teacher" },
        { label: "المادة الدراسية", key: "subject" },
        { label: "الفصل / الشعبة", key: "section" },
        { label: "السنة الأكاديمية", key: "year" },
      ],
      description: "طباعة كشف مجمع بجميع الإسنادات التدريسية الحالية"
    }
  ];

  return (
    <AppShell 
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الإدارة الأكاديمية" }, { label: "الإسناد التدريسي" }]}
      actions={
        <button
          onClick={() => setIsPrintOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary/10 px-4 text-sm font-bold text-primary hover:bg-primary/20 transition-all border border-primary/20"
        >
          <Printer className="h-4 w-4" /> طباعة مصفوفة الإسناد
        </button>
      }
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm glass flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">إجمالي الإسنادات الحالية</p>
            <p className="text-2xl font-bold">{filteredAssignments.length}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm glass flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">السنة الدراسية المفعلة</p>
              <p className="text-xl font-bold mt-1">{currentYear?.name || "1446 هـ"}</p>
            </div>
            <Badge tone="success" className="h-8">مفعل</Badge>
          </div>
        </div>

        <PageCard title="بناء إسناد جديد" description="اختر المعلم، ثم حدد الفصل ليفتح آلياً الشعب والمواد المطابقة فقط، ثم نفّذ الإسناد مباشرة.">
          <div className="grid gap-4 md:grid-cols-5 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-foreground mb-1.5 px-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>المعلم المكلف</span>
              </label>
              <TeacherPicker
                teachers={activeStageStaff}
                selectedTeacherId={form.teacherId}
                onSelect={(id) => setForm({ ...form, teacherId: id })}
                subjectName={activeStageSubjects.find(s => s.id === form.subjectId)?.name}
                sectionName={activeStageSections.find(s => s.id === form.sectionId)?.name}
                placeholder="انقر لاختيار وإسناد المعلم..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 px-1 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-primary" />
                <span>الفصل الدراسي</span>
              </label>
              <LuxurySelect
                value={form.grade}
                onChange={(val) => setForm({ ...form, grade: val, sectionId: "", subjectId: "" })}
                options={grades.map(g => ({ value: g, label: g, icon: GraduationCap }))}
                placeholder="-- اختر الفصل --"
                icon={GraduationCap}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 px-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-primary" />
                  <span>الشعبة</span>
                </span>
                {form.grade && sectionsList.length > 0 ? (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 shadow-xs animate-in fade-in">
                    ✨ {sectionsList.length} شعب متاحة
                  </span>
                ) : form.grade ? (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    لا توجد شعب
                  </span>
                ) : null}
              </label>
              <SearchableSelect 
                value={form.sectionId} 
                onChange={(v) => setForm({...form, sectionId: v})} 
                options={sectionsList} 
                disabled={!form.grade}
                disabledHint="⏳ بانتظار تحديد الفصل أولاً"
                onDisabledClick={() => toast.info("يرجى اختيار الفصل الدراسي أولاً ليتم تصفية الشعب المتاحة تلقائياً")}
                placeholder={form.grade ? (sectionsList.length > 0 ? "-- اختر الشعبة --" : "لا توجد شعب مضافة") : "اختر الفصل أولاً"}
                emptyMessage="لا توجد شعب مسجلة لهذا الفصل"
                icon={Filter}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 px-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  <span>المادة الدراسية</span>
                </span>
                {form.grade && subjectsList.length > 0 ? (
                  <span className="text-[10px] text-primary font-extrabold bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20 shadow-xs animate-in fade-in">
                    📚 {subjectsList.length} مادة دراسية
                  </span>
                ) : form.grade ? (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    لا توجد مواد
                  </span>
                ) : null}
              </label>
              <SearchableSelect 
                value={form.subjectId} 
                onChange={(v) => setForm({...form, subjectId: v})} 
                options={subjectsList} 
                disabled={!form.grade}
                disabledHint="⏳ بانتظار تحديد الفصل أولاً"
                onDisabledClick={() => toast.info("يرجى اختيار الفصل الدراسي أولاً ليتم تصفية المواد المطابقة تلقائياً")}
                placeholder={form.grade ? (subjectsList.length > 0 ? "-- اختر المادة --" : "لا توجد مواد") : "اختر الفصل أولاً"}
                emptyMessage="لا توجد مواد مرتبطة بهذا الفصل"
                icon={BookOpen}
              />
            </div>

            <button 
              onClick={add} 
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-xs sm:text-sm font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md glow-primary hover:scale-[1.02] active:scale-95"
            >
              <Plus className="h-5 w-5" />
              <span>تنفيذ الإسناد</span>
            </button>
          </div>
        </PageCard>

        <PageCard title="فرز الإسنادات">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="بحث بالمعلم أو المادة أو الشعبة..."
                className="h-12 w-full rounded-2xl border border-border/80 bg-background pr-10 pl-4 text-xs sm:text-sm font-bold shadow-xs focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div>
              <LuxurySelect
                value={filterGrade}
                onChange={(val) => { setFilterGrade(val); setFilterSection(""); }}
                options={[
                  { value: "", label: "كل الفصول" },
                  ...grades.map(g => ({ value: g, label: g }))
                ]}
                placeholder="كل الفصول"
                icon={GraduationCap}
              />
            </div>
            <div>
              <LuxurySelect
                value={filterSection}
                onChange={(val) => setFilterSection(val)}
                disabled={!filterGrade}
                disabledHint="حدد فصلاً أولاً"
                options={[
                  { value: "", label: "كل الشعب" },
                  ...filterSections.map(s => ({ value: s.id, label: `شعبة ${s.name}` }))
                ]}
                placeholder="كل الشعب"
                icon={Filter}
              />
            </div>
          </div>
        </PageCard>

        <PageCard title="مصفوفة الإسناد التدريسي الفعلي">
          <div className="overflow-x-auto">
            {filteredAssignments.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                <div className="bg-muted p-4 rounded-full mb-3">
                  <Users className="h-8 w-8 opacity-50" />
                </div>
                <p>لا توجد إسنادات تدريسية في هذه المرحلة بعد.</p>
              </div>
            ) : (
              <table className="w-full min-w-[700px] text-right text-sm">
                <thead className="bg-muted/50 text-xs font-bold uppercase text-muted-foreground rounded-t-xl">
                  <tr>
                    <th className="px-5 py-4 font-bold rounded-tr-xl">المعلم</th>
                    <th className="px-5 py-4 font-bold">المادة الدراسية</th>
                    <th className="px-5 py-4 font-bold">الفصل / الشعبة</th>
                    <th className="px-5 py-4 font-bold">السنة الأكاديمية</th>
                    <th className="px-5 py-4 rounded-tl-xl">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((r) => {
                    const sec = activeStageSections.find((s) => s.id === r.sectionId);
                    const t = activeStageStaff.find((s) => s.id === r.teacherId);
                    const sub = activeStageSubjects.find((s) => s.id === r.subjectId);
                    const y = allAcademicYears.find((y) => y.id === r.yearId);
                    return (
                      <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-accent/40 transition-colors">
                        <td className="px-5 py-4 font-bold text-primary">{t?.name || "معلم محذوف"}</td>
                        <td className="px-5 py-4"><Badge tone="info" className="px-3 py-1 font-bold">{sub?.name || "مادة محذوفة"}</Badge></td>
                        <td className="px-5 py-4 font-medium">{sec ? `${sec.grade} - شعبة ${sec.name}` : "شعبة محذوفة"}</td>
                        <td className="px-5 py-4 text-muted-foreground font-medium">{y?.name || "غير محدد"}</td>
                        <td className="px-5 py-4">
                          <button 
                            onClick={() => { 
                              deleteTeachingAssignment(r.id); 
                              toast.success("تم حذف الإسناد بنجاح"); 
                            }} 
                            className="rounded-xl p-2.5 text-danger hover:bg-danger/10 transition-colors"
                            title="إلغاء الإسناد"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </PageCard>
      </div>

      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title={`مصفوفة الإسناد التدريسي - ${getStageLabel(stage)}`}
        data={printData}
        templates={printTemplates} 
      />
    </AppShell>
  );
}
