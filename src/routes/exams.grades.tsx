import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore, ExamResult, ExamSubject, Exam, ExamGradePolicy } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage } from "@/lib/school-structure";
import { BatchCertificatesModal } from "@/components/batch-certificates-modal";
import { 
  Search, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Sliders, 
  SlidersHorizontal,
  Calculator, 
  Layers, 
  Award, 
  FileSpreadsheet, 
  Printer, 
  RotateCcw, 
  Check, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  TrendingUp, 
  Users, 
  BookOpen, 
  GraduationCap, 
  ArrowUpDown, 
  Filter, 
  X, 
  Info, 
  Download, 
  ShieldCheck, 
  RefreshCw,
  Trophy,
  Percent,
  Hash,
  Scale
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/exams/grades")({
  component: ExamGradesPage,
  head: () => ({ meta: [{ title: "رصد الدرجات وكشوف الحصر اليدوي والشهادات" }] })
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

function ExamGradesPage() {
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
    saveExamResults,
    approveExamResults,
    updateSingleExamResult,
    getExamGradePolicy,
    saveExamGradePolicy
  } = useGlobalStore();

  const stageArabicName = useMemo(() => getStageArabicName(stage), [stage]);

  // Tab State: "single" = رصد مادة, "roster" = كشف رصد شامل, "weighted" = كشف المحصلة, "rules" = استوديو القواعد
  const [activeTab, setActiveTab] = useState<"single" | "roster" | "weighted" | "rules">("single");

  // Batch Certificates Modal
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certModalConfig, setCertModalConfig] = useState<{
    examId?: string;
    grade?: string;
    sectionId?: string;
    studentIds?: string[];
  }>({});

  // --------------------------------------------------------------------------
  // TAB 1 (Single Subject Grading Grid) STATE
  // --------------------------------------------------------------------------
  const [filterExamId, setFilterExamId] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterSectionId, setFilterSectionId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState<Record<string, Partial<ExamResult>>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Available grades for the active stage
  const stageGrades = useMemo(() => getGradesForStage(stage), [stage]);

  // Default active exam
  useEffect(() => {
    if (activeStageExams.length > 0 && !filterExamId) {
      setFilterExamId(activeStageExams[0].id);
    }
  }, [activeStageExams, filterExamId]);

  // Default active grade
  useEffect(() => {
    if (stageGrades.length > 0 && !filterGrade) {
      setFilterGrade(stageGrades[0]);
    }
  }, [stageGrades, filterGrade]);

  const selectedExam = useMemo(() => activeStageExams.find(e => e.id === filterExamId), [activeStageExams, filterExamId]);

  const applicableExamSubjects = useMemo(() => {
    if (!selectedExam) return [];
    return activeStageExamSubjects.filter(es => {
      if (es.examId !== selectedExam.id) return false;
      if (filterGrade && normalizeGrade(es.grade) !== normalizeGrade(filterGrade)) return false;
      return true;
    });
  }, [activeStageExamSubjects, selectedExam, filterGrade]);

  // Default active subject
  useEffect(() => {
    if (applicableExamSubjects.length > 0) {
      if (!filterSubjectId || !applicableExamSubjects.some(es => es.id === filterSubjectId)) {
        setFilterSubjectId(applicableExamSubjects[0].id);
      }
    } else {
      setFilterSubjectId("");
    }
  }, [applicableExamSubjects, filterSubjectId]);

  const selectedExamSubject = useMemo(() => applicableExamSubjects.find(es => es.id === filterSubjectId), [applicableExamSubjects, filterSubjectId]);

  const applicableSections = useMemo(() => {
    if (!filterGrade) return [];
    return activeStageSections.filter(s => normalizeGrade(s.grade) === normalizeGrade(filterGrade));
  }, [activeStageSections, filterGrade]);

  // Default active section
  useEffect(() => {
    if (applicableSections.length > 0) {
      if (!filterSectionId || !applicableSections.some(s => s.id === filterSectionId)) {
        setFilterSectionId(applicableSections[0].id);
      }
    } else {
      setFilterSectionId("");
    }
  }, [applicableSections, filterSectionId]);

  const selectedSection = useMemo(() => applicableSections.find(s => s.id === filterSectionId), [applicableSections, filterSectionId]);

  // Students in selected section
  const studentsInSection = useMemo(() => {
    if (!selectedSection) return [];
    const enrollments = allStudentEnrollments.filter(e => e.academicYearId === currentAcademicYearId && e.sectionId === selectedSection.id);
    return enrollments.map(enr => {
      const student = activeStageStudents.find(s => s.id === enr.studentId);
      return student ? { student, enrollment: enr } : null;
    }).filter(Boolean) as { student: any; enrollment: any }[];
  }, [selectedSection, allStudentEnrollments, currentAcademicYearId, activeStageStudents]);

  // Visible filtered students in Tab 1
  const visibleStudents = useMemo(() => {
    const query = studentSearch.trim();
    if (!query) return studentsInSection;
    return studentsInSection.filter(s => (
      s.student.name.includes(query) ||
      s.student.nationalId.includes(query)
    ));
  }, [studentSearch, studentsInSection]);

  // Load existing results into local state
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

  const handleMarkChange = (enrollmentId: string, markStr: string) => {
    let numMark = Number(markStr);
    if (isNaN(numMark)) numMark = 0;
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

  const handleSaveMarks = () => {
    if (!selectedExamSubject) return;
    setIsSaving(true);
    
    const resultsToSave: Omit<ExamResult, "id">[] = studentsInSection.map(item => ({
      examSubjectId: selectedExamSubject.id,
      studentEnrollmentId: item.enrollment.id,
      mark: studentResults[item.enrollment.id]?.mark ?? 0,
      notes: studentResults[item.enrollment.id]?.notes,
      status: "submitted",
    }));

    setTimeout(() => {
      try {
        saveExamResults(resultsToSave);
        toast.success("تم حفظ واعتماد الدرجات بنجاح");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذر حفظ الدرجات");
      } finally {
        setIsSaving(false);
      }
    }, 350);
  };

  const handleQuickApproveAll = () => {
    if (!selectedExamSubject || studentsInSection.length === 0) return;
    const enrollmentIds = new Set(studentsInSection.map(s => s.enrollment.id));
    approveExamResults("approved", "المشرف الأكاديمي", {
      targetExamSubjectIds: new Set([selectedExamSubject.id]),
      targetEnrollmentIds: enrollmentIds
    });
    setStudentResults(prev => {
      const updated = { ...prev };
      studentsInSection.forEach(item => {
        if (updated[item.enrollment.id]) {
          updated[item.enrollment.id] = { ...updated[item.enrollment.id], status: "approved" };
        }
      });
      return updated;
    });
    toast.success("تم اعتماد جميع درجات الشعبة بنجاح");
  };

  const handleAutoFillFullMarks = () => {
    if (!selectedExamSubject) return;
    setStudentResults(prev => {
      const updated = { ...prev };
      studentsInSection.forEach(item => {
        updated[item.enrollment.id] = {
          ...updated[item.enrollment.id],
          mark: selectedExamSubject.maxScore,
          status: "submitted"
        };
      });
      return updated;
    });
    toast.info("تم ملء الدرجات بالدرجة الكاملة");
  };

  // Tab 1 Stats
  const tab1Stats = useMemo(() => {
    if (!selectedExamSubject || studentsInSection.length === 0) return null;
    const marks = Object.values(studentResults).map(r => r.mark || 0);
    const sum = marks.reduce((a,b) => a+b, 0);
    const avg = sum / (marks.length || 1);
    const max = Math.max(...marks, 0);
    const min = Math.min(...marks, selectedExamSubject.maxScore);
    const passed = marks.filter(m => m >= selectedExamSubject.passScore).length;
    const entered = Object.values(studentResults).filter(r => (r.mark || 0) > 0).length;
    return { avg, max, min, passed, total: marks.length, entered, passRate: marks.length ? Math.round((passed / marks.length) * 100) : 0 };
  }, [studentResults, selectedExamSubject, studentsInSection]);

  // --------------------------------------------------------------------------
  // TAB 2 (Comprehensive Roster & Pivot Table) STATE
  // --------------------------------------------------------------------------
  const [rosterExamId, setRosterExamId] = useState(filterExamId);
  const [rosterGrade, setRosterGrade] = useState(filterGrade);
  const [rosterSectionId, setRosterSectionId] = useState("all");
  const [rosterSearch, setRosterSearch] = useState("");

  useEffect(() => { if (filterExamId && !rosterExamId) setRosterExamId(filterExamId); }, [filterExamId, rosterExamId]);
  useEffect(() => { if (filterGrade && !rosterGrade) setRosterGrade(filterGrade); }, [filterGrade, rosterGrade]);

  const rosterExamSubjects = useMemo(() => {
    if (!rosterExamId) return [];
    return activeStageExamSubjects.filter(es => {
      if (es.examId !== rosterExamId) return false;
      if (rosterGrade && normalizeGrade(es.grade) !== normalizeGrade(rosterGrade)) return false;
      return true;
    });
  }, [activeStageExamSubjects, rosterExamId, rosterGrade]);

  const rosterStudents = useMemo(() => {
    if (!rosterGrade) return [];
    const gradeSections = activeStageSections.filter(s => normalizeGrade(s.grade) === normalizeGrade(rosterGrade));
    const targetSectionIds = rosterSectionId === "all" ? new Set(gradeSections.map(s => s.id)) : new Set([rosterSectionId]);
    const enrollments = allStudentEnrollments.filter(e => e.academicYearId === currentAcademicYearId && targetSectionIds.has(e.sectionId));
    
    return enrollments.map(enr => {
      const student = activeStageStudents.find(s => s.id === enr.studentId);
      const section = gradeSections.find(s => s.id === enr.sectionId);
      if (!student) return null;

      // Map marks for each exam subject
      let totalEarned = 0;
      let totalMax = 0;
      let failedCount = 0;
      const subjectMarks: Record<string, { mark: number; maxScore: number; passScore: number; isPass: boolean }> = {};

      rosterExamSubjects.forEach(es => {
        const res = allExamResults.find(r => r.examSubjectId === es.id && r.studentEnrollmentId === enr.id);
        const mark = res?.mark ?? 0;
        const isPass = mark >= es.passScore;
        if (!isPass) failedCount++;
        totalEarned += mark;
        totalMax += es.maxScore;
        subjectMarks[es.id] = { mark, maxScore: es.maxScore, passScore: es.passScore, isPass };
      });

      const percentage = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
      const isOverallPass = percentage >= 50 && failedCount === 0;

      // Ministerial rule: rating is strictly on cumulative total
      let descriptiveRating: "ممتاز" | "جيد جداً" | "جيد" | "مقبول" | "ضعيف" = "ضعيف";
      if (percentage >= 90) descriptiveRating = "ممتاز";
      else if (percentage >= 80) descriptiveRating = "جيد جداً";
      else if (percentage >= 65) descriptiveRating = "جيد";
      else if (percentage >= 50) descriptiveRating = "مقبول";

      return {
        student,
        enrollment: enr,
        section,
        subjectMarks,
        totalEarned,
        totalMax,
        percentage,
        isOverallPass,
        descriptiveRating,
        failedCount
      };
    }).filter(Boolean) as {
      student: any;
      enrollment: any;
      section: any;
      subjectMarks: Record<string, { mark: number; maxScore: number; passScore: number; isPass: boolean }>;
      totalEarned: number;
      totalMax: number;
      percentage: number;
      isOverallPass: boolean;
      descriptiveRating: string;
      failedCount: number;
    }[];
  }, [rosterGrade, activeStageSections, rosterSectionId, allStudentEnrollments, currentAcademicYearId, activeStageStudents, rosterExamSubjects, allExamResults]);

  const filteredRosterStudents = useMemo(() => {
    const q = rosterSearch.trim();
    if (!q) return rosterStudents;
    return rosterStudents.filter(r => r.student.name.includes(q) || r.student.nationalId.includes(q));
  }, [rosterSearch, rosterStudents]);

  // --------------------------------------------------------------------------
  // TAB 4 (ENGINEERING STUDIO & LIVE RECALCULATION PREVIEW) STATE
  // --------------------------------------------------------------------------
  const [policyExamId, setPolicyExamId] = useState<string>("all");
  const [policyGrade, setPolicyGrade] = useState<string>("all");

  // Core Policy Parameters
  const [calculationMode, setCalculationMode] = useState<"raw" | "weighted" | "equal_average" | "custom_scale">("weighted");
  const [targetScale, setTargetScale] = useState<number>(100);
  const [minPassPct, setMinPassPct] = useState<number>(50);
  const [aggregationStrategy, setAggregationStrategy] = useState<"cumulative_sum" | "final_plus_coursework" | "best_attempt" | "drop_lowest">("cumulative_sum");
  const [roundingMode, setRoundingMode] = useState<"round" | "ceil" | "1_decimal">("round");
  const [ratingBoundaries, setRatingBoundaries] = useState<{
    excellent: number;
    veryGood: number;
    good: number;
    pass: number;
  }>({
    excellent: 90,
    veryGood: 80,
    good: 65,
    pass: 50,
  });

  // Strategy Specific Controls
  const [courseworkRatio, setCourseworkRatio] = useState<number>(40);
  const [finalExamRatio, setFinalExamRatio] = useState<number>(60);
  const [dropLowestCount, setDropLowestCount] = useState<number>(1);

  // Period / Exam Specific Customizations
  const [customExamWeights, setCustomExamWeights] = useState<Record<string, number>>({});
  const [customExamRoles, setCustomExamRoles] = useState<Record<string, "coursework" | "final" | "periodic">>({});
  const [excludedExamIds, setExcludedExamIds] = useState<Set<string>>(new Set());
  const [lockedExamWeights, setLockedExamWeights] = useState<Set<string>>(new Set());
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  // Embedded Preview Controls
  const [rulesSearch, setRulesSearch] = useState<string>("");
  const [rulesSectionFilter, setRulesSectionFilter] = useState<string>("all");
  const [rulesSortBy, setRulesSortBy] = useState<"rank" | "score_desc" | "score_asc" | "name">("rank");
  const [rulesCurrentPage, setRulesCurrentPage] = useState<number>(1);
  const [rulesPageSize, setRulesPageSize] = useState<number>(10);

  // Load existing policy when scope changes
  useEffect(() => {
    const existing = getExamGradePolicy(policyExamId, policyGrade);
    setCalculationMode(existing.calculationMode || "weighted");
    setTargetScale(existing.targetScale || 100);
    setMinPassPct(existing.minPassPct ?? 50);
    setAggregationStrategy(existing.aggregationStrategy || "cumulative_sum");
    setRoundingMode(existing.roundingMode || "round");
    if (existing.ratingBoundaries) {
      setRatingBoundaries(existing.ratingBoundaries);
    }
    setCourseworkRatio(existing.courseworkRatio ?? 40);
    setFinalExamRatio(existing.finalExamRatio ?? 60);
    setDropLowestCount(existing.dropLowestCount ?? 1);
    if (existing.customExamWeights && Object.keys(existing.customExamWeights).length > 0) {
      setCustomExamWeights(existing.customExamWeights);
    } else {
      // Default initial weights equalized across exams
      const defaultMap: Record<string, number> = {};
      const count = activeStageExams.length || 1;
      const equalWeight = Math.round(100 / count);
      activeStageExams.forEach((ex, idx) => {
        defaultMap[ex.id] = idx === count - 1 ? 100 - (equalWeight * (count - 1)) : equalWeight;
      });
      setCustomExamWeights(defaultMap);
    }
    if (existing.customExamRoles) {
      setCustomExamRoles(existing.customExamRoles);
    } else {
      // Default roles
      const defaultRoles: Record<string, "coursework" | "final" | "periodic"> = {};
      activeStageExams.forEach(ex => {
        const isFinal = ex.name.includes("نهائي") || ex.name.includes("الفصل");
        defaultRoles[ex.id] = isFinal ? "final" : "coursework";
      });
      setCustomExamRoles(defaultRoles);
    }
    if (existing.excludedSubjectIds) {
      setExcludedExamIds(new Set(existing.excludedSubjectIds));
    }
  }, [policyExamId, policyGrade, stage, activeStageExams]);

  // Handle coursework vs final ratio changes (auto-sum to 100)
  const handleCourseworkRatioChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setCourseworkRatio(clamped);
    setFinalExamRatio(100 - clamped);
  };

  const handleFinalExamRatioChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setFinalExamRatio(clamped);
    setCourseworkRatio(100 - clamped);
  };

  // Auto-balance weights across unlocked active exams to exactly 100%
  const handleAutoBalanceWeights = () => {
    const availableExams = activeStageExams.filter(e => !excludedExamIds.has(e.id));
    if (availableExams.length === 0) return;

    let lockedSum = 0;
    const unlockedExams: Exam[] = [];

    availableExams.forEach(e => {
      if (lockedExamWeights.has(e.id)) {
        lockedSum += (customExamWeights[e.id] ?? 0);
      } else {
        unlockedExams.push(e);
      }
    });

    const remaining = Math.max(0, 100 - lockedSum);
    if (unlockedExams.length === 0) return;

    const baseWeight = Math.floor(remaining / unlockedExams.length);
    let remainder = remaining % unlockedExams.length;

    const updated = { ...customExamWeights };
    unlockedExams.forEach((e, idx) => {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder--;
      updated[e.id] = baseWeight + extra;
    });

    setCustomExamWeights(updated);
    toast.success("تمت إعادة موازنة أوزان الفترات لتساوي 100% بدقة");
  };

  // Reset to Ministerial Defaults
  const handleResetToMinistryDefaults = () => {
    setCalculationMode("weighted");
    setTargetScale(100);
    setMinPassPct(50);
    setAggregationStrategy("final_plus_coursework");
    setCourseworkRatio(40);
    setFinalExamRatio(60);
    setRoundingMode("round");
    setRatingBoundaries({ excellent: 90, veryGood: 80, good: 65, pass: 50 });
    
    const updatedRoles: Record<string, "coursework" | "final" | "periodic"> = {};
    const updatedWeights: Record<string, number> = {};
    const courseworkExams = activeStageExams.filter(e => !e.name.includes("نهائي") && !e.name.includes("الفصل"));
    const finalExams = activeStageExams.filter(e => e.name.includes("نهائي") || e.name.includes("الفصل"));

    const cwPerExam = courseworkExams.length > 0 ? Math.round(40 / courseworkExams.length) : 40;
    const fnPerExam = finalExams.length > 0 ? Math.round(60 / finalExams.length) : 60;

    courseworkExams.forEach(e => {
      updatedRoles[e.id] = "coursework";
      updatedWeights[e.id] = cwPerExam;
    });
    finalExams.forEach(e => {
      updatedRoles[e.id] = "final";
      updatedWeights[e.id] = fnPerExam;
    });

    setCustomExamRoles(updatedRoles);
    setCustomExamWeights(updatedWeights);
    setExcludedExamIds(new Set());
    toast.info("تم استعادة القالب الوزاري الرسمي (40% أعمال سنة / 60% اختبار نهائي)");
  };

  // Save policy
  const handleSavePolicy = () => {
    setIsSavingPolicy(true);
    saveExamGradePolicy({
      examId: policyExamId,
      grade: policyGrade,
      calculationMode,
      targetScale,
      minPassPct,
      aggregationStrategy,
      roundingMode,
      ratingBoundaries,
      courseworkRatio,
      finalExamRatio,
      dropLowestCount,
      customExamWeights,
      customExamRoles,
      excludedSubjectIds: Array.from(excludedExamIds)
    });

    setTimeout(() => {
      setIsSavingPolicy(false);
      toast.success("تم حفظ وتطبيق قواعد احتساب الدرجات واستراتيجيات الفترات بنجاح");
    }, 300);
  };

  // Total weight sum for validation
  const totalCalculatedWeight = useMemo(() => {
    return activeStageExams
      .filter(e => !excludedExamIds.has(e.id))
      .reduce((sum, e) => sum + (customExamWeights[e.id] ?? 0), 0);
  }, [activeStageExams, excludedExamIds, customExamWeights]);

  // --------------------------------------------------------------------------
  // REAL-TIME DYNAMIC CUMULATIVE CALCULATION MATRIX (Powers Tab 3 & Tab 4 Live Preview)
  // --------------------------------------------------------------------------
  const cumulativeMatrix = useMemo(() => {
    // 1. Determine target students
    const targetGrades = policyGrade === "all" ? stageGrades : [policyGrade];
    const gradeSections = activeStageSections.filter(s => targetGrades.some(g => normalizeGrade(g) === normalizeGrade(s.grade)));
    const sectionIds = rulesSectionFilter === "all" ? new Set(gradeSections.map(s => s.id)) : new Set([rulesSectionFilter]);

    const enrollments = allStudentEnrollments.filter(e => e.academicYearId === currentAcademicYearId && sectionIds.has(e.sectionId));
    
    // 2. Included exams
    const activeExams = activeStageExams.filter(e => !excludedExamIds.has(e.id));
    if (activeExams.length === 0 || enrollments.length === 0) return { rows: [], stats: null };

    // 3. Process each student
    const computedRows = enrollments.map(enr => {
      const student = activeStageStudents.find(s => s.id === enr.studentId);
      const section = gradeSections.find(s => s.id === enr.sectionId);
      if (!student) return null;

      // Period scores
      const examDetails: Record<string, {
        earned: number;
        maxPossible: number;
        percentage: number;
        weight: number;
        role: "coursework" | "final" | "periodic";
        isExcluded: boolean;
      }> = {};

      let totalRawEarned = 0;
      let totalRawMax = 0;

      activeExams.forEach(ex => {
        const studentExamSubjects = activeStageExamSubjects.filter(es => 
          es.examId === ex.id && 
          (!section || normalizeGrade(es.grade) === normalizeGrade(section.grade))
        );

        let exEarned = 0;
        let exMax = 0;

        studentExamSubjects.forEach(es => {
          const res = allExamResults.find(r => r.examSubjectId === es.id && r.studentEnrollmentId === enr.id);
          exEarned += res?.mark ?? 0;
          exMax += es.maxScore;
        });

        const pct = exMax > 0 ? (exEarned / exMax) * 100 : 0;
        const assignedWeight = customExamWeights[ex.id] ?? (100 / (activeExams.length || 1));
        const assignedRole = customExamRoles[ex.id] ?? (ex.name.includes("نهائي") || ex.name.includes("الفصل") ? "final" : "coursework");

        totalRawEarned += exEarned;
        totalRawMax += exMax;

        examDetails[ex.id] = {
          earned: exEarned,
          maxPossible: exMax,
          percentage: pct,
          weight: assignedWeight,
          role: assignedRole,
          isExcluded: excludedExamIds.has(ex.id)
        };
      });

      // 4. Calculate Final Aggregated Percentage based on strategy
      let finalPercentage = 0;

      if (aggregationStrategy === "cumulative_sum") {
        if (calculationMode === "raw") {
          finalPercentage = totalRawMax > 0 ? (totalRawEarned / totalRawMax) * 100 : 0;
        } else if (calculationMode === "equal_average") {
          const sumPct = activeExams.reduce((s, e) => s + examDetails[e.id].percentage, 0);
          finalPercentage = activeExams.length > 0 ? sumPct / activeExams.length : 0;
        } else {
          // Weighted percentage
          const validWeightSum = activeExams.reduce((s, e) => s + examDetails[e.id].weight, 0) || 1;
          const weightedSum = activeExams.reduce((s, e) => s + (examDetails[e.id].percentage * (examDetails[e.id].weight / validWeightSum)), 0);
          finalPercentage = weightedSum;
        }
      } else if (aggregationStrategy === "final_plus_coursework") {
        // Coursework group vs Final group
        const cwExams = activeExams.filter(e => examDetails[e.id].role === "coursework" || examDetails[e.id].role === "periodic");
        const fnExams = activeExams.filter(e => examDetails[e.id].role === "final");

        // Coursework average / weighted percentage
        let cwPct = 0;
        if (cwExams.length > 0) {
          const cwWeightSum = cwExams.reduce((s, e) => s + examDetails[e.id].weight, 0) || 1;
          cwPct = cwExams.reduce((s, e) => s + (examDetails[e.id].percentage * (examDetails[e.id].weight / cwWeightSum)), 0);
        }

        // Final exam average / weighted percentage
        let fnPct = 0;
        if (fnExams.length > 0) {
          const fnWeightSum = fnExams.reduce((s, e) => s + examDetails[e.id].weight, 0) || 1;
          fnPct = fnExams.reduce((s, e) => s + (examDetails[e.id].percentage * (examDetails[e.id].weight / fnWeightSum)), 0);
        }

        const totalRatio = (courseworkRatio + finalExamRatio) || 100;
        finalPercentage = (cwPct * (courseworkRatio / totalRatio)) + (fnPct * (finalExamRatio / totalRatio));
      } else if (aggregationStrategy === "best_attempt") {
        // Highest achieved percentage among active exams
        const pcts = activeExams.map(e => examDetails[e.id].percentage);
        finalPercentage = pcts.length > 0 ? Math.max(...pcts) : 0;
      } else if (aggregationStrategy === "drop_lowest") {
        // Drop the lowest dropLowestCount scores
        const sortedExams = [...activeExams].sort((a, b) => examDetails[a.id].percentage - examDetails[b.id].percentage);
        const keptExams = sortedExams.slice(dropLowestCount);
        if (keptExams.length > 0) {
          const keptWeightSum = keptExams.reduce((s, e) => s + examDetails[e.id].weight, 0) || 1;
          finalPercentage = keptExams.reduce((s, e) => s + (examDetails[e.id].percentage * (examDetails[e.id].weight / keptWeightSum)), 0);
        } else {
          finalPercentage = sortedExams[0] ? examDetails[sortedExams[0].id].percentage : 0;
        }
      }

      // 5. Final Score Mapping based on calculationMode
      let computedScore = finalPercentage;
      let maxScoreScale = 100;

      if (calculationMode === "raw") {
        computedScore = totalRawEarned;
        maxScoreScale = totalRawMax || 100;
      } else if (calculationMode === "custom_scale") {
        computedScore = (finalPercentage / 100) * targetScale;
        maxScoreScale = targetScale;
      }

      // 6. Apply Rounding Mode
      let roundedScore = computedScore;
      if (roundingMode === "round") roundedScore = Math.round(computedScore);
      else if (roundingMode === "ceil") roundedScore = Math.ceil(computedScore);
      else if (roundingMode === "1_decimal") roundedScore = Math.round(computedScore * 10) / 10;

      const roundedPct = Math.round(finalPercentage * 10) / 10;
      const isPass = roundedPct >= minPassPct;

      // 7. Descriptive Rating (strictly on cumulative total)
      let descriptiveRating: "ممتاز" | "جيد جداً" | "جيد" | "مقبول" | "ضعيف" = "ضعيف";
      if (roundedPct >= ratingBoundaries.excellent) descriptiveRating = "ممتاز";
      else if (roundedPct >= ratingBoundaries.veryGood) descriptiveRating = "جيد جداً";
      else if (roundedPct >= ratingBoundaries.good) descriptiveRating = "جيد";
      else if (roundedPct >= ratingBoundaries.pass) descriptiveRating = "مقبول";

      return {
        student,
        enrollment: enr,
        section,
        examDetails,
        totalRawEarned,
        totalRawMax,
        finalPercentage: roundedPct,
        finalScore: roundedScore,
        maxScoreScale,
        isPass,
        descriptiveRating,
      };
    }).filter(Boolean) as {
      student: any;
      enrollment: any;
      section: any;
      examDetails: Record<string, any>;
      totalRawEarned: number;
      totalRawMax: number;
      finalPercentage: number;
      finalScore: number;
      maxScoreScale: number;
      isPass: boolean;
      descriptiveRating: string;
      rank?: number;
    }[];

    // Assign Ranks based on finalScore descending
    computedRows.sort((a, b) => b.finalScore - a.finalScore);
    computedRows.forEach((row, idx) => {
      row.rank = idx + 1;
    });

    // Compute live cohort statistics
    const totalCount = computedRows.length;
    const passCount = computedRows.filter(r => r.isPass).length;
    const passRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;
    const avgScore = totalCount > 0 ? Math.round((computedRows.reduce((s, r) => s + r.finalScore, 0) / totalCount) * 10) / 10 : 0;
    const topScore = computedRows.length > 0 ? computedRows[0].finalScore : 0;

    return {
      rows: computedRows,
      stats: { totalCount, passCount, passRate, avgScore, topScore }
    };
  }, [
    policyGrade,
    stageGrades,
    activeStageSections,
    rulesSectionFilter,
    allStudentEnrollments,
    currentAcademicYearId,
    activeStageExams,
    excludedExamIds,
    activeStageStudents,
    activeStageExamSubjects,
    allExamResults,
    customExamWeights,
    customExamRoles,
    aggregationStrategy,
    calculationMode,
    courseworkRatio,
    finalExamRatio,
    dropLowestCount,
    targetScale,
    roundingMode,
    minPassPct,
    ratingBoundaries
  ]);

  // Filtered & Sorted Rows for Live Tab 4 Table
  const filteredAndSortedRulesRows = useMemo(() => {
    let list = [...cumulativeMatrix.rows];

    // Search query
    const q = rulesSearch.trim();
    if (q) {
      list = list.filter(r => r.student.name.includes(q) || r.student.nationalId.includes(q));
    }

    // Sort
    if (rulesSortBy === "score_desc") list.sort((a, b) => b.finalScore - a.finalScore);
    else if (rulesSortBy === "score_asc") list.sort((a, b) => a.finalScore - b.finalScore);
    else if (rulesSortBy === "name") list.sort((a, b) => a.student.name.localeCompare(b.student.name, "ar"));
    // default "rank" is already sorted

    return list;
  }, [cumulativeMatrix.rows, rulesSearch, rulesSortBy]);

  // Paginated live table rows
  const paginatedRulesRows = useMemo(() => {
    const start = (rulesCurrentPage - 1) * rulesPageSize;
    return filteredAndSortedRulesRows.slice(start, start + rulesPageSize);
  }, [filteredAndSortedRulesRows, rulesCurrentPage, rulesPageSize]);

  const totalRulesPages = Math.ceil(filteredAndSortedRulesRows.length / rulesPageSize) || 1;

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  return (
    <AppShell>
      <div className="space-y-6 pb-20">
        {/* TOP SYSTEM BAR & TITLE */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <GraduationCap className="w-3.5 h-3.5" />
                {stageArabicName}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                النظام نشط ومحدث
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              رصد الدرجات وكشوف الحصر اليدوي والشهادات
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              إدخال درجات الفترات، استخراج كشوف الرصد الشامل، احتساب المحصلة التراكمية، واستوديو تخصيص القواعد والأوزان
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                setCertModalConfig({
                  examId: filterExamId || activeStageExams[0]?.id,
                  grade: filterGrade || stageGrades[0],
                  sectionId: filterSectionId !== "all" ? filterSectionId : undefined,
                });
                setIsCertModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Award className="w-4 h-4" />
              طباعة الشهادات وكشوف الرصد
            </button>

            <button
              onClick={() => setActiveTab("rules")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "rules"
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              }`}
            >
              <Sliders className="w-4 h-4" />
              استوديو قواعد ونسب الدرجات
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("single")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === "single"
                ? "border-primary text-primary bg-primary/5 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            1. رصد درجات المقررات الفردية
          </button>

          <button
            onClick={() => setActiveTab("roster")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === "roster"
                ? "border-primary text-primary bg-primary/5 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            2. كشف الرصد الشامل والشهادات
          </button>

          <button
            onClick={() => setActiveTab("weighted")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === "weighted"
                ? "border-primary text-primary bg-primary/5 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Calculator className="w-4 h-4" />
            3. كشف الدرجات الموزونة والمحصلة التراكمية
          </button>

          <button
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === "rules"
                ? "border-primary text-primary bg-primary/5 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            4. استوديو هندسة احتساب الدرجات واستراتيجيات التجميع
          </button>
        </div>

        {/* ================================================================== */}
        {/* TAB 1: SINGLE SUBJECT GRADING GRID                                 */}
        {/* ================================================================== */}
        {activeTab === "single" && (
          <div className="space-y-6">
            {/* Scope Filter Controls */}
            <PageCard className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    الامتحان / الفترة
                  </label>
                  <select
                    value={filterExamId}
                    onChange={(e) => setFilterExamId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {activeStageExams.map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    الصف الدراسي
                  </label>
                  <select
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {stageGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    المادة الدراسية
                  </label>
                  <select
                    value={filterSubjectId}
                    onChange={(e) => setFilterSubjectId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {applicableExamSubjects.map(es => {
                      const sub = activeStageSubjects.find(s => s.id === es.subjectId);
                      return (
                        <option key={es.id} value={es.id}>
                          {sub ? sub.name : es.subjectId} (العظمى: {es.maxScore} | الصغرى: {es.passScore})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    الشعبة
                  </label>
                  <select
                    value={filterSectionId}
                    onChange={(e) => setFilterSectionId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {applicableSections.map(sec => (
                      <option key={sec.id} value={sec.id}>{sec.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ministerial Notice */}
              <div className="mt-4 p-3 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-xl flex items-center gap-3 text-xs text-sky-800 dark:text-sky-300">
                <Info className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
                <span>
                  <strong>الضابط الوزاري للرصد الفردي:</strong> ترصد درجات المقررات الفردية بقيمها الفعلية دون إدراج تقديرات وصفية (ممتاز/جيد جداً)، وتظهر التقديرات الوصفية حصراً على المجموع التراكمي النهائي.
                </span>
              </div>
            </PageCard>

            {/* Quick Actions & KPIs */}
            {tab1Stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center shadow-sm">
                  <div className="text-xs text-slate-500">إجمالي طلاب الشعبة</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{tab1Stats.total}</div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center shadow-sm">
                  <div className="text-xs text-slate-500">المرصود لهم</div>
                  <div className="text-lg font-black text-primary mt-0.5">{tab1Stats.entered}</div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center shadow-sm">
                  <div className="text-xs text-slate-500">متوسط درجات الشعبة</div>
                  <div className="text-lg font-black text-slate-800 dark:text-slate-200 mt-0.5">{Math.round(tab1Stats.avg * 10) / 10}</div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center shadow-sm">
                  <div className="text-xs text-slate-500">أعلى درجة</div>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{tab1Stats.max}</div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center shadow-sm">
                  <div className="text-xs text-slate-500">نسبة النجاح</div>
                  <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">{tab1Stats.passRate}%</div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center shadow-sm">
                  <div className="text-xs text-slate-500">الناجحون</div>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{tab1Stats.passed}</div>
                </div>
              </div>
            )}

            {/* Student Grading Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="ابحث باسم الطالب أو رقم الهوية..."
                    className="w-full pl-3 pr-9 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleAutoFillFullMarks}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                  >
                    ملء تلقائي للدرجة الكاملة
                  </button>

                  <button
                    onClick={handleQuickApproveAll}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    اعتماد درجات الشعبة
                  </button>

                  <button
                    onClick={handleSaveMarks}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-primary text-white shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? "جارٍ الحفظ..." : "حفظ الرصد"}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-100/75 dark:bg-slate-800/75 text-slate-700 dark:text-slate-300 text-xs font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">الطالب</th>
                      <th className="py-3 px-4 w-36 text-center">
                        الدرجة المستحقة (من {selectedExamSubject?.maxScore || 100})
                      </th>
                      <th className="py-3 px-4 w-24 text-center">النسبة %</th>
                      <th className="py-3 px-4 w-28 text-center">حالة النتيجة</th>
                      <th className="py-3 px-4">ملاحظات المعلم / الرصد</th>
                      <th className="py-3 px-4 w-28 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {visibleStudents.map((item, idx) => {
                      const res = studentResults[item.enrollment.id] || {};
                      const currentMark = res.mark ?? 0;
                      const maxScore = selectedExamSubject?.maxScore || 100;
                      const passScore = selectedExamSubject?.passScore || 50;
                      const pct = maxScore > 0 ? Math.round((currentMark / maxScore) * 100) : 0;
                      const isPass = currentMark >= passScore;

                      return (
                        <tr key={item.enrollment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4 text-center text-xs font-semibold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {item.student.name}
                            </div>
                            <div className="text-xs text-slate-400">
                              الهوية: {item.student.nationalId}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min={0}
                              max={maxScore}
                              step={0.5}
                              value={res.mark ?? ""}
                              onChange={(e) => handleMarkChange(item.enrollment.id, e.target.value)}
                              className={`w-24 text-center px-2 py-1.5 text-sm font-black rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary ${
                                isPass 
                                  ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300"
                                  : "border-rose-300 dark:border-rose-700 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300"
                              }`}
                            />
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                            {pct}%
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isPass 
                                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                : "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                            }`}>
                              {isPass ? "ناجح" : "راسب"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={res.notes || ""}
                              onChange={(e) => handleNotesChange(item.enrollment.id, e.target.value)}
                              placeholder="ملاحظات..."
                              className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                              res.status === "approved"
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}>
                              {res.status === "approved" ? "معتمد" : "مسودة"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {visibleStudents.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          لا يوجد طلاب مسجلون في هذه الشعبة أو لا توجد نتائج مطابقة للبحث
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 2: COMPREHENSIVE ROSTER & CERTIFICATES PIVOT TABLE             */}
        {/* ================================================================== */}
        {activeTab === "roster" && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <PageCard className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    الامتحان / الفترة
                  </label>
                  <select
                    value={rosterExamId}
                    onChange={(e) => setRosterExamId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {activeStageExams.map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    الصف الدراسي
                  </label>
                  <select
                    value={rosterGrade}
                    onChange={(e) => setRosterGrade(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {stageGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    تصفية الشعبة
                  </label>
                  <select
                    value={rosterSectionId}
                    onChange={(e) => setRosterSectionId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">كافة الشعب</option>
                    {activeStageSections.filter(s => normalizeGrade(s.grade) === normalizeGrade(rosterGrade)).map(sec => (
                      <option key={sec.id} value={sec.id}>{sec.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setCertModalConfig({
                        examId: rosterExamId,
                        grade: rosterGrade,
                        sectionId: rosterSectionId !== "all" ? rosterSectionId : undefined,
                      });
                      setIsCertModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20 hover:from-amber-600 hover:to-amber-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4" />
                    إصدار شهادات الصف المحددة
                  </button>
                </div>
              </div>
            </PageCard>

            {/* Roster Pivot Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    placeholder="ابحث في الكشف الشامل..."
                    className="w-full pl-3 pr-9 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  إجمالي المسجلين بالكشف: {filteredRosterStudents.length} طالب
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-3 w-10 text-center">#</th>
                      <th className="py-3 px-3 min-w-[150px]">اسم الطالب</th>
                      <th className="py-3 px-2 w-20 text-center">الشعبة</th>
                      {rosterExamSubjects.map(es => {
                        const sub = activeStageSubjects.find(s => s.id === es.subjectId);
                        return (
                          <th key={es.id} className="py-3 px-2 text-center border-r border-slate-200/60 dark:border-slate-700/60 min-w-[70px]">
                            <div>{sub ? sub.name : es.subjectId}</div>
                            <div className="text-[10px] text-slate-400 font-normal">({es.maxScore})</div>
                          </th>
                        );
                      })}
                      <th className="py-3 px-3 text-center bg-slate-200/60 dark:bg-slate-700/60 font-black">
                        المجموع
                      </th>
                      <th className="py-3 px-3 text-center bg-slate-200/60 dark:bg-slate-700/60 font-black">
                        النسبة %
                      </th>
                      <th className="py-3 px-3 text-center bg-slate-200/60 dark:bg-slate-700/60 font-black">
                        التقدير
                      </th>
                      <th className="py-3 px-3 text-center bg-slate-200/60 dark:bg-slate-700/60 font-black">
                        النتيجة
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRosterStudents.map((item, idx) => (
                      <tr key={item.enrollment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-semibold">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                          {item.student.name}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-500 font-medium">
                          {item.section?.name || "-"}
                        </td>
                        {rosterExamSubjects.map(es => {
                          const sm = item.subjectMarks[es.id];
                          const mark = sm?.mark ?? 0;
                          const isPass = sm ? sm.isPass : true;
                          return (
                            <td key={es.id} className="py-2.5 px-2 text-center border-r border-slate-100 dark:border-slate-800">
                              <span className={`font-bold ${isPass ? "text-slate-800 dark:text-slate-200" : "text-rose-600 dark:text-rose-400 font-black"}`}>
                                {mark}
                              </span>
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-center font-black bg-slate-50/80 dark:bg-slate-800/40 text-slate-900 dark:text-white">
                          {item.totalEarned} / {item.totalMax}
                        </td>
                        <td className="py-2.5 px-3 text-center font-black bg-slate-50/80 dark:bg-slate-800/40 text-primary">
                          {item.percentage}%
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold bg-slate-50/80 dark:bg-slate-800/40">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${
                            item.descriptiveRating === "ممتاز" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" :
                            item.descriptiveRating === "جيد جداً" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300" :
                            item.descriptiveRating === "جيد" ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300" :
                            item.descriptiveRating === "مقبول" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" :
                            "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                          }`}>
                            {item.descriptiveRating}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold bg-slate-50/80 dark:bg-slate-800/40">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.isOverallPass
                              ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300"
                          }`}>
                            {item.isOverallPass ? "ناجح" : "دور ثان"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: WEIGHTED & CUMULATIVE RESULTS GRID                          */}
        {/* ================================================================== */}
        {activeTab === "weighted" && (
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-primary/10 border border-blue-200 dark:border-blue-800/50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  كشف المحصلة التراكمية ونتائج الفترات الموزونة
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  تُحسب هذه المحصلة آلياً بناءً على القواعد والأوزان المعتمدة في استوديو هندسة الدرجات
                </p>
              </div>

              <button
                onClick={() => setActiveTab("rules")}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary/90 transition-all shadow-sm shrink-0"
              >
                <Sliders className="w-4 h-4" />
                الانتقال لاستوديو تخصيص القواعد والأوزان
              </button>
            </div>

            {/* Render table same as cumulative preview */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4">
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                المحصلة التراكمية الحالية لطلاب المرحلة ({stageArabicName})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-3 w-12 text-center">الترتيب</th>
                      <th className="py-3 px-3">الطالب</th>
                      <th className="py-3 px-3 text-center">الشعبة</th>
                      {activeStageExams.filter(e => !excludedExamIds.has(e.id)).map(ex => (
                        <th key={ex.id} className="py-3 px-3 text-center border-r border-slate-200 dark:border-slate-700">
                          <div>{ex.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            ({customExamRoles[ex.id] === "final" ? "نهائي" : "أعمال سنة"} - {customExamWeights[ex.id] ?? 0}%)
                          </div>
                        </th>
                      ))}
                      <th className="py-3 px-3 text-center bg-slate-200/50 dark:bg-slate-700/50 font-black">المحصلة المحسوبة</th>
                      <th className="py-3 px-3 text-center bg-slate-200/50 dark:bg-slate-700/50 font-black">النسبة المكافئة</th>
                      <th className="py-3 px-3 text-center bg-slate-200/50 dark:bg-slate-700/50 font-black">التقدير التراكمي</th>
                      <th className="py-3 px-3 text-center bg-slate-200/50 dark:bg-slate-700/50 font-black">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {cumulativeMatrix.rows.slice(0, 25).map((row) => (
                      <tr key={row.enrollment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-600 dark:text-slate-400">
                          {row.rank}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                          {row.student.name}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-500">
                          {row.section?.name || "-"}
                        </td>
                        {activeStageExams.filter(e => !excludedExamIds.has(e.id)).map(ex => {
                          const det = row.examDetails[ex.id];
                          return (
                            <td key={ex.id} className="py-2.5 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {det ? `${Math.round(det.percentage)}%` : "-"}
                              </span>
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-center font-black bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white">
                          {row.finalScore} / {row.maxScoreScale}
                        </td>
                        <td className="py-2.5 px-3 text-center font-black bg-slate-50 dark:bg-slate-800/40 text-primary">
                          {row.finalPercentage}%
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold bg-slate-50 dark:bg-slate-800/40">
                          {row.descriptiveRating}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold bg-slate-50 dark:bg-slate-800/40">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${
                            row.isPass ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300" : "text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300"
                          }`}>
                            {row.isPass ? "ناجح" : "دور ثان"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 4: THE OVERHAULED ENGINEERING STUDIO & LIVE PREVIEW            */}
        {/* ================================================================== */}
        {activeTab === "rules" && (
          <div className="space-y-6">
            {/* STUDIO HEADER & CONTROLS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Sliders className="w-5 h-5" />
                    </span>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      استوديو هندسة احتساب الدرجات واستراتيجيات التجميع
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    تخصيص نمط المعالجة الحسابية، معادلات دمج أعمال السنة مع الاختبارات النهائية، أوزان الفترات، وسلم التقديرات مع محاكاة حية فورية
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={handleResetToMinistryDefaults}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    الضوابط الوزارية الافتراضية
                  </button>

                  <button
                    onClick={() => setActiveTab("single")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    شبكة الرصد
                  </button>

                  <button
                    onClick={handleSavePolicy}
                    disabled={isSavingPolicy}
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-primary to-primary/90 text-white shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSavingPolicy ? "جارٍ التطبيق والحفظ..." : "حفظ وتطبيق القواعد فوراً"}
                  </button>
                </div>
              </div>

              {/* Scope Selection */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">نطاق التطبيق:</span>
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    {stageArabicName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">الفصل / الامتحان:</span>
                  <select
                    value={policyExamId}
                    onChange={(e) => setPolicyExamId(e.target.value)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                  >
                    <option value="all">جميع الاختبارات والفترات (شامل)</option>
                    {activeStageExams.map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">الصف المستهدف:</span>
                  <select
                    value={policyGrade}
                    onChange={(e) => setPolicyGrade(e.target.value)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
                  >
                    <option value="all">جميع صفوف {stageArabicName} (شامل)</option>
                    {stageGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* MINISTERIAL REMINDER BANNER */}
            <div className="p-3.5 bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/60 rounded-xl flex items-center gap-3 text-xs text-sky-900 dark:text-sky-300 shadow-sm">
              <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
              <div className="leading-relaxed">
                <strong>الضابط الوزاري للرصد والتقويم:</strong> ترصد المواد الدراسية الفردية بالدرجة الفعلية والنسبة المئوية مع حالة الإنجاز (ناجح ✓ / دور ثان ✗). ويُخصص سلم التقديرات الوصفية (ممتاز، جيد جداً...) للنتيجة التراكمية العامة وللمحصلة والشهادات المجمعة فقط.
              </div>
            </div>

            {/* STATUS CHIPS & PRESETS BAR */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-primary" />
                  النمط: {calculationMode === "raw" ? "درجات خام" : calculationMode === "weighted" ? "نسب موزونة (%)" : calculationMode === "equal_average" ? "متوسط متساوٍ" : `مقياس خاص (${targetScale})`}
                </span>

                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  الدمج: {aggregationStrategy === "cumulative_sum" ? "تراكمي شامل بالأوزان" : aggregationStrategy === "final_plus_coursework" ? `أعمال (${courseworkRatio}%) + نهائي (${finalExamRatio}%)` : aggregationStrategy === "best_attempt" ? "المحاولة الفضلى" : `إسقاط أدنى (${dropLowestCount})`}
                </span>

                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-500" />
                  درجة النجاح: {minPassPct}% (ممتاز ≥ {ratingBoundaries.excellent}%)
                </span>

                <span className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 ${
                  totalCalculatedWeight === 100
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                    : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                }`}>
                  {totalCalculatedWeight === 100 ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  مجموع الأوزان: {totalCalculatedWeight}%
                </span>
              </div>

              {/* Fast presets */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">قوالب سريعة:</span>
                <button
                  onClick={() => {
                    setRatingBoundaries({ excellent: 90, veryGood: 80, good: 65, pass: 50 });
                    setMinPassPct(50);
                    toast.info("تم تطبيق القالب الوزاري (90/80/65/50)");
                  }}
                  className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  وزاري (90/80/65/50)
                </button>
                <button
                  onClick={() => {
                    setRatingBoundaries({ excellent: 85, veryGood: 75, good: 65, pass: 50 });
                    setMinPassPct(50);
                    toast.info("تم تطبيق القالب الأكاديمي (85/75/65/50)");
                  }}
                  className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  أكاديمي (85/75/65/50)
                </button>
                <button
                  onClick={() => {
                    setRatingBoundaries({ excellent: 90, veryGood: 85, good: 75, pass: 60 });
                    setMinPassPct(60);
                    toast.info("تم تطبيق القالب الصارم (90/85/75/60)");
                  }}
                  className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  صارم (90/85/75/60)
                </button>
              </div>
            </div>

            {/* TWO-COLUMN CONFIGURATION PANELS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* PANEL 1: GENERAL CALCULATION MODE */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-primary/10 text-primary">
                      <Calculator className="w-4 h-4" />
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      1. نمط احتساب الدرجات العام
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    طريقة معالجة الدرجات في شبكة الرصد والكشوف
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mode: Raw */}
                  <div
                    onClick={() => setCalculationMode("raw")}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative ${
                      calculationMode === "raw"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        امتحانات عادية (درجات خام)
                      </span>
                      <Hash className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      جمع درجات الاختبارات الفعلية كما هي دون تحويلها إلى نسب مئوية أو أوزان افتراضية. ممتاز للامتحانات العادية.
                    </p>
                  </div>

                  {/* Mode: Weighted */}
                  <div
                    onClick={() => setCalculationMode("weighted")}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative ${
                      calculationMode === "weighted"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        نسب مئوية موزونة (%)
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                        موصى به وزارياً
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      احتساب كل فترة بنسبتها المئوية من 100% ويحسب وزنها المحدد في مصفوفة الاختبارات بدقة رقمية عالية.
                    </p>
                  </div>

                  {/* Mode: Equal Average */}
                  <div
                    onClick={() => setCalculationMode("equal_average")}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative ${
                      calculationMode === "equal_average"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        متوسط حسابي متساوٍ
                      </span>
                      <Scale className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      احتساب متوسط بسيط متكافئ لجميع الفترات المشتركة بغض النظر عن وزن كل فترة على حدة.
                    </p>
                  </div>

                  {/* Mode: Custom Scale */}
                  <div
                    onClick={() => setCalculationMode("custom_scale")}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative ${
                      calculationMode === "custom_scale"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        مقياس درجات خاص
                      </span>
                      <Sliders className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      تحويل المجموع النهائي تلقائياً إلى مقياس مخصص (من 50، أو 60، أو 100، أو 200) مناسب لمتطلبات المرحلة.
                    </p>
                  </div>
                </div>

                {/* Sub-control when custom scale is chosen */}
                {calculationMode === "custom_scale" && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      حدد المقياس المستهدف للمحصلة النهائية:
                    </span>
                    <div className="flex items-center gap-2">
                      {[50, 60, 100, 200].map(scale => (
                        <button
                          key={scale}
                          onClick={() => setTargetScale(scale)}
                          className={`px-3 py-1 rounded-lg font-bold border transition-colors ${
                            targetScale === scale
                              ? "bg-primary text-white border-primary"
                              : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          من {scale}
                        </button>
                      ))}
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={targetScale}
                          onChange={(e) => setTargetScale(Number(e.target.value) || 100)}
                          className="w-16 px-2 py-1 text-center font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                        />
                        <span className="text-slate-400">درجة</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rounding Mode Option */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 font-medium">نمط تقريب النتائج الحسابية:</span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { id: "round", label: "تقريب لأقرب صحيح" },
                      { id: "1_decimal", label: "كسر عشري واحد (0.1)" },
                      { id: "ceil", label: "جبر الكسور للأعلى" },
                    ].map(r => (
                      <button
                        key={r.id}
                        onClick={() => setRoundingMode(r.id as any)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                          roundingMode === r.id
                            ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* PANEL 2: PERIOD AGGREGATION MECHANISM & STRATEGY */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-500">
                      <Layers className="w-4 h-4" />
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      2. آلية واستراتيجية تجميع الفترات
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    كيفية جمع الفترات وأعمال السنة مع الامتحان النهائي
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Strategy: Cumulative Sum */}
                  <div
                    onClick={() => setAggregationStrategy("cumulative_sum")}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative ${
                      aggregationStrategy === "cumulative_sum"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        المحصلة التراكمية الشاملة
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                        افتراضي ومعتمد
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      تجميع كافة الفترات المفعلة بحسب أوزانها المحددة في مصفوفة الاختبارات أدناه لتشكيل المحصلة النهائية للطالب.
                    </p>
                  </div>

                  {/* Strategy: Final + Coursework */}
                  <div
                    onClick={() => setAggregationStrategy("final_plus_coursework")}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative ${
                      aggregationStrategy === "final_plus_coursework"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        معادلة أعمال السنة + النهائي
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold">
                        النظام المعياري
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      فصل درجات الفترات الدورية كأعمال سنة مستمرة بوزن محدد، وتخصيص وزن منفصل لاختبار نهاية الفصل.
                    </p>
                  </div>

                  {/* Strategy: Best Attempt */}
                  <div
                    onClick={() => setAggregationStrategy("best_attempt")}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative ${
                      aggregationStrategy === "best_attempt"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        احتساب المحاولة الفضلى فقط
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                        للاختبارات التحسينية
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      اعتماد أعلى نتيجة ونسبة مئوية حققها الطالب من بين كافة فترات الاختبارات وتجاهل الفترات الأقل.
                    </p>
                  </div>

                  {/* Strategy: Drop Lowest */}
                  <div
                    onClick={() => setAggregationStrategy("drop_lowest")}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative ${
                      aggregationStrategy === "drop_lowest"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        إسقاط الفترة / الدرجة الأدنى
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold">
                        تحفيزي
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      استبعاد أدنى درجة حققها الطالب بين الفترات الدورية تلقائياً وإعادة احتساب المحصلة على الفترات المتبقية.
                    </p>
                  </div>
                </div>

                {/* DYNAMIC MANUAL CONTROLS: Strategy 2 (Final + Coursework) */}
                {aggregationStrategy === "final_plus_coursework" && (
                  <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                        التحكم اليدوي بنسب أعمال السنة والاختبار النهائي:
                      </span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        المجموع: {courseworkRatio + finalExamRatio}%
                      </span>
                    </div>

                    {/* Dual Linked Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        <span>أعمال السنة: {courseworkRatio}%</span>
                        <span>الاختبار النهائي: {finalExamRatio}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={courseworkRatio}
                        onChange={(e) => handleCourseworkRatioChange(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-2 bg-indigo-200 dark:bg-indigo-900 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Direct Numeric Inputs & Quick Chips */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-600 dark:text-slate-400">أعمال سنة:</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={courseworkRatio}
                            onChange={(e) => handleCourseworkRatioChange(Number(e.target.value))}
                            className="w-14 px-2 py-1 text-center font-bold rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-indigo-900 dark:text-indigo-200"
                          />
                          <span>%</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-slate-600 dark:text-slate-400">نهائي:</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={finalExamRatio}
                            onChange={(e) => handleFinalExamRatioChange(Number(e.target.value))}
                            className="w-14 px-2 py-1 text-center font-bold rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-indigo-900 dark:text-indigo-200"
                          />
                          <span>%</span>
                        </div>
                      </div>

                      {/* Quick Ratio Chips */}
                      <div className="flex items-center gap-1">
                        {[
                          { cw: 40, fn: 60, label: "40 / 60" },
                          { cw: 50, fn: 50, label: "50 / 50" },
                          { cw: 30, fn: 70, label: "30 / 70" },
                          { cw: 20, fn: 80, label: "20 / 80" },
                        ].map(chip => (
                          <button
                            key={chip.label}
                            onClick={() => {
                              setCourseworkRatio(chip.cw);
                              setFinalExamRatio(chip.fn);
                            }}
                            className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors ${
                              courseworkRatio === chip.cw && finalExamRatio === chip.fn
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>تأكد من تحديد دور كل فترة أدناه في المصفوفة كـ [أعمال سنة] أو [اختبار نهائي].</span>
                    </div>
                  </div>
                )}

                {/* DYNAMIC MANUAL CONTROLS: Strategy 4 (Drop Lowest) */}
                {aggregationStrategy === "drop_lowest" && (
                  <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200/80 dark:border-rose-800/60 flex items-center justify-between text-xs">
                    <span className="font-semibold text-rose-900 dark:text-rose-200">
                      عدد الفترات المراد إسقاط أدنى درجة منها لكل طالب:
                    </span>
                    <div className="flex items-center gap-2">
                      {[1, 2].map(count => (
                        <button
                          key={count}
                          onClick={() => setDropLowestCount(count)}
                          className={`px-3 py-1 rounded-lg font-bold border transition-colors ${
                            dropLowestCount === count
                              ? "bg-rose-600 text-white border-rose-600"
                              : "bg-white dark:bg-slate-800 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                          }`}
                        >
                          {count === 1 ? "فترة واحدة (1)" : "فترتان (2)"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PANEL 3: AUTOMATED GRADING SCALE & SUCCESS BOUNDARIES */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-500">
                    <Award className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      3. سلم التقديرات الآلي ومحددات النجاح للمحصلة التراكمية
                    </h3>
                    <p className="text-xs text-slate-400">
                      تحديد الحدود الدنيا للنسب المئوية لكل تقدير لفظي، ودرجة النجاح العامة للمرحلة
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">الحد الأدنى للنجاح:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={minPassPct}
                      onChange={(e) => setMinPassPct(Number(e.target.value) || 50)}
                      className="w-16 px-2 py-1 text-center font-black rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                    <span className="text-xs text-slate-400 font-bold">%</span>
                  </div>
                </div>
              </div>

              {/* 5 Rating Boundary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {/* Excellent */}
                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-center space-y-2">
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    ممتاز
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs text-slate-500">≥</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={ratingBoundaries.excellent}
                      onChange={(e) => setRatingBoundaries(prev => ({ ...prev, excellent: Number(e.target.value) || 90 }))}
                      className="w-14 px-1.5 py-1 text-center text-sm font-black rounded border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300"
                    />
                    <span className="text-xs text-slate-400 font-bold">%</span>
                  </div>
                </div>

                {/* Very Good */}
                <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20 text-center space-y-2">
                  <div className="text-xs font-bold text-blue-800 dark:text-blue-300">
                    جيد جداً
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs text-slate-500">≥</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={ratingBoundaries.veryGood}
                      onChange={(e) => setRatingBoundaries(prev => ({ ...prev, veryGood: Number(e.target.value) || 80 }))}
                      className="w-14 px-1.5 py-1 text-center text-sm font-black rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300"
                    />
                    <span className="text-xs text-slate-400 font-bold">%</span>
                  </div>
                </div>

                {/* Good */}
                <div className="p-3.5 rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/50 dark:bg-sky-950/20 text-center space-y-2">
                  <div className="text-xs font-bold text-sky-800 dark:text-sky-300">
                    جيد
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs text-slate-500">≥</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={ratingBoundaries.good}
                      onChange={(e) => setRatingBoundaries(prev => ({ ...prev, good: Number(e.target.value) || 65 }))}
                      className="w-14 px-1.5 py-1 text-center text-sm font-black rounded border border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300"
                    />
                    <span className="text-xs text-slate-400 font-bold">%</span>
                  </div>
                </div>

                {/* Pass */}
                <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 text-center space-y-2">
                  <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    مقبول (النجاح)
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs text-slate-500">≥</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={ratingBoundaries.pass}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 50;
                        setRatingBoundaries(prev => ({ ...prev, pass: val }));
                        setMinPassPct(val);
                      }}
                      className="w-14 px-1.5 py-1 text-center text-sm font-black rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300"
                    />
                    <span className="text-xs text-slate-400 font-bold">%</span>
                  </div>
                </div>

                {/* Weak / Fail */}
                <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-2">
                  <div className="text-xs font-bold text-rose-800 dark:text-rose-300">
                    ضعيف / دور ثان
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs text-slate-500">&lt;</span>
                    <span className="text-sm font-black text-rose-700 dark:text-rose-300">
                      {minPassPct}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* PANEL 4: PERIOD CLASSIFICATION & WEIGHTS MATRIX */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-purple-500/10 text-purple-500">
                    <Layers className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      4. مصفوفة أوزان وتصنيف الفترات الاختبارية
                    </h3>
                    <p className="text-xs text-slate-400">
                      تحديد الوزن النسبي لكل فترة واختبار، وتصنيف دورها (أعمال سنة / اختبار نهائي)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleAutoBalanceWeights}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    موازنة الأوزان إلى 100%
                  </button>
                </div>
              </div>

              {/* Multi-Color Stacked Distribution Bar */}
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  {activeStageExams.filter(e => !excludedExamIds.has(e.id)).map((ex, idx) => {
                    const colors = [
                      "bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"
                    ];
                    const w = customExamWeights[ex.id] ?? 0;
                    return (
                      <div
                        key={ex.id}
                        style={{ width: `${w}%` }}
                        className={`${colors[idx % colors.length]} transition-all relative group`}
                        title={`${ex.name}: ${w}%`}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>توزيع الأوزان المرئية للفترات النشطة</span>
                  <span className={`font-bold ${totalCalculatedWeight === 100 ? "text-emerald-600" : "text-amber-600"}`}>
                    المجموع: {totalCalculatedWeight}% / 100%
                  </span>
                </div>
              </div>

              {/* Period Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeStageExams.map((ex, idx) => {
                  const weight = customExamWeights[ex.id] ?? 0;
                  const role = customExamRoles[ex.id] ?? (ex.name.includes("نهائي") || ex.name.includes("الفصل") ? "final" : "coursework");
                  const isLocked = lockedExamWeights.has(ex.id);
                  const isExcluded = excludedExamIds.has(ex.id);

                  return (
                    <div
                      key={ex.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isExcluded 
                          ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/60 opacity-60" 
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {ex.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setLockedExamWeights(prev => {
                                const next = new Set(prev);
                                if (next.has(ex.id)) next.delete(ex.id);
                                else next.add(ex.id);
                                return next;
                              });
                            }}
                            title={isLocked ? "إلغاء قفل الوزن" : "قفل الوزن لمنع التعديل التلقائي"}
                            className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              isLocked ? "text-amber-500 font-bold" : "text-slate-400"
                            }`}
                          >
                            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setExcludedExamIds(prev => {
                                const next = new Set(prev);
                                if (next.has(ex.id)) next.delete(ex.id);
                                else next.add(ex.id);
                                return next;
                              });
                            }}
                            title={isExcluded ? "تضمين في المحصلة" : "استبعاد من المحصلة"}
                            className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              isExcluded ? "text-rose-500" : "text-slate-400"
                            }`}
                          >
                            {isExcluded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {/* Role Selector Button (Coursework vs Final) */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">تصنيف الفترة:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomExamRoles(prev => ({
                                ...prev,
                                [ex.id]: role === "final" ? "coursework" : "final"
                              }));
                            }}
                            className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 ${
                              role === "final"
                                ? "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800"
                                : "bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800"
                            }`}
                          >
                            {role === "final" ? "🎓 اختبار نهائي" : "📝 أعمال سنة"}
                          </button>
                        </div>

                        {/* Weight Input */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">الوزن في المحصلة (%):</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setCustomExamWeights(prev => ({
                                  ...prev,
                                  [ex.id]: Math.max(0, (prev[ex.id] ?? 0) - 5)
                                }));
                              }}
                              className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold hover:bg-slate-200"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={weight}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                                setCustomExamWeights(prev => ({ ...prev, [ex.id]: val }));
                              }}
                              className="w-14 px-1.5 py-1 text-center font-black rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCustomExamWeights(prev => ({
                                  ...prev,
                                  [ex.id]: Math.min(100, (prev[ex.id] ?? 0) + 5)
                                }));
                              }}
                              className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold hover:bg-slate-200"
                            >
                              +
                            </button>
                            <span className="font-bold text-slate-400">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ============================================================== */}
            {/* PANEL 5: LIVE EMBEDDED CUMULATIVE STUDENT TABLE PREVIEW        */}
            {/* ============================================================== */}
            <div className="bg-white dark:bg-slate-900 border-2 border-primary/30 rounded-2xl p-5 shadow-lg shadow-primary/5 space-y-4">
              {/* Header with live feedback pulse */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      المعاينة الحية الفورية لنتائج الطلاب وفق القواعد أعلاه
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    تتفاعل هذه النتائج لحظياً مع أي تعديل في الأنماط أو النسب أو الأوزان بالأعلى دون الحاجة للمغادرة
                  </p>
                </div>

                {cumulativeMatrix.stats && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                      <span className="text-slate-400">الطلاب: </span>
                      <span className="font-bold text-slate-900 dark:text-white">{cumulativeMatrix.stats.totalCount}</span>
                    </div>
                    <div className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                      <span className="text-emerald-700 dark:text-emerald-400">نسبة النجاح: </span>
                      <span className="font-black text-emerald-800 dark:text-emerald-300">{cumulativeMatrix.stats.passRate}%</span>
                    </div>
                    <div className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs">
                      <span className="text-blue-700 dark:text-blue-400">المتوسط: </span>
                      <span className="font-black text-blue-800 dark:text-blue-300">{cumulativeMatrix.stats.avgScore}</span>
                    </div>
                    <div className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
                      <span className="text-amber-700 dark:text-amber-400">أعلى نتيجة: </span>
                      <span className="font-black text-amber-800 dark:text-amber-300">{cumulativeMatrix.stats.topScore}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Table Filter Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={rulesSearch}
                    onChange={(e) => {
                      setRulesSearch(e.target.value);
                      setRulesCurrentPage(1);
                    }}
                    placeholder="ابحث باسم الطالب أو رقم الهوية..."
                    className="w-full pl-3 pr-9 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <select
                    value={rulesSectionFilter}
                    onChange={(e) => {
                      setRulesSectionFilter(e.target.value);
                      setRulesCurrentPage(1);
                    }}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-medium"
                  >
                    <option value="all">كافة الشعب</option>
                    {activeStageSections.filter(s => policyGrade === "all" || normalizeGrade(s.grade) === normalizeGrade(policyGrade)).map(sec => (
                      <option key={sec.id} value={sec.id}>{sec.name}</option>
                    ))}
                  </select>

                  <select
                    value={rulesSortBy}
                    onChange={(e) => setRulesSortBy(e.target.value as any)}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-medium"
                  >
                    <option value="rank">الترتيب العام (الأعلى أولاً)</option>
                    <option value="score_desc">الدرجة النهائية (تنازلي)</option>
                    <option value="score_asc">الدرجة النهائية (تصاعدي)</option>
                    <option value="name">اسم الطالب أبجدياً</option>
                  </select>
                </div>
              </div>

              {/* Real-Time Live Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 w-14 text-center">الترتيب</th>
                      <th className="py-2.5 px-3 min-w-[150px]">اسم الطالب</th>
                      <th className="py-2.5 px-2 text-center w-20">الشعبة</th>
                      {activeStageExams.filter(e => !excludedExamIds.has(e.id)).map(ex => (
                        <th key={ex.id} className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-700 min-w-[90px]">
                          <div>{ex.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            ({customExamRoles[ex.id] === "final" ? "نهائي" : "أعمال"} - {customExamWeights[ex.id] ?? 0}%)
                          </div>
                        </th>
                      ))}
                      <th className="py-2.5 px-3 text-center bg-slate-200/60 dark:bg-slate-700/60 font-black">
                        المحصلة ({calculationMode === "custom_scale" ? targetScale : 100})
                      </th>
                      <th className="py-2.5 px-3 text-center bg-slate-200/60 dark:bg-slate-700/60 font-black">
                        النسبة %
                      </th>
                      <th className="py-2.5 px-3 text-center bg-slate-200/60 dark:bg-slate-700/60 font-black">
                        التقدير
                      </th>
                      <th className="py-2.5 px-3 text-center bg-slate-200/60 dark:bg-slate-700/60 font-black">
                        النتيجة
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedRulesRows.map((row) => (
                      <tr key={row.enrollment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold">
                          {row.rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs">🥇</span>
                          ) : row.rank === 2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs">🥈</span>
                          ) : row.rank === 3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-200 text-amber-800 text-xs">🥉</span>
                          ) : (
                            <span className="text-slate-400">{row.rank}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 dark:text-white">{row.student.name}</div>
                          <div className="text-[10px] text-slate-400">{row.student.nationalId}</div>
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-500 font-medium">
                          {row.section?.name || "-"}
                        </td>
                        {activeStageExams.filter(e => !excludedExamIds.has(e.id)).map(ex => {
                          const det = row.examDetails[ex.id];
                          return (
                            <td key={ex.id} className="py-2.5 px-2 text-center border-r border-slate-100 dark:border-slate-800">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {det ? `${Math.round(det.percentage)}%` : "-"}
                              </span>
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-center font-black bg-slate-50/70 dark:bg-slate-800/30 text-slate-900 dark:text-white">
                          {row.finalScore}
                        </td>
                        <td className="py-2.5 px-3 text-center font-black bg-slate-50/70 dark:bg-slate-800/30 text-primary">
                          {row.finalPercentage}%
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold bg-slate-50/70 dark:bg-slate-800/30">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${
                            row.descriptiveRating === "ممتاز" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" :
                            row.descriptiveRating === "جيد جداً" ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300" :
                            row.descriptiveRating === "جيد" ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300" :
                            row.descriptiveRating === "مقبول" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" :
                            "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                          }`}>
                            {row.descriptiveRating}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold bg-slate-50/70 dark:bg-slate-800/30">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            row.isPass
                              ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300"
                          }`}>
                            {row.isPass ? "ناجح" : "دور ثان"}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {paginatedRulesRows.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400">
                          لا توجد نتائج مطابقة للبحث في هذه المرحلة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              {totalRulesPages > 1 && (
                <div className="flex items-center justify-between text-xs pt-2">
                  <div className="text-slate-500">
                    عرض {((rulesCurrentPage - 1) * rulesPageSize) + 1} إلى {Math.min(rulesCurrentPage * rulesPageSize, filteredAndSortedRulesRows.length)} من {filteredAndSortedRulesRows.length} طالب
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      disabled={rulesCurrentPage <= 1}
                      onClick={() => setRulesCurrentPage(p => p - 1)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                    >
                      السابق
                    </button>
                    <span className="px-2 font-bold text-slate-700 dark:text-slate-300">
                      {rulesCurrentPage} / {totalRulesPages}
                    </span>
                    <button
                      disabled={rulesCurrentPage >= totalRulesPages}
                      onClick={() => setRulesCurrentPage(p => p + 1)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                    >
                      التالي
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BATCH CERTIFICATES & ROSTER PRINT MODAL */}
      <BatchCertificatesModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        examId={certModalConfig.examId}
        grade={certModalConfig.grade}
        sectionId={certModalConfig.sectionId}
        preSelectedStudentIds={certModalConfig.studentIds}
      />
    </AppShell>
  );
}
