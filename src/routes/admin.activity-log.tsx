import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { Activity, Download, Filter } from "lucide-react";

export const Route = createFileRoute("/admin/activity-log")({
  head: () => ({ meta: [{ title: "سجل الأنشطة | منصة مدارس" }] }),
  component: ActivityLogPage,
});

function ActivityLogPage() {
  const { allActivityLogs } = useGlobalStore();

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الإدارة العامة" }, { label: "سجل الأنشطة" }]}
      actions={
        <div className="flex gap-2">
           <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-bold hover:bg-accent">
            <Filter className="h-4 w-4" /> تصفية السجل
          </button>
          <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
            <Download className="h-4 w-4" /> تصدير (CSV)
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">سجل الأنشطة (Audit Log)</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">تتبع كافة العمليات والتعديلات التي تمت على النظام</p>
          </div>
        </div>

        <PageCard>
          <DataTable
            rows={allActivityLogs}
            columns={[
              { key: "id", header: "رقم العملية", cell: (r) => <span className="text-xs font-bold text-muted-foreground">{r.id}</span> },
              { key: "date", header: "التاريخ والوقت", cell: (r) => (
                <div className="text-xs tabular" dir="ltr">
                  {new Date(r.date).toLocaleString("ar-EG")}
                </div>
              )},
              { key: "user", header: "المستخدم", cell: (r) => <div className="font-bold">{r.user}</div> },
              { key: "action", header: "نوع العملية", cell: (r) => (
                 <span className={`px-2 py-1 rounded-md text-xs font-bold ${r.action.includes('فشل') || r.action.includes('خطأ') ? 'bg-danger/10 text-danger' : r.action.includes('حذف') ? 'bg-warning/10 text-warning-foreground' : 'bg-success/10 text-success'}`}>
                   {r.action}
                 </span>
              )},
              { key: "entity", header: "النظام المتأثر", cell: (r) => r.entity },
              { key: "details", header: "التفاصيل", cell: (r) => <div className="text-xs truncate max-w-[250px]" title={r.details}>{r.details}</div> },
              { key: "ip", header: "عنوان IP", cell: (r) => <span className="text-xs text-muted-foreground tabular">{r.ip || "192.168.1.1"}</span> },
            ]}
            empty="لا توجد أنشطة مسجلة"
          />
        </PageCard>
      </div>
    </AppShell>
  );
}
