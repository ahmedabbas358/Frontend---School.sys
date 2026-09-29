import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { AdminModal } from "@/components/admin/admin-modal";
import { FacilitiesNavTabs } from "@/components/facilities/facilities-nav";
import { DataTable } from "@/components/data-table";
import { useGlobalStore, Room } from "@/contexts/GlobalStoreContext";
import {
  DoorOpen,
  Plus,
  Trash2,
  Edit2,
  Search,
  QrCode,
  Wrench,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  LayoutGrid,
  List,
  X,
  Sparkles,
  Monitor,
  Wifi,
  Shield,
  SlidersHorizontal,
  Check,
  Download,
  Layers,
  MapPin,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/facilities/rooms")({
  head: () => ({ meta: [{ title: "المباني والقاعات الذكية | منصة مدارس" }] }),
  component: RoomsPage,
});

const DEFAULT_FACILITIES = [
  "شاشة ذكية تفاعلية",
  "مكيفات سبليت (2)",
  "كاميرا مراقبة أمنية",
  "شبكة إنترنت فائق السرعة",
  "أجهزة حاسوب للطلاب",
  "نظام صوتي وسماعات",
  "مكتب إشراف للمعلم",
];

function RoomsPage() {
  const {
    allRooms,
    addRoom,
    updateRoom,
    deleteRoom,
    allSections,
    assignSectionToRoom,
    addMaintenanceRequest,
    currency,
    addActivityLog,
  } = useGlobalStore();

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showAdd, setShowAdd] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [smartCardRoom, setSmartCardRoom] = useState<Room | null>(null);
  const [maintenanceRoom, setMaintenanceRoom] = useState<Room | null>(null);
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState<Room | null>(null);

  const [searchQ, setSearchQ] = useState("");
  const [filterBuilding, setFilterBuilding] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Form states for Add/Edit
  const [formData, setFormData] = useState({
    name: "",
    building: "",
    floor: "",
    type: "classroom" as "classroom" | "lab" | "office" | "hall",
    capacity: 30,
    status: "available" as "available" | "occupied" | "maintenance",
    supervisorName: "",
    facilities: [] as string[],
    assignedSectionId: "",
  });

  // Maintenance dispatch form state
  const [maintData, setMaintData] = useState({
    title: "",
    description: "",
    priority: "medium" as "high" | "medium" | "low",
    costEstimate: 0,
    technicianName: "",
    autoSetMaintenance: true,
  });

  // Derive unique buildings
  const availableBuildings = useMemo(() => {
    const set = new Set<string>();
    allRooms.forEach((r) => {
      if (r.building) set.add(r.building);
    });
    return Array.from(set).sort();
  }, [allRooms]);

  // KPIs
  const stats = useMemo(() => {
    const total = allRooms.length;
    const available = allRooms.filter((r) => r.status === "available").length;
    const occupied = allRooms.filter((r) => r.status === "occupied").length;
    const maintenance = allRooms.filter((r) => r.status === "maintenance").length;
    const totalCapacity = allRooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
    return { total, available, occupied, maintenance, totalCapacity };
  }, [allRooms]);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return allRooms.filter((r) => {
      if (filterBuilding !== "all" && r.building !== filterBuilding) return false;
      if (filterType !== "all" && r.type !== filterType) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (searchQ) {
        const q = searchQ.toLowerCase();
        if (
          !r.name.toLowerCase().includes(q) &&
          !r.building.toLowerCase().includes(q) &&
          !r.id.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [allRooms, filterBuilding, filterType, filterStatus, searchQ]);

  const roomTypeLabel: Record<string, string> = {
    classroom: "فصل دراسي",
    lab: "مختبر علمي / حاسب",
    office: "مكتب إداري",
    hall: "قاعة عامة / مسرح",
  };

  const openAddModal = () => {
    setFormData({
      name: "",
      building: availableBuildings[0] || "المبنى الرئيسي (أ)",
      floor: "الأرضي",
      type: "classroom",
      capacity: 30,
      status: "available",
      supervisorName: "",
      facilities: ["شاشة ذكية تفاعلية", "مكيفات سبليت (2)", "شبكة إنترنت فائق السرعة"],
      assignedSectionId: "",
    });
    setShowAdd(true);
  };

  const openEditModal = (r: Room) => {
    setEditingRoom(r);
    setFormData({
      name: r.name,
      building: r.building,
      floor: r.floor,
      type: r.type,
      capacity: r.capacity,
      status: r.status,
      supervisorName: r.supervisorName || "",
      facilities: r.facilities || ["شاشة ذكية تفاعلية", "مكيفات سبليت (2)"],
      assignedSectionId: r.assignedSectionId || "",
    });
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.building) {
      toast.error("يرجى إدخال اسم القاعة والمبنى");
      return;
    }

    if (editingRoom) {
      updateRoom(editingRoom.id, {
        name: formData.name,
        building: formData.building,
        floor: formData.floor,
        type: formData.type,
        capacity: Number(formData.capacity) || 0,
        status: formData.status,
        supervisorName: formData.supervisorName,
        facilities: formData.facilities,
      });

      if (formData.assignedSectionId !== (editingRoom.assignedSectionId || "")) {
        if (formData.assignedSectionId) {
          assignSectionToRoom(formData.assignedSectionId, editingRoom.id);
        } else if (editingRoom.assignedSectionId) {
          assignSectionToRoom(editingRoom.assignedSectionId, undefined);
        }
      }

      addActivityLog({
        user: "مدير المرافق",
        action: "تعديل بيانات قاعة",
        entity: "المرافق والقاعات",
        details: `تم تحديث بيانات قاعة: ${formData.name} (${formData.building})`,
      });

      toast.success("تم تحديث بيانات القاعة الذكية بنجاح");
      setEditingRoom(null);
    } else {
      addRoom({
        name: formData.name,
        building: formData.building,
        floor: formData.floor,
        type: formData.type,
        capacity: Number(formData.capacity) || 0,
        status: formData.status,
        supervisorName: formData.supervisorName,
        facilities: formData.facilities,
      });

      addActivityLog({
        user: "مدير المرافق",
        action: "إضافة قاعة جديدة",
        entity: "المرافق والقاعات",
        details: `تم تسجيل قاعة جديدة: ${formData.name} بسعة ${formData.capacity} مقعد`,
      });

      toast.success("تم تسجيل القاعة الذكية الجديدة بنجاح");
      setShowAdd(false);
    }
  };

  const toggleFacility = (item: string) => {
    setFormData((prev) => {
      const exists = prev.facilities.includes(item);
      return {
        ...prev,
        facilities: exists ? prev.facilities.filter((f) => f !== item) : [...prev.facilities, item],
      };
    });
  };

  const handleDispatchMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceRoom || !maintData.title) {
      toast.error("يرجى إدخال عنوان بلاغ الصيانة");
      return;
    }

    addMaintenanceRequest(
      {
        title: maintData.title,
        description: maintData.description || `طلب صيانة مجدول للقاعة ${maintenanceRoom.name}`,
        location: `${maintenanceRoom.building} - ${maintenanceRoom.name} (الدور ${maintenanceRoom.floor})`,
        roomId: maintenanceRoom.id,
        roomName: maintenanceRoom.name,
        priority: maintData.priority,
        status: "new",
        costEstimate: Number(maintData.costEstimate) || 0,
        technicianName: maintData.technicianName || "فريق الصيانة المدرسي",
        dateRequested: new Date().toISOString().split("T")[0],
      },
      maintData.autoSetMaintenance
    );

    addActivityLog({
      user: "مدير المرافق",
      action: "رفع بلاغ صيانة مباشر",
      entity: "طلبات الصيانة",
      details: `تم إرسال بلاغ صيانة (${maintData.title}) للقاعة: ${maintenanceRoom.name}`,
    });

    toast.success(`تم إرسال بلاغ الصيانة بنجاح للقاعة ${maintenanceRoom.name}`);
    setMaintenanceRoom(null);
    setMaintData({
      title: "",
      description: "",
      priority: "medium",
      costEstimate: 0,
      technicianName: "",
      autoSetMaintenance: true,
    });
  };

  const handleQuickStatusChange = (
    roomId: string,
    newStatus: "available" | "occupied" | "maintenance"
  ) => {
    updateRoom(roomId, { status: newStatus });
    addActivityLog({
      user: "مدير المرافق",
      action: "تغيير حالة القاعة",
      entity: "المرافق والقاعات",
      details: `تم تحديث حالة القاعة (${roomId}) إلى: ${newStatus}`,
    });
    toast.success("تم تغيير حالة القاعة بنجاح");
  };

  const handleDeleteRoom = () => {
    if (!deleteConfirmRoom) return;
    deleteRoom(deleteConfirmRoom.id);
    addActivityLog({
      user: "مدير المرافق",
      action: "حذف قاعة",
      entity: "المرافق والقاعات",
      details: `تم حذف القاعة: ${deleteConfirmRoom.name} (${deleteConfirmRoom.id})`,
    });
    toast.success(`تم حذف القاعة "${deleteConfirmRoom.name}" بنجاح`);
    setDeleteConfirmRoom(null);
  };

  const exportRoomsCsv = () => {
    const header = ["المعرف", "اسم القاعة", "المبنى", "الدور", "النوع", "السعة", "الحالة", "الشعبة المخصصة", "المشرف"];
    const rows = filteredRooms.map((r) => [
      `"${r.id}"`,
      `"${r.name}"`,
      `"${r.building}"`,
      `"${r.floor}"`,
      `"${roomTypeLabel[r.type] || r.type}"`,
      r.capacity || 0,
      `"${r.status === "available" ? "متاحة" : r.status === "maintenance" ? "صيانة" : "مشغولة"}"`,
      `"${r.assignedSectionName || "غير مخصصة"}"`,
      `"${r.supervisorName || "لا يوجد"}"`,
    ]);

    const blob = new Blob(["\uFEFF" + [header.join(","), ...rows.map((row) => row.join(","))].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rooms-inventory-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير سجل القاعات والمرافق بنجاح");
  };

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "المرافق والخدمات" }, { label: "المباني والقاعات الذكية" }]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={exportRoomsCsv}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 text-sm font-bold hover:bg-accent transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" /> تصدير CSV
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
          >
            <Plus className="h-4 w-4" /> إضافة قاعة جديدة
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <FacilitiesNavTabs activeTab="rooms" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary p-3.5 rounded-2xl shadow-inner border border-primary/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black">المباني والقاعات المدرسية الذكية</h1>
              <p className="text-sm font-bold text-muted-foreground mt-1">
                توزيع الفصول الدراسية والمعامل، إدارة السعة الاستيعابية، وإصدار بطاقات الأبواب بالـ QR
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <DoorOpen className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي القاعات</p>
            </div>
            <p className="text-2xl font-black tabular-nums">{stats.total}</p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-success/10 text-success flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">قاعات شاغرة ومتاحة</p>
            </div>
            <p className="text-2xl font-black text-success tabular-nums">{stats.available}</p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-warning/10 text-warning-foreground flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">مشغولة بالشعب</p>
            </div>
            <p className="text-2xl font-black text-warning-foreground tabular-nums">{stats.occupied}</p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-danger/10 text-danger flex items-center justify-center">
                <Wrench className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">تحت الصيانة</p>
            </div>
            <p className="text-2xl font-black text-danger tabular-nums">{stats.maintenance}</p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-info/10 text-info flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي الطاقة الاستيعابية</p>
            </div>
            <p className="text-2xl font-black tabular-nums text-foreground">{stats.totalCapacity} مقعد</p>
          </div>
        </div>

        {/* Filters and View Switcher */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm space-y-3">
          <div className="grid gap-3 md:grid-cols-[1fr_160px_160px_160px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="بحث باسم القاعة، المبنى، أو المعرف..."
                className="h-11 w-full rounded-xl border border-border/80 bg-background ps-10 pe-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
              />
            </div>

            <select
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value)}
              className="h-11 rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="all">كافة المباني</option>
              {availableBuildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-11 rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="all">كافة الأنواع</option>
              <option value="classroom">فصل دراسي</option>
              <option value="lab">مختبر علمي / حاسب</option>
              <option value="office">مكتب إداري</option>
              <option value="hall">قاعة عامة / مسرح</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-11 rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="all">كافة الحالات</option>
              <option value="available">متاحة وشاغرة</option>
              <option value="occupied">مشغولة بالشعبة</option>
              <option value="maintenance">تحت الصيانة</option>
            </select>

            <div className="flex bg-muted/50 p-1 rounded-xl border border-border/80">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "grid" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                title="عرض بطاقات شبكية"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "table" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                title="عرض جدول"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content View: Grid or Table */}
        {viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-lg bg-muted text-muted-foreground">
                          {room.id}
                        </span>
                        <Badge
                          tone={
                            room.status === "available"
                              ? "success"
                              : room.status === "maintenance"
                              ? "danger"
                              : "warning"
                          }
                          className="text-[10px] font-bold"
                        >
                          {room.status === "available"
                            ? "متاحة وشاغرة"
                            : room.status === "maintenance"
                            ? "تحت الصيانة"
                            : "مشغولة"}
                        </Badge>
                      </div>
                      <h3 className="font-black text-base text-foreground mt-2">{room.name}</h3>
                      <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {room.building} • الدور {room.floor}
                      </p>
                    </div>

                    <button
                      onClick={() => setSmartCardRoom(room)}
                      className="p-2 rounded-xl bg-muted/60 hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all shadow-sm"
                      title="معاينة وطباعة بطاقة الباب الذكية مع QR"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Room Details & Capacity */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-xl bg-muted/30 border border-border/60 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">النوع والتصنيف:</span>
                      <span className="font-bold text-foreground">{roomTypeLabel[room.type] || room.type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">السعة الاستيعابية:</span>
                      <span className="font-black tabular-nums text-foreground">{room.capacity} طالب/مقعد</span>
                    </div>
                  </div>

                  {/* Assigned Section */}
                  <div className="mb-3 space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground">الشعبة الدراسية المخصصة:</span>
                    <select
                      value={room.assignedSectionId || ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          assignSectionToRoom(e.target.value, room.id);
                          toast.success(`تم تخصيص القاعة للشعبة بنجاح`);
                        } else if (room.assignedSectionId) {
                          assignSectionToRoom(room.assignedSectionId, undefined);
                          toast.success(`تم إلغاء تخصيص القاعة`);
                        }
                      }}
                      className="w-full text-xs font-bold bg-background border border-border/80 rounded-xl px-3 py-2 text-foreground focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">-- قاعة حرة (بدون شعبة محددة) --</option>
                      {allSections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.grade} - شعبة {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Facilities tags */}
                  {room.facilities && room.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {room.facilities.slice(0, 3).map((f, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-background border border-border/80 text-muted-foreground"
                        >
                          {f}
                        </span>
                      ))}
                      {room.facilities.length > 3 && (
                        <span className="text-[10px] font-bold text-muted-foreground px-1 self-center">
                          +{room.facilities.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    {/* Status quick switch dropdown */}
                    <select
                      value={room.status}
                      onChange={(e) => handleQuickStatusChange(room.id, e.target.value as any)}
                      className="text-[11px] font-bold bg-muted/60 border border-border/70 rounded-lg px-2 py-1 cursor-pointer outline-none"
                    >
                      <option value="available">🟢 متاحة</option>
                      <option value="occupied">🟡 مشغولة</option>
                      <option value="maintenance">🔴 صيانة</option>
                    </select>

                    {/* Quick Maintenance Dispatch */}
                    <button
                      onClick={() => setMaintenanceRoom(room)}
                      className="p-1.5 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 font-bold flex items-center gap-1 transition-all"
                      title="رفع بلاغ صيانة مباشر للقاعة"
                    >
                      <Wrench className="w-3.5 h-3.5" /> بلاغ
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(room)}
                      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                      title="تعديل بيانات القاعة"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmRoom(room)}
                      className="p-1.5 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger transition-all"
                      title="حذف القاعة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <PageCard className="overflow-hidden">
            <DataTable
              rows={filteredRooms}
              columns={[
                {
                  key: "id",
                  header: "الرمز",
                  cell: (r) => (
                    <span className="font-mono text-xs font-bold text-muted-foreground">{r.id}</span>
                  ),
                },
                {
                  key: "name",
                  header: "اسم القاعة والمرفق",
                  cell: (r) => (
                    <div>
                      <div className="font-bold text-sm text-foreground">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.building} • الدور {r.floor}
                      </div>
                    </div>
                  ),
                },
                {
                  key: "type",
                  header: "النوع",
                  cell: (r) => (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-muted/60 border border-border">
                      {roomTypeLabel[r.type] ?? r.type}
                    </span>
                  ),
                },
                {
                  key: "capacity",
                  header: "السعة",
                  cell: (r) => <span className="font-black tabular-nums">{r.capacity} مقعد</span>,
                },
                {
                  key: "section",
                  header: "الشعبة المخصصة",
                  cell: (r) => (
                    <select
                      value={r.assignedSectionId || ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          assignSectionToRoom(e.target.value, r.id);
                          toast.success(`تم تخصيص القاعة للشعبة بنجاح`);
                        } else if (r.assignedSectionId) {
                          assignSectionToRoom(r.assignedSectionId, undefined);
                          toast.success(`تم إلغاء تخصيص القاعة`);
                        }
                      }}
                      className="text-xs font-bold bg-background border border-border/80 rounded-xl px-2.5 py-1 text-foreground focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">-- قاعة حرة --</option>
                      {allSections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.grade} - شعبة {s.name}
                        </option>
                      ))}
                    </select>
                  ),
                },
                {
                  key: "status",
                  header: "الحالة التشغيلية",
                  cell: (r) => (
                    <Badge
                      tone={
                        r.status === "available"
                          ? "success"
                          : r.status === "maintenance"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {r.status === "available"
                        ? "متاحة"
                        : r.status === "maintenance"
                        ? "تحت الصيانة"
                        : "مشغولة"}
                    </Badge>
                  ),
                },
                {
                  key: "actions",
                  header: "إجراءات وتحكم",
                  cell: (r) => (
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => setSmartCardRoom(r)}
                        className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all font-bold text-xs flex items-center gap-1"
                        title="معاينة وطباعة بطاقة القاعة والباب مع QR"
                      >
                        <QrCode className="w-3.5 h-3.5" /> بطاقة
                      </button>
                      <button
                        onClick={() => setMaintenanceRoom(r)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-all font-bold text-xs flex items-center gap-1"
                        title="رفع بلاغ صيانة مباشر"
                      >
                        <Wrench className="w-3.5 h-3.5" /> صيانة
                      </button>
                      <button
                        onClick={() => openEditModal(r)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmRoom(r)}
                        className="p-1.5 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
              empty="لا توجد قاعات مطابقة للبحث والفلاتر"
            />
          </PageCard>
        )}
      </div>

      {/* ────── Modal: Add / Edit Room ────── */}
      <AdminModal
        isOpen={Boolean(showAdd || editingRoom)}
        onClose={() => {
          setShowAdd(false);
          setEditingRoom(null);
        }}
        title={editingRoom ? "تعديل بيانات القاعة الذكية" : "إضافة قاعة / مرفق مدرسي جديد"}
        description="تعريف القاعة وتحديد مواصفاتها وتجهيزاتها وتخصيصها للشُعب"
        icon={DoorOpen}
        tone="primary"
        maxWidth="lg"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setEditingRoom(null);
              }}
              className="rounded-xl px-5 py-2.5 text-xs font-bold border border-input hover:bg-accent transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSaveRoom}
              className="rounded-xl bg-primary px-6 py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md glow-primary flex items-center gap-1.5"
            >
              <DoorOpen className="w-4 h-4" />
              <span>{editingRoom ? "حفظ التعديلات" : "إضافة القاعة"}</span>
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveRoom} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                اسم أو رقم القاعة <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: فصل 1-أ أو مختبر الكيمياء"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary transition-all shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                المبنى / الجناح <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: المبنى الرئيسي (أ)"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                list="buildings-datalist"
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary transition-all shadow-xs"
              />
              <datalist id="buildings-datalist">
                {availableBuildings.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">الدور / الطابق</label>
              <input
                type="text"
                placeholder="مثال: الأرضي / الأول"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary transition-all shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">نوع المرفق</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer shadow-xs"
              >
                <option value="classroom">فصل دراسي</option>
                <option value="lab">مختبر علمي / حاسب</option>
                <option value="office">مكتب إداري</option>
                <option value="hall">قاعة عامة / مسرح</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">السعة (المقاعد)</label>
              <input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({ ...formData, capacity: Number(e.target.value) || 0 })
                }
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-black tabular-nums outline-none focus:border-primary shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">المشرف / المعلم المسؤول</label>
              <input
                type="text"
                placeholder="اسم المشرف أو رائد الفصل..."
                value={formData.supervisorName}
                onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">الحالة التشغيلية</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer shadow-xs"
              >
                <option value="available">متاحة وشاغرة 🟢</option>
                <option value="occupied">مشغولة بالشعبة 🔵</option>
                <option value="maintenance">تحت الصيانة 🔴</option>
              </select>
            </div>
          </div>

          {/* Section Assignment Integration */}
          <div className="space-y-1.5 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <label className="text-xs font-black text-foreground block">
              ربط وتخصيص القاعة لشعبة دراسية (اختياري):
            </label>
            <select
              value={formData.assignedSectionId}
              onChange={(e) => setFormData({ ...formData, assignedSectionId: e.target.value })}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer shadow-xs"
            >
              <option value="">-- غير مخصصة (قاعة عامة / مشتركة) --</option>
              {allSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.grade} - شعبة {sec.name} {sec.roomId && sec.roomId !== editingRoom?.id ? "(مربوطة بقاعة أخرى)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Facilities Checklist */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              التجهيزات والتقنيات المتوفرة بالقاعة:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-muted/30 border border-border/70">
              {DEFAULT_FACILITIES.map((item) => {
                const checked = formData.facilities.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleFacility(item)}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center justify-between border transition-all ${
                      checked
                        ? "bg-primary/10 border-primary/40 text-primary shadow-xs"
                        : "bg-background border-border/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{item}</span>
                    {checked && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </AdminModal>

      {/* ────── Modal: Smart Door Card & QR Code ────── */}
      <AdminModal
        isOpen={Boolean(smartCardRoom)}
        onClose={() => setSmartCardRoom(null)}
        title="بطاقة القاعة والباب الذكية"
        description="جاهزة للطباعة والتثبيت على مدخل القاعة والمرفق المدرسي"
        icon={QrCode}
        tone="primary"
        maxWidth="lg"
        footer={
          smartCardRoom && (
            <div className="flex justify-between items-center w-full">
              <button
                type="button"
                onClick={() => window.print()}
                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-black flex items-center gap-1.5 shadow-md glow-primary hover:bg-primary/90 transition-all"
              >
                <Printer className="h-4 w-4" /> طباعة البطاقة الرسمية
              </button>
              <button
                type="button"
                onClick={() => setSmartCardRoom(null)}
                className="h-9 px-5 rounded-xl border border-input hover:bg-accent text-xs font-bold transition-colors"
              >
                إغلاق
              </button>
            </div>
          )
        }
      >
        {smartCardRoom && (
          <div className="p-4 space-y-4 bg-card" id="printable-door-card">
            <div className="border-4 border-double border-primary/40 rounded-3xl p-6 bg-gradient-to-br from-primary/5 via-card to-background text-center relative overflow-hidden space-y-4">
              <div className="border-b border-border/70 pb-3">
                <h4 className="text-xs font-black text-foreground">منظومة المدارس الحديثة</h4>
                <p className="text-[10px] text-muted-foreground font-bold">إدارة وتشغيل المباني والقاعات الذكية</p>
              </div>

              <div>
                <span className="font-mono text-xs font-black px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  رمز القاعة: {smartCardRoom.id}
                </span>
                <h2 className="text-2xl font-black text-foreground mt-2">{smartCardRoom.name}</h2>
                <p className="text-xs font-bold text-muted-foreground">
                  {smartCardRoom.building} • الدور {smartCardRoom.floor}
                </p>
              </div>

              <div className="p-4 bg-white dark:bg-zinc-900 border-2 border-dashed border-primary/30 rounded-2xl inline-block shadow-inner mx-auto my-1">
                <div className="w-32 h-32 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary border border-primary/20">
                  <QrCode className="w-20 h-20" />
                  <span className="text-[9px] font-mono font-black mt-1 text-primary">
                    SCAN FOR REPORTING
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground font-bold">
                امسح الرمز عبر الهاتف للإبلاغ الفوري عن أي عطل أو طلب صيانة
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-border/70 text-right">
                <div className="p-2.5 rounded-xl bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block font-bold">السعة الرسمية:</span>
                  <span className="font-black text-foreground">{smartCardRoom.capacity} طالب/مقعد</span>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/40">
                  <span className="text-[10px] text-muted-foreground block font-bold">الشعبة المخصصة:</span>
                  <span className="font-bold text-foreground">
                    {smartCardRoom.assignedSectionName || "قاعة عامة / مشتركة"}
                  </span>
                </div>
              </div>

              {smartCardRoom.supervisorName && (
                <div className="text-xs text-muted-foreground pt-1 font-bold">
                  المشرف المسؤول: <strong className="text-foreground">{smartCardRoom.supervisorName}</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </AdminModal>

      {/* ────── Modal: Direct Maintenance Request from Room ────── */}
      <AdminModal
        isOpen={Boolean(maintenanceRoom)}
        onClose={() => setMaintenanceRoom(null)}
        title={`رفع بلاغ صيانة مباشر للقاعة: ${maintenanceRoom?.name || ""}`}
        description={`ربط البلاغ آلياً بالقاعة وتحديث حالتها التشغيلية`}
        icon={Wrench}
        tone="danger"
        maxWidth="md"
        footer={
          maintenanceRoom && (
            <div className="flex justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setMaintenanceRoom(null)}
                className="rounded-xl px-5 py-2.5 text-xs font-bold border border-input hover:bg-accent transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDispatchMaintenance}
                className="rounded-xl bg-danger px-6 py-2.5 text-xs font-black text-white hover:bg-danger/90 transition-all shadow-md shadow-danger/20 flex items-center gap-1.5"
              >
                <Wrench className="w-4 h-4" /> تأكيد وإرسال بلاغ الصيانة
              </button>
            </div>
          )
        }
      >
        {maintenanceRoom && (
          <form onSubmit={handleDispatchMaintenance} className="space-y-4">
            <div className="p-3 rounded-xl bg-muted/30 border border-border/70 text-xs flex justify-between items-center">
              <div>
                <span className="text-muted-foreground block text-[10px] font-bold">القاعة المحددة:</span>
                <span className="font-black text-foreground text-sm">{maintenanceRoom.name}</span>
              </div>
              <div className="text-left">
                <span className="text-muted-foreground block text-[10px] font-bold">الموقع:</span>
                <span className="font-bold text-foreground">
                  {maintenanceRoom.building} (الدور {maintenanceRoom.floor})
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                عنوان ونوع العطل <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: تعطل وحدة التكييف، صيانة الإنارة، عطل الشاشة..."
                value={maintData.title}
                onChange={(e) => setMaintData({ ...maintData, title: e.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary transition-all shadow-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">درجة الأولوية</label>
                <select
                  value={maintData.priority}
                  onChange={(e) => setMaintData({ ...maintData, priority: e.target.value as any })}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer shadow-xs"
                >
                  <option value="high">عاجلة جداً (توقف القاعة) 🔴</option>
                  <option value="medium">متوسطة الأهمية 🟡</option>
                  <option value="low">عادية / دورية 🟢</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">التكلفة التقديرية ({currency})</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={maintData.costEstimate || ""}
                  onChange={(e) =>
                    setMaintData({ ...maintData, costEstimate: Number(e.target.value) || 0 })
                  }
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-black tabular-nums outline-none focus:border-primary shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">الفني أو الفريق المكلف</label>
              <input
                type="text"
                placeholder="اسم الفني أو شركة الصيانة..."
                value={maintData.technicianName}
                onChange={(e) => setMaintData({ ...maintData, technicianName: e.target.value })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">وصف تفصيلي للعطل</label>
              <textarea
                rows={2}
                placeholder="اكتب تفاصيل إضافية لتسهيل معاينة الفني..."
                value={maintData.description}
                onChange={(e) => setMaintData({ ...maintData, description: e.target.value })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs outline-none focus:border-primary font-medium resize-none shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-warning/10 border border-warning/30 text-warning-foreground">
              <input
                type="checkbox"
                id="auto-maint"
                checked={maintData.autoSetMaintenance}
                onChange={(e) => setMaintData({ ...maintData, autoSetMaintenance: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="auto-maint" className="text-xs font-bold cursor-pointer">
                تحويل حالة القاعة فوراً إلى (تحت الصيانة) حتى يتم إنجاز البلاغ
              </label>
            </div>
          </form>
        )}
      </AdminModal>

      {/* ────── Modal: Delete Room Confirmation ────── */}
      <AdminModal
        isOpen={Boolean(deleteConfirmRoom)}
        onClose={() => setDeleteConfirmRoom(null)}
        title="حذف القاعة نهائياً؟"
        description="تأكيد إجراء الحذف وإزالة القاعة من خريطة المرافق"
        icon={Trash2}
        tone="danger"
        maxWidth="sm"
        footer={
          deleteConfirmRoom && (
            <div className="flex gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setDeleteConfirmRoom(null)}
                className="flex-1 rounded-xl border border-input py-2.5 text-xs font-bold hover:bg-accent transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDeleteRoom}
                className="flex-1 rounded-xl bg-danger py-2.5 text-xs font-black text-white hover:bg-danger/90 transition-all shadow-md shadow-danger/20"
              >
                تأكيد الحذف
              </button>
            </div>
          )
        }
      >
        {deleteConfirmRoom && (
          <div className="text-center py-2 space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed font-bold">
              هل أنت متأكد من رغبتك في حذف القاعة{" "}
              <strong className="text-foreground font-black">"{deleteConfirmRoom.name}"</strong>؟
              سيتم إلغاء ارتباطها بأي شعبة دراسية مسجلة.
            </p>
            {deleteConfirmRoom.assignedSectionName && (
              <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-bold">
                تنبيه: القاعة مخصصة حالياً لـ ({deleteConfirmRoom.assignedSectionName}).
              </div>
            )}
          </div>
        )}
      </AdminModal>
    </AppShell>
  );
}
