import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { SearchableSelect } from "@/components/searchable-select";
import { Trash2, X, AlertCircle, Printer } from "lucide-react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [{ title: "الجدول الأسبوعي | منصة مدارس" }, { name: "description", content: "إدارة الجدول الأسبوعي الفعلي" }],
  }),
  component: SchedulePage,
});

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

function SchedulePage() {
  const { stage, getStageLabel } = useStage();
  const { 
    activeStageSections, 
    activeStageStaff, 
    activeStageSubjects, 
    activeStageScheduleSlots, 
    updateScheduleSlot, 
    clearScheduleSlot 
  } = useGlobalStore();

  const [targetSectionId, setTargetSectionId] = useState<string>(activeStageSections[0]?.id || "");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{day: string, period: number} | null>(null);
  
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const teachers = activeStageStaff.filter(s => s.role.includes("معلم") || s.role.includes("مربي"));

  const targetSection = activeStageSections.find(s => s.id === targetSectionId);

  const sectionsList = useMemo(() => activeStageSections
    .map(s => ({ id: s.id, title: `شعبة ${s.name}`, subtitle: s.grade })), [activeStageSections]);

  const getSlot = (day: string, period: number) => {
    return activeStageScheduleSlots.find(s => s.sectionId === targetSectionId && s.day === day && s.period === period);
  };

  const isTeacherBusy = (teacherId: string, day: string, period: number) => {
    const slot = activeStageScheduleSlots.find(s => s.teacherId === teacherId && s.day === day && s.period === period);
    if (slot && slot.sectionId !== targetSectionId) {
      const sec = activeStageSections.find(sec => sec.id === slot.sectionId);
      return `مشغول في: ${sec?.grade} - ${sec?.name}`;
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
          { key: "hideEmptyPeriods", label: "إخفاء الحصص الفارغة تماماً", type: "toggle", defaultValue: false },
          { key: "customTitle", label: "الجهة الموجه إليها", type: "select", options: [{label: "الطلاب", value: "students"}, {label: "المعلمين", value: "teachers"}], defaultValue: "students" }
        ],
        renderDocument: (options) => {
          const hideTeachers = options.customOptions.hideTeachers;
          
          return (
            <div className="border-4 border-double border-gray-600 p-6 rounded-2xl bg-white shadow-sm text-black">
              <div className="text-center mb-8 border-b-2 border-gray-400 pb-6">
                <h1 className="text-3xl font-black mb-2">الجدول الأسبوعي للدرصص ({options.customOptions.customTitle === "students" ? "نسخة الطلاب" : "نسخة الإدارة"})</h1>
                <div className="flex justify-center gap-6 mt-4 font-bold text-lg text-gray-700">
                  <span className="bg-gray-100 px-4 py-1 rounded-full border border-gray-300">المرحلة: {getStageLabel(stage)}</span>
                  <span className="bg-gray-100 px-4 py-1 rounded-full border border-gray-300">الصف: {targetSection.grade}</span>
                  <span className="bg-gray-100 px-4 py-1 rounded-full border border-gray-300">شعبة: {targetSection.name}</span>
                </div>
              </div>
              
              <table className="w-full border-collapse border-2 border-gray-800 text-center" dir="rtl">
                <thead>
                  <tr>
                    <th className="border-2 border-gray-800 bg-gray-200 p-3 w-32 font-black text-black">اليوم \ الحصة</th>
                    {PERIODS.map(p => (
                      <th key={p} className="border-2 border-gray-800 bg-gray-100 p-3 font-bold text-black">الحصة {p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map(d => (
                    <tr key={d}>
                      <td className="border-2 border-gray-800 bg-gray-100 p-3 font-black text-black">{d}</td>
                      {PERIODS.map(p => {
                        const slot = getSlot(d, p);
                        if (!slot) return <td key={p} className="border border-gray-400 bg-white p-2"></td>;
                        const sub = activeStageSubjects.find((s) => s.id === slot.subjectId)?.name || "مادة محذوفة";
                        const tchr = activeStageStaff.find((t) => t.id === slot.teacherId)?.name || "معلم محذوف";
                        return (
                          <td key={p} className="border border-gray-400 p-2 align-middle bg-gray-50">
                            <div className="font-bold text-sm mb-1">{sub}</div>
                            {!hideTeachers && <div className="text-xs text-gray-600 font-medium">{tchr}</div>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="mt-8 flex justify-between text-sm font-bold text-gray-500 border-t border-dashed border-gray-300 pt-4">
                <span>طبع بواسطة: نظام مدارس</span>
                <span>تاريخ الطباعة: {new Date().toLocaleDateString("ar-SA")}</span>
              </div>
            </div>
          );
        }
      }
    ];
  }, [targetSection, stage, getStageLabel, activeStageScheduleSlots, activeStageSubjects, activeStageStaff]);


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
        <button
          onClick={() => setIsPrintOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
        >
          <Printer className="h-4 w-4" /> طباعة الجدول
        </button>
      }
    >
      <div className="space-y-5 animate-in fade-in duration-500">
        <PageCard>
          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
            <div className="flex-1 w-full md:max-w-sm">
              <label className="block text-sm font-bold text-muted-foreground mb-1.5 px-1">اختر الشعبة لإدارة جدولها</label>
              <SearchableSelect 
                value={targetSectionId} 
                onChange={(v) => setTargetSectionId(v)}
                options={sectionsList}
                placeholder="-- ابحث عن شعبة --"
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge tone="info">نظام منع التعارض الفعال قيد التشغيل</Badge>
            </div>
          </div>
        </PageCard>

        <PageCard title={`الجدول الفعلي: ${targetSection?.grade} - شعبة ${targetSection?.name}`} description={`المرحلة: ${getStageLabel(stage)}`}>
          <div className="overflow-x-auto pb-4">
            <table className="w-full min-w-[900px] border-separate border-spacing-1.5">
              <thead>
                <tr>
                  <th className="rounded-xl bg-muted/60 px-3 py-3 text-sm text-muted-foreground w-28">اليوم / الحصة</th>
                  {PERIODS.map((p) => (
                    <th key={p} className="rounded-xl bg-muted/60 px-3 py-3 text-sm text-muted-foreground font-bold">
                      الحصة {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((d) => (
                  <tr key={d}>
                    <th className="rounded-xl bg-muted/40 px-3 py-3 text-sm font-extrabold text-foreground">{d}</th>
                    {PERIODS.map((p) => {
                      const slot = getSlot(d, p);
                      return (
                        <td 
                          key={p}
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

      {/* Slot Assignment Modal */}
      {modalOpen && editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-primary">تعديل الحصة</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-full p-2 hover:bg-accent transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6 flex gap-2">
              <Badge tone="primary">{editingSlot.day}</Badge>
              <Badge tone="info">الحصة {editingSlot.period}</Badge>
              <Badge tone="neutral">{targetSection?.grade} - {targetSection?.name}</Badge>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">المادة الدراسية *</label>
                <select
                  required
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold"
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
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">المعلم *</label>
                <select
                  required
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold"
                  value={selectedTeacher}
                  onChange={e => setSelectedTeacher(e.target.value)}
                >
                  <option value="" disabled>-- اختر المعلم --</option>
                  {teachers.map(t => {
                    const busy = isTeacherBusy(t.id, editingSlot.day, editingSlot.period);
                    return (
                      <option key={t.id} value={t.id} disabled={!!busy} className={busy ? "text-danger" : ""}>
                        {t.name} {busy ? `(${busy})` : ""}
                      </option>
                    );
                  })}
                </select>
                {selectedTeacher && isTeacherBusy(selectedTeacher, editingSlot.day, editingSlot.period) && (
                  <p className="mt-2 text-xs text-danger flex items-center gap-1 font-bold">
                    <AlertCircle className="h-3 w-3" /> المعلم المختار لديه تعارض في هذا الوقت.
                  </p>
                )}
              </div>

              <div className="pt-5 mt-2 border-t border-border/50 flex justify-between items-center">
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={handleClearSlot}
                    className="rounded-xl px-4 py-2.5 font-bold text-danger hover:bg-danger/10 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> إفراغ
                  </button>
                  {getSlot(editingSlot.day, editingSlot.period) && (
                    <a 
                      href="/attendance/take"
                      className="rounded-xl px-4 py-2.5 font-bold text-info hover:bg-info/10 transition-colors flex items-center gap-2"
                    >
                      رصد الحضور
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl px-4 py-2.5 font-bold hover:bg-accent transition-colors"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit" 
                    disabled={!!(selectedTeacher && isTeacherBusy(selectedTeacher, editingSlot.day, editingSlot.period))}
                    className="rounded-xl bg-primary px-6 py-2.5 font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
