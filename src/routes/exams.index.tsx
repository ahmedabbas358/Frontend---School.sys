import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { CalendarDays, Plus, Trash2, X, Clock, FileText, Filter, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/exams/")({
  component: ExamsCalendar,
});

function ExamsCalendar() {
  const { 
    activeStageExams, 
    activeStageSubjects, 
    activeStageExamTypes, 
    activeStageSections, 
    examGradingMode,
    addExam, 
    deleteExam 
  } = useGlobalStore();
  
  const { stage, getStageLabel } = useStage();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [q, setQ] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterType, setFilterType] = useState("");
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const uniqueGrades = useMemo(() => Array.from(new Set(activeStageSections.map(s => s.grade))).filter(Boolean), [activeStageSections]);

  const [newExam, setNewExam] = useState({ 
    subjectId: "", 
    typeId: "", 
    term: "الفصل الأول", 
    date: "", 
    totalMarks: 100,
    grade: "",
    sectionId: "" 
  });

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExam.subjectId || !newExam.date || !newExam.typeId) {
      toast.error("الرجاء تعبئة جميع الحقول المطلوبة (المادة، النوع، التاريخ)");
      return;
    }
    
    addExam({
      ...newExam,
      totalMarks: Number(newExam.totalMarks),
      stage
    });
    
    toast.success("تمت إضافة الاختبار بنجاح");
    setIsModalOpen(false);
    setNewExam({ subjectId: "", typeId: "", term: "الفصل الأول", date: "", totalMarks: 100, grade: "", sectionId: "" });
  };

  const filteredExams = useMemo(() => {
    return activeStageExams.filter(ex => {
      const subject = activeStageSubjects.find(s => s.id === ex.subjectId);
      const type = activeStageExamTypes.find(t => t.id === ex.typeId);
      
      if (q && subject && !subject.name.includes(q)) return false;
      if (filterSubject && ex.subjectId !== filterSubject) return false;
      if (filterType && ex.typeId !== filterType) return false;
      if (filterGrade && ex.grade !== filterGrade) return false;
      
      return true;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeStageExams, activeStageSubjects, activeStageExamTypes, q, filterSubject, filterType, filterGrade]);

  return (
    <AppShell 
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الاختبارات" }, { label: "الإدارة والسجل" }]}
      actions={
        <div className="flex gap-2">
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-foreground shadow-sm hover:bg-accent/90 transition-all hover:scale-105"
          >
            <Printer className="h-4 w-4" /> طباعة الجدول
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4" /> جدولة اختبار جديد
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm glass">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-primary/10 p-3.5 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground">إجمالي الاختبارات</p>
                <p className="text-3xl font-black text-foreground mt-0.5">{activeStageExams.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm glass">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-warning/10 p-3.5 text-warning">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground">أقرب اختبار مجدول</p>
                <p className="text-xl font-black text-foreground mt-0.5 tabular-nums tracking-tight">
                  {activeStageExams.length > 0 
                    ? [...activeStageExams].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date 
                    : "لا يوجد"}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm glass">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-info/10 p-3.5 text-info">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground">المرحلة الحالية</p>
                <p className="text-xl font-black text-foreground mt-0.5">{getStageLabel(stage)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Filters Bar */}
        <PageCard title="عوامل التصفية">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="البحث باسم المادة..."
                className="h-11 w-full rounded-xl border border-input bg-background pr-9 pl-3 text-sm font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <select 
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-bold cursor-pointer outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
            >
              <option value="">كل المواد الدراسية</option>
              {activeStageSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select 
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-bold cursor-pointer outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="">كل أنواع الاختبارات</option>
              {activeStageExamTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select 
              className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-bold cursor-pointer outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={filterGrade}
              onChange={e => setFilterGrade(e.target.value)}
            >
              <option value="">كل الصفوف</option>
              {uniqueGrades.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </PageCard>

        {/* Table View */}
        <PageCard title="سجل الاختبارات المجدولة">
          <DataTable
            rows={filteredExams}
            columns={[
              { 
                key: "subject", 
                header: "المادة الدراسية", 
                cell: (r) => {
                  const subject = activeStageSubjects.find(s => s.id === r.subjectId);
                  return <span className="font-extrabold text-primary">{subject?.name || "غير محدد"}</span>;
                } 
              },
              { 
                key: "type", 
                header: "نوع الاختبار", 
                cell: (r) => {
                  const type = activeStageExamTypes.find(t => t.id === r.typeId);
                  return <Badge tone="info">{type?.name || "غير محدد"}</Badge>;
                } 
              },
              { key: "term", header: "الفصل", cell: (r) => <span className="text-sm font-medium">{r.term}</span> },
              { 
                key: "target", 
                header: "المستهدف", 
                cell: (r) => {
                  if (r.sectionId) {
                    const section = activeStageSections.find(s => s.id === r.sectionId);
                    return <span className="text-sm text-muted-foreground">{r.grade} - شعبة {section?.name}</span>;
                  }
                  if (r.grade) return <span className="text-sm text-muted-foreground">{r.grade} (جميع الشعب)</span>;
                  return <span className="text-sm text-muted-foreground">جميع الصفوف</span>;
                }
              },
              { 
                key: "date", 
                header: "تاريخ الاختبار", 
                cell: (r) => (
                  <span className="tabular-nums font-bold text-foreground bg-accent px-2 py-1 rounded-md border border-border">
                    {r.date}
                  </span>
                ) 
              },
              { 
                key: "marks", 
                header: "التقييم الكلي", 
                cell: (r) => (
                  <span className="font-black text-lg text-success">
                    {r.totalMarks} {examGradingMode === "percentage" ? "%" : "درجة"}
                  </span>
                ) 
              },
              { 
                key: "actions", 
                header: "", 
                cell: (r) => (
                  <button 
                    onClick={() => {
                      if(confirm("هل تريد حذف هذا الاختبار من الجدول؟")) {
                        deleteExam(r.id);
                        toast.success("تم حذف الاختبار بنجاح");
                      }
                    }}
                    className="rounded-lg p-2 text-danger hover:bg-danger/10 transition-colors"
                    title="حذف الاختبار"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )
              },
            ]}
            empty="لا توجد اختبارات مجدولة حالياً."
          />
        </PageCard>

        <AdvancedPrintEngine
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          title={`جدول الاختبارات المجدولة`}
          subtitle={`العام الدراسي الحالي - ${getStageLabel(stage)}`}
          data={filteredExams}
          templates={[
            {
              id: "exams-table",
              name: "جدول الاختبارات",
              category: "قوائم الاختبارات",
              columns: [
                { key: "subject", label: "المادة الدراسية", render: (r) => activeStageSubjects.find(s => s.id === r.subjectId)?.name || "" },
                { key: "type", label: "نوع الاختبار", render: (r) => activeStageExamTypes.find(t => t.id === r.typeId)?.name || "" },
                { key: "term", label: "الفصل الدراسي", render: (r) => r.term },
                { key: "target", label: "المستهدف", render: (r) => r.sectionId ? `${r.grade} - شعبة ${activeStageSections.find(s => s.id === r.sectionId)?.name}` : (r.grade || "جميع الصفوف") },
                { key: "date", label: "التاريخ", render: (r) => r.date },
                { key: "marks", label: "التقييم الكلي", render: (r) => `${r.totalMarks} ${examGradingMode === "percentage" ? "%" : "درجة"}` }
              ]
            }
          ]}
        />
      </div>

      {/* Add Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50">
              <h2 className="text-2xl font-black flex items-center gap-2 text-primary">
                <CalendarDays className="h-6 w-6" /> جدولة اختبار جديد
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-accent transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddExam} className="p-6 space-y-5 custom-scrollbar max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">مخصص للصف (الدرجة)</label>
                  <select
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                    value={newExam.grade}
                    onChange={e => setNewExam({...newExam, grade: e.target.value, sectionId: "", subjectId: ""})}
                  >
                    <option value="">جميع الصفوف</option>
                    {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">مخصص لشعبة (اختياري)</label>
                  <select
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                    value={newExam.sectionId}
                    onChange={e => setNewExam({...newExam, sectionId: e.target.value})}
                    disabled={!newExam.grade}
                  >
                    <option value="">جميع الشعب</option>
                    {activeStageSections.filter(s => s.grade === newExam.grade).map(s => (
                      <option key={s.id} value={s.id}>شعبة {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-muted-foreground">المادة الدراسية <span className="text-danger">*</span></label>
                <select
                  required
                  className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer disabled:opacity-50"
                  value={newExam.subjectId}
                  onChange={e => setNewExam({...newExam, subjectId: e.target.value})}
                  disabled={!!newExam.grade === false && activeStageSubjects.some(s => s.grades && s.grades.length > 0)}
                >
                  <option value="">-- اختر المادة --</option>
                  {activeStageSubjects
                    .filter(s => !s.grades || s.grades.length === 0 || (newExam.grade && s.grades.includes(newExam.grade)))
                    .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {(!newExam.grade && activeStageSubjects.some(s => s.grades && s.grades.length > 0)) && (
                  <span className="block text-xs text-warning mt-1">الرجاء اختيار الصف أولاً لتظهر لك مواده الدراسية المخصصة.</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">نوع الاختبار <span className="text-danger">*</span></label>
                  <select
                    required
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                    value={newExam.typeId}
                    onChange={e => setNewExam({...newExam, typeId: e.target.value})}
                  >
                    <option value="">-- اختر النوع --</option>
                    {activeStageExamTypes
                      .filter(t => !t.subjectId || t.subjectId === newExam.subjectId)
                      .map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">الفصل الدراسي</label>
                  <select
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                    value={newExam.term}
                    onChange={e => setNewExam({...newExam, term: e.target.value})}
                  >
                    <option value="الفصل الأول">الفصل الأول</option>
                    <option value="الفصل الثاني">الفصل الثاني</option>
                    <option value="الفصل الثالث">الفصل الثالث</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">تاريخ الاختبار <span className="text-danger">*</span></label>
                  <input 
                    type="date" 
                    required
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    value={newExam.date}
                    onChange={e => setNewExam({...newExam, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">التقييم الكلي ({examGradingMode === "percentage" ? "%" : "درجة"}) <span className="text-danger">*</span></label>
                  <input 
                    type="number" 
                    min="1" max={examGradingMode === "percentage" ? 100 : 1000}
                    required
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold tabular-nums focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors text-left"
                    dir="ltr"
                    value={newExam.totalMarks}
                    onChange={e => setNewExam({...newExam, totalMarks: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-5 py-2.5 font-bold hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="rounded-xl bg-primary px-8 py-2.5 font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm hover:scale-105"
                >
                  اعتماد الاختبار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
