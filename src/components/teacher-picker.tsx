import { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  Check, 
  GraduationCap, 
  AlertCircle, 
  X,
  UserCheck,
  Sparkles,
  BookOpen,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock
} from "lucide-react";
import { Staff, ScheduleSlot } from "@/contexts/GlobalStoreContext";
import { isTeachingStaff, matchesStaffId } from "@/lib/staff-categories";

export interface TeacherPickerProps {
  teachers: Staff[];
  selectedTeacherId?: string;
  onSelect: (teacherId: string, teacher?: Staff) => void;
  scheduleSlots?: ScheduleSlot[];
  day?: string;
  period?: number;
  excludeSectionId?: string;
  preventConflicts?: boolean;
  filterSubjectId?: string;
  subjectName?: string;
  sectionName?: string;
  gradeName?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TeacherPicker({
  teachers,
  selectedTeacherId,
  onSelect,
  scheduleSlots = [],
  day,
  period,
  excludeSectionId,
  preventConflicts = true,
  subjectName,
  sectionName,
  placeholder = "انقر لاختيار وإسناد المعلم...",
  className = "",
  disabled = false,
}: TeacherPickerProps) {
  // Modal Open State (Luxury Dialog Window)
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Search & Filter State inside the modal
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "available" | "subject_match" | "least_loaded">("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  // Reset search and tab when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setSearchQuery("");
      setActiveTab("all");
      setSelectedDepartment("all");
    }
  }, [isModalOpen]);

  // 1. Strictly filter to academic / teaching staff only
  const teachingStaff = useMemo(() => {
    return teachers.filter(t => {
      if (t.isDeleted || t.status === "terminated") return false;
      return isTeachingStaff(t) || t.role.includes("معلم") || t.role.includes("أستاذ") || t.role.includes("مربية") || t.role.includes("مدرس");
    });
  }, [teachers]);

  // 2. Selected Teacher Object
  const selectedTeacher = useMemo(() => {
    if (!selectedTeacherId) return null;
    return teachingStaff.find(t => matchesStaffId(t, selectedTeacherId)) || 
           teachers.find(t => matchesStaffId(t, selectedTeacherId));
  }, [teachingStaff, teachers, selectedTeacherId]);

  // 3. Conflict Map for current day & period
  const conflictMap = useMemo(() => {
    const map = new Map<string, { sectionId: string; subjectId?: string; sectionName?: string; subjectName?: string }>();
    if (!day || !period) return map;

    scheduleSlots.forEach(s => {
      if (s.day === day && s.period === period && (!excludeSectionId || s.sectionId !== excludeSectionId)) {
        map.set(s.teacherId, { 
          sectionId: s.sectionId, 
          subjectId: s.subjectId,
          sectionName: s.sectionName,
          subjectName: s.subjectName
        });
      }
    });
    return map;
  }, [scheduleSlots, day, period, excludeSectionId]);

  // 4. Workload calculation per teacher
  const workloadMap = useMemo(() => {
    const map = new Map<string, number>();
    scheduleSlots.forEach(s => {
      if (s.teacherId) {
        map.set(s.teacherId, (map.get(s.teacherId) || 0) + 1);
      }
    });
    return map;
  }, [scheduleSlots]);

  // 5. Unique Departments List for quick filtering
  const departmentsList = useMemo(() => {
    const depts = new Set<string>();
    teachingStaff.forEach(t => {
      if (t.department && t.department.trim()) {
        depts.add(t.department.trim());
      }
    });
    return Array.from(depts);
  }, [teachingStaff]);

  // 6. Subject Match Evaluator
  const isSubjectMatch = (t: Staff) => {
    if (!subjectName) return false;
    const cleanSub = subjectName.toLowerCase();
    const role = (t.role || "").toLowerCase();
    const dept = (t.department || "").toLowerCase();
    const subs = (t.subjects || []).map(s => s.toLowerCase());

    if (cleanSub.includes("رياضيات") || cleanSub.includes("math")) {
      return role.includes("رياضيات") || dept.includes("رياضيات") || subs.some(s => s.includes("رياضيات"));
    }
    if (cleanSub.includes("علوم") || cleanSub.includes("science") || cleanSub.includes("فيزياء") || cleanSub.includes("كيمياء") || cleanSub.includes("أحياء")) {
      return role.includes("علوم") || dept.includes("علوم") || subs.some(s => s.includes("علوم"));
    }
    if (cleanSub.includes("عرب") || cleanSub.includes("لغت") || cleanSub.includes("قرائ")) {
      return role.includes("عرب") || dept.includes("عرب") || role.includes("لغت") || subs.some(s => s.includes("عرب") || s.includes("لغت"));
    }
    if (cleanSub.includes("إنجليز") || cleanSub.includes("english")) {
      return role.includes("إنجليز") || dept.includes("إنجليز") || subs.some(s => s.includes("إنجليز"));
    }
    if (cleanSub.includes("إسلام") || cleanSub.includes("قرآن") || cleanSub.includes("توحيد") || cleanSub.includes("فقه") || cleanSub.includes("حديث")) {
      return role.includes("إسلام") || role.includes("قرآن") || dept.includes("إسلام") || subs.some(s => s.includes("إسلام") || s.includes("قرآن"));
    }
    if (cleanSub.includes("حاسب") || cleanSub.includes("رقمية") || cleanSub.includes("تقني")) {
      return role.includes("حاسب") || role.includes("رقمي") || dept.includes("حاسب") || subs.some(s => s.includes("حاسب") || s.includes("تقني"));
    }
    if (cleanSub.includes("بدن") || cleanSub.includes("رياض")) {
      return role.includes("بدن") || dept.includes("بدن") || subs.some(s => s.includes("بدن"));
    }
    if (cleanSub.includes("فن") || cleanSub.includes("رسم")) {
      return role.includes("فن") || dept.includes("فن") || subs.some(s => s.includes("فن"));
    }
    if (cleanSub.includes("اجتماع") || cleanSub.includes("تاريخ") || cleanSub.includes("جغرافيا")) {
      return role.includes("اجتماع") || dept.includes("اجتماع") || subs.some(s => s.includes("اجتماع"));
    }

    return role.includes(cleanSub) || dept.includes(cleanSub) || subs.some(s => s.includes(cleanSub));
  };

  // 7. Computed counts for tabs
  const tabCounts = useMemo(() => {
    const total = teachingStaff.length;
    const available = teachingStaff.filter(t => !conflictMap.has(t.id)).length;
    const subjectMatches = teachingStaff.filter(t => isSubjectMatch(t)).length;
    const leastLoaded = teachingStaff.filter(t => (workloadMap.get(t.id) || 0) < 16).length;
    return { total, available, subjectMatches, leastLoaded };
  }, [teachingStaff, conflictMap, workloadMap, subjectName]);

  // 8. Filtered Teachers List based on Search, Tab, and Department
  const filteredTeachers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return teachingStaff
      .filter(t => {
        // Search filter
        if (q) {
          const matchName = t.name.toLowerCase().includes(q);
          const matchNo = (t.employeeNo || "").toLowerCase().includes(q);
          const matchRole = (t.role || "").toLowerCase().includes(q);
          const matchDept = (t.department || "").toLowerCase().includes(q);
          const matchPhone = (t.phone || "").includes(q);
          const matchSubjects = (t.subjects || []).some(s => s.toLowerCase().includes(q));
          if (!matchName && !matchNo && !matchRole && !matchDept && !matchPhone && !matchSubjects) {
            return false;
          }
        }

        // Department filter
        if (selectedDepartment !== "all" && t.department !== selectedDepartment) {
          return false;
        }

        // Active Tab filter
        if (activeTab === "available") {
          return !conflictMap.has(t.id);
        }
        if (activeTab === "subject_match") {
          return isSubjectMatch(t);
        }
        if (activeTab === "least_loaded") {
          return (workloadMap.get(t.id) || 0) < 16;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort priority:
        // 1. Current selected teacher on top
        if (matchesStaffId(a, selectedTeacherId)) return -1;
        if (matchesStaffId(b, selectedTeacherId)) return 1;

        // 2. Subject match priority
        const aMatch = isSubjectMatch(a) ? 1 : 0;
        const bMatch = isSubjectMatch(b) ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;

        // 3. Free vs Conflict
        const aConflict = conflictMap.has(a.id) ? 1 : 0;
        const bConflict = conflictMap.has(b.id) ? 1 : 0;
        if (aConflict !== bConflict) return aConflict - bConflict;

        // 4. Lowest workload first
        const aLoad = workloadMap.get(a.id) || 0;
        const bLoad = workloadMap.get(b.id) || 0;
        return aLoad - bLoad;
      });
  }, [teachingStaff, searchQuery, activeTab, selectedDepartment, conflictMap, workloadMap, selectedTeacherId, subjectName]);

  // Handler to select a teacher
  const handleSelectTeacher = (t: Staff) => {
    const isBusy = conflictMap.has(t.id);
    if (isBusy && preventConflicts) {
      return;
    }
    onSelect(t.id, t);
    setIsModalOpen(false);
  };

  // Handler to clear selection
  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect("");
  };

  return (
    <div className={`relative ${className}`} dir="rtl">
      {/* =========================================================================
          1. LUXURY TRIGGER CARD / BUTTON
          ========================================================================= */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsModalOpen(true)}
        className={`w-full min-h-[50px] rounded-2xl border px-3.5 py-2.5 text-start flex items-center justify-between gap-3 transition-all duration-200 group ${
          selectedTeacher 
            ? "border-primary/40 bg-card/95 hover:bg-card hover:border-primary/70 shadow-sm ring-1 ring-primary/15" 
            : "border-border/80 bg-background/80 hover:bg-card hover:border-primary/50 shadow-2xs"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {selectedTeacher ? (
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Avatar with gradient border */}
            <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/30 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
              {selectedTeacher.name.charAt(0)}
              <span className="absolute -bottom-0.5 -start-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-xs text-foreground truncate">{selectedTeacher.name}</span>
                <span className="text-[10px] font-bold text-muted-foreground tabular-nums px-2 py-0.5 rounded-lg bg-muted border border-border/40">
                  {selectedTeacher.employeeNo || selectedTeacher.id}
                </span>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                  {selectedTeacher.role}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground font-medium truncate flex items-center gap-2 mt-0.5">
                <span>{selectedTeacher.department || "الهيئة التعليمية"}</span>
                <span>•</span>
                <span className="text-primary font-bold tabular-nums">
                  النصاب: {workloadMap.get(selectedTeacher.id) || 0} / 24 حصة
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <div className="w-8 h-8 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-bold block">{placeholder}</span>
              <span className="text-[10px] text-muted-foreground/70 font-semibold block">انقر لفتح نافذة البحث واختيار المعلم</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {selectedTeacher && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClearSelection}
              className="p-1.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="إلغاء اختيار المعلم"
            >
              <X className="w-4 h-4" />
            </span>
          )}
          <div className="h-8 px-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-black flex items-center gap-1 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            <Search className="w-3.5 h-3.5" />
            <span>تحديد</span>
          </div>
        </div>
      </button>

      {/* =========================================================================
          2. DEDICATED LUXURY MODAL WINDOW (نافذة اختيار وإسناد المعلم)
          ========================================================================= */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 modal-backdrop-luxury animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
          dir="rtl"
        >
          <div 
            className="w-full max-w-4xl modal-card-luxury rounded-3xl border border-border/80 bg-card/98 shadow-2xl backdrop-blur-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 my-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-border/60 bg-gradient-to-r from-card via-card/95 to-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-black shrink-0 shadow-xs border border-primary/20 glow-primary">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black text-foreground">نافذة اختيار وإسناد المعلم</h2>
                    {day && period && (
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-black border border-primary/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{day} • الحصة {period}</span>
                      </span>
                    )}
                    {subjectName && (
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-500/20 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>{subjectName}</span>
                      </span>
                    )}
                    {sectionName && (
                      <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-bold border border-border/50">
                        {sectionName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium flex items-center gap-2">
                    <span>البحث والفرز الذكي للهيئة التعليمية، فحص التعارضات، وموازنة نصاب الحصص</span>
                    {preventConflicts && day && period && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>منع التعارض نشط</span>
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-9 w-9 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer self-start sm:self-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search & Category Filter Header */}
            <div className="p-4 sm:p-5 border-b border-border/50 bg-muted/20 space-y-3.5 shrink-0">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  autoFocus
                  type="text"
                  placeholder="ابحث باسم المعلم، الرقم الوظيفي، المواد المسندة، أو رقم الهاتف..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-input bg-background/90 ps-11 pe-10 text-xs sm:text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute end-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Tabs & Quick Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                  <button
                    type="button"
                    onClick={() => setActiveTab("all")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                      activeTab === "all"
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-background/80 text-muted-foreground hover:text-foreground border-border/60"
                    }`}
                  >
                    <span>الكل</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-bold">
                      {tabCounts.total}
                    </span>
                  </button>

                  {day && period && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("available")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                        activeTab === "available"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-background/80 text-muted-foreground hover:text-foreground border-border/60"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>المتاحون للحصة فقط</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-[10px] font-bold">
                        {tabCounts.available}
                      </span>
                    </button>
                  )}

                  {subjectName && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("subject_match")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                        activeTab === "subject_match"
                          ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                          : "bg-background/80 text-muted-foreground hover:text-foreground border-border/60"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>معلمو المادة المقررة</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-purple-500/20 text-[10px] font-bold">
                        {tabCounts.subjectMatches}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab("least_loaded")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                      activeTab === "least_loaded"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-background/80 text-muted-foreground hover:text-foreground border-border/60"
                    }`}
                  >
                    <span>الأقل نصاباً</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-blue-500/20 text-[10px] font-bold">
                      {tabCounts.leastLoaded}
                    </span>
                  </button>
                </div>

                {/* Department Dropdown */}
                {departmentsList.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    <select
                      value={selectedDepartment}
                      onChange={e => setSelectedDepartment(e.target.value)}
                      className="h-8 rounded-xl border border-input bg-background px-2.5 text-xs font-bold text-foreground outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="all">كافة الأقسام والمواد</option>
                      {departmentsList.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Teachers Grid Section (Scrollable) */}
            <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-2.5">
              {filteredTeachers.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="h-16 w-16 mx-auto rounded-3xl bg-muted/60 text-muted-foreground flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 opacity-60" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-foreground">لا يوجد معلمون يطابقون خيارات البحث</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      جرب تغيير نص البحث أو اختيار تبويب "الكل" لإظهار كافة المعلمين
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveTab("all");
                      setSelectedDepartment("all");
                    }}
                    className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-black hover:bg-primary/20 transition-all"
                  >
                    إعادة ضبط الفلاتر
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTeachers.map(t => {
                    const isSelected = matchesStaffId(t, selectedTeacherId);
                    const conflict = conflictMap.get(t.id);
                    const isBusy = !!conflict;
                    const workload = workloadMap.get(t.id) || 0;
                    const targetQuota = 24;
                    const isBlocked = isBusy && preventConflicts;

                    return (
                      <div
                        key={t.id}
                        onClick={() => !isBlocked && handleSelectTeacher(t)}
                        className={`p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between gap-3 text-right ${
                          isSelected
                            ? "bg-primary/10 border-primary shadow-sm ring-2 ring-primary/25 cursor-pointer"
                            : isBlocked
                            ? "bg-destructive/5 border-destructive/25 opacity-60 cursor-not-allowed"
                            : "bg-background/80 hover:bg-card hover:border-primary/50 border-border/70 cursor-pointer shadow-2xs hover:shadow-xs hover:scale-[1.005]"
                        }`}
                      >
                        {/* Top: Avatar, Name, Badges */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            {/* Avatar */}
                            <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs border ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : isBusy
                                ? "bg-destructive/15 text-destructive border-destructive/30"
                                : "bg-primary/10 text-primary border-primary/20"
                            }`}>
                              {t.name.charAt(0)}
                              <span className={`absolute -bottom-0.5 -start-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-background ${
                                isBusy ? "bg-destructive" : "bg-emerald-500"
                              }`} />
                            </div>

                            {/* Info */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sm text-foreground truncate">{t.name}</span>
                                {isSelected && (
                                  <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-black shrink-0">
                                    المعلم المختار
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] font-bold">
                                <span className="text-muted-foreground">{t.role}</span>
                                <span className="text-border">•</span>
                                <span className="text-muted-foreground">{t.department || "الهيئة التعليمية"}</span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-muted text-muted-foreground">
                                  #{t.employeeNo || t.id}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right Badge / Status */}
                          <div className="shrink-0">
                            {isBusy ? (
                              <span className="px-2.5 py-1 rounded-xl bg-destructive/15 text-destructive border border-destructive/25 text-[10px] font-black flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>مشغول</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[10px] font-black flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>متاح للحصة</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Conflict Description if busy */}
                        {isBusy && conflict && (
                          <div className="p-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-bold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              مشغول في: {conflict.sectionName || "شعبة أخرى"} ({conflict.subjectName || "حصة مسندة"})
                            </span>
                          </div>
                        )}

                        {/* Bottom: Workload Gauge & Selection Trigger */}
                        <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-3 text-xs">
                          {/* Workload Progress Bar */}
                          <div className="flex-1 max-w-[200px] space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className="text-muted-foreground">النصاب الأسبوعي:</span>
                              <span className={workload >= targetQuota ? "text-amber-600 dark:text-amber-400" : "text-primary"}>
                                {workload} / {targetQuota} حصة
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  workload >= targetQuota ? "bg-amber-500" : workload > 16 ? "bg-primary" : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(100, (workload / targetQuota) * 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="shrink-0">
                            {isSelected ? (
                              <div className="h-8 px-3 rounded-xl bg-primary text-primary-foreground font-black text-xs flex items-center gap-1.5 shadow-xs">
                                <Check className="w-3.5 h-3.5" />
                                <span>محدد</span>
                              </div>
                            ) : isBlocked ? (
                              <span className="text-[10px] font-bold text-destructive/80">
                                غير متاح للتعارض
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectTeacher(t);
                                }}
                                className="h-8 px-3.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-black text-xs transition-all flex items-center gap-1 active:scale-95 shadow-2xs cursor-pointer"
                              >
                                <span>اختيار وإسناد</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border/60 bg-muted/30 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-semibold">المعلم المختار حالياً:</span>
                {selectedTeacher ? (
                  <span className="font-black text-foreground bg-background px-2.5 py-1 rounded-xl border border-border/60">
                    {selectedTeacher.name} ({selectedTeacher.role})
                  </span>
                ) : (
                  <span className="text-muted-foreground/80 font-bold">لم يتم اختيار معلم</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedTeacher && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelect("");
                      setIsModalOpen(false);
                    }}
                    className="h-9 px-3.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-bold transition-all cursor-pointer"
                  >
                    إلغاء التحديد
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 px-5 rounded-xl bg-muted hover:bg-accent text-foreground text-xs font-black transition-all border border-border/60 cursor-pointer"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
