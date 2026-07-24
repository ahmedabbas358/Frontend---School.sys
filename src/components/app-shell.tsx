import { useState, useEffect, type ReactNode } from "react";
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
  ShieldAlert
} from "lucide-react";
import { useStage, EducationalStage } from "@/contexts/StageContext";

/* =========================================================
   AppShell — Enterprise SaaS Layout (RTL) - Apple Glass Aesthetic
   ========================================================= */

type Leaf = { to: string; label: string };
type Group = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Leaf[];
};
type Item =
  | { kind: "leaf"; to: string; label: string; icon: React.ComponentType<{ className?: string }> }
  | { kind: "group"; group: Group };

const NAV: Item[] = [
  { kind: "leaf", to: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  {
    kind: "group",
    group: {
      label: "الطلاب",
      icon: Users,
      items: [
        { to: "/students", label: "قائمة الطلاب" },
        { to: "/students/new", label: "تسجيل طالب جديد" },
        { to: "/guardians", label: "أولياء الأمور" },
      ],
    },
  },
  {
    kind: "group",
    group: {
      label: "الإدارة الأكاديمية",
      icon: GraduationCap,
      items: [
        { to: "/academic/years", label: "السنوات الدراسية" },
        { to: "/academic/classes", label: "الصفوف" },
        { to: "/academic/subjects", label: "المواد" },
        { to: "/academic/assignments", label: "الإسناد التدريسي" },
        { to: "/schedule", label: "الجدول الأسبوعي" },
      ],
    },
  },
  {
    kind: "group",
    group: {
      label: "المعلمون",
      icon: UserCog,
      items: [
        { to: "/teachers", label: "قائمة المعلمين" },
      ],
    },
  },
  {
    kind: "group",
    group: {
      label: "الحضور والانضباط",
      icon: ShieldAlert,
      items: [
        { to: "/attendance/take", label: "رصد الحضور (بالحصص)" },
        { to: "/attendance/reports", label: "السجل الأسبوعي والشهري" },
        { to: "/discipline/incidents", label: "الحوادث السلوكية" },
        { to: "/discipline/merits", label: "المكافآت" },
      ],
    },
  },
  {
    kind: "group",
    group: {
      label: "الاختبارات",
      icon: ClipboardList,
      items: [
        { to: "/exams", label: "جدول الاختبارات" },
        { to: "/exams/grades", label: "النتائج ورصد الدرجات" },
        { to: "/exams/reports", label: "التقارير والشهادات" },
      ],
    },
  },
  {
    kind: "group",
    group: {
      label: "المالية والقيود",
      icon: DollarSign,
      items: [
        { to: "/finance", label: "لوحة العمليات" },
        { to: "/finance/students", label: "المالية الطلابية" },
        { to: "/finance/treasury", label: "الخزينة (الصندوق)" },
        { to: "/finance/banks", label: "الحسابات البنكية" },
        { to: "/hr/payroll", label: "مسير الرواتب" },
        { to: "/finance/expenses", label: "المصروفات والموردين" },
        { to: "/finance/accounts", label: "الدليل المحاسبي" },
        { to: "/finance/ledger", label: "سجل القيود اليومية" },
        { to: "/finance/trial-balance", label: "ميزان المراجعة" },
        { to: "/finance/reports", label: "التقارير المالية" },
      ],
    },
  },
  {
    kind: "group",
    group: {
      label: "المرافق والخدمات",
      icon: Building2,
      items: [
        { to: "/facilities/dashboard", label: "إحصاءات المرافق" },
        { to: "/facilities/rooms", label: "المباني والقاعات" },
        { to: "/facilities/maintenance", label: "طلبات الصيانة" },
        { to: "/library/books", label: "المكتبة" },
        { to: "/inventory/items", label: "المستودعات" },
        { to: "/clinic/visits", label: "العيادة الطبية" },
        { to: "/transport/routes", label: "النقل المدرسي" },
      ],
    },
  },
  {
    kind: "group",
    group: {
      label: "شؤون الموظفين",
      icon: HeartHandshake,
      items: [
        { to: "/hr/dashboard", label: "لوحة الموارد البشرية" },
        { to: "/hr/staff", label: "قائمة الموظفين" },
        { to: "/hr/attendance", label: "الحضور والانصراف" },
        { to: "/hr/leaves", label: "الإجازات" },
        { to: "/hr/payroll", label: "الرواتب" },
        { to: "/hr/org-chart", label: "الهيكل التنظيمي" },
        { to: "/hr/evaluations", label: "تقييم الأداء" },
        { to: "/hr/contracts", label: "العقود والوثائق" },
        { to: "/hr/reports", label: "التقارير" },
      ],
    },
  },

  {
    kind: "group",
    group: {
      label: "الإدارة العامة",
      icon: ShieldCheck,
      items: [
        { to: "/admin/dashboard", label: "لوحة الإدارة" },
        { to: "/admin/users", label: "المستخدمون" },
        { to: "/admin/roles", label: "الأدوار" },
        { to: "/admin/permissions", label: "الصلاحيات" },
        { to: "/admin/activity-log", label: "سجل الأنشطة" },
        { to: "/admin/backup", label: "النسخ الاحتياطي" },
        { to: "/admin/notifications", label: "الإشعارات" },
      ],
    },
  },
  { kind: "leaf", to: "/settings", label: "الإعدادات", icon: Settings },
];

const ROLES = [
  { id: "super-admin", label: "مدير عام", icon: ShieldCheck },
  { id: "principal", label: "مدير مدرسة", icon: Building2 },
  { id: "registrar", label: "أمين تسجيل", icon: ClipboardList },
  { id: "teacher", label: "معلم", icon: UserCog },
  { id: "guardian", label: "ولي أمر", icon: HeartHandshake },
] as const;

/* Mobile bottom nav — primary entry points only */
const BOTTOM_NAV = [
  { to: "/", label: "الرئيسية", icon: LayoutDashboard },
  { to: "/students/new", label: "الطلاب", icon: Users },
  { to: "/attendance/take", label: "الحضور", icon: ClipboardCheck },
  { to: "/finance/dashboard", label: "المالية", icon: DollarSign },
  { to: "/settings", label: "الإعدادات", icon: Settings },
];

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);
  
  const [role, setRole] = useState<(typeof ROLES)[number]>(ROLES[0]);
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

  const netBalance = allPayments.reduce((sum, p) => sum + p.amount, 0) - allExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Dark Mode Theme Toggle Logic
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

  const currentLabel =
    title ??
    NAV.flatMap((n) => (n.kind === "leaf" ? [n] : n.group.items.map((i) => ({ to: i.to, label: i.label }))))
      .find((n) => n.to === pathname)?.label ??
    "لوحة التحكم";

  return (
    <div className="min-h-dvh bg-background text-foreground transition-colors duration-300" dir="rtl">
      {/* ============ Sidebar ============ */}
      <Sidebar
        pathname={pathname}
        onNavigate={() => setMobileOpen(false)}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden animate-in fade-in"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* ============ Main column ============ */}
      <div className="lg:mr-72 transition-all duration-300">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-md shadow-sm">
          <div className="grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6">
            {/* mobile toggle */}
            <button
              className="lg:hidden rounded-xl p-2 hover:bg-accent/50 transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="فتح القائمة الجانبية"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search */}
            <div className="relative hidden sm:block w-72">
              <button
                onClick={() => document.dispatchEvent(new CustomEvent('open-command-palette'))}
                className="flex items-center justify-between h-10 w-full rounded-xl border border-input/50 bg-background/50 px-3 text-sm text-muted-foreground hover:bg-accent/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 opacity-70" />
                  <span>ابحث السريع (Ctrl+K)...</span>
                </div>
                <span className="text-[10px] font-bold border border-border/60 bg-muted/30 px-1.5 py-0.5 rounded opacity-80 shadow-sm">Ctrl K</span>
              </button>
            </div>

            <div className="flex items-center gap-2 justify-self-end">
              
              {/* Financial Quick Status */}
              <div className="hidden md:flex items-center gap-2 px-3 h-10 rounded-xl border border-border/50 bg-card/50">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-muted-foreground">الرصيد:</span>
                <span className={`text-sm font-black tabular-nums ${netBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                  {netBalance.toLocaleString()} {currency}
                </span>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => updateSettings({ themeMode: isDark ? "light" : "dark" })}
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-border/50 bg-card/50 hover:bg-accent/50 transition-colors"
                aria-label="تبديل المظهر"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Stage Switcher */}
              <div className="relative">
                <button
                  onClick={() => {
                    setStageOpen((v) => !v);
                    setRoleOpen(false);
                    setProfileOpen(false);
                    setNotifOpen(false);
                  }}
                  className="hidden md:inline-flex h-10 items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
                >
                  <School className="h-4 w-4" />
                  <span>{getStageLabel(stage)}</span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </button>
                {stageOpen && (
                  <div className="absolute left-0 mt-2 w-56 overflow-hidden rounded-2xl border border-border/50 glass text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="border-b border-border/50 px-3 py-2 text-xs font-bold text-muted-foreground">
                      تحديد المرحلة الدراسية
                    </div>
                    {(["kindergarten", "primary", "middle", "high"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setStage(s);
                          setStageOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent/50 transition-colors ${
                          stage === s ? "text-primary font-bold bg-primary/5" : ""
                        }`}
                      >
                        <School className="h-4 w-4" />
                        <span>{getStageLabel(s)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => {
                    setNotifOpen((v) => !v);
                    setProfileOpen(false);
                    setRoleOpen(false);
                    setStageOpen(false);
                  }}
                  className="relative grid h-10 w-10 place-items-center rounded-xl border border-border/50 bg-card/50 hover:bg-accent/50 transition-colors"
                  aria-label="الإشعارات"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -left-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-danger-foreground animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                </button>
                {notifOpen && (
                  <div className="absolute left-0 mt-2 w-80 overflow-hidden rounded-2xl border border-border/50 glass text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b border-border/50 px-3 py-2 text-xs font-bold">
                      <span>الإشعارات ({unreadNotificationsCount})</span>
                      <button 
                        onClick={markAllNotificationsAsRead}
                        className="text-primary hover:underline"
                      >
                        تعليم الكل كمقروء
                      </button>
                    </div>
                    <ul className="max-h-80 divide-y divide-border/50 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <li className="p-4 text-center text-sm text-muted-foreground">لا توجد إشعارات</li>
                      ) : (
                        notifications.map(n => (
                          <li 
                            key={n.id} 
                            onClick={() => deleteNotification(n.id)}
                            className={`relative p-3 text-sm hover:bg-accent/20 transition-colors cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}
                          >
                            <div className={`font-semibold text-${n.type}`}>{n.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{n.message}</div>
                            <div className="text-[10px] text-muted-foreground/60 mt-1">{new Date(n.timestamp).toLocaleTimeString("ar-EG")}</div>
                            {!n.read && <div className="absolute left-3 top-3 h-2 w-2 rounded-full bg-primary" />}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileOpen((v) => !v);
                    setNotifOpen(false);
                    setRoleOpen(false);
                    setStageOpen(false);
                  }}
                  className="flex h-10 items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-1.5 pl-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-inner">
                    أ.ع
                  </div>
                  <div className="hidden text-right leading-tight md:block">
                    <div className="text-xs font-bold">أحمد العتيبي</div>
                    <div className="text-[10px] text-muted-foreground">{role.label}</div>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </button>
                {profileOpen && (
                  <div className="absolute left-0 mt-2 w-56 overflow-hidden rounded-2xl border border-border/50 glass text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="border-b border-border/50 px-3 py-3">
                      <div className="text-sm font-bold">أحمد العتيبي</div>
                      <div className="text-xs text-muted-foreground">ahmed@school.edu</div>
                    </div>
                    <Link 
                      to="/profile" 
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
                    >
                      <UserCircle2 className="h-4 w-4" /> الملف الشخصي
                    </Link>
                    <Link 
                      to="/settings" 
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
                    >
                      <Settings className="h-4 w-4" /> الإعدادات
                    </Link>
                    <div className="border-t border-border/50" />
                    <Link 
                      to="/"
                      onClick={() => {
                        setProfileOpen(false);
                        alert("تم تسجيل الخروج بنجاح!");
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                    >
                      تسجيل الخروج
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sub header: title + breadcrumb + actions */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border/50 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              {breadcrumb && breadcrumb.length > 0 && (
                <nav className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                  {breadcrumb.map((b, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {i > 0 && <ChevronLeft className="h-4 w-4 text-muted-foreground opacity-50" />}
                      {b.to ? (
                        <Link to={b.to} className="text-muted-foreground hover:text-foreground font-bold text-sm transition-colors">{b.label}</Link>
                      ) : b.onClick ? (
                        <button onClick={b.onClick} className="text-muted-foreground hover:text-foreground font-bold text-sm transition-colors">{b.label}</button>
                      ) : (
                        <span className="text-foreground font-bold text-sm">{b.label}</span>
                      )}
                    </div>
                  ))}
                </nav>
              )}
              <h1 className="truncate text-lg font-extrabold sm:text-xl tracking-tight">{currentLabel}</h1>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>

        {/* Page content with entrance animation */}
        <main className="p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border/50 glass lg:hidden pb-safe">
        {BOTTOM_NAV.map((n) => {
          const active = pathname === n.to;
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform ${active ? "scale-110" : ""}`} />
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>
      <CommandPalette />
    </div>
  );
}

function Sidebar({
  pathname,
  onNavigate,
  mobileOpen,
  onClose,
}: {
  pathname: string;
  onNavigate: () => void;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const { stage, getStageLabel } = useStage();

  return (
    <aside
      className={[
        "fixed inset-y-0 right-0 z-40 w-72 bg-[#1e293b] text-slate-100 border-l border-slate-800 shadow-xl",
        "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] lg:translate-x-0",
        mobileOpen ? "translate-x-0 shadow-2xl" : "translate-x-full lg:translate-x-0",
      ].join(" ")}
    >
      {/* Brand */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
            <School className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-tight">منصة مدارس</div>
            <div className="text-[11px] font-bold text-primary/90">{getStageLabel(stage)}</div>
          </div>
        </Link>
        <button
          className="lg:hidden rounded-xl p-2 hover:bg-slate-800 transition-colors"
          onClick={onClose}
          aria-label="إغلاق"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="h-[calc(100dvh-4rem)] space-y-1 overflow-y-auto px-3 py-4 custom-scrollbar">
        {NAV.map((item, idx) => {
          if (item.kind === "leaf") {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[0.98]"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          }
          return (
            <SidebarGroupBlock
              key={`g-${idx}`}
              group={item.group}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          );
        })}

        <div className="mt-8 rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-xs">
          <div className="text-slate-400 font-medium">العام الدراسي الحالي</div>
          <div className="mt-1 font-bold text-sm tracking-tight">١٤٤٦ هـ — الفصل الأول</div>
        </div>
      </nav>
    </aside>
  );
}

function SidebarGroupBlock({
  group,
  pathname,
  onNavigate,
}: {
  group: Group;
  pathname: string;
  onNavigate: () => void;
}) {
  const isActiveBranch = group.items.some((i) => pathname === i.to || pathname.startsWith(i.to + "/"));
  const [open, setOpen] = useState<boolean>(isActiveBranch || true); 
  const Icon = group.icon;
  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
          isActiveBranch
            ? "text-white font-bold"
            : "text-slate-300 hover:bg-slate-800 hover:text-white",
        ].join(" ")}
      >
        <Icon className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="flex-1 text-right">{group.label}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180 text-blue-400" : "opacity-60"}`} />
      </button>
      
      {open && (
        <div className="mr-4 mt-1 space-y-0.5 border-r-2 border-slate-700 pr-3 animate-in slide-in-from-top-2 duration-200">
          {group.items.map((leaf) => {
            const active = pathname === leaf.to;
            return (
              <Link
                key={leaf.to}
                to={leaf.to}
                onClick={onNavigate}
                className={[
                  "block rounded-lg px-3 py-2 text-[13px] transition-all duration-200",
                  active
                    ? "bg-blue-500/10 text-blue-400 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800",
                ].join(" ")}
              >
                {leaf.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Shared small UI atoms ---------------------------------------------------- */

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
    neutral: "bg-muted/80 text-muted-foreground border-transparent",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning-foreground border-warning/20",
    danger: "bg-danger/10 text-danger border-danger/20",
    info: "bg-info/10 text-info border-info/20",
    primary: "bg-primary/10 text-primary border-primary/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border backdrop-blur-sm ${map[tone]} ${className}`}>
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
    <section className={`rounded-xl border border-border/50 bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
      {(title || actions) && (
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/50 px-6 py-5 bg-transparent rounded-t-xl">
          <div className="min-w-0">
            {title && <h2 className="truncate font-bold text-lg tracking-tight">{title}</h2>}
            {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-6">{children}</div>
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
    <div className="grid place-items-center rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-16 text-center animate-in fade-in duration-500">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary mb-4 shadow-inner">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="font-bold text-lg tracking-tight">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
