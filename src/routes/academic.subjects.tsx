import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { useGlobalStore, Subject, EducationalStage } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { DataTable } from "@/components/data-table";
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Clock,
  GraduationCap,
  Users,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
  DollarSign,
  AlertTriangle,
  Award,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/academic/subjects")({
  head: () => ({
    meta: [{ title: "المواد والخطط الدراسية | منصة مدارس" }],
  }),
  component: AcademicSubjectsPage,
});

const STAGE_LABELS: Record<EducationalStage | "all", string> = {
  all: "جميع المراحل",
  kindergarten: "مرحلة الروضة",
  primary: "المرحلة الابتدائية",
  middle: "المرحلة المتوسطة",
  high: "المرحلة الثانوية",
};

function AcademicSubjectsPage() {
  const { allSubjects, addSubject, updateSubject, deleteSubject, allTeachingAssignments, allStaff, currency, addActivityLog } =
    useGlobalStore();
  const { stage: activeStage } = useStage();

  const [q, setQ] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Subject | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formCredits, setFormCredits] = useState<number>(3);
  const [formStage, setFormStage] = useState<EducationalStage | "all">("all");
  const [formFee, setFormFee] = useState<number>(0);
  const [formGrades, setFormGrades] = useState<string[]>([]);

  // Filtering
  const filteredSubjects = useMemo(() => {
    return allSubjects.filter((sub) => {
      if (selectedStage !== "all" && sub.stage !== "all" && sub.stage !== selectedStage) {
        return false;
      }
      if (!q.trim()) return true;
      const term = q.trim().toLowerCase();
      return (
        sub.name.toLowerCase().includes(term) ||
        sub.code.toLowerCase().includes(term) ||
        sub.id.toLowerCase().includes(term)
      );
    });
  }, [allSubjects, selectedStage, q]);

  // Statistics
  const stats = useMemo(() => {
    const totalCredits = allSubjects.reduce((sum, s) => sum + (s.creditHours || 0), 0);
    const assignedSubjectsCount = new Set(allTeachingAssignments.map((a) => a.subjectId)).size;
    return {
      total: allSubjects.length,
      totalCredits,
      assignedCount: assignedSubjectsCount,
      unassignedCount: Math.max(0, allSubjects.length - assignedSubjectsCount),
    };
  }, [allSubjects, allTeachingAssignments]);

  const openAddModal = () => {
    setFormName("");
    setFormCode(`SUB-${Math.floor(100 + Math.random() * 900)}`);
    setFormCredits(3);
    setFormStage(activeStage || "all");
    setFormFee(0);
    setFormGrades([]);
    setAddModal(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditSubject(sub);
    setFormName(sub.name);
    setFormCode(sub.code);
    setFormCredits(sub.creditHours || 3);
    setFormStage(sub.stage);
    setFormFee(sub.fee || 0);
    setFormGrades(sub.grades || []);
  };

  const handleSaveAdd = () => {
    if (!formName.trim()) {
      toast.error("يرجى إدخال اسم المادة الدراسية");
      return;
    }
    if (!formCode.trim()) {
      toast.error("يرجى إدخال كود المادة");
      return;
    }

    addSubject({
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      creditHours: Number(formCredits) || 3,
      stage: formStage,
      fee: Number(formFee) || 0,
      grades: formGrades,
    });

    addActivityLog({
      user: "مدير النظام",
      action: "إضافة مادة دراسية",
      entity: "الخطة الدراسية",
      details: `تمت إضافة مادة: ${formName.trim()} (${formCode.trim()})`,
    });

    toast.success(`تمت إضافة مادة "${formName.trim()}" بنجاح`);
    setAddModal(false);
  };

  const handleSaveEdit = () => {
    if (!editSubject) return;
    if (!formName.trim()) {
      toast.error("يرجى إدخال اسم المادة الدراسية");
      return;
    }

    updateSubject(editSubject.id, {
      name: formName.trim(),
      code: formCode.trim().toUpperCase(),
      creditHours: Number(formCredits) || 3,
      stage: formStage,
      fee: Number(formFee) || 0,
      grades: formGrades,
    });

    addActivityLog({
      user: "مدير النظام",
      action: "تعديل مادة دراسية",
      entity: "الخطة الدراسية",
      details: `تم تحديث بيانات مادة: ${formName.trim()}`,
    });

    toast.success(`تم تحديث مادة "${formName.trim()}" بنجاح`);
    setEditSubject(null);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteSubject(deleteConfirm.id);
    addActivityLog({
      user: "مدير النظام",
      action: "حذف مادة دراسية",
      entity: "الخطة الدراسية",
      details: `تم حذف مادة: ${deleteConfirm.name}`,
    });
    toast.success(`تم حذف مادة "${deleteConfirm.name}" بنجاح`);
    setDeleteConfirm(null);
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الإدارة الأكاديمية", to: "/academic/classes" },
        { label: "المواد والخطط الدراسية" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={openAddModal}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
          >
            <Plus className="h-4 w-4" /> إضافة مادة جديدة
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary p-3.5 rounded-2xl shadow-inner border border-primary/20">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black">المواد والخطط الدراسية (Curriculum & Subjects)</h1>
              <p className="text-sm font-bold text-muted-foreground mt-1">
                إدارة المقررات الدراسية، الحصص الأسبوعية، توزيع المراحل، وتعيينات المعلمين
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي المواد</p>
            </div>
            <p className="text-2xl font-black tabular-nums">{stats.total}</p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-success/10 text-success flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي الحصص / الساعات</p>
            </div>
            <p className="text-2xl font-black text-success tabular-nums">{stats.totalCredits} حصة</p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-info/10 text-info flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">مواد مسندة لمعلمين</p>
            </div>
            <p className="text-2xl font-black tabular-nums text-primary">{stats.assignedCount}</p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-xl bg-warning/10 text-warning-foreground flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">مواد بدون معلم</p>
            </div>
            <p className={`text-2xl font-black tabular-nums ${stats.unassignedCount > 0 ? "text-warning-foreground" : "text-success"}`}>
              {stats.unassignedCount}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث باسم المادة، كود المقرر، أو المعرف..."
                className="h-11 w-full rounded-xl border border-border/80 bg-background ps-10 pe-4 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
              />
            </div>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="h-11 rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 cursor-pointer"
            >
              <option value="all">كافة المراحل التعليمية</option>
              <option value="primary">المرحلة الابتدائية</option>
              <option value="middle">المرحلة المتوسطة</option>
              <option value="secondary">المرحلة الثانوية</option>
            </select>
          </div>
        </div>

        {/* Subjects Table */}
        <PageCard>
          <DataTable
            rows={filteredSubjects}
            pageSize={25}
            columns={[
              {
                key: "code",
                header: "كود المادة",
                cell: (s) => (
                  <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-muted/60 border border-border/60 text-foreground">
                    {s.code}
                  </span>
                ),
              },
              {
                key: "name",
                header: "اسم المقرر الدراسي",
                cell: (s) => (
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 shadow-inner">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-black text-sm text-foreground">{s.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{s.id}</div>
                    </div>
                  </div>
                ),
              },
              {
                key: "stage",
                header: "المرحلة الدراسية",
                cell: (s) => (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    {STAGE_LABELS[s.stage] || s.stage}
                  </span>
                ),
              },
              {
                key: "creditHours",
                header: "الحصص / الساعات",
                cell: (s) => (
                  <div className="flex items-center gap-1.5 text-xs font-black text-foreground">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{s.creditHours || 3} حصص أسبوعياً</span>
                  </div>
                ),
              },
              {
                key: "fee",
                header: "رسوم إضافية",
                cell: (s) => (
                  <span className="text-xs font-bold text-muted-foreground">
                    {s.fee ? `${s.fee.toLocaleString()} ${currency}` : "بدون رسوم"}
                  </span>
                ),
              },
              {
                key: "teachers",
                header: "المعلمون المسندون",
                cell: (s) => {
                  const assignments = allTeachingAssignments.filter((a) => a.subjectId === s.id);
                  const teacherNames = Array.from(
                    new Set(
                      assignments
                        .map((a) => allStaff.find((st) => st.id === (a.teacherId || (a as any).staffId))?.name)
                        .filter(Boolean)
                    )
                  );

                  return (
                    <div className="text-xs">
                      {teacherNames.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-success shrink-0" />
                          <span className="font-bold text-foreground">
                            {teacherNames.slice(0, 2).join("، ")}
                            {teacherNames.length > 2 ? ` (+${teacherNames.length - 2})` : ""}
                          </span>
                        </div>
                      ) : (
                        <span className="text-warning-foreground font-bold flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> بانتظار إسناد
                        </span>
                      )}
                    </div>
                  );
                },
              },
              {
                key: "actions",
                header: "الخيارات",
                cell: (s) => (
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-primary transition-colors border border-transparent hover:border-border"
                      title="تعديل المادة"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(s)}
                      className="p-2 rounded-xl hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors border border-transparent hover:border-danger/30"
                      title="حذف المادة"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            empty="لا توجد مواد دراسية مسجلة مطابقة لمعايير البحث."
          />
        </PageCard>
      </div>

      {/* ────── Modal: Add Subject ────── */}
      {addModal && (
        <div className="modal-backdrop-luxury" onClick={() => setAddModal(false)}>
          <div className="modal-card-luxury max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border/70 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-inner">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-black text-lg">إضافة مقرر دراسي جديد</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">تحديد كود المادة والحصص والمرحلة الدراسية</p>
                </div>
              </div>
              <button
                onClick={() => setAddModal(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">اسم المادة <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: الرياضيات المتقدمة"
                    className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">كود المادة <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="مثال: MATH-101"
                    className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold font-mono shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">المرحلة الدراسية</label>
                  <select
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value as any)}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm cursor-pointer focus:border-primary focus:outline-none"
                  >
                    <option value="all">جميع المراحل</option>
                    <option value="primary">المرحلة الابتدائية</option>
                    <option value="middle">المرحلة المتوسطة</option>
                    <option value="secondary">المرحلة الثانوية</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">الحصص الأسبوعية</label>
                  <input
                    type="number"
                    value={formCredits}
                    onChange={(e) => setFormCredits(Number(e.target.value))}
                    min={1}
                    max={15}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">رسوم معامل أو مواد إضافية ({currency})</label>
                <input
                  type="number"
                  value={formFee}
                  onChange={(e) => setFormFee(Number(e.target.value))}
                  min={0}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAddModal(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold border border-border hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveAdd}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                >
                  حفظ المقرر
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────── Modal: Edit Subject ────── */}
      {editSubject && (
        <div className="modal-backdrop-luxury" onClick={() => setEditSubject(null)}>
          <div className="modal-card-luxury max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border/70 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-inner">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-black text-lg">تعديل بيانات المقرر</h2>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{editSubject.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditSubject(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">اسم المادة</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">كود المادة</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold font-mono shadow-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">المرحلة الدراسية</label>
                  <select
                    value={formStage}
                    onChange={(e) => setFormStage(e.target.value as any)}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm cursor-pointer focus:border-primary focus:outline-none"
                  >
                    <option value="all">جميع المراحل</option>
                    <option value="primary">المرحلة الابتدائية</option>
                    <option value="middle">المرحلة المتوسطة</option>
                    <option value="secondary">المرحلة الثانوية</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">الحصص الأسبوعية</label>
                  <input
                    type="number"
                    value={formCredits}
                    onChange={(e) => setFormCredits(Number(e.target.value))}
                    min={1}
                    max={15}
                    className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">رسوم إضافية ({currency})</label>
                <input
                  type="number"
                  value={formFee}
                  onChange={(e) => setFormFee(Number(e.target.value))}
                  min={0}
                  className="h-11 w-full rounded-xl border border-border/80 bg-background px-3.5 text-sm font-bold shadow-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditSubject(null)}
                  className="rounded-xl px-5 py-2.5 text-sm font-bold border border-border hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                >
                  تحديث المقرر
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────── Modal: Delete Subject Confirmation ────── */}
      {deleteConfirm && (
        <div className="modal-backdrop-luxury" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-card-luxury max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-danger/10 text-danger flex items-center justify-center mb-4 shadow-inner">
                <Trash2 className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-black">حذف المقرر الدراسي؟</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف مادة{" "}
                <strong className="text-foreground font-black">"{deleteConfirm.name}"</strong>؟
                قد تتأثر الجداول الدراسية وتعيينات المعلمين المرتبطة بها.
              </p>
              <div className="flex gap-2.5 mt-6">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-bold text-white hover:bg-danger/90 transition-all shadow-md shadow-danger/20"
                >
                  تأكيد الحذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
