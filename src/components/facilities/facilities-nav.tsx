import { Link } from "@tanstack/react-router";
import { 
  Building2, 
  Wrench, 
  BarChart3, 
  Package, 
  Bus, 
  HeartPulse, 
  DollarSign, 
  SlidersHorizontal 
} from "lucide-react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";

interface FacilitiesNavTabsProps {
  activeTab: "dashboard" | "rooms" | "maintenance";
}

export function FacilitiesNavTabs({ activeTab }: FacilitiesNavTabsProps) {
  const { allRooms, allMaintenanceRequests } = useGlobalStore();

  const totalRooms = allRooms.length;
  const maintenanceRooms = allRooms.filter((r) => r.status === "maintenance").length;
  const pendingTickets = allMaintenanceRequests.filter((m) => m.status !== "completed").length;
  const urgentTickets = allMaintenanceRequests.filter(
    (m) => m.priority === "high" && m.status !== "completed"
  ).length;

  // Operational health calculation
  const roomHealth = totalRooms > 0 ? ((totalRooms - maintenanceRooms) / totalRooms) * 60 : 60;
  const maintHealth = urgentTickets === 0 ? 30 : Math.max(0, 30 - urgentTickets * 8);
  const healthScore = Math.min(100, Math.round(roomHealth + maintHealth + 10));

  const tabs = [
    {
      id: "dashboard",
      label: "مركز القيادة والإحصاءات",
      href: "/facilities/dashboard",
      icon: BarChart3,
      badge: `${healthScore}% جاهزية`,
      badgeColor: healthScore > 85 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    },
    {
      id: "rooms",
      label: "المباني والقاعات الذكية",
      href: "/facilities/rooms",
      icon: Building2,
      badge: `${totalRooms} قاعة`,
      badgeColor: "bg-primary/10 text-primary",
    },
    {
      id: "maintenance",
      label: "طلبات وبلاغات الصيانة",
      href: "/facilities/maintenance",
      icon: Wrench,
      badge: urgentTickets > 0 ? `${pendingTickets} (${urgentTickets} عاجل)` : `${pendingTickets} بلاغ`,
      badgeColor: urgentTickets > 0 ? "bg-destructive/10 text-destructive font-black animate-pulse" : "bg-warning/15 text-warning-foreground",
    },
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/70 mb-5">
      {/* Primary Module Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 rounded-2xl bg-muted/30 border border-border/60">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              to={tab.href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 glow-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
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

      {/* Cross-Module Quick Links */}
      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground shrink-0 overflow-x-auto no-scrollbar">
        <span className="text-[11px] text-muted-foreground/70 hidden lg:inline">ربط الخدمات:</span>
        <Link
          to="/inventory/items"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border/70 hover:border-primary/40 hover:bg-card transition-colors text-[11px]"
          title="قطع الغيار وتجهيزات الفصول"
        >
          <Package className="h-3.5 w-3.5 text-purple-500" />
          <span>المستودعات</span>
        </Link>
        <Link
          to="/transport/routes"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border/70 hover:border-primary/40 hover:bg-card transition-colors text-[11px]"
          title="أسطول الحافلات المدرسية"
        >
          <Bus className="h-3.5 w-3.5 text-amber-500" />
          <span>النقل</span>
        </Link>
        <Link
          to="/clinic/visits"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border/70 hover:border-primary/40 hover:bg-card transition-colors text-[11px]"
          title="العيادة المدرسية والإسعافات"
        >
          <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
          <span>العيادة</span>
        </Link>
        <Link
          to="/finance/expenses"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border/70 hover:border-primary/40 hover:bg-card transition-colors text-[11px]"
          title="فواتير ومصروفات الصيانة المقيدة"
        >
          <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
          <span>مصروفات الصيانة</span>
        </Link>
      </div>
    </div>
  );
}
