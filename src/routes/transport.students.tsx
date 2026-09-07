import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Plus, Printer, Edit, Trash2, Search } from "lucide-react";
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
  const { transportSubscriptions, 
    transportRoutes, 
    activeStageStudents,
    activeStageSections,
    addTransportSubscription, 
    updateTransportSubscription, 
    deleteTransportSubscription, currency } = useGlobalStore();
  
  const { stage } = useStage();
  
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
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
    return selectedRoute.feeAmount * 0.6; // 60% for one-way
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
    grade: item.student.grade,
    sectionId: item.student.sectionId,
    sectionName: getSectionLabel(item.student),
    routeName: item.route?.name || "مسار محذوف",
    directionAr: item.subscription?.direction === 'round-trip' ? 'ذهاب وعودة' : item.subscription?.direction === 'going' ? 'ذهاب فقط' : 'عودة فقط',
    feeFormatted: `${item.subscription?.fee.toLocaleString()} ${currency}`
  }));

  const openAddModal = () => {
    reset({ direction: "round-trip", id: `SUB-${Math.floor(Math.random()*1000)}` });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    if(!item.subscription) return;
    reset({
      id: item.subscription.id,
      studentId: item.student.id,
      routeId: item.subscription.routeId,
      direction: item.subscription.direction,
    });
    setEditingId(item.subscription.id);
    setIsModalOpen(true);
  };

  const onSubmit = (data: SubscriptionForm) => {
    // Check if student already subscribed and we're not editing
    if (!editingId) {
      const exists = transportSubscriptions.find((s: any) => s.studentId === data.studentId);
      if (exists) {
        toast.error("هذا الطالب مسجل في النقل المدرسي مسبقاً");
        return;
      }
    }

    const finalFee = selectedRoute?.feeAmount ? (data.direction === 'round-trip' ? selectedRoute.feeAmount : selectedRoute.feeAmount * 0.6) : 0;

    const subData: TransportSubscription = {
      ...data,
      id: data.id || `SUB-${Date.now()}`,
      fee: finalFee,
      status: 'active'
    };

    if (editingId) {
      try {
        updateTransportSubscription(editingId, subData);
        toast.success("تم تحديث اشتراك الطالب ومزامنة رسومه المالية بنجاح");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذر تحديث اشتراك النقل");
        return;
      }
    } else {
      try {
        addTransportSubscription(subData);
        toast.success("تم تسجيل الطالب في النقل ومزامنة رسومه المالية بنجاح");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذر تسجيل الطالب في النقل");
        return;
      }
    }
    setIsModalOpen(false);
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "النقل المدرسي", to: "/transport/routes" },
        { label: "مشتركو النقل" },
      ]}
      actions={
        <div className="flex gap-2">
          <button 
            onClick={openAddModal}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> اشتراك جديد
          </button>
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-bold text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Printer className="h-4 w-4" /> طباعة الكشف
          </button>
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-3.5 rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur-xl shadow-sm">
        <div className="flex-1 min-w-[220px]">
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">البحث عن طالب</label>
          <div className="relative">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث بالاسم أو الرقم التعريفي..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-xl border border-border/80 bg-background/80 ps-10 pe-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
            />
          </div>
        </div>
        
        <div className="w-full sm:w-48">
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">الفصل الدراسي</label>
          <select
            value={filterGrade}
            onChange={(e) => { setFilterGrade(e.target.value); setFilterSection(""); }}
            className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer"
          >
            <option value="">كل الفصول الدراسية</option>
            {grades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
          </select>
        </div>

        <div className="w-full sm:w-48">
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">الشعبة</label>
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            disabled={!filterGrade}
            className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:opacity-50 cursor-pointer"
          >
            <option value="">كل الشعب</option>
            {availableSections.map(section => <option key={section.id} value={section.id}>شعبة {section.name}</option>)}
          </select>
        </div>
        
        <div className="w-full sm:w-48">
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">مسار النقل</label>
          <select 
            value={filterRoute}
            onChange={(e) => setFilterRoute(e.target.value)}
            className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer"
          >
            <option value="all">كل المسارات</option>
            {transportRoutes.map((rt: any) => (
              <option key={rt.id} value={rt.id}>{rt.name}</option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-44">
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">حالة الاشتراك</label>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer"
          >
            <option value="all">جميع الحالات</option>
            <option value="subscribed">المشتركون فقط</option>
            <option value="not-subscribed">غير المشتركين</option>
          </select>
        </div>
      </div>

      <PageCard
        title="الطلاب والنقل المدرسي"
      >
        <DataTable rows={subscriptionsData}
          columns={[
            { header: "رقم الطالب", key: "student.id", cell: (r: any) => <span className="font-mono text-xs text-muted-foreground">{r.student.id}</span> },
            { header: "اسم الطالب", key: "اسم الطالب", cell: (row: any) => (
                <div>
                  <div className="font-bold text-sm">{row.student.name}</div>
                  <div className="text-xs text-muted-foreground">{getSectionLabel(row.student)}</div>
                </div>
              ) 
            },
            { header: "المسار الحالي", key: "المسار الحالي", cell: (row: any) => row.route ? (
                <div className="font-bold text-primary text-sm flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                  {row.route.name}
                </div>
              ) : (
                <span className="text-xs font-bold px-2.5 py-1 bg-muted/60 text-muted-foreground rounded-lg border border-border/50">غير مشترك</span>
              ) 
            },
            { header: "نوع النقل", key: "نوع النقل", cell: (row: any) => row.subscription ? (
                <span className="text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-lg">
                  {row.subscription.direction === 'round-trip' ? 'ذهاب وعودة' : row.subscription.direction === 'going' ? 'ذهاب فقط' : 'عودة فقط'}
                </span>
              ) : "-" 
            },
            { header: "التكلفة", key: "التكلفة", cell: (row: any) => row.subscription ? (
                <span className="font-bold text-sm text-foreground">{row.subscription.fee.toLocaleString()} {currency}</span>
              ) : "-" 
            },
            { header: "إعدادات", key: "إعدادات", cell: (row: any) => row.subscription ? (
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => openEditModal(row)}
                    className="p-2 text-muted-foreground hover:text-primary rounded-xl hover:bg-primary/10 transition-colors"
                    title="تعديل الاشتراك"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if(confirm("هل أنت متأكد من إلغاء اشتراك الطالب؟")) {
                        deleteTransportSubscription(row.subscription.id);
                        toast.success("تم إلغاء الاشتراك بنجاح");
                      }
                    }}
                    className="p-2 text-muted-foreground hover:text-destructive rounded-xl hover:bg-destructive/10 transition-colors"
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
                  className="rounded-lg px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground transition-all active:scale-[0.98]"
                >
                  + تسجيل بالنقل
                </button>
              )
            },
          ]}
        />
      </PageCard>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 my-8">
            <div className="p-6 border-b border-border/50 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-inner border border-primary/20">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{editingId ? "تعديل اشتراك النقل" : "تسجيل طالب بالنقل المدرسي"}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">تحديد مسار الحافلة ونوع الاشتراك وحساب التكلفة تلقائياً</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">الطالب المراد تسجيله</label>
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
                <label className="text-xs font-bold text-muted-foreground">مسار حافلة النقل</label>
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
                    <span>{selectedRoute ? calculatedFee.toLocaleString() : '0'}</span>
                    <span className="text-xs opacity-75">{currency}</span>
                  </div>
                  {selectedRoute && (
                    <p className="text-[11px] text-muted-foreground mt-1">نظام الفوترة: {selectedRoute.feeMode === 'monthly' ? 'شهرياً' : selectedRoute.feeMode === 'term' ? 'نصف سنوي' : 'سنوياً'}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-end gap-2.5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl px-5 py-2.5 text-sm font-bold border border-border/80 hover:bg-accent transition-colors active:scale-[0.98]">
                  إلغاء
                </button>
                <button type="submit" className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-[0.98]">
                  {editingId ? "تحديث الاشتراك" : "تأكيد تسجيل الاشتراك"}
                </button>
              </div>
            </form>
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
