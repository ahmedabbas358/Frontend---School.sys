import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { ArabicDatePicker } from "@/components/ui/arabic-date-picker";
import { 
  Plus, 
  Pencil, 
  Calendar, 
  CheckCircle2, 
  X, 
  GraduationCap, 
  Users, 
  Layers3, 
  CalendarDays, 
  Clock, 
  Sparkles, 
  ArrowRightLeft, 
  Lock, 
  Unlock, 
  Trash2, 
  Check, 
  AlertTriangle, 
  ChevronLeft, 
  BookOpen, 
  TrendingUp, 
  SlidersHorizontal,
  ChevronRight,
  School,
  ArrowUpRight,
  CheckCircle,
  HelpCircle,
  FolderArchive
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/academic/years")({
  head: () => ({ meta: [{ title: "إدارة السنوات والتقويم الدراسي | منصة مدارس" }] }),
  component: AcademicYearsPage,
});

interface TermConfig {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "completed" | "active" | "upcoming";
}

const DEFAULT_TERMS: Record<string, TermConfig[]> = {
  default: [
    { id: "term-1", name: "الفصل الدراسي الأول", startDate: "2024-08-18", endDate: "2024-11-28", status: "completed" },
    { id: "term-2", name: "الفصل الدراسي الثاني", startDate: "2024-12-08", endDate: "2025-02-27", status: "active" },
    { id: "term-3", name: "الفصل الدراسي الثالث", startDate: "2025-03-09", endDate: "2025-06-15", status: "upcoming" },
  ],
};

function AcademicYearsPage() {
  const { 
    allAcademicYears,
    updateAcademicYear,
    addAcademicYear,
    currentAcademicYearId,
    allStudents,
    allSections,
    allStaff,
    allStudentEnrollments,
    promoteStudents
  } = useGlobalStore();

  const { stage, getStageLabel } = useStage();

  const [selectedYearId, setSelectedYearId] = useState<string>(() => {
    const current = allAcademicYears.find((y) => y.isCurrent);
    return current?.id || allAcademicYears[allAcademicYears.length - 1]?.id || "Y-1002";
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    termSystem: "3_terms" as "3_terms" | "2_terms",
  });

  // Selected Year Object
  const selectedYear = useMemo(() => {
    return allAcademicYears.find((y) => y.id === selectedYearId) || allAcademicYears.find((y) => y.isCurrent) || allAcademicYears[0];
  }, [allAcademicYears, selectedYearId]);

  // Current Active Year Object
  const currentActiveYear = useMemo(() => {
    return allAcademicYears.find((y) => y.isCurrent) || selectedYear;
  }, [allAcademicYears, selectedYear]);

  // Students count in selected academic year
  const enrolledCount = useMemo(() => {
    if (!selectedYear) return allStudents.length;
    const enrollments = (allStudentEnrollments || []).filter(e => e.academicYearId === selectedYear.id);
    return enrollments.length > 0 ? enrollments.length : allStudents.length;
  }, [allStudentEnrollments, selectedYear, allStudents]);

  // Academic Calendar Progress Calculation
  const progressMetrics = useMemo(() => {
    if (!selectedYear?.startDate || !selectedYear?.endDate) {
      return { percentage: 65, daysPassed: 180, daysRemaining: 95, totalDays: 275 };
    }
    const start = new Date(selectedYear.startDate).getTime();
    const end = new Date(selectedYear.endDate).getTime();
    const now = new Date().getTime();

    const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    const daysPassed = Math.max(0, Math.min(totalDays, Math.round((now - start) / (1000 * 60 * 60 * 24))));
    const daysRemaining = Math.max(0, totalDays - daysPassed);
    const percentage = Math.min(100, Math.max(0, Math.round((daysPassed / totalDays) * 100)));

    return { percentage, daysPassed, daysRemaining, totalDays };
  }, [selectedYear]);

  const openAddModal = () => {
    setEditingId(null);
    const nextHijriYear = allAcademicYears.length + 1445;
    setFormData({ 
      name: `العام الدراسي ${nextHijriYear} - ${nextHijriYear + 1} هـ`, 
      startDate: "2025-08-24", 
      endDate: "2026-06-18", 
      isCurrent: false,
      termSystem: "3_terms"
    });
    setIsModalOpen(true);
  };

  const openEditModal = (year: any) => {
    setEditingId(year.id);
    setFormData({ 
      name: year.name, 
      startDate: year.startDate, 
      endDate: year.endDate, 
      isCurrent: !!year.isCurrent,
      termSystem: "3_terms"
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("يرجى تعبئة جميع الحقول وتحديد تواريخ البداية والنهاية");
      return;
    }
    if (editingId) {
      updateAcademicYear(editingId, {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isCurrent: formData.isCurrent
      });
      toast.success("تم تحديث بيانات السنة الدراسية بنجاح!");
    } else {
      addAcademicYear({
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isCurrent: formData.isCurrent
      });
      toast.success("تمت إضافة السنة الدراسية الجديدة بنجاح إلى النظام!");
    }
    setIsModalOpen(false);
  };

  const handleSetActive = (year: any) => {
    updateAcademicYear(year.id, { isCurrent: true });
    setSelectedYearId(year.id);
    toast.success(`تم اعتماد "${year.name}" كسنة دراسية نشطة لكافة أقسام النظام!`);
  };

  // Promotion Wizard State
  const [targetPromotionYearId, setTargetPromotionYearId] = useState<string>("");
  const handleExecutePromotion = () => {
    if (!targetPromotionYearId) {
      toast.error("يرجى تحديد العام الدراسي المستهدف للترحيل");
      return;
    }
    if (promoteStudents) {
      promoteStudents(selectedYearId, targetPromotionYearId);
    }
    setIsPromotionModalOpen(false);
    toast.success(`تم ترحيل وترفيع جميع الطلاب بنجاح إلى العام الجديد!`);
  };

  return (
    <AppShell
      title="السنوات والتقويم الأكاديمي"
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الإدارة الأكاديمية", to: "/academic/classes" },
        { label: "السنوات والتقويم الدراسي" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPromotionModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-extrabold border border-amber-500/20 transition-all shadow-xs"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>محرك ترحيل الطلاب السنوي</span>
          </button>

          <button 
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-black rounded-xl hover:bg-primary/90 transition-all shadow-md glow-primary"
          >
            <Plus className="h-4 w-4" /> 
            <span>إضافة سنة دراسية</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-300">
        
        {/* =========================================================
            Hero Header Banner with Active Year Status
            ========================================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-7 text-white shadow-xl">
          <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-md border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>العام الأكاديمي المعتمد للنظام</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {currentActiveYear?.name || "١٤٤٦ هـ"}
              </h2>
              <p className="max-w-2xl text-xs sm:text-sm text-blue-100/90 leading-relaxed">
                يتم ربط وحفظ سجلات الطلاب، الحضور، الدرجات، الرسوم المالية، والجدول الأسبوعي وفق السنة الدراسية النشطة.
              </p>
            </div>

            {/* Academic Days Progress Indicator */}
            <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-md border border-white/10 min-w-[260px] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-blue-200">نسبة انقضاء التقويم الدراسي:</span>
                <span className="font-extrabold text-white">{progressMetrics.percentage}٪</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500" 
                  style={{ width: `${progressMetrics.percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-blue-200 pt-1">
                <span>انقضى: {progressMetrics.daysPassed} يوم</span>
                <span>المتبقي: {progressMetrics.daysRemaining} يوم</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            Key Academic Metrics Cards for the Selected Year
            ========================================================= */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 sm:p-5 rounded-2xl border border-border/70 glass-card">
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                {selectedYear?.name}
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-foreground">{enrolledCount.toLocaleString("en-US")}</div>
              <div className="text-xs font-bold text-muted-foreground mt-0.5">الطلاب المقيدون بالعام</div>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl border border-border/70 glass-card">
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Layers3 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                الشُعب النشطة
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-foreground">{(allSections || []).length}</div>
              <div className="text-xs font-bold text-muted-foreground mt-0.5">الفصول والشعب الدراسية</div>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl border border-border/70 glass-card">
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <School className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500">
                الكادر التعليمي
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-foreground">{(allStaff || []).length}</div>
              <div className="text-xs font-bold text-muted-foreground mt-0.5">المعلمون والمشرفون</div>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl border border-border/70 glass-card">
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <CalendarDays className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                الفصل الحالي
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-foreground">الفصل الثاني</div>
              <div className="text-xs font-bold text-muted-foreground mt-0.5">من أصل ٣ فصول دراسية</div>
            </div>
          </div>
        </div>

        {/* =========================================================
            Academic Years List & Operations Table
            ========================================================= */}
        <PageCard
          title="سجل السنوات الدراسية والأرشيف الأكاديمي"
          description="إدارة الأعوام السابقة والحالية والمستقبلية وتحديد السنة النشطة في النظام"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground bg-muted/20">
                  <th className="py-3.5 px-4 font-bold rounded-r-xl">اسم السنة الدراسية</th>
                  <th className="py-3.5 px-4 font-bold">تاريخ البداية</th>
                  <th className="py-3.5 px-4 font-bold">تاريخ النهاية</th>
                  <th className="py-3.5 px-4 font-bold">المدة والتقدم</th>
                  <th className="py-3.5 px-4 font-bold text-center">الحالة في النظام</th>
                  <th className="py-3.5 px-4 font-bold text-center rounded-l-xl">التحكم والإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {allAcademicYears.map((year) => {
                  const isCurrent = !!year.isCurrent;
                  const isSelected = selectedYearId === year.id;
                  return (
                    <tr 
                      key={year.id} 
                      onClick={() => setSelectedYearId(year.id)}
                      className={`transition-colors cursor-pointer ${
                        isSelected 
                          ? "bg-primary/5 font-bold" 
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`grid h-8 w-8 place-items-center rounded-lg font-bold text-xs ${
                            isCurrent ? "bg-primary text-primary-foreground shadow-sm glow-primary" : "bg-muted text-muted-foreground"
                          }`}>
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-extrabold text-foreground text-sm">{year.name}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">معرف النظام: {year.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-bold text-foreground tabular-nums" dir="ltr">
                        {year.startDate}
                      </td>

                      <td className="py-4 px-4 font-bold text-foreground tabular-nums" dir="ltr">
                        {year.endDate}
                      </td>

                      <td className="py-4 px-4 min-w-[140px]">
                        <div className="space-y-1">
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${isCurrent ? "bg-primary" : "bg-muted-foreground/50"}`} 
                              style={{ width: isCurrent ? `${progressMetrics.percentage}%` : "100%" }}
                            />
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {isCurrent ? `${progressMetrics.percentage}٪ منقضي` : "سنة مكتملة"}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        {isCurrent ? (
                          <Badge tone="success" className="px-3 py-1">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            <span>السنة النشطة حالياً</span>
                          </Badge>
                        ) : (
                          <Badge tone="neutral" className="px-2.5 py-0.5">
                            <span>أرشيف منتهي</span>
                          </Badge>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleSetActive(year)}
                              className="px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-bold transition-all"
                              title="تعيين كسنة نشطة للنظام"
                            >
                              تفعيل كنشط
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openEditModal(year)}
                            className="p-1.5 rounded-lg border border-border/80 bg-card hover:bg-accent text-foreground transition-colors"
                            title="تعديل المواعيد"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </PageCard>

        {/* =========================================================
            Semesters & Terms Detailed Breakdown for Selected Year
            ========================================================= */}
        <PageCard
          title={`الفصول والتقويم التفصيلي لـ (${selectedYear?.name || "العام المحدد"})`}
          description="متابعة تواريخ بدايات ونهايات الفصول الدراسية وفترات الاختبارات"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {DEFAULT_TERMS.default.map((term, idx) => (
              <div 
                key={term.id} 
                className={`p-4 rounded-2xl border transition-all ${
                  term.status === "active" 
                    ? "bg-primary/5 border-primary/40 shadow-sm ring-1 ring-primary/20" 
                    : "bg-muted/20 border-border/60"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary/10 text-primary font-black text-xs">
                      {idx + 1}
                    </span>
                    <h4 className="font-extrabold text-xs text-foreground">{term.name}</h4>
                  </div>
                  <Badge 
                    tone={term.status === "active" ? "success" : term.status === "completed" ? "neutral" : "info"}
                    className="text-[9px] px-2 py-0"
                  >
                    {term.status === "active" ? "نشط حالياً" : term.status === "completed" ? "مكتمل" : "قادم"}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <span>تاريخ البداية:</span>
                    <span className="font-bold text-foreground tabular" dir="ltr">{term.startDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>تاريخ النهاية:</span>
                    <span className="font-bold text-foreground tabular" dir="ltr">{term.endDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PageCard>

      </div>

      {/* =========================================================
          Modal: Luxury Add / Edit Academic Year (with ArabicDatePicker)
          ========================================================= */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-lg bg-card border border-border shadow-2xl rounded-3xl p-6 sm:p-7 overflow-visible animate-in zoom-in-95 duration-150 space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground">
                    {editingId ? "تعديل بيانات السنة الدراسية" : "إضافة سنة دراسية جديدة"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    حدد مسمى العام وتواريخ البداية والنهاية عبر التقويم المدمج
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              
              {/* Year Name */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  اسم السنة الدراسية <span className="text-danger">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="مثال: العام الدراسي ١٤٤٧ - ١٤٤٨ هـ"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-11 rounded-xl border border-input bg-background px-3.5 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Start and End Date with Luxury ArabicDatePicker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <ArabicDatePicker
                    label="تاريخ بداية العام"
                    required
                    value={formData.startDate}
                    onChange={(val) => setFormData({ ...formData, startDate: val })}
                  />
                </div>

                <div>
                  <ArabicDatePicker
                    label="تاريخ نهاية العام"
                    required
                    value={formData.endDate}
                    onChange={(val) => setFormData({ ...formData, endDate: val })}
                  />
                </div>
              </div>

              {/* Active Year Checkbox Box */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 hover:border-primary/40 transition-colors">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isCurrent}
                    onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded text-primary focus:ring-primary/20 accent-primary"
                  />
                  <div className="text-xs">
                    <div className="font-black text-foreground">تعيين كسنة دراسية نشطة ومعتمدة فوراً</div>
                    <div className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">
                      عند التفعيل، ستنتقل كافة العمليات اليومية (تسجيل الطلاب، الحضور، الفواتير، الاختبارات) للعمل تحت مظلة هذه السنة.
                    </div>
                  </div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-input bg-background text-xs font-bold hover:bg-accent text-foreground transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md hover:bg-primary/90 transition-all glow-primary flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ بيانات السنة الدراسية</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          Modal: Annual Student Promotion Wizard
          ========================================================= */}
      {isPromotionModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsPromotionModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-xl bg-card border border-border shadow-2xl rounded-3xl p-6 sm:p-7 overflow-hidden animate-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground">محرك ترحيل وترفيع الطلاب السنوي</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">ترفيع الصفوف وتخريج المراحل المنتهية آلياً</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPromotionModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              يقوم هذا المحرك بترفيع جميع الطلاب الناجحين للصف الدراسي التالي للعام الجديد، وتخريج طلاب الصف الثالث ثانوي آلياً.
            </p>

            <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border/70">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-muted-foreground">العام الدراسي الحالي (المصدر):</span>
                <span className="font-black text-foreground text-sm">{selectedYear?.name}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">العام الدراسي الجديد (الهدف):</label>
                <select
                  value={targetPromotionYearId}
                  onChange={(e) => setTargetPromotionYearId(e.target.value)}
                  className="w-full h-11 rounded-xl border border-input bg-background px-3.5 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">-- اختر العام الدراسي للترحيل --</option>
                  {allAcademicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name} {y.isCurrent ? "(النشط حالياً)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div className="leading-relaxed text-[11px]">
                تنبيه أمان: سيتم نقل الطلاب للصفوف التالية وتحديث الشعب تلقائياً، والاحتفاظ بالسجلات الأكاديمية والمالية السابقة في أرشيف العام المنتهي دون أي حذف.
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsPromotionModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-input bg-background text-xs font-bold hover:bg-accent text-foreground transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecutePromotion}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md transition-all flex items-center gap-1.5"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>بدء عملية الترفيع الشامل</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}
