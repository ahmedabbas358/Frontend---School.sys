import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { CheckCircle2, ChevronRight, GraduationCap, XCircle, ArrowRightLeft } from "lucide-react";

export const Route = createFileRoute("/academic/promotion")({
  head: () => ({ meta: [{ title: "النقل الذكي للطلاب | منصة مدارس" }] }),
  component: AcademicPromotionPage,
});

function AcademicPromotionPage() {
  const { allAcademicYears, allStudents, promoteStudents } = useGlobalStore();
  const academicYears = allAcademicYears || []; // Using allAcademicYears from GlobalStore
  
  const [step, setStep] = useState(1);
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [nextGrade, setNextGrade] = useState("");
  
  // States for student individual status changes
  const [studentStatusOverrides, setStudentStatusOverrides] = useState<Record<string, "ناجح" | "راسب" | "خريج">>({});

  // Filter students based on source year and grade
  const targetStudents = useMemo(() => {
    return allStudents.filter(s => 
      // If student has an academicYearId, match it, otherwise match those without if fromYear isn't selected
      (!s.academicYearId || s.academicYearId === fromYear) && 
      s.grade === selectedGrade
    );
  }, [allStudents, fromYear, selectedGrade]);

  const handleOverride = (studentId: string, status: "ناجح" | "راسب" | "خريج") => {
    setStudentStatusOverrides(prev => ({ ...prev, [studentId]: status }));
  };

  const handlePromote = () => {
    if (!toYear) {
      toast.error("الرجاء اختيار السنة الدراسية الوجهة");
      return;
    }
    
    if (targetStudents.length === 0) {
      toast.error("لا يوجد طلاب للنقل");
      return;
    }

    const promotions = targetStudents.map(student => {
      const overrideStatus = studentStatusOverrides[student.id];
      const status = overrideStatus || "ناجح";
      
      // Determine next grade based on status
      let finalNextGrade = nextGrade;
      if (status === "راسب") {
        finalNextGrade = student.grade; // Stay in the same grade
      }
      
      return {
        studentId: student.id,
        nextGrade: finalNextGrade,
        nextAcademicYearId: toYear,
        status
      };
    });

    promoteStudents(promotions);
    toast.success(`تم معالجة ونقل ${promotions.length} طالب بنجاح!`);
    setStep(3); // Go to summary
  };

  const GRADES = ["الأول الابتدائي", "الثاني الابتدائي", "الثالث الابتدائي", "الرابع الابتدائي", "الخامس الابتدائي", "السادس الابتدائي", "الأول المتوسط", "الثاني المتوسط", "الثالث المتوسط", "الأول الثانوي", "الثاني الثانوي", "الثالث الثانوي", "خريج"];

  return (
    <AppShell
      breadcrumb={[
        { label: "الشؤون الأكاديمية", to: "/academic" },
        { label: "النقل الذكي للطلاب" },
      ]}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <ArrowRightLeft className="h-8 w-8 text-primary" />
              نظام النقل الذكي
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">نقل السجلات الدراسية للطلاب للسنة الجديدة بكفاءة لآلاف السجلات بضغطة زر.</p>
          </div>
          
          <div className="flex items-center gap-2" dir="ltr">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-2.5 rounded-full transition-all duration-300 ${step >= i ? 'w-8 bg-primary shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'w-2.5 bg-border'}`} />
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageCard title="المصدر (السنة الحالية)" className="border-primary/20 shadow-lg">
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">السنة الدراسية المنتهية</label>
                  <select 
                    value={fromYear}
                    onChange={(e) => setFromYear(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-input bg-background/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold"
                  >
                    <option value="">-- اختر السنة --</option>
                    {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">الصف المراد نقله</label>
                  <select 
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-input bg-background/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-semibold"
                  >
                    <option value="">-- اختر الصف --</option>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            </PageCard>

            <PageCard title="الوجهة (السنة الجديدة)" className="border-success/20 shadow-lg opacity-90 hover:opacity-100 transition-opacity">
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">السنة الدراسية الجديدة</label>
                  <select 
                    value={toYear}
                    onChange={(e) => setToYear(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-input bg-background/50 focus:border-success focus:ring-1 focus:ring-success outline-none transition-all font-semibold"
                  >
                    <option value="">-- اختر السنة --</option>
                    {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">الصف المستهدف (للناجحين)</label>
                  <select 
                    value={nextGrade}
                    onChange={(e) => setNextGrade(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-input bg-background/50 focus:border-success focus:ring-1 focus:ring-success outline-none transition-all font-semibold"
                  >
                    <option value="">-- اختر الصف --</option>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            </PageCard>
            
            <div className="md:col-span-2 flex justify-end">
              <button 
                disabled={!selectedGrade || !nextGrade || !toYear}
                onClick={() => setStep(2)}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-primary/20"
              >
                التالي: استعراض وتعديل الحالات <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-6">
            <PageCard title={`معالجة الطلاب: ${selectedGrade}`} description={`إجمالي الطلاب: ${targetStudents.length.toLocaleString()} طالب`}>
              {targetStudents.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground font-semibold">لا يوجد طلاب في هذا الصف لهذه السنة.</div>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-muted/40 sticky top-0 backdrop-blur-md">
                      <tr>
                        <th className="px-6 py-4 font-bold text-muted-foreground">رقم الطالب</th>
                        <th className="px-6 py-4 font-bold text-muted-foreground">اسم الطالب</th>
                        <th className="px-6 py-4 font-bold text-muted-foreground">القرار (الحالة)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {targetStudents.map(student => {
                        const status = studentStatusOverrides[student.id] || "ناجح";
                        return (
                          <tr key={student.id} className="hover:bg-accent/40 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs">{student.id}</td>
                            <td className="px-6 py-4 font-bold">{student.name}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 bg-background p-1 rounded-lg border border-border inline-flex shadow-sm">
                                <button 
                                  onClick={() => handleOverride(student.id, "ناجح")}
                                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${status === "ناجح" ? "bg-success text-success-foreground shadow-sm" : "hover:bg-muted text-muted-foreground"}`}
                                >
                                  ناجح (نقل لـ {nextGrade})
                                </button>
                                <button 
                                  onClick={() => handleOverride(student.id, "راسب")}
                                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${status === "راسب" ? "bg-danger text-danger-foreground shadow-sm" : "hover:bg-muted text-muted-foreground"}`}
                                >
                                  معيد (البقاء في {student.grade})
                                </button>
                                <button 
                                  onClick={() => handleOverride(student.id, "خريج")}
                                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${status === "خريج" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground"}`}
                                >
                                  خريج
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </PageCard>

            <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
              <button onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground font-bold px-4 py-2">رجوع</button>
              <button 
                onClick={handlePromote}
                disabled={targetStudents.length === 0}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg"
              >
                <CheckCircle2 className="h-5 w-5" />
                تأكيد ونقل الجميع
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in zoom-in-95 fade-in duration-500 py-12 flex flex-col items-center justify-center text-center">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-success/20 text-success mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
              <GraduationCap className="h-12 w-12" />
            </div>
            <h2 className="text-3xl font-black mb-3 text-foreground">تم النقل بنجاح!</h2>
            <p className="text-muted-foreground mb-8 text-lg">تم تحديث سجلات <span className="font-bold text-foreground mx-1">{targetStudents.length.toLocaleString()}</span> طالب وأرشفتها للفصل الجديد.</p>
            
            <button 
              onClick={() => {
                setStep(1);
                setSelectedGrade("");
                setNextGrade("");
                setStudentStatusOverrides({});
              }}
              className="px-6 py-3 border-2 border-primary text-primary rounded-xl font-bold hover:bg-primary hover:text-primary-foreground transition-all"
            >
              نقل صف آخر
            </button>
          </div>
        )}
        
      </div>
    </AppShell>
  );
}
