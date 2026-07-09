import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { 
  Building2, 
  Wallet, 
  Receipt, 
  CreditCard, 
  FileText, 
  PieChart, 
  CalendarCheck, 
  ShieldCheck, 
  CheckSquare, 
  FolderTree, 
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/finance/")({
  component: FinanceHub,
});

function FinanceHub() {
  const hubModules = [
    {
      id: "dashboard",
      title: "لوحة القيادة",
      description: "نظرة عامة على المؤشرات المالية والتدفقات النقدية",
      icon: <TrendingUp className="w-8 h-8 text-primary" />,
      href: "/finance/dashboard",
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      id: "receivables",
      title: "المقبوضات والفواتير",
      description: "إصدار فواتير الطلاب وتحصيل الرسوم المستحقة",
      icon: <Receipt className="w-8 h-8 text-emerald-500" />,
      href: "/finance/invoices",
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      id: "payables",
      title: "المدفوعات والمصروفات",
      description: "إدارة المصروفات التشغيلية والمدفوعات للموردين",
      icon: <CreditCard className="w-8 h-8 text-rose-500" />,
      href: "/finance/expenses",
      color: "bg-rose-500/10 text-rose-600",
    },
    {
      id: "payroll",
      title: "الرواتب والأجور",
      description: "إدارة مسيرات رواتب الموظفين والسلف",
      icon: <Wallet className="w-8 h-8 text-purple-500" />,
      href: "/hr/payroll", // Linked to HR Payroll but conceptually part of Finance ERP
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      id: "ledger",
      title: "دفتر الأستاذ العام",
      description: "سجل القيود المحاسبية، وميزان المراجعة",
      icon: <FileText className="w-8 h-8 text-indigo-500" />,
      href: "/finance/ledger",
      color: "bg-indigo-500/10 text-indigo-600",
    },
    {
      id: "coa",
      title: "دليل الحسابات",
      description: "شجرة الحسابات المدرسية وتقاريرها",
      icon: <FolderTree className="w-8 h-8 text-amber-500" />,
      href: "/finance/accounts",
      color: "bg-amber-500/10 text-amber-600",
    },
    {
      id: "reports",
      title: "التقارير المالية",
      description: "قائمة الدخل، التدفقات النقدية، تقارير الكيانات",
      icon: <PieChart className="w-8 h-8 text-cyan-500" />,
      href: "/finance/reports",
      color: "bg-cyan-500/10 text-cyan-600",
    },
    {
      id: "audit",
      title: "مركز المراجعة والتدقيق",
      description: "مراجعة القيود غير المتوازنة وتدقيق العمليات",
      icon: <ShieldCheck className="w-8 h-8 text-slate-500" />,
      href: "/finance/ledger", // To be added as a tab
      color: "bg-slate-500/10 text-slate-600",
    },
    {
      id: "approvals",
      title: "مركز الاعتمادات",
      description: "اعتماد المصروفات والرواتب المعلقة",
      icon: <CheckSquare className="w-8 h-8 text-green-500" />,
      href: "/finance/expenses", // To be integrated
      color: "bg-green-500/10 text-green-600",
    },
    {
      id: "year-closing",
      title: "إقفال السنة المالية",
      description: "ترحيل الأرصدة وبدء سنة مالية جديدة",
      icon: <CalendarCheck className="w-8 h-8 text-orange-500" />,
      href: "/finance/dashboard",
      color: "bg-orange-500/10 text-orange-600",
    }
  ];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
              <Building2 className="w-8 h-8 text-primary" />
              المركز المالي (Financial Hub)
            </h1>
            <p className="text-muted-foreground mt-1 font-bold">
              منظومة متكاملة لتخطيط الموارد المالية، القيود المحاسبية، وإدارة الحسابات.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {hubModules.map((mod) => (
            <Link key={mod.id} to={mod.href} className="block group">
              <PageCard className="h-full hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-primary/20">
                <div className="p-6 flex flex-col items-center text-center space-y-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${mod.color} group-hover:scale-110 transition-transform duration-300`}>
                    {mod.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground mb-2 group-hover:text-primary transition-colors">{mod.title}</h3>
                    <p className="text-sm font-bold text-muted-foreground">{mod.description}</p>
                  </div>
                </div>
              </PageCard>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
