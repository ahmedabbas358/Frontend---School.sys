import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { FileBadge, Plus, Calendar, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/hr/contracts")({
  head: () => ({ meta: [{ title: "العقود والوثائق | منصة مدارس" }] }),
  component: ContractsPage,
});

function ContractsPage() {
  const { allStaff, allStaffContracts, addStaffContract } = useGlobalStore();
  const [showAdd, setShowAdd] = useState(false);
  const activeStaff = allStaff.filter(s => !s.isDeleted);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const staffId = formData.get("staffId") as string;
    const staff = activeStaff.find(s => s.id === staffId);
    
    if (!staff) return;

    addStaffContract({
      staffId,
      staffName: staff.name,
      type: formData.get("type") as any,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      basicSalary: Number(formData.get("basicSalary")) || 0,
      status: formData.get("status") as any,
    });
    
    toast.success("تم تسجيل العقد بنجاح");
    setShowAdd(false);
  };

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = Math.abs(end.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays <= 30 && end > now;
  };

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "شؤون الموظفين" }, { label: "العقود والوثائق" }]}
      actions={
        <button onClick={() => setShowAdd(true)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> تسجيل عقد
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl">
            <FileBadge className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">إدارة العقود والوثائق</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">تتبع عقود الموظفين وتجديدها قبل انتهائها</p>
          </div>
        </div>

        {showAdd && (
          <PageCard title="تسجيل عقد موظف جديد" className="border-primary/20 bg-primary/5">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">الموظف</label>
                  <select name="staffId" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                    <option value="">اختر الموظف...</option>
                    {activeStaff.map(s => (
                      <option key={s.id} value={s.id}>{s.name} - {s.role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">نوع العقد</label>
                  <select name="type" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                    <option value="full_time">دوام كامل (سنوي)</option>
                    <option value="part_time">دوام جزئي</option>
                    <option value="contractor">عقد مقاولة / بالساعة</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">الراتب الأساسي</label>
                  <input name="basicSalary" type="number" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" placeholder="الراتب المتفق عليه بالعقد" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">تاريخ بداية العقد</label>
                  <input name="startDate" type="date" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">تاريخ نهاية العقد</label>
                  <input name="endDate" type="date" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">الحالة</label>
                  <select name="status" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                    <option value="active">ساري المفعول</option>
                    <option value="expired">منتهي</option>
                    <option value="renewing">قيد التجديد</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-bold text-muted-foreground bg-muted/50 rounded-lg hover:bg-muted">إلغاء</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">حفظ العقد</button>
              </div>
            </form>
          </PageCard>
        )}

        <PageCard>
          <DataTable
            rows={allStaffContracts}
            columns={[
              { key: "id", header: "رقم العقد", cell: (r) => <span className="text-xs font-bold text-muted-foreground">{r.id}</span> },
              { key: "staff", header: "الموظف", cell: (r) => <div className="font-bold">{r.staffName}</div> },
              { key: "type", header: "نوع العقد", cell: (r) => (
                <span className="text-sm">
                  {r.type === "full_time" ? "دوام كامل" : r.type === "part_time" ? "دوام جزئي" : "عقد مقاولة"}
                </span>
              )},
              { key: "dates", header: "فترة العقد", cell: (r) => (
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span>{r.startDate}</span>
                  <span className="text-muted-foreground">←</span>
                  <span className={`${isExpiringSoon(r.endDate) ? "text-danger font-bold" : ""}`}>{r.endDate}</span>
                </div>
              )},
              { key: "salary", header: "الراتب الأساسي", cell: (r) => <span className="font-bold text-success tabular">{r.basicSalary.toLocaleString("ar-EG")} ر.س</span> },
              { key: "status", header: "الحالة", cell: (r) => (
                <Badge tone={r.status === "active" ? (isExpiringSoon(r.endDate) ? "warning" : "success") : r.status === "expired" ? "danger" : "primary"}>
                  {r.status === "active" ? (isExpiringSoon(r.endDate) ? "ينتهي قريباً" : "ساري") : r.status === "expired" ? "منتهي" : "قيد التجديد"}
                </Badge>
              )},
              { key: "actions", header: "", cell: () => (
                <div className="flex justify-end">
                   <button className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              )}
            ]}
            empty="لا توجد عقود مسجلة"
          />
        </PageCard>
      </div>
    </AppShell>
  );
}
