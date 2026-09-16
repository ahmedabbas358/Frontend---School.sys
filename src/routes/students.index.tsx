import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useTransition, useEffect } from "react";
import { AppShell, Badge, PageCard, formatCurrency } from "@/components/app-shell";
import { useGlobalStore, Student } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { ArabicDatePicker } from "@/components/ui/arabic-date-picker";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { 
  Download, 
  Filter, 
  Plus, 
  Search, 
  Eye, 
  Pencil, 
  Trash2, 
  LayoutGrid, 
  List, 
  Printer, 
  ShieldCheck, 
  MapPin, 
  Undo2, 
  AlertCircle,
  Phone,
  MessageSquare,
  Users,
  Layers3,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  GraduationCap,
  Sparkles,
  ArrowRightLeft,
  X,
  Check,
  CreditCard,
  HeartHandshake,
  UserCheck,
  FileSpreadsheet,
  MoreHorizontal,
  RotateCcw,
  ArrowUpDown,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { LuxurySelect, LuxurySelectOption } from "@/components/ui/luxury-select";
import { isGradeMatch } from "@/lib/school-structure";

export const Route = createFileRoute("/students/")({
  head: () => ({
    meta: [
      { title: "سجل وملفات الطلاب | منصة مدارس" },
      { name: "description", content: "إدارة بيانات الطلاب والصفوف والشعب والملفات الشاملة لآلاف الطلاب." },
    ],
  }),
  component: StudentsListPage,
});

function StudentsListPage() {
  const { 
    activeStageStudents, 
    allDeletedStudents, 
    allSections, 
    allInvoices,
    allPayments,
    allGuardians,
    currency,
    softDeleteStudent, 
    restoreStudent, 
    hardDeleteStudent,
    updateStudent
  } = useGlobalStore();

  const { stage, getStageLabel } = useStage();

  // Search & Filters
  const [q, setQ] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("active"); // "active" | "all" | "inactive" | "trash"
  const [genderFilter, setGenderFilter] = useState<string>("all"); // "all" | "ذكر" | "أنثى"
  const [financialFilter, setFinancialFilter] = useState<string>("all"); // "all" | "paid" | "due"
  const [sortBy, setSortBy] = useState<string>("name"); // "name" | "grade" | "id" | "recent"
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  // Pagination State for Handling Thousands of Students
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Bulk Selection State
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [targetTransferSectionId, setTargetTransferSectionId] = useState("");

  // Quick 360° Student Profile & Edit Modal State
  const [selectedStudentForView, setSelectedStudentForView] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Student>>({});

  // Debounced search for massive performance
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedQ(q);
        setCurrentPage(1);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [q]);

  // Available grades in current stage
  const availableGrades = useMemo(() => {
    const gradesSet = new Set<string>();
    activeStageStudents.forEach(s => {
      if (s.grade) gradesSet.add(s.grade);
    });
    return Array.from(gradesSet).sort();
  }, [activeStageStudents]);

  // Filter sections by selected grade
  const availableSections = useMemo(() => {
    let secs = allSections.filter(s => s.stage === stage);
    if (selectedGrade !== "all") {
      secs = secs.filter(s => isGradeMatch(s.grade, selectedGrade));
    }
    return secs;
  }, [allSections, stage, selectedGrade]);

  // Base list depending on trash vs active stage
  const baseStudents = useMemo(() => {
    return statusFilter === "trash" 
      ? allDeletedStudents.filter(s => s.stage === stage) 
      : activeStageStudents;
  }, [statusFilter, allDeletedStudents, stage, activeStageStudents]);

  // Filtered dataset
  const filteredStudents = useMemo(() => {
    let result = baseStudents.filter((s) => {
      // Text Search
      if (debouncedQ) {
        const query = debouncedQ.trim().toLowerCase();
        const matchName = s.name?.toLowerCase().includes(query);
        const matchId = s.id?.toLowerCase().includes(query);
        const matchNat = s.nationalId?.includes(query);
        const matchGuardian = s.guardianName?.toLowerCase().includes(query);
        const matchPhone = s.guardianPhone?.includes(query);
        if (!matchName && !matchId && !matchNat && !matchGuardian && !matchPhone) {
          return false;
        }
      }

      // Grade Filter
      if (selectedGrade !== "all" && !isGradeMatch(s.grade, selectedGrade)) return false;

      // Section Filter
      if (selectedSectionId !== "all" && s.sectionId !== selectedSectionId) return false;

      // Gender Filter
      if (genderFilter !== "all" && s.gender !== genderFilter) return false;

      // Status Filter
      if (statusFilter === "active" && s.status !== "نشط") return false;
      if (statusFilter === "inactive" && s.status === "نشط") return false;

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name, "ar");
      if (sortBy === "grade") return (a.grade || "").localeCompare(b.grade || "", "ar");
      if (sortBy === "id") return a.id.localeCompare(b.id);
      return 0;
    });

    return result;
  }, [baseStudents, debouncedQ, selectedGrade, selectedSectionId, genderFilter, statusFilter, sortBy]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));

  // Current page slice
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Grade Counts for quick chips
  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: baseStudents.length };
    baseStudents.forEach(s => {
      if (s.grade) counts[s.grade] = (counts[s.grade] || 0) + 1;
    });
    return counts;
  }, [baseStudents]);

  // Grade Options for LuxurySelect Popup
  const gradeSelectOptions: LuxurySelectOption[] = useMemo(() => {
    const totalCount = gradeCounts.all || 0;
    const opts: LuxurySelectOption[] = [
      {
        value: "all",
        label: "جميع الصفوف الدراسية",
        badge: `${totalCount} طالب`,
        badgeTone: "primary",
        icon: Users,
      },
    ];

    availableGrades.forEach((g) => {
      const count = gradeCounts[g] || 0;
      opts.push({
        value: g,
        label: g,
        badge: `${count} طالب`,
        badgeTone: "muted",
        icon: GraduationCap,
      });
    });

    return opts;
  }, [availableGrades, gradeCounts]);

  // Section Options for LuxurySelect Popup
  const sectionSelectOptions: LuxurySelectOption[] = useMemo(() => {
    if (selectedGrade === "all") {
      const opts: LuxurySelectOption[] = [
        {
          value: "all",
          label: `كل الشُعب (${availableSections.length} شعبة)`,
          badge: `${baseStudents.length} طالب`,
          badgeTone: "primary",
          icon: Layers3,
        },
      ];

      availableSections.forEach((sec) => {
        const count = baseStudents.filter((s) => s.sectionId === sec.id).length;
        opts.push({
          value: sec.id,
          label: `شعبة ${sec.name}`,
          sublabel: sec.grade,
          badge: `${count} طالب`,
          badgeTone: "muted",
          icon: Layers3,
        });
      });

      return opts;
    }

    const opts: LuxurySelectOption[] = [
      {
        value: "all",
        label: `كل شُعب (${selectedGrade})`,
        badge: `${availableSections.length} شُعب`,
        badgeTone: "primary",
        icon: Layers3,
      },
    ];

    availableSections.forEach((sec) => {
      const count = baseStudents.filter((s) => s.sectionId === sec.id).length;
      opts.push({
        value: sec.id,
        label: `شعبة ${sec.name}`,
        badge: `${count} طالب`,
        badgeTone: "muted",
        icon: Layers3,
      });
    });

    return opts;
  }, [selectedGrade, availableSections, baseStudents]);

  // Status Filter Options for LuxurySelect
  const statusOptions: LuxurySelectOption[] = useMemo(() => [
    { value: "active", label: "الطلاب النشطون", badge: "نشط", badgeTone: "success" },
    { value: "all", label: "جميع الحالات (الكل)" },
    { value: "inactive", label: "إيقاف قيد / منقطع", badge: "منقطع", badgeTone: "warning" },
    { value: "trash", label: "سلة المهملات", badge: "محذوف", badgeTone: "danger" },
  ], []);

  // Gender Filter Options for LuxurySelect
  const genderOptions: LuxurySelectOption[] = useMemo(() => [
    { value: "all", label: "الجنس: الكل" },
    { value: "ذكر", label: "بنين (ذكور)" },
    { value: "أنثى", label: "بنات (إناث)" },
  ], []);

  // Sort Options for LuxurySelect
  const sortOptions: LuxurySelectOption[] = useMemo(() => [
    { value: "name", label: "ترتيب أبجدي (الاسم)" },
    { value: "grade", label: "ترتيب حسب الصف" },
    { value: "id", label: "ترتيب برقم القيد" },
  ], []);

  // Check if any filter is active
  const hasActiveFilters = 
    selectedGrade !== "all" ||
    selectedSectionId !== "all" ||
    genderFilter !== "all" ||
    statusFilter !== "active" ||
    q.trim() !== "";

  // Reset all filters to default
  const handleResetFilters = () => {
    setSelectedGrade("all");
    setSelectedSectionId("all");
    setGenderFilter("all");
    setStatusFilter("active");
    setSortBy("name");
    setQ("");
    setDebouncedQ("");
    setCurrentPage(1);
    toast.info("تمت إعادة ضبط جميع الفلاتر");
  };

  // Bulk selection helpers
  const handleToggleSelectAllPage = () => {
    const next = new Set(selected);
    const allPageSelected = paginatedStudents.every(s => next.has(s.id));
    if (allPageSelected) {
      paginatedStudents.forEach(s => next.delete(s.id));
    } else {
      paginatedStudents.forEach(s => next.add(s.id));
    }
    setSelected(next);
  };

  const handleToggleSelectStudent = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  // Bulk actions
  const handleBulkSoftDelete = () => {
    if (!confirm(`هل أنت متأكد من نقل ${selected.size} طالب إلى سلة المهملات؟`)) return;
    selected.forEach(id => softDeleteStudent(id));
    setSelected(new Set());
    toast.success(`تم نقل ${selected.size} طالب إلى سلة المهملات`);
  };

  const handleBulkRestore = () => {
    selected.forEach(id => restoreStudent(id));
    setSelected(new Set());
    toast.success(`تمت استعادة ${selected.size} طالب بنجاح`);
  };

  const handleBulkHardDelete = () => {
    if (!confirm(`تحذير نهائي: هل تريد حذف ${selected.size} طالب نهائياً من قاعدة البيانات؟`)) return;
    selected.forEach(id => hardDeleteStudent(id));
    setSelected(new Set());
    toast.success(`تم الحذف النهائي لـ ${selected.size} طالب`);
  };

  const handleBulkTransfer = () => {
    if (!targetTransferSectionId) {
      toast.error("يرجى اختيار الشعبة المستهدفة لنقل الطلاب");
      return;
    }
    const targetSec = allSections.find(s => s.id === targetTransferSectionId);
    selected.forEach(id => {
      updateStudent(id, { sectionId: targetTransferSectionId });
    });
    setIsTransferModalOpen(false);
    setSelected(new Set());
    toast.success(`تم نقل ${selected.size} طالب بنجاح إلى شعبة (${targetSec?.name || ""})`);
  };

  // Quick Edit Save
  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    updateStudent(editingStudent.id, editFormData);
    toast.success("تم تحديث وتعديل بيانات ملف الطالب بنجاح!");
    setEditingStudent(null);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setEditFormData({
      name: student.name,
      nationalId: student.nationalId,
      dob: student.dob,
      gender: student.gender,
      grade: student.grade,
      sectionId: student.sectionId,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      guardianRelation: student.guardianRelation || student.guardianRelationship,
      guardianRelationship: student.guardianRelationship || student.guardianRelation,
      status: student.status,
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["رقم القيد", "اسم الطالب", "الرقم الوطني", "الصف", "الشعبة", "ولي الأمر", "هاتف ولي الأمر", "الحالة"];
    const rows = filteredStudents.map(s => [
      s.id,
      `"${s.name}"`,
      s.nationalId || "-",
      s.grade || "-",
      allSections.find(x => x.id === s.sectionId)?.name || "-",
      `"${s.guardianName || "-"}"`,
      s.guardianPhone || "-",
      s.status || "نشط"
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `students_${stage}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير كشف الطلاب بنجاح (CSV / Excel)");
  };

  return (
    <AppShell
      title={`سجل وملفات الطلاب — ${getStageLabel(stage)}`}
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الطلاب وأولياء الأمور", to: "/students" },
        { label: "قائمة الطلاب" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/80 bg-card text-xs font-bold hover:bg-accent text-foreground transition-colors shadow-xs"
            title="تصدير كشف Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">تصدير كشف</span>
          </button>

          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/80 bg-card text-xs font-bold hover:bg-accent text-foreground transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">طباعة وبطاقات</span>
          </button>

          <Link
            to="/students/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-black rounded-xl hover:bg-primary/90 transition-all shadow-md glow-primary"
          >
            <Plus className="h-4 w-4" />
            <span>تسجيل طالب جديد</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-5 animate-in fade-in duration-300">
        
        {/* =========================================================
            Unified Luxury Control, Search & Filtering Command Center
            ========================================================= */}
        <div className="p-4 sm:p-5 rounded-3xl border border-border/70 glass-card space-y-3.5 shadow-sm">
          
          {/* Main Controls Row: Search + Academic Hierarchy (Grade & Section Popups) + View Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
            
            {/* Realtime Search Input (4 cols on lg) */}
            <div className="sm:col-span-2 lg:col-span-4 relative">
              <Search className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث سريع باسم الطالب، رقم القيد، الهوية، أو ولي الأمر..."
                className="w-full h-11 rounded-2xl border border-border/80 bg-card/90 pr-10 pl-14 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-xs"
              />
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {q ? (
                  <button
                    onClick={() => setQ("")}
                    className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                    title="مسح البحث"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="hidden xl:inline text-[10px] font-bold border border-border/60 bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded opacity-70">
                    Ctrl K
                  </span>
                )}
              </div>
            </div>

            {/* Grade Luxury Select Popup (3 cols on lg) */}
            <div className="sm:col-span-1 lg:col-span-3">
              <LuxurySelect
                value={selectedGrade}
                onChange={(val) => {
                  setSelectedGrade(val);
                  setSelectedSectionId("all");
                  setCurrentPage(1);
                }}
                options={gradeSelectOptions}
                placeholder="الصف الدراسي"
                icon={GraduationCap}
                size="md"
                searchable={availableGrades.length > 5}
              />
            </div>

            {/* Section Luxury Select Popup (3 cols on lg) */}
            <div className="sm:col-span-1 lg:col-span-3">
              <LuxurySelect
                value={selectedSectionId}
                onChange={(val) => {
                  setSelectedSectionId(val);
                  setCurrentPage(1);
                }}
                options={sectionSelectOptions}
                placeholder="الشعبة"
                icon={Layers3}
                size="md"
                disabled={selectedGrade !== "all" && availableSections.length === 0}
                disabledHint="لا توجد شُعب مسجلة لهذا الصف"
                searchable={availableSections.length > 5}
              />
            </div>

            {/* View Mode Toggle (2 cols on lg) */}
            <div className="sm:col-span-2 lg:col-span-2 flex items-center justify-end">
              <div className="flex items-center p-1 rounded-2xl border border-border/80 bg-card/90 shadow-xs h-11 w-full justify-center sm:w-auto">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-initial ${
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground shadow-xs font-black"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                  title="عرض الجدول"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>جدول</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-initial ${
                    viewMode === "grid"
                      ? "bg-primary text-primary-foreground shadow-xs font-black"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                  title="عرض البطاقات"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>بطاقات</span>
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Quick Filters Bar: Status, Gender, Sort */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center pt-2.5 border-t border-border/50">
            
            {/* Status Filter */}
            <div>
              <LuxurySelect
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(val);
                  setSelected(new Set());
                  setCurrentPage(1);
                }}
                options={statusOptions}
                placeholder="حالة الطالب"
                icon={Activity}
                size="md"
              />
            </div>

            {/* Gender Filter */}
            <div>
              <LuxurySelect
                value={genderFilter}
                onChange={(val) => {
                  setGenderFilter(val);
                  setCurrentPage(1);
                }}
                options={genderOptions}
                placeholder="الجنس"
                icon={Users}
                size="md"
              />
            </div>

            {/* Sort Order */}
            <div>
              <LuxurySelect
                value={sortBy}
                onChange={(val) => setSortBy(val)}
                options={sortOptions}
                placeholder="الترتيب"
                icon={ArrowUpDown}
                size="md"
              />
            </div>
          </div>

          {/* Active Filter Badges & Quick Reset Strip */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-border/60 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold text-muted-foreground flex items-center gap-1.5 pl-1">
                  <Filter className="w-3.5 h-3.5 text-primary" />
                  <span>تصفية مخصصة:</span>
                </span>

                {selectedGrade !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 text-primary border border-primary/25 text-xs font-bold shadow-xs">
                    <GraduationCap className="w-3 h-3" />
                    <span>الصف: {selectedGrade}</span>
                    <button
                      onClick={() => {
                        setSelectedGrade("all");
                        setSelectedSectionId("all");
                        setCurrentPage(1);
                      }}
                      className="hover:bg-primary/20 rounded-md p-0.5 text-primary transition-colors"
                      title="إلغاء تصفية الصف"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedSectionId !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 text-xs font-bold shadow-xs">
                    <Layers3 className="w-3 h-3" />
                    <span>
                      الشعبة: {allSections.find(s => s.id === selectedSectionId)?.name ? `شعبة ${allSections.find(s => s.id === selectedSectionId)?.name}` : selectedSectionId}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedSectionId("all");
                        setCurrentPage(1);
                      }}
                      className="hover:bg-blue-500/20 rounded-md p-0.5 text-blue-600 dark:text-blue-400 transition-colors"
                      title="إلغاء تصفية الشعبة"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {genderFilter !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25 text-xs font-bold shadow-xs">
                    <span>الجنس: {genderFilter === "ذكر" ? "بنين" : "بنات"}</span>
                    <button
                      onClick={() => {
                        setGenderFilter("all");
                        setCurrentPage(1);
                      }}
                      className="hover:bg-purple-500/20 rounded-md p-0.5 text-purple-600 dark:text-purple-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {statusFilter !== "active" && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold shadow-xs border ${
                    statusFilter === "trash"
                      ? "bg-danger/10 text-danger border-danger/30"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  }`}>
                    <span>الحالة: {statusFilter === "trash" ? "سلة المهملات" : statusFilter === "all" ? "الكل" : "إيقاف قيد"}</span>
                    <button
                      onClick={() => {
                        setStatusFilter("active");
                        setCurrentPage(1);
                      }}
                      className="hover:bg-black/10 dark:hover:bg-white/10 rounded-md p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {debouncedQ && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted text-foreground border border-border text-xs font-bold shadow-xs">
                    <Search className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate max-w-[150px]">البحث: "{debouncedQ}"</span>
                    <button
                      onClick={() => {
                        setQ("");
                        setDebouncedQ("");
                      }}
                      className="hover:bg-muted-foreground/20 rounded-md p-0.5 text-muted-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-danger hover:bg-danger/10 text-xs font-extrabold transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>مسح جميع الفلاتر</span>
                </button>
              </div>

              {/* Dynamic live match counter pill */}
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-muted-foreground">
                <span>النتائج المطابقة:</span>
                <span className="px-2 py-0.5 rounded-lg bg-primary/15 text-primary border border-primary/25 font-black tabular-nums">
                  {filteredStudents.length} طالب
                </span>
              </div>
            </div>
          )}

          {/* Bulk Selection Operations Action Strip */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-primary/10 border border-primary/20 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground text-xs font-black">
                  {selected.size}
                </span>
                <span className="text-xs font-extrabold text-foreground">طلاب محددين للإجراء الجماعي</span>
              </div>

              <div className="flex items-center gap-2">
                {statusFilter === "trash" ? (
                  <>
                    <button
                      onClick={handleBulkRestore}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>استعادة المحددين</span>
                    </button>
                    <button
                      onClick={handleBulkHardDelete}
                      className="px-3.5 py-1.5 rounded-xl bg-danger hover:bg-danger/90 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف نهائي</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsTransferModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-card border border-border hover:bg-accent text-foreground text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
                      <span>نقل لشعبة أخرى</span>
                    </button>

                    <button
                      onClick={() => setIsPrintOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-card border border-border hover:bg-accent text-foreground text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-blue-500" />
                      <span>طباعة بطاقات الهوية</span>
                    </button>

                    <button
                      onClick={handleBulkSoftDelete}
                      className="px-3.5 py-1.5 rounded-xl bg-danger/10 hover:bg-danger text-danger hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>نقل للمهملات</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* =========================================================
            Data Results Statistics & Quick Pagination Header
            ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="text-xs font-bold text-muted-foreground">
            عرض <span className="text-foreground font-black">{(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredStudents.length)}</span> من أصل <span className="text-primary font-black">{filteredStudents.length}</span> طالب
          </div>

          {/* Page Size Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-muted-foreground">العدد بالصفحة:</span>
            {[25, 50, 100].map((size) => (
              <button
                key={size}
                onClick={() => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-colors ${
                  pageSize === size
                    ? "bg-primary text-primary-foreground font-black"
                    : "bg-card border border-border/70 hover:bg-accent text-foreground"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* =========================================================
            VIEW 1: High-Performance Data Table
            ========================================================= */}
        {viewMode === "list" ? (
          <PageCard className="p-0 overflow-hidden border-border/70 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-bold">
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={paginatedStudents.length > 0 && paginatedStudents.every(s => selected.has(s.id))}
                        onChange={handleToggleSelectAllPage}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer accent-primary"
                      />
                    </th>
                    <th className="py-3 px-3 font-bold">الطالب والملف</th>
                    <th className="py-3 px-3 font-bold">رقم القيد / الهوية</th>
                    <th className="py-3 px-3 font-bold">الصف والشعبة</th>
                    <th className="py-3 px-3 font-bold">ولي الأمر والتواصل</th>
                    <th className="py-3 px-3 font-bold text-center">الحالة</th>
                    <th className="py-3 px-3 font-bold text-center">التحكم السريع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs font-bold">
                        لا توجد نتائج مطابقة لمعايير البحث في هذه المرحلة
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((s) => {
                      const isSelected = selected.has(s.id);
                      const sec = allSections.find(x => x.id === s.sectionId);
                      return (
                        <tr 
                          key={s.id} 
                          className={`hover:bg-muted/30 transition-colors ${isSelected ? "bg-primary/5 font-semibold" : ""}`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectStudent(s.id)}
                              className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer accent-primary"
                            />
                          </td>

                          {/* Student Avatar & Name */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white font-extrabold text-xs shadow-xs shrink-0">
                                {s.name ? s.name.split(" ").slice(0, 2).map(n => n[0]).join("") : "ط"}
                              </div>
                              <div className="min-w-0">
                                <button
                                  onClick={() => setSelectedStudentForView(s)}
                                  className="font-extrabold text-foreground hover:text-primary transition-colors text-right truncate block max-w-[200px]"
                                  title="فتح الملف الشامل"
                                >
                                  {s.name}
                                </button>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                  <span>{s.gender || "ذكر"}</span>
                                  <span>•</span>
                                  <span className="tabular-nums" dir="ltr">{s.dob || "-"}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* ID & National ID */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-foreground tabular-nums text-xs" dir="ltr">{s.id}</div>
                            <div className="text-[10px] text-muted-foreground tabular-nums mt-0.5" dir="ltr">
                              {s.nationalId ? `هوية: ${s.nationalId}` : "بدون هوية"}
                            </div>
                          </td>

                          {/* Grade & Section */}
                          <td className="py-3 px-3">
                            <div className="font-extrabold text-foreground">{s.grade}</div>
                            <div className="mt-0.5">
                              {sec ? (
                                <span className="inline-block px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                                  شعبة {sec.name}
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-500 font-bold">غير محدد</span>
                              )}
                            </div>
                          </td>

                          {/* Guardian & Phone */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-foreground truncate max-w-[150px]">{s.guardianName || "-"}</div>
                            {s.guardianPhone ? (
                              <div className="flex items-center gap-2 mt-0.5">
                                <a
                                  href={`tel:${s.guardianPhone}`}
                                  className="text-[11px] font-bold text-primary hover:underline tabular-nums flex items-center gap-1"
                                  dir="ltr"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{s.guardianPhone}</span>
                                </a>
                                <a
                                  href={`https://wa.me/${s.guardianPhone.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-500 hover:text-emerald-600"
                                  title="مراسلة واتساب"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">-</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center">
                            {s.isDeleted ? (
                              <Badge tone="danger">محذوف</Badge>
                            ) : s.status === "نشط" ? (
                              <Badge tone="success">نشط</Badge>
                            ) : (
                              <Badge tone="neutral">{s.status || "منقطع"}</Badge>
                            )}
                          </td>

                          {/* Quick Actions */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setSelectedStudentForView(s)}
                                className="p-1.5 rounded-lg border border-border/80 bg-card hover:bg-accent text-foreground transition-colors"
                                title="عرض الملف الشامل (360°)"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-500" />
                              </button>

                              <button
                                onClick={() => openEditModal(s)}
                                className="p-1.5 rounded-lg border border-border/80 bg-card hover:bg-accent text-foreground transition-colors"
                                title="تعديل بيانات الطالب"
                              >
                                <Pencil className="w-3.5 h-3.5 text-amber-500" />
                              </button>

                              <Link
                                to="/students/$id"
                                params={{ id: s.id }}
                                className="p-1.5 rounded-lg border border-border/80 bg-card hover:bg-accent text-foreground transition-colors"
                                title="الصفحة الكاملة لملف الطالب"
                              >
                                <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </PageCard>
        ) : (
          /* =========================================================
              VIEW 2: High-End Luxury Cards Grid
              ========================================================= */
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {paginatedStudents.map((s) => {
              const isSelected = selected.has(s.id);
              const sec = allSections.find(x => x.id === s.sectionId);
              return (
                <div
                  key={s.id}
                  className={`relative p-4 rounded-3xl border transition-all hover-lift ${
                    isSelected
                      ? "bg-primary/10 border-primary shadow-md glow-primary"
                      : "bg-card border-border/70 hover:border-primary/50 shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectStudent(s.id)}
                      className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer accent-primary mt-1"
                    />

                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white font-black text-sm shadow-sm">
                      {s.name ? s.name.split(" ").slice(0, 2).map(n => n[0]).join("") : "ط"}
                    </div>

                    <Badge tone={s.status === "نشط" ? "success" : "neutral"} className="text-[10px]">
                      {s.status || "نشط"}
                    </Badge>
                  </div>

                  <div className="text-center mb-3">
                    <button
                      onClick={() => setSelectedStudentForView(s)}
                      className="font-black text-sm text-foreground hover:text-primary transition-colors block truncate w-full"
                    >
                      {s.name}
                    </button>
                    <div className="text-[10px] text-muted-foreground font-bold tabular-nums mt-0.5" dir="ltr">
                      {s.id}
                    </div>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-2xl bg-muted/30 border border-border/40 text-xs mb-3">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>الصف:</span>
                      <span className="font-bold text-foreground">{s.grade}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>الشعبة:</span>
                      <span className="font-bold text-foreground">{sec ? `شعبة ${sec.name}` : "-"}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>ولي الأمر:</span>
                      <span className="font-bold text-foreground truncate max-w-[120px]">{s.guardianName || "-"}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
                    <button
                      onClick={() => setSelectedStudentForView(s)}
                      className="h-8 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>الملف</span>
                    </button>

                    <button
                      onClick={() => openEditModal(s)}
                      className="h-8 rounded-xl border border-input bg-card hover:bg-accent text-foreground text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =========================================================
            Modern Pagination Bar
            ========================================================= */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/70 shadow-sm">
            <div className="text-xs font-bold text-muted-foreground">
              الصفحة <span className="font-black text-foreground">{currentPage}</span> من <span className="font-black text-foreground">{totalPages}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(1)}
                className="h-9 px-3 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent disabled:opacity-40 transition-colors"
              >
                الأولى
              </button>

              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="h-9 px-3 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </button>

              <div className="px-3 text-xs font-black text-primary">
                {currentPage} / {totalPages}
              </div>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="h-9 px-3 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <span>التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="h-9 px-3 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent disabled:opacity-40 transition-colors"
              >
                الأخيرة
              </button>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================
          Modal 1: 360° Quick Student Dossier View
          ========================================================= */}
      {selectedStudentForView && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setSelectedStudentForView(null)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-2xl bg-card/98 dark:bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl rounded-3xl p-6 sm:p-7 overflow-hidden animate-in zoom-in-95 duration-150 space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white font-black text-base shadow-sm">
                  {selectedStudentForView.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-foreground">{selectedStudentForView.name}</h3>
                  <div className="text-xs text-muted-foreground font-bold flex items-center gap-2 mt-0.5">
                    <span>رقم القيد: {selectedStudentForView.id}</span>
                    <span>•</span>
                    <Badge tone="primary">{selectedStudentForView.grade}</Badge>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStudentForView(null)}
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student Info Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                <div className="text-[11px] font-bold text-muted-foreground">الرقم الوطني / الإقامة</div>
                <div className="font-extrabold text-foreground tabular-nums" dir="ltr">
                  {selectedStudentForView.nationalId || "غير مسجل"}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                <div className="text-[11px] font-bold text-muted-foreground">تاريخ الميلاد والسن</div>
                <div className="font-extrabold text-foreground tabular-nums" dir="ltr">
                  {selectedStudentForView.dob || "غير محدد"}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                <div className="text-[11px] font-bold text-muted-foreground">الشعبة والقاعة الدراسية</div>
                <div className="font-extrabold text-foreground">
                  {allSections.find(x => x.id === selectedStudentForView.sectionId)?.name 
                    ? `شعبة ${allSections.find(x => x.id === selectedStudentForView.sectionId)?.name}` 
                    : "غير محدد"}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                <div className="text-[11px] font-bold text-muted-foreground">ولي الأمر والقرابة</div>
                <div className="font-extrabold text-foreground">
                  {selectedStudentForView.guardianName || "-"} ({selectedStudentForView.guardianRelationship || selectedStudentForView.guardianRelation || "ولي أمر"})
                </div>
              </div>
            </div>

            {/* Guardian Contact Ticker */}
            {selectedStudentForView.guardianPhone && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-foreground">هاتف ولي الأمر المباشر:</span>
                  <span className="font-extrabold text-foreground tabular-nums" dir="ltr">{selectedStudentForView.guardianPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedStudentForView.guardianPhone}`}
                    className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                  >
                    اتصال
                  </a>
                  <a
                    href={`https://wa.me/${selectedStudentForView.guardianPhone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors"
                  >
                    واتساب
                  </a>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-3.5 border-t border-border/60 flex items-center justify-between">
              <Link
                to="/students/$id"
                params={{ id: selectedStudentForView.id }}
                className="inline-flex items-center gap-2 text-xs font-extrabold text-primary hover:underline"
              >
                <span>الانتقال للملف الأكاديمي والمالي الكامل</span>
                <ChevronLeft className="w-4 h-4" />
              </Link>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const stu = selectedStudentForView;
                    setSelectedStudentForView(null);
                    openEditModal(stu);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-colors"
                >
                  تعديل البيانات
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudentForView(null)}
                  className="px-4 py-2 rounded-xl border border-input bg-background hover:bg-accent text-xs font-bold text-foreground transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          Modal 2: Quick Student Edit Drawer / Modal
          ========================================================= */}
      {editingStudent && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setEditingStudent(null)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-xl bg-card/98 dark:bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl rounded-3xl p-6 sm:p-7 overflow-visible animate-in zoom-in-95 duration-150 space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground">تعديل بيانات الطالب</h3>
                  <div className="text-xs text-muted-foreground mt-0.5 font-medium">{editingStudent.id}</div>
                </div>
              </div>
              <button 
                onClick={() => setEditingStudent(null)}
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">الاسم الرباعي الكامل *</label>
                <input
                  required
                  type="text"
                  value={editFormData.name || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-bold text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">الرقم الوطني / الإقامة *</label>
                  <input
                    required
                    type="text"
                    value={editFormData.nationalId || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, nationalId: e.target.value })}
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-bold text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs tabular-nums"
                  />
                </div>

                <div>
                  <ArabicDatePicker
                    label="تاريخ الميلاد"
                    value={editFormData.dob}
                    onChange={(val) => setEditFormData({ ...editFormData, dob: val })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">الصف الدراسي *</label>
                  <select
                    value={editFormData.grade || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, grade: e.target.value })}
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-bold text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs cursor-pointer"
                  >
                    {availableGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">الشعبة الدراسية</label>
                  <select
                    value={editFormData.sectionId || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, sectionId: e.target.value })}
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-bold text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs cursor-pointer"
                  >
                    <option value="">-- بدون تعيين --</option>
                    {allSections.filter(s => s.stage === stage).map(sec => (
                      <option key={sec.id} value={sec.id}>
                        {sec.grade} - شعبة {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">اسم ولي الأمر</label>
                  <input
                    type="text"
                    value={editFormData.guardianName || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, guardianName: e.target.value })}
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-bold text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">هاتف ولي الأمر</label>
                  <input
                    type="text"
                    value={editFormData.guardianPhone || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, guardianPhone: e.target.value })}
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-bold text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-3.5 border-t border-border/60 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-5 py-2.5 rounded-xl border border-input bg-background text-xs font-bold hover:bg-accent text-foreground transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md hover:bg-primary/90 transition-all active:scale-[0.98] glow-primary"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          Modal 3: Bulk Transfer Section Modal
          ========================================================= */}
      {isTransferModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsTransferModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-md bg-card/98 dark:bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl rounded-3xl p-6 overflow-hidden animate-in zoom-in-95 duration-150 space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary shrink-0">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <h3 className="font-black text-base text-foreground">نقل الطلاب المحددين لشعبة جديدة</h3>
              </div>
              <button 
                onClick={() => setIsTransferModalOpen(false)}
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              سيتم نقل عدد <span className="font-black text-primary">{selected.size}</span> طالب محدد إلى الشعبة المختارة:
            </p>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">اختر الشعبة المستهدفة:</label>
              <select
                value={targetTransferSectionId}
                onChange={(e) => setTargetTransferSectionId(e.target.value)}
                className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-bold text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs cursor-pointer"
              >
                <option value="">-- اختر الشعبة --</option>
                {allSections.filter(s => s.stage === stage).map(sec => (
                  <option key={sec.id} value={sec.id}>
                    {sec.grade} - شعبة {sec.name} (القاعة: {sec.roomName || "بدون"})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3.5 border-t border-border/60 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-input bg-background text-xs font-bold hover:bg-accent text-foreground transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleBulkTransfer}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md hover:bg-primary/90 transition-all active:scale-[0.98] glow-primary"
              >
                تنفيذ النقل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Print Engine */}
      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        templates={[
          {
            id: "all-students",
            name: "كشف الطلاب المعتمد",
            category: "الطلاب",
            type: "table",
            description: "طباعة قائمة الطلاب المحددين أو المعروضين",
            columns: [
              { label: "رقم القيد", key: "id" },
              { label: "اسم الطالب", key: "name" },
              { label: "الصف", key: "grade" },
              { label: "الشعبة", key: "sectionId", render: (r) => allSections.find(x => x.id === r.sectionId)?.name || "-" },
              { label: "الحالة", key: "status" },
              { label: "ولي الأمر", key: "guardianName" },
              { label: "الجوال", key: "guardianPhone" },
            ]
          },
          {
            id: "student-ids",
            name: "بطاقات الهوية المدرسية (Student IDs)",
            category: "الطلاب",
            type: "cards",
            description: "طباعة بطاقات تعريفية للطلاب مع شعار المدرسة",
            columns: [
              { label: "رقم القيد", key: "id" },
              { label: "اسم الطالب", key: "name" },
              { label: "الصف", key: "grade" },
            ]
          }
        ]}
        data={selected.size > 0 ? filteredStudents.filter(s => selected.has(s.id)) : filteredStudents}
        defaultTitle={`كشف طلاب ${getStageLabel(stage)}`}
      />

    </AppShell>
  );
}
