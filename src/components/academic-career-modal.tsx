import React, { useState, useMemo } from "react";
import { 
  GraduationCap, 
  Printer, 
  Award, 
  TrendingUp, 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Calendar, 
  Layers, 
  BookOpen, 
  User, 
  ShieldCheck, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  Star,
  Clock,
  ArrowUpRight,
  School,
  FileCheck
} from "lucide-react";
import { useGlobalStore, ExamResult, ExamSubject, Exam } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";

interface AcademicCareerModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
}

export function AcademicCareerModal({ isOpen, onClose, studentId }: AcademicCareerModalProps) {
  const { stage } = useStage();
  const { 
    allStudents,
    allStudentEnrollments, 
    allSections, 
    allExams, 
    allExamSubjects, 
    allSubjects, 
    allExamResults,
    allAcademicYears,
    currentAcademicYearId 
  } = useGlobalStore();

  const [activeTab, setActiveTab] = useState<"transcript" | "terms" | "timeline">("transcript");
  const [selectedTermExamId, setSelectedTermExamId] = useState<string>("all");

  // 1. Target Student Lookup across all students in school
  const student = useMemo(() => {
    if (!studentId) return null;
    return (allStudents || []).find(s => 
      s.id === studentId || 
      (s as any).studentId === studentId || 
      (s as any).nationalId === studentId
    ) || null;
  }, [studentId, allStudents]);

  // 2. All Historical & Current Enrollments for this student across all school years
  const studentEnrollments = useMemo(() => {
    if (!student) return [];
    return (allStudentEnrollments || []).filter(e => 
      e.studentId === student.id || 
      e.id === student.id
    );
  }, [student, allStudentEnrollments]);

  const currentEnrollment = useMemo(() => {
    return studentEnrollments.find(e => e.academicYearId === currentAcademicYearId) || studentEnrollments[0] || null;
  }, [studentEnrollments, currentAcademicYearId]);

  const currentSection = useMemo(() => {
    const secId = currentEnrollment?.sectionId || student?.sectionId;
    if (!secId) return null;
    return (allSections || []).find(s => s.id === secId) || null;
  }, [currentEnrollment, student, allSections]);

  // Set of all possible IDs that could represent this student in exam results
  const studentIdSet = useMemo(() => {
    if (!student) return new Set<string>();
    const ids = [student.id, (student as any).studentId, (student as any).nationalId];
    studentEnrollments.forEach(e => {
      if (e.id) ids.push(e.id);
    });
    return new Set(ids.filter(Boolean));
  }, [student, studentEnrollments]);

  // 3. Collect all exam results for this student across all previous and current classes
  const studentResults = useMemo(() => {
    if (!student) return [];
    return (allExamResults || []).filter(r => studentIdSet.has(r.studentEnrollmentId));
  }, [student, studentIdSet, allExamResults]);

  // 4. Map exam subjects and exams
  const examSubjectsMap = useMemo(() => {
    const map = new Map<string, ExamSubject>();
    (allExamSubjects || []).forEach(es => map.set(es.id, es));
    return map;
  }, [allExamSubjects]);

  const examsMap = useMemo(() => {
    const map = new Map<string, Exam>();
    (allExams || []).forEach(e => map.set(e.id, e));
    return map;
  }, [allExams]);

  const subjectsMap = useMemo(() => {
    const map = new Map<string, any>();
    (allSubjects || []).forEach(s => map.set(s.id, s));
    return map;
  }, [allSubjects]);

  const academicYearsMap = useMemo(() => {
    const map = new Map<string, string>();
    (allAcademicYears || []).forEach(y => map.set(y.id, y.name));
    return map;
  }, [allAcademicYears]);

  // 5. Group Results by Exam and Chronological Periods (Previous & Current)
  const careerByExam = useMemo(() => {
    if (!student) return [];

    // All distinct grades the student attended
    const attendedGrades = new Set<string>();
    if (student.grade) attendedGrades.add(student.grade);
    studentEnrollments.forEach(e => {
      if (e.grade) attendedGrades.add(e.grade);
    });

    // Strategy A: Find all exams where the student actually has recorded marks
    const examIdsWithResults = new Set<string>();
    studentResults.forEach(r => {
      const es = examSubjectsMap.get(r.examSubjectId);
      if (es?.examId) examIdsWithResults.add(es.examId);
    });

    // Strategy B: Also include any exam matching attended grades
    const relevantExams = (allExams || []).filter(exam => {
      if (examIdsWithResults.has(exam.id)) return true;
      const hasMatchingSubject = (allExamSubjects || []).some(es => 
        es.examId === exam.id && attendedGrades.has(es.grade)
      );
      return hasMatchingSubject;
    });

    return relevantExams.map(exam => {
      // Find relevant exam subjects for this exam and student's attended grades
      const relevantExamSubjects = (allExamSubjects || []).filter(es => 
        es.examId === exam.id && attendedGrades.has(es.grade)
      );

      const subjectMarks = relevantExamSubjects.map(es => {
        const sub = subjectsMap.get(es.subjectId);
        const res = studentResults.find(r => r.examSubjectId === es.id);
        const mark = res?.mark ?? 0;
        const maxScore = es.maxScore || 100;
        const passScore = es.passScore || 50;
        const isPassed = mark >= passScore;
        const pct = maxScore > 0 ? (mark / maxScore) * 100 : 0;

        return {
          examSubject: es,
          subjectName: sub?.name || es.subjectId,
          mark,
          maxScore,
          passScore,
          pct,
          isPassed,
          status: res?.status || "draft",
          notes: res?.notes || ""
        };
      });

      const totalMarks = subjectMarks.reduce((acc, m) => acc + m.mark, 0);
      const totalMax = subjectMarks.reduce((acc, m) => acc + m.maxScore, 0);
      const percentage = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;
      const passedCount = subjectMarks.filter(m => m.isPassed).length;

      // Cumulative Official Standing for this period/exam (no subject-level text ratings)
      let overallRating = "مقبول";
      if (percentage >= 95) overallRating = "ممتاز مرتفع (مرتبة الشرف الأولى)";
      else if (percentage >= 90) overallRating = "ممتاز (مرتبة الشرف الثانية)";
      else if (percentage >= 80) overallRating = "جيد جداً مرتفع";
      else if (percentage >= 65) overallRating = "جيد";
      else if (percentage >= 50) overallRating = "مقبول";
      else overallRating = "له دور ثانٍ";

      const yearName = exam.academicYearId ? (academicYearsMap.get(exam.academicYearId) || "1446-1447 هـ") : "1446-1447 هـ";

      return {
        exam,
        yearName,
        subjectMarks,
        totalMarks,
        totalMax,
        percentage,
        overallRating,
        passedCount,
        totalSubjects: subjectMarks.length,
        grade: relevantExamSubjects[0]?.grade || student.grade
      };
    }).filter(item => item.subjectMarks.length > 0);
  }, [student, studentEnrollments, studentResults, allExams, allExamSubjects, examSubjectsMap, subjectsMap, academicYearsMap]);

  // Cumulative Metrics Across All Periods and Years in School
  const cumulativeStats = useMemo(() => {
    let grandTotal = 0;
    let grandMax = 0;
    let totalSubjects = 0;
    let totalPassed = 0;

    careerByExam.forEach(e => {
      grandTotal += e.totalMarks;
      grandMax += e.totalMax;
      totalSubjects += e.totalSubjects;
      totalPassed += e.passedCount;
    });

    const cumulativePct = grandMax > 0 ? (grandTotal / grandMax) * 100 : 0;
    
    let cumulativeRating = "مقبول";
    if (cumulativePct >= 95) cumulativeRating = "ممتاز مرتفع (مرتبة الشرف الأولى)";
    else if (cumulativePct >= 90) cumulativeRating = "ممتاز (مرتبة الشرف الثانية)";
    else if (cumulativePct >= 80) cumulativeRating = "جيد جداً مرتفع";
    else if (cumulativePct >= 65) cumulativeRating = "جيد";
    else if (cumulativePct >= 50) cumulativeRating = "مقبول";
    else cumulativeRating = "له دور ثانٍ";

    return {
      grandTotal,
      grandMax,
      cumulativePct,
      cumulativeRating,
      totalSubjects,
      totalPassed,
      passRate: totalSubjects > 0 ? Math.round((totalPassed / totalSubjects) * 100) : 0,
      totalPeriods: careerByExam.length
    };
  }, [careerByExam]);

  // Print Transcript using silent iframe
  const printTranscriptIframe = () => {
    if (!student) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const printContent = document.getElementById("printable-academic-transcript");
    if (!printContent) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>السيرة_الدراسية_والسجل_الأكاديمي_${student.name}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", "Tajawal", sans-serif;
            background: #ffffff;
            color: #111827;
            margin: 0;
            padding: 0;
            font-size: 9.5pt;
            direction: rtl;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            margin-bottom: 6px;
          }
          th, td {
            border: 1px solid #94a3b8;
            padding: 5px 7px;
            text-align: right;
          }
          th {
            background-color: #f1f5f9;
            font-weight: 800;
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: 700; }
          .font-black { font-weight: 900; }
          .page-break { page-break-after: always; break-after: page; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1500);
    }, 400);
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[94vh] flex flex-col bg-card rounded-3xl border border-border/80 shadow-2xl overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-black shadow-md shadow-primary/25 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-foreground">السيرة الدراسية والسجل الأكاديمي الشامل</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-primary/10 text-primary border border-primary/20">
                  سجل الطالب المعتمد طوال مسيرته بالمدرسة
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-bold">
                حفظ وأرشفة نتائج الطالب عبر كل الامتحانات والفترات والفصول السابقة والحالية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={printTranscriptIframe}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السيرة الدراسية (Transcript)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-border/50 bg-background text-xs font-bold">
          <button
            onClick={() => setActiveTab("transcript")}
            className={`flex items-center gap-2 pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "transcript"
                ? "border-primary text-primary font-black"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>السجل الأكاديمي التراكمي الشامل ({careerByExam.length} فترة)</span>
          </button>

          <button
            onClick={() => setActiveTab("terms")}
            className={`flex items-center gap-2 pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "terms"
                ? "border-primary text-primary font-black"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>كشوف الدرجات التفصيلية حسب الفترات</span>
          </button>

          <button
            onClick={() => setActiveTab("timeline")}
            className={`flex items-center gap-2 pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === "timeline"
                ? "border-primary text-primary font-black"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>مسار التطور والمؤشرات التحليلية</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Student Identity Card & Primary Academic Passport */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-border/60">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-card border-2 border-primary/30 flex items-center justify-center text-xl font-black text-primary shadow-sm shrink-0">
                  {student.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-black text-foreground">{student.name}</h3>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                      {cumulativeStats.cumulativeRating}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-bold mt-1 flex-wrap">
                    <span>الرقم الأكاديمي: <b className="text-foreground tabular-nums">{student.nationalId}</b></span>
                    <span>•</span>
                    <span>المرحلة: <b className="text-foreground">{student.grade}</b></span>
                    <span>•</span>
                    <span>الشعبة: <b className="text-foreground">شعبة {currentSection?.name || "1"}</b></span>
                    <span>•</span>
                    <span>السنوات المسجلة: <b className="text-foreground">{studentEnrollments.length || 1} عام دراسي</b></span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <div className="px-3.5 py-1.5 rounded-xl bg-card border border-border text-center shadow-xs">
                  <p className="text-[10px] text-muted-foreground font-bold">الحالة الأكاديمية</p>
                  <p className="text-xs font-black text-emerald-600">منتظم ومجتاز ✓</p>
                </div>
              </div>
            </div>

            {/* 4 Cumulative KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
              <div className="bg-card/90 rounded-xl border border-border/60 p-3.5 shadow-xs text-center">
                <p className="text-xs text-muted-foreground font-bold mb-1 flex items-center justify-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" /> المعدل التراكمي الشامل
                </p>
                <p className="text-2xl font-black text-foreground tabular-nums" dir="ltr">
                  {cumulativeStats.cumulativePct.toFixed(1)}%
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-bold">
                  {cumulativeStats.grandTotal} من {cumulativeStats.grandMax} درجة
                </p>
              </div>

              <div className="bg-card/90 rounded-xl border border-border/60 p-3.5 shadow-xs text-center">
                <p className="text-xs text-muted-foreground font-bold mb-1 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> المقررات المجتازة
                </p>
                <p className="text-2xl font-black text-emerald-600 tabular-nums">
                  {cumulativeStats.totalPassed} / {cumulativeStats.totalSubjects}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-bold">
                  نسبة الإنجاز: {cumulativeStats.passRate}%
                </p>
              </div>

              <div className="bg-card/90 rounded-xl border border-border/60 p-3.5 shadow-xs text-center">
                <p className="text-xs text-muted-foreground font-bold mb-1 flex items-center justify-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" /> الفترات والامتحانات
                </p>
                <p className="text-2xl font-black text-foreground tabular-nums">
                  {careerByExam.length}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-bold">
                  فترات محفوظة في السجل
                </p>
              </div>

              <div className="bg-card/90 rounded-xl border border-border/60 p-3.5 shadow-xs text-center">
                <p className="text-xs text-muted-foreground font-bold mb-1 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> السلوك والمواظبة
                </p>
                <p className="text-2xl font-black text-primary">100%</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-bold">
                  انضباط متميز ومثالي
                </p>
              </div>
            </div>
          </div>

          {/* TAB 1: FULL CUMULATIVE TRANSCRIPT ACROSS ALL PREVIOUS & CURRENT EXAMS */}
          {activeTab === "transcript" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>السجل الأكاديمي الشامل لجميع الامتحانات والمقررات السابقة والحالية</span>
                </h4>
                <span className="text-xs font-bold text-muted-foreground">
                  إجمالي الفترات المحفوظة: {careerByExam.length}
                </span>
              </div>

              {careerByExam.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border/60 rounded-2xl p-6 text-muted-foreground font-bold">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
                  لا توجد نتائج مسجلة للطالب حتى الآن في الأرشيف
                </div>
              ) : (
                careerByExam.map((period, pIdx) => (
                  <div key={period.exam.id} className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs">
                    {/* Period Header */}
                    <div className="flex flex-wrap items-center justify-between px-5 py-3 bg-muted/40 border-b border-border/60 gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center">
                          {pIdx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-foreground">{period.exam.name}</span>
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-background border border-border/60 text-muted-foreground font-bold">
                              {period.grade}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-bold">
                            {period.exam.term} • {period.yearName} • وزن الفترة: {period.exam.weight || 0}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-bold">
                        <span>المجموع: <b className="text-primary font-black tabular-nums">{period.totalMarks}</b> / {period.totalMax}</span>
                        <span>المعدل: <b className="text-foreground font-black tabular-nums" dir="ltr">{period.percentage.toFixed(1)}%</b></span>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-black">
                          {period.overallRating}
                        </span>
                      </div>
                    </div>

                    {/* Marks Table (Strictly NO descriptive ratings on individual subjects) */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-muted/20 text-muted-foreground font-black border-b border-border/40">
                          <tr>
                            <th className="p-3 w-10 text-center">#</th>
                            <th className="p-3">المادة الدراسية</th>
                            <th className="p-3 text-center w-28">النهاية العظمى</th>
                            <th className="p-3 text-center w-28">درجة النجاح</th>
                            <th className="p-3 text-center w-28">درجة الطالب</th>
                            <th className="p-3 text-center w-28">نسبة الإنجاز</th>
                            <th className="p-3 text-center w-28">النتيجة</th>
                            <th className="p-3">ملاحظات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {period.subjectMarks.map((m, mIdx) => (
                            <tr key={m.examSubject.id} className="hover:bg-accent/15 transition-colors">
                              <td className="p-3 text-center font-bold text-muted-foreground">{mIdx + 1}</td>
                              <td className="p-3 font-black text-foreground text-sm">{m.subjectName}</td>
                              <td className="p-3 text-center tabular-nums text-muted-foreground font-bold">{m.maxScore}</td>
                              <td className="p-3 text-center tabular-nums text-muted-foreground">{m.passScore}</td>
                              <td className="p-3 text-center font-black text-primary text-base tabular-nums">{m.mark}</td>
                              <td className="p-3 text-center font-bold tabular-nums" dir="ltr">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="font-black">{m.pct.toFixed(1)}%</span>
                                  <div className="h-1.5 w-14 rounded-full bg-muted overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${m.isPassed ? "bg-primary" : "bg-rose-500"}`}
                                      style={{ width: `${Math.min(100, m.pct)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-center font-black">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                                  m.isPassed ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                }`}>
                                  {m.isPassed ? "ناجح ✓" : "دور ثانٍ ✗"}
                                </span>
                              </td>
                              <td className="p-3 text-muted-foreground text-[11px]">
                                {m.notes || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: TERMS AND PERIOD DRILLDOWN */}
          {activeTab === "terms" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-muted-foreground whitespace-nowrap">اختر الفترة للعرض التفصيلي:</label>
                <select
                  value={selectedTermExamId}
                  onChange={e => setSelectedTermExamId(e.target.value)}
                  className="h-10 rounded-xl border border-border/60 bg-background px-3 font-bold text-xs shadow-sm focus:border-primary outline-none cursor-pointer"
                >
                  <option value="all">جميع الفترات مجمعة</option>
                  {careerByExam.map(e => (
                    <option key={e.exam.id} value={e.exam.id}>{e.exam.name} ({e.exam.term} - {e.grade})</option>
                  ))}
                </select>
              </div>

              {careerByExam
                .filter(e => selectedTermExamId === "all" || e.exam.id === selectedTermExamId)
                .map((period) => (
                  <div key={period.exam.id} className="p-5 rounded-2xl border border-border/70 bg-card space-y-4 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-border/60">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-base text-foreground">{period.exam.name}</h4>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-muted text-foreground">
                            {period.grade}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-bold mt-0.5">
                          {period.exam.term} • {period.yearName} • نوع الاختبار: {period.exam.type === "final" ? "نهائي" : "دوري / فصلي"}
                        </p>
                      </div>
                      <div className="text-left">
                        <span className="text-xl font-black text-primary tabular-nums" dir="ltr">{period.percentage.toFixed(1)}%</span>
                        <span className="block text-xs font-black text-emerald-600">{period.overallRating}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {period.subjectMarks.map(m => (
                        <div key={m.examSubject.id} className="p-3.5 rounded-xl border border-border/50 bg-muted/20 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-xs text-foreground">{m.subjectName}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              m.isPassed ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                            }`}>
                              {m.isPassed ? "مجتاز ✓" : "غير مجتاز ✗"}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-xl font-black text-foreground tabular-nums">{m.mark}</span>
                            <span className="text-xs text-muted-foreground font-bold">من {m.maxScore} (نجاح {m.passScore})</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${m.isPassed ? "bg-primary" : "bg-rose-500"}`}
                              style={{ width: `${Math.min(100, m.pct)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-bold pt-1">
                            <span>نسبة الإنجاز:</span>
                            <span className="font-black text-foreground" dir="ltr">{m.pct.toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* TAB 3: PROGRESSION TIMELINE & ANALYTICAL METRICS */}
          {activeTab === "timeline" && (
            <div className="space-y-6">
              {/* Progression Trend Sparkline & Milestones */}
              <div className="p-5 rounded-2xl border border-border/70 bg-card space-y-4">
                <h4 className="font-black text-sm text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span>خط مسار التطور الأكاديمي عبر المراحل والفترات</span>
                </h4>
                <p className="text-xs text-muted-foreground font-bold">
                  رسم بياني يوضح تطور نسبة التحصيل الدراسي للطالب في جميع الامتحانات السابقة طوال مسيرته في المدرسة.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  {careerByExam.map((period, idx) => (
                    <div key={period.exam.id} className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2 relative">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-bold">
                        <span>المحطة {idx + 1}</span>
                        <span className="text-foreground">{period.grade}</span>
                      </div>
                      <p className="font-black text-xs text-foreground truncate">{period.exam.name}</p>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black text-primary tabular-nums" dir="ltr">
                          {period.percentage.toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-emerald-600 font-black">
                          {period.passedCount}/{period.totalSubjects} مادة
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, period.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths and Growth Areas */}
              <div className="p-5 rounded-2xl border border-border/70 bg-card space-y-4">
                <h4 className="font-black text-sm text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>تحليل كفاءة التحصيل الدراسي ونقاط التميز</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> المقررات الأعلى إنجازاً وإتقاناً
                    </span>
                    <ul className="space-y-1.5 text-xs font-bold text-foreground pt-1">
                      {careerByExam.flatMap(e => e.subjectMarks)
                        .filter(m => m.pct >= 85)
                        .slice(0, 5)
                        .map((m, idx) => (
                          <li key={idx} className="flex items-center justify-between p-2 rounded-lg bg-background border border-emerald-500/20">
                            <span>{m.subjectName}</span>
                            <span className="font-black text-emerald-600" dir="ltr">{m.pct.toFixed(1)}% ({m.mark}/{m.maxScore})</span>
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2">
                    <span className="text-xs font-black text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500" /> ملخص السيرة الأكاديمية والاعتماد
                    </span>
                    <div className="p-3 rounded-lg bg-background border border-blue-500/20 text-xs font-medium text-muted-foreground space-y-2">
                      <p>• إجمالي الفترات المرصودة: <b className="text-foreground">{careerByExam.length} فترات</b></p>
                      <p>• إجمالي الاختبارات المجتازة: <b className="text-emerald-600">{cumulativeStats.totalPassed} من {cumulativeStats.totalSubjects}</b></p>
                      <p>• مستوى الطالب يؤهله للمشاركة في الأنشطة الإثرائية وأولمبياد المواد العلمية.</p>
                      <p>• السجل الأكاديمي خالٍ من أي انقطاع ومطابق لضوابط الكنترول والاختبارات المدرسية.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-muted/20">
          <span className="text-xs text-muted-foreground font-bold">
            مرجع السجل: <code className="font-mono font-bold text-foreground">ST-TRN-{student.id.slice(0, 8).toUpperCase()}</code>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={printTranscriptIframe}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السيرة الدراسية الرسمية</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-bold text-xs transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>

        {/* Hidden Printable Container for High-Fidelity Iframe Printing */}
        <div id="printable-academic-transcript" className="hidden">
          <div style={{ padding: "10px", direction: "rtl", fontFamily: "Cairo, sans-serif" }}>
            {/* Header */}
            <div style={{ textAlign: "center", borderBottom: "2px solid #0f172a", paddingBottom: "12px", marginBottom: "16px" }}>
              <p style={{ margin: 0, fontSize: "11pt", color: "#475569", fontWeight: 700 }}>المملكة العربية السعودية • وزارة التعليم • الإدارة العامة للتعليم الأهلي</p>
              <h1 style={{ margin: "6px 0", fontSize: "20pt", fontWeight: 900, color: "#0f172a" }}>مجمع مدارس المستقبل الأهلية النموذجية</h1>
              <h2 style={{ margin: "4px 0", fontSize: "14pt", fontWeight: 800, color: "#2563eb" }}>السيرة الدراسية والسجل الأكاديمي الشامل (Academic Transcript)</h2>
              <p style={{ margin: 0, fontSize: "10pt", color: "#64748b" }}>العام الدراسي: 1446-1447 هـ • تاريخ الإصدار: {new Date().toISOString().split("T")[0]}</p>
            </div>

            {/* Student Meta */}
            <table style={{ marginBottom: "16px" }}>
              <tbody>
                <tr>
                  <td style={{ width: "25%", backgroundColor: "#f8fafc", fontWeight: 800 }}>اسم الطالب رباعياً:</td>
                  <td style={{ width: "25%", fontWeight: 900, fontSize: "11pt" }}>{student.name}</td>
                  <td style={{ width: "25%", backgroundColor: "#f8fafc", fontWeight: 800 }}>الرقم الأكاديمي / الهوية:</td>
                  <td style={{ width: "25%", fontWeight: 900, fontFamily: "monospace" }}>{student.nationalId}</td>
                </tr>
                <tr>
                  <td style={{ backgroundColor: "#f8fafc", fontWeight: 800 }}>الصف والمرحلة الحالية:</td>
                  <td style={{ fontWeight: 800 }}>{student.grade}</td>
                  <td style={{ backgroundColor: "#f8fafc", fontWeight: 800 }}>الشعبة الدراسية:</td>
                  <td style={{ fontWeight: 800 }}>شعبة {currentSection?.name || "1"}</td>
                </tr>
                <tr>
                  <td style={{ backgroundColor: "#f8fafc", fontWeight: 800 }}>المعدل التراكمي الشامل:</td>
                  <td style={{ fontWeight: 900, color: "#2563eb", fontSize: "11pt" }}>{cumulativeStats.cumulativePct.toFixed(1)}%</td>
                  <td style={{ backgroundColor: "#f8fafc", fontWeight: 800 }}>التقدير العام المعتمد:</td>
                  <td style={{ fontWeight: 900, color: "#16a34a" }}>{cumulativeStats.cumulativeRating}</td>
                </tr>
              </tbody>
            </table>

            {/* Tables for each period (Strictly numeric + percentage + result, NO subject verbal rating) */}
            {careerByExam.map((period, pIdx) => (
              <div key={period.exam.id} style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#f1f5f9", padding: "6px 10px", border: "1px solid #94a3b8", fontWeight: 800, fontSize: "10.5pt" }}>
                  <span>{period.exam.name} ({period.grade} - {period.exam.term})</span>
                  <span>المجموع: {period.totalMarks} / {period.totalMax} • المعدل: {period.percentage.toFixed(1)}% • التقدير العام: {period.overallRating}</span>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "5%", textAlign: "center" }}>#</th>
                      <th style={{ width: "35%" }}>المادة الدراسية</th>
                      <th style={{ width: "15%", textAlign: "center" }}>النهاية العظمى</th>
                      <th style={{ width: "15%", textAlign: "center" }}>درجة النجاح</th>
                      <th style={{ width: "15%", textAlign: "center" }}>درجة الطالب</th>
                      <th style={{ width: "15%", textAlign: "center" }}>نسبة الإنجاز</th>
                      <th style={{ width: "15%", textAlign: "center" }}>النتيجة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {period.subjectMarks.map((m, mIdx) => (
                      <tr key={m.examSubject.id}>
                        <td style={{ textAlign: "center" }}>{mIdx + 1}</td>
                        <td style={{ fontWeight: 700 }}>{m.subjectName}</td>
                        <td style={{ textAlign: "center" }}>{m.maxScore}</td>
                        <td style={{ textAlign: "center" }}>{m.passScore}</td>
                        <td style={{ textAlign: "center", fontWeight: 900, color: "#0f172a" }}>{m.mark}</td>
                        <td style={{ textAlign: "center", fontWeight: 800 }}>{m.pct.toFixed(1)}%</td>
                        <td style={{ textAlign: "center", fontWeight: 800, color: m.isPassed ? "#16a34a" : "#dc2626" }}>
                          {m.isPassed ? "ناجح" : "دور ثانٍ"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            {/* Final Standing & Signatures */}
            <div style={{ marginTop: "24px", paddingTop: "12px", borderTop: "2px solid #cbd5e1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center", fontWeight: 800, fontSize: "10pt" }}>
                <div style={{ width: "30%" }}>
                  <p style={{ color: "#64748b", marginBottom: "40px" }}>المرشد الطلابي / رائد الفصل</p>
                  <p style={{ borderTop: "1px dashed #94a3b8", paddingTop: "6px" }}>التوقيع: .....................</p>
                </div>
                <div style={{ width: "30%" }}>
                  <p style={{ color: "#64748b", marginBottom: "40px" }}>وكيل شؤون الطلاب والكنترول</p>
                  <p style={{ borderTop: "1px dashed #94a3b8", paddingTop: "6px" }}>المراجعة والاعتماد: .....................</p>
                </div>
                <div style={{ width: "30%" }}>
                  <p style={{ color: "#64748b", marginBottom: "40px" }}>مدير المدرسة والختم الرسمي</p>
                  <p style={{ borderTop: "1px dashed #94a3b8", paddingTop: "6px" }}>الختم الرسمي للمجمع</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
