/**
 * settings-tabs.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Each exported function is one settings tab panel.
 * Imported and used in settings.tsx to reduce its size.
 */

import React, { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { PageCard } from "@/components/app-shell";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Upload, School as SchoolIcon, Building, Smartphone, Webhook,
  Copy, RefreshCcw, FileText, QrCode, Trash2, Check,
  Eye, Plus, X, ExternalLink, Sparkles, ShieldCheck,
  HardDrive, Database, ArrowDownToLine, ArrowUpFromLine,
  CheckCircle2, Download, Settings, Info, Link as LinkIcon,
  Zap, CheckSquare, BellRing,
} from "lucide-react";

// ─── Shared settings props interface ─────────────────────────────────────────
export interface SettingsTabProps {
  settings: Record<string, any>;
  update: (patch: Record<string, any>) => void;
  currency?: string;
  setCurrency?: (v: string) => void;
  allAcademicYears?: Array<{ id: string; name: string; isCurrent?: boolean }>;
  onSelectYear?: (id: string) => void;
  onAddYear?: () => void;
  onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStampUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPrintPreview?: () => void;
  onOpenBackup?: () => void;
  onImporter?: () => void;
  onExporter?: () => void;
  onWebhookTester?: () => void;
  onOpenTester?: () => void;
  onMobileConnect?: () => void;
  // features tab extras
  filteredFeaturesList?: any[];
  activeFeaturesCount?: number;
  totalFeaturesCount?: number;
  activePercentage?: number;
  featureCategoryFilter?: string;
  setFeatureCategoryFilter?: (v: any) => void;
  searchQuery?: string;
  toggleFeature?: (key: any, checked: boolean) => void;
  handleApplyPreset?: (preset: "enterprise" | "academic" | "private" | "minimal" | "default") => void;
  setIsImporterOpen?: (v: boolean) => void;
  setIsExporterOpen?: (v: boolean) => void;
  setIsBackupOpen?: (v: boolean) => void;
  setIsPrintPreviewOpen?: (v: boolean) => void;
  setIsWebhookTesterOpen?: (v: boolean) => void;
  setIsNotifTesterOpen?: (v: boolean) => void;
  setIsMobileConnectOpen?: (v: boolean) => void;
  setIsFactoryResetOpen?: (v: boolean) => void;
  setIsAddYearOpen?: (v: boolean) => void;
  setTab?: (tab: any) => void;
}

// ─── Shared style token ───────────────────────────────────────────────────────
export const inp =
  "h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-xs font-bold text-foreground shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50";

// ─── Field helper ─────────────────────────────────────────────────────────────
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-bold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

// ─── SwitchField helper ───────────────────────────────────────────────────────
export function SwitchField({
  title, description, checked, onChange, disabled,
}: {
  title: string; description?: string; checked: boolean;
  onChange: (checked: boolean) => void; disabled?: boolean;
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

// ─── TagManagerField helper ───────────────────────────────────────────────────
export function TagManagerField({
  label, description, tagsString, onUpdate,
}: {
  label: string; description?: string; tagsString: string;
  onUpdate: (newTags: string) => void;
}) {
  const [inputVal, setInputVal] = useState("");
  const tags = useMemo(() =>
    (tagsString || "").split(",").map(t => t.trim()).filter(Boolean),
    [tagsString]
  );
  const addTag = () => {
    if (!inputVal.trim()) return;
    const clean = inputVal.trim();
    if (!tags.includes(clean)) {
      onUpdate([...tags, clean].join(","));
      toast.success(`تمت إضافة التصنيف: ${clean}`);
    }
    setInputVal("");
  };
  const removeTag = (t: string) => onUpdate(tags.filter(x => x !== t).join(","));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground">{label}</span>
        <span className="text-[10px] text-muted-foreground font-bold">{tags.length} تصنيف</span>
      </div>
      {description && <p className="text-[11px] text-muted-foreground leading-tight">{description}</p>}
      <div className="flex flex-wrap gap-1.5 p-2.5 rounded-2xl border border-border bg-background min-h-12 items-center">
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
            <span>{t}</span>
            <button type="button" onClick={() => removeTag(t)} className="rounded-full hover:bg-primary/20 p-0.5 transition-colors">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-muted-foreground">لا توجد تصنيفات حالياً</span>}
      </div>
      <div className="flex items-center gap-2">
        <input type="text" value={inputVal} onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder="أدخل تصنيفاً جديداً واضغط Enter..."
          className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
        <button type="button" onClick={addTag}
          className="inline-flex h-10 items-center justify-center px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shrink-0">
          <Plus className="h-3.5 w-3.5 ml-1" /> إضافة
        </button>
      </div>
    </div>
  );
}

// ─── Theme palettes ───────────────────────────────────────────────────────────
const THEME_PALETTES = [
  { id: "blue",    name: "أزرق ملكي",       hex: "#2563eb" },
  { id: "sky",     name: "سماوي عصري",      hex: "#0ea5e9" },
  { id: "emerald", name: "زمردي تعليمي",    hex: "#10b981" },
  { id: "indigo",  name: "نيلي وقور",       hex: "#4f46e5" },
  { id: "violet",  name: "بنفسجي ابتكاري",  hex: "#8b5cf6" },
  { id: "rose",    name: "ياقوتي راقٍ",     hex: "#e11d48" },
  { id: "amber",   name: "عنبري دافئ",      hex: "#d97706" },
  { id: "teal",    name: "كحلي بحري",       hex: "#0f766e" },
];



// ─────────────────────────────────────────────────────────────────────────────
// FeaturesTab
// ─────────────────────────────────────────────────────────────────────────────
export function FeaturesTab(props: SettingsTabProps) {
  const { settings, update } = props;
  const updateSettings = update;
  const systemSettings = settings;
  const currency = props.currency ?? "";
  const setCurrency = props.setCurrency ?? (() => {});
  const allAcademicYears = props.allAcademicYears ?? [];
  const handleSelectAcademicYear = props.onSelectYear ?? (() => {});
  const onAddYear = props.onAddYear ?? (() => {});
  const handleLogoUpload = props.onLogoUpload ?? (() => {});
  const handleStampUpload = props.onStampUpload ?? (() => {});
  const onPrintPreview = props.onPrintPreview ?? (() => {});
  const onOpenBackup = props.onOpenBackup ?? (() => {});
  const onImporter = props.onImporter ?? (() => {});
  const onExporter = props.onExporter ?? (() => {});
  const onWebhookTester = props.onWebhookTester ?? (() => {});
  const onOpenTester = props.onOpenTester ?? (() => {});
  const onMobileConnect = props.onMobileConnect ?? (() => {});
  const filteredFeaturesList = props.filteredFeaturesList ?? [];
  const activeFeaturesCount = props.activeFeaturesCount ?? 0;
  const totalFeaturesCount = props.totalFeaturesCount ?? 0;
  const activePercentage = props.activePercentage ?? 0;
  const featureCategoryFilter = props.featureCategoryFilter ?? "all";
  const setFeatureCategoryFilter = props.setFeatureCategoryFilter ?? (() => {});
  const searchQuery = props.searchQuery ?? "";
  const toggleFeature = props.toggleFeature ?? (() => {});
  const handleApplyPreset = props.handleApplyPreset ?? (() => {});
  const setIsImporterOpen = props.setIsImporterOpen ?? (() => {});
  const setIsExporterOpen = props.setIsExporterOpen ?? (() => {});
  const setIsBackupOpen = props.setIsBackupOpen ?? (() => {});
  const setIsPrintPreviewOpen = props.setIsPrintPreviewOpen ?? (() => {});
  const setIsWebhookTesterOpen = props.setIsWebhookTesterOpen ?? (() => {});
  const setIsNotifTesterOpen = props.setIsNotifTesterOpen ?? (() => {});
  const setIsMobileConnectOpen = props.setIsMobileConnectOpen ?? (() => {});
  const setIsFactoryResetOpen = props.setIsFactoryResetOpen ?? (() => {});
  const setIsAddYearOpen = props.setIsAddYearOpen ?? (() => {});
  const setTab = props.setTab ?? (() => {});
  return (
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
              onClick={() => handleApplyPreset("private")}
              className="px-3 py-1.5 rounded-xl bg-card border border-border hover:border-primary text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              <span>حزمة المدارس الخاصة والأهلية (رسوم ونقل وبوابات)</span>
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

        {/* Category Filters & Bulk Actions */}
        <div className="space-y-3 border-b border-border pb-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
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

            {/* Category Bulk Toggle Buttons */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  filteredFeaturesList.forEach((f) => toggleFeature(f.key, true));
                  toast.success(`تم تفعيل كافة الميزات المعروضة (${filteredFeaturesList.length}) بنجاح`);
                }}
                className="px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold hover:bg-emerald-500/20 text-[11px] transition-all flex items-center gap-1"
                title="تفعيل كافة الميزات المعروضة حالياً"
              >
                <Check className="h-3 w-3" />
                <span>تفعيل القسم</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  filteredFeaturesList.forEach((f) => toggleFeature(f.key, false));
                  toast.success(`تم تعطيل كافة الميزات المعروضة (${filteredFeaturesList.length})`);
                }}
                className="px-2.5 py-1 rounded-lg border border-border bg-card text-muted-foreground font-bold hover:bg-accent text-[11px] transition-all flex items-center gap-1"
                title="تعطيل كافة الميزات المعروضة حالياً"
              >
                <X className="h-3 w-3" />
                <span>تعطيل القسم</span>
              </button>
            </div>
          </div>

          {(searchQuery || featureCategoryFilter !== "all") && (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span>عرض {filteredFeaturesList.length} ميزة مطابقة للفلترة</span>
              <span className="font-mono">
                {filteredFeaturesList.filter((f) => systemSettings.features[f.key]).length} نشطة من أصل {filteredFeaturesList.length}
              </span>
            </div>
          )}
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
                    : "bg-muted/20 border-border/60 opacity-80"
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
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-xs text-foreground">{feat.name}</h3>
                        {feat.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                            {feat.badge}
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                            isEnabled
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          <span className={`w-1 h-1 rounded-full ${isEnabled ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                          {isEnabled ? "نشطة" : "معطلة"}
                        </span>
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
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// SchoolTab
// ─────────────────────────────────────────────────────────────────────────────
export function SchoolTab(props: SettingsTabProps) {
  const { settings, update } = props;
  const updateSettings = update;
  const systemSettings = settings;
  const currency = props.currency ?? "";
  const setCurrency = props.setCurrency ?? (() => {});
  const allAcademicYears = props.allAcademicYears ?? [];
  const handleSelectAcademicYear = props.onSelectYear ?? (() => {});
  const onAddYear = props.onAddYear ?? (() => {});
  const handleLogoUpload = props.onLogoUpload ?? (() => {});
  const handleStampUpload = props.onStampUpload ?? (() => {});
  const onPrintPreview = props.onPrintPreview ?? (() => {});
  const onOpenBackup = props.onOpenBackup ?? (() => {});
  const onImporter = props.onImporter ?? (() => {});
  const onExporter = props.onExporter ?? (() => {});
  const onWebhookTester = props.onWebhookTester ?? (() => {});
  const onOpenTester = props.onOpenTester ?? (() => {});
  const onMobileConnect = props.onMobileConnect ?? (() => {});
  const filteredFeaturesList = props.filteredFeaturesList ?? [];
  const activeFeaturesCount = props.activeFeaturesCount ?? 0;
  const totalFeaturesCount = props.totalFeaturesCount ?? 0;
  const activePercentage = props.activePercentage ?? 0;
  const featureCategoryFilter = props.featureCategoryFilter ?? "all";
  const setFeatureCategoryFilter = props.setFeatureCategoryFilter ?? (() => {});
  const searchQuery = props.searchQuery ?? "";
  const toggleFeature = props.toggleFeature ?? (() => {});
  const handleApplyPreset = props.handleApplyPreset ?? (() => {});
  const setIsImporterOpen = props.setIsImporterOpen ?? (() => {});
  const setIsExporterOpen = props.setIsExporterOpen ?? (() => {});
  const setIsBackupOpen = props.setIsBackupOpen ?? (() => {});
  const setIsPrintPreviewOpen = props.setIsPrintPreviewOpen ?? (() => {});
  const setIsWebhookTesterOpen = props.setIsWebhookTesterOpen ?? (() => {});
  const setIsNotifTesterOpen = props.setIsNotifTesterOpen ?? (() => {});
  const setIsMobileConnectOpen = props.setIsMobileConnectOpen ?? (() => {});
  const setIsFactoryResetOpen = props.setIsFactoryResetOpen ?? (() => {});
  const setIsAddYearOpen = props.setIsAddYearOpen ?? (() => {});
  const setTab = props.setTab ?? (() => {});
  return (
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
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// BrandTab
// ─────────────────────────────────────────────────────────────────────────────
export function BrandTab(props: SettingsTabProps) {
  const { settings, update } = props;
  const updateSettings = update;
  const systemSettings = settings;
  const currency = props.currency ?? "";
  const setCurrency = props.setCurrency ?? (() => {});
  const allAcademicYears = props.allAcademicYears ?? [];
  const handleSelectAcademicYear = props.onSelectYear ?? (() => {});
  const onAddYear = props.onAddYear ?? (() => {});
  const handleLogoUpload = props.onLogoUpload ?? (() => {});
  const handleStampUpload = props.onStampUpload ?? (() => {});
  const onPrintPreview = props.onPrintPreview ?? (() => {});
  const onOpenBackup = props.onOpenBackup ?? (() => {});
  const onImporter = props.onImporter ?? (() => {});
  const onExporter = props.onExporter ?? (() => {});
  const onWebhookTester = props.onWebhookTester ?? (() => {});
  const onOpenTester = props.onOpenTester ?? (() => {});
  const onMobileConnect = props.onMobileConnect ?? (() => {});
  const filteredFeaturesList = props.filteredFeaturesList ?? [];
  const activeFeaturesCount = props.activeFeaturesCount ?? 0;
  const totalFeaturesCount = props.totalFeaturesCount ?? 0;
  const activePercentage = props.activePercentage ?? 0;
  const featureCategoryFilter = props.featureCategoryFilter ?? "all";
  const setFeatureCategoryFilter = props.setFeatureCategoryFilter ?? (() => {});
  const searchQuery = props.searchQuery ?? "";
  const toggleFeature = props.toggleFeature ?? (() => {});
  const handleApplyPreset = props.handleApplyPreset ?? (() => {});
  const setIsImporterOpen = props.setIsImporterOpen ?? (() => {});
  const setIsExporterOpen = props.setIsExporterOpen ?? (() => {});
  const setIsBackupOpen = props.setIsBackupOpen ?? (() => {});
  const setIsPrintPreviewOpen = props.setIsPrintPreviewOpen ?? (() => {});
  const setIsWebhookTesterOpen = props.setIsWebhookTesterOpen ?? (() => {});
  const setIsNotifTesterOpen = props.setIsNotifTesterOpen ?? (() => {});
  const setIsMobileConnectOpen = props.setIsMobileConnectOpen ?? (() => {});
  const setIsFactoryResetOpen = props.setIsFactoryResetOpen ?? (() => {});
  const setIsAddYearOpen = props.setIsAddYearOpen ?? (() => {});
  const setTab = props.setTab ?? (() => {});
  return (
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
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// FacilitiesTab
// ─────────────────────────────────────────────────────────────────────────────
export function FacilitiesTab(props: SettingsTabProps) {
  const { settings, update } = props;
  const updateSettings = update;
  const systemSettings = settings;
  const currency = props.currency ?? "";
  const setCurrency = props.setCurrency ?? (() => {});
  const allAcademicYears = props.allAcademicYears ?? [];
  const handleSelectAcademicYear = props.onSelectYear ?? (() => {});
  const onAddYear = props.onAddYear ?? (() => {});
  const handleLogoUpload = props.onLogoUpload ?? (() => {});
  const handleStampUpload = props.onStampUpload ?? (() => {});
  const onPrintPreview = props.onPrintPreview ?? (() => {});
  const onOpenBackup = props.onOpenBackup ?? (() => {});
  const onImporter = props.onImporter ?? (() => {});
  const onExporter = props.onExporter ?? (() => {});
  const onWebhookTester = props.onWebhookTester ?? (() => {});
  const onOpenTester = props.onOpenTester ?? (() => {});
  const onMobileConnect = props.onMobileConnect ?? (() => {});
  const filteredFeaturesList = props.filteredFeaturesList ?? [];
  const activeFeaturesCount = props.activeFeaturesCount ?? 0;
  const totalFeaturesCount = props.totalFeaturesCount ?? 0;
  const activePercentage = props.activePercentage ?? 0;
  const featureCategoryFilter = props.featureCategoryFilter ?? "all";
  const setFeatureCategoryFilter = props.setFeatureCategoryFilter ?? (() => {});
  const searchQuery = props.searchQuery ?? "";
  const toggleFeature = props.toggleFeature ?? (() => {});
  const handleApplyPreset = props.handleApplyPreset ?? (() => {});
  const setIsImporterOpen = props.setIsImporterOpen ?? (() => {});
  const setIsExporterOpen = props.setIsExporterOpen ?? (() => {});
  const setIsBackupOpen = props.setIsBackupOpen ?? (() => {});
  const setIsPrintPreviewOpen = props.setIsPrintPreviewOpen ?? (() => {});
  const setIsWebhookTesterOpen = props.setIsWebhookTesterOpen ?? (() => {});
  const setIsNotifTesterOpen = props.setIsNotifTesterOpen ?? (() => {});
  const setIsMobileConnectOpen = props.setIsMobileConnectOpen ?? (() => {});
  const setIsFactoryResetOpen = props.setIsFactoryResetOpen ?? (() => {});
  const setIsAddYearOpen = props.setIsAddYearOpen ?? (() => {});
  const setTab = props.setTab ?? (() => {});
  return (
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
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// AcademicTab
// ─────────────────────────────────────────────────────────────────────────────
export function AcademicTab(props: SettingsTabProps) {
  const { settings, update } = props;
  const updateSettings = update;
  const systemSettings = settings;
  const currency = props.currency ?? "";
  const setCurrency = props.setCurrency ?? (() => {});
  const allAcademicYears = props.allAcademicYears ?? [];
  const handleSelectAcademicYear = props.onSelectYear ?? (() => {});
  const onAddYear = props.onAddYear ?? (() => {});
  const handleLogoUpload = props.onLogoUpload ?? (() => {});
  const handleStampUpload = props.onStampUpload ?? (() => {});
  const onPrintPreview = props.onPrintPreview ?? (() => {});
  const onOpenBackup = props.onOpenBackup ?? (() => {});
  const onImporter = props.onImporter ?? (() => {});
  const onExporter = props.onExporter ?? (() => {});
  const onWebhookTester = props.onWebhookTester ?? (() => {});
  const onOpenTester = props.onOpenTester ?? (() => {});
  const onMobileConnect = props.onMobileConnect ?? (() => {});
  const filteredFeaturesList = props.filteredFeaturesList ?? [];
  const activeFeaturesCount = props.activeFeaturesCount ?? 0;
  const totalFeaturesCount = props.totalFeaturesCount ?? 0;
  const activePercentage = props.activePercentage ?? 0;
  const featureCategoryFilter = props.featureCategoryFilter ?? "all";
  const setFeatureCategoryFilter = props.setFeatureCategoryFilter ?? (() => {});
  const searchQuery = props.searchQuery ?? "";
  const toggleFeature = props.toggleFeature ?? (() => {});
  const handleApplyPreset = props.handleApplyPreset ?? (() => {});
  const setIsImporterOpen = props.setIsImporterOpen ?? (() => {});
  const setIsExporterOpen = props.setIsExporterOpen ?? (() => {});
  const setIsBackupOpen = props.setIsBackupOpen ?? (() => {});
  const setIsPrintPreviewOpen = props.setIsPrintPreviewOpen ?? (() => {});
  const setIsWebhookTesterOpen = props.setIsWebhookTesterOpen ?? (() => {});
  const setIsNotifTesterOpen = props.setIsNotifTesterOpen ?? (() => {});
  const setIsMobileConnectOpen = props.setIsMobileConnectOpen ?? (() => {});
  const setIsFactoryResetOpen = props.setIsFactoryResetOpen ?? (() => {});
  const setIsAddYearOpen = props.setIsAddYearOpen ?? (() => {});
  const setTab = props.setTab ?? (() => {});
  return (
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
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// AdmissionTab
// ─────────────────────────────────────────────────────────────────────────────
export function AdmissionTab(props: SettingsTabProps) {
  const { settings, update } = props;
  const updateSettings = update;
  const systemSettings = settings;
  const currency = props.currency ?? "";
  const setCurrency = props.setCurrency ?? (() => {});
  const allAcademicYears = props.allAcademicYears ?? [];
  const handleSelectAcademicYear = props.onSelectYear ?? (() => {});
  const onAddYear = props.onAddYear ?? (() => {});
  const handleLogoUpload = props.onLogoUpload ?? (() => {});
  const handleStampUpload = props.onStampUpload ?? (() => {});
  const onPrintPreview = props.onPrintPreview ?? (() => {});
  const onOpenBackup = props.onOpenBackup ?? (() => {});
  const onImporter = props.onImporter ?? (() => {});
  const onExporter = props.onExporter ?? (() => {});
  const onWebhookTester = props.onWebhookTester ?? (() => {});
  const onOpenTester = props.onOpenTester ?? (() => {});
  const onMobileConnect = props.onMobileConnect ?? (() => {});
  const filteredFeaturesList = props.filteredFeaturesList ?? [];
  const activeFeaturesCount = props.activeFeaturesCount ?? 0;
  const totalFeaturesCount = props.totalFeaturesCount ?? 0;
  const activePercentage = props.activePercentage ?? 0;
  const featureCategoryFilter = props.featureCategoryFilter ?? "all";
  const setFeatureCategoryFilter = props.setFeatureCategoryFilter ?? (() => {});
  const searchQuery = props.searchQuery ?? "";
  const toggleFeature = props.toggleFeature ?? (() => {});
  const handleApplyPreset = props.handleApplyPreset ?? (() => {});
  const setIsImporterOpen = props.setIsImporterOpen ?? (() => {});
  const setIsExporterOpen = props.setIsExporterOpen ?? (() => {});
  const setIsBackupOpen = props.setIsBackupOpen ?? (() => {});
  const setIsPrintPreviewOpen = props.setIsPrintPreviewOpen ?? (() => {});
  const setIsWebhookTesterOpen = props.setIsWebhookTesterOpen ?? (() => {});
  const setIsNotifTesterOpen = props.setIsNotifTesterOpen ?? (() => {});
  const setIsMobileConnectOpen = props.setIsMobileConnectOpen ?? (() => {});
  const setIsFactoryResetOpen = props.setIsFactoryResetOpen ?? (() => {});
  const setIsAddYearOpen = props.setIsAddYearOpen ?? (() => {});
  const setTab = props.setTab ?? (() => {});
  return (
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
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// HRTab
// ─────────────────────────────────────────────────────────────────────────────
export function HRTab(props: SettingsTabProps) {
  const { settings, update } = props;
  const updateSettings = update;
  const systemSettings = settings;
  const currency = props.currency ?? "";
  const setCurrency = props.setCurrency ?? (() => {});
  const allAcademicYears = props.allAcademicYears ?? [];
  const handleSelectAcademicYear = props.onSelectYear ?? (() => {});
  const onAddYear = props.onAddYear ?? (() => {});
  const handleLogoUpload = props.onLogoUpload ?? (() => {});
  const handleStampUpload = props.onStampUpload ?? (() => {});
  const onPrintPreview = props.onPrintPreview ?? (() => {});
  const onOpenBackup = props.onOpenBackup ?? (() => {});
  const onImporter = props.onImporter ?? (() => {});
  const onExporter = props.onExporter ?? (() => {});
  const onWebhookTester = props.onWebhookTester ?? (() => {});
  const onOpenTester = props.onOpenTester ?? (() => {});
  const onMobileConnect = props.onMobileConnect ?? (() => {});
  const filteredFeaturesList = props.filteredFeaturesList ?? [];
  const activeFeaturesCount = props.activeFeaturesCount ?? 0;
  const totalFeaturesCount = props.totalFeaturesCount ?? 0;
  const activePercentage = props.activePercentage ?? 0;
  const featureCategoryFilter = props.featureCategoryFilter ?? "all";
  const setFeatureCategoryFilter = props.setFeatureCategoryFilter ?? (() => {});
  const searchQuery = props.searchQuery ?? "";
  const toggleFeature = props.toggleFeature ?? (() => {});
  const handleApplyPreset = props.handleApplyPreset ?? (() => {});
  const setIsImporterOpen = props.setIsImporterOpen ?? (() => {});
  const setIsExporterOpen = props.setIsExporterOpen ?? (() => {});
  const setIsBackupOpen = props.setIsBackupOpen ?? (() => {});
  const setIsPrintPreviewOpen = props.setIsPrintPreviewOpen ?? (() => {});
  const setIsWebhookTesterOpen = props.setIsWebhookTesterOpen ?? (() => {});
  const setIsNotifTesterOpen = props.setIsNotifTesterOpen ?? (() => {});
  const setIsMobileConnectOpen = props.setIsMobileConnectOpen ?? (() => {});
  const setIsFactoryResetOpen = props.setIsFactoryResetOpen ?? (() => {});
  const setIsAddYearOpen = props.setIsAddYearOpen ?? (() => {});
  const setTab = props.setTab ?? (() => {});
  return (
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
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// FinanceTab
// ─────────────────────────────────────────────────────────────────────────────
export function FinanceTab(props: SettingsTabProps) {
  const { settings, update } = props;
  const updateSettings = update;
  const systemSettings = settings;
  const currency = props.currency ?? "";
  const setCurrency = props.setCurrency ?? (() => {});
  const allAcademicYears = props.allAcademicYears ?? [];
  const handleSelectAcademicYear = props.onSelectYear ?? (() => {});
  const onAddYear = props.onAddYear ?? (() => {});
  const handleLogoUpload = props.onLogoUpload ?? (() => {});
  const handleStampUpload = props.onStampUpload ?? (() => {});
  const onPrintPreview = props.onPrintPreview ?? (() => {});
  const onOpenBackup = props.onOpenBackup ?? (() => {});
  const onImporter = props.onImporter ?? (() => {});
  const onExporter = props.onExporter ?? (() => {});
  const onWebhookTester = props.onWebhookTester ?? (() => {});
  const onOpenTester = props.onOpenTester ?? (() => {});
  const onMobileConnect = props.onMobileConnect ?? (() => {});
  const filteredFeaturesList = props.filteredFeaturesList ?? [];
  const activeFeaturesCount = props.activeFeaturesCount ?? 0;
  const totalFeaturesCount = props.totalFeaturesCount ?? 0;
  const activePercentage = props.activePercentage ?? 0;
  const featureCategoryFilter = props.featureCategoryFilter ?? "all";
  const setFeatureCategoryFilter = props.setFeatureCategoryFilter ?? (() => {});
  const searchQuery = props.searchQuery ?? "";
  const toggleFeature = props.toggleFeature ?? (() => {});
  const handleApplyPreset = props.handleApplyPreset ?? (() => {});
  const setIsImporterOpen = props.setIsImporterOpen ?? (() => {});
  const setIsExporterOpen = props.setIsExporterOpen ?? (() => {});
  const setIsBackupOpen = props.setIsBackupOpen ?? (() => {});
  const setIsPrintPreviewOpen = props.setIsPrintPreviewOpen ?? (() => {});
  const setIsWebhookTesterOpen = props.setIsWebhookTesterOpen ?? (() => {});
  const setIsNotifTesterOpen = props.setIsNotifTesterOpen ?? (() => {});
  const setIsMobileConnectOpen = props.setIsMobileConnectOpen ?? (() => {});
  const setIsFactoryResetOpen = props.setIsFactoryResetOpen ?? (() => {});
  const setIsAddYearOpen = props.setIsAddYearOpen ?? (() => {});
  const setTab = props.setTab ?? (() => {});
  return (
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
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// ThemeTab
// ─────────────────────────────────────────────────────────────────────────────
export function ThemeTab(props: SettingsTabProps) {
  const { settings, update } = props;
  const updateSettings = update;
  const systemSettings = settings;
  const currency = props.currency ?? "";
  const setCurrency = props.setCurrency ?? (() => {});
  const allAcademicYears = props.allAcademicYears ?? [];
  const handleSelectAcademicYear = props.onSelectYear ?? (() => {});
  const onAddYear = props.onAddYear ?? (() => {});
  const handleLogoUpload = props.onLogoUpload ?? (() => {});
  const handleStampUpload = props.onStampUpload ?? (() => {});
  const onPrintPreview = props.onPrintPreview ?? (() => {});
  const onOpenBackup = props.onOpenBackup ?? (() => {});
  const onImporter = props.onImporter ?? (() => {});
  const onExporter = props.onExporter ?? (() => {});
  const onWebhookTester = props.onWebhookTester ?? (() => {});
  const onOpenTester = props.onOpenTester ?? (() => {});
  const onMobileConnect = props.onMobileConnect ?? (() => {});
  const filteredFeaturesList = props.filteredFeaturesList ?? [];
  const activeFeaturesCount = props.activeFeaturesCount ?? 0;
  const totalFeaturesCount = props.totalFeaturesCount ?? 0;
  const activePercentage = props.activePercentage ?? 0;
  const featureCategoryFilter = props.featureCategoryFilter ?? "all";
  const setFeatureCategoryFilter = props.setFeatureCategoryFilter ?? (() => {});
  const searchQuery = props.searchQuery ?? "";
  const toggleFeature = props.toggleFeature ?? (() => {});
  const handleApplyPreset = props.handleApplyPreset ?? (() => {});
  const setIsImporterOpen = props.setIsImporterOpen ?? (() => {});
  const setIsExporterOpen = props.setIsExporterOpen ?? (() => {});
  const setIsBackupOpen = props.setIsBackupOpen ?? (() => {});
  const setIsPrintPreviewOpen = props.setIsPrintPreviewOpen ?? (() => {});
  const setIsWebhookTesterOpen = props.setIsWebhookTesterOpen ?? (() => {});
  const setIsNotifTesterOpen = props.setIsNotifTesterOpen ?? (() => {});
  const setIsMobileConnectOpen = props.setIsMobileConnectOpen ?? (() => {});
  const setIsFactoryResetOpen = props.setIsFactoryResetOpen ?? (() => {});
  const setIsAddYearOpen = props.setIsAddYearOpen ?? (() => {});
  const setTab = props.setTab ?? (() => {});
  return (
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
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// LangTab
// ─────────────────────────────────────────────────────────────────────────────
export function LangTab(props: SettingsTabProps) {
  const { settings, update } = props;
  const updateSettings = update;
  const systemSettings = settings;
  const currency = props.currency ?? "";
  const setCurrency = props.setCurrency ?? (() => {});
  const allAcademicYears = props.allAcademicYears ?? [];
  const handleSelectAcademicYear = props.onSelectYear ?? (() => {});
  const onAddYear = props.onAddYear ?? (() => {});
  const handleLogoUpload = props.onLogoUpload ?? (() => {});
  const handleStampUpload = props.onStampUpload ?? (() => {});
  const onPrintPreview = props.onPrintPreview ?? (() => {});
  const onOpenBackup = props.onOpenBackup ?? (() => {});
  const onImporter = props.onImporter ?? (() => {});
  const onExporter = props.onExporter ?? (() => {});
  const onWebhookTester = props.onWebhookTester ?? (() => {});
  const onOpenTester = props.onOpenTester ?? (() => {});
  const onMobileConnect = props.onMobileConnect ?? (() => {});
  const filteredFeaturesList = props.filteredFeaturesList ?? [];
  const activeFeaturesCount = props.activeFeaturesCount ?? 0;
  const totalFeaturesCount = props.totalFeaturesCount ?? 0;
  const activePercentage = props.activePercentage ?? 0;
  const featureCategoryFilter = props.featureCategoryFilter ?? "all";
  const setFeatureCategoryFilter = props.setFeatureCategoryFilter ?? (() => {});
  const searchQuery = props.searchQuery ?? "";
  const toggleFeature = props.toggleFeature ?? (() => {});
  const handleApplyPreset = props.handleApplyPreset ?? (() => {});
  const setIsImporterOpen = props.setIsImporterOpen ?? (() => {});
  const setIsExporterOpen = props.setIsExporterOpen ?? (() => {});
  const setIsBackupOpen = props.setIsBackupOpen ?? (() => {});
  const setIsPrintPreviewOpen = props.setIsPrintPreviewOpen ?? (() => {});
  const setIsWebhookTesterOpen = props.setIsWebhookTesterOpen ?? (() => {});
  const setIsNotifTesterOpen = props.setIsNotifTesterOpen ?? (() => {});
  const setIsMobileConnectOpen = props.setIsMobileConnectOpen ?? (() => {});
  const setIsFactoryResetOpen = props.setIsFactoryResetOpen ?? (() => {});
  const setIsAddYearOpen = props.setIsAddYearOpen ?? (() => {});
  const setTab = props.setTab ?? (() => {});
  return (
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
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// PrintTab
// ─────────────────────────────────────────────────────────────────────────────
export function PrintTab(props: SettingsTabProps) {
  const { settings, update } = props;
  const updateSettings = update;
  const systemSettings = settings;
  const currency = props.currency ?? "";
  const setCurrency = props.setCurrency ?? (() => {});
  const allAcademicYears = props.allAcademicYears ?? [];
  const handleSelectAcademicYear = props.onSelectYear ?? (() => {});
  const onAddYear = props.onAddYear ?? (() => {});
  const handleLogoUpload = props.onLogoUpload ?? (() => {});
  const handleStampUpload = props.onStampUpload ?? (() => {});
  const onPrintPreview = props.onPrintPreview ?? (() => {});
  const onOpenBackup = props.onOpenBackup ?? (() => {});
  const onImporter = props.onImporter ?? (() => {});
  const onExporter = props.onExporter ?? (() => {});
  const onWebhookTester = props.onWebhookTester ?? (() => {});
  const onOpenTester = props.onOpenTester ?? (() => {});
  const onMobileConnect = props.onMobileConnect ?? (() => {});
  const filteredFeaturesList = props.filteredFeaturesList ?? [];
  const activeFeaturesCount = props.activeFeaturesCount ?? 0;
  const totalFeaturesCount = props.totalFeaturesCount ?? 0;
  const activePercentage = props.activePercentage ?? 0;
  const featureCategoryFilter = props.featureCategoryFilter ?? "all";
  const setFeatureCategoryFilter = props.setFeatureCategoryFilter ?? (() => {});
  const searchQuery = props.searchQuery ?? "";
  const toggleFeature = props.toggleFeature ?? (() => {});
  const handleApplyPreset = props.handleApplyPreset ?? (() => {});
  const setIsImporterOpen = props.setIsImporterOpen ?? (() => {});
  const setIsExporterOpen = props.setIsExporterOpen ?? (() => {});
  const setIsBackupOpen = props.setIsBackupOpen ?? (() => {});
  const setIsPrintPreviewOpen = props.setIsPrintPreviewOpen ?? (() => {});
  const setIsWebhookTesterOpen = props.setIsWebhookTesterOpen ?? (() => {});
  const setIsNotifTesterOpen = props.setIsNotifTesterOpen ?? (() => {});
  const setIsMobileConnectOpen = props.setIsMobileConnectOpen ?? (() => {});
  const setIsFactoryResetOpen = props.setIsFactoryResetOpen ?? (() => {});
  const setIsAddYearOpen = props.setIsAddYearOpen ?? (() => {});
  const setTab = props.setTab ?? (() => {});
  return (
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
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// NotifTab
// ─────────────────────────────────────────────────────────────────────────────
export function NotifTab(props: SettingsTabProps) {
  const { settings, update } = props;
  const updateSettings = update;
  const systemSettings = settings;
  const currency = props.currency ?? "";
  const setCurrency = props.setCurrency ?? (() => {});
  const allAcademicYears = props.allAcademicYears ?? [];
  const handleSelectAcademicYear = props.onSelectYear ?? (() => {});
  const onAddYear = props.onAddYear ?? (() => {});
  const handleLogoUpload = props.onLogoUpload ?? (() => {});
  const handleStampUpload = props.onStampUpload ?? (() => {});
  const onPrintPreview = props.onPrintPreview ?? (() => {});
  const onOpenBackup = props.onOpenBackup ?? (() => {});
  const onImporter = props.onImporter ?? (() => {});
  const onExporter = props.onExporter ?? (() => {});
  const onWebhookTester = props.onWebhookTester ?? (() => {});
  const onOpenTester = props.onOpenTester ?? (() => {});
  const onMobileConnect = props.onMobileConnect ?? (() => {});
  const filteredFeaturesList = props.filteredFeaturesList ?? [];
  const activeFeaturesCount = props.activeFeaturesCount ?? 0;
  const totalFeaturesCount = props.totalFeaturesCount ?? 0;
  const activePercentage = props.activePercentage ?? 0;
  const featureCategoryFilter = props.featureCategoryFilter ?? "all";
  const setFeatureCategoryFilter = props.setFeatureCategoryFilter ?? (() => {});
  const searchQuery = props.searchQuery ?? "";
  const toggleFeature = props.toggleFeature ?? (() => {});
  const handleApplyPreset = props.handleApplyPreset ?? (() => {});
  const setIsImporterOpen = props.setIsImporterOpen ?? (() => {});
  const setIsExporterOpen = props.setIsExporterOpen ?? (() => {});
  const setIsBackupOpen = props.setIsBackupOpen ?? (() => {});
  const setIsPrintPreviewOpen = props.setIsPrintPreviewOpen ?? (() => {});
  const setIsWebhookTesterOpen = props.setIsWebhookTesterOpen ?? (() => {});
  const setIsNotifTesterOpen = props.setIsNotifTesterOpen ?? (() => {});
  const setIsMobileConnectOpen = props.setIsMobileConnectOpen ?? (() => {});
  const setIsFactoryResetOpen = props.setIsFactoryResetOpen ?? (() => {});
  const setIsAddYearOpen = props.setIsAddYearOpen ?? (() => {});
  const setTab = props.setTab ?? (() => {});
  return (
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
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// RolesTab
// ─────────────────────────────────────────────────────────────────────────────
export function RolesTab(props: SettingsTabProps) {
  const { settings, update } = props;
  const updateSettings = update;
  const systemSettings = settings;
  const currency = props.currency ?? "";
  const setCurrency = props.setCurrency ?? (() => {});
  const allAcademicYears = props.allAcademicYears ?? [];
  const handleSelectAcademicYear = props.onSelectYear ?? (() => {});
  const onAddYear = props.onAddYear ?? (() => {});
  const handleLogoUpload = props.onLogoUpload ?? (() => {});
  const handleStampUpload = props.onStampUpload ?? (() => {});
  const onPrintPreview = props.onPrintPreview ?? (() => {});
  const onOpenBackup = props.onOpenBackup ?? (() => {});
  const onImporter = props.onImporter ?? (() => {});
  const onExporter = props.onExporter ?? (() => {});
  const onWebhookTester = props.onWebhookTester ?? (() => {});
  const onOpenTester = props.onOpenTester ?? (() => {});
  const onMobileConnect = props.onMobileConnect ?? (() => {});
  const filteredFeaturesList = props.filteredFeaturesList ?? [];
  const activeFeaturesCount = props.activeFeaturesCount ?? 0;
  const totalFeaturesCount = props.totalFeaturesCount ?? 0;
  const activePercentage = props.activePercentage ?? 0;
  const featureCategoryFilter = props.featureCategoryFilter ?? "all";
  const setFeatureCategoryFilter = props.setFeatureCategoryFilter ?? (() => {});
  const searchQuery = props.searchQuery ?? "";
  const toggleFeature = props.toggleFeature ?? (() => {});
  const handleApplyPreset = props.handleApplyPreset ?? (() => {});
  const setIsImporterOpen = props.setIsImporterOpen ?? (() => {});
  const setIsExporterOpen = props.setIsExporterOpen ?? (() => {});
  const setIsBackupOpen = props.setIsBackupOpen ?? (() => {});
  const setIsPrintPreviewOpen = props.setIsPrintPreviewOpen ?? (() => {});
  const setIsWebhookTesterOpen = props.setIsWebhookTesterOpen ?? (() => {});
  const setIsNotifTesterOpen = props.setIsNotifTesterOpen ?? (() => {});
  const setIsMobileConnectOpen = props.setIsMobileConnectOpen ?? (() => {});
  const setIsFactoryResetOpen = props.setIsFactoryResetOpen ?? (() => {});
  const setIsAddYearOpen = props.setIsAddYearOpen ?? (() => {});
  const setTab = props.setTab ?? (() => {});
  return (
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
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// BackupTab
// ─────────────────────────────────────────────────────────────────────────────
export function BackupTab(props: SettingsTabProps) {
  const { settings, update } = props;
  const updateSettings = update;
  const systemSettings = settings;
  const currency = props.currency ?? "";
  const setCurrency = props.setCurrency ?? (() => {});
  const allAcademicYears = props.allAcademicYears ?? [];
  const handleSelectAcademicYear = props.onSelectYear ?? (() => {});
  const onAddYear = props.onAddYear ?? (() => {});
  const handleLogoUpload = props.onLogoUpload ?? (() => {});
  const handleStampUpload = props.onStampUpload ?? (() => {});
  const onPrintPreview = props.onPrintPreview ?? (() => {});
  const onOpenBackup = props.onOpenBackup ?? (() => {});
  const onImporter = props.onImporter ?? (() => {});
  const onExporter = props.onExporter ?? (() => {});
  const onWebhookTester = props.onWebhookTester ?? (() => {});
  const onOpenTester = props.onOpenTester ?? (() => {});
  const onMobileConnect = props.onMobileConnect ?? (() => {});
  const filteredFeaturesList = props.filteredFeaturesList ?? [];
  const activeFeaturesCount = props.activeFeaturesCount ?? 0;
  const totalFeaturesCount = props.totalFeaturesCount ?? 0;
  const activePercentage = props.activePercentage ?? 0;
  const featureCategoryFilter = props.featureCategoryFilter ?? "all";
  const setFeatureCategoryFilter = props.setFeatureCategoryFilter ?? (() => {});
  const searchQuery = props.searchQuery ?? "";
  const toggleFeature = props.toggleFeature ?? (() => {});
  const handleApplyPreset = props.handleApplyPreset ?? (() => {});
  const setIsImporterOpen = props.setIsImporterOpen ?? (() => {});
  const setIsExporterOpen = props.setIsExporterOpen ?? (() => {});
  const setIsBackupOpen = props.setIsBackupOpen ?? (() => {});
  const setIsPrintPreviewOpen = props.setIsPrintPreviewOpen ?? (() => {});
  const setIsWebhookTesterOpen = props.setIsWebhookTesterOpen ?? (() => {});
  const setIsNotifTesterOpen = props.setIsNotifTesterOpen ?? (() => {});
  const setIsMobileConnectOpen = props.setIsMobileConnectOpen ?? (() => {});
  const setIsFactoryResetOpen = props.setIsFactoryResetOpen ?? (() => {});
  const setIsAddYearOpen = props.setIsAddYearOpen ?? (() => {});
  const setTab = props.setTab ?? (() => {});
  return (
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
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// IntegrationsTab
// ─────────────────────────────────────────────────────────────────────────────
export function IntegrationsTab(props: SettingsTabProps) {
  const { settings, update } = props;
  const updateSettings = update;
  const systemSettings = settings;
  const currency = props.currency ?? "";
  const setCurrency = props.setCurrency ?? (() => {});
  const allAcademicYears = props.allAcademicYears ?? [];
  const handleSelectAcademicYear = props.onSelectYear ?? (() => {});
  const onAddYear = props.onAddYear ?? (() => {});
  const handleLogoUpload = props.onLogoUpload ?? (() => {});
  const handleStampUpload = props.onStampUpload ?? (() => {});
  const onPrintPreview = props.onPrintPreview ?? (() => {});
  const onOpenBackup = props.onOpenBackup ?? (() => {});
  const onImporter = props.onImporter ?? (() => {});
  const onExporter = props.onExporter ?? (() => {});
  const onWebhookTester = props.onWebhookTester ?? (() => {});
  const onOpenTester = props.onOpenTester ?? (() => {});
  const onMobileConnect = props.onMobileConnect ?? (() => {});
  const filteredFeaturesList = props.filteredFeaturesList ?? [];
  const activeFeaturesCount = props.activeFeaturesCount ?? 0;
  const totalFeaturesCount = props.totalFeaturesCount ?? 0;
  const activePercentage = props.activePercentage ?? 0;
  const featureCategoryFilter = props.featureCategoryFilter ?? "all";
  const setFeatureCategoryFilter = props.setFeatureCategoryFilter ?? (() => {});
  const searchQuery = props.searchQuery ?? "";
  const toggleFeature = props.toggleFeature ?? (() => {});
  const handleApplyPreset = props.handleApplyPreset ?? (() => {});
  const setIsImporterOpen = props.setIsImporterOpen ?? (() => {});
  const setIsExporterOpen = props.setIsExporterOpen ?? (() => {});
  const setIsBackupOpen = props.setIsBackupOpen ?? (() => {});
  const setIsPrintPreviewOpen = props.setIsPrintPreviewOpen ?? (() => {});
  const setIsWebhookTesterOpen = props.setIsWebhookTesterOpen ?? (() => {});
  const setIsNotifTesterOpen = props.setIsNotifTesterOpen ?? (() => {});
  const setIsMobileConnectOpen = props.setIsMobileConnectOpen ?? (() => {});
  const setIsFactoryResetOpen = props.setIsFactoryResetOpen ?? (() => {});
  const setIsAddYearOpen = props.setIsAddYearOpen ?? (() => {});
  const setTab = props.setTab ?? (() => {});
  return (
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
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// MobileTab
// ─────────────────────────────────────────────────────────────────────────────
export function MobileTab(props: SettingsTabProps) {
  const { settings, update } = props;
  const updateSettings = update;
  const systemSettings = settings;
  const currency = props.currency ?? "";
  const setCurrency = props.setCurrency ?? (() => {});
  const allAcademicYears = props.allAcademicYears ?? [];
  const handleSelectAcademicYear = props.onSelectYear ?? (() => {});
  const onAddYear = props.onAddYear ?? (() => {});
  const handleLogoUpload = props.onLogoUpload ?? (() => {});
  const handleStampUpload = props.onStampUpload ?? (() => {});
  const onPrintPreview = props.onPrintPreview ?? (() => {});
  const onOpenBackup = props.onOpenBackup ?? (() => {});
  const onImporter = props.onImporter ?? (() => {});
  const onExporter = props.onExporter ?? (() => {});
  const onWebhookTester = props.onWebhookTester ?? (() => {});
  const onOpenTester = props.onOpenTester ?? (() => {});
  const onMobileConnect = props.onMobileConnect ?? (() => {});
  const filteredFeaturesList = props.filteredFeaturesList ?? [];
  const activeFeaturesCount = props.activeFeaturesCount ?? 0;
  const totalFeaturesCount = props.totalFeaturesCount ?? 0;
  const activePercentage = props.activePercentage ?? 0;
  const featureCategoryFilter = props.featureCategoryFilter ?? "all";
  const setFeatureCategoryFilter = props.setFeatureCategoryFilter ?? (() => {});
  const searchQuery = props.searchQuery ?? "";
  const toggleFeature = props.toggleFeature ?? (() => {});
  const handleApplyPreset = props.handleApplyPreset ?? (() => {});
  const setIsImporterOpen = props.setIsImporterOpen ?? (() => {});
  const setIsExporterOpen = props.setIsExporterOpen ?? (() => {});
  const setIsBackupOpen = props.setIsBackupOpen ?? (() => {});
  const setIsPrintPreviewOpen = props.setIsPrintPreviewOpen ?? (() => {});
  const setIsWebhookTesterOpen = props.setIsWebhookTesterOpen ?? (() => {});
  const setIsNotifTesterOpen = props.setIsNotifTesterOpen ?? (() => {});
  const setIsMobileConnectOpen = props.setIsMobileConnectOpen ?? (() => {});
  const setIsFactoryResetOpen = props.setIsFactoryResetOpen ?? (() => {});
  const setIsAddYearOpen = props.setIsAddYearOpen ?? (() => {});
  const setTab = props.setTab ?? (() => {});
  return (
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
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// APITab
// ─────────────────────────────────────────────────────────────────────────────
export function APITab(props: SettingsTabProps) {
  const { settings, update } = props;
  const updateSettings = update;
  const systemSettings = settings;
  const currency = props.currency ?? "";
  const setCurrency = props.setCurrency ?? (() => {});
  const allAcademicYears = props.allAcademicYears ?? [];
  const handleSelectAcademicYear = props.onSelectYear ?? (() => {});
  const onAddYear = props.onAddYear ?? (() => {});
  const handleLogoUpload = props.onLogoUpload ?? (() => {});
  const handleStampUpload = props.onStampUpload ?? (() => {});
  const onPrintPreview = props.onPrintPreview ?? (() => {});
  const onOpenBackup = props.onOpenBackup ?? (() => {});
  const onImporter = props.onImporter ?? (() => {});
  const onExporter = props.onExporter ?? (() => {});
  const onWebhookTester = props.onWebhookTester ?? (() => {});
  const onOpenTester = props.onOpenTester ?? (() => {});
  const onMobileConnect = props.onMobileConnect ?? (() => {});
  const filteredFeaturesList = props.filteredFeaturesList ?? [];
  const activeFeaturesCount = props.activeFeaturesCount ?? 0;
  const totalFeaturesCount = props.totalFeaturesCount ?? 0;
  const activePercentage = props.activePercentage ?? 0;
  const featureCategoryFilter = props.featureCategoryFilter ?? "all";
  const setFeatureCategoryFilter = props.setFeatureCategoryFilter ?? (() => {});
  const searchQuery = props.searchQuery ?? "";
  const toggleFeature = props.toggleFeature ?? (() => {});
  const handleApplyPreset = props.handleApplyPreset ?? (() => {});
  const setIsImporterOpen = props.setIsImporterOpen ?? (() => {});
  const setIsExporterOpen = props.setIsExporterOpen ?? (() => {});
  const setIsBackupOpen = props.setIsBackupOpen ?? (() => {});
  const setIsPrintPreviewOpen = props.setIsPrintPreviewOpen ?? (() => {});
  const setIsWebhookTesterOpen = props.setIsWebhookTesterOpen ?? (() => {});
  const setIsNotifTesterOpen = props.setIsNotifTesterOpen ?? (() => {});
  const setIsMobileConnectOpen = props.setIsMobileConnectOpen ?? (() => {});
  const setIsFactoryResetOpen = props.setIsFactoryResetOpen ?? (() => {});
  const setIsAddYearOpen = props.setIsAddYearOpen ?? (() => {});
  const setTab = props.setTab ?? (() => {});
  return (
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
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// SecurityTab
// ─────────────────────────────────────────────────────────────────────────────
export function SecurityTab(props: SettingsTabProps) {
  const { settings, update } = props;
  const updateSettings = update;
  const systemSettings = settings;
  const currency = props.currency ?? "";
  const setCurrency = props.setCurrency ?? (() => {});
  const allAcademicYears = props.allAcademicYears ?? [];
  const handleSelectAcademicYear = props.onSelectYear ?? (() => {});
  const onAddYear = props.onAddYear ?? (() => {});
  const handleLogoUpload = props.onLogoUpload ?? (() => {});
  const handleStampUpload = props.onStampUpload ?? (() => {});
  const onPrintPreview = props.onPrintPreview ?? (() => {});
  const onOpenBackup = props.onOpenBackup ?? (() => {});
  const onImporter = props.onImporter ?? (() => {});
  const onExporter = props.onExporter ?? (() => {});
  const onWebhookTester = props.onWebhookTester ?? (() => {});
  const onOpenTester = props.onOpenTester ?? (() => {});
  const onMobileConnect = props.onMobileConnect ?? (() => {});
  const filteredFeaturesList = props.filteredFeaturesList ?? [];
  const activeFeaturesCount = props.activeFeaturesCount ?? 0;
  const totalFeaturesCount = props.totalFeaturesCount ?? 0;
  const activePercentage = props.activePercentage ?? 0;
  const featureCategoryFilter = props.featureCategoryFilter ?? "all";
  const setFeatureCategoryFilter = props.setFeatureCategoryFilter ?? (() => {});
  const searchQuery = props.searchQuery ?? "";
  const toggleFeature = props.toggleFeature ?? (() => {});
  const handleApplyPreset = props.handleApplyPreset ?? (() => {});
  const setIsImporterOpen = props.setIsImporterOpen ?? (() => {});
  const setIsExporterOpen = props.setIsExporterOpen ?? (() => {});
  const setIsBackupOpen = props.setIsBackupOpen ?? (() => {});
  const setIsPrintPreviewOpen = props.setIsPrintPreviewOpen ?? (() => {});
  const setIsWebhookTesterOpen = props.setIsWebhookTesterOpen ?? (() => {});
  const setIsNotifTesterOpen = props.setIsNotifTesterOpen ?? (() => {});
  const setIsMobileConnectOpen = props.setIsMobileConnectOpen ?? (() => {});
  const setIsFactoryResetOpen = props.setIsFactoryResetOpen ?? (() => {});
  const setIsAddYearOpen = props.setIsAddYearOpen ?? (() => {});
  const setTab = props.setTab ?? (() => {});
  return (
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
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// DataIOTab
// ─────────────────────────────────────────────────────────────────────────────
export function DataIOTab(props: SettingsTabProps) {
  const { settings, update } = props;
  const updateSettings = update;
  const systemSettings = settings;
  const currency = props.currency ?? "";
  const setCurrency = props.setCurrency ?? (() => {});
  const allAcademicYears = props.allAcademicYears ?? [];
  const handleSelectAcademicYear = props.onSelectYear ?? (() => {});
  const onAddYear = props.onAddYear ?? (() => {});
  const handleLogoUpload = props.onLogoUpload ?? (() => {});
  const handleStampUpload = props.onStampUpload ?? (() => {});
  const onPrintPreview = props.onPrintPreview ?? (() => {});
  const onOpenBackup = props.onOpenBackup ?? (() => {});
  const onImporter = props.onImporter ?? (() => {});
  const onExporter = props.onExporter ?? (() => {});
  const onWebhookTester = props.onWebhookTester ?? (() => {});
  const onOpenTester = props.onOpenTester ?? (() => {});
  const onMobileConnect = props.onMobileConnect ?? (() => {});
  const filteredFeaturesList = props.filteredFeaturesList ?? [];
  const activeFeaturesCount = props.activeFeaturesCount ?? 0;
  const totalFeaturesCount = props.totalFeaturesCount ?? 0;
  const activePercentage = props.activePercentage ?? 0;
  const featureCategoryFilter = props.featureCategoryFilter ?? "all";
  const setFeatureCategoryFilter = props.setFeatureCategoryFilter ?? (() => {});
  const searchQuery = props.searchQuery ?? "";
  const toggleFeature = props.toggleFeature ?? (() => {});
  const handleApplyPreset = props.handleApplyPreset ?? (() => {});
  const setIsImporterOpen = props.setIsImporterOpen ?? (() => {});
  const setIsExporterOpen = props.setIsExporterOpen ?? (() => {});
  const setIsBackupOpen = props.setIsBackupOpen ?? (() => {});
  const setIsPrintPreviewOpen = props.setIsPrintPreviewOpen ?? (() => {});
  const setIsWebhookTesterOpen = props.setIsWebhookTesterOpen ?? (() => {});
  const setIsNotifTesterOpen = props.setIsNotifTesterOpen ?? (() => {});
  const setIsMobileConnectOpen = props.setIsMobileConnectOpen ?? (() => {});
  const setIsFactoryResetOpen = props.setIsFactoryResetOpen ?? (() => {});
  const setIsAddYearOpen = props.setIsAddYearOpen ?? (() => {});
  const setTab = props.setTab ?? (() => {});
  return (
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
  );
}
