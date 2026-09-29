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
  handleApplyPreset?: (preset: "enterprise" | "academic" | "minimal" | "default") => void;
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
      title="╪º┘ä╪¬╪¡┘â┘à ╪¿┘à┘è╪▓╪º╪¬ ╪º┘ä┘å╪╕╪º┘à ┘ê╪º┘ä┘ê╪¡╪»╪º╪¬ ╪º┘ä╪¬╪┤╪║┘è┘ä┘è╪⌐"
      description="╪¬┘ü╪╣┘è┘ä ╪ú┘ê ╪¬╪╣╪╖┘è┘ä ┘ê╪¡╪»╪º╪¬ ╪º┘ä┘à┘å╪╕┘ê┘à╪⌐ ┘ê╪º┘ä┘à┘è╪▓╪º╪¬ ╪º┘ä╪▒┘é┘à┘è╪⌐ ┘ê╪º┘ä╪¬╪╖╪¿┘è┘é╪º╪¬ ┘ê╪º┘ä╪▒╪¿╪╖ ╪º┘ä╪¿╪▒┘à╪¼┘è ┘à╪╣ ╪¬╪¡┘â┘à ┘ä╪¡╪╕┘è ┘è┘å╪╣┘â╪│ ┘à╪¿╪º╪┤╪▒╪⌐ ╪╣┘ä┘ë ╪º┘ä┘é╪º╪ª┘à╪⌐ ╪º┘ä╪¼╪º┘å╪¿┘è╪⌐ ┘ê╪º┘ä╪╡┘ä╪º╪¡┘è╪º╪¬"
    >
      <div className="space-y-6">
        {/* Features KPI Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-1">
            <span className="text-xs font-bold text-muted-foreground">╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘à┘è╪▓╪º╪¬ ╪º┘ä┘à╪¬╪º╪¡╪⌐</span>
            <div className="text-2xl font-black text-foreground font-mono">{totalFeaturesCount}</div>
            <div className="text-[11px] text-muted-foreground">┘à┘è╪▓╪º╪¬ ┘à╪¬┘â╪º┘à┘ä╪⌐ ╪¿╪º┘ä┘à┘å╪╕┘ê┘à╪⌐</div>
          </div>
          <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 shadow-xs space-y-1">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">╪º┘ä┘à┘è╪▓╪º╪¬ ╪º┘ä┘å╪┤╪╖╪⌐ ╪¡╪º┘ä┘è╪º┘ï</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{activeFeaturesCount}</div>
            <div className="text-[11px] text-emerald-600/80">┘à┘ü╪╣┘ä╪⌐ ┘ê╪¬╪╣┘à┘ä ┘à╪¿╪º╪┤╪▒╪⌐</div>
          </div>
          <div className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-1">
            <span className="text-xs font-bold text-muted-foreground">╪º┘ä┘à┘è╪▓╪º╪¬ ╪º┘ä┘à╪╣╪╖┘ä╪⌐</span>
            <div className="text-2xl font-black text-muted-foreground font-mono">{totalFeaturesCount - activeFeaturesCount}</div>
            <div className="text-[11px] text-muted-foreground">┘à╪¡╪¼┘ê╪¿╪⌐ ╪╣┘å ╪º┘ä┘ê╪º╪¼┘ç╪⌐</div>
          </div>
          <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 shadow-xs space-y-1">
            <span className="text-xs font-bold text-primary">┘å╪│╪¿╪⌐ ╪º┘ä╪¼╪º┘ç╪▓┘è╪⌐ ┘ê╪º┘ä╪¬╪┤╪║┘è┘ä</span>
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
              <span>┘é┘ê╪º┘ä╪¿ ╪º┘ä╪╢╪¿╪╖ ╪º┘ä╪│╪▒┘è╪╣ ┘ä┘ä┘à┘è╪▓╪º╪¬ (Presets)</span>
            </span>
            <span className="text-[11px] text-muted-foreground">╪¬╪╖╪¿┘è┘é ┘à╪│╪¿┘é ╪¡╪│╪¿ ┘å┘à┘ê╪░╪¼ ╪º┘ä┘à┘å╪┤╪ú╪⌐</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset("enterprise")}
              className="px-3 py-1.5 rounded-xl bg-card border border-border hover:border-primary text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span>╪¬┘ü╪╣┘è┘ä ┘â╪º┘ü╪⌐ ╪º┘ä┘à┘è╪▓╪º╪¬ (Enterprise ╪º┘ä╪┤╪º┘à┘ä╪⌐)</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("academic")}
              className="px-3 py-1.5 rounded-xl bg-card border border-border hover:border-primary text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <SchoolIcon className="h-3.5 w-3.5 text-blue-500" />
              <span>╪º┘ä┘ê╪╢╪╣ ╪º┘ä╪ú┘â╪º╪»┘è┘à┘è ┘ê╪º┘ä╪¬╪╣┘ä┘è┘à┘è (╪¿╪»┘ê┘å ┘å┘é┘ä ┘ê┘à╪│╪¬┘ê╪»╪╣╪º╪¬)</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("minimal")}
              className="px-3 py-1.5 rounded-xl bg-card border border-border hover:border-primary text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
              <span>╪º┘ä┘ê╪╢╪╣ ╪º┘ä┘à╪¿╪│╪╖ (╪º┘ä╪╡┘ü┘ê┘ü╪î ╪º┘ä╪╖┘ä╪º╪¿ ┘ê╪º┘ä╪»╪▒╪¼╪º╪¬)</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("default")}
              className="px-3 py-1.5 rounded-xl bg-card border border-border hover:border-primary text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 text-muted-foreground"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              <span>╪º┘ä╪º┘ü╪¬╪▒╪º╪╢┘è</span>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
          {[
            { id: "all", label: "┘â╪º┘ü╪⌐ ╪º┘ä┘à┘è╪▓╪º╪¬ (20)" },
            { id: "core", label: "╪º┘ä┘ê╪¡╪»╪º╪¬ ╪º┘ä╪¬╪┤╪║┘è┘ä┘è╪⌐ ╪º┘ä╪ú╪│╪º╪│┘è╪⌐ (9)" },
            { id: "portals", label: "╪º┘ä╪¿┘ê╪º╪¿╪º╪¬ ┘ê╪º┘ä╪¬╪╖╪¿┘è┘é╪º╪¬ ┘ê╪º┘ä╪º╪¬╪╡╪º┘ä (4)" },
            { id: "tech", label: "╪º┘ä╪¬┘é┘å┘è╪⌐ ┘ê╪º┘ä╪¬┘â╪º┘à┘ä ╪º┘ä╪░┘â┘è (5)" },
            { id: "security", label: "╪º┘ä╪ú┘à╪º┘å ┘ê╪¡┘à╪º┘è╪⌐ ╪º┘ä╪¿┘è╪º┘å╪º╪¬ (2)" },
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
                            ? `╪¬┘à ╪¬┘ü╪╣┘è┘ä: ${feat.name} ┘ê╪¬╪¡╪»┘è╪½ ╪º┘ä┘é╪º╪ª┘à╪⌐ ╪º┘ä╪¼╪º┘å╪¿┘è╪⌐ ┘ü┘ê╪▒╪º┘ï`
                            : `╪¬┘à ╪¬╪╣╪╖┘è┘ä: ${feat.name} ┘ê╪Ñ╪«┘ü╪º╪ñ┘ç╪º ┘à┘å ╪º┘ä┘é╪º╪ª┘à╪⌐ ╪º┘ä╪¼╪º┘å╪¿┘è╪⌐`
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
                        title={`╪º┘ä╪º┘å╪¬┘é╪º┘ä ╪Ñ┘ä┘ë ╪¬╪¿┘ê┘è╪¿ ${feat.tabLabel}`}
                      >
                        <Settings className="h-3 w-3 text-primary" />
                        <span>{feat.tabLabel || "╪Ñ╪╣╪»╪º╪»╪º╪¬"}</span>
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
                        <span>{feat.modalLabel || "╪º╪«╪¬╪¿╪º╪▒ / ┘å╪º┘ü╪░╪⌐"}</span>
                      </button>
                    )}

                    {/* Direct Route Link */}
                    {feat.route && isEnabled && (
                      <Link
                        to={feat.route}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] font-black transition-all shadow-2xs"
                      >
                        <span>{feat.routeLabel || "╪º┘ä╪º┘å╪¬┘é╪º┘ä ┘ä┘ä┘ê╪¡╪»╪⌐"}</span>
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
      title="╪¿┘è╪º┘å╪º╪¬ ┘ê┘ç┘ê┘è╪⌐ ╪º┘ä┘à╪»╪▒╪│╪⌐ ╪º┘ä╪▒╪│┘à┘è╪⌐"
      description="╪º┘ä┘à╪╣┘ä┘ê┘à╪º╪¬ ╪º┘ä╪ú╪│╪º╪│┘è╪⌐ ╪º┘ä┘à╪╣╪¬┘à╪»╪⌐ ┘ä┘ä┘à╪ñ╪│╪│╪⌐ ╪º┘ä╪¬╪╣┘ä┘è┘à┘è╪⌐ ┘ê╪º┘ä╪¬┘è ╪¬╪╕┘ç╪▒ ╪╣┘ä┘ë ┘â╪º┘ü╪⌐ ╪º┘ä╪¬┘é╪º╪▒┘è╪▒ ┘ê╪º┘ä╪┤┘ç╪º╪»╪º╪¬ ┘ê╪º┘ä┘à╪▒╪º╪│┘ä╪º╪¬"
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="╪º┘ä╪º╪│┘à ╪º┘ä╪▒╪│┘à┘è ┘ä┘ä┘à╪»╪▒╪│╪⌐">
            <input
              value={systemSettings.schoolName}
              onChange={(e) => updateSettings({ schoolName: e.target.value })}
              className={inp}
              placeholder="┘à╪»╪▒╪│╪⌐ ╪º┘ä┘å┘à┘ê╪░╪¼ ╪º┘ä╪ú┘ç┘ä┘è╪⌐"
            />
          </Field>
          <Field label="╪▒┘é┘à ╪º┘ä╪¬╪▒╪«┘è╪╡ ╪º┘ä┘ê╪▓╪º╪▒┘è">
            <input
              value={systemSettings.licenseNumber}
              onChange={(e) => updateSettings({ licenseNumber: e.target.value })}
              className={inp}
              placeholder="LIC-2024-001"
            />
          </Field>
          <Field label="╪º┘ä┘à╪»┘è╪▒ ╪º┘ä╪╣╪º┘à ╪º┘ä┘à╪╣╪¬┘à╪»">
            <input
              value={systemSettings.principalName}
              onChange={(e) => updateSettings({ principalName: e.target.value })}
              className={inp}
              placeholder="╪ú.╪». ╪«╪º┘ä╪» ╪º┘ä┘é╪¡╪╖╪º┘å┘è"
            />
          </Field>
          <Field label="┘å┘ê╪╣ ╪º┘ä┘à┘å╪┤╪ú╪⌐ ┘ê╪º┘ä╪¬╪╣┘ä┘è┘à">
            <select
              value={systemSettings.schoolType || "╪ú┘ç┘ä┘è (╪¿┘å┘è┘å ┘ê╪¿┘å╪º╪¬)"}
              onChange={(e) => updateSettings({ schoolType: e.target.value })}
              className={inp}
            >
              <option>╪ú┘ç┘ä┘è (╪¿┘å┘è┘å ┘ê╪¿┘å╪º╪¬)</option>
              <option>╪ú┘ç┘ä┘è (╪¿┘å┘è┘å ┘ü┘é╪╖)</option>
              <option>╪ú┘ç┘ä┘è (╪¿┘å╪º╪¬ ┘ü┘é╪╖)</option>
              <option>╪╣╪º┘ä┘à┘è ┘ê╪»┘ê┘ä┘è (International)</option>
              <option>╪¡┘â┘ê┘à┘è ╪▒╪│┘à┘è</option>
            </select>
          </Field>
          <Field label="╪▒┘é┘à ╪º┘ä┘ç╪º╪¬┘ü ╪º┘ä╪½╪º╪¿╪¬ ╪º┘ä┘à╪╣╪¬┘à╪»">
            <input
              value={systemSettings.phone}
              onChange={(e) => updateSettings({ phone: e.target.value })}
              className={inp}
              placeholder="0112345678"
            />
          </Field>
          <Field label="╪º┘ä╪¿╪▒┘è╪» ╪º┘ä╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è ╪º┘ä╪▒╪│┘à┘è">
            <input
              type="email"
              value={systemSettings.email}
              onChange={(e) => updateSettings({ email: e.target.value })}
              className={inp}
              placeholder="info@school.edu.sa"
            />
          </Field>
          <Field label="╪º┘ä┘à┘ê┘é╪╣ ╪º┘ä╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è ╪º┘ä╪▒╪│┘à┘è">
            <input
              type="url"
              dir="ltr"
              value={systemSettings.schoolWebsite || "https://school.edu.sa"}
              onChange={(e) => updateSettings({ schoolWebsite: e.target.value })}
              className={inp}
              placeholder="https://myschool.edu.sa"
            />
          </Field>
          <Field label="╪º┘ä╪╣┘å┘ê╪º┘å / ╪º┘ä┘à╪»┘è┘å╪⌐ ┘ê╪º┘ä╪¡┘è">
            <input
              value={systemSettings.address}
              onChange={(e) => updateSettings({ address: e.target.value })}
              className={inp}
              placeholder="╪º┘ä╪▒┘è╪º╪╢ - ╪¡┘è ╪º┘ä┘ê╪º╪¡╪⌐ - ╪╖╪▒┘è┘é ╪º┘ä┘à┘ä┘â ╪╣╪¿╪»╪º┘ä┘ä┘ç"
            />
          </Field>
        </div>

        <div className="pt-2">
          <Field label="╪º┘ä╪▒╪ñ┘è╪⌐ ┘ê╪º┘ä╪▒╪│╪º┘ä╪⌐ ╪º┘ä┘à╪ñ╪│╪│┘è╪⌐ (╪¬┘Å╪╢┘à┘å ┘ü┘è ╪º┘ä╪¬┘é╪º╪▒┘è╪▒ ┘ê╪º┘ä╪«╪╖╪╖)">
            <textarea
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold leading-relaxed focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              value={systemSettings.vision}
              onChange={(e) => updateSettings({ vision: e.target.value })}
              placeholder="╪º┘ä╪▒┘è╪º╪»╪⌐ ┘ü┘è ╪¬┘é╪»┘è┘à ╪¬╪╣┘ä┘è┘à ┘å┘ê╪╣┘è ┘è┘å┘à┘è ┘à┘ç╪º╪▒╪º╪¬ ╪º┘ä┘à╪│╪¬┘é╪¿┘ä..."
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
      title="╪º┘ä┘ç┘ê┘è╪⌐ ╪º┘ä╪¿╪╡╪▒┘è╪⌐ ┘ê╪º┘ä┘à╪╖╪¿┘ê╪╣╪º╪¬ ╪º┘ä┘à╪╣╪¬┘à╪»╪⌐"
      description="╪Ñ╪»╪º╪▒╪⌐ ╪┤╪╣╪º╪▒ ╪º┘ä┘à╪»╪▒╪│╪⌐╪î ╪º┘ä╪«╪¬┘à ╪º┘ä╪▒╪│┘à┘è ┘ä┘ä╪┤┘ç╪º╪»╪º╪¬ ┘ê╪º┘ä┘ü┘ê╪º╪¬┘è╪▒╪î ┘ê╪º┘ä╪¬╪▒┘ê┘è╪│╪⌐ ╪º┘ä╪▒┘é┘à┘è╪⌐"
    >
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Official Logo Uploader with Live Preview */}
          <div className="rounded-2xl border border-border p-4 bg-card/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground">╪º┘ä╪┤╪╣╪º╪▒ ╪º┘ä╪▒╪│┘à┘è ┘ä┘ä┘à╪»╪▒╪│╪⌐ (Logo)</span>
              {systemSettings.logoUrl && (
                <button
                  onClick={() => { updateSettings({ logoUrl: "" }); toast.info("╪¬┘à╪¬ ╪Ñ╪▓╪º┘ä╪⌐ ╪º┘ä╪┤╪╣╪º╪▒"); }}
                  className="text-[11px] font-bold text-danger hover:underline"
                >
                  ╪Ñ╪▓╪º┘ä╪⌐ ╪º┘ä╪┤╪╣╪º╪▒
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
                  <span>╪▒┘ü╪╣ ╪┤╪╣╪º╪▒ ╪¼╪»┘è╪»</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  ╪╡┘è╪║╪⌐ PNG ╪ú┘ê SVG ╪¿╪«┘ä┘ü┘è╪⌐ ╪┤┘ü╪º┘ü╪⌐ ┘ä╪╢┘à╪º┘å ╪¼┘ê╪»╪⌐ ╪º┘ä╪┤┘ç╪º╪»╪º╪¬ ┘ê╪º┘ä┘à╪╖╪¿┘ê╪╣╪º╪¬.
                </p>
              </div>
            </div>
          </div>

          {/* Official Digital Stamp Uploader with Live Preview */}
          <div className="rounded-2xl border border-border p-4 bg-card/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground">╪º┘ä╪«╪¬┘à ╪º┘ä┘à╪╣╪¬┘à╪» (┘ä┘ä╪┤┘ç╪º╪»╪º╪¬ ┘ê╪º┘ä┘ü┘ê╪º╪¬┘è╪▒)</span>
              {systemSettings.stampUrl && (
                <button
                  onClick={() => { updateSettings({ stampUrl: "" }); toast.info("╪¬┘à╪¬ ╪Ñ╪▓╪º┘ä╪⌐ ╪º┘ä╪«╪¬┘à"); }}
                  className="text-[11px] font-bold text-danger hover:underline"
                >
                  ╪Ñ╪▓╪º┘ä╪⌐ ╪º┘ä╪«╪¬┘à
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-red-500/30 bg-red-500/5 flex items-center justify-center overflow-hidden shrink-0">
                {systemSettings.stampUrl ? (
                  <img src={systemSettings.stampUrl} alt="Stamp" className="h-full w-full object-contain p-1 rotate-[-6deg]" />
                ) : (
                  <div className="h-16 w-16 rounded-full border border-dashed border-red-400 text-red-500/60 flex items-center justify-center text-[10px] font-black rotate-[-12deg]">
                    ╪«╪¬┘à ╪▒╪│┘à┘è
                  </div>
                )}
              </div>
              <div className="space-y-2 flex-1">
                <label className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-card hover:bg-accent px-4 text-xs font-bold text-foreground transition-all cursor-pointer shadow-xs">
                  <Upload className="h-3.5 w-3.5 text-primary" />
                  <span>╪▒┘ü╪╣ ╪╡┘ê╪▒╪⌐ ╪º┘ä╪«╪¬┘à</span>
                  <input type="file" accept="image/*" onChange={handleStampUpload} className="hidden" />
                </label>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  ╪╡┘ê╪▒╪⌐ ╪º┘ä╪«╪¬┘à ╪º┘ä╪»╪º╪ª╪▒┘è ╪ú┘ê ╪º┘ä╪¿┘è╪╢╪º┘ê┘è ╪¿╪»┘é╪⌐ ╪╣╪º┘ä┘è╪⌐ ┘ê╪«┘ä┘ü┘è╪⌐ ┘à┘ü╪▒╪║╪⌐.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Field label="╪¬╪░┘è┘è┘ä ╪º┘ä┘à╪╖╪¿┘ê╪╣╪º╪¬ ┘ê╪º┘ä┘ê╪½╪º╪ª┘é ╪º┘ä╪▒╪│┘à┘è ╪º┘ä╪º┘ü╪¬╪▒╪º╪╢┘è">
            <input
              value={systemSettings.footerText}
              onChange={(e) => updateSettings({ footerText: e.target.value })}
              className={inp}
              placeholder="┘ç╪░┘ç ╪º┘ä┘ê╪½┘è┘é╪⌐ ╪▒╪│┘à┘è╪⌐ ┘ê┘à╪│╪¬╪«╪▒╪¼╪⌐ ╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è╪º┘ï ┘à┘å ┘à┘å╪╡╪⌐ ┘à╪»╪º╪▒╪│"
            />
          </Field>
        </div>

        {/* Live Preview Button */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="font-black text-sm text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>╪º┘ä┘à╪╣╪º┘è┘å╪⌐ ╪º┘ä┘à╪¿╪º╪┤╪▒╪⌐ ┘ä┘ä╪¬╪▒┘ê┘è╪│╪⌐ ┘ê╪º┘ä┘à╪╖╪¿┘ê╪╣╪º╪¬ ╪º┘ä╪▒╪│┘à┘è╪⌐ (A4)</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              ╪¬╪ú┘â╪» ┘à┘å ╪┤┘â┘ä ╪º┘ä╪┤╪╣╪º╪▒╪î ╪º┘ä╪«╪¬┘à╪î ┘ê╪º┘ä╪¿╪º╪▒┘â┘ê╪» ╪º┘ä╪▒┘é┘à┘è ┘â┘à╪º ╪│┘è╪╕┘ç╪▒ ┘ä┘ä╪╖╪º┘ä╪¿ ┘ê┘ê┘ä┘è ╪º┘ä╪ú┘à╪▒ ╪╣┘å╪» ╪º┘ä╪╖╪¿╪º╪╣╪⌐
            </div>
          </div>
          <button
            onClick={() => setIsPrintPreviewOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md shadow-primary/20 shrink-0"
          >
            <Eye className="h-4 w-4" /> ┘ü╪¬╪¡ ╪º┘ä┘à╪╣╪º┘è┘å╪⌐ ╪º┘ä╪¡┘è╪⌐ (A4)
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
      title="╪Ñ╪»╪º╪▒╪⌐ ╪º┘ä┘à╪▒╪º┘ü┘é ┘ê╪º┘ä┘é╪º╪╣╪º╪¬ ┘ê╪º┘ä╪ú╪╡┘ê┘ä"
      description="╪Ñ╪╣╪»╪º╪» ╪¬╪╡┘å┘è┘ü╪º╪¬ ╪º┘ä┘é╪º╪╣╪º╪¬ ┘ê╪º┘ä┘à╪│╪¬┘ê╪»╪╣╪î ╪¬┘å╪¿┘è┘ç╪º╪¬ ╪º┘ä╪╡┘è╪º┘å╪⌐ ╪º┘ä┘ê┘é╪º╪ª┘è╪⌐╪î ┘ê╪│┘è╪º╪│╪º╪¬ ╪¬╪▒┘é┘è┘à ╪º┘ä╪ú╪╡┘ê┘ä"
    >
      <div className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <TagManagerField
            label="╪¬╪╡┘å┘è┘ü╪º╪¬ ╪º┘ä┘é╪º╪╣╪º╪¬ ┘ê╪º┘ä┘à╪▒╪º┘ü┘é ╪º┘ä┘à╪╣╪¬┘à╪»╪⌐"
            description="╪º┘ä╪¬╪╡┘å┘è┘ü╪º╪¬ ╪º┘ä┘à╪¬╪º╪¡╪⌐ ╪╣┘å╪» ╪Ñ╪╢╪º┘ü╪⌐ ╪║╪▒┘ü ╪ú┘ê ┘à╪╣╪º┘à┘ä ╪¼╪»┘è╪»╪⌐"
            tagsString={systemSettings.roomCategories}
            onUpdate={(newStr) => updateSettings({ roomCategories: newStr })}
          />

          <TagManagerField
            label="╪¬╪╡┘å┘è┘ü╪º╪¬ ╪º┘ä╪ú╪╡┘ê┘ä ┘ê╪º┘ä┘à┘à╪¬┘ä┘â╪º╪¬"
            description="╪¬╪¿┘ê┘è╪¿ ╪ú╪¼┘ç╪▓╪⌐ ┘ê╪ú╪½╪º╪½ ╪º┘ä┘à╪»╪▒╪│╪⌐ ┘ü┘è ╪│╪¼┘ä ╪º┘ä╪╣┘ç╪»"
            tagsString={systemSettings.assetCategories}
            onUpdate={(newStr) => updateSettings({ assetCategories: newStr })}
          />

          <Field label="┘å╪╕╪º┘à ╪¬╪▒┘é┘è┘à ╪º┘ä┘é╪º╪╣╪º╪¬ ┘ê╪º┘ä╪║╪▒┘ü">
            <select
              className={inp}
              value={systemSettings.roomNumbering}
              onChange={(e) => updateSettings({ roomNumbering: e.target.value })}
            >
              <option>╪¬╪▒┘é┘è┘à ╪¬┘ä┘é╪º╪ª┘è ╪░┘â┘è (RM-XXXX)</option>
              <option>╪¬╪▒┘é┘è┘à ┘è╪»┘ê┘è ┘à╪«╪╡╪╡ ┘à┘å ╪º┘ä╪Ñ╪»╪º╪▒╪⌐</option>
              <option>╪¬╪▒┘é┘è┘à ╪¡╪│╪¿ ╪º┘ä┘à╪¿┘å┘ë ┘ê╪º┘ä╪╖╪º╪¿┘é (B1-F1-01)</option>
            </select>
          </Field>

          <Field label="╪¬┘å╪¿┘è┘ç╪º╪¬ ╪º┘ä╪╡┘è╪º┘å╪⌐ ╪º┘ä┘ê┘é╪º╪ª┘è╪⌐ ╪º┘ä┘à╪¿┘â╪▒╪⌐">
            <select
              className={inp}
              value={systemSettings.maintenanceAlert}
              onChange={(e) => updateSettings({ maintenanceAlert: e.target.value })}
            >
              <option>┘à┘ü╪╣┘ä (┘é╪¿┘ä 7 ╪ú┘è╪º┘à ┘à┘å ╪º┘ä┘à┘ê╪╣╪»)</option>
              <option>┘à┘ü╪╣┘ä (┘é╪¿┘ä 3 ╪ú┘è╪º┘à ┘à┘å ╪º┘ä┘à┘ê╪╣╪»)</option>
              <option>┘à┘ü╪╣┘ä (┘é╪¿┘ä 24 ╪│╪º╪╣╪⌐)</option>
              <option>┘à╪╣╪╖┘ä</option>
            </select>
          </Field>
        </div>

        <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-4">
          <div className="flex items-center gap-2 font-black text-sm text-foreground">
            <Building className="h-4 w-4 text-primary" />
            <span>╪│┘è╪º╪│╪º╪¬ ╪º┘ä┘à╪│╪¬┘ê╪»╪╣ ╪º┘ä┘à╪▒┘â╪▓┘è ┘ê╪¼╪▒╪» ╪º┘ä╪╣┘ç╪»</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="╪¡╪» ╪º┘ä╪¬┘å╪¿┘è┘ç ┘ä┘ä┘à╪«╪▓┘ê┘å ╪º┘ä┘à┘å╪«┘ü╪╢ (┘é╪╖╪╣)">
              <input
                type="number"
                className={inp}
                value={systemSettings.inventoryAlertLimit}
                onChange={(e) => updateSettings({ inventoryAlertLimit: Math.max(0, parseInt(e.target.value) || 0) })}
              />
            </Field>
            <Field label="╪╖╪▒┘è┘é╪⌐ ╪º╪¡╪¬╪│╪º╪¿ ╪¬┘â┘ä┘ü╪⌐ ┘ê╪¼╪▒╪» ╪º┘ä┘à╪«╪▓┘ê┘å">
              <select
                className={inp}
                value={systemSettings.inventoryMethod}
                onChange={(e) => updateSettings({ inventoryMethod: e.target.value })}
              >
                <option>FIFO (┘à╪º ┘è╪»╪«┘ä ╪ú┘ê┘ä╪º┘ï ┘è╪«╪▒╪¼ ╪ú┘ê┘ä╪º┘ï)</option>
                <option>LIFO (┘à╪º ┘è╪»╪«┘ä ╪ó╪«╪▒╪º┘ï ┘è╪«╪▒╪¼ ╪ú┘ê┘ä╪º┘ï)</option>
                <option>╪º┘ä┘à╪¬┘ê╪│╪╖ ╪º┘ä┘à╪▒╪¼╪¡ (Weighted Average)</option>
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
      title="╪º┘ä╪│┘å┘ê╪º╪¬ ┘ê╪º┘ä╪¬┘é┘ê┘è┘à ╪º┘ä╪ú┘â╪º╪»┘è┘à┘è"
      description="╪¬╪╣┘è┘è┘å ╪º┘ä╪│┘å╪⌐ ╪º┘ä╪ú┘â╪º╪»┘è┘à┘è╪⌐ ╪º┘ä╪¡╪º┘ä┘è╪⌐╪î ┘à┘ê╪º╪╣┘è╪» ╪º┘ä╪»┘ê╪º┘à ╪º┘ä╪┤╪¬┘ê┘è ┘ê╪º┘ä╪╡┘è┘ü┘è╪î ┘ê┘é┘ê╪º╪╣╪» ╪º┘ä╪║┘è╪º╪¿"
    >
      <div className="space-y-6">
        <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-foreground block">╪º┘ä╪│┘å╪⌐ ╪º┘ä╪ú┘â╪º╪»┘è┘à┘è╪⌐ ╪º┘ä┘å╪┤╪╖╪⌐ ╪¡╪º┘ä┘è╪º┘ï ┘ä┘ä┘à┘å╪╡╪⌐</label>
            <div className="text-xs text-muted-foreground">╪¬╪╣╪¬┘à╪» ┘â╪º┘ü╪⌐ ╪º┘ä┘ü╪╡┘ê┘ä ┘ê╪º┘ä╪¼╪»╪º┘ê┘ä ┘ê╪º┘ä╪»╪▒╪¼╪º╪¬ ╪╣┘ä┘ë ┘ç╪░┘ç ╪º┘ä╪│┘å╪⌐ ╪º┘ä┘à╪¡╪»╪»╪⌐</div>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="h-10 rounded-xl border border-primary/30 bg-background px-3 text-xs font-black text-primary outline-none focus:ring-2 focus:ring-primary/20"
              value={allAcademicYears.find(y => y.isCurrent)?.id || allAcademicYears[0]?.id || ""}
              onChange={(e) => handleSelectAcademicYear(e.target.value)}
            >
              {allAcademicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.isCurrent ? "Γÿà (╪º┘ä╪│┘å╪⌐ ╪º┘ä┘å╪┤╪╖╪⌐)" : ""}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsAddYearOpen(true)}
              className="inline-flex h-10 items-center gap-1.5 px-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-xs"
            >
              <Plus className="h-4 w-4" /> ╪│┘å╪⌐ ╪¼╪»┘è╪»╪⌐
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="╪¿╪»╪º┘è╪⌐ ╪º┘ä╪»┘ê╪º┘à ╪º┘ä╪┤╪¬┘ê┘è (╪º╪╡╪╖┘ü╪º┘ü ╪º┘ä╪╖╪º╪¿┘ê╪▒)">
            <input
              type="time"
              value={systemSettings.winterTime}
              onChange={(e) => updateSettings({ winterTime: e.target.value })}
              className={inp}
            />
          </Field>
          <Field label="╪¿╪»╪º┘è╪⌐ ╪º┘ä╪»┘ê╪º┘à ╪º┘ä╪╡┘è┘ü┘è (╪º╪╡╪╖┘ü╪º┘ü ╪º┘ä╪╖╪º╪¿┘ê╪▒)">
            <input
              type="time"
              value={systemSettings.summerTime}
              onChange={(e) => updateSettings({ summerTime: e.target.value })}
              className={inp}
            />
          </Field>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <h3 className="font-black text-sm text-foreground">┘é┘ê╪º╪╣╪» ╪º┘ä╪║┘è╪º╪¿ ┘ê╪º┘ä╪º┘å╪╢╪¿╪º╪╖ ╪º┘ä┘à╪»╪▒╪│┘è</h3>
          <div className="space-y-3">
            <SwitchField
              title="╪º╪¡╪¬╪│╪º╪¿ ╪º┘ä╪¬╪ú╪«╪▒ ╪╣┘å ╪º┘ä╪º╪╡╪╖┘ü╪º┘ü ╪º┘ä╪╡╪¿╪º╪¡┘è ┘â╪║┘è╪º╪¿ ╪¼╪▓╪ª┘è"
              description="┘è╪¬┘à ╪¬╪│╪¼┘è┘ä ╪▒╪¿╪╣ ╪¡╪╡╪⌐ ╪║┘è╪º╪¿ ╪¬┘ä┘é╪º╪ª┘è╪º┘ï ╪╣┘å╪» ╪º┘ä╪¬╪ú╪«╪▒ ┘ä╪ú┘â╪½╪▒ ┘à┘å 15 ╪»┘é┘è┘é╪⌐ ╪¿╪╣╪» ╪º┘ä╪╖╪º╪¿┘ê╪▒"
              checked={systemSettings.lateAsPartialAbsence}
              onChange={(checked) => updateSettings({ lateAsPartialAbsence: checked })}
            />
            <SwitchField
              title="╪«╪╡┘à ╪»╪▒╪¼╪º╪¬ ╪º┘ä╪│┘ä┘ê┘â ┘ê╪º┘ä┘à┘ê╪º╪╕╪¿╪⌐ ╪ó┘ä┘è╪º┘ï"
              description="╪¬╪╖╪¿┘è┘é ╪º┘ä╪«╪╡┘à ╪º┘ä┘ä╪º╪ª╪¡┘è ╪º┘ä┘à╪╣╪¬┘à╪» ╪¬┘ä┘é╪º╪ª┘è╪º┘ï ╪╣┘å╪» ╪¬╪¼╪º┘ê╪▓ ╪║┘è╪º╪¿ ╪º┘ä╪╖╪º┘ä╪¿ 10 ╪ú┘è╪º┘à ╪¿╪»┘ê┘å ╪╣╪░╪▒ ╪▒╪│┘à┘è"
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
      title="╪│┘è╪º╪│╪º╪¬ ╪º┘ä┘é╪¿┘ê┘ä ┘ê╪º┘ä╪¬╪│╪¼┘è┘ä"
      description="╪¡╪º┘ä╪⌐ ╪º┘ä╪¬╪│╪¼┘è┘ä ┘ä┘ä╪╣╪º┘à ╪º┘ä┘é╪º╪»┘à╪î ╪º┘ä╪│╪╣╪⌐ ╪º┘ä╪º╪│╪¬┘è╪╣╪º╪¿┘è╪⌐ ┘ä┘ä┘ü╪╡┘ê┘ä╪î ┘ê╪º┘ä┘à╪│╪¬┘å╪»╪º╪¬ ╪º┘ä╪Ñ┘ä╪▓╪º┘à┘è╪⌐"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="╪¡╪º┘ä╪⌐ ╪º┘ä┘é╪¿┘ê┘ä ┘ê╪º┘ä╪¬╪│╪¼┘è┘ä ╪º┘ä╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è ╪º┘ä╪¡╪º┘ä┘è╪⌐">
            <select
              className={inp}
              value={systemSettings.admissionStatus}
              onChange={(e) => updateSettings({ admissionStatus: e.target.value })}
            >
              <option>┘à┘ü╪¬┘ê╪¡ ┘ä┘ä╪¬╪│╪¼┘è┘ä ╪º┘ä╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è ╪º┘ä┘à╪¿╪º╪┤╪▒</option>
              <option>┘à┘ü╪¬┘ê╪¡ ┘ä┘é╪º╪ª┘à╪⌐ ╪º┘ä╪º┘å╪¬╪╕╪º╪▒ ┘ê╪º┘ä┘à┘ü╪º╪╢┘ä╪⌐ ┘ü┘é╪╖</option>
              <option>┘à╪║┘ä┘é (╪¬┘à ╪º┘ä┘ê╪╡┘ê┘ä ┘ä┘ä╪│╪╣╪⌐ ╪º┘ä╪º╪│╪¬┘è╪╣╪º╪¿┘è╪⌐ ╪º┘ä┘é╪╡┘ê┘ë)</option>
            </select>
          </Field>
          <Field label="╪º┘ä╪¡╪» ╪º┘ä╪ú┘é╪╡┘ë ┘ä┘ä╪╖┘ä╪º╪¿ ┘ü┘è ┘â┘ä ┘ü╪╡┘ä ╪»╪▒╪º╪│┘è">
            <input
              type="number"
              value={systemSettings.maxClassSize}
              onChange={(e) => updateSettings({ maxClassSize: Math.max(1, parseInt(e.target.value) || 25) })}
              className={inp}
            />
          </Field>
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="font-black text-sm text-foreground mb-3">╪º┘ä┘à╪│╪¬┘å╪»╪º╪¬ ╪º┘ä╪Ñ┘ä╪▓╪º┘à┘è╪⌐ ╪º┘ä┘à╪╖┘ä┘ê╪¿╪⌐ ┘ä╪Ñ╪¬┘à╪º┘à ╪º┘ä┘é╪¿┘ê┘ä</h3>
          <div className="space-y-3">
            <SwitchField
              title="╪ú╪╡┘ä ╪┤┘ç╪º╪»╪⌐ ╪º┘ä┘à┘è┘ä╪º╪» ┘ä┘ä┘à╪╖╪º╪¿┘é╪⌐"
              checked={systemSettings.reqBirthCert}
              onChange={(checked) => updateSettings({ reqBirthCert: checked })}
            />
            <SwitchField
              title="╪│╪¼┘ä ╪º┘ä╪¬╪╖╪╣┘è┘à╪º╪¬ ┘ê╪º┘ä┘ü╪¡╪╡ ╪º┘ä╪╖╪¿┘è ╪º┘ä┘à╪╣╪¬┘à╪»"
              checked={systemSettings.reqVaccine}
              onChange={(checked) => updateSettings({ reqVaccine: checked })}
            />
            <SwitchField
              title="╪┤┘ç╪º╪»╪⌐ ╪º┘ä┘å╪¼╪º╪¡ ┘ê╪¬┘é╪▒┘è╪▒ ╪º┘ä╪»╪▒╪¼╪º╪¬ ┘à┘å ╪º┘ä┘à╪»╪▒╪│╪⌐ ╪º┘ä╪│╪º╪¿┘é╪⌐"
              checked={systemSettings.reqPrevCert}
              onChange={(checked) => updateSettings({ reqPrevCert: checked })}
            />
            <SwitchField
              title="╪╡┘ê╪▒╪⌐ ╪│╪¼┘ä ╪º┘ä╪ú╪│╪▒╪⌐ / ┘â╪▒╪¬ ╪º┘ä╪╣╪º╪ª┘ä╪⌐ ┘ä┘ä┘à╪╖╪º╪¿┘é╪⌐"
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
      title="╪│┘è╪º╪│╪º╪¬ ╪º┘ä┘â╪º╪»╪▒ ┘ê╪º┘ä┘à┘ê╪º╪▒╪» ╪º┘ä╪¿╪┤╪▒┘è╪⌐"
      description="╪╢┘ê╪º╪¿╪╖ ╪º┘ä╪Ñ╪¼╪º╪▓╪º╪¬ ╪º┘ä╪│┘å┘ê┘è╪⌐╪î ╪«╪╡┘ê┘à╪º╪¬ ╪º┘ä╪¬╪ú╪«┘è╪▒╪î ┘ê╪▒╪¿╪╖ ╪ú╪¼┘ç╪▓╪⌐ ╪º┘ä╪¿╪╡┘à╪⌐ ╪º┘ä╪░┘â┘è╪⌐"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="╪▒╪╡┘è╪» ╪º┘ä╪Ñ╪¼╪º╪▓╪⌐ ╪º┘ä╪│┘å┘ê┘è╪⌐ ╪º┘ä╪º┘ü╪¬╪▒╪º╪╢┘è (╪ú┘è╪º┘à)">
            <input
              type="number"
              value={systemSettings.annualLeaveDays}
              onChange={(e) => updateSettings({ annualLeaveDays: Math.max(0, parseInt(e.target.value) || 0) })}
              className={inp}
            />
          </Field>
          <Field label="┘å╪│╪¿╪⌐ ╪«╪╡┘à ╪º┘ä╪¬╪ú╪«┘è╪▒ ╪º┘ä┘è┘ê┘à┘è ╪╣┘å ╪º┘ä╪▒╪º╪¬╪¿ (%)">
            <input
              type="number"
              value={systemSettings.lateDeductionRate}
              onChange={(e) => updateSettings({ lateDeductionRate: Math.max(0, parseInt(e.target.value) || 0) })}
              className={inp}
            />
          </Field>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <h3 className="font-black text-sm text-foreground">┘é┘ê╪º╪╣╪» ╪º┘ä╪¡╪╢┘ê╪▒ ┘ê╪º┘ä╪º┘å╪╡╪▒╪º┘ü ╪º┘ä╪░┘â┘è</h3>
          <div className="space-y-3">
            <SwitchField
              title="╪º┘ä╪│┘à╪º╪¡ ╪¿┘ü╪¬╪▒╪⌐ ╪│┘à╪º╪¡ ╪╡╪¿╪º╪¡┘è╪⌐ 15 ╪»┘é┘è┘é╪⌐"
              description="╪╣╪»┘à ╪º╪¡╪¬╪│╪º╪¿ ╪¬╪ú╪«┘è╪▒ ╪╣┘ä┘ë ╪º┘ä┘à┘ê╪╕┘ü ┘ü┘è ╪¡╪º┘ä ╪º┘ä╪¡╪╢┘ê╪▒ ╪«┘ä╪º┘ä ╪ú┘ê┘ä 15 ╪»┘é┘è┘é╪⌐ ┘à┘å ╪¿╪»╪º┘è╪⌐ ╪º┘ä╪»┘ê╪º┘à"
              checked={systemSettings.gracePeriod}
              onChange={(checked) => updateSettings({ gracePeriod: checked })}
            />
            <SwitchField
              title="╪º┘ä┘à╪▓╪º┘à┘å╪⌐ ╪º┘ä╪¬┘ä┘é╪º╪ª┘è╪⌐ ┘à╪╣ ╪ú╪¼┘ç╪▓╪⌐ ╪º┘ä╪¿╪╡┘à╪⌐ ╪º┘ä╪¿┘è┘ê┘à╪¬╪▒┘è╪⌐"
              description="╪¬╪▒╪¡┘è┘ä ╪│╪¼┘ä╪º╪¬ ╪º┘ä╪¡╪╢┘ê╪▒ ┘ê╪º┘ä╪º┘å╪╡╪▒╪º┘ü ╪¬┘ä┘é╪º╪ª┘è╪º┘ï ┘ä┘à╪│┘è╪▒ ╪º┘ä╪▒┘ê╪º╪¬╪¿ ╪º┘ä╪┤┘ç╪▒┘è"
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
      title="╪º┘ä╪│┘è╪º╪│╪º╪¬ ┘ê╪º┘ä╪╣┘à┘ä┘è╪º╪¬ ╪º┘ä┘à╪º┘ä┘è╪⌐"
      description="╪º┘ä╪╣┘à┘ä╪⌐ ╪º┘ä╪▒╪│┘à┘è╪⌐╪î ┘å╪│╪¿╪⌐ ╪º┘ä╪╢╪▒┘è╪¿╪⌐ ╪º┘ä┘à╪╢╪º┘ü╪⌐╪î ╪│┘è╪º╪│╪⌐ ╪º┘ä╪º╪│╪¬╪▒╪»╪º╪»╪î ┘ê╪ú╪¬┘à╪¬╪⌐ ┘à╪│╪º╪▒╪º╪¬ ╪º┘ä┘à╪¡╪º╪│╪¿╪⌐"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="╪º┘ä╪╣┘à┘ä╪⌐ ╪º┘ä╪▒╪│┘à┘è╪⌐ ╪º┘ä┘à╪╣╪¬┘à╪»╪⌐ ┘ä┘ä┘à┘å╪╡╪⌐">
            <input
              value={currency}
              onChange={(e) => {
                const val = e.target.value;
                setCurrency(val);
              }}
              placeholder="┘à╪½╪º┘ä: ╪▒.╪│ ╪ú┘ê ╪¼.╪│ ╪ú┘ê $"
              className={inp}
            />
          </Field>
          <Field label="╪º┘ä╪▒┘é┘à ╪º┘ä╪╢╪▒┘è╪¿┘è ╪º┘ä┘à┘ê╪¡╪» ┘ä┘ä┘à┘å╪┤╪ú╪⌐ (VAT Number)">
            <input
              value={systemSettings.taxNumber}
              onChange={(e) => updateSettings({ taxNumber: e.target.value })}
              className={inp}
              placeholder="300012345600003"
            />
          </Field>
          <Field label="┘å╪│╪¿╪⌐ ╪╢╪▒┘è╪¿╪⌐ ╪º┘ä┘é┘è┘à╪⌐ ╪º┘ä┘à╪╢╪º┘ü╪⌐ (%)">
            <input
              type="number"
              value={systemSettings.vatRate}
              onChange={(e) => updateSettings({ vatRate: Math.max(0, parseInt(e.target.value) || 0) })}
              className={inp}
            />
          </Field>
          <Field label="╪│┘è╪º╪│╪⌐ ╪º┘ä╪º╪│╪¬╪▒╪»╪º╪» ┘ê╪º┘ä╪Ñ┘ä╪║╪º╪í ╪º┘ä┘à╪º┘ä┘è">
            <select
              className={inp}
              value={systemSettings.refundPolicy}
              onChange={(e) => updateSettings({ refundPolicy: e.target.value })}
            >
              <option>╪«┘ä╪º┘ä 14 ┘è┘ê┘à╪º┘ï ┘à┘å ╪¬╪º╪▒┘è╪« ╪│╪»╪º╪» ╪º┘ä┘é╪│╪╖</option>
              <option>┘é╪¿┘ä ╪¿╪»╪º┘è╪⌐ ╪º┘ä┘ü╪╡┘ä ╪º┘ä╪»╪▒╪º╪│┘è ┘ü┘é╪╖</option>
              <option>╪º╪│╪¬╪▒╪»╪º╪» ╪¼╪▓╪ª┘è (╪¡╪│┘à 20% ╪▒╪│┘ê┘à ╪Ñ╪»╪º╪▒┘è╪⌐)</option>
              <option>┘ä╪º ┘è┘ê╪¼╪» ╪º╪│╪¬╪▒╪»╪º╪» ┘å┘é╪»┘è ╪¿╪╣╪» ╪º┘ä╪¬╪│╪¼┘è┘ä</option>
            </select>
          </Field>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <h3 className="font-black text-sm text-foreground">╪ú╪¬┘à╪¬╪⌐ ╪º┘ä╪╣┘à┘ä┘è╪º╪¬ ┘ê╪º┘ä╪¬┘é╪º╪╖╪╣╪º╪¬ ╪º┘ä┘à╪º┘ä┘è╪⌐</h3>
          <div className="space-y-3">
            <SwitchField
              title="╪¬╪▒╪¡┘è┘ä ┘à╪│┘è╪▒ ╪º┘ä╪▒┘ê╪º╪¬╪¿ ╪ó┘ä┘è╪º┘ï ╪Ñ┘ä┘ë ┘é╪│┘à ╪º┘ä┘à╪╡╪▒┘ê┘ü╪º╪¬"
              description="╪╣┘å╪» ╪º╪╣╪¬┘à╪º╪» ┘à╪│┘è╪▒ ╪º┘ä╪▒┘ê╪º╪¬╪¿ ╪º┘ä╪┤┘ç╪▒┘è ┘è╪¬┘à ╪Ñ┘å╪┤╪º╪í ╪│┘å╪»╪º╪¬ ╪╡╪▒┘ü ┘à╪¡╪º╪│╪¿┘è╪⌐ ╪¿╪╡┘ê╪▒╪⌐ ╪¬┘ä┘é╪º╪ª┘è╪⌐"
              checked={systemSettings.autoTransferPayroll}
              onChange={(checked) => updateSettings({ autoTransferPayroll: checked })}
            />
            <SwitchField
              title="┘é┘è╪» ╪¬┘â╪º┘ä┘è┘ü ╪╡┘è╪º┘å╪⌐ ╪º┘ä┘à╪▒╪º┘ü┘é ╪¬┘ä┘é╪º╪ª┘è╪º┘ï ┘â┘à╪╡╪▒┘ê┘ü"
              description="┘à╪¬╪╡┘ä ┘à╪¿╪º╪┤╪▒╪⌐ ╪¿┘é╪│┘à ╪º┘ä┘à╪▒╪º┘ü┘é ╪╣┘å╪» ╪Ñ╪║┘ä╪º┘é ╪ú┘à╪▒ ╪╡┘è╪º┘å╪⌐ ┘à┘å╪¼╪▓"
              checked={systemSettings.autoMaintenanceExpense}
              onChange={(checked) => updateSettings({ autoMaintenanceExpense: checked })}
            />
            <SwitchField
              title="╪Ñ╪╢╪º┘ü╪⌐ ╪║╪▒╪º┘à╪º╪¬ ╪º┘ä╪¬╪ú╪«┘è╪▒ ┘ü┘è ╪Ñ╪╣╪º╪»╪⌐ ╪º┘ä┘â╪¬╪¿ ╪º┘ä╪»╪▒╪º╪│┘è╪⌐ ┘â╪▒╪│┘ê┘à"
              description="┘à╪¬╪╡┘ä ┘à╪¿╪º╪┤╪▒╪⌐ ╪¿┘å╪╕╪º┘à ╪º╪│╪¬╪╣╪º╪▒╪º╪¬ ╪º┘ä┘à┘â╪¬╪¿╪⌐ ╪╣┘å╪» ╪º┘ä╪¬╪ú╪«╪▒ ╪╣┘å ┘à┘ê╪╣╪» ╪º┘ä╪Ñ╪▒╪¼╪º╪╣"
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
      title="╪¬╪«╪╡┘è╪╡ ╪º┘ä╪½┘è┘à ┘ê╪º┘ä┘à╪╕┘ç╪▒ ╪º┘ä╪¿╪╡╪▒┘è"
      description="╪º╪«╪¬┘è╪º╪▒ ┘ê╪╢╪╣ ╪º┘ä╪ú┘ä┘ê╪º┘å ╪º┘ä┘à┘ü╪╢┘ä╪î ┘ä┘ê╪¡╪⌐ ╪º┘ä╪ú┘ä┘ê╪º┘å ╪º┘ä╪ú╪│╪º╪│┘è╪⌐ ┘ä┘ä┘å╪╕╪º┘à╪î ┘ê┘å┘à╪╖ ┘â╪½╪º┘ü╪⌐ ╪º┘ä╪¼╪»╪º┘ê┘ä"
    >
      <div className="space-y-6">
        <div>
          <h3 className="font-black text-xs text-muted-foreground mb-3">1. ┘ê╪╢╪╣ ╪º┘ä╪╣╪▒╪╢ ╪º┘ä╪▒╪ª┘è╪│┘è (Mode)</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { id: "light", label: "╪º┘ä┘ê╪╢╪╣ ╪º┘ä┘ü╪º╪¬╪¡ (Light)" },
              { id: "dark", label: "╪º┘ä┘ê╪╢╪╣ ╪º┘ä╪»╪º┘â┘å (Dark)" },
              { id: "system", label: "┘à╪¬╪▓╪º┘à┘å ┘à╪╣ ┘å╪╕╪º┘à ╪º┘ä╪¬╪┤╪║┘è┘ä" }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  updateSettings({ themeMode: m.id as any });
                  toast.success(`╪¬┘à ╪¬┘ü╪╣┘è┘ä: ${m.label}`);
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
          <h3 className="font-black text-xs text-muted-foreground mb-3">2. ┘ä┘ê╪¡╪⌐ ╪º┘ä╪ú┘ä┘ê╪º┘å ╪º┘ä╪ú╪│╪º╪│┘è╪⌐ ┘ä┘ä┘å╪╕╪º┘à (Primary Accent)</h3>
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
                    toast.success(`╪¬┘à ╪º╪«╪¬┘è╪º╪▒ ╪º┘ä┘ä┘ê┘å: ${color.name}`);
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
          <Field label="┘â╪½╪º┘ü╪⌐ ┘ê╪¡╪¼┘à ╪º┘ä╪¼╪»╪º┘ê┘ä ╪º┘ä╪¿┘è╪º┘å┘è╪⌐">
            <select
              className={inp}
              value={systemSettings.tableDensity || "comfortable"}
              onChange={(e) => updateSettings({ tableDensity: e.target.value as any })}
            >
              <option value="comfortable">┘â╪½╪º┘ü╪⌐ ┘à╪▒┘è╪¡╪⌐ (Comfortable - ┘à╪│╪º╪¡╪º╪¬ ╪ú┘ê╪│╪╣)</option>
              <option value="compact">┘â╪½╪º┘ü╪⌐ ╪╣╪º┘ä┘è╪⌐ (Compact - ╪╣╪▒╪╢ ╪¿┘è╪º┘å╪º╪¬ ╪ú┘â╪½╪▒)</option>
            </select>
          </Field>
          <Field label="╪º┘ä╪«╪╖ ╪º┘ä╪╣╪▒╪¿┘è ╪º┘ä╪▒╪ª┘è╪│┘è ┘ä┘ê╪º╪¼┘ç╪⌐ ╪º┘ä┘à┘å╪╡╪⌐">
            <select
              className={inp}
              value={systemSettings.fontFamily || "Cairo"}
              onChange={(e) => updateSettings({ fontFamily: e.target.value })}
            >
              <option value="Cairo">╪«╪╖ ╪º┘ä┘é╪º┘ç╪▒╪⌐ (Cairo) - ╪¡╪»┘è╪½ ┘ê╪▒╪│┘à┘è</option>
              <option value="Tajawal">╪«╪╖ ╪¬╪¼┘ê╪º┘ä (Tajawal) - ┘ç┘å╪»╪│┘è ┘à╪¬┘å╪º╪│┘é</option>
              <option value="IBM Plex Sans Arabic">IBM Plex Sans - ╪¬┘é┘å┘è ╪º╪¡╪¬╪▒╪º┘ü┘è</option>
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
      title="╪º┘ä┘ä╪║╪⌐ ┘ê╪º┘ä╪¬┘é┘ê┘è┘à ┘ê╪º┘ä╪º╪¬╪¼╪º┘ç"
      description="┘ä╪║╪⌐ ╪º┘ä┘å╪╕╪º┘à ╪º┘ä╪▒╪│┘à┘è╪⌐╪î ╪º┘ä╪¬┘å╪│┘è┘é ╪º┘ä╪▓┘à┘å┘è╪î ┘ê╪º┘ä╪¬┘é┘ê┘è┘à ╪º┘ä┘à╪╣╪¬┘à╪»"
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="┘ä╪║╪⌐ ┘ê╪º╪¼┘ç╪⌐ ╪º┘ä┘å╪╕╪º┘à ╪º┘ä╪▒╪ª┘è╪│┘è╪⌐">
            <select
              className={inp}
              value={systemSettings.language}
              onChange={(e) => updateSettings({ language: e.target.value as "ar" | "en" })}
            >
              <option value="ar">╪º┘ä╪╣╪▒╪¿┘è╪⌐ (RTL - ╪º┘ä┘è┘à┘è┘å ┘ä┘ä┘è╪│╪º╪▒)</option>
              <option value="en">English (LTR - Left to Right)</option>
            </select>
          </Field>
          <Field label="┘å╪╕╪º┘à ╪º┘ä╪¬┘é┘ê┘è┘à ╪º┘ä┘à╪╣╪¬┘à╪»">
            <select
              className={inp}
              value={systemSettings.calendarType || "dual"}
              onChange={(e) => updateSettings({ calendarType: e.target.value as any })}
            >
              <option value="dual">┘à╪▓╪»┘ê╪¼ (┘ç╪¼╪▒┘è ┘ê┘à┘è┘ä╪º╪»┘è ┘à╪╣╪º┘ï)</option>
              <option value="hijri">╪º┘ä╪¬┘é┘ê┘è┘à ╪º┘ä┘ç╪¼╪▒┘è (╪ú┘à ╪º┘ä┘é╪▒┘ë)</option>
              <option value="gregorian">╪º┘ä╪¬┘é┘ê┘è┘à ╪º┘ä┘à┘è┘ä╪º╪»┘è (Gregorian)</option>
            </select>
          </Field>
          <Field label="╪╡┘è╪║╪⌐ ╪╣╪▒╪╢ ╪º┘ä╪¬┘ê╪º╪▒┘è╪«">
            <select
              className={inp}
              value={systemSettings.dateFormat}
              onChange={(e) => updateSettings({ dateFormat: e.target.value })}
            >
              <option value="DD/MM/YYYY">┘è┘ê┘à / ╪┤┘ç╪▒ / ╪│┘å╪⌐ (DD/MM/YYYY)</option>
              <option value="YYYY-MM-DD">╪│┘å╪⌐ - ╪┤┘ç╪▒ - ┘è┘ê┘à (YYYY-MM-DD)</option>
            </select>
          </Field>
          <Field label="╪¿╪»╪º┘è╪⌐ ╪º┘ä╪ú╪│╪¿┘ê╪╣ ╪º┘ä╪»╪▒╪º╪│┘è">
            <select className={inp} defaultValue="╪º┘ä╪ú╪¡╪»">
              <option value="╪º┘ä╪ú╪¡╪»">┘è┘ê┘à ╪º┘ä╪ú╪¡╪» (╪º┘ä┘à╪╣╪¬┘à╪» ┘ü┘è ╪º┘ä╪«┘ä┘è╪¼ ┘ê╪º┘ä┘à┘à┘ä┘â╪⌐)</option>
              <option value="╪º┘ä╪│╪¿╪¬">┘è┘ê┘à ╪º┘ä╪│╪¿╪¬</option>
              <option value="╪º┘ä╪º╪½┘å┘è┘å">┘è┘ê┘à ╪º┘ä╪º╪½┘å┘è┘å (╪º┘ä┘å╪╕╪º┘à ╪º┘ä╪»┘ê┘ä┘è)</option>
            </select>
          </Field>
        </div>

        <div className="p-3.5 rounded-xl bg-muted/60 text-xs font-bold text-muted-foreground border border-border">
          ≡ƒÆí ┘è╪¬┘à ╪¬╪╖╪¿┘è┘é ╪º╪¬╪¼╪º┘ç ╪º┘ä┘ê╪º╪¼┘ç╪⌐ (RTL/LTR) ╪¬┘ä┘é╪º╪ª┘è╪º┘ï ╪╣┘å╪» ╪¬╪║┘è┘è╪▒ ╪º┘ä┘ä╪║╪⌐ ┘ä╪¬┘ê┘ü┘è╪▒ ╪¬╪¼╪▒╪¿╪⌐ ┘à╪│╪¬╪«╪»┘à ╪│┘ä╪│╪⌐ ┘ê┘à╪¬┘â╪º┘à┘ä╪⌐.
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
      title="┘é┘ê╪º┘ä╪¿ ╪º┘ä╪╖╪¿╪º╪╣╪⌐ ┘ê╪º┘ä╪¬╪¡┘é┘é ╪º┘ä╪▒┘é┘à┘è"
      description="╪Ñ╪╣╪»╪º╪»╪º╪¬ ┘â╪┤┘ê┘ü╪º╪¬ ╪º┘ä╪»╪▒╪¼╪º╪¬╪î ╪º┘ä┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä┘à╪╖╪¿┘ê╪╣╪⌐╪î ┘ê╪▒┘à┘ê╪▓ ╪º┘ä╪¬╪¡┘é┘é ╪º┘ä╪▒┘é┘à┘è QR"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="╪º┘ä┘é╪º┘ä╪¿ ╪º┘ä╪º┘ü╪¬╪▒╪º╪╢┘è ┘ä┘â╪┤┘ê┘ü╪º╪¬ ╪º┘ä╪¿┘è╪º┘å╪º╪¬">
            <select
              className={inp}
              value={systemSettings.defaultTemplate}
              onChange={(e) => updateSettings({ defaultTemplate: e.target.value })}
            >
              <option>╪¼╪»┘ê┘ä ┘à╪╢╪║┘ê╪╖ ┘à╪╣ ╪¬┘â╪▒╪º╪▒ ╪º┘ä╪¬╪▒┘ê┘è╪│╪⌐ ╪º┘ä╪▒╪│┘à┘è╪⌐</option>
              <option>╪¼╪»┘ê┘ä ╪▒╪│┘à┘è ┘à╪╣╪¬┘à╪» ┘à╪╣ ┘ü╪▒╪º╪║╪º╪¬ ╪º┘ä╪¬┘ê┘é┘è╪╣╪º╪¬</option>
              <option>╪¿╪╖╪º┘é╪º╪¬ ┘ü╪▒╪»┘è╪⌐ ┘ä┘â┘ä ╪╖╪º┘ä╪¿</option>
            </select>
          </Field>
          <Field label="╪╣╪»╪» ╪º┘ä╪╡┘ü┘ê┘ü ┘ä┘â┘ä ╪»┘ü╪╣╪⌐ ╪╖╪¿╪º╪╣╪⌐">
            <select
              className={inp}
              value={systemSettings.rowsPerBatch}
              onChange={(e) => updateSettings({ rowsPerBatch: e.target.value })}
            >
              <option>60 ╪╡┘ü ╪¿╪º┘ä╪╡┘ü╪¡╪⌐</option>
              <option>90 ╪╡┘ü ╪¿╪º┘ä╪╡┘ü╪¡╪⌐</option>
              <option>120 ╪╡┘ü ╪¿╪º┘ä╪╡┘ü╪¡╪⌐</option>
            </select>
          </Field>
          <Field label="╪º╪╣╪¬┘à╪º╪» ╪▒┘à╪▓ ╪º┘ä╪¬╪¡┘é┘é ╪º┘ä╪░┘â┘è QR">
            <select
              className={inp}
              value={systemSettings.qrCodeUsage}
              onChange={(e) => updateSettings({ qrCodeUsage: e.target.value })}
            >
              <option>┘à┘ü╪╣┘ä ┘ä┘â╪º┘ü╪⌐ ╪º┘ä╪┤┘ç╪º╪»╪º╪¬ ┘ê╪º┘ä┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä╪▒╪│┘à┘è╪⌐</option>
              <option>┘à┘ü╪╣┘ä ┘ä┘ä╪┤┘ç╪º╪»╪º╪¬ ╪º┘ä╪ú┘â╪º╪»┘è┘à┘è╪⌐ ┘ü┘é╪╖</option>
              <option>┘à╪╣╪╖┘ä</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border p-4 space-y-3 bg-card/60">
            <div className="flex items-center gap-2 font-black text-sm text-foreground">
              <FileText className="h-4 w-4 text-primary" />
              <span>╪¬╪▒┘ê┘è╪│╪⌐ ╪º┘ä┘à╪│╪¬┘å╪» ╪º┘ä╪▒╪│┘à┘è╪⌐</span>
            </div>
            <Field label="╪º╪│┘à ╪º┘ä╪¼┘ç╪⌐ ╪º┘ä┘ê╪▓╪º╪▒┘è╪⌐ ╪ú╪╣┘ä┘ë ╪º┘ä┘à╪│╪¬┘å╪»">
              <input
                className={inp}
                value={systemSettings.headerEntity}
                onChange={(e) => updateSettings({ headerEntity: e.target.value })}
              />
            </Field>
            <Field label="╪º╪│┘à ╪º┘ä╪Ñ╪»╪º╪▒╪⌐ ╪º┘ä╪¬╪╣┘ä┘è┘à┘è╪⌐ ╪º┘ä╪¬╪º╪¿╪╣ ┘ä┘ç╪º">
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
              <span>╪╢┘ê╪º╪¿╪╖ ╪º┘ä╪¬╪¡┘é┘é ╪º┘ä╪▒┘é┘à┘è</span>
            </div>
            <Field label="╪▒╪º╪¿╪╖ ╪¿┘ê╪º╪¿╪⌐ ╪º┘ä╪¬╪¡┘é┘é ╪º┘ä╪╣╪º┘à╪⌐">
              <input
                className={inp}
                dir="ltr"
                value={systemSettings.qrVerifyUrl}
                onChange={(e) => updateSettings({ qrVerifyUrl: e.target.value })}
              />
            </Field>
            <Field label="╪╡┘ä╪º╪¡┘è╪⌐ ╪▒╪º╪¿╪╖ ╪º┘ä╪¬╪¡┘é┘é">
              <select
                className={inp}
                value={systemSettings.qrExpiry}
                onChange={(e) => updateSettings({ qrExpiry: e.target.value })}
              >
                <option>╪│┘å╪⌐ ┘â╪º┘à┘ä╪⌐</option>
                <option>90 ┘è┘ê┘à╪º┘ï</option>
                <option>╪»╪º╪ª┘à (┘ä╪º ╪¬┘å╪¬┘ç┘è ╪º┘ä╪╡┘ä╪º╪¡┘è╪⌐)</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setIsPrintPreviewOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md shadow-primary/20"
          >
            <Eye className="h-4 w-4" /> ┘ü╪¬╪¡ ┘å╪º┘ü╪░╪⌐ ╪º┘ä┘à╪╣╪º┘è┘å╪⌐ ╪º┘ä╪¡┘è╪⌐ (A4)
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
      title="┘é┘ê╪º╪╣╪» ╪º┘ä╪Ñ╪┤╪╣╪º╪▒╪º╪¬ ┘ê╪º┘ä╪▒╪│╪º╪ª┘ä ╪º┘ä╪¬┘ä┘é╪º╪ª┘è╪⌐"
      description="╪¬╪«╪╡┘è╪╡ ┘é┘å┘ê╪º╪¬ ╪º┘ä╪¬┘å╪¿┘è┘ç ╪º┘ä┘ä╪¡╪╕┘è (SMS╪î WhatsApp╪î ┘ê╪º┘ä╪¿╪▒┘è╪») ┘ä╪¼┘à┘è╪╣ ╪ú╪¡╪»╪º╪½ ╪º┘ä┘à┘å╪╡╪⌐"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border">
          <div>
            <div className="font-black text-sm text-foreground">┘é┘å┘ê╪º╪¬ ╪º┘ä╪¬┘å╪¿┘è┘ç ╪º┘ä┘å╪┤╪╖╪⌐</div>
            <div className="text-xs text-muted-foreground mt-0.5">╪¡╪»╪» ╪º┘ä┘é┘å┘ê╪º╪¬ ╪º┘ä┘à╪│┘à┘ê╪¡ ┘ä┘ä┘à┘å╪╕┘ê┘à╪⌐ ╪º╪│╪¬╪«╪»╪º┘à┘ç╪º ┘ü┘è ╪º┘ä┘à╪▒╪º╪│┘ä╪º╪¬</div>
          </div>
          <button
            onClick={() => setIsNotifTesterOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-sm"
          >
            <Smartphone className="h-3.5 w-3.5" /> ┘ü╪¬╪¡ ┘à╪«╪¬╪¿╪▒ ╪º┘ä╪▒╪│╪º╪ª┘ä
          </button>
        </div>

        <div className="space-y-3">
          <SwitchField
            title="╪Ñ╪▒╪│╪º┘ä ╪▒╪│╪º┘ä╪⌐ SMS ┘ü┘ê╪▒┘è╪⌐ ┘ä┘ê┘ä┘è ╪º┘ä╪ú┘à╪▒ ╪╣┘å╪» ╪¬╪│╪¼┘è┘ä ╪║┘è╪º╪¿ ╪º┘ä╪╖╪º┘ä╪¿"
            description="┘è╪¬┘à ╪º┘ä╪Ñ╪▒╪│╪º┘ä ┘ü┘ê╪▒ ╪¬╪½╪¿┘è╪¬ ╪¼┘ä╪│╪⌐ ╪º┘ä╪¡╪╢┘ê╪▒ ╪º┘ä╪╡╪¿╪º╪¡┘è╪⌐ ┘ä┘ä╪╖╪º┘ä╪¿"
            checked={systemSettings.defaultChannels.sms}
            onChange={(checked) =>
              updateSettings({ defaultChannels: { ...systemSettings.defaultChannels, sms: checked } })
            }
          />
          <SwitchField
            title="╪Ñ╪┤╪╣╪º╪▒ ╪º┘ä┘à╪»┘è╪▒ ╪º┘ä╪╣╪º┘à ┘ê╪Ñ╪»╪º╪▒╪⌐ ╪º┘ä┘à╪▒╪º┘ü┘é ╪¿╪╖┘ä╪¿╪º╪¬ ╪º┘ä╪╡┘è╪º┘å╪⌐ ╪º┘ä╪╣╪º╪¼┘ä╪⌐"
            description="╪¬┘å╪¿┘è┘ç Push Notification ┘ä╪¡╪╕┘è ┘ü┘è ╪┤╪▒┘è╪╖ ╪Ñ╪┤╪╣╪º╪▒╪º╪¬ ╪º┘ä┘à┘å╪╡╪⌐ ┘ê╪¬╪╖╪¿┘è┘é ╪º┘ä╪Ñ╪»╪º╪▒╪⌐"
            checked={systemSettings.defaultChannels.push}
            onChange={(checked) =>
              updateSettings({ defaultChannels: { ...systemSettings.defaultChannels, push: checked } })
            }
          />
          <SwitchField
            title="╪Ñ╪▒╪│╪º┘ä ┘ü╪º╪¬┘ê╪▒╪⌐ ╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è╪⌐ ┘à╪╣╪¬┘à╪»╪⌐ ╪╣╪¿╪▒ ╪º┘ä╪¿╪▒┘è╪» ╪╣┘å╪» ╪Ñ╪╡╪»╪º╪▒ ┘à╪╖╪º┘ä╪¿╪⌐ ┘à╪º┘ä┘è╪⌐"
            description="╪¬╪¬╪╢┘à┘å ╪º┘ä┘ü╪º╪¬┘ê╪▒╪⌐ ╪¬┘ü╪º╪╡┘è┘ä ╪º┘ä┘é╪│╪╖ ┘ê╪▒╪º╪¿╪╖ ╪º┘ä╪│╪»╪º╪» ╪º┘ä╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è ╪º┘ä┘à╪¿╪º╪┤╪▒"
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
      title="╪Ñ╪╣╪»╪º╪»╪º╪¬ ╪º┘ä╪╡┘ä╪º╪¡┘è╪º╪¬ ╪º┘ä╪º┘ü╪¬╪▒╪º╪╢┘è╪⌐"
      description="╪¬╪╣┘è┘è┘å ╪º┘ä╪ú╪»┘ê╪º╪▒ ╪º┘ä╪º┘ü╪¬╪▒╪º╪╢┘è╪⌐ ┘ä┘ä┘à┘ê╪╕┘ü┘è┘å ╪º┘ä╪¼╪»╪» ┘ê╪╢┘ê╪º╪¿╪╖ ╪º┘ä┘ê╪╡┘ê┘ä ┘ä┘ä┘à┘å╪╡╪⌐"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="╪º┘ä╪╡┘ä╪º╪¡┘è╪⌐ ╪º┘ä╪º┘ü╪¬╪▒╪º╪╢┘è╪⌐ ┘ä┘ä┘à┘ê╪╕┘ü ╪º┘ä╪¼╪»┘è╪»">
            <select
              className={inp}
              value={systemSettings.defaultStaffRole || "┘à╪╣┘ä┘à (╪╡┘ä╪º╪¡┘è╪º╪¬ ╪¬╪»╪▒┘è╪│ ┘ü┘é╪╖)"}
              onChange={(e) => updateSettings({ defaultStaffRole: e.target.value })}
            >
              <option>┘à╪╣┘ä┘à (╪╡┘ä╪º╪¡┘è╪º╪¬ ╪¬╪»╪▒┘è╪│ ┘ü┘é╪╖)</option>
              <option>╪Ñ╪»╪º╪▒┘è (╪¿╪»┘ê┘å ┘à╪º┘ä┘è╪⌐)</option>
              <option>┘à┘ê╪╕┘ü ╪º╪│╪¬┘é╪¿╪º┘ä ┘ê╪º╪│╪¬╪╣┘ä╪º┘à╪º╪¬</option>
              <option>┘à╪┤╪▒┘ü ╪¬╪▒╪¿┘ê┘è</option>
            </select>
          </Field>
        </div>

        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
          <h4 className="font-black text-sm text-primary">╪Ñ╪»╪º╪▒╪⌐ ┘à╪╡┘ü┘ê┘ü╪⌐ ╪º┘ä╪╡┘ä╪º╪¡┘è╪º╪¬ ╪º┘ä┘à╪¬┘é╪»┘à╪⌐</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            ┘ä╪¬╪«╪╡┘è╪╡ ╪ú╪»┘é ╪º┘ä╪¬┘ü╪º╪╡┘è┘ä ┘ä┘â┘ä ╪»┘ê╪▒ ┘ê╪╡┘ä╪º╪¡┘è╪º╪¬ ╪º┘ä┘é╪▒╪º╪í╪⌐╪î ╪º┘ä╪¬╪╣╪»┘è┘ä╪î ╪º┘ä╪¡╪░┘ü╪î ┘ê╪º┘ä╪º╪╣╪¬┘à╪º╪» ╪º┘ä┘à╪º┘ä┘è ┘ä┘â┘ä ╪┤╪º╪┤╪⌐╪î ┘è╪▒╪¼┘ë ╪º┘ä╪º┘å╪¬┘é╪º┘ä ╪Ñ┘ä┘ë ╪Ñ╪»╪º╪▒╪⌐ ╪º┘ä╪ú╪»┘ê╪º╪▒ ┘ê╪º┘ä╪╡┘ä╪º╪¡┘è╪º╪¬.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <Link
              to="/admin/permissions"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-sm"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> ╪º┘ä╪º┘å╪¬┘é╪º┘ä ┘ä┘à╪»┘è╪▒ ╪º┘ä╪╡┘ä╪º╪¡┘è╪º╪¬
            </Link>
            <Link
              to="/admin/roles"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent"
            >
              ╪Ñ╪»╪º╪▒╪⌐ ╪º┘ä╪ú╪»┘ê╪º╪▒
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
      title="╪¼╪»┘ê┘ä╪⌐ ┘ê╪Ñ╪»╪º╪▒╪⌐ ╪º┘ä┘å╪│╪« ╪º┘ä╪º╪¡╪¬┘è╪º╪╖┘è"
      description="╪ú╪¬┘à╪¬╪⌐ ╪º┘ä┘å╪│╪« ╪º┘ä╪»┘ê╪▒┘è ┘ä┘é╪º╪╣╪»╪⌐ ╪º┘ä╪¿┘è╪º┘å╪º╪¬╪î ╪«┘è╪º╪▒╪º╪¬ ╪º┘ä╪¬╪«╪▓┘è┘å ╪º┘ä╪│╪¡╪º╪¿┘è╪î ┘ê╪º┘ä┘å╪│╪« ╪º┘ä┘ü┘ê╪▒┘è"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border">
          <div>
            <div className="font-black text-sm text-foreground">╪º┘ä┘å╪│╪« ╪º┘ä╪º╪¡╪¬┘è╪º╪╖┘è ╪º┘ä┘ü┘ê╪▒┘è</div>
            <div className="text-xs text-muted-foreground mt-0.5">╪¬┘ê┘ä┘è╪» ┘ä┘é╪╖╪⌐ ╪┤╪º┘à┘ä╪⌐ ┘ä┘é╪º╪╣╪»╪⌐ ╪º┘ä╪¿┘è╪º┘å╪º╪¬ ┘ê╪¡┘ü╪╕┘ç╪º ╪╣┘ä┘ë ╪¼┘ç╪º╪▓┘â ╪º┘ä╪ó┘å</div>
          </div>
          <button
            onClick={() => setIsBackupOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md shadow-primary/20"
          >
            <HardDrive className="h-4 w-4" /> ┘ü╪¬╪¡ ┘å╪º┘ü╪░╪⌐ ╪º┘ä┘å╪│╪« ┘ê╪º┘ä╪º╪│╪¬╪╣╪º╪»╪⌐
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="╪¬┘â╪▒╪º╪▒ ╪º┘ä┘å╪│╪« ╪º┘ä╪º╪¡╪¬┘è╪º╪╖┘è ╪º┘ä╪¬┘ä┘é╪º╪ª┘è">
            <select
              className={inp}
              value={systemSettings.backupFrequency || "┘è┘ê┘à┘è╪º┘ï (╪º┘ä╪│╪º╪╣╪⌐ 02:00 ╪╡╪¿╪º╪¡╪º┘ï)"}
              onChange={(e) => updateSettings({ backupFrequency: e.target.value })}
            >
              <option>┘è┘ê┘à┘è╪º┘ï (╪º┘ä╪│╪º╪╣╪⌐ 02:00 ╪╡╪¿╪º╪¡╪º┘ï)</option>
              <option>╪ú╪│╪¿┘ê╪╣┘è╪º┘ï (┘â┘ä ┘è┘ê┘à ╪¼┘à╪╣╪⌐)</option>
              <option>┘â┘ä 12 ╪│╪º╪╣╪⌐</option>
            </select>
          </Field>
          <Field label="┘à╪»╪⌐ ╪º┘ä╪º╪¡╪¬┘ü╪º╪╕ ╪¿╪º┘ä┘å╪│╪«">
            <select
              className={inp}
              value={systemSettings.backupRetention || "30 ┘è┘ê┘à╪º┘ï"}
              onChange={(e) => updateSettings({ backupRetention: e.target.value })}
            >
              <option>30 ┘è┘ê┘à╪º┘ï</option>
              <option>60 ┘è┘ê┘à╪º┘ï</option>
              <option>90 ┘è┘ê┘à╪º┘ï</option>
              <option>╪»╪º╪ª┘à╪º┘ï (╪╣╪»┘à ╪¡╪░┘ü ╪º┘ä┘å╪│╪«)</option>
            </select>
          </Field>
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="font-black text-sm text-foreground mb-3">┘ê╪¼┘ç╪º╪¬ ┘ê╪«┘è╪º╪▒╪º╪¬ ╪º┘ä╪¬╪«╪▓┘è┘å</h4>
          <div className="space-y-3">
            <SwitchField
              title="╪º┘ä╪¬╪«╪▓┘è┘å ╪º┘ä┘à╪¡┘ä┘è ╪╣┘ä┘ë ╪«╪º╪»┘à ╪º┘ä┘à╪»╪▒╪│╪⌐ ╪º┘ä╪»╪º╪«┘ä┘è"
              checked={systemSettings.backupStorage?.local ?? true}
              onChange={(checked) =>
                updateSettings({ backupStorage: { ...systemSettings.backupStorage, local: checked } as any })
              }
            />
            <SwitchField
              title="╪º┘ä┘à╪▓╪º┘à┘å╪⌐ ╪º┘ä╪│╪¡╪º╪¿┘è╪⌐ ┘à╪╣ Google Drive"
              checked={systemSettings.backupStorage?.cloud ?? true}
              onChange={(checked) =>
                updateSettings({ backupStorage: { ...systemSettings.backupStorage, cloud: checked } as any })
              }
            />
            <SwitchField
              title="╪º┘ä┘à╪▓╪º┘à┘å╪⌐ ╪º┘ä┘à╪┤┘ü╪▒╪⌐ ┘à╪╣ Amazon S3"
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
      title="╪¬╪╖╪¿┘è┘é╪º╪¬ ╪º┘ä╪▒╪¿╪╖ ┘ê╪º┘ä╪╖╪▒┘ü ╪º┘ä╪½╪º┘ä╪½ (Integrations)"
      description="╪º┘ä╪▒╪¿╪╖ ┘à╪╣ ┘à┘å╪╡╪⌐ ┘å┘ê╪▒╪î ╪¿┘ê╪º╪¿╪º╪¬ ╪º┘ä╪»┘ü╪╣ ╪º┘ä╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è╪î ┘ê┘à╪▓┘ê╪»┘è ╪▒╪│╪º╪ª┘ä SMS ┘ê WhatsApp"
    >
      <div className="space-y-6">
        {/* Noor System */}
        <div className="p-4 border border-border rounded-2xl bg-card space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-black text-sm text-foreground">┘à┘å╪╡╪⌐ ┘å┘ê╪▒ (┘ê╪▓╪º╪▒╪⌐ ╪º┘ä╪¬╪╣┘ä┘è┘à ╪º┘ä╪│╪╣┘ê╪»┘è╪⌐)</h4>
              <p className="text-xs text-muted-foreground mt-0.5">┘à╪▓╪º┘à┘å╪⌐ ╪º┘ä╪╖┘ä╪º╪¿╪î ╪º┘ä╪║┘è╪º╪¿ ╪º┘ä┘è┘ê┘à┘è╪î ┘ê┘å╪¬╪º╪ª╪¼ ╪º┘ä╪º╪«╪¬╪¿╪º╪▒╪º╪¬ ╪º┘ä╪▒╪│┘à┘è╪⌐</p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-xl border border-emerald-500/20">
              ┘à╪¬╪╡┘ä ┘ê┘å╪┤╪╖
            </span>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setIsImporterOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 shadow-xs"
            >
              <Database className="h-3.5 w-3.5" /> ┘à╪╖╪º╪¿┘é╪⌐ ╪¿┘è╪º┘å╪º╪¬ ┘å┘ê╪▒
            </button>
            <button
              onClick={() => setIsExporterOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-accent text-xs font-bold"
            >
              <Download className="h-3.5 w-3.5" /> ╪¬╪╡╪»┘è╪▒ ╪¿┘å╪│┘é ┘å┘ê╪▒
            </button>
          </div>
        </div>

        {/* Payment Gateway */}
        <div className="p-4 border border-border rounded-2xl bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-black text-sm text-foreground">╪¿┘ê╪º╪¿╪⌐ ╪º┘ä╪»┘ü╪╣ ╪º┘ä╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è (Online Payments)</h4>
              <p className="text-xs text-muted-foreground mt-0.5">╪¬╪¡╪╡┘è┘ä ╪º┘ä╪▒╪│┘ê┘à ╪º┘ä┘à╪»╪▒╪│┘è╪⌐ ╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è╪º┘ï ╪╣╪¿╪▒ ┘à╪»┘ë╪î ┘ü┘è╪▓╪º╪î ┘ê┘à╪º╪│╪¬╪▒┘â╪º╪▒╪»</p>
            </div>
            <select
              className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-bold outline-none"
              value={systemSettings.paymentGateway}
              onChange={(e) => updateSettings({ paymentGateway: e.target.value })}
            >
              <option value="none">╪║┘è╪▒ ┘à┘ü╪╣┘ä</option>
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
              <h4 className="font-black text-sm text-foreground">┘à╪▓┘ê╪» ╪▒╪│╪º╪ª┘ä SMS ╪º┘ä┘à╪╣╪¬┘à╪»</h4>
              <p className="text-xs text-muted-foreground mt-0.5">┘ä╪Ñ╪▒╪│╪º┘ä ╪Ñ╪┤╪╣╪º╪▒╪º╪¬ ╪º┘ä╪║┘è╪º╪¿ ┘ê╪º┘ä┘à╪╖╪º┘ä╪¿╪º╪¬ ╪º┘ä┘à╪º┘ä┘è╪⌐ ╪º┘ä┘ü┘ê╪▒┘è╪⌐</p>
            </div>
            <select
              className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-bold outline-none"
              value={systemSettings.smsProvider || "none"}
              onChange={(e) => updateSettings({ smsProvider: e.target.value })}
            >
              <option value="none">╪║┘è╪▒ ┘à┘ü╪╣┘ä</option>
              <option value="twilio">Twilio</option>
              <option value="unifonic">Unifonic (┘è┘ê┘å┘è┘ü┘ê┘å┘â)</option>
              <option value="4jawaly">4jawaly (┘ü┘ê╪▒ ╪¼┘ê╪º┘ä┘è)</option>
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
      title="╪¬╪╖╪¿┘è┘é ╪º┘ä┘ç╪º╪¬┘ü ┘ê╪¿┘ê╪º╪¿╪⌐ ┘ê┘ä┘è ╪º┘ä╪ú┘à╪▒"
      description="╪╢┘ê╪º╪¿╪╖ ╪¬╪╖╪¿┘è┘é ╪º┘ä┘ç┘ê╪º╪¬┘ü ╪º┘ä╪░┘â┘è╪⌐╪î ╪│┘è╪º╪│╪º╪¬ ╪º┘ä╪«╪╡┘ê╪╡┘è╪⌐╪î ┘ê╪¿╪╖╪º┘é╪º╪¬ ╪º┘ä╪»╪«┘ê┘ä"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "╪¿┘ê╪º╪¿╪⌐ ┘ê┘ä┘è ╪º┘ä╪ú┘à╪▒", desc: "┘ü┘ê╪º╪¬┘è╪▒╪î ┘å╪¬╪º╪ª╪¼╪î ┘ê┘å┘é┘ä ┘à╪»╪▒╪│┘è", status: "┘à┘ü╪╣┘ä" },
            { title: "╪¬╪╖╪¿┘è┘é ╪º┘ä┘à╪╣┘ä┘à", desc: "╪▒╪╡╪» ╪º┘ä╪¡╪╢┘ê╪▒ ┘ê╪º┘ä┘ê╪º╪¼╪¿╪º╪¬ ┘ê╪º┘ä╪»╪▒╪¼╪º╪¬", status: "┘à┘ü╪╣┘ä" },
            { title: "╪¬╪╖╪¿┘è┘é ╪º┘ä╪Ñ╪»╪º╪▒╪⌐", desc: "╪º╪╣╪¬┘à╪º╪»╪º╪¬ ┘ê╪¬┘å╪¿┘è┘ç╪º╪¬ ┘à╪º┘ä┘è╪⌐ ┘ê╪Ñ╪»╪º╪▒┘è╪⌐", status: "┘å╪┤╪╖" },
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
            <div className="font-black text-sm text-foreground">╪▒┘à╪▓ ╪º┘ä╪▒╪¿╪╖ ╪º┘ä╪│╪▒┘è╪╣ (QR Code)</div>
            <div className="text-xs text-muted-foreground">╪º┘à╪│╪¡ ╪º┘ä╪▒┘à╪▓ ┘ä╪▒╪¿╪╖ ╪¬╪╖╪¿┘è┘é ╪º┘ä┘ç╪º╪¬┘ü ╪¿╪º┘ä┘à╪»╪▒╪│╪⌐ ┘ü┘ê╪▒╪º┘ï</div>
          </div>
          <button
            onClick={() => setIsMobileConnectOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
          >
            <QrCode className="h-4 w-4" /> ╪º╪│╪¬╪«╪▒╪º╪¼ ╪▒┘à╪▓ ╪º┘ä╪▒╪¿╪╖ QR
          </button>
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="font-black text-sm text-foreground mb-3">┘é┘ê╪º╪╣╪» ╪º┘ä╪«╪╡┘ê╪╡┘è╪⌐ ┘ê╪¡┘à╪º┘è╪⌐ ╪¿┘è╪º┘å╪º╪¬ ╪º┘ä┘ç╪º╪¬┘ü</h4>
          <div className="space-y-3">
            <SwitchField
              title="┘ê┘ä┘è ╪º┘ä╪ú┘à╪▒ ┘è╪▒┘ë ╪ú╪¿┘å╪º╪í┘ç ┘ü┘é╪╖ ╪¡╪│╪¿ ╪▒┘é┘à ╪º┘ä┘ç┘ê┘è╪⌐ ┘ê╪º┘ä╪¼┘ê╪º┘ä ╪º┘ä┘à╪╣╪¬┘à╪»"
              checked={systemSettings.parentViewLimit}
              onChange={(checked) => updateSettings({ parentViewLimit: checked })}
            />
            <SwitchField
              title="╪º┘ä┘à╪╣┘ä┘à ┘è╪▒┘ë ╪º┘ä┘à┘ê╪º╪» ┘ê╪º┘ä╪┤╪╣╪¿ ╪º┘ä┘à╪│┘å╪»╪⌐ ╪Ñ┘ä┘è┘ç ┘ü┘é╪╖"
              checked={systemSettings.teacherViewLimit}
              onChange={(checked) => updateSettings({ teacherViewLimit: checked })}
            />
            <SwitchField
              title="╪¡╪¼╪¿ ╪º┘ä╪¿┘è╪º┘å╪º╪¬ ╪º┘ä┘à╪º┘ä┘è╪⌐ ╪╣┘å ╪º┘ä┘â╪º╪»╪▒ ╪║┘è╪▒ ╪º┘ä┘à╪«┘ê┘ä"
              checked={systemSettings.hideFinancial}
              onChange={(checked) => updateSettings({ hideFinancial: checked })}
            />
            <SwitchField
              title="╪¬╪│╪¼┘è┘ä ┘â┘ä ╪╣┘à┘ä┘è╪⌐ ╪»╪«┘ê┘ä ┘ê╪Ñ╪¼╪▒╪º╪í ┘à┘å ╪º┘ä┘ç╪º╪¬┘ü ┘ü┘è ╪│╪¼┘ä ╪º┘ä╪ú┘å╪┤╪╖╪⌐ ╪º┘ä┘à╪▒┘â╪▓┘è"
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
      title="╪º┘ä┘à┘ü╪º╪¬┘è╪¡ ╪º┘ä╪¿╪▒┘à╪¼┘è╪⌐ ┘ê╪º┘ä╪▒╪¿╪╖ ╪º┘ä┘à╪¬┘é╪»┘à (API & Webhooks)"
      description="╪Ñ╪»╪º╪▒╪⌐ ┘à┘ü╪º╪¬┘è╪¡ ╪º┘ä╪▒╪¿╪╖ ╪º┘ä╪¿╪▒┘à╪¼┘è╪î ╪╣┘å╪º┘ê┘è┘å Webhook╪î ┘ê┘à╪╣╪»┘ä ╪º╪│╪¬╪»╪╣╪º╪í ╪º┘ä╪╖┘ä╪¿╪º╪¬"
    >
      <div className="space-y-6">
        {/* API Key Box */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-black text-sm text-foreground">┘à┘ü╪¬╪º╪¡ API ╪º┘ä╪¡┘è ╪º┘ä╪▒╪ª┘è╪│┘è</div>
              <div className="text-xs text-muted-foreground">┘è╪│╪¬╪«╪»┘à ┘ä┘à╪▓╪º┘à┘å╪⌐ ╪º┘ä╪¬╪╖╪¿┘è┘é╪º╪¬ ┘ê╪º┘ä╪▒╪¿╪╖ ╪º┘ä╪¿╪▒┘à╪¼┘è ╪º┘ä╪ó┘à┘å</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(systemSettings.apiKey);
                  toast.success("╪¬┘à ┘å╪│╪« ┘à┘ü╪¬╪º╪¡ API ┘ä┘ä╪¡╪º┘ü╪╕╪⌐");
                }}
                className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border bg-background hover:bg-accent text-xs font-bold"
              >
                <Copy className="h-3.5 w-3.5" /> ┘å╪│╪«
              </button>
              <button
                onClick={() => {
                  const newKey = `sk_live_school_${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
                  updateSettings({ apiKey: newKey });
                  toast.success("╪¬┘à ╪¬╪»┘ê┘è╪▒ ┘ê╪¬┘ê┘ä┘è╪» ┘à┘ü╪¬╪º╪¡ API ╪¼╪»┘è╪» ╪¿┘å╪¼╪º╪¡");
                }}
                className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
              >
                <RefreshCcw className="h-3.5 w-3.5" /> ╪¬╪»┘ê┘è╪▒ ╪º┘ä┘à┘ü╪¬╪º╪¡
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
              <span>╪Ñ╪▒╪│╪º┘ä ╪º┘ä╪ú╪¡╪»╪º╪½ ╪º┘ä┘ä╪¡╪╕┘è╪⌐ (Webhooks)</span>
            </div>
            <button
              onClick={() => setIsWebhookTesterOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" /> ┘ü╪¬╪¡ ┘à╪«╪¬╪¿╪▒ ╪º┘ä╪ú╪¡╪»╪º╪½
            </button>
          </div>

          <Field label="╪▒╪º╪¿╪╖ ╪º╪│╪¬┘é╪¿╪º┘ä ╪º┘ä╪ú╪¡╪»╪º╪½ (Webhook Endpoint URL)">
            <input
              className={inp}
              dir="ltr"
              value={systemSettings.webhookUrl}
              onChange={(e) => updateSettings({ webhookUrl: e.target.value })}
              placeholder="https://myschool.com/webhooks/listener"
            />
          </Field>

          <div className="space-y-2 pt-1">
            <div className="text-xs font-black text-muted-foreground">╪º┘ä╪ú╪¡╪»╪º╪½ ╪º┘ä┘à╪┤╪¬╪▒┘â ╪¿┘ç╪º:</div>
            <div className="grid gap-2 sm:grid-cols-2 text-xs font-bold">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-background cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemSettings.whStudentCreated}
                  onChange={(e) => updateSettings({ whStudentCreated: e.target.checked })}
                  className="rounded text-primary h-4 w-4"
                />
                <span>student.created (╪¬╪│╪¼┘è┘ä ╪╖╪º┘ä╪¿)</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-background cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemSettings.whInvoicePaid}
                  onChange={(e) => updateSettings({ whInvoicePaid: e.target.checked })}
                  className="rounded text-primary h-4 w-4"
                />
                <span>invoice.paid (╪│╪»╪º╪» ┘ü╪º╪¬┘ê╪▒╪⌐)</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-background cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemSettings.whExamUpdated}
                  onChange={(e) => updateSettings({ whExamUpdated: e.target.checked })}
                  className="rounded text-primary h-4 w-4"
                />
                <span>exam.grade.updated (╪º╪╣╪¬┘à╪º╪» ┘å╪¬┘è╪¼╪⌐)</span>
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
      title="╪º┘ä╪ú┘à╪º┘å ┘ê╪│┘è╪º╪│╪º╪¬ ╪º┘ä╪¬╪¡┘â┘à ╪¿╪º┘ä╪»╪«┘ê┘ä"
      description="╪¬╪╣┘é┘è╪» ┘â┘ä┘à╪º╪¬ ╪º┘ä┘à╪▒┘ê╪▒╪î ┘à┘ç┘ä╪⌐ ╪¬╪│╪¼┘è┘ä ╪º┘ä╪«╪▒┘ê╪¼ ╪º┘ä╪¬┘ä┘é╪º╪ª┘è╪î ┘ê╪º┘ä╪¬╪¡┘é┘é ╪º┘ä╪½┘å╪º╪ª┘è 2FA"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="╪│┘è╪º╪│╪⌐ ╪¬╪╣┘é┘è╪» ┘â┘ä┘à╪⌐ ╪º┘ä┘à╪▒┘ê╪▒ ┘ä┘ä┘à╪│╪¬╪«╪»┘à┘è┘å">
            <select
              className={inp}
              value={systemSettings.passwordPolicy}
              onChange={(e) => updateSettings({ passwordPolicy: e.target.value })}
            >
              <option>┘à╪╣┘é╪»╪⌐ (╪ú╪¡╪▒┘ü ┘â╪¿┘è╪▒╪⌐ ┘ê╪╡╪║┘è╪▒╪⌐╪î ╪ú╪▒┘é╪º┘à╪î ╪▒┘à┘ê╪▓ ╪«╪º╪╡╪⌐)</option>
              <option>┘à╪¬┘ê╪│╪╖╪⌐ (╪ú╪¡╪▒┘ü ┘ê╪ú╪▒┘é╪º┘à ┘à╪╣╪º┘ï)</option>
              <option>╪¿╪│┘è╪╖╪⌐ (╪ú╪▒┘é╪º┘à ┘ü┘é╪╖ - ╪║┘è╪▒ ┘à╪│╪¬╪¡╪│┘å)</option>
            </select>
          </Field>
          <Field label="┘à┘ç┘ä╪⌐ ╪º┘å╪¬┘ç╪º╪í ╪º┘ä╪¼┘ä╪│╪⌐ ┘ê╪º┘ä╪«╪▒┘ê╪¼ ╪º┘ä╪¬┘ä┘é╪º╪ª┘è (Session Timeout)">
            <select
              className={inp}
              value={systemSettings.sessionTimeout}
              onChange={(e) => updateSettings({ sessionTimeout: e.target.value })}
            >
              <option>╪¿╪╣╪» 30 ╪»┘é┘è┘é╪⌐ ┘à┘å ╪º┘ä╪«┘à┘ê┘ä</option>
              <option>╪¿╪╣╪» ╪│╪º╪╣╪⌐ ┘ê╪º╪¡╪»╪⌐</option>
              <option>╪¿╪╣╪» 4 ╪│╪º╪╣╪º╪¬</option>
              <option>┘ä╪º ╪¬╪│╪¼┘ä ╪«╪▒┘ê╪¼ ╪¬┘ä┘é╪º╪ª┘è╪º┘ï</option>
            </select>
          </Field>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <h4 className="font-black text-sm text-foreground">╪º┘ä╪¡┘à╪º┘è╪⌐ ┘à╪¬╪╣╪»╪»╪⌐ ╪º┘ä╪╖╪¿┘é╪º╪¬</h4>
          <div className="space-y-3">
            <SwitchField
              title="┘ü╪▒╪╢ ╪º┘ä╪¬╪¡┘é┘é ╪¿╪«╪╖┘ê╪¬┘è┘å (2FA) ┘ä┘ä╪Ñ╪»╪º╪▒┘è┘è┘å ┘ê╪º┘ä┘à╪¡╪º╪│╪¿┘è┘å"
              description="╪╖┘ä╪¿ ╪▒┘à╪▓ OTP ╪¬╪ú┘â┘è╪»┘è ╪Ñ╪╢╪º┘ü┘è ╪╣┘å╪» ╪¬╪│╪¼┘è┘ä ╪º┘ä╪»╪«┘ê┘ä ┘à┘å ╪ú╪¼┘ç╪▓╪⌐ ╪¼╪»┘è╪»╪⌐"
              checked={systemSettings.force2FA}
              onChange={(checked) => updateSettings({ force2FA: checked })}
            />
            <SwitchField
              title="╪¡╪╕╪▒ ╪º┘ä╪¡╪│╪º╪¿ ┘à╪ñ┘é╪¬╪º┘ï ╪¿╪╣╪» 5 ┘à╪¡╪º┘ê┘ä╪º╪¬ ╪»╪«┘ê┘ä ┘ü╪º╪┤┘ä╪⌐ ┘à╪¬╪¬╪º┘ä┘è╪⌐"
              description="╪¡┘à╪º┘è╪⌐ ╪º┘ä┘å╪╕╪º┘à ╪╢╪» ┘ç╪¼┘à╪º╪¬ ╪º┘ä╪¬╪«┘à┘è┘å ┘ê╪º┘ä╪º╪«╪¬╪▒╪º┘é ╪º┘ä╪╣╪┤┘ê╪º╪ª┘è"
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
      title="╪º┘ä┘à╪│╪¬┘ê╪▒╪» ┘ê╪º┘ä┘à┘Å╪╡╪»┘æ╪▒ ╪º┘ä╪░┘â┘è (Smart Engine)"
      description="╪º╪│╪¬┘è╪▒╪º╪» ┘ê╪¬╪╡╪»┘è╪▒ ┘à╪¼┘à┘ê╪╣╪º╪¬ ╪º┘ä╪¿┘è╪º┘å╪º╪¬ ╪º┘ä┘â╪¿┘è╪▒╪⌐ ┘ä┘å╪╕╪º┘à ┘å┘ê╪▒╪î ╪Ñ┘â╪│┘ä╪î ┘ê┘à┘ä┘ü╪º╪¬ CSV ╪º┘ä┘à╪╣╪¬┘à╪»╪⌐"
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
              <h4 className="font-black text-base text-foreground">╪º┘ä┘à╪│╪¬┘ê╪▒╪» ╪º┘ä╪░┘â┘è ┘ê┘à╪╖╪º╪¿┘é╪⌐ ╪¿┘è╪º┘å╪º╪¬ "┘å┘ê╪▒"</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                ╪▒┘ü╪╣ ┘à┘ä┘ü╪º╪¬ Excel ╪ú┘ê CSV ┘ä┘à╪╖╪º╪¿┘é╪⌐ ╪º┘ä╪╖┘ä╪º╪¿ ┘ê╪º┘ä┘à╪╣┘ä┘à┘è┘å ╪ó┘ä┘è╪º┘ï╪î ┘ê╪º┘ä╪¬╪¡┘é┘é ┘à┘å ╪╡╪¡╪⌐ ╪º┘ä┘ç┘ê┘è╪º╪¬ ┘é╪¿┘ä ╪º┘ä╪º╪╣╪¬┘à╪º╪».
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1.5 text-xs font-black text-primary">
              <span>┘ü╪¬╪¡ ┘å╪º┘ü╪░╪⌐ ╪º┘ä╪º╪│╪¬┘è╪▒╪º╪» ┘ê╪º┘ä┘à╪╖╪º╪¿┘é╪⌐</span>
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
              <h4 className="font-black text-base text-foreground">╪¬╪╡╪»┘è╪▒ ╪¿┘è╪º┘å╪º╪¬ ╪º┘ä┘å╪╕╪º┘à ╪º┘ä┘à╪¼┘à╪╣╪⌐</h4>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                ╪¬╪╡╪»┘è╪▒ ╪│╪¼┘ä╪º╪¬ ╪º┘ä╪╖┘ä╪º╪¿╪î ╪º┘ä┘à╪º┘ä┘è╪⌐╪î ┘ê╪º┘ä┘â╪º╪»╪▒ ╪¿╪╡┘è╪║ Excel╪î JSON╪î ╪ú┘ê ┘å╪│┘é ┘à┘å╪╡╪⌐ ┘å┘ê╪▒ ╪º┘ä┘à╪╣╪¬┘à╪».
              </p>
            </div>
            <div className="pt-4 flex items-center gap-1.5 text-xs font-black text-primary">
              <span>┘ü╪¬╪¡ ┘å╪º┘ü╪░╪⌐ ╪º┘ä╪¬╪╡╪»┘è╪▒ ╪º┘ä╪┤╪º┘à┘ä</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        {/* Operations History Log */}
        <div className="border-t border-border pt-4">
          <h4 className="font-black text-sm text-foreground mb-3">╪│╪¼┘ä ╪ú╪¡╪»╪½ ╪╣┘à┘ä┘è╪º╪¬ ╪º┘ä┘à╪▓╪º┘à┘å╪⌐ ╪º┘ä┘à╪▒┘â╪▓┘è╪⌐</h4>
          <div className="border border-border rounded-xl divide-y divide-border overflow-hidden text-xs">
            <div className="p-3 flex justify-between items-center bg-card">
              <div className="font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>╪º╪│╪¬┘è╪▒╪º╪» ╪»┘ü╪╣╪⌐ ╪╖┘ä╪º╪¿ ┘à┘å ┘à┘å╪╡╪⌐ ┘å┘ê╪▒</span>
              </div>
              <span className="text-muted-foreground font-mono text-[11px]">┘à┘â╪¬┘à┘ä ╪¿┘å╪¼╪º╪¡ (450 ╪│╪¼┘ä)</span>
            </div>
            <div className="p-3 flex justify-between items-center bg-card">
              <div className="font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>╪¬╪╡╪»┘è╪▒ ┘â╪┤┘ü ┘à╪│┘è╪▒ ╪º┘ä╪▒┘ê╪º╪¬╪¿ ╪º┘ä┘à╪╣╪¬┘à╪»</span>
              </div>
              <span className="text-muted-foreground font-mono text-[11px]">┘à┘å╪░ ┘è┘ê┘à┘è┘å</span>
            </div>
          </div>
        </div>
      </div>
    </PageCard>
  );
}
