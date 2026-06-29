import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import {
  Users,
  UserCog,
  Layers3,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  CalendarRange,
  Plus,
  ArrowLeft,
  Megaphone,
  CheckCircle2,
  ClipboardCheck,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم | منصة مدارس" },
      { name: "description", content: "نظرة شاملة على المدرسة: الطلاب، الحضور، الاختبارات وأداء المعلمين." },
    ],
  }),
  component: DashboardPage,
});

const PALETTE = ["#2563EB", "#22C55E", "#F59E0B", "#EF4444", "#0EA5E9", "#A855F7", "#14B8A6", "#F97316"];

const attendanceTrend = [
  { m: "سبتمبر", rate: 96 },
  { m: "أكتوبر", rate: 95 },
  { m: "نوفمبر", rate: 93 },
  { m: "ديسمبر", rate: 94 },
  { m: "يناير", rate: 92 },
  { m: "فبراير", rate: 95 },
  { m: "مارس", rate: 97 },
];

const examPerf = [
  { name: "الرياضيات", avg: 82 },
  { name: "العربية", avg: 88 },
  { name: "الإنجليزية", avg: 75 },
  { name: "العلوم", avg: 80 },
  { name: "الاجتماعية", avg: 84 },
];

function Stat({
  icon: Icon,
  label,
  value,
  delta,
  tone = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  delta?: string;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const t: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    danger: "bg-danger/10 text-danger",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${t[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {delta && <span className="text-xs font-bold text-success">{delta}</span>}
      </div>
      <div className="mt-4 text-2xl font-extrabold tabular">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function DashboardPage() {
  const { allStudents, allStaff, allSections, allSubjects, allExams, allExamTypes } = useGlobalStore();
  const teachers = allStaff.filter(s => s.role === "Teacher");

  const gradeDist = Array.from(
    allStudents.reduce((acc, s) => {
      acc.set(s.grade, (acc.get(s.grade) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()),
  ).map(([gid, count], i) => ({ name: gid, value: count, fill: PALETTE[i % PALETTE.length] }));

  // In real scenario, teacher's workload could be calculated from sections they teach
  const workload = teachers.map((t) => ({ name: t.name.replace("أ. ", ""), sections: Math.floor(Math.random() * 4) + 1 })).slice(0, 10);

  const absentToday = Math.floor(allStudents.length * 0.05);
  const todayRate = 100 - Math.round((absentToday / Math.max(allStudents.length, 1)) * 100);

  return (
    <AppShell
      title="لوحة التحكم"
      breadcrumb={[{ label: "الرئيسية" }]}
      actions={
        <Link
          to="/students/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> طالب جديد
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Welcome banner */}
        <div className="overflow-hidden rounded-xl bg-blue-600 p-6 text-white shadow-sm">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div>
              <h2 className="text-xl font-extrabold sm:text-2xl">أهلاً بك، أ. أحمد 👋</h2>
              <p className="mt-1 text-sm opacity-90">
                لديك {absentToday} حالة غياب اليوم، ومعدل حضور {todayRate}% — يومٌ ممتاز.
              </p>
            </div>
            <CalendarRange className="hidden h-16 w-16 opacity-30 sm:block" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Stat icon={Users} label="إجمالي الطلاب" value={allStudents.length.toLocaleString("ar-EG")} delta="+٤" tone="primary" />
          <Stat icon={UserCog} label="إجمالي المعلمين" value={teachers.length.toLocaleString("ar-EG")} tone="primary" />
          <Stat icon={Layers3} label="عدد الشُعب" value={allSections.length.toLocaleString("ar-EG")} tone="primary" />
          <Stat icon={BookOpen} label="عدد المواد" value={allSubjects.length.toLocaleString("ar-EG")} tone="primary" />
          <Stat icon={TrendingUp} label="نسبة الحضور اليوم" value={`${todayRate}٪`} delta="+١٪" tone="success" />
          <Stat icon={AlertTriangle} label="غياب اليوم" value={absentToday.toLocaleString("ar-EG")} tone="warning" />
        </div>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PageCard title="اتجاه الحضور الشهري" description="معدل الحضور خلال الفصل الدراسي">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="m" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                    <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                    <Tooltip />
                    <Line type="monotone" dataKey="rate" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </PageCard>
          </div>
          <PageCard title="توزيع الطلاب على الصفوف">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={gradeDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={85}>
                    {gradeDist.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </PageCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <PageCard title="متوسط أداء الاختبارات (٪)">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={examPerf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                  <Tooltip />
                  <Bar dataKey="avg" fill="#2563EB" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </PageCard>
          <PageCard title="عبء التدريس للمعلمين (عدد الشُعب)">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={workload}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} stroke="var(--color-muted-foreground)" />
                  <Tooltip />
                  <Bar dataKey="sections" fill="#22C55E" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </PageCard>
        </div>

        {/* Activity + upcoming exams */}
        <div className="grid gap-4 lg:grid-cols-3">
          <PageCard title="نشاط حديث">
            <ul className="space-y-3">
              {[
                { i: ClipboardCheck, t: "تم رصد حضور الصف أولى/أ", s: "منذ ٥ دقائق", c: "success" as const },
                { i: AlertTriangle, t: "غياب نورة سعد - الحصة الثانية", s: "منذ ١٢ دقيقة", c: "danger" as const },
                { i: BookOpen, t: "تم رفع نتائج الرياضيات للصف الثالث", s: "اليوم ٠٩:٣٠", c: "primary" as const },
                { i: CheckCircle2, t: "تم تسجيل ٤ طلاب جدد", s: "أمس", c: "primary" as const },
              ].map((a, idx) => (
                <li key={idx} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-lg ${
                      a.c === "success" ? "bg-success/15 text-success" : a.c === "danger" ? "bg-danger/15 text-danger" : "bg-primary/15 text-primary"
                    }`}
                  >
                    <a.i className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold">{a.t}</div>
                    <div className="text-xs text-muted-foreground">{a.s}</div>
                  </div>
                </li>
              ))}
            </ul>
          </PageCard>

          <PageCard title="اختبارات قادمة">
            <ul className="divide-y divide-border">
              {allExams.slice(0, 5).map((e: any) => (
                <li key={e.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">{allSubjects.find((s: any) => s.id === e.subjectId)?.name || 'غير معروف'}</div>
                    <div className="text-xs text-muted-foreground">
                      {allExamTypes.find((t: any) => t.id === e.typeId)?.name || 'غير محدد'} — {e.totalMarks || 100} درجة
                    </div>
                  </div>
                  <Badge tone="info">{e.date || 'قريباً'}</Badge>
                </li>
              ))}
            </ul>
            <Link to="/exams" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
              عرض الكل <ArrowLeft className="h-4 w-4" />
            </Link>
          </PageCard>

          <PageCard title="إعلانات">
            <ul className="space-y-3">
              {[
                { t: "اجتماع مجالس الآباء يوم الخميس", d: "للصفوف الابتدائية" },
                { t: "تحديث جدول الاختبارات النصفية", d: "تم نشره صباح اليوم" },
                { t: "إجازة اليوم الوطني", d: "وفق التقويم الدراسي الرسمي" },
              ].map((n, i) => (
                <li key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-warning/20 text-warning-foreground">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{n.t}</div>
                    <div className="text-xs text-muted-foreground">{n.d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </PageCard>
        </div>
      </div>
    </AppShell>
  );
}
