import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import {
  BookOpen,
  Search,
  Check,
  X,
  AlertCircle,
  Filter,
  Warehouse,
  Layers,
  Users,
  Printer,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Package,
  Layers3,
  BookmarkCheck
} from "lucide-react";
import { useState, useMemo } from "react";
import { useGlobalStore, Textbook, TextbookDistribution } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { getGradesForStage } from "@/lib/school-structure";
import { toast } from "sonner";

export const Route = createFileRoute("/library/distribution")({
  component: LibraryDistribution,
});

function LibraryDistribution() {
  const {
    activeStageStudents,
    activeStageTextbooks,
    activeStageDistributions,
    allInventoryItems,
    distributeTextbook,
    distributeBatchToSection,
    removeDistribution,
    allSections,
  } = useGlobalStore();

  const { stage, getStageLabel } = useStage();

  // Filters state
  const [q, setQ] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [filterTerm, setFilterTerm] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "complete" | "partial" | "missing">("all");

  // Selected student for drawer / modal
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [modalActiveTerm, setModalActiveTerm] = useState<string>("الفصل الأول");

  // Batch distribution modal state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchGrade, setBatchGrade] = useState<string>("");
  const [batchSectionId, setBatchSectionId] = useState<string>("");
  const [batchTerm, setBatchTerm] = useState<string>("الفصل الأول");

  // Printable receipt modal state
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptStudent, setReceiptStudent] = useState<any | null>(null);

  const grades = useMemo(() => getGradesForStage(stage), [stage]);

  // Active sections filtered by grade if selected
  const availableSections = useMemo(() => {
    return allSections.filter(
      s => s.stage === stage && (filterGrade === "all" || s.grade === filterGrade)
    );
  }, [allSections, stage, filterGrade]);

  // Helper to get required books for a student
  const getRequiredBooks = (student: any) => {
    return activeStageTextbooks.filter(tb => {
      const gradeMatches = tb.gradeId === student.grade || tb.grade === student.grade;
      const termMatches = filterTerm === "all" ? true : (!tb.term || tb.term === filterTerm || tb.term === "all");
      return gradeMatches && termMatches;
    });
  };

  const getReceivedBooks = (student: any) => {
    return activeStageDistributions.filter(d => {
      if (d.studentId !== student.id) return false;
      if (filterTerm === "all") return true;
      return !d.term || d.term === filterTerm || d.term === "all";
    });
  };

  const getProgress = (student: any) => {
    const required = getRequiredBooks(student);
    const received = getReceivedBooks(student);
    const requiredCount = required.length;
    const receivedCount = received.filter(dist => required.some(b => b.id === dist.textbookId)).length;
    const percentage = requiredCount > 0 ? Math.round((receivedCount / requiredCount) * 100) : 0;
    const status = requiredCount === 0 ? "none" : receivedCount >= requiredCount ? "complete" : receivedCount > 0 ? "partial" : "missing";
    return { requiredCount, receivedCount, percentage, status };
  };

  // Filtered students list
  const filteredStudents = useMemo(() => {
    return activeStageStudents.filter((s) => {
      if (filterGrade !== "all" && s.grade !== filterGrade) return false;
      if (filterSection !== "all" && s.sectionId !== filterSection) return false;
      const progress = getProgress(s);
      if (filterStatus !== "all" && progress.status !== filterStatus) return false;
      if (q) {
        const query = q.toLowerCase();
        const matchName = s.name?.toLowerCase().includes(query);
        const matchId = s.id?.toLowerCase().includes(query);
        const matchNational = s.nationalId?.includes(query);
        const matchGuardian = s.guardianName?.toLowerCase().includes(query);
        if (!matchName && !matchId && !matchNational && !matchGuardian) return false;
      }
      return true;
    });
  }, [q, filterGrade, filterSection, filterTerm, filterStatus, activeStageStudents, activeStageTextbooks, activeStageDistributions]);

  // Real-time metrics
  const stats = useMemo(() => {
    const rows = activeStageStudents.map(getProgress);
    const total = rows.length;
    const complete = rows.filter(item => item.status === "complete").length;
    const partial = rows.filter(item => item.status === "partial").length;
    const missing = rows.filter(item => item.status === "missing").length;

    // Warehouse inventory books metrics
    const textbookInventory = allInventoryItems.filter(i => i.category === "كتب ومقررات دراسية");
    const totalWarehouseStock = textbookInventory.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalDistributed = activeStageDistributions.length;

    return {
      total,
      complete,
      partial,
      missing,
      completeRate: total > 0 ? Math.round((complete / total) * 100) : 0,
      totalWarehouseStock,
      totalDistributed,
    };
  }, [activeStageStudents, activeStageTextbooks, activeStageDistributions, allInventoryItems, filterTerm]);

  // Handle single book give or return
  const handleToggleTextbook = (textbook: Textbook, action: 'give' | 'return', distributionId?: string) => {
    if (!selectedStudent) return;

    if (action === 'return' && distributionId) {
      removeDistribution(distributionId);
      toast.success(`تم استرجاع نسخة "${textbook.title}" إلى المستودع بنجاح`);
    } else if (action === 'give') {
      // Find matching inventory item stock
      const invItem = allInventoryItems.find(i => (textbook.inventoryItemId && i.id === textbook.inventoryItemId) || i.name.includes(textbook.title));
      if (invItem && invItem.quantity <= 0) {
        toast.error(`عذراً، نفد المخزون من كتاب "${textbook.title}" في المستودع المركزي!`);
        return;
      }

      distributeTextbook({
        studentId: selectedStudent.id,
        textbookId: textbook.id,
        stage: selectedStudent.stage || stage,
        term: textbook.term || modalActiveTerm,
        academicYearId: selectedStudent.academicYearId,
        condition: "جديد",
        issuedBy: "أمين المستودع المدرسي",
        receivedByGuardian: true,
      });
      toast.success(`تم تسليم كتاب "${textbook.title}" للطالب وتحديث رصيد المستودع`);
    }
  };

  // Deliver all missing for selected student
  const deliverAllMissingForStudent = () => {
    if (!selectedStudent) return;
    const studentBooks = activeStageTextbooks.filter(tb => {
      const gradeMatches = tb.gradeId === selectedStudent.grade || tb.grade === selectedStudent.grade;
      const termMatches = modalActiveTerm === "all" ? true : (!tb.term || tb.term === modalActiveTerm || tb.term === "all");
      return gradeMatches && termMatches;
    });

    const missing = studentBooks.filter(tb => 
      !activeStageDistributions.some(d => d.studentId === selectedStudent.id && d.textbookId === tb.id)
    );

    if (missing.length === 0) {
      toast.info("جميع المقررات المحددة مستلمة بالفعل لهذا الطالب!");
      return;
    }

    let count = 0;
    missing.forEach(tb => {
      distributeTextbook({
        studentId: selectedStudent.id,
        textbookId: tb.id,
        stage: selectedStudent.stage || stage,
        term: tb.term || modalActiveTerm,
        academicYearId: selectedStudent.academicYearId,
        condition: "جديد",
        issuedBy: "أمين المستودع المدرسي",
        receivedByGuardian: true,
      });
      count++;
    });

    toast.success(`تم تسليم ${count} مقررات دراسية دفعة واحدة وتحديث المستودع!`);
  };

  // Return all received for selected student
  const returnAllReceivedForStudent = () => {
    if (!selectedStudent) return;
    const received = activeStageDistributions.filter(d => d.studentId === selectedStudent.id);
    if (received.length === 0) {
      toast.info("لا توجد كتب مستلمة مسجلة في عهدة الطالب لإرجاعها.");
      return;
    }

    if (confirm(`هل أنت متأكد من استرجاع كافة عهدة الكتب (${received.length} كتب) للطالب وإعادتها للمستودع؟`)) {
      received.forEach(item => removeDistribution(item.id));
      toast.success(`تم استرجاع ${received.length} كتب إلى رصيد المستودع المركزي`);
    }
  };

  // Quick 1-click deliver all for a student from the table
  const quickDeliverStudent = (student: any) => {
    const studentBooks = activeStageTextbooks.filter(tb => tb.gradeId === student.grade || tb.grade === student.grade);
    const missing = studentBooks.filter(tb => !activeStageDistributions.some(d => d.studentId === student.id && d.textbookId === tb.id));

    if (missing.length === 0) {
      toast.info(`جميع المقررات مستلمة مسبقاً للطالب ${student.name}`);
      return;
    }

    let count = 0;
    missing.forEach(tb => {
      distributeTextbook({
        studentId: student.id,
        textbookId: tb.id,
        stage: student.stage || stage,
        term: tb.term || "الفصل الأول",
        academicYearId: student.academicYearId,
        condition: "جديد",
        issuedBy: "أمين المستودع المدرسي",
        receivedByGuardian: true,
      });
      count++;
    });

    toast.success(`تم صرف وتسليم ${count} كتب دراسية للطالب ${student.name}`);
  };

  // Execute Batch Section Handover
  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchSectionId) {
      toast.error("يرجى اختيار الشعبة الدراسية أولاً!");
      return;
    }

    const result = distributeBatchToSection(batchSectionId, batchTerm);
    if (result.distributedCount > 0) {
      toast.success(`تم بنجاح صرف وتسليم ${result.distributedCount} كتاباً لـ ${result.studentCount} طالباً وتحديث المستودع!`);
      setIsBatchModalOpen(false);
    } else {
      toast.info("لم يتم صرف أي كتب جديدة؛ ربما تم تسليم كافة المقررات لجميع طلاب هذه الشعبة مسبقاً.");
      setIsBatchModalOpen(false);
    }
  };

  // Textbooks for selected student in drawer
  const studentTextbooks = useMemo(() => {
    if (!selectedStudent) return [];
    return activeStageTextbooks.filter(tb => tb.gradeId === selectedStudent.grade || tb.grade === selectedStudent.grade);
  }, [selectedStudent, activeStageTextbooks]);

  const modalFilteredBooks = useMemo(() => {
    if (modalActiveTerm === "all") return studentTextbooks;
    return studentTextbooks.filter(tb => !tb.term || tb.term === modalActiveTerm || tb.term === "all");
  }, [studentTextbooks, modalActiveTerm]);

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المرافق والخدمات" },
        { label: "توزيع الكتب والمقررات" },
      ]}
    >
      <div className="space-y-6 pb-12">
        {/* Top Header Card */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/95 to-primary/5 p-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 ring-4 ring-primary/10">
                <BookOpen className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-black tracking-tight text-foreground">
                    إدارة وتوزيع المقررات والكتب المدرسية
                  </h1>
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-xs font-black text-primary">
                    {getStageLabel(stage)}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  تكامل حي ولحظي بين المستودع المدرسي المركزي، الفصول والشعب، وسندات التسليم بملفات الطلاب
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/inventory/items"
                className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-background/80 px-4 py-2.5 text-xs font-extrabold text-foreground shadow-sm transition-all hover:border-primary/50 hover:bg-accent active:scale-[0.98]"
              >
                <Warehouse className="h-4 w-4 text-primary" />
                <span>رصيد المستودع المركزي</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setBatchGrade(filterGrade !== "all" ? filterGrade : (grades[0] || ""));
                  setBatchSectionId(filterSection !== "all" ? filterSection : (availableSections[0]?.id || ""));
                  setIsBatchModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary/90 px-5 py-2.5 text-xs font-black text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:opacity-95 active:scale-[0.98]"
              >
                <Sparkles className="h-4 w-4" />
                <span>تسليم حزمة لشعبة كاملة</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-time KPI Metric Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur-md transition-all hover:border-primary/40">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-black">إجمالي الطلاب</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-3xl font-black text-foreground">{stats.total}</p>
            <p className="mt-1 text-[11px] font-bold text-muted-foreground">في المرحلة المحددة</p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm backdrop-blur-md transition-all hover:border-emerald-500/40">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="text-xs font-black">مكتمل التسليم 100%</span>
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.complete}</p>
            <p className="mt-1 text-[11px] font-black text-emerald-600/80 dark:text-emerald-400/80">
              نسبة الإنجاز {stats.completeRate}%
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm backdrop-blur-md transition-all hover:border-amber-500/40">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
              <span className="text-xs font-black">تسليم جزئي</span>
              <Clock className="h-4 w-4" />
            </div>
            <p className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400">{stats.partial}</p>
            <p className="mt-1 text-[11px] font-bold text-amber-600/80 dark:text-amber-400/80">متبقي بعض المقررات</p>
          </div>

          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 shadow-sm backdrop-blur-md transition-all hover:border-rose-500/40">
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
              <span className="text-xs font-black">لم يستلموا بعد</span>
              <AlertCircle className="h-4 w-4" />
            </div>
            <p className="mt-2 text-3xl font-black text-rose-600 dark:text-rose-400">{stats.missing}</p>
            <p className="mt-1 text-[11px] font-bold text-rose-600/80 dark:text-rose-400/80">قيد الحجز في المستودع</p>
          </div>

          <div className="col-span-2 rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm backdrop-blur-md md:col-span-4 lg:col-span-1">
            <div className="flex items-center justify-between text-primary">
              <span className="text-xs font-black">رصيد المستودع الفعلي</span>
              <Warehouse className="h-4 w-4" />
            </div>
            <p className="mt-2 text-3xl font-black text-primary">{stats.totalWarehouseStock}</p>
            <p className="mt-1 text-[11px] font-black text-muted-foreground">
              تم صرف: <span className="text-foreground">{stats.totalDistributed}</span> نسخة
            </p>
          </div>
        </div>

        {/* Unified Grade & Section Control Ribbon */}
        <div className="space-y-4 rounded-3xl border border-border/80 bg-card/80 p-5 shadow-lg backdrop-blur-xl">
          {/* Grade Selector Ribbon */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-xs font-black text-foreground">تصفية حسب الصف الدراسي:</span>
              </div>
              <span className="text-[11px] font-bold text-muted-foreground">
                {filterGrade === "all" ? "يعرض جميع الصفوف" : filterGrade}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              <button
                type="button"
                onClick={() => {
                  setFilterGrade("all");
                  setFilterSection("all");
                }}
                className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                  filterGrade === "all"
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                    : "border border-border/80 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                جميع الصفوف ({activeStageStudents.length})
              </button>
              {grades.map((grade) => {
                const count = activeStageStudents.filter(s => s.grade === grade).length;
                const isSelected = filterGrade === grade;
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => {
                      setFilterGrade(grade);
                      setFilterSection("all");
                    }}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                        : "border border-border/80 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <span>{grade}</span>
                    <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section Selector Ribbon */}
          <div className="border-t border-border/60 pt-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-primary" />
                <span className="text-xs font-black text-foreground">تصفية حسب الشعبة الدراسية:</span>
              </div>
              <span className="text-[11px] font-bold text-muted-foreground">
                {availableSections.length} شعبة متوفرة
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              <button
                type="button"
                onClick={() => setFilterSection("all")}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition-all ${
                  filterSection === "all"
                    ? "bg-foreground text-background shadow-sm scale-[1.02]"
                    : "border border-border/80 bg-background/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                جميع الشعب
              </button>
              {availableSections.map((sec) => {
                const count = activeStageStudents.filter(s => s.sectionId === sec.id).length;
                const isSelected = filterSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setFilterSection(sec.id)}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black transition-all ${
                      isSelected
                        ? "bg-foreground text-background shadow-sm scale-[1.02]"
                        : "border border-border/80 bg-background/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    <span>شعبة {sec.name} ({sec.grade})</span>
                    <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${isSelected ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-Filters: Search, Term & Status */}
          <div className="border-t border-border/60 pt-3 grid gap-3 md:grid-cols-12 items-center">
            <div className="md:col-span-5 relative">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث سريع برقم الهوية، اسم الطالب، أو ولي الأمر..."
                className="h-10 w-full rounded-xl border border-border/80 bg-background/80 ps-10 pe-4 text-xs font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
              />
            </div>

            {/* Term Selector */}
            <div className="md:col-span-4 flex items-center gap-1.5 bg-background/80 p-1 rounded-xl border border-border/80">
              {["all", "الفصل الأول", "الفصل الثاني", "الفصل الثالث"].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setFilterTerm(term)}
                  className={`flex-1 rounded-lg py-1.5 text-[11px] font-black transition-all ${
                    filterTerm === term
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {term === "all" ? "كل الفصول" : term}
                </button>
              ))}
            </div>

            {/* Status Selector */}
            <div className="md:col-span-3 flex items-center gap-1 bg-background/80 p-1 rounded-xl border border-border/80">
              {[
                { id: "all", label: "الكل" },
                { id: "complete", label: "مكتمل" },
                { id: "partial", label: "جزئي" },
                { id: "missing", label: "معلق" },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setFilterStatus(st.id as any)}
                  className={`flex-1 rounded-lg py-1.5 text-[11px] font-black transition-all ${
                    filterStatus === st.id
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Students Handover Table */}
        <PageCard>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-foreground">
                  سجل عهدة وتوزيع الكتب المدرسية ({filteredStudents.length} طالباً)
                </h2>
                <p className="text-xs text-muted-foreground">
                  انقر على "إدارة العهدة" لتفصيل الكتب المستلمة أو طباعة سند التسليم الرسمي
                </p>
              </div>
            </div>

            {filterSection !== "all" && (
              <button
                type="button"
                onClick={() => {
                  const currentSec = allSections.find(s => s.id === filterSection);
                  setBatchGrade(currentSec?.grade || "");
                  setBatchSectionId(filterSection);
                  setIsBatchModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-black text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-sm active:scale-[0.98]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>صرف الحزمة للشعبة الحالية</span>
              </button>
            )}
          </div>

          <DataTable
            rows={filteredStudents}
            columns={[
              {
                key: "name",
                header: "اسم الطالب",
                cell: (r) => (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary/20 to-primary/10 font-black text-primary border border-primary/20">
                      {r.name?.slice(0, 2) || "طالب"}
                    </div>
                    <div>
                      <div className="font-black text-foreground text-sm flex items-center gap-2">
                        <span>{r.name}</span>
                        {r.gender && (
                          <span className="text-[10px] text-muted-foreground px-1.5 py-0.2 rounded bg-muted/60">
                            {r.gender}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground mt-0.5">
                        <span className="tabular-nums">هوية: {r.nationalId || r.id}</span>
                        <span>•</span>
                        <span>كود: {r.id}</span>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                key: "class",
                header: "الصف والشعبة",
                cell: (r) => {
                  const sec = allSections.find(s => s.id === r.sectionId);
                  return (
                    <div>
                      <span className="inline-block rounded-lg bg-muted px-2 py-0.5 text-xs font-black text-foreground">
                        {r.grade}
                      </span>
                      <div className="text-[11px] font-bold text-muted-foreground mt-0.5">
                        {sec ? `شعبة ${sec.name}` : "بدون شعبة"}
                      </div>
                    </div>
                  );
                },
              },
              {
                key: "guardian",
                header: "ولي الأمر والتواصل",
                cell: (r) => (
                  <div>
                    <div className="text-xs font-black text-foreground">{r.guardianName || "غير محدد"}</div>
                    <div className="text-[11px] font-bold text-muted-foreground mt-0.5 tabular-nums" dir="ltr">
                      {r.guardianPhone || "-"}
                    </div>
                  </div>
                ),
              },
              {
                key: "progress",
                header: "حالة استلام المقررات",
                cell: (r) => {
                  const { requiredCount, receivedCount, percentage, status } = getProgress(r);

                  if (requiredCount === 0) {
                    return <span className="text-xs font-bold text-muted-foreground">لا توجد مقررات مسجلة</span>;
                  }

                  const isComplete = status === "complete";
                  const isPartial = status === "partial";

                  return (
                    <div className="flex flex-col gap-1.5 w-40">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-foreground">
                          {receivedCount} من {requiredCount} مقررات
                        </span>
                        <span
                          className={`rounded-md px-1.5 py-0.2 text-[10px] font-black ${
                            isComplete
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : isPartial
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {percentage}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden border border-border/40">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isComplete ? "bg-emerald-500" : isPartial ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                },
              },
              {
                key: "actions",
                header: "الإجراءات والعهدة",
                cell: (r) => {
                  const { status } = getProgress(r);
                  const isComplete = status === "complete";

                  return (
                    <div className="flex items-center justify-end gap-2">
                      {!isComplete && (
                        <button
                          type="button"
                          onClick={() => quickDeliverStudent(r)}
                          title="صرف وتسليم كافة المقررات المتبقية للطالب فوراً"
                          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-black text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-[0.98]"
                        >
                          صرف فوري
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStudent(r);
                          setModalActiveTerm("الفصل الأول");
                        }}
                        className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-black text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-sm active:scale-[0.98]"
                      >
                        إدارة العهدة
                      </button>
                    </div>
                  );
                },
              },
            ]}
            empty="لا يوجد طلاب مطابقون لمعايير البحث الحالية."
          />
        </PageCard>

        {/* Student Handover Drawer / Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury overflow-y-auto animate-in fade-in duration-200">
            <div className="w-full max-w-3xl rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 my-8 flex flex-col max-h-[92vh]">
              {/* Modal Header */}
              <div className="p-6 border-b border-border/50 bg-gradient-to-r from-card via-card/95 to-primary/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground flex items-center justify-center shadow-md shadow-primary/20">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-foreground">
                        ملف عهدة وتوزيع الكتب: {selectedStudent.name}
                      </h2>
                      <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-black border border-primary/20">
                        {selectedStudent.grade}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      رقم الهوية: {selectedStudent.nationalId || selectedStudent.id} • ولي الأمر: {selectedStudent.guardianName || "غير محدد"} ({selectedStudent.guardianPhone || "بدون هاتف"})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar-modal space-y-6">
                {/* Visual Summary Card */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-border/70 bg-card/70 p-3.5 text-center shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground">إجمالي المقررات</p>
                    <p className="mt-1 text-2xl font-black text-foreground">{studentTextbooks.length}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-center shadow-sm">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">الكتب المستلمة</p>
                    <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {getProgress(selectedStudent).receivedCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3.5 text-center shadow-sm">
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">المتبقي للتسليم</p>
                    <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
                      {Math.max(0, studentTextbooks.length - getProgress(selectedStudent).receivedCount)}
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons & Receipt Print */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border/60 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={deliverAllMissingForStudent}
                      className="rounded-xl bg-gradient-to-r from-primary to-primary/90 px-4 py-2 text-xs font-black text-primary-foreground shadow-sm hover:opacity-95 transition-all active:scale-[0.98]"
                    >
                      تسليم كافة المتبقي دفعة واحدة
                    </button>
                    <button
                      type="button"
                      onClick={returnAllReceivedForStudent}
                      className="rounded-xl border border-rose-500/30 px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors active:scale-[0.98]"
                    >
                      استرجاع كل المستلم للمستودع
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setReceiptStudent(selectedStudent);
                      setIsReceiptModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2 text-xs font-black text-foreground shadow-sm hover:bg-accent transition-all active:scale-[0.98]"
                  >
                    <Printer className="h-4 w-4 text-primary" />
                    <span>طباعة سند استلام العهدة</span>
                  </button>
                </div>

                {/* Term Switcher Tabs */}
                <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                  {["الفصل الأول", "الفصل الثاني", "الفصل الثالث", "all"].map((term) => {
                    const isSelected = modalActiveTerm === term;
                    return (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setModalActiveTerm(term)}
                        className={`rounded-xl px-4 py-1.5 text-xs font-black transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        }`}
                      >
                        {term === "all" ? "جميع الفصول" : term}
                      </button>
                    );
                  })}
                </div>

                {/* Textbooks List */}
                {modalFilteredBooks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-muted/15 rounded-2xl border border-dashed border-border/60">
                    <AlertCircle className="h-10 w-10 mx-auto mb-2.5 opacity-40 text-muted-foreground" />
                    <p className="font-bold text-sm">لم يتم ربط مقررات دراسية لهذا الفصل أو الصف بعد.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {modalFilteredBooks.map((tb) => {
                      const distribution = activeStageDistributions.find(
                        d => d.studentId === selectedStudent.id && d.textbookId === tb.id
                      );
                      const isDelivered = !!distribution;

                      // Check warehouse stock
                      const invItem = allInventoryItems.find(
                        i => (tb.inventoryItemId && i.id === tb.inventoryItemId) || i.name.includes(tb.title)
                      );
                      const availableQty = invItem ? invItem.quantity : tb.copies;

                      return (
                        <div
                          key={tb.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all ${
                            isDelivered
                              ? "border-emerald-500/30 bg-emerald-500/5"
                              : "border-border/70 bg-card/70 hover:border-primary/40"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-sm text-foreground">{tb.title}</h4>
                              {tb.edition && (
                                <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-bold text-muted-foreground">
                                  {tb.edition}
                                </span>
                              )}
                              <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                {tb.subject}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span>الفصل: <strong className="text-foreground">{tb.term || "الفصل الأول"}</strong></span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                رصيد المستودع:
                                <strong className={`font-black ${availableQty > 10 ? "text-emerald-600" : availableQty > 0 ? "text-amber-600" : "text-rose-600"}`}>
                                  {availableQty} نسخة
                                </strong>
                              </span>
                              {isDelivered && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-600 font-bold">
                                    تاريخ التسليم: {distribution.date}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 sm:mt-0 flex items-center gap-2 shrink-0">
                            {isDelivered ? (
                              <div className="flex items-center gap-2">
                                <span className="rounded-xl bg-emerald-500/15 border border-emerald-500/20 px-3 py-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                  <Check className="h-4 w-4" />
                                  <span>تم التسليم</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleTextbook(tb, 'return', distribution.id)}
                                  className="rounded-xl border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-500/10 transition-colors active:scale-[0.98]"
                                >
                                  استرجاع
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleTextbook(tb, 'give')}
                                disabled={availableQty <= 0}
                                className={`rounded-xl px-4 py-1.5 text-xs font-black transition-all ${
                                  availableQty > 0
                                    ? "bg-primary text-primary-foreground shadow-sm hover:opacity-95 active:scale-[0.98]"
                                    : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                }`}
                              >
                                {availableQty > 0 ? "تسليم الكتاب" : "نفد بالمستودع"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border/50 flex justify-end shrink-0 bg-muted/10">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="rounded-xl px-5 py-2 text-xs font-bold border border-border/80 hover:bg-accent transition-colors active:scale-[0.98]"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Batch Delivery Modal ("تسليم حزمة لشعبة كاملة") */}
        {isBatchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 flex flex-col">
              <div className="p-6 border-b border-border/50 bg-gradient-to-r from-card via-card/95 to-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground">صرف وتسليم حزمة لشعبة كاملة</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">تسليم موحد لجميع الطلاب وخصم من المستودع</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleBatchSubmit} className="p-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-black text-foreground">الصف الدراسي:</label>
                  <select
                    value={batchGrade}
                    onChange={(e) => {
                      setBatchGrade(e.target.value);
                      const secForGrade = allSections.find(s => s.stage === stage && s.grade === e.target.value);
                      setBatchSectionId(secForGrade ? secForGrade.id : "");
                    }}
                    className="h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm focus:border-primary focus:outline-none"
                  >
                    {grades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-black text-foreground">الشعبة المستهدفة:</label>
                  <select
                    value={batchSectionId}
                    onChange={(e) => setBatchSectionId(e.target.value)}
                    required
                    className="h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm focus:border-primary focus:outline-none"
                  >
                    <option value="">اختر الشعبة...</option>
                    {allSections
                      .filter(s => s.stage === stage && (!batchGrade || s.grade === batchGrade))
                      .map(s => {
                        const count = activeStageStudents.filter(st => st.sectionId === s.id).length;
                        return (
                          <option key={s.id} value={s.id}>
                            شعبة {s.name} ({s.grade}) - {count} طالباً
                          </option>
                        );
                      })}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-black text-foreground">الفصل الدراسي للحزمة:</label>
                  <select
                    value={batchTerm}
                    onChange={(e) => setBatchTerm(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-xs font-bold shadow-sm focus:border-primary focus:outline-none"
                  >
                    <option value="الفصل الأول">الفصل الدراسي الأول</option>
                    <option value="الفصل الثاني">الفصل الدراسي الثاني</option>
                    <option value="الفصل الثالث">الفصل الدراسي الثالث</option>
                  </select>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    <span>تأكيد العملية التلقائية</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    سيقوم النظام بفحص الطلاب المسجلين في الشعبة وصرف المقررات غير المستلمة، مع خصم الكمية الإجمالية مباشرة من رصيد المستودع المدرسي المركزي وإصدار قيود الحركات المخزنية.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsBatchModalOpen(false)}
                    className="rounded-xl border border-border/80 px-4 py-2 text-xs font-bold hover:bg-muted"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-primary px-5 py-2 text-xs font-black text-primary-foreground shadow-md shadow-primary/20 hover:opacity-95 active:scale-[0.98]"
                  >
                    تأكيد وصرف الحزمة
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Printable Official Handover Receipt Modal */}
        {isReceiptModalOpen && receiptStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200">
            <div className="w-full max-w-2xl rounded-3xl modal-card-luxury overflow-hidden shadow-2xl border border-border/80 flex flex-col max-h-[92vh]">
              <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                  <Printer className="h-4 w-4 text-primary" />
                  معاينة وطباعة سند استلام عهدة المقررات
                </h3>
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Printable Document Area */}
              <div id="handover-receipt" className="p-8 overflow-y-auto space-y-6 bg-white text-slate-900 dark:bg-card dark:text-foreground">
                {/* Official School Header */}
                <div className="border-b-2 border-slate-800 dark:border-border pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black tracking-tight">مدارس المنهاج الأهلية النموذجية</h2>
                    <p className="text-xs text-slate-500 dark:text-muted-foreground font-bold">
                      قسم المستودع والوسائل التعليمية • العام الدراسي 2026/2027
                    </p>
                  </div>
                  <div className="text-left text-xs font-bold text-slate-600 dark:text-muted-foreground">
                    <div>التاريخ: {new Date().toLocaleDateString("ar-SA")}</div>
                    <div>الرقم المرجعي: BK-{receiptStudent.id}-{Date.now().toString().slice(-4)}</div>
                  </div>
                </div>

                <div className="text-center py-2">
                  <h3 className="text-base font-black underline underline-offset-8">
                    سند تسليم عهدة الكتب والمقررات المدرسية
                  </h3>
                </div>

                {/* Student Details Box */}
                <div className="rounded-xl border border-slate-300 dark:border-border p-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-500 dark:text-muted-foreground">اسم الطالب: </span>
                    <span className="font-black">{receiptStudent.name}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 dark:text-muted-foreground">رقم الهوية: </span>
                    <span className="font-black tabular-nums">{receiptStudent.nationalId || receiptStudent.id}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 dark:text-muted-foreground">الصف / الشعبة: </span>
                    <span className="font-black">{receiptStudent.grade}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 dark:text-muted-foreground">اسم ولي الأمر: </span>
                    <span className="font-black">{receiptStudent.guardianName || "-"}</span>
                  </div>
                </div>

                {/* Books Received Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black">المقررات والكتب المسلمة في هذه العهدة:</h4>
                  <table className="w-full text-xs border border-slate-300 dark:border-border text-center">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-muted font-black border-b border-slate-300 dark:border-border">
                        <th className="p-2 border-r border-slate-300 dark:border-border">م</th>
                        <th className="p-2 border-r border-slate-300 dark:border-border text-right">عنوان الكتاب / المقرر</th>
                        <th className="p-2 border-r border-slate-300 dark:border-border">الفصل</th>
                        <th className="p-2 border-r border-slate-300 dark:border-border">الحالة</th>
                        <th className="p-2">تاريخ الصرف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeStageDistributions
                        .filter(d => d.studentId === receiptStudent.id)
                        .map((dist, idx) => {
                          const tb = activeStageTextbooks.find(t => t.id === dist.textbookId);
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

                {/* Legal acknowledgment */}
                <div className="rounded-xl bg-slate-50 dark:bg-muted/30 p-3 text-[11px] text-slate-600 dark:text-muted-foreground leading-relaxed border border-slate-200 dark:border-border/60">
                  <p className="font-bold">إقرار واستلام العهدة:</p>
                  <p>
                    أقر أنا ولي أمر الطالب الموضح أعلاه بأنني استلمت كامل الكتب المدرسية المبينة بالجدول في حالة سليمة وجديدة، وأتعهد بالمحافظة عليها ومتابعة الطالب دراسياً وفق التعليمات المعتمدة.
                  </p>
                </div>

                {/* Signatures */}
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

              {/* Actions Footer */}
              <div className="p-4 border-t border-border/50 flex justify-end gap-2.5 bg-muted/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
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
      </div>
    </AppShell>
  );
}
