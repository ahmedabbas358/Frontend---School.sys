import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { 
  MapPin, 
  Plus, 
  Printer, 
  Edit, 
  Trash2, 
  Users, 
  Search, 
  Filter, 
  Bus, 
  X, 
  FileSpreadsheet,
  Phone,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import { useState, useMemo } from "react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { AdminModal } from "@/components/admin/admin-modal";
import { FacilitiesNavTabs } from "@/components/facilities/facilities-nav";
import { useGlobalStore, TransportRoute } from "@/contexts/GlobalStoreContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

export const Route = createFileRoute("/transport/routes")({
  head: () => ({ meta: [{ title: "مسارات النقل المدرسي والحافلات | منصة مدارس" }] }),
  component: TransportRoutes,
});

const routeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم المسار مطلوب"),
  destination: z.string().optional(),
  driverName: z.string().min(1, "اسم السائق مطلوب"),
  driverPhone: z.string().min(1, "رقم هاتف السائق مطلوب"),
  supervisorName: z.string().optional(),
  supervisorPhone: z.string().optional(),
  vehiclePlate: z.string().min(1, "رقم المركبة مطلوب"),
  capacity: z.coerce.number().min(0).optional(),
  feeAmount: z.coerce.number().min(0, "التكلفة مطلوبة"),
  feeMode: z.enum(["monthly", "term", "annual"]),
  stops: z.coerce.number().min(0, "عدد المحطات مطلوب"),
  notes: z.string().optional(),
});

type RouteForm = z.infer<typeof routeSchema>;

function TransportRoutes() {
  const { 
    transportRoutes, 
    transportSubscriptions, 
    allStudents, 
    allSections, 
    addTransportRoute, 
    updateTransportRoute, 
    deleteTransportRoute, 
    addActivityLog,
    currency 
  } = useGlobalStore();
  
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingRouteId, setViewingRouteId] = useState<string | null>(null);
  const [deleteConfirmRoute, setDeleteConfirmRoute] = useState<TransportRoute | null>(null);

  const [q, setQ] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [subscriberQ, setSubscriberQ] = useState("");
  const [subscriberDirection, setSubscriberDirection] = useState("all");

  const viewingRoute = transportRoutes.find(r => r.id === viewingRouteId);

  const subscribedStudents = useMemo(() => {
    if (!viewingRouteId) return [];
    const subs = transportSubscriptions.filter(s => s.routeId === viewingRouteId);
    return subs.map(sub => {
      const student = allStudents.find(st => st.id === sub.studentId);
      const section = allSections.find(sec => sec.id === student?.sectionId);
      return {
        ...sub,
        studentName: student?.name || "غير معروف",
        studentGrade: student?.grade || "",
        studentSection: section ? `شعبة ${section.name}` : "بدون شعبة",
        guardianName: student?.guardianName || "-",
        studentPhone: student?.guardianPhone || ""
      };
    }).filter(row => {
      if (subscriberDirection !== "all" && row.direction !== subscriberDirection) return false;
      if (subscriberQ && !row.studentName.includes(subscriberQ) && !row.guardianName.includes(subscriberQ) && !row.studentGrade.includes(subscriberQ)) return false;
      return true;
    });
  }, [viewingRouteId, transportSubscriptions, allStudents, allSections, subscriberQ, subscriberDirection]);

  const routeStats = useMemo(() => {
    const totalRoutes = transportRoutes.length;
    const totalCapacity = transportRoutes.reduce((sum, route) => sum + (route.capacity || 0), 0);
    const activeSubs = transportSubscriptions.filter(sub => sub.status === "active").length;
    const monthlyRevenue = transportSubscriptions.filter(sub => sub.status === "active").reduce((sum, sub) => sum + (sub.fee || 0), 0);
    return { totalRoutes, totalCapacity, activeSubs, monthlyRevenue };
  }, [transportRoutes, transportSubscriptions]);

  const filteredRoutes = useMemo(() => {
    return transportRoutes.filter(route => {
      if (routeFilter && route.id !== routeFilter) return false;
      if (q && !route.name.includes(q) && !(route.destination || "").includes(q) && !route.driverName.includes(q) && !route.vehiclePlate.includes(q)) return false;
      return true;
    });
  }, [transportRoutes, q, routeFilter]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RouteForm>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      feeMode: "monthly",
      stops: 0,
      feeAmount: 0,
      capacity: 45,
    }
  });

  const printTemplates: PrintTemplate[] = [
    {
      id: "routes-list",
      name: "دليل مسارات الحافلات",
      category: "النقل المدرسي",
      type: "table",
      columns: [
        { label: "رقم المسار", key: "id" },
        { label: "اسم المسار", key: "name" },
        { label: "الوجهة", key: "destination" },
        { label: "السائق", key: "driverName" },
        { label: "هاتف السائق", key: "driverPhone" },
        { label: "المشرف", key: "supervisorName" },
        { label: "المركبة", key: "vehiclePlate" },
        { label: "السعة", key: "capacity" },
        { label: "المحطات", key: "stops" },
        { label: "التكلفة", key: "feeFormatted" },
      ]
    }
  ];

  const printData = filteredRoutes.map(rt => ({
    ...rt,
    subscriberCount: transportSubscriptions.filter(sub => sub.routeId === rt.id && sub.status === "active").length,
    feeFormatted: `${rt.feeAmount.toLocaleString()} ${currency} / ${rt.feeMode === 'monthly' ? 'شهرياً' : rt.feeMode === 'term' ? 'فصلياً' : 'سنوياً'}`
  }));

  const openAddModal = () => {
    reset({ feeMode: "monthly", stops: 0, feeAmount: 0, capacity: 45, id: `RT-${Math.floor(Math.random()*1000)}` });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (rt: TransportRoute) => {
    reset(rt);
    setEditingId(rt.id);
    setIsModalOpen(true);
  };

  const onSubmit = (data: RouteForm) => {
    if (editingId) {
      updateTransportRoute(editingId, data as TransportRoute);
      addActivityLog({
        action: "update",
        category: "facilities",
        details: `تعديل بيانات مسار الحافلة: ${data.name} (${editingId})`,
        targetId: editingId,
        timestamp: new Date().toISOString(),
      });
      toast.success("تم تحديث بيانات مسار النقل بنجاح");
    } else {
      const newId = data.id || `RT-${Date.now()}`;
      addTransportRoute({ ...data, id: newId } as TransportRoute);
      addActivityLog({
        action: "create",
        category: "facilities",
        details: `إضافة مسار نقل جديد: ${data.name} (السائق: ${data.driverName})`,
        targetId: newId,
        timestamp: new Date().toISOString(),
      });
      toast.success("تمت إضافة مسار النقل المدرسي بنجاح");
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirmRoute) return;
    deleteTransportRoute(deleteConfirmRoute.id);
    addActivityLog({
      action: "delete",
      category: "facilities",
      details: `حذف مسار النقل: ${deleteConfirmRoute.name} (${deleteConfirmRoute.id})`,
      targetId: deleteConfirmRoute.id,
      timestamp: new Date().toISOString(),
    });
    toast.success(`تم حذف المسار ${deleteConfirmRoute.name} بنجاح`);
    setDeleteConfirmRoute(null);
  };

  // CSV Export
  const exportRoutesCsv = () => {
    const headers = ["رقم المسار", "اسم المسار", "الوجهة", "السائق", "هاتف السائق", "رقم اللوحة", "السعة", "المشتركون", "الرسوم"];
    const rows = filteredRoutes.map(rt => {
      const subsCount = transportSubscriptions.filter(sub => sub.routeId === rt.id && sub.status === "active").length;
      return [
        `"${rt.id}"`,
        `"${rt.name}"`,
        `"${rt.destination || ''}"`,
        `"${rt.driverName}"`,
        `"${rt.driverPhone}"`,
        `"${rt.vehiclePlate}"`,
        rt.capacity || 0,
        subsCount,
        `"${rt.feeAmount} ${currency}"`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `دليل_مسارات_النقل_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير ملف إكسل لمسارات النقل بنجاح");
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المرافق والخدمات" },
        { label: "مسارات النقل المدرسي" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={exportRoutesCsv}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> تصدير CSV
          </button>
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
          >
            <Printer className="h-4 w-4 text-primary" /> طباعة المسارات
          </button>
          <button 
            onClick={openAddModal}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
          >
            <Plus className="h-4 w-4" /> مسار جديد
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <FacilitiesNavTabs activeTab="transport-routes" />

        {/* Metric KPI Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">إجمالي مسارات الحافلات</span>
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <Bus className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black tabular-nums">{routeStats.totalRoutes}</div>
            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">تغطي كافة المناطق المحيطة</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">الطلاب المشتركون</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600 tabular-nums">{routeStats.activeSubs}</div>
            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">اشتراك نشط بالحافلات</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">الطاقة الاستيعابية للأسطول</span>
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 grid place-items-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-amber-600 tabular-nums">{routeStats.totalCapacity}</div>
            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">مقعد متاح عبر الحافلات</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">إيراد اشتراكات النقل</span>
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 grid place-items-center">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-purple-600 tabular-nums">
              {routeStats.monthlyRevenue.toLocaleString()} <span className="text-xs">{currency}</span>
            </div>
            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">تحصيلات الرسوم المقررة</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="البحث باسم المسار، الحي، السائق، أو رقم اللوحة..."
                className="h-10 w-full rounded-xl border border-border/80 bg-background/80 ps-9 pe-3 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
              />
            </div>

            <div>
              <select
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
                className="h-10 w-full rounded-xl border border-border/80 bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 cursor-pointer"
              >
                <option value="">جميع المسارات المسجلة</option>
                {transportRoutes.map(rt => (
                  <option key={rt.id} value={rt.id}>{rt.name} - {rt.destination || rt.vehiclePlate}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Routes Table */}
        <PageCard>
          <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" />
              <h2 className="text-base font-black text-foreground">دليل مسارات الحافلات والأسطول المدرسي ({filteredRoutes.length})</h2>
            </div>
          </div>

          <DataTable
            rows={filteredRoutes}
            columns={[
              { 
                key: "id", 
                header: "رمز المسار", 
                cell: (r) => <span className="font-mono text-xs font-bold text-muted-foreground">{r.id}</span> 
              },
              { 
                key: "name", 
                header: "اسم المسار / الوجهة", 
                cell: (r) => (
                  <div>
                    <div className="font-black text-sm text-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>{r.name}</span>
                    </div>
                    {r.destination && <div className="text-[11px] text-muted-foreground font-medium mt-0.5">{r.destination}</div>}
                  </div>
                ) 
              },
              { 
                key: "driver", 
                header: "السائق والمركبة", 
                cell: (r) => (
                  <div className="space-y-0.5">
                    <div className="font-bold text-foreground text-xs">{r.driverName}</div>
                    <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1" dir="ltr">
                      <Phone className="h-3 w-3 text-muted-foreground" /> {r.driverPhone}
                    </div>
                    <div className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded w-fit">لوحة: {r.vehiclePlate}</div>
                  </div>
                ) 
              },
              { 
                key: "capacity", 
                header: "السعة والمحطات", 
                cell: (r) => (
                  <div className="text-xs">
                    <div className="font-bold">{r.capacity || "-"} مقعد</div>
                    <div className="text-muted-foreground text-[11px]">{r.stops || 0} محطات وقوف</div>
                  </div>
                ) 
              },
              { 
                key: "feeAmount", 
                header: "الرسوم", 
                cell: (r) => (
                  <div className="text-xs">
                    <span className="font-black text-primary tabular-nums">{r.feeAmount.toLocaleString()} {currency}</span>
                    <span className="text-[11px] text-muted-foreground block">
                      {r.feeMode === 'monthly' ? 'شهرياً' : r.feeMode === 'term' ? 'فصلياً' : 'سنوياً'}
                    </span>
                  </div>
                ) 
              },
              { 
                key: "subscribers", 
                header: "المشتركون", 
                cell: (row: any) => {
                  const subsCount = transportSubscriptions.filter(sub => sub.routeId === row.id && sub.status === "active").length;
                  const capacity = row.capacity || 0;
                  const percentage = capacity > 0 ? Math.round((subsCount / capacity) * 100) : 0;
                  return (
                    <button 
                      onClick={() => { setViewingRouteId(row.id); setSubscriberQ(""); setSubscriberDirection("all"); }} 
                      className="min-w-32 text-right text-primary font-bold hover:bg-primary/10 px-3 py-1.5 rounded-xl transition-colors"
                      title="عرض قائمة الطلاب المشتركين"
                    >
                      <span className="flex items-center gap-1.5 text-xs"><Users className="h-3.5 w-3.5" /> {subsCount} طالب</span>
                      {capacity > 0 && <span className="mt-0.5 block text-[10px] text-muted-foreground tabular-nums">{percentage}% من سعة الحافلة</span>}
                    </button>
                  );
                } 
              },
              { 
                header: "", 
                key: "actions", 
                cell: (row: any) => (
                  <div className="flex items-center justify-end gap-1">
                    <button 
                      onClick={() => openEditModal(row)}
                      className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                      title="تعديل بيانات المسار"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmRoute(row)}
                      className="p-1.5 text-muted-foreground hover:text-danger rounded-lg hover:bg-danger/10 transition-colors"
                      title="حذف المسار"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) 
              },
            ]}
            empty="لا توجد مسارات حافلات مسجلة تطابق البحث."
          />
        </PageCard>
      </div>

      {/* ADD / EDIT ROUTE MODAL */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
        title={editingId ? "تعديل بيانات مسار النقل" : "إضافة مسار ترحيل وحافلة جديدة"}
        description="تحديد خط السير، بيانات السائق، السعة الاستيعابية، والتكلفة المالية"
        icon={Bus}
        tone="primary"
        maxWidth="3xl"
        footer={
          <>
            <button 
              type="button" 
              onClick={() => {
                setIsModalOpen(false);
                reset();
              }} 
              className="rounded-xl px-5 py-2.5 text-xs font-bold text-muted-foreground hover:bg-accent border border-border/80 transition-colors"
            >
              إلغاء
            </button>
            <button 
              type="button" 
              onClick={handleSubmit(onSubmit)}
              className="rounded-xl bg-primary px-7 py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
            >
              {editingId ? "تحديث مسار النقل" : "حفظ مسار النقل"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">كود المسار</label>
              <input {...register("id")} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15" placeholder="RT-XX" readOnly={!!editingId} />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">اسم المسار / المنطقة <span className="text-destructive">*</span></label>
              <input {...register("name")} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15" placeholder="مثال: مسار الحي الدبلوماسي" />
              {errors.name && <p className="text-xs text-destructive font-bold">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">الوجهة الرئيسية / الأحياء المشمولة</label>
              <input {...register("destination")} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15" placeholder="مثال: الحي الشرقي، السوق، المحطة الشمالية" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">اسم السائق المعتمد <span className="text-destructive">*</span></label>
              <input {...register("driverName")} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15" />
              {errors.driverName && <p className="text-xs text-destructive font-bold">{errors.driverName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">رقم هاتف السائق <span className="text-destructive">*</span></label>
              <input {...register("driverPhone")} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 tabular-nums" dir="ltr" />
              {errors.driverPhone && <p className="text-xs text-destructive font-bold">{errors.driverPhone.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">مشرف المسار (اختياري)</label>
              <input {...register("supervisorName")} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">هاتف المشرف</label>
              <input {...register("supervisorPhone")} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 tabular-nums" dir="ltr" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">رقم لوحة المركبة <span className="text-destructive">*</span></label>
              <input {...register("vehiclePlate")} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 tabular-nums" />
              {errors.vehiclePlate && <p className="text-xs text-destructive font-bold">{errors.vehiclePlate.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">عدد محطات التوقف</label>
              <input type="number" {...register("stops")} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 tabular-nums" />
              {errors.stops && <p className="text-xs text-destructive font-bold">{errors.stops.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">سعة المقاعد بالحافلة</label>
              <input type="number" {...register("capacity")} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 tabular-nums" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">رسوم الاشتراك الكامل ({currency}) <span className="text-destructive">*</span></label>
              <input type="number" {...register("feeAmount")} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-black text-primary shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 tabular-nums" />
              {errors.feeAmount && <p className="text-xs text-destructive font-bold">{errors.feeAmount.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">دورة الفوترة</label>
              <select {...register("feeMode")} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer">
                <option value="monthly">شهرياً</option>
                <option value="term">فصلياً (نصف سنوي)</option>
                <option value="annual">سنوياً</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">ملاحظات تشغيلية</label>
              <textarea {...register("notes")} rows={2} className="w-full rounded-xl border border-border/80 bg-background/80 p-3 text-xs font-medium shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 resize-none" placeholder="نقاط التجمع، أوقات الانطلاق، ملاحظات السلامة..." />
            </div>
          </div>
        </form>
      </AdminModal>

      {/* VIEWING SUBSCRIBERS MODAL */}
      <AdminModal
        isOpen={Boolean(viewingRouteId && viewingRoute)}
        onClose={() => setViewingRouteId(null)}
        title={viewingRoute ? `قائمة الطلاب المشتركين - ${viewingRoute.name}` : "قائمة الطلاب المشتركين"}
        description={viewingRoute ? `${viewingRoute.destination || "وجهة عامة"} • لوحة الحافلة: ${viewingRoute.vehiclePlate} • السائق: ${viewingRoute.driverName}` : undefined}
        icon={Bus}
        tone="primary"
        maxWidth="4xl"
        footer={
          <button onClick={() => setViewingRouteId(null)} className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border/80 hover:bg-accent transition-colors">
            إغلاق
          </button>
        }
      >
        {viewingRoute && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4 bg-muted/20 p-3.5 rounded-2xl border border-border/60">
              <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
                <p className="text-[11px] font-bold text-muted-foreground">المشتركون الحاليون</p>
                <p className="text-xl font-black text-primary tabular-nums">{subscribedStudents.length}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
                <p className="text-[11px] font-bold text-muted-foreground">السعة الإجمالية</p>
                <p className="text-xl font-black tabular-nums">{viewingRoute.capacity || "-"}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
                <p className="text-[11px] font-bold text-muted-foreground">رسوم الاشتراك</p>
                <p className="text-xl font-black text-emerald-600 tabular-nums">{viewingRoute.feeAmount.toLocaleString()} {currency}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
                <p className="text-[11px] font-bold text-muted-foreground">المحطات</p>
                <p className="text-xl font-black tabular-nums">{viewingRoute.stops}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={subscriberQ} onChange={e => setSubscriberQ(e.target.value)} placeholder="بحث بالاسم أو ولي الأمر أو الصف..." className="h-10 w-full rounded-xl border border-border/80 bg-background/80 ps-9 pe-3 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15" />
              </div>
              <select value={subscriberDirection} onChange={e => setSubscriberDirection(e.target.value)} className="h-10 rounded-xl border border-border/80 bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 cursor-pointer">
                <option value="all">كل الاتجاهات</option>
                <option value="round-trip">ذهاب وعودة</option>
                <option value="going">ذهاب فقط</option>
                <option value="returning">عودة فقط</option>
              </select>
            </div>
            
            <div className="max-h-[50vh] overflow-auto custom-scrollbar-modal">
              {subscribedStudents.length > 0 ? (
                <div className="rounded-2xl border border-border/60 overflow-hidden">
                  <DataTable
                    rows={subscribedStudents}
                    columns={[
                      { key: "studentName", header: "اسم الطالب", cell: (r: any) => <span className="font-bold text-foreground text-xs">{r.studentName}</span> },
                      { key: "studentGrade", header: "الصف والشعبة", cell: (r: any) => <span className="text-xs text-muted-foreground">{r.studentGrade} / {r.studentSection}</span> },
                      { key: "guardianName", header: "ولي الأمر", cell: (r: any) => <span className="text-xs">{r.guardianName}</span> },
                      { key: "direction", header: "نوع النقل", cell: (r: any) => <Badge tone={r.direction === 'round-trip' ? 'primary' : 'warning'}>{r.direction === 'round-trip' ? 'ذهاب وعودة' : r.direction === 'going' ? 'ذهاب فقط' : 'عودة فقط'}</Badge> },
                      { key: "fee", header: "الرسوم", cell: (r: any) => <span className="font-black text-xs tabular-nums text-primary">{r.fee.toLocaleString()} {currency}</span> },
                      { key: "studentPhone", header: "رقم التواصل", cell: (r: any) => <span className="font-mono text-xs" dir="ltr">{r.studentPhone}</span> },
                    ]}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/60">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="font-bold text-xs">لا يوجد طلاب مطابقين للبحث في هذا المسار حالياً.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </AdminModal>

      {/* DELETE CONFIRMATION MODAL */}
      <AdminModal
        isOpen={Boolean(deleteConfirmRoute)}
        onClose={() => setDeleteConfirmRoute(null)}
        title="تأكيد حذف مسار النقل"
        description="إلغاء المسار نهائياً من شبكة حافلات المدرسة"
        icon={Trash2}
        tone="danger"
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteConfirmRoute(null)}
              className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border/80 hover:bg-accent transition-colors"
            >
              تراجع
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-xl bg-destructive px-6 py-2.5 text-xs font-black text-destructive-foreground hover:bg-destructive/90 transition-all shadow-md shadow-destructive/20 active:scale-[0.98]"
            >
              تأكيد الحذف
            </button>
          </>
        }
      >
        {deleteConfirmRoute && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-foreground">
              هل أنت متأكد من رغبتك في حذف مسار الحافلة التالي؟
            </p>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">اسم المسار:</span>
                <span className="font-bold text-foreground">{deleteConfirmRoute.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">السائق:</span>
                <span className="font-bold text-foreground">{deleteConfirmRoute.driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">رقم المركبة:</span>
                <span className="font-bold text-foreground">{deleteConfirmRoute.vehiclePlate}</span>
              </div>
            </div>
          </div>
        )}
      </AdminModal>

      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        templates={printTemplates}
        data={printData}
      />
    </AppShell>
  );
}
