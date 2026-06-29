import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { DataTable } from "@/components/data-table";
import { Users, Phone, Eye, Printer, Search, ArrowUpDown, Filter, Wallet, AlertCircle } from "lucide-react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/guardians/")({
  head: () => ({
    meta: [{ title: "أولياء الأمور | منصة مدارس" }, { name: "description", content: "إدارة بيانات أولياء الأمور وربطهم بالطلاب." }],
  }),
  component: GuardiansList,
});

function GuardiansList() {
  const { allGuardians, allStudents, allSections, addGuardian, allInvoices } = useGlobalStore();
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGuardian, setNewGuardian] = useState({ name: "", phone: "", relation: "أب" });

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "childrenCount" | "dues">("name");
  const [filterDues, setFilterDues] = useState<"all" | "hasDues" | "noDues">("all");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [filterSection, setFilterSection] = useState<string>("all");

  const activeGuardians = useMemo(() => allGuardians.filter(g => !g.isDeleted), [allGuardians]);

  const guardiansWithStudents = useMemo(() => {
    let result = activeGuardians.map(g => {
      // Find students linked to this guardian either by guardianId or matching phone/name (legacy support)
      const students = allStudents.filter(s => 
        (s.guardianPhone === g.phone && s.guardianPhone) || 
        (s.guardianName === g.name && s.guardianName)
      );
      
      // Calculate total financial dues for this guardian's students
      const studentIds = students.map(s => s.id);
      const studentInvoices = allInvoices.filter(inv => studentIds.includes(inv.studentId) && inv.status !== "paid" && inv.status !== "cancelled");
      const totalDue = studentInvoices.reduce((sum, inv) => sum + ((inv.netAmount || inv.amount) - (inv.paid || 0)), 0);

      return { ...g, students, totalDue };
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g => 
        g.name.toLowerCase().includes(q) || 
        g.phone.includes(q) || 
        g.students.some(s => s.name.toLowerCase().includes(q))
      );
    }

    if (filterDues === "hasDues") {
      result = result.filter(g => g.totalDue > 0);
    } else if (filterDues === "noDues") {
      result = result.filter(g => g.totalDue === 0);
    }

    if (filterStage !== "all") {
      result = result.filter(g => g.students.some(s => s.stage === filterStage));
    }
    
    if (filterGrade !== "all") {
      result = result.filter(g => g.students.some(s => s.grade === filterGrade));
    }

    if (filterSection !== "all") {
      result = result.filter(g => g.students.some(s => s.sectionId === filterSection));
    }

    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, 'ar');
      } else if (sortBy === "childrenCount") {
        return b.students.length - a.students.length;
      } else if (sortBy === "dues") {
        return b.totalDue - a.totalDue;
      }
      return 0;
    });

    return result;
  }, [activeGuardians, allStudents, allInvoices, searchQuery, sortBy, filterDues, filterStage, filterGrade, filterSection]);

  const totalOutstandingDues = useMemo(() => guardiansWithStudents.reduce((sum, g) => sum + g.totalDue, 0), [guardiansWithStudents]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-lg flex items-center justify-between border-b-4 border-primary-foreground/20 lg:col-span-2">
            <div>
              <p className="text-primary-foreground/80 font-bold mb-1">إجمالي أولياء الأمور</p>
              <h3 className="text-4xl font-black tabular-nums">{guardiansWithStudents.length}</h3>
            </div>
            <div className="bg-primary-foreground/20 p-4 rounded-full">
              <Users className="h-8 w-8" />
            </div>
          </div>

          <div className="bg-danger text-danger-foreground rounded-2xl p-6 shadow-lg flex items-center justify-between border-b-4 border-danger-foreground/20 lg:col-span-2">
            <div>
              <p className="text-danger-foreground/80 font-bold mb-1">إجمالي المتأخرات (لهذه القائمة)</p>
              <h3 className="text-3xl font-black tabular-nums flex items-baseline gap-1">
                {totalOutstandingDues.toLocaleString()} <span className="text-sm font-medium">ج.س</span>
              </h3>
            </div>
            <div className="bg-danger-foreground/20 p-4 rounded-full">
              <Wallet className="h-8 w-8" />
            </div>
          </div>
          
          <div className="lg:col-span-4 bg-card p-4 rounded-2xl border border-border shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full relative">
                <label className="mb-2 block text-sm font-bold text-muted-foreground">البحث السريع</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ابحث باسم ولي الأمر، الطالب، أو الجوال..."
                  className="w-full rounded-xl border border-border/50 bg-background px-10 py-3 font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <label className="mb-2 block text-sm font-bold text-muted-foreground">التصفية (المالية)</label>
              <div className="relative">
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  className="w-full rounded-xl border border-border/50 bg-background pl-4 pr-10 py-3 font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer"
                  value={filterDues}
                  onChange={(e) => setFilterDues(e.target.value as any)}
                >
                  <option value="all">الكل</option>
                  <option value="hasDues">عليهم متأخرات فقط</option>
                  <option value="noDues">مسددين بالكامل</option>
                </select>
              </div>
            </div>

            <div className="w-full md:w-48">
              <label className="mb-2 block text-sm font-bold text-muted-foreground">ترتيب حسب</label>
              <div className="relative">
                <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <select
                  className="w-full rounded-xl border border-border/50 bg-background pl-4 pr-10 py-3 font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors appearance-none cursor-pointer"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="name">الاسم (أبجدي)</option>
                  <option value="childrenCount">عدد الأبناء (الأكثر)</option>
                  <option value="dues">المتأخرات المالية (الأعلى)</option>
                </select>
              </div>
            </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-end pt-4 border-t border-border/50">
              <div className="w-full md:w-1/3">
                <label className="mb-2 block text-sm font-bold text-muted-foreground">تصفية حسب المرحلة</label>
                <select
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                  value={filterStage}
                  onChange={(e) => {
                    setFilterStage(e.target.value);
                    setFilterGrade("all");
                    setFilterSection("all");
                  }}
                >
                  <option value="all">كل المراحل</option>
                  <option value="kindergarten">رياض الأطفال</option>
                  <option value="primary">الابتدائية</option>
                  <option value="middle">المتوسطة</option>
                  <option value="high">الثانوية</option>
                </select>
              </div>

              <div className="w-full md:w-1/3">
                <label className="mb-2 block text-sm font-bold text-muted-foreground">تصفية حسب الصف</label>
                <select
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                  value={filterGrade}
                  onChange={(e) => {
                    setFilterGrade(e.target.value);
                    setFilterSection("all");
                  }}
                  disabled={filterStage === "all"}
                >
                  <option value="all">كل الصفوف</option>
                  {Array.from(new Set(allSections.filter(s => s.stage === filterStage).map(s => s.grade))).map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="w-full md:w-1/3">
                <label className="mb-2 block text-sm font-bold text-muted-foreground">تصفية حسب الشعبة</label>
                <select
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  disabled={filterGrade === "all"}
                >
                  <option value="all">كل الشعب</option>
                  {allSections.filter(s => s.stage === filterStage && s.grade === filterGrade).map(s => (
                    <option key={s.id} value={s.id}>شعبة {s.name}</option>
                  ))}
                </select>
              </div>
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
              { key: "studentsCount", header: "الأبناء", cell: (g) => <span className="tabular-nums font-black text-primary bg-primary/10 px-3 py-1 rounded-full">{g.students.length}</span> },
              { 
                key: "financial", 
                header: "الوضع المالي", 
                cell: (g) => g.totalDue > 0 ? (
                  <div className="flex items-center gap-1.5 text-danger bg-danger/10 px-2 py-1 rounded-lg w-fit">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span className="text-xs font-bold tabular-nums">مطلوب: {g.totalDue.toLocaleString()}</span>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-lg">مسدد</span>
                )
              },
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
