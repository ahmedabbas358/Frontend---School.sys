import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage, isItemAllowedForGrade } from "@/lib/school-structure";
import { SearchableSelect } from "@/components/searchable-select";
import { Plus, Trash2, Users, Printer, Search, Filter } from "lucide-react";
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
    .map(t => ({ id: t.id, title: t.name, subtitle: t.role })), [activeStageStaff]);

  const grades = useMemo(() => getGradesForStage(stage), [stage]);
  const formSections = useMemo(() => (
    form.grade ? activeStageSections.filter(section => section.grade === form.grade) : []
  ), [activeStageSections, form.grade]);

  const subjectsList = useMemo(() => activeStageSubjects
    .filter(subject => form.grade && isItemAllowedForGrade(subject, stage, form.grade))
    .map(s => ({ id: s.id, title: s.name, subtitle: s.code })), [activeStageSubjects, form.grade, stage]);

  const sectionsList = useMemo(() => formSections
    .map(s => ({ id: s.id, title: `شعبة ${s.name}`, subtitle: s.grade })), [formSections]);

  const filterSections = useMemo(() => (
    filterGrade ? activeStageSections.filter(section => section.grade === filterGrade) : activeStageSections
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
              <p className="text-xl font-bold mt-1">{currentYear?.name || "١٤٤٦ هـ"}</p>
            </div>
            <Badge tone="success" className="h-8">مفعل</Badge>
          </div>
        </div>

        <PageCard title="بناء إسناد جديد" description="اختيار الفصل يفتح الشعب والمواد المطابقة فقط، ثم يتم ربط المعلم بالشعبة.">
          <div className="grid gap-4 md:grid-cols-5 items-end">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 px-1">المعلم</label>
              <SearchableSelect 
                value={form.teacherId} 
                onChange={(v) => setForm({...form, teacherId: v})} 
                options={teachersList} 
                placeholder="-- اختر المعلم --" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 px-1">الفصل</label>
              <select
                value={form.grade}
                onChange={(event) => setForm({ ...form, grade: event.target.value, sectionId: "", subjectId: "" })}
                className="h-12 w-full rounded-2xl border border-border/50 bg-background px-4 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
              >
                <option value="">-- اختر الفصل --</option>
                {grades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 px-1">الشعبة</label>
              <SearchableSelect 
                value={form.sectionId} 
                onChange={(v) => setForm({...form, sectionId: v})} 
                options={sectionsList} 
                placeholder={form.grade ? "-- اختر الشعبة --" : "اختر الفصل أولاً"}
                emptyMessage="لا توجد شعب لهذا الفصل"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5 px-1">المادة</label>
              <SearchableSelect 
                value={form.subjectId} 
                onChange={(v) => setForm({...form, subjectId: v})} 
                options={subjectsList} 
                placeholder={form.grade ? "-- اختر المادة --" : "اختر الفصل أولاً"}
                emptyMessage="لا توجد مواد مرتبطة بهذا الفصل"
              />
            </div>
            <button 
              onClick={add} 
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm hover:scale-105 active:scale-95"
            >
              <Plus className="h-5 w-5" /> تنفيذ الإسناد
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
                className="h-11 w-full rounded-xl border border-border/50 bg-background pr-10 pl-4 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select value={filterGrade} onChange={event => { setFilterGrade(event.target.value); setFilterSection(""); }} className="h-11 w-full rounded-xl border border-border/50 bg-background pr-10 pl-4 text-sm font-bold shadow-sm focus:border-primary focus:outline-none">
                <option value="">كل الفصول</option>
                {grades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
              </select>
            </div>
            <select disabled={!filterGrade} value={filterSection} onChange={event => setFilterSection(event.target.value)} className="h-11 w-full rounded-xl border border-border/50 bg-background px-4 text-sm font-bold shadow-sm focus:border-primary focus:outline-none disabled:opacity-50">
              <option value="">كل الشعب</option>
              {filterSections.map(section => <option key={section.id} value={section.id}>شعبة {section.name}</option>)}
            </select>
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
