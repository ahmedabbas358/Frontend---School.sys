import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import {
  Building2,
  Wrench,
  BookOpen,
  Package,
  HeartPulse,
  Bus,
  TrendingUp,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts";

export const Route = createFileRoute("/facilities/dashboard")({
  head: () => ({ meta: [{ title: "إحصاءات المرافق | منصة مدارس" }] }),
  component: FacilitiesDashboard,
});

const PALETTE = ["#2563EB", "#22C55E", "#F59E0B", "#EF4444", "#0EA5E9"];

function StatCard({ icon: Icon, label, value, desc, tone = "primary" }: any) {
  const t: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    danger: "bg-danger/10 text-danger",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${t[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 text-2xl font-extrabold tabular">{value}</div>
      <div className="text-sm font-bold mt-1">{label}</div>
      {desc && <div className="text-xs text-muted-foreground mt-1">{desc}</div>}
    </div>
  );
}

function FacilitiesDashboard() {
  const { allMaintenanceRequests, allRooms, activeStageTextbooks, allInventoryItems, activeStageClinicVisits } = useGlobalStore();

  const maintenancePending = allMaintenanceRequests.filter(m => m.status !== "completed").length;
  const maintenanceCompleted = allMaintenanceRequests.filter(m => m.status === "completed").length;
  const totalBooks = activeStageTextbooks.reduce((acc: number, curr: any) => acc + curr.copies, 0);
  // Available = total copies minus distributed count (simplified)
  const availableBooks = activeStageTextbooks.reduce((acc: number, curr: any) => acc + curr.copies, 0);
  const lowStockItems = allInventoryItems.filter(i => i.status === "low_stock" || i.status === "out_of_stock").length;

  const roomDistribution = [
    { name: "فصول دراسية", value: allRooms.filter(r => r.type === "classroom").length },
    { name: "مختبرات", value: allRooms.filter(r => r.type === "lab").length },
    { name: "مكاتب إدارية", value: allRooms.filter(r => r.type === "office").length },
    { name: "قاعات عامة", value: allRooms.filter(r => r.type === "hall").length },
  ].filter(d => d.value > 0);

  const maintenanceTrend = [
    { name: "صيانة معلقة", value: maintenancePending },
    { name: "صيانة منجزة", value: maintenanceCompleted },
  ];

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "المرافق والخدمات" }, { label: "لوحة الإحصاءات" }]}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">إحصاءات المرافق والخدمات</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">نظرة شاملة على جميع مرافق المدرسة وحالة الخدمات</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard icon={Wrench} label="طلبات صيانة قيد التنفيذ" value={maintenancePending} tone={maintenancePending > 0 ? "warning" : "success"} />
          <StatCard icon={Building2} label="إجمالي القاعات" value={allRooms.length} desc={`${allRooms.filter(r => r.status === "available").length} متاحة`} tone="primary" />
          <StatCard icon={BookOpen} label="مكتبة المدرسة" value={totalBooks} desc={`${availableBooks} كتاب متاح`} tone="primary" />
          <StatCard icon={Package} label="نواقص المستودع" value={lowStockItems} tone={lowStockItems > 0 ? "danger" : "success"} />
          <StatCard icon={HeartPulse} label="زيارات العيادة" value={activeStageClinicVisits.length} desc="إجمالي الزيارات" tone="primary" />
          <StatCard icon={Bus} label="النقل المدرسي" value={2} desc="إجمالي المسارات" tone="primary" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <PageCard title="توزيع المباني والقاعات">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roomDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>
                    {roomDistribution.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </PageCard>

          <PageCard title="حالة الصيانة">
             <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintenanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#F59E0B" radius={[8, 8, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </PageCard>
        </div>
      </div>
    </AppShell>
  );
}
