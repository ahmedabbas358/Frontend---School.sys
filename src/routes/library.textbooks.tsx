import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { 
  Book, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  Edit, 
  Trash2, 
  FileSpreadsheet, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  X,
  Layers
} from "lucide-react";
import { useState, useMemo } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage, GRADE_OPTIONS } from "@/contexts/StageContext";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/library/textbooks")({
  head: () => ({ meta: [{ title: "مستودع الكتب والمقررات الدراسية | منصة مدارس" }] }),
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
  const { 
    activeStageTextbooks, 
    activeStageDistributions, 
    addTextbook, 
    updateTextbook, 
    deleteTextbook, 
    addActivityLog 
  } = useGlobalStore();
  
  const { stage, getStageLabel } = useStage();
  const [q, setQ] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmBook, setDeleteConfirmBook] = useState<any | null>(null);
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

  const textbooksWithStats = useMemo(() => {
    return activeStageTextbooks.map(tb => {
      const distributedCount = activeStageDistributions.filter(d => d.textbookId === tb.id).length;
      return {
        ...tb,
        distributed: distributedCount,
        available: Math.max(0, tb.copies - distributedCount)
      };
    });
  }, [activeStageTextbooks, activeStageDistributions]);

  // Overall KPI statistics
  const stats = useMemo(() => {
    const totalTitles = textbooksWithStats.length;
    const totalCopies = textbooksWithStats.reduce((sum, b) => sum + (b.copies || 0), 0);
    const totalDistributed = textbooksWithStats.reduce((sum, b) => sum + (b.distributed || 0), 0);
    const totalAvailable = textbooksWithStats.reduce((sum, b) => sum + (b.available || 0), 0);
    const lowStockCount = textbooksWithStats.filter(b => b.available < 10).length;
    return { totalTitles, totalCopies, totalDistributed, totalAvailable, lowStockCount };
  }, [textbooksWithStats]);

  const onSubmit = (data: TextbookForm) => {
    if (editingId) {
      updateTextbook(editingId, data);
      addActivityLog({
        action: "update",
        category: "facilities",
        details: `تحديث بيانات الكتاب المدرسي: ${data.title} (${data.gradeId})`,
        targetId: editingId,
        timestamp: new Date().toISOString(),
      });
      toast.success("تم تحديث بيانات الكتاب بنجاح");
    } else {
      addTextbook({ ...data, stage });
      addActivityLog({
        action: "create",
        category: "facilities",
        details: `إضافة كتاب جديد للمستودع: ${data.title} (${data.gradeId}) - ${data.copies} نسخة`,
        timestamp: new Date().toISOString(),
      });
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

  const handleDelete = () => {
    if (!deleteConfirmBook) return;
    deleteTextbook(deleteConfirmBook.id);
    addActivityLog({
      action: "delete",
      category: "facilities",
      details: `حذف الكتاب المدرسي: ${deleteConfirmBook.title} (${deleteConfirmBook.gradeId})`,
      targetId: deleteConfirmBook.id,
      timestamp: new Date().toISOString(),
    });
    toast.success(`تم حذف كتاب ${deleteConfirmBook.title} بنجاح`);
    setDeleteConfirmBook(null);
  };

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

  // Compute unique terms
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

  // CSV Export
  const exportTextbooksCsv = () => {
    const headers = ["رقم الكتاب", "عنوان المقرر", "المادة", "الصف الدراسي", "الفصل الدراسي", "إجمالي النسخ", "الموزع للطلاب", "المتبقي بالمخزن"];
    const rows = filtered.map(t => [
      `"${t.id}"`,
      `"${t.title}"`,
      `"${t.subject}"`,
      `"${t.gradeId}"`,
      `"${t.term || 'الفصل الأول'}"`,
      t.copies,
      t.distributed,
      t.available,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `سجل_الكتب_المدرسية_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير ملف إكسل للمقررات الدراسية بنجاح");
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المرافق والخدمات" },
        { label: "مستودع الكتب والمقررات" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={exportTextbooksCsv}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> تصدير CSV
          </button>
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
          >
            <Printer className="h-4 w-4 text-primary" /> طباعة القائمة
          </button>
          <button 
            onClick={() => {
              setEditingId(null);
              reset();
              setIsModalOpen(true);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
          >
            <Plus className="h-4 w-4" /> إضافة كتاب جديد
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">عناوين المقررات ({getStageLabel(stage)})</span>
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <Book className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black tabular-nums">{stats.totalTitles}</div>
            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">مقرر دراسي معتمد للمرحلة</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">إجمالي النسخ المطبوعة</span>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
                <Layers className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-600 tabular-nums">{stats.totalCopies}</div>
            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">نسخة مسجلة بالمستودع</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">الموزع لعهدة الطلاب</span>
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 grid place-items-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-amber-600 tabular-nums">{stats.totalDistributed}</div>
            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">كتاب تم تسليمه رسمياً</div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">المتبقي في رصيد المستودع</span>
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 grid place-items-center">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-purple-600 tabular-nums">{stats.totalAvailable}</div>
            <div className="text-[11px] font-bold text-muted-foreground mt-0.5">نسخ شاغرة للتسليم أو الاحتياط</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`البحث في مقررات ${getStageLabel(stage)} بالاسم أو المادة أو الصف...`}
                className="h-11 w-full rounded-xl border border-border/80 bg-background/80 ps-10 pe-4 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
              />
            </div>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="h-11 rounded-xl border border-border/80 bg-background/80 px-3.5 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 cursor-pointer shadow-xs"
            >
              <option value="all">كافة الفصول الدراسية</option>
              <option value="الفصل الأول">الفصل الأول</option>
              <option value="الفصل الثاني">الفصل الثاني</option>
              <option value="الفصل الثالث">الفصل الثالث</option>
              {availableTerms.filter(t => !["الفصل الأول", "الفصل الثاني", "الفصل الثالث"].includes(t)).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Textbooks grouped by term */}
        {Object.entries(groupedByTerm).sort(([a], [b]) => a.localeCompare(b)).map(([term, termBooks]) => (
          <PageCard key={term}>
            <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-base font-black text-foreground">
                  مخزن المقررات الدراسية ({getStageLabel(stage)}) - <span className="text-primary">{term}</span>
                </h2>
              </div>
              <span className="text-xs font-bold bg-muted px-2.5 py-1 rounded-lg tabular-nums">
                {termBooks.length} كتب
              </span>
            </div>

            <DataTable
              rows={termBooks}
              columns={[
                { 
                  key: "title", 
                  header: "عنوان الكتاب", 
                  cell: (r) => (
                    <div>
                      <span className="font-bold text-foreground text-sm">{r.title}</span>
                      <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{r.id}</div>
                    </div>
                  ) 
                },
                { 
                  key: "subject", 
                  header: "المادة التعليمية", 
                  cell: (r) => <span className="text-xs font-bold text-primary">{r.subject}</span> 
                },
                { 
                  key: "gradeId", 
                  header: "الصف الدراسي", 
                  cell: (r) => <Badge tone="primary">{r.gradeId}</Badge> 
                },
                { 
                  key: "copies", 
                  header: "إجمالي النسخ", 
                  cell: (r) => <span className="font-black text-xs tabular-nums">{r.copies}</span> 
                },
                { 
                  key: "distributed", 
                  header: "الموزع للطلاب", 
                  cell: (r) => <span className="text-xs font-bold text-muted-foreground tabular-nums">{r.distributed}</span> 
                },
                {
                  key: "available",
                  header: "المتبقي بالمستودع",
                  cell: (r) => (
                    <Badge tone={r.available > 10 ? "success" : r.available > 0 ? "warning" : "danger"}>
                      {r.available} نسخة
                    </Badge>
                  ),
                },
                {
                  key: "actions",
                  header: "",
                  cell: (r) => (
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => handleEdit(r)} 
                        className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                        title="تعديل بيانات الكتاب"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmBook(r)} 
                        className="p-1.5 text-muted-foreground hover:text-danger rounded-lg hover:bg-danger/10 transition-colors"
                        title="حذف الكتاب"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ),
                },
              ]}
              empty="لا توجد كتب دراسية مضافة لهذا الفصل بعد."
            />
          </PageCard>
        ))}

        {Object.keys(groupedByTerm).length === 0 && (
          <PageCard>
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-30 text-muted-foreground" />
              <p className="font-bold text-sm">لا توجد كتب مضافة لهذه المرحلة. انقر على 'إضافة كتاب جديد' للبدء.</p>
            </div>
          </PageCard>
        )}
      </div>

      {/* ADD / EDIT TEXTBOOK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 my-8 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/50 bg-gradient-to-r from-card via-card/95 to-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-inner border border-primary/20">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">
                    {editingId ? "تعديل بيانات المقرر الدراسي" : "إضافة كتاب جديد للمستودع"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">تسجيل المناهج المدرسية وتحديد النسخ المتوفرة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); reset(); }}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">عنوان الكتاب / المقرر <span className="text-destructive">*</span></label>
                <input
                  {...register("title")}
                  placeholder="مثال: لغتي الجميلة - كتاب الطالب"
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                />
                {errors.title && <p className="text-xs font-bold text-destructive">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">المادة التعليمية <span className="text-destructive">*</span></label>
                  <input
                    {...register("subject")}
                    placeholder="اللغة العربية، الرياضيات..."
                    className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                  />
                  {errors.subject && <p className="text-xs font-bold text-destructive">{errors.subject.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">الصف الدراسي <span className="text-destructive">*</span></label>
                  <select
                    {...register("gradeId")}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer"
                  >
                    <option value="">-- اختر الصف --</option>
                    {grades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  {errors.gradeId && <p className="text-xs font-bold text-destructive">{errors.gradeId.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">الفصل الدراسي <span className="text-destructive">*</span></label>
                  <select
                    {...register("term")}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer"
                  >
                    <option value="الفصل الأول">الفصل الأول</option>
                    <option value="الفصل الثاني">الفصل الثاني</option>
                    <option value="الفصل الثالث">الفصل الثالث</option>
                  </select>
                  {errors.term && <p className="text-xs font-bold text-destructive">{errors.term.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">إجمالي النسخ المطبوعة <span className="text-destructive">*</span></label>
                  <input
                    type="number"
                    {...register("copies")}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-3.5 text-sm font-black text-primary shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 tabular-nums"
                  />
                  {errors.copies && <p className="text-xs font-bold text-destructive">{errors.copies.message}</p>}
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); reset(); }}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border/80 hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-7 py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-[0.98]"
                >
                  {editingId ? "تحديث الكتاب" : "إضافة للمستودع"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 my-8 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/50 bg-gradient-to-r from-card via-card/95 to-destructive/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center shadow-inner border border-destructive/20">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">تأكيد حذف الكتاب</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">حذف المقرر وإلغاء ارتباطه بسجلات التوزيع</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirmBook(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm font-bold text-foreground">
                هل أنت متأكد من رغبتك في حذف هذا المقرر من المستودع؟
              </p>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">عنوان الكتاب:</span>
                  <span className="font-bold text-foreground">{deleteConfirmBook.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الصف:</span>
                  <span className="font-bold text-foreground">{deleteConfirmBook.gradeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المادة:</span>
                  <span className="font-bold text-foreground">{deleteConfirmBook.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">إجمالي النسخ:</span>
                  <span className="font-black text-primary">{deleteConfirmBook.copies} نسخة</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmBook(null)}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold border border-border/80 hover:bg-accent transition-colors"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-xl bg-destructive px-6 py-2.5 text-xs font-black text-destructive-foreground hover:bg-destructive/90 transition-all shadow-md shadow-destructive/20 active:scale-[0.98]"
                >
                  تأكيد الحذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
