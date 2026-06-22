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
  const { activeStageStaff, activeStageSubjects, activeStageSections, addStaff, updateStaff, deleteStaff } = useGlobalStore();
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
      addStaff({ ...formData, stage });
      toast.success("تمت إضافة المعلم بنجاح");
    }
    setIsModalOpen(false);
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border/50 shrink-0">
              <h2 className="text-2xl font-black text-primary">{editingId ? "تعديل بيانات المعلم" : "إضافة معلم جديد"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-accent transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <form id="teacher-form" onSubmit={handleSave} className="space-y-8">
                
                {/* Basic Info Section */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><div className="w-1.5 h-5 bg-primary rounded-full"></div>البيانات الأساسية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-muted-foreground">الاسم الرباعي *</label>
                      <input
                        required
                        placeholder="اسم المعلم"
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-muted-foreground">الرقم الوظيفي</label>
                      <input
                        placeholder="رقم الموظف"
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold tabular-nums text-left"
                        dir="ltr"
                        value={formData.employeeNo}
                        onChange={e => setFormData({...formData, employeeNo: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-muted-foreground">رقم الجوال</label>
                      <input
                        placeholder="05XXXXXXXX"
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold tabular-nums text-left"
                        dir="ltr"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-muted-foreground">البريد الإلكتروني</label>
                      <input
                        type="email"
                        placeholder="email@example.com"
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold text-left"
                        dir="ltr"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-muted-foreground">الحالة الوظيفية</label>
                      <select
                        className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold cursor-pointer"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-muted/30 p-5 rounded-2xl border border-border/50">
                    <h3 className="text-md font-bold mb-3">المواد المُسندة</h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pl-2 custom-scrollbar">
                      {activeStageSubjects.length === 0 ? (
                        <p className="text-sm text-muted-foreground">لا توجد مواد مضافة في هذا النظام.</p>
                      ) : (
                        activeStageSubjects.map(sub => (
                          <label key={sub.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors border border-transparent hover:border-border/50">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                              checked={formData.subjects.includes(sub.id)}
                              onChange={() => toggleSubject(sub.id)}
                            />
                            <span className="font-bold text-sm">{sub.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-muted/30 p-5 rounded-2xl border border-border/50">
                    <h3 className="text-md font-bold mb-3">الشُعب المُسندة</h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pl-2 custom-scrollbar">
                      {activeStageSections.length === 0 ? (
                        <p className="text-sm text-muted-foreground">لا توجد شُعب مضافة في هذه المرحلة.</p>
                      ) : (
                        activeStageSections.map(sec => (
                          <label key={sec.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors border border-transparent hover:border-border/50">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                              checked={formData.sections.includes(sec.id)}
                              onChange={() => toggleSection(sec.id)}
                            />
                            <span className="font-bold text-sm">{sec.grade} - شعبة {sec.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            {/* Footer */}
            <div className="p-6 pt-4 border-t border-border/50 flex justify-end gap-3 bg-card rounded-b-3xl shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl px-5 py-2.5 font-bold hover:bg-accent transition-colors">إلغاء</button>
              <button form="teacher-form" type="submit" className="rounded-xl bg-primary px-8 py-2.5 font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm hover:scale-105">
                {editingId ? "حفظ التعديلات" : "إضافة المعلم"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-danger/10 p-3 text-danger mb-4"><AlertCircle className="h-8 w-8" /></div>
              <h2 className="text-xl font-bold mb-2">تأكيد الحذف</h2>
              <p className="text-muted-foreground mb-6 font-bold">هل أنت متأكد أنك تريد حذف بيانات المعلم؟ لا يمكن التراجع.</p>
              
              <div className="flex w-full gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 rounded-xl px-4 py-2.5 font-bold hover:bg-accent transition-colors">إلغاء</button>
                <button onClick={confirmDelete} className="flex-1 rounded-xl bg-danger px-4 py-2.5 font-bold text-danger-foreground hover:bg-danger/90 transition-colors shadow-sm">نعم، احذف</button>
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
