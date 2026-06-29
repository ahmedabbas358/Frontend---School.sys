import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { FileBadge, Plus, Calendar, Settings, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/hr/contracts")({
  head: () => ({ meta: [{ title: "العقود والوثائق | منصة مدارس" }] }),
  component: ContractsPage,
});

function isExpiringSoon(endDate: string) {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = Math.abs(end.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 30 && end > now;
}

function ContractsPage() {
  const { currency, activeStageStaff, allStaffContracts, addStaffContract } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  const [showAdd, setShowAdd] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const activeStaff = useMemo(() => activeStageStaff.filter(s => !s.isDeleted), [activeStageStaff]);
  const activeStaffIds = useMemo(() => new Set(activeStaff.map(item => item.id)), [activeStaff]);
  const scopedContracts = useMemo(() => {
    return allStaffContracts
      .filter(item => activeStaffIds.has(item.staffId))
      .filter(item => statusFilter === "all" || item.status === statusFilter)
      .filter(item => !q.trim() || item.staffName.includes(q.trim()) || item.id.includes(q.trim()));
  }, [activeStaffIds, allStaffContracts, q, statusFilter]);

  const stats = useMemo(() => ({
    active: scopedContracts.filter(item => item.status === "active").length,
    renewing: scopedContracts.filter(item => item.status === "renewing").length,
    expired: scopedContracts.filter(item => item.status === "expired").length,
    expiringSoon: scopedContracts.filter(item => item.status === "active" && isExpiringSoon(item.endDate)).length,
  }), [scopedContracts]);

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
            <h1 className="text-2xl font-black">إدارة العقود والوثائق ({getStageLabel(stage)})</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">تتبع عقود موظفي المرحلة النشطة وتجديدها قبل انتهائها.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">سارية</p>
            <p className="mt-1 text-2xl font-black text-success">{stats.active}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">تنتهي قريباً</p>
            <p className="mt-1 text-2xl font-black text-warning">{stats.expiringSoon}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">قيد التجديد</p>
            <p className="mt-1 text-2xl font-black text-primary">{stats.renewing}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">منتهية</p>
            <p className="mt-1 text-2xl font-black text-danger">{stats.expired}</p>
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

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={event => setQ(event.target.value)} placeholder="بحث باسم الموظف أو رقم العقد..." className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
            </div>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold">
              <option value="all">كل الحالات</option>
              <option value="active">سارية</option>
              <option value="renewing">قيد التجديد</option>
              <option value="expired">منتهية</option>
            </select>
          </div>
        </div>

        <PageCard>
          <DataTable
            rows={scopedContracts}
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
              { key: "salary", header: "الراتب الأساسي", cell: (r) => <span className="font-bold text-success tabular">{r.basicSalary.toLocaleString("ar-EG")} {currency}</span> },
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
            empty={`لا توجد عقود مسجلة لموظفي ${getStageLabel(stage)}.`}
          />
        </PageCard>
      </div>
    </AppShell>
  );
}
