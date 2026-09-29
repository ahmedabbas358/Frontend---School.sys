import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore, MaintenanceRequest, Room } from "@/contexts/GlobalStoreContext";
import { AdminModal } from "@/components/admin/admin-modal";
import { FacilitiesNavTabs } from "@/components/facilities/facilities-nav";
import {
  Wrench,
  Plus,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Edit2,
  Printer,
  X,
  Eye,
  Clock,
  CheckCircle2,
  User,
  Building,
  DollarSign,
  Calendar,
  Filter,
  Search,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  FileText,
  Sparkles,
  QrCode,
  Tag,
  Download,
  AlertCircle,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/facilities/maintenance")({
  head: () => ({ meta: [{ title: "إدارة طلبات الصيانة | منصة مدارس" }] }),
  component: MaintenancePage,
});

const MAINTENANCE_CATEGORIES = [
  "تكييف وتبريد",
  "كهرباء وإنارة",
  "سباكة وصحي",
  "تقنية وشبكات",
  "أثاث ونجارة",
  "أبواب وأقفال",
  "دهانات ومباني",
  "أخرى",
];

const PRESET_TECHNICIANS = [
  "فريق التكييف والتبريد المركزي",
  "م. سالم عبد الرحمن (كهرباء عامة)",
  "ورشة السباكة والصيانة الصحية",
  "مهندس الشبكات وتقنية المعلومات",
  "فني النجارة وتجهيزات الأثاث",
  "مقاول الصيانة والترميم الخارجي",
];

function MaintenancePage() {
  const {
    allMaintenanceRequests,
    allRooms,
    updateMaintenanceRequest,
    addMaintenanceRequest,
    undoMaintenanceRequest,
    deleteMaintenanceRequest,
    currency,
    addActivityLog,
  } = useGlobalStore();

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [completingRequest, setCompletingRequest] = useState<MaintenanceRequest | null>(null);
  const [workOrderRequest, setWorkOrderRequest] = useState<MaintenanceRequest | null>(null);
  const [deleteConfirmRequest, setDeleteConfirmRequest] = useState<MaintenanceRequest | null>(null);

  // Filters & Search
  const [searchQ, setSearchQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Form State for Add / Edit
  const [formState, setFormState] = useState({
    title: "",
    category: "تكييف وتبريد",
    roomId: "",
    customLocation: "",
    description: "",
    priority: "medium" as "high" | "medium" | "low",
    technicianName: "",
    costEstimate: 0,
    autoSetRoomMaintenance: true,
  });

  // Form State for Completion
  const [completionState, setCompletionState] = useState({
    actualCost: 0,
    technicianName: "",
    notes: "",
    restoreRoomAvailable: true,
    expenseCategory: "صيانة وترميم ومرافق",
  });

  // KPIs
  const stats = useMemo(() => {
    const total = allMaintenanceRequests.length;
    const newCount = allMaintenanceRequests.filter((m) => m.status === "new").length;
    const inProgress = allMaintenanceRequests.filter((m) => m.status === "in_progress").length;
    const urgent = allMaintenanceRequests.filter(
      (m) => m.priority === "high" && m.status !== "completed"
    ).length;
    const completed = allMaintenanceRequests.filter((m) => m.status === "completed").length;
    const totalCost = allMaintenanceRequests
      .filter((m) => m.status === "completed" && m.costEstimate)
      .reduce((sum, m) => sum + (m.costEstimate || 0), 0);
    return { total, newCount, inProgress, urgent, completed, totalCost };
  }, [allMaintenanceRequests]);

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return allMaintenanceRequests.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterPriority !== "all" && r.priority !== filterPriority) return false;
      if (filterCategory !== "all" && r.category !== filterCategory) return false;
      if (searchQ.trim()) {
        const q = searchQ.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchDesc = r.description.toLowerCase().includes(q);
        const matchLoc = (r.location || "").toLowerCase().includes(q);
        const matchRoom = (r.roomName || "").toLowerCase().includes(q);
        const matchTech = (r.technicianName || "").toLowerCase().includes(q);
        const matchId = r.id.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchLoc && !matchRoom && !matchTech && !matchId) {
          return false;
        }
      }
      return true;
    });
  }, [allMaintenanceRequests, filterStatus, filterPriority, filterCategory, searchQ]);

  // Open Add Modal
  const openAddModal = () => {
    setFormState({
      title: "",
      category: "تكييف وتبريد",
      roomId: "",
      customLocation: "",
      description: "",
      priority: "medium",
      technicianName: "",
      costEstimate: 0,
      autoSetRoomMaintenance: true,
    });
    setShowAddModal(true);
  };

  // Open Edit Modal
  const openEditModal = (r: MaintenanceRequest) => {
    setEditingRequest(r);
    setFormState({
      title: r.title,
      category: r.category || "أخرى",
      roomId: r.roomId || "",
      customLocation: r.location || "",
      description: r.description,
      priority: r.priority,
      technicianName: r.technicianName || "",
      costEstimate: r.costEstimate || 0,
      autoSetRoomMaintenance: false,
    });
  };

  // Submit Add
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      toast.error("يرجى إدخال عنوان البلاغ");
      return;
    }

    const selectedRoom = allRooms.find((rm) => rm.id === formState.roomId);
    const finalLocation =
      selectedRoom
        ? `${selectedRoom.building || "مبنى عام"} - ${selectedRoom.name} (طابق ${selectedRoom.floor || "1"})`
        : formState.customLocation.trim() || "مرافق المدرسة العامة";

    addMaintenanceRequest(
      {
        title: formState.title.trim(),
        category: formState.category,
        description: formState.description.trim(),
        location: finalLocation,
        roomId: selectedRoom?.id,
        roomName: selectedRoom?.name,
        priority: formState.priority,
        status: "new",
        technicianName: formState.technicianName.trim() || undefined,
        costEstimate: Number(formState.costEstimate) || 0,
        dateRequested: new Date().toISOString().split("T")[0],
      },
      formState.autoSetRoomMaintenance
    );

    addActivityLog({
      user: "مدير المرافق والخدمات",
      action: "رفع بلاغ صيانة",
      entity: "طلبات الصيانة",
      details: `تم تسجيل بلاغ: ${formState.title.trim()} (${finalLocation})`,
    });

    toast.success("تم تسجيل بلاغ الصيانة بنجاح");
    setShowAddModal(false);
  };

  // Submit Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest || !formState.title.trim()) {
      toast.error("يرجى إدخال عنوان البلاغ");
      return;
    }

    const selectedRoom = allRooms.find((rm) => rm.id === formState.roomId);
    const finalLocation = selectedRoom
      ? `${selectedRoom.building || "مبنى عام"} - ${selectedRoom.name}`
      : formState.customLocation.trim() || editingRequest.location;

    updateMaintenanceRequest(editingRequest.id, {
      title: formState.title.trim(),
      category: formState.category,
      description: formState.description.trim(),
      location: finalLocation,
      roomId: selectedRoom?.id || editingRequest.roomId,
      roomName: selectedRoom?.name || editingRequest.roomName,
      priority: formState.priority,
      technicianName: formState.technicianName.trim() || undefined,
      costEstimate: Number(formState.costEstimate) || 0,
    });

    addActivityLog({
      user: "مدير المرافق والخدمات",
      action: "تعديل بلاغ صيانة",
      entity: "طلبات الصيانة",
      details: `تم تحديث بلاغ: ${formState.title.trim()} (${editingRequest.id})`,
    });

    toast.success("تم تحديث بيانات بلاغ الصيانة بنجاح");
    setEditingRequest(null);
  };

  // Quick Change Status (e.g. New -> In Progress)
  const handleStartWork = (r: MaintenanceRequest) => {
    updateMaintenanceRequest(r.id, { status: "in_progress" });
    addActivityLog({
      user: "مدير المرافق والخدمات",
      action: "بدء تنفيذ صيانة",
      entity: "طلبات الصيانة",
      details: `تم تحويل بلاغ (${r.id}) إلى قيد التنفيذ`,
    });
    toast.success(`تم تغيير حالة البلاغ (${r.id}) إلى قيد التنفيذ`);
  };

  // Open Completion Modal
  const openCompleteModal = (r: MaintenanceRequest) => {
    setCompletingRequest(r);
    setCompletionState({
      actualCost: r.costEstimate || 0,
      technicianName: r.technicianName || "",
      notes: r.notes || "تمت الصيانة والفحص الفني بنجاح والمرفق جاهز للاستخدام.",
      restoreRoomAvailable: true,
      expenseCategory: "صيانة وترميم ومرافق",
    });
  };

  // Submit Completion
  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingRequest) return;

    updateMaintenanceRequest(
      completingRequest.id,
      {
        status: "completed",
        costEstimate: Number(completionState.actualCost) || 0,
        technicianName: completionState.technicianName.trim() || completingRequest.technicianName,
        notes: completionState.notes.trim(),
        dateCompleted: new Date().toISOString().split("T")[0],
      },
      completionState.restoreRoomAvailable
    );

    addActivityLog({
      user: "مدير المرافق والخدمات",
      action: "اعتماد إنجاز صيانة",
      entity: "طلبات الصيانة",
      details: `تم إكمال بلاغ (${completingRequest.id}) بتكلفة ${completionState.actualCost} ${currency}`,
    });

    toast.success("تم إكمال طلب الصيانة بنجاح وترحيل المصروف للمركز المالي");
    setCompletingRequest(null);
  };

  // Undo Complete
  const handleUndo = (id: string) => {
    undoMaintenanceRequest(id);
    addActivityLog({
      user: "مدير المرافق والخدمات",
      action: "تراجع عن إكمال صيانة",
      entity: "طلبات الصيانة",
      details: `تم التراجع عن إكمال البلاغ (${id})`,
    });
    toast.info("تم التراجع عن إكمال البلاغ وإعادته كبلاغ جديد");
  };

  // Delete
  const handleDelete = () => {
    if (!deleteConfirmRequest) return;
    deleteMaintenanceRequest(deleteConfirmRequest.id);
    addActivityLog({
      user: "مدير المرافق والخدمات",
      action: "حذف بلاغ صيانة",
      entity: "طلبات الصيانة",
      details: `تم حذف بلاغ: ${deleteConfirmRequest.title} (${deleteConfirmRequest.id})`,
    });
    toast.success(`تم حذف بلاغ الصيانة "${deleteConfirmRequest.title}" بنجاح`);
    setDeleteConfirmRequest(null);
  };

  // Export CSV
  const exportMaintenanceCsv = () => {
    const header = ["المعرف", "العنوان", "الفئة", "الموقع", "الأولوية", "الحالة", "الفني المكلف", "التكلفة", "تاريخ الطلب", "تاريخ الإنجاز"];
    const rows = filteredRequests.map((r) => [
      `"${r.id}"`,
      `"${r.title}"`,
      `"${r.category || "عام"}"`,
      `"${r.roomName || r.location}"`,
      `"${r.priority === "high" ? "عاجلة" : r.priority === "medium" ? "متوسطة" : "منخفضة"}"`,
      `"${r.status === "completed" ? "منجز" : r.status === "in_progress" ? "قيد التنفيذ" : "جديد"}"`,
      `"${r.technicianName || "غير محدد"}"`,
      r.costEstimate || 0,
      `"${r.dateRequested || ""}"`,
      `"${r.dateCompleted || ""}"`,
    ]);

    const blob = new Blob(["\uFEFF" + [header.join(","), ...rows.map((row) => row.join(","))].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `maintenance-tickets-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير سجل بلاغات الصيانة بنجاح");
  };

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "المرافق والخدمات" }, { label: "طلبات الصيانة والتشغيل" }]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={exportMaintenanceCsv}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 text-sm font-bold hover:bg-accent transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" /> تصدير CSV
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
          >
            <Plus className="h-4 w-4" /> رفع بلاغ صيانة جديد
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <FacilitiesNavTabs activeTab="maintenance" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-warning/20 to-warning/5 text-warning-foreground p-3.5 rounded-2xl shadow-inner border border-warning/20">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black">إدارة الصيانة والتشغيل الميداني</h1>
              <p className="text-sm font-bold text-muted-foreground mt-1">
                متابعة بلاغات الأعطال، تكليف الفنيين، تسجيل التكاليف، وإصدار أوامر العمل المعتمدة
              </p>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Wrench className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي البلاغات</p>
            </div>
            <p className="text-2xl font-black tabular-nums">{stats.total}</p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-info/10 text-info flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">بلاغات جديدة</p>
            </div>
            <p className="text-2xl font-black text-info tabular-nums">{stats.newCount}</p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-warning/10 text-warning-foreground flex items-center justify-center">
                <RefreshCw className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">قيد التنفيذ</p>
            </div>
            <p className="text-2xl font-black text-warning-foreground tabular-nums">{stats.inProgress}</p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-danger/10 text-danger flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">حرجة وعاجلة</p>
            </div>
            <p className="text-2xl font-black text-danger tabular-nums">{stats.urgent}</p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-success/10 text-success flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">تم إنجازها</p>
            </div>
            <p className="text-2xl font-black text-success tabular-nums">{stats.completed}</p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي المنصرف</p>
            </div>
            <p className="text-xl font-black tabular-nums text-foreground">
              {stats.totalCost.toLocaleString()} {currency}
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm space-y-3">
          <div className="grid gap-3 md:grid-cols-[1fr_160px_160px_160px]">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="بحث بالعنوان، الموقع، الفني، أو المعرف..."
                className="h-11 w-full rounded-xl border border-border/80 bg-background ps-10 pe-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-11 rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="all">كافة الحالات</option>
              <option value="new">جديد (بانتظار الفني)</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="completed">منجز ومكتمل</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="h-11 rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="all">كافة الأولويات</option>
              <option value="high">عاجلة جداً 🔴</option>
              <option value="medium">متوسطة 🟡</option>
              <option value="low">منخفضة 🟢</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-11 rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="all">كافة الفئات</option>
              {MAINTENANCE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-xs font-bold text-muted-foreground">تصفية سريعة:</span>
            <button
              onClick={() => {
                setFilterPriority("high");
                setFilterStatus("all");
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-danger/30 text-danger bg-danger/5 hover:bg-danger/10 transition-colors"
            >
              البلاغات الحرجة العاجلة
            </button>
            <button
              onClick={() => {
                setFilterStatus("in_progress");
                setFilterPriority("all");
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-warning/30 text-warning-foreground bg-warning/5 hover:bg-warning/10 transition-colors"
            >
              قيد التنفيذ حالياً
            </button>
            <button
              onClick={() => {
                setFilterStatus("new");
                setFilterPriority("all");
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-info/30 text-info bg-info/5 hover:bg-info/10 transition-colors"
            >
              بلاغات جديدة غير مسندة
            </button>
            {(filterStatus !== "all" || filterPriority !== "all" || filterCategory !== "all" || searchQ) && (
              <button
                onClick={() => {
                  setFilterStatus("all");
                  setFilterPriority("all");
                  setFilterCategory("all");
                  setSearchQ("");
                }}
                className="text-xs font-bold text-muted-foreground hover:text-foreground underline ml-2"
              >
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* Maintenance Requests Table */}
        <PageCard>
          <DataTable
            rows={filteredRequests}
            pageSize={25}
            columns={[
              {
                key: "id",
                header: "المعرف",
                cell: (r) => (
                  <span className="font-mono text-xs font-bold text-muted-foreground tabular-nums">
                    {r.id}
                  </span>
                ),
              },
              {
                key: "title",
                header: "عنوان البلاغ ونوعه",
                cell: (r) => (
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-warning/10 text-warning-foreground flex items-center justify-center shrink-0 shadow-inner">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-black text-sm text-foreground">{r.title}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Tag className="h-3 w-3" />
                        <span>{r.category || "عام"}</span>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: "location",
                header: "الموقع / القاعة",
                cell: (r) => (
                  <div className="text-xs font-bold text-foreground">
                    <div>{r.roomName || r.location}</div>
                    {r.roomId && (
                      <span className="text-[10px] font-mono text-muted-foreground block">{r.roomId}</span>
                    )}
                  </div>
                ),
              },
              {
                key: "priority",
                header: "الأولوية",
                cell: (r) => (
                  <Badge
                    tone={r.priority === "high" ? "danger" : r.priority === "medium" ? "warning" : "success"}
                  >
                    {r.priority === "high" ? "عاجلة جداً" : r.priority === "medium" ? "متوسطة" : "منخفضة"}
                  </Badge>
                ),
              },
              {
                key: "status",
                header: "الحالة التشغيلية",
                cell: (r) => (
                  <Badge
                    tone={r.status === "completed" ? "success" : r.status === "in_progress" ? "warning" : "info"}
                  >
                    {r.status === "completed"
                      ? "منجز"
                      : r.status === "in_progress"
                      ? "قيد التنفيذ"
                      : "جديد"}
                  </Badge>
                ),
              },
              {
                key: "technician",
                header: "الفني المكلف",
                cell: (r) => (
                  <span className="text-xs font-bold text-foreground">
                    {r.technicianName || <span className="text-muted-foreground font-normal">بانتظار تكليف</span>}
                  </span>
                ),
              },
              {
                key: "cost",
                header: "التكلفة",
                cell: (r) => (
                  <span className="font-mono text-xs font-black text-foreground">
                    {r.costEstimate ? `${r.costEstimate.toLocaleString()} ${currency}` : "—"}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "الخيارات والإجراءات",
                cell: (r) => (
                  <div className="flex items-center justify-end gap-1.5">
                    {r.status === "new" && (
                      <button
                        onClick={() => handleStartWork(r)}
                        className="p-1.5 px-2.5 rounded-xl bg-warning/15 hover:bg-warning/25 text-warning-foreground font-bold text-xs flex items-center gap-1 transition-all"
                        title="بدء العمل"
                      >
                        بدء
                      </button>
                    )}

                    {r.status !== "completed" ? (
                      <button
                        onClick={() => openCompleteModal(r)}
                        className="p-1.5 px-2.5 rounded-xl bg-success/15 hover:bg-success/25 text-success font-bold text-xs flex items-center gap-1 transition-all"
                        title="اعتماد الإنجاز وترحيل المصروف"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> إنجاز
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUndo(r.id)}
                        className="p-1.5 px-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground font-bold text-xs flex items-center gap-1 transition-all"
                        title="تراجع عن الإنجاز"
                      >
                        تراجع
                      </button>
                    )}

                    <button
                      onClick={() => setWorkOrderRequest(r)}
                      className="p-2 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      title="طباعة أمر العمل والمخالصة الرسمية"
                    >
                      <Printer className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => openEditModal(r)}
                      className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      title="تعديل البلاغ"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmRequest(r)}
                      className="p-2 rounded-xl hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors"
                      title="حذف البلاغ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            empty="لا توجد بلاغات صيانة مطابقة لمعايير البحث الحالية."
          />
        </PageCard>
      </div>

      {/* ────── Modal: Add Maintenance Request ────── */}
      <AdminModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="رفع بلاغ صيانة جديد"
        description="تسجيل عطل في أحد المباني أو القاعات وتكليف الفني المناسب"
        icon={Wrench}
        tone="amber"
        maxWidth="xl"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                عنوان البلاغ / العطل <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                value={formState.title}
                onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="مثال: تسريب مياه في مكيف معمل الكيمياء، أو انقطاع الإنارة"
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">فئة الصيانة</label>
              <select
                value={formState.category}
                onChange={(e) => setFormState((prev) => ({ ...prev, category: e.target.value }))}
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm cursor-pointer focus:border-primary focus:outline-none"
              >
                {MAINTENANCE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">درجة الأولوية</label>
              <select
                value={formState.priority}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, priority: e.target.value as any }))
                }
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm cursor-pointer focus:border-primary focus:outline-none"
              >
                <option value="high">عاجلة جداً (تعطيل للعملية التعليمية) 🔴</option>
                <option value="medium">متوسطة (بحاجة لمعالجة سريعة) 🟡</option>
                <option value="low">منخفضة (صيانة دورية أو تحسين) 🟢</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">القاعة / المرفق المسجل</label>
              <select
                value={formState.roomId}
                onChange={(e) => setFormState((prev) => ({ ...prev, roomId: e.target.value }))}
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm cursor-pointer focus:border-primary focus:outline-none"
              >
                <option value="">-- أو حدد موقعاً يدوياً بالأسفل --</option>
                {allRooms.map((rm) => (
                  <option key={rm.id} value={rm.id}>
                    {rm.name} ({rm.building || "مبنى عام"} - طابق {rm.floor || "1"}) [
                    {rm.status === "maintenance"
                      ? "تحت الصيانة"
                      : rm.status === "occupied"
                      ? "مشغولة"
                      : "متاحة"}
                    ]
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">الموقع الميداني / التفصيلي</label>
              <input
                type="text"
                value={formState.customLocation}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, customLocation: e.target.value }))
                }
                placeholder="مثال: ممر الدور الثاني أمام المقصف، أو ساحة الرياضة"
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-foreground">الفني المكلف بالمعاينة</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formState.technicianName}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, technicianName: e.target.value }))
                  }
                  placeholder="اسم الفني أو الجهة المنفذة"
                  className="h-11 flex-1 rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
                />
                <select
                  onChange={(e) => {
                    if (e.target.value)
                      setFormState((prev) => ({ ...prev, technicianName: e.target.value }));
                  }}
                  className="h-11 rounded-xl border border-border/80 bg-muted/60 px-3 text-xs font-bold text-muted-foreground focus:outline-none cursor-pointer"
                >
                  <option value="">قائمة سريعة للفنيين</option>
                  {PRESET_TECHNICIANS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">التكلفة التقديرية ({currency})</label>
              <input
                type="number"
                min="0"
                value={formState.costEstimate || ""}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, costEstimate: Number(e.target.value) || 0 }))
                }
                placeholder="0"
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold font-mono shadow-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold select-none">
                <input
                  type="checkbox"
                  checked={formState.autoSetRoomMaintenance}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      autoSetRoomMaintenance: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>وضع القاعة فورياً تحت حالة "صيانة" في جدول الغرف</span>
              </label>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                وصف العطل بدقة وتعليمات السلامة
              </label>
              <textarea
                rows={3}
                required
                value={formState.description}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="اشرح طبيعة المشكلة، متى حدثت، وأي قطع متضررة تتطلب استبدال..."
                className="w-full rounded-xl border border-border/80 bg-background p-3 text-sm font-medium shadow-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-border/70 pt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="rounded-xl px-5 py-2.5 text-sm font-bold border border-border hover:bg-accent transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center gap-2"
            >
              <Wrench className="h-4 w-4" /> حفظ وتسجيل البلاغ
            </button>
          </div>
        </form>
      </AdminModal>

      {/* ────── Modal: Edit Maintenance Request ────── */}
      <AdminModal
        isOpen={Boolean(editingRequest)}
        onClose={() => setEditingRequest(null)}
        title={`تعديل بلاغ الصيانة (${editingRequest?.id || ""})`}
        description="تحديث التفاصيل، الفني، أو التكلفة المقدرة"
        icon={Edit2}
        tone="primary"
        maxWidth="xl"
      >
        {editingRequest && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-foreground">عنوان البلاغ *</label>
                <input
                  type="text"
                  required
                  value={formState.title}
                  onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">فئة الصيانة</label>
                <select
                  value={formState.category}
                  onChange={(e) => setFormState((prev) => ({ ...prev, category: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm cursor-pointer focus:border-primary focus:outline-none"
                >
                  {MAINTENANCE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">درجة الأولوية</label>
                <select
                  value={formState.priority}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, priority: e.target.value as any }))
                  }
                  className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm cursor-pointer focus:border-primary focus:outline-none"
                >
                  <option value="high">عاجلة جداً</option>
                  <option value="medium">متوسطة</option>
                  <option value="low">منخفضة</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">الفني المكلف</label>
                <input
                  type="text"
                  value={formState.technicianName}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, technicianName: e.target.value }))
                  }
                  className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">التكلفة التقديرية ({currency})</label>
                <input
                  type="number"
                  min="0"
                  value={formState.costEstimate || ""}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, costEstimate: Number(e.target.value) || 0 }))
                  }
                  className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold font-mono shadow-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-foreground">وصف العطل والملاحظات</label>
                <textarea
                  rows={3}
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full rounded-xl border border-border/80 bg-background p-3 text-sm font-medium shadow-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-border/70 pt-4">
              <button
                type="button"
                onClick={() => setEditingRequest(null)}
                className="rounded-xl px-5 py-2.5 text-sm font-bold border border-border hover:bg-accent transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                تحديث البيانات
              </button>
            </div>
          </form>
        )}
      </AdminModal>

      {/* ────── Modal: Complete Maintenance with Financial Integration ────── */}
      <AdminModal
        isOpen={Boolean(completingRequest)}
        onClose={() => setCompletingRequest(null)}
        title="اعتماد إنجاز أعمال الصيانة"
        description="ترحيل المصروف المالي واستعادة جاهزية المرفق فوراً"
        icon={CheckCircle2}
        tone="success"
        maxWidth="lg"
      >
        {completingRequest && (
          <form onSubmit={handleCompleteSubmit} className="space-y-4">
            <div className="p-3 bg-muted/60 rounded-xl border border-border space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-muted-foreground">طلب الصيانة:</span>
                <span className="font-mono font-black text-foreground">{completingRequest.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-muted-foreground">العنوان:</span>
                <span className="font-bold text-foreground">{completingRequest.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-muted-foreground">الموقع:</span>
                <span className="font-medium text-foreground">
                  {completingRequest.roomName || completingRequest.location}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                التكلفة الفعلية المنفذة ({currency}) <span className="text-danger">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={completionState.actualCost}
                onChange={(e) =>
                  setCompletionState((prev) => ({
                    ...prev,
                    actualCost: Number(e.target.value) || 0,
                  }))
                }
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-base font-black text-success tabular-nums shadow-sm focus:border-primary focus:outline-none"
              />
              <span className="text-[11px] text-muted-foreground mt-1 block">
                سيتم تسجيل هذا المبلغ تلقائياً كمصروف رسمي في المركز المالي.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">الفني المنفذ أو المستفيد من الصرف</label>
              <input
                type="text"
                value={completionState.technicianName}
                onChange={(e) =>
                  setCompletionState((prev) => ({ ...prev, technicianName: e.target.value }))
                }
                placeholder="اسم الفني أو الورشة المنفذة"
                className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">تقرير الإنجاز والملاحظات الفنية</label>
              <textarea
                rows={2}
                value={completionState.notes}
                onChange={(e) =>
                  setCompletionState((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="w-full rounded-xl border border-border/80 bg-background p-3 text-sm font-medium shadow-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="p-3.5 bg-success/10 border border-success/20 rounded-xl">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-success select-none">
                <input
                  type="checkbox"
                  checked={completionState.restoreRoomAvailable}
                  onChange={(e) =>
                    setCompletionState((prev) => ({
                      ...prev,
                      restoreRoomAvailable: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-border text-success focus:ring-success cursor-pointer"
                />
                <span>استعادة حالة القاعة فوراً إلى (متاحة وجاهزة للدروس)</span>
              </label>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-border/70 pt-4">
              <button
                type="button"
                onClick={() => setCompletingRequest(null)}
                className="rounded-xl px-5 py-2.5 text-sm font-bold border border-border hover:bg-accent transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="rounded-xl bg-success px-6 py-2.5 text-sm font-bold text-white hover:bg-success/90 transition-all shadow-md shadow-success/20 flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" /> تأكيد الإنجاز وتوليد المصروف
              </button>
            </div>
          </form>
        )}
      </AdminModal>

      {/* ────── Modal: Printable Work Order / Job Voucher ────── */}
      <AdminModal
        isOpen={Boolean(workOrderRequest)}
        onClose={() => setWorkOrderRequest(null)}
        title={`أمر صيانة وتكليف فني رسمي (WO-${workOrderRequest?.id || ""})`}
        description="مستند رسمي للمعاينة واستلام الأعمال والأجهزة والتوقيعات"
        icon={Printer}
        tone="primary"
        maxWidth="3xl"
        footer={
          <div className="flex justify-end gap-2.5 w-full print:hidden">
            <button
              type="button"
              onClick={() => setWorkOrderRequest(null)}
              className="rounded-xl px-5 py-2.5 text-sm font-bold border border-border hover:bg-accent transition-colors"
            >
              إغلاق
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
            >
              <Printer className="h-4 w-4" /> طباعة فورية
            </button>
          </div>
        }
      >
        {workOrderRequest && (
          <div className="p-6 bg-white text-slate-900 rounded-xl my-2 border border-slate-200 shadow-xs print:p-0 print:border-none print:shadow-none">
            {/* Official School Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-4">
              <div className="space-y-1">
                <div className="text-base font-black text-slate-900">منظومة المدارس الحديثة</div>
                <div className="text-xs text-slate-600 font-bold">
                  إدارة التشغيل والمرافق العامة • قسم الصيانة الميدانية
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  الرقم المرجعي الموحد: WO-{workOrderRequest.id}
                </div>
              </div>
              <div className="text-center p-2 rounded-lg border border-slate-300 bg-slate-50">
                <div className="text-[10px] font-bold text-slate-500 mb-1">رمز التحقق الذكي</div>
                <div className="w-14 h-14 bg-white p-1 rounded border border-slate-300 grid place-items-center mx-auto">
                  <QrCode className="w-12 h-12 text-slate-800" />
                </div>
                <div className="text-[9px] font-mono text-slate-600 mt-0.5">{workOrderRequest.id}</div>
              </div>
            </div>

            {/* Title & Priority Badge */}
            <div className="flex items-center justify-between bg-slate-100 p-3 rounded-lg border border-slate-200 mb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-500 block">عنوان وتوصيف أمر العمل:</span>
                <span className="text-base font-black text-slate-900">{workOrderRequest.title}</span>
              </div>
              <div className="text-left">
                <span
                  className={`inline-block px-2.5 py-1 rounded text-xs font-black ${
                    workOrderRequest.priority === "high"
                      ? "bg-red-100 text-red-700 border border-red-200"
                      : workOrderRequest.priority === "medium"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}
                >
                  أولوية:{" "}
                  {workOrderRequest.priority === "high"
                    ? "عاجلة جداً"
                    : workOrderRequest.priority === "medium"
                    ? "متوسطة"
                    : "عادية"}
                </span>
                <div className="text-[10px] text-slate-500 mt-1 font-bold">
                  تاريخ البلاغ: {workOrderRequest.dateRequested}
                </div>
              </div>
            </div>

            {/* Ticket Information Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
              <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                <span className="text-slate-500 block font-bold text-[10px]">الموقع / القاعة</span>
                <span className="font-bold text-slate-800">
                  {workOrderRequest.roomName || workOrderRequest.location}
                </span>
              </div>
              <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                <span className="text-slate-500 block font-bold text-[10px]">فئة العمل</span>
                <span className="font-bold text-slate-800">{workOrderRequest.category || "عام"}</span>
              </div>
              <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                <span className="text-slate-500 block font-bold text-[10px]">الفني المسؤول</span>
                <span className="font-bold text-slate-800">
                  {workOrderRequest.technicianName || "فريق الصيانة العام"}
                </span>
              </div>
              <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                <span className="text-slate-500 block font-bold text-[10px]">التكلفة المقدرة</span>
                <span className="font-bold text-slate-800 font-mono">
                  {workOrderRequest.costEstimate
                    ? `${workOrderRequest.costEstimate} ${currency}`
                    : "تحدد بعد الفحص"}
                </span>
              </div>
            </div>

            {/* Fault & Problem Diagnosis */}
            <div className="mb-4 text-xs">
              <div className="font-bold text-slate-700 mb-1">وصف العطل والفحص الفني المطلوب:</div>
              <div className="p-3 rounded border border-slate-200 bg-white font-medium text-slate-800 leading-relaxed min-h-[60px]">
                {workOrderRequest.description}
              </div>
            </div>

            {/* Materials & Parts Checklist Table */}
            <div className="mb-4 text-xs">
              <div className="font-bold text-slate-700 mb-1">
                بيان قطع الغيار والمستهلكات المنفذة (سجل الفني):
              </div>
              <table className="w-full border-collapse border border-slate-300 text-right">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold">
                    <th className="border border-slate-300 p-1.5 w-10 text-center">#</th>
                    <th className="border border-slate-300 p-1.5">بيان الصنف أو القطعة</th>
                    <th className="border border-slate-300 p-1.5 w-20 text-center">الكمية</th>
                    <th className="border border-slate-300 p-1.5 w-28 text-center">سعر الوحدة</th>
                    <th className="border border-slate-300 p-1.5 w-28 text-center">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 text-center">1</td>
                    <td className="border border-slate-300 p-2 text-slate-500 italic">
                      مستلزمات صيانة وفحص فني
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-mono">1</td>
                    <td className="border border-slate-300 p-2 text-center font-mono">-</td>
                    <td className="border border-slate-300 p-2 text-center font-mono">-</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 text-center">2</td>
                    <td className="border border-slate-300 p-2"></td>
                    <td className="border border-slate-300 p-2"></td>
                    <td className="border border-slate-300 p-2"></td>
                    <td className="border border-slate-300 p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signatures & Approvals Section */}
            <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t-2 border-slate-300 text-center text-xs">
              <div className="space-y-8">
                <div className="font-bold text-slate-700">الفني المنفذ</div>
                <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1 text-slate-500 font-mono text-[10px]">
                  {workOrderRequest.technicianName || "التوقيع والختم"}
                </div>
              </div>
              <div className="space-y-8">
                <div className="font-bold text-slate-700">مشرف القاعة / المرفق</div>
                <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1 text-slate-500 text-[10px]">
                  الاستلام والمعاينة
                </div>
              </div>
              <div className="space-y-8">
                <div className="font-bold text-slate-700">مدير الشؤون الإدارية والمالية</div>
                <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1 text-slate-500 text-[10px]">
                  اعتماد الصرف والترحيل
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminModal>

      {/* ────── Modal: Delete Confirmation ────── */}
      <AdminModal
        isOpen={Boolean(deleteConfirmRequest)}
        onClose={() => setDeleteConfirmRequest(null)}
        title="حذف بلاغ الصيانة نهائياً؟"
        description={`إزالة سجل البلاغ "${deleteConfirmRequest?.title || ""}" من قاعدة البيانات`}
        icon={Trash2}
        tone="danger"
        maxWidth="sm"
        footer={
          <div className="flex gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setDeleteConfirmRequest(null)}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold hover:bg-accent transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-bold text-white hover:bg-danger/90 transition-all shadow-md shadow-danger/20"
            >
              تأكيد الحذف
            </button>
          </div>
        }
      >
        {deleteConfirmRequest && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              هل أنت متأكد من رغبتك في حذف البلاغ{" "}
              <strong className="text-foreground font-black">
                "{deleteConfirmRequest.title}"
              </strong>{" "}
              ({deleteConfirmRequest.id})؟ لا يمكن التراجع عن هذا الإجراء وسيتم شطب السجل من تقارير الصيانة.
            </p>
          </div>
        )}
      </AdminModal>
    </AppShell>
  );
}
