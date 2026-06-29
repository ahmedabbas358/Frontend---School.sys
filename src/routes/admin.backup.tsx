import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { HardDrive, Download, RefreshCcw, Database, AlertTriangle, Cloud, ShieldCheck, RotateCcw, Clock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";

export const Route = createFileRoute("/admin/backup")({
  head: () => ({ meta: [{ title: "النسخ الاحتياطي | منصة مدارس" }] }),
  component: BackupPage,
});

function BackupPage() {
  const { allStudents, allStaff, allInvoices, allExpenses, allSections, allSubjects, allAcademicYears, systemSettings, addActivityLog } = useGlobalStore();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const [backups, setBackups] = useState([
    { id: "BK-20231020-0200", date: new Date(Date.now() - 2 * 3600000).toISOString(), size: "245 MB", type: "تلقائي", status: "ناجح" },
    { id: "BK-20231019-0200", date: new Date(Date.now() - 26 * 3600000).toISOString(), size: "242 MB", type: "تلقائي", status: "ناجح" },
    { id: "BK-20231018-1530", date: new Date(Date.now() - 50 * 3600000).toISOString(), size: "240 MB", type: "يدوي", status: "ناجح" },
  ]);

  const handleBackup = () => {
    setIsBackingUp(true);
    toast.info("جاري إنشاء نسخة احتياطية من قاعدة البيانات...");
    
    // Simulate backup process
    setTimeout(() => {
      setIsBackingUp(false);
      const newBackup = {
        id: `BK-${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}`,
        date: new Date().toISOString(),
        size: "246 MB",
        type: "يدوي",
        status: "ناجح"
      };
      setBackups([newBackup, ...backups]);
      addActivityLog({ user: "مدير النظام", action: "إنشاء نسخة احتياطية", entity: "النسخ الاحتياطي", details: `تم إنشاء نسخة احتياطية يدوية (${newBackup.id})` });
      toast.success("تم أخذ النسخة الاحتياطية بنجاح");
    }, 2000);
  };

  const handleTestRestore = (id: string) => {
    setTestingId(id);
    toast.info(`جاري اختبار استرجاع النسخة ${id} في بيئة افتراضية...`);
    setTimeout(() => {
      setTestingId(null);
      addActivityLog({ user: "مدير النظام", action: "اختبار استرجاع", entity: "النسخ الاحتياطي", details: `اختبار استرجاع النسخة ${id} - ناجح` });
      toast.success(`اكتمل الاختبار! النسخة ${id} سليمة وقابلة للاسترجاع بنسبة 100%.`);
    }, 3000);
  };

  const handleDownload = (backupId: string) => {
    const backupData = {
      id: backupId,
      timestamp: new Date().toISOString(),
      system: "darasi-school-system",
      data: {
        students: allStudents,
        staff: allStaff,
        invoices: allInvoices,
        expenses: allExpenses,
        sections: allSections,
        subjects: allSubjects,
        academicYears: allAcademicYears,
        settings: systemSettings,
      }
    };
    const blob = new Blob(["\uFEFF" + JSON.stringify(backupData, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-${backupId}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addActivityLog({ user: "مدير النظام", action: "تحميل نسخة احتياطية", entity: "النسخ الاحتياطي", details: `تم تحميل النسخة ${backupId}` });
    toast.success(`تم تحميل النسخة الاحتياطية ${backupId}`);
  };

  const storageTargets = [
    { id: "local", name: "تخزين محلي", status: "نشط", desc: "خادم المدرسة الداخلي", tone: "success" as const },
    { id: "cloud", name: "نسخة سحابية", status: "جاهز", desc: "Google Drive / S3", tone: "primary" as const },
    { id: "offsite", name: "نسخة خارج الموقع", status: "مجدولة", desc: "حفظ أسبوعي مشفر", tone: "warning" as const },
  ];

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الإدارة العامة" }, { label: "النسخ الاحتياطي" }]}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">إدارة النسخ الاحتياطي (Backups)</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">تأمين بيانات النظام، أخذ نسخ احتياطية واسترجاعها</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">آخر نسخة</p>
            <p className="mt-1 text-xl font-black">محدثة</p>
            <p className="mt-1 text-xs text-muted-foreground">منذ ساعتين</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">حالة التشفير</p>
            <p className="mt-1 text-xl font-black text-success">مفعل</p>
            <p className="mt-1 text-xs text-muted-foreground">AES-256</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">مدة الاحتفاظ</p>
            <p className="mt-1 text-xl font-black">30 يوم</p>
            <p className="mt-1 text-xs text-muted-foreground">قابلة للتعديل من الإعدادات</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">اختبار الاسترجاع</p>
            <p className="mt-1 text-xl font-black text-primary">ناجح</p>
            <p className="mt-1 text-xs text-muted-foreground">آخر اختبار أسبوعي</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <PageCard className="md:col-span-1 flex flex-col justify-center items-center text-center p-8 bg-card border-primary/20">
             <Database className="h-16 w-16 text-primary mb-4 opacity-80" />
             <h3 className="font-bold text-lg mb-2">نسخ احتياطي يدوي</h3>
             <p className="text-sm text-muted-foreground mb-6">قم بإنشاء نسخة احتياطية فورية لجميع بيانات المدرسة والنظام.</p>
             <button 
               onClick={handleBackup} 
               disabled={isBackingUp}
               className={`w-full flex justify-center items-center gap-2 rounded-lg py-3 px-4 font-bold text-white transition-all ${isBackingUp ? 'bg-primary/50 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
             >
               <RefreshCcw className={`h-5 w-5 ${isBackingUp ? 'animate-spin' : ''}`} />
               {isBackingUp ? "جاري النسخ..." : "إنشاء نسخة احتياطية الآن"}
             </button>
          </PageCard>

          <PageCard className="md:col-span-2" title="سجل النسخ الاحتياطية">
             <div className="mb-4 grid gap-3 md:grid-cols-3">
              {storageTargets.map(target => (
                <div key={target.id} className="rounded-xl border border-border bg-muted/20 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                      {target.id === "cloud" ? <Cloud className="h-4 w-4" /> : target.id === "offsite" ? <ShieldCheck className="h-4 w-4" /> : <HardDrive className="h-4 w-4" />}
                    </div>
                    <Badge tone={target.tone}>{target.status}</Badge>
                  </div>
                  <div className="text-sm font-bold">{target.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{target.desc}</div>
                </div>
              ))}
             </div>
             <div className="space-y-4">
               {backups.map(b => (
                 <div key={b.id} className="flex items-center justify-between p-4 border border-border rounded-xl bg-card hover:bg-accent/50 transition-colors">
                   <div className="flex items-center gap-4">
                     <div className="bg-primary/10 text-primary p-2 rounded-lg">
                       <HardDrive className="h-5 w-5" />
                     </div>
                     <div>
                       <div className="font-bold text-sm">{b.id}</div>
                       <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                         <span dir="ltr">{new Date(b.date).toLocaleString("ar-EG")}</span>
                         <span>•</span>
                         <span>الحجم: {b.size}</span>
                         <span>•</span>
                         <span>النوع: {b.type}</span>
                       </div>
                     </div>
                   </div>
                     <div className="flex items-center gap-3">
                       <Badge tone="success">{b.status}</Badge>
                       <button onClick={() => handleTestRestore(b.id)} disabled={testingId !== null} className={`flex items-center justify-center p-2 rounded-md transition-colors tooltip-trigger ${testingId === b.id ? 'bg-primary/20 text-primary' : 'hover:bg-primary/10 hover:text-primary'}`} title="اختبار الاسترجاع">
                         <RotateCcw className={`h-5 w-5 ${testingId === b.id ? 'animate-spin' : ''}`} />
                       </button>
                       <button onClick={() => handleDownload(b.id)} className="flex items-center justify-center p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-colors tooltip-trigger" title="تحميل النسخة">
                         <Download className="h-5 w-5" />
                       </button>
                     </div>
                 </div>
               ))}
             </div>
             
             <div className="mt-6 p-4 rounded-xl border border-warning/30 bg-warning/5 flex items-start gap-3">
               <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
               <div className="text-sm">
                 <strong className="block text-warning-foreground mb-1">تنبيه أمان البيانات:</strong>
                 <p className="text-muted-foreground">يتم أخذ نسخة احتياطية تلقائية يومياً في تمام الساعة 2:00 صباحاً. يرجى التأكد من تحميل النسخ بشكل دوري وحفظها في مكان آمن (مخزن خارجي أو سحابة).</p>
               </div>
             </div>
             <div className="mt-4 rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center gap-2 font-bold">
                <Clock className="h-4 w-4 text-primary" />
                خطة الاسترجاع عند الطوارئ
              </div>
              <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                <div className="rounded-lg bg-muted/40 p-3">1. اختيار نسخة موثوقة واختبارها في بيئة منفصلة.</div>
                <div className="rounded-lg bg-muted/40 p-3">2. تجميد عمليات الإدخال الحساسة مؤقتاً.</div>
                <div className="rounded-lg bg-muted/40 p-3">3. استرجاع البيانات ثم مراجعة سجل الأنشطة.</div>
              </div>
             </div>
          </PageCard>
        </div>
      </div>
    </AppShell>
  );
}
