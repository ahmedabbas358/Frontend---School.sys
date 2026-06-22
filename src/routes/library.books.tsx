import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { Book as BookIcon, Plus, Search, Filter, Printer } from "lucide-react";
import { useState, useMemo } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/library/books")({
  component: LibraryBooks,
});

const bookSchema = z.object({
  title: z.string().min(2, "عنوان الكتاب مطلوب"),
  author: z.string().min(2, "اسم المؤلف مطلوب"),
  category: z.string().min(2, "التصنيف مطلوب"),
  copies: z.coerce.number().min(1, "عدد النسخ يجب أن يكون 1 على الأقل"),
});

type BookForm = z.infer<typeof bookSchema>;

function LibraryBooks() {
  const { activeStageBooks, addBook } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  const [q, setQ] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const printTemplates: PrintTemplate[] = [
    {
      id: "books_list",
      name: "فهرس الكتب والمراجع",
      category: "المكتبة",
      type: "table",
      columns: [
        { key: "id", label: "رقم التصنيف" },
        { key: "title", label: "عنوان الكتاب" },
        { key: "author", label: "المؤلف" },
        { key: "category", label: "التصنيف" },
        { key: "copies", label: "إجمالي النسخ" },
        { key: "available", label: "المتاح للاستعارة" },
      ]
    },
    {
      id: "books_cards",
      name: "ملصقات الكتب (Cards)",
      category: "المكتبة",
      type: "cards",
      columns: [
        { key: "title", label: "العنوان" },
        { key: "author", label: "المؤلف" },
        { key: "id", label: "رقم التصنيف (ID)" }
      ]
    }
  ];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BookForm>({
    resolver: zodResolver(bookSchema),
  });

  const onSubmit = (data: BookForm) => {
    addBook({ ...data, stage });
    toast.success("تم إضافة الكتاب إلى المكتبة بنجاح");
    setIsModalOpen(false);
    reset();
  };

  const filtered = useMemo(() => {
    return activeStageBooks.filter((b) => {
      if (q && !b.title.includes(q) && !b.author.includes(q) && !b.id.includes(q)) return false;
      return true;
    });
  }, [q, activeStageBooks]);

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المكتبة" },
        { label: "فهرس الكتب" },
      ]}
      actions={
        <div className="flex gap-2">
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-card border border-border px-3 text-sm font-bold hover:bg-accent"
          >
            <Printer className="h-4 w-4" /> طباعة السجلات
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> إضافة كتاب
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        
        {/* Add Book Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-bold">إضافة كتاب جديد</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">عنوان الكتاب <span className="text-danger">*</span></label>
                  <input
                    {...register("title")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                  />
                  {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">المؤلف <span className="text-danger">*</span></label>
                  <input
                    {...register("author")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                  />
                  {errors.author && <p className="mt-1 text-xs text-danger">{errors.author.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">التصنيف <span className="text-danger">*</span></label>
                  <input
                    {...register("category")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                    placeholder="تاريخ, علوم, أدب..."
                  />
                  {errors.category && <p className="mt-1 text-xs text-danger">{errors.category.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">إجمالي النسخ المضافة <span className="text-danger">*</span></label>
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
                    onClick={() => { setIsModalOpen(false); reset(); }}
                    className="h-10 rounded-lg px-4 text-sm font-medium hover:bg-accent"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="h-10 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                  >
                    حفظ الكتاب
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
                placeholder={`البحث في مكتبة ${getStageLabel(stage)}...`}
                className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm hover:bg-accent">
              <Filter className="h-4 w-4" /> تصفية
            </button>
          </div>
        </div>

        <PageCard>
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
            <BookIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">قائمة الكتب والمراجع ({getStageLabel(stage)})</h2>
          </div>
          <DataTable
            rows={filtered}
            columns={[
              { key: "id", header: "رقم الكتاب", cell: (r) => <span className="font-bold">{r.id}</span> },
              { key: "title", header: "العنوان", cell: (r) => <span className="font-bold text-primary">{r.title}</span> },
              { key: "author", header: "المؤلف", cell: (r) => r.author },
              { key: "category", header: "التصنيف", cell: (r) => r.category },
              { key: "copies", header: "إجمالي النسخ", cell: (r) => r.copies },
              {
                key: "available",
                header: "النسخ المتاحة",
                cell: (r) => (
                  <Badge tone={r.available > 0 ? "success" : "danger"}>
                    {r.available > 0 ? `${r.available} متاح` : "غير متاح (مستعار)"}
                  </Badge>
                ),
              },
            ]}
            empty="لا توجد كتب مضافة لمكتبة هذه المرحلة."
          />
        </PageCard>
      </div>

      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="فهرس المكتبة المدرسية"
        subtitle={`للمرحلة: ${getStageLabel(stage)}`}
        data={filtered}
        templates={printTemplates}
      />
    </AppShell>
  );
}
