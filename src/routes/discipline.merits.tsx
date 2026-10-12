import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { 
  Star, 
  Plus, 
  Search, 
  Printer, 
  Sparkles, 
  Trash2, 
  Award, 
  TrendingUp, 
  UserCheck, 
  CheckCircle2, 
  Filter,
  Heart
} from "lucide-react";
import { useState, useMemo } from "react";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { toast } from "sonner";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { SearchableSelect, SearchableSelectOption } from "@/components/searchable-select";
import { ModalStudentGradeSectionFilter } from "@/components/grade-section-control";
import { AttendanceDisciplineNav } from "@/components/attendance/attendance-nav";
import { AdminModal } from "@/components/admin/admin-modal";

export const Route = createFileRoute("/discipline/merits")({
  head: () => ({
    meta: [
      { title: "سجل النقاط والمكافآت السلوكية | منصة مدارس" },
      { name: "description", content: "تعزيز السلوك الإيجابي، منح نقاط التميز، رعاية المواهب وإصدار شهادات الشكر والتقدير" }
    ],
  }),
  component: DisciplineMerits,
});

const meritSchema = z.object({
  studentId: z.string().min(1, "الرجاء اختيار الطالب المتميز"),
  categoryId: z.string().min(1, "الرجاء تحديد سبب التميز أو المكافأة"),
  description: z.string().optional(),
});

type MeritForm = z.infer<typeof meritSchema>;

function DisciplineMerits() {
  const { 
    allBehaviorTransactions, 
    allDisciplineCategories, 
    activeStageStudents, 
    activeStageSections, 
    addBehaviorTransaction, 
    deleteBehaviorTransaction,
    currentAcademicYearId, 
    allStudentEnrollments,
    addActivityLog
  } = useGlobalStore();
  const { stage, getStageLabel } = useStage();

  const [q, setQ] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [deleteMeritId, setDeleteMeritId] = useState<string | null>(null);

  const [modalGrade, setModalGrade] = useState("");
  const [modalSection, setModalSection] = useState("");

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<MeritForm>({
    resolver: zodResolver(meritSchema),
    defaultValues: { studentId: "", categoryId: "", description: "" },
  });

  const onSubmit = (data: MeritForm) => {
    if (!currentAcademicYearId) {
      toast.error("لا يوجد عام دراسي نشط مسجل بالنظام");
      return;
    }

    const enrollment = allStudentEnrollments.find(e => e.studentId === data.studentId && e.academicYearId === currentAcademicYearId);
    if (!enrollment) {
      toast.error("الطالب غير مسجل في العام الدراسي الحالي");
      return;
    }

    const category = allDisciplineCategories.find(c => c.id === data.categoryId);
    if (!category) {
      toast.error("تصنيف التميز غير صالح");
      return;
    }

    const studentObj = activeStageStudents.find(s => s.id === data.studentId);

    addBehaviorTransaction({
      studentEnrollmentId: enrollment.id,
      type: "positive",
      points: Math.abs(category.defaultPoints),
      categoryId: category.id,
      reason: data.description || category.name || "منح نقاط تميز وسلوك إيجابي",
      createdBy: "إدارة التوجيه والإرشاد",
      date: new Date().toISOString().split("T")[0],
    });

    addActivityLog({
      user: "المرشد الطلابي",
      action: "منح نقاط تميز ومكافأة",
      entity: "الانضباط والسلوك",
      details: `تم منح الطالب (${studentObj?.name || data.studentId}) مكافأة (${category.name}) وإضافة +${category.defaultPoints} نقطة`,
    });

    toast.success("تم منح المكافأة ونقاط التميز بنجاح!", {
      description: `تمت إضافة +${category.defaultPoints} نقطة إلى السجل السلوكي للطالب ${studentObj?.name || ""}`
    });

    setIsModalOpen(false);
    reset();
    setModalGrade("");
    setModalSection("");
  };

  const handleDeleteMerit = () => {
    if (!deleteMeritId) return;
    deleteBehaviorTransaction(deleteMeritId);
    addActivityLog({
      user: "المرشد الطلابي",
      action: "إلغاء مكافأة سلوكية",
      entity: "الانضباط والسلوك",
      details: `تم إلغاء المكافأة رقم #${deleteMeritId} وخصم النقاط الممنوحة سابقاً`,
    });
    toast.success("تم إلغاء المكافأة السلوكية وتحديث الرصيد");
    setDeleteMeritId(null);
  };

  const uniqueGrades = useMemo(() => Array.from(new Set(activeStageSections.map(s => s.grade))).filter(Boolean), [activeStageSections]);

  const modalStudentOptions: SearchableSelectOption[] = useMemo(() => {
    return activeStageStudents
      .filter(st => {
        if (modalGrade && st.grade !== modalGrade) return false;
        const enrollment = allStudentEnrollments.find(e => e.studentId === st.id && e.academicYearId === currentAcademicYearId);
        const secId = enrollment?.sectionId || st.sectionId;
        if (modalSection && secId !== modalSection) return false;
        return true;
      })
      .map(st => {
        const enrollment = allStudentEnrollments.find(e => e.studentId === st.id && e.academicYearId === currentAcademicYearId);
        const secId = enrollment?.sectionId || st.sectionId;
        const secName = activeStageSections.find(s => s.id === secId)?.name || '';
        return {
          id: st.id,
          title: st.name,
          subtitle: `${st.grade} ${secId ? `- شعبة ${secName}` : ''}`
        };
      });
  }, [activeStageStudents, modalGrade, modalSection, allStudentEnrollments, currentAcademicYearId, activeStageSections]);

  const filtered = useMemo(() => {
    return allBehaviorTransactions.filter((tx) => {
      if (tx.type !== "positive") return false;

      const enrollment = allStudentEnrollments.find(e => e.id === tx.studentEnrollmentId);
      if (!enrollment) return false;
      const student = activeStageStudents.find(s => s.id === enrollment.studentId);
      if (!student) return false;

      if (q && !student.name.includes(q) && !tx.id.includes(q)) return false;
      if (filterCategory && tx.categoryId !== filterCategory) return false;
      if (filterDateFrom && tx.date < filterDateFrom) return false;
      if (filterDateTo && tx.date > filterDateTo) return false;
      if (filterGrade && student.grade !== filterGrade) return false;
      if (filterSection && (enrollment.sectionId || student.sectionId) !== filterSection) return false;

      return true;
    }).map(tx => {
      const enrollment = allStudentEnrollments.find(e => e.id === tx.studentEnrollmentId)!;
      const student = activeStageStudents.find(s => s.id === enrollment.studentId)!;
      const category = allDisciplineCategories.find(c => c.id === tx.categoryId);
      const section = activeStageSections.find(sec => sec.id === (enrollment.sectionId || student.sectionId));
      return {
        ...tx,
        studentName: student.name,
        categoryName: category?.name || "تميز سلوكي عام",
        grade: student.grade,
        sectionName: section?.name || "عامة",
        studentId: student.id,
        nationalId: student.nationalId || "—"
      };
    });
  }, [q, filterCategory, filterDateFrom, filterDateTo, filterGrade, filterSection, allBehaviorTransactions, activeStageStudents, allStudentEnrollments, allDisciplineCategories, activeStageSections]);

  const stats = useMemo(() => {
    const totalAwards = filtered.length;
    const totalPointsEarned = filtered.reduce((sum, tx) => sum + Math.abs(tx.points), 0);
    const honoredStudentsCount = new Set(filtered.map(tx => tx.studentName)).size;
    const starPerformers = filtered.filter(tx => Math.abs(tx.points) >= 15).length;

    return {
      totalAwards,
      totalPointsEarned,
      honoredStudentsCount,
      starPerformers
    };
  }, [filtered]);

  const printTemplates: PrintTemplate[] = [
    {
      id: "merits-list",
      name: "كشف المكافآت ونقاط التميز السلوكي",
      category: "السلوك والمواظبة",
      type: "table",
      description: "حصر معتمد لجميع شهادات ونقاط التميز الممنوحة للطلاب",
      columns: [
        { label: "رقم القيد", key: "id" },
        { label: "تاريخ المنح", key: "date" },
        { label: "اسم الطالب", key: "studentName" },
        { label: "الصف والشعبة", key: "grade", render: (r) => `${r.grade} (${r.sectionName})` },
        { label: "سبب التميز والمكافأة", key: "categoryName" },
        { label: "النقاط المكتسبة", key: "points", render: (r) => `+${r.points} نقطة` },
        { label: "الملاحظات والبيان", key: "reason" },
      ]
    },
    {
      id: "appreciation-certificate",
      name: "شهادة شكر وتقدير للتميز السلوكي",
      category: "الشهادات والتقدير",
      type: "document",
      description: "شهادة تكريم فاخرة تعزز روح المبادرة والأخلاق الفاضلة للطالب المتميز",
      renderDocument: (item: any) => {
        const rec = item || filtered[0] || {};
        return (
          <div className="p-10 bg-gradient-to-b from-amber-50/40 via-white to-amber-50/30 text-gray-900 border-4 border-amber-600 rounded-3xl space-y-8 relative overflow-hidden" dir="rtl">
            <div className="flex items-center justify-between border-b-2 border-amber-500/50 pb-4">
              <div className="text-right text-xs">
                <p className="font-black text-amber-700">المملكة العربية السعودية</p>
                <p className="font-bold">وزارة التعليم • منصة مدارس الأهلية</p>
                <p className="text-gray-600">برنامج تعزيز السلوك الإيجابي والقيم</p>
              </div>
              <div className="text-center">
                <span className="text-3xl font-black text-amber-700 tracking-wide block">شهادة شكر وتقدير</span>
                <span className="text-xs font-bold text-amber-600 block mt-1">وسام التميز السلوكي والأخلاقي</span>
              </div>
              <div className="text-left text-xs font-bold">
                <div>التاريخ: {rec.date || new Date().toISOString().slice(0, 10)}</div>
                <div>المرحلة: {getStageLabel(stage)}</div>
              </div>
            </div>

            <div className="text-center space-y-4 py-4">
              <p className="text-sm font-semibold text-gray-700">
                يسر إدارة المدرسة ووحدة الإرشاد الطلابي أن تمنح هذه الشهادة للطالب المتميز:
              </p>
              <h2 className="text-3xl font-black text-primary underline decoration-amber-500 decoration-wavy py-1">
                {rec.studentName || "اسم الطالب المكرّم"}
              </h2>
              <p className="text-xs font-bold text-gray-600">
                المقيد بالصف: <span className="font-black text-gray-900">{rec.grade || "—"} - شعبة ({rec.sectionName || "—"})</span>
              </p>
              <div className="max-w-xl mx-auto p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 leading-relaxed">
                تقديراً لما أظهره من سلوك متميز وخلق فاضل متمثل في:
                <span className="block text-base font-black text-amber-800 mt-1">
                  "{rec.reason || rec.categoryName || "الالتزام التام بالقيم المدرسية والانضباط الأخلاقي المثالي"}"
                </span>
                <span className="block text-[11px] text-amber-700 mt-1">
                  وقد تم منحه (+{rec.points || 10}) نقاط تميز إضافية في سجله السلوكي التراكمي.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs font-bold border-t-2 border-amber-500/50">
              <div>
                <p>المرشد الطلابي</p>
                <p className="mt-8 text-gray-400">........................</p>
              </div>
              <div>
                <p>وكيل شؤون الطلاب</p>
                <p className="mt-8 text-gray-400">........................</p>
              </div>
              <div>
                <p>مدير المدرسة والختم</p>
                <div className="h-14 w-14 mx-auto rounded-full border-2 border-dashed border-amber-500 mt-2 flex items-center justify-center text-[10px] text-amber-700 font-black">
                  ختم التكريم
                </div>
              </div>
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الحضور والانضباط", to: "/attendance" },
        { label: "النقاط والمكافآت السلوكية" },
      ]}
    >
      <div className="space-y-6">
        
        {/* Unified Subnavigation Ribbon */}
        <AttendanceDisciplineNav
          activeTab="merits"
          quickActions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrintOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-card border border-border/70 px-3.5 text-xs font-bold text-foreground hover:bg-muted transition-all shadow-2xs cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 text-primary" />
                <span>طباعة السجل</span>
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 text-white px-4 text-xs font-black hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/20 active:scale-95 cursor-pointer glow-success"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>منح مكافأة وسلوك إيجابي</span>
              </button>
            </div>
          }
        />

        {/* 4 Interactive KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold">إجمالي المكافآت الممنوحة</span>
              <Award className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-foreground tabular-nums">
              {stats.totalAwards} <span className="text-xs font-bold text-muted-foreground">تكريم</span>
            </div>
            <div className="text-[11px] text-muted-foreground font-medium">سجلات مرحلة {getStageLabel(stage)}</div>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold">إجمالي نقاط التميز</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              +{stats.totalPointsEarned} <span className="text-xs font-bold text-muted-foreground">نقطة</span>
            </div>
            <div className="text-[11px] text-muted-foreground font-medium">نقاط تراكمية تحفيزية</div>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold">الطلاب المكرّمون</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-foreground tabular-nums">
              {stats.honoredStudentsCount} <span className="text-xs font-bold text-muted-foreground">طالب</span>
            </div>
            <div className="text-[11px] text-muted-foreground font-medium">
              من إجمالي {activeStageStudents.length} طالب بالمرحلة
            </div>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold">فرسان التميز الاستثنائي</span>
              <Star className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {stats.starPerformers} <span className="text-xs font-bold text-muted-foreground">طالب</span>
            </div>
            <div className="text-[11px] text-amber-600/80 font-bold">حققوا 15 نقطة تميز فأكثر</div>
          </div>
        </div>

        {/* Enhanced Multi-Filter Ribbon */}
        <div className="bg-card p-4 sm:p-5 rounded-3xl border border-border/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <h3 className="font-black text-xs text-foreground">تصفية وبحث في سجل المكافآت ونقاط التميز</h3>
            </div>
            {(q || filterGrade || filterSection || filterCategory || filterDateFrom || filterDateTo) && (
              <button
                onClick={() => {
                  setQ("");
                  setFilterGrade("");
                  setFilterSection("");
                  setFilterCategory("");
                  setFilterDateFrom("");
                  setFilterDateTo("");
                }}
                className="text-xs text-primary font-bold hover:underline"
              >
                تفريغ الفلاتر
              </button>
            )}
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 text-xs font-bold">
            <div className="relative sm:col-span-2">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="البحث باسم الطالب أو رقم المكافأة..."
                className="h-10 w-full rounded-xl border border-input bg-background pr-9 pl-3 text-xs font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <select 
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold cursor-pointer outline-none focus:border-primary"
                value={filterGrade}
                onChange={e => {
                  setFilterGrade(e.target.value);
                  setFilterSection("");
                }}
              >
                <option value="">جميع الصفوف</option>
                {uniqueGrades.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <select 
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold cursor-pointer outline-none focus:border-primary disabled:opacity-50"
                value={filterSection}
                onChange={e => setFilterSection(e.target.value)}
                disabled={!filterGrade}
              >
                <option value="">جميع الشُعب</option>
                {activeStageSections.filter(s => !filterGrade || s.grade === filterGrade).map((s) => (
                  <option key={s.id} value={s.id}>شعبة {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold cursor-pointer outline-none focus:border-primary"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="">جميع مجالات التميز</option>
                {allDisciplineCategories.filter(c => c.defaultPoints > 0).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <input 
                type="date" 
                className="h-10 w-full rounded-xl border border-input bg-background px-2.5 text-xs font-bold outline-none focus:border-primary" 
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                title="من تاريخ"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <PageCard>
          <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-foreground">جدول المكافآت ونقاط التميز المقيدة ({filtered.length})</h2>
                <p className="text-xs text-muted-foreground">تكريمات الطلاب المتميزين وتعزيز روح المبادرة الإيجابية</p>
              </div>
            </div>
          </div>

          <DataTable
            rows={filtered}
            columns={[
              { 
                key: "id", 
                header: "الرقم", 
                cell: (r) => (
                  <span className="font-mono font-bold text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">
                    #{r.id}
                  </span>
                ) 
              },
              { 
                key: "date", 
                header: "تاريخ المنح", 
                cell: (r) => <span className="tabular-nums font-bold text-xs">{r.date}</span> 
              },
              { 
                key: "student", 
                header: "اسم الطالب", 
                cell: (r) => (
                  <div>
                    <div className="font-black text-xs text-foreground">{r.studentName}</div>
                    <div className="text-[10px] text-muted-foreground font-semibold">
                      {r.grade} • شعبة ({r.sectionName})
                    </div>
                  </div>
                ) 
              },
              { 
                key: "category", 
                header: "سبب التميز والمكافأة", 
                cell: (r) => (
                  <Badge tone="success">
                    {r.categoryName}
                  </Badge>
                ) 
              },
              { 
                key: "points", 
                header: "النقاط المكتسبة", 
                cell: (r) => (
                  <span className="font-black text-base text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +{r.points} <span className="text-[10px] text-muted-foreground font-bold">نقطة</span>
                  </span>
                ) 
              },
              { 
                key: "desc", 
                header: "الملاحظات والبيان", 
                cell: (r) => (
                  <div className="max-w-md">
                    <div className="text-xs font-semibold text-foreground leading-snug">{r.reason}</div>
                  </div>
                ) 
              },
              {
                key: "actions",
                header: "الإجراءات",
                cell: (r) => (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDeleteMeritId(r.id)}
                      className="h-8 w-8 rounded-xl border border-destructive/30 hover:bg-destructive/10 text-destructive flex items-center justify-center transition-all cursor-pointer"
                      title="إلغاء وحذف المكافأة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              }
            ]}
            empty={`لا توجد مكافآت أو نقاط تميز مسجلة مطابقة لخيارات الفلترة.`}
          />
        </PageCard>
      </div>

      {/* 1. Standardized Modal: Add New Merit Award */}
      {isModalOpen && (
        <AdminModal
          isOpen={true}
          onClose={() => { setIsModalOpen(false); reset(); }}
          title="منح مكافأة ونقاط تميز سلوكي"
          subtitle={`تسجيل سلوك إيجابي وتعزيز تميز الطالب بالنقاط التحفيزية (${getStageLabel(stage)})`}
          icon={Sparkles}
          tone="success"
          size="large"
        >
          <form id="merit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs font-bold">
            <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
              <span className="font-black text-foreground block">1. اختيار الطالب المتميز:</span>
              <ModalStudentGradeSectionFilter
                grades={uniqueGrades}
                selectedGrade={modalGrade}
                onSelectGrade={setModalGrade}
                sections={activeStageSections}
                selectedSectionId={modalSection}
                onSelectSectionId={setModalSection}
                onReset={() => { setModalGrade(""); setModalSection(""); }}
              />

              <div>
                <label className="mb-1.5 block text-foreground">
                  اسم الطالب المتميز <span className="text-destructive">*</span>
                  {modalGrade && <span className="text-emerald-600 mr-1">({modalStudentOptions.length} طالب مطابق)</span>}
                </label>
                <Controller
                  name="studentId"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={modalStudentOptions}
                      placeholder={modalGrade ? `-- اختر الطالب من ${modalGrade} --` : "-- اختر الطالب المتميز --"}
                      searchPlaceholder="ابحث باسم الطالب أو رقمه..."
                    />
                  )}
                />
                {errors.studentId && <p className="mt-1 text-xs font-bold text-destructive">{errors.studentId.message}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-foreground">سبب التميز أو المكافأة <span className="text-destructive">*</span></label>
              <select
                {...register("categoryId")}
                className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-xs font-bold text-foreground outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">-- اختر نوع التميز أو المكافأة --</option>
                {allDisciplineCategories.filter(c => c.defaultPoints > 0).map(c => (
                  <option key={c.id} value={c.id}>{c.name} (+{c.defaultPoints} نقطة)</option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-xs font-bold text-destructive">{errors.categoryId.message}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-foreground">تفاصيل إضافية حول التميز أو الإشادة (اختياري)</label>
              <textarea
                {...register("description")}
                className="w-full rounded-xl border border-input bg-background p-3.5 text-xs font-medium outline-none focus:border-emerald-500 resize-none custom-scrollbar"
                rows={3}
                placeholder="ملاحظات تفصيلية أو إشادة خاصة حول الموقف الإيجابي أو المشاركة المتميزة..."
              />
              {errors.description && <p className="mt-1 text-xs font-bold text-destructive">{errors.description.message}</p>}
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); reset(); }}
                className="h-10 px-5 rounded-xl border border-input text-xs font-bold hover:bg-muted transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="h-10 px-7 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-md glow-success hover:bg-emerald-700 transition-all cursor-pointer active:scale-95"
              >
                منح المكافأة وتثبيت النقاط
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* 2. Standardized Modal: Delete Merit Confirmation */}
      {deleteMeritId && (
        <AdminModal
          isOpen={true}
          onClose={() => setDeleteMeritId(null)}
          title="تأكيد إلغاء وحذف المكافأة السلوكية"
          subtitle={`سيتم حذف السجل رقم #${deleteMeritId} وخصم النقاط التحفيزية الممنوحة مسبقاً`}
          icon={Trash2}
          tone="danger"
          size="small"
        >
          <div className="space-y-4 text-xs font-bold">
            <p className="text-muted-foreground leading-relaxed">
              هل أنت متأكد من رغبتك في شطب هذه المكافأة؟ سيتم التراجع عن إضافة النقاط فورياً وتحديث ملف الطالب السلوكي.
            </p>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setDeleteMeritId(null)}
                className="h-10 px-5 rounded-xl border border-input text-xs font-bold hover:bg-muted transition-all cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleDeleteMerit}
                className="h-10 px-6 rounded-xl bg-destructive text-destructive-foreground text-xs font-black shadow-md glow-destructive hover:bg-destructive/90 transition-all cursor-pointer active:scale-95"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title={`سجل المكافآت ونقاط التميز - ${getStageLabel(stage)}`}
        data={filtered}
        templates={printTemplates} 
      />
    </AppShell>
  );
}
