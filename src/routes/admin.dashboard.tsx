import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import {
  ShieldCheck,
  Users,
  Activity,
  Shield,
  HardDrive,
  BellRing,
  Settings
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "لوحة الإدارة العامة | منصة مدارس" }] }),
  component: AdminDashboard,
});

const PALETTE = ["#2563EB", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6"];

function StatCard({ icon: Icon, label, value, desc, tone = "primary" }: any) {
  const t: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    danger: "bg-danger/10 text-danger",
    purple: "bg-purple-500/10 text-purple-600",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${t[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 text-2xl font-extrabold tabular">{value}</div>
      <div className="text-sm font-bold mt-1">{label}</div>
      {desc && <div className="text-xs text-muted-foreground mt-1">{desc}</div>}
    </div>
  );
}

function AdminDashboard() {
  const { allActivityLogs, allStudents, allStaff } = useGlobalStore();

  const activeUsers = allStudents.filter(s => s.status === "نشط").length + allStaff.filter(s => s.status === "active" && !s.isDeleted).length;
  const recentLogs = allActivityLogs.slice(0, 5);
  const errorLogs = allActivityLogs.filter(l => l.action.includes("فشل") || l.action.includes("خطأ")).length;

  const rolesDistribution = [
    { name: "مدير نظام", value: 2 },
    { name: "إداري", value: 5 },
    { name: "معلم", value: allStaff.filter(s => s.role === "معلم").length || 30 },
    { name: "ولي أمر", value: 150 },
    { name: "طالب", value: allStudents.length || 500 },
  ];

  // Mock activity trend
  const activityTrend = [
    { day: "السبت", logins: 120 },
    { day: "الأحد", logins: 450 },
    { day: "الإثنين", logins: 480 },
    { day: "الثلاثاء", logins: 470 },
    { day: "الأربعاء", logins: 460 },
    { day: "الخميس", logins: 490 },
    { day: "الجمعة", logins: 90 },
  ];

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الإدارة العامة" }, { label: "لوحة التحكم" }]}
      actions={
        <Link to="/settings" className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          <Settings className="h-4 w-4" /> إعدادات النظام
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">لوحة الإدارة العامة</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">مراقبة أداء النظام والمستخدمين والتحكم بالصلاحيات</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="المستخدمين النشطين" value={activeUsers} desc="طلاب، معلمين، إداريين" tone="primary" />
          <StatCard icon={Activity} label="العمليات اليومية" value={allActivityLogs.length} desc="تسجيل دخول وتعديلات" tone="success" />
          <StatCard icon={Shield} label="تنبيهات أمنية" value={errorLogs} tone={errorLogs > 0 ? "danger" : "success"} />
          <StatCard icon={HardDrive} label="حالة النسخ الاحتياطي" value="محدث" desc="منذ ساعتين" tone="purple" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PageCard title="خريطة نشاط النظام (Activity Heatmap)">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground mb-4">كثافة استخدام النظام خلال الـ 30 يوماً الماضية (اللون الأغمق يعني نشاطاً أعلى).</div>
                <div className="flex gap-1 overflow-x-auto pb-2 custom-scrollbar">
                  {/* Generate 30 columns for days */}
                  {Array.from({ length: 30 }).map((_, colIndex) => (
                    <div key={colIndex} className="flex flex-col gap-1">
                      {/* Generate 7 rows for hours of the day (e.g. 8AM-2PM) */}
                      {Array.from({ length: 7 }).map((_, rowIndex) => {
                         // Randomize intensity for demo
                         const intensity = Math.random();
                         const colorClass = 
                            intensity > 0.8 ? "bg-primary" : 
                            intensity > 0.5 ? "bg-primary/70" : 
                            intensity > 0.2 ? "bg-primary/40" : "bg-primary/10";
                         return (
                           <div 
                             key={rowIndex} 
                             className={`w-4 h-4 rounded-sm ${colorClass} hover:ring-2 ring-primary/50 cursor-pointer transition-all`}
                             title={`يوم ${30 - colIndex} | السعة: ${Math.floor(intensity * 100)}%`}
                           />
                         );
                      })}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4 text-xs font-bold text-muted-foreground justify-end">
                   <span>أقل</span>
                   <div className="flex gap-1">
                     <div className="w-3 h-3 rounded-sm bg-primary/10"></div>
                     <div className="w-3 h-3 rounded-sm bg-primary/40"></div>
                     <div className="w-3 h-3 rounded-sm bg-primary/70"></div>
                     <div className="w-3 h-3 rounded-sm bg-primary"></div>
                   </div>
                   <span>أكثر</span>
                </div>
              </div>
            </PageCard>
          </div>
          <PageCard title="توزيع المستخدمين حسب الأدوار">
             <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={rolesDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} label>
                      {rolesDistribution.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </PageCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
           <PageCard title="سجل الأنشطة الأخير">
             {recentLogs.length > 0 ? (
                <div className="space-y-4">
                  {recentLogs.map(l => (
                    <div key={l.id} className="flex items-center justify-between p-3 border border-border rounded-xl">
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          <Activity className="h-4 w-4 text-primary" /> {l.action}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">بواسطة: {l.user} - {l.entity}</div>
                      </div>
                      <div className="text-xs tabular text-muted-foreground">{new Date(l.date).toLocaleString("ar-EG")}</div>
                    </div>
                  ))}
                  <Link to="/admin/activity-log" className="inline-flex items-center text-sm font-bold text-primary hover:underline">
                    عرض السجل الكامل
                  </Link>
                </div>
             ) : (
                <div className="text-center py-8 text-muted-foreground">لا توجد أنشطة مسجلة مؤخراً</div>
             )}
           </PageCard>
           
           <PageCard title="الإشعارات الإدارية">
              <ul className="space-y-3">
                 <li className="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/5 p-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-warning/20 text-warning-foreground">
                      <BellRing className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-warning-foreground">تحديث النظام متوفر</div>
                      <div className="text-xs text-muted-foreground">يتوفر تحديث جديد للمنصة (الإصدار 2.1). يرجى المراجعة.</div>
                    </div>
                  </li>
                 <li className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                      <HardDrive className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">النسخ الاحتياطي التلقائي</div>
                      <div className="text-xs text-muted-foreground">تم إنشاء نسخة احتياطية من قاعدة البيانات بنجاح يوم أمس الساعة 2:00 صباحاً.</div>
                      <Link to="/admin/backup" className="text-xs font-bold text-primary mt-1 block">إدارة النسخ الاحتياطية</Link>
                    </div>
                  </li>
              </ul>
           </PageCard>
        </div>
      </div>
    </AppShell>
  );
}
