import React, { useState, useMemo, useEffect } from "react";
import { 
  Printer, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  Sliders, 
  X, 
  Search, 
  Filter, 
  Sparkles, 
  Award, 
  Eye, 
  FileText, 
  Users, 
  CheckSquare, 
  Square, 
  ChevronLeft, 
  ChevronRight,
  School,
  QrCode,
  Scissors,
  ShieldCheck,
  Palette,
  Settings2,
  FileCheck2,
  UserCheck,
  LayoutGrid
} from "lucide-react";
import { useGlobalStore, ExamResult, ExamSubject } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import QRCode from "react-qr-code";

export interface BatchCertificatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId?: string;
  grade?: string;
  sectionId?: string;
  preSelectedStudentIds?: string[];
}

export function BatchCertificatesModal({
  isOpen,
  onClose,
  examId = "",
  grade = "",
  sectionId = "",
  preSelectedStudentIds = []
}: BatchCertificatesModalProps) {
  const { stage } = useStage();
  const { 
    allStudents,
    activeStageStudents, 
    allStudentEnrollments, 
    activeStageSections, 
    activeStageExams, 
    activeStageExamSubjects, 
    activeStageSubjects, 
    allExamResults,
    currentAcademicYearId 
  } = useGlobalStore();

  // Helper to normalize grade names
  const normalizeGrade = (g: string = "") => g.replace(/الابتدائي|المتوسط|الثانوي/g, "").replace(/\s+/g, " ").trim();

  // Scope filter: entire_grade, selected_sections, custom, single
  const [selectedScope, setSelectedScope] = useState<"entire_grade" | "selected_sections" | "custom" | "single">("entire_grade");
  const [selectedSectionIds, setSelectedSectionIds] = useState<Set<string>>(new Set());
  const [activeExamId, setActiveExamId] = useState<string>(examId);

  // Studio Drawer State
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioTab, setStudioTab] = useState<"layout" | "texts" | "visuals" | "fields">("layout");

  // Page Orientation & Layout
  const [pageOrientation, setPageOrientation] = useState<"portrait" | "landscape" | "compact_2up">("portrait");
  const [templateStyle, setTemplateStyle] = useState<"official" | "honor" | "compact">("official");

  // Certificate Visual & Content Toggles
  const [showRank, setShowRank] = useState(true);
  const [showPercentage, setShowPercentage] = useState(true);
  const [showGeneralRating, setShowGeneralRating] = useState(true);
  const [showSubjectPercentage, setShowSubjectPercentage] = useState(true);
  const [showMaxPassScore, setShowMaxPassScore] = useState(true);
  const [showSubjectStatus, setShowSubjectStatus] = useState(true);
  const [showDecision, setShowDecision] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [sealType, setSealType] = useState<"gold" | "blue" | "watermark" | "none">("gold");
  const [showCustomNote, setShowCustomNote] = useState(true);

  // Editable Texts
  const [customSchoolName, setCustomSchoolName] = useState("مجمع مدارس المستقبل الأهلية النموذجية");
  const [customMinistryTitle, setCustomMinistryTitle] = useState("المملكة العربية السعودية • وزارة التعليم • الإدارة العامة للتعليم");
  const [customCongratulatoryNote, setCustomCongratulatoryNote] = useState("تهانينا القلبية لك ولأسرتك الكريمة على هذا التميز، ونتمنى لك دوام التقدم والازدهار.");
  const [customGuidanceName, setCustomGuidanceName] = useState("");
  const [customPrincipalName, setCustomPrincipalName] = useState("");

  // Student Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(preSelectedStudentIds));
  const [studentSearch, setStudentSearch] = useState("");
  const [previewStudentIdx, setPreviewStudentIdx] = useState(0);

  // Sections for this grade
  const sectionsForGrade = useMemo(() => {
    return activeStageSections.filter(s => normalizeGrade(s.grade) === normalizeGrade(grade) && s.stage === stage);
  }, [activeStageSections, grade, stage]);

  // Sync initial scope from props
  useEffect(() => {
    if (preSelectedStudentIds && preSelectedStudentIds.length > 0) {
      setSelectedIds(new Set(preSelectedStudentIds));
      setSelectedScope("custom");
    } else if (sectionId && sectionId !== "all") {
      setSelectedScope("selected_sections");
      setSelectedSectionIds(new Set([sectionId]));
    } else {
      setSelectedScope("entire_grade");
      setSelectedSectionIds(new Set(sectionsForGrade.map(s => s.id)));
    }
    if (examId) setActiveExamId(examId);
  }, [isOpen, preSelectedStudentIds, sectionId, examId, sectionsForGrade]);

  // Exams list for stage
  const currentExam = useMemo(() => {
    return activeStageExams.find(e => e.id === activeExamId) || activeStageExams[0];
  }, [activeStageExams, activeExamId]);

  // Section student counts
  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    sectionsForGrade.forEach(sec => {
      counts[sec.id] = (activeStageStudents || []).filter(s => {
        if (normalizeGrade(s.grade) !== normalizeGrade(grade)) return false;
        return s.sectionId === sec.id;
      }).length;
    });
    return counts;
  }, [sectionsForGrade, activeStageStudents, grade]);

  // Gather eligible students based on Grade & Scope
  const eligibleStudents = useMemo(() => {
    return (activeStageStudents || []).filter(s => {
      if (normalizeGrade(s.grade) !== normalizeGrade(grade)) return false;
      if (selectedScope === "selected_sections") {
        if (selectedSectionIds.size > 0 && !selectedSectionIds.has(s.sectionId || "")) {
          return false;
        }
      }
      return true;
    });
  }, [activeStageStudents, grade, selectedScope, selectedSectionIds]);

  // Auto-select students when scope changes
  useEffect(() => {
    if (selectedScope === "entire_grade") {
      setSelectedIds(new Set(eligibleStudents.map(s => s.id)));
    } else if (selectedScope === "selected_sections") {
      const secStudents = eligibleStudents.filter(s => selectedSectionIds.has(s.sectionId || ""));
      setSelectedIds(new Set(secStudents.map(s => s.id)));
    }
  }, [selectedScope, selectedSectionIds, eligibleStudents]);

  // Results Map for O(1) Lookup
  const resultsMap = useMemo(() => {
    const map = new Map<string, any>();
    (allExamResults || []).forEach(r => {
      if (r.studentEnrollmentId) {
        map.set(`${r.examSubjectId}_${r.studentEnrollmentId}`, r);
      }
    });
    return map;
  }, [allExamResults]);

  // Exam Subjects for this exam and grade
  const gradeExamSubjects = useMemo(() => {
    if (!currentExam) return [];
    return (activeStageExamSubjects || []).filter(es => es.examId === currentExam.id && normalizeGrade(es.grade) === normalizeGrade(grade));
  }, [activeStageExamSubjects, currentExam, grade]);

  // Compute Full Academic Data for All Eligible Students
  const studentsCertData = useMemo(() => {
    if (!currentExam) return [];

    const computed = eligibleStudents.map(student => {
      const enrollment = (allStudentEnrollments || []).find(e => e.studentId === student.id && e.academicYearId === currentAcademicYearId) || {
        id: `ENR-${student.id}`,
        studentId: student.id,
        sectionId: student.sectionId || "",
        academicYearId: currentAcademicYearId,
        stage: stage,
        status: "enrolled"
      };
      const studentSection = activeStageSections.find(s => s.id === (enrollment?.sectionId || student.sectionId));
      
      let totalMarks = 0;
      let totalMaxMarks = 0;
      let failedSubjectsCount = 0;

      const subjectMarks = gradeExamSubjects.map(es => {
        const sub = (activeStageSubjects || []).find(s => s.id === es.subjectId);
        const enrollmentId = enrollment?.id || student.id;
        const res = resultsMap.get(`${es.id}_${enrollmentId}`) ||
                    resultsMap.get(`${es.id}_${student.id}`) ||
                    ((student as any).studentId ? resultsMap.get(`${es.id}_${(student as any).studentId}`) : null) ||
                    (allExamResults || []).find(r => r.examSubjectId === es.id && (
                      r.studentEnrollmentId === enrollmentId || 
                      r.studentEnrollmentId === student.id || 
                      ((student as any).studentId && r.studentEnrollmentId === (student as any).studentId)
                    ));
        
        const mark = res?.mark ?? 0;
        const isPassed = mark >= es.passScore;
        const pct = es.maxScore > 0 ? (mark / es.maxScore) * 100 : 0;

        totalMarks += mark;
        totalMaxMarks += es.maxScore;
        if (!isPassed) failedSubjectsCount++;

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
      let overallRating = "مقبول";
      if (overallPercentage >= 90) overallRating = "ممتاز مرتفع (مرتبة الشرف)";
      else if (overallPercentage >= 80) overallRating = "جيد جداً مرتفع";
      else if (overallPercentage >= 65) overallRating = "جيد";
      else if (overallPercentage >= 50) overallRating = "مقبول";
      else overallRating = "له دور ثانٍ";

      return {
        student,
        enrollment,
        sectionName: studentSection?.name || "1",
        subjectMarks,
        totalMarks,
        totalMaxMarks,
        overallPercentage,
        overallRating,
        failedSubjectsCount,
        isPassed: overallPercentage >= 50 && failedSubjectsCount === 0
      };
    });

    // Rank students by total score descending
    const sorted = [...computed].sort((a, b) => b.totalMarks - a.totalMarks);
    return sorted.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      totalStudentsInGrade: sorted.length
    }));
  }, [eligibleStudents, currentExam, allStudentEnrollments, currentAcademicYearId, stage, activeStageSections, gradeExamSubjects, activeStageSubjects, resultsMap, allExamResults]);

  // Filter students based on selection for print
  const studentsToPrint = useMemo(() => {
    if (selectedScope === "single") {
      const single = studentsCertData[previewStudentIdx] || studentsCertData[0];
      return single ? [single] : [];
    }
    return studentsCertData.filter(s => selectedIds.has(s.student.id));
  }, [studentsCertData, selectedIds, selectedScope, previewStudentIdx]);

  // Section toggling helper
  const toggleSection = (sId: string) => {
    setSelectedSectionIds(prev => {
      const next = new Set(prev);
      if (next.has(sId)) next.delete(sId);
      else next.add(sId);
      return next;
    });
  };

  const handleSelectAllSections = () => {
    setSelectedSectionIds(new Set(sectionsForGrade.map(s => s.id)));
  };

  const handleDeselectAllSections = () => {
    setSelectedSectionIds(new Set());
  };

  // Quick Student Selections
  const handleSelectAll = () => {
    setSelectedIds(new Set(studentsCertData.map(s => s.student.id)));
  };
  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };
  const handleSelectTopN = (n: number) => {
    const top = studentsCertData.slice(0, n).map(s => s.student.id);
    setSelectedIds(new Set(top));
  };
  const handleSelectHonors = () => {
    const honors = studentsCertData.filter(s => s.overallPercentage >= 90).map(s => s.student.id);
    setSelectedIds(new Set(honors));
  };
  const handleSelectPassOnly = () => {
    const passed = studentsCertData.filter(s => s.isPassed).map(s => s.student.id);
    setSelectedIds(new Set(passed));
  };
  const handleSelectAtRisk = () => {
    const atRisk = studentsCertData.filter(s => !s.isPassed || s.failedSubjectsCount > 0).map(s => s.student.id);
    setSelectedIds(new Set(atRisk));
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Safe Index for Preview
  const currentPreviewStudent = studentsToPrint[previewStudentIdx] || studentsToPrint[0] || studentsCertData[0];

  // High-Speed Multi-Page Iframe Consecutive Printing
  const handlePrintBatch = () => {
    if (studentsToPrint.length === 0) return;

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

    const printContent = document.getElementById("printable-batch-certificates");
    if (!printContent) return;

    const pageCss = pageOrientation === "landscape"
      ? `@page { size: A4 landscape; margin: 8mm 10mm; } .cert-page { min-height: 195mm; }`
      : pageOrientation === "compact_2up"
      ? `@page { size: A4 portrait; margin: 6mm 6mm; } .cert-page { min-height: 135mm; padding: 6mm; }`
      : `@page { size: A4 portrait; margin: 10mm 8mm; } .cert-page { min-height: 275mm; padding: 12mm 10mm; }`;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>شهادات_${currentExam?.name || "الطلاب"}_صف_${grade}</title>
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
            font-size: ${pageOrientation === "compact_2up" ? "9pt" : "10.5pt"};
            direction: rtl;
          }
          .cert-page {
            page-break-after: always !important;
            break-after: page !important;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .cert-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            margin-bottom: 6px;
          }
          th, td {
            border: 1px solid #94a3b8;
            padding: 4px 8px;
            text-align: right;
          }
          th {
            background-color: #f1f5f9;
            font-weight: 800;
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: 700; }
          .font-black { font-weight: 900; }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[95vh] flex flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <span>طباعة الشهادات والإشعارات الفردية المجمعة</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-black">
                  {grade}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground font-bold">
                إصدار متتابع لشهادات الطلاب (كل طالب في صفحة مستقلة) مع استوديو تحكم متكامل للقوالب والنصوص
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsStudioOpen(!isStudioOpen)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                isStudioOpen 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "border-border/70 bg-card hover:bg-muted text-foreground"
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{isStudioOpen ? "إغلاق استوديو التخصيص" : "استوديو التحكم والتعديل اليدوي ⚙️"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-border/60 bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SCOPE SELECTION BAR (4 SCOPES) */}
        <div className="px-6 py-3 border-b border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted/60 border border-border/60">
            <button
              type="button"
              onClick={() => setSelectedScope("entire_grade")}
              className={`py-1.5 px-3 rounded-xl transition-all font-black cursor-pointer flex items-center gap-1.5 ${
                selectedScope === "entire_grade" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <School className="w-3.5 h-3.5 text-primary" />
              <span>الفصل كاملاً بكل شعبه</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedScope("selected_sections")}
              className={`py-1.5 px-3 rounded-xl transition-all font-black cursor-pointer flex items-center gap-1.5 ${
                selectedScope === "selected_sections" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-500" />
              <span>شعب محددة من الفصل</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedScope("custom")}
              className={`py-1.5 px-3 rounded-xl transition-all font-black cursor-pointer flex items-center gap-1.5 ${
                selectedScope === "custom" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>تحديد مخصص لطلاب ({selectedIds.size})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedScope("single")}
              className={`py-1.5 px-3 rounded-xl transition-all font-black cursor-pointer flex items-center gap-1.5 ${
                selectedScope === "single" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>طالب فردي</span>
            </button>
          </div>

          {/* Exam Selector */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-muted-foreground whitespace-nowrap">فترة الاختبار:</span>
            <select
              value={activeExamId}
              onChange={e => setActiveExamId(e.target.value)}
              className="h-8 rounded-xl border border-border/70 bg-card px-2.5 font-black text-xs outline-none cursor-pointer"
            >
              {(activeStageExams || []).map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* MULTI-SECTION CHIPS (when scope is selected_sections) */}
        {selectedScope === "selected_sections" && (
          <div className="px-6 py-2.5 border-b border-border/40 bg-muted/10 flex items-center gap-2 flex-wrap text-xs">
            <span className="font-black text-muted-foreground">حدد الشعب المراد طباعتها:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {sectionsForGrade.map(sec => {
                const isChecked = selectedSectionIds.has(sec.id);
                const count = sectionCounts[sec.id] || 0;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => toggleSection(sec.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      isChecked 
                        ? "bg-primary text-primary-foreground border-primary shadow-xs" 
                        : "bg-background border-border/70 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{isChecked ? "✓" : "+"}</span>
                    <span>شعبة {sec.name}</span>
                    <span className="text-[10px] opacity-80">({count} طالب)</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handleSelectAllSections}
                className="px-2 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground text-[10px] font-black cursor-pointer"
              >
                تحديد الكل
              </button>
              <button
                type="button"
                onClick={handleDeselectAllSections}
                className="px-2 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground text-[10px] font-black cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* STUDIO DRAWER */}
        {isStudioOpen && (
          <div className="px-6 py-4 border-b border-primary/30 bg-primary/5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-black text-foreground">استوديو تخصيص وضبط الشهادات للطباعة</h4>
              </div>

              {/* Studio Tabs */}
              <div className="flex items-center bg-card p-1 rounded-xl border border-border/60 text-xs">
                <button
                  type="button"
                  onClick={() => setStudioTab("layout")}
                  className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                    studioTab === "layout" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  📐 الوضعية والقالب
                </button>
                <button
                  type="button"
                  onClick={() => setStudioTab("texts")}
                  className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                    studioTab === "texts" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ✍️ النصوص والعناوين
                </button>
                <button
                  type="button"
                  onClick={() => setStudioTab("visuals")}
                  className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                    studioTab === "visuals" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🖼️ الشعارات والأختام
                </button>
                <button
                  type="button"
                  onClick={() => setStudioTab("fields")}
                  className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                    studioTab === "fields" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  📊 حقول وبيانات الدرجات
                </button>
              </div>
            </div>

            {/* Studio Content */}
            {studioTab === "layout" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-card border border-border/60 space-y-2">
                  <label className="font-black text-foreground block">وضعية الورقة المطبوعة (A4 Orientation):</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPageOrientation("portrait")}
                      className={`p-2 rounded-xl border text-center font-black cursor-pointer transition-all ${
                        pageOrientation === "portrait" ? "bg-primary/10 border-primary text-primary" : "bg-background border-border/60 text-muted-foreground"
                      }`}
                    >
                      <FileText className="w-4 h-4 mx-auto mb-1 text-primary" />
                      <span className="text-[11px] block">عمودي رسمي</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPageOrientation("landscape")}
                      className={`p-2 rounded-xl border text-center font-black cursor-pointer transition-all ${
                        pageOrientation === "landscape" ? "bg-primary/10 border-primary text-primary" : "bg-background border-border/60 text-muted-foreground"
                      }`}
                    >
                      <Award className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                      <span className="text-[11px] block">عرضي شرفي</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPageOrientation("compact_2up")}
                      className={`p-2 rounded-xl border text-center font-black cursor-pointer transition-all ${
                        pageOrientation === "compact_2up" ? "bg-primary/10 border-primary text-primary" : "bg-background border-border/60 text-muted-foreground"
                      }`}
                    >
                      <Scissors className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                      <span className="text-[11px] block">إشعارين بالصفحة</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/60 space-y-2">
                  <label className="font-black text-foreground block">نمط القالب المعتمد:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTemplateStyle("official")}
                      className={`p-2 rounded-xl border text-center font-black cursor-pointer transition-all ${
                        templateStyle === "official" ? "bg-primary/10 border-primary text-primary" : "bg-background border-border/60 text-muted-foreground"
                      }`}
                    >
                      <FileCheck2 className="w-4 h-4 mx-auto mb-1 text-primary" />
                      <span className="text-[11px] block">إشعار رسمي</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateStyle("honor")}
                      className={`p-2 rounded-xl border text-center font-black cursor-pointer transition-all ${
                        templateStyle === "honor" ? "bg-primary/10 border-primary text-primary" : "bg-background border-border/60 text-muted-foreground"
                      }`}
                    >
                      <Sparkles className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                      <span className="text-[11px] block">شهادة تفوق 🏆</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateStyle("compact")}
                      className={`p-2 rounded-xl border text-center font-black cursor-pointer transition-all ${
                        templateStyle === "compact" ? "bg-primary/10 border-primary text-primary" : "bg-background border-border/60 text-muted-foreground"
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                      <span className="text-[11px] block">بطاقة مختصرة</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {studioTab === "texts" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">اسم الصرح التعليمي / المدرسة:</label>
                  <input
                    value={customSchoolName}
                    onChange={e => setCustomSchoolName(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-xl border border-border/70 bg-card font-bold text-xs outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">الترويسة الإدارية العليا:</label>
                  <input
                    value={customMinistryTitle}
                    onChange={e => setCustomMinistryTitle(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-xl border border-border/70 bg-card font-bold text-xs outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-foreground">عبارة التهنئة / الملاحظة الختامية المطبوعة:</label>
                  <input
                    value={customCongratulatoryNote}
                    onChange={e => setCustomCongratulatoryNote(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-xl border border-border/70 bg-card font-bold text-xs outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">اسم المرشد الطلابي / رائد الفصل:</label>
                  <input
                    value={customGuidanceName}
                    onChange={e => setCustomGuidanceName(e.target.value)}
                    placeholder="افتراضي: المرشد الطلابي"
                    className="w-full h-8 px-2.5 rounded-xl border border-border/70 bg-card font-bold text-xs outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">اسم مدير المدرسة:</label>
                  <input
                    value={customPrincipalName}
                    onChange={e => setCustomPrincipalName(e.target.value)}
                    placeholder="افتراضي: مدير المدرسة"
                    className="w-full h-8 px-2.5 rounded-xl border border-border/70 bg-card font-bold text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {studioTab === "visuals" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-bold">
                <div className="p-3 rounded-2xl bg-card border border-border/60 space-y-2">
                  <label className="font-black text-foreground block">الأختام والشعارات الرسمية:</label>
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => setSealType("gold")}
                      className={`p-1.5 rounded-xl border text-[11px] font-black cursor-pointer transition-all ${
                        sealType === "gold" ? "bg-amber-500/15 border-amber-500 text-amber-700" : "bg-background border-border/60 text-muted-foreground"
                      }`}
                    >
                      ختم ذهبي 🏅
                    </button>
                    <button
                      type="button"
                      onClick={() => setSealType("blue")}
                      className={`p-1.5 rounded-xl border text-[11px] font-black cursor-pointer transition-all ${
                        sealType === "blue" ? "bg-blue-500/15 border-blue-500 text-blue-700" : "bg-background border-border/60 text-muted-foreground"
                      }`}
                    >
                      ختم رسمي 🛡️
                    </button>
                    <button
                      type="button"
                      onClick={() => setSealType("watermark")}
                      className={`p-1.5 rounded-xl border text-[11px] font-black cursor-pointer transition-all ${
                        sealType === "watermark" ? "bg-muted border-foreground/30 text-foreground" : "bg-background border-border/60 text-muted-foreground"
                      }`}
                    >
                      علامة مائية
                    </button>
                    <button
                      type="button"
                      onClick={() => setSealType("none")}
                      className={`p-1.5 rounded-xl border text-[11px] font-black cursor-pointer transition-all ${
                        sealType === "none" ? "bg-rose-500/15 border-rose-500 text-rose-700" : "bg-background border-border/60 text-muted-foreground"
                      }`}
                    >
                      بدون ختم
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-card border border-border/60 space-y-2">
                  <label className="font-black text-foreground block">خيارات التحقق الرقمي والاعتماد:</label>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showQrCode} onChange={e => setShowQrCode(e.target.checked)} className="rounded text-primary cursor-pointer" />
                      <span>باركود التحقق الرقمي المعتمد QR</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showSignatures} onChange={e => setShowSignatures(e.target.checked)} className="rounded text-primary cursor-pointer" />
                      <span>خانات التوقيع الثلاثية (المرشد، الكنترول، المدير)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showLogo} onChange={e => setShowLogo(e.target.checked)} className="rounded text-primary cursor-pointer" />
                      <span>إظهار شعار الصرح في الترويسة</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {studioTab === "fields" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border/60 cursor-pointer">
                  <input type="checkbox" checked={showMaxPassScore} onChange={e => setShowMaxPassScore(e.target.checked)} className="rounded text-primary cursor-pointer" />
                  <span>العظمى ودرجة النجاح</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border/60 cursor-pointer">
                  <input type="checkbox" checked={showSubjectPercentage} onChange={e => setShowSubjectPercentage(e.target.checked)} className="rounded text-primary cursor-pointer" />
                  <span>النسبة المئوية للمادة %</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border/60 cursor-pointer">
                  <input type="checkbox" checked={showSubjectStatus} onChange={e => setShowSubjectStatus(e.target.checked)} className="rounded text-primary cursor-pointer" />
                  <span>حالة المادة (ناجح/دور ثانٍ)</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border/60 cursor-pointer">
                  <input type="checkbox" checked={showPercentage} onChange={e => setShowPercentage(e.target.checked)} className="rounded text-primary cursor-pointer" />
                  <span>المعدل والنسبة العامة</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border/60 cursor-pointer">
                  <input type="checkbox" checked={showGeneralRating} onChange={e => setShowGeneralRating(e.target.checked)} className="rounded text-primary cursor-pointer" />
                  <span>التقدير العام التراكمي</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border/60 cursor-pointer">
                  <input type="checkbox" checked={showRank} onChange={e => setShowRank(e.target.checked)} className="rounded text-primary cursor-pointer" />
                  <span>الترتيب على الصف</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border/60 cursor-pointer">
                  <input type="checkbox" checked={showDecision} onChange={e => setShowDecision(e.target.checked)} className="rounded text-primary cursor-pointer" />
                  <span>القرار الأكاديمي للانتقال</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border/60 cursor-pointer">
                  <input type="checkbox" checked={showCustomNote} onChange={e => setShowCustomNote(e.target.checked)} className="rounded text-primary cursor-pointer" />
                  <span>عبارة التهنئة المخصصة</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* MAIN BODY: 2 Columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          
          {/* LEFT PANEL: Student Selector & Quick Actions (5 cols) */}
          <div className="lg:col-span-5 flex flex-col border-l border-border bg-card/50 overflow-hidden">
            
            {/* Quick Actions Header */}
            <div className="p-3 border-b border-border/50 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" /> قائمة طلاب {grade}
                </span>
                <span className="text-[11px] font-black text-primary">
                  محدد: {studentsToPrint.length} / {studentsCertData.length} طالب
                </span>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-1 flex-wrap text-[11px] font-black">
                <button type="button" onClick={handleSelectAll} className="px-2 py-1 rounded-lg bg-muted hover:bg-accent text-foreground cursor-pointer">الكل ({studentsCertData.length})</button>
                <button type="button" onClick={() => handleSelectTopN(5)} className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 cursor-pointer">أول 5 🥇</button>
                <button type="button" onClick={() => handleSelectTopN(10)} className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 cursor-pointer">أول 10 🏆</button>
                <button type="button" onClick={handleSelectHonors} className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 cursor-pointer">المتفوقين (90%+)</button>
                <button type="button" onClick={handleSelectPassOnly} className="px-2 py-1 rounded-lg bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 cursor-pointer">الناجحين</button>
                <button type="button" onClick={handleDeselectAll} className="px-2 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground cursor-pointer">إلغاء</button>
              </div>
            </div>

            {/* Instant Search Bar */}
            <div className="p-2.5 border-b border-border/50 bg-background">
              <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  placeholder="بحث سريع باسم الطالب أو رقمه أو شعبته..."
                  className="h-8 w-full rounded-xl border border-border/60 bg-muted/30 pr-8 pl-3 text-xs font-bold shadow-2xs focus:border-primary outline-none"
                />
              </div>
            </div>

            {/* Scrollable Student List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/30 p-2 space-y-1">
              {studentsCertData
                .filter(s => {
                  if (!studentSearch.trim()) return true;
                  const q = studentSearch.trim().toLowerCase();
                  return s.student.name.toLowerCase().includes(q) || 
                         (s.student.nationalId && s.student.nationalId.includes(q)) ||
                         s.sectionName.toLowerCase().includes(q);
                })
                .map((s, idx) => {
                  const isChecked = selectedIds.has(s.student.id);
                  const isPreviewing = currentPreviewStudent?.student.id === s.student.id;

                  return (
                    <div
                      key={s.student.id}
                      className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                        isPreviewing ? "bg-primary/15 border border-primary/40 shadow-xs" : "hover:bg-muted/50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {selectedScope !== "single" && (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleStudentSelection(s.student.id)}
                            className="rounded text-primary cursor-pointer w-4 h-4"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const pIdx = studentsToPrint.findIndex(item => item.student.id === s.student.id);
                            if (pIdx !== -1) setPreviewStudentIdx(pIdx);
                            else {
                              // If not in print list yet, we can view in single mode
                              const directIdx = studentsCertData.findIndex(item => item.student.id === s.student.id);
                              if (directIdx !== -1) setPreviewStudentIdx(directIdx);
                            }
                          }}
                          className="text-right flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs font-black text-foreground truncate">{s.student.name}</span>
                            {s.rank <= 3 && (
                              <span className="text-[10px]">{s.rank === 1 ? "🥇" : s.rank === 2 ? "🥈" : "🥉"}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-bold">
                            شعبة {s.sectionName} • المعدل: <b className="text-primary tabular-nums" dir="ltr">{s.overallPercentage.toFixed(1)}%</b> • #{s.rank}
                          </p>
                        </button>
                      </div>

                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                        s.isPassed ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                      }`}>
                        {s.overallRating.split(" ")[0]}
                      </span>
                    </div>
                  );
                })}
            </div>

          </div>

          {/* RIGHT PANEL: Live Certificate Preview & Controls (7 cols) */}
          <div className="lg:col-span-7 flex flex-col bg-muted/40 overflow-hidden">
            
            {/* Preview Stepper Bar */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-border/60 bg-card/60">
              <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-primary" /> معاينة الشهادة الحالية قبل الطباعة
              </span>

              {studentsToPrint.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-bold">
                  <button
                    type="button"
                    disabled={previewStudentIdx <= 0}
                    onClick={() => setPreviewStudentIdx(prev => Math.max(0, prev - 1))}
                    className="p-1 rounded-lg border border-border/60 bg-background hover:bg-muted disabled:opacity-30 cursor-pointer"
                    title="الشهادة السابقة"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-black tabular-nums">
                    {previewStudentIdx + 1} من {studentsToPrint.length}
                  </span>
                  <button
                    type="button"
                    disabled={previewStudentIdx >= studentsToPrint.length - 1}
                    onClick={() => setPreviewStudentIdx(prev => Math.min(studentsToPrint.length - 1, prev + 1))}
                    className="p-1 rounded-lg border border-border/60 bg-background hover:bg-muted disabled:opacity-30 cursor-pointer"
                    title="الشهادة التالية"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Live Interactive Preview Canvas */}
            <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
              {currentPreviewStudent ? (
                <div className={`w-full max-w-xl rounded-2xl border-2 border-border/80 bg-background p-5 shadow-xl space-y-3 relative ${
                  pageOrientation === "landscape" ? "max-w-2xl" : ""
                }`}>
                  
                  {/* Watermark seal if selected */}
                  {sealType === "watermark" && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                      <ShieldCheck className="w-64 h-64 text-primary" />
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center justify-between border-b-2 border-primary/20 pb-3">
                    <div className="space-y-0.5 text-right">
                      <h4 className="text-xs font-black text-foreground">{customSchoolName}</h4>
                      <p className="text-[10px] text-muted-foreground font-bold">{customMinistryTitle}</p>
                      <p className="text-[10px] font-black text-primary">إشعار درجات نتيجة: {currentExam?.name}</p>
                    </div>
                    {showLogo && (
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                        <School className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Student Info Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-2.5 rounded-xl bg-muted/30 border border-border/50 font-bold">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">اسم الطالب</span>
                      <strong className="text-foreground font-black text-xs">{currentPreviewStudent.student.name}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">الرقم الأكاديمي</span>
                      <span className="text-foreground font-mono text-xs">{currentPreviewStudent.student.nationalId || currentPreviewStudent.student.id}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">الصف الدراسي</span>
                      <span className="text-foreground font-black">{grade}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">الشعبة</span>
                      <span className="text-foreground font-black">شعبة {currentPreviewStudent.sectionName}</span>
                    </div>
                  </div>

                  {/* STRICT RULE: Subject Marks Table has NO individual descriptive verbal ratings! */}
                  <div className="rounded-xl border border-border/60 overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-muted/70 text-muted-foreground font-black border-b border-border/60">
                        <tr>
                          <th className="p-2">المادة الدراسية</th>
                          {showMaxPassScore && (
                            <>
                              <th className="p-2 text-center w-14">العظمى</th>
                              <th className="p-2 text-center w-14">النجاح</th>
                            </>
                          )}
                          <th className="p-2 text-center w-16 text-primary">الدرجة</th>
                          {showSubjectPercentage && (
                            <th className="p-2 text-center w-16">النسبة %</th>
                          )}
                          {showSubjectStatus && (
                            <th className="p-2 text-center w-16">النتيجة</th>
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

                  {/* Summary Banner */}
                  <div className="grid grid-cols-3 gap-2 border-2 border-primary/20 p-2.5 rounded-xl bg-primary/5 text-center text-xs font-bold">
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-0.5">المجموع الكلي</p>
                      <p className="text-base font-black text-primary tabular-nums">
                        {currentPreviewStudent.totalMarks} <span className="text-[10px] text-muted-foreground font-normal">/ {currentPreviewStudent.totalMaxMarks}</span>
                      </p>
                    </div>
                    {showPercentage && (
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">النسبة المئوية</p>
                        <p className="text-base font-black text-foreground tabular-nums" dir="ltr">{currentPreviewStudent.overallPercentage.toFixed(1)}%</p>
                      </div>
                    )}
                    {showGeneralRating && (
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">التقدير العام</p>
                        <p className="text-xs sm:text-sm font-black text-emerald-600">{currentPreviewStudent.overallRating}</p>
                      </div>
                    )}
                  </div>

                  {/* Rank & Decision */}
                  <div className="flex justify-between items-center text-xs p-2 rounded-xl bg-muted/20 border border-border/40 font-bold">
                    {showRank && (
                      <span>الترتيب على الصف: <b className="text-primary font-black">#{currentPreviewStudent.rank}</b> (من {currentPreviewStudent.totalStudentsInGrade})</span>
                    )}
                    {showDecision && (
                      <span>القرار الأكاديمي: <b className="text-emerald-600 font-black">{currentPreviewStudent.isPassed ? "ناجح ومؤهل للانتقال" : "له دور ثانٍ"}</b></span>
                    )}
                  </div>

                  {/* Custom Note */}
                  {showCustomNote && customCongratulatoryNote && (
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center text-[11px] font-bold text-amber-800 dark:text-amber-300">
                      {customCongratulatoryNote}
                    </div>
                  )}

                  {/* Signatures & Seal */}
                  <div className="flex items-end justify-between pt-3 text-center text-[10px] font-black border-t border-border/40">
                    {showQrCode && (
                      <div className="text-right">
                        <QRCode value={`Darasi-Sahel|Student:${currentPreviewStudent.student.name}|Exam:${currentExam?.name}|Total:${currentPreviewStudent.totalMarks}|Rank:${currentPreviewStudent.rank}`} size={46} />
                        <span className="text-[8px] text-muted-foreground block mt-0.5">تحقق رقمي</span>
                      </div>
                    )}

                    {sealType !== "none" && sealType !== "watermark" && (
                      <div className="text-center px-2">
                        <div className={`w-12 h-12 rounded-full border-2 border-dashed flex flex-col items-center justify-center ${
                          sealType === "gold" ? "border-amber-500 bg-amber-500/10 text-amber-700" : "border-blue-600 bg-blue-500/10 text-blue-700"
                        }`}>
                          <ShieldCheck className="w-4 h-4 mb-0.5" />
                          <span className="text-[7px] font-black">الختم الرسمي</span>
                        </div>
                      </div>
                    )}

                    {showSignatures && (
                      <div className="flex-1 grid grid-cols-2 gap-2 text-center mr-3">
                        <div>
                          <p className="text-muted-foreground mb-2">{customGuidanceName ? `المرشد: ${customGuidanceName}` : "المرشد الطلابي"}</p>
                          <p className="border-t border-dashed border-foreground/30 pt-0.5">التوقيع</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-2">{customPrincipalName ? `المدير: ${customPrincipalName}` : "مدير المدرسة والختم"}</p>
                          <p className="border-t border-dashed border-foreground/30 pt-0.5">الاعتماد</p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground font-bold text-xs">
                  لا توجد نتائج أو طلاب محددين لمعاينتهم حالياً
                </div>
              )}
            </div>

          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <span>إجمالي الطلاب المجهزين للطباعة:</span>
            <strong className="text-foreground text-sm font-black tabular-nums">{studentsToPrint.length}</strong>
            <span>طالب</span>
            {selectedScope === "single" && <span className="text-blue-500 font-bold">(وضع الطالب الفردي)</span>}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border/70 text-xs font-bold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              disabled={studentsToPrint.length === 0}
              onClick={handlePrintBatch}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>بدء طباعة {studentsToPrint.length} شهادة متتالية 🖨️</span>
            </button>
          </div>
        </div>

        {/* HIDDEN PRINTABLE CONTAINER FOR IFRAME PRINT */}
        <div id="printable-batch-certificates" style={{ display: "none" }}>
          {studentsToPrint.map((stData, sIdx) => (
            <div 
              key={stData.student.id} 
              className="cert-page"
              style={{
                pageBreakAfter: sIdx === studentsToPrint.length - 1 ? "auto" : "always",
                border: "2px solid #0f172a",
                borderRadius: "8px",
                padding: pageOrientation === "compact_2up" ? "6mm" : "10mm 12mm",
                margin: "0 auto",
                backgroundColor: "#ffffff",
                boxSizing: "border-box"
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0f172a", paddingBottom: "10px", marginBottom: "12px" }}>
                <div>
                  <h2 style={{ margin: "0 0 4px", fontSize: "14pt", fontWeight: 900, color: "#0f172a" }}>{customSchoolName}</h2>
                  <p style={{ margin: "0", fontSize: "9pt", color: "#475569", fontWeight: 800 }}>{customMinistryTitle}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "10pt", fontWeight: 900, color: "#0284c7" }}>إشعار نتيجة: {currentExam?.name} - العام 1446-1447 هـ</p>
                </div>
                {showLogo && (
                  <div style={{ width: "65px", height: "65px", border: "2px solid #0f172a", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24pt" }}>
                    🏫
                  </div>
                )}
              </div>

              {/* Student Info Box */}
              <table style={{ marginBottom: "12px", fontSize: "10pt" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "25%", backgroundColor: "#f8fafc", fontWeight: 800 }}>اسم الطالب:</td>
                    <td style={{ width: "25%", fontWeight: 900, fontSize: "11pt" }}>{stData.student.name}</td>
                    <td style={{ width: "25%", backgroundColor: "#f8fafc", fontWeight: 800 }}>الرقم الأكاديمي / الهوية:</td>
                    <td style={{ width: "25%", fontWeight: 900, fontFamily: "monospace" }}>{stData.student.nationalId || stData.student.id}</td>
                  </tr>
                  <tr>
                    <td style={{ backgroundColor: "#f8fafc", fontWeight: 800 }}>الصف والمرحلة:</td>
                    <td style={{ fontWeight: 800 }}>{grade}</td>
                    <td style={{ backgroundColor: "#f8fafc", fontWeight: 800 }}>الشعبة الدراسية:</td>
                    <td style={{ fontWeight: 800 }}>شعبة {stData.sectionName}</td>
                  </tr>
                </tbody>
              </table>

              {/* STRICT RULE: Subject Marks Table (NO individual verbal ratings) */}
              <table style={{ marginBottom: "12px", fontSize: "9.5pt" }}>
                <thead>
                  <tr>
                    <th style={{ width: "5%", textAlign: "center" }}>#</th>
                    <th style={{ width: "35%" }}>المادة الدراسية</th>
                    {showMaxPassScore && (
                      <>
                        <th style={{ width: "12%", textAlign: "center" }}>العظمى</th>
                        <th style={{ width: "12%", textAlign: "center" }}>النجاح</th>
                      </>
                    )}
                    <th style={{ width: "14%", textAlign: "center" }}>درجة الطالب</th>
                    {showSubjectPercentage && (
                      <th style={{ width: "14%", textAlign: "center" }}>النسبة %</th>
                    )}
                    {showSubjectStatus && (
                      <th style={{ width: "14%", textAlign: "center" }}>النتيجة</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {stData.subjectMarks.map((m, mIdx) => (
                    <tr key={mIdx}>
                      <td style={{ textAlign: "center" }}>{mIdx + 1}</td>
                      <td style={{ fontWeight: 800 }}>{m.subjectName}</td>
                      {showMaxPassScore && (
                        <>
                          <td style={{ textAlign: "center" }}>{m.maxScore}</td>
                          <td style={{ textAlign: "center" }}>{m.passScore}</td>
                        </>
                      )}
                      <td style={{ textAlign: "center", fontWeight: 900, fontSize: "11pt" }}>{m.mark}</td>
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

              {/* Total & Summary Standings */}
              <table style={{ marginBottom: "12px" }}>
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

              {/* Rank & Decision */}
              <div style={{ display: "flex", justifyContent: "space-between", border: "1px solid #cbd5e1", padding: "8px 12px", borderRadius: "6px", fontSize: "10pt", fontWeight: 800, marginBottom: "16px" }}>
                {showRank && (
                  <span>الترتيب على الصف: المركز {stData.rank} (من {stData.totalStudentsInGrade} طالباً)</span>
                )}
                {showDecision && (
                  <span>القرار الأكاديمي: {stData.isPassed ? "ناجح ومؤهل للانتقال للصف التالي" : "له دور ثانٍ"}</span>
                )}
              </div>

              {/* Custom Congratulatory Note */}
              {showCustomNote && customCongratulatoryNote && (
                <div style={{ border: "1px solid #fde68a", backgroundColor: "#fefce8", color: "#92400e", padding: "8px 12px", borderRadius: "6px", fontSize: "9.5pt", fontWeight: 700, textAlign: "center", marginBottom: "16px" }}>
                  {customCongratulatoryNote}
                </div>
              )}

              {/* Signatures & Seal */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto", paddingTop: "12px", borderTop: "2px solid #cbd5e1" }}>
                {showQrCode && (
                  <div style={{ width: "70px", textAlign: "center" }}>
                    <QRCode value={`Darasi-Sahel|Student:${stData.student.name}|Exam:${currentExam?.name}|Total:${stData.totalMarks}|Rank:${stData.rank}`} size={52} />
                    <p style={{ margin: "4px 0 0", fontSize: "7pt", color: "#64748b" }}>تحقق رقمي معتمد</p>
                  </div>
                )}

                {sealType !== "none" && sealType !== "watermark" && (
                  <div style={{ width: "70px", height: "70px", border: `2px dashed ${sealType === "gold" ? "#f59e0b" : "#2563eb"}`, borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: "7pt", fontWeight: 900, color: sealType === "gold" ? "#b45309" : "#1d4ed8" }}>
                    <span>🛡️</span>
                    <span>الختم الرسمي</span>
                  </div>
                )}

                {showSignatures && (
                  <div style={{ flex: 1, display: "flex", justifyContent: "space-around", textAlign: "center", fontSize: "9.5pt", fontWeight: 800 }}>
                    <div style={{ width: "35%" }}>
                      <p style={{ color: "#64748b", marginBottom: "30px" }}>{customGuidanceName ? `المرشد: ${customGuidanceName}` : "المرشد الطلابي / رائد الفصل"}</p>
                      <p style={{ borderTop: "1px dashed #94a3b8", paddingTop: "4px" }}>التوقيع: .....................</p>
                    </div>
                    <div style={{ width: "35%" }}>
                      <p style={{ color: "#64748b", marginBottom: "30px" }}>{customPrincipalName ? `المدير: ${customPrincipalName}` : "مدير المدرسة والختم الرسمي"}</p>
                      <p style={{ borderTop: "1px dashed #94a3b8", paddingTop: "4px" }}>الختم والتوقيع</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
