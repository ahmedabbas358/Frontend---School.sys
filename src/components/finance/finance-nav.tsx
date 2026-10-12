import React from "react";
import { Link } from "@tanstack/react-router";
import { 
  Building2, 
  Wallet, 
  Receipt, 
  TrendingDown, 
  GraduationCap, 
  Landmark, 
  Layers, 
  Sparkles, 
  CreditCard, 
  FolderTree, 
  PieChart, 
  Scale, 
  SlidersHorizontal,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown
} from "lucide-react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";

export type FinanceTabKey = 
  | "hub"
  | "dashboard"
  | "students" 
  | "payments" 
  | "expenses" 
  | "treasury" 
  | "banks" 
  | "fees" 
  | "discounts" 
  | "vendors" 
  | "accounts" 
  | "budgets" 
  | "cost-centers" 
  | "reports";

interface FinanceNavTabsProps {
  activeTab: FinanceTabKey;
}

export function FinanceNavTabs({ activeTab }: FinanceNavTabsProps) {
  const { stage, getStageLabel } = useStage();
  const { 
    currency,
    activeStageStudents,
    activeStageInvoices,
    allPayments,
    allExpenses,
    allTreasuries,
    allBankAccounts,
    allCashSessions,
    allFeeStructures,
    allDiscounts,
    allVendors
  } = useGlobalStore();

  // Metrics calculation
  const totalLiquid = React.useMemo(() => {
    const tBal = (allTreasuries || []).filter(t => t.status === "active" || !t.status).reduce((sum, t) => sum + (t.balance || 0), 0);
    const bBal = (allBankAccounts || []).filter(b => b.status === "active" || !b.status).reduce((sum, b) => sum + (b.currentBalance ?? (b as any).balance ?? 0), 0);
    return tBal + bBal;
  }, [allTreasuries, allBankAccounts]);

  const debtorsCount = React.useMemo(() => {
    return new Set(
      (activeStageInvoices || [])
        .filter(inv => ((inv.netAmount ?? inv.amount ?? 0) - (inv.paid || 0)) > 0 && inv.status !== "cancelled")
        .map(inv => inv.studentId)
    ).size;
  }, [activeStageInvoices]);

  const activeCashSessionsCount = React.useMemo(() => {
    return (allCashSessions || []).filter(s => s.status === "open").length;
  }, [allCashSessions]);

  const primaryTabs = [
    {
      id: "hub" as FinanceTabKey,
      label: "المركز المالي الشامل",
      href: "/finance",
      icon: Building2,
      badge: `${totalLiquid.toLocaleString()} ${currency}`,
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
    },
    {
      id: "dashboard" as FinanceTabKey,
      label: "لوحة المؤشرات البيانية",
      href: "/finance/dashboard",
      icon: PieChart,
      badge: "تحليلي",
      badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
    },
    {
      id: "students" as FinanceTabKey,
      label: "الرسوم والطلاب",
      href: "/finance/students",
      icon: GraduationCap,
      badge: debtorsCount > 0 ? `${debtorsCount} مدين` : `${activeStageStudents?.length || 0} طالب`,
      badgeColor: debtorsCount > 0 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" : "bg-primary/10 text-primary border-primary/20"
    },
    {
      id: "payments" as FinanceTabKey,
      label: "سندات القبض",
      href: "/finance/payments",
      icon: Receipt,
      badge: `${allPayments?.length || 0} سند`,
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
    },
    {
      id: "expenses" as FinanceTabKey,
      label: "سندات الصرف",
      href: "/finance/expenses",
      icon: TrendingDown,
      badge: `${allExpenses?.length || 0} سند`,
      badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
    },
    {
      id: "treasury" as FinanceTabKey,
      label: "الخزينة والصناديق",
      href: "/finance/treasury",
      icon: Wallet,
      badge: activeCashSessionsCount > 0 ? `${activeCashSessionsCount} جلسة نشطة` : "مغلق",
      badgeColor: activeCashSessionsCount > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-muted text-muted-foreground border-border/40"
    },
    {
      id: "banks" as FinanceTabKey,
      label: "البنوك والتسويات",
      href: "/finance/banks",
      icon: Landmark,
      badge: `${(allBankAccounts || []).length} بنوك`,
      badgeColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20"
    },
    {
      id: "fees" as FinanceTabKey,
      label: "هياكل الرسوم",
      href: "/finance/fees",
      icon: Layers,
      badge: `${(allFeeStructures || []).length}`,
      badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
    },
    {
      id: "discounts" as FinanceTabKey,
      label: "الخصومات والمنح",
      href: "/finance/discounts",
      icon: Sparkles,
      badge: `${(allDiscounts || []).length}`,
      badgeColor: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20"
    },
    {
      id: "vendors" as FinanceTabKey,
      label: "الموردون والمشتريات",
      href: "/finance/vendors",
      icon: CreditCard,
      badge: `${(allVendors || []).length}`,
      badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
    },
  ];

  const secondaryTabs = [
    {
      id: "accounts" as FinanceTabKey,
      label: "دليل الحسابات",
      href: "/finance/accounts",
      icon: FolderTree,
    },
    {
      id: "budgets" as FinanceTabKey,
      label: "الموازنات التقديرية",
      href: "/finance/budgets",
      icon: Scale,
    },
    {
      id: "cost-centers" as FinanceTabKey,
      label: "مراكز التكلفة",
      href: "/finance/cost-centers",
      icon: SlidersHorizontal,
    },
    {
      id: "reports" as FinanceTabKey,
      label: "التقارير المالية",
      href: "/finance/reports",
      icon: PieChart,
    }
  ];

  const isSecondaryActive = secondaryTabs.some(t => t.id === activeTab);

  return (
    <div className="space-y-3 mb-6">
      {/* Primary Sub-Nav Strip */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 no-scrollbar border-b border-border/70">
        <div className="flex items-center gap-1.5 shrink-0">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                to={tab.href}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70 bg-card/60 border border-border/50"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border ${
                      isActive 
                        ? "bg-white/20 text-primary-foreground border-white/30" 
                        : tab.badgeColor
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Accounting & General Ledger Dropdown Strip */}
        <div className="flex items-center gap-1 shrink-0">
          {secondaryTabs.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeTab === sec.id;
            return (
              <Link
                key={sec.id}
                to={sec.href}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? "bg-secondary text-secondary-foreground font-black shadow-sm border border-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/40"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{sec.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
