import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage, isItemAllowedForGrade } from "@/lib/school-structure";
import { Search, Printer, FileText, BarChart3, Users, Award, CheckCircle } from "lucide-react";
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
  const { activeStageSections, activeStageStudents, activeStageSubjects, activeStageScheduledExams, activeStageExamGrades } = useGlobalStore();

  const [filterGrade, setFilterGrade] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const uniqueGrades = useMemo(() => getGradesForStage(stage), [stage]);
  const sectionsForGrade = useMemo(() => (
    filterGrade ? activeStageSections.filter(section => section.stage === stage && section.grade === filterGrade) : []
  ), [activeStageSections, stage, filterGrade]);
  
  const selectedSection = activeStageSections.find(s => s.id === filterSection);
  const reportSections = useMemo(() => {
    if (selectedSection) return [selectedSection];
    if (filterGrade) return activeStageSections.filter(section => section.stage === stage && section.grade === filterGrade);
    return activeStageSections.filter(section => section.stage === stage);
  }, [activeStageSections, filterGrade, selectedSection, stage]);

  const reportSectionIds = useMemo(() => new Set(reportSections.map(section => section.id)), [reportSections]);

  const applicableSubjects = useMemo(() => {
    if (filterGrade) return activeStageSubjects.filter(subject => isItemAllowedForGrade(subject, stage, filterGrade));
    return activeStageSubjects.filter(subject => subject.stage === "all" || subject.stage === stage);
  }, [activeStageSubjects, filterGrade, stage]);

  const students = useMemo(() => activeStageStudents.filter(student => {
    if (student.stage !== stage) return false;
    if (filterGrade && student.grade !== filterGrade) return false;
    if (reportSectionIds.size > 0) return Boolean(student.sectionId && reportSectionIds.has(student.sectionId));
    return true;
  }), [activeStageStudents, filterGrade, reportSectionIds, stage]);

  const masterData = useMemo(() => {
    const exams = activeStageScheduledExams.filter(e => (
      e.stage === stage &&
      (!filterGrade || e.grade === filterGrade) &&
      (!filterSection || e.sectionId === filterSection)
    ));
    
    return students.map(student => {
      let totalMarks = 0;
      let totalMaxMarks = 0;
      const subjectsMap: Record<string, number> = {};

      applicableSubjects.forEach(subject => {
        const subjectExams = exams.filter(e => e.subjectId === subject.id && (!student.sectionId || e.sectionId === student.sectionId));
        let subjectTotal = 0;
        let subjectMax = 0;
        
        subjectExams.forEach(ex => {
          subjectMax += ex.totalMarks;
          const grade = activeStageExamGrades.find(g => g.examId === ex.id && g.studentId === student.id);
          subjectTotal += grade?.mark || 0;
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
    }).sort((a,b) => b.totalMarks - a.totalMarks);
  }, [filterGrade, filterSection, students, applicableSubjects, activeStageScheduledExams, activeStageExamGrades, stage]);

  const printTemplate: PrintTemplate = {
    id: "master-sheet",
    name: `الكشف المجمع - ${selectedSection ? `${selectedSection.grade} شعبة ${selectedSection.name}` : filterGrade || "المرحلة كاملة"}`,
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
            <select value={stage} onChange={e => { setStage(e.target.value as any); setFilterGrade(""); setFilterSection(""); }} className="w-full h-11 rounded-xl border border-border/50 bg-background px-4 font-bold shadow-sm focus:border-primary">
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-muted-foreground">الفصل</label>
            <select value={filterGrade} onChange={e => { setFilterGrade(e.target.value); setFilterSection(""); }} className="w-full h-11 rounded-xl border border-border/50 bg-background px-4 font-bold shadow-sm focus:border-primary">
              <option value="">كل الفصول</option>
              {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-muted-foreground">الشعبة</label>
            <select disabled={!filterGrade} value={filterSection} onChange={e => setFilterSection(e.target.value)} className="w-full h-11 rounded-xl border border-border/50 bg-background px-4 font-bold shadow-sm focus:border-primary disabled:opacity-50">
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
                {masterData.length === 0 && (
                  <tr><td colSpan={applicableSubjects.length + 5} className="py-12 text-center text-muted-foreground font-bold">لا يوجد بيانات لعرضها.</td></tr>
                )}
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
// 2. Report Card Tab
// ==========================================
function ReportCardTab() {
  const { stage, setStage, stages } = useStage();
  const { activeStageStudents, activeStageSections, activeStageSubjects, activeStageScheduledExams, activeStageExamGrades, activeStageExamCategories } = useGlobalStore();
  
  const [searchQ, setSearchQ] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const uniqueGrades = useMemo(() => getGradesForStage(stage), [stage]);
  const sectionsForGrade = useMemo(() => (
    filterGrade ? activeStageSections.filter(section => section.stage === stage && section.grade === filterGrade) : []
  ), [activeStageSections, stage, filterGrade]);

  const student = activeStageStudents.find(s => s.id === selectedStudentId);
  const section = activeStageSections.find(s => s.id === student?.sectionId);

  const filteredStudents = useMemo(() => {
    if (!searchQ) return [];
    return activeStageStudents.filter(s => (
      s.stage === stage &&
      (!filterGrade || s.grade === filterGrade) &&
      (!filterSection || s.sectionId === filterSection) &&
      (s.name.includes(searchQ) || s.nationalId.includes(searchQ))
    )).slice(0, 8);
  }, [activeStageStudents, filterGrade, filterSection, searchQ, stage]);

  const reportData = useMemo(() => {
    if (!student || !section) return null;
    
    const applicableSubjects = activeStageSubjects.filter(s => isItemAllowedForGrade(s, stage, section.grade));
    const sectionExams = activeStageScheduledExams.filter(e => e.stage === stage && e.sectionId === section.id);

    let grandTotal = 0;
    let grandMax = 0;

    const subjectsData = applicableSubjects.map(subject => {
      const subjectExams = sectionExams.filter(e => e.subjectId === subject.id);
      let subjectTotal = 0;
      let subjectMax = 0;
      const examsData: any[] = [];
      let isDescriptive = false;
      let descGrade = "";

      subjectExams.forEach(exam => {
        if (exam.gradingSystem === 'descriptive') {
          isDescriptive = true;
        }
        const grade = activeStageExamGrades.find(g => g.examId === exam.id && g.studentId === student.id);
        const category = activeStageExamCategories.find(c => c.id === exam.categoryId);
        examsData.push({
          id: exam.id,
          name: exam.name,
          template: category?.name,
          mark: grade?.mark || 0,
          max: exam.totalMarks,
          desc: grade?.descriptiveGrade || ""
        });
        subjectTotal += grade?.mark || 0;
        subjectMax += exam.totalMarks;
        if (grade?.descriptiveGrade) descGrade = grade.descriptiveGrade;
      });

      grandTotal += subjectTotal;
      grandMax += subjectMax;

      return { subject, examsData, subjectTotal, subjectMax, isDescriptive, descGrade };
    });

    return { subjectsData, grandTotal, grandMax };
  }, [student, section, activeStageSubjects, activeStageScheduledExams, activeStageExamCategories, activeStageExamGrades, stage]);

  const printTemplate: PrintTemplate | null = reportData && student ? {
    id: "report-card",
    name: `شهادة درجات ${student.name}`,
    category: "شهادات",
    type: "document",
    renderDocument: () => (
      <div className="p-8 font-sans">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2>اسم الطالب: {student.name}</h2>
          <h3>الصف: {section?.grade} - الشعبة: {section?.name}</h3>
        </div>
        <table className="w-full text-right border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">المادة</th>
              <th className="border border-gray-300 p-2 text-center">الامتحانات</th>
              <th className="border border-gray-300 p-2 text-center">المجموع</th>
            </tr>
          </thead>
          <tbody>
            {reportData.subjectsData.map(row => (
              <tr key={row.subject.id}>
                <td className="border border-gray-300 p-2">{row.subject.name}</td>
                <td className="border border-gray-300 p-2 text-center">
                  {row.examsData.length > 0 ? row.examsData.map((exam: any) => `${exam.name}: ${row.isDescriptive ? exam.desc || "-" : `${exam.mark}/${exam.max}`}`).join(" | ") : "-"}
                </td>
                <td className="border border-gray-300 p-2 text-center font-bold">
                  {row.isDescriptive ? row.descGrade || '-' : `${row.subjectTotal} / ${row.subjectMax}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: '30px', textAlign: 'left', direction: 'ltr' }}>
          <h3>Total: {reportData.grandTotal} / {reportData.grandMax} ({reportData.grandMax > 0 ? ((reportData.grandTotal/reportData.grandMax)*100).toFixed(1) : 0}%)</h3>
        </div>
      </div>
    )
  } : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <PageCard title="البحث عن طالب">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-muted-foreground">المرحلة</label>
              <select value={stage} onChange={e => { setStage(e.target.value as any); setFilterGrade(""); setFilterSection(""); setSelectedStudentId(""); setSearchQ(""); }} className="h-11 w-full rounded-xl border border-border/50 bg-background px-4 text-sm font-bold shadow-sm focus:border-primary">
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-muted-foreground">الفصل</label>
              <select value={filterGrade} onChange={e => { setFilterGrade(e.target.value); setFilterSection(""); setSelectedStudentId(""); setSearchQ(""); }} className="h-11 w-full rounded-xl border border-border/50 bg-background px-4 text-sm font-bold shadow-sm focus:border-primary">
                <option value="">كل الفصول</option>
                {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-muted-foreground">الشعبة</label>
              <select disabled={!filterGrade} value={filterSection} onChange={e => { setFilterSection(e.target.value); setSelectedStudentId(""); setSearchQ(""); }} className="h-11 w-full rounded-xl border border-border/50 bg-background px-4 text-sm font-bold shadow-sm focus:border-primary disabled:opacity-50">
                <option value="">كل الشعب</option>
                {sectionsForGrade.map(section => <option key={section.id} value={section.id}>شعبة {section.name}</option>)}
              </select>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="اسم الطالب..."
                className="h-11 w-full rounded-xl border border-border/50 bg-background pr-10 pl-4 text-sm font-bold shadow-sm focus:border-primary"
              />
            </div>
            
            {searchQ && filteredStudents.length > 0 && (
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
                {filteredStudents.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => { setSelectedStudentId(s.id); setSearchQ(""); }}
                    className="w-full text-right px-4 py-3 border-b border-border/50 last:border-0 hover:bg-accent transition-colors font-bold text-sm"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}

            {student && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center mt-6">
                <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="font-black text-2xl">{student.name.charAt(0)}</span>
                </div>
                <h3 className="font-black text-lg text-primary">{student.name}</h3>
                <p className="text-muted-foreground text-sm font-bold mt-1">{section?.grade} - {section?.name}</p>
              </div>
            )}
          </div>
        </PageCard>
      </div>

      <div className="lg:col-span-3">
        {reportData && student ? (
          <div className="bg-card rounded-3xl shadow-lg border border-border/50 p-8 slide-in-from-bottom-4 animate-in relative overflow-hidden">
            {/* Watermark / Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -z-10"></div>
            <Award className="absolute top-8 left-8 w-32 h-32 text-primary/5 -z-10" />

            <div className="flex justify-between items-start mb-8 border-b border-border/50 pb-6">
              <div>
                <h2 className="text-3xl font-black text-primary mb-2">شهادة إشعار درجات</h2>
                <p className="text-muted-foreground font-bold text-lg">{section?.grade} / شعبة {section?.name}</p>
              </div>
              <button 
                onClick={() => setIsPrintOpen(true)}
                className="bg-accent hover:bg-accent/80 text-foreground font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
              >
                <Printer className="w-5 h-5"/> طباعة
              </button>
            </div>

            <div className="overflow-x-auto mb-8">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b-2 border-primary/20 bg-primary/5">
                    <th className="py-3 px-4 font-black text-primary w-1/3">المادة</th>
                    <th className="py-3 px-4 font-bold text-muted-foreground text-center">الامتحانات</th>
                    <th className="py-3 px-4 font-black text-primary text-center">المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.subjectsData.map(row => (
                    <tr key={row.subject.id} className="border-b border-border/50 hover:bg-accent/5">
                      <td className="py-3 px-4 font-bold">{row.subject.name}</td>
                      <td className="py-3 px-4">
                        {row.examsData.length > 0 ? (
                          <div className="flex flex-wrap gap-2 justify-center">
                            {row.examsData.map((exam: any) => (
                              <span key={exam.id} className="rounded-lg bg-accent px-2.5 py-1 text-xs font-bold">
                                {exam.name}: {row.isDescriptive ? exam.desc || "-" : `${exam.mark}/${exam.max}`}
                              </span>
                            ))}
                          </div>
                        ) : <span className="block text-center text-muted-foreground">-</span>}
                      </td>
                      <td className="py-3 px-4 text-center font-black bg-primary/5">
                        {row.isDescriptive ? (
                          <span className="text-sm">{row.descGrade || '-'}</span>
                        ) : (
                          <span>{row.subjectTotal} <span className="text-xs font-normal text-muted-foreground">/ {row.subjectMax}</span></span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground rounded-2xl p-6 text-left min-w-[300px]">
                <p className="text-primary-foreground/80 font-bold mb-1" dir="ltr">Total Score</p>
                <p className="text-4xl font-black mb-2" dir="ltr">{reportData.grandTotal} <span className="text-xl text-primary-foreground/70">/ {reportData.grandMax}</span></p>
                <div className="w-full bg-primary-foreground/20 rounded-full h-2 mb-2">
                  <div className="bg-white h-2 rounded-full" style={{width: `${reportData.grandMax > 0 ? (reportData.grandTotal/reportData.grandMax)*100 : 0}%`}}></div>
                </div>
                <p className="text-right font-bold">{reportData.grandMax > 0 ? ((reportData.grandTotal/reportData.grandMax)*100).toFixed(1) : 0}% نسبة الأداء</p>
              </div>
            </div>

            {isPrintOpen && printTemplate && (
              <AdvancedPrintEngine
                isOpen={isPrintOpen}
                data={[]}
                templates={[printTemplate]}
                onClose={() => setIsPrintOpen(false)}
              />
            )}
          </div>
        ) : (
          <div className="bg-card rounded-3xl border border-border/50 p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[400px]">
            <FileText className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-bold text-lg">الرجاء البحث عن طالب واختياره لعرض الشهادة.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. Analytics Tab
// ==========================================
function AnalyticsTab() {
  const { activeStageSections, activeStageScheduledExams, activeStageExamGrades } = useGlobalStore();

  const stats = useMemo(() => {
    const totalExams = activeStageScheduledExams.length;
    const completedExams = activeStageScheduledExams.filter(e => e.status === 'completed').length;
    
    // Calculate school average based on completed numeric exams
    let sumPercentages = 0;
    let countPercentages = 0;

    activeStageScheduledExams.filter(e => e.status === 'completed' && e.gradingSystem !== 'descriptive').forEach(exam => {
      const grades = activeStageExamGrades.filter(g => g.examId === exam.id);
      if (grades.length > 0 && exam.totalMarks > 0) {
        const sum = grades.reduce((a,b) => a + (b.mark||0), 0);
        const avg = sum / grades.length;
        const perc = (avg / exam.totalMarks) * 100;
        sumPercentages += perc;
        countPercentages++;
      }
    });

    const schoolAvg = countPercentages > 0 ? (sumPercentages / countPercentages) : 0;

    return { totalExams, completedExams, schoolAvg };
  }, [activeStageScheduledExams, activeStageExamGrades]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-muted-foreground font-bold mb-1">متوسط الأداء العام</h3>
          <p className="text-4xl font-black">{stats.schoolAvg.toFixed(1)}%</p>
        </div>
        
        <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-muted-foreground font-bold mb-1">الاختبارات المكتملة</h3>
          <p className="text-4xl font-black">{stats.completedExams} <span className="text-lg text-muted-foreground font-normal">/ {stats.totalExams}</span></p>
        </div>

        <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-warning/10 text-warning flex items-center justify-center mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-muted-foreground font-bold mb-1">إجمالي التقييمات المرصودة</h3>
          <p className="text-4xl font-black">{activeStageExamGrades.length}</p>
        </div>
      </div>

      <PageCard title="أداء الشعب" description="مقارنة سريعة لمتوسط الدرجات بين الشعب">
        <div className="space-y-4 mt-6">
          {activeStageSections.map(section => {
            // Calc avg for this section
            const secExams = activeStageScheduledExams.filter(e => e.sectionId === section.id && e.status === 'completed' && e.gradingSystem !== 'descriptive');
            let sSum = 0; let sCount = 0;
            secExams.forEach(exam => {
              const grades = activeStageExamGrades.filter(g => g.examId === exam.id);
              if(grades.length > 0 && exam.totalMarks > 0) {
                 const sum = grades.reduce((a,b)=>a+(b.mark||0), 0);
                 sSum += (sum/grades.length)/exam.totalMarks * 100;
                 sCount++;
              }
            });
            const avg = sCount > 0 ? (sSum/sCount) : 0;

            return (
              <div key={section.id} className="flex items-center gap-4">
                <div className="w-32 font-bold text-sm text-muted-foreground">{section.grade} - {section.name}</div>
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{width: `${avg}%`}}></div>
                </div>
                <div className="w-12 font-black text-right text-sm">{avg.toFixed(0)}%</div>
              </div>
            );
          })}
        </div>
      </PageCard>
    </div>
  );
}
