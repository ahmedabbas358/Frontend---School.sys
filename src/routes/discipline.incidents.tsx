import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { AlertCircle, Plus, Search, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { toast } from "sonner";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { Printer } from "lucide-react";
import { SearchableSelect, SearchableSelectOption } from "@/components/searchable-select";

export const Route = createFileRoute("/discipline/incidents")({
  component: DisciplineIncidents,
});

const incidentSchema = z.object({
  studentId: z.string().min(1, "الرجاء اختيار الطالب"),
  categoryId: z.string().min(1, "الرجاء تحديد تصنيف السلوك"),
  description: z.string().min(5, "الرجاء وصف الحالة بالتفصيل"),
  location: z.string().optional(),
  actionTaken: z.string().optional(),
});

type IncidentForm = z.infer<typeof incidentSchema>;

function DisciplineIncidents() {
  const { allBehaviorTransactions, allDisciplineCategories, activeStageStudents, activeStageSections, addDisciplineIncident, addBehaviorTransaction, currentAcademicYearId, allStudentEnrollments } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  
  const [q, setQ] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm<IncidentForm>({
    resolver: zodResolver(incidentSchema),
    defaultValues: { studentId: "", categoryId: "", description: "" },
  });

  const onSubmit = (data: IncidentForm) => {
    if (!currentAcademicYearId) {
      toast.error("لا يوجد عام دراسي نشط");
      return;
    }

    const enrollment = allStudentEnrollments.find(e => e.studentId === data.studentId && e.academicYearId === currentAcademicYearId);
    if (!enrollment) {
      toast.error("الطالب غير مسجل في العام الحالي");
      return;
    }

    const category = allDisciplineCategories.find(c => c.id === data.categoryId);
    if (!category) return;

    // 1. Create the Incident
    const incidentId = `DI-${Math.floor(1000 + Math.random() * 9000)}`;
    addDisciplineIncident({
      studentEnrollmentId: enrollment.id,
      date: new Date().toISOString().split("T")[0],
      location: data.location,
      description: data.description,
      responsiblePerson: "current_user",
      actionTaken: data.actionTaken
    });

    // 2. Create the Ledger Transaction (Negative Points)
    addBehaviorTransaction({
      studentEnrollmentId: enrollment.id,
      type: "negative",
      points: category.defaultPoints, // Negative by default for these categories
      categoryId: category.id,
      reason: data.description,
      createdBy: "current_user",
      date: new Date().toISOString().split("T")[0],
    });

    toast.success("تم تسجيل الواقعة السلوكية وخصم النقاط بنجاح");
    setIsModalOpen(false);
    reset();
  };

  const studentOptions: SearchableSelectOption[] = activeStageStudents.map(st => {
    const enrollment = allStudentEnrollments.find(e => e.studentId === st.id && e.academicYearId === currentAcademicYearId);
    const secId = enrollment?.sectionId || st.sectionId;
    const secName = activeStageSections.find(s => s.id === secId)?.name || '';
    return {
      id: st.id,
      title: st.name,
      subtitle: `${st.grade} ${secId ? `- شعبة ${secName}` : ''}`
    };
  });

  const uniqueGrades = useMemo(() => Array.from(new Set(activeStageSections.map(s => s.grade))).filter(Boolean), [activeStageSections]);

  const filtered = useMemo(() => {
    return allBehaviorTransactions.filter((tx) => {
      if (tx.type !== "negative") return false;

      const enrollment = allStudentEnrollments.find(e => e.id === tx.studentEnrollmentId);
      if (!enrollment) return false;
      const student = activeStageStudents.find(s => s.id === enrollment.studentId);
      if (!student) return false;

      if (q && !student.name.includes(q) && !tx.id.includes(q)) return false;
      if (filterDateFrom && tx.date < filterDateFrom) return false;
      if (filterDateTo && tx.date > filterDateTo) return false;
      if (filterGrade && student.grade !== filterGrade) return false;
      if (filterSection && (enrollment.sectionId || student.sectionId) !== filterSection) return false;

      return true;
    }).map(tx => {
      const enrollment = allStudentEnrollments.find(e => e.id === tx.studentEnrollmentId)!;
      const student = activeStageStudents.find(s => s.id === enrollment.studentId)!;
      const category = allDisciplineCategories.find(c => c.id === tx.categoryId);
      return {
        ...tx,
        studentName: student.name,
        categoryName: category?.name || "غير محدد",
        grade: student.grade
      };
    });
  }, [q, filterDateFrom, filterDateTo, filterGrade, filterSection, allBehaviorTransactions, activeStageStudents, allStudentEnrollments, allDisciplineCategories]);

  const printTemplates: PrintTemplate[] = [
    {
      id: "incidents-list",
      name: "سجل الحوادث السلوكية",
      category: "السلوك والمواظبة",
      type: "table",
      columns: [
        { label: "الرقم", key: "id" },
        { label: "التاريخ", key: "date" },
        { label: "اسم الطالب", key: "studentName" },
        { label: "النوع", key: "type", render: (r) => r.type === "positive" ? "إيجابي" : "سلبي" },
        { label: "التصنيف", key: "category" },
        { label: "النقاط", key: "points", render: (r) => r.points > 0 ? `+${r.points}` : r.points.toString() },
        { label: "التفاصيل", key: "description" },
      ]
    }
  ];

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "السلوك والمواظبة" },
        { label: "سجل الحوادث السلوكية" },
      ]}
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-card border border-border/50 px-3 text-sm font-bold shadow-sm hover:bg-accent transition-colors"
          >
            <Printer className="h-4 w-4" /> طباعة السجل
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 shadow-sm"
          >
            <Plus className="h-4 w-4" /> تسجيل واقعة جديدة
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        
        {/* Top Filters Bar */}
        <PageCard title="عوامل التصفية">
          <div className="grid gap-3 md:grid-cols-5">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="البحث بالاسم أو الرقم..."
                className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <select 
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold cursor-pointer outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={filterGrade}
              onChange={e => setFilterGrade(e.target.value)}
            >
              <option value="">كل الصفوف</option>
              {uniqueGrades.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select 
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold cursor-pointer outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              value={filterSection}
              onChange={e => setFilterSection(e.target.value)}
              disabled={!filterGrade}
            >
              <option value="">كل الشُعب</option>
              {activeStageSections.filter(s => !filterGrade || s.grade === filterGrade).map((s) => (
                <option key={s.id} value={s.id}>شعبة {s.name}</option>
              ))}
            </select>
            <div className="flex flex-col">
              <input 
                type="date" 
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                title="من تاريخ"
              />
            </div>
            <div className="flex flex-col">
              <input 
                type="date" 
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                title="إلى تاريخ"
              />
            </div>
          </div>
        </PageCard>

        <PageCard>
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
            <AlertCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">سجل الحوادث السلوكية ({getStageLabel(stage)})</h2>
          </div>
          <DataTable
            rows={filtered}
            columns={[
              { key: "id", header: "الرقم", cell: (r) => <span className="font-bold tabular-nums text-muted-foreground">{r.id}</span> },
              { key: "date", header: "التاريخ", cell: (r) => <span className="tabular-nums font-medium">{r.date}</span> },
              { key: "student", header: "اسم الطالب", cell: (r) => <span className="font-bold text-foreground">{r.studentName}</span> },
              {
                key: "type",
                header: "النوع",
                cell: (r) => (
                  <Badge tone={r.type === "positive" ? "success" : "danger"}>
                    {r.type === "positive" ? "مكافأة / إيجابي" : "مخالفة / سلبي"}
                  </Badge>
                ),
              },
              { key: "category", header: "التصنيف", cell: (r) => r.categoryName },
              { 
                key: "points", 
                header: "النقاط", 
                cell: (r) => (
                  <span className={`font-black text-lg tabular-nums ${r.points > 0 ? "text-success" : "text-danger"}`}>
                    {r.points > 0 ? `+${r.points}` : r.points}
                  </span>
                ) 
              },
              { key: "desc", header: "التفاصيل", cell: (r) => <span className="text-sm font-medium">{r.reason}</span> },
            ]}
            empty={`لا توجد حوادث سلوكية مطابقة لخيارات الفلترة.`}
          />
        </PageCard>
      </div>

      {/* Add Incident Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg flex flex-col rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="p-6 pb-4 border-b border-border/50 shrink-0">
              <h3 className="text-2xl font-black text-primary">تسجيل واقعة سلوكية</h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <form id="incident-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">اسم الطالب ({getStageLabel(stage)}) <span className="text-danger">*</span></label>
                  <Controller
                    name="studentId"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={studentOptions}
                        placeholder="-- اختر الطالب --"
                        searchPlaceholder="ابحث باسم الطالب..."
                      />
                    )}
                  />
                  {errors.studentId && <p className="mt-1.5 text-xs font-bold text-danger">{errors.studentId.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-muted-foreground">تصنيف الواقعة (مخالفة) <span className="text-danger">*</span></label>
                    <select
                      {...register("categoryId")}
                      className="h-12 w-full rounded-2xl border border-border/50 bg-background px-4 text-sm font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                    >
                      <option value="">-- اختر التصنيف --</option>
                      {allDisciplineCategories.filter(c => c.type === "behavioral" && c.defaultPoints < 0).map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.defaultPoints} نقطة)</option>
                      ))}
                    </select>
                    {errors.categoryId && <p className="mt-1.5 text-xs font-bold text-danger">{errors.categoryId.message}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-muted-foreground">المكان</label>
                    <input
                      {...register("location")}
                      className="h-12 w-full rounded-2xl border border-border/50 bg-background px-4 text-sm font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      placeholder="الفصل، الساحة، المعمل..."
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">الإجراء المتخذ</label>
                  <input
                    {...register("actionTaken")}
                    className="h-12 w-full rounded-2xl border border-border/50 bg-background px-4 text-sm font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="إنذار شفوي، استدعاء..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">وصف الحالة والتفاصيل <span className="text-danger">*</span></label>
                  <textarea
                    {...register("description")}
                    className="w-full rounded-2xl border border-border/50 bg-background p-4 text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none custom-scrollbar"
                    rows={4}
                  />
                  {errors.description && <p className="mt-1.5 text-xs font-bold text-danger">{errors.description.message}</p>}
                </div>
              </form>
            </div>
            <div className="p-6 pt-4 border-t border-border/50 flex justify-end gap-3 bg-card rounded-b-3xl shrink-0">
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); reset(); }}
                className="rounded-xl px-5 py-2.5 font-bold hover:bg-accent transition-colors"
              >
                إلغاء
              </button>
              <button
                form="incident-form"
                type="submit"
                className="rounded-xl bg-primary px-8 py-2.5 font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm hover:scale-105"
              >
                حفظ الواقعة
              </button>
            </div>
          </div>
        </div>
      )}

      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title={`سجل الحوادث السلوكية - ${getStageLabel(stage)}`}
        data={filtered}
        templates={printTemplates} 
      />
    </AppShell>
  );
}
