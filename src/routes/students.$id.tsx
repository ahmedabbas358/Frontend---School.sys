import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore, Student } from "@/contexts/GlobalStoreContext";
import { EducationalStage, STAGE_LIST } from "@/contexts/StageContext";
import { getGradesForStage } from "@/lib/school-structure";
import { CalendarDays, GraduationCap, Phone, User, HeartPulse, MapPin, ShieldCheck, Printer, LayoutGrid, AlertCircle, FileText, Download, X, Settings, Plus, CreditCard, BookOpen, Bus } from "lucide-react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-muted/30">
          <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> تعديل بيانات الطالب</h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form id="edit-student-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2 border-b border-border pb-2 mb-2"><h3 className="font-bold text-primary">البيانات الأساسية</h3></div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">اسم الطالب</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">رقم الهوية</label>
                <input required value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors tabular-nums" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">تاريخ الميلاد</label>
                <input type="date" value={(formData as any).dob || ""} onChange={e => setFormData({...formData, dob: e.target.value} as any)} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors tabular-nums" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">الجنس</label>
                <select value={(formData as any).gender || "ذكر"} onChange={e => setFormData({...formData, gender: e.target.value} as any)} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold">
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </div>

              <div className="md:col-span-2 border-b border-border pb-2 mb-2 mt-4"><h3 className="font-bold text-primary">بيانات التواصل وولي الأمر</h3></div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">اسم ولي الأمر</label>
                <input value={formData.guardianName} onChange={e => setFormData({...formData, guardianName: e.target.value})} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">صلة القرابة</label>
                <input value={(formData as any).guardianRelation || ""} onChange={e => setFormData({...formData, guardianRelation: e.target.value} as any)} placeholder="أب، أم، أخ..." className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">رقم الجوال الطوارئ</label>
                <input value={formData.guardianPhone} onChange={e => setFormData({...formData, guardianPhone: e.target.value})} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors tabular-nums" dir="ltr" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">العنوان الوطني</label>
                <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
              </div>

              {student.stage === "kindergarten" && (
                <>
                  <div className="md:col-span-2 border-b border-border pb-2 mb-2 mt-4"><h3 className="font-bold text-primary">البيانات الخاصة (رياض الأطفال)</h3></div>
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-bold text-muted-foreground">الأشخاص المخولون بالاستلام</label>
                    <input value={(formData as any).pickupPersons || ""} onChange={e => setFormData({...formData, pickupPersons: e.target.value} as any)} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold" />
                  </div>
                </>
              )}

              {student.stage === "high" && (
                <>
                  <div className="md:col-span-2 border-b border-border pb-2 mb-2 mt-4"><h3 className="font-bold text-primary">البيانات الأكاديمية (الثانوي)</h3></div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-muted-foreground">المسار الأكاديمي</label>
                    <select value={(formData as any).major || "science"} onChange={e => setFormData({...formData, major: e.target.value} as any)} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold">
                      <option value="science">علمي</option>
                      <option value="literature">أدبي (إنساني)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-muted-foreground">التخصص الدقيق</label>
                    <input value={(formData as any).elective || ""} onChange={e => setFormData({...formData, elective: e.target.value} as any)} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold" />
                  </div>
                </>
              )}

              <div className="md:col-span-2 border-b border-border pb-2 mb-2 mt-4"><h3 className="font-bold text-primary">البيانات الطبية</h3></div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">فصيلة الدم</label>
                <select value={(formData as any).bloodType || ""} onChange={e => setFormData({...formData, bloodType: e.target.value} as any)} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold tabular-nums" dir="ltr">
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
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">ملاحظات طبية / أمراض مزمنة / حساسية</label>
                <textarea value={formData.medicalNotes} onChange={e => setFormData({...formData, medicalNotes: e.target.value})} rows={3} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none font-bold"></textarea>
              </div>

              <div className="md:col-span-2 border-b border-border pb-2 mb-2 mt-4"><h3 className="font-bold text-primary">الإدارة الأكاديمية</h3></div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">المرحلة</label>
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
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold"
                >
                  {STAGE_LIST.map(stage => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">الفصل</label>
                <select
                  value={formData.grade}
                  required
                  onChange={e => setFormData({ ...formData, grade: e.target.value, sectionId: undefined })}
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold"
                >
                  <option value="">اختر الفصل</option>
                  {availableGrades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">الشعبة</label>
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
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold disabled:opacity-50"
                >
                  <option value="">بدون شعبة</option>
                  {availableSections.map(section => <option key={section.id} value={section.id}>شعبة {section.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">تاريخ الالتحاق</label>
                <input type="date" value={(formData as any).enrollmentDate || ""} onChange={e => setFormData({...formData, enrollmentDate: e.target.value} as any)} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors tabular-nums" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">الحالة</label>
                <select value={(formData as any).status || "نشط"} onChange={e => setFormData({...formData, status: e.target.value} as any)} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold">
                  <option value="نشط">نشط</option>
                  <option value="موقوف">موقوف</option>
                  <option value="منقول">منقول</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-border/50 bg-muted/10 flex gap-3 justify-end">
          <button onClick={onClose} className="rounded-xl px-6 py-2.5 font-bold hover:bg-accent transition-colors border border-border">إلغاء</button>
          <button form="edit-student-form" type="submit" className="rounded-xl bg-primary px-8 py-2.5 font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-md">حفظ التغييرات</button>
        </div>
      </div>
    </div>
  );
}

// --- Advanced Print Preview Engine has been moved to src/components/print-engine.tsx ---

function StudentProfile() {
  const { id } = Route.useParams();
  const { currency, allStudents, allInvoices, allClinicVisits, allDisciplineIncidents, allSections, activeStageFeeStructures, addInvoice, addPayment, allTextbooks, allTextbookDistributions, transportSubscriptions, transportRoutes  } = useGlobalStore();
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  
  const [newInvoiceData, setNewInvoiceData] = useState({
    title: "",
    amount: 0,
    dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });

  const [paymentData, setPaymentData] = useState({
    invoiceId: "",
    amount: 0,
    method: "cash" as "cash" | "bank_transfer" | "card" | "cheque"
  });

  const student = useMemo(() => allStudents.find((s) => s.id === id), [id, allStudents]);

  const studentSubscription = useMemo(() => student ? transportSubscriptions.find((s: any) => s.studentId === student.id) : null, [student, transportSubscriptions]);
  const studentRoute = useMemo(() => studentSubscription ? transportRoutes.find((r: any) => r.id === studentSubscription.routeId) : null, [studentSubscription, transportRoutes]);

  const studentTextbooks = useMemo(() => {
    return student ? allTextbooks.filter(tb => tb.gradeId === student.grade) : [];
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
  const studentInvoices = allInvoices.filter((i) => i.studentId === student.id);
  const totalPaid = studentInvoices.reduce((acc, curr) => acc + (curr.paid || 0), 0);
  const totalDue = studentInvoices.reduce((acc, curr) => acc + ((curr.amount || 0) - (curr.paid || 0)), 0);
  
  const studentVisits = allClinicVisits.filter(v => v.studentId === student.id);
  const studentIncidents = allDisciplineIncidents.filter(i => i.studentId === student.id);
  const studentSection = allSections.find(sec => sec.id === student.sectionId);
  const initials = student.name ? student.name.split(" ").map(n=>n[0]).slice(0,2).join("") : "ط";

  // Define templates for the specific student
  const printTemplates: PrintTemplate[] = useMemo(() => {
    return [
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
                <p className="text-3xl font-black text-gray-800 tabular-nums">{studentIncidents.filter(i => i.type === 'negative').length}</p>
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
                         <td className="border p-2">{inc.category}</td>
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
                {studentIncidents.filter(i => i.type === 'negative')[0]?.description || "...................................................................................."}
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
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-card border border-border/50 px-4 text-sm font-bold hover:bg-accent transition-colors shadow-sm"
          >
            <Settings className="h-4 w-4" /> تعديل الملف
          </button>
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4" /> مركز الطباعة والتصدير
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
            <PageCard title="النقل المدرسي" className="shadow-sm">
              {studentSubscription && studentRoute ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-primary/5 p-3 rounded-xl border border-primary/20">
                    <span className="text-sm text-primary font-bold flex items-center gap-2"><Bus className="h-4 w-4" /> المسار:</span>
                    <span className="font-bold">{studentRoute.name}</span>
                  </div>
                  <div className="flex justify-between items-center bg-background/50 p-3 rounded-xl border border-border/50">
                    <span className="text-sm text-muted-foreground font-bold">نوع الاشتراك:</span>
                    <span className="font-bold">{studentSubscription.direction === 'round-trip' ? 'ذهاب وعودة' : studentSubscription.direction === 'going' ? 'ذهاب فقط' : 'عودة فقط'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-background/50 p-3 rounded-xl border border-border/50">
                    <span className="text-sm text-muted-foreground font-bold">الرسوم السنوية:</span>
                    <span className="font-bold">{studentSubscription.direction === 'round-trip' ? studentRoute.feeAmount : studentRoute.feeAmount * 0.6} {currency}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Bus className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-bold">غير مشترك في النقل المدرسي</p>
                </div>
              )}
            </PageCard>
          </div>

          {/* Right Column: Activity & Financial */}
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
                  <p className="font-black text-xl tabular-nums text-danger">{totalDue.toLocaleString("ar-SA")} {currency}</p>
                </div>
              </div>
            </div>

            {/* Sub-tabs/Sections */}
            <div id="financial-section">
              <PageCard 
                title="السجل المالي (الفواتير)" 
                className="shadow-sm"
              actions={
                <button 
                  onClick={() => setIsNewInvoiceOpen(true)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-3 w-3" /> إصدار فاتورة
                </button>
              }
            >
              {studentInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-bold border border-dashed border-border/50 rounded-2xl">لا توجد فواتير مسجلة للطالب.</div>
              ) : (
                <div className="space-y-3">
                  {studentInvoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-background hover:border-primary/30 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-10 rounded-full ${inv.status === "paid" ? "bg-success" : inv.status === "partial" ? "bg-warning" : "bg-danger"}`}></div>
                        <div>
                          <p className="font-bold text-sm">فاتورة مستحقات دراسية ({inv.id})</p>
                          <p className="text-xs text-muted-foreground mt-1 tabular-nums">تاريخ الاستحقاق: {inv.dueDate}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div>
                          <p className="font-black tabular-nums">{inv.amount.toLocaleString()} {currency}</p>
                          <p className={`text-xs font-bold mt-1 ${inv.status === "paid" ? "text-success" : inv.status === "partial" ? "text-warning" : "text-danger"}`}>
                            {inv.status === "paid" ? "مدفوعة بالكامل" : inv.status === "partial" ? `مدفوعة جزئياً (متبقي ${(inv.amount - inv.paid).toLocaleString()})` : "غير مدفوعة"}
                          </p>
                        </div>
                        {inv.status !== "paid" && inv.status !== "cancelled" && (
                          <button 
                            onClick={() => {
                              setPaymentData({ ...paymentData, invoiceId: inv.id, amount: inv.amount - inv.paid });
                              setIsPaymentOpen(true);
                            }}
                            className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-success/10 text-success px-3 text-xs font-bold hover:bg-success/20 transition-colors"
                          >
                            <CreditCard className="h-3 w-3" /> سداد دفعة
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PageCard>
            </div>

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
                    {studentIncidents.map(i => (
                      <div key={i.id} className="p-4 rounded-2xl border border-border/50 bg-background text-sm hover:border-primary/30 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`font-bold px-2 py-0.5 rounded-lg ${i.type === 'positive' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                            {i.category}
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums bg-muted px-2 py-0.5 rounded-lg">{i.date}</span>
                        </div>
                        <p className="text-muted-foreground font-medium leading-relaxed">{i.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </PageCard>
            </div>

            {/* Books Section */}
            <PageCard title="المقررات الدراسية المستلمة" className="shadow-sm">
              {studentTextbooks.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground font-bold border border-dashed border-border/50 rounded-2xl">لا توجد مقررات دراسية مسجلة لصف الطالب.</div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedTextbooks).sort(([a], [b]) => a.localeCompare(b)).map(([term, books]) => (
                    <div key={term} className="space-y-3">
                      <h4 className="font-bold text-primary border-b border-border/50 pb-2">{term}</h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {books.map(tb => {
                          const isReceived = allTextbookDistributions.some(d => d.studentId === student.id && d.textbookId === tb.id);
                          return (
                            <div key={tb.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isReceived ? 'border-success/30 bg-success/5' : 'border-border/50 bg-background'} transition-colors`}>
                              <div className={`p-2 rounded-lg ${isReceived ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                                {isReceived ? <ShieldCheck className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                              </div>
                              <div>
                                <p className="font-bold text-sm leading-tight">{tb.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{tb.subject}</p>
                              </div>
                              {isReceived ? (
                                <span className="mr-auto text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-full">مستلم</span>
                              ) : (
                                <span className="mr-auto text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full">غير مستلم</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PageCard>

          </div>
        </div>
      </div>

      {/* New Invoice Modal */}
      {isNewInvoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-primary/5">
              <h2 className="text-xl font-bold flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> إصدار فاتورة جديدة للطالب</h2>
              <button onClick={() => setIsNewInvoiceOpen(false)} className="p-2 hover:bg-accent rounded-full transition-colors"><X className="h-5 w-5" /></button>
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
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">البيان (نوع الرسوم)</label>
                <input required type="text" value={newInvoiceData.title} onChange={e => setNewInvoiceData({...newInvoiceData, title: e.target.value})} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">المبلغ (ر.س)</label>
                <input required type="number" min="1" value={newInvoiceData.amount || ""} onChange={e => setNewInvoiceData({...newInvoiceData, amount: Number(e.target.value)})} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors tabular-nums font-bold" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">تاريخ الاستحقاق</label>
                <input required type="date" value={newInvoiceData.dueDate} onChange={e => setNewInvoiceData({...newInvoiceData, dueDate: e.target.value})} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors tabular-nums" />
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsNewInvoiceOpen(false)} className="rounded-xl px-6 py-2.5 font-bold hover:bg-accent transition-colors border border-border">إلغاء</button>
                <button type="submit" className="rounded-xl bg-primary px-8 py-2.5 font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-md">إصدار الفاتورة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Make Payment Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-success/5">
              <h2 className="text-xl font-bold flex items-center gap-2 text-success"><CreditCard className="h-5 w-5" /> تسجيل دفعة جديدة</h2>
              <button onClick={() => setIsPaymentOpen(false)} className="p-2 hover:bg-accent rounded-full transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              addPayment(paymentData.invoiceId, paymentData.amount, paymentData.method);
              toast.success("تم تسجيل الدفعة بنجاح");
              setIsPaymentOpen(false);
            }} className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">المبلغ المحصل (ر.س)</label>
                <input required type="number" min="1" value={paymentData.amount || ""} onChange={e => setPaymentData({...paymentData, amount: Number(e.target.value)})} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-success focus:outline-none focus:ring-1 focus:ring-success transition-colors tabular-nums font-black text-xl text-success" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">طريقة الدفع</label>
                <select required value={paymentData.method} onChange={e => setPaymentData({...paymentData, method: e.target.value as any})} className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 focus:border-success focus:outline-none focus:ring-1 focus:ring-success transition-colors font-bold">
                  <option value="cash">نقدي (كاش)</option>
                  <option value="card">شبكة (مدى/بطاقة ائتمانية)</option>
                  <option value="bank_transfer">حوالة بنكية</option>
                  <option value="cheque">شيك</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsPaymentOpen(false)} className="rounded-xl px-6 py-2.5 font-bold hover:bg-accent transition-colors border border-border">إلغاء</button>
                <button type="submit" className="rounded-xl bg-success px-8 py-2.5 font-bold text-white hover:bg-success/90 transition-colors shadow-md">حفظ الدفعة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <EditStudentModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} student={student} />
      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title={`سجل الطالب: ${student.name}`}
        data={studentInvoices} // Only used if table template is selected (like financial_statement)
        templates={printTemplates}
      />
    </AppShell>
  );
}
