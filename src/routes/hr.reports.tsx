import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { FileBarChart2, Printer, Users, Award, ShieldAlert, BadgeCent } from "lucide-react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/hr/reports")({
  head: () => ({ meta: [{ title: "تقارير الموظفين المتقدمة | منصة مدارس" }] }),
  component: HRReportsPage,
});

const HR_TEMPLATES: PrintTemplate[] = [
  {
    id: "hr_staff_overview",
    name: "قائمة الموظفين الشاملة",
    category: "قوائم عامة",
    type: "table",
    columns: [
      { key: "id", label: "الرقم الوظيفي" },
      { key: "name", label: "اسم الموظف" },
      { key: "department", label: "القسم" },
      { key: "role", label: "المسمى الوظيفي" },
      { key: "status", label: "الحالة", render: (r: any) => r.status === "active" ? "نشط" : "غير نشط" }
    ]
  },
  {
    id: "hr_payroll_summary",
    name: "مسير الرواتب المالي",
    category: "مالية ورواتب",
    type: "table",
    columns: [
      { key: "name", label: "الاسم" },
      { key: "role", label: "الوظيفة" },
      { key: "basicSalary", label: "الأساسي", render: (r: any) => `${(r.basicSalary || 0).toLocaleString("ar-EG")} ر.س` },
      { key: "allowance", label: "البدلات", render: (r: any) => `${(r.allowance || 0).toLocaleString("ar-EG")} ر.س` },
      { key: "deduction", label: "الخصومات", render: (r: any) => `${(r.deduction || 0).toLocaleString("ar-EG")} ر.س` },
      { key: "net", label: "الصافي", render: (r: any) => `${((r.basicSalary || 0) + (r.allowance || 0) - (r.deduction || 0)).toLocaleString("ar-EG")} ر.س` },
    ]
  },
  {
    id: "hr_evaluations",
    name: "نتائج تقييم الأداء",
    category: "تقييم أداء",
    type: "table",
    columns: [
      { key: "staffName", label: "اسم الموظف" },
      { key: "period", label: "الفترة" },
      { key: "overallScore", label: "الدرجة (من 5)", render: (r: any) => r.overallScore?.toFixed(1) || "-" },
      { key: "rating", label: "التقدير", render: (r: any) => {
        const s = r.overallScore || 0;
        return s >= 4.5 ? "ممتاز" : s >= 3.5 ? "جيد جداً" : s >= 2.5 ? "جيد" : "ضعيف";
      }}
    ]
  }
];

function HRReportsPage() {
  const { allStaff, allStaffEvaluations } = useGlobalStore();
  
  // Advanced Print Engine State
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printData, setPrintData] = useState<any[]>([]);
  const [printTitle, setPrintTitle] = useState("");
  const [printSubtitle, setPrintSubtitle] = useState("");
  const [activeTemplateId, setActiveTemplateId] = useState("hr_staff_overview");

  const handleOpenPrint = (type: "overview" | "payroll" | "evaluations") => {
    let dataToPrint: any[] = [];
    let title = "";
    let templateId = "";

    if (type === "overview") {
      dataToPrint = allStaff.filter(s => !s.isDeleted);
      title = "كشف قائمة الموظفين (الكادر الإداري والتعليمي)";
      templateId = "hr_staff_overview";
    } else if (type === "payroll") {
      dataToPrint = allStaff.filter(s => !s.isDeleted && s.status === "active");
      title = "مسير الرواتب الإجمالي للموظفين النشطين";
      templateId = "hr_payroll_summary";
    } else if (type === "evaluations") {
      dataToPrint = allStaffEvaluations;
      title = "التقرير الشامل لتقييمات الأداء الوظيفي";
      templateId = "hr_evaluations";
    }

    setPrintData(dataToPrint);
    setPrintTitle(title);
    setPrintSubtitle(`تاريخ استخراج التقرير: ${new Date().toLocaleDateString("ar-EG")}`);
    setActiveTemplateId(templateId);
    setIsPrintOpen(true);
  };

  // Stats
  const activeStaff = allStaff.filter(s => !s.isDeleted && s.status === "active");
  const totalPayroll = activeStaff.reduce((acc, curr) => acc + (curr.basicSalary || 0) + (curr.allowance || 0) - (curr.deduction || 0), 0);

  return (
    <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الموارد البشرية" }, { label: "نظام التقارير المتقدم" }]}>
      
      {/* Declarative Print Engine Component */}
      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)}
        title={printTitle}
        subtitle={printSubtitle}
        data={printData}
        templates={HR_TEMPLATES}
        defaultTemplateId={activeTemplateId}
      />
      
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl">
            <FileBarChart2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">نظام التقارير المتقدم (HR)</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">توليد، تصفية، وتصدير التقارير الإدارية والمالية بصيغ متعددة</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
           <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-bold">إجمالي الموظفين</p>
                <p className="text-lg font-black">{activeStaff.length} موظف نشط</p>
              </div>
           </div>
           <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg"><BadgeCent className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-bold">الرواتب التقديرية</p>
                <p className="text-lg font-black tabular">{totalPayroll.toLocaleString("ar-EG")} ر.س</p>
              </div>
           </div>
           <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Award className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-bold">التقييمات المنجزة</p>
                <p className="text-lg font-black">{allStaffEvaluations.length} سجل تقييم</p>
              </div>
           </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          <PageCard title="قائمة الموظفين (نظرة عامة)" className="flex flex-col h-full border-t-4 border-t-blue-500">
            <div className="flex-1 space-y-3 mb-4 text-sm text-muted-foreground">
              <p className="font-medium">يشمل هذا التقرير تفاصيل الكادر كاملة:</p>
              <ul className="list-disc list-inside space-y-1 mr-2 opacity-80">
                <li>الأسماء والبيانات الأساسية</li>
                <li>التوزيع على الأقسام</li>
                <li>المسميات الوظيفية والحالة</li>
              </ul>
            </div>
            <button onClick={() => handleOpenPrint('overview')} className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/20 mt-auto transition-colors">
              <Printer className="h-4 w-4" /> إصدار التقرير
            </button>
          </PageCard>

          <PageCard title="مسير الرواتب المالي" className="flex flex-col h-full border-t-4 border-t-green-500">
            <div className="flex-1 space-y-3 mb-4 text-sm text-muted-foreground">
              <p className="font-medium">البيانات المالية التفصيلية للمستحقات:</p>
              <ul className="list-disc list-inside space-y-1 mr-2 opacity-80">
                <li>الراتب الأساسي</li>
                <li>البدلات (سكن، نقل، أخرى)</li>
                <li>الخصومات (غياب، تأمينات)</li>
                <li>صافي الراتب المستحق</li>
              </ul>
            </div>
            <button onClick={() => handleOpenPrint('payroll')} className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/20 mt-auto transition-colors">
              <Printer className="h-4 w-4" /> إصدار التقرير
            </button>
          </PageCard>

          <PageCard title="تقييمات الأداء الدورية" className="flex flex-col h-full border-t-4 border-t-amber-500">
            <div className="flex-1 space-y-3 mb-4 text-sm text-muted-foreground">
              <p className="font-medium">نتائج جودة الأداء والانضباطية:</p>
              <ul className="list-disc list-inside space-y-1 mr-2 opacity-80">
                <li>اسم الموظف والفترة التقييمية</li>
                <li>مجموع النقاط من 5</li>
                <li>التقدير اللفظي العام</li>
              </ul>
            </div>
            <button onClick={() => handleOpenPrint('evaluations')} className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/20 mt-auto transition-colors">
              <Printer className="h-4 w-4" /> إصدار التقرير
            </button>
          </PageCard>

        </div>
      </div>
    </AppShell>
  );
}
