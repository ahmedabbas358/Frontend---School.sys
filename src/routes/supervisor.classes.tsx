import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage, EducationalStage } from "@/contexts/StageContext";
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
  ArrowRight,
  ShieldCheck,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  Share2,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/supervisor/classes")({
  component: SupervisorClassesAttendance,
});

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; icon: any; activeClass: string; badgeClass: string }
> = {
  PRESENT: {
    label: "حاضر",
    icon: CheckCircle2,
    activeClass: "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20",
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  ABSENT: {
    label: "غائب",
    icon: XCircle,
    activeClass: "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20",
    badgeClass: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
  LATE: {
    label: "متأخر",
    icon: Clock,
    activeClass: "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20",
    badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  EXCUSED: {
    label: "مأذون",
    icon: HelpCircle,
    activeClass: "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
};

const STAGES: { id: EducationalStage; label: string }[] = [
  { id: "kindergarten", label: "رياض الأطفال" },
  { id: "primary", label: "الابتدائي" },
  { id: "middle", label: "المتوسط" },
  { id: "high", label: "الثانوي" },
];

export function SupervisorClassesAttendance() {
  const {
    allStudents,
    allStudentEnrollments,
    currentAcademicYearId,
    activeStageSections,
    allAttendanceSessions,
    allAttendanceRecords,
    bulkRecordStudentAttendance,
  } = useGlobalStore();

  const { stage: globalStage, setStage } = useStage();

  // Selected date in YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [supervisorName, setSupervisorName] = useState("مشرف الدور / الفصل");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isSaving, setIsSaving] = useState(false);

  // Class sections for current stage
  const availableSections = activeStageSections;
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    availableSections[0]?.id || ""
  );

  // Sync selected section when available sections change
  useEffect(() => {
    if (availableSections.length > 0) {
      if (!availableSections.some((s) => s.id === selectedSectionId)) {
        setSelectedSectionId(availableSections[0].id);
      }
    } else {
      setSelectedSectionId("");
    }
  }, [availableSections, selectedSectionId]);

  const currentSection = availableSections.find((s) => s.id === selectedSectionId);

  // Students in current section
  const sectionStudents = useMemo(() => {
    if (!selectedSectionId || !currentAcademicYearId) return [];

    const sectionEnrollments = allStudentEnrollments.filter(
      (e) =>
        e.academicYearId === currentAcademicYearId &&
        e.sectionId === selectedSectionId &&
        e.status === "نشط"
    );

    return sectionEnrollments
      .map((enrollment, index) => {
        const studentInfo = allStudents.find((s) => s.id === enrollment.studentId);
        return {
          enrollmentId: enrollment.id,
          studentId: enrollment.studentId,
          nationalId: studentInfo?.nationalId || "---",
          name: studentInfo?.name || "طالب بدون اسم",
          gender: studentInfo?.gender || "ذكر",
          guardianName: studentInfo?.guardianName || "",
          guardianPhone: studentInfo?.guardianPhone || "",
          orderNumber: index + 1,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, [selectedSectionId, currentAcademicYearId, allStudentEnrollments, allStudents]);

  // Attendance marks state: enrollmentId -> AttendanceStatus
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  // Load existing session records if available
  useEffect(() => {
    if (!selectedSectionId || !selectedDate || !currentAcademicYearId) {
      setMarks({});
      return;
    }

    const existingSession = allAttendanceSessions.find(
      (s) =>
        s.academicYearId === currentAcademicYearId &&
        s.sectionId === selectedSectionId &&
        s.date === selectedDate &&
        s.periodNumber === selectedPeriod
    );

    if (existingSession) {
      const recordsForSession = allAttendanceRecords.filter(
        (r) => r.sessionId === existingSession.id
      );
      const initialMarks: Record<string, AttendanceStatus> = {};
      const initialNotes: Record<string, string> = {};

      recordsForSession.forEach((r) => {
        if (
          r.status === "PRESENT" ||
          r.status === "ABSENT" ||
          r.status === "LATE" ||
          r.status === "EXCUSED"
        ) {
          initialMarks[r.studentEnrollmentId] = r.status;
        }
        if (r.note) {
          initialNotes[r.studentEnrollmentId] = r.note;
        }
      });

      setMarks(initialMarks);
      setNotes(initialNotes);
    } else {
      // By default when opening a new session, leave unselected or allow 1-tap "حاضر للكل"
      setMarks({});
      setNotes({});
    }
  }, [selectedSectionId, selectedDate, selectedPeriod, currentAcademicYearId, allAttendanceSessions, allAttendanceRecords]);

  // Mark single student
  const setStudentStatus = (enrollmentId: string, status: AttendanceStatus) => {
    setMarks((prev) => ({
      ...prev,
      [enrollmentId]: status,
    }));
  };

  // Bulk actions
  const markAllAs = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    sectionStudents.forEach((student) => {
      updated[student.enrollmentId] = status;
    });
    setMarks(updated);
    toast.success(`تم تعيين جميع الطلاب (${sectionStudents.length}) كـ "${STATUS_CONFIG[status].label}"`);
  };

  const resetAllMarks = () => {
    setMarks({});
    toast.info("تم تفريغ رصد الحضور لهذا الفصل");
  };

  // Counts & stats
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    let unrecorded = 0;

    sectionStudents.forEach((st) => {
      const mark = marks[st.enrollmentId];
      if (mark === "PRESENT") present++;
      else if (mark === "ABSENT") absent++;
      else if (mark === "LATE") late++;
      else if (mark === "EXCUSED") excused++;
      else unrecorded++;
    });

    return {
      total: sectionStudents.length,
      present,
      absent,
      late,
      excused,
      unrecorded,
      recordedCount: sectionStudents.length - unrecorded,
      percent: sectionStudents.length > 0
        ? Math.round(((sectionStudents.length - unrecorded) / sectionStudents.length) * 100)
        : 0,
    };
  }, [sectionStudents, marks]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return sectionStudents.filter((st) => {
      const matchesSearch =
        st.name.includes(searchQuery) ||
        st.nationalId.includes(searchQuery) ||
        st.guardianName.includes(searchQuery);

      if (!matchesSearch) return false;

      if (filterStatus === "all") return true;
      if (filterStatus === "unrecorded") return !marks[st.enrollmentId];
      return marks[st.enrollmentId] === filterStatus;
    });
  }, [sectionStudents, searchQuery, filterStatus, marks]);

  // Save & Sync Attendance
  const handleSaveAndSync = () => {
    if (!currentAcademicYearId) {
      toast.error("لا يوجد عام دراسي نشط!");
      return;
    }
    if (!selectedSectionId) {
      toast.error("يرجى اختيار الشعبة / الفصل أولاً");
      return;
    }
    if (sectionStudents.length === 0) {
      toast.error("لا يوجد طلاب مسجلين في هذا الفصل");
      return;
    }

    setIsSaving(true);

    try {
      const recordsToSave = sectionStudents.map((st) => ({
        studentEnrollmentId: st.enrollmentId,
        status: marks[st.enrollmentId] || "PRESENT", // default unrecorded to present upon sync if needed
        note: notes[st.enrollmentId],
      }));

      // Update marks state for any unrecorded students defaulted to present
      const updatedMarks = { ...marks };
      sectionStudents.forEach((st) => {
        if (!updatedMarks[st.enrollmentId]) {
          updatedMarks[st.enrollmentId] = "PRESENT";
        }
      });
      setMarks(updatedMarks);

      bulkRecordStudentAttendance({
        academicYearId: currentAcademicYearId,
        sectionId: selectedSectionId,
        date: selectedDate,
        periodNumber: selectedPeriod,
        supervisorName: supervisorName || "مشرف الحضور",
        records: recordsToSave,
      });

      toast.success("تم مزامنة وحفظ رصد الحضور بنجاح في السجل المركزي!", {
        description: `تم اعتماد رصد ${recordsToSave.length} طالباً (${stats.present} حاضر، ${stats.absent} غائب)`,
      });
    } catch (e) {
      toast.error("حدث خطأ أثناء المزامنة، يرجى المحاولة ثانية");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-36 font-sans antialiased" dir="rtl">
      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              to="/supervisor"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="العودة لبوابة المشرفين"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  رصد المشرفين
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  الحصة {selectedPeriod}
                </span>
              </div>
              <h1 className="text-base font-bold tracking-tight">
                رصد حضور الطلاب بالفصول
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAndSync}
              disabled={isSaving || sectionStudents.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "جارِ الحفظ..." : "مزامنة"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Stage Selector Pills */}
        <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="grid grid-cols-4 gap-1">
            {STAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStage(s.id)}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                  globalStage === s.id
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section, Date & Period Controls */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Section Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                الفصل / الشعبة
              </label>
              <div className="relative">
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  {availableSections.length === 0 ? (
                    <option value="">لا توجد شعب مسجلة</option>
                  ) : (
                    availableSections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.grade} - {sec.name}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="w-4 h-4 absolute left-3 top-2.5 pointer-events-none text-slate-400" />
              </div>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                التاريخ
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
            {/* Period Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                رقم الحصة الدراسية
              </label>
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSelectedPeriod(num)}
                    className={`min-w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      selectedPeriod === num
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Supervisor Name / ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                اسم المشرف الميداني
              </label>
              <input
                type="text"
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                placeholder="اسم المشرف"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Live Statistics Cards */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-2.5 text-center">
            <span className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mb-0.5">حاضر</span>
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">
              {stats.present}
            </span>
          </div>

          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-2.5 text-center">
            <span className="block text-[11px] font-bold text-rose-700 dark:text-rose-300 mb-0.5">غائب</span>
            <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400 leading-none">
              {stats.absent}
            </span>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-2.5 text-center">
            <span className="block text-[11px] font-bold text-amber-700 dark:text-amber-300 mb-0.5">متأخر</span>
            <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 leading-none">
              {stats.late}
            </span>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-2.5 text-center">
            <span className="block text-[11px] font-bold text-blue-700 dark:text-blue-300 mb-0.5">مأذون</span>
            <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400 leading-none">
              {stats.excused}
            </span>
          </div>
        </div>

        {/* Rapid 1-Tap Attendance Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => markAllAs("PRESENT")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-sm shadow-emerald-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>تحضير الكل كحاضر</span>
            </button>

            <button
              onClick={resetAllMarks}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="تفريغ الرصد"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="text-left">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              إجمالي الطلاب:
            </span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 mr-1.5">
              {sectionStudents.length}
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث باسم الطالب أو الرقم الوطني..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
            />
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: "all", label: `الكل (${sectionStudents.length})` },
              { id: "unrecorded", label: `لم يُرصد (${stats.unrecorded})` },
              { id: "PRESENT", label: `حاضر (${stats.present})` },
              { id: "ABSENT", label: `غائب (${stats.absent})` },
              { id: "LATE", label: `متأخر (${stats.late})` },
              { id: "EXCUSED", label: `مأذون (${stats.excused})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`whitespace-nowrap px-3 py-1 rounded-full font-semibold transition-all ${
                  filterStatus === tab.id
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Students List */}
        <div className="space-y-2.5">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
              <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                لا يوجد طلاب مطابقين للبحث
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                تأكد من اختيار الفصل أو مسح نص البحث
              </p>
            </div>
          ) : (
            filteredStudents.map((student, idx) => {
              const currentStatus = marks[student.enrollmentId];
              const note = notes[student.enrollmentId] || "";

              return (
                <div
                  key={student.enrollmentId}
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-3.5 border transition-all ${
                    currentStatus
                      ? "border-slate-200 dark:border-slate-800 shadow-xs"
                      : "border-dashed border-amber-300 dark:border-amber-700/50 bg-amber-50/20 dark:bg-amber-950/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 shrink-0">
                        {String(student.orderNumber).padStart(2, "0")}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                          {student.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                          <span>الرقم: {student.nationalId}</span>
                          {student.guardianName && (
                            <>
                              <span>•</span>
                              <span>ولي الأمر: {student.guardianName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Active Status Badge */}
                    {currentStatus ? (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[currentStatus].badgeClass}`}
                      >
                        {STATUS_CONFIG[currentStatus].label}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                        لم يرصد
                      </span>
                    )}
                  </div>

                  {/* 4 Touch Friendly Action Buttons */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((statusKey) => {
                      const config = STATUS_CONFIG[statusKey];
                      const Icon = config.icon;
                      const isSelected = currentStatus === statusKey;

                      return (
                        <button
                          key={statusKey}
                          type="button"
                          onClick={() => setStudentStatus(student.enrollmentId, statusKey)}
                          className={`min-h-[42px] py-1.5 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? config.activeClass
                              : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{config.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Floating Bottom Sticky Bar for Mobile */}
      <footer className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-3 shadow-lg">
        <div className="max-w-2xl mx-auto space-y-2">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
            <span>
              رُصد: {stats.recordedCount} من أصل {stats.total} طالب
            </span>
            <span>{stats.percent}% مكتمل</span>
          </div>

          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${stats.percent}%` }}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSaveAndSync}
              disabled={isSaving || sectionStudents.length === 0}
              className="flex-1 py-3 px-4 rounded-2xl bg-primary hover:bg-primary/95 active:scale-[0.98] text-primary-foreground font-bold text-sm shadow-md shadow-primary/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "جارِ الحفظ والمزامنة..." : "مزامنة وحفظ الحضور الآن"}</span>
            </button>

            <Link
              to="/supervisor"
              className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center transition-colors"
            >
              البوابة الرئيسية
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
