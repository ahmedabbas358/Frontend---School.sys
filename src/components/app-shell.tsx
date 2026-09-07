import { useState, useEffect, useRef, useMemo, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { CommandPalette } from "./command-palette";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Settings,
  Bell,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  School,
  ShieldCheck,
  Building2,
  ClipboardList,
  UserCog,
  HeartHandshake,
  UserCircle2,
  Layers3,
  BarChart3,
  DollarSign,
  CalendarRange,
  ClipboardCheck,
  Sun,
  Moon,
  ShieldAlert,
  PanelRightClose,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  Sparkles,
  BookOpen,
  Check,
  Trash2,
  CreditCard,
  LogOut,
  Columns3,
  Rows3,
  SlidersHorizontal,
  Compass,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  CalendarDays,
  Clock,
  FileText,
  FolderArchive,
  Smartphone,
  UserCheck
} from "lucide-react";
import { useStage, EducationalStage } from "@/contexts/StageContext";

/* =========================================================
   AppShell — Advanced Enterprise SaaS Architecture (RTL)
   Precision 3-Tier Sidebar Control & Glassmorphism Design
   ========================================================= */

export type SidebarMode = "expanded" | "rail" | "fullscreen";

type Leaf = { 
  to: string; 
  label: string; 
  icon?: React.ComponentType<{ className?: string }>; 
  badge?: string; 
  desc?: string;
};
type Group = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Leaf[];
};
type Item =
  | { kind: "leaf"; to: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }
  | { kind: "group"; group: Group };

const NAV: Item[] = [
  { kind: "leaf", to: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  {
    kind: "group",
    group: {
      label: "الطلاب وأولياء الأمور",
      icon: Users,
      items: [
        { to: "/students", label: "قائمة الطلاب", icon: Users, badge: "السجل" },
        { to: "/students/new", label: "تسجيل طالب جديد", icon: Plus, badge: "سريع" },
        { to: "/guardians", label: "أولياء الأمور", icon: HeartHandshake, badge: "دليل" },
      ],
    },
  },
  {
    kind: "group",
    group: {
      label: "الإدارة الأكاديمية",
      icon: GraduationCap,
      items: [
        { to: "/academic/years", label: "السنوات الدراسية", icon: CalendarDays, badge: "التقويم" },
        { to: "/academic/classes", label: "الصفوف والشعب", icon: Layers3, badge: "الفصول" },
        { to: "/academic/subjects", label: "المواد التعليمية", icon: BookOpen, badge: "المناهج" },
        { to: "/academic/assignments", label: "الإسناد التدريسي", icon: UserCog, badge: "الكادر" },
        { to: "/schedule", label: "الجدول الأسبوعي", icon: CalendarRange, badge: "الحصص" },
      ],
    },
  },
  {
    kind: "group",
    group: {
      label: "المعلمون والكادر",
      icon: UserCog,
      items: [
        { to: "/teachers", label: "قائمة المعلمين", icon: UserCog, badge: "الكادر" },
      ],
    },
  },
  {
    kind: "group",
    group: {
      label: "الحضور والانضباط",
      icon: ShieldAlert,
      items: [
        { to: "/supervisor", label: "بوابة المشرفين الرئيسية", icon: ShieldCheck, badge: "جديد" },
        { to: "/supervisor/classes", label: "تطبيق المشرفين (رصد الفصول)", icon: Smartphone, badge: "هاتف" },
        { to: "/supervisor/gate", label: "بوابة تحضير العمال والكادر", icon: UserCheck, badge: "استقبال" },
        { to: "/attendance/take", label: "رصد الحضور (بالحصص)", icon: Clock, badge: "مباشر" },
        { to: "/attendance/reports", label: "السجل الأسبوعي والشهري", icon: BarChart3, badge: "تقارير" },
        { to: "/discipline/incidents", label: "المخالفات السلوكية", icon: ShieldAlert, badge: "سجل" },
        { to: "/discipline/merits", label: "النقاط والمكافآت", icon: Sparkles, badge: "تحفيز" },
      ],
    },
  },
  {
    kind: "group",
    group: {
      label: "الاختبارات والشهادات",
      icon: ClipboardList,
      items: [
        { to: "/exams", label: "جدول الاختبارات", icon: CalendarDays, badge: "مواعيد" },
        { to: "/exams/grades", label: "النتائج ورصد الدرجات", icon: ClipboardCheck, badge: "رصد" },
        { to: "/exams/reports", label: "التقارير والشهادات", icon: FileText, badge: "طباعة" },
      ],
    },
  },
  {
    kind: "group",
    group: {
      label: "المركز المالي",
      icon: DollarSign,
      items: [
        { to: "/finance", label: "لوحة العمليات المالية", icon: BarChart3, badge: "شامل" },
        { to: "/finance/students", label: "المالية الطلابية والرسوم", icon: CreditCard, badge: "تحصيل" },
        { to: "/finance/fees", label: "هيكل الرسوم الدراسية", icon: Layers3, badge: "رسوم" },
        { to: "/finance/discounts", label: "الخصومات والمنح", icon: Sparkles, badge: "منح" },
        { to: "/finance/payments", label: "سندات القبض والدفع", icon: CreditCard, badge: "سندات" },
        { to: "/finance/treasury", label: "الخزينة (الصندوق)", icon: DollarSign, badge: "كاشير" },
        { to: "/finance/banks", label: "الحسابات البنكية", icon: Building2, badge: "بنوك" },
        { to: "/hr/payroll", label: "مسير الرواتب", icon: DollarSign, badge: "أجور" },
        { to: "/finance/expenses", label: "المصروفات والموردين", icon: CreditCard, badge: "فواتير" },
        { to: "/finance/cost-centers", label: "مراكز التكلفة", icon: SlidersHorizontal, badge: "مراكز" },
        { to: "/finance/accounts", label: "الدليل المحاسبي", icon: Layers3, badge: "شجرة" },
        { to: "/finance/reports", label: "التقارير المالية", icon: BarChart3, badge: "قوائم" },
      ],
    },
  },
  {
    kind: "group",
    group: {
      label: "المرافق والخدمات",
      icon: Building2,
      items: [
        { to: "/facilities/dashboard", label: "إحصاءات المرافق", icon: BarChart3, badge: "لوحة" },
        { to: "/facilities/rooms", label: "المباني والقاعات", icon: Building2, badge: "فصول" },
        { to: "/facilities/maintenance", label: "طلبات الصيانة", icon: SlidersHorizontal, badge: "بلاغات" },
        { to: "/library/textbooks", label: "الكتب والمقررات", icon: BookOpen, badge: "مقررات" },
        { to: "/library/distribution", label: "تسليم المقررات للطلاب", icon: Check, badge: "تسليم" },
        { to: "/inventory/items", label: "المستودعات", icon: Layers3, badge: "مخزون" },
        { to: "/clinic/visits", label: "العيادة الطبية", icon: ShieldCheck, badge: "صحة" },
        { to: "/transport/routes", label: "مسارات النقل المدرسي", icon: Compass, badge: "حافلات" },
        { to: "/transport/students", label: "اشتراكات حافلات الطلاب", icon: Users, badge: "اشتراكات" },
      ],
    },
  },
  {
    kind: "group",
    group: {
      label: "شؤون الموظفين (HR)",
      icon: HeartHandshake,
      items: [
        { to: "/hr/dashboard", label: "لوحة الموارد البشرية", icon: BarChart3, badge: "مؤشرات" },
        { to: "/hr/staff", label: "قائمة الموظفين", icon: Users, badge: "كادر" },
        { to: "/hr/attendance", label: "الحضور والانصراف", icon: Clock, badge: "بصمة" },
        { to: "/hr/leaves", label: "طلبات الإجازات", icon: CalendarDays, badge: "إجازات" },
        { to: "/hr/payroll", label: "مسير الرواتب", icon: DollarSign, badge: "شهري" },
        { to: "/hr/org-chart", label: "الهيكل التنظيمي", icon: Layers3, badge: "شجرة" },
        { to: "/hr/evaluations", label: "تقييم الأداء", icon: Sparkles, badge: "KPIs" },
        { to: "/hr/contracts", label: "العقود والوثائق", icon: FileText, badge: "عقود" },
        { to: "/hr/reports", label: "تقارير الموارد البشرية", icon: BarChart3, badge: "بيانات" },
      ],
    },
  },
  {
    kind: "group",
    group: {
      label: "الإدارة والنظام",
      icon: ShieldCheck,
      items: [
        { to: "/admin/dashboard", label: "لوحة الإدارة", icon: LayoutDashboard, badge: "نظام" },
        { to: "/admin/users", label: "إدارة المستخدمين", icon: Users, badge: "حسابات" },
        { to: "/admin/roles", label: "الأدوار والصلاحيات", icon: ShieldCheck, badge: "أدوار" },
        { to: "/admin/permissions", label: "مصفوفة الأذونات", icon: SlidersHorizontal, badge: "صلاحيات" },
        { to: "/admin/activity-log", label: "سجل الأنشطة والأمان", icon: Clock, badge: "أمان" },
        { to: "/admin/backup", label: "النسخ الاحتياطي", icon: FolderArchive, badge: "حفظ" },
        { to: "/admin/notifications", label: "مركز الإشعارات", icon: Bell, badge: "تنبيهات" },
        { to: "/settings/trash", label: "سلة المحذوفات", icon: Trash2, badge: "استعادة" },
      ],
    },
  },
  { kind: "leaf", to: "/settings", label: "الإعدادات المركزية", icon: Settings },
];

const ROLES = [
  { id: "super-admin", label: "مدير عام", icon: ShieldCheck },
  { id: "principal", label: "مدير مدرسة", icon: Building2 },
  { id: "registrar", label: "أمين تسجيل", icon: ClipboardList },
  { id: "teacher", label: "معلم", icon: UserCog },
  { id: "guardian", label: "ولي أمر", icon: HeartHandshake },
] as const;

/* Mobile Bottom Navigation */
const BOTTOM_NAV = [
  { to: "/", label: "الرئيسية", icon: LayoutDashboard },
  { to: "/students", label: "الطلاب", icon: Users },
  { to: "/attendance/take", label: "الحضور", icon: ClipboardCheck },
  { to: "/finance/dashboard", label: "المالية", icon: DollarSign },
  { to: "/settings", label: "الإعدادات", icon: Settings },
];

/** Utility to safely format currency in Arabic without reversing negative signs */
export function formatCurrency(amount: number, currency: string = "ج.س") {
  const isNegative = amount < 0;
  const absFormatted = Math.abs(amount).toLocaleString("en-US");
  return (
    <span className="inline-flex items-center gap-1 font-black tabular-nums whitespace-nowrap" dir="ltr">
      <span>{isNegative ? `-${absFormatted}` : absFormatted}</span>
      <span className="text-[11px] font-bold opacity-80">{currency}</span>
    </span>
  );
}

export function MoneyDisplay({
  amount,
  currency = "ج.س",
  className = "",
  showTrend = false,
}: {
  amount: number;
  currency?: string;
  className?: string;
  showTrend?: boolean;
}) {
  const isNegative = amount < 0;
  const absFormatted = Math.abs(amount).toLocaleString("en-US");
  return (
    <div className={`inline-flex items-center gap-1.5 font-extrabold whitespace-nowrap ${className}`} dir="rtl">
      <span className="tabular-nums" dir="ltr">
        {isNegative ? `-${absFormatted}` : absFormatted} {currency}
      </span>
      {showTrend && (
        isNegative ? (
          <ArrowDownLeft className="w-3.5 h-3.5 text-danger shrink-0" />
        ) : (
          <ArrowUpRight className="w-3.5 h-3.5 text-success shrink-0" />
        )
      )}
    </div>
  );
}

export function AppShell({
  children,
  title,
  breadcrumb,
  actions,
}: {
  children: ReactNode;
  title?: string;
  breadcrumb?: { label: string; to?: string; onClick?: () => void }[];
  actions?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  
  // 3-Tier Sidebar State Management
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("darasi_sidebar_mode");
      if (saved === "expanded" || saved === "rail" || saved === "fullscreen") {
        return saved;
      }
    }
    return "expanded";
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  
  const [role] = useState<(typeof ROLES)[number]>(ROLES[0]);
  const { stage, setStage, getStageLabel } = useStage();
  const { 
    systemSettings, 
    updateSettings,
    notifications,
    unreadNotificationsCount,
    markAllNotificationsAsRead,
    deleteNotification,
    allPayments,
    allExpenses,
    currency
  } = useGlobalStore();

  const unreadCount = unreadNotificationsCount || 0;
  const netBalance = (allPayments || []).reduce((sum, p) => sum + p.amount, 0) - (allExpenses || []).reduce((sum, e) => sum + e.amount, 0);

  // Update Sidebar Mode and Persist
  const changeSidebarMode = (mode: SidebarMode) => {
    setSidebarMode(mode);
    setModeMenuOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("darasi_sidebar_mode", mode);
    }
  };

  // Synchronize sidebar mode when changed from command palette or other components
  useEffect(() => {
    const handleStorage = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("darasi_sidebar_mode");
        if (saved === "expanded" || saved === "rail" || saved === "fullscreen") {
          setSidebarMode(saved);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Keyboard shortcut Ctrl/Cmd + B to cycle sidebar modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarMode((prev) => {
          const next: SidebarMode = prev === "expanded" ? "rail" : prev === "rail" ? "fullscreen" : "expanded";
          if (typeof window !== "undefined") {
            localStorage.setItem("darasi_sidebar_mode", next);
            window.dispatchEvent(new Event("storage"));
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Dark Mode Theme Logic
  const [systemIsDark, setSystemIsDark] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      setSystemIsDark(media.matches);
      const listener = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, []);

  const isDark = systemSettings.themeMode === "system" ? systemIsDark : systemSettings.themeMode === "dark";

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    if (systemSettings.primaryColor) {
      document.documentElement.style.setProperty("--primary", systemSettings.primaryColor);
    } else {
      document.documentElement.style.removeProperty("--primary");
    }
  }, [systemSettings.primaryColor]);

  useEffect(() => {
    document.documentElement.dir = systemSettings.language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = systemSettings.language;
  }, [systemSettings.language]);

  const currentActiveGroup = useMemo(() => {
    for (const item of NAV) {
      if (item.kind === "group") {
        const match = item.group.items.some(
          (sub) => pathname === sub.to || (sub.to !== "/" && pathname.startsWith(sub.to + "/")) || (sub.to !== "/" && pathname === sub.to)
        );
        if (match) return item.group;
      }
    }
    return null;
  }, [pathname]);

  const currentLabel =
    title ??
    NAV.flatMap((n) => (n.kind === "leaf" ? [n] : n.group.items.map((i) => ({ to: i.to, label: i.label }))))
      .find((n) => n.to === pathname)?.label ??
    "لوحة التحكم";

  // Dynamic layout margin based on sidebar mode
  const mainMarginClass =
    sidebarMode === "expanded"
      ? "lg:mr-72"
      : sidebarMode === "rail"
      ? "lg:mr-20"
      : "lg:mr-0";

  return (
    <div className="min-h-dvh bg-background text-foreground transition-colors duration-300 relative selection:bg-primary/20" dir="rtl">
      
      {/* ============ Floating Zen Restore Pill (When in Fullscreen Mode) ============ */}
      {sidebarMode === "fullscreen" && (
        <div className="hidden lg:flex fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-popover border border-border/80 shadow-2xl">
            <button
              onClick={() => changeSidebarMode("expanded")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 transition-all"
              title="إظهار الشريط الجانبي الكامل (Ctrl+B)"
            >
              <PanelRightOpen className="w-4 h-4" />
              <span>إظهار القائمة</span>
            </button>
            <button
              onClick={() => changeSidebarMode("rail")}
              className="p-1.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
              title="وضع الأيقونات المدمج"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============ Sidebar ============ */}
      <Sidebar
        pathname={pathname}
        mode={sidebarMode}
        onModeChange={changeSidebarMode}
        onNavigate={() => setMobileOpen(false)}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* ============ Main Workspace Column ============ */}
      <div className={`${mainMarginClass} transition-all duration-300 min-h-dvh flex flex-col`}>
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 glass-header shadow-xs">
          <div className="flex h-16 items-center justify-between gap-2 px-3 sm:px-6">
            
            {/* Right: Mobile Toggle & Sidebar Mode Trigger & Search */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              
              {/* Mobile hamburger */}
              <button
                className="lg:hidden grid h-10 w-10 place-items-center rounded-xl border border-border/70 bg-card hover:bg-accent transition-colors shrink-0"
                onClick={() => setMobileOpen(true)}
                aria-label="فتح القائمة الجانبية"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Compact Desktop Sidebar Mode Menu */}
              <div className="hidden lg:relative lg:block shrink-0">
                <button
                  onClick={() => setModeMenuOpen((v) => !v)}
                  className={`flex items-center gap-2 h-10 px-3 rounded-xl border transition-all shadow-xs ${
                    sidebarMode === "fullscreen"
                      ? "border-primary/40 bg-primary/10 text-primary font-bold"
                      : "border-border/70 bg-card/60 hover:bg-card text-foreground font-semibold"
                  }`}
                  title="التحكم في عرض الشريط الجانبي (Ctrl+B)"
                >
                  {sidebarMode === "expanded" ? (
                    <PanelRightClose className="h-4 w-4 text-primary" />
                  ) : sidebarMode === "rail" ? (
                    <Minimize2 className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Maximize2 className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-xs hidden xl:inline">
                    {sidebarMode === "expanded" ? "الشريط: كامل" : sidebarMode === "rail" ? "الشريط: أيقونات" : "ملء الشاشة"}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </button>

                {modeMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-border glass-popover shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 text-[11px] font-bold text-muted-foreground border-b border-border/60">
                      وضع عرض الشريط الجانبي
                    </div>
                    <button
                      onClick={() => changeSidebarMode("expanded")}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        sidebarMode === "expanded" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <PanelRightOpen className="h-4 w-4" />
                        <span>الوضع الكامل (Expanded)</span>
                      </div>
                      {sidebarMode === "expanded" && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => changeSidebarMode("rail")}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        sidebarMode === "rail" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Minimize2 className="h-4 w-4" />
                        <span>وضع الأيقونات (Rail)</span>
                      </div>
                      {sidebarMode === "rail" && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => changeSidebarMode("fullscreen")}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        sidebarMode === "fullscreen" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Maximize2 className="h-4 w-4" />
                        <span>ملء الشاشة (Zen Mode)</span>
                      </div>
                      {sidebarMode === "fullscreen" && <Check className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Search trigger */}
              <div className="relative hidden md:block w-48 lg:w-60 xl:w-68">
                <button
                  onClick={() => document.dispatchEvent(new CustomEvent("open-command-palette"))}
                  className="flex items-center justify-between h-10 w-full rounded-xl border border-border/70 bg-card/60 px-3 text-xs text-muted-foreground hover:bg-card hover:border-primary/40 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Search className="h-3.5 w-3.5 opacity-70 text-primary shrink-0" />
                    <span className="truncate">بحث سريع (Ctrl+K)...</span>
                  </div>
                  <span className="text-[10px] font-bold border border-border bg-muted/60 px-1.5 py-0.5 rounded opacity-80 shrink-0">
                    Ctrl K
                  </span>
                </button>
              </div>
            </div>

            {/* Left: Financial Status, Stage Selector, Notifications, Theme, Profile */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              
              {/* Financial Quick Ticker with RTL-Safe Display */}
              <div className="hidden sm:flex items-center gap-2 px-3 h-10 rounded-xl border border-border/70 bg-card/60 shadow-xs">
                <div className="relative flex h-2 w-2 shrink-0">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${netBalance >= 0 ? 'bg-success' : 'bg-danger'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${netBalance >= 0 ? 'bg-success' : 'bg-danger'}`}></span>
                </div>
                <CreditCard className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-[11px] font-bold text-muted-foreground hidden lg:inline">الخزينة:</span>
                <div className={`text-xs font-black ${netBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(netBalance, currency)}
                </div>
              </div>

              {/* Stage Switcher */}
              <div className="relative">
                <button
                  onClick={() => {
                    setStageOpen((v) => !v);
                    setProfileOpen(false);
                    setNotifOpen(false);
                    setModeMenuOpen(false);
                  }}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/5 px-2.5 sm:px-3 text-xs font-bold text-primary hover:bg-primary/10 transition-colors shadow-xs"
                >
                  <School className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline truncate">{getStageLabel(stage)}</span>
                  <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
                </button>
                {stageOpen && (
                  <div className="absolute left-0 mt-2 w-56 overflow-hidden rounded-2xl border border-border glass-popover text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="border-b border-border/60 px-3 py-2 text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>المرحلة التعليمية النشطة</span>
                    </div>
                    {(["kindergarten", "primary", "middle", "high"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setStage(s);
                          setStageOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2.5 text-xs sm:text-sm hover:bg-accent/70 transition-colors ${
                          stage === s ? "text-primary font-bold bg-primary/10" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4 opacity-80" />
                          <span>{getStageLabel(s)}</span>
                        </div>
                        {stage === s && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => updateSettings({ themeMode: isDark ? "light" : "dark" })}
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-border/70 bg-card/60 hover:bg-accent transition-colors shadow-xs shrink-0"
                aria-label="تبديل المظهر"
                title={isDark ? "تفعيل المظهر الفاتح" : "تفعيل المظهر الداكن"}
              >
                {isDark ? (
                  <Sun className="h-4 w-4 text-warning animate-in spin-in-90 duration-300" />
                ) : (
                  <Moon className="h-4 w-4 text-foreground animate-in spin-in-90 duration-300" />
                )}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifOpen((v) => !v);
                    setProfileOpen(false);
                    setStageOpen(false);
                    setModeMenuOpen(false);
                  }}
                  className="relative grid h-10 w-10 place-items-center rounded-xl border border-border/70 bg-card/60 hover:bg-accent transition-colors shadow-xs shrink-0"
                  aria-label="الإشعارات"
                >
                  <Bell className="h-4 w-4 text-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-black text-white shadow-sm ring-2 ring-card animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute left-0 mt-2 w-80 sm:w-96 overflow-hidden rounded-2xl border border-border glass-popover text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-muted/40">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        <span className="font-bold text-xs">الإشعارات والتنبيهات</span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-[11px] font-bold text-primary hover:underline"
                        >
                          تحديد الكل كمقروء
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-border/40 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-muted-foreground">لا توجد إشعارات جديدة</div>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <div key={n.id} className={`p-3 text-xs hover:bg-accent/50 transition-colors ${n.read ? "opacity-75" : "bg-primary/5 font-semibold"}`}>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                              <span className="font-bold text-primary">{n.title}</span>
                              <span>{new Date(n.timestamp).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", numberingSystem: "latn" })}</span>
                            </div>
                            <p className="text-foreground text-xs">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileOpen((v) => !v);
                    setNotifOpen(false);
                    setStageOpen(false);
                    setModeMenuOpen(false);
                  }}
                  className="flex items-center gap-2 h-10 pl-2 pr-1.5 rounded-xl border border-border/70 bg-card/60 hover:bg-accent transition-colors shadow-xs shrink-0"
                >
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 text-white font-extrabold text-xs shadow-xs">
                    {systemSettings.schoolName ? systemSettings.schoolName.substring(0, 2) : "أ.ع"}
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold leading-none text-foreground truncate max-w-[90px]">أحمد العتيبي</div>
                    <div className="text-[10px] text-muted-foreground font-semibold leading-none mt-0.5">مدير عام</div>
                  </div>
                  <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
                </button>
                {profileOpen && (
                  <div className="absolute left-0 mt-2 w-64 overflow-hidden rounded-2xl border border-border glass-popover text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="border-b border-border/60 p-4 bg-muted/40">
                      <div className="font-bold text-xs">أحمد العتيبي</div>
                      <div className="text-[11px] text-muted-foreground">admin@schools.sa</div>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold">
                        <ShieldCheck className="h-3 w-3" />
                        <span>مدير عام النظام</span>
                      </div>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <Link
                        to="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-accent transition-colors"
                      >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span>إعدادات النظام والمدرسة</span>
                      </Link>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          document.dispatchEvent(new CustomEvent("open-command-palette"));
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-accent transition-colors"
                      >
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <span>البحث السريع (Ctrl+K)</span>
                      </button>
                    </div>
                    <div className="border-t border-border/60 p-1">
                      <Link 
                        to="/"
                        onClick={() => {
                          setProfileOpen(false);
                          alert("تم تسجيل الخروج بنجاح!");
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-danger hover:bg-danger/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>تسجيل الخروج</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sub Header: Breadcrumbs + Action Bar */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border/40 px-4 py-2.5 sm:px-6 bg-card/30">
            <div className="min-w-0">
              {breadcrumb && breadcrumb.length > 0 && (
                <nav className="mb-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  {breadcrumb.map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      {i > 0 && <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground/60" />}
                      {b.to ? (
                        <Link to={b.to} className="text-muted-foreground hover:text-foreground font-semibold text-xs transition-colors">
                          {b.label}
                        </Link>
                      ) : b.onClick ? (
                        <button onClick={b.onClick} className="text-muted-foreground hover:text-foreground font-semibold text-xs transition-colors">
                          {b.label}
                        </button>
                      ) : (
                        <span className="text-foreground font-semibold text-xs">{b.label}</span>
                      )}
                    </div>
                  ))}
                </nav>
              )}
              <h1 className="truncate text-base sm:text-lg font-extrabold tracking-tight text-foreground">{currentLabel}</h1>
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>

          {/* =========================================================
              Horizontal Sub-Section Tabs Bar for Active Category
              ========================================================= */}
          {currentActiveGroup && currentActiveGroup.items.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 sm:px-6 bg-card/70 border-t border-border/40 backdrop-blur-md custom-scrollbar animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 shrink-0 pl-2 text-xs font-black text-muted-foreground border-l border-border/60 ml-1">
                <currentActiveGroup.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="hidden sm:inline">{currentActiveGroup.label}:</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                {currentActiveGroup.items.map((leaf) => {
                  const isCurrent = pathname === leaf.to || (leaf.to !== "/" && pathname.startsWith(leaf.to + "/"));
                  const SubIcon = leaf.icon || currentActiveGroup.icon;
                  return (
                    <Link
                      key={leaf.to}
                      to={leaf.to}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all duration-200 ${
                        isCurrent
                          ? "bg-primary text-primary-foreground shadow-sm glow-primary scale-[1.02]"
                          : "bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground border border-border/40"
                      }`}
                    >
                      <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? "text-white" : "text-primary opacity-80"}`} />
                      <span>{leaf.label}</span>
                      {leaf.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isCurrent ? "bg-white/25 text-white" : "bg-primary/10 text-primary"
                        }`}>
                          {leaf.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 pb-20 lg:pb-8 animate-in fade-in duration-300">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border/60 glass lg:hidden pb-safe">
        {BOTTOM_NAV.map((n) => {
          const active = pathname === n.to;
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-bold transition-colors ${
                active ? "text-primary font-black" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform ${active ? "scale-110 text-primary" : ""}`} />
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  );
}

/* =========================================================
   Sidebar Component — Expanded, Rail, and Mobile Responsive
   ========================================================= */

function Sidebar({
  pathname,
  mode,
  onModeChange,
  onNavigate,
  mobileOpen,
  onClose,
}: {
  pathname: string;
  mode: SidebarMode;
  onModeChange: (m: SidebarMode) => void;
  onNavigate: () => void;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const { stage, getStageLabel } = useStage();

  // Determine width based on mode
  const sidebarWidthClass =
    mode === "expanded"
      ? "w-72"
      : mode === "rail"
      ? "w-20"
      : "w-0 -translate-x-full lg:translate-x-full";

  return (
    <aside
      className={[
        "fixed inset-y-0 right-0 z-40 bg-[#0f172a] text-slate-100 border-l border-slate-800/80 shadow-2xl",
        "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        sidebarWidthClass,
        mobileOpen ? "!w-72 !translate-x-0" : "",
      ].join(" ")}
      style={{ overflow: mode === "fullscreen" && !mobileOpen ? "hidden" : "visible" }}
    >
      {/* Brand & Mode Switcher Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-3.5">
        {mode === "rail" && !mobileOpen ? (
          <div className="w-full flex flex-col items-center justify-center gap-1">
            <button
              onClick={() => onModeChange("expanded")}
              title="توسيع الشريط الجانبي (كامل)"
              className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md hover:scale-105 transition-all glow-primary"
            >
              <School className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <>
            <Link to="/" onClick={onNavigate} className="flex items-center gap-3 min-w-0">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md glow-primary shrink-0">
                <School className="h-5 w-5" />
              </div>
              <div className="leading-tight min-w-0">
                <div className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  <span className="truncate">منصة مدارس</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">Pro</span>
                </div>
                <div className="text-[11px] font-bold text-blue-400/90 truncate">{getStageLabel(stage)}</div>
              </div>
            </Link>

            <div className="flex items-center gap-1">
              {/* Desktop quick collapse to rail button */}
              <button
                onClick={() => onModeChange("rail")}
                className="hidden lg:grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="تصغير لوضع الأيقونات"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              
              {/* Mobile close button */}
              <button
                className="lg:hidden grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                onClick={onClose}
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Navigation List */}
      <nav className="h-[calc(100dvh-4rem)] space-y-1.5 overflow-y-auto px-2.5 py-3.5 custom-scrollbar">
        {NAV.map((item, idx) => {
          if (item.kind === "leaf") {
            const active = pathname === item.to;
            const Icon = item.icon;

            if (mode === "rail" && !mobileOpen) {
              return (
                <div key={item.to} className="relative group/rail-leaf flex justify-center py-1">
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    className={[
                      "grid h-11 w-11 place-items-center rounded-xl transition-all duration-200",
                      active
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105 glow-primary"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white hover:scale-105",
                    ].join(" ")}
                    title={item.label}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                  {/* Floating tooltip on hover */}
                  <div className="absolute right-16 top-1/2 -translate-y-1/2 hidden group-hover/rail-leaf:flex items-center z-50 pointer-events-none">
                    <div className="glass-rail-popover text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 shadow-2xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-blue-400" />
                      <span>{item.label}</span>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 hover-lift",
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold scale-[0.99]"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
                ].join(" ")}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          }

          return (
            <SidebarGroupBlock
              key={`g-${idx}`}
              group={item.group}
              pathname={pathname}
              mode={mode}
              mobileOpen={mobileOpen}
              onNavigate={onNavigate}
            />
          );
        })}

        {/* Footer Info (Expanded & Mobile only) */}
        {(mode === "expanded" || mobileOpen) && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs">
            <div className="flex items-center justify-between text-slate-400 font-medium">
              <span>العام الدراسي الحالي</span>
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="mt-1 font-bold text-xs text-slate-200">1446 هـ — الفصل الأول</div>
          </div>
        )}
      </nav>
    </aside>
  );
}

/* =========================================================
   SidebarGroupBlock — Accordion in Full, Direct Link & Flyout in Rail
   ========================================================= */

function SidebarGroupBlock({
  group,
  pathname,
  mode,
  mobileOpen,
  onNavigate,
}: {
  group: Group;
  pathname: string;
  mode: SidebarMode;
  mobileOpen: boolean;
  onNavigate: () => void;
}) {
  const isActiveBranch = group.items.some((i) => pathname === i.to || (i.to !== "/" && pathname.startsWith(i.to + "/")) || (i.to !== "/" && pathname === i.to));
  const [open, setOpen] = useState<boolean>(isActiveBranch);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const flyoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const Icon = group.icon;
  const primaryRoute = group.items[0]?.to || "/";

  // Rail Mode: Render Direct Click Link + Floating Dual-Grid Hub Popover on Hover
  if (mode === "rail" && !mobileOpen) {
    const handleMouseEnter = () => {
      if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
      setFlyoutOpen(true);
    };

    const handleMouseLeave = () => {
      flyoutTimerRef.current = setTimeout(() => {
        setFlyoutOpen(false);
      }, 300); // Smooth delay to bridge mouse movement
    };

    return (
      <div 
        className="relative flex justify-center py-1 group/rail-group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Direct Link on Click to Primary Route */}
        <Link
          to={primaryRoute}
          onClick={onNavigate}
          className={[
            "relative grid h-11 w-11 place-items-center rounded-xl transition-all duration-200",
            isActiveBranch
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 glow-primary scale-105"
              : "text-slate-400 hover:bg-slate-800 hover:text-white hover:scale-105",
          ].join(" ")}
          title={group.label}
        >
          <Icon className="h-5 w-5" />
          {isActiveBranch && (
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 h-4 w-1 rounded-r-full bg-blue-400 shadow-sm" />
          )}
        </Link>

        {/* Dynamic Dual-Grid Quick Launch Hub with Cursor Bridge */}
        {flyoutOpen && (
          <div 
            className="absolute right-16 top-0 z-50 w-80 sm:w-96 rounded-2xl glass-rail-popover border border-slate-700/80 shadow-2xl p-3.5 animate-in fade-in zoom-in-95 duration-150 before:content-[''] before:absolute before:-right-6 before:top-0 before:bottom-0 before:w-10"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 px-1 text-xs font-black text-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 shadow-xs">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-white truncate">{group.label}</div>
                  <div className="text-[10px] text-slate-400 font-bold mt-0.5">اختر القسم الفرعي للولوج السريع</div>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-800 text-blue-300 border border-slate-700 shadow-xs">
                {group.items.length} خيارات
              </span>
            </div>

            {/* Sub Items Dual-Column Grid */}
            <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-84 overflow-y-auto custom-scrollbar p-0.5">
              {group.items.map((leaf) => {
                const active = pathname === leaf.to || (leaf.to !== "/" && pathname.startsWith(leaf.to + "/"));
                const SubIcon = leaf.icon || group.icon;
                return (
                  <Link
                    key={leaf.to}
                    to={leaf.to}
                    onClick={() => {
                      setFlyoutOpen(false);
                      onNavigate();
                    }}
                    className={[
                      "flex items-center gap-2 rounded-xl p-2 text-xs font-bold transition-all duration-150 relative group/flycard border",
                      active
                        ? "bg-blue-600 text-white shadow-md border-blue-500 font-black scale-[1.02] glow-primary"
                        : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-700 hover:translate-y-[-1px]",
                    ].join(" ")}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${active ? "bg-white/20 text-white" : "bg-slate-800 text-blue-400 group-hover/flycard:bg-blue-500/20"}`}>
                      <SubIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-right text-[11px] leading-tight">{leaf.label}</div>
                      {leaf.badge && (
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                          active ? "bg-white/25 text-white" : "bg-blue-500/10 text-blue-400"
                        }`}>
                          {leaf.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Expanded Mode: Render Collapsible Accordion Group
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-150",
          isActiveBranch
            ? "text-white font-extrabold bg-slate-800/60 shadow-xs"
            : "text-slate-300 hover:bg-slate-800/40 hover:text-white",
        ].join(" ")}
      >
        <Icon className={`h-4 w-4 shrink-0 ${isActiveBranch ? "text-blue-400" : "text-slate-400"}`} />
        <span className="flex-1 text-right truncate">{group.label}</span>
        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800/90 text-slate-400 border border-slate-700/50">
          {group.items.length}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? "rotate-180 text-blue-400" : "opacity-60"}`} />
      </button>
      
      {open && (
        <div className="mr-3.5 mt-1 space-y-1 border-r border-slate-800 pr-2.5 animate-in slide-in-from-top-1 duration-200">
          {group.items.map((leaf) => {
            const active = pathname === leaf.to || (leaf.to !== "/" && pathname.startsWith(leaf.to + "/"));
            const SubIcon = leaf.icon || group.icon;
            return (
              <Link
                key={leaf.to}
                to={leaf.to}
                onClick={onNavigate}
                className={[
                  "flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold transition-all duration-150",
                  active
                    ? "bg-blue-600 text-white shadow-md font-black"
                    : "text-slate-400 hover:bg-slate-800/70 hover:text-white",
                ].join(" ")}
              >
                <div className="flex items-center gap-2 truncate">
                  <SubIcon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-white" : "text-slate-500"}`} />
                  <span className="truncate">{leaf.label}</span>
                </div>
                {leaf.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    active ? "bg-white/25 text-white" : "bg-slate-800 text-slate-400"
                  }`}>
                    {leaf.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   Shared Micro-UI Atoms (Badge, PageCard, EmptyState)
   ========================================================= */

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "primary";
  className?: string;
}) {
  const map: Record<string, string> = {
    neutral: "bg-muted text-muted-foreground border-border/80",
    success: "bg-success/15 text-success border-success/30",
    warning: "bg-warning/15 text-warning-foreground border-warning/30",
    danger: "bg-danger/15 text-danger border-danger/30",
    info: "bg-info/15 text-info border-info/30",
    primary: "bg-primary/15 text-primary border-primary/30",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border backdrop-blur-sm shadow-xs ${map[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function PageCard({
  title,
  description,
  actions,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-border/70 glass-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4 bg-transparent rounded-t-2xl">
          <div className="min-w-0">
            {title && <h2 className="truncate font-extrabold text-base sm:text-lg tracking-tight text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function EmptyState({
  icon: Icon = Layers3,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-14 text-center animate-in fade-in duration-300">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mb-3 shadow-inner glow-primary">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-extrabold text-base tracking-tight text-foreground">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
