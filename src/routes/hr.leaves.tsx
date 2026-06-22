import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Calendar, Plus, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/hr/leaves")({
  component: HrLeaves,
});

const mockLeaves = [
  { id: "LV-101", employee: "أحمد المشتريات", type: "إجازة سنوية", from: "2023-10-01", to: "2023-10-15", days: 14, status: "pending" },
  { id: "LV-102", employee: "منى الدوسري", type: "إجازة مرضية", from: "2023-09-18", to: "2023-09-19", days: 2, status: "approved" },
  { id: "LV-103", employee: "عبدالله السائق", type: "إجازة طارئة", from: "2023-09-20", to: "2023-09-20", days: 1, status: "rejected" },
];

function HrLeaves() {
  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الموارد البشرية" },
        { label: "طلبات الإجازات" },
      ]}
      actions={
        <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> طلب إجازة بالنيابة
        </button>
      }
    >
      <div className="space-y-4">
        <PageCard>
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">مراجعة طلبات الإجازة</h2>
          </div>
          <DataTable
            rows={mockLeaves}
            columns={[
              { key: "employee", header: "الموظف", cell: (r) => <span className="font-bold">{r.employee}</span> },
              { key: "type", header: "نوع الإجازة", cell: (r) => r.type },
              { key: "from", header: "من", cell: (r) => r.from },
              { key: "to", header: "إلى", cell: (r) => r.to },
              { key: "days", header: "عدد الأيام", cell: (r) => r.days },
              {
                key: "status",
                header: "الحالة",
                cell: (r) => (
                  <Badge tone={r.status === "approved" ? "success" : r.status === "rejected" ? "danger" : "warning"}>
                    {r.status === "approved" ? "معتمدة" : r.status === "rejected" ? "مرفوضة" : "قيد المراجعة"}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "اتخاذ إجراء",
                cell: (r) => (
                  r.status === "pending" ? (
                    <div className="flex gap-2">
                      <button onClick={() => toast.success("تم اعتماد الإجازة")} className="rounded-md border border-success text-success px-2 py-1 text-xs hover:bg-success/10 font-bold">
                        <Check className="h-3 w-3 inline mr-1" /> اعتماد
                      </button>
                      <button onClick={() => toast.error("تم رفض الإجازة")} className="rounded-md border border-danger text-danger px-2 py-1 text-xs hover:bg-danger/10 font-bold">
                        <X className="h-3 w-3 inline mr-1" /> رفض
                      </button>
                    </div>
                  ) : <span className="text-xs text-muted-foreground">تم اتخاذ إجراء</span>
                ),
              },
            ]}
          />
        </PageCard>
      </div>
    </AppShell>
  );
}
