import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { DataTable } from "@/components/data-table";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/trash")({
  head: () => ({
    meta: [{ title: "سلة المهملات | منصة مدارس" }],
  }),
  component: SystemTrashPage,
});

function SystemTrashPage() {
  const { allStudents, allGuardians, allStaff, restoreItem, hardDeleteItem } = useGlobalStore();
  const [activeTab, setActiveTab] = useState<"students" | "guardians" | "staff">("students");

  const deletedStudents = useMemo(() => allStudents.filter(s => s.isDeleted), [allStudents]);
  const deletedGuardians = useMemo(() => allGuardians.filter(g => g.isDeleted), [allGuardians]);
  const deletedStaff = useMemo(() => allStaff.filter(s => s.isDeleted), [allStaff]);

  const handleRestore = (type: "student" | "guardian" | "staff", id: string) => {
    restoreItem(type, id);
    toast.success("تمت الاستعادة بنجاح");
  };

  const handleHardDelete = (type: "student" | "guardian" | "staff", id: string) => {
    if (confirm("هل أنت متأكد من الحذف النهائي؟ لا يمكن التراجع عن هذا الإجراء وسيؤدي إلى حذف كافة السجلات المرتبطة.")) {
      hardDeleteItem(type, id);
      toast.success("تم الحذف النهائي بنجاح");
    }
  };

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "إعدادات النظام" }, { label: "سلة المهملات" }]}
    >
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="bg-danger/10 text-danger p-3 rounded-xl">
            <Trash2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">سلة مهملات النظام</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">تخزين احتياطي مركزي لتفادي الحذف الخاطئ</p>
          </div>
        </div>

        <div className="flex bg-card border border-border p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("students")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === "students" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
          >
            الطلاب ({deletedStudents.length})
          </button>
          <button
            onClick={() => setActiveTab("guardians")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === "guardians" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
          >
            أولياء الأمور ({deletedGuardians.length})
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === "staff" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
          >
            الموظفون ({deletedStaff.length})
          </button>
        </div>

        <PageCard>
          {activeTab === "students" && (
            <DataTable
              rows={deletedStudents}
              columns={[
                { key: "id", header: "الرقم", cell: (s) => <span className="font-bold text-xs">{s.id}</span> },
                { key: "name", header: "الاسم", cell: (s) => <span className="font-bold text-danger">{s.name}</span> },
                { key: "grade", header: "الصف", cell: (s) => s.grade },
                { key: "deletedAt", header: "تاريخ الحذف", cell: (s) => <span className="text-xs">{new Date(s.deletedAt || "").toLocaleString("ar-SA")}</span> },
                {
                  key: "actions",
                  header: "الإجراءات",
                  cell: (s) => (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleRestore("student", s.id)} className="flex items-center gap-1 text-xs font-bold text-success bg-success/10 px-3 py-1.5 rounded-lg hover:bg-success/20">
                        <RotateCcw className="h-3.5 w-3.5" /> استعادة
                      </button>
                      <button onClick={() => handleHardDelete("student", s.id)} className="flex items-center gap-1 text-xs font-bold text-danger bg-danger/10 px-3 py-1.5 rounded-lg hover:bg-danger/20">
                        <AlertTriangle className="h-3.5 w-3.5" /> حذف نهائي
                      </button>
                    </div>
                  )
                }
              ]}
              empty="لا يوجد طلاب في سلة المهملات"
            />
          )}

          {activeTab === "guardians" && (
            <DataTable
              rows={deletedGuardians}
              columns={[
                { key: "id", header: "الرقم", cell: (g) => <span className="font-bold text-xs">{g.id}</span> },
                { key: "name", header: "الاسم", cell: (g) => <span className="font-bold text-danger">{g.name}</span> },
                { key: "phone", header: "الجوال", cell: (g) => g.phone },
                { key: "deletedAt", header: "تاريخ الحذف", cell: (g) => <span className="text-xs">{new Date(g.deletedAt || "").toLocaleString("ar-SA")}</span> },
                {
                  key: "actions",
                  header: "الإجراءات",
                  cell: (g) => (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleRestore("guardian", g.id)} className="flex items-center gap-1 text-xs font-bold text-success bg-success/10 px-3 py-1.5 rounded-lg hover:bg-success/20">
                        <RotateCcw className="h-3.5 w-3.5" /> استعادة
                      </button>
                      <button onClick={() => handleHardDelete("guardian", g.id)} className="flex items-center gap-1 text-xs font-bold text-danger bg-danger/10 px-3 py-1.5 rounded-lg hover:bg-danger/20">
                        <AlertTriangle className="h-3.5 w-3.5" /> حذف نهائي
                      </button>
                    </div>
                  )
                }
              ]}
              empty="لا يوجد أولياء أمور في سلة المهملات"
            />
          )}

          {activeTab === "staff" && (
            <DataTable
              rows={deletedStaff}
              columns={[
                { key: "id", header: "الرقم", cell: (s) => <span className="font-bold text-xs">{s.id}</span> },
                { key: "name", header: "الاسم", cell: (s) => <span className="font-bold text-danger">{s.name}</span> },
                { key: "role", header: "الوظيفة", cell: (s) => s.role },
                { key: "deletedAt", header: "تاريخ الحذف", cell: (s) => <span className="text-xs">{new Date(s.deletedAt || "").toLocaleString("ar-SA")}</span> },
                {
                  key: "actions",
                  header: "الإجراءات",
                  cell: (s) => (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleRestore("staff", s.id)} className="flex items-center gap-1 text-xs font-bold text-success bg-success/10 px-3 py-1.5 rounded-lg hover:bg-success/20">
                        <RotateCcw className="h-3.5 w-3.5" /> استعادة
                      </button>
                      <button onClick={() => handleHardDelete("staff", s.id)} className="flex items-center gap-1 text-xs font-bold text-danger bg-danger/10 px-3 py-1.5 rounded-lg hover:bg-danger/20">
                        <AlertTriangle className="h-3.5 w-3.5" /> حذف نهائي
                      </button>
                    </div>
                  )
                }
              ]}
              empty="لا يوجد موظفين في سلة المهملات"
            />
          )}
        </PageCard>
      </div>
    </AppShell>
  );
}
