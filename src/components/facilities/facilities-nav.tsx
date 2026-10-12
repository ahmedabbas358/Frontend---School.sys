import { Link } from "@tanstack/react-router";
import { 
  Building2, 
  Wrench, 
  BarChart3, 
  Package, 
  Bus, 
  HeartPulse, 
  DollarSign, 
  BookOpen,
  CheckCircle2,
  Users,
  Layers,
  Sparkles
} from "lucide-react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";

export type FacilityTabId = 
  | "dashboard" 
  | "rooms" 
  | "maintenance" 
  | "library-textbooks" 
  | "library-distribution" 
  | "inventory" 
  | "clinic" 
  | "transport-routes" 
  | "transport-students";

interface FacilitiesNavTabsProps {
  activeTab: FacilityTabId;
}

export function FacilitiesNavTabs({ activeTab }: FacilitiesNavTabsProps) {
  const { 
    allRooms, 
    allMaintenanceRequests, 
    activeStageTextbooks,
    activeStageDistributions,
    allInventoryItems,
    activeStageClinicVisits,
    transportRoutes,
    transportSubscriptions
  } = useGlobalStore();

  const totalRooms = allRooms.length;
  const maintenanceRooms = allRooms.filter((r) => r.status === "maintenance").length;
  const pendingTickets = allMaintenanceRequests.filter((m) => m.status !== "completed").length;
  const urgentTickets = allMaintenanceRequests.filter(
    (m) => m.priority === "high" && m.status !== "completed"
  ).length;

  // Inventory stats
  const lowStockCount = allInventoryItems.filter(
    (i) => i.status === "low_stock" || i.status === "out_of_stock" || i.quantity <= 5
  ).length;

  // Clinic today visits
  const todayStr = new Date().toISOString().split("T")[0];
  const todayVisits = activeStageClinicVisits.filter((v) => v.date === todayStr).length;

  // Operational health calculation
  const roomHealth = totalRooms > 0 ? ((totalRooms - maintenanceRooms) / totalRooms) * 60 : 60;
  const maintHealth = urgentTickets === 0 ? 30 : Math.max(0, 30 - urgentTickets * 8);
  const healthScore = Math.min(100, Math.round(roomHealth + maintHealth + 10));

  const tabs: Array<{
    id: FacilityTabId;
    label: string;
    href: string;
    icon: any;
    badge: string;
    badgeColor: string;
    category?: string;
  }> = [
    {
      id: "dashboard",
      label: "مركز القيادة",
      href: "/facilities/dashboard",
      icon: BarChart3,
      badge: `${healthScore}% جاهزية`,
      badgeColor: healthScore > 85 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    },
    {
      id: "rooms",
      label: "المباني والقاعات",
      href: "/facilities/rooms",
      icon: Building2,
      badge: `${totalRooms} قاعة`,
      badgeColor: "bg-primary/10 text-primary",
    },
    {
      id: "maintenance",
      label: "طلبات الصيانة",
      href: "/facilities/maintenance",
      icon: Wrench,
      badge: urgentTickets > 0 ? `${pendingTickets} (${urgentTickets} عاجل)` : `${pendingTickets} بلاغ`,
      badgeColor: urgentTickets > 0 ? "bg-destructive/15 text-destructive font-black animate-pulse" : "bg-warning/15 text-warning-foreground",
    },
    {
      id: "library-textbooks",
      label: "مستودع الكتب",
      href: "/library/textbooks",
      icon: BookOpen,
      badge: `${activeStageTextbooks.length} مقرر`,
      badgeColor: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    },
    {
      id: "library-distribution",
      label: "تسليم المقررات",
      href: "/library/distribution",
      icon: CheckCircle2,
      badge: `${activeStageDistributions.length} عملية تسليم`,
      badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
    {
      id: "inventory",
      label: "المستودع والمخزون",
      href: "/inventory/items",
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} منخفض` : `${allInventoryItems.length} صنف`,
      badgeColor: lowStockCount > 0 ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black" : "bg-purple-500/15 text-purple-600 dark:text-purple-400",
    },
    {
      id: "clinic",
      label: "العيادة المدرسية",
      href: "/clinic/visits",
      icon: HeartPulse,
      badge: todayVisits > 0 ? `${todayVisits} اليوم` : `${activeStageClinicVisits.length} زيارة`,
      badgeColor: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    },
    {
      id: "transport-routes",
      label: "مسارات الحافلات",
      href: "/transport/routes",
      icon: Bus,
      badge: `${transportRoutes.length} خط سير`,
      badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    },
    {
      id: "transport-students",
      label: "اشتراكات النقل",
      href: "/transport/students",
      icon: Users,
      badge: `${transportSubscriptions.length} مشترك`,
      badgeColor: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    },
  ];

  return (
    <div className="flex flex-col gap-2.5 pb-3 border-b border-border/70 mb-5">
      {/* Top Header Row with Cross-Service Expense Link */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-black text-foreground">منظومة المرافق والخدمات المدرسية الموحدة</span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">• تكامل العمليات التشغيلية والصيانة والمخازن والنقل والعيادة</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/finance/expenses"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 hover:border-emerald-500/40 bg-card hover:bg-emerald-500/5 transition-all text-xs font-bold text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 shadow-2xs"
            title="فواتير ومصروفات الصيانة والتشغيل المقيدة مالياً"
          >
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
            <span>مصروفات التشغيل والصيانة</span>
          </Link>
        </div>
      </div>

      {/* Primary 9-Module Tabs Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 rounded-2xl bg-muted/40 border border-border/60">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              to={tab.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 glow-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/80"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : tab.badgeColor
                }`}
              >
                {tab.badge}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
