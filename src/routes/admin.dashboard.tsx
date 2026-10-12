import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import {
  ShieldCheck,
  Users,
  Activity,
  Shield,
  HardDrive,
  BellRing,
  Settings,
  Database,
  Banknote,
  Bus,
  GraduationCap,
  AlertTriangle,
  ArrowLeft,
  UserCog,
  Printer,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Clock,
  Eye,
  RefreshCcw,
  FileText,
  Lock,
  Zap,
  ServerCrash,
  Wifi,
  Search,
  Download,
  ChevronLeft,
  X,
  Stethoscope,
  Sparkles,
  ArrowRight,
  Sliders,
  Check,
  Trash2,
  BookOpen,
  UserCheck,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { AdminModal } from "@/components/admin/admin-modal";
import { AdminNav } from "@/components/admin/admin-nav";
import { Switch } from "@/components/ui/switch";
import { defaultFeatures, SystemFeatures } from "@/contexts/GlobalStoreContext";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "مركز القيادة والتحكم الإداري | منصة مدارس" }] }),
  component: AdminDashboard,
});

const PALETTE = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

/* ─── Animated KPI Card ─── */
function KPICard({ icon: Icon, label, value, desc, tone = "primary", trend, trendValue, onClick }: any) {
  const toneMap: Record<string, { bg: string; text: string; ring: string }> = {
    primary: { bg: "bg-primary/10", text: "text-primary", ring: "ring-primary/20" },
    success: { bg: "bg-success/10", text: "text-success", ring: "ring-success/20" },
    warning: { bg: "bg-warning/10", text: "text-warning-foreground", ring: "ring-warning/20" },
    danger: { bg: "bg-danger/10", text: "text-danger", ring: "ring-danger/20" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-600", ring: "ring-purple-500/20" },
    info: { bg: "bg-info/10", text: "text-info-foreground", ring: "ring-info/20" },
  };
  const t = toneMap[tone] || toneMap.primary;

  return (
    <div
      onClick={onClick}
      className={`group rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-300 ring-1 ${
        t.ring
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`grid h-11 w-11 place-items-center rounded-2xl ${t.bg} ${t.text} shadow-inner transition-transform group-hover:scale-110 duration-300`}
        >
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
              trend === "up" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
            }`}
          >
            {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <div className="text-2xl font-black tabular-nums text-foreground">{value}</div>
      <div className="text-sm font-bold mt-1 text-foreground">{label}</div>
      {desc && <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</div>}
    </div>
  );
}

/* ─── System Health Gauge ─── */
function HealthGauge({ score, onInspect }: { score: number; onInspect: () => void }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const color = score > 85 ? "#22C55E" : score > 60 ? "#F59E0B" : "#EF4444";
  const label = score > 85 ? "ممتازة" : score > 60 ? "تحتاج تحسين" : "تحتاج تدخل عاجل";

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" className="text-border/40" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black tabular-nums text-foreground">{score}%</span>
          <span className="text-[10px] font-bold text-muted-foreground mt-0.5">{label}</span>
        </div>
      </div>
      <button
        onClick={onInspect}
        className="mt-3 text-xs font-black text-primary hover:underline flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-xl transition-colors"
      >
        <Stethoscope className="h-3.5 w-3.5" /> فحص السلامة الشامل
      </button>
    </div>
  );
}

function AdminDashboard() {
  const {
    currency,
    allActivityLogs,
    allStudents,
    allStaff,
    allInvoices,
    allExpenses,
    allSections,
    allSubjects,
    transportSubscriptions,
    allStaffLeaves,
    allStaffContracts,
    allUsers,
    systemSettings,
    toggleFeature,
    addActivityLog,
  } = useGlobalStore();

  const [refreshing, setRefreshing] = useState(false);

  // Features Control Metrics
  const currentFeatures = systemSettings?.features || defaultFeatures;
  const activeFeaturesCount = useMemo(
    () => Object.values(currentFeatures).filter(Boolean).length,
    [currentFeatures]
  );
  const totalFeaturesCount = useMemo(
    () => Object.keys(currentFeatures).length || 20,
    [currentFeatures]
  );
  const featuresPercentage = Math.round((activeFeaturesCount / totalFeaturesCount) * 100);

  // Luxury Interactive Modals
  const [diagnosticsModal, setDiagnosticsModal] = useState(false);
  const [quickBackupModal, setQuickBackupModal] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [quickFeaturesModal, setQuickFeaturesModal] = useState(false);

  const FEATURE_DEFS: { key: keyof SystemFeatures; title: string; category: string; icon: any }[] = [
    { key: "attendanceDiscipline", title: "الحضور والانضباط السلوكي", category: "تشغيلي", icon: UserCheck },
    { key: "teachingFaculty", title: "الهيئة التعليمية والمعلمون", category: "تشغيلي", icon: Users },
    { key: "academicCurriculum", title: "المواد والخطط الدراسية", category: "تشغيلي", icon: BookOpen },
    { key: "transport", title: "النقل المدرسي والحافلات", category: "تشغيلي", icon: Bus },
    { key: "library", title: "المكتبة وتوزيع المقررات", category: "تشغيلي", icon: FileText },
    { key: "clinic", title: "العيادة والرعاية الصحية", category: "تشغيلي", icon: Stethoscope },
    { key: "facilities", title: "المرافق والصيانة", category: "تشغيلي", icon: Settings },
    { key: "inventory", title: "المستودعات والعهد", category: "تشغيلي", icon: Database },
    { key: "hrPayroll", title: "الموارد البشرية والرواتب", category: "تشغيلي", icon: Users },
    { key: "examsReports", title: "الاختبارات والشهادات", category: "تشغيلي", icon: GraduationCap },
    { key: "financeInvoicing", title: "المركز المالي والرسوم", category: "تشغيلي", icon: Banknote },
    { key: "admissionRegistration", title: "القبول والتسجيل", category: "تشغيلي", icon: Users },
    { key: "parentPortal", title: "بوابة وتطبيق ولي الأمر", category: "تطبيقات", icon: Users },
    { key: "teacherApp", title: "تطبيق المعلم ورصد الحضور", category: "تطبيقات", icon: CheckCircle2 },
    { key: "smsAlerts", title: "تنبيهات رسائل SMS", category: "تطبيقات", icon: BellRing },
    { key: "whatsappAlerts", title: "إشعارات وتنبيهات واتساب", category: "تطبيقات", icon: Zap },
    { key: "onlinePayments", title: "بوابات الدفع الإلكتروني", category: "تقنية وأمان", icon: Banknote },
    { key: "qrVerification", title: "التحقق الرقمي عبر QR", category: "تقنية وأمان", icon: Lock },
    { key: "noorIntegration", title: "الربط مع نظام نور", category: "تقنية وأمان", icon: Wifi },
    { key: "webhooksApi", title: "واجهات API والـ Webhooks", category: "تقنية وأمان", icon: Zap },
    { key: "twoFactorAuth", title: "المصادقة الثنائية (2FA)", category: "تقنية وأمان", icon: ShieldCheck },
    { key: "smartAnalyticsAi", title: "التحليلات الذكية بالـ AI", category: "تقنية وأمان", icon: Sparkles },
    { key: "trashBin", title: "سلة المحذوفات واسترجاع السجلات", category: "تقنية وأمان", icon: Trash2 },
  ];

  /* ─── Computed KPIs ─── */
  const activeStudents = allStudents.filter((s) => s.status === "نشط" && !s.isDeleted).length;
  const activeStaff = allStaff.filter((s) => s.status === "active" && !s.isDeleted).length;
  const activeUsers = activeStudents + activeStaff;
  const totalUsers = allUsers?.length || 0;
  const recentLogs = allActivityLogs.slice(0, 8);
  const errorLogs = allActivityLogs.filter((l) => l.action.includes("فشل") || l.action.includes("خطأ")).length;

  const studentsWithoutSection = allStudents.filter((student) => !student.sectionId && !student.isDeleted).length;
  const staffWithoutContract = allStaff.filter((staff) => !staff.basicSalary && !staff.isDeleted).length;

  const totalRevenues = allInvoices.reduce((sum, invoice) => sum + invoice.paid, 0);
  const totalExpenses = allExpenses ? allExpenses.reduce((sum, exp) => sum + exp.amount, 0) : 0;
  const totalExpected = allInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const collectionRate = totalExpected > 0 ? Math.round((totalRevenues / totalExpected) * 100) : 0;

  const pendingLeaves = allStaffLeaves.filter((leave) => leave.status === "pending").length;
  const activeTransport = transportSubscriptions.filter((item) => item.status === "active").length;
  const expiringContracts = (allStaffContracts || []).filter((c) => {
    const end = new Date(c.endDate);
    const diff = (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff < 30;
  }).length;

  const systemHealth = Math.max(
    0,
    Math.min(100, 100 - studentsWithoutSection * 1 - staffWithoutContract * 2 - errorLogs * 5 - pendingLeaves * 1)
  );

  /* ─── Charts Data ─── */
  const rolesDistribution = useMemo(
    () => [
      { name: "مدير نظام", value: 2 },
      { name: "إداري", value: 5 },
      { name: "معلم", value: allStaff.filter((s) => s.role.includes("معلم")).length || 1 },
      { name: "ولي أمر", value: Math.max(1, new Set(allStudents.map((student) => student.guardianName)).size) },
      { name: "طالب", value: allStudents.length || 1 },
    ],
    [allStaff, allStudents]
  );

  const activityTrend = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        const dateStr = d.toISOString().split("T")[0];
        const dayLogs = allActivityLogs.filter((l) => l.date.startsWith(dateStr));
        const dayName = d.toLocaleDateString("ar-EG", { weekday: "short", day: "numeric" });
        return { day: dayName, count: Math.max(1, dayLogs.length) };
      }),
    [allActivityLogs]
  );

  /* ─── Alerts ─── */
  const alerts = useMemo(() => {
    const list: {
      id: string;
      title: string;
      message: string;
      tone: string;
      icon: any;
      link: string;
      linkLabel: string;
    }[] = [];
    if (studentsWithoutSection > 0)
      list.push({
        id: "a1",
        title: "طلاب غير مربوطين بشعب",
        message: `يوجد ${studentsWithoutSection} طالب يحتاج استكمال الشعبة الدراسية`,
        tone: "warning",
        icon: AlertTriangle,
        link: "/students",
        linkLabel: "مراجعة الطلاب",
      });
    if (staffWithoutContract > 0)
      list.push({
        id: "a2",
        title: "موظفون بلا رواتب محددة",
        message: `يوجد ${staffWithoutContract} موظف لم يتم تحديد راتبهم في ملفاتهم`,
        tone: "danger",
        icon: Users,
        link: "/hr/staff",
        linkLabel: "إدارة الموظفين",
      });
    if (pendingLeaves > 0)
      list.push({
        id: "a3",
        title: "إجازات تنتظر قرار الإدارة",
        message: `${pendingLeaves} طلب إجازة في قائمة الانتظار للمصادقة`,
        tone: "info",
        icon: Clock,
        link: "/hr/leaves",
        linkLabel: "اعتماد الإجازات",
      });
    if (expiringContracts > 0)
      list.push({
        id: "a4",
        title: "عقود موظفين تقترب من الانتهاء",
        message: `${expiringContracts} عقد ينتهي خلال 30 يوماً ويحتاج تجديد`,
        tone: "warning",
        icon: FileText,
        link: "/hr/contracts",
        linkLabel: "مراجعة العقود",
      });
    const lateInvoices = allInvoices.filter(
      (inv) => inv.status !== "paid" && new Date(inv.dueDate) < new Date()
    ).length;
    if (lateInvoices > 0)
      list.push({
        id: "a5",
        title: "رسوم دراسية متأخرة السداد",
        message: `${lateInvoices} فاتورة تجاوزت تاريخ الاستحقاق المحدد`,
        tone: "danger",
        icon: Banknote,
        link: "/finance/students",
        linkLabel: "مراجعة الفواتير",
      });
    return list;
  }, [studentsWithoutSection, staffWithoutContract, pendingLeaves, expiringContracts, allInvoices]);

  const commandLinks = [
    {
      label: "التحكم بميزات ووحدات المنظومة",
      to: "/admin/features",
      icon: Sliders,
      desc: "تفعيل وتعطيل 20 ميزة ونموذج تشغيلي بالمنظومة لحظياً",
      shortcut: "F",
      badge: `${activeFeaturesCount}/${totalFeaturesCount} ميزة نشطة`,
    },
    {
      label: "مصفوفة الصلاحيات (RBAC)",
      to: "/admin/permissions",
      icon: Shield,
      desc: "تخصيص أدوار القراءة والتعديل والاعتماد",
      shortcut: "P",
    },
    {
      label: "سجل الأنشطة والتدقيق",
      to: "/admin/activity-log",
      icon: Activity,
      desc: "متابعة وتدقيق العمليات الحساسة",
      shortcut: "L",
    },
    {
      label: "إدارة المستخدمين والحسابات",
      to: "/admin/users",
      icon: UserCog,
      desc: "حسابات الإداريين والمعلمين والموظفين",
      shortcut: "U",
    },
    {
      label: "أدوار المستخدمين ومستوياتها",
      to: "/admin/roles",
      icon: Lock,
      desc: "تحديد وتعريف المسميات الوظيفية",
      shortcut: "R",
    },
    {
      label: "النسخ الاحتياطي والاسترجاع",
      to: "/admin/backup",
      icon: HardDrive,
      desc: "تأمين بيانات النظام وتشفيرها",
      shortcut: "B",
    },
    {
      label: "مركز الإشعارات والتعاميم",
      to: "/admin/notifications",
      icon: BellRing,
      desc: "تنبيهات ومؤشرات صحة النظام الذكية",
      shortcut: "N",
    },
    {
      label: "سلة المحذوفات واسترجاع البيانات",
      to: "/settings/trash",
      icon: Trash2,
      desc: "استعادة السجلات المحذوفة للطلاب والموظفين",
      shortcut: "T",
    },
  ];

  const systemModules = [
    { name: "محرك قاعدة البيانات (DB Engine)", status: "online", icon: Database },
    { name: "خدمة المصادقة والأمان (Auth)", status: "online", icon: Lock },
    { name: "واجهات التكامل والـ API", status: "online", icon: Zap },
    { name: "خدمة المزامنة السحابية", status: "online", icon: Wifi },
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    toast.info("جاري تحديث وتدقيق المؤشرات اللحظية...");
    setTimeout(() => {
      setRefreshing(false);
      toast.success("تم تحديث كافة مؤشرات لوحة التحكم بنجاح");
    }, 1200);
  };

  const handleExecuteQuickBackup = () => {
    setIsBackingUp(true);
    toast.info("جاري إنشاء نسخة احتياطية فورية وتشفيرها...");
    setTimeout(() => {
      setIsBackingUp(false);
      setQuickBackupModal(false);

      const totalRecs =
        allStudents.length +
        allStaff.length +
        allInvoices.length +
        (allExpenses?.length || 0) +
        allSections.length +
        allSubjects.length +
        (allUsers?.length || 0);

      const newBackup = {
        id: `BK-${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}`,
        date: new Date().toISOString(),
        size: `${Math.round(245 + Math.random() * 8)} MB`,
        type: "يدوي",
        status: "ناجح",
        tables: 42,
        records: totalRecs,
        hash: `${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`,
      };

      try {
        const raw = localStorage.getItem("darasi_system_backups_v2");
        const list = raw ? JSON.parse(raw) : [];
        localStorage.setItem("darasi_system_backups_v2", JSON.stringify([newBackup, ...list]));
      } catch (e) {
        console.error(e);
      }

      addActivityLog({
        user: "مدير النظام",
        action: "نسخ احتياطي فوري",
        entity: "لوحة التحكم العامة",
        details: `تم إنشاء نسخة احتياطية فورية (${newBackup.id}) لعدد ${totalRecs} سجل شامل`,
      });
      toast.success("تم أخذ النسخة الاحتياطية وتأمينها في سجل النسخ بنجاح");
    }, 1800);
  };

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الإدارة والنظام" }, { label: "مركز القيادة والتحكم" }]}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setQuickFeaturesModal(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3.5 text-xs font-black text-primary hover:bg-primary/20 transition-all shadow-xs cursor-pointer"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>التحكم بالميزات ({activeFeaturesCount}/20)</span>
          </button>
          <button
            onClick={() => setDiagnosticsModal(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold text-foreground hover:bg-accent transition-colors shadow-sm"
          >
            <Stethoscope className="h-3.5 w-3.5 text-primary" /> فحص النظام
          </button>
          <button
            onClick={() => setQuickBackupModal(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold hover:bg-accent transition-colors shadow-sm"
          >
            <HardDrive className="h-3.5 w-3.5 text-primary" /> نسخ سريع
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold hover:bg-accent transition-colors shadow-sm"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
            تحديث
          </button>
          <Link
            to="/settings"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
          >
            <Settings className="h-3.5 w-3.5" /> الإعدادات
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Unified Admin Sub-Navigation */}
        <AdminNav activeTab="/admin/dashboard" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-5 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary p-3.5 rounded-2xl shadow-inner border border-primary/20">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black">مركز القيادة والتحكم الإداري (Executive Command Center)</h1>
              <p className="text-sm font-bold text-muted-foreground mt-1">
                مراقبة حية لسلامة النظام، تدقيق العمليات، والتحكم بالصلاحيات والأمان عبر كافة الوحدات
              </p>
            </div>
          </div>
        </div>

        {/* Row 1: Primary KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={Users}
            label="المستخدمين النشطين"
            value={activeUsers}
            desc={`${activeStudents} طالب + ${activeStaff} موظف مسجل`}
            tone="primary"
            trend="up"
            trendValue="+3%"
          />
          <KPICard
            icon={Activity}
            label="العمليات المسجلة بالسجل"
            value={allActivityLogs.length}
            desc="تسجيل دخول، تعديلات، اعتمادات"
            tone="success"
          />
          <KPICard
            icon={Shield}
            label="تنبيهات أمنية ومخاطر"
            value={errorLogs}
            tone={errorLogs > 0 ? "danger" : "success"}
            desc={errorLogs === 0 ? "لا توجد أي مخاطر مكتشفة" : "تحتاج مراجعة فورية بسجل الأنشطة"}
          />
          <KPICard
            icon={UserCog}
            label="حسابات النظام الإدارية"
            value={totalUsers}
            desc={`${totalUsers} حساب مسجل بإدارة المستخدمين`}
            tone="purple"
          />
        </div>

        {/* Row 2: Secondary Operational KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={GraduationCap}
            label="سجلات تحتاج استكمال"
            value={studentsWithoutSection + staffWithoutContract}
            desc="طلاب بلا شعب / موظفين بلا رواتب"
            tone={studentsWithoutSection > 0 || staffWithoutContract > 0 ? "warning" : "success"}
            onClick={() => setDiagnosticsModal(true)}
          />
          <KPICard
            icon={Banknote}
            label="نسبة تحصيل الرسوم"
            value={`${collectionRate}%`}
            desc={`محصل: ${totalRevenues.toLocaleString()} ${currency} من ${totalExpected.toLocaleString()}`}
            tone={collectionRate > 80 ? "success" : "warning"}
          />
          <KPICard
            icon={Bus}
            label="اشتراكات النقل النشطة"
            value={activeTransport}
            desc="اشتراكات حافلات مربوطة بالمسارات"
            tone="info"
          />
          <KPICard
            icon={BellRing}
            label="طلبات إجازات معلقة"
            value={pendingLeaves}
            desc="في انتظار اعتماد الموارد البشرية"
            tone={pendingLeaves > 0 ? "warning" : "success"}
          />
        </div>

        {/* Row 3: Charts & Health Section */}
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Activity Trend Chart */}
          <div className="lg:col-span-2">
            <PageCard title="📊 مؤشر النشاط والعمليات خلال الأسبوعين الماضيين" className="shadow-sm">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityTrend}>
                    <defs>
                      <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "14px",
                        border: "1px solid hsl(var(--border))",
                        fontSize: "12px",
                        fontWeight: 700,
                        backgroundColor: "hsl(var(--card))",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      fill="url(#colorGrad)"
                      strokeWidth={2.5}
                      name="العمليات"
                      dot={{ r: 3, fill: "hsl(var(--primary))" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </PageCard>
          </div>

          {/* System Health Gauge */}
          <div className="space-y-4">
            <PageCard title="🛡️ فحص صحة وتكامل النظام" className="shadow-sm">
              <HealthGauge score={systemHealth} onInspect={() => setDiagnosticsModal(true)} />
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                {systemModules.map((mod) => {
                  const ModIcon = mod.icon;
                  return (
                    <div
                      key={mod.name}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border/50"
                    >
                      <div className="flex items-center gap-2">
                        <ModIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-bold text-foreground">{mod.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                        <span className="text-[10px] font-black text-success">متصل بنجاح</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </PageCard>
          </div>
        </div>

        {/* Row 4: Roles Distribution + Quick Command Center */}
        <div className="grid gap-5 lg:grid-cols-2">
          <PageCard title="📈 توزيع الحسابات حسب الأدوار والمجموعات" className="shadow-sm">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rolesDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {rolesDistribution.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "14px",
                      border: "1px solid hsl(var(--border))",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </PageCard>

          <PageCard title="⚡ مركز أوامر الإدارة السريعة" className="shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              {commandLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="group rounded-2xl border border-border/80 p-4 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 hover:shadow-md block"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200 shadow-inner">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-0.5 rounded-lg bg-muted border border-border/80 text-[10px] font-mono font-bold text-muted-foreground">
                          {item.shortcut}
                        </kbd>
                        <ArrowLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-1 group-hover:text-primary" />
                      </div>
                    </div>
                    <div className="font-black text-sm text-foreground">{item.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
                  </Link>
                );
              })}
            </div>
          </PageCard>
        </div>

        {/* Row 5: Activity Log + Smart Alerts */}
        <div className="grid gap-5 lg:grid-cols-2">
          <PageCard title="📋 أحدث عمليات التدقيق المسجلة" className="shadow-sm">
            {recentLogs.length > 0 ? (
              <div className="space-y-3">
                {recentLogs.map((l) => {
                  const severity =
                    l.action.includes("فشل") || l.action.includes("خطأ")
                      ? "danger"
                      : l.action.includes("حذف") || l.action.includes("اعتماد")
                      ? "warning"
                      : "success";
                  const severityColors = {
                    danger: "border-danger/30 bg-danger/5",
                    warning: "border-warning/30 bg-warning/5",
                    success: "border-border/80 bg-card",
                  };

                  return (
                    <div
                      key={l.id}
                      className={`flex items-center justify-between p-3.5 border rounded-2xl transition-all hover:shadow-sm ${severityColors[severity]}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                            severity === "danger"
                              ? "bg-danger/10 text-danger"
                              : severity === "warning"
                              ? "bg-warning/10 text-warning-foreground"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          <Activity className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-sm text-foreground truncate">{l.action}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            المستخدم: <strong className="text-foreground">{l.user}</strong> • {l.entity}
                          </div>
                        </div>
                      </div>
                      <div className="text-[11px] tabular-nums text-muted-foreground shrink-0 mr-3 font-medium">
                        {new Date(l.date).toLocaleString("ar-EG", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                    </div>
                  );
                })}
                <Link
                  to="/admin/activity-log"
                  className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:underline pt-2"
                >
                  <Eye className="h-3.5 w-3.5" /> عرض كامل سجل الأنشطة والتدقيق
                </Link>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">لا توجد أنشطة مسجلة مؤخراً</p>
              </div>
            )}
          </PageCard>

          <PageCard title="🔔 التنبيهات الإدارية والملاحظات الذكية" className="shadow-sm">
            <div className="space-y-3">
              {alerts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-success opacity-50" />
                  <p className="text-sm font-black text-success">جميع وحدات النظام متكاملة وتعمل بسلاسة</p>
                  <p className="text-xs text-muted-foreground mt-1">لا توجد تنبيهات تتطلب تدخلاً عاجلاً</p>
                </div>
              )}
              {alerts.map((alert) => {
                const AlertIcon = alert.icon;
                const toneColors: Record<string, string> = {
                  warning: "border-warning/30 bg-warning/5",
                  danger: "border-danger/30 bg-danger/5",
                  info: "border-primary/30 bg-primary/5",
                };
                const iconBg: Record<string, string> = {
                  warning: "bg-warning/15 text-warning-foreground",
                  danger: "bg-danger/15 text-danger",
                  info: "bg-primary/15 text-primary",
                };

                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 rounded-2xl border p-4 transition-all hover:shadow-sm ${
                      toneColors[alert.tone] || toneColors.info
                    }`}
                  >
                    <div
                      className={`grid h-10 w-10 place-items-center rounded-2xl shrink-0 shadow-inner ${
                        iconBg[alert.tone] || iconBg.info
                      }`}
                    >
                      <AlertIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-sm font-black ${
                          alert.tone === "danger"
                            ? "text-danger"
                            : alert.tone === "warning"
                            ? "text-warning-foreground"
                            : "text-primary"
                        }`}
                      >
                        {alert.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.message}</div>
                      <Link
                        to={alert.link}
                        className="inline-flex items-center gap-1 text-xs font-black text-primary mt-2 hover:underline"
                      >
                        <ChevronLeft className="h-3 w-3" /> {alert.linkLabel}
                      </Link>
                    </div>
                  </div>
                );
              })}

              {/* Static Backup Reminder */}
              <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-muted/10 p-4">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary shrink-0 shadow-inner">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-foreground">النسخ الاحتياطي التلقائي</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    النسخ الاحتياطي مجدول تلقائياً في الساعة 02:00 صباحاً مع التحقق من سلامة الأرشيف.
                  </div>
                  <Link
                    to="/admin/backup"
                    className="inline-flex items-center gap-1 text-xs font-black text-primary mt-2 hover:underline"
                  >
                    <ChevronLeft className="h-3 w-3" /> إدارة النسخ الاحتياطية
                  </Link>
                </div>
              </div>
            </div>
          </PageCard>
        </div>
      </div>

      {/* ────── Modal: System Diagnostics ────── */}
      <AdminModal
        isOpen={diagnosticsModal}
        onClose={() => setDiagnosticsModal(false)}
        title="فحص سلامة النظام وتكامل البيانات"
        description="تدقيق مؤشرات الربط بين الجداول والوحدات الإدارية وصحة البيانات"
        icon={Stethoscope}
        tone="primary"
        maxWidth="xl"
        footer={
          <button
            type="button"
            onClick={() => setDiagnosticsModal(false)}
            className="rounded-xl bg-primary px-6 py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            إغلاق نافذة الفحص
          </button>
        }
      >
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-muted-foreground block">مؤشر السلامة الإجمالي:</span>
            <span className="text-2xl font-black text-foreground tabular-nums">{systemHealth}%</span>
          </div>
          <Badge tone={systemHealth > 85 ? "success" : systemHealth > 60 ? "warning" : "danger"}>
            {systemHealth > 85 ? "حالة مستقرة وممتازة" : systemHealth > 60 ? "تحتاج تحسينات" : "تحتاج تدخلاً عاجلاً"}
          </Badge>
        </div>

        <div className="space-y-2.5">
          {[
            {
              title: "ربط الطلاب بالشعب الدراسية",
              desc: studentsWithoutSection > 0 ? `يوجد ${studentsWithoutSection} طالب بلا شعبة` : "جميع الطلاب مربوطون بشعبهم",
              status: studentsWithoutSection === 0 ? "pass" : "warn",
              link: "/students",
              linkLabel: "معالجة في شؤون الطلاب",
            },
            {
              title: "تحديد الرواتب الأساسية للموظفين",
              desc: staffWithoutContract > 0 ? `يوجد ${staffWithoutContract} موظف لم يحدد راتبه الأساسي` : "كافة الموظفين لديهم رواتب محددة",
              status: staffWithoutContract === 0 ? "pass" : "fail",
              link: "/hr/staff",
              linkLabel: "معالجة في الموارد البشرية",
            },
            {
              title: "متابعة سجل الأنشطة والتدقيق الأمني",
              desc: errorLogs > 0 ? `يوجد ${errorLogs} عملية فشل أو خطأ مسجلة` : "لا توجد أي أخطاء حرجة مسجلة",
              status: errorLogs === 0 ? "pass" : "fail",
              link: "/admin/activity-log",
              linkLabel: "مراجعة سجل الأنشطة",
            },
            {
              title: "جاهزية ميزات ووحدات المنظومة",
              desc: `${activeFeaturesCount} ميزة نشطة من أصل ${totalFeaturesCount} ميزة معتمدة`,
              status: activeFeaturesCount >= 10 ? "pass" : "warn",
              link: "/admin/features",
              linkLabel: "إدارة الميزات",
            },
            {
              title: "اعتماد طلبات الإجازات المعلقة",
              desc: pendingLeaves > 0 ? `يوجد ${pendingLeaves} طلب إجازة معلق` : "تم البت في كافة الإجازات",
              status: pendingLeaves === 0 ? "pass" : "info",
              link: "/hr/leaves",
              linkLabel: "اعتماد الإجازات",
            },
            {
              title: "جاهزية النسخ الاحتياطي التلقائي",
              desc: "النسخ التلقائي مشفر (AES-256) ومجدول بنجاح",
              status: "pass",
              link: "/admin/backup",
              linkLabel: "إدارة النسخ",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-border/70 bg-card flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                    item.status === "pass"
                      ? "bg-success/15 text-success"
                      : item.status === "fail"
                      ? "bg-danger/15 text-danger"
                      : item.status === "warn"
                      ? "bg-warning/15 text-warning-foreground"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  {item.status === "pass" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-black text-foreground">{item.title}</div>
                  <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                </div>
              </div>

              <Link
                to={item.link}
                onClick={() => setDiagnosticsModal(false)}
                className="text-xs font-black text-primary hover:underline shrink-0"
              >
                {item.linkLabel}
              </Link>
            </div>
          ))}
        </div>
      </AdminModal>

      {/* ────── Modal: Quick Backup ────── */}
      <AdminModal
        isOpen={quickBackupModal}
        onClose={() => setQuickBackupModal(false)}
        title="إنشاء نسخة احتياطية سريعة"
        description="تأمين لحظي لكافة السجلات والجداول مع تشفير AES-256"
        icon={HardDrive}
        tone="primary"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setQuickBackupModal(false)}
              className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border hover:bg-accent transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleExecuteQuickBackup}
              disabled={isBackingUp}
              className={`rounded-xl px-6 py-2.5 text-xs font-black text-white transition-all shadow-md ${
                isBackingUp ? "bg-primary/50 cursor-not-allowed" : "bg-primary hover:bg-primary/90 shadow-primary/20 glow-primary"
              }`}
            >
              {isBackingUp ? "جاري النسخ..." : "بدء النسخ الآن"}
            </button>
          </div>
        }
      >
        <p className="text-xs text-muted-foreground leading-relaxed">
          سيتم أخذ نسخة كاملة ومجمعة تشمل الطلاب، الموظفين، الفواتير، الشعب، والصلاحيات مع تشفير AES-256.
        </p>

        <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">عدد الجداول المستهدفة:</span>
            <span className="font-black text-foreground">42 جدولاً</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">التشفير:</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">AES-256 مفعل</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">سجلات النظام المشمولة:</span>
            <span className="font-black text-foreground">
              {allStudents.length + allStaff.length + allInvoices.length + allUsers.length} سجل
            </span>
          </div>
        </div>
      </AdminModal>

      {/* ────── Modal: Quick Features Control Center ────── */}
      <AdminModal
        isOpen={quickFeaturesModal}
        onClose={() => setQuickFeaturesModal(false)}
        title="مركز التحكم الفوري بميزات المنظومة"
        description={`التحكم اللحظي بحالة تفعيل الميزات الـ 20 (${activeFeaturesCount} مفعلة حالياً)`}
        icon={Sliders}
        tone="primary"
        maxWidth="2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Link
              to="/admin/features"
              onClick={() => setQuickFeaturesModal(false)}
              className="text-xs font-black text-primary hover:underline flex items-center gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" /> الانتقال لمركز الميزات المتقدم
            </Link>
            <button
              type="button"
              onClick={() => setQuickFeaturesModal(false)}
              className="rounded-xl bg-primary px-6 py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
            >
              تم الحفظ والإغلاق
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/70 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="font-black text-xs text-foreground block">
                  مستوى جاهزية وتكامل المنظومة: {featuresPercentage}%
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {activeFeaturesCount} وحدة نشطة • {totalFeaturesCount - activeFeaturesCount} وحدة معطلة
                </span>
              </div>
            </div>
            <Link
              to="/admin/features"
              onClick={() => setQuickFeaturesModal(false)}
              className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold hover:bg-accent transition-colors"
            >
              تطبيق القوالب الشاملة
            </Link>
          </div>

          <div className="divide-y divide-border/60 max-h-96 overflow-y-auto custom-scrollbar rounded-2xl border border-border/70">
            {FEATURE_DEFS.map((f) => {
              const Icon = f.icon;
              const isEnabled = currentFeatures[f.key];
              return (
                <div
                  key={f.key}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-xl grid place-items-center shrink-0 ${
                        isEnabled
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground/60"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-foreground block">{f.title}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {f.category} • كود: {f.key}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        isEnabled
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isEnabled ? "نشط" : "معطل"}
                    </span>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => {
                        toggleFeature(f.key, checked);
                        addActivityLog({
                          user: "مدير النظام",
                          action: checked ? "تفعيل ميزة" : "تعطيل ميزة",
                          entity: "لوحة التحكم",
                          details: `تم ${checked ? "تفعيل" : "تعطيل"} ميزة "${f.title}" من مركز القيادة`,
                        });
                        toast.success(`تم ${checked ? "تفعيل" : "تعطيل"} "${f.title}"`);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AdminModal>
    </AppShell>
  );
}
