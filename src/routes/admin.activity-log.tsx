import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { Activity, Download, Search, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/activity-log")({
  head: () => ({ meta: [{ title: "سجل الأنشطة | منصة مدارس" }] }),
  component: ActivityLogPage,
});

function getSeverity(action: string) {
  if (action.includes("فشل") || action.includes("خطأ")) return "danger";
  if (action.includes("حذف") || action.includes("اعتماد")) return "warning";
  return "success";
}

function ActivityLogPage() {
  const { allActivityLogs } = useGlobalStore();
  const [q, setQ] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const entities = useMemo(() => Array.from(new Set(allActivityLogs.map(log => log.entity).filter(Boolean))), [allActivityLogs]);
  const filteredLogs = useMemo(() => {
    const term = q.trim();
    return allActivityLogs.filter(log => {
      const severity = getSeverity(log.action);
      if (severityFilter !== "all" && severity !== severityFilter) return false;
      if (entityFilter !== "all" && log.entity !== entityFilter) return false;
      
      if (dateFrom && new Date(log.date) < new Date(dateFrom)) return false;
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setDate(toDate.getDate() + 1);
        if (new Date(log.date) >= toDate) return false;
      }

      if (!term) return true;
      return log.user.includes(term) || log.action.includes(term) || log.entity.includes(term) || log.details.includes(term) || log.id.includes(term);
    });
  }, [allActivityLogs, entityFilter, q, severityFilter, dateFrom, dateTo]);

  const stats = useMemo(() => ({
    total: filteredLogs.length,
    danger: filteredLogs.filter(log => getSeverity(log.action) === "danger").length,
    warning: filteredLogs.filter(log => getSeverity(log.action) === "warning").length,
    success: filteredLogs.filter(log => getSeverity(log.action) === "success").length,
  }), [filteredLogs]);

  const exportCsv = () => {
    const header = ["id", "date", "user", "action", "entity", "details", "ip"];
    const rows = filteredLogs.map(log => header.map(key => `"${String((log as any)[key] || "").replace(/"/g, '""')}"`).join(","));
    const blob = new Blob(["\uFEFF" + header.join(",") + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "admin-activity-log.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("تم تجهيز ملف سجل الأنشطة");
  };

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الإدارة العامة" }, { label: "سجل الأنشطة" }]}
      actions={
        <button onClick={exportCsv} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          <Download className="h-4 w-4" /> تصدير CSV
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">سجل الأنشطة والتدقيق</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">تتبع العمليات الحساسة والتعديلات مع فلاتر مناسبة للتحقيقات.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm"><p className="text-xs font-bold text-muted-foreground">النتائج</p><p className="mt-1 text-2xl font-black">{stats.total}</p></div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm"><p className="text-xs font-bold text-muted-foreground">طبيعية</p><p className="mt-1 text-2xl font-black text-success">{stats.success}</p></div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm"><p className="text-xs font-bold text-muted-foreground">تحتاج مراجعة</p><p className="mt-1 text-2xl font-black text-warning">{stats.warning}</p></div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm"><p className="text-xs font-bold text-muted-foreground">أخطاء/فشل</p><p className="mt-1 text-2xl font-black text-danger">{stats.danger}</p></div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={event => setQ(event.target.value)} placeholder="بحث بالمستخدم أو العملية أو التفاصيل..." className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
            </div>
            <select value={severityFilter} onChange={event => setSeverityFilter(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold">
              <option value="all">كل الخطورة</option>
              <option value="success">طبيعية</option>
              <option value="warning">تحتاج مراجعة</option>
              <option value="danger">أخطاء/فشل</option>
            </select>
            <select value={entityFilter} onChange={event => setEntityFilter(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold">
              <option value="all">كل الأنظمة</option>
              {entities.map(entity => <option key={entity} value={entity}>{entity}</option>)}
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">من تاريخ</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">إلى تاريخ</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
            </div>
          </div>
        </div>

        <PageCard>
          <DataTable
            rows={filteredLogs}
            pageSize={50}
            density="compact"
            columns={[
              { key: "id", header: "رقم العملية", cell: (r) => <span className="text-xs font-bold text-muted-foreground">{r.id}</span> },
              { key: "date", header: "التاريخ والوقت", cell: (r) => <div className="text-xs tabular" dir="ltr">{new Date(r.date).toLocaleString("ar-EG")}</div> },
              { key: "user", header: "المستخدم", cell: (r) => <div className="font-bold">{r.user}</div> },
              { key: "action", header: "نوع العملية", cell: (r) => {
                const severity = getSeverity(r.action);
                return (
                  <Badge tone={severity === "danger" ? "danger" : severity === "warning" ? "warning" : "success"}>
                    {severity === "danger" ? <AlertTriangle className="h-3 w-3" /> : severity === "warning" ? <Trash2 className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                    {r.action}
                  </Badge>
                );
              } },
              { key: "entity", header: "النظام المتأثر", cell: (r) => r.entity },
              { key: "details", header: "التفاصيل", cell: (r) => <div className="max-w-[300px] truncate text-xs" title={r.details}>{r.details}</div> },
              { key: "ip", header: "عنوان IP", cell: (r) => <span className="text-xs text-muted-foreground tabular">{r.ip || "192.168.1.1"}</span> },
            ]}
            empty="لا توجد أنشطة مطابقة للفلاتر."
          />
        </PageCard>
      </div>
    </AppShell>
  );
}
