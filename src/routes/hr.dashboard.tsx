import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import {
  Users,
  Briefcase,
  CalendarDays,
  FileBadge,
  TrendingUp,
  Banknote,
  ArrowLeft,
  Clock,
  Star,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  Sparkles,
  Layers,
  Award,
  ExternalLink,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Bar, 
  Legend 
} from "recharts";
import { useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/hr/dashboard")({
  head: () => ({ meta: [{ title: "مركز قيادة الموارد البشرية | منصة مدارس" }] }),
  component: HRDashboard,
});

const PALETTE = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

function StatMetricCard({
  icon: Icon,
  label,
  value,
  desc,
  tone = "primary",
  linkTo,
  linkLabel
}: {
  icon: any;
  label: string;
  value: string | number;
  desc?: string;
  tone?: "primary" | "success" | "warning" | "danger" | "purple";
  linkTo?: string;
  linkLabel?: string;
}) {
  const toneClasses: Record<string, { bg: string; text: string; border: string }> = {
    primary: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
    success: { bg: "bg-success/10", text: "text-success", border: "border-success/20" },
    warning: { bg: "bg-warning/15", text: "text-warning", border: "border-warning/20" },
    danger: { bg: "bg-danger/10", text: "text-danger", border: "border-danger/20" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-500/20" },
  };

  const currentTone = toneClasses[tone] || toneClasses.primary;

  return (
    <div className="rounded-xl border border-border bg-card p-4.5 shadow-xs hover:border-border/80 transition-all">
      <div className="flex items-center justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${currentTone.bg} ${currentTone.text}`}>
          <Icon className="h-5 w-5" />
        </div>
        {linkTo && (
          <Link
            to={linkTo}
            className="text-[11px] font-bold text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
          >
            {linkLabel || "عرض"} <ArrowUpRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="mt-3.5 text-2xl font-black tabular-nums tracking-tight">{value}</div>
      <div className="text-xs font-bold text-foreground mt-0.5">{label}</div>
      {desc && <div className="text-[11px] text-muted-foreground mt-1 font-medium">{desc}</div>}
    </div>
  );
}

function isExpiringSoon(endDate: string) {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= 45;
}

function HRDashboard() {
  const { stage, getStageLabel } = useStage();
  const { 
    currency, 
    activeStageStaff, 
    activeStageStaffAttendance, 
    activeStageTeachingAssignments, 
    allStaffContracts, 
    allStaffLeaves, 
    allStaffEvaluations,
    updateStaffLeave
  } = useGlobalStore();

  const scopedStaff = useMemo(() => activeStageStaff.filter(s => !s.isDeleted), [activeStageStaff]);
  const scopedStaffIds = useMemo(() => new Set(scopedStaff.map(item => item.id)), [scopedStaff]);
  
  const totalStaff = scopedStaff.length;
  const activeStaff = scopedStaff.filter(s => s.status === "active").length;
  const onLeaveStaff = scopedStaff.filter(s => s.status === "on_leave").length;
  const totalPayroll = scopedStaff
    .filter(s => s.status === "active")
    .reduce((acc, curr) => acc + (curr.basicSalary || 0) + (curr.allowance || 0) - (curr.deduction || 0), 0);
  
  const pendingLeavesList = useMemo(() => {
    return allStaffLeaves.filter(l => scopedStaffIds.has(l.staffId) && l.status === "pending");
  }, [allStaffLeaves, scopedStaffIds]);

  const expiringContractsList = useMemo(() => {
    return allStaffContracts.filter(c => scopedStaffIds.has(c.staffId) && c.status === "active" && isExpiringSoon(c.endDate));
  }, [allStaffContracts, scopedStaffIds]);

  const activeContracts = allStaffContracts.filter(c => scopedStaffIds.has(c.staffId) && c.status === "active").length;

  const latestAttendanceDate = activeStageStaffAttendance[0]?.date || new Date().toISOString().slice(0, 10);
  const month = latestAttendanceDate.slice(0, 7);
  const attendanceDeductions = activeStageStaffAttendance
    .filter(record => record.date.startsWith(month))
    .reduce((sum, record) => sum + (record.deductionAmount || 0), 0);

  const departmentDist = useMemo(() => {
    return Array.from(
      scopedStaff.reduce((acc, s) => {
        acc.set(s.department, (acc.get(s.department) ?? 0) + 1);
        return acc;
      }, new Map<string, number>()),
    ).map(([name, value]) => ({ name, value }));
  }, [scopedStaff]);

  const contractsTypeDist = useMemo(() => {
    const list = allStaffContracts.filter(c => scopedStaffIds.has(c.staffId));
    return [
      { name: "دوام كامل", value: list.filter(c => (c.type || c.contractType) === "full_time").length || 1 },
      { name: "دوام جزئي", value: list.filter(c => (c.type || c.contractType) === "part_time").length || 0 },
      { name: "عقد مقاولة / بالساعة", value: list.filter(c => (c.type || c.contractType) === "contractor").length || 0 },
    ].filter(d => d.value > 0);
  }, [allStaffContracts, scopedStaffIds]);

  const teachersCount = scopedStaff.filter(item => item.role.includes("معلم") || item.role.includes("مربي")).length;
  const assignedTeachersCount = new Set(activeStageTeachingAssignments.map(item => item.teacherId)).size;
  const assignmentCoverage = teachersCount > 0 ? Math.round((assignedTeachersCount / teachersCount) * 100) : 0;

  const recentEvaluations = useMemo(() => {
    return allStaffEvaluations.filter(item => scopedStaffIds.has(item.staffId)).slice(0, 4);
  }, [allStaffEvaluations, scopedStaffIds]);

  // Quick Approve Leave from Dashboard
  const handleQuickApproveLeave = (leaveId: string) => {
    updateStaffLeave(leaveId, { status: "approved", approvedAt: new Date().toISOString().split("T")[0] }, true);
    toast.success("تم اعتماد الإجازة وتحديث حالة الموظف بنجاح");
  };

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "شؤون الموظفين" }, { label: "مركز القيادة والتشغيل" }]}
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/hr/staff"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
          >
            <Users className="h-4 w-4 text-primary" /> سجل الكادر
          </Link>
          <Link
            to="/hr/payroll"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
          >
            <Banknote className="h-4 w-4" /> مسير الرواتب
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-background to-card p-6 shadow-xs">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-md shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight">مركز قيادة الموارد البشرية وشؤون الموظفين</h1>
                  <span className="text-[11px] font-black bg-primary/15 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                    {getStageLabel(stage)}
                  </span>
                </div>
                <p className="text-sm font-medium text-muted-foreground mt-1 max-w-2xl">
                  متابعة متكاملة للكادر التعليمي والإداري، العقود السارية، طلبات الإجازات، مسير الرواتب، وتقييم الكفاءة المهنية
                </p>
              </div>
            </div>

            {/* Quick Action Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/hr/leaves"
                className="flex items-center gap-1.5 bg-card hover:bg-muted border border-border px-3 py-2 rounded-xl text-xs font-bold text-foreground transition-all shadow-2xs"
              >
                <CalendarDays className="h-3.5 w-3.5 text-warning" /> طلبات الإجازات
              </Link>
              <Link
                to="/hr/contracts"
                className="flex items-center gap-1.5 bg-card hover:bg-muted border border-border px-3 py-2 rounded-xl text-xs font-bold text-foreground transition-all shadow-2xs"
              >
                <FileBadge className="h-3.5 w-3.5 text-primary" /> العقود والوثائق
              </Link>
              <Link
                to="/hr/evaluations"
                className="flex items-center gap-1.5 bg-card hover:bg-muted border border-border px-3 py-2 rounded-xl text-xs font-bold text-foreground transition-all shadow-2xs"
              >
                <Star className="h-3.5 w-3.5 text-amber-500" /> تقييم الأداء
              </Link>
            </div>
          </div>
        </div>

        {/* Operational Metrics Strip */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatMetricCard
            icon={Users}
            label="إجمالي العاملين"
            value={totalStaff}
            desc={`${activeStaff} على رأس العمل • ${onLeaveStaff} بإجازة`}
            tone="primary"
            linkTo="/hr/staff"
            linkLabel="الكادر"
          />

          <StatMetricCard
            icon={Banknote}
            label="مسير الرواتب الشهري"
            value={`${totalPayroll.toLocaleString()} ${currency}`}
            desc="الأساسي + البدلات - الحسميات"
            tone="success"
            linkTo="/hr/payroll"
            linkLabel="الرواتب"
          />

          <StatMetricCard
            icon={TrendingUp}
            label="تغطية الإسناد الأكاديمي"
            value={`${assignmentCoverage}%`}
            desc={`${activeStageTeachingAssignments.length} حصة مسندة لمعلمين`}
            tone="purple"
            linkTo="/academic/classes"
            linkLabel="الإسناد"
          />

          <StatMetricCard
            icon={CalendarDays}
            label="طلبات إجازة معلقة"
            value={pendingLeavesList.length}
            desc={pendingLeavesList.length > 0 ? "بانتظار قرار الموارد البشرية" : "لا توجد طلبات معلقة"}
            tone={pendingLeavesList.length > 0 ? "warning" : "success"}
            linkTo="/hr/leaves"
            linkLabel="الإجازات"
          />

          <StatMetricCard
            icon={FileBadge}
            label="عقود عمل سارية"
            value={activeContracts}
            desc={`${expiringContractsList.length} تنتهي خلال شهر`}
            tone={expiringContractsList.length > 0 ? "warning" : "primary"}
            linkTo="/hr/contracts"
            linkLabel="العقود"
          />

          <StatMetricCard
            icon={Clock}
            label="خصومات الانضباط والغياب"
            value={`${attendanceDeductions.toLocaleString()} ${currency}`}
            desc={`إجمالي شهر ${month}`}
            tone={attendanceDeductions > 0 ? "danger" : "success"}
            linkTo="/hr/attendance"
            linkLabel="الحضور"
          />
        </div>

        {/* Two Columns: Action Feeds & Visual Analytics */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Column (2 cols): Pending Approvals & Expiring Contracts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Leaves Review Widget */}
            <PageCard
              title="طلبات الإجازات الواردة وبانتظار الاعتماد"
              description="مراجعة الإجازات الطارئة والسنوية واعتمادها مع مزامنة الرواتب والبدلاء"
              actions={
                <Link to="/hr/leaves" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                  كافة الإجازات ({allStaffLeaves.length}) <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              }
            >
              {pendingLeavesList.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs font-medium">
                  <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2 opacity-80" />
                  تمت مراجعة كافة طلبات الإجازات بنجاح، لا توجد طلبات معلقة حالياً.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {pendingLeavesList.map((leave) => (
                    <div key={leave.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-lg transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-muted px-1.5 py-0.5 rounded">
                            {leave.id}
                          </span>
                          <span className="font-bold text-sm text-foreground">{leave.staffName}</span>
                          <Badge tone={leave.type === "issued" ? "danger" : leave.type === "sick" ? "info" : "primary"}>
                            {leave.type === "annual" ? "سنوية" : leave.type === "sick" ? "مرضية" : leave.type === "issued" ? "بدون راتب" : "اضطرارية"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>الفترة: <strong>{leave.startDate}</strong> إلى <strong>{leave.endDate}</strong> ({leave.days} يوم)</span>
                          {leave.replacementStaffName && <span>البديل: <strong>{leave.replacementStaffName}</strong></span>}
                          {leave.notes && <span>الملاحظات: {leave.notes}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleQuickApproveLeave(leave.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-success text-white hover:bg-success/90 transition-all shadow-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> اعتماد فوري
                        </button>
                        <Link
                          to="/hr/leaves"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-border text-muted-foreground hover:bg-muted transition-colors"
                        >
                          التفاصيل
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PageCard>

            {/* Expiring Contracts Alert */}
            {expiringContractsList.length > 0 && (
              <div className="p-4 rounded-xl border border-warning/30 bg-warning/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-black text-sm">تنبيه انتهاء العقود الوظيفية (خلال 45 يوماً)</span>
                  </div>
                  <Link to="/hr/contracts" className="text-xs font-bold text-primary hover:underline">
                    تجديد العقود <ArrowLeft className="h-3.5 w-3.5 inline-block" />
                  </Link>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {expiringContractsList.map(c => (
                    <div key={c.id} className="p-3 bg-card rounded-lg border border-border flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-foreground">{c.staffName}</div>
                        <div className="text-muted-foreground">{c.jobTitle || "كادر تعليمي"} • ينتهي: {c.endDate}</div>
                      </div>
                      <Link
                        to="/hr/contracts"
                        className="px-2.5 py-1 rounded bg-primary/10 text-primary font-bold hover:bg-primary/20 text-[11px]"
                      >
                        تجديد
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Department Staff Distribution Chart */}
            <PageCard title="توزيع الكادر حسب الأقسام والإدارات">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563EB" name="عدد الموظفين" radius={[6, 6, 0, 0]} barSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PageCard>
          </div>

          {/* Sidebar Column (1 col): Contracts Types & Recent Evaluations */}
          <div className="space-y-6">
            {/* Donut Chart: Contracts Distribution */}
            <PageCard title="توزيع أنواع عقود العمل">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contractsTypeDist}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {contractsTypeDist.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 pt-2 border-t border-border/70 text-xs">
                {contractsTypeDist.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <strong className="text-foreground tabular-nums">{item.value} عقد</strong>
                  </div>
                ))}
              </div>
            </PageCard>

            {/* Recent Evaluations Feed */}
            <PageCard
              title="أحدث تقييمات الأداء"
              actions={
                <Link to="/hr/evaluations" className="text-xs font-bold text-primary hover:underline">
                  كافة التقييمات
                </Link>
              }
            >
              {recentEvaluations.length > 0 ? (
                <div className="space-y-3 text-xs">
                  {recentEvaluations.map(e => (
                    <div key={e.id} className="p-3 border border-border rounded-xl bg-card space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{e.staffName}</span>
                        <span className="font-black text-amber-600 tabular-nums">{e.overallScore} / 5</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex justify-between">
                        <span>{e.period}</span>
                        <span>بواسطة: {e.evaluator}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  لا توجد تقييمات مسجلة حديثاً
                </div>
              )}
            </PageCard>

            {/* Safety & Compliance Badge */}
            <PageCard title="الامتثال والتوثيق الوظيفي">
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-success" />
                    <span className="font-bold text-foreground">تغطية العقود الرسمية</span>
                  </div>
                  <span className="font-black text-success">100% موثقة</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <span className="font-bold text-foreground">الربط مع التأمينات والرواتب</span>
                  </div>
                  <span className="font-black text-primary">معتمد</span>
                </div>
              </div>
            </PageCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
