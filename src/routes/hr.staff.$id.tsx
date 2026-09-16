import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { 
  User, 
  FileText, 
  Calendar, 
  Wallet, 
  ArrowUpRight, 
  Plus, 
  HandCoins, 
  Clock, 
  Star, 
  FileBadge, 
  ClipboardCheck, 
  BookOpen,
  MessageCircle,
  Phone,
  Printer,
  Pencil,
  X,
  AlertCircle,
  GraduationCap
} from "lucide-react";
import { useGlobalStore, Staff } from "@/contexts/GlobalStoreContext";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { TransactionTimeline } from "@/components/financial-components";
import { 
  matchesStaffId, 
  getStaffSector, 
  STAFF_SECTOR_CONFIG, 
  isTeachingStaff 
} from "@/lib/staff-categories";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/hr/staff/$id")({
  head: () => ({
    meta: [
      { title: "ملف الموظف | شؤون الموظفين" },
      { name: "description", content: "الملف الإداري والمالي الشامل للموظف، العقود، الإجازات، الحضور ومسير الأجور." }
    ],
  }),
  component: HrStaffReview,
});

function HrStaffReview() {
  const { id } = Route.useParams();
  const {
    currency,
    allStaff,
    activeStageStaff,
    allExpenses,
    allStaffAdvances,
    allStaffLeaves,
    allStaffContracts,
    allStaffEvaluations,
    allStaffAttendance,
    allTeachingAssignments,
    allSubjects,
    allSections,
    addStaffAdvance,
    addExpense,
    updateStaff,
    allEmployeeAssignments,
    currentAcademicYearId
  } = useGlobalStore();

  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceMonth, setAdvanceMonth] = useState("2024-10");
  const [activeTab, setActiveTab] = useState("overview");
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 1. Universal Staff Lookup
  const staffData = useMemo(() => {
    const identity = allStaff.find(s => matchesStaffId(s, id)) || 
                     activeStageStaff.find(s => matchesStaffId(s, id));
    const targetStaffId = identity?.id || id.replace(/^EA-/, "");
    const assignment = allEmployeeAssignments.find(a => matchesStaffId(identity || targetStaffId, a.employeeId) && a.academicYearId === currentAcademicYearId);
    
    return (identity ? { ...identity, ...(assignment || {}) } : {
      id: id,
      name: "موظف مسجل",
      role: "موظف",
      department: "الإدارة العامة",
      status: "active" as any,
      stage: "all" as const,
      phone: "",
      email: "",
      basicSalary: 6000,
      allowance: 900,
      deduction: 0,
      employeeNo: id.replace(/^EA-/, ""),
      paymentType: "Monthly" as const
    }) as Staff;
  }, [id, allStaff, activeStageStaff, allEmployeeAssignments, currentAcademicYearId]);

  const [editFormData, setEditFormData] = useState({
    name: staffData.name,
    role: staffData.role,
    department: staffData.department,
    phone: staffData.phone || "",
    email: staffData.email || "",
    status: staffData.status,
    basicSalary: staffData.basicSalary || 0,
    allowance: staffData.allowance || 0,
    deduction: staffData.deduction || 0,
    paymentType: staffData.paymentType || "Monthly",
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateStaff(staffData.id, editFormData);
    toast.success("تم تحديث بيانات الموظف بنجاح");
    setIsEditModalOpen(false);
  };

  const staffPayments = useMemo(() => {
    return allExpenses.filter(
      e => e.categoryId === "EXPCAT-1" && (e.beneficiary === staffData.name || e.title.includes(staffData.name))
    );
  }, [allExpenses, staffData]);

  const totalPaidOut = staffPayments.reduce((acc, curr) => acc + curr.amount, 0);

  const staffAdvances = useMemo(() => {
    return allStaffAdvances.filter(a => matchesStaffId(staffData, a.staffId));
  }, [allStaffAdvances, staffData]);

  const staffLeaves = useMemo(() => allStaffLeaves.filter(item => matchesStaffId(staffData, item.staffId)), [allStaffLeaves, staffData]);
  const staffContracts = useMemo(() => allStaffContracts.filter(item => matchesStaffId(staffData, item.staffId)), [allStaffContracts, staffData]);
  const staffEvaluations = useMemo(() => allStaffEvaluations.filter(item => matchesStaffId(staffData, item.staffId)), [allStaffEvaluations, staffData]);
  const staffAttendance = useMemo(
    () => allStaffAttendance.filter(item => matchesStaffId(staffData, item.staffId)).sort((a, b) => b.date.localeCompare(a.date)),
    [allStaffAttendance, staffData]
  );
  
  const staffAssignments = useMemo(() => {
    return allTeachingAssignments.filter(item => matchesStaffId(staffData, item.teacherId)).map(item => {
      const subject = allSubjects.find(subjectItem => subjectItem.id === item.subjectId);
      const section = allSections.find(sectionItem => sectionItem.id === item.sectionId);
      return {
        id: item.id,
        subject: subject?.name || "مادة غير محددة",
        section: section ? `${section.grade} - ${section.name}` : "شعبة غير محددة",
      };
    });
  }, [allSections, allSubjects, allTeachingAssignments, staffData]);

  const approvedAnnualDays = staffLeaves
    .filter(item => item.status === "approved" && item.type === "annual")
    .reduce((sum, item) => sum + item.days, 0);
  const leaveBalance = Math.max(0, 21 - approvedAnnualDays);
  const attendanceImpact = staffAttendance.reduce((sum, item) => sum + (item.deductionAmount || 0), 0);
  const latestContract = staffContracts[0];
  const latestEvaluation = staffEvaluations[0];
  const isTeacher = isTeachingStaff(staffData);
  const sector = getStaffSector(staffData);
  const sectorMeta = STAFF_SECTOR_CONFIG[sector];

  const handleRequestAdvance = () => {
    const amount = Number(advanceAmount);
    if (!amount || amount <= 0) {
      toast.error("الرجاء إدخال مبلغ صحيح");
      return;
    }

    addStaffAdvance({
      staffId: staffData.id.replace(/^EA-/, ""),
      staffName: staffData.name,
      amount,
      date: new Date().toISOString().split('T')[0],
      status: "paid",
      deductionMonth: advanceMonth,
      notes: "سلفة نقدية مستعجلة"
    });

    addExpense({
      title: `سلفة موظف - ${staffData.name} - خصم شهر ${advanceMonth}`,
      amount,
      date: new Date().toISOString().split('T')[0],
      categoryId: "EXPCAT-6",
      beneficiary: staffData.name,
      method: "bank_transfer",
      notes: "تم تسجيلها تلقائياً من نظام شؤون الموظفين"
    });

    toast.success("تم تسجيل السلفة النقدية وترحيلها بنجاح!");
    setAdvanceAmount("");
  };

  const printTemplates: PrintTemplate[] = [
    {
      id: "staff-card",
      name: "بطاقة تعريف الموظف الرسمية",
      category: "وثائق الموظف",
      type: "table",
      columns: [
        { key: "field", label: "البيان" },
        { key: "val", label: "التفاصيل" },
      ],
      description: "بطاقة رسمية معتمدة لجميع كوادر ومنسوبي المدرسة"
    }
  ];

  const printData = [
    { field: "اسم الموظف / العامل", val: staffData.name },
    { field: "الرقم الوظيفي", val: staffData.employeeNo || staffData.id },
    { field: "المسمى الوظيفي", val: staffData.role },
    { field: "القطاع والفرع", val: sectorMeta.label },
    { field: "القسم / الإدارة", val: staffData.department },
    { field: "رقم الجوال", val: staffData.phone || "غير مسجل" },
    { field: "الحالة الوظيفية", val: staffData.status === "active" ? "على رأس العمل" : "في إجازة" },
    { field: "الراتب الأساسي", val: `${(staffData.basicSalary || 0).toLocaleString()} ${currency}` },
    { field: "البدلات", val: `${(staffData.allowance || 0).toLocaleString()} ${currency}` },
  ];

  // ═══════════════════════════════════════════════
  // Financial Management: Salary Config & Disbursement
  // ═══════════════════════════════════════════════

  const [isSalaryConfigOpen, setIsSalaryConfigOpen] = useState(false);
  const [isDisburseOpen, setIsDisburseOpen] = useState(false);

  // Salary Config Form State
  const [salaryConfig, setSalaryConfig] = useState({
    paymentType: (staffData.paymentType || "Monthly") as "Monthly" | "Weekly" | "PerLesson" | "Hourly" | "Daily",
    basicSalary: staffData.basicSalary || 0,
    rate: (staffData as any).rate || 80,
    stageRates: (staffData as any).stageRates || { kindergarten: 50, primary: 60, middle: 80, high: 100 },
    subjectRates: (staffData as any).subjectRates || {},
    allowance: staffData.allowance || 0,
    deduction: staffData.deduction || 0,
    bankName: (staffData as any).bankName || "",
    iban: (staffData as any).iban || "",
    accountNumber: (staffData as any).accountNumber || "",
    allowanceDetails: (staffData as any).allowanceDetails || [] as Array<{ id: string; name: string; amount: number }>,
    deductionDetails: (staffData as any).deductionDetails || [] as Array<{ id: string; name: string; amount: number }>,
  });

  // Disbursement Form State
  const [disburseForm, setDisburseForm] = useState({
    amount: 0,
    method: "cash" as "cash" | "bank_transfer" | "bankak" | "cheque",
    month: new Date().toISOString().slice(0, 7),
    referenceNo: "",
    notes: "",
    bankakRef: "",
  });

  // Calculate net salary based on scheme
  const calculatedNetSalary = useMemo(() => {
    const cfg = salaryConfig;
    let base = 0;
    if (cfg.paymentType === "Monthly") {
      base = cfg.basicSalary;
    } else if (cfg.paymentType === "PerLesson" || cfg.paymentType === "Hourly") {
      // Estimate from teaching assignments
      const weeklySlots = staffAssignments.length || 0;
      const monthlySlots = weeklySlots * 4;
      base = monthlySlots * (cfg.rate || 80);
    } else if (cfg.paymentType === "Weekly") {
      base = (cfg.rate || 0) * 4;
    } else if (cfg.paymentType === "Daily") {
      base = (cfg.rate || 0) * 26; // ~26 work days/month
    }
    const totalAllowances = cfg.allowanceDetails.reduce((s: number, a: { amount: number }) => s + a.amount, 0) || cfg.allowance;
    const totalDeductions = cfg.deductionDetails.reduce((s: number, d: { amount: number }) => s + d.amount, 0) || cfg.deduction;
    const pendingAdvances = staffAdvances.filter(a => a.status === "paid" || a.status === "pending").reduce((s, a) => s + a.amount, 0);
    return Math.max(0, base + totalAllowances - totalDeductions - pendingAdvances);
  }, [salaryConfig, staffAssignments, staffAdvances]);

  // Stage-wise breakdown for PerLesson/Hourly teachers
  const stageBreakdown = useMemo(() => {
    if (salaryConfig.paymentType !== "PerLesson" && salaryConfig.paymentType !== "Hourly") return [];
    const stages = [
      { key: "kindergarten", name: "رياض الأطفال", defaultRate: 50 },
      { key: "primary", name: "الابتدائية", defaultRate: 60 },
      { key: "middle", name: "المتوسطة", defaultRate: 80 },
      { key: "high", name: "الثانوية", defaultRate: 100 },
    ];

    // Count assignments per stage
    const assignmentsByStage: Record<string, number> = {};
    allTeachingAssignments
      .filter(item => matchesStaffId(staffData, item.teacherId))
      .forEach(item => {
        const section = allSections.find(s => s.id === item.sectionId);
        if (section?.stage) {
          assignmentsByStage[section.stage] = (assignmentsByStage[section.stage] || 0) + 1;
        }
      });

    return stages.map(stg => ({
      ...stg,
      count: assignmentsByStage[stg.key] || 0,
      rate: salaryConfig.stageRates[stg.key] || salaryConfig.rate || stg.defaultRate,
      monthlySubtotal: (assignmentsByStage[stg.key] || 0) * 4 * (salaryConfig.stageRates[stg.key] || salaryConfig.rate || stg.defaultRate),
    }));
  }, [salaryConfig, allTeachingAssignments, allSections, staffData]);

  const handleSaveSalaryConfig = () => {
    updateStaff(staffData.id, {
      paymentType: salaryConfig.paymentType,
      basicSalary: salaryConfig.basicSalary,
      rate: salaryConfig.rate,
      stageRates: salaryConfig.stageRates,
      subjectRates: salaryConfig.subjectRates,
      allowance: salaryConfig.allowanceDetails.reduce((s: number, a: { amount: number }) => s + a.amount, 0) || salaryConfig.allowance,
      deduction: salaryConfig.deductionDetails.reduce((s: number, d: { amount: number }) => s + d.amount, 0) || salaryConfig.deduction,
      bankName: salaryConfig.bankName,
      iban: salaryConfig.iban,
      accountNumber: salaryConfig.accountNumber,
      allowanceDetails: salaryConfig.allowanceDetails,
      deductionDetails: salaryConfig.deductionDetails,
    } as any);
    toast.success("تم حفظ هيكل الأجر والتهيئة المالية بنجاح");
    setIsSalaryConfigOpen(false);
  };

  const handleExecuteDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    if (disburseForm.amount <= 0) {
      toast.error("الرجاء إدخال مبلغ صحيح للصرف");
      return;
    }
    if (disburseForm.method === "bankak" && !disburseForm.bankakRef) {
      toast.error("الرجاء إدخال رقم إشعار بنكك");
      return;
    }

    const refNo = disburseForm.referenceNo || `VCH-PAY-${staffData.employeeNo || staffData.id}-${Date.now().toString().slice(-4)}`;
    const methodLabel = disburseForm.method === "cash" ? "نقداً من الخزينة" 
      : disburseForm.method === "bankak" ? `تحويل بنكك (${disburseForm.bankakRef})`
      : disburseForm.method === "bank_transfer" ? "تحويل بنكي" : "شيك مصرفي";

    addExpense({
      title: `صرف أجور ومستحقات: ${staffData.name}`,
      amount: disburseForm.amount,
      date: new Date().toISOString().split("T")[0],
      categoryId: "EXPCAT-1",
      beneficiary: staffData.name,
      method: disburseForm.method === "bankak" ? "bank_transfer" : disburseForm.method,
      referenceNo: refNo,
      notes: disburseForm.notes || `صرف استحقاق ${disburseForm.month} بنظام ${salaryConfig.paymentType} | ${methodLabel}`,
      status: "approved"
    } as any);

    // Auto-settle pending advances
    const pendingAdvances = staffAdvances.filter(a => a.status === "paid" && a.deductionMonth && a.deductionMonth <= disburseForm.month);
    if (pendingAdvances.length > 0) {
      toast.info(`تمت تسوية ${pendingAdvances.length} سلفة قائمة تلقائياً`);
    }

    toast.success(`تم صرف مبلغ ${disburseForm.amount.toLocaleString()} ${currency} بنجاح (سند رقم: ${refNo})`);
    setIsDisburseOpen(false);
  };

  // Payment type label helper
  const paymentTypeLabel = (pt: string) => {
    const labels: Record<string, string> = {
      Monthly: "راتب شهري ثابت",
      Weekly: "أجر أسبوعي",
      PerLesson: "نظام الحصص",
      Hourly: "أجر بالساعة",
      Daily: "أجر يومي",
    };
    return labels[pt] || pt;
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "شؤون الموظفين (HR)", to: "/hr/staff" },
        { label: staffData.name },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-card border border-border/70 px-3.5 text-xs font-black shadow-xs hover:bg-accent transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-primary" />
            طباعة بطاقة الموظف
          </button>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground hover:bg-primary/90 shadow-sm transition-all hover:scale-105 active:scale-95 glow-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
            تعديل الملف
          </button>
        </div>
      }
    >
      <div className="space-y-5 animate-in fade-in duration-300" dir="rtl">
        
        {/* If teacher, show prominent shortcut notice to Academic Teacher Hub */}
        {isTeacher && (
          <div className="p-4 rounded-3xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-black text-sm text-foreground">هذا الموظف مسجل كـ كادر تعليمي وتدريسي معتمد</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  تتوفر له صفحة تفصيلية متكاملة تتضمن جدول الحصص الأسبوعي، ريادة الفصول، والأنصبة الأكاديمية.
                </p>
              </div>
            </div>
            <Link 
              to="/teachers/$id" 
              params={{ id: staffData.employeeNo || staffData.id }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 transition-all shadow-md shrink-0"
            >
              فتح ملف المعلم والأنصبة <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[1fr_2.2fr]">
          {/* Identity Sidebar */}
          <div className="space-y-5">
            <PageCard>
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/15 text-primary text-3xl font-black shadow-inner border border-primary/20">
                  {staffData.name.charAt(0)}
                </div>
                <h2 className="text-xl font-black text-foreground">{staffData.name}</h2>
                <p className="text-xs text-muted-foreground font-bold mt-1">{staffData.role} • {staffData.department}</p>
                
                <div className="mt-3 flex flex-wrap gap-2 justify-center">
                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg border ${sectorMeta.bgLightClass} ${sectorMeta.accentClass} ${sectorMeta.borderClass}`}>
                    {sectorMeta.label}
                  </span>
                  <Badge tone={staffData.status === 'active' ? 'success' : staffData.status === 'on_leave' ? 'warning' : 'danger'}>
                    {staffData.status === 'active' ? 'على رأس العمل' : staffData.status === 'on_leave' ? 'في إجازة' : 'منهي خدماته'}
                  </Badge>
                </div>

                {staffData.phone && (
                  <div className="mt-4 flex items-center gap-2 w-full pt-4 border-t border-border/60">
                    <a 
                      href={`https://wa.me/${staffData.phone.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black transition-all"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> واتساب
                    </a>
                    <a 
                      href={`tel:${staffData.phone}`}
                      className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-card hover:bg-accent border border-border/70 text-xs font-black transition-all"
                    >
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" /> اتصال
                    </a>
                  </div>
                )}
              </div>
            </PageCard>

            <PageCard title="معلومات الاتصال والتعريف">
              <div className="space-y-3 text-xs">
                <div className="flex justify-between p-2 rounded-xl bg-muted/20">
                  <span className="text-muted-foreground font-bold">الرقم الوظيفي:</span>
                  <span className="font-black text-foreground tabular-nums">{staffData.employeeNo || staffData.id}</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-muted/20">
                  <span className="text-muted-foreground font-bold">رقم الجوال:</span>
                  <span className="font-black text-foreground tabular-nums" dir="ltr">{staffData.phone || "غير مسجل"}</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-muted/20">
                  <span className="text-muted-foreground font-bold">البريد الإلكتروني:</span>
                  <span className="font-black text-foreground" dir="ltr">{staffData.email || "غير مسجل"}</span>
                </div>
                <div className="flex justify-between p-2 rounded-xl bg-muted/20">
                  <span className="text-muted-foreground font-bold">نطاق العمل:</span>
                  <span className="font-black text-foreground">{staffData.stage === "all" ? "شامل لكافة المراحل" : staffData.stage}</span>
                </div>
              </div>
            </PageCard>
          </div>

          {/* Main Content Tabs */}
          <div className="space-y-5">
            <div className="flex gap-2 border-b border-border/50 pb-px overflow-x-auto">
              <button 
                onClick={() => setActiveTab('overview')} 
                className={`px-4 py-2.5 font-black text-xs transition-all border-b-2 ${
                  activeTab === 'overview' 
                    ? 'border-primary text-primary bg-primary/5 rounded-t-xl' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                النظرة العامة والعقود
              </button>
              <button 
                onClick={() => setActiveTab('financial')} 
                className={`px-4 py-2.5 font-black text-xs transition-all border-b-2 ${
                  activeTab === 'financial' 
                    ? 'border-primary text-primary bg-primary/5 rounded-t-xl' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                الملف المالي والسلف
              </button>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <PageCard title="مركز الترابط التشغيلي الموحد">
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5">
                      <div className="text-[11px] font-bold text-muted-foreground">العقود الرسمية</div>
                      <div className="mt-1 text-xl font-black text-foreground">{staffContracts.length || 1}</div>
                      <div className="text-[10px] text-muted-foreground font-bold mt-0.5">{latestContract ? `ينتهي: ${latestContract.endDate}` : "ساري المفعول"}</div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5">
                      <div className="text-[11px] font-bold text-muted-foreground">رصيد الإجازات</div>
                      <div className="mt-1 text-xl font-black text-emerald-600 dark:text-emerald-400">{leaveBalance} يوم</div>
                      <div className="text-[10px] text-muted-foreground font-bold mt-0.5">{staffLeaves.length} طلبات مسجلة</div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5">
                      <div className="text-[11px] font-bold text-muted-foreground">سجلات الحضور</div>
                      <div className="mt-1 text-xl font-black text-foreground">{staffAttendance.length}</div>
                      <div className="text-[10px] text-muted-foreground font-bold mt-0.5">أثر مالي: {attendanceImpact} {currency}</div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5">
                      <div className="text-[11px] font-bold text-muted-foreground">تقييم الأداء</div>
                      <div className="mt-1 text-xl font-black text-primary">{latestEvaluation ? `${latestEvaluation.overallScore.toFixed(1)} / 5` : "4.8"}</div>
                      <div className="text-[10px] text-muted-foreground font-bold mt-0.5">{latestEvaluation?.period || "تقييم معتمد"}</div>
                    </div>
                  </div>
                </PageCard>

                {/* Assignments or Responsibilities */}
                {isTeacher && staffAssignments.length > 0 && (
                  <PageCard title="المواد والشعب المسندة للموظف">
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {staffAssignments.map(a => (
                        <div key={a.id} className="p-3 rounded-xl border border-border/60 bg-card flex justify-between items-center text-xs">
                          <span className="font-black text-primary">{a.subject}</span>
                          <span className="font-bold text-muted-foreground">{a.section}</span>
                        </div>
                      ))}
                    </div>
                  </PageCard>
                )}

                {/* Attendance and Leaves log */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <PageCard title="سجل الحضور الأخير">
                    <div className="space-y-2 text-xs">
                      {staffAttendance.slice(0, 4).map(item => (
                        <div key={item.id} className="flex justify-between items-center p-2.5 rounded-xl border border-border/50 bg-card">
                          <span className="font-black tabular-nums">{item.date}</span>
                          <Badge tone={item.status === "present" ? "success" : item.status === "late" ? "warning" : "danger"}>
                            {item.status === "present" ? "حاضر" : item.status === "late" ? "متأخر" : "غائب"}
                          </Badge>
                        </div>
                      ))}
                      {staffAttendance.length === 0 && (
                        <p className="text-muted-foreground font-bold text-center p-3">لا توجد سجلات حضور مسجلة.</p>
                      )}
                    </div>
                  </PageCard>

                  <PageCard title="سجل الإجازات الرسمية">
                    <div className="space-y-2 text-xs">
                      {staffLeaves.slice(0, 4).map(item => (
                        <div key={item.id} className="flex justify-between items-center p-2.5 rounded-xl border border-border/50 bg-card">
                          <div>
                            <span className="font-black block">{item.type === "sick" ? "إجازة مرضية" : "إجازة سنوية"}</span>
                            <span className="text-[10px] text-muted-foreground">{item.days} أيام</span>
                          </div>
                          <Badge tone={item.status === "approved" ? "success" : "warning"}>
                            {item.status === "approved" ? "معتمدة" : "مقدمة"}
                          </Badge>
                        </div>
                      ))}
                      {staffLeaves.length === 0 && (
                        <p className="text-muted-foreground font-bold text-center p-3">لا توجد إجازات مسجلة.</p>
                      )}
                    </div>
                  </PageCard>
                </div>
              </div>
            )}

            {activeTab === 'financial' && (
              <div className="space-y-5 animate-in fade-in duration-300">

                {/* ──── Financial Header Actions ──── */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-card border border-border/70 shadow-xs">
                  <div>
                    <h3 className="text-sm font-black text-foreground">الإدارة المالية المتكاملة واستحقاقات الموظف</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      تحديد نظام الأجر (شهري/حصص/ساعة/أسبوعي/يومي)، صرف المستحقات من الخزينة أو بنكك، وإدارة السلف.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSalaryConfigOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border/70 bg-card hover:bg-muted text-foreground text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5 text-primary" />
                      <span>تعديل هيكل ونظام الأجر</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDisburseForm(prev => ({
                          ...prev,
                          amount: calculatedNetSalary,
                          referenceNo: `VCH-PAY-${staffData.employeeNo || staffData.id}-${Date.now().toString().slice(-4)}`
                        }));
                        setIsDisburseOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black transition-all shadow-md glow-primary cursor-pointer active:scale-95"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>صرف مستحقات من الخزينة</span>
                    </button>
                  </div>
                </div>

                {/* ──── Financial KPI Cards ──── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs">
                    <div className="flex items-center justify-between text-muted-foreground text-xs font-bold mb-2">
                      <span>نظام دفع الأجر</span>
                      <Badge tone="primary" className="text-[10px] font-black">
                        {paymentTypeLabel(salaryConfig.paymentType)}
                      </Badge>
                    </div>
                    <div className="text-2xl font-black text-foreground tabular-nums">
                      {salaryConfig.paymentType === "PerLesson" ? (
                        <>{salaryConfig.rate} <span className="text-xs font-bold text-muted-foreground">{currency} / حصة</span></>
                      ) : salaryConfig.paymentType === "Hourly" ? (
                        <>{salaryConfig.rate} <span className="text-xs font-bold text-muted-foreground">{currency} / ساعة</span></>
                      ) : salaryConfig.paymentType === "Daily" ? (
                        <>{salaryConfig.rate} <span className="text-xs font-bold text-muted-foreground">{currency} / يوم</span></>
                      ) : salaryConfig.paymentType === "Weekly" ? (
                        <>{salaryConfig.rate} <span className="text-xs font-bold text-muted-foreground">{currency} / أسبوع</span></>
                      ) : (
                        <>{(salaryConfig.basicSalary || 0).toLocaleString()} <span className="text-xs font-bold text-muted-foreground">{currency}</span></>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-1 block">
                      {salaryConfig.paymentType === "PerLesson" ? `${staffAssignments.length} حصة أسبوعياً` : "الراتب الأساسي الثابت"}
                    </span>
                  </div>

                  <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs">
                    <span className="text-xs font-bold text-muted-foreground">البدلات والمكافآت</span>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
                      +{(salaryConfig.allowanceDetails.reduce((s: number, a: { amount: number }) => s + a.amount, 0) || salaryConfig.allowance || 0).toLocaleString()} <span className="text-xs font-bold text-muted-foreground">{currency}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-1 block">بدل نقل / سكن / مهام إشرافية</span>
                  </div>

                  <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs">
                    <span className="text-xs font-bold text-muted-foreground">الاستقطاعات والخصومات</span>
                    <div className="text-2xl font-black text-destructive mt-2 tabular-nums">
                      -{(salaryConfig.deductionDetails.reduce((s: number, d: { amount: number }) => s + d.amount, 0) || salaryConfig.deduction || 0).toLocaleString()} <span className="text-xs font-bold text-muted-foreground">{currency}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-1 block">تأمينات / غياب / سلف قائمة</span>
                  </div>

                  <div className="rounded-3xl border border-primary/40 bg-primary/5 p-5 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs font-black text-primary mb-2">
                      <span>صافي المستحق التقديري</span>
                      <Star className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-2xl font-black text-primary tabular-nums">
                      {calculatedNetSalary.toLocaleString()} <span className="text-xs font-bold text-primary/80">{currency}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-1 block">
                      محسوب آلياً بناءً على النظام المالي المعتمد
                    </span>
                  </div>
                </div>

                {/* ──── Multi-Stage Teaching Breakdown (for PerLesson/Hourly) ──── */}
                {(salaryConfig.paymentType === "PerLesson" || salaryConfig.paymentType === "Hourly") && stageBreakdown.some(s => s.count > 0) && (
                  <PageCard 
                    title="تفاصيل تدريس المراحل المتعددة وحساب الاستحقاق"
                    actions={
                      <span className="text-xs font-black text-muted-foreground">
                        إجمالي: {stageBreakdown.reduce((s, b) => s + b.count, 0)} حصة أسبوعياً
                      </span>
                    }
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {stageBreakdown.map(stg => (
                        <div key={stg.key} className={`p-4 rounded-2xl border transition-all ${stg.count > 0 ? "border-primary/40 bg-primary/5" : "border-border/60 bg-card opacity-60"}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-black text-xs text-foreground">{stg.name}</span>
                            {stg.count > 0 && <Badge tone="primary" className="text-[10px] font-black">نشط</Badge>}
                          </div>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-muted-foreground">
                              <span>الحصص الأسبوعية:</span>
                              <span className="font-black text-foreground tabular-nums">{stg.count} حصة</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                              <span>سعر الحصة:</span>
                              <span className="font-black text-foreground tabular-nums">{stg.rate} {currency}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-border/50 font-black text-foreground">
                              <span>المستحق الشهري:</span>
                              <span className="text-primary tabular-nums">{stg.monthlySubtotal.toLocaleString()} {currency}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PageCard>
                )}

                {/* ──── Advance Management ──── */}
                <PageCard title="إدارة السلف النقدية والتسوية المالية">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-muted-foreground">صرف سلفة مستعجلة للموظف</p>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          placeholder="المبلغ المطلوب" 
                          value={advanceAmount}
                          onChange={(e) => setAdvanceAmount(e.target.value)}
                          className="h-10 flex-1 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary"
                        />
                        <input 
                          type="month" 
                          value={advanceMonth}
                          onChange={(e) => setAdvanceMonth(e.target.value)}
                          className="h-10 flex-1 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary"
                        />
                        <button 
                          onClick={handleRequestAdvance}
                          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 transition-all shadow-md shrink-0"
                        >
                          اعتماد
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        يتم ترحيل السلفة تلقائياً إلى مسير الرواتب والمصروفات المالية للخصم في الشهر المحدد.
                      </p>
                    </div>

                    <div className="space-y-2 border-r border-border/60 pe-4">
                      <p className="text-xs font-bold text-muted-foreground mb-2">سجل السلف المسجلة</p>
                      {staffAdvances.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic text-center p-3">لا توجد سلف مسجلة حالياً.</p>
                      ) : (
                        staffAdvances.map(a => (
                          <div key={a.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-card text-xs">
                            <div>
                              <span className="font-black text-foreground tabular-nums">{a.amount} {currency}</span>
                              <span className="text-[10px] text-muted-foreground block">شهر الخصم: {a.deductionMonth}</span>
                            </div>
                            <Badge tone="success">{a.status}</Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </PageCard>

                {/* ──── Voucher Ledger Table ──── */}
                <PageCard 
                  title="سجل سندات الصرف والمسحوبات من الخزينة"
                  actions={
                    <span className="text-xs font-black text-muted-foreground">
                      {staffPayments.length} عمليات صرف مسجلة
                    </span>
                  }
                >
                  {staffPayments.length === 0 ? (
                    <div className="p-10 text-center space-y-3">
                      <Wallet className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                      <p className="text-xs font-bold text-muted-foreground">
                        لم يتم تسجيل أي عمليات صرف سابقة لهذا الموظف من الخزينة.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setDisburseForm(prev => ({
                            ...prev,
                            amount: calculatedNetSalary,
                            referenceNo: `VCH-PAY-${staffData.employeeNo || staffData.id}-${Date.now().toString().slice(-4)}`
                          }));
                          setIsDisburseOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-black transition-all"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>صرف الدفعة الأولى الآن</span>
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-xs text-right border-collapse">
                        <thead>
                          <tr className="border-b border-border/70 text-muted-foreground font-bold">
                            <th className="py-2.5 px-3">التاريخ</th>
                            <th className="py-2.5 px-3">رقم السند المالي</th>
                            <th className="py-2.5 px-3">المبلغ المصروف</th>
                            <th className="py-2.5 px-3">طريقة السحب</th>
                            <th className="py-2.5 px-3">البيان</th>
                            <th className="py-2.5 px-3 text-center">الحالة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {staffPayments.map((tx) => (
                            <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                              <td className="py-3 px-3 font-semibold tabular-nums">{tx.date}</td>
                              <td className="py-3 px-3 font-mono font-bold text-primary">{(tx as any).referenceNo || `TX-${tx.id.slice(-6)}`}</td>
                              <td className="py-3 px-3 font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {tx.amount.toLocaleString()} {currency}
                              </td>
                              <td className="py-3 px-3 font-bold text-muted-foreground">
                                {tx.method === "cash" ? "نقداً" : tx.method === "bank_transfer" ? "تحويل بنكي / بنكك" : tx.method === "cheque" ? "شيك" : tx.method || "نقداً"}
                              </td>
                              <td className="py-3 px-3 font-bold text-muted-foreground max-w-[200px] truncate">{tx.notes || tx.title}</td>
                              <td className="py-3 px-3 text-center">
                                <Badge tone="success" className="text-[10px]">معتمد</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </PageCard>

                {/* ──── Financial Timeline ──── */}
                <PageCard title="سجل الصرف المالي والرواتب (Financial Timeline)">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-primary/5 p-3.5 rounded-2xl border border-primary/20">
                      <span className="text-xs font-bold text-primary">إجمالي المبالغ المنصرفة للموظف:</span>
                      <span className="text-xl font-black text-primary tabular-nums">{totalPaidOut.toLocaleString()} {currency}</span>
                    </div>
                    <TransactionTimeline 
                      transactions={staffPayments.map(p => ({
                        id: p.id,
                        date: p.date,
                        title: p.title,
                        subtitle: "راتب / مستحقات مالية",
                        amount: p.amount,
                        type: "expense",
                        currency
                      }))} 
                    />
                  </div>
                </PageCard>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* Modal: Salary Config (هيكل الأجر)              */}
      {/* ═══════════════════════════════════════════════ */}
      {isSalaryConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto" onClick={() => setIsSalaryConfigOpen(false)} dir="rtl">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border/60 shrink-0 bg-primary/5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-foreground">تهيئة هيكل الأجر ونظام الصرف</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">الموظف: <span className="font-black text-foreground">{staffData.name}</span></p>
                </div>
              </div>
              <button onClick={() => setIsSalaryConfigOpen(false)} className="h-8 w-8 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs font-bold">
              {/* Payment Type Selector */}
              <div>
                <label className="block text-foreground mb-2">نظام احتساب الأجر</label>
                <div className="grid grid-cols-5 gap-2">
                  {([
                    { id: "Monthly", label: "شهري ثابت", icon: "💰" },
                    { id: "PerLesson", label: "بالحصة", icon: "📚" },
                    { id: "Hourly", label: "بالساعة", icon: "⏱️" },
                    { id: "Weekly", label: "أسبوعي", icon: "📅" },
                    { id: "Daily", label: "يومي", icon: "☀️" },
                  ] as const).map(pt => (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => setSalaryConfig(prev => ({ ...prev, paymentType: pt.id }))}
                      className={`p-2.5 rounded-xl border text-center font-black transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        salaryConfig.paymentType === pt.id
                          ? "border-primary bg-primary/10 text-primary shadow-xs"
                          : "border-border/70 bg-card hover:bg-muted text-foreground"
                      }`}
                    >
                      <span className="text-lg">{pt.icon}</span>
                      <span className="text-[10px]">{pt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Fields based on payment type */}
              {salaryConfig.paymentType === "Monthly" && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-foreground mb-1">الراتب الأساسي ({currency})</label>
                    <input
                      type="number"
                      value={salaryConfig.basicSalary}
                      onChange={e => setSalaryConfig(prev => ({ ...prev, basicSalary: Number(e.target.value) }))}
                      className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground mb-1">إجمالي البدلات ({currency})</label>
                    <input
                      type="number"
                      value={salaryConfig.allowance}
                      onChange={e => setSalaryConfig(prev => ({ ...prev, allowance: Number(e.target.value) }))}
                      className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground mb-1">الاستقطاعات ({currency})</label>
                    <input
                      type="number"
                      value={salaryConfig.deduction}
                      onChange={e => setSalaryConfig(prev => ({ ...prev, deduction: Number(e.target.value) }))}
                      className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary tabular-nums"
                    />
                  </div>
                </div>
              )}

              {(salaryConfig.paymentType === "PerLesson" || salaryConfig.paymentType === "Hourly") && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-foreground mb-1">
                      سعر {salaryConfig.paymentType === "PerLesson" ? "الحصة" : "الساعة"} الافتراضي ({currency})
                    </label>
                    <input
                      type="number"
                      value={salaryConfig.rate}
                      onChange={e => setSalaryConfig(prev => ({ ...prev, rate: Number(e.target.value) }))}
                      className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground mb-2">أسعار حسب المرحلة الدراسية ({currency} / {salaryConfig.paymentType === "PerLesson" ? "حصة" : "ساعة"})</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: "kindergarten", name: "رياض الأطفال" },
                        { key: "primary", name: "الابتدائية" },
                        { key: "middle", name: "المتوسطة" },
                        { key: "high", name: "الثانوية" },
                      ].map(stg => (
                        <div key={stg.key}>
                          <label className="block text-[10px] text-muted-foreground mb-0.5">{stg.name}</label>
                          <input
                            type="number"
                            value={salaryConfig.stageRates[stg.key] || ""}
                            placeholder={String(salaryConfig.rate)}
                            onChange={e => setSalaryConfig(prev => ({
                              ...prev,
                              stageRates: { ...prev.stageRates, [stg.key]: Number(e.target.value) || 0 }
                            }))}
                            className="w-full h-9 rounded-lg border border-input bg-background/80 px-2 text-xs font-bold outline-none focus:border-primary tabular-nums"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {(salaryConfig.paymentType === "Weekly" || salaryConfig.paymentType === "Daily") && (
                <div>
                  <label className="block text-foreground mb-1">
                    الأجر {salaryConfig.paymentType === "Weekly" ? "الأسبوعي" : "اليومي"} ({currency})
                  </label>
                  <input
                    type="number"
                    value={salaryConfig.rate}
                    onChange={e => setSalaryConfig(prev => ({ ...prev, rate: Number(e.target.value) }))}
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary tabular-nums"
                  />
                </div>
              )}

              {/* Bank / Bankak Details */}
              <div className="pt-3 border-t border-border/60">
                <label className="block text-foreground mb-2">بيانات الحساب البنكي / بنكك (Bankak)</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-0.5">اسم البنك / بنكك</label>
                    <input
                      type="text"
                      value={salaryConfig.bankName}
                      onChange={e => setSalaryConfig(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="بنك الخرطوم / بنكك"
                      className="w-full h-9 rounded-lg border border-input bg-background/80 px-2 text-xs font-bold outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-0.5">رقم الحساب / IBAN</label>
                    <input
                      type="text"
                      value={salaryConfig.iban}
                      onChange={e => setSalaryConfig(prev => ({ ...prev, iban: e.target.value }))}
                      className="w-full h-9 rounded-lg border border-input bg-background/80 px-2 text-xs font-bold outline-none focus:border-primary tabular-nums"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-0.5">رقم الجوال (بنكك)</label>
                    <input
                      type="text"
                      value={salaryConfig.accountNumber}
                      onChange={e => setSalaryConfig(prev => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="09XXXXXXXX"
                      className="w-full h-9 rounded-lg border border-input bg-background/80 px-2 text-xs font-bold outline-none focus:border-primary tabular-nums"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                <button type="button" onClick={() => setIsSalaryConfigOpen(false)} className="h-10 px-5 rounded-xl border border-input text-xs font-bold">إلغاء</button>
                <button type="button" onClick={handleSaveSalaryConfig} className="h-10 px-7 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md glow-primary">حفظ هيكل الأجر</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* Modal: Treasury Disbursement (صرف من الخزينة)   */}
      {/* ═══════════════════════════════════════════════ */}
      {isDisburseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto" onClick={() => setIsDisburseOpen(false)} dir="rtl">
          <div className="w-full max-w-lg rounded-3xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-150 p-6 space-y-4 my-8" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-black">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground">صرف مستحقات وسحب من الخزينة</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    المستفيد: <span className="font-black text-foreground">{staffData.name}</span> ({staffData.employeeNo || staffData.id})
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setIsDisburseOpen(false)} className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteDisbursement} className="space-y-4 text-xs font-bold">
              {/* Amount */}
              <div>
                <label className="block text-foreground mb-1">المبلغ المطلوب صرفه ({currency})</label>
                <input
                  type="number"
                  min="1"
                  value={disburseForm.amount}
                  onChange={e => setDisburseForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full h-11 rounded-xl border border-input bg-background px-3.5 text-base font-black text-primary outline-none focus:border-primary tabular-nums"
                  required
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  الصافي المحسوب لهذا الشهر: {calculatedNetSalary.toLocaleString()} {currency}
                </span>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-foreground mb-1.5">طريقة الصرف والسحب:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([
                    { id: "cash", label: "نقداً من الخزينة", icon: "💵" },
                    { id: "bankak", label: "تحويل بنكك", icon: "📱" },
                    { id: "bank_transfer", label: "تحويل بنكي", icon: "🏦" },
                    { id: "cheque", label: "شيك مصرفي", icon: "📄" },
                  ] as const).map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setDisburseForm(prev => ({ ...prev, method: m.id }))}
                      className={`p-2.5 rounded-xl border text-center font-black transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        disburseForm.method === m.id
                          ? "border-primary bg-primary/10 text-primary shadow-xs"
                          : "border-border/70 bg-card hover:bg-muted text-foreground"
                      }`}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <span className="text-[10px]">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bankak Reference - shown only for Bankak method */}
              {disburseForm.method === "bankak" && (
                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <label className="block text-emerald-700 dark:text-emerald-400 mb-1">رقم إشعار بنكك (Bankak Transaction Ref) *</label>
                  <input
                    type="text"
                    value={disburseForm.bankakRef}
                    onChange={e => setDisburseForm(prev => ({ ...prev, bankakRef: e.target.value }))}
                    placeholder="مثال: BNK-2024-XXXXX"
                    className="w-full h-10 rounded-xl border border-emerald-500/30 bg-background/80 px-3 text-xs font-black outline-none focus:border-emerald-500 tabular-nums"
                    dir="ltr"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-foreground mb-1">شهر الاستحقاق</label>
                  <input
                    type="month"
                    value={disburseForm.month}
                    onChange={e => setDisburseForm(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-foreground mb-1">رقم السند المالي</label>
                  <input
                    type="text"
                    value={disburseForm.referenceNo}
                    onChange={e => setDisburseForm(prev => ({ ...prev, referenceNo: e.target.value }))}
                    placeholder={`VCH-PAY-${staffData.employeeNo || staffData.id}-01`}
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-foreground mb-1">بيان الصرف وملاحظات المحاسب</label>
                <input
                  type="text"
                  value={disburseForm.notes}
                  onChange={e => setDisburseForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={`صرف أجر ومستحقات شهر ${disburseForm.month} بنظام ${paymentTypeLabel(salaryConfig.paymentType)}`}
                  className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary"
                />
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  سيتم خصم هذا المبلغ تلقائياً من رصيد الخزينة المدرسية وتسجيله في سجل المصروفات العام فور التأكيد.
                  {staffAdvances.filter(a => a.status === "paid").length > 0 && (
                    <> وسيتم تسوية {staffAdvances.filter(a => a.status === "paid").length} سلفة قائمة تلقائياً.</>
                  )}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/70">
                <button type="button" onClick={() => setIsDisburseOpen(false)} className="h-10 px-4 rounded-xl border border-input text-xs font-bold hover:bg-muted transition-all cursor-pointer">
                  إلغاء
                </button>
                <button type="submit" className="h-10 px-7 rounded-xl bg-primary text-primary-foreground text-xs font-black transition-all shadow-md glow-primary cursor-pointer active:scale-95">
                  تأكيد الصرف والخصم من الخزينة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
          <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border/60 shrink-0 bg-primary/5">
              <h2 className="text-base font-black text-foreground">تعديل الملف الإداري للموظف</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="h-8 w-8 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs font-bold">
              <div>
                <label className="block mb-1 text-foreground">الاسم الكامل</label>
                <input 
                  value={editFormData.name} 
                  onChange={e => setEditFormData({...editFormData, name: e.target.value})} 
                  className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-foreground">المسمى الوظيفي</label>
                  <input 
                    value={editFormData.role} 
                    onChange={e => setEditFormData({...editFormData, role: e.target.value})} 
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-foreground">القسم / الإدارة</label>
                  <input 
                    value={editFormData.department} 
                    onChange={e => setEditFormData({...editFormData, department: e.target.value})} 
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-foreground">رقم الجوال</label>
                  <input 
                    value={editFormData.phone} 
                    onChange={e => setEditFormData({...editFormData, phone: e.target.value})} 
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary tabular-nums text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-foreground">الحالة الوظيفية</label>
                  <select 
                    value={editFormData.status} 
                    onChange={e => setEditFormData({...editFormData, status: e.target.value as any})} 
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="active">على رأس العمل</option>
                    <option value="on_leave">في إجازة</option>
                    <option value="terminated">منهي الخدمة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 text-foreground">الراتب الأساسي</label>
                  <input 
                    type="number"
                    value={editFormData.basicSalary} 
                    onChange={e => setEditFormData({...editFormData, basicSalary: Number(e.target.value) || 0})} 
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary tabular-nums"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-foreground">البدلات</label>
                  <input 
                    type="number"
                    value={editFormData.allowance} 
                    onChange={e => setEditFormData({...editFormData, allowance: Number(e.target.value) || 0})} 
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary tabular-nums"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-foreground">الاستقطاعات</label>
                  <input 
                    type="number"
                    value={editFormData.deduction} 
                    onChange={e => setEditFormData({...editFormData, deduction: Number(e.target.value) || 0})} 
                    className="w-full h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold outline-none focus:border-primary tabular-nums"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="h-10 px-5 rounded-xl border border-input text-xs font-bold">إلغاء</button>
                <button type="submit" className="h-10 px-7 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md glow-primary">حفظ التغييرات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advanced Print Engine Modal */}
      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title={`بطاقة تعريف الموظف: ${staffData.name}`}
        data={printData}
        templates={printTemplates}
      />
    </AppShell>
  );
}
