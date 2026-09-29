import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { AdminModal } from "@/components/admin/admin-modal";
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  Settings2,
  Users,
  ArrowLeft,
  X,
  Save,
  Copy,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Download,
  Search,
  ExternalLink,
  ChevronLeft,
  UserCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useState, useMemo, useEffect } from "react";
import {
  loadRbacRoles,
  saveRbacRoles,
  RoleDef,
  DEFAULT_RBAC_ROLES,
  RBAC_MODULES,
} from "@/lib/rbac-service";

export const Route = createFileRoute("/admin/roles")({
  head: () => ({ meta: [{ title: "الأدوار ومستويات الوصول | منصة مدارس" }] }),
  component: AdminRolesPage,
});

const criticalRoles = new Set(["مدير عام", "مدير مدرسة"]);

function AdminRolesPage() {
  const { allUsers, addActivityLog } = useGlobalStore();
  const navigate = useNavigate();

  const [roles, setRoles] = useState<RoleDef[]>(() => loadRbacRoles());
  const [q, setQ] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDef | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleColor, setNewRoleColor] = useState("#6366F1");
  const [newRoleScope, setNewRoleScope] = useState<"مؤسسي" | "تشغيلي" | "بوابة خارجية">("تشغيلي");
  const [newRoleRisk, setNewRoleRisk] = useState<"مرتفع" | "متوسط" | "منخفض">("متوسط");

  const [confirmDelete, setConfirmDelete] = useState<RoleDef | null>(null);
  const [detailRole, setDetailRole] = useState<RoleDef | null>(null);

  // Sync to storage on state change
  const updateAndSaveRoles = (newRoles: RoleDef[]) => {
    setRoles(newRoles);
    saveRbacRoles(newRoles);
  };

  const rows = useMemo(() => {
    return roles.map((role) => {
      const users = allUsers.filter((user) => user.role === role.name);
      return {
        id: role.id,
        name: role.name,
        description: role.description,
        color: role.color,
        scope: role.scope || (criticalRoles.has(role.name) ? "مؤسسي" : role.name === "ولي أمر" ? "بوابة خارجية" : "تشغيلي"),
        risk: role.risk || (criticalRoles.has(role.name) ? "مرتفع" : role.name === "ولي أمر" ? "منخفض" : "متوسط"),
        count: users.length,
        active: users.filter((u) => u.status === "active").length,
        disabled: users.filter((u) => u.status !== "active").length,
        isSystem: role.isSystem || criticalRoles.has(role.name),
        roleDef: role,
      };
    });
  }, [roles, allUsers]);

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (riskFilter !== "all" && r.risk !== riskFilter) return false;
      if (!term) return true;
      return (
        r.name.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.scope.toLowerCase().includes(term)
      );
    });
  }, [rows, q, riskFilter]);

  const handleOpenDialog = (existingRole?: RoleDef) => {
    if (existingRole) {
      setEditingRole(existingRole);
      setNewRoleName(existingRole.name);
      setNewRoleDesc(existingRole.description || "");
      setNewRoleColor(existingRole.color || "#6366F1");
      setNewRoleScope(existingRole.scope || "تشغيلي");
      setNewRoleRisk(existingRole.risk || "متوسط");
    } else {
      setEditingRole(null);
      setNewRoleName("");
      setNewRoleDesc("");
      setNewRoleColor("#6366F1");
      setNewRoleScope("تشغيلي");
      setNewRoleRisk("متوسط");
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const trimmed = newRoleName.trim();
    if (!trimmed) {
      toast.error("يرجى إدخال مسمى الدور");
      return;
    }

    if (editingRole) {
      if (editingRole.isSystem && trimmed !== editingRole.name) {
        toast.error("لا يمكن تعديل مسمى الأدوار النظامية الحساسة (مدير عام / مدير مدرسة)");
        return;
      }
      if (trimmed !== editingRole.name && roles.some((r) => r.name === trimmed)) {
        toast.error("يوجد دور مسجل بنفس هذا الاسم مسبقاً");
        return;
      }
      const updated = roles.map((r) =>
        r.id === editingRole.id
          ? {
              ...r,
              name: trimmed,
              description: newRoleDesc.trim(),
              color: newRoleColor,
              scope: newRoleScope,
              risk: newRoleRisk,
            }
          : r
      );
      updateAndSaveRoles(updated);
      addActivityLog({
        user: "مدير النظام",
        action: "تعديل دور",
        entity: "الأدوار والصلاحيات",
        details: `تم تحديث بيانات الدور: "${trimmed}"`,
      });
      toast.success(`تم حفظ تعديلات الدور "${trimmed}" بنجاح`);
    } else {
      if (roles.some((r) => r.name === trimmed)) {
        toast.error("يوجد دور مسجل بنفس هذا الاسم مسبقاً");
        return;
      }
      const newRole: RoleDef = {
        id: `role_${Date.now()}`,
        name: trimmed,
        description: newRoleDesc.trim() || "دور مخصص تم إنشاؤه عبر لوحة الإدارة",
        color: newRoleColor,
        scope: newRoleScope,
        risk: newRoleRisk,
        permissions: RBAC_MODULES.reduce((acc, m) => ({ ...acc, [m]: ["قراءة"] }), {} as any),
      };
      updateAndSaveRoles([...roles, newRole]);
      addActivityLog({
        user: "مدير النظام",
        action: "إنشاء دور جديد",
        entity: "الأدوار والصلاحيات",
        details: `تم إنشاء دور جديد: "${trimmed}" وتعيين صلاحيات القراءة الافتراضية`,
      });
      toast.success(`تم إنشاء الدور "${trimmed}" بنجاح`);
    }
    setIsDialogOpen(false);
  };

  const handleDuplicateRole = (role: RoleDef) => {
    const newName = `${role.name} (نسخة)`;
    if (roles.some((r) => r.name === newName)) {
      toast.error("توجد نسخة مكررة مسبقاً بهذا الاسم");
      return;
    }
    const duplicated: RoleDef = {
      ...role,
      id: `role_${Date.now()}`,
      name: newName,
      isSystem: false,
    };
    updateAndSaveRoles([...roles, duplicated]);
    addActivityLog({
      user: "مدير النظام",
      action: "نسخ دور",
      entity: "الأدوار والصلاحيات",
      details: `تم استنساخ الدور "${role.name}" إلى "${newName}" بكامل صلاحياته`,
    });
    toast.success(`تم نسخ الدور "${role.name}" بنجاح`);
  };

  const handleDeleteRole = () => {
    if (!confirmDelete) return;
    if (confirmDelete.isSystem || criticalRoles.has(confirmDelete.name)) {
      toast.error("لا يمكن حذف أدوار النظام الأساسية لحماية استقرار المنظومة");
      setConfirmDelete(null);
      return;
    }
    const usersWithRole = allUsers.filter((u) => u.role === confirmDelete.name).length;
    if (usersWithRole > 0) {
      toast.error(
        `تعذر الحذف: يوجد حالياً ${usersWithRole} مستخدم مرتبط بهذا الدور. يرجى نقلهم لدور آخر أولاً.`
      );
      setConfirmDelete(null);
      return;
    }
    const remaining = roles.filter((r) => r.id !== confirmDelete.id);
    updateAndSaveRoles(remaining);
    addActivityLog({
      user: "مدير النظام",
      action: "حذف دور",
      entity: "الأدوار والصلاحيات",
      details: `تم حذف الدور "${confirmDelete.name}" من النظام`,
    });
    toast.success(`تم حذف الدور "${confirmDelete.name}" بنجاح`);
    setConfirmDelete(null);
  };

  const exportRolesCsv = () => {
    const headers = [
      "مسمى الدور",
      "الوصف الإداري",
      "نطاق الصلاحية",
      "مستوى المخاطرة",
      "إجمالي المستخدمين",
      "المستخدمين النشطين",
      "حالة الدور",
    ];
    const dataRows = rows.map((r) => [
      r.name,
      r.description,
      r.scope,
      r.risk,
      r.count,
      r.active,
      r.isSystem ? "دور نظام أساسي" : "دور تشغيلي مخصص",
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...dataRows.map((row) => row.map((f) => `"${f}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `system-roles-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير سجل الأدوار بصيغة CSV بنجاح");
  };

  const colorPresets = [
    "#EF4444",
    "#F59E0B",
    "#10B981",
    "#22C55E",
    "#06B6D4",
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#3B82F6",
  ];

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الإدارة والنظام" },
        { label: "الأدوار ومستويات الوصول" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={exportRolesCsv}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold hover:bg-accent transition-colors shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-primary" /> تصدير CSV
          </button>
          <Link
            to="/admin/permissions"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold hover:bg-accent transition-colors shadow-sm"
          >
            <Settings2 className="h-4 w-4 text-primary" /> مصفوفة الصلاحيات (RBAC)
          </Link>
          <button
            onClick={() => handleOpenDialog()}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all glow-primary"
          >
            <Plus className="h-4 w-4" /> دور جديد
          </button>
        </div>
      }
    >
      <div className="space-y-5" dir="rtl">
        {/* Header Banner */}
        <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary p-3.5 rounded-2xl shadow-inner border border-primary/20">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black">الأدوار ومستويات الوصول (Roles Management)</h1>
              <p className="mt-1 text-xs font-bold text-muted-foreground">
                تعريف المسميات الوظيفية، تحديد أطر المخاطرة، وتوزيع حسابات الموظفين قبل ضبط مصفوفة الصلاحيات
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Shield className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي الأدوار</p>
            </div>
            <p className="text-2xl font-black tabular-nums">{rows.length} دور</p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center">
                <Lock className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">أدوار عالية الحساسية</p>
            </div>
            <p className="text-2xl font-black text-danger tabular-nums">
              {rows.filter((row) => row.risk === "مرتفع").length} أدوار
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-lg bg-success/10 text-success flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">المستخدمون النشطون</p>
            </div>
            <p className="text-2xl font-black text-success tabular-nums">
              {rows.reduce((sum, r) => sum + r.active, 0)} مستخدم
            </p>
          </div>

          <Link
            to="/admin/permissions"
            className="rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm hover:bg-primary/10 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <Settings2 className="h-4 w-4" />
              </div>
              <ArrowLeft className="h-4 w-4 text-primary group-hover:-translate-x-1 transition-transform" />
            </div>
            <p className="text-xs font-bold text-primary">تخصيص الأذونات</p>
            <p className="text-sm font-black text-primary">فتح باني الصلاحيات (RBAC)</p>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-xs">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="البحث باسم الدور، الوصف، أو النطاق..."
                className="h-10 w-full rounded-xl border border-input bg-background/80 ps-9 pe-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">كافة مستويات المخاطرة</option>
              <option value="مرتفع">أدوار عالية المخاطرة</option>
              <option value="متوسط">أدوار متوسطة المخاطرة</option>
              <option value="منخفض">أدوار منخفضة المخاطرة</option>
            </select>

            <div className="flex items-center justify-end">
              <span className="text-xs font-bold text-muted-foreground">
                المعروض: {filteredRows.length} من أصل {rows.length} دور
              </span>
            </div>
          </div>
        </div>

        {/* Role Cards Visual */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRows.map((r) => {
            const roleDef = r.roleDef;
            return (
              <div
                key={r.id}
                className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-11 w-11 rounded-2xl flex items-center justify-center text-white text-base font-black shadow-sm shrink-0"
                        style={{ backgroundColor: roleDef.color }}
                      >
                        {r.name.substring(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-black text-sm text-foreground">{r.name}</h3>
                          {r.isSystem && (
                            <span
                              className="text-[10px] font-black text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-md"
                              title="دور نظام أساسي محمي"
                            >
                              أساسي
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground font-bold mt-0.5 block">
                          نطاق: {r.scope}
                        </span>
                      </div>
                    </div>
                    <Badge
                      tone={
                        r.risk === "مرتفع"
                          ? "danger"
                          : r.risk === "متوسط"
                          ? "warning"
                          : "success"
                      }
                    >
                      {r.risk}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed min-h-[38px] mb-4">
                    {roleDef.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <button
                      onClick={() => setDetailRole(roleDef)}
                      className="rounded-xl bg-muted/30 hover:bg-primary/10 p-2 text-center transition-colors group/stat"
                      title="انقر لعرض قائمة المستخدمين"
                    >
                      <div className="text-lg font-black group-hover/stat:text-primary transition-colors tabular-nums">
                        {r.count}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-bold">مستخدم</div>
                    </button>
                    <div className="rounded-xl bg-muted/30 p-2 text-center">
                      <div className="text-lg font-black text-success tabular-nums">{r.active}</div>
                      <div className="text-[10px] text-muted-foreground font-bold">نشط</div>
                    </div>
                    <div className="rounded-xl bg-muted/30 p-2 text-center">
                      <div className="text-lg font-black text-muted-foreground tabular-nums">
                        {r.disabled}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-bold">معطل</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-border/60">
                  <button
                    onClick={() => setDetailRole(roleDef)}
                    className="flex-1 rounded-xl py-2 px-2.5 text-xs font-bold bg-muted/50 hover:bg-accent transition-colors inline-flex items-center justify-center gap-1"
                    title="استعراض حسابات المستخدمين المرتبطة بهذا الدور"
                  >
                    <Users className="h-3.5 w-3.5 text-muted-foreground" /> المستخدمون
                  </button>

                  <button
                    onClick={() => handleOpenDialog(roleDef)}
                    className="flex-1 rounded-xl py-2 px-2.5 text-xs font-bold bg-muted/50 hover:bg-accent transition-colors inline-flex items-center justify-center gap-1"
                    title="تعديل خصائص ومسمى الدور"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> تعديل
                  </button>

                  <Link
                    to="/admin/permissions"
                    className="flex-1 rounded-xl py-2 px-2.5 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors inline-flex items-center justify-center gap-1"
                    title="فتح مصفوفة الصلاحيات لهذا الدور"
                  >
                    <Settings2 className="h-3.5 w-3.5" /> الصلاحيات
                  </Link>

                  <button
                    onClick={() => handleDuplicateRole(roleDef)}
                    className="rounded-xl p-2 text-xs font-bold bg-muted/50 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="استنساخ الدور"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  {!r.isSystem && (
                    <button
                      onClick={() => setConfirmDelete(roleDef)}
                      className="rounded-xl p-2 text-xs font-bold text-danger bg-danger/10 hover:bg-danger/20 transition-colors"
                      title="حذف الدور"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ────── Modal 1: Role Detail & Assigned Users ────── */}
      <AdminModal
        isOpen={Boolean(detailRole)}
        onClose={() => setDetailRole(null)}
        title={detailRole ? `تفاصيل الدور: ${detailRole.name}` : ""}
        description={detailRole?.description || "عرض قائمة الحسابات المرتبطة بهذا الدور والتحكم في إسناده"}
        icon={Shield}
        tone={detailRole?.risk === "مرتفع" ? "danger" : "primary"}
        maxWidth="2xl"
        footer={
          detailRole && (
            <div className="flex justify-between items-center w-full">
              <Link
                to="/admin/permissions"
                search={{ roleId: detailRole.id } as any}
                onClick={() => setDetailRole(null)}
                className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline"
              >
                <Settings2 className="h-4 w-4" /> تعديل مصفوفة صلاحيات هذا الدور
              </Link>
              <button
                type="button"
                onClick={() => setDetailRole(null)}
                className="rounded-xl px-5 py-2 text-xs font-bold border border-input hover:bg-accent transition-colors"
              >
                إغلاق
              </button>
            </div>
          )
        }
      >
        {detailRole && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-border/70 bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="h-11 w-11 rounded-2xl flex items-center justify-center text-white text-base font-black shadow-inner"
                  style={{ backgroundColor: detailRole.color }}
                >
                  {detailRole.name.substring(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base text-foreground">{detailRole.name}</span>
                    <Badge tone={detailRole.risk === "مرتفع" ? "danger" : "primary"}>
                      {detailRole.risk} المخاطرة
                    </Badge>
                    <Badge tone="neutral">{detailRole.scope}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground mt-0.5 block">{detailRole.description}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-black text-foreground">
                قائمة المستخدمين المسند إليهم هذا الدور (
                {allUsers.filter((u) => u.role === detailRole.name).length})
              </span>
              <Link
                to="/admin/users"
                onClick={() => setDetailRole(null)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                إدارة كافة المستخدمين <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {(() => {
              const assigned = allUsers.filter((u) => u.role === detailRole.name);
              if (assigned.length === 0) {
                return (
                  <div className="text-center py-8 px-4 rounded-2xl bg-muted/20 border border-border/60">
                    <Users className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm font-bold text-foreground">
                      لا يوجد مستخدمون مرتبطون بهذا الدور حالياً
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      يمكنك تعيين هذا الدور لأي مستخدم من خلال صفحة إدارة المستخدمين.
                    </p>
                  </div>
                );
              }
              return (
                <div className="space-y-2">
                  {assigned.map((u) => (
                    <div
                      key={u.id}
                      className="p-3.5 rounded-xl border border-border/70 bg-card flex items-center justify-between gap-3 hover:bg-accent/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                          {u.fullName?.substring(0, 2) || "م"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-foreground">{u.fullName}</span>
                            <span className="font-mono text-[11px] text-muted-foreground" dir="ltr">
                              @{u.username}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {u.email || "بدون بريد"} • آخر دخول: {u.lastLogin || "لم يسجل"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge tone={u.status === "active" ? "success" : "danger"}>
                          {u.status === "active" ? "نشط" : "معطل"}
                        </Badge>
                        <Link
                          to="/admin/users"
                          onClick={() => setDetailRole(null)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                          title="الانتقال لملف المستخدم"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </AdminModal>

      {/* ────── Modal 2: Add / Edit Role ────── */}
      <AdminModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingRole ? "تعديل مسمى وخصائص الدور" : "إضافة دور إداري جديد"}
        description="تحديد مسمى الدور ونطاق التشغيل ودرجة المخاطرة"
        icon={Shield}
        tone={newRoleRisk === "مرتفع" ? "danger" : "primary"}
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setIsDialogOpen(false)}
              className="h-10 px-5 text-xs font-bold border border-input rounded-xl hover:bg-accent transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="h-10 px-6 text-xs font-black rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md glow-primary inline-flex items-center gap-2"
            >
              <Save className="h-4 w-4" /> {editingRole ? "حفظ التعديلات" : "إنشاء الدور"}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-bold text-foreground">
              مسمى الدور الوظيفي <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              disabled={Boolean(editingRole?.isSystem)}
              placeholder="مثال: مسؤول المخازن، أمين المكتبة..."
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary disabled:bg-muted/50 disabled:text-muted-foreground"
            />
            {editingRole?.isSystem && (
              <p className="text-[10px] text-amber-600 mt-1 font-bold">
                * هذا دور نظام أساسي ولا يمكن تغيير اسمه لحماية تكامل الصلاحيات.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block font-bold text-foreground">
              الوصف الإداري ومسؤوليات الدور
            </label>
            <textarea
              rows={2}
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
              placeholder="وصف مختصر للمهام المنوطة بهذا الدور..."
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs font-bold outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-bold text-foreground">نطاق الاستخدام</label>
              <select
                value={newRoleScope}
                onChange={(e) => setNewRoleScope(e.target.value as any)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
              >
                <option value="تشغيلي">تشغيلي (كادر المدرسة)</option>
                <option value="مؤسسي">مؤسسي (إدارة عليا)</option>
                <option value="بوابة خارجية">بوابة خارجية (أولياء أمور)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-bold text-foreground">مستوى المخاطرة</label>
              <select
                value={newRoleRisk}
                onChange={(e) => setNewRoleRisk(e.target.value as any)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
              >
                <option value="منخفض">منخفض</option>
                <option value="متوسط">متوسط</option>
                <option value="مرتفع">مرتفع / حساس</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block font-bold text-foreground">
              اللون المميز للأيقونة والبطاقات
            </label>
            <div className="flex gap-2 flex-wrap items-center">
              {colorPresets.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewRoleColor(c)}
                  className={`h-8 w-8 rounded-xl transition-all shadow-xs ${
                    newRoleColor === c
                      ? "ring-2 ring-offset-2 ring-primary scale-110"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </AdminModal>

      {/* ────── Modal 3: Delete Confirmation ────── */}
      <AdminModal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="تأكيد حذف الدور"
        description="حذف الدور الإداري من النظام"
        icon={Trash2}
        tone="danger"
        maxWidth="sm"
        footer={
          <div className="flex gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="flex-1 h-10 rounded-xl border border-input text-xs font-bold hover:bg-accent transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleDeleteRole}
              className="flex-1 h-10 rounded-xl bg-destructive text-white text-xs font-black hover:bg-destructive/90 transition-all shadow-md"
            >
              تأكيد الحذف
            </button>
          </div>
        }
      >
        {confirmDelete && (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground font-bold leading-relaxed">
              هل أنت متأكد من رغبتك في حذف الدور{" "}
              <strong className="text-foreground">"{confirmDelete.name}"</strong>؟ لن يتمكن أي حساب
              من استخدام هذا الدور بعد حذفه.
            </p>
          </div>
        )}
      </AdminModal>
    </AppShell>
  );
}
