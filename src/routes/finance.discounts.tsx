import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { 
  Plus, 
  Percent, 
  Printer, 
  Trash2, 
  Edit, 
  X, 
  Users, 
  GraduationCap, 
  Building, 
  Tag, 
  CheckCircle2, 
  Download, 
  AlertTriangle, 
  Sparkles,
  Search,
  CheckSquare
} from "lucide-react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { useMemo, useState } from "react";
import { useGlobalStore, Discount } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage } from "@/lib/school-structure";
import { toast } from "sonner";
import { AdminModal } from "@/components/admin/admin-modal";
import { FinanceNavTabs } from "@/components/finance/finance-nav";

export const Route = createFileRoute("/finance/discounts")({
  component: FinanceDiscounts,
});

function FinanceDiscounts() {
  const { 
    currency, 
    allDiscounts, 
    addDiscount, 
    updateDiscount, 
    deleteDiscount, 
    activeStageStudents, 
    activeStageSections 
  } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [deleteModalDiscount, setDeleteModalDiscount] = useState<Discount | null>(null);
  const [q, setQ] = useState("");

  const grades = useMemo(() => getGradesForStage(stage), [stage]);

  const [formData, setFormData] = useState<Partial<Discount>>({
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

  const targetSections = useMemo(() => {
    if (!formData.grades?.length) return activeStageSections;
    return activeStageSections.filter(section => formData.grades?.includes(section.grade));
  }, [activeStageSections, formData.grades]);

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

  const openAdd = () => {
    setEditingDiscount(null);
    setFormData({
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
    setIsModalOpen(true);
  };

  const openEdit = (d: Discount) => {
    setEditingDiscount(d);
    setFormData({
      name: d.name,
      type: d.type,
      value: d.value,
      description: d.description || "",
      stage: d.stage || stage,
      grades: d.grades || [],
      sections: d.sections || [],
      studentIds: d.studentIds || [],
      isActive: d.isActive !== false
    });
    setIsModalOpen(true);
  };

  const handleSaveDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.value) {
      toast.error("يرجى تعبئة الحقول المطلوبة (اسم الخصم والقيمة)");
      return;
    }

    try {
      if (editingDiscount) {
        updateDiscount(editingDiscount.id, {
          ...formData,
          stage: formData.stage || stage,
          grades: formData.grades || [],
          sections: formData.sections || [],
          studentIds: formData.studentIds || [],
          isActive: formData.isActive !== false,
        } as Discount);
        toast.success(`تم تحديث بند الخصم (${formData.name}) بنجاح`);
      } else {
        addDiscount({
          ...formData,
          stage: formData.stage || stage,
          grades: formData.grades || [],
          sections: formData.sections || [],
          studentIds: formData.studentIds || [],
          isActive: formData.isActive !== false,
        } as Discount);
        toast.success(`تمت إضافة بند الخصم الجديد (${formData.name}) بنجاح`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ الخصم");
      return;
    }

    setIsModalOpen(false);
    setEditingDiscount(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteModalDiscount) return;
    deleteDiscount(deleteModalDiscount.id);
    toast.success(`تم حذف بند الخصم (${deleteModalDiscount.name}) بنجاح`);
    setDeleteModalDiscount(null);
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

  // CSV Export
  const exportToCSV = () => {
    const headers = ["اسم الخصم / المنحة", "النوع", "القيمة", "الوصف", "النطاق المستهدف", "الطلاب المستفيدين"];
    const rows = filteredDiscounts.map(d => [
      `"${d.name}"`,
      `"${d.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ مقطوع'}"`,
      d.type === 'percentage' ? `${d.value}%` : `${d.value} ${currency}`,
      `"${d.description || '-'}"`,
      `"${getTargetSummary(d)}"`,
      countMatches(d)
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `discounts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير لائحة الخصومات إلى CSV بنجاح");
  };

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
        { label: "المركز المالي", to: "/finance" },
        { label: "الخصومات والمنح الدراسية" },
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
            <Printer className="w-3.5 h-3.5 text-primary" /> طباعة اللائحة
          </button>
          <button 
            onClick={openAdd} 
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 text-xs font-black shadow-md hover:bg-primary/90 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> إضافة بند خصم / منحة جديدة
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <FinanceNavTabs activeTab="discounts" />
        
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <PageCard className="p-5 flex items-center gap-4 bg-card border border-border/60 rounded-3xl shadow-sm">
            <div className="p-3.5 bg-primary/10 text-primary rounded-2xl shrink-0"><Tag className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي سياسات الخصم والمنح</p>
              <p className="text-2xl font-black text-foreground tabular-nums mt-0.5">{allDiscounts.length}</p>
            </div>
          </PageCard>

          <PageCard className="p-5 flex items-center gap-4 bg-card border border-border/60 rounded-3xl shadow-sm">
            <div className="p-3.5 bg-emerald-500/10 text-emerald-600 rounded-2xl shrink-0"><GraduationCap className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">الطلاب المستفيدون بالمرحلة</p>
              <p className="text-2xl font-black text-emerald-600 tabular-nums mt-0.5">
                {activeStageStudents.filter(s => allDiscounts.some(d => countMatches(d) > 0)).length} طالب
              </p>
            </div>
          </PageCard>

          <PageCard className="p-5 flex items-center gap-4 bg-card border border-border/60 rounded-3xl shadow-sm">
            <div className="p-3.5 bg-amber-500/10 text-amber-600 rounded-2xl shrink-0"><Percent className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">أبرز المنح المعمول بها</p>
              <p className="text-sm font-black text-foreground mt-1">خصم الأخوة • أبناء المعلمين • تفوق</p>
            </div>
          </PageCard>
        </div>

        {/* Search Bar */}
        <PageCard className="p-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="ابحث باسم الخصم، النطاق أو الوصف..." 
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-4 pr-10 h-11 bg-muted/30 border border-border/70 rounded-xl text-xs font-bold focus:border-primary focus:ring-4 focus:ring-primary/15 outline-none transition-all"
            />
          </div>
        </PageCard>

        {/* Data Table */}
        <PageCard className="p-0 overflow-hidden">
          <DataTable
            columns={[
              { 
                key: "name", 
                header: "اسم الخصم / المنحة", 
                cell: (d: any) => (
                  <div>
                    <div className="font-black text-sm text-foreground">{d.name}</div>
                    {d.description && <div className="text-[11px] text-muted-foreground mt-0.5">{d.description}</div>}
                  </div>
                )
              },
              { 
                key: "type", 
                header: "نوع الخصم والقيمة", 
                cell: (d: any) => (
                  <Badge tone={d.type === "percentage" ? "info" : "success"} className="text-xs font-bold">
                    {d.type === "percentage" ? `نسبة: ${d.value}%` : `مبلغ ثابت: ${d.value.toLocaleString()} ${currency}`}
                  </Badge>
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
                cell: (d: any) => <Badge tone="neutral" className="text-xs font-bold">{countMatches(d)} طالب</Badge> 
              },
              { 
                key: "actions", 
                header: "إجراءات", 
                cell: (d: any) => (
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => openEdit(d)}
                      className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white transition-all text-xs cursor-pointer"
                      title="تعديل بند الخصم"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setDeleteModalDiscount(d)}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-all text-xs cursor-pointer"
                      title="حذف الخصم"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              }
            ]}
            rows={filteredDiscounts}
            pageSize={10}
            pageSizeOptions={[10, 25, 50]}
            empty="لا توجد منح أو خصومات مسجلة تطابق شروط التصفية"
          />
        </PageCard>
      </div>

      {/* --- Add / Edit Discount Luxury Modal --- */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDiscount ? "تعديل بند الخصم والمنحة" : "إضافة بند خصم / منحة جديدة"}
        description="تحديد نسبة أو مبلغ التخفيض والنطاق المستهدف"
        icon={Percent}
        tone="primary"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveDiscount} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-foreground mb-1.5">
                  اسم الخصم أو المنحة <span className="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="مثال: خصم الأخ الثاني (15%) أو منحة تفوق" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">نوع التخفيض</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-3.5 text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ مقطوع ({currency})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">
                    قيمة التخفيض <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    placeholder="أدخل القيمة..." 
                    value={formData.value || ""}
                    onChange={e => setFormData({ ...formData, value: Number(e.target.value) || 0 })}
                    className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-black tabular-nums outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all text-primary" 
                  />
                </div>
              </div>

              {/* Target Grades Selector */}
              <div className="border border-border/70 rounded-2xl p-4 bg-muted/20 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <label className="text-xs font-black text-foreground">الصفوف المشمولة بالخصم</label>
                </div>
                <p className="text-[11px] text-muted-foreground font-bold">
                  إذا تركت التحديد فارغاً، يسري الخصم على جميع صفوف المرحلة تلقائياً.
                </p>

                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto custom-scrollbar-modal p-1">
                  {grades.map(g => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer bg-card p-2 rounded-xl border border-border/60 hover:border-primary/50 transition-all text-xs font-bold">
                      <input 
                        type="checkbox"
                        checked={formData.grades?.includes(g)}
                        onChange={e => {
                          const checked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            grades: checked ? [...(prev.grades || []), g] : (prev.grades || []).filter(item => item !== g)
                          }));
                        }}
                        className="w-4 h-4 rounded text-primary focus:ring-primary"
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-foreground mb-1.5">الوصف والضوابط</label>
                <textarea 
                  rows={2}
                  placeholder="ملاحظات توضيحية حول شروط استحقاق الخصم..." 
                  value={formData.description || ""}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 rounded-xl border border-border/80 bg-background/80 text-xs font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all" 
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
                  <CheckCircle2 className="w-4 h-4" /> {editingDiscount ? "حفظ التعديلات" : "حفظ بند الخصم"}
                </button>
              </div>
        </form>
      </AdminModal>

      {/* --- Delete Confirmation Luxury Modal --- */}
      <AdminModal
        isOpen={!!deleteModalDiscount}
        onClose={() => setDeleteModalDiscount(null)}
        title="تأكيد حذف الخصم"
        description={deleteModalDiscount?.name || ""}
        icon={AlertTriangle}
        tone="danger"
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setDeleteModalDiscount(null)}
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
        {deleteModalDiscount && (
          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs font-bold text-rose-700 dark:text-rose-400 space-y-1">
            <p>هل أنت متأكد من حذف سياسة الخصم هذه نهائياً؟</p>
            <p className="text-[11px] text-muted-foreground">
              القيمة: <strong>{deleteModalDiscount.type === 'percentage' ? `${deleteModalDiscount.value}%` : `${deleteModalDiscount.value} ${currency}`}</strong>
            </p>
          </div>
        )}
      </AdminModal>

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
