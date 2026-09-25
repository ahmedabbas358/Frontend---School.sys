import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { useGlobalStore, ExamResult, ExamSubject, Exam } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage } from "@/lib/school-structure";
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Trophy, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Layers, 
  BookOpen, 
  Search, 
  Download, 
  Printer, 
  ArrowUpDown, 
  Check, 
  RotateCcw, 
  FileText, 
  SlidersHorizontal, 
  Sparkles, 
  Medal, 
  Eye, 
  Percent, 
  Hash, 
  ExternalLink, 
  Clock, 
  ShieldCheck,
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Filter,
  FileSpreadsheet,
  GraduationCap,
  ChevronDown,
  X,
  Target
} from "lucide-react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { AcademicCareerModal } from "@/components/academic-career-modal";

export const Route = createFileRoute("/exams/archive")({
  component: ExamsArchivePage,
  head: () => ({ meta: [{ title: "أرشيف نتائج الاختبارات والداشبورد التحليلي للقياس" }] })
});

// Helper: Translate stage key to clean Arabic label
function getStageArabicName(stageKey: string): string {
  switch (stageKey) {
    case "primary": return "المرحلة الابتدائية";
    case "middle": return "المرحلة المتوسطة";
    case "secondary": return "المرحلة الثانوية";
    case "kindergarten": return "مرحلة رياض الأطفال";
    default: return stageKey;
  }
}

// Helper: Normalize Arabic grade strings
function normalizeGrade(g: string = ""): string {
  return g.replace(/الابتدائي|المتوسط|الثانوي/g, "").replace(/\s+/g, " ").trim();
}

function ExamsArchivePage() {
  const { stage } = useStage();
  const { 
    activeStageSections, 
    activeStageSubjects, 
    activeStageExams, 
    activeStageExamSubjects, 
    activeStageStudents, 
    allExamResults, 
    allStudentEnrollments, 
    currentAcademicYearId,
    currentAcademicYear
  } = useGlobalStore();

  const stageArabicName = useMemo(() => getStageArabicName(stage), [stage]);

  // Navigation & Sub-Tab State
  const [activeTab, setActiveTab] = useState<"dashboard" | "explorer" | "ledger" | "sections" | "subjects">("dashboard");

  // Global Filter States
  const [filterExamId, setFilterExamId] = useState<string>("all");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [filterSectionId, setFilterSectionId] = useState<string>("all");
  const [filterSubjectId, setFilterSubjectId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | "passed" | "failed">("all");
  const [filterBracket, setFilterBracket] = useState<"all" | "distinction" | "very_good" | "good" | "acceptable" | "weak">("all");
  const [filterApproval, setFilterApproval] = useState<"all" | "approved" | "published" | "draft">("all");

  // Sub-Tab Filters (Sections & Subjects)
  const [sectionsGradeFilter, setSectionsGradeFilter] = useState<string>("all");
  const [subjectsFilterType, setSubjectsFilterType] = useState<"all" | "strength" | "remedial">("all");

  // Pagination & Sorting State for Archive Ledger
  const [ledgerPageSize, setLedgerPageSize] = useState<number>(25);
  const [ledgerCurrentPage, setLedgerCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<"student" | "mark" | "pct" | "grade" | "subject">("mark");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Hierarchical Explorer Specific State (Exam -> Grade -> Section -> Subject)
  const [explorerExamId, setExplorerExamId] = useState<string>("");
  const [explorerGrade, setExplorerGrade] = useState<string>("");
  const [explorerSectionId, setExplorerSectionId] = useState<string>("");
  const [explorerSubjectId, setExplorerSubjectId] = useState<string>("");
  const [explorerSearch, setExplorerSearch] = useState<string>("");

  // Career Modal State
  const [careerStudentId, setCareerStudentId] = useState<string>("");
  const [isCareerOpen, setIsCareerOpen] = useState(false);

  // Print Engine State
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [selectedPrintTemplateId, setSelectedPrintTemplateId] = useState<string>("executive_exam_analytics_report");

  // Available Grades for Current Stage
  const stageGrades = useMemo(() => getGradesForStage(stage), [stage]);

  // Available Sections for Current Stage - filtered by grade when a specific grade is chosen
  const availableSections = useMemo(() => {
    return activeStageSections.filter(sec => {
      if (sec.stage !== stage) return false;
      if (filterGrade !== "all" && normalizeGrade(sec.grade) !== normalizeGrade(filterGrade)) return false;
      return true;
    });
  }, [activeStageSections, stage, filterGrade]);

  // Available Exams for Current Stage & Year
  const availableExams = useMemo(() => {
    return activeStageExams.filter(e => {
      if (e.academicYearId && e.academicYearId !== currentAcademicYearId) return false;
      if (e.stage && e.stage !== "all" && e.stage !== stage) return false;
      return true;
    });
  }, [activeStageExams, currentAcademicYearId, stage]);

  // Available Exam Subjects
  const availableExamSubjects = useMemo(() => {
    return activeStageExamSubjects.filter(es => {
      if (filterExamId !== "all" && es.examId !== filterExamId) return false;
      if (filterGrade !== "all" && normalizeGrade(es.grade) !== normalizeGrade(filterGrade)) return false;
      if (filterSubjectId !== "all" && es.subjectId !== filterSubjectId) return false;
      return true;
    });
  }, [activeStageExamSubjects, filterExamId, filterGrade, filterSubjectId]);

  // Lookup maps for rapid rendering
  const studentsMap = useMemo(() => {
    const map = new Map<string, any>();
    (activeStageStudents || []).forEach(st => {
      map.set(st.id, st);
      if ((st as any).studentId) map.set((st as any).studentId, st);
      if (st.nationalId) map.set(st.nationalId, st);
    });
    return map;
  }, [activeStageStudents]);

  const enrollmentsMap = useMemo(() => {
    const map = new Map<string, any>();
    (allStudentEnrollments || []).forEach(enr => {
      map.set(enr.id, enr);
      if (enr.studentId) map.set(`st_${enr.studentId}`, enr);
    });
    return map;
  }, [allStudentEnrollments]);

  const subjectsMap = useMemo(() => {
    const map = new Map<string, any>();
    (activeStageSubjects || []).forEach(s => {
      map.set(s.id, s);
    });
    return map;
  }, [activeStageSubjects]);

  const examsMap = useMemo(() => {
    const map = new Map<string, any>();
    (activeStageExams || []).forEach(e => {
      map.set(e.id, e);
    });
    return map;
  }, [activeStageExams]);

  const examSubjectsMap = useMemo(() => {
    const map = new Map<string, ExamSubject>();
    (activeStageExamSubjects || []).forEach(es => {
      map.set(es.id, es);
    });
    return map;
  }, [activeStageExamSubjects]);

  // Normalized Comprehensive Archive Records
  const archiveRecords = useMemo(() => {
    const list: {
      id: string;
      resultId: string;
      studentId: string;
      studentName: string;
      nationalId: string;
      grade: string;
      sectionId: string;
      sectionName: string;
      examId: string;
      examName: string;
      examTerm: string;
      examType: string;
      subjectId: string;
      subjectName: string;
      mark: number;
      maxScore: number;
      passScore: number;
      percentage: number;
      rating: "ممتاز" | "جيد جداً" | "جيد" | "مقبول" | "ضعيف";
      isPassed: boolean;
      status: "draft" | "submitted" | "approved" | "published";
      approvedBy?: string;
      approvedAt?: string;
      notes?: string;
    }[] = [];

    (allExamResults || []).forEach(res => {
      const exSubject = examSubjectsMap.get(res.examSubjectId);
      if (!exSubject) return;

      // Filter by stage
      if (exSubject.stage && exSubject.stage !== "all" && exSubject.stage !== stage) return;

      // Filter by exam
      if (filterExamId !== "all" && exSubject.examId !== filterExamId) return;

      // Filter by grade with normalization
      if (filterGrade !== "all" && normalizeGrade(exSubject.grade) !== normalizeGrade(filterGrade)) return;

      // Filter by subject
      if (filterSubjectId !== "all" && exSubject.subjectId !== filterSubjectId) return;

      // Lookup student & enrollment
      let enrollment = enrollmentsMap.get(res.studentEnrollmentId);
      let student = enrollment ? studentsMap.get(enrollment.studentId) : studentsMap.get(res.studentEnrollmentId);
      if (!enrollment && student) {
        enrollment = enrollmentsMap.get(`st_${student.id}`);
      }
      if (!student) return;

      // Grade checking with normalization
      if (filterGrade !== "all") {
        const normFilter = normalizeGrade(filterGrade);
        const normStudentGrade = normalizeGrade(student.grade);
        const normEnrGrade = enrollment?.grade ? normalizeGrade(enrollment.grade) : "";
        const normExGrade = normalizeGrade(exSubject.grade);
        if (normStudentGrade !== normFilter && normEnrGrade !== normFilter && normExGrade !== normFilter) {
          return;
        }
      }

      // Filter by section
      const secId = enrollment?.sectionId || student.sectionId;
      if (filterSectionId !== "all" && secId !== filterSectionId) return;

      const secObj = activeStageSections.find(s => s.id === secId);
      const secName = secObj ? secObj.name : "أ";

      const mark = res.mark ?? 0;
      const maxScore = exSubject.maxScore || 100;
      const passScore = exSubject.passScore || 50;
      const percentage = maxScore > 0 ? (mark / maxScore) * 100 : 0;
      const isPassed = mark >= passScore;

      // Status filter
      if (filterStatus === "passed" && !isPassed) return;
      if (filterStatus === "failed" && isPassed) return;

      // Performance Bracket filter
      if (filterBracket === "distinction" && percentage < 90) return;
      if (filterBracket === "very_good" && (percentage < 80 || percentage >= 90)) return;
      if (filterBracket === "good" && (percentage < 65 || percentage >= 80)) return;
      if (filterBracket === "acceptable" && (percentage < 50 || percentage >= 65)) return;
      if (filterBracket === "weak" && percentage >= 50) return;

      // Approval filter
      const resStatus = res.status || "draft";
      if (filterApproval !== "all" && resStatus !== filterApproval) return;

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = student.name.toLowerCase().includes(q);
        const matchesNational = (student.nationalId || "").includes(q);
        const matchesSubject = (subjectsMap.get(exSubject.subjectId)?.name || "").toLowerCase().includes(q);
        if (!matchesName && !matchesNational && !matchesSubject) return;
      }

      const examObj = examsMap.get(exSubject.examId);
      const subObj = subjectsMap.get(exSubject.subjectId);

      let rating: "ممتاز" | "جيد جداً" | "جيد" | "مقبول" | "ضعيف" = "ضعيف";
      if (percentage >= 90) rating = "ممتاز";
      else if (percentage >= 80) rating = "جيد جداً";
      else if (percentage >= 65) rating = "جيد";
      else if (percentage >= 50) rating = "مقبول";

      list.push({
        id: `${res.id || Math.random()}`,
        resultId: res.id,
        studentId: student.id,
        studentName: student.name,
        nationalId: student.nationalId || "-",
        grade: exSubject.grade || student.grade || "الصف الأول",
        sectionId: secId || "",
        sectionName: secName,
        examId: exSubject.examId,
        examName: examObj ? examObj.name : "اختبار فصلي",
        examTerm: examObj ? examObj.term : "الفصل الأول",
        examType: examObj ? examObj.type : "فصلي",
        subjectId: exSubject.subjectId,
        subjectName: subObj ? subObj.name : "مادة دراسية",
        mark,
        maxScore,
        passScore,
        percentage,
        rating,
        isPassed,
        status: resStatus,
        approvedBy: res.approvedBy,
        approvedAt: res.approvedAt,
        notes: res.notes
      });
    });

    // Sorting
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "student") cmp = a.studentName.localeCompare(b.studentName, "ar");
      else if (sortBy === "mark") cmp = a.mark - b.mark;
      else if (sortBy === "pct") cmp = a.percentage - b.percentage;
      else if (sortBy === "grade") cmp = a.grade.localeCompare(b.grade, "ar");
      else if (sortBy === "subject") cmp = a.subjectName.localeCompare(b.subjectName, "ar");
      return sortDirection === "desc" ? -cmp : cmp;
    });

    return list;
  }, [
    allExamResults,
    examSubjectsMap,
    stage,
    filterExamId,
    filterGrade,
    filterSubjectId,
    enrollmentsMap,
    studentsMap,
    activeStageSections,
    filterSectionId,
    filterStatus,
    filterBracket,
    filterApproval,
    searchQuery,
    examsMap,
    subjectsMap,
    sortBy,
    sortDirection
  ]);

  // High-Level Measurement Analytics Engine
  const analytics = useMemo(() => {
    const totalRecords = archiveRecords.length;
    if (totalRecords === 0) {
      return {
        totalExamined: 0,
        uniqueStudents: 0,
        passRate: 0,
        averageMark: 0,
        highestMark: 0,
        passedCount: 0,
        failedCount: 0,
        distinctionCount: 0,
        veryGoodCount: 0,
        goodCount: 0,
        acceptableCount: 0,
        weakCount: 0,
        approvedPercentage: 0,
        sectionBreakdown: [],
        subjectBreakdown: [],
        topStudents: [],
        atRiskStudents: []
      };
    }

    const uniqueStudentsSet = new Set(archiveRecords.map(r => r.studentId));
    const passedRecords = archiveRecords.filter(r => r.isPassed);
    const passRate = Math.round((passedRecords.length / totalRecords) * 100);

    const sumPercentages = archiveRecords.reduce((acc, r) => acc + r.percentage, 0);
    const averageMark = Math.round((sumPercentages / totalRecords) * 10) / 10;
    const highestMark = Math.round(Math.max(...archiveRecords.map(r => r.percentage)));

    const distinctionCount = archiveRecords.filter(r => r.percentage >= 90).length;
    const veryGoodCount = archiveRecords.filter(r => r.percentage >= 80 && r.percentage < 90).length;
    const goodCount = archiveRecords.filter(r => r.percentage >= 65 && r.percentage < 80).length;
    const acceptableCount = archiveRecords.filter(r => r.percentage >= 50 && r.percentage < 65).length;
    const weakCount = archiveRecords.filter(r => r.percentage < 50).length;

    const approvedCount = archiveRecords.filter(r => r.status === "approved" || r.status === "published").length;
    const approvedPercentage = Math.round((approvedCount / totalRecords) * 100);

    // Section Breakdown
    const sectionMap = new Map<string, { sectionName: string; grade: string; marks: number[]; passed: number; total: number }>();
    archiveRecords.forEach(r => {
      const key = `${r.grade}_${r.sectionName}`;
      if (!sectionMap.has(key)) {
        sectionMap.set(key, { sectionName: r.sectionName, grade: r.grade, marks: [], passed: 0, total: 0 });
      }
      const entry = sectionMap.get(key)!;
      entry.marks.push(r.percentage);
      entry.total++;
      if (r.isPassed) entry.passed++;
    });

    const sectionBreakdown = Array.from(sectionMap.entries()).map(([key, data]) => {
      const avg = data.marks.reduce((a, b) => a + b, 0) / (data.marks.length || 1);
      const rate = Math.round((data.passed / data.total) * 100);
      return {
        key,
        sectionName: data.sectionName,
        grade: data.grade,
        average: Math.round(avg * 10) / 10,
        passRate: rate,
        totalExamined: data.total
      };
    }).sort((a, b) => b.average - a.average);

    // Subject Breakdown
    const subjectMap = new Map<string, { subjectName: string; marks: number[]; passed: number; total: number }>();
    archiveRecords.forEach(r => {
      if (!subjectMap.has(r.subjectName)) {
        subjectMap.set(r.subjectName, { subjectName: r.subjectName, marks: [], passed: 0, total: 0 });
      }
      const entry = subjectMap.get(r.subjectName)!;
      entry.marks.push(r.percentage);
      entry.total++;
      if (r.isPassed) entry.passed++;
    });

    const subjectBreakdown = Array.from(subjectMap.entries()).map(([name, data]) => {
      const avg = data.marks.reduce((a, b) => a + b, 0) / (data.marks.length || 1);
      const rate = Math.round((data.passed / data.total) * 100);
      return {
        subjectName: name,
        average: Math.round(avg * 10) / 10,
        passRate: rate,
        totalExamined: data.total
      };
    }).sort((a, b) => b.average - a.average);

    // Top Students (Aggregated)
    const studentAgg = new Map<string, { studentId: string; studentName: string; nationalId: string; grade: string; sectionName: string; totalMarks: number; totalMax: number }>();
    archiveRecords.forEach(r => {
      if (!studentAgg.has(r.studentId)) {
        studentAgg.set(r.studentId, {
          studentId: r.studentId,
          studentName: r.studentName,
          nationalId: r.nationalId,
          grade: r.grade,
          sectionName: r.sectionName,
          totalMarks: 0,
          totalMax: 0
        });
      }
      const st = studentAgg.get(r.studentId)!;
      st.totalMarks += r.mark;
      st.totalMax += r.maxScore;
    });

    const topStudents = Array.from(studentAgg.values()).map(s => ({
      ...s,
      overallPct: s.totalMax > 0 ? Math.round((s.totalMarks / s.totalMax) * 1000) / 10 : 0
    })).sort((a, b) => b.overallPct - a.overallPct).slice(0, 10);

    // At-Risk Students
    const atRiskMap = new Map<string, { studentId: string; studentName: string; nationalId: string; grade: string; sectionName: string; failedSubjects: string[] }>();
    archiveRecords.filter(r => !r.isPassed).forEach(r => {
      if (!atRiskMap.has(r.studentId)) {
        atRiskMap.set(r.studentId, {
          studentId: r.studentId,
          studentName: r.studentName,
          nationalId: r.nationalId,
          grade: r.grade,
          sectionName: r.sectionName,
          failedSubjects: []
        });
      }
      atRiskMap.get(r.studentId)!.failedSubjects.push(`${r.subjectName} (${r.mark}/${r.maxScore})`);
    });

    const atRiskStudents = Array.from(atRiskMap.values());

    return {
      totalExamined: totalRecords,
      uniqueStudents: uniqueStudentsSet.size,
      passRate,
      averageMark,
      highestMark,
      passedCount: passedRecords.length,
      failedCount: weakCount,
      distinctionCount,
      veryGoodCount,
      goodCount,
      acceptableCount,
      weakCount,
      approvedPercentage,
      sectionBreakdown,
      subjectBreakdown,
      topStudents,
      atRiskStudents
    };
  }, [archiveRecords]);

  // Paginated Ledger Rows
  const totalLedgerPages = ledgerPageSize === 0 ? 1 : Math.max(1, Math.ceil(archiveRecords.length / ledgerPageSize));
  const safeLedgerPage = Math.min(ledgerCurrentPage, totalLedgerPages);
  const paginatedArchiveRecords = useMemo(() => {
    if (ledgerPageSize === 0) return archiveRecords;
    const start = (safeLedgerPage - 1) * ledgerPageSize;
    return archiveRecords.slice(start, start + ledgerPageSize);
  }, [archiveRecords, safeLedgerPage, ledgerPageSize]);

  // Reset all filters helper
  const handleResetFilters = () => {
    setFilterExamId("all");
    setFilterGrade("all");
    setFilterSectionId("all");
    setFilterSubjectId("all");
    setFilterStatus("all");
    setFilterBracket("all");
    setFilterApproval("all");
    setSearchQuery("");
    setLedgerCurrentPage(1);
    toast.info("تمت استعادة كافة فلاتر البحث والقياس");
  };

  // CSV Export Handler
  const handleExportCsv = () => {
    if (archiveRecords.length === 0) {
      toast.error("لا توجد نتائج مطابقة لتصديرها");
      return;
    }
    const headers = [
      "الرقم",
      "الرقم الأكاديمي",
      "اسم الطالب",
      "المرحلة",
      "الصف",
      "الشعبة",
      "امتحان الفترة",
      "المادة الدراسية",
      "الدرجة المحصلة",
      "النهاية العظمى",
      "درجة النجاح",
      "النسبة المئوية",
      "التقدير",
      "حالة النتيجة",
      "حالة الاعتماد"
    ];

    const rows = archiveRecords.map((r, i) => [
      i + 1,
      r.nationalId,
      r.studentName,
      stageArabicName,
      r.grade,
      r.sectionName,
      r.examName,
      r.subjectName,
      r.mark,
      r.maxScore,
      r.passScore,
      `${r.percentage.toFixed(1)}%`,
      r.rating,
      r.isPassed ? "ناجح" : "راسب",
      r.status === "approved" ? "معتمد" : r.status === "published" ? "منشور" : "مسودة"
    ]);

    const csv = "\uFEFF" + [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `أرشيف_نتائج_الاختبارات_${stageArabicName}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`تم تصدير أرشيف ${archiveRecords.length} نتيجة بنجاح بصيغة CSV المتوافقة مع Excel`);
  };

  // --- Hierarchical Results Explorer & Repository Mappings ---
  const activeExplorerExamId = explorerExamId || availableExams[0]?.id || "";
  const activeExplorerGrade = explorerGrade || stageGrades[0] || "";

  const explorerSections = useMemo(() => {
    return activeStageSections.filter(s => 
      s.stage === stage && 
      (!activeExplorerGrade || normalizeGrade(s.grade) === normalizeGrade(activeExplorerGrade))
    );
  }, [activeStageSections, stage, activeExplorerGrade]);

  const activeExplorerSectionId = explorerSectionId || explorerSections[0]?.id || "";

  const explorerExamSubjects = useMemo(() => {
    return (activeStageExamSubjects || []).filter(es => 
      es.examId === activeExplorerExamId && 
      (!activeExplorerGrade || normalizeGrade(es.grade) === normalizeGrade(activeExplorerGrade))
    );
  }, [activeStageExamSubjects, activeExplorerExamId, activeExplorerGrade]);

  const explorerSubjects = useMemo(() => {
    const subIds = new Set(explorerExamSubjects.map(es => es.subjectId));
    return (activeStageSubjects || []).filter(s => subIds.has(s.id));
  }, [activeStageSubjects, explorerExamSubjects]);

  const activeExplorerSubjectId = explorerSubjectId || explorerSubjects[0]?.id || "";

  const selectedExamSubject = useMemo(() => {
    if (!explorerExamSubjects.length) return null;
    return explorerExamSubjects.find(es => es.subjectId === activeExplorerSubjectId) || explorerExamSubjects[0] || null;
  }, [explorerExamSubjects, activeExplorerSubjectId]);

  const explorerStudents = useMemo(() => {
    if (!activeExplorerSectionId) return [];
    const enrollments = (allStudentEnrollments || []).filter(e => e.sectionId === activeExplorerSectionId);
    const enrollmentMap = new Map(enrollments.map(e => [e.studentId, e]));

    return (activeStageStudents || []).filter(s => 
      s.sectionId === activeExplorerSectionId || 
      enrollmentMap.has(s.id) || 
      (s.grade && normalizeGrade(s.grade) === normalizeGrade(activeExplorerGrade) && !activeExplorerSectionId)
    ).map(st => {
      const enr = enrollmentMap.get(st.id);
      return {
        student: st,
        enrollmentId: enr?.id || st.id
      };
    });
  }, [activeExplorerSectionId, allStudentEnrollments, activeStageStudents, activeExplorerGrade]);

  const explorerRoster = useMemo(() => {
    if (!selectedExamSubject) return [];
    const maxScore = selectedExamSubject.maxScore || 100;
    const passScore = selectedExamSubject.passScore || 50;

    let list = explorerStudents.map(({ student, enrollmentId }) => {
      const res = (allExamResults || []).find(r => 
        r.examSubjectId === selectedExamSubject.id && (
          r.studentEnrollmentId === enrollmentId || 
          r.studentEnrollmentId === student.id ||
          r.studentEnrollmentId === student.nationalId
        )
      );

      const mark = res?.mark ?? 0;
      const isPassed = mark >= passScore;
      const pct = maxScore > 0 ? (mark / maxScore) * 100 : 0;

      return {
        student,
        resultId: res?.id,
        mark,
        maxScore,
        passScore,
        pct,
        isPassed,
        status: res?.status || "draft",
        notes: res?.notes || ""
      };
    });

    if (explorerSearch.trim()) {
      const q = explorerSearch.trim().toLowerCase();
      list = list.filter(item => 
        item.student.name.toLowerCase().includes(q) || 
        (item.student.nationalId || "").includes(q)
      );
    }

    return list.sort((a, b) => b.mark - a.mark);
  }, [selectedExamSubject, explorerStudents, allExamResults, explorerSearch]);

  const explorerStats = useMemo(() => {
    const total = explorerRoster.length;
    if (total === 0) return { total: 0, passed: 0, passRate: 0, avg: 0, max: 0, min: 0 };
    const passed = explorerRoster.filter(r => r.isPassed).length;
    const passRate = Math.round((passed / total) * 100);
    const sum = explorerRoster.reduce((acc, r) => acc + r.mark, 0);
    const avg = Number((sum / total).toFixed(1));
    const marks = explorerRoster.map(r => r.mark);
    const max = Math.max(...marks);
    const min = Math.min(...marks);
    return { total, passed, passRate, avg, max, min };
  }, [explorerRoster]);

  const handleExportExplorerCsv = () => {
    if (explorerRoster.length === 0 || !selectedExamSubject) {
      toast.error("لا توجد درجات مرصودة لتصديرها");
      return;
    }
    const subObj = subjectsMap.get(selectedExamSubject.subjectId);
    const secObj = activeStageSections.find(s => s.id === activeExplorerSectionId);

    const headers = ["الترتيب", "الرقم الأكاديمي", "اسم الطالب", "الصف", "الشعبة", "المادة", "الدرجة المحصلة", "النهاية العظمى", "درجة النجاح", "النسبة المئوية", "النتيجة"];
    const rows = explorerRoster.map((r, i) => [
      i + 1,
      r.student.nationalId || "",
      r.student.name,
      activeExplorerGrade,
      secObj?.name || "1",
      subObj?.name || "",
      r.mark,
      r.maxScore,
      r.passScore,
      `${r.pct.toFixed(1)}%`,
      r.isPassed ? "ناجح" : "راسب"
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `كشف_درجات_${subObj?.name || "المادة"}_${activeExplorerGrade}_شعبة_${secObj?.name || "1"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير كشف درجات الشعبة بنجاح!");
  };

  // --- Official Print Templates ---
  const officialReportTemplate: PrintTemplate = {
    id: "executive_exam_analytics_report",
    name: "التقرير التحليلي الشامل لنتائج الاختبارات والقياس",
    category: "تقارير قيادية",
    type: "document",
    renderDocument: () => (
      <div className="p-8 border border-border/80 rounded-3xl bg-background text-foreground space-y-6" dir="rtl">
        {/* Header */}
        <div className="text-center border-b-2 border-primary/30 pb-4 space-y-1">
          <div className="text-sm font-bold text-muted-foreground">منظومة الإدارة المدرسية والتقويم الأكاديمي</div>
          <h2 className="text-2xl font-black text-foreground">التقرير التحليلي الشامل لنتائج الاختبارات والتحصيل الأكاديمي</h2>
          <div className="text-xs text-muted-foreground font-bold flex items-center justify-center gap-3 pt-1">
            <span>المرحلة: <b className="text-foreground">{stageArabicName}</b></span>
            <span>العام الدراسي: <b className="text-foreground">{currentAcademicYear?.name || "الحالي"}</b></span>
            <span>تاريخ الإصدار: <b className="text-foreground font-mono">{new Date().toLocaleDateString("ar-SA")}</b></span>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-2xl border border-border bg-muted/30">
            <span className="text-xs text-muted-foreground font-bold block">إجمالي النتائج المفحوصة</span>
            <span className="text-xl font-black text-foreground font-mono">{analytics.totalExamined}</span>
          </div>
          <div className="p-3 rounded-2xl border border-border bg-muted/30">
            <span className="text-xs text-muted-foreground font-bold block">نسبة النجاح العامة</span>
            <span className="text-xl font-black text-emerald-600 font-mono">{analytics.passRate}%</span>
          </div>
          <div className="p-3 rounded-2xl border border-border bg-muted/30">
            <span className="text-xs text-muted-foreground font-bold block">متوسط التحصيل العام</span>
            <span className="text-xl font-black text-primary font-mono">{analytics.averageMark}%</span>
          </div>
          <div className="p-3 rounded-2xl border border-border bg-muted/30">
            <span className="text-xs text-muted-foreground font-bold block">نسبة الاعتماد الكنترولي</span>
            <span className="text-xl font-black text-blue-600 font-mono">{analytics.approvedPercentage}%</span>
          </div>
        </div>

        {/* Rating Breakdown Table */}
        <div className="space-y-2">
          <h3 className="text-sm font-black text-foreground">التوزيع التكراري لمستويات الإنجاز والتقديرات</h3>
          <table className="w-full text-right text-xs border border-border">
            <thead className="bg-muted text-muted-foreground font-black">
              <tr>
                <th className="p-2.5 border">التقدير الأكاديمي</th>
                <th className="p-2.5 border text-center">المدى المئوي</th>
                <th className="p-2.5 border text-center">العدد</th>
                <th className="p-2.5 border text-center">النسبة المئوية من الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2.5 border font-bold text-emerald-700">ممتاز</td>
                <td className="p-2.5 border text-center font-mono">≥ 90%</td>
                <td className="p-2.5 border text-center font-mono font-bold">{analytics.distinctionCount}</td>
                <td className="p-2.5 border text-center font-mono">{analytics.totalExamined > 0 ? Math.round((analytics.distinctionCount / analytics.totalExamined) * 100) : 0}%</td>
              </tr>
              <tr>
                <td className="p-2.5 border font-bold text-blue-700">جيد جداً</td>
                <td className="p-2.5 border text-center font-mono">80% - 89%</td>
                <td className="p-2.5 border text-center font-mono font-bold">{analytics.veryGoodCount}</td>
                <td className="p-2.5 border text-center font-mono">{analytics.totalExamined > 0 ? Math.round((analytics.veryGoodCount / analytics.totalExamined) * 100) : 0}%</td>
              </tr>
              <tr>
                <td className="p-2.5 border font-bold text-sky-700">جيد</td>
                <td className="p-2.5 border text-center font-mono">65% - 79%</td>
                <td className="p-2.5 border text-center font-mono font-bold">{analytics.goodCount}</td>
                <td className="p-2.5 border text-center font-mono">{analytics.totalExamined > 0 ? Math.round((analytics.goodCount / analytics.totalExamined) * 100) : 0}%</td>
              </tr>
              <tr>
                <td className="p-2.5 border font-bold text-amber-700">مقبول (الحد الأدنى)</td>
                <td className="p-2.5 border text-center font-mono">50% - 64%</td>
                <td className="p-2.5 border text-center font-mono font-bold">{analytics.acceptableCount}</td>
                <td className="p-2.5 border text-center font-mono">{analytics.totalExamined > 0 ? Math.round((analytics.acceptableCount / analytics.totalExamined) * 100) : 0}%</td>
              </tr>
              <tr>
                <td className="p-2.5 border font-bold text-rose-700">ضعيف (دور ثانٍ / تعثر)</td>
                <td className="p-2.5 border text-center font-mono">&lt; 50%</td>
                <td className="p-2.5 border text-center font-mono font-bold">{analytics.weakCount}</td>
                <td className="p-2.5 border text-center font-mono">{analytics.totalExamined > 0 ? Math.round((analytics.weakCount / analytics.totalExamined) * 100) : 0}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section Comparison */}
        <div className="space-y-2">
          <h3 className="text-sm font-black text-foreground">مقارنة أداء الشعب الدراسية ونسب التحصيل</h3>
          <table className="w-full text-right text-xs border border-border">
            <thead className="bg-muted text-muted-foreground font-black">
              <tr>
                <th className="p-2 border">الصف والشعبة</th>
                <th className="p-2 border text-center">النتائج المفحوصة</th>
                <th className="p-2 border text-center">نسبة النجاح</th>
                <th className="p-2 border text-center">متوسط التحصيل العام</th>
              </tr>
            </thead>
            <tbody>
              {analytics.sectionBreakdown.slice(0, 10).map((sec, idx) => (
                <tr key={idx}>
                  <td className="p-2 border font-bold">{sec.grade} - شعبة {sec.sectionName}</td>
                  <td className="p-2 border text-center font-mono">{sec.totalExamined}</td>
                  <td className="p-2 border text-center font-mono font-bold text-emerald-600">{sec.passRate}%</td>
                  <td className="p-2 border text-center font-mono font-black text-primary">{sec.average}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="pt-8 border-t border-border flex justify-between text-xs font-bold text-muted-foreground">
          <div>رئيس لجنة الكنترول والامتحانات: ___________________</div>
          <div>المرشد الطلابي والأكاديمي: ___________________</div>
          <div>مدير المدرسة / الاعتماد: ___________________</div>
        </div>
      </div>
    )
  };

  const honorRollTemplate: PrintTemplate = {
    id: "honor_roll_report",
    name: "لوحة الشرف الرسمية وكشف أوائل الطلاب المتفوقين",
    category: "تكريم وتفوق",
    type: "document",
    renderDocument: () => (
      <div className="p-8 border border-border/80 rounded-3xl bg-background text-foreground space-y-6" dir="rtl">
        <div className="text-center border-b-2 border-amber-500/40 pb-4 space-y-1">
          <div className="text-sm font-bold text-amber-600">لوحة الشرف الأكاديمي والتفوق المدرسي</div>
          <h2 className="text-2xl font-black text-foreground">كشف أوائل الطلاب الحاصلين على أعلى المعدلات التراكمية</h2>
          <div className="text-xs text-muted-foreground font-bold flex items-center justify-center gap-3 pt-1">
            <span>المرحلة: <b className="text-foreground">{stageArabicName}</b></span>
            <span>العام الدراسي: <b className="text-foreground">{currentAcademicYear?.name || "الحالي"}</b></span>
          </div>
        </div>

        <table className="w-full text-right text-xs border border-border">
          <thead className="bg-amber-500/10 text-amber-800 dark:text-amber-300 font-black">
            <tr>
              <th className="p-3 border text-center w-14">المرتبة</th>
              <th className="p-3 border">اسم الطالب</th>
              <th className="p-3 border text-center">الرقم الأكاديمي</th>
              <th className="p-3 border text-center">الصف والشعبة</th>
              <th className="p-3 border text-center">المعدل التراكمي</th>
              <th className="p-3 border text-center">التقدير</th>
            </tr>
          </thead>
          <tbody>
            {analytics.topStudents.map((st, idx) => (
              <tr key={st.studentId} className="hover:bg-muted/30">
                <td className="p-3 border text-center font-bold text-base">
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                </td>
                <td className="p-3 border font-bold text-sm">{st.studentName}</td>
                <td className="p-3 border text-center font-mono">{st.nationalId}</td>
                <td className="p-3 border text-center font-bold">{st.grade} - شعبة {st.sectionName}</td>
                <td className="p-3 border text-center font-mono font-black text-emerald-600 text-sm">{st.overallPct}%</td>
                <td className="p-3 border text-center font-bold text-amber-600">ممتاز مرتفع ⭐</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pt-8 border-t border-border flex justify-between text-xs font-bold text-muted-foreground">
          <div>المرشد الطلابي: ___________________</div>
          <div>وكيل شؤون الطلاب: ___________________</div>
          <div>مدير عام المدرسة: ___________________</div>
        </div>
      </div>
    )
  };

  const atRiskRemedialTemplate: PrintTemplate = {
    id: "remedial_intervention_report",
    name: "كشف خطة التدخل والبرامج العلاجية للطلاب المتعثرين",
    category: "رعاية أكاديمية",
    type: "document",
    renderDocument: () => (
      <div className="p-8 border border-border/80 rounded-3xl bg-background text-foreground space-y-6" dir="rtl">
        <div className="text-center border-b-2 border-rose-500/40 pb-4 space-y-1">
          <div className="text-sm font-bold text-rose-600">لجنة التحصيل الدراسي والإرشاد الأكاديمي</div>
          <h2 className="text-2xl font-black text-foreground">بيان حصر الطلاب المتعثرين المقترح إلحاقهم بالبرامج العلاجية</h2>
          <div className="text-xs text-muted-foreground font-bold flex items-center justify-center gap-3 pt-1">
            <span>المرحلة: <b className="text-foreground">{stageArabicName}</b></span>
            <span>إجمالي الطلاب المحصورين: <b className="text-rose-600">{analytics.atRiskStudents.length} طالب</b></span>
          </div>
        </div>

        <table className="w-full text-right text-xs border border-border">
          <thead className="bg-rose-500/10 text-rose-800 dark:text-rose-300 font-black">
            <tr>
              <th className="p-3 border text-center w-12">#</th>
              <th className="p-3 border">اسم الطالب</th>
              <th className="p-3 border text-center">الرقم الأكاديمي</th>
              <th className="p-3 border text-center">الصف والشعبة</th>
              <th className="p-3 border">المواد غير المجتازة والدرجة المحصلة</th>
              <th className="p-3 border text-center">الإجراء المقترح</th>
            </tr>
          </thead>
          <tbody>
            {analytics.atRiskStudents.map((st, idx) => (
              <tr key={st.studentId} className="hover:bg-muted/30">
                <td className="p-3 border text-center font-bold">{idx + 1}</td>
                <td className="p-3 border font-bold">{st.studentName}</td>
                <td className="p-3 border text-center font-mono">{st.nationalId}</td>
                <td className="p-3 border text-center font-bold">{st.grade} - شعبة {st.sectionName}</td>
                <td className="p-3 border">
                  <div className="flex flex-wrap gap-1">
                    {st.failedSubjects.map((sub, sIdx) => (
                      <span key={sIdx} className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                        {sub}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3 border text-center font-bold text-slate-600">خطة علاجية + إشعار ولي الأمر</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pt-8 border-t border-border flex justify-between text-xs font-bold text-muted-foreground">
          <div>منسق برامج الرعاية والعلاج: ___________________</div>
          <div>المرشد الطلابي: ___________________</div>
          <div>مدير المدرسة: ___________________</div>
        </div>
      </div>
    )
  };

  return (
    <AppShell>
      {/* Global CSS to suppress any OS level horizontal scrollbars in tabs & cascades */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

      <div className="space-y-6 pb-16">
        
        {/* ========================================================================= */}
        {/* TOP SYSTEM HEADER & EXECUTIVE ACTION BAR                                  */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    أرشيف نتائج الاختبارات والداشبورد التحليلي للقياس
                  </h1>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {stageArabicName}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  مركز أرشفة النتائج التاريخية، قياس جودة التحصيل الدراسي، ومقارنة أداء الشعب والمواد والفترات
                </p>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setSelectedPrintTemplateId("executive_exam_analytics_report");
                  setIsPrintOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>التقرير التحليلي المعتمد</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedPrintTemplateId("honor_roll_report");
                  setIsPrintOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 font-bold text-xs transition-colors cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>لوحة الشرف للأوائل</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedPrintTemplateId("remedial_intervention_report");
                  setIsPrintOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 font-bold text-xs transition-colors cursor-pointer"
              >
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>خطة المتعثرين</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>تصدير Excel</span>
              </button>
            </div>
          </div>

          {/* MASTER GLOBAL INTERCONNECTED FILTER STRIP */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            {/* 1. Exam Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" /> فترة الاختبار:
              </label>
              <div className="relative">
                <select
                  value={filterExamId}
                  onChange={e => setFilterExamId(e.target.value)}
                  className="w-full h-10 px-3 pr-3 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="all">جميع فترات الاختبارات</option>
                  {availableExams.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name} ({ex.term})</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 2. Grade Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" /> الصف الدراسي:
              </label>
              <div className="relative">
                <select
                  value={filterGrade}
                  onChange={e => {
                    setFilterGrade(e.target.value);
                    setFilterSectionId("all");
                  }}
                  className="w-full h-10 px-3 pr-3 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="all">جميع صفوف {stageArabicName}</option>
                  {stageGrades.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 3. Section Filter (Cascades with Grade) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" /> الشعبة الدراسية:
              </label>
              <div className="relative">
                <select
                  value={filterSectionId}
                  onChange={e => setFilterSectionId(e.target.value)}
                  className="w-full h-10 px-3 pr-3 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="all">
                    {filterGrade === "all" ? "جميع الشعب (كشف موحد)" : `كافة شعب (${filterGrade})`}
                  </option>
                  {filterGrade === "all" ? (
                    stageGrades.map(gr => {
                      const gradeSecs = activeStageSections.filter(s => s.stage === stage && normalizeGrade(s.grade) === normalizeGrade(gr));
                      if (gradeSecs.length === 0) return null;
                      return (
                        <optgroup key={gr} label={gr}>
                          {gradeSecs.map(sec => (
                            <option key={sec.id} value={sec.id}>شعبة {sec.name}</option>
                          ))}
                        </optgroup>
                      );
                    })
                  ) : (
                    availableSections.map(sec => (
                      <option key={sec.id} value={sec.id}>شعبة {sec.name}</option>
                    ))
                  )}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 4. Subject Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary" /> المادة الدراسية:
              </label>
              <div className="relative">
                <select
                  value={filterSubjectId}
                  onChange={e => setFilterSubjectId(e.target.value)}
                  className="w-full h-10 px-3 pr-3 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="all">جميع المواد الدراسية</option>
                  {activeStageSubjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 5. Result Status Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-primary" /> الحالة الأكاديمية:
              </label>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as any)}
                  className="w-full h-10 px-3 pr-3 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="all">الكل (ناجح وراسب)</option>
                  <option value="passed">الناجحين فقط ✅</option>
                  <option value="failed">المتعثرين فقط (دور ثانٍ) ⚠️</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 6. Performance Bracket Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" /> نطاق التقدير:
              </label>
              <div className="relative">
                <select
                  value={filterBracket}
                  onChange={e => setFilterBracket(e.target.value as any)}
                  className="w-full h-10 px-3 pr-3 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="all">جميع التقديرات</option>
                  <option value="distinction">ممتاز (≥ 90%) ⭐</option>
                  <option value="very_good">جيد جداً (80% - 89%)</option>
                  <option value="good">جيد (65% - 79%)</option>
                  <option value="acceptable">مقبول (50% - 64%)</option>
                  <option value="weak">ضعيف / متعثر (&lt; 50%)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quick Metrics & Interconnected Action Links Bar */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-black flex items-center gap-1.5">
                <span>النتائج المطابقة:</span>
                <b className="text-primary font-mono tabular-nums text-sm">{archiveRecords.length}</b>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-black flex items-center gap-1.5">
                <span>الطلاب المستقلين:</span>
                <b className="text-primary font-mono tabular-nums text-sm">{analytics.uniqueStudents}</b>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <span>نسبة النجاح:</span>
                <b className="tabular-nums text-sm">{analytics.passRate}%</b>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-black border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                <span>متوسط التحصيل:</span>
                <b className="tabular-nums text-sm">{analytics.averageMark}%</b>
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {(filterExamId !== "all" || filterGrade !== "all" || filterSectionId !== "all" || filterSubjectId !== "all" || filterStatus !== "all" || filterBracket !== "all" || filterApproval !== "all" || searchQuery) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  إعادة ضبط الفلاتر
                </button>
              )}

              <Link
                to="/exams/grades"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
                شبكة الرصد
              </Link>

              <Link
                to="/exams/reports"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-primary" />
                الكشف المجمع والشهادات
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RESPONSIVE FLUID TAB NAVIGATION STRIP (100% Zero-Scrollbar Design)        */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.01]"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>لوحة الداشبورد التحليلي للقياس</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("explorer")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "explorer"
                ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.01]"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>مستكشف وحافظة نتائج الطلاب الهيكلي</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'explorer' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
            }`}>
              فهرس شجري
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ledger")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "ledger"
                ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.01]"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>السجل الأرشيفي التراكمي للنتائج</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'ledger' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {archiveRecords.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sections")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "sections"
                ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.01]"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>مقارنة أداء الفصول والشعب</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'sections' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {analytics.sectionBreakdown.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("subjects")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "subjects"
                ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.01]"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>مصفوفة كفاءة المواد والفجوات المعرفية</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'subjects' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {analytics.subjectBreakdown.length}
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: ANALYTICS & MEASUREMENT DASHBOARD                                   */}
        {/* ========================================================================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Top 6 Interactive KPI Cards with Click-to-Filter Action Bridges */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {/* Total Records Card */}
              <button
                type="button"
                onClick={() => {
                  handleResetFilters();
                  setActiveTab("ledger");
                }}
                className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm text-center space-y-1 hover:-translate-y-1 hover:border-primary/40 transition-all cursor-pointer group text-right sm:text-center"
              >
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">إجمالي النتائج</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums group-hover:text-primary transition-colors">{analytics.totalExamined}</p>
                <p className="text-[10px] text-slate-500 font-bold">{analytics.uniqueStudents} طالب مستقل</p>
                <span className="text-[9px] font-extrabold text-primary block pt-0.5 opacity-80 group-hover:opacity-100">عرض السجل التراكمي ⬅</span>
              </button>

              {/* Pass Rate Card */}
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("passed");
                  setFilterBracket("all");
                  setActiveTab("ledger");
                  toast.success("تمت تصفية السجل لعرض كافة النتائج الناجحة");
                }}
                className={`bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 dark:from-emerald-950/40 dark:to-emerald-900/20 border rounded-2xl p-4 shadow-sm text-center space-y-1 hover:-translate-y-1 transition-all cursor-pointer group text-right sm:text-center ${
                  filterStatus === "passed" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400"
                }`}
              >
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">نسبة النجاح العامة</span>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{analytics.passRate}%</p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">{analytics.passedCount} نتيجة ناجحة</p>
                <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 block pt-0.5 opacity-80 group-hover:opacity-100">تصفية الناجحين ⬅</span>
              </button>

              {/* Average Mark Card */}
              <button
                type="button"
                onClick={() => {
                  setSortBy("pct");
                  setSortDirection("desc");
                  setActiveTab("ledger");
                  toast.success("تم ترتيب السجل التراكمي تنازلياً حسب نسبة التحصيل");
                }}
                className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/5 border border-primary/20 rounded-2xl p-4 shadow-sm text-center space-y-1 hover:-translate-y-1 hover:border-primary transition-all cursor-pointer group text-right sm:text-center"
              >
                <span className="text-[11px] font-bold text-primary block">متوسط التحصيل العام</span>
                <p className="text-2xl font-black text-primary tabular-nums">{analytics.averageMark}%</p>
                <p className="text-[10px] text-slate-500 font-bold">أعلى نتيجة: {analytics.highestMark}%</p>
                <span className="text-[9px] font-extrabold text-primary block pt-0.5 opacity-80 group-hover:opacity-100">ترتيب الدرجات ⬅</span>
              </button>

              {/* Distinctions Card */}
              <button
                type="button"
                onClick={() => {
                  setFilterBracket("distinction");
                  setFilterStatus("all");
                  setActiveTab("ledger");
                  toast.success("تمت تصفية السجل لعرض الطلاب المتفوقين (ممتاز ≥ 90%)");
                }}
                className={`bg-gradient-to-br from-amber-500/10 to-amber-500/5 dark:from-amber-950/40 dark:to-amber-900/20 border rounded-2xl p-4 shadow-sm text-center space-y-1 hover:-translate-y-1 transition-all cursor-pointer group text-right sm:text-center ${
                  filterBracket === "distinction" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-amber-200 dark:border-amber-800/60 hover:border-amber-400"
                }`}
              >
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">المتفوقون (ممتاز)</span>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">{analytics.distinctionCount}</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">نسبة ≥ 90% ⭐</p>
                <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 block pt-0.5 opacity-80 group-hover:opacity-100">كشف المتفوقين ⬅</span>
              </button>

              {/* At Risk Card */}
              <button
                type="button"
                onClick={() => {
                  setFilterStatus("failed");
                  setFilterBracket("all");
                  setActiveTab("ledger");
                  toast.warning("تمت تصفية السجل لعرض الطلاب المتعثرين (دور ثانٍ)");
                }}
                className={`bg-gradient-to-br from-rose-500/10 to-rose-500/5 dark:from-rose-950/40 dark:to-rose-900/20 border rounded-2xl p-4 shadow-sm text-center space-y-1 hover:-translate-y-1 transition-all cursor-pointer group text-right sm:text-center ${
                  filterStatus === "failed" ? "border-rose-500 ring-2 ring-rose-500/20" : "border-rose-200 dark:border-rose-800/60 hover:border-rose-400"
                }`}
              >
                <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block">المتعثرين (للمتابعة)</span>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums">{analytics.failedCount}</p>
                <p className="text-[10px] text-rose-700 dark:text-rose-300 font-bold">{analytics.atRiskStudents.length} طلاب بحاجة لدعم</p>
                <span className="text-[9px] font-extrabold text-rose-600 dark:text-rose-400 block pt-0.5 opacity-80 group-hover:opacity-100">قائمة المتعثرين ⬅</span>
              </button>

              {/* Control Approvals Card */}
              <button
                type="button"
                onClick={() => {
                  setFilterApproval("approved");
                  setActiveTab("ledger");
                  toast.info("تمت تصفية السجل لعرض النتائج المعتمدة كنترولياً");
                }}
                className={`bg-gradient-to-br from-blue-500/10 to-blue-500/5 dark:from-blue-950/40 dark:to-blue-900/20 border rounded-2xl p-4 shadow-sm text-center space-y-1 hover:-translate-y-1 transition-all cursor-pointer group text-right sm:text-center ${
                  filterApproval === "approved" ? "border-blue-500 ring-2 ring-blue-500/20" : "border-blue-200 dark:border-blue-800/60 hover:border-blue-400"
                }`}
              >
                <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 block">الاعتماد والنشر</span>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">{analytics.approvedPercentage}%</p>
                <p className="text-[10px] text-blue-700 dark:text-blue-300 font-bold">معتمد من الكنترول</p>
                <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 block pt-0.5 opacity-80 group-hover:opacity-100">فحص الاعتماد ⬅</span>
              </button>
            </div>

            {/* Visual Grade Distribution Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>التوزيع التكراري للتقديرات الأكاديمية عبر كافة النتائج المرصودة</span>
                </h3>
                <span className="text-xs text-slate-400 font-bold">إجمالي {analytics.totalExamined} نتيجة</span>
              </div>

              {/* Segmented Stacked Bar */}
              <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex p-0.5 border border-slate-200 dark:border-slate-700">
                <div 
                  style={{ width: `${analytics.totalExamined > 0 ? (analytics.distinctionCount / analytics.totalExamined) * 100 : 0}%` }} 
                  className="h-full bg-emerald-500 transition-all first:rounded-r-full last:rounded-l-full"
                  title={`ممتاز: ${analytics.distinctionCount}`}
                />
                <div 
                  style={{ width: `${analytics.totalExamined > 0 ? (analytics.veryGoodCount / analytics.totalExamined) * 100 : 0}%` }} 
                  className="h-full bg-blue-500 transition-all first:rounded-r-full last:rounded-l-full"
                  title={`جيد جداً: ${analytics.veryGoodCount}`}
                />
                <div 
                  style={{ width: `${analytics.totalExamined > 0 ? (analytics.goodCount / analytics.totalExamined) * 100 : 0}%` }} 
                  className="h-full bg-sky-500 transition-all first:rounded-r-full last:rounded-l-full"
                  title={`جيد: ${analytics.goodCount}`}
                />
                <div 
                  style={{ width: `${analytics.totalExamined > 0 ? (analytics.acceptableCount / analytics.totalExamined) * 100 : 0}%` }} 
                  className="h-full bg-amber-500 transition-all first:rounded-r-full last:rounded-l-full"
                  title={`مقبول: ${analytics.acceptableCount}`}
                />
                <div 
                  style={{ width: `${analytics.totalExamined > 0 ? (analytics.weakCount / analytics.totalExamined) * 100 : 0}%` }} 
                  className="h-full bg-rose-500 transition-all first:rounded-r-full last:rounded-l-full"
                  title={`ضعيف: ${analytics.weakCount}`}
                />
              </div>

              {/* Legend Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setFilterBracket("distinction");
                    setActiveTab("ledger");
                  }}
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>ممتاز: <b className="font-mono">{analytics.distinctionCount}</b> ({analytics.totalExamined > 0 ? Math.round((analytics.distinctionCount / analytics.totalExamined) * 100) : 0}%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterBracket("very_good");
                    setActiveTab("ledger");
                  }}
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>جيد جداً: <b className="font-mono">{analytics.veryGoodCount}</b> ({analytics.totalExamined > 0 ? Math.round((analytics.veryGoodCount / analytics.totalExamined) * 100) : 0}%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterBracket("good");
                    setActiveTab("ledger");
                  }}
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40 hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  <span>جيد: <b className="font-mono">{analytics.goodCount}</b> ({analytics.totalExamined > 0 ? Math.round((analytics.goodCount / analytics.totalExamined) * 100) : 0}%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterBracket("acceptable");
                    setActiveTab("ledger");
                  }}
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>مقبول: <b className="font-mono">{analytics.acceptableCount}</b> ({analytics.totalExamined > 0 ? Math.round((analytics.acceptableCount / analytics.totalExamined) * 100) : 0}%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterBracket("weak");
                    setActiveTab("ledger");
                  }}
                  className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40 col-span-2 sm:col-span-1 hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>ضعيف: <b className="font-mono">{analytics.weakCount}</b> ({analytics.totalExamined > 0 ? Math.round((analytics.weakCount / analytics.totalExamined) * 100) : 0}%)</span>
                </button>
              </div>
            </div>

            {/* Benchmarking Comparison Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Section Benchmarking Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-black">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">مقارنة أداء الشعب والفصول</h3>
                      <p className="text-[11px] text-slate-400 font-bold">قياس متوسطات درجات الشعب ونسب النجاح</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab("sections")}
                    className="text-xs font-black text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    عرض كافة الشعب ({analytics.sectionBreakdown.length}) <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {analytics.sectionBreakdown.slice(0, 5).map((sec, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                        const sObj = activeStageSections.find(s => s.stage === stage && normalizeGrade(s.grade) === normalizeGrade(sec.grade) && s.name === sec.sectionName);
                        if (sObj) {
                          setExplorerGrade(sec.grade);
                          setExplorerSectionId(sObj.id);
                          setActiveTab("explorer");
                        }
                      }}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2 hover:border-primary/40 hover:bg-slate-100/80 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 group-hover:text-primary transition-colors">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          {sec.grade} - شعبة {sec.sectionName}
                        </span>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-slate-400 font-bold">{sec.totalExamined} نتيجة</span>
                          <span className="text-emerald-600 font-black">{sec.passRate}% نجاح</span>
                          <span className="text-primary font-black text-sm">{sec.average}%</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, sec.average)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {analytics.sectionBreakdown.length === 0 && (
                    <div className="p-6 text-center text-slate-400 font-bold text-xs">
                      لا توجد بيانات متاحة للشعب وفق خيارات الفلترة المحددة.
                    </div>
                  )}
                </div>
              </div>

              {/* Subject Benchmarking Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-black">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">كفاءة المواد ونقاط القوة والضعف</h3>
                      <p className="text-[11px] text-slate-400 font-bold">ترتيب المواد حسب متوسط التحصيل ونسبة الاجتياز</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab("subjects")}
                    className="text-xs font-black text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    عرض كافة المواد ({analytics.subjectBreakdown.length}) <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {analytics.subjectBreakdown.slice(0, 5).map((sub, idx) => {
                    const isHigh = sub.average >= 75;
                    return (
                      <div 
                        key={idx} 
                        onClick={() => {
                          const subObj = activeStageSubjects.find(s => s.name === sub.subjectName);
                          if (subObj) {
                            setExplorerSubjectId(subObj.id);
                            setActiveTab("explorer");
                          }
                        }}
                        className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2 hover:border-purple-400 hover:bg-slate-100/80 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 group-hover:text-purple-600 transition-colors">
                            <span className={`w-2 h-2 rounded-full ${isHigh ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {sub.subjectName}
                          </span>
                          <div className="flex items-center gap-3 font-mono">
                            <span className="text-slate-400 font-bold">{sub.totalExamined} طالب</span>
                            <span className="text-emerald-600 font-black">{sub.passRate}% نجاح</span>
                            <span className="text-primary font-black text-sm">{sub.average}%</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isHigh ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(100, sub.average)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {analytics.subjectBreakdown.length === 0 && (
                    <div className="p-6 text-center text-slate-400 font-bold text-xs">
                      لا توجد بيانات متاحة للمواد وفق خيارات الفلترة المحددة.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Students Honor Roll & At-Risk Intervention Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Students Honor Roll */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">لوحة الشرف للأوائل المتفوقين</h3>
                      <p className="text-[11px] text-slate-400 font-bold">الطلاب الحاصلون على أعلى المعدلات التراكمية</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPrintTemplateId("honor_roll_report");
                      setIsPrintOpen(true);
                    }}
                    className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    طباعة لوحة الشرف
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {analytics.topStudents.slice(0, 6).map((st, idx) => (
                    <div key={st.studentId} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-base font-black">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                        </span>
                        <div>
                          <Link
                            to="/students/$id"
                            params={{ id: st.studentId }}
                            className="font-black text-xs text-slate-900 dark:text-white hover:text-primary transition-colors flex items-center gap-1"
                          >
                            <span>{st.studentName}</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </Link>
                          <span className="text-[10px] text-slate-400 font-bold block">
                            {st.grade} - شعبة {st.sectionName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-left font-mono">
                          <span className="text-sm font-black text-emerald-600">{st.overallPct}%</span>
                          <span className="text-[10px] text-slate-400 block font-bold">ممتاز مرتفع</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCareerStudentId(st.studentId);
                            setIsCareerOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-primary/10 text-slate-500 hover:text-primary transition-all cursor-pointer shadow-2xs"
                          title="السيرة الدراسية الشاملة"
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {analytics.topStudents.length === 0 && (
                    <div className="py-8 text-center text-slate-400 font-bold text-xs">
                      لا توجد بيانات للطلاب الأوائل وفق الفلاتر الحالية.
                    </div>
                  )}
                </div>
              </div>

              {/* At-Risk Intervention List */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-black">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">قائمة المتابعة والتدخل الأكاديمي</h3>
                      <p className="text-[11px] text-slate-400 font-bold">الطلاب الذين لم يجتازوا درجة النجاح في مادة أو أكثر</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPrintTemplateId("remedial_intervention_report");
                        setIsPrintOpen(true);
                      }}
                      className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      طباعة الخطة
                    </button>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-800">
                      {analytics.atRiskStudents.length} طالب
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                  {analytics.atRiskStudents.slice(0, 8).map(st => (
                    <div key={st.studentId} className="py-3 flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to="/students/$id"
                          params={{ id: st.studentId }}
                          className="font-black text-xs text-slate-900 dark:text-white hover:text-rose-600 transition-colors flex items-center gap-1"
                        >
                          <span>{st.studentName}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </Link>
                        <span className="text-[10px] text-slate-400 font-bold block">
                          {st.grade} - شعبة {st.sectionName}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {st.failedSubjects.map((sub, sIdx) => (
                            <span key={sIdx} className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-900">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setCareerStudentId(st.studentId);
                          setIsCareerOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                      >
                        السيرة الدراسية
                      </button>
                    </div>
                  ))}
                  {analytics.atRiskStudents.length === 0 && (
                    <div className="py-8 text-center text-emerald-600 font-bold text-xs flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <span>ممتاز! لا يوجد أي طلاب متعثرين في نتائج الفلاتر المحددة.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: HIERARCHICAL REPOSITORY (EXAM -> GRADE -> SECTION -> SUBJECT)        */}
        {/* ========================================================================= */}
        {activeTab === "explorer" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">حافظة ومستكشف نتائج الطلاب الهيكلي</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                      أرشيف الشجرة المدرسية
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    تنقل مرن وسريع عبر مستويات: الامتحان ⬅ الصف الدراسي ⬅ الشعبة ⬅ المادة للرجوع لدرجات الطلاب المحفوظة
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleExportExplorerCsv}
                    disabled={explorerRoster.length === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 font-bold text-xs text-slate-700 dark:text-slate-200 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>تصدير كشف الشعبة (CSV)</span>
                  </button>

                  <Link
                    to="/exams/grades"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>الانتقال لرصد الدرجات</span>
                  </Link>
                </div>
              </div>

              {/* Active Drill-Down Path Breadcrumb Trail */}
              <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <span className="text-slate-400">المسار الأكاديمي النشط:</span>
                <span className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary font-black">
                  {examsMap.get(activeExplorerExamId)?.name || "الامتحان"}
                </span>
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                <span className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary font-black">
                  {activeExplorerGrade}
                </span>
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                <span className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary font-black">
                  شعبة {activeStageSections.find(s => s.id === activeExplorerSectionId)?.name || "1"}
                </span>
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-black border border-emerald-200 dark:border-emerald-800">
                  {subjectsMap.get(selectedExamSubject?.subjectId || "")?.name || "المادة"}
                </span>
              </div>

              {/* 4-Tier Cascade Interactive Selectors (Zero Scrollbar, Fully Responsive Wrapping) */}
              <div className="space-y-4">
                {/* 1. Exam Level */}
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>1. اختر الامتحان أو الفترة التقويمية:</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {availableExams.map(ex => {
                      const isSelected = ex.id === activeExplorerExamId;
                      return (
                        <button
                          key={ex.id}
                          type="button"
                          onClick={() => {
                            setExplorerExamId(ex.id);
                            setExplorerSubjectId("");
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary text-white shadow-md shadow-primary/25 ring-2 ring-primary/30 scale-[1.02]"
                              : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <span>{ex.name}</span>
                          <span className="text-[10px] opacity-80 mr-1.5 font-normal">({ex.term})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Grade Level */}
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span>2. اختر الصف الدراسي:</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {stageGrades.map(gr => {
                      const isSelected = normalizeGrade(gr) === normalizeGrade(activeExplorerGrade);
                      return (
                        <button
                          key={gr}
                          type="button"
                          onClick={() => {
                            setExplorerGrade(gr);
                            setExplorerSectionId("");
                            setExplorerSubjectId("");
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary text-white shadow-md shadow-primary/25 ring-2 ring-primary/30 scale-[1.02]"
                              : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          {gr}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Section Level */}
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span>3. اختر الشعبة الدراسية:</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {explorerSections.map(sec => {
                      const isSelected = sec.id === activeExplorerSectionId;
                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => setExplorerSectionId(sec.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary text-white shadow-md shadow-primary/25 ring-2 ring-primary/30 scale-[1.02]"
                              : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          شعبة {sec.name}
                        </button>
                      );
                    })}
                    {explorerSections.length === 0 && (
                      <span className="text-xs text-slate-400 italic">لا توجد شعب مسجلة لهذا الصف.</span>
                    )}
                  </div>
                </div>

                {/* 4. Subject Level */}
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    <span>4. اختر المادة الدراسية لعرض كشف نتائج الطلاب:</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {explorerSubjects.map(sub => {
                      const isSelected = sub.id === activeExplorerSubjectId;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setExplorerSubjectId(sub.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary text-white shadow-md shadow-primary/25 ring-2 ring-primary/30 scale-[1.02]"
                              : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          {sub.name}
                        </button>
                      );
                    })}
                    {explorerSubjects.length === 0 && (
                      <span className="text-xs text-slate-400 italic">لا توجد مواد مضافة لهذا الامتحان في هذا الصف.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Subject Roster Card */}
            {selectedExamSubject ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shadow-sm shrink-0">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-lg font-black text-slate-900 dark:text-white">
                          {subjectsMap.get(selectedExamSubject.subjectId)?.name || selectedExamSubject.subjectId}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {activeExplorerGrade} • شعبة {activeStageSections.find(s => s.id === activeExplorerSectionId)?.name || "1"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-bold mt-0.5">
                        {examsMap.get(selectedExamSubject.examId)?.name} • النهاية العظمى: <b className="text-slate-800 dark:text-slate-200">{selectedExamSubject.maxScore}</b> • درجة النجاح: <b className="text-slate-800 dark:text-slate-200">{selectedExamSubject.passScore}</b>
                      </p>
                    </div>
                  </div>

                  {/* Search in Section */}
                  <div className="relative w-full md:w-64">
                    <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={explorerSearch}
                      onChange={e => setExplorerSearch(e.target.value)}
                      placeholder="بحث في طلاب الشعبة..."
                      className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pr-9 pl-3 text-xs font-bold focus:border-primary outline-none"
                    />
                  </div>
                </div>

                {/* 4 Measurement KPI Mini-Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center space-y-1">
                    <span className="text-[11px] font-bold text-slate-500">طلاب الشعبة المرصودين</span>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{explorerStats.total}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{explorerStats.passed} طالب ناجح</p>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center space-y-1">
                    <span className="text-[11px] font-bold text-slate-500">نسبة الاجتياز</span>
                    <p className="text-2xl font-black text-emerald-600 tabular-nums">{explorerStats.passRate}%</p>
                    <p className="text-[10px] text-emerald-600 font-bold">معيار النجاح ≥ {selectedExamSubject.passScore}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center space-y-1">
                    <span className="text-[11px] font-bold text-slate-500">متوسط درجات الشعبة</span>
                    <p className="text-2xl font-black text-primary tabular-nums">{explorerStats.avg}</p>
                    <p className="text-[10px] text-slate-500 font-bold">من أصل {selectedExamSubject.maxScore} درجة</p>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center space-y-1">
                    <span className="text-[11px] font-bold text-slate-500">المدى (أعلى / أدنى)</span>
                    <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                      {explorerStats.max} <span className="text-xs text-slate-400 font-normal">/ {explorerStats.min}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold">فارق {explorerStats.max - explorerStats.min} درجة</p>
                  </div>
                </div>

                {/* Student Results Table for this subject */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        <tr>
                          <th className="p-3 w-12 text-center">الترتيب</th>
                          <th className="p-3">اسم الطالب رباعياً</th>
                          <th className="p-3 w-32 text-center">الرقم الأكاديمي</th>
                          <th className="p-3 w-32 text-center">الدرجة المحصلة</th>
                          <th className="p-3 w-28 text-center">نسبة الإنجاز</th>
                          <th className="p-3 w-28 text-center">الحالة</th>
                          <th className="p-3 w-40 text-center">السيرة الدراسية الشاملة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {explorerRoster.map((r, idx) => (
                          <tr key={r.student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-3 text-center font-bold text-slate-400">
                              {idx === 0 ? "🥇 1" : idx === 1 ? "🥈 2" : idx === 2 ? "🥉 3" : idx + 1}
                            </td>
                            <td className="p-3">
                              <Link
                                to="/students/$id"
                                params={{ id: r.student.id }}
                                className="font-bold text-sm text-slate-900 dark:text-white hover:text-primary transition-colors flex items-center gap-1.5"
                              >
                                <span>{r.student.name}</span>
                                <ExternalLink className="w-3 h-3 opacity-50" />
                              </Link>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-400 tabular-nums" dir="ltr">
                              {r.student.nationalId}
                            </td>
                            <td className="p-3 text-center">
                              <span className="font-black text-base text-slate-900 dark:text-white tabular-nums">{r.mark}</span>
                              <span className="text-[10px] text-slate-400 font-bold mr-1">/ {r.maxScore}</span>
                            </td>
                            <td className="p-3 text-center font-black text-primary tabular-nums" dir="ltr">
                              <div className="flex flex-col items-center gap-1">
                                <span>{r.pct.toFixed(1)}%</span>
                                <div className="h-1.5 w-16 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${r.isPassed ? "bg-primary" : "bg-rose-500"}`}
                                    style={{ width: `${Math.min(100, r.pct)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center font-black">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                r.isPassed
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800"
                                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-800"
                              }`}>
                                {r.isPassed ? "ناجح ✓" : "راسب ✗"}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setCareerStudentId(r.student.id);
                                  setIsCareerOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary text-primary hover:text-white font-bold text-xs transition-all shadow-2xs cursor-pointer"
                              >
                                <GraduationCap className="w-3.5 h-3.5" />
                                <span>السيرة الدراسية</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                        {explorerRoster.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 font-bold text-xs">
                              لا توجد نتائج مسجلة أو طلاب مطابقين في هذه الشعبة للمادة المختارة.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl bg-white dark:bg-slate-900 text-slate-400 font-bold text-xs space-y-2">
                <FileText className="w-10 h-10 mx-auto opacity-40" />
                <p>يرجى اختيار الامتحان والصف والشعبة والمادة من القوائم الهيكلية أعلاه لعرض وحفظ نتائج الطلاب.</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: COMPREHENSIVE SAVED RESULTS ARCHIVE LEDGER                          */}
        {/* ========================================================================= */}
        {activeTab === "ledger" && (
          <div className="space-y-4">
            {/* Search & Sort Tool Strip */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full sm:max-w-md">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setLedgerCurrentPage(1);
                  }}
                  placeholder="بحث في الأرشيف باسم الطالب أو الرقم الأكاديمي..."
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pr-9 pl-4 text-xs font-bold focus:border-primary outline-none"
                />
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-bold">ترتيب:</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-xs outline-none"
                  >
                    <option value="mark">الدرجة</option>
                    <option value="pct">النسبة المئوية</option>
                    <option value="student">اسم الطالب</option>
                    <option value="grade">الصف</option>
                    <option value="subject">المادة</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setSortDirection(prev => prev === "desc" ? "asc" : "desc")}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    title={sortDirection === "desc" ? "تنازلي" : "تصاعدي"}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-bold">الاعتماد:</span>
                  <select
                    value={filterApproval}
                    onChange={e => setFilterApproval(e.target.value as any)}
                    className="h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-xs outline-none"
                  >
                    <option value="all">كافة الحالات</option>
                    <option value="approved">معتمد ✅</option>
                    <option value="published">منشور 🌐</option>
                    <option value="draft">مسودة 📝</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  تصدير الكشف
                </button>
              </div>
            </div>

            {/* Quick Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500">
              <div className="flex items-center gap-3">
                <span>
                  عرض <b className="text-slate-900 dark:text-white tabular-nums">{ledgerPageSize === 0 ? 1 : (safeLedgerPage - 1) * ledgerPageSize + 1}</b> - <b className="text-slate-900 dark:text-white tabular-nums">{ledgerPageSize === 0 ? archiveRecords.length : Math.min(safeLedgerPage * ledgerPageSize, archiveRecords.length)}</b> من أصل <b className="text-slate-900 dark:text-white tabular-nums">{archiveRecords.length}</b> نتيجة
                </span>

                <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-3">
                  <span className="text-[11px]">النتائج/صفحة:</span>
                  {[15, 25, 50, 100, 0].map(sz => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setLedgerPageSize(sz);
                        setLedgerCurrentPage(1);
                      }}
                      className={`px-2 py-0.5 rounded-md text-xs font-black transition-all cursor-pointer ${
                        ledgerPageSize === sz
                          ? "bg-primary text-white shadow-2xs"
                          : "bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300"
                      }`}
                    >
                      {sz === 0 ? "الكل" : sz}
                    </button>
                  ))}
                </div>
              </div>

              {ledgerPageSize > 0 && totalLedgerPages > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    disabled={safeLedgerPage === 1}
                    onClick={() => setLedgerCurrentPage(1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30 transition-all cursor-pointer"
                    title="الصفحة الأولى"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={safeLedgerPage === 1}
                    onClick={() => setLedgerCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30 transition-all cursor-pointer"
                    title="الصفحة السابقة"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-black text-xs">
                    صفحة {safeLedgerPage} من {totalLedgerPages}
                  </span>

                  <button
                    type="button"
                    disabled={safeLedgerPage === totalLedgerPages}
                    onClick={() => setLedgerCurrentPage(prev => Math.min(totalLedgerPages, prev + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30 transition-all cursor-pointer"
                    title="الصفحة التالية"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={safeLedgerPage === totalLedgerPages}
                    onClick={() => setLedgerCurrentPage(totalLedgerPages)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-30 transition-all cursor-pointer"
                    title="الصفحة الأخيرة"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Archive Data Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3">اسم الطالب رباعياً</th>
                      <th className="p-3 w-28 text-center">الرقم الأكاديمي</th>
                      <th className="p-3 w-28 text-center">الصف والشعبة</th>
                      <th className="p-3">فترة الامتحان</th>
                      <th className="p-3">المادة الدراسية</th>
                      <th className="p-3 w-28 text-center">الدرجة المحصلة</th>
                      <th className="p-3 w-24 text-center">النسبة المئوية</th>
                      <th className="p-3 w-28 text-center">حالة النتيجة</th>
                      <th className="p-3 w-24 text-center">الاعتماد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedArchiveRecords.map((row, idx) => {
                      const globalIdx = (ledgerPageSize === 0 ? 0 : (safeLedgerPage - 1) * ledgerPageSize) + idx;
                      return (
                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3 text-center font-bold text-slate-400">
                            {globalIdx + 1}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-between gap-2">
                              <Link
                                to="/students/$id"
                                params={{ id: row.studentId }}
                                className="font-bold text-sm text-slate-900 dark:text-white hover:text-primary transition-colors flex items-center gap-1.5"
                              >
                                <span>{row.studentName}</span>
                                <ExternalLink className="w-3 h-3 opacity-50" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  setCareerStudentId(row.studentId);
                                  setIsCareerOpen(true);
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-primary/10 text-slate-500 hover:text-primary transition-all cursor-pointer shadow-2xs"
                                title="عرض السيرة الدراسية الشاملة للطالب"
                              >
                                <GraduationCap className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-400 tabular-nums" dir="ltr">
                            {row.nationalId}
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-bold text-slate-900 dark:text-white block">{row.grade}</span>
                            <span className="text-[10px] text-slate-400 font-bold">شعبة {row.sectionName}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 dark:text-white block">{row.examName}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{row.examTerm}</span>
                          </td>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                            {row.subjectName}
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-black text-sm text-slate-900 dark:text-white">{row.mark}</span>
                            <span className="text-[10px] text-slate-400 font-bold mr-1">/ {row.maxScore}</span>
                          </td>
                          <td className="p-3 text-center font-black text-primary tabular-nums">
                            {row.percentage.toFixed(1)}%
                          </td>
                          <td className="p-3 text-center font-black">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                              row.isPassed 
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200 dark:border-emerald-800" 
                                : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200 dark:border-rose-800"
                            }`}>
                              {row.isPassed ? "ناجح ✓" : "راسب ✗"}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              row.status === "published"
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40"
                                : row.status === "approved"
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                            }`}>
                              {row.status === "published" ? "منشور 🌐" : row.status === "approved" ? "معتمد ✅" : "مسودة 📝"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {archiveRecords.length === 0 && (
                      <tr>
                        <td colSpan={10} className="p-12 text-center text-slate-400 font-bold text-xs">
                          لا توجد نتائج محفوظة تطابق الفلاتر وخيارات البحث المحددة.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SECTIONS BENCHMARKING COMPARISON                                    */}
        {/* ========================================================================= */}
        {activeTab === "sections" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span>المصفوفة التحليلية المقارنة لأداء الشعب والفصول الدراسية</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">
                    مقارنة دقيقة في معدلات التحصيل، نسب الاجتياز والرسوب، والتفوق بين كافة شعب الصفوف
                  </p>
                </div>

                {/* Grade Quick Filter Bar */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                  <span className="text-slate-400 ml-1">تصفية حسب الصف:</span>
                  <button
                    type="button"
                    onClick={() => setSectionsGradeFilter("all")}
                    className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                      sectionsGradeFilter === "all"
                        ? "bg-primary text-white shadow-2xs font-black"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    كافة الصفوف
                  </button>
                  {stageGrades.map(gr => (
                    <button
                      key={gr}
                      type="button"
                      onClick={() => setSectionsGradeFilter(gr)}
                      className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                        sectionsGradeFilter === gr
                          ? "bg-primary text-white shadow-2xs font-black"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      {gr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.sectionBreakdown
                .filter(sec => sectionsGradeFilter === "all" || normalizeGrade(sec.grade) === normalizeGrade(sectionsGradeFilter))
                .map(sec => (
                  <div key={sec.key} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-primary/50 transition-all space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-base font-black text-slate-900 dark:text-white">
                          شعبة {sec.sectionName}
                        </h4>
                        <span className="text-xs font-bold text-primary block mt-0.5">
                          {sec.grade}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-primary/10 text-primary">
                        متوسط {sec.average}%
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-500">
                        <span>نسبة النجاح العامة</span>
                        <span className="text-emerald-600 font-black">{sec.passRate}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${sec.passRate}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500">
                      <div>
                        النتائج: <b className="text-slate-900 dark:text-white font-mono">{sec.totalExamined}</b>
                      </div>
                      <div className="text-left">
                        المستوى: <b className={sec.average >= 75 ? "text-emerald-600" : "text-amber-600"}>{sec.average >= 75 ? "متميز ⭐" : "متوسط 🟡"}</b>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const sObj = activeStageSections.find(s => s.stage === stage && normalizeGrade(s.grade) === normalizeGrade(sec.grade) && s.name === sec.sectionName);
                          if (sObj) {
                            setExplorerGrade(sec.grade);
                            setExplorerSectionId(sObj.id);
                            setActiveTab("explorer");
                            toast.success(`تم الانتقال إلى مستكشف نتائج شعبة ${sec.sectionName} (${sec.grade})`);
                          }
                        }}
                        className="text-primary font-black hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        استعراض الشعبة في المستكشف ⬅
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const sObj = activeStageSections.find(s => s.stage === stage && normalizeGrade(s.grade) === normalizeGrade(sec.grade) && s.name === sec.sectionName);
                          setFilterGrade(sec.grade);
                          if (sObj) setFilterSectionId(sObj.id);
                          setActiveTab("ledger");
                        }}
                        className="text-slate-500 hover:text-slate-800 font-bold hover:underline cursor-pointer"
                      >
                        عرض في السجل
                      </button>
                    </div>
                  </div>
                ))}
              {analytics.sectionBreakdown.length === 0 && (
                <div className="col-span-3 p-12 text-center text-slate-400 font-bold text-xs bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                  لا توجد نتائج مسجلة للشعب وفق معايير الفلترة المحددة.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SUBJECTS BENCHMARKING & COMPETENCY                                  */}
        {/* ========================================================================= */}
        {activeTab === "subjects" && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span>مصفوفة قياس كفاءة المواد الدراسية وتحليل الفجوات المعرفية</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">
                    ترتيب كافة المواد الدراسية لتحديد نقاط القوة التعليمية والمواد التي تتطلب برامج علاجية
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setSubjectsFilterType("all")}
                    className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                      subjectsFilterType === "all"
                        ? "bg-primary text-white shadow-2xs font-black"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    كافة المواد ({analytics.subjectBreakdown.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubjectsFilterType("strength")}
                    className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                      subjectsFilterType === "strength"
                        ? "bg-emerald-600 text-white shadow-2xs font-black"
                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                    }`}
                  >
                    نقاط القوة (≥ 75%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubjectsFilterType("remedial")}
                    className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                      subjectsFilterType === "remedial"
                        ? "bg-amber-600 text-white shadow-2xs font-black"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
                    }`}
                  >
                    برامج علاجية (&lt; 75%)
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.subjectBreakdown
                .filter(sub => {
                  if (subjectsFilterType === "strength") return sub.average >= 75;
                  if (subjectsFilterType === "remedial") return sub.average < 75;
                  return true;
                })
                .map(sub => {
                  const isStrong = sub.average >= 75;
                  return (
                    <div key={sub.subjectName} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-primary/50 transition-all space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-base font-black text-slate-900 dark:text-white">{sub.subjectName}</h4>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md mt-1 inline-block ${
                            isStrong ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600" : "bg-amber-50 dark:bg-amber-950/40 text-amber-600"
                          }`}>
                            {isStrong ? "مادة ذات تحصيل مرتفع (نقطة قوة)" : "تتطلب خطة دعم وتعزيز"}
                          </span>
                        </div>
                        <span className="text-sm font-mono font-black text-primary">
                          {sub.average}%
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-500">
                          <span>نسبة الاجتياز</span>
                          <span className="text-emerald-600 font-black">{sub.passRate}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isStrong ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${sub.passRate}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>إجمالي الطلاب: <b className="text-slate-900 dark:text-white font-mono">{sub.totalExamined}</b></span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const subObj = activeStageSubjects.find(s => s.name === sub.subjectName);
                              if (subObj) {
                                setExplorerSubjectId(subObj.id);
                                setActiveTab("explorer");
                                toast.success(`تم الانتقال إلى كشف نتائج مادة ${sub.subjectName}`);
                              }
                            }}
                            className="text-primary font-black hover:underline cursor-pointer"
                          >
                            عرض في المستكشف ←
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {analytics.subjectBreakdown.length === 0 && (
                <div className="col-span-3 p-12 text-center text-slate-400 font-bold text-xs bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
                  لا توجد نتائج مسجلة للمواد وفق معايير الفلترة المحددة.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Advanced Print Engine Modal for Official Ministerial Reports */}
      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        templates={[officialReportTemplate, honorRollTemplate, atRiskRemedialTemplate]}
        defaultTemplateId={selectedPrintTemplateId}
        data={archiveRecords}
      />

      {/* Student Academic Career Modal */}
      <AcademicCareerModal
        isOpen={isCareerOpen}
        onClose={() => setIsCareerOpen(false)}
        studentId={careerStudentId}
      />
    </AppShell>
  );
}
