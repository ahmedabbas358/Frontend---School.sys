import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { FileWarning, Save, Users, BookOpen, Clock, AlertTriangle, Search, Printer, CalendarDays, Filter } from "lucide-react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/attendance/take")({
  component: TakeAttendance,
});

type Status = "present" | "absent" | "late" | "excused";

const LABELS: Record<Status, string> = {
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  excused: "بعذر",
};

function TakeAttendance() {
  const { activeStageStudents, activeStageSections, activeStageSubjects, addAttendanceSession, currentAcademicYearId, allStudentEnrollments, allScheduleSlots, allAttendanceSessions, allAttendanceRecords } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  
  const [activeTab, setActiveTab] = useState<"take" | "weekly">("take");

  const [sectionId, setSectionId] = useState(activeStageSections[0]?.id || "");
  const [subjectId, setSubjectId] = useState(activeStageSubjects[0]?.id || "");
  const [period, setPeriod] = useState<number | "">(1); 
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [searchQ, setSearchQ] = useState("");

  const selectedSection = activeStageSections.find(s => s.id === sectionId);
  
  // Auto-link to Schedule
  const dayOfWeekStr = useMemo(() => {
    const d = new Date(date);
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return days[d.getDay()];
  }, [date]);

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
    return activeStageStudents.filter((s) => s.grade === selectedSection.grade);
  }, [sectionId, selectedSection, activeStageStudents]);

  const list = useMemo(() => {
    let result = [...baseList];
    if (searchQ) {
      const q = searchQ.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.nationalId.includes(q));
    }
    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [baseList, searchQ]);

  const setMark = (id: string, st: Status) => setMarks((m) => ({ ...m, [id]: st }));
  const setAllMarks = (st: Status) => setMarks(Object.fromEntries(baseList.map((s) => [s.id, st])));

  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const printTemplates: PrintTemplate[] = [
    {
      id: "attendance_report", name: "تقرير الحضور المعبأ اليومي", category: "الحضور والانصراف", type: "table",
      columns: [
        { key: "nationalId", label: "الرقم الوطني" },
        { key: "name", label: "اسم الطالب" },
        { key: "status", label: "الحالة", render: (r) => marks[r.id] ? LABELS[marks[r.id] as Status] : "لم يُرصد" }
      ]
    }
  ];

  const handleSave = () => {
    if (!period) return toast.error("الرجاء إدخال رقم الحصة يدوياً");
    if (!currentAcademicYearId) return toast.error("لا يوجد عام دراسي نشط");

    const pending = baseList.length - Object.keys(marks).length;
    if (pending > 0) return toast.warning(`تنبيه: لم يتم رصد ${pending} طالب`);

    const sessionData = {
      academicYearId: currentAcademicYearId,
      sectionId: sectionId,
      subjectId: subjectId,
      teacherId: "current_user", // Placeholder for actual logged in teacher
      periodNumber: Number(period),
      date: date,
      status: "closed" as const,
      createdBy: "current_user",
      createdAt: new Date().toISOString()
    };

    const recordsData = Object.entries(marks).map(([studentId, status]) => {
      const enrollment = allStudentEnrollments.find(e => e.studentId === studentId && e.academicYearId === currentAcademicYearId);
      return {
        studentEnrollmentId: enrollment?.id || "",
        status: status.toUpperCase() as any, // PRESENT, ABSENT, etc.
        markedBy: "current_user",
        markedAt: new Date().toISOString()
      };
    }).filter(r => r.studentEnrollmentId); // Ignore students without an enrollment

    if (recordsData.length > 0) {
      addAttendanceSession(sessionData, recordsData);
      toast.success("تم حفظ الحضور بنجاح واعتماد الجلسة");
    } else {
      toast.error("حدث خطأ: الطلاب غير مسجلين في العام الحالي");
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
    <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الطلاب" }, { label: "رصد الحضور والغياب" }]}>
      <div className="space-y-6">
        
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-end border-b border-border pb-4">
          <div>
            <h1 className="text-2xl font-black">رصد الحضور للطلاب (الحصص / الأيام)</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">الرصد الفوري وربطه تلقائياً بجدول الحصص والإنذارات</p>
          </div>
          <div className="flex rounded-xl border border-border bg-card p-1 shadow-sm">
            <button onClick={() => setActiveTab("take")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "take" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent text-muted-foreground"}`}>الرصد اليومي (حسب الحصة)</button>
            <button onClick={() => setActiveTab("weekly")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === "weekly" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent text-muted-foreground"}`}>السجل الأسبوعي والشهري</button>
          </div>
        </div>

        {activeTab === "take" && (
          <>
            <PageCard title="معايير الرصد" description={`قم بتحديد الشعبة والمادة وإدخال رقم الحصة - ${getStageLabel(stage)}`}>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3"/> الشعبة</label>
                  <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 font-bold outline-none focus:border-primary">
                    {activeStageSections.map((s) => <option key={s.id} value={s.id}>{s.grade} - {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground flex items-center gap-1"><BookOpen className="h-3 w-3"/> المادة</label>
                  <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 font-bold outline-none focus:border-primary">
                    {activeStageSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/> رقم الحصة</label>
                  <input type="number" min="1" max="10" value={period} onChange={(e) => setPeriod(e.target.value ? Number(e.target.value) : "")} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 font-bold outline-none focus:border-primary text-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">التاريخ</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-2.5 font-bold outline-none focus:border-primary" />
                </div>
              </div>
            </PageCard>

            <PageCard
              title={`قائمة الطلاب (${baseList.length})`}
              actions={
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setAllMarks("present")} className="rounded-lg bg-success/10 px-4 py-2 text-sm font-bold text-success hover:bg-success/20">تعليم الكل (حاضر)</button>
                  <button onClick={() => setMarks({})} className="rounded-lg border border-border px-4 py-2 text-sm font-bold hover:bg-accent">مسح الرصد</button>
                  <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"><Save className="h-4 w-4" /> حفظ الحضور</button>
                </div>
              }
            >
              <div className="space-y-3 mt-4">
                {list.map((s) => {
                  const st = marks[s.id];
                  const initials = s.name.split(" ").map(n=>n[0]).slice(0,2).join("");
                  
                  return (
                    <div key={s.id} className="grid grid-cols-1 md:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-border bg-background p-4 shadow-sm hover:border-primary/50 transition-colors">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-sm font-extrabold text-primary shadow-inner">{initials}</div>
                      <div>
                        <div className="font-bold text-base">{s.name}</div>
                        <div className="text-xs text-muted-foreground">الرقم الوطني: {s.nationalId}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {(Object.keys(LABELS) as Status[]).map((k) => (
                          <button
                            key={k} onClick={() => setMark(s.id, k)}
                            className={`rounded-lg border px-4 py-2 text-xs font-bold transition-all ${
                              st === k
                                ? k === "present" ? "border-success bg-success text-success-foreground"
                                : k === "absent" ? "border-danger bg-danger text-danger-foreground"
                                : k === "late" ? "border-warning bg-warning text-warning-foreground"
                                : "border-info bg-info text-info-foreground"
                                : "border-border bg-card hover:bg-accent"
                            }`}
                          >{LABELS[k]}</button>
                        ))}
                        {!st && <span className="text-xs text-danger font-bold flex items-center gap-1 animate-pulse"><FileWarning className="h-3 w-3" /> مفقود</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </PageCard>
          </>
        )}

        {activeTab === "weekly" && (
          <PageCard title="السجل الأسبوعي والشهري (لشعبة محددة)">
            <div className="flex gap-4 items-end mb-6 border-b border-border pb-4">
               <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3"/> الشعبة المستهدفة</label>
                  <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="w-full rounded-xl border border-input bg-background px-4 py-2 font-bold outline-none focus:border-primary">
                    {activeStageSections.map((s) => <option key={s.id} value={s.id}>{s.grade} - {s.name}</option>)}
                  </select>
               </div>
               <div>
                 <button className="bg-muted text-foreground px-4 py-2 rounded-lg font-bold text-sm hover:bg-accent border border-border flex items-center gap-2">
                   <Filter className="w-4 h-4" /> تخصيص الفترة
                 </button>
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right border border-border rounded-lg">
                 <thead className="bg-muted border-b border-border">
                   <tr>
                     <th className="px-4 py-3 font-bold text-center">الطالب</th>
                     <th className="px-4 py-3 font-bold text-center">إجمالي حصص الغياب</th>
                     <th className="px-4 py-3 font-bold text-center text-danger border-r border-border">حالة الإنذارات</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border">
                   {baseList.map((s) => {
                     const enrollmentId = allStudentEnrollments.find(e => e.studentId === s.id && e.academicYearId === currentAcademicYearId)?.id;
                     let totalAbsences = 0;
                     if (enrollmentId) {
                       totalAbsences = allAttendanceRecords.filter(r => r.studentEnrollmentId === enrollmentId && r.status === "ABSENT").length;
                     }
                     return (
                       <tr key={s.id} className="hover:bg-muted/30">
                         <td className="px-4 py-3 font-bold">{s.name}</td>
                         <td className="px-4 py-3 text-center">
                            <span className={totalAbsences >= 5 ? 'text-danger font-bold' : totalAbsences > 0 ? 'text-warning font-bold' : 'text-success'}>
                              {totalAbsences} <span className="text-xs font-normal">حصص</span>
                            </span>
                         </td>
                         <td className="px-4 py-3 text-center border-r border-border font-black text-lg">
                           {totalAbsences >= 5 ? <Badge tone="danger">إنذار غياب</Badge> : <Badge tone="success">سليم</Badge>}
                         </td>
                       </tr>
                     )
                   })}
                 </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-danger/10 border border-danger/20 rounded-lg flex items-start gap-3">
               <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
               <div>
                 <h4 className="font-bold text-danger text-sm">تنبيهات الإنذارات التلقائية</h4>
                 <p className="text-xs text-danger/80 mt-1">
                    تم ربط الحضور تلقائياً بنظام المخالفات. أي طالب يتجاوز (5) حصص غياب يصدر له إنذار مباشر في ملفه التأديبي.
                 </p>
               </div>
            </div>
          </PageCard>
        )}
      </div>

      <AdvancedPrintEngine isOpen={isPrintOpen} onClose={() => setIsPrintOpen(false)} title="تقرير الحضور والغياب" data={list} templates={printTemplates} />
    </AppShell>
  );
}
