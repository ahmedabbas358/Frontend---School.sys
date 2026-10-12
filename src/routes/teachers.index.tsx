import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore, Staff, EducationalStage } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { AdminModal } from "@/components/admin/admin-modal";
import { 
  Plus, 
  Eye, 
  Pencil, 
  Trash2, 
  X, 
  AlertCircle, 
  GraduationCap, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Phone,
  MessageCircle,
  BookOpen,
  Layers,
  Search,
  Printer,
  Users,
  UserCog,
  CalendarRange,
  Calendar,
  AlertTriangle,
  LayoutGrid,
  Table as TableIcon,
  Check,
  UserPlus,
  RefreshCcw,
  Mail,
  SlidersHorizontal,
  ChevronRight
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { isTeachingStaff, matchesStaffId } from "@/lib/staff-categories";

export const Route = createFileRoute("/teachers/")({
  head: () => ({
    meta: [
      { title: "الهيئة التعليمية (المعلمون والأساتذة) | منصة مدارس" }, 
      { name: "description", content: "سجل المعلمين، الأنصبة التدريسية، المواد والشعب المخصصة والجدول الأسبوعي." }
    ],
  }),
  component: TeachersList,
});

const ALL_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

function TeachersList() {
  const { 
    allStaff, 
    activeStageStaff, 
    activeStageSubjects, 
    allSubjects,
    activeStageSections, 
    allSections,
    activeStageTeachingAssignments,
    allTeachingAssignments,
    activeStageScheduleSlots,
    allScheduleSlots,
    addStaff, 
    updateStaff, 
    deleteStaff, 
    addTeachingAssignment,
    deleteTeachingAssignment,
    currentAcademicYearId,
    allAcademicYears,
    systemSettings,
    addActivityLog
  } = useGlobalStore();
  const { stage, getStageLabel } = useStage();

  // View & Filter States
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Staff | null>(null);
  const [quickAssignTeacher, setQuickAssignTeacher] = useState<Staff | null>(null);
  const [scheduleViewTeacher, setScheduleViewTeacher] = useState<Staff | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Staff | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Fast Assign Form
  const [assignSubId, setAssignSubId] = useState("");
  const [assignSecId, setAssignSecId] = useState("");
  const [assignYearId, setAssignYearId] = useState("");

  // Add / Edit Form Data
  const [formData, setFormData] = useState({
    name: "",
    role: "معلم",
    department: "الشؤون التعليمية",
    status: "active" as "active" | "on_leave" | "terminated",
    employeeNo: "",
    phone: "",
    email: "",
    qualification: "بكالوريوس",
    experienceYears: 5,
    targetQuota: 24,
    subjects: [] as string[],
    sections: [] as string[],
  });

  const openAddModal = () => {
    setFormData({
      name: "",
      role: "معلم",
      department: "الشؤون التعليمية",
      status: "active",
      employeeNo: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      phone: "",
      email: "",
      qualification: "بكالوريوس",
      experienceYears: 5,
      targetQuota: 24,
      subjects: [],
      sections: [],
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (staff: Staff) => {
    setEditingTeacher(staff);
    const tAssigns = activeStageTeachingAssignments.filter(a => matchesStaffId(staff, a.teacherId));
    const activeSubIds = Array.from(new Set(tAssigns.map(a => a.subjectId)));
    const activeSecIds = Array.from(new Set(tAssigns.map(a => a.sectionId)));

    setFormData({
      name: staff.name,
      role: staff.role || "معلم",
      department: staff.department || "الشؤون التعليمية",
      status: staff.status || "active",
      employeeNo: staff.employeeNo || "",
      phone: staff.phone || "",
      email: staff.email || "",
      qualification: (staff as any).qualification || "بكالوريوس",
      experienceYears: (staff as any).experienceYears || 5,
      targetQuota: (staff as any).targetQuota || 24,
      subjects: staff.subjects?.length ? staff.subjects : activeSubIds,
      sections: staff.sections?.length ? staff.sections : activeSecIds,
    });
  };

  const openQuickAssignModal = (teacher: Staff) => {
    setQuickAssignTeacher(teacher);
    setAssignSubId("");
    setAssignSecId("");
    setAssignYearId(currentAcademicYearId || allAcademicYears[0]?.id || "");
  };

  const toggleSubject = (subId: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subId)
        ? prev.subjects.filter(id => id !== subId)
        : [...prev.subjects, subId]
    }));
  };

  const toggleSection = (secId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.includes(secId)
        ? prev.sections.filter(id => id !== secId)
        : [...prev.sections, secId]
    }));
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("الرجاء إدخال اسم المعلم");

    if (formData.employeeNo) {
      const isDuplicate = activeStageStaff.some((s: any) => s.employeeNo === formData.employeeNo);
      if (isDuplicate) {
        toast.error("هذا الرقم الوظيفي مسجل مسبقاً! الرجاء استخدام رقم آخر.");
        return;
      }
    }

    const newStaffId = `STF-${Date.now()}`;
    addStaff({ 
      ...formData, 
      id: newStaffId, 
      stage, 
      academicYearId: currentAcademicYearId 
    } as any);

    // Sync initial teaching assignments
    if (formData.subjects.length > 0 && formData.sections.length > 0) {
      formData.sections.forEach(secId => {
        const sec = activeStageSections.find(s => s.id === secId);
        formData.subjects.forEach(subId => {
          addTeachingAssignment({
            teacherId: newStaffId,
            subjectId: subId,
            sectionId: secId,
            yearId: currentAcademicYearId || "AY-DEFAULT",
            stage: sec?.stage || stage
          });
        });
      });
    }

    addActivityLog({
      user: "وكيل شؤون المعلمين",
      action: "تسجيل معلم جديد",
      entity: "الهيئة التعليمية",
      details: `تمت إضافة المعلم: ${formData.name} (${formData.employeeNo})`,
    });

    toast.success(`تمت إضافة المعلم "${formData.name}" وتثبيت تعييناته بنجاح`);
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    if (!formData.name.trim()) return toast.error("الرجاء إدخال اسم المعلم");

    updateStaff(editingTeacher.id, { ...formData });

    // Sync updated assignments
    activeStageTeachingAssignments
      .filter(a => matchesStaffId(editingTeacher, a.teacherId))
      .forEach(a => deleteTeachingAssignment(a.id));

    if (formData.subjects.length > 0 && formData.sections.length > 0) {
      const cleanTeacherId = editingTeacher.id.replace(/^EA-/, "");
      formData.sections.forEach(secId => {
        const sec = activeStageSections.find(s => s.id === secId);
        formData.subjects.forEach(subId => {
          addTeachingAssignment({
            teacherId: cleanTeacherId,
            subjectId: subId,
            sectionId: secId,
            yearId: currentAcademicYearId || "AY-DEFAULT",
            stage: sec?.stage || stage
          });
        });
      });
    }

    addActivityLog({
      user: "وكيل شؤون المعلمين",
      action: "تعديل بيانات المعلم",
      entity: "الهيئة التعليمية",
      details: `تم تحديث بيانات المعلم: ${formData.name}`,
    });

    toast.success(`تم تحديث بيانات المعلم "${formData.name}" بنجاح`);
    setEditingTeacher(null);
  };

  // Quick Assign Save
  const handleSaveQuickAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAssignTeacher) return;
    if (!assignSubId) return toast.error("يرجى اختيار المادة الدراسية");
    if (!assignSecId) return toast.error("يرجى اختيار الشعبة الدراسية");

    const sec = activeStageSections.find(s => s.id === assignSecId);
    const sub = activeStageSubjects.find(s => s.id === assignSubId);
    const cleanTeacherId = quickAssignTeacher.id.replace(/^EA-/, "");

    // Check duplicate
    const exists = activeStageTeachingAssignments.some(
      a => matchesStaffId(quickAssignTeacher, a.teacherId) && a.subjectId === assignSubId && a.sectionId === assignSecId
    );
    if (exists) {
      toast.error("هذا الإسناد موجود بالفعل لهذا المعلم والشعبة");
      return;
    }

    addTeachingAssignment({
      teacherId: cleanTeacherId,
      subjectId: assignSubId,
      sectionId: assignSecId,
      yearId: assignYearId || currentAcademicYearId || "AY-DEFAULT",
      stage: sec?.stage || stage
    });

    addActivityLog({
      user: "وكيل شؤون المعلمين",
      action: "إسناد تدريسي سريع",
      entity: "الهيئة التعليمية",
      details: `تم إسناد مادة [${sub?.name}] لشعبة [${sec?.name}] للمعلم [${quickAssignTeacher.name}]`,
    });

    toast.success(`تم إسناد مادة "${sub?.name}" للشعبة بنجاح`);
    setQuickAssignTeacher(null);
  };

  const confirmDelete = () => {
    if (teacherToDelete) {
      deleteStaff(teacherToDelete.id);
      addActivityLog({
        user: "مدير النظام",
        action: "حذف معلم",
        entity: "الهيئة التعليمية",
        details: `تم حذف المعلم: ${teacherToDelete.name} (${teacherToDelete.id})`,
      });
      toast.success(`تم حذف المعلم "${teacherToDelete.name}" بنجاح`);
      setTeacherToDelete(null);
    }
  };

  // Strictly filter to Academic Faculty
  const teachersList = useMemo(() => {
    return activeStageStaff.filter((s) => {
      if (s.isDeleted || s.status === "terminated") return false;
      
      const isAcademic = isTeachingStaff(s) || activeStageTeachingAssignments.some(ta => matchesStaffId(s, ta.teacherId));
      if (!isAcademic) return false;

      const tAssigns = activeStageTeachingAssignments.filter(a => matchesStaffId(s, a.teacherId));
      const scheduledCount = activeStageScheduleSlots.filter(slot => matchesStaffId(s, slot.teacherId)).length;

      // Subject Filter
      if (subjectFilter !== "all") {
        const matchesSub = tAssigns.some(a => a.subjectId === subjectFilter) || (s.subjects || []).includes(subjectFilter);
        if (!matchesSub) return false;
      }

      // Status Pill Filter
      if (statusFilter !== "all") {
        if (statusFilter === "full_quota") {
          const quota = (s as any).targetQuota || 24;
          if (scheduledCount < quota) return false;
        } else if (statusFilter === "unassigned") {
          if (tAssigns.length > 0) return false;
        } else if (s.status !== statusFilter) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) || 
          (s.employeeNo || "").toLowerCase().includes(q) || 
          (s.role || "").toLowerCase().includes(q) || 
          (s.phone || "").includes(q)
        );
      }

      return true;
    });
  }, [activeStageStaff, activeStageTeachingAssignments, activeStageScheduleSlots, subjectFilter, statusFilter, searchQuery]);

  // Live Teacher counts per subject
  const subjectTeacherCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeStageSubjects.forEach(sub => {
      counts[sub.id] = activeStageStaff.filter(s => {
        if (s.isDeleted || s.status === "terminated") return false;
        const isAcademic = isTeachingStaff(s) || activeStageTeachingAssignments.some(ta => matchesStaffId(s, ta.teacherId));
        if (!isAcademic) return false;
        const tAssigns = activeStageTeachingAssignments.filter(a => matchesStaffId(s, a.teacherId));
        return tAssigns.some(a => a.subjectId === sub.id) || (s.subjects || []).includes(sub.id);
      }).length;
    });
    return counts;
  }, [activeStageSubjects, activeStageStaff, activeStageTeachingAssignments]);

  // High level metrics
  const totalAssignedSlots = useMemo(() => {
    return activeStageScheduleSlots.filter(s => teachersList.some(t => matchesStaffId(t, s.teacherId))).length;
  }, [activeStageScheduleSlots, teachersList]);

  const avgQuota = useMemo(() => {
    if (!teachersList.length) return 0;
    return Math.round(totalAssignedSlots / teachersList.length);
  }, [totalAssignedSlots, teachersList]);

  const fullQuotaCount = useMemo(() => {
    return teachersList.filter(t => {
      const scheduled = activeStageScheduleSlots.filter(s => matchesStaffId(t, s.teacherId)).length;
      const target = (t as any).targetQuota || 24;
      return scheduled >= target;
    }).length;
  }, [teachersList, activeStageScheduleSlots]);

  const unassignedCount = useMemo(() => {
    return teachersList.filter(t => {
      const tAssigns = activeStageTeachingAssignments.filter(a => matchesStaffId(t, a.teacherId));
      return tAssigns.length === 0;
    }).length;
  }, [teachersList, activeStageTeachingAssignments]);

  const printTemplates: PrintTemplate[] = [
    {
      id: "teachers-list",
      name: "كشف الهيئة التعليمية والأنصبة الأكاديمية",
      category: "أكاديمي",
      type: "table",
      columns: [
        { key: "employeeNo", label: "الرقم الوظيفي" },
        { key: "name", label: "اسم المعلم" },
        { key: "role", label: "المسمى الوظيفي" },
        { key: "phone", label: "الجوال" },
        { 
          key: "subjects", 
          label: "المواد المسندة", 
          render: (r) => {
            const tAssigns = activeStageTeachingAssignments.filter(a => matchesStaffId(r, a.teacherId));
            const subs = Array.from(new Set(tAssigns.map(a => activeStageSubjects.find(s => s.id === a.subjectId)?.name).filter(Boolean)));
            return subs.join("، ") || "بدون إسناد";
          }
        },
        { 
          key: "workload", 
          label: "الحصص الأسبوعية", 
          render: (r) => `${activeStageScheduleSlots.filter(s => matchesStaffId(r, s.teacherId)).length} حصة` 
        },
        { key: "status", label: "الحالة", render: (r) => r.status === "active" ? "نشط" : r.status === "on_leave" ? "إجازة" : "غير نشط" },
      ]
    }
  ];

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الهيئة التعليمية (المعلمون)" }]}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-card border border-border/80 px-3.5 text-xs font-bold shadow-xs hover:bg-accent transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-primary" />
            طباعة الكشف الأكاديمي
          </button>

          <Link
            to="/schedule"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-card border border-border/80 px-3.5 text-xs font-bold text-foreground hover:bg-accent transition-all shadow-xs"
          >
            <CalendarRange className="h-3.5 w-3.5 text-primary" />
            الجدول المدرسي
          </Link>

          <button 
            onClick={openAddModal}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" /> إضافة معلم جديد
          </button>
        </div>
      }
    >
      <div className="space-y-5" dir="rtl">
        {/* Unified Subnavigation Ribbon & Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/70 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
            <Link 
              to="/teachers" 
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-xs flex items-center gap-2 shrink-0"
            >
              <Users className="h-4 w-4" />
              <span>قائمة المعلمين والأساتذة</span>
            </Link>
            <Link 
              to="/academic/assignments" 
              className="px-4 py-2 rounded-xl bg-card border border-border/80 hover:bg-accent text-foreground text-xs font-bold transition-colors flex items-center gap-2 shrink-0"
            >
              <UserCog className="h-4 w-4 text-primary" />
              <span>الإسناد التدريسي للكوادر</span>
            </Link>
            <Link 
              to="/schedule" 
              className="px-4 py-2 rounded-xl bg-card border border-border/80 hover:bg-accent text-foreground text-xs font-bold transition-colors flex items-center gap-2 shrink-0"
            >
              <CalendarRange className="h-4 w-4 text-primary" />
              <span>الجدول الأسبوعي للحصص</span>
            </Link>
          </div>

          <div className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border/80 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "table"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
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
            >
              <LayoutGrid className="h-3.5 w-3.5" /> بطاقات
            </button>
          </div>
        </div>

        {/* Academic Faculty Stats Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-primary/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground">أعضاء الهيئة التعليمية</span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground mt-1 tabular-nums flex items-baseline gap-1.5">
              <span>{teachersList.length}</span>
              <span className="text-xs text-muted-foreground font-normal">معلماً</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-primary/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground">الحصص المجدولة</span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-primary mt-1 tabular-nums flex items-baseline gap-1.5">
              <span>{totalAssignedSlots}</span>
              <span className="text-xs text-muted-foreground font-normal">حصة / أسبوع</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-emerald-500/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground">متوسط نصاب المعلم</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums flex items-baseline gap-1.5">
              <span>{avgQuota}</span>
              <span className="text-xs text-muted-foreground font-normal">حصة / أسبوع</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-blue-500/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground">مكتملو النصاب</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 tabular-nums flex items-baseline gap-1.5">
              <span>{fullQuotaCount}</span>
              <span className="text-xs text-muted-foreground font-normal">
                ({Math.round((fullQuotaCount / (teachersList.length || 1)) * 100)}%)
              </span>
            </div>
          </div>

          <div 
            onClick={() => setStatusFilter("unassigned")}
            className="cursor-pointer rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-amber-500/40"
            title="انقر لتصفية المعلمين بدون إسناد"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground">بانتظار إسناد مواد</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 tabular-nums flex items-baseline gap-1.5">
              <span>{unassignedCount}</span>
              <span className="text-xs text-muted-foreground font-normal">معلم</span>
            </div>
          </div>
        </div>

        {/* Subject Filter Ribbon & Controls */}
        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-xs font-black text-foreground">تصفية المعلمين حسب المقرر الدراسي:</span>
            </div>
            <span className="text-[11px] font-bold text-muted-foreground">
              {subjectFilter === "all" ? `عرض جميع المقررات (${teachersList.length} معلماً)` : activeStageSubjects.find(s => s.id === subjectFilter)?.name}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            <button
              onClick={() => setSubjectFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${
                subjectFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
              }`}
            >
              <span>كافة المواد</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${subjectFilter === "all" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                {activeStageStaff.filter(s => !s.isDeleted && (isTeachingStaff(s) || activeStageTeachingAssignments.some(ta => matchesStaffId(s, ta.teacherId)))).length}
              </span>
            </button>
            {activeStageSubjects.map(sub => {
              const count = subjectTeacherCounts[sub.id] || 0;
              const isSelected = subjectFilter === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSubjectFilter(sub.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                      : "bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
                  }`}
                >
                  <span>{sub.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Secondary Controls: Status Pills & Search */}
          <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
              {[
                { id: "all", label: "كافة الحالات" },
                { id: "active", label: "على رأس العمل" },
                { id: "on_leave", label: "في إجازة" },
                { id: "full_quota", label: "مكتملو النصاب" },
                { id: "unassigned", label: "بانتظار إسناد مواد" },
              ].map(pill => (
                <button
                  key={pill.id}
                  onClick={() => setStatusFilter(pill.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    statusFilter === pill.id
                      ? "bg-foreground text-background shadow-xs scale-[1.02]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="relative shrink-0 sm:w-72">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="بحث باسم المعلم، الرقم، أو الهاتف..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-background/80 ps-9 pe-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
        </div>

        {/* View Mode 1: Table View */}
        {viewMode === "table" ? (
          <PageCard>
            <DataTable
              rows={teachersList}
              empty="لم يتم العثور على معلمين يطابقون خيارات التصفية المحددة في هذه المرحلة الدراسية."
              columns={[
                { 
                  key: "no", 
                  header: "الرقم الوظيفي", 
                  cell: (t) => <span className="font-black tabular-nums text-xs text-muted-foreground">{t.employeeNo || t.id}</span> 
                },
                { 
                  key: "n", 
                  header: "الاسم والمسمى الأكاديمي", 
                  cell: (t) => (
                    <div className="flex flex-col">
                      <Link 
                        to="/teachers/$id" 
                        params={{ id: t.employeeNo || t.id }} 
                        className="font-black text-sm text-primary hover:underline flex items-center gap-1.5"
                      >
                        {t.name}
                      </Link>
                      <span className="text-[11px] font-bold text-muted-foreground mt-0.5">{t.role}</span>
                    </div>
                  )
                },
                { 
                  key: "ph", 
                  header: "التواصل المباشر", 
                  cell: (t) => (
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums font-bold text-xs text-foreground/85" dir="ltr">
                        {t.phone || "-"}
                      </span>
                      {t.phone && (
                        <a 
                          href={`https://wa.me/${t.phone.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors"
                          title="محادثة واتساب سريعة"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  ) 
                },
                { 
                  key: "subs", 
                  header: "المواد المُسندة فعلياً", 
                  cell: (t) => {
                    const tAssigns = activeStageTeachingAssignments.filter(a => matchesStaffId(t, a.teacherId));
                    const uniqueSubIds = Array.from(new Set(tAssigns.map(a => a.subjectId)));
                    const tSubs = uniqueSubIds.map(id => activeStageSubjects.find(s => s.id === id)).filter(Boolean);

                    if (!tSubs.length) {
                      return (
                        <button
                          onClick={() => openQuickAssignModal(t)}
                          className="text-[11px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 hover:underline"
                        >
                          <AlertTriangle className="h-3 w-3" /> بانتظار إسناد مواد
                        </button>
                      );
                    }

                    return (
                      <div className="flex flex-wrap gap-1 max-w-[240px]">
                        {tSubs.map(sub => (
                          <Badge key={sub!.id} tone="primary" className="text-[10px] font-black py-0.5 px-2">
                            {sub!.name}
                          </Badge>
                        ))}
                      </div>
                    );
                  }
                },
                { 
                  key: "secs", 
                  header: "الشُعب والفصول", 
                  cell: (t) => {
                    const tAssigns = activeStageTeachingAssignments.filter(a => matchesStaffId(t, a.teacherId));
                    const uniqueSecIds = Array.from(new Set(tAssigns.map(a => a.sectionId)));
                    const tSecs = uniqueSecIds.map(id => activeStageSections.find(s => s.id === id)).filter(Boolean);

                    if (!tSecs.length) {
                      return <span className="text-xs text-muted-foreground font-bold">-</span>;
                    }

                    return (
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {tSecs.map(sec => (
                          <Badge key={sec!.id} className="text-[10px] font-black bg-muted/80 text-foreground border border-border/60 py-0.5 px-1.5">
                            {sec!.grade.replace("الصف ", "")}/{sec!.name}
                          </Badge>
                        ))}
                      </div>
                    );
                  }
                },
                { 
                  key: "quota", 
                  header: "العبء التدريسي", 
                  cell: (t) => {
                    const scheduledCount = activeStageScheduleSlots.filter(s => matchesStaffId(t, s.teacherId)).length;
                    const targetQuota = (t as any).targetQuota || 24;
                    const percentage = Math.min(100, Math.round((scheduledCount / targetQuota) * 100));
                    const isFull = scheduledCount >= targetQuota;
                    
                    return (
                      <div className="flex flex-col gap-1 w-28">
                        <div className="flex items-center justify-between text-[11px] font-black tabular-nums">
                          <span className={scheduledCount > 0 ? "text-foreground" : "text-muted-foreground"}>
                            {scheduledCount} <span className="text-[10px] font-normal text-muted-foreground">حصة</span>
                          </span>
                          <span className="text-muted-foreground/70 font-normal">/ {targetQuota}</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isFull 
                                ? "bg-emerald-500" 
                                : scheduledCount >= 16 
                                ? "bg-blue-500" 
                                : scheduledCount > 0 
                                ? "bg-amber-500" 
                                : "bg-muted"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  }
                },
                { 
                  key: "st", 
                  header: "الحالة", 
                  cell: (t) => (
                    <Badge tone={t.status === "active" ? "success" : t.status === "on_leave" ? "warning" : "danger"}>
                      {t.status === "active" ? "على رأس العمل" : t.status === "on_leave" ? "في إجازة" : "غير نشط"}
                    </Badge>
                  )
                },
                { 
                  key: "act", 
                  header: "الإجراءات", 
                  cell: (t) => (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openQuickAssignModal(t)}
                        className="inline-flex rounded-xl p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        title="إسناد مادة وشعبة سريعة"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setScheduleViewTeacher(t)}
                        className="inline-flex rounded-xl p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        title="عرض الجدول الأسبوعي للمعلم"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                      <Link 
                        to="/teachers/$id" 
                        params={{ id: t.employeeNo || t.id }} 
                        className="inline-flex rounded-xl p-2 text-primary hover:bg-primary/10 transition-colors" 
                        title="عرض وتعديل الملف المتكامل"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button 
                        onClick={() => openEditModal(t)} 
                        className="inline-flex rounded-xl p-2 text-primary hover:bg-primary/10 transition-colors" 
                        title="تعديل البيانات والإسناد"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setTeacherToDelete(t)} 
                        className="inline-flex rounded-xl p-2 text-danger hover:bg-danger/10 transition-colors" 
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                },
              ]}
            />
          </PageCard>
        ) : (
          /* View Mode 2: Grid Cards */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teachersList.map((t) => {
              const tAssigns = activeStageTeachingAssignments.filter(a => matchesStaffId(t, a.teacherId));
              const uniqueSubIds = Array.from(new Set(tAssigns.map(a => a.subjectId)));
              const tSubs = uniqueSubIds.map(id => activeStageSubjects.find(s => s.id === id)).filter(Boolean);
              const scheduledCount = activeStageScheduleSlots.filter(s => matchesStaffId(t, s.teacherId)).length;
              const targetQuota = (t as any).targetQuota || 24;
              const percentage = Math.min(100, Math.round((scheduledCount / targetQuota) * 100));

              return (
                <div 
                  key={t.id}
                  className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md flex flex-col justify-between group"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-muted text-muted-foreground border border-border/60">
                        {t.employeeNo || t.id}
                      </span>
                      <Badge tone={t.status === "active" ? "success" : t.status === "on_leave" ? "warning" : "danger"}>
                        {t.status === "active" ? "على رأس العمل" : t.status === "on_leave" ? "في إجازة" : "غير نشط"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <Link 
                          to="/teachers/$id" 
                          params={{ id: t.employeeNo || t.id }} 
                          className="font-black text-sm text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {t.name}
                        </Link>
                        <div className="text-[11px] font-bold text-muted-foreground mt-0.5">
                          {t.role} • {t.department || "الشؤون التعليمية"}
                        </div>
                      </div>
                    </div>

                    {/* Workload Meter */}
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-muted-foreground">العبء التدريسي المجدول:</span>
                        <span className="font-black text-foreground">
                          {scheduledCount} / {targetQuota} حصة
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            scheduledCount >= targetQuota 
                              ? "bg-emerald-500" 
                              : scheduledCount >= 16 
                              ? "bg-blue-500" 
                              : scheduledCount > 0 
                              ? "bg-amber-500" 
                              : "bg-muted"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Assigned Subjects */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-muted-foreground">المواد المقررة:</span>
                      <div className="flex flex-wrap gap-1 min-h-[24px]">
                        {tSubs.length > 0 ? (
                          tSubs.map(s => (
                            <Badge key={s!.id} tone="primary" className="text-[10px] font-black">
                              {s!.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                            بانتظار إسناد مواد
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bottom */}
                  <div className="pt-4 mt-3 border-t border-border/60 flex items-center justify-between">
                    <Link
                      to="/teachers/$id"
                      params={{ id: t.employeeNo || t.id }}
                      className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> الملف الكامل
                    </Link>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openQuickAssignModal(t)}
                        className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 transition-colors"
                        title="إسناد سريع"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setScheduleViewTeacher(t)}
                        className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-muted-foreground hover:text-indigo-600 transition-colors"
                        title="الجدول الأسبوعي"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                        title="تعديل"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setTeacherToDelete(t)}
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
      {/* ─── MODAL 1: Add Teacher (AdminModal tone="primary") ──────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <AdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="تسجيل معلم جديد بالهيئة التعليمية"
        subtitle="إدخال البيانات المهنية وتخصيص المواد والشعب في خطوة واحدة"
        icon={GraduationCap}
        tone="primary"
        size="large"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                الاسم الرباعي <span className="text-danger">*</span>
              </label>
              <input
                required
                placeholder="اسم المعلم كاملاً..."
                className="w-full h-11 rounded-xl border border-input bg-background px-3.5 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">الرقم الوظيفي</label>
              <input
                placeholder="مثال: EMP-204"
                className="w-full h-11 rounded-xl border border-input bg-background px-3.5 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all tabular-nums text-left"
                dir="ltr"
                value={formData.employeeNo}
                onChange={e => setFormData({...formData, employeeNo: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">المسمى والتكليف</label>
              <input
                placeholder="معلم صف، أستاذ مادة..."
                className="w-full h-11 rounded-xl border border-input bg-background px-3.5 text-xs font-bold text-foreground outline-none focus:border-primary"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">المؤهل العلمي</label>
              <select
                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground outline-none focus:border-primary cursor-pointer"
                value={formData.qualification}
                onChange={e => setFormData({...formData, qualification: e.target.value})}
              >
                <option value="بكالوريوس">بكالوريوس تربوي</option>
                <option value="ماجستير">ماجستير</option>
                <option value="دكتوراه">دكتوراه</option>
                <option value="دبلوم عالي">دبلوم تربوي عالي</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">النصاب المستهدف (حصص)</label>
              <input
                type="number"
                min="1"
                max="35"
                className="w-full h-11 rounded-xl border border-input bg-background px-3.5 text-xs font-bold text-foreground outline-none focus:border-primary tabular-nums"
                value={formData.targetQuota}
                onChange={e => setFormData({...formData, targetQuota: Number(e.target.value) || 24})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">رقم الجوال</label>
              <input
                placeholder="05XXXXXXXX"
                className="w-full h-11 rounded-xl border border-input bg-background px-3.5 text-xs font-bold text-foreground outline-none focus:border-primary tabular-nums text-left"
                dir="ltr"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">البريد الإلكتروني</label>
              <input
                type="email"
                placeholder="teacher@school.edu.sa"
                className="w-full h-11 rounded-xl border border-input bg-background px-3.5 text-xs font-bold text-foreground outline-none focus:border-primary text-left"
                dir="ltr"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          {/* Subjects & Sections Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary" /> المواد المسندة
                </span>
                <span className="text-[11px] font-bold text-muted-foreground">{formData.subjects.length} مادة</span>
              </div>
              <div className="space-y-1 max-h-[140px] overflow-y-auto pe-1 custom-scrollbar">
                {activeStageSubjects.map(sub => (
                  <label key={sub.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-card cursor-pointer transition-all border border-transparent hover:border-border/60 select-none">
                    <input 
                      type="checkbox" 
                      className="h-3.5 w-3.5 rounded border-input text-primary cursor-pointer"
                      checked={formData.subjects.includes(sub.id)}
                      onChange={() => toggleSubject(sub.id)}
                    />
                    <span className="font-bold text-xs text-foreground">{sub.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" /> الشُعب المخصصة
                </span>
                <span className="text-[11px] font-bold text-muted-foreground">{formData.sections.length} شعبة</span>
              </div>
              <div className="space-y-1 max-h-[140px] overflow-y-auto pe-1 custom-scrollbar">
                {activeStageSections.map(sec => (
                  <label key={sec.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-card cursor-pointer transition-all border border-transparent hover:border-border/60 select-none">
                    <input 
                      type="checkbox" 
                      className="h-3.5 w-3.5 rounded border-input text-primary cursor-pointer"
                      checked={formData.sections.includes(sec.id)}
                      onChange={() => toggleSection(sec.id)}
                    />
                    <span className="font-bold text-xs text-foreground">{sec.grade.replace("الصف ", "")} - شعبة {sec.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border hover:bg-accent transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
            >
              تسجيل المعلم واعتماد الإسناد
            </button>
          </div>
        </form>
      </AdminModal>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 2: Edit Teacher (AdminModal tone="primary") ─────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {editingTeacher && (
        <AdminModal
          isOpen={true}
          onClose={() => setEditingTeacher(null)}
          title={`تعديل بيانات المعلم: ${editingTeacher.name}`}
          subtitle={`الرقم الوظيفي: ${editingTeacher.employeeNo || editingTeacher.id}`}
          icon={Pencil}
          tone="primary"
          size="large"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">الاسم الرباعي</label>
                <input
                  required
                  className="w-full h-11 rounded-xl border border-input bg-background px-3.5 text-xs font-bold text-foreground outline-none focus:border-primary"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">الرقم الوظيفي</label>
                <input
                  className="w-full h-11 rounded-xl border border-input bg-background px-3.5 text-xs font-bold text-foreground outline-none focus:border-primary tabular-nums text-left"
                  dir="ltr"
                  value={formData.employeeNo}
                  onChange={e => setFormData({...formData, employeeNo: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">المسمى الوظيفي</label>
                <input
                  className="w-full h-11 rounded-xl border border-input bg-background px-3.5 text-xs font-bold text-foreground outline-none focus:border-primary"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">المؤهل العلمي</label>
                <select
                  className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground outline-none focus:border-primary cursor-pointer"
                  value={formData.qualification}
                  onChange={e => setFormData({...formData, qualification: e.target.value})}
                >
                  <option value="بكالوريوس">بكالوريوس تربوي</option>
                  <option value="ماجستير">ماجستير</option>
                  <option value="دكتوراه">دكتوراه</option>
                  <option value="دبلوم عالي">دبلوم تربوي عالي</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">النصاب المستهدف</label>
                <input
                  type="number"
                  min="1"
                  max="35"
                  className="w-full h-11 rounded-xl border border-input bg-background px-3.5 text-xs font-bold text-foreground outline-none focus:border-primary tabular-nums"
                  value={formData.targetQuota}
                  onChange={e => setFormData({...formData, targetQuota: Number(e.target.value) || 24})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">رقم الجوال</label>
                <input
                  className="w-full h-11 rounded-xl border border-input bg-background px-3.5 text-xs font-bold text-foreground outline-none focus:border-primary tabular-nums text-left"
                  dir="ltr"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">الحالة الوظيفية</label>
                <select
                  className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground outline-none focus:border-primary cursor-pointer"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="active">على رأس العمل</option>
                  <option value="on_leave">في إجازة</option>
                  <option value="terminated">غير نشط</option>
                </select>
              </div>
            </div>

            {/* Subjects & Sections Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-primary" /> المواد المسندة
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground">{formData.subjects.length} مادة</span>
                </div>
                <div className="space-y-1 max-h-[140px] overflow-y-auto pe-1 custom-scrollbar">
                  {activeStageSubjects.map(sub => (
                    <label key={sub.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-card cursor-pointer transition-all border border-transparent hover:border-border/60 select-none">
                      <input 
                        type="checkbox" 
                        className="h-3.5 w-3.5 rounded border-input text-primary cursor-pointer"
                        checked={formData.subjects.includes(sub.id)}
                        onChange={() => toggleSubject(sub.id)}
                      />
                      <span className="font-bold text-xs text-foreground">{sub.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" /> الشُعب المخصصة
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground">{formData.sections.length} شعبة</span>
                </div>
                <div className="space-y-1 max-h-[140px] overflow-y-auto pe-1 custom-scrollbar">
                  {activeStageSections.map(sec => (
                    <label key={sec.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-card cursor-pointer transition-all border border-transparent hover:border-border/60 select-none">
                      <input 
                        type="checkbox" 
                        className="h-3.5 w-3.5 rounded border-input text-primary cursor-pointer"
                        checked={formData.sections.includes(sec.id)}
                        onChange={() => toggleSection(sec.id)}
                      />
                      <span className="font-bold text-xs text-foreground">{sec.grade.replace("الصف ", "")} - شعبة {sec.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border hover:bg-accent transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                حفظ التعديلات
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 3: Fast Quick-Assign (AdminModal tone="success") ────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {quickAssignTeacher && (
        <AdminModal
          isOpen={true}
          onClose={() => setQuickAssignTeacher(null)}
          title={`إسناد تدريسي سريع للمعلم: ${quickAssignTeacher.name}`}
          subtitle={`تخصيص مقرر وشعبة جديدة لهذا المعلم مباشرة`}
          icon={UserPlus}
          tone="success"
          size="medium"
        >
          <form onSubmit={handleSaveQuickAssign} className="space-y-4">
            <div className="p-3 rounded-xl bg-muted/40 border border-border/80 text-xs space-y-1">
              <div className="font-black text-foreground">بيانات المعلم الحالية:</div>
              <div className="text-muted-foreground">
                المسمى: {quickAssignTeacher.role} • النصاب الحالي:{" "}
                <span className="font-bold text-foreground">
                  {activeStageScheduleSlots.filter(s => matchesStaffId(quickAssignTeacher, s.teacherId)).length} حصة
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                المادة الدراسية المراد إسنادها <span className="text-danger">*</span>
              </label>
              <select
                required
                value={assignSubId}
                onChange={e => setAssignSubId(e.target.value)}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground outline-none focus:border-primary cursor-pointer"
              >
                <option value="">-- اختر المادة --</option>
                {activeStageSubjects.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code} • {sub.creditHours || 3} حصص/أسبوع)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                الشعبة والفصل الدراسي <span className="text-danger">*</span>
              </label>
              <select
                required
                value={assignSecId}
                onChange={e => setAssignSecId(e.target.value)}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground outline-none focus:border-primary cursor-pointer"
              >
                <option value="">-- اختر الشعبة --</option>
                {activeStageSections.map(sec => (
                  <option key={sec.id} value={sec.id}>
                    {sec.grade} - شعبة ({sec.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setQuickAssignTeacher(null)}
                className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border hover:bg-accent transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="rounded-xl bg-success px-6 py-2.5 text-xs font-bold text-white hover:bg-success/90 transition-all shadow-md shadow-success/20"
              >
                تثبيت الإسناد الآن
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 4: Teacher Schedule Matrix (AdminModal tone="info") ─── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {scheduleViewTeacher && (
        <AdminModal
          isOpen={true}
          onClose={() => setScheduleViewTeacher(null)}
          title={`الجدول الأسبوعي المباشر للمعلم: ${scheduleViewTeacher.name}`}
          subtitle={`توزيع الحصص والفصول عبر أيام الأسبوع`}
          icon={Calendar}
          tone="info"
          size="large"
        >
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-xs border border-border/80">
                <thead>
                  <tr className="bg-muted/60 text-foreground font-black">
                    <th className="p-2.5 border border-border/80">اليوم</th>
                    {PERIODS.map(p => (
                      <th key={p} className="p-2.5 border border-border/80">
                        الحصة {p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_DAYS.map(day => (
                    <tr key={day} className="hover:bg-muted/20">
                      <td className="p-2.5 font-black border border-border/80 bg-muted/30">
                        {day}
                      </td>
                      {PERIODS.map(period => {
                        const slot = activeStageScheduleSlots.find(
                          s => matchesStaffId(scheduleViewTeacher, s.teacherId) && s.day === day && s.period === period
                        );
                        const sub = slot ? allSubjects.find(s => s.id === slot.subjectId) : null;
                        const sec = slot ? allSections.find(s => s.id === slot.sectionId) : null;

                        return (
                          <td key={period} className="p-2 border border-border/80 min-w-[90px] h-[65px] align-middle">
                            {slot ? (
                              <div className="rounded-lg p-1.5 bg-primary/10 border border-primary/25 space-y-0.5">
                                <div className="font-black text-primary text-[11px] line-clamp-1" title={sub?.name}>
                                  {sub?.name || "مادة"}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-bold">
                                  {sec ? `${sec.grade.replace("الصف ", "")}/${sec.name}` : ""}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/30 text-[10px]">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground font-bold">
                إجمالي الحصص المجدولة أسبوعياً:{" "}
                <span className="font-black text-primary">
                  {activeStageScheduleSlots.filter(s => matchesStaffId(scheduleViewTeacher, s.teacherId)).length} حصة
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/teachers/$id"
                  params={{ id: scheduleViewTeacher.employeeNo || scheduleViewTeacher.id }}
                  className="rounded-xl px-4 py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" /> فتح محرر الجدول المتقدم
                </Link>
                <button
                  onClick={() => setScheduleViewTeacher(null)}
                  className="rounded-xl px-4 py-2 text-xs font-bold border border-border hover:bg-accent transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ─── MODAL 5: Delete Teacher Confirmation (AdminModal tone="danger")*/}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {teacherToDelete && (
        <AdminModal
          isOpen={true}
          onClose={() => setTeacherToDelete(null)}
          title="تأكيد حذف المعلم من الهيئة التعليمية"
          subtitle="فحص الارتباطات والتأثيرات الأكاديمية قبل الحذف"
          icon={Trash2}
          tone="danger"
          size="medium"
        >
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-foreground leading-relaxed">
              هل أنت متأكد من رغبتك في حذف المعلم{" "}
              <strong className="text-danger font-black">
                "{teacherToDelete.name}" ({teacherToDelete.employeeNo || teacherToDelete.id})
              </strong>
              ؟
            </p>

            {/* Live Dependency Warning */}
            {(() => {
              const assignedCount = activeStageTeachingAssignments.filter(a => matchesStaffId(teacherToDelete, a.teacherId)).length;
              const scheduledSlotsCount = activeStageScheduleSlots.filter(s => matchesStaffId(teacherToDelete, s.teacherId)).length;
              const hasDependencies = assignedCount > 0 || scheduledSlotsCount > 0;

              return (
                <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  hasDependencies ? "bg-danger/10 border-danger/30 text-danger" : "bg-muted/40 border-border/70 text-muted-foreground"
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>فحص السجلات والأنصبة الحالية:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 ps-1">
                    <li>المواد والشعب المسندة: {assignedCount} إسناد</li>
                    <li>الحصص المجدولة في جدول المدرسة: {scheduledSlotsCount} حصة</li>
                  </ul>
                  {hasDependencies && (
                    <p className="font-bold text-[11px] pt-1 border-t border-danger/20">
                      تنبيه: سيؤدي الحذف إلى إلغاء إسناد المعلم للشعب المذكورة وإخلاء حصصه من الجدول الأسبوعي.
                    </p>
                  )}
                </div>
              );
            })()}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTeacherToDelete(null)}
                className="flex-1 rounded-xl border border-border py-2.5 text-xs font-bold hover:bg-accent transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 rounded-xl bg-danger py-2.5 text-xs font-bold text-white hover:bg-danger/90 transition-all shadow-md shadow-danger/20"
              >
                نعم، احذف المعلم
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Advanced Print Engine Modal */}
      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title={`كشف الهيئة التعليمية والأنصبة - ${getStageLabel(stage)}`}
        data={teachersList}
        templates={printTemplates}
      />
    </AppShell>
  );
}
