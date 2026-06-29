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
});

type StaffForm = z.infer<typeof staffSchema>;

function HrStaffIndex() {
  const { currency, activeStageStaff, activeStageTeachingAssignments, activeStageSubjects, activeStageSections, addStaff } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StaffForm>({
    resolver: zodResolver(staffSchema),
    defaultValues: { status: "active", stage: "all" },
  });

  const onSubmit = (data: StaffForm) => {
    addStaff(data);
    toast.success("تم إضافة الموظف الجديد بنجاح");
    setIsModalOpen(false);
    reset();
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-bold">تسجيل موظف / معلم جديد</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                
                <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">الرقم الوظيفي</label>
                  <input
                    {...register("employeeNo")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                    placeholder="يولد تلقائياً إذا ترك فارغاً"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">الاسم الكامل <span className="text-danger">*</span></label>
                  <input
                    {...register("name")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                  />
                  {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
                </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">المسمى الوظيفي <span className="text-danger">*</span></label>
                  <input
                    {...register("role")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                    placeholder="معلم رياضيات, مرشد طلابي..."
                  />
                  {errors.role && <p className="mt-1 text-xs text-danger">{errors.role.message}</p>}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">الجوال</label>
                    <input {...register("phone")} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">البريد الإلكتروني</label>
                    <input {...register("email")} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">الراتب الأساسي</label>
                    <input type="number" {...register("basicSalary")} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">البدلات</label>
                    <input type="number" {...register("allowance")} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">الحسميات</label>
                    <input type="number" {...register("deduction")} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">القسم <span className="text-danger">*</span></label>
                  <input
                    {...register("department")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                    placeholder="الشؤون التعليمية, الإدارة..."
                  />
                  {errors.department && <p className="mt-1 text-xs text-danger">{errors.department.message}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">نطاق العمل (المرحلة) <span className="text-danger">*</span></label>
                  <select
                    {...register("stage")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                  >
                    <option value="all">الكل (شامل لكل المراحل)</option>
                    <option value="kindergarten">رياض الأطفال</option>
                    <option value="primary">الابتدائي</option>
                    <option value="middle">المتوسط</option>
                    <option value="high">الثانوي</option>
                  </select>
                  {errors.stage && <p className="mt-1 text-xs text-danger">{errors.stage.message}</p>}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); reset(); }}
                    className="h-10 rounded-lg px-4 text-sm font-medium hover:bg-accent"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="h-10 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    حفظ بيانات الموظف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">على رأس العمل</p>
            <p className="mt-1 text-2xl font-black text-success">{staffStats.active}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">في إجازة</p>
            <p className="mt-1 text-2xl font-black text-warning">{staffStats.leaves}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">معلمون ومربون</p>
            <p className="mt-1 text-2xl font-black text-primary">{staffStats.teachers}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">صافي الرواتب</p>
            <p className="mt-1 text-2xl font-black">{staffStats.payroll.toLocaleString()} {currency}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="البحث باسم الموظف أو الرقم أو الهاتف..."
                className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold">
              <option value="all">كل الحالات</option>
              <option value="active">على رأس العمل</option>
              <option value="on_leave">في إجازة</option>
              <option value="terminated">منتهي الخدمة</option>
            </select>
            <select value={departmentFilter} onChange={event => setDepartmentFilter(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold">
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
