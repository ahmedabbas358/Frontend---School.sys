import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { HardDrive, Download, RefreshCcw, Database, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/backup")({
  head: () => ({ meta: [{ title: "النسخ الاحتياطي | منصة مدارس" }] }),
  component: BackupPage,
});

function BackupPage() {
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleBackup = () => {
    setIsBackingUp(true);
    toast.info("جاري إنشاء نسخة احتياطية من قاعدة البيانات...");
    
    // Simulate backup process
    setTimeout(() => {
      setIsBackingUp(false);
      toast.success("تم أخذ النسخة الاحتياطية بنجاح");
    }, 2000);
  };

  const backups = [
    { id: "BK-20231020-0200", date: "2023-10-20T02:00:00Z", size: "245 MB", type: "تلقائي", status: "ناجح" },
    { id: "BK-20231019-0200", date: "2023-10-19T02:00:00Z", size: "242 MB", type: "تلقائي", status: "ناجح" },
    { id: "BK-20231018-1530", date: "2023-10-18T15:30:00Z", size: "240 MB", type: "يدوي", status: "ناجح" },
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
                     <button className="flex items-center justify-center p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-colors tooltip-trigger" title="تحميل النسخة">
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
          </PageCard>
        </div>
      </div>
    </AppShell>
  );
}
