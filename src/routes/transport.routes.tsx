import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { MapPin, Plus, Printer, Edit, Trash2, Users, Search, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { useGlobalStore, TransportRoute } from "@/contexts/GlobalStoreContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export const Route = createFileRoute("/transport/routes")({
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
  const { transportRoutes, transportSubscriptions, allStudents, allSections, addTransportRoute, updateTransportRoute, deleteTransportRoute, currency } = useGlobalStore();
  
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingRouteId, setViewingRouteId] = useState<string | null>(null);
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
      }
    }).filter(row => {
      if (subscriberDirection !== "all" && row.direction !== subscriberDirection) return false;
      if (subscriberQ && !row.studentName.includes(subscriberQ) && !row.guardianName.includes(subscriberQ) && !row.studentGrade.includes(subscriberQ)) return false;
      return true;
    });
  }, [viewingRouteId, transportSubscriptions, allStudents, allSections, subscriberQ, subscriberDirection]);

  const routeStats = useMemo(() => {
    const totalCapacity = transportRoutes.reduce((sum, route) => sum + (route.capacity || 0), 0);
    const activeSubs = transportSubscriptions.filter(sub => sub.status === "active").length;
    const monthlyRevenue = transportSubscriptions.filter(sub => sub.status === "active").reduce((sum, sub) => sum + (sub.fee || 0), 0);
    return { totalCapacity, activeSubs, monthlyRevenue };
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
    } else {
      addTransportRoute({ ...data, id: data.id || `RT-${Date.now()}` } as TransportRoute);
    }
    setIsModalOpen(false);
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "النقل المدرسي" },
        { label: "مسارات الحافلات" },
      ]}
      actions={
        <div className="flex gap-2">
          <button 
            onClick={openAddModal}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> مسار جديد
          </button>
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-bold text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Printer className="h-4 w-4" /> طباعة المسارات
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">المشتركون النشطون</p>
            <p className="mt-1 text-2xl font-black text-primary">{routeStats.activeSubs}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">إجمالي السعة</p>
            <p className="mt-1 text-2xl font-black">{routeStats.totalCapacity}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">إيراد النقل المتوقع</p>
            <p className="mt-1 text-2xl font-black text-success">{routeStats.monthlyRevenue.toLocaleString()} {currency}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-primary">إدارة المسارات حسب الوجهة والسائق</span>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={event => setQ(event.target.value)}
                placeholder="بحث بالمسار، الوجهة، السائق، أو اللوحة..."
                className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <select value={routeFilter} onChange={event => setRouteFilter(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold">
              <option value="">كل المسارات</option>
              {transportRoutes.map(route => <option key={route.id} value={route.id}>{route.name}</option>)}
            </select>
          </div>
        </div>

        <PageCard title="المسارات الحالية">
        <DataTable rows={filteredRoutes}
          columns={[
            { header: "رقم المسار", key: "id", cell: (r: any) => r.id  },
            { header: "اسم المسار/ الوجهة", key: "name", cell: (r: any) => (
              <div>
                <div className="font-bold text-primary">{r.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.destination || "وجهة غير محددة"}</div>
              </div>
            )},
            { header: "السائق", key: "السائق", cell: (row: any) => (
                <div>
                  <div className="font-bold">{row.driverName}</div>
                  <div className="text-xs text-muted-foreground">{row.driverPhone}</div>
                </div>
              ) 
            },
            { header: "المشرف", key: "supervisor", cell: (r: any) => (
              <div>
                <div className="font-bold">{r.supervisorName || "-"}</div>
                <div className="text-xs text-muted-foreground">{r.supervisorPhone || ""}</div>
              </div>
            )},
            { header: "المركبة", key: "vehiclePlate", cell: (r: any) => <span className="font-bold">{r.vehiclePlate}</span> },
            { header: "عدد المحطات", key: "عدد المحطات", cell: (row: any) => `${row.stops} محطات` },
            { header: "التكلفة", key: "التكلفة", cell: (row: any) => (
                <div className="text-primary font-bold">
                  {row.feeAmount.toLocaleString()} {currency}
                  <span className="text-xs text-muted-foreground block font-normal">
                    {row.feeMode === 'monthly' ? 'شهرياً' : row.feeMode === 'term' ? 'نصف سنوي' : 'سنوياً'}
                  </span>
                </div>
              ) 
            },
            { header: "المشتركين", key: "subscribers", cell: (row: any) => {
                const subsCount = transportSubscriptions.filter(s => s.routeId === row.id).length;
                const capacity = row.capacity || 0;
                const percentage = capacity > 0 ? Math.round((subsCount / capacity) * 100) : 0;
                return (
                  <button onClick={() => { setViewingRouteId(row.id); setSubscriberQ(""); setSubscriberDirection("all"); }} className="min-w-32 text-right text-primary font-bold hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                    <span className="flex items-center gap-2"><Users className="h-4 w-4" /> {subsCount} طالب</span>
                    {capacity > 0 && <span className="mt-1 block text-xs text-muted-foreground">{percentage}% من السعة</span>}
                  </button>
                );
              } 
            },
            { header: "إعدادات", key: "إعدادات", cell: (row: any) => (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openEditModal(row)}
                    className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-accent"
                    title="تعديل"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if(confirm("هل أنت متأكد من حذف هذا المسار؟")) {
                        deleteTransportRoute(row.id);
                      }
                    }}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10"
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) 
            },
          ]}
        />
        </PageCard>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-background p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-xl font-bold">{editingId ? "تعديل مسار" : "إضافة مسار جديد"}</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">رقم المسار</label>
                  <input {...register("id")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="RT-XX" readOnly={!!editingId} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold">اسم المسار / المنطقة</label>
                  <input {...register("name")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">الوجهة / الحي</label>
                  <input {...register("destination")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="مثال: الحي الشرقي، السوق، المحطة الشمالية" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">اسم السائق</label>
                  <input {...register("driverName")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  {errors.driverName && <p className="text-xs text-destructive">{errors.driverName.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">رقم هاتف السائق</label>
                  <input {...register("driverPhone")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  {errors.driverPhone && <p className="text-xs text-destructive">{errors.driverPhone.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">مشرف المسار</label>
                  <input {...register("supervisorName")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">هاتف المشرف</label>
                  <input {...register("supervisorPhone")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">المركبة / رقم اللوحة</label>
                  <input {...register("vehiclePlate")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  {errors.vehiclePlate && <p className="text-xs text-destructive">{errors.vehiclePlate.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">عدد المحطات</label>
                  <input type="number" {...register("stops")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  {errors.stops && <p className="text-xs text-destructive">{errors.stops.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">سعة المركبة</label>
                  <input type="number" {...register("capacity")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">التكلفة ({currency})</label>
                  <input type="number" {...register("feeAmount")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
                  {errors.feeAmount && <p className="text-xs text-destructive">{errors.feeAmount.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">دورة الدفع</label>
                  <select {...register("feeMode")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    <option value="monthly">شهرياً</option>
                    <option value="term">نصف سنوي (فصلي)</option>
                    <option value="annual">سنوياً</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-bold">ملاحظات تشغيلية</label>
                  <textarea {...register("notes")} rows={3} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="نقاط تجمع، تعليمات السائق، أيام التشغيل..." />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-accent">
                  إلغاء
                </button>
                <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewing Subscribers Modal */}
      {viewingRouteId && viewingRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-5xl rounded-xl bg-background p-6 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="mb-4 border-b pb-4">
              <h2 className="text-xl font-bold">قائمة الطلاب المشتركين - {viewingRoute.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{viewingRoute.destination || "وجهة غير محددة"} / {viewingRoute.vehiclePlate}</p>
            </div>
            <div className="mb-4 grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-border/50 p-3 text-center">
                <p className="text-xs font-bold text-muted-foreground">المشتركون</p>
                <p className="text-2xl font-black">{subscribedStudents.length}</p>
              </div>
              <div className="rounded-xl border border-border/50 p-3 text-center">
                <p className="text-xs font-bold text-muted-foreground">السعة</p>
                <p className="text-2xl font-black">{viewingRoute.capacity || "-"}</p>
              </div>
              <div className="rounded-xl border border-border/50 p-3 text-center">
                <p className="text-xs font-bold text-muted-foreground">رسوم المسار</p>
                <p className="text-2xl font-black text-primary">{viewingRoute.feeAmount.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border/50 p-3 text-center">
                <p className="text-xs font-bold text-muted-foreground">المحطات</p>
                <p className="text-2xl font-black">{viewingRoute.stops}</p>
              </div>
            </div>
            <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input value={subscriberQ} onChange={event => setSubscriberQ(event.target.value)} placeholder="بحث بالطالب أو ولي الأمر أو الفصل..." className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm" />
              </div>
              <select value={subscriberDirection} onChange={event => setSubscriberDirection(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold">
                <option value="all">كل الاتجاهات</option>
                <option value="round-trip">ذهاب وعودة</option>
                <option value="going">ذهاب فقط</option>
                <option value="returning">عودة فقط</option>
              </select>
            </div>
            
            <div className="overflow-auto flex-1">
              {subscribedStudents.length > 0 ? (
                <DataTable
                  rows={subscribedStudents}
                  columns={[
                    { key: "studentName", header: "اسم الطالب", cell: (r: any) => <span className="font-bold">{r.studentName}</span> },
                    { key: "studentGrade", header: "الفصل", cell: (r: any) => `${r.studentGrade} / ${r.studentSection}` },
                    { key: "guardianName", header: "ولي الأمر", cell: (r: any) => r.guardianName },
                    { key: "direction", header: "نوع الاشتراك", cell: (r: any) => r.direction === 'round-trip' ? 'ذهاب وعودة' : r.direction === 'going' ? 'ذهاب فقط' : 'عودة فقط' },
                    { key: "fee", header: "الرسوم", cell: (r: any) => `${r.fee.toLocaleString()} ${currency}` },
                    { key: "studentPhone", header: "رقم التواصل", cell: (r: any) => <span dir="ltr">{r.studentPhone}</span> },
                  ]}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>لا يوجد طلاب مشتركين في هذا المسار حالياً.</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end gap-2 shrink-0">
              <button onClick={() => setViewingRouteId(null)} className="rounded-lg px-6 py-2 text-sm font-bold bg-accent hover:bg-accent/80 transition-colors">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        templates={printTemplates}
        data={printData}
        
      />
    </AppShell>
  );
}
