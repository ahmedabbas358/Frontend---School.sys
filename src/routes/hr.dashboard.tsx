import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import {
  Users,
  Briefcase,
  CalendarDays,
  FileBadge,
  TrendingUp,
  Banknote,
  ArrowLeft
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts";

export const Route = createFileRoute("/hr/dashboard")({
  head: () => ({ meta: [{ title: "لوحة الموارد البشرية | منصة مدارس" }] }),
  component: HRDashboard,
});

const PALETTE = ["#2563EB", "#22C55E", "#F59E0B", "#EF4444", "#0EA5E9"];

function StatCard({ icon: Icon, label, value, desc, tone = "primary" }: any) {
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
      </div>
      <div className="mt-4 text-2xl font-extrabold tabular">{value}</div>
      <div className="text-sm font-bold mt-1">{label}</div>
      {desc && <div className="text-xs text-muted-foreground mt-1">{desc}</div>}
    </div>
  );
}

function HRDashboard() {
  const { stage, getStageLabel } = useStage();
  const { currency, activeStageStaff, activeStageStaffAttendance, activeStageTeachingAssignments, allStaffContracts, allStaffLeaves, allStaffEvaluations } = useGlobalStore();

  const scopedStaff = activeStageStaff.filter(s => !s.isDeleted);
  const scopedStaffIds = new Set(scopedStaff.map(item => item.id));
  const totalStaff = scopedStaff.length;
  const activeStaff = scopedStaff.filter(s => s.status === "active").length;
  const totalPayroll = scopedStaff.filter(s => s.status === "active").reduce((acc, curr) => acc + (curr.basicSalary || 0) + (curr.allowance || 0) - (curr.deduction || 0), 0);
  
  const pendingLeaves = allStaffLeaves.filter(l => scopedStaffIds.has(l.staffId) && l.status === "pending").length;
  const activeContracts = allStaffContracts.filter(c => scopedStaffIds.has(c.staffId) && c.status === "active").length;
  const latestAttendanceDate = activeStageStaffAttendance[0]?.date || new Date().toISOString().slice(0, 10);
  const month = latestAttendanceDate.slice(0, 7);
  const attendanceDeductions = activeStageStaffAttendance
    .filter(record => record.date.startsWith(month))
    .reduce((sum, record) => sum + (record.deductionAmount || 0), 0);

  const departmentDist = Array.from(
    scopedStaff.reduce((acc, s) => {
      acc.set(s.department, (acc.get(s.department) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()),
  ).map(([name, value], i) => ({ name, value, fill: PALETTE[i % PALETTE.length] }));

  const teachersCount = scopedStaff.filter(item => item.role.includes("معلم") || item.role.includes("مربي")).length;
  const assignedTeachersCount = new Set(activeStageTeachingAssignments.map(item => item.teacherId)).size;
  const assignmentCoverage = teachersCount > 0 ? Math.round((assignedTeachersCount / teachersCount) * 100) : 0;

  const recentEvaluations = allStaffEvaluations.filter(item => scopedStaffIds.has(item.staffId)).slice(0, 4);

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "شؤون الموظفين" }, { label: "لوحة الإحصاءات" }]}
      actions={
        <Link to="/hr/staff" className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          <Briefcase className="h-4 w-4" /> إدارة الموظفين
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">الموارد البشرية ({getStageLabel(stage)})</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">نظرة تشغيلية على الكادر، الرواتب، العقود، الإجازات، والإسناد التدريسي للمرحلة النشطة.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard icon={Users} label="إجمالي الموظفين" value={totalStaff} desc={`${activeStaff} على رأس العمل`} tone="primary" />
          <StatCard icon={Banknote} label="مسير الرواتب الشهري" value={`${totalPayroll.toLocaleString("ar-EG")} ${currency}`} desc="الأساسي + البدلات - الحسميات" tone="success" />
          <StatCard icon={TrendingUp} label="تغطية الإسناد" value={`${assignmentCoverage}%`} desc={`${activeStageTeachingAssignments.length} إسناد نشط`} tone="success" />
          <StatCard icon={CalendarDays} label="إجازات معلقة" value={pendingLeaves} tone={pendingLeaves > 0 ? "warning" : "success"} />
          <StatCard icon={FileBadge} label="عقود سارية" value={activeContracts} tone="primary" />
          <StatCard icon={Briefcase} label="خصومات حضور" value={`${attendanceDeductions.toLocaleString("ar-EG")} ${currency}`} desc={`الشهر ${month}`} tone={attendanceDeductions > 0 ? "warning" : "success"} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PageCard title="توزيع الموظفين حسب الأقسام">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentDist} layout="vertical" margin={{ left: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563EB" radius={[0, 8, 8, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PageCard>
          </div>
          <PageCard title="توزيع عقود العمل">
             <div className="h-72 flex flex-col justify-center items-center">
               <div className="w-full h-full min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        { name: "دوام كامل", value: allStaffContracts.filter(c => scopedStaffIds.has(c.staffId) && c.type === "full_time").length || 1 },
                        { name: "دوام جزئي", value: allStaffContracts.filter(c => scopedStaffIds.has(c.staffId) && c.type === "part_time").length || 0 },
                        { name: "عقد مقاولة", value: allStaffContracts.filter(c => scopedStaffIds.has(c.staffId) && c.type === "contractor").length || 0 },
                      ]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label>
                        <Cell fill="#2563EB" />
                        <Cell fill="#F59E0B" />
                        <Cell fill="#10B981" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </PageCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
           <PageCard title="أحدث تقييمات الأداء">
             {recentEvaluations.length > 0 ? (
                <div className="space-y-4">
                  {recentEvaluations.map(e => (
                    <div key={e.id} className="flex items-center justify-between p-4 border border-border rounded-xl">
                      <div>
                        <div className="font-bold">{e.staffName}</div>
                        <div className="text-xs text-muted-foreground">{e.period} - المقيّم: {e.evaluator}</div>
                      </div>
                      <div className="text-lg font-black text-primary">{e.overallScore} / 5</div>
                    </div>
                  ))}
                  <Link to="/hr/evaluations" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                    عرض جميع التقييمات <ArrowLeft className="h-4 w-4" />
                  </Link>
                </div>
             ) : (
                <div className="text-center py-8 text-muted-foreground">لا توجد تقييمات حديثة</div>
             )}
           </PageCard>
           
           <PageCard title="تنبيهات الموارد البشرية">
              <ul className="space-y-3">
                {pendingLeaves > 0 && (
                  <li className="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/5 p-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-warning/20 text-warning-foreground">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-warning-foreground">طلبات إجازة معلقة</div>
                      <div className="text-xs text-muted-foreground">يوجد {pendingLeaves} طلبات إجازة بانتظار الموافقة</div>
                      <Link to="/hr/leaves" className="text-xs font-bold text-primary mt-1 block">مراجعة الطلبات</Link>
                    </div>
                  </li>
                )}
                 <li className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Banknote className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">مسير الرواتب</div>
                      <div className="text-xs text-muted-foreground">تذكير: لم يتم اعتماد مسير الرواتب لهذا الشهر</div>
                      <Link to="/hr/payroll" className="text-xs font-bold text-primary mt-1 block">الذهاب لمسير الرواتب</Link>
                    </div>
                  </li>
              </ul>
           </PageCard>
        </div>
      </div>
    </AppShell>
  );
}
