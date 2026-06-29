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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-bold">تسجيل مراجعة للعيادة المدرسية</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                
                <div>
                  <label className="mb-1 block text-sm font-medium">اسم الطالب ({getStageLabel(stage)}) <span className="text-danger">*</span></label>
                  
                    <div className="relative">
                      <div 
                        className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-sm cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
                      >
                        <span className={selectedStudentId ? "text-foreground font-bold" : "text-muted-foreground"}>
                          {selectedStudent ? `${selectedStudent.id} - ${selectedStudent.name}` : "-- اختر الطالب --"}
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      {isStudentDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg p-1">
                          <div className="sticky top-0 bg-popover p-2 pb-1">
                            <div className="relative">
                              <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                              <input 
                                autoFocus
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                placeholder="ابحث بالاسم أو الرقم..."
                                className="h-8 w-full rounded-md border border-input bg-background pr-7 pl-3 text-xs outline-none focus:ring-1 focus:ring-primary"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          <div className="mt-1">
                            {filteredStudents.length === 0 ? (
                              <div className="p-3 text-center text-xs text-muted-foreground">لا توجد نتائج</div>
                            ) : (
                              filteredStudents.map(st => (
                                <div 
                                  key={st.id} 
                                  className="cursor-pointer rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                  onClick={() => {
                                    setValue("studentId", st.id, { shouldValidate: true });
                                    setStudentSearch("");
                                    setIsStudentDropdownOpen(false);
                                  }}
                                >
                                  <div className="font-bold">{st.name}</div>
                                  <div className="text-xs text-muted-foreground">{st.id}</div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                  {errors.studentId && <p className="mt-1 text-xs text-danger">{errors.studentId.message}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">الأعراض الظاهرة <span className="text-danger">*</span></label>
                  <input
                    {...register("symptoms")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                    placeholder="مثال: صداع، ارتفاع حرارة..."
                  />
                  {errors.symptoms && <p className="mt-1 text-xs text-danger">{errors.symptoms.message}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">التشخيص المبدئي <span className="text-danger">*</span></label>
                  <input
                    {...register("diagnosis")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                  />
                  {errors.diagnosis && <p className="mt-1 text-xs text-danger">{errors.diagnosis.message}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">الإجراء المتخذ <span className="text-danger">*</span></label>
                  <textarea
                    {...register("actionTaken")}
                    className="w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:border-ring"
                    rows={3}
                    placeholder="تم إعطاء خافض للحرارة والتواصل مع ولي الأمر..."
                  />
                  {errors.actionTaken && <p className="mt-1 text-xs text-danger">{errors.actionTaken.message}</p>}
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
                    حفظ الزيارة الطبية
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
                placeholder="البحث باسم الطالب أو رقم الزيارة..."
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
