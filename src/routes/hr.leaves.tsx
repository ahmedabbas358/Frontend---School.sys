import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore, StaffLeave } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { Calendar, Plus, Check, X, Search, Clock, UserCheck, UserX } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/hr/leaves")({
  head: () => ({ meta: [{ title: "إجازات الموظفين | منصة مدارس" }] }),
  component: HrLeaves,
});

const leaveTypeLabels: Record<StaffLeave["type"], string> = {
  annual: "سنوية",
  sick: "مرضية",
  unpaid: "بدون راتب",
  emergency: "طارئة",
};

const statusLabels: Record<StaffLeave["status"], string> = {
  pending: "قيد المراجعة",
  approved: "معتمدة",
  rejected: "مرفوضة",
};

function countDays(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

function HrLeaves() {
  const { stage, getStageLabel } = useStage();
  const { activeStageStaff, allStaffLeaves, addStaffLeave, updateStaffLeave } = useGlobalStore();
  const [showAdd, setShowAdd] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StaffLeave["status"] | "all">("all");
  const [typeFilter, setTypeFilter] = useState<StaffLeave["type"] | "all">("all");

  const staffInScope = useMemo(
    () => activeStageStaff.filter(item => !item.isDeleted && item.status !== "terminated"),
    [activeStageStaff]
  );
  const staffIds = useMemo(() => new Set(staffInScope.map(item => item.id)), [staffInScope]);

  const scopedLeaves = useMemo(() => {
    return allStaffLeaves
      .filter(item => staffIds.has(item.staffId))
      .filter(item => statusFilter === "all" || item.status === statusFilter)
      .filter(item => typeFilter === "all" || item.type === typeFilter)
      .filter(item => {
        if (!q.trim()) return true;
        const term = q.trim();
        return item.staffName.includes(term) || item.id.includes(term) || leaveTypeLabels[item.type].includes(term);
      });
  }, [allStaffLeaves, q, staffIds, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const stageLeaves = allStaffLeaves.filter(item => staffIds.has(item.staffId));
    return {
      pending: stageLeaves.filter(item => item.status === "pending").length,
      approved: stageLeaves.filter(item => item.status === "approved").length,
      rejected: stageLeaves.filter(item => item.status === "rejected").length,
      approvedDays: stageLeaves.filter(item => item.status === "approved").reduce((sum, item) => sum + item.days, 0),
    };
  }, [allStaffLeaves, staffIds]);

  const handleDecision = (leave: StaffLeave, status: "approved" | "rejected") => {
    updateStaffLeave(leave.id, { status });
    toast.success(status === "approved" ? "تم اعتماد الإجازة وربطها بسجل الموظف" : "تم رفض الإجازة وحفظ القرار في سجل الموظف");
  };

  const handleAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const staffId = formData.get("staffId") as string;
    const staff = staffInScope.find(item => item.id === staffId);
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const days = countDays(startDate, endDate);

    if (!staff) {
      toast.error("اختر موظفاً تابعاً للمرحلة الحالية");
      return;
    }
    if (days <= 0) {
      toast.error("تاريخ نهاية الإجازة يجب أن يكون بعد تاريخ البداية");
      return;
    }

    addStaffLeave({
      staffId,
      staffName: staff.name,
      type: formData.get("type") as StaffLeave["type"],
      startDate,
      endDate,
      days,
      status: "pending",
      notes: formData.get("notes") as string,
    });

    toast.success("تم تسجيل طلب الإجازة وإظهاره للمراجعة");
    setShowAdd(false);
    event.currentTarget.reset();
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الموارد البشرية" },
        { label: "طلبات الإجازات" },
      ]}
      actions={
        <button onClick={() => setShowAdd(true)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> طلب إجازة
        </button>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">إجازات الموظفين ({getStageLabel(stage)})</h1>
            <p className="mt-1 text-sm font-bold text-muted-foreground">طلبات الإجازة مرتبطة بموظفي المرحلة النشطة وتنعكس على الرواتب وملف الموظف.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">قيد المراجعة</p>
            <p className="mt-1 text-2xl font-black text-warning">{stats.pending}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">طلبات معتمدة</p>
            <p className="mt-1 text-2xl font-black text-success">{stats.approved}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">طلبات مرفوضة</p>
            <p className="mt-1 text-2xl font-black text-danger">{stats.rejected}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">أيام معتمدة</p>
            <p className="mt-1 text-2xl font-black">{stats.approvedDays}</p>
          </div>
        </div>

        {showAdd && (
          <PageCard title="تسجيل طلب إجازة" className="border-primary/20 bg-primary/5">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">الموظف</label>
                  <select name="staffId" required className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-bold">
                    <option value="">اختر موظفاً...</option>
                    {staffInScope.map(item => (
                      <option key={item.id} value={item.id}>{item.name} - {item.role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">نوع الإجازة</label>
                  <select name="type" required className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-bold">
                    <option value="annual">سنوية</option>
                    <option value="sick">مرضية</option>
                    <option value="emergency">طارئة</option>
                    <option value="unpaid">بدون راتب</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">من</label>
                  <input name="startDate" type="date" required className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">إلى</label>
                  <input name="endDate" type="date" required className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
                </div>
              </div>
              <textarea name="notes" rows={2} placeholder="ملاحظات الطلب..." className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAdd(false)} className="h-9 rounded-lg px-4 text-sm font-bold hover:bg-accent">إلغاء</button>
                <button type="submit" className="h-9 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90">حفظ الطلب</button>
              </div>
            </form>
          </PageCard>
        )}

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="بحث باسم الموظف أو رقم الطلب أو نوع الإجازة..."
                className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold">
              <option value="all">كل الحالات</option>
              <option value="pending">قيد المراجعة</option>
              <option value="approved">معتمدة</option>
              <option value="rejected">مرفوضة</option>
            </select>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold">
              <option value="all">كل الأنواع</option>
              <option value="annual">سنوية</option>
              <option value="sick">مرضية</option>
              <option value="emergency">طارئة</option>
              <option value="unpaid">بدون راتب</option>
            </select>
          </div>
        </div>

        <PageCard>
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">سجل الإجازات والموافقات</h2>
          </div>
          <DataTable
            rows={scopedLeaves}
            columns={[
              { key: "staffName", header: "الموظف", cell: (r) => <span className="font-bold">{r.staffName}</span> },
              { key: "type", header: "نوع الإجازة", cell: (r) => <Badge tone={r.type === "unpaid" ? "danger" : r.type === "sick" ? "info" : "primary"}>{leaveTypeLabels[r.type]}</Badge> },
              { key: "period", header: "الفترة", cell: (r) => <span className="tabular-nums">{r.startDate} إلى {r.endDate}</span> },
              { key: "days", header: "الأيام", cell: (r) => <span className="font-black">{r.days}</span> },
              { key: "notes", header: "ملاحظات", cell: (r) => <span className="text-sm text-muted-foreground">{r.notes || "-"}</span> },
              {
                key: "status",
                header: "الحالة",
                cell: (r) => (
                  <Badge tone={r.status === "approved" ? "success" : r.status === "rejected" ? "danger" : "warning"}>
                    {statusLabels[r.status]}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "القرار",
                cell: (r) => r.status === "pending" ? (
                  <div className="flex gap-2">
                    <button onClick={() => handleDecision(r, "approved")} className="inline-flex items-center gap-1 rounded-md border border-success px-2 py-1 text-xs font-bold text-success hover:bg-success/10">
                      <Check className="h-3 w-3" /> اعتماد
                    </button>
                    <button onClick={() => handleDecision(r, "rejected")} className="inline-flex items-center gap-1 rounded-md border border-danger px-2 py-1 text-xs font-bold text-danger hover:bg-danger/10">
                      <X className="h-3 w-3" /> رفض
                    </button>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
                    {r.status === "approved" ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                    محفوظ
                  </span>
                ),
              },
            ]}
            empty={`لا توجد طلبات إجازة مرتبطة بموظفي ${getStageLabel(stage)}.`}
          />
        </PageCard>
      </div>
    </AppShell>
  );
}
