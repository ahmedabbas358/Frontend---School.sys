import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Plus, DollarSign, Printer, Trash2, X, Building, GraduationCap, CheckSquare } from "lucide-react";
import { useState, useMemo } from "react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { FinancialCard, FilterBar } from "@/components/financial-components";
import { useGlobalStore, FeeStructure } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage } from "@/lib/school-structure";
import { toast } from "sonner";

export const Route = createFileRoute("/finance/fees")({
  component: FinanceFees,
});

function FinanceFees() {
  const { stage, getStageLabel } = useStage();
  const { currency, activeStageFeeStructures, addFeeStructure, deleteFeeStructure, activeStageSections, activeStageSubjects } = useGlobalStore();
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const uniqueGrades = useMemo(() => {
    return getGradesForStage(stage);
  }, [stage]);

  const [newFee, setNewFee] = useState<Partial<FeeStructure>>({
    name: "",
    amount: 0,
    type: "",
    isMandatory: true,
    stage: stage,
    grades: [],
    sections: []
  });

  const targetSections = useMemo(() => {
    if (!newFee.grades || newFee.grades.length === 0) return activeStageSections;
    return activeStageSections.filter(section => newFee.grades?.includes(section.grade));
  }, [activeStageSections, newFee.grades]);

  const handleAddFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFee.name || !newFee.amount || !newFee.type) {
      toast.error("يرجى تعبئة الحقول المطلوبة");
      return;
    }
    try {
      addFeeStructure({ ...newFee, stage } as FeeStructure);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ بند الرسوم");
      return;
    }
    toast.success("تم إضافة بند الرسوم بنجاح");
    setIsModalOpen(false);
    setNewFee({ name: "", amount: 0, type: "", isMandatory: true, stage: stage, grades: [], sections: [] });
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "tuition": return "رسوم دراسية";
      case "transport": return "رسوم نقل";
      case "registration": return "رسوم تسجيل";
      case "books": return "رسوم كتب";
      default: return type;
    }
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

  // unique types from existing structures for datalist
  const uniqueTypes = Array.from(new Set(activeStageFeeStructures.map(f => f.type)));
  if (!uniqueTypes.includes("رسوم دراسية")) uniqueTypes.push("رسوم دراسية");
  if (!uniqueTypes.includes("رسوم نقل")) uniqueTypes.push("رسوم نقل");
  if (!uniqueTypes.includes("رسوم أنشطة")) uniqueTypes.push("رسوم أنشطة");
  if (!uniqueTypes.includes("رسوم زي مدرسي")) uniqueTypes.push("رسوم زي مدرسي");

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي" },
        { label: "إعداد الرسوم" },
      ]}
      actions={
        <div className="flex gap-2">
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-card border border-border px-3 text-sm font-bold hover:bg-accent"
          >
            <Printer className="h-4 w-4" /> طباعة
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Plus className="h-4 w-4" /> إضافة بند رسوم
          </button>
        </div>
      }
    >
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FinancialCard 
            title="إجمالي بنود الرسوم" 
            value={activeStageFeeStructures.length} 
            icon={DollarSign} 
            colorClass="text-primary bg-primary" 
          />
          <FinancialCard 
            title="البنود الإلزامية" 
            value={activeStageFeeStructures.filter(f => f.isMandatory).length} 
            icon={CheckSquare} 
            colorClass="text-warning bg-warning" 
          />
          <FinancialCard 
            title="إجمالي قيمة الرسوم (الأساسية)" 
            value={activeStageFeeStructures.filter(f => f.isMandatory && f.grades?.length === 0 && f.sections?.length === 0).reduce((sum, f) => sum + f.amount, 0)} 
            currency={currency}
            icon={Building} 
            colorClass="text-success bg-success" 
          />
        </div>

        <FilterBar>
          <div className="flex-1" />
          <div className="text-sm text-muted-foreground font-bold">المرحلة الحالية: {getStageLabel(stage)}</div>
        </FilterBar>

        <PageCard>
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">هيكلة الرسوم الدراسية المعتمدة - {getStageLabel(stage)}</h2>
          </div>
          <DataTable
            rows={activeStageFeeStructures}
            columns={[
              { key: "name", header: "اسم الرسوم", cell: (r) => <span className="font-bold">{r.name}</span> },
              { key: "amount", header: `القيمة (${currency})`, cell: (r) => <span className="font-black text-success text-lg">{r.amount.toLocaleString()}</span> },
              { key: "type", header: "النوع", cell: (r) => <span className="text-sm font-medium px-2 py-1 bg-accent rounded-md">{getTypeName(r.type)}</span> },
              { key: "targets", header: "الفئات المخصصة", cell: (r) => <span className="text-sm text-muted-foreground">{renderTargets(r)}</span> },
              { key: "isMandatory", header: "الحالة", cell: (r) => (
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${r.isMandatory ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {r.isMandatory ? 'إلزامي' : 'اختياري'}
                  </span>
                ) 
              },
              {
                key: "actions",
                header: "إعدادات",
                cell: (r) => (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        if(confirm("هل أنت متأكد من حذف هذا البند؟")) {
                          deleteFeeStructure(r.id);
                          toast.success("تم الحذف بنجاح");
                        }
                      }}
                      className="rounded-md p-2 text-danger hover:bg-danger/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            empty="لا توجد بنود رسوم مضافة في هذه المرحلة."
          />
        </PageCard>

        {activeStageSubjects.some(s => s.fee && s.fee > 0) && (
          <PageCard>
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
              <DollarSign className="h-5 w-5 text-warning" />
              <h2 className="text-lg font-bold">رسوم المواد الدراسية المرتبطة - {getStageLabel(stage)}</h2>
            </div>
            <DataTable
              rows={activeStageSubjects.filter(s => s.fee && s.fee > 0)}
              columns={[
                { key: "name", header: "المادة", cell: (r) => <span className="font-bold">{r.name}</span> },
                { key: "code", header: "الرمز", cell: (r) => <span className="text-sm px-2 py-1 bg-accent rounded-md">{r.code}</span> },
                { key: "amount", header: `رسوم المادة (${currency})`, cell: (r) => <span className="font-black text-warning text-lg">{r.fee?.toLocaleString()}</span> },
                { key: "grades", header: "الصفوف المخصصة", cell: (r) => <span className="text-sm text-muted-foreground">{r.grades?.length ? r.grades.join("، ") : "جميع الصفوف"}</span> },
                { key: "isMandatory", header: "الحالة", cell: () => (
                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-warning/10 text-warning">
                      مرتبط بتسجيل المادة
                    </span>
                  ) 
                }
              ]}
            />
          </PageCard>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto pt-20 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            <div className="bg-primary/5 p-6 flex items-center justify-between border-b border-border/50">
              <h2 className="text-2xl font-black flex items-center gap-2 text-primary">
                <DollarSign className="h-6 w-6" /> إضافة بند رسوم جديد
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-accent transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddFee} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">اسم الرسوم <span className="text-danger">*</span></label>
                  <input
                    required
                    type="text"
                    placeholder="مثال: رسوم التسجيل للعام الجديد"
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    value={newFee.name}
                    onChange={e => setNewFee({...newFee, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">النوع <span className="text-danger">*</span></label>
                  <input
                    required
                    type="text"
                    list="fee-types-list"
                    placeholder="اختر أو اكتب نوع جديد..."
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    value={newFee.type}
                    onChange={e => setNewFee({...newFee, type: e.target.value})}
                  />
                  <datalist id="fee-types-list">
                    {uniqueTypes.map(t => <option key={t} value={t} />)}
                  </datalist>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">القيمة ({currency}) <span className="text-danger">*</span></label>
                  <input
                    required
                    type="number"
                    min="0"
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-black text-xl text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors tabular-nums"
                    value={newFee.amount || ""}
                    onChange={e => setNewFee({...newFee, amount: Number(e.target.value)})}
                  />
                </div>

                {/* Target Section Selection */}
                <div className="col-span-2 border-t border-border/50 pt-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckSquare className="h-5 w-5 text-primary" />
                    <label className="text-base font-bold text-foreground">الاستهداف (صفوف وشعب محددة)</label>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    إذا تركت الخيارات فارغة، سيتم تطبيق البند على جميع الفصول والشعب في المرحلة.
                  </p>

                  <div className="grid grid-cols-2 gap-4 max-h-48 overflow-y-auto custom-scrollbar p-1">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground mb-2 sticky top-0 bg-background py-1">
                        <GraduationCap className="h-4 w-4" /> الفصول
                      </div>
                      {uniqueGrades.length === 0 ? (
                        <p className="text-xs text-muted-foreground">لا توجد فصول معرفة.</p>
                      ) : (
                        uniqueGrades.map((g) => (
                          <label key={g} className="flex items-center gap-2 cursor-pointer group bg-accent/30 p-2 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-primary text-primary focus:ring-primary"
                              checked={newFee.grades?.includes(g)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setNewFee(prev => ({
                                  ...prev,
                                  grades: checked
                                    ? [...(prev.grades || []), g]
                                    : (prev.grades || []).filter(grade => grade !== g),
                                  sections: checked
                                    ? prev.sections
                                    : (prev.sections || []).filter(sectionId => activeStageSections.find(section => section.id === sectionId)?.grade !== g)
                                }));
                              }}
                            />
                            <span className="text-sm font-bold group-hover:text-primary transition-colors">{g}</span>
                          </label>
                        ))
                      )}
                    </div>

                    <div className="space-y-3 border-r border-border/50 pr-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground mb-2 sticky top-0 bg-background py-1">
                            <Building className="h-4 w-4" /> الشعب الدراسية
                      </div>
                      {targetSections.length === 0 ? (
                        <p className="text-xs text-muted-foreground">لا توجد شعب مطابقة للفصول المختارة.</p>
                      ) : (
                        [...targetSections].sort((a,b)=>a.grade.localeCompare(b.grade, 'ar') || a.name.localeCompare(b.name,'ar')).map((sec) => (
                          <label key={sec.id} className="flex items-center gap-2 cursor-pointer group bg-accent/30 p-2 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-primary text-primary focus:ring-primary"
                              checked={newFee.sections?.includes(sec.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setNewFee(prev => ({
                                  ...prev,
                                  sections: checked 
                                    ? [...(prev.sections || []), sec.id]
                                    : (prev.sections || []).filter(sId => sId !== sec.id)
                                }));
                              }}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold group-hover:text-primary transition-colors">شعبة {sec.name}</span>
                              <span className="text-xs text-muted-foreground">{sec.grade}</span>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-span-2 flex items-center justify-between p-4 border border-border/50 rounded-2xl bg-accent/20">
                  <div>
                    <label className="font-bold block text-foreground">رسوم إلزامية</label>
                    <span className="text-xs text-muted-foreground">هل يجب دفع هذه الرسوم على جميع الطلاب المستهدفين؟</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={newFee.isMandatory}
                      onChange={e => setNewFee({...newFee, isMandatory: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border/50">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-5 py-2.5 font-bold hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="rounded-xl bg-primary px-8 py-2.5 font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  حفظ البند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
