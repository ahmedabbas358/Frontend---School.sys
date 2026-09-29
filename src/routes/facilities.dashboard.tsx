import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { AdminModal } from "@/components/admin/admin-modal";
import { FacilitiesNavTabs } from "@/components/facilities/facilities-nav";
import { useGlobalStore, Room, MaintenanceRequest } from "@/contexts/GlobalStoreContext";
import {
  Building2,
  Wrench,
  BookOpen,
  Package,
  HeartPulse,
  Bus,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  ArrowUpRight,
  Plus,
  ExternalLink,
  ShieldCheck,
  Monitor,
  Wifi,
  Sparkles,
  Layers,
  Check,
  RefreshCw,
  DoorOpen,
  X,
  FileSpreadsheet,
  Activity,
  SlidersHorizontal,
  Flame,
  Gauge
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
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/facilities/dashboard")({
  head: () => ({ meta: [{ title: "مركز قيادة المرافق والخدمات | منصة مدارس" }] }),
  component: FacilitiesDashboard,
});

const PALETTE = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

function StatMetricCard({ 
  icon: Icon, 
  label, 
  value, 
  subtitle, 
  tone = "primary", 
  linkTo,
  linkLabel
}: {
  icon: any;
  label: string;
  value: string | number;
  subtitle?: string;
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
    <div className="rounded-2xl border border-border bg-card p-4.5 shadow-xs hover:border-border/80 transition-all">
      <div className="flex items-center justify-between">
        <div className={`grid h-11 w-11 place-items-center rounded-2xl ${currentTone.bg} ${currentTone.text}`}>
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
      {subtitle && <div className="text-[11px] text-muted-foreground mt-1 font-medium">{subtitle}</div>}
    </div>
  );
}

function FacilitiesDashboard() {
  const { 
    allMaintenanceRequests, 
    allRooms, 
    activeStageTextbooks, 
    allInventoryItems, 
    activeStageClinicVisits,
    transportRoutes,
    transportSubscriptions,
    updateMaintenanceRequest,
    addMaintenanceRequest,
    addRoom,
    updateRoom,
    addActivityLog,
    currency 
  } = useGlobalStore();

  // Modals state
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Quick Maintenance Form State
  const [maintData, setMaintData] = useState({
    title: "",
    roomId: "",
    category: "تكييف وتبريد",
    priority: "high" as "low" | "medium" | "high",
    description: "",
    technicianName: "",
    costEstimate: 0,
    autoSetRoomMaintenance: true,
  });

  // Quick Room Form State
  const [roomData, setRoomData] = useState({
    name: "",
    building: "المبنى الرئيسي (أ)",
    floor: "الأول",
    type: "classroom" as "classroom" | "lab" | "office" | "hall",
    capacity: 30,
    status: "available" as "available" | "occupied" | "maintenance",
  });

  // Metrics
  const metrics = useMemo(() => {
    const totalRooms = allRooms.length;
    const availableRooms = allRooms.filter(r => r.status === "available").length;
    const occupiedRooms = allRooms.filter(r => r.status === "occupied").length;
    const maintenanceRooms = allRooms.filter(r => r.status === "maintenance").length;
    const totalCapacity = allRooms.reduce((sum, r) => sum + (r.capacity || 0), 0);

    const pendingMaintenance = allMaintenanceRequests.filter(m => m.status !== "completed");
    const urgentMaintenance = allMaintenanceRequests.filter(m => m.priority === "high" && m.status !== "completed");
    const completedMaintenance = allMaintenanceRequests.filter(m => m.status === "completed");
    const totalMaintenanceExpenses = completedMaintenance.reduce((sum, m) => sum + (m.costEstimate || 0), 0);

    const totalBooks = activeStageTextbooks.reduce((acc: number, curr: any) => acc + (curr.copies || 0), 0);
    const lowStockInventory = allInventoryItems.filter(i => i.status === "low_stock" || i.status === "out_of_stock").length;

    // Transport metrics
    const totalBusCapacity = transportRoutes.reduce((sum, r) => sum + (r.capacity || 0), 0);
    const totalBusSubs = transportSubscriptions.filter(s => s.status === "active").length;

    // Facility Health Score (0 - 100)
    const roomHealth = totalRooms > 0 ? ((totalRooms - maintenanceRooms) / totalRooms) * 60 : 60;
    const maintHealth = urgentMaintenance.length === 0 ? 30 : Math.max(0, 30 - urgentMaintenance.length * 8);
    const invHealth = lowStockInventory === 0 ? 10 : Math.max(0, 10 - lowStockInventory * 2);
    const healthScore = Math.min(100, Math.round(roomHealth + maintHealth + invHealth));

    return {
      totalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      totalCapacity,
      pendingMaintenanceCount: pendingMaintenance.length,
      urgentMaintenanceCount: urgentMaintenance.length,
      completedMaintenanceCount: completedMaintenance.length,
      totalMaintenanceExpenses,
      totalBooks,
      lowStockInventory,
      clinicVisitsCount: activeStageClinicVisits.length,
      totalBusCapacity,
      totalBusSubs,
      healthScore,
    };
  }, [allRooms, allMaintenanceRequests, activeStageTextbooks, allInventoryItems, activeStageClinicVisits, transportRoutes, transportSubscriptions]);

  // Buildings Occupancy Summary
  const buildingsSummary = useMemo(() => {
    const map = new Map<string, { total: number; available: number; occupied: number; maintenance: number; capacity: number }>();
    allRooms.forEach(r => {
      const b = r.building || "المبنى العام";
      const cur = map.get(b) || { total: 0, available: 0, occupied: 0, maintenance: 0, capacity: 0 };
      cur.total += 1;
      cur.capacity += r.capacity || 0;
      if (r.status === "available") cur.available += 1;
      else if (r.status === "occupied") cur.occupied += 1;
      else if (r.status === "maintenance") cur.maintenance += 1;
      map.set(b, cur);
    });
    return Array.from(map.entries()).map(([building, stats]) => ({ building, ...stats }));
  }, [allRooms]);

  // Donut chart: Rooms by type
  const roomTypeDistribution = useMemo(() => {
    const types: Record<string, string> = {
      classroom: "فصول دراسية",
      lab: "مختبرات ومعامل",
      office: "مكاتب إدارية",
      hall: "قاعات عامة ومسارح",
    };
    const counts: Record<string, number> = {};
    allRooms.forEach(r => {
      const label = types[r.type] || "أخرى";
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [allRooms]);

  // Bar chart: Maintenance requests by category
  const maintenanceCategoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    allMaintenanceRequests.forEach(m => {
      const cat = m.category || "أخرى";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([category, count]) => ({ category, count }));
  }, [allMaintenanceRequests]);

  // Urgent active tickets list
  const urgentTickets = useMemo(() => {
    return allMaintenanceRequests
      .filter(m => m.status !== "completed")
      .sort((a, b) => (a.priority === "high" ? -1 : 1))
      .slice(0, 6);
  }, [allMaintenanceRequests]);

  // Quick Action: Start Ticket
  const handleQuickStart = (ticket: MaintenanceRequest) => {
    updateMaintenanceRequest(ticket.id, { status: "in_progress" });
    addActivityLog({
      user: "مدير المرافق والخدمات",
      action: "بدء صيانة ميدانية",
      entity: "طلبات الصيانة",
      details: `تم بدء العمل الميداني على بلاغ الصيانة: ${ticket.title} (${ticket.id})`,
    });
    toast.success(`تم تحديث حالة البلاغ (${ticket.title}) إلى قيد التنفيذ`);
  };

  // Submit Quick Maintenance
  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintData.title.trim()) {
      toast.error("يرجى كتابة عنوان البلاغ");
      return;
    }

    const selectedRoom = allRooms.find(r => r.id === maintData.roomId);
    const locationStr = selectedRoom
      ? `${selectedRoom.building} - ${selectedRoom.name} (${selectedRoom.floor})`
      : "الموقع العام بالمدرسة";

    addMaintenanceRequest({
      title: maintData.title.trim(),
      description: maintData.description || `بلاغ صيانة سريع صادر من مركز القيادة: ${maintData.title}`,
      location: locationStr,
      roomId: selectedRoom?.id,
      roomName: selectedRoom?.name,
      category: maintData.category,
      priority: maintData.priority,
      status: "new",
      technicianName: maintData.technicianName || "فريق الصيانة الميدانية",
      dateRequested: new Date().toISOString().split("T")[0],
      costEstimate: Number(maintData.costEstimate) || 0,
    });

    if (selectedRoom && maintData.autoSetRoomMaintenance) {
      updateRoom(selectedRoom.id, { status: "maintenance" });
    }

    addActivityLog({
      user: "مدير المرافق والخدمات",
      action: "رفع بلاغ صيانة",
      entity: "طلبات الصيانة",
      details: `تسجيل بلاغ صيانة عاجل من لوحة القيادة: ${maintData.title} في ${locationStr}`,
    });

    toast.success("تم إرسال بلاغ الصيانة بنجاح وإدراجه في قائمة الأولويات");
    setIsMaintModalOpen(false);
    setMaintData({
      title: "",
      roomId: "",
      category: "تكييف وتبريد",
      priority: "high",
      description: "",
      technicianName: "",
      costEstimate: 0,
      autoSetRoomMaintenance: true,
    });
  };

  // Submit Quick Room
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomData.name.trim()) {
      toast.error("يرجى تحديد اسم القاعة أو المرفق");
      return;
    }

    addRoom({
      name: roomData.name.trim(),
      building: roomData.building,
      floor: roomData.floor,
      type: roomData.type,
      capacity: Number(roomData.capacity) || 30,
      status: roomData.status,
    });

    addActivityLog({
      user: "مدير المرافق والخدمات",
      action: "إضافة قاعة جديدة",
      entity: "المرافق والقاعات",
      details: `تم تسجيل قاعة جديدة: ${roomData.name} في ${roomData.building} (السعة: ${roomData.capacity})`,
    });

    toast.success(`تمت إضافة القاعة ${roomData.name} بنجاح`);
    setIsRoomModalOpen(false);
    setRoomData({
      name: "",
      building: "المبنى الرئيسي (أ)",
      floor: "الأول",
      type: "classroom",
      capacity: 30,
      status: "available",
    });
  };

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "المرافق والخدمات" }, { label: "مركز القيادة والتشغيل" }]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
          >
            <Gauge className="h-4 w-4 text-emerald-600" /> فحص الجاهزية التشغيلية
          </button>
          <button
            onClick={() => setIsRoomModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
          >
            <Plus className="h-4 w-4 text-primary" /> قاعة جديدة
          </button>
          <button
            onClick={() => setIsMaintModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
          >
            <AlertTriangle className="h-4 w-4 text-amber-300" /> بلاغ صيانة فوري
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <FacilitiesNavTabs activeTab="dashboard" />

        {/* Banner Header */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-r from-primary/10 via-background to-card p-6 shadow-xs">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-md shrink-0">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-black tracking-tight">مركز قيادة وتشغيل المرافق والخدمات المدرسية</h1>
                  <span className="text-xs font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-3 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> مؤشر الجاهزية: {metrics.healthScore}%
                  </span>
                </div>
                <p className="text-sm font-medium text-muted-foreground mt-1 max-w-2xl">
                  مراقبة حية لإشغال المباني، إدارة الصيانة الميدانية، متابعة حركة المستودعات والعيادة، ومسارات النقل المدرسي
                </p>
              </div>
            </div>

            {/* Quick Action Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsRoomModalOpen(true)}
                className="flex items-center gap-1.5 bg-card hover:bg-muted border border-border px-3.5 py-2 rounded-xl text-xs font-bold text-foreground transition-all shadow-2xs active:scale-[0.98]"
              >
                <Plus className="h-3.5 w-3.5 text-primary" /> قاعة جديدة
              </button>
              <button
                onClick={() => setIsMaintModalOpen(true)}
                className="flex items-center gap-1.5 bg-card hover:bg-muted border border-border px-3.5 py-2 rounded-xl text-xs font-bold text-foreground transition-all shadow-2xs active:scale-[0.98]"
              >
                <Wrench className="h-3.5 w-3.5 text-amber-500" /> بلاغ صيانة
              </button>
              <Link
                to="/facilities/rooms"
                className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
              >
                <DoorOpen className="h-3.5 w-3.5" /> دليل القاعات
              </Link>
            </div>
          </div>
        </div>

        {/* Operational KPI Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatMetricCard
            icon={Building2}
            label="إجمالي القاعات والمرافق"
            value={metrics.totalRooms}
            subtitle={`${metrics.availableRooms} متاحة • ${metrics.occupiedRooms} مشغولة`}
            tone="primary"
            linkTo="/facilities/rooms"
            linkLabel="القاعات"
          />

          <StatMetricCard
            icon={Wrench}
            label="أعمال صيانة جارية"
            value={metrics.pendingMaintenanceCount}
            subtitle={`${metrics.urgentMaintenanceCount} عطل عاجل يتطلب تدخل`}
            tone={metrics.urgentMaintenanceCount > 0 ? "danger" : metrics.pendingMaintenanceCount > 0 ? "warning" : "success"}
            linkTo="/facilities/maintenance"
            linkLabel="البلاغات"
          />

          <StatMetricCard
            icon={CheckCircle2}
            label="صيانة منجزة هذا العام"
            value={metrics.completedMaintenanceCount}
            subtitle={`إجمالي تكلفة: ${metrics.totalMaintenanceExpenses.toLocaleString()} ${currency}`}
            tone="success"
            linkTo="/facilities/maintenance"
            linkLabel="السجل"
          />

          <StatMetricCard
            icon={Package}
            label="نواقص وتجهيزات المستودع"
            value={metrics.lowStockInventory}
            subtitle="أصناف وصلت للحد الأدنى"
            tone={metrics.lowStockInventory > 0 ? "warning" : "success"}
            linkTo="/inventory/items"
            linkLabel="المستودع"
          />

          <StatMetricCard
            icon={HeartPulse}
            label="سجل الزيارات الصحية"
            value={metrics.clinicVisitsCount}
            subtitle="حالات تلقت رعاية طبية"
            tone="purple"
            linkTo="/clinic/visits"
            linkLabel="العيادة"
          />

          <StatMetricCard
            icon={Bus}
            label="اشتراكات النقل المدرسي"
            value={metrics.totalBusSubs}
            subtitle={`من أصل ${metrics.totalBusCapacity} مقعد بالحافلات`}
            tone="primary"
            linkTo="/transport/students"
            linkLabel="الحافلات"
          />
        </div>

        {/* Buildings Occupancy Overview Bar */}
        <PageCard 
          title="مؤشر إشغال المباني والأجنحة المدرسية"
          description="حالة توفر القاعات والفصول الدراسية في كل مبنى"
          actions={
            <Link to="/facilities/rooms" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
              عرض الخريطة التفاعلية <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {buildingsSummary.map((b) => {
              const occPercent = b.total > 0 ? Math.round((b.occupied / b.total) * 100) : 0;
              const maintPercent = b.total > 0 ? Math.round((b.maintenance / b.total) * 100) : 0;
              const availPercent = 100 - occPercent - maintPercent;

              return (
                <div key={b.building} className="rounded-2xl border border-border/80 bg-background/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary grid place-items-center font-bold text-xs">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground">{b.building}</div>
                        <div className="text-[11px] text-muted-foreground">الطاقة الاستيعابية: {b.capacity} مقعد</div>
                      </div>
                    </div>
                    <span className="text-xs font-black bg-muted px-2.5 py-1 rounded-lg tabular-nums">
                      {b.total} قاعات
                    </span>
                  </div>

                  {/* Multi-segment Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden flex">
                      <div style={{ width: `${occPercent}%` }} className="bg-primary h-full" title={`مشغولة: ${occPercent}%`} />
                      <div style={{ width: `${maintPercent}%` }} className="bg-amber-500 h-full" title={`صيانة: ${maintPercent}%`} />
                      <div style={{ width: `${availPercent}%` }} className="bg-emerald-500 h-full" title={`متاحة: ${availPercent}%`} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-primary flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-primary inline-block" /> مشغولة: {b.occupied}
                      </span>
                      <span className="text-amber-600 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> صيانة: {b.maintenance}
                      </span>
                      <span className="text-emerald-600 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> متاحة: {b.available}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </PageCard>

        {/* Two-Column Analytics & Live Feed */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Urgent Maintenance Dispatch Stream (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <PageCard
              title="البلاغات الميدانية العاجلة والجارية"
              description="أحدث طلبات الصيانة التي تتطلب متابعة الفنيين واعتماد الإنجاز"
              actions={
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMaintModalOpen(true)}
                    className="text-xs font-black bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    + بلاغ سريع
                  </button>
                  <Link to="/facilities/maintenance" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                    كافة البلاغات ({allMaintenanceRequests.length}) <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              }
            >
              {urgentTickets.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm font-medium">
                  <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-2.5 opacity-80" />
                  لا توجد أعطال عاجلة أو بلاغات معلقة حالياً، جميع مرافق المدرسة بحالة ممتازة!
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {urgentTickets.map((ticket) => (
                    <div key={ticket.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 px-2.5 rounded-xl transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-muted px-2 py-0.5 rounded-md">
                            {ticket.id}
                          </span>
                          <span className="font-bold text-sm text-foreground">{ticket.title}</span>
                          <Badge tone={ticket.priority === "high" ? "danger" : ticket.priority === "medium" ? "warning" : "primary"}>
                            {ticket.priority === "high" ? "عاجلة جداً" : ticket.priority === "medium" ? "متوسطة" : "عادية"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>الموقع: <strong className="text-foreground">{ticket.roomName || ticket.location}</strong></span>
                          <span>الفئة: <strong>{ticket.category || "عام"}</strong></span>
                          {ticket.technicianName && <span>الفني: <strong>{ticket.technicianName}</strong></span>}
                          <span>بتاريخ: {ticket.dateRequested}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {ticket.status === "new" ? (
                          <button
                            onClick={() => handleQuickStart(ticket)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 transition-colors"
                          >
                            <RefreshCw className="h-3.5 w-3.5" /> بدء العمل
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                            جارية ميدانياً
                          </span>
                        )}

                        <Link
                          to="/facilities/maintenance"
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
                        >
                          متابعة البلاغ
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PageCard>

            {/* Maintenance Distribution by Category Chart */}
            <PageCard title="توزيع الأعطال والصيانة حسب الفئة الفنية">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={maintenanceCategoryDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563EB" name="عدد البلاغات" radius={[6, 6, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </PageCard>
          </div>

          {/* Side Charts & Equipment Status (1 col) */}
          <div className="space-y-6">
            {/* Donut Chart: Room Type Distribution */}
            <PageCard title="توزيع المرافق والقاعات">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={roomTypeDistribution} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={50} 
                      outerRadius={80} 
                      paddingAngle={3}
                    >
                      {roomTypeDistribution.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/70 text-xs">
                {roomTypeDistribution.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span 
                      className="h-2.5 w-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} 
                    />
                    <span className="text-muted-foreground truncate">{item.name}:</span>
                    <strong className="text-foreground">{item.value}</strong>
                  </div>
                ))}
              </div>
            </PageCard>

            {/* Smart School Equipment Status */}
            <PageCard title="جاهزية التجهيزات الذكية">
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-2.5">
                    <Monitor className="h-4 w-4 text-primary" />
                    <span className="font-bold text-foreground">الشاشات التفاعلية الذكية</span>
                  </div>
                  <span className="font-black text-success flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> 100% جاهزة
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-2.5">
                    <Wifi className="h-4 w-4 text-primary" />
                    <span className="font-bold text-foreground">شبكة الإنترنت اللاسلكي</span>
                  </div>
                  <span className="font-black text-success flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> تغطية كاملة
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="font-bold text-foreground">كاميرات المراقبة الميدانية</span>
                  </div>
                  <span className="font-black text-success flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> تعمل على مدار 24h
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 text-warning" />
                    <span className="font-bold text-foreground">أجهزة تكييف الهواء</span>
                  </div>
                  <span className="font-bold text-amber-600">
                    {metrics.urgentMaintenanceCount > 0 ? "تخضع للفحص" : "كفاءة ممتازة"}
                  </span>
                </div>
              </div>
            </PageCard>
          </div>
        </div>
      </div>

      {/* ────── Modal: Quick Maintenance ────── */}
      <AdminModal
        isOpen={isMaintModalOpen}
        onClose={() => setIsMaintModalOpen(false)}
        title="تسجيل بلاغ صيانة عاجل"
        description="إشعار الفنيين الفوري وتعيين القاعة تحت الصيانة"
        icon={Wrench}
        tone="amber"
        maxWidth="lg"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setIsMaintModalOpen(false)}
              className="rounded-xl px-5 py-2.5 text-xs font-bold border border-input hover:bg-accent transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleCreateMaintenance}
              className="rounded-xl bg-primary px-6 py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md glow-primary flex items-center gap-1.5"
            >
              <Wrench className="h-4 w-4" />
              <span>إرسال البلاغ فوراً</span>
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateMaintenance} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground">
              عنوان البلاغ / العطل <span className="text-destructive">*</span>
            </label>
            <input
              value={maintData.title}
              onChange={(e) => setMaintData({ ...maintData, title: e.target.value })}
              placeholder="مثال: تعطل وحدة التكييف، عطل كهربائي، تسريب مياه..."
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold shadow-xs focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">القاعة / المرفق المتأثر</label>
              <select
                value={maintData.roomId}
                onChange={(e) => setMaintData({ ...maintData, roomId: e.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold shadow-xs focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="">-- مرفق عام / خارج القاعات --</option>
                {allRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.building} - {r.name} ({r.floor})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">الفئة الفنية</label>
              <select
                value={maintData.category}
                onChange={(e) => setMaintData({ ...maintData, category: e.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold shadow-xs focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="تكييف وتبريد">تكييف وتبريد</option>
                <option value="كهرباء وإنارة">كهرباء وإنارة</option>
                <option value="سباكة ومياه">سباكة ومياه</option>
                <option value="أثاث ومقاعد">أثاث ومقاعد</option>
                <option value="شاشات وتقنية">شاشات وتقنية</option>
                <option value="نظافة ومرافق">نظافة ومرافق</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">درجة الأهمية</label>
              <select
                value={maintData.priority}
                onChange={(e) => setMaintData({ ...maintData, priority: e.target.value as any })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold shadow-xs focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="high">🔴 عاجل جداً</option>
                <option value="medium">🟡 متوسط</option>
                <option value="low">🟢 عادي</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">الفني المكلف</label>
              <input
                value={maintData.technicianName}
                onChange={(e) => setMaintData({ ...maintData, technicianName: e.target.value })}
                placeholder="فريق الصيانة"
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold shadow-xs focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">التكلفة التقديرية ({currency})</label>
              <input
                type="number"
                value={maintData.costEstimate}
                onChange={(e) => setMaintData({ ...maintData, costEstimate: Number(e.target.value) })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-black text-primary shadow-xs focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground">تفاصيل العطل والتعليمات</label>
            <textarea
              value={maintData.description}
              onChange={(e) => setMaintData({ ...maintData, description: e.target.value })}
              placeholder="وصف المشكلة، متى بدأت، وأي ملاحظات خاصة للسلامة..."
              rows={3}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs font-medium shadow-xs focus:border-primary focus:outline-none resize-none"
            />
          </div>

          {maintData.roomId && (
            <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-800 dark:text-amber-300">
              <input
                type="checkbox"
                checked={maintData.autoSetRoomMaintenance}
                onChange={(e) => setMaintData({ ...maintData, autoSetRoomMaintenance: e.target.checked })}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
              <span>تحويل حالة القاعة المختارة إلى "تحت الصيانة" تلقائياً حتى يتم الإنجاز</span>
            </label>
          )}
        </form>
      </AdminModal>

      {/* ────── Modal: Quick Room ────── */}
      <AdminModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        title="إضافة قاعة أو مرفق جديد"
        description="تسجيل الفصول والمختبرات والمكاتب بالهيكل المدرسي"
        icon={Building2}
        tone="primary"
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setIsRoomModalOpen(false)}
              className="rounded-xl px-5 py-2.5 text-xs font-bold border border-input hover:bg-accent transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleCreateRoom}
              className="rounded-xl bg-primary px-6 py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md glow-primary flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة القاعة</span>
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground">
              اسم القاعة / الفصل <span className="text-destructive">*</span>
            </label>
            <input
              value={roomData.name}
              onChange={(e) => setRoomData({ ...roomData, name: e.target.value })}
              placeholder="مثال: قاعة 101، معمل الكيمياء، مسرح المدرسة..."
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold shadow-xs focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">المبنى / الجناح</label>
              <input
                value={roomData.building}
                onChange={(e) => setRoomData({ ...roomData, building: e.target.value })}
                placeholder="مثال: المبنى أ، المبنى العلمي..."
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold shadow-xs focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">الدور / الطابق</label>
              <select
                value={roomData.floor}
                onChange={(e) => setRoomData({ ...roomData, floor: e.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold shadow-xs focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="الأرضي">الدور الأرضي</option>
                <option value="الأول">الدور الأول</option>
                <option value="الثاني">الدور الثاني</option>
                <option value="الثالث">الدور الثالث</option>
                <option value="البدروم">البدروم / القبو</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">نوع المرفق</label>
              <select
                value={roomData.type}
                onChange={(e) => setRoomData({ ...roomData, type: e.target.value as any })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold shadow-xs focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="classroom">فصل دراسي</option>
                <option value="lab">معمل / مختبر</option>
                <option value="hall">قاعة عامة / مسرح</option>
                <option value="office">مكتب إداري</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">السعة الاستيعابية</label>
              <input
                type="number"
                value={roomData.capacity}
                onChange={(e) => setRoomData({ ...roomData, capacity: Number(e.target.value) })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold shadow-xs focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">الحالة الأولية</label>
              <select
                value={roomData.status}
                onChange={(e) => setRoomData({ ...roomData, status: e.target.value as any })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold shadow-xs focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="available">🟢 متاحة</option>
                <option value="occupied">🔵 مشغولة</option>
                <option value="maintenance">🔴 صيانة</option>
              </select>
            </div>
          </div>
        </form>
      </AdminModal>

      {/* ────── Modal: Facilities Audit Diagnostic ────── */}
      <AdminModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title="تقرير الفحص والجاهزية التشغيلية للمرافق"
        description="تقييم شامل لسلامة المباني، جاهزية الفصول، المخزون، والأسطول"
        icon={Gauge}
        tone="success"
        maxWidth="xl"
        footer={
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <Link
                to="/facilities/maintenance"
                onClick={() => setIsAuditModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                متابعة أعطال الصيانة
              </Link>
              <Link
                to="/inventory/items"
                onClick={() => setIsAuditModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-card text-foreground hover:bg-accent border border-border transition-colors shadow-2xs"
              >
                توريد المخزون
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setIsAuditModalOpen(false)}
              className="rounded-xl px-5 py-2 text-xs font-bold border border-input hover:bg-accent transition-colors"
            >
              إغلاق
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Overall Score */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-background to-emerald-500/10 border border-primary/20">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">المؤشر العام للجاهزية الميدانية</span>
              <div className="text-3xl font-black text-foreground flex items-center gap-2">
                <span>{metrics.healthScore}%</span>
                <Badge tone={metrics.healthScore > 85 ? "success" : metrics.healthScore > 70 ? "warning" : "danger"}>
                  {metrics.healthScore > 85 ? "جاهزية ممتازة" : metrics.healthScore > 70 ? "جاهزية متوسطة" : "تتطلب تدخلاً"}
                </Badge>
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground font-medium">
              <div>القاعات الصالحة: <strong>{metrics.totalRooms - metrics.maintenanceRooms} / {metrics.totalRooms}</strong></div>
              <div>أعطال حرجة: <strong className="text-danger">{metrics.urgentMaintenanceCount}</strong></div>
            </div>
          </div>

          {/* Pillars Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl border border-border/80 bg-card space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-foreground"><Building2 className="h-4 w-4 text-primary" /> جاهزية الفصول والقاعات</span>
                <span className="text-primary font-black">
                  {metrics.totalRooms > 0 ? Math.round(((metrics.totalRooms - metrics.maintenanceRooms) / metrics.totalRooms) * 100) : 100}%
                </span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                {metrics.maintenanceRooms === 0 ? "كافة القاعات متاحة أو مشغولة بانتظام." : `${metrics.maintenanceRooms} قاعة معطلة تحت الصيانة حالياً.`}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-border/80 bg-card space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-foreground"><Wrench className="h-4 w-4 text-amber-500" /> كفاءة الصيانة الميدانية</span>
                <span className="text-amber-600 font-black">{metrics.pendingMaintenanceCount} بلاغ</span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                {metrics.urgentMaintenanceCount > 0 ? `يوجد ${metrics.urgentMaintenanceCount} بلاغ عاجل بحاجة لتدخل فوري.` : "لا توجد بلاغات عاجلة معلقة."}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-border/80 bg-card space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-foreground"><Package className="h-4 w-4 text-purple-600" /> كفاية المستودع المركزي</span>
                <span className="text-purple-600 font-black">{metrics.lowStockInventory} نواقص</span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                {metrics.lowStockInventory > 0 ? "بعض الأصناف قاربت على النفاد، ينصح بالتوريد." : "المخزون متوفر بنسب كافية."}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-border/80 bg-card space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-foreground"><Bus className="h-4 w-4 text-emerald-600" /> استيعاب أسطول الحافلات</span>
                <span className="text-emerald-600 font-black">
                  {metrics.totalBusCapacity > 0 ? Math.round((metrics.totalBusSubs / metrics.totalBusCapacity) * 100) : 0}%
                </span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                تم شغل {metrics.totalBusSubs} مقعد من أصل {metrics.totalBusCapacity} مقعد متاح.
              </p>
            </div>
          </div>
        </div>
      </AdminModal>
    </AppShell>
  );
}
