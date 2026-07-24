import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Plus, Percent, Printer, Trash2, X, Users, GraduationCap, Building, Tag, CheckCircle2 } from "lucide-react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { FinancialCard, FilterBar } from "@/components/financial-components";
import { useMemo, useState } from "react";
import { useGlobalStore, Discount } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage } from "@/lib/school-structure";
import { toast } from "sonner";

export const Route = createFileRoute("/finance/discounts")({
  component: FinanceDiscounts,
});

function FinanceDiscounts() {
  const { currency, allDiscounts, addDiscount, deleteDiscount, activeStageStudents, activeStageSections } = useGlobalStore();
  const { stage, stages, getStageLabel } = useStage();
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [q, setQ] = useState("");

  const [newDiscount, setNewDiscount] = useState<Partial<Discount>>({
    name: "",
    type: "percentage",
    value: 0,
    description: "",
    stage,
    grades: [],
    sections: [],
    studentIds: [],
    isActive: true
  });

  const grades = useMemo(() => getGradesForStage(stage), [stage]);
  const targetSections = useMemo(() => {
    if (!newDiscount.grades?.length) return activeStageSections;
    return activeStageSections.filter(section => newDiscount.grades?.includes(section.grade));
  }, [activeStageSections, newDiscount.grades]);

  const getTargetSummary = (discount: Discount) => {
    const parts: string[] = [];
    parts.push(discount.stage && discount.stage !== "all" ? getStageLabel(discount.stage) : "كل المراحل");
    if (discount.grades?.length) parts.push(discount.grades.join("، "));
    if (discount.sections?.length) {
      const names = discount.sections.map(id => {
        const section = activeStageSections.find(item => item.id === id);
        return section ? `شعبة ${section.name}` : "";
      }).filter(Boolean);
      if (names.length) parts.push(names.join("، "));
    }
    if (discount.studentIds?.length) parts.push(`${discount.studentIds.length} طالب محدد`);
    return parts.join(" / ");
  };

  const countMatches = (discount: Discount) => {
    return activeStageStudents.filter(student => {
      if (discount.stage && discount.stage !== "all" && discount.stage !== student.stage) return false;
      if (discount.grades?.length && !discount.grades.includes(student.grade)) return false;
      if (discount.sections?.length && (!student.sectionId || !discount.sections.includes(student.sectionId))) return false;
      if (discount.studentIds?.length && !discount.studentIds.includes(student.id)) return false;
      return discount.isActive !== false;
    }).length;
  };

  const handleAddDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscount.name || !newDiscount.value) {
      toast.error("يرجى تعبئة الحقول المطلوبة (اسم الخصم والقيمة)");
      return;
    }
    try {
      addDiscount({
        ...newDiscount,
        stage: newDiscount.stage || stage,
        grades: newDiscount.grades || [],
        sections: newDiscount.sections || [],
        studentIds: newDiscount.studentIds || [],
        isActive: newDiscount.isActive !== false,
      } as Discount);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ الخصم");
      return;
    }
    toast.success("تم إضافة بند وقاعدة الخصم والمنحة بنجاح");
    setIsModalOpen(false);
    setNewDiscount({ name: "", type: "percentage", value: 0, description: "", stage, grades: [], sections: [], studentIds: [], isActive: true });
  };

  const filteredDiscounts = useMemo(() => {
    return allDiscounts.filter(d => {
      if (q) {
        const qLower = q.toLowerCase();
        const matchName = d.name.toLowerCase().includes(qLower);
        const matchDesc = d.description?.toLowerCase().includes(qLower);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [allDiscounts, q]);

  const printTemplates: PrintTemplate[] = [
    {
      id: "discounts-list",
      name: "قائمة المنح والخصومات",
      category: "المالية",
      type: "table",
      columns: [
        { label: "كود/اسم الخصم", key: "name" },
        { label: "النوع", key: "typeLabel" },
        { label: "القيمة", key: "valueStr" },
        { label: "النطاق المستهدف", key: "targetSummary" },
        { label: "عدد المستفيدين", key: "matchCount" },
      ]
    }
  ];

  const printData = filteredDiscounts.map(d => ({
    ...d,
    typeLabel: d.type === "percentage" ? "نسبة مئوية (%)" : "مبلغ ثابت",
    valueStr: d.type === "percentage" ? `${d.value}%` : `${d.value.toLocaleString()} ${currency}`,
    targetSummary: getTargetSummary(d),
    matchCount: countMatches(d)
  }));

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance/dashboard" },
        { label: "إدارة الخصومات والمنح الدراسية" },
      ]}
      actions={
        <div className="flex gap-2">
          <button 
            onClick={() => setIsPrintOpen(true)} 
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-card border border-border px-3.5 text-xs font-extrabold hover:bg-accent shadow-sm"
          >
            <Printer className="h-4 w-4" /> طباعة لائحة الخصومات
          </button>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 text-xs font-extrabold shadow-sm hover:bg-primary/90 transition-all"
          >
            <Plus className="h-4 w-4" /> إضافة بند خصم/منحة جديدة
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PageCard className="p-4 flex items-center gap-4 bg-card border border-border/50 rounded-2xl shadow-sm">
            <div className="p-3 bg-primary/10 text-primary rounded-xl"><Tag className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي قواعد الخصوم والمنح</p>
              <p className="text-2xl font-black tabular-nums">{allDiscounts.length}</p>
            </div>
          </PageCard>
          <PageCard className="p-4 flex items-center gap-4 border-l-4 border-l-success rounded-2xl shadow-sm">
            <div className="p-3 bg-success/10 text-success rounded-xl"><GraduationCap className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">الطلاب المستفيدين من الخصومات</p>
              <p className="text-xl font-black tabular-nums text-success">
                {activeStageStudents.filter(s => allDiscounts.some(d => countMatches(d) > 0)).length} طالب
              </p>
            </div>
          </PageCard>
          <PageCard className="p-4 flex items-center gap-4 border-l-4 border-l-amber-500 rounded-2xl shadow-sm">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><Percent className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">أنواع الخصومات المفعلة</p>
              <p className="text-xl font-black tabular-nums text-amber-600">خصم الأخوة / منحة تفوق</p>
            </div>
          </PageCard>
        </div>

        {/* Data Table */}
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <DataTable
            columns={[
              { 
                key: "name", 
                header: "اسم الخصم / المنحة", 
                cell: (d: any) => (
                  <div>
                    <div className="font-extrabold text-sm">{d.name}</div>
                    {d.description && <div className="text-xs text-muted-foreground">{d.description}</div>}
                  </div>
                )
              },
              { 
                key: "type", 
                header: "نوع الخصم والقيمة", 
                cell: (d: any) => (
                  <div className="flex items-center gap-2">
                    <Badge tone={d.type === "percentage" ? "info" : "success"}>
                      {d.type === "percentage" ? `خصم ${d.value}%` : `خصم ثابت: ${d.value.toLocaleString()} ${currency}`}
                    </Badge>
                  </div>
                )
              },
              { 
                key: "target", 
                header: "النطاق المستهدف", 
                cell: (d: any) => <span className="font-bold text-xs text-muted-foreground">{getTargetSummary(d)}</span> 
              },
              { 
                key: "matches", 
                header: "الطلاب المستفيدين", 
                cell: (d: any) => <Badge tone="neutral">{countMatches(d)} طالب</Badge> 
              },
              { 
                key: "actions", 
                header: "إجراءات", 
                cell: (d: any) => (
                  <button 
                    onClick={() => {
                      deleteDiscount(d.id);
                      toast.success("تم إلغاء بند الخصم بنجاح");
                    }}
                    className="text-xs font-bold text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-all"
                    title="حذف الخصم"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )
              }
            ]}
            rows={filteredDiscounts}
            pageSize={10}
            pageSizeOptions={[10, 25, 50]}
            empty="لا توجد منح أو خصومات مسجلة تطابق شروط التصفية"
          />
        </div>
      </div>

      {/* --- Add Discount Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border/50 flex justify-between items-center bg-primary/10">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-primary"><Plus className="w-5 h-5" /> إضافة بند خصم / منحة جديدة</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddDiscount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">اسم الخصم أو المنحة <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  required 
                  placeholder="مثال: خصم الأخ الثاني (15%) أو منحة تفوق" 
                  value={newDiscount.name}
                  onChange={e => setNewDiscount(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/40 outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">نوع الخصم</label>
                  <select 
                    value={newDiscount.type}
                    onChange={e => setNewDiscount(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-xs focus:ring-2 focus:ring-primary/40 outline-none"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت ({currency})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">قيمة الخصم <span className="text-danger">*</span></label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    placeholder="أدخل القيمة..." 
                    value={newDiscount.value || ""}
                    onChange={e => setNewDiscount(prev => ({ ...prev, value: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-base focus:ring-2 focus:ring-primary/40 outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">الوصف والملاحظات</label>
                <input 
                  type="text" 
                  placeholder="ملاحظات توضيحية حول ضوابط الخصم..." 
                  value={newDiscount.description || ""}
                  onChange={e => setNewDiscount(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl text-xs focus:ring-2 focus:ring-primary/40 outline-none" 
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button type="submit" className="flex-1 btn-primary font-extrabold py-2.5 rounded-xl">حفظ بند الخصم</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary py-2.5 rounded-xl">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Advanced Print Engine --- */}
      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="لائحة الخصومات والمنح الدراسية المعتمـدة"
        data={printData}
        templates={printTemplates}
      />

    </AppShell>
  );
}
