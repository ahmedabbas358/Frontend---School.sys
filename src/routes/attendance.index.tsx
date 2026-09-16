import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore, Staff, Student, StaffAttendanceRecord, ScheduleSlot } from "@/contexts/GlobalStoreContext";
import { useStage, GRADE_OPTIONS, EducationalStage } from "@/contexts/StageContext";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Search,
  Sparkles,
  Save,
  RotateCcw,
  Calendar,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Printer,
  FileSpreadsheet,
  Share2,
  Smartphone,
  QrCode,
  UserCheck,
  Building2,
  Briefcase,
  Wrench,
  GraduationCap,
  DoorOpen,
  Filter,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  UserCog,
  Copy,
  ExternalLink,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { ArabicDatePicker } from "@/components/ui/arabic-date-picker";

export const Route = createFileRoute("/attendance/")({
  head: () => ({
    meta: [
      { title: "مركز وسجل الحضور والانضباط الموحد | منصة مدارس" },
      { name: "description", content: "إدارة حضور الطلاب، الأساتذة، الإداريين، الموظفين، والعمال مع تكامل كامل بالأنصبة والسجلات اليومية" }
    ],
  }),
  component: UnifiedAttendanceHubPage,
});

type AttendanceCategoryTab = "students_classes" | "teachers" | "administration" | "specialists" | "workers_support" | "daily_summary";

type PresenceStatus = "present" | "absent" | "late" | "excused";

const STATUS_MAP: Record<PresenceStatus, { label: string; bg: string; text: string; border: string; icon: any }> = {
  present: {
    label: "حاضر",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/25",
    icon: CheckCircle2
  },
  absent: {
    label: "غائب",
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500/25",
    icon: XCircle
  },
  late: {
    label: "متأخر",
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/25",
    icon: Clock
  },
  excused: {
    label: "مأذون/بعذر",
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/25",
    icon: HelpCircle
  },
};

export function UnifiedAttendanceHubPage() {
  const { stage, getStageLabel } = useStage();
  const {
    allStudents,
    allStaff,
    activeStageStudents,
    activeStageSections,
    activeStageStaff,
    activeStageSubjects,
    activeStageScheduleSlots,
    allStaffAttendance,
    allAttendanceSessions,
    allAttendanceRecords,
    allStudentEnrollments,
    currentAcademicYearId,
    currentAcademicYear,
    activeAcademicTerm,
    upsertStaffAttendance,
    addAttendanceSession,
    bulkRecordStudentAttendance,
  } = useGlobalStore();

  // Active Category Tab
  const [activeCategory, setActiveCategory] = useState<AttendanceCategoryTab>("students_classes");

  // Selected Date (defaults to today)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Search Filter per category
  const [searchQuery, setSearchQuery] = useState("");

  // =========================================================================
  // CATEGORY 1: STUDENTS & CLASS SUPERVISORS STATE
  // =========================================================================
  const availableGrades = useMemo(() => GRADE_OPTIONS[stage] || [], [stage]);
  const [studentGrade, setStudentGrade] = useState<string>(() => availableGrades[0] || "الصف الأول");

  const sectionsInSelectedGrade = useMemo(() => {
    return activeStageSections.filter(s => s.grade === studentGrade);
  }, [activeStageSections, studentGrade]);

  const [studentSectionId, setStudentSectionId] = useState<string>(() => {
    return sectionsInSelectedGrade[0]?.id || activeStageSections[0]?.id || "";
  });

  useEffect(() => {
    if (sectionsInSelectedGrade.length > 0 && !sectionsInSelectedGrade.some(s => s.id === studentSectionId)) {
      setStudentSectionId(sectionsInSelectedGrade[0].id);
    }
  }, [studentGrade, sectionsInSelectedGrade, studentSectionId]);

  const currentSection = useMemo(() => {
    return activeStageSections.find(s => s.id === studentSectionId) || sectionsInSelectedGrade[0] || activeStageSections[0];
  }, [activeStageSections, studentSectionId, sectionsInSelectedGrade]);

  const [selectedPeriod, setSelectedPeriod] = useState<number | "morning">("morning");
  const [classSupervisorName, setClassSupervisorName] = useState<string>("أ. محمد الفاتح (مشرف الدور)");

  // Students in current section
  const sectionStudents = useMemo(() => {
    if (!currentSection) return [];
    return activeStageStudents.filter(s => {
      const enrollment = allStudentEnrollments.find(e => e.studentId === s.id && e.academicYearId === currentAcademicYearId);
      return enrollment?.sectionId === currentSection.id || s.sectionId === currentSection.id;
    });
  }, [currentSection, activeStageStudents, allStudentEnrollments, currentAcademicYearId]);

  // Local student attendance marks map: studentId -> status
  const [studentMarks, setStudentMarks] = useState<Record<string, { status: PresenceStatus; notes: string }>>({});

  // Seed default present marks when section changes or date changes
  useEffect(() => {
    if (sectionStudents.length > 0) {
      const initial: Record<string, { status: PresenceStatus; notes: string }> = {};
      sectionStudents.forEach(s => {
        initial[s.id] = studentMarks[s.id] || { status: "present", notes: "" };
      });
      setStudentMarks(initial);
    }
  }, [currentSection?.id, selectedDate]);

  // =========================================================================
  // CATEGORY 2, 3, 4, 5: STAFF SEPARATION
  // =========================================================================

  // 1. Teachers (الأساتذة)
  const teachersList = useMemo(() => {
    return allStaff.filter(s => {
      if (s.isDeleted || s.status === "terminated") return false;
      const dept = (s.department || "").toLowerCase();
      const role = (s.role || "").toLowerCase();
      return dept.includes("تعليم") || dept.includes("تدريس") || role.includes("معلم") || role.includes("أستاذ") || role.includes("مدرس");
    });
  }, [allStaff]);

  // 2. Administrators (الإداريون)
  const adminList = useMemo(() => {
    return allStaff.filter(s => {
      if (s.isDeleted || s.status === "terminated") return false;
      const dept = (s.department || "").toLowerCase();
      const role = (s.role || "").toLowerCase();
      return (
        dept.includes("إدار") ||
        role.includes("مدير") ||
        role.includes("وكيل") ||
        role.includes("سكرتير") ||
        role.includes("شؤون الطلاب") ||
        role.includes("محاسب") ||
        role.includes("قبول")
      ) && !role.includes("معلم") && !role.includes("عامل");
    });
  }, [allStaff]);

  // 3. Specialists & Technical Staff (الموظفون والأخصائيون)
  const specialistsList = useMemo(() => {
    return allStaff.filter(s => {
      if (s.isDeleted || s.status === "terminated") return false;
      const role = (s.role || "").toLowerCase();
      return (
        role.includes("أخصائي") ||
        role.includes("مرشد") ||
        role.includes("أمين") ||
        role.includes("محضر") ||
        role.includes("تقني") ||
        role.includes("نشاط") ||
        role.includes("صحي") ||
        role.includes("موجه")
      );
    });
  }, [allStaff]);

  // 4. Support Workers, Security & Janitors (العمال والحراسة والخدمات المساندة)
  const workersList = useMemo(() => {
    return allStaff.filter(s => {
      if (s.isDeleted || s.status === "terminated") return false;
      const dept = (s.department || "").toLowerCase();
      const role = (s.role || "").toLowerCase();
      return (
        dept.includes("خدمات") ||
        dept.includes("صيانة") ||
        dept.includes("نقل") ||
        role.includes("عامل") ||
        role.includes("حارس") ||
        role.includes("أمن") ||
        role.includes("سائق") ||
        role.includes("نظافة") ||
        role.includes("بوابة")
      );
    });
  }, [allStaff]);

  // Quick helper to read or set staff attendance for a given staff on selectedDate
  const getStaffAttendance = (staffId: string) => {
    return allStaffAttendance.find(r => r.staffId === staffId && r.date === selectedDate);
  };

  const handleUpdateStaffStatus = (staffId: string, status: "present" | "absent" | "late" | "excused", checkInTime?: string) => {
    const existing = getStaffAttendance(staffId);
    const nowTime = new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    upsertStaffAttendance({
      id: existing?.id || `ATT-${staffId}-${selectedDate}`,
      staffId,
      date: selectedDate,
      status,
      checkIn: checkInTime || existing?.checkIn || (status !== "absent" ? nowTime : undefined),
      checkOut: existing?.checkOut,
      markedAt: new Date().toISOString(),
      markedBy: "الإدارة المدرسية"
    });
    toast.success("تم تحديث حالة الحضور فورياً");
  };

  // Substitute Teacher Modal State
  const [substituteModalData, setSubstituteModalData] = useState<{ originalTeacherId: string; teacherName: string } | null>(null);
  const [selectedSubstituteTeacherId, setSelectedSubstituteTeacherId] = useState<string>("");

  // Mobile / PWA Link Export Modal State
  const [isMobileExportModalOpen, setIsMobileExportModalOpen] = useState(false);

  // Quick Check-in by ID Modal State
  const [isQuickScanModalOpen, setIsQuickScanModalOpen] = useState(false);
  const [quickScanInput, setQuickScanInput] = useState("");

  // Advanced Print Engine State
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // =========================================================================
  // METRICS COMPUTATION (Real-time rates across all 5 groups)
  // =========================================================================
  const metrics = useMemo(() => {
    // Students Stats in Current View
    const totalStudents = sectionStudents.length;
    let stPresent = 0;
    let stAbsent = 0;
    let stLate = 0;
    let stExcused = 0;

    Object.values(studentMarks).forEach(m => {
      if (m.status === "present") stPresent++;
      else if (m.status === "absent") stAbsent++;
      else if (m.status === "late") stLate++;
      else if (m.status === "excused") stExcused++;
    });

    const studentRate = totalStudents > 0 ? Math.round(((stPresent + stLate) / totalStudents) * 100) : 100;

    // Staff Groups Stats
    const getGroupStats = (list: Staff[]) => {
      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;
      list.forEach(s => {
        const att = allStaffAttendance.find(r => r.staffId === s.id && r.date === selectedDate);
        if (!att || att.status === "present") present++;
        else if (att.status === "absent") absent++;
        else if (att.status === "late") late++;
        else if (att.status === "excused" || att.status === "on_leave") excused++;
      });
      const rate = list.length > 0 ? Math.round(((present + late) / list.length) * 100) : 100;
      return { total: list.length, present, absent, late, excused, rate };
    };

    return {
      students: { total: totalStudents, present: stPresent, absent: stAbsent, late: stLate, excused: stExcused, rate: studentRate },
      teachers: getGroupStats(teachersList),
      admin: getGroupStats(adminList),
      specialists: getGroupStats(specialistsList),
      workers: getGroupStats(workersList),
    };
  }, [sectionStudents, studentMarks, teachersList, adminList, specialistsList, workersList, allStaffAttendance, selectedDate]);

  // Handle Save Student Attendance
  const handleSaveStudentAttendance = () => {
    if (!currentSection) return;
    const recordsToSave = Object.entries(studentMarks).map(([studentId, data]) => {
      const enrollment = allStudentEnrollments.find(e => e.studentId === studentId && e.academicYearId === currentAcademicYearId);
      return {
        studentEnrollmentId: enrollment?.id || studentId,
        status: data.status.toUpperCase() as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
        remarks: data.notes || undefined,
        markedAt: new Date().toISOString(),
        markedBy: classSupervisorName
      };
    });

    bulkRecordStudentAttendance({
      academicYearId: currentAcademicYearId || "Y-1002",
      sectionId: currentSection.id,
      date: selectedDate,
      periodNumber: selectedPeriod === "morning" ? 1 : Number(selectedPeriod),
      supervisorName: classSupervisorName,
      records: recordsToSave
    });

    toast.success(`تم حفظ واعتماد رصد حضور شعبة (${currentSection.name}) بنجاح!`, {
      description: `تم رصد ${recordsToSave.length} طالباً (${metrics.students.present} حاضر، ${metrics.students.absent} غائب)`
    });
  };

  // Bulk mark all students
  const handleSetAllStudentsMark = (status: PresenceStatus) => {
    setStudentMarks(prev => {
      const updated: Record<string, { status: PresenceStatus; notes: string }> = {};
      sectionStudents.forEach(s => {
        updated[s.id] = { status, notes: prev[s.id]?.notes || "" };
      });
      return updated;
    });
    toast.success(`تم تعيين حالة جميع الطلاب إلى (${STATUS_MAP[status].label})`);
  };

  // Copy mobile link to clipboard
  const handleCopyMobileLink = (path: string, label: string) => {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
    toast.success(`تم نسخ رابط ${label} إلى الحافظة!`, {
      description: "يمكنك إرساله عبر واتساب أو الرسائل لهواتف المشرفين الميدانيين."
    });
  };

  // Print templates
  const printTemplates: PrintTemplate[] = useMemo(() => {
    return [
      {
        id: "daily-attendance-sheet",
        name: "كشف الحضور اليومي المعتمد",
        category: "الحضور والانضباط",
        type: "document",
        description: "كشف حضور رسمي يتضمن ملخص الانضباط وتوقيعات الإدارة المدرسية",
        renderDocument: () => (
          <div className="p-8 bg-white text-gray-900 border-2 border-gray-800 rounded-2xl space-y-6" dir="rtl">
            <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4">
              <div className="text-right text-xs">
                <p className="font-black text-primary">المملكة العربية السعودية</p>
                <p className="font-bold">منصة مدارس الأهلية النموذجية</p>
                <p className="text-gray-600">شؤون الطلاب • قسم الحضور والانضباط</p>
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-black">كشف الحضور والانضباط اليومي المعتمد</h1>
                <p className="text-xs font-bold text-gray-700 mt-1">تاريخ الكشف: {selectedDate}</p>
                <span className="text-[11px] font-bold text-primary px-3 py-0.5 rounded-full bg-primary/10 inline-block mt-1">
                  {getStageLabel(stage)} • {activeAcademicTerm?.name || "الفصل الدراسي الحالي"}
                </span>
              </div>
              <div className="text-left text-xs font-bold space-y-1">
                <div>نسبة الحضور الطلابية: {metrics.students.rate}%</div>
                <div>نسبة حضور الأساتذة: {metrics.teachers.rate}%</div>
                <div>وقت الطباعة: {new Date().toLocaleTimeString("ar-SA")}</div>
              </div>
            </div>

            {/* Content Table */}
            <table className="w-full border-collapse border-2 border-gray-800 text-center text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-800 p-2 font-black">#</th>
                  <th className="border border-gray-800 p-2 font-black">الاسم</th>
                  <th className="border border-gray-800 p-2 font-black">الفئة / الصف</th>
                  <th className="border border-gray-800 p-2 font-black">الشعبة / المسمى</th>
                  <th className="border border-gray-800 p-2 font-black">الحالة</th>
                  <th className="border border-gray-800 p-2 font-black">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {sectionStudents.map((s, idx) => {
                  const mark = studentMarks[s.id] || { status: "present", notes: "" };
                  return (
                    <tr key={s.id}>
                      <td className="border border-gray-600 p-2 font-bold">{idx + 1}</td>
                      <td className="border border-gray-600 p-2 font-bold text-right">{s.name}</td>
                      <td className="border border-gray-600 p-2">{s.grade}</td>
                      <td className="border border-gray-600 p-2">شعبة ({currentSection?.name})</td>
                      <td className="border border-gray-600 p-2 font-black">
                        {STATUS_MAP[mark.status].label}
                      </td>
                      <td className="border border-gray-600 p-2 text-gray-600 text-[11px]">{mark.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs font-bold border-t border-gray-800">
              <div>
                <p>مشرف الدور / الفصل</p>
                <p className="mt-8 text-gray-400">........................</p>
              </div>
              <div>
                <p>وكيل شؤون الطلاب</p>
                <p className="mt-8 text-gray-400">........................</p>
              </div>
              <div>
                <p>الختم الرسمي للمدرسة</p>
                <div className="h-12 w-12 mx-auto rounded-full border border-dashed border-gray-400 mt-2" />
              </div>
            </div>
          </div>
        )
      }
    ];
  }, [sectionStudents, studentMarks, currentSection, selectedDate, stage, activeAcademicTerm, metrics]);

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الحضور والانضباط", to: "/attendance" },
        { label: "لوحة وسجل الحضور الموحد" }
      ]}
      actions={
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {/* Mobile / PWA Apps Export Button */}
          <button
            onClick={() => setIsMobileExportModalOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3.5 text-xs font-bold hover:bg-muted text-foreground transition-all shadow-xs active:scale-95 shrink-0"
            title="تصدير وتوزيع روابط الحضور الميداني لهواتف المشرفين والعمال"
          >
            <Smartphone className="h-4 w-4 text-primary" />
            <span>تصدير روابط الهواتف</span>
          </button>

          {/* Quick Scan Button */}
          <button
            onClick={() => setIsQuickScanModalOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/25 text-primary px-3 text-xs font-black hover:bg-primary/20 transition-all shadow-xs active:scale-95 shrink-0"
          >
            <QrCode className="h-4 w-4" />
            <span className="hidden sm:inline">تحضير سريع (باركود)</span>
          </button>

          {/* Print Button */}
          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3 text-xs font-bold hover:bg-accent text-foreground transition-all shadow-xs active:scale-95 shrink-0"
          >
            <Printer className="h-4 w-4 text-muted-foreground" />
            <span className="hidden sm:inline">طباعة الكشف</span>
          </button>

          {/* Save Student Attendance (If in students tab) */}
          {activeCategory === "students_classes" && (
            <button
              onClick={handleSaveStudentAttendance}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 text-white px-4 text-xs font-black hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 active:scale-95 shrink-0"
            >
              <Save className="h-4 w-4" />
              <span>حفظ واعتماد الحضور</span>
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-400 font-sans" dir="rtl">

        {/* Top Master Banner: Date Picker + Quick Stage Badge */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-gradient-to-r from-card via-card/95 to-primary/5 border border-border/80 rounded-3xl p-6 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-foreground">مركز وسجل الحضور والانضباط الموحد</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>النظام اليومي الفعلي</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                رصد وإدارة حضور كافة مكونات المنظومة التعليمية بفصل دقيق للأساتذة والإداريين والعمال والطلاب لـ ({getStageLabel(stage)})
              </p>
            </div>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-background/80 p-1.5 rounded-2xl border border-border/80 shrink-0">
            <Calendar className="w-4 h-4 text-primary mr-2" />
            <span className="text-xs font-bold text-muted-foreground">تاريخ الرصد:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-muted/40 border border-border/60 rounded-xl px-3 py-1.5 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* 5 Distinct Category Tabs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Tab 1: Students & Classes */}
          <button
            onClick={() => { setActiveCategory("students_classes"); setSearchQuery(""); }}
            className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-2 ${
              activeCategory === "students_classes"
                ? "bg-primary text-primary-foreground border-primary shadow-md glow-primary"
                : "bg-card hover:bg-muted/50 border-border/70 text-foreground shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <Users className="w-4 h-4" />
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activeCategory === "students_classes" ? "bg-white/20" : "bg-primary/10 text-primary"}`}>
                {metrics.students.rate}% انضباط
              </span>
            </div>
            <div>
              <div className="font-black text-xs">حضور الطلاب بالفصول</div>
              <div className={`text-[10px] mt-0.5 ${activeCategory === "students_classes" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {metrics.students.present} حاضر من {metrics.students.total}
              </div>
            </div>
          </button>

          {/* Tab 2: Teachers (الأساتذة) */}
          <button
            onClick={() => { setActiveCategory("teachers"); setSearchQuery(""); }}
            className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-2 ${
              activeCategory === "teachers"
                ? "bg-primary text-primary-foreground border-primary shadow-md glow-primary"
                : "bg-card hover:bg-muted/50 border-border/70 text-foreground shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <GraduationCap className="w-4 h-4" />
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activeCategory === "teachers" ? "bg-white/20" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
                {metrics.teachers.rate}%
              </span>
            </div>
            <div>
              <div className="font-black text-xs">الأساتذة والمعلمون</div>
              <div className={`text-[10px] mt-0.5 ${activeCategory === "teachers" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {metrics.teachers.total} أعضاء هيئة تدريس
              </div>
            </div>
          </button>

          {/* Tab 3: Administration (الإداريون) */}
          <button
            onClick={() => { setActiveCategory("administration"); setSearchQuery(""); }}
            className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-2 ${
              activeCategory === "administration"
                ? "bg-primary text-primary-foreground border-primary shadow-md glow-primary"
                : "bg-card hover:bg-muted/50 border-border/70 text-foreground shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <Building2 className="w-4 h-4" />
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activeCategory === "administration" ? "bg-white/20" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"}`}>
                {metrics.admin.rate}%
              </span>
            </div>
            <div>
              <div className="font-black text-xs">الكادر الإداري</div>
              <div className={`text-[10px] mt-0.5 ${activeCategory === "administration" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {metrics.admin.total} إداريون ومسؤولون
              </div>
            </div>
          </button>

          {/* Tab 4: Specialists (الموظفون والأخصائيون) */}
          <button
            onClick={() => { setActiveCategory("specialists"); setSearchQuery(""); }}
            className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-2 ${
              activeCategory === "specialists"
                ? "bg-primary text-primary-foreground border-primary shadow-md glow-primary"
                : "bg-card hover:bg-muted/50 border-border/70 text-foreground shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <Briefcase className="w-4 h-4" />
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activeCategory === "specialists" ? "bg-white/20" : "bg-purple-500/10 text-purple-600 dark:text-purple-400"}`}>
                {metrics.specialists.rate}%
              </span>
            </div>
            <div>
              <div className="font-black text-xs">الموظفون والأخصائيون</div>
              <div className={`text-[10px] mt-0.5 ${activeCategory === "specialists" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {metrics.specialists.total} أخصائي وفني
              </div>
            </div>
          </button>

          {/* Tab 5: Workers & Support (العمال والحراسة) */}
          <button
            onClick={() => { setActiveCategory("workers_support"); setSearchQuery(""); }}
            className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-2 ${
              activeCategory === "workers_support"
                ? "bg-primary text-primary-foreground border-primary shadow-md glow-primary"
                : "bg-card hover:bg-muted/50 border-border/70 text-foreground shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <Wrench className="w-4 h-4" />
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activeCategory === "workers_support" ? "bg-white/20" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                {metrics.workers.rate}%
              </span>
            </div>
            <div>
              <div className="font-black text-xs">العمال والخدمات</div>
              <div className={`text-[10px] mt-0.5 ${activeCategory === "workers_support" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {metrics.workers.total} عمال وحراس
              </div>
            </div>
          </button>

          {/* Tab 6: Unified Summary */}
          <button
            onClick={() => { setActiveCategory("daily_summary"); setSearchQuery(""); }}
            className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-2 ${
              activeCategory === "daily_summary"
                ? "bg-primary text-primary-foreground border-primary shadow-md glow-primary"
                : "bg-card hover:bg-muted/50 border-border/70 text-foreground shadow-2xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="w-4 h-4" />
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activeCategory === "daily_summary" ? "bg-white/20" : "bg-muted text-foreground"}`}>
                شامل
              </span>
            </div>
            <div>
              <div className="font-black text-xs">السجل اليومي والانضباط</div>
              <div className={`text-[10px] mt-0.5 ${activeCategory === "daily_summary" ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                تقارير وتحليلات اليوم
              </div>
            </div>
          </button>
        </div>

        {/* =========================================================================
            TAB CONTENT 1: STUDENTS & CLASS SUPERVISORS
            ========================================================================= */}
        {activeCategory === "students_classes" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Control Ribbon: Grade, Section, Period, Supervisor */}
            <div className="bg-card p-5 rounded-3xl border border-border/80 shadow-xs space-y-4">
              {/* Grade Selector Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/60">
                <span className="text-xs font-bold text-muted-foreground shrink-0 pl-2">اختر الصف:</span>
                {availableGrades.map(g => (
                  <button
                    key={g}
                    onClick={() => setStudentGrade(g)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${
                      studentGrade === g
                        ? "bg-primary text-primary-foreground shadow-xs glow-primary"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>{g}</span>
                  </button>
                ))}
              </div>

              {/* Section Selector + Period + Supervisor Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* Section Selector Pills */}
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-foreground mb-1.5">الشعبة الدراسية:</label>
                  <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto custom-scrollbar">
                    {sectionsInSelectedGrade.map(sec => {
                      const isSelected = studentSectionId === sec.id;
                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => setStudentSectionId(sec.id)}
                          className={`h-11 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-xs glow-primary font-black scale-[1.02]"
                              : "bg-muted/40 hover:bg-muted text-foreground border border-border/60"
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>شعبة ({sec.name})</span>
                          {sec.homeroomTeacher && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-normal ${
                              isSelected ? "bg-white/20 text-white" : "bg-background/80 text-muted-foreground"
                            }`}>
                              رائد: {sec.homeroomTeacher}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Period Picker */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">الحصة أو الفترة:</label>
                  <div className="flex items-center gap-1 overflow-x-auto">
                    <button
                      onClick={() => setSelectedPeriod("morning")}
                      className={`h-11 px-3 rounded-xl text-xs font-black transition-all shrink-0 ${
                        selectedPeriod === "morning"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      طابور الصباح
                    </button>
                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                      <button
                        key={num}
                        onClick={() => setSelectedPeriod(num)}
                        className={`h-11 min-w-9 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          selectedPeriod === num
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        ح {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assigned Floor/Class Supervisor */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">المشرف الميداني المسؤول:</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={classSupervisorName}
                      onChange={e => setClassSupervisorName(e.target.value)}
                      placeholder="اسم مشرف الدور أو الفصل"
                      className="w-full h-11 rounded-xl border border-input bg-background pr-10 pl-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <ShieldCheck className="w-4 h-4 text-primary absolute right-3.5 top-3.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Bulk Mark Actions & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSetAllStudentsMark("present")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 text-xs font-black transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تحديد الكل حاضر</span>
                  </button>
                  <button
                    onClick={() => handleSetAllStudentsMark("absent")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-3 text-xs font-black transition-all active:scale-95"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>تحديد الكل غائب</span>
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="ابحث باسم الطالب أو الهوية..."
                    className="w-full h-9 rounded-xl border border-border/70 bg-background pr-9 pl-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Students Attendance List */}
            {sectionStudents.length === 0 ? (
              <div className="p-12 text-center bg-card rounded-3xl border border-border/80 space-y-3">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50" />
                <h3 className="font-black text-base text-foreground">لا يوجد طلاب مسجلون في هذه الشعبة</h3>
                <p className="text-xs text-muted-foreground">تأكد من تسكين الطلاب في الصف والشعبة عبر قسم الفصول الأكاديمية.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sectionStudents
                  .filter(s => !searchQuery.trim() || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.nationalId || "").includes(searchQuery))
                  .map((student, idx) => {
                    const currentMark = studentMarks[student.id] || { status: "present", notes: "" };
                    return (
                      <div
                        key={student.id}
                        className="bg-card hover:bg-muted/30 border border-border/70 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        {/* Student Info */}
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-sm text-foreground">{student.name}</h4>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                #{student.nationalId || student.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                              <span>ولي الأمر: {student.guardianName || "غير محدد"}</span>
                              <span>•</span>
                              <span>هاتف: {student.guardianPhone || "—"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Select Buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                          {(["present", "absent", "late", "excused"] as PresenceStatus[]).map(stKey => {
                            const conf = STATUS_MAP[stKey];
                            const isSelected = currentMark.status === stKey;
                            const IconComponent = conf.icon;
                            return (
                              <button
                                key={stKey}
                                onClick={() => {
                                  setStudentMarks(prev => ({
                                    ...prev,
                                    [student.id]: { ...currentMark, status: stKey }
                                  }));
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  isSelected
                                    ? `${conf.bg} ${conf.text} border-2 ${conf.border} shadow-xs font-black`
                                    : "bg-muted/30 hover:bg-muted text-muted-foreground border border-transparent"
                                }`}
                              >
                                <IconComponent className="w-3.5 h-3.5" />
                                <span>{conf.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB CONTENT 2: TEACHERS & ACADEMIC FACULTY (الأساتذة)
            ========================================================================= */}
        {activeCategory === "teachers" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-card p-5 rounded-3xl border border-border/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-base text-foreground">كشف حضور وانضباط الهيئة التعليمية</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  رصد حضور المعلمين، ارتباطهم بحصص الجدول المدرسي، وتعيين معلم احتياط في حال الغياب
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث باسم المعلم أو التخصص..."
                  className="w-full h-10 rounded-xl border border-border/70 bg-background pr-9 pl-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              {teachersList
                .filter(t => !searchQuery.trim() || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || (t.role || "").includes(searchQuery))
                .map((teacher, idx) => {
                  const record = getStaffAttendance(teacher.id);
                  const currentStatus = record?.status || "present";

                  // Find today's slots for this teacher
                  const todaySlots = activeStageScheduleSlots.filter(s => s.teacherId === teacher.id);

                  return (
                    <div
                      key={teacher.id}
                      className="bg-card hover:bg-muted/20 border border-border/70 rounded-2xl p-4 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center shrink-0">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm text-foreground">{teacher.name}</h4>
                            <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-bold text-foreground">
                              {teacher.role}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              #{teacher.employeeNo || teacher.id}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-semibold">
                            <span className="flex items-center gap-1 text-primary">
                              <Clock className="w-3.5 h-3.5" />
                              <span>حصص اليوم: {todaySlots.length} حصة</span>
                            </span>
                            <span>•</span>
                            <span>الحضور: {record?.checkIn || "07:15 ص"}</span>
                            <span>•</span>
                            <span>الانصراف: {record?.checkOut || "01:45 م"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Buttons & Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleUpdateStaffStatus(teacher.id, "present")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            currentStatus === "present"
                              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 font-black"
                              : "bg-muted/30 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>حاضر بالحصة</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStaffStatus(teacher.id, "late")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            currentStatus === "late"
                              ? "bg-amber-500/15 text-amber-600 border border-amber-500/30 font-black"
                              : "bg-muted/30 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>متأخر</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStaffStatus(teacher.id, "absent")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            currentStatus === "absent"
                              ? "bg-rose-500/15 text-rose-600 border border-rose-500/30 font-black"
                              : "bg-muted/30 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>غائب</span>
                        </button>

                        {/* If teacher is absent: show Substitute button */}
                        {currentStatus === "absent" && (
                          <button
                            onClick={() => {
                              setSubstituteModalData({ originalTeacherId: teacher.id, teacherName: teacher.name });
                              setSelectedSubstituteTeacherId("");
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-black bg-purple-500/15 text-purple-600 border border-purple-500/30 hover:bg-purple-500/25 transition-all flex items-center gap-1"
                          >
                            <UserCog className="w-3.5 h-3.5" />
                            <span>تكليف بديل (احتياط)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB CONTENT 3: ADMINISTRATIVE STAFF (الإداريون)
            ========================================================================= */}
        {activeCategory === "administration" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-card p-5 rounded-3xl border border-border/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-base text-foreground">كشف حضور الكادر الإداري والقيادي</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  المدير، الوكلاء، شؤون الطلاب، المحاسبون، وسكرتارية الإدارة المدرسية
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث باسم الموظف الإداري..."
                  className="w-full h-10 rounded-xl border border-border/70 bg-background pr-9 pl-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              {adminList
                .filter(a => !searchQuery.trim() || a.name.toLowerCase().includes(searchQuery.toLowerCase()) || (a.role || "").includes(searchQuery))
                .map((admin, idx) => {
                  const record = getStaffAttendance(admin.id);
                  const currentStatus = record?.status || "present";

                  return (
                    <div
                      key={admin.id}
                      className="bg-card hover:bg-muted/20 border border-border/70 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-blue-500/10 text-blue-600 font-black text-sm flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm text-foreground">{admin.name}</h4>
                            <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold">
                              {admin.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-semibold">
                            <span>القسم: {admin.department || "الإدارة العامة"}</span>
                            <span>•</span>
                            <span>الحضور: {record?.checkIn || "07:05 ص"}</span>
                            <span>•</span>
                            <span>الانصراف: {record?.checkOut || "02:15 م"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateStaffStatus(admin.id, "present")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            currentStatus === "present"
                              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 font-black"
                              : "bg-muted/30 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>في المكتب</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStaffStatus(admin.id, "late")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            currentStatus === "late"
                              ? "bg-amber-500/15 text-amber-600 border border-amber-500/30 font-black"
                              : "bg-muted/30 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>متأخر</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStaffStatus(admin.id, "excused")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            currentStatus === "excused"
                              ? "bg-blue-500/15 text-blue-600 border border-blue-500/30 font-black"
                              : "bg-muted/30 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>مهمة رسمية</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStaffStatus(admin.id, "absent")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            currentStatus === "absent"
                              ? "bg-rose-500/15 text-rose-600 border border-rose-500/30 font-black"
                              : "bg-muted/30 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>غائب</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB CONTENT 4: SPECIALISTS & TECHNICAL STAFF (الموظفون والأخصائيون)
            ========================================================================= */}
        {activeCategory === "specialists" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-card p-5 rounded-3xl border border-border/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-base text-foreground">كشف حضور الموظفين والأخصائيين</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  المرشدون الطلابيون، أمناء المصادر، محضرو المختبرات، وأخصائيو تقنية المعلومات
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث باسم الأخصائي أو الوظيفة..."
                  className="w-full h-10 rounded-xl border border-border/70 bg-background pr-9 pl-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              {specialistsList
                .filter(s => !searchQuery.trim() || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.role || "").includes(searchQuery))
                .map((spec, idx) => {
                  const record = getStaffAttendance(spec.id);
                  const currentStatus = record?.status || "present";

                  return (
                    <div
                      key={spec.id}
                      className="bg-card hover:bg-muted/20 border border-border/70 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-purple-500/10 text-purple-600 font-black text-sm flex items-center justify-center shrink-0">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm text-foreground">{spec.name}</h4>
                            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold">
                              {spec.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-semibold">
                            <span>القسم: {spec.department || "الشؤون التعليمية والمساندة"}</span>
                            <span>•</span>
                            <span>الحضور: {record?.checkIn || "07:10 ص"}</span>
                            <span>•</span>
                            <span>الانصراف: {record?.checkOut || "02:00 م"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateStaffStatus(spec.id, "present")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            currentStatus === "present"
                              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 font-black"
                              : "bg-muted/30 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>حاضر</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStaffStatus(spec.id, "late")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            currentStatus === "late"
                              ? "bg-amber-500/15 text-amber-600 border border-amber-500/30 font-black"
                              : "bg-muted/30 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>متأخر</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStaffStatus(spec.id, "absent")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            currentStatus === "absent"
                              ? "bg-rose-500/15 text-rose-600 border border-rose-500/30 font-black"
                              : "bg-muted/30 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>غائب</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB CONTENT 5: WORKERS & SUPPORT STAFF (العمال والحراسة)
            ========================================================================= */}
        {activeCategory === "workers_support" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-card p-5 rounded-3xl border border-border/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-base text-foreground">كشف حضور العمال والحراسة والخدمات المساندة</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  حراس البوابات، عمال الصيانة والنظافة، سائقو الحافلات، وفرق الخدمات
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث باسم العامل أو الموقع..."
                  className="w-full h-10 rounded-xl border border-border/70 bg-background pr-9 pl-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              {workersList
                .filter(w => !searchQuery.trim() || w.name.toLowerCase().includes(searchQuery.toLowerCase()) || (w.role || "").includes(searchQuery))
                .map((worker, idx) => {
                  const record = getStaffAttendance(worker.id);
                  const currentStatus = record?.status || "present";

                  return (
                    <div
                      key={worker.id}
                      className="bg-card hover:bg-muted/20 border border-border/70 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-600 font-black text-sm flex items-center justify-center shrink-0">
                          <Wrench className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm text-foreground">{worker.name}</h4>
                            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                              {worker.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-semibold">
                            <span>الموقع: {worker.department || "البوابة الرئيسية والمرافق"}</span>
                            <span>•</span>
                            <span>وقت الدخول: {record?.checkIn || "06:30 ص"}</span>
                            <span>•</span>
                            <span>تسجيل الخروج: {record?.checkOut || "لم ينصرف بعد"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateStaffStatus(worker.id, "present")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            currentStatus === "present"
                              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 font-black"
                              : "bg-muted/30 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>داخل المدرسة</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStaffStatus(worker.id, "late")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            currentStatus === "late"
                              ? "bg-amber-500/15 text-amber-600 border border-amber-500/30 font-black"
                              : "bg-muted/30 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>متأخر</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStaffStatus(worker.id, "absent")}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            currentStatus === "absent"
                              ? "bg-rose-500/15 text-rose-600 border border-rose-500/30 font-black"
                              : "bg-muted/30 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>غائب</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB CONTENT 6: UNIFIED DAILY SUMMARY & DISCIPLINE
            ========================================================================= */}
        {activeCategory === "daily_summary" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Rates Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-xs space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">انضباط الطلاب</span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{metrics.students.rate}%</div>
                <span className="text-[11px] text-muted-foreground">{metrics.students.present} حاضر من {metrics.students.total}</span>
              </div>

              <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-xs space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">انضباط الأساتذة</span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{metrics.teachers.rate}%</div>
                <span className="text-[11px] text-muted-foreground">{metrics.teachers.present} حاضر من {metrics.teachers.total}</span>
              </div>

              <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-xs space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">انضباط الإداريين</span>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">{metrics.admin.rate}%</div>
                <span className="text-[11px] text-muted-foreground">{metrics.admin.present} حاضر من {metrics.admin.total}</span>
              </div>

              <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-xs space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">انضباط الموظفين</span>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400 tabular-nums">{metrics.specialists.rate}%</div>
                <span className="text-[11px] text-muted-foreground">{metrics.specialists.present} حاضر من {metrics.specialists.total}</span>
              </div>

              <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-xs space-y-1">
                <span className="text-xs font-bold text-muted-foreground block">انضباط العمال</span>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">{metrics.workers.rate}%</div>
                <span className="text-[11px] text-muted-foreground">{metrics.workers.present} حاضر من {metrics.workers.total}</span>
              </div>
            </div>

            {/* Quick Navigation to Discipline Incidents & Merits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/discipline/incidents"
                className="p-5 rounded-3xl bg-card hover:bg-muted/40 border border-border/80 shadow-xs transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-black shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-foreground group-hover:text-primary transition-colors">
                      سجل المخالفات السلوكية والإنذارات
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      متابعة حالات الغياب المتكرر والتأخر وإصدار الإشعارات الرسمية لأولياء الأمور
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:-translate-x-1" />
              </Link>

              <Link
                to="/discipline/merits"
                className="p-5 rounded-3xl bg-card hover:bg-muted/40 border border-border/80 shadow-xs transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-foreground group-hover:text-primary transition-colors">
                      سجل التميز ونقاط الانضباط السلوكي
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      تكريم الطلاب والكوادر الملتزمين بنسبة حضور 100% بدون أي غياب أو تأخير
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:-translate-x-1" />
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
          MODAL: Substitute Teacher Assignment Modal
          ========================================================================= */}
      {substituteModalData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setSubstituteModalData(null)}
          dir="rtl"
        >
          <div
            className="w-full max-w-md modal-card-luxury p-6 rounded-3xl border border-border/80 bg-card/98 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150 space-y-4 my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-black">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-foreground">تكليف معلم بديل (احتياط)</h3>
                  <p className="text-[11px] text-muted-foreground">تغطية حصص المعلم الغائب لمنع فراغ الفصول</p>
                </div>
              </div>
              <button onClick={() => setSubstituteModalData(null)} className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                <span className="text-muted-foreground font-semibold block text-[11px]">المعلم الأساسي (الغائب):</span>
                <span className="font-black text-sm text-foreground block">{substituteModalData.teacherName}</span>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1.5">اختر المعلم البديل المتاح في نفس الفترة:</label>
                <select
                  value={selectedSubstituteTeacherId}
                  onChange={e => setSelectedSubstituteTeacherId(e.target.value)}
                  className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  <option value="">-- اختر المعلم الاحتياط --</option>
                  {teachersList
                    .filter(t => t.id !== substituteModalData.originalTeacherId)
                    .map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.role})
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/25 text-purple-700 dark:text-purple-300 text-[11px] font-semibold leading-relaxed">
                ℹ️ سيتم إرسال إشعار فوري للمعلم البديل بالحصص المكلف بتغطيتها، وتوثيق ذلك في سجل الاحتياط المدرسي.
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 flex justify-end gap-2">
              <button
                onClick={() => setSubstituteModalData(null)}
                className="px-4 py-2 rounded-xl border border-input bg-background text-xs font-bold text-foreground hover:bg-muted"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (!selectedSubstituteTeacherId) {
                    toast.error("الرجاء اختيار معلم بديل");
                    return;
                  }
                  const subTeacher = teachersList.find(t => t.id === selectedSubstituteTeacherId);
                  toast.success(`تم تكليف (${subTeacher?.name}) كبديل لـ (${substituteModalData.teacherName}) بنجاح!`);
                  setSubstituteModalData(null);
                }}
                className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-black shadow-md hover:bg-purple-700 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>اعتماد التكليف</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Mobile / PWA App Export Modal (تصدير روابط الهواتف للمشرفين والعمال)
          ========================================================================= */}
      {isMobileExportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsMobileExportModalOpen(false)}
          dir="rtl"
        >
          <div
            className="w-full max-w-lg modal-card-luxury p-6 sm:p-7 rounded-3xl border border-border/80 bg-card/98 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150 space-y-4 my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground">تصدير تطبيقات الحضور للهواتف والمشرفين</h3>
                  <p className="text-xs text-muted-foreground">روابط مخصصة تعمل بكفاءة على هواتف المشرفين والعمال في الميدان</p>
                </div>
              </div>
              <button onClick={() => setIsMobileExportModalOpen(false)} className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                لا داعي لعرض واجهة الهاتف داخل لوحة تحكم الإدارة المكتبية؛ يمكنك إرسال هذه الروابط المخصصة والمحمية مباشرة لهواتف الكوادر الميدانية:
              </p>

              {/* Link 1: Class Supervisors Mobile App */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="font-black text-sm text-foreground">تطبيق المشرفين (رصد حضور الفصول)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">هواتف المشرفين</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  مخصص لمشرفي الأدوار والفصول لتسجيل الحضور بنقرة سريعة أثناء المرور الميداني.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleCopyMobileLink("/supervisor/classes", "تطبيق رصد الفصول")}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ رابط الهاتف (لإرساله عبر واتساب)</span>
                  </button>
                  <a
                    href="/supervisor/classes"
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 w-9 rounded-xl border border-border/70 bg-card flex items-center justify-center text-muted-foreground hover:text-foreground"
                    title="فتح في نافذة جديدة"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Link 2: Gate & Worker Check-in App */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary" />
                    <span className="font-black text-sm text-foreground">بوابة تحضير العمال والحراسة (عند البوابة)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">بوابة الاستقبال</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  مخصص لمشرف البوابة العامة لتحضير كافة الكوادر والعمال لحظة الدخول والخروج.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleCopyMobileLink("/supervisor/gate", "بوابة تحضير العمال")}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ رابط بوابة الاستقبال</span>
                  </button>
                  <a
                    href="/supervisor/gate"
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 w-9 rounded-xl border border-border/70 bg-card flex items-center justify-center text-muted-foreground hover:text-foreground"
                    title="فتح في نافذة جديدة"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 flex justify-end">
              <button
                onClick={() => setIsMobileExportModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-card border border-border/70 text-xs font-bold text-foreground hover:bg-muted"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Quick Scan / Barcode Check-in
          ========================================================================= */}
      {isQuickScanModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsQuickScanModalOpen(false)}
          dir="rtl"
        >
          <div
            className="w-full max-w-md modal-card-luxury p-6 rounded-3xl border border-border/80 bg-card/98 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150 space-y-4 my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-foreground">التحضير السريع بالباركود / الرقم التعريفي</h3>
                  <p className="text-[11px] text-muted-foreground">مسح فوري لبطاقة الطالب أو الموظف لتسجيل الحضور</p>
                </div>
              </div>
              <button onClick={() => setIsQuickScanModalOpen(false)} className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!quickScanInput.trim()) return;
                const query = quickScanInput.trim().toLowerCase();
                // Match student or staff
                const student = allStudents.find(s => (s.nationalId || "").includes(query) || s.id.toLowerCase().includes(query) || s.name.toLowerCase().includes(query));
                const staffMember = allStaff.find(s => (s.nationalId || "").includes(query) || (s.employeeNo || "").includes(query) || s.id.toLowerCase().includes(query) || s.name.toLowerCase().includes(query));

                if (student) {
                  setStudentMarks(prev => ({
                    ...prev,
                    [student.id]: { status: "present", notes: "تم التحضير عبر الباركود السريع" }
                  }));
                  toast.success(`✓ تم تحضير الطالب: ${student.name} بنجاح!`);
                  setQuickScanInput("");
                } else if (staffMember) {
                  handleUpdateStaffStatus(staffMember.id, "present");
                  toast.success(`✓ تم تحضير الموظف: ${staffMember.name} (${staffMember.role}) بنجاح!`);
                  setQuickScanInput("");
                } else {
                  toast.error("لم يتم العثور على طالب أو موظف بهذا الرقم التعريفي");
                }
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-foreground mb-1.5">امسح الباركود أو أدخل الرقم الوطني / الوظيفي:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={quickScanInput}
                    onChange={e => setQuickScanInput(e.target.value)}
                    placeholder="امسح بالماسح الضوئي أو اكتب الرقم..."
                    autoFocus
                    className="w-full h-11 rounded-xl border border-input bg-background pr-10 pl-3 text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                  />
                  <QrCode className="w-5 h-5 text-primary absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground leading-relaxed">
                💡 النظام يدعم قارئات الباركود والـ RFID تلقائياً بمجرد مسح البطاقة المدرسية أو كود الطالب/الموظف.
              </div>

              <div className="pt-3 border-t border-border/60 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickScanModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-input bg-background text-xs font-bold text-foreground hover:bg-muted"
                >
                  إغلاق
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md hover:bg-primary/90 transition-all active:scale-95 glow-primary"
                >
                  تسجيل الحضور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advanced Print Engine */}
      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="كشف الحضور والانضباط اليومي المعتمد"
        subtitle={`التاريخ: ${selectedDate} • المرحلة: ${getStageLabel(stage)} • شعبة (${currentSection?.name})`}
        data={sectionStudents}
        templates={printTemplates}
      />
    </AppShell>
  );
}
