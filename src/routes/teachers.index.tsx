import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { EducationalStage, useStage } from "@/contexts/StageContext";
import { Plus, Eye, Pencil, Trash2, X, AlertCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/teachers/")({
  head: () => ({
    meta: [{ title: "المعلمون | منصة مدارس" }, { name: "description", content: "قائمة المعلمين، الإسناد، والحالة." }],
  }),
  component: TeachersList,
});

function TeachersList() {
  const { allStaff, activeStageStaff, activeStageSubjects, activeStageSections, addStaff, updateStaff, deleteStaff, currentAcademicYearId } = useGlobalStore();
  const { stage } = useStage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    role: "معلم",
    department: "الشؤون الأكاديمية",
    status: "active" as "active" | "on_leave" | "terminated",
    employeeNo: "",
    phone: "",
    email: "",
    subjects: [] as string[],
    sections: [] as string[],
  });

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: "",
      role: "معلم",
      department: "الشؤون الأكاديمية",
      status: "active",
      employeeNo: "",
      phone: "",
      email: "",
      subjects: [],
      sections: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (staff: any) => {
    setEditingId(staff.id);
    setFormData({
      name: staff.name,
      role: staff.role,
      department: staff.department,
      status: staff.status,
      employeeNo: staff.employeeNo || "",
      phone: staff.phone || "",
      email: staff.email || "",
      subjects: staff.subjects || [],
      sections: staff.sections || [],
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("الرجاء إدخال اسم المعلم");

    if (editingId) {
      updateStaff(editingId, { ...formData });
      toast.success("تم تعديل بيانات المعلم بنجاح");
    } else {
      if (formData.employeeNo) {
        const isDuplicateInCurrentYear = activeStageStaff.some((s: any) => s.employeeNo === formData.employeeNo);
        if (isDuplicateInCurrentYear) {
          toast.error("هذا المعلم مسجل مسبقاً في العام الدراسي الحالي! لا يمكن تسجيله مرة أخرى.");
          return;
        }
      }

      addStaff({ ...formData, stage, academicYearId: currentAcademicYearId } as any);
      toast.success("تمت إضافة المعلم بنجاح");
    }
    setIsModalOpen(false);
  };

  const handleSmartRegistrationCheck = (empNoToCheck: string) => {
    if (!empNoToCheck || empNoToCheck.length < 3) return;
    const existingStaff = allStaff.find((s: any) => s.employeeNo === empNoToCheck);
    if (existingStaff) {
      toast.success("تم العثور على سجل سابق للمعلم! جاري استيراد البيانات التاريخية...");
      setFormData(prev => ({
        ...prev,
        name: existingStaff.name,
        role: existingStaff.role,
        department: existingStaff.department,
        status: existingStaff.status as any,
        phone: existingStaff.phone || "",
        email: existingStaff.email || "",
      }));
    }
  };

  const confirmDelete = () => {
    if (staffToDelete) {
      deleteStaff(staffToDelete);
      toast.success("تم حذف المعلم بنجاح");
      setIsDeleteModalOpen(false);
      setStaffToDelete(null);
    }
  };

  const toggleSubject = (subId: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subId)
        ? prev.subjects.filter(id => id !== subId)
        : [...prev.subjects, subId]
    }));
  };

  const toggleSection = (secId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.includes(secId)
        ? prev.sections.filter(id => id !== secId)
        : [...prev.sections, secId]
    }));
  };

  // Only show staff that are considered teachers or academic
  const teachersList = useMemo(() => {
    return activeStageStaff.filter(s => s.role.includes("معلم") || s.department === "الشؤون الأكاديمية" || s.subjects?.length);
  }, [activeStageStaff]);

  const printTemplates: PrintTemplate[] = [
    {
      id: "teachers-list",
      name: "قائمة المعلمين",
      category: "إداري",
      type: "table",
      columns: [
        { key: "employeeNo", label: "الرقم الوظيفي" },
        { key: "name", label: "الاسم" },
        { key: "phone", label: "الجوال" },
        { key: "status", label: "الحالة", render: (r) => r.status === "active" ? "نشط" : r.status === "on_leave" ? "إجازة" : "غير نشط" },
      ]
    }
  ];

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "المعلمون" }]}
      actions={
        <div className="flex gap-2">
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-card border border-border/50 px-3 text-sm font-bold shadow-sm hover:bg-accent transition-colors"
          >
            طباعة القائمة
          </button>
          <button 
            onClick={openAddModal}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-sm transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4" /> معلم جديد
          </button>
        </div>
      }
    >
      <PageCard>
        <DataTable
          rows={teachersList}
          empty="لا يوجد معلمين مضافين."
          columns={[
            { key: "no", header: "الرقم الوظيفي", cell: (t) => <span className="font-bold tabular-nums text-muted-foreground">{t.employeeNo || "-"}</span> },
            { key: "n", header: "الاسم", cell: (t) => (
              <div className="flex flex-col">
                <Link to="/teachers/$id" params={{ id: t.id }} className="font-bold text-primary hover:underline">{t.name}</Link>
                <span className="text-xs text-muted-foreground">{t.email}</span>
              </div>
            )},
            { key: "ph", header: "الجوال", cell: (t) => <span className="tabular-nums font-medium">{t.phone || "-"}</span> },
            { key: "subs", header: "المواد المُسندة", cell: (t) => (
              <div className="flex flex-wrap gap-1 max-w-[200px]">
                {t.subjects?.length ? t.subjects.map((id: string) => {
                  const sub = activeStageSubjects.find(s => s.id === id);
                  return <Badge key={id} tone="primary" className="text-[10px]">{sub?.name || id}</Badge>
                }) : <span className="text-xs text-muted-foreground">-</span>}
              </div>
            )},
            { key: "secs", header: "الشُعب", cell: (t) => (
              <div className="flex flex-wrap gap-1 max-w-[200px]">
                {t.sections?.length ? t.sections.map((id: string) => {
                  const sec = activeStageSections.find(s => s.id === id);
                  return <Badge key={id} className="text-[10px]">{sec?.grade?.split(" ")[0]}/{sec?.name}</Badge>;
                }) : <span className="text-xs text-muted-foreground">-</span>}
              </div>
            )},
            { key: "st", header: "الحالة", cell: (t) => (
              <Badge tone={t.status === "active" ? "success" : t.status === "on_leave" ? "warning" : "danger"}>
                {t.status === "active" ? "نشط" : t.status === "on_leave" ? "إجازة" : "غير نشط"}
              </Badge>
            )},
            { key: "act", header: "", cell: (t) => (
              <div className="flex justify-end gap-1">
                <Link to="/teachers/$id" params={{ id: t.id }} className="inline-flex rounded-md p-2 text-primary hover:bg-primary/10 transition-colors" title="عرض الملف"><Eye className="h-4 w-4" /></Link>
                <button onClick={() => openEditModal(t)} className="inline-flex rounded-md p-2 text-primary hover:bg-primary/10 transition-colors" title="تعديل"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => { setStaffToDelete(t.id); setIsDeleteModalOpen(true); }} className="inline-flex rounded-md p-2 text-danger hover:bg-danger/10 transition-colors" title="حذف"><Trash2 className="h-4 w-4" /></button>
              </div>
            )},
          ]}
        />
      </PageCard>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-foreground">{editingId ? "تعديل بيانات المعلم" : "إضافة معلم جديد"}</h2>
                  <p className="text-xs text-muted-foreground">تسجيل بيانات الهوية والتواصل وإسناد المواد والشعب</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <form id="teacher-form" onSubmit={handleSave} className="space-y-6">
                
                {/* Basic Info Section */}
                <div>
                  <h3 className="text-sm font-extrabold mb-3.5 flex items-center gap-2 text-foreground">
                    <div className="w-1.5 h-4 bg-primary rounded-full"></div>البيانات الأساسية
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground/85">الاسم الرباعي <span className="text-destructive">*</span></label>
                      <input
                        required
                        placeholder="اسم المعلم كاملاً..."
                        className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground/85">الرقم الوظيفي</label>
                      <input
                        placeholder="مثال: EMP-204"
                        className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all tabular-nums text-left placeholder:text-muted-foreground/60"
                        dir="ltr"
                        value={formData.employeeNo}
                        onChange={e => setFormData({...formData, employeeNo: e.target.value})}
                        onBlur={(e) => handleSmartRegistrationCheck(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground/85">رقم الجوال</label>
                      <input
                        placeholder="05XXXXXXXX"
                        className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all tabular-nums text-left placeholder:text-muted-foreground/60"
                        dir="ltr"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-foreground/85">البريد الإلكتروني</label>
                      <input
                        type="email"
                        placeholder="teacher@school.edu.sa"
                        className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all text-left placeholder:text-muted-foreground/60"
                        dir="ltr"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-xs font-semibold text-foreground/85">الحالة الوظيفية</label>
                      <select
                        className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all cursor-pointer"
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                      >
                        <option value="active">نشط (على رأس العمل)</option>
                        <option value="on_leave">في إجازة</option>
                        <option value="terminated">غير نشط / مطوي قيده</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Assignments Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/30 dark:bg-muted/15 p-4 rounded-2xl border border-border/60">
                    <h3 className="text-xs font-extrabold mb-3 text-foreground flex items-center justify-between">
                      <span>المواد المُسندة</span>
                      <span className="text-[11px] font-bold text-muted-foreground">{formData.subjects.length} مختارة</span>
                    </h3>
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto pe-1 custom-scrollbar">
                      {activeStageSubjects.length === 0 ? (
                        <p className="text-xs text-muted-foreground">لا توجد مواد مضافة في هذا النظام.</p>
                      ) : (
                        activeStageSubjects.map(sub => (
                          <label key={sub.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-card cursor-pointer transition-all border border-transparent hover:border-border/60 select-none">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 rounded-md border-input text-primary focus:ring-primary/20 cursor-pointer"
                              checked={formData.subjects.includes(sub.id)}
                              onChange={() => toggleSubject(sub.id)}
                            />
                            <span className="font-semibold text-xs text-foreground">{sub.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-muted/30 dark:bg-muted/15 p-4 rounded-2xl border border-border/60">
                    <h3 className="text-xs font-extrabold mb-3 text-foreground flex items-center justify-between">
                      <span>الشُعب المُسندة</span>
                      <span className="text-[11px] font-bold text-muted-foreground">{formData.sections.length} مختارة</span>
                    </h3>
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto pe-1 custom-scrollbar">
                      {activeStageSections.length === 0 ? (
                        <p className="text-xs text-muted-foreground">لا توجد شُعب مضافة في هذه المرحلة.</p>
                      ) : (
                        activeStageSections.map(sec => (
                          <label key={sec.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-card cursor-pointer transition-all border border-transparent hover:border-border/60 select-none">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 rounded-md border-input text-primary focus:ring-primary/20 cursor-pointer"
                              checked={formData.sections.includes(sec.id)}
                              onChange={() => toggleSection(sec.id)}
                            />
                            <span className="font-semibold text-xs text-foreground">{sec.grade} - شعبة {sec.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            {/* Footer */}
            <div className="p-6 pt-4 border-t border-border/60 flex justify-end gap-2.5 bg-card/98 dark:bg-card/95 rounded-b-3xl shrink-0">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="h-11 rounded-xl px-5 text-xs font-semibold border border-input bg-background/80 hover:bg-accent active:scale-[0.98] transition-all"
              >
                إلغاء
              </button>
              <button 
                form="teacher-form" 
                type="submit" 
                className="h-11 rounded-xl bg-primary px-7 text-xs font-extrabold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md glow-primary"
              >
                {editingId ? "حفظ التعديلات" : "إضافة المعلم"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200" dir="rtl">
          <div className="w-full max-w-sm rounded-3xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-2xl bg-destructive/10 p-3.5 text-destructive mb-3.5"><AlertCircle className="h-8 w-8" /></div>
              <h2 className="text-lg font-extrabold text-foreground mb-1.5">تأكيد حذف المعلم</h2>
              <p className="text-muted-foreground mb-5 text-xs font-semibold leading-relaxed">هل أنت متأكد أنك تريد حذف بيانات هذا المعلم؟ سيتم إلغاء جميع إسنادات الحصص والشعب المرتبطة به.</p>
              
              <div className="flex w-full gap-2.5">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)} 
                  className="flex-1 h-11 rounded-xl border border-input bg-background/80 hover:bg-accent text-xs font-semibold active:scale-[0.98] transition-all"
                >
                  إلغاء
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="flex-1 h-11 rounded-xl bg-destructive text-destructive-foreground text-xs font-extrabold hover:bg-destructive/90 active:scale-[0.98] transition-all shadow-md"
                >
                  نعم، احذف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title="قائمة المعلمين"
        data={teachersList}
        templates={printTemplates}
      />
    </AppShell>
  );
}
