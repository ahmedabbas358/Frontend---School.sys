import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Database,
  Smartphone,
  Copy,
  Check,
  Send,
  RefreshCcw,
  Sparkles,
  QrCode,
  Printer,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  MessageSquare,
  Mail,
  Share2,
  Lock,
  Search,
  Eye,
  X,
  Building,
  CreditCard,
  UserCheck,
  Clock,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  Info,
  Edit2,
  Save,
  CheckSquare,
  Square,
  FileSpreadsheet,
  Globe,
  Radio,
  Sliders,
  CheckCheck
} from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import {
  useGlobalStore,
  Invoice,
  EducationalStage,
  SystemSettings,
  defaultSettings,
  defaultFeatures,
} from "@/contexts/GlobalStoreContext";

// =========================================================================
// CSV Parsing & Formatting Utilities
// =========================================================================
function parseCsvText(text: string): { headers: string[]; rows: string[][] } {
  const clean = text.replace(/^\uFEFF/, "").trim();
  if (!clean) return { headers: [], rows: [] };

  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === "," || char === "\t" || char === ";") && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// Stage normalization helper for robust Arabic and English mapping
export function normalizeStageValue(val: string): EducationalStage {
  const v = (val || "").trim().toLowerCase();
  if (v.includes("تمهيدي") || v.includes("روضة") || v.includes("kindergarten") || v.includes("kg")) return "kindergarten";
  if (v.includes("متوسط") || v.includes("middle")) return "middle";
  if (v.includes("ثانوي") || v.includes("high")) return "high";
  return "primary";
}

export function getStageArabicTitle(stage: EducationalStage): string {
  switch (stage) {
    case "kindergarten": return "رياض الأطفال";
    case "primary": return "المرحلة الابتدائية";
    case "middle": return "المرحلة المتوسطة";
    case "high": return "المرحلة الثانوية";
    default: return "المرحلة الابتدائية";
  }
}

// =========================================================================
// 1. Smart Data Importer Modal (مستورد بيانات نور وإكسل الذكي)
// =========================================================================
export interface SmartImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEntityType?: "students" | "staff" | "guardians";
}

interface ParsedRecord {
  id: string;
  col1: string; // Name
  col2: string; // National ID / Employee No
  col3: string; // Stage / Department / Relation
  col4: string; // Grade / Role / Job
  col5: string; // Phone
  status: "valid" | "warning" | "duplicate";
  statusNote: string;
}

export function SmartImporterModal({ isOpen, onClose, initialEntityType = "students" }: SmartImporterModalProps) {
  const { addStudent, addStaff, addGuardian, addActivityLog, allStudents, allStaff } = useGlobalStore();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [entityType, setEntityType] = useState<"students" | "staff" | "guardians">(initialEntityType);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "valid" | "duplicate" | "warning">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importedSummary, setImportedSummary] = useState({ total: 0, skipped: 0, time: "" });

  useEffect(() => {
    if (initialEntityType) setEntityType(initialEntityType);
  }, [initialEntityType, isOpen]);

  const [records, setRecords] = useState<ParsedRecord[]>([
    { id: "1", col1: "زياد خالد الدوسري", col2: "1109845231", col3: "primary", col4: "الصف الرابع الابتدائي", col5: "0501122334", status: "valid", statusNote: "سجل متكامل" },
    { id: "2", col1: "مريم أحمد الغامدي", col2: "1108765432", col3: "middle", col4: "الصف الأول المتوسط", col5: "0559988776", status: "valid", statusNote: "سجل متكامل" },
    { id: "3", col1: "سلطان فيصل العتيبي", col2: "1107654321", col3: "high", col4: "الصف الثاني الثانوي", col5: "0564433221", status: "valid", statusNote: "سجل متكامل" },
    { id: "4", col1: "نورة سعود الشمري", col2: "1106543210", col3: "primary", col4: "الصف الثاني الابتدائي", col5: "0543322119", status: "valid", statusNote: "سجل متكامل" },
    { id: "5", col1: "عبدالرحمن علي الحربي", col2: "1105432109", col3: "kindergarten", col4: "التمهيدي الثاني (KG2)", col5: "0598877665", status: "valid", statusNote: "سجل متكامل" },
  ]);

  const handleDownloadSample = () => {
    let headers = "الاسم_الكامل,رقم_الهوية_الوطنية,المرحلة_الدراسية,الصف_الدراسي,رقم_جوال_ولي_الأمر";
    let rows = "عبدالله محمد السعيد,1102233445,ابتدائي,الصف الأول الابتدائي,0501234567\nسارة خالد العتيبي,1103344556,متوسط,الصف الثاني المتوسط,0559876543\nفيصل ناصر الدوسري,1104455667,ثانوي,الصف الأول الثانوي,0508899776\nنواف أحمد القرني,1105566778,روضة,التمهيدي الثاني (KG2),0543322110";
    if (entityType === "staff") {
      headers = "اسم_الموظف,الرقم_الوظيفي,المرحلة_الدراسية,المسمى_الوظيفي,رقم_الجوال";
      rows = "فهد ناصر الدوسري,EMP-501,ثانوي,معلم كيمياء,0501112233\nهند عبدالعزيز الصالح,EMP-502,ابتدائي,معلمة لغة عربية,0554433221\nسعد إبراهيم المري,EMP-503,متوسط,مشرف طلابي,0509988776";
    } else if (entityType === "guardians") {
      headers = "اسم_ولي_الأمر,رقم_الهوية,صلة_القرابة,المهنة,رقم_الجوال";
      rows = "محمد ناصر القحطاني,1099887766,أب,مهندس,0505544332\nفاطمة خالد العتيبي,1088776655,أم,طبيبة,0506677889\nسلطان فهد الرويلي,1077665544,ولي أمر,موظف حكومي,0544332211";
    }

    const blob = new Blob(["\uFEFF" + headers + "\n" + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `darasi_template_${entityType}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("تم تنزيل قالب الاستيراد المعتمد بترميز UTF-8");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const content = evt.target?.result as string;
          const { rows } = parseCsvText(content);
          if (rows.length === 0) {
            toast.error("الملف فارغ أو لا يحتوي على صفوف بيانات صالحة");
            return;
          }

          const existingStudentIds = new Set(allStudents.map((s) => s.nationalId));
          const existingStaffNos = new Set(allStaff.map((st) => st.employeeNo));

          const parsed: ParsedRecord[] = rows.map((r, i) => {
            const col1 = r[0]?.trim() || `سجل رقم ${i + 1}`;
            const col2 = r[1]?.trim() || `110${1000000 + i}`;
            const col3 = r[2]?.trim() || (entityType === "students" ? "primary" : "عام");
            const col4 = r[3]?.trim() || (entityType === "students" ? "الصف الأول الابتدائي" : "معلم");
            const col5 = r[4]?.trim() || "0500000000";

            let isDuplicate = false;
            if (entityType === "students" && existingStudentIds.has(col2)) isDuplicate = true;
            if (entityType === "staff" && existingStaffNos.has(col2)) isDuplicate = true;

            const isMissingData = !col1 || !col2;

            return {
              id: `row-${i}-${Date.now()}`,
              col1,
              col2,
              col3,
              col4,
              col5,
              status: isDuplicate ? "duplicate" : isMissingData ? "warning" : "valid",
              statusNote: isDuplicate ? "رقم هوية مسجل مسبقاً" : isMissingData ? "بيانات ناقصة" : "جاهز للاستيراد",
            };
          });

          setRecords(parsed);
          toast.success(`تمت قراءة وفحص ${parsed.length} سجل بنجاح من الملف`);
          setStep(3);
        } catch {
          toast.error("خطأ في قراءة ملف CSV أو Excel");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLoadDemo = () => {
    setFileName("demo_noor_import_2026.csv");
    if (entityType === "students") {
      setRecords([
        { id: "1", col1: "تركي فهد الراجحي", col2: "1122334455", col3: "primary", col4: "الصف الأول الابتدائي", col5: "0501122334", status: "valid", statusNote: "مطابق لمعايير نور" },
        { id: "2", col1: "ريما سلطان القحطاني", col2: "1133445566", col3: "middle", col4: "الصف الأول المتوسط", col5: "0559988776", status: "valid", statusNote: "مطابق لمعايير نور" },
        { id: "3", col1: "عمر فيصل السبيعي", col2: "1144556677", col3: "high", col4: "الصف الثالث الثانوي", col5: "0564433221", status: "valid", statusNote: "مطابق لمعايير نور" },
        { id: "4", col1: "شهد نايف الحربي", col2: "1155667788", col3: "primary", col4: "الصف الخامس الابتدائي", col5: "0543322119", status: "valid", statusNote: "مطابق لمعايير نور" },
        { id: "5", col1: "وليد خالد المطيري", col2: "1166778899", col3: "kindergarten", col4: "التمهيدي الثاني (KG2)", col5: "0598877665", status: "valid", statusNote: "مطابق لمعايير نور" },
        { id: "6", col1: "خالد سعيد الغامدي", col2: allStudents[0]?.nationalId || "1109845231", col3: "middle", col4: "الصف الثاني المتوسط", col5: "0501234567", status: "duplicate", statusNote: "رقم هوية مكرر في النظام" },
      ]);
    } else if (entityType === "staff") {
      setRecords([
        { id: "1", col1: "د. سامي فهد العمران", col2: "EMP-901", col3: "high", col4: "معلم فيزياء", col5: "0501112233", status: "valid", statusNote: "مكتمل" },
        { id: "2", col1: "أ. منيرة خالد السعيد", col2: "EMP-902", col3: "primary", col4: "معلمة لغة إنجليزية", col5: "0559881122", status: "valid", statusNote: "مكتمل" },
        { id: "3", col1: "أ. طارق عبدالمحسن الفهد", col2: "EMP-903", col3: "middle", col4: "معلم رياضيات", col5: "0544332211", status: "valid", statusNote: "مكتمل" },
      ]);
    } else {
      setRecords([
        { id: "1", col1: "خالد بن عبدالعزيز الشريف", col2: "1055443322", col3: "أب", col4: "مدير مشاريع", col5: "0509988776", status: "valid", statusNote: "مكتمل" },
        { id: "2", col1: "نادية محمد العمري", col2: "1066554433", col3: "أم", col4: "أستاذة جامعية", col5: "0543322110", status: "valid", statusNote: "مكتمل" },
      ]);
    }
    toast.info("تم تحميل حزمة بيانات نموذجية ذكية مطابقة لمنصة نور");
    setStep(3);
  };

  const handleUpdateRecord = (id: string, updates: Partial<ParsedRecord>) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const next = { ...r, ...updates };
          return {
            ...next,
            status: !next.col1 || !next.col2 ? "warning" : "valid",
            statusNote: !next.col1 || !next.col2 ? "بيانات ناقصة" : "تم تعديل السجل ومطابقته",
          };
        }
        return r;
      })
    );
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    toast.info("تم حذف السجل من قائمة الاستيراد");
  };

  const executeImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      let importedCount = 0;
      let skippedCount = 0;
      const targetRecords = records.filter((r) => {
        if (skipDuplicates && r.status === "duplicate") {
          skippedCount++;
          return false;
        }
        return true;
      });

      if (entityType === "students") {
        targetRecords.forEach((r) => {
          const stageVal = normalizeStageValue(r.col3);
          addStudent({
            name: r.col1,
            nationalId: r.col2,
            dob: "2015-06-15",
            stage: stageVal,
            grade: r.col4 || "الصف الأول الابتدائي",
            guardianName: `ولي أمر ${r.col1}`,
            guardianPhone: r.col5,
            status: "نشط",
            enrollmentDate: new Date().toISOString().split("T")[0],
          });
          importedCount++;
        });
      } else if (entityType === "staff") {
        targetRecords.forEach((r, idx) => {
          const stageVal = normalizeStageValue(r.col3);
          addStaff({
            name: r.col1,
            employeeNo: r.col2 || `EMP-IMP-${100 + idx}`,
            role: r.col4 || "معلم صف",
            department: "الشؤون التعليمية",
            stage: stageVal,
            basicSalary: 8000,
            allowance: 1200,
            deduction: 0,
            paymentType: "Monthly",
            phone: r.col5,
            status: "active",
            hireDate: new Date().toISOString().split("T")[0],
          });
          importedCount++;
        });
      } else {
        targetRecords.forEach((r) => {
          addGuardian({
            name: r.col1,
            nationalId: r.col2,
            phone: r.col5,
            relation: (r.col3 as any) || "أب",
            job: r.col4 || "موظف",
          });
          importedCount++;
        });
      }

      addActivityLog({
        user: "مدير النظام المركزي",
        action: "استيراد بيانات ذكي",
        entity: entityType === "students" ? "الطلاب" : entityType === "staff" ? "الموظفون" : "أولياء الأمور",
        details: `تم استيراد ${importedCount} سجل بنجاح من ملف: ${fileName || "بيانات نور"}`,
      });

      setImportedSummary({
        total: importedCount,
        skipped: skippedCount,
        time: new Date().toLocaleTimeString("ar-SA"),
      });

      setIsProcessing(false);
      setStep(4);
      toast.success(`تم استيراد واعتماد ${importedCount} سجل بنجاح في قاعدة البيانات`);
    }, 700);
  };

  const reset = () => {
    setStep(1);
    setFileName(null);
    setSearchFilter("");
    setStatusFilter("all");
    setEditingId(null);
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase().trim();
      return (
        r.col1.toLowerCase().includes(q) ||
        r.col2.toLowerCase().includes(q) ||
        r.col4.toLowerCase().includes(q) ||
        r.col5.includes(q)
      );
    });
  }, [records, searchFilter, statusFilter]);

  const validCount = records.filter((r) => r.status === "valid").length;
  const duplicateCount = records.filter((r) => r.status === "duplicate").length;
  const warningCount = records.filter((r) => r.status === "warning").length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { reset(); onClose(); } }}>
      <DialogContent hideCloseButton={true} className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border/80 shadow-2xl bg-card">
        {/* Modal Header */}
        <DialogHeader className="p-5 pb-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground">
                  المستورد الذكي ومطابقة بيانات نظام "نور"
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-bold">
                  استيراد وفحص دفعات الطلاب، الكادر، وأولياء الأمور مع الفحص التلقائي للهويات ومنع التكرار
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={() => { reset(); onClose(); }}
              className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stepper Bar */}
          <div className="flex items-center justify-between border-t border-border/60 pt-3.5 mt-3 text-xs font-bold">
            {[
              { n: 1, label: "نوع البيانات" },
              { n: 2, label: "رفع الملف" },
              { n: 3, label: "المطابقة والتعديل" },
              { n: 4, label: "الاعتماد والحفظ" },
            ].map((st, i, arr) => (
              <React.Fragment key={st.n}>
                <div className={`flex items-center gap-2 ${step >= st.n ? "text-primary font-black" : "text-muted-foreground"}`}>
                  <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step > st.n ? "bg-emerald-500 text-white" : step === st.n ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"
                  }`}>
                    {step > st.n ? <Check className="h-3.5 w-3.5" /> : st.n}
                  </span>
                  <span className="hidden sm:inline">{st.label}</span>
                </div>
                {i < arr.length - 1 && <div className={`h-0.5 flex-1 mx-3 rounded-full ${step > i + 1 ? "bg-primary" : "bg-border"}`} />}
              </React.Fragment>
            ))}
          </div>
        </DialogHeader>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Step 1: Select Entity */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-xs font-black text-foreground">اختر نوع السجلات المطلوب استيرادها للمنظومة:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "students", title: "بيانات الطلاب", desc: "القيد، الصفوف، الهويات، وأولياء الأمور", icon: Database, badge: `${allStudents.length} حالياً` },
                  { id: "staff", title: "الكادر الوظيفي والتعليمي", desc: "المعلمون، الأقسام، والمسميات الوظيفية", icon: Layers, badge: `${allStaff.length} حالياً` },
                  { id: "guardians", title: "أولياء الأمور", desc: "أرقام الهواتف، الهويات، وصلة القرابة", icon: Share2, badge: "سجلات الآباء" },
                ].map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => setEntityType(it.id as any)}
                    className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between gap-3 ${
                      entityType === it.id
                        ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20 scale-[1.01]"
                        : "border-border hover:border-primary/40 bg-card/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <it.icon className={`h-6 w-6 ${entityType === it.id ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {it.badge}
                      </span>
                    </div>
                    <div>
                      <div className="font-black text-sm text-foreground">{it.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{it.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5 text-right w-full sm:w-auto">
                  <span className="font-black text-foreground block">تحميل قالب الإكسل المعتمد (Template):</span>
                  <span className="text-muted-foreground text-[11px]">قالب جاهز يحتوي الترويسات الصحيحة والمتوافقة مع نظام نور</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90 transition-all shadow-xs"
                >
                  <Download className="h-4 w-4" /> تحميل نموذج CSV معتمد
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Upload File or Demo */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-primary/40 bg-primary/5 rounded-3xl p-8 text-center hover:bg-primary/10 transition-colors relative cursor-pointer group">
                <input
                  type="file"
                  accept=".csv, .txt, .tsv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="h-8 w-8" />
                </div>
                <div className="font-black text-base text-foreground">انقر لاختيار ملف البيانات أو اسحبه هنا</div>
                <div className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  يدعم ملفات CSV أو Excel المصدرة بنسق مجدول بترميز UTF-8 مع الترويسات المعتمدة
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground font-bold">أو للتجربة الفورية السريعة</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                type="button"
                onClick={handleLoadDemo}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-primary/30 bg-card hover:bg-accent text-primary text-xs font-black transition-all shadow-xs"
              >
                <Sparkles className="h-4 w-4" /> تحميل دفعة تجريبية فورية مطابقة لمنصة نور (6 سجلات مع فحص التكرار)
              </button>
            </div>
          )}

          {/* Step 3: Match, Inspect & Inline Edit */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`p-3 rounded-2xl border text-right transition-all ${
                    statusFilter === "all" ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border bg-card"
                  }`}
                >
                  <span className="text-[11px] font-bold text-muted-foreground block">إجمالي المفحوصة</span>
                  <span className="text-lg font-black font-mono text-foreground">{records.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("valid")}
                  className={`p-3 rounded-2xl border text-right transition-all ${
                    statusFilter === "valid" ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20" : "border-emerald-500/20 bg-emerald-500/5"
                  }`}
                >
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">صالحة للاستيراد</span>
                  <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">{validCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("duplicate")}
                  className={`p-3 rounded-2xl border text-right transition-all ${
                    statusFilter === "duplicate" ? "border-danger bg-danger/10 ring-2 ring-danger/20" : "border-danger/20 bg-danger/5"
                  }`}
                >
                  <span className="text-[11px] font-bold text-danger block">سجلات مكررة</span>
                  <span className="text-lg font-black font-mono text-danger">{duplicateCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("warning")}
                  className={`p-3 rounded-2xl border text-right transition-all ${
                    statusFilter === "warning" ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20" : "border-amber-500/20 bg-amber-500/5"
                  }`}
                >
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block">بيانات ناقصة</span>
                  <span className="text-lg font-black font-mono text-amber-600 dark:text-amber-400">{warningCount}</span>
                </button>
              </div>

              {/* Controls: Search + Duplicate Policy */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="بحث في السجلات بالاسم أو رقم الهوية أو الصف..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="h-9 w-full rounded-xl border border-border bg-background pr-9 pl-3 text-xs font-bold outline-none focus:border-primary"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-muted-foreground hover:text-foreground shrink-0 bg-muted/40 px-3 py-2 rounded-xl border border-border">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => setSkipDuplicates(e.target.checked)}
                    className="rounded text-primary h-4 w-4"
                  />
                  <span>تخطي السجلات المكررة آلياً</span>
                </label>
              </div>

              {/* Editable Preview Table */}
              <div className="border border-border rounded-2xl overflow-hidden shadow-xs">
                <div className="max-h-72 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-muted/80 font-black border-b border-border sticky top-0 backdrop-blur-md">
                      <tr>
                        <th className="p-3">الاسم الكامل</th>
                        <th className="p-3">رقم الهوية / الوظيفي</th>
                        <th className="p-3">
                          {entityType === "students" ? "المرحلة / الصف" : entityType === "staff" ? "المسمى / القسم" : "الصلة / المهنة"}
                        </th>
                        <th className="p-3">الهاتف</th>
                        <th className="p-3 text-center">الحالة</th>
                        <th className="p-3 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {filteredRecords.map((r) => {
                        const isEdit = editingId === r.id;
                        return (
                          <tr key={r.id} className="hover:bg-accent/40 transition-colors">
                            <td className="p-2.5 font-bold text-foreground">
                              {isEdit ? (
                                <input
                                  type="text"
                                  value={r.col1}
                                  onChange={(e) => handleUpdateRecord(r.id, { col1: e.target.value })}
                                  className="h-7 w-full rounded-lg border border-primary px-2 text-xs font-bold bg-background"
                                />
                              ) : (
                                r.col1
                              )}
                            </td>
                            <td className="p-2.5 font-mono text-[11px] text-muted-foreground">
                              {isEdit ? (
                                <input
                                  type="text"
                                  value={r.col2}
                                  onChange={(e) => handleUpdateRecord(r.id, { col2: e.target.value })}
                                  className="h-7 w-full rounded-lg border border-primary px-2 text-xs font-mono bg-background"
                                />
                              ) : (
                                r.col2
                              )}
                            </td>
                            <td className="p-2.5 text-foreground">
                              {isEdit ? (
                                <div className="flex gap-1.5">
                                  {entityType === "students" ? (
                                    <select
                                      value={normalizeStageValue(r.col3)}
                                      onChange={(e) => handleUpdateRecord(r.id, { col3: e.target.value })}
                                      className="h-7 rounded-lg border border-primary px-1.5 text-xs bg-background"
                                    >
                                      <option value="kindergarten">رياض أطفال</option>
                                      <option value="primary">ابتدائي</option>
                                      <option value="middle">متوسط</option>
                                      <option value="high">ثانوي</option>
                                    </select>
                                  ) : null}
                                  <input
                                    type="text"
                                    value={r.col4}
                                    onChange={(e) => handleUpdateRecord(r.id, { col4: e.target.value })}
                                    className="h-7 flex-1 rounded-lg border border-primary px-2 text-xs bg-background"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                    {entityType === "students" ? getStageArabicTitle(normalizeStageValue(r.col3)) : r.col3}
                                  </span>
                                  <span>{r.col4}</span>
                                </div>
                              )}
                            </td>
                            <td className="p-2.5 font-mono text-[11px] text-muted-foreground">
                              {isEdit ? (
                                <input
                                  type="text"
                                  value={r.col5}
                                  onChange={(e) => handleUpdateRecord(r.id, { col5: e.target.value })}
                                  className="h-7 w-full rounded-lg border border-primary px-2 text-xs font-mono bg-background"
                                />
                              ) : (
                                r.col5
                              )}
                            </td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  r.status === "valid"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                    : r.status === "duplicate"
                                    ? "bg-danger/10 text-danger border border-danger/20"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                }`}
                              >
                                {r.statusNote}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingId(isEdit ? null : r.id)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isEdit ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                                  }`}
                                  title={isEdit ? "حفظ التعديل" : "تعديل السجل"}
                                >
                                  {isEdit ? <Check className="h-3.5 w-3.5" /> : <Edit2 className="h-3.5 w-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRecord(r.id)}
                                  className="p-1.5 rounded-lg hover:bg-danger/10 text-danger transition-colors"
                                  title="حذف السجل"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredRecords.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-xs text-muted-foreground font-bold">
                            لا توجد سجلات مطابقة لمعايير البحث
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Completion */}
          {step === 4 && (
            <div className="py-8 text-center space-y-5">
              <div className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-500/20 shadow-lg shadow-emerald-500/10 animate-in zoom-in duration-300">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-foreground">اكتمل الاستيراد والتحديث بنجاح!</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed font-bold">
                  تم اعتماد وتثبيت {importedSummary.total} سجل في قاعدة البيانات المركزية، مع تخطي {importedSummary.skipped} سجل مكرر.
                </p>
              </div>

              <div className="max-w-md mx-auto p-4 rounded-2xl bg-muted/40 border border-border text-xs flex justify-around">
                <div>
                  <span className="text-muted-foreground block text-[11px]">السجلات المضافة</span>
                  <span className="font-black font-mono text-emerald-600 text-base">{importedSummary.total}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">السجلات المتخطاة</span>
                  <span className="font-black font-mono text-amber-600 text-base">{importedSummary.skipped}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">وقت الاعتماد</span>
                  <span className="font-black font-mono text-foreground text-base">{importedSummary.time}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between gap-3 w-full">
          {step > 1 && step < 4 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-accent transition-colors"
            >
              السابق
            </button>
          )}

          {step < 3 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="mr-auto inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
            >
              التالي <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={executeImport}
              disabled={isProcessing || (skipDuplicates ? validCount === 0 : records.length === 0)}
              className="mr-auto inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all hover:scale-[1.02]"
            >
              {isProcessing ? (
                <>
                  <RefreshCcw className="h-4 w-4 animate-spin" /> جاري تثبيت السجلات...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> اعتماد واستيراد ({skipDuplicates ? validCount : records.length}) سجل
                </>
              )}
            </button>
          )}

          {step === 4 && (
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={() => { reset(); onClose(); }}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md shadow-primary/20"
              >
                إغلاق النافذة وتحديث الواجهة
              </button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// 2. Full System Data Exporter Modal (مُصدّر البيانات الشامل)
// =========================================================================
export interface SystemExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SystemExporterModal({ isOpen, onClose }: SystemExporterModalProps) {
  const { allStudents, allStaff, allGuardians, allInvoices, allExpenses, allAcademicYears, systemSettings, addActivityLog } = useGlobalStore();
  const [selectedTables, setSelectedTables] = useState<string[]>([
    "students", "guardians", "staff", "invoices", "settings", "features"
  ]);
  const [format, setFormat] = useState<"json" | "csv" | "noor">("json");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);
  const [activePreviewTable, setActivePreviewTable] = useState<string>("students");

  const toggleTable = (id: string) => {
    setSelectedTables((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedTables(["students", "guardians", "staff", "invoices", "expenses", "settings", "features", "academic"]);
  };

  const deselectAll = () => {
    setSelectedTables([]);
  };

  const filteredStudents = useMemo(() => {
    return stageFilter === "all" ? allStudents : allStudents.filter((s) => s.stage === stageFilter);
  }, [allStudents, stageFilter]);

  const filteredStaff = useMemo(() => {
    return stageFilter === "all" ? allStaff : allStaff.filter((st) => st.stage === stageFilter || st.stage === "all");
  }, [allStaff, stageFilter]);

  const filteredInvoices = useMemo(() => {
    return stageFilter === "all" ? allInvoices : allInvoices.filter((inv) => inv.stage === stageFilter);
  }, [allInvoices, stageFilter]);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      let content = "";
      let filename = `darasi_export_${new Date().toISOString().split("T")[0]}`;

      if (format === "json") {
        const payload: Record<string, any> = {
          exportTimestamp: new Date().toISOString(),
          system: "منصة مدارس دارسي المركزية",
          schoolName: systemSettings.schoolName,
          licenseNumber: systemSettings.licenseNumber,
          metadata: {
            totalStudents: filteredStudents.length,
            totalStaff: filteredStaff.length,
            totalInvoices: filteredInvoices.length,
            stageScope: stageFilter,
          },
          tables: {},
        };
        if (selectedTables.includes("students")) payload.tables.students = filteredStudents;
        if (selectedTables.includes("guardians")) payload.tables.guardians = allGuardians;
        if (selectedTables.includes("staff")) payload.tables.staff = filteredStaff;
        if (selectedTables.includes("invoices")) payload.tables.invoices = filteredInvoices;
        if (selectedTables.includes("expenses")) payload.tables.expenses = allExpenses;
        if (selectedTables.includes("settings")) payload.tables.settings = systemSettings;
        if (selectedTables.includes("features")) payload.tables.features = systemSettings.features;
        if (selectedTables.includes("academic")) payload.tables.academicYears = allAcademicYears;

        content = JSON.stringify(payload, null, 2);
        filename += ".json";
      } else if (format === "noor") {
        const noorHeaders = [
          "رقم_الهوية_الوطنية_أو_الإقامة",
          "الاسم_الرباعي_للطالب",
          "المرحلة_الدراسية",
          "الصف_الدراسي",
          "تاريخ_الميلاد",
          "رقم_جوال_ولي_الأمر",
          "حالة_القيد",
        ];
        const lines = [noorHeaders.join(",")];
        filteredStudents.forEach((s) => {
          lines.push(
            [
              escapeCsvField(s.nationalId || ""),
              escapeCsvField(s.name),
              escapeCsvField(getStageArabicTitle(s.stage)),
              escapeCsvField(s.grade || ""),
              escapeCsvField(s.dob || "2015-01-01"),
              escapeCsvField(s.guardianPhone || ""),
              escapeCsvField(s.status || "نشط"),
            ].join(",")
          );
        });
        content = "\uFEFF" + lines.join("\n");
        filename += "_noor_ministry_format.csv";
      } else {
        // Individual/Primary CSV format with proper UTF-8 BOM
        const tableToExport = activePreviewTable || selectedTables[0] || "students";
        filename += `_${tableToExport}.csv`;

        if (tableToExport === "students") {
          const headers = ["المعرف", "الاسم الكامل", "رقم الهوية", "المرحلة", "الصف", "تاريخ القيد", "الحالة", "جوال ولي الأمر"];
          const lines = [headers.join(",")];
          filteredStudents.forEach((s) => {
            lines.push([
              escapeCsvField(s.id),
              escapeCsvField(s.name),
              escapeCsvField(s.nationalId || ""),
              escapeCsvField(getStageArabicTitle(s.stage)),
              escapeCsvField(s.grade || ""),
              escapeCsvField(s.enrollmentDate || ""),
              escapeCsvField(s.status || "نشط"),
              escapeCsvField(s.guardianPhone || "")
            ].join(","));
          });
          content = "\uFEFF" + lines.join("\n");
        } else if (tableToExport === "staff") {
          const headers = ["المعرف", "الاسم", "الرقم الوظيفي", "المسمى", "المرحلة", "الراتب الأساسي", "الهاتف"];
          const lines = [headers.join(",")];
          filteredStaff.forEach((st) => {
            lines.push([
              escapeCsvField(st.id),
              escapeCsvField(st.name),
              escapeCsvField(st.employeeNo),
              escapeCsvField(st.role || ""),
              escapeCsvField(st.stage || ""),
              escapeCsvField(st.basicSalary || 0),
              escapeCsvField(st.phone || "")
            ].join(","));
          });
          content = "\uFEFF" + lines.join("\n");
        } else {
          const headers = ["رقم الفاتورة", "اسم الطالب", "المبلغ الإجمالي", "المسدد", "الحالة", "تاريخ الاستحقاق"];
          const lines = [headers.join(",")];
          filteredInvoices.forEach((inv) => {
            lines.push([
              escapeCsvField(inv.id),
              escapeCsvField(inv.studentName),
              escapeCsvField(inv.netAmount ?? inv.amount ?? 0),
              escapeCsvField(inv.paid ?? 0),
              escapeCsvField(inv.status),
              escapeCsvField(inv.dueDate || "")
            ].join(","));
          });
          content = "\uFEFF" + lines.join("\n");
        }
      }

      const blob = new Blob([content], {
        type: format === "json" ? "application/json;charset=utf-8" : "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      addActivityLog({
        user: "مدير النظام",
        action: "تصدير بيانات مجمع",
        entity: "المُصدّر الذكي",
        details: `تم تصدير (${selectedTables.length}) جداول بنسق ${format.toUpperCase()}`,
      });

      setIsExporting(false);
      toast.success(`تم إنشاء وتنزيل ملف التصدير (${filename}) بنجاح`);
      onClose();
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent hideCloseButton={true} className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border/80 shadow-2xl bg-card">
        <DialogHeader className="p-5 pb-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <ArrowUpFromLine className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground">تصدير بيانات المنظومة الشاملة</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-bold">
                  تصدير الجداول وسجلات الطلاب والمالية بصيغ Excel، JSON، أو نسق منصة نور المعتمد
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Format Selector */}
          <div>
            <label className="text-xs font-black text-foreground block mb-2">صيغة التصدير المطلوبة:</label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: "json", label: "نسق JSON الهيكلي الشامل", desc: "نسخة برمجية متكاملة للنسخ والأنظمة", icon: Database },
                { id: "noor", label: "نسق نظام نور الوزاري", desc: "CSV مطابق لمتطلبات وزارة التعليم", icon: Globe },
                { id: "csv", label: "جداول Excel / CSV معتمدة", desc: "ملفات مجدولة متوافقة مع إكسل بترميز UTF-8", icon: FileSpreadsheet },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setFormat(fmt.id as any)}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between gap-2 ${
                    format === fmt.id
                      ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20 scale-[1.01]"
                      : "border-border bg-card hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <fmt.icon className={`h-5 w-5 ${format === fmt.id ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`h-2.5 w-2.5 rounded-full ${format === fmt.id ? "bg-primary" : "bg-muted"}`} />
                  </div>
                  <div>
                    <div className="font-black text-xs text-foreground">{fmt.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{fmt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scope Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-muted/40 border border-border text-xs">
            <div>
              <label className="font-black text-foreground block mb-1">نطاق المرحلة التعليمية:</label>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-background px-2.5 font-bold"
              >
                <option value="all">كافة المراحل المدرسية</option>
                <option value="kindergarten">رياض الأطفال (KG)</option>
                <option value="primary">المرحلة الابتدائية</option>
                <option value="middle">المرحلة المتوسطة</option>
                <option value="high">المرحلة الثانوية</option>
              </select>
            </div>
            <div>
              <label className="font-black text-foreground block mb-1">السنة الأكاديمية النشطة:</label>
              <div className="h-9 px-3 rounded-xl border border-border bg-background flex items-center font-bold text-muted-foreground">
                {allAcademicYears.find((y) => y.isCurrent)?.name || "السنة الحالية"}
              </div>
            </div>
          </div>

          {/* Tables Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-foreground">الجداول والوحدات المشمولة في التصدير:</span>
              <div className="flex gap-2 text-[11px] font-bold">
                <button type="button" onClick={selectAll} className="text-primary hover:underline">تحديد الكل</button>
                <span className="text-muted-foreground">|</span>
                <button type="button" onClick={deselectAll} className="text-muted-foreground hover:underline">إلغاء التحديد</button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "students", label: "بيانات الطلاب", count: filteredStudents.length },
                { id: "guardians", label: "أولياء الأمور", count: allGuardians.length },
                { id: "staff", label: "الكادر الوظيفي", count: filteredStaff.length },
                { id: "invoices", label: "الفواتير والرسوم", count: filteredInvoices.length },
                { id: "expenses", label: "المصروفات المالية", count: allExpenses?.length || 0 },
                { id: "settings", label: "إعدادات المدرسة", count: "شامل" },
                { id: "features", label: "حالة الميزات", count: "20 ميزة" },
                { id: "academic", label: "التقويم والسنوات", count: allAcademicYears.length },
              ].map((tb) => {
                const checked = selectedTables.includes(tb.id);
                return (
                  <button
                    key={tb.id}
                    type="button"
                    onClick={() => toggleTable(tb.id)}
                    className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                      checked
                        ? "border-primary bg-primary/5 text-foreground font-black"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-4 w-4 rounded flex items-center justify-center border text-[10px] ${
                        checked ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
                      }`}>
                        {checked && <Check className="h-3 w-3" />}
                      </div>
                      <span className="text-xs truncate">{tb.label}</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-70">{tb.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Data Preview */}
          <div className="border border-border rounded-2xl overflow-hidden text-xs">
            <div className="bg-muted/60 p-2.5 border-b border-border font-black flex items-center justify-between">
              <span>معاينة حية للبيانات المجهزة للتصدير (أول 3 صفوف):</span>
              <div className="flex gap-1">
                {["students", "staff", "invoices"].filter(t => selectedTables.includes(t)).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActivePreviewTable(t)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      activePreviewTable === t ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
                    }`}
                  >
                    {t === "students" ? "الطلاب" : t === "staff" ? "الكادر" : "الفواتير"}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-3 bg-card font-mono text-[11px] max-h-28 overflow-y-auto custom-scrollbar">
              {activePreviewTable === "students" && filteredStudents.slice(0, 3).map((s, idx) => (
                <div key={s.id} className="truncate text-muted-foreground py-0.5">
                  [{idx + 1}] {s.name} | {s.nationalId} | {getStageArabicTitle(s.stage)} | {s.grade} | {s.guardianPhone}
                </div>
              ))}
              {activePreviewTable === "staff" && filteredStaff.slice(0, 3).map((st, idx) => (
                <div key={st.id} className="truncate text-muted-foreground py-0.5">
                  [{idx + 1}] {st.name} | {st.employeeNo} | {st.role} | {st.phone}
                </div>
              ))}
              {activePreviewTable === "invoices" && filteredInvoices.slice(0, 3).map((inv, idx) => (
                <div key={inv.id} className="truncate text-muted-foreground py-0.5">
                  [{idx + 1}] {inv.studentName} | {inv.netAmount || inv.amount} SAR | {inv.status}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-accent"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || selectedTables.length === 0}
            className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md shadow-primary/20 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" /> جاري التجهيز...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> بدء تصدير الملف الآن ({selectedTables.length} جداول)
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// 3. Instant Backup & Disaster Recovery Modal (النسخ الاحتياطي والاسترجاع)
// =========================================================================
export interface InstantBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstantBackupModal({ isOpen, onClose }: InstantBackupModalProps) {
  const {
    allStudents,
    allStaff,
    allGuardians,
    allInvoices,
    allExpenses,
    allAcademicYears,
    systemSettings,
    addActivityLog,
    restoreFullBackup
  } = useGlobalStore();

  const [activeSubTab, setActiveSubTab] = useState<"create" | "restore">("create");
  const [isProcessing, setIsProcessing] = useState(false);
  const [inspectedBackup, setInspectedBackup] = useState<any | null>(null);

  // Local snapshot history persisted in localStorage
  const [savedSnapshots, setSavedSnapshots] = useState<Array<{ id: string; time: string; count: number; name: string }>>(() => {
    try {
      const stored = localStorage.getItem("darasi_backup_snapshots");
      return stored ? JSON.parse(stored) : [
        { id: "BK-20261010-093000", time: "2026-10-10 09:30", count: 480, name: "نسخة أسبوعية تلقائية" },
        { id: "BK-20261005-141520", time: "2026-10-05 14:15", count: 472, name: "قبل تحديث الرسوم" },
      ];
    } catch {
      return [];
    }
  });

  const totalRecords = allStudents.length + allStaff.length + allGuardians.length + allInvoices.length + (allExpenses?.length || 0);

  const handleCreateInstantBackup = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const nowStr = new Date().toISOString();
      const backupId = `BK-${nowStr.replace(/[-:T]/g, "").slice(0, 14)}`;
      const backupData = {
        id: backupId,
        timestamp: nowStr,
        system: "منصة مدارس دارسي المتكاملة",
        version: "3.5.0-Enterprise",
        recordsCount: totalRecords,
        schoolName: systemSettings.schoolName,
        metadata: {
          studentsCount: allStudents.length,
          guardiansCount: allGuardians.length,
          staffCount: allStaff.length,
          invoicesCount: allInvoices.length,
          expensesCount: allExpenses?.length || 0,
        },
        data: {
          students: allStudents,
          guardians: allGuardians,
          staff: allStaff,
          invoices: allInvoices,
          expenses: allExpenses,
          academicYears: allAcademicYears,
          settings: systemSettings,
        },
      };

      // Save to snapshot history
      const newSnapshot = {
        id: backupId,
        time: new Date().toLocaleString("ar-SA"),
        count: totalRecords,
        name: `نسخة يدوية فورية (${systemSettings.schoolName})`,
      };
      const updatedSnapshots = [newSnapshot, ...savedSnapshots.slice(0, 9)];
      setSavedSnapshots(updatedSnapshots);
      try {
        localStorage.setItem("darasi_backup_snapshots", JSON.stringify(updatedSnapshots));
      } catch {}

      // Trigger download
      const blob = new Blob(["\uFEFF" + JSON.stringify(backupData, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `darasi_backup_${backupId}.json`;
      link.click();
      URL.revokeObjectURL(url);

      addActivityLog({
        user: "مدير النظام",
        action: "نسخ احتياطي فوري",
        entity: "النسخ الاحتياطي",
        details: `تم إنشاء نسخة احتياطية فورية (${backupId}) تتضمن ${totalRecords} سجل`,
      });

      setIsProcessing(false);
      toast.success(`تم إنشاء وتنزيل ملف النسخة الاحتياطية (${backupId}) وحفظ اللقطة بنجاح`);
    }, 700);
  };

  const handleInspectBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && (parsed.data || parsed.tables)) {
            setInspectedBackup(parsed);
            toast.success(`تم فحص ملف النسخة الاحتياطية بنجاح`);
          } else {
            toast.error("الملف غير صالح أو لا يطابق هيكل النسخ الاحتياطي لمنصة دارسي");
          }
        } catch {
          toast.error("خطأ في قراءة ملف JSON للنسخة الاحتياطية");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExecuteRestore = () => {
    if (!inspectedBackup) return;
    setIsProcessing(true);
    setTimeout(() => {
      const result = restoreFullBackup(inspectedBackup);
      setIsProcessing(false);
      if (result.success) {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
      }
    }, 800);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setInspectedBackup(null); onClose(); } }}>
      <DialogContent hideCloseButton={true} className="max-w-lg max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border/80 shadow-2xl bg-card">
        <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <HardDrive className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground">النسخ الاحتياطي والاسترجاع الفوري</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-bold">
                  أخذ لقطة شاملة ومحمية لقاعدة البيانات واستعادتها في أي وقت للطوارئ
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={() => { setInspectedBackup(null); onClose(); }}
              className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex border-b border-border/60 text-xs font-bold gap-4 pt-3 mt-1">
            <button
              type="button"
              onClick={() => setActiveSubTab("create")}
              className={`pb-2.5 transition-all relative ${
                activeSubTab === "create" ? "text-primary font-black" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              إنشاء وحفظ نسخة جديدة
              {activeSubTab === "create" && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("restore")}
              className={`pb-2.5 transition-all relative ${
                activeSubTab === "restore" ? "text-primary font-black" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              استعادة من نسخة سابقة ({savedSnapshots.length})
              {activeSubTab === "restore" && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full" />}
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {activeSubTab === "create" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground font-bold block">إجمالي السجلات المفهرسة</span>
                  <span className="text-2xl font-black text-primary font-mono mt-1 block">{totalRecords.toLocaleString("ar-SA")}</span>
                </div>
                <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block">حالة قاعدة البيانات</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 block flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> سليمة ومتطابقة
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2 text-xs">
                <div className="font-black text-foreground">المكونات المتضمنة في النسخة الاحتياطية:</div>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-1">
                  <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> {allStudents.length} ملفات طلاب</div>
                  <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> {allStaff.length} كادر وظيفي</div>
                  <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> {allInvoices.length} قيود وفواتير</div>
                  <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> سياسات وميزات المنصة</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateInstantBackup}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90 shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                {isProcessing ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" /> جاري تجميع وتشفير النسخة...
                  </>
                ) : (
                  <>
                    <HardDrive className="h-4 w-4" /> إنشاء وتنزيل النسخة الاحتياطية الآن
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Snapshot History */}
              <div className="space-y-2">
                <span className="text-xs font-black text-foreground block">سجل اللقطات السابقة المتاحة للاسترجاع:</span>
                <div className="border border-border rounded-2xl divide-y divide-border overflow-hidden">
                  {savedSnapshots.map((snp) => (
                    <div key={snp.id} className="p-3 bg-card hover:bg-accent/40 flex items-center justify-between text-xs transition-colors">
                      <div>
                        <div className="font-bold text-foreground">{snp.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{snp.id} • {snp.time} ({snp.count} سجل)</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          toast.success(`تم استدعاء بيانات اللقطة (${snp.id}) وجاري الاستعادة...`);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-primary/30 text-primary font-black text-[11px] hover:bg-primary hover:text-primary-foreground transition-all shadow-xs"
                      >
                        استعادة فورية
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload External JSON Backup */}
              <div className="border border-dashed border-border rounded-2xl p-4 text-center hover:bg-muted/20 transition-colors">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleInspectBackupFile}
                  className="hidden"
                  id="backup-file-input"
                />
                <label htmlFor="backup-file-input" className="cursor-pointer block space-y-1">
                  <Upload className="h-6 w-6 text-primary mx-auto" />
                  <span className="text-xs font-black text-foreground block">أو رفع ملف نسخة احتياطية من جهازك (.json)</span>
                  <span className="text-[10px] text-muted-foreground block">سيتم فحص الملف والتحقق من صحته قبل الاستعادة</span>
                </label>
              </div>

              {inspectedBackup && (
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex items-center gap-2 font-black text-xs text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>تم فحص النسخة: {inspectedBackup.id || "نسخة صالحة"}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground space-y-1">
                    <div>المدرسة: {inspectedBackup.schoolName || inspectedBackup.data?.settings?.schoolName || "مدرسة دارسي"}</div>
                    <div>تاريخ النسخة: {inspectedBackup.timestamp || "حديثة"}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleExecuteRestore}
                    disabled={isProcessing}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    تأكيد استعادة قاعدة البيانات من هذا الملف
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// 4. Official Print Preview Modal (معاينة المطبوعات الرسمية A4)
// =========================================================================
export interface OfficialPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OfficialPrintPreviewModal({ isOpen, onClose }: OfficialPrintPreviewModalProps) {
  const { systemSettings, allStudents } = useGlobalStore();
  const [docType, setDocType] = useState<"grades" | "invoice" | "enrollment" | "receipt" | "idcard">("grades");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [showLogo, setShowLogo] = useState(true);
  const [showStamp, setShowStamp] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [showSignature, setShowSignature] = useState(true);
  const printSheetRef = useRef<HTMLDivElement>(null);

  const currentStudent = useMemo(() => {
    return allStudents.find((s) => s.id === selectedStudentId) || allStudents[0] || {
      id: "STU-1001",
      name: "ريان فيصل العتيبي",
      nationalId: "1109845231",
      stage: "primary",
      grade: "الصف الخامس الابتدائي",
      guardianPhone: "0501234567",
      guardianName: "فيصل بن عبدالعزيز العتيبي",
      enrollmentDate: "2024-08-20",
    };
  }, [allStudents, selectedStudentId]);

  const handlePrint = () => {
    window.print();
  };

  const qrData = JSON.stringify({
    school: systemSettings.schoolName,
    license: systemSettings.licenseNumber,
    student: currentStudent.name,
    nationalId: currentStudent.nationalId,
    docType,
    verified: true,
    url: systemSettings.qrVerifyUrl || "https://darasi.app/verify",
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent hideCloseButton={true} className="max-w-4xl max-h-[94vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border/80 shadow-2xl bg-card">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <Printer className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground">معاينة المطبوعات والشهادات الرسمية (A4)</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-bold">
                  محاكاة حية عالية الدقة لكافة الوثائق المدرسية مع الشعار المعتمد، الختم الرقمي، ورمز التحقق
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md shadow-primary/20 transition-all hover:scale-[1.02]"
              >
                <Printer className="h-4 w-4" /> طباعة المستند الآن (Ctrl+P)
              </button>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Document Types Selector Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/60 mt-3 text-xs">
            {[
              { id: "grades", label: "كشف درجات وشهادة تفوق", icon: FileText },
              { id: "invoice", label: "فاتورة ضريبية ورسوم دراسية", icon: CreditCard },
              { id: "enrollment", label: "إفادة قيد وتسجيل طالب", icon: CheckCircle2 },
              { id: "receipt", label: "سند قبض وتحصيل مالي", icon: FileSpreadsheet },
              { id: "idcard", label: "بطاقة هوية طالب مدرسية", icon: UserCheck },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDocType(d.id as any)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  docType === d.id
                    ? "bg-primary text-primary-foreground font-black shadow-xs"
                    : "bg-background border border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                <d.icon className="h-3.5 w-3.5" />
                <span>{d.label}</span>
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Toolbar & Student Picker */}
        <div className="p-3 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-[11px]">الطالب المعروض:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-bold"
            >
              {allStudents.slice(0, 15).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.grade})
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Switches */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
              <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} className="rounded text-primary h-3.5 w-3.5" />
              <span>الشعار</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
              <input type="checkbox" checked={showStamp} onChange={(e) => setShowStamp(e.target.checked)} className="rounded text-primary h-3.5 w-3.5" />
              <span>الختم</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
              <input type="checkbox" checked={showQr} onChange={(e) => setShowQr(e.target.checked)} className="rounded text-primary h-3.5 w-3.5" />
              <span>باركود QR</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
              <input type="checkbox" checked={showWatermark} onChange={(e) => setShowWatermark(e.target.checked)} className="rounded text-primary h-3.5 w-3.5" />
              <span>علامة مائية</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
              <input type="checkbox" checked={showSignature} onChange={(e) => setShowSignature(e.target.checked)} className="rounded text-primary h-3.5 w-3.5" />
              <span>توقيع المدير</span>
            </label>
          </div>
        </div>

        {/* Live A4 Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950/60 custom-scrollbar flex justify-center">
          <div
            ref={printSheetRef}
            className="w-full max-w-[680px] bg-white text-slate-900 p-8 rounded-xl shadow-2xl border border-slate-300 relative select-none"
            style={{ minHeight: "820px" }}
          >
            {/* Watermark Overlay */}
            {showWatermark && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.04]">
                <span className="text-7xl font-black rotate-[-35deg] text-slate-900 tracking-widest uppercase">
                  {systemSettings.schoolName}
                </span>
              </div>
            )}

            {/* Official Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 mb-6">
              <div className="text-right space-y-1">
                <div className="text-xs font-bold text-slate-500">المملكة العربية السعودية</div>
                <div className="text-xs font-bold text-slate-500">وزارة التعليم - إدارة التعليم الأهلي</div>
                <div className="text-base font-black text-slate-900">{systemSettings.schoolName}</div>
                <div className="text-[10px] text-slate-500 font-mono">ترخيص رقم: {systemSettings.licenseNumber}</div>
              </div>

              {/* Logo in Center */}
              <div className="text-center">
                {showLogo && systemSettings.logoUrl ? (
                  <img src={systemSettings.logoUrl} alt="Logo" className="h-16 w-16 object-contain mx-auto" />
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center font-black text-slate-400 text-xs mx-auto">
                    شعار المدرسة
                  </div>
                )}
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  {new Date().toISOString().split("T")[0]}
                </div>
              </div>

              {/* QR Verification Code */}
              <div className="text-left">
                {showQr && (
                  <div className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-xs inline-block">
                    <QRCode value={qrData} size={64} level="M" />
                  </div>
                )}
                <div className="text-[9px] text-slate-400 font-mono mt-1 text-center">التحقق الرقمي</div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="text-center my-6">
              <h2 className="text-xl font-black tracking-wide inline-block border-b-2 border-slate-800 pb-1 text-slate-900">
                {docType === "grades" && "كشف درجات وشهادة إتمام فترة تقويمية"}
                {docType === "invoice" && "فاتورة رسوم دراسية ضريبية رسمية"}
                {docType === "enrollment" && "إفادة قيد وتسجيل طالب بالمنظومة"}
                {docType === "receipt" && "سند قبض مالي رسمي معتمد"}
                {docType === "idcard" && "بطاقة تعريف وهوية مدرسية معتمدة"}
              </h2>
              <div className="text-xs text-slate-500 mt-1">للعام الدراسي: ١٤٤٧ / ١٤٤٨ هـ (2025-2026)</div>
            </div>

            {/* Student Info Box */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-6 font-bold">
              <div><span className="text-slate-500">اسم الطالب:</span> <span className="text-slate-900">{currentStudent.name}</span></div>
              <div><span className="text-slate-500">رقم الهوية:</span> <span className="font-mono text-slate-900">{currentStudent.nationalId}</span></div>
              <div><span className="text-slate-500">المرحلة والصف:</span> <span className="text-slate-900">{getStageArabicTitle(currentStudent.stage as any)} - {currentStudent.grade}</span></div>
              <div><span className="text-slate-500">رقم جوال الولي:</span> <span className="font-mono text-slate-900">{currentStudent.guardianPhone}</span></div>
            </div>

            {/* Document Dynamic Body */}
            {docType === "grades" && (
              <div className="space-y-4">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-y border-slate-300 font-black">
                      <th className="p-2.5">المادة الدراسية</th>
                      <th className="p-2.5 text-center">الدرجة العظمى</th>
                      <th className="p-2.5 text-center">الدرجة المستحقة</th>
                      <th className="p-2.5 text-center">التقدير</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[
                      { subject: "القرآن الكريم والدراسات الإسلامية", max: 100, score: 98, grade: "ممتاز مرتفع" },
                      { subject: "اللغة العربية (لغتي الجميلة)", max: 100, score: 95, grade: "ممتاز" },
                      { subject: "الرياضيات العامة", max: 100, score: 92, grade: "ممتاز" },
                      { subject: "العلوم والطبيعة", max: 100, score: 96, grade: "ممتاز مرتفع" },
                      { subject: "اللغة الإنجليزية (English)", max: 100, score: 94, grade: "ممتاز" },
                      { subject: "المهارات الرقمية والحاسب", max: 100, score: 99, grade: "ممتاز مرتفع" },
                    ].map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slate-800">{row.subject}</td>
                        <td className="p-2.5 text-center font-mono text-slate-500">{row.max}</td>
                        <td className="p-2.5 text-center font-mono font-black text-slate-900">{row.score}</td>
                        <td className="p-2.5 text-center font-black text-emerald-700">{row.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-400 font-black">
                      <td className="p-2.5">المعدل التراكمي العام</td>
                      <td className="p-2.5 text-center font-mono">600</td>
                      <td className="p-2.5 text-center font-mono text-primary font-black">574 (95.6%)</td>
                      <td className="p-2.5 text-center text-emerald-700">ممتاز مع مرتبة الشرف</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {docType === "invoice" && (
              <div className="space-y-4">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-y border-slate-300 font-black">
                      <th className="p-2.5">البند والوصف</th>
                      <th className="p-2.5 text-center">المبلغ الأساسي</th>
                      <th className="p-2.5 text-center">الضريبة (15%)</th>
                      <th className="p-2.5 text-center">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2.5 font-bold">رسوم الدراسة - الفصل الدراسي الأول</td>
                      <td className="p-2.5 text-center font-mono">10,000</td>
                      <td className="p-2.5 text-center font-mono">1,500</td>
                      <td className="p-2.5 text-center font-mono font-black">11,500</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">خدمات النقل المدرسي والحافلات</td>
                      <td className="p-2.5 text-center font-mono">1,500</td>
                      <td className="p-2.5 text-center font-mono">225</td>
                      <td className="p-2.5 text-center font-mono font-black">1,725</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-400 font-black">
                      <td className="p-2.5">المبلغ المطلوب سداده</td>
                      <td className="p-2.5 text-center font-mono">11,500</td>
                      <td className="p-2.5 text-center font-mono">1,725</td>
                      <td className="p-2.5 text-center font-mono text-emerald-700 font-black">13,225 ريال</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {docType === "enrollment" && (
              <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4 text-xs leading-relaxed text-slate-800">
                <p>
                  تشهد إدارة <span className="font-black text-slate-900">{systemSettings.schoolName}</span> بأن الطالب الموضح اسمه وبياناته أعلاه مقيد لدينا بصورة منتظمة ورسمية بالصف <span className="font-black text-slate-900">{currentStudent.grade}</span> خلال العام الدراسي الحالي.
                </p>
                <p>
                  وقد أُعطيت له هذه الإفادة بناءً على طلب ولي أمره لتقديمها إلى من يهمه الأمر دون أدنى مسؤولية مالية على المدرسة.
                </p>
              </div>
            )}

            {docType === "receipt" && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs leading-relaxed text-slate-800">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="font-black">وصلنا من المكرم ولي أمر الطالب:</span>
                  <span className="font-mono font-bold">{currentStudent.guardianName || currentStudent.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="font-black">مبلغ وقدره:</span>
                  <span className="font-black font-mono text-base text-emerald-700">5,000.00 ريال سعودي</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-black">وذلك عن:</span>
                  <span className="font-bold">سداد القسط الدراسي الثاني مع رسوم الكتب</span>
                </div>
              </div>
            )}

            {docType === "idcard" && (
              <div className="max-w-sm mx-auto p-5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border-2 border-primary/30 text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-slate-200 border-2 border-primary mx-auto flex items-center justify-center font-black text-slate-500">
                  صورة
                </div>
                <div className="font-black text-base text-slate-900">{currentStudent.name}</div>
                <div className="text-xs font-bold text-slate-600">{currentStudent.grade}</div>
                <div className="font-mono text-xs text-slate-500">ID: {currentStudent.nationalId}</div>
              </div>
            )}

            {/* Official Footer with Signatures & Stamp */}
            <div className="mt-12 pt-6 border-t border-slate-300 flex items-center justify-between text-xs font-bold">
              <div className="space-y-1">
                <div className="text-slate-500">الختم الرسمي للمدرسة</div>
                {showStamp && systemSettings.stampUrl ? (
                  <img src={systemSettings.stampUrl} alt="Stamp" className="h-20 w-20 object-contain stamp rotate-[-6deg]" />
                ) : (
                  <div className="h-16 w-16 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-400 stamp rotate-[-6deg]">
                    ختم المدرسة
                  </div>
                )}
              </div>

              <div className="space-y-1 text-center">
                <div className="text-slate-500">مسؤول التسجيل والقبول</div>
                <div className="h-10 text-slate-800 font-mono pt-3">أمين السجلات</div>
              </div>

              <div className="space-y-1 text-left">
                <div className="text-slate-500">مدير عام المدرسة المعتمد</div>
                <div className="font-black text-slate-900">{systemSettings.principalName}</div>
                {showSignature && (
                  <div className="text-[10px] text-slate-400 font-mono italic">توقيع معتمد إلكترونياً</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// 5. Webhook & API Live Tester Modal (مختبر الربط البرمجي)
// =========================================================================
export interface WebhookTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WebhookTesterModal({ isOpen, onClose }: WebhookTesterModalProps) {
  const { systemSettings } = useGlobalStore();
  const [selectedEvent, setSelectedEvent] = useState("student.created");
  const [webhookUrl, setWebhookUrl] = useState(systemSettings.webhookUrl || "https://api.school.edu/v1/webhooks");
  const [isSending, setIsSending] = useState(false);
  const [customPayload, setCustomPayload] = useState("");
  const [lastResponse, setLastResponse] = useState<any>(null);

  const defaultPayloads: Record<string, any> = {
    "student.created": {
      event: "student.created",
      timestamp: new Date().toISOString(),
      schoolId: systemSettings.licenseNumber,
      data: {
        studentId: "STU-90812",
        name: "فهد خالد الشمري",
        stage: "primary",
        grade: "الصف الأول الابتدائي",
        guardianPhone: "0501234567",
      },
    },
    "invoice.paid": {
      event: "invoice.paid",
      timestamp: new Date().toISOString(),
      schoolId: systemSettings.licenseNumber,
      data: {
        invoiceId: "INV-2026-4412",
        studentName: "سارة عمر الدوسري",
        amountPaid: 4500,
        currency: "SAR",
        paymentMethod: "Mada",
        referenceNo: "TXN-881920",
      },
    },
    "attendance.absent": {
      event: "attendance.absent",
      timestamp: new Date().toISOString(),
      schoolId: systemSettings.licenseNumber,
      data: {
        studentId: "STU-1029",
        name: "تركي ماجد العتيبي",
        date: new Date().toISOString().split("T")[0],
        status: "absent",
        period: "morning_assembly",
      },
    },
    "exam.grade.updated": {
      event: "exam.grade.updated",
      timestamp: new Date().toISOString(),
      schoolId: systemSettings.licenseNumber,
      data: {
        examId: "EXAM-2026-01",
        studentId: "STU-90812",
        subject: "الرياضيات",
        grade: 98,
        approvedBy: systemSettings.principalName,
      },
    },
    "staff.leave.approved": {
      event: "staff.leave.approved",
      timestamp: new Date().toISOString(),
      schoolId: systemSettings.licenseNumber,
      data: {
        employeeNo: "EMP-102",
        name: "أحمد بن سعيد",
        leaveType: "إجازة اعتيادية",
        days: 5,
      },
    },
  };

  useEffect(() => {
    setCustomPayload(JSON.stringify(defaultPayloads[selectedEvent] || {}, null, 2));
  }, [selectedEvent]);

  const handleSendTest = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setLastResponse({
        status: 200,
        statusText: "OK",
        latency: 118,
        timestamp: new Date().toLocaleTimeString("ar-SA"),
        headers: {
          "content-type": "application/json; charset=utf-8",
          "x-signature-verified": "true",
          "x-school-auth": "valid",
        },
        body: {
          received: true,
          event: selectedEvent,
          deliveryId: `del_${Math.random().toString(36).substring(2, 10)}`,
          message: "تم استلام حدث الـ Webhook ومعالجته بنجاح من قبل الخادم",
        },
      });
      toast.success(`تم بث حدث (${selectedEvent}) بنجاح وتلقي استجابة 200 OK`);
    }, 700);
  };

  const copyCurl = () => {
    const curl = `curl -X POST "${webhookUrl}" \\\n  -H "Content-Type: application/json" \\\n  -H "X-School-Signature: sha256=mock_sig_992" \\\n  -d '${customPayload.replace(/\n/g, "")}'`;
    navigator.clipboard?.writeText(curl);
    toast.success("تم نسخ أمر cURL للحافظة بنجاح");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent hideCloseButton={true} className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border/80 shadow-2xl bg-card">
        <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <Webhook className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground">مختبر الـ Webhooks والبث اللحظي للأحداث</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-bold">
                  محاكاة إرسال أحداث النظام للأنظمة الخارجية مع فحص التوقيعات وسرعة الاستجابة
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs">
          {/* Webhook Endpoint URL */}
          <div>
            <label className="font-black text-foreground block mb-1">رابط استقبال الـ Webhook (Endpoint URL):</label>
            <div className="flex gap-2">
              <input
                type="text"
                dir="ltr"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="h-10 flex-1 rounded-xl border border-border bg-background px-3 font-mono font-bold text-xs"
              />
              <button
                type="button"
                onClick={copyCurl}
                className="px-3.5 rounded-xl border border-border hover:bg-accent flex items-center gap-1 font-bold shrink-0"
              >
                <Copy className="h-3.5 w-3.5" /> نسخ cURL
              </button>
            </div>
          </div>

          {/* Event Picker */}
          <div>
            <label className="font-black text-foreground block mb-1">نوع الحدث المراد اختباره:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: "student.created", label: "تسجيل طالب جديد" },
                { id: "invoice.paid", label: "سداد فاتورة ورسوم" },
                { id: "attendance.absent", label: "رصد غياب طالب" },
                { id: "exam.grade.updated", label: "اعتماد وتحديث درجات" },
                { id: "staff.leave.approved", label: "إجازة موظف معتمدة" },
              ].map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => setSelectedEvent(ev.id)}
                  className={`p-2.5 rounded-xl border text-right transition-all font-bold ${
                    selectedEvent === ev.id
                      ? "border-primary bg-primary/10 text-primary font-black ring-1 ring-primary/20"
                      : "border-border bg-card text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <div className="truncate">{ev.label}</div>
                  <div className="text-[10px] font-mono opacity-70 mt-0.5">{ev.id}</div>
                </button>
              ))}
            </div>
          </div>

          {/* JSON Payload */}
          <div>
            <label className="font-black text-foreground block mb-1">حمولة البيانات (JSON Payload):</label>
            <textarea
              dir="ltr"
              rows={6}
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              className="w-full rounded-2xl border border-border bg-slate-900 text-slate-100 p-3 font-mono text-[11px] leading-relaxed outline-none focus:border-primary"
            />
          </div>

          {/* Response Inspection */}
          {lastResponse && (
            <div className="border border-border rounded-2xl p-4 bg-muted/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>نتيجة استجابة الخادم:</span>
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                  {lastResponse.status} {lastResponse.statusText} ({lastResponse.latency}ms)
                </span>
              </div>
              <pre dir="ltr" className="bg-background p-3 rounded-xl border border-border text-[11px] font-mono text-muted-foreground overflow-x-auto">
                {JSON.stringify(lastResponse.body, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-accent"
          >
            إغلاق
          </button>
          <button
            type="button"
            onClick={handleSendTest}
            disabled={isSending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md shadow-primary/20 transition-all hover:scale-[1.02]"
          >
            {isSending ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" /> جاري البث...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> بث الحدث التجريبي الآن
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// 6. Notification Channel Simulator Modal (محاكي قنوات الإشعارات والرسائل)
// =========================================================================
export interface NotificationSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationSimulatorModal({ isOpen, onClose }: NotificationSimulatorModalProps) {
  const { systemSettings, addNotification, allStudents } = useGlobalStore();
  const [channel, setChannel] = useState<"whatsapp" | "sms" | "email">("whatsapp");
  const [template, setTemplate] = useState("absence");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("0501234567");
  const [recipientName, setRecipientName] = useState("ولي أمر الطالب");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const stu = allStudents.find((s) => s.id === selectedStudentId) || allStudents[0];
    const sName = stu?.name || "زياد خالد الدوسري";
    const gPhone = stu?.guardianPhone || "0501234567";
    setRecipientPhone(gPhone);
    setRecipientName(`ولي أمر ${sName}`);

    if (template === "absence") {
      setMessage(`السلام عليكم ورحمة الله. نفيدكم برصد غياب الطالب (${sName}) عن الطابور الصباحي اليوم. يمكنكم تقديم العذر عبر تطبيق ولي الأمر.`);
    } else if (template === "payment") {
      setMessage(`سعادة ولي أمر الطالب (${sName}): تم قيد سداد الرسوم الدراسية بمبلغ 2,500 ريال بنجاح. شكراً لتعاونكم مع ${systemSettings.schoolName}.`);
    } else if (template === "exam") {
      setMessage(`بشرى سارة: تم اعتماد ونشر كشوف درجات الفترة الأكاديمية الأولى للطالب (${sName}). نتمنى له دوام التوفيق والنجاح.`);
    } else {
      setMessage(`يسر إدارة ${systemSettings.schoolName} دعوتكم لحضور اللقاء التربوي الدوري لأولياء الأمور يوم الخميس القادم.`);
    }
  }, [template, selectedStudentId, allStudents, systemSettings.schoolName]);

  const handleSendTest = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      addNotification({
        title: `إشعار ${channel.toUpperCase()}: ${systemSettings.schoolName}`,
        message: `${message} (مرسل إلى: ${recipientPhone})`,
        type: "success",
      });
      toast.success(`تم إرسال الإشعار بنجاح عبر قناة ${channel.toUpperCase()} إلى ${recipientPhone}`);
      onClose();
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent hideCloseButton={true} className="max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border/80 shadow-2xl bg-card">
        <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground">محاكي قنوات الإشعارات والرسائل</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-bold">
                  معاينة حية واقعية لظهور الرسائل على شاشة هاتف ولي الأمر عبر واتساب و SMS والبريد
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs">
          {/* Channel Selector */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "whatsapp", label: "WhatsApp واتساب", icon: MessageSquare },
              { id: "sms", label: "SMS رسائل نصية", icon: Smartphone },
              { id: "email", label: "البريد الإلكتروني", icon: Mail },
            ].map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => setChannel(it.id as any)}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  channel === it.id
                    ? "border-primary bg-primary text-primary-foreground shadow-sm font-black"
                    : "border-border hover:bg-accent text-muted-foreground"
                }`}
              >
                <it.icon className="h-4 w-4" />
                <span>{it.label}</span>
              </button>
            ))}
          </div>

          {/* Student Picker & Template */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground mb-1 block">اختيار الطالب المستهدف:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-background px-2 text-xs font-bold"
              >
                {allStudents.slice(0, 10).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground mb-1 block">قالب الرسالة:</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-background px-2 text-xs font-bold"
              >
                <option value="absence">تنبيه غياب صباحي</option>
                <option value="payment">إشعار سداد قسط مالي</option>
                <option value="exam">اعتماد ونشر كشوف الدرجات</option>
                <option value="announcement">دعوة لاجتماع مدرسي عام</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground mb-1 block">نص الرسالة المعتمد:</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs leading-relaxed font-bold outline-none focus:border-primary"
            />
          </div>

          {/* Realistic Device Phone Mockup */}
          <div className="border border-border rounded-2xl p-4 bg-slate-900 text-white space-y-3">
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>معاينة حية على شاشة هاتف ولي الأمر:</span>
              <span>{recipientPhone}</span>
            </div>

            {channel === "whatsapp" && (
              <div className="bg-[#0b141a] rounded-xl overflow-hidden border border-[#202c33]">
                <div className="bg-[#202c33] p-2.5 flex items-center gap-2.5 border-b border-[#2a3942]">
                  <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center font-black text-xs text-white">
                    {systemSettings.schoolName.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white flex items-center gap-1">
                      <span>{systemSettings.schoolName}</span>
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    </div>
                    <div className="text-[9px] text-slate-400">حساب تجاري رسمي موثق</div>
                  </div>
                </div>
                <div className="p-3 bg-[#0b141a] bg-opacity-95">
                  <div className="bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-none text-xs leading-relaxed shadow-sm max-w-[90%] mr-auto">
                    <div>{message}</div>
                    <div className="text-[9px] text-emerald-200 text-left mt-1 font-mono flex items-center justify-end gap-1">
                      <span>10:30 ص</span>
                      <CheckCheck className="h-3.5 w-3.5 text-sky-300" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {channel === "sms" && (
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="text-center text-[10px] text-slate-400 mb-2">رسالة نصية قصيرة • {systemSettings.schoolName}</div>
                <div className="bg-slate-700 text-white p-3 rounded-2xl rounded-tr-none text-xs leading-relaxed max-w-[90%] mr-auto">
                  {message}
                </div>
              </div>
            )}

            {channel === "email" && (
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-2">
                <div className="text-[10px] text-slate-400">من: {systemSettings.email}</div>
                <div className="text-[10px] text-slate-400">إلى: {recipientName} &lt;parent@domain.com&gt;</div>
                <div className="p-3 bg-slate-900 rounded-lg text-xs leading-relaxed border border-slate-700">
                  <div className="font-black text-primary mb-1">{systemSettings.schoolName}</div>
                  {message}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-accent"
          >
            إغلاق
          </button>
          <button
            type="button"
            onClick={handleSendTest}
            disabled={isSending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
          >
            {isSending ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            إرسال إشعار تجريبي فوري
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// 7. Mobile App Connect Modal (رمز وتطبيق ولي الأمر)
// =========================================================================
export interface MobileConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileConnectModal({ isOpen, onClose }: MobileConnectModalProps) {
  const { systemSettings } = useGlobalStore();
  const [pinCode, setPinCode] = useState("892-410");
  const [timer, setTimer] = useState(600);
  const [targetApp, setTargetApp] = useState<"parent" | "teacher" | "student">("parent");

  useEffect(() => {
    const t = setInterval(() => {
      setTimer((p) => (p > 0 ? p - 1 : 600));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const connectUrl = `https://darasi.app/connect?school=${encodeURIComponent(systemSettings.schoolName)}&app=${targetApp}&pin=${pinCode}`;

  const handleGenerateNewPin = () => {
    const p1 = Math.floor(100 + Math.random() * 900);
    const p2 = Math.floor(100 + Math.random() * 900);
    setPinCode(`${p1}-${p2}`);
    setTimer(600);
    toast.success("تم توليد رمز ربط مؤقت جديد وتحديث رمز الاستجابة QR");
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(connectUrl);
    toast.success("تم نسخ رابط الربط السريع للتطبيق للحافظة");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent hideCloseButton={true} className="max-w-md text-center max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border/80 shadow-2xl bg-card">
        <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-muted/20">
          <div className="flex flex-col items-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs mb-1.5">
              <Smartphone className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-black text-foreground">رمز ربط تطبيقات الهاتف والمنصات الذكية</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-bold">
              امسح الرمز أو أدخل كود الربط السريع لتهيئة تطبيق دارسي على جهازك
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          {/* Target App Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border text-xs font-bold">
            <button
              type="button"
              onClick={() => setTargetApp("parent")}
              className={`py-1.5 rounded-lg transition-all ${
                targetApp === "parent" ? "bg-card text-foreground shadow-xs font-black" : "text-muted-foreground"
              }`}
            >
              بوابة ولي الأمر
            </button>
            <button
              type="button"
              onClick={() => setTargetApp("teacher")}
              className={`py-1.5 rounded-lg transition-all ${
                targetApp === "teacher" ? "bg-card text-foreground shadow-xs font-black" : "text-muted-foreground"
              }`}
            >
              تطبيق المعلم
            </button>
            <button
              type="button"
              onClick={() => setTargetApp("student")}
              className={`py-1.5 rounded-lg transition-all ${
                targetApp === "student" ? "bg-card text-foreground shadow-xs font-black" : "text-muted-foreground"
              }`}
            >
              بوابة الطالب
            </button>
          </div>

          <div className="inline-block p-4 rounded-3xl bg-white border border-slate-200 shadow-xl">
            <QRCode value={connectUrl} size={150} level="H" />
          </div>

          <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-1">
            <div className="text-[11px] font-bold text-muted-foreground">كود الربط المباشر المكون من 6 أرقام:</div>
            <div className="text-2xl font-black font-mono tracking-widest text-primary">{pinCode}</div>
            <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground pt-1">
              <span>صالح لمدة: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")} دقيقة</span>
              <button type="button" onClick={handleGenerateNewPin} className="text-primary font-bold hover:underline flex items-center gap-1">
                <RefreshCcw className="h-3 w-3" /> كود جديد
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-muted/60 p-2 rounded-xl border border-border">
            <input
              type="text"
              readOnly
              dir="ltr"
              value={connectUrl}
              className="flex-1 bg-transparent border-0 text-[11px] font-mono font-bold text-muted-foreground outline-none truncate"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              title="نسخ الرابط"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 sm:justify-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90"
          >
            تم الانتهاء
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// 8. Factory Reset Guard Modal (استعادة ضبط المصنع الآمنة)
// =========================================================================
export interface FactoryResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function FactoryResetModal({ isOpen, onClose, onConfirm }: FactoryResetModalProps) {
  const { wipeSystemData, allStudents, allStaff, allInvoices } = useGlobalStore();
  const [mode, setMode] = useState<"settings" | "features" | "full">("settings");
  const [confirmationWord, setConfirmationWord] = useState("");
  const isMatch = confirmationWord.trim() === "تأكيد" || confirmationWord.trim().toLowerCase() === "reset";

  const handleExecuteReset = () => {
    if (!isMatch) return;
    if (mode === "settings") {
      onConfirm();
    } else if (mode === "features") {
      onConfirm();
    } else {
      wipeSystemData({ wipeStudents: true, wipeStaff: true, wipeFinance: true, resetSettings: true });
      toast.success("تم مسح بيانات النظام وإعادة تهيئته لضبط المصنع الشامل بنجاح");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setConfirmationWord(""); onClose(); } }}>
      <DialogContent hideCloseButton={true} className="max-w-md max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-danger/30 shadow-2xl bg-card">
        <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-danger/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-danger/10 text-danger border border-danger/20 shadow-xs">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-danger">تحذير أمني: استعادة ضبط المصنع</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-bold">
                  إعادة تهيئة النظام والسياسات المركزية إلى الحالة الافتراضية
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={() => { setConfirmationWord(""); onClose(); }}
              className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs leading-relaxed custom-scrollbar">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMode("settings")}
              className={`p-2.5 rounded-2xl border text-right transition-all ${
                mode === "settings"
                  ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <div className="font-black text-xs text-foreground">1. الإعدادات</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 font-bold">يحافظ على البيانات</div>
            </button>
            <button
              type="button"
              onClick={() => setMode("features")}
              className={`p-2.5 rounded-2xl border text-right transition-all ${
                mode === "features"
                  ? "border-amber-500 bg-amber-500/10 shadow-xs ring-1 ring-amber-500/30"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <div className="font-black text-xs text-amber-600 dark:text-amber-400">2. الميزات</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 font-bold">تصفير الوحدات</div>
            </button>
            <button
              type="button"
              onClick={() => setMode("full")}
              className={`p-2.5 rounded-2xl border text-right transition-all ${
                mode === "full"
                  ? "border-danger bg-danger/10 shadow-xs ring-1 ring-danger/30"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <div className="font-black text-xs text-danger">3. مسح شامل</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 font-bold">حذف البيانات</div>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-danger/5 border border-danger/20 text-danger font-bold space-y-1.5">
            <div className="font-black">
              {mode === "settings" && "سيتم استعادة الإعدادات والسياسات التالية إلى الافتراضيات:"}
              {mode === "features" && "سيتم إعادة تهيئة ميزات النظام والربط البرمجي إلى الحالة الافتراضية:"}
              {mode === "full" && `تحذير حرج: سيتم مسح ${allStudents.length} طالب و ${allStaff.length} موظف و ${allInvoices.length} مطالبة بالكامل:`}
            </div>
            <ul className="list-disc list-inside text-[11px] font-bold space-y-1 pt-1">
              <li>اسم المدرسة والهوية البصرية والشعار والختم</li>
              <li>قواعد ومواعيد الدوام وسياسات الحضور والغياب</li>
              <li>حالة تفعيل ميزات النظام والـ API والـ Webhooks</li>
            </ul>
          </div>

          <div>
            <label className="font-black text-muted-foreground block mb-1">
              لإتمام العملية، يرجى كتابة كلمة <span className="text-danger font-black">"تأكيد"</span> أدناه:
            </label>
            <input
              type="text"
              value={confirmationWord}
              onChange={(e) => setConfirmationWord(e.target.value)}
              placeholder="اكتب تأكيد هنا..."
              className="w-full h-11 rounded-2xl border border-danger/40 bg-background px-3 font-black text-center text-sm outline-none focus:ring-2 focus:ring-danger/30"
            />
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => { setConfirmationWord(""); onClose(); }}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-accent"
          >
            إلغاء التراجع
          </button>
          <button
            type="button"
            onClick={handleExecuteReset}
            disabled={!isMatch}
            className="px-6 py-2.5 rounded-xl bg-danger text-danger-foreground text-xs font-black hover:bg-danger/90 shadow-md disabled:opacity-40 transition-all"
          >
            {mode === "settings" ? "استعادة ضبط الإعدادات" : mode === "features" ? "تصفير ميزات النظام" : "مسح شامل وإعادة ضبط المصنع"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// 9. Add Academic Year Modal (إضافة سنة أكاديمية جديدة)
// =========================================================================
export interface AddAcademicYearModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddAcademicYearModal({ isOpen, onClose }: AddAcademicYearModalProps) {
  const { addAcademicYear, updateAcademicYear, allAcademicYears } = useGlobalStore();
  const [name, setName] = useState("١٤٤٧ / ١٤٤٨ هـ (2025-2026)");
  const [startDate, setStartDate] = useState("2025-08-24");
  const [endDate, setEndDate] = useState("2026-06-18");
  const [termSystem, setTermSystem] = useState<"3_terms" | "2_terms">("3_terms");
  const [isCurrent, setIsCurrent] = useState(false);

  // Term custom dates state
  const [t1Start, setT1Start] = useState("2025-08-24");
  const [t1End, setT1End] = useState("2025-11-20");
  const [t2Start, setT2Start] = useState("2025-11-30");
  const [t2End, setT2End] = useState("2026-02-26");
  const [t3Start, setT3Start] = useState("2026-03-08");
  const [t3End, setT3End] = useState("2026-06-18");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("يرجى إدخال مسمى السنة الدراسية");
      return;
    }

    let terms = [];
    if (termSystem === "3_terms") {
      terms = [
        { id: `term-${Date.now()}-1`, name: "الفصل الدراسي الأول", startDate: t1Start, endDate: t1End, status: "active" as const },
        { id: `term-${Date.now()}-2`, name: "الفصل الدراسي الثاني", startDate: t2Start, endDate: t2End, status: "upcoming" as const },
        { id: `term-${Date.now()}-3`, name: "الفصل الدراسي الثالث", startDate: t3Start, endDate: t3End, status: "upcoming" as const },
      ];
    } else {
      terms = [
        { id: `term-${Date.now()}-1`, name: "الفصل الدراسي الأول", startDate: t1Start, endDate: t1End, status: "active" as const },
        { id: `term-${Date.now()}-2`, name: "الفصل الدراسي الثاني", startDate: t2Start, endDate: t3End, status: "upcoming" as const },
      ];
    }

    if (isCurrent) {
      allAcademicYears.forEach((y) => {
        updateAcademicYear(y.id, { isCurrent: false });
      });
    }

    addAcademicYear({
      name,
      startDate,
      endDate,
      isCurrent,
      termSystem,
      terms,
    });

    toast.success(`تمت إضافة وتنشيط السنة الدراسية (${name}) بنجاح`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent hideCloseButton={true} className="max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border/80 shadow-2xl bg-card">
        <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground">إضافة سنة أكاديمية جديدة</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-bold">
                  تهيئة سنة دراسية جديدة وجدولة فصولها الأكاديمية بدقة
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs">
          <div>
            <label className="font-black text-muted-foreground mb-1 block">مسمى السنة الدراسية:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: ١٤٤٧ / ١٤٤٨ هـ (2025-2026)"
              className="w-full h-10 rounded-xl border border-border bg-background px-3 font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-black text-muted-foreground mb-1 block">بداية العام الدراسي:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setT1Start(e.target.value);
                }}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 font-bold"
                required
              />
            </div>
            <div>
              <label className="font-black text-muted-foreground mb-1 block">نهاية العام الدراسي:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setT3End(e.target.value);
                }}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-black text-muted-foreground mb-1 block">نظام الفصول الدراسية المعتمد:</label>
            <select
              value={termSystem}
              onChange={(e) => setTermSystem(e.target.value as any)}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 font-bold"
            >
              <option value="3_terms">نظام الثلاثة فصول دراسية (المعتمد بالسعودية)</option>
              <option value="2_terms">نظام الفصلين الدراسيين (نصف سنوي)</option>
            </select>
          </div>

          {/* Term Dates Builder */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2.5">
            <div className="font-black text-foreground">مواعيد الفصول الدراسية:</div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 items-center">
                <span className="font-bold text-[11px]">الفصل 1 (بداية / نهاية):</span>
                <div className="flex gap-1">
                  <input type="date" value={t1Start} onChange={(e) => setT1Start(e.target.value)} className="w-1/2 h-7 rounded border border-border bg-background px-1 text-[10px]" />
                  <input type="date" value={t1End} onChange={(e) => setT1End(e.target.value)} className="w-1/2 h-7 rounded border border-border bg-background px-1 text-[10px]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 items-center">
                <span className="font-bold text-[11px]">الفصل 2 (بداية / نهاية):</span>
                <div className="flex gap-1">
                  <input type="date" value={t2Start} onChange={(e) => setT2Start(e.target.value)} className="w-1/2 h-7 rounded border border-border bg-background px-1 text-[10px]" />
                  <input type="date" value={t2End} onChange={(e) => setT2End(e.target.value)} className="w-1/2 h-7 rounded border border-border bg-background px-1 text-[10px]" />
                </div>
              </div>
              {termSystem === "3_terms" && (
                <div className="grid grid-cols-2 gap-2 items-center">
                  <span className="font-bold text-[11px]">الفصل 3 (بداية / نهاية):</span>
                  <div className="flex gap-1">
                    <input type="date" value={t3Start} onChange={(e) => setT3Start(e.target.value)} className="w-1/2 h-7 rounded border border-border bg-background px-1 text-[10px]" />
                    <input type="date" value={t3End} onChange={(e) => setT3End(e.target.value)} className="w-1/2 h-7 rounded border border-border bg-background px-1 text-[10px]" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 font-bold p-3 rounded-2xl border border-border bg-card hover:bg-accent/40 cursor-pointer">
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="rounded text-primary h-4 w-4"
            />
            <span>تعيين كسنة دراسية حالية ونشطة فوراً للمنصة</span>
          </label>

          <DialogFooter className="p-4 -mx-5 -mb-5 border-t border-border/80 bg-muted/20 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border font-bold hover:bg-accent"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-black hover:bg-primary/90 shadow-md shadow-primary/20"
            >
              حفظ وتنشيط السنة الدراسية
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
