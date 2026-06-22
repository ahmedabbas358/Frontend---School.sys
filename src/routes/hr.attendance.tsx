import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Clock, Download, Check, X, Printer, CalendarDays, Filter, TrendingDown, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { toast } from "sonner";

export const Route = createFileRoute("/hr/attendance")({
  head: () => ({ meta: [{ title: "حضور وانصراف الموظفين | منصة مدارس" }] }),
  component: HrAttendance,
});

type Status = "present" | "absent" | "late" | "excused";

const mockStaff = [
  { id: "EMP-001", name: "سعيد القحطاني", department: "الإدارة", role: "مدير" },
  { id: "EMP-002", name: "خالد المطيري", department: "الأمن", role: "حارس أمن" },
  { id: "EMP-003", name: "منى الدوسري", department: "المالية", role: "محاسبة" },
  { id: "EMP-004", name: "أحمد العتيبي", department: "التدريس", role: "معلم رياضيات" },
  { id: "EMP-005", name: "سارة الزهراني", department: "التدريس", role: "معلمة لغة إنجليزية" },
];

function HrAttendance() {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");
  const [dateRange, setDateRange] = useState({ start: "2023-09-20", end: "2023-09-26" });
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Daily State
  const [dailyDate, setDailyDate] = useState("2023-09-20");
  const [marks, setMarks] = useState<Record<string, { in: string; out: string; st: Status }>>({
    "EMP-001": { in: "07:05 AM", out: "02:30 PM", st: "present" },
    "EMP-002": { in: "06:00 AM", out: "03:00 PM", st: "present" },
    "EMP-003": { in: "--:--", out: "--:--", st: "absent" },
    "EMP-004": { in: "07:30 AM", out: "02:00 PM", st: "late" },
  });

  const dailyRows = useMemo(() => mockStaff.map(s => {
    const rec = marks[s.id] || { in: "--:--", out: "--:--", st: "absent" };
    return { ...s, checkIn: rec.in, checkOut: rec.out, status: rec.st };
  }), [marks]);

  const printTemplates: PrintTemplate[] = [
    {
      id: "attendance_report", name: "تقرير حضور الموظفين", category: "شؤون الموظفين", type: "table",
      columns: [
        { key: "id", label: "الرقم الوظيفي" },
        { key: "name", label: "الاسم" },
        { key: "department", label: "القسم" },
        { key: "checkIn", label: "وقت الحضور" },
        { key: "checkOut", label: "وقت الانصراف" },
        { key: "status", label: "الحالة", render: (r) => {
           if(r.status === 'present') return 'حاضر';
           if(r.status === 'late') return 'متأخر';
           if(r.status === 'excused') return 'بعذر';
           return 'غائب';
        } },
      ]
    }
  ];

  const handleSaveDaily = () => toast.success("تم رصد وحفظ حضور اليوم بنجاح وربطه بالرواتب.");

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الموارد البشرية" }, { label: "الحضور والانصراف" }]}
      actions={
        <div className="flex gap-2">
          <button onClick={() => setIsPrintOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm hover:bg-accent font-bold shadow-sm">
            <Printer className="h-4 w-4" /> طباعة السجل
          </button>
          <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 text-sm hover:bg-primary/90 font-bold shadow-sm">
            <Download className="h-4 w-4" /> استيراد بصمة (Excel/CSV)
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-end">
          <div>
            <h1 className="text-2xl font-black">إدارة الحضور والانصراف للموظفين</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">متابعة دقيقة لأوقات العمل وارتباط آلي بنظام الرواتب</p>
          </div>
          <div className="flex rounded-xl border border-border bg-card p-1 shadow-sm">
            {[
              { id: "daily", label: "يومي" },
              { id: "weekly", label: "أسبوعي" },
              { id: "monthly", label: "شهري / خصومات" }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                  activeTab === t.id ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent text-muted-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "daily" && (
          <PageCard>
            <div className="mb-4 flex flex-col sm:flex-row items-center justify-between border-b border-border pb-4 gap-4">
              <div className="flex items-center gap-2 text-primary">
                <Clock className="h-5 w-5" />
                <h2 className="text-lg font-bold">سجل الحضور اليومي</h2>
              </div>
              <div className="flex items-center gap-3">
                 <input 
                   type="date" 
                   value={dailyDate}
                   onChange={e => setDailyDate(e.target.value)}
                   className="rounded-lg border border-input px-3 py-2 text-sm outline-none focus:border-primary font-bold" 
                 />
                 <button onClick={handleSaveDaily} className="bg-success text-success-foreground px-4 py-2 rounded-lg text-sm font-bold hover:bg-success/90 transition-colors shadow-sm">
                    حفظ الرصد
                 </button>
              </div>
            </div>

            <DataTable
              rows={dailyRows}
              columns={[
                { key: "id", header: "الرقم", cell: (r) => <span className="font-medium text-muted-foreground">{r.id}</span> },
                { key: "name", header: "الاسم", cell: (r) => <span className="font-bold">{r.name}</span> },
                { key: "department", header: "القسم", cell: (r) => r.department },
                { key: "checkIn", header: "وقت الحضور", cell: (r) => <span className={r.status === 'late' ? 'text-warning font-bold' : ''}>{r.checkIn}</span> },
                { key: "checkOut", header: "وقت الانصراف", cell: (r) => r.checkOut },
                {
                  key: "status",
                  header: "الحالة",
                  cell: (r) => (
                    <Badge tone={r.status === "present" ? "success" : r.status === "late" ? "warning" : r.status === "excused" ? "info" : "danger"}>
                      {r.status === "present" ? "حاضر" : r.status === "late" ? "متأخر" : r.status === "excused" ? "بعذر" : "غائب"}
                    </Badge>
                  ),
                },
                {
                  key: "actions",
                  header: "تعديل السجل",
                  cell: (r) => (
                    <div className="flex gap-1">
                      <button onClick={() => setMarks(m => ({...m, [r.id]: { in: "07:00 AM", out: "02:30 PM", st: "present" }}))} className="rounded-md p-1.5 text-success hover:bg-success/10" title="تسجيل كحاضر"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setMarks(m => ({...m, [r.id]: { in: "--:--", out: "--:--", st: "absent" }}))} className="rounded-md p-1.5 text-danger hover:bg-danger/10" title="تسجيل كغائب"><X className="h-4 w-4" /></button>
                    </div>
                  ),
                },
              ]}
            />
          </PageCard>
        )}

        {activeTab === "weekly" && (
          <PageCard>
            <div className="mb-4 flex flex-col sm:flex-row items-center justify-between border-b border-border pb-4 gap-4">
              <div className="flex items-center gap-2 text-primary">
                <CalendarDays className="h-5 w-5" />
                <h2 className="text-lg font-bold">التتبع الأسبوعي</h2>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-sm font-bold text-muted-foreground">من</span>
                 <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="rounded-lg border border-input px-3 py-1.5 text-sm" />
                 <span className="text-sm font-bold text-muted-foreground">إلى</span>
                 <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="rounded-lg border border-input px-3 py-1.5 text-sm" />
                 <button className="bg-muted px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-accent"><Filter className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                 <thead className="bg-muted/50 border-b border-border">
                   <tr>
                     <th className="px-4 py-3 font-bold">الموظف</th>
                     {['الأحد 20', 'الاثنين 21', 'الثلاثاء 22', 'الأربعاء 23', 'الخميس 24'].map(d => <th key={d} className="px-4 py-3 font-bold text-center">{d}</th>)}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border">
                   {mockStaff.map(s => (
                     <tr key={s.id} className="hover:bg-muted/30">
                       <td className="px-4 py-3 font-bold">{s.name}</td>
                       <td className="px-4 py-3 text-center"><Badge tone="success">حاضر</Badge></td>
                       <td className="px-4 py-3 text-center"><Badge tone="warning">متأخر</Badge></td>
                       <td className="px-4 py-3 text-center"><Badge tone="success">حاضر</Badge></td>
                       <td className="px-4 py-3 text-center"><Badge tone="danger">غائب</Badge></td>
                       <td className="px-4 py-3 text-center"><Badge tone="info">بعذر</Badge></td>
                     </tr>
                   ))}
                 </tbody>
              </table>
            </div>
          </PageCard>
        )}

        {activeTab === "monthly" && (
          <PageCard>
            <div className="mb-4 flex items-center gap-2 text-danger border-b border-border pb-4">
              <TrendingDown className="h-5 w-5" />
              <h2 className="text-lg font-bold">التقرير الشهري والتأثير المالي (الخصومات)</h2>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3 mb-6">
               <div className="border border-border rounded-xl p-4 bg-muted/20">
                 <div className="text-xs font-bold text-muted-foreground mb-1">إجمالي أيام الغياب (هذا الشهر)</div>
                 <div className="text-3xl font-black text-danger">18 <span className="text-sm">يوم مجمع</span></div>
               </div>
               <div className="border border-border rounded-xl p-4 bg-muted/20">
                 <div className="text-xs font-bold text-muted-foreground mb-1">إجمالي دقائق التأخير</div>
                 <div className="text-3xl font-black text-warning">450 <span className="text-sm">دقيقة</span></div>
               </div>
               <div className="border border-border rounded-xl p-4 bg-muted/20">
                 <div className="text-xs font-bold text-muted-foreground mb-1">الخصومات المتوقعة</div>
                 <div className="text-3xl font-black text-foreground">3,250 <span className="text-sm">ر.س</span></div>
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right border border-border rounded-lg">
                 <thead className="bg-muted border-b border-border">
                   <tr>
                     <th className="px-4 py-3 font-bold">الموظف</th>
                     <th className="px-4 py-3 font-bold">أيام الحضور</th>
                     <th className="px-4 py-3 font-bold">أيام الغياب (بدون عذر)</th>
                     <th className="px-4 py-3 font-bold">دقائق التأخير</th>
                     <th className="px-4 py-3 font-bold">التأثير على الراتب</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border">
                   {mockStaff.map((s, i) => {
                     const absentDays = i === 2 ? 3 : i === 0 ? 0 : 1;
                     const delayMins = i === 3 ? 120 : i * 15;
                     const deduction = (absentDays * 350) + (delayMins * 2);
                     return (
                       <tr key={s.id} className="hover:bg-muted/30">
                         <td className="px-4 py-3 font-bold">{s.name} <div className="text-xs text-muted-foreground font-normal">{s.department}</div></td>
                         <td className="px-4 py-3 font-bold text-success">{22 - absentDays} يوم</td>
                         <td className="px-4 py-3 font-bold text-danger">{absentDays > 0 ? `${absentDays} يوم` : '-'}</td>
                         <td className="px-4 py-3 font-bold text-warning">{delayMins > 0 ? `${delayMins} دقيقة` : '-'}</td>
                         <td className="px-4 py-3 font-bold">
                           {deduction > 0 ? (
                             <span className="flex items-center gap-1 text-danger">
                               <AlertTriangle className="h-3 w-3" /> خصم {deduction} ر.س
                             </span>
                           ) : (
                             <span className="text-success">لا يوجد خصومات</span>
                           )}
                         </td>
                       </tr>
                     )
                   })}
                 </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 shadow-sm transition-all">
                اعتماد التقرير الشهري وترحيله لمسير الرواتب
              </button>
            </div>
          </PageCard>
        )}

      </div>

      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title="سجل حضور وانصراف الموظفين"
        subtitle={`التاريخ: ${dailyDate}`}
        data={dailyRows}
        templates={printTemplates}
      />
    </AppShell>
  );
}
