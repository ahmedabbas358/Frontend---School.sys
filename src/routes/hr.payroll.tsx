import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { 
  DollarSign, Printer, Download, Save, Calculator, Wallet, 
  TrendingUp, TrendingDown, ArrowDown, CheckSquare, Square, 
  Edit3, Sliders, Layers, Filter, CheckCircle2, AlertCircle, X, Info, Clock, Building,
  BarChart3, PieChart, CalendarDays, Users, Award, Sparkles, Sun, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage, EducationalStage } from "@/contexts/StageContext";
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

const STAGE_NAMES_AR: Record<string, string> = {
  kindergarten: "رياض الأطفال",
  primary: "المرحلة الابتدائية",
  middle: "المرحلة المتوسطة",
  high: "المرحلة الثانوية",
  all: "جميع المراحل / إداري",
};

interface ManualPayrollOverride {
  basicOverride?: number;
  allowanceOverride?: number;
  manualDeductionOverride?: number;
  attendanceDeductionOverride?: number;
  leaveDeductionOverride?: number;
  advanceDeductionOverride?: number;
  netAdjustment?: number;
  adjustmentReason?: string;
}

function HrPayroll() {
  const { stage: activeStage, getStageLabel } = useStage();
  const { 
    currency, 
    allStaff, 
    allEmployeeAssignments, 
    allTeachingAssignments,
    allStaffAttendance, 
    allStaffLeaves, 
    allStaffAdvances, 
    addJournalEntry, 
    currentAcademicYearId 
  } = useGlobalStore();

  const [payrollMonth, setPayrollMonth] = useState(currentMonth());
  const [payCycleFilter, setPayCycleFilter] = useState<string>("all"); // all | Monthly | Weekly | PerLesson | Daily
  const [isMergedView, setIsMergedView] = useState<boolean>(true); // true = merged cross-stage view, false = active stage view only
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [approvedMonths, setApprovedMonths] = useState<string[]>([]);
  const [paidMonths, setPaidMonths] = useState<string[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());

  // Manual Payroll Overrides State: Map of `${staffId}_${month}` -> ManualPayrollOverride
  const [manualOverrides, setManualOverrides] = useState<Record<string, ManualPayrollOverride>>({});

  // Active Override Modal State
  const [editingStaffOverride, setEditingStaffOverride] = useState<any | null>(null);

  const isApproved = approvedMonths.includes(payrollMonth);
  const isPaid = paidMonths.includes(payrollMonth);

  // Helper to resolve stage names string for staff
  const getStaffStagesLabel = (staffId: string, primaryStage: string) => {
    const assignments = (allEmployeeAssignments || []).filter(a => a.employeeId === staffId && a.academicYearId === currentAcademicYearId);
    if (assignments.length === 0) return STAGE_NAMES_AR[primaryStage] || primaryStage;
    const stagesSet = new Set(assignments.map(a => STAGE_NAMES_AR[a.stage] || a.stage));
    return Array.from(stagesSet).join(" + ");
  };

  // Cross-Stage Aggregated Payroll Data
  const payrollData = useMemo(() => {
    // Determine target staff pool (all staff vs active stage only based on isMergedView toggle)
    let staffPool = (allStaff || []).filter(staff => !staff.isDeleted && staff.status !== "terminated");

    if (!isMergedView) {
      staffPool = staffPool.filter(staff => {
        const hasAssignment = (allEmployeeAssignments || []).some(a => a.employeeId === staff.id && a.academicYearId === currentAcademicYearId && (a.stage === activeStage || a.stage === "all"));
        return hasAssignment || staff.stage === activeStage || staff.stage === "all";
      });
    }

    return staffPool.map(staff => {
      const overrideKey = `${staff.id}_${payrollMonth}`;
      const override = manualOverrides[overrideKey] || {};

      // Multi-stage assignments for this staff
      const staffAssignments = (allEmployeeAssignments || []).filter(a => a.employeeId === staff.id && a.academicYearId === currentAcademicYearId);
      const teachingAssns = (allTeachingAssignments || []).filter(t => t.teacherId === staff.id);

      // Consolidate paymentType & rates
      const paymentType = staff.paymentType || staffAssignments[0]?.paymentType || "Monthly";
      const baseRate = staff.basicSalary || staffAssignments[0]?.basicSalary || (staff as any).rate || 0;
      const baseAllowance = staff.allowance || staffAssignments.reduce((sum, a) => sum + (a.allowance || 0), 0) || 0;
      const baseManualDeduction = staff.deduction || staffAssignments.reduce((sum, a) => sum + (a.deduction || 0), 0) || 0;

      // Attendance records across all assigned stages
      const attendanceRecords = (allStaffAttendance || []).filter(r => r.staffId === staff.id && r.date.startsWith(payrollMonth));

      let calculatedBasic = baseRate;
      let calculatedAttendanceDeduction = 0;
      let unpaidLeaveDays = 0;
      let calculatedLeaveDeduction = 0;
      let details = "";
      let totalLessonsTaught = 0;

      if (paymentType === "PerLesson") {
        // Count total lessons from attendance or teaching schedule
        totalLessonsTaught = attendanceRecords.filter(r => r.status === "present").length;
        if (totalLessonsTaught === 0 && teachingAssns.length > 0) {
          // Estimate from schedule slots if no attendance logged yet (e.g. 4 lessons/week * 4 weeks)
          totalLessonsTaught = teachingAssns.length * 4;
        }
        calculatedBasic = totalLessonsTaught * (staff.rate || baseRate || 100);
        details = `${totalLessonsTaught} حصة × ${staff.rate || baseRate || 100} ${currency}`;
      } else if (paymentType === "Weekly") {
        const weeksCount = 4;
        const weeklyRate = (staff as any).rate || Math.round(baseRate / 4) || baseRate;
        calculatedBasic = weeklyRate * weeksCount;
        calculatedAttendanceDeduction = attendanceRecords.reduce((sum, r) => sum + (r.deductionAmount || 0), 0);
        details = `${weeksCount} أسابيع × ${weeklyRate} ${currency}`;
      } else if (paymentType === "Daily") {
        const attendedDays = attendanceRecords.filter(r => r.status === "present" || r.status === "late").length;
        const dailyRate = (staff as any).rate || Math.round(baseRate / 30) || baseRate;
        calculatedBasic = attendedDays * dailyRate;
        calculatedAttendanceDeduction = attendanceRecords.reduce((sum, r) => sum + (r.deductionAmount || 0), 0);
        details = `${attendedDays} يوم × ${dailyRate} ${currency}`;
      } else {
        // Monthly
        calculatedBasic = baseRate;
        calculatedAttendanceDeduction = attendanceRecords.reduce((sum, r) => sum + (r.deductionAmount || 0), 0);
        unpaidLeaveDays = (allStaffLeaves || [])
          .filter(leave => leave.staffId === staff.id && leave.status === "approved" && leave.type === "issued")
          .reduce((sum, leave) => sum + getOverlapDaysInMonth(leave.startDate, leave.endDate, payrollMonth), 0);
        const dailyRate = Math.round(baseRate / 30);
        calculatedLeaveDeduction = unpaidLeaveDays * dailyRate;
        details = "راتب شهري ثابت";
      }

      // Advance deductions for month
      const calculatedAdvanceDeduction = (allStaffAdvances || [])
        .filter((advance: any) => advance.staffId === staff.id && advance.deductionMonth === payrollMonth && advance.status === "paid")
        .reduce((sum: number, advance: any) => sum + (advance.amount || 0), 0);

      // Apply Manual Overrides if present
      const finalBasic = override.basicOverride !== undefined ? override.basicOverride : calculatedBasic;
      const finalAllowance = override.allowanceOverride !== undefined ? override.allowanceOverride : baseAllowance;
      const finalManualDeduction = override.manualDeductionOverride !== undefined ? override.manualDeductionOverride : baseManualDeduction;
      const finalAttendanceDeduction = override.attendanceDeductionOverride !== undefined ? override.attendanceDeductionOverride : calculatedAttendanceDeduction;
      const finalLeaveDeduction = override.leaveDeductionOverride !== undefined ? override.leaveDeductionOverride : calculatedLeaveDeduction;
      const finalAdvanceDeduction = override.advanceDeductionOverride !== undefined ? override.advanceDeductionOverride : calculatedAdvanceDeduction;
      const netAdjustment = override.netAdjustment || 0;
      const adjustmentReason = override.adjustmentReason || "";

      const totalDeductions = finalManualDeduction + finalAttendanceDeduction + finalLeaveDeduction + finalAdvanceDeduction;
      const grossSalary = finalBasic + finalAllowance;
      const netSalary = Math.max(0, grossSalary - totalDeductions + netAdjustment);

      const stagesLabel = getStaffStagesLabel(staff.id, staff.stage);
      const isMultiStage = staffAssignments.length > 1;

      return {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        department: staff.department,
        primaryStage: staff.stage,
        stagesLabel,
        isMultiStage,
        paymentType,
        details,
        basic: finalBasic,
        allowance: finalAllowance,
        manualDeduction: finalManualDeduction,
        attendanceDeduction: finalAttendanceDeduction,
        unpaidLeaveDays,
        leaveDeduction: finalLeaveDeduction,
        advanceDeduction: finalAdvanceDeduction,
        netAdjustment,
        adjustmentReason,
        deduction: totalDeductions,
        gross: grossSalary,
        net: netSalary,
        hasOverride: Object.keys(override).length > 0,
        override,
      };
    }).filter(p => {
      if (payCycleFilter !== "all" && p.paymentType !== payCycleFilter) return false;
      return true;
    });
  }, [allStaff, allEmployeeAssignments, allTeachingAssignments, allStaffAttendance, allStaffLeaves, allStaffAdvances, payrollMonth, payCycleFilter, isMergedView, activeStage, currentAcademicYearId, manualOverrides, currency]);

  // Select / Deselect All
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

  const targetList = selectedStaffIds.size > 0 ? selectedData : payrollData;

  const totals = useMemo(() => ({
    basic: targetList.reduce((sum, item) => sum + item.basic, 0),
    allowance: targetList.reduce((sum, item) => sum + item.allowance, 0),
    deduction: targetList.reduce((sum, item) => sum + item.deduction, 0),
    adjustments: targetList.reduce((sum, item) => sum + item.netAdjustment, 0),
    gross: targetList.reduce((sum, item) => sum + item.gross, 0),
    net: targetList.reduce((sum, item) => sum + item.net, 0),
  }), [targetList]);

  // Handle Save Manual Override Modal
  const handleSaveOverride = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingStaffOverride) return;

    const formData = new FormData(e.currentTarget);
    const key = `${editingStaffOverride.id}_${payrollMonth}`;

    const overrideObj: ManualPayrollOverride = {
      basicOverride: Number(formData.get("basicOverride")),
      allowanceOverride: Number(formData.get("allowanceOverride")),
      manualDeductionOverride: Number(formData.get("manualDeductionOverride")),
      attendanceDeductionOverride: Number(formData.get("attendanceDeductionOverride")),
      leaveDeductionOverride: Number(formData.get("leaveDeductionOverride")),
      advanceDeductionOverride: Number(formData.get("advanceDeductionOverride")),
      netAdjustment: Number(formData.get("netAdjustment")),
      adjustmentReason: formData.get("adjustmentReason") as string,
    };

    setManualOverrides(prev => ({
      ...prev,
      [key]: overrideObj
    }));

    toast.success(`تم حفظ التعديلات والتحكم اليدوي لراتب الموظف ${editingStaffOverride.name} بنجاح`);
    setEditingStaffOverride(null);
  };

  const handleClearOverride = (staffId: string) => {
    const key = `${staffId}_${payrollMonth}`;
    setManualOverrides(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    toast.success("تم إزالة التعديل اليدوي وإعادة الاحتساب الآلي بنجاح");
  };

  // Accounting Approval Journal Entry
  const handleApprovePayroll = () => {
    if (isApproved) {
      toast.error("تم اعتماد هذا المسير مسبقاً!");
      return;
    }

    if (selectedStaffIds.size === 0) {
      toast.error("الرجاء تحديد موظف واحد على الأقل لاعتماد راتبه.");
      return;
    }

    const lines = selectedData.map(payroll => ({
      accountId: "ACC-201", // مستحقات الموظفين (Payable)
      debit: 0,
      credit: payroll.net,
      referenceId: payroll.id,
      referenceType: 'employee' as const,
      description: `استحقاق راتب ${payrollMonth} (${payroll.stagesLabel}) - ${payroll.name}`
    }));

    lines.push({
      accountId: "ACC-501", // الرواتب والأجور (Expense)
      debit: totals.net,
      credit: 0,
      referenceId: payrollMonth,
      referenceType: 'employee' as const,
      description: `إجمالي مصروف رواتب شهر ${payrollMonth} (${selectedData.length} موظف)`
    });

    addJournalEntry({
      academicYearId: currentAcademicYearId || "",
      date: new Date().toISOString().split("T")[0],
      referenceId: `PR-${payrollMonth}`,
      referenceType: "payroll",
      description: `اعتماد استحقاق رواتب شهر ${payrollMonth} الموحدة`,
      status: "posted",
      isAutoGenerated: true,
      sourceDocumentType: "payroll" as any,
    }, lines as any);

    setApprovedMonths(prev => [...prev, payrollMonth]);
    toast.success("تم اعتماد استحقاق الرواتب وتوليد القيود المحاسبية بالدفتر العام بنجاح!");
  };

  // Payment Execution Journal Entry
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

    const lines = selectedData.map(payroll => ({
      accountId: "ACC-201", // مستحقات الموظفين (Payable)
      debit: payroll.net,
      credit: 0,
      referenceId: payroll.id,
      referenceType: 'employee' as const,
      description: `صرف راتب ${payrollMonth} - ${payroll.name}`
    }));

    lines.push({
      accountId: "ACC-102", // الحساب البنكي
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
      description: `صرف رواتب شهر ${payrollMonth} (تحويل بنكي موحد)`,
      status: "posted",
      isAutoGenerated: true,
      sourceDocumentType: "payroll" as any,
    }, lines as any);

    setPaidMonths(prev => [...prev, payrollMonth]);
    toast.success("تم تنفيذ صرف الرواتب وتحديث الرصيد البنكي بنجاح!");
  };

  const printTemplates: PrintTemplate[] = [
    {
      id: "payroll-report",
      name: "مسير الرواتب الموحد المدمج",
      category: "شؤون الموظفين والمالية",
      type: "table",
      columns: [
        { label: "اسم الموظف", key: "name" },
        { label: "المراحل والتكليف", key: "stagesLabel" },
        { label: "نظام السداد", key: "paymentTypeLabel", render: (r) => getPaymentTypeLabel(r.paymentType) },
        { label: "الأساسي", key: "basic" },
        { label: "البدلات والمكافآت", key: "allowance" },
        { label: "إجمالي الخصومات", key: "deduction" },
        { label: "التسوية اليدوية", key: "netAdjustment" },
        { label: "الصافي المستحق", key: "net" },
      ]
    },
    {
      id: "payroll-receipt",
      name: "مفردات راتب موحدة (إيصال موظف متعدد المراحل)",
      category: "شؤون الموظفين والمالية",
      type: "receipt",
      columns: [
        { label: "حساب الأساسي وطريقة الدفع", key: "details" },
        { label: "المراحل المغطاة", key: "stagesLabel" },
        { label: "الراتب الأساسي", key: "basic" },
        { label: "المكافآت والبدلات", key: "allowance" },
        { label: "إجمالي الخصومات", key: "deduction" },
        { label: "التعديل اليدوي", key: "netAdjustment" },
        { label: "صافي الراتب المستحق", key: "net" }
      ],
      customControls: [
        { key: "receiptReason", label: "البيان", type: "text", defaultValue: `مفردات راتب شهر ${payrollMonth}` }
      ]
    }
  ];

  function getPaymentTypeLabel(type: string) {
    switch (type) {
      case "Monthly": return "شهري (Monthly)";
      case "Weekly": return "أسبوعي (Weekly)";
      case "PerLesson": return "بالحصة (Per Lesson)";
      case "Daily": return "يومي (Daily)";
      default: return type;
    }
  }

  const printData = targetList.map(item => ({
    ...item,
    paymentTypeLabel: getPaymentTypeLabel(item.paymentType)
  }));

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الموارد البشرية", to: "/hr/dashboard" },
        { label: "مسير الرواتب المتقدم" },
      ]}
      actions={
        <div className="flex gap-2">
          <button onClick={() => setIsPrintOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-bold hover:bg-accent shadow-sm">
            <Printer className="h-4 w-4" /> طباعة المسير
          </button>
          
          <button 
            onClick={() => {
              if (window.confirm(`هل أنت متأكد من اعتماد استحقاق مسير الرواتب لعدد (${selectedStaffIds.size || payrollData.length}) موظفين لشهر ${payrollMonth}؟`)) {
                handleApprovePayroll();
              }
            }}
            disabled={isApproved || payrollData.length === 0}
            className={`inline-flex h-9 items-center gap-2 rounded-xl px-3.5 text-xs font-extrabold shadow-sm transition-colors ${isApproved || payrollData.length === 0 ? 'bg-muted text-muted-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'}`}
          >
            <Save className="h-4 w-4" /> {isApproved ? "تم الاعتماد والاستحقاق" : "اعتماد الاستحقاق"}
          </button>

          <button 
            onClick={() => {
              if (window.confirm(`هل أنت متأكد من تنفيذ الصرف البنكي لعدد (${selectedStaffIds.size || payrollData.length}) موظفين لشهر ${payrollMonth}؟ سيتم خصم ${totals.net.toLocaleString()} ${currency} من رصيد البنك.`)) {
                handlePayPayroll();
              }
            }}
            disabled={!isApproved || isPaid || payrollData.length === 0}
            className={`inline-flex h-9 items-center gap-2 rounded-xl px-3.5 text-xs font-extrabold shadow-sm transition-colors ${!isApproved || isPaid || payrollData.length === 0 ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
          >
            <Wallet className="h-4 w-4" /> {isPaid ? "تم الصرف البنكي" : "تنفيذ الصرف البنكي"}
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        
        <SmartAlert 
          type="info"
          title="نظام الرواتب والتحكم اليدوي الشامل"
          description="يدعم الاحتساب التلقائي مع التحكم اليدوي الكامل والتعديل المباشر لأي بند أو صافي لرواتب الموظفين. كما يدعم الرواتب الشهرية، الأسبوعية، وبند الحصص الدراسية مع الدمج التلقائي لرواتب الموظفين المعينين في أكثر من مرحلة."
        />

        {/* Filters and Pay Cycle Bar */}
        <FilterBar>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-base font-black">مسير الرواتب والاستحقاقات</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Pay System Filter */}
            <select
              value={payCycleFilter}
              onChange={(e) => setPayCycleFilter(e.target.value)}
              className="h-10 rounded-xl border border-border/60 bg-background px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="all">جميع أنظمة الرواتب</option>
              <option value="Monthly">نظام الراتب الشهري الثابت 📅</option>
              <option value="Weekly">نظام الراتب الأسبوعي ⏱️</option>
              <option value="PerLesson">نظام الحصة الدراسية 📚</option>
              <option value="Daily">نظام الأجر اليومي ☀️</option>
            </select>

            {/* Cross Stage Merged View Toggle */}
            <button
              onClick={() => setIsMergedView(!isMergedView)}
              className={`h-10 px-3.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition-all ${isMergedView ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-background border-border/60 text-muted-foreground hover:bg-accent'}`}
              title="دمج رواتب الموظف الذي يعمل في أكثر من مرحلة في سطر واحد بدلاً من فصلها"
            >
              <Layers className="w-4 h-4 text-primary" />
              {isMergedView ? "مسير مدمج (جميع المراحل)" : `المرحلة الحالية (${getStageLabel(activeStage)})`}
            </button>

            {/* Month Selector */}
            <input 
              type="month" 
              value={payrollMonth} 
              onChange={event => setPayrollMonth(event.target.value)} 
              className="h-10 rounded-xl border border-border/60 bg-background px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/40" 
            />

            <FinancialWorkflowBadge status={isPaid ? "paid" : isApproved ? "approved" : "draft"} />
          </div>
        </FilterBar>

        {/* Summary Stat Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <FinancialCard 
            title="إجمالي الأساسي" 
            value={totals.basic} 
            currency={currency} 
            icon={Wallet} 
            colorClass="text-foreground bg-muted" 
          />
          <FinancialCard 
            title="إجمالي البدلات" 
            value={totals.allowance} 
            currency={currency} 
            icon={TrendingUp} 
            colorClass="text-success bg-success" 
          />
          <FinancialCard 
            title="إجمالي الخصومات" 
            value={totals.deduction} 
            currency={currency} 
            icon={TrendingDown} 
            colorClass="text-danger bg-danger" 
          />
          <FinancialCard 
            title="التعديلات اليدوية" 
            value={totals.adjustments} 
            currency={currency} 
            icon={Sliders} 
            colorClass="text-blue-600 bg-blue-500" 
          />
          <FinancialCard 
            title="الصافي المطلوب صرفه" 
            value={totals.net} 
            currency={currency} 
            icon={ArrowDown} 
            colorClass="text-primary bg-primary" 
          />
        </div>

        {/* Expenses Monitoring & Multi-Period Analytics Box (مراقبة المنصرفات الفترية) */}
        <div className="bg-card p-6 rounded-3xl border border-border/60 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/50 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-foreground">مراقبة المنصرفات ومعدل الرواتب (يومي / أسبوعي / شهري / سنوي)</h3>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">تحليل الهيكل المالي للرواتب لمراقبة الميزانية التشغيلية للمدرسة</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold bg-muted/40 p-1.5 rounded-xl border border-border/40">
              <span className="px-2.5 py-1 bg-background text-foreground rounded-lg shadow-2xs">العام الدراسي الحالي</span>
              <span className="text-muted-foreground">{payrollData.length} موظف مسجل</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Daily Expense Estimate */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1">
              <div className="flex items-center justify-between text-amber-700 text-xs font-extrabold">
                <span className="flex items-center gap-1"><Sun className="h-3.5 w-3.5" /> المنصرف اليومي التقديري</span>
                <span className="text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded">30 يوم</span>
              </div>
              <div className="text-2xl font-black text-amber-900 tabular-nums">
                {Math.round(totals.net / 30).toLocaleString()} <span className="text-xs font-bold">{currency}</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">معدل التكلفة اليومية للكادر</p>
            </div>

            {/* Weekly Expense Estimate */}
            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-1">
              <div className="flex items-center justify-between text-indigo-700 text-xs font-extrabold">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> المنصرف الأسبوعي التقديري</span>
                <span className="text-[10px] bg-indigo-500/10 px-1.5 py-0.5 rounded">4 أسابيع</span>
              </div>
              <div className="text-2xl font-black text-indigo-900 tabular-nums">
                {Math.round(totals.net / 4).toLocaleString()} <span className="text-xs font-bold">{currency}</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">معدل الانفاق الأسبوعي للرواتب</p>
            </div>

            {/* Monthly Total Expense */}
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-1">
              <div className="flex items-center justify-between text-primary text-xs font-extrabold">
                <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> صافي منصرف الشهر الحالي</span>
                <span className="text-[10px] bg-primary/10 px-1.5 py-0.5 rounded">{payrollMonth}</span>
              </div>
              <div className="text-2xl font-black text-primary tabular-nums">
                {totals.net.toLocaleString()} <span className="text-xs font-bold">{currency}</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">مستحقات مسير الرواتب المعتمد</p>
            </div>

            {/* Academic Year Annual Estimate */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
              <div className="flex items-center justify-between text-emerald-700 text-xs font-extrabold">
                <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" /> المنصرف السنوي المتوقع</span>
                <span className="text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">12 شهر</span>
              </div>
              <div className="text-2xl font-black text-emerald-900 tabular-nums">
                {(totals.net * 12).toLocaleString()} <span className="text-xs font-bold">{currency}</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">ميزانية الأجور السنوية الكلية</p>
            </div>
          </div>
        </div>

        <PageCard>
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-primary/5 border border-primary/20 p-4 rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Calculator className="h-5 w-5 shrink-0" />
              <span>
                الصافي = الراتب الأساسي + البدلات - (الحسميات اليدوية + الغياب والتأخير + الإجازات بدون راتب + السلف) + التعديل اليدوي.
              </span>
            </div>
            
            <button 
              onClick={toggleSelectAll} 
              className="flex items-center gap-2 text-xs font-extrabold hover:text-primary transition-colors shrink-0"
            >
              {selectedStaffIds.size === payrollData.length && payrollData.length > 0 ? (
                <><CheckSquare className="h-4 w-4 text-primary" /> إلغاء تحديد الكل</>
              ) : (
                <><Square className="h-4 w-4" /> تحديد الكل ({payrollData.length})</>
              )}
            </button>
          </div>
          
          <DataTable
            rows={payrollData}
            columns={[
              { 
                key: "select", 
                header: "", 
                cell: (r: any) => (
                  <button onClick={() => toggleSelect(r.id)} className="text-muted-foreground hover:text-primary transition-colors">
                    {selectedStaffIds.has(r.id) ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground/50" />}
                  </button>
                )
              },
              { 
                key: "name", 
                header: "الموظف والتكليف الأكاديمي", 
                cell: (r: any) => (
                  <div className={!selectedStaffIds.has(r.id) ? "opacity-60" : ""}>
                    <div className="font-black text-sm text-foreground flex items-center gap-1.5">
                      {r.name}
                      {r.isMultiStage && (
                        <Badge tone="info" className="text-[10px] py-0 px-1.5">متعدد المراحل 🔗</Badge>
                      )}
                      {r.hasOverride && (
                        <Badge tone="warning" className="text-[10px] py-0 px-1.5">تعديل يدوي ✏️</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-bold flex items-center gap-2 mt-0.5">
                      <span>{r.role}</span>
                      <span>•</span>
                      <span className="text-primary font-bold">{r.stagesLabel}</span>
                    </div>
                  </div>
                ) 
              },
              { 
                key: "paymentType", 
                header: "نظام السداد والاحتساب", 
                cell: (r: any) => (
                  <div className={!selectedStaffIds.has(r.id) ? "opacity-60" : ""}>
                    <Badge tone="neutral" className="text-xs font-bold">
                      {getPaymentTypeLabel(r.paymentType)}
                    </Badge>
                    <div className="text-[11px] text-muted-foreground font-bold mt-1">{r.details}</div>
                  </div>
                ) 
              },
              { 
                key: "basic", 
                header: "الأساسي", 
                cell: (r: any) => <span className={`font-bold ${!selectedStaffIds.has(r.id) ? "opacity-60" : ""}`}>{r.basic.toLocaleString()} {currency}</span> 
              },
              { 
                key: "allowance", 
                header: "البدلات", 
                cell: (r: any) => <span className={`font-bold text-success ${!selectedStaffIds.has(r.id) ? "opacity-60" : ""}`}>+{r.allowance.toLocaleString()} {currency}</span> 
              },
              { 
                key: "attendanceDeduction", 
                header: "خصم الحضور", 
                cell: (r: any) => r.attendanceDeduction ? <span className={`font-bold text-danger ${!selectedStaffIds.has(r.id) ? "opacity-60" : ""}`}>-{r.attendanceDeduction.toLocaleString()} {currency}</span> : <span className="text-muted-foreground">-</span> 
              },
              { 
                key: "leaveDeduction", 
                header: "إجازة بدون راتب", 
                cell: (r: any) => r.leaveDeduction ? <span className={`font-bold text-danger ${!selectedStaffIds.has(r.id) ? "opacity-60" : ""}`}>-{r.leaveDeduction.toLocaleString()} {currency} ({r.unpaidLeaveDays}ي)</span> : <span className="text-muted-foreground">-</span> 
              },
              { 
                key: "advanceDeduction", 
                header: "السلف", 
                cell: (r: any) => r.advanceDeduction ? <span className={`font-bold text-danger ${!selectedStaffIds.has(r.id) ? "opacity-60" : ""}`}>-{r.advanceDeduction.toLocaleString()} {currency}</span> : <span className="text-muted-foreground">-</span> 
              },
              { 
                key: "deduction", 
                header: "إجمالي الخصومات", 
                cell: (r: any) => <span className={`font-black text-danger ${!selectedStaffIds.has(r.id) ? "opacity-60" : ""}`}>-{r.deduction.toLocaleString()} {currency}</span> 
              },
              { 
                key: "netAdjustment", 
                header: "تسوية يدوية", 
                cell: (r: any) => (
                  r.netAdjustment !== 0 ? (
                    <span className={`font-bold text-xs px-2 py-0.5 rounded ${r.netAdjustment > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {r.netAdjustment > 0 ? `+${r.netAdjustment}` : r.netAdjustment} {currency}
                    </span>
                  ) : <span className="text-muted-foreground">-</span>
                )
              },
              { 
                key: "net", 
                header: "الصافي المستحق", 
                cell: (r: any) => (
                  <span className={`font-black text-lg text-primary tabular-nums ${!selectedStaffIds.has(r.id) ? "opacity-60" : ""}`}>
                    {r.net.toLocaleString()} {currency}
                  </span>
                ) 
              },
              {
                key: "actions",
                header: "تحكم يدوي",
                cell: (r: any) => (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingStaffOverride(r)}
                      className="text-xs font-extrabold bg-primary/10 text-primary hover:bg-primary hover:text-white px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
                      title="تحكم وتعديل يدوي كامل في بنود الراتب"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> تعديل يدوي
                    </button>
                    {r.hasOverride && (
                      <button
                        onClick={() => handleClearOverride(r.id)}
                        className="text-[11px] font-bold text-danger hover:bg-danger/10 px-2 py-1 rounded-lg"
                        title="إعادة ضبط الراتب التلقائي"
                      >
                        إعادة ضبط
                      </button>
                    )}
                  </div>
                )
              }
            ]}
            pageSize={15}
            pageSizeOptions={[10, 15, 25, 50, 100]}
            empty="لا يوجد موظفون مطاطقون لنظام السداد والفلاتر الحالية"
          />
        </PageCard>
      </div>

      {/* --- Full Manual Override Modal (تحكم يدوي كامل في الراتب) --- */}
      {editingStaffOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border/50 flex justify-between items-center bg-primary/10 shrink-0">
              <div>
                <h3 className="font-black text-lg flex items-center gap-2 text-primary">
                  <Sliders className="w-5 h-5 text-primary" /> تعديل وتحكم يدوي كامل في مفردات الراتب
                </h3>
                <p className="text-xs font-bold text-muted-foreground mt-0.5">
                  الموظف: <span className="text-foreground font-black">{editingStaffOverride.name}</span> ({editingStaffOverride.role} - {editingStaffOverride.stagesLabel})
                </p>
              </div>
              <button onClick={() => setEditingStaffOverride(null)} className="p-1 hover:bg-accent rounded-xl"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveOverride} className="p-6 space-y-4 overflow-y-auto">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-xs font-bold text-muted-foreground">
                يمكنك التعديل اليدوي على أي بند من البنود لحساب الراتب وإضافة تسويات أو مكافآت استثنائية يدويّة لشهر <span className="text-foreground font-extrabold">{payrollMonth}</span>.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">الراتب الأساسي / معدل الحصة اليدوي ({currency})</label>
                  <input
                    type="number"
                    name="basicOverride"
                    defaultValue={editingStaffOverride.basic}
                    className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/40 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">إجمالي البدلات والمكافآت اليدوية ({currency})</label>
                  <input
                    type="number"
                    name="allowanceOverride"
                    defaultValue={editingStaffOverride.allowance}
                    className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl font-bold text-sm text-success focus:ring-2 focus:ring-primary/40 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">الحسميات اليدوية الإضافية ({currency})</label>
                  <input
                    type="number"
                    name="manualDeductionOverride"
                    defaultValue={editingStaffOverride.manualDeduction}
                    className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl font-bold text-sm text-danger focus:ring-2 focus:ring-primary/40 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">خصم الغياب والتأخير اليدوي ({currency})</label>
                  <input
                    type="number"
                    name="attendanceDeductionOverride"
                    defaultValue={editingStaffOverride.attendanceDeduction}
                    className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl font-bold text-sm text-danger focus:ring-2 focus:ring-primary/40 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">خصم الإجازات بدون راتب ({currency})</label>
                  <input
                    type="number"
                    name="leaveDeductionOverride"
                    defaultValue={editingStaffOverride.leaveDeduction}
                    className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl font-bold text-sm text-danger focus:ring-2 focus:ring-primary/40 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">خصم السلف القائمة ({currency})</label>
                  <input
                    type="number"
                    name="advanceDeductionOverride"
                    defaultValue={editingStaffOverride.advanceDeduction}
                    className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl font-bold text-sm text-danger focus:ring-2 focus:ring-primary/40 outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-border/50 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">مبلغ تسوية الصافي اليدوية (موجب أو سالب) ({currency})</label>
                  <input
                    type="number"
                    name="netAdjustment"
                    defaultValue={editingStaffOverride.netAdjustment || 0}
                    placeholder="مثال: +200 أو -150..."
                    className="w-full px-3 py-2 bg-background border border-primary/40 rounded-xl font-black text-sm focus:ring-2 focus:ring-primary/40 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">سبب ومبرر التعديل اليدوي (المستند المحاسبي)</label>
                  <input
                    type="text"
                    name="adjustmentReason"
                    defaultValue={editingStaffOverride.adjustmentReason || ""}
                    placeholder="مثال: مكافأة تميز في اختبارات المرحلة المتوسطة..."
                    className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl font-bold text-xs focus:ring-2 focus:ring-primary/40 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-border/50">
                <button type="submit" className="flex-1 btn-primary py-2.5 rounded-xl font-extrabold">
                  حفظ التعديلات اليدوية
                </button>
                <button type="button" onClick={() => setEditingStaffOverride(null)} className="btn-secondary px-6 rounded-xl font-bold">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Advanced Print Engine --- */}
      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title={`مسير الرواتب الموحد المدمج - شهر ${payrollMonth}`}
        data={printData}
        templates={printTemplates}
      />
    </AppShell>
  );
}
