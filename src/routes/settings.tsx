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

import {
  FeaturesTab, SchoolTab, BrandTab, FacilitiesTab, AcademicTab, AdmissionTab, HRTab, FinanceTab, ThemeTab, LangTab, PrintTab, NotifTab, RolesTab, BackupTab, IntegrationsTab, MobileTab, APITab, SecurityTab, DataIOTab,
} from "@/components/settings/settings-tabs";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "╪º┘ä╪Ñ╪╣╪»╪º╪»╪º╪¬ ╪º┘ä┘à╪▒┘â╪▓┘è╪⌐ ╪º┘ä╪┤╪º┘à┘ä╪⌐ | ┘à┘å╪╡╪⌐ ┘à╪»╪º╪▒╪│" }] }),
  component: SettingsPage,
});

// Grouped Tabs Hierarchy for superior UX & clarity
const TAB_GROUPS = [
  {
    category: "╪º┘ä╪¬╪¡┘â┘à ╪¿╪º┘ä┘à┘è╪▓╪º╪¬ ┘ê╪º┘ä┘ê╪¡╪»╪º╪¬",
    tabs: [
      { id: "features", label: "╪º┘ä╪¬╪¡┘â┘à ╪¿┘à┘è╪▓╪º╪¬ ╪º┘ä┘å╪╕╪º┘à ┘ê╪º┘ä┘ê╪¡╪»╪º╪¬", icon: SlidersHorizontal, badge: "┘à╪▒┘â╪▓ ╪º┘ä┘à┘è╪▓╪º╪¬" },
    ]
  },
  {
    category: "╪º┘ä┘à╪ñ╪│╪│╪⌐ ┘ê╪º┘ä╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪ú╪│╪º╪│┘è╪⌐",
    tabs: [
      { id: "school", label: "╪¿┘è╪º┘å╪º╪¬ ┘ê┘ç┘ê┘è╪⌐ ╪º┘ä┘à╪»╪▒╪│╪⌐", icon: SchoolIcon, badge: "╪ú╪│╪º╪│┘è" },
      { id: "brand", label: "╪º┘ä┘ç┘ê┘è╪⌐ ╪º┘ä╪¿╪╡╪▒┘è╪⌐ ┘ê╪º┘ä┘à╪╖╪¿┘ê╪╣╪º╪¬", icon: Palette, badge: "╪┤╪╣╪º╪▒ ┘ê╪«╪¬┘à" },
      { id: "facilities", label: "╪Ñ╪»╪º╪▒╪⌐ ╪º┘ä┘à╪▒╪º┘ü┘é ┘ê╪º┘ä╪ú╪╡┘ê┘ä", icon: Building },
    ]
  },
  {
    category: "╪º┘ä╪│┘è╪º╪│╪º╪¬ ┘ê╪º┘ä╪¬╪┤╪║┘è┘ä ╪º┘ä╪ú┘â╪º╪»┘è┘à┘è",
    tabs: [
      { id: "academic", label: "╪º┘ä╪│┘å┘ê╪º╪¬ ┘ê╪º┘ä╪¬┘é┘ê┘è┘à ╪º┘ä╪»╪▒╪º╪│┘è", icon: Calendar, badge: "╪º┘ä╪¬┘é┘ê┘è┘à" },
      { id: "admission", label: "╪│┘è╪º╪│╪º╪¬ ╪º┘ä┘é╪¿┘ê┘ä ┘ê╪º┘ä╪¬╪│╪¼┘è┘ä", icon: UserPlus },
      { id: "hr", label: "╪│┘è╪º╪│╪º╪¬ ╪º┘ä┘à┘ê╪º╪▒╪» ╪º┘ä╪¿╪┤╪▒┘è╪⌐", icon: Users },
      { id: "finance", label: "╪º┘ä╪│┘è╪º╪│╪º╪¬ ┘ê╪º┘ä╪╣┘à┘ä┘è╪º╪¬ ╪º┘ä┘à╪º┘ä┘è╪⌐", icon: DollarSign, badge: "╪º┘ä╪╣┘à┘ä╪⌐" },
    ]
  },
  {
    category: "╪º┘ä┘à╪╕┘ç╪▒ ┘ê╪º┘ä╪¬╪«╪╡┘è╪╡",
    tabs: [
      { id: "theme", label: "╪º┘ä╪½┘è┘à ┘ê╪º┘ä╪ú┘ä┘ê╪º┘å ┘ê╪º┘ä┘ê╪º╪¼┘ç╪⌐", icon: Palette, badge: "╪ú┘ä┘ê╪º┘å" },
      { id: "lang", label: "╪º┘ä┘ä╪║╪⌐ ┘ê╪º┘ä╪¬┘é┘ê┘è┘à ┘ê╪º┘ä╪º╪¬╪¼╪º┘ç", icon: Languages },
      { id: "print", label: "┘é┘ê╪º┘ä╪¿ ┘ê┘à╪¡╪»╪»╪º╪¬ ╪º┘ä╪╖╪¿╪º╪╣╪⌐", icon: FileText },
    ]
  },
  {
    category: "╪º┘ä╪▒╪¿╪╖ ┘ê╪º┘ä╪º╪¬╪╡╪º┘ä╪º╪¬ ╪º┘ä╪░┘â┘è╪⌐",
    tabs: [
      { id: "notif", label: "┘é┘ê╪º╪╣╪» ╪º┘ä╪Ñ╪┤╪╣╪º╪▒╪º╪¬ ┘ê╪º┘ä╪▒╪│╪º╪ª┘ä", icon: BellRing, badge: "SMS/┘ê╪º╪¬╪│╪º╪¿" },
      { id: "mobile", label: "╪¬╪╖╪¿┘è┘é ╪º┘ä┘ç╪º╪¬┘ü ┘ê╪¿┘ê╪º╪¿╪⌐ ┘ê┘ä┘è ╪º┘ä╪ú┘à╪▒", icon: Smartphone },
      { id: "integrations", label: "╪¬╪╖╪¿┘è┘é╪º╪¬ ╪º┘ä╪▒╪¿╪╖ ┘ê╪º┘ä╪╖╪▒┘ü ╪º┘ä╪½╪º┘ä╪½", icon: LinkIcon, badge: "┘å┘ê╪▒/╪¿┘ê╪º╪¿╪º╪¬" },
      { id: "api", label: "API ┘ê╪º┘ä╪▒╪¿╪╖ ╪º┘ä┘à╪¬┘é╪»┘à (Webhooks)", icon: KeyRound },
    ]
  },
  {
    category: "╪º┘ä╪ú┘à╪º┘å ┘ê╪Ñ╪»╪º╪▒╪⌐ ╪º┘ä╪¿┘è╪º┘å╪º╪¬",
    tabs: [
      { id: "security", label: "╪º┘ä╪ú┘à╪º┘å ┘ê╪│┘è╪º╪│╪º╪¬ ╪º┘ä╪»╪«┘ê┘ä", icon: Lock },
      { id: "roles", label: "╪º┘ä╪╡┘ä╪º╪¡┘è╪º╪¬ ╪º┘ä╪º┘ü╪¬╪▒╪º╪╢┘è╪⌐", icon: ShieldCheck },
      { id: "backup", label: "╪º┘ä┘å╪│╪« ╪º┘ä╪º╪¡╪¬┘è╪º╪╖┘è ┘ê╪º┘ä╪¡┘ü╪╕", icon: HardDrive },
      { id: "data_io", label: "╪º┘ä┘à╪│╪¬┘ê╪▒╪» ┘ê╪º┘ä┘à╪╡╪»╪▒ ╪º┘ä╪░┘â┘è", icon: Database, badge: "┘å╪╕╪º┘à ┘å┘ê╪▒" },
    ]
  }
] as const;

type TabId = typeof TAB_GROUPS[number]["tabs"][number]["id"];

const THEME_PALETTES = [
  { id: "blue", name: "╪ú╪▓╪▒┘é ┘à┘ä┘â┘è", hex: "#2563eb", border: "border-blue-600" },
  { id: "sky", name: "╪│┘à╪º┘ê┘è ╪╣╪╡╪▒┘è", hex: "#0ea5e9", border: "border-sky-500" },
  { id: "emerald", name: "╪▓┘à╪▒╪»┘è ╪¬╪╣┘ä┘è┘à┘è", hex: "#10b981", border: "border-emerald-500" },
  { id: "indigo", name: "┘å┘è┘ä┘è ┘ê┘é┘ê╪▒", hex: "#4f46e5", border: "border-indigo-600" },
  { id: "violet", name: "╪¿┘å┘ü╪│╪¼┘è ╪º╪¿╪¬┘â╪º╪▒┘è", hex: "#8b5cf6", border: "border-violet-500" },
  { id: "rose", name: "┘è╪º┘é┘ê╪¬┘è ╪▒╪º┘é┘ì", hex: "#e11d48", border: "border-rose-600" },
  { id: "amber", name: "╪╣┘å╪¿╪▒┘è ╪»╪º┘ü╪ª", hex: "#d97706", border: "border-amber-600" },
  { id: "teal", name: "┘â╪¡┘ä┘è ╪¿╪¡╪▒┘è", hex: "#0f766e", border: "border-teal-700" },
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
    name: "┘ê╪¡╪»╪⌐ ╪º┘ä┘å┘é┘ä ╪º┘ä┘à╪»╪▒╪│┘è ┘ê╪º┘ä╪¡╪º┘ü┘ä╪º╪¬",
    desc: "╪Ñ╪»╪º╪▒╪⌐ ╪«╪╖┘ê╪╖ ╪º┘ä╪│┘è╪▒╪î ╪º┘ä┘à╪┤╪▒┘ü┘è┘å╪î ╪º┘ä╪¡╪º┘ü┘ä╪º╪¬╪î ┘ê╪º╪┤╪¬╪▒╪º┘â╪º╪¬ ╪º┘ä╪╖┘ä╪º╪¿ ┘à╪╣ ┘ü┘ê╪¬╪▒╪⌐ ╪º┘ä┘å┘é┘ä ╪ó┘ä┘è╪º┘ï",
    category: "core",
    categoryLabel: "┘ê╪¡╪»╪º╪¬ ╪¬╪┤╪║┘è┘ä┘è╪⌐",
    icon: Compass,
    route: "/transport/routes",
    routeLabel: "┘ü╪¬╪¡ ╪┤╪º╪┤╪⌐ ╪º┘ä┘å┘é┘ä",
    dependency: "┘à╪▒╪¬╪¿╪╖ ╪¿╪º┘ä┘à╪▒┘â╪▓ ╪º┘ä┘à╪º┘ä┘è ┘ê┘à┘ä┘ü╪º╪¬ ╪º┘ä╪╖┘ä╪º╪¿",
    badge: "╪¡╪º┘ü┘ä╪º╪¬",
  },
  {
    key: "library",
    name: "┘ê╪¡╪»╪⌐ ╪º┘ä┘à┘â╪¬╪¿╪⌐ ┘ê╪¬┘ê╪▓┘è╪╣ ╪º┘ä┘à┘é╪▒╪▒╪º╪¬",
    desc: "╪Ñ╪»╪º╪▒╪⌐ ┘ü┘ç╪º╪▒╪│ ╪º┘ä┘â╪¬╪¿ ┘ê╪º┘ä┘à┘é╪▒╪▒╪º╪¬╪î ╪«╪╖╪╖ ╪¬╪│┘ä┘è┘à ╪º┘ä┘â╪¬╪¿ ╪º┘ä┘à╪»╪▒╪│┘è╪⌐╪î ┘ê╪▒╪╡╪» ╪º┘ä╪Ñ╪▒╪¼╪º╪╣",
    category: "core",
    categoryLabel: "┘ê╪¡╪»╪º╪¬ ╪¬╪┤╪║┘è┘ä┘è╪⌐",
    icon: BookOpen,
    route: "/library/textbooks",
    routeLabel: "┘ü╪¬╪¡ ╪º┘ä┘à┘â╪¬╪¿╪⌐",
    dependency: "┘à╪▒╪¬╪¿╪╖ ╪¿╪º┘ä╪╡┘ü┘ê┘ü ┘ê╪º┘ä╪┤╪╣╪¿",
    badge: "┘à┘é╪▒╪▒╪º╪¬",
  },
  {
    key: "clinic",
    name: "┘ê╪¡╪»╪⌐ ╪º┘ä╪╣┘è╪º╪»╪⌐ ╪º┘ä╪╖╪¿┘è╪⌐ ┘ê╪º┘ä╪▒╪╣╪º┘è╪⌐ ╪º┘ä╪╡╪¡┘è╪⌐",
    desc: "╪º┘ä╪│╪¼┘ä╪º╪¬ ╪º┘ä╪╡╪¡┘è╪⌐╪î ┘à┘ä┘ü╪º╪¬ ╪º┘ä╪¡╪│╪º╪│┘è╪⌐ ┘ê╪º┘ä╪ú┘à╪▒╪º╪╢ ╪º┘ä┘à╪▓┘à┘å╪⌐╪î ┘ê╪¬┘ê╪½┘è┘é ╪▓┘è╪º╪▒╪º╪¬ ╪º┘ä╪╣┘è╪º╪»╪⌐",
    category: "core",
    categoryLabel: "┘ê╪¡╪»╪º╪¬ ╪¬╪┤╪║┘è┘ä┘è╪⌐",
    icon: ShieldCheck,
    route: "/clinic/visits",
    routeLabel: "┘ü╪¬╪¡ ╪º┘ä╪╣┘è╪º╪»╪⌐",
    dependency: "┘à╪▒╪¬╪¿╪╖ ╪¿┘à┘ä┘ü╪º╪¬ ╪º┘ä╪╖┘ä╪º╪¿ ┘ê╪º┘ä╪║┘è╪º╪¿",
    badge: "╪╡╪¡╪⌐",
  },
  {
    key: "facilities",
    name: "┘ê╪¡╪»╪⌐ ╪Ñ╪»╪º╪▒╪⌐ ╪º┘ä┘à╪▒╪º┘ü┘é ┘ê╪º┘ä┘à╪¿╪º┘å┘è ┘ê╪º┘ä╪╡┘è╪º┘å╪⌐",
    desc: "╪Ñ╪»╪º╪▒╪⌐ ╪º┘ä┘à╪¿╪º┘å┘è╪î ╪º┘ä┘é╪º╪╣╪º╪¬╪î ╪º┘ä┘à╪╣╪º┘à┘ä╪î ╪╖┘ä╪¿╪º╪¬ ╪º┘ä╪╡┘è╪º┘å╪⌐ ╪º┘ä╪»┘ê╪▒┘è╪⌐╪î ┘ê┘é┘è╪» ╪¬┘â╪º┘ä┘è┘ü ╪º┘ä╪╡┘è╪º┘å╪⌐",
    category: "core",
    categoryLabel: "┘ê╪¡╪»╪º╪¬ ╪¬╪┤╪║┘è┘ä┘è╪⌐",
    icon: Building,
    route: "/facilities/rooms",
    routeLabel: "┘ü╪¬╪¡ ╪º┘ä┘à╪▒╪º┘ü┘é",
    dependency: "┘à╪▒╪¬╪¿╪╖ ╪¿┘à╪▒╪º┘â╪▓ ╪º┘ä╪¬┘â┘ä┘ü╪⌐ ┘ê╪º┘ä┘à╪╡╪▒┘ê┘ü╪º╪¬",
    badge: "┘à╪¿╪º┘å┘è",
    tabShortcut: "facilities",
    tabLabel: "╪Ñ╪╣╪»╪º╪»╪º╪¬ ╪º┘ä╪ú╪╡┘ê┘ä",
  },
  {
    key: "inventory",
    name: "┘ê╪¡╪»╪⌐ ╪Ñ╪»╪º╪▒╪⌐ ╪º┘ä┘à╪│╪¬┘ê╪»╪╣╪º╪¬ ┘ê╪º┘ä╪╣┘ç╪» ╪º┘ä┘à╪»╪▒╪│┘è╪⌐",
    desc: "╪¼╪▒╪» ╪º┘ä╪ú╪╡┘ê┘ä╪î ╪º┘ä╪ú╪╡┘å╪º┘ü ╪º┘ä┘à╪«╪▓┘å┘è╪⌐╪î ╪ú╪░┘ê┘å╪º╪¬ ╪º┘ä╪╡╪▒┘ü ┘ê╪º┘ä╪Ñ╪╢╪º┘ü╪⌐╪î ┘ê╪¬┘å╪¿┘è┘ç╪º╪¬ ╪º┘ä┘å┘é╪╡",
    category: "core",
    categoryLabel: "┘ê╪¡╪»╪º╪¬ ╪¬╪┤╪║┘è┘ä┘è╪⌐",
    icon: HardDrive,
    route: "/inventory/items",
    routeLabel: "┘ü╪¬╪¡ ╪º┘ä┘à╪│╪¬┘ê╪»╪╣",
    dependency: "┘à╪▒╪¬╪¿╪╖ ╪¿╪º┘ä┘à╪┤╪¬╪▒┘è╪º╪¬ ┘ê╪º┘ä╪╣┘ç╪»",
    badge: "┘à╪«╪▓┘ê┘å",
  },
  {
    key: "hrPayroll",
    name: "┘ê╪¡╪»╪⌐ ╪º┘ä┘à┘ê╪º╪▒╪» ╪º┘ä╪¿╪┤╪▒┘è╪⌐ ┘ê┘à╪│┘è╪▒ ╪º┘ä╪▒┘ê╪º╪¬╪¿",
    desc: "╪»┘ä┘è┘ä ╪º┘ä┘â╪º╪»╪▒╪î ┘à╪│┘è╪▒╪º╪¬ ╪º┘ä╪▒┘ê╪º╪¬╪¿ ╪º┘ä╪┤┘ç╪▒┘è╪⌐╪î ╪º┘ä╪¿╪»┘ä╪º╪¬╪î ╪º┘ä╪¡╪│┘à┘è╪º╪¬╪î ┘ê╪º┘ä╪Ñ╪¼╪º╪▓╪º╪¬ ╪º┘ä╪│┘å┘ê┘è╪⌐",
    category: "core",
    categoryLabel: "┘ê╪¡╪»╪º╪¬ ╪¬╪┤╪║┘è┘ä┘è╪⌐",
    icon: Users,
    route: "/hr/staff",
    routeLabel: "┘ü╪¬╪¡ ╪┤╪ñ┘ê┘å ╪º┘ä┘à┘ê╪╕┘ü┘è┘å",
    dependency: "┘à╪▒╪¬╪¿╪╖ ╪¿╪º┘ä╪«╪▓┘è┘å╪⌐ ┘ê╪º┘ä╪¡╪│╪º╪¿╪º╪¬",
    badge: "╪▒┘ê╪º╪¬╪¿",
    tabShortcut: "hr",
    tabLabel: "╪│┘è╪º╪│╪º╪¬ ╪º┘ä┘à┘ê╪º╪▒╪» ╪º┘ä╪¿╪┤╪▒┘è╪⌐",
  },
  {
    key: "examsReports",
    name: "┘ê╪¡╪»╪⌐ ╪º┘ä╪º╪«╪¬╪¿╪º╪▒╪º╪¬ ┘ê╪▒╪╡╪» ╪º┘ä╪»╪▒╪¼╪º╪¬ ┘ê╪º┘ä╪┤┘ç╪º╪»╪º╪¬",
    desc: "╪¼╪»╪º┘ê┘ä ╪º┘ä╪º┘à╪¬╪¡╪º┘å╪º╪¬╪î ╪▒╪╡╪» ╪º┘ä╪»╪▒╪¼╪º╪¬╪î ┘â╪┤┘ê┘ü ╪º┘ä┘å╪¬╪º╪ª╪¼╪î ┘ê╪Ñ╪╡╪»╪º╪▒ ╪º┘ä╪┤┘ç╪º╪»╪º╪¬ ╪º┘ä╪▒╪│┘à┘è╪⌐",
    category: "core",
    categoryLabel: "┘ê╪¡╪»╪º╪¬ ╪ú┘â╪º╪»┘è┘à┘è╪⌐",
    icon: FileText,
    route: "/exams",
    routeLabel: "┘ü╪¬╪¡ ╪º┘ä╪º╪«╪¬╪¿╪º╪▒╪º╪¬",
    dependency: "┘à╪▒╪¬╪¿╪╖ ╪¿╪º┘ä┘à┘å╪º┘ç╪¼ ┘ê╪º┘ä┘à┘ê╪º╪» ┘ê╪º┘ä┘ü╪╡┘ê┘ä",
    badge: "┘å╪¬╪º╪ª╪¼",
  },
  {
    key: "financeInvoicing",
    name: "╪º┘ä┘à╪▒┘â╪▓ ╪º┘ä┘à╪º┘ä┘è ┘ê╪º┘ä┘ü┘ê╪¬╪▒╪⌐ ┘ê╪º┘ä╪¬╪¡╪╡┘è┘ä",
    desc: "╪Ñ╪╡╪»╪º╪▒ ╪º┘ä┘ü┘ê╪º╪¬┘è╪▒╪î ╪│┘å╪»╪º╪¬ ╪º┘ä┘é╪¿╪╢ ┘ê╪º┘ä╪╡╪▒┘ü╪î ╪│╪¼┘ä╪º╪¬ ╪º┘ä╪«╪▓┘è┘å╪⌐╪î ┘ê╪Ñ╪»╪º╪▒╪⌐ ╪º┘ä╪«╪╡┘ê┘à╪º╪¬ ┘ê╪º┘ä┘à┘å╪¡",
    category: "core",
    categoryLabel: "┘ê╪¡╪»╪º╪¬ ╪¬╪┤╪║┘è┘ä┘è╪⌐",
    icon: DollarSign,
    route: "/finance",
    routeLabel: "┘ü╪¬╪¡ ╪º┘ä┘à╪º┘ä┘è╪⌐",
    dependency: "╪º┘ä┘ê╪¡╪»╪⌐ ╪º┘ä┘à╪▒┘â╪▓┘è╪⌐ ┘ä╪¼┘à┘è╪╣ ╪º┘ä╪Ñ┘è╪▒╪º╪»╪º╪¬ ┘ê╪º┘ä┘à╪╡╪▒┘ê┘ü╪º╪¬",
    badge: "┘à╪º┘ä┘è╪⌐",
    tabShortcut: "finance",
    tabLabel: "╪º┘ä╪│┘è╪º╪│╪º╪¬ ╪º┘ä┘à╪º┘ä┘è╪⌐",
  },
  {
    key: "admissionRegistration",
    name: "╪¿┘ê╪º╪¿╪⌐ ╪º┘ä┘é╪¿┘ê┘ä ┘ê╪º┘ä╪¬╪│╪¼┘è┘ä ╪º┘ä╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è",
    desc: "╪º╪│╪¬┘é╪¿╪º┘ä ╪╖┘ä╪¿╪º╪¬ ╪º┘ä┘à╪│╪¬╪¼╪»┘è┘å╪î ┘à╪▒╪º╪¼╪╣╪⌐ ╪º┘ä┘à╪│╪¬┘å╪»╪º╪¬╪î ┘ê┘ü╪¡╪╡ ╪º┘ä╪│╪╣╪⌐ ╪º┘ä╪º╪│╪¬┘è╪╣╪º╪¿┘è╪⌐ ┘ä┘ä┘ü╪╡┘ê┘ä",
    category: "core",
    categoryLabel: "┘ê╪¡╪»╪º╪¬ ╪ú┘â╪º╪»┘è┘à┘è╪⌐",
    icon: UserPlus,
    route: "/students/new",
    routeLabel: "╪¬╪│╪¼┘è┘ä ╪╖╪º┘ä╪¿",
    dependency: "┘à╪▒╪¬╪¿╪╖ ╪¿╪º┘ä╪│┘å┘ê╪º╪¬ ╪º┘ä╪»╪▒╪º╪│┘è╪⌐ ┘ê╪º┘ä╪╡┘ü┘ê┘ü",
    badge: "╪¬╪│╪¼┘è┘ä",
    tabShortcut: "admission",
    tabLabel: "╪│┘è╪º╪│╪º╪¬ ╪º┘ä┘é╪¿┘ê┘ä",
  },
  {
    key: "parentPortal",
    name: "╪¿┘ê╪º╪¿╪⌐ ┘ê╪¬╪╖╪¿┘è┘é ┘ê┘ä┘è ╪º┘ä╪ú┘à╪▒ ╪º┘ä╪▒┘é┘à┘è",
    desc: "┘à╪¬╪º╪¿╪╣╪⌐ ╪»╪▒╪¼╪º╪¬ ╪º┘ä╪ú╪¿┘å╪º╪í╪î ╪º┘ä╪¡╪╢┘ê╪▒ ┘ê╪º┘ä╪║┘è╪º╪¿╪î ╪│╪»╪º╪» ╪º┘ä╪▒╪│┘ê┘à ╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è╪º┘ï╪î ┘ê╪º┘ä╪¬┘é╪º╪▒┘è╪▒",
    category: "portals",
    categoryLabel: "╪¿┘ê╪º╪¿╪º╪¬ ┘ê╪¬╪╖╪¿┘è┘é╪º╪¬",
    icon: Smartphone,
    route: "/guardians",
    routeLabel: "╪ú┘ê┘ä┘è╪º╪í ╪º┘ä╪ú┘à┘ê╪▒",
    dependency: "┘è╪¬╪╖┘ä╪¿ ╪¡╪│╪º╪¿╪º╪¬ ╪ú┘ê┘ä┘è╪º╪í ╪ú┘à┘ê╪▒ ┘à╪╣╪¬┘à╪»╪⌐",
    badge: "╪¬╪╖╪¿┘è┘é",
    modalOpener: "mobile",
    modalLabel: "╪▒╪¿╪╖ ╪º┘ä╪¬╪╖╪¿┘è┘é ┘ê╪º┘ä┘Ç PIN",
    tabShortcut: "mobile",
    tabLabel: "╪Ñ╪╣╪»╪º╪»╪º╪¬ ╪º┘ä╪¬╪╖╪¿┘è┘é",
  },
  {
    key: "teacherApp",
    name: "╪¬╪╖╪¿┘è┘é ╪º┘ä┘à╪╣┘ä┘à ┘ê╪▒╪╡╪» ╪º┘ä╪¡╪╡╪╡ ┘ê╪º┘ä╪»╪▒╪¼╪º╪¬",
    desc: "╪▒╪╡╪» ╪º┘ä╪¡╪╢┘ê╪▒ ╪º┘ä╪╡╪¿╪º╪¡┘è ┘ê╪¿╪º┘ä╪¡╪╡╪╡╪î ╪¬╪│╪¼┘è┘ä ╪º┘ä┘ê╪º╪¼╪¿╪º╪¬ ┘ê╪º┘ä┘à┘ä╪º╪¡╪╕╪º╪¬ ╪º┘ä╪│┘ä┘ê┘â┘è╪⌐ ╪º┘ä┘è┘ê┘à┘è╪⌐",
    category: "portals",
    categoryLabel: "╪¿┘ê╪º╪¿╪º╪¬ ┘ê╪¬╪╖╪¿┘è┘é╪º╪¬",
    icon: Users,
    route: "/attendance/take",
    routeLabel: "╪▒╪╡╪» ╪º┘ä╪¡╪╢┘ê╪▒",
    dependency: "┘à╪▒╪¬╪¿╪╖ ╪¿╪¼╪»┘ê┘ä ╪º┘ä╪¡╪╡╪╡ ┘ê╪º┘ä╪Ñ╪│┘å╪º╪»",
    badge: "┘à╪╣┘ä┘à",
    modalOpener: "mobile",
    modalLabel: "╪▒╪¿╪╖ ╪¬╪╖╪¿┘è┘é ╪º┘ä┘à╪╣┘ä┘à",
  },
  {
    key: "smsAlerts",
    name: "╪¬┘å╪¿┘è┘ç╪º╪¬ ╪º┘ä╪▒╪│╪º╪ª┘ä ╪º┘ä┘å╪╡┘è╪⌐ ╪º┘ä┘é╪╡┘è╪▒╪⌐ SMS",
    desc: "╪Ñ╪▒╪│╪º┘ä ╪▒╪│╪º╪ª┘ä ┘å╪╡┘è╪⌐ ┘ü┘ê╪▒┘è╪⌐ ┘ä┘ê┘ä┘è ╪º┘ä╪ú┘à╪▒ ╪╣┘å╪» ╪║┘è╪º╪¿ ╪º┘ä╪╖╪º┘ä╪¿ ╪ú┘ê ╪º╪│╪¬╪¡┘é╪º┘é ┘é╪│╪╖ ┘à╪º┘ä┘è",
    category: "portals",
    categoryLabel: "╪º╪¬╪╡╪º┘ä╪º╪¬ ┘ê╪¬┘å╪¿┘è┘ç╪º╪¬",
    icon: Smartphone,
    route: "/admin/notifications",
    routeLabel: "┘à╪▒┘â╪▓ ╪º┘ä╪¬┘å╪¿┘è┘ç╪º╪¬",
    dependency: "┘è╪¬╪╖┘ä╪¿ ╪º╪┤╪¬╪▒╪º┘â ┘à╪▓┘ê╪» SMS ┘à╪╣╪¬┘à╪»",
    badge: "SMS",
    modalOpener: "notif",
    modalLabel: "┘à╪¡╪º┘â╪º╪⌐ ┘ê┘ü╪¡╪╡ SMS",
    tabShortcut: "notif",
    tabLabel: "┘é┘ê╪º╪╣╪» ╪º┘ä╪Ñ╪┤╪╣╪º╪▒╪º╪¬",
  },
  {
    key: "whatsappAlerts",
    name: "╪Ñ╪┤╪╣╪º╪▒╪º╪¬ ┘ê╪¬┘å╪¿┘è┘ç╪º╪¬ ┘ê╪º╪¬╪│╪º╪¿ ╪º┘ä╪¬┘ä┘é╪º╪ª┘è╪⌐",
    desc: "┘é┘å╪º╪⌐ ╪¬┘ê╪º╪╡┘ä ╪¬┘ü╪º╪╣┘ä┘è╪⌐ ┘ü┘ê╪▒┘è╪⌐ ┘ä╪Ñ╪▒╪│╪º┘ä ╪Ñ╪┤╪╣╪º╪▒╪º╪¬ ╪º┘ä╪»╪▒╪¼╪º╪¬ ┘ê╪▒┘ê╪º╪¿╪╖ ╪º┘ä╪│╪»╪º╪» ┘ê╪º┘ä╪║┘è╪º╪¿",
    category: "portals",
    categoryLabel: "╪º╪¬╪╡╪º┘ä╪º╪¬ ┘ê╪¬┘å╪¿┘è┘ç╪º╪¬",
    icon: MessageSquare,
    route: "/admin/notifications",
    routeLabel: "┘à╪▒┘â╪▓ ╪º┘ä╪¬┘å╪¿┘è┘ç╪º╪¬",
    dependency: "┘è╪¬╪╖┘ä╪¿ ┘à┘ü╪¬╪º╪¡ WhatsApp Business",
    badge: "┘ê╪º╪¬╪│╪º╪¿",
    modalOpener: "notif",
    modalLabel: "┘à╪¡╪º┘â╪º╪⌐ ╪Ñ╪▒╪│╪º┘ä ┘ê╪º╪¬╪│╪º╪¿",
  },
  {
    key: "onlinePayments",
    name: "╪¿┘ê╪º╪¿╪º╪¬ ╪º┘ä╪│╪»╪º╪» ┘ê╪º┘ä╪»┘ü╪╣ ╪º┘ä╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è",
    desc: "╪»╪╣┘à ╪│╪»╪º╪» ╪º┘ä╪▒╪│┘ê┘à ╪º┘ä┘à╪»╪▒╪│┘è╪⌐ ╪╣╪¿╪▒ ┘à╪»┘ë╪î ┘ü┘è╪▓╪º╪î ┘à╪º╪│╪¬╪▒┘â╪º╪▒╪»╪î ┘ê╪ú╪¿┘ä ╪¿╪º┘è ╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è╪º┘ï",
    category: "tech",
    categoryLabel: "╪¬┘é┘å┘è╪⌐ ┘ê╪¬┘â╪º┘à┘ä",
    icon: DollarSign,
    route: "/finance",
    routeLabel: "╪¿┘ê╪º╪¿╪⌐ ╪º┘ä╪│╪»╪º╪»",
    dependency: "┘à╪▒╪¬╪¿╪╖ ╪¿╪¿┘ê╪º╪¿╪º╪¬ Stripe ╪ú┘ê PayTabs",
    badge: "╪│╪»╪º╪»",
    tabShortcut: "integrations",
    tabLabel: "╪╢╪¿╪╖ ╪¿┘ê╪º╪¿╪º╪¬ ╪º┘ä╪»┘ü╪╣",
  },
  {
    key: "qrVerification",
    name: "╪º┘ä╪¬╪¡┘é┘é ╪º┘ä╪▒┘é┘à┘è ╪º┘ä┘à╪╣╪¬┘à╪» ╪¿╪º┘ä╪¿╪º╪▒┘â┘ê╪» QR",
    desc: "╪¬╪╢┘à┘è┘å ╪▒┘à╪▓ QR ╪░┘â┘è ┘ü┘è ╪º┘ä╪┤┘ç╪º╪»╪º╪¬ ┘ê╪º┘ä┘ü┘ê╪º╪¬┘è╪▒ ╪º┘ä╪▒╪│┘à┘è╪⌐ ┘ä┘ä╪¬╪¡┘é┘é ╪º┘ä┘ü┘ê╪▒┘è ┘à┘å ╪╡╪¡╪¬┘ç╪º",
    category: "tech",
    categoryLabel: "╪¬┘é┘å┘è╪⌐ ┘ê╪¬┘â╪º┘à┘ä",
    icon: QrCode,
    route: "/settings",
    routeLabel: "┘é┘ê╪º┘ä╪¿ ╪º┘ä╪╖╪¿╪º╪╣╪⌐",
    dependency: "┘à╪»┘à╪¼ ┘à╪╣ ┘à╪¡╪▒┘â ╪º┘ä╪╖╪¿╪º╪╣╪⌐ ┘ê╪º┘ä╪┤┘ç╪º╪»╪º╪¬",
    badge: "QR",
    modalOpener: "print",
    modalLabel: "┘à╪╣╪º┘è┘å╪⌐ ╪º┘ä┘ê╪½┘è┘é╪⌐ A4 ┘ê╪º┘ä┘Ç QR",
    tabShortcut: "print",
    tabLabel: "┘é┘ê╪º┘ä╪¿ ╪º┘ä╪╖╪¿╪º╪╣╪⌐",
  },
  {
    key: "noorIntegration",
    name: "╪º┘ä┘à╪▓╪º┘à┘å╪⌐ ╪º┘ä┘à╪¿╪º╪┤╪▒╪⌐ ┘à╪╣ ┘å╪╕╪º┘à ┘å┘ê╪▒ ╪º┘ä┘ê╪▓╪º╪▒┘è",
    desc: "╪¬╪╡╪»┘è╪▒ ┘ê╪º╪│╪¬┘è╪▒╪º╪» ╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪╖┘ä╪º╪¿ ┘ê╪º┘ä╪»╪▒╪¼╪º╪¬ ┘ê╪º┘ä╪║┘è╪º╪¿ ┘ê┘ü┘é ┘å╪│┘é ┘ê╪▓╪º╪▒╪⌐ ╪º┘ä╪¬╪╣┘ä┘è┘à",
    category: "tech",
    categoryLabel: "╪¬┘é┘å┘è╪⌐ ┘ê╪¬┘â╪º┘à┘ä",
    icon: LinkIcon,
    route: "/settings",
    routeLabel: "╪º┘ä┘à╪│╪¬┘ê╪▒╪» ┘ê┘à╪╖╪º╪¿┘é╪⌐ ┘å┘ê╪▒",
    dependency: "┘à╪╖╪º╪¿┘é ┘ä┘à╪╣╪º┘è┘è╪▒ ┘ê╪▓╪º╪▒╪⌐ ╪º┘ä╪¬╪╣┘ä┘è┘à",
    badge: "┘å╪╕╪º┘à ┘å┘ê╪▒",
    modalOpener: "importer",
    modalLabel: "╪º┘ä┘à╪│╪¬┘ê╪▒╪» ┘ê┘à╪╖╪º╪¿┘é╪⌐ ┘å┘ê╪▒",
    tabShortcut: "data_io",
    tabLabel: "╪º┘ä┘à╪│╪¬┘ê╪▒╪» ┘ê╪º┘ä┘à╪╡╪»╪▒",
  },
  {
    key: "webhooksApi",
    name: "╪º┘ä┘à┘ü╪º╪¬┘è╪¡ ╪º┘ä╪¿╪▒┘à╪¼┘è╪⌐ ┘ê╪ú╪¡╪»╪º╪½ ╪º┘ä┘Ç Webhooks",
    desc: "╪¿╪½ ╪º┘ä╪ú╪¡╪»╪º╪½ ╪º┘ä┘ä╪¡╪╕┘è╪⌐ ┘ä╪ú┘å╪╕┘à╪⌐ ╪º┘ä┘à╪»╪º╪▒╪│ ╪º┘ä╪«╪º╪▒╪¼┘è╪⌐ ┘ê╪¬┘ê┘ü┘è╪▒ ┘ê╪º╪¼┘ç╪º╪¬ ╪¿╪▒┘à╪¼╪⌐ REST API",
    category: "tech",
    categoryLabel: "╪¬┘é┘å┘è╪⌐ ┘ê╪¬┘â╪º┘à┘ä",
    icon: KeyRound,
    route: "/settings",
    routeLabel: "╪Ñ╪╣╪»╪º╪»╪º╪¬ ╪º┘ä┘Ç API",
    dependency: "┘à╪«╪╡╪╡ ┘ä┘ä╪▒╪¿╪╖ ╪º┘ä╪¬┘é┘å┘è ╪º┘ä╪«╪º╪▒╪¼┘è",
    badge: "API",
    modalOpener: "webhook",
    modalLabel: "┘à╪«╪¬╪¿╪▒ ╪º┘ä┘Ç Webhooks ┘ê╪º┘ä╪¿╪½",
    tabShortcut: "api",
    tabLabel: "╪Ñ╪╣╪»╪º╪»╪º╪¬ ╪º┘ä┘Ç API",
  },
  {
    key: "twoFactorAuth",
    name: "╪º┘ä╪¬╪¡┘é┘é ╪º┘ä╪½┘å╪º╪ª┘è ╪¿╪«╪╖┘ê╪¬┘è┘å (2FA)",
    desc: "┘ü╪▒╪╢ ╪▒┘à╪▓ ╪ú┘à╪º┘å ╪Ñ╪╢╪º┘ü┘è OTP ╪╣┘å╪» ╪¬╪│╪¼┘è┘ä ╪»╪«┘ê┘ä ╪º┘ä╪Ñ╪»╪º╪▒┘è┘è┘å ┘ê╪º┘ä┘à╪¡╪º╪│╪¿┘è┘å ┘ä╪¡┘à╪º┘è╪⌐ ╪º┘ä╪¿┘è╪º┘å╪º╪¬",
    category: "security",
    categoryLabel: "╪ú┘à╪º┘å ┘ê╪¡┘à╪º┘è╪⌐",
    icon: Lock,
    route: "/admin/permissions",
    routeLabel: "╪│┘è╪º╪│╪º╪¬ ╪º┘ä╪ú┘à╪º┘å",
    dependency: "╪│┘è╪º╪│╪⌐ ╪¡┘à╪º┘è╪⌐ ╪º┘ä╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪¡╪│╪º╪│╪⌐",
    badge: "╪ú┘à╪º┘å",
    tabShortcut: "security",
    tabLabel: "╪│┘è╪º╪│╪º╪¬ ╪º┘ä╪»╪«┘ê┘ä ┘ê 2FA",
  },
  {
    key: "smartAnalyticsAi",
    name: "╪º┘ä╪¬╪¡┘ä┘è┘ä╪º╪¬ ╪º┘ä╪░┘â┘è╪⌐ ┘ê┘à╪│╪º╪╣╪» ╪º┘ä╪░┘â╪º╪í ╪º┘ä╪º╪╡╪╖┘å╪º╪╣┘è",
    desc: "╪¬┘ê┘é╪╣ ┘à╪│╪¬┘ê┘è╪º╪¬ ╪º┘ä╪¬╪╣╪½╪▒ ╪º┘ä╪ú┘â╪º╪»┘è┘à┘è╪î ╪¬┘ê╪╡┘è╪º╪¬ ╪¬┘ê╪▓┘è╪╣ ╪º┘ä╪¡╪╡╪╡╪î ┘ê╪º┘ä┘à╪│╪º╪╣╪» ╪º┘ä╪░┘â┘è ┘ä┘ä╪Ñ╪»╪º╪▒╪⌐",
    category: "tech",
    categoryLabel: "╪¬┘é┘å┘è╪⌐ ┘ê╪¬┘â╪º┘à┘ä",
    icon: Sparkles,
    route: "/exams/archive",
    routeLabel: "╪│╪¼┘ä ╪º┘ä╪¬╪¡┘ä┘è┘ä╪º╪¬",
    dependency: "╪¬╪¡┘ä┘è┘ä ┘à╪»┘à╪¼ ┘ä┘é┘ê╪º╪╣╪» ╪º┘ä╪¿┘è╪º┘å╪º╪¬",
    badge: "AI ╪░┘â┘è",
  },
  {
    key: "trashBin",
    name: "╪│┘ä╪⌐ ╪º┘ä┘à╪¡╪░┘ê┘ü╪º╪¬ ╪º┘ä┘à╪▒┘â╪▓┘è╪⌐ ┘ê╪º╪│╪¬╪▒╪¼╪º╪╣ ╪º┘ä╪¿┘è╪º┘å╪º╪¬",
    desc: "╪º┘ä╪¡╪░┘ü ╪º┘ä╪ó┘à┘å ╪º┘ä┘à╪ñ┘é╪¬ ┘ä┘ä╪╖┘ä╪º╪¿ ┘ê╪º┘ä┘à┘ê╪╕┘ü┘è┘å ┘à╪╣ ╪Ñ┘à┘â╪º┘å┘è╪⌐ ╪º┘ä╪º╪│╪¬╪▒╪¼╪º╪╣ ╪ú┘ê ╪º┘ä╪Ñ╪¬┘ä╪º┘ü ╪º┘ä┘å┘ç╪º╪ª┘è",
    category: "security",
    categoryLabel: "╪ú┘à╪º┘å ┘ê╪¡┘à╪º┘è╪⌐",
    icon: Trash2,
    route: "/settings/trash",
    routeLabel: "╪│┘ä╪⌐ ╪º┘ä┘à╪¡╪░┘ê┘ü╪º╪¬",
    dependency: "╪¡┘à╪º┘è╪⌐ ╪╢╪» ╪º┘ä╪¡╪░┘ü ╪º┘ä╪╣┘ü┘ê┘è ┘ä┘ä╪¿┘è╪º┘å╪º╪¬",
    badge: "╪º╪│╪¬╪╣╪º╪»╪⌐",
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
        toast.error("╪¡╪¼┘à ╪º┘ä╪╡┘ê╪▒╪⌐ ┘â╪¿┘è╪▒ ╪¼╪»╪º┘ï╪î ┘è┘ü╪╢┘ä ╪ú┘å ┘è┘â┘ê┘å ╪ú┘é┘ä ┘à┘å 2 ┘à┘è╪║╪º╪¿╪º┘è╪¬");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        updateSettings({ logoUrl: dataUrl });
        toast.success("╪¬┘à ╪¬╪¡╪»┘è╪½ ┘ê╪¡┘ü╪╕ ╪º┘ä╪┤╪╣╪º╪▒ ╪º┘ä╪▒╪│┘à┘è ╪¿┘å╪¼╪º╪¡ ┘ê╪¬╪╖╪¿┘è┘é┘ç ╪╣┘ä┘ë ╪º┘ä┘å╪╕╪º┘à");
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
        toast.success("╪¬┘à ╪¡┘ü╪╕ ╪º┘ä╪«╪¬┘à ╪º┘ä╪▒╪│┘à┘è ┘ê╪¬┘ü╪╣┘è┘ä┘ç ╪╣┘ä┘ë ╪º┘ä╪┤┘ç╪º╪»╪º╪¬ ┘ê╪º┘ä┘à╪╖╪¿┘ê╪╣╪º╪¬");
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
    toast.success("╪¬┘à ╪¬╪╡╪»┘è╪▒ ┘à┘ä┘ü ╪Ñ╪╣╪»╪º╪»╪º╪¬ ╪º┘ä┘å╪╕╪º┘à ╪¿┘å╪¼╪º╪¡");
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
            toast.success("╪¬┘à ╪º╪│╪¬┘è╪▒╪º╪» ┘ê╪¬╪╖╪¿┘è┘é ╪º┘ä╪Ñ╪╣╪»╪º╪»╪º╪¬ ╪º┘ä┘à╪▒┘â╪▓┘è╪⌐ ╪¿┘å╪¼╪º╪¡");
          } else {
            toast.error("┘à┘ä┘ü ╪º┘ä╪Ñ╪╣╪»╪º╪»╪º╪¬ ╪║┘è╪▒ ╪╡╪º┘ä╪¡");
          }
        } catch {
          toast.error("╪«╪╖╪ú ┘ü┘è ┘é╪▒╪º╪í╪⌐ ┘à┘ä┘ü ╪º┘ä╪Ñ╪╣╪»╪º╪»╪º╪¬");
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
    toast.success("╪¬┘à ╪¬╪╣┘è┘è┘å ╪º┘ä╪│┘å╪⌐ ╪º┘ä╪ú┘â╪º╪»┘è┘à┘è╪⌐ ╪º┘ä┘å╪┤╪╖╪⌐ ┘ä┘ä┘à┘å╪╡╪⌐");
  };

  // Presets for features
  const handleApplyPreset = (preset: "enterprise" | "academic" | "minimal" | "default") => {
    if (preset === "enterprise") {
      const allOn = Object.keys(defaultFeatures).reduce((acc, k) => {
        acc[k as keyof SystemFeatures] = true;
        return acc;
      }, {} as SystemFeatures);
      updateFeatures(allOn);
      toast.success("╪¬┘à ╪¬┘ü╪╣┘è┘ä ╪¡╪▓┘à╪⌐ Enterprise ╪º┘ä╪┤╪º┘à┘ä╪⌐ (┘â╪º┘ü╪⌐ ╪º┘ä┘à┘è╪▓╪º╪¬ ┘å╪┤╪╖╪⌐)");
    } else if (preset === "academic") {
      updateFeatures({
        ...defaultFeatures,
        transport: false,
        inventory: false,
        clinic: false,
        onlinePayments: false,
      });
      toast.success("╪¬┘à ╪¬┘ü╪╣┘è┘ä ┘å┘à╪╖ ╪º┘ä╪¬╪┤╪║┘è┘ä ╪º┘ä╪ú┘â╪º╪»┘è┘à┘è ╪º┘ä╪ú╪│╪º╪│┘è (╪¿╪»┘ê┘å ╪«╪»┘à╪º╪¬ ╪º┘ä┘à╪▒╪º┘ü┘é ┘ê╪º┘ä┘å┘é┘ä)");
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
      toast.success("╪¬┘à ╪¬┘ü╪╣┘è┘ä ╪º┘ä┘ê╪╢╪╣ ╪º┘ä┘à╪╡╪║╪▒ (╪º┘ä╪╡┘ü┘ê┘ü╪î ╪º┘ä╪╖┘ä╪º╪¿╪î ┘ê╪º┘ä╪»╪▒╪¼╪º╪¬ ┘ü┘é╪╖)");
    } else {
      updateFeatures(defaultFeatures);
      toast.success("╪¬┘à╪¬ ╪º╪│╪¬╪╣╪º╪»╪⌐ ╪º┘ä╪¬┘ç┘è╪ª╪⌐ ╪º┘ä╪º┘ü╪¬╪▒╪º╪╢┘è╪⌐ ┘ä┘â╪º┘ü╪⌐ ┘à┘è╪▓╪º╪¬ ╪º┘ä┘å╪╕╪º┘à");
    }
  };

  const handleGlobalSave = () => {
    addActivityLog({
      user: "┘à╪»┘è╪▒ ╪º┘ä┘å╪╕╪º┘à",
      action: "╪¬╪½╪¿┘è╪¬ ┘ê╪¡┘ü╪╕ ╪º┘ä╪Ñ╪╣╪»╪º╪»╪º╪¬ ╪º┘ä┘à╪▒┘â╪▓┘è╪⌐",
      entity: "╪º┘ä╪Ñ╪╣╪»╪º╪»╪º╪¬ ╪º┘ä┘à╪▒┘â╪▓┘è╪⌐ ┘ê╪º┘ä┘à┘è╪▓╪º╪¬",
      details: "╪¬┘à ╪¬╪ú┘â┘è╪» ┘ê╪¡┘ü╪╕ ┘â╪º┘ü╪⌐ ╪º┘ä╪│┘è╪º╪│╪º╪¬ ┘ê╪¡╪º┘ä╪⌐ ╪¬┘ü╪╣┘è┘ä ╪º┘ä┘à┘è╪▓╪º╪¬ ╪¿┘å╪¼╪º╪¡",
    });
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 3000);
    toast.success("╪¬┘à ╪¡┘ü╪╕ ┘ê╪¬╪½╪¿┘è╪¬ ┘â╪º┘ü╪⌐ ╪º┘ä╪Ñ╪╣╪»╪º╪»╪º╪¬ ┘ê╪º┘ä╪│┘è╪º╪│╪º╪¬ ╪º┘ä┘à╪▒┘â╪▓┘è╪⌐ ╪¿┘å╪¼╪º╪¡");
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
    <AppShell breadcrumb={[{ label: "╪º┘ä╪▒╪ª┘è╪│┘è╪⌐", to: "/" }, { label: "╪º┘ä╪Ñ╪╣╪»╪º╪»╪º╪¬ ╪º┘ä┘à╪▒┘â╪▓┘è╪⌐ ┘ê┘à┘è╪▓╪º╪¬ ╪º┘ä┘å╪╕╪º┘à" }]}>
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20">
            <Settings className="h-6 w-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-foreground">╪º┘ä╪Ñ╪╣╪»╪º╪»╪º╪¬ ╪º┘ä┘à╪▒┘â╪▓┘è╪⌐ ┘ê╪º┘ä╪¬╪¡┘â┘à ╪¿╪º┘ä┘à┘è╪▓╪º╪¬</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-black flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {activeFeaturesCount} ┘à┘è╪▓╪⌐ ┘å╪┤╪╖╪⌐ ({activePercentage}%)
              </span>
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-0.5">
              ┘ä┘ê╪¡╪⌐ ╪º┘ä╪¬╪¡┘â┘à ╪º┘ä╪┤╪º┘à┘ä╪⌐ ╪¿╪│┘è╪º╪│╪º╪¬ ╪º┘ä┘à╪ñ╪│╪│╪⌐╪î ╪¬╪▒╪«┘è╪╡ ╪º┘ä┘ê╪¡╪»╪º╪¬╪î ╪º┘ä┘ç┘ê┘è╪⌐ ╪º┘ä╪▒╪│┘à┘è╪⌐╪î ┘ê╪º┘ä╪▒╪¿╪╖ ╪º┘ä╪¿╪▒┘à╪¼┘è
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
            <span>┘à╪▒┘â╪▓ ╪º┘ä┘à┘è╪▓╪º╪¬</span>
          </button>

          {/* Smart Importer Shortcut */}
          <button
            onClick={() => setIsImporterOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold transition-all shadow-xs text-foreground"
            title="┘ü╪¬╪¡ ╪º┘ä┘à╪│╪¬┘ê╪▒╪» ╪º┘ä╪░┘â┘è ┘ê┘à╪╖╪º╪¿┘é╪⌐ ┘å┘ê╪▒"
          >
            <Database className="h-3.5 w-3.5 text-primary" />
            <span>╪º┘ä┘à╪│╪¬┘ê╪▒╪» ╪º┘ä╪░┘â┘è</span>
          </button>

          {/* System Exporter Shortcut */}
          <button
            onClick={() => setIsExporterOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold transition-all shadow-xs text-foreground"
            title="╪¬╪╡╪»┘è╪▒ ╪¿┘è╪º┘å╪º╪¬ ╪º┘ä┘å╪╕╪º┘à ╪º┘ä┘à╪¼┘à╪╣╪⌐"
          >
            <ArrowUpFromLine className="h-3.5 w-3.5 text-primary" />
            <span>╪¬╪╡╪»┘è╪▒ ╪┤╪º┘à┘ä</span>
          </button>

          {/* Notification Simulator Shortcut */}
          <button
            onClick={() => setIsNotifTesterOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold transition-all shadow-xs text-foreground"
            title="┘à╪¡╪º┘â╪º╪⌐ ┘ê╪º╪«╪¬╪¿╪º╪▒ ┘é┘å┘ê╪º╪¬ ╪º┘ä╪Ñ╪▒╪│╪º┘ä SMS ┘ê┘ê╪º╪¬╪│╪º╪¿"
          >
            <BellRing className="h-3.5 w-3.5 text-primary" />
            <span>┘à╪¡╪º┘â┘è ╪º┘ä╪Ñ╪┤╪╣╪º╪▒╪º╪¬</span>
          </button>

          {/* Official Print Preview Shortcut */}
          <button
            onClick={() => setIsPrintPreviewOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold transition-all shadow-xs text-foreground"
            title="┘à╪╣╪º┘è┘å╪⌐ ╪º┘ä┘à╪╖╪¿┘ê╪╣╪º╪¬ ╪º┘ä╪▒╪│┘à┘è╪⌐ A4 ┘ê╪º┘ä┘Ç QR"
          >
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>┘à╪╣╪º┘è┘å╪⌐ A4</span>
          </button>

          {/* Settings JSON Export */}
          <button
            onClick={handleExportSettingsJson}
            title="╪¬╪╡╪»┘è╪▒ ╪º┘ä╪Ñ╪╣╪»╪º╪»╪º╪¬ ┘â┘à┘ä┘ü JSON"
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold transition-all shadow-xs"
          >
            <ArrowDownToLine className="h-3.5 w-3.5 text-primary" />
            <span>╪¬╪╡╪»┘è╪▒ Config</span>
          </button>

          {/* Settings JSON Import */}
          <label
            title="╪º╪│╪¬┘è╪▒╪º╪» ╪Ñ╪╣╪»╪º╪»╪º╪¬ ┘à┘å ┘à┘ä┘ü JSON"
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <input type="file" accept=".json" onChange={handleImportSettingsJson} className="hidden" />
            <ArrowUpFromLine className="h-3.5 w-3.5 text-primary" />
            <span>╪º╪│╪¬┘è╪▒╪º╪» Config</span>
          </label>

          {/* Instant Backup Shortcut */}
          <button
            onClick={() => setIsBackupOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold transition-all shadow-xs text-foreground"
            title="╪ú╪«╪░ ┘å╪│╪«╪⌐ ╪º╪¡╪¬┘è╪º╪╖┘è╪⌐ ┘ü┘ê╪▒┘è╪⌐ ┘ä┘ä┘å╪╕╪º┘à"
          >
            <HardDrive className="h-3.5 w-3.5 text-primary" />
            <span>┘å╪│╪« ┘ü┘ê╪▒┘è</span>
          </button>

          {/* System Trash Button with counter */}
          <Link
            to="/settings/trash"
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-border/80 bg-card hover:bg-accent text-xs font-bold transition-all shadow-xs text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5 text-danger" />
            <span>╪│┘ä╪⌐ ╪º┘ä┘à┘ç┘à┘ä╪º╪¬</span>
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
            title="╪º╪│╪¬╪╣╪º╪»╪⌐ ╪Ñ╪╣╪»╪º╪»╪º╪¬ ╪º┘ä┘à╪╡┘å╪╣ ┘ê╪╢╪¿╪╖ ╪º┘ä╪ú┘à╪º┘å"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>╪╢╪¿╪╖ ╪º┘ä┘à╪╡┘å╪╣</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Selector (Visible on < lg screens) */}
      <div className="lg:hidden mb-4 p-3.5 rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-black text-muted-foreground flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            <span>╪º┘ä╪º┘å╪¬┘é╪º┘ä ╪º┘ä╪│╪▒┘è╪╣ ┘ä┘ä┘é╪│┘à:</span>
          </label>
          <span className="text-[10px] text-muted-foreground font-bold">
            {TAB_GROUPS.reduce((acc, g) => acc + g.tabs.length, 0)} ┘é╪│┘à╪º┘ï ┘à╪¬╪º╪¡╪º┘ï
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
            <span>╪º┘ä┘à┘è╪▓╪º╪¬</span>
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
              placeholder="╪¿╪¡╪½ ┘ü┘è ╪º┘ä╪Ñ╪╣╪»╪º╪»╪º╪¬ ┘ê╪º┘ä┘à┘è╪▓╪º╪¬..."
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
              <div className="p-4 text-center text-xs text-muted-foreground">┘ä╪º ╪¬┘ê╪¼╪» ╪ú┘é╪│╪º┘à ┘à╪╖╪º╪¿┘é╪⌐ ┘ä╪¿╪¡╪½┘â</div>
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
                                : t.badge === "┘à╪▒┘â╪▓ ╪º┘ä┘à┘è╪▓╪º╪¬"
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
          {/* TAB 0: Features & Modules Control Center (╪º┘ä╪¬╪¡┘â┘à ╪¿╪º┘ä┘à┘è╪▓╪º╪¬ ┘ê╪º┘ä┘ê╪¡╪»╪º╪¬) */}
          {/* ========================================================================= */}

          {/* ─── Tab Panels (extracted to settings-tabs.tsx) ─── */}
          {tab === "features" && (
            <FeaturesTab
            settings={systemSettings}
            update={updateSettings}
            currency={currency}
            setCurrency={setCurrency}
            allAcademicYears={allAcademicYears}
            onSelectYear={handleSelectAcademicYear}
            onAddYear={() => setIsAddYearOpen(true)}
            onLogoUpload={handleLogoUpload}
            onStampUpload={handleStampUpload}
            onPrintPreview={() => setIsPrintPreviewOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onImporter={() => setIsImporterOpen(true)}
            onExporter={() => setIsExporterOpen(true)}
            onWebhookTester={() => setIsWebhookTesterOpen(true)}
            onOpenTester={() => setIsNotifTesterOpen(true)}
            onMobileConnect={() => setIsMobileConnectOpen(true)}
            filteredFeaturesList={filteredFeaturesList}
            activeFeaturesCount={activeFeaturesCount}
            totalFeaturesCount={totalFeaturesCount}
            activePercentage={activePercentage}
            featureCategoryFilter={featureCategoryFilter}
            setFeatureCategoryFilter={setFeatureCategoryFilter}
            searchQuery={searchQuery}
            toggleFeature={toggleFeature}
            handleApplyPreset={handleApplyPreset}
            setIsImporterOpen={setIsImporterOpen}
            setIsExporterOpen={setIsExporterOpen}
            setIsBackupOpen={setIsBackupOpen}
            setIsPrintPreviewOpen={setIsPrintPreviewOpen}
            setIsWebhookTesterOpen={setIsWebhookTesterOpen}
            setIsNotifTesterOpen={setIsNotifTesterOpen}
            setIsMobileConnectOpen={setIsMobileConnectOpen}
            setIsFactoryResetOpen={setIsFactoryResetOpen}
            setIsAddYearOpen={setIsAddYearOpen}
            setTab={setTab}
            />
          )}

          {tab === "school" && (
            <SchoolTab
            settings={systemSettings}
            update={updateSettings}
            currency={currency}
            setCurrency={setCurrency}
            allAcademicYears={allAcademicYears}
            onSelectYear={handleSelectAcademicYear}
            onAddYear={() => setIsAddYearOpen(true)}
            onLogoUpload={handleLogoUpload}
            onStampUpload={handleStampUpload}
            onPrintPreview={() => setIsPrintPreviewOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onImporter={() => setIsImporterOpen(true)}
            onExporter={() => setIsExporterOpen(true)}
            onWebhookTester={() => setIsWebhookTesterOpen(true)}
            onOpenTester={() => setIsNotifTesterOpen(true)}
            onMobileConnect={() => setIsMobileConnectOpen(true)}
            filteredFeaturesList={filteredFeaturesList}
            activeFeaturesCount={activeFeaturesCount}
            totalFeaturesCount={totalFeaturesCount}
            activePercentage={activePercentage}
            featureCategoryFilter={featureCategoryFilter}
            setFeatureCategoryFilter={setFeatureCategoryFilter}
            searchQuery={searchQuery}
            toggleFeature={toggleFeature}
            handleApplyPreset={handleApplyPreset}
            setIsImporterOpen={setIsImporterOpen}
            setIsExporterOpen={setIsExporterOpen}
            setIsBackupOpen={setIsBackupOpen}
            setIsPrintPreviewOpen={setIsPrintPreviewOpen}
            setIsWebhookTesterOpen={setIsWebhookTesterOpen}
            setIsNotifTesterOpen={setIsNotifTesterOpen}
            setIsMobileConnectOpen={setIsMobileConnectOpen}
            setIsFactoryResetOpen={setIsFactoryResetOpen}
            setIsAddYearOpen={setIsAddYearOpen}
            setTab={setTab}
            />
          )}

          {tab === "brand" && (
            <BrandTab
            settings={systemSettings}
            update={updateSettings}
            currency={currency}
            setCurrency={setCurrency}
            allAcademicYears={allAcademicYears}
            onSelectYear={handleSelectAcademicYear}
            onAddYear={() => setIsAddYearOpen(true)}
            onLogoUpload={handleLogoUpload}
            onStampUpload={handleStampUpload}
            onPrintPreview={() => setIsPrintPreviewOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onImporter={() => setIsImporterOpen(true)}
            onExporter={() => setIsExporterOpen(true)}
            onWebhookTester={() => setIsWebhookTesterOpen(true)}
            onOpenTester={() => setIsNotifTesterOpen(true)}
            onMobileConnect={() => setIsMobileConnectOpen(true)}
            filteredFeaturesList={filteredFeaturesList}
            activeFeaturesCount={activeFeaturesCount}
            totalFeaturesCount={totalFeaturesCount}
            activePercentage={activePercentage}
            featureCategoryFilter={featureCategoryFilter}
            setFeatureCategoryFilter={setFeatureCategoryFilter}
            searchQuery={searchQuery}
            toggleFeature={toggleFeature}
            handleApplyPreset={handleApplyPreset}
            setIsImporterOpen={setIsImporterOpen}
            setIsExporterOpen={setIsExporterOpen}
            setIsBackupOpen={setIsBackupOpen}
            setIsPrintPreviewOpen={setIsPrintPreviewOpen}
            setIsWebhookTesterOpen={setIsWebhookTesterOpen}
            setIsNotifTesterOpen={setIsNotifTesterOpen}
            setIsMobileConnectOpen={setIsMobileConnectOpen}
            setIsFactoryResetOpen={setIsFactoryResetOpen}
            setIsAddYearOpen={setIsAddYearOpen}
            setTab={setTab}
            />
          )}

          {tab === "facilities" && (
            <FacilitiesTab
            settings={systemSettings}
            update={updateSettings}
            currency={currency}
            setCurrency={setCurrency}
            allAcademicYears={allAcademicYears}
            onSelectYear={handleSelectAcademicYear}
            onAddYear={() => setIsAddYearOpen(true)}
            onLogoUpload={handleLogoUpload}
            onStampUpload={handleStampUpload}
            onPrintPreview={() => setIsPrintPreviewOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onImporter={() => setIsImporterOpen(true)}
            onExporter={() => setIsExporterOpen(true)}
            onWebhookTester={() => setIsWebhookTesterOpen(true)}
            onOpenTester={() => setIsNotifTesterOpen(true)}
            onMobileConnect={() => setIsMobileConnectOpen(true)}
            filteredFeaturesList={filteredFeaturesList}
            activeFeaturesCount={activeFeaturesCount}
            totalFeaturesCount={totalFeaturesCount}
            activePercentage={activePercentage}
            featureCategoryFilter={featureCategoryFilter}
            setFeatureCategoryFilter={setFeatureCategoryFilter}
            searchQuery={searchQuery}
            toggleFeature={toggleFeature}
            handleApplyPreset={handleApplyPreset}
            setIsImporterOpen={setIsImporterOpen}
            setIsExporterOpen={setIsExporterOpen}
            setIsBackupOpen={setIsBackupOpen}
            setIsPrintPreviewOpen={setIsPrintPreviewOpen}
            setIsWebhookTesterOpen={setIsWebhookTesterOpen}
            setIsNotifTesterOpen={setIsNotifTesterOpen}
            setIsMobileConnectOpen={setIsMobileConnectOpen}
            setIsFactoryResetOpen={setIsFactoryResetOpen}
            setIsAddYearOpen={setIsAddYearOpen}
            setTab={setTab}
            />
          )}

          {tab === "academic" && (
            <AcademicTab
            settings={systemSettings}
            update={updateSettings}
            currency={currency}
            setCurrency={setCurrency}
            allAcademicYears={allAcademicYears}
            onSelectYear={handleSelectAcademicYear}
            onAddYear={() => setIsAddYearOpen(true)}
            onLogoUpload={handleLogoUpload}
            onStampUpload={handleStampUpload}
            onPrintPreview={() => setIsPrintPreviewOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onImporter={() => setIsImporterOpen(true)}
            onExporter={() => setIsExporterOpen(true)}
            onWebhookTester={() => setIsWebhookTesterOpen(true)}
            onOpenTester={() => setIsNotifTesterOpen(true)}
            onMobileConnect={() => setIsMobileConnectOpen(true)}
            filteredFeaturesList={filteredFeaturesList}
            activeFeaturesCount={activeFeaturesCount}
            totalFeaturesCount={totalFeaturesCount}
            activePercentage={activePercentage}
            featureCategoryFilter={featureCategoryFilter}
            setFeatureCategoryFilter={setFeatureCategoryFilter}
            searchQuery={searchQuery}
            toggleFeature={toggleFeature}
            handleApplyPreset={handleApplyPreset}
            setIsImporterOpen={setIsImporterOpen}
            setIsExporterOpen={setIsExporterOpen}
            setIsBackupOpen={setIsBackupOpen}
            setIsPrintPreviewOpen={setIsPrintPreviewOpen}
            setIsWebhookTesterOpen={setIsWebhookTesterOpen}
            setIsNotifTesterOpen={setIsNotifTesterOpen}
            setIsMobileConnectOpen={setIsMobileConnectOpen}
            setIsFactoryResetOpen={setIsFactoryResetOpen}
            setIsAddYearOpen={setIsAddYearOpen}
            setTab={setTab}
            />
          )}

          {tab === "admission" && (
            <AdmissionTab
            settings={systemSettings}
            update={updateSettings}
            currency={currency}
            setCurrency={setCurrency}
            allAcademicYears={allAcademicYears}
            onSelectYear={handleSelectAcademicYear}
            onAddYear={() => setIsAddYearOpen(true)}
            onLogoUpload={handleLogoUpload}
            onStampUpload={handleStampUpload}
            onPrintPreview={() => setIsPrintPreviewOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onImporter={() => setIsImporterOpen(true)}
            onExporter={() => setIsExporterOpen(true)}
            onWebhookTester={() => setIsWebhookTesterOpen(true)}
            onOpenTester={() => setIsNotifTesterOpen(true)}
            onMobileConnect={() => setIsMobileConnectOpen(true)}
            filteredFeaturesList={filteredFeaturesList}
            activeFeaturesCount={activeFeaturesCount}
            totalFeaturesCount={totalFeaturesCount}
            activePercentage={activePercentage}
            featureCategoryFilter={featureCategoryFilter}
            setFeatureCategoryFilter={setFeatureCategoryFilter}
            searchQuery={searchQuery}
            toggleFeature={toggleFeature}
            handleApplyPreset={handleApplyPreset}
            setIsImporterOpen={setIsImporterOpen}
            setIsExporterOpen={setIsExporterOpen}
            setIsBackupOpen={setIsBackupOpen}
            setIsPrintPreviewOpen={setIsPrintPreviewOpen}
            setIsWebhookTesterOpen={setIsWebhookTesterOpen}
            setIsNotifTesterOpen={setIsNotifTesterOpen}
            setIsMobileConnectOpen={setIsMobileConnectOpen}
            setIsFactoryResetOpen={setIsFactoryResetOpen}
            setIsAddYearOpen={setIsAddYearOpen}
            setTab={setTab}
            />
          )}

          {tab === "hr" && (
            <HRTab
            settings={systemSettings}
            update={updateSettings}
            currency={currency}
            setCurrency={setCurrency}
            allAcademicYears={allAcademicYears}
            onSelectYear={handleSelectAcademicYear}
            onAddYear={() => setIsAddYearOpen(true)}
            onLogoUpload={handleLogoUpload}
            onStampUpload={handleStampUpload}
            onPrintPreview={() => setIsPrintPreviewOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onImporter={() => setIsImporterOpen(true)}
            onExporter={() => setIsExporterOpen(true)}
            onWebhookTester={() => setIsWebhookTesterOpen(true)}
            onOpenTester={() => setIsNotifTesterOpen(true)}
            onMobileConnect={() => setIsMobileConnectOpen(true)}
            filteredFeaturesList={filteredFeaturesList}
            activeFeaturesCount={activeFeaturesCount}
            totalFeaturesCount={totalFeaturesCount}
            activePercentage={activePercentage}
            featureCategoryFilter={featureCategoryFilter}
            setFeatureCategoryFilter={setFeatureCategoryFilter}
            searchQuery={searchQuery}
            toggleFeature={toggleFeature}
            handleApplyPreset={handleApplyPreset}
            setIsImporterOpen={setIsImporterOpen}
            setIsExporterOpen={setIsExporterOpen}
            setIsBackupOpen={setIsBackupOpen}
            setIsPrintPreviewOpen={setIsPrintPreviewOpen}
            setIsWebhookTesterOpen={setIsWebhookTesterOpen}
            setIsNotifTesterOpen={setIsNotifTesterOpen}
            setIsMobileConnectOpen={setIsMobileConnectOpen}
            setIsFactoryResetOpen={setIsFactoryResetOpen}
            setIsAddYearOpen={setIsAddYearOpen}
            setTab={setTab}
            />
          )}

          {tab === "finance" && (
            <FinanceTab
            settings={systemSettings}
            update={updateSettings}
            currency={currency}
            setCurrency={setCurrency}
            allAcademicYears={allAcademicYears}
            onSelectYear={handleSelectAcademicYear}
            onAddYear={() => setIsAddYearOpen(true)}
            onLogoUpload={handleLogoUpload}
            onStampUpload={handleStampUpload}
            onPrintPreview={() => setIsPrintPreviewOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onImporter={() => setIsImporterOpen(true)}
            onExporter={() => setIsExporterOpen(true)}
            onWebhookTester={() => setIsWebhookTesterOpen(true)}
            onOpenTester={() => setIsNotifTesterOpen(true)}
            onMobileConnect={() => setIsMobileConnectOpen(true)}
            filteredFeaturesList={filteredFeaturesList}
            activeFeaturesCount={activeFeaturesCount}
            totalFeaturesCount={totalFeaturesCount}
            activePercentage={activePercentage}
            featureCategoryFilter={featureCategoryFilter}
            setFeatureCategoryFilter={setFeatureCategoryFilter}
            searchQuery={searchQuery}
            toggleFeature={toggleFeature}
            handleApplyPreset={handleApplyPreset}
            setIsImporterOpen={setIsImporterOpen}
            setIsExporterOpen={setIsExporterOpen}
            setIsBackupOpen={setIsBackupOpen}
            setIsPrintPreviewOpen={setIsPrintPreviewOpen}
            setIsWebhookTesterOpen={setIsWebhookTesterOpen}
            setIsNotifTesterOpen={setIsNotifTesterOpen}
            setIsMobileConnectOpen={setIsMobileConnectOpen}
            setIsFactoryResetOpen={setIsFactoryResetOpen}
            setIsAddYearOpen={setIsAddYearOpen}
            setTab={setTab}
            />
          )}

          {tab === "theme" && (
            <ThemeTab
            settings={systemSettings}
            update={updateSettings}
            currency={currency}
            setCurrency={setCurrency}
            allAcademicYears={allAcademicYears}
            onSelectYear={handleSelectAcademicYear}
            onAddYear={() => setIsAddYearOpen(true)}
            onLogoUpload={handleLogoUpload}
            onStampUpload={handleStampUpload}
            onPrintPreview={() => setIsPrintPreviewOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onImporter={() => setIsImporterOpen(true)}
            onExporter={() => setIsExporterOpen(true)}
            onWebhookTester={() => setIsWebhookTesterOpen(true)}
            onOpenTester={() => setIsNotifTesterOpen(true)}
            onMobileConnect={() => setIsMobileConnectOpen(true)}
            filteredFeaturesList={filteredFeaturesList}
            activeFeaturesCount={activeFeaturesCount}
            totalFeaturesCount={totalFeaturesCount}
            activePercentage={activePercentage}
            featureCategoryFilter={featureCategoryFilter}
            setFeatureCategoryFilter={setFeatureCategoryFilter}
            searchQuery={searchQuery}
            toggleFeature={toggleFeature}
            handleApplyPreset={handleApplyPreset}
            setIsImporterOpen={setIsImporterOpen}
            setIsExporterOpen={setIsExporterOpen}
            setIsBackupOpen={setIsBackupOpen}
            setIsPrintPreviewOpen={setIsPrintPreviewOpen}
            setIsWebhookTesterOpen={setIsWebhookTesterOpen}
            setIsNotifTesterOpen={setIsNotifTesterOpen}
            setIsMobileConnectOpen={setIsMobileConnectOpen}
            setIsFactoryResetOpen={setIsFactoryResetOpen}
            setIsAddYearOpen={setIsAddYearOpen}
            setTab={setTab}
            />
          )}

          {tab === "lang" && (
            <LangTab
            settings={systemSettings}
            update={updateSettings}
            currency={currency}
            setCurrency={setCurrency}
            allAcademicYears={allAcademicYears}
            onSelectYear={handleSelectAcademicYear}
            onAddYear={() => setIsAddYearOpen(true)}
            onLogoUpload={handleLogoUpload}
            onStampUpload={handleStampUpload}
            onPrintPreview={() => setIsPrintPreviewOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onImporter={() => setIsImporterOpen(true)}
            onExporter={() => setIsExporterOpen(true)}
            onWebhookTester={() => setIsWebhookTesterOpen(true)}
            onOpenTester={() => setIsNotifTesterOpen(true)}
            onMobileConnect={() => setIsMobileConnectOpen(true)}
            filteredFeaturesList={filteredFeaturesList}
            activeFeaturesCount={activeFeaturesCount}
            totalFeaturesCount={totalFeaturesCount}
            activePercentage={activePercentage}
            featureCategoryFilter={featureCategoryFilter}
            setFeatureCategoryFilter={setFeatureCategoryFilter}
            searchQuery={searchQuery}
            toggleFeature={toggleFeature}
            handleApplyPreset={handleApplyPreset}
            setIsImporterOpen={setIsImporterOpen}
            setIsExporterOpen={setIsExporterOpen}
            setIsBackupOpen={setIsBackupOpen}
            setIsPrintPreviewOpen={setIsPrintPreviewOpen}
            setIsWebhookTesterOpen={setIsWebhookTesterOpen}
            setIsNotifTesterOpen={setIsNotifTesterOpen}
            setIsMobileConnectOpen={setIsMobileConnectOpen}
            setIsFactoryResetOpen={setIsFactoryResetOpen}
            setIsAddYearOpen={setIsAddYearOpen}
            setTab={setTab}
            />
          )}

          {tab === "print" && (
            <PrintTab
            settings={systemSettings}
            update={updateSettings}
            currency={currency}
            setCurrency={setCurrency}
            allAcademicYears={allAcademicYears}
            onSelectYear={handleSelectAcademicYear}
            onAddYear={() => setIsAddYearOpen(true)}
            onLogoUpload={handleLogoUpload}
            onStampUpload={handleStampUpload}
            onPrintPreview={() => setIsPrintPreviewOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onImporter={() => setIsImporterOpen(true)}
            onExporter={() => setIsExporterOpen(true)}
            onWebhookTester={() => setIsWebhookTesterOpen(true)}
            onOpenTester={() => setIsNotifTesterOpen(true)}
            onMobileConnect={() => setIsMobileConnectOpen(true)}
            filteredFeaturesList={filteredFeaturesList}
            activeFeaturesCount={activeFeaturesCount}
            totalFeaturesCount={totalFeaturesCount}
            activePercentage={activePercentage}
            featureCategoryFilter={featureCategoryFilter}
            setFeatureCategoryFilter={setFeatureCategoryFilter}
            searchQuery={searchQuery}
            toggleFeature={toggleFeature}
            handleApplyPreset={handleApplyPreset}
            setIsImporterOpen={setIsImporterOpen}
            setIsExporterOpen={setIsExporterOpen}
            setIsBackupOpen={setIsBackupOpen}
            setIsPrintPreviewOpen={setIsPrintPreviewOpen}
            setIsWebhookTesterOpen={setIsWebhookTesterOpen}
            setIsNotifTesterOpen={setIsNotifTesterOpen}
            setIsMobileConnectOpen={setIsMobileConnectOpen}
            setIsFactoryResetOpen={setIsFactoryResetOpen}
            setIsAddYearOpen={setIsAddYearOpen}
            setTab={setTab}
            />
          )}

          {tab === "notif" && (
            <NotifTab
            settings={systemSettings}
            update={updateSettings}
            currency={currency}
            setCurrency={setCurrency}
            allAcademicYears={allAcademicYears}
            onSelectYear={handleSelectAcademicYear}
            onAddYear={() => setIsAddYearOpen(true)}
            onLogoUpload={handleLogoUpload}
            onStampUpload={handleStampUpload}
            onPrintPreview={() => setIsPrintPreviewOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onImporter={() => setIsImporterOpen(true)}
            onExporter={() => setIsExporterOpen(true)}
            onWebhookTester={() => setIsWebhookTesterOpen(true)}
            onOpenTester={() => setIsNotifTesterOpen(true)}
            onMobileConnect={() => setIsMobileConnectOpen(true)}
            filteredFeaturesList={filteredFeaturesList}
            activeFeaturesCount={activeFeaturesCount}
            totalFeaturesCount={totalFeaturesCount}
            activePercentage={activePercentage}
            featureCategoryFilter={featureCategoryFilter}
            setFeatureCategoryFilter={setFeatureCategoryFilter}
            searchQuery={searchQuery}
            toggleFeature={toggleFeature}
            handleApplyPreset={handleApplyPreset}
            setIsImporterOpen={setIsImporterOpen}
            setIsExporterOpen={setIsExporterOpen}
            setIsBackupOpen={setIsBackupOpen}
            setIsPrintPreviewOpen={setIsPrintPreviewOpen}
            setIsWebhookTesterOpen={setIsWebhookTesterOpen}
            setIsNotifTesterOpen={setIsNotifTesterOpen}
            setIsMobileConnectOpen={setIsMobileConnectOpen}
            setIsFactoryResetOpen={setIsFactoryResetOpen}
            setIsAddYearOpen={setIsAddYearOpen}
            setTab={setTab}
            />
          )}

          {tab === "roles" && (
            <RolesTab
            settings={systemSettings}
            update={updateSettings}
            currency={currency}
            setCurrency={setCurrency}
            allAcademicYears={allAcademicYears}
            onSelectYear={handleSelectAcademicYear}
            onAddYear={() => setIsAddYearOpen(true)}
            onLogoUpload={handleLogoUpload}
            onStampUpload={handleStampUpload}
            onPrintPreview={() => setIsPrintPreviewOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onImporter={() => setIsImporterOpen(true)}
            onExporter={() => setIsExporterOpen(true)}
            onWebhookTester={() => setIsWebhookTesterOpen(true)}
            onOpenTester={() => setIsNotifTesterOpen(true)}
            onMobileConnect={() => setIsMobileConnectOpen(true)}
            filteredFeaturesList={filteredFeaturesList}
            activeFeaturesCount={activeFeaturesCount}
            totalFeaturesCount={totalFeaturesCount}
            activePercentage={activePercentage}
            featureCategoryFilter={featureCategoryFilter}
            setFeatureCategoryFilter={setFeatureCategoryFilter}
            searchQuery={searchQuery}
            toggleFeature={toggleFeature}
            handleApplyPreset={handleApplyPreset}
            setIsImporterOpen={setIsImporterOpen}
            setIsExporterOpen={setIsExporterOpen}
            setIsBackupOpen={setIsBackupOpen}
            setIsPrintPreviewOpen={setIsPrintPreviewOpen}
            setIsWebhookTesterOpen={setIsWebhookTesterOpen}
            setIsNotifTesterOpen={setIsNotifTesterOpen}
            setIsMobileConnectOpen={setIsMobileConnectOpen}
            setIsFactoryResetOpen={setIsFactoryResetOpen}
            setIsAddYearOpen={setIsAddYearOpen}
            setTab={setTab}
            />
          )}

          {tab === "backup" && (
            <BackupTab
            settings={systemSettings}
            update={updateSettings}
            currency={currency}
            setCurrency={setCurrency}
            allAcademicYears={allAcademicYears}
            onSelectYear={handleSelectAcademicYear}
            onAddYear={() => setIsAddYearOpen(true)}
            onLogoUpload={handleLogoUpload}
            onStampUpload={handleStampUpload}
            onPrintPreview={() => setIsPrintPreviewOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onImporter={() => setIsImporterOpen(true)}
            onExporter={() => setIsExporterOpen(true)}
            onWebhookTester={() => setIsWebhookTesterOpen(true)}
            onOpenTester={() => setIsNotifTesterOpen(true)}
            onMobileConnect={() => setIsMobileConnectOpen(true)}
            filteredFeaturesList={filteredFeaturesList}
            activeFeaturesCount={activeFeaturesCount}
            totalFeaturesCount={totalFeaturesCount}
            activePercentage={activePercentage}
            featureCategoryFilter={featureCategoryFilter}
            setFeatureCategoryFilter={setFeatureCategoryFilter}
            searchQuery={searchQuery}
            toggleFeature={toggleFeature}
            handleApplyPreset={handleApplyPreset}
            setIsImporterOpen={setIsImporterOpen}
            setIsExporterOpen={setIsExporterOpen}
            setIsBackupOpen={setIsBackupOpen}
            setIsPrintPreviewOpen={setIsPrintPreviewOpen}
            setIsWebhookTesterOpen={setIsWebhookTesterOpen}
            setIsNotifTesterOpen={setIsNotifTesterOpen}
            setIsMobileConnectOpen={setIsMobileConnectOpen}
            setIsFactoryResetOpen={setIsFactoryResetOpen}
            setIsAddYearOpen={setIsAddYearOpen}
            setTab={setTab}
            />
          )}

          {tab === "integrations" && (
            <IntegrationsTab
            settings={systemSettings}
            update={updateSettings}
            currency={currency}
            setCurrency={setCurrency}
            allAcademicYears={allAcademicYears}
            onSelectYear={handleSelectAcademicYear}
            onAddYear={() => setIsAddYearOpen(true)}
            onLogoUpload={handleLogoUpload}
            onStampUpload={handleStampUpload}
            onPrintPreview={() => setIsPrintPreviewOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onImporter={() => setIsImporterOpen(true)}
            onExporter={() => setIsExporterOpen(true)}
            onWebhookTester={() => setIsWebhookTesterOpen(true)}
            onOpenTester={() => setIsNotifTesterOpen(true)}
            onMobileConnect={() => setIsMobileConnectOpen(true)}
            filteredFeaturesList={filteredFeaturesList}
            activeFeaturesCount={activeFeaturesCount}
            totalFeaturesCount={totalFeaturesCount}
            activePercentage={activePercentage}
            featureCategoryFilter={featureCategoryFilter}
            setFeatureCategoryFilter={setFeatureCategoryFilter}
            searchQuery={searchQuery}
            toggleFeature={toggleFeature}
            handleApplyPreset={handleApplyPreset}
            setIsImporterOpen={setIsImporterOpen}
            setIsExporterOpen={setIsExporterOpen}
            setIsBackupOpen={setIsBackupOpen}
            setIsPrintPreviewOpen={setIsPrintPreviewOpen}
            setIsWebhookTesterOpen={setIsWebhookTesterOpen}
            setIsNotifTesterOpen={setIsNotifTesterOpen}
            setIsMobileConnectOpen={setIsMobileConnectOpen}
            setIsFactoryResetOpen={setIsFactoryResetOpen}
            setIsAddYearOpen={setIsAddYearOpen}
            setTab={setTab}
            />
          )}

          {tab === "mobile" && (
            <MobileTab
            settings={systemSettings}
            update={updateSettings}
            currency={currency}
            setCurrency={setCurrency}
            allAcademicYears={allAcademicYears}
            onSelectYear={handleSelectAcademicYear}
            onAddYear={() => setIsAddYearOpen(true)}
            onLogoUpload={handleLogoUpload}
            onStampUpload={handleStampUpload}
            onPrintPreview={() => setIsPrintPreviewOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onImporter={() => setIsImporterOpen(true)}
            onExporter={() => setIsExporterOpen(true)}
            onWebhookTester={() => setIsWebhookTesterOpen(true)}
            onOpenTester={() => setIsNotifTesterOpen(true)}
            onMobileConnect={() => setIsMobileConnectOpen(true)}
            filteredFeaturesList={filteredFeaturesList}
            activeFeaturesCount={activeFeaturesCount}
            totalFeaturesCount={totalFeaturesCount}
            activePercentage={activePercentage}
            featureCategoryFilter={featureCategoryFilter}
            setFeatureCategoryFilter={setFeatureCategoryFilter}
            searchQuery={searchQuery}
            toggleFeature={toggleFeature}
            handleApplyPreset={handleApplyPreset}
            setIsImporterOpen={setIsImporterOpen}
            setIsExporterOpen={setIsExporterOpen}
            setIsBackupOpen={setIsBackupOpen}
            setIsPrintPreviewOpen={setIsPrintPreviewOpen}
            setIsWebhookTesterOpen={setIsWebhookTesterOpen}
            setIsNotifTesterOpen={setIsNotifTesterOpen}
            setIsMobileConnectOpen={setIsMobileConnectOpen}
            setIsFactoryResetOpen={setIsFactoryResetOpen}
            setIsAddYearOpen={setIsAddYearOpen}
            setTab={setTab}
            />
          )}

          {tab === "api" && (
            <APITab
            settings={systemSettings}
            update={updateSettings}
            currency={currency}
            setCurrency={setCurrency}
            allAcademicYears={allAcademicYears}
            onSelectYear={handleSelectAcademicYear}
            onAddYear={() => setIsAddYearOpen(true)}
            onLogoUpload={handleLogoUpload}
            onStampUpload={handleStampUpload}
            onPrintPreview={() => setIsPrintPreviewOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onImporter={() => setIsImporterOpen(true)}
            onExporter={() => setIsExporterOpen(true)}
            onWebhookTester={() => setIsWebhookTesterOpen(true)}
            onOpenTester={() => setIsNotifTesterOpen(true)}
            onMobileConnect={() => setIsMobileConnectOpen(true)}
            filteredFeaturesList={filteredFeaturesList}
            activeFeaturesCount={activeFeaturesCount}
            totalFeaturesCount={totalFeaturesCount}
            activePercentage={activePercentage}
            featureCategoryFilter={featureCategoryFilter}
            setFeatureCategoryFilter={setFeatureCategoryFilter}
            searchQuery={searchQuery}
            toggleFeature={toggleFeature}
            handleApplyPreset={handleApplyPreset}
            setIsImporterOpen={setIsImporterOpen}
            setIsExporterOpen={setIsExporterOpen}
            setIsBackupOpen={setIsBackupOpen}
            setIsPrintPreviewOpen={setIsPrintPreviewOpen}
            setIsWebhookTesterOpen={setIsWebhookTesterOpen}
            setIsNotifTesterOpen={setIsNotifTesterOpen}
            setIsMobileConnectOpen={setIsMobileConnectOpen}
            setIsFactoryResetOpen={setIsFactoryResetOpen}
            setIsAddYearOpen={setIsAddYearOpen}
            setTab={setTab}
            />
          )}

          {tab === "security" && (
            <SecurityTab
            settings={systemSettings}
            update={updateSettings}
            currency={currency}
            setCurrency={setCurrency}
            allAcademicYears={allAcademicYears}
            onSelectYear={handleSelectAcademicYear}
            onAddYear={() => setIsAddYearOpen(true)}
            onLogoUpload={handleLogoUpload}
            onStampUpload={handleStampUpload}
            onPrintPreview={() => setIsPrintPreviewOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onImporter={() => setIsImporterOpen(true)}
            onExporter={() => setIsExporterOpen(true)}
            onWebhookTester={() => setIsWebhookTesterOpen(true)}
            onOpenTester={() => setIsNotifTesterOpen(true)}
            onMobileConnect={() => setIsMobileConnectOpen(true)}
            filteredFeaturesList={filteredFeaturesList}
            activeFeaturesCount={activeFeaturesCount}
            totalFeaturesCount={totalFeaturesCount}
            activePercentage={activePercentage}
            featureCategoryFilter={featureCategoryFilter}
            setFeatureCategoryFilter={setFeatureCategoryFilter}
            searchQuery={searchQuery}
            toggleFeature={toggleFeature}
            handleApplyPreset={handleApplyPreset}
            setIsImporterOpen={setIsImporterOpen}
            setIsExporterOpen={setIsExporterOpen}
            setIsBackupOpen={setIsBackupOpen}
            setIsPrintPreviewOpen={setIsPrintPreviewOpen}
            setIsWebhookTesterOpen={setIsWebhookTesterOpen}
            setIsNotifTesterOpen={setIsNotifTesterOpen}
            setIsMobileConnectOpen={setIsMobileConnectOpen}
            setIsFactoryResetOpen={setIsFactoryResetOpen}
            setIsAddYearOpen={setIsAddYearOpen}
            setTab={setTab}
            />
          )}

          {tab === "data_io" && (
            <DataIOTab
            settings={systemSettings}
            update={updateSettings}
            currency={currency}
            setCurrency={setCurrency}
            allAcademicYears={allAcademicYears}
            onSelectYear={handleSelectAcademicYear}
            onAddYear={() => setIsAddYearOpen(true)}
            onLogoUpload={handleLogoUpload}
            onStampUpload={handleStampUpload}
            onPrintPreview={() => setIsPrintPreviewOpen(true)}
            onOpenBackup={() => setIsBackupOpen(true)}
            onImporter={() => setIsImporterOpen(true)}
            onExporter={() => setIsExporterOpen(true)}
            onWebhookTester={() => setIsWebhookTesterOpen(true)}
            onOpenTester={() => setIsNotifTesterOpen(true)}
            onMobileConnect={() => setIsMobileConnectOpen(true)}
            filteredFeaturesList={filteredFeaturesList}
            activeFeaturesCount={activeFeaturesCount}
            totalFeaturesCount={totalFeaturesCount}
            activePercentage={activePercentage}
            featureCategoryFilter={featureCategoryFilter}
            setFeatureCategoryFilter={setFeatureCategoryFilter}
            searchQuery={searchQuery}
            toggleFeature={toggleFeature}
            handleApplyPreset={handleApplyPreset}
            setIsImporterOpen={setIsImporterOpen}
            setIsExporterOpen={setIsExporterOpen}
            setIsBackupOpen={setIsBackupOpen}
            setIsPrintPreviewOpen={setIsPrintPreviewOpen}
            setIsWebhookTesterOpen={setIsWebhookTesterOpen}
            setIsNotifTesterOpen={setIsNotifTesterOpen}
            setIsMobileConnectOpen={setIsMobileConnectOpen}
            setIsFactoryResetOpen={setIsFactoryResetOpen}
            setIsAddYearOpen={setIsAddYearOpen}
            setTab={setTab}
            />
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
      {/* Integrated Modal Windows Suite (╪º┘ä┘å┘ê╪º┘ü╪░ ╪º┘ä┘à╪╡╪║╪▒╪⌐ ╪º┘ä┘à╪¬┘â╪º┘à┘ä╪⌐) */}
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
          toast.success("╪¬┘à╪¬ ╪º╪│╪¬╪╣╪º╪»╪⌐ ┘â╪º┘ü╪⌐ ╪Ñ╪╣╪»╪º╪»╪º╪¬ ╪º┘ä┘å╪╕╪º┘à ╪Ñ┘ä┘ë ╪╢╪¿╪╖ ╪º┘ä┘à╪╡┘å╪╣ ╪¿┘å╪¼╪º╪¡");
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

