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
  Target,
  GraduationCap,
  Users,
  PieChart as PieChartIcon
} from "lucide-react";

export const Route = createFileRoute("/finance/")({
  component: FinanceHub,
});

function FinanceHub() {
  const hubModules = [
    {
      id: "dashboard",
      title: "مركز العمليات المالية",
      description: "لوحة تشغيلية للحالة المالية اليومية والإجراءات السريعة",
      icon: <TrendingUp className="w-8 h-8 text-primary" />,
      href: "/finance/dashboard",
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      id: "students",
      title: "المالية الطلابية",
      description: "إدارة الملف المالي للطالب، الأقساط، الدفعات، والمنح",
      icon: <GraduationCap className="w-8 h-8 text-emerald-500" />,
      href: "/finance/students",
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      id: "treasury",
      title: "إدارة الخزائن",
      description: "صناديق الكاش، جلسات النقدية، حركات القبض والصرف",
      icon: <Wallet className="w-8 h-8 text-amber-500" />,
      href: "/finance/treasury",
      color: "bg-amber-500/10 text-amber-600",
    },
    {
      id: "banks",
      title: "الحسابات البنكية",
      description: "إدارة البنوك، التحويلات، والإيداعات والمطابقة",
      icon: <Building2 className="w-8 h-8 text-cyan-500" />,
      href: "/finance/banks",
      color: "bg-cyan-500/10 text-cyan-600",
    },
    {
      id: "payroll",
      title: "نظام الرواتب المتطور",
      description: "مسيرات رواتب الموظفين واستحقاقاتهم وحركة السلف",
      icon: <Users className="w-8 h-8 text-purple-500" />,
      href: "/hr/payroll", 
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      id: "vendors",
      title: "المصروفات والموردون",
      description: "طلبات الصرف، اعتماداتها، وإدارة حسابات الموردين",
      icon: <CreditCard className="w-8 h-8 text-rose-500" />,
      href: "/finance/expenses",
      color: "bg-rose-500/10 text-rose-600",
    },
    {
      id: "reports",
      title: "التقارير الإدارية",
      description: "تقارير تشغيلية، تدفق نقدي، إيرادات ومتأخرات",
      icon: <PieChartIcon className="w-8 h-8 text-teal-500" />,
      href: "/finance/reports",
      color: "bg-teal-500/10 text-teal-600",
    },
    {
      id: "accounts",
      title: "الدليل المحاسبي",
      description: "إدارة شجرة الحسابات (Chart of Accounts) والأرصدة",
      icon: <FolderTree className="w-8 h-8 text-indigo-500" />,
      href: "/finance/accounts",
      color: "bg-indigo-500/10 text-indigo-600",
    },
    {
      id: "ledger",
      title: "سجل القيود اليومية",
      description: "إدارة وتدقيق القيود المحاسبية التلقائية واليدوية (General Ledger)",
      icon: <FileText className="w-8 h-8 text-blue-500" />,
      href: "/finance/ledger",
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      id: "trial-balance",
      title: "ميزان المراجعة",
      description: "توازن الحسابات، الأرصدة الافتتاحية والميزانية العمومية",
      icon: <ShieldCheck className="w-8 h-8 text-slate-500" />,
      href: "/finance/trial-balance",
      color: "bg-slate-500/10 text-slate-600",
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
