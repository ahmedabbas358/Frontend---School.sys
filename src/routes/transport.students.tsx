import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { 
  Plus, 
  Printer, 
  Edit, 
  Trash2, 
  Search, 
  FileSpreadsheet, 
  Bus, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  X,
  CreditCard,
  DollarSign
} from "lucide-react";
import { useState, useMemo } from "react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { useGlobalStore, TransportSubscription } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage } from "@/lib/school-structure";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

export const Route = createFileRoute("/transport/students")({
  head: () => ({ meta: [{ title: "اشتراكات حافلات الطلاب | منصة مدارس" }] }),
  component: TransportStudents,
});

const subscriptionSchema = z.object({
  id: z.string().optional(),
  studentId: z.string().min(1, "يجب اختيار الطالب"),
  routeId: z.string().min(1, "يجب اختيار مسار النقل"),
  direction: z.enum(["round-trip", "going", "returning"]),
});

type SubscriptionForm = z.infer<typeof subscriptionSchema>;

function TransportStudents() {
  const { 
    transportSubscriptions, 
    transportRoutes, 
    activeStageStudents,
    activeStageSections,
    addTransportSubscription, 
    updateTransportSubscription, 
    deleteTransportSubscription, 
    addActivityLog,
    currency 
  } = useGlobalStore();
  
  const { stage, getStageLabel } = useStage();
  
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cancelConfirmSub, setCancelConfirmSub] = useState<any | null>(null);
  
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterRoute, setFilterRoute] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'subscribed', 'not-subscribed'

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<SubscriptionForm>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      direction: "round-trip"
    }
  });

  const selectedRouteId = watch("routeId");
  const selectedRoute = transportRoutes.find((r: any) => r.id === selectedRouteId);
  const selectedDirection = watch("direction");
  const selectedStudent = activeStageStudents.find((student: any) => student.id === watch("studentId"));

  const grades = useMemo(() => getGradesForStage(stage), [stage]);
  const availableSections = useMemo(() => (
    filterGrade ? activeStageSections.filter(section => section.grade === filterGrade) : []
  ), [activeStageSections, filterGrade]);

  const getSectionLabel = (student: any) => {
    const section = activeStageSections.find(item => item.id === student.sectionId);
    return section ? `${student.grade} / شعبة ${section.name}` : `${student.grade} / بدون شعبة`;
  };
  
  // Calculate specific fee
  const calculatedFee = useMemo(() => {
    if (!selectedRoute) return 0;
    if (selectedDirection === 'round-trip') return selectedRoute.feeAmount;
    return Math.round(selectedRoute.feeAmount * 0.6); // 60% for one-way
  }, [selectedRoute, selectedDirection]);

  // View Data
  const subscriptionsData = useMemo(() => {
    let result = activeStageStudents.map((student: any) => {
      const sub = transportSubscriptions.find((s: any) => s.studentId === student.id);
      const route = sub ? transportRoutes.find((r: any) => r.id === sub.routeId) : null;
      return {
        student,
        subscription: sub,
        route
      };
    });

    if (search) {
      result = result.filter((item: any) => item.student.name.includes(search) || item.student.id.includes(search));
    }

    if (filterGrade) {
      result = result.filter((item: any) => item.student.grade === filterGrade);
    }

    if (filterSection) {
      result = result.filter((item: any) => item.student.sectionId === filterSection);
    }

    if (filterRoute !== 'all') {
      result = result.filter((item: any) => item.route?.id === filterRoute);
    }

    if (filterStatus === 'subscribed') {
      result = result.filter((item: any) => !!item.subscription);
    } else if (filterStatus === 'not-subscribed') {
      result = result.filter((item: any) => !item.subscription);
    }

    return result;
  }, [activeStageStudents, transportSubscriptions, transportRoutes, search, filterRoute, filterStatus, filterGrade, filterSection]);

  // Stats
  const stats = useMemo(() => {
    const totalStudents = activeStageStudents.length;
    const subscribedCount = subscriptionsData.filter(i => !!i.subscription).length;
    const unsubscribedCount = totalStudents - subscribedCount;
    const totalFees = subscriptionsData
      .filter(i => !!i.subscription)
      .reduce((sum, i) => sum + (i.subscription?.fee || 0), 0);
    const subPercent = totalStudents > 0 ? Math.round((subscribedCount / totalStudents) * 100) : 0;
    return { totalStudents, subscribedCount, unsubscribedCount, totalFees, subPercent };
  }, [activeStageStudents, subscriptionsData]);

  const modalStudents = useMemo(() => {
    return activeStageStudents.filter((student: any) => {
      if (filterGrade && student.grade !== filterGrade) return false;
      if (filterSection && student.sectionId !== filterSection) return false;
      if (!editingId && transportSubscriptions.some((sub: any) => sub.studentId === student.id && sub.status === "active")) return false;
      return true;
    });
  }, [activeStageStudents, editingId, filterGrade, filterSection, transportSubscriptions]);

  const printTemplates: PrintTemplate[] = [
    {
      id: "transport-students",
      name: "كشف المشتركين في النقل المدرسي",
      category: "النقل المدرسي",
      type: "table",
      columns: [
        { label: "رقم الطالب", key: "studentId" },
        { label: "اسم الطالب", key: "studentName" },
        { label: "المسار", key: "routeName" },
        { label: "نوع النقل", key: "directionAr" },
        { label: "التكلفة", key: "feeFormatted" },
      ]
    }
  ];

  const printData = subscriptionsData.filter((item: any) => item.subscription).map((item: any) => ({
    studentId: item.student.id,
    studentName: item.student.name,
    routeName: item.route ? item.route.name : "-",
    directionAr: item.subscription.direction === 'round-trip' ? 'ذهاب وعودة' : item.subscription.direction === 'going' ? 'ذهاب فقط' : 'عودة فقط',
    feeFormatted: `${item.subscription.fee} ${currency}`
  }));

  const openAddModal = () => {
    reset({ direction: "round-trip" });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (row: any) => {
    reset({
      id: row.subscription.id,
      studentId: row.student.id,
      routeId: row.subscription.routeId,
      direction: row.subscription.direction,
    });
    setEditingId(row.subscription.id);
    setIsModalOpen(true);
  };

  const onSubmit = (data: SubscriptionForm) => {
    const route = transportRoutes.find(r => r.id === data.routeId);
    const student = activeStageStudents.find(s => s.id === data.studentId);
    const calculated = data.direction === 'round-trip' ? (route?.feeAmount || 0) : Math.round((route?.feeAmount || 0) * 0.6);

    if (editingId) {
      updateTransportSubscription(editingId, {
        routeId: data.routeId,
        direction: data.direction,
        fee: calculated,
      });
      addActivityLog({
        action: "update",
        category: "facilities",
        details: `تحديث اشتراك النقل للطالب: ${student?.name || data.studentId} على المسار: ${route?.name}`,
        targetId: editingId,
        timestamp: new Date().toISOString(),
      });
      toast.success("تم تحديث اشتراك الطالب بنجاح");
    } else {
      addTransportSubscription({
        studentId: data.studentId,
        routeId: data.routeId,
        direction: data.direction,
        fee: calculated,
        status: "active",
      });
      addActivityLog({
        action: "create",
        category: "facilities",
        details: `تسجيل اشتراك نقل جديد للطالب: ${student?.name || data.studentId} على المسار: ${route?.name} بقيمة: ${calculated} ${currency}`,
        timestamp: new Date().toISOString(),
      });
      toast.success("تم تسجيل اشتراك الطالب بالنقل المدرسي بنجاح");
    }
    setIsModalOpen(false);
  };

  const handleCancelSubscription = () => {
    if (!cancelConfirmSub) return;
    deleteTransportSubscription(cancelConfirmSub.subscription.id);
    addActivityLog({
      action: "delete",
      category: "facilities",
      details: `إلغاء اشتراك النقل المدرسي للطالب: ${cancelConfirmSub.student.name} من مسار: ${cancelConfirmSub.route?.name || "غير محدد"}`,
      targetId: cancelConfirmSub.subscription.id,
      timestamp: new Date().toISOString(),
    });
    toast.success(`تم إلغاء اشتراك الطالب ${cancelConfirmSub.student.name} بنجاح`);
    setCancelConfirmSub(null);
  };

  // CSV Export
  const exportSubscriptionsCsv = () => {
    const headers = ["رقم الطالب", "اسم الطالب", "الصف", "الشعبة", "حالة الاشتراك", "مسار الحافلة", "نوع النقل", "الرسوم", "ولي الأمر", "الهاتف"];
    const rows = subscriptionsData.map(item => [
      `"${item.student.id}"`,
      `"${item.student.name}"`,
      `"${item.student.grade}"`,
      `"${item.student.sectionId || ''}"`,
      `"${item.subscription ? 'مشترك' : 'غير مشترك'}"`,
      `"${item.route ? item.route.name : ''}"`,
      `"${item.subscription ? (item.subscription.direction === 'round-trip' ? 'ذهاب وعودة' : item.subscription.direction === 'going' ? 'ذهاب فقط' : 'عودة فقط') : ''}"`,
      item.subscription ? item.subscription.fee : 0,
      `"${item.student.guardianName || ''}"`,
      `"${item.student.guardianPhone || ''}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `اشتراكات_النقل_المدرسي_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير كشف المشتركين بنجاح");
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المرافق والخدمات" },
        { label: "اشتراكات النقل المدرسي" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={exportSubscriptionsCsv}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> تصدير CSV
          </button>
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
          >
            <Printer className="h-4 w-4 text-primary" /> طباعة الكشف
          </button>
          <button 
            onClick={openAddModal}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
          >
            <Plus className="h-4 w-4" /> اشتراك جديد
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">طلاب المرحلة ({getStageLabel(stage)})</span>
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black tabular-nums">{stats.totalStudents}</div>
            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">مسجلين بالمرحلة</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">المشتركون في النقل</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
                <Bus className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600 tabular-nums">{stats.subscribedCount}</div>
            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">{stats.subPercent}% نسبة المشتركين</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">غير مشتركين بالنقل</span>
              <div className="h-9 w-9 rounded-xl bg-muted text-muted-foreground grid place-items-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-muted-foreground tabular-nums">{stats.unsubscribedCount}</div>
            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">نقل خاص أو سيارات أولياء الأمور</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">إجمالي رسوم النقل</span>
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 grid place-items-center">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-purple-600 tabular-nums">
              {stats.totalFees.toLocaleString()} <span className="text-xs">{currency}</span>
            </div>
            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">تحصيل دوري لاشتراكات الحافلات</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الرقم التعريفي..."
                className="h-10 w-full rounded-xl border border-border/80 bg-background/80 ps-9 pe-3 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
              />
            </div>

            <div>
              <select
                value={filterGrade}
                onChange={(e) => {
                  setFilterGrade(e.target.value);
                  setFilterSection("");
                }}
                className="h-10 w-full rounded-xl border border-border/80 bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 cursor-pointer"
              >
                <option value="">جميع الصفوف الدراسية</option>
                {grades.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterRoute}
                onChange={(e) => setFilterRoute(e.target.value)}
                className="h-10 w-full rounded-xl border border-border/80 bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 cursor-pointer"
              >
                <option value="all">كافة مسارات الحافلات</option>
                {transportRoutes.map((rt: any) => (
                  <option key={rt.id} value={rt.id}>{rt.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 w-full rounded-xl border border-border/80 bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 cursor-pointer"
              >
                <option value="all">جميع الحالات</option>
                <option value="subscribed">مشتركون فقط</option>
                <option value="not-subscribed">غير مشتركين</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <PageCard>
          <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" />
              <h2 className="text-base font-black text-foreground">
                كشف تسجيل ومتابعة اشتراكات الطلاب بالحافلات ({subscriptionsData.length})
              </h2>
            </div>
          </div>

          <DataTable
            rows={subscriptionsData}
            columns={[
              { 
                header: "الطالب", 
                key: "الطالب", 
                cell: (row: any) => (
                  <div>
                    <div className="font-bold text-foreground text-sm">{row.student.name}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">{row.student.id}</div>
                  </div>
                ) 
              },
              { 
                header: "الصف والشعبة", 
                key: "الصف والشعبة", 
                cell: (row: any) => (
                  <span className="text-xs font-bold text-foreground">{getSectionLabel(row.student)}</span>
                ) 
              },
              { 
                header: "ولي الأمر", 
                key: "ولي الأمر", 
                cell: (row: any) => (
                  <div className="text-xs">
                    <div>{row.student.guardianName || "-"}</div>
                    <div className="text-[11px] font-mono text-muted-foreground" dir="ltr">{row.student.guardianPhone || "-"}</div>
                  </div>
                ) 
              },
              { 
                header: "حالة الاشتراك", 
                key: "حالة الاشتراك", 
                cell: (row: any) => (
                  <Badge tone={row.subscription ? "success" : "neutral"}>
                    {row.subscription ? "مشترك بالنقل" : "غير مشترك"}
                  </Badge>
                ) 
              },
              { 
                header: "مسار الحافلة", 
                key: "مسار الحافلة", 
                cell: (row: any) => row.route ? (
                  <div className="text-xs">
                    <div className="font-bold text-primary">{row.route.name}</div>
                    <div className="text-[10px] text-muted-foreground">{row.route.destination || row.route.vehiclePlate}</div>
                  </div>
                ) : "-" 
              },
              { 
                header: "نوع النقل", 
                key: "نوع النقل", 
                cell: (row: any) => row.subscription ? (
                  <span className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                    {row.subscription.direction === 'round-trip' ? 'ذهاب وعودة' : row.subscription.direction === 'going' ? 'ذهاب فقط' : 'عودة فقط'}
                  </span>
                ) : "-" 
              },
              { 
                header: "الرسوم", 
                key: "الرسوم", 
                cell: (row: any) => row.subscription ? (
                  <span className="font-black text-xs tabular-nums text-foreground">{row.subscription.fee.toLocaleString()} {currency}</span>
                ) : "-" 
              },
              { 
                header: "", 
                key: "actions", 
                cell: (row: any) => row.subscription ? (
                  <div className="flex items-center justify-end gap-1">
                    <button 
                      onClick={() => openEditModal(row)}
                      className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                      title="تعديل الاشتراك"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setCancelConfirmSub(row)}
                      className="p-1.5 text-muted-foreground hover:text-danger rounded-lg hover:bg-danger/10 transition-colors"
                      title="إلغاء الاشتراك"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      reset({ studentId: row.student.id, direction: "round-trip" });
                      setEditingId(null);
                      setIsModalOpen(true);
                    }}
                    className="rounded-lg px-2.5 py-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground transition-all active:scale-[0.98]"
                  >
                    + تسجيل بالنقل
                  </button>
                )
              },
            ]}
            empty="لا توجد بيانات اشتراكات تطابق البحث."
          />
        </PageCard>
      </div>

      {/* SUBSCRIPTION ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 my-8 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/50 bg-gradient-to-r from-card via-card/95 to-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-inner border border-primary/20">
                  <Bus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">
                    {editingId ? "تعديل اشتراك النقل المدرسي" : "تسجيل طالب في النقل المدرسي"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">تحديد مسار الحافلة ونوع الاشتراك وحساب التكلفة تلقائياً</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">الطالب المراد تسجيله <span className="text-destructive">*</span></label>
                <select 
                  {...register("studentId")} 
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer disabled:opacity-60"
                  disabled={!!editingId || !!watch("studentId")}
                >
                  <option value="">-- اختر الطالب --</option>
                  {modalStudents.map((st: any) => (
                    <option key={st.id} value={st.id}>{st.name} ({getSectionLabel(st)})</option>
                  ))}
                </select>
                {errors.studentId && <p className="text-xs font-bold text-destructive">{errors.studentId.message}</p>}
                {selectedStudent && <p className="text-xs font-bold text-primary mt-1">الفصل الحالي: {getSectionLabel(selectedStudent)}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">مسار حافلة النقل <span className="text-destructive">*</span></label>
                <select 
                  {...register("routeId")} 
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer"
                >
                  <option value="">-- اختر المسار المناسب --</option>
                  {transportRoutes.map((rt: any) => (
                    <option key={rt.id} value={rt.id}>{rt.name} - تكلفة الاشتراك الكامل: {rt.feeAmount} {currency}</option>
                  ))}
                </select>
                {errors.routeId && <p className="text-xs font-bold text-destructive">{errors.routeId.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">نوع الاشتراك / الاتجاه</label>
                  <select 
                    {...register("direction")} 
                    className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer"
                  >
                    <option value="round-trip">ذهاب وعودة (100% من الرسوم)</option>
                    <option value="going">ذهاب فقط (60% من الرسوم)</option>
                    <option value="returning">عودة فقط (60% من الرسوم)</option>
                  </select>
                  {errors.direction && <p className="text-xs font-bold text-destructive">{errors.direction.message}</p>}
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">الرسوم المستحقة المحسوبة</label>
                  <div className="h-11 w-full rounded-xl border border-border/80 bg-primary/5 px-4 flex items-center justify-between text-sm font-bold text-primary">
                    <span className="text-base font-black">{selectedRoute ? calculatedFee.toLocaleString() : '0'}</span>
                    <span className="text-xs opacity-75">{currency}</span>
                  </div>
                  {selectedRoute && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      دورة الفوترة: {selectedRoute.feeMode === 'monthly' ? 'شهرياً' : selectedRoute.feeMode === 'term' ? 'نصف سنوي' : 'سنوياً'}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-end gap-2.5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border/80 hover:bg-accent transition-colors">
                  إلغاء
                </button>
                <button type="submit" className="rounded-xl bg-primary px-7 py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-[0.98]">
                  {editingId ? "تحديث الاشتراك" : "تأكيد تسجيل الاشتراك"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {cancelConfirmSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 my-8 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/50 bg-gradient-to-r from-card via-card/95 to-destructive/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center shadow-inner border border-destructive/20">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">تأكيد إلغاء اشتراك النقل</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">إلغاء تسجيل الطالب من حافلة الترحيل</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCancelConfirmSub(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm font-bold text-foreground">
                هل أنت متأكد من رغبتك في إلغاء اشتراك النقل المدرسي للطالب التالي؟
              </p>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">اسم الطالب:</span>
                  <span className="font-bold text-foreground">{cancelConfirmSub.student.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الصف:</span>
                  <span className="font-bold text-foreground">{getSectionLabel(cancelConfirmSub.student)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المسار:</span>
                  <span className="font-bold text-primary">{cancelConfirmSub.route?.name || "غير محدد"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الرسوم الدورية:</span>
                  <span className="font-black text-foreground">{cancelConfirmSub.subscription.fee} {currency}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCancelConfirmSub(null)}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border/80 hover:bg-accent transition-colors"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  className="rounded-xl bg-destructive px-6 py-2.5 text-xs font-black text-destructive-foreground hover:bg-destructive/90 transition-all shadow-md shadow-destructive/20 active:scale-[0.98]"
                >
                  تأكيد إلغاء الاشتراك
                </button>
              </div>
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
