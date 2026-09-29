import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { AdminModal } from "@/components/admin/admin-modal";
import {
  BellRing,
  CheckCircle2,
  AlertCircle,
  Info,
  Settings,
  Search,
  ArrowLeft,
  X,
  Trash2,
  ChevronLeft,
  Filter,
  Eye,
  EyeOff,
  Clock,
  Zap,
  Send,
  Plus,
  Radio,
  Users,
  MessageSquare,
  Smartphone,
  ShieldAlert,
  Check,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({ meta: [{ title: "مركز التنبيهات والإشعارات الذكية | منصة مدارس" }] }),
  component: NotificationsPage,
});

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "danger";
  date: string;
  isRead: boolean;
  priority: "عادية" | "متوسطة" | "مرتفعة" | "طارئة";
  targetAudience: string;
  actionLink?: string;
  actionLabel?: string;
}

const DEFAULT_STATIC_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif_1",
    title: "تحديث أمني للنظام متوفر (v2.4)",
    message: "يتوفر تحديث جديد للمنصة يتضمن تحسينات في مصفوفة الصلاحيات وتشديد التحقق من الجلسات.",
    type: "info",
    date: "منذ ساعتين",
    isRead: false,
    priority: "عادية",
    targetAudience: "كافة المستخدمين",
  },
  {
    id: "notif_2",
    title: "النسخ الاحتياطي التلقائي اليومي",
    message: "تم إنشاء نسخة احتياطية من قاعدة البيانات بنجاح في الساعة 2:00 صباحاً مع التحقق من تماسك كافة الجداول.",
    type: "success",
    date: "منذ 14 ساعة",
    isRead: false,
    priority: "عادية",
    targetAudience: "مدراء النظام",
  },
  {
    id: "notif_3",
    title: "تنبيه أمني: رصد محاولات تسجيل دخول غير مألوفة",
    message: "تم رصد محاولات دخول متكررة غير ناجحة لحساب إداري من عنوان IP غير مسجل مسبقاً، وتم تأمين الحساب مؤقتاً.",
    type: "danger",
    date: "أمس",
    isRead: true,
    priority: "طارئة",
    targetAudience: "الأمن السيبراني",
  },
  {
    id: "notif_4",
    title: "رصيد رسائل SMS يقترب من الحد الأدنى",
    message: "رصيد باقة الرسائل النصية المتبقي أقل من 400 رسالة، يرجى التغذية لتجنب توقف إشعارات أولياء الأمور.",
    type: "warning",
    date: "قبل يومين",
    isRead: true,
    priority: "مرتفعة",
    targetAudience: "الإدارة والمالية",
  },
  {
    id: "notif_5",
    title: "اعتماد مسير الرواتب الشهري",
    message: "تم اعتماد مسير رواتب الشهر وترحيله للمصادقة البنكية بنجاح دون أي ملاحظات محاسبية.",
    type: "success",
    date: "قبل 4 أيام",
    isRead: true,
    priority: "عادية",
    targetAudience: "الموارد البشرية",
  },
];

const NOTIFICATIONS_STORAGE_KEY = "darasi_system_notifications_v2";

function NotificationsPage() {
  const {
    allStudents,
    allStaff,
    allInvoices,
    allStaffLeaves,
    allStaffContracts,
    addActivityLog,
  } = useGlobalStore();

  const [staticNotifications, setStaticNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      /* ignore */
    }
    return DEFAULT_STATIC_NOTIFICATIONS;
  });

  const saveStaticNotifications = (list: NotificationItem[]) => {
    setStaticNotifications(list);
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  // Real Dynamic Notifications derived from school database state
  const dynamicNotifications = useMemo<NotificationItem[]>(() => {
    const generated: NotificationItem[] = [];

    const studentsWithoutSection = allStudents.filter((s) => !s.sectionId && !s.isDeleted).length;
    if (studentsWithoutSection > 0) {
      generated.push({
        id: "dyn-1",
        title: "طلاب بلا شعب دراسية مسجلة",
        message: `يوجد ${studentsWithoutSection} طالب يحتاج استكمال ربط الشعبة لضمان دقة الرسوم والدرجات وجدول الحصص.`,
        type: "warning",
        date: "الآن",
        isRead: false,
        actionLink: "/students",
        actionLabel: "مراجعة شؤون الطلاب",
        priority: "مرتفعة",
        targetAudience: "القبول والتسجيل",
      });
    }

    const staffWithoutContract = allStaff.filter((s) => !s.basicSalary && !s.isDeleted).length;
    if (staffWithoutContract > 0) {
      generated.push({
        id: "dyn-2",
        title: "موظفون بلا رواتب أو عقود مالية محددة",
        message: `يوجد ${staffWithoutContract} موظف لم يتم تحديد راتبهم الأساسي، مما يؤثر على دقة مسير الرواتب.`,
        type: "danger",
        date: "الآن",
        isRead: false,
        actionLink: "/hr/staff",
        actionLabel: "إدارة شؤون الموظفين",
        priority: "طارئة",
        targetAudience: "الموارد البشرية",
      });
    }

    const lateInvoices = allInvoices.filter(
      (inv) => inv.status !== "paid" && new Date(inv.dueDate) < new Date()
    ).length;
    if (lateInvoices > 0) {
      generated.push({
        id: "dyn-3",
        title: "فواتير رسوم متأخرة السداد",
        message: `يوجد ${lateInvoices} فاتورة تجاوزت تاريخ الاستحقاق ولم تسدد بالكامل بعد، يلزم إرسال إشعارات مطالبة.`,
        type: "warning",
        date: "الآن",
        isRead: false,
        actionLink: "/finance/students",
        actionLabel: "مراجعة فواتير الرسوم",
        priority: "مرتفعة",
        targetAudience: "الحسابات والمالية",
      });
    }

    const pendingLeaves = allStaffLeaves.filter((leave) => leave.status === "pending").length;
    if (pendingLeaves > 0) {
      generated.push({
        id: "dyn-4",
        title: "طلبات إجازات معلقة في الانتظار",
        message: `يوجد ${pendingLeaves} طلب إجازة في انتظار قرار ومصادقة الإدارة المدرسية.`,
        type: "info",
        date: "الآن",
        isRead: false,
        actionLink: "/hr/leaves",
        actionLabel: "اعتماد الإجازات",
        priority: "عادية",
        targetAudience: "إدارة الموظفين",
      });
    }

    const expiringContracts = (allStaffContracts || []).filter((c) => {
      const diff = (new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diff > 0 && diff < 30;
    }).length;
    if (expiringContracts > 0) {
      generated.push({
        id: "dyn-5",
        title: "عقود موظفين تشارف على الانتهاء",
        message: `يوجد ${expiringContracts} عقد ينتهي خلال 30 يوماً ويحتاج إلى تجديد أو مراجعة إدارية.`,
        type: "warning",
        date: "الآن",
        isRead: false,
        actionLink: "/hr/contracts",
        actionLabel: "مراجعة العقود",
        priority: "مرتفعة",
        targetAudience: "الموارد البشرية",
      });
    }

    return generated;
  }, [allStudents, allStaff, allInvoices, allStaffLeaves, allStaffContracts]);

  const allNotifications = useMemo(
    () => [...dynamicNotifications, ...staticNotifications],
    [dynamicNotifications, staticNotifications]
  );

  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [detailNotif, setDetailNotif] = useState<NotificationItem | null>(null);
  const [deleteConfirmNotif, setDeleteConfirmNotif] = useState<NotificationItem | null>(null);

  // Broadcast modal state
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    message: "",
    targetAudience: "جميع منسوبي المدرسة",
    type: "info" as "info" | "warning" | "success" | "danger",
    priority: "عادية" as "عادية" | "متوسطة" | "مرتفعة" | "طارئة",
    channels: {
      inApp: true,
      whatsapp: false,
      sms: false,
    },
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return allNotifications.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (readFilter === "unread" && item.isRead) return false;
      if (readFilter === "read" && !item.isRead) return false;
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;

      if (!term) return true;
      return (
        item.title.toLowerCase().includes(term) ||
        item.message.toLowerCase().includes(term) ||
        item.targetAudience.toLowerCase().includes(term)
      );
    });
  }, [allNotifications, q, readFilter, typeFilter, priorityFilter]);

  const unreadCount = allNotifications.filter((item) => !item.isRead).length;

  const markAllRead = () => {
    const updated = staticNotifications.map((item) => ({ ...item, isRead: true }));
    saveStaticNotifications(updated);
    toast.success("تم تحديد التنبيهات كمقروءة (المؤشرات الحية تظل نشطة حتى معالجة أسبابها)");
  };

  const markRead = (id: string) => {
    if (id.startsWith("dyn-")) return;
    const updated = staticNotifications.map((item) =>
      item.id === id ? { ...item, isRead: true } : item
    );
    saveStaticNotifications(updated);
  };

  const handleDeleteNotification = () => {
    if (!deleteConfirmNotif) return;
    if (deleteConfirmNotif.id.startsWith("dyn-")) {
      toast.error(
        "لا يمكن حذف المؤشرات التلقائية الذكية يدوياً، قم بمعالجة سبب التنبيه في قسمه لإزالته تلقائياً."
      );
      setDeleteConfirmNotif(null);
      return;
    }
    const updated = staticNotifications.filter((item) => item.id !== deleteConfirmNotif.id);
    saveStaticNotifications(updated);
    toast.success("تم حذف التنبيه من السجل بنجاح");
    setDeleteConfirmNotif(null);
  };

  const handleSendBroadcast = () => {
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      toast.error("يرجى ملء عنوان ونص التنبيه");
      return;
    }

    const newNotif: NotificationItem = {
      id: `bc_${Date.now()}`,
      title: broadcastForm.title.trim(),
      message: broadcastForm.message.trim(),
      type: broadcastForm.type,
      date: "الآن",
      isRead: false,
      priority: broadcastForm.priority,
      targetAudience: broadcastForm.targetAudience,
    };

    const updated = [newNotif, ...staticNotifications];
    saveStaticNotifications(updated);

    addActivityLog({
      user: "مدير النظام",
      action: "بث تعميم إداري",
      entity: "مركز الإشعارات",
      details: `تم بث إشعار "${newNotif.title}" إلى: ${newNotif.targetAudience}`,
    });

    setBroadcastModal(false);
    setBroadcastForm({
      title: "",
      message: "",
      targetAudience: "جميع منسوبي المدرسة",
      type: "info",
      priority: "عادية",
      channels: { inApp: true, whatsapp: false, sms: false },
    });

    toast.success("تم بث التنبيه الإداري لجميع المستخدمين المستهدفين بنجاح");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case "danger":
        return <AlertCircle className="h-5 w-5 text-danger" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case "success":
        return "bg-success/10 border-success/20";
      case "warning":
        return "bg-amber-500/10 border-amber-500/20";
      case "danger":
        return "bg-danger/10 border-danger/20";
      default:
        return "bg-primary/10 border-primary/20";
    }
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الإدارة والنظام" },
        { label: "مركز الإشعارات والتعاميم" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold hover:bg-accent transition-colors shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" /> تحديد الكل كمقروء
            </button>
          )}
          <button
            onClick={() => setBroadcastModal(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all glow-primary"
          >
            <Send className="h-4 w-4" /> بث تعميم إداري
          </button>
        </div>
      }
    >
      <div className="space-y-5" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary p-3.5 rounded-2xl shadow-inner border border-primary/20 relative">
              <BellRing className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-black text-white shadow-sm animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black">مركز التنبيهات والإشعارات الذكية</h1>
              <p className="text-xs font-bold text-muted-foreground mt-1">
                رصد فوري لسلامة البيانات، بث التعاميم الإدارية، والتنبيه التلقائي للمشاكل المعلقة
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BellRing className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-muted-foreground">إجمالي التنبيهات</span>
            </div>
            <div className="text-2xl font-black text-foreground tabular-nums">
              {allNotifications.length}
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-danger/10 text-danger flex items-center justify-center">
                <AlertCircle className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-muted-foreground">غير مقروء</span>
            </div>
            <div className="text-2xl font-black text-danger tabular-nums">{unreadCount}</div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-muted-foreground">مؤشرات حية نشطة</span>
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {dynamicNotifications.length}
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-success/10 text-success flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-muted-foreground">تعاميم معتمدة</span>
            </div>
            <div className="text-2xl font-black text-success tabular-nums">
              {staticNotifications.length}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="rounded-2xl border border-border/60 bg-card p-3 shadow-xs">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="البحث في نص الإشعار، العنوان، أو الفئة..."
                className="h-10 w-full rounded-xl border border-input bg-background/80 ps-9 pe-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">كافة التصنيفات (تنبيه، حرج، نجاح، معلومات)</option>
              <option value="danger">حرجة وطارئة فقط</option>
              <option value="warning">تنبيهات فقط</option>
              <option value="success">إشعارات نجاح</option>
              <option value="info">إشعارات عامة</option>
            </select>

            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">كل الحالات (مقروء وغير مقروء)</option>
              <option value="unread">غير المقروءة فقط</option>
              <option value="read">المقروءة فقط</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">كل مستويات الأهمية</option>
              <option value="طارئة">طارئة</option>
              <option value="مرتفعة">مرتفعة</option>
              <option value="متوسطة">متوسطة</option>
              <option value="عادية">عادية</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <PageCard title="قائمة الإشعارات والتنبيهات المعتمدة">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4">
              <BellRing className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-black text-sm text-foreground">لا توجد تنبيهات مطابقة لمعايير البحث</p>
              <p className="text-xs text-muted-foreground mt-1">
                يمكنك إعادة تعيين خيارات التصفية أو بث إشعار إداري جديد
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => {
                const isDynamic = item.id.startsWith("dyn-");
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      markRead(item.id);
                      setDetailNotif(item);
                    }}
                    className={`flex items-start justify-between p-4 border rounded-2xl transition-all cursor-pointer group hover:shadow-md ${
                      !item.isRead
                        ? "bg-card border-primary/40 shadow-xs"
                        : "bg-muted/15 border-border/70 opacity-90"
                    }`}
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="p-2.5 rounded-2xl bg-card border border-border/70 shadow-xs shrink-0 mt-0.5">
                        {getIcon(item.type)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3
                            className={`font-black text-xs ${
                              !item.isRead ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {item.title}
                          </h3>
                          {isDynamic && (
                            <span className="text-[10px] font-black text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Zap className="h-2.5 w-2.5" /> مؤشر حي
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.priority === "طارئة"
                                ? "bg-danger/10 text-danger font-black"
                                : item.priority === "مرتفعة"
                                ? "bg-amber-500/10 text-amber-600 font-bold"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">
                          {item.message}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-bold flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {item.date}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {item.targetAudience}
                          </span>

                          {item.actionLink && (
                            <Link
                              to={item.actionLink}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-primary hover:underline font-black ms-2"
                            >
                              <ChevronLeft className="h-3 w-3" /> {item.actionLabel || "الانتقال للمعالجة"}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 ms-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead(item.id);
                          setDetailNotif(item);
                        }}
                        className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                        title="عرض التفاصيل"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {!isDynamic && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmNotif(item);
                          }}
                          className="p-2 rounded-xl hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors"
                          title="حذف الإشعار"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </PageCard>
      </div>

      {/* ────── Modal: Broadcast Notification ────── */}
      <AdminModal
        isOpen={broadcastModal}
        onClose={() => setBroadcastModal(false)}
        title="بث تعميم وإشعار إداري جديد"
        description="إرسال تعاميم لمنسوبي المدرسة أو أولياء الأمور عبر المنصة والرسائل"
        icon={Send}
        tone={broadcastForm.type === "danger" ? "danger" : broadcastForm.type === "warning" ? "amber" : "primary"}
        maxWidth="lg"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setBroadcastModal(false)}
              className="rounded-xl px-5 py-2 font-bold border border-input hover:bg-accent transition-colors text-xs"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSendBroadcast}
              className="rounded-xl bg-primary px-6 py-2 font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md glow-primary flex items-center gap-2 text-xs"
            >
              <Send className="h-4 w-4" /> بث الإشعار الآن
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-foreground">
              عنوان الإشعار <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={broadcastForm.title}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
              placeholder="مثال: موعد الاجتماع الدوري لأولياء الأمور..."
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-foreground">
              نص التعميم والرسالة <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={3}
              value={broadcastForm.message}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
              placeholder="اكتب تفاصيل التنبيه أو التعميم بوضوح..."
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs font-bold outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-foreground">الفئة المستهدفة</label>
              <select
                value={broadcastForm.targetAudience}
                onChange={(e) =>
                  setBroadcastForm({ ...broadcastForm, targetAudience: e.target.value })
                }
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
              >
                <option value="جميع منسوبي المدرسة">جميع منسوبي المدرسة</option>
                <option value="المعلمين فقط">المعلمين فقط</option>
                <option value="أولياء الأمور فقط">أولياء الأمور فقط</option>
                <option value="الطلاب فقط">الطلاب فقط</option>
                <option value="الإدارة والمالية">الإدارة والمالية فقط</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">درجة الأهمية</label>
              <select
                value={broadcastForm.priority}
                onChange={(e) =>
                  setBroadcastForm({ ...broadcastForm, priority: e.target.value as any })
                }
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
              >
                <option value="عادية">عادية</option>
                <option value="متوسطة">متوسطة</option>
                <option value="مرتفعة">مرتفعة</option>
                <option value="طارئة">طارئة / هامة جداً</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-foreground">طبيعة وتصنيف الإشعار</label>
            <select
              value={broadcastForm.type}
              onChange={(e) =>
                setBroadcastForm({ ...broadcastForm, type: e.target.value as any })
              }
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold outline-none focus:border-primary cursor-pointer"
            >
              <option value="info">إشعار معلوماتي عام (أزرق)</option>
              <option value="warning">تنبيه تحذيري (برتقالي)</option>
              <option value="success">إشعار نجاح أو اعتماد (أخضر)</option>
              <option value="danger">تنبيه أمني أو طارئ (أحمر)</option>
            </select>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 space-y-2">
            <span className="font-bold text-foreground block">قنوات الإرسال المحددة:</span>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={broadcastForm.channels.inApp}
                  onChange={(e) =>
                    setBroadcastForm({
                      ...broadcastForm,
                      channels: { ...broadcastForm.channels, inApp: e.target.checked },
                    })
                  }
                  className="rounded border-input text-primary"
                />
                <span>إشعار بالمنصة (فوري)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={broadcastForm.channels.whatsapp}
                  onChange={(e) =>
                    setBroadcastForm({
                      ...broadcastForm,
                      channels: { ...broadcastForm.channels, whatsapp: e.target.checked },
                    })
                  }
                  className="rounded border-input text-primary"
                />
                <span>رسالة واتساب (WhatsApp)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={broadcastForm.channels.sms}
                  onChange={(e) =>
                    setBroadcastForm({
                      ...broadcastForm,
                      channels: { ...broadcastForm.channels, sms: e.target.checked },
                    })
                  }
                  className="rounded border-input text-primary"
                />
                <span>رسائل نصية (SMS)</span>
              </label>
            </div>
          </div>
        </div>
      </AdminModal>

      {/* ────── Modal: Notification Detail ────── */}
      <AdminModal
        isOpen={Boolean(detailNotif)}
        onClose={() => setDetailNotif(null)}
        title={detailNotif?.title || ""}
        description={detailNotif ? `${detailNotif.date} • ${detailNotif.targetAudience || "الجميع"}` : ""}
        icon={
          detailNotif?.type === "danger"
            ? ShieldAlert
            : detailNotif?.type === "warning"
            ? AlertCircle
            : detailNotif?.type === "success"
            ? CheckCircle2
            : Info
        }
        tone={
          detailNotif?.type === "danger"
            ? "danger"
            : detailNotif?.type === "warning"
            ? "amber"
            : detailNotif?.type === "success"
            ? "success"
            : "primary"
        }
        maxWidth="md"
        footer={
          detailNotif && (
            <div className="flex gap-2.5 w-full">
              {detailNotif.actionLink ? (
                <Link
                  to={detailNotif.actionLink}
                  onClick={() => setDetailNotif(null)}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md glow-primary inline-flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />{" "}
                  {detailNotif.actionLabel || "الانتقال لمعالجة السبب"}
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => setDetailNotif(null)}
                className="rounded-xl px-5 py-2.5 text-xs font-bold border border-input hover:bg-accent transition-colors shrink-0"
              >
                إغلاق
              </button>
            </div>
          )
        }
      >
        {detailNotif && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-muted/20 border border-border/60 text-foreground text-xs font-medium leading-relaxed">
              {detailNotif.message}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-muted-foreground block mb-0.5">التصنيف:</span>
                <span className="font-black text-foreground">
                  {detailNotif.type === "success"
                    ? "إشعار نجاح"
                    : detailNotif.type === "danger"
                    ? "حرج / طارئ"
                    : detailNotif.type === "warning"
                    ? "تنبيه تشغيلي"
                    : "معلومات عامة"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-muted-foreground block mb-0.5">الفئة المستهدفة:</span>
                <span className="font-black text-foreground">
                  {detailNotif.targetAudience || "الجميع"}
                </span>
              </div>
            </div>
          </div>
        )}
      </AdminModal>

      {/* ────── Modal: Delete Confirmation ────── */}
      <AdminModal
        isOpen={Boolean(deleteConfirmNotif)}
        onClose={() => setDeleteConfirmNotif(null)}
        title="حذف التنبيه"
        description="إزالة التنبيه نهائياً من سجل المنصة"
        icon={Trash2}
        tone="danger"
        maxWidth="sm"
        footer={
          <div className="flex gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setDeleteConfirmNotif(null)}
              className="flex-1 h-10 rounded-xl border border-input text-xs font-bold hover:bg-accent transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleDeleteNotification}
              className="flex-1 h-10 rounded-xl bg-danger text-xs font-black text-white hover:bg-danger/90 transition-all shadow-md"
            >
              تأكيد الحذف
            </button>
          </div>
        }
      >
        {deleteConfirmNotif && (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground leading-relaxed font-bold">
              هل أنت متأكد من حذف تنبيه{" "}
              <strong className="text-foreground">"{deleteConfirmNotif.title}"</strong> من السجل؟
            </p>
          </div>
        )}
      </AdminModal>
    </AppShell>
  );
}
