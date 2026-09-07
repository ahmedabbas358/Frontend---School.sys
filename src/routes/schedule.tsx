import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { SearchableSelect } from "@/components/searchable-select";
import { Trash2, X, AlertCircle, Printer, Settings, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [{ title: "الجدول الأسبوعي | منصة مدارس" }, { name: "description", content: "إدارة الجدول الأسبوعي الفعلي" }],
  }),
  component: SchedulePage,
});

const ALL_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

type TimetableSettings = {
  stage: string;
  studyDays: string[];
  periodsCount: number;
  breaks: { afterPeriod: number; name: string }[];
  preventConflicts: boolean;
};

const getDefaultTimetableSettings = (stage: string): TimetableSettings => ({
  stage,
  studyDays: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"],
  periodsCount: 7,
  breaks: [{ afterPeriod: 3, name: "الفسحة الأولى" }, { afterPeriod: 5, name: "الفسحة الثانية" }],
  preventConflicts: true,
});

const normalizeTimetableSettings = (stage: string, settings: Partial<TimetableSettings> | null | undefined): TimetableSettings => {
  const fallback = getDefaultTimetableSettings(stage);

  return {
    ...fallback,
    ...settings,
    studyDays: Array.isArray(settings?.studyDays) && settings.studyDays.length > 0 ? settings.studyDays : fallback.studyDays,
    periodsCount: typeof settings?.periodsCount === "number" ? settings.periodsCount : fallback.periodsCount,
    breaks: Array.isArray(settings?.breaks) ? settings.breaks : fallback.breaks,
    preventConflicts: typeof settings?.preventConflicts === "boolean" ? settings.preventConflicts : fallback.preventConflicts,
  };
};

function SchedulePage() {
  const { stage, getStageLabel } = useStage();
  const { 
    activeStageSections, 
    activeStageStaff, 
    activeStageSubjects, 
    activeStageScheduleSlots, 
    activeStageTimetableSettings,
    updateTimetableSettings,
    updateScheduleSlot, 
    clearScheduleSlot 
  } = useGlobalStore();

  const [filterGrade, setFilterGrade] = useState<string>("");
  const [targetSectionId, setTargetSectionId] = useState<string>(activeStageSections[0]?.id || "");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{day: string, period: number} | null>(null);
  
  const availableGrades = useMemo(() => Array.from(new Set(activeStageSections.map(s => s.grade))), [activeStageSections]);
  
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings State for Modal
  const [tempSettings, setTempSettings] = useState<TimetableSettings>(
    normalizeTimetableSettings(stage, activeStageTimetableSettings)
  );

  const DAYS = tempSettings.studyDays;
  const PERIODS_COUNT = tempSettings.periodsCount;
  const BREAKS = tempSettings.breaks;
  const PREVENT_CONFLICTS = tempSettings.preventConflicts;

  const teachers = activeStageStaff.filter(s => s.role.includes("معلم") || s.role.includes("مربي"));
  const targetSection = activeStageSections.find(s => s.id === targetSectionId);

  const sectionsList = useMemo(() => {
    let secs = activeStageSections;
    if (filterGrade) {
      secs = secs.filter(s => s.grade === filterGrade);
    }
    return secs.map(s => ({ id: s.id, title: `شعبة ${s.name}`, subtitle: s.grade }));
  }, [activeStageSections, filterGrade]);

  const getSlot = (day: string, period: number) => {
    return activeStageScheduleSlots.find(s => s.sectionId === targetSectionId && s.day === day && s.period === period);
  };

  const isTeacherBusy = (teacherId: string, day: string, period: number) => {
    if (!PREVENT_CONFLICTS) return false;
    const slot = activeStageScheduleSlots.find(s => s.teacherId === teacherId && s.day === day && s.period === period);
    if (slot && slot.sectionId !== targetSectionId) {
      const sec = activeStageSections.find(sec => sec.id === slot.sectionId);
      return `مشغول في: ${sec?.grade || ""} - ${sec?.name || ""}`;
    }
    return false;
  };

  const handleCellClick = (day: string, period: number) => {
    if (!targetSectionId) return;
    const existing = getSlot(day, period);
    setEditingSlot({ day, period });
    setSelectedSubject(existing?.subjectId || "");
    setSelectedTeacher(existing?.teacherId || "");
    setModalOpen(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot || !selectedSubject || !selectedTeacher) {
      toast.error("الرجاء اختيار المادة والمعلم");
      return;
    }

    const busyReason = isTeacherBusy(selectedTeacher, editingSlot.day, editingSlot.period);
    if (busyReason) {
      toast.error(`لا يمكن تعيين المعلم، ${busyReason}`);
      return;
    }

    updateScheduleSlot({
      sectionId: targetSectionId,
      day: editingSlot.day,
      period: editingSlot.period,
      subjectId: selectedSubject,
      teacherId: selectedTeacher,
      stage
    });
    
    toast.success("تم حفظ الحصة بنجاح");
    setModalOpen(false);
  };

  const handleClearSlot = () => {
    if (editingSlot) {
      clearScheduleSlot(targetSectionId, editingSlot.day, editingSlot.period);
      toast.success("تم إفراغ الحصة");
      setModalOpen(false);
    }
  };

  const saveSettings = () => {
    updateTimetableSettings({
      ...tempSettings,
      stage: stage // Save to current stage
    });
    toast.success("تم حفظ إعدادات الجدول بنجاح");
    setIsSettingsOpen(false);
  };

  // Generate dynamic columns layout for headers and rows (combining periods and breaks)
  const layoutColumns = useMemo(() => {
    let cols: { type: "period" | "break", val: number | string }[] = [];
    for (let p = 1; p <= PERIODS_COUNT; p++) {
      cols.push({ type: "period", val: p });
      const brk = BREAKS.find((b: any) => b.afterPeriod === p);
      if (brk) {
        cols.push({ type: "break", val: brk.name });
      }
    }
    return cols;
  }, [PERIODS_COUNT, BREAKS]);

  const printTemplates: PrintTemplate[] = useMemo(() => {
    if (!targetSection) return [];
    
    return [
      {
        id: "weekly-schedule",
        name: "الجدول الأسبوعي",
        category: "جداول",
        type: "document",
        description: "طباعة الجدول الأسبوعي بتنسيق جدولي منسق للتعليق",
        customControls: [
          { key: "hideTeachers", label: "إخفاء أسماء المعلمين", type: "toggle", defaultValue: false },
          { key: "customTitle", label: "الجهة الموجه إليها", type: "select", options: [{label: "الطلاب", value: "students"}, {label: "المعلمين", value: "teachers"}], defaultValue: "students" }
        ],
        renderDocument: (options) => {
          const hideTeachers = options.customOptions.hideTeachers;
          
          return (
            <div className="border-4 border-double border-gray-600 p-6 rounded-2xl bg-white shadow-sm text-black">
              <div className="text-center mb-8 border-b-2 border-gray-400 pb-6">
                <h1 className="text-3xl font-black mb-2">الجدول الأسبوعي للحصص ({options.customOptions.customTitle === "students" ? "نسخة الطلاب" : "نسخة الإدارة"})</h1>
                <div className="flex justify-center gap-6 mt-4 font-bold text-lg text-gray-700">
                  <span className="bg-gray-100 px-4 py-1 rounded-full border border-gray-300">المرحلة: {getStageLabel(stage)}</span>
                  <span className="bg-gray-100 px-4 py-1 rounded-full border border-gray-300">الصف: {targetSection.grade}</span>
                  <span className="bg-gray-100 px-4 py-1 rounded-full border border-gray-300">شعبة: {targetSection.name}</span>
                </div>
              </div>
              
              <table className="w-full border-collapse border-2 border-gray-800 text-center" dir="rtl">
                <thead>
                  <tr>
                    <th className="border-2 border-gray-800 bg-gray-200 p-3 w-24 font-black text-black">اليوم \ الحصة</th>
                    {layoutColumns.map((col, idx) => (
                      <th key={idx} className={`border-2 border-gray-800 p-3 font-bold text-black ${col.type === "break" ? "bg-gray-300 w-16" : "bg-gray-100"}`}>
                        {col.type === "period" ? `الحصة ${col.val}` : col.val}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((d: any) => (
                    <tr key={d}>
                      <td className="border-2 border-gray-800 bg-gray-100 p-3 font-black text-black">{d}</td>
                      {layoutColumns.map((col, idx) => {
                        if (col.type === "break") {
                          if (d === DAYS[0]) {
                            return (
                              <td key={idx} rowSpan={DAYS.length} className="border-2 border-gray-800 bg-gray-300 font-black text-gray-700 py-4 w-12 text-center" style={{writingMode: "vertical-rl"}}>
                                {col.val}
                              </td>
                            );
                          }
                          return null;
                        }
                        
                        const p = col.val as number;
                        const slot = getSlot(d, p);
                        if (!slot) return <td key={idx} className="border border-gray-400 bg-white p-2"></td>;
                        const sub = activeStageSubjects.find((s) => s.id === slot.subjectId)?.name || "مادة محذوفة";
                        const tchr = activeStageStaff.find((t) => t.id === slot.teacherId)?.name || "معلم محذوف";
                        return (
                          <td key={idx} className="border border-gray-400 p-2 align-middle bg-gray-50">
                            <div className="font-bold text-sm mb-1">{sub}</div>
                            {!hideTeachers && <div className="text-xs text-gray-600 font-medium">{tchr}</div>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
      }
    ];
  }, [targetSection, stage, getStageLabel, activeStageScheduleSlots, activeStageSubjects, activeStageStaff, layoutColumns, DAYS]);


  if (activeStageSections.length === 0) {
    return (
      <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الجدول الأسبوعي" }]}>
        <PageCard>
          <div className="p-8 text-center text-muted-foreground">
            لا توجد شعب مسجلة في هذه المرحلة. قم بإضافة صفوف وشعب أولاً.
          </div>
        </PageCard>
      </AppShell>
    );
  }

  return (
    <AppShell 
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الجدول الأسبوعي" }]}
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-bold hover:bg-accent transition-all shadow-sm"
          >
            <Settings className="h-4 w-4" /> إعدادات الجدول
          </button>
          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            <Printer className="h-4 w-4" /> طباعة الجدول
          </button>
        </div>
      }
    >
      <div className="space-y-5 animate-in fade-in duration-500">
        <PageCard>
          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 w-full md:max-w-xl">
              <div className="flex-1">
                <label className="block text-sm font-bold text-muted-foreground mb-1.5 px-1">تصفية حسب الصف</label>
                <select
                  value={filterGrade}
                  onChange={(e) => {
                    const grade = e.target.value;
                    setFilterGrade(grade);
                    const firstSec = activeStageSections.find(s => !grade || s.grade === grade);
                    setTargetSectionId(firstSec?.id || "");
                  }}
                  className="h-[42px] w-full rounded-xl border border-border/50 bg-background px-3 focus:border-primary focus:outline-none"
                >
                  <option value="">كل الصفوف</option>
                  {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-bold text-muted-foreground mb-1.5 px-1">اختر الشعبة لإدارة جدولها</label>
                <SearchableSelect 
                  value={targetSectionId} 
                  onChange={(v) => setTargetSectionId(v)}
                  options={sectionsList}
                  placeholder="-- ابحث عن شعبة --"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {PREVENT_CONFLICTS ? (
                <Badge tone="info">نظام منع التعارض الفعال قيد التشغيل</Badge>
              ) : (
                <Badge tone="neutral">نظام التعارض متوقف</Badge>
              )}
            </div>
          </div>
        </PageCard>

        <PageCard title={`الجدول الفعلي: ${targetSection?.grade || ""} - شعبة ${targetSection?.name || ""}`} description={`المرحلة: ${getStageLabel(stage)}`}>
          <div className="overflow-x-auto pb-4">
            <table className="w-full min-w-[900px] border-separate border-spacing-1.5">
              <thead>
                <tr>
                  <th className="rounded-xl bg-muted/60 px-3 py-3 text-sm text-muted-foreground w-28">اليوم / الحصة</th>
                  {layoutColumns.map((col, idx) => (
                    <th key={idx} className={`rounded-xl px-3 py-3 text-sm font-bold ${col.type === "break" ? "bg-amber-100/50 text-amber-800 w-16" : "bg-muted/60 text-muted-foreground"}`}>
                      {col.type === "period" ? `الحصة ${col.val}` : "استراحة"}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((d: string) => (
                  <tr key={d}>
                    <th className="rounded-xl bg-muted/40 px-3 py-3 text-sm font-extrabold text-foreground">{d}</th>
                    {layoutColumns.map((col, idx) => {
                      if (col.type === "break") {
                        if (d === DAYS[0]) {
                          return (
                            <td key={idx} rowSpan={DAYS.length} className="rounded-xl bg-amber-50 border border-amber-200/50 p-2 text-center align-middle relative overflow-hidden">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="font-black text-amber-600/70 text-lg tracking-widest whitespace-nowrap" style={{writingMode: "vertical-rl"}}>{col.val}</span>
                              </div>
                            </td>
                          );
                        }
                        return null;
                      }

                      const p = col.val as number;
                      const slot = getSlot(d, p);
                      return (
                        <td 
                          key={idx}
                          onClick={() => handleCellClick(d, p)}
                          className={`
                            h-24 min-w-[120px] rounded-xl border p-2 text-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-95 shadow-sm
                            ${slot 
                              ? "border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50" 
                              : "border-dashed border-border bg-background hover:bg-accent hover:border-primary/50"
                            }
                          `}
                        >
                          {slot ? (
                            <div className="flex flex-col h-full justify-center space-y-1.5 text-center">
                              <div className="font-bold text-primary text-[13px] bg-primary/10 rounded px-1 py-0.5 mx-auto">
                                {activeStageSubjects.find((s) => s.id === slot.subjectId)?.name || "مادة محذوفة"}
                              </div>
                              <div className="truncate font-medium text-foreground opacity-90 text-[11px]">
                                {activeStageStaff.find((t) => t.id === slot.teacherId)?.name || "معلم محذوف"}
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center text-muted-foreground/60 gap-1 opacity-0 hover:opacity-100 transition-opacity">
                              <span className="text-[10px] font-bold">+ أضف حصة</span>
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
        </PageCard>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-3xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border/60 sticky top-0 bg-card/98 dark:bg-card/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-foreground">إعدادات الجدول المدرسي</h2>
                  <p className="text-xs text-muted-foreground">ضبط أيام الدراسة، الحصص اليومية، وفترات الفسحة والراحة</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Conflict Prevention */}
              <div className="flex items-center justify-between bg-primary/5 border border-primary/20 p-4 rounded-2xl">
                <div>
                  <h3 className="font-extrabold text-sm mb-0.5 text-foreground">نظام منع التعارض التلقائي</h3>
                  <p className="text-xs text-muted-foreground">يمنع تعيين معلم في حصة إذا كان لديه حصة في شعبة أخرى بنفس الوقت</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={tempSettings.preventConflicts} onChange={(e) => setTempSettings({...tempSettings, preventConflicts: e.target.checked})} />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Study Days */}
              <div>
                <h3 className="font-extrabold text-sm mb-3 border-b border-border/60 pb-2 text-foreground">أيام الدوام الأسبوعي</h3>
                <div className="flex flex-wrap gap-2.5">
                  {ALL_DAYS.map((day: any) => {
                    const isChecked = tempSettings.studyDays.includes(day);
                    return (
                      <label key={day} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl cursor-pointer transition-all border select-none ${
                        isChecked 
                          ? "bg-primary/10 border-primary/30 text-primary font-bold shadow-xs" 
                          : "bg-muted/30 border-border/60 text-muted-foreground hover:bg-accent"
                      }`}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={(e: any) => {
                            const checked = e.target.checked;
                            setTempSettings(prev => ({
                              ...prev,
                              studyDays: checked 
                                ? ALL_DAYS.filter(d => prev.studyDays.includes(d) || d === day)
                                : prev.studyDays.filter(d => d !== day)
                            }));
                          }}
                          className="h-4 w-4 rounded-md border-input text-primary focus:ring-primary/20 cursor-pointer"
                        />
                        <span className="text-xs font-semibold">{day}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Periods Count */}
              <div>
                <h3 className="font-extrabold text-sm mb-3 border-b border-border/60 pb-2 text-foreground">عدد الحصص اليومي</h3>
                <div className="flex items-center gap-3 max-w-xs">
                  <input 
                    type="number" 
                    min={3} 
                    max={10} 
                    value={tempSettings.periodsCount}
                    onChange={(e: any) => setTempSettings((prev: any) => ({...prev, periodsCount: parseInt(e.target.value) || 7}))}
                    className="w-28 h-11 rounded-xl border border-input bg-background/80 px-3.5 focus:border-primary focus:ring-4 focus:ring-primary/15 font-black text-center tabular-nums text-foreground outline-none transition-all"
                  />
                  <span className="text-muted-foreground font-semibold text-xs whitespace-nowrap">حصص دراسية يومياً</span>
                </div>
              </div>

              {/* Breaks */}
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2">
                  <h3 className="font-extrabold text-sm text-foreground">فترات الاستراحة (الفسحة)</h3>
                  <button 
                    onClick={() => setTempSettings({...tempSettings, breaks: [...tempSettings.breaks, {afterPeriod: 1, name: "استراحة"}]})}
                    className="text-xs font-bold text-primary flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 active:scale-[0.98] transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" /> إضافة استراحة
                  </button>
                </div>
                
                {tempSettings.breaks.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">لا توجد استراحات محددة في الجدول.</p>
                ) : (
                  <div className="space-y-2.5">
                    {tempSettings.breaks.map((brk: any, idx: number) => (
                      <div key={idx} className="flex gap-3 items-end bg-muted/30 dark:bg-muted/15 p-3.5 rounded-2xl border border-border/60">
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-foreground/85 mb-1.5 block">اسم الاستراحة</label>
                          <input 
                            type="text" 
                            value={brk.name}
                            onChange={(e) => {
                              const newBreaks = [...tempSettings.breaks];
                              newBreaks[idx].name = e.target.value;
                              setTempSettings({...tempSettings, breaks: newBreaks});
                            }}
                            className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-semibold focus:border-primary focus:ring-4 focus:ring-primary/15 outline-none transition-all text-foreground"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-foreground/85 mb-1.5 block">مكان الاستراحة (بعد الحصة)</label>
                          <select 
                            value={brk.afterPeriod}
                            onChange={(e) => {
                              const newBreaks = [...tempSettings.breaks];
                              newBreaks[idx].afterPeriod = parseInt(e.target.value);
                              setTempSettings({...tempSettings, breaks: newBreaks});
                            }}
                            className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-semibold focus:border-primary focus:ring-4 focus:ring-primary/15 outline-none transition-all text-foreground cursor-pointer"
                          >
                            {Array.from({length: tempSettings.periodsCount}).map((_: any, i: number) => (
                              <option key={i+1} value={i+1}>بعد الحصة {i+1}</option>
                            ))}
                          </select>
                        </div>
                        <button 
                          onClick={() => {
                            const newBreaks = tempSettings.breaks.filter((_: any, i: number) => i !== idx);
                            setTempSettings({...tempSettings, breaks: newBreaks});
                          }}
                          className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white active:scale-95 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 pt-4 border-t border-border/60 bg-card/98 dark:bg-card/95 flex justify-end gap-2.5 rounded-b-3xl">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="h-11 px-5 rounded-xl border border-input bg-background/80 hover:bg-accent text-xs font-semibold active:scale-[0.98] transition-all"
              >
                إلغاء
              </button>
              <button 
                onClick={saveSettings}
                className="h-11 px-7 rounded-xl text-xs font-extrabold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md glow-primary flex items-center gap-2"
              >
                <Save className="h-4 w-4" /> حفظ الإعدادات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slot Assignment Modal */}
      {modalOpen && editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
          <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/60">
              <div>
                <h2 className="text-base font-extrabold text-foreground">تعديل حصة الجدول</h2>
                <p className="text-xs text-muted-foreground">إسناد المادة والمعلم لهذه الحصة</p>
              </div>
              <button 
                onClick={() => setModalOpen(false)} 
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="mb-5 flex flex-wrap gap-2">
              <Badge tone="primary">{editingSlot.day}</Badge>
              <Badge tone="info">الحصة {editingSlot.period}</Badge>
              <Badge tone="neutral">{targetSection?.grade} - {targetSection?.name}</Badge>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground/85">المادة الدراسية <span className="text-destructive">*</span></label>
                <select
                  required
                  className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all cursor-pointer"
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                >
                  <option value="" disabled>-- اختر المادة --</option>
                  {activeStageSubjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground/85">المعلم المكلف <span className="text-destructive">*</span></label>
                <select
                  required
                  className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all cursor-pointer"
                  value={selectedTeacher}
                  onChange={e => setSelectedTeacher(e.target.value)}
                >
                  <option value="" disabled>-- اختر المعلم --</option>
                  {teachers.map(t => {
                    const busy = isTeacherBusy(t.id, editingSlot.day, editingSlot.period);
                    return (
                      <option key={t.id} value={t.id} disabled={!!busy} className={busy ? "text-destructive" : ""}>
                        {t.name} {busy ? `(${busy})` : ""}
                      </option>
                    );
                  })}
                </select>
                {selectedTeacher && isTeacherBusy(selectedTeacher, editingSlot.day, editingSlot.period) && (
                  <p className="mt-2 text-xs text-destructive flex items-center gap-1.5 font-bold">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> المعلم المختار لديه تعارض في هذا الوقت.
                  </p>
                )}
              </div>

              <div className="pt-4 mt-2 border-t border-border/60 flex justify-between items-center">
                <button 
                  type="button" 
                  onClick={handleClearSlot}
                  className="h-11 rounded-xl px-4 text-xs font-bold text-destructive hover:bg-destructive/10 active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" /> إفراغ الحصة
                </button>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setModalOpen(false)} 
                    className="h-11 rounded-xl px-4 text-xs font-semibold border border-input bg-background/80 hover:bg-accent active:scale-[0.98] transition-all"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit" 
                    disabled={!!(selectedTeacher && isTeacherBusy(selectedTeacher, editingSlot.day, editingSlot.period))}
                    className="h-11 rounded-xl bg-primary px-6 text-xs font-extrabold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    حفظ
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        data={activeStageScheduleSlots}
        templates={printTemplates} 
      />
    </AppShell>
  );
}
