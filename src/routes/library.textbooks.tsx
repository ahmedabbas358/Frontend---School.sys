import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Book, Plus, Search, Filter, Printer, Edit, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage, GRADE_OPTIONS } from "@/contexts/StageContext";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/library/textbooks")({
  component: LibraryTextbooks,
});

const textbookSchema = z.object({
  title: z.string().min(2, "عنوان الكتاب مطلوب"),
  subject: z.string().min(2, "المادة مطلوبة"),
  gradeId: z.string().min(2, "الصف الدراسي مطلوب"),
  copies: z.coerce.number().min(0, "عدد النسخ لا يمكن أن يكون سالباً"),
  term: z.string().min(1, "الفصل مطلوب"),
});

type TextbookForm = z.infer<typeof textbookSchema>;

function LibraryTextbooks() {
  const { activeStageTextbooks, activeStageDistributions, addTextbook, updateTextbook, deleteTextbook } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  const [q, setQ] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const printTemplates: PrintTemplate[] = [
    {
      id: "textbooks_list",
      name: "قائمة الكتب المدرسية",
      category: "الكتب والمقررات",
      type: "table",
      columns: [
        { key: "id", label: "رقم الكتاب" },
        { key: "title", label: "عنوان الكتاب" },
        { key: "subject", label: "المادة" },
        { key: "gradeId", label: "الصف الدراسي" },
        { key: "term", label: "الفصل الدراسي" },
        { key: "copies", label: "إجمالي النسخ" },
        { key: "distributed", label: "الموزع" },
        { key: "available", label: "المتبقي بالمخزن" },
      ]
    }
  ];

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TextbookForm>({
    resolver: zodResolver(textbookSchema),
  });

  const onSubmit = (data: TextbookForm) => {
    if (editingId) {
      updateTextbook(editingId, data);
      toast.success("تم تحديث بيانات الكتاب بنجاح");
    } else {
      addTextbook({ ...data, stage });
      toast.success("تم إضافة الكتاب إلى المخزن بنجاح");
    }
    setIsModalOpen(false);
    setEditingId(null);
    reset();
  };

  const handleEdit = (t: any) => {
    setEditingId(t.id);
    setValue("title", t.title);
    setValue("subject", t.subject);
    setValue("gradeId", t.gradeId);
    setValue("term", t.term || "الفصل الأول");
    setValue("copies", t.copies);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الكتاب؟ سيتم حذفه من سجلات التوزيع أيضاً.")) {
      deleteTextbook(id);
      toast.success("تم الحذف بنجاح");
    }
  };

  const textbooksWithStats = useMemo(() => {
    return activeStageTextbooks.map(tb => {
      const distributedCount = activeStageDistributions.filter(d => d.textbookId === tb.id).length;
      return {
        ...tb,
        distributed: distributedCount,
        available: tb.copies - distributedCount
      };
    });
  }, [activeStageTextbooks, activeStageDistributions]);

  const filtered = useMemo(() => {
    return textbooksWithStats.filter((t) => {
      const term = t.term || "الفصل الأول";
      if (selectedTerm !== "all" && term !== selectedTerm) return false;
      if (q) {
        const searchStr = q.toLowerCase();
        const matchTitle = t.title?.toLowerCase().includes(searchStr);
        const matchSubject = t.subject?.toLowerCase().includes(searchStr);
        const matchGrade = t.gradeId?.toLowerCase().includes(searchStr);
        const matchId = t.id?.toLowerCase().includes(searchStr);
        if (!matchTitle && !matchSubject && !matchGrade && !matchId) return false;
      }
      return true;
    });
  }, [q, selectedTerm, textbooksWithStats]);

  const grades = GRADE_OPTIONS[stage] || [];

  // Compute unique terms from real textbook data
  const availableTerms = useMemo(() => {
    const terms = new Set<string>();
    textbooksWithStats.forEach(t => { if (t.term) terms.add(t.term); });
    return Array.from(terms).sort();
  }, [textbooksWithStats]);

  const groupedByTerm = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(t => {
      const term = t.term || "الفصل الأول";
      if (!groups[term]) groups[term] = [];
      groups[term].push(t);
    });
    return groups;
  }, [filtered]);

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المرافق والخدمات" },
        { label: "الكتب المدرسية" },
      ]}
      actions={
        <div className="flex gap-2">
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-card border border-border px-3 text-sm font-bold hover:bg-accent"
          >
            <Printer className="h-4 w-4" /> طباعة القائمة
          </button>
          <button 
            onClick={() => {
              setEditingId(null);
              reset();
              setIsModalOpen(true);
            }}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> إضافة كتاب جديد
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-bold">{editingId ? "تعديل بيانات الكتاب" : "إضافة كتاب دراسي جديد"}</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">عنوان الكتاب <span className="text-danger">*</span></label>
                  <input
                    {...register("title")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                    placeholder="مثال: الرياضيات المتقدمة"
                  />
                  {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">المادة <span className="text-danger">*</span></label>
                  <input
                    {...register("subject")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                    placeholder="مثال: رياضيات"
                  />
                  {errors.subject && <p className="mt-1 text-xs text-danger">{errors.subject.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">الصف الدراسي المقرّر <span className="text-danger">*</span></label>
                  <select
                    {...register("gradeId")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                  >
                    <option value="">اختر الصف...</option>
                    {grades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  {errors.gradeId && <p className="mt-1 text-xs text-danger">{errors.gradeId.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">الفصل الدراسي <span className="text-danger">*</span></label>
                  <select
                    {...register("term")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                  >
                    <option value="الفصل الأول">الفصل الأول</option>
                    <option value="الفصل الثاني">الفصل الثاني</option>
                    <option value="الفصل الثالث">الفصل الثالث</option>
                    {availableTerms.filter(t => !["الفصل الأول", "الفصل الثاني", "الفصل الثالث"].includes(t)).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {errors.term && <p className="mt-1 text-xs text-danger">{errors.term.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">إجمالي النسخ المضافة للمخزن <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    {...register("copies")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                  />
                  {errors.copies && <p className="mt-1 text-xs text-danger">{errors.copies.message}</p>}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); reset(); setEditingId(null); }}
                    className="h-10 rounded-lg px-4 text-sm font-medium hover:bg-accent"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="h-10 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    حفظ البيانات
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`البحث في مقررات ${getStageLabel(stage)}...`}
                className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="all">كل الفصول</option>
              <option value="الفصل الأول">الفصل الأول</option>
              <option value="الفصل الثاني">الفصل الثاني</option>
              <option value="الفصل الثالث">الفصل الثالث</option>
              {availableTerms.filter(t => !["الفصل الأول", "الفصل الثاني", "الفصل الثالث"].includes(t)).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {Object.entries(groupedByTerm).sort(([a], [b]) => a.localeCompare(b)).map(([term, termBooks]) => (
          <PageCard key={term}>
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
              <Book className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">مخزن الكتب الدراسية ({getStageLabel(stage)}) - <span className="text-primary">{term}</span></h2>
            </div>
            <DataTable
              rows={termBooks}
              columns={[
                { key: "title", header: "العنوان", cell: (r) => <span className="font-bold text-primary">{r.title}</span> },
                { key: "subject", header: "المادة", cell: (r) => r.subject },
                { key: "gradeId", header: "الصف", cell: (r) => <Badge>{r.gradeId}</Badge> },
                { key: "copies", header: "إجمالي النسخ", cell: (r) => r.copies },
                { key: "distributed", header: "الموزع", cell: (r) => <span className="text-muted-foreground">{r.distributed}</span> },
                {
                  key: "available",
                  header: "المتبقي (بالمخزن)",
                  cell: (r) => (
                    <Badge tone={r.available > 0 ? (r.available < 10 ? "warning" : "success") : "danger"}>
                      {r.available}
                    </Badge>
                  ),
                },
                {
                  key: "actions",
                  header: "",
                  cell: (r) => (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(r)} className="p-2 text-muted-foreground hover:text-primary transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="p-2 text-muted-foreground hover:text-danger transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
              empty="لا توجد كتب مضافة لهذا الفصل."
            />
          </PageCard>
        ))}
        {Object.keys(groupedByTerm).length === 0 && (
          <PageCard>
            <div className="text-center py-8 text-muted-foreground">
              لا توجد كتب مضافة لهذه المرحلة. انقر على 'إضافة كتاب جديد' للبدء.
            </div>
          </PageCard>
        )}
      </div>

      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="مخزن الكتب المدرسية والمقررات"
        subtitle={`للمرحلة: ${getStageLabel(stage)}`}
        data={filtered}
        templates={printTemplates}
      />
    </AppShell>
  );
}
