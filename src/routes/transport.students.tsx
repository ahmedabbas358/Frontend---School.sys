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
      <div className="mb-6 flex flex-wrap gap-4 rounded-xl border bg-card p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-2 block text-sm font-bold text-muted-foreground">البحث عن طالب</label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="الاسم أو الرقم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        
        <div className="w-full md:w-48">
          <label className="mb-2 block text-sm font-bold text-muted-foreground">الفصل</label>
          <select
            value={filterGrade}
            onChange={(e) => { setFilterGrade(e.target.value); setFilterSection(""); }}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="">كل الفصول</option>
            {grades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
          </select>
        </div>

        <div className="w-full md:w-48">
          <label className="mb-2 block text-sm font-bold text-muted-foreground">الشعبة</label>
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            disabled={!filterGrade}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
          >
            <option value="">كل الشعب</option>
            {availableSections.map(section => <option key={section.id} value={section.id}>شعبة {section.name}</option>)}
          </select>
        </div>
        
        <div className="w-full md:w-48">
          <label className="mb-2 block text-sm font-bold text-muted-foreground">التصفية بالمسار</label>
          <select 
            value={filterRoute}
            onChange={(e) => setFilterRoute(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="all">كل المسارات</option>
            {transportRoutes.map((rt: any) => (
              <option key={rt.id} value={rt.id}>{rt.name}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-48">
          <label className="mb-2 block text-sm font-bold text-muted-foreground">حالة الاشتراك</label>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="all">الكل</option>
            <option value="subscribed">المشتركون فقط</option>
            <option value="not-subscribed">غير المشتركين</option>
          </select>
        </div>
      </div>

      <PageCard
        
        title="الطلاب والنقل"
      >
        <DataTable rows={subscriptionsData}
          columns={[
            { header: "رقم الطالب", key: "student.id", cell: (r: any) => r.student.id  },
            { header: "اسم الطالب", key: "اسم الطالب", cell: (row: any) => (
                <div>
                  <div className="font-bold">{row.student.name}</div>
                  <div className="text-xs text-muted-foreground">{getSectionLabel(row.student)}</div>
                </div>
              ) 
            },
            { header: "المسار الحالي", key: "المسار الحالي", cell: (row: any) => row.route ? (
                <div className="font-bold text-primary">{row.route.name}</div>
              ) : (
                <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">غير مشترك</span>
              ) 
            },
            { header: "نوع النقل", key: "نوع النقل", cell: (row: any) => row.subscription ? (
                <span>
                  {row.subscription.direction === 'round-trip' ? 'ذهاب وعودة' : row.subscription.direction === 'going' ? 'ذهاب فقط' : 'عودة فقط'}
                </span>
              ) : "-" 
            },
            { header: "التكلفة", key: "التكلفة", cell: (row: any) => row.subscription ? (
                <span className="font-bold">{row.subscription.fee.toLocaleString()} {currency}</span>
              ) : "-" 
            },
            { header: "إعدادات", key: "إعدادات", cell: (row: any) => row.subscription ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openEditModal(row)}
                    className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-accent"
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
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10"
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
                  className="text-xs font-bold text-primary hover:underline"
                >
                  إضافة للنقل
                </button>
              )
            },
          ]}
        />
      </PageCard>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-xl bg-background p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">{editingId ? "تعديل اشتراك النقل" : "تسجيل في النقل المدرسي"}</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">الطالب</label>
                <select 
                  {...register("studentId")} 
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  disabled={!!editingId || !!watch("studentId")} // disable if editing or pre-selected
                >
                  <option value="">-- اختر الطالب --</option>
                  {modalStudents.map((st: any) => (
                    <option key={st.id} value={st.id}>{st.id} - {st.name} - {getSectionLabel(st)}</option>
                  ))}
                </select>
                {errors.studentId && <p className="text-xs text-destructive">{errors.studentId.message}</p>}
                {selectedStudent && <p className="mt-1 text-xs font-bold text-muted-foreground">{getSectionLabel(selectedStudent)}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold">مسار النقل</label>
                <select 
                  {...register("routeId")} 
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">-- اختر المسار --</option>
                  {transportRoutes.map((rt: any) => (
                    <option key={rt.id} value={rt.id}>{rt.name} ({rt.feeAmount} {currency})</option>
                  ))}
                </select>
                {errors.routeId && <p className="text-xs text-destructive">{errors.routeId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">نوع النقل</label>
                  <select 
                    {...register("direction")} 
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="round-trip">ذهاب وعودة (100% من الرسوم)</option>
                    <option value="going">ذهاب فقط (60% من الرسوم)</option>
                    <option value="returning">عودة فقط (60% من الرسوم)</option>
                  </select>
                  {errors.direction && <p className="text-xs text-destructive">{errors.direction.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold">الرسوم المستحقة ({currency})</label>
                  <div className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm font-bold text-primary">
                    {selectedRoute ? calculatedFee.toLocaleString() : '0'}
                  </div>
                  {selectedRoute && (
                    <p className="text-xs text-muted-foreground mt-1">طريقة الدفع: {selectedRoute.feeMode === 'monthly' ? 'شهرياً' : selectedRoute.feeMode === 'term' ? 'نصف سنوي' : 'سنوياً'}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-accent">
                  إلغاء
                </button>
                <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                  حفظ الاشتراك
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
