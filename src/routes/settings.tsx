import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { 
  Save, Upload, Languages, Palette, BellRing, School as SchoolIcon,
  Calendar, DollarSign, Users, UserPlus, ShieldCheck, HardDrive, 
  Link as LinkIcon, Lock, Database, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Settings, Building,
  Smartphone, KeyRound, Webhook, Copy, RefreshCcw, FileText, QrCode, Search, Trash2, Check,
  AlertTriangle, Eye, Plus, X, Globe, Phone, Mail, MapPin, ExternalLink, Sparkles, SlidersHorizontal, ShieldAlert,
  Compass, BookOpen, Layers, CheckSquare, Zap, Activity, Info, MessageSquare, Download, CheckCheck, UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { useGlobalStore, defaultSettings, SystemFeatures, defaultFeatures } from "@/contexts/GlobalStoreContext";
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

import {
  SettingsTabProps,
  FeaturesTab, SchoolTab, BrandTab, FacilitiesTab, AcademicTab, AdmissionTab, HRTab, FinanceTab, ThemeTab, LangTab, PrintTab, NotifTab, RolesTab, BackupTab, IntegrationsTab, MobileTab, APITab, SecurityTab, DataIOTab,
} from "@/components/settings/settings-tabs";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "الإعدادات المركزية الشاملة | منصة مدارس" }] }),
  component: SettingsPage,
});

// Grouped Tabs Hierarchy for superior UX & clarity
const TAB_GROUPS = [
  {
    category: "التحكم بالميزات والوحدات",
    tabs: [
      { id: "features", label: "التحكم بميزات النظام والوحدات", icon: SlidersHorizontal, badge: "مركز الميزات", keywords: ["ميزات", "وحدات", "ترخيص", "نقل", "مكتبة", "عيادة"] },
    ]
  },
  {
    category: "المؤسسة والبيانات الأساسية",
    tabs: [
      { id: "school", label: "بيانات وهوية المدرسة", icon: SchoolIcon, badge: "أساسي", keywords: ["اسم", "ترخيص", "مدير", "عنوان", "هاتف", "بريد"] },
      { id: "brand", label: "الهوية البصرية والمطبوعات", icon: Palette, badge: "شعار وختم", keywords: ["شعار", "ختم", "علامة مائية", "هوية", "ألوان"] },
      { id: "facilities", label: "إدارة المرافق والأصول", icon: Building, keywords: ["قاعات", "معامل", "أصول", "مستودع", "صيانة"] },
    ]
  },
  {
    category: "السياسات والتشغيل الأكاديمي",
    tabs: [
      { id: "academic", label: "السنوات والتقويم الدراسي", icon: Calendar, badge: "التقويم", keywords: ["سنة", "فصول", "طابور", "غياب", "انضباط"] },
      { id: "admission", label: "سياسات القبول والتسجيل", icon: UserPlus, keywords: ["قبول", "مستجدين", "سعة", "مقابلة", "أوراق"] },
      { id: "hr", label: "سياسات الموارد البشرية", icon: Users, keywords: ["رواتب", "إجازات", "نصاب", "دوام", "ساعات"] },
      { id: "finance", label: "السياسات والعمليات المالية", icon: DollarSign, badge: "العملة", keywords: ["عملة", "رسوم", "ضريبة", "فواتير", "أقساط"] },
    ]
  },
  {
    category: "المظهر والتخصيص",
    tabs: [
      { id: "theme", label: "الثيم والألوان والواجهة", icon: Palette, badge: "ألوان", keywords: ["ثيم", "ألوان", "مظلم", "واجهة", "خط"] },
      { id: "lang", label: "اللغة والتقويم والاتجاه", icon: Languages, keywords: ["لغة", "عربي", "هجري", "تقويم", "اتجاه"] },
      { id: "print", label: "قوالب ومحددات الطباعة", icon: FileText, keywords: ["طباعة", "A4", "شهادات", "باركود", "QR"] },
    ]
  },
  {
    category: "الربط والاتصالات الذكية",
    tabs: [
      { id: "notif", label: "قواعد الإشعارات والرسائل", icon: BellRing, badge: "SMS/واتساب", keywords: ["إشعارات", "واتساب", "رسائل", "SMS", "تنبيهات"] },
      { id: "mobile", label: "تطبيق الهاتف وبوابة ولي الأمر", icon: Smartphone, keywords: ["تطبيق", "ولي الأمر", "معلم", "ربط", "PIN"] },
      { id: "integrations", label: "تطبيقات الربط والطرف الثالث", icon: LinkIcon, badge: "نور/بوابات", keywords: ["نور", "دفع", "مدى", "بوابات", "ربط"] },
      { id: "api", label: "API والربط المتقدم (Webhooks)", icon: KeyRound, keywords: ["API", "مفاتيح", "Webhook", "مطورين"] },
    ]
  },
  {
    category: "الأمان وإدارة البيانات",
    tabs: [
      { id: "security", label: "الأمان وسياسات الدخول", icon: Lock, keywords: ["كلمة مرور", "2FA", "جلسة", "حماية"] },
      { id: "roles", label: "الصلاحيات الافتراضية", icon: ShieldCheck, keywords: ["أدوار", "صلاحيات", "أذونات"] },
      { id: "backup", label: "النسخ الاحتياطي والحفظ", icon: HardDrive, keywords: ["نسخ", "استرجاع", "سحابي", "حفظ"] },
      { id: "data_io", label: "المستورد والمصدر الذكي", icon: Database, badge: "نظام نور", keywords: ["استيراد", "تصدير", "إكسل", "CSV", "نور"] },
    ]
  }
] as const;

type TabId = typeof TAB_GROUPS[number]["tabs"][number]["id"];

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
    key: "attendanceDiscipline",
    name: "وحدة الحضور والغياب والانضباط السلوكي",
    desc: "رصد الحضور اليومي وبالحصص، سجل المخالفات السلوكية، نقاط التميز والمكافآت، وتحليلات الغياب للطلاب",
    category: "core",
    categoryLabel: "وحدات تشغيلية",
    icon: UserCheck,
    route: "/attendance",
    routeLabel: "فتح الحضور",
    dependency: "مرتبط بالصفوف والشعب وقوائم الطلاب",
    badge: "حضور",
  },
  {
    key: "teachingFaculty",
    name: "وحدة الهيئة التعليمية والمعلمون والأنصبة",
    desc: "إدارة الكوادر التعليمية، الأنصبة التدريسية، الإسناد الأكاديمي، وجداول الحصص للمعلمين",
    category: "core",
    categoryLabel: "وحدات تشغيلية",
    icon: Users,
    route: "/teachers",
    routeLabel: "فتح المعلمين",
    dependency: "مرتبط بالمواد والصفوف والشعب",
    badge: "كادر",
  },
  {
    key: "academicCurriculum",
    name: "وحدة المواد والخطط الدراسية والمناهج",
    desc: "إدارة المقررات الدراسية، الخطة الأسبوعية، توزيع الحصص، وتعيين الكوادر والشعب المقررة",
    category: "core",
    categoryLabel: "وحدات تشغيلية",
    icon: BookOpen,
    route: "/academic/subjects",
    routeLabel: "فتح المواد الدراسية",
    dependency: "مرتبط بالصفوف والشعب وتعيينات الكادر",
    badge: "مناهج",
  },
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

// Map of all tab panels to their components
const TAB_COMPONENTS: Record<TabId, React.ComponentType<SettingsTabProps>> = {
  features: FeaturesTab,
  school: SchoolTab,
  brand: BrandTab,
  facilities: FacilitiesTab,
  academic: AcademicTab,
  admission: AdmissionTab,
  hr: HRTab,
  finance: FinanceTab,
  theme: ThemeTab,
  lang: LangTab,
  print: PrintTab,
  notif: NotifTab,
  roles: RolesTab,
  backup: BackupTab,
  integrations: IntegrationsTab,
  mobile: MobileTab,
  api: APITab,
  security: SecurityTab,
  data_io: DataIOTab,
};

function SettingsPage() {
  const [tab, setTab] = useState<TabId>("features");
  const [searchQuery, setSearchQuery] = useState("");
  const [featureCategoryFilter, setFeatureCategoryFilter] = useState<"all" | "core" | "portals" | "tech" | "security">("all");
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [activePresetName, setActivePresetName] = useState<string>("مخصص");

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
        group.category.toLowerCase().includes(q) ||
        (t.keywords && t.keywords.some(k => k.toLowerCase().includes(q)))
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
  const handleApplyPreset = (preset: "enterprise" | "academic" | "private" | "minimal" | "default") => {
    if (preset === "enterprise") {
      const allOn = Object.keys(defaultFeatures).reduce((acc, k) => {
        acc[k as keyof SystemFeatures] = true;
        return acc;
      }, {} as SystemFeatures);
      updateFeatures(allOn);
      setActivePresetName("Enterprise الشاملة");
      toast.success("تم تفعيل حزمة Enterprise الشاملة (كافة الميزات نشطة)");
    } else if (preset === "academic") {
      updateFeatures({
        ...defaultFeatures,
        transport: false,
        inventory: false,
        clinic: false,
        onlinePayments: false,
      });
      setActivePresetName("النمط الأكاديمي");
      toast.success("تم تفعيل نمط التشغيل الأكاديمي الأساسي (بدون خدمات المرافق والنقل)");
    } else if (preset === "private") {
      updateFeatures({
        ...defaultFeatures,
        transport: true,
        financeInvoicing: true,
        onlinePayments: true,
        parentPortal: true,
        smsAlerts: true,
        whatsappAlerts: true,
      });
      setActivePresetName("المدارس الخاصة والأهلية");
      toast.success("تم تفعيل حزمة المدارس الخاصة والأهلية (الرسوم، النقل، بوابات الدفع والتواصل)");
    } else if (preset === "minimal") {
      const minimal: SystemFeatures = {
        attendanceDiscipline: true,
        teachingFaculty: true,
        academicCurriculum: true,
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
      setActivePresetName("الوضع المبسط");
      toast.success("تم تفعيل الوضع المصغر (الصفوف، الطلاب، والدرجات فقط)");
    } else {
      updateFeatures(defaultFeatures);
      setActivePresetName("الافتراضي");
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

  // Unified Props for Tab Panels
  const tabProps: SettingsTabProps = {
    settings: systemSettings,
    update: updateSettings,
    currency,
    setCurrency,
    allAcademicYears,
    onSelectYear: handleSelectAcademicYear,
    onAddYear: () => setIsAddYearOpen(true),
    onLogoUpload: handleLogoUpload,
    onStampUpload: handleStampUpload,
    onPrintPreview: () => setIsPrintPreviewOpen(true),
    onOpenBackup: () => setIsBackupOpen(true),
    onImporter: () => setIsImporterOpen(true),
    onExporter: () => setIsExporterOpen(true),
    onWebhookTester: () => setIsWebhookTesterOpen(true),
    onOpenTester: () => setIsNotifTesterOpen(true),
    onMobileConnect: () => setIsMobileConnectOpen(true),
    filteredFeaturesList,
    activeFeaturesCount,
    totalFeaturesCount,
    activePercentage,
    featureCategoryFilter,
    setFeatureCategoryFilter,
    searchQuery,
    toggleFeature,
    handleApplyPreset,
    setIsImporterOpen,
    setIsExporterOpen,
    setIsBackupOpen,
    setIsPrintPreviewOpen,
    setIsWebhookTesterOpen,
    setIsNotifTesterOpen,
    setIsMobileConnectOpen,
    setIsFactoryResetOpen,
    setIsAddYearOpen,
    setTab,
  };

  const ActiveTabComponent = TAB_COMPONENTS[tab] || FeaturesTab;

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
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-bold">
                الحزمة: {activePresetName}
              </span>
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-0.5">
              لوحة التحكم الشاملة بسياسات المؤسسة، ترخيص الوحدات، الهوية الرسمية، والربط البرمجي
            </p>
          </div>
        </div>

        {/* Global Action Tools Toolbar */}
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

          {/* Instant Backup Shortcut */}
          <button
            onClick={() => setIsBackupOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold transition-all shadow-xs text-foreground"
            title="أخذ نسخة احتياطية فورية للنظام"
          >
            <HardDrive className="h-3.5 w-3.5 text-primary" />
            <span>نسخ فوري</span>
          </button>

          {/* Settings JSON Export */}
          <button
            onClick={handleExportSettingsJson}
            title="تصدير الإعدادات كملف JSON"
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold transition-all shadow-xs"
          >
            <ArrowDownToLine className="h-3.5 w-3.5 text-primary" />
            <span className="hidden xl:inline">تصدير Config</span>
          </button>

          {/* Settings JSON Import */}
          <label
            title="استيراد إعدادات من ملف JSON"
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <input type="file" accept=".json" onChange={handleImportSettingsJson} className="hidden" />
            <Upload className="h-3.5 w-3.5 text-primary" />
            <span className="hidden xl:inline">استيراد Config</span>
          </label>

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
                  <div className="px-2.5 py-1 text-[11px] font-black text-muted-foreground/80 tracking-wide flex items-center justify-between">
                    <span>{group.category}</span>
                    <span className="text-[10px] font-normal font-mono opacity-60">({group.tabs.length})</span>
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
          
          {/* Active Tab Component Rendered with All Synchronized Props */}
          <ActiveTabComponent {...tabProps} />

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
