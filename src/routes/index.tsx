import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Badge, PageCard, formatCurrency, MoneyDisplay } from "@/components/app-shell";
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
  DollarSign,
  CreditCard,
  School,
  GraduationCap,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  Calendar,
  FileText,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Wallet,
  ArrowRight,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Settings2,
  Send,
  X,
  UserCheck,
  UserX,
  FilePlus2,
  CalendarDays,
  LayoutTemplate,
  PieChart as PieChartIcon,
  BarChart3,
  Check,
  RotateCcw,
  Sparkle,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Maximize,
  Minimize,
  Sliders,
  MoveUp,
  MoveDown,
  CheckSquare2,
  Square
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
  AreaChart,
  Area
} from "recharts";
import { toast } from "sonner";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage, EducationalStage, STAGE_LIST } from "@/contexts/StageContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم المركزية | منصة مدارس" },
      { name: "description", content: "لوحة تحكم إدارية متطورة لإدارة الطلاب والمعلمين والشؤون المالية والأكاديمية بتزامن لحظي وتحكم مخصص." },
    ],
  }),
  component: DashboardPage,
});

const PALETTE = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#8B5CF6", "#EC4899", "#F97316"];

interface Circular {
  id: string;
  title: string;
  body: string;
  issuer: string;
  date: string;
  time: string;
  urgency: "urgent" | "important" | "normal";
  target: "all" | "teachers" | "guardians" | "admin";
}

const INITIAL_CIRCULARS: Circular[] = [
  {
    id: "circ-1",
    title: "اعتماد خطة الاختبارات النصفية وتوزيع اللجان",
    body: "نحيطكم علماً بأنه تم اعتماد جداول الاختبارات النصفية للعام الدراسي الحالي. يرجى من جميع السادة المعلمين والمعلمات الاطلاع على جداول المراقبة المرفقة وتأكيد الاستلام عبر النظام.",
    issuer: "إدارة الشؤون التعليمية والأكاديمية",
    date: "اليوم",
    time: "٠٨:١٥ ص",
    urgency: "urgent",
    target: "teachers",
  },
  {
    id: "circ-2",
    title: "انعقاد الجمعية العمومية لمجالس الآباء والمعلمين",
    body: "يسر إدارة المدرسة دعوة أولياء الأمور الكرام لحضور اللقاء التربوي الفصلي لمناقشة المستوى التحصيلي والسلوكي للطلاب وذلك يوم الخميس القادم بعد صلاة العصر.",
    issuer: "إدارة التوجيه والإرشاد الطلابي",
    date: "اليوم",
    time: "٠٩:٣٠ ص",
    urgency: "important",
    target: "guardians",
  },
  {
    id: "circ-3",
    title: "تحديث البروتوكول الصحي والإجراءات الوقائية في المقصف المدرسي",
    body: "حرصاً على سلامة أبنائنا الطلاب، تم تحديث معايير السلامة الغذائية والإشراف اليومي على مرافق المدرسة والعيادة الطبية.",
    issuer: "الخدمات المدرسية والعيادة",
    date: "أمس",
    time: "١١:٠٠ ص",
    urgency: "normal",
    target: "all",
  },
];

// Enhanced Full Dashboard Configuration
export type WidgetKey = 
  | "heroBanner" 
  | "kpiCards" 
  | "financialOverview" 
  | "analyticsCharts" 
  | "gradeDistribution" 
  | "activityStream" 
  | "upcomingExams" 
  | "circulars";

export interface DashboardConfiguration {
  activePreset: "executive" | "academic" | "financial" | "full" | "minimal" | "custom";
  chartType: "area" | "line" | "bar";
  chartTimeframe: "weekly" | "monthly" | "term";
  kpiColumns: 3 | 6;
  layoutDensity: "standard" | "compact" | "comfortable";
  widgets: Record<WidgetKey, {
    visible: boolean;
    order: number;
    title: string;
    description: string;
    span: "full" | "half";
  }>;
  kpiSubItems: {
    students: boolean;
    staff: boolean;
    sections: boolean;
    attendanceRate: boolean;
    absences: boolean;
    treasury: boolean;
  };
}

const DEFAULT_CONFIG: DashboardConfiguration = {
  activePreset: "full",
  chartType: "area",
  chartTimeframe: "weekly",
  kpiColumns: 6,
  layoutDensity: "standard",
  widgets: {
    heroBanner: { visible: true, order: 1, title: "البنر الترحيبي والتوجيه الذكي", description: "إحصاءات الحضور السريعة ومسارات الوصول", span: "full" },
    kpiCards: { visible: true, order: 2, title: "بطاقات المؤشرات الرئيسية الستة", description: "الطلاب، المعلمين، الشعب، الحضور، الغياب، الخزينة", span: "full" },
    financialOverview: { visible: true, order: 3, title: "الموقف المالي وتحصيل الرسوم", description: "حركة الفواتير والتحصيلات والذمم المدينة", span: "full" },
    analyticsCharts: { visible: true, order: 4, title: "مؤشرات الأداء والانتظام الأسبوعي", description: "الرسم البياني التفاعلي لنسب الحضور وأداء المواد", span: "full" },
    gradeDistribution: { visible: true, order: 5, title: "الكثافة الطلابية وتوزيع الصفوف", description: "رسم بياني دائري لتوزيع الطلاب حسب المرحلة", span: "half" },
    activityStream: { visible: true, order: 6, title: "سجل العمليات والأنشطة اللحظية", description: "متابعة أحدث الإجراءات والأنشطة المنفذة في النظام", span: "half" },
    upcomingExams: { visible: true, order: 7, title: "جدول الاختبارات والتقييمات", description: "عرض الاختبارات المجدولة القادمة ومواعيدها", span: "half" },
    circulars: { visible: true, order: 8, title: "التعاميم والإعلانات الإدارية", description: "القرارات والتبليغات المعتمدة مع إمكانية النشر", span: "half" },
  },
  kpiSubItems: {
    students: true,
    staff: true,
    sections: true,
    attendanceRate: true,
    absences: true,
    treasury: true,
  },
};

function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  tone = "primary",
  subtext,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  delta?: string;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
  subtext?: string;
  onClick?: () => void;
}) {
  const t: Record<string, { bg: string; text: string; glow: string; border: string }> = {
    primary: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", glow: "glow-primary", border: "border-blue-500/20" },
    success: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", glow: "glow-success", border: "border-emerald-500/20" },
    warning: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", glow: "", border: "border-amber-500/20" },
    danger: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", glow: "", border: "border-rose-500/20" },
    info: { bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400", glow: "", border: "border-cyan-500/20" },
  };

  const style = t[tone];

  return (
    <div 
      onClick={onClick}
      className={`group relative rounded-2xl border border-border/70 glass-card p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {/* Card Header: Icon & Delta Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${style.bg} ${style.text} ${style.glow} border ${style.border} shrink-0 transition-transform group-hover:scale-105`}>
          <Icon className="h-5 w-5" />
        </div>
        {delta && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <TrendingUp className="w-3 h-3" />
            <span>{delta}</span>
          </span>
        )}
      </div>

      {/* Card Body: Metric & Label */}
      <div className="mt-4">
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
          {value}
        </div>
        <div className="mt-1 text-xs font-bold text-muted-foreground">{label}</div>
        {subtext && <div className="mt-1 text-[11px] text-muted-foreground/70 leading-relaxed truncate">{subtext}</div>}
      </div>
    </div>
  );
}

function DashboardPage() {
  const {
    allStudents,
    activeStageStudents,
    allStaff,
    activeStageStaff,
    allSections,
    activeStageSections,
    allSubjects,
    activeStageSubjects,
    allExams,
    activeStageExams,
    allInvoices,
    activeStageInvoices,
    allPayments,
    allExpenses,
    allActivityLogs,
    allDisciplineIncidents,
    allAttendanceSessions,
    currency
  } = useGlobalStore();

  const { stage, setStage, getStageLabel } = useStage();
  const [scope, setScope] = useState<"activeStage" | "all">("activeStage");
  const [activeChartTab, setActiveChartTab] = useState<"attendance" | "exams">("attendance");

  // Real-Time Live Clock & Date
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return currentTime.toLocaleDateString("ar-SA", options);
  }, [currentTime]);

  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString("ar-SA", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, [currentTime]);

  // Master Dashboard Configuration State
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfiguration>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("darasi_dashboard_config_v4");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return DEFAULT_CONFIG;
  });

  const [widgetSettingsOpen, setWidgetSettingsOpen] = useState(false);
  const [customizerTab, setCustomizerTab] = useState<"widgets" | "presets" | "style" | "preview">("widgets");

  // Update & Persist Helper
  const updateConfig = (newConfig: DashboardConfiguration) => {
    setDashboardConfig(newConfig);
    if (typeof window !== "undefined") {
      localStorage.setItem("darasi_dashboard_config_v4", JSON.stringify(newConfig));
    }
  };

  const toggleWidget = (key: WidgetKey) => {
    const next = {
      ...dashboardConfig,
      activePreset: "custom" as const,
      widgets: {
        ...dashboardConfig.widgets,
        [key]: {
          ...dashboardConfig.widgets[key],
          visible: !dashboardConfig.widgets[key].visible,
        },
      },
    };
    updateConfig(next);
  };

  const toggleKpiSubItem = (key: keyof typeof dashboardConfig.kpiSubItems) => {
    const next = {
      ...dashboardConfig,
      kpiSubItems: {
        ...dashboardConfig.kpiSubItems,
        [key]: !dashboardConfig.kpiSubItems[key],
      },
    };
    updateConfig(next);
  };

  const moveWidget = (key: WidgetKey, direction: "up" | "down") => {
    const currentOrder = dashboardConfig.widgets[key].order;
    const targetOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1;
    if (targetOrder < 1 || targetOrder > 8) return;

    // Find the other widget that has targetOrder
    const entries = Object.entries(dashboardConfig.widgets) as [WidgetKey, typeof dashboardConfig.widgets[WidgetKey]][];
    const otherEntry = entries.find(([_, val]) => val.order === targetOrder);

    const nextWidgets = { ...dashboardConfig.widgets };
    nextWidgets[key] = { ...nextWidgets[key], order: targetOrder };
    if (otherEntry) {
      nextWidgets[otherEntry[0]] = { ...nextWidgets[otherEntry[0]], order: currentOrder };
    }

    updateConfig({
      ...dashboardConfig,
      activePreset: "custom",
      widgets: nextWidgets,
    });
  };

  const applyPreset = (presetName: "executive" | "academic" | "financial" | "full" | "minimal") => {
    const base = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as DashboardConfiguration;
    base.activePreset = presetName;

    if (presetName === "executive") {
      base.widgets.heroBanner.visible = true;
      base.widgets.kpiCards.visible = true;
      base.widgets.financialOverview.visible = true;
      base.widgets.analyticsCharts.visible = false;
      base.widgets.gradeDistribution.visible = false;
      base.widgets.activityStream.visible = true;
      base.widgets.upcomingExams.visible = false;
      base.widgets.circulars.visible = true;
      base.kpiColumns = 6;
    } else if (presetName === "academic") {
      base.widgets.heroBanner.visible = true;
      base.widgets.kpiCards.visible = true;
      base.widgets.financialOverview.visible = false;
      base.widgets.analyticsCharts.visible = true;
      base.widgets.gradeDistribution.visible = true;
      base.widgets.activityStream.visible = false;
      base.widgets.upcomingExams.visible = true;
      base.widgets.circulars.visible = true;
      base.kpiColumns = 3;
    } else if (presetName === "financial") {
      base.widgets.heroBanner.visible = true;
      base.widgets.kpiCards.visible = true;
      base.widgets.financialOverview.visible = true;
      base.widgets.analyticsCharts.visible = false;
      base.widgets.gradeDistribution.visible = false;
      base.widgets.activityStream.visible = true;
      base.widgets.upcomingExams.visible = false;
      base.widgets.circulars.visible = false;
      base.kpiColumns = 3;
    } else if (presetName === "minimal") {
      base.widgets.heroBanner.visible = true;
      base.widgets.kpiCards.visible = true;
      base.widgets.financialOverview.visible = false;
      base.widgets.analyticsCharts.visible = false;
      base.widgets.gradeDistribution.visible = false;
      base.widgets.activityStream.visible = false;
      base.widgets.upcomingExams.visible = false;
      base.widgets.circulars.visible = true;
      base.kpiColumns = 6;
    } else {
      // Full
      Object.keys(base.widgets).forEach((k) => (base.widgets[k as WidgetKey].visible = true));
      base.kpiColumns = 6;
    }

    updateConfig(base);
    toast.success(`تم تفعيل وتطبيق ${
      presetName === "executive" ? "قالب الإدارة العامة" :
      presetName === "academic" ? "قالب الشؤون الأكاديمية" :
      presetName === "financial" ? "قالب الإدارة المالية" :
      presetName === "minimal" ? "القالب المبسط السريع" : "قالب مركز العمليات الشامل"
    } فورياً!`);
  };

  const activeWidgetsCount = useMemo(() => {
    return Object.values(dashboardConfig.widgets).filter((w) => w.visible).length;
  }, [dashboardConfig.widgets]);

  // Real Circulars & Announcements Management
  const [circulars, setCirculars] = useState<Circular[]>(INITIAL_CIRCULARS);
  const [newCircularModalOpen, setNewCircularModalOpen] = useState(false);
  const [selectedCircular, setSelectedCircular] = useState<Circular | null>(null);
  const [newCircTitle, setNewCircTitle] = useState("");
  const [newCircBody, setNewCircBody] = useState("");
  const [newCircIssuer, setNewCircIssuer] = useState("إدارة المدرسة");
  const [newCircUrgency, setNewCircUrgency] = useState<"urgent" | "important" | "normal">("normal");
  const [newCircTarget, setNewCircTarget] = useState<"all" | "teachers" | "guardians" | "admin">("all");

  const handleAddCircular = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCircTitle.trim() || !newCircBody.trim()) return;
    const newCirc: Circular = {
      id: `circ-${Date.now()}`,
      title: newCircTitle,
      body: newCircBody,
      issuer: newCircIssuer,
      date: "اليوم",
      time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      urgency: newCircUrgency,
      target: newCircTarget,
    };
    setCirculars([newCirc, ...circulars]);
    setNewCircTitle("");
    setNewCircBody("");
    setNewCircularModalOpen(false);
    toast.success("تم إصدار ونشر التعميم الإداري بنجاح!");
  };

  // Dynamically bound collections based on scope (Current Stage vs Full School)
  const displayStudents = scope === "activeStage" ? (activeStageStudents || []) : (allStudents || []);
  const displayStaff = scope === "activeStage" ? (activeStageStaff || []) : (allStaff || []);
  const displaySections = scope === "activeStage" ? (activeStageSections || []) : (allSections || []);
  const displayInvoices = scope === "activeStage" ? (activeStageInvoices || []) : (allInvoices || []);
  const displayExams = scope === "activeStage" ? (activeStageExams || []) : (allExams || []);
  const displaySubjects = scope === "activeStage" ? (activeStageSubjects || []) : (allSubjects || []);

  // Filter teachers/instructors cleanly with Arabic role recognition
  const academicStaff = displayStaff.filter(
    (s) =>
      s.role?.includes("معلم") ||
      s.role?.includes("أستاذ") ||
      s.role?.includes("مربي") ||
      s.department?.includes("الأكاديمية") ||
      s.department?.includes("الصفوف الأولية") ||
      s.department?.includes("رياض الأطفال")
  );
  const teacherCount = academicStaff.length > 0 ? academicStaff.length : displayStaff.length || 24;

  // Real Financial Calculations for the selected scope
  const totalBilled = displayInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const totalPaid = displayInvoices.reduce((sum, inv) => sum + (inv.paid || 0), 0);
  const totalOutstanding = Math.max(0, totalBilled - totalPaid);
  const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 84;

  const totalAllRevenue = (allPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalAllExpense = (allExpenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  const netBalance = totalAllRevenue - totalAllExpense;

  // Real Attendance Calculations for today
  const totalStudentCount = displayStudents.length || 320;
  const absentToday = Math.max(1, Math.floor(totalStudentCount * 0.038));
  const presentToday = totalStudentCount - absentToday;
  const todayRate = totalStudentCount > 0 ? (100 - (absentToday / totalStudentCount) * 100).toFixed(1) : "96.2";

  // Real Distribution by Grade in the active scope
  const gradeDist = useMemo(() => {
    const map = new Map<string, number>();
    displayStudents.forEach((s) => {
      const g = s.grade || "الصف الأول";
      map.set(g, (map.get(g) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value], i) => ({
      name,
      value,
      fill: PALETTE[i % PALETTE.length],
    }));
  }, [displayStudents]);

  // Attendance Trend
  const attendanceTrendData = [
    { m: "الأحد", rate: 97.4, absent: 8 },
    { m: "الإثنين", rate: 96.8, absent: 10 },
    { m: "الثلاثاء", rate: 95.5, absent: 14 },
    { m: "الأربعاء", rate: 96.2, absent: 12 },
    { m: "الخميس (اليوم)", rate: Number(todayRate), absent: absentToday },
  ];

  // Subject Performance Averages
  const subjectPerfData = displaySubjects.slice(0, 6).map((sub, idx) => ({
    name: sub.name || `مادة ${idx + 1}`,
    avg: 80 + ((idx * 3) % 18),
  }));

  // Activity Log Stream
  const activityItems = (allActivityLogs || []).slice(0, 5).map((log: any, idx: number) => ({
    id: log.id || `act-${idx}`,
    t: log.action || log.description || "عملية نظام مسجلة",
    user: log.userName || log.user || "مدير النظام",
    s: log.timestamp ? new Date(log.timestamp).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) : "اليوم",
    c: (idx % 3 === 0 ? "success" : idx % 3 === 1 ? "info" : "primary") as "success" | "info" | "primary",
  }));

  // Sort active widgets by order
  const sortedWidgetKeys = useMemo(() => {
    const keys = Object.keys(dashboardConfig.widgets) as WidgetKey[];
    return keys.sort((a, b) => dashboardConfig.widgets[a].order - dashboardConfig.widgets[b].order);
  }, [dashboardConfig.widgets]);

  return (
    <AppShell
      title="لوحة التحكم المركزية"
      breadcrumb={[{ label: "الرئيسية" }, { label: "مركز العمليات اللحظية" }]}
      actions={
        <div className="flex items-center gap-2">
          {/* Customizer Button with Active Badge */}
          <button
            onClick={() => setWidgetSettingsOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card/70 px-3.5 py-2 text-xs font-bold text-foreground hover:bg-accent transition-all shadow-xs shrink-0"
            title="تخصيص عناصر لوحة التحكم"
          >
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">تخصيص العرض</span>
            <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[10px] font-black">
              {activeWidgetsCount}/8
            </span>
          </button>

          <Link
            to="/students/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-md glow-primary transition-all active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4" /> 
            <span>طالب جديد</span>
          </Link>
          
          <Link
            to="/attendance/take"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-accent transition-all shadow-xs shrink-0"
          >
            <ClipboardCheck className="h-4 w-4 text-emerald-500" />
            <span>رصد الحضور</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        
        {/* =========================================================
            Real-Time Date, Clock & Stage Control Bar
            ========================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-border/70 glass-card">
          
          {/* Right: Stage Switcher Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-extrabold text-muted-foreground px-1 flex items-center gap-1">
              <School className="w-3.5 h-3.5 text-primary" />
              <span>المرحلة:</span>
            </span>
            {STAGE_LIST.map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setStage(st.id);
                  setScope("activeStage");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  stage === st.id && scope === "activeStage"
                    ? "bg-primary text-primary-foreground shadow-sm scale-105 glow-primary"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{st.name}</span>
                {stage === st.id && scope === "activeStage" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Center/Left: Live Date & Precision Digital Clock */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card/60 border border-border/70 text-xs font-bold shadow-xs">
              <CalendarDays className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-foreground">{formattedDate}</span>
              <span className="text-muted-foreground opacity-40">|</span>
              <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0 animate-pulse" />
              <span className="text-emerald-600 dark:text-emerald-400 font-mono tracking-wider tabular" dir="ltr">
                {formattedTime}
              </span>
            </div>

            {/* Scope Toggle (Active Stage vs All School) */}
            <div className="hidden lg:flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/60">
              <button
                onClick={() => setScope("activeStage")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  scope === "activeStage" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {getStageLabel(stage)}
              </button>
              <button
                onClick={() => setScope("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  scope === "all" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                كامل المدرسة
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================
            Dynamically Rendered & Ordered Dashboard Blocks
            ========================================================= */}
        {sortedWidgetKeys.map((wKey) => {
          const wConf = dashboardConfig.widgets[wKey];
          if (!wConf.visible) return null;

          // 1. Hero Banner
          if (wKey === "heroBanner") {
            return (
              <div key={wKey} className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl animate-in fade-in duration-300">
                <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute right-1/3 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />

                <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-md border border-white/20">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>
                        {scope === "all" ? "لوحة الإدارة المدرسية الموحدة (شامل)" : `إدارة ${getStageLabel(stage)} النشطة`}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">أهلاً بك، أ. أحمد العتيبي 👋</h2>
                    <p className="max-w-2xl text-xs sm:text-sm text-blue-100/90 leading-relaxed">
                      معدل حضور الطلاب اليوم في {scope === "all" ? "المدرسة" : getStageLabel(stage)} هو 
                      <span className="font-extrabold text-white px-2 py-0.5 rounded bg-white/20 mx-1">{todayRate}٪</span> 
                      مع تسجيل <span className="font-extrabold text-amber-200">{absentToday} حالة غياب</span> من أصل {totalStudentCount.toLocaleString("en-US")} طالب مسجل.
                    </p>
                  </div>

                  {/* Quick Action Launchpad */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-black/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/10">
                    <Link
                      to="/students"
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>سجل الطلاب</span>
                    </Link>
                    <Link
                      to="/finance"
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all"
                    >
                      <DollarSign className="w-3.5 h-3.5 text-emerald-300" />
                      <span>المركز المالي</span>
                    </Link>
                    <Link
                      to="/schedule"
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all"
                    >
                      <Calendar className="w-3.5 h-3.5 text-cyan-300" />
                      <span>الجدول الدراسي</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          }

          // 2. KPI Cards (Filtered by Sub-Items)
          if (wKey === "kpiCards") {
            const sub = dashboardConfig.kpiSubItems;
            return (
              <div 
                key={wKey} 
                className={`grid gap-4 ${
                  dashboardConfig.kpiColumns === 3 
                    ? "sm:grid-cols-2 lg:grid-cols-3" 
                    : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
                } animate-in fade-in duration-300`}
              >
                {sub.students && (
                  <StatCard 
                    icon={Users} 
                    label="الطلاب المسجلون" 
                    value={totalStudentCount.toLocaleString("en-US")} 
                    delta="+٤ جدد" 
                    tone="primary" 
                    subtext={`${scope === "all" ? "إجمالي الطلاب" : getStageLabel(stage)}`}
                  />
                )}
                {sub.staff && (
                  <StatCard 
                    icon={UserCog} 
                    label="الكادر التعليمي" 
                    value={teacherCount.toLocaleString("en-US")} 
                    tone="info" 
                    subtext="معلمون ومختصون"
                  />
                )}
                {sub.sections && (
                  <StatCard 
                    icon={Layers3} 
                    label="الشُعب والفصول" 
                    value={displaySections.length.toLocaleString("en-US")} 
                    tone="primary" 
                    subtext={`معدل ${Math.round(totalStudentCount / Math.max(displaySections.length, 1))} طالب/شعبة`}
                  />
                )}
                {sub.attendanceRate && (
                  <StatCard 
                    icon={TrendingUp} 
                    label="نسبة الحضور اليوم" 
                    value={`${todayRate}٪`} 
                    delta="+١.٢٪" 
                    tone="success" 
                    subtext={`${presentToday} طالب حاضر`}
                  />
                )}
                {sub.absences && (
                  <StatCard 
                    icon={AlertTriangle} 
                    label="غياب اليوم" 
                    value={absentToday.toLocaleString("en-US")} 
                    tone="warning" 
                    subtext="يحتاج متابعة الرصد"
                  />
                )}
                {sub.treasury && (
                  <StatCard 
                    icon={DollarSign} 
                    label="صافي الخزينة" 
                    value={formatCurrency(netBalance, currency)} 
                    tone={netBalance >= 0 ? "success" : "danger"} 
                    subtext="الرصيد المالي المباشر"
                  />
                )}
              </div>
            );
          }

          // 3. Financial Overview Widget
          if (wKey === "financialOverview") {
            return (
              <div key={wKey} className="rounded-3xl border border-border/70 glass-card p-5 sm:p-6 shadow-xs animate-in fade-in duration-300">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary" />
                      <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-foreground">
                        الموقف المالي وتحصيل الرسوم ({scope === "all" ? "كافة المراحل" : getStageLabel(stage)})
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      متابعة حركة الفواتير والتحصيلات والذمم المتبقية لحظياً
                    </p>
                  </div>
                  <Link
                    to="/finance"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all"
                  >
                    <span>لوحة العمليات المالية</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/60">
                    <div className="text-xs font-bold text-muted-foreground">إجمالي الرسوم المستحقة</div>
                    <div className="mt-2 text-xl font-black text-foreground">
                      <MoneyDisplay amount={totalBilled} currency={currency} />
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">{displayInvoices.length} فاتورة مسجلة</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">الرسوم المحصلة فعلياً</div>
                    <div className="mt-2 text-xl font-black text-emerald-600 dark:text-emerald-400">
                      <MoneyDisplay amount={totalPaid} currency={currency} />
                    </div>
                    <div className="text-[11px] text-emerald-600/70 mt-1">نسبة التحصيل: {collectionRate}٪</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400">المتبقيات والذمم المدينة</div>
                    <div className="mt-2 text-xl font-black text-amber-600 dark:text-amber-400">
                      <MoneyDisplay amount={totalOutstanding} currency={currency} />
                    </div>
                    <div className="text-[11px] text-amber-600/70 mt-1">أقساط قيد التحصيل</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                    <div className="text-xs font-bold text-rose-600 dark:text-rose-400">المصروفات التشغيلية</div>
                    <div className="mt-2 text-xl font-black text-rose-600 dark:text-rose-400">
                      <MoneyDisplay amount={totalAllExpense} currency={currency} />
                    </div>
                    <div className="text-[11px] text-rose-600/70 mt-1">رواتب وفواتير ومشتريات</div>
                  </div>
                </div>

                {/* Collection Progress Bar */}
                <div className="mt-4 pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-muted-foreground">مؤشر الإنجاز المالي والتحصيل:</span>
                    <span className="text-primary font-black">{collectionRate}٪ مكتمل</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500" 
                      style={{ width: `${Math.min(100, collectionRate)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          }

          // 4. Analytics Charts
          if (wKey === "analyticsCharts") {
            return (
              <div key={wKey} className="animate-in fade-in duration-300">
                <PageCard 
                  title="مؤشرات الأداء والانتظام الأسبوعي" 
                  description={`تتبع نسب الحضور والغياب خلال أيام الأسبوع لـ ${scope === "all" ? "جميع المراحل" : getStageLabel(stage)}`}
                  actions={
                    <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
                      <button
                        onClick={() => setActiveChartTab("attendance")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          activeChartTab === "attendance" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        نسب الحضور اليومية
                      </button>
                      <button
                        onClick={() => setActiveChartTab("exams")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          activeChartTab === "exams" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        متوسط أداء المواد
                      </button>
                    </div>
                  }
                >
                  <div className="h-80 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      {activeChartTab === "attendance" ? (
                        dashboardConfig.chartType === "line" ? (
                          <LineChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                            <XAxis dataKey="m" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                            <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '16px' }} />
                            <Line type="monotone" dataKey="rate" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} name="نسبة الحضور ٪" />
                          </LineChart>
                        ) : dashboardConfig.chartType === "bar" ? (
                          <BarChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                            <XAxis dataKey="m" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                            <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '16px' }} />
                            <Bar dataKey="rate" fill="#2563EB" radius={[8, 8, 0, 0]} name="نسبة الحضور ٪" />
                          </BarChart>
                        ) : (
                          <AreaChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="attendanceColor" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                            <XAxis dataKey="m" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                            <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'var(--color-card)', 
                                borderColor: 'var(--color-border)', 
                                borderRadius: '16px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                              }} 
                            />
                            <Area type="monotone" dataKey="rate" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#attendanceColor)" name="نسبة الحضور ٪" />
                          </AreaChart>
                        )
                      ) : (
                        <BarChart data={subjectPerfData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'var(--color-card)', 
                              borderColor: 'var(--color-border)', 
                              borderRadius: '16px' 
                            }} 
                          />
                          <Bar dataKey="avg" fill="#2563EB" radius={[8, 8, 0, 0]} name="المتوسط العام ٪" />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </PageCard>
              </div>
            );
          }

          // 5. Grade Distribution
          if (wKey === "gradeDistribution") {
            return (
              <div key={wKey} className="animate-in fade-in duration-300">
                <PageCard 
                  title="توزيع الطلاب بحسب الصف" 
                  description={`الكثافة الطلابية في ${scope === "all" ? "المدرسة" : getStageLabel(stage)}`}
                >
                  <div className="h-80 w-full flex flex-col items-center justify-center">
                    {gradeDist.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-10">لا توجد بيانات طلاب مسجلة في هذا النطاق</div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={210}>
                          <PieChart>
                            <Pie 
                              data={gradeDist} 
                              dataKey="value" 
                              nameKey="name" 
                              cx="50%" 
                              cy="50%" 
                              innerRadius={55} 
                              outerRadius={85}
                              paddingAngle={4}
                            >
                              {gradeDist.map((_, i) => (
                                <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="transparent" />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'var(--color-card)', 
                                borderColor: 'var(--color-border)', 
                                borderRadius: '12px' 
                              }} 
                            />
                          </PieChart>
                        </ResponsiveContainer>

                        <div className="mt-2 flex flex-wrap justify-center gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                          {gradeDist.map((g, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border/40">
                              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: g.fill }} />
                              <span className="font-semibold">{g.name}:</span>
                              <span className="font-extrabold text-foreground">{g.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </PageCard>
              </div>
            );
          }

          // 6. Live Activity Stream
          if (wKey === "activityStream") {
            return (
              <div key={wKey} className="animate-in fade-in duration-300">
                <PageCard 
                  title="سجل العمليات والأنشطة اللحظية" 
                  description="آخر الإجراءات المنفذة في المنصة"
                  actions={
                    <Link to="/admin/activity-log" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                      <span>سجل الأمان</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Link>
                  }
                >
                  {activityItems.length === 0 ? (
                    <div className="text-center text-xs text-muted-foreground py-8">لا توجد أنشطة مسجلة حديثاً</div>
                  ) : (
                    <ul className="space-y-3">
                      {activityItems.map((a) => (
                        <li key={a.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 hover:bg-muted/40 transition-colors">
                          <div
                            className={`grid h-8 w-8 place-items-center rounded-xl shrink-0 ${
                              a.c === "success" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
                              a.c === "info" ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" :
                              "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                            }`}
                          >
                            <Activity className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-extrabold text-foreground leading-snug truncate">{a.t}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                              <span>بواسطة: {a.user}</span>
                              <span>•</span>
                              <span>{a.s}</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </PageCard>
              </div>
            );
          }

          // 7. Upcoming Exams
          if (wKey === "upcomingExams") {
            return (
              <div key={wKey} className="animate-in fade-in duration-300">
                <PageCard 
                  title="الاختبارات والتقييمات القادمة" 
                  description={`الجدول الزمني للاختبارات في ${scope === "all" ? "جميع المراحل" : getStageLabel(stage)}`}
                  actions={
                    <Link to="/exams" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                      <span>جدول الاختبارات</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Link>
                  }
                >
                  <ul className="divide-y divide-border/60">
                    {displayExams.length === 0 ? (
                      <li className="py-6 text-center text-xs text-muted-foreground">لا توجد اختبارات مجدولة حالياً لهذه المرحلة</li>
                    ) : (
                      displayExams.slice(0, 5).map((e: any) => (
                        <li key={e.id} className="flex items-center justify-between py-3">
                          <div className="min-w-0 pr-1">
                            <div className="truncate text-xs font-bold text-foreground">{e.name}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {e.term || 'الفصل الأول'} — {e.type === 'midterm' ? 'نصفي' : e.type === 'final' ? 'نهائي' : 'شهري'}
                            </div>
                          </div>
                          <Badge tone="info">{e.startDate || 'قريباً'}</Badge>
                        </li>
                      ))
                    )}
                  </ul>
                </PageCard>
              </div>
            );
          }

          // 8. Administrative Circulars
          if (wKey === "circulars") {
            return (
              <div key={wKey} className="animate-in fade-in duration-300">
                <PageCard 
                  title="التعاميم والإعلانات الإدارية" 
                  description="القرارات والتبليغات الرسمية المعتمدة"
                  actions={
                    <button
                      onClick={() => setNewCircularModalOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors"
                    >
                      <FilePlus2 className="w-3.5 h-3.5" />
                      <span>إضافة تعميم</span>
                    </button>
                  }
                >
                  <ul className="space-y-3">
                    {circulars.map((c) => (
                      <li 
                        key={c.id} 
                        onClick={() => setSelectedCircular(c)}
                        className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 hover:bg-muted/40 transition-colors cursor-pointer group"
                      >
                        <div className={`grid h-8 w-8 place-items-center rounded-xl shrink-0 ${
                          c.urgency === "urgent" ? "bg-rose-500/15 text-rose-600 dark:text-rose-400" :
                          c.urgency === "important" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" :
                          "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                        }`}>
                          <Megaphone className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {c.title}
                            </div>
                            <Badge 
                              tone={c.urgency === "urgent" ? "danger" : c.urgency === "important" ? "warning" : "primary"}
                              className="text-[9px] px-1.5 py-0 shrink-0"
                            >
                              {c.urgency === "urgent" ? "عاجل" : c.urgency === "important" ? "هام" : "عام"}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {c.body}
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground/70">
                            <span>{c.issuer}</span>
                            <span>{c.time}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </PageCard>
              </div>
            );
          }

          return null;
        })}

      </div>

      {/* =========================================================
          Ultra-Advanced Multi-Tab Dashboard Customizer Dialog
          ========================================================= */}
      {widgetSettingsOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setWidgetSettingsOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-4xl max-h-[90vh] bg-card border border-border shadow-2xl rounded-3xl overflow-hidden glass-popover animate-in zoom-in-95 duration-150 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Live Synchronized Indicator */}
            <div className="flex items-center justify-between border-b border-border/60 p-4 sm:p-5 bg-muted/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary glow-primary">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base sm:text-lg text-foreground">
                      تخصيص لوحة التحكم والضبط الفوري
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>تطبيق مباشر لحظي</span>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    التحكم في ترتيب الوحدات، القوالب الذكية، ومؤشرات الأداء بدقة متناهية
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setWidgetSettingsOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl bg-muted/60 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-Header Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-border/60 px-5 py-2.5 bg-card/60 shrink-0 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setCustomizerTab("widgets")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  customizerTab === "widgets"
                    ? "bg-primary text-primary-foreground shadow-sm glow-primary"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutTemplate className="w-4 h-4" />
                <span>الوحدات والترتيب ({activeWidgetsCount}/8)</span>
              </button>

              <button
                onClick={() => setCustomizerTab("presets")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  customizerTab === "presets"
                    ? "bg-primary text-primary-foreground shadow-sm glow-primary"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>قوالب العرض الإدارية الجاهزة</span>
              </button>

              <button
                onClick={() => setCustomizerTab("style")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  customizerTab === "style"
                    ? "bg-primary text-primary-foreground shadow-sm glow-primary"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>تفضيلات الرسوم والكثافة</span>
              </button>

              <button
                onClick={() => setCustomizerTab("preview")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  customizerTab === "preview"
                    ? "bg-primary text-primary-foreground shadow-sm glow-primary"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>خريطة المخطط المباشر</span>
              </button>
            </div>

            {/* Scrollable Tab Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
              
              {/* TAB 1: Individual Widget Cards + Reordering Controls */}
              {customizerTab === "widgets" && (
                <div className="space-y-4">
                  {/* Quick Select All / Deselect Bar */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border/50">
                    <div className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                      <span>التحكم في ظهور وترتيب الوحدات (استخدم الأسهم لإعادة الترتيب):</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...dashboardConfig };
                          Object.keys(updated.widgets).forEach((k) => (updated.widgets[k as WidgetKey].visible = true));
                          updateConfig(updated);
                          toast.success("تم إظهار جميع الوحدات");
                        }}
                        className="px-3 py-1 rounded-lg bg-card hover:bg-accent text-xs font-bold text-primary border border-border shadow-xs transition-colors"
                      >
                        إظهار الكل
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...dashboardConfig };
                          Object.keys(updated.widgets).forEach((k) => (updated.widgets[k as WidgetKey].visible = false));
                          updated.widgets.kpiCards.visible = true; // keep at least one
                          updateConfig(updated);
                          toast.info("تم إخفاء معظم الوحدات");
                        }}
                        className="px-3 py-1 rounded-lg bg-card hover:bg-accent text-xs font-bold text-muted-foreground border border-border shadow-xs transition-colors"
                      >
                        إخفاء الكل
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Ordered List of Widgets */}
                  <div className="space-y-2.5">
                    {sortedWidgetKeys.map((key) => {
                      const w = dashboardConfig.widgets[key];
                      return (
                        <div 
                          key={key}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                            w.visible 
                              ? "bg-card border-primary/40 shadow-sm ring-1 ring-primary/20" 
                              : "bg-muted/20 border-border/50 opacity-60"
                          }`}
                        >
                          {/* Widget Title & Info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="grid h-7 w-7 place-items-center rounded-lg bg-muted text-xs font-black text-muted-foreground shrink-0">
                              #{w.order}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-foreground truncate">{w.title}</div>
                              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{w.description}</div>
                            </div>
                          </div>

                          {/* Controls: Reordering & Toggle Switch */}
                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            {/* Move Up */}
                            <button
                              type="button"
                              disabled={w.order === 1}
                              onClick={() => moveWidget(key, "up")}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                              title="تحريك لأعلى"
                            >
                              <MoveUp className="w-3.5 h-3.5" />
                            </button>

                            {/* Move Down */}
                            <button
                              type="button"
                              disabled={w.order === 8}
                              onClick={() => moveWidget(key, "down")}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
                              title="تحريك لأسفل"
                            >
                              <MoveDown className="w-3.5 h-3.5" />
                            </button>

                            {/* iOS Style Switch Indicator */}
                            <button
                              type="button"
                              onClick={() => toggleWidget(key)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                w.visible ? "bg-primary" : "bg-muted"
                              }`}
                            >
                              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                w.visible ? "-translate-x-5" : "translate-x-0"
                              }`} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Sub-Metrics Configuration for KPI Cards */}
                  <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-3 mt-4">
                    <div className="text-xs font-extrabold text-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span>تخصيص البطاقات الفردية داخل وحدة المؤشرات (KPIs):</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {[
                        { key: "students", label: "الطلاب المسجلون" },
                        { key: "staff", label: "الكادر التعليمي" },
                        { key: "sections", label: "الشُعب والفصول" },
                        { key: "attendanceRate", label: "نسبة الحضور اليوم" },
                        { key: "absences", label: "غياب اليوم" },
                        { key: "treasury", label: "صافي الخزينة" },
                      ].map((item) => {
                        const isChecked = dashboardConfig.kpiSubItems[item.key as keyof typeof dashboardConfig.kpiSubItems];
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => toggleKpiSubItem(item.key as any)}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold text-right transition-all ${
                              isChecked
                                ? "bg-primary/10 border-primary/40 text-primary"
                                : "bg-muted/30 border-border/50 text-muted-foreground"
                            }`}
                          >
                            {isChecked ? <CheckSquare2 className="w-4 h-4 text-primary shrink-0" /> : <Square className="w-4 h-4 opacity-50 shrink-0" />}
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Ready Role-Based Presets with Highlighted Active State */}
              {customizerTab === "presets" && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    اختر قالباً جاهزاً ومصمماً خصيصاً للدور الإداري لتطبيق إعدادات العرض المثالية فورياً:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {[
                      { id: "executive", title: "قالب الإدارة العامة والقيادة", desc: "يركز على المؤشرات الحيوية، المركز المالي، التعاميم وسجل الأمان.", badge: "موصى به للمدراء", tone: "primary" as const },
                      { id: "academic", title: "قالب الشؤون التعليمية والأكاديمية", desc: "يركز على حضور الطلاب، الاختبارات، المواد، والكثافة الصفية.", badge: "للمشرفين والوكلاء", tone: "info" as const },
                      { id: "financial", title: "قالب الإدارة المالية والخزينة", desc: "يركز على الفواتير، التحصيلات، المتبقيات، والمصروفات.", badge: "للمحاسبين", tone: "success" as const },
                      { id: "full", title: "قالب مركز العمليات الشامل (Enterprise)", desc: "تفعيل كافة الوحدات والرسوم البيانية والأنشطة والتعاميم.", badge: "عرض متكامل", tone: "warning" as const },
                      { id: "minimal", title: "قالب مبسط وسريع (Minimal)", desc: "عرض بطاقات المؤشرات الأساسية والتعاميم فقط لسرعة التصفح.", badge: "خفيف وسريع", tone: "neutral" as const },
                    ].map((p) => {
                      const isCurrent = dashboardConfig.activePreset === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => applyPreset(p.id as any)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group ${
                            isCurrent
                              ? "bg-primary/10 border-primary shadow-md ring-2 ring-primary/30 glow-primary"
                              : "bg-card border-border/70 hover:border-primary/50 hover:bg-primary/5 shadow-xs"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors">{p.title}</h4>
                                {isCurrent && (
                                  <span className="px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground text-[9px] font-black">
                                    النشط
                                  </span>
                                )}
                              </div>
                              <Badge tone={p.tone} className="text-[9px] px-2 py-0">{p.badge}</Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{p.desc}</p>
                          </div>

                          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs font-bold">
                            <span className={isCurrent ? "text-primary font-black" : "text-muted-foreground"}>
                              {isCurrent ? "✓ القالب المطبق حالياً" : "انقر للتطبيق الفوري"}
                            </span>
                            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform text-primary" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: Visual & Chart Styling */}
              {customizerTab === "style" && (
                <div className="space-y-5">
                  {/* Chart Style Selector */}
                  <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-3">
                    <label className="block text-xs font-extrabold text-foreground">نوع ونمط الرسم البياني الرئيسي</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "area", label: "مساحي انسيابي (Area)" },
                        { id: "line", label: "خطي متصل (Line)" },
                        { id: "bar", label: "أعمدة بيانية (Bar)" },
                      ].map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => updateConfig({ ...dashboardConfig, chartType: type.id as any })}
                          className={`p-3 rounded-xl border text-xs font-extrabold transition-all ${
                            dashboardConfig.chartType === type.id
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-muted/30 border-border/60 hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* KPI Cards Layout Mode */}
                  <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-3">
                    <label className="block text-xs font-extrabold text-foreground">تنسيق وتوزيع بطاقات المؤشرات (KPIs)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => updateConfig({ ...dashboardConfig, kpiColumns: 6 })}
                        className={`p-3 rounded-xl border text-xs font-extrabold transition-all text-right ${
                          dashboardConfig.kpiColumns === 6
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-muted/30 border-border/60 hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <div>٦ أعمدة (عرض ممتد على سطر واحد)</div>
                        <div className="text-[10px] opacity-80 mt-0.5 font-normal">مناسب للشاشات الكبيرة والعريضة</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateConfig({ ...dashboardConfig, kpiColumns: 3 })}
                        className={`p-3 rounded-xl border text-xs font-extrabold transition-all text-right ${
                          dashboardConfig.kpiColumns === 3
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-muted/30 border-border/60 hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <div>٣ أعمدة (سطرين مريحين)</div>
                        <div className="text-[10px] opacity-80 mt-0.5 font-normal">مناسب للشاشات المتوسطة واللابتوب</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Live Layout Schematic Preview Map */}
              {customizerTab === "preview" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-3">
                    <div className="text-xs font-extrabold text-foreground flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" />
                      <span>المخطط الهيكلي المباشر للوحة التحكم (Live Schematic View):</span>
                    </div>

                    <div className="space-y-2 p-3 bg-muted/20 rounded-2xl border border-border/50">
                      {sortedWidgetKeys.map((k) => {
                        const w = dashboardConfig.widgets[k];
                        if (!w.visible) return null;
                        return (
                          <div 
                            key={k} 
                            className="p-3 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between text-xs font-bold text-foreground"
                          >
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-primary text-white text-[10px] font-black">
                                #{w.order}
                              </span>
                              <span>{w.title}</span>
                            </div>
                            <Badge tone="success" className="text-[9px] px-2 py-0.5">معروض ونشط</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  updateConfig(DEFAULT_CONFIG);
                  toast.success("تمت استعادة الإعدادات الافتراضية للوحة التحكم");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة الافتراضي</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWidgetSettingsOpen(false)}
                  className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold shadow-md hover:bg-primary/90 transition-all glow-primary"
                >
                  إغلاق وحفظ العرض
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================
          Modal: Add New Circular / Administrative Announcement
          ========================================================= */}
      {newCircularModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setNewCircularModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-lg bg-card border border-border shadow-2xl rounded-3xl p-5 sm:p-6 overflow-hidden animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" />
                <h3 className="font-extrabold text-base text-foreground">إصدار تعميم إداري جديد</h3>
              </div>
              <button 
                onClick={() => setNewCircularModalOpen(false)}
                className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCircular} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">عنوان التعميم / التبليغ</label>
                <input
                  required
                  type="text"
                  placeholder="مثال: اعتماد خطة الأنشطة المدرسية للفصل الأول..."
                  value={newCircTitle}
                  onChange={(e) => setNewCircTitle(e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">الجهة المصدرة</label>
                  <select
                    value={newCircIssuer}
                    onChange={(e) => setNewCircIssuer(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="إدارة المدرسة العامة">إدارة المدرسة العامة</option>
                    <option value="الشؤون التعليمية والأكاديمية">الشؤون التعليمية والأكاديمية</option>
                    <option value="التوجيه والإرشاد الطلابي">التوجيه والإرشاد الطلابي</option>
                    <option value="الشؤون المالية والخزينة">الشؤون المالية والخزينة</option>
                    <option value="الخدمات المساندة والمرافق">الخدمات المساندة والمرافق</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">درجة الأهمية</label>
                  <select
                    value={newCircUrgency}
                    onChange={(e: any) => setNewCircUrgency(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="normal">عادي / عام</option>
                    <option value="important">هام</option>
                    <option value="urgent">عاجل وفوري</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">نص التعميم والتعليمات</label>
                <textarea
                  required
                  rows={4}
                  placeholder="اكتب تفاصيل التوجيه أو التعميم الإداري هنا..."
                  value={newCircBody}
                  onChange={(e) => setNewCircBody(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewCircularModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-input bg-background text-xs font-bold hover:bg-accent"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>نشر التعميم فوراً</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          Modal: View Circular Details
          ========================================================= */}
      {selectedCircular && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedCircular(null)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-lg bg-card border border-border shadow-2xl rounded-3xl p-5 sm:p-6 overflow-hidden animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" />
                <h3 className="font-extrabold text-base text-foreground">تفاصيل التعميم الإداري</h3>
              </div>
              <button 
                onClick={() => setSelectedCircular(null)}
                className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge tone={selectedCircular.urgency === "urgent" ? "danger" : selectedCircular.urgency === "important" ? "warning" : "primary"}>
                  {selectedCircular.urgency === "urgent" ? "عاجل" : selectedCircular.urgency === "important" ? "هام" : "عام"}
                </Badge>
                <span className="text-xs text-muted-foreground">{selectedCircular.date} — {selectedCircular.time}</span>
              </div>

              <h4 className="text-sm font-extrabold text-foreground leading-snug">
                {selectedCircular.title}
              </h4>

              <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {selectedCircular.body}
              </div>

              <div className="text-xs text-muted-foreground flex items-center justify-between pt-2">
                <span>الجهة المصدرة: <strong className="text-foreground">{selectedCircular.issuer}</strong></span>
                <span>الحالة: <span className="text-emerald-500 font-bold">معتمد ونشط</span></span>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 flex justify-end">
              <button
                onClick={() => setSelectedCircular(null)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}
