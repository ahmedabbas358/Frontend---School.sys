import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { usersAccounts } from "@/lib/mock-data";
import { Plus, Pencil, KeyRound } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "إدارة المستخدمين" }] }),
  component: () => (
    <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الإدارة" }, { label: "المستخدمون" }]}
      actions={<button className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> مستخدم جديد</button>}>
      <PageCard>
        <DataTable rows={usersAccounts} columns={[
          { key: "u", header: "اسم المستخدم", cell: (u) => <span className="font-bold tabular">{u.username}</span> },
          { key: "n", header: "الاسم الكامل", cell: (u) => u.fullName },
          { key: "r", header: "الدور", cell: (u) => <Badge tone="primary">{u.role}</Badge> },
          { key: "s", header: "الحالة", cell: (u) => <Badge tone={u.status === "active" ? "success" : "danger"}>{u.status === "active" ? "نشط" : "معطل"}</Badge> },
          { key: "l", header: "آخر دخول", cell: (u) => <span className="tabular text-xs">{u.lastLogin}</span> },
          { key: "act", header: "", cell: () => (
            <div className="flex gap-1">
              <button className="rounded-md p-2 hover:bg-accent"><Pencil className="h-4 w-4" /></button>
              <button className="rounded-md p-2 hover:bg-accent"><KeyRound className="h-4 w-4" /></button>
            </div>
          )},
        ]} />
      </PageCard>
    </AppShell>
  ),
});
