import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { 
  AlertCircle, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  ShieldAlert, 
  Trash2, 
  User, 
  Calendar, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  ArrowDownRight,
  TrendingDown,
  Info
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

export const Route = createFileRoute("/discipline/incidents")({
  head: () => ({
    meta: [
      { title: "سجل المخالفات والحوادث السلوكية | منصة مدارس" },
      { name: "description", content: "توثيق المخالفات السلوكية، حسم النقاط التأديبية، إصدار الإنذارات وإشعار أولياء الأمور" }
    ],
  }),
  component: DisciplineIncidents,
});

const incidentSchema = z.object({
  studentId: z.string().min(1, "الرجاء اختيار الطالب"),
  categoryId: z.string().min(1, "الرجاء تحديد تصنيف السلوك"),
  description: z.string().min(5, "الرجاء وصف الحالة بالتفصيل (5 أحرف على الأقل)"),
  location: z.string().optional(),
  actionTaken: z.string().optional(),
});

type IncidentForm = z.infer<typeof incidentSchema>;

function DisciplineIncidents() {
  const { 
    allBehaviorTransactions, 
    allDisciplineCategories, 
    activeStageStudents, 
    activeStageSections, 
    addDisciplineIncident, 
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

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [deleteIncidentId, setDeleteIncidentId] = useState<string | null>(null);

  // Student filter inside creation modal
  const [modalGrade, setModalGrade] = useState("");
  const [modalSection, setModalSection] = useState("");

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<IncidentForm>({
    resolver: zodResolver(incidentSchema),
    defaultValues: { studentId: "", categoryId: "", description: "", location: "", actionTaken: "" },
  });

  const onSubmit = (data: IncidentForm) => {
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
      toast.error("تصنيف السلوك المختار غير صالح");
      return;
    }

    const studentObj = activeStageStudents.find(s => s.id === data.studentId);

    // 1. Create the Incident
    addDisciplineIncident({
      studentEnrollmentId: enrollment.id,
      date: new Date().toISOString().split("T")[0],
      location: data.location || "الفصل الدراسي",
      description: data.description,
      responsiblePerson: "وكيل شؤون الطلاب",
      actionTaken: data.actionTaken || "إنذار وتوثيق في الملف السلوكي"
    });

    // 2. Create the Ledger Transaction (Negative Points)
    addBehaviorTransaction({
      studentEnrollmentId: enrollment.id,
      type: "negative",
      points: category.defaultPoints < 0 ? category.defaultPoints : -Math.abs(category.defaultPoints),
      categoryId: category.id,
      reason: data.description,
      createdBy: "وكيل شؤون الطلاب",
      date: new Date().toISOString().split("T")[0],
    });

    addActivityLog({
      user: "وكيل شؤون الطلاب",
      action: "تسجيل مخالفة سلوكية",
      entity: "الانضباط والسلوك",
      details: `تم توثيق مخالفة (${category.name}) بحق الطالب (${studentObj?.name || data.studentId}) وخصم ${category.defaultPoints} نقطة`,
    });

    toast.success("تم تسجيل الواقعة السلوكية وخصم النقاط بنجاح", {
      description: `تم توثيق الحادثة في السجل الرقمي للطالب ${studentObj?.name || ""}`
    });

    setIsModalOpen(false);
    reset();
    setModalGrade("");
    setModalSection("");
  };

  const handleDeleteIncident = () => {
    if (!deleteIncidentId) return;
    deleteBehaviorTransaction(deleteIncidentId);
    addActivityLog({
      user: "وكيل شؤون الطلاب",
      action: "إلغاء مخالفة سلوكية",
      entity: "الانضباط والسلوك",
      details: `تم إلغاء الواقعة السلوكية رقم #${deleteIncidentId} واسترجاع النقاط المحسومة`,
    });
    toast.success("تم إلغاء الواقعة السلوكية واسترجاع النقاط لسجل الطالب");
    setDeleteIncidentId(null);
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
      if (tx.type !== "negative") return false;

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
        categoryName: category?.name || "مخالفة عامة",
        grade: student.grade,
        sectionName: section?.name || "عامة",
        studentId: student.id,
        nationalId: student.nationalId || "—"
      };
    });
  }, [q, filterCategory, filterDateFrom, filterDateTo, filterGrade, filterSection, allBehaviorTransactions, activeStageStudents, allStudentEnrollments, allDisciplineCategories, activeStageSections]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalIncidents = filtered.length;
    const totalPointsLost = filtered.reduce((sum, tx) => sum + Math.abs(tx.points), 0);
    const affectedStudentsCount = new Set(filtered.map(tx => tx.studentName)).size;
    const highRiskStudents = filtered.filter(tx => Math.abs(tx.points) >= 10).length;

    return {
      totalIncidents,
      totalPointsLost,
      affectedStudentsCount,
      highRiskStudents
    };
  }, [filtered]);

  const printTemplates: PrintTemplate[] = [
    {
      id: "incidents-list",
      name: "سجل المخالفات السلوكية المعتمد",
      category: "السلوك والمواظبة",
      type: "table",
      description: "كشف حصر كامل للحوادث والمخالفات السلوكية المسجلة للطلاب",
      columns: [
        { label: "رقم القيد", key: "id" },
        { label: "تاريخ الواقعة", key: "date" },
        { label: "اسم الطالب", key: "studentName" },
        { label: "الصف والشعبة", key: "grade", render: (r) => `${r.grade} (${r.sectionName})` },
        { label: "تصنيف المخالفة", key: "categoryName" },
        { label: "النقاط المحسومة", key: "points", render: (r) => `${r.points} نقطة` },
        { label: "تفاصيل الواقعة", key: "reason" },
      ]
    },
    {
      id: "formal-parent-warning",
      name: "إشعار إنذار سلوكي لولي الأمر",
      category: "الخطابات والإنذارات",
      type: "document",
      description: "خطاب رسمي موجه لولي الأمر لإشعاره بالمخالفة السلوكية المرتكبة",
      renderDocument: (item: any) => {
        const rec = item || filtered[0] || {};
        return (
          <div className="p-8 bg-white text-gray-900 border-2 border-gray-800 rounded-2xl space-y-6" dir="rtl">
            <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4">
              <div className="text-right text-xs">
                <p className="font-black text-primary">المملكة العربية السعودية</p>
                <p className="font-bold">وزارة التعليم • منصة مدارس النموذجية</p>
                <p className="text-gray-600">إدارة التوجيه الطلابي ورعاية السلوك</p>
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-black text-rose-700">إشعار مخالفة سلوكية وإنذار رسمي</h1>
                <p className="text-xs font-bold text-gray-700 mt-1">الرقم المرجعي: {rec.id || "DI-OFFICIAL"}</p>
              </div>
              <div className="text-left text-xs font-bold">
                <div>التاريخ: {rec.date || new Date().toISOString().slice(0, 10)}</div>
                <div>المرحلة: {getStageLabel(stage)}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-300 bg-gray-50 text-xs font-bold space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>المكرم ولي أمر الطالب: <span className="font-black text-base">{rec.studentName || "—"}</span></div>
                <div>الصف والشعبة: <span className="font-black">{rec.grade || "—"} - {rec.sectionName || "—"}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1 border-t border-gray-200">
                <div>تصنيف المخالفة: <span className="text-rose-600 font-black">{rec.categoryName || "—"}</span></div>
                <div>مقدار الحسم: <span className="text-rose-600 font-black">{rec.points || 0} نقطة سلوكية</span></div>
              </div>
            </div>

            <div className="text-xs leading-relaxed space-y-2 font-medium">
              <p>السلام عليكم ورحمة الله وبركاته،، وبعد:</p>
              <p>
                نحيطكم علماً بأنه قد تم رصد الواقعة السلوكية التالية على ابنكم الطالب، وحرصاً منا على مصلحته التربوية والتعليمية، نرجو التكرم بالاطلاع والمتابعة:
              </p>
              <div className="p-4 rounded-lg bg-rose-50/50 border border-rose-200 font-bold text-gray-800">
                بيان الواقعة: {rec.reason || "عدم الالتزام بقواعد السلوك والمواظبة المدرسية المقررة."}
              </div>
              <p className="text-gray-600 text-[11px]">
                نأمل التعاون معنا لتوجيه الطالب وتفادي تكرار مثل هذا السلوك مستقبلاً وفقاً للائحة السلوك والمواظبة الوزارية.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs font-bold border-t border-gray-800">
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
                <div className="h-12 w-12 mx-auto rounded-full border border-dashed border-gray-400 mt-2" />
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
        { label: "سجل المخالفات والحوادث السلوكية" },
      ]}
    >
      <div className="space-y-6">
        
        {/* Unified Subnavigation Ribbon */}
        <AttendanceDisciplineNav
          activeTab="incidents"
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
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-destructive text-destructive-foreground px-4 text-xs font-black hover:bg-destructive/90 transition-all shadow-sm shadow-destructive/20 active:scale-95 cursor-pointer glow-destructive"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>تسجيل واقعة سلوكية</span>
              </button>
            </div>
          }
        />

        {/* 4 Interactive KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold">إجمالي المخالفات المسجلة</span>
              <ShieldAlert className="w-4 h-4 text-destructive" />
            </div>
            <div className="text-2xl font-black text-foreground tabular-nums">
              {stats.totalIncidents} <span className="text-xs font-bold text-muted-foreground">واقعة</span>
            </div>
            <div className="text-[11px] text-muted-foreground font-medium">سجلات مرحلة {getStageLabel(stage)}</div>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold">إجمالي النقاط المحسومة</span>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-destructive tabular-nums">
              -{stats.totalPointsLost} <span className="text-xs font-bold text-muted-foreground">نقطة</span>
            </div>
            <div className="text-[11px] text-muted-foreground font-medium">حسم تراكمي من السجل السلوكي</div>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold">الطلاب المتأثرون</span>
              <User className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-foreground tabular-nums">
              {stats.affectedStudentsCount} <span className="text-xs font-bold text-muted-foreground">طالب</span>
            </div>
            <div className="text-[11px] text-muted-foreground font-medium">
              من إجمالي {activeStageStudents.length} طالب بالمرحلة
            </div>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-bold">مخالفات عالية الحرج</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-600 tabular-nums">
              {stats.highRiskStudents} <span className="text-xs font-bold text-muted-foreground">حالة</span>
            </div>
            <div className="text-[11px] text-rose-600/80 font-bold">حسمت 10 نقاط أو أكثر دفعة واحدة</div>
          </div>
        </div>

        {/* Enhanced Multi-Filter Ribbon */}
        <div className="bg-card p-4 sm:p-5 rounded-3xl border border-border/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <h3 className="font-black text-xs text-foreground">تصفية وبحث في سجل الحوادث السلوكية</h3>
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
                placeholder="البحث باسم الطالب أو رقم الواقعة..."
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
                <option value="">جميع التصنيفات</option>
                {allDisciplineCategories.filter(c => c.defaultPoints < 0).map(c => (
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
              <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-foreground">جدول المخالفات السلوكية المقيدة ({filtered.length})</h2>
                <p className="text-xs text-muted-foreground">سجلات الوقائع الرسمية والإجراءات التأديبية المتخذة</p>
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
                header: "تاريخ الواقعة", 
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
                header: "تصنيف المخالفة", 
                cell: (r) => (
                  <Badge tone="danger">
                    {r.categoryName}
                  </Badge>
                ) 
              },
              { 
                key: "points", 
                header: "النقاط المحسومة", 
                cell: (r) => (
                  <span className="font-black text-base text-destructive tabular-nums">
                    {r.points} <span className="text-[10px] text-muted-foreground font-bold">نقطة</span>
                  </span>
                ) 
              },
              { 
                key: "desc", 
                header: "التفاصيل والإجراء", 
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
                      onClick={() => setDeleteIncidentId(r.id)}
                      className="h-8 w-8 rounded-xl border border-destructive/30 hover:bg-destructive/10 text-destructive flex items-center justify-center transition-all cursor-pointer"
                      title="إلغاء وحذف الواقعة السلوكية"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              }
            ]}
            empty={`لا توجد حوادث سلوكية مطابقة لخيارات الفلترة المحددة.`}
          />
        </PageCard>
      </div>

      {/* 1. Standardized Modal: Add New Incident */}
      {isModalOpen && (
        <AdminModal
          isOpen={true}
          onClose={() => { setIsModalOpen(false); reset(); }}
          title="تسجيل واقعة ومخالفة سلوكية جديدة"
          subtitle={`توثيق المخالفة، حسم النقاط السلوكية، وتحديد الإجراءات المتخذة (${getStageLabel(stage)})`}
          icon={ShieldAlert}
          tone="danger"
          size="large"
        >
          <form id="incident-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs font-bold">
            <div className="p-3.5 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-3">
              <span className="font-black text-foreground block">1. تحديد الطالب المعني بالمخالفة:</span>
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
                  اسم الطالب <span className="text-destructive">*</span>
                  {modalGrade && <span className="text-primary mr-1">({modalStudentOptions.length} طالب مطابق)</span>}
                </label>
                <Controller
                  name="studentId"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={modalStudentOptions}
                      placeholder={modalGrade ? `-- اختر الطالب من ${modalGrade} --` : "-- اختر الطالب المعني --"}
                      searchPlaceholder="ابحث باسم الطالب أو رقمه..."
                    />
                  )}
                />
                {errors.studentId && <p className="mt-1 text-xs font-bold text-destructive">{errors.studentId.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="mb-1.5 block text-foreground">تصنيف الواقعة والمخالفة <span className="text-destructive">*</span></label>
                <select
                  {...register("categoryId")}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-xs font-bold text-foreground outline-none focus:border-destructive cursor-pointer"
                >
                  <option value="">-- اختر التصنيف السلوكي --</option>
                  {allDisciplineCategories.filter(c => c.defaultPoints < 0).map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.defaultPoints} نقطة)</option>
                  ))}
                </select>
                {errors.categoryId && <p className="mt-1 text-xs font-bold text-destructive">{errors.categoryId.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-foreground">مكان حدوث الواقعة</label>
                <input
                  {...register("location")}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-xs font-bold outline-none focus:border-destructive"
                  placeholder="مثال: داخل الفصل، الساحة، المعمل، الحافلة..."
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-foreground">الإجراء المتخذ بحق الطالب</label>
              <input
                {...register("actionTaken")}
                className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-xs font-bold outline-none focus:border-destructive"
                placeholder="مثال: إنذار شفوي، أخذ تعهد، استدعاء ولي الأمر، حرمان من نشاط..."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-foreground">وصف تفصيلي للواقعة وملابساتها <span className="text-destructive">*</span></label>
              <textarea
                {...register("description")}
                className="w-full rounded-xl border border-input bg-background p-3.5 text-xs font-medium outline-none focus:border-destructive resize-none custom-scrollbar"
                rows={3}
                placeholder="تفاصيل دقيقة حول الواقعة السلوكية والظروف المحيطة وتكرار الحادثة..."
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
                className="h-10 px-7 rounded-xl bg-destructive text-destructive-foreground text-xs font-black shadow-md glow-destructive hover:bg-destructive/90 transition-all cursor-pointer active:scale-95"
              >
                حفظ الواقعة وحسم النقاط
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {/* 2. Standardized Modal: Delete Incident Confirmation */}
      {deleteIncidentId && (
        <AdminModal
          isOpen={true}
          onClose={() => setDeleteIncidentId(null)}
          title="تأكيد إلغاء وحذف الواقعة السلوكية"
          subtitle={`سيتم حذف السجل رقم #${deleteIncidentId} وإعادة النقاط المحسومة لرصيد الطالب السلوكي`}
          icon={Trash2}
          tone="danger"
          size="small"
        >
          <div className="space-y-4 text-xs font-bold">
            <p className="text-muted-foreground leading-relaxed">
              هل أنت متأكد من رغبتك في شطب هذه الواقعة؟ سيتم التراجع عن حسم النقاط فورياً وتحديث ملف الطالب التأديبي.
            </p>
            <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setDeleteIncidentId(null)}
                className="h-10 px-5 rounded-xl border border-input text-xs font-bold hover:bg-muted transition-all cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleDeleteIncident}
                className="h-10 px-6 rounded-xl bg-destructive text-destructive-foreground text-xs font-black shadow-md glow-destructive hover:bg-destructive/90 transition-all cursor-pointer active:scale-95"
              >
                تأكيد الحذف واسترجاع النقاط
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title={`سجل الحوادث السلوكية المعتمد - ${getStageLabel(stage)}`}
        data={filtered}
        templates={printTemplates} 
      />
    </AppShell>
  );
}
