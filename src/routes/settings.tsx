import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { 
  Save, Upload, Languages, Palette, BellRing, School as SchoolIcon,
  Calendar, DollarSign, Users, UserPlus, ShieldCheck, HardDrive, 
  Link as LinkIcon, Lock, Database, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Settings, Building,
  Smartphone, KeyRound, Webhook, Copy, RefreshCcw, FileText, QrCode, Search, Trash2, Check,
  AlertTriangle, Eye, Plus, X, Globe, Phone, Mail, MapPin, ExternalLink, Sparkles, SlidersHorizontal, ShieldAlert,
  Compass, BookOpen, Layers, CheckSquare, Zap, Activity, Info, MessageSquare, Download
} from "lucide-react";
import { toast } from "sonner";
import { useGlobalStore, defaultSettings, SystemFeatures, defaultFeatures } from "@/contexts/GlobalStoreContext";
import { Switch } from "@/components/ui/switch";
import {
  SmartImporterModal,
  SystemExporterModal,
  InstantBackupModal,
  OfficialPrintPreviewModal,
  WebhookTesterModal,
  NotificationSimulatorModal,
  MobileConnectModal,
  FactoryResetModal,
  AddAcademicYearModal
} from "@/components/settings/settings-modals";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "الإعدادات المركزية الشاملة | منصة مدارس" }] }),
  component: SettingsPage,
});

// Grouped Tabs Hierarchy for superior UX & clarity
const TAB_GROUPS = [
  {
    category: "التحكم بالميزات والوحدات",
    tabs: [
      { id: "features", label: "التحكم بميزات النظام والوحدات", icon: SlidersHorizontal, badge: "مركز الميزات" },
    ]
  },
  {
    category: "المؤسسة والبيانات الأساسية",
    tabs: [
      { id: "school", label: "بيانات وهوية المدرسة", icon: SchoolIcon, badge: "أساسي" },
      { id: "brand", label: "الهوية البصرية والمطبوعات", icon: Palette, badge: "شعار وختم" },
      { id: "facilities", label: "إدارة المرافق والأصول", icon: Building },
    ]
  },
  {
    category: "السياسات والتشغيل الأكاديمي",
    tabs: [
      { id: "academic", label: "السنوات والتقويم الدراسي", icon: Calendar, badge: "التقويم" },
      { id: "admission", label: "سياسات القبول والتسجيل", icon: UserPlus },
      { id: "hr", label: "سياسات الموارد البشرية", icon: Users },
      { id: "finance", label: "السياسات والعمليات المالية", icon: DollarSign, badge: "العملة" },
    ]
  },
  {
    category: "المظهر والتخصيص",
    tabs: [
      { id: "theme", label: "الثيم والألوان والواجهة", icon: Palette, badge: "ألوان" },
      { id: "lang", label: "اللغة والتقويم والاتجاه", icon: Languages },
      { id: "print", label: "قوالب ومحددات الطباعة", icon: FileText },
    ]
  },
  {
    category: "الربط والاتصالات الذكية",
    tabs: [
      { id: "notif", label: "قواعد الإشعارات والرسائل", icon: BellRing, badge: "SMS/واتساب" },
      { id: "mobile", label: "تطبيق الهاتف وبوابة ولي الأمر", icon: Smartphone },
      { id: "integrations", label: "تطبيقات الربط والطرف الثالث", icon: LinkIcon, badge: "نور/بوابات" },
      { id: "api", label: "API والربط المتقدم (Webhooks)", icon: KeyRound },
    ]
  },
  {
    category: "الأمان وإدارة البيانات",
    tabs: [
      { id: "security", label: "الأمان وسياسات الدخول", icon: Lock },
      { id: "roles", label: "الصلاحيات الافتراضية", icon: ShieldCheck },
      { id: "backup", label: "النسخ الاحتياطي والحفظ", icon: HardDrive },
      { id: "data_io", label: "المستورد والمصدر الذكي", icon: Database, badge: "نظام نور" },
    ]
  }
] as const;

type TabId = typeof TAB_GROUPS[number]["tabs"][number]["id"];

const THEME_PALETTES = [
  { id: "blue", name: "أزرق ملكي", hex: "#2563eb", border: "border-blue-600" },
  { id: "sky", name: "سماوي عصري", hex: "#0ea5e9", border: "border-sky-500" },
  { id: "emerald", name: "زمردي تعليمي", hex: "#10b981", border: "border-emerald-500" },
  { id: "indigo", name: "نيلي وقور", hex: "#4f46e5", border: "border-indigo-600" },
  { id: "violet", name: "بنفسجي ابتكاري", hex: "#8b5cf6", border: "border-violet-500" },
  { id: "rose", name: "ياقوتي راقٍ", hex: "#e11d48", border: "border-rose-600" },
  { id: "amber", name: "عنبري دافئ", hex: "#d97706", border: "border-amber-600" },
  { id: "teal", name: "كحلي بحري", hex: "#0f766e", border: "border-teal-700" },
];

// Definition of All 20 Platform Modules & Features
interface FeatureDefinition {
  key: keyof SystemFeatures;
  name: string;
  desc: string;
  category: "core" | "portals" | "tech" | "security";
  categoryLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  route?: string;
  routeLabel?: string;
  dependency?: string;
  badge?: string;
  modalOpener?: "importer" | "exporter" | "backup" | "print" | "webhook" | "notif" | "mobile" | "factoryReset" | "addYear";
  modalLabel?: string;
  tabShortcut?: TabId;
  tabLabel?: string;
}

const ALL_FEATURES: FeatureDefinition[] = [
  {
    key: "transport",
    name: "وحدة النقل المدرسي والحافلات",
    desc: "إدارة خطوط السير، المشرفين، الحافلات، واشتراكات الطلاب مع فوترة النقل آلياً",
    category: "core",
    categoryLabel: "وحدات تشغيلية",
    icon: Compass,
    route: "/transport/routes",
    routeLabel: "فتح شاشة النقل",
    dependency: "مرتبط بالمركز المالي وملفات الطلاب",
    badge: "حافلات",
  },
  {
    key: "library",
    name: "وحدة المكتبة وتوزيع المقررات",
    desc: "إدارة فهارس الكتب والمقررات، خطط تسليم الكتب المدرسية، ورصد الإرجاع",
    category: "core",
    categoryLabel: "وحدات تشغيلية",
    icon: BookOpen,
    route: "/library/textbooks",
    routeLabel: "فتح المكتبة",
    dependency: "مرتبط بالصفوف والشعب",
    badge: "مقررات",
  },
  {
    key: "clinic",
    name: "وحدة العيادة الطبية والرعاية الصحية",
    desc: "السجلات الصحية، ملفات الحساسية والأمراض المزمنة، وتوثيق زيارات العيادة",
    category: "core",
    categoryLabel: "وحدات تشغيلية",
    icon: ShieldCheck,
    route: "/clinic/visits",
    routeLabel: "فتح العيادة",
    dependency: "مرتبط بملفات الطلاب والغياب",
    badge: "صحة",
  },
  {
    key: "facilities",
    name: "وحدة إدارة المرافق والمباني والصيانة",
    desc: "إدارة المباني، القاعات، المعامل، طلبات الصيانة الدورية، وقيد تكاليف الصيانة",
    category: "core",
    categoryLabel: "وحدات تشغيلية",
    icon: Building,
    route: "/facilities/rooms",
    routeLabel: "فتح المرافق",
    dependency: "مرتبط بمراكز التكلفة والمصروفات",
    badge: "مباني",
    tabShortcut: "facilities",
    tabLabel: "إعدادات الأصول",
  },
  {
    key: "inventory",
    name: "وحدة إدارة المستودعات والعهد المدرسية",
    desc: "جرد الأصول، الأصناف المخزنية، أذونات الصرف والإضافة، وتنبيهات النقص",
    category: "core",
    categoryLabel: "وحدات تشغيلية",
    icon: HardDrive,
    route: "/inventory/items",
    routeLabel: "فتح المستودع",
    dependency: "مرتبط بالمشتريات والعهد",
    badge: "مخزون",
  },
  {
    key: "hrPayroll",
    name: "وحدة الموارد البشرية ومسير الرواتب",
    desc: "دليل الكادر، مسيرات الرواتب الشهرية، البدلات، الحسميات، والإجازات السنوية",
    category: "core",
    categoryLabel: "وحدات تشغيلية",
    icon: Users,
    route: "/hr/staff",
    routeLabel: "فتح شؤون الموظفين",
    dependency: "مرتبط بالخزينة والحسابات",
    badge: "رواتب",
    tabShortcut: "hr",
    tabLabel: "سياسات الموارد البشرية",
  },
  {
    key: "examsReports",
    name: "وحدة الاختبارات ورصد الدرجات والشهادات",
    desc: "جداول الامتحانات، رصد الدرجات، كشوف النتائج، وإصدار الشهادات الرسمية",
    category: "core",
    categoryLabel: "وحدات أكاديمية",
    icon: FileText,
    route: "/exams",
    routeLabel: "فتح الاختبارات",
    dependency: "مرتبط بالمناهج والمواد والفصول",
    badge: "نتائج",
  },
  {
    key: "financeInvoicing",
    name: "المركز المالي والفوترة والتحصيل",
    desc: "إصدار الفواتير، سندات القبض والصرف، سجلات الخزينة، وإدارة الخصومات والمنح",
    category: "core",
    categoryLabel: "وحدات تشغيلية",
    icon: DollarSign,
    route: "/finance",
    routeLabel: "فتح المالية",
    dependency: "الوحدة المركزية لجميع الإيرادات والمصروفات",
    badge: "مالية",
    tabShortcut: "finance",
    tabLabel: "السياسات المالية",
  },
  {
    key: "admissionRegistration",
    name: "بوابة القبول والتسجيل الإلكتروني",
    desc: "استقبال طلبات المستجدين، مراجعة المستندات، وفحص السعة الاستيعابية للفصول",
    category: "core",
    categoryLabel: "وحدات أكاديمية",
    icon: UserPlus,
    route: "/students/new",
    routeLabel: "تسجيل طالب",
    dependency: "مرتبط بالسنوات الدراسية والصفوف",
    badge: "تسجيل",
    tabShortcut: "admission",
    tabLabel: "سياسات القبول",
  },
  {
    key: "parentPortal",
    name: "بوابة وتطبيق ولي الأمر الرقمي",
    desc: "متابعة درجات الأبناء، الحضور والغياب، سداد الرسوم إلكترونياً، والتقارير",
    category: "portals",
    categoryLabel: "بوابات وتطبيقات",
    icon: Smartphone,
    route: "/guardians",
    routeLabel: "أولياء الأمور",
    dependency: "يتطلب حسابات أولياء أمور معتمدة",
    badge: "تطبيق",
    modalOpener: "mobile",
    modalLabel: "ربط التطبيق والـ PIN",
    tabShortcut: "mobile",
    tabLabel: "إعدادات التطبيق",
  },
  {
    key: "teacherApp",
    name: "تطبيق المعلم ورصد الحصص والدرجات",
    desc: "رصد الحضور الصباحي وبالحصص، تسجيل الواجبات والملاحظات السلوكية اليومية",
    category: "portals",
    categoryLabel: "بوابات وتطبيقات",
    icon: Users,
    route: "/attendance/take",
    routeLabel: "رصد الحضور",
    dependency: "مرتبط بجدول الحصص والإسناد",
    badge: "معلم",
    modalOpener: "mobile",
    modalLabel: "ربط تطبيق المعلم",
  },
  {
    key: "smsAlerts",
    name: "تنبيهات الرسائل النصية القصيرة SMS",
    desc: "إرسال رسائل نصية فورية لولي الأمر عند غياب الطالب أو استحقاق قسط مالي",
    category: "portals",
    categoryLabel: "اتصالات وتنبيهات",
    icon: Smartphone,
    route: "/admin/notifications",
    routeLabel: "مركز التنبيهات",
    dependency: "يتطلب اشتراك مزود SMS معتمد",
    badge: "SMS",
    modalOpener: "notif",
    modalLabel: "محاكاة وفحص SMS",
    tabShortcut: "notif",
    tabLabel: "قواعد الإشعارات",
  },
  {
    key: "whatsappAlerts",
    name: "إشعارات وتنبيهات واتساب التلقائية",
    desc: "قناة تواصل تفاعلية فورية لإرسال إشعارات الدرجات وروابط السداد والغياب",
    category: "portals",
    categoryLabel: "اتصالات وتنبيهات",
    icon: MessageSquare,
    route: "/admin/notifications",
    routeLabel: "مركز التنبيهات",
    dependency: "يتطلب مفتاح WhatsApp Business",
    badge: "واتساب",
    modalOpener: "notif",
    modalLabel: "محاكاة إرسال واتساب",
  },
  {
    key: "onlinePayments",
    name: "بوابات السداد والدفع الإلكتروني",
    desc: "دعم سداد الرسوم المدرسية عبر مدى، فيزا، ماستركارد، وأبل باي إلكترونياً",
    category: "tech",
    categoryLabel: "تقنية وتكامل",
    icon: DollarSign,
    route: "/finance",
    routeLabel: "بوابة السداد",
    dependency: "مرتبط ببوابات Stripe أو PayTabs",
    badge: "سداد",
    tabShortcut: "integrations",
    tabLabel: "ضبط بوابات الدفع",
  },
  {
    key: "qrVerification",
    name: "التحقق الرقمي المعتمد بالباركود QR",
    desc: "تضمين رمز QR ذكي في الشهادات والفواتير الرسمية للتحقق الفوري من صحتها",
    category: "tech",
    categoryLabel: "تقنية وتكامل",
    icon: QrCode,
    route: "/settings",
    routeLabel: "قوالب الطباعة",
    dependency: "مدمج مع محرك الطباعة والشهادات",
    badge: "QR",
    modalOpener: "print",
    modalLabel: "معاينة الوثيقة A4 والـ QR",
    tabShortcut: "print",
    tabLabel: "قوالب الطباعة",
  },
  {
    key: "noorIntegration",
    name: "المزامنة المباشرة مع نظام نور الوزاري",
    desc: "تصدير واستيراد بيانات الطلاب والدرجات والغياب وفق نسق وزارة التعليم",
    category: "tech",
    categoryLabel: "تقنية وتكامل",
    icon: LinkIcon,
    route: "/settings",
    routeLabel: "المستورد ومطابقة نور",
    dependency: "مطابق لمعايير وزارة التعليم",
    badge: "نظام نور",
    modalOpener: "importer",
    modalLabel: "المستورد ومطابقة نور",
    tabShortcut: "data_io",
    tabLabel: "المستورد والمصدر",
  },
  {
    key: "webhooksApi",
    name: "المفاتيح البرمجية وأحداث الـ Webhooks",
    desc: "بث الأحداث اللحظية لأنظمة المدارس الخارجية وتوفير واجهات برمجة REST API",
    category: "tech",
    categoryLabel: "تقنية وتكامل",
    icon: KeyRound,
    route: "/settings",
    routeLabel: "إعدادات الـ API",
    dependency: "مخصص للربط التقني الخارجي",
    badge: "API",
    modalOpener: "webhook",
    modalLabel: "مختبر الـ Webhooks والبث",
    tabShortcut: "api",
    tabLabel: "إعدادات الـ API",
  },
  {
    key: "twoFactorAuth",
    name: "التحقق الثنائي بخطوتين (2FA)",
    desc: "فرض رمز أمان إضافي OTP عند تسجيل دخول الإداريين والمحاسبين لحماية البيانات",
    category: "security",
    categoryLabel: "أمان وحماية",
    icon: Lock,
    route: "/admin/permissions",
    routeLabel: "سياسات الأمان",
    dependency: "سياسة حماية البيانات الحساسة",
    badge: "أمان",
    tabShortcut: "security",
    tabLabel: "سياسات الدخول و 2FA",
  },
  {
    key: "smartAnalyticsAi",
    name: "التحليلات الذكية ومساعد الذكاء الاصطناعي",
    desc: "توقع مستويات التعثر الأكاديمي، توصيات توزيع الحصص، والمساعد الذكي للإدارة",
    category: "tech",
    categoryLabel: "تقنية وتكامل",
    icon: Sparkles,
    route: "/exams/archive",
    routeLabel: "سجل التحليلات",
    dependency: "تحليل مدمج لقواعد البيانات",
    badge: "AI ذكي",
  },
  {
    key: "trashBin",
    name: "سلة المحذوفات المركزية واسترجاع البيانات",
    desc: "الحذف الآمن المؤقت للطلاب والموظفين مع إمكانية الاسترجاع أو الإتلاف النهائي",
    category: "security",
    categoryLabel: "أمان وحماية",
    icon: Trash2,
    route: "/settings/trash",
    routeLabel: "سلة المحذوفات",
    dependency: "حماية ضد الحذف العفوي للبيانات",
    badge: "استعادة",
  },
];

function SettingsPage() {
  const [tab, setTab] = useState<TabId>("features");
  const [searchQuery, setSearchQuery] = useState("");
  const [featureCategoryFilter, setFeatureCategoryFilter] = useState<"all" | "core" | "portals" | "tech" | "security">("all");
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Global Store bindings
  const { 
    currency, 
    setCurrency, 
    allAcademicYears, 
    updateAcademicYear,
    systemSettings: rawSettings, 
    updateSettings,
    resetSettings,
    toggleFeature,
    updateFeatures,
    allStudents,
    allStaff,
    allGuardians,
    addActivityLog
  } = useGlobalStore();

  const systemSettings = { 
    ...defaultSettings, 
    ...(rawSettings || {}),
    features: {
      ...defaultFeatures,
      ...(rawSettings?.features || {})
    },
    defaultChannels: {
      ...defaultSettings.defaultChannels,
      ...(rawSettings?.defaultChannels || {})
    }
  };

  // Modals state
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isExporterOpen, setIsExporterOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isWebhookTesterOpen, setIsWebhookTesterOpen] = useState(false);
  const [isNotifTesterOpen, setIsNotifTesterOpen] = useState(false);
  const [isMobileConnectOpen, setIsMobileConnectOpen] = useState(false);
  const [isFactoryResetOpen, setIsFactoryResetOpen] = useState(false);
  const [isAddYearOpen, setIsAddYearOpen] = useState(false);

  // Deleted items count in system trash
  const deletedCount = useMemo(() => {
    const s = allStudents.filter(x => x.isDeleted).length;
    const g = allGuardians.filter(x => x.isDeleted).length;
    const st = allStaff.filter(x => x.isDeleted).length;
    return s + g + st;
  }, [allStudents, allGuardians, allStaff]);

  // Features Statistics
  const activeFeaturesCount = useMemo(() => {
    const feats = systemSettings.features;
    return Object.values(feats).filter(Boolean).length;
  }, [systemSettings.features]);

  const totalFeaturesCount = ALL_FEATURES.length;
  const activePercentage = Math.round((activeFeaturesCount / totalFeaturesCount) * 100);

  // Filter tabs based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return TAB_GROUPS;
    const q = searchQuery.toLowerCase().trim();
    return TAB_GROUPS.map(group => {
      const matched = group.tabs.filter(t => 
        t.label.toLowerCase().includes(q) || 
        group.category.toLowerCase().includes(q)
      );
      return {
        ...group,
        tabs: matched
      };
    }).filter(group => group.tabs.length > 0);
  }, [searchQuery]);

  // Handle Logo Upload (Reads as Base64 Data URL)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error("حجم الصورة كبير جداً، يفضل أن يكون أقل من 2 ميغابايت");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        updateSettings({ logoUrl: dataUrl });
        toast.success("تم تحديث وحفظ الشعار الرسمي بنجاح وتطبيقه على النظام");
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Stamp Upload (Reads as Base64 Data URL)
  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        updateSettings({ stampUrl: dataUrl });
        toast.success("تم حفظ الختم الرسمي وتفعيله على الشهادات والمطبوعات");
      };
      reader.readAsDataURL(file);
    }
  };

  // Export Settings as JSON file
  const handleExportSettingsJson = () => {
    const blob = new Blob(["\uFEFF" + JSON.stringify(systemSettings, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `darasi_settings_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير ملف إعدادات النظام بنجاح");
  };

  // Import Settings from JSON file
  const handleImportSettingsJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && typeof parsed === "object") {
            updateSettings(parsed);
            toast.success("تم استيراد وتطبيق الإعدادات المركزية بنجاح");
          } else {
            toast.error("ملف الإعدادات غير صالح");
          }
        } catch {
          toast.error("خطأ في قراءة ملف الإعدادات");
        }
      };
      reader.readAsText(file);
    }
  };

  // Switch current active academic year
  const handleSelectAcademicYear = (yearId: string) => {
    allAcademicYears.forEach(y => {
      updateAcademicYear(y.id, { isCurrent: y.id === yearId });
    });
    toast.success("تم تعيين السنة الأكاديمية النشطة للمنصة");
  };

  // Presets for features
  const handleApplyPreset = (preset: "enterprise" | "academic" | "minimal" | "default") => {
    if (preset === "enterprise") {
      const allOn = Object.keys(defaultFeatures).reduce((acc, k) => {
        acc[k as keyof SystemFeatures] = true;
        return acc;
      }, {} as SystemFeatures);
      updateFeatures(allOn);
      toast.success("تم تفعيل حزمة Enterprise الشاملة (كافة الميزات نشطة)");
    } else if (preset === "academic") {
      updateFeatures({
        ...defaultFeatures,
        transport: false,
        inventory: false,
        clinic: false,
        onlinePayments: false,
      });
      toast.success("تم تفعيل نمط التشغيل الأكاديمي الأساسي (بدون خدمات المرافق والنقل)");
    } else if (preset === "minimal") {
      const minimal: SystemFeatures = {
        transport: false,
        library: false,
        clinic: false,
        facilities: false,
        inventory: false,
        hrPayroll: false,
        examsReports: true,
        financeInvoicing: true,
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
        smartAnalyticsAi: false,
        trashBin: true,
      };
      updateFeatures(minimal);
      toast.success("تم تفعيل الوضع المصغر (الصفوف، الطلاب، والدرجات فقط)");
    } else {
      updateFeatures(defaultFeatures);
      toast.success("تمت استعادة التهيئة الافتراضية لكافة ميزات النظام");
    }
  };

  const handleGlobalSave = () => {
    addActivityLog({
      user: "مدير النظام",
      action: "تثبيت وحفظ الإعدادات المركزية",
      entity: "الإعدادات المركزية والميزات",
      details: "تم تأكيد وحفظ كافة السياسات وحالة تفعيل الميزات بنجاح",
    });
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
    toast.success("تم حفظ وتثبيت كافة الإعدادات والسياسات المركزية بنجاح");
  };

  // Filtered features list
  const filteredFeaturesList = useMemo(() => {
    return ALL_FEATURES.filter((f) => {
      if (featureCategoryFilter !== "all" && f.category !== featureCategoryFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return f.name.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q) || f.categoryLabel.toLowerCase().includes(q);
    });
  }, [featureCategoryFilter, searchQuery]);

  return (
    <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الإعدادات المركزية وميزات النظام" }]}>
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20">
            <Settings className="h-6 w-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-foreground">الإعدادات المركزية والتحكم بالميزات</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-black flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {activeFeaturesCount} ميزة نشطة ({activePercentage}%)
              </span>
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-0.5">
              لوحة التحكم الشاملة بسياسات المؤسسة، ترخيص الوحدات، الهوية الرسمية، والربط البرمجي
            </p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Jump to Features Tab */}
          <button
            onClick={() => setTab("features")}
            className={`inline-flex h-9 items-center gap-1.5 px-3.5 rounded-xl border text-xs font-black transition-all shadow-xs ${
              tab === "features"
                ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "border-border/80 bg-card hover:bg-accent text-foreground"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>مركز الميزات</span>
          </button>

          {/* Smart Importer Shortcut */}
          <button
            onClick={() => setIsImporterOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold transition-all shadow-xs text-foreground"
            title="فتح المستورد الذكي ومطابقة نور"
          >
            <Database className="h-3.5 w-3.5 text-primary" />
            <span>المستورد الذكي</span>
          </button>

          {/* System Exporter Shortcut */}
          <button
            onClick={() => setIsExporterOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold transition-all shadow-xs text-foreground"
            title="تصدير بيانات النظام المجمعة"
          >
            <ArrowUpFromLine className="h-3.5 w-3.5 text-primary" />
            <span>تصدير شامل</span>
          </button>

          {/* Notification Simulator Shortcut */}
          <button
            onClick={() => setIsNotifTesterOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold transition-all shadow-xs text-foreground"
            title="محاكاة واختبار قنوات الإرسال SMS وواتساب"
          >
            <BellRing className="h-3.5 w-3.5 text-primary" />
            <span>محاكي الإشعارات</span>
          </button>

          {/* Official Print Preview Shortcut */}
          <button
            onClick={() => setIsPrintPreviewOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold transition-all shadow-xs text-foreground"
            title="معاينة المطبوعات الرسمية A4 والـ QR"
          >
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>معاينة A4</span>
          </button>

          {/* Settings JSON Export */}
          <button
            onClick={handleExportSettingsJson}
            title="تصدير الإعدادات كملف JSON"
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold transition-all shadow-xs"
          >
            <ArrowDownToLine className="h-3.5 w-3.5 text-primary" />
            <span>تصدير Config</span>
          </button>

          {/* Settings JSON Import */}
          <label
            title="استيراد إعدادات من ملف JSON"
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <input type="file" accept=".json" onChange={handleImportSettingsJson} className="hidden" />
            <ArrowUpFromLine className="h-3.5 w-3.5 text-primary" />
            <span>استيراد Config</span>
          </label>

          {/* Instant Backup Shortcut */}
          <button
            onClick={() => setIsBackupOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold transition-all shadow-xs text-foreground"
            title="أخذ نسخة احتياطية فورية للنظام"
          >
            <HardDrive className="h-3.5 w-3.5 text-primary" />
            <span>نسخ فوري</span>
          </button>

          {/* System Trash Button with counter */}
          <Link
            to="/settings/trash"
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold transition-all shadow-xs text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5 text-danger" />
            <span>سلة المهملات</span>
            {deletedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-danger/10 text-danger text-[10px] font-black">
                {deletedCount}
              </span>
            )}
          </Link>

          {/* Factory Reset Trigger */}
          <button
            onClick={() => setIsFactoryResetOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-danger/30 bg-danger/5 hover:bg-danger/10 text-danger text-xs font-bold transition-all shadow-xs"
            title="استعادة إعدادات المصنع وضبط الأمان"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>ضبط المصنع</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Selector (Visible on < lg screens) */}
      <div className="lg:hidden mb-4 p-3.5 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-black text-muted-foreground flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            <span>الانتقال السريع للقسم:</span>
          </label>
          <span className="text-[10px] text-muted-foreground font-bold">
            {TAB_GROUPS.reduce((acc, g) => acc + g.tabs.length, 0)} قسماً متاحاً
          </span>
        </div>
        <div className="flex gap-2">
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value as TabId)}
            className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          >
            {TAB_GROUPS.map((group) => (
              <optgroup key={group.category} label={group.category}>
                {group.tabs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setTab("features")}
            className="h-10 px-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-black shrink-0 flex items-center gap-1.5 shadow-sm"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>الميزات</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout: Sidebar Navigation + Main Canvas */}
      <div className="grid gap-6 lg:grid-cols-[290px_minmax(0,1fr)] items-start">
        {/* Navigation Sidebar */}
        <div className="space-y-4 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-3.5 shadow-sm sticky top-20">
          {/* Quick Tab Search Filter */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="بحث في الإعدادات والميزات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background pr-9 pl-3 text-xs font-bold placeholder:text-muted-foreground/70 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Grouped Tab List */}
          <div className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar pr-1">
            {filteredGroups.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">لا توجد أقسام مطابقة لبحثك</div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.category} className="space-y-1">
                  <div className="px-2.5 py-1 text-[11px] font-black text-muted-foreground/80 tracking-wide">
                    {group.category}
                  </div>
                  {group.tabs.map((t) => {
                    const Icon = t.icon;
                    const active = tab === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                          active
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-black scale-[1.01]"
                            : "hover:bg-accent text-foreground/80 hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                          <span className="truncate">{t.label}</span>
                        </div>
                        {"badge" in t && t.badge && (
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                              active
                                ? "bg-white/20 text-white"
                                : t.badge === "مركز الميزات"
                                ? "bg-primary text-primary-foreground"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {t.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dynamic Settings Content Canvas */}
        <div className="space-y-6">
          
          {/* ========================================================================= */}
          {/* TAB 0: Features & Modules Control Center (التحكم بالميزات والوحدات) */}
          {/* ========================================================================= */}
          {tab === "features" && (
            <PageCard
              title="التحكم بميزات النظام والوحدات التشغيلية"
              description="تفعيل أو تعطيل وحدات المنظومة والميزات الرقمية والتطبيقات والربط البرمجي مع تحكم لحظي ينعكس مباشرة على القائمة الجانبية والصلاحيات"
            >
              <div className="space-y-6">
                {/* Features KPI Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">إجمالي الميزات المتاحة</span>
                    <div className="text-2xl font-black text-foreground font-mono">{totalFeaturesCount}</div>
                    <div className="text-[11px] text-muted-foreground">ميزات متكاملة بالمنظومة</div>
                  </div>
                  <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 shadow-xs space-y-1">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">الميزات النشطة حالياً</span>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{activeFeaturesCount}</div>
                    <div className="text-[11px] text-emerald-600/80">مفعلة وتعمل مباشرة</div>
                  </div>
                  <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-1">
                    <span className="text-xs font-bold text-muted-foreground">الميزات المعطلة</span>
                    <div className="text-2xl font-black text-muted-foreground font-mono">{totalFeaturesCount - activeFeaturesCount}</div>
                    <div className="text-[11px] text-muted-foreground">محجوبة عن الواجهة</div>
                  </div>
                  <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 shadow-xs space-y-1">
                    <span className="text-xs font-bold text-primary">نسبة الجاهزية والتشغيل</span>
                    <div className="text-2xl font-black text-primary font-mono">{activePercentage}%</div>
                    <div className="w-full bg-primary/20 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-primary h-full transition-all duration-500" style={{ width: `${activePercentage}%` }} />
                    </div>
                  </div>
                </div>

                {/* Quick Presets Bar */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>قوالب الضبط السريع للميزات (Presets)</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">تطبيق مسبق حسب نموذج المنشأة</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("enterprise")}
                      className="px-3 py-1.5 rounded-xl bg-card border border-border hover:border-primary text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      <span>تفعيل كافة الميزات (Enterprise الشاملة)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("academic")}
                      className="px-3 py-1.5 rounded-xl bg-card border border-border hover:border-primary text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <SchoolIcon className="h-3.5 w-3.5 text-blue-500" />
                      <span>الوضع الأكاديمي والتعليمي (بدون نقل ومستودعات)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("minimal")}
                      className="px-3 py-1.5 rounded-xl bg-card border border-border hover:border-primary text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
                      <span>الوضع المبسط (الصفوف، الطلاب والدرجات)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("default")}
                      className="px-3 py-1.5 rounded-xl bg-card border border-border hover:border-primary text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 text-muted-foreground"
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                      <span>الافتراضي</span>
                    </button>
                  </div>
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
                  {[
                    { id: "all", label: "كافة الميزات (20)" },
                    { id: "core", label: "الوحدات التشغيلية الأساسية (9)" },
                    { id: "portals", label: "البوابات والتطبيقات والاتصال (4)" },
                    { id: "tech", label: "التقنية والتكامل الذكي (5)" },
                    { id: "security", label: "الأمان وحماية البيانات (2)" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFeatureCategoryFilter(cat.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        featureCategoryFilter === cat.id
                          ? "bg-primary text-primary-foreground font-black shadow-xs"
                          : "bg-card border border-border hover:bg-accent text-muted-foreground"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Features Grid */}
                <div className="grid gap-3.5 md:grid-cols-2">
                  {filteredFeaturesList.map((feat) => {
                    const isEnabled = systemSettings.features[feat.key] ?? true;
                    const IconComponent = feat.icon;

                    return (
                      <div
                        key={feat.key}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          isEnabled
                            ? "bg-card border-border hover:border-primary/50 shadow-xs"
                            : "bg-muted/20 border-border/60 opacity-75"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-xl shrink-0 ${
                              isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            }`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-black text-xs text-foreground">{feat.name}</h3>
                                {feat.badge && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                                    {feat.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                {feat.desc}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 pt-0.5">
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) => {
                                toggleFeature(feat.key, checked);
                                toast.success(
                                  checked
                                    ? `تم تفعيل: ${feat.name} وتحديث القائمة الجانبية فوراً`
                                    : `تم تعطيل: ${feat.name} وإخفاؤها من القائمة الجانبية`
                                );
                              }}
                            />
                          </div>
                        </div>

                        {/* Bottom Metadata & Integrated Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border/60 text-[11px]">
                          <span className="text-muted-foreground text-[10px] flex items-center gap-1">
                            <Info className="h-3 w-3 text-primary/60 shrink-0" />
                            <span>{feat.dependency}</span>
                          </span>

                          <div className="flex flex-wrap items-center gap-1.5 mr-auto">
                            {/* Tab Shortcut */}
                            {feat.tabShortcut && (
                              <button
                                type="button"
                                onClick={() => setTab(feat.tabShortcut!)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary/80 hover:bg-secondary text-secondary-foreground text-[10px] font-black transition-all shadow-2xs"
                                title={`الانتقال إلى تبويب ${feat.tabLabel}`}
                              >
                                <Settings className="h-3 w-3 text-primary" />
                                <span>{feat.tabLabel || "إعدادات"}</span>
                              </button>
                            )}

                            {/* Modal Opener Button */}
                            {feat.modalOpener && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (feat.modalOpener === "importer") setIsImporterOpen(true);
                                  else if (feat.modalOpener === "exporter") setIsExporterOpen(true);
                                  else if (feat.modalOpener === "backup") setIsBackupOpen(true);
                                  else if (feat.modalOpener === "print") setIsPrintPreviewOpen(true);
                                  else if (feat.modalOpener === "webhook") setIsWebhookTesterOpen(true);
                                  else if (feat.modalOpener === "notif") setIsNotifTesterOpen(true);
                                  else if (feat.modalOpener === "mobile") setIsMobileConnectOpen(true);
                                  else if (feat.modalOpener === "factoryReset") setIsFactoryResetOpen(true);
                                  else if (feat.modalOpener === "addYear") setIsAddYearOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[10px] font-black transition-all shadow-2xs"
                                title={feat.modalLabel}
                              >
                                <Sparkles className="h-3 w-3" />
                                <span>{feat.modalLabel || "اختبار / نافذة"}</span>
                              </button>
                            )}

                            {/* Direct Route Link */}
                            {feat.route && isEnabled && (
                              <Link
                                to={feat.route}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] font-black transition-all shadow-2xs"
                              >
                                <span>{feat.routeLabel || "الانتقال للوحدة"}</span>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </PageCard>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: Institutional & School Profile */}
          {/* ========================================================================= */}
          {tab === "school" && (
            <PageCard
              title="بيانات وهوية المدرسة الرسمية"
              description="المعلومات الأساسية المعتمدة للمؤسسة التعليمية والتي تظهر على كافة التقارير والشهادات والمراسلات"
            >
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="الاسم الرسمي للمدرسة">
                    <input
                      value={systemSettings.schoolName}
                      onChange={(e) => updateSettings({ schoolName: e.target.value })}
                      className={inp}
                      placeholder="مدرسة النموذج الأهلية"
                    />
                  </Field>
                  <Field label="رقم الترخيص الوزاري">
                    <input
                      value={systemSettings.licenseNumber}
                      onChange={(e) => updateSettings({ licenseNumber: e.target.value })}
                      className={inp}
                      placeholder="LIC-2024-001"
                    />
                  </Field>
                  <Field label="المدير العام المعتمد">
                    <input
                      value={systemSettings.principalName}
                      onChange={(e) => updateSettings({ principalName: e.target.value })}
                      className={inp}
                      placeholder="أ.د. خالد القحطاني"
                    />
                  </Field>
                  <Field label="نوع المنشأة والتعليم">
                    <select
                      value={systemSettings.schoolType || "أهلي (بنين وبنات)"}
                      onChange={(e) => updateSettings({ schoolType: e.target.value })}
                      className={inp}
                    >
                      <option>أهلي (بنين وبنات)</option>
                      <option>أهلي (بنين فقط)</option>
                      <option>أهلي (بنات فقط)</option>
                      <option>عالمي ودولي (International)</option>
                      <option>حكومي رسمي</option>
                    </select>
                  </Field>
                  <Field label="رقم الهاتف الثابت المعتمد">
                    <input
                      value={systemSettings.phone}
                      onChange={(e) => updateSettings({ phone: e.target.value })}
                      className={inp}
                      placeholder="0112345678"
                    />
                  </Field>
                  <Field label="البريد الإلكتروني الرسمي">
                    <input
                      type="email"
                      value={systemSettings.email}
                      onChange={(e) => updateSettings({ email: e.target.value })}
                      className={inp}
                      placeholder="info@school.edu.sa"
                    />
                  </Field>
                  <Field label="الموقع الإلكتروني الرسمي">
                    <input
                      type="url"
                      dir="ltr"
                      value={systemSettings.schoolWebsite || "https://school.edu.sa"}
                      onChange={(e) => updateSettings({ schoolWebsite: e.target.value })}
                      className={inp}
                      placeholder="https://myschool.edu.sa"
                    />
                  </Field>
                  <Field label="العنوان / المدينة والحي">
                    <input
                      value={systemSettings.address}
                      onChange={(e) => updateSettings({ address: e.target.value })}
                      className={inp}
                      placeholder="الرياض - حي الواحة - طريق الملك عبدالله"
                    />
                  </Field>
                </div>

                <div className="pt-2">
                  <Field label="الرؤية والرسالة المؤسسية (تُضمن في التقارير والخطط)">
                    <textarea
                      rows={3}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold leading-relaxed focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                      value={systemSettings.vision}
                      onChange={(e) => updateSettings({ vision: e.target.value })}
                      placeholder="الريادة في تقديم تعليم نوعي ينمي مهارات المستقبل..."
                    />
                  </Field>
                </div>
              </div>
            </PageCard>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: Visual Identity & Brand */}
          {/* ========================================================================= */}
          {tab === "brand" && (
            <PageCard
              title="الهوية البصرية والمطبوعات المعتمدة"
              description="إدارة شعار المدرسة، الختم الرسمي للشهادات والفواتير، والترويسة الرقمية"
            >
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Official Logo Uploader with Live Preview */}
                  <div className="rounded-2xl border border-border p-4 bg-card/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-foreground">الشعار الرسمي للمدرسة (Logo)</span>
                      {systemSettings.logoUrl && (
                        <button
                          onClick={() => { updateSettings({ logoUrl: "" }); toast.info("تمت إزالة الشعار"); }}
                          className="text-[11px] font-bold text-danger hover:underline"
                        >
                          إزالة الشعار
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center overflow-hidden shrink-0">
                        {systemSettings.logoUrl ? (
                          <img src={systemSettings.logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
                        ) : (
                          <SchoolIcon className="h-10 w-10 text-primary/40" />
                        )}
                      </div>
                      <div className="space-y-2 flex-1">
                        <label className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-xs">
                          <Upload className="h-3.5 w-3.5" />
                          <span>رفع شعار جديد</span>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          صيغة PNG أو SVG بخلفية شفافة لضمان جودة الشهادات والمطبوعات.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Official Digital Stamp Uploader with Live Preview */}
                  <div className="rounded-2xl border border-border p-4 bg-card/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-foreground">الختم المعتمد (للشهادات والفواتير)</span>
                      {systemSettings.stampUrl && (
                        <button
                          onClick={() => { updateSettings({ stampUrl: "" }); toast.info("تمت إزالة الختم"); }}
                          className="text-[11px] font-bold text-danger hover:underline"
                        >
                          إزالة الختم
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-red-500/30 bg-red-500/5 flex items-center justify-center overflow-hidden shrink-0">
                        {systemSettings.stampUrl ? (
                          <img src={systemSettings.stampUrl} alt="Stamp" className="h-full w-full object-contain p-1 rotate-[-6deg]" />
                        ) : (
                          <div className="h-16 w-16 rounded-full border border-dashed border-red-400 text-red-500/60 flex items-center justify-center text-[10px] font-black rotate-[-12deg]">
                            ختم رسمي
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 flex-1">
                        <label className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-card hover:bg-accent px-4 text-xs font-bold text-foreground transition-all cursor-pointer shadow-xs">
                          <Upload className="h-3.5 w-3.5 text-primary" />
                          <span>رفع صورة الختم</span>
                          <input type="file" accept="image/*" onChange={handleStampUpload} className="hidden" />
                        </label>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                          صورة الختم الدائري أو البيضاوي بدقة عالية وخلفية مفرغة.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Field label="تذييل المطبوعات والوثائق الرسمي الافتراضي">
                    <input
                      value={systemSettings.footerText}
                      onChange={(e) => updateSettings({ footerText: e.target.value })}
                      className={inp}
                      placeholder="هذه الوثيقة رسمية ومستخرجة إلكترونياً من منصة مدارس"
                    />
                  </Field>
                </div>

                {/* Live Preview Button */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <div className="font-black text-sm text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>المعاينة المباشرة للترويسة والمطبوعات الرسمية (A4)</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      تأكد من شكل الشعار، الختم، والباركود الرقمي كما سيظهر للطالب وولي الأمر عند الطباعة
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPrintPreviewOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md shadow-primary/20 shrink-0"
                  >
                    <Eye className="h-4 w-4" /> فتح المعاينة الحية (A4)
                  </button>
                </div>
              </div>
            </PageCard>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: Facilities & Assets */}
          {/* ========================================================================= */}
          {tab === "facilities" && (
            <PageCard
              title="إدارة المرافق والقاعات والأصول"
              description="إعداد تصنيفات القاعات والمستودع، تنبيهات الصيانة الوقائية، وسياسات ترقيم الأصول"
            >
              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <TagManagerField
                    label="تصنيفات القاعات والمرافق المعتمدة"
                    description="التصنيفات المتاحة عند إضافة غرف أو معامل جديدة"
                    tagsString={systemSettings.roomCategories}
                    onUpdate={(newStr) => updateSettings({ roomCategories: newStr })}
                  />

                  <TagManagerField
                    label="تصنيفات الأصول والممتلكات"
                    description="تبويب أجهزة وأثاث المدرسة في سجل العهد"
                    tagsString={systemSettings.assetCategories}
                    onUpdate={(newStr) => updateSettings({ assetCategories: newStr })}
                  />

                  <Field label="نظام ترقيم القاعات والغرف">
                    <select
                      className={inp}
                      value={systemSettings.roomNumbering}
                      onChange={(e) => updateSettings({ roomNumbering: e.target.value })}
                    >
                      <option>ترقيم تلقائي ذكي (RM-XXXX)</option>
                      <option>ترقيم يدوي مخصص من الإدارة</option>
                      <option>ترقيم حسب المبنى والطابق (B1-F1-01)</option>
                    </select>
                  </Field>

                  <Field label="تنبيهات الصيانة الوقائية المبكرة">
                    <select
                      className={inp}
                      value={systemSettings.maintenanceAlert}
                      onChange={(e) => updateSettings({ maintenanceAlert: e.target.value })}
                    >
                      <option>مفعل (قبل 7 أيام من الموعد)</option>
                      <option>مفعل (قبل 3 أيام من الموعد)</option>
                      <option>مفعل (قبل 24 ساعة)</option>
                      <option>معطل</option>
                    </select>
                  </Field>
                </div>

                <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-4">
                  <div className="flex items-center gap-2 font-black text-sm text-foreground">
                    <Building className="h-4 w-4 text-primary" />
                    <span>سياسات المستودع المركزي وجرد العهد</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="حد التنبيه للمخزون المنخفض (قطع)">
                      <input
                        type="number"
                        className={inp}
                        value={systemSettings.inventoryAlertLimit}
                        onChange={(e) => updateSettings({ inventoryAlertLimit: Math.max(0, parseInt(e.target.value) || 0) })}
                      />
                    </Field>
                    <Field label="طريقة احتساب تكلفة وجرد المخزون">
                      <select
                        className={inp}
                        value={systemSettings.inventoryMethod}
                        onChange={(e) => updateSettings({ inventoryMethod: e.target.value })}
                      >
                        <option>FIFO (ما يدخل أولاً يخرج أولاً)</option>
                        <option>LIFO (ما يدخل آخراً يخرج أولاً)</option>
                        <option>المتوسط المرجح (Weighted Average)</option>
                      </select>
                    </Field>
                  </div>
                </div>
              </div>
            </PageCard>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: Academic Years & Calendar */}
          {/* ========================================================================= */}
          {tab === "academic" && (
            <PageCard
              title="السنوات والتقويم الأكاديمي"
              description="تعيين السنة الأكاديمية الحالية، مواعيد الدوام الشتوي والصيفي، وقواعد الغياب"
            >
              <div className="space-y-6">
                <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-foreground block">السنة الأكاديمية النشطة حالياً للمنصة</label>
                    <div className="text-xs text-muted-foreground">تعتمد كافة الفصول والجداول والدرجات على هذه السنة المحددة</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="h-10 rounded-xl border border-primary/30 bg-background px-3 text-xs font-black text-primary outline-none focus:ring-2 focus:ring-primary/20"
                      value={allAcademicYears.find(y => y.isCurrent)?.id || allAcademicYears[0]?.id || ""}
                      onChange={(e) => handleSelectAcademicYear(e.target.value)}
                    >
                      {allAcademicYears.map((y) => (
                        <option key={y.id} value={y.id}>
                          {y.name} {y.isCurrent ? "★ (السنة النشطة)" : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setIsAddYearOpen(true)}
                      className="inline-flex h-10 items-center gap-1.5 px-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-xs"
                    >
                      <Plus className="h-4 w-4" /> سنة جديدة
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="بداية الدوام الشتوي (اصطفاف الطابور)">
                    <input
                      type="time"
                      value={systemSettings.winterTime}
                      onChange={(e) => updateSettings({ winterTime: e.target.value })}
                      className={inp}
                    />
                  </Field>
                  <Field label="بداية الدوام الصيفي (اصطفاف الطابور)">
                    <input
                      type="time"
                      value={systemSettings.summerTime}
                      onChange={(e) => updateSettings({ summerTime: e.target.value })}
                      className={inp}
                    />
                  </Field>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <h3 className="font-black text-sm text-foreground">قواعد الغياب والانضباط المدرسي</h3>
                  <div className="space-y-3">
                    <SwitchField
                      title="احتساب التأخر عن الاصطفاف الصباحي كغياب جزئي"
                      description="يتم تسجيل ربع حصة غياب تلقائياً عند التأخر لأكثر من 15 دقيقة بعد الطابور"
                      checked={systemSettings.lateAsPartialAbsence}
                      onChange={(checked) => updateSettings({ lateAsPartialAbsence: checked })}
                    />
                    <SwitchField
                      title="خصم درجات السلوك والمواظبة آلياً"
                      description="تطبيق الخصم اللائحي المعتمد تلقائياً عند تجاوز غياب الطالب 10 أيام بدون عذر رسمي"
                      checked={systemSettings.deductBehaviorOnAbsence}
                      onChange={(checked) => updateSettings({ deductBehaviorOnAbsence: checked })}
                    />
                  </div>
                </div>
              </div>
            </PageCard>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: Admissions & Registration */}
          {/* ========================================================================= */}
          {tab === "admission" && (
            <PageCard
              title="سياسات القبول والتسجيل"
              description="حالة التسجيل للعام القادم، السعة الاستيعابية للفصول، والمستندات الإلزامية"
            >
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="حالة القبول والتسجيل الإلكتروني الحالية">
                    <select
                      className={inp}
                      value={systemSettings.admissionStatus}
                      onChange={(e) => updateSettings({ admissionStatus: e.target.value })}
                    >
                      <option>مفتوح للتسجيل الإلكتروني المباشر</option>
                      <option>مفتوح لقائمة الانتظار والمفاضلة فقط</option>
                      <option>مغلق (تم الوصول للسعة الاستيعابية القصوى)</option>
                    </select>
                  </Field>
                  <Field label="الحد الأقصى للطلاب في كل فصل دراسي">
                    <input
                      type="number"
                      value={systemSettings.maxClassSize}
                      onChange={(e) => updateSettings({ maxClassSize: Math.max(1, parseInt(e.target.value) || 25) })}
                      className={inp}
                    />
                  </Field>
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="font-black text-sm text-foreground mb-3">المستندات الإلزامية المطلوبة لإتمام القبول</h3>
                  <div className="space-y-3">
                    <SwitchField
                      title="أصل شهادة الميلاد للمطابقة"
                      checked={systemSettings.reqBirthCert}
                      onChange={(checked) => updateSettings({ reqBirthCert: checked })}
                    />
                    <SwitchField
                      title="سجل التطعيمات والفحص الطبي المعتمد"
                      checked={systemSettings.reqVaccine}
                      onChange={(checked) => updateSettings({ reqVaccine: checked })}
                    />
                    <SwitchField
                      title="شهادة النجاح وتقرير الدرجات من المدرسة السابقة"
                      checked={systemSettings.reqPrevCert}
                      onChange={(checked) => updateSettings({ reqPrevCert: checked })}
                    />
                    <SwitchField
                      title="صورة سجل الأسرة / كرت العائلة للمطابقة"
                      checked={systemSettings.reqFamilyCard}
                      onChange={(checked) => updateSettings({ reqFamilyCard: checked })}
                    />
                  </div>
                </div>
              </div>
            </PageCard>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: Human Resources Policies */}
          {/* ========================================================================= */}
          {tab === "hr" && (
            <PageCard
              title="سياسات الكادر والموارد البشرية"
              description="ضوابط الإجازات السنوية، خصومات التأخير، وربط أجهزة البصمة الذكية"
            >
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="رصيد الإجازة السنوية الافتراضي (أيام)">
                    <input
                      type="number"
                      value={systemSettings.annualLeaveDays}
                      onChange={(e) => updateSettings({ annualLeaveDays: Math.max(0, parseInt(e.target.value) || 0) })}
                      className={inp}
                    />
                  </Field>
                  <Field label="نسبة خصم التأخير اليومي عن الراتب (%)">
                    <input
                      type="number"
                      value={systemSettings.lateDeductionRate}
                      onChange={(e) => updateSettings({ lateDeductionRate: Math.max(0, parseInt(e.target.value) || 0) })}
                      className={inp}
                    />
                  </Field>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <h3 className="font-black text-sm text-foreground">قواعد الحضور والانصراف الذكي</h3>
                  <div className="space-y-3">
                    <SwitchField
                      title="السماح بفترة سماح صباحية 15 دقيقة"
                      description="عدم احتساب تأخير على الموظف في حال الحضور خلال أول 15 دقيقة من بداية الدوام"
                      checked={systemSettings.gracePeriod}
                      onChange={(checked) => updateSettings({ gracePeriod: checked })}
                    />
                    <SwitchField
                      title="المزامنة التلقائية مع أجهزة البصمة البيومترية"
                      description="ترحيل سجلات الحضور والانصراف تلقائياً لمسير الرواتب الشهري"
                      checked={systemSettings.fingerprintSync}
                      onChange={(checked) => updateSettings({ fingerprintSync: checked })}
                    />
                  </div>
                </div>
              </div>
            </PageCard>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: Financial Settings */}
          {/* ========================================================================= */}
          {tab === "finance" && (
            <PageCard
              title="السياسات والعمليات المالية"
              description="العملة الرسمية، نسبة الضريبة المضافة، سياسة الاسترداد، وأتمتة مسارات المحاسبة"
            >
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="العملة الرسمية المعتمدة للمنصة">
                    <input
                      value={currency}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCurrency(val);
                      }}
                      placeholder="مثال: ر.س أو ج.س أو $"
                      className={inp}
                    />
                  </Field>
                  <Field label="الرقم الضريبي الموحد للمنشأة (VAT Number)">
                    <input
                      value={systemSettings.taxNumber}
                      onChange={(e) => updateSettings({ taxNumber: e.target.value })}
                      className={inp}
                      placeholder="300012345600003"
                    />
                  </Field>
                  <Field label="نسبة ضريبة القيمة المضافة (%)">
                    <input
                      type="number"
                      value={systemSettings.vatRate}
                      onChange={(e) => updateSettings({ vatRate: Math.max(0, parseInt(e.target.value) || 0) })}
                      className={inp}
                    />
                  </Field>
                  <Field label="سياسة الاسترداد والإلغاء المالي">
                    <select
                      className={inp}
                      value={systemSettings.refundPolicy}
                      onChange={(e) => updateSettings({ refundPolicy: e.target.value })}
                    >
                      <option>خلال 14 يوماً من تاريخ سداد القسط</option>
                      <option>قبل بداية الفصل الدراسي فقط</option>
                      <option>استرداد جزئي (حسم 20% رسوم إدارية)</option>
                      <option>لا يوجد استرداد نقدي بعد التسجيل</option>
                    </select>
                  </Field>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <h3 className="font-black text-sm text-foreground">أتمتة العمليات والتقاطعات المالية</h3>
                  <div className="space-y-3">
                    <SwitchField
                      title="ترحيل مسير الرواتب آلياً إلى قسم المصروفات"
                      description="عند اعتماد مسير الرواتب الشهري يتم إنشاء سندات صرف محاسبية بصورة تلقائية"
                      checked={systemSettings.autoTransferPayroll}
                      onChange={(checked) => updateSettings({ autoTransferPayroll: checked })}
                    />
                    <SwitchField
                      title="قيد تكاليف صيانة المرافق تلقائياً كمصروف"
                      description="متصل مباشرة بقسم المرافق عند إغلاق أمر صيانة منجز"
                      checked={systemSettings.autoMaintenanceExpense}
                      onChange={(checked) => updateSettings({ autoMaintenanceExpense: checked })}
                    />
                    <SwitchField
                      title="إضافة غرامات التأخير في إعادة الكتب الدراسية كرسوم"
                      description="متصل مباشرة بنظام استعارات المكتبة عند التأخر عن موعد الإرجاع"
                      checked={systemSettings.autoLibraryFee}
                      onChange={(checked) => updateSettings({ autoLibraryFee: checked })}
                    />
                  </div>
                </div>
              </div>
            </PageCard>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: Theme & Appearance */}
          {/* ========================================================================= */}
          {tab === "theme" && (
            <PageCard
              title="تخصيص الثيم والمظهر البصري"
              description="اختيار وضع الألوان المفضل، لوحة الألوان الأساسية للنظام، ونمط كثافة الجداول"
            >
              <div className="space-y-6">
                <div>
                  <h3 className="font-black text-xs text-muted-foreground mb-3">1. وضع العرض الرئيسي (Mode)</h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { id: "light", label: "الوضع الفاتح (Light)" },
                      { id: "dark", label: "الوضع الداكن (Dark)" },
                      { id: "system", label: "متزامن مع نظام التشغيل" }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          updateSettings({ themeMode: m.id as any });
                          toast.success(`تم تفعيل: ${m.label}`);
                        }}
                        className={`p-4 rounded-2xl border text-right transition-all flex items-center justify-between ${
                          systemSettings.themeMode === m.id
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border hover:border-primary/40 bg-card"
                        }`}
                      >
                        <span className="font-bold text-xs">{m.label}</span>
                        {systemSettings.themeMode === m.id && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="font-black text-xs text-muted-foreground mb-3">2. لوحة الألوان الأساسية للنظام (Primary Accent)</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {THEME_PALETTES.map((color) => {
                      const isSelected = systemSettings.primaryColor === color.hex;
                      return (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => {
                            updateSettings({ primaryColor: color.hex });
                            document.documentElement.style.setProperty("--primary", color.hex);
                            toast.success(`تم اختيار اللون: ${color.name}`);
                          }}
                          className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                            isSelected
                              ? "border-foreground bg-accent shadow-sm scale-[1.02]"
                              : "border-border hover:border-primary/50 bg-card"
                          }`}
                        >
                          <span
                            className="h-6 w-6 rounded-full shrink-0 shadow-xs border border-white/20 flex items-center justify-center text-white"
                            style={{ backgroundColor: color.hex }}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </span>
                          <span className="text-xs font-bold">{color.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-border pt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="كثافة وحجم الجداول البيانية">
                    <select
                      className={inp}
                      value={systemSettings.tableDensity || "comfortable"}
                      onChange={(e) => updateSettings({ tableDensity: e.target.value as any })}
                    >
                      <option value="comfortable">كثافة مريحة (Comfortable - مساحات أوسع)</option>
                      <option value="compact">كثافة عالية (Compact - عرض بيانات أكثر)</option>
                    </select>
                  </Field>
                  <Field label="الخط العربي الرئيسي لواجهة المنصة">
                    <select
                      className={inp}
                      value={systemSettings.fontFamily || "Cairo"}
                      onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                    >
                      <option value="Cairo">خط القاهرة (Cairo) - حديث ورسمي</option>
                      <option value="Tajawal">خط تجوال (Tajawal) - هندسي متناسق</option>
                      <option value="IBM Plex Sans Arabic">IBM Plex Sans - تقني احترافي</option>
                    </select>
                  </Field>
                </div>
              </div>
            </PageCard>
          )}

          {/* ========================================================================= */}
          {/* TAB 9: Language, Calendar & Direction */}
          {/* ========================================================================= */}
          {tab === "lang" && (
            <PageCard
              title="اللغة والتقويم والاتجاه"
              description="لغة النظام الرسمية، التنسيق الزمني، والتقويم المعتمد"
            >
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="لغة واجهة النظام الرئيسية">
                    <select
                      className={inp}
                      value={systemSettings.language}
                      onChange={(e) => updateSettings({ language: e.target.value as "ar" | "en" })}
                    >
                      <option value="ar">العربية (RTL - اليمين لليسار)</option>
                      <option value="en">English (LTR - Left to Right)</option>
                    </select>
                  </Field>
                  <Field label="نظام التقويم المعتمد">
                    <select
                      className={inp}
                      value={systemSettings.calendarType || "dual"}
                      onChange={(e) => updateSettings({ calendarType: e.target.value as any })}
                    >
                      <option value="dual">مزدوج (هجري وميلادي معاً)</option>
                      <option value="hijri">التقويم الهجري (أم القرى)</option>
                      <option value="gregorian">التقويم الميلادي (Gregorian)</option>
                    </select>
                  </Field>
                  <Field label="صيغة عرض التواريخ">
                    <select
                      className={inp}
                      value={systemSettings.dateFormat}
                      onChange={(e) => updateSettings({ dateFormat: e.target.value })}
                    >
                      <option value="DD/MM/YYYY">يوم / شهر / سنة (DD/MM/YYYY)</option>
                      <option value="YYYY-MM-DD">سنة - شهر - يوم (YYYY-MM-DD)</option>
                    </select>
                  </Field>
                  <Field label="بداية الأسبوع الدراسي">
                    <select className={inp} defaultValue="الأحد">
                      <option value="الأحد">يوم الأحد (المعتمد في الخليج والمملكة)</option>
                      <option value="السبت">يوم السبت</option>
                      <option value="الاثنين">يوم الاثنين (النظام الدولي)</option>
                    </select>
                  </Field>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/60 text-xs font-bold text-muted-foreground border border-border">
                  💡 يتم تطبيق اتجاه الواجهة (RTL/LTR) تلقائياً عند تغيير اللغة لتوفير تجربة مستخدم سلسة ومتكاملة.
                </div>
              </div>
            </PageCard>
          )}

          {/* ========================================================================= */}
          {/* TAB 10: Print Templates */}
          {/* ========================================================================= */}
          {tab === "print" && (
            <PageCard
              title="قوالب الطباعة والتحقق الرقمي"
              description="إعدادات كشوفات الدرجات، الفواتير المطبوعة، ورموز التحقق الرقمي QR"
            >
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="القالب الافتراضي لكشوفات البيانات">
                    <select
                      className={inp}
                      value={systemSettings.defaultTemplate}
                      onChange={(e) => updateSettings({ defaultTemplate: e.target.value })}
                    >
                      <option>جدول مضغوط مع تكرار الترويسة الرسمية</option>
                      <option>جدول رسمي معتمد مع فراغات التوقيعات</option>
                      <option>بطاقات فردية لكل طالب</option>
                    </select>
                  </Field>
                  <Field label="عدد الصفوف لكل دفعة طباعة">
                    <select
                      className={inp}
                      value={systemSettings.rowsPerBatch}
                      onChange={(e) => updateSettings({ rowsPerBatch: e.target.value })}
                    >
                      <option>60 صف بالصفحة</option>
                      <option>90 صف بالصفحة</option>
                      <option>120 صف بالصفحة</option>
                    </select>
                  </Field>
                  <Field label="اعتماد رمز التحقق الذكي QR">
                    <select
                      className={inp}
                      value={systemSettings.qrCodeUsage}
                      onChange={(e) => updateSettings({ qrCodeUsage: e.target.value })}
                    >
                      <option>مفعل لكافة الشهادات والفواتير الرسمية</option>
                      <option>مفعل للشهادات الأكاديمية فقط</option>
                      <option>معطل</option>
                    </select>
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-border p-4 space-y-3 bg-card/60">
                    <div className="flex items-center gap-2 font-black text-sm text-foreground">
                      <FileText className="h-4 w-4 text-primary" />
                      <span>ترويسة المستند الرسمية</span>
                    </div>
                    <Field label="اسم الجهة الوزارية أعلى المستند">
                      <input
                        className={inp}
                        value={systemSettings.headerEntity}
                        onChange={(e) => updateSettings({ headerEntity: e.target.value })}
                      />
                    </Field>
                    <Field label="اسم الإدارة التعليمية التابع لها">
                      <input
                        className={inp}
                        value={systemSettings.headerDepartment}
                        onChange={(e) => updateSettings({ headerDepartment: e.target.value })}
                      />
                    </Field>
                  </div>

                  <div className="rounded-2xl border border-border p-4 space-y-3 bg-card/60">
                    <div className="flex items-center gap-2 font-black text-sm text-foreground">
                      <QrCode className="h-4 w-4 text-primary" />
                      <span>ضوابط التحقق الرقمي</span>
                    </div>
                    <Field label="رابط بوابة التحقق العامة">
                      <input
                        className={inp}
                        dir="ltr"
                        value={systemSettings.qrVerifyUrl}
                        onChange={(e) => updateSettings({ qrVerifyUrl: e.target.value })}
                      />
                    </Field>
                    <Field label="صلاحية رابط التحقق">
                      <select
                        className={inp}
                        value={systemSettings.qrExpiry}
                        onChange={(e) => updateSettings({ qrExpiry: e.target.value })}
                      >
                        <option>سنة كاملة</option>
                        <option>90 يوماً</option>
                        <option>دائم (لا تنتهي الصلاحية)</option>
                      </select>
                    </Field>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setIsPrintPreviewOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md shadow-primary/20"
                  >
                    <Eye className="h-4 w-4" /> فتح نافذة المعاينة الحية (A4)
                  </button>
                </div>
              </div>
            </PageCard>
          )}

          {/* ========================================================================= */}
          {/* TAB 11: Notification Center */}
          {/* ========================================================================= */}
          {tab === "notif" && (
            <PageCard
              title="قواعد الإشعارات والرسائل التلقائية"
              description="تخصيص قنوات التنبيه اللحظي (SMS، WhatsApp، والبريد) لجميع أحداث المنصة"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border">
                  <div>
                    <div className="font-black text-sm text-foreground">قنوات التنبيه النشطة</div>
                    <div className="text-xs text-muted-foreground mt-0.5">حدد القنوات المسموح للمنظومة استخدامها في المراسلات</div>
                  </div>
                  <button
                    onClick={() => setIsNotifTesterOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-sm"
                  >
                    <Smartphone className="h-3.5 w-3.5" /> فتح مختبر الرسائل
                  </button>
                </div>

                <div className="space-y-3">
                  <SwitchField
                    title="إرسال رسالة SMS فورية لولي الأمر عند تسجيل غياب الطالب"
                    description="يتم الإرسال فور تثبيت جلسة الحضور الصباحية للطالب"
                    checked={systemSettings.defaultChannels.sms}
                    onChange={(checked) =>
                      updateSettings({ defaultChannels: { ...systemSettings.defaultChannels, sms: checked } })
                    }
                  />
                  <SwitchField
                    title="إشعار المدير العام وإدارة المرافق بطلبات الصيانة العاجلة"
                    description="تنبيه Push Notification لحظي في شريط إشعارات المنصة وتطبيق الإدارة"
                    checked={systemSettings.defaultChannels.push}
                    onChange={(checked) =>
                      updateSettings({ defaultChannels: { ...systemSettings.defaultChannels, push: checked } })
                    }
                  />
                  <SwitchField
                    title="إرسال فاتورة إلكترونية معتمدة عبر البريد عند إصدار مطالبة مالية"
                    description="تتضمن الفاتورة تفاصيل القسط ورابط السداد الإلكتروني المباشر"
                    checked={systemSettings.defaultChannels.email}
                    onChange={(checked) =>
                      updateSettings({ defaultChannels: { ...systemSettings.defaultChannels, email: checked } })
                    }
                  />
                </div>
              </div>
            </PageCard>
          )}

          {/* ========================================================================= */}
          {/* TAB 12: Roles & Permissions */}
          {/* ========================================================================= */}
          {tab === "roles" && (
            <PageCard
              title="إعدادات الصلاحيات الافتراضية"
              description="تعيين الأدوار الافتراضية للموظفين الجدد وضوابط الوصول للمنصة"
            >
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="الصلاحية الافتراضية للموظف الجديد">
                    <select
                      className={inp}
                      value={systemSettings.defaultStaffRole || "معلم (صلاحيات تدريس فقط)"}
                      onChange={(e) => updateSettings({ defaultStaffRole: e.target.value })}
                    >
                      <option>معلم (صلاحيات تدريس فقط)</option>
                      <option>إداري (بدون مالية)</option>
                      <option>موظف استقبال واستعلامات</option>
                      <option>مشرف تربوي</option>
                    </select>
                  </Field>
                </div>

                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                  <h4 className="font-black text-sm text-primary">إدارة مصفوفة الصلاحيات المتقدمة</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    لتخصيص أدق التفاصيل لكل دور وصلاحيات القراءة، التعديل، الحذف، والاعتماد المالي لكل شاشة، يرجى الانتقال إلى إدارة الأدوار والصلاحيات.
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <Link
                      to="/admin/permissions"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-sm"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" /> الانتقال لمدير الصلاحيات
                    </Link>
                    <Link
                      to="/admin/roles"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent"
                    >
                      إدارة الأدوار
                    </Link>
                  </div>
                </div>
              </div>
            </PageCard>
          )}

          {/* ========================================================================= */}
          {/* TAB 13: Backup & Cloud Sync */}
          {/* ========================================================================= */}
          {tab === "backup" && (
            <PageCard
              title="جدولة وإدارة النسخ الاحتياطي"
              description="أتمتة النسخ الدوري لقاعدة البيانات، خيارات التخزين السحابي، والنسخ الفوري"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border">
                  <div>
                    <div className="font-black text-sm text-foreground">النسخ الاحتياطي الفوري</div>
                    <div className="text-xs text-muted-foreground mt-0.5">توليد لقطة شاملة لقاعدة البيانات وحفظها على جهازك الآن</div>
                  </div>
                  <button
                    onClick={() => setIsBackupOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md shadow-primary/20"
                  >
                    <HardDrive className="h-4 w-4" /> فتح نافذة النسخ والاستعادة
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="تكرار النسخ الاحتياطي التلقائي">
                    <select
                      className={inp}
                      value={systemSettings.backupFrequency || "يومياً (الساعة 02:00 صباحاً)"}
                      onChange={(e) => updateSettings({ backupFrequency: e.target.value })}
                    >
                      <option>يومياً (الساعة 02:00 صباحاً)</option>
                      <option>أسبوعياً (كل يوم جمعة)</option>
                      <option>كل 12 ساعة</option>
                    </select>
                  </Field>
                  <Field label="مدة الاحتفاظ بالنسخ">
                    <select
                      className={inp}
                      value={systemSettings.backupRetention || "30 يوماً"}
                      onChange={(e) => updateSettings({ backupRetention: e.target.value })}
                    >
                      <option>30 يوماً</option>
                      <option>60 يوماً</option>
                      <option>90 يوماً</option>
                      <option>دائماً (عدم حذف النسخ)</option>
                    </select>
                  </Field>
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="font-black text-sm text-foreground mb-3">وجهات وخيارات التخزين</h4>
                  <div className="space-y-3">
                    <SwitchField
                      title="التخزين المحلي على خادم المدرسة الداخلي"
                      checked={systemSettings.backupStorage?.local ?? true}
                      onChange={(checked) =>
                        updateSettings({ backupStorage: { ...systemSettings.backupStorage, local: checked } as any })
                      }
                    />
                    <SwitchField
                      title="المزامنة السحابية مع Google Drive"
                      checked={systemSettings.backupStorage?.cloud ?? true}
                      onChange={(checked) =>
                        updateSettings({ backupStorage: { ...systemSettings.backupStorage, cloud: checked } as any })
                      }
                    />
                    <SwitchField
                      title="المزامنة المشفرة مع Amazon S3"
                      checked={systemSettings.backupStorage?.s3 ?? false}
                      onChange={(checked) =>
                        updateSettings({ backupStorage: { ...systemSettings.backupStorage, s3: checked } as any })
                      }
                    />
                  </div>
                </div>
              </div>
            </PageCard>
          )}

          {/* ========================================================================= */}
          {/* TAB 14: Third Party Integrations */}
          {/* ========================================================================= */}
          {tab === "integrations" && (
            <PageCard
              title="تطبيقات الربط والطرف الثالث (Integrations)"
              description="الربط مع منصة نور، بوابات الدفع الإلكتروني، ومزودي رسائل SMS و WhatsApp"
            >
              <div className="space-y-6">
                {/* Noor System */}
                <div className="p-4 border border-border rounded-2xl bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-foreground">منصة نور (وزارة التعليم السعودية)</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">مزامنة الطلاب، الغياب اليومي، ونتائج الاختبارات الرسمية</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-xl border border-emerald-500/20">
                      متصل ونشط
                    </span>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setIsImporterOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 shadow-xs"
                    >
                      <Database className="h-3.5 w-3.5" /> مطابقة بيانات نور
                    </button>
                    <button
                      onClick={() => setIsExporterOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-accent text-xs font-bold"
                    >
                      <Download className="h-3.5 w-3.5" /> تصدير بنسق نور
                    </button>
                  </div>
                </div>

                {/* Payment Gateway */}
                <div className="p-4 border border-border rounded-2xl bg-card space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-foreground">بوابة الدفع الإلكتروني (Online Payments)</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">تحصيل الرسوم المدرسية إلكترونياً عبر مدى، فيزا، وماستركارد</p>
                    </div>
                    <select
                      className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-bold outline-none"
                      value={systemSettings.paymentGateway}
                      onChange={(e) => updateSettings({ paymentGateway: e.target.value })}
                    >
                      <option value="none">غير مفعل</option>
                      <option value="stripe">Stripe</option>
                      <option value="paytabs">PayTabs</option>
                      <option value="urpay">Urpay</option>
                    </select>
                  </div>

                  {systemSettings.paymentGateway === "stripe" && (
                    <div className="grid gap-4 md:grid-cols-2 pt-3 border-t border-border">
                      <Field label="Stripe Public Key">
                        <input
                          dir="ltr"
                          className={inp}
                          value={systemSettings.stripePubKey || ""}
                          onChange={(e) => updateSettings({ stripePubKey: e.target.value })}
                          placeholder="pk_test_..."
                        />
                      </Field>
                      <Field label="Stripe Secret Key">
                        <input
                          type="password"
                          dir="ltr"
                          className={inp}
                          value={systemSettings.stripeSecretKey || ""}
                          onChange={(e) => updateSettings({ stripeSecretKey: e.target.value })}
                          placeholder="sk_test_..."
                        />
                      </Field>
                    </div>
                  )}

                  {systemSettings.paymentGateway === "paytabs" && (
                    <div className="grid gap-4 md:grid-cols-2 pt-3 border-t border-border">
                      <Field label="PayTabs Profile ID">
                        <input
                          dir="ltr"
                          className={inp}
                          value={systemSettings.paytabsProfileId || ""}
                          onChange={(e) => updateSettings({ paytabsProfileId: e.target.value })}
                          placeholder="12345"
                        />
                      </Field>
                      <Field label="PayTabs Server Key">
                        <input
                          type="password"
                          dir="ltr"
                          className={inp}
                          value={systemSettings.paytabsServerKey || ""}
                          onChange={(e) => updateSettings({ paytabsServerKey: e.target.value })}
                          placeholder="STJ..."
                        />
                      </Field>
                    </div>
                  )}
                </div>

                {/* SMS Provider */}
                <div className="p-4 border border-border rounded-2xl bg-card space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-foreground">مزود رسائل SMS المعتمد</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">لإرسال إشعارات الغياب والمطالبات المالية الفورية</p>
                    </div>
                    <select
                      className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-bold outline-none"
                      value={systemSettings.smsProvider || "none"}
                      onChange={(e) => updateSettings({ smsProvider: e.target.value })}
                    >
                      <option value="none">غير مفعل</option>
                      <option value="twilio">Twilio</option>
                      <option value="unifonic">Unifonic (يونيفونك)</option>
                      <option value="4jawaly">4jawaly (فور جوالي)</option>
                    </select>
                  </div>
                </div>
              </div>
            </PageCard>
          )}

          {/* ========================================================================= */}
          {/* TAB 15: Mobile App & Parent Portal */}
          {/* ========================================================================= */}
          {tab === "mobile" && (
            <PageCard
              title="تطبيق الهاتف وبوابة ولي الأمر"
              description="ضوابط تطبيق الهواتف الذكية، سياسات الخصوصية، وبطاقات الدخول"
            >
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { title: "بوابة ولي الأمر", desc: "فواتير، نتائج، ونقل مدرسي", status: "مفعل" },
                    { title: "تطبيق المعلم", desc: "رصد الحضور والواجبات والدرجات", status: "مفعل" },
                    { title: "تطبيق الإدارة", desc: "اعتمادات وتنبيهات مالية وإدارية", status: "نشط" },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-border p-4 bg-card/60">
                      <div className="mb-2 flex items-center justify-between">
                        <Smartphone className="h-5 w-5 text-primary" />
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                          {item.status}
                        </span>
                      </div>
                      <div className="font-black text-sm">{item.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center p-4 rounded-2xl bg-primary/5 border border-primary/20">
                  <div>
                    <div className="font-black text-sm text-foreground">رمز الربط السريع (QR Code)</div>
                    <div className="text-xs text-muted-foreground">امسح الرمز لربط تطبيق الهاتف بالمدرسة فوراً</div>
                  </div>
                  <button
                    onClick={() => setIsMobileConnectOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
                  >
                    <QrCode className="h-4 w-4" /> استخراج رمز الربط QR
                  </button>
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="font-black text-sm text-foreground mb-3">قواعد الخصوصية وحماية بيانات الهاتف</h4>
                  <div className="space-y-3">
                    <SwitchField
                      title="ولي الأمر يرى أبناءه فقط حسب رقم الهوية والجوال المعتمد"
                      checked={systemSettings.parentViewLimit}
                      onChange={(checked) => updateSettings({ parentViewLimit: checked })}
                    />
                    <SwitchField
                      title="المعلم يرى المواد والشعب المسندة إليه فقط"
                      checked={systemSettings.teacherViewLimit}
                      onChange={(checked) => updateSettings({ teacherViewLimit: checked })}
                    />
                    <SwitchField
                      title="حجب البيانات المالية عن الكادر غير المخول"
                      checked={systemSettings.hideFinancial}
                      onChange={(checked) => updateSettings({ hideFinancial: checked })}
                    />
                    <SwitchField
                      title="تسجيل كل عملية دخول وإجراء من الهاتف في سجل الأنشطة المركزي"
                      checked={systemSettings.logMobileActivity}
                      onChange={(checked) => updateSettings({ logMobileActivity: checked })}
                    />
                  </div>
                </div>
              </div>
            </PageCard>
          )}

          {/* ========================================================================= */}
          {/* TAB 16: API & Webhooks */}
          {/* ========================================================================= */}
          {tab === "api" && (
            <PageCard
              title="المفاتيح البرمجية والربط المتقدم (API & Webhooks)"
              description="إدارة مفاتيح الربط البرمجي، عناوين Webhook، ومعدل استدعاء الطلبات"
            >
              <div className="space-y-6">
                {/* API Key Box */}
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-black text-sm text-foreground">مفتاح API الحي الرئيسي</div>
                      <div className="text-xs text-muted-foreground">يستخدم لمزامنة التطبيقات والربط البرمجي الآمن</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(systemSettings.apiKey);
                          toast.success("تم نسخ مفتاح API للحافظة");
                        }}
                        className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border bg-background hover:bg-accent text-xs font-bold"
                      >
                        <Copy className="h-3.5 w-3.5" /> نسخ
                      </button>
                      <button
                        onClick={() => {
                          const newKey = `sk_live_school_${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
                          updateSettings({ apiKey: newKey });
                          toast.success("تم تدوير وتوليد مفتاح API جديد بنجاح");
                        }}
                        className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
                      >
                        <RefreshCcw className="h-3.5 w-3.5" /> تدوير المفتاح
                      </button>
                    </div>
                  </div>
                  <input
                    value={systemSettings.apiKey}
                    readOnly
                    dir="ltr"
                    className="h-10 w-full rounded-xl border border-border bg-muted/30 px-3 font-mono text-xs font-black text-foreground outline-none"
                  />
                </div>

                {/* Webhooks Section */}
                <div className="rounded-2xl border border-border p-4 space-y-4 bg-card/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-sm text-foreground">
                      <Webhook className="h-4 w-4 text-primary" />
                      <span>إرسال الأحداث اللحظية (Webhooks)</span>
                    </div>
                    <button
                      onClick={() => setIsWebhookTesterOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-sm"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> فتح مختبر الأحداث
                    </button>
                  </div>

                  <Field label="رابط استقبال الأحداث (Webhook Endpoint URL)">
                    <input
                      className={inp}
                      dir="ltr"
                      value={systemSettings.webhookUrl}
                      onChange={(e) => updateSettings({ webhookUrl: e.target.value })}
                      placeholder="https://myschool.com/webhooks/listener"
                    />
                  </Field>

                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-black text-muted-foreground">الأحداث المشترك بها:</div>
                    <div className="grid gap-2 sm:grid-cols-2 text-xs font-bold">
                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-background cursor-pointer">
                        <input
                          type="checkbox"
                          checked={systemSettings.whStudentCreated}
                          onChange={(e) => updateSettings({ whStudentCreated: e.target.checked })}
                          className="rounded text-primary h-4 w-4"
                        />
                        <span>student.created (تسجيل طالب)</span>
                      </label>
                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-background cursor-pointer">
                        <input
                          type="checkbox"
                          checked={systemSettings.whInvoicePaid}
                          onChange={(e) => updateSettings({ whInvoicePaid: e.target.checked })}
                          className="rounded text-primary h-4 w-4"
                        />
                        <span>invoice.paid (سداد فاتورة)</span>
                      </label>
                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-background cursor-pointer">
                        <input
                          type="checkbox"
                          checked={systemSettings.whExamUpdated}
                          onChange={(e) => updateSettings({ whExamUpdated: e.target.checked })}
                          className="rounded text-primary h-4 w-4"
                        />
                        <span>exam.grade.updated (اعتماد نتيجة)</span>
                      </label>
                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-background cursor-pointer">
                        <input
                          type="checkbox"
                          checked={systemSettings.whTransportChanged}
                          onChange={(e) => updateSettings({ whTransportChanged: e.target.checked })}
                          className="rounded text-primary h-4 w-4"
                        />
                        <span>transport.subscription.changed</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </PageCard>
          )}

          {/* ========================================================================= */}
          {/* TAB 17: Security & Login Controls */}
          {/* ========================================================================= */}
          {tab === "security" && (
            <PageCard
              title="الأمان وسياسات التحكم بالدخول"
              description="تعقيد كلمات المرور، مهلة تسجيل الخروج التلقائي، والتحقق الثنائي 2FA"
            >
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="سياسة تعقيد كلمة المرور للمستخدمين">
                    <select
                      className={inp}
                      value={systemSettings.passwordPolicy}
                      onChange={(e) => updateSettings({ passwordPolicy: e.target.value })}
                    >
                      <option>معقدة (أحرف كبيرة وصغيرة، أرقام، رموز خاصة)</option>
                      <option>متوسطة (أحرف وأرقام معاً)</option>
                      <option>بسيطة (أرقام فقط - غير مستحسن)</option>
                    </select>
                  </Field>
                  <Field label="مهلة انتهاء الجلسة والخروج التلقائي (Session Timeout)">
                    <select
                      className={inp}
                      value={systemSettings.sessionTimeout}
                      onChange={(e) => updateSettings({ sessionTimeout: e.target.value })}
                    >
                      <option>بعد 30 دقيقة من الخمول</option>
                      <option>بعد ساعة واحدة</option>
                      <option>بعد 4 ساعات</option>
                      <option>لا تسجل خروج تلقائياً</option>
                    </select>
                  </Field>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <h4 className="font-black text-sm text-foreground">الحماية متعددة الطبقات</h4>
                  <div className="space-y-3">
                    <SwitchField
                      title="فرض التحقق بخطوتين (2FA) للإداريين والمحاسبين"
                      description="طلب رمز OTP تأكيدي إضافي عند تسجيل الدخول من أجهزة جديدة"
                      checked={systemSettings.force2FA}
                      onChange={(checked) => updateSettings({ force2FA: checked })}
                    />
                    <SwitchField
                      title="حظر الحساب مؤقتاً بعد 5 محاولات دخول فاشلة متتالية"
                      description="حماية النظام ضد هجمات التخمين والاختراق العشوائي"
                      checked={systemSettings.lockAfter5Fails}
                      onChange={(checked) => updateSettings({ lockAfter5Fails: checked })}
                    />
                  </div>
                </div>
              </div>
            </PageCard>
          )}

          {/* ========================================================================= */}
          {/* TAB 18: Smart Data Importer & Exporter */}
          {/* ========================================================================= */}
          {tab === "data_io" && (
            <PageCard
              title="المستورد والمُصدّر الذكي (Smart Engine)"
              description="استيراد وتصدير مجموعات البيانات الكبيرة لنظام نور، إكسل، وملفات CSV المعتمدة"
            >
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Smart Importer Card */}
                  <div
                    onClick={() => setIsImporterOpen(true)}
                    className="border border-border rounded-2xl p-5 hover:border-primary bg-card/60 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-3 group-hover:scale-105 transition-transform">
                        <ArrowDownToLine className="h-6 w-6" />
                      </div>
                      <h4 className="font-black text-base text-foreground">المستورد الذكي ومطابقة بيانات "نور"</h4>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        رفع ملفات Excel أو CSV لمطابقة الطلاب والمعلمين آلياً، والتحقق من صحة الهويات قبل الاعتماد.
                      </p>
                    </div>
                    <div className="pt-4 flex items-center gap-1.5 text-xs font-black text-primary">
                      <span>فتح نافذة الاستيراد والمطابقة</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  {/* System Exporter Card */}
                  <div
                    onClick={() => setIsExporterOpen(true)}
                    className="border border-border rounded-2xl p-5 hover:border-primary bg-card/60 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-3 group-hover:scale-105 transition-transform">
                        <ArrowUpFromLine className="h-6 w-6" />
                      </div>
                      <h4 className="font-black text-base text-foreground">تصدير بيانات النظام المجمعة</h4>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        تصدير سجلات الطلاب، المالية، والكادر بصيغ Excel، JSON، أو نسق منصة نور المعتمد.
                      </p>
                    </div>
                    <div className="pt-4 flex items-center gap-1.5 text-xs font-black text-primary">
                      <span>فتح نافذة التصدير الشامل</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>

                {/* Operations History Log */}
                <div className="border-t border-border pt-4">
                  <h4 className="font-black text-sm text-foreground mb-3">سجل أحدث عمليات المزامنة المركزية</h4>
                  <div className="border border-border rounded-xl divide-y divide-border overflow-hidden text-xs">
                    <div className="p-3 flex justify-between items-center bg-card">
                      <div className="font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>استيراد دفعة طلاب من منصة نور</span>
                      </div>
                      <span className="text-muted-foreground font-mono text-[11px]">مكتمل بنجاح (450 سجل)</span>
                    </div>
                    <div className="p-3 flex justify-between items-center bg-card">
                      <div className="font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>تصدير كشف مسير الرواتب المعتمد</span>
                      </div>
                      <span className="text-muted-foreground font-mono text-[11px]">منذ يومين</span>
                    </div>
                  </div>
                </div>
              </div>
            </PageCard>
          )}

          {/* Sticky Bottom Save Actions Bar */}
          <div className="sticky bottom-4 z-30">
            <div className="bg-card/95 backdrop-blur-xl border border-border/80 p-3.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs font-bold text-muted-foreground">
                <span className={`h-2.5 w-2.5 rounded-full ${isSavedRecently ? "bg-emerald-500 animate-ping" : "bg-emerald-500 animate-pulse"}`} />
                <span>
                  {isSavedRecently 
                    ? "تم تثبيت وحفظ كافة التعديلات بنجاح في قاعدة البيانات!" 
                    : "يتم حفظ وتطبيق التعديلات فورياً في الذاكرة المحلية الآمنة."}
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleGlobalSave}
                  className="w-full sm:w-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-xs font-black text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Save className="h-4 w-4" />
                  <span>حفظ وتثبيت كافة التغييرات</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* Integrated Modal Windows Suite (النوافذ المصغرة المتكاملة) */}
      {/* ========================================================================= */}

      {/* 1. Smart Data Importer Modal */}
      <SmartImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
      />

      {/* 2. System Data Exporter Modal */}
      <SystemExporterModal
        isOpen={isExporterOpen}
        onClose={() => setIsExporterOpen(false)}
      />

      {/* 3. Instant Backup & Disaster Recovery Modal */}
      <InstantBackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
      />

      {/* 4. Official Document & Print Live Preview Modal */}
      <OfficialPrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
      />

      {/* 5. Webhook & API Live Tester Modal */}
      <WebhookTesterModal
        isOpen={isWebhookTesterOpen}
        onClose={() => setIsWebhookTesterOpen(false)}
      />

      {/* 6. Notification Channel Simulator Modal */}
      <NotificationSimulatorModal
        isOpen={isNotifTesterOpen}
        onClose={() => setIsNotifTesterOpen(false)}
      />

      {/* 7. Mobile App Connect QR Code Modal */}
      <MobileConnectModal
        isOpen={isMobileConnectOpen}
        onClose={() => setIsMobileConnectOpen(false)}
      />

      {/* 8. Factory Reset Guard Modal */}
      <FactoryResetModal
        isOpen={isFactoryResetOpen}
        onClose={() => setIsFactoryResetOpen(false)}
        onConfirm={() => {
          resetSettings();
          toast.success("تمت استعادة كافة إعدادات النظام إلى ضبط المصنع بنجاح");
        }}
      />

      {/* 9. Add Academic Year Modal */}
      <AddAcademicYearModal
        isOpen={isAddYearOpen}
        onClose={() => setIsAddYearOpen(false)}
      />
    </AppShell>
  );
}

// -----------------------------------------------------------------------------
// Helper UI Subcomponents
// -----------------------------------------------------------------------------

const inp =
  "h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-xs font-bold text-foreground shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-bold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function SwitchField({
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card/60 hover:bg-accent/40 transition-colors gap-3">
      <div className="space-y-0.5 min-w-0">
        <div className="text-xs font-bold text-foreground">{title}</div>
        {description && <div className="text-[11px] text-muted-foreground leading-normal">{description}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

function TagManagerField({
  label,
  description,
  tagsString,
  onUpdate,
}: {
  label: string;
  description?: string;
  tagsString: string;
  onUpdate: (newTags: string) => void;
}) {
  const [inputVal, setInputVal] = useState("");

  const tags = useMemo(() => {
    return (tagsString || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }, [tagsString]);

  const addTag = () => {
    if (!inputVal.trim()) return;
    const clean = inputVal.trim();
    if (!tags.includes(clean)) {
      const next = [...tags, clean].join(",");
      onUpdate(next);
      toast.success(`تمت إضافة التصنيف: ${clean}`);
    }
    setInputVal("");
  };

  const removeTag = (tagToRemove: string) => {
    const next = tags.filter((t) => t !== tagToRemove).join(",");
    onUpdate(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground">{label}</span>
        <span className="text-[10px] text-muted-foreground font-bold">{tags.length} تصنيف</span>
      </div>
      {description && <p className="text-[11px] text-muted-foreground leading-tight">{description}</p>}

      {/* Tags Chips Display */}
      <div className="flex flex-wrap gap-1.5 p-2.5 rounded-2xl border border-border bg-background min-h-12 items-center">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold"
          >
            <span>{t}</span>
            <button
              type="button"
              onClick={() => removeTag(t)}
              className="rounded-full hover:bg-primary/20 p-0.5 transition-colors"
              title="حذف التصنيف"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 && (
          <span className="text-xs text-muted-foreground">لا توجد تصنيفات حالياً</span>
        )}
      </div>

      {/* Add New Tag Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="أدخل تصنيفاً جديداً واضغط Enter..."
          className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
        <button
          type="button"
          onClick={addTag}
          className="inline-flex h-10 items-center justify-center px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shrink-0"
        >
          <Plus className="h-3.5 w-3.5 ml-1" /> إضافة
        </button>
      </div>
    </div>
  );
}
