import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell, PageCard, Badge, formatCurrency, MoneyDisplay } from "@/components/app-shell";
import { useStage, GRADE_OPTIONS } from "@/contexts/StageContext";
import { useGlobalStore, Student } from "@/contexts/GlobalStoreContext";
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
  UserCheck
} from "lucide-react";
import { useState, useMemo } from "react";
import { ArabicDatePicker } from "@/components/ui/arabic-date-picker";

export const Route = createFileRoute("/students/new")({
  component: StudentRegistrationWizard,
});

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
  major: z.enum(["science", "literature"], { required_error: "التشعيب الأكاديمي مطلوب" }),
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
    currency 
  } = useGlobalStore();
  const { generateEnrollmentFees } = useFeeEngine();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [guardianSearchQuery, setGuardianSearchQuery] = useState("");

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
    } as any,
  });

  const watchedValues = watch();
  const selectedGrade = watch("grade");
  const availableSections = (allSections || []).filter(sec => sec.stage === stage && sec.grade === selectedGrade);

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

  const handleSelectGuardian = (guardian: any) => {
    setValue("guardianName", guardian.name, { shouldValidate: true });
    if (guardian.phone) setValue("guardianPhone", guardian.phone, { shouldValidate: true });
    if (guardian.relation) setValue("guardianRelation", guardian.relation, { shouldValidate: true });
    if (guardian.address) setValue("address", guardian.address, { shouldValidate: true });
    setGuardianSearchQuery("");
    toast.success(`تم استيراد بيانات ولي الأمر: ${guardian.name}`);
  };

  const onSubmit = (data: FormValues) => {
    // Check for strict duplicate constraint in the CURRENT academic year
    const isDuplicateInCurrentYear = (activeStageStudents || []).some(s => s.nationalId === data.nationalId);
    if (isDuplicateInCurrentYear) {
      toast.error("هذا الطالب مسجل مسبقاً في العام الدراسي الحالي! لا يمكن تسجيل الطالب في فصلين مختلفين لنفس العام.");
      return;
    }

    const studentData: any = {
      ...data,
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

    toast.success(`تم تسجيل الطالب ${data.name} وتوليد الفواتير والاشتراكات المباشرة بنجاح!`);
    
    // Redirect to students list
    navigate({ to: "/students" });
  };

  const handleSmartRegistrationCheck = (nationalIdToCheck: string) => {
    if (!nationalIdToCheck || nationalIdToCheck.length < 5) return;
    
    // Search history for this student
    const existingStudent = (allStudents || []).find(s => s.nationalId === nationalIdToCheck && s.stage === stage);
    if (existingStudent) {
      toast.success("تم العثور على سجل سابق لهذا الطالب! جاري استيراد البيانات...");
      setValue("name", existingStudent.name, { shouldValidate: true });
      setValue("dob", existingStudent.dob, { shouldValidate: true });
      setValue("gender", existingStudent.gender || "ذكر", { shouldValidate: true });
      setValue("guardianName", existingStudent.guardianName, { shouldValidate: true });
      setValue("guardianPhone", existingStudent.guardianPhone || "");
      setValue("address", existingStudent.address || "");
      setValue("bloodType", existingStudent.bloodType || "");
      setValue("medicalNotes", existingStudent.medicalNotes || "");
    }
  };

  const steps = [
    { id: 1, title: "البيانات الأساسية", icon: User, fields: ["name", "nationalId", "dob", "gender", "grade", "sectionId"] },
    { id: 2, title: "التواصل وولي الأمر", icon: Phone, fields: ["guardianName", "guardianRelation", "guardianPhone", "address"] },
    { id: 3, title: "الملف الصحي والمتقدم", icon: HeartPulse, fields: ["bloodType", "medicalNotes", "pickupPersons", "allergies", "specialCare", "major", "elective"] },
    { id: 4, title: "النقل والاعتماد المالي", icon: Bus, fields: ["wantsTransport", "transportRouteId", "transportDirection"] },
  ];

  const handleNext = async () => {
    const currentFields = steps.find(s => s.id === currentStep)?.fields || [];
    const isStepValid = await trigger(currentFields as any);
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
      const currentFields = steps.find(s => s.id === currentStep)?.fields || [];
      const isStepValid = await trigger(currentFields as any);
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
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/80 bg-card text-xs font-bold hover:bg-accent transition-colors"
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
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-4">
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
                            className={`w-full h-11 rounded-xl border bg-background px-3.5 pr-10 text-xs font-bold text-foreground outline-none transition-all ${
                              errors.name ? "border-danger ring-2 ring-danger/20" : "border-input focus:border-primary focus:ring-2 focus:ring-primary/20"
                            }`}
                            placeholder="أدخل اسم الطالب بالكامل كما في الوثائق الرسمية..."
                          />
                          <User className="absolute right-3.5 top-3.5 w-4 h-4 text-muted-foreground/60" />
                        </div>
                        {errors.name && <p className="mt-1 text-[11px] font-bold text-danger">{errors.name.message as string}</p>}
                      </div>

                      {/* National ID */}
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5">
                          الرقم الوطني / الإقامة <span className="text-danger">*</span>
                        </label>
                        <div className="relative">
                          <input
                            {...register("nationalId")}
                            onBlur={(e) => handleSmartRegistrationCheck(e.target.value)}
                            className={`w-full h-11 rounded-xl border bg-background px-3.5 pr-10 text-xs font-bold text-foreground tabular-nums outline-none transition-all ${
                              errors.nationalId ? "border-danger ring-2 ring-danger/20" : "border-input focus:border-primary focus:ring-2 focus:ring-primary/20"
                            }`}
                            placeholder="أدخل الرقم الوطني (سيبحث النظام في السجل)"
                          />
                          <ShieldCheck className="absolute right-3.5 top-3.5 w-4 h-4 text-muted-foreground/60" />
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
                              className={`h-11 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                                watch("gender") === g
                                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                  : "bg-background border-input hover:bg-muted text-foreground"
                              }`}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{g}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Target Grade */}
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5">
                          الصف الدراسي المستهدف <span className="text-danger">*</span>
                        </label>
                        <select
                          {...register("grade")}
                          className={`w-full h-11 rounded-xl border bg-background px-3 text-xs font-bold text-foreground outline-none transition-all ${
                            errors.grade ? "border-danger ring-2 ring-danger/20" : "border-input focus:border-primary focus:ring-2 focus:ring-primary/20"
                          }`}
                        >
                          <option value="">-- اختر الصف الدراسي --</option>
                          {currentGrades.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                        {errors.grade && <p className="mt-1 text-[11px] font-bold text-danger">{errors.grade.message as string}</p>}
                      </div>

                      {/* Section Assignment */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-foreground mb-1.5">
                          التعيين في شعبة دراسية (اختياري)
                        </label>
                        <select
                          {...register("sectionId")}
                          disabled={!selectedGrade}
                          className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                        >
                          <option value="">-- توزيع آلي لاحقاً أو اختر شعبة --</option>
                          {availableSections.map((sec) => (
                            <option key={sec.id} value={sec.id}>
                              {sec.name} ({sec.roomName || 'القاعة المخصصة'}) — السعة: {sec.capacity || 30} طالب
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Guardian & Contact Details */}
                {currentStep === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-4">
                      <Phone className="w-5 h-5 text-primary" />
                      <h2 className="text-base font-extrabold text-foreground">بيانات ولي الأمر ووسائل التواصل</h2>
                    </div>

                    {/* Quick Guardian Search */}
                    <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                      <label className="block text-xs font-bold text-primary flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5" />
                        <span>بحث واستيراد من أولياء الأمور المسجلين مسبقاً (اختياري)</span>
                      </label>
                      <input
                        type="text"
                        value={guardianSearchQuery}
                        onChange={(e) => setGuardianSearchQuery(e.target.value)}
                        placeholder="ابحث باسم ولي الأمر أو رقم الهاتف..."
                        className="w-full h-10 rounded-xl border border-primary/30 bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      {filteredGuardians.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {filteredGuardians.map((g) => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => handleSelectGuardian(g)}
                              className="w-full flex items-center justify-between p-2 rounded-xl bg-card hover:bg-primary hover:text-primary-foreground text-xs font-bold border border-border/50 text-right transition-all"
                            >
                              <span>{g.name} ({g.relation || 'ولي أمر'})</span>
                              <span className="tabular-nums opacity-80" dir="ltr">{g.phone}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Guardian Name */}
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5">
                          اسم ولي الأمر <span className="text-danger">*</span>
                        </label>
                        <input
                          {...register("guardianName")}
                          className={`w-full h-11 rounded-xl border bg-background px-3 text-xs font-bold text-foreground outline-none ${
                            errors.guardianName ? "border-danger ring-2 ring-danger/20" : "border-input focus:border-primary"
                          }`}
                          placeholder="أدخل اسم ولي الأمر الثلاثي أو الرباعي..."
                        />
                        {errors.guardianName && <p className="mt-1 text-[11px] font-bold text-danger">{errors.guardianName.message as string}</p>}
                      </div>

                      {/* Guardian Relation */}
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5">صلة القرابة</label>
                        <select
                          {...register("guardianRelation")}
                          className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground outline-none focus:border-primary"
                        >
                          <option value="أب">أب</option>
                          <option value="أم">أم</option>
                          <option value="أخ/أخت">أخ / أخت</option>
                          <option value="عم/خال">عم / خال</option>
                          <option value="جد/جدة">جد / جدة</option>
                          <option value="وصي قانوني">وصي قانوني</option>
                        </select>
                      </div>

                      {/* Guardian Phone */}
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5">رقم الهاتف للتواصل</label>
                        <input
                          {...register("guardianPhone")}
                          className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground tabular-nums outline-none focus:border-primary"
                          placeholder="05XXXXXXXX"
                          dir="ltr"
                        />
                      </div>

                      {/* Residential Address */}
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5">عنوان السكن والحي</label>
                        <input
                          {...register("address")}
                          className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground outline-none focus:border-primary"
                          placeholder="المدينة، الحي، الشارع..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Medical & Stage-Specific Modules */}
                {currentStep === 3 && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-4">
                      <HeartPulse className="w-5 h-5 text-primary" />
                      <h2 className="text-base font-extrabold text-foreground">الملف الصحي والبيانات الخاصة بالمرحلة</h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Blood Type */}
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5">فصيلة الدم</label>
                        <select
                          {...register("bloodType")}
                          className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground outline-none focus:border-primary"
                        >
                          <option value="">-- غير محدد --</option>
                          {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => (
                            <option key={bt} value={bt}>{bt}</option>
                          ))}
                        </select>
                      </div>

                      {/* Medical Notes */}
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5">ملاحظات طبية / حساسية مزمنة</label>
                        <input
                          {...register("medicalNotes")}
                          className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground outline-none focus:border-primary"
                          placeholder="مثل: حساسية طعام، ربو، رعاية خاصة..."
                        />
                      </div>
                    </div>

                    {/* Kindergarten Specific Fields */}
                    {stage === "kindergarten" && (
                      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-amber-600 dark:text-amber-400">
                          <Sparkles className="w-4 h-4" />
                          <span>بيانات خاصة برياض الأطفال</span>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1">الأشخاص المخولون باستلام الطفل <span className="text-danger">*</span></label>
                          <input
                            {...register("pickupPersons" as any)}
                            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground outline-none"
                            placeholder="الاسم الأول، صلة القرابة، رقم الهاتف..."
                          />
                        </div>
                      </div>
                    )}

                    {/* High School Specific Fields */}
                    {stage === "high" && (
                      <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 dark:text-blue-400">
                          <GraduationCap className="w-4 h-4" />
                          <span>المسار الأكاديمي للمرحلة الثانوية</span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs font-bold text-foreground mb-1">المسار الأكاديمي</label>
                            <select
                              {...register("major" as any)}
                              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground outline-none"
                            >
                              <option value="science">المسار العلمي والتقني</option>
                              <option value="literature">المسار الإنساني والأدبي</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-foreground mb-1">المادة / التخصص الاختياري</label>
                            <input
                              {...register("elective" as any)}
                              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground outline-none"
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
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-4">
                      <Bus className="w-5 h-5 text-primary" />
                      <h2 className="text-base font-extrabold text-foreground">النقل المدرسي والاعتماد المالي</h2>
                    </div>

                    {/* Transport Option Toggle */}
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register("wantsTransport")}
                          className="h-4 w-4 rounded text-primary focus:ring-primary/20"
                        />
                        <span className="text-xs font-extrabold text-foreground">
                          الاشتراك في خدمة النقل المدرسي (الحافلات)
                        </span>
                      </label>

                      {wantsTransport && (
                        <div className="grid gap-4 sm:grid-cols-2 pt-3 border-t border-border/40">
                          <div>
                            <label className="block text-xs font-bold text-foreground mb-1.5">اختر خط السير والحافلة</label>
                            <select
                              {...register("transportRouteId")}
                              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground outline-none"
                            >
                              <option value="">-- اختر المسار --</option>
                              {(transportRoutes || []).map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name} — رسوم: {r.feeAmount.toLocaleString()} {currency}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-foreground mb-1.5">اتجاه النقل</label>
                            <select
                              {...register("transportDirection")}
                              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs font-bold text-foreground outline-none"
                            >
                              <option value="round-trip">ذهاب وعودة (كامل الرسوم)</option>
                              <option value="going">ذهاب فقط (صباحاً)</option>
                              <option value="returning">عودة فقط (ظهراً)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Auto Generated Financial Invoices Note */}
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <div className="font-extrabold text-emerald-700 dark:text-emerald-300">
                          التوليد الآلي للفواتير والالتزامات المالية
                        </div>
                        <div className="text-emerald-600/90 dark:text-emerald-400/90 mt-1 leading-relaxed">
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
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border/80 bg-background hover:bg-muted text-xs font-bold text-foreground transition-all"
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
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold shadow-md hover:bg-primary/90 transition-all glow-primary"
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
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg transition-all active:scale-95 glow-success disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
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
          <div className="lg:col-span-1 space-y-4 sticky top-24">
            <PageCard 
              title="بطاقة المعاينة والملف المباشر"
              description="تحديث لحظي لبيانات الطالب والرسوم المتوقعة"
              className="border-border/80 shadow-md"
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
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <span>{watchedValues.gender || "ذكر"}</span>
                      <span>•</span>
                      <span>{watchedValues.grade || "لم يحدد الصف"}</span>
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
                    <span className="font-bold tabular" dir="ltr">{watchedValues.nationalId || "—"}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-card/60 border border-border/50">
                    <span className="text-muted-foreground font-semibold">تاريخ الميلاد:</span>
                    <span className="font-bold tabular" dir="ltr">{watchedValues.dob || "—"}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-card/60 border border-border/50">
                    <span className="text-muted-foreground font-semibold">ولي الأمر:</span>
                    <span className="font-bold">{watchedValues.guardianName || "—"}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-card/60 border border-border/50">
                    <span className="text-muted-foreground font-semibold">رقم الهاتف:</span>
                    <span className="font-bold tabular" dir="ltr">{watchedValues.guardianPhone || "—"}</span>
                  </div>
                </div>

                {/* Estimated Financial Summary */}
                <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
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
