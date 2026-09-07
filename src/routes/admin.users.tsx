import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { Plus, Pencil, KeyRound, Search, ShieldCheck, UserCheck, UserX, Clock, Power } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { rolesCatalog } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "إدارة المستخدمين | منصة مدارس" }] }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { allUsers, addUser, updateUser, deleteUser } = useGlobalStore();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    role: "إداري",
    status: "active" as "active" | "disabled"
  });

  const roles = useMemo(() => Array.from(new Set(allUsers.map(user => user.role))), [allUsers]);
  const filteredUsers = useMemo(() => {
    const term = q.trim();
    return allUsers.filter(user => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (statusFilter !== "all" && user.status !== statusFilter) return false;
      if (!term) return true;
      return user.username.includes(term) || user.fullName.includes(term) || user.role.includes(term);
    });
  }, [q, roleFilter, statusFilter, allUsers]);

  const stats = useMemo(() => ({
    total: allUsers.length,
    active: allUsers.filter(user => user.status === "active").length,
    disabled: allUsers.filter(user => user.status !== "active").length,
    admins: allUsers.filter(user => user.role.includes("مدير")).length,
  }), [allUsers]);

  const handleOpenDialog = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        status: user.status
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: "",
        fullName: "",
        role: "إداري",
        status: "active"
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.username || !formData.fullName) {
      toast.error("يرجى تعبئة الحقول المطلوبة");
      return;
    }
    if (editingUser) {
      updateUser(editingUser.id, formData);
      toast.success("تم تحديث بيانات المستخدم");
    } else {
      addUser({ ...formData, lastLogin: "لم يسجل دخول" });
      toast.success("تم إنشاء مستخدم جديد");
    }
    setIsDialogOpen(false);
  };

  const handleToggleStatus = (user: any) => {
    const newStatus = user.status === "active" ? "disabled" : "active";
    updateUser(user.id, { status: newStatus });
    toast.success(`تم ${newStatus === "active" ? "تفعيل" : "تعطيل"} حساب ${user.fullName}`);
  };

  const handleResetPassword = (user: any) => {
    if (window.confirm(`هل أنت متأكد من إعادة تعيين كلمة مرور ${user.fullName}؟`)) {
       const newPass = Math.random().toString(36).slice(-8);
       navigator.clipboard.writeText(newPass);
       toast.success(`تم إنشاء كلمة مرور جديدة (${newPass}) ونسخها للحافظة`);
    }
  };

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الإدارة العامة" }, { label: "المستخدمون" }]}
      actions={
        <button onClick={() => handleOpenDialog()} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> مستخدم جديد
        </button>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">إدارة المستخدمين والحسابات</h1>
            <p className="mt-1 text-sm font-bold text-muted-foreground">بحث وفلاتر وإجراءات أمان سريعة لحسابات الإدارة والمعلمين.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">إجمالي الحسابات</p>
            <p className="mt-1 text-2xl font-black">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">نشطة</p>
            <p className="mt-1 text-2xl font-black text-success">{stats.active}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">معطلة</p>
            <p className="mt-1 text-2xl font-black text-danger">{stats.disabled}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">مديرو النظام</p>
            <p className="mt-1 text-2xl font-black text-primary">{stats.admins}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur-xl shadow-sm">
          <div className="grid gap-3.5 md:grid-cols-[1fr_200px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={event => setQ(event.target.value)} placeholder="بحث باسم المستخدم أو الاسم أو الدور..." className="h-11 w-full rounded-xl border border-border/80 bg-background/80 ps-10 pe-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15" />
            </div>
            <select value={roleFilter} onChange={event => setRoleFilter(event.target.value)} className="h-11 rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer">
              <option value="all">كل الأدوار</option>
              {roles.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer">
              <option value="all">كل الحالات</option>
              <option value="active">نشط</option>
              <option value="disabled">معطل</option>
            </select>
          </div>
        </div>

        <PageCard>
          <DataTable
            rows={filteredUsers}
            pageSize={25}
            columns={[
              { key: "u", header: "اسم المستخدم", cell: (u) => <span className="font-bold tabular">{u.username}</span> },
              { key: "n", header: "الاسم الكامل", cell: (u) => <div className="font-bold">{u.fullName}</div> },
              { key: "r", header: "الدور", cell: (u) => <Badge tone={u.role.includes("مدير") ? "danger" : "primary"}>{u.role}</Badge> },
              { key: "s", header: "الحالة", cell: (u) => (
                <Badge tone={u.status === "active" ? "success" : "danger"}>
                  {u.status === "active" ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                  {u.status === "active" ? "نشط" : "معطل"}
                </Badge>
              ) },
              { key: "l", header: "آخر دخول", cell: (u) => <span className="inline-flex items-center gap-1 text-xs tabular"><Clock className="h-3 w-3 text-muted-foreground" />{u.lastLogin || "لم يسجل دخول"}</span> },
              { key: "act", header: "إجراءات", cell: (u) => (
                <div className="flex gap-1">
                  <button onClick={() => handleOpenDialog(u)} className="rounded-xl p-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="تعديل الحساب"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleResetPassword(u)} className="rounded-xl p-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="إعادة تعيين كلمة المرور"><KeyRound className="h-4 w-4" /></button>
                  <button onClick={() => handleToggleStatus(u)} className={`rounded-xl p-2 hover:bg-accent transition-colors ${u.status === "active" ? "text-danger" : "text-success"}`} title={u.status === "active" ? "تعطيل الحساب" : "تفعيل الحساب"}><Power className="h-4 w-4" /></button>
                </div>
              )},
            ]}
            empty="لا توجد حسابات مطابقة للفلاتر."
          />
        </PageCard>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 my-8">
            <div className="p-6 border-b border-border/50 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-inner border border-primary/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{editingUser ? "تعديل بيانات المستخدم" : "إنشاء مستخدم جديد"}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">إدارة بيانات تسجيل الدخول وتحديد الصلاحيات</p>
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
                <label className="text-xs font-bold text-muted-foreground">اسم المستخدم (للدخول)</label>
                <input 
                  type="text" 
                  value={formData.username} 
                  onChange={e => setFormData({ ...formData, username: e.target.value })} 
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                  placeholder="مثال: a.alotaibi"
                  dir="ltr"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">الاسم الكامل</label>
                <input 
                  type="text" 
                  value={formData.fullName} 
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })} 
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                  placeholder="مثال: أحمد العتيبي"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">الدور والصلاحيات</label>
                <select 
                  value={formData.role} 
                  onChange={e => setFormData({ ...formData, role: e.target.value })} 
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer"
                >
                  {rolesCatalog.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">حالة الحساب</label>
                <select 
                  value={formData.status} 
                  onChange={e => setFormData({ ...formData, status: e.target.value as "active" | "disabled" })} 
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer"
                >
                  <option value="active">نشط (مسموح بالدخول)</option>
                  <option value="disabled">معطل (محظور مؤقتاً)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-end gap-2.5">
                <button onClick={() => setIsDialogOpen(false)} className="rounded-xl px-5 py-2.5 text-sm font-bold border border-border/80 hover:bg-accent transition-colors active:scale-[0.98]">
                  إلغاء
                </button>
                <button onClick={handleSave} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-[0.98]">
                  حفظ البيانات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
