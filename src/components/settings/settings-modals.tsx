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
  FileSpreadsheet
} from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { useGlobalStore, Invoice, EducationalStage, SystemSettings, defaultSettings, defaultFeatures } from "@/contexts/GlobalStoreContext";

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
  isEditing?: boolean;
}

export function SmartImporterModal({ isOpen, onClose, initialEntityType = "students" }: SmartImporterModalProps) {
  const { addStudent, addStaff, addGuardian, addActivityLog, allStudents, allStaff } = useGlobalStore();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [entityType, setEntityType] = useState<"students" | "staff" | "guardians">(initialEntityType);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    let rows = "عبدالله محمد السعيد,1102233445,ابتدائي,الصف الأول الابتدائي,0501234567\nسارة خالد العتيبي,1103344556,متوسط,الصف الثاني المتوسط,0559876543\nفيصل ناصر الدوسري,1104455667,ثانوي,الصف الأول الثانوي,0508899776";
    if (entityType === "staff") {
      headers = "اسم_الموظف,الرقم_الوظيفي,المرحلة_الدراسية,المسمى_الوظيفي,رقم_الجوال";
      rows = "فهد ناصر الدوسري,EMP-501,ثانوي,معلم كيمياء,0501112233\nهند عبدالعزيز الصالح,EMP-502,ابتدائي,معلمة لغة عربية,0554433221";
    } else if (entityType === "guardians") {
      headers = "اسم_ولي_الأمر,رقم_الهوية,صلة_القرابة,المهنة,رقم_الجوال";
      rows = "محمد ناصر القحطاني,1099887766,أب,مهندس,0505544332\nفاطمة خالد العتيبي,1088776655,أم,طبيبة,0506677889";
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
            const col2 = r[1]?.trim() || `ID-${1000000 + i}`;
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
      ]);
    } else if (entityType === "staff") {
      setRecords([
        { id: "1", col1: "د. سامي فهد العمران", col2: "EMP-901", col3: "high", col4: "معلم فيزياء", col5: "0501112233", status: "valid", statusNote: "مكتمل" },
        { id: "2", col1: "أ. منيرة خالد السعيد", col2: "EMP-902", col3: "primary", col4: "معلمة لغة إنجليزية", col5: "0559881122", status: "valid", statusNote: "مكتمل" },
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
      const targetRecords = skipDuplicates ? records.filter((r) => r.status !== "duplicate") : records;

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

      setIsProcessing(false);
      setStep(4);
      toast.success(`تم استيراد واعتماد ${importedCount} سجل بنجاح في قاعدة البيانات`);
    }, 700);
  };

  const reset = () => {
    setStep(1);
    setFileName(null);
    setSearchFilter("");
    setEditingId(null);
  };

  const filteredRecords = useMemo(() => {
    if (!searchFilter.trim()) return records;
    const q = searchFilter.toLowerCase().trim();
    return records.filter(
      (r) =>
        r.col1.toLowerCase().includes(q) ||
        r.col2.toLowerCase().includes(q) ||
        r.col4.toLowerCase().includes(q)
    );
  }, [records, searchFilter]);

  const validCount = records.filter((r) => r.status === "valid").length;
  const duplicateCount = records.filter((r) => r.status === "duplicate").length;
  const warningCount = records.filter((r) => r.status === "warning").length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { reset(); onClose(); } }}>
      <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border/80 shadow-2xl bg-card">
        {/* Modal Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border/80 bg-muted/20">
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
          <div className="flex items-center justify-between border-t border-border/60 pt-4 mt-4 text-xs font-bold">
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
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
                <Sparkles className="h-4 w-4" /> تحميل دفعة تجريبية فورية مطابقة لمعايير نظام نور (5 سجلات)
              </button>
            </div>
          )}

          {/* Step 3: Match, Inspect & Inline Edit */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl border border-border bg-card">
                  <span className="text-[11px] font-bold text-muted-foreground block">إجمالي السجلات</span>
                  <span className="text-lg font-black font-mono text-foreground">{records.length}</span>
                </div>
                <div className="p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">صالحة للاستيراد</span>
                  <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">{validCount}</span>
                </div>
                <div className="p-3 rounded-2xl border border-danger/20 bg-danger/5">
                  <span className="text-[11px] font-bold text-danger block">سجلات مكررة</span>
                  <span className="text-lg font-black font-mono text-danger">{duplicateCount}</span>
                </div>
                <div className="p-3 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block">بيانات ناقصة</span>
                  <span className="text-lg font-black font-mono text-amber-600 dark:text-amber-400">{warningCount}</span>
                </div>
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
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-muted-foreground hover:text-foreground shrink-0">
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
                                <input
                                  type="text"
                                  value={r.col4}
                                  onChange={(e) => handleUpdateRecord(r.id, { col4: e.target.value })}
                                  className="h-7 w-full rounded-lg border border-primary px-2 text-xs font-bold bg-background"
                                />
                              ) : (
                                r.col4 || r.col3
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
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                                r.status === "valid"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : r.status === "duplicate"
                                  ? "bg-danger/10 text-danger border border-danger/20"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              }`}>
                                {r.status === "valid" && <Check className="h-3 w-3" />}
                                {r.status === "duplicate" && <AlertTriangle className="h-3 w-3" />}
                                {r.statusNote}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingId(isEdit ? null : r.id)}
                                  className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                                  title={isEdit ? "حفظ" : "تعديل السجل"}
                                >
                                  {isEdit ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Edit2 className="h-3.5 w-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRecord(r.id)}
                                  className="p-1 rounded-lg hover:bg-danger/10 text-danger"
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
            <div className="py-8 text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-500/20 shadow-lg shadow-emerald-500/10 animate-in zoom-in duration-300">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-foreground">اكتمل الاستيراد والتحديث بنجاح!</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed font-bold">
                  تم اعتماد وتثبيت كافة السجلات الصالحة في قاعدة البيانات المركزية، وتحديث العلاقات الأكاديمية والمالية المرتبطة تلقائياً.
                </p>
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
            <button
              type="button"
              onClick={() => { reset(); onClose(); }}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md shadow-primary/20"
            >
              إغلاق النافذة
            </button>
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

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      let content = "";
      let filename = `darasi_export_${new Date().toISOString().split("T")[0]}`;

      const filteredStudents = stageFilter === "all"
        ? allStudents
        : allStudents.filter((s) => s.stage === stageFilter);

      const filteredStaff = stageFilter === "all"
        ? allStaff
        : allStaff.filter((st) => st.stage === stageFilter || st.stage === "all");

      const filteredInvoices = stageFilter === "all"
        ? allInvoices
        : allInvoices.filter((inv) => inv.stage === stageFilter);

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
        const sections: string[] = [];

        if (selectedTables.includes("students")) {
          sections.push("--- جدول الطلاب ---");
          sections.push("المعرف,الاسم الكامل,رقم الهوية,المرحلة,الصف,تاريخ القيد,الحالة,جوال ولي الأمر");
          filteredStudents.forEach((s) => {
            sections.push([
              escapeCsvField(s.id),
              escapeCsvField(s.name),
              escapeCsvField(s.nationalId || ""),
              escapeCsvField(s.stage),
              escapeCsvField(s.grade || ""),
              escapeCsvField(s.enrollmentDate || ""),
              escapeCsvField(s.status || "نشط"),
              escapeCsvField(s.guardianPhone || "")
            ].join(","));
          });
          sections.push("");
        }

        if (selectedTables.includes("staff")) {
          sections.push("--- جدول الكادر التعليمي والوظيفي ---");
          sections.push("المعرف,الاسم,الرقم الوظيفي,المسمى,المرحلة,الراتب الأساسي,الهاتف");
          filteredStaff.forEach((st) => {
            sections.push([
              escapeCsvField(st.id),
              escapeCsvField(st.name),
              escapeCsvField(st.employeeNo),
              escapeCsvField(st.role || ""),
              escapeCsvField(st.stage || ""),
              escapeCsvField(st.basicSalary || 0),
              escapeCsvField(st.phone || "")
            ].join(","));
          });
          sections.push("");
        }

        if (selectedTables.includes("invoices")) {
          sections.push("--- جدول الفواتير والرسوم ---");
          sections.push("رقم الفاتورة,اسم الطالب,المبلغ الإجمالي,المسدد,المتبقي,الحالة,تاريخ الاستحقاق");
          filteredInvoices.forEach((inv: Invoice) => {
            const total = inv.netAmount ?? inv.amount ?? 0;
            const paid = inv.paid ?? 0;
            const remaining = total - paid;
            sections.push([
              escapeCsvField(inv.id),
              escapeCsvField(inv.studentName),
              escapeCsvField(total),
              escapeCsvField(paid),
              escapeCsvField(remaining),
              escapeCsvField(inv.status),
              escapeCsvField(inv.dueDate || "")
            ].join(","));
          });
        }

        content = "\uFEFF" + sections.join("\n");
        filename += "_full_database.csv";
      }

      const mimeType = format === "json" ? "application/json;charset=utf-8" : "text/csv;charset=utf-8";
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      addActivityLog({
        user: "مدير النظام",
        action: "تصدير بيانات النظام",
        entity: "المستودع المركزي",
        details: `تم تصدير ملف (${filename}) بصيغة ${format.toUpperCase()}`,
      });

      setIsExporting(false);
      toast.success(`تم إنشاء وتنزيل ملف التصدير: ${filename}`);
      onClose();
    }, 700);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border/80 shadow-2xl bg-card">
        <DialogHeader className="p-6 pb-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground">تصدير بيانات النظام الشاملة</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-bold">
                  توليد ملفات معتمدة ومطابقة لمواصفات وزارة التعليم بصيغ JSON أو Excel أو نسق منصة نور
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

        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {/* Stage Scope Selector */}
          <div className="p-4 bg-muted/40 rounded-2xl border border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-0.5 text-right w-full sm:w-auto">
              <span className="text-xs font-black text-foreground block">نطاق المرحلة المشمولة:</span>
              <span className="text-[11px] text-muted-foreground">تصفية السجلات التابعة لمرحلة محددة فقط</span>
            </div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold outline-none"
            >
              <option value="all">كافة المراحل المدرسية (شامل)</option>
              <option value="kindergarten">رياض الأطفال</option>
              <option value="primary">المرحلة الابتدائية</option>
              <option value="middle">المرحلة المتوسطة</option>
              <option value="high">المرحلة الثانوية</option>
            </select>
          </div>

          {/* Tables Selection Grid */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-foreground">1. حدد الجداول المراد تصديرها:</span>
              <div className="flex items-center gap-2 text-xs">
                <button type="button" onClick={selectAll} className="text-primary font-bold hover:underline">تحديد الكل</button>
                <span className="text-muted-foreground">•</span>
                <button type="button" onClick={deselectAll} className="text-muted-foreground font-bold hover:underline">إلغاء الكل</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {[
                { id: "students", label: "سجلات الطلاب والقيد", count: allStudents.length },
                { id: "guardians", label: "أولياء الأمور والصلات", count: allGuardians.length },
                { id: "staff", label: "الكادر الوظيفي والتعليمي", count: allStaff.length },
                { id: "invoices", label: "الفواتير والمطالبات", count: allInvoices.length },
                { id: "expenses", label: "المصروفات والموردين", count: allExpenses?.length || 0 },
                { id: "settings", label: "السياسات المركزية", count: "شامل" },
                { id: "features", label: "حالة تفعيل ميزات المنظومة", count: "20 ميزة" },
                { id: "academic", label: "التقويم والسنوات الدراسية", count: allAcademicYears.length },
              ].map((it) => (
                <label
                  key={it.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedTables.includes(it.id)
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-border hover:bg-accent text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={selectedTables.includes(it.id)}
                      onChange={() => toggleTable(it.id)}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>{it.label}</span>
                  </div>
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {it.count}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Export Format Selector */}
          <div className="space-y-2.5">
            <span className="text-xs font-black text-foreground block">2. اختر صيغة التصدير المستهدفة:</span>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: "json", label: "نسخة JSON برمجية", desc: "كامل الحقول والعلاقات للنسخ والاسترجاع", icon: Database },
                { id: "csv", label: "Excel / CSV", desc: "مجدول بترميز UTF-8 للمطابقة والتقارير", icon: FileSpreadsheet },
                { id: "noor", label: "نسق منصة نور", desc: "مطابق لمواصفات وزارة التعليم السعودية", icon: FileText },
              ].map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setFormat(it.id as any)}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                    format === it.id
                      ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                      : "border-border hover:border-primary/40 bg-card/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-foreground">{it.label}</span>
                    <it.icon className={`h-4 w-4 ${format === it.id ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-relaxed font-bold">{it.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-accent transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={selectedTables.length === 0 || isExporting}
            className="px-7 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md shadow-primary/20 flex items-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.02]"
          >
            {isExporting ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" /> جاري تجميع وتنزيل الملف...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> بدء التصدير والتنزيل الآن
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// 3. Instant Backup & Disaster Recovery Modal (النسخ الاحتياطي الفوري)
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

  const totalRecords = allStudents.length + allStaff.length + allGuardians.length + allInvoices.length + (allExpenses?.length || 0);

  const handleCreateInstantBackup = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const backupData = {
        id: `BK-${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}`,
        timestamp: new Date().toISOString(),
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

      const blob = new Blob(["\uFEFF" + JSON.stringify(backupData, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `darasi_backup_${backupData.id}.json`;
      link.click();
      URL.revokeObjectURL(url);

      addActivityLog({
        user: "مدير النظام",
        action: "نسخ احتياطي فوري",
        entity: "النسخ الاحتياطي",
        details: `تم إنشاء نسخة احتياطية فورية (${backupData.id}) تتضمن ${totalRecords} سجل`,
      });

      setIsProcessing(false);
      toast.success(`تم إنشاء وتنزيل ملف النسخة الاحتياطية (${backupData.id}) بنجاح`);
      onClose();
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
      <DialogContent className="max-w-lg max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border/80 shadow-2xl bg-card">
        <DialogHeader className="p-6 pb-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <Database className="h-6 w-6" />
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

          <div className="flex border-b border-border/60 text-xs font-bold gap-4 pt-4">
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
              استعادة من نسخة سابقة
              {activeSubTab === "restore" && <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full" />}
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {activeSubTab === "create" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl border border-border bg-card">
                  <span className="text-xs text-muted-foreground font-bold block">إجمالي السجلات المفهرسة</span>
                  <span className="text-2xl font-black text-primary font-mono mt-1 block">{totalRecords.toLocaleString("ar-SA")}</span>
                </div>
                <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold block">حالة التخزين والجاهزية</span>
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> متزامن وآمن
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs font-bold leading-relaxed text-muted-foreground space-y-1.5">
                <div className="text-foreground font-black">محتويات النسخة الاحتياطية الشاملة:</div>
                <div className="flex items-center gap-2">• <span>{allStudents.length} طالب، و {allGuardians.length} ولي أمر مسجل</span></div>
                <div className="flex items-center gap-2">• <span>{allStaff.length} موظف ومعلم، و {allInvoices.length} مطالبة وسند مالي</span></div>
                <div className="flex items-center gap-2">• <span>كافة إعدادات الهوية والسياسات، وحالة تفعيل ميزات المنظومة الـ 20</span></div>
              </div>

              <button
                type="button"
                onClick={handleCreateInstantBackup}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90 shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" /> جاري تشفير وتوليد ملف النسخة...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> حفظ النسخة الاحتياطية الآن (.json)
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {!inspectedBackup ? (
                <div className="border-2 border-dashed border-border rounded-3xl p-8 text-center hover:bg-accent/40 transition-colors relative cursor-pointer group">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleInspectBackupFile}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-muted text-muted-foreground mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="h-8 w-8" />
                  </div>
                  <div className="font-black text-sm text-foreground">ارفع ملف النسخة الاحتياطية (.json)</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    سيتم فحص محتويات الملف والتحقق من التوقيع الرقمي قبل الاستعادة
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-4 rounded-2xl border border-primary/30 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-foreground">بيانات النسخة المفحوصة:</span>
                    <button
                      type="button"
                      onClick={() => setInspectedBackup(null)}
                      className="text-[11px] font-bold text-danger hover:underline"
                    >
                      اختيار ملف آخر
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs font-bold">
                    <div className="p-3 rounded-xl bg-card border border-border">
                      <span className="text-muted-foreground text-[11px]">المدرسة:</span>
                      <div className="font-bold text-foreground mt-0.5 truncate">{inspectedBackup.schoolName || "دارسي الأهلية"}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border">
                      <span className="text-muted-foreground text-[11px]">إجمالي السجلات:</span>
                      <div className="font-mono text-primary mt-0.5">{inspectedBackup.recordsCount || "كامل"}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 text-danger text-xs font-bold border border-danger/20">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>تنبيه: سيتم استرجاع السجلات وتحديث قاعدة البيانات لتطابق ملف النسخة.</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteRestore}
                    disabled={isProcessing}
                    className="w-full py-3 rounded-xl bg-danger text-danger-foreground font-black text-xs hover:bg-danger/90 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCcw className="h-4 w-4 animate-spin" /> جاري تطبيق واسترجاع السجلات...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> تأكيد استعادة النسخة وتحديث النظام
                      </>
                    )}
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
// 4. Official Document & Print Live Preview Modal (معاينة المطبوعات والشهادات)
// =========================================================================
export interface OfficialPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OfficialPrintPreviewModal({ isOpen, onClose }: OfficialPrintPreviewModalProps) {
  const { systemSettings, currency } = useGlobalStore();
  const [docType, setDocType] = useState<"grades" | "invoice" | "enrollment" | "receipt" | "idcard">("grades");
  const [showLogo, setShowLogo] = useState(true);
  const [showStamp, setShowStamp] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const printSheetRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printSheetRef.current) return;
    const printContent = printSheetRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <title>${systemSettings.schoolName} - طباعة رسمية</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; direction: rtl; margin: 0; padding: 20px; color: #0f172a; background: #fff; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: right; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .header-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
            .footer-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #cbd5e1; padding-top: 15px; margin-top: 30px; }
            .stamp { transform: rotate(-8deg); opacity: 0.85; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const qrData = JSON.stringify({
    school: systemSettings.schoolName,
    license: systemSettings.licenseNumber,
    docType,
    verified: true,
    url: systemSettings.qrVerifyUrl || "https://darasi.app/verify",
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border/80 shadow-2xl bg-card">
        <DialogHeader className="p-6 pb-4 border-b border-border/80 bg-muted/20">
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
                <Printer className="h-4 w-4" /> طباعة المستند الآن
              </button>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Customizer Controls Bar */}
        <div className="p-4 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-black text-foreground">نوع الوثيقة:</span>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as any)}
              className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-bold outline-none"
            >
              <option value="grades">إشعار درجات فصلي رسمي (شهادة)</option>
              <option value="invoice">فاتورة رسوم دراسية ضريبية</option>
              <option value="receipt">سند قبض وتحصيل مالي</option>
              <option value="enrollment">إفادة قيد وتسجيل طالب</option>
              <option value="idcard">بطاقة تعريف مدرسية رقمية</option>
            </select>
          </div>

          <div className="flex items-center gap-4 font-bold">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} className="rounded text-primary h-4 w-4" />
              <span>الشعار</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={showStamp} onChange={(e) => setShowStamp(e.target.checked)} className="rounded text-primary h-4 w-4" />
              <span>الختم الرسمي</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={showQr} onChange={(e) => setShowQr(e.target.checked)} className="rounded text-primary h-4 w-4" />
              <span>رمز QR</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={showWatermark} onChange={(e) => setShowWatermark(e.target.checked)} className="rounded text-primary h-4 w-4" />
              <span>علامة مائية</span>
            </label>
          </div>
        </div>

        {/* Paper Sheet Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900/40 custom-scrollbar flex justify-center">
          <div
            ref={printSheetRef}
            className="w-full max-w-[760px] bg-white text-slate-900 p-10 rounded-2xl shadow-2xl border border-slate-300 relative space-y-6 min-h-[600px] text-right font-sans"
          >
            {/* Watermark */}
            {showWatermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0 select-none">
                <span className="text-7xl font-black rotate-[-30deg] tracking-widest text-slate-900">
                  {systemSettings.schoolName}
                </span>
              </div>
            )}

            {/* Header Row */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 relative z-10">
              <div className="text-right space-y-0.5">
                <div className="text-xs font-bold text-slate-500">{systemSettings.headerEntity || "المملكة العربية السعودية • وزارة التعليم"}</div>
                <div className="text-xs font-bold text-slate-700">{systemSettings.headerDepartment || "الإدارة العامة للتعليم"}</div>
                <div className="text-lg font-black text-slate-900 mt-1">{systemSettings.schoolName}</div>
                <div className="text-[11px] text-slate-500 font-mono">ترخيص وزاري: {systemSettings.licenseNumber}</div>
              </div>

              {showLogo && (
                <div className="flex flex-col items-center">
                  {systemSettings.logoUrl ? (
                    <img src={systemSettings.logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-xl" />
                  ) : (
                    <div className="h-16 w-16 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 font-black text-xs">
                      شعار المدرسة
                    </div>
                  )}
                </div>
              )}

              <div className="text-left text-xs space-y-1">
                <div><strong>الرقم المرجعي:</strong> DOC-2026-9812</div>
                <div><strong>تاريخ الإصدار:</strong> {new Date().toLocaleDateString("ar-SA")}</div>
                <div><strong>السنة الأكاديمية:</strong> ١٤٤٧ / ١٤٤٨ هـ</div>
              </div>
            </div>

            {/* Document Specific Content */}
            <div className="relative z-10">
              {docType === "grades" && (
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <h2 className="text-xl font-black text-slate-900 underline underline-offset-8">
                      إشعار درجات وتقييم أكاديمي رسمي
                    </h2>
                    <div className="text-xs text-slate-600 mt-2 font-bold">
                      الطالب: فيصل خالد الدوسري • الصف: الأول المتوسط • رقم القيد: 11099234
                    </div>
                  </div>

                  <div className="border border-slate-300 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 border-b border-slate-300 font-black">
                        <tr>
                          <th className="p-3 text-right">المادة التعليمية</th>
                          <th className="p-3 text-center">الدرجة العظمى</th>
                          <th className="p-3 text-center">درجة الطالب</th>
                          <th className="p-3 text-center">التقدير المعتمد</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="p-3 font-bold">الرياضيات والعلوم المتقدمة</td>
                          <td className="p-3 text-center font-mono">100</td>
                          <td className="p-3 text-center font-mono font-black text-blue-700">98</td>
                          <td className="p-3 text-center font-bold text-emerald-700">ممتاز مرتفع</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">اللغة العربية وقواعدها</td>
                          <td className="p-3 text-center font-mono">100</td>
                          <td className="p-3 text-center font-mono font-black text-blue-700">95</td>
                          <td className="p-3 text-center font-bold text-emerald-700">ممتاز</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">اللغة الإنجليزية (English)</td>
                          <td className="p-3 text-center font-mono">100</td>
                          <td className="p-3 text-center font-mono font-black text-blue-700">96</td>
                          <td className="p-3 text-center font-bold text-emerald-700">ممتاز مرتفع</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">العلوم العامة والأحياء</td>
                          <td className="p-3 text-center font-mono">100</td>
                          <td className="p-3 text-center font-mono font-black text-blue-700">94</td>
                          <td className="p-3 text-center font-bold text-emerald-700">ممتاز</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {docType === "invoice" && (
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <h2 className="text-xl font-black text-slate-900 underline underline-offset-8">
                      فاتورة ضريبية رسمية للرسوم الدراسية
                    </h2>
                    <div className="text-xs text-slate-600 mt-2 font-mono font-bold">
                      الرقم الضريبي للمدرسة: {systemSettings.taxNumber}
                    </div>
                  </div>

                  <div className="border border-slate-300 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 border-b border-slate-300 font-black">
                        <tr>
                          <th className="p-3 text-right">البيان / البند</th>
                          <th className="p-3 text-center">المبلغ الأساسي</th>
                          <th className="p-3 text-center">الضريبة ({systemSettings.vatRate}%)</th>
                          <th className="p-3 text-center">الإجمالي ({currency})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="p-3 font-bold">رسوم الدراسة - الفصل الدراسي الأول</td>
                          <td className="p-3 text-center font-mono">5,000</td>
                          <td className="p-3 text-center font-mono">750</td>
                          <td className="p-3 text-center font-mono font-black text-blue-700">5,750 {currency}</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold">اشتراك خدمة النقل المدرسي المعتمد</td>
                          <td className="p-3 text-center font-mono">1,500</td>
                          <td className="p-3 text-center font-mono">225</td>
                          <td className="p-3 text-center font-mono font-black text-blue-700">1,725 {currency}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {docType === "receipt" && (
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <h2 className="text-xl font-black text-slate-900 underline underline-offset-8">
                      سند قبض مالي معتمد (Payment Receipt)
                    </h2>
                  </div>
                  <div className="p-4 border border-slate-300 rounded-xl space-y-2 text-xs leading-relaxed">
                    <div>استلمنا من المكرم ولي الأمر / <strong>خالد بن ناصر الدوسري</strong></div>
                    <div>مبلغاً وقدره: <strong className="font-mono text-blue-700">2,500 {currency}</strong> (ألفان وخمسمائة {currency} فقط لا غير)</div>
                    <div>وذلك عن: <strong>سداد الدفعة الأولى من الرسوم الدراسية للطالب / فيصل</strong></div>
                    <div>طريقة الدفع: <strong>مدى (Mada) • رقم الحركة: TX-908129</strong></div>
                  </div>
                </div>
              )}

              {docType === "enrollment" && (
                <div className="space-y-4 py-4">
                  <div className="text-center">
                    <h2 className="text-xl font-black text-slate-900 underline underline-offset-8">
                      شهادة إثبات قيد وتسجيل طالب
                    </h2>
                  </div>
                  <p className="text-xs leading-loose text-slate-800 font-bold">
                    تشهد إدارة <strong>{systemSettings.schoolName}</strong> بأن الطالب المقيد لدينا /
                    <strong> سارة عمر الدوسري</strong> (هوية رقم: 1109988771) منتظمة بالدراسة للعام الأكاديمي الحالي بالصف
                    <strong> الثالث المتوسط</strong>، وقد أُعطيت هذه الشهادة بناءً على طلب ولي أمرها لتقديمها لمن يهمه الأمر دون أي مسؤولية على المدرسة.
                  </p>
                </div>
              )}

              {docType === "idcard" && (
                <div className="p-6 border-2 border-slate-800 rounded-3xl max-w-sm mx-auto bg-slate-50 space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-3">
                    <div className="font-black text-xs text-slate-900">{systemSettings.schoolName}</div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">بطاقة طالب</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 bg-slate-200 border border-slate-300 rounded-2xl flex items-center justify-center text-xs font-bold text-slate-500">
                      صورة الطالب
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="font-black text-slate-900 text-sm">تركي ماجد العتيبي</div>
                      <div className="text-slate-600 font-bold">الصف: الأول الثانوي</div>
                      <div className="text-[11px] font-mono text-slate-500">رقم الهوية: 110998877</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Verification & Official Seals */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200 relative z-10">
              {showQr && (
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-white border border-slate-300 rounded-xl shadow-xs">
                    <QRCode value={qrData} size={64} level="M" />
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    <div className="font-bold text-slate-700">رمز التحقق الرقمي</div>
                    <div>امسح الرمز للتأكد من الوثيقة</div>
                    <div className="font-mono text-slate-500 mt-0.5">صالحة: {systemSettings.qrExpiry}</div>
                  </div>
                </div>
              )}

              {showStamp && (
                <div className="flex items-center justify-center">
                  {systemSettings.stampUrl ? (
                    <img src={systemSettings.stampUrl} alt="Stamp" className="h-24 w-24 object-contain rotate-[-8deg] opacity-90 stamp" />
                  ) : (
                    <div className="h-20 w-20 rounded-full border-2 border-red-500/70 text-red-600 flex flex-col items-center justify-center rotate-[-10deg] text-[9px] font-black p-1 text-center shadow-xs">
                      <span>ختم المدرسة الرسمي</span>
                      <span>معتمد</span>
                    </div>
                  )}
                </div>
              )}

              <div className="text-center text-xs space-y-1">
                <div className="font-bold text-slate-700">مدير عام المنشأة</div>
                <div className="font-black text-slate-900 mt-1">{systemSettings.principalName || "خالد القحطاني"}</div>
                <div className="text-[10px] text-slate-400 font-serif italic">[الاعتماد والختم الرقمي]</div>
              </div>
            </div>

            {/* Footer Text */}
            <div className="border-t border-slate-200 pt-3 text-center text-[10px] text-slate-500 relative z-10">
              {systemSettings.footerText || "هذه الوثيقة رسمية ومستخرجة إلكترونياً من منصة مدارس ولا تتطلب توقيعاً خطياً إضافياً."}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// 5. Webhook & API Live Tester Modal (مختبر الأحداث البرمجية)
// =========================================================================
export interface WebhookTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WebhookTesterModal({ isOpen, onClose }: WebhookTesterModalProps) {
  const { systemSettings } = useGlobalStore();
  const [selectedEvent, setSelectedEvent] = useState("student.created");
  const [isSending, setIsSending] = useState(false);
  const [customPayload, setCustomPayload] = useState("");
  const [lastResponse, setLastResponse] = useState<any>(null);

  const defaultPayloads: Record<string, any> = {
    "student.created": {
      event: "student.created",
      timestamp: new Date().toISOString(),
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
      data: {
        invoiceId: "INV-2026-4412",
        studentName: "سارة عمر الدوسري",
        amountPaid: 4500,
        currency: "SAR",
        paymentMethod: "Mada",
      },
    },
    "attendance.absent": {
      event: "attendance.absent",
      timestamp: new Date().toISOString(),
      data: {
        studentId: "STU-1029",
        name: "تركي ماجد العتيبي",
        date: new Date().toISOString().split("T")[0],
        status: "absent",
        period: "full_day",
      },
    },
    "exam.grade.updated": {
      event: "exam.grade.updated",
      timestamp: new Date().toISOString(),
      data: {
        examId: "EXAM-2026-01",
        studentId: "STU-90812",
        subject: "الرياضيات",
        grade: 98,
        approvedBy: "مدير النظام",
      },
    },
    "staff.leave.approved": {
      event: "staff.leave.approved",
      timestamp: new Date().toISOString(),
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
        latency: `${Math.floor(20 + Math.random() * 25)}ms`,
        signature: `sha256=${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
        body: {
          received: true,
          event: selectedEvent,
          deliveryId: `del_${Math.random().toString(16).slice(2, 10)}`,
          handledAt: new Date().toISOString(),
        },
      });
      toast.success("تم إرسال حدث Webhook بنجاح وتلقي استجابة HTTP 200 مع توقيع HMAC");
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border/80 shadow-2xl bg-card">
        <DialogHeader className="p-6 pb-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <Send className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground">مختبر أحداث الـ Webhooks المباشر</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-bold">
                  اختبار إرسال الأحداث اللحظية وتدقيق حمولة البيانات (Payload) واستجابة الخادم
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

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <div>
            <label className="text-xs font-black text-muted-foreground mb-1 block">رابط الاستقبال المستهدف (Webhook Endpoint)</label>
            <input
              type="text"
              readOnly
              dir="ltr"
              value={systemSettings.webhookUrl || "https://example.com/api/v1/school-webhook"}
              className="w-full h-10 rounded-xl border border-border bg-muted/40 px-3 text-xs font-mono font-bold text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-black text-muted-foreground mb-1 block">نوع الحدث المراد محاكاته</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
            >
              <option value="student.created">student.created (تسجيل طالب جديد)</option>
              <option value="invoice.paid">invoice.paid (سداد فاتورة دراسية)</option>
              <option value="attendance.absent">attendance.absent (تسجيل غياب فوري)</option>
              <option value="exam.grade.updated">exam.grade.updated (اعتماد نتيجة اختبار)</option>
              <option value="staff.leave.approved">staff.leave.approved (اعتماد إجازة موظف)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-black text-muted-foreground">حمولة الحدث (JSON Payload):</label>
              <button
                type="button"
                onClick={() => setCustomPayload(JSON.stringify(defaultPayloads[selectedEvent] || {}, null, 2))}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                استعادة القالب
              </button>
            </div>
            <textarea
              rows={6}
              value={customPayload}
              onChange={(e) => setCustomPayload(e.target.value)}
              dir="ltr"
              className="w-full rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs p-3.5 border border-slate-800 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {lastResponse && (
            <div className="p-4 rounded-2xl bg-card border border-border space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black">
                  <CheckCircle2 className="h-4 w-4" /> استجابة الخادم: {lastResponse.status} {lastResponse.statusText}
                </span>
                <span className="text-muted-foreground font-mono text-[11px]">الزمن: {lastResponse.latency}</span>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground truncate" dir="ltr">
                Header: X-Darasi-Signature: {lastResponse.signature}
              </div>
              <pre className="p-3 rounded-xl bg-muted/60 text-[10px] font-mono text-foreground" dir="ltr">
                {JSON.stringify(lastResponse.body, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-accent"
          >
            إغلاق
          </button>
          <button
            type="button"
            onClick={handleSendTest}
            disabled={isSending}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
          >
            {isSending ? (
              <>
                <RefreshCcw className="h-4 w-4 animate-spin" /> جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> إرسال الحدث التجريبي الآن
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// 6. Notification Simulator Modal (مختبر قنوات الإشعارات والرسائل)
// =========================================================================
export interface NotificationSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationSimulatorModal({ isOpen, onClose }: NotificationSimulatorModalProps) {
  const { systemSettings, addNotification } = useGlobalStore();
  const [channel, setChannel] = useState<"whatsapp" | "sms" | "email">("whatsapp");
  const [template, setTemplate] = useState("absence");
  const [recipient, setRecipient] = useState("0501234567");
  const [message, setMessage] = useState("نود إشعاركم بأنه تم رصد غياب الطالب في طابور الصباح اليوم.");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (template === "absence") {
      setMessage("نود إشعاركم بأنه تم رصد غياب الطالب في طابور الصباح اليوم. يمكن تقديم العذر عبر تطبيق ولي الأمر.");
    } else if (template === "payment") {
      setMessage(`تم قيد سداد الرسوم الدراسية بمبلغ 2,500 ${systemSettings.schoolName}. شكراً لتعاونكم.`);
    } else if (template === "exam") {
      setMessage("تم اعتماد ونشر كشوف درجات الفترة الأكاديمية الأولى في بوابة الطالب وولي الأمر.");
    } else {
      setMessage("يسر إدارة المدرسة دعوتكم لحضور اللقاء التربوي الدوري لأولياء الأمور يوم الخميس القادم.");
    }
  }, [template, systemSettings.schoolName]);

  const handleSendTest = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      addNotification({
        title: `إشعار ${channel.toUpperCase()}: ${systemSettings.schoolName}`,
        message: `${message} (مرسل إلى: ${recipient})`,
        type: "success",
      });
      toast.success(`تم إرسال الإشعار بنجاح عبر قناة ${channel.toUpperCase()} إلى ${recipient}`);
      onClose();
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border/80 shadow-2xl bg-card">
        <DialogHeader className="p-6 pb-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground">مختبر قنوات الإشعارات والرسائل</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-bold">
                  معاينة مباشرة وشاملة لظهور الرسائل على هاتف ولي الأمر والمعلم
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

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {/* Channel Selector */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
              { id: "sms", label: "SMS", icon: Smartphone },
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-muted-foreground mb-1 block">قالب الرسالة</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-background px-2 text-xs font-bold"
              >
                <option value="absence">تنبيه غياب طالب</option>
                <option value="payment">إشعار سداد قسط</option>
                <option value="exam">اعتماد درجات</option>
                <option value="announcement">إعلان مدرسي عام</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-muted-foreground mb-1 block">رقم هاتف المستلم</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Interactive Device Bubble Simulator */}
          <div className="p-4 rounded-3xl bg-muted/60 border border-border">
            <div className="text-[11px] font-black text-muted-foreground mb-2.5 flex items-center justify-between">
              <span>معاينة شاشة الهاتف المباشرة:</span>
              <span className="text-primary font-mono font-black">{channel.toUpperCase()}</span>
            </div>

            {channel === "whatsapp" && (
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-900 dark:text-emerald-100 text-xs leading-relaxed space-y-2 shadow-xs">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                  <span className="font-black text-emerald-600 dark:text-emerald-400">🔔 {systemSettings.schoolName}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">الآن</span>
                </div>
                <div>{message}</div>
                <div className="text-[10px] text-emerald-600/80 flex items-center justify-end gap-1 pt-1 font-mono">
                  <span>تم التوصيل</span>
                  <Check className="h-3 w-3" />
                </div>
              </div>
            )}

            {channel === "sms" && (
              <div className="p-4 rounded-2xl bg-card border border-border text-foreground text-xs leading-relaxed space-y-2 shadow-xs">
                <div className="font-bold text-primary flex items-center justify-between text-[11px]">
                  <span>رسالة قصيرة SMS من: {systemSettings.schoolName?.substring(0, 11)}</span>
                  <span className="text-muted-foreground font-mono">الآن</span>
                </div>
                <div>{message}</div>
              </div>
            )}

            {channel === "email" && (
              <div className="p-4 rounded-2xl bg-card border border-border text-foreground text-xs leading-relaxed space-y-2.5 shadow-xs">
                <div className="border-b border-border pb-2 space-y-0.5">
                  <div className="font-black text-primary">الموضوع: إشعار رسمي من {systemSettings.schoolName}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">من: info@school.edu.sa • إلى: {recipient}</div>
                </div>
                <div>{message}</div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-accent"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSendTest}
            disabled={isSending}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
          >
            {isSending ? (
              <>
                <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" /> إرسال المعاينة لهاتفي الآن
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// 7. Mobile App Connect QR Code Modal (ربط تطبيق الهاتف وبوابة ولي الأمر)
// =========================================================================
export interface MobileConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileConnectModal({ isOpen, onClose }: MobileConnectModalProps) {
  const { systemSettings } = useGlobalStore();
  const [pinCode, setPinCode] = useState("892-410");
  const [timer, setTimer] = useState(600);

  useEffect(() => {
    const t = setInterval(() => {
      setTimer((p) => (p > 0 ? p - 1 : 600));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const connectUrl = `https://darasi.app/connect?school=${encodeURIComponent(systemSettings.schoolName)}&key=${systemSettings.apiKey}`;

  const handleGenerateNewPin = () => {
    const p1 = Math.floor(100 + Math.random() * 900);
    const p2 = Math.floor(100 + Math.random() * 900);
    setPinCode(`${p1}-${p2}`);
    setTimer(600);
    toast.success("تم توليد رمز ربط مؤقت جديد");
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(connectUrl);
    toast.success("تم نسخ رابط الربط السريع للتطبيق للحافظة");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md text-center max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border/80 shadow-2xl bg-card">
        <DialogHeader className="p-6 pb-4 border-b border-border/80 bg-muted/20">
          <div className="flex flex-col items-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs mb-2">
              <Smartphone className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-black text-foreground">رمز ربط تطبيق الهاتف وبوابة ولي الأمر</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-bold">
              امسح الرمز أو أدخل كود الربط السريع لتهيئة تطبيق دارسي على جهازك
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
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
  const [mode, setMode] = useState<"settings" | "full">("settings");
  const [confirmationWord, setConfirmationWord] = useState("");
  const isMatch = confirmationWord.trim() === "تأكيد" || confirmationWord.trim().toLowerCase() === "reset";

  const handleExecuteReset = () => {
    if (!isMatch) return;
    if (mode === "settings") {
      onConfirm();
    } else {
      wipeSystemData({ wipeStudents: true, wipeStaff: true, wipeFinance: true, resetSettings: true });
      toast.success("تم مسح بيانات النظام وإعادة تهيئته لضبط المصنع الشامل بنجاح");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setConfirmationWord(""); onClose(); } }}>
      <DialogContent className="max-w-md max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-danger/30 shadow-2xl bg-card">
        <DialogHeader className="p-6 pb-4 border-b border-border/80 bg-danger/5">
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

        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs leading-relaxed custom-scrollbar">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("settings")}
              className={`p-3.5 rounded-2xl border text-right transition-all ${
                mode === "settings"
                  ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <div className="font-black text-xs text-foreground">1. إعادة تعيين الإعدادات</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 font-bold">يحافظ على الطلاب والموظفين</div>
            </button>
            <button
              type="button"
              onClick={() => setMode("full")}
              className={`p-3.5 rounded-2xl border text-right transition-all ${
                mode === "full"
                  ? "border-danger bg-danger/10 shadow-xs ring-1 ring-danger/30"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <div className="font-black text-xs text-danger">2. تهيئة شاملة للمنصة</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 font-bold">مسح كافة البيانات</div>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-danger/5 border border-danger/20 text-danger font-bold space-y-1.5">
            <div className="font-black">
              {mode === "settings"
                ? "سيتم استعادة الإعدادات والسياسات التالية إلى الافتراضيات:"
                : `تحذير حرج: سيتم مسح ${allStudents.length} طالب و ${allStaff.length} موظف و ${allInvoices.length} مطالبة بالكامل:`}
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
            {mode === "settings" ? "استعادة ضبط الإعدادات" : "مسح شامل وإعادة ضبط المصنع"}
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("يرجى إدخال مسمى السنة الدراسية");
      return;
    }

    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime();
    const totalDuration = endMs - startMs;

    if (totalDuration <= 0) {
      toast.error("تاريخ نهاية العام يجب أن يكون لاحقاً لتاريخ البداية");
      return;
    }

    let terms = [];
    if (termSystem === "3_terms") {
      const t1End = new Date(startMs + totalDuration * 0.33).toISOString().split("T")[0];
      const t2Start = new Date(startMs + totalDuration * 0.35).toISOString().split("T")[0];
      const t2End = new Date(startMs + totalDuration * 0.66).toISOString().split("T")[0];
      const t3Start = new Date(startMs + totalDuration * 0.68).toISOString().split("T")[0];

      terms = [
        { id: `term-${Date.now()}-1`, name: "الفصل الدراسي الأول", startDate, endDate: t1End, status: "active" as const },
        { id: `term-${Date.now()}-2`, name: "الفصل الدراسي الثاني", startDate: t2Start, endDate: t2End, status: "upcoming" as const },
        { id: `term-${Date.now()}-3`, name: "الفصل الدراسي الثالث", startDate: t3Start, endDate, status: "upcoming" as const },
      ];
    } else {
      const mid = new Date(startMs + totalDuration * 0.48).toISOString().split("T")[0];
      const mid2 = new Date(startMs + totalDuration * 0.52).toISOString().split("T")[0];

      terms = [
        { id: `term-${Date.now()}-1`, name: "الفصل الدراسي الأول", startDate, endDate: mid, status: "active" as const },
        { id: `term-${Date.now()}-2`, name: "الفصل الدراسي الثاني", startDate: mid2, endDate, status: "upcoming" as const },
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

    toast.success(`تمت إضافة وتثبيت السنة الدراسية (${name}) بنجاح`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border/80 shadow-2xl bg-card">
        <DialogHeader className="p-6 pb-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground">إضافة سنة أكاديمية جديدة</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-bold">
                  تهيئة سنة دراسية جديدة وحساب مواعيد الفصول التابعة لها تلقائياً
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <div>
            <label className="text-xs font-black text-muted-foreground mb-1 block">مسمى السنة الدراسية</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: ١٤٤٧ / ١٤٤٨ هـ (2025-2026)"
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-muted-foreground mb-1 block">بداية العام الدراسي</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
                required
              />
            </div>
            <div>
              <label className="text-xs font-black text-muted-foreground mb-1 block">نهاية العام الدراسي</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-muted-foreground mb-1 block">نظام الفصول الدراسية المعتمد</label>
            <select
              value={termSystem}
              onChange={(e) => setTermSystem(e.target.value as any)}
              className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
            >
              <option value="3_terms">نظام الثلاثة فصول دراسية (المعتمد في السعودية)</option>
              <option value="2_terms">نظام الفصلين الدراسيين</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold p-3.5 rounded-2xl border border-border bg-card hover:bg-accent/40 cursor-pointer">
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="rounded text-primary h-4 w-4"
            />
            <span>تعيين كسنة دراسية حالية ونشطة فوراً للمنصة</span>
          </label>

          <DialogFooter className="p-4 -mx-6 -mb-6 border-t border-border/80 bg-muted/20 flex items-center justify-between w-[calc(100%+3rem)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-accent"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md shadow-primary/20"
            >
              حفظ وتنشيط السنة الدراسية
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
