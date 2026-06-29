import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { Wrench, Plus, CheckCircle, AlertTriangle, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/facilities/maintenance")({
  head: () => ({ meta: [{ title: "طلبات الصيانة | منصة مدارس" }] }),
  component: MaintenancePage,
});

function MaintenancePage() {
  const { allMaintenanceRequests, updateMaintenanceRequest, addMaintenanceRequest, undoMaintenanceRequest, deleteMaintenanceRequest, currency } = useGlobalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any | null>(null);

  const handleComplete = (id: string, costEstimate: number) => {
    if (confirm("هل أنت متأكد من إكمال طلب الصيانة؟ سيتم إنشاء مصروف مالي تلقائياً بناءً على التكلفة.")) {
      updateMaintenanceRequest(id, { status: "completed", costEstimate, dateCompleted: new Date().toISOString().split("T")[0] });
      toast.success("تم إكمال الطلب وإنشاء المصروف المالي بنجاح");
    }
  };

  const handleUndoComplete = (id: string) => {
    if (confirm("هل أنت متأكد من التراجع عن إكمال هذا الطلب؟ سيتم حذف المصروف المالي المرتبط إن وجد.")) {
      undoMaintenanceRequest(id);
      toast.success("تم التراجع عن إكمال الطلب");
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    addMaintenanceRequest({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      priority: formData.get("priority") as "high" | "medium" | "low",
      status: "new",
      costEstimate: Number(formData.get("costEstimate")) || 0,
      dateRequested: new Date().toISOString().split("T")[0],
    });
    toast.success("تم رفع طلب الصيانة بنجاح");
    setShowAdd(false);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;
    const formData = new FormData(e.target as HTMLFormElement);
    updateMaintenanceRequest(editingRequest.id, {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      location: formData.get("location") as string,
      priority: formData.get("priority") as "high" | "medium" | "low",
      costEstimate: Number(formData.get("costEstimate")) || 0,
    });
    toast.success("تم تحديث طلب الصيانة بنجاح");
    setEditingRequest(null);
  };

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "المرافق والخدمات" }, { label: "طلبات الصيانة" }]}
      actions={
        <button onClick={() => setShowAdd(true)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> رفع طلب صيانة
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="bg-warning/10 text-warning-foreground p-3 rounded-xl">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">طلبات الصيانة وإدارة الأصول</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">إدارة الأعطال والصيانة الدورية وتتبع تكاليفها</p>
          </div>
        </div>

        {showAdd && (
          <PageCard title="رفع طلب صيانة جديد" className="border-primary/20 bg-primary/5">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">عنوان الطلب</label>
                  <input name="title" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" placeholder="مثال: إصلاح مكيف" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">الموقع</label>
                  <input name="location" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" placeholder="مثال: معمل الحاسب" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">وصف العطل</label>
                  <textarea name="description" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" rows={2}></textarea>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">الأولوية</label>
                  <select name="priority" className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عاجلة</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">التكلفة التقديرية (اختياري)</label>
                  <input name="costEstimate" type="number" className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-bold text-muted-foreground bg-muted/50 rounded-lg hover:bg-muted">إلغاء</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">حفظ الطلب</button>
              </div>
            </form>
          </PageCard>
        )}

        {editingRequest && (
          <PageCard title="تعديل طلب الصيانة" className="border-primary/20 bg-primary/5">
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">عنوان الطلب</label>
                  <input name="title" defaultValue={editingRequest.title} required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">الموقع</label>
                  <input name="location" defaultValue={editingRequest.location} required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">وصف العطل</label>
                  <textarea name="description" defaultValue={editingRequest.description} required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" rows={2}></textarea>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">الأولوية</label>
                  <select name="priority" defaultValue={editingRequest.priority} className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عاجلة</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">التكلفة التقديرية (اختياري)</label>
                  <input name="costEstimate" defaultValue={editingRequest.costEstimate || ''} type="number" className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditingRequest(null)} className="px-4 py-2 text-sm font-bold text-muted-foreground bg-muted/50 rounded-lg hover:bg-muted">إلغاء</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">تحديث الطلب</button>
              </div>
            </form>
          </PageCard>
        )}

        <PageCard>
          <DataTable
            rows={allMaintenanceRequests}
            columns={[
              { key: "id", header: "رقم الطلب", cell: (r) => <span className="font-bold">{r.id}</span> },
              { key: "title", header: "العنوان", cell: (r) => <div className="font-bold">{r.title}</div> },
              { key: "location", header: "الموقع", cell: (r) => r.location },
              { key: "priority", header: "الأولوية", cell: (r) => (
                <Badge tone={r.priority === "high" ? "danger" : r.priority === "medium" ? "warning" : "primary"}>
                  {r.priority === "high" ? "عاجلة" : r.priority === "medium" ? "متوسطة" : "منخفضة"}
                </Badge>
              )},
              { key: "status", header: "الحالة", cell: (r) => (
                <Badge tone={r.status === "completed" ? "success" : r.status === "in_progress" ? "warning" : "primary"}>
                  {r.status === "completed" ? "منجز" : r.status === "in_progress" ? "قيد التنفيذ" : "جديد"}
                </Badge>
              )},
              { key: "cost", header: "التكلفة", cell: (r) => <span className="font-bold text-success">{r.costEstimate ? `${r.costEstimate} ${currency}` : "-"}</span> },
              { key: "date", header: "تاريخ الطلب", cell: (r) => r.dateRequested },
              { key: "actions", header: "", cell: (r) => (
                <div className="flex justify-end gap-2">
                  {r.status !== "completed" ? (
                    <button onClick={() => handleComplete(r.id, r.costEstimate || 0)} className="flex items-center gap-1 text-xs font-bold text-success bg-success/10 hover:bg-success/20 px-2 py-1.5 rounded-lg">
                      <CheckCircle className="h-4 w-4" /> إكمال الطلب وتحويله لمصروف
                    </button>
                  ) : (
                    <button onClick={() => handleUndoComplete(r.id)} className="flex items-center gap-1 text-xs font-bold text-warning bg-warning/10 hover:bg-warning/20 px-2 py-1.5 rounded-lg">
                      تراجع
                    </button>
                  )}
                  <button onClick={() => setEditingRequest(r)} className="rounded-md p-2 text-primary hover:bg-primary/10 transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => { if(confirm('هل أنت متأكد من الحذف؟')) deleteMaintenanceRequest(r.id); }} className="rounded-md p-2 text-danger hover:bg-danger/10 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )},
            ]}
            empty="لا توجد طلبات صيانة مسجلة"
          />
          <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-200 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <strong>ملاحظة التكامل المالي:</strong> عند تغيير حالة الطلب إلى "منجز"، سيتم تلقائياً إنشاء إدخال جديد في قسم <strong>المصروفات</strong> بناءً على التكلفة التقديرية المدخلة، وذلك لضمان الدقة المالية للمدرسة.
            </div>
          </div>
        </PageCard>
      </div>
    </AppShell>
  );
}
