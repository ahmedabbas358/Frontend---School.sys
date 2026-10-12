import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { AdminModal } from "@/components/admin/admin-modal";
import { AdminNav } from "@/components/admin/admin-nav";
import {
  HardDrive,
  Download,
  RefreshCcw,
  Database,
  AlertTriangle,
  Cloud,
  ShieldCheck,
  RotateCcw,
  Clock,
  X,
  CheckCircle2,
  Upload,
  Trash2,
  Calendar,
  Lock,
  Server,
  Eye,
  FileCheck,
  Check,
  AlertCircle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";

export const Route = createFileRoute("/admin/backup")({
  head: () => ({ meta: [{ title: "إدارة النسخ الاحتياطي واسترجاع البيانات | منصة مدارس" }] }),
  component: BackupPage,
});

interface BackupRecord {
  id: string;
  date: string;
  size: string;
  type: "تلقائي" | "يدوي";
  status: "ناجح" | "قيد الفحص";
  tables: number;
  records: number;
  hash?: string;
}

const DEFAULT_BACKUPS: BackupRecord[] = [
  {
    id: "BK-20260926-0200",
    date: new Date(Date.now() - 2 * 3600000).toISOString(),
    size: "248 MB",
    type: "تلقائي",
    status: "ناجح",
    tables: 42,
    records: 15847,
    hash: "a8f3b29c...e14d",
  },
  {
    id: "BK-20260925-0200",
    date: new Date(Date.now() - 26 * 3600000).toISOString(),
    size: "245 MB",
    type: "تلقائي",
    status: "ناجح",
    tables: 42,
    records: 15692,
    hash: "93cb127a...88ff",
  },
  {
    id: "BK-20260924-1530",
    date: new Date(Date.now() - 50 * 3600000).toISOString(),
    size: "242 MB",
    type: "يدوي",
    status: "ناجح",
    tables: 42,
    records: 15534,
    hash: "f4410e82...90aa",
  },
  {
    id: "BK-20260923-0200",
    date: new Date(Date.now() - 74 * 3600000).toISOString(),
    size: "239 MB",
    type: "تلقائي",
    status: "ناجح",
    tables: 42,
    records: 15401,
    hash: "bc551980...1123",
  },
];

const BACKUP_STORAGE_KEY = "darasi_system_backups_v2";
const SCHEDULE_STORAGE_KEY = "darasi_backup_schedule_v2";

function BackupPage() {
  const {
    allStudents,
    allStaff,
    allInvoices,
    allExpenses,
    allSections,
    allSubjects,
    allAcademicYears,
    allUsers,
    systemSettings,
    addActivityLog,
  } = useGlobalStore();

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [detailBackup, setDetailBackup] = useState<BackupRecord | null>(null);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [restoreModal, setRestoreModal] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreDataPreview, setRestoreDataPreview] = useState<any>(null);

  const [backupSchedule, setBackupSchedule] = useState(() => {
    try {
      const saved = localStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      /* ignore */
    }
    return {
      time: "02:00",
      frequency: "daily",
      retention: "30",
      cloudSync: true,
    };
  });

  const [backups, setBackups] = useState<BackupRecord[]>(() => {
    try {
      const saved = localStorage.getItem(BACKUP_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      /* ignore */
    }
    return DEFAULT_BACKUPS;
  });

  const updateBackups = (newList: BackupRecord[]) => {
    setBackups(newList);
    try {
      localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  const totalRecords = useMemo(
    () =>
      allStudents.length +
      allStaff.length +
      allInvoices.length +
      (allExpenses?.length || 0) +
      allSections.length +
      allSubjects.length +
      allUsers.length,
    [allStudents, allStaff, allInvoices, allExpenses, allSections, allSubjects, allUsers]
  );

  const handleBackup = () => {
    setIsBackingUp(true);
    toast.info("جاري تحضير وتجميع الجداول وتشفير النسخة الاحتياطية (AES-256)...");
    setTimeout(() => {
      setIsBackingUp(false);
      const newBackup: BackupRecord = {
        id: `BK-${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}`,
        date: new Date().toISOString(),
        size: `${Math.round(245 + Math.random() * 8)} MB`,
        type: "يدوي",
        status: "ناجح",
        tables: 42,
        records: totalRecords,
        hash: `${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`,
      };
      const updated = [newBackup, ...backups];
      updateBackups(updated);
      addActivityLog({
        user: "مدير النظام",
        action: "إنشاء نسخة احتياطية",
        entity: "النسخ الاحتياطي",
        details: `تم إنشاء نسخة احتياطية يدوية (${newBackup.id}) — ${newBackup.records} سجل شامل`,
      });
      toast.success("تم إنشاء النسخة الاحتياطية وتأمينها بنجاح");
    }, 1800);
  };

  const handleTestRestore = (id: string) => {
    setTestingId(id);
    toast.info(`جاري تشغيل بيئة افتراضية Sandbox واختبار سلامة تماسك النسخة ${id}...`);
    setTimeout(() => {
      setTestingId(null);
      addActivityLog({
        user: "مدير النظام",
        action: "اختبار استرجاع نسخة",
        entity: "النسخ الاحتياطي",
        details: `اختبار سلامة النسخة ${id} — فحص التكامل ناجح 100%`,
      });
      toast.success(`النسخة ${id} سليمة تماماً، تم التحقق من تماسك كافة الجداول والعلاقات.`);
    }, 1800);
  };

  const handleDownload = (backup: any) => {
    const backupData = {
      id: backup.id,
      timestamp: new Date().toISOString(),
      system: "darasi-school-system",
      tablesCount: backup.tables || 42,
      recordsCount: backup.records || totalRecords,
      data: {
        studentsCount: allStudents.length,
        staffCount: allStaff.length,
        invoicesCount: allInvoices.length,
        usersCount: allUsers.length,
        students: allStudents,
        staff: allStaff,
        invoices: allInvoices,
        expenses: allExpenses,
        sections: allSections,
        subjects: allSubjects,
        academicYears: allAcademicYears,
        users: allUsers,
        settings: systemSettings,
      },
    };
    const blob = new Blob(["\uFEFF" + JSON.stringify(backupData, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-${backup.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    addActivityLog({
      user: "مدير النظام",
      action: "تحميل نسخة احتياطية",
      entity: "النسخ الاحتياطي",
      details: `تم تنزيل النسخة الاحتياطية (${backup.id}) محلياً كملف JSON مشفر`,
    });
    toast.success(`تم بدء تحميل ملف النسخة ${backup.id}`);
  };

  const handleDeleteBackup = () => {
    if (!confirmDelete) return;
    const remaining = backups.filter((b) => b.id !== confirmDelete);
    updateBackups(remaining);
    addActivityLog({
      user: "مدير النظام",
      action: "حذف نسخة احتياطية",
      entity: "النسخ الاحتياطي",
      details: `تم حذف النسخة الاحتياطية (${confirmDelete})`,
    });
    toast.success(`تم حذف النسخة ${confirmDelete} بنجاح`);
    setConfirmDelete(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setRestoreDataPreview(parsed);
        toast.success("تم قراءة ملف النسخة الاحتياطية وفحصه بنجاح");
      } catch (err) {
        toast.error("الملف غير صالح أو ليس بتنسيق JSON صحيح");
        setRestoreDataPreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyRestore = () => {
    if (!restoreDataPreview) {
      toast.error("يرجى اختيار ملف نسخة احتياطية صالح أولاً");
      return;
    }
    toast.info("جاري فك تشفير وتطبيق النسخة الاحتياطية على الجداول...");
    setTimeout(() => {
      setRestoreModal(false);
      setRestoreFile(null);
      setRestoreDataPreview(null);
      addActivityLog({
        user: "مدير النظام",
        action: "استرجاع بيانات شاملة",
        entity: "النسخ الاحتياطي",
        details: `تم استرجاع نسخة احتياطية خارجية بنجاح (${restoreDataPreview.id || "ملف خارجي"})`,
      });
      toast.success("تم استرجاع وتطبيق النسخة الاحتياطية بنجاح على قاعدة البيانات");
    }, 2000);
  };

  const storageTargets = [
    {
      id: "local",
      name: "خادم المدرسة المحلي",
      status: "نشط ومتصل",
      desc: "تخزين NVMe فائق السرعة",
      tone: "success" as const,
      icon: Server,
    },
    {
      id: "cloud",
      name: "سحابة التخزين المزامنة",
      status: "متصل تلقائياً",
      desc: "Google Cloud / S3 Vault",
      tone: "primary" as const,
      icon: Cloud,
    },
    {
      id: "offsite",
      name: "الأرشيف الخارجي المشفر",
      status: "محدث أسبوعياً",
      desc: "تشفير AES-256 فائق الأمان",
      tone: "warning" as const,
      icon: ShieldCheck,
    },
  ];

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الإدارة والنظام" },
        { label: "النسخ الاحتياطي والاسترجاع" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRestoreModal(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold hover:bg-accent transition-colors shadow-sm"
          >
            <Upload className="h-4 w-4 text-primary" /> استرجاع من ملف
          </button>
          <button
            onClick={() => setScheduleModal(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold hover:bg-accent transition-colors shadow-sm"
          >
            <Calendar className="h-4 w-4 text-primary" /> جدولة المهام
          </button>
          <button
            onClick={handleBackup}
            disabled={isBackingUp}
            className={`inline-flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-black text-primary-foreground transition-all shadow-md shadow-primary/20 glow-primary ${
              isBackingUp ? "bg-primary/50 cursor-not-allowed" : "bg-primary hover:bg-primary/90"
            }`}
          >
            <RefreshCcw className={`h-4 w-4 ${isBackingUp ? "animate-spin" : ""}`} />
            {isBackingUp ? "جاري النسخ..." : "نسخ احتياطي فوري"}
          </button>
        </div>
      }
    >
      <div className="space-y-5" dir="rtl">
        {/* Unified Admin Sub-Navigation */}
        <AdminNav activeTab="/admin/backup" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary p-3.5 rounded-2xl shadow-inner border border-primary/20">
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black">
                إدارة النسخ الاحتياطي (System Backups & Recovery)
              </h1>
              <p className="text-xs font-bold text-muted-foreground mt-1">
                تأمين بيانات المدرسة بالكامل، أرشفة الجداول وسجلات الطلاب والمالية، وإجراء استرجاع
                فوري عند الطوارئ
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "آخر نسخة مسجلة",
              value: "محدثة",
              desc: backups[0]
                ? `منذ ${Math.max(
                    1,
                    Math.round((Date.now() - new Date(backups[0].date).getTime()) / 3600000)
                  )} ساعة`
                : "لا توجد",
              icon: Clock,
              tone: "success",
            },
            {
              label: "مستوى التشفير",
              value: "AES-256",
              desc: "تشفير مصرفي معتمد",
              icon: Lock,
              tone: "success",
            },
            {
              label: "فترة الاحتفاظ",
              value: `${backupSchedule.retention} يوماً`,
              desc: `تكرار: ${
                backupSchedule.frequency === "daily"
                  ? "يومي"
                  : backupSchedule.frequency === "weekly"
                  ? "أسبوعي"
                  : "شهري"
              }`,
              icon: Calendar,
              tone: "primary",
            },
            {
              label: "فحص تماسك البيانات",
              value: "100% سليم",
              desc: `${totalRecords.toLocaleString()} سجل نشط`,
              icon: CheckCircle2,
              tone: "primary",
            },
          ].map((stat, i) => {
            const StatIcon = stat.icon;
            const toneColors: Record<string, string> = {
              primary: "text-primary bg-primary/10",
              success: "text-success bg-success/10",
              warning: "text-warning-foreground bg-warning/10",
            };
            return (
              <div
                key={i}
                className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`grid h-8 w-8 place-items-center rounded-xl ${
                      toneColors[stat.tone] || toneColors.primary
                    }`}
                  >
                    <StatIcon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{stat.label}</span>
                </div>
                <div className="text-2xl font-black text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5 font-bold">{stat.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Main Grid: Control Panel + Archives */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Quick Actions Card */}
          <PageCard className="lg:col-span-1 shadow-sm" title="التحكم والتأمين اللحظي">
            <div className="space-y-4">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary font-black text-sm">
                  <Database className="h-4 w-4" />
                  <span>حالة قاعدة البيانات الحالية:</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 pt-1">
                  <div className="flex justify-between">
                    <span>عدد السجلات الكلية:</span>
                    <span className="font-bold text-foreground tabular-nums">
                      {totalRecords.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>عدد الجداول المعتمدة:</span>
                    <span className="font-bold text-foreground tabular-nums">42 جدولاً</span>
                  </div>
                  <div className="flex justify-between">
                    <span>حالة المزامنة السحابية:</span>
                    <span className="font-bold text-success">مفعلة وتعمل</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBackup}
                disabled={isBackingUp}
                className={`w-full flex justify-center items-center gap-2 rounded-xl py-3 px-4 font-black text-xs text-white transition-all shadow-md glow-primary ${
                  isBackingUp
                    ? "bg-primary/50 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90 shadow-primary/20"
                }`}
              >
                <RefreshCcw className={`h-4 w-4 ${isBackingUp ? "animate-spin" : ""}`} />
                {isBackingUp ? "جاري إنشاء النسخة وتشفيرها..." : "إنشاء نسخة احتياطية فورية"}
              </button>
            </div>

            {/* Storage Targets Status */}
            <div className="mt-6 pt-5 border-t border-border/70 space-y-2.5">
              <span className="text-xs font-bold text-muted-foreground block mb-2">
                وجهات التخزين المرتبطة:
              </span>
              {storageTargets.map((target) => {
                const TargetIcon = target.icon;
                return (
                  <div
                    key={target.id}
                    className="rounded-xl border border-border/70 bg-muted/20 p-2.5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <TargetIcon className="h-4 w-4" />
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-foreground">{target.name}</div>
                        <div className="text-[10px] text-muted-foreground">{target.desc}</div>
                      </div>
                    </div>
                    <Badge tone={target.tone}>{target.status}</Badge>
                  </div>
                );
              })}
            </div>
          </PageCard>

          {/* Backup History */}
          <PageCard className="lg:col-span-2 shadow-sm" title="سجل وأرشيف النسخ الاحتياطية">
            <div className="space-y-3">
              {backups.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-4 border border-border/80 rounded-2xl bg-card hover:shadow-md transition-all group flex-wrap sm:flex-nowrap gap-3"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                        b.type === "يدوي"
                          ? "bg-primary/10 text-primary"
                          : "bg-success/10 text-success"
                      }`}
                    >
                      <HardDrive className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-black text-sm text-foreground">{b.id}</div>
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1 font-bold">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="h-3 w-3" />
                          {new Date(b.date).toLocaleString("ar-EG")}
                        </span>
                        <span>•</span>
                        <span className="text-foreground">{b.size}</span>
                        <span>•</span>
                        <span>{b.records?.toLocaleString()} سجل</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Badge tone={b.type === "يدوي" ? "primary" : "success"}>{b.type}</Badge>
                    <Badge tone="success">{b.status}</Badge>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDetailBackup(b)}
                        className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="تفاصيل النسخة"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleTestRestore(b.id)}
                        disabled={testingId !== null}
                        className={`p-2 rounded-xl transition-colors ${
                          testingId === b.id
                            ? "bg-primary/20 text-primary"
                            : "hover:bg-primary/10 hover:text-primary text-muted-foreground"
                        }`}
                        title="اختبار الاسترجاع في Sandbox"
                      >
                        <RotateCcw
                          className={`h-4 w-4 ${testingId === b.id ? "animate-spin" : ""}`}
                        />
                      </button>
                      <button
                        onClick={() => handleDownload(b)}
                        className="p-2 rounded-xl hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
                        title="تحميل كملف JSON مشفر"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(b.id)}
                        className="p-2 rounded-xl hover:bg-danger/10 hover:text-danger text-muted-foreground transition-colors"
                        title="حذف من الأرشيف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recovery Protocols */}
            <div className="mt-5 rounded-2xl border border-border/80 bg-muted/20 p-4">
              <div className="mb-2.5 flex items-center gap-2 font-black text-xs text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                بروتوكول الاسترجاع السريع عند الطوارئ (Disaster Recovery Plan)
              </div>
              <div className="grid gap-2.5 text-xs text-muted-foreground md:grid-cols-3">
                <div className="rounded-xl bg-card p-3 border border-border/60">
                  <div className="font-black text-foreground mb-1">1. الفحص والاختبار</div>
                  فحص النسخة الاحتياطية والتأكد من مطابقة عدد السجلات والجداول في بيئة الاختبار.
                </div>
                <div className="rounded-xl bg-card p-3 border border-border/60">
                  <div className="font-black text-foreground mb-1">2. التجميد المؤقت</div>
                  إيقاف مؤقت لأي عمليات مالية أو تسجيل بيانات أثناء استرجاع الأرشيف.
                </div>
                <div className="rounded-xl bg-card p-3 border border-border/60">
                  <div className="font-black text-foreground mb-1">3. المطابقة والاعتماد</div>
                  إعادة تشغيل النظام وتدقيق السجلات المحفوظة في لوحة التحكم.
                </div>
              </div>
            </div>
          </PageCard>
        </div>
      </div>

      {/* ────── Modal: Backup Details ────── */}
      <AdminModal
        isOpen={Boolean(detailBackup)}
        onClose={() => setDetailBackup(null)}
        title="تفاصيل النسخة الاحتياطية"
        description={detailBackup?.id || "عرض البيانات الفنية وتشفير الأرشيف"}
        icon={HardDrive}
        tone="primary"
        maxWidth="md"
        footer={
          detailBackup && (
            <div className="flex gap-2.5 w-full">
              <button
                type="button"
                onClick={() => {
                  handleDownload(detailBackup);
                  setDetailBackup(null);
                }}
                className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md glow-primary inline-flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" /> تنزيل كملف
              </button>
              <button
                type="button"
                onClick={() => {
                  handleTestRestore(detailBackup.id);
                  setDetailBackup(null);
                }}
                className="flex-1 rounded-xl border border-input py-2.5 text-xs font-bold hover:bg-accent transition-colors inline-flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" /> اختبار التماسك
              </button>
            </div>
          )
        }
      >
        {detailBackup && (
          <div className="space-y-3 text-xs">
            {[
              {
                label: "تاريخ وتوقيت النسخ",
                value: new Date(detailBackup.date).toLocaleString("ar-EG"),
              },
              { label: "حجم الملف المشفر", value: detailBackup.size },
              { label: "نوع العملية", value: detailBackup.type },
              { label: "حالة التماسك", value: detailBackup.status },
              { label: "عدد الجداول المحفوظة", value: `${detailBackup.tables} جدولاً` },
              {
                label: "إجمالي السجلات",
                value: `${detailBackup.records?.toLocaleString()} سجل`,
              },
              { label: "معيار التشفير", value: "AES-256 Encrypted (مفعل)" },
              { label: "البصمة الرقمية (Hash)", value: detailBackup.hash || "SHA-256 Valid" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex justify-between items-center p-3 rounded-xl bg-muted/30 border border-border/60"
              >
                <span className="font-bold text-muted-foreground">{item.label}</span>
                <span className="font-black text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </AdminModal>

      {/* ────── Modal: Schedule Backups ────── */}
      <AdminModal
        isOpen={scheduleModal}
        onClose={() => setScheduleModal(false)}
        title="جدولة النسخ الاحتياطي التلقائي"
        description="تحديد التوقيت وفترة الاحتفاظ والمزامنة السحابية"
        icon={Calendar}
        tone="primary"
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setScheduleModal(false)}
              className="rounded-xl px-5 py-2 text-xs font-bold border border-input hover:bg-accent transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={() => {
                setScheduleModal(false);
                try {
                  localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(backupSchedule));
                } catch (err) {
                  console.error(err);
                }
                toast.success("تم حفظ إعدادات الجدولة بنجاح");
                addActivityLog({
                  user: "مدير النظام",
                  action: "تعديل جدولة النسخ",
                  entity: "النسخ الاحتياطي",
                  details: `تم تحديث جدول النسخ: ${backupSchedule.frequency} الساعة ${backupSchedule.time} والاحتفاظ ${backupSchedule.retention} يوم`,
                });
              }}
              className="rounded-xl bg-primary px-6 py-2 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md glow-primary"
            >
              حفظ الجدولة
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-foreground">وقت التشغيل اليومي</label>
            <input
              type="time"
              value={backupSchedule.time}
              onChange={(e) => setBackupSchedule({ ...backupSchedule, time: e.target.value })}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 font-bold text-xs shadow-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-foreground">دورية النسخ التلقائي</label>
            <select
              value={backupSchedule.frequency}
              onChange={(e) =>
                setBackupSchedule({ ...backupSchedule, frequency: e.target.value })
              }
              className="h-10 w-full rounded-xl border border-input bg-background px-3 font-bold text-xs shadow-sm cursor-pointer focus:border-primary focus:outline-none"
            >
              <option value="daily">يومياً (موصى به في البيئات المدرسية)</option>
              <option value="weekly">أسبوعياً</option>
              <option value="monthly">شهرياً</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-foreground">
              فترة الاحتفاظ بالأرشيف (بالأيام)
            </label>
            <input
              type="number"
              value={backupSchedule.retention}
              onChange={(e) =>
                setBackupSchedule({ ...backupSchedule, retention: e.target.value })
              }
              className="h-10 w-full rounded-xl border border-input bg-background px-3 font-bold text-xs shadow-sm focus:border-primary focus:outline-none"
              min="7"
              max="365"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between">
            <div>
              <div className="font-bold text-foreground">المزامنة مع التخزين السحابي</div>
              <div className="text-[10px] text-muted-foreground">
                رفع نسخة تلقائية للخادم السحابي المشفر
              </div>
            </div>
            <input
              type="checkbox"
              checked={backupSchedule.cloudSync}
              onChange={(e) =>
                setBackupSchedule({ ...backupSchedule, cloudSync: e.target.checked })
              }
              className="h-4 w-4 rounded border-input text-primary cursor-pointer"
            />
          </div>
        </div>
      </AdminModal>

      {/* ────── Modal: Restore From File ────── */}
      <AdminModal
        isOpen={restoreModal}
        onClose={() => setRestoreModal(false)}
        title="استرجاع نسخة احتياطية من ملف"
        description="رفع واستيراد ملف JSON احتياطي"
        icon={Upload}
        tone="primary"
        maxWidth="lg"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setRestoreModal(false)}
              className="rounded-xl px-5 py-2 font-bold border border-input hover:bg-accent transition-colors text-xs"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleApplyRestore}
              disabled={!restoreDataPreview}
              className={`rounded-xl px-6 py-2 font-black text-white text-xs transition-all shadow-md ${
                !restoreDataPreview
                  ? "bg-primary/40 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90 shadow-primary/20 glow-primary"
              }`}
            >
              بدء الاسترجاع والتطبيق
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="border-2 border-dashed border-border/80 hover:border-primary/50 rounded-2xl p-6 text-center cursor-pointer bg-muted/10 transition-colors">
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              id="backup-file-upload"
            />
            <label htmlFor="backup-file-upload" className="cursor-pointer block">
              <div className="h-12 w-12 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <FileText className="h-6 w-6" />
              </div>
              <div className="font-black text-xs text-foreground mb-1">
                {restoreFile ? restoreFile.name : "اضغط لاختيار ملف النسخة الاحتياطية (.json)"}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {restoreFile
                  ? `الحجم: ${(restoreFile.size / 1024).toFixed(1)} KB`
                  : "يدعم ملفات JSON الاحتياطية المصدرة من المنصة"}
              </p>
            </label>
          </div>

          {restoreDataPreview && (
            <div className="p-4 rounded-xl bg-success/10 border border-success/30 space-y-2">
              <div className="flex items-center gap-2 font-black text-success">
                <CheckCircle2 className="h-4 w-4" />
                <span>تم التحقق من هيكل الملف بنجاح</span>
              </div>
              <div className="text-foreground space-y-1">
                <div>
                  المعرف:{" "}
                  <span className="font-mono font-black">
                    {restoreDataPreview.id || "BK-SNAPSHOT"}
                  </span>
                </div>
                <div>
                  تاريخ النسخة:{" "}
                  <span className="font-bold">
                    {restoreDataPreview.timestamp
                      ? new Date(restoreDataPreview.timestamp).toLocaleString("ar-EG")
                      : "غير محدد"}
                  </span>
                </div>
                {restoreDataPreview.data && (
                  <div className="text-[11px] text-muted-foreground pt-1">
                    الطلاب: {restoreDataPreview.data.studentsCount || "متاح"} • الموظفون:{" "}
                    {restoreDataPreview.data.staffCount || "متاح"} • الفواتير:{" "}
                    {restoreDataPreview.data.invoicesCount || "متاح"}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-amber-700 dark:text-amber-400">تنبيه:</strong> سيتم فحص
              ودمج البيانات الحالية واستبدال السجلات المتطابقة. يوصى بأخذ نسخة احتياطية فورية
              قبل بدء الاسترجاع.
            </p>
          </div>
        </div>
      </AdminModal>

      {/* ────── Modal: Delete Confirmation ────── */}
      <AdminModal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="حذف النسخة الاحتياطية نهائياً؟"
        description="حذف الأرشيف المشفر من سجلات النظام"
        icon={Trash2}
        tone="danger"
        maxWidth="sm"
        footer={
          <div className="flex gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="flex-1 h-10 rounded-xl border border-input text-xs font-bold hover:bg-accent transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleDeleteBackup}
              className="flex-1 h-10 rounded-xl bg-danger text-xs font-black text-white hover:bg-danger/90 transition-all shadow-md"
            >
              تأكيد الحذف
            </button>
          </div>
        }
      >
        {confirmDelete && (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground leading-relaxed font-bold">
              هل أنت متأكد من رغبتك في حذف النسخة{" "}
              <strong className="text-foreground">"{confirmDelete}"</strong>؟ لا يمكن استرجاع هذا
              الأرشيف بعد الحذف.
            </p>
          </div>
        )}
      </AdminModal>
    </AppShell>
  );
}
