import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore, Student, StudentGuardianLink, Guardian } from "@/contexts/GlobalStoreContext";
import { 
  User, Phone, MapPin, Printer, GraduationCap, FileText, AlertTriangle, 
  CreditCard, X, ArrowLeft, Mail, Briefcase, MessageSquare, Edit3, 
  Link2, Unlink, Plus, CheckCircle2, AlertCircle, Calendar, Sparkles, 
  ShieldCheck, Bus, ExternalLink, Clock, Search
} from "lucide-react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { FinancialTimeline } from "@/components/financial-components";
import { LuxurySelect, LuxurySelectOption } from "@/components/ui/luxury-select";

export const Route = createFileRoute("/guardians/$id")({
  head: () => ({
    meta: [{ title: "ملف ولي الأمر | منصة مدارس" }],
  }),
  component: GuardianProfile,
});

const GUARDIAN_RELATION_OPTIONS: LuxurySelectOption[] = [
  { value: "أب", label: "أب (الوالد)", icon: User, badge: "أساسي", badgeTone: "primary" },
  { value: "أم", label: "أم (الوالدة)", icon: User, badge: "أساسي", badgeTone: "primary" },
  { value: "أخ", label: "أخ", icon: User },
  { value: "أخت", label: "أخت", icon: User },
  { value: "عم", label: "عم (شقيق الوالد)", icon: User },
  { value: "عمة", label: "عمة (شقيقة الوالد)", icon: User },
  { value: "خال", label: "خال (شقيق الوالدة)", icon: User },
  { value: "خالة", label: "خالة (شقيقة الوالدة)", icon: User },
  { value: "جد", label: "جد", icon: User },
  { value: "جدة", label: "جدة", icon: User },
  { value: "ابن عم / قريب", label: "ابن عم / قريب", icon: User },
  { value: "زوج الأم / زوجة الأب", label: "زوج الأم / زوجة الأب", icon: User },
  { value: "وصي قانوني", label: "وصي قانوني / كفيل", icon: ShieldCheck, badge: "قانوني", badgeTone: "warning" },
  { value: "سائق خاص", label: "سائق خاص / مرافق", icon: Bus, badge: "خدمات", badgeTone: "muted" },
  { value: "أخرى", label: "أخرى (تحديد يدوي مخصص...)", badge: "يدوي", badgeTone: "primary", icon: Sparkles },
];

const PAYMENT_METHODS: LuxurySelectOption[] = [
  { value: "cash", label: "نقدي (كاش)", icon: CreditCard },
  { value: "card", label: "شبكة (مدى / بطاقة ائتمانية)", icon: CreditCard, badge: "إلكتروني", badgeTone: "primary" },
  { value: "bank_transfer", label: "حوالة بنكية", icon: CreditCard, badge: "بنكي", badgeTone: "muted" },
  { value: "cheque", label: "شيك بنكي مصدق", icon: FileText },
];

function cleanPhoneForWhatsApp(phone: string) {
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("05")) {
    cleaned = "966" + cleaned.substring(1);
  } else if (cleaned.startsWith("09") || cleaned.startsWith("01")) {
    cleaned = "249" + cleaned.substring(1);
  }
  return cleaned;
}

function GuardianProfile() {
  const { id } = Route.useParams();
  const { 
    currency, allStudents, allInvoices, allPayments, addPayment, 
    allGuardians, updateGuardian, updateStudent 
  } = useGlobalStore();

  // Dialog states
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLinkStudentOpen, setIsLinkStudentOpen] = useState(false);
  const [isSummonOpen, setIsSummonOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"overview" | "financial" | "attendance">("overview");

  // Payment Form
  const [paymentData, setPaymentData] = useState({
    invoiceId: "",
    amount: 0,
    method: "card" as "cash" | "bank_transfer" | "card" | "cheque"
  });

  // Summon Form
  const [summonData, setSummonData] = useState({
    studentId: "",
    reason: "متابعة المستوى الدراسي والتحصيلي",
    customReason: "",
    date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    time: "10:00 صباحاً",
    notes: "نرجو الحضور في الموعد المحدد للأهمية القصوى."
  });

  // Edit Guardian Form
  const [editForm, setEditForm] = useState<Guardian | null>(null);

  // Student Search in Link Modal
  const [linkSearchQuery, setLinkSearchQuery] = useState("");

  // WhatsApp template & text
  const [whatsappTemplate, setWhatsappTemplate] = useState<"dues" | "summon" | "absence" | "custom">("dues");
  const [customMessage, setCustomMessage] = useState("");

  // Retrieve Guardian and linked students accurately
  const guardianData = useMemo(() => {
    const guardian = allGuardians.find(g => g.id === id);
    
    if (guardian) {
      const students = allStudents.filter(s => {
        if (s.isDeleted) return false;
        if (s.guardianPhone === guardian.phone && s.guardianPhone) return true;
        if (guardian.phoneSecond && s.guardianPhone === guardian.phoneSecond) return true;
        if (s.guardianName && s.guardianName.trim().toLowerCase() === guardian.name.trim().toLowerCase()) return true;
        if (s.guardians && s.guardians.length > 0) {
          return s.guardians.some(gl => 
            (gl.phone && (gl.phone === guardian.phone || (guardian.phoneSecond && gl.phone === guardian.phoneSecond))) ||
            (gl.phoneSecond && (gl.phoneSecond === guardian.phone || (guardian.phoneSecond && gl.phoneSecond === guardian.phoneSecond))) ||
            (gl.name && gl.name.trim().toLowerCase() === guardian.name.trim().toLowerCase())
          );
        }
        return false;
      });

      return {
        id: guardian.id,
        name: guardian.name,
        nationalId: guardian.nationalId || "",
        phone: guardian.phone,
        phoneSecond: guardian.phoneSecond || "",
        email: guardian.email || "",
        job: guardian.job || "",
        relation: guardian.relation,
        gender: guardian.gender || "ذكر",
        address: guardian.address || "غير محدد",
        notes: guardian.notes || "",
        students: students
      };
    }

    // Fallback for legacy ID passed as phone
    const students = allStudents.filter(s => s.guardianPhone === id && !s.isDeleted);
    if (students.length === 0) return null;
    
    return {
      id: students[0].guardianPhone || "G-LEGACY",
      name: students[0].guardianName || "غير محدد",
      nationalId: "",
      phone: students[0].guardianPhone || "غير محدد",
      phoneSecond: "",
      email: "",
      job: "",
      relation: students[0].guardianRelation || "ولي أمر",
      gender: "ذكر" as "ذكر" | "أنثى",
      address: students[0].address || "غير محدد",
      notes: "",
      students: students
    };
  }, [id, allStudents, allGuardians]);

  if (!guardianData) {
    return (
      <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "أولياء الأمور", to: "/guardians" }, { label: "غير موجود" }]}>
        <PageCard>
          <div className="p-12 text-center space-y-4">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
              <User className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-black text-foreground">لم يتم العثور على ملف ولي الأمر المطلوب</h2>
            <p className="text-sm text-muted-foreground font-medium">قد يكون الملف تم حذفه أو أن الرابط غير صحيح.</p>
            <Link to="/guardians" className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground">
              العودة لقائمة أولياء الأمور
            </Link>
          </div>
        </PageCard>
      </AppShell>
    );
  }

  // Financial Calculations
  const studentIds = guardianData.students.map(s => s.id);
  const guardianInvoices = allInvoices.filter(inv => studentIds.includes(inv.studentId) && inv.status !== "cancelled");
  const totalAmount = guardianInvoices.reduce((sum, inv) => sum + (inv.netAmount || inv.amount), 0);
  const totalPaid = guardianInvoices.reduce((sum, inv) => sum + (inv.paid || 0), 0);
  const totalDue = totalAmount - totalPaid;

  const guardianTransactions = useMemo(() => {
    const invoices = guardianInvoices.map(i => {
      const student = guardianData.students.find(s => s.id === i.studentId);
      return {
        id: `inv-${i.id}`,
        date: i.issueDate || i.dueDate,
        title: `إصدار فاتورة: ${i.title}`,
        subtitle: `للطالب: ${student?.name || "طالب"}`,
        amount: i.netAmount || i.amount,
        type: "expense" as const, 
        currency
      };
    });
    const payments = allPayments.filter(p => p.studentId && studentIds.includes(p.studentId)).map(p => {
      const student = guardianData.students.find(s => s.id === p.studentId);
      return {
        id: `pay-${p.id}`,
        date: p.date,
        title: `سداد دفعة مالية`,
        subtitle: `للطالب: ${student?.name || "طالب"} - ${p.method === "cash" ? "نقدي" : p.method === "bank_transfer" ? "حوالة بنكية" : "بطاقة ائتمانية"}`,
        amount: p.amount,
        type: "income" as const,
        currency,
        method: p.method
      };
    });
    
    return [...invoices, ...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [guardianInvoices, allPayments, guardianData, studentIds, currency]);

  // Handlers for Link / Unlink Student
  const handleLinkNewStudent = (studentId: string) => {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;

    const existingLinks: StudentGuardianLink[] = student.guardians || [];
    const isPrimary = existingLinks.length === 0;

    const newLink: StudentGuardianLink = {
      id: `GL-${Math.floor(1000 + Math.random() * 9000)}`,
      name: guardianData.name,
      relation: guardianData.relation,
      phone: guardianData.phone,
      phoneSecond: guardianData.phoneSecond,
      email: guardianData.email,
      job: guardianData.job,
      isPrimary,
      address: guardianData.address,
    };

    updateStudent(student.id, {
      guardians: [...existingLinks, newLink],
      ...(isPrimary ? {
        guardianName: guardianData.name,
        guardianPhone: guardianData.phone,
        guardianRelation: guardianData.relation,
      } : {})
    });

    toast.success(`تم ربط الطالب "${student.name}" بنجاح`);
    setIsLinkStudentOpen(false);
  };

  const handleUnlinkStudent = (studentId: string) => {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;

    const existingLinks: StudentGuardianLink[] = student.guardians || [];
    const updatedLinks = existingLinks.filter(l => l.phone !== guardianData.phone && l.name !== guardianData.name);

    const newPrimary = updatedLinks.find(l => l.isPrimary) || updatedLinks[0];

    updateStudent(student.id, {
      guardians: updatedLinks,
      guardianName: newPrimary ? newPrimary.name : "",
      guardianPhone: newPrimary ? newPrimary.phone : "",
      guardianRelation: newPrimary ? newPrimary.relation : "",
    });

    toast.success(`تم فك ارتباط الطالب "${student.name}"`);
  };

  // WhatsApp Message Composer
  const composeWhatsAppMessage = () => {
    const studentNames = guardianData.students.map(s => s.name).join("، ") || "أبنائكم";
    if (whatsappTemplate === "dues") {
      return `السلام عليكم ورحمة الله وبركاته المكرم ولي الأمر / ${guardianData.name} المحترم،\nنود تذكيركم بوجود مستحقات دراسية متأخرة بمبلغ (${totalDue.toLocaleString()} ${currency}) للطلاب: [${studentNames}]. نرجو التكرم بالسداد في أقرب وقت شاكرين تعاونكم الكريم.`;
    } else if (whatsappTemplate === "summon") {
      return `السلام عليكم ورحمة الله وبركاته المكرم ولي الأمر / ${guardianData.name} المحترم،\nترجو إدارة المدرسة من سعادتكم التكرم بزيارة المدرسة يوم (${summonData.date}) في تمام الساعة (${summonData.time}) لمناقشة موضوع: [${summonData.reason}] للطالب: [${studentNames}].\nشاكرين حرصكم وتجاوبكم الدائم.`;
    } else if (whatsappTemplate === "absence") {
      return `السلام عليكم ورحمة الله وبركاته المكرم ولي الأمر / ${guardianData.name} المحترم،\nنفيدكم بغياب الطالب/ـة [${studentNames}] عن اليوم الدراسي دون إشعار مسبق. نرجو منكم التواصل مع المدرسة لبيان السبب والاطمئنان على الطالب.`;
    }
    return customMessage;
  };

  const handleSendWhatsApp = () => {
    const cleaned = cleanPhoneForWhatsApp(guardianData.phone);
    if (!cleaned) {
      toast.error("رقم الجوال غير صالح للمراسلة");
      return;
    }
    const text = whatsappTemplate === "custom" ? customMessage : composeWhatsAppMessage();
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setIsWhatsAppOpen(false);
  };

  // Save Edit Guardian
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    updateGuardian(editForm.id, {
      name: editForm.name.trim(),
      nationalId: editForm.nationalId?.trim() || undefined,
      phone: editForm.phone.trim(),
      phoneSecond: editForm.phoneSecond?.trim() || undefined,
      email: editForm.email?.trim() || undefined,
      job: editForm.job?.trim() || undefined,
      relation: editForm.relation,
      address: editForm.address?.trim() || undefined,
      notes: editForm.notes?.trim() || undefined,
    });

    toast.success("تم تحديث بيانات ولي الأمر بنجاح");
    setIsEditOpen(false);
  };

  // Print Templates
  const printTemplates: PrintTemplate[] = [
    {
      id: "guardian-summon",
      name: "إشعار استدعاء ولي أمر رسمي",
      category: "مراسلات",
      type: "document",
      description: "نموذج استدعاء رسمي معتمد من إدارة المدرسة لولي الأمر",
      renderDocument: () => (
        <div className="space-y-6 text-base leading-relaxed p-8 border-4 border-double border-gray-400 rounded-2xl bg-white text-black font-sans">
          <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
            <h1 className="text-2xl font-black mb-1">المملكة العربية السعودية • وزارة التعليم</h1>
            <h2 className="text-xl font-bold text-gray-700 mb-2">إدارة التوجيه والإرشاد وشؤون الطلاب</h2>
            <span className="inline-block px-4 py-1 rounded-full bg-gray-100 border border-gray-300 font-bold text-sm">
              إشعار استدعاء ولي أمر رسمي
            </span>
          </div>
          
          <div className="mb-6">
            <p className="font-bold text-lg mb-2">المكرم ولي الأمر / {guardianData.name} المحترم، ({guardianData.relation})</p>
            <p className="text-gray-700">السلام عليكم ورحمة الله وبركاته، تحية طيبة وبعد...</p>
          </div>

          <p className="text-justify leading-loose">
            نأمل من سعادتكم التكرم بزيارة مقر إدارة المدرسة، وذلك لمقابلة (الموجه الطلابي / وكيل شؤون الطلاب) للأهمية، لمناقشة موضوع: 
            <span className="font-black text-gray-900 mx-1">[{summonData.reason === "أخرى" ? summonData.customReason : summonData.reason}]</span>
            وذلك يوم <span className="font-bold underline">{summonData.date}</span> في تمام الساعة <span className="font-bold underline">{summonData.time}</span>.
          </p>

          <div className="bg-gray-50 p-5 rounded-xl border border-gray-300 my-6">
            <h4 className="font-bold text-gray-800 text-sm mb-2">بيانات الأبناء المعنيين:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm font-bold">
              {guardianData.students.map(s => (
                <li key={s.id}>{s.name} - {s.stage} ({s.grade}) - شعبة {s.sectionId || "1"}</li>
              ))}
            </ul>
          </div>

          <p className="text-sm font-bold text-gray-600">
            ملاحظات إضافية: {summonData.notes || "يرجى التكرم بالالتزام بالموعد المحدد حرصاً على مصلحة الطالب."}
          </p>

          <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-300">
            <div className="text-center">
              <p className="font-bold text-sm mb-2">ختم المدرسة الرسمي</p>
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-400 mx-auto flex items-center justify-center text-xs text-gray-400">
                الختم
              </div>
            </div>
            <div className="text-center space-y-8">
              <p className="font-bold text-sm">وكيل شؤون الطلاب / الموجه الطلابي</p>
              <p className="text-gray-400 text-xs">.......................................</p>
            </div>
            <div className="text-center space-y-8">
              <p className="font-bold text-sm">مدير المدرسة</p>
              <p className="text-gray-400 text-xs">.......................................</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "financial-statement",
      name: "كشف حساب مالي شامل للأبناء",
      category: "مالي",
      type: "document",
      description: "كشف حساب تفصيلي بجميع الرسوم والمبالغ المسددة والمتبقية",
      renderDocument: () => (
        <div className="p-8 bg-white text-black font-sans">
          <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
            <h1 className="text-2xl font-black mb-1">كشف حساب مالي مجمع لولي الأمر</h1>
            <p className="font-bold text-gray-600 text-xs">التاريخ: {new Date().toLocaleDateString("ar-SA")}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-300 mb-6 text-sm">
            <div>
              <p className="text-xs text-gray-500 font-bold">اسم ولي الأمر</p>
              <p className="font-black text-base">{guardianData.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold">رقم الجوال</p>
              <p className="font-mono font-black text-base" dir="ltr">{guardianData.phone}</p>
            </div>
          </div>

          <table className="w-full border-collapse border border-gray-300 mb-6 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2.5 text-right font-bold">اسم الطالب</th>
                <th className="border border-gray-300 p-2.5 text-right font-bold">الصف</th>
                <th className="border border-gray-300 p-2.5 text-right font-bold">المستحق الكلي</th>
                <th className="border border-gray-300 p-2.5 text-right font-bold">المسدد</th>
                <th className="border border-gray-300 p-2.5 text-right font-bold">المتبقي</th>
              </tr>
            </thead>
            <tbody>
              {guardianData.students.map(student => {
                const studentInvoices = guardianInvoices.filter(inv => inv.studentId === student.id);
                const stTotal = studentInvoices.reduce((sum, inv) => sum + (inv.netAmount || inv.amount), 0);
                const stPaid = studentInvoices.reduce((sum, inv) => sum + (inv.paid || 0), 0);
                const stDue = stTotal - stPaid;

                return (
                  <tr key={student.id}>
                    <td className="border border-gray-300 p-2.5 font-bold">{student.name}</td>
                    <td className="border border-gray-300 p-2.5">{student.grade}</td>
                    <td className="border border-gray-300 p-2.5 tabular-nums font-mono">{stTotal.toLocaleString()} {currency}</td>
                    <td className="border border-gray-300 p-2.5 tabular-nums font-mono text-emerald-700">{stPaid.toLocaleString()} {currency}</td>
                    <td className="border border-gray-300 p-2.5 tabular-nums font-mono text-red-600 font-black">{stDue.toLocaleString()} {currency}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-black text-sm">
                <td colSpan={2} className="border border-gray-300 p-2.5 text-left">الإجمالي المجمع:</td>
                <td className="border border-gray-300 p-2.5 tabular-nums font-mono">{totalAmount.toLocaleString()} {currency}</td>
                <td className="border border-gray-300 p-2.5 tabular-nums font-mono text-emerald-700">{totalPaid.toLocaleString()} {currency}</td>
                <td className="border border-gray-300 p-2.5 tabular-nums font-mono text-red-600">{totalDue.toLocaleString()} {currency}</td>
              </tr>
            </tfoot>
          </table>

          <div className="text-center mt-12 text-xs font-bold text-gray-500">
            <p>مستخرج آلياً من النظام المالي الإلكتروني للمدرسة • صالح بدون توقيع يدوي</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <AppShell 
      breadcrumb={[
        { label: "الرئيسية", to: "/" }, 
        { label: "أولياء الأمور", to: "/guardians" },
        { label: guardianData.name }
      ]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditForm({
                id: guardianData.id,
                name: guardianData.name,
                nationalId: guardianData.nationalId,
                phone: guardianData.phone,
                phoneSecond: guardianData.phoneSecond,
                email: guardianData.email,
                job: guardianData.job,
                relation: guardianData.relation,
                gender: guardianData.gender,
                address: guardianData.address,
                notes: guardianData.notes,
              });
              setIsEditOpen(true);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-card px-3 text-xs font-bold text-foreground hover:bg-accent border border-border/80 shadow-xs transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5 text-muted-foreground" /> تعديل البيانات
          </button>

          <button
            onClick={() => setIsSummonOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 text-xs font-bold hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
          >
            <Clock className="h-3.5 w-3.5" /> استدعاء رسمي
          </button>

          <button
            onClick={() => {
              setWhatsappTemplate(totalDue > 0 ? "dues" : "summon");
              setIsWhatsAppOpen(true);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 text-xs font-bold hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" /> واتساب فوري
          </button>

          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" /> طباعة المستندات
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-300">
        
        {/* Profile Luxury Header Card */}
        <div className="relative rounded-3xl overflow-hidden bg-card border border-border/70 shadow-xs">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary/25 via-primary/10 to-transparent"></div>
          
          <div className="relative p-6 pt-10 sm:p-8 sm:pt-14 flex flex-col sm:flex-row items-center sm:items-end gap-5">
            <div className="h-24 w-24 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-4xl font-black shadow-lg border-4 border-background z-10 shrink-0">
              <User className="h-12 w-12" />
            </div>

            <div className="flex-1 text-center sm:text-right space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-foreground">{guardianData.name}</h1>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-primary/15 text-primary border border-primary/25">
                  {guardianData.relation}
                </span>
                {guardianData.nationalId && (
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-muted text-muted-foreground border border-border">
                    هوية: {guardianData.nationalId}
                  </span>
                )}
                {guardianData.job && (
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-muted text-muted-foreground border border-border flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> {guardianData.job}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-muted-foreground font-bold">
                <a 
                  href={`tel:${guardianData.phone}`}
                  className="flex items-center gap-1.5 bg-background/80 px-3 py-1 rounded-lg border border-border hover:text-primary transition-colors tabular-nums font-mono"
                  dir="ltr"
                >
                  <Phone className="h-3.5 w-3.5 text-primary" /> {guardianData.phone}
                </a>

                {guardianData.phoneSecond && (
                  <span className="flex items-center gap-1.5 bg-background/80 px-3 py-1 rounded-lg border border-border tabular-nums font-mono" dir="ltr">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {guardianData.phoneSecond}
                  </span>
                )}

                {guardianData.email && (
                  <span className="flex items-center gap-1.5 bg-background/80 px-3 py-1 rounded-lg border border-border">
                    <Mail className="h-3.5 w-3.5 text-primary" /> {guardianData.email}
                  </span>
                )}

                <span className="flex items-center gap-1.5 bg-background/80 px-3 py-1 rounded-lg border border-border">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> {guardianData.address}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Linked Students Card */}
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <h2 className="font-black text-sm text-foreground">الأبناء المرتبطون ({guardianData.students.length})</h2>
                </div>
                <button
                  onClick={() => setIsLinkStudentOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> ربط طالب
                </button>
              </div>

              <div className="space-y-3">
                {guardianData.students.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-border/80 text-center text-xs text-muted-foreground font-bold">
                    لا يوجد أبناء مرتبطون بهذا الولي حتى الآن.
                  </div>
                ) : (
                  guardianData.students.map(student => {
                    const studentInvoices = guardianInvoices.filter(inv => inv.studentId === student.id);
                    const studentDue = studentInvoices.reduce((sum, inv) => sum + ((inv.netAmount || inv.amount) - (inv.paid || 0)), 0);

                    return (
                      <div 
                        key={student.id} 
                        className="p-3.5 rounded-xl border border-border/70 bg-background hover:border-primary/40 transition-all space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {student.name.split(" ")[0][0]}
                            </div>
                            <div>
                              <Link
                                to="/students/$id"
                                params={{ id: student.id }}
                                className="font-bold text-xs text-foreground group-hover:text-primary transition-colors flex items-center gap-1"
                              >
                                {student.name}
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                              <p className="text-[10px] text-muted-foreground">
                                {student.stage} • {student.grade} {student.sectionId ? `(شعبة ${student.sectionId})` : ""}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleUnlinkStudent(student.id)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                            title="فك الارتباط"
                          >
                            <Unlink className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${student.status === "نشط" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                            {student.status || "نشط"}
                          </span>
                          <span className={`font-mono font-bold tabular-nums ${studentDue > 0 ? "text-danger" : "text-success"}`}>
                            {studentDue > 0 ? `متبقي: ${studentDue.toLocaleString()} ${currency}` : "مسدد بالكامل"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Financial & Communication Tabs */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Tabs Header */}
            <div className="flex gap-2 border-b border-border/60 pb-1">
              <button 
                onClick={() => setActiveTab("overview")} 
                className={`px-4 py-2 text-xs font-black transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === "overview" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4" /> النظرة العامة والمستحقات
              </button>
              <button 
                onClick={() => setActiveTab("financial")} 
                className={`px-4 py-2 text-xs font-black transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === "financial" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <CreditCard className="h-4 w-4" /> كشف الحساب وسجل السداد
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Financial 3 Mini Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 bg-card rounded-2xl border border-border/80 shadow-xs">
                    <span className="text-xs font-bold text-muted-foreground mb-1 block">إجمالي الرسوم المستحقة</span>
                    <span className="font-black text-xl tabular-nums tracking-tight">{totalAmount.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{currency}</span></span>
                  </div>
                  <div className="p-4 bg-success/10 rounded-2xl border border-success/25 shadow-xs">
                    <span className="text-xs font-bold text-success mb-1 block">إجمالي المسدد</span>
                    <span className="font-black text-xl tabular-nums text-success tracking-tight">{totalPaid.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{currency}</span></span>
                  </div>
                  <div className="p-4 bg-danger/10 rounded-2xl border border-danger/25 shadow-xs">
                    <span className="text-xs font-bold text-danger mb-1 block">المتبقي المطلوب</span>
                    <span className="font-black text-xl tabular-nums text-danger tracking-tight">{totalDue.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{currency}</span></span>
                  </div>
                </div>

                {/* Urgent Dues */}
                <PageCard title="المستحقات العاجلة ومواعيد السداد">
                  <div className="space-y-3">
                    {guardianInvoices.filter(inv => inv.status !== "paid").length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground font-bold border border-dashed border-border/80 rounded-2xl bg-muted/10">
                        <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2 opacity-80" />
                        لا توجد متأخرات مالية مستحقة. جميع حسابات الأبناء مسددة بالكامل.
                      </div>
                    ) : (
                      guardianInvoices.filter(inv => inv.status !== "paid").map(inv => {
                        const student = guardianData.students.find(s => s.id === inv.studentId);
                        const due = (inv.netAmount || inv.amount) - (inv.paid || 0);

                        return (
                          <div key={inv.id} className="p-4 rounded-xl border border-warning/30 bg-warning/5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-warning/20 text-warning-foreground rounded-xl shrink-0">
                                <AlertTriangle className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-black text-xs text-foreground">{inv.title || "الرسوم الدراسية"}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  للطالب: <span className="font-bold text-foreground">{student?.name}</span> • تاريخ الاستحقاق: <span className="font-mono tabular-nums">{inv.dueDate}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-black text-danger font-mono text-sm tabular-nums">
                                {due.toLocaleString()} {currency}
                              </span>
                              <button 
                                onClick={() => {
                                  setPaymentData({ invoiceId: inv.id, amount: due, method: "card" });
                                  setIsPaymentOpen(true);
                                }}
                                className="inline-flex h-8 items-center gap-1 rounded-xl bg-success text-white px-3 text-xs font-black hover:bg-success/90 transition-colors shadow-xs"
                              >
                                سداد
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </PageCard>
              </div>
            )}

            {/* TAB 2: FINANCIAL TIMELINE & INVOICES */}
            {activeTab === "financial" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* All Invoices Table */}
                <PageCard title="جميع الفواتير والمستحقات المدرسية">
                  <div className="space-y-2.5">
                    {guardianInvoices.length === 0 ? (
                      <div className="text-center py-6 text-xs text-muted-foreground font-bold border border-dashed border-border/80 rounded-xl">
                        لا توجد فواتير مسجلة لأبناء هذا الولي.
                      </div>
                    ) : (
                      guardianInvoices.map(inv => {
                        const student = guardianData.students.find(s => s.id === inv.studentId);
                        const due = (inv.netAmount || inv.amount) - (inv.paid || 0);

                        return (
                          <div key={inv.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-colors">
                            <div>
                              <p className="font-black text-xs text-foreground">{inv.title || "الرسوم الدراسية"}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                الطالب: <span className="font-bold">{student?.name}</span> • تاريخ الإصدار: <span className="font-mono">{inv.issueDate}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-left">
                                <p className="font-black text-xs tabular-nums font-mono">{(inv.netAmount || inv.amount).toLocaleString()} {currency}</p>
                                <p className={`text-[10px] font-bold ${inv.status === "paid" ? "text-success" : inv.status === "partial" ? "text-warning" : "text-danger"}`}>
                                  {inv.status === "paid" ? "مدفوعة بالكامل" : inv.status === "partial" ? `متبقي ${due.toLocaleString()}` : "غير مدفوعة"}
                                </p>
                              </div>

                              {inv.status !== "paid" && (
                                <button 
                                  onClick={() => {
                                    setPaymentData({ invoiceId: inv.id, amount: due, method: "card" });
                                    setIsPaymentOpen(true);
                                  }}
                                  className="h-8 px-3 rounded-xl bg-success/10 text-success text-xs font-black hover:bg-success/20 transition-colors border border-success/20"
                                >
                                  سداد
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </PageCard>

                {/* Financial Timeline */}
                <PageCard title="سجل الحركات المالية المجمع (Timeline)">
                  {guardianTransactions.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground font-bold border border-dashed border-border/80 rounded-xl">
                      لا توجد حركات مالية مسجلة بعد.
                    </div>
                  ) : (
                    <div className="p-2">
                      <FinancialTimeline transactions={guardianTransactions} />
                    </div>
                  )}
                </PageCard>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* MODAL: RECORD PAYMENT */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-md modal-card-luxury my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/60 flex items-center justify-between bg-success/10">
              <div className="flex items-center gap-2.5 text-success">
                <CreditCard className="h-5 w-5" />
                <h2 className="text-base font-black">تسجيل دفعة سداد لولي الأمر</h2>
              </div>
              <button onClick={() => setIsPaymentOpen(false)} className="p-1 rounded-full text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                addPayment({ 
                  invoiceId: paymentData.invoiceId, 
                  amount: paymentData.amount, 
                  method: paymentData.method, 
                  date: new Date().toISOString() 
                });
                toast.success("تم تسجيل الدفعة بنجاح وتحديث الحسابات");
                setIsPaymentOpen(false);
              }} 
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-black text-foreground mb-1.5">المبلغ المحصل ({currency}) <span className="text-danger">*</span></label>
                <input 
                  required 
                  type="number" 
                  min="1" 
                  value={paymentData.amount || ""} 
                  onChange={e => setPaymentData({ ...paymentData, amount: Number(e.target.value) })} 
                  className="w-full h-11 rounded-xl border border-border/80 bg-background px-4 font-mono font-black text-lg text-success tabular-nums focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20" 
                />
              </div>

              <div>
                <LuxurySelect
                  label="طريقة الدفع"
                  value={paymentData.method}
                  onChange={(val) => setPaymentData({ ...paymentData, method: val as any })}
                  options={PAYMENT_METHODS}
                  placeholder="اختر طريقة الدفع"
                  icon={CreditCard}
                  size="md"
                  required
                />
              </div>

              <div className="pt-3 flex gap-3 border-t border-border/60">
                <button type="submit" className="flex-1 rounded-xl bg-success py-2.5 text-xs font-black text-white hover:bg-success/90 transition-colors shadow-xs">
                  تأكيد تسجيل السداد
                </button>
                <button type="button" onClick={() => setIsPaymentOpen(false)} className="px-5 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent transition-colors">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT GUARDIAN */}
      {isEditOpen && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-lg modal-card-luxury my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/60 flex items-center justify-between bg-primary/10">
              <div className="flex items-center gap-2.5 text-primary">
                <Edit3 className="h-5 w-5" />
                <h2 className="text-base font-black text-foreground">تعديل بيانات ولي الأمر</h2>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="p-1 rounded-full text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-black text-foreground mb-1.5">الاسم الرباعي <span className="text-danger">*</span></label>
                <input 
                  required
                  type="text" 
                  value={editForm.name} 
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">رقم الهوية الوطنية</label>
                  <input 
                    type="text" 
                    value={editForm.nationalId || ""} 
                    onChange={e => setEditForm({ ...editForm, nationalId: e.target.value })}
                    className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs font-mono tabular-nums"
                    dir="ltr"
                  />
                </div>
                <div>
                  <LuxurySelect
                    label="صلة القرابة"
                    value={editForm.relation}
                    onChange={(val) => setEditForm({ ...editForm, relation: val })}
                    options={GUARDIAN_RELATION_OPTIONS}
                    placeholder="صلة القرابة"
                    icon={User}
                    size="md"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">رقم الجوال <span className="text-danger">*</span></label>
                  <input 
                    required
                    type="tel" 
                    value={editForm.phone} 
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs font-mono tabular-nums"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">جوال إضافي</label>
                  <input 
                    type="tel" 
                    value={editForm.phoneSecond || ""} 
                    onChange={e => setEditForm({ ...editForm, phoneSecond: e.target.value })}
                    className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs font-mono tabular-nums"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">المهنة</label>
                  <input 
                    type="text" 
                    value={editForm.job || ""} 
                    onChange={e => setEditForm({ ...editForm, job: e.target.value })}
                    className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    value={editForm.email || ""} 
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-foreground mb-1.5">العنوان</label>
                <input 
                  type="text" 
                  value={editForm.address || ""} 
                  onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs"
                />
              </div>

              <div className="pt-3 flex gap-3 border-t border-border/60">
                <button type="submit" className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs">
                  حفظ التعديلات
                </button>
                <button type="button" onClick={() => setIsEditOpen(false)} className="px-5 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent transition-colors">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LINK STUDENT */}
      {isLinkStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-md modal-card-luxury my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/60 flex items-center justify-between bg-primary/10">
              <div className="flex items-center gap-2.5 text-primary">
                <Link2 className="h-5 w-5" />
                <h2 className="text-base font-black text-foreground">ربط طالب بولي الأمر</h2>
              </div>
              <button onClick={() => setIsLinkStudentOpen(false)} className="p-1 rounded-full text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="ابحث باسم الطالب..."
                  value={linkSearchQuery}
                  onChange={e => setLinkSearchQuery(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border/80 bg-background pr-10 pl-3 text-xs font-bold"
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 border border-border/70 rounded-xl p-2 bg-muted/20">
                {allStudents
                  .filter(st => 
                    !guardianData.students.some(ls => ls.id === st.id) &&
                    (!linkSearchQuery.trim() || st.name.toLowerCase().includes(linkSearchQuery.toLowerCase()))
                  )
                  .slice(0, 10)
                  .map(st => (
                    <div key={st.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border/60 hover:border-primary/50 transition-colors">
                      <div>
                        <p className="text-xs font-bold text-foreground">{st.name}</p>
                        <p className="text-[10px] text-muted-foreground">{st.stage} • {st.grade}</p>
                      </div>
                      <button
                        onClick={() => handleLinkNewStudent(st.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 transition-colors shadow-xs"
                      >
                        <Plus className="h-3 w-3" /> ربط
                      </button>
                    </div>
                  ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button onClick={() => setIsLinkStudentOpen(false)} className="px-5 py-2 rounded-xl bg-card border border-border text-xs font-bold hover:bg-accent">
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OFFICIAL SUMMON GENERATOR */}
      {isSummonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-lg modal-card-luxury my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/60 flex items-center justify-between bg-amber-500/10">
              <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
                <Clock className="h-5 w-5" />
                <h2 className="text-base font-black text-foreground">إعداد إشعار استدعاء رسمي</h2>
              </div>
              <button onClick={() => setIsSummonOpen(false)} className="p-1 rounded-full text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-foreground mb-1.5">سبب الاستدعاء</label>
                <select
                  value={summonData.reason}
                  onChange={e => setSummonData({ ...summonData, reason: e.target.value })}
                  className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs font-bold"
                >
                  <option value="متابعة المستوى الدراسي والتحصيلي">متابعة المستوى الدراسي والتحصيلي</option>
                  <option value="مناقشة السلوك والانضباط الصفي">مناقشة السلوك والانضباط الصفي</option>
                  <option value="تأخر دراسي أو غياب متكرر">تأخر دراسي أو غياب متكرر</option>
                  <option value="مراجعة المستحقات والرسوم الدراسية">مراجعة المستحقات والرسوم الدراسية</option>
                  <option value="مقابلة الإدارة أو المرشد الطلابي">مقابلة الإدارة أو المرشد الطلابي</option>
                  <option value="أخرى">أخرى (تحديد يدوي)</option>
                </select>
              </div>

              {summonData.reason === "أخرى" && (
                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">السبب يدوياً</label>
                  <input
                    type="text"
                    value={summonData.customReason}
                    onChange={e => setSummonData({ ...summonData, customReason: e.target.value })}
                    className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs font-bold"
                    placeholder="حدد سبب الاستدعاء..."
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">تاريخ الموعد المطلوب</label>
                  <input
                    type="date"
                    value={summonData.date}
                    onChange={e => setSummonData({ ...summonData, date: e.target.value })}
                    className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">وقت الموعد</label>
                  <input
                    type="text"
                    value={summonData.time}
                    onChange={e => setSummonData({ ...summonData, time: e.target.value })}
                    className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs font-bold"
                    placeholder="10:00 صباحاً"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-foreground mb-1.5">ملاحظات الإدارة بالإشعار</label>
                <textarea
                  rows={3}
                  value={summonData.notes}
                  onChange={e => setSummonData({ ...summonData, notes: e.target.value })}
                  className="w-full rounded-xl border border-border/80 bg-background p-3 text-xs font-medium"
                />
              </div>

              <div className="pt-3 flex gap-3 border-t border-border/60">
                <button
                  onClick={() => {
                    setIsSummonOpen(false);
                    setIsPrintOpen(true);
                  }}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Printer className="h-4 w-4" /> فتح ومعاينة الطباعة
                </button>
                <button
                  onClick={() => setIsSummonOpen(false)}
                  className="px-5 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WHATSAPP MESSENGER */}
      {isWhatsAppOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-lg modal-card-luxury my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/60 flex items-center justify-between bg-emerald-500/10">
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                <MessageSquare className="h-5 w-5" />
                <h2 className="text-base font-black text-foreground">مراسلة واتساب فورية</h2>
              </div>
              <button onClick={() => setIsWhatsAppOpen(false)} className="p-1 rounded-full text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-foreground mb-1.5">اختر قالب الرسالة</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setWhatsappTemplate("dues")}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      whatsappTemplate === "dues" 
                        ? "bg-danger/10 border-danger text-danger font-black shadow-xs" 
                        : "bg-background border-border/80 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    مطالبة مالية
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhatsappTemplate("summon")}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      whatsappTemplate === "summon" 
                        ? "bg-primary/10 border-primary text-primary font-black shadow-xs" 
                        : "bg-background border-border/80 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    استدعاء رسمي
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhatsappTemplate("absence")}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      whatsappTemplate === "absence" 
                        ? "bg-amber-500/10 border-amber-500 text-amber-600 font-black shadow-xs" 
                        : "bg-background border-border/80 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    إشعار غياب
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWhatsappTemplate("custom");
                      if (!customMessage) setCustomMessage(`السلام عليكم ورحمة الله وبركاته المكرم ولي الأمر / ${guardianData.name} المحترم،\n`);
                    }}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      whatsappTemplate === "custom" 
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 font-black shadow-xs" 
                        : "bg-background border-border/80 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    رسالة مخصصة
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-foreground mb-1.5">نص الرسالة</label>
                <textarea
                  rows={5}
                  value={whatsappTemplate === "custom" ? customMessage : composeWhatsAppMessage()}
                  onChange={(e) => {
                    setWhatsappTemplate("custom");
                    setCustomMessage(e.target.value);
                  }}
                  className="w-full rounded-xl border border-border/80 bg-background p-3 text-xs font-medium focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed"
                />
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
                <span className="font-bold text-muted-foreground">رقم الهاتف المرسل إليه:</span>
                <span className="font-mono font-bold text-foreground tabular-nums" dir="ltr">
                  {guardianData.phone}
                </span>
              </div>

              <div className="pt-3 flex gap-3 border-t border-border/60">
                <button
                  onClick={handleSendWhatsApp}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 text-xs font-black text-white hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" /> فتح المحادثة عبر واتساب
                </button>
                <button
                  onClick={() => setIsWhatsAppOpen(false)}
                  className="px-6 rounded-xl border border-border/80 bg-card text-xs font-bold hover:bg-accent"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT ENGINE */}
      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title={`ملف ولي الأمر: ${guardianData.name}`}
        data={[]}
        templates={printTemplates}
      />
    </AppShell>
  );
}
