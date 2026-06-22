import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { Star, Plus, UserCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/hr/evaluations")({
  head: () => ({ meta: [{ title: "تقييم الأداء | منصة مدارس" }] }),
  component: EvaluationsPage,
});

function EvaluationsPage() {
  const { allStaff, allStaffEvaluations, addStaffEvaluation } = useGlobalStore();
  const [showAdd, setShowAdd] = useState(false);
  const activeStaff = allStaff.filter(s => !s.isDeleted && s.status === "active");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const staffId = formData.get("staffId") as string;
    const staff = activeStaff.find(s => s.id === staffId);
    
    if (!staff) return;

    const commitment = Number(formData.get("commitment"));
    const performance = Number(formData.get("performance"));
    const cooperation = Number(formData.get("cooperation"));
    const creativity = Number(formData.get("creativity"));
    
    const overallScore = (commitment + performance + cooperation + creativity) / 4;

    addStaffEvaluation({
      staffId,
      staffName: staff.name,
      period: formData.get("period") as string,
      evaluator: formData.get("evaluator") as string,
      date: new Date().toISOString().split("T")[0],
      criteria: { commitment, performance, cooperation, creativity },
      overallScore,
      notes: formData.get("notes") as string,
    });
    
    toast.success("تم إضافة التقييم بنجاح");
    setShowAdd(false);
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className={`h-3 w-3 ${s <= score ? "text-warning fill-warning" : "text-muted-foreground/30"}`} />
        ))}
        <span className="text-xs font-bold ml-2 text-muted-foreground">{score.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "شؤون الموظفين" }, { label: "تقييم الأداء" }]}
      actions={
        <button onClick={() => setShowAdd(true)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> تقييم جديد
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="bg-warning/10 text-warning p-3 rounded-xl">
            <Star className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">تقييم أداء الموظفين</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">إدارة التقييمات الدورية للكادر التعليمي والإداري</p>
          </div>
        </div>

        {showAdd && (
          <PageCard title="إضافة تقييم أداء جديد" className="border-primary/20 bg-primary/5">
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">الموظف</label>
                  <select name="staffId" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                    <option value="">اختر الموظف...</option>
                    {activeStaff.map(s => (
                      <option key={s.id} value={s.id}>{s.name} - {s.role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">الفترة التقييمية</label>
                  <input name="period" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" placeholder="مثال: الفصل الدراسي الأول" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">المُقيِّم</label>
                  <input name="evaluator" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" placeholder="اسم المقيم / المدير" />
                </div>
              </div>

              <div className="bg-card p-4 rounded-xl border border-border space-y-4">
                <h3 className="font-bold text-sm">معايير التقييم (من 1 إلى 5)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">الالتزام والانضباط</label>
                    <input name="commitment" type="number" min="1" max="5" step="1" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">الأداء المهني والإنجاز</label>
                    <input name="performance" type="number" min="1" max="5" step="1" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">التعاون مع الفريق</label>
                    <input name="cooperation" type="number" min="1" max="5" step="1" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">المبادرة والإبداع</label>
                    <input name="creativity" type="number" min="1" max="5" step="1" required className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">ملاحظات وتوصيات (اختياري)</label>
                <textarea name="notes" className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" rows={3}></textarea>
              </div>

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-bold text-muted-foreground bg-muted/50 rounded-lg hover:bg-muted">إلغاء</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90">حفظ التقييم</button>
              </div>
            </form>
          </PageCard>
        )}

        <PageCard>
          <DataTable
            rows={allStaffEvaluations}
            columns={[
              { key: "staff", header: "الموظف", cell: (r) => (
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary p-1.5 rounded-md">
                    <UserCircle2 className="h-4 w-4" />
                  </div>
                  <div className="font-bold">{r.staffName}</div>
                </div>
              )},
              { key: "period", header: "الفترة", cell: (r) => r.period },
              { key: "evaluator", header: "المُقيّم", cell: (r) => r.evaluator },
              { key: "date", header: "تاريخ التقييم", cell: (r) => <span className="text-xs tabular">{r.date}</span> },
              { key: "score", header: "الدرجة الكلية", cell: (r) => (
                <div className="flex flex-col gap-1">
                  {renderStars(r.overallScore)}
                </div>
              )},
              { key: "status", header: "المستوى", cell: (r) => (
                <Badge tone={r.overallScore >= 4.5 ? "success" : r.overallScore >= 3.5 ? "primary" : r.overallScore >= 2.5 ? "warning" : "danger"}>
                  {r.overallScore >= 4.5 ? "ممتاز" : r.overallScore >= 3.5 ? "جيد جداً" : r.overallScore >= 2.5 ? "جيد" : "ضعيف"}
                </Badge>
              )}
            ]}
            empty="لا توجد تقييمات مسجلة"
          />
        </PageCard>
      </div>
    </AppShell>
  );
}
