import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useTransition } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore, Student, Guardian, StudentGuardianLink } from "@/contexts/GlobalStoreContext";
import { useStage, EducationalStage, GRADE_OPTIONS } from "@/contexts/StageContext";
import { DataTable } from "@/components/data-table";
import { getGradesForStage } from "@/lib/school-structure";
import { 
  Users, User, UserPlus, Phone, PhoneCall, MessageSquare, Eye, Edit3, 
  Printer, Search, ArrowUpDown, Filter, Wallet, AlertCircle, CheckCircle2, 
  X, Link2, Unlink, Plus, Sparkles, ShieldCheck, Bus, GraduationCap, 
  Layers3, ExternalLink, Briefcase, Mail, MapPin, BadgeCheck, FileText
} from "lucide-react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { LuxurySelect, LuxurySelectOption } from "@/components/ui/luxury-select";
import { toast } from "sonner";

export const Route = createFileRoute("/guardians/")({
  head: () => ({
    meta: [
      { title: "أولياء الأمور | منصة مدارس" },
      { name: "description", content: "إدارة بيانات أولياء الأمور وربطهم بالطلاب بدقة متناهية مع خيارات القرابة والتواصل والمالية." },
    ],
  }),
  component: GuardiansList,
});

// Comprehensive Kinship Options matching the student registration system
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

const STAGE_OPTIONS: LuxurySelectOption[] = [
  { value: "all", label: "جميع المراحل الدراسية", icon: GraduationCap },
  { value: "kindergarten", label: "رياض الأطفال", icon: GraduationCap, badge: "KG", badgeTone: "muted" },
  { value: "primary", label: "المرحلة الابتدائية", icon: GraduationCap, badge: "ابتدائي", badgeTone: "primary" },
  { value: "middle", label: "المرحلة المتوسطة", icon: GraduationCap, badge: "متوسط", badgeTone: "warning" },
  { value: "high", label: "المرحلة الثانوية", icon: GraduationCap, badge: "ثانوي", badgeTone: "success" },
];

const FINANCIAL_STATUS_OPTIONS: LuxurySelectOption[] = [
  { value: "all", label: "الكل (جميع الأوضاع المالية)", icon: Wallet },
  { value: "hasDues", label: "عليهم متأخرات مالية فقط", icon: AlertCircle, badge: "متأخرات", badgeTone: "danger" },
  { value: "noDues", label: "مسددين بالكامل (حسابات سليمة)", icon: CheckCircle2, badge: "مسدد", badgeTone: "success" },
];

const SORT_OPTIONS: LuxurySelectOption[] = [
  { value: "name", label: "الاسم (أبجدياً أ - ي)", icon: ArrowUpDown },
  { value: "childrenCount", label: "عدد الأبناء (الأكثر أولاً)", icon: Users },
  { value: "dues", label: "المتأخرات المالية (الأعلى أولاً)", icon: Wallet },
];

function getRelationColor(relation: string) {
  if (relation.includes("أب") || relation === "أب") return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
  if (relation.includes("أم") || relation === "أم") return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
  if (relation.includes("وصي") || relation.includes("كفيل")) return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  if (relation.includes("سائق")) return "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20";
  if (relation.includes("جد")) return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
  return "bg-muted text-muted-foreground border-border/60";
}

function cleanPhoneForWhatsApp(phone: string) {
  let cleaned = phone.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("05")) {
    cleaned = "966" + cleaned.substring(1);
  } else if (cleaned.startsWith("09") || cleaned.startsWith("01")) {
    cleaned = "249" + cleaned.substring(1);
  }
  return cleaned;
}

function GuardiansList() {
  const { allGuardians, allStudents, allSections, addGuardian, updateGuardian, updateStudent, allInvoices, currency } = useGlobalStore();
  const { stage, setStage } = useStage();
  
  // Modals state
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
  const [linkingGuardian, setLinkingGuardian] = useState<{ guardian: Guardian; linkedStudents: Student[] } | null>(null);
  const [whatsappGuardian, setWhatsappGuardian] = useState<{ guardian: Guardian; students: Student[]; totalDue: number } | null>(null);

  // New Guardian Form State
  const [newGuardian, setNewGuardian] = useState({
    name: "",
    nationalId: "",
    phone: "",
    phoneSecond: "",
    email: "",
    job: "",
    relation: "أب",
    customRelation: "",
    gender: "ذكر" as "ذكر" | "أنثى",
    address: "",
    notes: "",
    selectedStudentIds: [] as string[]
  });

  // WhatsApp template state
  const [whatsappTemplate, setWhatsappTemplate] = useState<"dues" | "summon" | "absence" | "custom">("dues");
  const [customMessage, setCustomMessage] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [filterSection, setFilterSection] = useState<string>("all");
  const [filterDues, setFilterDues] = useState<"all" | "hasDues" | "noDues">("all");
  const [sortBy, setSortBy] = useState<"name" | "childrenCount" | "dues">("name");

  // Student search inside linking modal
  const [studentSearchInModal, setStudentSearchInModal] = useState("");

  const [isPending, startTransition] = useTransition();
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearchQuery(searchQuery);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const activeGuardians = useMemo(() => allGuardians.filter(g => !g.isDeleted), [allGuardians]);

  // Robust bidirectional student matching map
  const studentsByGuardianMap = useMemo(() => {
    const map = new Map<string, Student[]>();
    
    // Initialize map
    activeGuardians.forEach(g => {
      map.set(g.id, []);
    });

    // Match each student to guardians
    allStudents.forEach(s => {
      if (s.isDeleted) return;

      activeGuardians.forEach(g => {
        let isMatched = false;

        // 1. Check primary guardian phone or secondary phone
        if (g.phone && (s.guardianPhone === g.phone || (g.phoneSecond && s.guardianPhone === g.phoneSecond))) {
          isMatched = true;
        }

        // 2. Check primary guardian name
        if (!isMatched && g.name && s.guardianName && s.guardianName.trim().toLowerCase() === g.name.trim().toLowerCase()) {
          isMatched = true;
        }

        // 3. Check student's guardians[] link array
        if (!isMatched && s.guardians && s.guardians.length > 0) {
          const hasLink = s.guardians.some(gl => 
            (gl.phone && (gl.phone === g.phone || (g.phoneSecond && gl.phone === g.phoneSecond))) ||
            (gl.phoneSecond && (gl.phoneSecond === g.phone || (g.phoneSecond && gl.phoneSecond === g.phoneSecond))) ||
            (gl.name && gl.name.trim().toLowerCase() === g.name.trim().toLowerCase())
          );
          if (hasLink) isMatched = true;
        }

        if (isMatched) {
          const list = map.get(g.id) || [];
          if (!list.some(existing => existing.id === s.id)) {
            list.push(s);
            map.set(g.id, list);
          }
        }
      });
    });

    return map;
  }, [activeGuardians, allStudents]);

  // Precompute unpaid dues per student
  const unpaidDuesByStudentIdMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < allInvoices.length; i++) {
      const inv = allInvoices[i];
      if (inv.status !== "paid" && inv.status !== "cancelled" && inv.studentId) {
        const remaining = (inv.netAmount || inv.amount) - (inv.paid || 0);
        if (remaining > 0) {
          map.set(inv.studentId, (map.get(inv.studentId) || 0) + remaining);
        }
      }
    }
    return map;
  }, [allInvoices]);

  // Combined guardians with calculated metadata
  const guardiansWithStudents = useMemo(() => {
    const q = debouncedSearchQuery.trim().toLowerCase();

    let result = activeGuardians.map(g => {
      const students = studentsByGuardianMap.get(g.id) || [];

      let totalDue = 0;
      for (let i = 0; i < students.length; i++) {
        totalDue += unpaidDuesByStudentIdMap.get(students[i].id) || 0;
      }

      return { ...g, students, totalDue };
    });

    // Search query filter
    if (q) {
      result = result.filter(g => 
        g.name.toLowerCase().includes(q) || 
        g.phone.includes(q) || 
        (g.phoneSecond && g.phoneSecond.includes(q)) ||
        (g.nationalId && g.nationalId.includes(q)) ||
        (g.job && g.job.toLowerCase().includes(q)) ||
        g.students.some(s => s.name.toLowerCase().includes(q) || s.nationalId?.includes(q))
      );
    }

    // Financial Dues filter
    if (filterDues === "hasDues") {
      result = result.filter(g => g.totalDue > 0);
    } else if (filterDues === "noDues") {
      result = result.filter(g => g.totalDue === 0);
    }

    // Stage filter
    if (filterStage !== "all") {
      result = result.filter(g => g.students.length === 0 || g.students.some(s => s.stage === filterStage));
    }

    // Grade filter
    if (filterGrade !== "all") {
      result = result.filter(g => g.students.some(s => s.grade === filterGrade));
    }

    // Section filter
    if (filterSection !== "all") {
      result = result.filter(g => g.students.some(s => s.sectionId === filterSection));
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, "ar");
      } else if (sortBy === "childrenCount") {
        return b.students.length - a.students.length;
      } else if (sortBy === "dues") {
        return b.totalDue - a.totalDue;
      }
      return 0;
    });

    return result;
  }, [
    activeGuardians, 
    studentsByGuardianMap, 
    unpaidDuesByStudentIdMap, 
    debouncedSearchQuery, 
    filterStage,
    filterGrade, 
    filterSection, 
    filterDues, 
    sortBy
  ]);

  // Overall aggregate statistics
  const totalOutstandingDues = useMemo(() => guardiansWithStudents.reduce((sum, g) => sum + g.totalDue, 0), [guardiansWithStudents]);
  const indebtedGuardiansCount = useMemo(() => guardiansWithStudents.filter(g => g.totalDue > 0).length, [guardiansWithStudents]);
  const paidGuardiansCount = useMemo(() => guardiansWithStudents.filter(g => g.totalDue === 0).length, [guardiansWithStudents]);
  const totalLinkedStudents = useMemo(() => {
    const set = new Set<string>();
    guardiansWithStudents.forEach(g => g.students.forEach(s => set.add(s.id)));
    return set.size;
  }, [guardiansWithStudents]);

  // Grade options for selected stage
  const gradeOptions: LuxurySelectOption[] = useMemo(() => {
    const grades = filterStage === "all" ? getGradesForStage(stage) : getGradesForStage(filterStage as EducationalStage);
    return [
      { value: "all", label: "كل الصفوف الدراسية", icon: GraduationCap },
      ...grades.map(g => ({ value: g, label: g, icon: GraduationCap }))
    ];
  }, [filterStage, stage]);

  // Section options for selected grade
  const availableSections = useMemo(() => {
    if (filterGrade === "all") return [];
    return allSections.filter(s => {
      const matchStage = filterStage === "all" ? true : s.stage === filterStage;
      return matchStage && s.grade === filterGrade;
    });
  }, [allSections, filterStage, filterGrade]);

  const sectionOptions: LuxurySelectOption[] = useMemo(() => {
    if (filterGrade === "all") {
      return [{ value: "all", label: "اختر الصف أولاً", disabled: true }];
    }
    return [
      { value: "all", label: "كل الشعب", icon: Layers3 },
      ...availableSections.map(sec => ({
        value: sec.id,
        label: `شعبة ${sec.name}`,
        sublabel: `${sec.stage} • ${sec.grade}`,
        icon: Layers3
      }))
    ];
  }, [filterGrade, availableSections]);

  const hasActiveFilters = searchQuery !== "" || filterStage !== "all" || filterGrade !== "all" || filterSection !== "all" || filterDues !== "all";

  const clearAllFilters = () => {
    setSearchQuery("");
    setFilterStage("all");
    setFilterGrade("all");
    setFilterSection("all");
    setFilterDues("all");
    setSortBy("name");
  };

  // Add Guardian Handler
  const handleAddGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuardian.name.trim() || !newGuardian.phone.trim()) {
      toast.error("يرجى إدخال اسم ولي الأمر ورقم الجوال");
      return;
    }

    const finalRelation = newGuardian.relation === "أخرى" 
      ? newGuardian.customRelation.trim() || "ولي أمر" 
      : newGuardian.relation;

    // Create guardian
    addGuardian({
      name: newGuardian.name.trim(),
      nationalId: newGuardian.nationalId.trim() || undefined,
      phone: newGuardian.phone.trim(),
      phoneSecond: newGuardian.phoneSecond.trim() || undefined,
      email: newGuardian.email.trim() || undefined,
      job: newGuardian.job.trim() || undefined,
      relation: finalRelation,
      gender: newGuardian.gender,
      address: newGuardian.address.trim() || undefined,
      notes: newGuardian.notes.trim() || undefined,
    });

    // Link selected students if any
    if (newGuardian.selectedStudentIds.length > 0) {
      newGuardian.selectedStudentIds.forEach(stId => {
        const student = allStudents.find(s => s.id === stId);
        if (student) {
          const existingLinks: StudentGuardianLink[] = student.guardians || [];
          const newLink: StudentGuardianLink = {
            id: `GL-${Math.floor(1000 + Math.random() * 9000)}`,
            name: newGuardian.name.trim(),
            relation: finalRelation,
            phone: newGuardian.phone.trim(),
            phoneSecond: newGuardian.phoneSecond.trim() || undefined,
            email: newGuardian.email.trim() || undefined,
            job: newGuardian.job.trim() || undefined,
            isPrimary: existingLinks.length === 0,
            address: newGuardian.address.trim() || undefined,
          };

          const isPrimary = existingLinks.length === 0;
          updateStudent(student.id, {
            guardians: [...existingLinks, newLink],
            ...(isPrimary ? {
              guardianName: newGuardian.name.trim(),
              guardianPhone: newGuardian.phone.trim(),
              guardianRelation: finalRelation,
            } : {})
          });
        }
      });
    }

    toast.success(`تمت إضافة ولي الأمر "${newGuardian.name}" بنجاح وتحديث السجلات`);
    setIsAddModalOpen(false);
    setNewGuardian({
      name: "",
      nationalId: "",
      phone: "",
      phoneSecond: "",
      email: "",
      job: "",
      relation: "أب",
      customRelation: "",
      gender: "ذكر",
      address: "",
      notes: "",
      selectedStudentIds: []
    });
  };

  // Update Guardian Handler
  const handleUpdateGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuardian) return;

    updateGuardian(editingGuardian.id, {
      name: editingGuardian.name.trim(),
      nationalId: editingGuardian.nationalId?.trim() || undefined,
      phone: editingGuardian.phone.trim(),
      phoneSecond: editingGuardian.phoneSecond?.trim() || undefined,
      email: editingGuardian.email?.trim() || undefined,
      job: editingGuardian.job?.trim() || undefined,
      relation: editingGuardian.relation,
      gender: editingGuardian.gender,
      address: editingGuardian.address?.trim() || undefined,
      notes: editingGuardian.notes?.trim() || undefined,
    });

    toast.success("تم تحديث بيانات ولي الأمر بنجاح");
    setEditingGuardian(null);
  };

  // Link / Unlink Student Handlers
  const handleLinkStudent = (studentId: string, guardian: Guardian) => {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;

    const existingLinks: StudentGuardianLink[] = student.guardians || [];
    const isAlreadyLinked = existingLinks.some(l => l.phone === guardian.phone || l.name === guardian.name);
    
    if (isAlreadyLinked) {
      toast.error("هذا الطالب مرتبط بالفعل بهذا الولي");
      return;
    }

    const isPrimary = existingLinks.length === 0;
    const newLink: StudentGuardianLink = {
      id: `GL-${Math.floor(1000 + Math.random() * 9000)}`,
      name: guardian.name,
      relation: guardian.relation,
      phone: guardian.phone,
      phoneSecond: guardian.phoneSecond,
      email: guardian.email,
      job: guardian.job,
      isPrimary,
      address: guardian.address,
    };

    updateStudent(student.id, {
      guardians: [...existingLinks, newLink],
      ...(isPrimary ? {
        guardianName: guardian.name,
        guardianPhone: guardian.phone,
        guardianRelation: guardian.relation
      } : {})
    });

    toast.success(`تم ربط الطالب "${student.name}" بولي الأمر بنجاح`);
    
    // Update local modal view
    if (linkingGuardian) {
      setLinkingGuardian({
        ...linkingGuardian,
        linkedStudents: [...linkingGuardian.linkedStudents, student]
      });
    }
  };

  const handleUnlinkStudent = (studentId: string, guardian: Guardian) => {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;

    const existingLinks: StudentGuardianLink[] = student.guardians || [];
    const updatedLinks = existingLinks.filter(l => l.phone !== guardian.phone && l.name !== guardian.name);

    // If primary was unlinked, fallback to next guardian
    let newPrimary = updatedLinks.find(l => l.isPrimary) || updatedLinks[0];

    updateStudent(student.id, {
      guardians: updatedLinks,
      guardianName: newPrimary ? newPrimary.name : "",
      guardianPhone: newPrimary ? newPrimary.phone : "",
      guardianRelation: newPrimary ? newPrimary.relation : "",
    });

    toast.success(`تم فك ارتباط الطالب "${student.name}" عن ولي الأمر`);
    
    // Update local modal view
    if (linkingGuardian) {
      setLinkingGuardian({
        ...linkingGuardian,
        linkedStudents: linkingGuardian.linkedStudents.filter(s => s.id !== studentId)
      });
    }
  };

  // WhatsApp Message Composer
  const composeWhatsAppMessage = (g: Guardian, students: Student[], totalDue: number) => {
    const studentNames = students.map(s => s.name).join("، ") || "أبنائكم";
    if (whatsappTemplate === "dues") {
      return `السلام عليكم ورحمة الله وبركاته المكرم ولي الأمر / ${g.name} المحترم،\nنود تذكيركم بوجود مستحقات دراسية متأخرة بمبلغ (${totalDue.toLocaleString()} ${currency}) للطلاب: [${studentNames}]. نرجو التكرم بالسداد في أقرب وقت شاكرين حسن تعاونكم وحرصكم الدائم.`;
    } else if (whatsappTemplate === "summon") {
      return `السلام عليكم ورحمة الله وبركاته المكرم ولي الأمر / ${g.name} المحترم،\nترجو إدارة المدرسة من سعادتكم التكرم بزيارة المدرسة يوم (...............) لمناقشة أمور دراسية هامة تخص الطالب/ـة [${studentNames}].\nشاكرين تعاونكم الكريم.`;
    } else if (whatsappTemplate === "absence") {
      return `السلام عليكم ورحمة الله وبركاته المكرم ولي الأمر / ${g.name} المحترم،\nنفيدكم بغياب الطالب/ـة [${studentNames}] عن الحصص الدراسية اليوم دون عذر مسبق. نرجو التواصل مع إدارة المدرسة لتبرير سبب الغياب وحرصاً على سلامة الطالب.`;
    }
    return customMessage;
  };

  const handleSendWhatsApp = (phone: string, text: string) => {
    const cleaned = cleanPhoneForWhatsApp(phone);
    if (!cleaned) {
      toast.error("رقم الجوال غير صالح للمراسلة");
      return;
    }
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setWhatsappGuardian(null);
  };

  const printTemplates: PrintTemplate[] = [
    {
      id: "guardians-list",
      name: "قائمة أولياء الأمور المجمعة",
      category: "قوائم",
      type: "table",
      columns: [
        { label: "الاسم الرباعي", key: "name" },
        { label: "رقم الهوية / الإقامة", key: "nationalId", render: (g: any) => g.nationalId || "غير مسجل" },
        { label: "رقم الجوال", key: "phone" },
        { label: "صلة القرابة", key: "relation" },
        { label: "عدد الأبناء", key: "studentsCount", render: (g: any) => g.students.length.toString() },
        { label: "المتأخرات المالية", key: "totalDue", render: (g: any) => g.totalDue > 0 ? `${g.totalDue.toLocaleString()} ${currency}` : "مسدد" },
      ],
      description: "طباعة كشف شامل ومفصل بأولياء الأمور مع أرقام الهواتف والمتأخرات المالية"
    }
  ];

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "أولياء الأمور" }]}
      actions={
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4" /> إضافة ولي أمر جديد
          </button>
          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-card px-4 text-xs font-bold text-foreground hover:bg-accent transition-all border border-border/80 shadow-xs active:scale-[0.98]"
          >
            <Printer className="h-4 w-4 text-muted-foreground" /> طباعة الكشف
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-300">
        
        {/* Luxury Top Metric Cards (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Guardians */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-muted-foreground mb-1">إجمالي أولياء الأمور</p>
                <h3 className="text-3xl font-black tabular-nums tracking-tight text-foreground">{guardiansWithStudents.length}</h3>
                <p className="text-[11px] font-bold text-primary mt-1.5 flex items-center gap-1">
                  <BadgeCheck className="h-3 w-3" /> نشطون ومسجلون بالنظام
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-xs">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Card 2: Indebted Guardians */}
          <div className="relative overflow-hidden rounded-2xl border border-danger/25 bg-gradient-to-br from-danger/10 via-card to-background p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-danger mb-1 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
                  </span>
                  إجمالي المتأخرات المالية
                </p>
                <h3 className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-danger flex items-baseline gap-1">
                  {totalOutstandingDues.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">{currency}</span>
                </h3>
                <p className="text-[11px] font-bold text-muted-foreground mt-1.5">
                  على <span className="text-danger font-black">{indebtedGuardiansCount}</span> ولي أمر
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-danger/15 text-danger flex items-center justify-center shadow-xs">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Card 3: Paid Guardians */}
          <div className="relative overflow-hidden rounded-2xl border border-success/25 bg-gradient-to-br from-success/10 via-card to-background p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-success mb-1">مسددون بالكامل</p>
                <h3 className="text-3xl font-black tabular-nums tracking-tight text-success">{paidGuardiansCount}</h3>
                <p className="text-[11px] font-bold text-muted-foreground mt-1.5">
                  نسبة السداد: <span className="text-success font-black">{guardiansWithStudents.length > 0 ? Math.round((paidGuardiansCount / guardiansWithStudents.length) * 100) : 0}%</span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-success/15 text-success flex items-center justify-center shadow-xs">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Card 4: Student Coverage */}
          <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-card to-background p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-sky-600 dark:text-sky-400 mb-1">الطلاب المربوطون</p>
                <h3 className="text-3xl font-black tabular-nums tracking-tight text-foreground">{totalLinkedStudents}</h3>
                <p className="text-[11px] font-bold text-muted-foreground mt-1.5">
                  متوسط <span className="text-sky-600 dark:text-sky-400 font-black">{guardiansWithStudents.length > 0 ? (totalLinkedStudents / guardiansWithStudents.length).toFixed(1) : 0}</span> طالب لكل ولي أمر
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs">
                <GraduationCap className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Control Panel */}
        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-4">
          
          {/* Row 1: Search, Financial Dues, Sort */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            
            {/* Quick Search */}
            <div className="md:col-span-6 relative">
              <label className="mb-1.5 block text-xs font-bold text-muted-foreground">البحث السريع المتقدم</label>
              <div className="relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="ابحث باسم ولي الأمر، الهوية، الجوال، أو اسم الطالب..."
                  className="w-full h-11 rounded-xl border border-border/80 bg-background pr-10 pl-10 text-xs sm:text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/70"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Financial Status Filter */}
            <div className="md:col-span-3">
              <LuxurySelect
                label="التصفية المالية"
                value={filterDues}
                onChange={(val) => setFilterDues(val as any)}
                options={FINANCIAL_STATUS_OPTIONS}
                placeholder="التصفية المالية"
                icon={Filter}
                size="md"
              />
            </div>

            {/* Sort Filter */}
            <div className="md:col-span-3">
              <LuxurySelect
                label="ترتيب حسب"
                value={sortBy}
                onChange={(val) => setSortBy(val as any)}
                options={SORT_OPTIONS}
                placeholder="الترتيب"
                icon={ArrowUpDown}
                size="md"
              />
            </div>
          </div>

          {/* Row 2: Stage, Grade, Section Cascading Selects */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/60">
            
            {/* Stage Selector */}
            <div>
              <LuxurySelect
                label="المرحلة الدراسية"
                value={filterStage}
                onChange={(val) => {
                  setFilterStage(val);
                  setFilterGrade("all");
                  setFilterSection("all");
                }}
                options={STAGE_OPTIONS}
                placeholder="المرحلة الدراسية"
                icon={GraduationCap}
                size="md"
              />
            </div>

            {/* Grade Selector */}
            <div>
              <LuxurySelect
                label="الصف الدراسي"
                value={filterGrade}
                onChange={(val) => {
                  setFilterGrade(val);
                  setFilterSection("all");
                }}
                options={gradeOptions}
                placeholder="الصف الدراسي"
                icon={GraduationCap}
                size="md"
                searchable={gradeOptions.length > 6}
              />
            </div>

            {/* Section Cascading Selector */}
            <div>
              <LuxurySelect
                label="الشعبة الدراسية"
                value={filterSection}
                onChange={(val) => setFilterSection(val)}
                options={sectionOptions}
                placeholder="الشعبة الدراسية"
                icon={Layers3}
                size="md"
                disabled={filterGrade === "all" || availableSections.length === 0}
                disabledHint={filterGrade === "all" ? "اختر الصف أولاً لتحديد الشعبة" : "لا توجد شُعب مسجلة لهذا الصف"}
                searchable={availableSections.length > 5}
              />
            </div>
          </div>

          {/* Active Filter Chips Strip */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border/50 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-muted-foreground flex items-center gap-1">
                  <Filter className="h-3 w-3" /> الفلاتر النشطة:
                </span>
                
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold border border-primary/20">
                    بحث: {searchQuery}
                    <button onClick={() => setSearchQuery("")} className="hover:text-danger"><X className="h-3 w-3" /></button>
                  </span>
                )}

                {filterStage !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted font-bold text-foreground border border-border">
                    المرحلة: {STAGE_OPTIONS.find(s => s.value === filterStage)?.label}
                    <button onClick={() => { setFilterStage("all"); setFilterGrade("all"); setFilterSection("all"); }} className="hover:text-danger"><X className="h-3 w-3" /></button>
                  </span>
                )}

                {filterGrade !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted font-bold text-foreground border border-border">
                    الصف: {filterGrade}
                    <button onClick={() => { setFilterGrade("all"); setFilterSection("all"); }} className="hover:text-danger"><X className="h-3 w-3" /></button>
                  </span>
                )}

                {filterSection !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted font-bold text-foreground border border-border">
                    الشعبة: {availableSections.find(s => s.id === filterSection)?.name || filterSection}
                    <button onClick={() => setFilterSection("all")} className="hover:text-danger"><X className="h-3 w-3" /></button>
                  </span>
                )}

                {filterDues !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-danger/10 text-danger font-bold border border-danger/20">
                    {filterDues === "hasDues" ? "عليهم متأخرات" : "مسددين"}
                    <button onClick={() => setFilterDues("all")} className="hover:text-foreground"><X className="h-3 w-3" /></button>
                  </span>
                )}
              </div>

              <button
                onClick={clearAllFilters}
                className="text-xs font-bold text-muted-foreground hover:text-danger hover:underline transition-colors"
              >
                مسح جميع الفلاتر
              </button>
            </div>
          )}
        </div>

        {/* Data Table */}
        <PageCard>
          <DataTable
            rows={guardiansWithStudents}
            columns={[
              { 
                key: "name", 
                header: "ولي الأمر والهوية", 
                cell: (g) => {
                  const initials = g.name.trim().split(" ").slice(0, 2).map((n: string) => n[0]).join("");
                  return (
                    <div className="flex items-center gap-3 py-1">
                      <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm border border-primary/20 shrink-0">
                        {initials || <User className="h-5 w-5" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link 
                            to="/guardians/$id" 
                            params={{ id: g.id }} 
                            className="font-black text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1"
                          >
                            {g.name}
                          </Link>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getRelationColor(g.relation)}`}>
                            {g.relation}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {g.nationalId && (
                            <span className="font-mono tabular-nums text-[11px] bg-muted/60 px-1.5 py-0.5 rounded">
                              هوية: {g.nationalId}
                            </span>
                          )}
                          {g.job && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Briefcase className="h-3 w-3 text-muted-foreground" /> {g.job}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              },
              { 
                key: "phone", 
                header: "بيانات التواصل", 
                cell: (g) => (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <a 
                        href={`tel:${g.phone}`}
                        className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground hover:text-primary transition-colors tabular-nums"
                        dir="ltr"
                        title="اتصال هاتفي"
                      >
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {g.phone}
                      </a>
                      
                      <button
                        onClick={() => {
                          setWhatsappGuardian({ guardian: g, students: g.students, totalDue: g.totalDue });
                          setWhatsappTemplate(g.totalDue > 0 ? "dues" : "summon");
                        }}
                        className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        title="مراسلة واتساب فورية"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {g.phoneSecond && (
                      <p className="font-mono text-[11px] text-muted-foreground tabular-nums flex items-center gap-1" dir="ltr">
                        <Phone className="h-3 w-3 text-muted-foreground" /> {g.phoneSecond}
                      </p>
                    )}
                  </div>
                )
              },
              { 
                key: "studentsCount", 
                header: "الأبناء المرتبطون", 
                cell: (g) => (
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                      {g.students.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">لا يوجد طلاب مرتبطين</span>
                      ) : (
                        g.students.map((st: Student) => (
                          <Link
                            key={st.id}
                            to="/students/$id"
                            params={{ id: st.id }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-background border border-border/80 text-[11px] font-bold text-foreground hover:border-primary hover:text-primary transition-colors"
                            title={`المرحلة: ${st.stage} • الصف: ${st.grade}`}
                          >
                            <GraduationCap className="h-3 w-3 text-primary" />
                            <span>{st.name.split(" ")[0]}</span>
                            <span className="text-[10px] text-muted-foreground font-normal">({st.grade})</span>
                          </Link>
                        ))
                      )}
                    </div>
                    <button
                      onClick={() => setLinkingGuardian({ guardian: g, linkedStudents: g.students })}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                    >
                      <Link2 className="h-3 w-3" /> إدارة ربط الطلاب ({g.students.length})
                    </button>
                  </div>
                )
              },
              { 
                key: "financial", 
                header: "المستحقات المالية", 
                cell: (g) => g.totalDue > 0 ? (
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-danger bg-danger/10 border border-danger/20 px-2.5 py-1 rounded-lg">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-xs font-black tabular-nums">
                        {g.totalDue.toLocaleString()} {currency}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-bold">متبقي غير مسدد</p>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs font-black">مسدد بالكامل</span>
                  </div>
                )
              },
              { 
                key: "actions", 
                header: "إجراءات سريعة", 
                cell: (g) => (
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setEditingGuardian(g)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="تعديل بيانات ولي الأمر"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => {
                        setWhatsappGuardian({ guardian: g, students: g.students, totalDue: g.totalDue });
                        setWhatsappTemplate(g.totalDue > 0 ? "dues" : "summon");
                      }}
                      className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                      title="إرسال رسالة واتساب"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>

                    <Link 
                      to="/guardians/$id" 
                      params={{ id: g.id }} 
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all text-xs font-bold"
                      title="عرض الملف الكامل"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>الملف</span>
                    </Link>
                  </div>
                )
              },
            ]}
          />
        </PageCard>
      </div>

      {/* Advanced Print Engine */}
      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title="كشف أولياء الأمور وأرقام التواصل والوضع المالي"
        data={guardiansWithStudents}
        templates={printTemplates} 
      />

      {/* MODAL 1: ADD GUARDIAN MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-2xl modal-card-luxury my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/60 flex justify-between items-center bg-primary/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-black text-lg text-foreground">إضافة ولي أمر جديد</h2>
                  <p className="text-xs text-muted-foreground font-medium">تسجيل بيانات ولي الأمر وتحديد صلة القرابة وربط الأبناء مباشرة</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddGuardian} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Section 1: Basic Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> البيانات الشخصية ورقم الهوية
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-black text-foreground mb-1.5">
                      الاسم الرباعي <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newGuardian.name}
                      onChange={e => setNewGuardian(prev => ({ ...prev, name: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-border/80 bg-background px-4 text-xs sm:text-sm font-bold shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="مثال: صالح محمد الهاشمي"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-foreground mb-1.5">
                      رقم الهوية الوطنية / الإقامة
                    </label>
                    <input
                      type="text"
                      value={newGuardian.nationalId}
                      onChange={e => setNewGuardian(prev => ({ ...prev, nationalId: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-border/80 bg-background px-4 text-xs sm:text-sm font-bold shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 tabular-nums font-mono"
                      placeholder="10XXXXXXXX"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <LuxurySelect
                      label="صلة القرابة"
                      value={newGuardian.relation}
                      onChange={(val) => setNewGuardian(prev => ({ ...prev, relation: val }))}
                      options={GUARDIAN_RELATION_OPTIONS}
                      placeholder="اختر صلة القرابة"
                      icon={User}
                      size="md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-foreground mb-1.5">الجنس</label>
                    <div className="grid grid-cols-2 gap-2 h-11">
                      <button
                        type="button"
                        onClick={() => setNewGuardian(prev => ({ ...prev, gender: "ذكر" }))}
                        className={`rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                          newGuardian.gender === "ذكر" 
                            ? "bg-primary text-primary-foreground border-primary shadow-xs font-black" 
                            : "bg-background border-border/80 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <User className="h-3.5 w-3.5" /> ذكر
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewGuardian(prev => ({ ...prev, gender: "أنثى" }))}
                        className={`rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                          newGuardian.gender === "أنثى" 
                            ? "bg-primary text-primary-foreground border-primary shadow-xs font-black" 
                            : "bg-background border-border/80 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <User className="h-3.5 w-3.5" /> أنثى
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dynamic custom relation manual input */}
                {newGuardian.relation === "أخرى" && (
                  <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 animate-in fade-in zoom-in-95 duration-200">
                    <label className="block text-xs font-black text-primary mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> حدد صلة القرابة يدوياً <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newGuardian.customRelation}
                      onChange={e => setNewGuardian(prev => ({ ...prev, customRelation: e.target.value }))}
                      className="h-10 w-full rounded-xl border border-primary/40 bg-background px-3 text-xs sm:text-sm font-bold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="مثال: زوج الأم، أخ بالرضاعة، وكيل شرعي..."
                    />
                  </div>
                )}
              </div>

              {/* Section 2: Contact & Occupation */}
              <div className="space-y-3 pt-3 border-t border-border/60">
                <h3 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> وسائل التواصل والمهنة
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-black text-foreground mb-1.5">
                      رقم الجوال الأساسي <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="tel"
                        required
                        value={newGuardian.phone}
                        onChange={e => setNewGuardian(prev => ({ ...prev, phone: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-border/80 bg-background pr-10 pl-4 text-xs sm:text-sm font-bold shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 tabular-nums font-mono"
                        placeholder="05XXXXXXXX"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-foreground mb-1.5">
                      رقم جوال إضافي / طوارئ
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="tel"
                        value={newGuardian.phoneSecond}
                        onChange={e => setNewGuardian(prev => ({ ...prev, phoneSecond: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-border/80 bg-background pr-10 pl-4 text-xs sm:text-sm font-bold shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 tabular-nums font-mono"
                        placeholder="05XXXXXXXX"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-black text-foreground mb-1.5">المهنة / جهة العمل</label>
                    <div className="relative">
                      <Briefcase className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={newGuardian.job}
                        onChange={e => setNewGuardian(prev => ({ ...prev, job: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-border/80 bg-background pr-10 pl-4 text-xs sm:text-sm font-bold shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="مثال: مهندس برمجيات، معلم..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-foreground mb-1.5">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={newGuardian.email}
                        onChange={e => setNewGuardian(prev => ({ ...prev, email: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-border/80 bg-background pr-10 pl-4 text-xs sm:text-sm font-bold shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="guardian@example.com"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">عنوان السكن والحي</label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={newGuardian.address}
                      onChange={e => setNewGuardian(prev => ({ ...prev, address: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-border/80 bg-background pr-10 pl-4 text-xs sm:text-sm font-bold shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="المدينة، الحي، الشارع..."
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Instant Student Linker */}
              <div className="space-y-3 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" /> ربط الأبناء المسجلين فوراً (اختياري)
                  </h3>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    تم اختيار ({newGuardian.selectedStudentIds.length}) طلاب
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 space-y-2.5">
                  <p className="text-xs text-muted-foreground font-medium">
                    يمكنك اختيار الأبناء المسجلين في المدرسة ليتم ربطهم مباشرة بهذا الولي عند الحفظ:
                  </p>
                  
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {allStudents.slice(0, 15).map(st => {
                      const isSelected = newGuardian.selectedStudentIds.includes(st.id);
                      return (
                        <div 
                          key={st.id}
                          onClick={() => {
                            setNewGuardian(prev => ({
                              ...prev,
                              selectedStudentIds: isSelected 
                                ? prev.selectedStudentIds.filter(id => id !== st.id)
                                : [...prev.selectedStudentIds, st.id]
                            }));
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border ${
                            isSelected 
                              ? "bg-primary/10 border-primary text-primary font-bold" 
                              : "bg-background border-border/60 text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`h-4 w-4 rounded-md border flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
                              {isSelected && <CheckCircle2 className="h-3 w-3" />}
                            </div>
                            <span className="text-xs">{st.name}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {st.grade}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 flex gap-3 border-t border-border/60">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-primary py-3 text-xs sm:text-sm font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-[0.98]"
                >
                  حفظ إضافة ولي الأمر
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 rounded-xl border border-border/80 bg-card text-xs sm:text-sm font-bold hover:bg-accent transition-colors active:scale-[0.98]"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT GUARDIAN MODAL */}
      {editingGuardian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-xl modal-card-luxury my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/60 flex justify-between items-center bg-primary/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-black text-lg text-foreground">تعديل بيانات ولي الأمر</h2>
                  <p className="text-xs text-muted-foreground font-medium">تحديث أرقام التواصل وصلة القرابة والبيانات الشخصية</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingGuardian(null)} 
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateGuardian} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-black text-foreground mb-1.5">الاسم الرباعي <span className="text-danger">*</span></label>
                <input
                  type="text"
                  required
                  value={editingGuardian.name}
                  onChange={e => setEditingGuardian({ ...editingGuardian, name: e.target.value })}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background px-4 text-xs sm:text-sm font-bold shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">رقم الهوية الوطنية / الإقامة</label>
                  <input
                    type="text"
                    value={editingGuardian.nationalId || ""}
                    onChange={e => setEditingGuardian({ ...editingGuardian, nationalId: e.target.value })}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background px-4 text-xs sm:text-sm font-bold shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 tabular-nums font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <LuxurySelect
                    label="صلة القرابة"
                    value={editingGuardian.relation}
                    onChange={(val) => setEditingGuardian({ ...editingGuardian, relation: val })}
                    options={GUARDIAR_RELATION_FALLBACK(editingGuardian.relation)}
                    placeholder="صلة القرابة"
                    icon={User}
                    size="md"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">رقم الجوال الأساسي <span className="text-danger">*</span></label>
                  <input
                    type="tel"
                    required
                    value={editingGuardian.phone}
                    onChange={e => setEditingGuardian({ ...editingGuardian, phone: e.target.value })}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background px-4 text-xs sm:text-sm font-bold shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 tabular-nums font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">رقم جوال إضافي</label>
                  <input
                    type="tel"
                    value={editingGuardian.phoneSecond || ""}
                    onChange={e => setEditingGuardian({ ...editingGuardian, phoneSecond: e.target.value })}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background px-4 text-xs sm:text-sm font-bold shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 tabular-nums font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">المهنة / الوظيفة</label>
                  <input
                    type="text"
                    value={editingGuardian.job || ""}
                    onChange={e => setEditingGuardian({ ...editingGuardian, job: e.target.value })}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background px-4 text-xs sm:text-sm font-bold shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={editingGuardian.email || ""}
                    onChange={e => setEditingGuardian({ ...editingGuardian, email: e.target.value })}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background px-4 text-xs sm:text-sm font-bold shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-foreground mb-1.5">العنوان</label>
                <input
                  type="text"
                  value={editingGuardian.address || ""}
                  onChange={e => setEditingGuardian({ ...editingGuardian, address: e.target.value })}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background px-4 text-xs sm:text-sm font-bold shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-border/60">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-primary py-3 text-xs sm:text-sm font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-[0.98]"
                >
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => setEditingGuardian(null)}
                  className="px-6 rounded-xl border border-border/80 bg-card text-xs sm:text-sm font-bold hover:bg-accent transition-colors active:scale-[0.98]"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: MANAGE LINKED STUDENTS MODAL */}
      {linkingGuardian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-xl modal-card-luxury my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/60 flex justify-between items-center bg-primary/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                  <Link2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-black text-lg text-foreground">إدارة ربط الأبناء والطلاب</h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    ولي الأمر: <span className="font-black text-foreground">{linkingGuardian.guardian.name}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setLinkingGuardian(null)} 
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Current Linked Students */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-foreground flex items-center justify-between">
                  <span>الأبناء المرتبطون حالياً ({linkingGuardian.linkedStudents.length})</span>
                </h3>

                {linkingGuardian.linkedStudents.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-border/80 text-center text-xs text-muted-foreground font-bold">
                    لا يوجد أبناء مرتبطون بهذا الولي حالياً.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkingGuardian.linkedStudents.map(st => (
                      <div key={st.id} className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            <GraduationCap className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-foreground">{st.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {st.stage} • {st.grade} • هوية: {st.nationalId || "غير مسجل"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            to="/students/$id"
                            params={{ id: st.id }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="عرض ملف الطالب"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>

                          <button
                            onClick={() => handleUnlinkStudent(st.id, linkingGuardian.guardian)}
                            className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                            title="فك الارتباط"
                          >
                            <Unlink className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Link New Student Search */}
              <div className="space-y-3 pt-3 border-t border-border/60">
                <h3 className="text-xs font-black text-primary flex items-center gap-1.5">
                  <Plus className="h-4 w-4" /> ربط طالب جديد بالمدرسة
                </h3>

                <div className="relative">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="ابحث باسم الطالب أو رقمه الوطني..."
                    value={studentSearchInModal}
                    onChange={(e) => setStudentSearchInModal(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border/80 bg-background pr-10 pl-4 text-xs font-bold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {studentSearchInModal.trim() && (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-border/70 rounded-xl p-2 bg-muted/20">
                    {allStudents
                      .filter(st => 
                        !linkingGuardian.linkedStudents.some(ls => ls.id === st.id) &&
                        (st.name.toLowerCase().includes(studentSearchInModal.toLowerCase()) || 
                         st.nationalId?.includes(studentSearchInModal))
                      )
                      .slice(0, 8)
                      .map(st => (
                        <div key={st.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/60 hover:border-primary/50 transition-colors">
                          <div>
                            <p className="text-xs font-bold text-foreground">{st.name}</p>
                            <p className="text-[10px] text-muted-foreground">{st.grade} • {st.stage}</p>
                          </div>
                          <button
                            onClick={() => handleLinkStudent(st.id, linkingGuardian.guardian)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-black hover:bg-primary/90 transition-colors shadow-xs"
                          >
                            <Plus className="h-3 w-3" /> ربط
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border/60 flex justify-end">
                <button
                  onClick={() => setLinkingGuardian(null)}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: INSTANT WHATSAPP MESSAGE MODAL */}
      {whatsappGuardian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-lg modal-card-luxury my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/60 flex justify-between items-center bg-emerald-500/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-black text-lg text-foreground">مراسلة واتساب فورية</h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    إرسال إشعار فوري لولي الأمر: <span className="font-black text-foreground">{whatsappGuardian.guardian.name}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setWhatsappGuardian(null)} 
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
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
                      if (!customMessage) setCustomMessage(`السلام عليكم ورحمة الله وبركاته المكرم ولي الأمر / ${whatsappGuardian.guardian.name} المحترم،\n`);
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
                <label className="block text-xs font-black text-foreground mb-1.5">نص الرسالة (قابلة للتعديل)</label>
                <textarea
                  rows={5}
                  value={
                    whatsappTemplate === "custom" 
                      ? customMessage 
                      : composeWhatsAppMessage(whatsappGuardian.guardian, whatsappGuardian.students, whatsappGuardian.totalDue)
                  }
                  onChange={(e) => {
                    setWhatsappTemplate("custom");
                    setCustomMessage(e.target.value);
                  }}
                  className="w-full rounded-xl border border-border/80 bg-background p-3 text-xs sm:text-sm font-medium focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed"
                />
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
                <span className="font-bold text-muted-foreground">رقم الهاتف المرسل إليه:</span>
                <span className="font-mono font-bold text-foreground tabular-nums" dir="ltr">
                  {whatsappGuardian.guardian.phone}
                </span>
              </div>

              <div className="pt-3 flex gap-3 border-t border-border/60">
                <button
                  onClick={() => {
                    const text = whatsappTemplate === "custom" 
                      ? customMessage 
                      : composeWhatsAppMessage(whatsappGuardian.guardian, whatsappGuardian.students, whatsappGuardian.totalDue);
                    handleSendWhatsApp(whatsappGuardian.guardian.phone, text);
                  }}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 text-xs sm:text-sm font-black text-white hover:bg-emerald-700 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" /> فتح المحادثة عبر واتساب
                </button>
                <button
                  onClick={() => setWhatsappGuardian(null)}
                  className="px-6 rounded-xl border border-border/80 bg-card text-xs sm:text-sm font-bold hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}

// Fallback helper to include current relation if custom
function GUARDIAR_RELATION_FALLBACK(currentRelation: string): LuxurySelectOption[] {
  const exists = GUARDIAN_RELATION_OPTIONS.some(o => o.value === currentRelation);
  if (!exists && currentRelation) {
    return [
      { value: currentRelation, label: `${currentRelation} (مخصص)`, icon: User, badge: "مخصص", badgeTone: "primary" },
      ...GUARDIAN_RELATION_OPTIONS
    ];
  }
  return GUARDIAN_RELATION_OPTIONS;
}
