import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Printer, 
  Download, 
  X, 
  FileSpreadsheet, 
  CheckCircle2, 
  SlidersHorizontal, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Sparkles, 
  Building2, 
  CalendarDays,
  FileCheck2,
  FileText,
  Clock,
  Layers,
  Award,
  ChevronDown,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Copy,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  QrCode,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  UserX
} from "lucide-react";
import QRCode from "react-qr-code";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage } from "@/lib/school-structure";
import { toast } from "sonner";

export interface BlankGradeSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialExamId?: string;
  initialGrade?: string;
  initialSectionId?: string;
  initialSubjectId?: string;
}

export interface SheetColumnDef {
  id: string;
  title: string;
  maxScore: number;
  enabled: boolean;
  category?: "coursework" | "continuous" | "midterm" | "final" | "custom";
}

export interface SignerDef {
  id: string;
  title: string;
  name: string;
  enabled: boolean;
  subtitle: string;
}

// Stage name in Arabic
function getStageArabic(stage: string): string {
  switch (stage) {
    case "primary": return "المرحلة الابتدائية";
    case "middle": return "المرحلة المتوسطة";
    case "high": 
    case "secondary": return "المرحلة الثانوية";
    case "kindergarten": return "مرحلة رياض الأطفال";
    default: return stage;
  }
}

function normalizeGrade(g: string = ""): string {
  return g.replace(/الابتدائي|المتوسط|الثانوي/g, "").replace(/\s+/g, " ").trim();
}

// Convert numbers to Arabic written words (Tafqeet)
function tafqeetMarks(num: number | string): string {
  const n = Math.round(Number(num));
  if (isNaN(n) || n < 0) return "";
  if (n === 0) return "صفر";
  
  const ones = ["", "واحد", "اثنان", "ثلاث", "أربع", "خمس", "ست", "سبع", "ثمان", "تسع", "عشر"];
  const tens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  
  if (n <= 10) return `فقط ${ones[n]} ${n <= 2 ? "درجات" : "درجات"} لا غير`;
  if (n === 100) return "فقط مائة درجة لا غير";
  if (n < 20) {
    const unit = n % 10;
    return `فقط ${unit === 1 ? "أحد" : unit === 2 ? "اثنا" : ones[unit]} عشر درجة لا غير`;
  }
  if (n < 100) {
    const unit = n % 10;
    const ten = Math.floor(n / 10);
    if (unit === 0) return `فقط ${tens[ten]} درجة لا غير`;
    return `فقط ${ones[unit]} و${tens[ten]} درجة لا غير`;
  }
  return `فقط ${n} درجة لا غير`;
}

export function BlankGradeSheetModal({
  isOpen,
  onClose,
  initialExamId = "",
  initialGrade = "",
  initialSectionId = "",
  initialSubjectId = ""
}: BlankGradeSheetModalProps) {
  const { stage } = useStage();
  const { 
    activeStageExams, 
    activeStageSubjects, 
    activeStageSections, 
    activeStageStudents, 
    activeStageExamSubjects,
    allExamResults,
    allStudentEnrollments,
    allTeachingAssignments,
    currentAcademicYearId,
    currentAcademicYear,
    activeAcademicTerm,
    systemSettings,
    allStaff
  } = useGlobalStore();

  const allTeachers = useMemo(() => {
    return allStaff.filter(s => s.role === 'teacher' || (s as any).department === 'academic');
  }, [allStaff]);

  const stageGrades = useMemo(() => getGradesForStage(stage), [stage]);

  // Tabbed Ribbon Navigation
  const [activeTab, setActiveTab] = useState<"scope" | "columns" | "layout" | "signatures" | "draft">("scope");

  // Filters State
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId);
  const [selectedGrade, setSelectedGrade] = useState<string>(initialGrade);
  const [selectedSectionId, setSelectedSectionId] = useState<string>(initialSectionId);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId);
  const [teacherName, setTeacherName] = useState<string>("");
  const [customTeacherSelected, setCustomTeacherSelected] = useState<boolean>(false);
  
  // Sheet Mode: "blank" (كشف فارغ للرصد اليدوي) vs "draft_filled" (مسودة بالدرجات المرصودة للمراجعة)
  const [sheetMode, setSheetMode] = useState<"blank" | "draft_filled">("blank");
  const [pageOrientation, setPageOrientation] = useState<"portrait" | "landscape">("landscape");
  const [rowDensity, setRowDensity] = useState<"compact" | "normal" | "spacious">("normal");
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
  const [stripeRows, setStripeRows] = useState<boolean>(true);
  const [includeExtraRows, setIncludeExtraRows] = useState<boolean>(true);
  const [extraRowsCount, setExtraRowsCount] = useState<number>(3);
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Institutional Header & Verification Toggles
  const [showMinistryEmblem, setShowMinistryEmblem] = useState<boolean>(true);
  const [showSchoolHeader, setShowSchoolHeader] = useState<boolean>(true);
  const [showQrVerification, setShowQrVerification] = useState<boolean>(true);
  const [showControlSealBox, setShowControlSealBox] = useState<boolean>(true);
  const [showDateHeader, setShowDateHeader] = useState<boolean>(true);
  const [showNationalId, setShowNationalId] = useState<boolean>(true);
  const [showSectionColumn, setShowSectionColumn] = useState<boolean>(true);
  const [showTafqeetWords, setShowTafqeetWords] = useState<boolean>(true);
  const [showNotesColumn, setShowNotesColumn] = useState<boolean>(true);
  const [showStatsFooter, setShowStatsFooter] = useState<boolean>(true);

  // Sorting and draft filter
  const [sortBy, setSortBy] = useState<"name" | "nationalId" | "scoreDesc" | "scoreAsc">("name");
  const [draftResultFilter, setDraftResultFilter] = useState<"all" | "recorded" | "unrecorded" | "failing" | "passing">("all");

  // Dynamic Column Definitions
  const [sheetColumns, setSheetColumns] = useState<SheetColumnDef[]>([
    { id: "c1", title: "أعمال السنة", maxScore: 10, enabled: true, category: "coursework" },
    { id: "c2", title: "تقويم مستمر وأنشطة", maxScore: 10, enabled: true, category: "continuous" },
    { id: "c3", title: "اختبار تحريري نصفي", maxScore: 10, enabled: true, category: "midterm" },
  ]);

  // Signers Configuration
  const [signers, setSigners] = useState<SignerDef[]>([
    { id: "s1", title: "معلم المادة المكلف", name: "", enabled: true, subtitle: "التوقيع والتاريخ" },
    { id: "s2", title: "مراجع ومطابق الكنترول", name: "أ. مراجع الكنترول", enabled: true, subtitle: "التوقيع والمطابقة" },
    { id: "s3", title: "رئيس لجنة الكنترول والامتحانات", name: "أ. رئيس الكنترول", enabled: true, subtitle: "التوقيع والاعتماد" },
    { id: "s4", title: "مدير المدرسة والختم الرسمي", name: "مدير المدرسة", enabled: true, subtitle: "الختم الرسمي للمدرسة" }
  ]);

  // -------------------------------------------------------------------------
  // Defaults initialization
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!selectedExamId && activeStageExams.length > 0) {
      setSelectedExamId(activeStageExams[0].id);
    }
  }, [activeStageExams, selectedExamId]);

  useEffect(() => {
    if (!selectedGrade && stageGrades.length > 0) {
      setSelectedGrade(stageGrades[0]);
    }
  }, [stageGrades, selectedGrade]);

  // Filter sections for grade
  const applicableSections = useMemo(() => {
    if (!selectedGrade) return [];
    return activeStageSections.filter(s => normalizeGrade(s.grade) === normalizeGrade(selectedGrade));
  }, [activeStageSections, selectedGrade]);

  useEffect(() => {
    if (applicableSections.length > 0) {
      if (!selectedSectionId || (!applicableSections.some(s => s.id === selectedSectionId) && selectedSectionId !== "all")) {
        setSelectedSectionId("all");
      }
    } else {
      setSelectedSectionId("all");
    }
  }, [applicableSections, selectedSectionId]);

  // Current Exam
  const currentExam = useMemo(() => {
    return activeStageExams.find(e => e.id === selectedExamId) || activeStageExams[0];
  }, [activeStageExams, selectedExamId]);

  // Exam subjects for selected grade
  const applicableExamSubjects = useMemo(() => {
    if (!currentExam) return [];
    return activeStageExamSubjects.filter(es => {
      if (es.examId !== currentExam.id) return false;
      if (selectedGrade && normalizeGrade(es.grade) !== normalizeGrade(selectedGrade)) return false;
      return true;
    });
  }, [activeStageExamSubjects, currentExam, selectedGrade]);

  useEffect(() => {
    if (applicableExamSubjects.length > 0) {
      if (!selectedSubjectId || !applicableExamSubjects.some(es => es.id === selectedSubjectId)) {
        setSelectedSubjectId(applicableExamSubjects[0].id);
      }
    } else {
      setSelectedSubjectId("");
    }
  }, [applicableExamSubjects, selectedSubjectId]);

  const currentExamSubject = useMemo(() => {
    return applicableExamSubjects.find(es => es.id === selectedSubjectId) || applicableExamSubjects[0];
  }, [applicableExamSubjects, selectedSubjectId]);

  const currentSubject = useMemo(() => {
    if (!currentExamSubject) return null;
    return activeStageSubjects.find(s => s.id === currentExamSubject.subjectId);
  }, [currentExamSubject, activeStageSubjects]);

  const currentSection = useMemo(() => {
    if (selectedSectionId === "all") return null;
    return applicableSections.find(s => s.id === selectedSectionId);
  }, [applicableSections, selectedSectionId]);

  // Auto-detect assigned teacher from timetable/assignments
  const assignedTeacherFromStore = useMemo(() => {
    if (!currentSubject) return null;
    const match = allTeachingAssignments.find(a => 
      a.subjectId === currentSubject.id && 
      (selectedSectionId === "all" || a.sectionId === selectedSectionId)
    );
    if (match) {
      return allStaff.find(st => st.id === (match.teacherId || match.staffId));
    }
    return null;
  }, [allTeachingAssignments, currentSubject, selectedSectionId, allStaff]);

  useEffect(() => {
    if (!customTeacherSelected) {
      if (assignedTeacherFromStore) {
        setTeacherName(assignedTeacherFromStore.name);
      } else if (currentSubject) {
        // Fallback to teacher with matching specialization
        const matchSpec = allTeachers.find((t: any) => t.specialization?.includes(currentSubject.name));
        if (matchSpec) {
          setTeacherName(matchSpec.name);
        } else {
          setTeacherName("معلم المادة المكلف");
        }
      }
    }
  }, [assignedTeacherFromStore, currentSubject, allTeachers, customTeacherSelected]);

  // Synchronize dynamic breakdown columns with subject max score
  useEffect(() => {
    if (!currentExamSubject) return;
    const subjectMax = currentExamSubject.maxScore || 100;
    
    // Check if current columns already match max score
    const enabledSum = sheetColumns.filter(c => c.enabled).reduce((sum, c) => sum + c.maxScore, 0);
    if (enabledSum === subjectMax) return;

    // Smart auto-distribution based on subject max
    if (subjectMax <= 30) {
      setSheetColumns([
        { id: "c1", title: "أعمال ومشاركة", maxScore: Math.round(subjectMax * 0.3), enabled: true, category: "coursework" },
        { id: "c2", title: "تقويم وتطبيق عملي", maxScore: Math.round(subjectMax * 0.3), enabled: true, category: "continuous" },
        { id: "c3", title: "اختبار نصفي / تحريري", maxScore: subjectMax - (Math.round(subjectMax * 0.3) * 2), enabled: true, category: "midterm" },
      ]);
    } else if (subjectMax <= 50) {
      setSheetColumns([
        { id: "c1", title: "أعمال السنة", maxScore: 15, enabled: true, category: "coursework" },
        { id: "c2", title: "أنشطة وواجبات", maxScore: 10, enabled: true, category: "continuous" },
        { id: "c3", title: "اختبار تحريري", maxScore: subjectMax - 25, enabled: true, category: "final" },
      ]);
    } else {
      // 100 or standard institutional breakdown
      setSheetColumns([
        { id: "c1", title: "أعمال الفصل والواجبات", maxScore: 20, enabled: true, category: "coursework" },
        { id: "c2", title: "المشاركة والتقويم المستمر", maxScore: 20, enabled: true, category: "continuous" },
        { id: "c3", title: "الاختبار النصفي", maxScore: 20, enabled: true, category: "midterm" },
        { id: "c4", title: "الاختبار التحريري النهائي", maxScore: subjectMax - 60, enabled: true, category: "final" },
      ]);
    }
  }, [currentExamSubject?.id, currentExamSubject?.maxScore]);

  // Sum of enabled column marks
  const totalColumnsMaxScore = useMemo(() => {
    return sheetColumns.filter(c => c.enabled).reduce((sum, c) => sum + Number(c.maxScore || 0), 0);
  }, [sheetColumns]);

  const targetSubjectMax = currentExamSubject?.maxScore || 100;
  const isColumnsScoreMatching = totalColumnsMaxScore === targetSubjectMax;

  // Auto-balance columns function
  const handleAutoBalanceColumns = () => {
    const enabledCols = sheetColumns.filter(c => c.enabled);
    if (enabledCols.length === 0) return;
    
    const perCol = Math.floor(targetSubjectMax / enabledCols.length);
    const remainder = targetSubjectMax % enabledCols.length;

    const updated = sheetColumns.map(c => {
      if (!c.enabled) return c;
      const idx = enabledCols.findIndex(ec => ec.id === c.id);
      return {
        ...c,
        maxScore: perCol + (idx === enabledCols.length - 1 ? remainder : 0)
      };
    });

    setSheetColumns(updated);
    toast.success(`تمت موازنة درجات الأعمدة تلقائياً لتطابق الدرجة العظمى (${targetSubjectMax})`);
  };

  // Add custom column
  const handleAddColumn = () => {
    const newId = `col_${Date.now()}`;
    setSheetColumns(prev => [
      ...prev,
      { id: newId, title: `بند تقييم إضافي ${prev.length + 1}`, maxScore: 5, enabled: true, category: "custom" }
    ]);
  };

  // Remove column
  const handleRemoveColumn = (id: string) => {
    if (sheetColumns.length <= 1) {
      toast.error("يجب الإبقاء على عمود تقييم واحد على الأقل بالكشف");
      return;
    }
    setSheetColumns(prev => prev.filter(c => c.id !== id));
  };

  // Presets applicator
  const applyPreset = (preset: "midterm" | "full_term" | "single_exam" | "detailed") => {
    if (preset === "midterm") {
      const part1 = Math.round(targetSubjectMax * 0.3);
      const part2 = Math.round(targetSubjectMax * 0.3);
      setSheetColumns([
        { id: "p1", title: "مشاركة وواجبات", maxScore: part1, enabled: true, category: "coursework" },
        { id: "p2", title: "تقويم مستمر", maxScore: part2, enabled: true, category: "continuous" },
        { id: "p3", title: "تحريري نصفي", maxScore: targetSubjectMax - (part1 + part2), enabled: true, category: "midterm" }
      ]);
    } else if (preset === "full_term") {
      setSheetColumns([
        { id: "p1", title: "أعمال الفصل", maxScore: 20, enabled: true, category: "coursework" },
        { id: "p2", title: "أنشطة ومواظبة", maxScore: 20, enabled: true, category: "continuous" },
        { id: "p3", title: "نصف فصلي", maxScore: 20, enabled: true, category: "midterm" },
        { id: "p4", title: "نهائي تحريري", maxScore: targetSubjectMax - 60 > 0 ? targetSubjectMax - 60 : 40, enabled: true, category: "final" }
      ]);
    } else if (preset === "single_exam") {
      setSheetColumns([
        { id: "p1", title: "درجة الاختبار التحريري", maxScore: targetSubjectMax, enabled: true, category: "final" }
      ]);
    } else if (preset === "detailed") {
      setSheetColumns([
        { id: "p1", title: "مواظبة وسلوك", maxScore: 5, enabled: true, category: "coursework" },
        { id: "p2", title: "واجبات وتطبيقات", maxScore: 10, enabled: true, category: "continuous" },
        { id: "p3", title: "مشاريع وبحوث", maxScore: 10, enabled: true, category: "continuous" },
        { id: "p4", title: "اختبارات قصيرة", maxScore: 15, enabled: true, category: "midterm" },
        { id: "p5", title: "اختبار نهائي", maxScore: targetSubjectMax - 40 > 0 ? targetSubjectMax - 40 : 60, enabled: true, category: "final" }
      ]);
    }
    toast.success("تم تطبيق قالب الأعمدة بنجاح");
  };

  // -------------------------------------------------------------------------
  // Students list derivation and draft calculation
  // -------------------------------------------------------------------------
  const rawStudentsList = useMemo(() => {
    if (!selectedGrade) return [];

    let enrollments = allStudentEnrollments.filter(e => {
      if (e.academicYearId !== currentAcademicYearId) return false;
      if (selectedSectionId && selectedSectionId !== "all" && e.sectionId !== selectedSectionId) return false;
      return true;
    });

    if (selectedSectionId && selectedSectionId !== "all") {
      // already section-filtered
    } else {
      const secIds = new Set(applicableSections.map(s => s.id));
      enrollments = enrollments.filter(e => e.sectionId && secIds.has(e.sectionId));
    }

    const items = enrollments.map(enr => {
      const student = activeStageStudents.find(s => s.id === enr.studentId);
      const section = activeStageSections.find(s => s.id === enr.sectionId);
      if (!student) return null;

      let existingResult: any = null;
      if (currentExamSubject) {
        existingResult = allExamResults.find(r => r.examSubjectId === currentExamSubject.id && r.studentEnrollmentId === enr.id);
      }

      const markVal = existingResult?.mark !== undefined ? existingResult.mark : null;
      const isAbsent = existingResult?.status === "absent" || existingResult?.isAbsent;
      const passScore = currentExamSubject?.passScore || 50;
      const isFailing = markVal !== null && markVal < passScore;

      return {
        student,
        enrollment: enr,
        section,
        existingResult,
        mark: markVal,
        isAbsent,
        isFailing
      };
    }).filter(Boolean) as {
      student: any;
      enrollment: any;
      section: any;
      existingResult: any;
      mark: any;
      isAbsent: boolean;
      isFailing: boolean;
    }[];

    return items;
  }, [selectedGrade, selectedSectionId, applicableSections, allStudentEnrollments, currentAcademicYearId, activeStageStudents, activeStageSections, currentExamSubject, allExamResults]);

  // Filter & Sort students
  const studentsList = useMemo(() => {
    let list = [...rawStudentsList];

    // Filter if in draft mode
    if (sheetMode === "draft_filled") {
      if (draftResultFilter === "recorded") {
        list = list.filter(item => item.mark !== null);
      } else if (draftResultFilter === "unrecorded") {
        list = list.filter(item => item.mark === null && !item.isAbsent);
      } else if (draftResultFilter === "failing") {
        list = list.filter(item => item.isFailing);
      } else if (draftResultFilter === "passing") {
        list = list.filter(item => item.mark !== null && !item.isFailing);
      }
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "nationalId") {
        return (a.student.nationalId || "").localeCompare(b.student.nationalId || "");
      }
      if (sortBy === "scoreDesc") {
        return (Number(b.mark) || 0) - (Number(a.mark) || 0);
      }
      if (sortBy === "scoreAsc") {
        return (Number(a.mark) || 0) - (Number(b.mark) || 0);
      }
      // default: name
      return a.student.name.localeCompare(b.student.name, "ar");
    });

    return list;
  }, [rawStudentsList, sheetMode, draftResultFilter, sortBy]);

  // Draft Statistical Analytics
  const draftStats = useMemo(() => {
    const recorded = rawStudentsList.filter(s => s.mark !== null && !s.isAbsent);
    const absentCount = rawStudentsList.filter(s => s.isAbsent).length;
    const passScore = currentExamSubject?.passScore || 50;
    
    if (recorded.length === 0) {
      return {
        total: rawStudentsList.length,
        recordedCount: 0,
        unrecordedCount: rawStudentsList.length,
        absentCount,
        passRate: 0,
        average: 0,
        highest: 0,
        lowest: 0,
        passingCount: 0,
        failingCount: 0,
      };
    }

    const scores = recorded.map(s => Number(s.mark));
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    const average = Math.round((sum / recorded.length) * 10) / 10;
    const passingCount = recorded.filter(s => Number(s.mark) >= passScore).length;
    const failingCount = recorded.length - passingCount;
    const passRate = Math.round((passingCount / recorded.length) * 100);

    return {
      total: rawStudentsList.length,
      recordedCount: recorded.length,
      unrecordedCount: rawStudentsList.length - recorded.length - absentCount,
      absentCount,
      passRate,
      average,
      highest,
      lowest,
      passingCount,
      failingCount,
    };
  }, [rawStudentsList, currentExamSubject]);

  // -------------------------------------------------------------------------
  // Print Execution
  // -------------------------------------------------------------------------
  const handlePrint = () => {
    const printArea = document.getElementById("printable-grade-sheet");
    if (!printArea) {
      toast.error("تعذر العثور على منطقة الطباعة");
      return;
    }

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

    const orientationStyle = pageOrientation === "landscape" 
      ? `@page { size: A4 landscape; margin: 8mm 8mm 8mm 8mm; }`
      : `@page { size: A4 portrait; margin: 10mm 8mm 10mm 8mm; }`;

    const densityPadding = rowDensity === "compact" ? "3px 4px" : rowDensity === "spacious" ? "8px 8px" : "5px 6px";
    const baseFontSize = fontSize === "sm" ? "10px" : fontSize === "lg" ? "12px" : "11px";

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>كشف_رصد_درجات_${selectedGrade}_${currentSubject?.name || "مادة"}</title>
        <style>
          ${orientationStyle}
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #0f172a;
            background: #fff;
            direction: rtl;
            font-size: ${baseFontSize};
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #1e293b;
            padding: ${densityPadding};
            font-size: ${baseFontSize};
            text-align: center;
          }
          th {
            background-color: #f1f5f9 !important;
            font-weight: 800;
          }
          ${stripeRows ? `tr:nth-child(even) td { background-color: #f8fafc !important; }` : ''}
          .no-break {
            page-break-inside: avoid;
          }
          .page-break {
            page-break-after: always;
          }
          .print-header-repeat {
            display: table-header-group;
          }
          .watermark-box {
            position: relative;
          }
          .watermark-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 80px;
            color: rgba(148, 163, 184, 0.08);
            font-weight: 900;
            pointer-events: none;
            white-space: nowrap;
            z-index: 0;
          }
        </style>
      </head>
      <body>
        ${printArea.innerHTML}
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

  // CSV Export
  const handleExportCSV = () => {
    if (studentsList.length === 0) {
      toast.error("لا توجد بيانات طلاب لتصديرها");
      return;
    }

    const enabledColumns = sheetColumns.filter(c => c.enabled);
    const headers = [
      "م",
      "رقم الجلوس / الهوية",
      "اسم الطالب",
      "الصف الدراسي",
      "الشعبة",
      ...enabledColumns.map(c => `${c.title} (${c.maxScore})`),
      "المجموع الكلي",
      showTafqeetWords ? "المجموع كتابة (التفقيد)" : "",
      showNotesColumn ? "ملاحظات الكنترول" : ""
    ].filter(Boolean);

    const rows = studentsList.map((item, idx) => {
      const markNum = item.mark !== null ? Number(item.mark) : "";
      
      const colMarks = enabledColumns.map(col => {
        if (sheetMode === "draft_filled" && markNum !== "") {
          return Math.round((Number(markNum) * (col.maxScore / targetSubjectMax)) * 10) / 10;
        }
        return "";
      });

      return [
        idx + 1,
        item.student.nationalId || item.student.id.slice(-6),
        item.student.name,
        selectedGrade,
        item.section?.name || "",
        ...colMarks,
        sheetMode === "draft_filled" && markNum !== "" ? markNum : "",
        showTafqeetWords && sheetMode === "draft_filled" && markNum !== "" ? tafqeetMarks(markNum) : "",
        showNotesColumn ? (item.existingResult?.notes || (item.isAbsent ? "غائب بعذر" : "")) : ""
      ].filter((_, i) => headers[i] !== undefined);
    });

    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `كشف_رصد_${selectedGrade}_${currentSubject?.name || "درجات"}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير كشف الرصد كملف CSV بنجاح");
  };

  // Copy table to clipboard (Excel / Word friendly)
  const handleCopyTable = () => {
    const tableEl = document.getElementById("printable-grade-sheet-table");
    if (!tableEl) return;
    
    try {
      const range = document.createRange();
      range.selectNode(tableEl);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      document.execCommand("copy");
      window.getSelection()?.removeAllRanges();
      toast.success("تم نسخ جدول الرصد للحافظة، يمكنك لصقه مباشرة في Excel أو Word!");
    } catch {
      toast.error("تعذر النسخ التلقائي");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-card text-foreground border border-border/80 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* =========================================================================
            1. MODAL TOP BAR
        ========================================================================= */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-b border-border/70 bg-gradient-to-r from-primary/10 via-background to-background shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center shadow-md shadow-primary/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-foreground">
                  استوديو إصدار كشوف رصد وتسليم الدرجات الرسمية
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-primary/15 text-primary border border-primary/25">
                  {getStageArabic(stage)}
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border/60">
                  A4 مخصص للكنترول
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                كشوفات معتمدة ومطابقة للمواصفات الوزارية، تدعم الرصد اليدوي والمسودات وتوزيع الدرجات المخصص
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. INTERACTIVE CONTROL TABS RIBBON
        ========================================================================= */}
        <div className="border-b border-border/60 bg-muted/20 px-5 sm:px-7 py-2 shrink-0 flex items-center justify-between gap-3 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("scope")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "scope" 
                  ? "bg-primary text-white shadow-xs" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. نطاق الكشف والمادة</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("columns")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "columns" 
                  ? "bg-primary text-white shadow-xs" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>2. توزيع الأعمدة والدرجات</span>
              {!isColumnsScoreMatching && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="مجموع الأعمدة لا يطابق العظمى" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("layout")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "layout" 
                  ? "bg-primary text-white shadow-xs" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>3. إعدادات الورقة والترويسة</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("signatures")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === "signatures" 
                  ? "bg-primary text-white shadow-xs" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>4. التوقيعات والاعتمادات</span>
            </button>

            {sheetMode === "draft_filled" && (
              <button
                type="button"
                onClick={() => setActiveTab("draft")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeTab === "draft" 
                    ? "bg-primary text-white shadow-xs" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>5. تحليل المسودة ({draftStats.recordedCount} رصد)</span>
              </button>
            )}
          </div>

          {/* Quick Mode Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-muted-foreground hidden md:inline">نوع الكشف:</span>
            <div className="inline-flex rounded-xl bg-card p-1 border border-border/80 shadow-xs">
              <button
                type="button"
                onClick={() => setSheetMode("blank")}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  sheetMode === "blank" 
                    ? "bg-primary text-white shadow-xs" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                كشف فارغ للرصد اليدوي
              </button>
              <button
                type="button"
                onClick={() => setSheetMode("draft_filled")}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  sheetMode === "draft_filled" 
                    ? "bg-primary text-white shadow-xs" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                مسودة بالدرجات المرصودة
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. TAB CONTENT PANELS
        ========================================================================= */}
        <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/15 shrink-0 transition-all">
          
          {/* TAB 1: SCOPE & FILTERS */}
          {activeTab === "scope" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs animate-in fade-in duration-150">
              {/* Exam Period */}
              <div>
                <label className="block font-black text-muted-foreground mb-1">الامتحان / الفترة</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border/80 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-xs"
                >
                  {activeStageExams.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>

              {/* Grade */}
              <div>
                <label className="block font-black text-muted-foreground mb-1">الصف الدراسي</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border/80 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-xs"
                >
                  {stageGrades.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block font-black text-muted-foreground mb-1">الشعبة</label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border/80 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-xs"
                >
                  <option value="all">كافة شعب الصف ({applicableSections.length} شعب)</option>
                  {applicableSections.map(sec => (
                    <option key={sec.id} value={sec.id}>{sec.name}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block font-black text-muted-foreground mb-1">المادة الدراسية</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border/80 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-xs"
                >
                  {applicableExamSubjects.map(es => {
                    const sub = activeStageSubjects.find(s => s.id === es.subjectId);
                    return (
                      <option key={es.id} value={es.id}>
                        {sub ? sub.name : es.subjectId} (العظمى: {es.maxScore} | النجاح: {es.passScore})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Teacher Selector with assigned link */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-black text-muted-foreground">معلم المادة المكلف</label>
                  {assignedTeacherFromStore && !customTeacherSelected && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> مكلف رسمياً
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    value={allTeachers.some(t => t.name === teacherName) ? teacherName : "custom"}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setCustomTeacherSelected(true);
                      } else {
                        setTeacherName(e.target.value);
                        setCustomTeacherSelected(false);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-border/80 bg-card text-foreground font-bold focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-xs"
                  >
                    {assignedTeacherFromStore && (
                      <option value={assignedTeacherFromStore.name}>
                        ⭐ {assignedTeacherFromStore.name} (المسند إليه بالجدول)
                      </option>
                    )}
                    {allTeachers.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                    <option value="custom">✏️ كتابة اسم مخصص...</option>
                  </select>

                  {customTeacherSelected && (
                    <input
                      type="text"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder="اسم المعلم..."
                      className="w-40 px-3 py-2 rounded-xl border border-primary bg-card text-foreground font-bold focus:ring-2 focus:ring-primary focus:outline-none text-xs"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COLUMNS & MARKS BREAKDOWN */}
          {activeTab === "columns" && (
            <div className="space-y-4 animate-in fade-in duration-150 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-black text-foreground">قوالب توزيع الدرجات الجاهزة:</span>
                  <button
                    type="button"
                    onClick={() => applyPreset("midterm")}
                    className="px-2.5 py-1 rounded-lg bg-card border border-border/80 hover:border-primary font-bold text-muted-foreground hover:text-primary transition-all cursor-pointer"
                  >
                    قالب نصفي (3 بنود)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("full_term")}
                    className="px-2.5 py-1 rounded-lg bg-card border border-border/80 hover:border-primary font-bold text-muted-foreground hover:text-primary transition-all cursor-pointer"
                  >
                    قالب فصلي عام (4 بنود)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("detailed")}
                    className="px-2.5 py-1 rounded-lg bg-card border border-border/80 hover:border-primary font-bold text-muted-foreground hover:text-primary transition-all cursor-pointer"
                  >
                    قالب تفصيلي شامل (5 بنود)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("single_exam")}
                    className="px-2.5 py-1 rounded-lg bg-card border border-border/80 hover:border-primary font-bold text-muted-foreground hover:text-primary transition-all cursor-pointer"
                  >
                    بند تحريري واحد فقط
                  </button>
                </div>

                {/* Score verification badge */}
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-xl border font-black flex items-center gap-1.5 ${
                    isColumnsScoreMatching 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                  }`}>
                    {isColumnsScoreMatching ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span>مجموع درجات الأعمدة: <strong>{totalColumnsMaxScore}</strong> / <strong>{targetSubjectMax}</strong></span>
                  </div>

                  {!isColumnsScoreMatching && (
                    <button
                      type="button"
                      onClick={handleAutoBalanceColumns}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black hover:bg-amber-400 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> موازنة تلقائية
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleAddColumn}
                    className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/30 text-primary font-black hover:bg-primary/20 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> إضافة عمود
                  </button>
                </div>
              </div>

              {/* Dynamic Columns Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {sheetColumns.map((col, idx) => (
                  <div 
                    key={col.id} 
                    className={`p-3 rounded-2xl border transition-all space-y-2 ${
                      col.enabled 
                        ? "bg-card border-border/80 shadow-xs" 
                        : "bg-muted/40 border-border/40 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-muted-foreground">عمود #{idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSheetColumns(prev => prev.map(c => c.id === col.id ? { ...c, enabled: !c.enabled } : c));
                          }}
                          className={`p-1 rounded-lg transition-all cursor-pointer ${
                            col.enabled ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"
                          }`}
                          title={col.enabled ? "تعطيل العمود" : "تفعيل العمود"}
                        >
                          {col.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveColumn(col.id)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                          title="حذف هذا العمود"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={col.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSheetColumns(prev => prev.map(c => c.id === col.id ? { ...c, title: val } : c));
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border/80 bg-background font-bold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                        placeholder="اسم العمود..."
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground font-bold">الدرجة العظمى:</span>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={col.maxScore}
                        onChange={(e) => {
                          const val = Math.max(1, Number(e.target.value) || 0);
                          setSheetColumns(prev => prev.map(c => c.id === col.id ? { ...c, maxScore: val } : c));
                        }}
                        className="w-20 px-2 py-1 rounded-lg border border-border/80 bg-background font-mono font-black text-center text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LAYOUT & PRINT SETTINGS */}
          {activeTab === "layout" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs animate-in fade-in duration-150">
              {/* Orientation & Sizing */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-card border border-border/70">
                <span className="font-black text-foreground block border-b border-border/60 pb-1.5">
                  1. اتجاه الورقة وكثافة الصفوف (A4)
                </span>
                
                <div className="space-y-1.5">
                  <label className="font-bold text-muted-foreground block">اتجاه الصفحة:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPageOrientation("landscape")}
                      className={`p-2 rounded-xl border text-center font-black transition-all cursor-pointer ${
                        pageOrientation === "landscape" 
                          ? "bg-primary text-white border-primary shadow-xs" 
                          : "bg-muted/40 text-muted-foreground border-border/80 hover:bg-muted"
                      }`}
                    >
                      A4 أفقي (عرضي) - مستحسن
                    </button>
                    <button
                      type="button"
                      onClick={() => setPageOrientation("portrait")}
                      className={`p-2 rounded-xl border text-center font-black transition-all cursor-pointer ${
                        pageOrientation === "portrait" 
                          ? "bg-primary text-white border-primary shadow-xs" 
                          : "bg-muted/40 text-muted-foreground border-border/80 hover:bg-muted"
                      }`}
                    >
                      A4 رأسي (طولي)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-muted-foreground block">كثافة السطور والطباعة:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRowDensity("compact")}
                      className={`p-1.5 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                        rowDensity === "compact" ? "bg-primary/15 text-primary border-primary" : "border-border/60 text-muted-foreground"
                      }`}
                    >
                      مضغوط (40 طالب)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRowDensity("normal")}
                      className={`p-1.5 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                        rowDensity === "normal" ? "bg-primary/15 text-primary border-primary" : "border-border/60 text-muted-foreground"
                      }`}
                    >
                      قياسي (28 طالب)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRowDensity("spacious")}
                      className={`p-1.5 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                        rowDensity === "spacious" ? "bg-primary/15 text-primary border-primary" : "border-border/60 text-muted-foreground"
                      }`}
                    >
                      مريح (20 طالب)
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-muted-foreground block">حجم خط الجدول:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFontSize("sm")}
                      className={`p-1.5 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                        fontSize === "sm" ? "bg-primary/15 text-primary border-primary" : "border-border/60 text-muted-foreground"
                      }`}
                    >
                      صغير (10pt)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSize("md")}
                      className={`p-1.5 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                        fontSize === "md" ? "bg-primary/15 text-primary border-primary" : "border-border/60 text-muted-foreground"
                      }`}
                    >
                      متوسط (11pt)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSize("lg")}
                      className={`p-1.5 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                        fontSize === "lg" ? "bg-primary/15 text-primary border-primary" : "border-border/60 text-muted-foreground"
                      }`}
                    >
                      كبير (12pt)
                    </button>
                  </div>
                </div>
              </div>

              {/* Header & Verification Toggles */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-card border border-border/70">
                <span className="font-black text-foreground block border-b border-border/60 pb-1.5">
                  2. شعارات واعتمادات الترويسة الرسمية
                </span>

                <div className="space-y-2 font-bold text-muted-foreground">
                  <label className="flex items-center justify-between cursor-pointer p-1 hover:bg-muted/40 rounded-lg">
                    <span>إظهار ترويسة وزارة التربية والتعليم</span>
                    <input
                      type="checkbox"
                      checked={showMinistryEmblem}
                      onChange={(e) => setShowMinistryEmblem(e.target.checked)}
                      className="rounded border-border text-primary w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-1 hover:bg-muted/40 rounded-lg">
                    <span>إظهار اسم وشعار المدرسة المعتمد</span>
                    <input
                      type="checkbox"
                      checked={showSchoolHeader}
                      onChange={(e) => setShowSchoolHeader(e.target.checked)}
                      className="rounded border-border text-primary w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-1 hover:bg-muted/40 rounded-lg">
                    <span>رمز QR المشفر للتحقق والاعتماد الرقمي</span>
                    <input
                      type="checkbox"
                      checked={showQrVerification}
                      onChange={(e) => setShowQrVerification(e.target.checked)}
                      className="rounded border-border text-primary w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-1 hover:bg-muted/40 rounded-lg">
                    <span>مربع ختم لجنة الكنترول الرسمي</span>
                    <input
                      type="checkbox"
                      checked={showControlSealBox}
                      onChange={(e) => setShowControlSealBox(e.target.checked)}
                      className="rounded border-border text-primary w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-1 hover:bg-muted/40 rounded-lg">
                    <span>تظليل الصفوف بالتناوب (Zebra Lines)</span>
                    <input
                      type="checkbox"
                      checked={stripeRows}
                      onChange={(e) => setStripeRows(e.target.checked)}
                      className="rounded border-border text-primary w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Extra Columns & Rows */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-card border border-border/70">
                <span className="font-black text-foreground block border-b border-border/60 pb-1.5">
                  3. الأعمدة الإضافية والصفوف الفارغة
                </span>

                <div className="space-y-2 font-bold text-muted-foreground">
                  <label className="flex items-center justify-between cursor-pointer p-1 hover:bg-muted/40 rounded-lg">
                    <span>إظهار عمود رقم الجلوس / الهوية</span>
                    <input
                      type="checkbox"
                      checked={showNationalId}
                      onChange={(e) => setShowNationalId(e.target.checked)}
                      className="rounded border-border text-primary w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-1 hover:bg-muted/40 rounded-lg">
                    <span>إظهار عمود الشعبة (عند دمج الشعب)</span>
                    <input
                      type="checkbox"
                      checked={showSectionColumn}
                      onChange={(e) => setShowSectionColumn(e.target.checked)}
                      className="rounded border-border text-primary w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-1 hover:bg-muted/40 rounded-lg">
                    <span>إظهار عمود التفقيد كتابة (بالحروف)</span>
                    <input
                      type="checkbox"
                      checked={showTafqeetWords}
                      onChange={(e) => setShowTafqeetWords(e.target.checked)}
                      className="rounded border-border text-primary w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-1 hover:bg-muted/40 rounded-lg">
                    <span>إظهار عمود ملاحظات الكنترول</span>
                    <input
                      type="checkbox"
                      checked={showNotesColumn}
                      onChange={(e) => setShowNotesColumn(e.target.checked)}
                      className="rounded border-border text-primary w-4 h-4 cursor-pointer"
                    />
                  </label>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeExtraRows}
                        onChange={(e) => setIncludeExtraRows(e.target.checked)}
                        className="rounded border-border text-primary w-4 h-4 cursor-pointer"
                      />
                      <span>إضافة صفوف للمستجدين</span>
                    </label>

                    {includeExtraRows && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="15"
                          value={extraRowsCount}
                          onChange={(e) => setExtraRowsCount(Math.max(1, Number(e.target.value) || 1))}
                          className="w-14 px-2 py-1 rounded-lg border border-border/80 bg-background text-center font-mono font-black"
                        />
                        <span className="text-[11px] text-muted-foreground">صفوف</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SIGNATURES & VERIFICATION */}
          {activeTab === "signatures" && (
            <div className="space-y-4 animate-in fade-in duration-150 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-foreground">طاقم التوقيعات والاعتماد الرسمي للكشف</h4>
                  <p className="text-[11px] text-muted-foreground">
                    يمكنك تعديل مسميات الوظائف وأسماء الموقعين أو إخفاء أي توقيع من أسفل الورقة المطبوعة
                  </p>
                </div>

                <label className="flex items-center gap-2 font-bold cursor-pointer bg-card px-3 py-1.5 rounded-xl border border-border/80">
                  <input
                    type="checkbox"
                    checked={showStatsFooter}
                    onChange={(e) => setShowStatsFooter(e.target.checked)}
                    className="rounded border-border text-primary w-4 h-4 cursor-pointer"
                  />
                  <span>إظهار شريط إحصائيات الحضور والغياب وتاريخ التسليم</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {signers.map(sig => (
                  <div 
                    key={sig.id} 
                    className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                      sig.enabled ? "bg-card border-border/80 shadow-xs" : "bg-muted/40 border-border/40 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-foreground">{sig.title}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSigners(prev => prev.map(s => s.id === sig.id ? { ...s, enabled: !s.enabled } : s));
                        }}
                        className={`p-1 rounded-lg transition-all cursor-pointer ${
                          sig.enabled ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"
                        }`}
                        title={sig.enabled ? "إخفاء من الكشف" : "إظهار بالكشف"}
                      >
                        {sig.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">المسمى الوظيفي بالكشف:</label>
                      <input
                        type="text"
                        value={sig.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSigners(prev => prev.map(s => s.id === sig.id ? { ...s, title: val } : s));
                        }}
                        className="w-full px-2.5 py-1 rounded-lg border border-border/80 bg-background font-bold text-foreground text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground block mb-0.5">الاسم المطبوع (أو اتركه فارغاً للتوقيع اليدوي):</label>
                      <input
                        type="text"
                        value={sig.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSigners(prev => prev.map(s => s.id === sig.id ? { ...s, name: val } : s));
                        }}
                        placeholder="الاسم: ..................."
                        className="w-full px-2.5 py-1 rounded-lg border border-border/80 bg-background font-bold text-foreground text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: DRAFT ANALYTICS (ONLY IN DRAFT MODE) */}
          {activeTab === "draft" && sheetMode === "draft_filled" && (
            <div className="space-y-4 animate-in fade-in duration-150 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-card border border-border/70 shadow-xs">
                  <div className="text-[10px] text-muted-foreground font-bold">إجمالي طلاب الكشف</div>
                  <div className="text-lg font-black text-foreground mt-0.5">{draftStats.total}</div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-xs">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">الدرجات المرصودة</div>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {draftStats.recordedCount} <span className="text-xs font-normal">({Math.round((draftStats.recordedCount / (draftStats.total || 1)) * 100)}%)</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-xs">
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">المتبقي رصدهم</div>
                  <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">{draftStats.unrecordedCount}</div>
                </div>

                <div className="p-3 rounded-2xl bg-primary/10 border border-primary/30 shadow-xs">
                  <div className="text-[10px] text-primary font-bold">متوسط درجات الكشف</div>
                  <div className="text-lg font-black text-primary mt-0.5 font-mono">{draftStats.average}</div>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/70 shadow-xs">
                  <div className="text-[10px] text-muted-foreground font-bold">أعلى وأدنى درجة</div>
                  <div className="text-sm font-black text-foreground mt-1 font-mono">
                    <span className="text-emerald-600">{draftStats.highest}</span> / <span className="text-rose-600">{draftStats.lowest}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/70 shadow-xs">
                  <div className="text-[10px] text-muted-foreground font-bold">نسبة النجاح</div>
                  <div className="text-lg font-black text-foreground mt-0.5 font-mono">
                    {draftStats.passRate}%
                  </div>
                </div>
              </div>

              {/* Filter Draft Rows */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-muted-foreground">فلترة عرض المسودة:</span>
                  <div className="inline-flex rounded-xl bg-card p-1 border border-border/80">
                    <button
                      type="button"
                      onClick={() => setDraftResultFilter("all")}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        draftResultFilter === "all" ? "bg-primary text-white" : "text-muted-foreground"
                      }`}
                    >
                      كافة الطلاب ({rawStudentsList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraftResultFilter("failing")}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        draftResultFilter === "failing" ? "bg-rose-600 text-white" : "text-muted-foreground"
                      }`}
                    >
                      الراسبين فقط ({draftStats.failingCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraftResultFilter("passing")}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        draftResultFilter === "passing" ? "bg-emerald-600 text-white" : "text-muted-foreground"
                      }`}
                    >
                      الناجحين فقط ({draftStats.passingCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraftResultFilter("unrecorded")}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        draftResultFilter === "unrecorded" ? "bg-amber-600 text-white" : "text-muted-foreground"
                      }`}
                    >
                      غير المرصود لهم ({draftStats.unrecordedCount})
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-muted-foreground">ترتيب الطلاب بالكشف:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl border border-border/80 bg-card text-foreground font-bold focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="name">أبجدي حسب اسم الطالب (أ - ي)</option>
                    <option value="nationalId">حسب رقم الجلوس / الهوية</option>
                    <option value="scoreDesc">حسب الدرجة (من الأعلى للأدنى)</option>
                    <option value="scoreAsc">حسب الدرجة (من الأدنى للأعلى)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* =========================================================================
            4. LIVE A4 SHEET PREVIEW CONTAINER (SCROLLABLE)
        ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/10 dark:bg-black/40 flex flex-col items-center">
          
          {/* Preview Toolbar */}
          <div className="w-full max-w-5xl mb-3 flex items-center justify-between gap-3 text-xs bg-card/90 backdrop-blur-md p-2 rounded-2xl border border-border/80 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-foreground">معاينة ورقة A4:</span>
              <span className="text-muted-foreground">
                ({pageOrientation === "landscape" ? "أفقي 297mm × 210mm" : "رأسي 210mm × 297mm"})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted/60 rounded-xl p-1 border border-border/60">
                <button
                  type="button"
                  onClick={() => setPreviewZoom(prev => Math.max(60, prev - 10))}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card cursor-pointer"
                  title="تصغير المعاينة"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-mono font-bold text-[11px] text-foreground">{previewZoom}%</span>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(prev => Math.min(140, prev + 10))}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card cursor-pointer"
                  title="تكبير المعاينة"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyTable}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border/80 bg-card hover:bg-muted font-bold text-foreground transition-all cursor-pointer"
                title="نسخ جدول الطلاب للحافظة لبرامج Word أو Excel"
              >
                <Copy className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">نسخ الجدول</span>
              </button>
            </div>
          </div>

          {/* Scale wrapper for zoom */}
          <div 
            style={{ 
              transform: `scale(${previewZoom / 100})`, 
              transformOrigin: "top center",
              transition: "transform 0.2s ease-in-out" 
            }}
            className="w-full flex justify-center"
          >
            {/* PRINTABLE ELEMENT CONTAINER */}
            <div 
              id="printable-grade-sheet" 
              className="bg-white text-slate-950 p-6 sm:p-9 rounded-2xl shadow-2xl border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0 w-full watermark-box"
              style={{ 
                maxWidth: pageOrientation === "landscape" ? "297mm" : "210mm",
                minHeight: pageOrientation === "landscape" ? "210mm" : "297mm"
              }}
            >
              {/* Optional Subtle Watermark */}
              <div className="watermark-text select-none">
                {systemSettings?.schoolName || "مدرسة داراسي النموذجية"}
              </div>

              {/* -------------------------------------------------------------
                  1. OFFICIAL MINISTERIAL HEADER
              ------------------------------------------------------------- */}
              <div className="border-b-2 border-slate-900 pb-3 mb-3">
                <div className="flex items-start justify-between text-xs font-black leading-relaxed">
                  
                  {/* Right: Ministry and School */}
                  <div className="text-right space-y-0.5">
                    {showMinistryEmblem && (
                      <>
                        <p className="text-slate-800 text-[11px] font-bold">المملكة العربية السعودية</p>
                        <p className="text-slate-800 text-[11px] font-bold">وزارة التعليم</p>
                        <p className="text-slate-700 text-[10px]">الإدارة العامة للتعليم الأهلي والخاص</p>
                      </>
                    )}
                    {showSchoolHeader && (
                      <>
                        <p className="text-sm sm:text-base font-black text-slate-950 pt-0.5">
                          {systemSettings?.schoolName || "مدرسة الأفق النموذجية الأهلية"}
                        </p>
                        <p className="text-primary font-bold text-[11px]">
                          قسم شؤون الاختبارات والكنترول - {getStageArabic(stage)}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Center: Title & Seal */}
                  <div className="text-center space-y-1">
                    <div className="w-11 h-11 mx-auto rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center font-black text-slate-800 text-lg shadow-xs">
                      🏛️
                    </div>
                    <h1 className="text-base sm:text-xl font-black text-slate-950 tracking-tight">
                      كشف رصد وتسليم درجات الطلاب
                    </h1>
                    <div className="inline-block px-3 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-[11px] font-black text-slate-800">
                      {sheetMode === "blank" ? "«كشف رسمي فارغ للرصد اليدوي والكنترول»" : "«مسودة بالدرجات المرصودة للمراجعة والمطابقة»"}
                    </div>
                  </div>

                  {/* Left: Term, Year, and QR Verification */}
                  <div className="flex items-center gap-3 text-left" dir="ltr">
                    {showQrVerification && (
                      <div className="p-1 rounded-xl bg-white border border-slate-300 shadow-xs hidden sm:block">
                        <QRCode 
                          value={`GRADE_SHEET:${currentAcademicYearId}:${selectedExamId}:${selectedGrade}:${selectedSubjectId}`} 
                          size={52} 
                        />
                      </div>
                    )}
                    <div className="space-y-0.5 text-[10px] text-slate-700 font-bold">
                      <p>Year: <span className="font-mono text-slate-950">{currentAcademicYear?.name || "1446 - 1447 هـ"}</span></p>
                      <p>Term: <span className="text-slate-950">{activeAcademicTerm?.name || "الفصل الثاني"}</span></p>
                      <p>Exam: <span className="text-slate-950">{currentExam?.name}</span></p>
                      {showDateHeader && (
                        <p className="text-slate-500 font-mono text-[9px]">Date: {new Date().toLocaleDateString('en-CA')}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* -------------------------------------------------------------
                    2. SUBJECT & CLASS META BANNER
                ------------------------------------------------------------- */}
                <div className="mt-3 p-2.5 bg-slate-100/90 border border-slate-300 rounded-xl grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs font-bold text-center">
                  <div>
                    <span className="text-slate-500 block text-[10px]">المادة الدراسية</span>
                    <span className="font-black text-slate-950 text-sm">{currentSubject?.name || "المادة"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">الصف الدراسي</span>
                    <span className="font-black text-slate-950">{selectedGrade}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">الشعبة</span>
                    <span className="font-black text-slate-950">{currentSection?.name || (selectedSectionId === "all" ? `كافة الشعب (${applicableSections.length})` : "-")}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">معلم المادة</span>
                    <span className="font-black text-slate-950">{teacherName || "معلم المادة المكلف"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">الدرجة الكبرى</span>
                    <span className="font-black text-primary text-sm font-mono">{targetSubjectMax}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">درجة النجاح (الصغرى)</span>
                    <span className="font-black text-rose-600 text-sm font-mono">{currentExamSubject?.passScore || Math.round(targetSubjectMax * 0.5)}</span>
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------------
                  3. STUDENTS GRADING TABLE
              ------------------------------------------------------------- */}
              <div className="overflow-x-auto">
                <table 
                  id="printable-grade-sheet-table" 
                  className={`w-full border-collapse border border-slate-900 ${
                    fontSize === "sm" ? "text-[10px]" : fontSize === "lg" ? "text-xs" : "text-[11px]"
                  }`}
                >
                  <thead className="print-header-repeat">
                    <tr className="bg-slate-200 text-slate-950 font-black">
                      <th className="border border-slate-900 p-1.5 w-10 text-center font-black">#</th>
                      {showNationalId && (
                        <th className="border border-slate-900 p-1.5 w-24 sm:w-28 text-center font-black">رقم الجلوس / الهوية</th>
                      )}
                      <th className="border border-slate-900 p-1.5 min-w-[160px] text-right font-black">اسم الطالب رباعياً</th>
                      {showSectionColumn && selectedSectionId === "all" && (
                        <th className="border border-slate-900 p-1.5 w-14 text-center font-black">الشعبة</th>
                      )}
                      
                      {/* Dynamic Columns */}
                      {sheetColumns.filter(c => c.enabled).map(col => (
                        <th key={col.id} className="border border-slate-900 p-1.5 w-18 text-center font-black">
                          <div>{col.title}</div>
                          <div className="text-[9px] text-slate-600 font-mono font-normal">({col.maxScore})</div>
                        </th>
                      ))}

                      {/* Total Column */}
                      <th className="border border-slate-900 p-1.5 w-20 text-center font-black bg-slate-300">
                        <div>المجموع</div>
                        <div className="text-[9px] text-slate-700 font-mono font-normal">({targetSubjectMax})</div>
                      </th>

                      {/* Tafqeet Words */}
                      {showTafqeetWords && (
                        <th className="border border-slate-900 p-1.5 min-w-[110px] text-center font-black">
                          المجموع كتابة (التفقيد)
                        </th>
                      )}

                      {/* Control Notes */}
                      {showNotesColumn && (
                        <th className="border border-slate-900 p-1.5 w-24 text-center font-black">
                          ملاحظات الكنترول
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {studentsList.map((item, idx) => {
                      const isEven = idx % 2 === 1;
                      const markNum = item.mark !== null ? Number(item.mark) : "";
                      const rowBg = stripeRows && isEven ? "bg-slate-50" : "bg-white";
                      const failClass = item.isFailing && sheetMode === "draft_filled" ? "bg-rose-50 text-rose-950 font-bold" : "";

                      return (
                        <tr 
                          key={item.enrollment.id} 
                          className={`${rowBg} ${failClass} hover:bg-slate-100 transition-colors`}
                        >
                          <td className="border border-slate-900 p-1.5 text-center font-black text-slate-700 font-mono">
                            {idx + 1}
                          </td>

                          {showNationalId && (
                            <td className="border border-slate-900 p-1.5 text-center font-mono font-bold text-slate-800" dir="ltr">
                              {item.student.nationalId || item.student.id.slice(-6)}
                            </td>
                          )}

                          <td className="border border-slate-900 p-1.5 text-right font-black text-slate-950 pr-2">
                            {item.student.name}
                          </td>

                          {showSectionColumn && selectedSectionId === "all" && (
                            <td className="border border-slate-900 p-1.5 text-center font-bold text-slate-800">
                              {item.section?.name || "-"}
                            </td>
                          )}

                          {/* Dynamic Component Marks */}
                          {sheetColumns.filter(c => c.enabled).map(col => {
                            let cellVal = "";
                            if (sheetMode === "draft_filled" && markNum !== "") {
                              cellVal = String(Math.round((Number(markNum) * (col.maxScore / targetSubjectMax)) * 10) / 10);
                            }
                            return (
                              <td key={col.id} className="border border-slate-900 p-1.5 text-center font-bold font-mono">
                                {cellVal}
                              </td>
                            );
                          })}

                          {/* Total Score */}
                          <td className="border border-slate-900 p-1.5 text-center font-black font-mono bg-slate-100 text-slate-950">
                            {sheetMode === "draft_filled" && markNum !== "" ? (
                              <span className={item.isFailing ? "text-rose-600 underline font-black" : ""}>
                                {markNum}
                              </span>
                            ) : ""}
                          </td>

                          {/* Words / Tafqeet */}
                          {showTafqeetWords && (
                            <td className="border border-slate-900 p-1.5 text-center text-[10px] text-slate-700 font-bold">
                              {sheetMode === "draft_filled" && markNum !== "" ? tafqeetMarks(markNum) : ""}
                            </td>
                          )}

                          {/* Notes / Remarks */}
                          {showNotesColumn && (
                            <td className="border border-slate-900 p-1.5 text-center text-[10px] text-slate-600">
                              {item.isAbsent ? "غائب بعذر" : (item.existingResult?.notes || "")}
                            </td>
                          )}
                        </tr>
                      );
                    })}

                    {/* EXTRA BLANK ROWS FOR TRANSFERRED / NEW STUDENTS */}
                    {includeExtraRows && Array.from({ length: extraRowsCount }).map((_, eIdx) => (
                      <tr key={`extra-${eIdx}`} className="bg-slate-50/70">
                        <td className="border border-slate-900 p-1.5 text-center font-bold text-slate-400 font-mono">
                          {studentsList.length + eIdx + 1}
                        </td>
                        {showNationalId && (
                          <td className="border border-slate-900 p-1.5 text-center text-slate-400 font-mono">
                            ..........
                          </td>
                        )}
                        <td className="border border-slate-900 p-1.5 text-slate-400 text-xs italic pr-2">
                          (طالب منقول / مستجد) ............................................
                        </td>
                        {showSectionColumn && selectedSectionId === "all" && (
                          <td className="border border-slate-900 p-1.5 text-center text-slate-400">.....</td>
                        )}
                        {sheetColumns.filter(c => c.enabled).map(col => (
                          <td key={`extra-col-${col.id}`} className="border border-slate-900 p-1.5"></td>
                        ))}
                        <td className="border border-slate-900 p-1.5 bg-slate-100"></td>
                        {showTafqeetWords && <td className="border border-slate-900 p-1.5"></td>}
                        {showNotesColumn && <td className="border border-slate-900 p-1.5"></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* -------------------------------------------------------------
                  4. STATISTICS SUMMARY & OFFICIAL SIGNATURES FOOTER
              ------------------------------------------------------------- */}
              <div className="mt-4 pt-3 border-t-2 border-slate-900 space-y-3 no-break">
                
                {/* Stats Bar */}
                {showStatsFooter && (
                  <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-100 border border-slate-300 rounded-xl text-[11px] font-bold">
                    <div>
                      عدد الطلاب المقيدين بالكشف: <span className="font-black text-slate-950 font-mono">{studentsList.length}</span> طالب
                    </div>
                    <div>
                      عدد الحاضرين: <span className="font-black text-slate-950 font-mono">{sheetMode === "draft_filled" ? draftStats.recordedCount : ".........."}</span>
                    </div>
                    <div>
                      عدد الغائبين: <span className="font-black text-slate-950 font-mono">{sheetMode === "draft_filled" ? draftStats.absentCount : ".........."}</span>
                    </div>
                    <div>
                      تاريخ تسليم الكشف للمعلم: <span className="font-black text-slate-950 font-mono">.... / .... / 2026م</span>
                    </div>
                    <div>
                      تاريخ إعادة وتسليم الكشف للكنترول: <span className="font-black text-slate-950 font-mono">.... / .... / 2026م</span>
                    </div>
                  </div>
                )}

                {/* Signatures & Seal Box Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-bold pt-1">
                  {signers.filter(s => s.enabled).map(sig => (
                    <div key={sig.id} className="p-2.5 border border-slate-300 rounded-xl bg-slate-50 space-y-4">
                      <p className="text-slate-900 font-black text-xs">{sig.title}</p>
                      <p className="text-slate-600 font-medium text-[11px]">
                        {sig.id === "s1" && teacherName ? teacherName : (sig.name || "الاسم: ..................")}
                      </p>
                      <p className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-500">
                        {sig.subtitle}
                      </p>
                    </div>
                  ))}

                  {showControlSealBox && (
                    <div className="p-2.5 border border-slate-300 rounded-xl bg-slate-50 flex flex-col justify-between items-center">
                      <p className="text-slate-900 font-black text-xs">ختم الكنترول والامتحانات</p>
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                        (موضع الختم)
                      </div>
                      <p className="text-[10px] text-slate-500">يعتمد رسمياً</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            5. MODAL BOTTOM ACTIONS BAR
        ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-7 py-3.5 border-t border-border/70 bg-card shrink-0">
          <div className="text-xs font-bold text-muted-foreground flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-foreground font-black">
              <Users className="w-4 h-4 text-primary" />
              <span>إجمالي الطلاب: <strong>{studentsList.length}</strong></span>
            </span>
            <span className="text-border">|</span>
            <span>الدرجة العظمى: <strong className="text-primary font-mono">{targetSubjectMax}</strong></span>
            <span className="text-border">|</span>
            <span>الأعمدة: <strong className="font-mono">{sheetColumns.filter(c => c.enabled).length}</strong></span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-border/80 text-foreground hover:bg-muted transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>تصدير Excel (CSV)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-primary to-primary/90 text-white hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة كشف الرصد المعتمد (A4)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
