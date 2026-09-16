import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { useGlobalStore, TermConfig, enrichYearWithTerms } from "@/contexts/GlobalStoreContext";
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
  FolderArchive,
  ShieldCheck,
  Printer,
  FileText,
  CalendarClock
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/academic/years")({
  head: () => ({ meta: [{ title: "إدارة السنوات والتقويم الدراسي | منصة مدارس" }] }),
  component: AcademicYearsPage,
});

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
    updateAcademicYearTerms,
    setActiveTerm,
    switchYearTermSystem,
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

  // Dynamic Terms for Selected Year (Preserves customization and falls back seamlessly)
  const selectedYearTerms = useMemo(() => {
    if (!selectedYear) return [];
    if (selectedYear.terms && selectedYear.terms.length > 0) {
      return selectedYear.terms;
    }
    return enrichYearWithTerms(selectedYear).terms || [];
  }, [selectedYear]);

  // Active Term for Selected Year
  const activeTermForSelectedYear = useMemo(() => {
    return selectedYearTerms.find(t => t.status === "active" || t.id === selectedYear?.activeTermId) || selectedYearTerms[0];
  }, [selectedYearTerms, selectedYear]);

  // Term Management State
  const [isEditTermModalOpen, setIsEditTermModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<TermConfig | null>(null);
  const [termFormData, setTermFormData] = useState({
    id: "",
    name: "",
    startDate: "",
    endDate: "",
    status: "upcoming" as "completed" | "active" | "upcoming",
    hasExams: false,
    examStartDate: "",
    examEndDate: "",
    weightPercent: 33,
    notes: "",
  });

  const [isAddTermModalOpen, setIsAddTermModalOpen] = useState(false);
  const [newTermData, setNewTermData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    status: "upcoming" as "completed" | "active" | "upcoming",
    hasExams: false,
    examStartDate: "",
    examEndDate: "",
    weightPercent: 33,
    notes: "",
  });

  const [isPrintCalendarModalOpen, setIsPrintCalendarModalOpen] = useState(false);

  // Term Action Handlers
  const openEditTermModal = (term: TermConfig) => {
    setEditingTerm(term);
    setTermFormData({
      id: term.id,
      name: term.name,
      startDate: term.startDate,
      endDate: term.endDate,
      status: term.status,
      hasExams: !!(term.examStartDate && term.examEndDate),
      examStartDate: term.examStartDate || "",
      examEndDate: term.examEndDate || "",
      weightPercent: term.weightPercent ?? 33,
      notes: term.notes || "",
    });
    setIsEditTermModalOpen(true);
  };

  const handleSaveTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYear) return;
    if (!termFormData.name || !termFormData.startDate || !termFormData.endDate) {
      toast.error("يرجى تعبئة مسمى الفصل وتواريخ البداية والنهاية");
      return;
    }

    const updatedTerms: TermConfig[] = selectedYearTerms.map(t => {
      if (t.id === termFormData.id) {
        return {
          ...t,
          name: termFormData.name,
          startDate: termFormData.startDate,
          endDate: termFormData.endDate,
          status: termFormData.status,
          examStartDate: termFormData.hasExams ? termFormData.examStartDate : undefined,
          examEndDate: termFormData.hasExams ? termFormData.examEndDate : undefined,
          weightPercent: Number(termFormData.weightPercent) || 33,
          notes: termFormData.notes,
        };
      }
      if (termFormData.status === "active" && t.status === "active") {
        return { ...t, status: "completed" as const };
      }
      return t;
    });

    updateAcademicYearTerms(selectedYear.id, updatedTerms);
    if (termFormData.status === "active") {
      setActiveTerm(selectedYear.id, termFormData.id);
    }
    setIsEditTermModalOpen(false);
    toast.success(`تم تحديث بيانات "${termFormData.name}" بنجاح!`);
  };

  const openAddTermModal = () => {
    if (!selectedYear) return;
    const lastTerm = selectedYearTerms[selectedYearTerms.length - 1];
    let defaultStart = selectedYear.startDate;
    let defaultEnd = selectedYear.endDate;

    if (lastTerm?.endDate) {
      const lastEndDate = new Date(lastTerm.endDate);
      const nextStart = new Date(lastEndDate.getTime() + 86400000 * 7);
      const nextEnd = new Date(nextStart.getTime() + 86400000 * 85);
      defaultStart = nextStart.toISOString().split("T")[0];
      defaultEnd = nextEnd.toISOString().split("T")[0];
    }

    const nextIndex = selectedYearTerms.length + 1;
    const defaultName = nextIndex === 4 ? "الفصل الصيفي" : `الفصل الدراسي ${nextIndex === 1 ? "الأول" : nextIndex === 2 ? "الثاني" : nextIndex === 3 ? "الثالث" : nextIndex}`;

    setNewTermData({
      name: defaultName,
      startDate: defaultStart,
      endDate: defaultEnd,
      status: "upcoming",
      hasExams: false,
      examStartDate: "",
      examEndDate: "",
      weightPercent: Math.round(100 / (selectedYearTerms.length + 1)),
      notes: "",
    });
    setIsAddTermModalOpen(true);
  };

  const handleSaveNewTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYear) return;
    if (!newTermData.name || !newTermData.startDate || !newTermData.endDate) {
      toast.error("يرجى تعبئة مسمى الفصل وتواريخ البداية والنهاية");
      return;
    }

    const newTerm: TermConfig = {
      id: `term-${selectedYear.id}-${Date.now()}`,
      name: newTermData.name,
      startDate: newTermData.startDate,
      endDate: newTermData.endDate,
      status: newTermData.status,
      examStartDate: newTermData.hasExams ? newTermData.examStartDate : undefined,
      examEndDate: newTermData.hasExams ? newTermData.examEndDate : undefined,
      weightPercent: Number(newTermData.weightPercent) || 25,
      notes: newTermData.notes,
    };

    let updatedTerms = [...selectedYearTerms, newTerm];
    if (newTermData.status === "active") {
      updatedTerms = updatedTerms.map(t => t.id === newTerm.id ? t : (t.status === "active" ? { ...t, status: "completed" as const } : t));
    }

    updateAcademicYearTerms(selectedYear.id, updatedTerms);
    if (newTermData.status === "active") {
      setActiveTerm(selectedYear.id, newTerm.id);
    }
    setIsAddTermModalOpen(false);
    toast.success(`تمت إضافة "${newTerm.name}" إلى العام الدراسي بنجاح!`);
  };

  const handleDeleteTerm = (termId: string) => {
    if (!selectedYear) return;
    if (selectedYearTerms.length <= 1) {
      toast.error("لا يمكن حذف الفصل الوحيد المتبقي في العام الدراسي");
      return;
    }
    const target = selectedYearTerms.find(t => t.id === termId);
    if (!confirm(`هل أنت متأكد من حذف "${target?.name || 'هذا الفصل'}" من التقويم الأكاديمي؟`)) {
      return;
    }

    const updatedTerms = selectedYearTerms.filter(t => t.id !== termId);
    if (target?.status === "active" && updatedTerms.length > 0) {
      updatedTerms[0].status = "active";
    }

    updateAcademicYearTerms(selectedYear.id, updatedTerms);
    toast.success(`تم حذف الفصل بنجاح من التقويم الدراسي`);
  };

  const handleActivateTerm = (termId: string) => {
    if (!selectedYear) return;
    setActiveTerm(selectedYear.id, termId);
    const target = selectedYearTerms.find(t => t.id === termId);
    toast.success(`تم اعتماد "${target?.name || 'الفصل الدراسي'}" كفصل نشط ومعتمد في النظام!`);
  };

  const handleSwitchTermSystem = (system: "3_terms" | "2_terms") => {
    if (!selectedYear) return;
    switchYearTermSystem(selectedYear.id, system);
    toast.success(`تم تحويل النظام الأكاديمي للعام (${selectedYear.name}) إلى ${system === "3_terms" ? "نظام 3 فصول دراسية" : "نظام فصلين دراسيين"}!`);
  };

  const handleRecalibrateDates = () => {
    if (!selectedYear) return;
    const rawSys = selectedYear.termSystem;
    const sys: "3_terms" | "2_terms" = (rawSys === "3_terms" || rawSys === "2_terms") ? rawSys : (selectedYearTerms.length === 2 ? "2_terms" : "3_terms");
    switchYearTermSystem(selectedYear.id, sys);
    toast.success("تمت إعادة جدولة وتوزيع تواريخ الفصول بالتساوي وفق بداية ونهاية العام الدراسي!");
  };

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

  // System Year Rollover Engine State
  const [isRolloverModalOpen, setIsRolloverModalOpen] = useState(false);
  const [targetRolloverYearId, setTargetRolloverYearId] = useState<string>("");
  const [rolloverOptions, setRolloverOptions] = useState({
    sections: true,
    curricula: true,
    fees: true,
    balances: true,
    activateYear: true,
  });

  const { rolloverFinancialBalances } = useGlobalStore();

  const handleExecuteSystemRollover = () => {
    if (!targetRolloverYearId) {
      toast.error("يرجى اختيار العام الدراسي المستهدف للترحيل والتجهيز");
      return;
    }

    if (targetRolloverYearId === selectedYearId) {
      toast.error("لا يمكن ترحيل البيانات إلى نفس العام الدراسي الحالي");
      return;
    }

    const targetYear = allAcademicYears.find((y) => y.id === targetRolloverYearId);
    if (!targetYear) return;

    // 1. Activate Year if requested
    if (rolloverOptions.activateYear) {
      updateAcademicYear(targetYear.id, { isCurrent: true });
      setSelectedYearId(targetYear.id);
    }

    // 2. Rollover Financial Balances (Continuous ledger)
    if (rolloverOptions.balances && rolloverFinancialBalances) {
      rolloverFinancialBalances(selectedYearId, targetRolloverYearId);
    }

    setIsRolloverModalOpen(false);
    toast.success(`تم بنجاح ترحيل وتجهيز هيكل وبيانات العام الدراسي الجديد (${targetYear.name})! النظام جاهز لاستقبال وتسجيل الطلاب بالرقم الوطني أو الإقامة.`);
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
            onClick={() => setIsRolloverModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-extrabold border border-primary/20 transition-all shadow-xs"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>محرك إعداد وترحيل بيانات العام الجديد</span>
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
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight whitespace-nowrap text-white" dir="rtl">
                {currentActiveYear?.name || "العام الدراسي 1446 - 1447 هـ"}
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
              <div className="text-2xl font-black text-foreground truncate">
                {activeTermForSelectedYear?.name || "الفصل الثاني"}
              </div>
              <div className="text-xs font-bold text-muted-foreground mt-0.5">
                من أصل {selectedYearTerms.length} {selectedYearTerms.length === 2 ? "فصلين دراسيين" : "فصول دراسية"}
              </div>
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
          description="إدارة فترات وتواريخ الفصول الدراسية، فترات الاختبارات، وتحديد الفصل النشط للنظام"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {/* System Switcher Pill */}
              <div className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border/70 text-xs">
                <button
                  type="button"
                  onClick={() => handleSwitchTermSystem("3_terms")}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs ${
                    (selectedYear?.termSystem || "3_terms") === "3_terms"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  }`}
                  title="نظام 3 فصول دراسية (النموذج الوزاري الحديث)"
                >
                  <Layers3 className="w-3.5 h-3.5" />
                  <span>3 فصول</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchTermSystem("2_terms")}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs ${
                    selectedYear?.termSystem === "2_terms"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  }`}
                  title="نظام فصلين دراسيين تقليدي"
                >
                  <Layers3 className="w-3.5 h-3.5" />
                  <span>فصلين</span>
                </button>
              </div>

              {/* Recalibrate Dates */}
              <button
                type="button"
                onClick={handleRecalibrateDates}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/70 bg-card hover:bg-accent text-xs font-bold text-foreground transition-all shadow-xs"
                title="إعادة جدولة وتوزيع التواريخ تلقائياً وفق مدة العام"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">إعادة جدولة تلقائية</span>
              </button>

              {/* Print Official Calendar */}
              <button
                type="button"
                onClick={() => setIsPrintCalendarModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/70 bg-card hover:bg-accent text-xs font-bold text-foreground transition-all shadow-xs"
                title="طباعة وتصدير التقويم الأكاديمي المعتمد"
              >
                <Printer className="w-3.5 h-3.5 text-blue-500" />
                <span>طباعة التقويم</span>
              </button>

              {/* Add New Term */}
              <button
                type="button"
                onClick={openAddTermModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 transition-all shadow-sm glow-primary"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة فصل / فترة</span>
              </button>
            </div>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectedYearTerms.map((term, idx) => {
              const isActive = term.status === "active";
              const isCompleted = term.status === "completed";
              const isUpcoming = term.status === "upcoming";

              const termStart = new Date(term.startDate).getTime();
              const termEnd = new Date(term.endDate).getTime();
              const totalDays = Math.max(1, Math.round((termEnd - termStart) / (1000 * 60 * 60 * 24)));
              const now = new Date().getTime();
              const daysPassed = Math.max(0, Math.min(totalDays, Math.round((now - termStart) / (1000 * 60 * 60 * 24))));
              const daysRemaining = Math.max(0, totalDays - daysPassed);
              const percentage = isCompleted ? 100 : isUpcoming ? 0 : Math.min(100, Math.max(0, Math.round((daysPassed / totalDays) * 100)));
              const weeksCount = Math.max(1, Math.round(totalDays / 7));

              return (
                <div 
                  key={term.id} 
                  className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                    isActive 
                      ? "bg-card border-primary/60 shadow-md ring-2 ring-primary/20" 
                      : "bg-card/70 border-border/70 hover:border-primary/30"
                  }`}
                >
                  {/* Top Bar: Order, Name, Status Badge, Quick Actions */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`grid h-7 w-7 place-items-center rounded-xl font-black text-xs shrink-0 ${
                          isActive ? "bg-primary text-primary-foreground shadow-xs" : "bg-primary/10 text-primary"
                        }`}>
                          {idx + 1}
                        </span>
                        <h4 className="font-black text-sm text-foreground truncate">{term.name}</h4>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge 
                          tone={isActive ? "success" : isCompleted ? "neutral" : "info"}
                          className="text-[10px] px-2.5 py-0.5"
                        >
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1 inline-block" />}
                          {isActive ? "نشط حالياً" : isCompleted ? "مكتمل" : "قادم"}
                        </Badge>

                        {/* Action Buttons: Edit & Delete */}
                        <div className="flex items-center gap-1 mr-1">
                          <button
                            type="button"
                            onClick={() => openEditTermModal(term)}
                            className="p-1.5 rounded-lg border border-border/70 bg-card hover:bg-accent text-foreground transition-all"
                            title="تعديل المواعيد والتفاصيل"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {selectedYearTerms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTerm(term.id)}
                              className="p-1.5 rounded-lg border border-danger/30 bg-danger/5 hover:bg-danger/20 text-danger transition-all"
                              title="حذف هذا الفصل من العام الدراسي"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Timeline & Dates Info */}
                    <div className="space-y-2.5 text-xs text-muted-foreground pt-2.5 border-t border-border/40">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-primary/70" />
                          <span>تاريخ البداية:</span>
                        </span>
                        <span className="font-extrabold text-foreground tabular-nums" dir="ltr">{term.startDate}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-primary/70" />
                          <span>تاريخ النهاية:</span>
                        </span>
                        <span className="font-extrabold text-foreground tabular-nums" dir="ltr">{term.endDate}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                          <Clock className="w-3.5 h-3.5 text-amber-500/80" />
                          <span>المدة والأسابيع:</span>
                        </span>
                        <span className="font-bold text-foreground">
                          {totalDays} يوم <span className="text-[11px] text-muted-foreground font-normal">({weeksCount} أسبوع)</span>
                        </span>
                      </div>

                      {/* Exam Schedule Block */}
                      <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-[11px] space-y-1 mt-1">
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1 text-foreground">
                            <CalendarClock className="w-3.5 h-3.5 text-purple-500" />
                            <span>فترة الاختبارات:</span>
                          </span>
                          {term.examStartDate && term.examEndDate ? (
                            <span className="px-1.5 py-0.2 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[10px]">
                              محددة
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openEditTermModal(term)}
                              className="text-[10px] text-primary hover:underline font-bold"
                            >
                              + تحديد المواعيد
                            </button>
                          )}
                        </div>

                        {term.examStartDate && term.examEndDate ? (
                          <div className="text-[10px] text-muted-foreground font-semibold flex items-center justify-between pt-0.5" dir="ltr">
                            <span>{term.examStartDate}</span>
                            <span className="text-muted-foreground/60">←</span>
                            <span>{term.examEndDate}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground/70">لم يتم تخصيص فترة اختبارات لهذا الفصل</div>
                        )}
                      </div>

                      {/* Weight Percentage */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                        <span>الوزن الأكاديمي السنوي:</span>
                        <span className="font-extrabold text-foreground">{term.weightPercent ?? 33}٪</span>
                      </div>

                      {/* Term Progress Bar */}
                      <div className="space-y-1 pt-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">
                            {isActive ? `انقضى: ${daysPassed} يوم` : isCompleted ? "تم إنجاز الفصل كاملاً" : "فصل قادم"}
                          </span>
                          <span className="font-extrabold text-foreground">
                            {isActive ? `${percentage}٪` : isCompleted ? "100٪" : "0٪"}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isActive ? "bg-gradient-to-r from-amber-500 to-emerald-500" : isCompleted ? "bg-muted-foreground/60" : "bg-transparent"
                            }`} 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        {isActive && (
                          <div className="text-[10px] text-muted-foreground text-left" dir="rtl">
                            المتبقي على نهاية الفصل: <span className="font-bold text-foreground">{daysRemaining} يوم</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Activation Control */}
                  <div className="pt-4 mt-3 border-t border-border/50">
                    {isActive ? (
                      <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>الفصل الدراسي النشط والمعتمد حالياً</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleActivateTerm(term.id)}
                        className="w-full py-2.5 px-3 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98]"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تفعيل كفصل دراسي نشط</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </PageCard>

      </div>

      {/* =========================================================
          Modal: Luxury Add / Edit Academic Year (with ArabicDatePicker)
          ========================================================= */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-lg bg-card/98 dark:bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl rounded-3xl p-6 sm:p-7 overflow-visible animate-in zoom-in-95 duration-150 space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary shrink-0">
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
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95"
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
                  placeholder="مثال: العام الدراسي 1447 - 1448 هـ"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-bold text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
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
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 hover:border-primary/40 transition-colors">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isCurrent}
                    onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                    className="mt-0.5 h-4.5 w-4.5 rounded-lg border-2 border-input text-primary focus:ring-4 focus:ring-primary/15 accent-primary cursor-pointer"
                  />
                  <div className="text-xs">
                    <div className="font-black text-foreground">تعيين كسنة دراسية نشطة ومعتمدة فوراً</div>
                    <div className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed font-medium">
                      عند التفعيل، ستنتقل كافة العمليات اليومية (تسجيل الطلاب، الحضور، الفواتير، الاختبارات) للعمل تحت مظلة هذه السنة.
                    </div>
                  </div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-3.5 border-t border-border/60 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-input bg-background text-xs font-bold hover:bg-accent text-foreground transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md hover:bg-primary/90 transition-all active:scale-[0.98] glow-primary flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 font-bold" />
                  <span>حفظ بيانات السنة الدراسية</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          Modal: Annual System Data & Structure Rollover Engine
          ========================================================= */}
      {isRolloverModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsRolloverModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-xl modal-card-luxury p-6 sm:p-7 overflow-hidden animate-in zoom-in-95 duration-150 space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary shrink-0 shadow-xs">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground">محرك إعداد وترحيل بيانات العام الجديد</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">ترحيل الهيكل الأكاديمي، الشعب، والرسوم وتدوير الأرصدة المالية</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRolloverModalOpen(false)}
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Approved Policy Banner */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-2 font-black text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>سياسة النظام المعتمدة لحركة وقيد الطلاب:</span>
              </div>
              <p className="text-[11px] leading-relaxed font-semibold">
                لا يتم ترحيل الطلاب جماعياً أو عشوائياً منعاً لتضارب السجلات وقيد الطلاب المنقطعين. يتم ترفيع وقيد كل طالب فردياً ولحظياً عند حضوره وتسجيله بالرقم الوطني أو رقم الإقامة مع الترفيع التلقائي لصفه واستيراد بياناته.
              </p>
            </div>

            <div className="space-y-3.5 p-4 rounded-2xl bg-muted/30 border border-border/70">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-muted-foreground">العام الدراسي الحالي (المصدر):</span>
                <span className="font-black text-foreground text-sm">{selectedYear?.name}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">العام الدراسي الجديد (الهدف للترحيل):</label>
                <select
                  value={targetRolloverYearId}
                  onChange={(e) => setTargetRolloverYearId(e.target.value)}
                  className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-bold text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs cursor-pointer"
                >
                  <option value="">-- اختر العام الدراسي الهدف --</option>
                  {allAcademicYears.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name} {y.isCurrent ? "(النشط حالياً)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* System Datasets Rollover Checklist */}
              <div className="pt-2.5 border-t border-border/40 space-y-2.5">
                <span className="block text-xs font-extrabold text-foreground">بيانات وهياكل النظام المشمولة بالترحيل:</span>
                
                <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={rolloverOptions.sections}
                    onChange={(e) => setRolloverOptions({ ...rolloverOptions, sections: e.target.checked })}
                    className="h-4 w-4 rounded border-input text-primary accent-primary cursor-pointer"
                  />
                  <span className="font-bold text-foreground">ترحيل وتكرار هيكل الصفوف والشعب الدراسية</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={rolloverOptions.curricula}
                    onChange={(e) => setRolloverOptions({ ...rolloverOptions, curricula: e.target.checked })}
                    className="h-4 w-4 rounded border-input text-primary accent-primary cursor-pointer"
                  />
                  <span className="font-bold text-foreground">ترحيل خطط المواد والمناهج التعليمية المعتمدة</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={rolloverOptions.fees}
                    onChange={(e) => setRolloverOptions({ ...rolloverOptions, fees: e.target.checked })}
                    className="h-4 w-4 rounded border-input text-primary accent-primary cursor-pointer"
                  />
                  <span className="font-bold text-foreground">ترحيل مصفوفة الرسوم الدراسية والخصومات المعتمدة</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={rolloverOptions.balances}
                    onChange={(e) => setRolloverOptions({ ...rolloverOptions, balances: e.target.checked })}
                    className="h-4 w-4 rounded border-input text-primary accent-primary cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-foreground">تدوير أرصدة الذمم والمديونيات السابقة كأرصدة افتتاحية</span>
                    <span className="block text-[10px] text-muted-foreground">حفظ المستحقات المالية السابقة في الدفتر العام دون إنشاء قيود تسجيل وهمية</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs pt-1 border-t border-border/40">
                  <input
                    type="checkbox"
                    checked={rolloverOptions.activateYear}
                    onChange={(e) => setRolloverOptions({ ...rolloverOptions, activateYear: e.target.checked })}
                    className="h-4 w-4 rounded border-input text-primary accent-primary cursor-pointer"
                  />
                  <span className="font-black text-primary">اعتماد وتفعيل العام الجديد كعام دراسي نشط فوراً</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsRolloverModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-input bg-background text-xs font-bold hover:bg-accent text-foreground transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecuteSystemRollover}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black shadow-md transition-all flex items-center gap-1.5 glow-primary"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>بدء ترحيل وتجهيز العام الجديد</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          Modal: Edit Academic Term Details
          ========================================================= */}
      {isEditTermModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsEditTermModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-xl modal-card-luxury p-6 sm:p-7 overflow-visible animate-in zoom-in-95 duration-150 space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary shrink-0 shadow-xs">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground">تعديل بيانات الفصل الدراسي</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                    تعديل المواعيد، فترات الاختبارات، والوزن النسبي لـ ({termFormData.name})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditTermModalOpen(false)}
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTerm} className="space-y-4">
              {/* Fast Quick Name Chips */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">مسمى الفصل الدراسي <span className="text-danger">*</span></label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    "الفصل الدراسي الأول",
                    "الفصل الدراسي الثاني",
                    "الفصل الدراسي الثالث",
                    "الفصل الصيفي",
                    "فترة الاختبارات النهائية"
                  ].map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setTermFormData({ ...termFormData, name })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        termFormData.name === name
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-muted/40 border-border/70 text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <input
                  required
                  type="text"
                  value={termFormData.name}
                  onChange={(e) => setTermFormData({ ...termFormData, name: e.target.value })}
                  className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-bold text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
                  placeholder="اسم الفصل أو الفترة الدراسية..."
                />
              </div>

              {/* Start & End Dates with ArabicDatePicker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <ArabicDatePicker
                    label="تاريخ بداية الفصل الدراسي"
                    required
                    value={termFormData.startDate}
                    onChange={(val) => setTermFormData({ ...termFormData, startDate: val })}
                  />
                </div>
                <div>
                  <ArabicDatePicker
                    label="تاريخ نهاية الفصل الدراسي"
                    required
                    value={termFormData.endDate}
                    onChange={(val) => setTermFormData({ ...termFormData, endDate: val })}
                  />
                </div>
              </div>

              {/* Status and Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">حالة الفصل في النظام</label>
                  <select
                    value={termFormData.status}
                    onChange={(e) => setTermFormData({ ...termFormData, status: e.target.value as any })}
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-bold text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs cursor-pointer"
                  >
                    <option value="active">نشط حالياً (الفصل المعتمد الآن)</option>
                    <option value="completed">مكتمل (منتهي)</option>
                    <option value="upcoming">قادم (مستقبلي)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">الوزن النسبي في المعدل السنوي (٪)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={termFormData.weightPercent}
                      onChange={(e) => setTermFormData({ ...termFormData, weightPercent: Number(e.target.value) })}
                      className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-bold text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
                      placeholder="33"
                    />
                    <span className="absolute left-3.5 top-3 text-xs font-bold text-muted-foreground">٪</span>
                  </div>
                </div>
              </div>

              {/* Exam Period Box Toggle */}
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/70 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="text-xs font-bold text-foreground">تحديد فترة الاختبارات لهذا الفصل</div>
                      <div className="text-[11px] text-muted-foreground">فترة الاختبارات النهائية أو الفترية الخاصة بالفصل</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={termFormData.hasExams}
                    onChange={(e) => setTermFormData({ ...termFormData, hasExams: e.target.checked })}
                    className="h-4.5 w-4.5 rounded-lg border-input text-primary accent-primary cursor-pointer"
                  />
                </label>

                {termFormData.hasExams && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50 animate-in fade-in">
                    <div>
                      <ArabicDatePicker
                        label="تاريخ بداية الاختبارات"
                        value={termFormData.examStartDate}
                        onChange={(val) => setTermFormData({ ...termFormData, examStartDate: val })}
                      />
                    </div>
                    <div>
                      <ArabicDatePicker
                        label="تاريخ نهاية الاختبارات"
                        value={termFormData.examEndDate}
                        onChange={(val) => setTermFormData({ ...termFormData, examEndDate: val })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">ملاحظات أو تفاصيل خاصة بالفصل (اختياري)</label>
                <textarea
                  rows={2}
                  value={termFormData.notes}
                  onChange={(e) => setTermFormData({ ...termFormData, notes: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background/80 p-3 text-xs font-medium text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs resize-none"
                  placeholder="أدخل أي ملاحظات حول الإجازات المطولة أو الاختبارات..."
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditTermModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-input bg-background text-xs font-bold hover:bg-accent text-foreground transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black shadow-md transition-all active:scale-[0.98] glow-primary flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 font-bold" />
                  <span>حفظ تعديلات الفصل</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          Modal: Add New Term / Semester Period
          ========================================================= */}
      {isAddTermModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsAddTermModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-xl modal-card-luxury p-6 sm:p-7 overflow-visible animate-in zoom-in-95 duration-150 space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary shrink-0 shadow-xs">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground">إضافة فصل أو فترة دراسية جديدة</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                    إضافة فترة جديدة لـ ({selectedYear?.name}) مع تحديد المواعيد والاختبارات
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddTermModalOpen(false)}
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewTerm} className="space-y-4">
              {/* Fast Quick Name Chips */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">مسمى الفترة / الفصل <span className="text-danger">*</span></label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    "الفصل الدراسي الثالث",
                    "الفصل الصيفي",
                    "فترة التدريب الميداني",
                    "فترة الاختبارات النهائية"
                  ].map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setNewTermData({ ...newTermData, name })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        newTermData.name === name
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-muted/40 border-border/70 text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <input
                  required
                  type="text"
                  value={newTermData.name}
                  onChange={(e) => setNewTermData({ ...newTermData, name: e.target.value })}
                  className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-bold text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
                  placeholder="مثال: الفصل الصيفي"
                />
              </div>

              {/* Start & End Dates with ArabicDatePicker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <ArabicDatePicker
                    label="تاريخ بداية الفصل"
                    required
                    value={newTermData.startDate}
                    onChange={(val) => setNewTermData({ ...newTermData, startDate: val })}
                  />
                </div>
                <div>
                  <ArabicDatePicker
                    label="تاريخ نهاية الفصل"
                    required
                    value={newTermData.endDate}
                    onChange={(val) => setNewTermData({ ...newTermData, endDate: val })}
                  />
                </div>
              </div>

              {/* Status and Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">حالة الفصل في النظام</label>
                  <select
                    value={newTermData.status}
                    onChange={(e) => setNewTermData({ ...newTermData, status: e.target.value as any })}
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-bold text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs cursor-pointer"
                  >
                    <option value="upcoming">قادم (مستقبلي)</option>
                    <option value="active">نشط حالياً (الفصل المعتمد الآن)</option>
                    <option value="completed">مكتمل (منتهي)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">الوزن النسبي في المعدل السنوي (٪)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newTermData.weightPercent}
                      onChange={(e) => setNewTermData({ ...newTermData, weightPercent: Number(e.target.value) })}
                      className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-bold text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
                      placeholder="25"
                    />
                    <span className="absolute left-3.5 top-3 text-xs font-bold text-muted-foreground">٪</span>
                  </div>
                </div>
              </div>

              {/* Exam Period Box Toggle */}
              <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/70 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="text-xs font-bold text-foreground">تحديد فترة الاختبارات لهذه الفترة</div>
                      <div className="text-[11px] text-muted-foreground">تحديد مواعيد بدء وانتهاء الاختبارات</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newTermData.hasExams}
                    onChange={(e) => setNewTermData({ ...newTermData, hasExams: e.target.checked })}
                    className="h-4.5 w-4.5 rounded-lg border-input text-primary accent-primary cursor-pointer"
                  />
                </label>

                {newTermData.hasExams && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50 animate-in fade-in">
                    <div>
                      <ArabicDatePicker
                        label="تاريخ بداية الاختبارات"
                        value={newTermData.examStartDate}
                        onChange={(val) => setNewTermData({ ...newTermData, examStartDate: val })}
                      />
                    </div>
                    <div>
                      <ArabicDatePicker
                        label="تاريخ نهاية الاختبارات"
                        value={newTermData.examEndDate}
                        onChange={(val) => setNewTermData({ ...newTermData, examEndDate: val })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">ملاحظات إضافية (اختياري)</label>
                <textarea
                  rows={2}
                  value={newTermData.notes}
                  onChange={(e) => setNewTermData({ ...newTermData, notes: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background/80 p-3 text-xs font-medium text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs resize-none"
                  placeholder="أي تفاصيل خاصة..."
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddTermModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-input bg-background text-xs font-bold hover:bg-accent text-foreground transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black shadow-md transition-all active:scale-[0.98] glow-primary flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 font-bold" />
                  <span>إضافة الفصل إلى التقويم</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          Modal: Print Official Academic Calendar Document
          ========================================================= */}
      {isPrintCalendarModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsPrintCalendarModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-2xl modal-card-luxury p-6 sm:p-8 overflow-hidden animate-in zoom-in-95 duration-150 space-y-6 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Action Bar (Top of Print Preview) */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3.5 print:hidden">
              <div className="flex items-center gap-2 font-black text-sm text-foreground">
                <FileText className="w-4 h-4 text-primary" />
                <span>معاينة وطباعة التقويم الأكاديمي المعتمد</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md hover:bg-primary/90 transition-all flex items-center gap-1.5 glow-primary"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الآن</span>
                </button>
                <button
                  onClick={() => setIsPrintCalendarModalOpen(false)}
                  className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Container */}
            <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border/80 shadow-sm space-y-6 text-foreground print:border-none print:shadow-none print:p-0">
              {/* Ministry & School Letterhead Header */}
              <div className="flex items-center justify-between border-b-2 border-foreground/80 pb-4 text-center">
                <div className="text-right space-y-0.5 text-xs font-bold">
                  <div>المملكة العربية السعودية</div>
                  <div>وزارة التعليم</div>
                  <div className="text-primary font-black">مدارس الأجيال النموذجية الأهلية</div>
                </div>

                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <School className="w-8 h-8" />
                </div>

                <div className="text-left space-y-0.5 text-xs font-bold" dir="ltr">
                  <div>Kingdom of Saudi Arabia</div>
                  <div>Ministry of Education</div>
                  <div>Model Academy Schools</div>
                </div>
              </div>

              {/* Title & Details */}
              <div className="text-center space-y-1">
                <h2 className="text-xl font-black tracking-tight text-foreground">
                  التقويم الدراسي المعتمد لـ ({selectedYear?.name})
                </h2>
                <p className="text-xs text-muted-foreground font-semibold">
                  مواعيد الفصول الدراسية وفترات الاختبارات والإجازات المطولة المعتمدة
                </p>
              </div>

              {/* Terms Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border border-border/80 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border text-foreground font-black">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">الفصل الدراسي</th>
                      <th className="py-2.5 px-3 text-center">تاريخ البداية</th>
                      <th className="py-2.5 px-3 text-center">تاريخ النهاية</th>
                      <th className="py-2.5 px-3 text-center">المدة</th>
                      <th className="py-2.5 px-3 text-center">فترة الاختبارات</th>
                      <th className="py-2.5 px-3 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-semibold">
                    {selectedYearTerms.map((term, idx) => {
                      const tStart = new Date(term.startDate).getTime();
                      const tEnd = new Date(term.endDate).getTime();
                      const dCount = Math.max(1, Math.round((tEnd - tStart) / (1000 * 60 * 60 * 24)));
                      return (
                        <tr key={term.id} className={term.status === "active" ? "bg-primary/5 font-black" : ""}>
                          <td className="py-3 px-3 font-bold">{idx + 1}</td>
                          <td className="py-3 px-3">{term.name}</td>
                          <td className="py-3 px-3 text-center tabular-nums" dir="ltr">{term.startDate}</td>
                          <td className="py-3 px-3 text-center tabular-nums" dir="ltr">{term.endDate}</td>
                          <td className="py-3 px-3 text-center">{dCount} يوم</td>
                          <td className="py-3 px-3 text-center text-[11px] tabular-nums" dir="ltr">
                            {term.examStartDate && term.examEndDate ? `${term.examStartDate} - ${term.examEndDate}` : "غير محددة"}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {term.status === "active" ? "الفصل النشط" : term.status === "completed" ? "مكتمل" : "قادم"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Official Signature Blocks */}
              <div className="grid grid-cols-3 gap-4 pt-8 text-center text-xs font-bold border-t border-border/60">
                <div className="space-y-8">
                  <div>وكيل الشؤون التعليمية</div>
                  <div className="text-muted-foreground/60 text-[11px]">............................</div>
                </div>
                <div className="space-y-8">
                  <div>الختم الرسمي للمدرسة</div>
                  <div className="h-10 w-10 mx-auto rounded-full border border-dashed border-muted-foreground/40" />
                </div>
                <div className="space-y-8">
                  <div>مدير عام المدرسة</div>
                  <div className="text-muted-foreground/60 text-[11px]">............................</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}
