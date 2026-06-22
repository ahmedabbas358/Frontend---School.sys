import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";

export const Route = createFileRoute("/teachers/$id")({
  component: TeacherProfile,
});

const TABS = ["personal", "subjects", "sections", "schedule", "stats"] as const;
const TL: Record<(typeof TABS)[number], string> = {
  personal: "البيانات الشخصية",
  subjects: "المواد",
  sections: "الشُعب",
  schedule: "الجدول",
  stats: "إحصائيات",
};

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

function TeacherProfile() {
  const { id } = Route.useParams();
  const { activeStageStaff, activeStageSubjects, activeStageSections } = useGlobalStore();
  
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

  const assignedSubjects = (t.subjects || []).map(sid => activeStageSubjects.find(s => s.id === sid)).filter(Boolean);
  const assignedSections = (t.sections || []).map(sid => activeStageSections.find(s => s.id === sid)).filter(Boolean);

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
          <PageCard title="الجدول الأسبوعي (تجريبي)">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[800px] text-center text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground">
                    <th className="px-3 py-4 font-bold border border-border/50 rounded-tr-xl">اليوم / الحصة</th>
                    {PERIODS.map((p) => <th key={p} className="px-3 py-4 font-bold border border-border/50">الحصة {p}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((d, di) => (
                    <tr key={d} className="border-t border-border group hover:bg-muted/20 transition-colors">
                      <th className="bg-muted/30 px-3 py-4 font-black border border-border/50">{d}</th>
                      {PERIODS.map((p) => {
                        const has = (di + p) % 4 === 0 && assignedSubjects.length > 0;
                        const subj = has ? assignedSubjects[0] : null;
                        return (
                          <td key={p} className="px-2 py-3 border border-border/50 transition-colors">
                            {has ? (
                              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all">
                                <span className="font-bold text-xs">{subj?.name || "مادة"}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/30 font-bold">—</span>
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
        )}

        {tab === "stats" && (
          <div className="grid gap-5 md:grid-cols-3">
            <PageCard title="معدل الحضور" className="text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl font-black tabular-nums text-success mt-2 mb-1">٩٨٪</div>
              <div className="text-xs text-muted-foreground font-bold">خلال الفصل الدراسي الحالي</div>
            </PageCard>
            <PageCard title="الحصص الأسبوعية" className="text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl font-black tabular-nums text-primary mt-2 mb-1">١٨</div>
              <div className="text-xs text-muted-foreground font-bold">من أصل ٢٤ حصة (الحد الأقصى)</div>
            </PageCard>
            <PageCard title="نسبة إنجاز المنهج" className="text-center hover:shadow-lg transition-shadow">
              <div className="text-4xl font-black tabular-nums text-warning mt-2 mb-1">٧٢٪</div>
              <div className="text-xs text-muted-foreground font-bold">حسب الخطة الزمنية المعتمدة</div>
            </PageCard>
          </div>
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
