import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore, TransportSubscription } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { usePaymentEngine } from "@/engines/finance/usePaymentEngine";
import { getGradesForStage } from "@/lib/school-structure";
import { Search, Filter, Printer, CheckCircle2, AlertTriangle, Users, Wallet, CreditCard, ChevronDown, Plus, X, Bus, Phone, User, Building, Layers, DollarSign, Send, ArrowRight, ShieldAlert } from "lucide-react";
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
    allDiscounts
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
  const [paymentModalData, setPaymentModalData] = useState<{ studentId: string, studentName: string } | null>(null);
  const [chargeModalData, setChargeModalData] = useState<{ studentId: string, studentName: string } | null>(null);
  const [transportModalData, setTransportModalData] = useState<{ studentId: string, studentName: string } | null>(null);
  const [isBulkBillingOpen, setIsBulkBillingOpen] = useState(false);
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
    
    try {
      receiveLumpSumPayment(
        paymentModalData.studentId, 
        amount, 
        method, 
        "gl-treasury-main"
      );
      toast.success(`تم تسجيل سند القبض بقيمة ${amount.toLocaleString()} ${currency} للطالب ${paymentModalData.studentName} بنجاح`);
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء تسجيل السند");
    }
    setPaymentModalData(null);
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
                      onClick={() => setPaymentModalData({ studentId: r.id, studentName: r.name })}
                      className="text-xs font-extrabold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0"
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
      {statementModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-4xl rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-border/50 flex justify-between items-start bg-muted/30 shrink-0 relative">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <Wallet className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xl flex items-center gap-2">
                    كشف حساب الطالب: {statementModalData.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-bold mt-1">
                    <span>الصف: {statementModalData.grade}</span>
                    <span>•</span>
                    <span>شعبة {statementModalData.sectionObj?.name || statementModalData.sectionName || "عام"}</span>
                    {statementModalData.roomObj && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600">القاعة: {statementModalData.roomObj.name}</span>
                      </>
                    )}
                    {statementModalData.guardianObj && (
                      <>
                        <span>•</span>
                        <span>ولي الأمر: {statementModalData.guardianObj.name} ({statementModalData.guardianObj.phone})</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setStatementModalData(null)} className="p-2 hover:bg-accent rounded-xl transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            {/* Action Bar */}
            <div className="p-4 flex flex-wrap gap-2 shrink-0 border-b border-border/50 bg-background justify-between items-center">
              <div className="flex gap-2">
                <button onClick={() => setChargeModalData({ studentId: statementModalData.id, studentName: statementModalData.name })} className="btn-secondary text-xs h-9 font-bold">
                  <Plus className="w-4 h-4 ml-1 text-primary"/> إضافة رسم خاص
                </button>
                <button onClick={() => setPaymentModalData({ studentId: statementModalData.id, studentName: statementModalData.name })} className="btn-primary text-xs h-9 bg-success hover:bg-success/90 font-bold">
                  <CreditCard className="w-4 h-4 ml-1"/> تسجيل دفعة (سند قبض)
                </button>
                <button onClick={() => setTransportModalData({ studentId: statementModalData.id, studentName: statementModalData.name })} className="btn-secondary text-xs h-9 font-bold border-amber-500/40 hover:bg-amber-50">
                  <Bus className="w-4 h-4 ml-1 text-amber-600"/> {statementModalData.transportSub ? "تعديل الترحيل" : "إضافة ترحيل"}
                </button>
              </div>

              {/* Financial Balance Summary */}
              <div className="flex items-center gap-4 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/50 text-xs">
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

            {/* Invoices & Ledger Table */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {statementModalData.invoices.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground font-bold bg-muted/20 rounded-2xl border border-dashed border-border/60">
                  لا توجد فواتير أو حركات مالية مسجلة لهذا الطالب حالياً.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border/50">
                      <tr>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground text-xs">تاريخ الاستحقاق</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground text-xs">بيان الفاتورة / الرسوم</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground text-xs">المبلغ الأصلي</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground text-xs">الخصم</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground text-xs">الصافي</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground text-xs">المدفوع</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground text-xs">المتبقي</th>
                        <th className="px-4 py-3 text-right font-bold text-muted-foreground text-xs">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {statementModalData.invoices.map((inv: any) => {
                        const net = inv.netAmount ?? inv.amount;
                        const due = net - inv.paid;
                        return (
                          <tr key={inv.id} className="hover:bg-accent/20 transition-colors">
                            <td className="px-4 py-3.5 font-mono text-xs font-bold text-muted-foreground">{inv.issueDate || inv.dueDate}</td>
                            <td className="px-4 py-3.5 font-extrabold">{inv.title}</td>
                            <td className="px-4 py-3.5 text-muted-foreground font-bold">{inv.amount.toLocaleString()}</td>
                            <td className="px-4 py-3.5 text-orange-500 font-bold">{inv.discountAmount ? inv.discountAmount.toLocaleString() : '-'}</td>
                            <td className="px-4 py-3.5 font-black">{net.toLocaleString()}</td>
                            <td className="px-4 py-3.5 text-success font-extrabold">{inv.paid > 0 ? inv.paid.toLocaleString() : '-'}</td>
                            <td className="px-4 py-3.5 text-danger font-black">{due > 0 ? due.toLocaleString() : '-'}</td>
                            <td className="px-4 py-3.5">
                              {inv.status === "paid" ? <Badge tone="success">مسدد</Badge> : inv.status === "partial" ? <Badge tone="warning">جزئي</Badge> : <Badge tone="neutral">مستحق</Badge>}
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
        </div>
      )}

      {/* --- Quick Record Payment Modal (سند قبض كاشير) --- */}
      {paymentModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border/50 flex justify-between items-center bg-success/10">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-success">
                <CreditCard className="w-5 h-5" /> تسجيل دفعة وسند قبض جديد
              </h3>
              <button onClick={() => setPaymentModalData(null)} className="p-1 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">اسم الطالب</label>
                <div className="p-3 bg-muted/50 rounded-xl font-extrabold text-sm">{paymentModalData.studentName}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">المبلغ المحصل ({currency})</label>
                <input type="number" name="amount" required min="1" placeholder="أدخل المبلغ..." className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-base focus:ring-2 focus:ring-success/50 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">طريقة الدفع وسداد الخزينة</label>
                <select name="method" required className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-sm focus:ring-2 focus:ring-success/50 outline-none">
                  <option value="cash">نقداً (كاش - الخزينة الرئيسية)</option>
                  <option value="bank_transfer">تحويل بنكي (بنك الخرطوم)</option>
                  <option value="card">بطاقة دفع إلكتروني (مدى/فيزا)</option>
                  <option value="cheque">شيك مصرفي معتمد</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">ملاحظات / رقم الحوالة أو الشيك</label>
                <input type="text" name="notes" placeholder="ملاحظات إضافية..." className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-success/50 outline-none" />
              </div>
              <div className="pt-3 flex gap-3">
                <button type="submit" className="flex-1 btn-primary bg-success hover:bg-success/90 font-extrabold py-2.5 rounded-xl">تأكيد وطباعة السند</button>
                <button type="button" onClick={() => setPaymentModalData(null)} className="flex-1 btn-secondary py-2.5 rounded-xl">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Charge Single Student Modal --- */}
      {chargeModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border/50 flex justify-between items-center bg-primary/10">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-primary">
                <Plus className="w-5 h-5" /> إضافة رسوم خاصة بالطالب
              </h3>
              <button onClick={() => setChargeModalData(null)} className="p-1 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddCharge} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">اسم الطالب</label>
                <div className="p-3 bg-muted/50 rounded-xl font-extrabold text-sm">{chargeModalData.studentName}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">بيان ووصف الرسوم</label>
                <input type="text" name="title" required placeholder="مثال: رسوم زي مدرسي أو أنشطة رحلة" className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">المبلغ المطلوب ({currency})</label>
                <input type="number" name="amount" required min="1" placeholder="أدخل المبلغ..." className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-base focus:ring-2 focus:ring-primary/50 outline-none" />
              </div>
              <div className="pt-3 flex gap-3">
                <button type="submit" className="flex-1 btn-primary font-extrabold py-2.5 rounded-xl">إصدار الفاتورة</button>
                <button type="button" onClick={() => setChargeModalData(null)} className="flex-1 btn-secondary py-2.5 rounded-xl">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Transport Subscription Modal (التراحيل) --- */}
      {transportModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border/50 flex justify-between items-center bg-amber-500/10">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-amber-600">
                <Bus className="w-5 h-5" /> ربط وإدارة التراحيـل والنقل المدرسي
              </h3>
              <button onClick={() => setTransportModalData(null)} className="p-1 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubscribeTransport} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">اسم الطالب</label>
                <div className="p-3 bg-muted/50 rounded-xl font-extrabold text-sm">{transportModalData.studentName}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">خط الحافلة / المسار المدرسي</label>
                <select name="routeId" required className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-sm focus:ring-2 focus:ring-amber-500/50 outline-none">
                  <option value="">-- اختر خط الترحيل --</option>
                  {transportRoutes.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({(r.feeAmount || 0).toLocaleString()} {currency})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">اتجاه الاشتراك</label>
                <select name="direction" required className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-sm focus:ring-2 focus:ring-amber-500/50 outline-none">
                  <option value="round-trip">اتجاهين (ذهاب وعودة) - كامل القيمة</option>
                  <option value="going">ذهاب فقط (صباحاً)</option>
                  <option value="returning">عودة فقط (عصراً)</option>
                </select>
              </div>
              <div className="pt-3 flex gap-3">
                <button type="submit" className="flex-1 btn-primary bg-amber-600 hover:bg-amber-700 font-extrabold py-2.5 rounded-xl">تأكيد وإصدار رسم الترحيل</button>
                <button type="button" onClick={() => setTransportModalData(null)} className="flex-1 btn-secondary py-2.5 rounded-xl">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Bulk Billing Modal (إصدار رسوم جماعية) --- */}
      {isBulkBillingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border/50 flex justify-between items-center bg-emerald-600/10">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-emerald-600">
                <Plus className="w-5 h-5" /> إصدار رسوم جماعية للشعبة أو الصف
              </h3>
              <button onClick={() => setIsBulkBillingOpen(false)} className="p-1 hover:bg-accent rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleBulkBilling} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">نطاق الطلاب المستهدفين</label>
                <select name="scope" required className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none">
                  <option value="all">جميع طلاب المرحلة الحالية ({getStageLabel(stage)})</option>
                  <option value="grade">حسب الصف الدراسي المحدد</option>
                  <option value="section">حسب الشعبة الدراسية المحددة</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">الصف الدراسي (في حال اختيار الصف)</label>
                <select name="grade" className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none">
                  <option value="">-- جميع الصفوف --</option>
                  {availableGrades.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">الشعبة الدراسية (في حال اختيار الشعبة)</label>
                <select name="sectionId" className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none">
                  <option value="">-- جميع الشعب --</option>
                  {availableSections.map(s => (
                    <option key={s.id} value={s.id}>{s.grade} - شعبة {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">بيان ووصف الفاتورة</label>
                <input type="text" name="title" required placeholder="مثال: القسط الأول من الرسوم الدراسية" defaultValue="الرسوم الدراسية" className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">المبلغ المطلوب لكل طالب ({currency})</label>
                <input type="number" name="amount" required min="1" placeholder="أدخل المبلغ..." className="w-full px-3 py-2.5 bg-background border border-border/60 rounded-xl font-bold text-base focus:ring-2 focus:ring-emerald-500/50 outline-none" />
              </div>
              <div className="pt-3 flex gap-3">
                <button type="submit" className="flex-1 btn-primary bg-emerald-600 hover:bg-emerald-700 font-extrabold py-2.5 rounded-xl">إصدار الفواتير فوراً</button>
                <button type="button" onClick={() => setIsBulkBillingOpen(false)} className="flex-1 btn-secondary py-2.5 rounded-xl">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
