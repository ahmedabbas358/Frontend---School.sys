import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore, ScheduledExam, ExamCategory } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage, getSectionClassId, isItemAllowedForGrade } from "@/lib/school-structure";
import { CalendarDays, Plus, Trash2, Search, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";

export const Route = createFileRoute("/exams/")({
  component: ExamsPlanningPage,
  head: () => ({ meta: [{ title: "الجدولة والتخطيط" }] })
});

function ExamsPlanningPage() {
  const [activeTab, setActiveTab] = useState<"schedule" | "categories">("schedule");

  return (
    <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الاختبارات", to: "/exams" }, { label: "الجدولة والتخطيط" }]}>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
        <div className="flex gap-4 border-b border-border/50 pb-2">
          <button 
            onClick={() => setActiveTab("schedule")}
            className={`pb-2 px-4 font-bold text-lg transition-all border-b-2 ${activeTab === "schedule" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            جدول الاختبارات
          </button>
          <button 
            onClick={() => setActiveTab("categories")}
            className={`pb-2 px-4 font-bold text-lg transition-all border-b-2 ${activeTab === "categories" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            قوالب التقييم
          </button>
        </div>

        {activeTab === "schedule" ? <ScheduledExamsView /> : <ExamCategoriesView />}
      </div>
    </AppShell>
  );
}

// ==========================================
// 1. Scheduled Exams View
// ==========================================
function ScheduledExamsView() {
  const { stage, setStage, getStageLabel, stages } = useStage();
  const { 
    activeStageScheduledExams, 
    activeStageExamCategories,
    activeStageSections,
    activeStageSubjects,
    addScheduledExam,
    updateScheduledExam,
    deleteScheduledExam
  } = useGlobalStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSection, setFilterSection] = useState("");

  const [formData, setFormData] = useState<Partial<ScheduledExam>>({
    name: "",
    grade: "",
    sectionId: "",
    categoryId: "",
    subjectId: "",
    term: "العام الدراسي",
    date: new Date().toISOString().split('T')[0],
    totalMarks: 100,
    gradingSystem: "marks",
    status: "scheduled"
  });

  const stageGrades = useMemo(() => getGradesForStage(stage), [stage]);
  const formSections = useMemo(() => (
    formData.grade ? activeStageSections.filter(section => section.stage === stage && section.grade === formData.grade) : []
  ), [activeStageSections, stage, formData.grade]);
  const selectedSection = useMemo(() => formSections.find(s => s.id === formData.sectionId), [formSections, formData.sectionId]);

  const applicableCategories = useMemo(() => {
    if (!selectedSection) return [];
    return activeStageExamCategories.filter(c => isItemAllowedForGrade(c, stage, selectedSection.grade));
  }, [selectedSection, activeStageExamCategories, stage]);

  const applicableSubjects = useMemo(() => {
    if (!selectedSection) return [];
    return activeStageSubjects.filter(s => isItemAllowedForGrade(s, stage, selectedSection.grade));
  }, [selectedSection, activeStageSubjects, stage]);

  const filterSections = useMemo(() => (
    filterGrade ? activeStageSections.filter(section => section.stage === stage && section.grade === filterGrade) : activeStageSections
  ), [activeStageSections, stage, filterGrade]);

  // When category changes, auto-fill totalMarks and gradingSystem
  useEffect(() => {
    if (formData.categoryId) {
      const cat = activeStageExamCategories.find(c => c.id === formData.categoryId);
      if (cat) {
        setFormData(prev => ({ ...prev, totalMarks: cat.maxMark || prev.totalMarks, gradingSystem: cat.gradingSystem || prev.gradingSystem }));
      }
    }
  }, [formData.categoryId, activeStageExamCategories]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.grade || !formData.sectionId || !formData.subjectId || !formData.date) {
      toast.error("الرجاء إكمال كافة الحقول المطلوبة");
      return;
    }
    
    // Check for conflicts
    const conflict = activeStageScheduledExams.find(ex => ex.sectionId === formData.sectionId && ex.date === formData.date);
    if (conflict) {
      toast.warning("يوجد اختبار آخر مجدول لنفس الشعبة في هذا اليوم. تأكد من عدم تعارض الأوقات.");
    }

    try {
      addScheduledExam({
        ...formData as Omit<ScheduledExam, "id" | "createdAt">,
        classId: getSectionClassId(selectedSection!),
        sectionId: selectedSection!.id,
        grade: selectedSection!.grade,
        stage
      });
      toast.success("تمت جدولة الاختبار بنجاح!");
      setIsModalOpen(false);
      setFormData(prev => ({ ...prev, name: "", grade: "", sectionId: "", subjectId: "", categoryId: "" }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر حفظ الاختبار بسبب عدم تطابق البيانات");
    }
  };

  const list = useMemo(() => {
    return activeStageScheduledExams.filter(ex => {
      const subject = activeStageSubjects.find(s => s.id === ex.subjectId);
      if (searchQ && subject && !subject.name.includes(searchQ)) return false;
      if (filterGrade && ex.grade !== filterGrade) return false;
      if (filterSection && ex.sectionId !== filterSection) return false;
      return true;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeStageScheduledExams, activeStageSubjects, searchQ, filterGrade, filterSection]);

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-sm flex items-center gap-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl"><CalendarDays className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground font-bold">إجمالي الاختبارات</p>
            <p className="text-2xl font-black">{activeStageScheduledExams.length}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-sm flex items-center gap-4">
          <div className="bg-warning/10 text-warning p-3 rounded-xl"><Clock className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground font-bold">اختبارات قادمة</p>
            <p className="text-2xl font-black">{activeStageScheduledExams.filter(ex => ex.status === 'scheduled').length}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-sm flex items-center gap-4">
          <div className="bg-success/10 text-success p-3 rounded-xl"><CheckCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground font-bold">مكتملة</p>
            <p className="text-2xl font-black">{activeStageScheduledExams.filter(ex => ex.status === 'completed').length}</p>
          </div>
        </div>
      </div>

      <PageCard
        title="الاختبارات المجدولة"
        description="إدارة وتخطيط جميع الاختبارات"
        actions={
          <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="w-5 h-5" /> جدولة اختبار جديد
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-3 mb-6">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="البحث باسم المادة..."
              className="h-11 w-full rounded-xl border border-border/50 bg-background pr-10 pl-4 text-sm font-bold shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select value={filterGrade} onChange={e => { setFilterGrade(e.target.value); setFilterSection(""); }} className="h-11 rounded-xl border border-border/50 bg-background px-4 text-sm font-bold shadow-sm focus:border-primary focus:outline-none w-full">
            <option value="">كل الفصول</option>
            {stageGrades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select disabled={!filterGrade} value={filterSection} onChange={e => setFilterSection(e.target.value)} className="h-11 rounded-xl border border-border/50 bg-background px-4 text-sm font-bold shadow-sm focus:border-primary focus:outline-none w-full disabled:opacity-50">
            <option value="">كل الشعب</option>
            {filterSections.map(s => <option key={s.id} value={s.id}>شعبة {s.name}</option>)}
          </select>
        </div>

        <DataTable
          rows={list}
          columns={[
            { key: "name", header: "الامتحان", cell: row => <span className="font-black text-primary">{row.name}</span> },
            { key: "subj", header: "المادة", cell: row => <span className="font-bold text-base">{activeStageSubjects.find(s => s.id === row.subjectId)?.name}</span> },
            { key: "type", header: "النوع", cell: row => {
              const cat = activeStageExamCategories.find(c => c.id === row.categoryId);
              return cat ? <span className={`px-3 py-1 rounded-full text-xs font-bold border border-current`} style={{color: cat.color || 'currentColor', backgroundColor: `${cat.color || 'var(--foreground)'}15`}}>{cat.name}</span> : <span className="text-xs text-muted-foreground">يدوي</span>
            }},
            { key: "path", header: "المسار", cell: row => {
              const section = activeStageSections.find(s => s.id === row.sectionId);
              return <span className="font-bold text-sm text-muted-foreground">{row.grade} / شعبة {section?.name || "-"}</span>
            }},
            { key: "date", header: "التاريخ", cell: row => <span className="font-bold tabular-nums" dir="ltr">{row.date}</span> },
            { key: "marks", header: "الدرجة القصوى", cell: row => <span className="font-bold text-primary">{row.totalMarks} {row.gradingSystem === 'percentage' ? '%' : ''}</span> },
            { key: "status", header: "الحالة", cell: row => (
              <select 
                className="bg-transparent font-bold text-sm cursor-pointer hover:underline"
                value={row.status}
                onChange={(e) => updateScheduledExam(row.id, { status: e.target.value as any })}
              >
                <option value="scheduled">مجدول ⏳</option>
                <option value="ongoing">جارٍ الآن 📝</option>
                <option value="completed">مكتمل ✅</option>
                <option value="cancelled">ملغي ❌</option>
              </select>
            )},
            { key: "actions", header: "", cell: row => (
              <button onClick={() => deleteScheduledExam(row.id)} className="p-2 text-danger/70 hover:text-danger hover:bg-danger/10 rounded-xl transition-colors"><Trash2 className="w-4 h-4"/></button>
            )}
          ]}
        />
      </PageCard>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden slide-in-from-bottom-4 animate-in">
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-accent/30">
              <h2 className="text-xl font-black text-primary">جدولة اختبار جديد</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-background rounded-full hover:bg-danger/10 hover:text-danger transition-colors border border-border/50">
                <Trash2 className="w-5 h-5 hidden" /> {/* Just spacing placeholder if needed, using custom close below */}
                <span className="font-bold text-xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">المرحلة <span className="text-danger">*</span></label>
                  <select required value={stage} onChange={e => { setStage(e.target.value as any); setFormData(prev => ({ ...prev, grade: "", sectionId: "", subjectId: "", categoryId: "" })); }} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary">
                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">الفصل <span className="text-danger">*</span></label>
                  <select required value={formData.grade || ""} onChange={e => setFormData(prev => ({ ...prev, grade: e.target.value, sectionId: "", subjectId: "", categoryId: "" }))} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary">
                    <option value="">-- اختر الفصل --</option>
                    {stageGrades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">الشعبة <span className="text-danger">*</span></label>
                  <select required disabled={!formData.grade} value={formData.sectionId || ""} onChange={e => setFormData(prev => ({ ...prev, sectionId: e.target.value, subjectId: "", categoryId: "" }))} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50">
                    <option value="">-- اختر الشعبة --</option>
                    {formSections.map(s => <option key={s.id} value={s.id}>شعبة {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">اسم الامتحان <span className="text-danger">*</span></label>
                  <input
                    required
                    value={formData.name || ""}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: شهري أول، شهري ثاني، فترة أولى"
                    className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">المادة <span className="text-danger">*</span></label>
                  <select required disabled={!formData.sectionId} value={formData.subjectId || ""} onChange={e => setFormData(prev => ({ ...prev, subjectId: e.target.value, categoryId: "" }))} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50">
                    <option value="">-- اختر المادة --</option>
                    {applicableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">قالب التقييم (اختياري)</label>
                  <select disabled={!formData.subjectId} value={formData.categoryId || ""} onChange={e => setFormData(prev => ({...prev, categoryId: e.target.value || undefined}))} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50">
                    <option value="">بدون قالب - إدخال يدوي</option>
                    {applicableCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">تاريخ الاختبار <span className="text-danger">*</span></label>
                  <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-muted-foreground">الدرجة القصوى <span className="text-danger">*</span></label>
                  <input type="number" required min="1" value={formData.totalMarks} onChange={e => setFormData({...formData, totalMarks: Number(e.target.value)})} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary" dir="ltr" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 font-bold hover:bg-accent rounded-xl transition-colors">إلغاء</button>
                <button type="submit" className="px-8 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-md">اعتماد الجدولة</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. Exam Templates View (Settings)
// ==========================================
function ExamCategoriesView() {
  const { stage, getStageLabel } = useStage();
  const { activeStageExamCategories, activeStageSections, addExamCategory, deleteExamCategory } = useGlobalStore();

  const uniqueGrades = useMemo(() => getGradesForStage(stage), [stage]);

  const [formData, setFormData] = useState<Partial<ExamCategory>>({
    name: "",
    weight: 20,
    grades: [],
    gradingSystem: "marks",
    maxMark: 20,
    color: "#3b82f6"
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addExamCategory({ ...formData as Omit<ExamCategory, "id">, stage });
    toast.success("تمت إضافة نوع الاختبار!");
    setFormData({ name: "", weight: 20, grades: [], gradingSystem: "marks", maxMark: 20, color: "#3b82f6" });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <PageCard title="إضافة قالب تقييم" description="القالب اختياري لضبط الدرجة ونظام الرصد بسرعة">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-muted-foreground">اسم القالب</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold" placeholder="مثال: درجات رقمية من 20" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-bold text-muted-foreground">الوزن النسبي (%)</label>
                <input required type="number" min="0" max="100" value={formData.weight} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-muted-foreground">الدرجة الافتراضية</label>
                <input required type="number" min="1" value={formData.maxMark} onChange={e => setFormData({...formData, maxMark: Number(e.target.value)})} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-muted-foreground">نظام التقييم</label>
              <select required value={formData.gradingSystem} onChange={e => setFormData({...formData, gradingSystem: e.target.value as any})} className="w-full h-12 rounded-xl border border-border/50 bg-background px-4 font-bold">
                <option value="marks">درجات رقمية (أرقام)</option>
                <option value="percentage">نسب مئوية (%)</option>
                {stage === "kindergarten" && <option value="descriptive">تقييم وصفي (نصوص)</option>}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-muted-foreground">لون التمييز</label>
              <input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full h-12 rounded-xl border border-border/50 bg-background px-2 cursor-pointer" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-muted-foreground">مخصص لصفوف معينة (اختياري)</label>
              <div className="flex flex-wrap gap-2 p-3 bg-accent/20 rounded-xl max-h-40 overflow-y-auto">
                {uniqueGrades.map(g => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer p-1">
                    <input type="checkbox" checked={formData.grades?.includes(g)} onChange={e => {
                      if(e.target.checked) setFormData({...formData, grades: [...(formData.grades||[]), g]});
                      else setFormData({...formData, grades: (formData.grades||[]).filter(gr => gr !== g)});
                    }}/>
                    <span className="text-sm font-bold">{g}</span>
                  </label>
                ))}
                {uniqueGrades.length === 0 && <span className="text-xs text-muted-foreground">لا توجد صفوف بعد.</span>}
              </div>
            </div>

            <button type="submit" className="w-full bg-primary text-primary-foreground h-12 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm">
              إضافة القالب
            </button>
          </form>
        </PageCard>
      </div>
      
      <div className="lg:col-span-2">
        <PageCard title="قوالب التقييم المتاحة" description={`لـ ${getStageLabel(stage)}`}>
          <DataTable
            rows={activeStageExamCategories}
            columns={[
              { key: "name", header: "اسم القالب", cell: row => <span className="font-bold flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: row.color}}></div> {row.name}</span> },
              { key: "weight", header: "الوزن النسبي", cell: row => `${row.weight}%` },
              { key: "max", header: "الدرجة", cell: row => row.maxMark },
              { key: "sys", header: "التقييم", cell: row => <span className="text-xs bg-accent px-2 py-1 rounded-md">{row.gradingSystem === 'marks' ? 'درجات' : row.gradingSystem === 'percentage' ? 'نسب' : 'وصفي'}</span> },
              { key: "grades", header: "الصفوف", cell: row => row.grades && row.grades.length > 0 ? <div className="flex flex-wrap gap-1">{row.grades.map((g: string) => <span key={g} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{g}</span>)}</div> : <span className="text-xs text-muted-foreground">عام</span> },
              { key: "actions", header: "", cell: row => (
                <button onClick={() => deleteExamCategory(row.id)} className="p-2 text-danger/70 hover:text-danger hover:bg-danger/10 rounded-xl transition-colors"><Trash2 className="w-4 h-4"/></button>
              )}
            ]}
          />
        </PageCard>
      </div>
    </div>
  );
}
