import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { DollarSign, Printer, Download, Save, Calculator, Wallet, TrendingUp, TrendingDown, ArrowDown, CheckSquare, Square } from "lucide-react";
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
  const { currency, activeStageStaff, activeStageStaffAttendance, allStaffLeaves, allStaffAdvances, addJournalEntry, currentAcademicYearId } = useGlobalStore();
  const [payrollMonth, setPayrollMonth] = useState(currentMonth());
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [approvedMonths, setApprovedMonths] = useState<string[]>([]);
  const [paidMonths, setPaidMonths] = useState<string[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());

  const isApproved = approvedMonths.includes(payrollMonth);
  const isPaid = paidMonths.includes(payrollMonth);

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

  // Select/Deselect all
  const toggleSelectAll = () => {
    if (selectedStaffIds.size === payrollData.length) {
      setSelectedStaffIds(new Set());
    } else {
      setSelectedStaffIds(new Set(payrollData.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedStaffIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStaffIds(newSet);
  };

  const selectedData = useMemo(() => {
    return payrollData.filter(p => selectedStaffIds.has(p.id));
  }, [payrollData, selectedStaffIds]);

  const totals = useMemo(() => ({
    basic: (selectedStaffIds.size > 0 ? selectedData : payrollData).reduce((sum, item) => sum + item.basic, 0),
    allowance: (selectedStaffIds.size > 0 ? selectedData : payrollData).reduce((sum, item) => sum + item.allowance, 0),
    deduction: (selectedStaffIds.size > 0 ? selectedData : payrollData).reduce((sum, item) => sum + item.deduction, 0),
    net: (selectedStaffIds.size > 0 ? selectedData : payrollData).reduce((sum, item) => sum + item.net, 0),
  }), [payrollData, selectedData, selectedStaffIds]);

  const handleApprovePayroll = () => {
    if (isApproved) {
      toast.error("تم اعتماد هذا المسير مسبقاً!");
      return;
    }

    if (selectedStaffIds.size === 0) {
      toast.error("الرجاء تحديد موظف واحد على الأقل لاعتماد راتبه.");
      return;
    }

    // Journal Entry for Accrual (استحقاق الرواتب)
    // Dr: 5101 (Salaries Expense) - Gross
    // Cr: 2101 (Accrued Salaries Payable) - Net
    
    const lines = selectedData.map(payroll => ({
      accountId: "ACC-2101", // مستحقات الموظفين (Payable)
      debit: 0,
      credit: payroll.net,
      referenceId: payroll.id,
      referenceType: 'employee' as const,
      description: `استحقاق راتب ${payrollMonth} - ${payroll.name}`
    }));

    // Aggregate debit line
    lines.push({
      accountId: "ACC-5101", // الرواتب والأجور (Expense)
      debit: totals.net,
      credit: 0,
      referenceId: payrollMonth,
      referenceType: 'employee' as const,
      description: `إجمالي مصروف رواتب شهر ${payrollMonth}`
    });

    addJournalEntry({
      academicYearId: currentAcademicYearId || "",
      date: new Date().toISOString().split("T")[0],
      referenceId: `PR-${payrollMonth}`,
      referenceType: "payroll",
      description: `اعتماد استحقاق رواتب شهر ${payrollMonth}`,
      status: "posted",
      isAutoGenerated: true,
      sourceDocumentType: "payroll" as any,
    }, lines as any);

    setApprovedMonths(prev => [...prev, payrollMonth]);
    toast.success("تم اعتماد استحقاق الرواتب وتوليد القيود المحاسبية بنجاح!");
  };

  const handlePayPayroll = () => {
    if (!isApproved) {
      toast.error("يجب اعتماد الاستحقاق أولاً!");
      return;
    }
    if (isPaid) {
      toast.error("تم صرف هذا المسير مسبقاً!");
      return;
    }

    if (selectedStaffIds.size === 0) {
      toast.error("الرجاء تحديد الموظفين المراد صرف رواتبهم.");
      return;
    }

    // Journal Entry for Payment (صرف الرواتب)
    // Dr: 2101 (Accrued Salaries Payable) - Net
    // Cr: 1102 (Bank) - Net
    
    const lines = selectedData.map(payroll => ({
      accountId: "ACC-2101", // مستحقات الموظفين (Payable)
      debit: payroll.net,
      credit: 0,
      referenceId: payroll.id,
      referenceType: 'employee' as const,
      description: `صرف راتب ${payrollMonth} - ${payroll.name}`
    }));

    // Aggregate credit line to Bank
    lines.push({
      accountId: "ACC-1102", // البنك
      debit: 0,
      credit: totals.net,
      referenceId: payrollMonth,
      referenceType: 'employee' as const,
      description: `إجمالي صرف رواتب شهر ${payrollMonth} (تحويل بنكي)`
    });

    addJournalEntry({
      academicYearId: currentAcademicYearId || "",
      date: new Date().toISOString().split("T")[0],
      referenceId: `PAY-${payrollMonth}`,
      referenceType: "payroll",
      description: `صرف رواتب شهر ${payrollMonth} (تحويل بنكي)`,
      status: "posted",
      isAutoGenerated: true,
      sourceDocumentType: "payroll" as any,
    }, lines as any);

    setPaidMonths(prev => [...prev, payrollMonth]);
    toast.success("تم صرف الرواتب وتحديث الرصيد البنكي بنجاح!");
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
            <Printer className="h-4 w-4" /> طباعة
          </button>
          
          <button 
            onClick={() => {
              if (window.confirm(`هل أنت متأكد من اعتماد استحقاق مسير الرواتب لعدد (${selectedStaffIds.size}) موظفين لشهر ${payrollMonth}؟`)) {
                handleApprovePayroll();
              }
            }}
            disabled={isApproved || selectedStaffIds.size === 0}
            className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-bold shadow-sm transition-colors ${isApproved || selectedStaffIds.size === 0 ? 'bg-muted text-muted-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'}`}
          >
            <Save className="h-4 w-4" /> {isApproved ? "تم الاستحقاق" : "اعتماد الاستحقاق"}
          </button>

          <button 
            onClick={() => {
              if (window.confirm(`هل أنت متأكد من تنفيذ الصرف البنكي لعدد (${selectedStaffIds.size}) موظفين لشهر ${payrollMonth}؟ سيتم خصم ${totals.net} من رصيد البنك.`)) {
                handlePayPayroll();
              }
            }}
            disabled={!isApproved || isPaid || selectedStaffIds.size === 0}
            className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-bold shadow-sm transition-colors ${!isApproved || isPaid || selectedStaffIds.size === 0 ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
          >
            <Wallet className="h-4 w-4" /> {isPaid ? "تم الصرف" : "تنفيذ الصرف"}
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        {!isApproved && (
          <SmartAlert 
            type="info"
            title="نظام الرواتب المتكامل"
            description="الخطوة الأولى: تحديد الموظفين ثم 'اعتماد الاستحقاق' لإثبات الالتزام في دفتر الأستاذ. الخطوة الثانية: 'تنفيذ الصرف' لخصم المبلغ من البنك."
          />
        )}
        {isPaid && (
          <SmartAlert 
            type="success"
            title="عملية مكتملة"
            description="تم صرف الرواتب وتحديث الأرصدة البنكية ومستحقات الموظفين بنجاح."
          />
        )}

        <FilterBar>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">مسير الرواتب</h2>
          </div>
          <div className="flex items-center gap-3">
            <input type="month" value={payrollMonth} onChange={event => setPayrollMonth(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold" />
            <FinancialWorkflowBadge status={isPaid ? "paid" : isApproved ? "approved" : "draft"} />
          </div>
        </FilterBar>

        <div className="grid gap-6 md:grid-cols-4">
          <FinancialCard 
            title="إجمالي الأساسي (للمحددين)" 
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
            title="الصافي المطلوب صرفه" 
            value={totals.net} 
            currency={currency} 
            icon={ArrowDown} 
            colorClass="text-primary bg-primary" 
          />
        </div>

        <PageCard>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm font-bold text-primary">
              <Calculator className="h-4 w-4" />
              يتم احتساب الصافي من الراتب الأساسي + البدلات، ثم خصم الحسميات اليدوية والحضور والإجازات بدون راتب والسلف.
            </div>
            
            <button 
              onClick={toggleSelectAll} 
              className="flex items-center gap-2 text-sm font-bold hover:text-primary transition-colors"
            >
              {selectedStaffIds.size === payrollData.length ? (
                <><CheckSquare className="h-5 w-5 text-primary" /> إلغاء تحديد الكل</>
              ) : (
                <><Square className="h-5 w-5" /> تحديد الكل ({payrollData.length})</>
              )}
            </button>
          </div>
          
          <DataTable
            rows={payrollData}
            columns={[
              { 
                key: "select", 
                header: "", 
                cell: (r) => (
                  <button onClick={() => toggleSelect(r.id)} className="text-muted-foreground hover:text-primary transition-colors">
                    {selectedStaffIds.has(r.id) ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5" />}
                  </button>
                )
              },
              { key: "name", header: "الموظف", cell: (r) => <div className={!selectedStaffIds.has(r.id) ? "opacity-50" : ""}><span className="font-bold">{r.name}</span><div className="text-xs text-muted-foreground">{r.role} - {r.department}</div></div> },
              { key: "basic", header: "الأساسي", cell: (r) => <span className={!selectedStaffIds.has(r.id) ? "opacity-50" : ""}>{r.basic.toLocaleString()} {currency}</span> },
              { key: "allowance", header: "البدلات", cell: (r) => <span className={!selectedStaffIds.has(r.id) ? "opacity-50 text-success" : "text-success"}>+{r.allowance.toLocaleString()} {currency}</span> },
              { key: "attendanceDeduction", header: "الحضور", cell: (r) => r.attendanceDeduction ? <span className={!selectedStaffIds.has(r.id) ? "opacity-50 text-danger" : "text-danger"}>-{r.attendanceDeduction.toLocaleString()} {currency}</span> : "-" },
              { key: "leaveDeduction", header: "إجازات بدون راتب", cell: (r) => r.leaveDeduction ? <span className={!selectedStaffIds.has(r.id) ? "opacity-50 text-danger" : "text-danger"}>-{r.leaveDeduction.toLocaleString()} {currency} ({r.unpaidLeaveDays} يوم)</span> : "-" },
              { key: "advanceDeduction", header: "السلف", cell: (r) => r.advanceDeduction ? <span className={!selectedStaffIds.has(r.id) ? "opacity-50 text-danger" : "text-danger"}>-{r.advanceDeduction.toLocaleString()} {currency}</span> : "-" },
              { key: "deduction", header: "إجمالي الخصومات", cell: (r) => <span className={`font-bold ${!selectedStaffIds.has(r.id) ? "opacity-50 text-danger" : "text-danger"}`}>-{r.deduction.toLocaleString()} {currency}</span> },
              { key: "net", header: "الصافي المستحق", cell: (r) => <span className={`font-bold text-lg ${!selectedStaffIds.has(r.id) ? "opacity-50" : ""}`}>{r.net.toLocaleString()} {currency}</span> },
            ]}
          />
        </PageCard>
      </div>

      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title={`مسير الرواتب - ${payrollMonth}`}
        data={selectedStaffIds.size > 0 ? selectedData : payrollData}
        templates={printTemplates}
      />
    </AppShell>
  );
}
