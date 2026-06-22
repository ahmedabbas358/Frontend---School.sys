import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { PackageOpen, Plus, Search, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export const Route = createFileRoute("/inventory/items")({
  component: InventoryItems,
});

const itemSchema = z.object({
  name: z.string().min(2, "اسم الصنف مطلوب"),
  category: z.string().min(2, "التصنيف مطلوب"),
  price: z.string().min(1, "سعر الصنف مطلوب"),
  quantity: z.coerce.number().min(0, "الكمية لا يمكن أن تكون سالبة"),
});

type ItemForm = z.infer<typeof itemSchema>;

function InventoryItems() {
  const { currency, allInventoryItems, addInventoryItem  } = useGlobalStore();
  const [q, setQ] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
  });

  const onSubmit = (data: ItemForm) => {
    addInventoryItem(data);
    toast.success("تمت إضافة الصنف إلى المستودع بنجاح");
    setIsModalOpen(false);
    reset();
  };

  const filtered = useMemo(() => {
    return allInventoryItems.filter((i) => {
      if (q && !i.name.includes(q) && !i.id.includes(q)) return false;
      return true;
    });
  }, [q, allInventoryItems]);

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المستودعات" },
        { label: "الأصناف والمواد" },
      ]}
      actions={
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> تعريف صنف جديد
        </button>
      }
    >
      <div className="space-y-4">
        
        {/* Add Item Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-bold">إضافة صنف جديد للمستودع</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">اسم الصنف <span className="text-danger">*</span></label>
                  <input
                    {...register("name")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                    placeholder="مثال: زي رياضي مقاس L"
                  />
                  {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">التصنيف <span className="text-danger">*</span></label>
                  <input
                    {...register("category")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                    placeholder="أزياء، قرطاسية، أجهزة..."
                  />
                  {errors.category && <p className="mt-1 text-xs text-danger">{errors.category.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">السعر التقديري <span className="text-danger">*</span></label>
                  <input
                    {...register("price")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                    placeholder="مثال: 50 {currency}"
                  />
                  {errors.price && <p className="mt-1 text-xs text-danger">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">الكمية الافتتاحية <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    {...register("quantity")}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:border-ring"
                  />
                  {errors.quantity && <p className="mt-1 text-xs text-danger">{errors.quantity.message}</p>}
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
                    حفظ الصنف
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
                placeholder="البحث في أصناف المستودع..."
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
            <PackageOpen className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">دليل الأصناف والمواد (المستودع المركزي)</h2>
          </div>
          <DataTable
            rows={filtered}
            columns={[
              { key: "id", header: "رقم الصنف", cell: (r) => <span className="font-bold">{r.id}</span> },
              { key: "name", header: "اسم الصنف", cell: (r) => <span className="font-bold text-primary">{r.name}</span> },
              { key: "category", header: "التصنيف", cell: (r) => r.category },
              { key: "price", header: "السعر", cell: (r) => r.price },
              { key: "quantity", header: "الكمية المتوفرة", cell: (r) => <span className="font-bold">{r.quantity}</span> },
              {
                key: "status",
                header: "مستوى المخزون",
                cell: (r) => (
                  <Badge tone={r.status === "available" ? "success" : r.status === "low_stock" ? "warning" : "danger"}>
                    {r.status === "available" ? "متوفر" : r.status === "low_stock" ? "منخفض المخزون" : "نفدت الكمية"}
                  </Badge>
                ),
              },
            ]}
            empty="لا توجد أصناف في المستودع حالياً."
          />
        </PageCard>
      </div>
    </AppShell>
  );
}
