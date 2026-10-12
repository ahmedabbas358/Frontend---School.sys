import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { AdminModal } from "@/components/admin/admin-modal";
import { FinanceNavTabs } from "@/components/finance/finance-nav";
import { useGlobalStore, TransportSubscription } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { usePaymentEngine } from "@/engines/finance/usePaymentEngine";
import { getGradesForStage } from "@/lib/school-structure";
import { Search, Filter, Printer, CheckCircle2, AlertTriangle, Users, Wallet, CreditCard, ChevronDown, Plus, X, Bus, Phone, User, Building, Layers, DollarSign, Send, ArrowRight, ShieldAlert, Receipt, Download, GraduationCap } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { FinancialCard, FilterBar } from "@/components/financial-components";

export const Route = createFileRoute("/finance/students")({
  component: FinanceStudents,
});

function FinanceStudents() {
  const { stage, getStageLabel } = useStage();
  const { 
    activeStageStudents, 
    activeStageInvoices, 
    activeStageSections,
    currency, 
    allPayments, 
    addInvoice, 
    allGuardians,
    transportRoutes,
    transportSubscriptions,
    addTransportSubscription,
    allFeeStructures,
    allDiscounts,
    allTreasuries,
    allBankAccounts,
    allCashSessions,
    currentAcademicYearId
  } = useGlobalStore();

  const { receiveLumpSumPayment } = usePaymentEngine();
  
  // Search and Filter States
  const [q, setQ] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | arrears | paid | no_fees
  const [transportFilter, setTransportFilter] = useState("all"); // all | subscribed | not_subscribed

  // Modals state
  const [statementModalData, setStatementModalData] = useState<any | null>(null);
  const [statementFilter, setStatementFilter] = useState<"all" | "unpaid" | "paid">("all");
  const [paymentModalData, setPaymentModalData] = useState<{ studentId: string, studentName: string, totalDue?: number } | null>(null);
  const [printedReceipt, setPrintedReceipt] = useState<any | null>(null);
  const [printStatementData, setPrintStatementData] = useState<any | null>(null);
  const [chargeModalData, setChargeModalData] = useState<{ studentId: string, studentName: string } | null>(null);
  const [transportModalData, setTransportModalData] = useState<{ studentId: string, studentName: string } | null>(null);
  const [isBulkBillingOpen, setIsBulkBillingOpen] = useState(false);
  const [bulkBillingGrade, setBulkBillingGrade] = useState("");
  const [bulkBillingSectionId, setBulkBillingSectionId] = useState("");
  const [bulkBillingScope, setBulkBillingScope] = useState<"all" | "grade" | "section">("all");
  const [bulkBillingAmount, setBulkBillingAmount] = useState<number>(0);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);

  // Grades available for current educational stage
  const availableGrades = useMemo(() => getGradesForStage(stage), [stage]);

  // Sections available for filtered grade
  const availableSections = useMemo(() => {
    let secs = activeStageSections || [];
    if (gradeFilter) {
      secs = secs.filter(s => s.grade === gradeFilter);
    }
    return [...secs].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [activeStageSections, gradeFilter]);

  // Transport subscriptions lookup map (studentId -> TransportSubscription)
  const transportMap = useMemo(() => {
    const map = new Map<string, TransportSubscription>();
    (transportSubscriptions || []).forEach(sub => {
      if (sub && sub.studentId) map.set(sub.studentId, sub);
    });
    return map;
  }, [transportSubscriptions]);

  // Transport routes lookup map
  const routeMap = useMemo(() => {
    const map = new Map<string, typeof transportRoutes[0]>();
    (transportRoutes || []).forEach(r => { if (r && r.id) map.set(r.id, r); });
    return map;
  }, [transportRoutes]);

  // Guardians lookup map
  const guardianMap = useMemo(() => {
    const map = new Map<string, typeof allGuardians[0]>();
    (allGuardians || []).forEach(g => { if (g && g.id) map.set(g.id, g); });
    return map;
  }, [allGuardians]);

  // Compute detailed financial and transport status per student
  const studentFinancials = useMemo(() => {
    const students = activeStageStudents || [];
    const invoices = activeStageInvoices || [];
    const sections = activeStageSections || [];

    return students.map(student => {
      const studentInvoices = invoices.filter(inv => inv && inv.studentId === student.id && inv.status !== "cancelled");
      
      const totalFees = studentInvoices.reduce((sum, inv) => sum + (inv.netAmount ?? inv.amount ?? 0), 0);
      const totalPaid = studentInvoices.reduce((sum, inv) => sum + (inv.paid || 0), 0);
      const totalDue = Math.max(0, totalFees - totalPaid);

      // Section info
      const section = sections.find(s => s.id === student.sectionId || (s.grade === student.grade && s.name === (student as any).sectionName));

      // Guardian info
      const guardian = (student as any).guardianId ? guardianMap.get((student as any).guardianId) : undefined;

      // Transport info
      const transportSub = transportMap.get(student.id);
      const transportRoute = transportSub ? routeMap.get(transportSub.routeId) : undefined;

      return {
        ...student,
        sectionObj: section,
        guardianObj: guardian,
        transportSub,
        transportRoute,
        totalFees,
        totalPaid,
        totalDue,
        invoices: studentInvoices
      };
    }).filter(s => {
      // Search Query
      if (q) {
        const searchLower = q.toLowerCase();
        const matchName = s.name?.toLowerCase().includes(searchLower);
        const matchId = s.id?.toLowerCase().includes(searchLower);
        const matchNationalId = s.nationalId?.toLowerCase().includes(searchLower);
        const matchGuardian = s.guardianObj?.name?.toLowerCase().includes(searchLower) || s.guardianObj?.phone?.includes(searchLower);
        if (!matchName && !matchId && !matchNationalId && !matchGuardian) return false;
      }

      // Grade Filter
      if (gradeFilter && s.grade !== gradeFilter) return false;

      // Section Filter
      if (sectionFilter && s.sectionId !== sectionFilter && s.sectionObj?.id !== sectionFilter) return false;

      // Financial Status Filter
      if (statusFilter === "arrears" && s.totalDue <= 0) return false;
      if (statusFilter === "paid" && (s.totalDue > 0 || s.totalFees === 0)) return false;
      if (statusFilter === "no_fees" && s.totalFees > 0) return false;

      // Transport Filter
      if (transportFilter === "subscribed" && !s.transportSub) return false;
      if (transportFilter === "not_subscribed" && s.transportSub) return false;

      return true;
    });
  }, [activeStageStudents, activeStageInvoices, activeStageSections, guardianMap, transportMap, routeMap, q, gradeFilter, sectionFilter, statusFilter, transportFilter]);

  // Aggregate Stats
  const aggregateStats = useMemo(() => {
    let totalExpected = 0;
    let totalCollected = 0;
    let totalArrears = 0;
    let transportSubscribers = 0;

    studentFinancials.forEach(s => {
      totalExpected += s.totalFees;
      totalCollected += s.totalPaid;
      totalArrears += s.totalDue;
      if (s.transportSub) transportSubscribers++;
    });

    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    return { totalExpected, totalCollected, totalArrears, transportSubscribers, collectionRate, count: studentFinancials.length };
  }, [studentFinancials]);

  // Actions
  const handleRecordPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!paymentModalData) return;
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    const method = formData.get("method") as "cash" | "bank_transfer" | "card" | "cheque";
    const notes = formData.get("notes") as string;
    const accountId = formData.get("accountId") as string;
    
    // Check if cash and get active session
    const activeSession = (allCashSessions || []).find(s => s.status === "open");
    const destinationAccountId = accountId || (method === "cash" ? "gl-treasury-main" : "ACC-102");

    try {
      receiveLumpSumPayment(
        paymentModalData.studentId, 
        amount, 
        method, 
        destinationAccountId,
        method === "cash" ? activeSession?.id : undefined,
        notes
      );
      toast.success(`تم تسجيل سند القبض بقيمة ${amount.toLocaleString()} ${currency} للطالب ${paymentModalData.studentName} بنجاح`);

      // Set up receipt voucher for immediate viewing / printing
      const recId = `REC-${Math.floor(10000 + Math.random() * 90000)}`;
      setPrintedReceipt({
        id: recId,
        studentName: paymentModalData.studentName,
        studentId: paymentModalData.studentId,
        amount,
        method,
        notes: notes || "سداد رسوم دراسية",
        date: new Date().toISOString().split("T")[0],
        academicYear: currentAcademicYearId || "1446-1447هـ",
        stageLabel: getStageLabel(stage),
        cashier: activeSession?.openedBy || "أمين الصندوق"
      });

    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء تسجيل السند");
    }
    setPaymentModalData(null);
  };

  const handleShareWhatsApp = (st: any) => {
    const rawPhone = st.guardianObj?.phone || "";
    const phone = rawPhone.replace(/\D/g, "");
    if (!phone) {
      toast.error("لا يوجد رقم هاتف مسجل لولي الأمر");
      return;
    }
    const text = encodeURIComponent(
      `السلام عليكم ورحمة الله وبركاته\nالسيد ولي أمر الطالب: ${st.name}\nنود تذكيركم بأن الرصيد المتبقي للرسوم المدرسية هو (${st.totalDue.toLocaleString()} ${currency}).\nشاكرين لكم اهتمامكم وتعاونكم الدائم.\n- إدارة الشؤون المالية - ${getStageLabel(stage)}`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  const handleAddCharge = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!chargeModalData) return;
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    const title = formData.get("title") as string;
    
    addInvoice({
      studentId: chargeModalData.studentId,
      studentName: chargeModalData.studentName,
      stage,
      amount,
      title,
      dueDate: new Date().toISOString().split("T")[0],
      issueDate: new Date().toISOString().split("T")[0],
    });
    toast.success(`تم إسناد فاتورة رسوم جديدة بقيمة ${amount.toLocaleString()} ${currency}`);
    setChargeModalData(null);
  };

  const handleSubscribeTransport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!transportModalData) return;
    const formData = new FormData(e.currentTarget);
    const routeId = formData.get("routeId") as string;
    const direction = formData.get("direction") as "round-trip" | "going" | "returning";
    const route = routeMap.get(routeId);
    if (!route) {
      toast.error("يرجى اختيار مسار الترحيل");
      return;
    }

    const feeAmount = direction === "round-trip" ? route.feeAmount : Math.round(route.feeAmount * 0.6);

    // Add Transport Subscription
    addTransportSubscription({
      studentId: transportModalData.studentId,
      routeId,
      direction,
      status: "active"
    });

    // Add Transport Fee Invoice automatically
    addInvoice({
      studentId: transportModalData.studentId,
      studentName: transportModalData.studentName,
      stage,
      amount: feeAmount,
      title: `رسوم الترحيل المدرسي - ${route.name} (${direction === 'round-trip' ? 'اتجاهين' : direction === 'going' ? 'ذهاب' : 'إياد'})`,
      dueDate: new Date().toISOString().split("T")[0],
      issueDate: new Date().toISOString().split("T")[0],
    });

    toast.success(`تم ربط الطالب ${transportModalData.studentName} بمسار ${route.name} وإصدار فاتورة الترحيل بنجاح`);
    setTransportModalData(null);
  };

  // Bulk Billing Action for Whole Grade/Section
  const handleBulkBilling = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const targetScope = formData.get("scope") as "all" | "grade" | "section";
    const selectedGrade = formData.get("grade") as string;
    const selectedSectionId = formData.get("sectionId") as string;
    const feeTitle = formData.get("title") as string;
    const feeAmount = Number(formData.get("amount"));

    let targetStudents = activeStageStudents;
    if (targetScope === "grade" && selectedGrade) {
      targetStudents = targetStudents.filter(s => s.grade === selectedGrade);
    } else if (targetScope === "section" && selectedSectionId) {
      targetStudents = targetStudents.filter(s => s.sectionId === selectedSectionId);
    }

    if (targetStudents.length === 0) {
      toast.error("لا يوجد طلاب ينطبق عليهم القيد المحدد");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    let createdCount = 0;

    targetStudents.forEach(st => {
      addInvoice({
        studentId: st.id,
        studentName: st.name,
        stage,
        amount: feeAmount,
        title: feeTitle,
        dueDate: today,
        issueDate: today,
      });
      createdCount++;
    });

    toast.success(`تم إصدار فواتير جماعية لـ ${createdCount} طالب بنجاح بقيمة ${feeAmount.toLocaleString()} ${currency}`);
    setIsBulkBillingOpen(false);
  };

  // Report print templates
  const printTemplates: PrintTemplate[] = [
    {
      id: "arrears-report",
      name: "تقرير كشف المتأخرات الطلابية",
      category: "المالية والمحاسبة",
      type: "table",
      columns: [
        { key: "id", label: "رقم الطالب" },
        { key: "name", label: "اسم الطالب" },
        { key: "grade", label: "الصف" },
        { key: "totalFees", label: "إجمالي الرسوم" },
        { key: "totalPaid", label: "المحصل" },
        { key: "totalDue", label: "المتبقي (المتأخرات)" },
      ]
    }
  ];

  const handleExportCSV = () => {
    if (studentFinancials.length === 0) {
      toast.error("لا توجد بيانات طلاب لتصديرها");
      return;
    }

    const headers = [
      "رقم الطالب",
      "اسم الطالب",
      "الهوية الوطنية",
      "المرحلة",
      "الصف",
      "الشعبة",
      "ولي الأمر",
      "هاتف ولي الأمر",
      "إجمالي الرسوم",
      "المحصل",
      "المتبقي (المتأخرات)",
      "حالة السداد",
      "اشتراك الترحيل"
    ];

    const rows = studentFinancials.map((s: any) => [
      s.id,
      `"${s.name?.replace(/"/g, '""') || ''}"`,
      `"${s.nationalId || ''}"`,
      `"${getStageLabel(s.stage)}"`,
      `"${s.grade || ''}"`,
      `"${s.sectionObj?.name || s.sectionName || ''}"`,
      `"${s.guardianObj?.name?.replace(/"/g, '""') || ''}"`,
      `"${s.guardianObj?.phone || ''}"`,
      s.totalFees || 0,
      s.totalPaid || 0,
      s.totalDue || 0,
      s.totalDue <= 0 ? "مسدد بالكامل" : "عليه متأخرات",
      s.transportSub ? `مشترك (${s.transportRoute?.name || ''})` : "غير مشترك"
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `سجل_المالية_الطلابية_${getStageLabel(stage)}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير كشف المالية الطلابية بنجاح");
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance/dashboard" },
        { label: "المالية الطلابية الكلية" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportCSV}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-card border border-border/80 text-foreground px-3.5 text-xs font-bold shadow-sm hover:bg-accent transition-all shrink-0 whitespace-nowrap"
          >
            <Download className="h-4 w-4 text-primary" /> تصدير CSV
          </button>
          <button 
            onClick={() => setIsBulkBillingOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-600 text-white px-3.5 text-xs font-extrabold shadow-sm hover:bg-emerald-700 transition-all shrink-0 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> إصدار رسوم جماعية
          </button>
          <button 
            onClick={() => setIsPrintReportOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary text-primary-foreground px-3.5 text-xs font-extrabold shadow-sm hover:bg-primary/90 transition-all shrink-0 whitespace-nowrap"
          >
            <Printer className="h-4 w-4" /> طباعة كشف المتأخرات
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        {/* Navigation Tabs */}
        <FinanceNavTabs activeTab="students" />
        
        {/* Top Financial Command KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <FinancialCard 
            title="عدد الطلاب بالقائمة" 
            value={aggregateStats.count} 
            currency="طالب" 
            icon={Users} 
            colorClass="text-primary bg-primary" 
          />
          <FinancialCard 
            title="إجمالي المطالبات" 
            value={aggregateStats.totalExpected} 
            currency={currency} 
            icon={Wallet} 
            colorClass="text-blue-600 bg-blue-500" 
          />
          <FinancialCard 
            title="المدفوع (المحصل)" 
            value={aggregateStats.totalCollected} 
            currency={currency} 
            icon={CheckCircle2} 
            colorClass="text-emerald-600 bg-emerald-500" 
          />
          <FinancialCard 
            title="المتبقي (المتأخرات)" 
            value={aggregateStats.totalArrears} 
            currency={currency} 
            icon={AlertTriangle} 
            colorClass="text-rose-600 bg-rose-500" 
          />
          <FinancialCard 
            title="المشتركين بالتراحيل" 
            value={aggregateStats.transportSubscribers} 
            currency="طالب" 
            icon={Bus} 
            colorClass="text-amber-600 bg-amber-500" 
          />
        </div>

        {/* Structured Grid Filter Bar */}
        <FilterBar 
          onClear={(gradeFilter || sectionFilter || statusFilter !== "all" || transportFilter !== "all" || q) ? () => {
            setQ("");
            setGradeFilter("");
            setSectionFilter("");
            setStatusFilter("all");
            setTransportFilter("all");
          } : undefined}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-center">
            {/* Search Input */}
            <div className="relative sm:col-span-2 md:col-span-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input 
                type="text"
                placeholder="ابحث باسم الطالب، رقم القيد، الهوية..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full h-10 pl-3 pr-9 bg-background border border-border/60 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>

            {/* Grade Filter */}
            <select
              value={gradeFilter}
              onChange={(e) => { setGradeFilter(e.target.value); setSectionFilter(""); }}
              className="h-10 bg-background border border-border/60 rounded-xl px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="">جميع الصفوف</option>
              {availableGrades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            {/* Section Filter */}
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="h-10 bg-background border border-border/60 rounded-xl px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="">جميع الشعب</option>
              {availableSections.map(s => (
                <option key={s.id} value={s.id}>{s.grade} - شعبة {s.name}</option>
              ))}
            </select>

            {/* Financial Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 bg-background border border-border/60 rounded-xl px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="all">جميع الحالات المالية</option>
              <option value="arrears">عليهم متأخرات (مستحق)</option>
              <option value="paid">مسددين بالكامل</option>
              <option value="no_fees">بدون رسوم مسجلة</option>
            </select>

            {/* Transport Filter */}
            <select
              value={transportFilter}
              onChange={(e) => setTransportFilter(e.target.value)}
              className="h-10 bg-background border border-border/60 rounded-xl px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="all">جميع التراحيل</option>
              <option value="subscribed">مشترك بالترحيل 🚌</option>
              <option value="not_subscribed">غير مشترك</option>
            </select>
          </div>
        </FilterBar>

        {/* Paginated Student Financials Table */}
        <PageCard className="p-1">
          <DataTable
            columns={[
              { 
                key: "id", 
                header: "رقم الطالب", 
                cell: (r: any) => (
                  <span className="font-mono text-[11px] font-bold bg-muted/60 text-muted-foreground px-2 py-1 rounded-lg border border-border/40 max-w-[110px] truncate block" title={r.id}>
                    {r.id.length > 14 ? `${r.id.slice(0, 11)}...` : r.id}
                  </span>
                )
              },
              { 
                key: "name", 
                header: "اسم الطالب وولي الأمر", 
                cell: (r: any) => (
                  <div className="space-y-0.5">
                    <div className="font-black text-sm text-foreground flex items-center gap-1.5">
                      {r.name}
                      <Link to={`/students/$id`} params={{ id: r.id }} className="text-primary hover:underline text-xs" title="عرض الملف الأكاديمي">
                        <User className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 font-bold">
                      <span className="text-primary font-bold">{r.grade}</span>
                      {r.guardianObj && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="w-3 h-3 text-muted-foreground/70" /> {r.guardianObj.name} ({r.guardianObj.phone})
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )
              },
              { 
                key: "section", 
                header: "الصف والشعبة", 
                cell: (r: any) => (
                  <div>
                    <span className="font-bold text-xs bg-muted/80 px-2.5 py-0.5 rounded-lg border border-border/50 inline-block">
                      شعبة {r.sectionObj?.name || r.sectionName || "عام"}
                    </span>
                  </div>
                )
              },
              { 
                key: "transport", 
                header: "التراحيل والنقل", 
                cell: (r: any) => (
                  r.transportSub && r.transportRoute ? (
                    <Badge tone="warning" className="flex items-center gap-1 text-xs font-bold">
                      <Bus className="w-3.5 h-3.5" /> {r.transportRoute.name}
                    </Badge>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setTransportModalData({ studentId: r.id, studentName: r.name }); }}
                      className="text-xs font-extrabold text-muted-foreground hover:text-amber-600 bg-muted/40 hover:bg-amber-50 px-2.5 py-1 rounded-lg transition-colors border border-border/40 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> ربط الترحيل
                    </button>
                  )
                )
              },
              { 
                key: "totalFees", 
                header: "إجمالي الرسوم", 
                cell: (r: any) => <span className="font-bold tabular-nums whitespace-nowrap text-sm">{r.totalFees.toLocaleString()} {currency}</span> 
              },
              { 
                key: "totalPaid", 
                header: "المحصل (المدفوع)", 
                cell: (r: any) => <span className="text-emerald-600 font-black tabular-nums whitespace-nowrap text-sm">+{r.totalPaid.toLocaleString()} {currency}</span> 
              },
              { 
                key: "totalDue", 
                header: "المتبقي (المتأخرات)", 
                cell: (r: any) => (
                  <span className={r.totalDue > 0 ? "text-rose-600 font-black tabular-nums whitespace-nowrap text-base" : "text-muted-foreground font-bold"}>
                    {r.totalDue.toLocaleString()} {currency}
                  </span>
                )
              },
              { 
                key: "status", 
                header: "الحالة المالية", 
                cell: (r: any) => (
                  r.totalDue > 0 
                    ? <Badge tone="danger"><AlertTriangle className="w-3 h-3 ml-1" /> متأخرات</Badge>
                    : r.totalFees > 0 
                      ? <Badge tone="success"><CheckCircle2 className="w-3 h-3 ml-1" /> مسدد بالكامل</Badge>
                      : <Badge tone="neutral">لا يوجد رسوم</Badge>
                )
              },
              { 
                key: "actions", 
                header: "إجراءات مالية", 
                cell: (r: any) => (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => setPaymentModalData({ studentId: r.id, studentName: r.name, totalDue: r.totalDue })}
                      className="text-xs font-extrabold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                      title="تسجيل دفعة سريعة (سند قبض)"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> قبض
                    </button>
                    <button 
                      onClick={() => setChargeModalData({ studentId: r.id, studentName: r.name })}
                      className="text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white px-2 py-1.5 rounded-xl transition-all shrink-0"
                      title="إضافة رسم جديد"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setStatementModalData(r)}
                      className="text-xs font-extrabold bg-muted hover:bg-accent text-foreground px-2.5 py-1.5 rounded-xl transition-all shrink-0 whitespace-nowrap"
                    >
                      كشف الحساب
                    </button>
                  </div>
                )
              }
            ]}
            rows={studentFinancials}
            onRowClick={(r) => setStatementModalData(r)}
            pageSize={10}
            pageSizeOptions={[10, 25, 50, 100]}
            empty="لا يوجد طلاب يطابقون خيارات التصفية والبحث الحالية"
          />
        </PageCard>
      </div>

      {/* --- Student 360 Statement Ledger Modal --- */}
      <AdminModal
        isOpen={Boolean(statementModalData)}
        onClose={() => setStatementModalData(null)}
        title={statementModalData ? `كشف حساب الطالب: ${statementModalData.name}` : "كشف حساب الطالب"}
        description={statementModalData ? `${statementModalData.grade} • شعبة ${statementModalData.sectionObj?.name || statementModalData.sectionName || "عام"}${statementModalData.guardianObj ? ` • ولي الأمر: ${statementModalData.guardianObj.name} (${statementModalData.guardianObj.phone})` : ""}` : undefined}
        icon={GraduationCap}
        tone="primary"
        maxWidth="4xl"
        footer={
          <div className="flex justify-between items-center w-full">
            <span className="text-xs font-bold text-muted-foreground">
              إجمالي الرصيد المتبقي: <strong className="text-rose-600 font-black tabular-nums">{statementModalData ? (statementModalData.totalDue || 0).toLocaleString() : 0} {currency}</strong>
            </span>
            <button
              type="button"
              onClick={() => setStatementModalData(null)}
              className="h-9 px-5 rounded-xl border border-border/80 bg-background hover:bg-accent text-xs font-bold transition-all cursor-pointer"
            >
              إغلاق الكشف
            </button>
          </div>
        }
      >
        {statementModalData && (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-wrap gap-2 justify-between items-center bg-muted/30 p-3 rounded-2xl border border-border/50">
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => setPaymentModalData({ studentId: statementModalData.id, studentName: statementModalData.name, totalDue: statementModalData.totalDue })} 
                  className="btn-primary text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl active:scale-[0.98] shadow-sm flex items-center gap-1 cursor-pointer px-3"
                >
                  <CreditCard className="w-4 h-4"/> تسجيل دفعة (سند قبض)
                </button>
                <button 
                  onClick={() => setChargeModalData({ studentId: statementModalData.id, studentName: statementModalData.name })} 
                  className="btn-secondary text-xs h-9 font-bold rounded-xl active:scale-[0.98] flex items-center gap-1 cursor-pointer px-3 border border-border"
                >
                  <Plus className="w-4 h-4 text-primary"/> إضافة رسم خاص
                </button>
                <button 
                  onClick={() => setTransportModalData({ studentId: statementModalData.id, studentName: statementModalData.name })} 
                  className="btn-secondary text-xs h-9 font-bold border-amber-500/40 hover:bg-amber-500/10 text-amber-600 rounded-xl active:scale-[0.98] flex items-center gap-1 cursor-pointer px-3 border"
                >
                  <Bus className="w-4 h-4"/> {statementModalData.transportSub ? "تعديل الترحيل" : "إضافة ترحيل"}
                </button>
                <button 
                  onClick={() => setPrintStatementData(statementModalData)}
                  className="btn-secondary text-xs h-9 font-bold border-blue-500/40 hover:bg-blue-500/10 text-blue-600 rounded-xl active:scale-[0.98] flex items-center gap-1 cursor-pointer px-3 border"
                  title="معاينة وطباعة كشف حساب معتمد ومختوم للطالب"
                >
                  <Printer className="w-4 h-4"/> طباعة الكشف المعتمد
                </button>
                <button 
                  onClick={() => handleShareWhatsApp(statementModalData)}
                  className="btn-secondary text-xs h-9 font-bold border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-600 rounded-xl active:scale-[0.98] flex items-center gap-1 cursor-pointer px-3 border"
                  title="إرسال رسالة تذكير بالرصيد المتبقي عبر تطبيق واتساب لولي الأمر"
                >
                  واتساب لولي الأمر
                </button>
              </div>

              {/* Financial Balance Summary */}
              <div className="flex items-center gap-4 bg-background px-3.5 py-1.5 rounded-xl border border-border/50 text-xs">
                <div>
                  <span className="text-muted-foreground font-bold">المحصل: </span>
                  <span className="font-extrabold text-success tabular-nums">{statementModalData.totalPaid.toLocaleString()} {currency}</span>
                </div>
                <div className="h-4 w-px bg-border/60"></div>
                <div>
                  <span className="text-muted-foreground font-bold">المتبقي: </span>
                  <span className="font-black text-danger tabular-nums">{statementModalData.totalDue.toLocaleString()} {currency}</span>
                </div>
              </div>
            </div>

            {/* Filter Pills for Statement Invoices */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50 text-xs">
                <button
                  type="button"
                  onClick={() => setStatementFilter("all")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    statementFilter === "all" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  جميع المطالبات ({statementModalData.invoices?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setStatementFilter("unpaid")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    statementFilter === "unpaid" ? "bg-amber-500 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  المستحقة / غير المسددة ({statementModalData.invoices?.filter((i: any) => (i.netAmount - (i.paidAmount || 0)) > 0).length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setStatementFilter("paid")}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    statementFilter === "paid" ? "bg-emerald-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  المسددة بالكامل ({statementModalData.invoices?.filter((i: any) => (i.netAmount - (i.paidAmount || 0)) <= 0).length || 0})
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground font-bold">
                تاريخ الكشف: {new Date().toLocaleDateString('ar-EG')}
              </p>
            </div>

            {/* Invoices & Ledger Table */}
            <div>
              {statementModalData.invoices.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground font-bold bg-muted/20 rounded-2xl border border-dashed border-border/60">
                  لا توجد فواتير أو مستحقات مالية مسجلة لهذا الطالب حتى الآن.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border/60">
                  <table className="w-full text-start text-xs font-bold">
                    <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground">
                      <tr>
                        <th className="px-3.5 py-3 text-start">رقم وتاريخ المطالبة</th>
                        <th className="px-3.5 py-3 text-start">البيان والتفاصيل</th>
                        <th className="px-3.5 py-3 text-start">المبلغ الأصلي</th>
                        <th className="px-3.5 py-3 text-start">الخصم</th>
                        <th className="px-3.5 py-3 text-start">الصافي</th>
                        <th className="px-3.5 py-3 text-start">المسدد</th>
                        <th className="px-3.5 py-3 text-start">المتبقي المطلوب</th>
                        <th className="px-3.5 py-3 text-start">الحالة</th>
                        <th className="px-3.5 py-3 text-center">إجراء سريع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {(statementModalData.invoices || []).map((inv: any) => {
                        const net = inv.netAmount ?? inv.amount ?? 0;
                        const due = net - (inv.paid || 0);
                        return (
                          <tr key={inv.id} className="hover:bg-accent/20 transition-colors">
                            <td className="px-3.5 py-3">
                              <span className="font-mono text-xs font-black text-primary block">#{inv.id}</span>
                              <span className="text-[10px] text-muted-foreground block">{inv.issueDate || inv.dueDate || "-"}</span>
                            </td>
                            <td className="px-3.5 py-3 font-bold text-foreground">{inv.title}</td>
                            <td className="px-3.5 py-3 text-muted-foreground tabular-nums">{inv.amount?.toLocaleString()}</td>
                            <td className="px-3.5 py-3 text-orange-500 tabular-nums">{inv.discountAmount ? inv.discountAmount.toLocaleString() : "-"}</td>
                            <td className="px-3.5 py-3 font-bold text-foreground tabular-nums">{net?.toLocaleString()}</td>
                            <td className="px-3.5 py-3 text-emerald-600 font-bold tabular-nums">{inv.paid > 0 ? inv.paid.toLocaleString() : "-"}</td>
                            <td className="px-3.5 py-3 text-rose-600 font-black tabular-nums">{due > 0 ? `${due.toLocaleString()} ${currency}` : "-"}</td>
                            <td className="px-3.5 py-3">
                              {due <= 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">مسدد</span>
                              ) : inv.paid > 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/20">جزئي</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 border border-rose-500/20">مستحق</span>
                              )}
                            </td>
                            <td className="px-3.5 py-3 text-center">
                              {due > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setPaymentModalData({ studentId: statementModalData.id, studentName: statementModalData.name, totalDue: due })}
                                  className="px-2.5 py-1 text-[11px] font-black rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                                >
                                  سداد
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </AdminModal>
         {/* --- Quick Record Payment Modal (سند قبض كاشير متطور) --- */}
      <AdminModal
        isOpen={Boolean(paymentModalData)}
        onClose={() => setPaymentModalData(null)}
        title="تسجيل سند قبض وتحصيل مالي"
        description="توريد النقدية وتوثيق السند في حساب الطالب والصندوق"
        icon={CreditCard}
        tone="success"
        maxWidth="lg"
      >
        {paymentModalData && (
          <form onSubmit={handleRecordPayment} className="space-y-4">
            {/* Student Info & Balance Strip */}
            <div className="p-3.5 bg-muted/30 rounded-2xl border border-border/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-muted-foreground font-bold block">اسم الطالب</span>
                <span className="font-black text-sm text-foreground">{paymentModalData.studentName}</span>
              </div>
              {paymentModalData.totalDue !== undefined && (
                <div className="text-left">
                  <span className="text-[11px] text-muted-foreground font-bold block">الرصيد المتبقي المطلوب</span>
                  <span className="font-black text-sm text-danger tabular-nums">
                    {paymentModalData.totalDue.toLocaleString()} {currency}
                  </span>
                </div>
              )}
            </div>

            {/* Amount Input with Quick Shortcuts */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-extrabold text-foreground">
                  المبلغ المحصل ({currency}) <span className="text-danger">*</span>
                </label>
                {paymentModalData.totalDue !== undefined && paymentModalData.totalDue > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = (e.currentTarget.closest("form")?.querySelector("input[name='amount']") as HTMLInputElement);
                        if (input) input.value = String(paymentModalData.totalDue);
                      }}
                      className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    >
                      كامل المبلغ ({paymentModalData.totalDue})
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = (e.currentTarget.closest("form")?.querySelector("input[name='amount']") as HTMLInputElement);
                        if (input) input.value = String(Math.round((paymentModalData.totalDue || 0) / 2));
                      }}
                      className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors cursor-pointer"
                    >
                      50%
                    </button>
                  </div>
                )}
              </div>
              <input 
                type="number" 
                name="amount" 
                required 
                min="1" 
                defaultValue={paymentModalData.totalDue && paymentModalData.totalDue > 0 ? paymentModalData.totalDue : ""}
                placeholder="أدخل المبلغ..." 
                className="h-12 w-full px-4 bg-background border border-emerald-500/40 rounded-xl font-black text-xl text-emerald-600 tabular-nums shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15" 
              />
            </div>

            {/* Payment Method & Target Account Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-extrabold text-foreground mb-1.5">طريقة الدفع</label>
                <select 
                  name="method" 
                  required 
                  className="h-11 w-full px-3.5 bg-background border border-border/80 rounded-xl font-bold text-xs shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 cursor-pointer"
                >
                  <option value="cash">نقداً (كاش - الخزينة والصندوق)</option>
                  <option value="bank_transfer">تحويل بنكي مباشر</option>
                  <option value="card">بطاقة دفع إلكتروني (شبكة / مدى / فيزا)</option>
                  <option value="cheque">شيك مصرفي معتمد</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-foreground mb-1.5">حساب التوريد / الصندوق</label>
                <select 
                  name="accountId" 
                  className="h-11 w-full px-3.5 bg-background border border-border/80 rounded-xl font-bold text-xs shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 cursor-pointer"
                >
                  <option value="gl-treasury-main">
                    الخزينة الرئيسية {(allCashSessions || []).some(s => s.status === 'open') ? "• الجلسة مفتوحة ✅" : "• مغلقة ⚠️"}
                  </option>
                  {(allBankAccounts || []).map(b => (
                    <option key={b.id} value={b.accountId}>{b.bankName} - {b.accountNumber.slice(-4)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes / Reference */}
            <div>
              <label className="block text-xs font-extrabold text-foreground mb-1.5">البيان / ملاحظات السند أو رقم الحوالة</label>
              <input 
                type="text" 
                name="notes" 
                placeholder="سداد القسط الدراسي / رقم العملية..." 
                defaultValue="سداد رسوم دراسية"
                className="h-11 w-full px-4 bg-background border border-border/80 rounded-xl text-xs font-medium shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15" 
              />
            </div>

            {/* Actions */}
            <div className="pt-3 flex gap-3 border-t border-border/50">
              <button 
                type="submit" 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl shadow-md transition-all text-xs active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> حفظ وإصدار سند القبض
              </button>
              <button 
                type="button" 
                onClick={() => setPaymentModalData(null)} 
                className="flex-1 border border-border/80 hover:bg-accent py-2.5 rounded-xl text-xs font-bold transition-colors active:scale-[0.98] cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </AdminModal>

      {/* --- Single Official Receipt Voucher Modal (سند قبض رسمي معتمد) --- */}
      <AdminModal
        isOpen={Boolean(printedReceipt)}
        onClose={() => setPrintedReceipt(null)}
        title="سند قبض مالي رسمي"
        description="تم تسجيل العملية وقيدها بالحسابات بنجاح"
        icon={Receipt}
        tone="success"
        maxWidth="lg"
        footer={
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => { window.print(); setPrintedReceipt(null); }}
              className="flex-1 h-11 bg-primary text-primary-foreground rounded-xl font-black flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md text-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" /> طباعة السند فوراً
            </button>
            <button 
              onClick={() => setPrintedReceipt(null)} 
              className="h-11 border border-border/80 hover:bg-accent px-6 rounded-xl font-bold text-xs active:scale-[0.98] transition-all cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        }
      >
        {printedReceipt && (
          <div className="p-5 bg-background rounded-2xl border border-border/70 space-y-3 font-semibold text-xs shadow-inner">
            <div className="text-center pb-3 border-b border-dashed border-border/60">
              <p className="text-[11px] text-muted-foreground font-bold">المملكة العربية السعودية • وزارة التعليم • الإدارة العامة للتعليم الأهلي</p>
              <h4 className="font-black text-base text-foreground mt-0.5">مجمع مدارس المستقبل الأهلية النموذجية</h4>
              <div className="mt-1 flex items-center justify-center gap-3 text-[11px] font-mono font-bold text-muted-foreground">
                <span>رقم السند: <strong className="text-primary font-black">{printedReceipt.id}</strong></span>
                <span>•</span>
                <span>التاريخ: {printedReceipt.date}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground font-bold">استلمنا من الطالب:</span>
                <span className="font-black text-foreground">{printedReceipt.studentName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground font-bold">المبلغ المحصل:</span>
                <span className="font-black text-emerald-600 tabular-nums text-base">{printedReceipt.amount.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground font-bold">طريقة الدفع:</span>
                <span className="font-bold text-foreground">
                  {printedReceipt.method === 'cash' ? 'نقدي (الخزينة والصندوق)' : printedReceipt.method === 'bank_transfer' ? 'حوالة مصرفية' : 'بطاقة مدى / شبكة'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border/40">
                <span className="text-muted-foreground font-bold">وذلك عن:</span>
                <span className="font-bold text-foreground">{printedReceipt.notes}</span>
              </div>
            </div>

            {/* Signatures Strip */}
            <div className="grid grid-cols-2 pt-4 text-center text-[10px] font-bold text-muted-foreground">
              <div>
                <p className="mb-4">المحاسب / الكاشير: {printedReceipt.cashier}</p>
                <p className="border-t border-dashed border-border/60 pt-1 w-28 mx-auto">التوقيع</p>
              </div>
              <div>
                <p className="mb-4">الختم المالي المعتمد</p>
                <p className="border-t border-dashed border-border/60 pt-1 w-28 mx-auto">الاعتماد والختم</p>
              </div>
            </div>
          </div>
        )}
      </AdminModal>

      {/* --- Official Printable Student Statement Modal (كشف الحساب المعتمد) --- */}
      <AdminModal
        isOpen={Boolean(printStatementData)}
        onClose={() => setPrintStatementData(null)}
        title="معاينة كشف الحساب المعتمد للطباعة"
        description="كشف حساب مالي رسمي ومختوم للطالب"
        icon={Printer}
        tone="primary"
        maxWidth="3xl"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button 
              onClick={() => { window.print(); setPrintStatementData(null); }}
              className="btn-primary text-xs h-10 px-6 font-black flex items-center gap-2 cursor-pointer shadow-md bg-primary text-primary-foreground rounded-xl"
            >
              <Printer className="w-4 h-4" /> طباعة الكشف فوراً
            </button>
            <button 
              onClick={() => setPrintStatementData(null)}
              className="btn-secondary text-xs h-10 px-5 font-bold cursor-pointer border border-border rounded-xl"
            >
              إغلاق
            </button>
          </div>
        }
      >
        {printStatementData && (
          <div className="space-y-4 font-sans text-xs bg-background p-2">
            {/* Paper Header */}
            <div className="text-center pb-4 border-b-2 border-border/70">
              <p className="text-[11px] text-muted-foreground font-bold">المملكة العربية السعودية • وزارة التعليم • الإدارة العامة للتعليم الأهلي</p>
              <h2 className="text-xl font-black text-foreground mt-1">مجمع مدارس المستقبل الأهلية النموذجية</h2>
              <h3 className="text-sm font-black text-primary mt-1">كشف حساب مالي رسمي للطالب</h3>
            </div>

            {/* Student Metadata Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/50 text-xs">
              <div>اسم الطالب: <strong className="block text-foreground mt-0.5">{printStatementData.name}</strong></div>
              <div>الصف الدراسي: <strong className="block text-foreground mt-0.5">{printStatementData.grade}</strong></div>
              <div>الشعبة: <strong className="block text-foreground mt-0.5">{printStatementData.sectionObj?.name || printStatementData.sectionName || "عام"}</strong></div>
              <div>تاريخ الطباعة: <strong className="block text-foreground mt-0.5">{new Date().toLocaleDateString('ar-EG')}</strong></div>
            </div>

            {/* Financial Balance Strip */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/60 text-center">
              <div>
                <span className="text-muted-foreground font-bold text-[11px] block">إجمالي الرسوم المستحقة</span>
                <span className="font-black text-sm text-foreground tabular-nums">{printStatementData.totalFees.toLocaleString()} {currency}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-bold text-[11px] block">إجمالي المسدد</span>
                <span className="font-black text-sm text-emerald-600 tabular-nums">{printStatementData.totalPaid.toLocaleString()} {currency}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-bold text-[11px] block">الرصيد المتبقي</span>
                <span className="font-black text-sm text-rose-600 tabular-nums">{printStatementData.totalDue.toLocaleString()} {currency}</span>
              </div>
            </div>

            {/* Invoices List */}
            <table className="w-full text-xs font-bold border border-border/60 rounded-xl overflow-hidden">
              <thead className="bg-muted/50 border-b border-border/60">
                <tr>
                  <th className="p-2 text-start">رقم المطالبة</th>
                  <th className="p-2 text-start">البيان</th>
                  <th className="p-2 text-start">الاستحقاق</th>
                  <th className="p-2 text-start">المبلغ</th>
                  <th className="p-2 text-start">المسدد</th>
                  <th className="p-2 text-start">المتبقي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {(printStatementData.invoices || []).map((inv: any) => {
                  const paid = inv.paidAmount || 0;
                  const due = inv.netAmount - paid;
                  return (
                    <tr key={inv.id}>
                      <td className="p-2 text-muted-foreground font-mono">{inv.id}</td>
                      <td className="p-2">{inv.title}</td>
                      <td className="p-2 text-muted-foreground font-mono">{inv.dueDate}</td>
                      <td className="p-2 tabular-nums">{inv.netAmount.toLocaleString()}</td>
                      <td className="p-2 text-emerald-600 tabular-nums">{paid.toLocaleString()}</td>
                      <td className="p-2 text-rose-600 tabular-nums">{due > 0 ? due.toLocaleString() : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Signatures */}
            <div className="grid grid-cols-2 pt-6 text-center text-xs font-bold text-muted-foreground">
              <div>
                <p className="mb-6">المحاسب المالي ومسؤول التحصيل</p>
                <p className="border-t border-dashed border-border/60 pt-1 w-36 mx-auto">التوقيع والتاريخ</p>
              </div>
              <div>
                <p className="mb-6">مدير المدرسة والاعتماد الرسمي</p>
                <p className="border-t border-dashed border-border/60 pt-1 w-36 mx-auto">الختم الرسمي</p>
              </div>
            </div>
          </div>
        )}
      </AdminModal>

      {/* --- Charge Single Student Modal --- */}
      <AdminModal
        isOpen={Boolean(chargeModalData)}
        onClose={() => setChargeModalData(null)}
        title="إضافة رسوم خاصة بالطالب"
        description="إصدار مطالبة مالية مخصصة لحساب الطالب"
        icon={Plus}
        tone="primary"
        maxWidth="md"
      >
        {chargeModalData && (
          <form onSubmit={handleAddCharge} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-foreground mb-1.5">اسم الطالب</label>
              <div className="p-3 bg-muted/40 rounded-xl font-black text-sm border border-border/50">{chargeModalData.studentName}</div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-foreground mb-1.5">بيان ونوع الرسوم <span className="text-danger">*</span></label>
              <select 
                name="title" 
                required 
                className="h-11 w-full px-4 bg-background border border-border/80 rounded-xl font-bold text-xs shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer"
              >
                <option value="رسوم دراسية إضافية">رسوم دراسية إضافية</option>
                <option value="رسوم الزي المدرسي الرسمي">رسوم الزي المدرسي الرسمي</option>
                <option value="رسوم الكتب والمقررات المدرسية">رسوم الكتب والمقررات المدرسية</option>
                <option value="رسوم الأنشطة المدرسية والرحلات">رسوم الأنشطة المدرسية والرحلات</option>
                <option value="رسوم إعادة قيد وتسجيل">رسوم إعادة قيد وتسجيل</option>
                <option value="رسوم اختبارات وشهادات">رسوم اختبارات وشهادات</option>
                <option value="رسوم خدمات طلابية">رسوم خدمات طلابية</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-foreground mb-1.5">المبلغ المطلوب ({currency}) <span className="text-danger">*</span></label>
              <input 
                type="number" 
                name="amount" 
                required 
                min="1" 
                placeholder="أدخل المبلغ..." 
                className="h-11 w-full px-4 bg-background border border-border/80 rounded-xl font-extrabold text-base shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50 tabular-nums" 
              />
            </div>

            <div className="pt-3 flex gap-3 border-t border-border/50">
              <button type="submit" className="flex-1 bg-primary text-primary-foreground font-extrabold py-2.5 rounded-xl shadow-md hover:bg-primary/90 transition-all text-xs active:scale-[0.98] cursor-pointer">
                إصدار الفاتورة فوراً
              </button>
              <button type="button" onClick={() => setChargeModalData(null)} className="flex-1 border border-border/80 hover:bg-accent py-2.5 rounded-xl text-xs font-bold transition-colors active:scale-[0.98] cursor-pointer">
                إلغاء
              </button>
            </div>
          </form>
        )}
      </AdminModal>

      {/* --- Transport Subscription Modal (التراحيل) --- */}
      <AdminModal
        isOpen={Boolean(transportModalData)}
        onClose={() => setTransportModalData(null)}
        title="ربط وإدارة التراحيـل والنقل المدرسي"
        description="تخصيص خط حافلة وإصدار رسوم الترحيل"
        icon={Bus}
        tone="amber"
        maxWidth="md"
      >
        {transportModalData && (
          <form onSubmit={handleSubscribeTransport} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-foreground mb-1.5">اسم الطالب</label>
              <div className="p-3 bg-muted/40 rounded-xl font-black text-sm border border-border/50">{transportModalData.studentName}</div>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-foreground mb-1.5">خط الحافلة / المسار المدرسي</label>
              <select name="routeId" required className="h-11 w-full px-4 bg-background border border-border/80 rounded-xl font-bold text-xs shadow-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/15 cursor-pointer">
                <option value="">-- اختر خط الترحيل --</option>
                {transportRoutes.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({(r.feeAmount || 0).toLocaleString()} {currency})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-foreground mb-1.5">اتجاه الاشتراك</label>
              <select name="direction" required className="h-11 w-full px-4 bg-background border border-border/80 rounded-xl font-bold text-xs shadow-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/15 cursor-pointer">
                <option value="round-trip">اتجاهين (ذهاب وعودة) - كامل القيمة</option>
                <option value="going">ذهاب فقط (صباحاً)</option>
                <option value="returning">عودة فقط (عصراً)</option>
              </select>
            </div>
            <div className="pt-3 flex gap-3 border-t border-border/50">
              <button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-2.5 rounded-xl shadow-md transition-all text-xs active:scale-[0.98] cursor-pointer">
                تأكيد وإصدار رسم الترحيل
              </button>
              <button type="button" onClick={() => setTransportModalData(null)} className="flex-1 border border-border/80 hover:bg-accent py-2.5 rounded-xl text-xs font-bold transition-colors active:scale-[0.98] cursor-pointer">
                إلغاء
              </button>
            </div>
          </form>
        )}
      </AdminModal>

      {/* --- Bulk Billing Modal (إصدار رسوم جماعية مع عداد تفاعلي) --- */}
      <AdminModal
        isOpen={isBulkBillingOpen}
        onClose={() => setIsBulkBillingOpen(false)}
        title="إصدار رسوم جماعية للشعبة أو الصف"
        description="توليد فواتير ومطالبات دفعة واحدة للمجموعة المختارة"
        icon={Plus}
        tone="primary"
        maxWidth="lg"
      >
        <form onSubmit={handleBulkBilling} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-foreground mb-1.5">نطاق الطلاب المستهدفين</label>
            <select 
              name="scope" 
              required 
              value={bulkBillingScope}
              onChange={e => setBulkBillingScope(e.target.value as any)}
              className="h-11 w-full px-4 bg-background border border-border/80 rounded-xl font-bold text-xs shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer"
            >
              <option value="all">جميع طلاب المرحلة الحالية ({getStageLabel(stage)})</option>
              <option value="grade">حسب الصف الدراسي المحدد</option>
              <option value="section">حسب الشعبة الدراسية المحددة</option>
            </select>
          </div>

          {bulkBillingScope === "grade" && (
            <div>
              <label className="block text-xs font-extrabold text-foreground mb-1.5">الصف الدراسي</label>
              <select 
                name="grade" 
                value={bulkBillingGrade}
                onChange={e => setBulkBillingGrade(e.target.value)}
                className="h-11 w-full px-4 bg-background border border-border/80 rounded-xl font-bold text-xs shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer"
              >
                <option value="">-- اختر الصف الدراسي --</option>
                {availableGrades.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          )}

          {bulkBillingScope === "section" && (
            <div>
              <label className="block text-xs font-extrabold text-foreground mb-1.5">الشعبة الدراسية</label>
              <select 
                name="sectionId" 
                value={bulkBillingSectionId}
                onChange={e => setBulkBillingSectionId(e.target.value)}
                className="h-11 w-full px-4 bg-background border border-border/80 rounded-xl font-bold text-xs shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer"
              >
                <option value="">-- اختر الشعبة --</option>
                {availableSections.map(s => (
                  <option key={s.id} value={s.id}>{s.grade} - شعبة {s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-foreground mb-1.5">بيان ووصف الفاتورة <span className="text-danger">*</span></label>
            <input 
              type="text" 
              name="title" 
              required 
              placeholder="مثال: القسط الأول من الرسوم الدراسية" 
              defaultValue="الرسوم الدراسية" 
              className="h-11 w-full px-4 bg-background border border-border/80 rounded-xl font-bold text-xs shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15" 
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-foreground mb-1.5">المبلغ المطلوب لكل طالب ({currency}) <span className="text-danger">*</span></label>
            <input 
              type="number" 
              name="amount" 
              required 
              min="1" 
              placeholder="أدخل المبلغ..." 
              onChange={e => setBulkBillingAmount(Number(e.target.value))}
              className="h-11 w-full px-4 bg-background border border-border/80 rounded-xl font-extrabold text-base shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 tabular-nums" 
            />
          </div>

          {/* Dynamic Summary Strip */}
          {bulkBillingAmount > 0 && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs font-bold text-primary flex items-center justify-between">
              <span>الطلاب المستهدفون: {
                bulkBillingScope === 'all' 
                  ? activeStageStudents.length 
                  : bulkBillingScope === 'grade' && bulkBillingGrade
                  ? activeStageStudents.filter(s => s.grade === bulkBillingGrade).length
                  : bulkBillingScope === 'section' && bulkBillingSectionId
                  ? activeStageStudents.filter(s => s.sectionId === bulkBillingSectionId).length
                  : activeStageStudents.length
              } طالب</span>
              <span>إجمالي المطالبة: {(
                (bulkBillingScope === 'all' 
                  ? activeStageStudents.length 
                  : bulkBillingScope === 'grade' && bulkBillingGrade
                  ? activeStageStudents.filter(s => s.grade === bulkBillingGrade).length
                  : bulkBillingScope === 'section' && bulkBillingSectionId
                  ? activeStageStudents.filter(s => s.sectionId === bulkBillingSectionId).length
                  : activeStageStudents.length) * bulkBillingAmount
              ).toLocaleString()} {currency}</span>
            </div>
          )}

          <div className="pt-3 flex gap-3 border-t border-border/50 shrink-0">
            <button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-extrabold py-2.5 rounded-xl shadow-md transition-all text-xs active:scale-[0.98] cursor-pointer">
              إصدار الفواتير فوراً
            </button>
            <button type="button" onClick={() => setIsBulkBillingOpen(false)} className="flex-1 border border-border/80 hover:bg-accent py-2.5 rounded-xl text-xs font-bold transition-colors active:scale-[0.98] cursor-pointer">
              إلغاء
            </button>
          </div>
        </form>
      </AdminModal>


      {/* --- Advanced Print Engine --- */}
      <AdvancedPrintEngine
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
        title={`كشف المتأخرات والرسوم - ${getStageLabel(stage)}`}
        data={studentFinancials.filter(s => s.totalDue > 0)}
        templates={printTemplates}
      />

    </AppShell>
  );
}
