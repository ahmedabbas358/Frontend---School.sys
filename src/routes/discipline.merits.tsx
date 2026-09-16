import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Star, Plus, Search, Printer } from "lucide-react";
import { useState, useMemo } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { toast } from "sonner";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { SearchableSelect, SearchableSelectOption } from "@/components/searchable-select";
import { ModalStudentGradeSectionFilter } from "@/components/grade-section-control";

export const Route = createFileRoute("/discipline/merits")({
  component: DisciplineMerits,
});

const meritSchema = z.object({
  studentId: z.string().min(1, "الرجاء اختيار الطالب"),
  categoryId: z.string().min(1, "الرجاء تحديد سبب التميز أو المكافأة"),
  description: z.string().optional(),
});

type MeritForm = z.infer<typeof meritSchema>;

function DisciplineMerits() {
  const { allBehaviorTransactions, allDisciplineCategories, activeStageStudents, activeStageSections, addBehaviorTransaction, currentAcademicYearId, allStudentEnrollments } = useGlobalStore();
  const { stage, getStageLabel } = useStage();

  const [q, setQ] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [modalGrade, setModalGrade] = useState("");
  const [modalSection, setModalSection] = useState("");

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<MeritForm>({
    resolver: zodResolver(meritSchema),
    defaultValues: { studentId: "", categoryId: "", description: "" },
  });

  const onSubmit = (data: MeritForm) => {
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

    addBehaviorTransaction({
      studentEnrollmentId: enrollment.id,
      type: "positive",
      points: category.defaultPoints,
      categoryId: category.id,
      reason: data.description || "منح نقاط تميز / مكافأة",
      createdBy: "current_user",
      date: new Date().toISOString().split("T")[0],
    });

    toast.success("تم منح المكافأة بنجاح");
    setIsModalOpen(false);
    reset();
    setModalGrade("");
    setModalSection("");
  };

  const uniqueGrades = useMemo(() => Array.from(new Set(activeStageSections.map(s => s.grade))).filter(Boolean), [activeStageSections]);

  const modalStudentOptions: SearchableSelectOption[] = useMemo(() => {
    return activeStageStudents
      .filter(st => {
        if (modalGrade && st.grade !== modalGrade) return false;
        const enrollment = allStudentEnrollments.find(e => e.studentId === st.id && e.academicYearId === currentAcademicYearId);
        const secId = enrollment?.sectionId || st.sectionId;
        if (modalSection && secId !== modalSection) return false;
        return true;
      })
      .map(st => {
        const enrollment = allStudentEnrollments.find(e => e.studentId === st.id && e.academicYearId === currentAcademicYearId);
        const secId = enrollment?.sectionId || st.sectionId;
        const secName = activeStageSections.find(s => s.id === secId)?.name || '';
        return {
          id: st.id,
          title: st.name,
          subtitle: `${st.grade} ${secId ? `- شعبة ${secName}` : ''}`
        };
      });
  }, [activeStageStudents, modalGrade, modalSection, allStudentEnrollments, currentAcademicYearId, activeStageSections]);

  const filtered = useMemo(() => {
    return allBehaviorTransactions.filter((tx) => {
      // ONLY positive transactions
      if (tx.type !== "positive") return false;

      const enrollment = allStudentEnrollments.find(e => e.id === tx.studentEnrollmentId);
      if (!enrollment) return false;
      const student = activeStageStudents.find(s => s.id === enrollment.studentId);
      if (!student) return false;

      // Name/ID Filter
      if (q && !student.name.includes(q) && !tx.id.includes(q)) return false;
      
      // Date Filters
      if (filterDateFrom && tx.date < filterDateFrom) return false;
      if (filterDateTo && tx.date > filterDateTo) return false;

      // Grade & Section Filters
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
      id: "merits-list",
      name: "سجل المكافآت ونقاط التميز",
      category: "السلوك والمواظبة",
      type: "table",
      columns: [
        { label: "الرقم", key: "id" },
        { label: "التاريخ", key: "date" },
        { label: "اسم الطالب", key: "studentName" },
        { label: "سبب التميز", key: "category" },
        { label: "النقاط المكتسبة", key: "points", render: (r) => `+${r.points}` },
      ]
    }
  ];

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "السلوك والمواظبة" },
        { label: "نقاط التميز والمكافآت" },
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
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-success px-3 text-sm font-bold text-success-foreground hover:bg-success/90 transition-all hover:scale-105 shadow-sm"
          >
            <Plus className="h-4 w-4" /> منح نقاط مكافأة
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        
        {/* Top Filters Bar */}
        <div className="rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur-xl shadow-sm">
          <div className="grid gap-3.5 md:grid-cols-5">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="البحث باسم الطالب..."
                className="h-11 w-full rounded-xl border border-border/80 bg-background/80 ps-10 pe-4 text-sm font-bold shadow-sm transition-all focus:border-success focus:outline-none focus:ring-4 focus:ring-success/15"
              />
            </div>
            <select 
              className="h-11 rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-success focus:outline-none focus:ring-4 focus:ring-success/15 cursor-pointer"
              value={filterGrade}
              onChange={e => setFilterGrade(e.target.value)}
            >
              <option value="">كل الصفوف</option>
              {uniqueGrades.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select 
              className="h-11 rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-success focus:outline-none focus:ring-4 focus:ring-success/15 cursor-pointer disabled:opacity-50"
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
                className="h-11 rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-success focus:outline-none focus:ring-4 focus:ring-success/15 cursor-pointer" 
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                title="من تاريخ"
              />
            </div>
            <div className="flex flex-col">
              <input 
                type="date" 
                className="h-11 rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-success focus:outline-none focus:ring-4 focus:ring-success/15 cursor-pointer" 
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                title="إلى تاريخ"
              />
            </div>
          </div>
        </div>

        <PageCard>
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
            <Star className="h-5 w-5 text-warning" />
            <h2 className="text-lg font-bold">سجل المكافآت ونقاط التميز ({getStageLabel(stage)})</h2>
          </div>
          <DataTable
            rows={filtered}
            columns={[
              { key: "id", header: "الرقم", cell: (r) => <span className="font-bold tabular-nums text-muted-foreground">{r.id}</span> },
              { key: "date", header: "التاريخ", cell: (r) => <span className="tabular-nums font-medium">{r.date}</span> },
              { key: "student", header: "اسم الطالب", cell: (r) => <span className="font-bold text-foreground">{r.studentName}</span> },
              { key: "category", header: "سبب التميز", cell: (r) => r.categoryName },
              { 
                key: "points", 
                header: "النقاط المكتسبة", 
                cell: (r) => (
                  <span className="font-black text-lg tabular-nums text-success">
                    +{r.points}
                  </span>
                ) 
              },
            ]}
            empty={`لا توجد مكافآت مسجلة مطابقة لخيارات الفلترة.`}
          />
        </PageCard>
      </div>

      {/* Add Merit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 my-8">
            <div className="p-6 border-b border-border/50 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-success/15 text-success flex items-center justify-center shadow-inner border border-success/20">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">منح نقاط مكافأة / تميز</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">تسجيل سلوك إيجابي وتعزيز تميز الطالب ({getStageLabel(stage)})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); reset(); }}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[calc(85vh-140px)] overflow-y-auto custom-scrollbar-modal p-6">
              <form id="merit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                
                <div className="space-y-2.5">
                  <ModalStudentGradeSectionFilter
                    grades={uniqueGrades}
                    selectedGrade={modalGrade}
                    onSelectGrade={setModalGrade}
                    sections={activeStageSections}
                    selectedSectionId={modalSection}
                    onSelectSectionId={setModalSection}
                    onReset={() => { setModalGrade(""); setModalSection(""); }}
                  />

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">
                      اسم الطالب المتميز ({getStageLabel(stage)}) <span className="text-destructive">*</span>
                      {modalGrade && <span className="text-success mr-1">({modalStudentOptions.length} طالب مطابق)</span>}
                    </label>
                    <Controller
                      name="studentId"
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          value={field.value}
                          onChange={field.onChange}
                          options={modalStudentOptions}
                          placeholder={modalGrade ? `-- اختر الطالب من ${modalGrade} --` : "-- ابحث بالاسم أو اختر الطالب --"}
                          searchPlaceholder="ابحث باسم الطالب أو رقمه..."
                        />
                      )}
                    />
                    {errors.studentId && <p className="text-xs font-bold text-destructive">{errors.studentId.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">سبب التميز أو المكافأة <span className="text-destructive">*</span></label>
                  <select
                    {...register("categoryId")}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-success focus:outline-none focus:ring-4 focus:ring-success/15 cursor-pointer"
                  >
                    <option value="">-- اختر نوع التميز أو المكافأة --</option>
                    {allDisciplineCategories.filter(c => c.defaultPoints > 0).map(c => (
                      <option key={c.id} value={c.id}>{c.name} (+{c.defaultPoints} نقطة)</option>
                    ))}
                  </select>
                  {errors.categoryId && <p className="text-xs font-bold text-destructive">{errors.categoryId.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">تفاصيل إضافية حول التميز (اختياري)</label>
                  <textarea
                    {...register("description")}
                    className="w-full rounded-xl border border-border/80 bg-background/80 p-3.5 text-sm font-medium shadow-sm transition-all focus:border-success focus:outline-none focus:ring-4 focus:ring-success/15 resize-none custom-scrollbar-modal"
                    rows={3}
                    placeholder="ملاحظات تفصيلية أو إشادة خاصة حول الموقف الإيجابي..."
                  />
                  {errors.description && <p className="text-xs font-bold text-destructive">{errors.description.message}</p>}
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-border/50 flex justify-end gap-2.5 bg-muted/10">
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); reset(); }}
                className="rounded-xl px-5 py-2.5 text-sm font-bold border border-border/80 hover:bg-accent transition-colors active:scale-[0.98]"
              >
                إلغاء
              </button>
              <button
                form="merit-form"
                type="submit"
                className="rounded-xl bg-success px-6 py-2.5 text-sm font-bold text-success-foreground hover:bg-success/90 transition-all shadow-md shadow-success/20 active:scale-[0.98]"
              >
                منح المكافأة
              </button>
            </div>
          </div>
        </div>
      )}

      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title={`سجل المكافآت ونقاط التميز - ${getStageLabel(stage)}`}
        data={filtered}
        templates={printTemplates} 
      />
    </AppShell>
  );
}
