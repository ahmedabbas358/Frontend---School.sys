import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { 
  FolderTree, 
  BookOpen, 
  Scale, 
  Settings2,
  FileCheck2,
  Layers3
} from "lucide-react";

export const Route = createFileRoute("/finance/advanced")({
  component: AdvancedAccountingHub,
});

function AdvancedAccountingHub() {
  const modules = [
    {
      id: "accounts",
      title: "الدليل المحاسبي",
      description: "إدارة شجرة الحسابات (Chart of Accounts) والأرصدة الافتتاحية",
      icon: <FolderTree className="w-8 h-8 text-indigo-500" />,
      href: "/finance/accounts",
      color: "bg-indigo-500/10 text-indigo-600",
    },
    {
      id: "ledger",
      title: "سجل القيود اليومية",
      description: "إدارة دفتر اليومية العام ومراجعة القيود الآلية واليدوية",
      icon: <BookOpen className="w-8 h-8 text-blue-500" />,
      href: "/finance/ledger",
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      id: "trial-balance",
      title: "ميزان المراجعة",
      description: "التحقق من توازن الحسابات وإصدار الميزانية العمومية",
      icon: <Scale className="w-8 h-8 text-emerald-500" />,
      href: "/finance/trial-balance",
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      id: "audit",
      title: "المراجعة والتدقيق",
      description: "تدقيق العمليات المالية (Audit Trail) ومراجعة الاعتمادات",
      icon: <FileCheck2 className="w-8 h-8 text-slate-500" />,
      href: "#",
      color: "bg-slate-500/10 text-slate-600",
      disabled: true
    },
    {
      id: "settings",
      title: "الإعدادات المالية",
      description: "إعدادات الربط المحاسبي التلقائي للرسوم والرواتب",
      icon: <Settings2 className="w-8 h-8 text-gray-500" />,
      href: "#",
      color: "bg-gray-500/10 text-gray-600",
      disabled: true
    }
  ];

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
              <Layers3 className="w-8 h-8 text-primary" />
              المحاسبة المتقدمة
            </h1>
            <p className="text-muted-foreground mt-1 font-bold">
              مخصصة لمدراء النظام والمحاسبين المحترفين فقط لمراجعة أساس النظام المحاسبي.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <Link 
              key={mod.id} 
              to={mod.disabled ? "" : mod.href} 
              className={`block group ${mod.disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
            >
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
