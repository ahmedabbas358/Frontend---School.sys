import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { useStage, GRADE_OPTIONS } from "@/contexts/StageContext";
import { useGlobalStore, Student } from "@/contexts/GlobalStoreContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Save, UserPlus, Phone, HeartPulse, MapPin, ChevronRight, ChevronLeft, LayoutGrid } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/students/new")({
  component: StudentRegistrationWizard,
});

// Zod Schemas for Validation
const baseSchema = z.object({
  name: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  dob: z.string().min(1, "تاريخ الميلاد مطلوب"),
  nationalId: z.string().min(1, "الرقم الوطني مطلوب"),
  grade: z.string().min(1, "الصف الدراسي مطلوب"),
  sectionId: z.string().optional(),
  gender: z.enum(["ذكر", "أنثى"], { required_error: "الجنس مطلوب" }),
  guardianName: z.string().min(2, "اسم ولي الأمر مطلوب"),
  guardianRelation: z.string().optional(),
  guardianPhone: z.string().optional(),
  address: z.string().optional(),
  
  bloodType: z.string().optional(),
  medicalNotes: z.string().optional(),
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
  const { addStudent, allSections, activeStageStudents, allGuardians, allStudents, currentAcademicYearId } = useGlobalStore();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

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
    } as any,
  });

  const selectedGrade = watch("grade");
  const availableSections = allSections.filter(sec => sec.stage === stage && sec.grade === selectedGrade);

  const onSubmit = (data: FormValues) => {
    // Check for strict duplicate constraint in the CURRENT academic year
    const isDuplicateInCurrentYear = activeStageStudents.some(s => s.nationalId === data.nationalId);
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
    addStudent(studentData as Omit<Student, "id">);

    toast.success(`تم تسجيل الطالب ${data.name} بنجاح!`);
    
    // Redirect to students list
    navigate({ to: "/students" });
  };

  const handleSmartRegistrationCheck = (nationalIdToCheck: string) => {
    if (!nationalIdToCheck || nationalIdToCheck.length < 5) return;
    
    // Search history for this student
    const existingStudent = allStudents.find(s => s.nationalId === nationalIdToCheck && s.stage === stage);
    if (existingStudent) {
      toast.success("تم العثور على سجل سابق لهذا الطالب! جاري استيراد البيانات التاريخية...");
      setValue("name", existingStudent.name);
      setValue("dob", existingStudent.dob);
      setValue("gender", existingStudent.gender || "ذكر");
      setValue("guardianName", existingStudent.guardianName);
      setValue("guardianPhone", existingStudent.guardianPhone || "");
      setValue("address", existingStudent.address || "");
      setValue("bloodType", existingStudent.bloodType || "");
      setValue("medicalNotes", existingStudent.medicalNotes || "");
    }
  };

  const steps = [
    { id: 1, title: "البيانات الأساسية", fields: ["name", "nationalId", "dob", "gender", "grade", "sectionId"] },
    { id: 2, title: "التواصل وولي الأمر", fields: ["guardianName", "guardianRelation", "guardianPhone", "address"] },
    { id: 3, title: "الملف الصحي والمتقدم", fields: ["bloodType", "medicalNotes", "pickupPersons", "allergies", "specialCare", "major", "elective"] },
  ];

  const handleNext = async () => {
    const currentFields = steps.find(s => s.id === currentStep)?.fields || [];
    const isStepValid = await trigger(currentFields as any);
    if (isStepValid) {
      setCurrentStep(prev => prev === 1 ? 2 : 3);
    } else {
      toast.error("يرجى إكمال الحقول المطلوبة قبل الانتقال للخطوة التالية");
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
        toast.error("يرجى إكمال الحقول المطلوبة قبل الانتقال للخطوة التالية");
      }
    } else if (stepId > currentStep + 1) {
      toast.error("يرجى إكمال الخطوات بالتسلسل");
    }
  };

  const handleFormError = (errors: any) => {
    // Automatically jump to the step containing the first error
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstErrorField = errorKeys[0];
      const stepWithError = steps.find(s => s.fields.includes(firstErrorField));
      if (stepWithError) {
        setCurrentStep(stepWithError.id);
        toast.error("يرجى مراجعة الحقول المطلوبة باللون الأحمر");
      }
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الطلاب", to: "/students" },
        { label: "تسجيل طالب جديد" },
      ]}
    >
      <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl"><UserPlus className="h-6 w-6" /></div>
              تسجيل طالب جديد
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">نظام الإضافة الذكي للمرحلة: <span className="font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-lg">{getStageLabel(stage)}</span></p>
          </div>
        </div>

        {/* Stepper Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 h-1 bg-border/50 -z-10 rounded-full"></div>
            <div className="absolute right-0 top-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-500" style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}></div>
            
            {steps.map((step) => (
              <div 
                key={step.id} 
                className="flex flex-col items-center gap-2 cursor-pointer group"
                onClick={() => goToStep(step.id)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-all duration-300 group-hover:scale-110 ${
                  currentStep >= step.id 
                    ? "bg-primary border-background text-primary-foreground shadow-lg scale-110" 
                    : "bg-card border-background text-muted-foreground shadow-sm group-hover:border-primary/50"
                }`}>
                  {step.id}
                </div>
                <span className={`text-xs sm:text-sm font-bold ${currentStep >= step.id ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"}`}>{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form 
          onSubmit={(e) => e.preventDefault()} 
          className="space-y-8"
        >
          <PageCard className="p-8 shadow-lg border-border/50 glass">
            
            {/* STEP 1: Basic Info */}
            <div className={currentStep === 1 ? "block animate-in fade-in duration-300" : "hidden"}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-border/50 pb-4">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">1</span>
                البيانات الأساسية والأكاديمية
              </h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">اسم الطالب الرباعي <span className="text-danger">*</span></label>
                  <input
                    {...register("name")}
                    className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-lg font-bold"
                    placeholder="أدخل اسم الطالب بالكامل..."
                  />
                  {errors.name && <p className="mt-1.5 text-xs text-danger font-bold flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-danger"></span> {errors.name.message as string}</p>}
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">الرقم الوطني <span className="text-danger">*</span></label>
                  <input
                    {...register("nationalId")}
                    onBlur={(e) => handleSmartRegistrationCheck(e.target.value)}
                    className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium tabular-nums"
                    placeholder="أدخل الرقم الوطني (سيبحث النظام في الأرشيف تلقائياً)"
                  />
                  {errors.nationalId && <p className="mt-1.5 text-xs text-danger font-bold flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-danger"></span> {errors.nationalId.message as string}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">تاريخ الميلاد <span className="text-danger">*</span></label>
                  <input
                    type="date"
                    {...register("dob")}
                    className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  />
                  {errors.dob && <p className="mt-1.5 text-xs text-danger font-bold flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-danger"></span> {errors.dob.message as string}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">الجنس <span className="text-danger">*</span></label>
                  <select
                    {...register("gender")}
                    className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium cursor-pointer"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                  {errors.gender && <p className="mt-1.5 text-xs text-danger font-bold flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-danger"></span> {errors.gender.message as string}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">الصف الدراسي المستهدف <span className="text-danger">*</span></label>
                  <select
                    {...register("grade")}
                    className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium cursor-pointer"
                  >
                    <option value="">-- اختر الصف --</option>
                    {currentGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  {errors.grade && <p className="mt-1.5 text-xs text-danger font-bold flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-danger"></span> {errors.grade.message as string}</p>}
                </div>

                <div className="md:col-span-2 bg-primary/5 p-4 rounded-xl border border-primary/20">
                  <label className="mb-2 block text-sm font-bold text-primary flex items-center gap-2"><LayoutGrid className="h-4 w-4"/> التعيين في شعبة (اختياري)</label>
                  <select
                    {...register("sectionId")}
                    disabled={!selectedGrade}
                    className="w-full rounded-xl border border-primary/30 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium cursor-pointer disabled:opacity-50"
                  >
                    <option value="">{selectedGrade ? "-- تعيين لاحقاً (سيتم إضافته لقائمة الانتظار) --" : "يرجى اختيار الصف الدراسي أولاً"}</option>
                    {availableSections.map(sec => {
                      const enrolledCount = activeStageStudents.filter(s => s.sectionId === sec.id).length;
                      return (
                        <option key={sec.id} value={sec.id}>شعبة {sec.name} (الإشغال: {enrolledCount}/{sec.capacity})</option>
                      );
                    })}
                  </select>
                  <p className="mt-2 text-xs text-muted-foreground">يمكنك ترك هذا الحقل فارغاً إذا كنت ترغب بتوزيع الطالب لاحقاً من شاشة إدارة الفصول.</p>
                </div>
              </div>
            </div>

            {/* STEP 2: Contact & Guardian */}
            <div className={currentStep === 2 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-border/50 pb-4">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">2</span>
                معلومات التواصل وولي الأمر
              </h2>

              <div className="md:col-span-2 lg:col-span-3 bg-primary/5 p-5 rounded-2xl border border-primary/20 mb-6">
                <label className="mb-2 block text-sm font-bold text-primary flex items-center gap-2">
                  <UserPlus className="h-4 w-4"/> اختيار من أولياء الأمور المسجلين مسبقاً (مزامنة ذكية)
                </label>
                <select
                  className="w-full rounded-xl border border-primary/30 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium cursor-pointer"
                  onChange={(e) => {
                    const g = allGuardians.find(g => g.id === e.target.value);
                    if(g) {
                      setValue("guardianName", g.name);
                      setValue("guardianPhone", g.phone);
                      setValue("guardianRelation", g.relation);
                      toast.success("تم مزامنة بيانات ولي الأمر بنجاح");
                    }
                  }}
                >
                  <option value="">-- أدخل بيانات ولي أمر جديد --</option>
                  {allGuardians.map(g => (
                    <option key={g.id} value={g.id}>{g.name} | رقم الجوال: {g.phone} | صلة القرابة: {g.relation}</option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-muted-foreground">اختيار ولي أمر مسجل مسبقاً سيقوم بتعبئة البيانات تلقائياً وربط الطالب بحسابه.</p>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">اسم ولي الأمر <span className="text-danger">*</span></label>
                  <input
                    {...register("guardianName")}
                    className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    placeholder="الاسم الكامل لولي الأمر"
                  />
                  {errors.guardianName && <p className="mt-1.5 text-xs text-danger font-bold flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-danger"></span> {errors.guardianName.message as string}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">صلة القرابة</label>
                  <select
                    {...register("guardianRelation")}
                    className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium cursor-pointer"
                  >
                    <option value="أب">أب</option>
                    <option value="أم">أم</option>
                    <option value="أخ">أخ</option>
                    <option value="جد">جد</option>
                    <option value="غير ذلك">غير ذلك</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground flex items-center gap-1"><Phone className="h-4 w-4 text-primary"/> رقم الجوال</label>
                  <input
                    {...register("guardianPhone")}
                    className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium tabular-nums"
                    placeholder="05xxxxxxxx"
                  />
                  {errors.guardianPhone && <p className="mt-1.5 text-xs text-danger font-bold flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-danger"></span> {errors.guardianPhone.message as string}</p>}
                </div>

                <div className="md:col-span-2 lg:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-muted-foreground flex items-center gap-1"><MapPin className="h-4 w-4 text-primary"/> العنوان الوطني / السكن</label>
                  <input
                    {...register("address")}
                    className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    placeholder="المدينة، الحي، الشارع، المبنى..."
                  />
                </div>
              </div>
            </div>

            {/* STEP 3: Medical & Advanced */}
            <div className={currentStep === 3 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-border/50 pb-4">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">3</span>
                الملف الصحي والبيانات المتقدمة
              </h2>

              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3 bg-danger/5 p-5 rounded-2xl border border-danger/10">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-danger flex items-center gap-1"><HeartPulse className="h-4 w-4"/> فصيلة الدم</label>
                    <select
                      {...register("bloodType")}
                      className="w-full rounded-xl border border-border/50 bg-background px-4 py-3.5 focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger/20 transition-all font-medium cursor-pointer"
                    >
                      <option value="">غير معروف</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-bold text-danger">ملاحظات طبية (أمراض مزمنة، حساسية، الخ)</label>
                    <input
                      {...register("medicalNotes")}
                      className="w-full rounded-xl border border-border/50 bg-background px-4 py-3.5 focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger/20 transition-all font-medium"
                      placeholder="اكتب (سليم) إذا لم تكن هناك ملاحظات..."
                    />
                  </div>
                </div>

                {stage === "kindergarten" && (
                  <div className="grid gap-6 md:grid-cols-2 bg-warning/5 p-5 rounded-2xl border border-warning/20">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-bold text-warning-foreground">الأشخاص المخولون بالاستلام <span className="text-danger">*</span></label>
                      <input
                        {...register("pickupPersons" as any)}
                        className="w-full rounded-xl border border-warning/30 bg-background px-4 py-3.5 focus:border-warning focus:outline-none focus:ring-2 focus:ring-warning/20 transition-all font-medium"
                        placeholder="أسماء الأشخاص المسموح لهم باستلام الطفل والقرابة"
                      />
                      {/* @ts-ignore */}
                      {errors.pickupPersons && <p className="mt-1.5 text-xs text-danger font-bold">{errors.pickupPersons.message}</p>}
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl border border-warning/30 bg-background">
                      <input
                        type="checkbox"
                        id="specialCare"
                        {...register("specialCare" as any)}
                        className="w-6 h-6 rounded border-border text-warning focus:ring-warning cursor-pointer"
                      />
                      <div>
                        <label htmlFor="specialCare" className="text-sm font-bold block cursor-pointer">الطفل يحتاج إلى رعاية خاصة</label>
                        <span className="text-xs text-muted-foreground">يرجى تحديد هذا الخيار إذا كان الطفل يتطلب اهتماماً إضافياً.</span>
                      </div>
                    </div>
                  </div>
                )}

                {stage === "high" && (
                  <div className="grid gap-6 md:grid-cols-2 bg-info/5 p-5 rounded-2xl border border-info/20">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-info-foreground">التشعيب الأكاديمي <span className="text-danger">*</span></label>
                      <select
                        {...register("major" as any)}
                        className="w-full rounded-xl border border-info/30 bg-background px-4 py-3.5 focus:border-info focus:outline-none focus:ring-2 focus:ring-info/20 transition-all font-medium cursor-pointer"
                      >
                        <option value="">-- اختر التشعيب --</option>
                        <option value="science">مسار علمي</option>
                        <option value="literature">مسار أدبي / إنساني</option>
                      </select>
                      {/* @ts-ignore */}
                      {errors.major && <p className="mt-1.5 text-xs text-danger font-bold">{errors.major.message}</p>}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-info-foreground">التخصص الاختياري / المسار الدقيق <span className="text-danger">*</span></label>
                      <input
                        {...register("elective" as any)}
                        className="w-full rounded-xl border border-info/30 bg-background px-4 py-3.5 focus:border-info focus:outline-none focus:ring-2 focus:ring-info/20 transition-all font-medium"
                        placeholder="مثال: حاسب آلي، إدارة أعمال..."
                      />
                      {/* @ts-ignore */}
                      {errors.elective && <p className="mt-1.5 text-xs text-danger font-bold">{errors.elective.message}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stepper Navigation */}
            <div className="flex justify-between items-center mt-10 pt-6 border-t border-border/50">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card font-bold hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" /> السابق
              </button>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-md"
                >
                  التالي <ChevronLeft className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit, handleFormError)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-primary/20 hover:scale-105 disabled:opacity-50"
                >
                  <Save className="h-5 w-5" />
                  {isSubmitting ? "جاري الحفظ..." : "حفظ ملف الطالب وتسجيله"}
                </button>
              )}
            </div>

          </PageCard>
        </form>
      </div>
    </AppShell>
  );
}
