import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { DollarSign, Printer, Download, Save, Calculator, Wallet, TrendingUp, TrendingDown, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useState, useMemo } from "react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { FinancialCard, SmartAlert, FilterBar, FinancialWorkflowBadge } from "@/components/financial-components";

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
      const rate = (staff as any).basicSalary || 0;
      const allowance = (staff as any).allowance || 0;
      const manualDeduction = (staff as any).deduction || 0;
      
      const attendanceRecords = activeStageStaffAttendance.filter(record => record.staffId === staff.id && record.date.startsWith(payrollMonth));
      
      let calculatedBasic = 0;
      let attendanceDeduction = 0;
      let unpaidLeaveDays = 0;
      let leaveDeduction = 0;
      let details = "";

      if (staff.paymentType === "PerLesson") {
        const attendedLessons = attendanceRecords.filter(r => r.status === "present").length;
        calculatedBasic = attendedLessons * rate;
        details = `${attendedLessons} حصة × ${rate}`;
      } else if (staff.paymentType === "Daily") {
        const attendedDays = attendanceRecords.filter(r => r.status === "present" || r.status === "late").length;
        calculatedBasic = attendedDays * rate;
        attendanceDeduction = attendanceRecords.reduce((sum, record) => sum + (record.deductionAmount || 0), 0);
        details = `${attendedDays} يوم × ${rate}`;
      } else {
        // Default Monthly
        calculatedBasic = rate;
        attendanceDeduction = attendanceRecords.reduce((sum, record) => sum + (record.deductionAmount || 0), 0);
        unpaidLeaveDays = allStaffLeaves
          .filter(leave => leave.staffId === staff.id && leave.status === "approved" && leave.type === "issued")
          .reduce((sum, leave) => sum + getOverlapDaysInMonth(leave.startDate, leave.endDate, payrollMonth), 0);
        const dailyRate = Math.round(rate / 30);
        leaveDeduction = unpaidLeaveDays * dailyRate;
        details = "راتب شهري ثابت";
      }

      const advanceDeduction = allStaffAdvances
        .filter((advance: any) => advance.staffId === staff.id && advance.deductionMonth === payrollMonth && advance.status === "paid")
        .reduce((sum: number, advance: any) => sum + (advance.amount || 0), 0);
        
      const totalDeduction = manualDeduction + attendanceDeduction + leaveDeduction + advanceDeduction;
      return {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        department: staff.department,
        paymentType: staff.paymentType || "Monthly",
        details,
        basic: calculatedBasic,
        allowance,
        manualDeduction,
        attendanceDeduction,
        unpaidLeaveDays,
        leaveDeduction,
        advanceDeduction,
        deduction: totalDeduction,
        net: Math.max(0, calculatedBasic + allowance - totalDeduction),
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
        { label: "نظام الدفع", key: "paymentType" },
        { label: "المستحق الأساسي", key: "basic" },
        { label: "البدلات/المكافآت", key: "allowance" },
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
        { label: "حساب الأساسي", key: "details" },
        { label: "المبلغ الأساسي", key: "basic" },
        { label: "المكافآت والبدلات", key: "allowance" },
        { label: "إجمالي الخصومات", key: "deduction" },
        { label: "صافي الراتب", key: "net" }
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
            onClick={() => {
              if (window.confirm(`هل أنت متأكد من اعتماد مسير الرواتب لشهر ${payrollMonth}؟ لا يمكن التراجع عن هذا الإجراء.`)) {
                handleApprovePayroll();
              }
            }}
            disabled={isApproved}
            className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-bold shadow-sm transition-colors ${isApproved ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
          >
            <Save className="h-4 w-4" /> {isApproved ? "تم الاعتماد" : `اعتماد مسير ${payrollMonth}`}
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        {!isApproved && (
          <SmartAlert 
            type="info"
            title="التكامل المالي الآلي"
            message="اعتماد مسير الرواتب سيقوم تلقائياً بتوليد سندات صرف لكل موظف في قسم المصروفات المالية وتحديث الرصيد المالي للمدرسة."
          />
        )}
        {isApproved && (
          <SmartAlert 
            type="success"
            title="تم اعتماد مسير الرواتب"
            message="تم اعتماد هذا المسير وترحيل المصروفات آلياً إلى المركز المالي بنجاح. لا يمكن التعديل عليه."
          />
        )}

        <FilterBar>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">مسير الرواتب</h2>
          </div>
          <div className="flex items-center gap-3">
            <input type="month" value={payrollMonth} onChange={event => setPayrollMonth(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold" />
            <FinancialWorkflowBadge status={isApproved ? "approved" : "pending"} />
          </div>
        </FilterBar>

        <div className="grid gap-6 md:grid-cols-4">
          <FinancialCard 
            title="إجمالي الأساسي" 
            value={totals.basic} 
            currency={currency} 
            icon={Wallet} 
            colorClass="text-foreground bg-muted" 
          />
          <FinancialCard 
            title="البدلات" 
            value={totals.allowance} 
            currency={currency} 
            icon={TrendingUp} 
            colorClass="text-success bg-success" 
          />
          <FinancialCard 
            title="الخصومات" 
            value={totals.deduction} 
            currency={currency} 
            icon={TrendingDown} 
            colorClass="text-danger bg-danger" 
          />
          <FinancialCard 
            title="الصافي المستحق" 
            value={totals.net} 
            currency={currency} 
            icon={ArrowDown} 
            colorClass="text-primary bg-primary" 
          />
        </div>

        <PageCard>
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
