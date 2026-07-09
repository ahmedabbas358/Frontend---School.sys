import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage } from "@/lib/school-structure";
import { Printer, FileText, BarChart3, Users } from "lucide-react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/exams/reports")({
  component: ExamsReportsPage,
  head: () => ({ meta: [{ title: "التقارير والشهادات" }] })
});

function ExamsReportsPage() {
  const [activeTab, setActiveTab] = useState<"master" | "report-card" | "analytics">("master");

  return (
    <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الاختبارات", to: "/exams" }, { label: "التقارير والشهادات" }]}>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
        <div className="flex gap-4 border-b border-border/50 pb-2 overflow-x-auto">
          <button 
            onClick={() => setActiveTab("master")}
            className={`whitespace-nowrap flex items-center gap-2 pb-2 px-4 font-bold text-base transition-all border-b-2 ${activeTab === "master" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Users className="w-5 h-5"/> الكشف المجمع (Master Sheet)
          </button>
          <button 
            onClick={() => setActiveTab("report-card")}
            className={`whitespace-nowrap flex items-center gap-2 pb-2 px-4 font-bold text-base transition-all border-b-2 ${activeTab === "report-card" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <FileText className="w-5 h-5"/> الشهادة الفردية (Report Card)
          </button>
          <button 
            onClick={() => setActiveTab("analytics")}
            className={`whitespace-nowrap flex items-center gap-2 pb-2 px-4 font-bold text-base transition-all border-b-2 ${activeTab === "analytics" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <BarChart3 className="w-5 h-5"/> تحليلات الأداء
          </button>
        </div>

        {activeTab === "master" && <MasterSheetTab />}
        {activeTab === "report-card" && <ReportCardTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
      </div>
    </AppShell>
  );
}

// ==========================================
// 1. Master Sheet Tab
// ==========================================
function MasterSheetTab() {
  const { stage, setStage, stages } = useStage();
  const { 
    activeStageSections, 
    activeStageStudents, 
    activeStageSubjects,
    activeStageExamSubjects,
    allExamResults,
    allStudentEnrollments,
    currentAcademicYearId
  } = useGlobalStore();

  const [filterGrade, setFilterGrade] = useState("");
  const [filterSectionId, setFilterSectionId] = useState("");
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const uniqueGrades = useMemo(() => getGradesForStage(stage), [stage]);
  const sectionsForGrade = useMemo(() => (
    filterGrade ? activeStageSections.filter(s => s.stage === stage && s.grade === filterGrade) : []
  ), [activeStageSections, stage, filterGrade]);

  const applicableSubjects = useMemo(() => {
    // Return subjects taught in the selected grade (if any), otherwise all for stage
    return activeStageSubjects.filter(s => 
      (s.stage === stage || s.stage === "all") &&
      (!filterGrade || (s.grades && s.grades.includes(filterGrade)) || !s.grades)
    );
  }, [activeStageSubjects, filterGrade, stage]);

  const enrollmentsToReport = useMemo(() => {
    return allStudentEnrollments.filter(e => {
      if (e.academicYearId !== currentAcademicYearId) return false;
      const section = activeStageSections.find(s => s.id === e.sectionId);
      if (!section || section.stage !== stage) return false;
      if (filterGrade && section.grade !== filterGrade) return false;
      if (filterSectionId && section.id !== filterSectionId) return false;
      return true;
    });
  }, [allStudentEnrollments, currentAcademicYearId, activeStageSections, stage, filterGrade, filterSectionId]);

  const masterData = useMemo(() => {
    return enrollmentsToReport.map(enrollment => {
      const student = activeStageStudents.find(s => s.id === enrollment.studentId);
      if (!student) return null;

      let totalMarks = 0;
      let totalMaxMarks = 0;
      const subjectsMap: Record<string, number> = {};

      applicableSubjects.forEach(subject => {
        // Find all ExamSubjects for this subject and grade
        const examSubjects = activeStageExamSubjects.filter(es => es.subjectId === subject.id && es.grade === filterGrade);
        let subjectTotal = 0;
        let subjectMax = 0;
        
        examSubjects.forEach(es => {
          subjectMax += es.maxScore;
          const result = allExamResults.find(r => r.examSubjectId === es.id && r.studentEnrollmentId === enrollment.id);
          subjectTotal += result?.mark || 0;
        });

        subjectsMap[subject.id] = subjectTotal;
        totalMarks += subjectTotal;
        totalMaxMarks += subjectMax;
      });

      const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
      let rank = "ناجح";
      if (percentage >= 90) rank = "ممتاز";
      else if (percentage >= 80) rank = "جيد جداً";
      else if (percentage >= 70) rank = "جيد";
      else if (percentage >= 50) rank = "مقبول";
      else rank = "راسب";

      return { student, subjectsMap, totalMarks, totalMaxMarks, percentage, rank };
    }).filter(Boolean) as {student: any, subjectsMap: any, totalMarks: number, totalMaxMarks: number, percentage: number, rank: string}[];
  }, [enrollmentsToReport, activeStageStudents, applicableSubjects, activeStageExamSubjects, allExamResults, filterGrade]);

  const printTemplate: PrintTemplate = {
    id: "master-sheet",
    name: `الكشف المجمع - ${filterSectionId ? `شعبة ` : filterGrade || "المرحلة كاملة"}`,
    category: "تقارير",
    type: "table",
    columns: [
      { key: 'index', label: 'م' },
      { key: 'name', label: 'اسم الطالب' },
      ...applicableSubjects.map(s => ({ key: s.id, label: s.name })),
      { key: 'totalMarks', label: 'المجموع' },
      { key: 'percentage', label: 'النسبة' },
      { key: 'rank', label: 'التقدير' },
    ]
  };

  const printData = masterData.map((d, i) => ({
    id: d.student.id,
    index: i + 1,
    name: d.student.name,
    totalMarks: d.totalMarks,
    percentage: d.percentage.toFixed(1) + '%',
    rank: d.rank,
    ...d.subjectsMap
  }));

  return (
    <div className="space-y-6">
      <PageCard title="خيارات الكشف">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-muted-foreground">المرحلة</label>
            <select value={stage} onChange={e => { setStage(e.target.value as any); setFilterGrade(""); setFilterSectionId(""); }} className="w-full h-11 rounded-xl border border-border/50 bg-background px-4 font-bold shadow-sm focus:border-primary">
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-muted-foreground">الفصل</label>
            <select value={filterGrade} onChange={e => { setFilterGrade(e.target.value); setFilterSectionId(""); }} className="w-full h-11 rounded-xl border border-border/50 bg-background px-4 font-bold shadow-sm focus:border-primary">
              <option value="">كل الفصول</option>
              {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-muted-foreground">الشعبة</label>
            <select disabled={!filterGrade} value={filterSectionId} onChange={e => setFilterSectionId(e.target.value)} className="w-full h-11 rounded-xl border border-border/50 bg-background px-4 font-bold shadow-sm focus:border-primary disabled:opacity-50">
              <option value="">كل الشعب</option>
              {sectionsForGrade.map(s => <option key={s.id} value={s.id}>شعبة {s.name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button 
              disabled={masterData.length === 0}
              onClick={() => setIsPrintOpen(true)}
              className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Printer className="w-5 h-5"/> طباعة الكشف
            </button>
          </div>
        </div>
      </PageCard>

      {masterData.length > 0 && (
        <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden slide-in-from-bottom-4 animate-in">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="py-3 px-4 font-bold text-muted-foreground w-12 text-center">#</th>
                  <th className="py-3 px-4 font-bold text-muted-foreground whitespace-nowrap sticky right-0 bg-muted/30 z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.05)]">اسم الطالب</th>
                  {applicableSubjects.map(s => (
                    <th key={s.id} className="py-3 px-4 font-bold text-muted-foreground text-center whitespace-nowrap min-w-[100px]">{s.name}</th>
                  ))}
                  <th className="py-3 px-4 font-bold text-primary text-center whitespace-nowrap">المجموع</th>
                  <th className="py-3 px-4 font-bold text-primary text-center whitespace-nowrap">النسبة</th>
                  <th className="py-3 px-4 font-bold text-primary text-center whitespace-nowrap">التقدير</th>
                </tr>
              </thead>
              <tbody>
                {masterData.map((d, idx) => (
                  <tr key={d.student.id} className="border-b border-border/50 last:border-0 hover:bg-accent/10 transition-colors">
                    <td className="py-3 px-4 text-center text-muted-foreground font-bold">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold sticky right-0 bg-card z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">{d.student.name}</td>
                    {applicableSubjects.map(s => (
                      <td key={s.id} className="py-3 px-4 text-center font-bold">{d.subjectsMap[s.id] || "-"}</td>
                    ))}
                    <td className="py-3 px-4 text-center font-black text-primary bg-primary/5">{d.totalMarks}</td>
                    <td className="py-3 px-4 text-center font-black" dir="ltr">{d.percentage.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={`px-2 py-1 rounded-md text-xs ${
                        d.rank === 'ممتاز' ? 'bg-success/20 text-success' : 
                        d.rank === 'راسب' ? 'bg-danger/20 text-danger' : 
                        'bg-warning/20 text-warning-foreground'
                      }`}>
                        {d.rank}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isPrintOpen && (
        <AdvancedPrintEngine
          isOpen={isPrintOpen}
          data={printData}
          templates={[printTemplate]}
          onClose={() => setIsPrintOpen(false)}
        />
      )}
    </div>
  );
}

// ==========================================
// 2. Report Card Tab (Placeholder)
// ==========================================
function ReportCardTab() {
  return (
    <PageCard title="الشهادة الفردية">
      <div className="py-20 text-center text-muted-foreground">
        <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p className="font-bold">سيتم بناء واجهة الشهادة الفردية قريباً</p>
      </div>
    </PageCard>
  );
}

// ==========================================
// 3. Analytics Tab (Placeholder)
// ==========================================
function AnalyticsTab() {
  return (
    <PageCard title="تحليلات الأداء">
      <div className="py-20 text-center text-muted-foreground">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p className="font-bold">سيتم بناء لوحة التحليلات قريباً</p>
      </div>
    </PageCard>
  );
}
