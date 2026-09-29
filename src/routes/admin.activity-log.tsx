import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { AdminModal } from "@/components/admin/admin-modal";
import {
  Activity,
  Download,
  Search,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Eye,
  Filter,
  X,
  Clock,
  RefreshCcw,
  FileText,
  ArrowLeft,
  ChevronLeft,
  Copy,
  Calendar,
  ShieldAlert,
  Server,
  User,
  Check,
  Archive,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/activity-log")({
  head: () => ({ meta: [{ title: "سجل الأنشطة والتدقيق الأمني | منصة مدارس" }] }),
  component: ActivityLogPage,
});

function getSeverity(action: string): "danger" | "warning" | "success" {
  if (action.includes("فشل") || action.includes("خطأ") || action.includes("أمني")) return "danger";
  if (
    action.includes("حذف") ||
    action.includes("اعتماد") ||
    action.includes("تعديل") ||
    action.includes("استرجاع")
  )
    return "warning";
  return "success";
}

function ActivityLogPage() {
  const { allActivityLogs, addActivityLog } = useGlobalStore();
  const [q, setQ] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detailLog, setDetailLog] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const entities = useMemo(
    () => Array.from(new Set(allActivityLogs.map((log) => log.entity).filter(Boolean))),
    [allActivityLogs]
  );

  const filteredLogs = useMemo(() => {
    const term = q.trim().toLowerCase();
    return allActivityLogs.filter((log) => {
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
      return (
        log.user?.toLowerCase().includes(term) ||
        log.action?.toLowerCase().includes(term) ||
        log.entity?.toLowerCase().includes(term) ||
        log.details?.toLowerCase().includes(term) ||
        log.id?.toLowerCase().includes(term)
      );
    });
  }, [allActivityLogs, entityFilter, q, severityFilter, dateFrom, dateTo]);

  const stats = useMemo(
    () => ({
      total: filteredLogs.length,
      danger: filteredLogs.filter((log) => getSeverity(log.action) === "danger").length,
      warning: filteredLogs.filter((log) => getSeverity(log.action) === "warning").length,
      success: filteredLogs.filter((log) => getSeverity(log.action) === "success").length,
    }),
    [filteredLogs]
  );

  const hasFilters = q || severityFilter !== "all" || entityFilter !== "all" || dateFrom || dateTo;

  const clearFilters = () => {
    setQ("");
    setSeverityFilter("all");
    setEntityFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const handleQuickFilter = (preset: "today" | "critical" | "warning") => {
    if (preset === "today") {
      const todayStr = new Date().toISOString().split("T")[0];
      setDateFrom(todayStr);
      setDateTo(todayStr);
      setSeverityFilter("all");
    } else if (preset === "critical") {
      setSeverityFilter("danger");
      setDateFrom("");
      setDateTo("");
    } else if (preset === "warning") {
      setSeverityFilter("warning");
      setDateFrom("");
      setDateTo("");
    }
  };

  const exportCsv = () => {
    const headers = [
      "معرف السجل",
      "التاريخ والوقت",
      "المستخدم المنفذ",
      "الإجراء",
      "النظام المتأثر",
      "تفاصيل العملية",
      "عنوان IP",
    ];
    const rows = filteredLogs.map((log) => [
      log.id || "",
      new Date(log.date).toLocaleString("ar-EG"),
      log.user || "",
      log.action || "",
      log.entity || "",
      log.details || "",
      log.ip || "192.168.1.1",
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.map((f) => `"${f.replace(/"/g, '""')}"`).join(","))].join(
        "\n"
      );

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `activity-audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير سجل الأنشطة والتدقيق بنجاح");
  };

  const copyDetails = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("تم نسخ التفاصيل إلى الحافظة");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الإدارة والنظام" },
        { label: "سجل الأنشطة والتدقيق الأمني" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-warning/50 bg-warning/10 px-3 text-xs font-bold text-warning-foreground hover:bg-warning/20 transition-colors shadow-sm"
            >
              <X className="h-4 w-4" /> مسح الفلاتر
            </button>
          )}
          <button
            onClick={exportCsv}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all glow-primary"
          >
            <Download className="h-4 w-4" /> تصدير CSV
          </button>
        </div>
      }
    >
      <div className="space-y-5" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary p-3.5 rounded-2xl shadow-inner border border-primary/20">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black">سجل الأنشطة والتدقيق الأمني (Audit Log)</h1>
              <p className="text-xs font-bold text-muted-foreground mt-1">
                تتبع العمليات الحساسة، التعديلات الإدارية، وعمليات الدخول مع تسجيل تفاصيل IP والتاريخ
                بدقة
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "إجمالي السجلات المفحوصة",
              value: stats.total,
              icon: FileText,
              tone: "primary",
              onClick: () => clearFilters(),
            },
            {
              label: "عمليات روتينية وطبيعية",
              value: stats.success,
              icon: CheckCircle2,
              tone: "success",
              onClick: () => setSeverityFilter("success"),
            },
            {
              label: "عمليات حساسة (تعديل / حذف)",
              value: stats.warning,
              icon: AlertTriangle,
              tone: "warning",
              onClick: () => setSeverityFilter("warning"),
            },
            {
              label: "تنبيهات ومخاطر أمنية",
              value: stats.danger,
              icon: ShieldAlert,
              tone: "danger",
              onClick: () => setSeverityFilter("danger"),
            },
          ].map((stat, i) => {
            const StatIcon = stat.icon;
            const toneColors: Record<string, string> = {
              primary: "text-primary bg-primary/10",
              success: "text-success bg-success/10",
              warning: "text-warning-foreground bg-warning/10",
              danger: "text-danger bg-danger/10",
            };
            const valueColors: Record<string, string> = {
              primary: "text-foreground",
              success: "text-success",
              warning: "text-warning-foreground",
              danger: "text-danger",
            };

            return (
              <div
                key={i}
                onClick={stat.onClick}
                className="cursor-pointer rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/40 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`grid h-8 w-8 place-items-center rounded-xl ${
                      toneColors[stat.tone]
                    } transition-transform group-hover:scale-110`}
                  >
                    <StatIcon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">تصفية سريعة</span>
                </div>
                <div
                  className={`text-2xl font-black tabular-nums ${
                    valueColors[stat.tone] || "text-foreground"
                  }`}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 font-bold">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Filter and Search Bar */}
        <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-xs space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="البحث بالاسم، الإجراء، النظام، أو التفاصيل..."
                className="h-10 w-full rounded-xl border border-input bg-background/80 ps-9 pe-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">كافة مستويات الخطورة</option>
              <option value="danger">مخاطر وأخطاء أمنية فقط</option>
              <option value="warning">عمليات حساسة (تعديل / حذف / اعتماد)</option>
              <option value="success">عمليات ناجحة وروتينية</option>
            </select>

            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">كافة الأنظمة والوحدات</option>
              {entities.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background/80 px-2 text-xs font-bold outline-none focus:border-primary"
                title="تاريخ البداية"
              />
              <span className="text-muted-foreground font-bold">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background/80 px-2 text-xs font-bold outline-none focus:border-primary"
                title="تاريخ النهاية"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border/60 flex-wrap">
            <span className="text-xs font-bold text-muted-foreground">فلاتر سريعة:</span>
            <button
              onClick={() => handleQuickFilter("today")}
              className="text-xs font-bold px-3 py-1 rounded-lg border border-border/70 hover:bg-accent transition-colors"
            >
              نشاط اليوم
            </button>
            <button
              onClick={() => handleQuickFilter("critical")}
              className="text-xs font-bold px-3 py-1 rounded-lg border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 transition-colors"
            >
              العمليات الحرجة فقط
            </button>
            <button
              onClick={() => handleQuickFilter("warning")}
              className="text-xs font-bold px-3 py-1 rounded-lg border border-warning/30 text-warning-foreground bg-warning/5 hover:bg-warning/10 transition-colors"
            >
              الحذف والتعديل
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <PageCard title="سجل التدقيق والتتبع الأمني">
          <DataTable
            rows={filteredLogs}
            columns={[
              {
                key: "date",
                header: "التوقيت والتاريخ",
                cell: (r) => (
                  <div>
                    <span className="text-xs font-black text-foreground block tabular-nums" dir="ltr">
                      {new Date(r.date).toLocaleDateString("ar-EG")}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums font-mono" dir="ltr">
                      {new Date(r.date).toLocaleTimeString("ar-EG")}
                    </span>
                  </div>
                ),
              },
              {
                key: "user",
                header: "المستخدم المنفذ",
                cell: (r) => (
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-foreground block">{r.user}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {r.id || "AL-LOG"}
                      </span>
                    </div>
                  </div>
                ),
              },
              {
                key: "action",
                header: "الإجراء",
                cell: (r) => (
                  <Badge tone={getSeverity(r.action)}>
                    {r.action}
                  </Badge>
                ),
              },
              {
                key: "entity",
                header: "الوحدة المتأثرة",
                cell: (r) => (
                  <span className="text-xs font-bold text-foreground px-2 py-0.5 rounded-lg bg-muted/40">
                    {r.entity}
                  </span>
                ),
              },
              {
                key: "details",
                header: "تفاصيل العملية",
                cell: (r) => (
                  <div className="max-w-md truncate text-xs text-muted-foreground font-medium">
                    {r.details}
                  </div>
                ),
              },
              {
                key: "ip",
                header: "عنوان IP",
                cell: (r) => (
                  <span className="text-xs font-mono text-muted-foreground tabular-nums" dir="ltr">
                    {r.ip || "192.168.1.1"}
                  </span>
                ),
              },
              {
                key: "act",
                header: "إجراءات",
                cell: (r) => (
                  <button
                    onClick={() => setDetailLog(r)}
                    className="rounded-xl p-1.5 hover:bg-accent text-muted-foreground hover:text-primary transition-colors border border-transparent hover:border-border"
                    title="عرض كامل التفاصيل"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                ),
              },
            ]}
            empty="لا توجد أنشطة مسجلة مطابقة لمعايير البحث الحالية."
          />
        </PageCard>
      </div>

      {/* ────── Modal: Detail Log ────── */}
      <AdminModal
        isOpen={Boolean(detailLog)}
        onClose={() => setDetailLog(null)}
        title="تفاصيل العملية التدقيقية"
        description={detailLog ? `${detailLog.id || "سجل تدقيق"} • ${detailLog.user}` : ""}
        icon={Activity}
        tone={detailLog ? getSeverity(detailLog.action) : "primary"}
        maxWidth="lg"
        footer={
          detailLog && (
            <div className="flex justify-between items-center w-full">
              <button
                type="button"
                onClick={() => copyDetails(JSON.stringify(detailLog, null, 2))}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "تم نسخ السجل" : "نسخ بيانات السجل (JSON)"}
              </button>
              <button
                type="button"
                onClick={() => setDetailLog(null)}
                className="rounded-xl bg-primary px-6 py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md glow-primary"
              >
                إغلاق
              </button>
            </div>
          )
        }
      >
        {detailLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-[11px] font-bold text-muted-foreground block mb-1">
                  المستخدم المنفذ
                </span>
                <div className="font-black text-sm text-foreground flex items-center gap-1.5">
                  <User className="h-4 w-4 text-primary" /> {detailLog.user}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-[11px] font-bold text-muted-foreground block mb-1">
                  النظام المتأثر
                </span>
                <div className="font-black text-sm text-foreground flex items-center gap-1.5">
                  <Server className="h-4 w-4 text-primary" /> {detailLog.entity}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-muted-foreground">نوع العملية</span>
                <Badge tone={getSeverity(detailLog.action)}>{detailLog.action}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-muted-foreground">التوقيت الدقيق</span>
                <span className="font-bold tabular-nums" dir="ltr">
                  {new Date(detailLog.date).toLocaleString("ar-EG")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-muted-foreground">عنوان IP المتصل</span>
                <span className="font-mono font-bold text-muted-foreground tabular-nums">
                  {detailLog.ip || "192.168.1.1"}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border/70 space-y-2">
              <span className="font-black text-foreground block">بيانات وتفاصيل الحدث:</span>
              <p className="text-xs font-medium leading-relaxed bg-background/60 p-3.5 rounded-lg border border-border/60 text-foreground">
                {detailLog.details}
              </p>
            </div>
          </div>
        )}
      </AdminModal>
    </AppShell>
  );
}
