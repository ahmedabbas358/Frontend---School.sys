import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { 
  Plus, 
  DollarSign, 
  Printer, 
  Trash2, 
  Edit, 
  X, 
  Building, 
  GraduationCap, 
  CheckSquare, 
  Download, 
  Layers3, 
  AlertTriangle, 
  CheckCircle2, 
  BookOpen, 
  Sparkles,
  HelpCircle
} from "lucide-react";
import { useState, useMemo } from "react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { useGlobalStore, FeeStructure } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage } from "@/lib/school-structure";
import { toast } from "sonner";
import { AdminModal } from "@/components/admin/admin-modal";
import { FinanceNavTabs } from "@/components/finance/finance-nav";

export const Route = createFileRoute("/finance/fees")({
  component: FinanceFees,
});

function FinanceFees() {
  const { stage, getStageLabel } = useStage();
  const { 
    currency, 
    activeStageFeeStructures, 
    addFeeStructure, 
    updateFeeStructure, 
    deleteFeeStructure, 
    activeStageSections, 
    activeStageSubjects 
  } = useGlobalStore();

  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [deleteModalFee, setDeleteModalFee] = useState<FeeStructure | null>(null);

  const uniqueGrades = useMemo(() => {
    return getGradesForStage(stage);
  }, [stage]);

  const [formData, setFormData] = useState<Partial<FeeStructure>>({
    name: "",
    amount: 0,
    type: "رسوم دراسية",
    isMandatory: true,
    stage: stage,
    grades: [],
    sections: []
  });

  const targetSections = useMemo(() => {
    if (!formData.grades || formData.grades.length === 0) return activeStageSections;
    return activeStageSections.filter(section => formData.grades?.includes(section.grade));
  }, [activeStageSections, formData.grades]);

  const openAdd = () => {
    setEditingFee(null);
    setFormData({
      name: "",
      amount: 0,
      type: "رسوم دراسية",
      isMandatory: true,
      stage: stage,
      grades: [],
      sections: []
    });
    setIsModalOpen(true);
  };

  const openEdit = (fee: FeeStructure) => {
    setEditingFee(fee);
    setFormData({
      name: fee.name,
      amount: fee.amount,
      type: fee.type,
      isMandatory: fee.isMandatory,
      stage: fee.stage,
      grades: fee.grades || [],
      sections: fee.sections || []
    });
    setIsModalOpen(true);
  };

  const handleSaveFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || !formData.type) {
      toast.error("يرجى تعبئة الحقول المطلوبة (اسم البند والمبلغ والنوع)");
      return;
    }

    try {
      if (editingFee) {
        updateFeeStructure(editingFee.id, { ...formData, stage } as FeeStructure);
        toast.success(`تم تحديث بند الرسوم (${formData.name}) بنجاح`);
      } else {
        addFeeStructure({ ...formData, stage } as FeeStructure);
        toast.success(`تمت إضافة بند الرسوم الجديد (${formData.name}) بنجاح`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ بند الرسوم");
      return;
    }

    setIsModalOpen(false);
    setEditingFee(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteModalFee) return;
    deleteFeeStructure(deleteModalFee.id);
    toast.success(`تم حذف بند الرسوم (${deleteModalFee.name}) بنجاح`);
    setDeleteModalFee(null);
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "tuition": return "رسوم دراسية";
      case "transport": return "رسوم نقل ومواصلات";
      case "registration": return "رسوم تسجيل وقيد";
      case "books": return "رسوم كتب ومقررات";
      case "activities": return "رسوم أنشطة ورحلات";
      case "uniform": return "رسوم زي مدرسي";
      default: return type;
    }
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = ["اسم الرسوم", "النوع", "المبلغ", "العملة", "الصف الدراسي المستهدف", "طبيعة الرسوم"];
    const rows = activeStageFeeStructures.map(f => [
      `"${f.name}"`,
      `"${getTypeName(f.type)}"`,
      f.amount,
      `"${currency}"`,
      `"${renderTargets(f)}"`,
      `"${f.isMandatory ? 'إلزامي' : 'اختياري'}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `fees_structure_${stage}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير هيكل الرسوم إلى CSV");
  };

  const printTemplates: PrintTemplate[] = [
    {
      id: "fees_list",
      name: "هيكلة الرسوم الدراسية",
      category: "المالية والمحاسبة",
      type: "table",
      columns: [
        { key: "name", label: "اسم الرسوم" },
        { key: "amount", label: `القيمة (${currency})` },
        { key: "type", label: "النوع" },
        { key: "isMandatory", label: "إلزامية" }
      ]
    }
  ];

  const printData = activeStageFeeStructures.map(f => ({
    ...f,
    type: getTypeName(f.type),
    isMandatory: f.isMandatory ? "إلزامي" : "اختياري"
  }));

  const renderTargets = (r: FeeStructure) => {
    const targets = [];
    if (r.grades && r.grades.length > 0) {
      targets.push(...r.grades);
    }
    if (r.sections && r.sections.length > 0) {
      const sectionNames = r.sections.map(sId => {
        const sec = activeStageSections.find(s => s.id === sId);
        return sec ? `شعبة ${sec.name} (${sec.grade})` : "";
      }).filter(Boolean);
      targets.push(...sectionNames);
    }

    if (targets.length === 0) return "جميع الفصول والشعب";
    return targets.join("، ");
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalFeesCount = activeStageFeeStructures.length;
    const mandatoryTotal = activeStageFeeStructures
      .filter(f => f.isMandatory)
      .reduce((sum, f) => sum + f.amount, 0);
    const optionalTotal = activeStageFeeStructures
      .filter(f => !f.isMandatory)
      .reduce((sum, f) => sum + f.amount, 0);
    const subjectFeesCount = activeStageSubjects.filter(s => s.fee && s.fee > 0).length;

    return { totalFeesCount, mandatoryTotal, optionalTotal, subjectFeesCount };
  }, [activeStageFeeStructures, activeStageSubjects]);

  const uniqueTypes = ["رسوم دراسية", "رسوم تسجيل وقيد", "رسوم نقل ومواصلات", "رسوم كتب ومقررات", "رسوم أنشطة ورحلات", "رسوم زي مدرسي", "رسوم اختبارات"];

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance" },
        { label: "هيكل الرسوم الدراسية" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button 
            onClick={exportToCSV}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3.5 text-xs font-black text-foreground shadow-sm hover:bg-accent transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-primary" /> تصدير CSV
          </button>
          <button 
            onClick={() => setIsPrintOpen(true)} 
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3.5 text-xs font-black text-foreground shadow-sm hover:bg-accent transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-primary" /> طباعة الهيكل
          </button>
          <button 
            onClick={openAdd} 
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 text-xs font-black shadow-md hover:bg-primary/90 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> إضافة بند رسوم جديد
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <FinanceNavTabs activeTab="fees" />
        
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PageCard className="p-5 flex items-center gap-4 bg-card border border-border/60 rounded-3xl shadow-sm">
            <div className="p-3.5 bg-primary/10 text-primary rounded-2xl shrink-0">
              <Layers3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">بنود الرسوم المقررة</p>
              <p className="text-2xl font-black text-foreground tabular-nums mt-0.5">{stats.totalFeesCount} بنود</p>
            </div>
          </PageCard>

          <PageCard className="p-5 flex items-center gap-4 bg-card border border-border/60 rounded-3xl shadow-sm">
            <div className="p-3.5 bg-emerald-500/10 text-emerald-600 rounded-2xl shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي الرسوم الإلزامية</p>
              <p className="text-2xl font-black text-emerald-600 tabular-nums mt-0.5">
                {stats.mandatoryTotal.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">{currency}</span>
              </p>
            </div>
          </PageCard>

          <PageCard className="p-5 flex items-center gap-4 bg-card border border-border/60 rounded-3xl shadow-sm">
            <div className="p-3.5 bg-blue-500/10 text-blue-600 rounded-2xl shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">الرسوم والخدمات الاختيارية</p>
              <p className="text-2xl font-black text-foreground tabular-nums mt-0.5">
                {stats.optionalTotal.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">{currency}</span>
              </p>
            </div>
          </PageCard>

          <PageCard className="p-5 flex items-center gap-4 bg-card border border-border/60 rounded-3xl shadow-sm">
            <div className="p-3.5 bg-amber-500/10 text-amber-600 rounded-2xl shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">مواد مرتبطة برسوم خاصة</p>
              <p className="text-2xl font-black text-amber-600 tabular-nums mt-0.5">{stats.subjectFeesCount} مادة</p>
            </div>
          </PageCard>
        </div>

        {/* Fees Data Table */}
        <PageCard className="p-0 overflow-hidden">
          <DataTable
            rows={activeStageFeeStructures}
            columns={[
              { 
                key: "name", 
                header: "اسم بند الرسوم", 
                cell: (r) => (
                  <div>
                    <div className="font-black text-sm text-foreground">{r.name}</div>
                    <div className="text-[11px] text-muted-foreground font-bold mt-0.5">مرحلة: {r.stage === "all" ? "جميع المراحل" : getStageLabel(r.stage)}</div>
                  </div>
                ) 
              },
              { 
                key: "type", 
                header: "التصنيف", 
                cell: (r) => <Badge tone="neutral" className="text-xs font-bold">{getTypeName(r.type)}</Badge> 
              },
              { 
                key: "amount", 
                header: "القيمة المحددة", 
                cell: (r) => (
                  <span className="font-black text-base text-primary tabular-nums">
                    {r.amount.toLocaleString()} {currency}
                  </span>
                ) 
              },
              { 
                key: "targets", 
                header: "الفصول والشعب المستهدفة", 
                cell: (r) => (
                  <span className="text-xs font-bold text-muted-foreground">
                    {renderTargets(r)}
                  </span>
                ) 
              },
              { 
                key: "isMandatory", 
                header: "طبيعة الرسم", 
                cell: (r) => (
                  <Badge tone={r.isMandatory ? "primary" : "neutral"} className="text-xs font-bold">
                    {r.isMandatory ? "إلزامي على الطالب" : "اختياري / حسب الطلب"}
                  </Badge>
                ) 
              },
              {
                key: "actions",
                header: "إجراءات",
                cell: (r) => (
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => openEdit(r)}
                      className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white transition-all text-xs cursor-pointer"
                      title="تعديل بند الرسوم"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setDeleteModalFee(r)}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-all text-xs cursor-pointer"
                      title="حذف بند الرسوم"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ),
              },
            ]}
            pageSize={10}
            pageSizeOptions={[10, 25, 50]}
            empty="لا توجد بنود رسوم مضافة في هذه المرحلة حالياً."
          />
        </PageCard>

        {/* Subject-linked Fees section */}
        {activeStageSubjects.some(s => s.fee && s.fee > 0) && (
          <PageCard className="p-6">
            <div className="mb-4 flex items-center gap-2 border-b border-border/60 pb-3">
              <BookOpen className="h-5 w-5 text-amber-600" />
              <div>
                <h3 className="text-sm font-black text-foreground">رسوم المواد التعليمية المرتبطة - {getStageLabel(stage)}</h3>
                <p className="text-xs text-muted-foreground">تضاف تلقائياً عند تسجيل المادة للطلاب</p>
              </div>
            </div>
            <DataTable
              rows={activeStageSubjects.filter(s => s.fee && s.fee > 0)}
              columns={[
                { key: "name", header: "اسم المادة", cell: (r) => <span className="font-black text-sm text-foreground">{r.name}</span> },
                { key: "code", header: "الرمز", cell: (r) => <span className="text-xs font-mono font-bold px-2 py-0.5 bg-muted rounded-md">{r.code}</span> },
                { key: "amount", header: `الرسم الإضافي (${currency})`, cell: (r) => <span className="font-black text-amber-600 text-sm tabular-nums">+{r.fee?.toLocaleString()}</span> },
                { key: "grades", header: "الصفوف المخصصة", cell: (r) => <span className="text-xs text-muted-foreground font-bold">{r.grades?.length ? r.grades.join("، ") : "جميع الصفوف"}</span> },
                { key: "isMandatory", header: "الحالة", cell: () => (
                    <Badge tone="warning" className="text-[10px]">
                      مرتبط بتسجيل المادة
                    </Badge>
                  ) 
                }
              ]}
              pageSize={5}
            />
          </PageCard>
        )}
      </div>

      {/* --- Add / Edit Fee Structure Luxury Modal --- */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFee ? "تعديل بند الرسوم المدرسية" : "إضافة بند رسوم دراسية جديد"}
        description={`مرحلة: ${getStageLabel(stage)}`}
        icon={DollarSign}
        tone="primary"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveFee} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <label className="block text-xs font-black text-foreground mb-1.5">
                    اسم بند الرسوم <span className="text-danger">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="مثال: رسوم التسجيل للعام الدراسي الجديد"
                    className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">
                    تصنيف الرسوم <span className="text-danger">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    list="fee-types-list"
                    placeholder="اختر أو اكتب نوعاً جديداً..."
                    className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  />
                  <datalist id="fee-types-list">
                    {uniqueTypes.map(t => <option key={t} value={t} />)}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">
                    القيمة المالية ({currency}) <span className="text-danger">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="0"
                    className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-black tabular-nums outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all text-primary"
                    value={formData.amount || ""}
                    onChange={e => setFormData({ ...formData, amount: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Target Section Selection */}
              <div className="border border-border/70 rounded-2xl p-4 bg-muted/20 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <label className="text-xs font-black text-foreground">الاستهداف (فصول وشعب محددة)</label>
                </div>
                <p className="text-[11px] text-muted-foreground font-bold">
                  إذا تركت التحديد فارغاً، سيتم تطبيق البند على جميع الفصول والشعب في مرحلة {getStageLabel(stage)} تلقائياً.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-48 overflow-y-auto custom-scrollbar-modal p-1">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-black text-muted-foreground block mb-1">الصفوف الدراسية:</span>
                    {uniqueGrades.length === 0 ? (
                      <p className="text-xs text-muted-foreground">لا توجد صفوف معرفة.</p>
                    ) : (
                      uniqueGrades.map((g) => (
                        <label key={g} className="flex items-center gap-2.5 cursor-pointer bg-card p-2 rounded-xl border border-border/60 hover:border-primary/50 transition-all text-xs font-bold">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded text-primary focus:ring-primary"
                            checked={formData.grades?.includes(g)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                grades: checked
                                  ? [...(prev.grades || []), g]
                                  : (prev.grades || []).filter(grade => grade !== g),
                                sections: checked
                                  ? prev.sections
                                  : (prev.sections || []).filter(sectionId => activeStageSections.find(s => s.id === sectionId)?.grade !== g)
                              }));
                            }}
                          />
                          <span>{g}</span>
                        </label>
                      ))
                    )}
                  </div>

                  <div className="space-y-1.5 border-t sm:border-t-0 sm:border-r border-border/50 sm:pr-4 pt-2 sm:pt-0">
                    <span className="text-[11px] font-black text-muted-foreground block mb-1">الشعب الدراسية:</span>
                    {targetSections.length === 0 ? (
                      <p className="text-xs text-muted-foreground">لا توجد شعب مطابقة للصفوف المختارة.</p>
                    ) : (
                      targetSections.map((sec) => (
                        <label key={sec.id} className="flex items-center gap-2.5 cursor-pointer bg-card p-2 rounded-xl border border-border/60 hover:border-primary/50 transition-all text-xs font-bold">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded text-primary focus:ring-primary"
                            checked={formData.sections?.includes(sec.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                sections: checked 
                                  ? [...(prev.sections || []), sec.id]
                                  : (prev.sections || []).filter(sId => sId !== sec.id)
                              }));
                            }}
                          />
                          <span className="truncate">شعبة {sec.name} ({sec.grade})</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Mandatory Toggle */}
              <div className="flex items-center justify-between p-4 border border-border/70 rounded-2xl bg-muted/20">
                <div>
                  <label className="font-black block text-xs text-foreground">رسوم إلزامية أساسية</label>
                  <span className="text-[11px] text-muted-foreground font-bold">
                    عند التفعيل، تُدرج الرسوم تلقائياً في فواتير الطلاب المسجلين
                  </span>
                </div>
                <input 
                  type="checkbox" 
                  checked={formData.isMandatory}
                  onChange={e => setFormData({ ...formData, isMandatory: e.target.checked })}
                  className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2.5 border-t border-border/60">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="h-11 px-5 rounded-xl border border-border/80 bg-background hover:bg-accent text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="h-11 px-6 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> {editingFee ? "حفظ التعديلات" : "إضافة بند الرسوم"}
                </button>
              </div>
            </form>
          </AdminModal>

      {/* --- Delete Confirmation Luxury Modal --- */}
      <AdminModal
        isOpen={!!deleteModalFee}
        onClose={() => setDeleteModalFee(null)}
        title="تأكيد حذف بند الرسوم"
        description={deleteModalFee?.name || ""}
        icon={AlertTriangle}
        tone="danger"
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setDeleteModalFee(null)}
              className="h-10 px-5 rounded-xl border border-border/80 bg-background hover:bg-accent text-xs font-bold transition-all cursor-pointer"
            >
              تراجع
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="h-10 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition-all cursor-pointer"
            >
              تأكيد الحذف
            </button>
          </div>
        }
      >
        {deleteModalFee && (
          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs font-bold text-rose-700 dark:text-rose-400 space-y-1">
            <p>هل أنت متأكد من حذف هذا البند من هيكلة الرسوم؟</p>
            <p className="text-[11px] text-muted-foreground">
              القيمة: <strong>{deleteModalFee.amount.toLocaleString()} {currency}</strong>
            </p>
          </div>
        )}
      </AdminModal>

      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="هيكلة الرسوم الدراسية المعتمدة"
        data={printData}
        templates={printTemplates}
      />
    </AppShell>
  );
}
