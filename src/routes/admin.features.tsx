import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import {
  SlidersHorizontal,
  Bus,
  BookOpen,
  Stethoscope,
  Building,
  Layers,
  Users,
  GraduationCap,
  Banknote,
  UserPlus,
  HeartHandshake,
  Smartphone,
  MessageSquare,
  Send,
  CreditCard,
  QrCode,
  Globe,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Check,
  RefreshCcw,
  Zap,
  Info,
  ExternalLink,
  Download,
  Copy,
  Sliders,
  Settings,
  ShieldAlert,
  ArrowRight,
  Shield,
  Layers3,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGlobalStore,
  SystemFeatures,
  defaultFeatures,
} from "@/contexts/GlobalStoreContext";
import { Switch } from "@/components/ui/switch";
import { AdminModal } from "@/components/admin/admin-modal";

export const Route = createFileRoute("/admin/features")({
  head: () => ({ meta: [{ title: "التحكم بميزات النظام والوحدات التشغيلية | منصة مدارس" }] }),
  component: AdminFeaturesPage,
});

interface FeatureItem {
  key: keyof SystemFeatures;
  title: string;
  category: "operational" | "apps" | "tech";
  categoryLabel: string;
  desc: string;
  icon: any;
  tone: "primary" | "success" | "warning" | "purple" | "info" | "amber";
  route?: string;
  routeLabel?: string;
  dependencies?: string[];
  roles?: string[];
}

const ALL_FEATURES: FeatureItem[] = [
  // 1. Operational Modules
  {
    key: "transport",
    title: "النقل المدرسي والحافلات",
    category: "operational",
    categoryLabel: "الوحدات التشغيلية",
    desc: "إدارة مسارات الحافلات، السائقين، المشرفين، واشتراكات الطلاب مع تتبع الرحلات المدرسية اليومية.",
    icon: Bus,
    tone: "amber",
    route: "/transport/routes",
    routeLabel: "مسارات النقل",
    dependencies: ["بيانات الطلاب", "عناوين السكن"],
    roles: ["مشرف نقل", "مدير مدرسة", "ولي أمر"],
  },
  {
    key: "library",
    title: "المكتبة والمقررات المدرسية",
    category: "operational",
    categoryLabel: "الوحدات التشغيلية",
    desc: "فهرسة الكتب والكتب الدراسية، إدارة العهد والمخزون، وجدولة تسليم الكتب للطلاب مع إيصالات الاستلام.",
    icon: BookOpen,
    tone: "info",
    route: "/library/textbooks",
    routeLabel: "المقررات المدرسية",
    dependencies: ["الصفوف والشعب", "السنوات الدراسية"],
    roles: ["أمين مكتبة", "معلم", "مدير مدرسة"],
  },
  {
    key: "clinic",
    title: "العيادة الطبية والرعاية الصحية",
    category: "operational",
    categoryLabel: "الوحدات التشغيلية",
    desc: "الملف الصحي الشامل للطلاب، سجل الأمراض المزمنة، الحساسية، والزيارات الطبية مع إدارة الأدوية الطارئة.",
    icon: Stethoscope,
    tone: "success",
    route: "/clinic/visits",
    routeLabel: "العيادة والزيارات",
    dependencies: ["ملفات الطلاب", "بيانات الطوارئ"],
    roles: ["طبيب المدرسة", "مشرف صحي", "مدير مدرسة"],
  },
  {
    key: "facilities",
    title: "إدارة المرافق والمباني والصيانة",
    category: "operational",
    categoryLabel: "الوحدات التشغيلية",
    desc: "حصر المباني، القاعات الدراسية، المعامل، ومتابعة بلاغات الصيانة الوقائية والطارئة مع جداول الإشغال.",
    icon: Building,
    tone: "primary",
    route: "/facilities/dashboard",
    routeLabel: "إحصاءات المرافق",
    dependencies: ["هيكل المباني", "فصول المدرسة"],
    roles: ["مسؤول الصيانة", "مدير مدرسة", "إداري"],
  },
  {
    key: "inventory",
    title: "المستودعات والعهد المدرسية",
    category: "operational",
    categoryLabel: "الوحدات التشغيلية",
    desc: "إدارة الأصناف، حركات الإدخال والإخراج، صرف العهد للمعلمين والأقسام، وجرد الأصول الدورية.",
    icon: Layers,
    tone: "purple",
    route: "/inventory/items",
    routeLabel: "المستودعات والأصناف",
    dependencies: ["مراكز التكلفة", "سجل الموظفين"],
    roles: ["أمين مستودع", "محاسب", "مدير مدرسة"],
  },
  {
    key: "hrPayroll",
    title: "الموارد البشرية ومسير الرواتب",
    category: "operational",
    categoryLabel: "الوحدات التشغيلية",
    desc: "ملفات المعلمين والموظفين، العقود، الإجازات، تقييم الأداء KPIs، وإعداد مسير الرواتب والبدلات والاستقطاعات.",
    icon: Users,
    tone: "info",
    route: "/hr/payroll",
    routeLabel: "مسير الرواتب",
    dependencies: ["الحسابات البنكية", "حضور وانصراف الموظفين"],
    roles: ["مدير موارد بشرية", "محاسب مالي", "مدير عام"],
  },
  {
    key: "examsReports",
    title: "الاختبارات والشهادات والتقارير",
    category: "operational",
    categoryLabel: "الوحدات التشغيلية",
    desc: "جدولة الامتحانات، رصد الدرجات وأعمال السنة، حساب المعدلات، استخراج كشوف الدرجات والشهادات الرسمية للطباعة.",
    icon: GraduationCap,
    tone: "primary",
    route: "/exams",
    routeLabel: "جدول الاختبارات",
    dependencies: ["المناهج والصفوف", "توزيع الحصص"],
    roles: ["معلم", "وكيل شؤون تعليمية", "مدير مدرسة"],
  },
  {
    key: "financeInvoicing",
    title: "المركز المالي والرسوم وسندات القبض",
    category: "operational",
    categoryLabel: "الوحدات التشغيلية",
    desc: "الرسوم المدرسية، الفواتير، جداول الأقساط، الخصومات والمنح، سندات القبض والصرف، وتقارير الحسابات الختامية.",
    icon: Banknote,
    tone: "success",
    route: "/finance",
    routeLabel: "اللوحة المالية",
    dependencies: ["الدليل المحاسبي", "الحسابات البنكية"],
    roles: ["مدير مالي", "محاسب", "كاشير الخزينة"],
  },
  {
    key: "admissionRegistration",
    title: "بوابة القبول والتسجيل الإلكتروني",
    category: "operational",
    categoryLabel: "الوحدات التشغيلية",
    desc: "استقبال طلبات الالتحاق الجديدة إلكترونياً، المقابلات الشخصية، فحص الوثائق والمصادقة على القبول.",
    icon: UserPlus,
    tone: "purple",
    route: "/students",
    routeLabel: "شؤون الطلاب",
    dependencies: ["السنوات الدراسية", "السعة الاستيعابية"],
    roles: ["أمين تسجيل", "وكيل شؤون طلاب", "مدير مدرسة"],
  },

  // 2. Apps & Portals
  {
    key: "parentPortal",
    title: "بوابة وتطبيق ولي الأمر",
    category: "apps",
    categoryLabel: "التطبيقات وقنوات التواصل",
    desc: "بوابة تفاعلية لأولياء الأمور لمتابعة غياب وحضور الأبناء، الدرجات، الواجبات، ودفع الرسوم عبر الهاتف.",
    icon: HeartHandshake,
    tone: "success",
    route: "/guardians",
    routeLabel: "أولياء الأمور",
    dependencies: ["بيانات الطلاب", "أرقام الهواتف"],
    roles: ["ولي أمر", "مدير مدرسة"],
  },
  {
    key: "teacherApp",
    title: "تطبيق المعلم ورصد الحضور اللحظي",
    category: "apps",
    categoryLabel: "التطبيقات وقنوات التواصل",
    desc: "واجهة سريعة للمعلمين لرصد حضور الحصص، تقييم السلوك، إسناد الواجبات، والتواصل مع الإدارة.",
    icon: Smartphone,
    tone: "info",
    route: "/attendance/take",
    routeLabel: "رصد الحضور بالحصص",
    dependencies: ["الجدول الدراسي", "قوائم الطلاب"],
    roles: ["معلم", "مشرف أكاديمي"],
  },
  {
    key: "smsAlerts",
    title: "تنبيهات الرسائل النصية القصيرة SMS",
    category: "apps",
    categoryLabel: "التطبيقات وقنوات التواصل",
    desc: "إرسال رسائل نصية آلية لأولياء الأمور عند الغياب، التأخر الصباحي، صدور النتائج، ومواعيد السداد.",
    icon: MessageSquare,
    tone: "amber",
    route: "/settings",
    routeLabel: "ضبط البوابة",
    dependencies: ["بوابة إرسال SMS", "أرقام الجوال المعتمدة"],
    roles: ["مدير نظام", "مسؤول تواصل"],
  },
  {
    key: "whatsappAlerts",
    title: "إشعارات وتنبيهات واتساب الفورية",
    category: "apps",
    categoryLabel: "التطبيقات وقنوات التواصل",
    desc: "ربط رسمي عبر WhatsApp Business API لإرسال الإشعارات والتقارير الشهرية وفواتير السداد بنقرة واحدة.",
    icon: Send,
    tone: "success",
    route: "/settings",
    routeLabel: "ضبط واتساب",
    dependencies: ["حساب WhatsApp Business", "قوالب الرسائل"],
    roles: ["مدير نظام", "مسؤول تواصل"],
  },

  // 3. Tech & Security Integrations
  {
    key: "onlinePayments",
    title: "بوابات الدفع الإلكتروني (مدى / فيزا)",
    category: "tech",
    categoryLabel: "التقنيات الذكية والتكامل",
    desc: "تمكين أولياء الأمور من سداد الرسوم إلكترونياً عبر مدى، Apple Pay، والبطاقات الائتمانية مع تسوية فورية.",
    icon: CreditCard,
    tone: "primary",
    route: "/finance/students",
    routeLabel: "المالية الطلابية",
    dependencies: ["بوابة الدفع الإلكتروني", "الحساب البنكي"],
    roles: ["مدير مالي", "ولي أمر"],
  },
  {
    key: "qrVerification",
    title: "التحقق الرقمي والشهادات عبر QR Code",
    category: "tech",
    categoryLabel: "التقنيات الذكية والتكامل",
    desc: "إدراج رموز استجابة سريعة مشفرة للتحقق من صحة الشهادات، بطاقات الطلاب، وبطاقات الدخول المدرسية.",
    icon: QrCode,
    tone: "info",
    route: "/hr/staff",
    routeLabel: "بطاقات الهوية",
    dependencies: ["محرك الطباعة الرسمي", "مفتاح التشفير"],
    roles: ["وكيل شؤون طلاب", "حارس البوابة"],
  },
  {
    key: "noorIntegration",
    title: "المزامنة والربط مع نظام نور الوزاري",
    category: "tech",
    categoryLabel: "التقنيات الذكية والتكامل",
    desc: "تصدير واستيراد بيانات الطلاب، الحضور اليومي، ودرجات الاختبارات بصيغ مطابقة لمعايير وزارة التعليم.",
    icon: Globe,
    tone: "success",
    route: "/settings",
    routeLabel: "مزامنة نور",
    dependencies: ["قواعد بيانات نور", "ملفات Excel الوزارية"],
    roles: ["مدير عام", "أمين تسجيل"],
  },
  {
    key: "webhooksApi",
    title: "واجهات البرمجة والـ Webhooks المفتوحة",
    category: "tech",
    categoryLabel: "التقنيات الذكية والتكامل",
    desc: "توفير API للمطورين وأحداث Webhooks لبث التغييرات للأنظمة الخارجية كأجهزة البصمة والمنصات الخارجية.",
    icon: KeyRound,
    tone: "purple",
    route: "/settings",
    routeLabel: "مفاتيح API",
    dependencies: ["مفاتيح API الآمنة"],
    roles: ["مدير تقنية المعلومات", "مهندس النظام"],
  },
  {
    key: "twoFactorAuth",
    title: "التحقق الثنائي بخطوتين (2FA) للأمان",
    category: "tech",
    categoryLabel: "التقنيات الذكية والتكامل",
    desc: "إلزام الحسابات الإدارية والمستخدمين بتأكيد الدخول عبر رمز مؤقت OTP لحماية البيانات الحساسة من الاختراق.",
    icon: ShieldCheck,
    tone: "primary",
    route: "/admin/users",
    routeLabel: "إدارة الأمان",
    dependencies: ["تطبيق المصادقة", "بريد / هاتف المستخدم"],
    roles: ["كافة المستخدمين والإداريين"],
  },
  {
    key: "smartAnalyticsAi",
    title: "التحليلات الذكية والتنبؤ بالأداء (AI)",
    category: "tech",
    categoryLabel: "التقنيات الذكية والتكامل",
    desc: "استخدام خوارزميات ذكية للكشف المبكر عن تراجع الطلاب دراسياً، مؤشرات التسرب، وتنبؤات التدفق النقدي.",
    icon: Sparkles,
    tone: "amber",
    route: "/admin/dashboard",
    routeLabel: "لوحة المؤشرات",
    dependencies: ["سجل الدرجات التاريخي", "بيانات الحضور والتحصيل"],
    roles: ["الإدارة العليا", "المشرف الأكاديمي"],
  },
  {
    key: "trashBin",
    title: "سلة المحذوفات المركزية واسترجاع البيانات",
    category: "tech",
    categoryLabel: "التقنيات الذكية والتكامل",
    desc: "نظام أمان لمنع فقدان البيانات بحفظ السجلات المحذوفة (طلاب، موظفين، فصول) مع إمكانية استرجاعها بضغطة زر.",
    icon: Trash2,
    tone: "warning",
    route: "/settings/trash",
    routeLabel: "سلة المحذوفات",
    dependencies: ["قاعدة البيانات المركزية"],
    roles: ["مدير النظام الأعلى"],
  },
];

export function AdminFeaturesPage() {
  const { systemSettings, toggleFeature, updateFeatures, addActivityLog } = useGlobalStore();

  const currentFeatures = systemSettings.features || defaultFeatures;

  // Search and Category states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "operational" | "apps" | "tech">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");

  // Interactive Modals
  const [selectedFeatureDetail, setSelectedFeatureDetail] = useState<FeatureItem | null>(null);
  const [presetModal, setPresetModal] = useState<"enterprise" | "academic" | "private" | "default" | null>(null);
  const [exportModal, setExportModal] = useState(false);

  // Statistics
  const stats = useMemo(() => {
    const total = ALL_FEATURES.length;
    const active = ALL_FEATURES.filter((f) => currentFeatures[f.key]).length;
    const disabled = total - active;
    const percent = Math.round((active / total) * 100);

    const operationalActive = ALL_FEATURES.filter((f) => f.category === "operational" && currentFeatures[f.key]).length;
    const appsActive = ALL_FEATURES.filter((f) => f.category === "apps" && currentFeatures[f.key]).length;
    const techActive = ALL_FEATURES.filter((f) => f.category === "tech" && currentFeatures[f.key]).length;

    return {
      total,
      active,
      disabled,
      percent,
      operationalActive,
      appsActive,
      techActive,
    };
  }, [currentFeatures]);

  // Filtered Features
  const filteredFeatures = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return ALL_FEATURES.filter((f) => {
      if (selectedCategory !== "all" && f.category !== selectedCategory) return false;
      const isActive = currentFeatures[f.key];
      if (statusFilter === "active" && !isActive) return false;
      if (statusFilter === "disabled" && isActive) return false;

      if (!term) return true;
      return (
        f.title.toLowerCase().includes(term) ||
        f.desc.toLowerCase().includes(term) ||
        f.categoryLabel.toLowerCase().includes(term) ||
        (f.roles || []).some((r) => r.toLowerCase().includes(term))
      );
    });
  }, [searchTerm, selectedCategory, statusFilter, currentFeatures]);

  // Handle Feature Toggle
  const handleToggle = (key: keyof SystemFeatures, title: string) => {
    const nextState = !currentFeatures[key];
    toggleFeature(key, nextState);
    addActivityLog({
      user: "مدير النظام",
      action: nextState ? "تفعيل ميزة" : "تعطيل ميزة",
      entity: "التحكم بالميزات",
      details: `تم ${nextState ? "تفعيل" : "تعطيل"} ميزة: "${title}" في المنظومة`,
    });
    toast.success(`تم ${nextState ? "تفعيل" : "تعطيل"} ميزة "${title}" بنجاح`);
  };

  // Presets Application
  const handleApplyPreset = (preset: "enterprise" | "academic" | "private" | "default") => {
    if (preset === "enterprise") {
      const allActive = ALL_FEATURES.reduce((acc, f) => {
        acc[f.key] = true;
        return acc;
      }, {} as SystemFeatures);
      updateFeatures(allActive);
      addActivityLog({
        user: "مدير النظام",
        action: "تطبيق قالب الميزات",
        entity: "التحكم بالميزات",
        details: "تم تطبيق حزمة Enterprise الشاملة وتفعيل كافة الميزات الـ 20",
      });
      toast.success("تم تفعيل حزمة Enterprise الشاملة (كافة ميزات النظام نشطة)");
    } else if (preset === "academic") {
      const academicOnly: SystemFeatures = {
        transport: false,
        library: true,
        clinic: false,
        facilities: false,
        inventory: false,
        hrPayroll: true,
        examsReports: true,
        financeInvoicing: false,
        admissionRegistration: true,
        parentPortal: true,
        teacherApp: true,
        smsAlerts: false,
        whatsappAlerts: false,
        onlinePayments: false,
        qrVerification: true,
        noorIntegration: true,
        webhooksApi: false,
        twoFactorAuth: true,
        smartAnalyticsAi: true,
        trashBin: true,
      };
      updateFeatures(academicOnly);
      addActivityLog({
        user: "مدير النظام",
        action: "تطبيق قالب الميزات",
        entity: "التحكم بالميزات",
        details: "تم تطبيق الحزمة الأكاديمية المبسطة",
      });
      toast.success("تم تطبيق الحزمة الأكاديمية المبسطة");
    } else if (preset === "private") {
      const privateSchoolPack: SystemFeatures = {
        transport: true,
        library: true,
        clinic: true,
        facilities: true,
        inventory: true,
        hrPayroll: true,
        examsReports: true,
        financeInvoicing: true,
        admissionRegistration: true,
        parentPortal: true,
        teacherApp: true,
        smsAlerts: true,
        whatsappAlerts: true,
        onlinePayments: true,
        qrVerification: true,
        noorIntegration: true,
        webhooksApi: false,
        twoFactorAuth: true,
        smartAnalyticsAi: true,
        trashBin: true,
      };
      updateFeatures(privateSchoolPack);
      addActivityLog({
        user: "مدير النظام",
        action: "تطبيق قالب الميزات",
        entity: "التحكم بالميزات",
        details: "تم تطبيق حزمة المدارس الأهلية والخاصة المتكاملة",
      });
      toast.success("تم تطبيق حزمة المدارس الأهلية والخاصة بنجاح");
    } else if (preset === "default") {
      updateFeatures(defaultFeatures);
      addActivityLog({
        user: "مدير النظام",
        action: "استعادة الميزات الافتراضية",
        entity: "التحكم بالميزات",
        details: "تمت استعادة التهيئة القياسية لجميع ميزات المنصة",
      });
      toast.success("تمت استعادة التهيئة القياسية الموصى بها");
    }
    setPresetModal(null);
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الإدارة والنظام", to: "/admin/dashboard" },
        { label: "التحكم بميزات النظام والوحدات التشغيلية" },
      ]}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setExportModal(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-card border border-border/70 px-3.5 text-xs font-black shadow-xs hover:bg-accent transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>تقرير حالة الميزات</span>
          </button>
          <button
            onClick={() => setPresetModal("enterprise")}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground hover:bg-primary/90 shadow-sm transition-all hover:scale-105 active:scale-95 glow-primary"
          >
            <Sparkles className="h-4 w-4" />
            <span>قوالب الضبط السريع</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6" dir="rtl">
        {/* Hero Banner & Executive Summary */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-primary/5 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-inner">
                <SlidersHorizontal className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                    مركز التحكم بميزات النظام والوحدات
                  </h1>
                  <Badge tone="primary" className="text-xs font-black">
                    20 ميزة متكاملة
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-bold leading-relaxed max-w-3xl">
                  تفعيل وتعطيل وحدات المنظومة والميزات الرقمية والتطبيقات والربط البرمجي مع تحكم لحظي ينعكس مباشرة على القائمة الجانبية والصلاحيات والأمان في المنصة كاملة.
                </p>
              </div>
            </div>

            {/* Quick Health Meter */}
            <div className="w-full lg:w-auto flex items-center gap-4 bg-muted/30 border border-border/70 p-4 rounded-2xl shrink-0">
              <div className="space-y-1 text-center sm:text-right">
                <span className="text-[11px] font-black text-muted-foreground uppercase block">
                  نسبة تفعيل الميزات
                </span>
                <div className="text-3xl font-black tabular-nums text-foreground flex items-baseline gap-1 justify-center sm:justify-start">
                  <span>{stats.percent}%</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    ({stats.active}/{stats.total})
                  </span>
                </div>
              </div>
              <div className="h-10 w-px bg-border/80 hidden sm:block" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {stats.active} ميزة نشطة
                </span>
                <span className="text-xs font-bold text-muted-foreground">
                  {stats.disabled} ميزة معطلة
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-3xl border border-border/70 bg-card p-4.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground">الوحدات التشغيلية</span>
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 grid place-items-center">
                <Building className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground tabular-nums">
              {stats.operationalActive} <span className="text-xs text-muted-foreground font-normal">/ 9 وحدات</span>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground font-bold">
              نقل، مكتبة، عيادة، مرافق، مستودعات، مالية...
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-4.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground">التطبيقات وقنوات التواصل</span>
              <div className="h-8 w-8 rounded-xl bg-info/10 text-info grid place-items-center">
                <Smartphone className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground tabular-nums">
              {stats.appsActive} <span className="text-xs text-muted-foreground font-normal">/ 4 قنوات</span>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground font-bold">
              بوابة ولي الأمر، تطبيق المعلم، واتساب، SMS
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-4.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground">التقنيات الذكية والتكامل</span>
              <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 grid place-items-center">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground tabular-nums">
              {stats.techActive} <span className="text-xs text-muted-foreground font-normal">/ 7 تقنيات</span>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground font-bold">
              دفع إلكتروني، QR، نظام نور، API، ذكاء اصطناعي
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-4.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground">جاهزية المنظومة</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {stats.percent >= 80 ? "ممتازة" : stats.percent >= 50 ? "متوسطة" : "أساسية"}
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground font-bold">
              {stats.percent >= 80 ? "المنظومة تعمل بكامل كفاءتها" : "بعض الميزات مغلقة لتبسيط العمل"}
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="rounded-3xl border border-border/70 bg-card p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث في الميزات، الصلاحيات، أو الكلمات المفتاحية..."
                className="h-10 w-full rounded-2xl border border-input bg-background/90 ps-10 pe-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-muted/40 rounded-2xl border border-border/50">
              {[
                { id: "all", label: "كافة الميزات (20)" },
                { id: "operational", label: "الوحدات التشغيلية (9)" },
                { id: "apps", label: "التطبيقات والتواصل (4)" },
                { id: "tech", label: "التقنيات والتكامل (7)" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 rounded-2xl border border-input bg-background/90 px-3 text-xs font-bold text-foreground outline-none focus:border-primary cursor-pointer w-full md:w-auto shrink-0"
            >
              <option value="all">كل الحالات (نشط ومعطل)</option>
              <option value="active">الميزات النشطة فقط ({stats.active})</option>
              <option value="disabled">الميزات المعطلة فقط ({stats.disabled})</option>
            </select>
          </div>
        </div>

        {/* Features Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFeatures.map((feature) => {
            const isEnabled = Boolean(currentFeatures[feature.key]);
            const FeatureIcon = feature.icon;

            const toneMap: Record<string, { bg: string; text: string; ring: string }> = {
              primary: { bg: "bg-primary/10", text: "text-primary", ring: "border-primary/30" },
              success: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", ring: "border-emerald-500/30" },
              warning: { bg: "bg-warning/10", text: "text-warning-foreground", ring: "border-warning/30" },
              amber: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", ring: "border-amber-500/30" },
              purple: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", ring: "border-purple-500/30" },
              info: { bg: "bg-sky-500/10", text: "text-sky-600 dark:text-sky-400", ring: "border-sky-500/30" },
            };
            const currentTone = toneMap[feature.tone] || toneMap.primary;

            return (
              <div
                key={feature.key}
                className={`relative flex flex-col justify-between rounded-3xl border p-5 transition-all duration-300 ${
                  isEnabled
                    ? "bg-card border-border/80 shadow-xs hover:shadow-md hover:border-primary/40 ring-1 ring-border/40"
                    : "bg-muted/20 border-dashed border-border/60 opacity-80 hover:opacity-100"
                }`}
              >
                <div>
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border ${currentTone.bg} ${currentTone.text} ${currentTone.ring} shadow-xs`}
                      >
                        <FeatureIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-sm sm:text-base text-foreground line-clamp-1">
                          {feature.title}
                        </h3>
                        <span className="text-[10px] font-bold text-muted-foreground block">
                          {feature.categoryLabel}
                        </span>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex items-center shrink-0">
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => handleToggle(feature.key, feature.title)}
                        aria-label={`تفعيل أو تعطيل ${feature.title}`}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-4 line-clamp-3">
                    {feature.desc}
                  </p>
                </div>

                {/* Bottom Metadata & Actions */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 mt-auto">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        isEnabled
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-muted text-muted-foreground border border-border/60"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isEnabled ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                      <span>{isEnabled ? "نشط ومفعل" : "معطل حالياً"}</span>
                    </span>

                    {feature.route && isEnabled && (
                      <Link
                        to={feature.route as any}
                        className="text-primary hover:underline text-[11px] font-bold inline-flex items-center gap-1"
                        title="انتقال مباشر للوحدة لتجربتها"
                      >
                        <span>{feature.routeLabel || "فتح"}</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedFeatureDetail(feature)}
                    className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="عرض التبعيات والأدوار المرتبطة"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredFeatures.length === 0 && (
          <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-border bg-card">
            <SlidersHorizontal className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-base font-black text-foreground">لا توجد ميزات مطابقة لمعايير البحث</h3>
            <p className="text-xs text-muted-foreground font-bold mt-1">
              جرب تغيير عبارة البحث أو إزالة التصفية لعرض ميزات المنظومة.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setStatusFilter("all");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
            >
              إعادة ضبط التصفية
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. MODAL: FEATURE DETAILS & DEPENDENCIES
         ───────────────────────────────────────────────────────────── */}
      {selectedFeatureDetail && (
        <AdminModal
          isOpen={Boolean(selectedFeatureDetail)}
          onClose={() => setSelectedFeatureDetail(null)}
          title={`تفاصيل ميزة: ${selectedFeatureDetail.title}`}
          description={`التصنيف: ${selectedFeatureDetail.categoryLabel} • المعرف البرمجي: ${selectedFeatureDetail.key}`}
          icon={selectedFeatureDetail.icon}
          tone={selectedFeatureDetail.tone}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => handleToggle(selectedFeatureDetail.key, selectedFeatureDetail.title)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  currentFeatures[selectedFeatureDetail.key]
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm glow-primary"
                }`}
              >
                {currentFeatures[selectedFeatureDetail.key] ? "تعطيل هذه الميزة" : "تفعيل هذه الميزة الآن"}
              </button>

              <button
                type="button"
                onClick={() => setSelectedFeatureDetail(null)}
                className="px-5 py-2 rounded-xl border border-input font-bold text-xs hover:bg-accent"
              >
                إغلاق
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 space-y-2">
              <span className="text-[11px] font-bold text-muted-foreground block">الوصف الفني والتنفيذي:</span>
              <p className="text-xs text-foreground leading-relaxed font-bold">
                {selectedFeatureDetail.desc}
              </p>
            </div>

            {selectedFeatureDetail.dependencies && selectedFeatureDetail.dependencies.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-black text-foreground block">المتطلبات والبيانات الأساسية المرتبطة:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedFeatureDetail.dependencies.map((dep, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-card border border-border/80 text-xs font-bold text-muted-foreground flex items-center gap-1.5"
                    >
                      <Check className="h-3 w-3 text-primary" />
                      <span>{dep}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedFeatureDetail.roles && selectedFeatureDetail.roles.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-black text-foreground block">الأدوار الممنوحة صلاحية الوصول:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedFeatureDetail.roles.map((role, idx) => (
                    <Badge key={idx} tone="primary">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedFeatureDetail.route && (
              <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                <div>
                  <span className="font-black text-xs text-foreground block">الصفحة المرتبطة في المنظومة:</span>
                  <span className="text-[11px] text-muted-foreground font-mono" dir="ltr">
                    {selectedFeatureDetail.route}
                  </span>
                </div>
                <Link
                  to={selectedFeatureDetail.route as any}
                  onClick={() => setSelectedFeatureDetail(null)}
                  className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90 flex items-center gap-1 shadow-xs"
                >
                  الانتقال <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </AdminModal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. MODAL: PRESETS CONFIRMATION
         ───────────────────────────────────────────────────────────── */}
      {presetModal && (
        <AdminModal
          isOpen={Boolean(presetModal)}
          onClose={() => setPresetModal(null)}
          title="قوالب الضبط السريع لميزات المنظومة"
          description="اختر قالب التكوين الأنسب لطبيعة مدرستك لتطبيق حالة التفعيل المثالية بنقرة واحدة."
          icon={Sparkles}
          tone="primary"
          maxWidth="xl"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setPresetModal(null)}
                className="px-5 py-2.5 rounded-xl border border-input font-bold text-xs hover:bg-accent"
              >
                إلغاء
              </button>
            </div>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Enterprise Preset */}
            <div
              onClick={() => handleApplyPreset("enterprise")}
              className="p-4 rounded-2xl border border-border/80 hover:border-primary bg-card hover:bg-primary/5 cursor-pointer transition-all duration-200 space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-foreground group-hover:text-primary">
                  حزمة Enterprise الشاملة
                </span>
                <Badge tone="success">كافة الميزات (20)</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                تفعيل كافة الوحدات التشغيلية والتطبيقات وبوابات الدفع والذكاء الاصطناعي وأدوات الأمان دون أي استثناء.
              </p>
              <div className="pt-2 flex justify-end">
                <span className="text-xs font-black text-primary group-hover:underline flex items-center gap-1">
                  تطبيق هذا القالب <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                </span>
              </div>
            </div>

            {/* Academic Only Preset */}
            <div
              onClick={() => handleApplyPreset("academic")}
              className="p-4 rounded-2xl border border-border/80 hover:border-primary bg-card hover:bg-primary/5 cursor-pointer transition-all duration-200 space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-foreground group-hover:text-primary">
                  الحزمة الأكاديمية المبسطة
                </span>
                <Badge tone="info">تعليمية فقط</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                التركيز التام على الدرجات، الامتحانات، رصد الحضور، تطبيق المعلم، وتوزيع المقررات، مع إيقاف المالية والنقل.
              </p>
              <div className="pt-2 flex justify-end">
                <span className="text-xs font-black text-primary group-hover:underline flex items-center gap-1">
                  تطبيق هذا القالب <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                </span>
              </div>
            </div>

            {/* Private School Preset */}
            <div
              onClick={() => handleApplyPreset("private")}
              className="p-4 rounded-2xl border border-border/80 hover:border-primary bg-card hover:bg-primary/5 cursor-pointer transition-all duration-200 space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-foreground group-hover:text-primary">
                  حزمة المدارس الخاصة والأهلية
                </span>
                <Badge tone="primary">رسوم ونقل</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                تفعيل كامل للمالية والفوترة، بوابات الدفع الإلكتروني، حافلات النقل المدرسي، وبوابة وتطبيق ولي الأمر.
              </p>
              <div className="pt-2 flex justify-end">
                <span className="text-xs font-black text-primary group-hover:underline flex items-center gap-1">
                  تطبيق هذا القالب <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                </span>
              </div>
            </div>

            {/* Recommended Default Preset */}
            <div
              onClick={() => handleApplyPreset("default")}
              className="p-4 rounded-2xl border border-border/80 hover:border-primary bg-card hover:bg-primary/5 cursor-pointer transition-all duration-200 space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-foreground group-hover:text-primary">
                  التهيئة القياسية الموصى بها
                </span>
                <Badge tone="warning">افتراضي المصنع</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                استعادة الإعدادات التلقائية الموصى بها من فريق التطوير لتشغيل المنظومة بتوازن وأمان فائق.
              </p>
              <div className="pt-2 flex justify-end">
                <span className="text-xs font-black text-primary group-hover:underline flex items-center gap-1">
                  استعادة الافتراضي <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                </span>
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. MODAL: EXPORT CONFIGURATION REPORT
         ───────────────────────────────────────────────────────────── */}
      {exportModal && (
        <AdminModal
          isOpen={exportModal}
          onClose={() => setExportModal(false)}
          title="تقرير حالة ميزات ووحدات المنظومة"
          description="تصدير كشف موثق بحالة تفعيل الميزات الـ 20 وتاريخ آخر تعديل عليها."
          icon={Download}
          tone="info"
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setExportModal(false)}
                className="px-5 py-2.5 rounded-xl border border-input font-bold text-xs hover:bg-accent"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => {
                  const dataStr =
                    "data:text/json;charset=utf-8," +
                    encodeURIComponent(JSON.stringify(currentFeatures, null, 2));
                  const dlAnchorElem = document.createElement("a");
                  dlAnchorElem.setAttribute("href", dataStr);
                  dlAnchorElem.setAttribute(
                    "download",
                    `features-manifest-${new Date().toISOString().split("T")[0]}.json`
                  );
                  dlAnchorElem.click();
                  toast.success("تم تصدير ملف إعدادات الميزات بنجاح");
                  setExportModal(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90 shadow-md glow-primary inline-flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> تنزيل ملف JSON
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/70 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-bold">الميزات النشطة:</span>
                <span className="font-black text-emerald-600">{stats.active} ميزة</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-bold">الميزات المعطلة:</span>
                <span className="font-black text-muted-foreground">{stats.disabled} ميزة</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-bold">تاريخ التوثيق:</span>
                <span className="font-bold tabular-nums">{new Date().toLocaleDateString("ar-SA")}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/80 font-mono text-[11px] max-h-48 overflow-y-auto custom-scrollbar" dir="ltr">
              <pre>{JSON.stringify(currentFeatures, null, 2)}</pre>
            </div>
          </div>
        </AdminModal>
      )}
    </AppShell>
  );
}
