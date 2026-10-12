import { createFileRoute, useSearch } from "@tanstack/react-router";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { AdminModal } from "@/components/admin/admin-modal";
import { AdminNav } from "@/components/admin/admin-nav";
import {
  ShieldCheck,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  LockKeyhole,
  Copy,
  X,
  AlertTriangle,
  Settings2,
  Eye,
  Shield,
  Download,
  RotateCcw,
  Sparkles,
  FileText,
  Sliders,
  Check,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import {
  loadRbacRoles,
  saveRbacRoles,
  resetRbacRoles,
  RoleDef,
  PermissionModule,
  PermissionAction,
  RBAC_MODULES,
  RBAC_ACTIONS,
  DEFAULT_RBAC_ROLES,
} from "@/lib/rbac-service";

export const Route = createFileRoute("/admin/permissions")({
  head: () => ({ meta: [{ title: "مصفوفة الصلاحيات (RBAC Matrix) | منصة مدارس" }] }),
  validateSearch: (search: Record<string, unknown>): { roleId?: string } => ({
    roleId: search.roleId ? String(search.roleId) : undefined,
  }),
  component: RBACBuilderPage,
});

function RBACBuilderPage() {
  const { addActivityLog } = useGlobalStore();
  const searchParams = useSearch({ from: "/admin/permissions" });

  const [roles, setRoles] = useState<RoleDef[]>(() => loadRbacRoles());
  const [activeRoleId, setActiveRoleId] = useState<string>(() => {
    const loaded = loadRbacRoles();
    if (searchParams.roleId && loaded.some((r) => r.id === searchParams.roleId)) {
      return searchParams.roleId;
    }
    return loaded[0]?.id || "role_super_admin";
  });

  const [moduleSearch, setModuleSearch] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modals
  const [renameModal, setRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameDesc, setRenameDesc] = useState("");

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addRoleModal, setAddRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleTemplate, setNewRoleTemplate] = useState("empty");

  const [resetDefaultsModal, setResetDefaultsModal] = useState(false);

  const activeRole = roles.find((r) => r.id === activeRoleId) || roles[0];
  const visibleModules = RBAC_MODULES.filter((module) => module.includes(moduleSearch.trim()));

  const activePermCount = activeRole
    ? Object.values(activeRole.permissions || {}).reduce(
        (sum, actions) => sum + (actions?.length || 0),
        0
      )
    : 0;
  const maxPermCount = RBAC_MODULES.length * RBAC_ACTIONS.length;
  const accessPercentage = Math.round((activePermCount / maxPermCount) * 100);

  const handleTogglePermission = (module: PermissionModule, action: PermissionAction) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== activeRoleId) return r;
        const currentModulePerms = r.permissions?.[module] || [];
        const newModulePerms = currentModulePerms.includes(action)
          ? currentModulePerms.filter((a) => a !== action)
          : [...currentModulePerms, action];
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [module]: newModulePerms,
          },
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleToggleAllModule = (module: PermissionModule) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== activeRoleId) return r;
        const currentModulePerms = r.permissions?.[module] || [];
        const allSelected = RBAC_ACTIONS.every((a) => currentModulePerms.includes(a));
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [module]: allSelected ? [] : [...RBAC_ACTIONS],
          },
        };
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleToggleGlobalAction = (action: PermissionAction) => {
    if (!activeRole) return;
    const allHaveIt = RBAC_MODULES.every((m) =>
      (activeRole.permissions?.[m] || []).includes(action)
    );
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== activeRoleId) return r;
        const newPerms = { ...r.permissions };
        RBAC_MODULES.forEach((m) => {
          const current = newPerms[m] || [];
          if (allHaveIt) {
            newPerms[m] = current.filter((a) => a !== action);
          } else {
            if (!current.includes(action)) newPerms[m] = [...current, action];
          }
        });
        return { ...r, permissions: newPerms };
      })
    );
    setHasUnsavedChanges(true);
    toast.success(
      allHaveIt
        ? `تم إلغاء صلاحية (${action}) عن كافة الوحدات`
        : `تم منح صلاحية (${action}) لكافة الوحدات`
    );
  };

  const handleApplyPreset = (preset: "full" | "readonly" | "clear" | "default") => {
    if (!activeRole) return;
    let newPerms: Record<PermissionModule, PermissionAction[]> = {} as any;

    if (preset === "full") {
      newPerms = RBAC_MODULES.reduce(
        (acc, m) => ({ ...acc, [m]: [...RBAC_ACTIONS] }),
        {} as any
      );
      toast.success(`تم منح وصول كامل وغير مقيد لدور: ${activeRole.name}`);
    } else if (preset === "readonly") {
      newPerms = RBAC_MODULES.reduce(
        (acc, m) => ({ ...acc, [m]: ["قراءة"] }),
        {} as any
      );
      toast.success(`تم تعيين صلاحيات القراءة والاستعراض فقط لدور: ${activeRole.name}`);
    } else if (preset === "clear") {
      newPerms = RBAC_MODULES.reduce((acc, m) => ({ ...acc, [m]: [] }), {} as any);
      toast.info(`تم تفريغ كافة الصلاحيات لدور: ${activeRole.name}`);
    } else if (preset === "default") {
      const defaultRole = DEFAULT_RBAC_ROLES.find((r) => r.id === activeRole.id || r.name === activeRole.name);
      if (defaultRole) {
        newPerms = JSON.parse(JSON.stringify(defaultRole.permissions));
        toast.success(`تمت استعادة الصلاحيات الافتراضية لدور: ${activeRole.name}`);
      } else {
        newPerms = RBAC_MODULES.reduce(
          (acc, m) => ({ ...acc, [m]: ["قراءة"] }),
          {} as any
        );
        toast.success(`تم تعيين الصلاحيات القياسية لدور: ${activeRole.name}`);
      }
    }

    setRoles((prev) =>
      prev.map((r) => (r.id === activeRoleId ? { ...r, permissions: newPerms } : r))
    );
    setHasUnsavedChanges(true);
  };

  const handleCreateRoleSubmit = () => {
    if (!newRoleName.trim()) {
      toast.error("يرجى إدخال اسم الدور الجديد");
      return;
    }

    let initialPermissions: Record<PermissionModule, PermissionAction[]> = RBAC_MODULES.reduce(
      (acc, m) => ({ ...acc, [m]: [] }),
      {} as any
    );

    if (newRoleTemplate === "full") {
      initialPermissions = RBAC_MODULES.reduce(
        (acc, m) => ({ ...acc, [m]: [...RBAC_ACTIONS] }),
        {} as any
      );
    } else if (newRoleTemplate === "read_only") {
      initialPermissions = RBAC_MODULES.reduce(
        (acc, m) => ({ ...acc, [m]: ["قراءة"] }),
        {} as any
      );
    } else if (newRoleTemplate.startsWith("copy_")) {
      const copySourceId = newRoleTemplate.replace("copy_", "");
      const source = roles.find((r) => r.id === copySourceId);
      if (source) {
        initialPermissions = JSON.parse(JSON.stringify(source.permissions));
      }
    }

    const newRole: RoleDef = {
      id: `role_${Date.now()}`,
      name: newRoleName.trim(),
      description: newRoleDesc.trim() || "دور مخصص جديد",
      color: "#6366F1",
      scope: "تشغيلي",
      risk: "متوسط",
      permissions: initialPermissions,
    };

    const updatedRoles = [...roles, newRole];
    setRoles(updatedRoles);
    saveRbacRoles(updatedRoles);
    setActiveRoleId(newRole.id);
    setHasUnsavedChanges(true);
    setAddRoleModal(false);
    setNewRoleName("");
    setNewRoleDesc("");
    setNewRoleTemplate("empty");

    addActivityLog({
      user: "مدير النظام",
      action: "إنشاء دور أمان",
      entity: "مصفوفة الصلاحيات (RBAC)",
      details: `تم إنشاء دور جديد: ${newRole.name}`,
    });

    toast.success(`تم إنشاء دور "${newRole.name}" بنجاح`);
  };

  const handleDuplicateRole = (id: string) => {
    const roleToCopy = roles.find((r) => r.id === id);
    if (!roleToCopy) return;
    const newRole: RoleDef = {
      ...roleToCopy,
      id: `role_${Date.now()}`,
      name: `${roleToCopy.name} (نسخة)`,
      description: roleToCopy.description ? `نسخة من: ${roleToCopy.description}` : "نسخة مستنسخة",
      permissions: JSON.parse(JSON.stringify(roleToCopy.permissions)),
      isSystem: false,
    };
    const updatedRoles = [...roles, newRole];
    setRoles(updatedRoles);
    saveRbacRoles(updatedRoles);
    setActiveRoleId(newRole.id);
    setHasUnsavedChanges(true);
    toast.success("تم نسخ الصلاحيات بنجاح إلى دور جديد");
  };

  const handleDeleteRole = () => {
    if (roles.length <= 1) {
      toast.error("لا يمكن حذف الدور الأخير في النظام");
      return;
    }
    if (activeRole.isSystem) {
      toast.error("لا يمكن حذف أدوار النظام الأساسية الحساسة");
      setConfirmDelete(false);
      return;
    }
    const remaining = roles.filter((r) => r.id !== activeRoleId);
    setRoles(remaining);
    saveRbacRoles(remaining);
    setActiveRoleId(remaining[0].id);
    setHasUnsavedChanges(false);
    setConfirmDelete(false);
    addActivityLog({
      user: "مدير النظام",
      action: "حذف دور أمان",
      entity: "مصفوفة الصلاحيات (RBAC)",
      details: `تم حذف الدور: ${activeRole.name}`,
    });
    toast.success("تم حذف الدور المحدد بنجاح");
  };

  const handleRename = () => {
    if (!renameValue.trim()) {
      toast.error("يرجى إدخال اسم الدور");
      return;
    }
    if (activeRole.isSystem && renameValue.trim() !== activeRole.name) {
      toast.error("لا يمكن تغيير مسمى الدور الأساسي للنظام");
      return;
    }
    const updated = roles.map((r) =>
      r.id === activeRoleId
        ? { ...r, name: renameValue.trim(), description: renameDesc.trim() || "" }
        : r
    );
    setRoles(updated);
    saveRbacRoles(updated);
    setHasUnsavedChanges(false);
    setRenameModal(false);
    toast.success("تم تحديث بيانات الدور بنجاح");
  };

  const handleSaveAll = () => {
    saveRbacRoles(roles);
    setHasUnsavedChanges(false);
    addActivityLog({
      user: "مدير النظام",
      action: "اعتماد مصفوفة الصلاحيات",
      entity: "مصفوفة الصلاحيات (RBAC)",
      details: `تم حفظ واعتماد مصفوفة الصلاحيات لعدد ${roles.length} أدوار بنجاح`,
    });
    toast.success("تم حفظ مصفوفة الصلاحيات وتطبيقها فوراً على مستوى النظام بالكامل");
  };

  const handleResetDefaults = () => {
    const defaults = resetRbacRoles();
    setRoles(defaults);
    setActiveRoleId(defaults[0].id);
    setHasUnsavedChanges(false);
    setResetDefaultsModal(false);
    addActivityLog({
      user: "مدير النظام",
      action: "استعادة ضبط المصنع للصلاحيات",
      entity: "مصفوفة الصلاحيات (RBAC)",
      details: "تمت استعادة الصلاحيات القياسية الافتراضية لكافة الأدوار",
    });
    toast.success("تمت استعادة أدوار وصلاحيات المصنع القياسية بنجاح");
  };

  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(roles, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `rbac-matrix-${new Date().toISOString().split("T")[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("تم تصدير ملف مصفوفة الصلاحيات بصيغة JSON");
  };

  const handleExportCsv = () => {
    const headers = ["الدور", "الوحدة", ...RBAC_ACTIONS];
    const dataRows: string[][] = [];

    roles.forEach((r) => {
      RBAC_MODULES.forEach((m) => {
        const perms = r.permissions?.[m] || [];
        dataRows.push([
          r.name,
          m,
          ...RBAC_ACTIONS.map((a) => (perms.includes(a) ? "نعم" : "لا")),
        ]);
      });
    });

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...dataRows.map((row) => row.map((f) => `"${f}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rbac-matrix-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير مصفوفة الصلاحيات بصيغة CSV");
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الإدارة والنظام" },
        { label: "منشئ الصلاحيات (RBAC Matrix)" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 animate-pulse">
              ● تغييرات غير محفوظة
            </span>
          )}
          <button
            onClick={handleExportCsv}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold hover:bg-accent transition-colors shadow-sm"
            title="تصدير مصفوفة الصلاحيات كملف Excel / CSV"
          >
            <Download className="h-3.5 w-3.5 text-primary" /> تصدير CSV
          </button>
          <button
            onClick={handleExportJson}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold hover:bg-accent transition-colors shadow-sm"
            title="تصدير الصلاحيات كملف JSON"
          >
            <FileText className="h-3.5 w-3.5 text-primary" /> JSON
          </button>
          <button
            onClick={() => setResetDefaultsModal(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold text-muted-foreground hover:text-danger hover:border-danger/30 transition-colors shadow-sm"
            title="استعادة الافتراضي"
          >
            <RotateCcw className="h-3.5 w-3.5" /> استعادة الافتراضي
          </button>
          <button
            onClick={handleSaveAll}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all glow-primary"
          >
            <Save className="h-4 w-4" /> حفظ المصفوفة
          </button>
        </div>
      }
    >
      <div className="space-y-5" dir="rtl">
        {/* Unified Admin Sub-Navigation */}
        <AdminNav activeTab="/admin/permissions" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary p-3.5 rounded-2xl shadow-inner border border-primary/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black">منشئ مصفوفة الصلاحيات (RBAC Matrix)</h1>
              <p className="text-xs font-bold text-muted-foreground mt-1">
                تخصيص أمني دقيق ومحكم لكل دور إداري أو أكاديمي — {RBAC_MODULES.length} وحدة تفاعلية ×{" "}
                {RBAC_ACTIONS.length} إجراءات
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
          {/* Roles Sidebar */}
          <PageCard title="الأدوار الإدارية والأكاديمية" className="lg:col-span-1 shadow-sm">
            <div className="space-y-2">
              {roles.map((role) => {
                const permCount = Object.values(role.permissions || {}).reduce(
                  (sum, actions) => sum + (actions?.length || 0),
                  0
                );
                const pct = Math.round((permCount / maxPermCount) * 100);
                const isActive = activeRoleId === role.id;

                return (
                  <button
                    key={role.id}
                    onClick={() => setActiveRoleId(role.id)}
                    className={`w-full p-3.5 rounded-2xl border text-right transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/25"
                        : "border-border/60 hover:bg-muted/40 hover:border-border"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: role.color || "#6366F1" }}
                        />
                        <span
                          className={`font-black text-sm truncate ${
                            isActive ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {role.name}
                        </span>
                      </div>
                      {isActive && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                    </div>
                    {role.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">
                        {role.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted/80 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                        {pct}% ({permCount})
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setNewRoleName("");
                setNewRoleDesc("");
                setNewRoleTemplate("empty");
                setAddRoleModal(true);
              }}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 border border-dashed border-primary text-primary rounded-xl text-xs font-black hover:bg-primary/5 transition-colors"
            >
              <Plus className="w-4 h-4" /> إضافة دور جديد
            </button>
          </PageCard>

          {/* Permissions Matrix */}
          <PageCard
            title={`إدارة صلاحيات: ${activeRole?.name || ""}`}
            className="lg:col-span-3 shadow-sm"
          >
            {activeRole && (
              <div className="space-y-5">
                {/* Role Header Banner */}
                <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-3 bg-muted/20 -mx-6 -mt-6 p-6 rounded-t-2xl">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-xs"
                        style={{ backgroundColor: activeRole.color || "#6366F1" }}
                      >
                        {activeRole.name.substring(0, 2)}
                      </div>
                      <h2 className="font-black text-lg text-foreground">{activeRole.name}</h2>
                      {activeRole.isSystem && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          نظامي أساسي
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeRole.description || "لم يتم تحديد وصف مختصر لهذا الدور"}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap items-center">
                    <button
                      onClick={() => {
                        setRenameValue(activeRole.name);
                        setRenameDesc(activeRole.description || "");
                        setRenameModal(true);
                      }}
                      className="text-xs font-bold text-foreground hover:bg-accent px-3 py-1.5 rounded-xl border border-border transition-colors flex items-center gap-1.5"
                    >
                      <Settings2 className="h-3.5 w-3.5 text-muted-foreground" /> تعديل المسمى
                    </button>
                    <button
                      onClick={() => handleDuplicateRole(activeRole.id)}
                      className="text-xs font-bold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 transition-colors flex items-center gap-1.5"
                    >
                      <Copy className="h-3.5 w-3.5" /> نسخ الدور
                    </button>
                    {!activeRole.isSystem && (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="text-xs font-bold text-danger hover:bg-danger/10 px-3 py-1.5 rounded-xl border border-danger/20 transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> حذف الدور
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Presets Bar */}
                <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-black text-primary">
                    <Sparkles className="h-4 w-4" />
                    <span>نماذج الضبط السريع لهذا الدور:</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleApplyPreset("full")}
                      className="px-2.5 py-1 rounded-lg bg-card border border-border hover:bg-primary/10 text-xs font-bold transition-colors"
                    >
                      منح وصول كامل
                    </button>
                    <button
                      onClick={() => handleApplyPreset("readonly")}
                      className="px-2.5 py-1 rounded-lg bg-card border border-border hover:bg-accent text-xs font-bold transition-colors"
                    >
                      قراءة واستعراض فقط
                    </button>
                    <button
                      onClick={() => handleApplyPreset("default")}
                      className="px-2.5 py-1 rounded-lg bg-card border border-border hover:bg-accent text-xs font-bold transition-colors"
                    >
                      الصلاحيات القياسية
                    </button>
                    <button
                      onClick={() => handleApplyPreset("clear")}
                      className="px-2.5 py-1 rounded-lg bg-card border border-border hover:bg-danger/10 text-danger text-xs font-bold transition-colors"
                    >
                      تفريغ الكل
                    </button>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="text-xs font-bold text-muted-foreground">الصلاحيات المفعلة</div>
                    <div className="mt-1 text-2xl font-black text-primary tabular-nums">
                      {activePermCount}{" "}
                      <span className="text-xs text-muted-foreground font-normal">
                        من أصل {maxPermCount}
                      </span>
                    </div>
                    <div className="mt-2.5 h-2 rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${accessPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="text-xs font-bold text-muted-foreground">
                      مستوى الوصول للنظام
                    </div>
                    <div
                      className={`mt-1 text-2xl font-black tabular-nums ${
                        accessPercentage > 80
                          ? "text-danger"
                          : accessPercentage > 40
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-success"
                      }`}
                    >
                      {accessPercentage}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {accessPercentage > 80
                        ? "وصول واسع وشامل — تحقق من الإجراءات"
                        : accessPercentage > 40
                        ? "وصول متوسط ومتوازن"
                        : "وصول مقيد وآمن"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-danger/25 bg-danger/5 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-danger">
                        <LockKeyhole className="h-4 w-4" /> العمليات المحمية
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        صلاحيات (الحذف، الاعتماد، التصدير) مميزة بلون بارز لحماية أمان المنشأة.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Search & Bulk Action Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={moduleSearch}
                      onChange={(e) => setModuleSearch(e.target.value)}
                      placeholder="بحث عن وحدة نظام (مثال: المالية، الطلاب، النقل...)"
                      className="h-10 w-full rounded-xl border border-border/80 bg-background ps-10 pe-4 text-xs font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <span className="text-xs font-bold text-muted-foreground whitespace-nowrap ml-1">
                      تحديد إجراء شامل:
                    </span>
                    {RBAC_ACTIONS.map((action) => (
                      <button
                        key={action}
                        onClick={() => handleToggleGlobalAction(action)}
                        className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-border/70 hover:bg-accent hover:border-primary/40 transition-colors whitespace-nowrap"
                        title={`تحديد / إلغاء ${action} لجميع الوحدات`}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Matrix Table */}
                <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="px-4 py-3.5 font-bold text-muted-foreground text-xs min-w-[180px]">
                          الوحدة (Module)
                        </th>
                        {RBAC_ACTIONS.map((a) => {
                          const isCritical = a === "حذف" || a === "اعتماد" || a === "تصدير";
                          return (
                            <th
                              key={a}
                              className={`px-3 py-3.5 font-bold text-center text-xs ${
                                isCritical ? "text-danger" : "text-muted-foreground"
                              }`}
                            >
                              <div className="flex items-center justify-center gap-1">
                                {isCritical && (
                                  <LockKeyhole className="h-3 w-3 inline text-danger" />
                                )}
                                <span>{a}</span>
                              </div>
                            </th>
                          );
                        })}
                        <th className="px-3 py-3.5 font-bold text-muted-foreground text-center text-xs">
                          التحكم بالوحدة
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {visibleModules.map((module) => {
                        const modulePerms = activeRole.permissions?.[module] || [];
                        const isAllSelected = RBAC_ACTIONS.every((a) => modulePerms.includes(a));
                        const hasSomeSelected = modulePerms.length > 0 && !isAllSelected;

                        return (
                          <tr key={module} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-black text-xs text-foreground">
                              {module}
                            </td>
                            {RBAC_ACTIONS.map((action) => {
                              const checked = modulePerms.includes(action);
                              const isCritical =
                                action === "حذف" || action === "اعتماد" || action === "تصدير";

                              return (
                                <td key={action} className="px-3 py-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePermission(module, action)}
                                    className={`h-7 w-7 rounded-lg border inline-flex items-center justify-center transition-all ${
                                      checked
                                        ? isCritical
                                          ? "bg-danger text-white border-danger shadow-xs"
                                          : "bg-primary text-primary-foreground border-primary shadow-xs"
                                        : "border-border/80 hover:border-primary/50 text-transparent hover:text-muted-foreground/30"
                                    }`}
                                    title={`${checked ? "إلغاء" : "تفعيل"} صلاحية ${action} في وحدة ${module}`}
                                  >
                                    <Check className="h-4 w-4 stroke-[3]" />
                                  </button>
                                </td>
                              );
                            })}
                            <td className="px-3 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleAllModule(module)}
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                                  isAllSelected
                                    ? "bg-primary/10 border-primary text-primary"
                                    : hasSomeSelected
                                    ? "bg-muted border-border text-foreground"
                                    : "border-border/60 hover:bg-muted text-muted-foreground"
                                }`}
                              >
                                {isAllSelected ? "إلغاء الكل" : "تحديد الكل"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </PageCard>
        </div>
      </div>

      {/* ────── Modal: Add New Role ────── */}
      <AdminModal
        isOpen={addRoleModal}
        onClose={() => setAddRoleModal(false)}
        title="إضافة دور جديد للمنظومة"
        description="إنشاء مسمى دور وتحديد صلاحياته الأولية"
        icon={ShieldCheck}
        tone="primary"
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setAddRoleModal(false)}
              className="rounded-xl px-5 py-2 text-xs font-bold border border-input hover:bg-accent transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleCreateRoleSubmit}
              className="rounded-xl bg-primary px-6 py-2 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md glow-primary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> إنشاء الدور
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-bold text-foreground">
              اسم الدور الجديد <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="مثال: منسق شؤون أكاديمية، أمين مخازن..."
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-foreground">الوصف والمهام</label>
            <textarea
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
              placeholder="وصف مختصر لمسؤوليات هذا الدور..."
              rows={2}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs font-bold outline-none focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="mb-1 block font-bold text-foreground">
              قالب الصلاحيات الابتدائي
            </label>
            <select
              value={newRoleTemplate}
              onChange={(e) => setNewRoleTemplate(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
            >
              <option value="empty">فارغ (تحديد يدوي)</option>
              <option value="full">صلاحيات كاملة لجميع الوحدات</option>
              <option value="read_only">صلاحية قراءة فقط لكافة الوحدات</option>
              {roles.map((r) => (
                <option key={r.id} value={`copy_${r.id}`}>
                  استنساخ من دور: {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </AdminModal>

      {/* ────── Modal: Rename Role ────── */}
      <AdminModal
        isOpen={renameModal}
        onClose={() => setRenameModal(false)}
        title="تعديل بيانات الدور"
        description="تحديث مسمى الدور ووصفه الإداري"
        icon={Settings2}
        tone="primary"
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setRenameModal(false)}
              className="rounded-xl px-5 py-2 text-xs font-bold border border-input hover:bg-accent transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleRename}
              className="rounded-xl bg-primary px-6 py-2 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md glow-primary inline-flex items-center gap-2"
            >
              <Save className="h-4 w-4" /> حفظ التعديلات
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-bold text-foreground">اسم الدور</label>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              disabled={Boolean(activeRole.isSystem)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary disabled:bg-muted/50 disabled:text-muted-foreground"
            />
            {activeRole.isSystem && (
              <p className="text-[10px] text-amber-600 mt-1 font-bold">
                * هذا دور نظام أساسي ولا يمكن تعديل اسمه لدواعي الأمان.
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block font-bold text-foreground">الوصف</label>
            <textarea
              value={renameDesc}
              onChange={(e) => setRenameDesc(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs font-bold outline-none focus:border-primary resize-none"
            />
          </div>
        </div>
      </AdminModal>

      {/* ────── Modal: Delete Confirmation ────── */}
      <AdminModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="حذف هذا الدور نهائياً؟"
        description="إزالة الدور ومصادرة صلاحياته من النظام"
        icon={Trash2}
        tone="danger"
        maxWidth="sm"
        footer={
          <div className="flex gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="flex-1 h-10 rounded-xl border border-input text-xs font-bold hover:bg-accent transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleDeleteRole}
              className="flex-1 h-10 rounded-xl bg-danger text-white text-xs font-black hover:bg-danger/90 transition-all shadow-md"
            >
              تأكيد الحذف
            </button>
          </div>
        }
      >
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground font-bold leading-relaxed">
            هل أنت متأكد من رغبتك في حذف الدور{" "}
            <strong className="text-foreground">"{activeRole?.name}"</strong>؟ لن يتمكن أي مستخدم
            مرتبط به من تسجيل الدخول حتى يتم تغيير دوره.
          </p>
        </div>
      </AdminModal>

      {/* ────── Modal: Reset Defaults ────── */}
      <AdminModal
        isOpen={resetDefaultsModal}
        onClose={() => setResetDefaultsModal(false)}
        title="استعادة الصلاحيات القياسية"
        description="إعادة تعيين كافة صلاحيات الأدوار لإعدادات النظام الأصلية"
        icon={RotateCcw}
        tone="amber"
        maxWidth="sm"
        footer={
          <div className="flex gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setResetDefaultsModal(false)}
              className="flex-1 h-10 rounded-xl border border-input text-xs font-bold hover:bg-accent transition-colors"
            >
              تراجع
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex-1 h-10 rounded-xl bg-amber-600 text-white font-black text-xs hover:bg-amber-700 transition-all shadow-md"
            >
              استعادة الافتراضي
            </button>
          </div>
        }
      >
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground font-bold leading-relaxed">
            سيؤدي هذا الإجراء إلى إعادة تعيين كافة الأدوار والصلاحيات إلى الإعدادات القياسية للمصنع.
            هل أنت متأكد من الاستمرار؟
          </p>
        </div>
      </AdminModal>
    </AppShell>
  );
}
