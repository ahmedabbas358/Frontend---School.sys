import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { 
  FileWarning, 
  Save, 
  Users, 
  BookOpen, 
  Clock, 
  AlertTriangle, 
  Search, 
  Printer, 
  CalendarDays, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  Sparkles,
  ArrowRight,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { GradeSectionPills } from "@/components/grade-section-control";
import { AttendanceDisciplineNav } from "@/components/attendance/attendance-nav";
import { AdminModal } from "@/components/admin/admin-modal";

export const Route = createFileRoute("/attendance/take")({
  head: () => ({
    meta: [
      { title: "رصد الحضور السريع بالحصص | منصة مدارس" },
      { name: "description", content: "رصد فوري لحضور الطلاب بالحصة وربطه تلقائياً بجدول الحصص والإنذارات" }
    ],
  }),
  component: TakeAttendance,
});

type Status = "present" | "absent" | "late" | "excused";

const LABELS: Record<Status, { label: string; icon: any; activeClass: string }> = {
  present: {
    label: "حاضر",
    icon: CheckCircle2,
    activeClass: "border-emerald-500 bg-emerald-500 text-white shadow-xs",
  },
  absent: {
    label: "غائب",
    icon: XCircle,
    activeClass: "border-destructive bg-destructive text-white shadow-xs",
  },
  late: {
    label: "متأخر",
    icon: Clock,
    activeClass: "border-amber-500 bg-amber-500 text-white shadow-xs",
  },
  excused: {
    label: "بعذر",
    icon: HelpCircle,
    activeClass: "border-blue-500 bg-blue-500 text-white shadow-xs",
  },
};

function TakeAttendance() {
  const { 
    activeStageStudents, 
    activeStageSections, 
    activeStageSubjects, 
    addAttendanceSession, 
    currentAcademicYearId, 
    allStudentEnrollments, 
    allScheduleSlots, 
    allAttendanceRecords,
    addActivityLog 
  } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  
  const [activeTab, setActiveTab] = useState<"take" | "weekly">("take");

  const availableGrades = useMemo(() => {
    return Array.from(new Set(activeStageSections.map(s => s.grade))).filter(Boolean);
  }, [activeStageSections]);

  const [selectedGrade, setSelectedGrade] = useState<string>(() => {
    return activeStageSections[0]?.grade || "الصف الأول";
  });

  const [sectionId, setSectionId] = useState(activeStageSections[0]?.id || "");
  const [subjectId, setSubjectId] = useState(activeStageSubjects[0]?.id || "");
  const [period, setPeriod] = useState<number | "">(1); 
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  
  const [marks, setMarks] = useState<Record<string, { status: Status; notes?: string }>>({});
  const [searchQ, setSearchQ] = useState("");
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Quick note modal
  const [noteModalStudent, setNoteModalStudent] = useState<{ id: string; name: string } | null>(null);
  const [tempNote, setTempNote] = useState("");

  const selectedSection = activeStageSections.find(s => s.id === sectionId);
  
  // Auto-link to Schedule
  const dayOfWeekStr = useMemo(() => {
    const d = new Date(date);
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return days[d.getDay()];
  }, [date]);

  const todaySchedule = useMemo(() => {
    return allScheduleSlots.filter(s => s.sectionId === sectionId && s.day === dayOfWeekStr);
  }, [sectionId, dayOfWeekStr, allScheduleSlots]);

  // Find subject from schedule automatically
  useMemo(() => {
    if (!sectionId || !period || !dayOfWeekStr) return;
    const slot = allScheduleSlots.find(s => s.sectionId === sectionId && s.day === dayOfWeekStr && s.period === Number(period));
    if (slot && slot.subjectId !== subjectId) {
      setSubjectId(slot.subjectId);
    }
  }, [sectionId, period, dayOfWeekStr, allScheduleSlots]);

  const baseList = useMemo(() => {
    if (!selectedSection) return [];
    return activeStageStudents.filter((s) => {
      const enrollment = allStudentEnrollments.find(e => e.studentId === s.id && e.academicYearId === currentAcademicYearId);
      return (enrollment?.sectionId === selectedSection.id) || (s.sectionId === selectedSection.id);
    });
  }, [selectedSection, activeStageStudents, allStudentEnrollments, currentAcademicYearId]);

  const list = useMemo(() => {
    let result = [...baseList];
    if (searchQ) {
      const q = searchQ.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q) || (s.nationalId || "").includes(q));
    }
    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [baseList, searchQ]);

  const setMark = (id: string, st: Status) => {
    setMarks((m) => ({
      ...m,
      [id]: { status: st, notes: m[id]?.notes || "" }
    }));
  };

  const setAllMarks = (st: Status) => {
    const updated: Record<string, { status: Status; notes?: string }> = {};
    baseList.forEach(s => {
      updated[s.id] = { status: st, notes: marks[s.id]?.notes || "" };
    });
    setMarks(updated);
    toast.success(`تم تعيين حالة جميع الطلاب (${baseList.length}) إلى: ${LABELS[st].label}`);
  };

  const selectedSubject = activeStageSubjects.find(sub => sub.id === subjectId);

  // Metrics computation for this session
  const sessionMetrics = useMemo(() => {
    let p = 0, a = 0, l = 0, e = 0;
    Object.values(marks).forEach(m => {
      if (m.status === "present") p++;
      else if (m.status === "absent") a++;
      else if (m.status === "late") l++;
      else if (m.status === "excused") e++;
    });
    const recorded = Object.keys(marks).length;
    const rate = recorded > 0 ? Math.round(((p + l) / recorded) * 100) : 100;
    return { present: p, absent: a, late: l, excused: e, recorded, rate };
  }, [marks]);

  const printData = useMemo(() => {
    return list.map((s, idx) => ({
      id: s.id,
      index: idx + 1,
      nationalId: s.nationalId || "—",
      name: s.name,
      gradeSection: selectedSection ? `${selectedSection.grade} - شعبة ${selectedSection.name}` : "—",
      status: marks[s.id]?.status ? LABELS[marks[s.id].status].label : "غير مرصود",
      notes: marks[s.id]?.notes || "—"
    }));
  }, [list, selectedSection, marks]);

  const printTemplates: PrintTemplate[] = [
    {
      id: "class-session-attendance",
      name: "كشف حضور الحصة المعتمد",
      category: "الحضور والانضباط",
      type: "table",
      columns: [
        { label: "م", key: "index" },
        { label: "رقم الهوية", key: "nationalId" },
        { label: "اسم الطالب", key: "name" },
        { label: "الصف والشعبة", key: "gradeSection" },
        { label: "الحالة", key: "status" },
        { label: "ملاحظات", key: "notes" },
      ],
      description: "كشف حضور وغياب الطلاب اليومي معتمد للإدارة المدرسية"
    }
  ];

  const handleSave = () => {
    if (!period) return toast.error("الرجاء تحديد رقم الحصة الدراسية");
    if (!currentAcademicYearId) return toast.error("لا يوجد عام دراسي نشط مسجل");

    const pending = baseList.length - Object.keys(marks).length;
    if (pending > 0) return toast.warning(`تنبيه: لم يتم رصد ${pending} طالباً بعد`);

    const sessionData = {
      academicYearId: currentAcademicYearId,
      sectionId: sectionId,
      subjectId: subjectId,
      teacherId: "معلم الحصة",
      periodNumber: Number(period),
      date: date,
      status: "closed" as const,
      createdBy: "معلم الحصة",
      createdAt: new Date().toISOString()
    };

    const recordsData = Object.entries(marks).map(([studentId, data]) => {
      const enrollment = allStudentEnrollments.find(e => e.studentId === studentId && e.academicYearId === currentAcademicYearId);
      return {
        studentEnrollmentId: enrollment?.id || studentId,
        status: data.status.toUpperCase() as any,
        remarks: data.notes || undefined,
        markedBy: "معلم الحصة",
        markedAt: new Date().toISOString()
      };
    });

    if (recordsData.length > 0) {
      addAttendanceSession(sessionData, recordsData);
      addActivityLog({
        user: "معلم الحصة",
        action: "رصد حضور حصة",
        entity: "الحضور والانضباط",
        details: `تم حفظ واعتماد حضور شعبة (${selectedSection?.name}) للحصة (${period}) - ${recordsData.length} طالب`,
      });
      toast.success("تم حفظ حضور الحصة بنجاح واعتماد الجلسة في السجل المركزي!");
    } else {
      toast.error("حدث خطأ: تأكد من تسجيل الطلاب في العام الحالي");
    }
  };

  if (activeStageSections.length === 0) {
    return (
      <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الطلاب" }, { label: "رصد الحضور" }]}>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertTriangle className="h-16 w-16 text-warning mb-6" />
          <h2 className="text-2xl font-bold mb-3">لا توجد شعب مسجلة</h2>
          <Link to="/academic/classes" className="rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground hover:bg-primary/90 transition-all mt-4">الانتقال لإضافة شعبة</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell 
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الحضور والانضباط", to: "/attendance" },
        { label: "رصد الحصص السريع" }
      ]}
    >
      <div className="space-y-6">

        {/* Unified Subnavigation Ribbon */}
        <AttendanceDisciplineNav
          activeTab="take"
          quickActions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPrintOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-card border border-border/70 px-3.5 text-xs font-bold text-foreground hover:bg-muted transition-all shadow-2xs cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 text-primary" />
                <span>طباعة الكشف</span>
              </button>
              <button 
                onClick={handleSave}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 text-xs font-black hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 active:scale-95 cursor-pointer glow-primary"
              >
                <Save className="h-3.5 w-3.5" />
                <span>اعتماد وحفظ الحضور</span>
              </button>
            </div>
          }
        />

        {/* Mode Switcher Banner */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card border border-border/80 rounded-3xl p-5 shadow-xs">
          <div>
            <h1 className="text-xl font-black text-foreground">رصد الحضور للطلاب (الحصص / الجدول الأسبوعي)</h1>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              الرصد الفوري لحصة دراسية محددة أو استعراض ملخص الإنذارات الأسبوعية
            </p>
          </div>
          <div className="flex rounded-2xl border border-border/80 bg-background/80 p-1 shadow-2xs">
            <button 
              onClick={() => setActiveTab("take")} 
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                activeTab === "take" ? "bg-primary text-primary-foreground shadow-xs" : "hover:bg-muted text-muted-foreground"
              }`}
            >
              الرصد اليومي (حسب الحصة)
            </button>
            <button 
              onClick={() => setActiveTab("weekly")} 
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                activeTab === "weekly" ? "bg-primary text-primary-foreground shadow-xs" : "hover:bg-muted text-muted-foreground"
              }`}
            >
              سجل إنذارات الشعبة
            </button>
          </div>
        </div>

        {activeTab === "take" && (
          <>
            {/* Session Settings Ribbon */}
            <div className="bg-card p-5 rounded-3xl border border-border/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <CalendarDays className="w-4 h-4 text-primary" />
                <span className="text-xs font-black text-foreground">1. محددات جلسة الحصة الدراسية:</span>
              </div>

              <div className="space-y-4">
                <GradeSectionPills
                  grades={availableGrades}
                  selectedGrade={selectedGrade}
                  onSelectGrade={(g) => {
                    setSelectedGrade(g);
                    const firstSec = activeStageSections.find(s => s.grade === g);
                    if (firstSec) setSectionId(firstSec.id);
                  }}
                  sections={activeStageSections}
                  selectedSectionId={sectionId}
                  onSelectSectionId={(sId) => setSectionId(sId)}
                  size="sm"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-bold pt-1">
                  <div>
                    <label className="block text-foreground mb-1">تاريخ الحصة:</label>
                    <input 
                      type="date" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)} 
                      className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-foreground mb-1">رقم الحصة في اليوم:</label>
                    <select 
                      value={period} 
                      onChange={(e) => setPeriod(e.target.value ? Number(e.target.value) : "")}
                      className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                        <option key={p} value={p}>الحصة رقم {p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-foreground mb-1">المادة التعليمية المرتبطة:</label>
                    <select 
                      value={subjectId} 
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="">-- اختر المادة التعليمية --</option>
                      {activeStageSubjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>{sub.name} ({sub.code || "عام"})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Session Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-card border border-border/70 flex items-center justify-between">
                <span className="text-muted-foreground font-bold">تم رصدهم:</span>
                <span className="font-black text-foreground tabular-nums">
                  {sessionMetrics.recorded} / {baseList.length}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span className="font-bold">حاضر:</span>
                <span className="font-black tabular-nums">{sessionMetrics.present}</span>
              </div>
              <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between">
                <span className="font-bold">غائب:</span>
                <span className="font-black tabular-nums">{sessionMetrics.absent}</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-between">
                <span className="font-bold">متأخر:</span>
                <span className="font-black tabular-nums">{sessionMetrics.late}</span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-between">
                <span className="font-bold">بعذر:</span>
                <span className="font-black tabular-nums">{sessionMetrics.excused}</span>
              </div>
            </div>

            {/* Students List Card */}
            <PageCard
              title={`قائمة طلاب الشعبة (${list.length} طالب)`}
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={() => setAllMarks("present")} 
                    className="h-9 px-3 rounded-xl bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/25 text-xs font-black transition-all cursor-pointer"
                  >
                    تعليم الكل (حاضر)
                  </button>
                  <button 
                    onClick={() => setMarks({})} 
                    className="h-9 px-3 rounded-xl border border-input hover:bg-muted text-xs font-bold transition-all cursor-pointer"
                  >
                    مسح الرصد
                  </button>
                </div>
              }
            >
              {/* Search input inside card */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="بحث سريع باسم الطالب..."
                    className="w-full h-10 rounded-xl border border-input bg-background pr-9 pl-3 text-xs font-bold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {list.map((s, idx) => {
                  const markObj = marks[s.id];
                  const st = markObj?.status;
                  const initials = s.name.split(" ").map(n => n[0]).slice(0, 2).join("");
                  
                  return (
                    <div 
                      key={s.id} 
                      className={`grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border p-4 transition-all ${
                        st === "absent" 
                          ? "bg-destructive/5 border-destructive/30" 
                          : st === "late"
                          ? "bg-amber-500/5 border-amber-500/30"
                          : st === "excused"
                          ? "bg-blue-500/5 border-blue-500/30"
                          : "bg-card border-border/80 hover:border-primary/40"
                      }`}
                    >
                      <div className="h-10 w-10 grid place-items-center rounded-xl bg-primary/10 text-xs font-black text-primary">
                        {initials}
                      </div>

                      <div>
                        <div className="font-black text-xs text-foreground flex items-center gap-2">
                          <span>{s.name}</span>
                          {markObj?.notes && (
                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md font-normal text-muted-foreground">
                              📝 {markObj.notes}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-semibold">
                          الرقم الوطني: {s.nationalId || "—"}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {(Object.keys(LABELS) as Status[]).map((k) => {
                          const conf = LABELS[k];
                          const IconComp = conf.icon;
                          const isSelected = st === k;

                          return (
                            <button
                              key={k} 
                              onClick={() => setMark(s.id, k)}
                              className={`h-9 px-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                isSelected
                                  ? conf.activeClass
                                  : "border-border/70 bg-card hover:bg-muted text-foreground"
                              }`}
                            >
                              <IconComp className="w-3.5 h-3.5" />
                              <span>{conf.label}</span>
                            </button>
                          );
                        })}

                        {/* Button to add note/excuse */}
                        <button
                          type="button"
                          onClick={() => {
                            setNoteModalStudent({ id: s.id, name: s.name });
                            setTempNote(marks[s.id]?.notes || "");
                          }}
                          className="h-9 px-2.5 rounded-xl border border-input hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold transition-all cursor-pointer"
                          title="إضافة ملاحظة أو عذر"
                        >
                          ملاحظة
                        </button>

                        {!st && (
                          <span className="text-xs text-destructive font-black flex items-center gap-1 animate-pulse mr-1">
                            <FileWarning className="h-3.5 w-3.5" />
                            <span>غير مسجل</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </PageCard>
          </>
        )}

        {activeTab === "weekly" && (
          <PageCard title="سجل إنذارات الغياب التراكمي للشعبة">
            <div className="space-y-4 mb-6 border-b border-border/60 pb-4">
              <GradeSectionPills
                grades={availableGrades}
                selectedGrade={selectedGrade}
                onSelectGrade={(g) => setSelectedGrade(g)}
                sections={activeStageSections}
                selectedSectionId={sectionId}
                onSelectSectionId={(sId) => setSectionId(sId)}
                size="sm"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border border-border/80 rounded-2xl overflow-hidden">
                 <thead className="bg-muted/50 border-b border-border/80">
                   <tr>
                     <th className="px-4 py-3 font-black">اسم الطالب</th>
                     <th className="px-4 py-3 font-black text-center">إجمالي حصص الغياب</th>
                     <th className="px-4 py-3 font-black text-center border-r border-border/60">حالة الإنذارات</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border/60">
                   {baseList.map((s) => {
                     const enrollmentId = allStudentEnrollments.find(e => e.studentId === s.id && e.academicYearId === currentAcademicYearId)?.id;
                     let totalAbsences = 0;
                     if (enrollmentId) {
                       totalAbsences = allAttendanceRecords.filter(r => (r.studentEnrollmentId === enrollmentId || r.studentEnrollmentId === s.id) && r.status === "ABSENT").length;
                     }
                     return (
                       <tr key={s.id} className="hover:bg-muted/20">
                         <td className="px-4 py-3 font-black text-foreground">{s.name}</td>
                         <td className="px-4 py-3 text-center">
                            <span className={totalAbsences >= 5 ? 'text-destructive font-black text-sm' : totalAbsences > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                              {totalAbsences} <span className="text-[10px] font-normal text-muted-foreground">حصص</span>
                            </span>
                         </td>
                         <td className="px-4 py-3 text-center border-r border-border/60">
                           {totalAbsences >= 5 ? (
                             <Badge tone="danger">إنذار غياب نهائي</Badge>
                           ) : totalAbsences >= 3 ? (
                             <Badge tone="warning">إنذار أولي</Badge>
                           ) : (
                             <Badge tone="success">سليم ومنضبط</Badge>
                           )}
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/25 rounded-2xl flex items-start gap-3 text-xs">
               <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
               <div>
                 <h4 className="font-black text-destructive">الربط الآلي باللائحة التأديبية:</h4>
                 <p className="text-muted-foreground mt-0.5 leading-relaxed font-semibold">
                    يتم احتساب الغياب تلقائياً، وأي طالب يتجاوز (5) حصص غياب يظهر له إشعار إنذار مباشر في ملفه التراكمي ويمكن إصدار خطاب استدعاء ولي أمره بضغطة زر.
                 </p>
               </div>
            </div>
          </PageCard>
        )}
      </div>

      {/* Note / Reason Modal */}
      {noteModalStudent && (
        <AdminModal
          isOpen={true}
          onClose={() => setNoteModalStudent(null)}
          title="تدوين ملاحظة أو عذر غياب"
          subtitle={`الطالب: ${noteModalStudent.name}`}
          icon={HelpCircle}
          tone="info"
          size="small"
        >
          <div className="space-y-4 text-xs font-bold">
            <div>
              <label className="block mb-1 text-foreground">بيان العذر أو الملاحظة:</label>
              <textarea
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
                rows={3}
                placeholder="مثال: عذر طبي، تأخر بسبب الازدحام، مأذون بإذن رسمي..."
                className="w-full rounded-xl border border-input bg-background p-3 text-xs font-medium outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setNoteModalStudent(null)}
                className="h-9 px-4 rounded-xl border border-input text-xs font-bold hover:bg-muted"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  setMarks(prev => ({
                    ...prev,
                    [noteModalStudent.id]: {
                      status: prev[noteModalStudent.id]?.status || "excused",
                      notes: tempNote
                    }
                  }));
                  toast.success("تم حفظ الملاحظة للطالب بنجاح");
                  setNoteModalStudent(null);
                }}
                className="h-9 px-5 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-xs hover:bg-primary/90"
              >
                حفظ الملاحظة
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Print Engine */}
      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title={`كشف حضور ${selectedSection ? `${selectedSection.grade} - شعبة ${selectedSection.name}` : ''} - الحصة (${period || 1})`} 
        data={printData} 
        templates={printTemplates} 
      />
    </AppShell>
  );
}
