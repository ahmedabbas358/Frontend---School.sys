import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore, ExamGrade } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage, isItemAllowedForGrade } from "@/lib/school-structure";
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
    activeStageScheduledExams,
    activeStageExamCategories,
    activeStageStudents,
    activeStageExamGrades,
    saveExamGrades
  } = useGlobalStore();

  const uniqueGrades = useMemo(() => getGradesForStage(stage), [stage]);

  const [filterGrade, setFilterGrade] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterExam, setFilterExam] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const [studentGrades, setStudentGrades] = useState<Record<string, Partial<ExamGrade>>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Filter derivations
  const sectionsForGrade = useMemo(() => (
    filterGrade ? activeStageSections.filter(section => section.stage === stage && section.grade === filterGrade) : []
  ), [activeStageSections, stage, filterGrade]);
  const selectedSection = useMemo(() => sectionsForGrade.find(section => section.id === filterSection), [sectionsForGrade, filterSection]);
  
  const subjectsForSection = useMemo(() => {
    if (!selectedSection) return [];
    return activeStageSubjects.filter(s => isItemAllowedForGrade(s, stage, selectedSection.grade));
  }, [activeStageSubjects, selectedSection, stage]);

  const examsForSubject = useMemo(() => {
    if (!filterSubject || !filterSection || !filterGrade) return [];
    return activeStageScheduledExams.filter(e => (
      e.stage === stage &&
      e.grade === filterGrade &&
      e.sectionId === filterSection &&
      e.subjectId === filterSubject
    ));
  }, [activeStageScheduledExams, filterSubject, filterSection, filterGrade, stage]);

  const selectedExam = useMemo(() => examsForSubject.find(e => e.id === filterExam), [examsForSubject, filterExam]);
  const studentsInSection = useMemo(() => activeStageStudents.filter(s => (
    s.stage === stage &&
    s.grade === filterGrade &&
    s.sectionId === filterSection
  )), [activeStageStudents, stage, filterGrade, filterSection]);

  const visibleStudents = useMemo(() => {
    const query = studentSearch.trim();
    if (!query) return studentsInSection;
    return studentsInSection.filter(student => (
      student.name.includes(query) ||
      student.nationalId.includes(query)
    ));
  }, [studentSearch, studentsInSection]);

  // Load existing grades when exam changes
  useEffect(() => {
    if (selectedExam && studentsInSection.length > 0) {
      const existingMap: Record<string, Partial<ExamGrade>> = {};
      studentsInSection.forEach(student => {
        const existing = activeStageExamGrades.find(g => g.examId === selectedExam.id && g.studentId === student.id);
        existingMap[student.id] = {
          mark: existing?.mark ?? 0,
          descriptiveGrade: existing?.descriptiveGrade || "",
          notes: existing?.notes || "",
        };
      });
      setStudentGrades(existingMap);
    } else {
      setStudentGrades({});
    }
  }, [selectedExam, studentsInSection, activeStageExamGrades]);

  // Reset downstream filters
  useEffect(() => { setFilterSection(""); setFilterSubject(""); setFilterExam(""); setStudentSearch(""); }, [filterGrade]);
  useEffect(() => { setFilterSubject(""); setFilterExam(""); }, [filterSection]);
  useEffect(() => { setFilterExam(""); }, [filterSubject]);

  const handleMarkChange = (studentId: string, mark: string) => {
    let numMark = Number(mark);
    if (selectedExam && numMark > selectedExam.totalMarks) {
      numMark = selectedExam.totalMarks;
    }
    if (numMark < 0) numMark = 0;
    
    setStudentGrades(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], mark: numMark }
    }));
  };

  const handleDescriptiveChange = (studentId: string, value: string) => {
    setStudentGrades(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], descriptiveGrade: value }
    }));
  };

  const handleNotesChange = (studentId: string, value: string) => {
    setStudentGrades(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes: value }
    }));
  };

  const handleSave = () => {
    if (!selectedExam) return;
    setIsSaving(true);
    
    const gradesToSave: Omit<ExamGrade, "id" | "enteredAt" | "lastModifiedAt">[] = studentsInSection.map(student => ({
      examId: selectedExam.id,
      studentId: student.id,
      subjectId: selectedExam.subjectId,
      classId: selectedExam.classId,
      sectionId: selectedExam.sectionId,
      grade: selectedExam.grade,
      stage: selectedExam.stage,
      mark: studentGrades[student.id]?.mark || 0,
      descriptiveGrade: studentGrades[student.id]?.descriptiveGrade,
      notes: studentGrades[student.id]?.notes,
      enteredBy: "Current User",
    }));

    setTimeout(() => {
      try {
        saveExamGrades(gradesToSave);
        toast.success("تم حفظ الدرجات بنجاح");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذر حفظ الدرجات بسبب عدم تطابق البيانات");
      } finally {
        setIsSaving(false);
      }
    }, 500); // Fake delay for UX
  };

  // Stats
  const stats = useMemo(() => {
    if (!selectedExam || studentsInSection.length === 0) return null;
    const marks = Object.values(studentGrades).map(g => g.mark || 0);
    const sum = marks.reduce((a,b) => a+b, 0);
    const avg = sum / marks.length;
    const max = Math.max(...marks);
    const min = Math.min(...marks);
    const passed = marks.filter(m => m >= (selectedExam.totalMarks / 2)).length;
    const entered = Object.values(studentGrades).filter(g => (g.mark || 0) > 0 || Boolean(g.descriptiveGrade)).length;
    
    return { avg, max, min, passed, total: marks.length, entered };
  }, [studentGrades, selectedExam, studentsInSection]);

  return (
    <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الاختبارات", to: "/exams" }, { label: "إدخال الدرجات" }]}>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
        <PageCard title="إدخال الدرجات والنتائج" description="يرجى تحديد الاختبار من القوائم التالية للبدء في الرصد">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-muted-foreground">المرحلة</label>
              <select value={stage} onChange={e => { setStage(e.target.value as any); setFilterGrade(""); setFilterSection(""); setFilterSubject(""); setFilterExam(""); setStudentSearch(""); }} className="w-full h-11 rounded-xl border border-border/50 bg-background px-4 font-bold shadow-sm focus:border-primary">
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-muted-foreground">الفصل</label>
              <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="w-full h-11 rounded-xl border border-border/50 bg-background px-4 font-bold shadow-sm focus:border-primary">
                <option value="">-- اختر الفصل --</option>
                {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-muted-foreground">الشعبة</label>
              <select disabled={!filterGrade} value={filterSection} onChange={e => setFilterSection(e.target.value)} className="w-full h-11 rounded-xl border border-border/50 bg-background px-4 font-bold shadow-sm focus:border-primary disabled:opacity-50">
                <option value="">-- اختر الشعبة --</option>
                {sectionsForGrade.map(s => <option key={s.id} value={s.id}>شعبة {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-muted-foreground">المادة</label>
              <select disabled={!filterSection} value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="w-full h-11 rounded-xl border border-border/50 bg-background px-4 font-bold shadow-sm focus:border-primary disabled:opacity-50">
                <option value="">-- اختر المادة --</option>
                {subjectsForSection.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-muted-foreground">الاختبار</label>
              <select disabled={!filterSubject} value={filterExam} onChange={e => setFilterExam(e.target.value)} className="w-full h-11 rounded-xl border border-border/50 bg-background px-4 font-bold shadow-sm focus:border-primary disabled:opacity-50">
                <option value="">-- اختر الاختبار --</option>
                {examsForSubject.map(e => {
                  const cat = activeStageExamCategories.find(c => c.id === e.categoryId);
                  return <option key={e.id} value={e.id}>{e.name} - {cat?.name || "يدوي"} - {e.date}</option>
                })}
              </select>
            </div>
          </div>
        </PageCard>

        {selectedExam && (
          <div className="space-y-6 slide-in-from-bottom-4 animate-in">
            <PageCard
              title={selectedExam.name}
              description={`${filterGrade} / شعبة ${selectedSection?.name || "-"} / ${activeStageSubjects.find(s => s.id === selectedExam.subjectId)?.name || ""}`}
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

            {/* Quick Stats */}
            {stats && selectedExam.gradingSystem !== 'descriptive' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm text-center">
                  <p className="text-sm text-muted-foreground font-bold mb-1">المتوسط</p>
                  <p className="text-xl font-black text-primary">{stats.avg.toFixed(1)} / {selectedExam.totalMarks}</p>
                </div>
                <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm text-center">
                  <p className="text-sm text-muted-foreground font-bold mb-1">أعلى درجة</p>
                  <p className="text-xl font-black text-success">{stats.max}</p>
                </div>
                <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm text-center">
                  <p className="text-sm text-muted-foreground font-bold mb-1">نسبة النجاح</p>
                  <p className="text-xl font-black text-warning">{Math.round((stats.passed/stats.total)*100)}%</p>
                </div>
              </div>
            )}

            {/* Grading Table */}
            <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="py-4 px-6 font-bold text-muted-foreground w-16 text-center">#</th>
                      <th className="py-4 px-6 font-bold text-muted-foreground">اسم الطالب</th>
                      
                      {selectedExam.gradingSystem !== 'descriptive' ? (
                        <>
                          <th className="py-4 px-6 font-bold text-muted-foreground w-48 text-center">الدرجة (من {selectedExam.totalMarks})</th>
                          <th className="py-4 px-6 font-bold text-muted-foreground w-32 text-center">الحالة</th>
                        </>
                      ) : (
                        <th className="py-4 px-6 font-bold text-muted-foreground w-64 text-center">التقييم الوصفي</th>
                      )}
                      
                      <th className="py-4 px-6 font-bold text-muted-foreground">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleStudents.map((student, idx) => {
                      const grade = studentGrades[student.id];
                      const mark = grade?.mark || 0;
                      const isPassing = mark >= (selectedExam.totalMarks / 2);
                      const isFull = mark === selectedExam.totalMarks;

                      return (
                        <tr key={student.id} className="border-b border-border/50 last:border-0 hover:bg-accent/10 transition-colors">
                          <td className="py-3 px-6 text-center text-muted-foreground">{idx + 1}</td>
                          <td className="py-3 px-6 font-bold">{student.name}</td>
                          
                          {selectedExam.gradingSystem !== 'descriptive' ? (
                            <>
                              <td className="py-3 px-6">
                                <div className="relative flex items-center justify-center">
                                  <input 
                                    type="number" 
                                    min="0" 
                                    max={selectedExam.totalMarks}
                                    value={mark}
                                    onChange={e => handleMarkChange(student.id, e.target.value)}
                                    className={`w-24 h-12 text-center font-black text-lg rounded-xl border ${isFull ? 'border-success text-success bg-success/5' : isPassing ? 'border-border/50 focus:border-primary' : 'border-danger/50 text-danger bg-danger/5'} focus:ring-1 focus:ring-primary`}
                                    dir="ltr"
                                  />
                                </div>
                              </td>
                              <td className="py-3 px-6 text-center">
                                {isFull ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-success/10 text-success px-3 py-1.5 rounded-lg"><CheckCircle2 className="w-4 h-4"/> ممتاز</span>
                                ) : isPassing ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg">ناجح</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-danger/10 text-danger px-3 py-1.5 rounded-lg"><AlertCircle className="w-4 h-4"/> دون المستوى</span>
                                )}
                              </td>
                            </>
                          ) : (
                            <td className="py-3 px-6">
                              <select 
                                value={grade?.descriptiveGrade || ""}
                                onChange={e => handleDescriptiveChange(student.id, e.target.value)}
                                className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold text-center focus:border-primary focus:ring-1 focus:ring-primary"
                              >
                                <option value="">-- اختر التقييم --</option>
                                <option value="أتقن المعيار">أتقن المعيار (ممتاز)</option>
                                <option value="أتقن إلى حد ما">أتقن إلى حد ما (جيد جداً)</option>
                                <option value="في طريقه للاتقان">في طريقه للاتقان (جيد)</option>
                                <option value="لم يتقن المعيار">لم يتقن المعيار (يحتاج دعم)</option>
                              </select>
                            </td>
                          )}

                          <td className="py-3 px-6">
                            <input 
                              type="text" 
                              value={grade?.notes || ""}
                              onChange={e => handleNotesChange(student.id, e.target.value)}
                              placeholder="ملاحظات اختيارية..."
                              className="w-full h-11 rounded-xl border border-border/50 bg-transparent px-4 text-sm focus:border-primary focus:bg-background transition-colors"
                            />
                          </td>
                        </tr>
                      );
                    })}
                    {visibleStudents.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground font-bold">لا يوجد طلاب مطابقون في هذه الشعبة.</td>
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
