import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { BellRing, CheckCircle2, AlertCircle, Info, Settings, Search, ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({ meta: [{ title: "إشعارات النظام | منصة مدارس" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { allStudents, allStaff, allInvoices, allStaffLeaves } = useGlobalStore();

  const [staticNotifications, setStaticNotifications] = useState([
    { id: "s1", title: "تحديث النظام متوفر", message: "يتوفر تحديث جديد للمنصة (الإصدار 2.1). يتضمن ميزات جديدة في قسم المالية وتحسينات في الأداء.", type: "info", date: "منذ ساعتين", isRead: false },
    { id: "s2", title: "النسخ الاحتياطي التلقائي", message: "تم إنشاء نسخة احتياطية من قاعدة البيانات بنجاح يوم أمس الساعة 2:00 صباحاً.", type: "success", date: "منذ 14 ساعة", isRead: false },
    { id: "s3", title: "محاولة دخول فاشلة", message: "تم رصد 5 محاولات دخول فاشلة متتالية لحساب مدير النظام من عنوان IP غير مألوف.", type: "warning", date: "أمس", isRead: true },
    { id: "s4", title: "انتهاء صلاحية اشتراك", message: "اشتراك المدرسة في خدمة الرسائل القصيرة (SMS) سينتهي خلال 3 أيام. يرجى التجديد لتجنب انقطاع الخدمة.", type: "warning", date: "قبل يومين", isRead: true },
    { id: "s5", title: "اعتماد مسير الرواتب", message: "تم اعتماد مسير رواتب شهر أغسطس وترحيله للقسم المالي بنجاح.", type: "success", date: "قبل 5 أيام", isRead: true },
  ]);

  const dynamicNotifications = useMemo(() => {
    const generated = [];
    const studentsWithoutSection = allStudents.filter(s => !s.sectionId && !s.isDeleted).length;
    if (studentsWithoutSection > 0) {
      generated.push({ id: "dyn-1", title: "طلاب بلا شعب", message: `يوجد ${studentsWithoutSection} طالب يحتاج استكمال ربط الشعبة لضمان دقة الرسوم والدرجات.`, type: "warning", date: "الآن", isRead: false, actionLink: "/students", actionLabel: "مراجعة الطلاب" });
    }

    const staffWithoutContract = allStaff.filter(s => !s.basicSalary && !s.isDeleted).length;
    if (staffWithoutContract > 0) {
      generated.push({ id: "dyn-2", title: "موظفون بلا رواتب", message: `يوجد ${staffWithoutContract} موظف لم يتم تحديد راتبهم الأساسي، مما يؤثر على مسير الرواتب.`, type: "danger", date: "الآن", isRead: false, actionLink: "/hr/staff", actionLabel: "إدارة الموظفين" });
    }

    const lateInvoices = allInvoices.filter(inv => inv.status !== "paid" && new Date(inv.dueDate) < new Date()).length;
    if (lateInvoices > 0) {
      generated.push({ id: "dyn-3", title: "فواتير متأخرة الدفع", message: `يوجد ${lateInvoices} فاتورة تجاوزت تاريخ الاستحقاق ولم تسدد بالكامل.`, type: "warning", date: "الآن", isRead: false, actionLink: "/finance/invoices", actionLabel: "مراجعة الفواتير" });
    }

    const pendingLeaves = allStaffLeaves.filter(leave => leave.status === "pending").length;
    if (pendingLeaves > 0) {
      generated.push({ id: "dyn-4", title: "إجازات معلقة", message: `يوجد ${pendingLeaves} طلب إجازة في انتظار قرار الإدارة.`, type: "info", date: "الآن", isRead: false, actionLink: "/hr/leaves", actionLabel: "اعتماد الإجازات" });
    }
    return generated;
  }, [allStudents, allStaff, allInvoices, allStaffLeaves]);

  // Combine dynamic and static
  const allNotifications = useMemo(() => {
    // Prevent dynamic notifications from being marked as "read" forever if the issue still exists.
    // They are always unread unless we hide them by solving the issue.
    return [...dynamicNotifications, ...staticNotifications];
  }, [dynamicNotifications, staticNotifications]);

  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");

  const filtered = useMemo(() => {
    const term = q.trim();
    return allNotifications.filter(item => {
      // Dynamic notifications are treated as info/warning/danger
      let mappedType = item.type;
      if (mappedType === "danger") mappedType = "warning"; // just for filtering simplicity if we only have warning filter

      if (typeFilter !== "all" && item.type !== typeFilter && !(typeFilter === "warning" && item.type === "danger")) return false;
      if (readFilter === "unread" && item.isRead) return false;
      if (readFilter === "read" && !item.isRead) return false;
      if (!term) return true;
      return item.title.includes(term) || item.message.includes(term);
    });
  }, [allNotifications, q, readFilter, typeFilter]);

  const unreadCount = allNotifications.filter(item => !item.isRead).length;

  const markAllRead = () => {
    setStaticNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
    toast.success("تم تعليم التنبيهات كمقروءة (التنبيهات الحية تظل نشطة حتى تُحل)");
  };

  const markRead = (id: string) => {
    if (id.startsWith("dyn-")) return; // Cannot mark dynamic as read without solving
    setStaticNotifications(prev => prev.map(item => item.id === id ? { ...item, isRead: true } : item));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "warning":
      case "danger": return <AlertCircle className={`h-5 w-5 ${type === 'danger' ? 'text-danger' : 'text-warning'}`} />;
      default: return <Info className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الإدارة العامة" }, { label: "إشعارات النظام" }]}
      actions={
        <div className="flex gap-2">
           <button onClick={markAllRead} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-bold hover:bg-accent">
            <CheckCircle2 className="h-4 w-4" /> تحديد الكل كمقروء
          </button>
           <Link to="/settings" className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-bold hover:bg-accent">
            <Settings className="h-4 w-4" /> إعدادات الإشعارات
           </Link>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl relative">
            <BellRing className="h-6 w-6" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">{unreadCount}</span>}
          </div>
          <div>
            <h1 className="text-2xl font-black">إشعارات وتنبيهات النظام الذكية</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">متابعة الإشعارات ومؤشرات صحة البيانات المتولدة تلقائياً</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={event => setQ(event.target.value)} placeholder="بحث في التنبيهات..." className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
            </div>
            <select value={typeFilter} onChange={event => setTypeFilter(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold">
              <option value="all">كل الأنواع</option>
              <option value="info">معلومات</option>
              <option value="success">نجاح</option>
              <option value="warning">تحذير/تنبيه</option>
            </select>
            <select value={readFilter} onChange={event => setReadFilter(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold">
              <option value="all">كل الحالات</option>
              <option value="unread">غير مقروء</option>
              <option value="read">مقروء</option>
            </select>
          </div>
        </div>

        <PageCard className="p-0">
          <div className="divide-y divide-border">
            {filtered.map((n: any) => (
              <div key={n.id} onClick={() => markRead(n.id)} className={`w-full p-5 flex items-start gap-4 text-right transition-colors ${!n.id.toString().startsWith("dyn") && "cursor-pointer hover:bg-accent/30"} ${n.isRead ? 'opacity-70' : 'bg-primary/5'}`}>
                <div className={`mt-0.5 rounded-full p-1.5 shrink-0 ${n.type === 'success' ? 'bg-success/10' : n.type === 'warning' ? 'bg-warning/10' : n.type === 'danger' ? 'bg-danger/10' : 'bg-primary/10'}`}>
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 justify-between mb-1">
                    <h3 className={`font-bold ${!n.isRead ? (n.type === 'danger' ? 'text-danger' : n.type === 'warning' ? 'text-warning-foreground' : 'text-foreground') : 'text-muted-foreground'}`}>
                      {n.title}
                      {!n.isRead && <span className={`mr-2 inline-block h-2 w-2 rounded-full ${n.type === 'danger' ? 'bg-danger' : n.type === 'warning' ? 'bg-warning' : 'bg-primary'}`}></span>}
                      {n.id.toString().startsWith("dyn-") && <Badge tone="primary" className="mr-2 text-[10px]">مباشر</Badge>}
                    </h3>
                    <span className="text-xs text-muted-foreground tabular font-medium">{n.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{n.message}</p>
                  
                  {n.actionLink && (
                    <div className="mt-3">
                      <Link to={n.actionLink} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                        <ArrowLeft className="h-3 w-3" /> {n.actionLabel}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">لا توجد تنبيهات مطابقة للفلاتر.</div>}
          </div>
        </PageCard>
      </div>
    </AppShell>
  );
}
