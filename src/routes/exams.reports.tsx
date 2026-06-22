import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { Printer, GraduationCap, LayoutGrid, Users, Award, BookOpen } from "lucide-react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

import { ErrorBoundary } from "@/components/ErrorBoundary";

export const Route = createFileRoute("/exams/reports")({
  head: () => ({ meta: [{ title: "التقارير والشهادات" }] }),
  component: () => (
    <ErrorBoundary>
      <ExamsReportsPage />
    </ErrorBoundary>
  ),
});

function ExamsReportsPage() {
  const { stage, getStageLabel } = useStage();
  const { 
    activeStageSections, 
    activeStageSubjects, 
    activeStageExams, 
    activeStageStudents,
    activeStageExamMarks,
    activeStageExamTypes,
    examGradingMode,
  } = useGlobalStore();

  const [activeTab, setActiveTab] = useState<"master" | "individual">("master");
  
  const uniqueGrades = useMemo(() => Array.from(new Set(activeStageSections.map(s => s.grade))).filter(Boolean), [activeStageSections]);

  // State for Master Sheet
  const [masterGrade, setMasterGrade] = useState("");
  const [masterSectionId, setMasterSectionId] = useState("");
  
  // State for Individual Report
  const [indivGrade, setIndivGrade] = useState("");
  const [indivSectionId, setIndivSectionId] = useState("");
  const [studentId, setStudentId] = useState("");
  const selectedStudent = useMemo(() => activeStageStudents.find(s => s.id === studentId), [activeStageStudents, studentId]);

  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const gradingSymbol = examGradingMode === "percentage" ? "%" : "درجة";

  // Compute Master Sheet Data
  const masterSheetData = useMemo(() => {
    // If no grade selected, return empty
    if (!masterGrade) return [];
    
    // Students in this grade/section
    let students = activeStageStudents.filter((s) => s.grade === masterGrade);
    if (masterSectionId) {
      students = students.filter(s => s.sectionId === masterSectionId);
    }
    
    // Filter subjects for this grade
    const gradeSubjects = activeStageSubjects.filter(sub => !sub.grades || sub.grades.length === 0 || sub.grades.includes(masterGrade));

    return students.map(student => {
      const row: any = {
        id: student.id,
        name: student.name,
        nationalId: student.nationalId,
        sectionName: activeStageSections.find(s => s.id === student.sectionId)?.name || ""
      };

      let totalStudentMarks = 0;
      let totalPossibleMarks = 0;

      // Calculate totals per subject
      gradeSubjects.forEach(subject => {
        // Find exams for this subject
        const subjectExams = activeStageExams.filter(e => e.subjectId === subject.id && (e.grade === masterGrade || !e.grade));
        let subjStudentMarks = 0;
        let subjPossibleMarks = 0;
        
        subjectExams.forEach(exam => {
          subjPossibleMarks += exam.totalMarks;
          const markEntry = activeStageExamMarks.find(m => m.examId === exam.id && m.studentId === student.id);
          if (markEntry && markEntry.mark !== undefined) {
            subjStudentMarks += markEntry.mark;
          }
        });

        // Add to row dynamic key using subject ID
        if (subjPossibleMarks > 0) {
          const finalSubjVal = examGradingMode === "percentage" 
            ? Math.round((subjStudentMarks / subjPossibleMarks) * 100)
            : subjStudentMarks;
          row[subject.id] = `${finalSubjVal} ${gradingSymbol}`;
        } else {
          row[subject.id] = "-";
        }

        totalStudentMarks += subjStudentMarks;
        totalPossibleMarks += subjPossibleMarks;
      });

      // Total OverAll
      if (totalPossibleMarks > 0) {
        row.total = examGradingMode === "percentage" 
          ? `${Math.round((totalStudentMarks / totalPossibleMarks) * 100)} %`
          : `${totalStudentMarks} من ${totalPossibleMarks}`;
      } else {
        row.total = "-";
      }

      return row;
    });
  }, [selectedSection, activeStageStudents, activeStageSubjects, activeStageExams, activeStageExamMarks, examGradingMode, gradingSymbol]);

  // Dynamic Columns for Print Engine based on Subjects
  const masterPrintColumns = useMemo(() => {
    const gradeSubjects = masterGrade 
      ? activeStageSubjects.filter(sub => !sub.grades || sub.grades.length === 0 || sub.grades.includes(masterGrade))
      : activeStageSubjects;

    return [
      { key: "nationalId", label: "الرقم" },
      { key: "name", label: "اسم الطالب" },
      ...(!masterSectionId ? [{ key: "sectionName", label: "الشعبة" }] : []),
      ...gradeSubjects.map(s => ({
        key: s.id,
        label: s.name
      })),
      { key: "total", label: "المجموع الكلي" }
    ];
  }, [activeStageSubjects, masterGrade, masterSectionId]);

  const masterPrintTemplates: PrintTemplate[] = [
    {
      id: "master-sheet",
      name: "الكشف المجمع (Master Sheet)",
      category: "التقارير الأكاديمية",
      type: "table",
      columns: masterPrintColumns
    }
  ];

  // Report Card Data
  const reportCardData = useMemo(() => {
    if (!selectedStudent) return [];
    
    // Filter subjects for this student's grade
    const studentSubjects = activeStageSubjects.filter(sub => !sub.grades || sub.grades.length === 0 || sub.grades.includes(selectedStudent.grade));

    // We want to pass a structured row that the document template can consume.
    const subjectsData = studentSubjects.map(subject => {
      const subjectExams = activeStageExams.filter(e => e.subjectId === subject.id && (!e.grade || e.grade === selectedStudent.grade));
      let subjStudentMarks = 0;
      let subjPossibleMarks = 0;
      let breakdown: any[] = [];
      
      subjectExams.forEach(exam => {
        subjPossibleMarks += exam.totalMarks;
        const markEntry = activeStageExamMarks.find(m => m.examId === exam.id && m.studentId === selectedStudent.id);
        const examType = activeStageExamTypes.find(t => t.id === exam.typeId);
        const mark = markEntry?.mark !== undefined ? markEntry.mark : null;
        
        if (mark !== null) subjStudentMarks += mark;
        
        breakdown.push({
          examName: examType?.name || "اختبار",
          term: exam.term,
          mark: mark,
          max: exam.totalMarks
        });
      });

      return {
        subjectName: subject.name,
        studentMark: subjStudentMarks,
        possibleMark: subjPossibleMarks,
        breakdown,
        finalStr: subjPossibleMarks > 0 
          ? (examGradingMode === "percentage" ? `${Math.round((subjStudentMarks / subjPossibleMarks) * 100)}%` : `${subjStudentMarks}`)
          : "-"
      };
    });

    return [{
      id: selectedStudent.id,
      name: selectedStudent.name,
      grade: selectedStudent.grade,
      subjects: subjectsData,
    }];
  }, [selectedStudent, activeStageSubjects, activeStageExams, activeStageExamMarks, activeStageExamTypes, examGradingMode]);

  const renderReportCard = (student: any) => (
    <div className="p-8 border-4 border-double border-primary/20 bg-white min-h-[800px] flex flex-col relative" dir="rtl">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="text-center mb-12 relative z-10">
        <Award className="h-16 w-16 mx-auto text-primary mb-4" />
        <h1 className="text-3xl font-black text-foreground mb-2">إشعار نتيجة طالب</h1>
        <p className="text-lg text-muted-foreground">{getStageLabel(stage)}</p>
      </div>

      <div className="flex justify-between items-center mb-8 border-y-2 border-border/50 py-4 relative z-10">
        <div>
          <p className="text-sm text-muted-foreground mb-1">اسم الطالب</p>
          <p className="text-xl font-bold">{student.name}</p>
        </div>
        <div className="text-left">
          <p className="text-sm text-muted-foreground mb-1">الصف</p>
          <p className="text-xl font-bold">{student.grade}</p>
        </div>
      </div>

      <table className="w-full text-right border-collapse relative z-10 mb-12">
        <thead>
          <tr className="bg-primary/5">
            <th className="border-b-2 border-primary/20 p-4 font-bold text-lg">المادة الدراسية</th>
            <th className="border-b-2 border-primary/20 p-4 font-bold text-lg text-center">التفاصيل</th>
            <th className="border-b-2 border-primary/20 p-4 font-bold text-lg text-center">النتيجة النهائية</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {student.subjects.map((subj: any, i: number) => (
            <tr key={i} className="hover:bg-accent/20 transition-colors">
              <td className="p-4 font-bold text-base">{subj.subjectName}</td>
              <td className="p-4 text-xs text-center text-muted-foreground">
                {subj.breakdown.length === 0 ? "لا يوجد بيانات" : 
                  subj.breakdown.map((b: any, j: number) => (
                    <span key={j} className="inline-block bg-accent px-2 py-1 rounded mx-1 mb-1">
                      {b.examName}: {b.mark !== null ? b.mark : '-'}/{b.max}
                    </span>
                  ))
                }
              </td>
              <td className="p-4 text-center text-xl font-black text-primary">{subj.finalStr}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-auto grid grid-cols-2 gap-8 text-center pt-16 relative z-10">
        <div>
          <p className="font-bold text-lg mb-8">اعتماد مربي الفصل</p>
          <div className="w-48 border-b-2 border-dashed border-border/50 mx-auto"></div>
        </div>
        <div>
          <p className="font-bold text-lg mb-8">اعتماد مدير المدرسة</p>
          <div className="w-48 border-b-2 border-dashed border-border/50 mx-auto"></div>
        </div>
      </div>
    </div>
  );

  const reportCardTemplates: PrintTemplate[] = [
    {
      id: "report-card",
      name: "شهادة الطالب المجمعة",
      category: "الشهادات",
      type: "document",
      renderDocument: (opts, data) => {
        const student = data[0];
        if (!student) return null;
        return renderReportCard(student);
      }
    }
  ];

  return (
    <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الاختبارات", to: "/exams" }, { label: "التقارير والشهادات" }]}>
      <div className="flex flex-col gap-6">
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto w-full">
          
          {/* Navigation Tabs */}
          <div className="flex p-1 bg-muted rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab("master")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "master" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="h-5 w-5" /> الكشف المجمع (Master Sheet)
            </button>
            <button
              onClick={() => setActiveTab("individual")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "individual" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Award className="h-5 w-5" /> الشهادات الفردية (Report Cards)
            </button>
          </div>

          {activeTab === "master" && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-6">
              {/* Sidebar: Filters */}
              <div className="space-y-6">
                <PageCard title="إعدادات الكشف">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-muted-foreground">الصف <span className="text-danger">*</span></label>
                      <select 
                        value={masterGrade} 
                        onChange={(e) => {
                          setMasterGrade(e.target.value);
                          setMasterSectionId("");
                        }}
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold shadow-sm cursor-pointer"
                      >
                        <option value="">-- يرجى تحديد الصف --</option>
                        {uniqueGrades.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <label className="mb-2 block text-sm font-bold text-muted-foreground">الشعبة (اختياري)</label>
                      <select 
                        value={masterSectionId} 
                        onChange={(e) => setMasterSectionId(e.target.value)}
                        disabled={!masterGrade}
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        <option value="">كل الشعب</option>
                        {activeStageSections.filter(s => s.grade === masterGrade).map((s) => (
                          <option key={s.id} value={s.id}>شعبة {s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </PageCard>
              </div>

              {/* Main Content: Results Table preview */}
              <div className="md:col-span-3">
                <PageCard 
                  title="معاينة الكشف المجمع" 
                  actions={
                    <button 
                      onClick={() => setIsPrintOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                    >
                      <Printer className="h-4 w-4" /> طباعة الكشف
                    </button>
                  }
                >
                  <div className="overflow-x-auto rounded-2xl border border-border/50 shadow-sm">
                    <table className="w-full text-right text-sm">
                      <thead>
                        <tr className="bg-primary/5 border-b border-primary/20">
                          {masterPrintColumns.map((col, idx) => (
                            <th key={col.key} className={`p-4 font-bold text-primary ${idx === 0 ? "rounded-tr-2xl" : ""} ${idx === masterPrintColumns.length - 1 ? "rounded-tl-2xl" : ""}`}>
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {masterSheetData.length > 0 ? masterSheetData.slice(0, 10).map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-accent/20 transition-colors">
                            {masterPrintColumns.map(col => (
                              <td key={col.key} className="p-4">{row[col.key] || '-'}</td>
                            ))}
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={masterPrintColumns.length} className="p-12 text-center text-muted-foreground font-medium">
                              {masterGrade ? "لا يوجد بيانات للعرض. تأكد من تحديد الشعبة إن وجدت، أو قم برصد الدرجات." : "يرجى تحديد الصف لعرض النتائج."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {masterSheetData.length > 10 && (
                      <div className="p-4 text-center bg-accent/30 text-muted-foreground text-xs font-bold border-t border-border/50">
                        يعرض أول 10 طلاب فقط للمعاينة. (إجمالي: {masterSheetData.length} طالب)
                      </div>
                    )}
                  </div>
                </PageCard>
              </div>
            </div>
          )}

          {activeTab === "individual" && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-6 h-[calc(100vh-16rem)] min-h-[600px]">
              {/* Sidebar: Student Selector */}
              <div className="space-y-6">
                <PageCard title="البحث عن طالب">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-muted-foreground">تصفية بالصف (اختياري)</label>
                      <select 
                        value={indivGrade} 
                        onChange={(e) => {
                          setIndivGrade(e.target.value);
                          setIndivSectionId("");
                          setStudentId("");
                        }}
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold shadow-sm cursor-pointer"
                      >
                        <option value="">الكل</option>
                        {uniqueGrades.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <label className="mb-2 block text-sm font-bold text-muted-foreground">تصفية بالشعبة (اختياري)</label>
                      <select 
                        value={indivSectionId} 
                        onChange={(e) => {
                          setIndivSectionId(e.target.value);
                          setStudentId("");
                        }}
                        disabled={!indivGrade}
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        <option value="">كل الشعب</option>
                        {activeStageSections.filter(s => s.grade === indivGrade).map((s) => (
                          <option key={s.id} value={s.id}>شعبة {s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-2 border-t border-border/50">
                      <label className="mb-2 block text-sm font-bold text-muted-foreground">اختر الطالب <span className="text-danger">*</span></label>
                      <select 
                        value={studentId} 
                        onChange={(e) => setStudentId(e.target.value)}
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold shadow-sm cursor-pointer"
                      >
                        <option value="">-- يرجى تحديد الطالب --</option>
                        {activeStageStudents
                          .filter(s => !indivGrade || s.grade === indivGrade)
                          .filter(s => !indivSectionId || s.sectionId === indivSectionId)
                          .map((s) => <option key={s.id} value={s.id}>{s.name} - {s.nationalId}</option>)
                        }
                      </select>
                    </div>
                  </div>
                </PageCard>
              </div>

              <div className="md:col-span-3">
                {selectedStudent ? (
                  <PageCard 
                    title={`نتيجة الطالب: ${selectedStudent.name}`} 
                    actions={
                      <button 
                        onClick={() => setIsPrintOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                      >
                        <Printer className="h-4 w-4" /> طباعة الشهادة
                      </button>
                    }
                  >
                    <div className="space-y-6">
                      <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-2 text-primary font-bold">
                          <BookOpen className="h-5 w-5" /> الصف: {selectedStudent.grade}
                        </div>
                        <div className="w-px h-6 bg-primary/20 mx-2 hidden sm:block"></div>
                        <div className="flex items-center gap-2 text-primary font-bold">
                          <Users className="h-5 w-5" /> الرقم الوطني: {selectedStudent.nationalId}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {reportCardData[0]?.subjects.map((subj: any, i: number) => (
                          <div key={i} className="p-5 rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all">
                            <h4 className="font-bold text-lg mb-2">{subj.subjectName}</h4>
                            <div className="text-3xl font-black text-primary mb-4">{subj.finalStr}</div>
                            
                            <div className="space-y-2">
                              {subj.breakdown.map((b: any, j: number) => (
                                <div key={j} className="flex justify-between items-center text-xs text-muted-foreground p-2 rounded-lg bg-accent/50">
                                  <span>{b.examName}</span>
                                  <span className="font-bold text-foreground">{b.mark !== null ? b.mark : '-'}/{b.max}</span>
                                </div>
                              ))}
                              {subj.breakdown.length === 0 && (
                                <div className="text-xs text-muted-foreground text-center p-2">لم يتم تقييمه بعد</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PageCard>
                ) : (
                  <div className="py-24 text-center bg-card rounded-3xl border border-border/50 shadow-sm h-full flex flex-col justify-center items-center">
                    <GraduationCap className="h-20 w-20 text-muted-foreground/30 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">اختر طالباً</h3>
                    <p className="text-muted-foreground max-w-sm">يرجى البحث عن طالب وتحديده من القائمة الجانبية لعرض الشهادة التفصيلية الخاصة به.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      
        <div>
        {activeTab === "master" ? (
          <AdvancedPrintEngine
            isOpen={isPrintOpen}
            onClose={() => setIsPrintOpen(false)}
            title="كشف النتائج المجمع"
            subtitle={`العام الدراسي الحالي - ${getStageLabel(stage)}`}
            data={masterSheetData}
            templates={masterPrintTemplates}
          />
        ) : (
          <AdvancedPrintEngine
            isOpen={isPrintOpen}
            onClose={() => setIsPrintOpen(false)}
            title={`إشعار نتيجة`}
            data={reportCardData}
            templates={reportCardTemplates}
          />
        )}
        </div>
      </div>
    </AppShell>
  );
}
