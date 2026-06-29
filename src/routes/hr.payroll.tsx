import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { DollarSign, Printer, Download, Save, Calculator } from "lucide-react";
import { toast } from "sonner";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useState, useMemo } from "react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/hr/payroll")({
  component: HrPayroll,
});

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getOverlapDaysInMonth(startDate: string, endDate: string, month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const monthStart = new Date(year, monthIndex - 1, 1);
  const monthEnd = new Date(year, monthIndex, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < monthStart || start > monthEnd) return 0;
  const overlapStart = start > monthStart ? start : monthStart;
  const overlapEnd = end < monthEnd ? end : monthEnd;
  return Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / 86400000) + 1;
}

function HrPayroll() {
  const { currency, activeStageStaff, activeStageStaffAttendance, allStaffLeaves, allStaffAdvances, addExpense } = useGlobalStore();
  const [payrollMonth, setPayrollMonth] = useState(currentMonth());
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [approvedMonths, setApprovedMonths] = useState<string[]>([]);
  const isApproved = approvedMonths.includes(payrollMonth);

  const payrollData = useMemo(() => {
    return activeStageStaff.filter(staff => !staff.isDeleted && staff.status !== "terminated").map(staff => {
      const basic = staff.basicSalary || 0;
      const allowance = staff.allowance || 0;
      const manualDeduction = staff.deduction || 0;
      const dailyRate = Math.round(basic / 30);
      const attendanceDeduction = activeStageStaffAttendance
        .filter(record => record.staffId === staff.id && record.date.startsWith(payrollMonth))
        .reduce((sum, record) => sum + (record.deductionAmount || 0), 0);
      const unpaidLeaveDays = allStaffLeaves
        .filter(leave => leave.staffId === staff.id && leave.status === "approved" && leave.type === "unpaid")
        .reduce((sum, leave) => sum + getOverlapDaysInMonth(leave.startDate, leave.endDate, payrollMonth), 0);
      const leaveDeduction = unpaidLeaveDays * dailyRate;
      const advanceDeduction = allStaffAdvances
        .filter((advance: any) => advance.staffId === staff.id && advance.deductionMonth === payrollMonth && advance.status === "paid")
        .reduce((sum: number, advance: any) => sum + (advance.amount || 0), 0);
      const totalDeduction = manualDeduction + attendanceDeduction + leaveDeduction + advanceDeduction;
      return {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        department: staff.department,
        basic,
        allowance,
        manualDeduction,
        attendanceDeduction,
        unpaidLeaveDays,
        leaveDeduction,
        advanceDeduction,
        deduction: totalDeduction,
        net: Math.max(0, basic + allowance - totalDeduction),
      };
    });
  }, [activeStageStaff, activeStageStaffAttendance, allStaffAdvances, allStaffLeaves, payrollMonth]);

  const totals = useMemo(() => ({
    basic: payrollData.reduce((sum, item) => sum + item.basic, 0),
    allowance: payrollData.reduce((sum, item) => sum + item.allowance, 0),
    deduction: payrollData.reduce((sum, item) => sum + item.deduction, 0),
    net: payrollData.reduce((sum, item) => sum + item.net, 0),
  }), [payrollData]);

  const handleApprovePayroll = () => {
    if (isApproved) {
      toast.error("تم اعتماد هذا المسير مسبقاً!");
      return;
    }

    // Deep Integration: Automatically create expenses for each staff member's net salary
    payrollData.forEach(payroll => {
      addExpense({
        title: `راتب شهر ${payrollMonth} - ${payroll.name}`,
        amount: payroll.net,
        date: new Date().toISOString().split("T")[0],
        categoryId: "EXPCAT-1", // Payroll category
        beneficiary: payroll.name,
        method: "bank_transfer",
        notes: `تم الاعتماد من مسير الرواتب. خصومات الحضور/الإجازات/السلف: ${payroll.deduction.toLocaleString()} ${currency}`
      });
    });

    setApprovedMonths(prev => [...prev, payrollMonth]);
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
        { label: "خصومات الحضور", key: "attendanceDeduction" },
        { label: "خصومات الإجازات", key: "leaveDeduction" },
        { label: "السلف", key: "advanceDeduction" },
        { label: "إجمالي الخصومات", key: "deduction" },
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
        { key: "receiptReason", label: "البيان", type: "text", defaultValue: `مفردات راتب شهر ${payrollMonth}` }
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
            <Save className="h-4 w-4" /> {isApproved ? "تم الاعتماد" : `اعتماد مسير ${payrollMonth}`}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">إجمالي الأساسي</p>
            <p className="mt-1 text-2xl font-black">{totals.basic.toLocaleString()} {currency}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">البدلات</p>
            <p className="mt-1 text-2xl font-black text-success">{totals.allowance.toLocaleString()} {currency}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">الخصومات</p>
            <p className="mt-1 text-2xl font-black text-danger">{totals.deduction.toLocaleString()} {currency}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">الصافي المستحق</p>
            <p className="mt-1 text-2xl font-black text-primary">{totals.net.toLocaleString()} {currency}</p>
          </div>
        </div>

        <PageCard>
          <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">مسير الرواتب - {payrollMonth}</h2>
            </div>
            <div className="flex items-center gap-2">
              <input type="month" value={payrollMonth} onChange={event => setPayrollMonth(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold" />
              <Badge tone={isApproved ? "success" : "warning"}>{isApproved ? "معتمد ومرحل" : "مسودة"}</Badge>
            </div>
          </div>
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm font-bold text-primary">
            <Calculator className="h-4 w-4" />
            يتم احتساب الصافي من الراتب الأساسي + البدلات، ثم خصم الحسميات اليدوية والحضور والإجازات بدون راتب والسلف.
          </div>
          <DataTable
            rows={payrollData}
            columns={[
              { key: "name", header: "الموظف", cell: (r) => <div><span className="font-bold">{r.name}</span><div className="text-xs text-muted-foreground">{r.role} - {r.department}</div></div> },
              { key: "basic", header: "الأساسي", cell: (r) => `${r.basic.toLocaleString()} ${currency}` },
              { key: "allowance", header: "البدلات", cell: (r) => <span className="text-success">+{r.allowance.toLocaleString()} {currency}</span> },
              { key: "attendanceDeduction", header: "الحضور", cell: (r) => r.attendanceDeduction ? <span className="text-danger">-{r.attendanceDeduction.toLocaleString()} {currency}</span> : "-" },
              { key: "leaveDeduction", header: "إجازات بدون راتب", cell: (r) => r.leaveDeduction ? <span className="text-danger">-{r.leaveDeduction.toLocaleString()} {currency} ({r.unpaidLeaveDays} يوم)</span> : "-" },
              { key: "advanceDeduction", header: "السلف", cell: (r) => r.advanceDeduction ? <span className="text-danger">-{r.advanceDeduction.toLocaleString()} {currency}</span> : "-" },
              { key: "deduction", header: "إجمالي الخصومات", cell: (r) => <span className="font-bold text-danger">-{r.deduction.toLocaleString()} {currency}</span> },
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
        title={`مسير الرواتب - ${payrollMonth}`}
        data={payrollData}
        templates={printTemplates}
      />
    </AppShell>
  );
}
