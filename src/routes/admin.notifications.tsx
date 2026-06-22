import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { BellRing, CheckCircle2, AlertCircle, Info, Settings } from "lucide-react";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({ meta: [{ title: "إشعارات النظام | منصة مدارس" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const notifications = [
    { id: 1, title: "تحديث النظام متوفر", message: "يتوفر تحديث جديد للمنصة (الإصدار 2.1). يتضمن ميزات جديدة في قسم المالية وتحسينات في الأداء.", type: "info", date: "منذ ساعتين", isRead: false },
    { id: 2, title: "النسخ الاحتياطي التلقائي", message: "تم إنشاء نسخة احتياطية من قاعدة البيانات بنجاح يوم أمس الساعة 2:00 صباحاً.", type: "success", date: "منذ 14 ساعة", isRead: false },
    { id: 3, title: "محاولة دخول فاشلة", message: "تم رصد 5 محاولات دخول فاشلة متتالية لحساب مدير النظام من عنوان IP غير مألوف.", type: "warning", date: "أمس", isRead: true },
    { id: 4, title: "انتهاء صلاحية اشتراك", message: "اشتراك المدرسة في خدمة الرسائل القصيرة (SMS) سينتهي خلال 3 أيام. يرجى التجديد لتجنب انقطاع الخدمة.", type: "warning", date: "قبل يومين", isRead: true },
    { id: 5, title: "اعتماد مسير الرواتب", message: "تم اعتماد مسير رواتب شهر أغسطس وترحيله للقسم المالي بنجاح.", type: "success", date: "قبل 5 أيام", isRead: true },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "warning": return <AlertCircle className="h-5 w-5 text-warning" />;
      default: return <Info className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الإدارة العامة" }, { label: "إشعارات النظام" }]}
      actions={
        <div className="flex gap-2">
           <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-bold hover:bg-accent">
            <CheckCircle2 className="h-4 w-4" /> تحديد الكل كمقروء
          </button>
           <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-bold hover:bg-accent">
            <Settings className="h-4 w-4" /> إعدادات الإشعارات
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl relative">
            <BellRing className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">2</span>
          </div>
          <div>
            <h1 className="text-2xl font-black">إشعارات وتنبيهات النظام</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">متابعة التنبيهات الإدارية، الأمنية، وتحديثات المنصة</p>
          </div>
        </div>

        <PageCard className="p-0">
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <div key={n.id} className={`p-5 flex items-start gap-4 transition-colors hover:bg-accent/30 ${n.isRead ? 'opacity-70' : 'bg-primary/5'}`}>
                <div className={`mt-0.5 rounded-full p-1.5 ${n.type === 'success' ? 'bg-success/10' : n.type === 'warning' ? 'bg-warning/10' : 'bg-primary/10'}`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-bold ${!n.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {n.title}
                      {!n.isRead && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary"></span>}
                    </h3>
                    <span className="text-xs text-muted-foreground tabular font-medium">{n.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </PageCard>
      </div>
    </AppShell>
  );
}
