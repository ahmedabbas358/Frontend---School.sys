import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore, StaffEvaluation } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { 
  Star, Plus, UserCircle2, Search, Printer, Edit2, 
  Trash2, X, Award, CheckCircle2, AlertTriangle, FileText, 
  Sparkles, QrCode, TrendingUp, User, ShieldCheck
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/hr/evaluations")({
  head: () => ({ meta: [{ title: "تقييم أداء الكوادر والموظفين | منصة مدارس" }] }),
  component: EvaluationsPage,
});

function getRatingLevel(score: number): { label: string; tone: "success" | "primary" | "warning" | "danger" } {
  if (score >= 4.5) return { label: "ممتاز (أداء استثنائي)", tone: "success" };
  if (score >= 4.0) return { label: "جيد جداً (كفاءة عالية)", tone: "primary" };
  if (score >= 3.5) return { label: "جيد (يلبي المعايير)", tone: "warning" };
  return { label: "بحاجة لمتابعة وتطوير", tone: "danger" };
}

function EvaluationsPage() {
  const { 
    activeStageStaff, 
    allStaffEvaluations, 
    addStaffEvaluation, 
    updateStaffEvaluation, 
    deleteStaffEvaluation 
  } = useGlobalStore();
  const { stage, getStageLabel } = useStage();

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<StaffEvaluation | null>(null);
  const [printEvaluation, setPrintEvaluation] = useState<StaffEvaluation | null>(null);
  const [deleteEvalId, setDeleteEvalId] = useState<string | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");

  // Form State
  const [formState, setFormState] = useState({
    staffId: "",
    period: "الفصل الدراسي الأول",
    evaluator: "د. عبد الرحمن (مدير الشؤون الأكاديمية)",
    commitment: 5,
    performance: 5,
    cooperation: 4,
    creativity: 4,
    notes: "أداء متميز وتفانٍ مستمر في إنجاز الحصص والتفاعل الإيجابي مع الطلاب والإدارة.",
    recommendations: "التوصية بمنح مكافأة تميز وإسناد مهام إشرافية إضافية.",
  });

  const activeStaff = useMemo(() => activeStageStaff.filter(s => !s.isDeleted && s.status !== "terminated"), [activeStageStaff]);
  const activeStaffIds = useMemo(() => new Set(activeStaff.map(item => item.id)), [activeStaff]);

  const scopedEvaluations = useMemo(() => {
    return allStaffEvaluations
      .filter(item => activeStaffIds.has(item.staffId))
      .filter(item => {
        if (levelFilter === "excellent") return item.overallScore >= 4.5;
        if (levelFilter === "very_good") return item.overallScore >= 4.0 && item.overallScore < 4.5;
        if (levelFilter === "good") return item.overallScore >= 3.5 && item.overallScore < 4.0;
        if (levelFilter === "needs_review") return item.overallScore < 3.5;
        return true;
      })
      .filter(item => periodFilter === "all" || item.period === periodFilter)
      .filter(item => {
        if (!q.trim()) return true;
        const term = q.trim().toLowerCase();
        return (
          item.staffName.toLowerCase().includes(term) ||
          item.id.toLowerCase().includes(term) ||
          item.period.toLowerCase().includes(term) ||
          item.evaluator.toLowerCase().includes(term)
        );
      });
  }, [activeStaffIds, allStaffEvaluations, levelFilter, periodFilter, q]);

  // KPIs
  const stats = useMemo(() => {
    const list = allStaffEvaluations.filter(item => activeStaffIds.has(item.staffId));
    const total = list.length;
    const avg = total ? list.reduce((sum, item) => sum + item.overallScore, 0) / total : 0;
    const excellent = list.filter(item => item.overallScore >= 4.5).length;
    const veryGood = list.filter(item => item.overallScore >= 4.0 && item.overallScore < 4.5).length;
    const needsReview = list.filter(item => item.overallScore < 3.5).length;

    return { total, avg, excellent, veryGood, needsReview };
  }, [activeStaffIds, allStaffEvaluations]);

  // Open Add
  const openAdd = () => {
    setFormState({
      staffId: "",
      period: "الفصل الدراسي الأول",
      evaluator: "د. عبد الرحمن (مدير الشؤون الأكاديمية)",
      commitment: 5,
      performance: 5,
      cooperation: 4,
      creativity: 4,
      notes: "أداء متميز وتفانٍ مستمر في إنجاز الحصص والتفاعل الإيجابي مع الطلاب والإدارة.",
      recommendations: "التوصية بمنح مكافأة تميز وإسناد مهام إشرافية إضافية.",
    });
    setShowAddModal(true);
  };

  // Open Edit
  const openEdit = (item: StaffEvaluation) => {
    setEditingEvaluation(item);
    setFormState({
      staffId: item.staffId,
      period: item.period,
      evaluator: item.evaluator,
      commitment: item.criteria?.commitment || 4,
      performance: item.criteria?.performance || 4,
      cooperation: item.criteria?.cooperation || 4,
      creativity: item.criteria?.creativity || 4,
      notes: item.notes || "",
      recommendations: "التوصية بالتطوير المستمر",
    });
  };

  // Submit Add
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = activeStaff.find(s => s.id === formState.staffId);
    if (!staff) {
      toast.error("يرجى اختيار الموظف");
      return;
    }

    const overallScore = Number(
      ((formState.commitment + formState.performance + formState.cooperation + formState.creativity) / 4).toFixed(1)
    );

    addStaffEvaluation({
      staffId: staff.id,
      staffName: staff.name,
      period: formState.period,
      evaluator: formState.evaluator,
      date: new Date().toISOString().split("T")[0],
      criteria: {
        commitment: formState.commitment,
        performance: formState.performance,
        cooperation: formState.cooperation,
        creativity: formState.creativity,
      },
      overallScore,
      notes: formState.notes,
    });

    toast.success("تم تسجيل تقييم الأداء بنجاح وإدراجه في الملف الوظيفي");
    setShowAddModal(false);
  };

  // Submit Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvaluation) return;

    const overallScore = Number(
      ((formState.commitment + formState.performance + formState.cooperation + formState.creativity) / 4).toFixed(1)
    );

    updateStaffEvaluation(editingEvaluation.id, {
      period: formState.period,
      evaluator: formState.evaluator,
      criteria: {
        commitment: formState.commitment,
        performance: formState.performance,
        cooperation: formState.cooperation,
        creativity: formState.creativity,
      },
      overallScore,
      notes: formState.notes,
    });

    toast.success("تم تحديث بطاقة التقييم بنجاح");
    setEditingEvaluation(null);
  };

  // Delete
  const handleDelete = (id: string) => {
    deleteStaffEvaluation(id);
    toast.success("تم حذف التقييم بنجاح");
    setDeleteEvalId(null);
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star 
            key={s} 
            className={`h-3.5 w-3.5 ${s <= Math.round(score) ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} 
          />
        ))}
        <span className="text-xs font-black mr-1 tabular-nums text-foreground">{score.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "شؤون الموظفين" },
        { label: "تقييم الأداء" },
      ]}
      actions={
        <button
          onClick={openAdd}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" /> تقييم أداء جديد
        </button>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/15 text-amber-600 p-3 rounded-2xl border border-amber-500/20 shadow-sm">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">تقييم أداء الكوادر والموظفين ({getStageLabel(stage)})</h1>
              <p className="text-sm font-medium text-muted-foreground mt-0.5">
                مؤشرات قياس الأداء المهني (KPIs)، تقارير الكفاءة الدورية، وشهادات التميز الوظيفي
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-muted/60 text-muted-foreground px-3 py-1.5 rounded-lg border border-border flex items-center gap-1.5 font-bold">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              ربط تلقائي بالترقيات والملف المهني للموظف
            </span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">عدد التقييمات</span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums mt-2">{stats.total}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">سجلات المرحلة النشطة</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">متوسط الأداء العام</span>
              <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-600 grid place-items-center">
                <Star className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums text-amber-600 mt-2">{stats.avg.toFixed(1)} / 5.0</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">معدل التقييم التراكمي</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">أداء ممتاز (≥4.5)</span>
              <div className="h-8 w-8 rounded-lg bg-success/10 text-success grid place-items-center">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums text-success mt-2">{stats.excellent}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">مستحقو مكافآت التميز</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">أداء جيد جداً (4.0-4.4)</span>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 grid place-items-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums text-blue-600 mt-2">{stats.veryGood}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">كفاءة تشغيلية عالية</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">بحاجة لمتابعة (&lt;3.5)</span>
              <div className="h-8 w-8 rounded-lg bg-danger/10 text-danger grid place-items-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums text-danger mt-2">{stats.needsReview}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">تتطلب خطة تدريبية</div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="البحث باسم الموظف، المقيّم، الفترة التقييمية، أو رقم السجل..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pr-9 pl-4 py-2 text-sm focus:border-primary focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold focus:border-primary focus:outline-hidden"
              >
                <option value="all">كل مستويات الأداء ({allStaffEvaluations.length})</option>
                <option value="excellent">ممتاز (4.5 - 5.0)</option>
                <option value="very_good">جيد جداً (4.0 - 4.4)</option>
                <option value="good">جيد (3.5 - 3.9)</option>
                <option value="needs_review">بحاجة لمتابعة (&lt; 3.5)</option>
              </select>

              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold focus:border-primary focus:outline-hidden"
              >
                <option value="all">كل الفترات التقييمية</option>
                <option value="الفصل الدراسي الأول">الفصل الدراسي الأول</option>
                <option value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</option>
                <option value="التقييم السنوي الشامل">التقييم السنوي الشامل</option>
              </select>

              {(q || levelFilter !== "all" || periodFilter !== "all") && (
                <button
                  onClick={() => { setQ(""); setLevelFilter("all"); setPeriodFilter("all"); }}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
                >
                  إعادة ضبط
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <PageCard>
          <DataTable
            rows={scopedEvaluations}
            columns={[
              {
                key: "id",
                header: "رقم التقييم",
                cell: (r) => (
                  <span className="font-mono text-xs font-bold bg-muted/60 px-2 py-1 rounded inline-block">
                    {r.id}
                  </span>
                ),
              },
              {
                key: "staffName",
                header: "الموظف المكرم / المقيّم",
                cell: (r) => {
                  const staff = activeStaff.find(s => s.id === r.staffId);
                  return (
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary" />
                        {r.staffName}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {staff?.role || "كادر وظيفي"} • {staff?.department || "عام"}
                      </div>
                    </div>
                  );
                },
              },
              {
                key: "period",
                header: "الفترة والمقيّم",
                cell: (r) => (
                  <div className="text-xs space-y-0.5">
                    <div className="font-bold text-foreground">{r.period}</div>
                    <div className="text-[11px] text-muted-foreground">بواسطة: {r.evaluator}</div>
                  </div>
                ),
              },
              {
                key: "overallScore",
                header: "الدرجة العامة والنجوم",
                cell: (r) => renderStars(r.overallScore),
              },
              {
                key: "level",
                header: "التقدير المهني",
                cell: (r) => {
                  const lvl = getRatingLevel(r.overallScore);
                  return <Badge tone={lvl.tone}>{lvl.label}</Badge>;
                },
              },
              {
                key: "date",
                header: "تاريخ التقييم",
                cell: (r) => <span className="text-xs tabular-nums text-muted-foreground font-mono">{r.date}</span>,
              },
              {
                key: "actions",
                header: "الإجراءات والشهادات",
                cell: (r) => (
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Print Certificate / Report */}
                    <button
                      onClick={() => setPrintEvaluation(r)}
                      className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
                      title="طباعة بطاقة تقييم الأداء الرسمية"
                    >
                      <Printer className="h-3.5 w-3.5" /> بطاقة التقييم
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEdit(r)}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="تعديل التقييم"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteEvalId(r.id)}
                      className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                      title="حذف التقييم"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            empty="لا توجد سجلات تقييم مطابقة لمعايير البحث الحالية"
          />

          <div className="mt-4 p-3.5 bg-primary/5 text-primary-foreground/90 rounded-xl border border-primary/20 flex items-start gap-3">
            <div className="bg-primary/10 text-primary p-2 rounded-lg shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-xs space-y-1">
              <div className="font-bold text-foreground">معايير التقييم المتكاملة وأثرها على التطوير:</div>
              <p className="text-muted-foreground">
                يعتمد تقييم الأداء على 4 محاور أساسية تشمل الالتزام والانضباط، جودة الأداء التعليمي، التعاون وروح الفريق، والمبادرة والإبداع. تنعكس هذه النتائج تلقائياً في السجل المهني للموظف ويتم الاستناد إليها في تحديد العلاوات السنوية وتجديد العقود.
              </p>
            </div>
          </div>
        </PageCard>
      </div>

      {/* ========================================================
          MODAL 1: ADD / EDIT EVALUATION
         ======================================================== */}
      {(showAddModal || editingEvaluation) && (
        <div className="modal-backdrop-luxury">
          <div className="modal-card-luxury max-w-2xl w-full">
            <div className="flex items-center justify-between border-b border-border/70 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-600 grid place-items-center">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black">
                    {editingEvaluation ? `تعديل بطاقة تقييم (${editingEvaluation.id})` : "تسجيل تقييم أداء وظيفي جديد"}
                  </h3>
                  <p className="text-xs text-muted-foreground">قياس معايير الجودة والكفاءة التعليمية والإدارية</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setEditingEvaluation(null); }}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={editingEvaluation ? handleEditSubmit : handleAddSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!editingEvaluation && (
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-foreground mb-1 block">الموظف المراد تقييمه *</label>
                    <select
                      required
                      value={formState.staffId}
                      onChange={(e) => setFormState(prev => ({ ...prev, staffId: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-hidden"
                    >
                      <option value="">-- اختر الموظف --</option>
                      {activeStaff.map(s => (
                        <option key={s.id} value={s.id}>{s.name} - {s.role} ({s.department})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">الفترة التقييمية</label>
                  <select
                    value={formState.period}
                    onChange={(e) => setFormState(prev => ({ ...prev, period: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-hidden"
                  >
                    <option value="الفصل الدراسي الأول">الفصل الدراسي الأول</option>
                    <option value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</option>
                    <option value="التقييم السنوي الشامل">التقييم السنوي الشامل</option>
                    <option value="فترة التجربة (3 أشهر)">فترة التجربة (3 أشهر)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">المقيّم / المشرف التربوي</label>
                  <input
                    type="text"
                    required
                    value={formState.evaluator}
                    onChange={(e) => setFormState(prev => ({ ...prev, evaluator: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-hidden"
                  />
                </div>

                {/* Rating Criteria Sliders */}
                <div className="md:col-span-2 p-4 bg-muted/40 rounded-xl border border-border space-y-4">
                  <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    معايير التقييم التفصيلية (من 1 إلى 5):
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>الالتزام والانضباط والمواعيد:</span>
                        <span className="text-amber-600 tabular-nums">{formState.commitment} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={formState.commitment}
                        onChange={(e) => setFormState(prev => ({ ...prev, commitment: Number(e.target.value) }))}
                        className="w-full accent-primary"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>جودة الأداء المهني والتدريس:</span>
                        <span className="text-amber-600 tabular-nums">{formState.performance} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={formState.performance}
                        onChange={(e) => setFormState(prev => ({ ...prev, performance: Number(e.target.value) }))}
                        className="w-full accent-primary"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>التعاون وروح الفريق المدرسي:</span>
                        <span className="text-amber-600 tabular-nums">{formState.cooperation} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={formState.cooperation}
                        onChange={(e) => setFormState(prev => ({ ...prev, cooperation: Number(e.target.value) }))}
                        className="w-full accent-primary"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>المبادرة والإبداع والأنشطة:</span>
                        <span className="text-amber-600 tabular-nums">{formState.creativity} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={formState.creativity}
                        onChange={(e) => setFormState(prev => ({ ...prev, creativity: Number(e.target.value) }))}
                        className="w-full accent-primary"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex justify-between items-center text-xs">
                    <span className="font-bold text-muted-foreground">الدرجة التراكمية المحتسبة:</span>
                    <span className="text-sm font-black text-amber-600 tabular-nums">
                      {((formState.commitment + formState.performance + formState.cooperation + formState.creativity) / 4).toFixed(1)} / 5.0
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-foreground mb-1 block">تقرير المشرف والملاحظات العامة</label>
                  <textarea
                    rows={2}
                    value={formState.notes}
                    onChange={(e) => setFormState(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border/70 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingEvaluation(null); }}
                  className="px-4 py-2 text-xs font-bold text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-all shadow-xs"
                >
                  {editingEvaluation ? "تحديث التقييم" : "اعتماد التقييم وحفظه"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: PRINT OFFICIAL EVALUATION REPORT
         ======================================================== */}
      {printEvaluation && (
        <div className="modal-backdrop-luxury">
          <div className="modal-card-luxury max-w-2xl w-full max-h-[92vh] overflow-y-auto">
            {/* Header Controls (Hidden on Print) */}
            <div className="flex items-center justify-between border-b border-border/70 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-black">بطاقة تقييم الأداء المهني المعتمدة</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs"
                >
                  <Printer className="h-4 w-4" /> طباعة البطاقة
                </button>
                <button
                  onClick={() => setPrintEvaluation(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Document Sheet */}
            <div className="p-8 bg-white text-slate-900 rounded-xl my-2 border border-slate-200 shadow-xs print:p-0 print:border-none print:shadow-none font-sans">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-5">
                <div className="space-y-1">
                  <div className="text-base font-black text-slate-900">منظومة مدارس الريادة الحديثة</div>
                  <div className="text-xs text-slate-600 font-bold">إدارة الإشراف التربوي والجودة • قسم تقييم الكوادر</div>
                  <div className="text-[11px] text-slate-500 font-mono">الرقم المرجعي: EVL-{printEvaluation.id}</div>
                </div>
                <div className="text-center p-2 rounded-lg border border-slate-300 bg-slate-50">
                  <div className="text-[10px] font-bold text-slate-500 mb-1">رمز التحقق</div>
                  <div className="w-14 h-14 bg-white p-1 rounded border border-slate-300 grid place-items-center mx-auto">
                    <QrCode className="w-12 h-12 text-slate-800" />
                  </div>
                  <div className="text-[9px] font-mono text-slate-600 mt-0.5">{printEvaluation.id}</div>
                </div>
              </div>

              {/* Title Banner */}
              <div className="text-center py-2 bg-amber-50 border border-amber-200 rounded-lg mb-5">
                <h2 className="text-base font-black text-slate-900 flex items-center justify-center gap-2">
                  <Award className="h-5 w-5 text-amber-600" />
                  بطاقة تقييم الأداء الوظيفي والتربوي
                </h2>
                <p className="text-[11px] text-slate-600">الفترة: {printEvaluation.period} • التاريخ: {printEvaluation.date}</p>
              </div>

              {/* Staff Details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5 text-xs">
                <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                  <span className="text-slate-500 block font-bold text-[10px]">اسم الموظف / المعلم</span>
                  <span className="font-bold text-slate-800">{printEvaluation.staffName}</span>
                </div>
                <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                  <span className="text-slate-500 block font-bold text-[10px]">المقيّم المعتمد</span>
                  <span className="font-bold text-slate-800">{printEvaluation.evaluator}</span>
                </div>
                <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                  <span className="text-slate-500 block font-bold text-[10px]">التقدير العام</span>
                  <span className="font-black text-amber-700">{getRatingLevel(printEvaluation.overallScore).label}</span>
                </div>
              </div>

              {/* Criteria Score Table */}
              <div className="mb-5 text-xs">
                <div className="font-bold text-slate-800 mb-2">بيان الدرجات في المعايير الأساسية:</div>
                <table className="w-full border-collapse border border-slate-300 text-right">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold">
                      <th className="border border-slate-300 p-2">المعيار التقييمي</th>
                      <th className="border border-slate-300 p-2 w-28 text-center">الدرجة (من 5)</th>
                      <th className="border border-slate-300 p-2 w-28 text-center">النسبة المئوية</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-2">الالتزام والانضباط والمواعيد الرسمية</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">{printEvaluation.criteria?.commitment || 5}</td>
                      <td className="border border-slate-300 p-2 text-center font-mono">{((printEvaluation.criteria?.commitment || 5) / 5 * 100).toFixed(0)}%</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2">جودة الأداء المهني والتنفيذ التدريسي</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">{printEvaluation.criteria?.performance || 5}</td>
                      <td className="border border-slate-300 p-2 text-center font-mono">{((printEvaluation.criteria?.performance || 5) / 5 * 100).toFixed(0)}%</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2">التعاون مع الفريق المدرسي والتواصل الفعال</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">{printEvaluation.criteria?.cooperation || 4}</td>
                      <td className="border border-slate-300 p-2 text-center font-mono">{((printEvaluation.criteria?.cooperation || 4) / 5 * 100).toFixed(0)}%</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2">المبادرة والإبداع والمشاركة في الفعاليات</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">{printEvaluation.criteria?.creativity || 4}</td>
                      <td className="border border-slate-300 p-2 text-center font-mono">{((printEvaluation.criteria?.creativity || 4) / 5 * 100).toFixed(0)}%</td>
                    </tr>
                    <tr className="bg-amber-50/70 font-bold">
                      <td className="border border-slate-300 p-2.5">المعدل التراكمي العام</td>
                      <td className="border border-slate-300 p-2.5 text-center text-amber-700 text-sm font-black">{printEvaluation.overallScore.toFixed(1)}</td>
                      <td className="border border-slate-300 p-2.5 text-center text-amber-700 text-sm font-black font-mono">{(printEvaluation.overallScore / 5 * 100).toFixed(0)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div className="mb-5 text-xs p-3 rounded border border-slate-200 bg-slate-50">
                <span className="text-slate-500 font-bold block mb-1">ملاحظات وتوصيات المشرف المعتمد:</span>
                <p className="text-slate-800 leading-relaxed">
                  {printEvaluation.notes || "أداء ممتاز وملتزم بالمعايير التربوية والمهنية المطلوبة."}
                </p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-6 mt-6 border-t-2 border-slate-300 text-center text-xs">
                <div className="space-y-8">
                  <div className="font-bold text-slate-800">المقيّم / المشرف التربوي</div>
                  <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1 text-slate-500 text-[10px]">
                    الاسم: {printEvaluation.evaluator}
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="font-bold text-slate-800">اعتماد إدارة المدرسة والجودة</div>
                  <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1 text-slate-500 text-[10px]">
                    الختم الرسمي
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-2 border-t border-border/70 pt-4 print:hidden">
              <button
                type="button"
                onClick={() => setPrintEvaluation(null)}
                className="px-4 py-2 text-xs font-bold text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-all shadow-xs"
              >
                <Printer className="h-4 w-4" /> طباعة فورية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: DELETE CONFIRMATION
         ======================================================== */}
      {deleteEvalId && (
        <div className="modal-backdrop-luxury">
          <div className="modal-card-luxury max-w-sm w-full text-center">
            <div className="h-12 w-12 rounded-full bg-danger/10 text-danger grid place-items-center mx-auto mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black">تأكيد حذف التقييم</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              هل أنت متأكد من رغبتك في حذف هذا التقييم؟ لا يمكن استرجاع بيانات التقييم بعد الحذف.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setDeleteEvalId(null)}
                className="px-4 py-2 text-xs font-bold text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDelete(deleteEvalId)}
                className="px-4 py-2 text-xs font-bold text-white bg-danger hover:bg-danger/90 rounded-lg transition-colors shadow-xs"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
