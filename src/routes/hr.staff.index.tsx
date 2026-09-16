import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Printer, 
  Eye, 
  Pencil, 
  Trash2, 
  X, 
  AlertCircle,
  Briefcase,
  Layers,
  Sparkles
} from "lucide-react";
import { useState, useMemo } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { 
  STAFF_SECTOR_TABS, 
  STAFF_SECTOR_CONFIG, 
  getStaffSector, 
  isTeachingStaff, 
  matchesStaffId,
  StaffSector 
} from "@/lib/staff-categories";

export const Route = createFileRoute("/hr/staff/")({
  head: () => ({
    meta: [
      { title: "سجل كافة العاملين والموظفين | الموارد البشرية" },
      { name: "description", content: "السجل المركزي الشامل لكافة العاملين والكوادر التعليمية والإدارية والخدمية والنقل بالمدرسة." }
    ],
  }),
  component: HrStaffIndex,
});

const staffSchema = z.object({
  employeeNo: z.string().optional(),
  name: z.string().min(2, "الاسم مطلوب"),
  role: z.string().min(2, "المسمى الوظيفي مطلوب"),
  department: z.string().min(2, "القسم مطلوب"),
  status: z.enum(["active", "on_leave", "terminated"]),
  stage: z.enum(["kindergarten", "primary", "middle", "high", "all"]),
  phone: z.string().optional(),
  email: z.string().optional(),
  basicSalary: z.coerce.number().min(0).optional(),
  allowance: z.coerce.number().min(0).optional(),
  deduction: z.coerce.number().min(0).optional(),
  paymentType: z.enum(["Monthly", "Weekly", "PerLesson", "Hourly", "Daily"]).optional(),
});

type StaffForm = z.infer<typeof staffSchema>;

function HrStaffIndex() {
  const { 
    currency, 
    allStaff, 
    activeStageStaff, 
    activeStageTeachingAssignments, 
    activeStageSubjects, 
    activeStageSections, 
    addStaff, 
    updateStaff,
    deleteStaff,
    currentAcademicYearId 
  } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [activeSector, setActiveSector] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<StaffForm>({
    resolver: zodResolver(staffSchema),
    defaultValues: { status: "active", stage: "all", paymentType: "Monthly" },
  });

  const selectedPaymentType = watch("paymentType") || "Monthly";

  const openAddModal = () => {
    setEditingStaffId(null);
    reset({
      name: "",
      role: "",
      department: "",
      status: "active",
      stage: "all",
      employeeNo: "",
      phone: "",
      email: "",
      basicSalary: 6000,
      allowance: 900,
      deduction: 0,
      paymentType: "Monthly"
    });
    setIsModalOpen(true);
  };

  const openEditModal = (s: any) => {
    setEditingStaffId(s.id);
    reset({
      name: s.name,
      role: s.role,
      department: s.department,
      status: s.status,
      stage: s.stage || "all",
      employeeNo: s.employeeNo || "",
      phone: s.phone || "",
      email: s.email || "",
      basicSalary: s.basicSalary || 0,
      allowance: s.allowance || 0,
      deduction: s.deduction || 0,
      paymentType: s.paymentType || "Monthly"
    });
    setIsModalOpen(true);
  };

  const onSubmit = (data: StaffForm) => {
    if (editingStaffId) {
      updateStaff(editingStaffId, data as any);
      toast.success("تم تحديث بيانات الموظف بنجاح");
    } else {
      if (data.employeeNo) {
        const isDuplicateInCurrentYear = activeStageStaff.some((s: any) => s.employeeNo === data.employeeNo);
        if (isDuplicateInCurrentYear) {
          toast.error("هذا الموظف مسجل مسبقاً في العام الدراسي الحالي! لا يمكن تسجيله مرة أخرى.");
          return;
        }
      }

      addStaff({ ...data, academicYearId: currentAcademicYearId } as any);
      toast.success("تم إضافة الموظف الجديد بنجاح");
    }
    setIsModalOpen(false);
    reset();
  };

  const confirmDelete = () => {
    if (staffToDelete) {
      deleteStaff(staffToDelete);
      toast.success("تم حذف الموظف بنجاح");
      setStaffToDelete(null);
    }
  };

  const handleSmartRegistrationCheck = (empNoToCheck: string) => {
    if (!empNoToCheck || empNoToCheck.length < 3) return;
    const existingStaff = allStaff.find((s: any) => s.employeeNo === empNoToCheck);
    if (existingStaff) {
      toast.success("تم العثور على سجل سابق للموظف! جاري استيراد البيانات التاريخية...");
      reset({
        ...watch(),
        name: existingStaff.name,
        role: existingStaff.role,
        department: existingStaff.department,
        status: existingStaff.status,
        phone: existingStaff.phone,
        email: existingStaff.email,
        basicSalary: existingStaff.basicSalary,
        allowance: existingStaff.allowance,
        deduction: existingStaff.deduction,
        paymentType: existingStaff.paymentType,
        stage: existingStaff.stage as any,
      });
    }
  };

  const filtered = useMemo(() => {
    return activeStageStaff.filter((s) => {
      if (s.isDeleted) return false;
      
      // Sector filter
      if (activeSector !== "all") {
        const sector = getStaffSector(s);
        if (sector !== activeSector) return false;
      }

      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (departmentFilter !== "all" && s.department !== departmentFilter) return false;
      
      if (q.trim()) {
        const query = q.toLowerCase();
        return (
          s.name.toLowerCase().includes(query) || 
          s.role.toLowerCase().includes(query) || 
          s.id.toLowerCase().includes(query) || 
          (s.employeeNo || "").toLowerCase().includes(query) || 
          (s.phone || "").includes(query)
        );
      }
      return true;
    });
  }, [q, statusFilter, departmentFilter, activeSector, activeStageStaff]);

  const departments = useMemo(() => Array.from(new Set(activeStageStaff.map(item => item.department).filter(Boolean))), [activeStageStaff]);

  const staffStats = useMemo(() => {
    const total = filtered.length;
    const active = filtered.filter(item => item.status === "active").length;
    const leaves = filtered.filter(item => item.status === "on_leave").length;
    const payroll = filtered.reduce((sum, item) => sum + (item.basicSalary || 0) + (item.allowance || 0) - (item.deduction || 0), 0);
    const teachers = filtered.filter(item => isTeachingStaff(item)).length;
    return { total, active, leaves, payroll, teachers };
  }, [filtered]);

  const getAssignmentsSummary = (staff: any) => {
    if (!isTeachingStaff(staff)) {
      const sector = getStaffSector(staff);
      const meta = STAFF_SECTOR_CONFIG[sector];
      return (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${meta.bgLightClass} ${meta.accentClass}`}>
          {meta.shortLabel}
        </span>
      );
    }

    const assignments = activeStageTeachingAssignments.filter(item => matchesStaffId(staff, item.teacherId));
    if (assignments.length === 0) {
      return <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md">بانتظار إسناد</span>;
    }

    const subjects = new Set(assignments.map(item => activeStageSubjects.find(subject => subject.id === item.subjectId)?.name).filter(Boolean));
    const sections = new Set(assignments.map(item => {
      const section = activeStageSections.find(sec => sec.id === item.sectionId);
      return section ? `${section.grade}/${section.name}` : "";
    }).filter(Boolean));
    
    return (
      <div className="flex flex-col text-xs">
        <span className="font-black text-primary">{subjects.size} مادة</span>
        <span className="text-[10px] text-muted-foreground font-bold">{sections.size} شعبة</span>
      </div>
    );
  };

  const printTemplates: PrintTemplate[] = [
    {
      id: "staff-list",
      name: "سجل العاملين الشامل بالمنشأة",
      category: "شؤون الموظفين",
      type: "table",
      columns: [
        { label: "الرقم الوظيفي", key: "employeeNo" },
        { label: "الاسم", key: "name" },
        { label: "المسمى الوظيفي", key: "role" },
        { label: "القطاع", key: "sectorLabel" },
        { label: "القسم", key: "department" },
        { label: "الهاتف", key: "phone" },
        { label: "الراتب الصافي", key: "netSalary" },
        { label: "نطاق العمل", key: "stageLabel" },
        { label: "الحالة", key: "statusLabel" },
      ],
      description: "كشف مجمع بكافة الموظفين والعاملين حسب الفلاتر المطبقة"
    }
  ];

  const printData = filtered.map(item => ({
    ...item,
    employeeNo: item.employeeNo || item.id,
    sectorLabel: STAFF_SECTOR_CONFIG[getStaffSector(item)].label,
    stageLabel: item.stage === "all" ? "شامل" : getStageLabel(item.stage as any),
    statusLabel: item.status === "active" ? "على رأس العمل" : item.status === "on_leave" ? "في إجازة" : "غير نشط",
    netSalary: ((item.basicSalary || 0) + (item.allowance || 0) - (item.deduction || 0)).toLocaleString(),
  }));

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "شؤون الموظفين (HR)" },
        { label: "سجل كافة العاملين والموظفين" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-card border border-border/70 px-3.5 text-xs font-black shadow-xs hover:bg-accent transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-primary" />
            طباعة السجل الشامل
          </button>
          <button 
            onClick={openAddModal}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground hover:bg-primary/90 shadow-sm transition-all hover:scale-105 active:scale-95 glow-primary"
          >
            <Plus className="h-4 w-4" /> إضافة موظف / عامل جديد
          </button>
        </div>
      }
    >
      <div className="space-y-5" dir="rtl">
        
        {/* Sector Category Tabs (المحور الرابع) */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-card border border-border/70 shadow-xs overflow-x-auto custom-scrollbar">
          {STAFF_SECTOR_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSector === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSector(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 select-none ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-xs glow-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Staff Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-xs backdrop-blur-xl">
            <span className="text-[11px] font-bold text-muted-foreground">إجمالي القوى العاملة بالقسم</span>
            <div className="text-2xl font-black text-foreground mt-1 tabular-nums flex items-baseline gap-1.5">
              <span>{staffStats.total}</span>
              <span className="text-xs text-muted-foreground font-normal">موظف وعامل</span>
            </div>
          </div>
          <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-xs backdrop-blur-xl">
            <span className="text-[11px] font-bold text-muted-foreground">على رأس العمل</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums flex items-baseline gap-1.5">
              <span>{staffStats.active}</span>
              <span className="text-xs text-muted-foreground font-normal">نشط</span>
            </div>
          </div>
          <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-xs backdrop-blur-xl">
            <span className="text-[11px] font-bold text-muted-foreground">في إجازات رسمية</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 tabular-nums flex items-baseline gap-1.5">
              <span>{staffStats.leaves}</span>
              <span className="text-xs text-muted-foreground font-normal">موظف</span>
            </div>
          </div>
          <div className="rounded-3xl border border-border/70 bg-card/90 p-4 shadow-xs backdrop-blur-xl">
            <span className="text-[11px] font-bold text-muted-foreground">إجمالي مسير الأجور الشهري</span>
            <div className="text-2xl font-black text-primary mt-1 tabular-nums flex items-baseline gap-1.5">
              <span>{staffStats.payroll.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground font-normal">{currency}</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-xs">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="البحث بالاسم أو الرقم الوظيفي أو الجوال أو الوظيفة..."
                className="h-10 w-full rounded-xl border border-input bg-background/80 ps-9 pe-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
              />
            </div>
            <select 
              value={statusFilter} 
              onChange={event => setStatusFilter(event.target.value)} 
              className="h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">كل الحالات الوظيفية</option>
              <option value="active">على رأس العمل</option>
              <option value="on_leave">في إجازة</option>
              <option value="terminated">منتهي الخدمة</option>
            </select>
            <select 
              value={departmentFilter} 
              onChange={event => setDepartmentFilter(event.target.value)} 
              className="h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">كل الأقسام والإدارات</option>
              {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>
        </div>

        {/* Main Central Staff Directory Table */}
        <PageCard>
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-base font-black text-foreground">
                سجل العاملين ({activeSector === "all" ? "كافة القطاعات" : STAFF_SECTOR_CONFIG[activeSector as StaffSector]?.label})
              </h2>
            </div>
            <span className="text-xs font-bold text-muted-foreground">
              {filtered.length} موظف مسجل
            </span>
          </div>

          <DataTable
            rows={filtered}
            columns={[
              { 
                key: "id", 
                header: "الرقم الوظيفي", 
                cell: (r) => <span className="font-black tabular-nums text-xs text-muted-foreground">{r.employeeNo || r.id}</span> 
              },
              { 
                key: "name", 
                header: "الاسم والمسمى الوظيفي", 
                cell: (r) => {
                  const isTeacher = isTeachingStaff(r);
                  const profileUrl = isTeacher ? `/teachers/${r.employeeNo || r.id}` : `/hr/staff/${r.employeeNo || r.id}`;
                  return (
                    <div>
                      <Link 
                        to={profileUrl as any} 
                        className="font-black text-sm text-primary hover:underline flex items-center gap-1.5"
                      >
                        {r.name}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground font-bold">
                        <span>{r.role}</span>
                        <span className="h-3 w-px bg-border"></span>
                        <span className="text-[11px]">{r.department}</span>
                      </div>
                    </div>
                  );
                } 
              },
              {
                key: "sector",
                header: "التصنيف القطاعي",
                cell: (r) => {
                  const sector = getStaffSector(r);
                  const meta = STAFF_SECTOR_CONFIG[sector];
                  return (
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg border inline-flex items-center gap-1 ${meta.bgLightClass} ${meta.accentClass} ${meta.borderClass}`}>
                      {meta.shortLabel}
                    </span>
                  );
                }
              },
              { 
                key: "phone", 
                header: "الهاتف والتواصل", 
                cell: (r) => (
                  <span className="tabular-nums font-bold text-xs text-foreground/80" dir="ltr">
                    {r.phone || "-"}
                  </span>
                ) 
              },
              { 
                key: "salary", 
                header: "الراتب الصافي", 
                cell: (r) => {
                  const net = (r.basicSalary || 0) + (r.allowance || 0) - (r.deduction || 0);
                  return (
                    <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {net.toLocaleString()} {currency}
                    </span>
                  );
                }
              },
              { 
                key: "assignments", 
                header: "الإسناد / النشاط", 
                cell: (r) => getAssignmentsSummary(r) 
              },
              {
                key: "status",
                header: "الحالة",
                cell: (r) => (
                  <Badge tone={r.status === "active" ? "success" : r.status === "on_leave" ? "warning" : "danger"}>
                    {r.status === "active" ? "على رأس العمل" : r.status === "on_leave" ? "في إجازة" : "غير نشط"}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "الإجراءات",
                cell: (r) => {
                  const isTeacher = isTeachingStaff(r);
                  const profileUrl = isTeacher ? `/teachers/${r.employeeNo || r.id}` : `/hr/staff/${r.employeeNo || r.id}`;
                  return (
                    <div className="flex items-center justify-end gap-1">
                      <Link 
                        to={profileUrl as any} 
                        className="inline-flex rounded-xl p-2 text-primary hover:bg-primary/10 transition-colors" 
                        title="معاينة الملف الشامل"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button 
                        onClick={() => openEditModal(r)} 
                        className="inline-flex rounded-xl p-2 text-primary hover:bg-primary/10 transition-colors" 
                        title="تعديل البيانات"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setStaffToDelete(r.id)} 
                        className="inline-flex rounded-xl p-2 text-danger hover:bg-danger/10 transition-colors" 
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                }
              }
            ]}
            empty="لم يتم العثور على موظفين أو عمال يطابقون خيارات البحث والتصفية المحددة."
          />
        </PageCard>
      </div>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
          <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
            <div className="p-5 border-b border-border/60 flex justify-between items-center bg-primary/5 shrink-0">
              <h3 className="font-black text-base flex items-center gap-2 text-primary">
                <Users className="h-5 w-5" />
                {editingStaffId ? "تعديل بيانات الموظف" : "تسجيل موظف / عامل جديد في المنظومة"}
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); reset(); }} 
                className="h-8 w-8 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-foreground">الرقم الوظيفي</label>
                  <input
                    {...register("employeeNo")}
                    onBlur={(e) => handleSmartRegistrationCheck(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all tabular-nums text-left"
                    placeholder="مثال: EMP-105"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-foreground">الاسم الكامل <span className="text-destructive">*</span></label>
                  <input
                    {...register("name")}
                    className="h-10 w-full rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="اسم الموظف أو العامل..."
                  />
                  {errors.name && <p className="mt-1 text-[11px] font-bold text-destructive">{errors.name.message}</p>}
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-foreground">المسمى الوظيفي <span className="text-destructive">*</span></label>
                  <input
                    {...register("role")}
                    className="h-10 w-full rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="سائق حافلة، محاسب، حارس أمن، معلم..."
                  />
                  {errors.role && <p className="mt-1 text-[11px] font-bold text-destructive">{errors.role.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block font-bold text-foreground">القسم / الإدارة <span className="text-destructive">*</span></label>
                  <input
                    {...register("department")}
                    className="h-10 w-full rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="الشؤون المالية، النقل، الصيانة، الأكاديمية..."
                  />
                  {errors.department && <p className="mt-1 text-[11px] font-bold text-destructive">{errors.department.message}</p>}
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-foreground">رقم الجوال</label>
                  <input {...register("phone")} className="h-10 w-full rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all tabular-nums text-left" dir="ltr" placeholder="05XXXXXXXX" />
                </div>
                <div>
                  <label className="mb-1 block font-bold text-foreground">البريد الإلكتروني</label>
                  <input {...register("email")} className="h-10 w-full rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-left" dir="ltr" placeholder="staff@school.edu.sa" />
                </div>
              </div>

              {/* Financial Scheme */}
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-3">
                <h4 className="text-xs font-black text-primary uppercase">نظام الأجور والمستحقات</h4>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div>
                    <label className="mb-1 block font-bold text-foreground">نظام الصرف</label>
                    <select {...register("paymentType")} className="h-10 w-full rounded-xl border border-input bg-background/80 px-2 text-xs font-bold outline-none focus:border-primary cursor-pointer">
                      <option value="Monthly">راتب شهري</option>
                      <option value="PerLesson">نظام الحصص</option>
                      <option value="Daily">أجر يومي</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-foreground">
                      {selectedPaymentType === "Monthly" ? "الأساسي" : selectedPaymentType === "PerLesson" ? "أجر الحصة" : "الأجر اليومي"}
                    </label>
                    <input type="number" {...register("basicSalary")} className="h-10 w-full rounded-xl border border-input bg-background/80 px-2.5 text-xs font-black outline-none focus:border-primary tabular-nums" />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-foreground">البدلات</label>
                    <input type="number" {...register("allowance")} className="h-10 w-full rounded-xl border border-input bg-background/80 px-2.5 text-xs font-black text-emerald-600 dark:text-emerald-400 outline-none focus:border-primary tabular-nums" />
                  </div>
                  <div>
                    <label className="mb-1 block font-bold text-foreground">الحسميات</label>
                    <input type="number" {...register("deduction")} className="h-10 w-full rounded-xl border border-input bg-background/80 px-2.5 text-xs font-black text-destructive outline-none focus:border-primary tabular-nums" />
                  </div>
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-bold text-foreground">الحالة الوظيفية</label>
                  <select {...register("status")} className="h-10 w-full rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer">
                    <option value="active">على رأس العمل</option>
                    <option value="on_leave">في إجازة</option>
                    <option value="terminated">منتهي الخدمة</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-bold text-foreground">نطاق العمل (المرحلة)</label>
                  <select {...register("stage")} className="h-10 w-full rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer">
                    <option value="all">شامل لكافة المراحل</option>
                    <option value="kindergarten">رياض الأطفال</option>
                    <option value="primary">الابتدائي</option>
                    <option value="middle">المتوسط</option>
                    <option value="high">الثانوي</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-border shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); reset(); }}
                  className="h-10 px-5 rounded-xl border border-input text-xs font-bold hover:bg-accent"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="h-10 px-7 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md glow-primary"
                >
                  {editingStaffId ? "حفظ التعديلات" : "حفظ بيانات الموظف"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {staffToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
          <div className="w-full max-w-sm rounded-3xl border border-border/80 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="rounded-2xl bg-destructive/10 p-3.5 text-destructive mb-3.5 inline-block">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="text-base font-black text-foreground mb-1.5">تأكيد حذف الموظف</h2>
            <p className="text-muted-foreground mb-5 text-xs font-bold leading-relaxed">
              هل أنت متأكد من رغبتك في حذف هذا الموظف؟ سيتم أرشفة السجل وإلغاء ارتباطاته.
            </p>
            <div className="flex gap-2.5">
              <button 
                onClick={() => setStaffToDelete(null)} 
                className="flex-1 h-10 rounded-xl border border-input text-xs font-bold hover:bg-accent"
              >
                إلغاء
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-xs font-black hover:bg-destructive/90 shadow-md"
              >
                نعم، احذف
              </button>
            </div>
          </div>
        </div>
      )}

      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title="سجل العاملين الشامل بالمنشأة"
        data={printData}
        templates={printTemplates} 
      />
    </AppShell>
  );
}
