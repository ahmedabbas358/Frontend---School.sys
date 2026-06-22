import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { Save, AlertTriangle, BookOpen, Clock, Users, FileWarning, Medal, Target, TrendingUp, Search, Printer, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/academic/grades")({
  component: GradesPage,
  head: () => ({ meta: [{ title: "رصد النتائج" }] }),
});

function GradesPage() {
  const { stage, getStageLabel } = useStage();
  const { 
    activeStageSections, 
    activeStageSubjects, 
    activeStageExams, 
    activeStageExamTypes,
    activeStageStudents,
    activeStageExamMarks,
    examGradingMode,
    saveExamMarks 
  } = useGlobalStore();

  const [sectionId, setSectionId] = useState(activeStageSections[0]?.id || "");
  const selectedSection = useMemo(() => activeStageSections.find(s => s.id === sectionId), [activeStageSections, sectionId]);
  
  // Get exams available for this section specifically
  const availableExams = useMemo(() => {
    if (!selectedSection) return [];
    return activeStageExams.filter(e => {
      if (e.sectionId && e.sectionId !== selectedSection.id) return false;
      if (e.grade && e.grade !== selectedSection.grade) return false;
      return true;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeStageExams, selectedSection]);

  const [examId, setExamId] = useState(availableExams[0]?.id || "");
  const selectedExam = useMemo(() => availableExams.find(e => e.id === examId), [availableExams, examId]);
  
  const selectedSubject = useMemo(() => activeStageSubjects.find(s => s.id === selectedExam?.subjectId), [activeStageSubjects, selectedExam]);
  const selectedExamType = useMemo(() => activeStageExamTypes.find(t => t.id === selectedExam?.typeId), [activeStageExamTypes, selectedExam]);

  // Reset exam selection if section changes and exam is no longer valid
  useEffect(() => {
    if (availableExams.length > 0 && !availableExams.find(e => e.id === examId)) {
      setExamId(availableExams[0].id);
    } else if (availableExams.length === 0) {
      setExamId("");
    }
  }, [availableExams, examId]);

  const [searchQ, setSearchQ] = useState("");
  const [sortBy, setSortBy] = useState("name");

  // Get students for this section
  const baseList = useMemo(() => {
    if (!selectedSection) return [];
    // Ideally students should be directly assigned to sections. 
    // The current mock data often maps student.grade to section.grade for simplicity.
    return activeStageStudents.filter((s) => s.grade === selectedSection.grade);
  }, [sectionId, selectedSection, activeStageStudents]);

  // Local state for marks being edited
  const [marks, setMarks] = useState<Record<string, { mark: string, notes: string }>>({});

  const list = useMemo(() => {
    let result = [...baseList];
    if (searchQ) {
      const q = searchQ.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.nationalId.includes(q)
      );
    }
    
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      
      const markA = marks[a.id]?.mark ? Number(marks[a.id].mark) : -1;
      const markB = marks[b.id]?.mark ? Number(marks[b.id].mark) : -1;
      
      if (sortBy === "high") return markB - markA;
      if (sortBy === "low") return markA - markB;
      return 0;
    });

    return result;
  }, [baseList, searchQ, sortBy, marks]);

  // Populate local state from global state whenever exam changes
  useEffect(() => {
    if (!selectedExam) return;
    const newMarks: Record<string, { mark: string, notes: string }> = {};
    for (const student of baseList) {
      const existingMark = activeStageExamMarks.find(m => m.examId === selectedExam.id && m.studentId === student.id);
      if (existingMark) {
        newMarks[student.id] = { mark: existingMark.mark.toString(), notes: existingMark.notes || "" };
      } else {
        newMarks[student.id] = { mark: "", notes: "" };
      }
    }
    setMarks(newMarks);
  }, [examId, baseList, activeStageExamMarks, selectedExam]);

  const handleMarkChange = (studentId: string, val: string) => {
    if (!selectedExam) return;
    const num = Number(val);
    if (val !== "" && (isNaN(num) || num < 0 || num > selectedExam.totalMarks)) {
      toast.error(`الدرجة يجب أن تكون بين 0 و ${selectedExam.totalMarks}`);
      return;
    }
    setMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], mark: val } }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], notes } }));
  };

  const handleSave = () => {
    if (!selectedExam || !selectedSubject) return;
    
    const marksToSave = Object.entries(marks)
      .filter(([_, data]) => data.mark !== "")
      .map(([studentId, data]) => ({
        examId: selectedExam.id,
        studentId,
        subjectId: selectedSubject.id,
        mark: Number(data.mark),
        notes: data.notes,
        stage
      }));

    if (marksToSave.length === 0) {
      toast.error("لم تقم برصد أي درجة للحفظ!");
      return;
    }

    saveExamMarks(marksToSave);
    toast.success("تم حفظ النتائج والدرجات في قاعدة البيانات بنجاح!");
  };

  // Missing prerequisites checking
  if (activeStageSections.length === 0) {
    return (
      <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الاختبارات", to: "/exams" }, { label: "رصد النتائج" }]}>
        <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-500">
          <div className="rounded-full bg-warning/10 p-6 mb-6">
            <AlertTriangle className="h-16 w-16 text-warning" />
          </div>
          <h2 className="text-2xl font-bold mb-3">البيانات غير مهيأة</h2>
          <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
            يجب أن يكون لديك على الأقل شعبة واحدة في هذه المرحلة للبدء برصد الدرجات.
          </p>
          <Link to="/academic/classes" className="rounded-xl bg-card border border-border/50 px-6 py-2.5 font-bold hover:bg-accent transition-colors shadow-sm">
            إدارة الفصول والشعب
          </Link>
        </div>
      </AppShell>
    );
  }

  const enteredMarks = Object.values(marks).filter(m => m.mark !== "").map(m => Number(m.mark));
  const avg = enteredMarks.length > 0 ? (enteredMarks.reduce((a, b) => a + b, 0) / enteredMarks.length).toFixed(1) : "0";
  const maxEntered = enteredMarks.length > 0 ? Math.max(...enteredMarks) : 0;
  
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const gradingSymbol = examGradingMode === "percentage" ? "%" : "درجة";

  const printTemplates: PrintTemplate[] = [
    {
      id: "grades-list",
      name: "كشف النتائج النهائي",
      category: "الامتحانات والدرجات",
      type: "table",
      columns: [
        { key: "nationalId", label: "الرقم الوطني" },
        { key: "name", label: "اسم الطالب" },
        { key: "mark", label: "الدرجة", render: (row) => marks[row.id]?.mark ? `${marks[row.id].mark} ${gradingSymbol}` : "لم يُرصد" },
        { key: "status", label: "النتيجة", render: (row) => {
          const m = Number(marks[row.id]?.mark);
          if (marks[row.id]?.mark === "") return "-";
          return m >= (selectedExam?.totalMarks || 100) / 2 ? "ناجح" : "دون المستوى";
        }},
        { key: "notes", label: "ملاحظات المعلم", render: (row) => marks[row.id]?.notes || "" }
      ]
    },
    {
      id: "grades-certificate",
      name: "شهادة تفوق للطلاب الناجحين",
      category: "الامتحانات والدرجات",
      type: "certificate",
      customControls: [
        { key: "certificateTitle", label: "عنوان الشهادة", type: "text", defaultValue: "شهادة تفوق علمي" },
        { key: "certificateReason", label: "سبب التكريم", type: "text", defaultValue: `لاجتيازه ${selectedExamType?.name || 'الاختبار'} لمادة ${selectedSubject?.name} بتفوق واقتدار.` }
      ]
    }
  ];

  const printData = list.filter(s => {
    if (selectedExam && marks[s.id]?.mark !== "") {
      return true;
    }
    return true;
  });

  return (
    <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الاختبارات", to: "/exams" }, { label: "رصد النتائج" }]}>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
        
        {/* Control Panel */}
        <PageCard title="لوحة رصد النتائج" description={`حدد الشعبة والاختبار المجدول للبدء في الرصد - ${getStageLabel(stage)}`}>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Users className="h-4 w-4"/> اختيار الشعبة المستهدفة
              </label>
              <select 
                value={sectionId} 
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold shadow-sm cursor-pointer"
              >
                {activeStageSections.map((s) => <option key={s.id} value={s.id}>{s.grade} - {s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4"/> الاختبار المجدول للشعبة
              </label>
              <select 
                value={examId} 
                onChange={(e) => setExamId(e.target.value)}
                className="w-full rounded-xl border border-border/50 bg-primary/5 px-4 py-3 text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold shadow-sm cursor-pointer"
              >
                {availableExams.length === 0 && <option value="">لا توجد اختبارات مجدولة لهذه الشعبة</option>}
                {availableExams.map((e) => {
                  const sType = activeStageExamTypes.find(t => t.id === e.typeId);
                  const sSubj = activeStageSubjects.find(s => s.id === e.subjectId);
                  return (
                    <option key={e.id} value={e.id}>
                      {sSubj?.name} - {sType?.name} ({e.term}) - من {e.totalMarks} {gradingSymbol}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>
        </PageCard>

        {selectedExam && baseList.length > 0 && (
          <>
            {/* Quick Stats */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm glass">
                <div className="flex items-center gap-3 mb-2 text-muted-foreground">
                  <Target className="h-5 w-5" /> التقييم الكلي
                </div>
                <div className="text-3xl font-extrabold tabular-nums flex items-baseline gap-1">
                  {selectedExam.totalMarks}
                  <span className="text-sm text-muted-foreground">{gradingSymbol}</span>
                </div>
              </div>
              <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm glass">
                <div className="flex items-center gap-3 mb-2 text-primary">
                  <Medal className="h-5 w-5" /> أعلى نتيجة مرصودة
                </div>
                <div className="text-3xl font-extrabold tabular-nums text-primary flex items-baseline gap-1">
                  {maxEntered}
                  <span className="text-sm opacity-50">{gradingSymbol}</span>
                </div>
              </div>
              <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm glass">
                <div className="flex items-center gap-3 mb-2 text-success">
                  <TrendingUp className="h-5 w-5" /> متوسط أداء الشعبة
                </div>
                <div className="text-3xl font-extrabold tabular-nums text-success flex items-baseline gap-1">
                  {avg}
                  <span className="text-sm opacity-50">{gradingSymbol}</span>
                </div>
              </div>
              <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm glass">
                <div className="flex items-center gap-3 mb-2 text-info">
                  <BookOpen className="h-5 w-5" /> نسبة الإنجاز بالرصد
                </div>
                <div className="text-3xl font-extrabold tabular-nums text-info flex items-baseline gap-1">
                  {Math.round((enteredMarks.length / baseList.length) * 100)}%
                </div>
              </div>
            </div>

            {/* Filter and Sort Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="البحث باسم الطالب أو الرقم الوطني..."
                  className="h-12 w-full rounded-2xl border border-border/50 bg-card pr-11 pl-4 text-sm font-bold shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-muted-foreground">فرز حسب:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-12 rounded-2xl border border-border/50 bg-card px-4 text-sm font-bold shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  <option value="name">الاسم أبجدياً</option>
                  <option value="high">الأعلى درجة</option>
                  <option value="low">الأقل درجة</option>
                </select>
              </div>
            </div>

            {/* Entry Table */}
            <PageCard
              title={`رصد الدرجات: ${selectedExamType?.name || ""} لمادة ${selectedSubject?.name || ""}`}
              description={`الدرجة القصوى: ${selectedExam.totalMarks} ${gradingSymbol} | تاريخ الاختبار: ${selectedExam.date}`}
              actions={
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPrintOpen(true)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-4 text-base font-bold text-accent-foreground hover:bg-accent/80 transition-all shadow-sm"
                  >
                    <Printer className="h-5 w-5" /> طباعة الكشف
                  </button>
                  <button
                    onClick={handleSave}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-8 text-base font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 hover:scale-105"
                  >
                    <Save className="h-5 w-5" /> اعتماد النتائج
                  </button>
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="text-xs text-muted-foreground bg-accent/50">
                    <tr>
                      <th className="px-4 py-3 rounded-tr-xl">اسم الطالب / الرقم الوطني</th>
                      <th className="px-4 py-3 w-56 text-center">النتيجة ({gradingSymbol})</th>
                      <th className="px-4 py-3 w-64">ملاحظات المعلم (اختياري)</th>
                      <th className="px-4 py-3 rounded-tl-xl text-center">حالة الطالب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {list.map(s => {
                      const data = marks[s.id] || { mark: "", notes: "" };
                      const numMark = Number(data.mark);
                      const isEntered = data.mark !== "";
                      const isPassing = isEntered && numMark >= (selectedExam.totalMarks / 2);
                      const isFullMark = isEntered && numMark === selectedExam.totalMarks;
                      const isFailing = isEntered && numMark < (selectedExam.totalMarks / 2);

                      return (
                        <tr key={s.id} className="hover:bg-accent/20 transition-colors group">
                          <td className="px-4 py-4">
                            <div className="font-bold text-base">{s.name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{s.nationalId}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="relative flex items-center justify-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max={selectedExam.totalMarks}
                                value={data.mark}
                                onChange={(e) => handleMarkChange(s.id, e.target.value)}
                                className={`w-28 text-center font-bold text-lg rounded-xl border bg-background px-3 py-2 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                                  isFailing 
                                    ? "border-danger text-danger focus:ring-danger/20" 
                                    : isFullMark 
                                      ? "border-success text-success focus:ring-success/20 bg-success/5"
                                      : "border-border/50 focus:border-primary focus:ring-primary/20"
                                }`}
                                placeholder="--"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="text"
                              value={data.notes}
                              onChange={(e) => handleNotesChange(s.id, e.target.value)}
                              placeholder="أضف ملاحظة (مثال: تأخر عن الوقت)..."
                              className="w-full rounded-xl border border-transparent bg-accent/30 px-3 py-2.5 text-sm focus:border-border/50 focus:bg-background focus:outline-none transition-colors"
                            />
                          </td>
                          <td className="px-4 py-4 text-center">
                            {!isEntered ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                                <Clock className="h-3 w-3" /> لم يُرصد
                              </span>
                            ) : isFailing ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-bold text-danger animate-pulse">
                                <FileWarning className="h-3 w-3" /> دون المستوى
                              </span>
                            ) : isFullMark ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                                <Medal className="h-3 w-3" /> ممتاز
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                                اجتاز
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </PageCard>
          </>
        )}

        {selectedExam && baseList.length === 0 && (
          <div className="py-16 text-center bg-card rounded-3xl border border-border/50 shadow-sm">
            <Users className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold mb-2">الشعبة فارغة!</h3>
            <p className="text-muted-foreground">لا يوجد طلاب مسجلين في هذه الشعبة لرصد درجاتهم.</p>
          </div>
        )}

        {/* Selected Section but No Exams */}
        {!selectedExam && selectedSection && (
          <div className="py-16 text-center bg-card rounded-3xl border border-border/50 shadow-sm mt-4">
            <CalendarDays className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold mb-2">لا توجد اختبارات مجدولة</h3>
            <p className="text-muted-foreground mb-6">لم يتم جدولة أي اختبارات لطلاب هذه الشعبة / الصف.</p>
            <Link to="/exams" className="rounded-xl bg-primary px-6 py-2.5 font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
              الذهاب لجدولة اختبار جديد
            </Link>
          </div>
        )}

      </div>
      
      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title={`كشف النتائج: ${selectedExamType?.name || ""} لمادة ${selectedSubject?.name || ""}`}
        subtitle={`الشعبة: ${selectedSection?.grade} - ${selectedSection?.name} | تاريخ الاختبار: ${selectedExam?.date || ""}`}
        data={printData}
        templates={printTemplates}
      />
    </AppShell>
  );
}
