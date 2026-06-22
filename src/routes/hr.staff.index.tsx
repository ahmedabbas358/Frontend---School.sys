import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Users, Plus, Search, Filter } from "lucide-react";
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
  name: z.string().min(2, "الاسم مطلوب"),
  role: z.string().min(2, "المسمى الوظيفي مطلوب"),
  department: z.string().min(2, "القسم مطلوب"),
  status: z.enum(["active", "on_leave", "terminated"]),
  stage: z.enum(["kindergarten", "primary", "middle", "high", "all"]),
});

type StaffForm = z.infer<typeof staffSchema>;

function HrStaffIndex() {
  const { activeStageStaff, addStaff } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  const [q, setQ] = useState("");
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
      if (q && !s.name.includes(q) && !s.role.includes(q) && !s.id.includes(q)) return false;
      return true;
    });
  }, [q, activeStageStaff]);

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
        { label: "نطاق العمل", key: "stage", render: (r) => r.stage === "all" ? "شامل" : getStageLabel(r.stage as any) },
        { label: "الحالة", key: "status", render: (r) => r.status === "active" ? "على رأس العمل" : r.status === "on_leave" ? "في إجازة" : "مستقيل" },
      ],
      description: "طباعة كشف مجمع بالموظفين في هذه المرحلة"
    }
  ];

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
                
                <div>
                  <label className="mb-1 block text-sm font-medium">الاسم الكامل <span className="text-danger">*</span></label>
                  <input
                    {...register("name")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                  />
                  {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
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

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="البحث باسم الموظف أو المسمى الوظيفي..."
                className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm hover:bg-accent">
              <Filter className="h-4 w-4" /> تصفية
            </button>
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
              { key: "id", header: "الرقم الوظيفي", cell: (r) => <span className="font-bold">{r.id}</span> },
              { key: "name", header: "الاسم", cell: (r) => <span className="font-bold text-primary">{r.name}</span> },
              { key: "role", header: "المسمى الوظيفي", cell: (r) => r.role },
              { key: "department", header: "القسم", cell: (r) => r.department },
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
        data={filtered}
        templates={printTemplates} 
      />
    </AppShell>
  );
}
