import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { FinanceNavTabs } from "@/components/finance/finance-nav";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { useState, useMemo } from "react";
import { 
  Building2, 
  Wallet, 
  Receipt, 
  CreditCard, 
  FileText, 
  PieChart, 
  FolderTree, 
  TrendingUp,
  TrendingDown,
  GraduationCap,
  Users,
  Layers,
  Sparkles,
  SlidersHorizontal,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Printer,
  RefreshCw,
  BarChart3,
  Search,
  ChevronLeft,
  DollarSign,
  Scale
} from "lucide-react";

export const Route = createFileRoute("/finance/")({
  component: FinanceHub,
});

function FinanceHub() {
  const { stage, getStageLabel } = useStage();
  const { 
    currency, 
    activeStageStudents, 
    activeStageInvoices, 
    allExpenses, 
    allPayments, 
    allTreasuries, 
    allBankAccounts, 
    allCashSessions,
    allFeeStructures,
    allDiscounts,
    allVendors,
    currentAcademicYearId
  } = useGlobalStore();

  const [activeTab, setActiveTab] = useState<"overview" | "modules">("overview");
  const [moduleSearch, setModuleSearch] = useState("");

  // 1. Live Aggregate Financial Metrics
  const metrics = useMemo(() => {
    const totalTreasury = (allTreasuries || []).filter(t => t.status === "active" || !t.status).reduce((sum, t) => sum + (t.balance || 0), 0);
    const totalBank = (allBankAccounts || []).filter(b => b.status === "active" || !b.status).reduce((sum, b) => sum + (b.currentBalance ?? (b as any).balance ?? 0), 0);
    const totalLiquid = totalTreasury + totalBank;

    // Receivables: unpaid student invoices
    const totalReceivables = (activeStageInvoices || []).reduce((sum, inv) => {
      const due = (inv.netAmount ?? inv.amount ?? 0) - (inv.paid || 0);
      return due > 0 && inv.status !== "cancelled" ? sum + due : sum;
    }, 0);

    const debtorsCount = new Set(
      (activeStageInvoices || [])
        .filter(inv => ((inv.netAmount ?? inv.amount ?? 0) - (inv.paid || 0)) > 0 && inv.status !== "cancelled")
        .map(inv => inv.studentId)
    ).size;

    // Payables: unpaid expenses + vendor balances
    const unpaidExpenses = (allExpenses || []).filter(e => e.status !== "posted" && e.status !== "paid").reduce((sum, e) => sum + (e.amount || 0), 0);
    const vendorBalances = (allVendors || []).reduce((sum, v) => sum + (v.balance || 0), 0);
    const totalPayables = unpaidExpenses + vendorBalances;

    // Active Cash Sessions
    const openSessions = (allCashSessions || []).filter(s => s.status === "open");

    // Monthly Collected & Spent
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const collectedThisMonth = (allPayments || []).filter(p => {
      const d = new Date(p.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((sum, p) => sum + (p.amount || 0), 0);

    const expensesThisMonth = (allExpenses || []).filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((sum, e) => sum + (e.amount || 0), 0);

    return {
      totalTreasury,
      totalBank,
      totalLiquid,
      totalReceivables,
      debtorsCount,
      totalPayables,
      unpaidExpenses,
      vendorBalances,
      openSessionsCount: openSessions.length,
      openSessions,
      collectedThisMonth,
      expensesThisMonth,
      netMonthlyFlow: collectedThisMonth - expensesThisMonth
    };
  }, [allTreasuries, allBankAccounts, activeStageInvoices, allExpenses, allVendors, allCashSessions, allPayments]);

  // 2. Recent Combined Financial Activity (Top 6)
  const recentActivity = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      amount: number;
      type: "in" | "out";
      date: string;
      method: string;
    }> = [];

    (allPayments || []).slice(0, 15).forEach(p => {
      const inv = (activeStageInvoices || []).find(i => i.id === p.invoiceId);
      list.push({
        id: p.id,
        title: inv ? `تحصيل: ${inv.studentName}` : `سند قبض: ${p.studentId || "طالب"}`,
        subtitle: p.notes || `طريقة الدفع: ${p.method === 'cash' ? 'نقدي (خزينة)' : p.method === 'bank_transfer' ? 'تحويل بنكي' : 'بطاقة مدى'}`,
        amount: p.amount,
        type: "in",
        date: p.date,
        method: p.method
      });
    });

    (allExpenses || []).slice(0, 15).forEach(e => {
      list.push({
        id: e.id,
        title: `صرف: ${e.title}`,
        subtitle: `المستفيد: ${e.beneficiary || "جهة خارجية"} • ${e.method === 'cash' ? 'نقداً' : 'تحويل'}`,
        amount: e.amount,
        type: "out",
        date: e.date,
        method: e.method
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 7);
  }, [allPayments, allExpenses, activeStageInvoices]);

  // 3. Top Debtors for Quick Follow-up
  const topDebtors = useMemo(() => {
    const map = new Map<string, { studentId: string; studentName: string; grade: string; due: number }>();
    (activeStageInvoices || []).forEach(inv => {
      const balance = (inv.netAmount ?? inv.amount ?? 0) - (inv.paid || 0);
      if (balance > 0 && inv.status !== "cancelled") {
        if (!map.has(inv.studentId)) {
          const st = (activeStageStudents || []).find(s => s.id === inv.studentId);
          map.set(inv.studentId, {
            studentId: inv.studentId,
            studentName: inv.studentName || st?.name || "طالب",
            grade: st?.grade || "عام",
            due: 0
          });
        }
        map.get(inv.studentId)!.due += balance;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.due - a.due).slice(0, 5);
  }, [activeStageInvoices, activeStageStudents]);

  // 4. Complete Directory of All 12 Finance Modules with Live Counters
  const hubModules = [
    {
      id: "students",
      title: "المالية الطلابية والرسوم",
      description: "كشوفات حسابات الطلاب، رصد الأقساط، سداد الرسوم، وربط التراحيل",
      icon: <GraduationCap className="w-7 h-7 text-emerald-500" />,
      href: "/finance/students",
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      badge: `${activeStageStudents?.length || 0} طالب • ${metrics.debtorsCount} مدين`,
      badgeTone: metrics.debtorsCount > 0 ? "warning" : "success"
    },
    {
      id: "payments",
      title: "سندات القبض والمقبوضات",
      description: "إصدار وتوثيق سندات القبض الرسمية، توريد النقدية، وطباعة الإيصالات",
      icon: <Receipt className="w-7 h-7 text-blue-500" />,
      href: "/finance/payments",
      color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      badge: `${allPayments?.length || 0} سند مقبوضات`,
      badgeTone: "primary"
    },
    {
      id: "treasury",
      title: "إدارة الخزائن والصناديق (الكاشير)",
      description: "صناديق الكاش، جلسات النقدية اليومية، جرد الدرج، وعجز وفائض الصندوق",
      icon: <Wallet className="w-7 h-7 text-amber-500" />,
      href: "/finance/treasury",
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      badge: metrics.openSessionsCount > 0 ? `${metrics.openSessionsCount} جلسة نشطة` : "الجلسات مغلقة",
      badgeTone: metrics.openSessionsCount > 0 ? "success" : "neutral"
    },
    {
      id: "banks",
      title: "الحسابات البنكية والإيداعات",
      description: "إدارة الحسابات المصرفية، متابعة التحويلات البنكية، والمطابقة",
      icon: <Building2 className="w-7 h-7 text-cyan-500" />,
      href: "/finance/banks",
      color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
      badge: `${(allBankAccounts || []).length} حسابات مصرفية`,
      badgeTone: "primary"
    },
    {
      id: "expenses",
      title: "المصروفات وسندات الصرف",
      description: "إدارة المصروفات التشغيلية، طلبات الصرف، واعتمادات القيادة المالية",
      icon: <TrendingDown className="w-7 h-7 text-rose-500" />,
      href: "/finance/expenses",
      color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
      badge: `${(allExpenses || []).length} سند صرف مسجل`,
      badgeTone: "danger"
    },
    {
      id: "vendors",
      title: "حسابات الموردين والالتزامات",
      description: "أرصدة الموردين، سداد الفواتير الآجلة، وكشوفات حساب الشركات الخدمية",
      icon: <CreditCard className="w-7 h-7 text-orange-500" />,
      href: "/finance/vendors",
      color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      badge: `${(allVendors || []).length} موردين معتمدين`,
      badgeTone: "neutral"
    },
    {
      id: "payroll",
      title: "مسير رواتب الكادر المدرسي",
      description: "مسيرات رواتب المعلمين والموظفين، استحقاقات، خصومات، وسلف",
      icon: <Users className="w-7 h-7 text-purple-500" />,
      href: "/hr/payroll", 
      color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      badge: "نظام الرواتب والأجور",
      badgeTone: "primary"
    },
    {
      id: "fees",
      title: "هيكل الرسوم الدراسية",
      description: "تحديد باقات الرسوم لكل صف وشعبة، الرسوم الإلزامية والاختيارية",
      icon: <Layers className="w-7 h-7 text-indigo-500" />,
      href: "/finance/fees",
      color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
      badge: `${(allFeeStructures || []).length} باقات وبنود`,
      badgeTone: "primary"
    },
    {
      id: "discounts",
      title: "الخصومات والمنح الدراسية",
      description: "سياسات الخصم للأخوة، أبناء المعلمين، منح التفوق، وتخفيضات الإدارة",
      icon: <Sparkles className="w-7 h-7 text-pink-500" />,
      href: "/finance/discounts",
      color: "bg-pink-500/10 text-pink-600 border-pink-500/20",
      badge: `${(allDiscounts || []).length} خطط تخفيض`,
      badgeTone: "primary"
    },
    {
      id: "cost-centers",
      title: "مراكز التكلفة والمشاريع",
      description: "توزيع الإيرادات والمصروفات على الأقسام، المرافق، والأنشطة المدرسية",
      icon: <SlidersHorizontal className="w-7 h-7 text-yellow-500" />,
      href: "/finance/cost-centers",
      color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      badge: "توزيع مالي ذكي",
      badgeTone: "neutral"
    },
    {
      id: "budgets",
      title: "الموازنات التقديرية والتخطيط المالي",
      description: "اعتماد الميزانية السنوية، متابعة الانحراف الفعلي والمخطط، ومراقبة الصرف",
      icon: <Scale className="w-7 h-7 text-emerald-500" />,
      href: "/finance/budgets",
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      badge: "تخطيط وموازنة سنوية",
      badgeTone: "success"
    },
    {
      id: "accounts",
      title: "الدليل المحاسبي الشامل",
      description: "شجرة الحسابات، قيود اليومية الآلية، والتحكم في الأصول والخصوم",
      icon: <FolderTree className="w-7 h-7 text-violet-500" />,
      href: "/finance/accounts",
      color: "bg-violet-500/10 text-violet-600 border-violet-500/20",
      badge: "شجرة الحسابات و GL",
      badgeTone: "primary"
    },
    {
      id: "reports",
      title: "التقارير والقوائم المالية",
      description: "قائمة المركز المالي (الميزانية)، الأرباح والخسائر، والتدفقات النقدية",
      icon: <PieChart className="w-7 h-7 text-teal-500" />,
      href: "/finance/reports",
      color: "bg-teal-500/10 text-teal-600 border-teal-500/20",
      badge: "تقارير معتمدة",
      badgeTone: "success"
    }
  ];

  const filteredModules = useMemo(() => {
    if (!moduleSearch.trim()) return hubModules;
    const q = moduleSearch.trim().toLowerCase();
    return hubModules.filter(m => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
  }, [hubModules, moduleSearch]);

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي الشامل" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/finance/students"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 text-xs font-black shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            <CreditCard className="w-3.5 h-3.5" /> تحصيل سريع للطلاب
          </Link>
          <Link
            to="/finance/treasury"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 text-xs font-black text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-all active:scale-[0.98]"
          >
            <Wallet className="w-3.5 h-3.5" /> صندوق النقدية
          </Link>
        </div>
      }
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
        {/* Unified Finance Navigation Tabs */}
        <FinanceNavTabs activeTab="hub" />
        
        {/* 1. Header Banner with Current Stage Badge */}
        <div className="bg-card/90 backdrop-blur-md rounded-3xl border border-border/70 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -left-12 -top-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-foreground">المركز المالي والحسابات المدرسية</h1>
                <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-black">
                  {getStageLabel(stage)}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-muted text-muted-foreground text-xs font-bold font-mono">
                  {currentAcademicYearId || "1446-1447هـ"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-bold mt-1 max-w-2xl leading-relaxed">
                غرفة العمليات المركزية لإدارة السيولة، الرسوم الطلابية، الخزائن، الحسابات المصرفية، وتدفق النفقات والإيرادات وفق المعايير المحاسبية المعتمدة.
              </p>
            </div>
          </div>

          {/* Quick Segment Switcher */}
          <div className="flex items-center bg-muted/60 p-1 rounded-2xl border border-border/70 self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "overview"
                  ? "bg-background text-foreground shadow-xs border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-primary" /> اللوحة التشغيلية
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("modules")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "modules"
                  ? "bg-background text-foreground shadow-xs border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 text-primary" /> دليل الأقسام (12)
            </button>
          </div>
        </div>

        {/* 2. Top Financial Pulse Cards (4 Core Numbers) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Liquid Funds */}
          <div className="bg-card/90 backdrop-blur-xs rounded-2xl border border-border/70 p-4 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-black">إجمالي السيولة المتاحة</span>
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-foreground tabular-nums">
                {metrics.totalLiquid.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">{currency}</span>
              </p>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-bold mt-1">
                <span>الصناديق: {metrics.totalTreasury.toLocaleString()}</span>
                <span>•</span>
                <span>البنوك: {metrics.totalBank.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Student Receivables */}
          <div className="bg-card/90 backdrop-blur-xs rounded-2xl border border-border/70 p-4 shadow-xs hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-black">المستحقات الطلابية (الذمم)</span>
              <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-600 tabular-nums">
                {metrics.totalReceivables.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">{currency}</span>
              </p>
              <p className="text-[11px] text-amber-600 font-bold mt-1">
                مطلوبة من {metrics.debtorsCount} طالباً بالمرحلة
              </p>
            </div>
          </div>

          {/* Card 3: Payables & Commitments */}
          <div className="bg-card/90 backdrop-blur-xs rounded-2xl border border-border/70 p-4 shadow-xs hover:border-rose-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-black">الالتزامات والمصروفات المستحقة</span>
              <span className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-rose-600 tabular-nums">
                {metrics.totalPayables.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">{currency}</span>
              </p>
              <p className="text-[11px] text-muted-foreground font-bold mt-1">
                تشمل فواتير الموردين والمصروفات المعلقة
              </p>
            </div>
          </div>

          {/* Card 4: Net Operating Margin this month */}
          <div className="bg-card/90 backdrop-blur-xs rounded-2xl border border-border/70 p-4 shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-black">صافي التدفق المالي للشهر</span>
              <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div>
              <p className={`text-2xl font-black tabular-nums ${metrics.netMonthlyFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {metrics.netMonthlyFlow >= 0 ? `+${metrics.netMonthlyFlow.toLocaleString()}` : metrics.netMonthlyFlow.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">{currency}</span>
              </p>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-bold mt-1">
                <span className="text-emerald-600">قبض: {metrics.collectedThisMonth.toLocaleString()}</span>
                <span>•</span>
                <span className="text-rose-600">صرف: {metrics.expensesThisMonth.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* VIEW 1: EXECUTIVE OPERATIONS DASHBOARD */}
        {/* ==================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            
            {/* Cash Sessions Live Bar */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              metrics.openSessionsCount > 0
                ? "bg-emerald-500/5 border-emerald-500/25"
                : "bg-muted/30 border-border/60"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  metrics.openSessionsCount > 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                    جلسات الصناديق النقدية (الكاشير): 
                    {metrics.openSessionsCount > 0 ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                        يوجد {metrics.openSessionsCount} جلسة نشطة ومفتوحة الآن
                      </span>
                    ) : (
                      <span className="text-muted-foreground">كافة الصناديق مغلقة حالياً</span>
                    )}
                  </h4>
                  <p className="text-xs text-muted-foreground font-bold">
                    {metrics.openSessionsCount > 0
                      ? "يمكنك توريد المقبوضات وصرف العهد مباشرة من الجلسة المفتوحة."
                      : "قم بفتح جلسة نقدية جديدة من قسم الخزينة لبدء استقبال المقبوضات النقدية."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/finance/treasury"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-background border border-border/70 hover:border-primary/50 text-foreground transition-all shadow-xs flex items-center gap-1"
                >
                  إدارة الصناديق والجلسات <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-xs">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-3">
                الإجراءات السريعة والمباشرة
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <Link
                  to="/finance/students"
                  className="p-3.5 rounded-xl border border-border/60 bg-background/50 hover:bg-primary/5 hover:border-primary/40 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-foreground group-hover:text-primary transition-colors">تحصيل قسط طالب</span>
                </Link>

                <Link
                  to="/finance/payments"
                  className="p-3.5 rounded-xl border border-border/60 bg-background/50 hover:bg-emerald-500/5 hover:border-emerald-500/40 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ArrowDownRight className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-foreground group-hover:text-emerald-600 transition-colors">سند قبض فوري</span>
                </Link>

                <Link
                  to="/finance/expenses"
                  className="p-3.5 rounded-xl border border-border/60 bg-background/50 hover:bg-rose-500/5 hover:border-rose-500/40 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-foreground group-hover:text-rose-600 transition-colors">تسجيل سند صرف</span>
                </Link>

                <Link
                  to="/finance/students"
                  className="p-3.5 rounded-xl border border-border/60 bg-background/50 hover:bg-amber-500/5 hover:border-amber-500/40 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-foreground group-hover:text-amber-600 transition-colors">فوترة جماعية لصف</span>
                </Link>

                <Link
                  to="/finance/treasury"
                  className="p-3.5 rounded-xl border border-border/60 bg-background/50 hover:bg-cyan-500/5 hover:border-cyan-500/40 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-foreground group-hover:text-cyan-600 transition-colors">جرد ومطابقة الدرج</span>
                </Link>

                <Link
                  to="/finance/reports"
                  className="p-3.5 rounded-xl border border-border/60 bg-background/50 hover:bg-teal-500/5 hover:border-teal-500/40 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <PieChart className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-foreground group-hover:text-teal-600 transition-colors">القوائم والميزانية</span>
                </Link>
              </div>
            </div>

            {/* Split Grid: Recent Cash Flow vs Top Overdue Students */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Recent Cash Flow Activity (2 Cols) */}
              <div className="lg:col-span-2 bg-card rounded-2xl border border-border/60 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <h3 className="font-black text-sm text-foreground">شريط العمليات النقدية والبنكية الحديثة</h3>
                    </div>
                    <Link to="/finance/payments" className="text-xs font-bold text-primary hover:underline">
                      عرض سجل السندات بالكامل ←
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {recentActivity.length === 0 ? (
                      <p className="text-center py-8 text-xs text-muted-foreground font-bold">
                        لا توجد حركات مالية مسجلة مؤخراً.
                      </p>
                    ) : (
                      recentActivity.map((act) => (
                        <div
                          key={act.id}
                          className="p-3 rounded-xl bg-background/60 border border-border/50 flex items-center justify-between gap-3 hover:border-border transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              act.type === 'in' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                            }`}>
                              {act.type === 'in' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-xs font-black text-foreground">{act.title}</p>
                              <p className="text-[11px] text-muted-foreground font-bold">{act.subtitle}</p>
                            </div>
                          </div>

                          <div className="text-left shrink-0">
                            <p className={`text-sm font-black tabular-nums ${act.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {act.type === 'in' ? '+' : '-'}{act.amount.toLocaleString()} {currency}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-bold font-mono">{act.date}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground font-bold">
                  <span>إجمالي الحركات اليوم: {recentActivity.length}</span>
                  <span>العملة المعتمدة: {currency}</span>
                </div>
              </div>

              {/* Right Column: Top Overdue Students (1 Col) */}
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <h3 className="font-black text-sm text-foreground">أعلى الطلاب ذمةً ومتأخرات</h3>
                    </div>
                    <Link to="/finance/students" className="text-xs font-bold text-amber-600 hover:underline">
                      الكشف الكامل ←
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {topDebtors.length === 0 ? (
                      <div className="text-center py-8 text-emerald-600 font-black text-xs">
                        🎉 ممتاز! لا توجد مستحقات متأخرة على طلاب المرحلة.
                      </div>
                    ) : (
                      topDebtors.map((st) => (
                        <div
                          key={st.studentId}
                          className="p-3 rounded-xl bg-background/60 border border-border/50 flex items-center justify-between gap-2"
                        >
                          <div>
                            <p className="text-xs font-black text-foreground">{st.studentName}</p>
                            <p className="text-[10px] text-muted-foreground font-bold">{st.grade}</p>
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-black text-danger tabular-nums">
                              {st.due.toLocaleString()} {currency}
                            </p>
                            <Link
                              to="/finance/students"
                              className="text-[10px] text-primary font-black hover:underline"
                            >
                              تحصيل الآن
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border/50">
                  <Link
                    to="/finance/students"
                    className="w-full py-2 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-xs font-black text-center block transition-colors"
                  >
                    فتح كشف المتأخرات والرسوم المتبقية
                  </Link>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW 2: COMPLETE DIRECTORY OF ALL 12 MODULES */}
        {/* ==================================================== */}
        {activeTab === "modules" && (
          <div className="space-y-6">
            
            {/* Search Filter for Modules */}
            <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full sm:max-w-md">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={moduleSearch}
                  onChange={e => setModuleSearch(e.target.value)}
                  placeholder="بحث في أقسام وخدمات المركز المالي..."
                  className="h-10 w-full rounded-xl border border-border/60 bg-background pr-9 pl-4 text-xs font-bold shadow-sm focus:border-primary outline-none transition-all"
                />
              </div>
              <p className="text-xs font-bold text-muted-foreground">
                عرض {filteredModules.length} من أصل 12 قسماً مالياً متكاملاً
              </p>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredModules.map((mod) => (
                <Link key={mod.id} to={mod.href} className="block group">
                  <div className="h-full bg-card rounded-2xl border border-border/70 p-5 shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col justify-between group-hover:-translate-y-0.5">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${mod.color} group-hover:scale-105 transition-transform duration-200`}>
                          {mod.icon}
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                          mod.badgeTone === 'success' 
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                            : mod.badgeTone === 'danger'
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : mod.badgeTone === 'warning'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : 'bg-primary/10 text-primary border-primary/20'
                        }`}>
                          {mod.badge}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-foreground mb-1.5 group-hover:text-primary transition-colors">
                        {mod.title}
                      </h3>
                      <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                        {mod.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between text-xs font-black text-primary">
                      <span>دخول القسم</span>
                      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

          </div>
        )}

      </div>
    </AppShell>
  );
}
