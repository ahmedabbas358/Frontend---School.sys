import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore, StaffAttendanceRecord } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { Clock, Download, Check, X, Printer, CalendarDays, Filter, TrendingDown, AlertTriangle, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { toast } from "sonner";

export const Route = createFileRoute("/hr/attendance")({
  head: () => ({ meta: [{ title: "حضور وانصراف الموظفين | منصة مدارس" }] }),
  component: HrAttendance,
});

type Status = StaffAttendanceRecord["status"];

const statusLabels: Record<Status, string> = {
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  excused: "بعذر",
};

const statusTone: Record<Status, "success" | "danger" | "warning" | "info"> = {
  present: "success",
  absent: "danger",
  late: "warning",
  excused: "info",
};

function isoToday() {
  return new Date().toISOString().split("T")[0];
}

function getDateSpan(startDate: string, endDate: string) {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return dates;
  for (let d = new Date(start); d <= end && dates.length < 31; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function HrAttendance() {
  const { getStageLabel, stage } = useStage();
  const { currency, activeStageStaff, activeStageStaffAttendance, upsertStaffAttendance } = useGlobalStore();
  const defaultDate = activeStageStaffAttendance[0]?.date || isoToday();
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");
  const [dailyDate, setDailyDate] = useState(defaultDate);
  const [dateRange, setDateRange] = useState({ start: defaultDate, end: defaultDate });
  const [month, setMonth] = useState(defaultDate.slice(0, 7));
  const [q, setQ] = useState("");
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const staffInScope = useMemo(
    () => activeStageStaff.filter(item => !item.isDeleted && item.status !== "terminated"),
    [activeStageStaff]
  );

  const recordsByDay = useMemo(() => {
    const map = new Map<string, StaffAttendanceRecord>();
    activeStageStaffAttendance.forEach(record => map.set(`${record.staffId}-${record.date}`, record));
    return map;
  }, [activeStageStaffAttendance]);

  const filteredStaff = useMemo(() => {
    const term = q.trim();
    if (!term) return staffInScope;
    return staffInScope.filter(item => item.name.includes(term) || item.role.includes(term) || item.department.includes(term) || item.id.includes(term));
  }, [q, staffInScope]);

  const dailyRows = useMemo(() => {
    return filteredStaff.map(staff => {
      const record = recordsByDay.get(`${staff.id}-${dailyDate}`);
      const status: Status = record?.status || "absent";
      return {
        ...staff,
        checkIn: record?.checkIn || "--:--",
        checkOut: record?.checkOut || "--:--",
        status,
        minutesLate: record?.minutesLate || 0,
        deductionAmount: record?.deductionAmount || 0,
        notes: record?.notes || "",
      };
    });
  }, [dailyDate, filteredStaff, recordsByDay]);

  const markAttendance = (staffId: string, status: Status) => {
    const staff = staffInScope.find(item => item.id === staffId);
    if (!staff) return;
    const dailyRate = Math.round((staff.basicSalary || 0) / 30);
    const lateMinutes = status === "late" ? 30 : 0;
    const deductionAmount = status === "absent" ? dailyRate : status === "late" ? lateMinutes * 2 : 0;

    upsertStaffAttendance({
      staffId,
      date: dailyDate,
      checkIn: status === "absent" ? undefined : status === "late" ? "07:30" : "07:00",
      checkOut: status === "absent" ? undefined : "14:30",
      status,
      minutesLate: lateMinutes,
      deductionAmount,
      notes: status === "excused" ? "غياب أو تأخير بعذر" : undefined,
    });
    toast.success(`تم تسجيل ${staff.name}: ${statusLabels[status]}`);
  };

  const weekDays = useMemo(() => getDateSpan(dateRange.start, dateRange.end), [dateRange]);

  const monthlyRows = useMemo(() => {
    return filteredStaff.map(staff => {
      const records = activeStageStaffAttendance.filter(record => record.staffId === staff.id && record.date.startsWith(month));
      const present = records.filter(record => record.status === "present").length;
      const absent = records.filter(record => record.status === "absent").length;
      const late = records.filter(record => record.status === "late").length;
      const excused = records.filter(record => record.status === "excused").length;
      const lateMinutes = records.reduce((sum, record) => sum + (record.minutesLate || 0), 0);
      const deduction = records.reduce((sum, record) => sum + (record.deductionAmount || 0), 0);
      return { ...staff, present, absent, late, excused, lateMinutes, deduction };
    });
  }, [activeStageStaffAttendance, filteredStaff, month]);

  const totals = useMemo(() => ({
    absent: monthlyRows.reduce((sum, item) => sum + item.absent, 0),
    lateMinutes: monthlyRows.reduce((sum, item) => sum + item.lateMinutes, 0),
    deduction: monthlyRows.reduce((sum, item) => sum + item.deduction, 0),
  }), [monthlyRows]);

  const printTemplates: PrintTemplate[] = [
    {
      id: "attendance_report",
      name: "تقرير حضور الموظفين",
      category: "شؤون الموظفين",
      type: "table",
      columns: [
        { key: "id", label: "الرقم الوظيفي" },
        { key: "name", label: "الاسم" },
        { key: "department", label: "القسم" },
        { key: "checkIn", label: "وقت الحضور" },
        { key: "checkOut", label: "وقت الانصراف" },
        { key: "status", label: "الحالة", render: (r) => statusLabels[r.status as Status] },
        { key: "deductionAmount", label: "الأثر المالي" },
      ],
    }
  ];

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الموارد البشرية" }, { label: "الحضور والانصراف" }]}
      actions={
        <div className="flex gap-2">
          <button onClick={() => setIsPrintOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm hover:bg-accent font-bold shadow-sm">
            <Printer className="h-4 w-4" /> طباعة السجل
          </button>
          <button onClick={() => toast.info("سيتم تحليل ملف البصمة وربطه بالموظفين عند تفعيل الاستيراد")} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 text-sm hover:bg-primary/90 font-bold shadow-sm">
            <Download className="h-4 w-4" /> استيراد بصمة
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black">حضور وانصراف الموظفين ({getStageLabel(stage)})</h1>
            <p className="mt-1 text-sm font-bold text-muted-foreground">سجل يومي متزامن مع الرواتب وملفات الموظفين، مع أثر مالي واضح للغياب والتأخير.</p>
          </div>
          <div className="flex rounded-xl border border-border bg-card p-1 shadow-sm">
            {[
              { id: "daily", label: "يومي" },
              { id: "weekly", label: "أسبوعي" },
              { id: "monthly", label: "شهري وخصومات" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`h-9 rounded-lg px-4 text-sm font-bold transition-all ${activeTab === tab.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="بحث باسم الموظف أو القسم أو الرقم الوظيفي..."
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>

        {activeTab === "daily" && (
          <PageCard>
            <div className="mb-4 flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-primary">
                <Clock className="h-5 w-5" />
                <h2 className="text-lg font-bold">رصد اليوم</h2>
              </div>
              <input
                type="date"
                value={dailyDate}
                onChange={event => setDailyDate(event.target.value)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold outline-none focus:border-primary"
              />
            </div>

            <DataTable
              rows={dailyRows}
              columns={[
                { key: "id", header: "الرقم", cell: (r) => <span className="font-bold text-muted-foreground">{r.employeeNo || r.id}</span> },
                { key: "name", header: "الموظف", cell: (r) => <div><span className="font-bold">{r.name}</span><div className="text-xs text-muted-foreground">{r.role} - {r.department}</div></div> },
                { key: "checkIn", header: "الحضور", cell: (r) => <span className={r.status === "late" ? "font-bold text-warning" : "tabular-nums"}>{r.checkIn}</span> },
                { key: "checkOut", header: "الانصراف", cell: (r) => <span className="tabular-nums">{r.checkOut}</span> },
                { key: "minutesLate", header: "التأخير", cell: (r) => r.minutesLate ? <span className="font-bold text-warning">{r.minutesLate} د</span> : "-" },
                { key: "deductionAmount", header: "الأثر المالي", cell: (r) => r.deductionAmount ? <span className="font-bold text-danger">{r.deductionAmount.toLocaleString()} {currency}</span> : <span className="text-success">لا يوجد</span> },
                {
                  key: "status",
                  header: "الحالة",
                  cell: (r) => <Badge tone={statusTone[r.status as Status]}>{statusLabels[r.status as Status]}</Badge>,
                },
                {
                  key: "actions",
                  header: "تعديل سريع",
                  cell: (r) => (
                    <div className="flex gap-1">
                      <button onClick={() => markAttendance(r.id, "present")} className="rounded-md p-1.5 text-success hover:bg-success/10" title="حاضر"><Check className="h-4 w-4" /></button>
                      <button onClick={() => markAttendance(r.id, "late")} className="rounded-md p-1.5 text-warning hover:bg-warning/10" title="متأخر"><Clock className="h-4 w-4" /></button>
                      <button onClick={() => markAttendance(r.id, "excused")} className="rounded-md p-1.5 text-info hover:bg-info/10" title="بعذر"><ShieldCheck className="h-4 w-4" /></button>
                      <button onClick={() => markAttendance(r.id, "absent")} className="rounded-md p-1.5 text-danger hover:bg-danger/10" title="غائب"><X className="h-4 w-4" /></button>
                    </div>
                  ),
                },
              ]}
              empty={`لا يوجد موظفون في ${getStageLabel(stage)}.`}
            />
          </PageCard>
        )}

        {activeTab === "weekly" && (
          <PageCard>
            <div className="mb-4 flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-primary">
                <CalendarDays className="h-5 w-5" />
                <h2 className="text-lg font-bold">التتبع الأسبوعي</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input type="date" value={dateRange.start} onChange={event => setDateRange(prev => ({ ...prev, start: event.target.value }))} className="h-9 rounded-lg border border-input bg-background px-3 text-sm" />
                <input type="date" value={dateRange.end} onChange={event => setDateRange(prev => ({ ...prev, end: event.target.value }))} className="h-9 rounded-lg border border-input bg-background px-3 text-sm" />
                <button className="grid h-9 w-9 place-items-center rounded-lg bg-muted hover:bg-accent" title="تطبيق الفلتر"><Filter className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-right text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 font-bold">الموظف</th>
                    {weekDays.map(day => <th key={day} className="px-4 py-3 text-center font-bold tabular-nums">{day}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStaff.map(staff => (
                    <tr key={staff.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-bold">
                        {staff.name}
                        <div className="text-xs font-normal text-muted-foreground">{staff.department}</div>
                      </td>
                      {weekDays.map(day => {
                        const record = recordsByDay.get(`${staff.id}-${day}`);
                        const status: Status = record?.status || "absent";
                        return (
                          <td key={day} className="px-4 py-3 text-center">
                            <Badge tone={statusTone[status]}>{statusLabels[status]}</Badge>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PageCard>
        )}

        {activeTab === "monthly" && (
          <PageCard>
            <div className="mb-4 flex flex-col items-start justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-danger">
                <TrendingDown className="h-5 w-5" />
                <h2 className="text-lg font-bold">التقرير الشهري والتأثير المالي</h2>
              </div>
              <input type="month" value={month} onChange={event => setMonth(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold" />
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="mb-1 text-xs font-bold text-muted-foreground">أيام الغياب المسجلة</div>
                <div className="text-3xl font-black text-danger">{totals.absent}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="mb-1 text-xs font-bold text-muted-foreground">إجمالي دقائق التأخير</div>
                <div className="text-3xl font-black text-warning">{totals.lateMinutes}</div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="mb-1 text-xs font-bold text-muted-foreground">خصومات مرشحة للرواتب</div>
                <div className="text-3xl font-black">{totals.deduction.toLocaleString()} <span className="text-sm">{currency}</span></div>
              </div>
            </div>

            <DataTable
              rows={monthlyRows}
              columns={[
                { key: "name", header: "الموظف", cell: (r) => <div><span className="font-bold">{r.name}</span><div className="text-xs text-muted-foreground">{r.department}</div></div> },
                { key: "present", header: "حضور", cell: (r) => <span className="font-bold text-success">{r.present}</span> },
                { key: "absent", header: "غياب", cell: (r) => r.absent ? <span className="font-bold text-danger">{r.absent}</span> : "-" },
                { key: "late", header: "تأخير", cell: (r) => r.late ? <span className="font-bold text-warning">{r.late} مرة / {r.lateMinutes} د</span> : "-" },
                { key: "excused", header: "بعذر", cell: (r) => r.excused ? <span className="font-bold text-info">{r.excused}</span> : "-" },
                { key: "deduction", header: "الأثر على الراتب", cell: (r) => r.deduction ? <span className="inline-flex items-center gap-1 font-bold text-danger"><AlertTriangle className="h-3 w-3" /> {r.deduction.toLocaleString()} {currency}</span> : <span className="text-success">لا يوجد خصم</span> },
              ]}
            />
          </PageCard>
        )}
      </div>

      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title={`سجل حضور وانصراف الموظفين - ${getStageLabel(stage)}`}
        subtitle={`التاريخ: ${dailyDate}`}
        data={dailyRows}
        templates={printTemplates}
      />
    </AppShell>
  );
}
