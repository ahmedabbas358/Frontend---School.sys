import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Stethoscope, Plus, Search, Filter, Printer, ChevronDown } from "lucide-react";
import { useState, useMemo } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/clinic/visits")({
  component: ClinicVisits,
});

const visitSchema = z.object({
  studentId: z.string().min(1, "الرجاء اختيار الطالب المريض"),
  symptoms: z.string().min(3, "يجب وصف الأعراض"),
  diagnosis: z.string().min(3, "يجب كتابة التشخيص المبدئي"),
  actionTaken: z.string().min(3, "يجب ذكر الإجراء المتخذ"),
});

type VisitForm = z.infer<typeof visitSchema>;

function ClinicVisits() {
  const { activeStageClinicVisits, activeStageStudents, addClinicVisit } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  const [q, setQ] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const printTemplates: PrintTemplate[] = [
    {
      id: "clinic_visits",
      name: "سجل زيارات العيادة",
      category: "العيادة المدرسية",
      type: "table",
      columns: [
        { key: "id", label: "رقم الزيارة" },
        { key: "date", label: "التاريخ" },
        { key: "studentName", label: "اسم الطالب" },
        { key: "symptoms", label: "الأعراض" },
        { key: "diagnosis", label: "التشخيص" },
        { key: "actionTaken", label: "الإجراء المتخذ" },
      ]
    }
  ];

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<VisitForm>({
    resolver: zodResolver(visitSchema),
  });

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return activeStageStudents;
    return activeStageStudents.filter(s => s.name.includes(studentSearch) || s.id.includes(studentSearch));
  }, [studentSearch, activeStageStudents]);
  
  const selectedStudentId = watch("studentId");
  const selectedStudent = activeStageStudents.find(s => s.id === selectedStudentId);

  const onSubmit = (data: VisitForm) => {
    addClinicVisit({
      ...data,
      date: new Date().toISOString().split("T")[0],
    });
    toast.success("تم تسجيل الزيارة الطبية بنجاح");
    setIsModalOpen(false);
    reset();
  };

  const filtered = useMemo(() => {
    return activeStageClinicVisits.filter((v) => {
      if (q && !v.studentName.includes(q) && !v.id.includes(q)) return false;
      return true;
    });
  }, [q, activeStageClinicVisits]);

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "العيادة المدرسية" },
        { label: "سجل الزيارات الطبية" },
      ]}
      actions={
        <div className="flex gap-2">
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-card border border-border px-3 text-sm font-bold hover:bg-accent"
          >
            <Printer className="h-4 w-4" /> طباعة السجل
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> تسجيل مريض
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        
        {/* Add Visit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
            <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-foreground">تسجيل مراجعة للعيادة</h3>
                    <p className="text-xs text-muted-foreground">توثيق الفحص والتشخيص والإجراء العلاجي</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setIsModalOpen(false); reset(); }} 
                  className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                >
                  <span className="font-bold text-lg leading-none">&times;</span>
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">اسم الطالب ({getStageLabel(stage)}) <span className="text-destructive">*</span></label>
                  
                  <div className="relative">
                    <div 
                      className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold cursor-pointer hover:border-primary/50 transition-all focus:ring-4 focus:ring-primary/15"
                      onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
                    >
                      <span className={selectedStudentId ? "text-foreground font-bold" : "text-muted-foreground"}>
                        {selectedStudent ? `${selectedStudent.id} - ${selectedStudent.name}` : "-- اختر الطالب --"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    {isStudentDropdownOpen && (
                      <div className="absolute top-full start-0 end-0 z-50 mt-1.5 max-h-60 overflow-y-auto custom-scrollbar-modal rounded-2xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl shadow-2xl p-2 animate-in zoom-in-95 duration-100">
                        <div className="sticky top-0 bg-card/95 backdrop-blur-md p-1 pb-2">
                          <div className="relative">
                            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <input 
                              autoFocus
                              value={studentSearch}
                              onChange={(e) => setStudentSearch(e.target.value)}
                              placeholder="ابحث بالاسم أو الرقم..."
                              className="h-9 w-full rounded-xl border border-input bg-background/80 ps-8 pe-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                        <div className="mt-1 space-y-1">
                          {filteredStudents.length === 0 ? (
                            <div className="p-3 text-center text-xs text-muted-foreground">لا توجد نتائج</div>
                          ) : (
                            filteredStudents.map(st => (
                              <div 
                                key={st.id} 
                                className="cursor-pointer rounded-xl px-3 py-2 text-xs hover:bg-accent hover:text-accent-foreground transition-all"
                                onClick={() => {
                                  setValue("studentId", st.id, { shouldValidate: true });
                                  setStudentSearch("");
                                  setIsStudentDropdownOpen(false);
                                }}
                              >
                                <div className="font-bold text-foreground">{st.name}</div>
                                <div className="text-[11px] text-muted-foreground">{st.id}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {errors.studentId && <p className="mt-1 text-xs text-destructive font-bold">{errors.studentId.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">الأعراض الظاهرة <span className="text-destructive">*</span></label>
                  <input
                    {...register("symptoms")}
                    className="h-11 w-full rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60"
                    placeholder="مثال: صداع، ارتفاع حرارة، إجهاد..."
                  />
                  {errors.symptoms && <p className="mt-1 text-xs text-destructive font-bold">{errors.symptoms.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">التشخيص المبدئي <span className="text-destructive">*</span></label>
                  <input
                    {...register("diagnosis")}
                    placeholder="مثال: اشتباه إنفلونزا موسمية..."
                    className="h-11 w-full rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60"
                  />
                  {errors.diagnosis && <p className="mt-1 text-xs text-destructive font-bold">{errors.diagnosis.message}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">الإجراء المتخذ <span className="text-destructive">*</span></label>
                  <textarea
                    {...register("actionTaken")}
                    className="w-full rounded-xl border border-input bg-background/80 p-3.5 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all resize-none custom-scrollbar placeholder:text-muted-foreground/60"
                    rows={3}
                    placeholder="تم إعطاء خافض للحرارة والتواصل مع ولي الأمر للمتابعة..."
                  />
                  {errors.actionTaken && <p className="mt-1 text-xs text-destructive font-bold">{errors.actionTaken.message}</p>}
                </div>

                <div className="pt-4 flex justify-end gap-2.5 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); reset(); }}
                    className="h-11 px-5 rounded-xl border border-input bg-background/80 hover:bg-accent text-xs font-semibold active:scale-[0.98] transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="h-11 px-6 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md glow-primary"
                  >
                    حفظ الزيارة الطبية
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="البحث باسم الطالب أو رقم الزيارة..."
                className="h-11 w-full rounded-xl border border-input bg-background/80 ps-9 pe-3 text-xs font-semibold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs placeholder:text-muted-foreground/60"
              />
            </div>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-input bg-background/80 px-4 text-xs font-semibold hover:bg-accent active:scale-[0.98] transition-all">
              <Filter className="h-4 w-4" /> تصفية
            </button>
          </div>
        </div>

        <PageCard>
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
            <Stethoscope className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">سجل العيادة المدرسية ({getStageLabel(stage)})</h2>
          </div>
          <DataTable
            rows={filtered}
            columns={[
              { key: "id", header: "رقم الزيارة", cell: (r) => <span className="font-bold">{r.id}</span> },
              { key: "date", header: "التاريخ", cell: (r) => r.date },
              { key: "student", header: "اسم الطالب", cell: (r) => <span className="font-bold text-primary">{r.studentName}</span> },
              { key: "symptoms", header: "الأعراض", cell: (r) => r.symptoms },
              { key: "diagnosis", header: "التشخيص", cell: (r) => r.diagnosis },
              { key: "action", header: "الإجراء المتخذ", cell: (r) => r.actionTaken },
            ]}
            empty={`لا توجد زيارات طبية مسجلة لمرحلة ${getStageLabel(stage)}.`}
          />
        </PageCard>
      </div>

      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="سجل زيارات العيادة المدرسية"
        subtitle={`للمرحلة: ${getStageLabel(stage)}`}
        data={filtered}
        templates={printTemplates}
      />
    </AppShell>
  );
}
