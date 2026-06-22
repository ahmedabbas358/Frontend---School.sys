import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { rolesCatalog, usersAccounts } from "@/lib/mock-data";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/roles")({
  head: () => ({ meta: [{ title: "الأدوار" }] }),
  component: () => {
    const rows = rolesCatalog.map((r) => ({ id: r, name: r, count: usersAccounts.filter((u) => u.role === r).length }));
    return (
      <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الإدارة" }, { label: "الأدوار" }]}
        actions={<button className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> دور جديد</button>}>
        <PageCard>
          <DataTable rows={rows} columns={[
            { key: "n", header: "اسم الدور", cell: (r) => <span className="font-bold">{r.name}</span> },
            { key: "c", header: "عدد المستخدمين", cell: (r) => <span className="tabular">{r.count}</span> },
            { key: "act", header: "", cell: () => (
              <div className="flex gap-1">
                <button className="rounded-md p-2 hover:bg-accent"><Pencil className="h-4 w-4" /></button>
                <button className="rounded-md p-2 text-danger hover:bg-danger/10"><Trash2 className="h-4 w-4" /></button>
              </div>
            )},
          ]} />
        </PageCard>
      </AppShell>
    );
  },
});
