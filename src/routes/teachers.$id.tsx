import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";

export const Route = createFileRoute("/teachers/$id")({
  component: TeacherProfile,
});

const TABS = ["personal", "subjects", "sections", "schedule", "stats", "history"] as const;
const TL: Record<(typeof TABS)[number], string> = {
  personal: "البيانات الشخصية",
  subjects: "المواد",
  sections: "الشُعب",
  schedule: "الجدول",
  stats: "إحصائيات",
  history: "السجل التاريخي",
};

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

function TeacherProfile() {
  const { id } = Route.useParams();
  const { activeStageStaff, activeStageSubjects, activeStageSections, allStaff, allAcademicYears, activeStageTeachingAssignments, activeStageScheduleSlots, allEmployeeAssignments, currentAcademicYearId } = useGlobalStore();
  
  const [tab, setTab] = useState<(typeof TABS)[number]>("personal");

  const t = useMemo(() => activeStageStaff.find(s => s.id === id), [activeStageStaff, id]);

  if (!t) {
    return (
      <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "المعلمون", to: "/teachers" }]} title="غير موجود">
        <div className="flex flex-col items-center justify-center p-20 text-center">
          <h2 className="text-2xl font-bold mb-2">المعلم غير موجود</h2>
          <p className="text-muted-foreground mb-4">لم يتم العثور على المعلم المطلوب، قد يكون تم حذفه أو نقله.</p>
          <Link to="/teachers" className="text-primary hover:underline font-bold">العودة لقائمة المعلمين</Link>
        </div>
      </AppShell>
    );
  }

  // Get Real Assignments from Store
  const teacherAssignments = useMemo(() => activeStageTeachingAssignments.filter(a => a.teacherId === id), [activeStageTeachingAssignments, id]);
  
  // Extract unique subjects and sections from assignments
  const assignedSubjects = useMemo(() => {
    const subjectIds = Array.from(new Set(teacherAssignments.map(a => a.subjectId)));
    return subjectIds.map(sid => activeStageSubjects.find(s => s.id === sid)).filter(Boolean);
  }, [teacherAssignments, activeStageSubjects]);

  const assignedSections = useMemo(() => {
    const sectionIds = Array.from(new Set(teacherAssignments.map(a => a.sectionId)));
    return sectionIds.map(sid => activeStageSections.find(s => s.id === sid)).filter(Boolean);
  }, [teacherAssignments, activeStageSections]);

  // Get Real Schedule Slots
  const teacherSlots = useMemo(() => activeStageScheduleSlots.filter(s => s.teacherId === id), [activeStageScheduleSlots, id]);

  const staffHistory = useMemo(() => {
    if (!t) return [];
    return allEmployeeAssignments
      .filter((a: any) => a.employeeId === t.id)
      .sort((a: any, b: any) => {
        return 0;
      });
  }, [t, allEmployeeAssignments]);

  return (
    <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "المعلمون", to: "/teachers" }, { label: t.name }]}>
      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm relative overflow-hidden glass">
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -ml-16 -mt-16 pointer-events-none"></div>
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-6 relative z-10">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-primary/10 text-3xl font-extrabold text-primary shadow-inner">
              {t.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-black">{t.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-bold">
                <span className="tabular-nums">{t.employeeNo || "بدون رقم وظيفي"}</span>
                <span className="h-4 w-px bg-border"></span>
                <span>{t.role}</span>
                <span className="h-4 w-px bg-border"></span>
                <Badge tone={t.status === "active" ? "success" : t.status === "on_leave" ? "warning" : "danger"}>
                  {t.status === "active" ? "نشط" : t.status === "on_leave" ? "إجازة" : "غير نشط"}
                </Badge>
              </div>
            </div>
            <div className="hidden text-center md:flex gap-6 bg-background/50 p-4 rounded-2xl border border-border/50">
              <div>
                <div className="text-xs text-muted-foreground font-bold mb-1">الشُعب المخصصة</div>
                <div className="text-2xl font-black tabular-nums">{assignedSections.length}</div>
              </div>
              <div className="w-px bg-border"></div>
              <div>
                <div className="text-xs text-muted-foreground font-bold mb-1">المواد</div>
                <div className="text-2xl font-black tabular-nums">{assignedSubjects.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-border pb-px">
          {TABS.map((k) => (
            <button key={k} onClick={() => setTab(k)} className={`relative px-5 py-3 text-sm font-bold transition-colors hover:bg-accent/50 rounded-t-xl ${tab === k ? "text-primary bg-accent/30" : "text-muted-foreground"}`}>
              {TL[k]}
              {tab === k && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary rounded-t-full" />}
            </button>
          ))}
        </div>

        {tab === "personal" && (
          <PageCard title="البيانات الشخصية">
            <dl className="grid gap-6 md:grid-cols-3 text-sm">
              <Field k="الاسم الرباعي" v={t.name} />
              <Field k="الرقم الوظيفي" v={t.employeeNo || "-"} />
              <Field k="رقم الجوال" v={<span dir="ltr">{t.phone || "-"}</span>} />
              <Field k="البريد الإلكتروني" v={<span dir="ltr">{t.email || "-"}</span>} />
              <Field k="القسم" v={t.department} />
              <Field k="الحالة" v={t.status === "active" ? "نشط" : t.status === "on_leave" ? "إجازة" : "غير نشط"} />
            </dl>
          </PageCard>
        )}

        {tab === "subjects" && (
          <PageCard title="المواد المسندة">
            {assignedSubjects.length === 0 ? (
              <p className="text-muted-foreground font-bold text-sm">لم يتم إسناد أي مواد لهذا المعلم.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {assignedSubjects.map((sub: any) => (
                  <Badge key={sub.id} tone="primary" className="text-sm px-4 py-2">{sub.name}</Badge>
                ))}
              </div>
            )}
          </PageCard>
        )}

        {tab === "sections" && (
          <PageCard title="الشُعب المسندة">
            {assignedSections.length === 0 ? (
              <p className="text-muted-foreground font-bold text-sm">لم يتم إسناد أي شُعب لهذا المعلم.</p>
            ) : (
              <ul className="grid gap-3 md:grid-cols-3">
                {assignedSections.map((sec: any) => (
                  <li key={sec.id} className="rounded-xl border border-border/50 bg-background/50 p-4 text-sm flex flex-col hover:border-primary/50 transition-colors">
                    <span className="font-black text-lg mb-1">{sec.grade}</span>
                    <span className="text-muted-foreground font-bold">شعبة {sec.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </PageCard>
        )}

        {tab === "schedule" && (
          <PageCard title="الجدول الأسبوعي الفعلي">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[900px] text-center text-sm border-collapse bg-card rounded-xl overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-primary/5 text-primary">
                    <th className="px-3 py-4 font-black border-b border-l border-primary/10">اليوم / الحصة</th>
                    {PERIODS.map((p) => <th key={p} className="px-3 py-4 font-black border-b border-l border-primary/10 last:border-l-0">الحصة {p}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((d) => (
                    <tr key={d} className="border-b border-border group hover:bg-muted/10 transition-colors last:border-b-0">
                      <th className="bg-muted/30 px-3 py-4 font-black border-l border-border/50">{d}</th>
                      {PERIODS.map((p) => {
                        const slot = teacherSlots.find(s => s.day === d && s.period === p);
                        const subj = slot ? activeStageSubjects.find(s => s.id === slot.subjectId) : null;
                        const sec = slot ? activeStageSections.find(s => s.id === slot.sectionId) : null;
                        return (
                          <td key={p} className="p-2 border-l border-border/50 transition-colors last:border-l-0">
                            {slot ? (
                              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-primary/10 border border-primary/20 shadow-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all group-hover:scale-105 duration-200">
                                <span className="font-black text-sm mb-1">{subj?.name || "مادة"}</span>
                                <Badge tone="primary" className="text-[10px] py-0">{sec?.grade} / {sec?.name}</Badge>
                              </div>
                            ) : (
                              <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-muted-foreground/30 font-bold text-xs">— فارغ —</span>
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
            <div className="mt-4 flex gap-4 text-xs font-bold text-muted-foreground justify-center">
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary/20 block"></span> حصة مسندة</div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-muted block"></span> وقت فراغ</div>
            </div>
          </PageCard>
        )}

        {tab === "stats" && (
          <div className="grid gap-6 md:grid-cols-3">
            <PageCard title="معدل الحضور" className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-5xl font-black tabular-nums text-success mt-4 mb-2 relative z-10">٩٨٪</div>
              <div className="text-sm text-muted-foreground font-bold relative z-10">خلال الفصل الدراسي الحالي</div>
            </PageCard>
            <PageCard title="النصاب الأسبوعي" className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-5xl font-black tabular-nums text-primary mt-4 mb-2 relative z-10">{teacherSlots.length}</div>
              <div className="text-sm text-muted-foreground font-bold relative z-10">حصة من أصل ٢٤ (الحد الأقصى)</div>
              <div className="w-full bg-muted rounded-full h-2 mt-4 relative z-10">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${(teacherSlots.length / 24) * 100}%` }}></div>
              </div>
            </PageCard>
            <PageCard title="نسبة إنجاز المنهج" className="text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="text-5xl font-black tabular-nums text-warning mt-4 mb-2 relative z-10">٧٢٪</div>
              <div className="text-sm text-muted-foreground font-bold relative z-10">متوسط الإنجاز عبر الشعب</div>
            </PageCard>
          </div>
        )}

        {tab === "history" && (
          <PageCard title="السجل التاريخي والأرشيف">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-4 font-bold rounded-tr-lg">العام الدراسي</th>
                    <th className="p-4 font-bold">المسمى الوظيفي</th>
                    <th className="p-4 font-bold">القسم</th>
                    <th className="p-4 font-bold rounded-tl-lg">حالة العمل</th>
                  </tr>
                </thead>
                <tbody>
                  {staffHistory.map((hist: any) => {
                    const yearName = allAcademicYears.find(y => y.id === hist.academicYearId)?.name || "غير محدد";
                    const isCurrentRecord = hist.academicYearId === currentAcademicYearId;
                    return (
                      <tr key={hist.id} className={`border-b border-border transition-colors ${isCurrentRecord ? 'bg-primary/5 font-bold' : 'hover:bg-accent/30'}`}>
                        <td className="p-4 font-bold text-primary">{yearName} {isCurrentRecord && <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full mr-2">الحالي</span>}</td>
                        <td className="p-4">{hist.role}</td>
                        <td className="p-4">{hist.department}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${hist.status === "active" ? "bg-success/10 text-success" : hist.status === "on_leave" ? "bg-warning/10 text-warning" : "bg-danger/10 text-danger"}`}>
                            {hist.status === "active" ? "على رأس العمل" : hist.status === "on_leave" ? "إجازة" : "منتهي الخدمات"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">يتم تجميع هذا السجل آلياً بناءً على الرقم الوظيفي للمعلم عبر جميع السنوات الدراسية.</p>
          </PageCard>
        )}
      </div>
    </AppShell>
  );
}

function Field({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="bg-background/50 border border-border/50 p-4 rounded-xl">
      <dt className="text-xs text-muted-foreground font-bold mb-1.5">{k}</dt>
      <dd className="font-bold text-foreground text-base">{v}</dd>
    </div>
  );
}
