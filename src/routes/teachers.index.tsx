import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
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
  Calendar
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { isTeachingStaff, matchesStaffId } from "@/lib/staff-categories";

export const Route = createFileRoute("/teachers/")({
  head: () => ({
    meta: [
      { title: "الهيئة التعليمية (المعلمون والأساتذة) | منصة مدارسي" }, 
      { name: "description", content: "سجل المعلمين، الأنصبة التدريسية، المواد والشعب المخصصة والجدول الأسبوعي." }
    ],
  }),
  component: TeachersList,
});

function TeachersList() {
  const { 
    allStaff, 
    activeStageStaff, 
    activeStageSubjects, 
    activeStageSections, 
    activeStageTeachingAssignments,
    activeStageScheduleSlots,
    addStaff, 
    updateStaff, 
    deleteStaff, 
    addTeachingAssignment,
    deleteTeachingAssignment,
    currentAcademicYearId 
  } = useGlobalStore();
  const { stage, getStageLabel } = useStage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

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
    setEditingId(null);
    setFormData({
      name: "",
      role: "معلم",
      department: "الشؤون التعليمية",
      status: "active",
      employeeNo: "",
      phone: "",
      email: "",
      qualification: "بكالوريوس",
      experienceYears: 5,
      targetQuota: 24,
      subjects: [],
      sections: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (staff: any) => {
    setEditingId(staff.id);
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
      qualification: staff.qualification || "بكالوريوس",
      experienceYears: staff.experienceYears || 5,
      targetQuota: staff.targetQuota || 24,
      subjects: staff.subjects?.length ? staff.subjects : activeSubIds,
      sections: staff.sections?.length ? staff.sections : activeSecIds,
    });
    setIsModalOpen(true);
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("الرجاء إدخال اسم المعلم");

    let savedTeacherId = editingId;
    if (editingId) {
      updateStaff(editingId, { ...formData });
      toast.success("تم تعديل بيانات المعلم بنجاح");
    } else {
      if (formData.employeeNo) {
        const isDuplicateInCurrentYear = activeStageStaff.some((s: any) => s.employeeNo === formData.employeeNo);
        if (isDuplicateInCurrentYear) {
          toast.error("هذا المعلم مسجل مسبقاً في العام الدراسي الحالي! لا يمكن تسجيله مرة أخرى.");
          return;
        }
      }

      const newStaffId = `STF-${Date.now()}`;
      savedTeacherId = newStaffId;
      addStaff({ ...formData, id: newStaffId, stage, academicYearId: currentAcademicYearId } as any);
      toast.success("تمت إضافة المعلم بنجاح");
    }

    // Sync teaching assignments for selected subjects & sections
    if (savedTeacherId) {
      const cleanTeacherId = savedTeacherId.replace(/^EA-/, "");
      if (editingId) {
        activeStageTeachingAssignments
          .filter(a => matchesStaffId(editingId, a.teacherId))
          .forEach(a => deleteTeachingAssignment(a.id));
      }
      
      if (formData.subjects.length > 0 && formData.sections.length > 0) {
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
    }
    setIsModalOpen(false);
  };

  const handleSmartRegistrationCheck = (empNoToCheck: string) => {
    if (!empNoToCheck || empNoToCheck.length < 3) return;
    const existingStaff = allStaff.find((s: any) => s.employeeNo === empNoToCheck);
    if (existingStaff) {
      toast.success("تم العثور على سجل سابق للمعلم! جاري استيراد البيانات التاريخية...");
      setFormData(prev => ({
        ...prev,
        name: existingStaff.name,
        role: existingStaff.role,
        department: existingStaff.department,
        status: existingStaff.status as any,
        phone: existingStaff.phone || "",
        email: existingStaff.email || "",
      }));
    }
  };

  const confirmDelete = () => {
    if (staffToDelete) {
      deleteStaff(staffToDelete);
      toast.success("تم حذف المعلم بنجاح");
      setIsDeleteModalOpen(false);
      setStaffToDelete(null);
    }
  };

  // Strictly filter to Academic Faculty (المعلمون والأساتذة ومحضرو المختبرات)
  const teachersList = useMemo(() => {
    return activeStageStaff.filter(s => {
      if (s.isDeleted) return false;
      const isAcademic = isTeachingStaff(s) || activeStageTeachingAssignments.some(ta => matchesStaffId(s, ta.teacherId));
      if (!isAcademic) return false;

      // Subject Filter (المواد المقررة بدلاً من التخصصات)
      if (subjectFilter !== "all") {
        const tAssigns = activeStageTeachingAssignments.filter(a => matchesStaffId(s, a.teacherId));
        const matchesSub = tAssigns.some(a => a.subjectId === subjectFilter) || (s.subjects || []).includes(subjectFilter);
        if (!matchesSub) return false;
      }

      // Status & Load Filter (النصاب والحالة الوظيفية)
      if (statusFilter !== "all") {
        if (statusFilter === "active" && s.status !== "active") return false;
        if (statusFilter === "on_leave" && s.status !== "on_leave") return false;
        if (statusFilter === "full_quota") {
          const scheduled = activeStageScheduleSlots.filter(slot => matchesStaffId(s, slot.teacherId)).length;
          if (scheduled < 20) return false;
        }
        if (statusFilter === "unassigned") {
          const tAssigns = activeStageTeachingAssignments.filter(a => matchesStaffId(s, a.teacherId));
          if (tAssigns.length > 0) return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || (s.employeeNo || "").toLowerCase().includes(q) || (s.role || "").toLowerCase().includes(q) || (s.phone || "").includes(q);
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
      return scheduled >= 20;
    }).length;
  }, [teachersList, activeStageScheduleSlots]);

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
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-card border border-border/70 px-3.5 text-xs font-black shadow-xs hover:bg-accent transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-primary" />
            طباعة الكشف الأكاديمي
          </button>
          <button 
            onClick={openAddModal}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground hover:bg-primary/90 shadow-sm transition-all hover:scale-105 active:scale-95 glow-primary"
          >
            <Plus className="h-4 w-4" /> إضافة معلم جديد
          </button>
        </div>
      }
    >
      <div className="space-y-5" dir="rtl">
        {/* Unified Subnavigation Ribbon */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-3 overflow-x-auto custom-scrollbar">
          <Link 
            to="/teachers" 
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-xs glow-primary flex items-center gap-2 shrink-0"
          >
            <Users className="h-4 w-4" />
            <span>قائمة المعلمين والأساتذة</span>
          </Link>
          <Link 
            to="/academic/assignments" 
            className="px-4 py-2 rounded-xl bg-card border border-border/70 hover:bg-accent text-foreground text-xs font-bold transition-colors flex items-center gap-2 shrink-0"
          >
            <UserCog className="h-4 w-4 text-primary" />
            <span>الإسناد التدريسي للكوادر</span>
          </Link>
          <Link 
            to="/schedule" 
            className="px-4 py-2 rounded-xl bg-card border border-border/70 hover:bg-accent text-foreground text-xs font-bold transition-colors flex items-center gap-2 shrink-0"
          >
            <CalendarRange className="h-4 w-4 text-primary" />
            <span>الجدول الأسبوعي للحصص</span>
          </Link>
        </div>

        {/* Academic Faculty Stats Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-xs backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground">أعضاء الهيئة التعليمية</span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground mt-1 tabular-nums flex items-baseline gap-1.5">
              <span>{teachersList.length}</span>
              <span className="text-xs text-muted-foreground font-normal">معلماً وأستاذاً</span>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-xs backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground">إجمالي الحصص المجدولة</span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-primary mt-1 tabular-nums flex items-baseline gap-1.5">
              <span>{totalAssignedSlots}</span>
              <span className="text-xs text-muted-foreground font-normal">حصة / أسبوع</span>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-xs backdrop-blur-xl">
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

          <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-xs backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground">مكتملو النصاب (20+ حصة)</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 tabular-nums flex items-baseline gap-1.5">
              <span>{fullQuotaCount}</span>
              <span className="text-xs text-muted-foreground font-normal">معلم ({Math.round((fullQuotaCount / (teachersList.length || 1)) * 100)}%)</span>
            </div>
          </div>
        </div>

        {/* Subject Filter Ribbon & Controls (المواد الدراسية بدلاً من التخصصات) */}
        <div className="bg-card/90 p-4 sm:p-5 rounded-3xl border border-border/80 shadow-xs backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-xs font-black text-foreground">تصفية المعلمين حسب المادة الدراسية:</span>
            </div>
            <span className="text-[11px] font-bold text-muted-foreground">
              {subjectFilter === "all" ? `عرض جميع المواد (${teachersList.length} معلماً)` : activeStageSubjects.find(s => s.id === subjectFilter)?.name}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            <button
              onClick={() => setSubjectFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${
                subjectFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-sm glow-primary scale-[1.02]"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
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
                      ? "bg-primary text-primary-foreground shadow-sm glow-primary scale-[1.02]"
                      : "bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
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
                { id: "full_quota", label: "مكتملو النصاب (20+ حصة)" },
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
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                        بانتظار إسناد مواد
                      </span>
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
                    <Link 
                      to="/teachers/$id" 
                      params={{ id: t.employeeNo || t.id }} 
                      className="inline-flex rounded-xl p-2 text-primary hover:bg-primary/10 transition-colors" 
                      title="عرض وتعديل الملف المتكامل"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link 
                      to="/teachers/$id" 
                      params={{ id: t.employeeNo || t.id }} 
                      className="inline-flex rounded-xl p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors" 
                      title="الجدول الأسبوعي المباشر للمعلم"
                    >
                      <Calendar className="h-4 w-4" />
                    </Link>
                    <button 
                      onClick={() => openEditModal(t)} 
                      className="inline-flex rounded-xl p-2 text-primary hover:bg-primary/10 transition-colors" 
                      title="تعديل البيانات والإسناد"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => { setStaffToDelete(t.id); setIsDeleteModalOpen(true); }} 
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
      </div>

      {/* Add/Edit Modal (Comfortable screen size: max-w-xl and max-h-[85vh]) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
          <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/60 shrink-0 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/15 text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-foreground">{editingId ? "تعديل بيانات المعلم" : "تسجيل معلم جديد"}</h2>
                  <p className="text-xs text-muted-foreground">إدارة بيانات المعلم والمواد والشعب المسندة</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
              <form id="teacher-form" onSubmit={handleSave} className="space-y-5">
                
                {/* Basic Info Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black flex items-center gap-2 text-primary uppercase tracking-wider">
                    <span className="w-1.5 h-3.5 bg-primary rounded-full inline-block"></span>
                    البيانات الشخصية والمهنية
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-foreground">الاسم الرباعي <span className="text-destructive">*</span></label>
                      <input
                        required
                        placeholder="اسم المعلم كاملاً..."
                        className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-foreground">الرقم الوظيفي</label>
                      <input
                        placeholder="مثال: EMP-204"
                        className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all tabular-nums text-left placeholder:text-muted-foreground/60"
                        dir="ltr"
                        value={formData.employeeNo}
                        onChange={e => setFormData({...formData, employeeNo: e.target.value})}
                        onBlur={(e) => handleSmartRegistrationCheck(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-foreground">المسمى والتكليف الوظيفي</label>
                      <input
                        placeholder="معلم صف، أستاذ مادة، محضر مختبر..."
                        className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-foreground">المؤهل العلمي</label>
                      <select
                        className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                        value={formData.qualification}
                        onChange={e => setFormData({...formData, qualification: e.target.value})}
                      >
                        <option value="بكالوريوس">بكالوريوس تربوي</option>
                        <option value="ماجستير">ماجستير</option>
                        <option value="دكتوراه">دكتوراه</option>
                        <option value="دبلوم عالي">دبلوم تربوي عالي</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-foreground">سنوات الخبرة</label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all tabular-nums"
                        value={formData.experienceYears}
                        onChange={e => setFormData({...formData, experienceYears: Number(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-foreground">النصاب المستهدف</label>
                      <input
                        type="number"
                        min="1"
                        max="35"
                        className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all tabular-nums"
                        value={formData.targetQuota}
                        onChange={e => setFormData({...formData, targetQuota: Number(e.target.value) || 24})}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-foreground">الحالة الوظيفية</label>
                      <select
                        className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                      >
                        <option value="active">على رأس العمل</option>
                        <option value="on_leave">في إجازة</option>
                        <option value="terminated">غير نشط</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-foreground">رقم الجوال</label>
                      <input
                        placeholder="05XXXXXXXX"
                        className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all tabular-nums text-left placeholder:text-muted-foreground/60"
                        dir="ltr"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-foreground">البريد الإلكتروني</label>
                      <input
                        type="email"
                        placeholder="teacher@school.edu.sa"
                        className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-left placeholder:text-muted-foreground/60"
                        dir="ltr"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Direct Teaching Assignments Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-border/50">
                  <div className="bg-muted/25 p-3.5 rounded-2xl border border-border/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-primary" /> المواد المسندة
                      </span>
                      <span className="text-[11px] font-bold text-muted-foreground">{formData.subjects.length} مادة</span>
                    </div>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pe-1 custom-scrollbar">
                      {activeStageSubjects.length === 0 ? (
                        <p className="text-xs text-muted-foreground">لا توجد مواد مضافة في هذه المرحلة.</p>
                      ) : (
                        activeStageSubjects.map(sub => (
                          <label key={sub.id} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-card cursor-pointer transition-all border border-transparent hover:border-border/60 select-none">
                            <input 
                              type="checkbox" 
                              className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary/20 cursor-pointer"
                              checked={formData.subjects.includes(sub.id)}
                              onChange={() => toggleSubject(sub.id)}
                            />
                            <span className="font-bold text-xs text-foreground">{sub.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-muted/25 p-3.5 rounded-2xl border border-border/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-primary" /> الشُعب المخصصة
                      </span>
                      <span className="text-[11px] font-bold text-muted-foreground">{formData.sections.length} شعبة</span>
                    </div>
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pe-1 custom-scrollbar">
                      {activeStageSections.length === 0 ? (
                        <p className="text-xs text-muted-foreground">لا توجد شُعب مضافة في هذه المرحلة.</p>
                      ) : (
                        activeStageSections.map(sec => (
                          <label key={sec.id} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-card cursor-pointer transition-all border border-transparent hover:border-border/60 select-none">
                            <input 
                              type="checkbox" 
                              className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary/20 cursor-pointer"
                              checked={formData.sections.includes(sec.id)}
                              onChange={() => toggleSection(sec.id)}
                            />
                            <span className="font-bold text-xs text-foreground">{sec.grade.replace("الصف ", "")} - شعبة {sec.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-border/60 flex justify-end gap-2.5 bg-card shrink-0">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="h-10 rounded-xl px-5 text-xs font-bold border border-input bg-background/80 hover:bg-accent active:scale-[0.98] transition-all"
              >
                إلغاء
              </button>
              <button 
                form="teacher-form" 
                type="submit" 
                className="h-10 rounded-xl bg-primary px-7 text-xs font-black text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md glow-primary"
              >
                {editingId ? "حفظ التعديلات الأكاديمية" : "إضافة المعلم وتثبيت الإسناد"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
          <div className="w-full max-w-sm rounded-3xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-2xl bg-destructive/10 p-3.5 text-destructive mb-3.5"><AlertCircle className="h-8 w-8" /></div>
              <h2 className="text-base font-black text-foreground mb-1.5">تأكيد حذف المعلم</h2>
              <p className="text-muted-foreground mb-5 text-xs font-bold leading-relaxed">هل أنت متأكد من حذف بيانات هذا المعلم؟ سيتم إلغاء ارتباطه بالشعب والحصص المسندة إليه.</p>
              
              <div className="flex w-full gap-2.5">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)} 
                  className="flex-1 h-10 rounded-xl border border-input bg-background/80 hover:bg-accent text-xs font-bold active:scale-[0.98] transition-all"
                >
                  إلغاء
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-xs font-black hover:bg-destructive/90 active:scale-[0.98] transition-all shadow-md"
                >
                  نعم، احذف المعلم
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title={`كشف الهيئة التعليمية - ${getStageLabel(stage)}`}
        data={teachersList}
        templates={printTemplates}
      />
    </AppShell>
  );
}
