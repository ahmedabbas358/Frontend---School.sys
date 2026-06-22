import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { sections, grades, gradeOf } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertTriangle, TrendingUp, Users, FileWarning } from "lucide-react";

export const Route = createFileRoute("/attendance/reports")({
  head: () => ({ meta: [{ title: "لوحة بيانات غياب الطلاب | منصة مدارس" }] }),
  component: ReportsPage,
});

const trend = [
  { d: "الأسبوع 1", rate: 98 },
  { d: "الأسبوع 2", rate: 96 },
  { d: "الأسبوع 3", rate: 92 },
  { d: "الأسبوع 4", rate: 94 },
];
const byReason = [
  { r: "مرضي", v: 45 },
  { r: "ظرف عائلي", v: 25 },
  { r: "بدون عذر", v: 80 },
  { r: "تأخر دراسي", v: 15 },
];

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];
const pieData = [
  { name: 'حضور كامل', value: 850 },
  { name: 'غياب يوم متفرق', value: 120 },
  { name: 'متجاوز حد الغياب', value: 30 },
];

function ReportsPage() {
  return (
    <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الطلاب" }, { label: "لوحة تحليل الغياب" }]}>
      <div className="space-y-6">
        
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-end border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-black">لوحة بيانات ومؤشرات الحضور</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">تحليل شامل لحضور الطلاب، اكتشاف التسرب الدراسي، وإنذارات الغياب</p>
          </div>
        </div>

        <PageCard>
          <div className="grid gap-3 md:grid-cols-5">
            <input type="search" placeholder="بحث باسم طالب..." className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold" />
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold"><option>كل الصفوف</option>{grades.map((g) => <option key={g.id}>{g.name}</option>)}</select>
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold"><option>كل الشُعب</option>{sections.map((s) => <option key={s.id}>{gradeOf(s.gradeId)?.name}-{s.name}</option>)}</select>
            <input type="date" className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold" />
            <input type="date" className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold" />
          </div>
        </PageCard>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <div className="border border-border rounded-xl p-4 bg-card shadow-sm hover:border-primary/50 transition-all">
            <div className="flex items-center gap-2 text-muted-foreground mb-2"><Users className="w-4 h-4" /> إجمالي الطلاب</div>
            <div className="text-3xl font-black">1,000</div>
          </div>
          <div className="border border-border rounded-xl p-4 bg-success/10 shadow-sm">
            <div className="flex items-center gap-2 text-success mb-2"><TrendingUp className="w-4 h-4" /> متوسط الحضور الشهري</div>
            <div className="text-3xl font-black text-success">94.5%</div>
          </div>
          <div className="border border-border rounded-xl p-4 bg-danger/10 shadow-sm">
            <div className="flex items-center gap-2 text-danger mb-2"><AlertTriangle className="w-4 h-4" /> طلاب تجاوزوا الحد (15 يوم)</div>
            <div className="text-3xl font-black text-danger">30 <span className="text-sm">طالب</span></div>
          </div>
          <div className="border border-border rounded-xl p-4 bg-warning/10 shadow-sm">
            <div className="flex items-center gap-2 text-warning mb-2"><FileWarning className="w-4 h-4" /> إشعارات بانتظار الإصدار</div>
            <div className="text-3xl font-black text-warning">12 <span className="text-sm">إشعار</span></div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <PageCard title="مؤشر الحضور الأسبوعي (هذا الشهر)" className="lg:col-span-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="d" stroke="var(--color-muted-foreground)" />
                  <YAxis domain={[80, 100]} stroke="var(--color-muted-foreground)" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={4} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </PageCard>

          <PageCard title="توزيع حالات الطلاب">
            <div className="h-72">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                     {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                   </Pie>
                   <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                 </PieChart>
               </ResponsiveContainer>
               <div className="flex flex-wrap gap-2 justify-center mt-2">
                 {pieData.map((d, i) => (
                   <div key={d.name} className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                     <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div> {d.name}
                   </div>
                 ))}
               </div>
            </div>
          </PageCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-1">
          <PageCard title="تحليل الغياب حسب الأعذار">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byReason}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="r" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip cursor={{ fill: 'var(--color-muted)', opacity: 0.2 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="v" fill="hsl(var(--destructive))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </PageCard>
        </div>

      </div>
    </AppShell>
  );
}
