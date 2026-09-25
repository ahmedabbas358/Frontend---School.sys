import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore, Student } from "@/contexts/GlobalStoreContext";
import { EducationalStage, STAGE_LIST } from "@/contexts/StageContext";
import { getGradesForStage } from "@/lib/school-structure";
import { CalendarDays, GraduationCap, Phone, User, HeartPulse, MapPin, ShieldCheck, Printer, LayoutGrid, AlertCircle, FileText, Download, X, Settings, Plus, CreditCard, BookOpen, Bus, RefreshCw, Sun, Sunset, Sparkles, CheckCircle2, Check, MessageCircle, Award, Trophy, BarChart3, Edit3, TrendingUp, Star, Users, ArrowUpRight, ArrowDownRight, Compass, ShieldAlert, FileCheck, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { FinancialTimeline } from "@/components/financial-components";
import { ArabicDatePicker } from "@/components/ui/arabic-date-picker";
import { AcademicCareerModal } from "@/components/academic-career-modal";

export const Route = createFileRoute("/students/$id")({
  component: StudentProfile,
});

// --- Edit Profile Modal ---
function EditStudentModal({ isOpen, onClose, student }: { isOpen: boolean, onClose: () => void, student: Student }) {
  const { allSections, updateStudent  } = useGlobalStore();
  const [formData, setFormData] = useState({ ...student });

  const availableGrades = useMemo(() => getGradesForStage(formData.stage), [formData.stage]);
  const availableSections = useMemo(() => (
    formData.grade ? allSections.filter(section => section.stage === formData.stage && section.grade === formData.grade) : []
  ), [allSections, formData.grade, formData.stage]);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...student });
    }
  }, [isOpen, student]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.grade) {
      toast.error("يجب اختيار الفصل قبل حفظ بيانات الطالب");
      return;
    }
    try {
      updateStudent(student.id, formData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر تحديث بيانات الطالب");
      return;
    }
    toast.success("تم تحديث بيانات الطالب بنجاح!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury">
      <div className="w-full max-w-2xl modal-card-luxury overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/20">
          <h2 className="text-xl font-black flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Settings className="h-5 w-5" />
            </div>
            تعديل بيانات الطالب
          </h2>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar-modal">
          <form id="edit-student-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2 border-b border-border/60 pb-2.5 mb-1 flex items-center justify-between">
                <h3 className="font-black text-sm text-primary uppercase tracking-wider">البيانات الأساسية</h3>
                <span className="text-xs text-muted-foreground">بيانات الهوية والاسم</span>
              </div>
              <div>
                <label className="mb-2 block text-xs font-extrabold text-foreground">اسم الطالب <span className="text-danger">*</span></label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-extrabold text-foreground">رقم الهوية <span className="text-danger">*</span></label>
                <input required value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50 tabular-nums" />
              </div>
              <div>
                <ArabicDatePicker
                  label="تاريخ الميلاد"
                  value={(formData as any).dob || ""}
                  onChange={(val) => setFormData({ ...formData, dob: val } as any)}
                  showAgeCalculator={true}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-extrabold text-foreground">الجنس</label>
                <select value={(formData as any).gender || "ذكر"} onChange={e => setFormData({...formData, gender: e.target.value} as any)} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50">
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </div>

              <div className="md:col-span-2 border-b border-border/60 pb-2.5 mb-1 mt-3 flex items-center justify-between">
                <h3 className="font-black text-sm text-primary uppercase tracking-wider">بيانات التواصل وولي الأمر</h3>
                <span className="text-xs text-muted-foreground">أرقام الطوارئ والموقع</span>
              </div>
              <div>
                <label className="mb-2 block text-xs font-extrabold text-foreground">اسم ولي الأمر</label>
                <input value={formData.guardianName} onChange={e => setFormData({...formData, guardianName: e.target.value})} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-extrabold text-foreground">صلة القرابة</label>
                <input value={(formData as any).guardianRelation || ""} onChange={e => setFormData({...formData, guardianRelation: e.target.value} as any)} placeholder="أب، أم، أخ..." className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-extrabold text-foreground">رقم الجوال للطوارئ</label>
                <input value={formData.guardianPhone} onChange={e => setFormData({...formData, guardianPhone: e.target.value})} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50 tabular-nums" dir="ltr" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-extrabold text-foreground">العنوان الوطني</label>
                <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-medium shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50" />
              </div>

              {student.stage === "kindergarten" && (
                <>
                  <div className="md:col-span-2 border-b border-border/60 pb-2.5 mb-1 mt-3 flex items-center justify-between">
                    <h3 className="font-black text-sm text-primary uppercase tracking-wider">البيانات الخاصة (رياض الأطفال)</h3>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-extrabold text-foreground">الأشخاص المخولون بالاستلام</label>
                    <input value={(formData as any).pickupPersons || ""} onChange={e => setFormData({...formData, pickupPersons: e.target.value} as any)} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50" />
                  </div>
                </>
              )}

              {student.stage === "high" && (
                <>
                  <div className="md:col-span-2 border-b border-border/60 pb-2.5 mb-1 mt-3 flex items-center justify-between">
                    <h3 className="font-black text-sm text-primary uppercase tracking-wider">البيانات الأكاديمية (الثانوي)</h3>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-extrabold text-foreground">المسار الأكاديمي</label>
                    <select value={(formData as any).major || "science"} onChange={e => setFormData({...formData, major: e.target.value} as any)} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50">
                      <option value="science">علمي</option>
                      <option value="literature">أدبي (إنساني)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-extrabold text-foreground">التخصص الدقيق</label>
                    <input value={(formData as any).elective || ""} onChange={e => setFormData({...formData, elective: e.target.value} as any)} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50" />
                  </div>
                </>
              )}

              <div className="md:col-span-2 border-b border-border/60 pb-2.5 mb-1 mt-3 flex items-center justify-between">
                <h3 className="font-black text-sm text-primary uppercase tracking-wider">البيانات الطبية</h3>
                <span className="text-xs text-muted-foreground">الملف الصحي</span>
              </div>
              <div>
                <label className="mb-2 block text-xs font-extrabold text-foreground">فصيلة الدم</label>
                <select value={(formData as any).bloodType || ""} onChange={e => setFormData({...formData, bloodType: e.target.value} as any)} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50 tabular-nums" dir="ltr">
                  <option value="">غير محدد</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-extrabold text-foreground">ملاحظات طبية / أمراض مزمنة / حساسية</label>
                  <button
                    type="button"
                    onClick={() => {
                      const isCurrentlyHealthy = formData.medicalNotes === "سليم" || formData.medicalNotes === "سليم معافى";
                      setFormData({ ...formData, medicalNotes: isCurrentlyHealthy ? "" : "سليم" });
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                      formData.medicalNotes === "سليم" || formData.medicalNotes === "سليم معافى"
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${
                      formData.medicalNotes === "سليم" || formData.medicalNotes === "سليم معافى"
                        ? "bg-emerald-600 text-white"
                        : "border border-muted-foreground/50 bg-background"
                    }`}>
                      {(formData.medicalNotes === "سليم" || formData.medicalNotes === "سليم معافى") && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span>سليم (لائق طبياً)</span>
                  </button>
                </div>
                <textarea 
                  value={formData.medicalNotes} 
                  onChange={e => setFormData({...formData, medicalNotes: e.target.value})} 
                  rows={2} 
                  placeholder="اكتب الملاحظات الطبية أو انقر على خيار (سليم) بالأعلى..."
                  className="w-full rounded-xl border border-border/80 bg-background/80 p-3 text-sm font-medium shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50 resize-none"
                ></textarea>
              </div>

              <div className="md:col-span-2 border-b border-border/60 pb-2.5 mb-1 mt-3 flex items-center justify-between">
                <h3 className="font-black text-sm text-primary uppercase tracking-wider">الإدارة الأكاديمية</h3>
                <span className="text-xs text-muted-foreground">الفصل والشعبة وتاريخ القبول</span>
              </div>
              <div>
                <label className="mb-2 block text-xs font-extrabold text-foreground">المرحلة الدراسية</label>
                <select
                  value={formData.stage}
                  onChange={e => {
                    const nextStage = e.target.value as EducationalStage;
                    setFormData({
                      ...formData,
                      stage: nextStage,
                      grade: getGradesForStage(nextStage)[0] || "",
                      sectionId: undefined,
                    });
                  }}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50"
                >
                  {STAGE_LIST.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-extrabold text-foreground">الفصل الدراسي</label>
                <select
                  value={formData.grade}
                  required
                  onChange={e => setFormData({ ...formData, grade: e.target.value, sectionId: undefined })}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50"
                >
                  <option value="">اختر الفصل</option>
                  {availableGrades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-extrabold text-foreground">الشعبة</label>
                <select
                  value={formData.sectionId || ""}
                  disabled={!formData.grade}
                  onChange={e => {
                    const section = allSections.find(item => item.id === e.target.value);
                    setFormData({
                      ...formData,
                      sectionId: section?.id || undefined,
                      stage: section?.stage || formData.stage,
                      grade: section?.grade || formData.grade,
                    });
                  }}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50 disabled:opacity-50"
                >
                  <option value="">بدون شعبة</option>
                  {availableSections.map(section => <option key={section.id} value={section.id}>شعبة {section.name}</option>)}
                </select>
              </div>
              <div>
                <ArabicDatePicker
                  label="تاريخ الالتحاق"
                  value={(formData as any).enrollmentDate || ""}
                  onChange={(val) => setFormData({ ...formData, enrollmentDate: val } as any)}
                  showAgeCalculator={false}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-extrabold text-foreground">الحالة الأكاديمية</label>
                <select value={(formData as any).status || "نشط"} onChange={e => setFormData({...formData, status: e.target.value} as any)} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50">
                  <option value="نشط">نشط</option>
                  <option value="موقوف">موقوف</option>
                  <option value="منقول">منقول</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div className="p-5 border-t border-border/50 bg-muted/10 flex gap-3 justify-end items-center">
          <button onClick={onClose} className="rounded-xl px-6 py-2.5 text-sm font-bold hover:bg-accent transition-colors border border-border/80 active:scale-[0.98]">إلغاء</button>
          <button form="edit-student-form" type="submit" className="rounded-xl bg-primary px-8 py-2.5 text-sm font-extrabold text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-[0.98]">حفظ التغييرات</button>
        </div>
      </div>
    </div>
  );
}

// --- Advanced Print Preview Engine has been moved to src/components/print-engine.tsx ---

function StudentProfile() {
  const { id } = Route.useParams();
  const { 
    currency, allStudents, allStudentEnrollments, activeStageStudents, allInvoices, allPayments, allClinicVisits, allDisciplineIncidents, 
    allSections, activeStageFeeStructures, addInvoice, addPayment, allTextbooks, 
    allTextbookDistributions, transportSubscriptions, transportRoutes,
    addTransportSubscription, updateTransportSubscription, deleteTransportSubscription,
    distributeTextbook, removeDistribution, allInventoryItems,
    allExams, allExamSubjects, allExamResults, allSubjects, updateSingleExamResult
  } = useGlobalStore();

  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [profileActiveTerm, setProfileActiveTerm] = useState<string>("الفصل الأول");
  const [isProfileReceiptOpen, setIsProfileReceiptOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<"career" | "overview" | "finance" | "books">("career");
  const [selectedStudentExamId, setSelectedStudentExamId] = useState<string>("");
  const [isCertificatePrintOpen, setIsCertificatePrintOpen] = useState(false);
  const [isTranscriptPrintOpen, setIsTranscriptPrintOpen] = useState(false);
  const [isAcademicCareerModalOpen, setIsAcademicCareerModalOpen] = useState(false);
  const [quickEditMarkModal, setQuickEditMarkModal] = useState<{
    isOpen: boolean;
    examSubjectId: string;
    subjectName: string;
    currentMark: number;
    maxScore: number;
  }>({ isOpen: false, examSubjectId: "", subjectName: "", currentMark: 0, maxScore: 100 });
  
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [transportForm, setTransportForm] = useState({
    routeId: "",
    direction: "round-trip" as "round-trip" | "going" | "returning"
  });

  const [newInvoiceData, setNewInvoiceData] = useState({
    title: "",
    amount: 0,
    dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });

  const [paymentData, setPaymentData] = useState({
    invoiceId: "",
    amount: 0,
    method: "cash" as "cash" | "bank_transfer" | "card" | "cheque" | "bankak",
    bankakRef: "",
  });


  const student = useMemo((): Student | undefined => {
    // 1. Direct match in allStudents
    const direct = allStudents.find((s) => s.id === id);
    if (direct) return direct;

    // 2. Match via enrollment id
    const enrollment = allStudentEnrollments?.find((e: any) => e.id === id);
    if (enrollment) {
      const baseStudent = allStudents.find((s) => s.id === enrollment.studentId);
      if (baseStudent) {
        return { ...baseStudent, ...enrollment, id: baseStudent.id } as Student;
      }
      return {
        ...enrollment,
        id: enrollment.studentId || enrollment.id,
        name: "طالب مسجل",
        nationalId: "1000000000",
        dob: "2015-01-01",
        gender: "ذكر",
        grade: enrollment.grade,
        stage: enrollment.stage,
        guardianName: "ولي الأمر",
        guardianRelation: "أب",
        guardianPhone: "0500000000",
        address: "العنوان",
        medicalNotes: "سليم",
      } as unknown as Student;
    }

    // 3. Match in activeStageStudents
    const activeMatch = activeStageStudents?.find((s: any) => s.id === id || s.studentId === id || s.nationalId === id);
    if (activeMatch) return activeMatch as Student;

    return undefined;
  }, [id, allStudents, allStudentEnrollments, activeStageStudents]);

  const studentIds = useMemo(() => {
    if (!student) return new Set<string>();
    const ids = [student.id, (student as any).studentId, (student as any).enrollmentId, id].filter(Boolean) as string[];
    return new Set(ids);
  }, [student, id]);

  const studentSubscription = useMemo(() => student ? transportSubscriptions.find((s: any) => studentIds.has(s.studentId)) : null, [student, transportSubscriptions, studentIds]);
  const studentRoute = useMemo(() => studentSubscription ? transportRoutes.find((r: any) => r.id === studentSubscription.routeId) : null, [studentSubscription, transportRoutes]);

  const handleOpenTransportModal = () => {
    if (studentSubscription) {
      setTransportForm({
        routeId: studentSubscription.routeId,
        direction: (studentSubscription.direction as any) || "round-trip"
      });
    } else if (transportRoutes.length > 0) {
      setTransportForm({
        routeId: transportRoutes[0].id,
        direction: "round-trip"
      });
    }
    setIsTransportModalOpen(true);
  };

  const handleSaveTransport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    if (!transportForm.routeId) {
      toast.error("يرجى اختيار خط الترحيل والنقل");
      return;
    }

    const routeObj = transportRoutes.find(r => r.id === transportForm.routeId);
    if (!routeObj) {
      toast.error("خط الترحيل المحدد غير موجود");
      return;
    }

    const calculatedFee = transportForm.direction === "round-trip" ? routeObj.feeAmount : Math.round(routeObj.feeAmount * 0.6);

    try {
      if (studentSubscription) {
        updateTransportSubscription(studentSubscription.id, {
          routeId: transportForm.routeId,
          direction: transportForm.direction as any,
          fee: calculatedFee
        });
        toast.success(`تم تحديث خط الترحيل للطالب إلى (${routeObj.name}) بنجاح!`);
      } else {
        addTransportSubscription({
          studentId: student.id,
          routeId: transportForm.routeId,
          direction: transportForm.direction as any,
          fee: calculatedFee,
          status: "active"
        });
        toast.success(`تم تسجيل الطالب في خط ترحيل (${routeObj.name}) وإصدار الفاتورة الرسمية!`);
      }
      setIsTransportModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء حفظ التحديث");
    }
  };

  const handleDeleteTransport = () => {
    if (!studentSubscription) return;
    if (confirm("هل أنت متأكد من إلغاء اشتراك الطالب في النقل المدرسي وإلغاء الفاتورة غير المسددة؟")) {
      deleteTransportSubscription(studentSubscription.id);
      toast.success("تم إلغاء اشتراك النقل المدرسي للطالب بنجاح!");
    }
  };

  const handleGenerateStandardInstallments = () => {
    if (!student) return;
    const baseTuition = 120000;
    const registration = Math.round(baseTuition * 0.40);
    const installmentNov = Math.round(baseTuition * 0.30);
    const installmentFeb = Math.round(baseTuition * 0.30);
    const currentYear = new Date().getFullYear();

    addInvoice({
      studentId: student.id,
      studentName: student.name,
      stage: student.stage,
      title: "قسط التسجيل والقبول (40%)",
      amount: registration,
      dueDate: `${currentYear}-09-01`,
      issueDate: `${currentYear}-08-15`,
      category: "tuition" as any
    });

    addInvoice({
      studentId: student.id,
      studentName: student.name,
      stage: student.stage,
      title: "القسط الدراسي الثاني - استحقاق نوفمبر (30%)",
      amount: installmentNov,
      dueDate: `${currentYear}-11-15`,
      issueDate: `${currentYear}-08-15`,
      category: "tuition" as any
    });

    addInvoice({
      studentId: student.id,
      studentName: student.name,
      stage: student.stage,
      title: "القسط الدراسي الثالث - استحقاق فبراير (30%)",
      amount: installmentFeb,
      dueDate: `${currentYear + 1}-02-15`,
      issueDate: `${currentYear}-08-15`,
      category: "tuition" as any
    });

    addInvoice({
      studentId: student.id,
      studentName: student.name,
      stage: student.stage,
      title: "رسوم الكتب المدرسية والزي الموحد",
      amount: 25000,
      dueDate: `${currentYear}-09-10`,
      issueDate: `${currentYear}-08-15`,
      category: "activities" as any
    });

    toast.success("تم توليد خطة الأقساط النموذجية للمدارس الخاصة بنجاح!");
  };

  const studentTextbooks = useMemo(() => {
    return student ? allTextbooks.filter(tb => tb.gradeId === student.grade || tb.grade === student.grade) : [];
  }, [allTextbooks, student]);
  
  const groupedTextbooks = useMemo(() => {
    const groups: Record<string, typeof studentTextbooks> = {};
    studentTextbooks.forEach(tb => {
      const term = tb.term || "الفصل الأول";
      if (!groups[term]) groups[term] = [];
      groups[term].push(tb);
    });
    return groups;
  }, [studentTextbooks]);
  
  if (!student) {
    return (
      <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الطلاب", to: "/students" }]}>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">الطالب غير موجود</h2>
          <p className="text-muted-foreground max-w-sm">عذراً، لم نتمكن من العثور على بيانات هذا الطالب. قد يكون تم حذفه أو أن المعرف غير صحيح.</p>
          <Link to="/students" className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all">العودة لقائمة الطلاب</Link>
        </div>
      </AppShell>
    );
  }

  // Derived Info safely
  const studentInvoices = allInvoices.filter((i) => studentIds.has(i.studentId));
  const totalPaid = studentInvoices.reduce((acc, curr) => acc + (curr.paid || 0), 0);
  const totalDue = studentInvoices.reduce((acc, curr) => acc + ((curr.amount || 0) - (curr.paid || 0)), 0);
  
  const studentTransactions = useMemo(() => {
    const invoices = studentInvoices.map(i => ({
      id: `inv-${i.id}`,
      date: i.issueDate || i.dueDate,
      title: `إصدار فاتورة: ${i.title}`,
      subtitle: `استحقاق رسوم`,
      amount: i.amount,
      type: "expense" as const, // For student, an invoice is a charge (negative impact on their balance)
      currency
    }));
    const payments = allPayments.filter(p => !!p.studentId && studentIds.has(p.studentId)).map(p => ({
      id: `pay-${p.id}`,
      date: p.date,
      title: `سداد دفعة`,
      subtitle: `بواسطة ${p.method === 'cash' ? 'نقدي' : p.method === 'bank_transfer' ? 'حوالة بنكية' : 'بطاقة ائتمان'}`,
      amount: p.amount,
      type: "income" as const, // A payment is a credit (positive impact on their balance)
      currency,
      method: p.method
    }));
    return [...invoices, ...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [studentInvoices, allPayments, studentIds, currency]);
  
  const studentVisits = allClinicVisits.filter(v => studentIds.has(v.studentId));
  const studentIncidents = allDisciplineIncidents.filter((inc: any) => studentIds.has(inc.studentId) || (inc.studentEnrollmentId && studentIds.has(inc.studentEnrollmentId)));
  const studentSection = allSections.find(sec => sec.id === student.sectionId);
  const initials = student.name ? student.name.split(" ").map(n=>n[0]).slice(0,2).join("") : "ط";

  // Academic & Exam Results derivations
  const studentEnrollmentObj = useMemo(() => {
    if (!student) return null;
    return (allStudentEnrollments || []).find(e => 
      e.studentId === student.id || e.id === student.id || studentIds.has(e.studentId) || studentIds.has(e.id)
    );
  }, [student, allStudentEnrollments, studentIds]);

  const sectionEnrollmentIds = useMemo(() => {
    const targetSectionId = student?.sectionId || studentEnrollmentObj?.sectionId;
    const ids = new Set<string>();
    if (!targetSectionId) return ids;
    (allStudentEnrollments || []).forEach(e => {
      if (e.sectionId === targetSectionId) {
        ids.add(e.id);
        if (e.studentId) ids.add(e.studentId);
      }
    });
    return ids;
  }, [student, studentEnrollmentObj, allStudentEnrollments]);

  const studentExamsList = useMemo(() => {
    return (allExams || []).filter(ex => ex.stage === "all" || !student || ex.stage === student.stage);
  }, [allExams, student]);

  const activeStudentExam = useMemo(() => {
    if (selectedStudentExamId) {
      return studentExamsList.find(e => e.id === selectedStudentExamId) || studentExamsList[0];
    }
    return studentExamsList[0];
  }, [studentExamsList, selectedStudentExamId]);

  const studentExamMarks = useMemo(() => {
    if (!student || !activeStudentExam) return [];
    const targetGrade = student.grade || studentEnrollmentObj?.grade;

    const examSubjects = (allExamSubjects || []).filter(es => 
      es.examId === activeStudentExam.id && (!targetGrade || es.grade === targetGrade)
    );

    return examSubjects.map(es => {
      const sub = (allSubjects || []).find(s => s.id === es.subjectId);
      const res = (allExamResults || []).find(r => 
        r.examSubjectId === es.id && (
          (studentEnrollmentObj && r.studentEnrollmentId === studentEnrollmentObj.id) ||
          r.studentEnrollmentId === student.id ||
          studentIds.has(r.studentEnrollmentId)
        )
      );
      const mark = res?.mark ?? 0;
      const isPassed = mark >= es.passScore;
      const pct = es.maxScore > 0 ? (mark / es.maxScore) * 100 : 0;
      let rating = res?.descriptiveRating;
      if (!rating) {
        if (pct >= 90) rating = "ممتاز";
        else if (pct >= 80) rating = "جيد جداً";
        else if (pct >= 65) rating = "جيد";
        else if (pct >= 50) rating = "مقبول";
        else rating = "ضعيف";
      }

      // Calculate section average
      const subjectSectionResults = (allExamResults || []).filter(r => 
        r.examSubjectId === es.id && (sectionEnrollmentIds.size === 0 || sectionEnrollmentIds.has(r.studentEnrollmentId))
      );
      const sectionAvg = subjectSectionResults.length > 0
        ? (subjectSectionResults.reduce((acc, r) => acc + (r.mark || 0), 0) / subjectSectionResults.length)
        : Math.round(es.maxScore * 0.76);
      const diffFromAvg = mark - sectionAvg;

      return {
        examSubjectId: es.id,
        subjectId: es.subjectId,
        subjectName: sub?.name || es.subjectId,
        teacherName: (sub as any)?.teacherName || "هيئة التدريس",
        maxScore: es.maxScore,
        passScore: es.passScore,
        weight: es.weight || 100,
        mark,
        pct,
        sectionAvg,
        diffFromAvg,
        rating,
        notes: res?.notes || "",
        status: res?.status || "draft",
        isPassed
      };
    });
  }, [student, activeStudentExam, studentEnrollmentObj, allExamSubjects, allSubjects, allExamResults, sectionEnrollmentIds, studentIds]);

  const studentTotalMarks = studentExamMarks.reduce((a, b) => a + b.mark, 0);
  const studentMaxTotalMarks = studentExamMarks.reduce((a, b) => a + b.maxScore, 0);
  const studentOverallPct = studentMaxTotalMarks > 0 ? (studentTotalMarks / studentMaxTotalMarks) * 100 : 0;
  let studentOverallRating = "ناجح";
  if (studentOverallPct >= 95) studentOverallRating = "ممتاز مرتفع (مرتبة الشرف الأولى)";
  else if (studentOverallPct >= 90) studentOverallRating = "ممتاز (مرتبة الشرف الثانية)";
  else if (studentOverallPct >= 80) studentOverallRating = "جيد جداً مرتفع";
  else if (studentOverallPct >= 65) studentOverallRating = "جيد";
  else if (studentOverallPct >= 50) studentOverallRating = "مقبول";
  else studentOverallRating = "له دور ثانٍ";

  const studentRankInfo = useMemo(() => {
    if (!activeStudentExam) return { rank: 1, total: 1 };
    const targetGrade = student?.grade || studentEnrollmentObj?.grade;
    const targetExamSubjects = (allExamSubjects || []).filter(es => 
      es.examId === activeStudentExam.id && (!targetGrade || es.grade === targetGrade)
    );
    if (targetExamSubjects.length === 0) return { rank: 1, total: 1 };

    const targetExamSubIds = new Set(targetExamSubjects.map(es => es.id));
    
    const studentTotals = new Map<string, number>();
    (allExamResults || []).forEach(r => {
      if (targetExamSubIds.has(r.examSubjectId) && (sectionEnrollmentIds.size === 0 || sectionEnrollmentIds.has(r.studentEnrollmentId))) {
        studentTotals.set(r.studentEnrollmentId, (studentTotals.get(r.studentEnrollmentId) || 0) + (r.mark || 0));
      }
    });

    const sortedTotals = Array.from(studentTotals.entries()).sort((a, b) => b[1] - a[1]);
    const myIndex = sortedTotals.findIndex(([id]) => (studentEnrollmentObj && id === studentEnrollmentObj.id) || id === student?.id || studentIds.has(id));
    const rank = myIndex !== -1 ? myIndex + 1 : 1;
    const total = Math.max(sortedTotals.length, 1);
    return { rank, total };
  }, [activeStudentExam, studentEnrollmentObj, student, allExamSubjects, allExamResults, sectionEnrollmentIds, studentIds]);

  const topStrengths = useMemo(() => {
    return [...studentExamMarks].sort((a, b) => b.pct - a.pct).slice(0, 3);
  }, [studentExamMarks]);

  const supportAreas = useMemo(() => {
    return [...studentExamMarks].sort((a, b) => a.pct - b.pct).filter(m => m.pct < 75).slice(0, 3);
  }, [studentExamMarks]);

  // Official Certificate Print Template
  const officialCertificateTemplate: PrintTemplate = {
    id: "student_official_certificate_card",
    name: "الشهادة الفردية الرسمية المعتمدة",
    category: "شهادات",
    type: "document",
    renderDocument: () => (
      <div className="p-8 border-8 border-double border-primary/40 rounded-3xl bg-background text-foreground space-y-6" dir="rtl">
        <div className="text-center border-b-2 border-primary/30 pb-4 space-y-1">
          <p className="text-xs font-bold text-muted-foreground">وزارة التربية والتعليم - مجمع مدارس المستقبل الأهلية</p>
          <h1 className="text-3xl font-black text-primary tracking-wide">شهادة إشعار رسمي بنتيجة الطالب</h1>
          <h2 className="text-lg font-extrabold text-foreground pt-1">{activeStudentExam?.name || "اختبارات الفصل الدراسي"}</h2>
          <p className="text-xs font-bold text-muted-foreground">العام الدراسي: 1446 - 1447 هـ</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 p-4 rounded-2xl border border-border/50 text-xs font-bold">
          <div>اسم الطالب: <span className="text-sm font-black text-foreground block mt-0.5">{student.name}</span></div>
          <div>الرقم الأكاديمي: <span className="text-sm font-black text-foreground block mt-0.5 tabular-nums">{student.nationalId}</span></div>
          <div>الصف والمرحلة: <span className="text-sm font-black text-foreground block mt-0.5">{student.grade}</span></div>
          <div>الشعبة: <span className="text-sm font-black text-foreground block mt-0.5">شعبة {studentSection?.name || "1"}</span></div>
        </div>

        <table className="w-full border-collapse border border-foreground/20 text-sm">
          <thead>
            <tr className="bg-muted/60 text-foreground">
              <th className="border border-foreground/20 p-2 text-right font-black">المادة الدراسية</th>
              <th className="border border-foreground/20 p-2 text-center font-black">الدرجة العظمى</th>
              <th className="border border-foreground/20 p-2 text-center font-black">درجة النجاح</th>
              <th className="border border-foreground/20 p-2 text-center font-black">درجة الطالب</th>
              <th className="border border-foreground/20 p-2 text-center font-black">نسبة الإنجاز</th>
              <th className="border border-foreground/20 p-2 text-center font-black">النتيجة</th>
            </tr>
          </thead>
          <tbody>
            {studentExamMarks.map((m, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-background" : "bg-muted/15"}>
                <td className="border border-foreground/20 p-2 font-black">{m.subjectName}</td>
                <td className="border border-foreground/20 p-2 text-center tabular-nums">{m.maxScore}</td>
                <td className="border border-foreground/20 p-2 text-center tabular-nums text-muted-foreground">{m.passScore}</td>
                <td className="border border-foreground/20 p-2 text-center font-black text-primary text-base tabular-nums">{m.mark}</td>
                <td className="border border-foreground/20 p-2 text-center font-bold tabular-nums" dir="ltr">{m.pct.toFixed(1)}%</td>
                <td className="border border-foreground/20 p-2 text-center font-bold">
                  <span className={m.isPassed ? "text-emerald-700" : "text-rose-700"}>
                    {m.isPassed ? "ناجح" : "راسب"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-3 gap-3 border-2 border-primary/20 p-4 rounded-2xl bg-primary/5 text-center text-xs font-bold">
          <div>
            <p className="text-muted-foreground mb-1">المجموع الكلي</p>
            <p className="text-2xl font-black text-primary tabular-nums">{studentTotalMarks} <span className="text-xs font-normal text-muted-foreground">/ {studentMaxTotalMarks}</span></p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">النسبة المئوية</p>
            <p className="text-2xl font-black text-foreground tabular-nums" dir="ltr">{studentOverallPct.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">التقدير العام المعتمد</p>
            <p className="text-lg font-black text-emerald-600">{studentOverallRating}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 pt-6 text-center text-xs font-black">
          <div>
            <p className="text-muted-foreground mb-6">المرشد الطلابي / رائد الفصل</p>
            <p className="border-t border-dashed border-foreground/30 pt-1 w-32 mx-auto">التوقيع</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-6">وكيل الكنترول والاختبارات</p>
            <p className="border-t border-dashed border-foreground/30 pt-1 w-32 mx-auto">المراجعة والاعتماد</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-6">مدير المدرسة والختم الرسمي</p>
            <p className="border-t border-dashed border-foreground/30 pt-1 w-32 mx-auto">الختم والتوقيع</p>
          </div>
        </div>
      </div>
    )
  };

  // Official Academic Transcript Print Template
  const officialTranscriptTemplate: PrintTemplate = {
    id: "student_academic_transcript_official",
    name: "السيرة الدراسية والسجل الأكاديمي المعتمد",
    category: "سجلات أكاديمية",
    type: "document",
    renderDocument: () => (
      <div className="p-8 border-8 border-double border-primary/50 rounded-3xl bg-background text-foreground space-y-6" dir="rtl">
        {/* Official Header */}
        <div className="flex items-center justify-between border-b-2 border-primary/30 pb-4">
          <div className="text-right space-y-1">
            <p className="text-xs font-black text-muted-foreground">وزارة التربية والتعليم</p>
            <p className="text-xs font-bold text-muted-foreground">إدارة التعليم الأهلي والأجنبي</p>
            <h2 className="text-sm font-black text-foreground">مجمع المدارس الأهلية النموذجية</h2>
          </div>
          <div className="text-center space-y-1">
            <div className="inline-flex p-2.5 rounded-2xl bg-primary/10 text-primary mb-1">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black text-primary tracking-wide">السيرة الدراسية والسجل الأكاديمي الشامل</h1>
            <p className="text-xs font-bold text-muted-foreground">{activeStudentExam?.name || "السجل التراكمي الشامل"}</p>
          </div>
          <div className="text-left space-y-1 text-xs font-bold text-muted-foreground" dir="ltr">
            <p>Academic Year: 1446-1447 H</p>
            <p>Ref: TRN-{student.id.slice(0, 8).toUpperCase()}</p>
            <p>Date: {new Date().toISOString().split("T")[0]}</p>
          </div>
        </div>

        {/* Student Academic Identity Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 p-4 rounded-2xl border border-border/60 text-xs">
          <div><span className="text-muted-foreground font-bold block mb-0.5">اسم الطالب:</span> <span className="font-black text-sm text-foreground">{student.name}</span></div>
          <div><span className="text-muted-foreground font-bold block mb-0.5">الرقم الأكاديمي:</span> <span className="font-black text-sm text-foreground tabular-nums">{student.nationalId}</span></div>
          <div><span className="text-muted-foreground font-bold block mb-0.5">المرحلة والصف:</span> <span className="font-black text-sm text-foreground">{student.grade}</span></div>
          <div><span className="text-muted-foreground font-bold block mb-0.5">الشعبة الدراسية:</span> <span className="font-black text-sm text-foreground">شعبة {studentSection?.name || "1"}</span></div>
        </div>

        {/* Academic Marks Table */}
        <table className="w-full border-collapse border border-foreground/20 text-xs">
          <thead>
            <tr className="bg-muted/70 text-foreground font-black">
              <th className="border border-foreground/20 p-2.5 text-right">#</th>
              <th className="border border-foreground/20 p-2.5 text-right">المادة الدراسية</th>
              <th className="border border-foreground/20 p-2.5 text-center">النهاية العظمى</th>
              <th className="border border-foreground/20 p-2.5 text-center">درجة النجاح</th>
              <th className="border border-foreground/20 p-2.5 text-center">درجة الطالب</th>
              <th className="border border-foreground/20 p-2.5 text-center">النسبة</th>
              <th className="border border-foreground/20 p-2.5 text-center">متوسط الشعبة</th>
              <th className="border border-foreground/20 p-2.5 text-center">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {studentExamMarks.map((m, idx) => {
              const pct = m.maxScore > 0 ? (m.mark / m.maxScore) * 100 : 0;
              return (
                <tr key={idx} className={idx % 2 === 0 ? "bg-background" : "bg-muted/10"}>
                  <td className="border border-foreground/20 p-2 text-center tabular-nums font-bold">{idx + 1}</td>
                  <td className="border border-foreground/20 p-2 font-black text-foreground">{m.subjectName}</td>
                  <td className="border border-foreground/20 p-2 text-center font-bold tabular-nums text-muted-foreground">{m.maxScore}</td>
                  <td className="border border-foreground/20 p-2 text-center font-bold tabular-nums text-muted-foreground">{m.passScore}</td>
                  <td className="border border-foreground/20 p-2 text-center font-black text-primary text-sm tabular-nums">{m.mark}</td>
                  <td className="border border-foreground/20 p-2 text-center font-bold tabular-nums" dir="ltr">{pct.toFixed(1)}%</td>
                  <td className="border border-foreground/20 p-2 text-center font-bold tabular-nums text-muted-foreground">{m.sectionAvg.toFixed(1)}</td>
                  <td className="border border-foreground/20 p-2 text-center font-bold">
                    <span className={m.isPassed ? "text-emerald-700" : "text-rose-700"}>
                      {m.isPassed ? "ناجح" : "له دور ثانٍ"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Official Summary & Standing */}
        <div className="grid grid-cols-4 gap-3 border-2 border-primary/30 p-4 rounded-2xl bg-primary/5 text-center text-xs font-bold">
          <div>
            <p className="text-muted-foreground mb-1">المجموع التراكمي المحرز</p>
            <p className="text-xl font-black text-primary tabular-nums">{studentTotalMarks} <span className="text-xs font-normal text-muted-foreground">/ {studentMaxTotalMarks}</span></p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">المعدل العام للفترة</p>
            <p className="text-xl font-black text-foreground tabular-nums" dir="ltr">{studentOverallPct.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">الترتيب الأكاديمي</p>
            <p className="text-base font-black text-primary">المركز {studentRankInfo.rank} من {studentRankInfo.total}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">التقدير ومرتبة الشرف</p>
            <p className="text-base font-black text-emerald-600">{studentOverallRating}</p>
          </div>
        </div>

        {/* Guidance and Behavioral notes */}
        <div className="p-3 bg-muted/20 rounded-xl border border-border/50 text-xs space-y-1">
          <p className="font-black text-foreground">قرار لجنة الرصد والكنترول والإرشاد الطلابي:</p>
          <p className="text-muted-foreground leading-relaxed">
            {studentExamMarks.every(m => m.isPassed) 
              ? "اجتاز الطالب كافة المقررات الدراسية بنجاح وتفوق ويعد مؤهلاً للانتقال إلى المرحلة الأكاديمية التالية مع استحقاق شهادة التفوق العلمي."
              : "الطالب مطالب بدخول اختبارات الدور الثاني في المواد غير المجتازة، ويرجى التنسيق مع المرشد الطلابي لوضع خطة التحسين والمتابعة الأكاديمية."}
          </p>
        </div>

        {/* Official Endorsement & Signatures */}
        <div className="grid grid-cols-3 pt-6 text-center text-xs font-black">
          <div>
            <p className="text-muted-foreground mb-6">المرشد الطلابي</p>
            <p className="border-t border-dashed border-foreground/30 pt-1 w-32 mx-auto">أ. أحمد المنصور</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-6">رئيس لجنة الكنترول والاختبارات</p>
            <p className="border-t border-dashed border-foreground/30 pt-1 w-32 mx-auto">أ. سعد بن عبد العزيز</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-6">مدير المجمع المدرسي والختم</p>
            <p className="border-t border-dashed border-foreground/30 pt-1 w-32 mx-auto">د. محمد عبد الله السهل</p>
          </div>
        </div>
      </div>
    )
  };

  // Define templates for the specific student
  const printTemplates: PrintTemplate[] = useMemo(() => {
    return [
      officialTranscriptTemplate,
      officialCertificateTemplate,
      {
        id: "academic_report", name: "التقرير الأكاديمي الشامل", category: "أكاديمي", type: "document",
        renderDocument: () => (
          <div className="space-y-8">
            <h3 className="text-2xl font-black border-b-2 border-gray-800 pb-3 mb-6">البيانات الأكاديمية والمالية الشاملة</h3>
            <div className="grid grid-cols-2 gap-x-10 gap-y-6 text-base">
              <p className="border-b border-gray-300 pb-2"><span className="text-gray-500 font-bold inline-block w-24">الاسم الرباعي:</span> <span className="font-bold text-lg">{student.name}</span></p>
              <p className="border-b border-gray-300 pb-2"><span className="text-gray-500 font-bold inline-block w-24">رقم الهوية:</span> <span className="font-bold tabular-nums">{student.nationalId}</span></p>
              <p className="border-b border-gray-300 pb-2"><span className="text-gray-500 font-bold inline-block w-24">المرحلة:</span> <span className="font-bold">{student.stage === 'kindergarten' ? 'رياض الأطفال' : student.stage === 'primary' ? 'الابتدائية' : student.stage === 'middle' ? 'المتوسطة' : 'الثانوية'}</span></p>
              <p className="border-b border-gray-300 pb-2"><span className="text-gray-500 font-bold inline-block w-24">الصف:</span> <span className="font-bold">{student.grade}</span></p>
              <p className="border-b border-gray-300 pb-2"><span className="text-gray-500 font-bold inline-block w-24">الشعبة:</span> <span className="font-bold">{studentSection?.name || "غير محدد"}</span></p>
              <p className="border-b border-gray-300 pb-2"><span className="text-gray-500 font-bold inline-block w-24">تاريخ الميلاد:</span> <span className="font-bold tabular-nums">{student.dob}</span></p>
              <p className="border-b border-gray-300 pb-2"><span className="text-gray-500 font-bold inline-block w-24">ولي الأمر:</span> <span className="font-bold">{student.guardianName}</span></p>
              <p className="border-b border-gray-300 pb-2"><span className="text-gray-500 font-bold inline-block w-24">التواصل:</span> <span className="font-bold tabular-nums">{student.guardianPhone || "غير مسجل"}</span></p>
              <p className="border-b border-gray-300 pb-2 col-span-2"><span className="text-gray-500 font-bold inline-block w-24">العنوان:</span> <span className="font-bold">{student.address || "غير مسجل"}</span></p>
            </div>
            
            <h3 className="text-xl font-bold border-b-2 border-gray-800 pb-2 mt-10 mb-4">ملخص السلوك والغياب</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 p-4 rounded-xl border border-gray-300">
                <p className="text-gray-500 text-sm font-bold mb-1">المخالفات السلوكية</p>
                <p className="text-3xl font-black text-gray-800 tabular-nums">{studentIncidents.length}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-xl border border-gray-300">
                <p className="text-gray-500 text-sm font-bold mb-1">الرصيد المالي المتبقي</p>
                <p className="text-3xl font-black text-red-700 tabular-nums">{totalDue} <span className="text-base">{currency}</span></p>
              </div>
            </div>
            
            <div className="mt-8">
               <h4 className="font-bold mb-3">سجل أحدث المخالفات:</h4>
               {studentIncidents.length > 0 ? (
                 <table className="w-full text-sm border-collapse border border-gray-400">
                   <thead><tr className="bg-gray-200"><th className="border p-2">التاريخ</th><th className="border p-2">النوع</th><th className="border p-2">التفاصيل</th></tr></thead>
                   <tbody>
                     {studentIncidents.slice(0, 5).map(inc => (
                       <tr key={inc.id}>
                         <td className="border p-2 tabular-nums">{inc.date}</td>
                         <td className="border p-2"><span className="text-sm font-medium">{(inc as any).category}</span></td>
                         <td className="border p-2">{inc.description}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               ) : <p className="text-gray-500 font-bold">لا توجد مخالفات مسجلة.</p>}
            </div>
          </div>
        )
      },
      {
        id: "medical_report", name: "الملف الصحي الشامل", category: "طبي", type: "document",
        renderDocument: () => (
          <div className="space-y-6">
            <div className="bg-red-50 border-2 border-red-200 p-6 rounded-2xl mb-8">
              <h3 className="text-2xl font-black text-red-900 border-b-2 border-red-200 pb-3 mb-4">الملف الطبي: {student.name}</h3>
              <div className="grid grid-cols-2 gap-4 text-red-900">
                <p><span className="font-bold">فصيلة الدم:</span> <span className="text-xl tabular-nums mr-2" dir="ltr">{student.bloodType || "غير محدد"}</span></p>
                <p><span className="font-bold">رقم التواصل في الطوارئ:</span> <span className="tabular-nums mr-2">{student.guardianPhone}</span></p>
                <p className="col-span-2"><span className="font-bold block mb-1">الملاحظات الطبية / الأمراض المزمنة:</span> 
                  <span className="bg-white p-3 rounded-lg border border-red-100 block mt-2 text-red-900">{student.medicalNotes || "لا توجد أمراض مزمنة أو ملاحظات طبية خاصة."}</span>
                </p>
              </div>
            </div>

            <h4 className="text-xl font-bold border-b border-gray-300 pb-2 mt-8 mb-4">سجل مراجعات العيادة المدرسية</h4>
            {studentVisits.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-xl">
                <p className="text-gray-500 font-bold text-lg">لم يقم الطالب بأي زيارات للعيادة المدرسية.</p>
              </div>
            ) : (
              <table className="w-full text-sm border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 p-3 text-right">التاريخ</th>
                    <th className="border border-gray-400 p-3 text-right">الأعراض</th>
                    <th className="border border-gray-400 p-3 text-right">التشخيص</th>
                    <th className="border border-gray-400 p-3 text-right">الإجراء المتخذ</th>
                  </tr>
                </thead>
                <tbody>
                  {studentVisits.map(v => (
                    <tr key={v.id} className="even:bg-gray-50">
                      <td className="border border-gray-400 p-3 tabular-nums font-bold">{v.date}</td>
                      <td className="border border-gray-400 p-3">{v.symptoms}</td>
                      <td className="border border-gray-400 p-3">{v.diagnosis}</td>
                      <td className="border border-gray-400 p-3">{v.actionTaken}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      },
      {
        id: "discipline_report", name: "إشعار مخالفة سلوكية (مخصص)", category: "سلوكي", type: "document",
        renderDocument: () => (
          <div className="space-y-6 text-lg leading-relaxed">
            <div className="text-center mb-10">
              <h3 className="text-2xl font-black underline underline-offset-8 decoration-gray-400">إشعار ولي أمر بمخالفة سلوكية</h3>
            </div>
            <p>المكرم ولي أمر الطالب / <strong className="text-xl">{student.name}</strong> المحترم،</p>
            <p>الصف: <strong>{student.grade}</strong> | الشعبة: <strong>{studentSection?.name || "غير محدد"}</strong></p>
            <p>السلام عليكم ورحمة الله وبركاته،</p>
            <p className="text-justify mt-4">
              إشارة إلى قواعد السلوك والمواظبة المعتمدة، ونظراً لما تم رصده من قبل إدارة المدرسة، نفيدكم علماً بأنه قد تم تسجيل المخالفة التالية على ابنكم:
            </p>
            <div className="bg-gray-100 p-6 rounded-xl border border-gray-400 my-8 shadow-inner">
              <h4 className="font-bold text-gray-500 text-sm mb-2">تفاصيل المخالفة:</h4>
              <p className="font-bold text-xl">
                {studentIncidents[0]?.description || "...................................................................................."}
              </p>
            </div>
            <p className="text-justify">
              لذا نأمل منكم التفضل بالاطلاع، والتعاون مع إدارة المدرسة لتقويم سلوك الطالب، ومراجعة وكيل شؤون الطلاب في موعد أقصاه ثلاثة أيام من تاريخ هذا الإشعار.
            </p>
            <p className="mt-8 font-bold">وتقبلوا خالص التحية والتقدير.</p>
          </div>
        )
      },
      {
        id: "certificate", name: "شهادة شكر وتقدير", category: "عام", type: "document",
        renderDocument: () => (
          <div className="text-center p-10 border-8 border-double border-yellow-600 bg-yellow-50 m-10 rounded-xl space-y-6">
            <h1 className="text-4xl font-black text-yellow-800">شهادة شكر وتقدير</h1>
            <p className="text-xl">تتقدم إدارة المدرسة بوافر الشكر والتقدير للطالب المتميز:</p>
            <h2 className="text-3xl font-bold text-blue-900">{student.name}</h2>
            <p className="text-lg">وذلك لتميزه الدراسي وتفوقه العلمي وحسن سيرته وسلوكه خلال العام الدراسي.</p>
            <p className="text-xl font-bold text-yellow-800 mt-10">متمنين له دوام التوفيق والنجاح.</p>
          </div>
        )
      },
      {
        id: "financial_statement", name: "كشف حساب مالي", category: "مالي", type: "table",
        columns: [
          { key: "id", label: "رقم الفاتورة", render: (row: any) => row.id },
          { key: "title", label: "البيان", render: (row: any) => row.title || "الرسوم الدراسية" },
          { key: "amount", label: "المبلغ", render: (row: any) => `${row.amount.toLocaleString()} ريال` },
          { key: "paid", label: "المدفوع", render: (row: any) => `${row.paid.toLocaleString()} ريال` },
          { key: "remaining", label: "المتبقي", render: (row: any) => `${(row.amount - row.paid).toLocaleString()} ريال` },
          { key: "status", label: "الحالة", render: (row: any) => row.status === 'paid' ? 'مسددة' : row.status === 'partial' ? 'مسددة جزئياً' : 'غير مسددة' },
          { key: "dueDate", label: "تاريخ الاستحقاق", render: (row: any) => row.dueDate },
        ]
      }
    ];
  }, [student, studentSection, studentVisits, studentIncidents]);

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الطلاب", to: "/students" },
        { label: "الملف الشخصي" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => setIsAcademicCareerModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/85 text-primary-foreground px-4 text-xs sm:text-sm font-black shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all cursor-pointer"
          >
            <GraduationCap className="h-4 w-4" />
            <span>السيرة الدراسية الشاملة</span>
          </button>
          <button 
            onClick={() => setIsEditOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-card border border-border/50 px-4 text-xs sm:text-sm font-bold hover:bg-accent transition-colors shadow-sm cursor-pointer"
          >
            <Settings className="h-4 w-4" /> تعديل الملف
          </button>
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-card border border-border/50 px-4 text-xs sm:text-sm font-bold hover:bg-accent transition-colors shadow-sm cursor-pointer"
          >
            <Printer className="h-4 w-4" /> مركز الطباعة
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto print:hidden">
        
        {totalDue > 0 && (
          <div className="bg-danger/10 border border-danger/30 text-danger p-4 rounded-xl flex items-center gap-3 shadow-sm">
            <AlertCircle className="h-6 w-6 shrink-0" />
            <div>
              <p className="font-bold">تنبيه مالي: يوجد مديونية متأخرة</p>
              <p className="text-sm mt-1">يوجد على الطالب مستحقات مالية متأخرة بقيمة {totalDue.toLocaleString()} {currency}. يرجى تسوية المديونية قبل إصدار الشهادات النهائية.</p>
            </div>
            <button 
              onClick={() => {
                document.getElementById('financial-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="mr-auto text-sm font-bold bg-background/50 hover:bg-background px-4 py-2 rounded-lg border border-danger/20 transition-colors"
            >
              عرض الفواتير
            </button>
          </div>
        )}

        {/* Profile Header (Glassmorphism) */}
        <div className="relative rounded-3xl overflow-hidden bg-card border border-border/50 shadow-sm glass">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent"></div>
          <div className="relative p-6 pt-12 sm:p-10 sm:pt-16 flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <div className="h-28 w-28 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center text-4xl font-extrabold shadow-xl border-4 border-background z-10 shrink-0 transform hover:scale-105 transition-transform">
              {initials}
            </div>
            <div className="flex-1 text-center sm:text-right pb-2">
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 mb-3">
                <h1 className="text-3xl font-extrabold">{student.name}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${student.status === "نشط" ? "bg-success/10 text-success border border-success/20" : "bg-muted text-muted-foreground border border-border"}`}>
                  {student.status || "نشط"}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-muted-foreground font-bold">
                <span className="flex items-center gap-1.5 bg-background/50 px-3 py-1 rounded-lg border border-border/50"><ShieldCheck className="h-4 w-4 text-primary" /> {student.nationalId}</span>
                <span className="flex items-center gap-1.5 bg-background/50 px-3 py-1 rounded-lg border border-border/50"><GraduationCap className="h-4 w-4 text-primary" /> {student.grade}</span>
                {studentSection && (
                  <Link to="/academic/classes" className="flex items-center gap-1.5 hover:text-primary transition-colors bg-primary/10 px-3 py-1 rounded-lg border border-primary/20 text-primary">
                    <LayoutGrid className="h-4 w-4" /> شعبة {studentSection.name}
                  </Link>
                )}
                <span className="flex items-center gap-1.5 bg-background/50 px-3 py-1 rounded-lg border border-border/50"><MapPin className="h-4 w-4 text-primary" /> {student.address || "العنوان غير مسجل"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Profile Tabs Switcher */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-card border border-border/60 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveProfileTab("career")}
            className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeProfileTab === "career"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.01]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>السيرة الدراسية والنتائج</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md ${
              activeProfileTab === "career" ? "bg-white/20 text-white" : "bg-primary/10 text-primary font-bold"
            }`}>
              أكاديمي
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveProfileTab("overview")}
            className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeProfileTab === "overview"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.01]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <User className="h-4 w-4" />
            <span>الملف العام والبيانات</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveProfileTab("finance")}
            className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeProfileTab === "finance"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.01]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>المركز المالي والأقساط</span>
            {totalDue > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500 text-white font-black">
                مستحق
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveProfileTab("books")}
            className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeProfileTab === "books"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.01]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>المقررات والكتب المدرسية</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: السيرة الدراسية والنتائج الأكاديمية الشاملة */}
        {/* ========================================================================= */}
        {activeProfileTab === "career" && (
          <div className="space-y-6">
            {/* Academic Passport Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/60">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-black shadow-lg shadow-primary/25 shrink-0">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-xl font-black text-foreground">السيرة الدراسية والسجل الأكاديمي الشامل</h2>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {studentOverallRating}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      الملف التراكمي المعتمد • {student.grade} • شعبة {studentSection?.name || "1"} • العام الدراسي 1446-1447هـ
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAcademicCareerModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/85 px-4 py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-[0.98] cursor-pointer"
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>السيرة الدراسية الشاملة (منبثق)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTranscriptPrintOpen(true)}
                    disabled={studentExamMarks.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-card border border-border/80 px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    <span>طباعة السيرة (Transcript)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCertificatePrintOpen(true)}
                    disabled={studentExamMarks.length === 0}
                    className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
                  >
                    <Award className="h-4 w-4 text-amber-500" />
                    <span>إشعار النتيجة الفردي</span>
                  </button>

                  <Link
                    to="/exams/archive"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-xs font-bold text-primary hover:bg-primary/10 transition-all shadow-sm"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>لوحة تحليلات الأرشيف</span>
                  </Link>
                </div>
              </div>

              {/* 4 Primary Academic KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
                <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 shadow-xs">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" /> المعدل العام للفترة
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-foreground tabular-nums" dir="ltr">{studentOverallPct.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2.5 h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        studentOverallPct >= 90 ? "bg-emerald-500" : studentOverallPct >= 75 ? "bg-primary" : studentOverallPct >= 50 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, studentOverallPct))}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 shadow-xs">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-1.5">
                    <Trophy className="h-3.5 w-3.5 text-amber-500" /> الترتيب في الشعبة
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-foreground">المركز {studentRankInfo.rank}</span>
                    <span className="text-xs text-muted-foreground font-bold">من {studentRankInfo.total} طالباً</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 font-bold">
                    {studentRankInfo.rank === 1 ? "🥇 الأول على الشعبة الدراسية" : studentRankInfo.rank <= 3 ? "🥈 ضمن الثلاثة الأوائل" : "ضمن شريحة التميز الدراسي"}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 shadow-xs">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> المقررات المجتازة
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-foreground tabular-nums">
                      {studentExamMarks.filter(m => m.isPassed).length}
                    </span>
                    <span className="text-xs text-muted-foreground font-bold tabular-nums">/ {studentExamMarks.length} مقرر</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 font-bold">
                    {studentExamMarks.length > 0 && studentExamMarks.every(m => m.isPassed) ? "اجتياز كامل بنسبة 100%" : "توجد مقررات تتطلب دور ثانٍ"}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 shadow-xs">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> الانضباط والمواظبة
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-600">
                      {studentIncidents.length === 0 ? "100%" : `${Math.max(70, 100 - studentIncidents.length * 5)}%`}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 font-bold">
                    {studentIncidents.length === 0 ? "سجل سلوكي خالٍ من المخالفات" : `${studentIncidents.length} ملاحظات مسجلة`}
                  </p>
                </div>
              </div>
            </div>

            {/* Exam Period & Term Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/60 shadow-xs">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="text-xs font-black text-foreground">فترة الاختبار المعروضة:</span>
                <span className="text-xs font-bold text-muted-foreground">({activeStudentExam?.name || "الفترة الحالية"})</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                {studentExamsList.map(exam => {
                  const isSelected = activeStudentExam?.id === exam.id;
                  return (
                    <button
                      key={exam.id}
                      type="button"
                      onClick={() => setSelectedStudentExamId(exam.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted/40 hover:bg-muted text-foreground border-border/60"
                      }`}
                    >
                      <span>{exam.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                        isSelected ? "bg-white/20 text-white" : "bg-background text-muted-foreground"
                      }`}>
                        {exam.term}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detailed Subject Marks Matrix */}
            <PageCard className="shadow-sm border-border/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground">مصفوفة النتائج والدرجات التفصيلية</h3>
                    <p className="text-xs text-muted-foreground">درجات المقررات والنسب ومقارنتها بمتوسط الشعبة والتقديرات اللفظية</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                  <span>إجمالي الدرجات:</span>
                  <span className="text-sm font-black text-foreground tabular-nums">{studentTotalMarks} / {studentMaxTotalMarks}</span>
                </div>
              </div>

              {studentExamMarks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground font-bold border border-dashed border-border/60 rounded-2xl my-4">
                  <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                  لا توجد نتائج مسجلة لهذا الطالب في الفترة المختارة ({activeStudentExam?.name || "الفترة الحالية"}).
                </div>
              ) : (
                <div className="overflow-x-auto border border-border/60 rounded-2xl mt-4">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-black">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">المادة الدراسية</th>
                        <th className="p-3 text-center">النهاية العظمى</th>
                        <th className="p-3 text-center">درجة النجاح</th>
                        <th className="p-3 text-center">درجة الطالب</th>
                        <th className="p-3 text-center">النسبة</th>
                        <th className="p-3 text-center">متوسط الشعبة</th>
                        <th className="p-3 text-center">الفارق</th>
                        <th className="p-3 text-center">الحالة</th>
                        <th className="p-3 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {studentExamMarks.map((m, idx) => {
                        const isAboveAvg = m.diffFromAvg >= 0;
                        return (
                          <tr key={idx} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3 font-bold text-muted-foreground tabular-nums">{idx + 1}</td>
                            <td className="p-3">
                              <p className="font-black text-foreground text-sm">{m.subjectName}</p>
                              <p className="text-[11px] text-muted-foreground font-medium">{m.teacherName}</p>
                            </td>
                            <td className="p-3 text-center font-bold text-muted-foreground tabular-nums">{m.maxScore}</td>
                            <td className="p-3 text-center font-bold text-muted-foreground tabular-nums">{m.passScore}</td>
                            <td className="p-3 text-center">
                              <span className={`text-base font-black tabular-nums ${m.isPassed ? "text-primary" : "text-rose-600"}`}>
                                {m.mark}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-black tabular-nums" dir="ltr">{m.pct.toFixed(0)}%</span>
                                <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${m.pct >= 85 ? "bg-emerald-500" : m.pct >= 65 ? "bg-primary" : "bg-amber-500"}`}
                                    style={{ width: `${m.pct}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center font-bold text-muted-foreground tabular-nums">
                              {m.sectionAvg.toFixed(1)}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-black ${
                                isAboveAvg ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                              }`}>
                                {isAboveAvg ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                <span dir="ltr">{Math.abs(m.diffFromAvg).toFixed(1)}</span>
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black ${
                                m.isPassed ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                              }`}>
                                {m.isPassed ? "ناجح" : "راسب"}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => setQuickEditMarkModal({
                                  isOpen: true,
                                  examSubjectId: m.examSubjectId,
                                  subjectName: m.subjectName,
                                  currentMark: m.mark,
                                  maxScore: m.maxScore
                                })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/80 hover:bg-muted text-[11px] font-bold text-foreground transition-all active:scale-[0.98]"
                              >
                                <Edit3 className="h-3 w-3 text-primary" />
                                <span>تعديل</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </PageCard>

            {/* Dual Analytical Panels: Strengths vs Growth */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Top Performing Strengths */}
              <PageCard className="shadow-sm border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-emerald-500/20">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-foreground">نقاط التميز والتفوق الأكاديمي</h4>
                    <p className="text-[11px] text-muted-foreground">أعلى المقررات إنجازاً للطالب خلال الفترة</p>
                  </div>
                </div>

                {topStrengths.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">لا توجد بيانات كافية</p>
                ) : (
                  <div className="space-y-3">
                    {topStrengths.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60">
                        <div className="flex items-center gap-2.5">
                          <span className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-xs">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-black text-xs text-foreground">{s.subjectName}</p>
                            <p className="text-[10px] text-muted-foreground">{s.teacherName}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="font-black text-sm text-emerald-600 tabular-nums" dir="ltr">{s.pct.toFixed(0)}%</span>
                          <span className="text-[10px] text-muted-foreground block font-bold">{s.mark} من {s.maxScore}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </PageCard>

              {/* Areas for Academic Growth */}
              <PageCard className="shadow-sm border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-amber-500/20">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600">
                    <Compass className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-foreground">مجالات التحسين والدعم الأكاديمي</h4>
                    <p className="text-[11px] text-muted-foreground">مقررات تستوجب متابعة تدريسية لرفع الكفاءة</p>
                  </div>
                </div>

                {supportAreas.length === 0 ? (
                  <div className="p-4 rounded-xl bg-card border border-emerald-500/30 text-center text-xs font-bold text-emerald-600">
                    🌟 أداء أكاديمي متوازن ومتميز! لا توجد مواد دون مستوى الإتقان.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {supportAreas.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/60">
                        <div className="flex items-center gap-2.5">
                          <span className="h-6 w-6 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-xs">
                            !
                          </span>
                          <div>
                            <p className="font-black text-xs text-foreground">{s.subjectName}</p>
                            <p className="text-[10px] text-muted-foreground">{s.teacherName}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="font-black text-sm text-amber-600 tabular-nums" dir="ltr">{s.pct.toFixed(0)}%</span>
                          <span className="text-[10px] text-muted-foreground block font-bold">{s.mark} من {s.maxScore}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </PageCard>
            </div>

            {/* Visual Competency Benchmarking vs Section Average */}
            {studentExamMarks.length > 0 && (
              <PageCard title="المقارنة البيانية مع متوسط الشعبة" className="shadow-sm">
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-end gap-5 text-xs font-bold pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      <span>درجة الطالب</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-muted-foreground/40" />
                      <span>متوسط الشعبة</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {studentExamMarks.map((m, idx) => {
                      const studentPct = m.pct;
                      const avgPct = m.maxScore > 0 ? (m.sectionAvg / m.maxScore) * 100 : 0;
                      return (
                        <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-background/50 border border-border/50">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-black text-foreground">{m.subjectName}</span>
                            <div className="flex items-center gap-3">
                              <span className="font-black text-primary tabular-nums" dir="ltr">{studentPct.toFixed(0)}% (طالب)</span>
                              <span className="text-muted-foreground font-bold tabular-nums" dir="ltr">{avgPct.toFixed(0)}% (شعبة)</span>
                            </div>
                          </div>
                          {/* Student Bar */}
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(3, studentPct))}%` }}
                            />
                          </div>
                          {/* Section Bar */}
                          <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-muted-foreground/40 transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(3, avgPct))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </PageCard>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: الملف العام والبيانات الشخصية */}
        {/* ========================================================================= */}
        {activeProfileTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Column: Quick Info */}
            <div className="space-y-6">
              {/* Contact & Guardian */}
              <PageCard title="معلومات ولي الأمر" className="shadow-sm">
                <div className="space-y-4">
                  <div className="flex gap-3 items-start p-3 rounded-xl hover:bg-accent/50 transition-colors border border-transparent hover:border-border/50">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary"><User className="h-4 w-4" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5 font-bold">الاسم والقرابة</p>
                      <p className="font-bold">{student.guardianName} <span className="text-sm font-normal text-muted-foreground">({student.guardianRelation || "ولي أمر"})</span></p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start p-3 rounded-xl hover:bg-accent/50 transition-colors border border-transparent hover:border-border/50">
                    <div className="p-2 rounded-lg bg-success/10 text-success"><Phone className="h-4 w-4" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5 font-bold">رقم التواصل</p>
                      <p className="font-bold tabular-nums" dir="ltr">{student.guardianPhone || "غير مسجل"}</p>
                    </div>
                  </div>
                </div>
              </PageCard>

              {/* Medical Info */}
              <PageCard title="الملف الصحي" className="shadow-sm border-danger/20 bg-danger/5">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-danger/10">
                    <span className="text-sm font-bold text-muted-foreground flex items-center gap-2"><HeartPulse className="h-4 w-4 text-danger/70" /> فصيلة الدم</span>
                    <span className="font-black text-danger bg-danger/10 px-3 py-1 rounded-lg tabular-nums" dir="ltr">{student.bloodType || "؟"}</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 font-bold">الملاحظات الطبية:</p>
                    {student.medicalNotes ? (
                      <p className="text-sm font-bold leading-relaxed">{student.medicalNotes}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">لا توجد ملاحظات طبية مسجلة.</p>
                    )}
                  </div>
                  {/* Specific stage stuff */}
                  {student.stage === "kindergarten" && "allergies" in student && (
                    <div className="pt-3 border-t border-danger/10">
                      <p className="text-sm text-muted-foreground mb-1 font-bold">الحساسية:</p>
                      <p className="text-sm font-bold text-warning-foreground bg-warning/20 px-3 py-1.5 rounded-lg">{(student as any).allergies}</p>
                    </div>
                  )}
                </div>
              </PageCard>
              
              {/* Stage Specific */}
              {student.stage === "high" && "major" in student && (
                <PageCard title="المسار الثانوي">
                  <div className="flex justify-between items-center bg-background/50 p-3 rounded-xl border border-border/50">
                    <span className="text-sm text-muted-foreground font-bold">التشعيب:</span>
                    <span className="font-bold text-primary">{(student as any).major === "science" ? "مسار علمي" : "مسار إنساني"}</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 bg-background/50 p-3 rounded-xl border border-border/50">
                    <span className="text-sm text-muted-foreground font-bold">التخصص:</span>
                    <span className="font-bold">{(student as any).elective}</span>
                  </div>
                </PageCard>
              )}
              {student.stage === "kindergarten" && "pickupPersons" in student && (
                <PageCard title="المخولون بالاستلام">
                  <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                    <p className="text-sm font-bold">{(student as any).pickupPersons}</p>
                  </div>
                </PageCard>
              )}

              {/* Transport Card */}
              <PageCard title="النقل المدرسي والتراحيل" className="shadow-sm">
                {studentSubscription && studentRoute ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-primary/5 p-3 rounded-xl border border-primary/20">
                      <span className="text-sm text-primary font-bold flex items-center gap-2"><Bus className="h-4 w-4" /> الخط / المسار:</span>
                      <span className="font-bold">{studentRoute.name}</span>
                    </div>
                    <div className="flex justify-between items-center bg-background/50 p-3 rounded-xl border border-border/50">
                      <span className="text-sm text-muted-foreground font-bold">نوع الترحيل:</span>
                      <span className="font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-xs">
                        {studentSubscription.direction === 'round-trip' ? 'ذهاب وعودة' : studentSubscription.direction === 'going' || (studentSubscription.direction as any) === 'pickup' ? 'ذهاب فقط' : 'عودة فقط'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-background/50 p-3 rounded-xl border border-border/50">
                      <span className="text-sm text-muted-foreground font-bold">الرسوم المسجلة:</span>
                      <span className="font-black text-primary tabular-nums">
                        {(studentSubscription.fee || (studentSubscription.direction === 'round-trip' ? studentRoute.feeAmount : Math.round(studentRoute.feeAmount * 0.6))).toLocaleString()} {currency}
                      </span>
                    </div>
                    {studentRoute.driverName && (
                      <div className="flex justify-between items-center bg-background/50 p-3 rounded-xl border border-border/50 text-xs">
                        <span className="text-muted-foreground font-bold">السائق والحافلة:</span>
                        <span className="font-bold">{studentRoute.driverName} {studentRoute.vehiclePlate ? `(${studentRoute.vehiclePlate})` : ''}</span>
                      </div>
                    )}

                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={handleOpenTransportModal}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-card border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        <Settings className="w-3.5 h-3.5" /> تعديل الترحيل
                      </button>
                      <button
                        onClick={handleDeleteTransport}
                        className="inline-flex items-center justify-center p-2 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-xl text-xs font-bold transition-all border border-danger/20"
                        title="إلغاء الاشتراك"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground space-y-3">
                    <div className="p-3 bg-muted/40 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                      <Bus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">غير مشترك في النقل المدرسي</p>
                      <p className="text-xs text-muted-foreground mt-1">يمكنك ربطه بأحد خطوط التراحيل وحساب الرسوم تلقائياً.</p>
                    </div>
                    <button
                      onClick={handleOpenTransportModal}
                      className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> إضافة إلى خط ترحيل
                    </button>
                  </div>
                )}
              </PageCard>
            </div>

            {/* Right Column: Activity & Merits */}
            <div className="md:col-span-2 space-y-6">
              {/* Top Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm glass flex items-center gap-4 hover:border-primary/30 transition-colors">
                  <div className="p-4 rounded-2xl bg-info/10 text-info"><CalendarDays className="h-6 w-6" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 font-bold">تاريخ الالتحاق</p>
                    <p className="font-black text-xl tabular-nums">{student.enrollmentDate || "2023-08-20"}</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm glass flex items-center gap-4 hover:border-danger/30 transition-colors">
                  <div className="p-4 rounded-2xl bg-danger/10 text-danger"><FileText className="h-6 w-6" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 font-bold">إجمالي المتأخرات المتبقية</p>
                    <p className="font-black text-xl tabular-nums text-danger">{totalDue.toLocaleString("en-US")} {currency}</p>
                  </div>
                </div>
              </div>

              {/* Health Clinic Visits & Conduct Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <PageCard title="الزيارات الصحية" className="shadow-sm h-full">
                  {studentVisits.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground font-bold h-full flex items-center justify-center border border-dashed border-border/50 rounded-2xl">لا توجد زيارات مسجلة.</div>
                  ) : (
                    <div className="space-y-3">
                      {studentVisits.map(v => (
                        <div key={v.id} className="p-4 rounded-2xl border border-border/50 bg-background text-sm hover:border-primary/30 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-primary">{v.diagnosis}</span>
                            <span className="text-xs text-muted-foreground tabular-nums bg-muted px-2 py-0.5 rounded-lg">{v.date}</span>
                          </div>
                          <p className="text-xs text-muted-foreground font-bold">الإجراء:</p>
                          <p className="font-medium mt-0.5">{v.actionTaken}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </PageCard>

                <PageCard title="السلوك والانضباط" className="shadow-sm h-full">
                  {studentIncidents.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground font-bold h-full flex items-center justify-center border border-dashed border-border/50 rounded-2xl">سجل سلوكي ممتاز، لا يوجد مخالفات.</div>
                  ) : (
                    <div className="space-y-3">
                      {studentIncidents.map(inc => (
                        <div key={inc.id} className="p-4 rounded-2xl border border-border/50 bg-background text-sm hover:border-primary/30 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`font-bold px-2 py-0.5 rounded-lg ${(inc as any).type === 'positive' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                              {(inc as any).category}
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums bg-muted px-2 py-0.5 rounded-lg">{inc.date}</span>
                          </div>
                          <p className="text-muted-foreground font-medium leading-relaxed">{inc.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </PageCard>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: المركز المالي والأقساط */}
        {/* ========================================================================= */}
        {activeProfileTab === "finance" && (
          <div id="financial-section" className="space-y-6">
            {/* Manual Payment Action */}
            <div className="flex flex-wrap gap-3 items-center justify-between bg-primary/5 p-4 rounded-3xl border border-primary/20 shadow-sm glass">
              <div>
                <h3 className="font-bold text-primary flex items-center gap-2"><CreditCard className="h-5 w-5" /> تخصيص الدفعات والمطالبات</h3>
                <p className="text-sm text-muted-foreground mt-1">إصدار فواتير الرسوم، تخصيص الأقساط، ومتابعة المطالبات عبر واتساب.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {totalDue > 0 && (
                  <a
                    href={`https://wa.me/${(student.guardianPhone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `السلام عليكم ورحمة الله وبركاته،\n` +
                      `السيد ولي أمر الطالب/ة: ${student.name} المحترم،\n` +
                      `تحية طيبة وبعد، نود تذكيركم بأن إجمالي الرصيد المالي المتبقي للرسوم المدرسية هو: ${totalDue.toLocaleString()} ${currency}.\n` +
                      `الأقساط والرسوم المستحقة حالياً:\n` +
                      studentInvoices.filter(i => (i.amount - (i.paid || 0)) > 0).map(i => `• ${i.title}: ${(i.amount - (i.paid || 0)).toLocaleString()} ${currency}`).join("\n") +
                      `\n\nنرجو التكرم بسداد المبلغ نقداً في إدارة المدرسة أو بالتحويل عبر تطبيق بنكك إلى حساب المدرسة رقم (1234567 - بنك الخرطوم) مع تزويدنا برقم الإشعار.\nشاكرين تعاونكم الكريم.\nإدارة المدرسة`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 px-4 text-xs font-black transition-all shadow-sm active:scale-95"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>مطالبة واتساب لولي الأمر</span>
                  </a>
                )}
                <button 
                  onClick={() => setIsNewInvoiceOpen(true)}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-background border border-primary/30 px-4 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
                >
                  <Plus className="h-4 w-4" /> إصدار فاتورة / غرامة
                </button>
              </div>
            </div>

            {/* Installments & Invoices */}
            <PageCard title="الخطة المالية والأقساط" className="shadow-sm">
              {studentInvoices.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border/60 rounded-3xl p-6 space-y-3 bg-muted/10">
                  <div className="text-muted-foreground font-bold text-sm">لا توجد رسوم أو فواتير مسجلة للطالب حتى الآن.</div>
                  <button
                    onClick={handleGenerateStandardInstallments}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md transition-all active:scale-95"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>إنشاء خطة الأقساط المعتمدة (40% تسجيل، 30% نوفمبر، 30% فبراير + الكتب والزي)</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {studentInvoices.map((inv) => {
                    const balance = (inv.amount || 0) - (inv.paid || 0);
                    return (
                      <div key={inv.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border ${balance > 0 ? 'border-primary/20 bg-background/50' : 'border-success/20 bg-success/5'} hover:border-primary/50 transition-colors group gap-4 shadow-sm`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${inv.status === "paid" ? "bg-success/20 text-success" : inv.status === "partial" ? "bg-warning/20 text-warning" : "bg-primary/10 text-primary"}`}>
                            <FileText className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-bold text-base">{inv.title}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1.5 font-medium">
                              <span>الفاتورة: {inv.id}</span>
                              <span>•</span>
                              <span className="tabular-nums flex items-center gap-1"><CalendarDays className="h-3 w-3" /> الاستحقاق: {inv.dueDate}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center sm:items-end justify-between sm:flex-col gap-2 sm:gap-1 pl-2 sm:pl-0 border-t sm:border-t-0 border-border/50 pt-3 sm:pt-0">
                          <div className="text-right">
                            <p className="font-black tabular-nums text-lg">{inv.amount.toLocaleString()} {currency}</p>
                            <p className={`text-xs font-bold mt-0.5 ${inv.status === "paid" ? "text-success" : inv.status === "partial" ? "text-warning" : "text-danger"}`}>
                              {inv.status === "paid" ? "مدفوعة بالكامل" : inv.status === "partial" ? `متبقي ${balance.toLocaleString()}` : "غير مدفوعة"}
                            </p>
                          </div>
                          {balance > 0 && inv.status !== "cancelled" && (
                            <button 
                              onClick={() => {
                                setPaymentData({ ...paymentData, invoiceId: inv.id, amount: balance });
                                setIsPaymentOpen(true);
                              }}
                              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-success text-white px-5 text-sm font-bold hover:bg-success/90 transition-colors shadow-sm"
                            >
                              <CreditCard className="h-4 w-4" /> دفع
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </PageCard>

            {/* Statement of Account (Timeline) */}
            <PageCard title="كشف الحساب (الحركات المالية)" className="shadow-sm">
              {studentTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-bold border border-dashed border-border/50 rounded-2xl">لا توجد حركات مالية مسجلة للطالب.</div>
              ) : (
                <div className="p-2">
                  <FinancialTimeline transactions={studentTransactions} />
                </div>
              )}
            </PageCard>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: المقررات والكتب المدرسية */}
        {/* ========================================================================= */}
        {activeProfileTab === "books" && (
          <div className="space-y-6">
            {/* Interactive Books & Curricula Handover Section */}
            <PageCard className="shadow-sm border-border/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground">المقررات والكتب الدراسية (العهدة المدرسية)</h3>
                    <p className="text-xs text-muted-foreground">متابعة تسليم كتب صف الطالب والتكامل اللحظي مع المستودع</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProfileReceiptOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-black text-foreground hover:bg-accent transition-all shadow-sm active:scale-[0.98]"
                  >
                    <Printer className="h-3.5 w-3.5 text-primary" />
                    <span>طباعة سند العهدة</span>
                  </button>
                </div>
              </div>

              {studentTextbooks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-bold border border-dashed border-border/50 rounded-2xl my-4">
                  لا توجد مقررات دراسية مسجلة لصف الطالب.
                </div>
              ) : (
                <div className="space-y-5 pt-4">
                  {/* Progress & Stats Banner */}
                  {(() => {
                    const studentDistributions = allTextbookDistributions.filter(d => d.studentId === student.id);
                    const receivedCount = studentDistributions.filter(d => studentTextbooks.some(b => b.id === d.textbookId)).length;
                    const totalCount = studentTextbooks.length;
                    const remainingCount = Math.max(0, totalCount - receivedCount);
                    const percent = totalCount > 0 ? Math.round((receivedCount / totalCount) * 100) : 0;
                    const isComplete = remainingCount === 0;

                    const handleGiveBook = (tb: any) => {
                      distributeTextbook({
                        studentId: student.id,
                        textbookId: tb.id,
                        stage: student.stage,
                        term: tb.term || profileActiveTerm,
                        academicYearId: student.academicYearId,
                        condition: "جديد",
                        issuedBy: "أمين المستودع المدرسي",
                        receivedByGuardian: true,
                      });
                      toast.success(`تم تسليم كتاب "${tb.title}" للطالب وتحديث رصيد المستودع.`);
                    };

                    const handleReturnBook = (tb: any, distId: string) => {
                      removeDistribution(distId);
                      toast.success(`تم استرجاع كتاب "${tb.title}" وإعادته للمستودع.`);
                    };

                    const handleDeliverAll = () => {
                      const missing = studentTextbooks.filter(tb => !studentDistributions.some(d => d.textbookId === tb.id));
                      if (missing.length === 0) {
                        toast.info("جميع المقررات مستلمة بالفعل لهذا الطالب!");
                        return;
                      }
                      missing.forEach(tb => {
                        distributeTextbook({
                          studentId: student.id,
                          textbookId: tb.id,
                          stage: student.stage,
                          term: tb.term || "الفصل الأول",
                          academicYearId: student.academicYearId,
                          condition: "جديد",
                          issuedBy: "أمين المستودع المدرسي",
                          receivedByGuardian: true,
                        });
                      });
                      toast.success(`تم صرف وتسليم ${missing.length} كتب دراسية وتحديث المستودع!`);
                    };

                    const handleReturnAll = () => {
                      if (studentDistributions.length === 0) {
                        toast.info("لا توجد كتب مستلمة لإرجاعها.");
                        return;
                      }
                      if (confirm(`هل أنت متأكد من استرجاع كامل عهدة الكتب (${studentDistributions.length} كتب) للمستودع؟`)) {
                        studentDistributions.forEach(d => removeDistribution(d.id));
                        toast.success(`تم استرجاع ${studentDistributions.length} كتب وإعادتها للمستودع.`);
                      }
                    };

                    return (
                      <>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-2xl border border-border/70 bg-card/60 p-3 text-center">
                            <span className="text-xs font-bold text-muted-foreground">الكتب المقررة</span>
                            <p className="text-xl font-black mt-0.5">{totalCount}</p>
                          </div>
                          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">المستلم</span>
                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{receivedCount}</p>
                          </div>
                          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 text-center">
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">المتبقي</span>
                            <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{remainingCount}</p>
                          </div>
                        </div>

                        {/* Progress Bar & Buttons */}
                        <div className="space-y-2 bg-background/50 p-4 rounded-2xl border border-border/60">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-extrabold text-foreground">نسبة استلام العهدة المدرسية</span>
                            <span className={`font-black ${isComplete ? 'text-emerald-600' : 'text-primary'}`}>{percent}%</span>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-muted/60 overflow-hidden border border-border/40">
                            <div
                              className={`h-full transition-all duration-300 ${isComplete ? 'bg-emerald-500' : 'bg-primary'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            {!isComplete && (
                              <button
                                type="button"
                                onClick={handleDeliverAll}
                                className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-black text-primary-foreground hover:opacity-95 shadow-sm active:scale-[0.98]"
                              >
                                تسليم كافة المتبقي فوراً
                              </button>
                            )}
                            {receivedCount > 0 && (
                              <button
                                type="button"
                                onClick={handleReturnAll}
                                className="rounded-xl border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-500/10 transition-colors active:scale-[0.98]"
                              >
                                إرجاع الكل إلى المستودع
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Term Switcher */}
                        <div className="flex items-center gap-1.5 border-b border-border/60 pb-2">
                          {["الفصل الأول", "الفصل الثاني", "الفصل الثالث", "all"].map((term) => (
                            <button
                              key={term}
                              type="button"
                              onClick={() => setProfileActiveTerm(term)}
                              className={`rounded-xl px-3.5 py-1 text-xs font-black transition-all ${
                                profileActiveTerm === term
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                              }`}
                            >
                              {term === "all" ? "جميع الفصول" : term}
                            </button>
                          ))}
                        </div>

                        {/* Books Grid */}
                        <div className="grid sm:grid-cols-2 gap-3">
                          {studentTextbooks
                            .filter(tb => profileActiveTerm === "all" ? true : (!tb.term || tb.term === profileActiveTerm || tb.term === "all"))
                            .map((tb) => {
                              const distribution = studentDistributions.find(d => d.textbookId === tb.id);
                              const isReceived = !!distribution;

                              const invItem = allInventoryItems.find(
                                i => (tb.inventoryItemId && i.id === tb.inventoryItemId) || i.name.includes(tb.title)
                              );
                              const availableStock = invItem ? invItem.quantity : tb.copies;

                              return (
                                <div
                                  key={tb.id}
                                  className={`flex flex-col justify-between p-3.5 rounded-2xl border transition-all ${
                                    isReceived
                                      ? "border-emerald-500/30 bg-emerald-500/5"
                                      : "border-border/60 bg-background/60 hover:border-primary/40"
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`p-2.5 rounded-xl shrink-0 ${
                                        isReceived
                                          ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20"
                                          : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      {isReceived ? <ShieldCheck className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                      <div className="flex items-center justify-between">
                                        <p className="font-black text-sm text-foreground">{tb.title}</p>
                                        <span
                                          className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                            isReceived
                                              ? "bg-emerald-500/15 text-emerald-600"
                                              : "bg-muted text-muted-foreground"
                                          }`}
                                        >
                                          {isReceived ? "مستلم" : "غير مستلم"}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground">
                                        {tb.subject} • {tb.term || "الفصل الأول"} {tb.edition ? `• طبعة ${tb.edition}` : ""}
                                      </p>
                                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-0.5">
                                        <span>رصيد المستودع:</span>
                                        <strong className={availableStock > 10 ? "text-emerald-600" : "text-amber-600"}>
                                          {availableStock} نسخة
                                        </strong>
                                        {isReceived && (
                                          <>
                                            <span>•</span>
                                            <span className="text-emerald-600 font-bold">بتاريخ {distribution.date}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-3 pt-2.5 border-t border-border/40 flex justify-end gap-2">
                                    {isReceived ? (
                                      <button
                                        type="button"
                                        onClick={() => handleReturnBook(tb, distribution.id)}
                                        className="rounded-xl border border-rose-500/30 px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-500/10 transition-colors active:scale-[0.98]"
                                      >
                                        إرجاع للمستودع
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleGiveBook(tb)}
                                        disabled={availableStock <= 0}
                                        className={`rounded-xl px-3.5 py-1 text-xs font-black transition-all ${
                                          availableStock > 0
                                            ? "bg-primary text-primary-foreground hover:opacity-95 shadow-sm active:scale-[0.98]"
                                            : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                        }`}
                                      >
                                        {availableStock > 0 ? "تسليم الطالب" : "غير متوفر بالمستودع"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </PageCard>
          </div>
        )}
      </div>

      {/* New Invoice Modal */}
      {isNewInvoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury">
          <div className="w-full max-w-md modal-card-luxury overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-primary/5">
              <h2 className="text-lg font-black flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                إصدار فاتورة جديدة للطالب
              </h2>
              <button onClick={() => setIsNewInvoiceOpen(false)} className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              addInvoice({
                studentId: student.id,
                studentName: student.name,
                title: newInvoiceData.title,
                amount: newInvoiceData.amount,
                netAmount: newInvoiceData.amount,
                dueDate: newInvoiceData.dueDate,
                issueDate: new Date().toISOString().split('T')[0],
                stage: student.stage
              });
              toast.success("تم إصدار الفاتورة بنجاح");
              setIsNewInvoiceOpen(false);
              setNewInvoiceData({ title: "", amount: 0, dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0] });
            }} className="p-6 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-extrabold text-foreground">البيان (نوع الرسوم) <span className="text-danger">*</span></label>
                <input required type="text" value={newInvoiceData.title} onChange={e => setNewInvoiceData({...newInvoiceData, title: e.target.value})} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50" placeholder="مثال: رسوم الفصل الثاني" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-extrabold text-foreground">المبلغ ({currency}) <span className="text-danger">*</span></label>
                <input required type="number" min="1" value={newInvoiceData.amount || ""} onChange={e => setNewInvoiceData({...newInvoiceData, amount: Number(e.target.value)})} className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-extrabold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50 tabular-nums" />
              </div>
              <div>
                <ArabicDatePicker
                  label="تاريخ الاستحقاق"
                  required
                  value={newInvoiceData.dueDate}
                  onChange={(val) => setNewInvoiceData({ ...newInvoiceData, dueDate: val })}
                  showAgeCalculator={false}
                />
              </div>
              <div className="pt-3 flex gap-3 justify-end items-center border-t border-border/50">
                <button type="button" onClick={() => setIsNewInvoiceOpen(false)} className="rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-accent transition-colors border border-border/80 active:scale-[0.98]">إلغاء</button>
                <button type="submit" className="rounded-xl bg-primary px-7 py-2.5 text-sm font-extrabold text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-[0.98]">إصدار الفاتورة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Make Payment Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury">
          <div className="w-full max-w-md modal-card-luxury overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-success/10">
              <h2 className="text-lg font-black flex items-center gap-2.5 text-success">
                <div className="h-8 w-8 rounded-xl bg-success/15 text-success flex items-center justify-center">
                  <CreditCard className="h-4 w-4" />
                </div>
                تسجيل دفعة وسند قبض جديد
              </h2>
              <button onClick={() => setIsPaymentOpen(false)} className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (paymentData.method === "bankak" && !paymentData.bankakRef) {
                toast.error("الرجاء إدخال رقم إشعار بنكك");
                return;
              }
              addPayment({ 
                invoiceId: paymentData.invoiceId, 
                amount: paymentData.amount, 
                method: (paymentData.method === "bankak" ? "bank_transfer" : paymentData.method) as any, 
                date: new Date().toISOString(),
                ...(paymentData.bankakRef ? { referenceNo: paymentData.bankakRef, notes: `تحويل بنكك - رقم الإشعار: ${paymentData.bankakRef}` } : {})
              } as any);
              toast.success("تم تسجيل الدفعة بنجاح");
              setIsPaymentOpen(false);
            }} className="p-6 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-extrabold text-foreground">المبلغ المحصل ({currency}) <span className="text-danger">*</span></label>
                <input required type="number" min="1" value={paymentData.amount || ""} onChange={e => setPaymentData({...paymentData, amount: Number(e.target.value)})} className="h-12 w-full rounded-xl border border-success/40 bg-background/80 px-4 focus:border-success focus:outline-none focus:ring-4 focus:ring-success/15 transition-all tabular-nums font-black text-xl text-success shadow-sm" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-extrabold text-foreground">طريقة الدفع</label>
                <div className="grid grid-cols-5 gap-2">
                  {([
                    { id: "cash", label: "نقدي", icon: "💵" },
                    { id: "bankak", label: "بنكك", icon: "📱" },
                    { id: "card", label: "مدى/بطاقة", icon: "💳" },
                    { id: "bank_transfer", label: "حوالة بنكية", icon: "🏦" },
                    { id: "cheque", label: "شيك", icon: "📄" },
                  ] as const).map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentData({...paymentData, method: m.id as any})}
                      className={`p-2 rounded-xl border text-center font-black transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        paymentData.method === m.id
                          ? "border-success bg-success/10 text-success shadow-xs"
                          : "border-border/70 bg-card hover:bg-muted text-foreground"
                      }`}
                    >
                      <span className="text-base">{m.icon}</span>
                      <span className="text-[9px]">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Bankak Reference - shown only for Bankak method */}
              {paymentData.method === "bankak" && (
                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <label className="block text-xs font-extrabold text-emerald-700 dark:text-emerald-400 mb-1">رقم إشعار بنكك (Bankak Ref) *</label>
                  <input
                    type="text"
                    value={paymentData.bankakRef}
                    onChange={e => setPaymentData({...paymentData, bankakRef: e.target.value})}
                    placeholder="مثال: BNK-2024-XXXXX"
                    className="h-11 w-full rounded-xl border border-emerald-500/30 bg-background/80 px-4 text-sm font-black focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 transition-all tabular-nums"
                    dir="ltr"
                    required
                  />
                </div>
              )}
              {/* WhatsApp Reminder to Guardian */}
              {student && (
                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
                  <a
                    href={`https://wa.me/${(student.guardianPhone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `السلام عليكم ورحمة الله وبركاته\n` +
                      `ولي أمر الطالب/ة: ${student.name}\n` +
                      `نفيدكم بتأكيد استلام دفعة مالية بمبلغ: ${paymentData.amount.toLocaleString()} ${currency}\n` +
                      `طريقة الدفع: ${paymentData.method === "bankak" ? "تحويل بنكك" : paymentData.method === "cash" ? "نقدي" : "تحويل بنكي"}\n` +
                      `${paymentData.bankakRef ? `رقم الإشعار: ${paymentData.bankakRef}\n` : ""}` +
                      `جزاكم الله خيراً - إدارة المدرسة`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <span className="text-base">💬</span>
                    إرسال إيصال الدفعة عبر واتساب لولي الأمر ({student.guardianName})
                  </a>
                </div>
              )}
              <div className="pt-3 flex gap-3 justify-end items-center border-t border-border/50">
                <button type="button" onClick={() => setIsPaymentOpen(false)} className="rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-accent transition-colors border border-border/80 active:scale-[0.98]">إلغاء</button>
                <button type="submit" className="rounded-xl bg-success px-7 py-2.5 text-sm font-extrabold text-white hover:bg-success/90 transition-all shadow-md active:scale-[0.98]">حفظ الدفعة</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Transport Subscription Modal */}
      {isTransportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury">
          <div className="w-full max-w-lg modal-card-luxury overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-primary/10">
              <h2 className="text-lg font-black flex items-center gap-2.5 text-primary">
                <div className="h-8 w-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                  <Bus className="h-4 w-4" />
                </div>
                {studentSubscription ? "تعديل اشتراك الترحيل والمسار" : "إضافة الطالب لخط ترحيل جديد"}
              </h2>
              <button onClick={() => setIsTransportModalOpen(false)} className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransport} className="p-6 space-y-5 overflow-y-auto custom-scrollbar-modal">
              <div>
                <label className="mb-2 block text-xs font-extrabold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> اختر خط الترحيل / النقل <span className="text-danger">*</span>
                </label>
                <select
                  value={transportForm.routeId}
                  onChange={(e) => setTransportForm({ ...transportForm, routeId: e.target.value })}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-bold shadow-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 hover:border-primary/50 transition-all cursor-pointer"
                  required
                >
                  <option value="">-- اختر المسار / الخط المخصص --</option>
                  {transportRoutes.map((route: any) => (
                    <option key={route.id} value={route.id}>
                      📌 {route.name} ({route.feeAmount.toLocaleString()} {currency}) {route.driverName ? `- السائق: ${route.driverName}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trip Direction Selection Cards */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-foreground">نوع الترحيل والاتجاه</label>

                <div className="grid grid-cols-3 gap-2.5">
                  <div
                    onClick={() => setTransportForm({ ...transportForm, direction: "round-trip" })}
                    className={`cursor-pointer p-3 rounded-2xl border-2 transition-all text-center space-y-1 active:scale-[0.98] ${
                      transportForm.direction === "round-trip"
                        ? "border-primary bg-primary/10 ring-4 ring-primary/15 shadow-sm"
                        : "border-border/60 bg-card hover:border-primary/40 hover:bg-accent/30"
                    }`}
                  >
                    <RefreshCw className="h-4 w-4 mx-auto text-primary" />
                    <div className="font-extrabold text-xs">ذهاب وعودة</div>
                    <span className="text-[10px] font-bold text-primary block">100% الرسوم</span>
                  </div>

                  <div
                    onClick={() => setTransportForm({ ...transportForm, direction: "going" })}
                    className={`cursor-pointer p-3 rounded-2xl border-2 transition-all text-center space-y-1 active:scale-[0.98] ${
                      transportForm.direction === "going"
                        ? "border-amber-500 bg-amber-500/10 ring-4 ring-amber-500/15 shadow-sm"
                        : "border-border/60 bg-card hover:border-primary/40 hover:bg-accent/30"
                    }`}
                  >
                    <Sun className="h-4 w-4 mx-auto text-amber-600" />
                    <div className="font-extrabold text-xs">ذهاب فقط</div>
                    <span className="text-[10px] font-bold text-amber-600 block">60% الرسوم</span>
                  </div>

                  <div
                    onClick={() => setTransportForm({ ...transportForm, direction: "returning" })}
                    className={`cursor-pointer p-3 rounded-2xl border-2 transition-all text-center space-y-1 active:scale-[0.98] ${
                      transportForm.direction === "returning"
                        ? "border-indigo-500 bg-indigo-500/10 ring-4 ring-indigo-500/15 shadow-sm"
                        : "border-border/60 bg-card hover:border-primary/40 hover:bg-accent/30"
                    }`}
                  >
                    <Sunset className="h-4 w-4 mx-auto text-indigo-600" />
                    <div className="font-extrabold text-xs">عودة فقط</div>
                    <span className="text-[10px] font-bold text-indigo-600 block">60% الرسوم</span>
                  </div>
                </div>
              </div>

              {/* Calculated fee preview */}
              {transportForm.routeId && (() => {
                const selRoute = transportRoutes.find(r => r.id === transportForm.routeId);
                const feeVal = selRoute ? (transportForm.direction === 'round-trip' ? selRoute.feeAmount : Math.round(selRoute.feeAmount * 0.6)) : 0;
                return (
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 space-y-1.5 animate-in fade-in">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-xs text-primary block">الرسوم المحسوبة المعدلة:</span>
                        <span className="text-[11px] text-muted-foreground font-medium">الخط: {selRoute?.name}</span>
                      </div>
                      <span className="text-2xl font-black text-primary tabular-nums">{feeVal.toLocaleString()} {currency}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium pt-1.5 border-t border-primary/10">
                      سيتم تعديل الذمة المالية والتحديث التلقائي لفاتورة الترحيل في الدفتر العام للحساب.
                    </p>
                  </div>
                );
              })()}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-extrabold hover:bg-primary/90 transition-all shadow-md text-sm active:scale-[0.98]"
                >
                  {studentSubscription ? "حفظ وتحديث الاشتراك" : "تأكيد الاشتراك وتوليد الفاتورة"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsTransportModalOpen(false)}
                  className="bg-muted text-muted-foreground px-5 py-3 rounded-xl font-bold hover:bg-muted/80 transition-colors text-sm active:scale-[0.98]"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Textbook Handover Voucher Modal */}
      {isProfileReceiptOpen && student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Printer className="h-4 w-4 text-primary" />
                معاينة وطباعة سند استلام عهدة المقررات المدرسية
              </h3>
              <button
                type="button"
                onClick={() => setIsProfileReceiptOpen(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 bg-white text-slate-900 dark:bg-card dark:text-foreground">
              <div className="border-b-2 border-slate-800 dark:border-border pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black tracking-tight">مدارس المنهاج الأهلية النموذجية</h2>
                  <p className="text-xs text-slate-500 dark:text-muted-foreground font-bold">
                    قسم المستودع والوسائل التعليمية • العام الدراسي 2026/2027
                  </p>
                </div>
                <div className="text-left text-xs font-bold text-slate-600 dark:text-muted-foreground">
                  <div>التاريخ: {new Date().toLocaleDateString("ar-SA")}</div>
                  <div>الرقم المرجعي: BK-{student.id}-{Date.now().toString().slice(-4)}</div>
                </div>
              </div>

              <div className="text-center py-2">
                <h3 className="text-base font-black underline underline-offset-8">
                  سند تسليم عهدة الكتب والمقررات المدرسية
                </h3>
              </div>

              <div className="rounded-xl border border-slate-300 dark:border-border p-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-500 dark:text-muted-foreground">اسم الطالب: </span>
                  <span className="font-black">{student.name}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 dark:text-muted-foreground">رقم الهوية: </span>
                  <span className="font-black tabular-nums">{student.nationalId || student.id}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 dark:text-muted-foreground">الصف الدراسي: </span>
                  <span className="font-black">{student.grade}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 dark:text-muted-foreground">ولي الأمر: </span>
                  <span className="font-black">{student.guardianName || "-"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-black">المقررات والكتب المسلمة في هذه العهدة:</h4>
                <table className="w-full text-xs border border-slate-300 dark:border-border text-center">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-muted font-black border-b border-slate-300 dark:border-border">
                      <th className="p-2 border-r border-slate-300 dark:border-border">م</th>
                      <th className="p-2 border-r border-slate-300 dark:border-border text-right">عنوان المقرر الدراسي</th>
                      <th className="p-2 border-r border-slate-300 dark:border-border">الفصل</th>
                      <th className="p-2 border-r border-slate-300 dark:border-border">الحالة</th>
                      <th className="p-2">تاريخ الصرف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTextbookDistributions
                      .filter(d => d.studentId === student.id)
                      .map((dist, idx) => {
                        const tb = allTextbooks.find(t => t.id === dist.textbookId);
                        return (
                          <tr key={dist.id} className="border-b border-slate-200 dark:border-border/50">
                            <td className="p-2 border-r border-slate-200 dark:border-border/50 font-bold">{idx + 1}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-border/50 text-right font-black">
                              {tb?.title || "كتاب دراسي"} {tb?.edition ? `(${tb.edition})` : ""}
                            </td>
                            <td className="p-2 border-r border-slate-200 dark:border-border/50">{dist.term || tb?.term || "الفصل 1"}</td>
                            <td className="p-2 border-r border-slate-200 dark:border-border/50 font-bold text-emerald-600">جديد</td>
                            <td className="p-2 font-bold tabular-nums">{dist.date}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-muted/30 p-3 text-[11px] text-slate-600 dark:text-muted-foreground leading-relaxed border border-slate-200 dark:border-border/60">
                <p className="font-bold">إقرار واستلام العهدة:</p>
                <p>
                  أقر أنا ولي أمر الطالب الموضح أعلاه بأنني استلمت كامل الكتب المدرسية المبينة بالجدول في حالة سليمة وجديدة، وأتعهد بالمحافظة عليها ومتابعة الطالب دراسياً وفق التعليمات المعتمدة.
                </p>
              </div>

              <div className="pt-6 grid grid-cols-3 gap-6 text-center text-xs font-black">
                <div>
                  <p className="mb-8">توقيع ولي الأمر</p>
                  <p className="border-t border-slate-400 dark:border-border pt-1 text-[11px] text-slate-500">.......................</p>
                </div>
                <div>
                  <p className="mb-8">أمين المستودع المدرسي</p>
                  <p className="border-t border-slate-400 dark:border-border pt-1 text-[11px] text-slate-500">أ. أمين المستودع</p>
                </div>
                <div>
                  <p className="mb-8">ختم إدارة المدرسة</p>
                  <p className="border-t border-slate-400 dark:border-border pt-1 text-[11px] text-slate-500">.......................</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border/50 flex justify-end gap-2.5 bg-muted/10 shrink-0">
              <button
                type="button"
                onClick={() => setIsProfileReceiptOpen(false)}
                className="rounded-xl border border-border/80 px-4 py-2 text-xs font-bold hover:bg-muted"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl bg-primary px-5 py-2 text-xs font-black text-primary-foreground shadow-md shadow-primary/20 hover:opacity-95 flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>طباعة السند</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <EditStudentModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} student={student} />
      
      {/* Quick Edit Mark Modal */}
      {quickEditMarkModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury">
          <div className="w-full max-w-md modal-card-luxury overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border/50 bg-muted/20">
              <h3 className="text-base font-black flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-primary" />
                <span>تعديل درجة: {quickEditMarkModal.subjectName}</span>
              </h3>
              <button 
                type="button"
                onClick={() => setQuickEditMarkModal(prev => ({ ...prev, isOpen: false }))} 
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const targetEnrollmentId = studentEnrollmentObj?.id || student.id;
              updateSingleExamResult(quickEditMarkModal.examSubjectId, targetEnrollmentId, {
                mark: quickEditMarkModal.currentMark
              });
              toast.success(`تم تحديث درجة ${quickEditMarkModal.subjectName} بنجاح`);
              setQuickEditMarkModal(prev => ({ ...prev, isOpen: false }));
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">الدرجة المرصودة (من {quickEditMarkModal.maxScore})</label>
                <input 
                  type="number" 
                  min={0} 
                  max={quickEditMarkModal.maxScore}
                  value={quickEditMarkModal.currentMark}
                  onChange={(e) => setQuickEditMarkModal(prev => ({ ...prev, currentMark: Number(e.target.value) }))}
                  className="w-full h-11 px-4 rounded-xl border border-border/80 bg-background font-black text-lg tabular-nums focus:border-primary focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="p-3 bg-muted/30 rounded-xl text-xs text-muted-foreground">
                سيتم حفظ التعديل اللحظي في قاعدة درجات الاختبارات وتحديث التقديرات والنسبة المئوية مباشرة.
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setQuickEditMarkModal(prev => ({ ...prev, isOpen: false }))} 
                  className="rounded-xl border border-border/80 px-4 py-2 text-xs font-bold hover:bg-muted"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-black text-primary-foreground shadow-md shadow-primary/20 hover:opacity-95"
                >
                  حفظ الدرجة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Academic Transcript Printing Engine Modal */}
      <AdvancedPrintEngine 
        isOpen={isTranscriptPrintOpen} 
        onClose={() => setIsTranscriptPrintOpen(false)} 
        title={`السيرة الدراسية المعتمدة: ${student.name}`}
        data={studentExamMarks}
        templates={[officialTranscriptTemplate]}
      />

      {/* Official Certificate Printing Engine Modal */}
      <AdvancedPrintEngine 
        isOpen={isCertificatePrintOpen} 
        onClose={() => setIsCertificatePrintOpen(false)} 
        title={`الشهادة الرسمية: ${student.name}`}
        data={studentExamMarks}
        templates={[officialCertificateTemplate]}
      />

      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title={`سجل الطالب: ${student.name}`}
        data={studentInvoices} // Only used if table template is selected (like financial_statement)
        templates={printTemplates}
      />

      {/* Comprehensive Academic Career Modal (Popup Dialog) */}
      <AcademicCareerModal
        isOpen={isAcademicCareerModalOpen}
        onClose={() => setIsAcademicCareerModalOpen(false)}
        studentId={student.id}
      />
    </AppShell>
  );
}
