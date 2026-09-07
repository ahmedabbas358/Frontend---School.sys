import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Plus, Pencil, Trash2, Shield, Settings2, Users, ArrowLeft, X, Save } from "lucide-react";
import { toast } from "sonner";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/admin/roles")({
  head: () => ({ meta: [{ title: "الأدوار | منصة مدارس" }] }),
  component: AdminRolesPage,
});

const criticalRoles = new Set(["مدير عام", "مدير مدرسة"]);

function AdminRolesPage() {
  const { allUsers, addActivityLog } = useGlobalStore();
  const [roles, setRoles] = useState<string[]>(["مدير عام", "مدير مدرسة", "أمين تسجيل", "معلم", "ولي أمر"]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState("");

  const rows = useMemo(() => roles.map((role) => {
    const users = allUsers.filter((user) => user.role === role);
    return {
      id: role,
      name: role,
      count: users.length,
      active: users.filter(user => user.status === "active").length,
      scope: criticalRoles.has(role) ? "مؤسسي" : role === "ولي أمر" ? "بوابة خارجية" : "تشغيلي",
      risk: criticalRoles.has(role) ? "مرتفع" : role === "ولي أمر" ? "منخفض" : "متوسط",
    };
  }), [roles, allUsers]);

  const handleOpenDialog = (existingRole?: string) => {
    if (existingRole) {
      setEditingRole(existingRole);
      setNewRoleName(existingRole);
    } else {
      setEditingRole(null);
      setNewRoleName("");
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    const trimmed = newRoleName.trim();
    if (!trimmed) {
      toast.error("يرجى إدخال اسم الدور");
      return;
    }

    if (editingRole) {
      if (criticalRoles.has(editingRole)) {
        toast.error("لا يمكن تعديل اسم الأدوار الحساسة (مدير عام / مدير مدرسة)");
        return;
      }
      if (trimmed !== editingRole && roles.includes(trimmed)) {
        toast.error("يوجد دور بنفس الاسم");
        return;
      }
      setRoles(prev => prev.map(r => r === editingRole ? trimmed : r));
      addActivityLog({ user: "مدير النظام", action: "تعديل دور", entity: "الأدوار", details: `تم تعديل الدور من "${editingRole}" إلى "${trimmed}"` });
      toast.success(`تم تعديل الدور بنجاح`);
    } else {
      if (roles.includes(trimmed)) {
        toast.error("يوجد دور بنفس الاسم");
        return;
      }
      setRoles(prev => [...prev, trimmed]);
      addActivityLog({ user: "مدير النظام", action: "إنشاء دور", entity: "الأدوار", details: `تم إنشاء دور جديد: "${trimmed}"` });
      toast.success(`تم إنشاء الدور "${trimmed}" بنجاح`);
    }
    setIsDialogOpen(false);
  };

  const handleDeleteRole = (roleName: string) => {
    if (criticalRoles.has(roleName)) {
      toast.error("لا يمكن حذف الأدوار الحساسة (مدير عام / مدير مدرسة)");
      return;
    }
    const usersWithRole = allUsers.filter(u => u.role === roleName).length;
    if (usersWithRole > 0) {
      toast.error(`لا يمكن حذف الدور "${roleName}" — يوجد ${usersWithRole} مستخدم مرتبط به. قم بنقلهم لدور آخر أولاً.`);
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف الدور "${roleName}"؟`)) {
      setRoles(prev => prev.filter(r => r !== roleName));
      addActivityLog({ user: "مدير النظام", action: "حذف دور", entity: "الأدوار", details: `تم حذف الدور: "${roleName}"` });
      toast.success(`تم حذف الدور "${roleName}"`);
    }
  };

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الإدارة العامة" }, { label: "الأدوار" }]}
      actions={
        <button onClick={() => handleOpenDialog()} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> دور جديد
        </button>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">الأدوار ومستويات الوصول</h1>
            <p className="mt-1 text-sm font-bold text-muted-foreground">مراقبة الأدوار الحساسة وتوزيع المستخدمين قبل تعديل مصفوفة الصلاحيات.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">عدد الأدوار</p>
            <p className="mt-1 text-2xl font-black">{rows.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">أدوار حساسة</p>
            <p className="mt-1 text-2xl font-black text-danger">{rows.filter(row => row.risk === "مرتفع").length}</p>
          </div>
          <Link to="/admin/permissions" className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm hover:bg-primary/10 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-primary">مصفوفة الصلاحيات</p>
                <p className="mt-1 text-lg font-black text-primary">فتح باني RBAC</p>
              </div>
              <ArrowLeft className="h-5 w-5 text-primary" />
            </div>
          </Link>
        </div>

        <PageCard>
          <DataTable
            rows={rows}
            columns={[
              { key: "n", header: "اسم الدور", cell: (r) => <span className="font-bold">{r.name}</span> },
              { key: "scope", header: "النطاق", cell: (r) => <Badge tone={r.scope === "مؤسسي" ? "danger" : r.scope === "تشغيلي" ? "primary" : "info"}>{r.scope}</Badge> },
              { key: "c", header: "المستخدمون", cell: (r) => <span className="inline-flex items-center gap-1 font-bold tabular"><Users className="h-3 w-3 text-muted-foreground" />{r.count}</span> },
              { key: "active", header: "نشط", cell: (r) => <span className="font-bold text-success">{r.active}</span> },
              { key: "risk", header: "مستوى الحساسية", cell: (r) => <Badge tone={r.risk === "مرتفع" ? "danger" : r.risk === "متوسط" ? "warning" : "success"}>{r.risk}</Badge> },
              { key: "act", header: "إجراءات", cell: (r) => (
                <div className="flex gap-1">
                  <button onClick={() => handleOpenDialog(r.name)} className="rounded-md p-2 hover:bg-accent" title="تعديل الدور"><Pencil className="h-4 w-4" /></button>
                  <Link to="/admin/permissions" className="rounded-md p-2 hover:bg-accent" title="فتح الصلاحيات"><Settings2 className="h-4 w-4" /></Link>
                  <button onClick={() => handleDeleteRole(r.name)} className="rounded-md p-2 text-danger hover:bg-danger/10" title="حذف الدور"><Trash2 className="h-4 w-4" /></button>
                </div>
              )},
            ]}
          />
        </PageCard>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 my-8">
            <div className="p-6 border-b border-border/50 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-inner border border-primary/20">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{editingRole ? "تعديل مسمى الدور" : "إضافة دور جديد"}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">تحديد مسمى الدور لاستخدامه في توزيع الصلاحيات</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">اسم الدور الوظيفي</label>
                <input 
                  type="text" 
                  value={newRoleName} 
                  onChange={e => setNewRoleName(e.target.value)} 
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                  placeholder="مثال: محاسب مالي، وكيل شؤون معلمين..."
                  autoFocus
                  onKeyDown={e => e.key === "Enter" && handleSave()}
                />
              </div>
              {editingRole && criticalRoles.has(editingRole) && (
                <div className="rounded-xl bg-warning/10 border border-warning/30 p-3.5 text-xs text-warning font-bold flex items-center gap-2">
                  <span>⚠️</span>
                  <span>هذا دور نظام أساسي وحساس — لا يمكن تعديل اسمه لدواعي الأمان والامتثال.</span>
                </div>
              )}

              <div className="pt-4 border-t border-border/50 flex justify-end gap-2.5">
                <button onClick={() => setIsDialogOpen(false)} className="rounded-xl px-5 py-2.5 text-sm font-bold border border-border/80 hover:bg-accent transition-colors active:scale-[0.98]">
                  إلغاء
                </button>
                <button onClick={handleSave} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 inline-flex items-center gap-2 active:scale-[0.98]">
                  <Save className="h-4 w-4" /> {editingRole ? "حفظ التعديل" : "إنشاء الدور"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

