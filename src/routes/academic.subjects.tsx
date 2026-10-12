import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import {
  useGlobalStore,
  Subject,
  EducationalStage,
  Staff,
  Section,
} from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { DataTable } from "@/components/data-table";
import { AdminModal } from "@/components/admin/admin-modal";
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  GraduationCap,
  Users,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
  DollarSign,
  AlertTriangle,
  Award,
  ExternalLink,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  Calendar,
  BookCheck,
  ShieldCheck,
  Check,
  Copy,
  Printer,
  FileText,
  UserPlus,
  RefreshCcw,
  Library,
  ChevronRight,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/academic/subjects")({
  head: () => ({
    meta: [{ title: "المواد والخطط الدراسية والمناهج | منصة مدارس" }],
  }),
  component: AcademicSubjectsPage,
});

const STAGE_LABELS: Record<EducationalStage | "all", string> = {
  all: "جميع المراحل",
  kindergarten: "مرحلة الروضة",
  primary: "المرحلة الابتدائية",
  middle: "المرحلة المتوسطة",
  high: "المرحلة الثانوية",
};

const STAGE_BADGE_CLASSES: Record<EducationalStage | "all", string> = {
  all: "bg-muted text-foreground border-border/80",
  kindergarten: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25",
  primary: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  middle: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
  high: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
};

const ACADEMIC_DEPARTMENTS = [
  "الرياضيات",
  "العلوم الطبيعية",
  "اللغة العربية",
  "اللغات والترجمة",
  "الدراسات الإسلامية",
  "الحاسب والتقنية",
  "العلوم الاجتماعية",
  "الفنون والتربية البدنية",
] as const;

const GRADE_PRESETS: Record<EducationalStage, string[]> = {
  kindergarten: ["الروضة 1", "الروضة 2", "التمهيدي"],
  primary: ["الصف الأول", "الصف الثاني", "الصف الثالث", "الصف الرابع", "الصف الخامس", "الصف السادس"],
  middle: ["الصف الأول المتوسط", "الصف الثاني المتوسط", "الصف الثالث المتوسط"],
  high: ["الصف الأول الثانوي", "الصف الثاني الثانوي", "الصف الثالث الثانوي"],
};

function AcademicSubjectsPage() {
  const {
    allSubjects,
    addSubject,
    updateSubject,
    deleteSubject,
    allTeachingAssignments,
    addTeachingAssignment,
    deleteTeachingAssignment,
    allStaff,
    allSections,
    allBooks,
    allAcademicYears,
    allScheduleSlots,
    allExamSubjects,
    currency,
    addActivityLog,
    systemSettings,
  } = useGlobalStore();

  const { stage: activeStage } = useStage();

  // Search & Filter state
  const [q, setQ] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedAssignmentStatus, setSelectedAssignmentStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modals state
  const [addModal, setAddModal] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [subject360, setSubject360] = useState<Subject | null>(null);
  const [subject360Tab, setSubject360Tab] = useState<"overview" | "teachers" | "syllabus" | "textbooks">("overview");
  const [assignModalSubject, setAssignModalSubject] = useState<Subject | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Subject | null>(null);
  const [printCatalogModal, setPrintCatalogModal] = useState(false);

  // Form State for Add / Edit
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formCredits, setFormCredits] = useState<number>(3);
  const [formStage, setFormStage] = useState<EducationalStage | "all">("all");
  const [formDepartment, setFormDepartment] = useState<string>("الرياضيات");
  const [formType, setFormType] = useState<"mandatory" | "elective" | "extra">("mandatory");
  const [formMaxScore, setFormMaxScore] = useState<number>(100);
  const [formPassScore, setFormPassScore] = useState<number>(50);
  const [formFee, setFormFee] = useState<number>(0);
  const [formDescription, setFormDescription] = useState<string>("");
  const [formGrades, setFormGrades] = useState<string[]>([]);

  // Fast Assign Form
  const [assignTeacherId, setAssignTeacherId] = useState("");
  const [assignSectionId, setAssignSectionId] = useState("");
  const [assignYearId, setAssignYearId] = useState("");

  const currentAcademicYear = useMemo(() => {
    return allAcademicYears.find((y) => y.isCurrent) || allAcademicYears[0];
  }, [allAcademicYears]);

  // Handle stage sync toggle
  const syncWithGlobalStage = () => {
    if (activeStage) {
      setSelectedStage(activeStage);
      toast.success(`تمت المزامنة مع مرحلة: ${STAGE_LABELS[activeStage]}`);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setQ("");
    setSelectedStage("all");
    setSelectedDepartment("all");
    setSelectedType("all");
    setSelectedAssignmentStatus("all");
    toast.info("تمت استعادة إعدادات التصفية الافتراضية");
  };

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`تم نسخ كود المقرر: ${code}`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return allSubjects.filter((sub) => {
      // Stage filter
      if (selectedStage !== "all" && sub.stage !== "all" && sub.stage !== selectedStage) {
        return false;
      }
      // Department filter
      if (selectedDepartment !== "all" && (sub.department || "عام") !== selectedDepartment) {
        return false;
      }
      // Type filter
      if (selectedType !== "all" && (sub.type || "mandatory") !== selectedType) {
        return false;
      }
      // Assignment status filter
      if (selectedAssignmentStatus !== "all") {
        const hasTeachers = allTeachingAssignments.some((a) => a.subjectId === sub.id);
        if (selectedAssignmentStatus === "assigned" && !hasTeachers) return false;
        if (selectedAssignmentStatus === "unassigned" && hasTeachers) return false;
      }
      // Search term
      if (!q.trim()) return true;
      const term = q.trim().toLowerCase();
      const matchName = sub.name.toLowerCase().includes(term);
      const matchCode = sub.code.toLowerCase().includes(term);
      const matchId = sub.id.toLowerCase().includes(term);
      const matchDept = (sub.department || "").toLowerCase().includes(term);
      return matchName || matchCode || matchId || matchDept;
    });
  }, [allSubjects, selectedStage, selectedDepartment, selectedType, selectedAssignmentStatus, q, allTeachingAssignments]);

  // Statistics
  const stats = useMemo(() => {
    const total = allSubjects.length;
    const totalCredits = allSubjects.reduce((sum, s) => sum + (s.creditHours || 0), 0);
    const assignedIds = new Set(allTeachingAssignments.map((a) => a.subjectId));
    const assignedCount = allSubjects.filter((s) => assignedIds.has(s.id)).length;
    const unassignedCount = Math.max(0, total - assignedCount);
    const feeBearingCount = allSubjects.filter((s) => (s.fee || 0) > 0).length;
    const coveragePct = total > 0 ? Math.round((assignedCount / total) * 100) : 0;

    return {
      total,
      totalCredits,
      assignedCount,
      unassignedCount,
      feeBearingCount,
      coveragePct,
    };
  }, [allSubjects, allTeachingAssignments]);

  // Open Add Modal
  const openAddModal = () => {
    const autoCode = `SUB-${Math.floor(100 + Math.random() * 900)}`;
    setFormName("");
    setFormCode(autoCode);
    setFormCredits(4);
    setFormStage(activeStage || "all");
    setFormDepartment("الرياضيات");
    setFormType("mandatory");
    setFormMaxScore(100);
    setFormPassScore(50);
    setFormFee(0);
    setFormDescription("");
    setFormGrades([]);
    setAddModal(true);
  };

  // Open Edit Modal
  const openEditModal = (sub: Subject) => {
    setEditSubject(sub);
    setFormName(sub.name);
    setFormCode(sub.code);
    setFormCredits(sub.creditHours || 3);
    setFormStage(sub.stage);
    setFormDepartment(sub.department || "الرياضيات");
    setFormType(sub.type || "mandatory");
    setFormMaxScore(sub.maxScore || 100);
    setFormPassScore(sub.passScore || 50);
    setFormFee(sub.fee || 0);
    setFormDescription(sub.description || "");
    setFormGrades(sub.grades || []);
  };

  // Open Subject 360 View Modal
  const openSubject360 = (sub: Subject) => {
    setSubject360(sub);
    setSubject360Tab("overview");
  };

  // Open Fast Assign Modal
  const openAssignModal = (sub: Subject) => {
    setAssignModalSubject(sub);
    setAssignTeacherId("");
    setAssignSectionId("");
    setAssignYearId(currentAcademicYear?.id || "");
  };

  // Save Add
  const handleSaveAdd = () => {
    if (!formName.trim()) {
      toast.error("يرجى إدخال اسم المادة الدراسية");
      return;
    }
    if (!formCode.trim()) {
      toast.error("يرجى إدخال كود المادة");
      return;
    }

    addSubject({
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      creditHours: Number(formCredits) || 3,
      stage: formStage,
      department: formDepartment,
      type: formType,
      maxScore: Number(formMaxScore) || 100,
      passScore: Number(formPassScore) || 50,
      fee: Number(formFee) || 0,
      description: formDescription.trim(),
      grades: formGrades,
    });

    addActivityLog({
      user: "وكيل الشؤون التعليمية",
      action: "إضافة مقرر دراسي جديد",
      entity: "المواد والخطط الدراسية",
      details: `تمت إضافة المادة: ${formName.trim()} (${formCode.trim().toUpperCase()}) - ${STAGE_LABELS[formStage]}`,
    });

    toast.success(`تمت إضافة المقرر "${formName.trim()}" بنجاح`);
    setAddModal(false);
  };

  // Save Edit
  const handleSaveEdit = () => {
    if (!editSubject) return;
    if (!formName.trim()) {
      toast.error("يرجى إدخال اسم المادة الدراسية");
      return;
    }

    updateSubject(editSubject.id, {
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      creditHours: Number(formCredits) || 3,
      stage: formStage,
      department: formDepartment,
      type: formType,
      maxScore: Number(formMaxScore) || 100,
      passScore: Number(formPassScore) || 50,
      fee: Number(formFee) || 0,
      description: formDescription.trim(),
      grades: formGrades,
    });

    addActivityLog({
      user: "وكيل الشؤون التعليمية",
      action: "تعديل مقرر دراسي",
      entity: "المواد والخطط الدراسية",
      details: `تم تحديث بيانات المقرر: ${formName.trim()} (${editSubject.id})`,
    });

    toast.success(`تم تحديث مقرر "${formName.trim()}" بنجاح`);
    setEditSubject(null);
  };

  // Handle Fast Assign
  const handleSaveAssignment = () => {
    if (!assignModalSubject) return;
    if (!assignTeacherId) {
      toast.error("يرجى اختيار المعلم المراد إسناد المادة له");
      return;
    }
    if (!assignSectionId) {
      toast.error("يرجى اختيار الشعبة الدراسية");
      return;
    }

    const teacher = allStaff.find((s) => s.id === assignTeacherId);
    const section = allSections.find((s) => s.id === assignSectionId);

    // Check duplicate assignment
    const alreadyAssigned = allTeachingAssignments.some(
      (a) =>
        a.subjectId === assignModalSubject.id &&
        a.sectionId === assignSectionId &&
        a.teacherId === assignTeacherId
    );

    if (alreadyAssigned) {
      toast.error(`المعلم ${teacher?.name || ""} مسند بالفعل لهذه الشعبة والمادة`);
      return;
    }

    addTeachingAssignment({
      subjectId: assignModalSubject.id,
      teacherId: assignTeacherId,
      sectionId: assignSectionId,
      yearId: assignYearId || currentAcademicYear?.id || "YEAR-2024",
      stage: section?.stage || (assignModalSubject.stage === "all" ? "primary" : assignModalSubject.stage),
    });

    addActivityLog({
      user: "وكيل الشؤون التعليمية",
      action: "إسناد مادة دراسية",
      entity: "الخطة الدراسية والكوادر",
      details: `تم إسناد مادة [${assignModalSubject.name}] للمعلم [${teacher?.name || ""}] لشعبة [${section?.name || ""}]`,
    });

    toast.success(`تم إسناد مادة ${assignModalSubject.name} للمعلم ${teacher?.name} بنجاح`);
    setAssignModalSubject(null);
  };

  // Remove assignment directly
  const handleRemoveAssignment = (assignmentId: string, teacherName?: string) => {
    deleteTeachingAssignment(assignmentId);
    addActivityLog({
      user: "وكيل الشؤون التعليمية",
      action: "إلغاء إسناد مادة",
      entity: "الخطة الدراسية والكوادر",
      details: `تم إلغاء إسناد تدريسي للمعلم [${teacherName || ""}]`,
    });
    toast.success("تم إلغاء الإسناد التدريسي بنجاح");
  };

  // Handle Delete
  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteSubject(deleteConfirm.id);

    addActivityLog({
      user: "مدير النظام",
      action: "حذف مقرر دراسي",
      entity: "المواد والخطط الدراسية",
      details: `تم حذف مقرر: ${deleteConfirm.name} (${deleteConfirm.id})`,
    });

    toast.success(`تم حذف مقرر "${deleteConfirm.name}" بنجاح`);
    setDeleteConfirm(null);
  };

  // Grade toggle helper for Add/Edit
  const toggleGradeSelection = (gradeName: string) => {
    setFormGrades((prev) =>
      prev.includes(gradeName) ? prev.filter((g) => g !== gradeName) : [...prev, gradeName]
    );
  };

  // Available grades for the selected stage in form
  const availableFormGrades = useMemo(() => {
    if (formStage === "all") {
      return Object.values(GRADE_PRESETS).flat();
    }
    return GRADE_PRESETS[formStage] || [];
  }, [formStage]);

  // Teachers list for fast assignment
  const eligibleTeachers = useMemo(() => {
    return allStaff.filter((s) => !s.isDeleted && (s.role.includes("معلم") || s.role.includes("أستاذ") || s.role.includes("تدريس") || s.department.includes("تعليم")));
  }, [allStaff]);

  // Sections for fast assignment
  const eligibleSections = useMemo(() => {
    if (!assignModalSubject) return allSections;
    if (assignModalSubject.stage === "all") return allSections;
    return allSections.filter((s) => s.stage === assignModalSubject.stage);
  }, [allSections, assignModalSubject]);

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الإدارة الأكاديمية", to: "/academic/classes" },
        { label: "المواد والخطط الدراسية" },
      ]}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setPrintCatalogModal(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold text-foreground hover:bg-accent transition-all shadow-sm"
          >
            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
            طباعة الخطة المعتمدة
          </button>

          <Link
            to="/academic/assignments"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold text-foreground hover:bg-accent transition-all shadow-sm"
          >
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
            مركز الإسناد التدريسي
          </Link>

          <button
            onClick={openAddModal}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
          >
            <Plus className="h-4 w-4" /> إضافة مقرر جديد
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Header Ribbon */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border/70 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center shadow-inner border border-primary/20 shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  المواد والخطط الدراسية والمناهج
                </h1>
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {stats.total} مقرر معتمد
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-muted-foreground mt-0.5">
                توزيع الخطط الأسبوعية، الحصص المعتمدة، ربط الكوادر التعليمية، والمخرجات الأكاديمية
              </p>
            </div>
          </div>

          {/* Quick Sub-navigation / Stage info */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border/80">
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "table"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="عرض جدول البيانات"
              >
                <TableIcon className="h-3.5 w-3.5" /> جدول
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "grid"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="عرض بطاقات تفاعلية"
              >
                <LayoutGrid className="h-3.5 w-3.5" /> بطاقات
              </button>
            </div>

            {activeStage && (
              <button
                onClick={syncWithGlobalStage}
                className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="مزامنة التصفية مع المرحلة النشطة في الشريط العلوي"
              >
                <RefreshCcw className="h-3.5 w-3.5 text-primary" />
                مزامنة ({STAGE_LABELS[activeStage]})
              </button>
            )}
          </div>
        </div>

        {/* 5-Card Analytics KPI Ribbon */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Card 1: Total Subjects */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground">إجمالي المواد المقررة</span>
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black tabular-nums">{stats.total}</p>
              <span className="text-[11px] font-bold text-muted-foreground">
                كافة المراحل
              </span>
            </div>
          </div>

          {/* Card 2: Weekly Periods */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-success/40 hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground">إجمالي الحصص الأسبوعية</span>
              <div className="h-8 w-8 rounded-xl bg-success/10 text-success flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-success tabular-nums">
                {stats.totalCredits} <span className="text-sm font-bold">حصة</span>
              </p>
              <span className="text-[11px] font-bold text-muted-foreground">
                ~{(stats.total > 0 ? (stats.totalCredits / stats.total).toFixed(1) : 0)} حصة/مادة
              </span>
            </div>
          </div>

          {/* Card 3: Staffing Coverage */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-info/40 hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground">نسبة التغطية بالمعلمين</span>
              <div className="h-8 w-8 rounded-xl bg-info/10 text-info flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-info tabular-nums">
                %{stats.coveragePct}
              </p>
              <span className="text-[11px] font-bold text-muted-foreground">
                {stats.assignedCount} من {stats.total} مادة
              </span>
            </div>
          </div>

          {/* Card 4: Unassigned Gap */}
          <div
            onClick={() => setSelectedAssignmentStatus("unassigned")}
            className="cursor-pointer rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-warning/40 hover:shadow-md"
            title="انقر لتصفية المواد الشاغرة بانتظار إسناد"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground">مواد بانتظار معلّم</span>
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                stats.unassignedCount > 0 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-success/10 text-success"
              }`}>
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className={`text-2xl font-black tabular-nums ${
                stats.unassignedCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-success"
              }`}>
                {stats.unassignedCount}
              </p>
              <span className="text-[11px] font-bold text-muted-foreground">
                {stats.unassignedCount > 0 ? "تحتاج تغطية" : "مغطاة بالكامل"}
              </span>
            </div>
          </div>

          {/* Card 5: Lab / Extra Fees */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-purple-500/40 hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground">مواد برسوم معامل</span>
              <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 tabular-nums">
                {stats.feeBearingCount}
              </p>
              <span className="text-[11px] font-bold text-muted-foreground">
                معامل وأنشطة
              </span>
            </div>
          </div>
        </div>

        {/* Search & Comprehensive Filters */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
            {/* Search */}
            <div className="relative lg:col-span-4">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث باسم المقرر، كود المادة، القسم، أو المعرف..."
                className="h-11 w-full rounded-xl border border-border/80 bg-background ps-10 pe-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Stage filter (Properly supports kindergarten, primary, middle, high) */}
            <div className="lg:col-span-2">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm transition-all focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="all">كافة المراحل الدراسية</option>
                <option value="kindergarten">مرحلة الروضة والتمهيدي</option>
                <option value="primary">المرحلة الابتدائية</option>
                <option value="middle">المرحلة المتوسطة</option>
                <option value="high">المرحلة الثانوية</option>
              </select>
            </div>

            {/* Academic Department filter */}
            <div className="lg:col-span-2">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm transition-all focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="all">كافة الأقسام الأكاديمية</option>
                {ACADEMIC_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Type filter */}
            <div className="lg:col-span-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm transition-all focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="all">كافة الأنواع (إجباري / اختياري)</option>
                <option value="mandatory">مقررات إجبارية</option>
                <option value="elective">مقررات اختيارية</option>
                <option value="extra">أنشطة إضافية</option>
              </select>
            </div>

            {/* Assignment Status filter */}
            <div className="lg:col-span-2 flex items-center gap-2">
              <select
                value={selectedAssignmentStatus}
                onChange={(e) => setSelectedAssignmentStatus(e.target.value)}
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm transition-all focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="all">حالة الإسناد (الكل)</option>
                <option value="assigned">مسندة لمعلمين</option>
                <option value="unassigned">غير مسندة (شاغرة)</option>
              </select>

              {(q || selectedStage !== "all" || selectedDepartment !== "all" || selectedType !== "all" || selectedAssignmentStatus !== "all") && (
                <button
                  onClick={resetFilters}
                  className="h-11 px-3 rounded-xl border border-border/80 hover:bg-accent text-xs font-bold text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                  title="إلغاء التصفية"
                >
                  <RefreshCcw className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* View Mode 1: Table View */}
        {viewMode === "table" ? (
          <PageCard>
            <DataTable
              rows={filteredSubjects}
              pageSize={20}
              columns={[
                {
                  key: "code",
                  header: "كود المقرر",
                  cell: (s) => (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyCode(s.code)}
                        className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-muted/70 hover:bg-muted border border-border/70 text-foreground transition-all flex items-center gap-1 group"
                        title="انقر لنسخ كود المادة"
                      >
                        <span>{s.code}</span>
                        {copiedCode === s.code ? (
                          <Check className="h-3 w-3 text-success shrink-0" />
                        ) : (
                          <Copy className="h-3 w-3 opacity-40 group-hover:opacity-100 shrink-0" />
                        )}
                      </button>
                    </div>
                  ),
                },
                {
                  key: "name",
                  header: "اسم المقرر الدراسي والقسم",
                  cell: (s) => (
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 shadow-inner">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-black text-sm text-foreground flex items-center gap-2">
                          <button
                            onClick={() => openSubject360(s)}
                            className="hover:underline hover:text-primary text-start transition-colors"
                          >
                            {s.name}
                          </button>
                          {s.type === "elective" && (
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              اختياري
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          <span className="font-bold text-primary/80">{s.department || "عام"}</span>
                          <span>•</span>
                          <span className="font-mono text-[10px]">{s.id}</span>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: "stage",
                  header: "المرحلة والصفوف",
                  cell: (s) => (
                    <div>
                      <span className={`inline-block text-xs font-black px-2.5 py-0.5 rounded-lg border ${STAGE_BADGE_CLASSES[s.stage]}`}>
                        {STAGE_LABELS[s.stage] || s.stage}
                      </span>
                      {s.grades && s.grades.length > 0 && (
                        <div className="text-[11px] text-muted-foreground font-bold mt-1 line-clamp-1 max-w-[160px]" title={s.grades.join("، ")}>
                          {s.grades.slice(0, 2).join("، ")}
                          {s.grades.length > 2 ? ` (+${s.grades.length - 2})` : ""}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: "creditHours",
                  header: "الحصص الأسبوعية",
                  cell: (s) => (
                    <div className="flex items-center gap-1.5 text-xs font-black text-foreground">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{s.creditHours || 3} حصص / أسبوع</span>
                    </div>
                  ),
                },
                {
                  key: "scoring",
                  header: "التقييم والنجاح",
                  cell: (s) => (
                    <div className="text-xs">
                      <div className="font-black text-foreground">
                        {s.maxScore || 100} درجة
                      </div>
                      <div className="text-[11px] text-muted-foreground font-bold">
                        النجاح من {s.passScore || 50}
                      </div>
                    </div>
                  ),
                },
                {
                  key: "teachers",
                  header: "المعلمون المسندون",
                  cell: (s) => {
                    const assignments = allTeachingAssignments.filter((a) => a.subjectId === s.id);
                    const teachers = Array.from(
                      new Set(
                        assignments
                          .map((a) => allStaff.find((st) => st.id === (a.teacherId || (a as any).staffId)))
                          .filter(Boolean) as Staff[]
                      )
                    );

                    return (
                      <div className="text-xs">
                        {teachers.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1.5 rtl:space-x-reverse overflow-hidden">
                              {teachers.slice(0, 3).map((t, idx) => (
                                <div
                                  key={idx}
                                  className="h-6 w-6 rounded-full bg-primary/20 text-primary border-2 border-background flex items-center justify-center font-black text-[10px]"
                                  title={t.name}
                                >
                                  {t.name.charAt(0)}
                                </div>
                              ))}
                            </div>
                            <span className="font-bold text-foreground line-clamp-1">
                              {teachers.map((t) => t.name).slice(0, 2).join("، ")}
                              {teachers.length > 2 ? ` (+${teachers.length - 2})` : ""}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => openAssignModal(s)}
                            className="inline-flex items-center gap-1 text-warning-foreground font-bold hover:underline"
                            title="انقر لإسناد معلم فوراً"
                          >
                            <AlertTriangle className="h-3 w-3" /> بانتظار إسناد
                          </button>
                        )}
                      </div>
                    );
                  },
                },
                {
                  key: "fee",
                  header: "رسوم إضافية",
                  cell: (s) => (
                    <span className="text-xs font-bold">
                      {s.fee ? (
                        <span className="text-purple-600 dark:text-purple-400 font-black">
                          {s.fee.toLocaleString()} {currency}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">بدون رسوم</span>
                      )}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  header: "الإجراءات",
                  cell: (s) => (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openSubject360(s)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                        title="الملف الأكاديمي الشامل للمقرر"
                      >
                        <Info className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => openAssignModal(s)}
                        className="p-1.5 rounded-lg hover:bg-success/10 text-muted-foreground hover:text-success transition-colors"
                        title="إسناد معلمين وشعب"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                        title="تعديل المقرر"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirm(s)}
                        className="p-1.5 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors"
                        title="حذف المقرر"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
              empty="لا توجد مقررات دراسية مسجلة مطابقة لمعايير البحث."
            />
          </PageCard>
        ) : (
          /* View Mode 2: Interactive Grid Cards View */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSubjects.map((s) => {
              const assignments = allTeachingAssignments.filter((a) => a.subjectId === s.id);
              const teachers = Array.from(
                new Set(
                  assignments
                    .map((a) => allStaff.find((st) => st.id === (a.teacherId || (a as any).staffId)))
                    .filter(Boolean) as Staff[]
                )
              );

              return (
                <div
                  key={s.id}
                  className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md flex flex-col justify-between group"
                >
                  <div className="space-y-3.5">
                    {/* Card Top: Code & Stage */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleCopyCode(s.code)}
                        className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-muted/80 text-foreground border border-border/60 flex items-center gap-1 hover:bg-muted"
                        title="نسخ الكود"
                      >
                        <span>{s.code}</span>
                        {copiedCode === s.code ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3 opacity-40" />}
                      </button>

                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-lg border ${STAGE_BADGE_CLASSES[s.stage]}`}>
                        {STAGE_LABELS[s.stage] || s.stage}
                      </span>
                    </div>

                    {/* Card Title & Department */}
                    <div>
                      <h3
                        onClick={() => openSubject360(s)}
                        className="font-black text-base text-foreground cursor-pointer group-hover:text-primary transition-colors line-clamp-1"
                      >
                        {s.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-primary/80">{s.department || "عام"}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-xs font-bold text-muted-foreground">
                          {s.type === "elective" ? "مقرر اختياري" : "مقرر إجباري"}
                        </span>
                      </div>
                    </div>

                    {/* Card Description */}
                    {s.description && (
                      <p className="text-xs font-medium text-muted-foreground line-clamp-2 leading-relaxed">
                        {s.description}
                      </p>
                    )}

                    {/* Specifications Ribbon */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/60 text-center">
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground">الحصص</div>
                        <div className="text-xs font-black text-foreground mt-0.5">{s.creditHours || 3} أسبوعياً</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground">العظمى</div>
                        <div className="text-xs font-black text-foreground mt-0.5">{s.maxScore || 100} درجة</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground">الرسوم</div>
                        <div className="text-xs font-black text-foreground mt-0.5">
                          {s.fee ? `${s.fee} ${currency}` : "مجاناً"}
                        </div>
                      </div>
                    </div>

                    {/* Teachers Staffing */}
                    <div className="pt-2 border-t border-border/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-muted-foreground">المعلمون:</span>
                        {teachers.length > 0 ? (
                          <span className="font-black text-foreground">
                            {teachers.map((t) => t.name).slice(0, 2).join("، ")}
                            {teachers.length > 2 ? ` (+${teachers.length - 2})` : ""}
                          </span>
                        ) : (
                          <button
                            onClick={() => openAssignModal(s)}
                            className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
                          >
                            <AlertTriangle className="h-3 w-3" /> بانتظار إسناد
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Bottom */}
                  <div className="pt-4 mt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openSubject360(s)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                    >
                      <Info className="h-3.5 w-3.5" /> الملف الكامل
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openAssignModal(s)}
                        className="p-1.5 rounded-lg hover:bg-success/10 text-muted-foreground hover:text-success transition-colors"
                        title="إسناد معلمين"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                        title="تعديل"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(s)}
                        className="p-1.5 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 1: Add Subject (AdminModal tone="primary") ─────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <AdminModal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        title="إضافة مقرر دراسي جديد إلى الخطة المنهجية"
        subtitle="تحديد كود المادة، القسم، الحصص الأسبوعية، المرحلة، ونظام الدرجات"
        icon={BookOpen}
        tone="primary"
        size="large"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                اسم المقرر الدراسي <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="مثال: الرياضيات العامة، الكيمياء العضوية"
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  كود المقرر <span className="text-danger">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setFormCode(`SUB-${Math.floor(100 + Math.random() * 900)}`)}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  توليد كود تلقائي
                </button>
              </div>
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="مثال: MATH-101"
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold font-mono shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">القسم الأكاديمي</label>
              <select
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value)}
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm cursor-pointer focus:border-primary focus:outline-none"
              >
                {ACADEMIC_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">المرحلة الدراسية</label>
              <select
                value={formStage}
                onChange={(e) => setFormStage(e.target.value as any)}
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm cursor-pointer focus:border-primary focus:outline-none"
              >
                <option value="all">جميع المراحل</option>
                <option value="kindergarten">مرحلة الروضة والتمهيدي</option>
                <option value="primary">المرحلة الابتدائية</option>
                <option value="middle">المرحلة المتوسطة</option>
                <option value="high">المرحلة الثانوية</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">نوع المقرر</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm cursor-pointer focus:border-primary focus:outline-none"
              >
                <option value="mandatory">إجباري (أساسي)</option>
                <option value="elective">اختياري</option>
                <option value="extra">نشاط صفي إضافي</option>
              </select>
            </div>
          </div>

          {/* Grades Target Checkboxes */}
          <div className="space-y-2 p-3.5 rounded-xl bg-muted/30 border border-border/70">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                الصفوف الدراسية المستهدفة بالمقرر:
              </label>
              <button
                type="button"
                onClick={() => setFormGrades(availableFormGrades)}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                تحديد كافة صفوف المرحلة
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {availableFormGrades.map((grade) => {
                const isSelected = formGrades.includes(grade);
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => toggleGradeSelection(grade)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background text-foreground border-border/80 hover:bg-accent"
                    }`}
                  >
                    {grade}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">الحصص الأسبوعية</label>
              <input
                type="number"
                value={formCredits}
                onChange={(e) => setFormCredits(Math.max(1, Number(e.target.value)))}
                min={1}
                max={15}
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">الدرجة العظمى</label>
              <input
                type="number"
                value={formMaxScore}
                onChange={(e) => setFormMaxScore(Number(e.target.value))}
                min={10}
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">درجة النجاح</label>
              <input
                type="number"
                value={formPassScore}
                onChange={(e) => setFormPassScore(Number(e.target.value))}
                min={1}
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              رسوم المعامل أو الأنشطة الإضافية ({currency})
            </label>
            <input
              type="number"
              value={formFee}
              onChange={(e) => setFormFee(Math.max(0, Number(e.target.value)))}
              min={0}
              placeholder="0 في حال عدم وجود رسوم معملية"
              className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">وصف ومخرجات التعلم للمقرر</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="أهداف المقرر الدراسي والمهارات المكتسبة لدى الطلاب..."
              rows={3}
              className="w-full rounded-xl border border-border/80 bg-background p-3 text-xs font-medium shadow-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setAddModal(false)}
              className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border hover:bg-accent transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSaveAdd}
              className="rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
            >
              حفظ المقرر الجديد
            </button>
          </div>
        </div>
      </AdminModal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 2: Edit Subject (AdminModal tone="primary") ────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {editSubject && (
        <AdminModal
          isOpen={true}
          onClose={() => setEditSubject(null)}
          title={`تعديل بيانات المقرر: ${editSubject.name}`}
          subtitle={`المعرف الرقمي: ${editSubject.id}`}
          icon={Edit2}
          tone="primary"
          size="large"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">اسم المادة</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">كود المادة</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold font-mono shadow-sm focus:border-primary focus:outline-none uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">القسم الأكاديمي</label>
                <select
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm cursor-pointer focus:border-primary focus:outline-none"
                >
                  {ACADEMIC_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">المرحلة الدراسية</label>
                <select
                  value={formStage}
                  onChange={(e) => setFormStage(e.target.value as any)}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm cursor-pointer focus:border-primary focus:outline-none"
                >
                  <option value="all">جميع المراحل</option>
                  <option value="kindergarten">مرحلة الروضة والتمهيدي</option>
                  <option value="primary">المرحلة الابتدائية</option>
                  <option value="middle">المرحلة المتوسطة</option>
                  <option value="high">المرحلة الثانوية</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">نوع المقرر</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm cursor-pointer focus:border-primary focus:outline-none"
                >
                  <option value="mandatory">إجباري (أساسي)</option>
                  <option value="elective">اختياري</option>
                  <option value="extra">نشاط صفي إضافي</option>
                </select>
              </div>
            </div>

            {/* Grades Target Checkboxes */}
            <div className="space-y-2 p-3.5 rounded-xl bg-muted/30 border border-border/70">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  الصفوف الدراسية المقررة:
                </label>
                <button
                  type="button"
                  onClick={() => setFormGrades(availableFormGrades)}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  تحديد الكل
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {availableFormGrades.map((grade) => {
                  const isSelected = formGrades.includes(grade);
                  return (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => toggleGradeSelection(grade)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background text-foreground border-border/80 hover:bg-accent"
                      }`}
                    >
                      {grade}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">الحصص الأسبوعية</label>
                <input
                  type="number"
                  value={formCredits}
                  onChange={(e) => setFormCredits(Math.max(1, Number(e.target.value)))}
                  min={1}
                  max={15}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">الدرجة العظمى</label>
                <input
                  type="number"
                  value={formMaxScore}
                  onChange={(e) => setFormMaxScore(Number(e.target.value))}
                  min={10}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">درجة النجاح</label>
                <input
                  type="number"
                  value={formPassScore}
                  onChange={(e) => setFormPassScore(Number(e.target.value))}
                  min={1}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">رسوم إضافية ({currency})</label>
              <input
                type="number"
                value={formFee}
                onChange={(e) => setFormFee(Math.max(0, Number(e.target.value)))}
                min={0}
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">وصف المقرر ومخرجاته</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border/80 bg-background p-3 text-xs font-medium shadow-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditSubject(null)}
                className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border hover:bg-accent transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                تحديث بيانات المقرر
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 3: Subject 360 Full Profile (AdminModal size="large") ─ */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {subject360 && (
        <AdminModal
          isOpen={true}
          onClose={() => setSubject360(null)}
          title={`الملف الأكاديمي الشامل للمقرر: ${subject360.name}`}
          subtitle={`كود المادة: ${subject360.code} • ${STAGE_LABELS[subject360.stage] || subject360.stage}`}
          icon={BookOpen}
          tone="primary"
          size="large"
        >
          <div className="space-y-4">
            {/* Tabs Bar inside modal */}
            <div className="flex border-b border-border/80 gap-4">
              <button
                onClick={() => setSubject360Tab("overview")}
                className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${
                  subject360Tab === "overview"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                نظرة عامة ومواصفات
              </button>

              <button
                onClick={() => setSubject360Tab("teachers")}
                className={`pb-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  subject360Tab === "teachers"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>المعلمون والشعب</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/10 text-primary">
                  {allTeachingAssignments.filter((a) => a.subjectId === subject360.id).length}
                </span>
              </button>

              <button
                onClick={() => setSubject360Tab("syllabus")}
                className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${
                  subject360Tab === "syllabus"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                خطة توزيع المنهج
              </button>

              <button
                onClick={() => setSubject360Tab("textbooks")}
                className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${
                  subject360Tab === "textbooks"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                المقررات والكتب المرتبطة
              </button>
            </div>

            {/* Tab 1: Overview */}
            {subject360Tab === "overview" && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                    <span className="text-[10px] font-bold text-muted-foreground">القسم الأكاديمي</span>
                    <p className="text-sm font-black text-foreground mt-0.5">{subject360.department || "عام"}</p>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                    <span className="text-[10px] font-bold text-muted-foreground">الحصص الأسبوعية</span>
                    <p className="text-sm font-black text-foreground mt-0.5">{subject360.creditHours || 3} حصص</p>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                    <span className="text-[10px] font-bold text-muted-foreground">نظام التقييم</span>
                    <p className="text-sm font-black text-foreground mt-0.5">
                      {subject360.maxScore || 100} / نجاح: {subject360.passScore || 50}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                    <span className="text-[10px] font-bold text-muted-foreground">رسوم المعامل</span>
                    <p className="text-sm font-black text-foreground mt-0.5">
                      {subject360.fee ? `${subject360.fee} ${currency}` : "بدون رسوم"}
                    </p>
                  </div>
                </div>

                {subject360.description && (
                  <div className="rounded-xl border border-border/70 bg-card p-4 space-y-1">
                    <span className="text-xs font-bold text-foreground">وصف المقرر ومخرجات التعلم:</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{subject360.description}</p>
                  </div>
                )}

                <div className="rounded-xl border border-border/70 bg-card p-4 space-y-2">
                  <span className="text-xs font-bold text-foreground">الصفوف المقررة للمادة:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {subject360.grades && subject360.grades.length > 0 ? (
                      subject360.grades.map((gr, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-muted text-xs font-bold text-foreground border border-border/60">
                          {gr}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">كافة صفوف المرحلة</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Assigned Teachers & Sections */}
            {subject360Tab === "teachers" && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">
                    قائمة الكوادر المسند إليها تدريس هذا المقرر:
                  </span>
                  <button
                    onClick={() => {
                      setSubject360(null);
                      openAssignModal(subject360);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> إضافة إسناد جديد
                  </button>
                </div>

                {allTeachingAssignments.filter((a) => a.subjectId === subject360.id).length === 0 ? (
                  <div className="text-center p-8 rounded-xl border border-dashed border-border text-muted-foreground space-y-2">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground/50" />
                    <p className="text-xs font-bold">لا يوجد معلّمون مسندون لهذا المقرر حالياً.</p>
                    <button
                      onClick={() => {
                        setSubject360(null);
                        openAssignModal(subject360);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
                    >
                      إسناد معلم الآن
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allTeachingAssignments
                      .filter((a) => a.subjectId === subject360.id)
                      .map((assignment) => {
                        const staff = allStaff.find((s) => s.id === (assignment.teacherId || (assignment as any).staffId));
                        const section = allSections.find((sec) => sec.id === assignment.sectionId);

                        return (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card hover:bg-accent/40 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                                {staff?.name?.charAt(0) || "م"}
                              </div>
                              <div>
                                <div className="text-xs font-black text-foreground">{staff?.name || "معلم غير محدد"}</div>
                                <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                                  <span>الشعبة: {section ? `${section.grade} - ${section.name}` : "عام"}</span>
                                  <span>•</span>
                                  <span className="font-mono">{assignment.id}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleRemoveAssignment(assignment.id, staff?.name)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                              title="إلغاء هذا الإسناد"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Syllabus Units */}
            {subject360Tab === "syllabus" && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">خطة الوحدات والموضوعات الدراسية المعتمدة:</span>
                </div>

                {subject360.syllabusUnits && subject360.syllabusUnits.length > 0 ? (
                  <div className="space-y-2.5">
                    {subject360.syllabusUnits.map((unit) => (
                      <div key={unit.unitNumber} className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-primary">
                            الوحدة {unit.unitNumber}: {unit.title}
                          </span>
                          <span className="text-[11px] font-bold text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
                            {unit.weeks}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-bold">
                          الساعات التدريسية المخصصة: {unit.hours} ساعة
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                    خطة المنهج التفصيلية متزامنة تلقائياً مع الخطة الوزارية المعتمدة لهذا الفصل.
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Linked Textbooks */}
            {subject360Tab === "textbooks" && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-muted-foreground">الكتب والمصادر الدراسية المسجلة بالمكتبة:</span>
                {allBooks.length > 0 ? (
                  <div className="space-y-2">
                    {allBooks
                      .filter((b) => b.title.includes(subject360.name) || (b.category && b.category.includes(subject360.department || "")))
                      .slice(0, 4)
                      .map((book) => (
                        <div key={book.id} className="p-3 rounded-xl border border-border/70 bg-card flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <BookCheck className="h-4 w-4 text-primary" />
                            <div>
                              <div className="text-xs font-black text-foreground">{book.title}</div>
                              <div className="text-[11px] text-muted-foreground">{book.author}</div>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-success/10 text-success border border-success/20">
                            متاح: {book.available} نسخة
                          </span>
                        </div>
                      ))}
                    {allBooks.filter((b) => b.title.includes(subject360.name) || (b.category && b.category.includes(subject360.department || ""))).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        لا توجد كتب دراسية مخصصة مرتبطة بهذا المقرر حالياً.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">لا توجد كتب مسجلة في المكتبة حالياً.</p>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSubject360(null)}
                className="rounded-xl px-5 py-2 text-xs font-bold border border-border hover:bg-accent transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 4: Fast Teacher Assignment (AdminModal tone="success") ─ */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {assignModalSubject && (
        <AdminModal
          isOpen={true}
          onClose={() => setAssignModalSubject(null)}
          title={`إسناد مقرر: ${assignModalSubject.name}`}
          subtitle={`اختيار المعلم والشعبة الأكاديمية المستهدفة لهذا المقرر`}
          icon={UserPlus}
          tone="success"
          size="medium"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 text-xs space-y-1">
              <div className="font-black text-foreground">معلومات المقرر:</div>
              <div className="text-muted-foreground flex items-center gap-2">
                <span>الكود: {assignModalSubject.code}</span>
                <span>•</span>
                <span>المرحلة: {STAGE_LABELS[assignModalSubject.stage]}</span>
                <span>•</span>
                <span>الحصص: {assignModalSubject.creditHours || 3} حصص/أسبوع</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                المعلم المستهدف <span className="text-danger">*</span>
              </label>
              <select
                value={assignTeacherId}
                onChange={(e) => setAssignTeacherId(e.target.value)}
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm cursor-pointer focus:border-primary focus:outline-none"
              >
                <option value="">-- اختر المعلم --</option>
                {eligibleTeachers.map((t) => {
                  const currentLoad = allTeachingAssignments.filter((a) => a.teacherId === t.id).length;
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.department || "تعليم"} • مُسند له {currentLoad} شعب)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                الشعبة الدراسية <span className="text-danger">*</span>
              </label>
              <select
                value={assignSectionId}
                onChange={(e) => setAssignSectionId(e.target.value)}
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm cursor-pointer focus:border-primary focus:outline-none"
              >
                <option value="">-- اختر الشعبة الدراسية --</option>
                {eligibleSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.grade} - {sec.name} ({STAGE_LABELS[sec.stage]})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">العام الدراسي</label>
              <select
                value={assignYearId}
                onChange={(e) => setAssignYearId(e.target.value)}
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm cursor-pointer focus:border-primary focus:outline-none"
              >
                {allAcademicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.isCurrent ? "(الحالي)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAssignModalSubject(null)}
                className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border hover:bg-accent transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveAssignment}
                className="rounded-xl bg-success px-6 py-2.5 text-xs font-bold text-white hover:bg-success/90 transition-all shadow-md shadow-success/20"
              >
                تثبيت الإسناد
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 5: Delete Subject Confirmation (tone="danger") ─────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {deleteConfirm && (
        <AdminModal
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          title="حذف المقرر الدراسي"
          subtitle="تأكيد حذف المقرر وفحص الارتباطات الأكاديمية"
          icon={Trash2}
          tone="danger"
          size="medium"
        >
          <div className="space-y-4">
            <div className="text-sm text-foreground leading-relaxed">
              هل أنت متأكد من رغبتك في حذف مقرر{" "}
              <strong className="text-danger font-black font-mono">
                "{deleteConfirm.name}" ({deleteConfirm.code})
              </strong>
              ؟
            </div>

            {/* Dependency Checks */}
            {(() => {
              const assignedCount = allTeachingAssignments.filter((a) => a.subjectId === deleteConfirm.id).length;
              const slotsCount = allScheduleSlots.filter((s) => s.subjectId === deleteConfirm.id).length;
              const examCount = allExamSubjects.filter((e) => e.subjectId === deleteConfirm.id).length;

              const hasDependencies = assignedCount > 0 || slotsCount > 0 || examCount > 0;

              return (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    hasDependencies
                      ? "bg-danger/10 border-danger/30 text-danger"
                      : "bg-muted/40 border-border/70 text-muted-foreground"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>فحص السجلات والارتباطات:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 ps-1">
                    <li>إسنادات المعلمين المرتبطة: {assignedCount} إسناد</li>
                    <li>حصص الجدول الأسبوعي: {slotsCount} حصة مجدولة</li>
                    <li>جداول الاختبارات المسجلة: {examCount} اختبار مقرر</li>
                  </ul>
                  {hasDependencies && (
                    <p className="font-bold text-[11px] pt-1 border-t border-danger/20">
                      تنبيه: سيؤدي الحذف إلى تأثر الجداول الدراسية وسجلات الإسناد المرتبطة بهذا المقرر.
                    </p>
                  )}
                </div>
              );
            })()}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-border py-2.5 text-xs font-bold hover:bg-accent transition-colors"
              >
                إلغاء الأمر
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-danger py-2.5 text-xs font-bold text-white hover:bg-danger/90 transition-all shadow-md shadow-danger/20"
              >
                تأكيد حذف المقرر نهائياً
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 6: Print & Export Curriculum Catalog ───────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {printCatalogModal && (
        <AdminModal
          isOpen={true}
          onClose={() => setPrintCatalogModal(false)}
          title="معاينة وطباعة خطة المواد والمناهج الدراسية المعتمدة"
          subtitle="كشف الخطة المنهجية الكاملة للعام الدراسي الحالي"
          icon={Printer}
          tone="primary"
          size="large"
        >
          <div className="space-y-4">
            {/* Printable Preview Sheet */}
            <div className="p-6 rounded-2xl border border-border bg-white text-slate-900 shadow-sm print:m-0 print:border-none print:p-0 print:shadow-none space-y-5">
              {/* Official Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                <div className="text-right">
                  <h3 className="font-black text-base">{systemSettings?.schoolName || "مدرسة داراسي النموذجية الأهلية"}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">وكالة الشؤون التعليمية والأكاديمية</p>
                  <p className="text-xs text-slate-600">العام الدراسي: {currentAcademicYear?.name || "1446 هـ"}</p>
                </div>
                <div className="text-center">
                  <div className="h-12 w-12 mx-auto rounded-full border-2 border-slate-900 flex items-center justify-center font-black text-sm">
                    وزارة
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">كشف رسمي معتمد</span>
                </div>
                <div className="text-left text-xs text-slate-600 font-mono">
                  <div>تاريخ الإصدار: {new Date().toLocaleDateString("ar-SA")}</div>
                  <div>إجمالي المقررات: {filteredSubjects.length} مادة</div>
                </div>
              </div>

              <div className="text-center py-1">
                <h2 className="text-lg font-black text-slate-900">
                  كشف الخطط الدراسية وتوزيع الحصص الأسبوعية
                </h2>
              </div>

              {/* Table of Subjects */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900">
                      <th className="border border-slate-300 p-2 font-black">#</th>
                      <th className="border border-slate-300 p-2 font-black">كود المقرر</th>
                      <th className="border border-slate-300 p-2 font-black">اسم المقرر الدراسي</th>
                      <th className="border border-slate-300 p-2 font-black">القسم</th>
                      <th className="border border-slate-300 p-2 font-black">المرحلة</th>
                      <th className="border border-slate-300 p-2 font-black text-center">الحصص</th>
                      <th className="border border-slate-300 p-2 font-black text-center">العظمى</th>
                      <th className="border border-slate-300 p-2 font-black text-center">النجاح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubjects.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="border border-slate-300 p-2 font-mono text-center">{idx + 1}</td>
                        <td className="border border-slate-300 p-2 font-mono font-bold">{s.code}</td>
                        <td className="border border-slate-300 p-2 font-black">{s.name}</td>
                        <td className="border border-slate-300 p-2">{s.department || "عام"}</td>
                        <td className="border border-slate-300 p-2">{STAGE_LABELS[s.stage] || s.stage}</td>
                        <td className="border border-slate-300 p-2 text-center font-bold">{s.creditHours || 3}</td>
                        <td className="border border-slate-300 p-2 text-center">{s.maxScore || 100}</td>
                        <td className="border border-slate-300 p-2 text-center">{s.passScore || 50}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Official Signatures */}
              <div className="grid grid-cols-2 pt-8 text-center text-xs text-slate-800">
                <div className="space-y-6">
                  <p className="font-bold">وكيل الشؤون التعليمية</p>
                  <p className="font-mono text-slate-400">............................................</p>
                </div>
                <div className="space-y-6">
                  <p className="font-bold">مدير المدرسة / الاعتماد</p>
                  <p className="font-mono text-slate-400">............................................</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPrintCatalogModal(false)}
                className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border hover:bg-accent transition-colors"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20"
              >
                <Printer className="h-4 w-4" /> أمر الطباعة الآن
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </AppShell>
  );
}
