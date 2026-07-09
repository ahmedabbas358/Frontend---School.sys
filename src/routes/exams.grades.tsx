import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore, ExamResult, ExamSubject, Exam } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { Search, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/exams/grades")({
  component: ExamGradesPage,
  head: () => ({ meta: [{ title: "إدخال الدرجات" }] })
});

function ExamGradesPage() {
  const { stage, setStage, stages } = useStage();
  const { 
    activeStageSections, 
    activeStageSubjects, 
    activeStageExams,
    activeStageExamSubjects,
    activeStageStudents,
    allExamResults,
    allStudentEnrollments,
    currentAcademicYearId,
    saveExamResults
  } = useGlobalStore();

  const [filterExamId, setFilterExamId] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterSectionId, setFilterSectionId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const [studentResults, setStudentResults] = useState<Record<string, Partial<ExamResult>>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Derivations
  const selectedExam = useMemo(() => activeStageExams.find(e => e.id === filterExamId), [activeStageExams, filterExamId]);
  
  const applicableExamSubjects = useMemo(() => {
    if (!selectedExam) return [];
    return activeStageExamSubjects.filter(es => es.examId === selectedExam.id && es.stage === stage);
  }, [activeStageExamSubjects, selectedExam, stage]);

  const selectedExamSubject = useMemo(() => applicableExamSubjects.find(es => es.id === filterSubjectId), [applicableExamSubjects, filterSubjectId]);

  const applicableSections = useMemo(() => {
    if (!selectedExamSubject) return [];
    return activeStageSections.filter(s => s.stage === stage && s.grade === selectedExamSubject.grade);
  }, [activeStageSections, stage, selectedExamSubject]);

  const selectedSection = useMemo(() => applicableSections.find(s => s.id === filterSectionId), [applicableSections, filterSectionId]);

  const studentsInSection = useMemo(() => {
    if (!selectedSection) return [];
    // get enrollments
    const enrollments = allStudentEnrollments.filter(e => e.academicYearId === currentAcademicYearId && e.sectionId === selectedSection.id);
    return enrollments.map(enr => {
      const student = activeStageStudents.find(s => s.id === enr.studentId);
      return student ? { student, enrollment: enr } : null;
    }).filter(Boolean) as {student: any, enrollment: any}[];
  }, [selectedSection, allStudentEnrollments, currentAcademicYearId, activeStageStudents]);

  const visibleStudents = useMemo(() => {
    const query = studentSearch.trim();
    if (!query) return studentsInSection;
    return studentsInSection.filter(s => (
      s.student.name.includes(query) ||
      s.student.nationalId.includes(query)
    ));
  }, [studentSearch, studentsInSection]);

  // Load existing results when selected section/subject changes
  useEffect(() => {
    if (selectedExamSubject && studentsInSection.length > 0) {
      const existingMap: Record<string, Partial<ExamResult>> = {};
      studentsInSection.forEach(item => {
        const existing = allExamResults.find(r => r.examSubjectId === selectedExamSubject.id && r.studentEnrollmentId === item.enrollment.id);
        existingMap[item.enrollment.id] = {
          mark: existing?.mark ?? 0,
          notes: existing?.notes || "",
          status: existing?.status || "draft"
        };
      });
      setStudentResults(existingMap);
    } else {
      setStudentResults({});
    }
  }, [selectedExamSubject, studentsInSection, allExamResults]);

  // Reset downstream filters
  useEffect(() => { setFilterSubjectId(""); setFilterSectionId(""); setStudentSearch(""); }, [filterExamId]);
  useEffect(() => { setFilterSectionId(""); }, [filterSubjectId]);

  const handleMarkChange = (enrollmentId: string, markStr: string) => {
    let numMark = Number(markStr);
    if (selectedExamSubject && numMark > selectedExamSubject.maxScore) {
      numMark = selectedExamSubject.maxScore;
    }
    if (numMark < 0) numMark = 0;
    
    setStudentResults(prev => ({
      ...prev,
      [enrollmentId]: { ...prev[enrollmentId], mark: numMark }
    }));
  };

  const handleNotesChange = (enrollmentId: string, value: string) => {
    setStudentResults(prev => ({
      ...prev,
      [enrollmentId]: { ...prev[enrollmentId], notes: value }
    }));
  };

  const handleSave = () => {
    if (!selectedExamSubject) return;
    setIsSaving(true);
    
    const resultsToSave: Omit<ExamResult, "id">[] = studentsInSection.map(item => ({
      examSubjectId: selectedExamSubject.id,
      studentEnrollmentId: item.enrollment.id,
      mark: studentResults[item.enrollment.id]?.mark || 0,
      notes: studentResults[item.enrollment.id]?.notes,
      status: "submitted",
    }));

    setTimeout(() => {
      try {
        saveExamResults(resultsToSave);
        toast.success("تم حفظ الدرجات بنجاح");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذر حفظ الدرجات");
      } finally {
        setIsSaving(false);
      }
    }, 500); // Fake delay for UX
  };

  // Stats
  const stats = useMemo(() => {
    if (!selectedExamSubject || studentsInSection.length === 0) return null;
    const marks = Object.values(studentResults).map(r => r.mark || 0);
    const sum = marks.reduce((a,b) => a+b, 0);
    const avg = sum / (marks.length || 1);
    const max = Math.max(...marks, 0);
    const min = Math.min(...marks, selectedExamSubject.maxScore);
    const passed = marks.filter(m => m >= selectedExamSubject.passScore).length;
    const entered = Object.values(studentResults).filter(r => (r.mark || 0) > 0).length;
    
    return { avg, max, min, passed, total: marks.length, entered };
  }, [studentResults, selectedExamSubject, studentsInSection]);

  return (
    <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الاختبارات", to: "/exams" }, { label: "إدخال الدرجات" }]}>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
        <PageCard title="إدخال الدرجات والنتائج" description="يرجى تحديد الاختبار والمادة والشعبة للبدء في الرصد">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-muted-foreground">المرحلة</label>
              <select value={stage} onChange={e => { setStage(e.target.value as any); setFilterExamId(""); }} className="w-full h-11 rounded-xl border border-border/50 bg-background px-4 font-bold shadow-sm focus:border-primary">
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-muted-foreground">الاختبار</label>
              <select value={filterExamId} onChange={e => setFilterExamId(e.target.value)} className="w-full h-11 rounded-xl border border-border/50 bg-background px-4 font-bold shadow-sm focus:border-primary">
                <option value="">-- اختر الاختبار --</option>
                {activeStageExams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-muted-foreground">مادة الاختبار</label>
              <select disabled={!filterExamId} value={filterSubjectId} onChange={e => setFilterSubjectId(e.target.value)} className="w-full h-11 rounded-xl border border-border/50 bg-background px-4 font-bold shadow-sm focus:border-primary disabled:opacity-50">
                <option value="">-- اختر المادة --</option>
                {applicableExamSubjects.map(es => {
                  const subjectName = activeStageSubjects.find(s => s.id === es.subjectId)?.name || es.subjectId;
                  return <option key={es.id} value={es.id}>{subjectName} - {es.grade}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-muted-foreground">الشعبة</label>
              <select disabled={!filterSubjectId} value={filterSectionId} onChange={e => setFilterSectionId(e.target.value)} className="w-full h-11 rounded-xl border border-border/50 bg-background px-4 font-bold shadow-sm focus:border-primary disabled:opacity-50">
                <option value="">-- اختر الشعبة --</option>
                {applicableSections.map(s => <option key={s.id} value={s.id}>شعبة {s.name}</option>)}
              </select>
            </div>
          </div>
        </PageCard>

        {selectedExamSubject && selectedSection && (
          <div className="space-y-6 slide-in-from-bottom-4 animate-in">
            <PageCard
              title={activeStageSubjects.find(s => s.id === selectedExamSubject.subjectId)?.name || "المادة"}
              description={`${selectedExamSubject.grade} / شعبة ${selectedSection.name}`}
              actions={
                <div className="flex items-center gap-3">
                  {stats && <span className="rounded-xl bg-accent px-3 py-2 text-sm font-bold text-muted-foreground">تم الرصد: {stats.entered}/{stats.total}</span>}
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 font-bold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-70"
                  >
                    {isSaving ? <span className="animate-spin text-xl">↻</span> : <Save className="w-5 h-5"/>}
                    {isSaving ? "جاري الحفظ..." : "حفظ الكشف"}
                  </button>
                </div>
              }
            >
              <div className="relative max-w-md">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  placeholder="بحث سريع باسم الطالب أو الرقم الوطني..."
                  className="h-11 w-full rounded-xl border border-border/50 bg-background pr-10 pl-4 text-sm font-bold shadow-sm focus:border-primary"
                />
              </div>
            </PageCard>

            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm text-center">
                  <p className="text-sm text-muted-foreground font-bold mb-1">المتوسط</p>
                  <p className="text-xl font-black text-primary">{stats.avg.toFixed(1)} / {selectedExamSubject.maxScore}</p>
                </div>
                <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm text-center">
                  <p className="text-sm text-muted-foreground font-bold mb-1">الأعلى</p>
                  <p className="text-xl font-black text-success">{stats.max}</p>
                </div>
                <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm text-center">
                  <p className="text-sm text-muted-foreground font-bold mb-1">الأدنى</p>
                  <p className="text-xl font-black text-danger">{stats.min === selectedExamSubject.maxScore ? 0 : stats.min}</p>
                </div>
                <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm text-center">
                  <p className="text-sm text-muted-foreground font-bold mb-1">نسبة النجاح</p>
                  <p className="text-xl font-black text-warning">
                    {stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0}%
                  </p>
                </div>
              </div>
            )}

            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-accent/50 text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="p-4 font-bold w-16 text-center">#</th>
                      <th className="p-4 font-bold">اسم الطالب</th>
                      <th className="p-4 font-bold">الرقم الوطني</th>
                      <th className="p-4 font-bold w-48 text-center">الدرجة (من {selectedExamSubject.maxScore})</th>
                      <th className="p-4 font-bold">ملاحظات (اختياري)</th>
                      <th className="p-4 font-bold w-24 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {visibleStudents.map((item, idx) => {
                      const studentId = item.enrollment.id;
                      const mark = studentResults[studentId]?.mark || 0;
                      const isPassing = mark >= selectedExamSubject.passScore;
                      return (
                        <tr key={studentId} className="hover:bg-accent/20 transition-colors">
                          <td className="p-4 font-bold text-center text-muted-foreground">{idx + 1}</td>
                          <td className="p-4 font-black">{item.student.name}</td>
                          <td className="p-4 font-bold text-muted-foreground tabular-nums">{item.student.nationalId}</td>
                          <td className="p-4">
                            <input 
                              type="number"
                              min="0"
                              max={selectedExamSubject.maxScore}
                              value={studentResults[studentId]?.mark || ""}
                              onChange={e => handleMarkChange(studentId, e.target.value)}
                              className={`w-full h-11 text-center font-black text-lg rounded-xl border ${mark > 0 ? (isPassing ? 'border-success/50 text-success bg-success/5 focus:border-success focus:ring-success' : 'border-danger/50 text-danger bg-danger/5 focus:border-danger focus:ring-danger') : 'border-border/50 bg-background focus:border-primary focus:ring-primary'} shadow-sm focus:outline-none focus:ring-1`}
                              dir="ltr"
                            />
                          </td>
                          <td className="p-4">
                            <input
                              type="text"
                              value={studentResults[studentId]?.notes || ""}
                              onChange={e => handleNotesChange(studentId, e.target.value)}
                              placeholder="أضف ملاحظة..."
                              className="w-full h-11 rounded-xl border border-border/50 bg-background px-4 text-sm font-bold shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </td>
                          <td className="p-4 text-center">
                            {mark > 0 ? (
                              <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {visibleStudents.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-muted-foreground font-bold">
                          لا يوجد طلاب لعرضهم
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
