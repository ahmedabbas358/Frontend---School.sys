import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore, ScheduleSlot, Subject, SavedTimetable } from "@/contexts/GlobalStoreContext";
import { useStage, GRADE_OPTIONS } from "@/contexts/StageContext";
import { 
  Trash2, 
  X, 
  AlertCircle, 
  Printer, 
  Settings, 
  Plus, 
  Save, 
  Sparkles, 
  Calendar, 
  Clock, 
  Users, 
  Layers3, 
  GraduationCap, 
  DoorOpen, 
  UserCheck, 
  Check, 
  Search, 
  RefreshCw, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft, 
  SlidersHorizontal,
  FileText,
  CalendarDays,
  ShieldCheck,
  Eye,
  Copy,
  FolderKanban,
  Star,
  BookmarkCheck,
  ArrowRightLeft,
  Filter,
  Coffee,
  Maximize2,
  Minimize2
} from "lucide-react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { TeacherPicker } from "@/components/teacher-picker";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "الجدول المدرسي الأسبوعي | منصة مدارس" },
      { name: "description", content: "إدارة وتوليد الجدول الأسبوعي الفعلي للصفوف والشعب والمعلمين" }
    ],
  }),
  component: SchedulePage,
});

const ALL_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

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

// Visual color theme per subject category/code (Eye-comfortable soft pastel in Light and Dark mode)
export function getSubjectTheme(code: string = "", name: string = ""): {
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

function SchedulePage() {
  const { stage, getStageLabel } = useStage();
  const { 
    activeStageSections, 
    activeStageStaff, 
    activeStageSubjects, 
    activeStageScheduleSlots, 
    activeStageTimetableSettings,
    activeStageTeachingAssignments,
    allRooms,
    currentAcademicYear,
    activeAcademicTerm,
    updateTimetableSettings,
    updateScheduleSlot, 
    clearScheduleSlot,
    allSavedTimetables,
    activeStageSavedTimetables,
    saveTimetable,
    deleteSavedTimetable,
    setTimetableStatus,
    cloneTimetableToSection,
    batchSaveScheduleSlots
  } = useGlobalStore();

  // Main Mode: "studio" (Live Matrix Editor) | "hub" (Dedicated Saved Timetables Hub)
  const [mainMode, setMainMode] = useState<"studio" | "hub">("studio");

  // Hub Filters & Search
  const [hubGradeFilter, setHubGradeFilter] = useState<string>("الكل");
  const [hubStatusFilter, setHubStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [hubSearchQuery, setHubSearchQuery] = useState<string>("");

  // Modals
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneSourceSectionId, setCloneSourceSectionId] = useState<string>("");
  const [cloneTargetSectionId, setCloneTargetSectionId] = useState<string>("");
  const [isNewTimetableModalOpen, setIsNewTimetableModalOpen] = useState(false);
  const [previewingTimetable, setPreviewingTimetable] = useState<SavedTimetable | null>(null);
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false);

  // New Timetable Modal Form
  const [newTimetableData, setNewTimetableData] = useState({
    grade: "",
    sectionId: "",
    name: "",
    type: "smart_auto" as "smart_auto" | "blank",
    termName: ""
  });

  // Save Modal Form State
  const [saveFormData, setSaveFormData] = useState({
    name: "",
    scope: "section" as "section" | "grade",
    status: "published" as "published" | "draft",
    notes: ""
  });

  // View Perspective: "section" (Single Section) | "grade_matrix" (All Sections in Grade) | "teacher" (Teacher Schedule) | "room" (Room Schedule)
  const [viewPerspective, setViewPerspective] = useState<"section" | "grade_matrix" | "teacher" | "room">("section");

  // Selection Filters
  const availableGrades = useMemo(() => GRADE_OPTIONS[stage] || [], [stage]);
  const [selectedGrade, setSelectedGrade] = useState<string>(() => availableGrades[0] || "الصف الأول");
  
  // Active sections for the selected grade
  const sectionsInGrade = useMemo(() => {
    return activeStageSections.filter(s => s.grade === selectedGrade);
  }, [activeStageSections, selectedGrade]);

  const [targetSectionId, setTargetSectionId] = useState<string>(() => {
    return sectionsInGrade[0]?.id || activeStageSections[0]?.id || "";
  });

  // When grade changes, ensure targetSectionId points to a section in that grade
  useEffect(() => {
    if (sectionsInGrade.length > 0 && !sectionsInGrade.some(s => s.id === targetSectionId)) {
      setTargetSectionId(sectionsInGrade[0].id);
    }
  }, [selectedGrade, sectionsInGrade, targetSectionId]);

  const targetSection = useMemo(() => {
    return activeStageSections.find(s => s.id === targetSectionId) || sectionsInGrade[0] || activeStageSections[0];
  }, [activeStageSections, targetSectionId, sectionsInGrade]);

  // Selected Teacher for Teacher View
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => activeStageStaff[0]?.id || "");
  // Selected Room for Room View
  const [selectedRoomId, setSelectedRoomId] = useState<string>(() => allRooms[0]?.id || "");
  const [roomCategoryFilter, setRoomCategoryFilter] = useState<"all" | "classrooms" | "labs" | "halls">("all");

  // Calibrated and accurate Room-to-Slot evaluator
  const isSlotInRoom = useMemo(() => {
    return (s: ScheduleSlot, targetRoomId: string) => {
      if (!targetRoomId) return false;
      
      // 1. Explicit Room on the slot takes top precedence
      if (s.roomId) {
        return s.roomId === targetRoomId;
      }

      const sec = activeStageSections.find(section => section.id === s.sectionId);
      const sub = activeStageSubjects.find(subject => subject.id === s.subjectId);
      const subText = (sub?.name || "").toLowerCase();
      const roomObj = allRooms.find(r => r.id === targetRoomId);

      // 2. Homeroom / Standard Section Classroom
      if (sec?.roomId === targetRoomId || (roomObj?.assignedSectionId && roomObj.assignedSectionId === s.sectionId)) {
        // When a class is in a specialized lab or PE, they leave the classroom
        if (subText.includes("حاسب") || subText.includes("رقمية") || subText.includes("بدني") || subText.includes("رياضة")) {
          return false;
        }
        return true;
      }

      // 3. Specialized Labs & Halls
      if (roomObj?.type === "lab" || roomObj?.type === "hall") {
        const roomText = (roomObj.name + " " + roomObj.id).toLowerCase();
        if ((roomText.includes("حاسب") || roomText.includes("computer")) && (subText.includes("حاسب") || subText.includes("رقمية"))) {
          return true;
        }
        if ((roomText.includes("علوم") || roomText.includes("science")) && (subText.includes("علوم") || subText.includes("فيزياء") || subText.includes("كيمياء") || subText.includes("أحياء"))) {
          return s.period === 3 || s.period === 4;
        }
        if ((roomText.includes("رياض") || roomText.includes("صالة") || roomText.includes("مسرح")) && (subText.includes("بدن") || subText.includes("رياض"))) {
          return true;
        }
      }

      return false;
    };
  }, [activeStageSections, activeStageSubjects, allRooms]);

  // Unfiltered pool of stage rooms + shared facilities
  const allStageRooms = useMemo(() => {
    return allRooms.filter(r => {
      const isSectionInStage = activeStageSections.some(sec => sec.id === r.assignedSectionId || sec.roomId === r.id);
      const isShared = r.type === "lab" || r.type === "hall" || r.type === "office";
      return isSectionInStage || isShared;
    });
  }, [allRooms, activeStageSections]);

  // Relevant rooms filtered by active category
  const relevantRooms = useMemo(() => {
    if (roomCategoryFilter === "classrooms") return allStageRooms.filter(r => r.type === "classroom");
    if (roomCategoryFilter === "labs") return allStageRooms.filter(r => r.type === "lab");
    if (roomCategoryFilter === "halls") return allStageRooms.filter(r => r.type === "hall" || r.type === "office");
    return allStageRooms;
  }, [allStageRooms, roomCategoryFilter]);

  // Ensure selectedRoomId points to an active relevant room
  useEffect(() => {
    if (relevantRooms.length > 0 && !relevantRooms.some(r => r.id === selectedRoomId)) {
      setSelectedRoomId(relevantRooms[0].id);
    }
  }, [relevantRooms, selectedRoomId]);

  // Detect room conflicts for selected room
  const selectedRoomConflicts = useMemo(() => {
    if (!selectedRoomId) return [];
    const slots = activeStageScheduleSlots.filter(s => isSlotInRoom(s, selectedRoomId));
    const map = new Map<string, ScheduleSlot[]>();
    slots.forEach(s => {
      const key = `${s.day}-${s.period}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    const conflicts: { day: string; period: number; count: number }[] = [];
    map.forEach((items, key) => {
      if (items.length > 1) {
        const [day, periodStr] = key.split("-");
        conflicts.push({ day, period: Number(periodStr), count: items.length });
      }
    });
    return conflicts;
  }, [activeStageScheduleSlots, isSlotInRoom, selectedRoomId]);

  // Settings Normalization & Computation
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

  // Dynamic layout columns (periods & breaks interleaved)
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

  // Teaching Assignments for the current Section
  const sectionTeachingAssignments = useMemo(() => {
    if (!targetSection) return [];
    return activeStageTeachingAssignments.filter(ta => ta.sectionId === targetSection.id);
  }, [activeStageTeachingAssignments, targetSection]);

  // Subject Quota & Workload analysis for this section
  const sectionSubjectQuotas = useMemo(() => {
    if (!targetSection) return [];
    
    // Map subjects configured or assigned for this section
    const subjectsList: {
      subject: Subject;
      assignedTeacherId?: string;
      assignedTeacherName?: string;
      expectedPeriods: number;
      scheduledPeriods: number;
      remainingPeriods: number;
    }[] = [];

    activeStageSubjects.forEach(sub => {
      // Find teaching assignment
      const assign = sectionTeachingAssignments.find(ta => ta.subjectId === sub.id);
      const teacher = assign ? activeStageStaff.find(t => t.id === assign.teacherId) : undefined;
      
      const expected = sub.creditHours || 4;
      const scheduled = activeStageScheduleSlots.filter(
        s => s.sectionId === targetSection.id && s.subjectId === sub.id
      ).length;

      subjectsList.push({
        subject: sub,
        assignedTeacherId: assign?.teacherId,
        assignedTeacherName: teacher?.name,
        expectedPeriods: expected,
        scheduledPeriods: scheduled,
        remainingPeriods: Math.max(0, expected - scheduled)
      });
    });

    return subjectsList;
  }, [targetSection, activeStageSubjects, sectionTeachingAssignments, activeStageStaff, activeStageScheduleSlots]);

  // Total scheduled periods for current section
  const currentSectionScheduledSlots = useMemo(() => {
    if (!targetSection) return [];
    return activeStageScheduleSlots.filter(s => s.sectionId === targetSection.id);
  }, [activeStageScheduleSlots, targetSection]);

  const totalPossibleSlots = DAYS.length * PERIODS_COUNT;

  // Modals State
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlotCoord, setEditingSlotCoord] = useState<{ day: string; period: number; sectionId: string } | null>(null);
  const [slotFormData, setSlotFormData] = useState({
    subjectId: "",
    teacherId: "",
    roomId: "",
    notes: ""
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);

  const [isAutoScheduleModalOpen, setIsAutoScheduleModalOpen] = useState(false);
  const [autoScheduleScope, setAutoScheduleScope] = useState<"section" | "grade">("section");

  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Helper to fetch a specific slot
  const getSlot = (sectionId: string, day: string, period: number) => {
    return activeStageScheduleSlots.find(s => s.sectionId === sectionId && s.day === day && s.period === period);
  };

  // Conflict detector
  const checkTeacherConflict = (teacherId: string, day: string, period: number, excludeSectionId?: string) => {
    if (!settings.preventConflicts || !teacherId) return false;
    const conflictingSlot = activeStageScheduleSlots.find(
      s => s.teacherId === teacherId && s.day === day && s.period === period && s.sectionId !== excludeSectionId
    );
    if (conflictingSlot) {
      const conflictSec = activeStageSections.find(sec => sec.id === conflictingSlot.sectionId);
      const conflictSub = activeStageSubjects.find(sub => sub.id === conflictingSlot.subjectId);
      return {
        sectionName: `${conflictSec?.grade || ""} - شعبة ${conflictSec?.name || ""}`,
        subjectName: conflictSub?.name || "حصة دراسية"
      };
    }
    return false;
  };

  // Slot Click Handler
  const handleOpenSlotModal = (day: string, period: number, sectionId: string) => {
    const existing = getSlot(sectionId, day, period);
    setEditingSlotCoord({ day, period, sectionId });

    // Pre-select teacher if assigned to subject
    const defaultSubjectId = existing?.subjectId || "";
    let defaultTeacherId = existing?.teacherId || "";
    if (!defaultTeacherId && defaultSubjectId) {
      const assign = activeStageTeachingAssignments.find(ta => ta.sectionId === sectionId && ta.subjectId === defaultSubjectId);
      defaultTeacherId = assign?.teacherId || "";
    }

    setSlotFormData({
      subjectId: defaultSubjectId,
      teacherId: defaultTeacherId,
      roomId: existing?.roomId || targetSection?.roomId || "",
      notes: existing?.notes || ""
    });

    setIsSlotModalOpen(true);
  };

  // When subject changes in Slot Modal, automatically link assigned teacher and suggested room
  const handleModalSubjectChange = (subjectId: string) => {
    if (!editingSlotCoord) return;
    const assign = activeStageTeachingAssignments.find(
      ta => ta.sectionId === editingSlotCoord.sectionId && ta.subjectId === subjectId
    );
    const subObj = activeStageSubjects.find(s => s.id === subjectId);
    const subText = (subObj?.name || "").toLowerCase();
    
    let suggestedRoomId = slotFormData.roomId;
    if (subText.includes("حاسب") || subText.includes("رقمية")) {
      const lab = allRooms.find(r => r.id === "RM-LAB1" || r.name.includes("حاسب"));
      if (lab) suggestedRoomId = lab.id;
    } else if (subText.includes("علوم") || subText.includes("فيزياء") || subText.includes("كيمياء")) {
      const lab = allRooms.find(r => r.id === "RM-LAB2" || r.name.includes("علوم"));
      if (lab) suggestedRoomId = lab.id;
    } else if (subText.includes("بدنية") || subText.includes("رياض")) {
      const hall = allRooms.find(r => r.id === "RM-HALL1" || r.name.includes("صالة") || r.name.includes("رياض"));
      if (hall) suggestedRoomId = hall.id;
    } else {
      const sec = activeStageSections.find(s => s.id === editingSlotCoord.sectionId);
      if (sec?.roomId) suggestedRoomId = sec.roomId;
    }

    setSlotFormData(prev => ({
      ...prev,
      subjectId,
      teacherId: assign?.teacherId || prev.teacherId,
      roomId: suggestedRoomId
    }));
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlotCoord || !slotFormData.subjectId || !slotFormData.teacherId) {
      toast.error("الرجاء اختيار المادة التعليمية والمعلم المكلف");
      return;
    }

    // Check teacher conflict
    const conflict = checkTeacherConflict(
      slotFormData.teacherId, 
      editingSlotCoord.day, 
      editingSlotCoord.period, 
      editingSlotCoord.sectionId
    );

    if (conflict) {
      toast.error(`تعارض في الجدول: المعلم مشغول في (${conflict.sectionName}) لتدريس (${conflict.subjectName})`);
      return;
    }

    const roomObj = allRooms.find(r => r.id === slotFormData.roomId);

    updateScheduleSlot({
      sectionId: editingSlotCoord.sectionId,
      day: editingSlotCoord.day,
      period: editingSlotCoord.period,
      subjectId: slotFormData.subjectId,
      teacherId: slotFormData.teacherId,
      stage,
      roomId: slotFormData.roomId || undefined,
      roomName: roomObj ? `${roomObj.name} (${roomObj.building})` : undefined,
      notes: slotFormData.notes || undefined
    });

    toast.success("تم حفظ وتحديث الحصة الدراسية بنجاح");
    setIsSlotModalOpen(false);
  };

  const handleClearCurrentSlot = () => {
    if (!editingSlotCoord) return;
    clearScheduleSlot(editingSlotCoord.sectionId, editingSlotCoord.day, editingSlotCoord.period);
    toast.success("تم إفراغ الحصة الدراسية");
    setIsSlotModalOpen(false);
  };

  // Smart Auto-Schedule Generator
  const executeSmartAutoSchedule = () => {
    const targetSections = autoScheduleScope === "section" 
      ? [targetSection] 
      : sectionsInGrade;

    if (targetSections.length === 0) {
      toast.error("لا توجد شعب مستهدفة للجدولة");
      return;
    }

    let totalAssignedCount = 0;

    targetSections.forEach(sec => {
      if (!sec) return;
      const assignments = activeStageTeachingAssignments.filter(ta => ta.sectionId === sec.id);

      // Build list of periods needed
      const neededSlots: { subjectId: string; teacherId: string; priority: number }[] = [];
      
      activeStageSubjects.forEach(sub => {
        const assign = assignments.find(ta => ta.subjectId === sub.id);
        const teacher = assign ? assign.teacherId : activeStageStaff[0]?.id || "";
        const quota = sub.creditHours || 4;
        
        // Priority: Quran/Math/Arabic/Science = high priority (1)
        const isCore = sub.name.includes("قرآن") || sub.name.includes("رياض") || sub.name.includes("لغت") || sub.name.includes("علوم");
        const priority = isCore ? 1 : 2;

        for (let i = 0; i < quota; i++) {
          neededSlots.push({ subjectId: sub.id, teacherId: teacher, priority });
        }
      });

      // Sort slots: core first
      neededSlots.sort((a, b) => a.priority - b.priority);

      let slotIndex = 0;
      DAYS.forEach(day => {
        for (let p = 1; p <= PERIODS_COUNT; p++) {
          // Check if slot already occupied
          const existing = getSlot(sec.id, day, p);
          if (existing) continue;

          if (slotIndex >= neededSlots.length) break;

          const item = neededSlots[slotIndex];
          // Check teacher conflict
          const conflict = checkTeacherConflict(item.teacherId, day, p, sec.id);
          if (!conflict) {
            updateScheduleSlot({
              sectionId: sec.id,
              day,
              period: p,
              subjectId: item.subjectId,
              teacherId: item.teacherId,
              stage,
              roomId: sec.roomId,
              roomName: sec.roomName
            });
            totalAssignedCount++;
            slotIndex++;
          }
        }
      });
    });

    toast.success(`⚡ تم التوليد الذكي لـ ${totalAssignedCount} حصة بنجاح وبدون أي تعارض`);
    setIsAutoScheduleModalOpen(false);
  };

  const handleClearAllSchedule = () => {
    if (!targetSection) return;
    if (confirm(`هل أنت متأكد من تفريغ كافة حصص جدول شعبة (${targetSection.name})؟`)) {
      DAYS.forEach(day => {
        for (let p = 1; p <= PERIODS_COUNT; p++) {
          clearScheduleSlot(targetSection.id, day, p);
        }
      });
      toast.success("تم تفريغ جدول الشعبة بالكامل");
    }
  };

  const handleSaveSettings = () => {
    updateTimetableSettings({
      ...tempSettings,
      stage
    });
    toast.success("تم حفظ وتطبيق إعدادات وتواقيت الجدول بنجاح");
    setIsSettingsOpen(false);
  };

  // Filtered Hub Timetables
  const filteredHubTimetables = useMemo(() => {
    return activeStageSavedTimetables.filter(t => {
      if (hubGradeFilter !== "الكل" && t.grade !== hubGradeFilter) return false;
      if (hubStatusFilter !== "all" && t.status !== hubStatusFilter) return false;
      if (hubSearchQuery.trim()) {
        const q = hubSearchQuery.toLowerCase();
        const matchesName = (t.name || "").toLowerCase().includes(q);
        const matchesGrade = (t.grade || "").toLowerCase().includes(q);
        const matchesSec = (t.sectionName || "").toLowerCase().includes(q);
        const matchesNotes = (t.notes || "").toLowerCase().includes(q);
        if (!matchesName && !matchesGrade && !matchesSec && !matchesNotes) return false;
      }
      return true;
    });
  }, [activeStageSavedTimetables, hubGradeFilter, hubStatusFilter, hubSearchQuery]);

  // Hub Stats
  const hubStats = useMemo(() => {
    const total = activeStageSavedTimetables.length;
    const published = activeStageSavedTimetables.filter(t => t.status === "published").length;
    const draft = activeStageSavedTimetables.filter(t => t.status === "draft").length;
    const complete = activeStageSavedTimetables.filter(t => (t.slotsCount || 0) >= 35).length;
    return { total, published, draft, complete };
  }, [activeStageSavedTimetables]);

  // Open Save Modal
  const handleOpenSaveModal = () => {
    if (!targetSection) {
      toast.error("الرجاء اختيار شعبة أولاً");
      return;
    }
    const existing = activeStageSavedTimetables.find(t => t.sectionId === targetSection.id);
    setSaveFormData({
      name: existing?.name || `جدول ${targetSection.grade} - شعبة (${targetSection.name}) المعتمد`,
      scope: "section",
      status: (existing?.status === "draft" ? "draft" : "published"),
      notes: existing?.notes || ""
    });
    setIsSaveModalOpen(true);
  };

  // Confirm Save Timetable
  const handleConfirmSaveTimetable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSection) return;
    if (!saveFormData.name.trim()) {
      toast.error("الرجاء إدخال اسم الجدول");
      return;
    }

    const currentSlots = activeStageScheduleSlots.filter(s => s.sectionId === targetSection.id);

    if (saveFormData.scope === "section") {
      saveTimetable({
        name: saveFormData.name.trim(),
        stage,
        grade: targetSection.grade,
        sectionId: targetSection.id,
        sectionName: `شعبة ${targetSection.name}`,
        academicYearId: currentAcademicYear?.id || "Y-1002",
        termId: activeAcademicTerm?.id || "term-1002-2",
        termName: activeAcademicTerm?.name || "الفصل الدراسي الثاني",
        status: saveFormData.status,
        isDefault: true,
        slotsCount: currentSlots.length,
        totalSlots: 35,
        notes: saveFormData.notes
      });
      toast.success(`تم حفظ واعتماد جدول شعبة (${targetSection.name}) بنجاح في سجل الجداول!`);
    } else {
      sectionsInGrade.forEach(sec => {
        saveTimetable({
          name: `${saveFormData.name} - شعبة (${sec.name})`,
          stage,
          grade: sec.grade,
          sectionId: sec.id,
          sectionName: `شعبة ${sec.name}`,
          academicYearId: currentAcademicYear?.id || "Y-1002",
          termId: activeAcademicTerm?.id || "term-1002-2",
          termName: activeAcademicTerm?.name || "الفصل الدراسي الثاني",
          status: saveFormData.status,
          isDefault: true,
          slotsCount: activeStageScheduleSlots.filter(s => s.sectionId === sec.id).length,
          totalSlots: 35,
          notes: saveFormData.notes
        });
      });
      toast.success(`تم تعميم وحفظ الجدول على جميع شُعب ${selectedGrade} (${sectionsInGrade.length} شعبة) بنجاح!`);
    }

    setIsSaveModalOpen(false);
  };

  // Open Clone Modal
  const handleOpenCloneModal = (sourceSecId?: string) => {
    const srcId = sourceSecId || targetSection?.id || "";
    setCloneSourceSectionId(srcId);
    const availableTargets = activeStageSections.filter(s => s.id !== srcId);
    setCloneTargetSectionId(availableTargets[0]?.id || "");
    setIsCloneModalOpen(true);
  };

  // Confirm Clone Timetable
  const handleConfirmClone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneSourceSectionId || !cloneTargetSectionId) {
      toast.error("الرجاء تحديد الشعبة المصدر والشعبة المستهدفة");
      return;
    }
    const srcSec = activeStageSections.find(s => s.id === cloneSourceSectionId);
    const tgtSec = activeStageSections.find(s => s.id === cloneTargetSectionId);
    cloneTimetableToSection(cloneSourceSectionId, cloneTargetSectionId);
    toast.success(`تم نسخ جدول شعبة (${srcSec?.name}) إلى شعبة (${tgtSec?.name}) بنجاح!`);
    setIsCloneModalOpen(false);
  };

  // Open New Timetable Modal
  const handleOpenNewTimetableModal = () => {
    const initialGrade = availableGrades[0] || "الصف الأول";
    const secs = activeStageSections.filter(s => s.grade === initialGrade);
    setNewTimetableData({
      grade: initialGrade,
      sectionId: secs[0]?.id || "",
      name: `جدول ${initialGrade} - شعبة (${secs[0]?.name || "أ"}) المعتمد`,
      type: "smart_auto",
      termName: activeAcademicTerm?.name || "الفصل الدراسي الثاني"
    });
    setIsNewTimetableModalOpen(true);
  };

  // Confirm Create New Timetable
  const handleConfirmCreateNewTimetable = (e: React.FormEvent) => {
    e.preventDefault();
    const tgtSec = activeStageSections.find(s => s.id === newTimetableData.sectionId);
    if (!tgtSec) {
      toast.error("الرجاء اختيار الشعبة المحددة");
      return;
    }

    if (newTimetableData.type === "smart_auto") {
      DAYS.forEach(day => {
        for (let p = 1; p <= PERIODS_COUNT; p++) {
          clearScheduleSlot(tgtSec.id, day, p);
        }
      });
      const assignments = activeStageTeachingAssignments.filter(ta => ta.sectionId === tgtSec.id);
      const neededSlots: { subjectId: string; teacherId: string }[] = [];
      activeStageSubjects.forEach(sub => {
        const assign = assignments.find(ta => ta.subjectId === sub.id);
        const teacher = assign ? assign.teacherId : activeStageStaff[0]?.id || "";
        const quota = sub.creditHours || 4;
        for (let i = 0; i < quota; i++) {
          neededSlots.push({ subjectId: sub.id, teacherId: teacher });
        }
      });
      let sIdx = 0;
      DAYS.forEach(d => {
        for (let p = 1; p <= PERIODS_COUNT; p++) {
          if (sIdx < neededSlots.length) {
            const itm = neededSlots[sIdx];
            updateScheduleSlot({
              sectionId: tgtSec.id,
              day: d,
              period: p,
              subjectId: itm.subjectId,
              teacherId: itm.teacherId,
              stage,
              roomId: tgtSec.roomId,
              roomName: tgtSec.roomName
            });
            sIdx++;
          }
        }
      });
    }

    saveTimetable({
      name: newTimetableData.name || `جدول ${tgtSec.grade} - شعبة (${tgtSec.name}) المعتمد`,
      stage,
      grade: tgtSec.grade,
      sectionId: tgtSec.id,
      sectionName: `شعبة ${tgtSec.name}`,
      academicYearId: currentAcademicYear?.id || "Y-1002",
      termId: activeAcademicTerm?.id || "term-1002-2",
      termName: newTimetableData.termName || activeAcademicTerm?.name || "الفصل الدراسي الثاني",
      status: "published",
      isDefault: true,
      slotsCount: 35,
      totalSlots: 35,
      notes: newTimetableData.type === "smart_auto" ? "تم توليده ذكياً بدون تعارض" : "جدول جديد مخصص"
    });

    toast.success(`تم إنشاء وتعيين الجدول لشعبة (${tgtSec.name}) بنجاح!`);
    setIsNewTimetableModalOpen(false);
  };

  // Toggle timetable status
  const handleToggleTimetableStatus = (t: SavedTimetable) => {
    const nextStatus = t.status === "published" ? "draft" : "published";
    setTimetableStatus(t.id, nextStatus);
    toast.success(`تم تغيير حالة الجدول إلى: ${nextStatus === "published" ? "معتمد ونشط" : "مسودة"}`);
  };

  // Delete Timetable
  const handleDeleteTimetable = (t: SavedTimetable) => {
    if (confirm(`هل أنت متأكد من حذف (${t.name}) من سجل الجداول؟`)) {
      deleteSavedTimetable(t.id);
      toast.success("تم حذف الجدول من السجل بنجاح");
    }
  };

  // Switch to Studio for a timetable
  const handleEditTimetableInStudio = (t: SavedTimetable) => {
    if (t.grade) setSelectedGrade(t.grade);
    if (t.sectionId) setTargetSectionId(t.sectionId);
    setViewPerspective("section");
    setMainMode("studio");
  };

  // Print Templates
  const printTemplates: PrintTemplate[] = useMemo(() => {
    return [
      {
        id: "section-timetable",
        name: "كشف الجدول المدرسي للشعبة (نسخة معتمدة)",
        category: "جداول أسبوعية",
        type: "document",
        description: "جدول أسبوعي رسمي متكامل للشعبة يتضمن المواعيد والمعلمين والترويسة الرسمية",
        renderDocument: () => {
          return (
            <div className="p-8 bg-white text-gray-900 border-2 border-gray-800 rounded-2xl space-y-6" dir="rtl">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4">
                <div className="text-right">
                  <h3 className="font-black text-sm text-primary">المملكة العربية السعودية</h3>
                  <h4 className="font-bold text-xs">منصة مدارس الأهلية النموذجية</h4>
                  <p className="text-[11px] text-gray-600">الشؤون التعليمية • قسم الجداول المدرسية</p>
                </div>
                <div className="text-center">
                  <h1 className="text-2xl font-black text-gray-900">الجدول الأسبوعي المعتمد للحصص</h1>
                  <p className="text-xs font-bold text-gray-700 mt-1">
                    {targetSection?.grade} • شعبة ({targetSection?.name})
                  </p>
                  <span className="text-[11px] font-bold text-primary px-3 py-0.5 rounded-full bg-primary/10 inline-block mt-1">
                    {activeAcademicTerm?.name || "الفصل الدراسي الحالي"} • {currentAcademicYear?.name || "1446 هـ"}
                  </span>
                </div>
                <div className="text-left text-xs font-bold space-y-1">
                  <div>القاعة: {targetSection?.roomName || "قاعة أساسية"}</div>
                  <div>رائد الفصل: {targetSection?.homeroomTeacher || "غير محدد"}</div>
                  <div>تاريخ الاعتماد: {new Date().toLocaleDateString("ar-SA")}</div>
                </div>
              </div>

              {/* Table */}
              <table className="w-full border-collapse border-2 border-gray-800 text-center text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border-2 border-gray-800 p-2.5 font-black w-24">اليوم / الحصة</th>
                    {layoutColumns.map((col, idx) => (
                      <th key={idx} className={`border-2 border-gray-800 p-2 font-black ${col.type === "break" ? "bg-amber-100/60 w-16" : ""}`}>
                        {col.type === "period" ? (
                          <div>
                            <div>الحصة {col.val}</div>
                            <div className="text-[10px] text-gray-600 font-normal">{periodTimeRanges[col.val as number]?.start}</div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-amber-800 font-black">{col.val}</div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map(d => (
                    <tr key={d}>
                      <td className="border-2 border-gray-800 bg-gray-50 p-2.5 font-black text-gray-900">{d}</td>
                      {layoutColumns.map((col, idx) => {
                        if (col.type === "break") {
                          if (d === DAYS[0]) {
                            return (
                              <td key={idx} rowSpan={DAYS.length} className="border-2 border-gray-800 bg-amber-50 font-black text-amber-900 p-2 text-center" style={{ writingMode: "vertical-rl" }}>
                                {col.val}
                              </td>
                            );
                          }
                          return null;
                        }

                        const p = col.val as number;
                        const slot = getSlot(targetSection?.id || "", d, p);
                        const sub = activeStageSubjects.find(s => s.id === slot?.subjectId);
                        const tchr = activeStageStaff.find(t => t.id === slot?.teacherId);

                        return (
                          <td key={idx} className="border border-gray-400 p-2 align-middle bg-white">
                            {slot ? (
                              <div className="space-y-0.5">
                                <span className="font-black text-xs text-primary block">{sub?.name || "مادة"}</span>
                                <span className="text-[10px] text-gray-600 font-semibold block">{tchr?.name || "المعلم"}</span>
                              </div>
                            ) : (
                              <span className="text-gray-300 font-normal">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs font-bold border-t border-gray-400">
                <div>
                  <p>رائد الفصل</p>
                  <p className="mt-8 text-gray-400">........................</p>
                </div>
                <div>
                  <p>وكيل الشؤون التعليمية</p>
                  <p className="mt-8 text-gray-400">........................</p>
                </div>
                <div>
                  <p>الختم الرسمي للمدرسة</p>
                  <div className="h-12 w-12 mx-auto rounded-full border border-dashed border-gray-400 mt-2" />
                </div>
              </div>
            </div>
          );
        }
      }
    ];
  }, [targetSection, activeAcademicTerm, currentAcademicYear, layoutColumns, periodTimeRanges, DAYS, activeStageSubjects, activeStageStaff, activeStageScheduleSlots]);

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الإدارة الأكاديمية", to: "/academic/classes" },
        { label: "الجدول الأسبوعي والحصص" }
      ]}
      actions={
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {/* Main Mode Toggle Button */}
          <div className="flex items-center bg-muted/70 p-1 rounded-2xl border border-border/60 shrink-0">
            <button
              onClick={() => setMainMode("studio")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                mainMode === "studio"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>محرر الحصص</span>
            </button>
            <button
              onClick={() => setMainMode("hub")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                mainMode === "hub"
                  ? "bg-primary text-primary-foreground shadow-xs glow-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>سجل وجداول الفصول</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-bold">
                {activeStageSavedTimetables.length}
              </span>
            </button>
          </div>

          {/* Save / Assign Timetable Button */}
          <button
            onClick={handleOpenSaveModal}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 text-white px-3.5 text-xs font-black hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 active:scale-95 shrink-0"
            title="حفظ واعتماد جدول الشعبة أو تعميمه على الفصل"
          >
            <Save className="h-4 w-4" />
            <span>حفظ واعتماد الجدول</span>
          </button>

          {/* Clone Schedule Button */}
          <button
            onClick={() => handleOpenCloneModal()}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3 text-xs font-bold hover:bg-accent text-foreground transition-all shadow-xs active:scale-95 shrink-0"
            title="نسخ جدول الشعبة إلى شعبة أخرى"
          >
            <Copy className="h-4 w-4 text-muted-foreground" />
            <span className="hidden sm:inline">نسخ لشعبة</span>
          </button>

          {/* Smart Auto Schedule Button */}
          <button
            onClick={() => setIsAutoScheduleModalOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3.5 text-xs font-black transition-all shadow-xs active:scale-95 shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">التوليد الذكي</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => {
              setTempSettings(settings);
              setIsSettingsOpen(true);
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3 text-xs font-bold hover:bg-accent text-foreground transition-all shadow-xs active:scale-95 shrink-0"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="hidden md:inline">الإعدادات</span>
          </button>

          {/* Print Button */}
          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-95 glow-primary shrink-0"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">طباعة</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-400" dir="rtl">

        {mainMode === "hub" ? (
          /* =========================================================================
             DEDICATED HUB: سجل ومركز الجداول المنشأة والمعتمدة لكل فصل وشعبة
             ========================================================================= */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Hub Hero Banner */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-gradient-to-r from-card via-card/95 to-primary/5 border border-border/80 rounded-3xl p-6 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0 shadow-xs">
                  <FolderKanban className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black text-foreground">مركز وسجل الجداول المنشأة والمعتمدة</h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-black">
                      {activeAcademicTerm?.name || "الفصل الدراسي النشط"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    استعراض كافة الجداول المخصصة للفصول والشعب، مطالعتها الفورية، التحكم في اعتمادها ونسخها لـ ({getStageLabel(stage)})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleOpenNewTimetableModal}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-4 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-95 glow-primary"
                >
                  <Plus className="w-4 h-4" />
                  <span>إنشاء وتعيين جدول جديد</span>
                </button>
                <button
                  onClick={() => setMainMode("studio")}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border/80 bg-card px-4 text-xs font-bold hover:bg-muted text-foreground transition-all shadow-xs active:scale-95"
                >
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                  <span>الانتقال للمحرر</span>
                </button>
              </div>
            </div>

            {/* Hub 4 Key Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-3xl bg-card border border-border/70 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold">إجمالي الجداول المنشأة</span>
                  <FolderKanban className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-black text-foreground tabular-nums">{hubStats.total}</div>
                <div className="text-[11px] text-muted-foreground font-medium">لكافة صفوف وشعب المرحلة</div>
              </div>

              <div className="p-4 rounded-3xl bg-card border border-border/70 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <span className="text-xs font-bold">جداول معتمدة ونشطة</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{hubStats.published}</div>
                <div className="text-[11px] text-muted-foreground font-medium">سارية ومطبقة فعلياً</div>
              </div>

              <div className="p-4 rounded-3xl bg-card border border-border/70 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                  <span className="text-xs font-bold">مسودات قيد الإعداد</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">{hubStats.draft}</div>
                <div className="text-[11px] text-muted-foreground font-medium">تحتاج مراجعة أو اعتماد</div>
              </div>

              <div className="p-4 rounded-3xl bg-card border border-border/70 shadow-xs space-y-1">
                <div className="flex items-center justify-between text-primary">
                  <span className="text-xs font-bold">اكتمال الحصص (100%)</span>
                  <BookmarkCheck className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-black text-foreground tabular-nums">{hubStats.complete}</div>
                <div className="text-[11px] text-muted-foreground font-medium">جداول مكتملة بـ 35 حصة</div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-card p-4 rounded-3xl border border-border/70 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={hubSearchQuery}
                    onChange={e => setHubSearchQuery(e.target.value)}
                    placeholder="ابحث باسم الجدول، الصف، الشعبة، أو الملاحظات..."
                    className="w-full h-11 rounded-2xl border border-border/70 bg-background/80 pr-10 pl-4 text-xs font-bold placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  {hubSearchQuery && (
                    <button
                      onClick={() => setHubSearchQuery("")}
                      className="absolute left-3.5 top-3.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 bg-muted/60 p-1.5 rounded-2xl shrink-0">
                  <button
                    onClick={() => setHubStatusFilter("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      hubStatusFilter === "all"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    الكل ({activeStageSavedTimetables.length})
                  </button>
                  <button
                    onClick={() => setHubStatusFilter("published")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      hubStatusFilter === "published"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    معتمد ونشط ({hubStats.published})
                  </button>
                  <button
                    onClick={() => setHubStatusFilter("draft")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      hubStatusFilter === "draft"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    مسودات ({hubStats.draft})
                  </button>
                </div>
              </div>

              {/* Grade Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-border/50">
                <span className="text-xs font-bold text-muted-foreground shrink-0 pl-2">تصفية الصف:</span>
                <button
                  onClick={() => setHubGradeFilter("الكل")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    hubGradeFilter === "الكل"
                      ? "bg-primary text-primary-foreground shadow-xs glow-primary"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  كافة الصفوف
                </button>
                {availableGrades.map(g => {
                  const countInGrade = activeStageSavedTimetables.filter(t => t.grade === g).length;
                  return (
                    <button
                      key={g}
                      onClick={() => setHubGradeFilter(g)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                        hubGradeFilter === g
                          ? "bg-primary text-primary-foreground shadow-xs glow-primary"
                          : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{g}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/30 font-bold">
                        {countInGrade}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Timetable Cards Grid */}
            {filteredHubTimetables.length === 0 ? (
              <div className="p-12 text-center bg-card rounded-3xl border border-border/70 space-y-4">
                <div className="h-16 w-16 mx-auto rounded-3xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <FolderKanban className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-base text-foreground">لا توجد جداول مطابقة لمعايير البحث</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    يمكنك إنشاء وتعيين جدول جديد لأي صف وشعبة، أو حفظ الجدول الحالي من المحرر مباشرة.
                  </p>
                </div>
                <button
                  onClick={handleOpenNewTimetableModal}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>إنشاء جدول جديد الآن</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredHubTimetables.map(timetable => {
                  const secObj = activeStageSections.find(s => s.id === timetable.sectionId);
                  const scheduledCount = timetable.sectionId 
                    ? activeStageScheduleSlots.filter(s => s.sectionId === timetable.sectionId).length
                    : timetable.slotsCount || 0;
                  const totalSlots = timetable.totalSlots || 35;
                  const percent = Math.min(100, Math.round((scheduledCount / totalSlots) * 100));

                  return (
                    <div
                      key={timetable.id}
                      className="group bg-card hover:bg-card/95 border border-border/70 hover:border-primary/40 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3.5">
                        {/* Card Header: Badges */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-xs font-black">
                              {timetable.grade}
                            </span>
                            <span className="px-2.5 py-1 rounded-xl bg-muted text-foreground text-xs font-bold">
                              {timetable.sectionName || "كافة الشُعب"}
                            </span>
                          </div>

                          {/* Status Badge */}
                          {timetable.status === "published" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>معتمد ونشط</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black">
                              <Clock className="w-3.5 h-3.5" />
                              <span>مسودة</span>
                            </span>
                          )}
                        </div>

                        {/* Title & Term */}
                        <div>
                          <h3 className="font-black text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {timetable.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground font-semibold">
                            <Calendar className="w-3 h-3 text-primary" />
                            <span>{timetable.termName || "الفصل الدراسي الثاني"}</span>
                            <span>•</span>
                            <span>{currentAcademicYear?.name || "1446 هـ"}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 bg-muted/40 p-3 rounded-2xl border border-border/50">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-muted-foreground">اكتمال الحصص الأسبوعية:</span>
                            <span className="text-foreground tabular-nums">{scheduledCount} / {totalSlots} ({percent}%)</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                percent === 100 
                                  ? "bg-emerald-500" 
                                  : percent > 50 
                                    ? "bg-primary" 
                                    : "bg-amber-500"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Metadata Tags */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-primary" />
                            <span className="truncate">رائد: {secObj?.homeroomTeacher || "غير محدد"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DoorOpen className="w-3.5 h-3.5 text-primary" />
                            <span className="truncate">القاعة: {secObj?.roomName || "قاعة أساسية"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Controls Footer */}
                      <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-1.5">
                        {/* Primary View Action */}
                        <button
                          onClick={() => setPreviewingTimetable(timetable)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-xs hover:bg-primary/90 transition-all glow-primary"
                          title="مطالعة وعرض الجدول على الشاشة"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>مطالعة وعرض</span>
                        </button>

                        {/* Edit in Studio */}
                        <button
                          onClick={() => handleEditTimetableInStudio(timetable)}
                          className="h-9 px-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted text-foreground text-xs font-bold transition-all"
                          title="تعديل في محرر الحصص"
                        >
                          <span>تعديل</span>
                        </button>

                        {/* Clone */}
                        <button
                          onClick={() => handleOpenCloneModal(timetable.sectionId)}
                          className="h-9 w-9 rounded-xl border border-border/70 bg-card hover:bg-muted text-foreground flex items-center justify-center transition-all"
                          title="نسخ وتعميم لشعبة أخرى"
                        >
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>

                        {/* Status Toggle */}
                        <button
                          onClick={() => handleToggleTimetableStatus(timetable)}
                          className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-all ${
                            timetable.status === "published"
                              ? "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                              : "border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                          }`}
                          title={timetable.status === "published" ? "تعليق الجدول وتحويله لمسودة" : "اعتماد وتفعيل الجدول"}
                        >
                          <Star className={`w-3.5 h-3.5 ${timetable.status === "published" ? "fill-emerald-500 text-emerald-500" : ""}`} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteTimetable(timetable)}
                          className="h-9 w-9 rounded-xl border border-border/70 bg-card hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-all"
                          title="حذف الجدول من السجل"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* =========================================================================
             STUDIO: محرر واستوديو الحصص الفعلي
             ========================================================================= */
          <>
            {/* =========================================================================
               UNIFIED LUXURY SCHEDULE MASTER HEADER & RIBBON
               ========================================================================= */}
            <div className="bg-card/95 backdrop-blur-2xl border border-border/70 rounded-3xl p-5 shadow-sm space-y-4">
              {/* Row 1: Brand / Title Capsule + Perspective Switcher + Action Controls */}
              <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 border-b border-border/60 pb-4">
                {/* Title & Stage Details */}
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-black shrink-0 shadow-inner border border-primary/20">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl font-black text-foreground tracking-tight">الجدول الأسبوعي المعتمد</h1>
                      <span className="px-3 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-black border border-primary/20">
                        {getStageLabel(stage)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{activeAcademicTerm?.name || "الفصل الدراسي النشط"}</span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                      إدارة الجداول الحصصية، منع التعارض للمعلمين، ومتابعة إشغال الفصول والمعامل بدقة
                    </p>
                  </div>
                </div>

                {/* Perspective Selector Pills (Segmented Control) */}
                <div className="flex items-center gap-1.5 bg-muted/60 dark:bg-muted/40 p-1.5 rounded-2xl shrink-0 overflow-x-auto border border-border/60">
                  <button
                    onClick={() => setViewPerspective("section")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                      viewPerspective === "section"
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 glow-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    }`}
                  >
                    <Layers3 className="w-4 h-4" />
                    <span>جدول الشُعبة</span>
                  </button>
                  <button
                    onClick={() => setViewPerspective("grade_matrix")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                      viewPerspective === "grade_matrix"
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 glow-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>مصفوفة الصف الكامل</span>
                  </button>
                  <button
                    onClick={() => setViewPerspective("teacher")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                      viewPerspective === "teacher"
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 glow-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>جدول المعلم</span>
                  </button>
                  <button
                    onClick={() => setViewPerspective("room")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                      viewPerspective === "room"
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 glow-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    }`}
                  >
                    <DoorOpen className="w-4 h-4" />
                    <span>إشغال القاعات</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </button>
                </div>
              </div>

              {/* Row 2: Dynamic Perspective Ribbon */}
              {(viewPerspective === "section" || viewPerspective === "grade_matrix") && (
                <div className="space-y-3.5">
                  {/* Grade Selector Strip */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    <div className="flex items-center gap-1.5 text-xs font-black text-foreground shrink-0 pl-1">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      <span>الصف الدراسي:</span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
                      {availableGrades.map(g => {
                        const secsCount = activeStageSections.filter(s => s.grade === g).length;
                        const isSelected = selectedGrade === g;
                        return (
                          <button
                            key={g}
                            onClick={() => setSelectedGrade(g)}
                            className={`group px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-2 border ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20 scale-[1.02]"
                                : "bg-background/70 hover:bg-accent/60 text-muted-foreground hover:text-foreground border-border/70"
                            }`}
                          >
                            <span>{g}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              isSelected ? "bg-background/25 text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}>
                              {secsCount} شُعب
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section Selector Strip (In Section Perspective) */}
                  {viewPerspective === "section" && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2.5 border-t border-border/50">
                      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
                        <div className="flex items-center gap-1.5 text-xs font-black text-foreground shrink-0 pl-1">
                          <Layers3 className="w-3.5 h-3.5 text-primary" />
                          <span>الشُعبة:</span>
                        </div>
                        {sectionsInGrade.length === 0 ? (
                          <span className="text-xs text-amber-600 font-bold bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                            لا توجد شعب مسجلة لهذا الصف
                          </span>
                        ) : (
                          sectionsInGrade.map(sec => {
                            const scheduled = activeStageScheduleSlots.filter(s => s.sectionId === sec.id).length;
                            const isSelected = targetSection?.id === sec.id;
                            const isComplete = scheduled >= totalPossibleSlots;
                            return (
                              <button
                                key={sec.id}
                                onClick={() => setTargetSectionId(sec.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-2.5 border ${
                                  isSelected
                                    ? "bg-primary/15 text-primary border-primary/40 shadow-sm ring-2 ring-primary/20"
                                    : "bg-background/60 hover:bg-accent/50 text-muted-foreground hover:text-foreground border-border/60"
                                }`}
                              >
                                <span className="font-black">شعبة ({sec.name})</span>
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold tabular-nums flex items-center gap-1 ${
                                  isComplete 
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" 
                                    : "bg-muted text-muted-foreground"
                                }`}>
                                  {isComplete && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                  <span>{scheduled} / {totalPossibleSlots} حصة</span>
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Section Info Capsule */}
                      {targetSection && (
                        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto bg-muted/40 dark:bg-muted/20 px-3.5 py-1.5 rounded-2xl border border-border/50 text-xs font-bold">
                          <span className="flex items-center gap-1.5 text-foreground">
                            <UserCheck className="w-3.5 h-3.5 text-primary" />
                            <span className="text-muted-foreground">الرائد:</span>
                            <span className="font-black text-foreground">{targetSection.homeroomTeacher || "غير محدد"}</span>
                          </span>
                          <span className="text-border">|</span>
                          <span className="flex items-center gap-1.5 text-foreground">
                            <DoorOpen className="w-3.5 h-3.5 text-primary" />
                            <span className="text-muted-foreground">القاعة:</span>
                            <span className="font-black text-foreground">{targetSection.roomName || "قاعة رئيسية"}</span>
                          </span>
                          <span className="text-border">|</span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <span>السعة:</span>
                            <span className="text-foreground font-bold">{targetSection.capacity || 30} طالب</span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Perspective: Teacher Selector */}
              {viewPerspective === "teacher" && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex-1 max-w-md">
                    <label className="text-xs font-bold text-muted-foreground block mb-1">اختر المعلم لعرض جدوله الأسبوعي:</label>
                    <TeacherPicker
                      teachers={activeStageStaff}
                      selectedTeacherId={selectedTeacherId}
                      onSelect={(id) => setSelectedTeacherId(id)}
                      placeholder="ابحث عن معلم بالاسم أو الرقم الوظيفي..."
                    />
                  </div>

                  {(() => {
                    const teacherSlots = activeStageScheduleSlots.filter(s => s.teacherId === selectedTeacherId);
                    const teacherObj = activeStageStaff.find(t => t.id === selectedTeacherId);
                    return (
                      <div className="flex items-center gap-3 text-xs font-black bg-muted/30 px-3.5 py-2 rounded-2xl border border-border/50">
                        <span className="text-muted-foreground">نصاب الحصص الفعلي:</span>
                        <span className="px-3 py-1 rounded-xl bg-primary/15 text-primary tabular-nums">
                          {teacherSlots.length} حصص أسبوعياً
                        </span>
                        <span className="text-muted-foreground">({teacherObj?.role || "معلم"})</span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Perspective: Room Selector & Occupancy System */}
              {viewPerspective === "room" && (
                <div className="space-y-4 pt-1">
                  {/* Categories and Conflict Alerts */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-foreground shrink-0 pl-1">تصنيف القاعات:</span>
                      <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border/50">
                        <button
                          onClick={() => setRoomCategoryFilter("all")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            roomCategoryFilter === "all" ? "bg-background text-primary shadow-xs font-black" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          جميع القاعات ({allStageRooms.length})
                        </button>
                        <button
                          onClick={() => setRoomCategoryFilter("classrooms")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            roomCategoryFilter === "classrooms" ? "bg-background text-primary shadow-xs font-black" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          فصول المرحلة ({allStageRooms.filter(r => r.type === "classroom").length})
                        </button>
                        <button
                          onClick={() => setRoomCategoryFilter("labs")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            roomCategoryFilter === "labs" ? "bg-background text-primary shadow-xs font-black" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          المعامل والمختبرات ({allStageRooms.filter(r => r.type === "lab").length})
                        </button>
                        <button
                          onClick={() => setRoomCategoryFilter("halls")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            roomCategoryFilter === "halls" ? "bg-background text-primary shadow-xs font-black" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          الصالات والمرافق ({allStageRooms.filter(r => r.type === "hall" || r.type === "office").length})
                        </button>
                      </div>
                    </div>

                    {selectedRoomConflicts.length > 0 && (
                      <div className="flex items-center gap-2 text-xs font-black bg-danger/10 text-danger border border-danger/30 px-3.5 py-1.5 rounded-xl animate-pulse">
                        <AlertTriangle className="w-4 h-4" />
                        <span>تنبيه: تم رصد {selectedRoomConflicts.length} تعارض في إشغال هذه القاعة!</span>
                      </div>
                    )}
                  </div>

                  {/* Room Selection Carousel / Chips */}
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-2 custom-scrollbar">
                    {relevantRooms.map(r => {
                      const roomSlots = activeStageScheduleSlots.filter(s => isSlotInRoom(s, r.id));
                      const occPercent = totalPossibleSlots > 0 ? Math.round((roomSlots.length / totalPossibleSlots) * 100) : 0;
                      const isSelected = selectedRoomId === r.id;
                      
                      return (
                        <button
                          key={r.id}
                          onClick={() => setSelectedRoomId(r.id)}
                          className={`group text-right p-3 rounded-2xl border transition-all shrink-0 min-w-[200px] flex flex-col gap-2 ${
                            isSelected
                              ? "bg-primary/10 border-primary shadow-sm ring-2 ring-primary/25"
                              : "bg-background/60 hover:bg-accent/40 border-border/70"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <DoorOpen className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                              <span className="font-black text-xs text-foreground">{r.name}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              r.type === "lab" ? "bg-purple-500/15 text-purple-600 dark:text-purple-400" :
                              r.type === "hall" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" :
                              "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                            }`}>
                              {r.type === "lab" ? "معمل" : r.type === "hall" ? "صالة" : "فصل"}
                            </span>
                          </div>

                          {/* Occupancy Mini Progress Gauge */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-muted-foreground">الإشغال: {roomSlots.length}/{totalPossibleSlots}</span>
                              <span className={occPercent > 80 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>
                                {occPercent}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  occPercent > 85 ? "bg-amber-500" : occPercent > 50 ? "bg-primary" : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(100, occPercent)}%` }}
                              />
                            </div>
                          </div>

                          {r.assignedSectionName && (
                            <div className="text-[10px] text-muted-foreground font-medium truncate">
                              مخصص لـ: {r.assignedSectionName}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Room Header Bar */}
                  {(() => {
                    const selectedRoomObj = allRooms.find(r => r.id === selectedRoomId);
                    if (!selectedRoomObj) return null;
                    const currentRoomSlots = activeStageScheduleSlots.filter(s => isSlotInRoom(s, selectedRoomId));
                    const currentRoomOccupancy = totalPossibleSlots > 0 ? Math.round((currentRoomSlots.length / totalPossibleSlots) * 100) : 0;
                    return (
                      <div className="bg-muted/30 dark:bg-muted/15 border border-border/50 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                            <DoorOpen className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-black text-sm text-foreground flex items-center gap-2">
                              <span>{selectedRoomObj.name}</span>
                              <span className="text-xs font-bold text-muted-foreground">({selectedRoomObj.building} - {selectedRoomObj.floor})</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-medium mt-0.5">
                              السعة: <span className="font-bold text-foreground">{selectedRoomObj.capacity} طالب</span>
                              {selectedRoomObj.assignedSectionName && (
                                <span> • الشعبة الثابتة: <span className="font-bold text-foreground">{selectedRoomObj.assignedSectionName}</span></span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 font-black">
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">الحصص المشغولة:</span>
                            <span className="px-2.5 py-1 rounded-xl bg-primary/15 text-primary tabular-nums">
                              {currentRoomSlots.length} حصة أسبوعياً
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">الحصص الشاغرة:</span>
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 tabular-nums">
                              {Math.max(0, totalPossibleSlots - currentRoomSlots.length)} حصة متاحة
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground">نسبة الإشغال:</span>
                            <span className={`px-2.5 py-1 rounded-xl text-xs tabular-nums ${
                              currentRoomOccupancy > 80 
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" 
                                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            }`}>
                              {currentRoomOccupancy}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

        {/* Section Subject Quotas Bar (Only in Section Perspective) */}
        {viewPerspective === "section" && targetSection && (
          <div className="bg-card/70 border border-border/70 rounded-3xl p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-black text-foreground">نصاب الحصص المعتمد للمواد الدراسية</h3>
                <span className="text-[11px] text-muted-foreground">
                  (تم جدولة {currentSectionScheduledSlots.length} من {totalPossibleSlots} حصة)
                </span>
              </div>

              {currentSectionScheduledSlots.length > 0 && (
                <button
                  onClick={handleClearAllSchedule}
                  className="text-[11px] font-bold text-destructive hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تفريغ جدول الشعبة</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {sectionSubjectQuotas.map(sq => {
                const theme = getSubjectTheme(sq.subject.code, sq.subject.name);
                const isComplete = sq.remainingPeriods === 0;

                return (
                  <div 
                    key={sq.subject.id}
                    className={`p-2.5 rounded-2xl border transition-all text-xs space-y-1 ${theme.bg} ${theme.border}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-black truncate ${theme.text}`}>{sq.subject.name}</span>
                      {isComplete ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                          باقي {sq.remainingPeriods}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate">{sq.assignedTeacherName ? sq.assignedTeacherName.split(" ")[0] : "معلم"}</span>
                      <span className="font-bold tabular-nums">{sq.scheduledPeriods}/{sq.expectedPeriods}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            PERSPECTIVE 1: Section Timetable Grid
            ========================================================================= */}
        {viewPerspective === "section" && (
          <div className="bg-card rounded-3xl border border-border/70 p-5 shadow-xs overflow-hidden">
            <div className="overflow-x-auto pb-2 custom-scrollbar">
              <table className="w-full min-w-[1280px] border-separate border-spacing-2 text-center" dir="rtl">
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
                            : "bg-muted/70 text-foreground border border-border/50 min-w-[150px]"
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
                        const slot = getSlot(targetSection?.id || "", day, p);
                        const sub = activeStageSubjects.find(s => s.id === slot?.subjectId);
                        const tchr = activeStageStaff.find(t => t.id === slot?.teacherId);
                        const theme = sub ? getSubjectTheme(sub.code, sub.name) : null;

                        return (
                          <td 
                            key={idx}
                            onClick={() => handleOpenSlotModal(day, p, targetSection?.id || "")}
                            className={`
                              min-h-[110px] min-w-[150px] rounded-2xl border p-3 text-xs transition-all cursor-pointer relative group select-none
                              ${slot 
                                ? `${theme?.bg} ${theme?.border} hover:shadow-md hover:scale-[1.01]` 
                                : "border-dashed border-border/60 bg-background/50 hover:bg-primary/5 hover:border-primary/50"
                              }
                            `}
                          >
                            {slot ? (
                              <div className="flex flex-col h-full justify-between text-right space-y-1.5">
                                <div className="flex items-start gap-1.5 min-w-0">
                                  <span className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${theme?.dot}`} />
                                  <span className={`font-black text-xs leading-snug break-words line-clamp-2 ${theme?.text}`}>
                                    {sub?.name || "مادة دراسية"}
                                  </span>
                                </div>

                                <div className="text-[11px] font-bold text-foreground/85 dark:text-foreground/90 flex items-center gap-1.5 py-0.5">
                                  <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span className="truncate">{tchr?.name || "معلم الحصة"}</span>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-muted-foreground/90 font-semibold pt-1 border-t border-border/30">
                                  <span className="truncate">{slot.roomName ? slot.roomName.split(" ")[0] : "قاعة"}</span>
                                  <span className="opacity-0 group-hover:opacity-100 text-primary font-black transition-opacity">
                                    تعديل ✎
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex h-full min-h-[90px] flex-col items-center justify-center text-muted-foreground/50 gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                <Plus className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-bold text-primary">إضافة حصة</span>
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
          </div>
        )}

        {/* =========================================================================
            PERSPECTIVE 2: Grade Panoramic Matrix (All Sections of Grade)
            ========================================================================= */}
        {viewPerspective === "grade_matrix" && (
          <div className="bg-card rounded-3xl border border-border/70 p-5 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="font-black text-sm text-foreground">
                  مصفوفة جدول جميع شُعب {selectedGrade}
                </h3>
                <p className="text-xs text-muted-foreground">
                  مقارنة الحصص المتزامنة لكافة الشعب في نفس الصف لتفادي التداخل ومتابعة الخطط
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-primary/10 text-primary text-xs font-black">
                {sectionsInGrade.length} شُعب دراسية
              </span>
            </div>

            {sectionsInGrade.length === 0 ? (
              <div className="text-center py-12 text-xs font-bold text-muted-foreground">
                لا توجد شعب مسجلة في {selectedGrade}
              </div>
            ) : (
              <div className="space-y-8">
                {DAYS.map(day => (
                  <div key={day} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <h4 className="text-xs font-black text-foreground">يوم {day}</h4>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full min-w-[800px] border-collapse border border-border/70 text-center text-xs">
                        <thead>
                          <tr className="bg-muted/60">
                            <th className="border border-border/70 p-2 font-black w-24">الشعبة</th>
                            {Array.from({ length: PERIODS_COUNT }).map((_, i) => (
                              <th key={i} className="border border-border/70 p-2 font-bold">
                                الحصة {i + 1}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sectionsInGrade.map(sec => (
                            <tr key={sec.id} className="hover:bg-muted/20">
                              <td className="border border-border/70 p-2.5 font-black bg-muted/40 text-primary">
                                شعبة ({sec.name})
                              </td>
                              {Array.from({ length: PERIODS_COUNT }).map((_, i) => {
                                const p = i + 1;
                                const slot = getSlot(sec.id, day, p);
                                const sub = activeStageSubjects.find(s => s.id === slot?.subjectId);
                                const tchr = activeStageStaff.find(t => t.id === slot?.teacherId);
                                const theme = sub ? getSubjectTheme(sub.code, sub.name) : null;

                                return (
                                  <td 
                                    key={p} 
                                    onClick={() => handleOpenSlotModal(day, p, sec.id)}
                                    className={`border border-border/70 p-2 cursor-pointer transition-all ${
                                      slot ? `${theme?.bg} ${theme?.text} font-bold` : "text-muted-foreground/40 hover:bg-primary/5"
                                    }`}
                                  >
                                    {slot ? (
                                      <div>
                                        <div className="font-black truncate">{sub?.name}</div>
                                        <div className="text-[10px] opacity-80 truncate">{tchr?.name?.split(" ")[0]}</div>
                                      </div>
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            PERSPECTIVE 3: Teacher Personal Schedule
            ========================================================================= */}
        {viewPerspective === "teacher" && (
          <div className="bg-card rounded-3xl border border-border/70 p-5 shadow-xs overflow-hidden">
            <div className="overflow-x-auto pb-2 custom-scrollbar">
              <table className="w-full min-w-[1100px] border-separate border-spacing-2 text-center" dir="rtl">
                <thead>
                  <tr>
                    <th className="rounded-2xl bg-muted/70 px-4 py-3.5 text-xs font-black text-foreground w-28 min-w-[100px] shadow-xs">
                      <div className="flex items-center justify-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>اليوم / التوقيت</span>
                      </div>
                    </th>
                    {Array.from({ length: PERIODS_COUNT }).map((_, i) => (
                      <th key={i} className="rounded-2xl px-3 py-3 text-xs font-black bg-muted/70 text-foreground border border-border/50 min-w-[135px] shadow-xs">
                        <div className="space-y-1">
                          <div className="font-black text-xs text-foreground">الحصة {i + 1}</div>
                          <div className="text-[10px] font-semibold text-muted-foreground tabular-nums bg-background/60 dark:bg-muted/50 px-2 py-0.5 rounded-md inline-block">
                            {periodTimeRanges[i + 1]?.start} - {periodTimeRanges[i + 1]?.end}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map(day => (
                    <tr key={day}>
                      <th className="rounded-2xl bg-muted/40 border border-border/40 px-3 py-3 text-xs font-black text-foreground align-middle shadow-2xs">
                        {day}
                      </th>

                      {Array.from({ length: PERIODS_COUNT }).map((_, i) => {
                        const p = i + 1;
                        const slot = activeStageScheduleSlots.find(
                          s => s.teacherId === selectedTeacherId && s.day === day && s.period === p
                        );
                        const sec = activeStageSections.find(s => s.id === slot?.sectionId);
                        const sub = activeStageSubjects.find(s => s.id === slot?.subjectId);
                        const theme = sub ? getSubjectTheme(sub.code, sub.name) : null;

                        return (
                          <td 
                            key={p}
                            className={`
                              min-h-[85px] min-w-[135px] rounded-2xl border p-2.5 text-xs transition-all
                              ${slot 
                                ? `${theme?.bg} ${theme?.border} font-bold shadow-2xs` 
                                : "border-dashed border-border/40 bg-muted/10 text-muted-foreground/40"
                              }
                            `}
                          >
                            {slot ? (
                              <div className="space-y-1.5 text-center flex flex-col justify-between h-full">
                                <div className={`font-black text-xs ${theme?.text} break-words line-clamp-2`}>
                                  {sub?.name || "مادة"}
                                </div>
                                <div className="text-[11px] font-bold text-foreground/85 dark:text-foreground/90 truncate">
                                  {sec?.grade} - شعبة {sec?.name}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] font-semibold text-muted-foreground/40">— شاغرة —</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            PERSPECTIVE 4: Classroom Occupancy Schedule
            ========================================================================= */}
        {viewPerspective === "room" && (
          <div className="bg-card rounded-3xl border border-border/70 p-5 shadow-xs overflow-hidden">
            <div className="overflow-x-auto pb-2 custom-scrollbar">
              <table className="w-full min-w-[1100px] border-separate border-spacing-2 text-center" dir="rtl">
                <thead>
                  <tr>
                    <th className="rounded-2xl bg-muted/70 px-4 py-3.5 text-xs font-black text-foreground w-28 min-w-[100px] shadow-xs">
                      <div className="flex items-center justify-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>اليوم / التوقيت</span>
                      </div>
                    </th>
                    {Array.from({ length: PERIODS_COUNT }).map((_, i) => (
                      <th key={i} className="rounded-2xl px-3 py-3 text-xs font-black bg-muted/70 text-foreground border border-border/50 min-w-[135px] shadow-xs">
                        <div className="space-y-1">
                          <div className="font-black text-xs text-foreground">الحصة {i + 1}</div>
                          <div className="text-[10px] font-semibold text-muted-foreground tabular-nums bg-background/60 dark:bg-muted/50 px-2 py-0.5 rounded-md inline-block">
                            {periodTimeRanges[i + 1]?.start} - {periodTimeRanges[i + 1]?.end}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map(day => (
                    <tr key={day}>
                      <th className="rounded-2xl bg-muted/40 border border-border/40 px-3 py-3 text-xs font-black text-foreground align-middle shadow-2xs">
                        {day}
                      </th>

                      {Array.from({ length: PERIODS_COUNT }).map((_, i) => {
                        const p = i + 1;
                        const matchingSlots = activeStageScheduleSlots.filter(
                          s => s.day === day && s.period === p && isSlotInRoom(s, selectedRoomId)
                        );
                        const slot = matchingSlots[0];
                        const isConflict = matchingSlots.length > 1;
                        const sec = activeStageSections.find(s => s.id === slot?.sectionId);
                        const sub = activeStageSubjects.find(s => s.id === slot?.subjectId);
                        const tchr = activeStageStaff.find(t => t.id === slot?.teacherId);
                        const theme = sub ? getSubjectTheme(sub.code, sub.name) : null;

                        return (
                          <td 
                            key={p}
                            className={`
                              min-h-[90px] min-w-[145px] rounded-2xl border p-2.5 text-xs transition-all
                              ${isConflict
                                ? "border-danger/60 bg-danger/10 text-danger font-bold shadow-sm ring-2 ring-danger/30"
                                : slot 
                                ? `${theme?.bg} ${theme?.border} font-bold shadow-2xs` 
                                : "border-dashed border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 group cursor-pointer"
                              }
                            `}
                            onClick={() => {
                              if (!slot && targetSection) {
                                handleOpenSlotModal(day, p, targetSection.id);
                              }
                            }}
                          >
                            {isConflict ? (
                              <div className="space-y-1 text-center flex flex-col justify-between h-full p-1">
                                <div className="flex items-center justify-center gap-1 text-danger font-black text-xs">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>تعارض قاعة!</span>
                                </div>
                                <div className="text-[10px] text-danger/90 font-bold">
                                  {matchingSlots.length} حصص مسندة لنفس التوقيت
                                </div>
                              </div>
                            ) : slot ? (
                              <div className="space-y-1 text-center flex flex-col justify-between h-full">
                                <div className={`font-black text-xs ${theme?.text} break-words line-clamp-2`}>
                                  {sec?.grade} - شعبة {sec?.name}
                                </div>
                                <div className="text-[11px] text-foreground/85 dark:text-foreground/90 font-semibold truncate">
                                  {sub?.name} ({tchr?.name?.split(" ")[0] || "معلم"})
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1 text-center py-2">
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">قاعة شاغرة ✓</span>
                                <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-primary font-bold">
                                  + تسكين حصة
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
          </div>
        )}
          </>
        )}

      </div>

      {/* =========================================================================
          Modal: Save / Publish Timetable Modal
          ========================================================================= */}
      {isSaveModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsSaveModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-md modal-card-luxury p-6 rounded-3xl border border-border/80 bg-card/98 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150 space-y-4 my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
                  <Save className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-foreground">حفظ واعتماد جدول الحصص</h3>
                  <p className="text-[11px] text-muted-foreground">تثبيت الجدول ونشره في سجل جداول الفصول</p>
                </div>
              </div>
              <button onClick={() => setIsSaveModalOpen(false)} className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSaveTimetable} className="space-y-3.5 text-xs">
              {/* Name */}
              <div>
                <label className="block font-bold text-foreground mb-1">اسم الجدول المعياري:</label>
                <input
                  type="text"
                  value={saveFormData.name}
                  onChange={e => setSaveFormData({ ...saveFormData, name: e.target.value })}
                  placeholder="مثال: جدول الصف الأول أ المعتمد للفصل الثاني"
                  className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>

              {/* Scope Selection */}
              <div>
                <label className="block font-bold text-foreground mb-1.5">نطاق الحفظ والاعتماد:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSaveFormData({ ...saveFormData, scope: "section" })}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      saveFormData.scope === "section"
                        ? "bg-primary text-primary-foreground border-primary font-black shadow-xs"
                        : "bg-muted/30 border-border/60 text-muted-foreground font-bold hover:bg-muted"
                    }`}
                  >
                    شعبة ({targetSection?.name}) فقط
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaveFormData({ ...saveFormData, scope: "grade" })}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      saveFormData.scope === "grade"
                        ? "bg-primary text-primary-foreground border-primary font-black shadow-xs"
                        : "bg-muted/30 border-border/60 text-muted-foreground font-bold hover:bg-muted"
                    }`}
                  >
                    تعميم على جميع شعب {selectedGrade}
                  </button>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block font-bold text-foreground mb-1.5">حالة الجدول:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSaveFormData({ ...saveFormData, status: "published" })}
                    className={`p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-1.5 ${
                      saveFormData.status === "published"
                        ? "bg-emerald-600 text-white border-emerald-600 font-black shadow-xs"
                        : "bg-muted/30 border-border/60 text-muted-foreground font-bold hover:bg-muted"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>معتمد ونشط</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaveFormData({ ...saveFormData, status: "draft" })}
                    className={`p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-1.5 ${
                      saveFormData.status === "draft"
                        ? "bg-amber-600 text-white border-amber-600 font-black shadow-xs"
                        : "bg-muted/30 border-border/60 text-muted-foreground font-bold hover:bg-muted"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>مسودة قيد المراجعة</span>
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-foreground mb-1">ملاحظات واعتماد إداري (اختياري):</label>
                <textarea
                  value={saveFormData.notes}
                  onChange={e => setSaveFormData({ ...saveFormData, notes: e.target.value })}
                  rows={2}
                  placeholder="أي توجيهات بخصوص هذا الجدول..."
                  className="w-full rounded-xl border border-input bg-background/80 p-2.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              <div className="pt-3 border-t border-border/60 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-input bg-background text-xs font-bold text-foreground hover:bg-muted"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-md hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>تأكيد الحفظ والاعتماد</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          Modal: Clone / Duplicate Timetable to Another Section
          ========================================================================= */}
      {isCloneModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsCloneModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-md modal-card-luxury p-6 rounded-3xl border border-border/80 bg-card/98 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150 space-y-4 my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-foreground">نسخ وتعميم جدول لشعبة أخرى</h3>
                  <p className="text-[11px] text-muted-foreground">تكرار الجدول الأسبوعي بحصصه ومواده لشعبة ثانية</p>
                </div>
              </div>
              <button onClick={() => setIsCloneModalOpen(false)} className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmClone} className="space-y-4 text-xs">
              {/* Source Section Info */}
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                <span className="text-muted-foreground font-semibold block text-[11px]">الشعبة المصدر (المراد نسخ جدولها):</span>
                <span className="font-black text-sm text-primary block">
                  {(() => {
                    const sec = activeStageSections.find(s => s.id === cloneSourceSectionId);
                    return sec ? `${sec.grade} - شعبة (${sec.name})` : "شعبة محددة";
                  })()}
                </span>
              </div>

              {/* Target Section Select */}
              <div>
                <label className="block font-bold text-foreground mb-1.5">اختر الشعبة المستهدفة لاستقبال الجدول:</label>
                <select
                  value={cloneTargetSectionId}
                  onChange={e => setCloneTargetSectionId(e.target.value)}
                  className="w-full h-11 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  required
                >
                  <option value="" disabled>-- اختر الشعبة المستهدفة --</option>
                  {activeStageSections
                    .filter(s => s.id !== cloneSourceSectionId)
                    .map(sec => (
                      <option key={sec.id} value={sec.id}>
                        {sec.grade} - شعبة ({sec.name}) [القاعة: {sec.roomName || "أساسية"}]
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-[11px] font-semibold leading-relaxed">
                ⚠️ سيتم استبدال الحصص الموجودة للشعبة المستهدفة بالحصص المنسوخة، وتحديث سجل الجداول المنشأة لها تلقائياً.
              </div>

              <div className="pt-3 border-t border-border/60 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCloneModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-input bg-background text-xs font-bold text-foreground hover:bg-muted"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-1.5 glow-primary"
                >
                  <Copy className="w-4 h-4" />
                  <span>تأكيد النسخ والتعميم</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          Modal: New Timetable Assignment Modal
          ========================================================================= */}
      {isNewTimetableModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsNewTimetableModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-md modal-card-luxury p-6 rounded-3xl border border-border/80 bg-card/98 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150 space-y-4 my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-foreground">إنشاء وتعيين جدول جديد</h3>
                  <p className="text-[11px] text-muted-foreground">تخصيص جدول لفصل أو شعبة معينة</p>
                </div>
              </div>
              <button onClick={() => setIsNewTimetableModalOpen(false)} className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCreateNewTimetable} className="space-y-3.5 text-xs">
              {/* Grade */}
              <div>
                <label className="block font-bold text-foreground mb-1">الصف الدراسي المستهدف:</label>
                <select
                  value={newTimetableData.grade}
                  onChange={e => {
                    const gr = e.target.value;
                    const secs = activeStageSections.filter(s => s.grade === gr);
                    setNewTimetableData(prev => ({
                      ...prev,
                      grade: gr,
                      sectionId: secs[0]?.id || "",
                      name: `جدول ${gr} - شعبة (${secs[0]?.name || "أ"}) المعتمد`
                    }));
                  }}
                  className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  {availableGrades.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block font-bold text-foreground mb-1">الشعبة المحددة:</label>
                <select
                  value={newTimetableData.sectionId}
                  onChange={e => {
                    const secId = e.target.value;
                    const sec = activeStageSections.find(s => s.id === secId);
                    setNewTimetableData(prev => ({
                      ...prev,
                      sectionId: secId,
                      name: `جدول ${prev.grade} - شعبة (${sec?.name || "أ"}) المعتمد`
                    }));
                  }}
                  className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  required
                >
                  {activeStageSections
                    .filter(s => s.grade === newTimetableData.grade)
                    .map(sec => (
                      <option key={sec.id} value={sec.id}>
                        شعبة ({sec.name}) - [رائد: {sec.homeroomTeacher || "غير محدد"}]
                      </option>
                    ))}
                </select>
              </div>

              {/* Timetable Name */}
              <div>
                <label className="block font-bold text-foreground mb-1">اسم الجدول:</label>
                <input
                  type="text"
                  value={newTimetableData.name}
                  onChange={e => setNewTimetableData({ ...newTimetableData, name: e.target.value })}
                  className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>

              {/* Creation Method */}
              <div>
                <label className="block font-bold text-foreground mb-1.5">آلية إعداد وتوليد الحصص:</label>
                <div className="space-y-2">
                  <label className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                    newTimetableData.type === "smart_auto" 
                      ? "bg-primary/10 border-primary/40 text-foreground" 
                      : "bg-muted/30 border-border/60 text-muted-foreground hover:bg-muted"
                  }`}>
                    <input
                      type="radio"
                      name="creationType"
                      checked={newTimetableData.type === "smart_auto"}
                      onChange={() => setNewTimetableData({ ...newTimetableData, type: "smart_auto" })}
                      className="accent-primary"
                    />
                    <div>
                      <div className="font-black text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>توليد ذكي تلقائي (خالي من التعارضات)</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">توزيع فوري لحصص المواد والمعلمين المكلفين للشعبة</p>
                    </div>
                  </label>

                  <label className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                    newTimetableData.type === "blank" 
                      ? "bg-primary/10 border-primary/40 text-foreground" 
                      : "bg-muted/30 border-border/60 text-muted-foreground hover:bg-muted"
                  }`}>
                    <input
                      type="radio"
                      name="creationType"
                      checked={newTimetableData.type === "blank"}
                      onChange={() => setNewTimetableData({ ...newTimetableData, type: "blank" })}
                      className="accent-primary"
                    />
                    <div>
                      <div className="font-black text-xs">إنشاء جدول فارغ</div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">البدء بجدول فارغ وإضافة الحصص يدوياً عبر المحرر</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTimetableModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-input bg-background text-xs font-bold text-foreground hover:bg-muted"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-1.5 glow-primary"
                >
                  <Plus className="w-4 h-4" />
                  <span>حفظ وإنشاء الجدول</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          Modal: Full Timetable Interactive Preview Modal (مطالعة وعرض الجدول على الشاشة)
          ========================================================================= */}
      {previewingTimetable && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 modal-backdrop-luxury animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setPreviewingTimetable(null)}
          dir="rtl"
        >
          <div 
            className={`modal-card-luxury p-5 sm:p-7 rounded-3xl border border-border/80 bg-card/98 dark:bg-card/95 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150 space-y-5 my-4 transition-all ${
              isPreviewMaximized ? "w-[98vw] max-w-none h-[95vh] flex flex-col" : "w-[96vw] max-w-[1480px]"
            }`}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-foreground">{previewingTimetable.name}</h2>
                    {previewingTimetable.status === "published" ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>معتمد ونشط</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-black">
                        مسودة
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                    {previewingTimetable.grade} • {previewingTimetable.sectionName || "كافة الشُعب"} • {previewingTimetable.termName || "الفصل الدراسي الحالي"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Maximize / Fullscreen Toggle */}
                <button
                  type="button"
                  onClick={() => setIsPreviewMaximized(!isPreviewMaximized)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3 text-xs font-bold hover:bg-muted text-foreground transition-all active:scale-95 shadow-2xs"
                  title={isPreviewMaximized ? "استعادة الحجم الطبيعي" : "تكبير ملء الشاشة"}
                >
                  {isPreviewMaximized ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="hidden sm:inline">تصغير</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="hidden sm:inline">ملء الشاشة</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    handleEditTimetableInStudio(previewingTimetable);
                    setPreviewingTimetable(null);
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3.5 text-xs font-bold hover:bg-muted text-foreground transition-all active:scale-95 shadow-2xs"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>تعديل بالمحرر</span>
                </button>
                <button
                  onClick={() => {
                    if (previewingTimetable.sectionId) {
                      setTargetSectionId(previewingTimetable.sectionId);
                    }
                    setIsPrintOpen(true);
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-sm active:scale-95 glow-primary"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة رسمية</span>
                </button>
                <button
                  onClick={() => setPreviewingTimetable(null)}
                  className="h-9 w-9 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Timetable Table Grid on Screen (Spacious, Zero-clipping & Eye-friendly) */}
            <div className={`overflow-x-auto rounded-3xl border border-border/70 bg-background/50 custom-scrollbar p-2.5 ${
              isPreviewMaximized ? "flex-1 overflow-y-auto" : ""
            }`}>
              <table className="w-full text-center border-separate border-spacing-2 min-w-[1320px]" dir="rtl">
                <thead>
                  <tr>
                    <th className="rounded-2xl bg-muted/70 px-4 py-3.5 text-xs font-black text-foreground w-32 min-w-[110px] shadow-2xs">
                      <div className="flex items-center justify-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>اليوم / التوقيت</span>
                      </div>
                    </th>
                    {layoutColumns.map((col, idx) => (
                      <th 
                        key={idx} 
                        className={`rounded-2xl px-3 py-3 text-xs font-black shadow-2xs ${
                          col.type === "break" 
                            ? "bg-amber-500/10 text-amber-900 dark:text-amber-200 w-24 min-w-[80px] border border-amber-500/25" 
                            : "bg-muted/70 text-foreground border border-border/50 min-w-[150px]"
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
                      <td className="rounded-2xl bg-muted/40 border border-border/40 px-3 py-3 font-black text-xs text-foreground align-middle shadow-2xs">
                        {day}
                      </td>
                      {layoutColumns.map((col, idx) => {
                        if (col.type === "break") {
                          if (day === DAYS[0]) {
                            return (
                              <td
                                key={idx}
                                rowSpan={DAYS.length}
                                className="rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-dashed border-amber-400/35 dark:border-amber-600/30 p-2 align-middle select-none w-24 min-w-[80px]"
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

                        const p = col.val as number;
                        const slot = getSlot(previewingTimetable.sectionId || targetSectionId, day, p);
                        const sub = activeStageSubjects.find(s => s.id === slot?.subjectId);
                        const tchr = activeStageStaff.find(t => t.id === slot?.teacherId);
                        const theme = sub ? getSubjectTheme(sub.code, sub.name) : null;

                        return (
                          <td key={idx} className="p-0 align-top min-w-[150px]">
                            {slot && sub ? (
                              <div className={`p-3 rounded-2xl border ${theme?.bg} ${theme?.border} flex flex-col justify-between min-h-[110px] h-full text-right shadow-2xs transition-all hover:scale-[1.01] hover:shadow-xs`}>
                                <div className="flex items-start gap-1.5 min-w-0">
                                  <span className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${theme?.dot}`} />
                                  <span className={`font-black text-xs leading-snug break-words line-clamp-2 ${theme?.text}`}>
                                    {sub.name}
                                  </span>
                                </div>

                                <div className="text-[11px] text-foreground/85 dark:text-foreground/90 font-bold flex items-center gap-1.5 py-1">
                                  <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span className="truncate">{tchr?.name || "معلم المادة"}</span>
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-muted-foreground/90 font-semibold pt-1 border-t border-border/40">
                                  <span className="truncate">{slot.roomName || "القاعة الرئيسية"}</span>
                                  {sub.code && (
                                    <span className="font-mono text-[9px] opacity-75">{sub.code}</span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="min-h-[110px] h-full rounded-2xl border border-dashed border-border/50 bg-muted/15 dark:bg-muted/10 flex flex-col items-center justify-center text-muted-foreground/40 text-xs font-semibold gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                                <span>— شاغرة —</span>
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

            {/* Notes & Legend Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-1 text-xs">
              {previewingTimetable.notes ? (
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-muted-foreground font-semibold flex-1">
                  <span className="font-bold text-foreground ml-1">ملاحظات:</span>
                  {previewingTimetable.notes}
                </div>
              ) : <div />}

              <div className="flex items-center gap-4 text-muted-foreground font-bold mr-auto">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/40" />
                  <span>حصص مسندة</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-amber-500/20 border border-amber-500/40" />
                  <span>فسح مدرسية</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          Modal: Edit Slot Details (Sleek, Responsive & Conflict-Aware)
          ========================================================================= */}
      {isSlotModalOpen && editingSlotCoord && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsSlotModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-lg modal-card-luxury p-6 sm:p-7 rounded-3xl border border-border/80 bg-card/98 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150 space-y-4 my-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="font-black text-base text-foreground">تعديل حصة الجدول الدراسي</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editingSlotCoord.day} • الحصة {editingSlotCoord.period} ({periodTimeRanges[editingSlotCoord.period]?.start} - {periodTimeRanges[editingSlotCoord.period]?.end})
                </p>
              </div>
              <button 
                onClick={() => setIsSlotModalOpen(false)}
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Subject Select Cards */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-2">اختر المادة التعليمية:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                {activeStageSubjects.map(sub => {
                  const isSelected = slotFormData.subjectId === sub.id;
                  const assign = activeStageTeachingAssignments.find(
                    ta => ta.sectionId === editingSlotCoord.sectionId && ta.subjectId === sub.id
                  );
                  const teacher = assign ? activeStageStaff.find(t => t.id === assign.teacherId) : undefined;
                  const theme = getSubjectTheme(sub.code, sub.name);

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleModalSubjectChange(sub.id)}
                      className={`p-2 rounded-xl border text-right transition-all flex flex-col justify-between ${
                        isSelected 
                          ? "bg-primary text-primary-foreground border-primary shadow-sm glow-primary" 
                          : `${theme.bg} ${theme.border} hover:border-primary/50 text-foreground`
                      }`}
                    >
                      <span className="font-black text-xs truncate">{sub.name}</span>
                      <span className={`text-[10px] truncate ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        {teacher ? teacher.name.split(" ")[0] : "بدون إسناد"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-3.5 pt-2 border-t border-border/50">
              {/* Teacher Select with TeacherPicker */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">المعلم المكلف بالحصة *</label>
                <TeacherPicker
                  teachers={activeStageStaff}
                  selectedTeacherId={slotFormData.teacherId}
                  onSelect={(id) => setSlotFormData({ ...slotFormData, teacherId: id })}
                  scheduleSlots={activeStageScheduleSlots}
                  day={editingSlotCoord.day}
                  period={editingSlotCoord.period}
                  excludeSectionId={editingSlotCoord.sectionId}
                  preventConflicts={settings.preventConflicts}
                  subjectName={activeStageSubjects.find(s => s.id === slotFormData.subjectId)?.name}
                  sectionName={targetSection ? `${targetSection.grade} - شعبة ${targetSection.name}` : undefined}
                  placeholder="انقر لاختيار وإسناد المعلم المكلف..."
                />

                {/* Real-time conflict alert */}
                {(() => {
                  const conflict = checkTeacherConflict(
                    slotFormData.teacherId, 
                    editingSlotCoord.day, 
                    editingSlotCoord.period, 
                    editingSlotCoord.sectionId
                  );
                  if (conflict) {
                    return (
                      <div className="mt-2 p-2.5 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-xs font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>تنبيه: المعلم لديه حصة ({conflict.subjectName}) في ({conflict.sectionName}) بنفس التوقيت!</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Classroom Override */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">القاعة الدراسية (اختياري)</label>
                <select
                  value={slotFormData.roomId}
                  onChange={e => setSlotFormData({ ...slotFormData, roomId: e.target.value })}
                  className="w-full h-11 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  <option value="">-- القاعة الافتراضية للشعبة --</option>
                  {allRooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.building} - {r.floor})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleClearCurrentSlot}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 transition-all flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>إفراغ الحصة</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSlotModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-input bg-background text-xs font-bold text-foreground hover:bg-muted"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md hover:bg-primary/90 transition-all glow-primary"
                  >
                    حفظ الحصة
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          Modal: Timetable Settings & Periods Duration
          ========================================================================= */}
      {isSettingsOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsSettingsOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-lg modal-card-luxury p-6 sm:p-7 rounded-3xl border border-border/80 bg-card/98 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150 space-y-4 my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground">إعدادات الجدول وتواقيت الحصص</h3>
                  <p className="text-xs text-muted-foreground">ضبط توقيت الحصص، الفسح، وأيام الدوام المدرسي</p>
                </div>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Start Time & Period Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">وقت بداية الحصة الأولى</label>
                  <input
                    type="time"
                    value={tempSettings.startTime || "07:30"}
                    onChange={e => setTempSettings({ ...tempSettings, startTime: e.target.value })}
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3 text-xs font-black text-foreground outline-none focus:border-primary transition-all cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">مدة الحصة (بالدقائق)</label>
                  <input
                    type="number"
                    min="30"
                    max="60"
                    value={tempSettings.periodDuration || 45}
                    onChange={e => setTempSettings({ ...tempSettings, periodDuration: Number(e.target.value) || 45 })}
                    className="w-full h-11 rounded-xl border border-input bg-background/80 px-3 text-xs font-black text-foreground outline-none focus:border-primary transition-all tabular-nums"
                  />
                </div>
              </div>

              {/* Number of Periods */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">عدد الحصص اليومي</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="4"
                    max="9"
                    value={tempSettings.periodsCount}
                    onChange={e => setTempSettings({ ...tempSettings, periodsCount: Number(e.target.value) || 7 })}
                    className="w-24 h-11 rounded-xl border border-input bg-background/80 px-3 text-center text-xs font-black text-foreground outline-none focus:border-primary transition-all tabular-nums"
                  />
                  <span className="text-xs text-muted-foreground font-bold">حصص يومياً (من 4 إلى 9)</span>
                </div>
              </div>

              {/* Study Days */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-2">أيام الدوام المدرسي الأسبوعية</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map(day => {
                    const isChecked = tempSettings.studyDays.includes(day);
                    return (
                      <label 
                        key={day}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                          isChecked 
                            ? "bg-primary/15 text-primary border-primary/40 shadow-2xs" 
                            : "bg-muted/30 text-muted-foreground border-border/60 hover:bg-muted"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            const checked = e.target.checked;
                            setTempSettings(prev => ({
                              ...prev,
                              studyDays: checked 
                                ? ALL_DAYS.filter(d => prev.studyDays.includes(d) || d === day)
                                : prev.studyDays.filter(d => d !== day)
                            }));
                          }}
                          className="sr-only"
                        />
                        <span>{day}</span>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Conflict Prevention Toggle */}
              <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-foreground">نظام منع تعارض المعلمين</h4>
                  <p className="text-[11px] text-muted-foreground">حظر تعيين المعلم في شعبتين مختلفتين بنفس الحصة</p>
                </div>
                <input
                  type="checkbox"
                  checked={tempSettings.preventConflicts}
                  onChange={e => setTempSettings({ ...tempSettings, preventConflicts: e.target.checked })}
                  className="h-4 w-4 rounded text-primary accent-primary cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border/50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-xl border border-input bg-background text-xs font-bold text-foreground hover:bg-muted"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md hover:bg-primary/90 transition-all glow-primary"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          Modal: Smart Auto-Schedule Confirmation
          ========================================================================= */}
      {isAutoScheduleModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200"
          onClick={() => setIsAutoScheduleModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-md modal-card-luxury p-6 rounded-3xl border border-border/80 bg-card/98 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-foreground">المولد الذكي للجدول المدرسي</h3>
                  <p className="text-[11px] text-muted-foreground">جدولة تلقائية خالية من التعارضات بنقرة واحدة</p>
                </div>
              </div>
              <button onClick={() => setIsAutoScheduleModalOpen(false)} className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block font-bold text-foreground">نطاق التوليد التلقائي:</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setAutoScheduleScope("section")}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    autoScheduleScope === "section"
                      ? "bg-primary text-primary-foreground border-primary shadow-sm font-black"
                      : "bg-muted/30 border-border/60 text-muted-foreground font-bold hover:bg-muted"
                  }`}
                >
                  شعبة ({targetSection?.name}) فقط
                </button>
                <button
                  type="button"
                  onClick={() => setAutoScheduleScope("grade")}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    autoScheduleScope === "grade"
                      ? "bg-primary text-primary-foreground border-primary shadow-sm font-black"
                      : "bg-muted/30 border-border/60 text-muted-foreground font-bold hover:bg-muted"
                  }`}
                >
                  جميع شعب {selectedGrade} ({sectionsInGrade.length} شُعب)
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>آلية التوليد الذكي:</span>
                </div>
                <p className="text-[11px] leading-relaxed font-semibold">
                  يعتمد المولد على حصص المواد المعتمدة والإسناد التدريسي للمعلمين، ويقوم بتوزيع المواد الأساسية على الحصص الأولى وتوزيع المعلمين دون أي تعارضات زمنية.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border/50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAutoScheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-input bg-background text-xs font-bold text-foreground hover:bg-muted"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={executeSmartAutoSchedule}
                className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md hover:bg-primary/90 transition-all glow-primary flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>بدء التوليد الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Print Engine */}
      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="الجدول الأسبوعي المعتمد للحصص"
        subtitle={`المرحلة: ${getStageLabel(stage)} • الصف: ${targetSection?.grade} • شعبة (${targetSection?.name})`}
        data={activeStageScheduleSlots}
        templates={printTemplates}
      />
    </AppShell>
  );
}
