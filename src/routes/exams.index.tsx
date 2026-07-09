import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore, Exam, ExamSubject } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage } from "@/lib/school-structure";
import { CalendarDays, Plus, Trash2, Search, Clock, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";

export const Route = createFileRoute("/exams/")({
  component: ExamsPlanningPage,
  head: () => ({ meta: [{ title: "الجدولة والتخطيط" }] })
});

function ExamsPlanningPage() {
  const [activeTab, setActiveTab] = useState<"exams" | "subjects">("exams");

  return (
    <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الاختبارات", to: "/exams" }, { label: "الجدولة والتخطيط" }]}>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
        <div className="flex gap-4 border-b border-border/50 pb-2">
          <button 
            onClick={() => setActiveTab("exams")}
            className={`pb-2 px-4 font-bold text-lg transition-all border-b-2 ${activeTab === "exams" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            فترات الاختبارات
          </button>
          <button 
            onClick={() => setActiveTab("subjects")}
            className={`pb-2 px-4 font-bold text-lg transition-all border-b-2 ${activeTab === "subjects" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            جدولة المواد
          </button>
        </div>

        {activeTab === "exams" ? <ExamsPeriodView /> : <ExamSubjectsScheduleView />}
      </div>
    </AppShell>
  );
}

// ==========================================
// 1. Exam Periods View (Top level Exam entity)
// ==========================================
function ExamsPeriodView() {
  const { currentAcademicYearId, activeStageExams, addExam, updateExam, deleteExam } = useGlobalStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Exam>>({
    name: "",
    term: "الفصل الأول",
    type: "midterm",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: "upcoming"
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.startDate || !formData.endDate) {
      toast.error("الرجاء إكمال الحقول المطلوبة");
      return;
    }

    try {
      addExam({
        ...formData as Omit<Exam, "id">,
        academicYearId: currentAcademicYearId!
      });
      toast.success("تم إضافة فترة الاختبار بنجاح");
      setIsModalOpen(false);
      setFormData({ name: "", term: "الفصل الأول", type: "midterm", startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], status: "upcoming" });
    } catch (error) {
      toast.error("حدث خطأ أثناء الحفظ");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-sm flex items-center gap-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl"><CalendarDays className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground font-bold">إجمالي الفترات</p>
            <p className="text-2xl font-black">{activeStageExams.length}</p>
          </div>
        </div>
      </div>

      <PageCard
        title="فترات الاختبارات"
        description="إدارة فترات الاختبارات الكبرى (مثل منتصف الفصل، النهائي)"
        actions={
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="w-5 h-5" /> إضافة فترة اختبار
          </button>
        }
      >
        <DataTable
          rows={activeStageExams}
          columns={[
            { key: "name", header: "الاسم", cell: row => <span className="font-black text-primary">{row.name}</span> },
            { key: "term", header: "الفصل", cell: row => <span className="font-bold">{row.term}</span> },
            { key: "type", header: "النوع", cell: row => <span className="text-sm">{row.type === 'final' ? 'نهائي' : row.type === 'midterm' ? 'نصفي' : row.type === 'monthly' ? 'شهري' : 'قصير'}</span> },
            { key: "dates", header: "الفترة", cell: row => <span className="text-sm tabular-nums" dir="ltr">{row.startDate} - {row.endDate}</span> },
            { key: "status", header: "الحالة", cell: row => (
              <select 
                className="bg-transparent font-bold text-sm cursor-pointer hover:underline"
                value={row.status}
                onChange={(e) => updateExam(row.id, { status: e.target.value as any })}
              >
                <option value="draft">مسودة 📝</option>
                <option value="upcoming">قادم ⏳</option>
                <option value="ongoing">جارٍ الآن 🟢</option>
                <option value="grading">تصحيح ✍️</option>
                <option value="completed">مكتمل ✅</option>
              </select>
            )},
            { key: "actions", header: "", cell: row => (
              <button onClick={() => deleteExam(row.id)} className="p-2 text-danger/70 hover:text-danger hover:bg-danger/10 rounded-xl transition-colors"><Trash2 className="w-4 h-4"/></button>
            )}
          ]}
        />
      </PageCard>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border/50 overflow-hidden slide-in-from-bottom-4 animate-in">
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-accent/30">
              <h2 className="text-xl font-black text-primary">إضافة فترة اختبار جديدة</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-background rounded-full hover:bg-danger/10 hover:text-danger transition-colors border border-border/50">
                <span className="font-bold text-xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-muted-foreground">اسم الفترة <span className="text-danger">*</span></label>
                <input required value={formData.name || ""} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="مثال: اختبارات منتصف الفصل الدراسي الأول" className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">الفصل <span className="text-danger">*</span></label>
                  <select required value={formData.term} onChange={e => setFormData(prev => ({ ...prev, term: e.target.value }))} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary">
                    <option value="الفصل الأول">الفصل الأول</option>
                    <option value="الفصل الثاني">الفصل الثاني</option>
                    <option value="الفصل الثالث">الفصل الثالث</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">النوع <span className="text-danger">*</span></label>
                  <select required value={formData.type} onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as any }))} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary">
                    <option value="monthly">شهري</option>
                    <option value="midterm">نصفي</option>
                    <option value="final">نهائي</option>
                    <option value="quiz">قصير</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">تاريخ البداية <span className="text-danger">*</span></label>
                  <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">تاريخ النهاية <span className="text-danger">*</span></label>
                  <input type="date" required min={formData.startDate} value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 font-bold hover:bg-accent rounded-xl transition-colors">إلغاء</button>
                <button type="submit" className="px-8 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-md">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. Exam Subjects Schedule View (ExamSubject entity)
// ==========================================
function ExamSubjectsScheduleView() {
  const { stage, stages } = useStage();
  const { activeStageExams, activeStageExamSubjects, activeStageSubjects, addExamSubject, deleteExamSubject } = useGlobalStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const stageGrades = useMemo(() => getGradesForStage(stage), [stage]);

  const [formData, setFormData] = useState<Partial<ExamSubject>>({
    examId: "",
    subjectId: "",
    date: new Date().toISOString().split('T')[0],
    maxScore: 100,
    passScore: 50,
    weight: 100,
    grade: ""
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.examId || !formData.subjectId || !formData.grade) {
      toast.error("الرجاء إكمال الحقول المطلوبة");
      return;
    }
    
    addExamSubject({
      ...formData as Omit<ExamSubject, "id">,
      stage
    });
    toast.success("تمت جدولة المادة بنجاح");
    setIsModalOpen(false);
  };

  const filteredSubjects = activeStageExamSubjects.filter(es => !selectedExamId || es.examId === selectedExamId);

  return (
    <div className="space-y-6">
      <PageCard
        title="جدولة المواد للاختبارات"
        description="تحديد مواد الاختبارات وأيامها وتوزيع الدرجات لكل صف"
        actions={
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="w-5 h-5" /> إضافة مادة لاختبار
          </button>
        }
      >
        <div className="mb-6">
          <label className="text-sm font-bold text-muted-foreground ml-2">تصفية حسب الاختبار:</label>
          <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className="h-11 rounded-xl border border-border/50 bg-background px-4 font-bold min-w-[250px]">
            <option value="">كل الاختبارات</option>
            {activeStageExams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
        </div>

        <DataTable
          rows={filteredSubjects.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
          columns={[
            { key: "exam", header: "الاختبار", cell: row => <span className="font-bold">{activeStageExams.find(e => e.id === row.examId)?.name || "-"}</span> },
            { key: "subject", header: "المادة", cell: row => <span className="font-black text-primary">{activeStageSubjects.find(s => s.id === row.subjectId)?.name || "-"}</span> },
            { key: "grade", header: "الصف", cell: row => <span className="font-bold text-muted-foreground">{row.grade}</span> },
            { key: "date", header: "تاريخ الاختبار", cell: row => <span className="tabular-nums" dir="ltr">{row.date}</span> },
            { key: "score", header: "الدرجة", cell: row => <span className="text-sm">{row.passScore} / {row.maxScore} (وزن {row.weight}%)</span> },
            { key: "actions", header: "", cell: row => (
              <button onClick={() => deleteExamSubject(row.id)} className="p-2 text-danger/70 hover:text-danger hover:bg-danger/10 rounded-xl transition-colors"><Trash2 className="w-4 h-4"/></button>
            )}
          ]}
        />
      </PageCard>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border/50 overflow-hidden slide-in-from-bottom-4 animate-in">
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-accent/30">
              <h2 className="text-xl font-black text-primary">جدولة مادة لاختبار</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-background rounded-full hover:bg-danger/10 hover:text-danger transition-colors border border-border/50">
                <span className="font-bold text-xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-muted-foreground">اختر الاختبار <span className="text-danger">*</span></label>
                <select required value={formData.examId} onChange={e => setFormData(prev => ({ ...prev, examId: e.target.value }))} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary">
                  <option value="">-- اختر --</option>
                  {activeStageExams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">الصف <span className="text-danger">*</span></label>
                  <select required value={formData.grade} onChange={e => setFormData(prev => ({ ...prev, grade: e.target.value }))} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary">
                    <option value="">-- اختر --</option>
                    {stageGrades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">المادة <span className="text-danger">*</span></label>
                  <select required value={formData.subjectId} onChange={e => setFormData(prev => ({ ...prev, subjectId: e.target.value }))} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary">
                    <option value="">-- اختر --</option>
                    {activeStageSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-muted-foreground">تاريخ الاختبار للمادة <span className="text-danger">*</span></label>
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">الدرجة الكلية</label>
                  <input type="number" required value={formData.maxScore} onChange={e => setFormData({...formData, maxScore: Number(e.target.value)})} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">درجة النجاح</label>
                  <input type="number" required value={formData.passScore} onChange={e => setFormData({...formData, passScore: Number(e.target.value)})} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">الوزن المئوي %</label>
                  <input type="number" required value={formData.weight} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 font-bold hover:bg-accent rounded-xl transition-colors">إلغاء</button>
                <button type="submit" className="px-8 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-md">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
