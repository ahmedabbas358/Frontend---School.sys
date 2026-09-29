import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Printer, 
  Eye, 
  Pencil, 
  Trash2, 
  X, 
  AlertCircle,
  Briefcase,
  Layers,
  Sparkles,
  QrCode,
  ShieldCheck,
  KeyRound,
  Calendar,
  BookOpen,
  CheckCircle2,
  Clock,
  UserPlus,
  FileText,
  Coins,
  FileCheck
} from "lucide-react";
import { useState, useMemo } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { 
  STAFF_SECTOR_TABS, 
  STAFF_SECTOR_CONFIG, 
  getStaffSector, 
  isTeachingStaff, 
  matchesStaffId,
  StaffSector 
} from "@/lib/staff-categories";
import {
  StaffAddEditModal,
  StaffUserAccountModal,
  StaffQuickLeaveModal,
  StaffTeachingAssignmentsModal,
  StaffQuickPreviewModal,
  StaffSmartBadgeModal,
  StaffDeleteConfirmModal,
  StaffDocumentModal,
  StaffAdvanceModal
} from "@/components/hr/staff-modals";

export const Route = createFileRoute("/hr/staff/")({
  head: () => ({
    meta: [
      { title: "سجل كافة العاملين والموظفين | الموارد البشرية" },
      { name: "description", content: "السجل المركزي الشامل لكافة العاملين والكوادر التعليمية والإدارية والخدمية والنقل بالمدرسة." }
    ],
  }),
  component: HrStaffIndex,
});

function HrStaffIndex() {
  const { 
    currency, 
    allStaff, 
    activeStageStaff, 
    activeStageTeachingAssignments, 
    activeStageSubjects, 
    activeStageSections, 
    addStaff, 
    updateStaff,
    deleteStaff,
    allUsers,
    addUser,
    updateUser,
    addStaffLeave,
    addTeachingAssignment,
    deleteTeachingAssignment,
    systemSettings,
    currentAcademicYearId,
    addStaffAdvance,
    batchCreateStaffUsers
  } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  
  // Filter States
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [activeSector, setActiveSector] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<"all" | "has_account" | "no_account">("all");
  
  // Modal Control States
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [previewStaff, setPreviewStaff] = useState<any | null>(null);
  const [accountStaff, setAccountStaff] = useState<any | null>(null);
  const [leaveStaff, setLeaveStaff] = useState<any | null>(null);
  const [assignmentsStaff, setAssignmentsStaff] = useState<any | null>(null);
  const [badgeStaff, setBadgeStaff] = useState<any | null>(null);
  const [documentStaff, setDocumentStaff] = useState<any | null>(null);
  const [advanceStaff, setAdvanceStaff] = useState<any | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<any | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Helper to find linked user account in allUsers
  const findLinkedUser = (s: any) => {
    if (!s) return null;
    return allUsers.find(
      (u) =>
        (u.staffId && u.staffId === s.id) ||
        (u.email && s.email && u.email.trim().toLowerCase() === s.email.trim().toLowerCase()) ||
        (u.fullName && s.name && u.fullName.trim() === s.name.trim()) ||
        (u.username && s.employeeNo && u.username.toLowerCase() === s.employeeNo.toLowerCase()) ||
        (u.username && u.username.toLowerCase() === `emp_${(s.employeeNo || s.id).toString().toLowerCase()}`)
    ) || null;
  };

  // Open Handlers
  const handleOpenAdd = () => {
    setEditingStaff(null);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (s: any) => {
    setEditingStaff(s);
    setIsAddEditOpen(true);
  };

  // Save Staff (Add or Edit)
  const handleSaveStaff = (
    staffData: any, 
    userAccountParams?: { shouldCreate: boolean; username: string; role: string; password?: string }
  ) => {
    if (editingStaff?.id) {
      updateStaff(editingStaff.id, staffData);
      toast.success("تم تحديث بيانات الموظف بنجاح");
    } else {
      addStaff(staffData);
      toast.success("تم تسجيل الموظف الجديد بنجاح في المنظومة");

      // Auto-create User Account if requested
      if (userAccountParams?.shouldCreate) {
        addUser({
          username: userAccountParams.username,
          fullName: staffData.name,
          role: userAccountParams.role,
          status: "active",
          email: staffData.email || "",
          phone: staffData.phone || "",
          password: userAccountParams.password || "Staff@2026",
          stageScope: staffData.stage || "all",
          staffId: staffData.id || staffData.employeeNo || "",
          notes: `حساب تم إنشاؤه تلقائياً عند تسجيل الموظف (رقم: ${staffData.employeeNo || "تلقائي"})`,
          lastLogin: "لم يسجل دخول",
          twoFactorEnabled: false,
          createdAt: new Date().toISOString().split("T")[0],
        });
        toast.success(`تم إنشاء وتفعيل حساب الدخول @${userAccountParams.username} بنجاح`);
      }
    }
    setIsAddEditOpen(false);
    setEditingStaff(null);
  };

  // Delete Staff
  const handleConfirmDelete = () => {
    if (staffToDelete?.id) {
      deleteStaff(staffToDelete.id);
      toast.success(`تم حذف سجل الموظف ${staffToDelete.name} بنجاح ونقله لسلة المحذوفات`);
      setStaffToDelete(null);
    }
  };

  // User Account Management Actions
  const handleLinkOrCreateUser = (userData: any) => {
    addUser(userData);
    toast.success(`تم إنشاء وربط حساب المستخدم @${userData.username} بنجاح`);
  };

  const handleResetUserPassword = (userId: string, newPassword: string) => {
    updateUser(userId, { 
      password: newPassword,
      notes: `تمت إعادة تعيين كلمة المرور (${newPassword}) بتاريخ ${new Date().toLocaleDateString("ar-SA")}` 
    });
    toast.success("تم حفظ وتحديث كلمة المرور الجديدة في النظام بنجاح");
  };

  const handleToggleUserStatus = (userId: string, newStatus: "active" | "disabled") => {
    updateUser(userId, { status: newStatus });
    toast.success(`تم ${newStatus === "active" ? "تفعيل" : "تعطيل"} حساب المستخدم بنجاح`);
  };

  // Leave Management Action
  const handleSaveLeave = (leaveData: any, setStaffOnLeave: boolean) => {
    addStaffLeave(leaveData, setStaffOnLeave);
  };

  // Advance Management Action
  const handleSaveAdvance = (advanceData: any) => {
    addStaffAdvance(advanceData);
  };

  // Unlinked Staff List for 1-Click Provisioning
  const unlinkedStaffList = useMemo(() => {
    return activeStageStaff.filter((s) => !s.isDeleted && !findLinkedUser(s));
  }, [activeStageStaff, allUsers]);

  const handleBatchSyncUsers = () => {
    if (unlinkedStaffList.length === 0) {
      toast.info("جميع موظفي الكادر لديهم حسابات دخول مفعلة بالفعل!");
      return;
    }
    const staffPayload = unlinkedStaffList.map((s) => ({
      staffId: s.id,
      username: `emp_${(s.employeeNo || s.id).toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      fullName: s.name,
      role: s.role.includes("معلم") ? "معلم" : s.role.includes("محاسب") ? "محاسب مالي" : "إداري",
      email: s.email,
      phone: s.phone,
      stageScope: (s.stage as any) || "all",
    }));
    const createdCount = batchCreateStaffUsers(staffPayload);
    toast.success(`تم إنشاء وتفعيل ${createdCount} حساب دخول جديد للكادر المدرسي بنجاح`);
  };

  // Filter List
  const filtered = useMemo(() => {
    return activeStageStaff.filter((s) => {
      if (s.isDeleted) return false;
      
      // Sector filter
      if (activeSector !== "all") {
        const sector = getStaffSector(s);
        if (sector !== activeSector) return false;
      }

      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (departmentFilter !== "all" && s.department !== departmentFilter) return false;
      
      // User account filter
      if (accountFilter !== "all") {
        const hasAccount = Boolean(findLinkedUser(s));
        if (accountFilter === "has_account" && !hasAccount) return false;
        if (accountFilter === "no_account" && hasAccount) return false;
      }

      if (q.trim()) {
        const query = q.toLowerCase();
        return (
          s.name.toLowerCase().includes(query) || 
          s.role.toLowerCase().includes(query) || 
          s.id.toLowerCase().includes(query) || 
          (s.employeeNo || "").toLowerCase().includes(query) || 
          (s.phone || "").includes(query)
        );
      }
      return true;
    });
  }, [q, statusFilter, departmentFilter, activeSector, accountFilter, activeStageStaff, allUsers]);

  const departments = useMemo(() => {
    return Array.from(new Set(activeStageStaff.map((item) => item.department).filter(Boolean)));
  }, [activeStageStaff]);

  const staffStats = useMemo(() => {
    const total = filtered.length;
    const active = filtered.filter((item) => item.status === "active").length;
    const leaves = filtered.filter((item) => item.status === "on_leave").length;
    const payroll = filtered.reduce((sum, item) => sum + (item.basicSalary || 0) + (item.allowance || 0) - (item.deduction || 0), 0);
    const withAccount = filtered.filter((item) => Boolean(findLinkedUser(item))).length;
    return { total, active, leaves, payroll, withAccount };
  }, [filtered, allUsers]);

  const getAssignmentsSummary = (staff: any) => {
    if (!isTeachingStaff(staff)) {
      const sector = getStaffSector(staff);
      const meta = STAFF_SECTOR_CONFIG[sector];
      return (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${meta.bgLightClass} ${meta.accentClass}`}>
          {meta.shortLabel}
        </span>
      );
    }

    const assignments = activeStageTeachingAssignments.filter((item) => matchesStaffId(staff, item.teacherId));
    if (assignments.length === 0) {
      return (
        <button
          onClick={() => setAssignmentsStaff(staff)}
          className="text-[11px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-md transition-colors inline-flex items-center gap-1"
          title="انقر لإسناد المواد والشعب"
        >
          <Plus className="h-3 w-3" /> بانتظار إسناد
        </button>
      );
    }

    const subjects = new Set(assignments.map((item) => activeStageSubjects.find((subject) => subject.id === item.subjectId)?.name).filter(Boolean));
    const sections = new Set(assignments.map((item) => {
      const section = activeStageSections.find((sec) => sec.id === item.sectionId);
      return section ? `${section.grade}/${section.name}` : "";
    }).filter(Boolean));
    
    return (
      <button 
        onClick={() => setAssignmentsStaff(staff)}
        className="flex flex-col text-xs text-right hover:opacity-80 transition-opacity"
        title="انقر لتعديل التكليف الأكاديمي"
      >
        <span className="font-black text-primary flex items-center gap-1">
          <BookOpen className="h-3 w-3" /> {subjects.size} مادة
        </span>
        <span className="text-[10px] text-muted-foreground font-bold">{sections.size} شعبة دراسية</span>
      </button>
    );
  };

  const printTemplates: PrintTemplate[] = [
    {
      id: "staff-list",
      name: "سجل العاملين الشامل بالمنشأة",
      category: "شؤون الموظفين",
      type: "table",
      columns: [
        { label: "الرقم الوظيفي", key: "employeeNo" },
        { label: "الاسم", key: "name" },
        { label: "المسمى الوظيفي", key: "role" },
        { label: "القطاع", key: "sectorLabel" },
        { label: "القسم", key: "department" },
        { label: "الهاتف", key: "phone" },
        { label: "الراتب الصافي", key: "netSalary" },
        { label: "حساب الدخول", key: "accountUsername" },
        { label: "نطاق العمل", key: "stageLabel" },
        { label: "الحالة", key: "statusLabel" },
      ],
      description: "كشف مجمع بكافة الموظفين والعاملين حسب الفلاتر المطبقة"
    }
  ];

  const printData = filtered.map((item) => {
    const user = findLinkedUser(item);
    return {
      ...item,
      employeeNo: item.employeeNo || item.id,
      sectorLabel: STAFF_SECTOR_CONFIG[getStaffSector(item)].label,
      stageLabel: item.stage === "all" ? "شامل" : getStageLabel(item.stage as any),
      statusLabel: item.status === "active" ? "على رأس العمل" : item.status === "on_leave" ? "في إجازة" : "غير نشط",
      netSalary: ((item.basicSalary || 0) + (item.allowance || 0) - (item.deduction || 0)).toLocaleString(),
      accountUsername: user ? `@${user.username} (${user.role})` : "بدون حساب",
    };
  });

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "شؤون الموظفين (HR)" },
        { label: "سجل كافة العاملين والموظفين" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          {unlinkedStaffList.length > 0 && (
            <button
              onClick={handleBatchSyncUsers}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3.5 text-xs font-black shadow-xs hover:bg-amber-500/20 transition-all hover:scale-105 active:scale-95"
              title="مزامنة وإنشاء حسابات دخول لكافة الكادر المتبقي بنقرة واحدة"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>مزامنة حسابات الكادر ({unlinkedStaffList.length})</span>
            </button>
          )}
          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-card border border-border/70 px-3.5 text-xs font-black shadow-xs hover:bg-accent transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-primary" />
            طباعة السجل الشامل
          </button>
          <button 
            onClick={handleOpenAdd}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground hover:bg-primary/90 shadow-sm transition-all hover:scale-105 active:scale-95 glow-primary"
          >
            <Plus className="h-4 w-4" /> إضافة موظف / كادر جديد
          </button>
        </div>
      }
    >
      <div className="space-y-5" dir="rtl">
        
        {/* Sector Category Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-card border border-border/70 shadow-xs overflow-x-auto custom-scrollbar">
          {STAFF_SECTOR_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSector === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSector(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 select-none ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-xs glow-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Staff Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-xs backdrop-blur-xl">
            <span className="text-[11px] font-bold text-muted-foreground">إجمالي القوى العاملة</span>
            <div className="text-2xl font-black text-foreground mt-1 tabular-nums flex items-baseline gap-1.5">
              <span>{staffStats.total}</span>
              <span className="text-xs text-muted-foreground font-normal">موظف وعامل</span>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-xs backdrop-blur-xl">
            <span className="text-[11px] font-bold text-muted-foreground">على رأس العمل</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums flex items-baseline gap-1.5">
              <span>{staffStats.active}</span>
              <span className="text-xs text-muted-foreground font-normal">نشط</span>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-xs backdrop-blur-xl">
            <span className="text-[11px] font-bold text-muted-foreground">حسابات النظام المفعلة</span>
            <div className="text-2xl font-black text-primary mt-1 tabular-nums flex items-baseline gap-1.5">
              <span>{staffStats.withAccount}</span>
              <span className="text-xs text-muted-foreground font-normal">من أصل {staffStats.total}</span>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-xs backdrop-blur-xl">
            <span className="text-[11px] font-bold text-muted-foreground">إجمالي مسير الأجور الشهري</span>
            <div className="text-2xl font-black text-foreground mt-1 tabular-nums flex items-baseline gap-1.5">
              <span>{staffStats.payroll.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground font-normal">{currency}</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-xs">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative lg:col-span-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="البحث بالاسم أو الرقم الوظيفي أو الوظيفة..."
                className="h-10 w-full rounded-xl border border-input bg-background/80 ps-9 pe-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">كل الحالات الوظيفية</option>
              <option value="active">على رأس العمل</option>
              <option value="on_leave">في إجازة</option>
              <option value="terminated">منتهي الخدمة</option>
            </select>

            <select 
              value={departmentFilter} 
              onChange={(e) => setDepartmentFilter(e.target.value)} 
              className="h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">كل الأقسام والإدارات</option>
              {departments.map((dep) => <option key={dep} value={dep}>{dep}</option>)}
            </select>

            <select 
              value={accountFilter} 
              onChange={(e) => setAccountFilter(e.target.value as any)} 
              className="h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">كل الموظفين (حسابات وبدون)</option>
              <option value="has_account">الموظفون ذوو حسابات النظام فقط</option>
              <option value="no_account">الموظفون بدون حسابات نظام</option>
            </select>
          </div>
        </div>

        {/* Main Central Staff Directory Table */}
        <PageCard>
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-base font-black text-foreground">
                سجل العاملين ({activeSector === "all" ? "كافة القطاعات" : STAFF_SECTOR_CONFIG[activeSector as StaffSector]?.label})
              </h2>
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              {filtered.length} موظف مسجل
            </span>
          </div>

          <DataTable
            rows={filtered}
            columns={[
              { 
                key: "id", 
                header: "الرقم الوظيفي", 
                cell: (r) => (
                  <button
                    onClick={() => setPreviewStaff(r)}
                    className="font-black tabular-nums text-xs text-muted-foreground hover:text-primary transition-colors text-right"
                    title="معاينة الموظف"
                  >
                    {r.employeeNo || r.id}
                  </button>
                )
              },
              { 
                key: "name", 
                header: "الاسم والمسمى الوظيفي", 
                cell: (r) => {
                  const isTeacher = isTeachingStaff(r);
                  const profileUrl = isTeacher ? `/teachers/${r.employeeNo || r.id}` : `/hr/staff/${r.employeeNo || r.id}`;
                  return (
                    <div>
                      <Link 
                        to={profileUrl as any} 
                        className="font-black text-sm text-primary hover:underline flex items-center gap-1.5"
                      >
                        {r.name}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground font-bold">
                        <span>{r.role}</span>
                        <span className="h-3 w-px bg-border"></span>
                        <span className="text-[11px]">{r.department}</span>
                      </div>
                    </div>
                  );
                } 
              },
              {
                key: "sector",
                header: "التصنيف القطاعي",
                cell: (r) => {
                  const sector = getStaffSector(r);
                  const meta = STAFF_SECTOR_CONFIG[sector];
                  return (
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg border inline-flex items-center gap-1 ${meta.bgLightClass} ${meta.accentClass} ${meta.borderClass}`}>
                      {meta.shortLabel}
                    </span>
                  );
                }
              },
              { 
                key: "account", 
                header: "حساب الدخول للنظام", 
                cell: (r) => {
                  const user = findLinkedUser(r);
                  if (user) {
                    return (
                      <button
                        onClick={() => setAccountStaff(r)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                        title="إدارة بيانات الدخول وكلمة المرور"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span dir="ltr">@{user.username}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">({user.role})</span>
                      </button>
                    );
                  }
                  return (
                    <button
                      onClick={() => setAccountStaff(r)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 transition-all border border-amber-500/20"
                      title="إنشاء حساب دخول في النظام لهذا الموظف"
                    >
                      <UserPlus className="h-3 w-3" />
                      <span>إنشاء حساب</span>
                    </button>
                  );
                } 
              },
              { 
                key: "salary", 
                header: "الراتب الصافي", 
                cell: (r) => {
                  const net = (r.basicSalary || 0) + (r.allowance || 0) - (r.deduction || 0);
                  return (
                    <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {net.toLocaleString()} {currency}
                    </span>
                  );
                }
              },
              { 
                key: "assignments", 
                header: "التكليف / الحصص", 
                cell: (r) => getAssignmentsSummary(r) 
              },
              {
                key: "status",
                header: "الحالة",
                cell: (r) => (
                  <Badge tone={r.status === "active" ? "success" : r.status === "on_leave" ? "warning" : "danger"}>
                    {r.status === "active" ? "على رأس العمل" : r.status === "on_leave" ? "في إجازة" : "غير نشط"}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "الإجراءات والتحكم",
                cell: (r) => {
                  const isTeacher = isTeachingStaff(r);
                  return (
                    <div className="flex items-center justify-end gap-1">
                      {/* Preview Modal Button */}
                      <button
                        onClick={() => setPreviewStaff(r)}
                        className="inline-flex rounded-xl p-2 text-primary hover:bg-primary/10 transition-colors"
                        title="معاينة الملف السريع"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* System Account Modal */}
                      <button
                        onClick={() => setAccountStaff(r)}
                        className="inline-flex rounded-xl p-2 text-primary hover:bg-primary/10 transition-colors"
                        title="إدارة حساب الدخول للنظام"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>

                      {/* Quick Leave Modal */}
                      <button
                        onClick={() => setLeaveStaff(r)}
                        className="inline-flex rounded-xl p-2 text-amber-600 hover:bg-amber-500/10 transition-colors"
                        title="تسجيل إجازة / استئذان فوري"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>

                      {/* Teaching Assignments Modal (Teachers only) */}
                      {isTeacher && (
                        <button
                          onClick={() => setAssignmentsStaff(r)}
                          className="inline-flex rounded-xl p-2 text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                          title="إسناد المواد والشعب الدراسية"
                        >
                          <BookOpen className="h-4 w-4" />
                        </button>
                      )}

                      {/* Official Documents Generator Modal */}
                      <button 
                        onClick={() => setDocumentStaff(r)} 
                        className="inline-flex rounded-xl p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors" 
                        title="إصدار مستندات وإفادات رسمية (تعريف بالراتب / خبرة / إخلاء طرف)"
                      >
                        <FileText className="h-4 w-4" />
                      </button>

                      {/* Salary Advance / Loan Modal */}
                      <button 
                        onClick={() => setAdvanceStaff(r)} 
                        className="inline-flex rounded-xl p-2 text-emerald-600 hover:bg-emerald-500/10 transition-colors" 
                        title="طلب سلفة مالية / قرض قصير الأجل"
                      >
                        <Coins className="h-4 w-4" />
                      </button>

                      {/* Printable Smart Badge */}
                      <button 
                        onClick={() => setBadgeStaff(r)} 
                        className="inline-flex rounded-xl p-2 text-amber-600 hover:bg-amber-500/10 transition-colors" 
                        title="طباعة بطاقة الهوية الذكية"
                      >
                        <QrCode className="h-4 w-4" />
                      </button>

                      {/* Edit Modal */}
                      <button 
                        onClick={() => handleOpenEdit(r)} 
                        className="inline-flex rounded-xl p-2 text-primary hover:bg-primary/10 transition-colors" 
                        title="تعديل البيانات الشاملة"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      {/* Delete Modal */}
                      <button 
                        onClick={() => setStaffToDelete(r)} 
                        className="inline-flex rounded-xl p-2 text-danger hover:bg-danger/10 transition-colors" 
                        title="حذف الموظف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                }
              }
            ]}
            empty="لم يتم العثور على موظفين أو عمال يطابقون خيارات البحث والتصفية المحددة."
          />
        </PageCard>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. ADD / EDIT STAFF MODAL (MULTI-TABBED)
         ───────────────────────────────────────────────────────────── */}
      <StaffAddEditModal
        isOpen={isAddEditOpen}
        onClose={() => { setIsAddEditOpen(false); setEditingStaff(null); }}
        initialData={editingStaff}
        onSave={handleSaveStaff}
        currency={currency}
        departments={departments}
        activeStageStaff={activeStageStaff}
        allStaff={allStaff}
        currentAcademicYearId={currentAcademicYearId}
      />

      {/* ─────────────────────────────────────────────────────────────
          2. STAFF SYSTEM USER ACCOUNT MODAL
         ───────────────────────────────────────────────────────────── */}
      <StaffUserAccountModal
        isOpen={Boolean(accountStaff)}
        onClose={() => setAccountStaff(null)}
        staff={accountStaff}
        linkedUser={findLinkedUser(accountStaff)}
        onLinkOrCreate={handleLinkOrCreateUser}
        onResetPassword={handleResetUserPassword}
        onToggleUserStatus={handleToggleUserStatus}
      />

      {/* ─────────────────────────────────────────────────────────────
          3. STAFF QUICK LEAVE REGISTRATION MODAL
         ───────────────────────────────────────────────────────────── */}
      <StaffQuickLeaveModal
        isOpen={Boolean(leaveStaff)}
        onClose={() => setLeaveStaff(null)}
        staff={leaveStaff}
        allStaff={activeStageStaff}
        onSaveLeave={handleSaveLeave}
      />

      {/* ─────────────────────────────────────────────────────────────
          4. STAFF TEACHING ASSIGNMENTS MODAL
         ───────────────────────────────────────────────────────────── */}
      <StaffTeachingAssignmentsModal
        isOpen={Boolean(assignmentsStaff)}
        onClose={() => setAssignmentsStaff(null)}
        staff={assignmentsStaff}
        subjects={activeStageSubjects}
        sections={activeStageSections}
        assignments={activeStageTeachingAssignments}
        onAddAssignment={addTeachingAssignment}
        onDeleteAssignment={deleteTeachingAssignment}
      />

      {/* ─────────────────────────────────────────────────────────────
          5. STAFF QUICK PREVIEW MODAL
         ───────────────────────────────────────────────────────────── */}
      <StaffQuickPreviewModal
        isOpen={Boolean(previewStaff)}
        onClose={() => setPreviewStaff(null)}
        staff={previewStaff}
        linkedUser={findLinkedUser(previewStaff)}
        currency={currency}
        onOpenEdit={() => handleOpenEdit(previewStaff)}
        onOpenBadge={() => setBadgeStaff(previewStaff)}
        onOpenUserAccount={() => setAccountStaff(previewStaff)}
        onOpenLeave={() => setLeaveStaff(previewStaff)}
        onOpenAssignments={isTeachingStaff(previewStaff) ? () => setAssignmentsStaff(previewStaff) : undefined}
        onOpenDocument={() => setDocumentStaff(previewStaff)}
        onOpenAdvance={() => setAdvanceStaff(previewStaff)}
      />

      {/* ─────────────────────────────────────────────────────────────
          6. SMART EMPLOYEE BADGE PRINT MODAL
         ───────────────────────────────────────────────────────────── */}
      <StaffSmartBadgeModal
        isOpen={Boolean(badgeStaff)}
        onClose={() => setBadgeStaff(null)}
        staff={badgeStaff}
        schoolName={systemSettings?.schoolName || "منظومة مدارس الريادة الحديثة"}
        schoolLogo={systemSettings?.logoUrl}
      />

      {/* ─────────────────────────────────────────────────────────────
          7. STAFF DELETE CONFIRMATION MODAL
         ───────────────────────────────────────────────────────────── */}
      <StaffDeleteConfirmModal
        isOpen={Boolean(staffToDelete)}
        onClose={() => setStaffToDelete(null)}
        staff={staffToDelete}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* ─────────────────────────────────────────────────────────────
          8. OFFICIAL HR DOCUMENTS GENERATOR MODAL
         ───────────────────────────────────────────────────────────── */}
      <StaffDocumentModal
        isOpen={Boolean(documentStaff)}
        onClose={() => setDocumentStaff(null)}
        staff={documentStaff}
        currency={currency}
        schoolName={systemSettings?.schoolName || "منظومة مدارس الريادة الحديثة"}
      />

      {/* ─────────────────────────────────────────────────────────────
          9. SALARY ADVANCE / LOAN REQUEST MODAL
         ───────────────────────────────────────────────────────────── */}
      <StaffAdvanceModal
        isOpen={Boolean(advanceStaff)}
        onClose={() => setAdvanceStaff(null)}
        staff={advanceStaff}
        currency={currency}
        onAddAdvance={handleSaveAdvance}
      />

      {/* Advanced Print Engine */}
      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title="سجل العاملين الشامل بالمنشأة"
        data={printData}
        templates={printTemplates} 
      />
    </AppShell>
  );
}
