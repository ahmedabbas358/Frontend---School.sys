import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useTransition } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore, Student, Guardian, StudentGuardianLink } from "@/contexts/GlobalStoreContext";
import { useStage, EducationalStage } from "@/contexts/StageContext";
import { getGradesForStage } from "@/lib/school-structure";
import { 
  Users, User, UserPlus, Phone, MessageSquare, Eye, Edit3, 
  Printer, Search, ArrowUpDown, Filter, Wallet, AlertCircle, CheckCircle2, 
  X, Link2, Unlink, Plus, Sparkles, ShieldCheck, Bus, GraduationCap, 
  Layers3, ExternalLink, Briefcase, Mail, MapPin, BadgeCheck, FileText,
  List, Grid, Download, HeartHandshake, PhoneCall, Check, UserCheck,
  Calendar, CreditCard, ChevronRight, Trash2
} from "lucide-react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { LuxurySelect, LuxurySelectOption } from "@/components/ui/luxury-select";
import { toast } from "sonner";

export const Route = createFileRoute("/guardians/")({
  head: () => ({
    meta: [
      { title: "أولياء الأمور والملفات العائلية | منصة مدارس" },
      { name: "description", content: "إدارة بيانات أولياء الأمور وملفات العائلات وربط الأبناء بدقة متناهية مع خيارات المراسلة والمتابعة المالية." },
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

const FINANCIAL_STATUS_OPTIONS: LuxurySelectOption[] = [
  { value: "all", label: "الكل (جميع الأوضاع المالية)", icon: Wallet },
  { value: "hasDues", label: "عليهم متأخرات مالية فقط", icon: AlertCircle, badge: "متأخرات", badgeTone: "danger" },
  { value: "noDues", label: "مسددين بالكامل (حسابات سليمة)", icon: CheckCircle2, badge: "مسدد", badgeTone: "success" },
];

const LINK_STATUS_OPTIONS: LuxurySelectOption[] = [
  { value: "all", label: "كل حالات الربط", icon: Users },
  { value: "linked", label: "لديهم أبناء مرتبطون فقط", icon: Link2, badge: "مرتبط", badgeTone: "primary" },
  { value: "unlinked", label: "بدون أبناء (بحاجة لربط)", icon: Unlink, badge: "غير مرتبط", badgeTone: "warning" },
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

function getStageBadgeStyle(stage?: EducationalStage | string) {
  switch (stage) {
    case "kindergarten":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25";
    case "primary":
      return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25";
    case "middle":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25";
    case "high":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25";
    default:
      return "bg-muted text-muted-foreground border-border/60";
  }
}

function getStageShortLabel(stage?: EducationalStage | string) {
  switch (stage) {
    case "kindergarten": return "روضة";
    case "primary": return "ابتدائي";
    case "middle": return "متوسط";
    case "high": return "ثانوي";
    default: return "";
  }
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

// Cached Collator for high performance Arabic alphabetical sorting across 15k items
const arabicCollator = new Intl.Collator("ar", { sensitivity: "base" });

function GuardiansList() {
  const { 
    allGuardians, 
    allStudents, 
    allSections, 
    addGuardian, 
    updateGuardian, 
    softDeleteGuardian, 
    updateStudent, 
    allInvoices, 
    currency 
  } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  
  // View mode: Table vs Family Cards
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Modals state
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
  const [deletingGuardian, setDeletingGuardian] = useState<Guardian | null>(null);
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
  const [addStudentSearchQuery, setAddStudentSearchQuery] = useState("");

  // WhatsApp template state
  const [whatsappTemplate, setWhatsappTemplate] = useState<"dues" | "summon" | "absence" | "excellence" | "custom">("dues");
  const [customMessage, setCustomMessage] = useState("");

  // Filters State (Strictly NO internal stage selector - respect global stage!)
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [filterSection, setFilterSection] = useState<string>("all");
  const [filterDues, setFilterDues] = useState<"all" | "hasDues" | "noDues">("all");
  const [filterLinkStatus, setFilterLinkStatus] = useState<"all" | "linked" | "unlinked">("all");
  const [sortBy, setSortBy] = useState<"name" | "childrenCount" | "dues">("name");
  const [showAllStagesChildren, setShowAllStagesChildren] = useState(false);

  // Pagination State for Table & Cards
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Student search inside linking modal
  const [studentSearchInModal, setStudentSearchInModal] = useState("");
  const [stageFilterInModal, setStageFilterInModal] = useState<string>("all");

  const [isPending, startTransition] = useTransition();
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearchQuery(searchQuery);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const activeGuardians = useMemo(() => allGuardians.filter(g => !g.isDeleted), [allGuardians]);

  // Robust $O(N + M)$ Bidirectional Student-Guardian Indexing
  // Completely fixes the identical duplicate children bug and 225M nested loop lag!
  const studentsByGuardianMap = useMemo(() => {
    const map = new Map<string, Student[]>();

    // 1. Initialize map and secondary lookup indices
    const guardianById = new Map<string, Guardian>();
    const guardiansByCleanPhone = new Map<string, string[]>(); // cleanPhone -> guardianIds[]
    const guardiansByName = new Map<string, string[]>(); // cleanName -> guardianIds[]

    for (let i = 0; i < activeGuardians.length; i++) {
      const g = activeGuardians[i];
      map.set(g.id, []);
      guardianById.set(g.id, g);

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
    }

    // 2. Map students to their exact guardian
    for (let i = 0; i < allStudents.length; i++) {
      const s = allStudents[i];
      if (s.isDeleted) continue;

      let matched = false;

      // A. Explicit guardians link array on student
      if (s.guardians && s.guardians.length > 0) {
        for (let j = 0; j < s.guardians.length; j++) {
          const gl = s.guardians[j];
          if (gl.id && map.has(gl.id)) {
            const list = map.get(gl.id)!;
            if (!list.some(existing => existing.id === s.id)) list.push(s);
            matched = true;
          } else if (gl.phone) {
            const cleanP = gl.phone.replace(/\D/g, "");
            const gIds = guardiansByCleanPhone.get(cleanP);
            if (gIds && gIds.length > 0) {
              for (let k = 0; k < gIds.length; k++) {
                const list = map.get(gIds[k])!;
                if (!list.some(existing => existing.id === s.id)) list.push(s);
              }
              matched = true;
            }
          }
        }
      }

      // B. Direct STU-15K-xxxxx -> GRD-15K-xxxxx mapping or explicit student.guardianId
      if (!matched) {
        const directGid = (s as any).guardianId || (s.id.startsWith("STU-") ? s.id.replace("STU-", "GRD-") : "");
        if (directGid && map.has(directGid)) {
          const list = map.get(directGid)!;
          if (!list.some(existing => existing.id === s.id)) list.push(s);
          matched = true;
        }
      }

      // C. Student guardianPhone matching clean guardian phone
      if (!matched && s.guardianPhone) {
        const cleanP = s.guardianPhone.replace(/\D/g, "");
        const gIds = guardiansByCleanPhone.get(cleanP);
        if (gIds && gIds.length > 0) {
          for (let k = 0; k < gIds.length; k++) {
            const list = map.get(gIds[k])!;
            if (!list.some(existing => existing.id === s.id)) list.push(s);
          }
          matched = true;
        }
      }

      // D. Last resort: only if guardian has NO phone and student has NO phone, match by exact name
      if (!matched && s.guardianName && !s.guardianPhone) {
        const cleanName = s.guardianName.trim().toLowerCase();
        const gIds = guardiansByName.get(cleanName);
        if (gIds && gIds.length === 1) {
          const list = map.get(gIds[0])!;
          if (list.length < 4 && !list.some(existing => existing.id === s.id)) {
            list.push(s);
            matched = true;
          }
        }
      }
    }

    return map;
  }, [activeGuardians, allStudents]);

  // Section Map for Fast Name Lookup
  const sectionByIdMap = useMemo(() => {
    const map = new Map<string, string>();
    allSections.forEach(sec => map.set(sec.id, sec.name));
    return map;
  }, [allSections]);

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

  // Combined guardians with calculated metadata & filtering
  const guardiansWithStudents = useMemo(() => {
    const q = debouncedSearchQuery.trim().toLowerCase();

    let result = activeGuardians.map(g => {
      const students = studentsByGuardianMap.get(g.id) || [];

      let totalDue = 0;
      for (let i = 0; i < students.length; i++) {
        totalDue += unpaidDuesByStudentIdMap.get(students[i].id) || 0;
      }

      // Check if guardian has at least one student in the current active stage
      const hasStudentInActiveStage = students.length === 0 ? false : students.some(s => s.stage === stage);

      return { 
        ...g, 
        students, 
        totalDue,
        hasStudentInActiveStage
      };
    });

    // 1. Stage Scope: filter guardians who have children in active stage by default
    if (!showAllStagesChildren) {
      result = result.filter(g => g.hasStudentInActiveStage);
    }

    // 2. Search query filter
    if (q) {
      result = result.filter(g => 
        g.name.toLowerCase().includes(q) || 
        g.phone.includes(q) || 
        (g.phoneSecond && g.phoneSecond.includes(q)) ||
        (g.nationalId && g.nationalId.includes(q)) ||
        (g.job && g.job.toLowerCase().includes(q)) ||
        g.students.some(s => s.name.toLowerCase().includes(q) || (s.nationalId && s.nationalId.includes(q)) || s.id.toLowerCase().includes(q))
      );
    }

    // 3. Financial Dues filter
    if (filterDues === "hasDues") {
      result = result.filter(g => g.totalDue > 0);
    } else if (filterDues === "noDues") {
      result = result.filter(g => g.totalDue === 0);
    }

    // 4. Link Status filter
    if (filterLinkStatus === "linked") {
      result = result.filter(g => g.students.length > 0);
    } else if (filterLinkStatus === "unlinked") {
      result = result.filter(g => g.students.length === 0);
    }

    // 5. Grade filter (scoped to active stage)
    if (filterGrade !== "all") {
      result = result.filter(g => g.students.some(s => s.grade === filterGrade));
    }

    // 6. Section filter
    if (filterSection !== "all") {
      result = result.filter(g => g.students.some(s => s.sectionId === filterSection));
    }

    // 7. Sorting
    result.sort((a, b) => {
      if (sortBy === "name") {
        return arabicCollator.compare(a.name, b.name);
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
    stage,
    showAllStagesChildren,
    filterGrade, 
    filterSection, 
    filterDues, 
    filterLinkStatus,
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

  // Grade options for active stage (No internal stage dropdown!)
  const gradeOptions: LuxurySelectOption[] = useMemo(() => {
    const grades = getGradesForStage(stage);
    return [
      { value: "all", label: "كل الصفوف الدراسية", icon: GraduationCap },
      ...grades.map(g => ({ value: g, label: g, icon: GraduationCap }))
    ];
  }, [stage]);

  // Section options for selected grade
  const availableSections = useMemo(() => {
    if (filterGrade === "all") return [];
    return allSections.filter(s => s.stage === stage && s.grade === filterGrade);
  }, [allSections, stage, filterGrade]);

  const sectionOptions: LuxurySelectOption[] = useMemo(() => {
    if (filterGrade === "all") {
      return [{ value: "all", label: "اختر الصف أولاً لتحديد الشعبة", disabled: true }];
    }
    return [
      { value: "all", label: "كل الشعب", icon: Layers3 },
      ...availableSections.map(sec => ({
        value: sec.id,
        label: `شعبة ${sec.name}`,
        sublabel: `${sec.grade}`,
        icon: Layers3
      }))
    ];
  }, [filterGrade, availableSections]);

  const hasActiveFilters = searchQuery !== "" || filterGrade !== "all" || filterSection !== "all" || filterDues !== "all" || filterLinkStatus !== "all";

  const clearAllFilters = () => {
    setSearchQuery("");
    setFilterGrade("all");
    setFilterSection("all");
    setFilterDues("all");
    setFilterLinkStatus("all");
    setSortBy("name");
    setCurrentPage(1);
  };

  // Filtered students for Add Guardian modal picker
  const filteredStudentsForAdd = useMemo(() => {
    if (!addStudentSearchQuery.trim()) return [];
    const q = addStudentSearchQuery.trim().toLowerCase();
    return allStudents.filter(s => 
      !s.isDeleted && (
        s.name.toLowerCase().includes(q) || 
        s.nationalId.includes(q) ||
        (s.grade && s.grade.toLowerCase().includes(q))
      )
    );
  }, [allStudents, addStudentSearchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(guardiansWithStudents.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedGuardians = useMemo(() => {
    return guardiansWithStudents.slice(startIndex, startIndex + pageSize);
  }, [guardiansWithStudents, startIndex, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterGrade, filterSection, filterDues, filterLinkStatus, sortBy, showAllStagesChildren]);

  // Add Guardian Handler
  const handleAddGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuardian.name.trim() || !newGuardian.phone.trim()) {
      toast.error("يرجى إدخال اسم ولي الأمر ورقم الجوال الأساسي");
      return;
    }

    const finalRelation = newGuardian.relation === "أخرى" 
      ? newGuardian.customRelation.trim() || "ولي أمر" 
      : newGuardian.relation;

    const newId = `GRD-ENTERPRISE-${Date.now()}`;

    // Create guardian
    addGuardian({
      id: newId,
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
    } as any);

    // Link selected students if any
    if (newGuardian.selectedStudentIds.length > 0) {
      newGuardian.selectedStudentIds.forEach(stId => {
        const student = allStudents.find(s => s.id === stId);
        if (student) {
          const existingLinks: StudentGuardianLink[] = student.guardians || [];
          const newLink: StudentGuardianLink = {
            id: `GL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: newGuardian.name.trim(),
            relation: finalRelation,
            phone: newGuardian.phone.trim(),
            phoneSecond: newGuardian.phoneSecond.trim() || undefined,
            email: newGuardian.email.trim() || undefined,
            job: newGuardian.job.trim() || undefined,
            isPrimary: existingLinks.length === 0,
            address: newGuardian.address.trim() || undefined,
          };
          updateStudent(student.id, {
            guardians: [...existingLinks, newLink],
            ...(existingLinks.length === 0 ? {
              guardianName: newGuardian.name.trim(),
              guardianPhone: newGuardian.phone.trim(),
              guardianRelation: finalRelation
            } : {})
          });
        }
      });
    }

    toast.success("تمت إضافة ملف ولي الأمر بنجاح");
    setIsAddModalOpen(false);

    // Reset form
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

  // Update Guardian Handler with full student synchronization
  const handleUpdateGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuardian) return;

    const oldGuardian = allGuardians.find(g => g.id === editingGuardian.id);
    const updatedName = editingGuardian.name.trim();
    const updatedPhone = editingGuardian.phone.trim();
    const updatedRelation = editingGuardian.relation;

    updateGuardian(editingGuardian.id, {
      name: updatedName,
      nationalId: editingGuardian.nationalId?.trim() || undefined,
      phone: updatedPhone,
      phoneSecond: editingGuardian.phoneSecond?.trim() || undefined,
      email: editingGuardian.email?.trim() || undefined,
      job: editingGuardian.job?.trim() || undefined,
      relation: updatedRelation,
      gender: editingGuardian.gender,
      address: editingGuardian.address?.trim() || undefined,
      notes: editingGuardian.notes?.trim() || undefined,
    });

    // Synchronize all linked students with updated guardian details
    const linkedStudents = studentsByGuardianMap.get(editingGuardian.id) || [];
    linkedStudents.forEach(student => {
      let isChanged = false;
      const existingLinks: StudentGuardianLink[] = student.guardians || [];
      const updatedLinks = existingLinks.map(link => {
        const isThisGuardian = (link.id && link.id === editingGuardian.id) ||
          (oldGuardian && (link.phone === oldGuardian.phone || link.name.trim() === oldGuardian.name.trim()));
        if (isThisGuardian) {
          isChanged = true;
          return {
            ...link,
            name: updatedName,
            phone: updatedPhone,
            phoneSecond: editingGuardian.phoneSecond?.trim() || undefined,
            relation: updatedRelation,
            email: editingGuardian.email?.trim() || undefined,
            job: editingGuardian.job?.trim() || undefined,
            address: editingGuardian.address?.trim() || undefined,
          };
        }
        return link;
      });

      const updates: Partial<Student> = {};
      if (isChanged) {
        updates.guardians = updatedLinks;
      }
      if (!oldGuardian || student.guardianPhone === oldGuardian.phone || student.guardianName === oldGuardian.name) {
        updates.guardianName = updatedName;
        updates.guardianPhone = updatedPhone;
        updates.guardianRelation = updatedRelation;
      }

      if (Object.keys(updates).length > 0) {
        updateStudent(student.id, updates);
      }
    });

    toast.success("تم تحديث بيانات ولي الأمر ومزامنة سجلات الأبناء المرتبطين بنجاح");
    setEditingGuardian(null);
  };

  // Link / Unlink Student Handlers
  const handleLinkStudent = (studentId: string, guardian: Guardian) => {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;

    const existingLinks: StudentGuardianLink[] = student.guardians || [];
    const isAlreadyLinked = existingLinks.some(l => l.phone === guardian.phone || l.name === guardian.name);
    
    if (isAlreadyLinked) {
      toast.error("هذا الطالب مرتبط بالفعل بهذا الملف العائلي");
      return;
    }

    const isPrimary = existingLinks.length === 0;
    const newLink: StudentGuardianLink = {
      id: `GL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
  const composeWhatsAppMessage = (
    g: Guardian, 
    students: Student[], 
    totalDue: number, 
    templateOverride?: "dues" | "summon" | "absence" | "excellence" | "custom"
  ) => {
    const tpl = templateOverride || whatsappTemplate;
    const studentNames = students.map(s => s.name).join("، ") || "أبنائكم";
    if (tpl === "dues") {
      return `السلام عليكم ورحمة الله وبركاته المكرم ولي الأمر / ${g.name} المحترم،\nنود تذكيركم بوجود مستحقات دراسية غير مسددة بمبلغ (${totalDue.toLocaleString()} ${currency}) للطلاب: [${studentNames}]. نرجو التكرم بالسداد في أقرب وقت شاكرين حسن تعاونكم وحرصكم الدائم.`;
    } else if (tpl === "summon") {
      return `السلام عليكم ورحمة الله وبركاته المكرم ولي الأمر / ${g.name} المحترم،\nترجو إدارة المدرسة من سعادتكم التكرم بزيارة المدرسة يوم (...............) لمناقشة أمور دراسية هامة تخص الطالب/ـة [${studentNames}].\nشاكرين تعاونكم الكريم.`;
    } else if (tpl === "absence") {
      return `السلام عليكم ورحمة الله وبركاته المكرم ولي الأمر / ${g.name} المحترم،\nنفيدكم بغياب الطالب/ـة [${studentNames}] عن اليوم الدراسي دون عذر مسبق. نرجو التواصل مع إدارة المدرسة لتبرير سبب الغياب وحرصاً على مصلحة وسلامة الطالب.`;
    } else if (tpl === "excellence") {
      return `السلام عليكم ورحمة الله وبركاته المكرم ولي الأمر / ${g.name} المحترم،\nيسر إدارة المدرسة أن تبارك لكم تميز وتفوق الطالب/ـة [${studentNames}] في التحصيل الدراسي والانضباط السلوكي. نثمن جهودكم المباركة ونتمنى دوام التوفيق والنجاح.`;
    }
    return customMessage || `السلام عليكم ورحمة الله وبركاته المكرم ولي الأمر / ${g.name} المحترم،\n`;
  };

  const openWhatsAppStudio = (item: { guardian: Guardian; students: Student[]; totalDue: number }) => {
    const initialTpl = item.totalDue > 0 ? "dues" : "summon";
    setWhatsappTemplate(initialTpl);
    setCustomMessage(composeWhatsAppMessage(item.guardian, item.students, item.totalDue, initialTpl));
    setWhatsappGuardian(item);
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

  // Export to CSV
  const handleExportCSV = () => {
    if (guardiansWithStudents.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    const headers = ["الاسم الرباعي", "صلة القرابة", "رقم الجوال", "رقم الهوية", "المهنة", "عدد الأبناء", "أسماء الأبناء", "المتأخرات المالية"];
    const rows = guardiansWithStudents.map(g => [
      `"${g.name}"`,
      `"${g.relation}"`,
      `"${g.phone}"`,
      `"${g.nationalId || ''}"`,
      `"${g.job || ''}"`,
      g.students.length,
      `"${g.students.map(s => s.name).join('; ')}"`,
      g.totalDue
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `سجل_أولياء_الأمور_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير سجل أولياء الأمور بنجاح");
  };

  const printTemplates: PrintTemplate[] = [
    {
      id: "guardians-list",
      name: "كشف أولياء الأمور والملفات العائلية المجمعة",
      category: "قوائم",
      type: "table",
      columns: [
        { label: "الاسم الرباعي", key: "name" },
        { label: "رقم الهوية / الإقامة", key: "nationalId", render: (g: any) => g.nationalId || "غير مسجل" },
        { label: "رقم الجوال", key: "phone" },
        { label: "صلة القرابة", key: "relation" },
        { label: "عدد الأبناء", key: "studentsCount", render: (g: any) => g.students.length.toString() },
        { label: "أسماء الأبناء والصفوف", key: "childrenNames", render: (g: any) => g.students.map((s: Student) => `${s.name} (${s.grade})`).join("، ") || "لا يوجد" },
        { label: "المتأخرات المالية", key: "totalDue", render: (g: any) => g.totalDue > 0 ? `${g.totalDue.toLocaleString()} ${currency}` : "مسدد بالكامل" },
      ],
      description: "طباعة كشف شامل ومفصل بأولياء الأمور مع أرقام الهواتف وبيانات الأبناء والوضع المالي"
    },
    {
      id: "guardians-dues-only",
      name: "كشف المطالبات المالية والمتأخرات لأولياء الأمور",
      category: "مالية",
      type: "table",
      columns: [
        { label: "ولي الأمر", key: "name" },
        { label: "رقم الجوال", key: "phone" },
        { label: "الطلاب المستحق عليهم", key: "childrenNames", render: (g: any) => g.students.map((s: Student) => `${s.name}`).join("، ") },
        { label: "المبلغ المتبقي", key: "totalDue", render: (g: any) => `${g.totalDue.toLocaleString()} ${currency}` },
      ],
      description: "تقرير مالي مخصص لأولياء الأمور الذين عليهم متأخرات مالية للمتابعة والتحصيل"
    }
  ];

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "شؤون الطلاب", to: "/students" },
        { label: "أولياء الأمور والملفات العائلية" }
      ]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted/70 p-1 rounded-xl border border-border/80 shadow-xs">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                viewMode === "table"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="عرض الجدول التنفيذي"
            >
              <List className="h-3.5 w-3.5" />
              <span>جدول</span>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                viewMode === "cards"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="عرض بطاقات العائلات"
            >
              <Grid className="h-3.5 w-3.5" />
              <span>بطاقات</span>
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-card px-3 text-xs font-bold text-foreground hover:bg-accent transition-all border border-border/80 shadow-xs active:scale-[0.98]"
            title="تصدير بيانات أولياء الأمور إلى Excel / CSV"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" /> تصدير
          </button>

          {/* Print */}
          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-card px-3 text-xs font-bold text-foreground hover:bg-accent transition-all border border-border/80 shadow-xs active:scale-[0.98]"
          >
            <Printer className="h-3.5 w-3.5 text-muted-foreground" /> طباعة
          </button>

          {/* Add Guardian Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4" /> إضافة ولي أمر
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-300">
        
        {/* Luxury Top Metric Cards (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Guardians */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-muted-foreground mb-1">إجمالي أولياء الأمور</p>
                <h3 className="text-3xl font-black tabular-nums tracking-tight text-foreground">{guardiansWithStudents.length}</h3>
                <p className="text-[11px] font-bold text-primary mt-1.5 flex items-center gap-1">
                  <BadgeCheck className="h-3.5 w-3.5" /> ملفات عائلية نشطة ومعتمدة
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-xs">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Card 2: Student Coverage */}
          <div className="relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-card to-background p-5 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-sky-600 dark:text-sky-400 mb-1">الطلاب والأبناء المرتبطون</p>
                <h3 className="text-3xl font-black tabular-nums tracking-tight text-foreground">{totalLinkedStudents}</h3>
                <p className="text-[11px] font-bold text-muted-foreground mt-1.5 flex items-center gap-1">
                  <HeartHandshake className="h-3.5 w-3.5 text-sky-500" />
                  متوسط <span className="text-sky-600 dark:text-sky-400 font-black">{guardiansWithStudents.length > 0 ? (totalLinkedStudents / guardiansWithStudents.length).toFixed(1) : 0}</span> طالب لكل عائلة
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-xs">
                <GraduationCap className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Card 3: Indebted Guardians */}
          <div 
            onClick={() => setFilterDues(filterDues === "hasDues" ? "all" : "hasDues")}
            className={`cursor-pointer relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md group ${
              filterDues === "hasDues"
                ? "border-danger ring-2 ring-danger/40 bg-danger/15 shadow-md"
                : "border-danger/25 bg-gradient-to-br from-danger/10 via-card to-background hover:border-danger/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-danger mb-1 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
                  </span>
                  المتأخرات المالية المعلقة
                  {filterDues === "hasDues" && (
                    <span className="mr-1 text-[10px] bg-danger text-white px-1.5 py-0.2 rounded font-black">نشط</span>
                  )}
                </p>
                <h3 className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-danger flex items-baseline gap-1">
                  {totalOutstandingDues.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">{currency}</span>
                </h3>
                <p className="text-[11px] font-bold text-muted-foreground mt-1.5">
                  على <span className="text-danger font-black">{indebtedGuardiansCount}</span> عائلة (انقر للتصفية)
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-danger/15 text-danger flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Wallet className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Card 4: Paid Guardians */}
          <div 
            onClick={() => setFilterDues(filterDues === "noDues" ? "all" : "noDues")}
            className={`cursor-pointer relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md group ${
              filterDues === "noDues"
                ? "border-success ring-2 ring-success/40 bg-success/15 shadow-md"
                : "border-success/25 bg-gradient-to-br from-success/10 via-card to-background hover:border-success/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-success mb-1 flex items-center gap-1">
                  <span>عائلات مسددة بالكامل</span>
                  {filterDues === "noDues" && (
                    <span className="mr-1 text-[10px] bg-success text-white px-1.5 py-0.2 rounded font-black">نشط</span>
                  )}
                </p>
                <h3 className="text-3xl font-black tabular-nums tracking-tight text-success">{paidGuardiansCount}</h3>
                <p className="text-[11px] font-bold text-muted-foreground mt-1.5">
                  نسبة الانضباط: <span className="text-success font-black">{guardiansWithStudents.length > 0 ? Math.round((paidGuardiansCount / guardiansWithStudents.length) * 100) : 0}%</span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-success/15 text-success flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Global Stage Active Scope Notice & Filters Hub */}
        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-4">
          
          {/* Header Strip: Active Stage Context + Stage Scope Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse"></span>
              <span className="text-xs font-black text-muted-foreground">النطاق الأكاديمي النشط:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 text-primary font-black text-xs border border-primary/20">
                <GraduationCap className="h-3.5 w-3.5" />
                {getStageLabel(stage)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-muted-foreground">نطاق التصفية:</span>
              <div className="inline-flex rounded-xl bg-muted/70 p-1 border border-border/70 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowAllStagesChildren(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                    !showAllStagesChildren
                      ? "bg-card text-primary shadow-xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>{getStageLabel(stage)} (المرحلة الحالية)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAllStagesChildren(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                    showAllStagesChildren
                      ? "bg-card text-primary shadow-xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>كافة المراحل المدرسية</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 1: Omni-Search, Financial Status, Link Status, Sorting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            
            {/* Quick Omni-Search */}
            <div className="lg:col-span-4 relative">
              <label className="mb-1.5 block text-xs font-black text-muted-foreground">البحث الشامل الذكي</label>
              <div className="relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم، الهوية، الجوال، أو اسم الطالب..."
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
            <div className="lg:col-span-3">
              <LuxurySelect
                label="الموقف المالي"
                value={filterDues}
                onChange={(val) => setFilterDues(val as any)}
                options={FINANCIAL_STATUS_OPTIONS}
                placeholder="تصفية الوضع المالي"
                icon={Wallet}
                size="md"
              />
            </div>

            {/* Link Status Filter */}
            <div className="lg:col-span-3">
              <LuxurySelect
                label="حالة الربط بالأبناء"
                value={filterLinkStatus}
                onChange={(val) => setFilterLinkStatus(val as any)}
                options={LINK_STATUS_OPTIONS}
                placeholder="حالة الربط"
                icon={Users}
                size="md"
              />
            </div>

            {/* Sort Filter */}
            <div className="lg:col-span-2">
              <LuxurySelect
                label="ترتيب النتائج"
                value={sortBy}
                onChange={(val) => setSortBy(val as any)}
                options={SORT_OPTIONS}
                placeholder="الترتيب"
                icon={ArrowUpDown}
                size="md"
              />
            </div>
          </div>

          {/* Row 2: Cascading Grade & Section Selects (Scoped to current stage) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/60">
            {/* Grade Selector */}
            <div>
              <LuxurySelect
                label={`الصف الدراسي (${getStageLabel(stage)})`}
                value={filterGrade}
                onChange={(val) => {
                  setFilterGrade(val);
                  setFilterSection("all");
                }}
                options={gradeOptions}
                placeholder="الصف الدراسي"
                icon={GraduationCap}
                size="md"
                searchable={gradeOptions.length > 5}
              />
            </div>

            {/* Section Cascading Selector */}
            <div>
              <LuxurySelect
                label="الشعبة الدراسية"
                value={filterSection}
                onChange={(val) => setFilterSection(val)}
                options={sectionOptions}
                placeholder={filterGrade === "all" ? "اختر الصف لتحديد الشعبة" : "الشعبة الدراسية"}
                icon={Layers3}
                size="md"
                disabled={filterGrade === "all" || availableSections.length === 0}
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
                    {filterDues === "hasDues" ? "عليهم متأخرات مالية" : "مسددين بالكامل"}
                    <button onClick={() => setFilterDues("all")} className="hover:text-foreground"><X className="h-3 w-3" /></button>
                  </span>
                )}

                {filterLinkStatus !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold border border-primary/20">
                    {filterLinkStatus === "linked" ? "لديهم أبناء مرتبطون" : "بدون أبناء"}
                    <button onClick={() => setFilterLinkStatus("all")} className="hover:text-foreground"><X className="h-3 w-3" /></button>
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

        {/* RESULTS PRESENTATION: DUAL MODES (TABLE vs CARDS) */}
        {guardiansWithStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-12 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mb-4">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-base font-black text-foreground mb-1">لا توجد نتائج مطابقة لخيارات البحث أو التصفية</h3>
            <p className="text-xs text-muted-foreground font-medium max-w-sm mb-4">
              جرّب تغيير عبارة البحث، أو إزالة بعض الفلاتر المفعلة، أو إضافة ولي أمر جديد للنظام.
            </p>
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-xs hover:bg-primary/90 transition-all"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : viewMode === "table" ? (
          /* =========================================================================
             MODE A: EXECUTIVE HIGH-PERFORMANCE TABLE VIEW
             ========================================================================= */
          <PageCard className="p-0 overflow-hidden border-border/70 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-bold">
                    <th className="py-3 px-3.5 w-[26%] text-right font-extrabold">
                      ولي الأمر والملف التعريفي
                    </th>
                    <th className="py-3 px-3.5 w-[18%] text-right font-extrabold">بيانات التواصل والواتساب</th>
                    <th className="py-3 px-3.5 w-[30%] text-right font-extrabold">الأبناء المرتبطون (الملف العائلي)</th>
                    <th className="py-3 px-3.5 w-[14%] text-right font-extrabold">الموقف المالي</th>
                    <th className="py-3 px-3.5 w-[12%] text-center font-extrabold">التحكم السريع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {paginatedGuardians.map((g) => {
                    const initials = g.name.trim().split(" ").slice(0, 2).map((n: string) => n[0]).join("");
                    const indebtedCount = g.students.filter(s => (unpaidDuesByStudentIdMap.get(s.id) || 0) > 0).length;

                    return (
                      <tr 
                        key={g.id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        {/* Column 1: Guardian Details */}
                        <td className="py-2.5 px-3.5 align-middle">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs border border-primary/20 shrink-0">
                              {initials || <User className="h-4 w-4" />}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Link
                                  to="/guardians/$id"
                                  params={{ id: g.id }}
                                  className="font-extrabold text-foreground hover:text-primary transition-colors hover:underline truncate max-w-[190px]"
                                  title={g.name}
                                >
                                  {g.name}
                                </Link>
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border shrink-0 ${getRelationColor(g.relation)}`}>
                                  {g.relation}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                {g.nationalId && (
                                  <span className="font-mono tabular-nums bg-muted/60 px-1 py-0.2 rounded border border-border/40">
                                    هوية: {g.nationalId}
                                  </span>
                                )}
                                {g.job && (
                                  <span className="truncate max-w-[130px] flex items-center gap-1" title={g.job}>
                                    <Briefcase className="h-3 w-3 shrink-0 text-muted-foreground/80" />
                                    <span>{g.job}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Contact Info & WhatsApp */}
                        <td className="py-2.5 px-3.5 align-middle">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <a 
                                href={`tel:${g.phone}`}
                                className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground hover:text-primary transition-colors tabular-nums"
                                dir="ltr"
                              >
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span>{g.phone}</span>
                              </a>
                              <button
                                onClick={() => openWhatsAppStudio({ guardian: g, students: g.students, totalDue: g.totalDue })}
                                className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-2xs"
                                title="مراسلة واتساب فورية"
                              >
                                <MessageSquare className="h-3 w-3" />
                              </button>
                            </div>
                            {g.phoneSecond ? (
                              <p className="font-mono text-[10px] text-muted-foreground tabular-nums flex items-center gap-1" dir="ltr">
                                <Phone className="h-2.5 w-2.5 text-muted-foreground" />
                                <span>{g.phoneSecond}</span>
                              </p>
                            ) : g.email ? (
                              <p className="text-[10px] text-muted-foreground truncate max-w-[140px] flex items-center gap-1" title={g.email}>
                                <Mail className="h-2.5 w-2.5 shrink-0" />
                                <span>{g.email}</span>
                              </p>
                            ) : null}
                          </div>
                        </td>

                        {/* Column 3: Sleek Interactive Children Chips */}
                        <td className="py-2.5 px-3.5 align-middle">
                          <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                            {g.students.length === 0 ? (
                              <button
                                onClick={() => setLinkingGuardian({ guardian: g, linkedStudents: g.students })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-border/80 text-[11px] font-bold text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
                              >
                                <Plus className="h-3 w-3" />
                                <span>ربط طالب بهذا الملف</span>
                              </button>
                            ) : (
                              <>
                                {g.students.map((st: Student) => {
                                  const studentDue = unpaidDuesByStudentIdMap.get(st.id) || 0;
                                  const isCurrentStage = st.stage === stage;
                                  const secName = st.sectionId ? sectionByIdMap.get(st.sectionId) : undefined;
                                  return (
                                    <Link
                                      key={st.id}
                                      to="/students/$id"
                                      params={{ id: st.id }}
                                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-xs font-bold transition-all shadow-2xs ${
                                        isCurrentStage 
                                          ? "bg-primary/10 text-primary border-primary/25 hover:bg-primary/20" 
                                          : "bg-muted/50 text-foreground border-border/70 hover:bg-muted"
                                      }`}
                                      title={`${st.name} • ${st.grade}${secName ? ` (${secName})` : ""}`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.gender === "أنثى" ? "bg-rose-500" : "bg-sky-500"}`} />
                                      <span className="font-extrabold">{st.name.split(" ")[0]}</span>
                                      <span className="text-[10px] text-muted-foreground font-semibold">({st.grade})</span>
                                      {studentDue > 0 ? (
                                        <span className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0" title={`متأخرات: ${studentDue.toLocaleString()} ${currency}`} />
                                      ) : (
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="مسدد" />
                                      )}
                                    </Link>
                                  );
                                })}
                                <button
                                  onClick={() => setLinkingGuardian({ guardian: g, linkedStudents: g.students })}
                                  className="p-1 rounded-md border border-dashed border-border/80 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all"
                                  title="ربط طالب إضافي"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Column 4: Financial Status */}
                        <td className="py-2.5 px-3.5 align-middle">
                          <div className="space-y-0.5">
                            {g.totalDue > 0 ? (
                              <>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-danger/10 border border-danger/25 text-danger font-black text-xs tabular-nums">
                                  <AlertCircle className="w-3 h-3 shrink-0" />
                                  <span>{g.totalDue.toLocaleString()} {currency}</span>
                                </span>
                                <p className="text-[10px] text-muted-foreground font-bold">
                                  متأخرات على ({indebtedCount}) طلاب
                                </p>
                              </>
                            ) : (
                              <>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                                  <span>مسدد بالكامل</span>
                                </span>
                                <p className="text-[10px] text-muted-foreground font-medium">حساب سليم</p>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Column 5: Clean Symmetrical Actions */}
                        <td className="py-2.5 px-3.5 align-middle text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Link
                              to="/guardians/$id"
                              params={{ id: g.id }}
                              className="p-1.5 rounded-lg border border-border/80 bg-card hover:bg-accent text-foreground transition-colors"
                              title="عرض الملف العائلي الشامل (360°)"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-500" />
                            </Link>

                            <button
                              onClick={() => openWhatsAppStudio({ guardian: g, students: g.students, totalDue: g.totalDue })}
                              className="p-1.5 rounded-lg border border-border/80 bg-card hover:bg-accent text-foreground transition-colors"
                              title="إرسال رسالة واتساب"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                            </button>

                            <button
                              onClick={() => setLinkingGuardian({ guardian: g, linkedStudents: g.students })}
                              className="p-1.5 rounded-lg border border-border/80 bg-card hover:bg-accent text-foreground transition-colors"
                              title="إدارة ربط وفك الأبناء"
                            >
                              <Link2 className="w-3.5 h-3.5 text-sky-500" />
                            </button>

                            <button
                              onClick={() => setEditingGuardian(g)}
                              className="p-1.5 rounded-lg border border-border/80 bg-card hover:bg-accent text-foreground transition-colors"
                              title="تعديل بيانات ولي الأمر"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                            </button>

                            <button
                              onClick={() => setDeletingGuardian(g)}
                              className="p-1.5 rounded-lg border border-border/80 bg-card hover:bg-accent text-foreground transition-colors"
                              title="أرشفة / حذف ملف ولي الأمر"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-danger" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60 bg-muted/15 px-4 py-3 text-xs font-bold text-muted-foreground">
              <div>
                عرض <span className="font-black text-foreground">{startIndex + 1}</span> - <span className="font-black text-foreground">{Math.min(startIndex + pageSize, guardiansWithStudents.length)}</span> من إجمالي <span className="font-black text-foreground">{guardiansWithStudents.length.toLocaleString()}</span> ولي أمر
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold">العدد بالصفحة:</span>
                {[15, 25, 50, 100].map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-colors ${
                      pageSize === size
                        ? "bg-primary text-primary-foreground font-black"
                        : "bg-card border border-border/70 hover:bg-accent text-foreground"
                    }`}
                  >
                    {size}
                  </button>
                ))}

                <div className="flex items-center gap-1 mr-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg border border-border/80 bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    title="الصفحة السابقة"
                  >
                    السابق
                  </button>
                  <span className="px-2 font-black text-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-1.5 rounded-lg border border-border/80 bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    title="الصفحة التالية"
                  >
                    التالي
                  </button>
                </div>
              </div>
            </div>
          </PageCard>
        ) : (
          /* =========================================================================
             MODE B: FAMILY DOSSIER CARDS GRID VIEW
             ========================================================================= */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginatedGuardians.map((g) => {
                const initials = g.name.trim().split(" ").slice(0, 2).map((n: string) => n[0]).join("");
                return (
                  <div
                    key={g.id}
                    className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between space-y-4 group"
                  >
                    {/* Header: Guardian Info & Quick Contact Buttons */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm border border-primary/20 shrink-0">
                            {initials || <User className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Link
                                to="/guardians/$id"
                                params={{ id: g.id }}
                                className="font-black text-base text-foreground hover:text-primary transition-colors hover:underline"
                              >
                                {g.name}
                              </Link>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${getRelationColor(g.relation)}`}>
                                {g.relation}
                              </span>
                              {g.nationalId && (
                                <span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                                  {g.nationalId}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Top-Right Quick Contact Badges */}
                        <div className="flex items-center gap-1">
                          <a
                            href={`tel:${g.phone}`}
                            className="p-2 rounded-xl bg-muted/60 text-foreground hover:bg-primary hover:text-primary-foreground transition-all shadow-2xs"
                            title={`اتصال: ${g.phone}`}
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                          <button
                            onClick={() => openWhatsAppStudio({ guardian: g, students: g.students, totalDue: g.totalDue })}
                            className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-2xs"
                            title="مراسلة واتساب"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Job & Address Bar */}
                      {(g.job || g.address) && (
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/50">
                          {g.job && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Briefcase className="h-3 w-3 text-muted-foreground" /> {g.job}
                            </span>
                          )}
                          {g.address && (
                            <span className="flex items-center gap-1 text-[11px] truncate max-w-[200px]" title={g.address}>
                              <MapPin className="h-3 w-3 text-muted-foreground" /> {g.address}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Financial Status Bar */}
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                        g.totalDue > 0 
                          ? "bg-danger/10 border-danger/25 text-danger" 
                          : "bg-success/10 border-success/25 text-success"
                      }`}>
                        <div className="flex items-center gap-1.5">
                          {g.totalDue > 0 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          <span>{g.totalDue > 0 ? "المتأخرات المالية:" : "الموقف المالي:"}</span>
                        </div>
                        <span className="font-black tabular-nums">
                          {g.totalDue > 0 ? `${g.totalDue.toLocaleString()} ${currency}` : "مسدد بالكامل"}
                        </span>
                      </div>

                      {/* Children Dossier Deck */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-muted-foreground flex items-center gap-1">
                            <GraduationCap className="h-3.5 w-3.5 text-primary" />
                            الأبناء المسجلون ({g.students.length}):
                          </span>
                          <button
                            onClick={() => setLinkingGuardian({ guardian: g, linkedStudents: g.students })}
                            className="text-[11px] font-black text-primary hover:underline flex items-center gap-1"
                          >
                            <Link2 className="h-3 w-3" /> إدارة الربط
                          </button>
                        </div>

                        {g.students.length === 0 ? (
                          <div className="p-3 rounded-xl border border-dashed border-border/80 text-center text-xs text-muted-foreground font-medium bg-muted/20">
                            لا يوجد طلاب مرتبطين بهذا الملف بعد.
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                            {g.students.map((st: Student) => {
                              const studentDue = unpaidDuesByStudentIdMap.get(st.id) || 0;
                              const secName = st.sectionId ? sectionByIdMap.get(st.sectionId) : undefined;
                              return (
                                <div
                                  key={st.id}
                                  className="flex items-center justify-between p-2 rounded-xl border border-border/70 bg-background/80 hover:border-primary/40 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                                      st.gender === "أنثى" ? "bg-rose-500/10 text-rose-600" : "bg-sky-500/10 text-sky-600"
                                    }`}>
                                      {st.name.charAt(0)}
                                    </div>
                                    <div>
                                      <Link
                                        to="/students/$id"
                                        params={{ id: st.id }}
                                        className="text-xs font-black text-foreground hover:text-primary transition-colors block"
                                      >
                                        {st.name}
                                      </Link>
                                      <p className="text-[10px] text-muted-foreground">
                                        <span className={`px-1 py-0.2 rounded text-[9px] font-bold border ml-1 ${getStageBadgeStyle(st.stage)}`}>
                                          {getStageShortLabel(st.stage)}
                                        </span>
                                        {st.grade} {secName ? `• شعبة ${secName}` : ""}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {studentDue > 0 ? (
                                      <span className="text-[10px] font-black text-danger bg-danger/10 px-1.5 py-0.5 rounded">
                                        {studentDue.toLocaleString()} {currency}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-black text-success bg-success/10 px-1.5 py-0.5 rounded">
                                        مسدد
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: Quick Actions */}
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingGuardian(g)}
                          className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="تعديل بيانات ولي الأمر"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setLinkingGuardian({ guardian: g, linkedStudents: g.students })}
                          className="p-2 rounded-xl text-muted-foreground hover:text-sky-600 hover:bg-sky-500/10 transition-colors"
                          title="ربط أبناء جدد"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingGuardian(g)}
                          className="p-2 rounded-xl text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                          title="أرشفة / حذف ملف ولي الأمر"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <Link
                        to="/guardians/$id"
                        params={{ id: g.id }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-xs hover:bg-primary/90 transition-all active:scale-[0.98]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>فتح الملف الكامل</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls for Grid */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border border-border/80 rounded-2xl bg-card px-4 py-3 text-xs font-bold text-muted-foreground">
              <div>
                عرض <span className="font-black text-foreground">{startIndex + 1}</span> - <span className="font-black text-foreground">{Math.min(startIndex + pageSize, guardiansWithStudents.length)}</span> من إجمالي <span className="font-black text-foreground">{guardiansWithStudents.length.toLocaleString()}</span> ولي أمر
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px]">عدد السجلات بالصفحة:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-border/80 bg-background px-2 py-1 text-xs font-bold text-foreground"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>

                <div className="flex items-center gap-1 mr-3">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg border border-border/80 bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    السابق
                  </button>
                  <span className="px-2 font-black text-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-1.5 rounded-lg border border-border/80 bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    التالي
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Print Engine */}
      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title="كشف أولياء الأمور والملفات العائلية"
        data={guardiansWithStudents}
        templates={printTemplates} 
      />

      {/* =========================================================================
          MODAL 1: ADD GUARDIAN MODAL
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-2xl modal-card-luxury my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/60 flex justify-between items-center bg-primary/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-black text-lg text-foreground">إضافة ولي أمر وملف عائلي جديد</h2>
                  <p className="text-xs text-muted-foreground font-medium">تسجيل بيانات ولي الأمر وتحديد صلة القرابة مع إمكانية ربط الأبناء فوراً</p>
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
                      الاسم الرباعي الكامل <span className="text-danger">*</span>
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
                      className="h-10 w-full rounded-xl border border-primary/30 bg-background px-4 text-xs font-bold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="مثال: خال الطالب، ابن العم، الوصي الشرعي..."
                    />
                  </div>
                )}
              </div>

              {/* Section 2: Contact Information */}
              <div className="space-y-3 pt-3 border-t border-border/60">
                <h3 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> بيانات التواصل والاتصال
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-black text-foreground mb-1.5">
                      رقم الجوال الأساسي <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={newGuardian.phone}
                        onChange={e => setNewGuardian(prev => ({ ...prev, phone: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-border/80 bg-background px-4 text-xs sm:text-sm font-bold shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 tabular-nums font-mono"
                        placeholder="05XXXXXXXX"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-foreground mb-1.5">
                      رقم جوال إضافي (احتياطي)
                    </label>
                    <input
                      type="tel"
                      value={newGuardian.phoneSecond}
                      onChange={e => setNewGuardian(prev => ({ ...prev, phoneSecond: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-border/80 bg-background px-4 text-xs sm:text-sm font-bold shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 tabular-nums font-mono"
                      placeholder="05XXXXXXXX"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-black text-foreground mb-1.5">المهنة / الوظيفة</label>
                    <input
                      type="text"
                      value={newGuardian.job}
                      onChange={e => setNewGuardian(prev => ({ ...prev, job: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-border/80 bg-background px-4 text-xs sm:text-sm font-bold shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="مثال: مهندس، موظف حكومي..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-foreground mb-1.5">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={newGuardian.email}
                      onChange={e => setNewGuardian(prev => ({ ...prev, email: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-border/80 bg-background px-4 text-xs sm:text-sm font-bold shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="parent@example.com"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-foreground mb-1.5">العنوان السكني</label>
                  <input
                    type="text"
                    value={newGuardian.address}
                    onChange={e => setNewGuardian(prev => ({ ...prev, address: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background px-4 text-xs sm:text-sm font-bold shadow-xs transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="المدينة، الحي، اسم الشارع..."
                  />
                </div>
              </div>

              {/* Section 3: Student Linking */}
              <div className="space-y-3 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" /> ربط الأبناء والطلاب (اختياري)
                  </h3>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    تم ربط {newGuardian.selectedStudentIds.length} طالب
                  </span>
                </div>

                {/* Selected Students Chips */}
                {newGuardian.selectedStudentIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                    {newGuardian.selectedStudentIds.map(stId => {
                      const student = allStudents.find(s => s.id === stId);
                      if (!student) return null;
                      return (
                        <span 
                          key={stId} 
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-card border border-primary/30 text-xs font-black text-foreground shadow-xs animate-in zoom-in-95 duration-150"
                        >
                          <GraduationCap className="h-3 w-3 text-primary" />
                          <span>{student.name}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">({student.grade})</span>
                          <button
                            type="button"
                            onClick={() => setNewGuardian(prev => ({
                              ...prev,
                              selectedStudentIds: prev.selectedStudentIds.filter(id => id !== stId)
                            }))}
                            className="p-0.5 rounded-full hover:bg-danger/10 hover:text-danger text-muted-foreground transition-colors mr-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Search for student */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={addStudentSearchQuery}
                      onChange={e => setAddStudentSearchQuery(e.target.value)}
                      placeholder="ابحث بالاسم أو رقم الهوية لإضافة طالب لهذا الملف العائلي..."
                      className="h-10 w-full rounded-xl border border-border/80 bg-background pr-10 pl-4 text-xs font-bold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Search Results Dropdown List */}
                  {addStudentSearchQuery.trim().length >= 2 && (
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-border/80 bg-card divide-y divide-border/50 shadow-lg custom-scrollbar-modal">
                      {filteredStudentsForAdd.length === 0 ? (
                        <div className="p-3 text-center text-xs text-muted-foreground font-bold">
                          لم يتم العثور على طالب مطابق لبحثك.
                        </div>
                      ) : (
                        filteredStudentsForAdd.slice(0, 10).map(s => {
                          const isSelected = newGuardian.selectedStudentIds.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setNewGuardian(prev => ({ ...prev, selectedStudentIds: prev.selectedStudentIds.filter(id => id !== s.id) }));
                                } else {
                                  setNewGuardian(prev => ({ ...prev, selectedStudentIds: [...prev.selectedStudentIds, s.id] }));
                                }
                              }}
                              className={`w-full p-2.5 text-right flex items-center justify-between hover:bg-muted/60 transition-colors text-xs ${
                                isSelected ? "bg-primary/10 font-black text-primary" : "text-foreground font-bold"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                  {s.name[0]}
                                </div>
                                <div>
                                  <p className="font-bold">{s.name}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {s.grade} {s.sectionId ? `• شعبة ${sectionByIdMap.get(s.sectionId) || s.sectionId}` : ""} • هوية: {s.nationalId}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isSelected ? (
                                  <span className="flex items-center gap-1 text-[10px] font-black text-primary bg-primary/15 px-2 py-0.5 rounded-md">
                                    <Check className="h-3 w-3" /> تم الاختيار
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground border border-border px-2 py-0.5 rounded-md hover:border-primary">
                                    <Plus className="h-3 w-3" /> ربط
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex gap-3 border-t border-border/60">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-primary py-3 text-xs sm:text-sm font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-[0.98]"
                >
                  حفظ وتسجيل ولي الأمر
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

      {/* =========================================================================
          MODAL 2: EDIT GUARDIAN MODAL
          ========================================================================= */}
      {editingGuardian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-2xl modal-card-luxury my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/60 flex justify-between items-center bg-primary/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-black text-lg text-foreground">تعديل بيانات ولي الأمر</h2>
                  <p className="text-xs text-muted-foreground font-medium">تحديث بيانات الهوية والتواصل والمهنة</p>
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
                <label className="block text-xs font-black text-foreground mb-1.5">الاسم الرباعي الكامل <span className="text-danger">*</span></label>
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
                    options={GUARDIAN_RELATION_FALLBACK(editingGuardian.relation)}
                    placeholder="صلة القرابة"
                    icon={User}
                    size="md"
                    required
                  />
                </div>
              </div>

              {editingGuardian.relation === "أخرى" && (
                <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 animate-in fade-in zoom-in-95 duration-200">
                  <label className="block text-xs font-black text-primary mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> حدد صلة القرابة يدوياً <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={(editingGuardian as any).customRelation || ""}
                    onChange={e => setEditingGuardian({ ...editingGuardian, customRelation: e.target.value } as any)}
                    className="h-10 w-full rounded-xl border border-primary/30 bg-background px-4 text-xs font-bold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="مثال: خال الطالب، ابن العم، الوصي الشرعي..."
                  />
                </div>
              )}

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
                <label className="block text-xs font-black text-foreground mb-1.5">العنوان السكني</label>
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

      {/* =========================================================================
          MODAL 3: STUDENT LINKING STUDIO MODAL
          ========================================================================= */}
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
              
              {/* Current Linked Students List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-foreground flex items-center justify-between">
                  <span>الأبناء المرتبطون بالملف العائلي ({linkingGuardian.linkedStudents.length})</span>
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
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            st.gender === "أنثى" ? "bg-rose-500/10 text-rose-600" : "bg-sky-500/10 text-sky-600"
                          }`}>
                            <GraduationCap className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-foreground">{st.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              <span className={`px-1 rounded text-[9px] font-bold border ml-1 ${getStageBadgeStyle(st.stage)}`}>
                                {getStageShortLabel(st.stage)}
                              </span>
                              {st.grade} • هوية: {st.nationalId || "غير مسجل"}
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
                  <Plus className="h-4 w-4" /> ربط طالب مسجل بالمدرسة
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
                        !st.isDeleted &&
                        !linkingGuardian.linkedStudents.some(ls => ls.id === st.id) &&
                        (st.name.toLowerCase().includes(studentSearchInModal.toLowerCase()) || 
                         (st.nationalId && st.nationalId.includes(studentSearchInModal)))
                      )
                      .slice(0, 8)
                      .map(st => (
                        <div key={st.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/60 hover:border-primary/50 transition-colors">
                          <div>
                            <p className="text-xs font-bold text-foreground">{st.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              <span className={`px-1 rounded text-[9px] font-bold border ml-1 ${getStageBadgeStyle(st.stage)}`}>
                                {getStageShortLabel(st.stage)}
                              </span>
                              {st.grade}
                            </p>
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

      {/* =========================================================================
          MODAL 4: INSTANT WHATSAPP MESSAGE STUDIO
          ========================================================================= */}
      {whatsappGuardian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto">
          <div className="w-full max-w-lg modal-card-luxury my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border/60 flex justify-between items-center bg-emerald-500/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-black text-lg text-foreground">استوديو مراسلة واتساب الفورية</h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    إرسال إشعار رسمي لولي الأمر: <span className="font-black text-foreground">{whatsappGuardian.guardian.name}</span>
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
                <label className="block text-xs font-black text-foreground mb-1.5">اختر قالب الرسالة المناسب</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setWhatsappTemplate("dues")}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      whatsappTemplate === "dues" 
                        ? "bg-danger/10 border-danger text-danger font-black shadow-xs" 
                        : "bg-background border-border/80 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    💰 مطالبة مالية
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWhatsappTemplate("dues");
                      setCustomMessage(composeWhatsAppMessage(whatsappGuardian.guardian, whatsappGuardian.students, whatsappGuardian.totalDue, "dues"));
                    }}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      whatsappTemplate === "dues" 
                        ? "bg-danger/10 border-danger text-danger font-black shadow-xs" 
                        : "bg-background border-border/80 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    💰 مطالبة مالية
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWhatsappTemplate("summon");
                      setCustomMessage(composeWhatsAppMessage(whatsappGuardian.guardian, whatsappGuardian.students, whatsappGuardian.totalDue, "summon"));
                    }}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      whatsappTemplate === "summon" 
                        ? "bg-primary/10 border-primary text-primary font-black shadow-xs" 
                        : "bg-background border-border/80 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    📋 استدعاء رسمي
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWhatsappTemplate("absence");
                      setCustomMessage(composeWhatsAppMessage(whatsappGuardian.guardian, whatsappGuardian.students, whatsappGuardian.totalDue, "absence"));
                    }}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      whatsappTemplate === "absence" 
                        ? "bg-amber-500/10 border-amber-500 text-amber-600 font-black shadow-xs" 
                        : "bg-background border-border/80 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    ⏰ إشعار غياب
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWhatsappTemplate("excellence");
                      setCustomMessage(composeWhatsAppMessage(whatsappGuardian.guardian, whatsappGuardian.students, whatsappGuardian.totalDue, "excellence"));
                    }}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      whatsappTemplate === "excellence" 
                        ? "bg-sky-500/10 border-sky-500 text-sky-600 font-black shadow-xs" 
                        : "bg-background border-border/80 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    🌟 تهنئة وتفوق
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWhatsappTemplate("custom");
                      if (!customMessage.trim()) setCustomMessage(`السلام عليكم ورحمة الله وبركاته المكرم ولي الأمر / ${whatsappGuardian.guardian.name} المحترم،\n`);
                    }}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all sm:col-span-2 ${
                      whatsappTemplate === "custom" 
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 font-black shadow-xs" 
                        : "bg-background border-border/80 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    ✍️ رسالة حرة مخصصة
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-foreground mb-1.5">نص الرسالة المعتمد (قابل للتعديل)</label>
                <textarea
                  rows={5}
                  value={customMessage}
                  onChange={(e) => {
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
                    handleSendWhatsApp(whatsappGuardian.guardian.phone, customMessage);
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

      {/* =========================================================================
          MODAL: CONFIRM ARCHIVE / DELETE GUARDIAN
          ========================================================================= */}
      {deletingGuardian && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury">
          <div className="w-full max-w-md modal-card-luxury p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-danger">
              <div className="h-10 w-10 rounded-2xl bg-danger/15 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">تأكيد أرشفة ملف ولي الأمر</h3>
                <p className="text-xs text-muted-foreground">هل أنت متأكد من رغبتك في أرشفة هذا الملف العائلي؟</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1.5 font-bold">
              <p><span className="text-muted-foreground">الاسم:</span> {deletingGuardian.name}</p>
              <p><span className="text-muted-foreground">رقم الجوال:</span> <span dir="ltr">{deletingGuardian.phone}</span></p>
              <p><span className="text-muted-foreground">صلة القرابة:</span> {deletingGuardian.relation}</p>
            </div>

            <p className="text-[11px] text-muted-foreground">
              يمكن استعادة هذا الملف لاحقاً من مركز سلة المحذوفات والأرشيف دون أي فقدان لسجلات الطلاب المرتبطين.
            </p>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => {
                  softDeleteGuardian(deletingGuardian.id);
                  toast.success(`تم نقل ملف ولي الأمر "${deletingGuardian.name}" إلى الأرشيف بنجاح`);
                  setDeletingGuardian(null);
                }}
                className="flex-1 rounded-xl bg-danger py-2.5 text-xs font-black text-danger-foreground hover:bg-danger/90 transition-colors shadow-xs"
              >
                نعم، أرشفة الملف
              </button>
              <button
                onClick={() => setDeletingGuardian(null)}
                className="px-5 rounded-xl border border-border bg-card text-xs font-bold hover:bg-accent transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}

// Fallback helper to include current relation if custom
function GUARDIAN_RELATION_FALLBACK(currentRelation: string): LuxurySelectOption[] {
  const exists = GUARDIAN_RELATION_OPTIONS.some(o => o.value === currentRelation);
  if (!exists && currentRelation) {
    return [
      { value: currentRelation, label: `${currentRelation} (مخصص)`, icon: User, badge: "مخصص", badgeTone: "primary" },
      ...GUARDIAN_RELATION_OPTIONS
    ];
  }
  return GUARDIAN_RELATION_OPTIONS;
}
