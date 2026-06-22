import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { DollarSign, Printer, Download, Save } from "lucide-react";
import { toast } from "sonner";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useState, useMemo } from "react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/hr/payroll")({
  component: HrPayroll,
});

function HrPayroll() {
  const { currency, activeStageStaff, addExpense  } = useGlobalStore();
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const payrollData = useMemo(() => {
    return activeStageStaff.map(staff => ({
      id: staff.id,
      name: staff.name,
      basic: staff.basicSalary || 5000,
      allowance: staff.allowance || 0,
      deduction: staff.deduction || 0,
      net: (staff.basicSalary || 5000) + (staff.allowance || 0) - (staff.deduction || 0)
    }));
  }, [activeStageStaff]);

  const handleApprovePayroll = () => {
    if (isApproved) {
      toast.error("تم اعتماد هذا المسير مسبقاً!");
      return;
    }

    // Deep Integration: Automatically create expenses for each staff member's net salary
    payrollData.forEach(payroll => {
      addExpense({
        title: `راتب شهر سبتمبر 2023 - ${payroll.name}`,
        amount: payroll.net,
        date: new Date().toISOString().split("T")[0],
        categoryId: "EXPCAT-1", // Payroll category
        beneficiary: payroll.name,
        method: "bank_transfer",
        notes: "تم الاعتماد من مسير الرواتب"
      });
    });

    setIsApproved(true);
    toast.success("تم اعتماد المسير بنجاح، وتم ترحيل المصروفات آلياً إلى قسم المالية!");
  };

  const printTemplates: PrintTemplate[] = [
    {
      id: "payroll-report",
      name: "مسير الرواتب",
      category: "شؤون الموظفين",
      type: "table",
      columns: [
        { label: "الموظف", key: "name" },
        { label: "الأساسي", key: "basic" },
        { label: "البدلات", key: "allowance" },
        { label: "الخصومات", key: "deduction" },
        { label: "الصافي", key: "net" },
      ]
    },
    {
      id: "payroll-receipt",
      name: "مفردات راتب (إيصالات)",
      category: "شؤون الموظفين",
      type: "receipt",
      columns: [
        { label: "الصافي المستحق", key: "net" }
      ],
      customControls: [
        { key: "receiptReason", label: "البيان", type: "text", defaultValue: "مفردات راتب شهر سبتمبر 2023" }
      ]
    }
  ];

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الموارد البشرية" },
        { label: "مسير الرواتب" },
      ]}
      actions={
        <div className="flex gap-2">
          <button onClick={() => setIsPrintOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm hover:bg-accent font-bold">
            <Printer className="h-4 w-4" /> طباعة المسير
          </button>
          <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm hover:bg-accent">
            <Download className="h-4 w-4" /> تصدير للبنك
          </button>
          <button 
            onClick={handleApprovePayroll} 
            disabled={isApproved}
            className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-bold shadow-sm transition-colors ${isApproved ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
          >
            <Save className="h-4 w-4" /> {isApproved ? "تم الاعتماد" : "اعتماد المسير (سبتمبر 2023)"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <PageCard>
          <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">مسير الرواتب - شهر سبتمبر 2023</h2>
            </div>
            <Badge tone={isApproved ? "success" : "warning"}>{isApproved ? "معتمد ومرحل" : "مسودة (غير معتمد)"}</Badge>
          </div>
          <DataTable
            rows={payrollData}
            columns={[
              { key: "name", header: "الموظف", cell: (r) => <span className="font-bold">{r.name}</span> },
              { key: "basic", header: "الراتب الأساسي", cell: (r) => `${r.basic.toLocaleString()} {currency}` },
              { key: "allowance", header: "البدلات / المكافآت", cell: (r) => <span className="text-success">+{r.allowance.toLocaleString()} {currency}</span> },
              { key: "deduction", header: "الخصومات / غياب", cell: (r) => <span className="text-danger">-{r.deduction.toLocaleString()} {currency}</span> },
              { key: "net", header: "الصافي المستحق", cell: (r) => <span className="font-bold text-lg">{r.net.toLocaleString()} {currency}</span> },
              {
                key: "actions",
                header: "مفردات",
                cell: () => (
                  <button className="rounded-md p-2 hover:bg-accent">
                    <Printer className="h-4 w-4" />
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
        title="مسير الرواتب - شهر سبتمبر 2023"
        data={payrollData}
        templates={printTemplates}
      />
    </AppShell>
  );
}
