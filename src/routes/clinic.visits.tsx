import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { 
  Stethoscope, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  ChevronDown, 
  HeartPulse, 
  AlertTriangle, 
  CheckCircle2, 
  FileSpreadsheet, 
  FileText, 
  X, 
  Clock, 
  ShieldAlert,
  Thermometer,
  User
} from "lucide-react";
import { useState, useMemo } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/clinic/visits")({
  head: () => ({ meta: [{ title: "العيادة المدرسية والرعاية الصحية | منصة مدارس" }] }),
  component: ClinicVisits,
});

const visitSchema = z.object({
  studentId: z.string().min(1, "الرجاء اختيار الطالب المريض"),
  symptoms: z.string().min(3, "يجب وصف الأعراض الظاهرة"),
  diagnosis: z.string().min(3, "يجب كتابة التشخيص المبدئي"),
  actionTaken: z.string().min(3, "يجب ذكر الإجراء المتخذ"),
  temperature: z.string().optional(),
  urgency: z.enum(["normal", "urgent", "emergency"]),
});

type VisitForm = z.infer<typeof visitSchema>;

function ClinicVisits() {
  const { activeStageClinicVisits, activeStageStudents, addClinicVisit, addActivityLog } = useGlobalStore();
  const { stage, getStageLabel } = useStage();

  const [q, setQ] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Referral / Details slip modal
  const [referralVisit, setReferralVisit] = useState<any | null>(null);

  const printTemplates: PrintTemplate[] = [
    {
      id: "clinic_visits",
      name: "سجل زيارات العيادة المدرسية",
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
    resolver: zodResolver(visitSchema) as any,
    defaultValues: {
      studentId: "",
      symptoms: "",
      diagnosis: "",
      actionTaken: "",
      urgency: "normal",
      temperature: "37.0",
    }
  });

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return activeStageStudents;
    return activeStageStudents.filter(s => s.name.includes(studentSearch) || s.id.includes(studentSearch));
  }, [studentSearch, activeStageStudents]);
  
  const selectedStudentId = watch("studentId");
  const selectedStudent = activeStageStudents.find(s => s.id === selectedStudentId);

  // Clinic Statistics
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayVisits = activeStageClinicVisits.filter(v => v.date === today).length;
    const totalVisits = activeStageClinicVisits.length;
    const commonDiagnoses = new Set(activeStageClinicVisits.map(v => v.diagnosis)).size;
    return { todayVisits, totalVisits, commonDiagnoses };
  }, [activeStageClinicVisits]);

  const onSubmit = (data: VisitForm) => {
    const currentStudent = activeStageStudents.find(s => s.id === data.studentId);
    const dateNow = new Date().toISOString().split("T")[0];

    addClinicVisit({
      studentId: data.studentId,
      studentName: currentStudent?.name || "طالب غير معروف",
      symptoms: data.symptoms,
      diagnosis: `${data.diagnosis}${data.temperature ? ` (حرارة: ${data.temperature}°C)` : ''}`,
      actionTaken: data.actionTaken,
      date: dateNow,
    });

    addActivityLog({
      user: "مسؤول العيادة",
      action: "تسجيل زيارة عيادة",
      entity: "العيادة المدرسية",
      details: `تسجيل مراجعة عيادة للطالب (${currentStudent?.name || data.studentId}) - التشخيص: ${data.diagnosis}`,
      category: "facilities",
    });

    toast.success("تم تسجيل الزيارة الطبية في ملف الطالب بنجاح");
    setIsModalOpen(false);
    reset();
  };

  const filtered = useMemo(() => {
    return activeStageClinicVisits.filter((v) => {
      if (q && !v.studentName.includes(q) && !v.id.includes(q) && !v.diagnosis.includes(q)) return false;
      return true;
    });
  }, [q, activeStageClinicVisits]);

  // CSV Export
  const exportClinicCsv = () => {
    const headers = ["رقم الزيارة", "التاريخ", "اسم الطالب", "الأعراض", "التشخيص", "الإجراء المتخذ"];
    const rows = filtered.map(v => [
      `"${v.id}"`,
      `"${v.date}"`,
      `"${v.studentName}"`,
      `"${v.symptoms}"`,
      `"${v.diagnosis}"`,
      `"${v.actionTaken}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `سجل_العيادة_الطبية_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير سجل العيادة الطبية بنجاح");
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المرافق والخدمات" },
        { label: "العيادة المدرسية والرعاية الصحية" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={exportClinicCsv}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> تصدير CSV
          </button>
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
          >
            <Printer className="h-4 w-4 text-primary" /> طباعة السجل
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
          >
            <Plus className="h-4 w-4" /> تسجيل حالة جديدة
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">إجمالي الحالات المسجلة</span>
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <HeartPulse className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black tabular-nums">{stats.totalVisits}</div>
            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">لمرحلة {getStageLabel(stage)}</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">مراجعات اليوم</span>
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 grid place-items-center">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-amber-600 tabular-nums">{stats.todayVisits}</div>
            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">تلقوا رعاية بالعيادة اليوم</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">حالة الجاهزية والخدمة</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600">نشطة 100%</div>
            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">الإسعافات والمشرف الصحي متاح</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="البحث باسم الطالب أو رقم الزيارة أو التشخيص..."
                className="h-10 w-full rounded-xl border border-border/80 bg-background/80 ps-9 pe-3 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
              />
            </div>
            <button 
              onClick={() => setQ("")}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-4 text-xs font-bold hover:bg-muted active:scale-[0.98] transition-all"
            >
              إعادة ضبط
            </button>
          </div>
        </div>

        {/* DataTable */}
        <PageCard>
          <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <h2 className="text-base font-black text-foreground">
                سجل المراجعات والزيارات الصحية ({getStageLabel(stage)})
              </h2>
            </div>
          </div>

          <DataTable
            rows={filtered}
            columns={[
              { 
                key: "id", 
                header: "رقم الزيارة", 
                cell: (r) => <span className="font-mono text-xs font-bold text-muted-foreground">{r.id}</span> 
              },
              { 
                key: "date", 
                header: "التاريخ", 
                cell: (r) => <span className="tabular-nums text-xs font-bold">{r.date}</span> 
              },
              { 
                key: "student", 
                header: "اسم الطالب", 
                cell: (r) => (
                  <div className="font-bold text-foreground">
                    <span className="text-primary">{r.studentName}</span>
                    <div className="text-[11px] text-muted-foreground font-mono">كود: {r.studentId}</div>
                  </div>
                ) 
              },
              { 
                key: "symptoms", 
                header: "الأعراض المشكو منها", 
                cell: (r) => <span className="text-xs font-medium">{r.symptoms}</span> 
              },
              { 
                key: "diagnosis", 
                header: "التشخيص الطبي", 
                cell: (r) => <span className="text-xs font-bold text-foreground">{r.diagnosis}</span> 
              },
              { 
                key: "action", 
                header: "الإجراء المتخذ", 
                cell: (r) => <span className="text-xs font-medium">{r.actionTaken}</span> 
              },
              {
                key: "actions",
                header: "",
                cell: (r) => (
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setReferralVisit(r)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      title="طباعة إشعار إحالة طبية رسمي"
                    >
                      <FileText className="h-3.5 w-3.5" /> إشعار طبي
                    </button>
                  </div>
                )
              }
            ]}
            empty={`لا توجد زيارات طبية مسجلة لمرحلة ${getStageLabel(stage)}.`}
          />
        </PageCard>
      </div>

      {/* ADD VISIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 my-8 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/50 bg-gradient-to-r from-card via-card/95 to-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-inner border border-primary/20">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">تسجيل مراجعة عيادة جديدة</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">توثيق الفحص السريري والإجراء العلاجي للطلاب</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); reset(); }}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* Student Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">الطالب المراجع ({getStageLabel(stage)}) <span className="text-destructive">*</span></label>
                
                <div className="relative">
                  <div 
                    className="flex h-11 w-full items-center justify-between rounded-xl border border-border/80 bg-background/80 px-3.5 text-xs font-bold cursor-pointer hover:border-primary/50 transition-all focus:ring-4 focus:ring-primary/15"
                    onClick={() => setIsStudentDropdownOpen(!isStudentDropdownOpen)}
                  >
                    <span className={selectedStudentId ? "text-foreground font-black" : "text-muted-foreground"}>
                      {selectedStudent ? `${selectedStudent.id} - ${selectedStudent.name} (${selectedStudent.grade})` : "-- اختر الطالب --"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  {isStudentDropdownOpen && (
                    <div className="absolute top-full start-0 end-0 z-50 mt-1.5 max-h-60 overflow-y-auto custom-scrollbar-modal rounded-2xl border border-border/80 bg-card/98 backdrop-blur-2xl shadow-2xl p-2 animate-in zoom-in-95 duration-100">
                      <div className="sticky top-0 bg-card/95 backdrop-blur-md p-1 pb-2">
                        <div className="relative">
                          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <input 
                            autoFocus
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            placeholder="ابحث بالاسم أو الرقم..."
                            className="h-9 w-full rounded-xl border border-border/80 bg-background/80 ps-8 pe-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="mt-1 space-y-1">
                        {filteredStudents.length === 0 ? (
                          <div className="p-3 text-center text-xs text-muted-foreground">لا توجد نتائج مطابقة</div>
                        ) : (
                          filteredStudents.map(st => (
                            <div 
                              key={st.id} 
                              className="cursor-pointer rounded-xl px-3 py-2 text-xs hover:bg-accent transition-all flex items-center justify-between"
                              onClick={() => {
                                setValue("studentId", st.id, { shouldValidate: true });
                                setStudentSearch("");
                                setIsStudentDropdownOpen(false);
                              }}
                            >
                              <div className="font-bold text-foreground">{st.name}</div>
                              <span className="text-[11px] font-mono text-muted-foreground">{st.grade} • {st.id}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {errors.studentId && <p className="text-xs text-destructive font-bold">{errors.studentId.message}</p>}
              </div>

              {/* Temperature and Urgency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <Thermometer className="h-3.5 w-3.5 text-amber-500" /> درجة الحرارة (°C)
                  </label>
                  <input
                    {...register("temperature")}
                    placeholder="مثال: 37.2"
                    className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 tabular-nums"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">درجة خطورة الحالة</label>
                  <select
                    {...register("urgency")}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer"
                  >
                    <option value="normal">🟢 حالة عادية / بسيطة</option>
                    <option value="urgent">🟡 متوسطة تتطلب إشعار ولي الأمر</option>
                    <option value="emergency">🔴 طارئة / تحويل مستشفى</option>
                  </select>
                </div>
              </div>

              {/* Symptoms */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">الأعراض الظاهرة <span className="text-destructive">*</span></label>
                <input
                  {...register("symptoms")}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                  placeholder="مثال: صداع، مغص، ارتفاع حرارة، إجهاد، دوخة..."
                />
                {errors.symptoms && <p className="text-xs text-destructive font-bold">{errors.symptoms.message}</p>}
              </div>

              {/* Diagnosis */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">التشخيص الطبي المبدئي <span className="text-destructive">*</span></label>
                <input
                  {...register("diagnosis")}
                  placeholder="مثال: نزلة برد، هبوط ضغط بسيط، جفاف خفيف..."
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                />
                {errors.diagnosis && <p className="text-xs text-destructive font-bold">{errors.diagnosis.message}</p>}
              </div>

              {/* Action Taken */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">الإجراء والعلاج المتخذ <span className="text-destructive">*</span></label>
                <textarea
                  {...register("actionTaken")}
                  className="w-full rounded-xl border border-border/80 bg-background/80 p-3 text-xs font-medium shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 resize-none"
                  rows={3}
                  placeholder="تم إعطاء خافض حرارة، الراحة لمدة 20 دقيقة، وإشعار ولي الأمر..."
                />
                {errors.actionTaken && <p className="text-xs text-destructive font-bold">{errors.actionTaken.message}</p>}
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); reset(); }}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border/80 hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-6 py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-[0.98]"
                >
                  حفظ الزيارة الطبية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REFERRAL / EMERGENCY SLIP MODAL */}
      {referralVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 my-8 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/50 bg-gradient-to-r from-card via-card/95 to-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-inner border border-primary/20">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">إشعار إحالة طبية رسمي</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">سند فحص صادر من العيادة المدرسية</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReferralVisit(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl border border-border/80 bg-muted/20 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رقم القيد:</span>
                  <span className="font-mono font-bold">{referralVisit.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">اسم الطالب:</span>
                  <span className="font-bold text-foreground">{referralVisit.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ المراجعة:</span>
                  <span className="font-bold tabular-nums">{referralVisit.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الأعراض:</span>
                  <span className="font-bold text-foreground">{referralVisit.symptoms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">التشخيص المبدئي:</span>
                  <span className="font-black text-primary">{referralVisit.diagnosis}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الإجراء المتخذ:</span>
                  <span className="font-bold text-foreground">{referralVisit.actionTaken}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-800 dark:text-amber-300">
                ملاحظة لولي الأمر / الطبيب المعالج: يرجى مراجعة المركز الطبي المختص وإعادة هذا الإشعار بعد توقيع الطبيب.
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReferralVisit(null)}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border/80 hover:bg-accent transition-colors"
                >
                  إغلاق
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="rounded-xl bg-primary px-6 py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-[0.98] flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" /> طباعة الإشعار
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
