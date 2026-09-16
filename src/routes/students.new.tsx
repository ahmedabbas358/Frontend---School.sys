import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell, PageCard, Badge, formatCurrency, MoneyDisplay } from "@/components/app-shell";
import { useStage, GRADE_OPTIONS } from "@/contexts/StageContext";
import { useGlobalStore, Student, StudentGuardianLink } from "@/contexts/GlobalStoreContext";
import { isGradeMatch } from "@/lib/school-structure";
import { useFeeEngine } from "@/engines/finance/useFeeEngine";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { 
  Save, 
  UserPlus, 
  Phone, 
  HeartPulse, 
  MapPin, 
  ChevronRight, 
  ChevronLeft, 
  LayoutGrid, 
  Bus, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  Sun, 
  Sunset, 
  ShieldCheck, 
  CreditCard,
  User,
  GraduationCap,
  Calendar,
  Layers3,
  Search,
  Check,
  ArrowLeft,
  ArrowRight,
  Cake,
  Activity,
  AlertCircle,
  FileCheck2,
  Building,
  UserCheck,
  Trash2,
  Plus,
  Mail,
  Briefcase,
  Pencil,
  BookOpen
} from "lucide-react";
import { useState, useMemo } from "react";
import { ArabicDatePicker } from "@/components/ui/arabic-date-picker";
import { LuxurySelect, LuxurySelectOption } from "@/components/ui/luxury-select";

export const Route = createFileRoute("/students/new")({
  component: StudentRegistrationWizard,
});

// Standard Relations List for Kinship
const STANDARD_RELATIONS = [
  "أب",
  "أم",
  "أخ",
  "أخت",
  "عم",
  "عمة",
  "خال",
  "خالة",
  "جد",
  "جدة",
  "ابن عم / ابن خال",
  "زوج الأم / زوجة الأب",
  "وصي قانوني",
  "سائق خاص",
];

// Progressive Next Grade Mapping for Smart Student Promotion upon Registration
const PROGRESSION_MAP: Record<string, string> = {
  "روضة 1": "روضة 2",
  "روضة 2": "الصف الأول",
  "الصف الأول": "الصف الثاني",
  "الصف الثاني": "الصف الثالث",
  "الصف الثالث": "الصف الرابع",
  "الصف الرابع": "الصف الخامس",
  "الصف الخامس": "الصف السادس",
  "الصف السادس": "الصف الأول المتوسط",
  "الصف الأول المتوسط": "الصف الثاني المتوسط",
  "الصف الثاني المتوسط": "الصف الثالث المتوسط",
  "الصف الثالث المتوسط": "الصف الأول الثانوي",
  "الصف الأول الثانوي": "الصف الثاني الثانوي",
  "الصف الثاني الثانوي": "الصف الثالث الثانوي",
};

const GUARDIAN_RELATION_OPTIONS: LuxurySelectOption[] = [
  { value: "أب", label: "أب (الوالد)", icon: User },
  { value: "أم", label: "أم (الوالدة)", icon: User },
  { value: "أخ", label: "أخ", icon: User },
  { value: "أخت", label: "أخت", icon: User },
  { value: "عم", label: "عم (شقيق الوالد)", icon: User },
  { value: "عمة", label: "عمة (شقيقة الوالد)", icon: User },
  { value: "خال", label: "خال (شقيق الوالدة)", icon: User },
  { value: "خالة", label: "خالة (شقيقة الوالدة)", icon: User },
  { value: "جد", label: "جد", icon: User },
  { value: "جدة", label: "جدة", icon: User },
  { value: "ابن عم / ابن خال", label: "ابن عم / ابن خال (قريب)", icon: User },
  { value: "زوج الأم / زوجة الأب", label: "زوج الأم / زوجة الأب", icon: User },
  { value: "وصي قانوني", label: "وصي قانوني / كفيل", icon: ShieldCheck },
  { value: "سائق خاص", label: "سائق خاص / مرافق", icon: Bus },
  { value: "أخرى", label: "أخرى (تحديد يدوي مخصص...)", badge: "يدوي", badgeTone: "primary", icon: Sparkles },
];

// Zod Schemas for Validation
const baseSchema = z.object({
  name: z.string().min(3, "الاسم الرباعي يجب أن يكون 3 أحرف على الأقل"),
  dob: z.string().min(1, "تاريخ الميلاد مطلوب"),
  nationalId: z.string().min(1, "الرقم الوطني مطلوب"),
  grade: z.string().min(1, "يرجى اختيار الصف الدراسي"),
  sectionId: z.string().optional(),
  gender: z.enum(["ذكر", "أنثى"], { required_error: "الجنس مطلوب" }),
  guardianName: z.string().min(2, "اسم ولي الأمر مطلوب"),
  guardianRelation: z.string().optional(),
  guardianPhone: z.string().optional(),
  address: z.string().optional(),
  
  bloodType: z.string().optional(),
  medicalNotes: z.string().optional(),

  wantsTransport: z.boolean(),
  transportRouteId: z.string().optional(),
  transportDirection: z.enum(["round-trip", "going", "returning"]),
});

const kindergartenSchema = baseSchema.extend({
  pickupPersons: z.string().min(3, "الأشخاص المخولون بالاستلام مطلوب"),
  allergies: z.string().optional(),
  specialCare: z.boolean().default(false),
});

const highSchoolSchema = baseSchema.extend({
  major: z.string().min(1, "التشعيب الأكاديمي مطلوب"),
  elective: z.string().min(2, "التخصص الاختياري مطلوب"),
});

function StudentRegistrationWizard() {
  const { stage, getStageLabel } = useStage();
  const { 
    addStudent, 
    allSections, 
    activeStageStudents, 
    allGuardians, 
    allStudents, 
    currentAcademicYearId, 
    transportRoutes, 
    addTransportSubscription, 
    allTextbooks,
    distributeTextbook,
    allInventoryItems,
    currency 
  } = useGlobalStore();
  const { generateEnrollmentFees } = useFeeEngine();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [guardianSearchQuery, setGuardianSearchQuery] = useState("");
  const [idVerifiedMatch, setIdVerifiedMatch] = useState<string | null>(null);
  const [deliverBooksNow, setDeliverBooksNow] = useState(true);
  const [booksTerm, setBooksTerm] = useState("الفصل الأول");

  // Multi-Guardian State
  const [guardiansList, setGuardiansList] = useState<StudentGuardianLink[]>([
    {
      name: "",
      relation: "أب",
      phone: "",
      phoneSecond: "",
      email: "",
      job: "",
      address: "",
      isPrimary: true,
    }
  ]);

  // Track custom manual input flags and texts for guardian relations
  const [customRelationFlags, setCustomRelationFlags] = useState<Record<number, boolean>>({});
  const [customRelationTexts, setCustomRelationTexts] = useState<Record<number, string>>({});

  // Additional custom manual inputs for other modules
  const [customBloodType, setCustomBloodType] = useState("");
  const [isCustomBloodType, setIsCustomBloodType] = useState(false);

  const [customMajor, setCustomMajor] = useState("");
  const [isCustomMajor, setIsCustomMajor] = useState(false);

  const [customTransportRoute, setCustomTransportRoute] = useState("");
  const [isCustomTransportRoute, setIsCustomTransportRoute] = useState(false);

  // Medical status: toggle healthy (سليم) vs manual input
  const [isHealthy, setIsHealthy] = useState(true);
  const [customMedicalNotes, setCustomMedicalNotes] = useState("");

  const currentGrades = GRADE_OPTIONS[stage] || [];

  // Select schema based on stage
  const currentSchema = 
    stage === "kindergarten" ? kindergartenSchema :
    stage === "high" ? highSchoolSchema : 
    baseSchema;

  type FormValues = z.infer<typeof currentSchema>;

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      gender: "ذكر",
      specialCare: false,
      wantsTransport: false,
      transportDirection: "round-trip",
      guardianRelation: "أب",
      medicalNotes: "سليم",
    } as any,
  });

  const handleToggleHealthy = (healthy: boolean) => {
    setIsHealthy(healthy);
    if (healthy) {
      setValue("medicalNotes", "سليم", { shouldValidate: true });
    } else {
      setValue("medicalNotes", customMedicalNotes.trim(), { shouldValidate: true });
    }
  };

  const watchedValues = watch();
  const selectedGrade = watch("grade");

  // Filter sections matching stage and grade using robust isGradeMatch
  const availableSections = useMemo(() => {
    if (!selectedGrade) return [];
    return (allSections || []).filter(sec => sec.stage === stage && isGradeMatch(sec.grade, selectedGrade));
  }, [allSections, stage, selectedGrade]);

  const registrationBooks = useMemo(() => {
    if (!selectedGrade) return [];
    return allTextbooks.filter(tb => {
      const matchGrade = tb.gradeId === selectedGrade || tb.grade === selectedGrade;
      const matchTerm = !tb.term || tb.term === booksTerm || tb.term === "all";
      return matchGrade && matchTerm;
    });
  }, [allTextbooks, selectedGrade, booksTerm]);

  const wantsTransport = watch("wantsTransport" as any);
  const selectedTransportRouteId = watch("transportRouteId" as any);
  const selectedTransportDirection = watch("transportDirection" as any);
  const selectedRouteObj = (transportRoutes || []).find(r => r.id === selectedTransportRouteId);
  const calculatedTransportFee = selectedRouteObj ? (selectedTransportDirection === "round-trip" ? selectedRouteObj.feeAmount : Math.round(selectedRouteObj.feeAmount * 0.6)) : 0;

  // Guardian quick picker matches
  const filteredGuardians = useMemo(() => {
    if (!guardianSearchQuery.trim()) return [];
    const q = guardianSearchQuery.toLowerCase();
    return (allGuardians || []).filter(g => 
      g.name.toLowerCase().includes(q) || 
      (g.phone && g.phone.includes(q))
    ).slice(0, 5);
  }, [allGuardians, guardianSearchQuery]);

  // Guardians Management Helpers
  const addGuardian = () => {
    setGuardiansList(prev => [
      ...prev,
      {
        name: "",
        relation: prev.length === 1 ? "أم" : "وصي قانوني",
        phone: "",
        phoneSecond: "",
        email: "",
        job: "",
        address: prev[0]?.address || "",
        isPrimary: prev.length === 0,
      }
    ]);
  };

  const removeGuardian = (index: number) => {
    if (guardiansList.length <= 1) {
      toast.error("يجب الإبقاء على ولي أمر واحد على الأقل كجهة اتصال رئيسية");
      return;
    }
    setGuardiansList(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (!updated.some(g => g.isPrimary) && updated.length > 0) {
        updated[0].isPrimary = true;
        setValue("guardianName", updated[0].name, { shouldValidate: true });
        setValue("guardianRelation", updated[0].relation, { shouldValidate: true });
        setValue("guardianPhone", updated[0].phone, { shouldValidate: true });
        setValue("address", updated[0].address || "", { shouldValidate: true });
      }
      return updated;
    });
  };

  const setPrimaryGuardian = (index: number) => {
    setGuardiansList(prev => prev.map((g, i) => ({
      ...g,
      isPrimary: i === index,
    })));
    const target = guardiansList[index];
    if (target) {
      setValue("guardianName", target.name, { shouldValidate: true });
      setValue("guardianRelation", target.relation, { shouldValidate: true });
      setValue("guardianPhone", target.phone, { shouldValidate: true });
      setValue("address", target.address || "", { shouldValidate: true });
      toast.success(`تم تعيين ${target.name || 'ولي الأمر'} كجهة اتصال رئيسية`);
    }
  };

  const updateGuardian = (index: number, field: keyof StudentGuardianLink, val: any) => {
    setGuardiansList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      if (updated[index].isPrimary) {
        if (field === "name") setValue("guardianName", val, { shouldValidate: true });
        if (field === "relation") setValue("guardianRelation", val, { shouldValidate: true });
        if (field === "phone") setValue("guardianPhone", val, { shouldValidate: true });
        if (field === "address") setValue("address", val, { shouldValidate: true });
      }
      return updated;
    });
  };

  const handleSelectGuardian = (guardian: any) => {
    const isStandard = STANDARD_RELATIONS.includes(guardian.relation);
    setGuardiansList(prev => {
      const updated = [...prev];
      const pIdx = updated.findIndex(g => g.isPrimary);
      const targetIdx = pIdx >= 0 ? pIdx : 0;
      updated[targetIdx] = {
        ...updated[targetIdx],
        name: guardian.name,
        relation: guardian.relation || "أب",
        phone: guardian.phone || "",
        address: guardian.address || "",
        isPrimary: true
      };
      return updated;
    });

    const pIdx = guardiansList.findIndex(g => g.isPrimary);
    const targetIdx = pIdx >= 0 ? pIdx : 0;
    if (!isStandard && guardian.relation) {
      setCustomRelationFlags(prev => ({ ...prev, [targetIdx]: true }));
      setCustomRelationTexts(prev => ({ ...prev, [targetIdx]: guardian.relation }));
    } else {
      setCustomRelationFlags(prev => ({ ...prev, [targetIdx]: false }));
    }

    setValue("guardianName", guardian.name, { shouldValidate: true });
    if (guardian.phone) setValue("guardianPhone", guardian.phone, { shouldValidate: true });
    if (guardian.relation) setValue("guardianRelation", guardian.relation, { shouldValidate: true });
    if (guardian.address) setValue("address", guardian.address, { shouldValidate: true });
    setGuardianSearchQuery("");
    toast.success(`تم استيراد بيانات ولي الأمر: ${guardian.name}`);
  };

  const handleSmartRegistrationCheck = (nationalIdToCheck: string) => {
    if (!nationalIdToCheck || nationalIdToCheck.length < 5) return;
    
    // Search history for this student across all previous years/records
    const existingStudent = (allStudents || []).find(s => s.nationalId === nationalIdToCheck);
    if (existingStudent) {
      setIdVerifiedMatch(existingStudent.name);
      
      setValue("name", existingStudent.name, { shouldValidate: true });
      setValue("dob", existingStudent.dob, { shouldValidate: true });
      setValue("gender", existingStudent.gender || "ذكر", { shouldValidate: true });
      setValue("guardianName", existingStudent.guardianName, { shouldValidate: true });
      setValue("guardianPhone", existingStudent.guardianPhone || "");
      setValue("guardianRelation", existingStudent.guardianRelation || "أب");
      setValue("address", existingStudent.address || "");
      setValue("bloodType", existingStudent.bloodType || "");

      // Smart Next Grade Progression
      const lastGrade = existingStudent.grade;
      const nextGrade = lastGrade && PROGRESSION_MAP[lastGrade];
      if (nextGrade && currentGrades.includes(nextGrade)) {
        setValue("grade", nextGrade, { shouldValidate: true });
        toast.success(`🎉 تم العثور على سجل سابق للطالب: ${existingStudent.name}! تم ترفيعه تلقائياً إلى (${nextGrade}) واستيراد كافة بياناته.`);
      } else if (lastGrade && currentGrades.includes(lastGrade)) {
        setValue("grade", lastGrade, { shouldValidate: true });
        toast.success(`تم العثور على سجل سابق للطالب: ${existingStudent.name}! تم استيراد البيانات وتحديد (${lastGrade}).`);
      } else {
        toast.success(`تم العثور على سجل سابق للطالب: ${existingStudent.name}! تم استيراد البيانات تلقائياً.`);
      }

      const medNotes = existingStudent.medicalNotes?.trim();
      if (!medNotes || medNotes === "سليم" || medNotes === "سليم معافى" || medNotes === "سليم معافى ولائق طبياً") {
        setIsHealthy(true);
        setCustomMedicalNotes("");
        setValue("medicalNotes", "سليم", { shouldValidate: true });
      } else {
        setIsHealthy(false);
        setCustomMedicalNotes(medNotes);
        setValue("medicalNotes", medNotes, { shouldValidate: true });
      }

      if (existingStudent.guardianRelation) {
        const isStandard = STANDARD_RELATIONS.includes(existingStudent.guardianRelation);
        if (!isStandard) {
          setCustomRelationFlags(prev => ({ ...prev, 0: true }));
          setCustomRelationTexts(prev => ({ ...prev, 0: existingStudent.guardianRelation || "" }));
        }
      }

      if (existingStudent.guardians && existingStudent.guardians.length > 0) {
        setGuardiansList(existingStudent.guardians);
      } else if (existingStudent.guardianName) {
        setGuardiansList([{
          name: existingStudent.guardianName,
          relation: existingStudent.guardianRelation || "أب",
          phone: existingStudent.guardianPhone || "",
          address: existingStudent.address || "",
          isPrimary: true
        }]);
      }
    }
  };

  const onSubmit = (data: FormValues) => {
    // Check for strict duplicate constraint in the CURRENT academic year
    const isDuplicateInCurrentYear = (activeStageStudents || []).some(s => s.nationalId === data.nationalId);
    if (isDuplicateInCurrentYear) {
      toast.error("هذا الطالب مسجل مسبقاً في العام الدراسي الحالي! لا يمكن تسجيل الطالب في فصلين مختلفين لنفس العام.");
      return;
    }

    // Ensure primary guardian is synced
    const primaryGuardian = guardiansList.find(g => g.isPrimary) || guardiansList[0];
    const cleanedGuardians = guardiansList.filter(g => g.name && g.name.trim().length > 0);

    const studentData: any = {
      ...data,
      medicalNotes: isHealthy ? "سليم" : (customMedicalNotes.trim() || data.medicalNotes || "سليم"),
      guardianName: primaryGuardian?.name || data.guardianName,
      guardianRelation: primaryGuardian?.relation || data.guardianRelation,
      guardianPhone: primaryGuardian?.phone || data.guardianPhone,
      address: primaryGuardian?.address || data.address,
      guardians: cleanedGuardians.length > 0 ? cleanedGuardians : undefined,
      stage,
      status: "نشط",
      enrollmentDate: new Date().toISOString().split("T")[0],
      academicYearId: currentAcademicYearId,
    };
    
    // Add student to the store
    const newStudentId = addStudent(studentData as Omit<Student, "id">);

    // Auto-generate financial obligations using Fee Engine
    if (newStudentId && currentAcademicYearId) {
      generateEnrollmentFees(newStudentId, stage, data.grade, currentAcademicYearId);
    }

    // Auto-register transport subscription if selected
    if (data.wantsTransport && data.transportRouteId && newStudentId) {
      const selectedRouteObj = (transportRoutes || []).find(r => r.id === data.transportRouteId);
      if (selectedRouteObj) {
        const calculatedFee = data.transportDirection === "round-trip" 
          ? selectedRouteObj.feeAmount 
          : Math.round(selectedRouteObj.feeAmount * 0.6);

        addTransportSubscription({
          studentId: newStudentId,
          routeId: data.transportRouteId,
          direction: data.transportDirection as any,
          fee: calculatedFee,
          status: "active"
        });
      }
    }

    // Auto-deliver textbooks if selected
    let deliveredBooksCount = 0;
    if (deliverBooksNow && newStudentId) {
      const booksToDeliver = allTextbooks.filter(tb => {
        const matchGrade = tb.gradeId === data.grade || tb.grade === data.grade;
        const matchTerm = !tb.term || tb.term === booksTerm || tb.term === "all";
        return matchGrade && matchTerm;
      });

      booksToDeliver.forEach(tb => {
        distributeTextbook({
          studentId: newStudentId,
          textbookId: tb.id,
          stage,
          term: tb.term || booksTerm,
          academicYearId: currentAcademicYearId,
          condition: "جديد",
          issuedBy: "مسؤول القبول والتسجيل",
          receivedByGuardian: true,
        });
        deliveredBooksCount++;
      });
    }

    const booksMsg = deliveredBooksCount > 0 ? ` وتسليم ${deliveredBooksCount} كتب دراسية` : "";
    toast.success(`تم تسجيل الطالب ${data.name}${booksMsg} وتوليد الفواتير والاشتراكات المباشرة بنجاح!`);
    
    // Redirect to students list
    navigate({ to: "/students" });
  };

  const steps = [
    { id: 1, title: "البيانات الأساسية", icon: User, fields: ["name", "nationalId", "dob", "gender", "grade", "sectionId"] },
    { id: 2, title: "التواصل وأولياء الأمور", icon: Phone, fields: ["guardianName", "guardianRelation", "guardianPhone", "address"] },
    { id: 3, title: "الملف الصحي والمتقدم", icon: HeartPulse, fields: ["bloodType", "medicalNotes", "pickupPersons", "allergies", "specialCare", "major", "elective"] },
    { id: 4, title: "النقل والكتب والاعتماد المالي", icon: Bus, fields: ["wantsTransport", "transportRouteId", "transportDirection"] },
  ];

  const validateStep = async (stepId: number): Promise<boolean> => {
    if (stepId === 2) {
      const primary = guardiansList.find(g => g.isPrimary) || guardiansList[0];
      if (!primary || !primary.name.trim() || primary.name.trim().length < 2) {
        toast.error("يرجى إدخال اسم ولي الأمر الرئيسي على الأقل (حرفان كحد أدنى)");
        return false;
      }
      setValue("guardianName", primary.name.trim(), { shouldValidate: true });
      setValue("guardianRelation", primary.relation || "أب", { shouldValidate: true });
      setValue("guardianPhone", primary.phone || "", { shouldValidate: true });
      setValue("address", primary.address || "", { shouldValidate: true });
    }

    const currentFields = steps.find(s => s.id === stepId)?.fields || [];
    return await trigger(currentFields as any);
  };

  const handleNext = async () => {
    const isStepValid = await validateStep(currentStep);
    if (isStepValid) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast.error("يرجى إكمال الحقول الإلزامية قبل الانتقال للخطوة التالية");
    }
  };

  const goToStep = async (stepId: number) => {
    if (stepId < currentStep) {
      setCurrentStep(stepId);
    } else if (stepId === currentStep + 1) {
      const isStepValid = await validateStep(currentStep);
      if (isStepValid) {
        setCurrentStep(stepId);
      } else {
        toast.error("يرجى إكمال الحقول الإلزامية قبل الانتقال للخطوة التالية");
      }
    } else {
      toast.error("يرجى إكمال الخطوات بالتسلسل");
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const primaryGuardianSummary = useMemo(() => {
    return guardiansList.find(g => g.isPrimary) || guardiansList[0];
  }, [guardiansList]);

  return (
    <AppShell
      title="تسجيل طالب جديد"
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "سجل الطلاب", to: "/students" },
        { label: "تسجيل طالب جديد" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/students"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/80 bg-card text-xs font-bold hover:bg-accent transition-colors shadow-xs"
          >
            <span>إلغاء والعودة</span>
          </Link>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
        
        {/* Wizard Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl border border-border/70 glass-card">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md glow-primary">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
                  استمارة تسجيل وقبول طالب جديد
                </h1>
                <Badge tone="primary">{getStageLabel(stage)}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                توليد ملف الطالب، الفواتير الدراسية، اشتراكات النقل المدرسي، وتعيين الشعبة آلياً
              </p>
            </div>
          </div>

          {/* Step Indicator Badge */}
          <div className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground">
            <span>الخطوة {currentStep} من 4:</span>
            <span className="text-primary font-black">{steps[currentStep - 1].title}</span>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="p-4 rounded-2xl border border-border/60 bg-card/40">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {steps.map((step) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(step.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-right transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-md glow-primary scale-[1.02]"
                      : isCompleted
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  <div className={`grid h-8 w-8 place-items-center rounded-lg font-bold text-xs shrink-0 ${
                    isActive
                      ? "bg-white/20 text-white"
                      : isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] opacity-80">الخطوة {step.id}</div>
                    <div className="text-xs font-extrabold truncate">{step.title}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Form Steps on Right + Live Preview Summary Card on Left */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* =========================================================
              Form Body (2 Columns)
              ========================================================= */}
          <div className="lg:col-span-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (currentStep < 4) {
                  handleNext();
                } else {
                  handleSubmit(onSubmit)(e);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
                  e.preventDefault();
                  if (currentStep < 4) {
                    handleNext();
                  }
                }
              }}
              className="space-y-6"
            >
              <PageCard className="p-6 sm:p-7 border-border/70 glass-card">
                
                {/* STEP 1: Basic & Academic Info */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* Smart Luxury National ID Notice Banner */}
                    <div className="relative overflow-hidden p-4 sm:p-5 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-xl shadow-md glow-primary">
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md shrink-0">
                          <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-black text-foreground">التحقق الذكي والاستيراد الفوري عبر الرقم الوطني</h3>
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground shadow-xs">
                              ⚡ توفير الوقت والجهد
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                            بمجرد كتابة الرقم الوطني أو رقم الإقامة، يقوم النظام تلقائياً بالبحث في قاعدة بيانات المدرسة وسجلات القبول السابقة لاستيراد الاسم، تاريخ الميلاد، والملف الصحي وبيانات ولي الأمر فوراً.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                      <User className="w-5 h-5 text-primary" />
                      <h2 className="text-base font-extrabold text-foreground">البيانات الأساسية والأكاديمية</h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Full Name */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-foreground mb-1.5">
                          اسم الطالب الرباعي <span className="text-danger">*</span>
                        </label>
                        <div className="relative">
                          <input
                            {...register("name")}
                            className={`w-full h-12 rounded-2xl border bg-background px-4 pr-11 text-xs sm:text-sm font-bold text-foreground outline-none transition-all shadow-xs ${
                              errors.name ? "border-danger ring-4 ring-danger/20" : "border-border/80 focus:border-primary focus:ring-4 focus:ring-primary/15"
                            }`}
                            placeholder="أدخل اسم الطالب بالكامل كما في الوثائق الرسمية..."
                          />
                          <User className="absolute right-3.5 top-3.5 w-5 h-5 text-muted-foreground/60" />
                        </div>
                        {errors.name && <p className="mt-1 text-[11px] font-bold text-danger">{errors.name.message as string}</p>}
                      </div>

                      {/* National ID */}
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                            <span>الرقم الوطني / الإقامة</span>
                            <span className="text-danger">*</span>
                          </span>
                          {idVerifiedMatch && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 animate-in fade-in">
                              ✓ تم استيراد سجل: {idVerifiedMatch}
                            </span>
                          )}
                        </label>
                        <div className="relative">
                          <input
                            {...register("nationalId")}
                            onChange={(e) => {
                              register("nationalId").onChange(e);
                              if (e.target.value.length >= 8) {
                                handleSmartRegistrationCheck(e.target.value);
                              } else {
                                setIdVerifiedMatch(null);
                              }
                            }}
                            onBlur={(e) => handleSmartRegistrationCheck(e.target.value)}
                            className={`w-full h-12 rounded-2xl border bg-background px-4 pr-11 text-xs sm:text-sm font-bold text-foreground tabular-nums outline-none transition-all shadow-xs ${
                              errors.nationalId ? "border-danger ring-4 ring-danger/20" : "border-border/80 focus:border-primary focus:ring-4 focus:ring-primary/15"
                            }`}
                            placeholder="أدخل الرقم الوطني أو رقم الإقامة..."
                          />
                          <ShieldCheck className="absolute right-3.5 top-3.5 w-5 h-5 text-muted-foreground/60" />
                        </div>
                        {errors.nationalId && <p className="mt-1 text-[11px] font-bold text-danger">{errors.nationalId.message as string}</p>}
                      </div>

                      {/* Custom Luxury Arabic Date Picker */}
                      <div>
                        <ArabicDatePicker
                          label="تاريخ الميلاد"
                          required
                          value={watch("dob")}
                          onChange={(val) => setValue("dob", val, { shouldValidate: true })}
                          error={errors.dob?.message as string}
                        />
                      </div>

                      {/* Gender Selector */}
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5">
                          الجنس <span className="text-danger">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {["ذكر", "أنثى"].map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setValue("gender", g as any, { shouldValidate: true })}
                              className={`h-12 rounded-2xl border text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
                                watch("gender") === g
                                  ? "bg-primary text-primary-foreground border-primary shadow-sm glow-primary"
                                  : "bg-background border-border/80 hover:bg-muted text-foreground shadow-xs"
                              }`}
                            >
                              <UserCheck className="w-4 h-4" />
                              <span>{g}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Target Grade Luxury Select */}
                      <div>
                        <LuxurySelect
                          label="الصف الدراسي المستهدف"
                          required
                          value={watch("grade")}
                          onChange={(val) => {
                            setValue("grade", val, { shouldValidate: true });
                            setValue("sectionId", "");
                          }}
                          options={currentGrades.map(g => ({ value: g, label: g, icon: GraduationCap }))}
                          placeholder="-- اختر الصف الدراسي --"
                          icon={GraduationCap}
                          error={errors.grade?.message as string}
                        />
                      </div>

                      {/* Section Assignment Luxury Select with isGradeMatch */}
                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-foreground">التعيين في شعبة دراسية (اختياري)</span>
                          {selectedGrade && availableSections.length > 0 && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 shadow-xs animate-in fade-in">
                              ✨ {availableSections.length} شعب متاحة
                            </span>
                          )}
                        </div>
                        <LuxurySelect
                          value={watch("sectionId")}
                          onChange={(val) => setValue("sectionId", val, { shouldValidate: true })}
                          disabled={!selectedGrade}
                          disabledHint="⏳ بانتظار تحديد الصف الدراسي أولاً"
                          onDisabledClick={() => toast.info("يرجى اختيار الصف الدراسي أولاً لعرض الشعب المتاحة")}
                          options={availableSections.map(sec => ({
                            value: sec.id,
                            label: `شعبة ${sec.name}`,
                            sublabel: sec.roomName || 'القاعة المخصصة',
                            badge: `سعة: ${sec.capacity || 30}`,
                            icon: Layers3
                          }))}
                          placeholder={selectedGrade ? (availableSections.length > 0 ? "-- توزيع آلي لاحقاً أو اختر شعبة --" : "لا توجد شعب مسجلة لهذا الصف") : "اختر الصف أولاً"}
                          icon={Layers3}
                          clearable
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Multi-Guardian & Contact Details */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <Phone className="w-5 h-5 text-primary" />
                        <div>
                          <h2 className="text-base font-extrabold text-foreground">بيانات أولياء الأمور ووسائل التواصل</h2>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            يمكنك إضافة أكثر من ولي أمر (أب، أم، وصي، سائق) وتحديد جهة الاتصال الرئيسية
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={addGuardian}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-black border border-primary/25 transition-all shadow-xs active:scale-95 shrink-0"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>+ إضافة ولي أمر آخر</span>
                      </button>
                    </div>

                    {/* Quick Guardian Search */}
                    <div className="p-3.5 rounded-2xl bg-primary/[0.04] border border-primary/20 space-y-2">
                      <label className="block text-xs font-bold text-primary flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5" />
                        <span>بحث واستيراد من أولياء الأمور المسجلين مسبقاً (اختياري)</span>
                      </label>
                      <input
                        type="text"
                        value={guardianSearchQuery}
                        onChange={(e) => setGuardianSearchQuery(e.target.value)}
                        placeholder="ابحث باسم ولي الأمر أو رقم الهاتف للتعبئة السريعة..."
                        className="w-full h-11 rounded-xl border border-primary/30 bg-background px-3.5 text-xs font-bold outline-none focus:ring-4 focus:ring-primary/15"
                      />
                      {filteredGuardians.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {filteredGuardians.map((g) => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => handleSelectGuardian(g)}
                              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-card hover:bg-primary hover:text-primary-foreground text-xs font-bold border border-border/50 text-right transition-all group"
                            >
                              <span>{g.name} ({g.relation || 'ولي أمر'})</span>
                              <span className="tabular-nums opacity-80" dir="ltr">{g.phone}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* List of Multiple Guardians */}
                    <div className="space-y-4">
                      {guardiansList.map((guardian, idx) => (
                        <div 
                          key={idx} 
                          className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                            guardian.isPrimary 
                              ? "border-primary/40 bg-card/90 dark:bg-card/70 shadow-md ring-2 ring-primary/15" 
                              : "border-border/70 bg-card/50 hover:border-border"
                          }`}
                        >
                          {/* Header of Guardian Card */}
                          <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                              <span className="grid h-7 w-7 place-items-center rounded-lg bg-muted text-xs font-black text-foreground">
                                #{idx + 1}
                              </span>
                              <span className="text-xs font-black text-foreground">
                                {guardian.name || (guardian.isPrimary ? "ولي الأمر الرئيسي" : `ولي أمر إضافي (${idx + 1})`)}
                              </span>
                              {guardian.isPrimary ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-xs">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>جهة الاتصال الرئيسية</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setPrimaryGuardian(idx)}
                                  className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-colors border border-border/60"
                                >
                                  تعيين كولي رئيسي
                                </button>
                              )}
                            </div>

                            {guardiansList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeGuardian(idx)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                                title="حذف ولي الأمر"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="grid gap-3.5 sm:grid-cols-2">
                            {/* Guardian Name */}
                            <div>
                              <label className="block text-xs font-bold text-foreground mb-1">
                                اسم ولي الأمر {guardian.isPrimary && <span className="text-danger">*</span>}
                              </label>
                              <div className="relative">
                                <input
                                  value={guardian.name}
                                  onChange={(e) => updateGuardian(idx, "name", e.target.value)}
                                  className="w-full h-12 rounded-2xl border border-border/80 bg-background px-3.5 pr-10 text-xs sm:text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
                                  placeholder="أدخل اسم ولي الأمر الثلاثي أو الرباعي..."
                                />
                                <User className="absolute right-3.5 top-3.5 w-5 h-5 text-muted-foreground/60" />
                              </div>
                            </div>

                            {/* Relation Luxury Select & Manual Input */}
                            <div>
                              <LuxurySelect
                                label="صلة القرابة"
                                value={
                                  customRelationFlags[idx] || (!STANDARD_RELATIONS.includes(guardian.relation) && Boolean(guardian.relation))
                                    ? "أخرى"
                                    : guardian.relation || "أب"
                                }
                                onChange={(val) => {
                                  if (val === "أخرى") {
                                    setCustomRelationFlags(prev => ({ ...prev, [idx]: true }));
                                    const currentCustom = customRelationTexts[idx] || "";
                                    updateGuardian(idx, "relation", currentCustom.trim() || "أخرى");
                                  } else {
                                    setCustomRelationFlags(prev => ({ ...prev, [idx]: false }));
                                    updateGuardian(idx, "relation", val);
                                  }
                                }}
                                options={GUARDIAN_RELATION_OPTIONS}
                                placeholder="صلة القرابة"
                                icon={User}
                                searchable
                              />

                              {/* Dynamic Manual Input when 'أخرى' is selected */}
                              {(customRelationFlags[idx] || (!STANDARD_RELATIONS.includes(guardian.relation) && Boolean(guardian.relation))) && (
                                <div className="mt-2.5 p-3 rounded-2xl bg-primary/[0.04] border border-primary/30 space-y-1.5 animate-in fade-in slide-in-from-top-1.5 duration-200 shadow-xs">
                                  <label className="block text-[11px] font-extrabold text-primary flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                                      <span>صلة القرابة المخصصة (إدخال يدوي) *</span>
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-normal">اكتب المسمى الدقيق</span>
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      autoFocus
                                      value={
                                        customRelationTexts[idx] !== undefined
                                          ? customRelationTexts[idx]
                                          : !STANDARD_RELATIONS.includes(guardian.relation) && guardian.relation !== "أخرى"
                                          ? guardian.relation
                                          : ""
                                      }
                                      onChange={(e) => {
                                        const text = e.target.value;
                                        setCustomRelationTexts(prev => ({ ...prev, [idx]: text }));
                                        updateGuardian(idx, "relation", text.trim() ? text : "أخرى");
                                      }}
                                      placeholder="اكتب صلة القرابة هنا (مثال: كفيل، وكيل شرعي، زوج الأخت، صديق العائلة...)"
                                      className="w-full h-11 rounded-xl border border-primary/40 bg-background px-3.5 pr-10 text-xs font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/15 shadow-xs transition-all"
                                    />
                                    <Pencil className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-80" />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    سيتم تسجيل وتثبيت صلة القرابة هذه رسمياً في ملف الطالب وتقارير المدرسة.
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Primary Phone */}
                            <div>
                              <label className="block text-xs font-bold text-foreground mb-1">رقم الهاتف الأساسي</label>
                              <div className="relative">
                                <input
                                  value={guardian.phone}
                                  onChange={(e) => updateGuardian(idx, "phone", e.target.value)}
                                  className="w-full h-12 rounded-2xl border border-border/80 bg-background px-3.5 pr-10 text-xs sm:text-sm font-bold text-foreground tabular-nums outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
                                  placeholder="05XXXXXXXX"
                                  dir="ltr"
                                />
                                <Phone className="absolute right-3.5 top-3.5 w-5 h-5 text-muted-foreground/60" />
                              </div>
                            </div>

                            {/* Second Phone / WhatsApp */}
                            <div>
                              <label className="block text-xs font-bold text-foreground mb-1">هاتف بديل / واتساب (اختياري)</label>
                              <div className="relative">
                                <input
                                  value={guardian.phoneSecond || ""}
                                  onChange={(e) => updateGuardian(idx, "phoneSecond", e.target.value)}
                                  className="w-full h-12 rounded-2xl border border-border/80 bg-background px-3.5 pr-10 text-xs sm:text-sm font-bold text-foreground tabular-nums outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
                                  placeholder="05XXXXXXXX"
                                  dir="ltr"
                                />
                                <Phone className="absolute right-3.5 top-3.5 w-5 h-5 text-muted-foreground/60" />
                              </div>
                            </div>

                            {/* Email */}
                            <div>
                              <label className="block text-xs font-bold text-foreground mb-1">البريد الإلكتروني (اختياري)</label>
                              <div className="relative">
                                <input
                                  type="email"
                                  value={guardian.email || ""}
                                  onChange={(e) => updateGuardian(idx, "email", e.target.value)}
                                  className="w-full h-12 rounded-2xl border border-border/80 bg-background px-3.5 pr-10 text-xs sm:text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
                                  placeholder="name@example.com"
                                  dir="ltr"
                                />
                                <Mail className="absolute right-3.5 top-3.5 w-5 h-5 text-muted-foreground/60" />
                              </div>
                            </div>

                            {/* Job / Profession */}
                            <div>
                              <label className="block text-xs font-bold text-foreground mb-1">المهنة / جهة العمل (اختياري)</label>
                              <div className="relative">
                                <input
                                  value={guardian.job || ""}
                                  onChange={(e) => updateGuardian(idx, "job", e.target.value)}
                                  className="w-full h-12 rounded-2xl border border-border/80 bg-background px-3.5 pr-10 text-xs sm:text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
                                  placeholder="المهنة أو جهة العمل..."
                                />
                                <Briefcase className="absolute right-3.5 top-3.5 w-5 h-5 text-muted-foreground/60" />
                              </div>
                            </div>

                            {/* Address */}
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-bold text-foreground mb-1">عنوان السكن والحي</label>
                              <div className="relative">
                                <input
                                  value={guardian.address || ""}
                                  onChange={(e) => updateGuardian(idx, "address", e.target.value)}
                                  className="w-full h-12 rounded-2xl border border-border/80 bg-background px-3.5 pr-10 text-xs sm:text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
                                  placeholder="المدينة، الحي، الشارع..."
                                />
                                <MapPin className="absolute right-3.5 top-3.5 w-5 h-5 text-muted-foreground/60" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 3: Medical & Stage-Specific Modules */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                      <HeartPulse className="w-5 h-5 text-primary" />
                      <h2 className="text-base font-extrabold text-foreground">الملف الصحي والبيانات الخاصة بالمرحلة</h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Blood Type Luxury Select */}
                      <div>
                        <LuxurySelect
                          label="فصيلة الدم"
                          value={isCustomBloodType ? "other" : watch("bloodType")}
                          onChange={(val) => {
                            if (val === "other") {
                              setIsCustomBloodType(true);
                              setValue("bloodType", customBloodType.trim() || "other", { shouldValidate: true });
                            } else {
                              setIsCustomBloodType(false);
                              setValue("bloodType", val, { shouldValidate: true });
                            }
                          }}
                          options={[
                            { value: "A+", label: "A+", icon: HeartPulse },
                            { value: "A-", label: "A-", icon: HeartPulse },
                            { value: "B+", label: "B+", icon: HeartPulse },
                            { value: "B-", label: "B-", icon: HeartPulse },
                            { value: "AB+", label: "AB+", icon: HeartPulse },
                            { value: "AB-", label: "AB-", icon: HeartPulse },
                            { value: "O+", label: "O+", icon: HeartPulse },
                            { value: "O-", label: "O-", icon: HeartPulse },
                            { value: "unknown", label: "غير محدد / غير معروف", icon: AlertCircle },
                            { value: "other", label: "أخرى (تحديد يدوي / فحص مخبري...)", badge: "يدوي", badgeTone: "primary", icon: Sparkles },
                          ]}
                          placeholder="-- اختر فصيلة الدم --"
                          icon={HeartPulse}
                          clearable
                        />

                        {isCustomBloodType && (
                          <div className="mt-2.5 p-3 rounded-2xl bg-primary/[0.04] border border-primary/30 space-y-1.5 animate-in fade-in slide-in-from-top-1.5 duration-200 shadow-xs">
                            <label className="block text-[11px] font-extrabold text-primary flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-primary" />
                              <span>تحديد فصيلة الدم يدوياً / ملاحظات المختبر:</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                autoFocus
                                value={customBloodType}
                                onChange={(e) => {
                                  setCustomBloodType(e.target.value);
                                  setValue("bloodType", e.target.value.trim() || "other", { shouldValidate: true });
                                }}
                                placeholder="اكتب فصيلة الدم أو الملاحظة المخبرية..."
                                className="w-full h-11 rounded-xl border border-primary/40 bg-background px-3.5 pr-10 text-xs font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/15 shadow-xs transition-all"
                              />
                              <Pencil className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-80" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Medical Notes & Health Status */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-foreground">
                            ملاحظات طبية / حساسية مزمنة
                          </label>

                          {/* Small Checkmark Toggle (صح صغير بدل كتابة سليم يدوياً) */}
                          <button
                            type="button"
                            id="toggle-healthy-status-btn"
                            onClick={() => handleToggleHealthy(!isHealthy)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer border select-none ${
                              isHealthy
                                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-xs hover:bg-emerald-500/20"
                                : "bg-muted/70 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                            title={isHealthy ? "انقر لإلغاء التحديد وتدوين ملاحظات خاصة" : "انقر لتحديد الطالب كسليم"}
                          >
                            <div
                              className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                                isHealthy
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "border border-muted-foreground/50 bg-background"
                              }`}
                            >
                              {isHealthy && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span>سليم (لائق طبياً)</span>
                          </button>
                        </div>

                        {isHealthy ? (
                          /* Healthy State Display: Clean, polished status card */
                          <div
                            onClick={() => handleToggleHealthy(false)}
                            className="w-full h-12 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] hover:bg-emerald-500/[0.09] px-3.5 flex items-center justify-between cursor-pointer transition-all shadow-xs group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              </div>
                              <div className="truncate">
                                <span className="text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                                  سليم
                                </span>
                                <span className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 mr-2 font-medium hidden sm:inline">
                                  (لائق طبياً وخالٍ من الأمراض المزمنة والحساسية)
                                </span>
                              </div>
                            </div>
                            <div className="text-[11px] font-bold text-muted-foreground group-hover:text-primary flex items-center gap-1 transition-colors shrink-0">
                              <Pencil className="w-3 h-3" />
                              <span>إذا كان غير ذلك، انقر للكتابة</span>
                            </div>
                          </div>
                        ) : (
                          /* Unhealthy / Special Condition State: Text input appears */
                          <div className="relative animate-in fade-in slide-in-from-top-1 duration-200">
                            <input
                              type="text"
                              autoFocus
                              value={customMedicalNotes}
                              onChange={(e) => {
                                setCustomMedicalNotes(e.target.value);
                                setValue("medicalNotes", e.target.value, { shouldValidate: true });
                              }}
                              placeholder="اكتب الملاحظات الطبية أو الحساسية بالتفصيل (مثل: حساسية طعام، ربو، رعاية خاصة...)"
                              className="w-full h-12 rounded-2xl border border-primary/50 bg-background px-3.5 pr-10 text-xs sm:text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
                            />
                            <Pencil className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-80" />
                            <button
                              type="button"
                              onClick={() => handleToggleHealthy(true)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all flex items-center gap-1 shadow-xs"
                              title="إعادة التحديد كسليم"
                            >
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>إعادة إلى (سليم)</span>
                            </button>
                          </div>
                        )}

                        <p className="mt-1 text-[10px] text-muted-foreground font-medium">
                          {isHealthy
                            ? "محدد تلقائياً كـ (سليم). في حال وجود ملاحظات صحية أو حساسية، انقر على الصح أو البطاقة لتدوينها في الحقل."
                            : "اكتب الحالة الطبية ليتم حفظها وتنبيه الإدارة المدرسية والمشرف الصحي."}
                        </p>
                      </div>
                    </div>

                    {/* Kindergarten Specific Fields */}
                    {stage === "kindergarten" && (
                      <div className="p-4 rounded-3xl bg-amber-500/5 border border-amber-500/20 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-amber-600 dark:text-amber-400">
                          <Sparkles className="w-4 h-4" />
                          <span>بيانات خاصة برياض الأطفال</span>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1">الأشخاص المخولون باستلام الطفل <span className="text-danger">*</span></label>
                          <input
                            {...register("pickupPersons" as any)}
                            className="w-full h-12 rounded-2xl border border-border/80 bg-background px-3.5 text-xs sm:text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
                            placeholder="الاسم الأول، صلة القرابة (أب، أم، عم، خال، سائق، أخرى...)، رقم الهاتف..."
                          />
                        </div>
                      </div>
                    )}

                    {/* High School Specific Fields */}
                    {stage === "high" && (
                      <div className="p-4 rounded-3xl bg-blue-500/5 border border-blue-500/20 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 dark:text-blue-400">
                          <GraduationCap className="w-4 h-4" />
                          <span>المسار الأكاديمي للمرحلة الثانوية</span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <LuxurySelect
                              label="المسار الأكاديمي"
                              value={isCustomMajor ? "other" : watch("major" as any)}
                              onChange={(val) => {
                                if (val === "other") {
                                  setIsCustomMajor(true);
                                  setValue("major" as any, customMajor.trim() || "other", { shouldValidate: true });
                                } else {
                                  setIsCustomMajor(false);
                                  setValue("major" as any, val as any, { shouldValidate: true });
                                }
                              }}
                              options={[
                                { value: "science", label: "مسار علوم الحاسب والهندسة (علمي)", badge: "علمي", icon: Sparkles },
                                { value: "health", label: "مسار الصحة والحياة (صحي)", badge: "صحي", icon: HeartPulse },
                                { value: "business", label: "مسار إدارة الأعمال", badge: "إدارة", icon: Briefcase },
                                { value: "literature", label: "المسار الإنساني والأدبي (عام)", badge: "أدبي", icon: GraduationCap },
                                { value: "sharia", label: "مسار العلوم الشرعية والدراسات الإسلامية", badge: "شرعي", icon: BookOpen },
                                { value: "other", label: "مسار آخر (تحديد يدوي مخصص...)", badge: "يدوي", badgeTone: "primary", icon: Sparkles },
                              ]}
                              placeholder="-- اختر المسار الأكاديمي --"
                              icon={GraduationCap}
                            />

                            {isCustomMajor && (
                              <div className="mt-2.5 p-3 rounded-2xl bg-primary/[0.04] border border-primary/30 space-y-1.5 animate-in fade-in slide-in-from-top-1.5 duration-200 shadow-xs">
                                <label className="block text-[11px] font-extrabold text-primary flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                                  <span>اكتب المسار الأكاديمي المخصص يدوياً:</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    autoFocus
                                    value={customMajor}
                                    onChange={(e) => {
                                      setCustomMajor(e.target.value);
                                      setValue("major" as any, e.target.value.trim() || "other", { shouldValidate: true });
                                    }}
                                    placeholder="مثال: مسار الفنون الإبداعية، مسار اللغات والترجمة..."
                                    className="w-full h-11 rounded-xl border border-primary/40 bg-background px-3.5 pr-10 text-xs font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/15 shadow-xs transition-all"
                                  />
                                  <Pencil className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-80" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-foreground mb-1">المادة / التخصص الاختياري</label>
                            <input
                              {...register("elective" as any)}
                              className="w-full h-12 rounded-2xl border border-border/80 bg-background px-3.5 text-xs sm:text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
                              placeholder="مثل: ذكاء اصطناعي، إدارة أعمال..."
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4: Transport & Financial Confirmation */}
                {currentStep === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                      <Bus className="w-5 h-5 text-primary" />
                      <h2 className="text-base font-extrabold text-foreground">النقل المدرسي والاعتماد المالي</h2>
                    </div>

                    {/* Transport Option Toggle */}
                    <div className="p-4 sm:p-5 rounded-3xl bg-muted/30 border border-border/60 space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          {...register("wantsTransport")}
                          className="h-5 w-5 rounded-lg text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                        />
                        <div>
                          <span className="text-xs sm:text-sm font-black text-foreground block">
                            الاشتراك في خدمة النقل المدرسي (الحافلات)
                          </span>
                          <span className="text-[11px] text-muted-foreground font-semibold block">
                            تأمين مقعد للطالب في الحافلة المخصصة للحي السكني
                          </span>
                        </div>
                      </label>

                      {wantsTransport && (
                        <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-border/50">
                          <div>
                            <LuxurySelect
                              label="اختر خط السير والحافلة"
                              value={isCustomTransportRoute ? "custom_route" : watch("transportRouteId" as any)}
                              onChange={(val) => {
                                if (val === "custom_route") {
                                  setIsCustomTransportRoute(true);
                                  setValue("transportRouteId" as any, "custom_route", { shouldValidate: true });
                                } else {
                                  setIsCustomTransportRoute(false);
                                  setValue("transportRouteId" as any, val, { shouldValidate: true });
                                }
                              }}
                              options={[
                                ...(transportRoutes || []).map((r) => ({
                                  value: r.id,
                                  label: r.name,
                                  sublabel: `${r.destination} - السائق: ${r.driverName}`,
                                  badge: `${r.feeAmount.toLocaleString()} ${currency}`,
                                  icon: Bus
                                })),
                                {
                                  value: "custom_route",
                                  label: "مسار مخصص / حي آخر (تحديد يدوي...)",
                                  badge: "مخصص",
                                  badgeTone: "primary",
                                  icon: Sparkles
                                }
                              ]}
                              placeholder="-- اختر مسار الحافلة --"
                              icon={Bus}
                              searchable
                            />

                            {isCustomTransportRoute && (
                              <div className="mt-2.5 p-3 rounded-2xl bg-primary/[0.04] border border-primary/30 space-y-1.5 animate-in fade-in slide-in-from-top-1.5 duration-200 shadow-xs">
                                <label className="block text-[11px] font-extrabold text-primary flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                                  <span>تحديد عنوان أو حي المسار المخصص يدوياً:</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="text"
                                    autoFocus
                                    value={customTransportRoute}
                                    onChange={(e) => {
                                      setCustomTransportRoute(e.target.value);
                                      setValue("address", e.target.value, { shouldValidate: true });
                                    }}
                                    placeholder="اكتب اسم الحي أو المعلم السكني المستهدف للنقل..."
                                    className="w-full h-11 rounded-xl border border-primary/40 bg-background px-3.5 pr-10 text-xs font-bold text-foreground outline-none focus:ring-4 focus:ring-primary/15 shadow-xs transition-all"
                                  />
                                  <Pencil className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-80" />
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <LuxurySelect
                              label="اتجاه النقل"
                              value={watch("transportDirection" as any)}
                              onChange={(val) => setValue("transportDirection" as any, val as any, { shouldValidate: true })}
                              options={[
                                { value: "round-trip", label: "ذهاب وعودة (كامل الرسوم)", badge: "كامل", icon: Sun },
                                { value: "going", label: "ذهاب فقط (صباحاً)", badge: "صباحي", icon: Sun },
                                { value: "returning", label: "عودة فقط (ظهراً)", badge: "مسائي", icon: Sunset },
                              ]}
                              placeholder="-- اختر اتجاه النقل --"
                              icon={Bus}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Instant Textbook Handover Option */}
                    <div className="p-4 sm:p-5 rounded-3xl bg-muted/30 border border-border/60 space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={deliverBooksNow}
                          onChange={(e) => setDeliverBooksNow(e.target.checked)}
                          className="h-5 w-5 rounded-lg text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <span className="text-xs sm:text-sm font-black text-foreground">
                              تسليم الكتب والمقررات المدرسية فوراً عند التسجيل
                            </span>
                            <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-black border border-emerald-500/20">
                              ربط مباشر بالمستودع
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground font-semibold block mt-0.5">
                            صرف حزمة المقررات المدرسية المقررة لصف الطالب وخصمها مباشرة من رصيد المستودع المدرسي
                          </span>
                        </div>
                      </label>

                      {deliverBooksNow && (
                        <div className="space-y-3 pt-3 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 bg-background/80 p-1 rounded-xl border border-border/80 text-xs">
                              {["الفصل الأول", "الفصل الثاني", "الفصل الثالث"].map((term) => (
                                <button
                                  key={term}
                                  type="button"
                                  onClick={() => setBooksTerm(term)}
                                  className={`rounded-lg px-3 py-1 text-xs font-black transition-all ${
                                    booksTerm === term
                                      ? "bg-primary text-primary-foreground shadow-sm"
                                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                  }`}
                                >
                                  {term}
                                </button>
                              ))}
                            </div>

                            <span className="text-xs font-black text-primary">
                              {registrationBooks.length} كتب مقررة لـ ({selectedGrade || "الصف المختار"})
                            </span>
                          </div>

                          {registrationBooks.length === 0 ? (
                            <div className="text-center py-4 text-xs font-bold text-muted-foreground bg-background/50 rounded-xl border border-dashed border-border">
                              يرجى تحديد الصف الدراسي في الخطوة الأولى لعرض المقررات الدراسية
                            </div>
                          ) : (
                            <div className="grid gap-2 sm:grid-cols-2">
                              {registrationBooks.map((tb) => {
                                const inv = allInventoryItems.find(
                                  (i) => (tb.inventoryItemId && i.id === tb.inventoryItemId) || i.name.includes(tb.title)
                                );
                                const stock = inv ? inv.quantity : tb.copies;
                                return (
                                  <div
                                    key={tb.id}
                                    className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-background/70 text-xs"
                                  >
                                    <div className="space-y-0.5">
                                      <div className="font-black text-foreground flex items-center gap-1.5">
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>{tb.title}</span>
                                      </div>
                                      <div className="text-[10px] text-muted-foreground">
                                        {tb.subject} • طبعة {tb.edition || "2026/2027"}
                                      </div>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                                        stock > 10
                                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                          : stock > 0
                                          ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                          : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                      }`}
                                    >
                                      متوفر بالمستودع: {stock}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Auto Generated Financial Invoices Note */}
                    <div className="p-4 sm:p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3.5">
                      <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="text-xs leading-relaxed space-y-1">
                        <div className="font-black text-emerald-800 dark:text-emerald-300 text-sm">
                          التوليد الآلي للفواتير والالتزامات المالية
                        </div>
                        <div className="text-emerald-700/90 dark:text-emerald-400/90 font-medium">
                          عند الضغط على تأكيد التسجيل، سيقوم محرك الرسوم الذكي (Fee Engine) تلقائياً بإنشاء فواتير الأقساط الدراسية، الكتب، والزي، وإضافة اشتراك النقل المباشر لحساب الطالب.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Navigation Controls */}
                <div className="mt-8 pt-4 border-t border-border/60 flex items-center justify-between gap-3">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl border border-border/80 bg-background hover:bg-muted text-xs sm:text-sm font-bold text-foreground transition-all shadow-xs"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span>الخطوة السابقة</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleNext();
                      }}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs sm:text-sm font-black shadow-md hover:bg-primary/90 transition-all glow-primary hover:scale-[1.02] active:scale-95"
                    >
                      <span>المتابعة للخطوة {currentStep + 1} ({steps[currentStep].title})</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={(e) => {
                        e.preventDefault();
                        handleSubmit(onSubmit)(e);
                      }}
                      className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black shadow-lg transition-all hover:scale-[1.02] active:scale-95 glow-success disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>تأكيد تسجيل الطالب وتوليد الفواتير</span>
                    </button>
                  )}
                </div>

              </PageCard>
            </form>
          </div>

          {/* =========================================================
              Live Student Profile & Financial Summary Preview Card (1 Column)
              ========================================================= */}
          <div className="lg:col-span-1 space-y-4">
            <PageCard 
              title="بطاقة المعاينة والملف المباشر"
              description="تحديث لحظي لبيانات الطالب والرسوم المتوقعة"
              className="border-border/80 shadow-md glass-card"
            >
              <div className="space-y-4">
                
                {/* Avatar & Basic Info */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/60">
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl font-black text-sm shrink-0 shadow-sm ${
                    watchedValues.gender === "أنثى"
                      ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white"
                      : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                  }`}>
                    {watchedValues.name ? watchedValues.name.substring(0, 2) : "طالب"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-extrabold text-foreground truncate">
                      {watchedValues.name || "اسم الطالب سيظهر هنا"}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>{watchedValues.gender || "ذكر"}</span>
                      <span>•</span>
                      <span>{watchedValues.grade || "لم يحدد الصف"}</span>
                      {watchedValues.sectionId && (
                        <>
                          <span>•</span>
                          <span className="text-primary font-bold">
                            {allSections.find(s => s.id === watchedValues.sectionId)?.name ? `شعبة ${allSections.find(s => s.id === watchedValues.sectionId)?.name}` : ''}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Information Rows */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-card/60 border border-border/50">
                    <span className="text-muted-foreground font-semibold">المرحلة الدراسية:</span>
                    <span className="font-extrabold text-primary">{getStageLabel(stage)}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-card/60 border border-border/50">
                    <span className="text-muted-foreground font-semibold">الرقم الوطني:</span>
                    <span className="font-bold tabular-nums" dir="ltr">{watchedValues.nationalId || "—"}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-card/60 border border-border/50">
                    <span className="text-muted-foreground font-semibold">تاريخ الميلاد:</span>
                    <span className="font-bold tabular-nums" dir="ltr">{watchedValues.dob || "—"}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-card/60 border border-border/50">
                    <span className="text-muted-foreground font-semibold">ولي الأمر:</span>
                    <div className="text-left font-bold flex items-center gap-1">
                      <span>{primaryGuardianSummary?.name || watchedValues.guardianName || "—"}</span>
                      {guardiansList.length > 1 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          +{guardiansList.length - 1}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-card/60 border border-border/50">
                    <span className="text-muted-foreground font-semibold">رقم الهاتف:</span>
                    <span className="font-bold tabular-nums" dir="ltr">{primaryGuardianSummary?.phone || watchedValues.guardianPhone || "—"}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-card/60 border border-border/50">
                    <span className="text-muted-foreground font-semibold">الملف الصحي:</span>
                    {isHealthy ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>سليم معافى</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 truncate max-w-[140px]" title={customMedicalNotes || "توجد ملاحظات"}>
                        {customMedicalNotes || "توجد ملاحظات"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Estimated Financial Summary */}
                <div className="p-3.5 rounded-2xl bg-primary/[0.04] border border-primary/20 space-y-2">
                  <div className="text-xs font-extrabold text-primary flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>الرسوم التقديرية للتسجيل</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">الرسوم الدراسية الأساسية:</span>
                    <span className="font-black text-foreground">حسب جدول المرحلة</span>
                  </div>

                  {wantsTransport && (
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">رسوم النقل المدرسي:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        {calculatedTransportFee.toLocaleString()} {currency}
                      </span>
                    </div>
                  )}
                </div>

              </div>
            </PageCard>
          </div>

        </div>

      </div>
    </AppShell>
  );
}
