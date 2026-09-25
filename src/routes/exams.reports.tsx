import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage } from "@/lib/school-structure";
import { 
  Printer, 
  FileText, 
  BarChart3, 
  Users, 
  Award, 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  GraduationCap, 
  Sparkles, 
  Medal, 
  BookOpen, 
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layers,
  Calendar,
  SlidersHorizontal,
  Sliders,
  ArrowUpDown,
  Check,
  CheckSquare,
  Square,
  Eye,
  RotateCcw,
  X,
  FileSpreadsheet,
  Trophy,
  Hash,
  Percent,
  Scissors,
  ShieldCheck,
  Palette,
  Settings2,
  FileCheck2,
  UserCheck,
  LayoutGrid
} from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { AcademicCareerModal } from "@/components/academic-career-modal";
import { BatchCertificatesModal } from "@/components/batch-certificates-modal";

export const Route = createFileRoute("/exams/reports")({
  component: ExamsReportsPage,
  head: () => ({ meta: [{ title: "التقارير والشهادات وتحليلات الاختبارات" }] })
});

// Helper: Silent Native A4 iframe printing
function printContainerViaIframe(containerId: string, title: string) {
  const elem = document.getElementById(containerId);
  if (!elem) {
    window.print();
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

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 8mm 6mm;
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
          font-size: 9pt;
          direction: rtl;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 6px;
          margin-bottom: 6px;
          page-break-inside: auto;
        }
        th, td {
          border: 1px solid #374151;
          padding: 4px 5px;
          text-align: right;
          font-size: 8pt;
        }
        th {
          background-color: #f3f4f6 !important;
          font-weight: 800;
          text-align: center;
        }
        .page-break {
          page-break-after: always !important;
          break-after: page !important;
        }
        .avoid-break {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        thead {
          display: table-header-group !important;
        }
        tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
      </style>
    </head>
    <body>
      ${elem.innerHTML}
    </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow?.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 350);
}

// Helper: Silent Native A4 Consecutive Printing for Certificates (Portrait, Landscape, 2-Up)
function printSequentialCertificatesViaIframe(
  containerId: string, 
  title: string, 
  orientation: "portrait" | "landscape" | "compact_2up" = "portrait"
) {
  const elem = document.getElementById(containerId);
  if (!elem) {
    window.print();
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

  const pageCss = orientation === "landscape"
    ? `@page { size: A4 landscape; margin: 8mm 8mm; }
       .cert-page {
         page-break-after: always !important;
         break-after: page !important;
         min-height: 192mm;
         max-height: 194mm;
         display: flex;
         flex-direction: column;
         justify-content: space-between;
         padding: 6mm 8mm;
         position: relative;
       }`
    : orientation === "compact_2up"
    ? `@page { size: A4 portrait; margin: 6mm 6mm; }
       .cert-2up-sheet {
         page-break-after: always !important;
         break-after: page !important;
         min-height: 280mm;
         display: flex;
         flex-direction: column;
         justify-content: space-between;
         gap: 5mm;
       }
       .cert-2up-card {
         height: 136mm;
         border: 1.5px dashed #94a3b8;
         border-radius: 8px;
         padding: 5mm 6mm;
         display: flex;
         flex-direction: column;
         justify-content: space-between;
         position: relative;
       }`
    : `@page { size: A4 portrait; margin: 8mm 8mm; }
       .cert-page {
         page-break-after: always !important;
         break-after: page !important;
         min-height: 275mm;
         display: flex;
         flex-direction: column;
         justify-content: space-between;
         padding: 8mm 8mm;
         position: relative;
       }`;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        ${pageCss}
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
        .cert-page:last-child, .cert-2up-sheet:last-child {
          page-break-after: auto !important;
          break-after: auto !important;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 4px;
          margin-bottom: 4px;
        }
        th, td {
          border: 1px solid #94a3b8;
          padding: 4px 6px;
          text-align: right;
        }
        th {
          background-color: #f1f5f9 !important;
          font-weight: 800;
        }
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        .font-black { font-weight: 900; }
        .avoid-break { page-break-inside: avoid !important; }
      </style>
    </head>
    <body>
      ${elem.innerHTML}
    </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow?.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 400);
}

const normalizeGrade = (g: string = "") => g.replace(/الابتدائي|المتوسط|الثانوي/g, "").replace(/\s+/g, " ").trim();

function ExamsReportsPage() {
  const [activeTab, setActiveTab] = useState<"master" | "report-card" | "analytics">("master");

  return (
    <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الاختبارات", to: "/exams" }, { label: "التقارير والشهادات" }]}>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
        {/* Luxury Segmented Control Tab Navigation */}
        <div className="bg-card/80 backdrop-blur-md p-1.5 rounded-2xl border border-border/70 shadow-xs flex flex-wrap sm:inline-flex items-center gap-1.5">
          <button 
            onClick={() => setActiveTab("master")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
              activeTab === "master" 
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Users className="w-4 h-4"/>
            <span>الكشف المجمع (Master Sheet)</span>
          </button>
          <button 
            onClick={() => setActiveTab("report-card")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
              activeTab === "report-card" 
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Award className="w-4 h-4"/>
            <span>الشهادة الفردية الرسمية (Report Card)</span>
          </button>
          <button 
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
              activeTab === "analytics" 
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500"/>
            <span>لوحة تحليلات الأداء ولوحة الشرف</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400 font-black">
              شاملة
            </span>
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
// 1. Master Sheet Tab (الكشف المجمع)
// ==========================================
function MasterSheetTab() {
  const { stage } = useStage();
  const { 
    activeStageSections, 
    activeStageStudents, 
    activeStageSubjects, 
    activeStageExams, 
    activeStageExamSubjects, 
    allExamResults, 
    allStudentEnrollments, 
    currentAcademicYearId 
  } = useGlobalStore();

  const uniqueGrades = useMemo(() => getGradesForStage(stage), [stage]);

  // Filters State with smart defaults
  const [filterExamId, setFilterExamId] = useState<string>(() => activeStageExams[0]?.id || "");
  const [filterGrade, setFilterGrade] = useState<string>(() => uniqueGrades[0] || "");
  const [filterSectionId, setFilterSectionId] = useState<string>("");
  const [filterRank, setFilterRank] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Sorting State
  const [sortBy, setSortBy] = useState<"rank" | "name" | "section" | "total" | "pct">("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination State (Smart density taking student count into account)
  const [pageSize, setPageSize] = useState<number>(20); // 10, 15, 20, 25, 30, 50, 100, or 0 (all)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jumpPageInput, setJumpPageInput] = useState<string>("");

  // Modals & High-Precision Print Engine State
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isLightweightPrintOpen, setIsLightweightPrintOpen] = useState(false);
  const [printScope, setPrintScope] = useState<"current_page" | "all_chunked" | "selected_section">("current_page");
  const [printRowsPerPage, setPrintRowsPerPage] = useState<number>(20); // 15, 20, 25, 30
  const [printBreakBySection, setPrintBreakBySection] = useState<boolean>(true);
  const [currentPrintPage, setCurrentPrintPage] = useState<number>(1);
  const [printPreviewMode, setPrintPreviewMode] = useState<"all" | "single">("all");

  // Multi-Student Selection & Career Modals
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isBatchCertificatesOpen, setIsBatchCertificatesOpen] = useState(false);
  const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
  const [selectedStudentForCareer, setSelectedStudentForCareer] = useState<string>("");

  // Keep smart defaults synchronized when stage or exams change
  useEffect(() => {
    if (activeStageExams.length > 0 && (!filterExamId || !activeStageExams.some(e => e.id === filterExamId))) {
      setFilterExamId(activeStageExams[0].id);
    }
  }, [activeStageExams, filterExamId]);

  useEffect(() => {
    if (uniqueGrades.length > 0 && (!filterGrade || !uniqueGrades.includes(filterGrade))) {
      setFilterGrade(uniqueGrades[0]);
    }
  }, [uniqueGrades, filterGrade]);

  const sectionsForGrade = useMemo(() => (
    filterGrade ? activeStageSections.filter(s => s.stage === stage && normalizeGrade(s.grade) === normalizeGrade(filterGrade)) : []
  ), [activeStageSections, stage, filterGrade]);

  const applicableSubjects = useMemo(() => {
    return activeStageSubjects.filter(s => 
      (s.stage === stage || s.stage === "all") &&
      (!filterGrade || (s.grades && s.grades.some(g => normalizeGrade(g) === normalizeGrade(filterGrade))) || !s.grades || s.grades.length === 0)
    );
  }, [activeStageSubjects, filterGrade, stage]);

  const enrollmentsToReport = useMemo(() => {
    return allStudentEnrollments.filter(e => {
      if (e.academicYearId !== currentAcademicYearId) return false;
      const section = activeStageSections.find(s => s.id === e.sectionId);
      if (!section || section.stage !== stage) return false;
      if (filterGrade && normalizeGrade(section.grade) !== normalizeGrade(filterGrade)) return false;
      if (filterSectionId && section.id !== filterSectionId) return false;
      return true;
    });
  }, [allStudentEnrollments, currentAcademicYearId, activeStageSections, stage, filterGrade, filterSectionId]);

  // High-Speed Lookup Map for Results: O(1) Instantaneous Query
  const resultsMap = useMemo(() => {
    const map = new Map<string, any>();
    (allExamResults || []).forEach(r => {
      if (r.studentEnrollmentId) {
        map.set(`${r.examSubjectId}_${r.studentEnrollmentId}`, r);
      }
    });
    return map;
  }, [allExamResults]);

  // High-Speed ExamSubjects Grouping Map
  const examSubjectsMap = useMemo(() => {
    const map = new Map<string, any[]>();
    applicableSubjects.forEach(subject => {
      const filtered = activeStageExamSubjects.filter(es => 
        es.subjectId === subject.id && 
        (!filterGrade || normalizeGrade(es.grade) === normalizeGrade(filterGrade)) && 
        (!filterExamId || es.examId === filterExamId)
      );
      map.set(subject.id, filtered);
    });
    return map;
  }, [applicableSubjects, activeStageExamSubjects, filterGrade, filterExamId]);

  // Robust Student Roster List combining active enrollments and enrolled students fallback
  const studentsListForMaster = useMemo(() => {
    const list: { enrollment: any; student: any }[] = [];
    const seenStudentIds = new Set<string>();

    enrollmentsToReport.forEach(enr => {
      const student = activeStageStudents.find(s => s.id === enr.studentId);
      if (student) {
        seenStudentIds.add(student.id);
        list.push({ enrollment: enr, student });
      }
    });

    // Fallback: include any activeStageStudents for this grade/section not yet in enrollments
    activeStageStudents.forEach(st => {
      if (seenStudentIds.has(st.id)) return;
      if (filterGrade && normalizeGrade(st.grade) !== normalizeGrade(filterGrade)) return;
      if (filterSectionId && st.sectionId !== filterSectionId) return;

      seenStudentIds.add(st.id);
      list.push({
        enrollment: {
          id: `ENR-${st.id}`,
          studentId: st.id,
          sectionId: st.sectionId || "",
          academicYearId: currentAcademicYearId,
          stage: stage,
          status: "enrolled"
        },
        student: st
      });
    });

    return list;
  }, [enrollmentsToReport, activeStageStudents, filterGrade, filterSectionId, currentAcademicYearId, stage]);

  // Compute Master Sheet Data
  const masterData = useMemo(() => {
    const list = studentsListForMaster.map(({ enrollment, student }) => {
      let totalMarks = 0;
      let totalMaxMarks = 0;
      const subjectsMap: Record<string, number> = {};

      applicableSubjects.forEach(subject => {
        const examSubjects = examSubjectsMap.get(subject.id) || [];
        let subjectTotal = 0;
        let subjectMax = 0;

        examSubjects.forEach(es => {
          subjectMax += es.maxScore;
          const result = resultsMap.get(`${es.id}_${enrollment.id}`) ||
                         resultsMap.get(`${es.id}_${student.id}`) ||
                         (student.studentId ? resultsMap.get(`${es.id}_${student.studentId}`) : null);
          subjectTotal += result?.mark || 0;
        });

        subjectsMap[subject.id] = subjectTotal;
        totalMarks += subjectTotal;
        totalMaxMarks += subjectMax;
      });

      const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
      let rank = "مقبول";
      if (percentage >= 90) rank = "ممتاز";
      else if (percentage >= 80) rank = "جيد جداً";
      else if (percentage >= 65) rank = "جيد";
      else if (percentage >= 50) rank = "مقبول";
      else rank = "راسب";

      const sectionObj = activeStageSections.find(s => s.id === (enrollment.sectionId || student.sectionId));
      const sectionName = sectionObj?.name || (student.sectionId ? activeStageSections.find(s => s.id === student.sectionId)?.name : "") || "عام";

      return { 
        student, 
        subjectsMap, 
        totalMarks, 
        totalMaxMarks, 
        percentage, 
        rank,
        isPassed: percentage >= 50,
        section: sectionName
      };
    });

    return list.sort((a, b) => b.totalMarks - a.totalMarks);
  }, [studentsListForMaster, applicableSubjects, examSubjectsMap, resultsMap, activeStageSections]);

  // Real-time student distribution counts per section
  const sectionStudentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    masterData.forEach(d => {
      const sec = d.section || "عام";
      counts[sec] = (counts[sec] || 0) + 1;
    });
    return counts;
  }, [masterData]);

  // Filter & Search Master Data
  const filteredMasterData = useMemo(() => {
    let result = [...masterData];

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(d => 
        d.student.name.toLowerCase().includes(q) ||
        (d.student.nationalId && d.student.nationalId.includes(q)) ||
        d.section.toLowerCase().includes(q)
      );
    }

    if (filterRank !== "all") {
      result = result.filter(d => d.rank === filterRank);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "rank") cmp = b.totalMarks - a.totalMarks;
      else if (sortBy === "name") cmp = a.student.name.localeCompare(b.student.name);
      else if (sortBy === "section") cmp = a.section.localeCompare(b.section);
      else if (sortBy === "total") cmp = a.totalMarks - b.totalMarks;
      else if (sortBy === "pct") cmp = a.percentage - b.percentage;
      return sortOrder === "desc" ? -cmp : cmp;
    });

    return result;
  }, [masterData, searchTerm, filterRank, sortBy, sortOrder]);

  // Pagination Calculations
  const totalItems = filteredMasterData.length;
  const effectivePageSize = pageSize === 0 ? totalItems : pageSize;
  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRank, filterGrade, filterSectionId, filterExamId, pageSize]);

  // Paginated Slice for Display
  const paginatedData = useMemo(() => {
    if (pageSize === 0 || totalItems === 0) return filteredMasterData;
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredMasterData.slice(start, start + pageSize);
  }, [filteredMasterData, safeCurrentPage, pageSize, totalItems]);

  // Display indices
  const displayStartIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * effectivePageSize + 1;
  const displayEndIndex = Math.min(safeCurrentPage * effectivePageSize, totalItems);

  // Statistics Summary KPIs
  const kpis = useMemo(() => {
    const total = filteredMasterData.length;
    if (total === 0) {
      return { total: 0, passed: 0, passRate: 0, avg: 0, max: 0, excellent: 0, failed: 0 };
    }
    const passed = filteredMasterData.filter(d => d.isPassed).length;
    const passRate = Math.round((passed / total) * 100);
    const avg = filteredMasterData.reduce((acc, d) => acc + d.percentage, 0) / total;
    const max = Math.max(...filteredMasterData.map(d => d.totalMarks));
    const excellent = filteredMasterData.filter(d => d.rank === "ممتاز").length;
    const failed = filteredMasterData.filter(d => d.rank === "راسب").length;
    return { total, passed, passRate, avg, max, excellent, failed };
  }, [filteredMasterData]);

  // Multi-Student Checkbox Selection Helpers
  const isAllPageSelected = useMemo(() => {
    if (paginatedData.length === 0) return false;
    return paginatedData.every(d => selectedStudentIds.has(d.student.id));
  }, [paginatedData, selectedStudentIds]);

  const handleToggleSelectAllPage = () => {
    const next = new Set(selectedStudentIds);
    if (isAllPageSelected) {
      paginatedData.forEach(d => next.delete(d.student.id));
    } else {
      paginatedData.forEach(d => next.add(d.student.id));
    }
    setSelectedStudentIds(next);
  };

  const handleToggleSelectStudent = (studentId: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(studentId)) {
      next.delete(studentId);
    } else {
      next.add(studentId);
    }
    setSelectedStudentIds(next);
  };

  const handleSelectByCriteria = (criteria: "all_filtered" | "excellent" | "passed" | "failed" | "clear") => {
    if (criteria === "clear") {
      setSelectedStudentIds(new Set());
      return;
    }
    const next = new Set<string>();
    filteredMasterData.forEach(d => {
      if (criteria === "all_filtered") next.add(d.student.id);
      else if (criteria === "excellent" && d.rank === "ممتاز") next.add(d.student.id);
      else if (criteria === "passed" && d.isPassed) next.add(d.student.id);
      else if (criteria === "failed" && !d.isPassed) next.add(d.student.id);
    });
    setSelectedStudentIds(next);
    toast.success(`تم تحديد ${next.size} طالباً`);
  };

  // Quick Jump
  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      setJumpPageInput("");
    } else {
      toast.error(`يرجى إدخال رقم صفحة بين 1 و ${totalPages}`);
    }
  };

  // Export to CSV with UTF-8 BOM
  const handleExportCsv = (scope: "all" | "page" | "selected" = "all") => {
    let dataToExport = filteredMasterData;
    let label = "الكامل";

    if (scope === "page") {
      dataToExport = paginatedData;
      label = `صفحة_${safeCurrentPage}`;
    } else if (scope === "selected") {
      dataToExport = filteredMasterData.filter(d => selectedStudentIds.has(d.student.id));
      label = `المحدد_${dataToExport.length}_طلاب`;
    }

    if (dataToExport.length === 0) {
      toast.error("لا توجد بيانات متاحة للتصدير");
      return;
    }

    const headers = [
      "الترتيب",
      "اسم الطالب",
      "الرقم الأكاديمي",
      "الصف",
      "الشعبة",
      ...applicableSubjects.map(s => s.name),
      "المجموع الكلي",
      "الدرجة العظمى",
      "النسبة المئوية",
      "التقدير العام",
      "حالة النجاح"
    ];

    const rows = dataToExport.map((d, idx) => {
      const rankIdx = scope === "page" ? (safeCurrentPage - 1) * pageSize + idx + 1 : idx + 1;
      return [
        rankIdx,
        `"${d.student.name}"`,
        `"${d.student.nationalId || ''}"`,
        `"${d.student.grade || filterGrade}"`,
        `"${d.section}"`,
        ...applicableSubjects.map(s => d.subjectsMap[s.id] !== undefined ? d.subjectsMap[s.id] : 0),
        d.totalMarks,
        d.totalMaxMarks,
        `${d.percentage.toFixed(1)}%`,
        `"${d.rank}"`,
        d.isPassed ? "ناجح" : "راسب"
      ].join(",");
    });

    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `كشف_الدرجات_المجمع_${filterGrade || "المرحلة"}_${label}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`تم تصدير ${dataToExport.length} طالب بنجاح إلى ملف Excel / CSV`);
  };

  // Advanced Print Engine Data & Template
  const printTemplate: PrintTemplate = {
    id: "master-sheet",
    name: `الكشف المجمع - ${filterSectionId ? `شعبة ` : filterGrade || "المرحلة كاملة"}`,
    category: "تقارير",
    type: "table",
    columns: [
      { key: 'rankPosition', label: 'الترتيب' },
      { key: 'name', label: 'اسم الطالب' },
      { key: 'section', label: 'الشعبة' },
      ...applicableSubjects.map(s => ({ key: s.id, label: s.name })),
      { key: 'totalMarks', label: 'المجموع' },
      { key: 'percentage', label: 'النسبة' },
      { key: 'rank', label: 'التقدير' },
    ]
  };

  const printData = filteredMasterData.map((d, i) => ({
    id: d.student.id,
    rankPosition: i + 1,
    name: d.student.name,
    section: d.section,
    totalMarks: `${d.totalMarks} / ${d.totalMaxMarks}`,
    percentage: d.percentage.toFixed(1) + '%',
    rank: d.rank,
    ...d.subjectsMap
  }));

  // Structured Chunk Type for A4 Printing
  type PrintPageChunk = {
    sectionName: string;
    pageNumberInSection: number;
    totalPagesInSection: number;
    globalPageNumber: number;
    totalGlobalPages: number;
    rows: (typeof filteredMasterData[0] & { globalRank: number; sectionRank: number })[];
    isSectionLastChunk: boolean;
    sectionStats?: {
      total: number;
      passed: number;
      passRate: number;
      avg: number;
      max: number;
    };
  };

  // High-Precision Multi-Sheet A4 Chunking Engine
  const printChunks = useMemo(() => {
    let sourceData = filteredMasterData;
    if (printScope === "current_page") {
      sourceData = paginatedData;
    } else if (printScope === "selected_section" && filterSectionId) {
      const activeSecName = sectionsForGrade.find(s => s.id === filterSectionId)?.name;
      sourceData = filteredMasterData.filter(d => activeSecName ? d.section === activeSecName : true);
    }

    if (sourceData.length === 0) return [];

    const chunks: PrintPageChunk[] = [];
    const rowsPerPage = printRowsPerPage;

    if (printBreakBySection) {
      // Group by section
      const sectionMap = new Map<string, typeof sourceData>();
      sourceData.forEach(item => {
        const sec = item.section || "شعبة عامة";
        if (!sectionMap.has(sec)) sectionMap.set(sec, []);
        sectionMap.get(sec)!.push(item);
      });

      let runningGlobalPage = 1;
      let totalPagesAcrossAll = 0;
      sectionMap.forEach(students => {
        totalPagesAcrossAll += Math.max(1, Math.ceil(students.length / rowsPerPage));
      });

      sectionMap.forEach((students, secName) => {
        const totalSecPages = Math.max(1, Math.ceil(students.length / rowsPerPage));
        const secTotal = students.length;
        const secPassed = students.filter(s => s.isPassed).length;
        const secPassRate = secTotal > 0 ? Math.round((secPassed / secTotal) * 100) : 0;
        const secAvg = secTotal > 0 ? students.reduce((acc, s) => acc + s.percentage, 0) / secTotal : 0;
        const secMax = secTotal > 0 ? Math.max(...students.map(s => s.totalMarks)) : 0;
        const secStats = { total: secTotal, passed: secPassed, passRate: secPassRate, avg: secAvg, max: secMax };

        for (let p = 0; p < totalSecPages; p++) {
          const pageRows = students.slice(p * rowsPerPage, (p + 1) * rowsPerPage).map((row, rIdx) => ({
            ...row,
            sectionRank: p * rowsPerPage + rIdx + 1,
            globalRank: sourceData.findIndex(s => s.student.id === row.student.id) + 1
          }));

          chunks.push({
            sectionName: secName,
            pageNumberInSection: p + 1,
            totalPagesInSection: totalSecPages,
            globalPageNumber: runningGlobalPage++,
            totalGlobalPages: totalPagesAcrossAll,
            rows: pageRows,
            isSectionLastChunk: p === totalSecPages - 1,
            sectionStats: secStats
          });
        }
      });
    } else {
      const totalPages = Math.max(1, Math.ceil(sourceData.length / rowsPerPage));
      for (let p = 0; p < totalPages; p++) {
        const pageRows = sourceData.slice(p * rowsPerPage, (p + 1) * rowsPerPage).map((row, rIdx) => ({
          ...row,
          sectionRank: p * rowsPerPage + rIdx + 1,
          globalRank: p * rowsPerPage + rIdx + 1
        }));

        chunks.push({
          sectionName: filterSectionId ? (sectionsForGrade.find(s => s.id === filterSectionId)?.name || "") : "كافة الشعب",
          pageNumberInSection: p + 1,
          totalPagesInSection: totalPages,
          globalPageNumber: p + 1,
          totalGlobalPages: totalPages,
          rows: pageRows,
          isSectionLastChunk: p === totalPages - 1,
          sectionStats: kpis
        });
      }
    }

    return chunks;
  }, [filteredMasterData, paginatedData, printScope, filterSectionId, sectionsForGrade, printBreakBySection, printRowsPerPage, kpis]);

  // Smart Pagination Page Range Builder
  const pageRange = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    pages.push(1);
    if (safeCurrentPage > 3) pages.push("...");
    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (safeCurrentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  }, [totalPages, safeCurrentPage]);

  return (
    <div className="space-y-6">
      {/* 1. Filtering Header Card (No redundant Stage selector) */}
      <PageCard title="خيارات وتصفية الكشف المجمع" description="تخصيص العرض حسب فترة الاختبار، الصف والشعبة مع فلاتر سريعة للتقديرات والنتائج">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* 1. Exam Period */}
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/60 hover:border-primary/40 transition-colors">
              <label className="mb-1.5 block text-xs font-black text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> فترة الاختبار
                </span>
                <span className="text-[10px] text-muted-foreground font-bold">إلزامي</span>
              </label>
              <select 
                value={filterExamId} 
                onChange={e => setFilterExamId(e.target.value)} 
                className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 font-bold text-xs shadow-xs focus:border-primary cursor-pointer outline-none"
              >
                <option value="">جميع فترات الاختبارات</option>
                {activeStageExams.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.term})</option>
                ))}
              </select>
            </div>

            {/* 2. Grade */}
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/60 hover:border-primary/40 transition-colors">
              <label className="mb-1.5 block text-xs font-black text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" /> الصف الدراسي
                </span>
                <span className="text-[10px] text-primary font-black">{filterGrade || "كل الصفوف"}</span>
              </label>
              <select 
                value={filterGrade} 
                onChange={e => { setFilterGrade(e.target.value); setFilterSectionId(""); }} 
                className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 font-bold text-xs shadow-xs focus:border-primary cursor-pointer outline-none"
              >
                <option value="">كل الصفوف</option>
                {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* 3. Section */}
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/60 hover:border-primary/40 transition-colors">
              <label className="mb-1.5 block text-xs font-black text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" /> الشعبة الدراسية
                </span>
                <span className="text-[10px] text-muted-foreground font-bold">
                  {filterSectionId ? `شعبة ${sectionsForGrade.find(s => s.id === filterSectionId)?.name}` : "كل الشعب"}
                </span>
              </label>
              <select 
                disabled={!filterGrade} 
                value={filterSectionId} 
                onChange={e => setFilterSectionId(e.target.value)} 
                className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 font-bold text-xs shadow-xs focus:border-primary disabled:opacity-50 cursor-pointer outline-none"
              >
                <option value="">كل الشعب</option>
                {sectionsForGrade.map(s => <option key={s.id} value={s.id}>شعبة {s.name}</option>)}
              </select>
            </div>

            {/* 4. Rating Filter */}
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/60 hover:border-primary/40 transition-colors">
              <label className="mb-1.5 block text-xs font-black text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Medal className="w-3.5 h-3.5 text-primary" /> التقدير العام
                </span>
                <span className="text-[10px] text-muted-foreground font-bold">تصفية</span>
              </label>
              <select 
                value={filterRank} 
                onChange={e => setFilterRank(e.target.value)} 
                className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 font-bold text-xs shadow-xs focus:border-primary cursor-pointer outline-none"
              >
                <option value="all">جميع التقديرات</option>
                <option value="ممتاز">ممتاز (90% فأكثر) ⭐</option>
                <option value="جيد جداً">جيد جداً (80% - 89%) 🟢</option>
                <option value="جيد">جيد (65% - 79%) 🔵</option>
                <option value="مقبول">مقبول (50% - 64%) 🟡</option>
                <option value="راسب">راسب (أقل من 50%) 🔴</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Pills with Live Counts */}
          <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-muted-foreground font-black flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-primary" /> تصفية سريعة:
              </span>
              {[
                { id: "all", label: `الكل (${masterData.length})` },
                { id: "ممتاز", label: `ممتاز ⭐ (${masterData.filter(d => d.rank === "ممتاز").length})` },
                { id: "جيد جداً", label: `جيد جداً 🟢 (${masterData.filter(d => d.rank === "جيد جداً").length})` },
                { id: "جيد", label: `جيد 🔵 (${masterData.filter(d => d.rank === "جيد").length})` },
                { id: "مقبول", label: `مقبول 🟡 (${masterData.filter(d => d.rank === "مقبول").length})` },
                { id: "راسب", label: `راسب 🔴 (${masterData.filter(d => d.rank === "راسب").length})` }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setFilterRank(p.id)}
                  className={`px-3 py-1 rounded-xl font-black transition-all cursor-pointer text-xs ${
                    filterRank === p.id 
                      ? "bg-primary text-primary-foreground shadow-xs" 
                      : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Clear Filters */}
            {(filterExamId || filterGrade || filterSectionId || filterRank !== "all" || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setFilterExamId("");
                  setFilterGrade("");
                  setFilterSectionId("");
                  setFilterRank("all");
                  setSearchTerm("");
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> إعادة ضبط الفلاتر
              </button>
            )}
          </div>
        </div>
      </PageCard>

      {/* 2. Statistical KPIs Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Students */}
        <div className="bg-card/90 backdrop-blur-xs rounded-2xl border border-border/70 p-3.5 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-muted-foreground font-black">إجمالي الطلاب</span>
            <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black text-foreground tabular-nums">{kpis.total.toLocaleString("ar-SA")}</p>
          <p className="text-[10px] text-muted-foreground font-bold mt-0.5">في الكشف الحالي</p>
        </div>

        {/* Pass Rate */}
        <div className="bg-card/90 backdrop-blur-xs rounded-2xl border border-border/70 p-3.5 shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-muted-foreground font-black">نسبة النجاح</span>
            <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600 tabular-nums">{kpis.passRate}%</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{kpis.passed} طالب ناجح</p>
        </div>

        {/* General Average */}
        <div className="bg-card/90 backdrop-blur-xs rounded-2xl border border-border/70 p-3.5 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-muted-foreground font-black">المتوسط العام</span>
            <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Percent className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black text-primary tabular-nums" dir="ltr">{kpis.avg.toFixed(1)}%</p>
          <p className="text-[10px] text-muted-foreground font-bold mt-0.5">معدل الدفعة</p>
        </div>

        {/* Highest Score */}
        <div className="bg-card/90 backdrop-blur-xs rounded-2xl border border-border/70 p-3.5 shadow-xs hover:border-amber-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-muted-foreground font-black">أعلى مجموع</span>
            <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-600 tabular-nums">{kpis.max}</p>
          <p className="text-[10px] text-muted-foreground font-bold mt-0.5">الدرجة الكبرى</p>
        </div>

        {/* Honors (Excellent) */}
        <div className="bg-card/90 backdrop-blur-xs rounded-2xl border border-border/70 p-3.5 shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-muted-foreground font-black">المتميزون</span>
            <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600 tabular-nums">{kpis.excellent}</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">تقدير ممتاز ⭐</p>
        </div>

        {/* At-Risk (Needs Support) */}
        <div className="bg-card/90 backdrop-blur-xs rounded-2xl border border-border/70 p-3.5 shadow-xs hover:border-rose-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-muted-foreground font-black">المتعثرون</span>
            <span className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-black text-rose-600 tabular-nums">{kpis.failed}</p>
          <p className="text-[10px] text-rose-600 font-bold mt-0.5">يحتاجون دعم 🔴</p>
        </div>
      </div>

      {/* 3. Action Toolbar: Search, Pagination Size & Printing */}
      <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full lg:max-w-md">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث باسم الطالب، الرقم الأكاديمي، أو الشعبة..."
            className="h-10 w-full rounded-xl border border-border/60 bg-background pr-9 pl-9 text-xs font-bold shadow-sm focus:border-primary outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Page Size & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Page Density Selector */}
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/60 text-xs">
            <span className="text-muted-foreground font-black px-2 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-primary" /> الطلاب / صفحة:
            </span>
            {[15, 20, 25, 30, 50, 100, 0].map(size => (
              <button
                key={size}
                type="button"
                onClick={() => setPageSize(size)}
                className={`px-2.5 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                  pageSize === size 
                    ? "bg-primary text-primary-foreground shadow-xs" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background"
                }`}
                title={size === 0 ? "عرض كامل طلاب الكشف في شاشة واحدة" : `عرض ${size} طالباً في كل صفحة`}
              >
                {size === 0 ? "الكل" : size}
              </button>
            ))}
          </div>

          {/* Export Excel Menu */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleExportCsv("page")}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-sm cursor-pointer"
              title="تصدير الصفحة المعروضة حالياً إلى Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>تصدير الصفحة ({paginatedData.length})</span>
            </button>
            <button
              onClick={() => handleExportCsv("all")}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-black text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors shadow-sm cursor-pointer"
              title={`تصدير كامل الكشف (${totalItems} طالب) إلى Excel`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>تصدير الكل ({totalItems})</span>
            </button>
          </div>

          {/* Print Buttons */}
          <button
            onClick={() => {
              setCurrentPrintPage(1);
              setIsLightweightPrintOpen(true);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground shadow-md hover:bg-primary/90 transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة A4 مقسم</span>
          </button>

          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="فتح محرك الطباعة المتقدم للتخصيص الكامل"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>تخصيص متقدم</span>
          </button>
        </div>
      </div>

      {/* 4. Master Sheet Responsive Paginated Table */}
      <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm space-y-0">
        {/* Table Top Header Info */}
        <div className="p-4 border-b border-border/60 bg-muted/30 flex flex-col gap-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-foreground">كشف الدرجات المجمع</h3>
              <span className="text-xs bg-primary/10 text-primary font-black px-2.5 py-0.5 rounded-lg">
                {totalItems.toLocaleString("ar-SA")} طالب مطابق
              </span>
              {pageSize > 0 && totalPages > 1 && (
                <span className="text-xs text-muted-foreground font-bold">
                  (صفحة {safeCurrentPage} من {totalPages})
                </span>
              )}
            </div>

            {/* Running count indicator */}
            <div className="text-xs font-bold text-muted-foreground">
              عرض <b className="text-foreground">{displayStartIndex} - {displayEndIndex}</b> من أصل <b className="text-foreground">{totalItems.toLocaleString("ar-SA")}</b> طالب
            </div>
          </div>

          {/* Section Quick Switcher Tabs (Only if grade has sections) */}
          {sectionsForGrade.length > 0 && (
            <div className="pt-2 border-t border-border/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-muted-foreground font-black flex items-center gap-1 shrink-0 px-1">
                <Users className="w-3.5 h-3.5 text-primary" /> تصفح الشعب:
              </span>
              <button
                type="button"
                onClick={() => setFilterSectionId("")}
                className={`px-3 py-1 rounded-xl font-black text-xs transition-all shrink-0 cursor-pointer ${
                  !filterSectionId
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                جميع الشعب ({masterData.length})
              </button>
              {sectionsForGrade.map(s => {
                const count = sectionStudentCounts[s.name] || 0;
                const isSelected = filterSectionId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFilterSectionId(s.id)}
                    className={`px-3 py-1 rounded-xl font-black text-xs transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    شعبة {s.name} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Top Quick Pagination & Density Bar */}
          <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            {/* Page Size Pills */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60 flex-wrap">
              <span className="text-[11px] text-muted-foreground font-black px-1.5 flex items-center gap-1">
                <Users className="w-3 h-3 text-primary" /> العرض بالصفحة:
              </span>
              {[10, 15, 20, 25, 30, 50, 100, 0].map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setPageSize(sz)}
                  className={`px-2.5 py-0.5 rounded-lg font-black text-xs transition-all cursor-pointer ${
                    pageSize === sz
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background"
                  }`}
                  title={sz === 0 ? "عرض كافة الطلاب بدون تقسيم" : `تقسيم العرض إلى ${sz} طالباً بالصفحة`}
                >
                  {sz === 0 ? "الكل" : sz}
                </button>
              ))}
            </div>

            {/* Quick Page Stepper Controls (When paginated) */}
            {totalPages > 1 && pageSize > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground hover:bg-muted disabled:opacity-30 transition-all cursor-pointer"
                  title="الصفحة الأولى"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground hover:bg-muted disabled:opacity-30 transition-all cursor-pointer"
                  title="الصفحة السابقة"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-black text-xs">
                  صفحة {safeCurrentPage} من {totalPages}
                </span>

                <button
                  type="button"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground hover:bg-muted disabled:opacity-30 transition-all cursor-pointer"
                  title="الصفحة التالية"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground hover:bg-muted disabled:opacity-30 transition-all cursor-pointer"
                  title="الصفحة الأخيرة"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto relative">
          <table className="w-full text-right text-xs">
            <thead className="bg-muted/80 border-b border-border/60 text-muted-foreground font-black select-none sticky top-0 z-20">
              <tr>
                <th 
                  onClick={() => {
                    if (sortBy === "rank") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    else { setSortBy("rank"); setSortOrder("asc"); }
                  }}
                  className="py-3 px-3 text-center w-14 cursor-pointer hover:text-foreground sticky right-0 z-30 bg-muted/95 backdrop-blur-xs shadow-xs"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>الترتيب</span>
                    <ArrowUpDown className="w-3 h-3 text-muted-foreground/60" />
                  </div>
                </th>
                <th 
                  onClick={() => {
                    if (sortBy === "name") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    else { setSortBy("name"); setSortOrder("asc"); }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-foreground min-w-[200px] sticky right-14 z-30 bg-muted/95 backdrop-blur-xs shadow-[2px_0_5px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-center gap-1">
                    <span>اسم الطالب رباعياً</span>
                    <ArrowUpDown className="w-3 h-3 text-muted-foreground/60" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-28">الرقم الأكاديمي</th>
                <th 
                  onClick={() => {
                    if (sortBy === "section") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    else { setSortBy("section"); setSortOrder("asc"); }
                  }}
                  className="py-3 px-3 text-center cursor-pointer hover:text-foreground w-20"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>الشعبة</span>
                    <ArrowUpDown className="w-3 h-3 text-muted-foreground/60" />
                  </div>
                </th>
                {applicableSubjects.map(s => (
                  <th key={s.id} className="py-3 px-3 text-center whitespace-nowrap min-w-[90px]">
                    {s.name}
                  </th>
                ))}
                <th 
                  onClick={() => {
                    if (sortBy === "total") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    else { setSortBy("total"); setSortOrder("desc"); }
                  }}
                  className="py-3 px-3 text-center text-primary cursor-pointer hover:text-primary/80 whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>المجموع</span>
                    <ArrowUpDown className="w-3 h-3 text-primary/60" />
                  </div>
                </th>
                <th 
                  onClick={() => {
                    if (sortBy === "pct") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    else { setSortBy("pct"); setSortOrder("desc"); }
                  }}
                  className="py-3 px-3 text-center text-primary cursor-pointer hover:text-primary/80 whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>النسبة</span>
                    <ArrowUpDown className="w-3 h-3 text-primary/60" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center text-primary whitespace-nowrap w-24">التقدير</th>
                <th className="py-3 px-3 text-center whitespace-nowrap w-20">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedData.map((d, idx) => {
                const rankNumber = (safeCurrentPage - 1) * effectivePageSize + idx + 1;
                return (
                  <tr key={d.student.id} className="hover:bg-accent/20 transition-colors group">
                    <td className="py-3 px-3 text-center font-black sticky right-0 z-10 bg-card group-hover:bg-accent/20 transition-colors">
                      {rankNumber === 1 ? "🥇 1" : rankNumber === 2 ? "🥈 2" : rankNumber === 3 ? "🥉 3" : rankNumber}
                    </td>
                    <td className="py-3 px-4 sticky right-14 z-10 bg-card group-hover:bg-accent/20 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.06)]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-primary/10 text-primary font-black text-[11px] flex items-center justify-center shrink-0">
                          {d.student.name[0]}
                        </div>
                        <span className="font-black text-sm text-foreground">{d.student.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-muted-foreground font-bold tabular-nums" dir="ltr">
                      {d.student.nationalId || "-"}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-muted-foreground">
                      {d.section || "-"}
                    </td>
                    {applicableSubjects.map(s => {
                      const val = d.subjectsMap[s.id];
                      return (
                        <td key={s.id} className="py-3 px-3 text-center font-bold tabular-nums">
                          {val !== undefined ? (
                            <span className={val === 0 ? "text-muted-foreground/50" : "text-foreground font-black"}>
                              {val}
                            </span>
                          ) : "-"}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-center font-black text-primary bg-primary/5 tabular-nums text-sm">
                      {d.totalMarks} <span className="text-[10px] text-muted-foreground font-normal">/{d.totalMaxMarks}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-black tabular-nums text-sm" dir="ltr">
                      {d.percentage.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                        d.rank === 'ممتاز' ? 'bg-emerald-500/15 text-emerald-600' : 
                        d.rank === 'جيد جداً' ? 'bg-blue-500/15 text-blue-600' :
                        d.rank === 'راسب' ? 'bg-rose-500/15 text-rose-600' : 
                        'bg-amber-500/15 text-amber-600'
                      }`}>
                        {d.rank}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        d.isPassed 
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                          : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                      }`}>
                        {d.isPassed ? "ناجح" : "راسب"}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={applicableSubjects.length + 7} className="py-14 text-center text-muted-foreground font-bold">
                    <Users className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
                    لا توجد بيانات مطابقة لخيارات الفلترة أو البحث المحددة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Bar */}
        {totalPages > 1 && pageSize > 0 && (
          <div className="p-4 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Left: Quick Jump */}
            <form onSubmit={handleJumpPage} className="flex items-center gap-1.5 order-2 sm:order-1">
              <span className="text-muted-foreground font-bold">انتقال إلى صفحة:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={jumpPageInput}
                onChange={e => setJumpPageInput(e.target.value)}
                placeholder={String(safeCurrentPage)}
                className="w-16 h-8 text-center font-black rounded-lg border border-border bg-background text-foreground text-xs outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="h-8 px-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-black transition-all cursor-pointer"
              >
                انتقال
              </button>
            </form>

            {/* Right: Page Navigator Buttons */}
            <div className="flex items-center gap-1 order-1 sm:order-2">
              {/* First Page */}
              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground hover:bg-muted disabled:opacity-30 transition-all cursor-pointer"
                title="الصفحة الأولى"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>

              {/* Prev Page */}
              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground hover:bg-muted disabled:opacity-30 transition-all cursor-pointer"
                title="الصفحة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Page Number Pills */}
              <div className="flex items-center gap-1">
                {pageRange.map((p, pIdx) => {
                  if (p === "...") {
                    return (
                      <span key={`dots-${pIdx}`} className="px-2 text-muted-foreground font-bold">
                        ...
                      </span>
                    );
                  }
                  const isCurrent = p === safeCurrentPage;
                  return (
                    <button
                      key={`page-${p}`}
                      type="button"
                      onClick={() => setCurrentPage(Number(p))}
                      className={`min-w-[32px] h-8 px-2 rounded-lg font-black text-xs transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border/60 bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                type="button"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground hover:bg-muted disabled:opacity-30 transition-all cursor-pointer"
                title="الصفحة التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Last Page */}
              <button
                type="button"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="p-1.5 rounded-lg border border-border/60 bg-background text-foreground hover:bg-muted disabled:opacity-30 transition-all cursor-pointer"
                title="الصفحة الأخيرة"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Lightweight Paginated A4 Print Modal */}
      {isLightweightPrintOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
          <div className="bg-card w-full max-w-6xl max-h-[94vh] rounded-3xl border border-border/80 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header Bar */}
            <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/40 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    <span>طباعة الكشف المجمع الرسمي (A4)</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-black">
                      معتمد ومقسم
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground font-bold">
                    {filterGrade || "جميع الصفوف"} • {filterSectionId ? `شعبة ${sectionsForGrade.find(s => s.id === filterSectionId)?.name}` : "جميع الشعب"} • العام الدراسي {currentAcademicYearId || "1446-1447هـ"}
                  </p>
                </div>
              </div>

              {/* Print Scope Controls & Print Trigger */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Print Scope Selector */}
                <div className="flex items-center bg-background border border-border/60 rounded-xl p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => { setPrintScope("current_page"); setCurrentPrintPage(1); }}
                    className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                      printScope === "current_page"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    الصفحة المعروضة ({paginatedData.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPrintScope("all_chunked"); setCurrentPrintPage(1); }}
                    className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                      printScope === "all_chunked"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    كامل الكشف ({filteredMasterData.length})
                  </button>
                </div>

                {/* Print Density: Rows per A4 Page */}
                <div className="flex items-center bg-background border border-border/60 rounded-xl p-1 text-xs">
                  <span className="text-muted-foreground font-black px-1.5 hidden md:inline">بالورقة:</span>
                  {[15, 20, 25, 30].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => { setPrintRowsPerPage(r); setCurrentPrintPage(1); }}
                      className={`px-2 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                        printRowsPerPage === r
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title={`${r} طالباً في كل ورقة A4`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {/* Section Break Toggle */}
                <button
                  type="button"
                  onClick={() => { setPrintBreakBySection(!printBreakBySection); setCurrentPrintPage(1); }}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    printBreakBySection
                      ? "bg-primary/10 border-primary text-primary font-black"
                      : "bg-background border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                  title="فصل كل شعبة في صفحات مستقلة تبدأ من صفحة 1 للشعبة"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">فصل الشعب في أوراق مستقلة</span>
                </button>

                {/* Print Trigger */}
                <button
                  onClick={() => printContainerViaIframe("printable-master-sheet-container", `كشف_الدرجات_المجمع_${filterGrade || "المرحلة"}`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة فورية ({printChunks.length} ورقة)</span>
                </button>

                <button
                  onClick={() => setIsLightweightPrintOpen(false)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-toolbar: Preview Mode & Sheet Navigation */}
            <div className="px-6 py-2 border-b border-border/50 bg-background flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-bold">نمط المعاينة:</span>
                <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60">
                  <button
                    type="button"
                    onClick={() => setPrintPreviewMode("all")}
                    className={`px-2.5 py-1 rounded-md font-bold text-xs transition-all cursor-pointer ${
                      printPreviewMode === "all"
                        ? "bg-card text-foreground shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    استعراض كل الأوراق ({printChunks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintPreviewMode("single")}
                    className={`px-2.5 py-1 rounded-md font-bold text-xs transition-all cursor-pointer ${
                      printPreviewMode === "single"
                        ? "bg-card text-foreground shadow-xs font-black"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    معاينة ورقة بورقة
                  </button>
                </div>
              </div>

              {/* Single Page Stepper */}
              {printPreviewMode === "single" && printChunks.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPrintPage <= 1}
                    onClick={() => setCurrentPrintPage(p => Math.max(1, p - 1))}
                    className="p-1 rounded-lg border border-border/60 bg-background text-foreground hover:bg-muted disabled:opacity-30 transition-all cursor-pointer"
                    title="الورقة السابقة"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="font-black text-foreground px-2">
                    ورقة <b className="text-primary">{currentPrintPage}</b> من أصل <b>{printChunks.length}</b>
                    {printChunks[currentPrintPage - 1]?.sectionName && (
                      <span className="text-muted-foreground font-normal mr-1.5">
                        (شعبة {printChunks[currentPrintPage - 1].sectionName} - صفحة {printChunks[currentPrintPage - 1].pageNumberInSection} من {printChunks[currentPrintPage - 1].totalPagesInSection})
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    disabled={currentPrintPage >= printChunks.length}
                    onClick={() => setCurrentPrintPage(p => Math.min(printChunks.length, p + 1))}
                    className="p-1 rounded-lg border border-border/60 bg-background text-foreground hover:bg-muted disabled:opacity-30 transition-all cursor-pointer"
                    title="الورقة التالية"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="text-muted-foreground font-bold">
                إجمالي الأوراق للطباعة: <b className="text-primary font-black">{printChunks.length}</b> صفحة A4 عرضي
              </div>
            </div>

            {/* Modal Body: Scrollable Preview of the A4 Printable Chunks */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/60 dark:bg-black/60 space-y-6">
              <div id="printable-master-sheet-container" className="space-y-6">
                {printChunks.map((chunk, chunkIdx) => {
                  const isHiddenInSinglePreview = printPreviewMode === "single" && chunkIdx !== currentPrintPage - 1;
                  return (
                    <div 
                      key={chunkIdx} 
                      className={`bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-300 p-6 sm:p-8 max-w-5xl mx-auto space-y-4 ${
                        chunkIdx < printChunks.length - 1 ? "page-break" : ""
                      } ${isHiddenInSinglePreview ? "hidden print:block" : ""}`}
                      dir="rtl"
                    >
                      {/* Ministry Official Header */}
                      <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-center text-xs text-slate-900">
                        <div className="space-y-0.5 text-right">
                          <p className="font-black text-sm">المملكة العربية السعودية</p>
                          <p className="font-bold text-slate-700">وزارة التعليم</p>
                          <p className="text-[11px] text-slate-600">لجنة النظام والمراقبة (الكنترول المدرسي)</p>
                        </div>
                        <div className="text-center space-y-0.5">
                          <span className="inline-block px-3 py-0.5 bg-slate-100 rounded-full font-black text-slate-800 text-xs border border-slate-300">
                            الكشف المجمع لدرجات الطلاب (Master Sheet)
                          </span>
                          <h2 className="text-lg font-black text-slate-900">
                            {filterGrade || "جميع الصفوف"} {chunk.sectionName ? `- شعبة ${chunk.sectionName}` : ""}
                          </h2>
                          <p className="text-[11px] font-bold text-slate-600">
                            العام الدراسي: {currentAcademicYearId || "1446-1447هـ"} | {filterExamId ? activeStageExams.find(e => e.id === filterExamId)?.name : "جميع الفترات"}
                          </p>
                        </div>
                        <div className="text-left font-bold text-slate-700 space-y-0.5">
                          <p>مجمع مدارس المستقبل الأهلية</p>
                          <p className="text-primary font-black">
                            {printBreakBySection 
                              ? `شعبة ${chunk.sectionName}: صفحة ${chunk.pageNumberInSection} من ${chunk.totalPagesInSection}`
                              : `صفحة ${chunk.globalPageNumber} من ${chunk.totalGlobalPages}`
                            }
                          </p>
                          <p className="text-[10px] text-slate-500">
                            تاريخ الطباعة: {new Date().toISOString().split("T")[0]}
                          </p>
                        </div>
                      </div>

                      {/* Chunk Table */}
                      <table className="w-full border-collapse border border-slate-700 text-xs text-slate-900">
                        <thead>
                          <tr className="bg-slate-100 text-slate-900 font-black">
                            <th className="border border-slate-700 p-1.5 text-center w-10">م</th>
                            <th className="border border-slate-700 p-1.5 text-right min-w-[170px]">اسم الطالب رباعياً</th>
                            <th className="border border-slate-700 p-1.5 text-center w-24">الرقم الأكاديمي</th>
                            <th className="border border-slate-700 p-1.5 text-center w-16">الشعبة</th>
                            {applicableSubjects.map(s => (
                              <th key={s.id} className="border border-slate-700 p-1 text-center font-bold text-[10px]">
                                {s.name}
                              </th>
                            ))}
                            <th className="border border-slate-700 p-1.5 text-center font-black bg-slate-200/80 w-16">المجموع</th>
                            <th className="border border-slate-700 p-1.5 text-center font-black w-14">النسبة</th>
                            <th className="border border-slate-700 p-1.5 text-center font-black w-16">التقدير</th>
                            <th className="border border-slate-700 p-1.5 text-center font-black w-14">الحالة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chunk.rows.map((row, rIdx) => {
                            const studentRank = printBreakBySection ? row.sectionRank : row.globalRank;
                            return (
                              <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                                <td className="border border-slate-700 p-1 text-center font-bold text-slate-600 text-[11px]">
                                  {studentRank}
                                </td>
                                <td className="border border-slate-700 p-1 px-2 font-black text-slate-900 text-xs">
                                  {row.student.name}
                                </td>
                                <td className="border border-slate-700 p-1 text-center font-mono tabular-nums text-slate-700 text-[11px]" dir="ltr">
                                  {row.student.nationalId || "-"}
                                </td>
                                <td className="border border-slate-700 p-1 text-center font-bold text-slate-600 text-xs">
                                  {row.section || "-"}
                                </td>
                                {applicableSubjects.map(s => (
                                  <td key={s.id} className="border border-slate-700 p-1 text-center font-bold tabular-nums text-[11px]">
                                    {row.subjectsMap[s.id] !== undefined ? row.subjectsMap[s.id] : "-"}
                                  </td>
                                ))}
                                <td className="border border-slate-700 p-1 text-center font-black bg-slate-100 tabular-nums text-xs text-slate-950">
                                  {row.totalMarks}
                                </td>
                                <td className="border border-slate-700 p-1 text-center font-bold tabular-nums text-xs" dir="ltr">
                                  {row.percentage.toFixed(1)}%
                                </td>
                                <td className="border border-slate-700 p-1 text-center font-bold text-[11px]">
                                  {row.rank}
                                </td>
                                <td className="border border-slate-700 p-1 text-center font-black text-[11px]">
                                  <span className={row.isPassed ? "text-emerald-700" : "text-rose-700"}>
                                    {row.isPassed ? "ناجح" : "راسب"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* On the last chunk of each section (or end of report): render summary stats and triple signatures */}
                      {chunk.isSectionLastChunk && (
                        <div className="space-y-4 pt-2 avoid-break">
                          {/* Summary Stats Strip */}
                          <div className="grid grid-cols-5 gap-2 p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-center text-slate-800">
                            <div>إجمالي طلاب الشعبة: <span className="font-black text-slate-900">{chunk.sectionStats?.total || kpis.total}</span></div>
                            <div>الناجحون: <span className="font-black text-emerald-700">{chunk.sectionStats?.passed || kpis.passed}</span></div>
                            <div>نسبة النجاح: <span className="font-black text-slate-900">{chunk.sectionStats?.passRate || kpis.passRate}%</span></div>
                            <div>متوسط الدرجات: <span className="font-black text-blue-700">{(chunk.sectionStats?.avg || kpis.avg).toFixed(1)}%</span></div>
                            <div>أعلى مجموع: <span className="font-black text-amber-700">{chunk.sectionStats?.max || kpis.max}</span></div>
                          </div>

                          {/* Triple Signatures */}
                          <div className="grid grid-cols-3 pt-4 text-center text-xs font-black text-slate-800">
                            <div>
                              <p className="text-slate-600 mb-6">مسؤول الرصد والكنترول</p>
                              <p className="border-t border-dashed border-slate-400 pt-1 w-36 mx-auto">التوقيع والتاريخ</p>
                            </div>
                            <div>
                              <p className="text-slate-600 mb-6">وكيل الشؤون التعليمية</p>
                              <p className="border-t border-dashed border-slate-400 pt-1 w-36 mx-auto">المراجعة والتدقيق</p>
                            </div>
                            <div>
                              <p className="text-slate-600 mb-6">مدير المدرسة والختم الرسمي</p>
                              <p className="border-t border-dashed border-slate-400 pt-1 w-36 mx-auto">الاعتماد الرسمي والختم</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Advanced Print Engine Modal */}
      {isPrintOpen && (
        <AdvancedPrintEngine
          isOpen={isPrintOpen}
          data={printData}
          templates={[printTemplate]}
          title={`الكشف المجمع للدرجات - ${filterGrade || "كل الصفوف"}`}
          onClose={() => setIsPrintOpen(false)}
        />
      )}
    </div>
  );
}

// ==========================================
// 2. Official Student Certificate Tab (الشهادات الفردية والطباعة المتتالية المتقدمة)
// ==========================================
function ReportCardTab() {
  const { stage } = useStage();
  const { 
    activeStageStudents, 
    activeStageExams, 
    activeStageExamSubjects, 
    activeStageSubjects, 
    allExamResults,
    allStudentEnrollments,
    activeStageSections,
    currentAcademicYearId
  } = useGlobalStore();

  // Scope & Filter State
  const [selectedExamId, setSelectedExamId] = useState<string>(activeStageExams[0]?.id || "");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [scopeMode, setScopeMode] = useState<"entire_grade" | "selected_sections" | "custom_students" | "single_student">("entire_grade");
  const [selectedSectionIds, setSelectedSectionIds] = useState<Set<string>>(new Set());
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [studentSearch, setStudentSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "honors" | "passed" | "failed">("all");
  const [previewStudentIdx, setPreviewStudentIdx] = useState(0);

  // Certificate Studio & Customization State
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioTab, setStudioTab] = useState<"layout" | "texts" | "visuals" | "fields">("layout");
  const [pageOrientation, setPageOrientation] = useState<"portrait" | "landscape" | "compact_2up">("portrait");
  const [templateStyle, setTemplateStyle] = useState<"official" | "royal_gold" | "modern" | "classic">("official");

  // Editable Live Texts
  const [customSchoolName, setCustomSchoolName] = useState("مجمع مدارس المستقبل الأهلية النموذجية");
  const [customDirectorate, setCustomDirectorate] = useState("الإدارة العامة للتعليم الأهلي والأجنبي");
  const [customCertTitle, setCustomCertTitle] = useState("");
  const [customCongratulatoryNote, setCustomCongratulatoryNote] = useState("تهانينا الحارة لولي أمر الطالب على هذا المستوى المشرف، متمنين له دوام التوفيق والتميز الأكاديمي.");
  const [customPrincipalName, setCustomPrincipalName] = useState("أ. عبد الله بن سالم الغامدي");
  const [customControllerName, setCustomControllerName] = useState("أ. فهد بن ناصر العتيبي");
  const [customGuidanceName, setCustomGuidanceName] = useState("أ. سعد بن محمد القحطاني");

  // Visual Elements & Seals Toggles
  const [showMinistryLogo, setShowMinistryLogo] = useState(true);
  const [showVision2030Logo, setShowVision2030Logo] = useState(true);
  const [showSchoolLogo, setShowSchoolLogo] = useState(true);
  const [schoolLogoUrl, setSchoolLogoUrl] = useState("");
  const [showOfficialSeal, setShowOfficialSeal] = useState(true);
  const [sealType, setSealType] = useState<"blue" | "gold" | "watermark">("blue");
  const [showQrCode, setShowQrCode] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);

  // Data Elements Toggles (Strictly NO descriptive ratings on individual subjects!)
  const [showRank, setShowRank] = useState(true);
  const [showPercentage, setShowPercentage] = useState(true);
  const [showSubjectPercentage, setShowSubjectPercentage] = useState(true);
  const [showMaxPassScore, setShowMaxPassScore] = useState(true);
  const [showSubjectStatus, setShowSubjectStatus] = useState(true);
  const [showGeneralRating, setShowGeneralRating] = useState(true);
  const [showDecision, setShowDecision] = useState(true);
  const [showCustomNote, setShowCustomNote] = useState(true);

  // Modals State
  const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
  const [selectedStudentForCareer, setSelectedStudentForCareer] = useState<string>("");
  const [isBatchCertificatesOpen, setIsBatchCertificatesOpen] = useState(false);

  // Available Grades in active stage
  const availableGrades = useMemo(() => {
    const list: string[] = [];
    activeStageSections.filter(s => s.stage === stage).forEach(s => {
      if (s.grade && !list.includes(s.grade)) list.push(s.grade);
    });
    if (list.length === 0) {
      return getGradesForStage(stage);
    }
    return list;
  }, [activeStageSections, stage]);

  useEffect(() => {
    if (availableGrades.length > 0 && (!selectedGrade || !availableGrades.includes(selectedGrade))) {
      setSelectedGrade(availableGrades[0]);
    }
  }, [availableGrades, selectedGrade]);

  // Sections for selected grade
  const sectionsForGrade = useMemo(() => {
    if (!selectedGrade) return [];
    return activeStageSections.filter(s => normalizeGrade(s.grade) === normalizeGrade(selectedGrade) && s.stage === stage);
  }, [activeStageSections, selectedGrade, stage]);

  // Initialize all sections as selected when grade changes
  useEffect(() => {
    if (sectionsForGrade.length > 0) {
      setSelectedSectionIds(new Set(sectionsForGrade.map(s => s.id)));
    } else {
      setSelectedSectionIds(new Set());
    }
  }, [sectionsForGrade, selectedGrade]);

  const selectedExam = useMemo(() => {
    return activeStageExams.find(e => e.id === selectedExamId) || activeStageExams[0];
  }, [activeStageExams, selectedExamId]);

  // Results Map for O(1) Instantaneous Lookup
  const resultsMap = useMemo(() => {
    const map = new Map<string, any>();
    allExamResults.forEach(r => {
      if (r.studentEnrollmentId) {
        map.set(`${r.examSubjectId}_${r.studentEnrollmentId}`, r);
      }
    });
    return map;
  }, [allExamResults]);

  // Exam Subjects for this exam and grade
  const gradeExamSubjects = useMemo(() => {
    if (!selectedExam || !selectedGrade) return [];
    return activeStageExamSubjects.filter(es => 
      es.examId === selectedExam.id && normalizeGrade(es.grade) === normalizeGrade(selectedGrade)
    );
  }, [activeStageExamSubjects, selectedExam, selectedGrade]);

  // Eligible students in grade
  const gradeStudents = useMemo(() => {
    if (!selectedGrade) return [];
    return activeStageStudents.filter(s => normalizeGrade(s.grade) === normalizeGrade(selectedGrade));
  }, [activeStageStudents, selectedGrade]);

  // Compute Full Academic Data for All Eligible Students
  const computedStudentsData = useMemo(() => {
    if (!selectedExam || gradeStudents.length === 0) return [];

    const computed = gradeStudents.map(st => {
      const enrollment = allStudentEnrollments.find(e => e.studentId === st.id && e.academicYearId === currentAcademicYearId) || {
        id: `ENR-${st.id}`,
        studentId: st.id,
        sectionId: st.sectionId || "",
        academicYearId: currentAcademicYearId,
        stage: stage,
        status: "enrolled"
      };

      const sectionObj = activeStageSections.find(s => s.id === (enrollment.sectionId || st.sectionId));

      let totalMarks = 0;
      let totalMaxMarks = 0;
      let failedCount = 0;

      const subjectMarks = gradeExamSubjects.map(es => {
        const sub = activeStageSubjects.find(s => s.id === es.subjectId);
        const enrollmentId = enrollment.id;
        const res = resultsMap.get(`${es.id}_${enrollmentId}`) ||
                    resultsMap.get(`${es.id}_${st.id}`) ||
                    ((st as any).studentId ? resultsMap.get(`${es.id}_${(st as any).studentId}`) : null) ||
                    allExamResults.find(r => r.examSubjectId === es.id && (
                      r.studentEnrollmentId === enrollmentId || 
                      r.studentEnrollmentId === st.id || 
                      ((st as any).studentId && r.studentEnrollmentId === (st as any).studentId)
                    ));

        const mark = res?.mark ?? 0;
        const isPassed = mark >= es.passScore;
        const pct = es.maxScore > 0 ? (mark / es.maxScore) * 100 : 0;

        totalMarks += mark;
        totalMaxMarks += es.maxScore;
        if (!isPassed) failedCount++;

        return {
          examSubject: es,
          subjectName: sub?.name || es.subjectId,
          mark,
          maxScore: es.maxScore,
          passScore: es.passScore,
          pct,
          isPassed,
          notes: res?.notes || ""
        };
      });

      const overallPercentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
      let overallRating = "ناجح ومؤهل";
      if (overallPercentage >= 90) overallRating = "ممتاز مرتفع (مرتبة الشرف)";
      else if (overallPercentage >= 80) overallRating = "جيد جداً مرتفع";
      else if (overallPercentage >= 65) overallRating = "جيد";
      else if (overallPercentage >= 50) overallRating = "مقبول";
      else overallRating = "له دور ثانٍ";

      const isPassed = overallPercentage >= 50 && failedCount === 0;

      return {
        student: st,
        enrollment,
        sectionId: enrollment.sectionId || st.sectionId || "",
        sectionName: sectionObj?.name || "1",
        subjectMarks,
        totalMarks,
        totalMaxMarks,
        overallPercentage,
        overallRating,
        failedCount,
        isPassed
      };
    });

    const sorted = [...computed].sort((a, b) => b.totalMarks - a.totalMarks);
    return sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      totalInGrade: sorted.length
    }));
  }, [gradeStudents, selectedExam, gradeExamSubjects, allStudentEnrollments, currentAcademicYearId, stage, activeStageSections, resultsMap, allExamResults, activeStageSubjects]);

  // Section student counts
  const sectionStudentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    sectionsForGrade.forEach(sec => {
      counts[sec.id] = computedStudentsData.filter(st => st.sectionId === sec.id).length;
    });
    return counts;
  }, [sectionsForGrade, computedStudentsData]);

  // Sync selectedStudentIds when scope changes
  useEffect(() => {
    if (scopeMode === "entire_grade") {
      setSelectedStudentIds(new Set(computedStudentsData.map(s => s.student.id)));
      setSelectedSectionIds(new Set(sectionsForGrade.map(s => s.id)));
    } else if (scopeMode === "selected_sections") {
      const secStudents = computedStudentsData.filter(s => selectedSectionIds.has(s.sectionId));
      setSelectedStudentIds(new Set(secStudents.map(s => s.student.id)));
    } else if (scopeMode === "single_student") {
      const first = computedStudentsData[0];
      if (first) setSelectedStudentIds(new Set([first.student.id]));
    }
    setPreviewStudentIdx(0);
  }, [scopeMode, selectedGrade, computedStudentsData.length]);

  // Update selectedStudentIds when selectedSectionIds changes in "selected_sections" mode
  const toggleSection = (secId: string) => {
    setSelectedSectionIds(prev => {
      const next = new Set(prev);
      if (next.has(secId)) next.delete(secId);
      else next.add(secId);

      // Auto update student selection for selected sections
      const activeStudents = computedStudentsData.filter(s => next.has(s.sectionId));
      setSelectedStudentIds(new Set(activeStudents.map(s => s.student.id)));
      return next;
    });
    setPreviewStudentIdx(0);
  };

  const handleSelectAllSections = () => {
    const allSecIds = new Set(sectionsForGrade.map(s => s.id));
    setSelectedSectionIds(allSecIds);
    setSelectedStudentIds(new Set(computedStudentsData.map(s => s.student.id)));
  };

  const handleClearSections = () => {
    setSelectedSectionIds(new Set());
    setSelectedStudentIds(new Set());
  };

  // Visible students in selector list based on search and filters
  const visibleStudents = useMemo(() => {
    let list = computedStudentsData;

    if (scopeMode === "selected_sections") {
      list = list.filter(s => selectedSectionIds.has(s.sectionId));
    }

    if (studentSearch.trim()) {
      const q = studentSearch.trim().toLowerCase();
      list = list.filter(s => 
        s.student.name.toLowerCase().includes(q) ||
        (s.student.nationalId && s.student.nationalId.includes(q)) ||
        s.sectionName.toLowerCase().includes(q)
      );
    }

    if (filterStatus === "honors") {
      list = list.filter(s => s.overallPercentage >= 90);
    } else if (filterStatus === "passed") {
      list = list.filter(s => s.isPassed);
    } else if (filterStatus === "failed") {
      list = list.filter(s => !s.isPassed);
    }

    return list;
  }, [computedStudentsData, scopeMode, selectedSectionIds, studentSearch, filterStatus]);

  // Students targeted for consecutive printing
  const studentsToPrint = useMemo(() => {
    if (computedStudentsData.length === 0) return [];
    if (scopeMode === "single_student") {
      const cur = computedStudentsData[previewStudentIdx] || computedStudentsData[0];
      return cur ? [cur] : [];
    }
    if (scopeMode === "entire_grade") {
      return computedStudentsData.filter(s => selectedStudentIds.size === 0 || selectedStudentIds.has(s.student.id));
    }
    if (scopeMode === "selected_sections") {
      return computedStudentsData.filter(s => selectedSectionIds.has(s.sectionId) && (selectedStudentIds.size === 0 || selectedStudentIds.has(s.student.id)));
    }
    if (scopeMode === "custom_students") {
      const selected = computedStudentsData.filter(s => selectedStudentIds.has(s.student.id));
      return selected.length > 0 ? selected : computedStudentsData.slice(0, 1);
    }
    return computedStudentsData;
  }, [computedStudentsData, scopeMode, selectedSectionIds, selectedStudentIds, previewStudentIdx]);

  // Current preview student
  const currentPreviewStudent = studentsToPrint[previewStudentIdx] || studentsToPrint[0] || computedStudentsData[0];

  // Quick Selection Helpers
  const handleSelectAllStudents = () => {
    setSelectedStudentIds(new Set(visibleStudents.map(s => s.student.id)));
  };
  const handleDeselectAllStudents = () => {
    setSelectedStudentIds(new Set());
  };
  const handleSelectTopN = (n: number) => {
    const topIds = visibleStudents.slice(0, n).map(s => s.student.id);
    setSelectedStudentIds(new Set(topIds));
  };
  const handleSelectHonors = () => {
    const honorsIds = visibleStudents.filter(s => s.overallPercentage >= 90).map(s => s.student.id);
    setSelectedStudentIds(new Set(honorsIds));
  };
  const handleSelectPassed = () => {
    const passedIds = visibleStudents.filter(s => s.isPassed).map(s => s.student.id);
    setSelectedStudentIds(new Set(passedIds));
  };

  const toggleStudentCheck = (id: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePrev = () => {
    setPreviewStudentIdx(prev => Math.max(0, prev - 1));
  };
  const handleNext = () => {
    setPreviewStudentIdx(prev => Math.min(studentsToPrint.length - 1, prev + 1));
  };

  // High-Speed Consecutive Native A4 Printing (with Orientation Support)
  const handlePrintSequential = () => {
    if (studentsToPrint.length === 0) {
      toast.error("يرجى تحديد طالب واحد على الأقل للطباعة");
      return;
    }
    const title = `شهادات_${selectedExam?.name || "الاختبار"}_صف_${selectedGrade}_${scopeMode}_${pageOrientation}`;
    printSequentialCertificatesViaIframe("printable-sequential-certificates-tab-container", title, pageOrientation);
  };

  const handlePrintCurrentSingle = () => {
    if (!currentPreviewStudent) {
      toast.error("لا يوجد طالب معروض للطباعة");
      return;
    }
    const title = `شهادة_طالب_${currentPreviewStudent.student.name}_${selectedExam?.name || ""}`;
    printSequentialCertificatesViaIframe("printable-single-certificate-preview-container", title, pageOrientation);
  };

  // Grouping for 2-Up Compact Printing: pairs of 2 students per sheet
  const compact2UpPairs = useMemo(() => {
    const pairs: [any, any?][] = [];
    for (let i = 0; i < studentsToPrint.length; i += 2) {
      pairs.push([studentsToPrint[i], studentsToPrint[i + 1]]);
    }
    return pairs;
  }, [studentsToPrint]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Hierarchy Selector Command Bar */}
      <PageCard 
        title="إصدار وطباعة الشهادات والنتائج الفردية والمجمعة" 
        description="نظام هندسي مرن وشامل لاختيار الطلاب (فصل كامل، شعب محددة، أو تحديد دقيق) مع استوديو لتخصيص كل أجزاء الشهادة والطباعة المتتالية"
      >
        <div className="space-y-4">
          
          {/* Top Step 1: Exam & Grade Primary Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pb-3 border-b border-border/60">
            <div>
              <label className="mb-1.5 block text-xs font-black text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" /> فترة الاختبار
              </label>
              <select 
                value={selectedExamId} 
                onChange={e => setSelectedExamId(e.target.value)} 
                className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 font-bold text-xs shadow-xs focus:border-primary cursor-pointer outline-none"
              >
                {activeStageExams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.term})</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black text-foreground flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary" /> الصف الدراسي
              </label>
              <select 
                value={selectedGrade} 
                onChange={e => setSelectedGrade(e.target.value)} 
                className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 font-bold text-xs shadow-xs focus:border-primary cursor-pointer outline-none"
              >
                {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black text-foreground flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-primary" /> نمط وقالب الشهادة
              </label>
              <select 
                value={templateStyle} 
                onChange={e => setTemplateStyle(e.target.value as any)} 
                className="w-full h-10 rounded-xl border border-border/70 bg-background px-3 font-bold text-xs shadow-xs focus:border-primary cursor-pointer outline-none"
              >
                <option value="official">🏛️ الإشعار الوزاري المعتمد (رسمي)</option>
                <option value="royal_gold">🏆 الشهادة الملكية الذهبية للتفوق والأوائل</option>
                <option value="modern">✨ التصميم العصري الحديث والأنيق</option>
                <option value="classic">📜 الشهادة التراثية الكلاسيكية المذهبة</option>
              </select>
            </div>
          </div>

          {/* Top Step 2: Scope Selector Mode (الفصل كاملاً / شعب محددة / تحديد يدوي / طالب فردي) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-2xl bg-muted/40 border border-border/70">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" /> نطاق إصدار الشهادات:
              </span>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
              <button
                type="button"
                onClick={() => setScopeMode("entire_grade")}
                className={`px-3.5 py-2 rounded-xl font-black text-xs transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                  scopeMode === "entire_grade" 
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25" 
                    : "bg-background text-muted-foreground hover:text-foreground border border-border/60 hover:bg-muted"
                }`}
              >
                <span>🏢 الفصل كاملاً بكل شعبه</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-primary-foreground/20 text-primary-foreground font-bold">
                  {gradeStudents.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScopeMode("selected_sections")}
                className={`px-3.5 py-2 rounded-xl font-black text-xs transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                  scopeMode === "selected_sections" 
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25" 
                    : "bg-background text-muted-foreground hover:text-foreground border border-border/60 hover:bg-muted"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>👥 شعب محددة من الفصل</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground font-bold">
                  {selectedSectionIds.size} من {sectionsForGrade.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScopeMode("custom_students")}
                className={`px-3.5 py-2 rounded-xl font-black text-xs transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                  scopeMode === "custom_students" 
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25" 
                    : "bg-background text-muted-foreground hover:text-foreground border border-border/60 hover:bg-muted"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>🎯 تحديد مخصص لطلاب</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground font-bold">
                  {selectedStudentIds.size}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScopeMode("single_student")}
                className={`px-3.5 py-2 rounded-xl font-black text-xs transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                  scopeMode === "single_student" 
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25" 
                    : "bg-background text-muted-foreground hover:text-foreground border border-border/60 hover:bg-muted"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>👤 طالب فردي</span>
              </button>
            </div>
          </div>

          {/* Top Step 3: Multi-Section Checkboxes Bar (When scope is selected_sections or entire_grade) */}
          {sectionsForGrade.length > 0 && (
            <div className="p-3 rounded-2xl border border-border/60 bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-foreground flex items-center gap-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5 text-primary" /> شعب الصف ({selectedGrade}):
                </span>
                {sectionsForGrade.map(sec => {
                  const isChecked = selectedSectionIds.has(sec.id);
                  const count = sectionStudentCounts[sec.id] || 0;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        if (scopeMode === "entire_grade") setScopeMode("selected_sections");
                        toggleSection(sec.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-black transition-all flex items-center gap-2 cursor-pointer border ${
                        isChecked 
                          ? "bg-primary/10 border-primary text-primary shadow-xs" 
                          : "bg-background border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                        isChecked ? "bg-primary text-primary-foreground border-primary" : "border-border"
                      }`}>
                        {isChecked ? "✓" : ""}
                      </span>
                      <span>شعبة {sec.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-bold">
                        {count} طالب
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAllSections}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  تحديد كافة الشعب
                </button>
                <span className="text-muted-foreground">•</span>
                <button
                  type="button"
                  onClick={handleClearSections}
                  className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  إلغاء الشعب
                </button>
              </div>
            </div>
          )}

          {/* Action Toolbar & Print Triggers */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Sequential Batch Print Button */}
              <button
                type="button"
                onClick={handlePrintSequential}
                disabled={studentsToPrint.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/25 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {studentsToPrint.length === 1 
                    ? "طباعة هذه الشهادة الفردية (ورقة A4)" 
                    : `إرسال أمر الطباعة المتتالي (${studentsToPrint.length} طالب - ورقة A4 لكل طالب)`}
                </span>
              </button>

              {/* Single Preview Print Button */}
              {studentsToPrint.length > 1 && currentPreviewStudent && (
                <button
                  type="button"
                  onClick={handlePrintCurrentSingle}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted text-foreground font-bold text-xs transition-colors cursor-pointer"
                  title="طباعة ورقة الطالب المعروض حالياً فقط"
                >
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>طباعة الطالب المعروض فقط</span>
                </button>
              )}

              {/* Academic Career Modal Trigger */}
              {currentPreviewStudent && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentForCareer(currentPreviewStudent.student.id);
                    setIsCareerModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-primary/30 bg-primary/10 text-primary font-black text-xs hover:bg-primary/20 transition-all cursor-pointer shadow-2xs"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>السيرة الدراسية الشاملة 🎓</span>
                </button>
              )}
            </div>

            {/* Toggle Studio Customization Drawer Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsStudioOpen(!isStudioOpen)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-xs transition-all cursor-pointer shadow-2xs ${
                  isStudioOpen 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "border-border/70 bg-card hover:bg-muted text-foreground"
                }`}
              >
                <Settings2 className="w-4 h-4" />
                <span>{isStudioOpen ? "إغلاق استوديو التخصيص" : "استوديو التحكم والتعديل اليدوي للشهادة ⚙️"}</span>
              </button>
            </div>
          </div>

        </div>
      </PageCard>

      {/* 2. Advanced Manual Customization Studio Drawer (Live Editing of all Certificate Parts) */}
      {isStudioOpen && (
        <div className="bg-card rounded-3xl border border-primary/30 p-5 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-foreground">استوديو التحكم والتعديل اليدوي الشامل للشهادات</h4>
                <p className="text-[11px] text-muted-foreground font-bold">عدّل النصوص، الشعارات، الأختام، الحقول، ووضعية الصفحة بدقة هندسية فورية</p>
              </div>
            </div>

            {/* Studio Navigation Tabs */}
            <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 text-xs">
              <button
                type="button"
                onClick={() => setStudioTab("layout")}
                className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                  studioTab === "layout" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                📐 الوضعية والقالب
              </button>
              <button
                type="button"
                onClick={() => setStudioTab("texts")}
                className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                  studioTab === "texts" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ✍️ النصوص والعناوين
              </button>
              <button
                type="button"
                onClick={() => setStudioTab("visuals")}
                className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                  studioTab === "visuals" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🖼️ الشعارات والأختام
              </button>
              <button
                type="button"
                onClick={() => setStudioTab("fields")}
                className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                  studioTab === "fields" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                📊 حقول وبيانات الدرجات
              </button>
            </div>
          </div>

          {/* Studio Tab 1: Layout & Orientation */}
          {studioTab === "layout" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Orientation Selection */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-muted/20 border border-border/60">
                <label className="font-black text-foreground block">وضعية الورقة المطبوعة (A4 Page Orientation):</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPageOrientation("portrait")}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-black ${
                      pageOrientation === "portrait" 
                        ? "bg-primary/10 border-primary text-primary shadow-xs" 
                        : "bg-background border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <FileText className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <span className="block text-xs">A4 عمودي رسمي</span>
                    <span className="text-[10px] text-muted-foreground font-normal">المعتمد للإشعار الفردي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPageOrientation("landscape")}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-black ${
                      pageOrientation === "landscape" 
                        ? "bg-primary/10 border-primary text-primary shadow-xs" 
                        : "bg-background border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Award className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                    <span className="block text-xs">A4 عرضي شرفي</span>
                    <span className="text-[10px] text-muted-foreground font-normal">دبلوم شرفي فاخر</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPageOrientation("compact_2up")}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-black ${
                      pageOrientation === "compact_2up" 
                        ? "bg-primary/10 border-primary text-primary shadow-xs" 
                        : "bg-background border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Scissors className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                    <span className="block text-xs">إشعارين بالصفحة (2-Up)</span>
                    <span className="text-[10px] text-muted-foreground font-normal">اقتصادي لتوفير الورق</span>
                  </button>
                </div>
              </div>

              {/* Template Style */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-muted/20 border border-border/60">
                <label className="font-black text-foreground block">قالب وتصميم الشهادة الرسمي:</label>
                <div className="grid grid-cols-2 gap-2 font-bold">
                  {[
                    { id: "official", title: "الإشعار الوزاري المعتمد", desc: "ترويسة رسمية وإطار معتمد" },
                    { id: "royal_gold", title: "الشهادة الملكية الذهبية", desc: "إطار مذهب للتفوق والأوائل 🏆" },
                    { id: "modern", title: "التصميم العصري الأنيق", desc: "ألوان متدرجة وبطاقات ناعمة ✨" },
                    { id: "classic", title: "الشهادة التراثية الراقية", desc: "زخارف شرقية وشارات شرفية 📜" },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplateStyle(t.id as any)}
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                        templateStyle === t.id 
                          ? "bg-primary/10 border-primary text-primary shadow-xs font-black" 
                          : "bg-background border-border/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <p className="text-xs font-black text-foreground">{t.title}</p>
                      <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Studio Tab 2: Manual Text Editing */}
          {studioTab === "texts" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="mb-1 block font-bold text-muted-foreground">اسم المدرسة المعتمد</label>
                <input
                  value={customSchoolName}
                  onChange={e => setCustomSchoolName(e.target.value)}
                  placeholder="مجمع مدارس..."
                  className="w-full h-9 rounded-xl border border-border/70 bg-background px-3 font-bold text-xs focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-muted-foreground">الإدارة التعليمية / المنطقة</label>
                <input
                  value={customDirectorate}
                  onChange={e => setCustomDirectorate(e.target.value)}
                  placeholder="الإدارة العامة للتعليم..."
                  className="w-full h-9 rounded-xl border border-border/70 bg-background px-3 font-bold text-xs focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-muted-foreground">عنوان الشهادة المطبوع</label>
                <input
                  value={customCertTitle}
                  onChange={e => setCustomCertTitle(e.target.value)}
                  placeholder="افتراضي حسب القالب..."
                  className="w-full h-9 rounded-xl border border-border/70 bg-background px-3 font-bold text-xs focus:border-primary outline-none"
                />
              </div>

              <div className="sm:col-span-2 md:col-span-3">
                <label className="mb-1 block font-bold text-muted-foreground">كلمة التهنئة أو التوجيه الطلابي بأسفل الشهادة</label>
                <input
                  value={customCongratulatoryNote}
                  onChange={e => setCustomCongratulatoryNote(e.target.value)}
                  placeholder="نص التهنئة المطبوع..."
                  className="w-full h-9 rounded-xl border border-border/70 bg-background px-3 font-bold text-xs focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-muted-foreground">اسم مدير المدرسة والختم</label>
                <input
                  value={customPrincipalName}
                  onChange={e => setCustomPrincipalName(e.target.value)}
                  className="w-full h-9 rounded-xl border border-border/70 bg-background px-3 font-bold text-xs focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-muted-foreground">اسم وكيل الكنترول والاختبارات</label>
                <input
                  value={customControllerName}
                  onChange={e => setCustomControllerName(e.target.value)}
                  className="w-full h-9 rounded-xl border border-border/70 bg-background px-3 font-bold text-xs focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-muted-foreground">اسم المرشد الطلابي / رائد الفصل</label>
                <input
                  value={customGuidanceName}
                  onChange={e => setCustomGuidanceName(e.target.value)}
                  className="w-full h-9 rounded-xl border border-border/70 bg-background px-3 font-bold text-xs focus:border-primary outline-none"
                />
              </div>
            </div>
          )}

          {/* Studio Tab 3: Visual Elements & Seals */}
          {studioTab === "visuals" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-bold">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer transition-colors shadow-2xs">
                <input 
                  type="checkbox" 
                  checked={showMinistryLogo} 
                  onChange={e => setShowMinistryLogo(e.target.checked)} 
                  className="rounded text-primary cursor-pointer w-4 h-4" 
                />
                <span className="truncate">شعار وزارة التعليم</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer transition-colors shadow-2xs">
                <input 
                  type="checkbox" 
                  checked={showVision2030Logo} 
                  onChange={e => setShowVision2030Logo(e.target.checked)} 
                  className="rounded text-primary cursor-pointer w-4 h-4" 
                />
                <span className="truncate">شعار رؤية 2030</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer transition-colors shadow-2xs">
                <input 
                  type="checkbox" 
                  checked={showSchoolLogo} 
                  onChange={e => setShowSchoolLogo(e.target.checked)} 
                  className="rounded text-primary cursor-pointer w-4 h-4" 
                />
                <span className="truncate">شعار المدرسة</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer transition-colors shadow-2xs">
                <input 
                  type="checkbox" 
                  checked={showOfficialSeal} 
                  onChange={e => setShowOfficialSeal(e.target.checked)} 
                  className="rounded text-primary cursor-pointer w-4 h-4" 
                />
                <span className="truncate">الختم الرسمي للمدرسة</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer transition-colors shadow-2xs">
                <input 
                  type="checkbox" 
                  checked={showQrCode} 
                  onChange={e => setShowQrCode(e.target.checked)} 
                  className="rounded text-primary cursor-pointer w-4 h-4" 
                />
                <span className="truncate">باركود التحقق الذكي QR</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer transition-colors shadow-2xs">
                <input 
                  type="checkbox" 
                  checked={showSignatures} 
                  onChange={e => setShowSignatures(e.target.checked)} 
                  className="rounded text-primary cursor-pointer w-4 h-4" 
                />
                <span className="truncate">التوقيعات والاعتماد</span>
              </label>

              {/* Seal Style Picker if seal is enabled */}
              {showOfficialSeal && (
                <div className="col-span-2 sm:col-span-3 lg:col-span-6 p-2 rounded-xl bg-muted/30 border border-border/60 flex items-center gap-3">
                  <span className="font-black text-foreground">نوع وشكل الختم الرسمي:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSealType("blue")}
                      className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                        sealType === "blue" ? "bg-blue-600 text-white shadow-xs" : "bg-card text-muted-foreground border border-border/60"
                      }`}
                    >
                      🔵 ختم أزرق وزاري معتمد
                    </button>
                    <button
                      type="button"
                      onClick={() => setSealType("gold")}
                      className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                        sealType === "gold" ? "bg-amber-600 text-white shadow-xs" : "bg-card text-muted-foreground border border-border/60"
                      }`}
                    >
                      🟡 ختم ذهبي ملكي شرفي
                    </button>
                    <button
                      type="button"
                      onClick={() => setSealType("watermark")}
                      className={`px-3 py-1 rounded-lg font-black transition-all cursor-pointer ${
                        sealType === "watermark" ? "bg-slate-700 text-white shadow-xs" : "bg-card text-muted-foreground border border-border/60"
                      }`}
                    >
                      ⚪ ختم مائي في الخلفية
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Studio Tab 4: Grade & Subject Fields (STRICT RULE: Zero descriptive rating on individual subjects!) */}
          {studioTab === "fields" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-bold">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer transition-colors shadow-2xs">
                <input 
                  type="checkbox" 
                  checked={showRank} 
                  onChange={e => setShowRank(e.target.checked)} 
                  className="rounded text-primary cursor-pointer w-4 h-4" 
                />
                <span className="truncate">الترتيب الأكاديمي</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer transition-colors shadow-2xs">
                <input 
                  type="checkbox" 
                  checked={showPercentage} 
                  onChange={e => setShowPercentage(e.target.checked)} 
                  className="rounded text-primary cursor-pointer w-4 h-4" 
                />
                <span className="truncate">النسبة المئوية العامة</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer transition-colors shadow-2xs">
                <input 
                  type="checkbox" 
                  checked={showSubjectPercentage} 
                  onChange={e => setShowSubjectPercentage(e.target.checked)} 
                  className="rounded text-primary cursor-pointer w-4 h-4" 
                />
                <span className="truncate">نسبة كل مادة %</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer transition-colors shadow-2xs">
                <input 
                  type="checkbox" 
                  checked={showMaxPassScore} 
                  onChange={e => setShowMaxPassScore(e.target.checked)} 
                  className="rounded text-primary cursor-pointer w-4 h-4" 
                />
                <span className="truncate">الدرجة الكبرى والصغرى</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer transition-colors shadow-2xs">
                <input 
                  type="checkbox" 
                  checked={showSubjectStatus} 
                  onChange={e => setShowSubjectStatus(e.target.checked)} 
                  className="rounded text-primary cursor-pointer w-4 h-4" 
                />
                <span className="truncate">حالة المادة (ناجح / دور ثانٍ)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 cursor-pointer transition-colors shadow-2xs">
                <input 
                  type="checkbox" 
                  checked={showCustomNote} 
                  onChange={e => setShowCustomNote(e.target.checked)} 
                  className="rounded text-primary cursor-pointer w-4 h-4" 
                />
                <span className="truncate">رسالة التهنئة / الملاحظة</span>
              </label>
            </div>
          )}

        </div>
      )}

      {/* 3. Main Studio Workspace: Ultra-Fluent Student Selector (Left) & Real-Time Certificate Canvas (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Modern Interactive Student Picker (4 cols) */}
        <div className="lg:col-span-4 bg-card rounded-3xl border border-border/70 p-4 shadow-sm space-y-3.5">
          
          {/* Header & Count Badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" /> طلاب {selectedGrade}
            </span>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {studentsToPrint.length} محدد للطباعة
            </span>
          </div>

          {/* Instant Search Bar */}
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              placeholder="بحث بالاسم، الرقم الأكاديمي، أو الشعبة..."
              className="h-9 w-full rounded-xl border border-border/70 bg-background pr-8 pl-8 text-xs font-bold shadow-2xs focus:border-primary outline-none transition-all"
            />
            {studentSearch && (
              <button
                type="button"
                onClick={() => setStudentSearch("")}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Selection Actions Bar */}
          <div className="flex items-center gap-1 flex-wrap text-[11px] font-black">
            <button 
              type="button" 
              onClick={handleSelectAllStudents} 
              className="px-2 py-1 rounded-lg bg-muted hover:bg-accent text-foreground transition-colors cursor-pointer"
              title="تحديد كافة الطلاب المعروضين"
            >
              الكل ({visibleStudents.length})
            </button>
            <button 
              type="button" 
              onClick={() => handleSelectTopN(5)} 
              className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              أول 5 🥇
            </button>
            <button 
              type="button" 
              onClick={() => handleSelectTopN(10)} 
              className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              أول 10 🏆
            </button>
            <button 
              type="button" 
              onClick={handleSelectHonors} 
              className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors cursor-pointer"
            >
              المتفوقين (90%+)
            </button>
            <button 
              type="button" 
              onClick={handleSelectPassed} 
              className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors cursor-pointer"
            >
              الناجحين
            </button>
            <button 
              type="button" 
              onClick={handleDeselectAllStudents} 
              className="px-2 py-1 rounded-lg bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>

          {/* Interactive Student Roster List */}
          <div className="max-h-[550px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/20">
            {visibleStudents.map((s) => {
              const isChecked = selectedStudentIds.has(s.student.id);
              const isPreviewing = currentPreviewStudent?.student.id === s.student.id;

              return (
                <div
                  key={s.student.id}
                  className={`pt-1.5 first:pt-0 flex items-center justify-between p-2 rounded-xl transition-all ${
                    isPreviewing 
                      ? "bg-primary/10 border border-primary/40 shadow-xs" 
                      : "hover:bg-muted/40 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleStudentCheck(s.student.id)}
                      className="rounded text-primary cursor-pointer w-4 h-4 shrink-0"
                    />
                    
                    <button
                      type="button"
                      onClick={() => {
                        const pIdx = studentsToPrint.findIndex(item => item.student.id === s.student.id);
                        if (pIdx !== -1) setPreviewStudentIdx(pIdx);
                        else {
                          // Auto include in selection and jump
                          toggleStudentCheck(s.student.id);
                        }
                      }}
                      className="text-right cursor-pointer flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-foreground truncate">{s.student.name}</span>
                        {s.rank <= 3 && (
                          <span className="text-[11px] shrink-0">{s.rank === 1 ? "🥇" : s.rank === 2 ? "🥈" : "🥉"}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold truncate">
                        شعبة {s.sectionName} • المعدل: <b className="text-primary tabular-nums" dir="ltr">{s.overallPercentage.toFixed(1)}%</b> • #{s.rank}
                      </p>
                    </button>
                  </div>

                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 mr-1 ${
                    s.isPassed ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                  }`}>
                    {s.isPassed ? "ناجح" : "دور ثانٍ"}
                  </span>
                </div>
              );
            })}

            {visibleStudents.length === 0 && (
              <div className="p-8 text-center text-muted-foreground font-bold text-xs">
                لا توجد نتائج مطابقة لمعايير البحث والتصفية.
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Real-Time Live Certificate Preview Canvas (8 cols) */}
        <div className="lg:col-span-8 bg-card rounded-3xl border border-border/70 p-5 shadow-sm space-y-4">
          
          {/* Live Preview Stepper Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-primary" /> معاينة الشهادة الحالية قبل الطباعة
              </span>
              <span className="text-[11px] font-bold text-muted-foreground">
                ({pageOrientation === "portrait" ? "A4 عمودي" : pageOrientation === "landscape" ? "A4 عرضي" : "إشعارين 2-Up"} • {
                  templateStyle === "official" ? "إشعار وزاري معتمد" :
                  templateStyle === "royal_gold" ? "شهادة ملكية ذهبية" :
                  templateStyle === "modern" ? "تصميم عصري" : "شهادة تراثية"
                })
              </span>
            </div>

            {studentsToPrint.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={previewStudentIdx <= 0}
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg border border-border/60 bg-background hover:bg-muted disabled:opacity-30 transition-all cursor-pointer"
                  title="الشهادة السابقة"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-xs font-black tabular-nums bg-muted px-2.5 py-1 rounded-lg">
                  {previewStudentIdx + 1} من {studentsToPrint.length}
                </span>
                <button
                  type="button"
                  disabled={previewStudentIdx >= studentsToPrint.length - 1}
                  onClick={handleNext}
                  className="p-1.5 rounded-lg border border-border/60 bg-background hover:bg-muted disabled:opacity-30 transition-all cursor-pointer"
                  title="الشهادة التالية"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Real-Time Certificate Canvas */}
          {currentPreviewStudent ? (
            <div className="flex justify-center overflow-x-auto p-1">
              <div 
                id="printable-single-certificate-preview-container"
                className={`w-full transition-all select-none space-y-4 shadow-xl relative ${
                  pageOrientation === "landscape" ? "max-w-4xl p-6 sm:p-7" : "max-w-2xl p-6 sm:p-8"
                } ${
                  templateStyle === "royal_gold" 
                    ? "bg-[#fffdf7] dark:bg-card border-4 border-double border-amber-500/50 text-foreground" 
                    : templateStyle === "modern" 
                    ? "bg-gradient-to-b from-card to-emerald-500/5 border-2 border-emerald-500/40 text-foreground" 
                    : templateStyle === "classic"
                    ? "bg-[#faf8f5] dark:bg-card border-4 border-dashed border-amber-700/40 text-foreground"
                    : "bg-background border-4 border-double border-slate-700/30 text-foreground"
                } rounded-3xl`}
                dir="rtl"
              >
                
                {/* Background Watermark if sealType is watermark */}
                {showOfficialSeal && sealType === "watermark" && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5">
                    <ShieldCheck className="w-72 h-72 text-primary" />
                  </div>
                )}

                {/* Certificate Top Header */}
                <div className={`text-center pb-3 space-y-1 ${
                  templateStyle === "royal_gold" ? "border-b-2 border-amber-500/40" : "border-b-2 border-border/60"
                }`}>
                  <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground mb-1">
                    <span>{showMinistryLogo ? "المملكة العربية السعودية • وزارة التعليم" : ""}</span>
                    <span>{customDirectorate}</span>
                    <span>{showVision2030Logo ? "رؤية المملكة 2030" : ""}</span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-foreground">
                    {customSchoolName}
                  </h1>

                  <div className="inline-block pt-1">
                    <span className={`text-sm sm:text-base font-black px-4 py-1 rounded-xl ${
                      templateStyle === "royal_gold" 
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30" 
                        : templateStyle === "modern" 
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30" 
                        : "bg-primary/10 text-primary border border-primary/25"
                    }`}>
                      {customCertTitle || (
                        templateStyle === "royal_gold" 
                          ? "🏆 شهادة تفوق وتقدير وتميز أكاديمي" 
                          : "إشعار رسمي بنتيجة اختبار دراسي"
                      )}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-muted-foreground mt-1">
                    {selectedExam?.name} - {selectedExam?.term} • العام الدراسي {currentAcademicYearId || "1446-1447هـ"}
                  </p>
                </div>

                {/* Student Info Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-muted/20 p-3 rounded-2xl border border-border/50 text-xs font-bold">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">اسم الطالب:</span>
                    <strong className="text-sm font-black text-foreground">{currentPreviewStudent.student.name}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">الرقم الأكاديمي:</span>
                    <strong className="text-xs font-black font-mono tabular-nums text-foreground">{currentPreviewStudent.student.nationalId}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">الصف والمرحلة:</span>
                    <strong className="text-xs font-black text-foreground">{selectedGrade}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">الشعبة الدراسية:</span>
                    <strong className="text-xs font-black text-foreground">شعبة {currentPreviewStudent.sectionName}</strong>
                  </div>
                </div>

                {/* Subject Marks Table (STRICT RULE: NO individual subject descriptive ratings!) */}
                <div className="rounded-2xl border border-border/60 overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-muted/60 text-muted-foreground font-black border-b border-border/60">
                      <tr>
                        <th className="p-2 font-black">المادة الدراسية</th>
                        {showMaxPassScore && (
                          <>
                            <th className="p-2 text-center font-black w-14">العظمى</th>
                            <th className="p-2 text-center font-black w-14">النجاح</th>
                          </>
                        )}
                        <th className="p-2 text-center font-black w-18 text-primary">درجة الطالب</th>
                        {showSubjectPercentage && (
                          <th className="p-2 text-center font-black w-16">النسبة %</th>
                        )}
                        {showSubjectStatus && (
                          <th className="p-2 text-center font-black w-18">الحالة</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-bold">
                      {currentPreviewStudent.subjectMarks.map((m, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-background" : "bg-muted/10"}>
                          <td className="p-2 font-black text-foreground">{m.subjectName}</td>
                          {showMaxPassScore && (
                            <>
                              <td className="p-2 text-center tabular-nums text-muted-foreground">{m.maxScore}</td>
                              <td className="p-2 text-center tabular-nums text-muted-foreground">{m.passScore}</td>
                            </>
                          )}
                          <td className="p-2 text-center font-black text-primary text-sm tabular-nums">{m.mark}</td>
                          {showSubjectPercentage && (
                            <td className="p-2 text-center font-bold tabular-nums" dir="ltr">{m.pct.toFixed(0)}%</td>
                          )}
                          {showSubjectStatus && (
                            <td className="p-2 text-center font-bold">
                              <span className={m.isPassed ? "text-emerald-600 font-black" : "text-rose-600 font-black"}>
                                {m.isPassed ? "ناجح" : "له دور ثانٍ"}
                              </span>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Overall Score Standings & Cumulative Rating */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-primary/5 border border-primary/20 text-center text-xs font-bold">
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-0.5">المجموع الكلي</span>
                    <strong className="text-base font-black text-primary tabular-nums">
                      {currentPreviewStudent.totalMarks} <span className="text-xs text-muted-foreground font-normal">/ {currentPreviewStudent.totalMaxMarks}</span>
                    </strong>
                  </div>
                  {showPercentage && (
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-0.5">النسبة المئوية العامة</span>
                      <strong className="text-base font-black text-foreground tabular-nums" dir="ltr">
                        {currentPreviewStudent.overallPercentage.toFixed(1)}%
                      </strong>
                    </div>
                  )}
                  {showGeneralRating && (
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-0.5">التقدير العام المعتمد</span>
                      <strong className="text-xs sm:text-sm font-black text-emerald-600 block">
                        {currentPreviewStudent.overallRating}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Rank & Promotion Decision */}
                <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-muted/20 border border-border/40 font-bold">
                  {showRank && (
                    <span>
                      الترتيب على الصف: المركز <b className="text-primary font-black">#{currentPreviewStudent.rank}</b> (من {currentPreviewStudent.totalInGrade} طالباً)
                    </span>
                  )}
                  {showDecision && (
                    <span>
                      القرار الأكاديمي: <b className={currentPreviewStudent.isPassed ? "text-emerald-600 font-black" : "text-rose-600 font-black"}>
                        {currentPreviewStudent.isPassed ? "ناجح ومؤهل للانتقال للصف التالي" : "له دور ثانٍ"}
                      </b>
                    </span>
                  )}
                </div>

                {/* Custom Congratulatory Message */}
                {showCustomNote && customCongratulatoryNote && (
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center text-xs font-bold text-amber-800 dark:text-amber-300">
                    {customCongratulatoryNote}
                  </div>
                )}

                {/* Signatures, Official Seal & QR Code */}
                <div className="flex items-end justify-between pt-3 border-t border-border/50 text-[10px] font-black">
                  {showQrCode && (
                    <div className="text-right">
                      <QRCode 
                        value={`Darasi-Sahel|Student:${currentPreviewStudent.student.name}|Exam:${selectedExam?.name}|Total:${currentPreviewStudent.totalMarks}|Rank:${currentPreviewStudent.rank}`} 
                        size={48} 
                      />
                      <span className="text-[8px] text-muted-foreground block mt-0.5">تحقق رقمي معتمد</span>
                    </div>
                  )}

                  {/* Official Seal Emblem */}
                  {showOfficialSeal && sealType !== "watermark" && (
                    <div className="text-center px-4">
                      <div className={`w-14 h-14 rounded-full border-2 border-dashed flex flex-col items-center justify-center ${
                        sealType === "gold" ? "border-amber-500 bg-amber-500/10 text-amber-700" : "border-blue-600 bg-blue-500/10 text-blue-700"
                      }`}>
                        <ShieldCheck className="w-5 h-5 mb-0.5" />
                        <span className="text-[8px] font-black">الختم الرسمي</span>
                      </div>
                    </div>
                  )}

                  {showSignatures && (
                    <div className="flex-1 grid grid-cols-3 gap-2 text-center mr-4">
                      <div>
                        <p className="text-muted-foreground mb-3">{customGuidanceName ? `المرشد: ${customGuidanceName}` : "المرشد الطلابي"}</p>
                        <p className="border-t border-dashed border-foreground/30 pt-0.5">التوقيع</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-3">{customControllerName ? `الكنترول: ${customControllerName}` : "وكيل الكنترول"}</p>
                        <p className="border-t border-dashed border-foreground/30 pt-0.5">المراجعة والاعتماد</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-3">{customPrincipalName ? `المدير: ${customPrincipalName}` : "مدير المدرسة والختم"}</p>
                        <p className="border-t border-dashed border-foreground/30 pt-0.5">الاعتماد الرسمي</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-muted-foreground font-bold text-xs">
              يرجى تحديد طالب واحد على الأقل للمعاينة والطباعة.
            </div>
          )}

        </div>

      </div>

      {/* Academic Career Modal */}
      {isCareerModalOpen && selectedStudentForCareer && (
        <AcademicCareerModal
          isOpen={isCareerModalOpen}
          onClose={() => {
            setIsCareerModalOpen(false);
            setSelectedStudentForCareer("");
          }}
          studentId={selectedStudentForCareer}
        />
      )}

      {/* Batch Certificates Modal */}
      {isBatchCertificatesOpen && (
        <BatchCertificatesModal
          isOpen={isBatchCertificatesOpen}
          onClose={() => setIsBatchCertificatesOpen(false)}
          examId={selectedExamId}
          grade={selectedGrade}
          sectionId="all"
          preSelectedStudentIds={Array.from(selectedStudentIds)}
        />
      )}

      {/* Hidden Printable Container for Silent Consecutive Native A4 Printing */}
      <div id="printable-sequential-certificates-tab-container" className="hidden">
        {pageOrientation === "compact_2up" ? (
          /* 2-Up Sheet Layout: 2 students per A4 sheet with dashed scissors cut-line */
          compact2UpPairs.map((pair, pIdx) => (
            <div key={pIdx} className="cert-2up-sheet">
              {pair.map((stData, sIdx) => {
                if (!stData) return null;
                return (
                  <div key={stData.student.id} className="cert-2up-card">
                    {/* Header */}
                    <div style={{ textAlign: "center", borderBottom: "1.5px solid #0f172a", paddingBottom: "4px", marginBottom: "6px" }}>
                      <p style={{ margin: 0, fontSize: "8pt", color: "#475569", fontWeight: 700 }}>
                        {customSchoolName} • {selectedExam?.name} ({currentAcademicYearId || "1446-1447هـ"})
                      </p>
                      <h2 style={{ margin: "2px 0", fontSize: "11pt", fontWeight: 900, color: "#0f172a" }}>
                        {customCertTitle || "إشعار رسمي بنتيجة اختبار دراسي"}
                      </h2>
                    </div>

                    {/* Metadata */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8.5pt", fontWeight: 800, marginBottom: "6px", backgroundColor: "#f8fafc", padding: "4px 8px", borderRadius: "6px" }}>
                      <span>اسم الطالب: <b>{stData.student.name}</b></span>
                      <span>الرقم: <b>{stData.student.nationalId}</b></span>
                      <span>الصف: <b>{selectedGrade}</b> (شعبة {stData.sectionName})</span>
                    </div>

                    {/* Compact Table */}
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8pt", marginBottom: "6px" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f1f5f9" }}>
                          <th style={{ border: "1px solid #94a3b8", padding: "3px 4px", textAlign: "right" }}>المادة الدراسية</th>
                          {showMaxPassScore && <th style={{ border: "1px solid #94a3b8", padding: "3px 4px", textAlign: "center", width: "40px" }}>العظمى</th>}
                          <th style={{ border: "1px solid #94a3b8", padding: "3px 4px", textAlign: "center", width: "50px" }}>الدرجة</th>
                          {showSubjectPercentage && <th style={{ border: "1px solid #94a3b8", padding: "3px 4px", textAlign: "center", width: "45px" }}>النسبة %</th>}
                          {showSubjectStatus && <th style={{ border: "1px solid #94a3b8", padding: "3px 4px", textAlign: "center", width: "50px" }}>الحالة</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {stData.subjectMarks.map((m: any, mIdx: number) => (
                          <tr key={mIdx}>
                            <td style={{ border: "1px solid #94a3b8", padding: "3px 4px", fontWeight: 800 }}>{m.subjectName}</td>
                            {showMaxPassScore && <td style={{ border: "1px solid #94a3b8", padding: "3px 4px", textAlign: "center" }}>{m.maxScore}</td>}
                            <td style={{ border: "1px solid #94a3b8", padding: "3px 4px", textAlign: "center", fontWeight: 900 }}>{m.mark}</td>
                            {showSubjectPercentage && <td style={{ border: "1px solid #94a3b8", padding: "3px 4px", textAlign: "center" }} dir="ltr">{m.pct.toFixed(0)}%</td>}
                            {showSubjectStatus && (
                              <td style={{ border: "1px solid #94a3b8", padding: "3px 4px", textAlign: "center", fontWeight: 800, color: m.isPassed ? "#16a34a" : "#dc2626" }}>
                                {m.isPassed ? "ناجح" : "دور ثانٍ"}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Summary Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "8.5pt", fontWeight: 800, borderTop: "1px solid #cbd5e1", paddingTop: "4px" }}>
                      <span>المجموع: <b>{stData.totalMarks} / {stData.totalMaxMarks}</b></span>
                      {showPercentage && <span>النسبة: <b dir="ltr">{stData.overallPercentage.toFixed(1)}%</b></span>}
                      {showGeneralRating && <span>التقدير: <b style={{ color: "#16a34a" }}>{stData.overallRating}</b></span>}
                      {showRank && <span>الترتيب: <b>#{stData.rank}</b></span>}
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "7.5pt", color: "#64748b", marginTop: "4px" }}>
                      <span>المدير: {customPrincipalName}</span>
                      <span>الكنترول: {customControllerName}</span>
                      <span>الختم والاعتماد الرسمي</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          /* Full A4 Portrait / Landscape Layout: 1 student per A4 page */
          studentsToPrint.map((stData) => (
            <div key={stData.student.id} className="cert-page">
              
              {/* Header */}
              <div style={{ textAlign: "center", borderBottom: templateStyle === "royal_gold" ? "3px double #d97706" : "2px solid #0f172a", paddingBottom: "10px", marginBottom: "14px" }}>
                <p style={{ margin: 0, fontSize: "10pt", color: "#475569", fontWeight: 700 }}>
                  {showMinistryLogo ? "المملكة العربية السعودية • وزارة التعليم • " : ""}{customDirectorate}
                </p>
                <h1 style={{ margin: "4px 0", fontSize: "20pt", fontWeight: 900, color: "#0f172a" }}>
                  {customSchoolName}
                </h1>
                <div style={{ display: "inline-block", backgroundColor: templateStyle === "royal_gold" ? "#fef3c7" : "#f1f5f9", border: templateStyle === "royal_gold" ? "1px solid #d97706" : "1px solid #cbd5e1", borderRadius: "8px", padding: "4px 16px", margin: "4px 0" }}>
                  <h2 style={{ margin: 0, fontSize: "13pt", fontWeight: 900, color: templateStyle === "royal_gold" ? "#92400e" : "#0f172a" }}>
                    {customCertTitle || (templateStyle === "royal_gold" ? "🏆 شهادة تفوق وتقدير وتميز أكاديمي" : "شهادة إشعار رسمي بنتيجة اختبار دراسي")}
                  </h2>
                </div>
                <p style={{ margin: "2px 0 0", fontSize: "9.5pt", color: "#64748b", fontWeight: 700 }}>
                  {selectedExam?.name} - {selectedExam?.term} • العام الدراسي: {currentAcademicYearId || "1446-1447هـ"}
                </p>
              </div>

              {/* Student Metadata Card */}
              <table style={{ marginBottom: "14px" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "25%", backgroundColor: "#f8fafc", fontWeight: 800 }}>اسم الطالب:</td>
                    <td style={{ width: "25%", fontWeight: 900, fontSize: "11pt" }}>{stData.student.name}</td>
                    <td style={{ width: "25%", backgroundColor: "#f8fafc", fontWeight: 800 }}>الرقم الأكاديمي:</td>
                    <td style={{ width: "25%", fontWeight: 900, fontFamily: "monospace" }}>{stData.student.nationalId}</td>
                  </tr>
                  <tr>
                    <td style={{ backgroundColor: "#f8fafc", fontWeight: 800 }}>الصف والمرحلة:</td>
                    <td style={{ fontWeight: 800 }}>{selectedGrade}</td>
                    <td style={{ backgroundColor: "#f8fafc", fontWeight: 800 }}>الشعبة الدراسية:</td>
                    <td style={{ fontWeight: 800 }}>شعبة {stData.sectionName}</td>
                  </tr>
                </tbody>
              </table>

              {/* Subject Marks Table (STRICT RULE: Zero descriptive ratings on individual subjects!) */}
              <table style={{ marginBottom: "14px" }}>
                <thead>
                  <tr>
                    <th style={{ width: "6%", textAlign: "center" }}>#</th>
                    <th style={{ width: "38%" }}>المادة الدراسية</th>
                    {showMaxPassScore && (
                      <>
                        <th style={{ width: "12%", textAlign: "center" }}>العظمى</th>
                        <th style={{ width: "12%", textAlign: "center" }}>النجاح</th>
                      </>
                    )}
                    <th style={{ width: "14%", textAlign: "center" }}>درجة الطالب</th>
                    {showSubjectPercentage && (
                      <th style={{ width: "12%", textAlign: "center" }}>النسبة %</th>
                    )}
                    {showSubjectStatus && (
                      <th style={{ width: "14%", textAlign: "center" }}>النتيجة</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {stData.subjectMarks.map((m: any, mIdx: number) => (
                    <tr key={mIdx}>
                      <td style={{ textAlign: "center" }}>{mIdx + 1}</td>
                      <td style={{ fontWeight: 800 }}>{m.subjectName}</td>
                      {showMaxPassScore && (
                        <>
                          <td style={{ textAlign: "center" }}>{m.maxScore}</td>
                          <td style={{ textAlign: "center" }}>{m.passScore}</td>
                        </>
                      )}
                      <td style={{ textAlign: "center", fontWeight: 900, fontSize: "11pt", color: "#0f172a" }}>{m.mark}</td>
                      {showSubjectPercentage && (
                        <td style={{ textAlign: "center", fontWeight: 800 }} dir="ltr">{m.pct.toFixed(0)}%</td>
                      )}
                      {showSubjectStatus && (
                        <td style={{ textAlign: "center", fontWeight: 800, color: m.isPassed ? "#16a34a" : "#dc2626" }}>
                          {m.isPassed ? "ناجح" : "له دور ثانٍ"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Standings */}
              <table style={{ marginBottom: "14px" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "33.3%", textAlign: "center", backgroundColor: "#f8fafc" }}>
                      <span style={{ fontSize: "9pt", color: "#64748b", display: "block" }}>المجموع الكلي المحرز</span>
                      <strong style={{ fontSize: "13pt", color: "#0f172a" }}>{stData.totalMarks} / {stData.totalMaxMarks}</strong>
                    </td>
                    {showPercentage && (
                      <td style={{ width: "33.3%", textAlign: "center", backgroundColor: "#f8fafc" }}>
                        <span style={{ fontSize: "9pt", color: "#64748b", display: "block" }}>النسبة المئوية العامة</span>
                        <strong style={{ fontSize: "13pt", color: "#0f172a" }} dir="ltr">{stData.overallPercentage.toFixed(1)}%</strong>
                      </td>
                    )}
                    {showGeneralRating && (
                      <td style={{ width: "33.3%", textAlign: "center", backgroundColor: "#f8fafc" }}>
                        <span style={{ fontSize: "9pt", color: "#64748b", display: "block" }}>التقدير العام المعتمد</span>
                        <strong style={{ fontSize: "12pt", color: "#16a34a" }}>{stData.overallRating}</strong>
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>

              {/* Rank & Promotion Decision */}
              <div style={{ display: "flex", justifyContent: "space-between", border: "1px solid #cbd5e1", padding: "8px 12px", borderRadius: "6px", fontSize: "10pt", fontWeight: 800, marginBottom: "16px" }}>
                {showRank && (
                  <span>الترتيب على الصف: المركز {stData.rank} (من {stData.totalInGrade} طالباً)</span>
                )}
                {showDecision && (
                  <span>القرار الأكاديمي: {stData.isPassed ? "ناجح ومؤهل للانتقال للصف التالي" : "له دور ثانٍ"}</span>
                )}
              </div>

              {/* Custom Note */}
              {showCustomNote && customCongratulatoryNote && (
                <div style={{ padding: "8px", border: "1px solid #fde68a", backgroundColor: "#fef3c7", borderRadius: "6px", textAlign: "center", fontSize: "9pt", fontWeight: 800, color: "#92400e", marginBottom: "16px" }}>
                  {customCongratulatoryNote}
                </div>
              )}

              {/* Signatures & Seal */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto", paddingTop: "12px", borderTop: "2px solid #cbd5e1" }}>
                {showQrCode && (
                  <div style={{ width: "70px", textAlign: "center" }}>
                    <QRCode value={`Darasi-Sahel|Student:${stData.student.name}|Exam:${selectedExam?.name}|Total:${stData.totalMarks}|Rank:${stData.rank}`} size={55} />
                    <p style={{ margin: "4px 0 0", fontSize: "7pt", color: "#64748b" }}>تحقق رقمي معتمد</p>
                  </div>
                )}

                {showOfficialSeal && sealType !== "watermark" && (
                  <div style={{ width: "90px", textAlign: "center" }}>
                    <div style={{ width: "65px", height: "65px", margin: "0 auto", borderRadius: "50%", border: sealType === "gold" ? "2px dashed #d97706" : "2px dashed #2563eb", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: sealType === "gold" ? "#d97706" : "#2563eb", fontSize: "8pt", fontWeight: 900 }}>
                      <span>ختم معتمد</span>
                      <span style={{ fontSize: "7pt" }}>المدرسة</span>
                    </div>
                  </div>
                )}

                {showSignatures && (
                  <div style={{ flex: 1, display: "flex", justifyContent: "space-around", textAlign: "center", fontSize: "9.5pt", fontWeight: 800 }}>
                    <div style={{ width: "28%" }}>
                      <p style={{ color: "#64748b", marginBottom: "35px" }}>{customGuidanceName ? `المرشد: ${customGuidanceName}` : "المرشد الطلابي"}</p>
                      <p style={{ borderTop: "1px dashed #94a3b8", paddingTop: "4px" }}>التوقيع: .....................</p>
                    </div>
                    <div style={{ width: "28%" }}>
                      <p style={{ color: "#64748b", marginBottom: "35px" }}>{customControllerName ? `الكنترول: ${customControllerName}` : "وكيل الكنترول والاختبارات"}</p>
                      <p style={{ borderTop: "1px dashed #94a3b8", paddingTop: "4px" }}>الاعتماد: .....................</p>
                    </div>
                    <div style={{ width: "28%" }}>
                      <p style={{ color: "#64748b", marginBottom: "35px" }}>{customPrincipalName ? `المدير: ${customPrincipalName}` : "مدير المدرسة والختم الرسمي"}</p>
                      <p style={{ borderTop: "1px dashed #94a3b8", paddingTop: "4px" }}>الختم والتوقيع</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}

// ==========================================
// 3. Analytics & Honor Roll Tab (لوحة تحليلات الأداء ولوحة الشرف المطورة)
// ==========================================
function AnalyticsTab() {
  const { stage } = useStage();
  const { 
    activeStageStudents, 
    activeStageExams, 
    activeStageExamSubjects, 
    activeStageSubjects, 
    allExamResults, 
    allStudentEnrollments, 
    activeStageSections,
    currentAcademicYearId 
  } = useGlobalStore();

  const [selectedExamId, setSelectedExamId] = useState<string>(activeStageExams[0]?.id || "");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [topCount, setTopCount] = useState<number>(5); // 3, 5, 10, 20, 0 (all 90%+)
  const [activeInterventionFilter, setActiveInterventionFilter] = useState<string>("all");
  const [subjectSortMode, setSubjectSortMode] = useState<"passRateDesc" | "passRateAsc" | "avgDesc">("passRateDesc");

  // Modals state
  const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
  const [selectedStudentForCareer, setSelectedStudentForCareer] = useState<string>("");
  const [isBatchCertificatesOpen, setIsBatchCertificatesOpen] = useState(false);
  const [preSelectedHonorStudentIds, setPreSelectedHonorStudentIds] = useState<string[]>([]);

  const stageGrades = useMemo(() => getGradesForStage(stage), [stage]);

  const selectedExam = useMemo(() => {
    return activeStageExams.find(e => e.id === selectedExamId) || activeStageExams[0];
  }, [activeStageExams, selectedExamId]);

  // Sections for selected grade
  const sectionsForGrade = useMemo(() => {
    if (!selectedGrade) return activeStageSections.filter(s => s.stage === stage);
    return activeStageSections.filter(s => normalizeGrade(s.grade) === normalizeGrade(selectedGrade) && s.stage === stage);
  }, [activeStageSections, selectedGrade, stage]);

  // Applicable Exam Subjects in active scope
  const scopedExamSubjects = useMemo(() => {
    if (!selectedExam) return [];
    return activeStageExamSubjects.filter(es => 
      es.examId === selectedExam.id &&
      (!selectedGrade || normalizeGrade(es.grade) === normalizeGrade(selectedGrade)) &&
      (selectedSubjectId === "all" || es.subjectId === selectedSubjectId)
    );
  }, [activeStageExamSubjects, selectedExam, selectedGrade, selectedSubjectId]);

  // Results Map for O(1) instantaneous lookup
  const resultsMap = useMemo(() => {
    const map = new Map<string, any>();
    allExamResults.forEach(r => {
      if (r.studentEnrollmentId) {
        map.set(`${r.examSubjectId}_${r.studentEnrollmentId}`, r);
      }
    });
    return map;
  }, [allExamResults]);

  // Evaluated Students Performance computation
  const evaluatedStudents = useMemo(() => {
    if (!selectedExam) return [];

    const list = activeStageStudents.filter(s => {
      if (selectedGrade && normalizeGrade(s.grade) !== normalizeGrade(selectedGrade)) return false;
      if (selectedSectionId && s.sectionId !== selectedSectionId) return false;
      return true;
    }).map(student => {
      const enrollment = allStudentEnrollments.find(e => e.studentId === student.id && e.academicYearId === currentAcademicYearId) || {
        id: `ENR-${student.id}`,
        studentId: student.id,
        sectionId: student.sectionId || "",
        academicYearId: currentAcademicYearId,
        stage: stage,
        status: "enrolled"
      };

      const examSubjects = activeStageExamSubjects.filter(es => 
        es.examId === selectedExam.id && 
        (normalizeGrade(es.grade) === normalizeGrade(student.grade) || (selectedGrade && normalizeGrade(es.grade) === normalizeGrade(selectedGrade))) &&
        (selectedSubjectId === "all" || es.subjectId === selectedSubjectId)
      );

      if (examSubjects.length === 0) return null;

      let total = 0;
      let maxTotal = 0;
      let failedSubjectsCount = 0;
      const failedSubjectsList: { id: string; name: string; mark: number; passScore: number; maxScore: number }[] = [];

      examSubjects.forEach(es => {
        maxTotal += es.maxScore;
        const enrollmentId = enrollment.id;
        const res = resultsMap.get(`${es.id}_${enrollmentId}`) ||
                    resultsMap.get(`${es.id}_${student.id}`) ||
                    ((student as any).studentId ? resultsMap.get(`${es.id}_${(student as any).studentId}`) : null) ||
                    allExamResults.find(r => r.examSubjectId === es.id && (
                      r.studentEnrollmentId === enrollmentId || 
                      r.studentEnrollmentId === student.id || 
                      ((student as any).studentId && r.studentEnrollmentId === (student as any).studentId)
                    ));
        const mark = res?.mark ?? 0;
        total += mark;
        if (mark < es.passScore) {
          failedSubjectsCount++;
          const subName = activeStageSubjects.find(s => s.id === es.subjectId)?.name || es.subjectId;
          failedSubjectsList.push({ id: es.subjectId, name: subName, mark, passScore: es.passScore, maxScore: es.maxScore });
        }
      });

      const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
      let rating = "مقبول";
      if (percentage >= 90) rating = "ممتاز";
      else if (percentage >= 80) rating = "جيد جداً";
      else if (percentage >= 65) rating = "جيد";
      else if (percentage >= 50) rating = "مقبول";
      else rating = "راسب";

      const sectionObj = activeStageSections.find(s => s.id === (enrollment.sectionId || student.sectionId));

      return {
        student,
        enrollment,
        sectionId: enrollment.sectionId || student.sectionId,
        sectionName: sectionObj?.name || "1",
        total,
        maxTotal,
        percentage,
        rating,
        failedSubjectsCount,
        failedSubjectsList,
        isPassed: percentage >= 50 && failedSubjectsCount === 0
      };
    }).filter(Boolean) as any[];

    // Sort descending by total percentage
    const sorted = [...list].sort((a, b) => b.percentage - a.percentage);
    return sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));
  }, [activeStageStudents, selectedGrade, selectedSectionId, selectedSubjectId, selectedExam, allStudentEnrollments, currentAcademicYearId, activeStageExamSubjects, resultsMap, allExamResults, activeStageSubjects, activeStageSections]);

  // KPIs
  const totalStudents = evaluatedStudents.length;
  const passedStudents = evaluatedStudents.filter(s => s.isPassed).length;
  const passRate = totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0;
  const avgPercentage = totalStudents > 0 ? (evaluatedStudents.reduce((a, b) => a + b.percentage, 0) / totalStudents) : 0;
  const honorsStudentsCount = evaluatedStudents.filter(s => s.percentage >= 90).length;

  // Rating breakdown
  const ratingCounts = useMemo(() => {
    const counts = { excellent: 0, veryGood: 0, good: 0, pass: 0, fail: 0 };
    evaluatedStudents.forEach(s => {
      if (s.rating === "ممتاز") counts.excellent++;
      else if (s.rating === "جيد جداً") counts.veryGood++;
      else if (s.rating === "جيد") counts.good++;
      else if (s.rating === "مقبول") counts.pass++;
      else counts.fail++;
    });
    return counts;
  }, [evaluatedStudents]);

  // Honor Roll List (Ranked)
  const honorRoll = useMemo(() => {
    let list = evaluatedStudents.filter(s => s.percentage >= 50);
    if (topCount === 0) {
      list = list.filter(s => s.percentage >= 90);
    } else {
      list = list.slice(0, topCount);
    }
    return list;
  }, [evaluatedStudents, topCount]);

  // Top 3 for 3D Podium
  const top1 = honorRoll[0] || null;
  const top2 = honorRoll[1] || null;
  const top3 = honorRoll[2] || null;
  const restHonorRoll = honorRoll.slice(3);

  // Section Benchmark Comparison
  const sectionBenchmarks = useMemo(() => {
    const sections = sectionsForGrade.length > 0 ? sectionsForGrade : activeStageSections.filter(s => s.stage === stage);
    return sections.map(sec => {
      const secStudents = evaluatedStudents.filter(s => s.sectionId === sec.id);
      const total = secStudents.length;
      const passed = secStudents.filter(s => s.isPassed).length;
      const avg = total > 0 ? secStudents.reduce((acc, s) => acc + s.percentage, 0) / total : 0;
      const honors = secStudents.filter(s => s.percentage >= 90).length;
      const atRisk = secStudents.filter(s => !s.isPassed).length;

      return {
        section: sec,
        total,
        passed,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
        avgPercentage: avg,
        honorsCount: honors,
        atRiskCount: atRisk
      };
    }).filter(b => b.total > 0).sort((a, b) => b.avgPercentage - a.avgPercentage);
  }, [sectionsForGrade, activeStageSections, stage, evaluatedStudents]);

  // Subject Performance Analysis with sorting options
  const subjectBenchmarks = useMemo(() => {
    const list = scopedExamSubjects.map(es => {
      const subject = activeStageSubjects.find(s => s.id === es.subjectId);
      const marksList = evaluatedStudents.map(st => {
        const enrollmentId = st.enrollment.id;
        const r = resultsMap.get(`${es.id}_${enrollmentId}`) || allExamResults.find(x => x.examSubjectId === es.id && (x.studentEnrollmentId === enrollmentId || x.studentEnrollmentId === st.student.id));
        return r?.mark ?? 0;
      });

      const totalCount = marksList.length;
      const passedCount = marksList.filter(m => m >= es.passScore).length;
      const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
      const avg = totalCount > 0 ? marksList.reduce((a, b) => a + b, 0) / totalCount : 0;
      const avgPct = es.maxScore > 0 ? (avg / es.maxScore) * 100 : 0;
      const maxMark = marksList.length > 0 ? Math.max(...marksList) : 0;
      const minMark = marksList.length > 0 ? Math.min(...marksList) : 0;

      return {
        examSubject: es,
        subjectName: subject?.name || es.subjectId,
        passScore: es.passScore,
        maxScore: es.maxScore,
        passRate,
        avgMark: avg,
        avgPct,
        maxMark,
        minMark,
        totalCount
      };
    });

    return list.sort((a, b) => {
      if (subjectSortMode === "passRateDesc") return b.passRate - a.passRate;
      if (subjectSortMode === "passRateAsc") return a.passRate - b.passRate;
      return b.avgPct - a.avgPct;
    });
  }, [scopedExamSubjects, activeStageSubjects, evaluatedStudents, resultsMap, allExamResults, subjectSortMode]);

  // At-Risk Students
  const atRiskStudents = useMemo(() => {
    let list = evaluatedStudents.filter(s => !s.isPassed || s.failedSubjectsCount > 0);
    if (activeInterventionFilter !== "all") {
      list = list.filter(s => s.failedSubjectsList.some((sub: any) => sub.id === activeInterventionFilter));
    }
    return list;
  }, [evaluatedStudents, activeInterventionFilter]);

  // Export Honor Roll to CSV with Arabic UTF-8 BOM
  const exportHonorRollToCSV = () => {
    if (honorRoll.length === 0) {
      toast.error("لا توجد بيانات في لوحة الشرف للتصدير");
      return;
    }
    const headers = ["الترتيب", "اسم الطالب", "الرقم الأكاديمي", "الصف", "الشعبة", "المجموع الكلي", "الدرجة الكبرى", "النسبة المئوية", "التقدير"];
    const rows = honorRoll.map(h => [
      h.rank,
      `"${h.student.name}"`,
      `"${h.student.nationalId}"`,
      `"${h.student.grade}"`,
      `"شعبة ${h.sectionName}"`,
      h.total,
      h.maxTotal,
      `"${h.percentage.toFixed(1)}%"`,
      `"${h.rating}"`
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `لوحة_الشرف_${selectedExam?.name || "الاختبار"}_${selectedGrade || "المرحلة"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير لوحة الشرف بنجاح إلى ملف Excel / CSV");
  };

  // Export At-Risk to CSV
  const exportAtRiskToCSV = () => {
    if (atRiskStudents.length === 0) {
      toast.error("لا يوجد طلاب متعثرين للتصدير");
      return;
    }
    const headers = ["#", "اسم الطالب", "الرقم الأكاديمي", "الصف", "الشعبة", "المعدل %", "المواد المتعثر فيها"];
    const rows = atRiskStudents.map((s, idx) => [
      idx + 1,
      `"${s.student.name}"`,
      `"${s.student.nationalId}"`,
      `"${s.student.grade}"`,
      `"شعبة ${s.sectionName}"`,
      `"${s.percentage.toFixed(1)}%"`,
      `"${s.failedSubjectsList.map((f: any) => `${f.name} (${f.mark}/${f.passScore})`).join(" - ")}"`
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `قائمة_المتعثرين_${selectedExam?.name || "الاختبار"}_${selectedGrade || "المرحلة"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير قائمة المتابعة بنجاح إلى Excel / CSV");
  };

  // Quick Action: Print Individual Honor Certificate
  const handlePrintHonorStudentCert = (studentId: string) => {
    setPreSelectedHonorStudentIds([studentId]);
    setIsBatchCertificatesOpen(true);
  };

  // Quick Action: Print All Honor Roll Certificates
  const handlePrintAllHonorsCerts = () => {
    setPreSelectedHonorStudentIds(honorRoll.map(h => h.student.id));
    setIsBatchCertificatesOpen(true);
  };

  // Print Official Wall of Fame Poster
  const printWallOfFameIframe = () => {
    printContainerViaIframe("printable-wall-of-fame", `لوحة_الشرف_للأوائل_والمتفوقين_${selectedExam?.name || ""}`);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Control & Filter Center */}
      <PageCard title="لوحة تحليلات الأداء ولوحة الشرف الأكاديمي" description="تحكم مرن وفائق الدقة في عرض الأوائل والمقارنات الأكاديمية بين الفصول والشعب والمقررات">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
            {/* Exam */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground">فترة الاختبار</label>
              <select 
                value={selectedExamId} 
                onChange={e => setSelectedExamId(e.target.value)} 
                className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 font-bold text-xs shadow-xs focus:border-primary cursor-pointer outline-none"
              >
                {activeStageExams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.term})</option>)}
              </select>
            </div>

            {/* Grade */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground">الصف الدراسي</label>
              <select 
                value={selectedGrade} 
                onChange={e => { setSelectedGrade(e.target.value); setSelectedSectionId(""); }} 
                className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 font-bold text-xs shadow-xs focus:border-primary cursor-pointer outline-none"
              >
                <option value="">جميع صفوف المرحلة</option>
                {stageGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground">الشعبة الدراسية</label>
              <select 
                value={selectedSectionId} 
                onChange={e => setSelectedSectionId(e.target.value)} 
                className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 font-bold text-xs shadow-xs focus:border-primary cursor-pointer outline-none"
              >
                <option value="">جميع الشعب</option>
                {sectionsForGrade.map(s => <option key={s.id} value={s.id}>شعبة {s.name}</option>)}
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground">المادة / المجموع العام</label>
              <select 
                value={selectedSubjectId} 
                onChange={e => setSelectedSubjectId(e.target.value)} 
                className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 font-bold text-xs shadow-xs focus:border-primary cursor-pointer outline-none"
              >
                <option value="all">المجموع العام لجميع المواد</option>
                {activeStageSubjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
              </select>
            </div>

            {/* Honor Roll Size */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground">حجم لوحة الشرف</label>
              <select 
                value={topCount} 
                onChange={e => setTopCount(Number(e.target.value))} 
                className="w-full h-10 rounded-xl border border-border/60 bg-background px-3 font-bold text-xs shadow-xs focus:border-primary cursor-pointer outline-none"
              >
                <option value={3}>أفضل 3 طلاب 🥇🥈🥉</option>
                <option value={5}>أفضل 5 طلاب</option>
                <option value={10}>أفضل 10 طلاب</option>
                <option value={20}>أفضل 20 طالباً</option>
                <option value={0}>جميع الحاصلين على ممتاز (90%+)</option>
              </select>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <span>إجمالي الطلاب المشمولين في التحليل: <b className="text-foreground tabular-nums">{totalStudents}</b></span>
              <span>•</span>
              <span className="text-amber-600 font-black">أوائل لوحة الشرف: {honorRoll.length} طالب</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handlePrintAllHonorsCerts}
                disabled={honorRoll.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Award className="w-4 h-4" />
                <span>طباعة شهادات التفوق والتقدير للأوائل المحددين ({honorRoll.length}) 🏆</span>
              </button>

              <button
                type="button"
                onClick={exportHonorRollToCSV}
                disabled={honorRoll.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/60 bg-card hover:bg-muted text-foreground font-black text-xs transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>تصدير لوحة الشرف إلى Excel 📊</span>
              </button>

              <button
                type="button"
                onClick={printWallOfFameIframe}
                disabled={honorRoll.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Trophy className="w-4 h-4" />
                <span>طباعة بوستر لوحة الشرف الجدارية (Wall of Fame) 🖨️</span>
              </button>
            </div>
          </div>
        </div>
      </PageCard>

      {/* 2. Top Metric KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground font-bold mb-1">الطلاب المشمولون</p>
          <p className="text-2xl font-black text-foreground tabular-nums">{totalStudents}</p>
          <p className="text-[10px] text-muted-foreground font-bold mt-1">حصر تحليلي معتمد</p>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground font-bold mb-1">نسبة الاجتياز العامة</p>
          <p className="text-2xl font-black text-emerald-600 tabular-nums">{passRate}%</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-1">{passedStudents} طالب ناجح</p>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground font-bold mb-1">المتوسط العام للدرجات</p>
          <p className="text-2xl font-black text-primary tabular-nums" dir="ltr">{avgPercentage.toFixed(1)}%</p>
          <p className="text-[10px] text-muted-foreground font-bold mt-1">المعدل التراكمي المحرز</p>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground font-bold mb-1">مرتبة الشرف (ممتاز 90%+)</p>
          <p className="text-2xl font-black text-amber-500 tabular-nums">{honorsStudentsCount}</p>
          <p className="text-[10px] text-amber-600 font-bold mt-1">شريحة النخبة المتفوقة</p>
        </div>
      </div>

      {/* 3. 3D-STYLE LUXURY PODIUM FOR TOP 3 STUDENTS (منصة التتويج للأوائل) */}
      <div className="bg-gradient-to-b from-card via-card to-muted/30 rounded-3xl border-2 border-amber-500/30 p-6 shadow-xl relative overflow-hidden space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-black shadow-lg shadow-amber-500/25">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <span>منصة تتويج فرسان التميز الأكاديمي</span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30">
                  لوحة الشرف 1446-1447 هـ
                </span>
              </h3>
              <p className="text-xs text-muted-foreground font-bold">
                أصحاب المراكز الثلاثة الأولى أداءً ونسبةً على مستوى {selectedGrade || "المرحلة الدراسية"}
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-muted-foreground">
            انقر على اسم أي طالب لفتح سيرته الدراسية أو طباعة شهادة تقديره فورياً 🎓
          </span>
        </div>

        {/* Podium Pillars (Top 2 Silver, Top 1 Gold, Top 3 Bronze) */}
        {honorRoll.length >= 1 ? (
          <div className="pt-4 pb-2 flex items-end justify-center gap-3 sm:gap-6 max-w-3xl mx-auto min-h-[300px]">
            
            {/* 2nd Place: Silver (Left in RTL is center-left) */}
            {top2 && (
              <div className="flex-1 flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 duration-500">
                <div className="relative mb-2 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 border-2 border-slate-300 shadow-lg flex items-center justify-center text-xl font-black mx-auto">
                    {top2.student.name[0]}
                  </div>
                  <span className="absolute -bottom-2.5 right-1/2 translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-800 text-white text-[11px] font-black shadow-sm whitespace-nowrap">
                    🥈 المركز الثاني
                  </span>
                </div>

                <div className="mt-4 text-center space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentForCareer(top2.student.id);
                      setIsCareerModalOpen(true);
                    }}
                    className="font-black text-xs sm:text-sm text-foreground hover:text-primary transition-colors cursor-pointer block truncate max-w-[140px]"
                    title="فتح السيرة الدراسية للطالب"
                  >
                    {top2.student.name}
                  </button>
                  <p className="text-[10px] text-muted-foreground font-bold">شعبة {top2.sectionName}</p>
                  <span className="text-sm sm:text-base font-black text-primary tabular-nums block" dir="ltr">{top2.percentage.toFixed(1)}%</span>
                  
                  {/* Action Buttons for Top 2 */}
                  <div className="flex items-center justify-center gap-1 pt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentForCareer(top2.student.id);
                        setIsCareerModalOpen(true);
                      }}
                      className="p-1 px-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors"
                      title="السيرة الدراسية"
                    >
                      🎓 سيرة
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintHonorStudentCert(top2.student.id)}
                      className="p-1 px-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold hover:bg-amber-500/20 transition-colors"
                      title="طباعة شهادة التقدير"
                    >
                      🖨️ شهادة
                    </button>
                  </div>
                </div>

                {/* Silver Pedestal */}
                <div className="w-full h-28 sm:h-32 mt-3 rounded-t-2xl bg-gradient-to-t from-slate-300/80 to-slate-200/90 dark:from-slate-700 dark:to-slate-600 border-t-2 border-x-2 border-slate-400/50 flex flex-col items-center justify-center text-slate-800 dark:text-slate-200 font-black shadow-inner">
                  <span className="text-3xl font-black">2</span>
                  <span className="text-[10px] font-bold mt-1">فضية الشرف</span>
                </div>
              </div>
            )}

            {/* 1st Place: Gold (Tallest Center) */}
            {top1 && (
              <div className="flex-1 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700 z-10">
                <div className="relative mb-2 text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 text-amber-950 border-4 border-amber-300 shadow-xl shadow-amber-500/30 flex items-center justify-center text-2xl font-black mx-auto ring-4 ring-amber-400/20">
                    {top1.student.name[0]}
                  </div>
                  <span className="absolute -top-3.5 right-1/2 translate-x-1/2 text-2xl animate-bounce">
                    👑
                  </span>
                  <span className="absolute -bottom-3 right-1/2 translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-xs font-black shadow-md whitespace-nowrap">
                    🥇 الأول على المرحلة
                  </span>
                </div>

                <div className="mt-4 text-center space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentForCareer(top1.student.id);
                      setIsCareerModalOpen(true);
                    }}
                    className="font-black text-sm sm:text-base text-foreground hover:text-primary transition-colors cursor-pointer block truncate max-w-[160px]"
                    title="فتح السيرة الدراسية للطالب"
                  >
                    {top1.student.name}
                  </button>
                  <p className="text-[11px] text-muted-foreground font-bold">شعبة {top1.sectionName}</p>
                  <span className="text-base sm:text-lg font-black text-emerald-600 tabular-nums block" dir="ltr">{top1.percentage.toFixed(1)}%</span>
                  
                  {/* Action Buttons for Top 1 */}
                  <div className="flex items-center justify-center gap-1.5 pt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentForCareer(top1.student.id);
                        setIsCareerModalOpen(true);
                      }}
                      className="p-1 px-2 rounded-lg bg-primary/10 text-primary text-[11px] font-black hover:bg-primary/20 transition-colors"
                      title="السيرة الدراسية"
                    >
                      🎓 سيرة
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintHonorStudentCert(top1.student.id)}
                      className="p-1 px-2 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-black hover:bg-amber-500/30 transition-colors"
                      title="طباعة شهادة التقدير"
                    >
                      🖨️ شهادة 🏆
                    </button>
                  </div>
                </div>

                {/* Gold Pedestal */}
                <div className="w-full h-36 sm:h-44 mt-3 rounded-t-2xl bg-gradient-to-t from-amber-400/80 to-amber-300/90 dark:from-amber-600 dark:to-amber-500 border-t-2 border-x-2 border-amber-400 flex flex-col items-center justify-center text-amber-950 font-black shadow-lg">
                  <span className="text-4xl font-black">1</span>
                  <span className="text-xs font-black mt-1">ذهبية الصدارة 🏆</span>
                </div>
              </div>
            )}

            {/* 3rd Place: Bronze (Right in RTL) */}
            {top3 && (
              <div className="flex-1 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-400">
                <div className="relative mb-2 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-700/70 to-amber-900 text-white border-2 border-amber-600 shadow-lg flex items-center justify-center text-xl font-black mx-auto">
                    {top3.student.name[0]}
                  </div>
                  <span className="absolute -bottom-2.5 right-1/2 translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-900 text-white text-[11px] font-black shadow-sm whitespace-nowrap">
                    🥉 المركز الثالث
                  </span>
                </div>

                <div className="mt-4 text-center space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentForCareer(top3.student.id);
                      setIsCareerModalOpen(true);
                    }}
                    className="font-black text-xs sm:text-sm text-foreground hover:text-primary transition-colors cursor-pointer block truncate max-w-[140px]"
                    title="فتح السيرة الدراسية للطالب"
                  >
                    {top3.student.name}
                  </button>
                  <p className="text-[10px] text-muted-foreground font-bold">شعبة {top3.sectionName}</p>
                  <span className="text-sm sm:text-base font-black text-primary tabular-nums block" dir="ltr">{top3.percentage.toFixed(1)}%</span>
                  
                  {/* Action Buttons for Top 3 */}
                  <div className="flex items-center justify-center gap-1 pt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentForCareer(top3.student.id);
                        setIsCareerModalOpen(true);
                      }}
                      className="p-1 px-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors"
                      title="السيرة الدراسية"
                    >
                      🎓 سيرة
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintHonorStudentCert(top3.student.id)}
                      className="p-1 px-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold hover:bg-amber-500/20 transition-colors"
                      title="طباعة شهادة التقدير"
                    >
                      🖨️ شهادة
                    </button>
                  </div>
                </div>

                {/* Bronze Pedestal */}
                <div className="w-full h-20 sm:h-24 mt-3 rounded-t-2xl bg-gradient-to-t from-amber-800/70 to-amber-700/80 dark:from-amber-900 dark:to-amber-800 border-t-2 border-x-2 border-amber-700 flex flex-col items-center justify-center text-amber-100 font-black shadow-inner">
                  <span className="text-2xl font-black">3</span>
                  <span className="text-[10px] font-bold mt-0.5">برونزية التفوق</span>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground font-bold text-xs">
            لا توجد بيانات كافية لعرض منصة التتويج. يرجى التأكد من رصد درجات الاختبار لهذه الفترة.
          </div>
        )}

        {/* 4. Complete Honor Roll Table (Remaining Top Students) */}
        {restHonorRoll.length > 0 && (
          <div className="pt-4 border-t border-border/60">
            <h4 className="text-xs font-black text-muted-foreground mb-3 flex items-center gap-1.5">
              <Medal className="w-3.5 h-3.5 text-primary" /> بقية قائمة أوائل لوحة الشرف ({restHonorRoll.length} طالب)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {restHonorRoll.map(h => (
                <div
                  key={h.student.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-card hover:border-primary/40 transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground font-black text-xs flex items-center justify-center transition-colors">
                      {h.rank}
                    </span>
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentForCareer(h.student.id);
                          setIsCareerModalOpen(true);
                        }}
                        className="font-black text-xs text-foreground hover:text-primary transition-colors cursor-pointer text-right block"
                      >
                        {h.student.name}
                      </button>
                      <span className="text-[10px] text-muted-foreground font-bold">
                        {h.student.grade} • شعبة {h.sectionName}
                      </span>
                    </div>
                  </div>

                  <div className="text-left space-y-1">
                    <span className="text-xs font-black text-primary tabular-nums block" dir="ltr">{h.percentage.toFixed(1)}%</span>
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudentForCareer(h.student.id);
                          setIsCareerModalOpen(true);
                        }}
                        className="p-1 rounded-md bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        title="السيرة الدراسية"
                      >
                        <GraduationCap className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintHonorStudentCert(h.student.id)}
                        className="p-1 rounded-md bg-muted hover:bg-amber-500/15 text-muted-foreground hover:text-amber-600 transition-colors"
                        title="طباعة شهادة التقدير"
                      >
                        <Printer className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Benchmarks & Comparisons: Section Comparison & Subject Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Section Comparison */}
        <PageCard title="مقارنة مؤشرات أداء الشعب الدراسية" description="تحليل الفروق في التحصيل ومتوسطات الدرجات ونسب الاجتياز بين الشعب">
          <div className="space-y-3">
            {sectionBenchmarks.map((sb, idx) => {
              const isTop = idx === 0;
              return (
                <div key={sb.section.id} className={`p-4 rounded-2xl border transition-all ${isTop ? "bg-primary/5 border-primary/30" : "bg-card border-border/60"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-foreground">شعبة {sb.section.name}</span>
                      {isTop && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 border border-amber-500/30">
                          الشعبة الأكثر تميزاً 🌟
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-black text-primary tabular-nums" dir="ltr">
                      {sb.avgPercentage.toFixed(1)}% (متوسط الدرجات)
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full ${sb.avgPercentage >= 80 ? 'bg-emerald-500' : sb.avgPercentage >= 65 ? 'bg-primary' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, sb.avgPercentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                    <span>عدد الطلاب: <b className="text-foreground">{sb.total}</b></span>
                    <span>نسبة النجاح: <b className="text-emerald-600">{sb.passRate}%</b></span>
                    <span>المتفوقين: <b className="text-amber-500">{sb.honorsCount}</b></span>
                    <span>المتعثرين: <b className="text-rose-500">{sb.atRiskCount}</b></span>
                  </div>
                </div>
              );
            })}
            {sectionBenchmarks.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">لا تتوفر شعب للمقارنة في النطاق المحدد.</p>
            )}
          </div>
        </PageCard>

        {/* Subject Performance Analysis */}
        <PageCard 
          title="تحليل كفاءة وأداء المقررات والمواد" 
          description="مؤشرات نسبة النجاح ومتوسط الدرجات وأعلى وأدنى تحصيل لكل مادة"
        >
          <div className="space-y-3">
            {/* Sort Filter for Subjects */}
            <div className="flex items-center justify-between pb-1 border-b border-border/50">
              <span className="text-xs font-bold text-muted-foreground">ترتيب المقررات حسب:</span>
              <div className="flex items-center gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setSubjectSortMode("passRateDesc")}
                  className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                    subjectSortMode === "passRateDesc" ? "bg-primary text-primary-foreground font-black" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  الأعلى نجاحاً
                </button>
                <button
                  type="button"
                  onClick={() => setSubjectSortMode("passRateAsc")}
                  className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                    subjectSortMode === "passRateAsc" ? "bg-rose-500 text-white font-black" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  الأدنى نجاحاً (بحاجة لدعم)
                </button>
                <button
                  type="button"
                  onClick={() => setSubjectSortMode("avgDesc")}
                  className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                    subjectSortMode === "avgDesc" ? "bg-primary text-primary-foreground font-black" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  الأعلى متوسطاً
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {subjectBenchmarks.map((sub) => (
                <div key={sub.examSubject.id} className="p-3.5 rounded-2xl border border-border/60 bg-card space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-xs text-foreground block">{sub.subjectName}</span>
                      <span className="text-[10px] text-muted-foreground font-bold">
                        العظمى: {sub.maxScore} • النجاح: {sub.passScore}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-black text-foreground tabular-nums" dir="ltr">{sub.avgPct.toFixed(1)}%</span>
                      <span className={`text-[10px] font-bold block ${sub.passRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        نسبة الاجتياز: {sub.passRate}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${sub.passRate >= 85 ? 'bg-emerald-500' : sub.passRate >= 65 ? 'bg-primary' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(100, sub.passRate)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                    <span>أعلى درجة: <b className="text-emerald-600 tabular-nums">{sub.maxMark}</b></span>
                    <span>أدنى درجة: <b className="text-rose-600 tabular-nums">{sub.minMark}</b></span>
                    <span>متوسط الدرجة: <b className="text-foreground tabular-nums">{sub.avgMark.toFixed(1)}</b></span>
                  </div>
                </div>
              ))}
              {subjectBenchmarks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">لا توجد مقررات مسجلة لهذه الفترة.</p>
              )}
            </div>
          </div>
        </PageCard>

      </div>

      {/* 6. Achievement Distribution & At-Risk Intervention Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Rating Distribution */}
        <PageCard title="توزيع التقديرات والشرائح الأكاديمية">
          <div className="space-y-4 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-emerald-600 flex items-center gap-1">⭐ ممتاز (90% فأكثر)</span>
                <span>{ratingCounts.excellent} طالب ({totalStudents > 0 ? Math.round((ratingCounts.excellent / totalStudents) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${totalStudents > 0 ? (ratingCounts.excellent / totalStudents) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-blue-600 flex items-center gap-1">🟢 جيد جداً (80% - 89%)</span>
                <span>{ratingCounts.veryGood} طالب ({totalStudents > 0 ? Math.round((ratingCounts.veryGood / totalStudents) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${totalStudents > 0 ? (ratingCounts.veryGood / totalStudents) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-indigo-600 flex items-center gap-1">🔵 جيد (65% - 79%)</span>
                <span>{ratingCounts.good} طالب ({totalStudents > 0 ? Math.round((ratingCounts.good / totalStudents) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${totalStudents > 0 ? (ratingCounts.good / totalStudents) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-amber-600 flex items-center gap-1">🟡 مقبول (50% - 64%)</span>
                <span>{ratingCounts.pass} طالب ({totalStudents > 0 ? Math.round((ratingCounts.pass / totalStudents) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${totalStudents > 0 ? (ratingCounts.pass / totalStudents) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-rose-600 flex items-center gap-1">🔴 راسب / دور ثان (أقل من 50%)</span>
                <span>{ratingCounts.fail} طالب ({totalStudents > 0 ? Math.round((ratingCounts.fail / totalStudents) * 100) : 0}%)</span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${totalStudents > 0 ? (ratingCounts.fail / totalStudents) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </PageCard>

        {/* At-Risk Intervention (2 cols) */}
        <div className="lg:col-span-2">
          <PageCard 
            title={`قائمة متابعة الطلاب المتعثرين وخطط الدعم (${atRiskStudents.length} طالب)`}
            description="حصر الطلاب الذين يواجهون صعوبات أكاديمية في مواد محددة مع إمكانية فتح سجلهم ومتابعتهم"
          >
            <div className="space-y-3">
              {/* Filter by failed subject & export */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">تصفية حسب مادة التعثر:</span>
                  <select
                    value={activeInterventionFilter}
                    onChange={e => setActiveInterventionFilter(e.target.value)}
                    className="h-8 rounded-lg border border-border/60 bg-background px-2 font-bold text-xs shadow-2xs focus:border-primary outline-none"
                  >
                    <option value="all">جميع مواد التعثر</option>
                    {activeStageSubjects.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={exportAtRiskToCSV}
                  disabled={atRiskStudents.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 bg-card hover:bg-muted text-foreground font-black text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-rose-600" />
                  <span>تصدير قائمة المتعثرين إلى Excel 📊</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full text-right text-xs">
                  <thead className="bg-rose-500/10 text-rose-900 dark:text-rose-300 border-b border-rose-200 dark:border-rose-900/40">
                    <tr>
                      <th className="p-2.5 font-bold w-10 text-center">#</th>
                      <th className="p-2.5 font-bold">اسم الطالب</th>
                      <th className="p-2.5 font-bold text-center">الصف والشعبة</th>
                      <th className="p-2.5 font-bold text-center">المعدل</th>
                      <th className="p-2.5 font-bold text-center">المواد المتعثر فيها</th>
                      <th className="p-2.5 font-bold text-center">السيرة الدراسية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {atRiskStudents.map((s, idx) => (
                      <tr key={s.student.id} className="hover:bg-accent/15 transition-colors">
                        <td className="p-2.5 text-center font-bold text-muted-foreground">{idx + 1}</td>
                        <td className="p-2.5 font-black text-foreground">{s.student.name}</td>
                        <td className="p-2.5 text-center font-bold text-muted-foreground">{s.student.grade} ({s.sectionName})</td>
                        <td className="p-2.5 text-center font-black text-rose-600 tabular-nums" dir="ltr">{s.percentage.toFixed(1)}%</td>
                        <td className="p-2.5 text-center">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {s.failedSubjectsList.map((item: any) => (
                              <span key={item.id} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600">
                                {item.name} ({item.mark}/{item.passScore})
                              </span>
                            ))}
                            {s.failedSubjectsList.length === 0 && (
                              <span className="text-[10px] text-amber-600 font-bold">مجموع كلي متدنٍ</span>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentForCareer(s.student.id);
                              setIsCareerModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[11px] transition-all cursor-pointer"
                          >
                            عرض السجل 🎓
                          </button>
                        </td>
                      </tr>
                    ))}
                    {atRiskStudents.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-emerald-600 font-bold">
                          🎉 تهانينا! لا يوجد طلاب متعثرين في النطاق المحدد، نسبة اجتياز 100%!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </PageCard>
        </div>

      </div>

      {/* Career Modal Trigger */}
      {isCareerModalOpen && selectedStudentForCareer && (
        <AcademicCareerModal
          isOpen={isCareerModalOpen}
          onClose={() => {
            setIsCareerModalOpen(false);
            setSelectedStudentForCareer("");
          }}
          studentId={selectedStudentForCareer}
        />
      )}

      {/* Batch Certificates Modal for Honors */}
      {isBatchCertificatesOpen && (
        <BatchCertificatesModal
          isOpen={isBatchCertificatesOpen}
          onClose={() => setIsBatchCertificatesOpen(false)}
          examId={selectedExamId}
          grade={selectedGrade || stageGrades[0] || ""}
          sectionId={selectedSectionId || "all"}
          preSelectedStudentIds={preSelectedHonorStudentIds.length > 0 ? preSelectedHonorStudentIds : honorRoll.map(h => h.student.id)}
        />
      )}

      {/* Hidden Printable Container for Wall of Fame Poster */}
      <div id="printable-wall-of-fame" className="hidden">
        <div style={{ padding: "16px", direction: "rtl", fontFamily: "Cairo, sans-serif" }}>
          
          {/* Poster Header */}
          <div style={{ textAlign: "center", borderBottom: "3px double #d97706", paddingBottom: "16px", marginBottom: "20px" }}>
            <p style={{ margin: 0, fontSize: "11pt", color: "#475569", fontWeight: 700 }}>المملكة العربية السعودية • وزارة التعليم • الإدارة العامة للتعليم الأهلي</p>
            <h1 style={{ margin: "6px 0", fontSize: "24pt", fontWeight: 900, color: "#0f172a" }}>مجمع مدارس المستقبل الأهلية النموذجية</h1>
            <div style={{ display: "inline-block", backgroundColor: "#fef3c7", border: "2px solid #d97706", borderRadius: "12px", padding: "6px 24px", margin: "8px 0" }}>
              <h2 style={{ margin: 0, fontSize: "18pt", fontWeight: 900, color: "#92400e" }}>
                🏆 لوحة الشرف الرسمية لفرسان التميز والتفوق الأكاديمي 🏆
              </h2>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "11pt", color: "#64748b", fontWeight: 800 }}>
              {selectedExam?.name} - {selectedExam?.term} • {selectedGrade ? `الصف: ${selectedGrade}` : "جميع الصفوف"} • العام الدراسي: 1446-1447 هـ
            </p>
          </div>

          {/* Top 3 Spotlight Banner in Print */}
          {honorRoll.length >= 1 && (
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "24px", textAlign: "center" }}>
              {top2 && (
                <div style={{ width: "30%", border: "2px solid #94a3b8", borderRadius: "12px", padding: "12px", backgroundColor: "#f8fafc" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "12pt", fontWeight: 900, color: "#475569" }}>🥈 المركز الثاني</p>
                  <strong style={{ fontSize: "14pt", color: "#0f172a" }}>{top2.student.name}</strong>
                  <p style={{ margin: "4px 0", fontSize: "10pt", color: "#64748b" }}>شعبة {top2.sectionName}</p>
                  <span style={{ fontSize: "14pt", fontWeight: 900, color: "#2563eb" }} dir="ltr">{top2.percentage.toFixed(1)}%</span>
                </div>
              )}

              {top1 && (
                <div style={{ width: "34%", border: "3px solid #d97706", borderRadius: "12px", padding: "14px", backgroundColor: "#fffbeb" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "14pt", fontWeight: 900, color: "#b45309" }}>🥇 المركز الأول (الذهب)</p>
                  <strong style={{ fontSize: "16pt", color: "#0f172a" }}>{top1.student.name}</strong>
                  <p style={{ margin: "4px 0", fontSize: "11pt", color: "#78350f", fontWeight: 700 }}>شعبة {top1.sectionName}</p>
                  <span style={{ fontSize: "16pt", fontWeight: 900, color: "#16a34a" }} dir="ltr">{top1.percentage.toFixed(1)}%</span>
                </div>
              )}

              {top3 && (
                <div style={{ width: "30%", border: "2px solid #b45309", borderRadius: "12px", padding: "12px", backgroundColor: "#fff7ed" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "12pt", fontWeight: 900, color: "#9a3412" }}>🥉 المركز الثالث</p>
                  <strong style={{ fontSize: "14pt", color: "#0f172a" }}>{top3.student.name}</strong>
                  <p style={{ margin: "4px 0", fontSize: "10pt", color: "#64748b" }}>شعبة {top3.sectionName}</p>
                  <span style={{ fontSize: "14pt", fontWeight: 900, color: "#2563eb" }} dir="ltr">{top3.percentage.toFixed(1)}%</span>
                </div>
              )}
            </div>
          )}

          {/* Full Table of Honor Students */}
          <table>
            <thead>
              <tr>
                <th style={{ width: "8%", textAlign: "center" }}>الترتيب</th>
                <th style={{ width: "42%" }}>اسم الطالب الرباعي</th>
                <th style={{ width: "20%", textAlign: "center" }}>الصف والشعبة</th>
                <th style={{ width: "15%", textAlign: "center" }}>النسبة المئوية</th>
                <th style={{ width: "15%", textAlign: "center" }}>التقدير العام</th>
              </tr>
            </thead>
            <tbody>
              {honorRoll.map((h) => (
                <tr key={h.student.id}>
                  <td style={{ textAlign: "center", fontWeight: 900 }}>
                    {h.rank === 1 ? "🥇 الأول" : h.rank === 2 ? "🥈 الثاني" : h.rank === 3 ? "🥉 الثالث" : `${h.rank}`}
                  </td>
                  <td style={{ fontWeight: 800 }}>{h.student.name}</td>
                  <td style={{ textAlign: "center" }}>{h.student.grade} - شعبة {h.sectionName}</td>
                  <td style={{ textAlign: "center", fontWeight: 900, color: "#0f172a" }} dir="ltr">{h.percentage.toFixed(1)}%</td>
                  <td style={{ textAlign: "center", fontWeight: 800, color: "#16a34a" }}>{h.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Signatures & Seal */}
          <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center", marginTop: "40px", paddingTop: "16px", borderTop: "2px solid #cbd5e1", fontSize: "10.5pt", fontWeight: 800 }}>
            <div style={{ width: "30%" }}>
              <p style={{ color: "#64748b", marginBottom: "45px" }}>المرشد الطلابي ورائد النشاط</p>
              <p style={{ borderTop: "1px dashed #94a3b8", paddingTop: "4px" }}>التوقيع: .....................</p>
            </div>
            <div style={{ width: "30%" }}>
              <p style={{ color: "#64748b", marginBottom: "45px" }}>وكيل شؤون الطلاب والكنترول</p>
              <p style={{ borderTop: "1px dashed #94a3b8", paddingTop: "4px" }}>المراجعة والاعتماد: .....................</p>
            </div>
            <div style={{ width: "30%" }}>
              <p style={{ color: "#64748b", marginBottom: "45px" }}>مدير المدرسة والختم الرسمي</p>
              <p style={{ borderTop: "1px dashed #94a3b8", paddingTop: "4px" }}>الختم والتوقيع</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

