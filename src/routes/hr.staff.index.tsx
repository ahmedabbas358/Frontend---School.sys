import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Users, Plus, Search, Phone, Mail } from "lucide-react";
import { useState, useMemo } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/hr/staff/")({
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
  paymentType: z.enum(["Monthly", "Weekly", "PerLesson", "Daily"]).optional(),
});

type StaffForm = z.infer<typeof staffSchema>;

function HrStaffIndex() {
  const { currency, allStaff, activeStageStaff, activeStageTeachingAssignments, activeStageSubjects, activeStageSections, addStaff, currentAcademicYearId } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<StaffForm>({
    resolver: zodResolver(staffSchema),
    defaultValues: { status: "active", stage: "all", paymentType: "Monthly" },
  });

  const selectedPaymentType = watch("paymentType") || "Monthly";

  const onSubmit = (data: StaffForm) => {
    if (data.employeeNo) {
      const isDuplicateInCurrentYear = activeStageStaff.some((s: any) => s.employeeNo === data.employeeNo);
      if (isDuplicateInCurrentYear) {
        toast.error("هذا الموظف مسجل مسبقاً في العام الدراسي الحالي! لا يمكن تسجيله مرة أخرى.");
        return;
      }
    }

    addStaff({ ...data, academicYearId: currentAcademicYearId } as any);
    toast.success("تم إضافة الموظف الجديد بنجاح");
    setIsModalOpen(false);
    reset();
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
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (departmentFilter !== "all" && s.department !== departmentFilter) return false;
      if (q && !s.name.includes(q) && !s.role.includes(q) && !s.id.includes(q) && !(s.employeeNo || "").includes(q) && !(s.phone || "").includes(q)) return false;
      return true;
    });
  }, [q, statusFilter, departmentFilter, activeStageStaff]);

  const departments = useMemo(() => Array.from(new Set(activeStageStaff.map(item => item.department).filter(Boolean))), [activeStageStaff]);

  const staffStats = useMemo(() => {
    const active = filtered.filter(item => item.status === "active").length;
    const leaves = filtered.filter(item => item.status === "on_leave").length;
    const payroll = filtered.reduce((sum, item) => sum + (item.basicSalary || 0) + (item.allowance || 0) - (item.deduction || 0), 0);
    const teachers = filtered.filter(item => item.role.includes("معلم") || item.role.includes("مربي")).length;
    return { active, leaves, payroll, teachers };
  }, [filtered]);

  const getAssignmentsSummary = (staffId: string) => {
    const assignments = activeStageTeachingAssignments.filter(item => item.teacherId === staffId);
    if (assignments.length === 0) return "لا توجد إسنادات";
    const subjects = new Set(assignments.map(item => activeStageSubjects.find(subject => subject.id === item.subjectId)?.name).filter(Boolean));
    const sections = new Set(assignments.map(item => {
      const section = activeStageSections.find(sec => sec.id === item.sectionId);
      return section ? `${section.grade}/${section.name}` : "";
    }).filter(Boolean));
    return `${subjects.size} مادة / ${sections.size} شعبة`;
  };

  const printTemplates: PrintTemplate[] = [
    {
      id: "staff-list",
      name: "كشف الموظفين",
      category: "شؤون الموظفين",
      type: "table",
      columns: [
        { label: "الرقم الوظيفي", key: "id" },
        { label: "الاسم", key: "name" },
        { label: "المسمى الوظيفي", key: "role" },
        { label: "القسم", key: "department" },
        { label: "الهاتف", key: "phone" },
        { label: "الراتب الصافي", key: "netSalary" },
        { label: "الإسنادات", key: "assignments" },
        { label: "نطاق العمل", key: "stage", render: (r) => r.stage === "all" ? "شامل" : getStageLabel(r.stage as any) },
        { label: "الحالة", key: "status", render: (r) => r.status === "active" ? "على رأس العمل" : r.status === "on_leave" ? "في إجازة" : "مستقيل" },
      ],
      description: "طباعة كشف مجمع بالموظفين في هذه المرحلة"
    }
  ];

  const printData = filtered.map(item => ({
    ...item,
    netSalary: ((item.basicSalary || 0) + (item.allowance || 0) - (item.deduction || 0)).toLocaleString(),
    assignments: getAssignmentsSummary(item.id),
  }));

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الموارد البشرية" },
        { label: "الموظفين والمعلمين" },
      ]}
      actions={
        <div className="flex gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> إضافة موظف
          </button>
          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary/10 px-4 text-sm font-bold text-primary hover:bg-primary/20 transition-all border border-primary/20"
          >
            <Printer className="h-4 w-4" /> طباعة كشف الموظفين
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        
        {/* Add Staff Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury">
            <div className="w-full max-w-2xl modal-card-luxury overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-border/50 flex justify-between items-center bg-primary/10 shrink-0">
                <h3 className="font-black text-xl flex items-center gap-2.5 text-primary">
                  <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  تسجيل موظف / معلم جديد
                </h3>
                <button onClick={() => { setIsModalOpen(false); reset(); }} className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 overflow-y-auto custom-scrollbar-modal">
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-extrabold text-foreground">الرقم الوظيفي</label>
                    <input
                      {...register("employeeNo")}
                      onBlur={(e) => handleSmartRegistrationCheck(e.target.value)}
                      className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50"
                      placeholder="أدخل الرقم الوظيفي للبحث في الأرشيف"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-extrabold text-foreground">الاسم الكامل <span className="text-danger">*</span></label>
                    <input
                      {...register("name")}
                      className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50"
                    />
                    {errors.name && <p className="mt-1 text-xs font-bold text-danger">{errors.name.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-extrabold text-foreground">المسمى الوظيفي <span className="text-danger">*</span></label>
                  <input
                    {...register("role")}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50"
                    placeholder="معلم رياضيات, مرشد طلابي..."
                  />
                  {errors.role && <p className="mt-1 text-xs font-bold text-danger">{errors.role.message}</p>}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-extrabold text-foreground">الجوال</label>
                    <input {...register("phone")} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50 tabular-nums" dir="ltr" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-extrabold text-foreground">البريد الإلكتروني</label>
                    <input {...register("email")} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50" dir="ltr" />
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-3">
                  <h4 className="text-xs font-black text-primary uppercase tracking-wider">نظام الأجور والتعويضات</h4>
                  <div className="grid gap-3.5 md:grid-cols-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-extrabold text-foreground">نظام الدفع</label>
                      <select {...register("paymentType")} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3 text-xs font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15">
                        <option value="Monthly">راتب شهري</option>
                        <option value="PerLesson">نظام الحصص</option>
                        <option value="Daily">أجر يومي</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-extrabold text-foreground">
                        {selectedPaymentType === "Monthly" ? "الراتب الأساسي" : selectedPaymentType === "PerLesson" ? "أجر الحصة" : "الأجر اليومي"}
                      </label>
                      <input type="number" {...register("basicSalary")} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3 text-sm font-black shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 tabular-nums" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-extrabold text-foreground">البدلات</label>
                      <input type="number" {...register("allowance")} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3 text-sm font-black text-success shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 tabular-nums" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-extrabold text-foreground">الحسميات</label>
                      <input type="number" {...register("deduction")} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3 text-sm font-black text-danger shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 tabular-nums" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-extrabold text-foreground">القسم <span className="text-danger">*</span></label>
                    <input
                      {...register("department")}
                      className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50"
                      placeholder="الشؤون التعليمية, الإدارة..."
                    />
                    {errors.department && <p className="mt-1 text-xs font-bold text-danger">{errors.department.message}</p>}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-extrabold text-foreground">نطاق العمل (المرحلة) <span className="text-danger">*</span></label>
                    <select
                      {...register("stage")}
                      className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50 cursor-pointer"
                    >
                      <option value="all">الكل (شامل لكل المراحل)</option>
                      <option value="kindergarten">رياض الأطفال</option>
                      <option value="primary">الابتدائي</option>
                      <option value="middle">المتوسط</option>
                      <option value="high">الثانوي</option>
                    </select>
                    {errors.stage && <p className="mt-1 text-xs font-bold text-danger">{errors.stage.message}</p>}
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-3 border-t border-border/50 shrink-0">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); reset(); }}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-accent border border-border/80 transition-colors active:scale-[0.98]"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-primary px-8 py-2.5 text-sm font-extrabold text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-[0.98]"
                  >
                    حفظ بيانات الموظف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-md p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">على رأس العمل</p>
            <p className="mt-1 text-2xl font-black text-success tabular-nums">{staffStats.active}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-md p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">في إجازة</p>
            <p className="mt-1 text-2xl font-black text-warning tabular-nums">{staffStats.leaves}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-md p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">معلمون ومربون</p>
            <p className="mt-1 text-2xl font-black text-primary tabular-nums">{staffStats.teachers}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-md p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">صافي الرواتب</p>
            <p className="mt-1 text-2xl font-black tabular-nums">{staffStats.payroll.toLocaleString()} {currency}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-md p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="البحث باسم الموظف أو الرقم أو الهاتف..."
                className="h-11 w-full rounded-xl border border-border/80 bg-background/80 ps-10 pe-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50"
              />
            </div>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50 cursor-pointer">
              <option value="all">كل الحالات</option>
              <option value="active">على رأس العمل</option>
              <option value="on_leave">في إجازة</option>
              <option value="terminated">منتهي الخدمة</option>
            </select>
            <select value={departmentFilter} onChange={event => setDepartmentFilter(event.target.value)} className="h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50 cursor-pointer">
              <option value="all">كل الأقسام</option>
              {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>
        </div>

        <PageCard>
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">دليل الموظفين والمعلمين ({getStageLabel(stage)})</h2>
          </div>
          <DataTable
            rows={filtered}
            columns={[
              { key: "id", header: "الرقم الوظيفي", cell: (r) => <span className="font-bold">{r.employeeNo || r.id}</span> },
              { key: "name", header: "الاسم", cell: (r) => (
                <div>
                  <span className="font-bold text-primary">{r.name}</span>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {r.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {r.phone}</span>}
                    {r.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {r.email}</span>}
                  </div>
                </div>
              ) },
              { key: "role", header: "المسمى الوظيفي", cell: (r) => r.role },
              { key: "department", header: "القسم", cell: (r) => r.department },
              { key: "salary", header: "الراتب الصافي", cell: (r) => {
                const net = (r.basicSalary || 0) + (r.allowance || 0) - (r.deduction || 0);
                return <span className="font-bold text-success">{net.toLocaleString()} {currency}</span>;
              }},
              { key: "assignments", header: "الإسنادات", cell: (r) => <span className="text-sm font-bold text-muted-foreground">{getAssignmentsSummary(r.id)}</span> },
              {
                key: "stage",
                header: "نطاق العمل",
                cell: (r) => (
                  <Badge tone={r.stage === "all" ? "primary" : "success"}>
                    {r.stage === "all" ? "شامل" : getStageLabel(r.stage as any)}
                  </Badge>
                ),
              },
              {
                key: "status",
                header: "الحالة",
                cell: (r) => (
                  <Badge tone={r.status === "active" ? "success" : r.status === "on_leave" ? "warning" : "danger"}>
                    {r.status === "active" ? "على رأس العمل" : r.status === "on_leave" ? "في إجازة" : "مستقيل"}
                  </Badge>
                ),
              },
            ]}
            empty={`لا يوجد موظفين مرتبطين بمرحلة ${getStageLabel(stage)} حالياً.`}
          />
        </PageCard>
      </div>

      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title={`كشف الموظفين - ${getStageLabel(stage)}`}
        data={printData}
        templates={printTemplates} 
      />
    </AppShell>
  );
}
