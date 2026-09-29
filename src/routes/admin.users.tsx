import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import {
  Plus,
  Pencil,
  KeyRound,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Power,
  Download,
  Filter,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Copy,
  Trash2,
  Shield,
  MoreVertical,
  X,
  Save,
  AlertTriangle,
  CheckCircle2,
  Users,
  UserCog,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Send,
  Check,
  CheckSquare,
  Square,
  Lock,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { loadRbacRoles } from "@/lib/rbac-service";
import { AdminModal } from "@/components/admin/admin-modal";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "إدارة المستخدمين وحسابات النظام | منصة مدارس" }] }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { allUsers, allStaff, addUser, updateUser, deleteUser, addActivityLog, batchCreateStaffUsers } = useGlobalStore();

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [staffLinkFilter, setStaffLinkFilter] = useState<"all" | "linked" | "standalone">("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<any>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [userDetailModal, setUserDetailModal] = useState<any>(null);
  const [selectedStaffIdToImport, setSelectedStaffIdToImport] = useState<string>("");
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Bulk selection
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

  // Dynamic roles loaded from RBAC service
  const systemRoles = useMemo(() => {
    const rolesFromStorage = loadRbacRoles();
    const uniqueRoleNames = Array.from(
      new Set([...rolesFromStorage.map((r) => r.name), ...allUsers.map((u) => u.role)])
    );
    return uniqueRoleNames;
  }, [allUsers]);

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    role: "إداري",
    status: "active" as "active" | "disabled",
    email: "",
    phone: "",
    initialPassword: "",
    notes: "",
    staffId: "",
    stageScope: "all" as any,
    twoFactorEnabled: false,
  });

  // Helper to find linked staff in HR
  const getLinkedStaff = (user: any) => {
    if (!user) return null;
    return (
      allStaff.find(
        (s) =>
          (user.staffId && s.id === user.staffId) ||
          (user.email &&
            s.email &&
            user.email.trim().toLowerCase() === s.email.trim().toLowerCase()) ||
          (user.fullName && s.name && user.fullName.trim() === s.name.trim()) ||
          (user.username &&
            s.employeeNo &&
            user.username.toLowerCase() === s.employeeNo.toLowerCase()) ||
          (user.username &&
            user.username.toLowerCase() ===
              `emp_${(s.employeeNo || s.id).toString().toLowerCase()}`)
      ) || null
    );
  };

  const unlinkedStaffMembers = useMemo(() => {
    return allStaff.filter(
      (s) =>
        !s.isDeleted &&
        !allUsers.some(
          (u) =>
            (u.staffId && u.staffId === s.id) ||
            (u.email && s.email && u.email.trim().toLowerCase() === s.email.trim().toLowerCase()) ||
            (u.fullName && s.name && u.fullName.trim() === s.name.trim()) ||
            (u.username && s.employeeNo && u.username.toLowerCase() === s.employeeNo.toLowerCase()) ||
            (u.username && u.username.toLowerCase() === `emp_${(s.employeeNo || s.id).toString().toLowerCase()}`)
        )
    );
  }, [allStaff, allUsers]);

  const filteredUsers = useMemo(() => {
    const term = q.trim().toLowerCase();
    return allUsers.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (statusFilter !== "all" && user.status !== statusFilter) return false;

      const linkedStaff = getLinkedStaff(user);
      if (staffLinkFilter === "linked" && !linkedStaff) return false;
      if (staffLinkFilter === "standalone" && linkedStaff) return false;

      if (!term) return true;
      return (
        user.username.toLowerCase().includes(term) ||
        user.fullName.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term) ||
        (user.email || "").toLowerCase().includes(term) ||
        (linkedStaff?.name || "").toLowerCase().includes(term)
      );
    });
  }, [q, roleFilter, statusFilter, staffLinkFilter, allUsers, allStaff]);

  const stats = useMemo(() => {
    const linkedCount = allUsers.filter((u) => Boolean(getLinkedStaff(u))).length;
    return {
      total: allUsers.length,
      active: allUsers.filter((user) => user.status === "active").length,
      disabled: allUsers.filter((user) => user.status !== "active").length,
      admins: allUsers.filter((user) => user.role.includes("مدير")).length,
      linked: linkedCount,
      standalone: allUsers.length - linkedCount,
    };
  }, [allUsers, allStaff]);

  // Bulk selection helpers
  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkActivate = () => {
    selectedUserIds.forEach((id) => updateUser(id, { status: "active" }));
    addActivityLog({
      user: "مدير النظام",
      action: "تفعيل مستخدمين جماعي",
      entity: "المستخدمون",
      details: `تم تفعيل عدد ${selectedUserIds.length} حساب مستخدم`,
    });
    toast.success(`تم تفعيل ${selectedUserIds.length} حساب بنجاح`);
    setSelectedUserIds([]);
  };

  const handleBulkDisable = () => {
    selectedUserIds.forEach((id) => updateUser(id, { status: "disabled" }));
    addActivityLog({
      user: "مدير النظام",
      action: "تعطيل مستخدمين جماعي",
      entity: "المستخدمون",
      details: `تم تعطيل عدد ${selectedUserIds.length} حساب مستخدم`,
    });
    toast.success(`تم تعطيل ${selectedUserIds.length} حساب بنجاح`);
    setSelectedUserIds([]);
  };

  const handleBulkDeleteConfirm = () => {
    selectedUserIds.forEach((id) => deleteUser(id));
    addActivityLog({
      user: "مدير النظام",
      action: "حذف مستخدمين جماعي",
      entity: "المستخدمون",
      details: `تم حذف عدد ${selectedUserIds.length} حساب مستخدم نهائياً`,
    });
    toast.success(`تم حذف ${selectedUserIds.length} حساب بنجاح`);
    setSelectedUserIds([]);
    setBulkDeleteModal(false);
  };

  const handleOpenDialog = (user?: any) => {
    setSelectedStaffIdToImport(user?.staffId || "");
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        fullName: user.fullName,
        role: user.role || "إداري",
        status: user.status || "active",
        email: user.email || "",
        phone: user.phone || "",
        initialPassword: user.password || "",
        notes: user.notes || "",
        staffId: user.staffId || "",
        stageScope: user.stageScope || "all",
        twoFactorEnabled: Boolean(user.twoFactorEnabled),
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: "",
        fullName: "",
        role: systemRoles[0] || "معلم",
        status: "active",
        email: "",
        phone: "",
        initialPassword: `School@${Math.floor(1000 + Math.random() * 9000)}`,
        notes: "",
        staffId: "",
        stageScope: "all",
        twoFactorEnabled: false,
      });
    }
    setIsDialogOpen(true);
  };

  // Import staff data into form
  const handleImportStaff = (staffId: string) => {
    setSelectedStaffIdToImport(staffId);
    if (!staffId) {
      setFormData((prev) => ({ ...prev, staffId: "" }));
      return;
    }
    const staff = allStaff.find((s) => s.id === staffId);
    if (!staff) return;

    const suggestedUsername = `emp_${(staff.employeeNo || staff.id)
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")}`;
    let mappedRole = "إداري";
    if (staff.role?.includes("معلم")) mappedRole = "معلم";
    else if (staff.role?.includes("محاسب") || staff.department?.includes("مالي"))
      mappedRole = "محاسب مالي";
    else if (staff.role?.includes("مشرف")) mappedRole = "مشرف أكاديمي";
    else if (staff.role?.includes("مدير")) mappedRole = "مدير مدرسة";

    setFormData((prev) => ({
      ...prev,
      staffId: staff.id,
      username: suggestedUsername,
      fullName: staff.name,
      role: systemRoles.includes(mappedRole) ? mappedRole : prev.role,
      status: staff.status === "terminated" ? "disabled" : "active",
      email: staff.email || "",
      phone: staff.phone || "",
      stageScope: staff.stage || "all",
      notes: `حساب مرتبط بالموظف: ${staff.name} (كود: ${staff.employeeNo || staff.id}) - قسم: ${
        staff.department
      }`,
    }));

    toast.success(`تم ربط واستيراد بيانات الموظف ${staff.name}`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.fullName.trim()) {
      toast.error("يرجى تعبئة اسم المستخدم والاسم الكامل");
      return;
    }
    if (
      !editingUser &&
      allUsers.some((u) => u.username.toLowerCase() === formData.username.trim().toLowerCase())
    ) {
      toast.error("اسم المستخدم مستخدم مسبقاً. يرجى اختيار اسم مستخدم آخر.");
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        username: formData.username.trim(),
        fullName: formData.fullName.trim(),
        role: formData.role,
        status: formData.status,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        staffId: formData.staffId || undefined,
        stageScope: formData.stageScope || undefined,
        twoFactorEnabled: formData.twoFactorEnabled,
        password: formData.initialPassword ? formData.initialPassword.trim() : editingUser.password,
        notes: formData.notes.trim(),
      });
      addActivityLog({
        user: "مدير النظام",
        action: "تعديل مستخدم",
        entity: "المستخدمون",
        details: `تم تحديث بيانات المستخدم @${formData.username}`,
      });
      toast.success("تم تحديث بيانات المستخدم بنجاح");
    } else {
      addUser({
        username: formData.username.trim(),
        fullName: formData.fullName.trim(),
        role: formData.role,
        status: formData.status,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        staffId: formData.staffId || undefined,
        stageScope: formData.stageScope || undefined,
        twoFactorEnabled: formData.twoFactorEnabled,
        password: formData.initialPassword.trim() || undefined,
        notes: formData.notes.trim(),
        lastLogin: "لم يسجل دخول",
      });
      addActivityLog({
        user: "مدير النظام",
        action: "إنشاء مستخدم",
        entity: "المستخدمون",
        details: `تم إنشاء حساب مستخدم جديد: @${formData.username} (${formData.role})`,
      });
      toast.success("تم إنشاء حساب المستخدم وتفعيله بنجاح");
    }
    setIsDialogOpen(false);
  };

  const handleToggleStatus = (user: any) => {
    const newStatus = user.status === "active" ? "disabled" : "active";
    updateUser(user.id, { status: newStatus });
    addActivityLog({
      user: "مدير النظام",
      action: newStatus === "active" ? "تفعيل حساب" : "تعطيل حساب",
      entity: "المستخدمون",
      details: `تم تغيير حالة حساب @${user.username} إلى ${
        newStatus === "active" ? "نشط" : "معطل"
      }`,
    });
    toast.success(`تم ${newStatus === "active" ? "تفعيل" : "تعطيل"} حساب @${user.username}`);
  };

  const handleResetPassword = () => {
    if (!resetPasswordUser) return;
    const newPass = `Drsi@${Math.random().toString(36).slice(-6)}${Math.floor(
      Math.random() * 100
    )}`;
    setGeneratedPassword(newPass);
    setShowPassword(true);
    updateUser(resetPasswordUser.id, {
      password: newPass,
      notes: `تمت إعادة تعيين كلمة المرور (${newPass}) بتاريخ ${new Date().toLocaleDateString("ar-SA")}`,
    });
    addActivityLog({
      user: "مدير النظام",
      action: "إعادة تعيين كلمة مرور",
      entity: "المستخدمون",
      details: `تم إعادة تعيين كلمة مرور المستخدم: @${resetPasswordUser.username}`,
    });
    toast.success("تم توليد وحفظ كلمة مرور جديدة في سجل المستخدم بنجاح");
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast.success("تم نسخ كلمة المرور إلى الحافظة");
  };

  const getCredentialsMessage = () => {
    if (!resetPasswordUser) return "";
    return `مرحباً ${resetPasswordUser.fullName}،
تم تعيين كلمة مرور جديدة لحسابكم في منصة مدارس التعليمية:
اسم المستخدم: ${resetPasswordUser.username}
كلمة المرور: ${generatedPassword}
رابط المنظومة: ${window.location.origin}/login`;
  };

  const handleCopyCredentialsMessage = () => {
    const msg = getCredentialsMessage();
    navigator.clipboard.writeText(msg);
    toast.success("تم نسخ نص الرسالة الكاملة لمشاركتها عبر واتساب أو البريد");
  };

  const handleSendWhatsApp = () => {
    const phone = resetPasswordUser?.phone;
    if (!phone) {
      toast.error("لا يوجد رقم هاتف مسجل لهذا الحساب لمشاركته عبر واتساب");
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const msg = getCredentialsMessage();
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleBatchProvision = () => {
    if (unlinkedStaffMembers.length === 0) {
      toast.info("جميع موظفي الكادر لديهم حسابات دخول مفعلة بالفعل!");
      return;
    }
    const count = batchCreateStaffUsers(unlinkedStaffMembers);
    addActivityLog({
      user: "مدير النظام",
      action: "مزامنة حسابات الكادر",
      entity: "المستخدمون",
      details: `تم إنشاء وتفعيل ${count} حساب مستخدم جديد لكادر المدرسة دفعة واحدة`,
    });
    toast.success(`تم إنشاء وتفعيل ${count} حساب مستخدم جديد بنجاح!`);
    setIsBatchModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!confirmDeleteUser) return;
    deleteUser(confirmDeleteUser.id);
    addActivityLog({
      user: "مدير النظام",
      action: "حذف مستخدم",
      entity: "المستخدمون",
      details: `تم حذف حساب المستخدم: @${confirmDeleteUser.username}`,
    });
    toast.success(`تم حذف حساب ${confirmDeleteUser.fullName} بنجاح`);
    setConfirmDeleteUser(null);
  };

  const exportUsers = () => {
    const header = [
      "اسم المستخدم",
      "الاسم الكامل",
      "الدور",
      "الحالة",
      "البريد الإلكتروني",
      "الهاتف",
      "الموظف المرتبط",
      "آخر دخول",
    ];
    const rows = filteredUsers.map((u) => {
      const linked = getLinkedStaff(u);
      return [
        u.username,
        u.fullName,
        u.role,
        u.status === "active" ? "نشط" : "معطل",
        u.email || "غير محدد",
        u.phone || "غير محدد",
        linked ? `${linked.name} (${linked.employeeNo || linked.id})` : "حساب مستقل",
        u.lastLogin || "لم يسجل",
      ].map((val) => `"${val.replace(/"/g, '""')}"`);
    });

    const csvContent =
      "\uFEFF" + [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `school-users-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير بيانات المستخدمين بصيغة CSV بنجاح");
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الإدارة والنظام" },
        { label: "إدارة المستخدمين وحسابات المنظومة" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          {unlinkedStaffMembers.length > 0 && (
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3.5 text-xs font-black shadow-xs hover:bg-amber-500/20 transition-all hover:scale-105 active:scale-95"
              title="مزامنة وإنشاء حسابات دخول لكافة الكادر المتبقي بنقرة واحدة"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>مزامنة كادر الموظفين ({unlinkedStaffMembers.length})</span>
            </button>
          )}
          <button
            onClick={exportUsers}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-card border border-border/70 px-3.5 text-xs font-black shadow-xs hover:bg-accent transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            تصدير CSV
          </button>
          <button
            onClick={() => handleOpenDialog()}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground hover:bg-primary/90 shadow-sm transition-all hover:scale-105 active:scale-95 glow-primary"
          >
            <Plus className="h-4 w-4" /> إنشاء حساب مستخدم
          </button>
        </div>
      }
    >
      <div className="space-y-5" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary p-3.5 rounded-2xl shadow-inner border border-primary/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black">إدارة المستخدمين والحسابات (User Management)</h1>
              <p className="mt-1 text-xs font-bold text-muted-foreground">
                تأمين حسابات منسوبي المدرسة، ربط المعلمين والإداريين بالموظفين، وإدارة الصلاحيات
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-xs backdrop-blur-xl">
            <span className="text-[11px] font-bold text-muted-foreground">إجمالي الحسابات</span>
            <div className="text-2xl font-black text-foreground mt-1 tabular-nums flex items-baseline gap-1">
              <span>{stats.total}</span>
              <span className="text-xs text-muted-foreground font-normal">مستخدم</span>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-xs backdrop-blur-xl">
            <span className="text-[11px] font-bold text-muted-foreground">الحسابات النشطة</span>
            <div className="text-2xl font-black text-emerald-600 mt-1 tabular-nums flex items-baseline gap-1">
              <span>{stats.active}</span>
              <span className="text-xs text-muted-foreground font-normal">مفعل</span>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-xs backdrop-blur-xl">
            <span className="text-[11px] font-bold text-muted-foreground">مرتبط بكادر الموظفين</span>
            <div className="text-2xl font-black text-primary mt-1 tabular-nums flex items-baseline gap-1">
              <span>{stats.linked}</span>
              <span className="text-xs text-muted-foreground font-normal">موظف</span>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-xs backdrop-blur-xl">
            <span className="text-[11px] font-bold text-muted-foreground">حسابات الإدارة العليا</span>
            <div className="text-2xl font-black text-foreground mt-1 tabular-nums flex items-baseline gap-1">
              <span>{stats.admins}</span>
              <span className="text-xs text-muted-foreground font-normal">مدير</span>
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-xs backdrop-blur-xl">
            <span className="text-[11px] font-bold text-muted-foreground">الحسابات المعطلة</span>
            <div className="text-2xl font-black text-destructive mt-1 tabular-nums flex items-baseline gap-1">
              <span>{stats.disabled}</span>
              <span className="text-xs text-muted-foreground font-normal">محظور</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-xs">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="البحث بالاسم، اسم المستخدم، البريد، أو الموظف..."
                className="h-10 w-full rounded-xl border border-input bg-background/80 ps-9 pe-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">كل الأدوار والصلاحيات</option>
              {systemRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">كل الحالات (نشط ومعطل)</option>
              <option value="active">حسابات نشطة فقط</option>
              <option value="disabled">حسابات معطلة فقط</option>
            </select>

            <select
              value={staffLinkFilter}
              onChange={(e) => setStaffLinkFilter(e.target.value as any)}
              className="h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">كل تصنيفات الارتباط</option>
              <option value="linked">مرتبط بموظف في المنظومة</option>
              <option value="standalone">حسابات إدارية مستقلة</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedUserIds.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-between flex-wrap gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <span className="text-xs font-black text-primary">
                تم تحديد {selectedUserIds.length} مستخدم من أصل {filteredUsers.length}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleBulkActivate}
                className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-black text-emerald-600 hover:bg-emerald-500/10 transition-colors"
              >
                تفعيل المحدد
              </button>
              <button
                onClick={handleBulkDisable}
                className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-black text-amber-600 hover:bg-amber-500/10 transition-colors"
              >
                تعطيل المحدد
              </button>
              <button
                onClick={() => setBulkDeleteModal(true)}
                className="px-3 py-1.5 rounded-xl bg-danger/10 border border-danger/30 text-xs font-black text-danger hover:bg-danger/20 transition-colors"
              >
                حذف المحدد
              </button>
              <button
                onClick={() => setSelectedUserIds([])}
                className="px-2.5 py-1.5 rounded-xl hover:bg-accent text-xs font-bold text-muted-foreground"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <PageCard>
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-base font-black text-foreground">
                سجل حسابات النظام ومستخدمي المنصة
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAll}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                {selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0
                  ? "إلغاء تحديد الكل"
                  : "تحديد الكل في الجدول"}
              </button>
              <span className="text-xs font-bold text-muted-foreground">
                {filteredUsers.length} مستخدم معتمد
              </span>
            </div>
          </div>

          <DataTable
            rows={filteredUsers}
            columns={[
              {
                key: "select",
                header: (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="p-1 hover:text-primary transition-colors"
                    title="تحديد الكل"
                  >
                    {selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                ) as any,
                cell: (u) => (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelectUser(u.id);
                    }}
                    className="p-1 hover:text-primary transition-colors"
                  >
                    {selectedUserIds.includes(u.id) ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                ),
              },
              {
                key: "username",
                header: "اسم المستخدم",
                cell: (u) => (
                  <button
                    onClick={() => setUserDetailModal(u)}
                    className="font-black text-xs font-mono text-primary hover:underline text-right flex items-center gap-1.5"
                    dir="ltr"
                  >
                    <span>@{u.username}</span>
                  </button>
                ),
              },
              {
                key: "fullName",
                header: "الاسم الكامل",
                cell: (u) => (
                  <div>
                    <span className="font-bold text-xs text-foreground block">{u.fullName}</span>
                    {u.email && (
                      <span className="text-[10px] text-muted-foreground font-mono" dir="ltr">
                        {u.email}
                      </span>
                    )}
                  </div>
                ),
              },
              {
                key: "role",
                header: "الدور والصلاحيات",
                cell: (u) => (
                  <Badge
                    tone={
                      u.role.includes("مدير")
                        ? "danger"
                        : u.role.includes("معلم")
                        ? "success"
                        : "primary"
                    }
                  >
                    {u.role}
                  </Badge>
                ),
              },
              {
                key: "linkedStaff",
                header: "الموظف المرتبط في المنظومة",
                cell: (u) => {
                  const staff = getLinkedStaff(u);
                  if (staff) {
                    const isTeacher = staff.role?.includes("معلم");
                    const linkUrl = isTeacher
                      ? `/teachers/${staff.employeeNo || staff.id}`
                      : `/hr/staff/${staff.employeeNo || staff.id}`;
                    return (
                      <Link
                        to={linkUrl as any}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
                        title="انقر لفتح ملف الموظف"
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>{staff.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ({staff.employeeNo || staff.id})
                        </span>
                      </Link>
                    );
                  }
                  return (
                    <span className="text-muted-foreground text-[11px] font-bold px-2 py-0.5 rounded-lg bg-muted/40">
                      حساب إداري مستقل
                    </span>
                  );
                },
              },
              {
                key: "status",
                header: "الحالة",
                cell: (u) => (
                  <button
                    onClick={() => handleToggleStatus(u)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black transition-all ${
                      u.status === "active"
                        ? "bg-emerald-500/15 text-emerald-600 hover:bg-destructive/10 hover:text-destructive"
                        : "bg-destructive/15 text-destructive hover:bg-emerald-500/10 hover:text-emerald-600"
                    }`}
                    title="انقر لتغيير حالة الحساب فوراً"
                  >
                    <Power className="h-3 w-3" />
                    <span>{u.status === "active" ? "نشط" : "معطل"}</span>
                  </button>
                ),
              },
              {
                key: "lastLogin",
                header: "آخر تسجيل دخول",
                cell: (u) => (
                  <span className="inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground font-bold">
                    <Clock className="h-3 w-3" />
                    {u.lastLogin || "لم يسجل دخول"}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "الإجراءات",
                cell: (u) => (
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => setUserDetailModal(u)}
                      className="rounded-xl p-2 hover:bg-accent text-primary transition-colors"
                      title="عرض التفاصيل الكاملة"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setResetPasswordUser(u);
                        setGeneratedPassword("");
                        setShowPassword(false);
                      }}
                      className="rounded-xl p-2 hover:bg-accent text-amber-600 transition-colors"
                      title="إعادة تعيين كلمة المرور"
                    >
                      <KeyRound className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDialog(u)}
                      className="rounded-xl p-2 hover:bg-accent text-primary transition-colors"
                      title="تعديل البيانات"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteUser(u)}
                      className="rounded-xl p-2 hover:bg-danger/10 text-danger transition-colors"
                      title="حذف الحساب"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            empty="لا توجد حسابات مطابقة لمعايير البحث والتصفية."
          />
        </PageCard>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. ADD / EDIT USER MODAL
         ───────────────────────────────────────────────────────────── */}
      <AdminModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingUser ? "تعديل حساب المستخدم" : "إنشاء حساب مستخدم جديد"}
        description="إدارة بيانات تسجيل الدخول وتحديد الصلاحيات والربط بالموظفين في HR"
        icon={ShieldCheck}
        tone="primary"
        maxWidth="xl"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="h-10 px-5 rounded-xl border border-input font-bold text-xs hover:bg-accent transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="h-10 px-7 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-md glow-primary hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span>{editingUser ? "حفظ التعديلات" : "إنشاء الحساب وتفعيله"}</span>
            </button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Optional Staff Linker / Importer */}
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center gap-2 text-primary font-black">
              <Sparkles className="h-4 w-4" />
              <span>ربط الحساب بكادر الموظفين (HR):</span>
            </div>
            <select
              value={selectedStaffIdToImport}
              onChange={(e) => handleImportStaff(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
            >
              <option value="">-- حساب إداري مستقل (بدون ربط بكادر) --</option>
              {allStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role} - {s.department}) [كود: {s.employeeNo || s.id}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-bold text-foreground">
                اسم المستخدم (للدخول) <span className="text-destructive">*</span>
              </label>
              <input
                required
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold font-mono outline-none focus:border-primary text-left"
                placeholder="emp_user"
                dir="ltr"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-foreground">
                الاسم الكامل للمستخدم <span className="text-destructive">*</span>
              </label>
              <input
                required
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary"
                placeholder="أحمد محمد العتيبي"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-foreground">
              كلمة المرور {editingUser ? "(اختياري - اترك فارغاً للإبقاء دون تغيير)" : "الابتدائية"}
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.initialPassword}
                onChange={(e) =>
                  setFormData({ ...formData, initialPassword: e.target.value })
                }
                className="h-10 w-full rounded-xl border border-input bg-background ps-3 pe-24 text-xs font-bold font-mono outline-none focus:border-primary text-left"
                placeholder={editingUser ? "اتركه فارغاً دون تغيير" : "School@2026"}
                dir="ltr"
              />
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    initialPassword: `School@${Math.floor(1000 + Math.random() * 9000)}`,
                  })
                }
                className="absolute end-2 top-1/2 -translate-y-1/2 text-xs font-black text-primary hover:underline px-2.5 py-1 rounded-lg bg-primary/10 transition-colors"
              >
                توليد كلمة
              </button>
            </div>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-bold text-foreground">
                البريد الإلكتروني المعتمد
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary text-left"
                placeholder="user@school.edu.sa"
                dir="ltr"
              />
            </div>
            <div>
              <label className="mb-1 block font-bold text-foreground">رقم الهاتف (للواتساب)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary text-left"
                placeholder="05XXXXXXXX"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-bold text-foreground">
                الدور والصلاحيات في المنظومة
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
              >
                {systemRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-bold text-foreground">المرحلة الدراسية المخصصة</label>
              <select
                value={formData.stageScope}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stageScope: e.target.value as any,
                  })
                }
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
              >
                <option value="all">شامل لكافة المراحل</option>
                <option value="primary">المرحلة الابتدائية</option>
                <option value="middle">المرحلة المتوسطة</option>
                <option value="secondary">المرحلة الثانوية</option>
                <option value="kindergarten">مرحلة رياض الأطفال</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-bold text-foreground">حالة الحساب</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "active" | "disabled",
                  })
                }
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
              >
                <option value="active">نشط (مسموح بالدخول للمنظومة)</option>
                <option value="disabled">معطل (محظور الدخول مؤقتاً)</option>
              </select>
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                <input
                  type="checkbox"
                  checked={formData.twoFactorEnabled}
                  onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
                <span className="text-foreground">تفعيل التحقق بخطوتين (2FA)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1 block font-bold text-foreground">
              ملاحظات وربط السجل
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs font-bold outline-none focus:border-primary resize-none"
              placeholder="ملاحظات إدارية اختيارية..."
            />
          </div>

          {editingUser && (
            <div className="rounded-xl bg-muted/30 border border-border/70 p-3 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-bold">آخر تسجيل دخول:</span>
                <span className="font-bold tabular-nums">
                  {editingUser.lastLogin || "لم يسجل دخول"}
                </span>
              </div>
            </div>
          )}
        </form>
      </AdminModal>

      {/* ─────────────────────────────────────────────────────────────
          2. USER DETAIL MODAL
         ───────────────────────────────────────────────────────────── */}
      {userDetailModal && (
        <AdminModal
          isOpen={Boolean(userDetailModal)}
          onClose={() => setUserDetailModal(null)}
          title={userDetailModal.fullName}
          description={`اسم المستخدم: @${userDetailModal.username} • الدور: ${userDetailModal.role}`}
          icon={UserCog}
          tone={userDetailModal.role?.includes("مدير") ? "danger" : "primary"}
          maxWidth="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const u = userDetailModal;
                    setUserDetailModal(null);
                    setResetPasswordUser(u);
                    setGeneratedPassword("");
                    setShowPassword(false);
                  }}
                  className="h-9 px-3 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 font-black text-xs flex items-center gap-1.5 transition-colors"
                >
                  <KeyRound className="h-3.5 w-3.5" /> إعادة تعيين كلمة المرور
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const u = userDetailModal;
                    setUserDetailModal(null);
                    handleOpenDialog(u);
                  }}
                  className="h-9 px-3 rounded-xl bg-primary text-primary-foreground font-black text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Pencil className="h-3.5 w-3.5" /> تعديل البيانات
                </button>
              </div>
              <button
                type="button"
                onClick={() => setUserDetailModal(null)}
                className="h-9 px-5 rounded-xl border border-input font-bold text-xs hover:bg-accent"
              >
                إغلاق
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 pb-2 border-b border-border/60">
              <Badge tone={userDetailModal.status === "active" ? "success" : "danger"}>
                {userDetailModal.status === "active" ? "حساب نشط" : "حساب معطل"}
              </Badge>
              <Badge tone={userDetailModal.role?.includes("مدير") ? "danger" : "primary"}>
                {userDetailModal.role}
              </Badge>
              {userDetailModal.twoFactorEnabled && (
                <Badge tone="success">2FA مفعل</Badge>
              )}
            </div>

            {/* Linked Staff Member Info */}
            {(() => {
              const linked = getLinkedStaff(userDetailModal);
              if (linked) {
                return (
                  <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-1">
                    <span className="text-[10px] font-black text-primary uppercase block">
                      سجل الموظف المرتبط في المنظومة:
                    </span>
                    <div className="flex justify-between items-center font-bold">
                      <span>
                        {linked.name} ({linked.role})
                      </span>
                      <Link
                        to={
                          (linked.role?.includes("معلم")
                            ? `/teachers/${linked.employeeNo || linked.id}`
                            : `/hr/staff/${linked.employeeNo || linked.id}`) as any
                        }
                        className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                      >
                        عرض الملف <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      القسم: {linked.department} • الكود: {linked.employeeNo || linked.id}
                    </div>
                  </div>
                );
              }
              return (
                <div className="p-3 rounded-xl bg-muted/40 text-muted-foreground font-bold text-center">
                  هذا الحساب إداري مستقل غير مقترن بكادر الموظفين.
                </div>
              );
            })()}

            <div className="p-3 rounded-xl bg-muted/30 flex justify-between items-center">
              <span className="text-muted-foreground font-bold">آخر تسجيل دخول:</span>
              <span className="font-bold tabular-nums font-mono">
                {userDetailModal.lastLogin || "لم يسجل دخول بعد"}
              </span>
            </div>

            {userDetailModal.stageScope && (
              <div className="p-3 rounded-xl bg-muted/30 flex justify-between items-center">
                <span className="text-muted-foreground font-bold">نطاق المرحلة الدراسية:</span>
                <span className="font-bold">
                  {userDetailModal.stageScope === "all" ? "شامل لكافة المراحل" : userDetailModal.stageScope}
                </span>
              </div>
            )}

            {userDetailModal.password && (
              <div className="p-3 rounded-xl bg-muted/30 flex justify-between items-center">
                <span className="text-muted-foreground font-bold">كلمة المرور المسجلة:</span>
                <div className="flex items-center gap-2">
                  <code className="font-mono font-bold" dir="ltr">{userDetailModal.password}</code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(userDetailModal.password);
                      toast.success("تم نسخ كلمة المرور");
                    }}
                    className="text-primary hover:underline text-[10px]"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {userDetailModal.email && (
              <div className="p-3 rounded-xl bg-muted/30 flex justify-between items-center">
                <span className="text-muted-foreground font-bold">البريد الإلكتروني:</span>
                <span className="font-bold font-mono" dir="ltr">
                  {userDetailModal.email}
                </span>
              </div>
            )}

            {userDetailModal.phone && (
              <div className="p-3 rounded-xl bg-muted/30 flex justify-between items-center">
                <span className="text-muted-foreground font-bold">رقم الهاتف:</span>
                <span className="font-bold font-mono" dir="ltr">
                  {userDetailModal.phone}
                </span>
              </div>
            )}

            {userDetailModal.notes && (
              <div className="p-3 rounded-xl bg-muted/30">
                <span className="text-muted-foreground font-bold block mb-1">ملاحظات:</span>
                <p className="text-foreground leading-relaxed">{userDetailModal.notes}</p>
              </div>
            )}
          </div>
        </AdminModal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. RESET PASSWORD MODAL WITH WHATSAPP INTEGRATION
         ───────────────────────────────────────────────────────────── */}
      {resetPasswordUser && (
        <AdminModal
          isOpen={Boolean(resetPasswordUser)}
          onClose={() => setResetPasswordUser(null)}
          title="إعادة تعيين كلمة المرور"
          description={`المستخدم: ${resetPasswordUser.fullName} (@${resetPasswordUser.username})`}
          icon={KeyRound}
          tone="amber"
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setResetPasswordUser(null)}
                className="h-9 px-5 rounded-xl border border-input font-bold hover:bg-accent text-xs"
              >
                إغلاق
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {!showPassword ? (
              <>
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-black">
                    <AlertTriangle className="h-4 w-4" /> تنبيه أمني
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    سيتم إنشاء وحفظ كلمة مرور عشوائية جديدة مشفرة فوراً، مع إمكانية مشاركتها
                    عبر واتساب أو نسخ نص بيانات الدخول.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-black shadow-md glow-primary hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" /> إنشاء وتوليد وحفظ كلمة المرور
                </button>
              </>
            ) : (
              <div className="space-y-3 animate-in zoom-in-95">
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-1.5" />
                  <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 block mb-2">
                    تم إنشاء وحفظ كلمة المرور بنجاح!
                  </span>
                  <div
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-card border border-border/80 font-mono text-base font-black"
                    dir="ltr"
                  >
                    <code>{generatedPassword}</code>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
                      title="نسخ كلمة المرور فقط"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {resetPasswordUser.phone && (
                    <button
                      type="button"
                      onClick={handleSendWhatsApp}
                      className="w-full h-10 rounded-xl bg-[#25D366] text-white font-black hover:bg-[#20ba59] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" /> إرسال البيانات عبر واتساب مباشرة
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyCredentialsMessage}
                    className="w-full h-10 rounded-xl bg-card border border-border/80 text-foreground font-black hover:bg-accent transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Copy className="h-3.5 w-3.5" /> نسخ نص الرسالة الكاملة
                  </button>
                </div>
              </div>
            )}
          </div>
        </AdminModal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. DELETE CONFIRMATION MODAL
         ───────────────────────────────────────────────────────────── */}
      {confirmDeleteUser && (
        <AdminModal
          isOpen={Boolean(confirmDeleteUser)}
          onClose={() => setConfirmDeleteUser(null)}
          title="حذف حساب المستخدم نهائياً"
          description="تأكيد إجراء الحذف وإيقاف صلاحيات الوصول للمنظومة"
          icon={Trash2}
          tone="danger"
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setConfirmDeleteUser(null)}
                className="flex-1 h-10 rounded-xl border border-input text-xs font-bold hover:bg-accent"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-xs font-black hover:bg-destructive/90 shadow-md flex items-center justify-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" /> تأكيد الحذف
              </button>
            </div>
          }
        >
          <p className="text-muted-foreground text-xs font-bold leading-relaxed">
            هل أنت متأكد من رغبتك في حذف حساب{" "}
            <strong className="text-foreground">@{confirmDeleteUser.username}</strong> (
            {confirmDeleteUser.fullName})؟ لن يتمكن المستخدم من الدخول للمنظومة بعد هذا الإجراء.
          </p>
        </AdminModal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. BULK DELETE CONFIRMATION MODAL
         ───────────────────────────────────────────────────────────── */}
      <AdminModal
        isOpen={bulkDeleteModal}
        onClose={() => setBulkDeleteModal(false)}
        title="حذف جماعي لحسابات المستخدمين"
        description={`تحذير: سيتم حذف ${selectedUserIds.length} حساب دفعة واحدة نهائياً`}
        icon={Trash2}
        tone="danger"
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setBulkDeleteModal(false)}
              className="flex-1 h-10 rounded-xl border border-input text-xs font-bold hover:bg-accent"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleBulkDeleteConfirm}
              className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-xs font-black hover:bg-destructive/90 shadow-md flex items-center justify-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" /> تأكيد الحذف الجماعي
            </button>
          </div>
        }
      >
        <p className="text-muted-foreground text-xs font-bold leading-relaxed">
          تحذير أمني: هل أنت متأكد من رغبتك في حذف{" "}
          <strong className="text-foreground">{selectedUserIds.length}</strong> حساب مستخدم
          نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء الجماعي.
        </p>
      </AdminModal>

      {/* ─────────────────────────────────────────────────────────────
          6. BATCH STAFF PROVISIONING MODAL
         ───────────────────────────────────────────────────────────── */}
      <AdminModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title="مزامنة كادر الموظفين وإنشاء الحسابات"
        description={`إنشاء وتفعيل حسابات دخول موحدة لكافة منسوبي المدرسة غير المسجلين (${unlinkedStaffMembers.length} موظف)`}
        icon={Sparkles}
        tone="amber"
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(false)}
              className="h-10 px-5 rounded-xl border border-input font-bold hover:bg-accent text-xs"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleBatchProvision}
              className="h-10 px-6 rounded-xl bg-primary text-primary-foreground font-black shadow-md glow-primary hover:bg-primary/90 transition-all flex items-center gap-2 text-xs"
            >
              <Sparkles className="h-4 w-4" />
              <span>بدء المزامنة وتوليد الحسابات للجميع</span>
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary shrink-0" />
            <div className="text-xs space-y-1">
              <span className="font-black text-foreground block">توليد آمن وتلقائي لحسابات الدخول</span>
              <p className="text-muted-foreground leading-relaxed">
                سيتم إنشاء اسم مستخدم قياسي لكل موظف بصيغة <code className="font-mono font-bold text-primary">emp_[الرقم_الوظيفي]</code>، مع تحديد الدور الوظيفي الأنسب وكلمة مرور ابتدائية موحدة <code className="font-mono font-bold text-primary">School@2026</code>، وحفظ الربط المباشر بملف الموظف في HR.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 overflow-hidden">
            <div className="bg-muted/40 p-3 font-black text-xs text-foreground border-b border-border/70 flex justify-between">
              <span>قائمة الكادر بانتظار إنشاء حسابات الدخول</span>
              <span className="tabular-nums font-mono text-primary font-bold">{unlinkedStaffMembers.length} موظف</span>
            </div>
            <div className="divide-y divide-border/60 max-h-60 overflow-y-auto custom-scrollbar">
              {unlinkedStaffMembers.map((s) => (
                <div key={s.id} className="p-3 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold text-xs">
                      {s.name.substring(0, 1)}
                    </div>
                    <div>
                      <span className="font-bold text-foreground block">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {s.role} • {s.department} • كود: {s.employeeNo || s.id}
                      </span>
                    </div>
                  </div>
                  <div className="text-left font-mono text-[11px] text-muted-foreground" dir="ltr">
                    @emp_{(s.employeeNo || s.id).toString().toLowerCase().replace(/[^a-z0-9]/g, "")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminModal>
    </AppShell>
  );
}
