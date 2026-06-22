import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { MapPin, Plus, Settings, Printer } from "lucide-react";
import { useState } from "react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/transport/routes")({
  component: TransportRoutes,
});

const mockRoutes = [
  { id: "RT-01", name: "مسار الياسمين - الملقا", driver: "عبدالله صالح", fee: "3,500 ر.س", stops: 12, vehicle: "حافلة رقم 15" },
  { id: "RT-02", name: "مسار النرجس - العارض", driver: "محمد سعيد", fee: "4,000 ر.س", stops: 8, vehicle: "حافلة رقم 08" },
];

function TransportRoutes() {
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const printTemplates: PrintTemplate[] = [
    {
      id: "routes-list",
      name: "دليل مسارات الحافلات",
      category: "النقل المدرسي",
      type: "table",
      columns: [
        { label: "رقم المسار", key: "id" },
        { label: "اسم المسار", key: "name" },
        { label: "السائق", key: "driver" },
        { label: "المركبة", key: "vehicle" },
        { label: "المحطات", key: "stops" },
        { label: "التكلفة", key: "fee" },
      ]
    }
  ];

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "النقل المدرسي" },
        { label: "مسارات الحافلات" },
      ]}
      actions={
        <div className="flex gap-2">
          <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> مسار جديد
          </button>
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary/10 px-4 text-sm font-bold text-primary hover:bg-primary/20 transition-all border border-primary/20"
          >
            <Printer className="h-4 w-4" /> طباعة المسارات
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <PageCard>
          <div className="mb-4 flex items-center gap-2 border-b border-border pb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">المسارات الحالية</h2>
          </div>
          <DataTable
            rows={mockRoutes}
            columns={[
              { key: "id", header: "رقم المسار", cell: (r) => <span className="font-bold">{r.id}</span> },
              { key: "name", header: "اسم المسار / المنطقة", cell: (r) => r.name },
              { key: "driver", header: "السائق", cell: (r) => r.driver },
              { key: "vehicle", header: "المركبة", cell: (r) => <span className="text-muted-foreground">{r.vehicle}</span> },
              { key: "stops", header: "عدد المحطات", cell: (r) => `${r.stops} محطات` },
              { key: "fee", header: "التكلفة السنوية", cell: (r) => <span className="font-bold text-success">{r.fee}</span> },
              {
                key: "actions",
                header: "إعدادات",
                cell: () => (
                  <button className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                    <Settings className="h-4 w-4" />
                  </button>
                ),
              },
            ]}
          />
        </PageCard>
      </div>

      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="دليل مسارات الحافلات"
        data={mockRoutes}
        templates={printTemplates}
      />
    </AppShell>
  );
}
