import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { ArabicDatePicker } from "@/components/ui/arabic-date-picker";
import { useGlobalStore, Exam, ExamSubject } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage } from "@/lib/school-structure";
import { 
  CalendarDays, 
  Plus, 
  Trash2, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Edit3, 
  Building2, 
  BookOpen, 
  Layers, 
  Sparkles,
  Info,
  Calendar,
  Eye,
  FileText,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/exams/")({
  component: ExamsPlanningPage,
  head: () => ({ meta: [{ title: "الجدولة والتخطيط للاختبارات" }] })
});

// Helper: Calculate end time given start time "HH:MM" and duration in minutes
function calculateEndTime(startTime: string = "08:00", durationMinutes: number = 90): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return startTime;
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

// Helper: Get Arabic Day name from date string YYYY-MM-DD
function getArabicDayName(dateStr: string): string {
  if (!dateStr) return "";
  const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return days[d.getDay()];
}

// Helper: Normalize Arabic grade names to guarantee robust matching
function normalizeGrade(g: string = ""): string {
  return g.replace(/الابتدائي|المتوسط|الثانوي/g, "").replace(/\s+/g, " ").trim();
}

function ExamsPlanningPage() {
  const [activeTab, setActiveTab] = useState<"periods" | "registry" | "schedule" | "timetable">("periods");
  const [drilldownGrade, setDrilldownGrade] = useState<string>("");
  const [drilldownSectionId, setDrilldownSectionId] = useState<string>("");
  const [drilldownExamId, setDrilldownExamId] = useState<string>("");
  const [drilldownMode, setDrilldownMode] = useState<"student" | "admin">("student");

  const { resetExamDataToDefaults } = useGlobalStore();

  const handleSelectClassForSchedule = (grade: string, sectionId?: string) => {
    setDrilldownGrade(grade);
    setDrilldownSectionId(sectionId || "");
    setActiveTab("schedule");
  };

  const handleSelectClassForPrint = (examId: string, grade: string, sectionId?: string, mode?: "student" | "admin") => {
    setDrilldownExamId(examId);
    setDrilldownGrade(grade);
    setDrilldownSectionId(sectionId || "");
    if (mode) setDrilldownMode(mode);
    setActiveTab("timetable");
  };

  return (
    <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الاختبارات", to: "/exams" }, { label: "الجدولة والتخطيط" }]}>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
        {/* Navigation Tabs and Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-2">
          <div className="flex gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab("periods")}
              className={`pb-2 px-3 font-bold text-sm sm:text-base transition-all border-b-2 flex items-center gap-2 shrink-0 ${activeTab === "periods" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <CalendarDays className="w-4 h-4" /> فترات الاختبارات
            </button>
            <button 
              onClick={() => setActiveTab("registry")}
              className={`pb-2 px-3 font-bold text-sm sm:text-base transition-all border-b-2 flex items-center gap-2 shrink-0 ${activeTab === "registry" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <Layers className="w-4 h-4" /> سجل جداول الفصول والشعب
            </button>
            <button 
              onClick={() => setActiveTab("schedule")}
              className={`pb-2 px-3 font-bold text-sm sm:text-base transition-all border-b-2 flex items-center gap-2 shrink-0 ${activeTab === "schedule" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <Clock className="w-4 h-4" /> جدولة المواد والقاعات
            </button>
            <button 
              onClick={() => setActiveTab("timetable")}
              className={`pb-2 px-3 font-bold text-sm sm:text-base transition-all border-b-2 flex items-center gap-2 shrink-0 ${activeTab === "timetable" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <Printer className="w-4 h-4" /> جداول الطباعة المخصصة
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (confirm("هل تود توليد واستعادة جداول الاختبارات وفترات الامتحانات النموذجية لجميع المراحل والفصول؟")) {
                resetExamDataToDefaults();
                toast.success("تم توليد واستعادة جداول الاختبارات النموذجية بنجاح!");
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary font-black text-xs hover:bg-primary/20 transition-all shadow-sm shrink-0 self-start sm:self-auto active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>توليد الجداول والبيانات النموذجية</span>
          </button>
        </div>

        {activeTab === "periods" && <ExamsPeriodView />}
        {activeTab === "registry" && (
          <ClassTimetablesRegistryView 
            onSelectClassForSchedule={handleSelectClassForSchedule} 
            onSelectClassForPrint={handleSelectClassForPrint} 
          />
        )}
        {activeTab === "schedule" && (
          <ExamSubjectsScheduleView 
            initialGradeFilter={drilldownGrade} 
            initialSectionFilter={drilldownSectionId} 
          />
        )}
        {activeTab === "timetable" && (
          <ExamTimetableView 
            initialExamId={drilldownExamId} 
            initialGrade={drilldownGrade} 
            initialSectionId={drilldownSectionId} 
            initialMode={drilldownMode} 
          />
        )}
      </div>
    </AppShell>
  );
}

// ==========================================
// 1. Exam Periods View (Top level Exam entity)
// ==========================================
function ExamsPeriodView() {
  const { currentAcademicYearId, activeStageExams, addExam, updateExam, deleteExam, resetExamDataToDefaults } = useGlobalStore();
  const { stage } = useStage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Exam>>({
    name: "",
    term: "الفصل الأول",
    type: "midterm",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: "upcoming",
    gradingSystem: "marks",
    weight: 100,
    stage: "all"
  });

  const openAddModal = () => {
    setEditingExamId(null);
    setFormData({
      name: "",
      term: "الفصل الأول",
      type: "midterm",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      status: "upcoming",
      gradingSystem: "marks",
      weight: 100,
      stage: stage
    });
    setIsModalOpen(true);
  };

  const openEditModal = (exam: Exam) => {
    setEditingExamId(exam.id);
    setFormData({ ...exam });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.startDate || !formData.endDate) {
      toast.error("الرجاء إكمال الحقول المطلوبة");
      return;
    }

    try {
      if (editingExamId) {
        updateExam(editingExamId, formData);
        toast.success("تم تحديث فترة الاختبار بنجاح");
      } else {
        addExam({
          ...formData as Omit<Exam, "id">,
          academicYearId: currentAcademicYearId || "AY-2024-2025"
        });
        toast.success("تم إضافة فترة الاختبار بنجاح");
      }
      setIsModalOpen(false);
      setEditingExamId(null);
    } catch (error) {
      toast.error("حدث خطأ أثناء الحفظ");
    }
  };

  // KPIs
  const totalExams = (activeStageExams || []).length;
  const ongoingExams = (activeStageExams || []).filter(e => e.status === "ongoing").length;
  const gradingExams = (activeStageExams || []).filter(e => e.status === "grading").length;
  const completedExams = (activeStageExams || []).filter(e => e.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-3 rounded-xl shrink-0"><CalendarDays className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-bold">إجمالي الفترات</p>
            <p className="text-2xl font-black">{totalExams}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm flex items-center gap-3">
          <div className="bg-emerald-500/10 text-emerald-600 p-3 rounded-xl shrink-0"><Clock className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-bold">جارية الآن</p>
            <p className="text-2xl font-black text-emerald-600">{ongoingExams}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm flex items-center gap-3">
          <div className="bg-amber-500/10 text-amber-600 p-3 rounded-xl shrink-0"><Edit3 className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-bold">مرحلة الرصد والتصحيح</p>
            <p className="text-2xl font-black text-amber-600">{gradingExams}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm flex items-center gap-3">
          <div className="bg-blue-500/10 text-blue-600 p-3 rounded-xl shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-bold">معتمدة ومكتملة</p>
            <p className="text-2xl font-black text-blue-600">{completedExams}</p>
          </div>
        </div>
      </div>

      <PageCard
        title="فترات الاختبارات المعتمدة"
        description="إدارة فترات الاختبارات الكبرى (نصفي، نهائي، شهري، شامل) والتحكم في حالاتها ونظام التقييم"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (confirm("هل تود توليد واستعادة فترات وجداول الاختبارات النموذجية لجميع المراحل والفصول؟")) {
                  resetExamDataToDefaults();
                  toast.success("تم توليد واستعادة فترات وجداول الاختبارات بنجاح!");
                }
              }}
              className="inline-flex items-center gap-1.5 border border-primary/40 bg-primary/10 text-primary font-bold px-3 py-2 rounded-xl hover:bg-primary/20 transition-colors shadow-sm text-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>توليد الجداول النموذجية</span>
            </button>
            <button onClick={openAddModal} className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-sm text-sm">
              <Plus className="w-4 h-4" /> إضافة فترة اختبار
            </button>
          </div>
        }
      >
        {totalExams === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-primary/30 rounded-3xl p-6 bg-primary/5 space-y-3 mb-6">
            <CalendarDays className="w-10 h-10 text-primary mx-auto opacity-70" />
            <h3 className="text-base font-black text-foreground">لا توجد فترات اختبارات مسجلة حالياً</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              يمكنك البدء بإنشاء فترة يدوياً أو الضغط على زر توليد الجداول النموذجية لتعبئة كافة الاختبارات والمواد والقاعات بنقرة واحدة.
            </p>
            <button
              onClick={() => resetExamDataToDefaults()}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90 shadow-md inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>توليد الفترات والجداول النموذجية فوراً</span>
            </button>
          </div>
        )}
        <DataTable
          rows={activeStageExams || []}
          columns={[
            { 
              key: "name", 
              header: "اسم الاختبار", 
              cell: row => (
                <div>
                  <span className="font-black text-primary text-sm">{row.name}</span>
                  {row.gradingSystem && (
                    <span className="block text-[10px] text-muted-foreground mt-0.5">
                      نظام التقييم: {row.gradingSystem === "marks" ? "درجات رقمية" : row.gradingSystem === "descriptive" ? "تقييم وصفي" : "نسبة مئوية"}
                    </span>
                  )}
                </div>
              ) 
            },
            { key: "term", header: "الفصل الدراسي", cell: row => <span className="font-bold text-sm">{row.term}</span> },
            { 
              key: "type", 
              header: "النوع", 
              cell: row => {
                const map: Record<string, string> = {
                  final: "نهائي",
                  midterm: "نصفي",
                  monthly: "شهري",
                  quiz: "قصير",
                  integrated: "تقييم شامل"
                };
                return <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted text-foreground">{map[row.type] || row.type}</span>;
              } 
            },
            { 
              key: "dates", 
              header: "الفترة الزمنية", 
              cell: row => (
                <div className="text-xs font-bold tabular-nums text-muted-foreground" dir="ltr">
                  <span>{row.startDate}</span>
                  <span className="mx-1 text-primary">إلى</span>
                  <span>{row.endDate}</span>
                </div>
              ) 
            },
            { 
              key: "status", 
              header: "الحالة والمرحلة", 
              cell: row => {
                const colors: Record<string, string> = {
                  draft: "bg-muted text-muted-foreground border-border",
                  upcoming: "bg-blue-500/10 text-blue-600 border-blue-200",
                  ongoing: "bg-emerald-500/10 text-emerald-600 border-emerald-200 font-bold",
                  grading: "bg-amber-500/10 text-amber-600 border-amber-200 font-bold",
                  completed: "bg-purple-500/10 text-purple-600 border-purple-200 font-bold"
                };
                return (
                  <select 
                    className={`text-xs font-bold px-2.5 py-1 rounded-xl border cursor-pointer outline-none transition-all ${colors[row.status] || "bg-muted"}`}
                    value={row.status}
                    onChange={(e) => {
                      updateExam(row.id, { status: e.target.value as any });
                      toast.success(`تم تغيير حالة الاختبار إلى "${e.target.options[e.target.selectedIndex].text}"`);
                    }}
                  >
                    <option value="draft">مسودة 📝</option>
                    <option value="upcoming">قادم ⏳</option>
                    <option value="ongoing">جارٍ الآن 🟢</option>
                    <option value="grading">رصد الدرجات ✍️</option>
                    <option value="completed">معتمد ومكتمل ✅</option>
                  </select>
                );
              }
            },
            { 
              key: "actions", 
              header: "الإجراءات", 
              cell: row => (
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => openEditModal(row)} 
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                    title="تعديل الفترة"
                  >
                    <Edit3 className="w-4 h-4"/>
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف فترة الاختبار "${row.name}"؟`)) {
                        deleteExam(row.id);
                        toast.success("تم حذف فترة الاختبار");
                      }
                    }} 
                    className="p-2 text-danger/70 hover:text-danger hover:bg-danger/10 rounded-xl transition-colors"
                    title="حذف الفترة"
                  >
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              )
            }
          ]}
        />
      </PageCard>

      {/* Modal to Add/Edit Exam */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border/80 overflow-hidden p-6 sm:p-7 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-foreground">
                    {editingExamId ? "تعديل فترة الاختبار" : "إضافة فترة اختبار جديدة"}
                  </h2>
                  <p className="text-xs text-muted-foreground">تحديد موعد ونوع ونظام تقييم فترة الاختبارات</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              >
                <span className="font-bold text-lg leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4 pt-1">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground/85">اسم فترة الاختبار <span className="text-destructive">*</span></label>
                <input 
                  required 
                  value={formData.name || ""} 
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} 
                  placeholder="مثال: اختبارات منتصف الفصل الدراسي الأول" 
                  className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">الفصل الدراسي <span className="text-destructive">*</span></label>
                  <select 
                    required 
                    value={formData.term} 
                    onChange={e => setFormData(prev => ({ ...prev, term: e.target.value }))} 
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all cursor-pointer"
                  >
                    <option value="الفصل الأول">الفصل الأول</option>
                    <option value="الفصل الثاني">الفصل الثاني</option>
                    <option value="الفصل الثالث">الفصل الثالث</option>
                    <option value="سنوي">سنوي</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">نوع الاختبار <span className="text-destructive">*</span></label>
                  <select 
                    required 
                    value={formData.type} 
                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as any }))} 
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all cursor-pointer"
                  >
                    <option value="monthly">شهري</option>
                    <option value="midterm">نصفي</option>
                    <option value="final">نهائي</option>
                    <option value="quiz">قصير</option>
                    <option value="integrated">تقييم شامل</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <ArabicDatePicker
                    label="تاريخ البداية"
                    required
                    value={formData.startDate}
                    onChange={(val) => setFormData({ ...formData, startDate: val })}
                    showAgeCalculator={false}
                  />
                </div>
                <div>
                  <ArabicDatePicker
                    label="تاريخ النهاية"
                    required
                    value={formData.endDate}
                    onChange={(val) => setFormData({ ...formData, endDate: val })}
                    showAgeCalculator={false}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">نظام الرصد والتقييم</label>
                  <select 
                    value={formData.gradingSystem || "marks"} 
                    onChange={e => setFormData(prev => ({ ...prev, gradingSystem: e.target.value as any }))} 
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all cursor-pointer"
                  >
                    <option value="marks">درجات رقمية (أرقام)</option>
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="descriptive">تقييم وصفي (ممتاز، جيد جداً...)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">الحالة المبدئية</label>
                  <select 
                    value={formData.status || "upcoming"} 
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))} 
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all cursor-pointer"
                  >
                    <option value="draft">مسودة</option>
                    <option value="upcoming">قادم</option>
                    <option value="ongoing">جارٍ الآن</option>
                    <option value="grading">رصد وتصحيح</option>
                    <option value="completed">مكتمل ومعتمد</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2.5 border-t border-border/60">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="h-11 px-5 rounded-xl border border-input bg-background/80 hover:bg-accent text-xs font-semibold active:scale-[0.98] transition-all"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="h-11 px-7 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md"
                >
                  {editingExamId ? "حفظ التعديلات" : "حفظ الفترة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. Class Timetables Registry View (سجل جداول الفصول والشعب)
// ==========================================
function ClassTimetablesRegistryView({ onSelectClassForSchedule, onSelectClassForPrint }: {
  onSelectClassForSchedule: (grade: string, sectionId?: string) => void;
  onSelectClassForPrint: (examId: string, grade: string, sectionId?: string, mode?: "student" | "admin") => void;
}) {
  const { stage } = useStage();
  const { activeStageExams, activeStageExamSubjects, activeStageSubjects, activeStageSections } = useGlobalStore();
  const stageGrades = useMemo(() => getGradesForStage(stage), [stage]);

  const [selectedExamId, setSelectedExamId] = useState<string>(activeStageExams[0]?.id || "");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("");
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);
  const [batchPrintMode, setBatchPrintMode] = useState<"student" | "admin">("student");

  const currentExam = useMemo(() => {
    return activeStageExams.find(e => e.id === selectedExamId) || activeStageExams[0];
  }, [activeStageExams, selectedExamId]);

  // Registry entries for each grade and its sections
  const registryEntries = useMemo(() => {
    if (!currentExam) return [];
    const entries: {
      grade: string;
      sectionId?: string;
      sectionName?: string;
      subjectCount: number;
      startDate?: string;
      endDate?: string;
      rooms: string[];
      invigilators: string[];
      items: ExamSubject[];
      isComplete: boolean;
    }[] = [];

    const gradesToProcess = selectedGradeFilter ? [selectedGradeFilter] : stageGrades;

    gradesToProcess.forEach(gr => {
      const gradeSections = (activeStageSections || []).filter(s => s.grade === gr || normalizeGrade(s.grade) === normalizeGrade(gr));

      if (gradeSections.length === 0) {
        const items = (activeStageExamSubjects || []).filter(es => 
          es.examId === currentExam.id && 
          (es.grade === gr || normalizeGrade(es.grade) === normalizeGrade(gr))
        );
        const dates = items.map(i => i.date).filter(Boolean).sort();
        const rooms = Array.from(new Set(items.map(i => i.room).filter(Boolean))) as string[];
        const invigilators = Array.from(new Set(items.map(i => i.invigilator).filter(Boolean))) as string[];
        entries.push({
          grade: gr,
          subjectCount: items.length,
          startDate: dates[0],
          endDate: dates[dates.length - 1],
          rooms,
          invigilators,
          items,
          isComplete: items.length >= 4
        });
      } else {
        gradeSections.forEach(sec => {
          const items = (activeStageExamSubjects || []).filter(es => 
            es.examId === currentExam.id && 
            (es.grade === gr || normalizeGrade(es.grade) === normalizeGrade(gr)) && 
            (!es.sectionId || es.sectionId === sec.id)
          );
          const dates = items.map(i => i.date).filter(Boolean).sort();
          const rooms = Array.from(new Set(items.map(i => i.room).filter(Boolean))) as string[];
          const invigilators = Array.from(new Set(items.map(i => i.invigilator).filter(Boolean))) as string[];
          entries.push({
            grade: gr,
            sectionId: sec.id,
            sectionName: sec.name,
            subjectCount: items.length,
            startDate: dates[0],
            endDate: dates[dates.length - 1],
            rooms,
            invigilators,
            items,
            isComplete: items.length >= 4
          });
        });
      }
    });

    return entries;
  }, [currentExam, selectedGradeFilter, stageGrades, activeStageSections, activeStageExamSubjects]);

  // Batch Print Template that prints all classes together
  const batchPrintTemplate: PrintTemplate = {
    id: "batch_class_timetables",
    name: batchPrintMode === "student" ? "دفتر جداول الطلاب الشامل لجميع الفصول" : "ملف لجان الكنترول والمراقبة لجميع الفصول",
    category: "اختبارات",
    type: "document",
    renderDocument: () => (
      <div className="space-y-12 text-foreground p-4" dir="rtl">
        {registryEntries.map((entry, eIdx) => (
          <div key={eIdx} className="space-y-6 pb-8 border-b-2 border-dashed border-border/80 last:border-0">
            {/* Header */}
            <div className="text-center border-b-2 border-primary/30 pb-3 space-y-1">
              <p className="text-xs font-bold text-muted-foreground">الإدارة العامة للتعليم - مجمع مدارس المستقبل الأهلية</p>
              <h2 className="text-2xl font-black text-primary">
                {batchPrintMode === "student" ? "جدول اختبارات الطلاب المعتمد" : "كشف لجان الاختبارات وتوزيع المراقبين (إداري/كنترول)"}
              </h2>
              <p className="text-sm font-bold text-foreground">
                فترة: <span className="text-primary font-black">{currentExam?.name}</span> • الصف: <span className="text-primary font-black">{entry.grade}</span> {entry.sectionName ? `(شعبة ${entry.sectionName})` : ""}
              </p>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-foreground/20 text-xs">
              <thead>
                <tr className="bg-muted/60 text-foreground">
                  <th className="border border-foreground/20 p-2 text-center font-black">اليوم</th>
                  <th className="border border-foreground/20 p-2 text-center font-black">التاريخ</th>
                  <th className="border border-foreground/20 p-2 text-right font-black">المادة الدراسية</th>
                  <th className="border border-foreground/20 p-2 text-center font-black">التوقيت</th>
                  <th className="border border-foreground/20 p-2 text-center font-black">المدة</th>
                  <th className="border border-foreground/20 p-2 text-center font-black">القاعة / اللجنة</th>
                  {batchPrintMode === "admin" && (
                    <>
                      <th className="border border-foreground/20 p-2 text-center font-black">المراقب المكلف</th>
                      <th className="border border-foreground/20 p-2 text-center font-black">توقيع الاستلام</th>
                      <th className="border border-foreground/20 p-2 text-center font-black">توقيع التسليم</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {entry.items.map((item, iIdx) => {
                  const sub = activeStageSubjects.find(s => s.id === item.subjectId);
                  const startTime = item.startTime || "08:00";
                  const dur = item.duration || 90;
                  const endTime = calculateEndTime(startTime, dur);
                  const dayName = getArabicDayName(item.date);
                  return (
                    <tr key={item.id} className={iIdx % 2 === 0 ? "bg-background" : "bg-muted/15"}>
                      <td className="border border-foreground/20 p-2 text-center font-bold">{dayName}</td>
                      <td className="border border-foreground/20 p-2 text-center tabular-nums" dir="ltr">{item.date}</td>
                      <td className="border border-foreground/20 p-2 font-black">{sub?.name || item.subjectId}</td>
                      <td className="border border-foreground/20 p-2 text-center tabular-nums" dir="ltr">{startTime} - {endTime}</td>
                      <td className="border border-foreground/20 p-2 text-center tabular-nums">{dur} دقيقة</td>
                      <td className="border border-foreground/20 p-2 text-center font-bold">{item.room || "قاعة عامة"}</td>
                      {batchPrintMode === "admin" && (
                        <>
                          <td className="border border-foreground/20 p-2 text-center font-bold text-primary">{item.invigilator || "مشرف اللجنة"}</td>
                          <td className="border border-foreground/20 p-2 text-center text-[10px] text-muted-foreground">..................</td>
                          <td className="border border-foreground/20 p-2 text-center text-[10px] text-muted-foreground">..................</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer */}
            {batchPrintMode === "student" ? (
              <div className="p-3 border border-border/80 rounded-xl bg-muted/20 text-[11px] space-y-1">
                <p className="font-black text-primary">إرشادات هامة لأبنائنا الطلاب وأولياء الأمور:</p>
                <p className="text-muted-foreground">• الحضور قبل بدء الاختبار بربع ساعة على الأقل والالتزام بالزي المدرسي المعتمد.</p>
                <p className="text-muted-foreground">• يمنع منعاً باتاً إدخال الهواتف المحمولة أو الساعات الذكية إلى القاعات.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 pt-4 text-center text-xs font-black">
                <div>وكيل شؤون الطلاب: ....................</div>
                <div>مسؤول الكنترول والاختبارات: ....................</div>
                <div>مدير المدرسة والختم الرسمي: ....................</div>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  };

  return (
    <div className="space-y-6">
      {/* Top Registry KPIs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/60 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <span>السجل المتكامل لجداول الامتحانات لجميع الفصول</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {registryEntries.length} فصول وشعب
            </span>
          </h3>
          <p className="text-xs text-muted-foreground">
            متابعة وتوثيق حالة الجداول لكل فصل، تواريخ الاختبارات، وتجهيز طباعة جداول الطلاب أو كشوفات اللجان الإدارية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <select 
            value={selectedExamId} 
            onChange={e => setSelectedExamId(e.target.value)} 
            className="h-10 rounded-xl border border-border/70 bg-background px-3 font-black text-xs min-w-[200px]"
          >
            {(activeStageExams || []).map(ex => <option key={ex.id} value={ex.id}>{ex.name} ({ex.term})</option>)}
          </select>

          {/* Batch Print Buttons */}
          <button
            onClick={() => { setBatchPrintMode("student"); setIsBatchPrintOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة جداول الطلاب للجميع</span>
          </button>

          <button
            onClick={() => { setBatchPrintMode("admin"); setIsBatchPrintOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/80 bg-background font-bold text-xs hover:bg-accent transition-all shadow-sm active:scale-[0.98]"
          >
            <Printer className="w-3.5 h-3.5 text-primary" />
            <span>طباعة كشوف اللجان (إداري)</span>
          </button>
        </div>
      </div>

      {/* Grid of Class Timetable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {registryEntries.map((entry, idx) => {
          return (
            <div 
              key={idx}
              className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-black text-foreground">{entry.grade}</h4>
                    {entry.sectionName ? (
                      <span className="text-xs font-extrabold text-primary">شعبة: {entry.sectionName}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">شعبة عامة لجميع الطلاب</span>
                    )}
                  </div>

                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${
                    entry.subjectCount > 0
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  }`}>
                    {entry.subjectCount > 0 ? `${entry.subjectCount} مواد مجدولة` : "غير مجدول"}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground border-y border-border/40 py-2.5">
                  <div className="flex justify-between">
                    <span>فترة الاختبارات:</span>
                    <span className="font-bold text-foreground tabular-nums" dir="ltr">
                      {entry.startDate && entry.endDate ? `${entry.startDate} إلى ${entry.endDate}` : "لم تحدد بعد"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>القاعات المخصصة:</span>
                    <span className="font-bold text-foreground">
                      {entry.rooms.length > 0 ? entry.rooms.join("، ") : "لم تعين"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>المراقبون المكلفون:</span>
                    <span className="font-bold text-primary">
                      {entry.invigilators.length > 0 ? `${entry.invigilators.length} مراقبين` : "قيد التعيين"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions per class */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectClassForPrint(currentExam?.id || "", entry.grade, entry.sectionId, "student")}
                  className="inline-flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-black transition-all border border-primary/20 active:scale-[0.98]"
                >
                  <Printer className="w-3 h-3" />
                  <span>جدول الطلاب</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectClassForPrint(currentExam?.id || "", entry.grade, entry.sectionId, "admin")}
                  className="inline-flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl border border-border/80 hover:bg-muted text-foreground text-[11px] font-bold transition-all active:scale-[0.98]"
                >
                  <FileText className="w-3 h-3 text-muted-foreground" />
                  <span>كشف الكنترول</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectClassForSchedule(entry.grade, entry.sectionId)}
                  className="inline-flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl border border-border/80 hover:bg-muted text-foreground text-[11px] font-bold transition-all active:scale-[0.98]"
                >
                  <Edit3 className="w-3 h-3 text-primary" />
                  <span>تعديل</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Batch Print Engine Modal */}
      {isBatchPrintOpen && (
        <AdvancedPrintEngine
          isOpen={isBatchPrintOpen}
          data={registryEntries}
          templates={[batchPrintTemplate]}
          title={batchPrintMode === "student" ? `جداول اختبارات الطلاب لجميع الفصول - ${currentExam?.name}` : `كشوفات لجان الامتحانات لجميع الفصول - ${currentExam?.name}`}
          onClose={() => setIsBatchPrintOpen(false)}
        />
      )}
    </div>
  );
}

// ==========================================
// 3. Exam Subjects Schedule View (ExamSubject entity)
// ==========================================
function ExamSubjectsScheduleView({ initialGradeFilter = "", initialSectionFilter = "" }: { initialGradeFilter?: string; initialSectionFilter?: string }) {
  const { stage } = useStage();
  const { 
    activeStageExams, 
    activeStageExamSubjects, 
    activeStageSubjects, 
    activeStageSections,
    addExamSubject, 
    updateExamSubject,
    deleteExamSubject 
  } = useGlobalStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchScheduleOpen, setIsBatchScheduleOpen] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>(initialGradeFilter);
  const stageGrades = useMemo(() => getGradesForStage(stage), [stage]);

  const [batchScheduleForm, setBatchScheduleForm] = useState({
    examId: activeStageExams[0]?.id || "",
    grade: initialGradeFilter || stageGrades[0] || "",
    sectionId: initialSectionFilter || "",
    startDate: new Date().toISOString().split('T')[0],
    frequency: "every_other_day" as "daily" | "every_other_day",
    startTime: "08:00",
    duration: 90,
    room: "قاعة الاختبارات 101"
  });

  const [formData, setFormData] = useState<Partial<ExamSubject>>({
    examId: "",
    subjectId: "",
    date: new Date().toISOString().split('T')[0],
    startTime: "08:00",
    duration: 90,
    room: "قاعة الاختبارات الرئيسية",
    maxScore: 100,
    passScore: 50,
    weight: 100,
    grade: "",
    sectionId: ""
  });

  const handleRunBatchSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchScheduleForm.examId || !batchScheduleForm.grade) {
      toast.error("الرجاء اختيار الفترة والصف الدراسي");
      return;
    }

    const targetSubjects = activeStageSubjects.filter(s => 
      s.stage === "all" || s.stage === stage
    ).slice(0, 6);

    if (targetSubjects.length === 0) {
      toast.error("لا توجد مواد مسجلة لهذه المرحلة لتتم جدولتها");
      return;
    }

    const intervalDays = batchScheduleForm.frequency === "every_other_day" ? 2 : 1;
    let scheduledCount = 0;

    targetSubjects.forEach((sub, idx) => {
      const examDate = new Date(batchScheduleForm.startDate);
      examDate.setDate(examDate.getDate() + (idx * intervalDays));

      addExamSubject({
        examId: batchScheduleForm.examId,
        subjectId: sub.id,
        grade: batchScheduleForm.grade,
        sectionId: batchScheduleForm.sectionId || undefined,
        date: examDate.toISOString().split('T')[0],
        startTime: batchScheduleForm.startTime,
        duration: batchScheduleForm.duration,
        room: batchScheduleForm.room,
        maxScore: 50,
        passScore: 25,
        weight: 50,
        stage
      });
      scheduledCount++;
    });

    toast.success(`تمت الجدولة الآلية لـ ${scheduledCount} مواد دراسية بنجاح!`);
    setIsBatchScheduleOpen(false);
  };

  const openAddModal = () => {
    setEditingSubjectId(null);
    setFormData({
      examId: selectedExamId || activeStageExams[0]?.id || "",
      subjectId: activeStageSubjects[0]?.id || "",
      date: new Date().toISOString().split('T')[0],
      startTime: "08:00",
      duration: 90,
      room: "قاعة 101",
      maxScore: 100,
      passScore: 50,
      weight: 100,
      grade: stageGrades[0] || "",
      sectionId: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (es: ExamSubject) => {
    setEditingSubjectId(es.id);
    setFormData({ ...es });
    setIsModalOpen(true);
  };

  // Conflict Detection Engine
  const conflicts = useMemo(() => {
    const list: string[] = [];
    const subjects = activeStageExamSubjects || [];

    for (let i = 0; i < subjects.length; i++) {
      for (let j = i + 1; j < subjects.length; j++) {
        const a = subjects[i];
        const b = subjects[j];

        // Only check same date
        if (a.date !== b.date) continue;

        // Overlapping times check
        const aStart = a.startTime || "08:00";
        const bStart = b.startTime || "08:00";
        const aEnd = calculateEndTime(aStart, a.duration || 90);
        const bEnd = calculateEndTime(bStart, b.duration || 90);

        const isOverlapping = (aStart < bEnd && aEnd > bStart);

        if (isOverlapping) {
          // Conflict 1: Same grade has overlapping exams
          if (a.grade === b.grade && (!a.sectionId || !b.sectionId || a.sectionId === b.sectionId)) {
            const subA = activeStageSubjects.find(s => s.id === a.subjectId)?.name || a.subjectId;
            const subB = activeStageSubjects.find(s => s.id === b.subjectId)?.name || b.subjectId;
            list.push(`تعارض لصف (${a.grade}): مادة (${subA}) ومادة (${subB}) في نفس التوقيت (${a.date} من ${aStart} إلى ${aEnd})`);
          }

          // Conflict 2: Same room booked for multiple subjects at same time
          if (a.room && b.room && a.room === b.room) {
            const subA = activeStageSubjects.find(s => s.id === a.subjectId)?.name || a.subjectId;
            const subB = activeStageSubjects.find(s => s.id === b.subjectId)?.name || b.subjectId;
            list.push(`تعارض قاعة (${a.room}): حجز مزدوج لمادة (${subA}) ومادة (${subB}) في تاريخ ${a.date}`);
          }
        }
      }
    }
    return list;
  }, [activeStageExamSubjects, activeStageSubjects]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.examId || !formData.subjectId || !formData.grade) {
      toast.error("الرجاء إكمال الحقول المطلوبة");
      return;
    }
    
    if (editingSubjectId) {
      updateExamSubject(editingSubjectId, formData);
      toast.success("تم تحديث جدولة المادة بنجاح");
    } else {
      addExamSubject({
        ...formData as Omit<ExamSubject, "id">,
        stage
      });
      toast.success("تمت جدولة المادة بنجاح");
    }
    setIsModalOpen(false);
    setEditingSubjectId(null);
  };

  const filteredSubjects = (activeStageExamSubjects || []).filter(es => {
    if (selectedExamId && es.examId !== selectedExamId) return false;
    if (selectedGradeFilter && es.grade !== selectedGradeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Conflict Warning Banner */}
      {conflicts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-extrabold text-sm">تم رصد {conflicts.length} تعارض في جدول الاختبارات أو القاعات:</p>
            <ul className="text-xs list-disc list-inside space-y-0.5 font-medium">
              {conflicts.slice(0, 3).map((c, idx) => (
                <li key={idx}>{c}</li>
              ))}
              {conflicts.length > 3 && (
                <li>وغيرها {conflicts.length - 3} تعارضات إضافية...</li>
              )}
            </ul>
          </div>
        </div>
      )}

      <PageCard
        title="جدولة المواد وتوزيع القاعات"
        description="تحديد مواعيد وتوقيتات اختبار كل مادة، القاعة المخصصة، وتوزيع درجات النجاح لكل صف دراسي"
        actions={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsBatchScheduleOpen(true)}
              className="inline-flex items-center gap-1.5 border border-primary/40 bg-primary/10 text-primary font-bold px-3 py-2 rounded-xl hover:bg-primary/20 transition-all shadow-sm text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>جدولة آلية سريعة لجميع مواد الصف</span>
            </button>
            <button onClick={openAddModal} className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-sm text-sm">
              <Plus className="w-4 h-4" /> إضافة مادة للاختبار
            </button>
          </div>
        }
      >
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div>
            <label className="text-xs font-bold text-muted-foreground ml-2 block mb-1">فترة الاختبار:</label>
            <select 
              value={selectedExamId} 
              onChange={e => setSelectedExamId(e.target.value)} 
              className="h-10 rounded-xl border border-border/60 bg-background px-3 font-bold text-xs min-w-[200px]"
            >
              <option value="">كل فترات الاختبارات</option>
              {(activeStageExams || []).map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground ml-2 block mb-1">تصفية حسب الصف:</label>
            <select 
              value={selectedGradeFilter} 
              onChange={e => setSelectedGradeFilter(e.target.value)} 
              className="h-10 rounded-xl border border-border/60 bg-background px-3 font-bold text-xs min-w-[160px]"
            >
              <option value="">كل الصفوف</option>
              {stageGrades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="mr-auto self-end text-xs text-muted-foreground font-bold">
            عدد المواد المجدولة: <span className="text-foreground font-black">{filteredSubjects.length}</span>
          </div>
        </div>

        <DataTable
          rows={filteredSubjects.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
          columns={[
            { 
              key: "grade", 
              header: "الصف الدراسي", 
              cell: row => (
                <div>
                  <span className="font-black text-sm">{row.grade}</span>
                  {row.sectionId && (
                    <span className="block text-[10px] text-muted-foreground">
                      شعبة: {activeStageSections.find(s => s.id === row.sectionId)?.name || row.sectionId}
                    </span>
                  )}
                </div>
              ) 
            },
            { 
              key: "subject", 
              header: "المادة الدراسية", 
              cell: row => {
                const sub = (activeStageSubjects || []).find(s => s.id === row.subjectId);
                return (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-black text-primary text-sm">{sub?.name || row.subjectId}</span>
                  </div>
                );
              }
            },
            { 
              key: "date", 
              header: "اليوم والتاريخ", 
              cell: row => (
                <div>
                  <span className="font-extrabold text-foreground text-xs block">{getArabicDayName(row.date)}</span>
                  <span className="text-xs text-muted-foreground tabular-nums" dir="ltr">{row.date}</span>
                </div>
              ) 
            },
            { 
              key: "time", 
              header: "التوقيت والمدة", 
              cell: row => {
                const startTime = row.startTime || "08:00";
                const duration = row.duration || 90;
                const endTime = calculateEndTime(startTime, duration);
                return (
                  <div>
                    <span className="text-xs font-bold tabular-nums block" dir="ltr">{startTime} - {endTime}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold">({duration} دقيقة)</span>
                  </div>
                );
              } 
            },
            { 
              key: "room", 
              header: "القاعة / اللجنة", 
              cell: row => (
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                    {row.room || "قاعة عامة"}
                  </span>
                </div>
              ) 
            },
            { 
              key: "scores", 
              header: "الدرجات (الكبرى / الصغرى)", 
              cell: row => (
                <div className="text-xs font-extrabold">
                  <span className="text-primary font-black">{row.maxScore}</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-muted-foreground">{row.passScore}</span>
                  <span className="text-[10px] text-muted-foreground mr-1">({row.weight || 100}%)</span>
                </div>
              )
            },
            { 
              key: "actions", 
              header: "الإجراءات", 
              cell: row => (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => openEditModal(row)} 
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="تعديل المادة"
                  >
                    <Edit3 className="w-3.5 h-3.5"/>
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm("هل أنت متأكد من حذف هذه المادة من جدول الاختبار؟")) {
                        deleteExamSubject(row.id);
                        toast.success("تم حذف المادة من الجدولة");
                      }
                    }} 
                    className="p-1.5 text-danger/70 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                    title="حذف المادة"
                  >
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
              )
            }
          ]}
        />
      </PageCard>

      {/* Modal to Schedule Exam Subject */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border/80 overflow-hidden p-6 sm:p-7 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-foreground">
                    {editingSubjectId ? "تعديل موعد وقاعة المادة" : "جدولة مادة لاختبار"}
                  </h2>
                  <p className="text-xs text-muted-foreground">تحديد موعد الاختبار، القاعة، والتوقيت وتوزيع الدرجات</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              >
                <span className="font-bold text-lg leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4 pt-1">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground/85">اختر فترة الاختبار <span className="text-destructive">*</span></label>
                <select 
                  required 
                  value={formData.examId} 
                  onChange={e => setFormData(prev => ({ ...prev, examId: e.target.value }))} 
                  className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all cursor-pointer"
                >
                  <option value="">-- اختر فترة الاختبار --</option>
                  {(activeStageExams || []).map(ex => <option key={ex.id} value={ex.id}>{ex.name} ({ex.term})</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">الصف الدراسي <span className="text-destructive">*</span></label>
                  <select 
                    required 
                    value={formData.grade} 
                    onChange={e => setFormData(prev => ({ ...prev, grade: e.target.value }))} 
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all cursor-pointer"
                  >
                    <option value="">-- اختر الصف --</option>
                    {stageGrades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">المادة الدراسية <span className="text-destructive">*</span></label>
                  <select 
                    required 
                    value={formData.subjectId} 
                    onChange={e => setFormData(prev => ({ ...prev, subjectId: e.target.value }))} 
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all cursor-pointer"
                  >
                    <option value="">-- اختر المادة --</option>
                    {(activeStageSubjects || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <ArabicDatePicker
                    label="تاريخ اختبار المادة"
                    required
                    value={formData.date}
                    onChange={(val) => setFormData({ ...formData, date: val })}
                    showAgeCalculator={false}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">القاعة / اللجنة</label>
                  <input 
                    value={formData.room || ""} 
                    onChange={e => setFormData({ ...formData, room: e.target.value })} 
                    placeholder="مثال: قاعة 101 أو المدرج الرئيسي" 
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">وقت بدء الاختبار</label>
                  <input 
                    type="time" 
                    value={formData.startTime || "08:00"} 
                    onChange={e => setFormData({ ...formData, startTime: e.target.value })} 
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">المدة بالدقائق</label>
                  <input 
                    type="number" 
                    step="15"
                    min="15"
                    value={formData.duration || 90} 
                    onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })} 
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">الدرجة الكلية</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.maxScore} 
                    onChange={e => setFormData({...formData, maxScore: Number(e.target.value)})} 
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all tabular-nums" 
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">درجة النجاح</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.passScore} 
                    onChange={e => setFormData({...formData, passScore: Number(e.target.value)})} 
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all tabular-nums" 
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">الوزن %</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.weight} 
                    onChange={e => setFormData({...formData, weight: Number(e.target.value)})} 
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all tabular-nums" 
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2.5 border-t border-border/60">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="h-11 px-5 rounded-xl border border-input bg-background/80 hover:bg-accent text-xs font-semibold active:scale-[0.98] transition-all"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="h-11 px-7 bg-primary text-primary-foreground text-xs font-extrabold rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md"
                >
                  {editingSubjectId ? "حفظ التعديلات" : "حفظ المادة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Batch Auto-Schedule Modal for Whole Grade */}
      {isBatchScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border/80 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>الجدولة الآلية السريعة لكافة مواد الصف</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setIsBatchScheduleOpen(false)}
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRunBatchSchedule} className="space-y-4 text-right">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground/85">فترة الاختبار</label>
                <select
                  value={batchScheduleForm.examId}
                  onChange={e => setBatchScheduleForm({ ...batchScheduleForm, examId: e.target.value })}
                  className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
                  required
                >
                  {(activeStageExams || []).map(ex => <option key={ex.id} value={ex.id}>{ex.name} ({ex.term})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">الصف الدراسي</label>
                  <select
                    value={batchScheduleForm.grade}
                    onChange={e => setBatchScheduleForm({ ...batchScheduleForm, grade: e.target.value })}
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
                    required
                  >
                    {stageGrades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">الشعبة (اختياري)</label>
                  <select
                    value={batchScheduleForm.sectionId}
                    onChange={e => setBatchScheduleForm({ ...batchScheduleForm, sectionId: e.target.value })}
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
                  >
                    <option value="">جميع الشعب</option>
                    {(activeStageSections || []).filter(s => s.grade === batchScheduleForm.grade || normalizeGrade(s.grade) === normalizeGrade(batchScheduleForm.grade)).map(s => (
                      <option key={s.id} value={s.id}>شعبة {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">تاريخ أول اختبار</label>
                  <input
                    type="date"
                    value={batchScheduleForm.startDate}
                    onChange={e => setBatchScheduleForm({ ...batchScheduleForm, startDate: e.target.value })}
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">فارق الأيام بين الاختبارات</label>
                  <select
                    value={batchScheduleForm.frequency}
                    onChange={e => setBatchScheduleForm({ ...batchScheduleForm, frequency: e.target.value as any })}
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
                  >
                    <option value="every_other_day">يوم بعد يوم (كل 48 ساعة)</option>
                    <option value="daily">يومي متتالي</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">وقت البدء</label>
                  <input
                    type="time"
                    value={batchScheduleForm.startTime}
                    onChange={e => setBatchScheduleForm({ ...batchScheduleForm, startTime: e.target.value })}
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">المدة (دقائق)</label>
                  <input
                    type="number"
                    value={batchScheduleForm.duration}
                    onChange={e => setBatchScheduleForm({ ...batchScheduleForm, duration: Number(e.target.value) })}
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-foreground/85">القاعة الافتراضية</label>
                  <input
                    type="text"
                    value={batchScheduleForm.room}
                    onChange={e => setBatchScheduleForm({ ...batchScheduleForm, room: e.target.value })}
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-muted-foreground leading-relaxed">
                سيقوم النظام تلقائياً بتوزيع مواد هذا الصف على التواريخ المحددة وتوليد جدول كامل جاهز للاعتماد والطباعة فوراً.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsBatchScheduleOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border/80 text-xs font-bold hover:bg-muted"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md"
                >
                  تنفيذ الجدولة الآلية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. Official Exam Timetable (Printable)
// ==========================================
function ExamTimetableView({
  initialExamId = "",
  initialGrade = "",
  initialSectionId = "",
  initialMode = "student"
}: {
  initialExamId?: string;
  initialGrade?: string;
  initialSectionId?: string;
  initialMode?: "student" | "admin";
}) {
  const { stage } = useStage();
  const { activeStageExams, activeStageExamSubjects, activeStageSubjects, activeStageSections } = useGlobalStore();
  const stageGrades = useMemo(() => getGradesForStage(stage), [stage]);

  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId || activeStageExams[0]?.id || "");
  const [selectedGrade, setSelectedGrade] = useState<string>(initialGrade || stageGrades[0] || "");
  const [selectedSectionId, setSelectedSectionId] = useState<string>(initialSectionId || "");
  const [timetableMode, setTimetableMode] = useState<"student" | "admin">(initialMode);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const currentExam = useMemo(() => {
    return activeStageExams.find(e => e.id === selectedExamId) || activeStageExams[0];
  }, [activeStageExams, selectedExamId]);

  const sectionsForGrade = useMemo(() => {
    return (activeStageSections || []).filter(s => s.grade === selectedGrade);
  }, [activeStageSections, selectedGrade]);

  const timetableItems = useMemo(() => {
    if (!currentExam || !selectedGrade) return [];
    return (activeStageExamSubjects || [])
      .filter(es => {
        if (es.examId !== currentExam.id) return false;
        const gradeMatches = es.grade === selectedGrade || normalizeGrade(es.grade) === normalizeGrade(selectedGrade);
        if (!gradeMatches) return false;
        if (selectedSectionId && es.sectionId && es.sectionId !== selectedSectionId) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [activeStageExamSubjects, currentExam, selectedGrade, selectedSectionId]);

  // Template 1: Student Timetable (جدول الطلاب وأولياء الأمور)
  const studentPrintTemplate: PrintTemplate = {
    id: "exam_timetable_student",
    name: "جدول الاختبارات للطلاب وأولياء الأمور",
    category: "اختبارات",
    type: "document",
    renderDocument: () => (
      <div className="space-y-6 text-foreground p-4" dir="rtl">
        {/* Header */}
        <div className="text-center border-b-2 border-primary/30 pb-4 space-y-1">
          <p className="text-xs font-bold text-muted-foreground">الإدارة العامة للتعليم - جدول الاختبارات المدرسية المعتمد</p>
          <h2 className="text-2xl font-black text-primary">{currentExam?.name || "جدول الاختبارات المدرسية"}</h2>
          <p className="text-sm font-bold text-foreground">
            الصف: <span className="text-primary font-black">{selectedGrade}</span> {selectedSectionId ? `(شعبة ${sectionsForGrade.find(s => s.id === selectedSectionId)?.name})` : "(جميع الشعب)"} - الفصل: {currentExam?.term || "الفصل الأول"}
          </p>
        </div>

        {/* Timetable Table */}
        <table className="w-full border-collapse border border-foreground/20 text-sm">
          <thead>
            <tr className="bg-muted/60 text-foreground">
              <th className="border border-foreground/20 p-2.5 text-center font-black">اليوم</th>
              <th className="border border-foreground/20 p-2.5 text-center font-black">التاريخ</th>
              <th className="border border-foreground/20 p-2.5 text-center font-black">المادة الدراسية</th>
              <th className="border border-foreground/20 p-2.5 text-center font-black">وقت البدء</th>
              <th className="border border-foreground/20 p-2.5 text-center font-black">وقت الانتهاء</th>
              <th className="border border-foreground/20 p-2.5 text-center font-black">المدة</th>
              <th className="border border-foreground/20 p-2.5 text-center font-black">القاعة / اللجنة</th>
            </tr>
          </thead>
          <tbody>
            {timetableItems.map((item, idx) => {
              const subName = activeStageSubjects.find(s => s.id === item.subjectId)?.name || item.subjectId;
              const start = item.startTime || "08:00";
              const dur = item.duration || 90;
              const end = calculateEndTime(start, dur);
              return (
                <tr key={idx} className={idx % 2 === 0 ? "bg-background" : "bg-muted/15"}>
                  <td className="border border-foreground/20 p-2.5 text-center font-black">{getArabicDayName(item.date)}</td>
                  <td className="border border-foreground/20 p-2.5 text-center tabular-nums" dir="ltr">{item.date}</td>
                  <td className="border border-foreground/20 p-2.5 text-center font-black text-primary text-base">{subName}</td>
                  <td className="border border-foreground/20 p-2.5 text-center tabular-nums font-bold" dir="ltr">{start}</td>
                  <td className="border border-foreground/20 p-2.5 text-center tabular-nums font-bold" dir="ltr">{end}</td>
                  <td className="border border-foreground/20 p-2.5 text-center font-medium">{dur} دقيقة</td>
                  <td className="border border-foreground/20 p-2.5 text-center font-bold text-xs">{item.room || "قاعة عامة"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Exam Rules & Instructions */}
        <div className="border border-foreground/20 rounded-2xl p-4 bg-muted/10 space-y-2 text-xs">
          <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
            <Info className="w-4 h-4 text-primary" /> تعليمات وضوابط أداء الاختبارات لأبنائنا الطلاب:
          </h4>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground font-medium">
            <li>التواجد داخل القاعة المحددة قبل موعد بدء الاختبار بـ 15 دقيقة على الأقل.</li>
            <li>يمنع منعاً باتاً اصطحاب الهواتف المحمولة أو الساعات الذكية أو المذكرات داخل قاعات الاختبار.</li>
            <li>إحضار كافة الأدوات الكتابية والهندسية الخاصة بالطالب حيث يمنع تبادل الأدوات نهائياً داخل اللجنة.</li>
            <li>المحافظة على الهدوء التام والالتزام بالزي المدرسي المعتمد.</li>
          </ul>
        </div>

        {/* Official Signatures */}
        <div className="grid grid-cols-2 pt-6 text-center text-xs font-black">
          <div>
            <p className="text-muted-foreground mb-6">مسؤول لجان الاختبارات والكنترول</p>
            <p className="border-t border-dashed border-foreground/30 pt-1 w-40 mx-auto">التوقيع والاعتماد</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-6">مدير المدرسة والختم الرسمي</p>
            <p className="border-t border-dashed border-foreground/30 pt-1 w-40 mx-auto">الختم والتوقيع</p>
          </div>
        </div>
      </div>
    )
  };

  // Template 2: Admin & Control Timetable (الجانب الإداري وكشف اللجان والمراقبين)
  const adminPrintTemplate: PrintTemplate = {
    id: "exam_timetable_admin",
    name: "كشف لجان الامتحانات والمراقبين (الجانب الإداري)",
    category: "إدارة الاختبارات",
    type: "document",
    renderDocument: () => (
      <div className="space-y-6 text-foreground p-4" dir="rtl">
        {/* Header */}
        <div className="text-center border-b-2 border-foreground/30 pb-4 space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
            <span>لجنة النظام والمراقبة (الكنترول المدرسي)</span>
            <span>العام الدراسي: 1446 - 1447 هـ</span>
          </div>
          <h2 className="text-2xl font-black text-foreground">بيان جدول ومخطط سير اللجان والمراقبة اليومية</h2>
          <p className="text-sm font-bold text-primary">
            {currentExam?.name} - {selectedGrade} {selectedSectionId ? `(شعبة ${sectionsForGrade.find(s => s.id === selectedSectionId)?.name})` : ""}
          </p>
        </div>

        {/* Admin Timetable Table */}
        <table className="w-full border-collapse border border-foreground/30 text-xs">
          <thead>
            <tr className="bg-muted/70 text-foreground">
              <th className="border border-foreground/30 p-2 text-center font-black">م</th>
              <th className="border border-foreground/30 p-2 text-center font-black">اليوم والتاريخ</th>
              <th className="border border-foreground/30 p-2 text-right font-black">المادة الدراسية</th>
              <th className="border border-foreground/30 p-2 text-center font-black">الشعبة</th>
              <th className="border border-foreground/30 p-2 text-center font-black">القاعة / اللجنة</th>
              <th className="border border-foreground/30 p-2 text-center font-black">التوقيت</th>
              <th className="border border-foreground/30 p-2 text-right font-black">المراقب المكلف</th>
              <th className="border border-foreground/30 p-2 text-center font-black w-24">توقيع الاستلام</th>
            </tr>
          </thead>
          <tbody>
            {timetableItems.map((item, idx) => {
              const subName = activeStageSubjects.find(s => s.id === item.subjectId)?.name || item.subjectId;
              const start = item.startTime || "08:00";
              const dur = item.duration || 90;
              const end = calculateEndTime(start, dur);
              const sectionName = item.sectionId ? activeStageSections.find(s => s.id === item.sectionId)?.name : "جميع الشعب";
              return (
                <tr key={idx} className={idx % 2 === 0 ? "bg-background" : "bg-muted/15"}>
                  <td className="border border-foreground/30 p-2 text-center font-bold">{idx + 1}</td>
                  <td className="border border-foreground/30 p-2 text-center">
                    <span className="font-black block">{getArabicDayName(item.date)}</span>
                    <span className="text-[11px] tabular-nums text-muted-foreground">{item.date}</span>
                  </td>
                  <td className="border border-foreground/30 p-2 font-black text-primary">{subName}</td>
                  <td className="border border-foreground/30 p-2 text-center font-bold">{sectionName}</td>
                  <td className="border border-foreground/30 p-2 text-center font-black">{item.room || "قاعة عامة"}</td>
                  <td className="border border-foreground/30 p-2 text-center tabular-nums" dir="ltr">{start} - {end}</td>
                  <td className="border border-foreground/30 p-2 font-bold text-foreground">
                    {item.invigilator || "المشرف الأكاديمي المناوب"}
                  </td>
                  <td className="border border-foreground/30 p-2 text-center"></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Admin Instructions & Procedures */}
        <div className="border border-foreground/30 rounded-xl p-3 bg-muted/10 grid grid-cols-2 gap-4 text-xs font-medium">
          <div>
            <p className="font-black text-foreground mb-1">تعليمات الملاحظين والمراقبين:</p>
            <p>استلام أوراق الأسئلة والإجابة من غرفة الكنترول قبل موعد الاختبار بـ 20 دقيقة والتأكد من سلامة مظروف الأسئلة ومطابقة عدد الطلاب.</p>
          </div>
          <div>
            <p className="font-black text-foreground mb-1">إجراءات تسليم كراسات الإجابة:</p>
            <p>تسليم أوراق الإجابة مرتبة حسب أرقام الجلوس فور انتهاء الوقت المحدد وتدوين حالات الغياب أو الحرمان في محضر اللجنة.</p>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 pt-6 text-center text-xs font-black">
          <div>
            <p className="text-muted-foreground mb-6">مسؤول استلام وتسليم اللجان</p>
            <p className="border-t border-dashed border-foreground/30 pt-1 w-32 mx-auto">التوقيع</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-6">رئيس لجنة الكنترول</p>
            <p className="border-t border-dashed border-foreground/30 pt-1 w-32 mx-auto">المراجعة والتدقيق</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-6">مدير المدرسة / رئيس عام الامتحانات</p>
            <p className="border-t border-dashed border-foreground/30 pt-1 w-32 mx-auto">الاعتماد الرسمي</p>
          </div>
        </div>
      </div>
    )
  };

  return (
    <div className="space-y-6">
      <PageCard
        title="جدول الامتحانات المطبوع (جانب طلابي وجانب إداري)"
        description="معاينة وإصدار جداول الامتحانات الرسمية سواء الموجهة للطلاب وأولياء الأمور أو كشوفات اللجان والمراقبين الإدارية"
        actions={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsPrintOpen(true)}
              disabled={timetableItems.length === 0}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-extrabold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-sm text-xs disabled:opacity-50"
            >
              <Printer className="w-4 h-4" /> طباعة {timetableMode === "student" ? "جدول الطلاب" : "كشف اللجان الإداري"}
            </button>
          </div>
        }
      >
        {/* Mode Switcher Tabs */}
        <div className="flex gap-2 p-1 bg-muted/40 rounded-xl border border-border/50 max-w-md mb-5">
          <button
            onClick={() => setTimetableMode("student")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all ${timetableMode === "student" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            جدول الطلاب وأولياء الأمور
          </button>
          <button
            onClick={() => setTimetableMode("admin")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all ${timetableMode === "admin" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            كشف اللجان والمراقبين (إداري)
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-border/50">
          <div>
            <label className="text-xs font-bold text-muted-foreground ml-2 block mb-1">فترة الاختبار:</label>
            <select 
              value={selectedExamId} 
              onChange={e => setSelectedExamId(e.target.value)} 
              className="h-10 rounded-xl border border-border/60 bg-background px-3 font-bold text-xs min-w-[220px]"
            >
              {(activeStageExams || []).map(ex => <option key={ex.id} value={ex.id}>{ex.name} ({ex.term})</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground ml-2 block mb-1">الصف الدراسي:</label>
            <select 
              value={selectedGrade} 
              onChange={e => { setSelectedGrade(e.target.value); setSelectedSectionId(""); }} 
              className="h-10 rounded-xl border border-border/60 bg-background px-3 font-bold text-xs min-w-[160px]"
            >
              {stageGrades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground ml-2 block mb-1">الشعبة (اختياري):</label>
            <select 
              value={selectedSectionId} 
              onChange={e => setSelectedSectionId(e.target.value)} 
              className="h-10 rounded-xl border border-border/60 bg-background px-3 font-bold text-xs min-w-[150px]"
            >
              <option value="">جميع الشعب</option>
              {sectionsForGrade.map(s => <option key={s.id} value={s.id}>شعبة {s.name}</option>)}
            </select>
          </div>

          <div className="mr-auto self-end">
            <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-xl">
              {timetableItems.length} مواد مجدولة
            </span>
          </div>
        </div>

        {/* Timetable Card Display */}
        {timetableItems.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground space-y-3">
            <Calendar className="w-12 h-12 mx-auto opacity-30 text-primary" />
            <p className="font-bold text-sm">لا توجد مواد مجدولة لهذا الصف في فترة الاختبار المحددة.</p>
            <p className="text-xs">يمكنك الانتقال لتبويب "جدولة المواد والقاعات" لإضافة مواعيد المواد لهذا الصف.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timetableItems.map((item, idx) => {
                const sub = activeStageSubjects.find(s => s.id === item.subjectId);
                const startTime = item.startTime || "08:00";
                const dur = item.duration || 90;
                const endTime = calculateEndTime(startTime, dur);
                const dayName = getArabicDayName(item.date);
                const secName = item.sectionId ? activeStageSections.find(s => s.id === item.sectionId)?.name : "جميع الشعب";

                return (
                  <div key={item.id} className="p-4 rounded-2xl border border-border/60 bg-card/60 shadow-sm hover:border-primary/40 transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
                        {dayName}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground tabular-nums" dir="ltr">
                        {item.date}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-foreground">{sub?.name || item.subjectId}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">الصف: {item.grade} • شعبة: {secName}</p>
                    </div>

                    <div className="pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px] font-bold">التوقيت:</span>
                        <span className="font-bold tabular-nums" dir="ltr">{startTime} - {endTime} ({dur} د)</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] font-bold">القاعة / اللجنة:</span>
                        <span className="font-bold">{item.room || "قاعة عامة"}</span>
                      </div>
                    </div>

                    {timetableMode === "admin" && (
                      <div className="pt-2 border-t border-border/40 text-xs">
                        <span className="text-muted-foreground block text-[10px] font-bold">المراقب المكلف:</span>
                        <span className="font-bold text-primary">{item.invigilator || "المشرف الأكاديمي المناوب"}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Live In-Page Realistic Paper Sheet Preview */}
            <div className="pt-6 border-t border-border/60 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                  <Printer className="w-4 h-4 text-primary" />
                  <span>معاينة الورقة المطبوعة الفعلية ({timetableMode === "student" ? "نسخة الطلاب وأولياء الأمور" : "كشف اللجان والمراقبين للإدارة"})</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsPrintOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>فتح نافذة الطباعة / تصدير PDF</span>
                </button>
              </div>

              {/* Realistic Paper Container */}
              <div className="p-8 border-2 border-border/80 rounded-3xl bg-background shadow-lg max-w-4xl mx-auto space-y-6 text-foreground" dir="rtl">
                {/* Header */}
                <div className="text-center border-b-2 border-primary/40 pb-4 space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-muted-foreground pb-1">
                    <span>المملكة العربية السعودية • وزارة التعليم</span>
                    <span>مجمع مدارس المستقبل الأهلية النموذجية</span>
                  </div>
                  <h2 className="text-2xl font-black text-primary tracking-wide">
                    {timetableMode === "student" ? "جدول اختبارات الفصل الدراسي المعتمد" : "كشف لجان الامتحانات وتوزيع الملاحظين والمراقبين"}
                  </h2>
                  <p className="text-sm font-bold text-foreground">
                    فترة: <span className="text-primary font-black">{currentExam?.name || "اختبارات الفصل الدراسي"}</span> • الصف: <span className="text-primary font-black">{selectedGrade}</span> {selectedSectionId ? `(شعبة ${sectionsForGrade.find(s => s.id === selectedSectionId)?.name})` : "(جميع الشعب)"}
                  </p>
                </div>

                {/* Table */}
                <table className="w-full border-collapse border border-foreground/30 text-xs">
                  <thead>
                    <tr className="bg-muted/70 text-foreground">
                      <th className="border border-foreground/30 p-2.5 text-center font-black">اليوم</th>
                      <th className="border border-foreground/30 p-2.5 text-center font-black">التاريخ</th>
                      <th className="border border-foreground/30 p-2.5 text-right font-black">المادة الدراسية</th>
                      <th className="border border-foreground/30 p-2.5 text-center font-black">وقت البدء</th>
                      <th className="border border-foreground/30 p-2.5 text-center font-black">وقت الانتهاء</th>
                      <th className="border border-foreground/30 p-2.5 text-center font-black">المدة</th>
                      <th className="border border-foreground/30 p-2.5 text-center font-black">القاعة / اللجنة</th>
                      {timetableMode === "admin" && (
                        <>
                          <th className="border border-foreground/30 p-2.5 text-right font-black">المراقب المكلف</th>
                          <th className="border border-foreground/30 p-2.5 text-center font-black w-24">توقيع الاستلام</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {timetableItems.map((item, idx) => {
                      const sub = activeStageSubjects.find(s => s.id === item.subjectId);
                      const start = item.startTime || "08:00";
                      const dur = item.duration || 90;
                      const end = calculateEndTime(start, dur);
                      const dayName = getArabicDayName(item.date);
                      return (
                        <tr key={item.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                          <td className="border border-foreground/30 p-2.5 text-center font-bold">{dayName}</td>
                          <td className="border border-foreground/30 p-2.5 text-center tabular-nums" dir="ltr">{item.date}</td>
                          <td className="border border-foreground/30 p-2.5 font-black text-foreground">{sub?.name || item.subjectId}</td>
                          <td className="border border-foreground/30 p-2.5 text-center tabular-nums font-bold" dir="ltr">{start}</td>
                          <td className="border border-foreground/30 p-2.5 text-center tabular-nums font-bold" dir="ltr">{end}</td>
                          <td className="border border-foreground/30 p-2.5 text-center tabular-nums">{dur} دقيقة</td>
                          <td className="border border-foreground/30 p-2.5 text-center font-black">{item.room || "قاعة عامة"}</td>
                          {timetableMode === "admin" && (
                            <>
                              <td className="border border-foreground/30 p-2.5 font-bold text-primary">{item.invigilator || "مشرف اللجنة المناوب"}</td>
                              <td className="border border-foreground/30 p-2.5 text-center text-[10px] text-muted-foreground">..................</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Footer Notes / Signatures */}
                {timetableMode === "student" ? (
                  <div className="p-4 border border-border/80 rounded-2xl bg-muted/20 text-xs space-y-1.5">
                    <p className="font-black text-primary">توجيهات وضوابط أداء الاختبارات لأبنائنا الطلاب وأولياء الأمور:</p>
                    <p className="text-muted-foreground">• الحضور إلى مقر المدرسة قبل موعد الاختبار بـ 15 دقيقة على الأقل، ولن يسمح بدخول المتأخرين بعد بدء الاختبار.</p>
                    <p className="text-muted-foreground">• إحضار كافة الأدوات والقرطاسية المدرسية اللازمة للاختبار، ويمنع تبادل الأدوات داخل اللجان.</p>
                    <p className="text-muted-foreground">• يمنع منعاً باتاً إدخال أجهزة الهواتف المحمولة أو الساعات الذكية إلى قاعات ولجان الاختبارات.</p>
                    <p className="text-muted-foreground">• الالتزام بالهدوء التام والزي المدرسي المعتمد طوال فترة أداء الاختبارات.</p>
                  </div>
                ) : (
                  <div className="p-4 border border-foreground/30 rounded-2xl bg-muted/20 text-xs space-y-1.5">
                    <p className="font-black text-foreground">تعليمات تنظيم لجان الكنترول والمراقبة:</p>
                    <p className="text-muted-foreground">• يستلم الملاحظ مظروف الأسئلة من غرفة الكنترول قبل موعد الاختبار بـ 20 دقيقة، مع التوقيع بالسجل الرسمي.</p>
                    <p className="text-muted-foreground">• التأكد من مطابقة عدد أوراق الإجابة لعدد الطلاب الحاضرين وتدوين الغياب فوراً في محضر اللجنة.</p>
                  </div>
                )}

                <div className="grid grid-cols-3 pt-4 text-center text-xs font-black">
                  <div>
                    <p className="text-muted-foreground mb-6">{timetableMode === "student" ? "المرشد الطلابي" : "مسؤول تسليم اللجان"}</p>
                    <p className="border-t border-dashed border-foreground/40 pt-1 w-36 mx-auto">التوقيع</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-6">رئيس لجنة الكنترول والاختبارات</p>
                    <p className="border-t border-dashed border-foreground/40 pt-1 w-36 mx-auto">المراجعة والتدقيق</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-6">مدير المدرسة والختم الرسمي</p>
                    <p className="border-t border-dashed border-foreground/40 pt-1 w-36 mx-auto">الختم والاعتماد</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageCard>

      {/* Advanced Print Engine Modal */}
      {isPrintOpen && (
        <AdvancedPrintEngine
          isOpen={isPrintOpen}
          data={timetableItems}
          templates={[timetableMode === "student" ? studentPrintTemplate : adminPrintTemplate]}
          title={timetableMode === "student" ? `جدول اختبارات - ${currentExam?.name || ""} - ${selectedGrade}` : `كشف لجان الامتحانات - ${currentExam?.name || ""} - ${selectedGrade}`}
          onClose={() => setIsPrintOpen(false)}
        />
      )}
    </div>
  );
}

