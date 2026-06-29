import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Plus, Percent, Printer, Trash2, X, Users, GraduationCap, Building } from "lucide-react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
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

  const targetStudents = useMemo(() => {
    return activeStageStudents.filter(student => {
      if (newDiscount.grades?.length && !newDiscount.grades.includes(student.grade)) return false;
      if (newDiscount.sections?.length && (!student.sectionId || !newDiscount.sections.includes(student.sectionId))) return false;
      return true;
    });
  }, [activeStageStudents, newDiscount.grades, newDiscount.sections]);

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
      toast.error("يرجى تعبئة الحقول المطلوبة");
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
    toast.success("تم إضافة الخصم بنجاح");
    setIsModalOpen(false);
    setNewDiscount({ name: "", type: "percentage", value: 0, description: "", stage, grades: [], sections: [], studentIds: [], isActive: true });
  };

  const printTemplates: PrintTemplate[] = [
    {
      id: "discounts-list",
      name: "كشف الخصومات والمنح",
      category: "المالية",
      type: "table",
      columns: [
        { label: "اسم الخصم / المنحة", key: "name" },
        { label: "نوع الخصم", key: "typeStr" },
        { label: "القيمة", key: "valueStr" },
        { label: "شروط التطبيق", key: "description" },
      ],
      description: "طباعة كشف مجمع بقواعد الخصومات والمنح الدراسية المعتمدة"
    }
  ];

  const printData = allDiscounts.map(d => ({
    ...d,
    typeStr: d.type === "percentage" ? "نسبة مئوية" : "مبلغ مقطوع",
    valueStr: d.type === "percentage" ? `${d.value}%` : `${d.value.toLocaleString()} ${currency}`
  }));

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المالية والمحاسبة" },
        { label: "الخصومات والمنح" },
      ]}
      actions={
        <div className="flex gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> إضافة قاعدة خصم
          </button>
          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary/10 px-4 text-sm font-bold text-primary hover:bg-primary/20 transition-all border border-primary/20"
          >
            <Printer className="h-4 w-4" /> طباعة الكشف
          </button>
        </div>
      }
    >
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <PageCard>
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
            <Percent className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">إدارة الخصومات والمنح الدراسية</h2>
          </div>
          <DataTable
            rows={allDiscounts}
            columns={[
              { key: "name", header: "اسم الخصم / المنحة", cell: (r) => <span className="font-bold">{r.name}</span> },
              { key: "type", header: "نوع الخصم", cell: (r) => <span className="text-sm font-medium px-2 py-1 bg-accent rounded-md">{r.type === "percentage" ? "نسبة مئوية" : "مبلغ مقطوع"}</span> },
              { key: "value", header: "القيمة", cell: (r) => <span className="font-bold text-danger text-lg">{r.type === "percentage" ? `${r.value}%` : `${r.value.toLocaleString()} ${currency}`}</span> },
              { key: "targets", header: "نطاق التطبيق", cell: (r) => <span className="text-sm font-bold text-primary">{getTargetSummary(r)}</span> },
              { key: "matches", header: "مطابق حالياً", cell: (r) => <span className="rounded-lg bg-success/10 px-2 py-1 text-xs font-bold text-success">{countMatches(r)} طالب</span> },
              { key: "description", header: "الوصف والشروط", cell: (r) => <span className="text-sm text-muted-foreground">{r.description || "-"}</span> },
              {
                key: "actions",
                header: "إعدادات",
                cell: (r) => (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        if(confirm("هل أنت متأكد من حذف هذا الخصم؟")) {
                          deleteDiscount(r.id);
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
          />
        </PageCard>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl rounded-3xl bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="bg-primary/5 p-6 flex items-center justify-between border-b border-border/50">
              <h2 className="text-2xl font-black flex items-center gap-2 text-primary">
                <Percent className="h-6 w-6" /> إضافة قاعدة خصم جديدة
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-accent transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddDiscount} className="p-6 space-y-5 overflow-y-auto">
              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">اسم الخصم <span className="text-danger">*</span></label>
                  <input
                    required
                    type="text"
                    placeholder="مثال: خصم الإخوة"
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    value={newDiscount.name}
                    onChange={e => setNewDiscount({...newDiscount, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-muted-foreground">نوع الخصم <span className="text-danger">*</span></label>
                    <select
                      required
                      className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                      value={newDiscount.type}
                      onChange={e => setNewDiscount({...newDiscount, type: e.target.value as any})}
                    >
                      <option value="percentage">نسبة مئوية (%)</option>
                      <option value="fixed">مبلغ مقطوع ({currency})</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-muted-foreground">القيمة <span className="text-danger">*</span></label>
                    <input
                      required
                      type="number"
                      min="1"
                      max={newDiscount.type === "percentage" ? 100 : 100000}
                      className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-black text-xl text-danger focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors tabular-nums text-left"
                      dir="ltr"
                      value={newDiscount.value || ""}
                      onChange={e => setNewDiscount({...newDiscount, value: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">الوصف والشروط (اختياري)</label>
                  <textarea
                    rows={3}
                    placeholder="اكتب شروط تطبيق هذا الخصم..."
                    className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none"
                    value={newDiscount.description}
                    onChange={e => setNewDiscount({...newDiscount, description: e.target.value})}
                  ></textarea>
                </div>

                <div className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="font-black">نطاق تطبيق الخصم الفعلي</h3>
                    <span className="mr-auto rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      {targetStudents.filter(student => !newDiscount.studentIds?.length || newDiscount.studentIds.includes(student.id)).length} طالب مطابق
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-muted-foreground">المرحلة</label>
                      <select
                        className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold"
                        value={newDiscount.stage || stage}
                        onChange={event => setNewDiscount({ ...newDiscount, stage: event.target.value as any, grades: [], sections: [], studentIds: [] })}
                      >
                        <option value="all">كل المراحل</option>
                        {stages.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-background p-4">
                      <div>
                        <p className="font-bold">الخصم مفعل</p>
                        <p className="text-xs text-muted-foreground">الخصم غير المفعل لن يطبق على الفواتير الجديدة.</p>
                      </div>
                      <input
                        type="checkbox"
                        className="h-5 w-5 accent-primary"
                        checked={newDiscount.isActive !== false}
                        onChange={event => setNewDiscount({ ...newDiscount, isActive: event.target.checked })}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                        <GraduationCap className="h-4 w-4" /> الفصول
                      </div>
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-border/50 bg-background p-2">
                        {grades.map(grade => (
                          <label key={grade} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-accent">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-primary"
                              checked={newDiscount.grades?.includes(grade) || false}
                              onChange={event => setNewDiscount(prev => ({
                                ...prev,
                                grades: event.target.checked ? [...(prev.grades || []), grade] : (prev.grades || []).filter(item => item !== grade),
                                sections: event.target.checked ? prev.sections : (prev.sections || []).filter(sectionId => activeStageSections.find(section => section.id === sectionId)?.grade !== grade),
                                studentIds: [],
                              }))}
                            />
                            <span className="text-sm font-bold">{grade}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                        <Building className="h-4 w-4" /> الشعب
                      </div>
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-border/50 bg-background p-2">
                        {targetSections.map(section => (
                          <label key={section.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-accent">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-primary"
                              checked={newDiscount.sections?.includes(section.id) || false}
                              onChange={event => setNewDiscount(prev => ({
                                ...prev,
                                sections: event.target.checked ? [...(prev.sections || []), section.id] : (prev.sections || []).filter(item => item !== section.id),
                                studentIds: [],
                              }))}
                            />
                            <span className="text-sm font-bold">{section.grade} / شعبة {section.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                        <Users className="h-4 w-4" /> طلاب محددون
                      </div>
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-border/50 bg-background p-2">
                        {targetStudents.map(student => (
                          <label key={student.id} className="flex cursor-pointer items-start gap-2 rounded-lg p-2 hover:bg-accent">
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 accent-primary"
                              checked={newDiscount.studentIds?.includes(student.id) || false}
                              onChange={event => setNewDiscount(prev => ({
                                ...prev,
                                studentIds: event.target.checked ? [...(prev.studentIds || []), student.id] : (prev.studentIds || []).filter(item => item !== student.id),
                              }))}
                            />
                            <span>
                              <span className="block text-sm font-bold">{student.name}</span>
                              <span className="block text-xs text-muted-foreground">{student.grade} / ولي الأمر: {student.guardianName}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 border-t border-border/50 mt-6">
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
                  حفظ الخصم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title="كشف الخصومات والمنح الدراسية"
        data={printData}
        templates={printTemplates} 
      />
    </AppShell>
  );
}
