import { Link, useRouterState } from "@tanstack/react-router";
import { 
  UserCheck, 
  Clock, 
  BarChart3, 
  ShieldAlert, 
  Sparkles, 
  Users,
  CheckCircle2,
  Calendar,
  Layers
} from "lucide-react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";

export interface AttendanceNavProps {
  activeTab?: "hub" | "take" | "reports" | "incidents" | "merits";
  quickActions?: React.ReactNode;
}

export function AttendanceDisciplineNav({ activeTab, quickActions }: AttendanceNavProps) {
  const router = useRouterState();
  const pathname = router.location.pathname;
  const { stage, getStageLabel } = useStage();
  const { 
    activeStageStudents, 
    allAttendanceRecords,
    allBehaviorTransactions,
    activeAcademicTerm 
  } = useGlobalStore();

  const NAV_ITEMS = [
    {
      to: "/attendance",
      label: "مركز الحضور الموحد",
      sublabel: "الرصد اليومي للطلاب والكوادر",
      icon: UserCheck,
      match: pathname === "/attendance" || pathname === "/attendance/",
      badge: `${activeStageStudents.length} طالب`,
      tone: "primary" as const
    },
    {
      to: "/attendance/take",
      label: "رصد الحصص السريع",
      sublabel: "تسجيل غياب الحصة والجدول",
      icon: Clock,
      match: pathname.startsWith("/attendance/take"),
      badge: "مباشر",
      tone: "amber" as const
    },
    {
      to: "/attendance/reports",
      label: "تحليلات ومؤشرات الغياب",
      sublabel: "السجل الشهري واكتشاف التسرب",
      icon: BarChart3,
      match: pathname.startsWith("/attendance/reports"),
      badge: "تقارير",
      tone: "info" as const
    },
    {
      to: "/discipline/incidents",
      label: "المخالفات السلوكية",
      sublabel: "رصد التجاوزات وحسم النقاط",
      icon: ShieldAlert,
      match: pathname.startsWith("/discipline/incidents"),
      badge: "انضباط",
      tone: "danger" as const
    },
    {
      to: "/discipline/merits",
      label: "النقاط والمكافآت",
      sublabel: "تعزيز السلوك الإيجابي والتميز",
      icon: Sparkles,
      match: pathname.startsWith("/discipline/merits"),
      badge: "تحفيز",
      tone: "success" as const
    },
  ];

  return (
    <div className="bg-card/95 backdrop-blur-xl border border-border/80 rounded-3xl p-3 sm:p-4 shadow-sm mb-6 space-y-3" dir="rtl">
      {/* Top Meta Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground font-bold">
          <div className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <span className="text-foreground font-black text-xs">منظومة الحضور والانضباط المدرسي المتكاملة</span>
          <span>•</span>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
            {getStageLabel(stage)}
          </span>
          {activeAcademicTerm && (
            <>
              <span>•</span>
              <span className="text-muted-foreground hidden sm:inline">{activeAcademicTerm.name}</span>
            </>
          )}
        </div>

        {quickActions && (
          <div className="flex items-center gap-2 mr-auto">
            {quickActions}
          </div>
        )}
      </div>

      {/* Navigation Tabs Pill Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1 border-t border-border/50">
        {NAV_ITEMS.map((item) => {
          const isActive = item.match;
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between group ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-[1.01]"
                  : "bg-background/80 hover:bg-muted/50 border-border/60 text-foreground hover:border-primary/40 shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl transition-colors ${
                  isActive 
                    ? "bg-white/20 text-white" 
                    : "bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isActive
                    ? "bg-white/25 text-white"
                    : item.tone === "danger"
                    ? "bg-destructive/10 text-destructive"
                    : item.tone === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {item.badge}
                </span>
              </div>

              <div>
                <div className="font-black text-xs leading-snug">{item.label}</div>
                <div className={`text-[10px] mt-0.5 truncate ${
                  isActive ? "text-primary-foreground/80 font-medium" : "text-muted-foreground"
                }`}>
                  {item.sublabel}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
