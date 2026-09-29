import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore, Student, StudentGuardianLink, Guardian } from "@/contexts/GlobalStoreContext";
import { 
  User, Phone, MapPin, Printer, GraduationCap, FileText, AlertTriangle, 
  CreditCard, X, ArrowLeft, Mail, Briefcase, MessageSquare, Edit3, 
  Link2, Unlink, Plus, CheckCircle2, AlertCircle, Calendar, Sparkles, 
  ShieldCheck, Bus, ExternalLink, Clock, Search, Trash2, UserCheck, 
  Award, HeartPulse, Check, ShieldAlert, BookOpen, AlertOctagon, TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { FinancialTimeline } from "@/components/financial-components";
import { LuxurySelect, LuxurySelectOption } from "@/components/ui/luxury-select";

export const Route = createFileRoute("/guardians/$id")({
  head: () => ({
    meta: [{ title: "ملف ولي الأمر والأسرة | منصة مدارك" }],
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

function getStageArabicLabel(stage?: string) {
  if (!stage) return "غير محدد";
  const lower = stage.toLowerCase();
  if (lower.includes("pri") || lower === "ابتدائي" || lower === "الابتدائية") return "المرحلة الابتدائية";
  if (lower.includes("int") || lower.includes("prep") || lower === "متوسط" || lower === "المتوسطة") return "المرحلة المتوسطة";
  if (lower.includes("sec") || lower.includes("high") || lower === "ثانوي" || lower === "الثانوية") return "المرحلة الثانوية";
  if (lower.includes("kg") || lower.includes("kinder") || lower === "روضة" || lower === "رياض الأطفال") return "رياض الأطفال";
  return stage;
}

function cleanPhoneForWhatsApp(phone?: string) {
  if (!phone) return "";
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
  const navigate = useNavigate();
  const { 
    currency, allStudents, allInvoices, allPayments, addPayment, 
    allGuardians, updateGuardian, updateStudent, softDeleteGuardian,
    allSections, allStudentEnrollments, allAttendanceRecords, 
    allAttendanceSessions, allBehaviorTransactions, allDisciplineIncidents, 
    allExamResults, allExams, allExamSubjects, allSubjects, systemSettings
  } = useGlobalStore();

  // Dialog states
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLinkStudentOpen, setIsLinkStudentOpen] = useState(false);
  const [isSummonOpen, setIsSummonOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"overview" | "financial" | "attendance">("overview");

  // Payment Form
  const [paymentData, setPaymentData] = useState({
    invoiceId: "",
    studentId: "",
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
    notes: "نرجو الحضور في الموعد المحدد للأهمية القصوى حرصاً على مصلحة الطالب."
  });

  // Edit Guardian Form
  const [editForm, setEditForm] = useState<Guardian | null>(null);
  const [editFormRelationCustom, setEditFormRelationCustom] = useState("");

  // Student Search in Link Modal
  const [linkSearchQuery, setLinkSearchQuery] = useState("");

  // WhatsApp template & text
  const [whatsappTemplate, setWhatsappTemplate] = useState<"dues" | "summon" | "absence" | "custom">("dues");
  const [customMessage, setCustomMessage] = useState("");

  // Section lookup map
  const sectionByIdMap = useMemo(() => {
    const m = new Map<string, string>();
    (allSections || []).forEach(sec => {
      if (sec && sec.id) m.set(sec.id, sec.name);
    });
    return m;
  }, [allSections]);

  // Retrieve Guardian and linked students accurately
  const guardianData = useMemo(() => {
    const guardian = allGuardians.find(g => g.id === id);
    
    // Build index of all active guardians for consistent phone/name lookup
    const activeGuardians = allGuardians.filter(g => !g.isDeleted);
    const guardiansByCleanPhone = new Map<string, string[]>();
    const guardiansByName = new Map<string, string[]>();

    activeGuardians.forEach(g => {
      if (g.phone) {
        const p = g.phone.replace(/\D/g, "");
        if (p.length >= 7) {
          const list = guardiansByCleanPhone.get(p) || [];
          list.push(g.id);
          guardiansByCleanPhone.set(p, list);
        }
      }
      if (g.phoneSecond) {
        const p2 = g.phoneSecond.replace(/\D/g, "");
        if (p2.length >= 7) {
          const list = guardiansByCleanPhone.get(p2) || [];
          list.push(g.id);
          guardiansByCleanPhone.set(p2, list);
        }
      }
      if (g.name) {
        const cleanName = g.name.trim().toLowerCase();
        const list = guardiansByName.get(cleanName) || [];
        list.push(g.id);
        guardiansByName.set(cleanName, list);
      }
    });

    if (guardian) {
      const targetGid = guardian.id;
      const guardianPhoneClean = guardian.phone ? guardian.phone.replace(/\D/g, "") : "";
      const guardianPhoneSecondClean = guardian.phoneSecond ? guardian.phoneSecond.replace(/\D/g, "") : "";

      const matchedStudents: Student[] = [];

      for (const s of allStudents) {
        if (s.isDeleted) continue;
        let matched = false;

        // A. Explicit student.guardians link
        if (s.guardians && s.guardians.length > 0) {
          for (const gl of s.guardians) {
            if (gl.id && gl.id === targetGid) {
              matched = true;
              break;
            }
            if (gl.phone) {
              const cleanP = gl.phone.replace(/\D/g, "");
              if (cleanP && (cleanP === guardianPhoneClean || cleanP === guardianPhoneSecondClean)) {
                matched = true;
                break;
              }
            }
          }
        }

        // B. Direct STU-15K-xxxxx -> GRD-15K-xxxxx or student.guardianId
        if (!matched) {
          const directGid = (s as any).guardianId || (s.id.startsWith("STU-") ? s.id.replace("STU-", "GRD-") : "");
          if (directGid && directGid === targetGid) {
            matched = true;
          }
        }

        // C. Clean phone match
        if (!matched && s.guardianPhone) {
          const cleanP = s.guardianPhone.replace(/\D/g, "");
          if (cleanP && cleanP.length >= 7 && (cleanP === guardianPhoneClean || cleanP === guardianPhoneSecondClean)) {
            matched = true;
          }
        }

        // D. Strict fallback: only if neither has phone AND unique name in system
        if (!matched && !s.guardianPhone && !guardian.phone && s.guardianName) {
          const cleanName = s.guardianName.trim().toLowerCase();
          const gIds = guardiansByName.get(cleanName);
          if (gIds && gIds.length === 1 && gIds[0] === targetGid) {
            matched = true;
          }
        }

        if (matched) {
          matchedStudents.push(s);
        }
      }

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
        students: matchedStudents
      };
    }

    // Fallback for legacy ID passed as phone
    const cleanIdPhone = id.replace(/\D/g, "");
    const students = allStudents.filter(s => {
      if (s.isDeleted) return false;
      const sPhoneClean = (s.guardianPhone || "").replace(/\D/g, "");
      return sPhoneClean === cleanIdPhone || s.guardianPhone === id;
    });

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

  // Financial Calculations
  const studentIds = useMemo(() => guardianData?.students.map(s => s.id) || [], [guardianData]);
  const guardianInvoices = useMemo(() => {
    return allInvoices.filter(inv => studentIds.includes(inv.studentId) && inv.status !== "cancelled");
  }, [allInvoices, studentIds]);

  const totalAmount = useMemo(() => {
    return guardianInvoices.reduce((sum, inv) => sum + (inv.netAmount || inv.amount), 0);
  }, [guardianInvoices]);

  const totalPaid = useMemo(() => {
    return guardianInvoices.reduce((sum, inv) => sum + (inv.paid || 0), 0);
  }, [guardianInvoices]);

  const totalDue = Math.max(0, totalAmount - totalPaid);

  const guardianTransactions = useMemo(() => {
    if (!guardianData) return [];
    const invoices = guardianInvoices.map(i => {
      const student = guardianData.students.find(s => s.id === i.studentId);
      return {
        id: `inv-${i.id}`,
        date: i.issueDate || i.dueDate,
        title: `إصدار فاتورة: ${i.title || "رسوم دراسية"}`,
        subtitle: `للطالب: ${student?.name || "طالب"}`,
        amount: i.netAmount || i.amount,
        type: "expense" as const, 
        currency
      };
    });
    const payments = allPayments.filter(p => p.studentId && studentIds.includes(p.studentId)).map(p => {
      const student = guardianData.students.find(s => s.id === p.studentId);
      const methodLabel = p.method === "cash" ? "نقدي" : p.method === "bank_transfer" ? "حوالة بنكية" : "بطاقة ائتمانية";
      return {
        id: `pay-${p.id}`,
        date: p.date,
        title: `سداد دفعة مالية (${methodLabel})`,
        subtitle: `للطالب: ${student?.name || "طالب"}`,
        amount: p.amount,
        type: "income" as const,
        currency,
        method: p.method
      };
    });
    
    return [...invoices, ...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [guardianInvoices, allPayments, guardianData, studentIds, currency]);

  // Academic & Behavioral Follow-up Data
  const studentByIdMap = useMemo(() => {
    const m = new Map<string, Student>();
    guardianData?.students.forEach(s => m.set(s.id, s));
    return m;
  }, [guardianData]);

  const linkedEnrollmentIds = useMemo(() => {
    const set = new Set<string>();
    if (!guardianData) return set;
    guardianData.students.forEach(s => {
      set.add(s.id);
      (allStudentEnrollments || []).forEach(e => {
        if (e.studentId === s.id) set.add(e.id);
      });
    });
    return set;
  }, [guardianData, allStudentEnrollments]);

  // Attendance Records
  const guardianAttendanceRecords = useMemo(() => {
    if (!guardianData || guardianData.students.length === 0) return [];
    return (allAttendanceRecords || []).filter(rec => 
      linkedEnrollmentIds.has(rec.studentEnrollmentId)
    ).map(rec => {
      let student = studentByIdMap.get(rec.studentEnrollmentId);
      if (!student) {
        const enroll = (allStudentEnrollments || []).find(e => e.id === rec.studentEnrollmentId);
        if (enroll) student = studentByIdMap.get(enroll.studentId);
      }
      return {
        ...rec,
        studentName: student?.name || "طالب",
        studentGrade: student?.grade,
        studentStage: student?.stage,
      };
    }).slice(0, 30);
  }, [guardianData, allAttendanceRecords, linkedEnrollmentIds, studentByIdMap, allStudentEnrollments]);

  // Attendance Summary Stats
  const attendanceStats = useMemo(() => {
    const total = guardianAttendanceRecords.length;
    const present = guardianAttendanceRecords.filter(r => r.status === "PRESENT").length;
    const absent = guardianAttendanceRecords.filter(r => r.status === "ABSENT").length;
    const late = guardianAttendanceRecords.filter(r => r.status === "LATE").length;
    const excused = guardianAttendanceRecords.filter(r => r.status === "EXCUSED" || r.status === "SICK").length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;
    return { total, present, absent, late, excused, rate };
  }, [guardianAttendanceRecords]);

  // Behavior Transactions
  const guardianBehaviorRecords = useMemo(() => {
    if (!guardianData || guardianData.students.length === 0) return [];
    return (allBehaviorTransactions || []).filter(b => 
      linkedEnrollmentIds.has(b.studentEnrollmentId)
    ).map(b => {
      let student = studentByIdMap.get(b.studentEnrollmentId);
      if (!student) {
        const enroll = (allStudentEnrollments || []).find(e => e.id === b.studentEnrollmentId);
        if (enroll) student = studentByIdMap.get(enroll.studentId);
      }
      return {
        ...b,
        studentName: student?.name || "طالب",
      };
    }).slice(0, 20);
  }, [guardianData, allBehaviorTransactions, linkedEnrollmentIds, studentByIdMap, allStudentEnrollments]);

  const totalBehaviorPoints = useMemo(() => {
    return guardianBehaviorRecords.reduce((sum, b) => {
      return b.type === "positive" ? sum + b.points : sum - b.points;
    }, 0);
  }, [guardianBehaviorRecords]);

  // Discipline Incidents
  const guardianDisciplineRecords = useMemo(() => {
    if (!guardianData || guardianData.students.length === 0) return [];
    return (allDisciplineIncidents || []).filter(d => 
      linkedEnrollmentIds.has(d.studentEnrollmentId)
    ).map(d => {
      let student = studentByIdMap.get(d.studentEnrollmentId);
      if (!student) {
        const enroll = (allStudentEnrollments || []).find(e => e.id === d.studentEnrollmentId);
        if (enroll) student = studentByIdMap.get(enroll.studentId);
      }
      return {
        ...d,
        studentName: student?.name || "طالب",
      };
    });
  }, [guardianData, allDisciplineIncidents, linkedEnrollmentIds, studentByIdMap, allStudentEnrollments]);

  // Exam Results
  const guardianExamResults = useMemo(() => {
    if (!guardianData || guardianData.students.length === 0) return [];
    return (allExamResults || []).filter(r => 
      linkedEnrollmentIds.has(r.studentEnrollmentId)
    ).map(r => {
      let student = studentByIdMap.get(r.studentEnrollmentId);
      if (!student) {
        const enroll = (allStudentEnrollments || []).find(e => e.id === r.studentEnrollmentId);
        if (enroll) student = studentByIdMap.get(enroll.studentId);
      }
      const examSubject = (allExamSubjects || []).find(es => es.id === r.examSubjectId);
      const exam = examSubject ? (allExams || []).find(ex => ex.id === examSubject.examId) : null;
      const subject = examSubject ? (allSubjects || []).find(sub => sub.id === examSubject.subjectId) : null;
      return {
        ...r,
        studentName: student?.name || "طالب",
        examName: exam?.name || "اختبار",
        subjectName: subject?.name || "مادة دراسية",
        maxScore: examSubject?.maxScore || 100,
        passScore: examSubject?.passScore || 50,
      };
    }).slice(0, 15);
  }, [guardianData, allExamResults, linkedEnrollmentIds, studentByIdMap, allStudentEnrollments, allExamSubjects, allExams, allSubjects]);

  if (!guardianData) {
    return (
      <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "أولياء الأمور", to: "/guardians" }, { label: "غير موجود" }]}>
        <PageCard>
          <div className="p-12 text-center space-y-4">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
              <User className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-black text-foreground">لم يتم العثور على ملف ولي الأمر المطلوب</h2>
            <p className="text-sm text-muted-foreground font-medium">قد يكون الملف تم أرشفته أو أن الرابط غير صحيح.</p>
            <Link to="/guardians" className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground">
              العودة لقائمة أولياء الأمور
            </Link>
          </div>
        </PageCard>
      </AppShell>
    );
  }

  // Handlers for Link / Unlink Student
  const handleLinkNewStudent = (studentId: string) => {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;

    const existingLinks: StudentGuardianLink[] = student.guardians || [];
    const isPrimary = existingLinks.length === 0;

    const newLink: StudentGuardianLink = {
      id: guardianData.id,
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
    const updatedLinks = existingLinks.filter(l => 
      l.id !== guardianData.id && l.phone !== guardianData.phone && l.name !== guardianData.name
    );

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
    const schoolName = systemSettings?.schoolName || "إدارة المدرسة";
    if (whatsappTemplate === "dues") {
      return `السلام عليكم ورحمة الله وبركاته المكرم ولي الأمر / ${guardianData.name} المحترم،\nنود تذكيركم بوجود مستحقات دراسية متأخرة بمبلغ (${totalDue.toLocaleString()} ${currency}) للطلاب: [${studentNames}]. نرجو التكرم بالسداد في أقرب وقت شاكرين تعاونكم الكريم.\n— ${schoolName}`;
    } else if (whatsappTemplate === "summon") {
      const reasonText = summonData.reason === "أخرى" && summonData.customReason ? summonData.customReason : summonData.reason;
      return `السلام عليكم ورحمة الله وبركاته المكرم ولي الأمر / ${guardianData.name} المحترم،\nترجو إدارة المدرسة من سعادتكم التكرم بزيارة مقر المدرسة يوم (${summonData.date}) في تمام الساعة (${summonData.time}) لمناقشة موضوع: [${reasonText}] للطالب: [${studentNames}].\nشاكرين حرصكم وتجاوبكم الدائم.\n— ${schoolName}`;
    } else if (whatsappTemplate === "absence") {
      return `السلام عليكم ورحمة الله وبركاته المكرم ولي الأمر / ${guardianData.name} المحترم،\nنفيدكم برصد غياب للطالب/ـة [${studentNames}] اليوم دون إشعار مسبق. نرجو التواصل مع إدارة المدرسة لبيان السبب والاطمئنان على الطالب.\n— ${schoolName}`;
    }
    return customMessage;
  };

  const handleSendWhatsApp = () => {
    const cleaned = cleanPhoneForWhatsApp(guardianData.phone);
    if (!cleaned) {
      toast.error("رقم الجوال غير صالح للمراسلة عبر واتساب");
      return;
    }
    const text = whatsappTemplate === "custom" && customMessage ? customMessage : composeWhatsAppMessage();
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setIsWhatsAppOpen(false);
  };

  // Save Edit Guardian
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    const updatedName = editForm.name.trim();
    const updatedPhone = editForm.phone.trim();
    const finalRelation = editForm.relation === "أخرى" && editFormRelationCustom.trim() 
      ? editFormRelationCustom.trim() 
      : editForm.relation;

    updateGuardian(editForm.id, {
      name: updatedName,
      nationalId: editForm.nationalId?.trim() || undefined,
      phone: updatedPhone,
      phoneSecond: editForm.phoneSecond?.trim() || undefined,
      email: editForm.email?.trim() || undefined,
      job: editForm.job?.trim() || undefined,
      relation: finalRelation,
      gender: editForm.gender || "ذكر",
      address: editForm.address?.trim() || undefined,
      notes: editForm.notes?.trim() || undefined,
    });

    // Synchronize all linked students with updated guardian details
    guardianData.students.forEach(student => {
      let isChanged = false;
      const existingLinks: StudentGuardianLink[] = student.guardians || [];
      const updatedLinks = existingLinks.map(link => {
        const isThisGuardian = (link.id && link.id === editForm.id) ||
          (link.phone === guardianData.phone || link.name.trim() === guardianData.name.trim());
        if (isThisGuardian) {
          isChanged = true;
          return {
            ...link,
            name: updatedName,
            phone: updatedPhone,
            phoneSecond: editForm.phoneSecond?.trim() || undefined,
            relation: finalRelation,
            email: editForm.email?.trim() || undefined,
            job: editForm.job?.trim() || undefined,
            address: editForm.address?.trim() || undefined,
          };
        }
        return link;
      });

      const updates: Partial<Student> = {};
      if (isChanged) {
        updates.guardians = updatedLinks;
      }
      if (student.guardianPhone === guardianData.phone || student.guardianName === guardianData.name) {
        updates.guardianName = updatedName;
        updates.guardianPhone = updatedPhone;
        updates.guardianRelation = finalRelation;
      }

      if (Object.keys(updates).length > 0) {
        updateStudent(student.id, updates);
      }
    });

    toast.success("تم تحديث بيانات ولي الأمر ومزامنة سجلات الأبناء المرتبطين بنجاح");
    setIsEditOpen(false);
  };

  // Payment Recording
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentData.invoiceId || paymentData.amount <= 0) {
      toast.error("يرجى اختيار فاتورة صالحة وإدخال مبلغ صحيح");
      return;
    }
    const targetInvoice = allInvoices.find(i => i.id === paymentData.invoiceId);
    const resolvedStudentId = targetInvoice?.studentId || paymentData.studentId || guardianData.students[0]?.id || "";

    addPayment({ 
      invoiceId: paymentData.invoiceId, 
      studentId: resolvedStudentId,
      amount: paymentData.amount, 
      method: paymentData.method, 
      date: new Date().toISOString() 
    });

    toast.success("تم تسجيل الدفعة بنجاح وتحديث الحسابات والمتبقيات");
    setIsPaymentOpen(false);
  };

  // Archive Guardian
  const handleArchiveGuardian = () => {
    softDeleteGuardian(guardianData.id);
    toast.success(`تم أرشفة ملف ولي الأمر "${guardianData.name}" بنجاح`);
    setIsArchiveOpen(false);
    navigate({ to: "/guardians" });
  };

  // Print Templates
  const printTemplates: PrintTemplate[] = [
    {
      id: "guardian-summon",
      name: "إشعار استدعاء رسمي لولي الأمر",
      category: "مراسلات",
      type: "document",
      description: "نموذج استدعاء رسمي معتمد وموثق من إدارة المدرسة لولي الأمر",
      renderDocument: () => (
        <div className="space-y-6 text-base leading-relaxed p-8 border-4 border-double border-gray-400 rounded-2xl bg-white text-black font-sans">
          <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
            <h1 className="text-2xl font-black mb-1">{systemSettings?.headerEntity || "المملكة العربية السعودية • وزارة التعليم"}</h1>
            <h2 className="text-xl font-bold text-gray-700 mb-2">{systemSettings?.schoolName || "مدارس دار البشائر الأهلية"}</h2>
            <p className="text-xs text-gray-500 font-bold mb-3">إدارة التوجيه والإرشاد والشؤون الطلابية</p>
            <span className="inline-block px-5 py-1.5 rounded-full bg-gray-100 border border-gray-300 font-black text-sm">
              إشعار استدعاء رسمي لولي أمر
            </span>
          </div>
          
          <div className="mb-6 flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
              <p className="font-bold text-lg mb-1">المكرم ولي الأمر / {guardianData.name} المحترم</p>
              <p className="text-sm text-gray-600 font-bold">صلة القرابة: {guardianData.relation}</p>
            </div>
            <div className="text-left text-xs font-mono font-bold text-gray-500" dir="ltr">
              رقم التواصل: {guardianData.phone}
            </div>
          </div>

          <p className="text-justify leading-loose text-base">
            السلام عليكم ورحمة الله وبركاته، تحية طيبة وبعد...
            <br />
            ترجو إدارة المدرسة من سعادتكم التكرم بزيارة مقر الإدارة لمقابلة (الموجه الطلابي / وكيل شؤون الطلاب) للأهمية، وذلك لمناقشة موضوع: 
            <span className="font-black text-gray-900 mx-1 underline decoration-2">
              [{summonData.reason === "أخرى" ? summonData.customReason : summonData.reason}]
            </span>
            وذلك في يوم <span className="font-black underline">{summonData.date}</span> في تمام الساعة <span className="font-black underline">{summonData.time}</span>.
          </p>

          <div className="bg-gray-50 p-5 rounded-xl border border-gray-300 my-6">
            <h4 className="font-black text-gray-800 text-sm mb-3">بيانات الأبناء المعنيين:</h4>
            <div className="space-y-2">
              {guardianData.students.map(s => {
                const secName = s.sectionId ? (sectionByIdMap.get(s.sectionId) || s.sectionId) : "أ";
                return (
                  <div key={s.id} className="flex justify-between items-center text-sm font-bold bg-white p-2.5 rounded-lg border border-gray-200">
                    <span>{s.name}</span>
                    <span className="text-gray-600 font-medium">{getStageArabicLabel(s.stage)} • {s.grade} • شعبة ({secName})</span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-sm font-bold text-gray-700 bg-amber-50/50 p-3 rounded-xl border border-amber-200">
            ملاحظات وتوجيهات الإدارة: {summonData.notes || "يرجى التكرم بالالتزام بالموعد المحدد حرصاً على مصلحة الطالب."}
          </p>

          <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-300">
            <div className="text-center">
              <p className="font-bold text-sm mb-2">الختم الرسمي</p>
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-400 mx-auto flex items-center justify-center text-xs text-gray-400 font-bold">
                ختم الإدارة
              </div>
            </div>
            <div className="text-center space-y-8">
              <p className="font-bold text-sm">الموجه الطلابي / وكيل الشؤون</p>
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
      name: "كشف حساب مالي مجمع للأبناء",
      category: "مالي",
      type: "document",
      description: "كشف حساب تفصيلي بجميع الفواتير والمبالغ المسددة والمتبقية",
      renderDocument: () => (
        <div className="p-8 bg-white text-black font-sans">
          <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
            <h1 className="text-2xl font-black mb-1">{systemSettings?.schoolName || "مدارس دار البشائر الأهلية"}</h1>
            <h2 className="text-lg font-bold text-gray-700">كشف حساب مالي تفصيلي مجمع لولي الأمر</h2>
            <p className="font-bold text-gray-600 text-xs mt-1">تاريخ الاستخراج: {new Date().toLocaleDateString("ar-SA")}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-300 mb-6 text-sm">
            <div>
              <p className="text-xs text-gray-500 font-bold">اسم ولي الأمر</p>
              <p className="font-black text-base">{guardianData.name}</p>
              <p className="text-xs text-gray-500 mt-1 font-bold">صلة القرابة: {guardianData.relation}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold">رقم الجوال المعتمد</p>
              <p className="font-mono font-black text-base" dir="ltr">{guardianData.phone}</p>
              {guardianData.nationalId && (
                <p className="text-xs text-gray-500 mt-1 font-mono">الهوية: {guardianData.nationalId}</p>
              )}
            </div>
          </div>

          <table className="w-full border-collapse border border-gray-300 mb-6 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2.5 text-right font-black">اسم الطالب</th>
                <th className="border border-gray-300 p-2.5 text-right font-black">المرحلة والصف</th>
                <th className="border border-gray-300 p-2.5 text-right font-black">إجمالي الرسوم</th>
                <th className="border border-gray-300 p-2.5 text-right font-black">المسدد</th>
                <th className="border border-gray-300 p-2.5 text-right font-black">المتبقي</th>
              </tr>
            </thead>
            <tbody>
              {guardianData.students.map(student => {
                const studentInvoices = guardianInvoices.filter(inv => inv.studentId === student.id);
                const stTotal = studentInvoices.reduce((sum, inv) => sum + (inv.netAmount || inv.amount), 0);
                const stPaid = studentInvoices.reduce((sum, inv) => sum + (inv.paid || 0), 0);
                const stDue = Math.max(0, stTotal - stPaid);

                return (
                  <tr key={student.id}>
                    <td className="border border-gray-300 p-2.5 font-bold">{student.name}</td>
                    <td className="border border-gray-300 p-2.5">{getStageArabicLabel(student.stage)} - {student.grade}</td>
                    <td className="border border-gray-300 p-2.5 tabular-nums font-mono">{stTotal.toLocaleString()} {currency}</td>
                    <td className="border border-gray-300 p-2.5 tabular-nums font-mono text-emerald-700 font-bold">{stPaid.toLocaleString()} {currency}</td>
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
            <p>مستخرج آلياً من النظام المالي الإلكتروني للمدرسة • وثيقة معتمدة صالحة بدون توقيع يدوي</p>
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
              const isPredefined = GUARDIAN_RELATION_OPTIONS.some(o => o.value === guardianData.relation);
              setEditFormRelationCustom(isPredefined ? "" : guardianData.relation);
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

          <button
            onClick={() => setIsArchiveOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20 px-3 text-xs font-bold transition-colors"
            title="أرشفة ملف ولي الأمر"
          >
            <Trash2 className="h-3.5 w-3.5" /> أرشفة
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
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-muted text-muted-foreground border border-border">
                  {guardianData.gender || "ذكر"}
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
                    لا يوجد أبناء مرتبطون بهذا الملف العائلي حالياً.
                  </div>
                ) : (
                  guardianData.students.map(student => {
                    const studentInvoices = guardianInvoices.filter(inv => inv.studentId === student.id);
                    const studentDue = studentInvoices.reduce((sum, inv) => sum + ((inv.netAmount || inv.amount) - (inv.paid || 0)), 0);
                    const secName = student.sectionId ? (sectionByIdMap.get(student.sectionId) || student.sectionId) : "";

                    return (
                      <div 
                        key={student.id} 
                        className="p-3.5 rounded-xl border border-border/70 bg-background hover:border-primary/40 transition-all space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                              {student.name.split(" ")[0][0]}
                            </div>
                            <div>
                              <Link
                                to="/students/$id"
                                params={{ id: student.id }}
                                className="font-black text-xs text-foreground group-hover:text-primary transition-colors flex items-center gap-1"
                              >
                                {student.name}
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                              <p className="text-[10px] text-muted-foreground font-bold mt-0.5">
                                {getStageArabicLabel(student.stage)} • {student.grade} {secName ? `(شعبة ${secName})` : ""}
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
                          <span className={`font-mono font-black tabular-nums ${studentDue > 0 ? "text-danger" : "text-success"}`}>
                            {studentDue > 0 ? `متبقي: ${studentDue.toLocaleString()} ${currency}` : "مسدد بالكامل"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-card rounded-2xl border border-border/80 shadow-xs p-5 space-y-3">
              <h3 className="font-black text-xs text-foreground uppercase tracking-wider">إجراءات سريعة</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const firstUnpaid = guardianInvoices.find(i => i.status !== "paid");
                    const due = firstUnpaid ? (firstUnpaid.netAmount || firstUnpaid.amount) - (firstUnpaid.paid || 0) : totalDue;
                    setPaymentData({
                      invoiceId: firstUnpaid?.id || guardianInvoices[0]?.id || "",
                      studentId: firstUnpaid?.studentId || guardianData.students[0]?.id || "",
                      amount: due > 0 ? due : 0,
                      method: "card"
                    });
                    setIsPaymentOpen(true);
                  }}
                  className="p-2.5 rounded-xl bg-success/10 text-success hover:bg-success/20 border border-success/25 text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CreditCard className="h-3.5 w-3.5" /> تسجيل دفعة
                </button>
                <button
                  onClick={() => setIsSummonOpen(true)}
                  className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/25 text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Clock className="h-3.5 w-3.5" /> استدعاء
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Financial & Academic Tabs */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Tabs Header */}
            <div className="flex gap-2 border-b border-border/60 pb-1 overflow-x-auto">
              <button 
                onClick={() => setActiveTab("overview")} 
                className={`px-4 py-2 text-xs font-black transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "overview" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-4 w-4" /> النظرة العامة والمستحقات
              </button>
              <button 
                onClick={() => setActiveTab("financial")} 
                className={`px-4 py-2 text-xs font-black transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "financial" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <CreditCard className="h-4 w-4" /> كشف الحساب وسجل السداد
              </button>
              <button 
                onClick={() => setActiveTab("attendance")} 
                className={`px-4 py-2 text-xs font-black transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "attendance" 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserCheck className="h-4 w-4" /> المتابعة التربوية والسلوكية والنتائج
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Financial 3 Mini Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-4 bg-card rounded-2xl border border-border/80 shadow-xs">
                    <span className="text-xs font-bold text-muted-foreground mb-1 block">إجمالي الرسوم المجمعة</span>
                    <span className="font-black text-xl tabular-nums tracking-tight font-mono">
                      {totalAmount.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{currency}</span>
                    </span>
                  </div>
                  <div className="p-4 bg-success/10 rounded-2xl border border-success/25 shadow-xs">
                    <span className="text-xs font-bold text-success mb-1 block">إجمالي المسدد</span>
                    <span className="font-black text-xl tabular-nums text-success tracking-tight font-mono">
                      {totalPaid.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{currency}</span>
                    </span>
                  </div>
                  <div className="p-4 bg-danger/10 rounded-2xl border border-danger/25 shadow-xs">
                    <span className="text-xs font-bold text-danger mb-1 block">المتبقي المطلوب</span>
                    <span className="font-black text-xl tabular-nums text-danger tracking-tight font-mono">
                      {totalDue.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{currency}</span>
                    </span>
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
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  للطالب: <span className="font-bold text-foreground">{student?.name || "طالب"}</span> • تاريخ الاستحقاق: <span className="font-mono tabular-nums">{inv.dueDate}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-black text-danger font-mono text-sm tabular-nums">
                                {due.toLocaleString()} {currency}
                              </span>
                              <button 
                                onClick={() => {
                                  setPaymentData({ 
                                    invoiceId: inv.id, 
                                    studentId: inv.studentId,
                                    amount: due, 
                                    method: "card" 
                                  });
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
                        const due = Math.max(0, (inv.netAmount || inv.amount) - (inv.paid || 0));

                        return (
                          <div key={inv.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-colors">
                            <div>
                              <p className="font-black text-xs text-foreground">{inv.title || "الرسوم الدراسية"}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                الطالب: <span className="font-bold">{student?.name || "طالب"}</span> • تاريخ الإصدار: <span className="font-mono">{inv.issueDate}</span>
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
                                    setPaymentData({ 
                                      invoiceId: inv.id, 
                                      studentId: inv.studentId,
                                      amount: due, 
                                      method: "card" 
                                    });
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

            {/* TAB 3: ATTENDANCE, BEHAVIOR & RESULTS */}
            {activeTab === "attendance" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* 4 Summary Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-card rounded-2xl border border-border/80 shadow-xs">
                    <span className="text-[11px] font-bold text-muted-foreground mb-1 block">نسبة الحضور التراكمية</span>
                    <span className="font-black text-xl tabular-nums font-mono text-emerald-600">
                      {attendanceStats.rate}%
                    </span>
                  </div>

                  <div className="p-4 bg-danger/10 rounded-2xl border border-danger/25 shadow-xs">
                    <span className="text-[11px] font-bold text-danger mb-1 block">أيام الغياب</span>
                    <span className="font-black text-xl tabular-nums font-mono text-danger">
                      {attendanceStats.absent} <span className="text-xs font-normal">يوم</span>
                    </span>
                  </div>

                  <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/25 shadow-xs">
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1 block">مرات التأخر</span>
                    <span className="font-black text-xl tabular-nums font-mono text-amber-600 dark:text-amber-400">
                      {attendanceStats.late} <span className="text-xs font-normal">مرة</span>
                    </span>
                  </div>

                  <div className="p-4 bg-primary/10 rounded-2xl border border-primary/25 shadow-xs">
                    <span className="text-[11px] font-bold text-primary mb-1 block">رصيد السلوك والانضباط</span>
                    <span className={`font-black text-xl tabular-nums font-mono ${totalBehaviorPoints >= 0 ? "text-primary" : "text-danger"}`}>
                      {totalBehaviorPoints > 0 ? `+${totalBehaviorPoints}` : totalBehaviorPoints} <span className="text-xs font-normal">نقطة</span>
                    </span>
                  </div>
                </div>

                {/* Attendance History */}
                <PageCard title="سجل الحضور والغياب الأخير للأبناء">
                  {guardianAttendanceRecords.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground font-bold border border-dashed border-border/80 rounded-xl">
                      لا توجد سجلات حضور مسجلة للأبناء مؤخراً.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {guardianAttendanceRecords.map((rec, i) => (
                        <div key={rec.id || i} className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] ${
                              rec.status === "PRESENT" ? "bg-success/10 text-success" :
                              rec.status === "ABSENT" ? "bg-danger/10 text-danger" :
                              rec.status === "LATE" ? "bg-amber-500/10 text-amber-600" :
                              "bg-primary/10 text-primary"
                            }`}>
                              {rec.status === "PRESENT" ? "حاضر" :
                               rec.status === "ABSENT" ? "غائب" :
                               rec.status === "LATE" ? "متأخر" : "مستأذن"}
                            </span>
                            <div>
                              <p className="font-black text-foreground">{rec.studentName}</p>
                              <p className="text-[10px] text-muted-foreground">{rec.studentGrade}</p>
                            </div>
                          </div>

                          <div className="text-left">
                            <p className="font-mono text-muted-foreground tabular-nums text-[11px]">
                              {rec.markedAt ? new Date(rec.markedAt).toLocaleDateString("ar-SA") : "اليوم"}
                            </p>
                            {rec.reason && <p className="text-[10px] text-muted-foreground font-medium">{rec.reason}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </PageCard>

                {/* Behavior & Disciplinary Follow-up */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Behavior Points */}
                  <PageCard title="الملاحظات ونقاط السلوك الإيجابية">
                    {guardianBehaviorRecords.length === 0 ? (
                      <div className="text-center py-6 text-xs text-muted-foreground font-bold border border-dashed border-border/80 rounded-xl">
                        لا توجد ملاحظات سلوكية مسجلة.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {guardianBehaviorRecords.map(b => (
                          <div key={b.id} className="p-2.5 rounded-xl border border-border/70 bg-card text-xs flex justify-between items-center">
                            <div>
                              <p className="font-bold text-foreground">{b.reason || "تعزيز سلوكي"}</p>
                              <p className="text-[10px] text-muted-foreground">للطالب: {b.studentName} • {b.date}</p>
                            </div>
                            <span className={`font-mono font-black text-xs px-2 py-0.5 rounded ${b.type === "positive" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                              {b.type === "positive" ? `+${b.points}` : `-${b.points}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </PageCard>

                  {/* Discipline Incidents */}
                  <PageCard title="المخالفات وقضايا الانضباط">
                    {guardianDisciplineRecords.length === 0 ? (
                      <div className="text-center py-6 text-xs text-success font-bold border border-dashed border-success/30 rounded-xl bg-success/5">
                        <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-1 opacity-80" />
                        سجل الأبناء نظيف تماماً من أي مخالفات أو إنذارات.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {guardianDisciplineRecords.map(d => (
                          <div key={d.id} className="p-2.5 rounded-xl border border-danger/25 bg-danger/5 text-xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-black text-danger">{d.studentName}</span>
                              <span className="font-mono text-[10px] text-muted-foreground">{d.date}</span>
                            </div>
                            <p className="font-medium text-foreground text-[11px]">{d.description}</p>
                            {d.actionTaken && (
                              <p className="text-[10px] font-bold text-muted-foreground">الإجراء: {d.actionTaken}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </PageCard>
                </div>

                {/* Academic Exam Results */}
                <PageCard title="نتائج الاختبارات والتحصيل الأكاديمي">
                  {guardianExamResults.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground font-bold border border-dashed border-border/80 rounded-xl">
                      لا توجد درجات اختبارات مسجلة حالياً.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {guardianExamResults.map(res => {
                        const pct = Math.round((res.mark / res.maxScore) * 100);
                        const isPass = res.mark >= res.passScore;
                        return (
                          <div key={res.id} className="p-3 rounded-xl border border-border/70 bg-card flex justify-between items-center text-xs">
                            <div>
                              <p className="font-black text-foreground">{res.subjectName} - <span className="font-bold text-muted-foreground">{res.examName}</span></p>
                              <p className="text-[10px] text-muted-foreground">للطالب: <span className="font-bold">{res.studentName}</span></p>
                            </div>
                            <div className="text-left flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isPass ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                                {res.descriptiveRating || (isPass ? "ناجح" : "راسب")} ({pct}%)
                              </span>
                              <span className="font-mono font-black tabular-nums text-foreground">
                                {res.mark} / {res.maxScore}
                              </span>
                            </div>
                          </div>
                        );
                      })}
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
              <button onClick={() => setIsPaymentOpen(false)} className="p-1 rounded-full text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-foreground mb-1.5">اختر الفاتورة المراد سدادها <span className="text-danger">*</span></label>
                <select
                  required
                  value={paymentData.invoiceId}
                  onChange={e => {
                    const inv = guardianInvoices.find(i => i.id === e.target.value);
                    const due = inv ? (inv.netAmount || inv.amount) - (inv.paid || 0) : 0;
                    setPaymentData({
                      ...paymentData,
                      invoiceId: e.target.value,
                      studentId: inv?.studentId || "",
                      amount: due > 0 ? due : paymentData.amount
                    });
                  }}
                  className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs font-bold"
                >
                  <option value="">-- اختر الفاتورة --</option>
                  {guardianInvoices.map(inv => {
                    const st = guardianData.students.find(s => s.id === inv.studentId);
                    const due = (inv.netAmount || inv.amount) - (inv.paid || 0);
                    return (
                      <option key={inv.id} value={inv.id}>
                        {inv.title || "رسوم دراسية"} - {st?.name || "طالب"} (متبقي: {due.toLocaleString()} {currency})
                      </option>
                    );
                  })}
                </select>
              </div>

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
              <button onClick={() => setIsEditOpen(false)} className="p-1 rounded-full text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
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
                  <label className="block text-xs font-black text-foreground mb-1.5">صلة القرابة <span className="text-danger">*</span></label>
                  <LuxurySelect
                    label=""
                    value={editForm.relation}
                    onChange={(val) => setEditForm({ ...editForm, relation: val })}
                    options={GUARDIAN_RELATION_OPTIONS}
                    placeholder="صلة القرابة"
                    icon={User}
                    size="md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">الجنس</label>
                  <select
                    value={editForm.gender || "ذكر"}
                    onChange={e => setEditForm({ ...editForm, gender: e.target.value as "ذكر" | "أنثى" })}
                    className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs font-bold"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
              </div>

              {editForm.relation === "أخرى" && (
                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">حدد صلة القرابة يدوياً</label>
                  <input
                    type="text"
                    value={editFormRelationCustom}
                    onChange={e => setEditFormRelationCustom(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs font-bold"
                    placeholder="مثال: وصي معتمد، خال شقيق..."
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">رقم الجوال الأساسي <span className="text-danger">*</span></label>
                  <input 
                    required
                    type="tel" 
                    value={editForm.phone} 
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs font-mono tabular-nums font-bold"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">جوال إضافي (بديل)</label>
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
                  <label className="block text-xs font-black text-foreground mb-1.5">المهنة / جهة العمل</label>
                  <input 
                    type="text" 
                    value={editForm.job || ""} 
                    onChange={e => setEditForm({ ...editForm, job: e.target.value })}
                    className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    value={editForm.email || ""} 
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">عنوان السكن</label>
                  <input 
                    type="text" 
                    value={editForm.address || ""} 
                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full h-10 rounded-xl border border-border/80 bg-background px-3 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-foreground mb-1.5">ملاحظات إضافية</label>
                <textarea 
                  rows={2}
                  value={editForm.notes || ""} 
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-border/80 bg-background p-3 text-xs font-medium"
                />
              </div>

              <div className="pt-3 flex gap-3 border-t border-border/60">
                <button type="submit" className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs">
                  حفظ التعديلات ومزامنة الأبناء
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
              <button onClick={() => setIsLinkStudentOpen(false)} className="p-1 rounded-full text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="ابحث باسم الطالب أو رقم الهوية..."
                  value={linkSearchQuery}
                  onChange={e => setLinkSearchQuery(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border/80 bg-background pr-10 pl-3 text-xs font-bold"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 border border-border/70 rounded-xl p-2 bg-muted/20">
                {allStudents
                  .filter(st => 
                    !st.isDeleted &&
                    !guardianData.students.some(ls => ls.id === st.id) &&
                    (!linkSearchQuery.trim() || 
                      st.name.toLowerCase().includes(linkSearchQuery.toLowerCase()) || 
                      st.nationalId?.includes(linkSearchQuery)
                    )
                  )
                  .slice(0, 10)
                  .map(st => (
                    <div key={st.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border/60 hover:border-primary/50 transition-colors">
                      <div>
                        <p className="text-xs font-bold text-foreground">{st.name}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{getStageArabicLabel(st.stage)} • {st.grade}</p>
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
              <button onClick={() => setIsSummonOpen(false)} className="p-1 rounded-full text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
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
                <label className="block text-xs font-black text-foreground mb-1.5">ملاحظات وتوجيهات الإدارة</label>
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
              <button onClick={() => setIsWhatsAppOpen(false)} className="p-1 rounded-full text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-foreground mb-1.5">اختر قالب الرسالة</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWhatsappTemplate("dues");
                      setCustomMessage("");
                    }}
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
                    onClick={() => {
                      setWhatsappTemplate("summon");
                      setCustomMessage("");
                    }}
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
                    onClick={() => {
                      setWhatsappTemplate("absence");
                      setCustomMessage("");
                    }}
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
                      if (!customMessage) setCustomMessage(composeWhatsAppMessage());
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

      {/* MODAL: ARCHIVE CONFIRMATION */}
      {isArchiveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-md modal-card-luxury my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/60 flex items-center justify-between bg-danger/10">
              <div className="flex items-center gap-2.5 text-danger">
                <AlertOctagon className="h-5 w-5" />
                <h2 className="text-base font-black">تأكيد أرشفة ملف ولي الأمر</h2>
              </div>
              <button onClick={() => setIsArchiveOpen(false)} className="p-1 rounded-full text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-foreground font-bold leading-relaxed">
                هل أنت متأكد من رغبتك في أرشفة ملف ولي الأمر <span className="font-black text-danger">"{guardianData.name}"</span>؟
              </p>
              <div className="p-3 bg-muted/30 rounded-xl border border-border text-[11px] text-muted-foreground space-y-1">
                <p>• سيتم نقل الملف إلى سلة المحذوفات ويمكن استعادته لاحقاً.</p>
                <p>• لن يتم حذف سجلات الطلاب أو القيود المالية المرتبطة.</p>
              </div>

              <div className="pt-3 flex gap-3 border-t border-border/60">
                <button
                  onClick={handleArchiveGuardian}
                  className="flex-1 rounded-xl bg-danger py-2.5 text-xs font-black text-white hover:bg-danger/90 transition-colors shadow-xs"
                >
                  تأكيد الأرشفة
                </button>
                <button
                  onClick={() => setIsArchiveOpen(false)}
                  className="px-5 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent"
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
