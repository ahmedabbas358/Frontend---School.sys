import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { 
  GraduationCap, 
  BookOpen, 
  Layers, 
  CalendarDays, 
  Wallet, 
  ClipboardCheck, 
  MessageCircle, 
  Phone, 
  Printer, 
  Pencil, 
  Award, 
  Clock, 
  Users, 
  Sparkles, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  User,
  ShieldCheck,
  FileBadge,
  Settings,
  Plus,
  Trash2,
  DollarSign,
  SlidersHorizontal,
  ArrowDown,
  Check,
  Coffee,
  Sun,
  Calendar,
  AlertTriangle,
  CreditCard,
  Receipt,
  X
} from "lucide-react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { matchesStaffId, getStaffSector, STAFF_SECTOR_CONFIG } from "@/lib/staff-categories";
import { toast } from "sonner";

export const Route = createFileRoute("/teachers/$id")({
  head: () => ({
    meta: [
      { title: "ملف المعلم المتكامل | منصة مدارسي" },
      { name: "description", content: "الملف الأكاديمي والمهني الشامل للمعلم، الأنصبة، الجدول الأسبوعي، والسجل المالي والتقييم." }
    ],
  }),
  component: TeacherProfile,
});

const TABS = [
  { id: "personal", label: "البيانات الشخصية والمهنية", icon: User },
  { id: "subjects", label: "المواد والأنصبة", icon: BookOpen },
  { id: "sections", label: "الشُعب وريادة الفصول", icon: Layers },
  { id: "schedule", label: "الجدول الأسبوعي المباشر", icon: CalendarDays },
  { id: "financial", label: "البيانات المالية والتعاقدية", icon: Wallet },
  { id: "kpis", label: "الحضور وسجل الأداء (KPIs)", icon: ClipboardCheck },
] as const;

type TabKey = (typeof TABS)[number]["id"];

// Helper: format minutes from midnight into 12-hour Arabic time
function formatMinutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const isPM = h >= 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = m < 10 ? `0${m}` : `${m}`;
  return `${h12}:${mm} ${isPM ? "م" : "ص"}`;
}

// Helper: parse "HH:MM" to minutes
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 7 * 60 + 30; // 07:30
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 7) * 60 + (m || 30);
}

// Visual soft color theme per subject category/code (Eye-comfortable in Light and Dark mode)
function getSubjectTheme(code: string = "", name: string = ""): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  dot: string;
} {
  const text = (code + " " + name).toLowerCase();

  // 1. Quran & Islamic Studies (Restful Sage Emerald)
  if (text.includes("qur") || text.includes("قرآن") || text.includes("إسلام") || text.includes("توحيد") || text.includes("فقه") || text.includes("حديث") || text.includes("دين")) {
    return {
      bg: "bg-emerald-50/85 hover:bg-emerald-100/80 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/45",
      text: "text-emerald-950 dark:text-emerald-100",
      border: "border-emerald-200/90 dark:border-emerald-700/40",
      badge: "bg-emerald-100/90 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200",
      dot: "bg-emerald-500",
    };
  }

  // 2. Mathematics & Arithmetic (Serene Sky Blue)
  if (text.includes("math") || text.includes("رياض") || text.includes("حساب") || text.includes("جبر") || text.includes("هندس") || text.includes("إحصاء")) {
    return {
      bg: "bg-sky-50/85 hover:bg-sky-100/80 dark:bg-sky-950/30 dark:hover:bg-sky-950/45",
      text: "text-sky-950 dark:text-sky-100",
      border: "border-sky-200/90 dark:border-sky-700/40",
      badge: "bg-sky-100/90 text-sky-900 dark:bg-sky-900/50 dark:text-sky-200",
      dot: "bg-sky-500",
    };
  }

  // 3. Sciences & Biology & Physics (Gentle Mint Teal)
  if (text.includes("sci") || text.includes("علوم") || text.includes("فيزياء") || text.includes("كيمياء") || text.includes("أحياء") || text.includes("بيئ")) {
    return {
      bg: "bg-teal-50/85 hover:bg-teal-100/80 dark:bg-teal-950/30 dark:hover:bg-teal-950/45",
      text: "text-teal-950 dark:text-teal-100",
      border: "border-teal-200/90 dark:border-teal-700/40",
      badge: "bg-teal-100/90 text-teal-900 dark:bg-teal-900/50 dark:text-teal-200",
      dot: "bg-teal-500",
    };
  }

  // 4. Arabic Language & Literature (Warm Sand Amber)
  if (text.includes("arab") || text.includes("عرب") || text.includes("لغت") || text.includes("نحو") || text.includes("قراء") || text.includes("بلاغ") || text.includes("إملاء") || text.includes("خط")) {
    return {
      bg: "bg-amber-50/80 hover:bg-amber-100/70 dark:bg-amber-950/25 dark:hover:bg-amber-950/40",
      text: "text-amber-950 dark:text-amber-100",
      border: "border-amber-200/90 dark:border-amber-700/40",
      badge: "bg-amber-100/90 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200",
      dot: "bg-amber-500",
    };
  }

  // 5. English & Foreign Languages (Subtle Twilight Lavender)
  if (text.includes("eng") || text.includes("إنجليز") || text.includes("لغات") || text.includes("فرنس") || text.includes("صين")) {
    return {
      bg: "bg-indigo-50/85 hover:bg-indigo-100/80 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/45",
      text: "text-indigo-950 dark:text-indigo-100",
      border: "border-indigo-200/90 dark:border-indigo-700/40",
      badge: "bg-indigo-100/90 text-indigo-900 dark:bg-indigo-900/50 dark:text-indigo-200",
      dot: "bg-indigo-500",
    };
  }

  // 6. Social Studies & History & Geography (Soft Terracotta Ochre)
  if (text.includes("اجتماع") || text.includes("تاريخ") || text.includes("جغراف") || text.includes("وطنية") || text.includes("دراسات")) {
    return {
      bg: "bg-orange-50/85 hover:bg-orange-100/80 dark:bg-orange-950/30 dark:hover:bg-orange-950/45",
      text: "text-orange-950 dark:text-orange-100",
      border: "border-orange-200/90 dark:border-orange-700/40",
      badge: "bg-orange-100/90 text-orange-900 dark:bg-orange-900/50 dark:text-orange-200",
      dot: "bg-orange-500",
    };
  }

  // 7. Computer & Digital Technology (Soft Glacier Cyan)
  if (text.includes("comp") || text.includes("حاسب") || text.includes("تقني") || text.includes("رقمي") || text.includes("برمج") || text.includes("ذكاء")) {
    return {
      bg: "bg-cyan-50/85 hover:bg-cyan-100/80 dark:bg-cyan-950/30 dark:hover:bg-cyan-950/45",
      text: "text-cyan-950 dark:text-cyan-100",
      border: "border-cyan-200/90 dark:border-cyan-700/40",
      badge: "bg-cyan-100/90 text-cyan-900 dark:bg-cyan-900/50 dark:text-cyan-200",
      dot: "bg-cyan-500",
    };
  }

  // 8. Physical Education & Art & Skills (Gentle Blossom Rose)
  if (text.includes("pe") || text.includes("رياضة") || text.includes("بدني") || text.includes("فني") || text.includes("رسم") || text.includes("مهار") || text.includes("موسيق") || text.includes("نشاط")) {
    return {
      bg: "bg-rose-50/85 hover:bg-rose-100/80 dark:bg-rose-950/30 dark:hover:bg-rose-950/45",
      text: "text-rose-950 dark:text-rose-100",
      border: "border-rose-200/90 dark:border-rose-700/40",
      badge: "bg-rose-100/90 text-rose-900 dark:bg-rose-900/50 dark:text-rose-200",
      dot: "bg-rose-500",
    };
  }

  // 9. Default / General Studies (Restful Modern Slate)
  return {
    bg: "bg-slate-50/85 hover:bg-slate-100/80 dark:bg-slate-900/40 dark:hover:bg-slate-900/60",
    text: "text-slate-950 dark:text-slate-100",
    border: "border-slate-200/90 dark:border-slate-700/40",
    badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    dot: "bg-primary",
  };
}

function TeacherProfile() {
  const { id } = Route.useParams();
  const { 
    activeStageStaff, 
    allStaff, 
    activeStageSubjects, 
    allSubjects, 
    activeStageSections, 
    allSections, 
    allTeachingAssignments, 
    activeStageTeachingAssignments, 
    allScheduleSlots, 
    activeStageScheduleSlots, 
    allStaffContracts,
    allStaffLeaves,
    allStaffAttendance,
    allStaffEvaluations,
    allEmployeeAssignments, 
    currency,
    updateStaff,
    updateScheduleSlot,
    clearScheduleSlot,
    activeStageTimetableSettings,
    updateTimetableSettings,
    allExpenses,
    addExpense,
    allRooms,
    currentAcademicYearId
  } = useGlobalStore();
  const { stage: activeStage, getStageLabel } = useStage();
  
  const [tab, setTab] = useState<TabKey>("personal");
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [activePrintTemplate, setActivePrintTemplate] = useState("teacher-card");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 1. Locate the Teacher Object (Universal Lookup)
  const t = useMemo(() => {
    return activeStageStaff.find(s => matchesStaffId(s, id)) ||
           allStaff.find(s => matchesStaffId(s, id));
  }, [activeStageStaff, allStaff, id]);

  // Interactive Schedule Management States
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [selectedCoord, setSelectedCoord] = useState<{ day: string; period: number } | null>(null);
  const [slotStage, setSlotStage] = useState<string>("primary");
  const [slotSectionId, setSlotSectionId] = useState<string>("");
  const [slotSubjectId, setSlotSubjectId] = useState<string>("");
  const [slotRoomId, setSlotRoomId] = useState<string>("");
  const [slotNotes, setSlotNotes] = useState<string>("");
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [isTimingModalOpen, setIsTimingModalOpen] = useState(false);

  // Conflict Prevention Toggle (Default to true / from settings)
  const [preventConflicts, setPreventConflicts] = useState<boolean>(() => 
    typeof activeStageTimetableSettings?.preventConflicts === "boolean" 
      ? activeStageTimetableSettings.preventConflicts 
      : true
  );

  // Comprehensive Financial States
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);

  const [financeForm, setFinanceForm] = useState({
    paymentType: (t?.paymentType || "Monthly") as "Monthly" | "PerLesson" | "Hourly" | "Weekly" | "Daily",
    basicSalary: t?.basicSalary || 8500,
    rate: t?.rate || 80, // e.g. 80 currency per lesson or hour
    allowance: t?.allowance || 1200,
    deduction: t?.deduction || 0,
    stageRates: (t as any)?.stageRates || {
      kindergarten: 50,
      primary: 60,
      middle: 80,
      high: 100,
    },
    bankName: (t as any)?.bankName || "بنك الخرطوم",
    iban: (t as any)?.iban || "",
  });

  const [disburseForm, setDisburseForm] = useState({
    amount: 9700,
    method: "cash" as "cash" | "bank_transfer" | "card" | "cheque",
    month: new Date().toISOString().slice(0, 7),
    referenceNo: "",
    notes: "",
  });

  const [tempTimingSettings, setTempTimingSettings] = useState({
    startTime: activeStageTimetableSettings?.startTime || "07:30",
    periodDuration: activeStageTimetableSettings?.periodDuration || 45,
    periodsCount: activeStageTimetableSettings?.periodsCount || 7,
    breaks: activeStageTimetableSettings?.breaks || [
      { afterPeriod: 3, name: "الفسحة الأولى", duration: 25 },
      { afterPeriod: 5, name: "فسحة الصلاة", duration: 20 }
    ],
    preventConflicts: activeStageTimetableSettings?.preventConflicts !== false
  });

  const [editFormData, setEditFormData] = useState({
    name: t?.name || "",
    role: t?.role || "",
    phone: t?.phone || "",
    email: t?.email || "",
    status: t?.status || "active",
    nationalId: (t as any)?.nationalId || "",
    qualification: (t as any)?.qualification || "بكالوريوس تربوي",
    experienceYears: (t as any)?.experienceYears || 5,
    targetQuota: (t as any)?.targetQuota || 24,
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!t) return;
    updateStaff(t.id, editFormData);
    toast.success("تم تحديث بيانات المعلم بنجاح");
    setIsEditModalOpen(false);
  };

  // 2. Retrieve All Teaching Assignments for this Teacher (from all & active stages)
  const teacherAssignments = useMemo(() => {
    if (!t) return [];
    // Search both active and all teaching assignments
    const activeAssigns = activeStageTeachingAssignments.filter(a => matchesStaffId(t, a.teacherId));
    const allAssigns = allTeachingAssignments.filter(a => matchesStaffId(t, a.teacherId));
    
    // Merge without duplicates by assignment id
    const map = new Map<string, typeof activeAssigns[0]>();
    allAssigns.forEach(a => map.set(a.id, a));
    activeAssigns.forEach(a => map.set(a.id, a));
    return Array.from(map.values());
  }, [activeStageTeachingAssignments, allTeachingAssignments, t]);
  
  // 3. Extract unique subjects and sections from assignments
  const assignedSubjects = useMemo(() => {
    const subjectIds = Array.from(new Set(teacherAssignments.map(a => a.subjectId)));
    return subjectIds.map(sid => {
      return activeStageSubjects.find(s => s.id === sid) || allSubjects.find(s => s.id === sid);
    }).filter(Boolean);
  }, [teacherAssignments, activeStageSubjects, allSubjects]);

  const assignedSections = useMemo(() => {
    const sectionIds = Array.from(new Set(teacherAssignments.map(a => a.sectionId)));
    return sectionIds.map(sid => {
      return activeStageSections.find(s => s.id === sid) || allSections.find(s => s.id === sid);
    }).filter(Boolean);
  }, [teacherAssignments, activeStageSections, allSections]);

  // 4. Retrieve Homeroom Classes (ريادة الفصول)
  const homeroomSections = useMemo(() => {
    if (!t) return [];
    return allSections.filter(sec => 
      sec.homeroomTeacher === t.name || 
      matchesStaffId(t, sec.homeroomTeacher)
    );
  }, [allSections, t]);

  // 5. Get Weekly Schedule Slots
  const teacherSlots = useMemo(() => {
    if (!t) return [];
    const activeSlots = activeStageScheduleSlots.filter(s => matchesStaffId(t, s.teacherId));
    const allSlots = allScheduleSlots.filter(s => matchesStaffId(t, s.teacherId));
    
    const map = new Map<string, typeof activeSlots[0]>();
    allSlots.forEach(s => map.set(s.id, s));
    activeSlots.forEach(s => map.set(s.id, s));
    return Array.from(map.values());
  }, [activeStageScheduleSlots, allScheduleSlots, t]);

  // 6. Contractual & Financial Data
  const teacherContracts = useMemo(() => {
    if (!t) return [];
    return allStaffContracts.filter(c => matchesStaffId(t, c.staffId));
  }, [allStaffContracts, t]);

  const teacherLeaves = useMemo(() => {
    if (!t) return [];
    return allStaffLeaves.filter(l => matchesStaffId(t, l.staffId));
  }, [allStaffLeaves, t]);

  const teacherAttendance = useMemo(() => {
    if (!t) return [];
    return allStaffAttendance
      .filter(a => matchesStaffId(t, a.staffId))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [allStaffAttendance, t]);

  const teacherEvaluations = useMemo(() => {
    if (!t) return [];
    return allStaffEvaluations.filter(e => matchesStaffId(t, e.staffId));
  }, [allStaffEvaluations, t]);

  const latestContract = teacherContracts[0];
  const latestEvaluation = teacherEvaluations[0];
  const approvedAnnualLeaveDays = teacherLeaves
    .filter(item => item.status === "approved" && item.type === "annual")
    .reduce((sum, item) => sum + item.days, 0);
  const remainingLeaveBalance = Math.max(0, 21 - approvedAnnualLeaveDays);

  if (!t) {
    return (
      <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الهيئة التعليمية", to: "/teachers" }]} title="غير موجود">
        <div className="flex flex-col items-center justify-center p-20 text-center" dir="rtl">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black mb-2">المعلم غير موجود في المنظومة</h2>
          <p className="text-muted-foreground text-xs mb-6 max-w-sm">لم يتم العثور على المعلم المطلوب، قد يكون تم حذف السجل أو نقل المعلم لمرحلة أخرى.</p>
          <Link to="/teachers" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90 transition-all shadow-md">
            العودة لقائمة المعلمين
          </Link>
        </div>
      </AppShell>
    );
  }

  const targetQuota = (t as any).targetQuota || 24;
  const scheduledCount = teacherSlots.length;
  const isFullQuota = scheduledCount >= targetQuota;

  // Settings for Timetable Timing & Periods
  const settings = useMemo(() => {
    const s = activeStageTimetableSettings || {};
    return {
      startTime: s.startTime || "07:30",
      periodDuration: s.periodDuration || 45,
      studyDays: Array.isArray(s.studyDays) && s.studyDays.length > 0 ? s.studyDays : ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"],
      periodsCount: typeof s.periodsCount === "number" ? s.periodsCount : 7,
      breaks: Array.isArray(s.breaks) && s.breaks.length > 0 ? s.breaks : [
        { afterPeriod: 3, name: "الفسحة الأولى", duration: 25 },
        { afterPeriod: 5, name: "فسحة الصلاة", duration: 20 }
      ],
      preventConflicts: typeof s.preventConflicts === "boolean" ? s.preventConflicts : true,
    };
  }, [activeStageTimetableSettings]);

  const DAYS = settings.studyDays;
  const PERIODS_COUNT = settings.periodsCount;

  // Calculate Start & End Time for each period
  const periodTimeRanges = useMemo(() => {
    const ranges: Record<number, { start: string; end: string }> = {};
    let currentMins = parseTimeToMinutes(settings.startTime);

    for (let p = 1; p <= PERIODS_COUNT; p++) {
      const startStr = formatMinutesToTime(currentMins);
      currentMins += settings.periodDuration;
      const endStr = formatMinutesToTime(currentMins);
      ranges[p] = { start: startStr, end: endStr };

      const brk = settings.breaks.find(b => b.afterPeriod === p);
      if (brk) {
        currentMins += brk.duration || 20;
      }
    }
    return ranges;
  }, [settings, PERIODS_COUNT]);

  // Layout Columns including breaks
  const layoutColumns = useMemo(() => {
    const cols: { type: "period" | "break"; val: number | string; duration?: number }[] = [];
    for (let p = 1; p <= PERIODS_COUNT; p++) {
      cols.push({ type: "period", val: p });
      const brk = settings.breaks.find(b => b.afterPeriod === p);
      if (brk) {
        cols.push({ type: "break", val: brk.name, duration: brk.duration });
      }
    }
    return cols;
  }, [PERIODS_COUNT, settings.breaks]);

  // Multi-stage & Multi-subject Teaching Analysis
  const stageSlotsSummary = useMemo(() => {
    const summary: Record<string, number> = {
      kindergarten: 0,
      primary: 0,
      middle: 0,
      high: 0,
    };
    teacherSlots.forEach(s => {
      const stg = s.stage || "primary";
      if (summary[stg] !== undefined) {
        summary[stg]++;
      } else {
        summary["primary"]++;
      }
    });
    return summary;
  }, [teacherSlots]);

  const totalCalculatedFromLessons = useMemo(() => {
    const stageRates = financeForm.stageRates || { kindergarten: 50, primary: 60, middle: 80, high: 100 };
    let totalWeekly = 0;
    Object.entries(stageSlotsSummary).forEach(([stg, count]) => {
      const rate = stageRates[stg] || financeForm.rate || 80;
      totalWeekly += count * rate;
    });
    return totalWeekly * 4; // 4 weeks in a month
  }, [stageSlotsSummary, financeForm]);

  const computedGrossSalary = useMemo(() => {
    if (financeForm.paymentType === "PerLesson") {
      return totalCalculatedFromLessons + (financeForm.allowance || 0);
    } else if (financeForm.paymentType === "Hourly") {
      const estimatedHours = teacherSlots.length * 4;
      return (estimatedHours * (financeForm.rate || 100)) + (financeForm.allowance || 0);
    } else if (financeForm.paymentType === "Weekly") {
      return ((financeForm.rate || 2000) * 4) + (financeForm.allowance || 0);
    } else if (financeForm.paymentType === "Daily") {
      return ((financeForm.rate || 300) * 22) + (financeForm.allowance || 0);
    }
    return (financeForm.basicSalary || 8500) + (financeForm.allowance || 0);
  }, [financeForm, totalCalculatedFromLessons, teacherSlots]);

  const netSalary = Math.max(0, computedGrossSalary - (financeForm.deduction || 0));

  // Disbursements history for this teacher
  const teacherDisbursements = useMemo(() => {
    if (!t) return [];
    return (allExpenses || []).filter(e => 
      e.beneficiary === t.name || 
      (e.referenceNo && t.employeeNo && e.referenceNo.includes(t.employeeNo)) ||
      (e.notes && e.notes.includes(t.name)) ||
      (e.title && e.title.includes(t.name))
    ).sort((a, b) => b.date.localeCompare(a.date));
  }, [allExpenses, t]);

  // Conflict detector
  const checkTeacherConflict = (day: string, period: number, targetSectionId: string, ignoreSlotId?: string) => {
    if (!preventConflicts) return null;

    // 1. Double booking for teacher
    const conflictSlot = allScheduleSlots.find(s => 
      matchesStaffId(t, s.teacherId) &&
      s.day === day &&
      s.period === period &&
      s.sectionId !== targetSectionId &&
      s.id !== ignoreSlotId
    );
    if (conflictSlot) {
      const conflictSec = allSections.find(sec => sec.id === conflictSlot.sectionId);
      const conflictSub = allSubjects.find(sub => sub.id === conflictSlot.subjectId);
      return {
        type: "teacher_busy",
        message: `المعلم لديه حصة (${conflictSub?.name || "مادة"}) في (${conflictSec?.grade || ""} - شعبة ${conflictSec?.name || ""}) في نفس التوقيت!`
      };
    }

    // 2. Section collision
    const sectionBusy = allScheduleSlots.find(s =>
      s.sectionId === targetSectionId &&
      s.day === day &&
      s.period === period &&
      !matchesStaffId(t, s.teacherId) &&
      s.id !== ignoreSlotId
    );
    if (sectionBusy) {
      const otherTeacher = allStaff.find(st => matchesStaffId(st, sectionBusy.teacherId));
      const conflictSub = allSubjects.find(sub => sub.id === sectionBusy.subjectId);
      return {
        type: "section_busy",
        message: `هذه الشعبة مشغولة بحصة (${conflictSub?.name || "مادة"}) مع (${otherTeacher?.name || "معلم آخر"}) في نفس الوقت!`
      };
    }

    return null;
  };

  // Open slot editor modal
  const handleOpenSlotModal = (day: string, period: number) => {
    const existing = teacherSlots.find(s => s.day === day && s.period === period);
    setSelectedCoord({ day, period });
    
    if (existing) {
      setEditingSlotId(existing.id);
      setSlotStage(existing.stage || "primary");
      setSlotSectionId(existing.sectionId || "");
      setSlotSubjectId(existing.subjectId || "");
      setSlotRoomId(existing.roomId || "");
      setSlotNotes(existing.notes || "");
    } else {
      setEditingSlotId(null);
      const initialStage = t?.stage === "all" ? "primary" : (t?.stage || "primary");
      setSlotStage(initialStage);
      const firstSec = allSections.find(s => s.stage === initialStage);
      setSlotSectionId(firstSec?.id || assignedSections[0]?.id || "");
      setSlotSubjectId(assignedSubjects[0]?.id || "");
      setSlotRoomId(firstSec?.roomId || "");
      setSlotNotes("");
    }
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoord || !t || !slotSectionId || !slotSubjectId) {
      return toast.error("الرجاء اختيار الشعبة والمادة أولاً");
    }

    const conflict = checkTeacherConflict(selectedCoord.day, selectedCoord.period, slotSectionId, editingSlotId || undefined);
    if (conflict && preventConflicts) {
      return toast.error(conflict.message);
    }

    const sec = allSections.find(s => s.id === slotSectionId);
    const room = allRooms.find(r => r.id === slotRoomId);

    updateScheduleSlot({
      sectionId: slotSectionId,
      day: selectedCoord.day,
      period: selectedCoord.period,
      subjectId: slotSubjectId,
      teacherId: t.id,
      stage: (sec?.stage || slotStage) as any,
      roomId: slotRoomId || sec?.roomId || undefined,
      roomName: room?.name || sec?.roomName || undefined,
      notes: slotNotes || undefined
    });

    toast.success(`تم تثبيت حصة (${selectedCoord.day} - الحصة ${selectedCoord.period}) للمعلم بنجاح`);
    setIsSlotModalOpen(false);
  };

  const handleDeleteSlot = () => {
    if (!selectedCoord) return;
    const existing = teacherSlots.find(s => s.day === selectedCoord.day && s.period === selectedCoord.period);
    if (existing) {
      clearScheduleSlot(existing.sectionId, existing.day, existing.period);
      toast.success("تم تفريغ الحصة من جدول المعلم بنجاح");
      setIsSlotModalOpen(false);
    }
  };

  const handleSaveFinance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!t) return;
    updateStaff(t.id, {
      ...financeForm,
      paymentType: financeForm.paymentType as any,
      basicSalary: Number(financeForm.basicSalary),
      rate: Number(financeForm.rate),
      allowance: Number(financeForm.allowance),
      deduction: Number(financeForm.deduction)
    });
    toast.success("تم تحديث الهيكل المالي ونظام الأجر للمعلم بنجاح");
    setIsFinanceModalOpen(false);
  };

  const handleExecuteDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!t || disburseForm.amount <= 0) {
      return toast.error("الرجاء إدخال مبلغ صحيح للصرف");
    }

    const refNo = disburseForm.referenceNo || `PAY-${t.employeeNo || t.id}-${Date.now().toString().slice(-4)}`;
    
    addExpense({
      title: `صرف أجور ومستحقات: ${t.name}`,
      amount: disburseForm.amount,
      date: new Date().toISOString().split("T")[0],
      categoryId: "EXPCAT-1",
      beneficiary: t.name,
      method: disburseForm.method,
      referenceNo: refNo,
      notes: disburseForm.notes || `صرف استحقاق ${disburseForm.month} بنظام ${financeForm.paymentType}`,
      status: "approved"
    });

    toast.success(`تم صرف مبلغ ${disburseForm.amount.toLocaleString()} ${currency} وسحبه من الخزينة بنجاح (سند رقم: ${refNo})`);
    setIsDisburseModalOpen(false);
  };

  const handleSaveTimetableTiming = () => {
    updateTimetableSettings(tempTimingSettings);
    toast.success("تم تحديث تواقيت الحصص والفسح بنجاح لكافة المنظومة");
    setIsTimingModalOpen(false);
  };

  const printTemplates: PrintTemplate[] = [
    {
      id: "teacher-card",
      name: "بطاقة الهوية المهنية للمعلم (Teacher ID Card)",
      category: "تعريف رسمي",
      type: "table",
      columns: [
        { key: "field", label: "البيان" },
        { key: "val", label: "التفاصيل" },
      ],
      description: "بطاقة رسمية معتمدة تثبت الانتماء الأكاديمي والمسمى الوظيفي"
    },
    {
      id: "assignment-letter",
      name: "خطاب تكليف بالتدريس والأنصبة الأكاديمية",
      category: "قرارات وتكليف",
      type: "table",
      columns: [
        { key: "field", label: "البند" },
        { key: "val", label: "البيانات المسندة" },
      ],
      description: "خطاب تكليف رسمي موجه للمعلم يتضمن المواد والشعب والأنصبة الأسبوعية"
    }
  ];

  const printData = activePrintTemplate === "teacher-card" ? [
    { field: "اسم المعلم الرباعي", val: t.name },
    { field: "الرقم الوظيفي", val: t.employeeNo || t.id },
    { field: "المسمى الوظيفي والمواد", val: t.role },
    { field: "القسم / الكلية", val: t.department || "الشؤون الأكاديمية" },
    { field: "المؤهل الدراسي", val: (t as any).qualification || "بكالوريوس تربوي" },
    { field: "رقم الجوال والتواصل", val: t.phone || "غير مسجل" },
    { field: "الحالة الوظيفية", val: t.status === "active" ? "على رأس العمل" : "في إجازة" },
    { field: "الحصص المجدولة أسبوعياً", val: `${scheduledCount} حصة من أصل ${targetQuota}` },
  ] : [
    { field: "المكلف بالتدريس", val: t.name },
    { field: "الرقم الوظيفي", val: t.employeeNo || t.id },
    { field: "المسمى الوظيفي والمهام", val: t.role },
    { field: "المواد المسندة", val: assignedSubjects.map(s => s?.name).join("، ") || "بانتظار الإسناد" },
    { field: "الشُعب والفصول", val: assignedSections.map(s => `${s?.grade} / شعبة ${s?.name}`).join("، ") || "بانتظار الإسناد" },
    { field: "ريادة الفصول", val: homeroomSections.length > 0 ? homeroomSections.map(s => `${s.grade} / شعبة ${s.name}`).join("، ") : "لا توجد ريادة فصل" },
    { field: "إجمالي الحصص الأسبوعية الفعلية", val: `${scheduledCount} حصة` },
    { field: "النصاب المستهدف المعتمد", val: `${targetQuota} حصة` },
    { field: "تاريخ الإصدار والاعتماد", val: new Date().toLocaleDateString("ar-SA") },
  ];

  return (
    <AppShell 
      breadcrumb={[
        { label: "الرئيسية", to: "/" }, 
        { label: "الهيئة التعليمية", to: "/teachers" }, 
        { label: t.name }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setActivePrintTemplate("teacher-card");
              setIsPrintOpen(true);
            }}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-card border border-border/70 px-3.5 text-xs font-black shadow-xs hover:bg-accent transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-primary" />
            طباعة بطاقة المعلم
          </button>
          <button 
            onClick={() => {
              setActivePrintTemplate("assignment-letter");
              setIsPrintOpen(true);
            }}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-card border border-border/70 px-3.5 text-xs font-black shadow-xs hover:bg-accent transition-colors"
          >
            <FileBadge className="h-3.5 w-3.5 text-primary" />
            خطاب التكليف
          </button>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground hover:bg-primary/90 shadow-sm transition-all hover:scale-105 active:scale-95 glow-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
            تعديل البيانات
          </button>
        </div>
      }
    >
      <div className="space-y-5 animate-in fade-in duration-300" dir="rtl">
        
        {/* Luxury Interactive Header */}
        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm relative overflow-hidden glass">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -ml-32 -mt-32 pointer-events-none"></div>
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            {/* Identity Info */}
            <div className="flex items-center gap-5">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-primary/15 text-3xl font-black text-primary shadow-inner glow-primary border border-primary/20">
                {t.name.charAt(0)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-black text-foreground">{t.name}</h1>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-primary/10 text-primary border border-primary/20 inline-flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" />
                    كادر تعليمي معتمد
                  </span>
                  <Badge tone={t.status === "active" ? "success" : t.status === "on_leave" ? "warning" : "danger"}>
                    {t.status === "active" ? "على رأس العمل" : t.status === "on_leave" ? "في إجازة" : "غير نشط"}
                  </Badge>
                </div>
                
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-bold">
                  <span className="tabular-nums font-black text-foreground">{t.employeeNo || t.id}</span>
                  <span className="h-3.5 w-px bg-border"></span>
                  <span>{t.role}</span>
                  <span className="h-3.5 w-px bg-border"></span>
                  <span>{t.department || "الشؤون الأكاديمية"}</span>
                  <span className="h-3.5 w-px bg-border"></span>
                  <span>المرحلة: {t.stage === "all" ? "شامل لكافة المراحل" : getStageLabel(t.stage as any)}</span>
                </div>
              </div>
            </div>

            {/* Achievement KPI Pills & Quick Contact Actions */}
            <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto justify-end">
              <div className="flex items-center gap-4 bg-background/70 p-3 px-5 rounded-2xl border border-border/60 backdrop-blur-md">
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground font-bold mb-0.5">الحصص المجدولة</div>
                  <div className="text-lg font-black tabular-nums text-primary">
                    {scheduledCount} <span className="text-xs font-normal text-muted-foreground">/ {targetQuota}</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-border"></div>
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground font-bold mb-0.5">المواد</div>
                  <div className="text-lg font-black tabular-nums">{assignedSubjects.length}</div>
                </div>
                <div className="w-px h-8 bg-border"></div>
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground font-bold mb-0.5">الشُعب</div>
                  <div className="text-lg font-black tabular-nums">{assignedSections.length}</div>
                </div>
                {homeroomSections.length > 0 && (
                  <>
                    <div className="w-px h-8 bg-border"></div>
                    <div className="text-center">
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mb-0.5">ريادة الفصول</div>
                      <div className="text-lg font-black tabular-nums text-amber-600 dark:text-amber-400">
                        {homeroomSections.length}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Direct Quick WhatsApp and Call */}
              {t.phone && (
                <div className="flex items-center gap-2">
                  <a 
                    href={`https://wa.me/${t.phone.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-4 text-xs font-black transition-all active:scale-95"
                    title="محادثة واتساب سريعة"
                  >
                    <MessageCircle className="h-4 w-4" />
                    واتساب
                  </a>
                  <a 
                    href={`tel:${t.phone}`} 
                    className="inline-flex h-11 items-center gap-2 rounded-2xl bg-card hover:bg-accent border border-border/70 px-4 text-xs font-black transition-all active:scale-95"
                    title="اتصال هاتفي"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    اتصال
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6 Tabs Navigation Header */}
        <div className="flex items-center gap-2 border-b border-border pb-px overflow-x-auto custom-scrollbar">
          {TABS.map((tabItem) => {
            const Icon = tabItem.icon;
            const isActive = tab === tabItem.id;
            return (
              <button 
                key={tabItem.id} 
                onClick={() => setTab(tabItem.id)} 
                className={`relative px-4 py-3 text-xs font-black transition-all rounded-t-2xl flex items-center gap-2 shrink-0 ${
                  isActive 
                    ? "text-primary bg-primary/10 border-t border-x border-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span>{tabItem.label}</span>
                {tabItem.id === "subjects" && assignedSubjects.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center">
                    {assignedSubjects.length}
                  </span>
                )}
                {tabItem.id === "sections" && assignedSections.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-muted text-foreground text-[10px] font-black flex items-center justify-center">
                    {assignedSections.length}
                  </span>
                )}
                {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary rounded-t-full" />}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Personal & Professional Data */}
        {tab === "personal" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <PageCard title="المعلومات الشخصية والتعريفية">
                <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 text-xs">
                  <div className="space-y-1">
                    <dt className="font-bold text-muted-foreground">الاسم الرباعي المعتمد</dt>
                    <dd className="font-black text-sm text-foreground">{t.name}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-bold text-muted-foreground">الرقم الوظيفي</dt>
                    <dd className="font-black text-sm text-foreground tabular-nums">{t.employeeNo || t.id}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-bold text-muted-foreground">رقم الهوية الوطنية / الإقامة</dt>
                    <dd className="font-black text-sm text-foreground tabular-nums" dir="ltr">
                      {(t as any).nationalId || "1098472910"}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-bold text-muted-foreground">المؤهل الدراسي</dt>
                    <dd className="font-black text-sm text-foreground">{(t as any).qualification || "بكالوريوس تربوي"}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-bold text-muted-foreground">المواد المسندة والمؤهل</dt>
                    <dd className="font-black text-sm text-foreground">{assignedSubjects.map(s => s?.name).join("، ") || (t as any).qualification || "معلم معتمد"}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-bold text-muted-foreground">سنوات الخبرة التعليمية</dt>
                    <dd className="font-black text-sm text-foreground tabular-nums">{(t as any).experienceYears || 5} سنوات</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-bold text-muted-foreground">تاريخ المباشرة</dt>
                    <dd className="font-black text-sm text-foreground tabular-nums">{(t as any).hireDate || "2022-09-01"}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-bold text-muted-foreground">القسم الأكاديمي</dt>
                    <dd className="font-black text-sm text-foreground">{t.department || "الشؤون الأكاديمية"}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-bold text-muted-foreground">نطاق العمل المدرسي</dt>
                    <dd className="font-black text-sm text-foreground">{t.stage === "all" ? "شامل لكل المراحل" : getStageLabel(t.stage as any)}</dd>
                  </div>
                </dl>
              </PageCard>

              <PageCard title="بيانات الاتصال والعناوين الرسمية">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                  <div className="space-y-1">
                    <dt className="font-bold text-muted-foreground">رقم الجوال المعتمد</dt>
                    <dd className="font-black text-sm text-foreground tabular-nums" dir="ltr">{t.phone || "غير مسجل"}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-bold text-muted-foreground">البريد الإلكتروني المؤسسي</dt>
                    <dd className="font-black text-sm text-foreground tabular-nums" dir="ltr">{t.email || `${(t.employeeNo || t.id).toLowerCase()}@school.edu.sa`}</dd>
                  </div>
                </dl>
              </PageCard>
            </div>

            {/* Quick Profile Summary Box */}
            <div className="space-y-5">
              <PageCard title="ملخص الاعتماد الأكاديمي">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2.5">
                      <Award className="h-6 w-6" />
                    </div>
                    <div className="font-black text-sm text-foreground">رتبة معلم ممارس معتمد</div>
                    <div className="text-[11px] text-muted-foreground font-bold mt-1">مرخص من هيئة تقويم التعليم والتدريب</div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between p-2 rounded-xl bg-muted/30">
                      <span className="text-muted-foreground font-bold">النصاب الأسبوعي:</span>
                      <span className="font-black text-foreground">{scheduledCount} / {targetQuota} حصة</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-xl bg-muted/30">
                      <span className="text-muted-foreground font-bold">نسبة اكتمال النصاب:</span>
                      <span className="font-black text-primary">{Math.round((scheduledCount / targetQuota) * 100)}%</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-xl bg-muted/30">
                      <span className="text-muted-foreground font-bold">ريادة الفصول:</span>
                      <span className="font-black text-foreground">{homeroomSections.length > 0 ? `رائد لـ ${homeroomSections.length} شعبة` : "لا يوجد"}</span>
                    </div>
                  </div>
                </div>
              </PageCard>
            </div>
          </div>
        )}

        {/* TAB 2: Teaching Subjects & Quotas */}
        {tab === "subjects" && (
          <div className="space-y-5">
            <PageCard 
              title="المواد التعليمية المُسندة فعلياً" 
              actions={<span className="text-xs font-bold text-muted-foreground">{assignedSubjects.length} مواد مسجلة</span>}
            >
              {assignedSubjects.length === 0 ? (
                <div className="p-12 text-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-bold text-muted-foreground mb-4">لم يتم ربط أي مواد دراسية بهذا المعلم حتى الآن.</p>
                  <Link to="/academic/assignments" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black">
                    الانتقال لصفحة الإسناد الأكاديمي
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignedSubjects.map((sub: any) => {
                    const subjectAssigns = teacherAssignments.filter(a => a.subjectId === sub.id);
                    const subjectSlots = teacherSlots.filter(s => s.subjectId === sub.id);
                    const sectionsForSubject = subjectAssigns.map(a => {
                      return activeStageSections.find(s => s.id === a.sectionId) || allSections.find(s => s.id === a.sectionId);
                    }).filter(Boolean);

                    return (
                      <div key={sub.id} className="rounded-2xl border border-border/70 bg-card p-5 shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <Badge tone="primary" className="text-xs font-black px-2.5 py-0.5">
                              {sub.name}
                            </Badge>
                            <span className="text-xs font-black text-primary tabular-nums">
                              {subjectSlots.length} حصص أسبوعياً
                            </span>
                          </div>
                          
                          <p className="text-xs text-muted-foreground font-bold mb-4">
                            المرحلة الدراسية: {sub.stage === "all" ? "شامل" : getStageLabel(sub.stage)}
                          </p>

                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-muted-foreground block">الشعب المسندة للمادة:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {sectionsForSubject.map(sec => (
                                <span key={sec!.id} className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-muted border border-border/60">
                                  {sec!.grade.replace("الصف ", "")}/{sec!.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-border/50 flex justify-between items-center text-xs">
                          <span className="text-muted-foreground font-bold">الحصص الفعلية:</span>
                          <span className="font-black text-foreground">{subjectSlots.length} حصة</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </PageCard>
          </div>
        )}

        {/* TAB 3: Sections & Homeroom Supervision */}
        {tab === "sections" && (
          <div className="space-y-5">
            {/* Homeroom Notice if Teacher has Homeroom duties */}
            {homeroomSections.length > 0 && (
              <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-4 text-amber-900 dark:text-amber-200">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm">مهام ريادة الفصول (Homeroom Leadership)</h4>
                  <p className="text-xs opacity-80 mt-0.5">
                    المعلم مكلف رسمياً بالإشراف التربوي ورعاية الفصل للشُعب:{" "}
                    <span className="font-black underline">{homeroomSections.map(s => `${s.grade} - شعبة ${s.name}`).join("، ")}</span>
                  </p>
                </div>
              </div>
            )}

            <PageCard title="الشُعب والفصول المخصصة للتدريس">
              {assignedSections.length === 0 ? (
                <div className="p-12 text-center">
                  <Layers className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-bold text-muted-foreground mb-4">لم يتم إسناد أي شُعب دراسية للمعلم حتى الآن.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignedSections.map((sec: any) => {
                    const isHomeroom = homeroomSections.some(hs => hs.id === sec.id);
                    const secSlots = teacherSlots.filter(s => s.sectionId === sec.id);

                    return (
                      <div key={sec.id} className={`rounded-2xl border p-5 shadow-xs transition-all relative overflow-hidden ${isHomeroom ? "border-amber-500/40 bg-amber-500/5" : "border-border/70 bg-card hover:border-primary/50"}`}>
                        {isHomeroom && (
                          <div className="absolute top-0 left-0 bg-amber-500 text-white text-[10px] font-black px-3 py-0.5 rounded-br-xl shadow-xs">
                            رائد الفصل
                          </div>
                        )}

                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <span className="text-xs font-bold text-muted-foreground block">{sec.stage ? getStageLabel(sec.stage) : "المرحلة"}</span>
                            <h3 className="text-lg font-black text-foreground mt-0.5">{sec.grade}</h3>
                            <span className="text-xs font-bold text-primary">شعبة ({sec.name})</span>
                          </div>
                          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <Users className="h-5 w-5" />
                          </div>
                        </div>

                        <div className="space-y-2 text-xs pt-3 border-t border-border/50">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground font-bold">الطاقة الاستيعابية:</span>
                            <span className="font-black text-foreground">{sec.capacity || 30} طالب</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground font-bold">الحصص الأسبوعية بهذه الشعبة:</span>
                            <span className="font-black text-primary">{secSlots.length} حصص</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground font-bold">القاعة الدراسية:</span>
                            <span className="font-black text-foreground">{sec.roomName || "القاعة الرئيسية"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </PageCard>
          </div>
        )}

        {/* TAB 4: Interactive Weekly Timetable Matrix with Conflict & Break Support */}
        {tab === "schedule" && (
          <PageCard 
            title="الجدول الأسبوعي المباشر لحصص المعلم"
            actions={
              <div className="flex flex-wrap items-center gap-2">
                {/* Conflict Prevention Toggle Switch */}
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !preventConflicts;
                    setPreventConflicts(nextVal);
                    toast.info(nextVal ? "تم تفعيل نظام منع تعارض المعلمين" : "تم تعطيل نظام منع التعارض مؤقتاً");
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border shadow-2xs cursor-pointer ${
                    preventConflicts 
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20" 
                      : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                  }`}
                  title="تفعيل أو إيقاف التحقق التلقائي لمنع إسناد حصص متعارضة لنفس المعلم أو الشعبة"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{preventConflicts ? "منع التعارض: نشط" : "منع التعارض: معطل"}</span>
                </button>

                {/* Timing & Breaks Configuration Button */}
                <button
                  type="button"
                  onClick={() => setIsTimingModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/70 bg-card hover:bg-muted text-foreground text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>تواقيت الحصص والفسح</span>
                </button>

                {/* Direct Link to Global Schedule */}
                <Link
                  to="/schedule"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/70 bg-card hover:bg-muted text-foreground text-xs font-bold transition-all shadow-2xs"
                >
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>جدول الحصص العام</span>
                </Link>

                <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl">
                  {teacherSlots.length} حصة مسندة أسبوعياً
                </span>
              </div>
            }
          >
            <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-border/70 bg-background/50 p-2.5">
              <table className="w-full min-w-[1240px] border-separate border-spacing-2 text-center" dir="rtl">
                <thead>
                  <tr>
                    <th className="rounded-2xl bg-muted/70 px-4 py-3.5 text-xs font-black text-foreground w-32 min-w-[110px] shadow-xs">
                      <div className="flex items-center justify-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>اليوم / التوقيت</span>
                      </div>
                    </th>
                    {layoutColumns.map((col, idx) => (
                      <th 
                        key={idx} 
                        className={`rounded-2xl px-3 py-3 text-xs font-black shadow-xs ${
                          col.type === "break" 
                            ? "bg-amber-500/10 text-amber-900 dark:text-amber-200 w-24 min-w-[80px] border border-amber-500/25" 
                            : "bg-muted/70 text-foreground border border-border/50 min-w-[145px]"
                        }`}
                      >
                        {col.type === "period" ? (
                          <div className="space-y-1">
                            <div className="font-black text-xs text-foreground">الحصة {col.val}</div>
                            <div className="text-[10px] font-semibold text-muted-foreground tabular-nums bg-background/60 dark:bg-muted/50 px-2 py-0.5 rounded-md inline-block">
                              {periodTimeRanges[col.val as number]?.start} - {periodTimeRanges[col.val as number]?.end}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-1">
                              <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span className="text-[11px] font-black">{col.val}</span>
                            </div>
                            {col.duration && (
                              <span className="inline-block text-[9px] font-bold opacity-85 bg-amber-500/15 px-2 py-0.2 rounded-full">
                                {col.duration} دقيقة
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map(day => (
                    <tr key={day}>
                      {/* Day Header */}
                      <th className="rounded-2xl bg-muted/40 border border-border/40 px-3 py-3 text-xs font-black text-foreground align-middle shadow-2xs">
                        {day}
                      </th>

                      {/* Columns */}
                      {layoutColumns.map((col, idx) => {
                        // Break Column
                        if (col.type === "break") {
                          if (day === DAYS[0]) {
                            return (
                              <td 
                                key={idx} 
                                rowSpan={DAYS.length}
                                className="rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-dashed border-amber-400/35 dark:border-amber-600/30 p-2 align-middle relative overflow-hidden select-none w-24 min-w-[80px]"
                              >
                                <div className="flex flex-col items-center justify-center gap-3 py-6 h-full text-amber-900 dark:text-amber-200">
                                  <div className="w-8 h-8 rounded-full bg-amber-500/15 dark:bg-amber-500/25 text-amber-700 dark:text-amber-300 flex items-center justify-center shadow-2xs">
                                    <Coffee className="w-4 h-4" />
                                  </div>
                                  <div className="py-2.5 px-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-2xs">
                                    <span className="font-black text-xs tracking-widest text-amber-900 dark:text-amber-200 whitespace-nowrap -rotate-90 inline-block py-2">
                                      {col.val}
                                    </span>
                                  </div>
                                  {col.duration && (
                                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300/90 bg-amber-500/15 px-2 py-0.5 rounded-full tabular-nums">
                                      {col.duration} د
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          }
                          return null;
                        }

                        // Period Cell
                        const p = col.val as number;
                        const slot = teacherSlots.find(s => s.day === day && s.period === p);
                        const sub = slot ? (allSubjects.find(s => s.id === slot.subjectId) || activeStageSubjects.find(s => s.id === slot.subjectId)) : null;
                        const sec = slot ? (allSections.find(s => s.id === slot.sectionId) || activeStageSections.find(s => s.id === slot.sectionId)) : null;
                        const theme = sub ? getSubjectTheme(sub.code, sub.name) : null;

                        return (
                          <td 
                            key={idx}
                            onClick={() => handleOpenSlotModal(day, p)}
                            className={`
                              min-h-[110px] min-w-[145px] rounded-2xl border p-3 text-xs transition-all cursor-pointer relative group select-none
                              ${slot 
                                ? `${theme?.bg} ${theme?.border} hover:shadow-md hover:scale-[1.01]` 
                                : "border-dashed border-border/60 bg-background/50 hover:bg-primary/5 hover:border-primary/50"
                              }
                            `}
                          >
                            {slot && sub ? (
                              <div className="flex flex-col h-full justify-between text-right space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-start gap-1.5 min-w-0">
                                    <span className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${theme?.dot}`} />
                                    <span className={`font-black text-xs leading-snug break-words line-clamp-2 ${theme?.text}`}>
                                      {sub.name}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity font-bold shrink-0">
                                    تعديل ✎
                                  </span>
                                </div>

                                <div className="text-[11px] font-bold text-foreground/85 dark:text-foreground/90 truncate">
                                  {sec ? `${sec.grade.replace("الصف ", "")} - شعبة ${sec.name}` : "شعبة دراسية"}
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-muted-foreground/90 font-semibold pt-1 border-t border-border/30">
                                  <span className="truncate">{slot.roomName || sec?.roomName || "القاعة الرئيسية"}</span>
                                  {slot.stage && (
                                    <span className="text-[9px] font-semibold opacity-75">
                                      {getStageLabel(slot.stage as any)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full min-h-[90px] text-muted-foreground/40 group-hover:text-primary transition-colors gap-1">
                                <Plus className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                  إسناد حصة
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap gap-5 text-xs font-bold text-muted-foreground justify-between items-center px-1">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 block"></span>
                  حصة مسندة
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-lg bg-amber-500/20 border border-amber-500/30 block"></span>
                  فسحة مدرسية
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-lg border border-dashed border-border block"></span>
                  حصة شاغرة (فراغ)
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground">
                اضغط على أي خانة لإسناد مادة أو تعديلها أو تفريغها فورياً
              </span>
            </div>
          </PageCard>
        )}

        {/* TAB 5: Comprehensive Financial & Treasury Management */}
        {tab === "financial" && (
          <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-card border border-border/70 shadow-xs">
              <div>
                <h3 className="text-sm font-black text-foreground">الإدارة المالية واستحقاقات المعلم</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  تحديد نظام احتساب الأجر (بالحصص/الساعة/الشهر)، ربط استحقاقات تدريس المراحل، وصرف الدفعات من الخزينة.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFinanceModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border/70 bg-card hover:bg-muted text-foreground text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                  <span>تعديل الهيكل ونظام الأجر</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDisburseForm(prev => ({
                      ...prev,
                      amount: netSalary,
                      referenceNo: `PAY-${t.employeeNo || t.id}-${Date.now().toString().slice(-4)}`
                    }));
                    setIsDisburseModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black transition-all shadow-md glow-primary cursor-pointer active:scale-95"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>صرف مستحقات من الخزينة</span>
                </button>
              </div>
            </div>

            {/* Financial KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold mb-2">
                  <span>نظام دفع الأجر</span>
                  <Badge tone="primary" className="text-[10px] font-black">
                    {financeForm.paymentType === "PerLesson" ? "بالحصص" : 
                     financeForm.paymentType === "Hourly" ? "بالساعة" : 
                     financeForm.paymentType === "Weekly" ? "أسبوعي" : 
                     financeForm.paymentType === "Daily" ? "يومي" : "راتب شهري"}
                  </Badge>
                </div>
                <div className="text-2xl font-black text-foreground tabular-nums">
                  {financeForm.paymentType === "PerLesson" ? (
                    <>
                      {financeForm.rate} <span className="text-xs font-bold text-muted-foreground">{currency} / حصة</span>
                    </>
                  ) : financeForm.paymentType === "Hourly" ? (
                    <>
                      {financeForm.rate} <span className="text-xs font-bold text-muted-foreground">{currency} / ساعة</span>
                    </>
                  ) : (
                    <>
                      {(financeForm.basicSalary || 8500).toLocaleString()} <span className="text-xs font-bold text-muted-foreground">{currency}</span>
                    </>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  {financeForm.paymentType === "PerLesson" ? `${teacherSlots.length} حصة أسبوعياً (نصاب فعلي)` : "الراتب الأساسي الثابت"}
                </span>
              </div>

              <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs">
                <span className="text-xs font-bold text-muted-foreground">البدلات والمكافآت الشهرية</span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
                  +{(financeForm.allowance || 0).toLocaleString()} <span className="text-xs font-bold text-muted-foreground">{currency}</span>
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 block">بدل نقل / سكن / مهام إشرافية</span>
              </div>

              <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs">
                <span className="text-xs font-bold text-muted-foreground">الاستقطاعات والخصومات</span>
                <div className="text-2xl font-black text-destructive mt-2 tabular-nums">
                  -{(financeForm.deduction || 0).toLocaleString()} <span className="text-xs font-bold text-muted-foreground">{currency}</span>
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 block">تأمينات / غياب / جزاءات</span>
              </div>

              <div className="rounded-3xl border border-primary/40 bg-primary/5 p-5 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-black text-primary mb-2">
                  <span>صافي المستحق الشهري التقديري</span>
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-black text-primary tabular-nums">
                  {netSalary.toLocaleString()} <span className="text-xs font-bold text-primary/80">{currency}</span>
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  محسوب آلياً بناءً على الحصص والبدلات
                </span>
              </div>
            </div>

            {/* Multi-Stage Teaching Workload & Calculation Breakdown */}
            <PageCard 
              title="تفاصيل تدريس المراحل المتعددة وحساب الاستحقاق الأكاديمي"
              actions={
                <span className="text-xs font-black text-muted-foreground">
                  إجمالي الحصص: {teacherSlots.length} حصة أسبوعياً
                </span>
              }
            >
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  عند قيام المعلم بالتدريس في أكثر من مرحلة (مثل الابتدائي والمتوسط)، يتم احتساب الاستحقاقات بناءً على نصيب كل مرحلة من الحصص وسعر الحصة المعتمد لكل مرحلة:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { key: "kindergarten", name: "مرحلة رياض الأطفال", defaultRate: 50 },
                    { key: "primary", name: "المرحلة الابتدائية", defaultRate: 60 },
                    { key: "middle", name: "المرحلة المتوسطة", defaultRate: 80 },
                    { key: "high", name: "المرحلة الثانوية", defaultRate: 100 },
                  ].map(stg => {
                    const count = stageSlotsSummary[stg.key] || 0;
                    const stageRates = financeForm.stageRates || {};
                    const rate = stageRates[stg.key] || financeForm.rate || stg.defaultRate;
                    const monthlyCount = count * 4;
                    const subtotal = monthlyCount * rate;

                    return (
                      <div key={stg.key} className={`p-4 rounded-2xl border transition-all ${count > 0 ? "border-primary/40 bg-primary/5" : "border-border/60 bg-card opacity-60"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-black text-xs text-foreground">{stg.name}</span>
                          {count > 0 && (
                            <Badge tone="primary" className="text-[10px] font-black">نشط</Badge>
                          )}
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between text-muted-foreground">
                            <span>الحصص الأسبوعية:</span>
                            <span className="font-black text-foreground tabular-nums">{count} حصة</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>سعر الحصة للمرحلة:</span>
                            <span className="font-black text-foreground tabular-nums">{rate} {currency}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-border/50 font-black text-foreground">
                            <span>المستحق الشهري:</span>
                            <span className="text-primary tabular-nums">{subtotal.toLocaleString()} {currency}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </PageCard>

            {/* Treasury Disbursement Ledger */}
            <PageCard 
              title="سجل صرف المستحقات ومسحوبات الخزينة المدرسية"
              actions={
                <span className="text-xs font-black text-muted-foreground">
                  {teacherDisbursements.length} عمليات صرف مسجلة
                </span>
              }
            >
              {teacherDisbursements.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <Receipt className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-xs font-bold text-muted-foreground">
                    لم يتم تسجيل أي عمليات صرف سابقة لهذا المعلم من الخزينة.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDisburseForm(prev => ({
                        ...prev,
                        amount: netSalary,
                        referenceNo: `PAY-${t.employeeNo || t.id}-${Date.now().toString().slice(-4)}`
                      }));
                      setIsDisburseModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-black transition-all"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>صرف الدفعة الأولى الآن</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="border-b border-border/70 text-muted-foreground font-bold">
                        <th className="py-2.5 px-3">التاريخ</th>
                        <th className="py-2.5 px-3">رقم السند المالي</th>
                        <th className="py-2.5 px-3">المبلغ المصروف</th>
                        <th className="py-2.5 px-3">طريقة السحب</th>
                        <th className="py-2.5 px-3">البيان والملاحظات</th>
                        <th className="py-2.5 px-3 text-center">حالة السند</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {teacherDisbursements.map((tx) => (
                        <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-3 font-semibold tabular-nums">{tx.date}</td>
                          <td className="py-3 px-3 font-mono font-bold text-primary">{tx.referenceNo || `TX-${tx.id.slice(-6)}`}</td>
                          <td className="py-3 px-3 font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {tx.amount.toLocaleString()} {currency}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-lg bg-muted text-[11px] font-bold">
                              {tx.method === "cash" ? "نقداً من الخزينة" : tx.method === "bank_transfer" ? "تحويل بنكي" : "شيك مصرفي"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-muted-foreground font-medium max-w-[200px] truncate">
                            {tx.title} {tx.notes ? `(${tx.notes})` : ""}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge tone="success" className="text-[10px] font-black">
                              معتمد ومسحوب
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </PageCard>

            {/* Contract & Banking Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <PageCard title="بيانات العقد والإجازات">
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between p-2.5 rounded-xl bg-muted/20">
                    <span className="text-muted-foreground font-bold">نوع العقد الأكاديمي:</span>
                    <span className="font-black text-foreground">{latestContract?.type === "contractor" ? "عقد تعاون / زيارة" : "عقد عمل سنوي معتمد"}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-muted/20">
                    <span className="text-muted-foreground font-bold">تاريخ المباشرة والعقد:</span>
                    <span className="font-black text-foreground tabular-nums">{latestContract?.startDate || "2024-08-01"}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-muted/20">
                    <span className="text-muted-foreground font-bold">تاريخ انتهاء التعاقد:</span>
                    <span className="font-black text-foreground tabular-nums">{latestContract?.endDate || "2025-08-01"}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-muted/20">
                    <span className="text-muted-foreground font-bold">رصيد الإجازات السنوية المتبقي:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{remainingLeaveBalance} يوم متبقي</span>
                  </div>
                </div>
              </PageCard>

              <PageCard title="الحساب المصرفي والتحويل">
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between p-2.5 rounded-xl bg-muted/20">
                    <span className="text-muted-foreground font-bold">المصرف المعتمد:</span>
                    <span className="font-black text-foreground">{financeForm.bankName || "بنك الخرطوم"}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-muted/20">
                    <span className="text-muted-foreground font-bold">رقم الحساب / الآيبان (IBAN):</span>
                    <span className="font-black text-foreground font-mono" dir="ltr">{financeForm.iban || "SD88 BKN0 0000 1234 5678 9012"}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-muted/20">
                    <span className="text-muted-foreground font-bold">الرقم الضريبي / التأميني:</span>
                    <span className="font-black text-foreground font-mono" dir="ltr">{(t as any).taxNumber || "TX-9902341"}</span>
                  </div>
                </div>
              </PageCard>
            </div>
          </div>
        )}

        {/* TAB 6: Attendance & KPIs Performance */}
        {tab === "kpis" && (
          <div className="space-y-5">
            {/* KPI Performance Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-border/70 bg-card p-5 text-center shadow-xs">
                <span className="text-xs font-bold text-muted-foreground">معدل الحضور والانضباط</span>
                <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mt-2 mb-1 tabular-nums">
                  98.5%
                </div>
                <span className="text-[11px] text-muted-foreground font-bold">خلال العام الدراسي الحالي</span>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-5 text-center shadow-xs">
                <span className="text-xs font-bold text-muted-foreground">تقييم الأداء التربوي</span>
                <div className="text-4xl font-black text-primary mt-2 mb-1 tabular-nums">
                  {latestEvaluation ? latestEvaluation.overallScore.toFixed(1) : "4.8"} <span className="text-xs font-normal text-muted-foreground">/ 5</span>
                </div>
                <span className="text-[11px] text-primary font-bold">أداء متميز واستثنائي</span>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-5 text-center shadow-xs">
                <span className="text-xs font-bold text-muted-foreground">التأخير والاستئذان</span>
                <div className="text-4xl font-black text-foreground mt-2 mb-1 tabular-nums">
                  0 <span className="text-xs font-normal text-muted-foreground">دقيقة</span>
                </div>
                <span className="text-[11px] text-muted-foreground font-bold">التزام تام بالمواعيد المدرسية</span>
              </div>
            </div>

            {/* Performance Criteria Breakdown */}
            <PageCard title="معايير تقييم الأداء والـ KPIs المعتمدة">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/60">
                  <span className="text-muted-foreground font-bold block mb-1">الانضباط والالتزام المهني</span>
                  <div className="text-lg font-black text-primary tabular-nums">5.0 / 5</div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div className="bg-primary h-full rounded-full w-full"></div>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/60">
                  <span className="text-muted-foreground font-bold block mb-1">التمكن من المادة والتدريس</span>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">4.8 / 5</div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div className="bg-emerald-500 h-full rounded-full w-[96%]"></div>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/60">
                  <span className="text-muted-foreground font-bold block mb-1">التعاون مع الإدارة والزملاء</span>
                  <div className="text-lg font-black text-blue-600 dark:text-blue-400 tabular-nums">5.0 / 5</div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div className="bg-blue-500 h-full rounded-full w-full"></div>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/60">
                  <span className="text-muted-foreground font-bold block mb-1">المبادرات وتحفيز الطلاب</span>
                  <div className="text-lg font-black text-amber-600 dark:text-amber-400 tabular-nums">4.6 / 5</div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div className="bg-amber-500 h-full rounded-full w-[92%]"></div>
                  </div>
                </div>
              </div>
            </PageCard>

            {/* Attendance History Log */}
            <PageCard title="سجل تسجيل الحضور والبصمة اليومية">
              {teacherAttendance.length === 0 ? (
                <p className="text-xs text-muted-foreground font-bold p-4 text-center">لا توجد سجلات حضور مسجلة لهذا المعلم.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {teacherAttendance.slice(0, 8).map(att => (
                    <div key={att.id} className="p-3 rounded-2xl border border-border/60 bg-card text-xs">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-black text-foreground tabular-nums">{att.date}</span>
                        <Badge tone={att.status === "present" ? "success" : att.status === "late" ? "warning" : "danger"}>
                          {att.status === "present" ? "حاضر" : att.status === "late" ? "متأخر" : "غائب"}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex justify-between">
                        <span>وقت الحضور:</span>
                        <span className="font-bold tabular-nums">{att.checkIn || "07:15 ص"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PageCard>
          </div>
        )}

      </div>

      {/* Quick Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
          <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border/60 shrink-0 bg-primary/5">
              <h2 className="text-base font-black text-foreground">تعديل الملف المهني للمعلم</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="h-8 w-8 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs font-bold">
              <div>
                <label className="block mb-1 text-foreground">الاسم الرباعي</label>
                <input 
                  value={editFormData.name} 
                  onChange={e => setEditFormData({...editFormData, name: e.target.value})} 
                  className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-foreground">المسمى الوظيفي</label>
                  <input 
                    value={editFormData.role} 
                    onChange={e => setEditFormData({...editFormData, role: e.target.value})} 
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-foreground">رقم الجوال</label>
                  <input 
                    value={editFormData.phone} 
                    onChange={e => setEditFormData({...editFormData, phone: e.target.value})} 
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary tabular-nums"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-foreground">المؤهل</label>
                  <input 
                    value={editFormData.qualification} 
                    onChange={e => setEditFormData({...editFormData, qualification: e.target.value})} 
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-foreground">الحالة الوظيفية</label>
                  <select 
                    value={editFormData.status} 
                    onChange={e => setEditFormData({...editFormData, status: e.target.value as any})} 
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="active">على رأس العمل</option>
                    <option value="on_leave">في إجازة</option>
                    <option value="terminated">غير نشط</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="h-10 px-5 rounded-xl border border-input text-xs font-bold">إلغاء</button>
                <button type="submit" className="h-10 px-7 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md glow-primary">حفظ التغييرات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Modal: Slot Assignment & Conflict-Aware Editor */}
      {isSlotModalOpen && selectedCoord && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsSlotModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-lg rounded-3xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-150 p-6 space-y-4 my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="font-black text-base text-foreground">إسناد وتعديل حصة في جدول المعلم</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedCoord.day} • الحصة {selectedCoord.period} ({periodTimeRanges[selectedCoord.period]?.start} - {periodTimeRanges[selectedCoord.period]?.end})
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsSlotModalOpen(false)}
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conflict Detection Warning Banner */}
            {(() => {
              const conflict = checkTeacherConflict(selectedCoord.day, selectedCoord.period, slotSectionId, editingSlotId || undefined);
              if (!conflict) return null;
              return (
                <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black block">تحذير تعارض في المواعيد:</span>
                    <span className="opacity-90">{conflict.message}</span>
                    {preventConflicts && (
                      <span className="block text-[11px] mt-1 underline">
                        ملاحظة: نظام منع التعارض نشط، لن يُسمح بالتثبيت حتى يتم فك التعارض أو تعطيل النظام.
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            <form onSubmit={handleSaveSlot} className="space-y-4 text-xs font-bold">
              {/* Stage Selector */}
              <div>
                <label className="block text-foreground mb-1">المرحلة الدراسية</label>
                <select
                  value={slotStage}
                  onChange={(e) => {
                    const stg = e.target.value;
                    setSlotStage(stg);
                    const firstSec = allSections.find(s => s.stage === stg);
                    setSlotSectionId(firstSec?.id || "");
                    const firstSub = allSubjects.find(s => s.stage === stg || s.stage === "all");
                    setSlotSubjectId(firstSub?.id || "");
                  }}
                  className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
                >
                  <option value="kindergarten">مرحلة رياض الأطفال</option>
                  <option value="primary">المرحلة الابتدائية</option>
                  <option value="middle">المرحلة المتوسطة</option>
                  <option value="high">المرحلة الثانوية</option>
                </select>
              </div>

              {/* Section Selector */}
              <div>
                <label className="block text-foreground mb-1">الشعبة والفصل الدراسي</label>
                <select
                  value={slotSectionId}
                  onChange={(e) => {
                    const secId = e.target.value;
                    setSlotSectionId(secId);
                    const sec = allSections.find(s => s.id === secId);
                    if (sec?.roomId) setSlotRoomId(sec.roomId);
                  }}
                  className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
                  required
                >
                  <option value="">-- اختر الشعبة --</option>
                  {allSections
                    .filter(s => !slotStage || s.stage === slotStage)
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.grade} - شعبة {s.name} ({s.roomName || "قاعة عامة"})
                      </option>
                    ))}
                </select>
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block text-foreground mb-1">المادة التعليمية</label>
                <select
                  value={slotSubjectId}
                  onChange={(e) => setSlotSubjectId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
                  required
                >
                  <option value="">-- اختر المادة التعليمية --</option>
                  {allSubjects
                    .filter(s => s.stage === "all" || !slotStage || s.stage === slotStage)
                    .map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code || "عام"})
                      </option>
                    ))}
                </select>
              </div>

              {/* Room Selector */}
              <div>
                <label className="block text-foreground mb-1">القاعة / المعمل (اختياري)</label>
                <select
                  value={slotRoomId}
                  onChange={(e) => setSlotRoomId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">-- القاعة الافتراضية للشعبة --</option>
                  {allRooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type === "lab" ? "مختبر/معمل" : "فصل دراسي"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-foreground mb-1">ملاحظات الحصة (اختياري)</label>
                <input
                  type="text"
                  value={slotNotes}
                  onChange={(e) => setSlotNotes(e.target.value)}
                  placeholder="مثال: مراجعة دورية، حصة نشاط، معمل حاسب..."
                  className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border/70">
                {editingSlotId ? (
                  <button
                    type="button"
                    onClick={handleDeleteSlot}
                    className="h-10 px-4 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>تفريغ الحصة</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSlotModalOpen(false)}
                    className="h-10 px-4 rounded-xl border border-input text-xs font-bold hover:bg-muted transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-xs font-black transition-all shadow-md glow-primary cursor-pointer active:scale-95"
                  >
                    تثبيت الحصة في الجدول
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Timetable Timing & Breaks Setting */}
      {isTimingModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsTimingModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-lg rounded-3xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-150 p-6 space-y-4 my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="font-black text-base text-foreground">ضبط تواقيت الحصص والفسح المدرسية</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  تحديد مواعيد الحصص وفترات الراحة والفسح اليومية للمنظومة
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsTimingModalOpen(false)}
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Presets */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">القوالب الزمنية الجاهزة:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTempTimingSettings(prev => ({ ...prev, startTime: "07:30", periodDuration: 45 }))}
                  className="p-2 rounded-xl border border-border/70 hover:border-primary/50 text-center text-xs font-bold bg-muted/20 hover:bg-primary/5 transition-all"
                >
                  <Sun className="w-3.5 h-3.5 mx-auto mb-1 text-amber-500" />
                  <span>التوقيت الصيفي</span>
                  <span className="block text-[10px] text-muted-foreground">07:30 ص</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTempTimingSettings(prev => ({ ...prev, startTime: "08:00", periodDuration: 45 }))}
                  className="p-2 rounded-xl border border-border/70 hover:border-primary/50 text-center text-xs font-bold bg-muted/20 hover:bg-primary/5 transition-all"
                >
                  <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-blue-500" />
                  <span>التوقيت الشتوي</span>
                  <span className="block text-[10px] text-muted-foreground">08:00 ص</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTempTimingSettings(prev => ({ ...prev, startTime: "09:00", periodDuration: 35 }))}
                  className="p-2 rounded-xl border border-border/70 hover:border-primary/50 text-center text-xs font-bold bg-muted/20 hover:bg-primary/5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-500" />
                  <span>شهر رمضان</span>
                  <span className="block text-[10px] text-muted-foreground">09:00 ص</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-bold">
              <div>
                <label className="block text-foreground mb-1">وقت بدء الحصة الأولى</label>
                <input
                  type="time"
                  value={tempTimingSettings.startTime}
                  onChange={(e) => setTempTimingSettings(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary tabular-nums"
                />
              </div>
              <div>
                <label className="block text-foreground mb-1">مدة الحصة الدراسية (دقيقة)</label>
                <input
                  type="number"
                  min="20"
                  max="60"
                  value={tempTimingSettings.periodDuration}
                  onChange={(e) => setTempTimingSettings(prev => ({ ...prev, periodDuration: Number(e.target.value) }))}
                  className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary tabular-nums"
                />
              </div>
            </div>

            {/* Breaks Manager */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-foreground">فترات الفسح والراحة المدرسية:</label>
              {tempTimingSettings.breaks.map((brk, bIdx) => (
                <div key={bIdx} className="p-3 rounded-2xl border border-border/60 bg-muted/20 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <span className="font-black text-foreground">{brk.name}</span>
                      <span className="text-[10px] text-muted-foreground block">
                        تلي الحصة رقم {brk.afterPeriod} مباشرة
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-muted-foreground font-bold">المدة:</label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={brk.duration}
                      onChange={(e) => {
                        const newBreaks = [...tempTimingSettings.breaks];
                        newBreaks[bIdx] = { ...newBreaks[bIdx], duration: Number(e.target.value) };
                        setTempTimingSettings(prev => ({ ...prev, breaks: newBreaks }));
                      }}
                      className="w-16 h-8 rounded-lg border border-input bg-background text-center font-bold tabular-nums text-xs"
                    />
                    <span className="text-muted-foreground text-[11px]">د</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/70">
              <button
                type="button"
                onClick={() => setIsTimingModalOpen(false)}
                className="h-10 px-4 rounded-xl border border-input text-xs font-bold hover:bg-muted transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveTimetableTiming}
                className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-xs font-black transition-all shadow-md glow-primary cursor-pointer active:scale-95"
              >
                اعتماد التواقيت والفسح
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Salary Scheme & Financial Structure Editor */}
      {isFinanceModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsFinanceModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-xl rounded-3xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-150 p-6 space-y-4 my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="font-black text-base text-foreground">تعديل الهيكل المالي ونظام الأجر للمعلم</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  تحديد طريقة احتساب الاستحقاقات: راتب شهري، بالحصة، بالساعة، أو أسبوعي/يومي
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsFinanceModalOpen(false)}
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFinance} className="space-y-4 text-xs font-bold">
              {/* Payment Scheme Type */}
              <div>
                <label className="block text-foreground mb-1.5">نظام احتساب الأجر المعتمد:</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { id: "Monthly", label: "راتب شهري" },
                    { id: "PerLesson", label: "بالحصص" },
                    { id: "Hourly", label: "بالساعة" },
                    { id: "Weekly", label: "أسبوعي" },
                    { id: "Daily", label: "يومي" },
                  ].map(scheme => (
                    <button
                      key={scheme.id}
                      type="button"
                      onClick={() => setFinanceForm(prev => ({ ...prev, paymentType: scheme.id as any }))}
                      className={`p-2.5 rounded-xl border text-center font-black transition-all cursor-pointer ${
                        financeForm.paymentType === scheme.id
                          ? "border-primary bg-primary text-primary-foreground shadow-xs"
                          : "border-border/70 bg-card hover:bg-muted text-foreground"
                      }`}
                    >
                      {scheme.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Amount according to scheme */}
              {financeForm.paymentType === "Monthly" ? (
                <div>
                  <label className="block text-foreground mb-1">الراتب الأساسي الشهري ({currency})</label>
                  <input
                    type="number"
                    value={financeForm.basicSalary}
                    onChange={(e) => setFinanceForm(prev => ({ ...prev, basicSalary: Number(e.target.value) }))}
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary tabular-nums"
                    required
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-foreground mb-1">
                      سعر {financeForm.paymentType === "PerLesson" ? "الحصة الواحدة" : financeForm.paymentType === "Hourly" ? "الساعة التدريسية" : financeForm.paymentType === "Weekly" ? "الأسبوع" : "اليوم"} ({currency})
                    </label>
                    <input
                      type="number"
                      value={financeForm.rate}
                      onChange={(e) => setFinanceForm(prev => ({ ...prev, rate: Number(e.target.value) }))}
                      className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary tabular-nums"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-foreground mb-1">الراتب الأساسي التكميلي (إن وجد)</label>
                    <input
                      type="number"
                      value={financeForm.basicSalary}
                      onChange={(e) => setFinanceForm(prev => ({ ...prev, basicSalary: Number(e.target.value) }))}
                      className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary tabular-nums"
                    />
                  </div>
                </div>
              )}

              {/* Multi-Stage Rates (for PerLesson model) */}
              {financeForm.paymentType === "PerLesson" && (
                <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/60 space-y-2.5">
                  <span className="font-black text-foreground block">
                    تخصيص سعر الحصة حسب المرحلة الدراسية ({currency} / حصة):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: "kindergarten", name: "رياض أطفال" },
                      { key: "primary", name: "ابتدائي" },
                      { key: "middle", name: "متوسط" },
                      { key: "high", name: "ثانوي" },
                    ].map(stg => (
                      <div key={stg.key}>
                        <label className="text-[10px] text-muted-foreground block mb-0.5">{stg.name}</label>
                        <input
                          type="number"
                          value={financeForm.stageRates[stg.key] || financeForm.rate || 70}
                          onChange={(e) => {
                            const newRates = { ...financeForm.stageRates, [stg.key]: Number(e.target.value) };
                            setFinanceForm(prev => ({ ...prev, stageRates: newRates }));
                          }}
                          className="w-full h-8 rounded-lg border border-input bg-background text-center text-xs font-bold tabular-nums"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Allowances & Deductions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground mb-1">إجمالي البدلات والمكافآت ({currency})</label>
                  <input
                    type="number"
                    value={financeForm.allowance}
                    onChange={(e) => setFinanceForm(prev => ({ ...prev, allowance: Number(e.target.value) }))}
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-foreground mb-1">إجمالي الاستقطاعات والخصم ({currency})</label>
                  <input
                    type="number"
                    value={financeForm.deduction}
                    onChange={(e) => setFinanceForm(prev => ({ ...prev, deduction: Number(e.target.value) }))}
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary tabular-nums"
                  />
                </div>
              </div>

              {/* Banking Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground mb-1">اسم المصرف المعتمد</label>
                  <input
                    type="text"
                    value={financeForm.bankName}
                    onChange={(e) => setFinanceForm(prev => ({ ...prev, bankName: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-foreground mb-1">رقم الآيبان (IBAN)</label>
                  <input
                    type="text"
                    value={financeForm.iban}
                    onChange={(e) => setFinanceForm(prev => ({ ...prev, iban: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/70">
                <button
                  type="button"
                  onClick={() => setIsFinanceModalOpen(false)}
                  className="h-10 px-4 rounded-xl border border-input text-xs font-bold hover:bg-muted transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-xs font-black transition-all shadow-md glow-primary cursor-pointer active:scale-95"
                >
                  حفظ الهيكل المالي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Treasury Direct Disbursement & Withdrawal */}
      {isDisburseModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsDisburseModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-lg rounded-3xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-150 p-6 space-y-4 my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-black">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground">صرف مستحقات وسحب من الخزينة</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    المستفيد: <span className="font-black text-foreground">{t.name}</span> ({t.employeeNo || t.id})
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsDisburseModalOpen(false)}
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteDisbursement} className="space-y-4 text-xs font-bold">
              {/* Amount */}
              <div>
                <label className="block text-foreground mb-1">المبلغ المطلوب صرفه ({currency})</label>
                <input
                  type="number"
                  min="1"
                  value={disburseForm.amount}
                  onChange={(e) => setDisburseForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full h-11 rounded-xl border border-input bg-background px-3.5 text-base font-black text-primary outline-none focus:border-primary tabular-nums"
                  required
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  الصافي المحسوب لهذا الشهر: {netSalary.toLocaleString()} {currency}
                </span>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-foreground mb-1.5">طريقة الصرف والسحب:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "cash", label: "نقداً من الخزينة", icon: Wallet },
                    { id: "bank_transfer", label: "تحويل بنكي", icon: CreditCard },
                    { id: "cheque", label: "شيك مصرفي", icon: Receipt },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setDisburseForm(prev => ({ ...prev, method: m.id as any }))}
                      className={`p-2.5 rounded-xl border text-center font-black transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        disburseForm.method === m.id
                          ? "border-primary bg-primary/10 text-primary shadow-xs"
                          : "border-border/70 bg-card hover:bg-muted text-foreground"
                      }`}
                    >
                      <m.icon className="w-4 h-4" />
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground mb-1">شهر الاستحقاق</label>
                  <input
                    type="month"
                    value={disburseForm.month}
                    onChange={(e) => setDisburseForm(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-foreground mb-1">رقم السند المالي المرجعي</label>
                  <input
                    type="text"
                    value={disburseForm.referenceNo}
                    onChange={(e) => setDisburseForm(prev => ({ ...prev, referenceNo: e.target.value }))}
                    placeholder={`PAY-${t.employeeNo || t.id}-01`}
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-foreground mb-1">بيان الصرف وملاحظات المحاسب</label>
                <input
                  type="text"
                  value={disburseForm.notes}
                  onChange={(e) => setDisburseForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={`صرف أجر ومستحقات شهر ${disburseForm.month} بنظام ${financeForm.paymentType}`}
                  className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary"
                />
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  سيتم خصم هذا المبلغ تلقائياً من رصيد الخزينة المدرسية وتسجيله في سجل المصروفات العام فور التأكيد.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/70">
                <button
                  type="button"
                  onClick={() => setIsDisburseModalOpen(false)}
                  className="h-10 px-4 rounded-xl border border-input text-xs font-bold hover:bg-muted transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="h-10 px-7 rounded-xl bg-primary text-primary-foreground text-xs font-black transition-all shadow-md glow-primary cursor-pointer active:scale-95"
                >
                  تأكيد الصرف والخصم من الخزينة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advanced Print Engine Modal */}
      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title={activePrintTemplate === "teacher-card" ? `بطاقة تعريف المعلم: ${t.name}` : `خطاب التكليف الأكاديمي: ${t.name}`}
        data={printData}
        templates={printTemplates}
        defaultTemplateId={activePrintTemplate}
      />
    </AppShell>
  );
}
