import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { DataTable } from "@/components/data-table";
import { Users, Phone, Eye, Printer } from "lucide-react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/guardians/")({
  head: () => ({
    meta: [{ title: "أولياء الأمور | منصة مدارس" }, { name: "description", content: "إدارة بيانات أولياء الأمور وربطهم بالطلاب." }],
  }),
  component: GuardiansList,
});

function GuardiansList() {
  const { allGuardians, allStudents, addGuardian } = useGlobalStore();
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGuardian, setNewGuardian] = useState({ name: "", phone: "", relation: "أب" });

  const activeGuardians = useMemo(() => allGuardians.filter(g => !g.isDeleted), [allGuardians]);

  const guardiansWithStudents = useMemo(() => {
    return activeGuardians.map(g => {
      // Find students linked to this guardian either by guardianId or matching phone/name (legacy support)
      const students = allStudents.filter(s => 
        (s.guardianPhone === g.phone && s.guardianPhone) || 
        (s.guardianName === g.name && s.guardianName)
      );
      return { ...g, students };
    });
  }, [activeGuardians, allStudents]);

  const handleAddGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuardian.name || !newGuardian.phone) return;
    addGuardian(newGuardian);
    setIsAddModalOpen(false);
    setNewGuardian({ name: "", phone: "", relation: "أب" });
  };

  const printTemplates: PrintTemplate[] = [
    {
      id: "guardians-list",
      name: "قائمة أولياء الأمور",
      category: "قوائم",
      type: "table",
      columns: [
        { label: "الاسم", key: "name" },
        { label: "رقم الجوال", key: "phone" },
        { label: "الصلة", key: "relation" },
        { label: "عدد الأبناء", key: "studentsCount", render: (g: any) => g.students.length.toString() },
      ],
      description: "طباعة كشف مجمع بأولياء الأمور وأرقام التواصل"
    }
  ];

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "أولياء الأمور" }]}
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            <Users className="h-4 w-4" /> إضافة ولي أمر
          </button>
          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary/10 px-4 text-sm font-bold text-primary hover:bg-primary/20 transition-all border border-primary/20"
          >
            <Printer className="h-4 w-4" /> طباعة الكشف
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-lg flex items-center justify-between border-b-4 border-primary-foreground/20">
            <div>
              <p className="text-primary-foreground/80 font-bold mb-1">إجمالي أولياء الأمور</p>
              <h3 className="text-4xl font-black tabular-nums">{guardiansWithStudents.length}</h3>
            </div>
            <div className="bg-primary-foreground/20 p-4 rounded-full">
              <Users className="h-8 w-8" />
            </div>
          </div>
        </div>

        <PageCard>
          <DataTable
            rows={guardiansWithStudents}
            columns={[
              { 
                key: "name", 
                header: "الاسم", 
                cell: (g) => (
                  <Link to="/guardians/$id" params={{ id: g.id }} className="font-bold text-primary hover:underline flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" /> {g.name}
                  </Link>
                ) 
              },
              { 
                key: "phone", 
                header: "رقم الجوال", 
                cell: (g) => (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="tabular-nums font-medium" dir="ltr">{g.phone}</span>
                  </div>
                )
              },
              { key: "relation", header: "الصلة", cell: (g) => <span className="text-sm font-bold bg-muted px-2 py-0.5 rounded-lg">{g.relation}</span> },
              { key: "studentsCount", header: "عدد الأبناء", cell: (g) => <span className="tabular-nums font-black text-primary bg-primary/10 px-3 py-1 rounded-full">{g.students.length}</span> },
              { key: "actions", header: "", cell: (g) => (
                <div className="flex justify-end">
                  <Link to="/guardians/$id" params={{ id: g.id }} className="rounded-lg p-2 hover:bg-primary/10 text-primary transition-colors flex items-center gap-1 text-xs font-bold">
                    <Eye className="h-4 w-4" /> عرض الملف
                  </Link>
                </div>
              )},
            ]}
          />
        </PageCard>
      </div>

      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title="كشف أولياء الأمور وأرقام التواصل"
        data={guardiansWithStudents}
        templates={printTemplates} 
      />

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-primary p-4 text-primary-foreground flex justify-between items-center">
              <h2 className="font-bold text-lg">إضافة ولي أمر جديد</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                <Printer className="h-5 w-5 opacity-0" />
              </button>
            </div>
            
            <form onSubmit={handleAddGuardian} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">الاسم الرباعي</label>
                <input
                  type="text"
                  required
                  value={newGuardian.name}
                  onChange={e => setNewGuardian(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background"
                  placeholder="مثال: عبدالله محمد السالم"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">رقم الجوال</label>
                <input
                  type="tel"
                  required
                  value={newGuardian.phone}
                  onChange={e => setNewGuardian(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background"
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1">صلة القرابة</label>
                <select
                  value={newGuardian.relation}
                  onChange={e => setNewGuardian(prev => ({ ...prev, relation: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background"
                >
                  <option value="أب">أب</option>
                  <option value="أم">أم</option>
                  <option value="أخ">أخ</option>
                  <option value="جد">جد</option>
                  <option value="عم">عم</option>
                  <option value="خال">خال</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 h-10 rounded-lg border border-input font-bold text-foreground hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-lg bg-primary font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  حفظ الإضافة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
