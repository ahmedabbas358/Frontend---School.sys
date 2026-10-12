import { Link, useLocation } from "@tanstack/react-router";
import { useGlobalStore, defaultFeatures } from "@/contexts/GlobalStoreContext";
import {
  LayoutDashboard,
  SlidersHorizontal,
  Users,
  ShieldCheck,
  ShieldAlert,
  Clock,
  HardDrive,
  BellRing,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useMemo } from "react";

interface AdminNavProps {
  activeTab?: string;
  className?: string;
}

export function AdminNav({ activeTab, className = "" }: AdminNavProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const {
    allUsers,
    systemSettings,
    allActivityLogs,
    transportSubscriptions,
  } = useGlobalStore();

  const currentFeatures = systemSettings?.features || defaultFeatures;
  const activeFeaturesCount = useMemo(
    () => Object.values(currentFeatures).filter(Boolean).length,
    [currentFeatures]
  );
  const totalFeaturesCount = useMemo(
    () => Object.keys(currentFeatures).length || 20,
    [currentFeatures]
  );

  const activeUsersCount = useMemo(
    () => (allUsers || []).filter((u) => u.status === "active").length,
    [allUsers]
  );

  const recentCriticalLogs = useMemo(
    () => (allActivityLogs || []).filter((l) => l.action.includes("فشل") || l.action.includes("أمني")).length,
    [allActivityLogs]
  );

  const navItems = [
    {
      to: "/admin/dashboard",
      label: "مركز القيادة والتحكم",
      icon: LayoutDashboard,
      badge: null,
      tone: "primary",
    },
    {
      to: "/admin/features",
      label: "التحكم بالميزات والوحدات",
      icon: SlidersHorizontal,
      badge: `${activeFeaturesCount}/${totalFeaturesCount}`,
      tone: activeFeaturesCount === totalFeaturesCount ? "emerald" : "primary",
    },
    {
      to: "/admin/users",
      label: "حسابات المستخدمين",
      icon: Users,
      badge: allUsers?.length || 0,
      tone: "primary",
    },
    {
      to: "/admin/roles",
      label: "الأدوار ومستويات الوصول",
      icon: ShieldCheck,
      badge: null,
      tone: "primary",
    },
    {
      to: "/admin/permissions",
      label: "مصفوفة الصلاحيات (RBAC)",
      icon: ShieldAlert,
      badge: null,
      tone: "amber",
    },
    {
      to: "/admin/backup",
      label: "النسخ الاحتياطي والاسترجاع",
      icon: HardDrive,
      badge: "AES-256",
      tone: "emerald",
    },
    {
      to: "/admin/notifications",
      label: "مركز التنبيهات والبث",
      icon: BellRing,
      badge: null,
      tone: "primary",
    },
    {
      to: "/admin/activity-log",
      label: "سجل التدقيق والأمان",
      icon: Clock,
      badge: recentCriticalLogs > 0 ? `${recentCriticalLogs} تنبيه` : null,
      tone: recentCriticalLogs > 0 ? "rose" : "neutral",
    },
  ];

  return (
    <div className={`w-full overflow-x-auto pb-1 mb-6 scrollbar-none select-none ${className}`}>
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-card/80 backdrop-blur-md border border-border/80 shadow-xs min-w-max">
        {navItems.map((item) => {
          const isActive =
            activeTab === item.to ||
            currentPath === item.to ||
            (item.to !== "/admin/dashboard" && currentPath.startsWith(item.to));

          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to as any}
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground font-black shadow-sm glow-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`ms-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black tabular-nums transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : item.tone === "rose"
                      ? "bg-destructive/15 text-destructive"
                      : item.tone === "emerald"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
