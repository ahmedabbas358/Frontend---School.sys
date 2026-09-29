import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { DataTable } from "@/components/data-table";
import { AdminModal } from "@/components/admin/admin-modal";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  CheckCircle2,
  X,
  Clock,
  User,
  Users,
  Briefcase,
  HeartHandshake,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/trash")({
  head: () => ({
    meta: [{ title: "سلة المحذوفات واسترجاع البيانات | منصة مدارس" }],
  }),
  component: SystemTrashPage,
});

function SystemTrashPage() {
  const { allStudents, allGuardians, allStaff, restoreItem, hardDeleteItem, addActivityLog } =
    useGlobalStore();

  const [activeTab, setActiveTab] = useState<"students" | "guardians" | "staff">("students");
  const [q, setQ] = useState("");

  // Modals
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    type: "student" | "guardian" | "staff";
    id: string;
    name: string;
  } | null>(null);

  const [restoreConfirmModal, setRestoreConfirmModal] = useState<{
    type: "student" | "guardian" | "staff";
    id: string;
    name: string;
  } | null>(null);

  const [emptyTrashModal, setEmptyTrashModal] = useState(false);

  const deletedStudents = useMemo(() => allStudents.filter((s) => s.isDeleted), [allStudents]);
  const deletedGuardians = useMemo(() => allGuardians.filter((g) => g.isDeleted), [allGuardians]);
  const deletedStaff = useMemo(() => allStaff.filter((s) => s.isDeleted), [allStaff]);

  const totalDeleted = deletedStudents.length + deletedGuardians.length + deletedStaff.length;

  const filteredStudents = useMemo(() => {
    const term = q.trim();
    if (!term) return deletedStudents;
    return deletedStudents.filter(
      (s) => s.name?.includes(term) || s.id?.includes(term) || s.grade?.includes(term)
    );
  }, [deletedStudents, q]);

  const filteredGuardians = useMemo(() => {
    const term = q.trim();
    if (!term) return deletedGuardians;
    return deletedGuardians.filter(
      (g) => g.name?.includes(term) || g.id?.includes(term) || g.phone?.includes(term)
    );
  }, [deletedGuardians, q]);

  const filteredStaff = useMemo(() => {
    const term = q.trim();
    if (!term) return deletedStaff;
    return deletedStaff.filter(
      (s) => s.name?.includes(term) || s.id?.includes(term) || s.role?.includes(term)
    );
  }, [deletedStaff, q]);

  const handleRestore = (type: "student" | "guardian" | "staff", id: string, name: string) => {
    restoreItem(type, id);
    addActivityLog({
      user: "مدير النظام",
      action: "استعادة من سلة المهملات",
      entity: "سلة المحذوفات",
      details: `تمت استعادة سجل (${name}) بنجاح`,
    });
    toast.success(`تمت استعادة "${name}" بنجاح إلى النظام`);
    setRestoreConfirmModal(null);
  };

  const handleHardDelete = (type: "student" | "guardian" | "staff", id: string, name: string) => {
    hardDeleteItem(type, id);
    addActivityLog({
      user: "مدير النظام",
      action: "حذف نهائي لا رجعة فيه",
      entity: "سلة المحذوفات",
      details: `تم حذف سجل (${name}) نهائياً من قاعدة البيانات`,
    });
    toast.success(`تم الحذف النهائي لسجل "${name}"`);
    setDeleteConfirmModal(null);
  };

  const handleEmptyAllTrash = () => {
    deletedStudents.forEach((s) => hardDeleteItem("student", s.id));
    deletedGuardians.forEach((g) => hardDeleteItem("guardian", g.id));
    deletedStaff.forEach((st) => hardDeleteItem("staff", st.id));

    addActivityLog({
      user: "مدير النظام",
      action: "تفريغ سلة المهملات بالكامل",
      entity: "سلة المحذوفات",
      details: `تم تفريغ كافة السجلات المحذوفة (${totalDeleted} عنصر)`,
    });

    toast.success("تم تفريغ سلة المهملات بالكامل بنجاح");
    setEmptyTrashModal(false);
  };

  const handleRestoreAllTab = () => {
    if (activeTab === "students") {
      deletedStudents.forEach((s) => restoreItem("student", s.id));
      toast.success(`تمت استعادة كافة الطلاب (${deletedStudents.length}) بنجاح`);
    } else if (activeTab === "guardians") {
      deletedGuardians.forEach((g) => restoreItem("guardian", g.id));
      toast.success(`تمت استعادة كافة أولياء الأمور (${deletedGuardians.length}) بنجاح`);
    } else {
      deletedStaff.forEach((s) => restoreItem("staff", s.id));
      toast.success(`تمت استعادة كافة الموظفين (${deletedStaff.length}) بنجاح`);
    }
  };

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الإدارة والنظام" }, { label: "سلة المحذوفات" }]}
      actions={
        <div className="flex items-center gap-2">
          {totalDeleted > 0 && (
            <>
              <button
                onClick={handleRestoreAllTab}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 text-sm font-bold text-success hover:bg-success/20 transition-colors shadow-sm"
              >
                <RotateCcw className="h-4 w-4" /> استعادة تبويب {activeTab === "students" ? "الطلاب" : activeTab === "guardians" ? "أولياء الأمور" : "الموظفين"}
              </button>
              <button
                onClick={() => setEmptyTrashModal(true)}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-danger px-4 text-sm font-bold text-white hover:bg-danger/90 shadow-md shadow-danger/20 transition-all"
              >
                <Trash2 className="h-4 w-4" /> تفريغ السلة بالكامل
              </button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-5 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-danger/20 to-danger/5 text-danger p-3.5 rounded-2xl shadow-inner border border-danger/20">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black">سلة مهملات النظام المركزية (System Trash)</h1>
              <p className="text-sm font-bold text-muted-foreground mt-1">
                تأمين مركزي يحفظ السجلات المحذوفة مؤقتاً لتفادي أخطاء الحذف، مع إمكانية الاستعادة أو الإتلاف النهائي
              </p>
            </div>
          </div>
        </div>

        {/* Stats & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex bg-muted/40 border border-border p-1 rounded-2xl w-fit">
            <button
              onClick={() => {
                setActiveTab("students");
                setQ("");
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeTab === "students"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              الطلاب
              <span className="text-xs px-2 py-0.5 rounded-lg bg-muted font-bold tabular-nums">
                {deletedStudents.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("guardians");
                setQ("");
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeTab === "guardians"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <HeartHandshake className="h-4 w-4" />
              أولياء الأمور
              <span className="text-xs px-2 py-0.5 rounded-lg bg-muted font-bold tabular-nums">
                {deletedGuardians.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("staff");
                setQ("");
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
                activeTab === "staff"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              الموظفون
              <span className="text-xs px-2 py-0.5 rounded-lg bg-muted font-bold tabular-nums">
                {deletedStaff.length}
              </span>
            </button>
          </div>

          {/* Search */}
          <div className="relative min-w-[240px]">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="بحث في السلة..."
              className="h-11 w-full rounded-xl border border-border/80 bg-background ps-10 pe-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
            />
          </div>
        </div>

        {/* Content Table */}
        <PageCard>
          {activeTab === "students" && (
            <DataTable
              rows={filteredStudents}
              columns={[
                {
                  key: "id",
                  header: "رقم الطالب",
                  cell: (s) => (
                    <span className="font-mono font-bold text-xs text-muted-foreground tabular-nums">{s.id}</span>
                  ),
                },
                {
                  key: "name",
                  header: "اسم الطالب",
                  cell: (s) => (
                    <div className="font-black text-sm text-foreground flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-danger/10 text-danger flex items-center justify-center font-black text-xs">
                        {s.name?.[0] || "ط"}
                      </div>
                      <span>{s.name}</span>
                    </div>
                  ),
                },
                {
                  key: "grade",
                  header: "المرحلة والصف",
                  cell: (s) => (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-muted/60 border border-border/60">
                      {s.grade || "غير محدد"}
                    </span>
                  ),
                },
                {
                  key: "deletedAt",
                  header: "تاريخ الإرسال للسلة",
                  cell: (s) => (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      <span dir="ltr">{new Date(s.deletedAt || "").toLocaleString("ar-EG")}</span>
                    </div>
                  ),
                },
                {
                  key: "actions",
                  header: "الخيارات",
                  cell: (s) => (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setRestoreConfirmModal({ type: "student", id: s.id, name: s.name })}
                        className="flex items-center gap-1.5 text-xs font-black text-success bg-success/10 px-3 py-1.5 rounded-xl hover:bg-success/20 transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> استعادة
                      </button>
                      <button
                        onClick={() => setDeleteConfirmModal({ type: "student", id: s.id, name: s.name })}
                        className="flex items-center gap-1.5 text-xs font-black text-danger bg-danger/10 px-3 py-1.5 rounded-xl hover:bg-danger/20 transition-colors"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" /> حذف نهائي
                      </button>
                    </div>
                  ),
                },
              ]}
              empty="لا يوجد طلاب في سلة المهملات حالياً"
            />
          )}

          {activeTab === "guardians" && (
            <DataTable
              rows={filteredGuardians}
              columns={[
                {
                  key: "id",
                  header: "رقم المعرف",
                  cell: (g) => (
                    <span className="font-mono font-bold text-xs text-muted-foreground tabular-nums">{g.id}</span>
                  ),
                },
                {
                  key: "name",
                  header: "اسم ولي الأمر",
                  cell: (g) => (
                    <div className="font-black text-sm text-foreground flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-danger/10 text-danger flex items-center justify-center font-black text-xs">
                        {g.name?.[0] || "و"}
                      </div>
                      <span>{g.name}</span>
                    </div>
                  ),
                },
                {
                  key: "phone",
                  header: "رقم الجوال",
                  cell: (g) => <span className="font-mono text-xs font-bold" dir="ltr">{g.phone || "—"}</span>,
                },
                {
                  key: "deletedAt",
                  header: "تاريخ الإرسال للسلة",
                  cell: (g) => (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      <span dir="ltr">{new Date(g.deletedAt || "").toLocaleString("ar-EG")}</span>
                    </div>
                  ),
                },
                {
                  key: "actions",
                  header: "الخيارات",
                  cell: (g) => (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setRestoreConfirmModal({ type: "guardian", id: g.id, name: g.name })}
                        className="flex items-center gap-1.5 text-xs font-black text-success bg-success/10 px-3 py-1.5 rounded-xl hover:bg-success/20 transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> استعادة
                      </button>
                      <button
                        onClick={() => setDeleteConfirmModal({ type: "guardian", id: g.id, name: g.name })}
                        className="flex items-center gap-1.5 text-xs font-black text-danger bg-danger/10 px-3 py-1.5 rounded-xl hover:bg-danger/20 transition-colors"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" /> حذف نهائي
                      </button>
                    </div>
                  ),
                },
              ]}
              empty="لا يوجد أولياء أمور في سلة المهملات حالياً"
            />
          )}

          {activeTab === "staff" && (
            <DataTable
              rows={filteredStaff}
              columns={[
                {
                  key: "id",
                  header: "الرقم الوظيفي",
                  cell: (s) => (
                    <span className="font-mono font-bold text-xs text-muted-foreground tabular-nums">{s.id}</span>
                  ),
                },
                {
                  key: "name",
                  header: "اسم الموظف",
                  cell: (s) => (
                    <div className="font-black text-sm text-foreground flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-danger/10 text-danger flex items-center justify-center font-black text-xs">
                        {s.name?.[0] || "م"}
                      </div>
                      <span>{s.name}</span>
                    </div>
                  ),
                },
                {
                  key: "role",
                  header: "المسمى الوظيفي",
                  cell: (s) => (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-muted/60 border border-border/60">
                      {s.role || "غير محدد"}
                    </span>
                  ),
                },
                {
                  key: "deletedAt",
                  header: "تاريخ الإرسال للسلة",
                  cell: (s) => (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      <span dir="ltr">{new Date(s.deletedAt || "").toLocaleString("ar-EG")}</span>
                    </div>
                  ),
                },
                {
                  key: "actions",
                  header: "الخيارات",
                  cell: (s) => (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setRestoreConfirmModal({ type: "staff", id: s.id, name: s.name })}
                        className="flex items-center gap-1.5 text-xs font-black text-success bg-success/10 px-3 py-1.5 rounded-xl hover:bg-success/20 transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> استعادة
                      </button>
                      <button
                        onClick={() => setDeleteConfirmModal({ type: "staff", id: s.id, name: s.name })}
                        className="flex items-center gap-1.5 text-xs font-black text-danger bg-danger/10 px-3 py-1.5 rounded-xl hover:bg-danger/20 transition-colors"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" /> حذف نهائي
                      </button>
                    </div>
                  ),
                },
              ]}
              empty="لا يوجد موظفون في سلة المهملات حالياً"
            />
          )}
        </PageCard>
      </div>

      {/* ────── Modal: Hard Delete Confirmation ────── */}
      <AdminModal
        isOpen={Boolean(deleteConfirmModal)}
        onClose={() => setDeleteConfirmModal(null)}
        title="الحذف النهائي الذي لا يمكن التراجع عنه"
        description="إتلاف السجل نهائياً من قاعدة البيانات"
        icon={Trash2}
        tone="danger"
        maxWidth="sm"
        footer={
          deleteConfirmModal && (
            <div className="flex gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="flex-1 rounded-xl border border-input py-2.5 text-xs font-bold hover:bg-accent transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() =>
                  handleHardDelete(
                    deleteConfirmModal.type,
                    deleteConfirmModal.id,
                    deleteConfirmModal.name
                  )
                }
                className="flex-1 rounded-xl bg-destructive py-2.5 text-xs font-black text-white hover:bg-destructive/90 transition-all shadow-md"
              >
                تأكيد الإتلاف
              </button>
            </div>
          )
        }
      >
        {deleteConfirmModal && (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground leading-relaxed font-bold">
              هل أنت متأكد من رغبتك في إتلاف سجل{" "}
              <strong className="text-foreground font-black">"{deleteConfirmModal.name}"</strong> نهائياً من قاعدة
              البيانات؟ لن تتمكن من استعادته لاحقاً.
            </p>
          </div>
        )}
      </AdminModal>

      {/* ────── Modal: Restore Confirmation ────── */}
      <AdminModal
        isOpen={Boolean(restoreConfirmModal)}
        onClose={() => setRestoreConfirmModal(null)}
        title="استعادة السجل للنظام"
        description="إلغاء أرشفة السجل وإعادته للعمل"
        icon={RotateCcw}
        tone="success"
        maxWidth="sm"
        footer={
          restoreConfirmModal && (
            <div className="flex gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setRestoreConfirmModal(null)}
                className="flex-1 rounded-xl border border-input py-2.5 text-xs font-bold hover:bg-accent transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() =>
                  handleRestore(
                    restoreConfirmModal.type,
                    restoreConfirmModal.id,
                    restoreConfirmModal.name
                  )
                }
                className="flex-1 rounded-xl bg-success text-white font-black py-2.5 text-xs hover:bg-success/90 transition-all shadow-md"
              >
                تأكيد الاستعادة
              </button>
            </div>
          )
        }
      >
        {restoreConfirmModal && (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground leading-relaxed font-bold">
              سيتم استعادة سجل{" "}
              <strong className="text-foreground font-black">"{restoreConfirmModal.name}"</strong> وإعادة تفعيله
              في كافة أقسام النظام.
            </p>
          </div>
        )}
      </AdminModal>

      {/* ────── Modal: Empty Entire Trash Confirmation ────── */}
      <AdminModal
        isOpen={emptyTrashModal}
        onClose={() => setEmptyTrashModal(false)}
        title="تفريغ سلة المهملات بالكامل"
        description="إتلاف وتصفير محتويات السلة نهائياً"
        icon={ShieldAlert}
        tone="danger"
        maxWidth="sm"
        footer={
          <div className="flex gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setEmptyTrashModal(false)}
              className="flex-1 rounded-xl border border-input py-2.5 text-xs font-bold hover:bg-accent transition-colors"
            >
              تراجع
            </button>
            <button
              type="button"
              onClick={handleEmptyAllTrash}
              className="flex-1 rounded-xl bg-destructive py-2.5 text-xs font-black text-white hover:bg-destructive/90 transition-all shadow-md"
            >
              تفريغ الكل نهائياً
            </button>
          </div>
        }
      >
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground leading-relaxed font-bold">
            هل أنت متأكد من رغبتك في إتلاف وحذف جميع العناصر في سلة المهملات (
            <strong className="text-destructive font-black">{totalDeleted} عنصر</strong>) نهائياً؟
          </p>
        </div>
      </AdminModal>
    </AppShell>
  );
}
