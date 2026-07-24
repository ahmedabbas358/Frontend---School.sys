import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useTransition } from "react";
import { AppShell, PageCard } from "@/components/app-shell";
import { useGlobalStore, Student } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { DataTable } from "@/components/data-table";
import { getGradesForStage } from "@/lib/school-structure";
import { Users, Phone, Eye, Printer, Search, ArrowUpDown, Filter, Wallet, AlertCircle, X } from "lucide-react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/guardians/")({
  head: () => ({
    meta: [{ title: "أولياء الأمور | منصة مدارس" }, { name: "description", content: "إدارة بيانات أولياء الأمور وربطهم بالطلاب." }],
  }),
  component: GuardiansList,
});

function GuardiansList() {
  const { allGuardians, allStudents, allSections, addGuardian, allInvoices } = useGlobalStore();
  const { stage, setStage } = useStage();
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGuardian, setNewGuardian] = useState({ name: "", phone: "", relation: "أب", customRelation: "", gender: "ذكر" });

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "childrenCount" | "dues">("name");
  const [filterDues, setFilterDues] = useState<"all" | "hasDues" | "noDues">("all");
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [filterSection, setFilterSection] = useState<string>("all");

  const [isPending, startTransition] = useTransition();
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        setDebouncedSearchQuery(searchQuery);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const activeGuardians = useMemo(() => allGuardians.filter(g => !g.isDeleted), [allGuardians]);

  // Fast pre-computed index maps (O(N))
  const studentsByPhoneMap = useMemo(() => {
    const map = new Map<string, Student[]>();
    for (let i = 0; i < allStudents.length; i++) {
      const s = allStudents[i];
      if (s.guardianPhone) {
        let list = map.get(s.guardianPhone);
        if (!list) {
          list = [];
          map.set(s.guardianPhone, list);
        }
        list.push(s);
      }
    }
    return map;
  }, [allStudents]);

  const studentsByNameMap = useMemo(() => {
    const map = new Map<string, Student[]>();
    for (let i = 0; i < allStudents.length; i++) {
      const s = allStudents[i];
      if (s.guardianName) {
        let list = map.get(s.guardianName);
        if (!list) {
          list = [];
          map.set(s.guardianName, list);
        }
        list.push(s);
      }
    }
    return map;
  }, [allStudents]);

  const unpaidDuesByStudentIdMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < allInvoices.length; i++) {
      const inv = allInvoices[i];
      if (inv.status !== "paid" && inv.status !== "cancelled" && inv.studentId) {
        const remaining = (inv.netAmount || inv.amount) - (inv.paid || 0);
        if (remaining > 0) {
          map.set(inv.studentId, (map.get(inv.studentId) || 0) + remaining);
        }
      }
    }
    return map;
  }, [allInvoices]);

  const guardiansWithStudents = useMemo(() => {
    const q = debouncedSearchQuery.trim().toLowerCase();

    let result = activeGuardians.map(g => {
      const studentsByPhone = g.phone ? studentsByPhoneMap.get(g.phone) : undefined;
      const studentsByName = g.name ? studentsByNameMap.get(g.name) : undefined;
      const students = studentsByPhone || studentsByName || [];

      let totalDue = 0;
      for (let i = 0; i < students.length; i++) {
        totalDue += unpaidDuesByStudentIdMap.get(students[i].id) || 0;
      }

      return { ...g, students, totalDue };
    });

    if (q) {
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

    result = result.filter(g => g.students.length === 0 || g.students.some(s => s.stage === stage));
    
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
  }, [activeGuardians, studentsByPhoneMap, studentsByNameMap, unpaidDuesByStudentIdMap, debouncedSearchQuery, sortBy, filterDues, stage, filterGrade, filterSection]);

  const totalOutstandingDues = useMemo(() => guardiansWithStudents.reduce((sum, g) => sum + g.totalDue, 0), [guardiansWithStudents]);

  const handleAddGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuardian.name || !newGuardian.phone) return;
    addGuardian({
      name: newGuardian.name,
      phone: newGuardian.phone,
      relation: newGuardian.relation === "غير ذلك" ? newGuardian.customRelation || "أخرى" : newGuardian.relation,
      gender: newGuardian.gender as any
    });
    setIsAddModalOpen(false);
    setNewGuardian({ name: "", phone: "", relation: "أب", customRelation: "", gender: "ذكر" });
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
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2 p-1 bg-muted rounded-full hover:bg-muted/80 transition-colors">
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
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
                <div className="relative">
                  <select
                    className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer appearance-none"
                    value={stage}
                    onChange={(e) => {
                      setStage(e.target.value as any);
                      setFilterGrade("all");
                      setFilterSection("all");
                    }}
                  >
                  <option value="kindergarten">رياض الأطفال</option>
                  <option value="primary">الابتدائية</option>
                  <option value="middle">المتوسطة</option>
                  <option value="high">الثانوية</option>
                  </select>
                  <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="w-full md:w-1/3">
                <label className="mb-2 block text-sm font-bold text-muted-foreground">تصفية حسب الصف</label>
                <div className="relative">
                  <select
                    className={`w-full rounded-xl border border-border/50 bg-background px-4 py-3 font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer appearance-none ${filterGrade !== 'all' ? 'border-primary ring-1 ring-primary/20' : ''}`}
                    value={filterGrade}
                    onChange={(e) => {
                    setFilterGrade(e.target.value);
                    setFilterSection("all");
                  }}
                >
                  <option value="all">كل الصفوف</option>
                  {getGradesForStage(stage).map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                  </select>
                  {filterGrade !== "all" ? (
                    <button onClick={() => { setFilterGrade("all"); setFilterSection("all"); }} className="absolute left-3 top-1/2 -translate-y-1/2 p-1 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors">
                      <X className="h-3 w-3 text-primary" />
                    </button>
                  ) : (
                    <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  )}
                </div>
              </div>

              <div className="w-full md:w-1/3">
                <label className="mb-2 block text-sm font-bold text-muted-foreground">تصفية حسب الشعبة</label>
                <div className="relative">
                  <select
                    className={`w-full rounded-xl border border-border/50 bg-background px-4 py-3 font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer appearance-none ${filterGrade === "all" ? 'opacity-50 cursor-not-allowed' : filterSection !== 'all' ? 'border-primary ring-1 ring-primary/20' : ''}`}
                    value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  disabled={filterGrade === "all"}
                >
                  <option value="all">{filterGrade === "all" ? 'اختر الصف أولاً' : 'كل الشعب'}</option>
                  {allSections
                    .filter(s => s.stage === stage && s.grade === filterGrade)
                    .map(s => (
                    <option key={s.id} value={s.id}>شعبة {s.name}</option>
                  ))}
                  </select>
                  {filterSection !== "all" && filterGrade !== "all" ? (
                    <button onClick={() => setFilterSection("all")} className="absolute left-3 top-1/2 -translate-y-1/2 p-1 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors">
                      <X className="h-3 w-3 text-primary" />
                    </button>
                  ) : (
                    <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  )}
                </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-0 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="flex justify-between items-center relative z-10">
                <h2 className="font-extrabold text-xl flex items-center gap-2"><Users className="h-5 w-5" /> إضافة ولي أمر جديد</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="rounded-full p-2 hover:bg-black/20 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleAddGuardian} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1.5">الاسم الرباعي</label>
                <input
                  type="text"
                  required
                  value={newGuardian.name}
                  onChange={e => setNewGuardian(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                  placeholder="مثال: عبدالله محمد السالم"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1.5">رقم الجوال</label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    required
                    value={newGuardian.phone}
                    onChange={e => setNewGuardian(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-xl border border-border/50 bg-background/50 pr-10 pl-4 py-3.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium tabular-nums"
                    placeholder="05XXXXXXXX"
                    dir="ltr"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1.5">صلة القرابة</label>
                  <select
                    value={newGuardian.relation}
                    onChange={e => setNewGuardian(prev => ({ ...prev, relation: e.target.value }))}
                    className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium cursor-pointer"
                  >
                    <option value="أب">أب</option>
                    <option value="أم">أم</option>
                    <option value="أخ">أخ</option>
                    <option value="جد">جد</option>
                    <option value="عم">عم</option>
                    <option value="خال">خال</option>
                    <option value="غير ذلك">غير ذلك</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1.5">الجنس</label>
                  <select
                    value={newGuardian.gender}
                    onChange={e => setNewGuardian(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full rounded-xl border border-border/50 bg-background/50 px-4 py-3.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium cursor-pointer"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
              </div>

              {newGuardian.relation === "غير ذلك" && (
                <div className="animate-in fade-in zoom-in duration-200">
                  <label className="block text-sm font-bold text-primary mb-1.5">تحديد صلة القرابة يدوياً <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    required
                    value={newGuardian.customRelation}
                    onChange={e => setNewGuardian(prev => ({ ...prev, customRelation: e.target.value }))}
                    className="w-full rounded-xl border border-primary/30 bg-primary/5 px-4 py-3.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    placeholder="مثال: زوج الأم، أخ بالرضاعة..."
                  />
                </div>
              )}

              <div className="pt-6 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  حفظ الإضافة
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 rounded-xl border border-border bg-card font-bold hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
