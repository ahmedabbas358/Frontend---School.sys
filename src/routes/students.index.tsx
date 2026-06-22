import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Badge, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { Download, Filter, Plus, Search, Eye, Pencil, Trash2, LayoutGrid, List, Printer, ShieldCheck, MapPin, Undo2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/students/")({
  head: () => ({
    meta: [
      { title: "قائمة الطلاب | منصة مدارس" },
      { name: "description", content: "إدارة بيانات الطلاب: البحث، التصفية، التصدير والإجراءات الجماعية." },
    ],
  }),
  component: StudentsListPage,
});

function StudentsListPage() {
  const { activeStageStudents, allDeletedStudents, allSections, softDeleteStudent, restoreStudent, hardDeleteStudent } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("name"); // "name" | "grade" | "id"
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "inactive" | "trash"
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const baseStudents = statusFilter === "trash" ? allDeletedStudents.filter(s => s.stage === stage) : activeStageStudents;

  const filtered = useMemo(() => {
    let result = baseStudents.filter((s) => {
      if (q && !s.name.includes(q) && !s.id.includes(q)) return false;
      if (statusFilter === "active" && s.status !== "نشط") return false;
      if (statusFilter === "inactive" && s.status === "نشط") return false;
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "grade") return a.grade.localeCompare(b.grade);
      if (sortBy === "id") return a.id.localeCompare(b.id);
      return 0;
    });

    return result;
  }, [q, sortBy, statusFilter, baseStudents]);

  const printTemplates: PrintTemplate[] = useMemo(() => [
    {
      id: "all-students",
      name: "قائمة الطلاب الشاملة",
      category: "الطلاب",
      type: "table",
      description: "طباعة قائمة بجميع الطلاب",
      columns: [
        { label: "رقم القيد", key: "id" },
        { label: "اسم الطالب", key: "name" },
        { label: "الصف", key: "grade" },
        { label: "الشعبة", key: "sectionId", render: (r) => allSections.find(x => x.id === r.sectionId)?.name || "-" },
        { label: "حالة القيد", key: "status" },
        { label: "ولي الأمر", key: "guardianName" },
        { label: "الجوال", key: "guardianPhone" },
      ]
    },
    {
      id: "student-ids",
      name: "بطاقات الطلاب (ID Cards)",
      category: "الطلاب",
      type: "cards",
      description: "طباعة بطاقات الهوية المدرسية للطلاب",
      columns: [
        { label: "الرقم الجامعي", key: "id" },
        { label: "اسم الطالب", key: "name" },
        { label: "الصف", key: "grade" },
      ]
    },
    {
      id: "student-warning",
      name: "إشعار / إنذار غياب",
      category: "المراسلات",
      type: "document",
      description: "طباعة نموذج إنذار غياب مخصص لكل طالب",
      renderDocument: (options, data) => {
        const row = data[0]; // because it iterates over filteredData and passes [row]
        return (
          <div className="p-8 max-w-3xl mx-auto space-y-8 bg-white border-4 border-double border-primary/20 min-h-[600px]">
            <h1 className="text-3xl font-black text-center text-primary underline mb-12">إشعار غياب / تنبيه أكاديمي</h1>
            
            <div className="text-lg space-y-6 leading-relaxed">
              <p>المكرم ولي أمر الطالب / <span className="font-bold border-b-2 border-dashed border-primary px-4">{row.name}</span> المحترم،</p>
              
              <p>
                نفيدكم علماً بأن ابنكم المقيد بالصف (<span className="font-bold text-primary">{row.grade}</span>) 
                شعبة (<span className="font-bold text-primary">{row.sectionId || "غير محدد"}</span>) 
                قد تجاوز نسبة الغياب المسموح بها حسب لوائح وزارة التعليم.
              </p>
              
              <p>
                نأمل منكم مراجعة إدارة شؤون الطلاب في المدرسة في أقرب وقت ممكن لتوضيح الأسباب، 
                تفادياً لتطبيق الإجراءات النظامية والتي قد تصل إلى طي القيد.
              </p>
              
              <p className="mt-8">شاكرين ومقدرين حسن تعاونكم،،،</p>
            </div>
          </div>
        );
      }
    }
  ], [allSections]);

  const handleBulkSoftDelete = () => {
    if (confirm(`هل أنت متأكد من نقل ${selected.size} طالب إلى سلة المهملات؟`)) {
      selected.forEach(id => softDeleteStudent(id));
      setSelected(new Set());
      toast.success("تم نقل الطلاب إلى سلة المهملات بنجاح");
    }
  };

  const handleBulkRestore = () => {
    if (confirm(`هل أنت متأكد من استعادة ${selected.size} طالب؟`)) {
      selected.forEach(id => restoreStudent(id));
      setSelected(new Set());
      toast.success("تم استعادة الطلاب بنجاح");
    }
  };

  const handleBulkHardDelete = () => {
    if (confirm(`تحذير خطير: سيتم حذف ${selected.size} طالب بشكل نهائي مع كافة بياناتهم. هل أنت متأكد؟`)) {
      selected.forEach(id => hardDeleteStudent(id));
      setSelected(new Set());
      toast.success("تم الحذف النهائي بنجاح");
    }
  };

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الطلاب" }]}
      actions={
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-card border border-border rounded-lg p-1 mr-2">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
              title="عرض كقائمة"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
              title="عرض كبطاقات"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-bold hover:bg-accent transition-colors"
          >
            <Printer className="h-4 w-4" /> طباعة متقدمة
          </button>
          <Link
            to="/students/new"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" /> تسجيل طالب
          </Link>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Advanced Filter Bar */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm glass">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`البحث في طلاب ${getStageLabel(stage)} بالاسم أو الهوية...`}
                className="h-12 w-full rounded-xl border border-border/50 bg-background/50 pr-10 pl-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-12 rounded-xl border border-border/50 bg-background/50 px-4 focus:border-primary focus:outline-none transition-all cursor-pointer font-medium"
              >
                <option value="name">ترتيب بالاسم</option>
                <option value="grade">ترتيب بالصف الدراسي</option>
                <option value="id">ترتيب برقم القيد</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setSelected(new Set()); // Reset selection when changing tabs
                }}
                className={`h-12 rounded-xl border px-4 focus:outline-none transition-all cursor-pointer font-bold ${
                  statusFilter === "trash" ? "bg-danger/10 border-danger/30 text-danger" : "border-border/50 bg-background/50"
                }`}
              >
                <option value="all">الكل (نشطين وغير نشطين)</option>
                <option value="active">النشطين فقط</option>
                <option value="inactive">غير النشطين (إيقاف قيد)</option>
                <option value="trash">سلة المهملات (المحذوفين)</option>
              </select>

              <button
                onClick={() => {
                  setQ("");
                  setSelected(new Set());
                  setStatusFilter("all");
                  setSortBy("name");
                }}
                className="h-12 w-12 flex items-center justify-center rounded-xl border border-border/50 bg-background/50 hover:bg-danger/10 hover:text-danger transition-colors shrink-0"
                title="إعادة ضبط"
              >
                <Filter className="h-5 w-5" />
              </button>
            </div>
          </div>

          {selected.size > 0 && (
            <div className={`mt-4 flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl border animate-in slide-in-from-top-2 ${
              statusFilter === "trash" ? "border-danger/20 bg-danger/5" : "border-primary/20 bg-primary/5"
            }`}>
              <span className={`font-bold flex items-center gap-2 ${statusFilter === "trash" ? "text-danger" : "text-primary"}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${statusFilter === "trash" ? "bg-danger" : "bg-primary"}`}>{selected.size}</span>
                طلاب محددين
              </span>
              <div className="flex gap-2">
                {statusFilter === "trash" ? (
                  <>
                    <button
                      onClick={handleBulkRestore}
                      className="rounded-lg bg-success/10 text-success px-4 py-2 text-sm font-bold hover:bg-success/20 transition-colors flex items-center gap-2"
                    >
                      <Undo2 className="h-4 w-4" /> استعادة المحددين
                    </button>
                    <button
                      onClick={handleBulkHardDelete}
                      className="rounded-lg bg-danger text-danger-foreground px-4 py-2 text-sm font-bold hover:bg-danger/90 transition-colors flex items-center gap-2"
                    >
                      <AlertCircle className="h-4 w-4" /> حذف نهائي
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsPrintOpen(true)}
                      className="rounded-lg bg-background border border-border px-4 py-2 text-sm font-bold hover:bg-accent transition-colors flex items-center gap-2"
                    >
                      <Printer className="h-4 w-4" /> طباعة المحددين
                    </button>
                    <button
                      onClick={handleBulkSoftDelete}
                      className="rounded-lg bg-danger/10 text-danger px-4 py-2 text-sm font-bold hover:bg-danger/20 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" /> نقل لسلة المهملات
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              {statusFilter === "trash" ? (
                <><Trash2 className="h-5 w-5 text-danger" /> <span className="text-danger">سلة المهملات</span></>
              ) : (
                <>قائمة طلاب: <span className="text-primary">{getStageLabel(stage)}</span></>
              )}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm font-bold">إجمالي الطلاب المعروضين: {filtered.length} طالب</p>
          </div>
        </div>

        {viewMode === "list" ? (
          <PageCard className="p-0 overflow-hidden shadow-sm border-border/50">
            <DataTable
              rows={filtered}
              columns={[
                {
                  key: "sel",
                  header: "",
                  className: "w-10",
                  cell: (s) => (
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                      onChange={(e) => {
                        const next = new Set(selected);
                        e.target.checked ? next.add(s.id) : next.delete(s.id);
                        setSelected(next);
                      }}
                    />
                  ),
                },
                { key: "no", header: "المعرف", cell: (s) => <span className="font-bold text-muted-foreground text-xs">{s.id}</span> },
                {
                  key: "name",
                  header: "الاسم",
                  cell: (s) => (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0 font-bold">
                        {s.name.split(" ").map(n=>n[0]).slice(0,2).join("")}
                      </div>
                      {statusFilter === "trash" ? (
                        <span className="font-bold text-muted-foreground line-through opacity-70">{s.name}</span>
                      ) : (
                        <Link to="/students/$id" params={{ id: s.id }} className="font-bold hover:text-primary transition-colors">
                          {s.name}
                        </Link>
                      )}
                    </div>
                  ),
                },
                { key: "gr", header: "الصف", cell: (s) => <span className="font-medium">{s.grade}</span> },
                { 
                  key: "sec", 
                  header: "الشعبة", 
                  cell: (s) => {
                    const sec = allSections.find(x => x.id === s.sectionId);
                    return sec ? <span className="bg-muted px-2 py-1 rounded-md text-xs font-bold">{sec.name}</span> : <span className="text-muted-foreground text-xs">-</span>;
                  }
                },
                { key: "guardian", header: "ولي الأمر", cell: (s) => <span className="text-sm">{s.guardianName}</span> },
                {
                  key: "status",
                  header: "الحالة",
                  cell: (s) => (
                    s.isDeleted ? (
                      <span className="px-2 py-1 rounded-md text-xs font-bold bg-danger/10 text-danger flex items-center gap-1 w-max">
                        <Trash2 className="h-3 w-3" /> محذوف
                      </span>
                    ) : (
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${s.status === "نشط" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {s.status || "نشط"}
                      </span>
                    )
                  ),
                },
                {
                  key: "act",
                  header: "",
                  cell: (s) => (
                    <div className="flex items-center gap-1 justify-end">
                      {statusFilter === "trash" ? (
                        <button 
                          onClick={() => {
                            if (confirm(`استعادة الطالب ${s.name}؟`)) restoreStudent(s.id);
                          }}
                          className="rounded-lg p-2 hover:bg-success/10 hover:text-success transition-colors" title="استعادة">
                          <Undo2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <>
                          <Link to="/students/$id" params={{ id: s.id }} className="rounded-lg p-2 hover:bg-primary/10 hover:text-primary transition-colors" aria-label="عرض">
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button 
                            onClick={() => {
                              if (confirm(`نقل الطالب ${s.name} لسلة المهملات؟`)) softDeleteStudent(s.id);
                            }}
                            className="rounded-lg p-2 hover:bg-danger/10 hover:text-danger transition-colors text-muted-foreground" aria-label="نقل للمهملات">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  ),
                },
              ]}
              empty={statusFilter === "trash" ? "سلة المهملات فارغة." : `لا توجد نتائج تطابق بحثك في مرحلة ${getStageLabel(stage)}.`}
            />
          </PageCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(s => {
              const sec = allSections.find(x => x.id === s.sectionId);
              return (
                <div key={s.id} className={`relative group rounded-3xl border border-border/50 p-5 shadow-sm hover:shadow-md transition-all ${s.isDeleted ? 'bg-danger/5' : 'bg-card hover:border-primary/30'}`}>
                  <div className="absolute top-4 left-4">
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary cursor-pointer opacity-50 group-hover:opacity-100 transition-opacity"
                      onChange={(e) => {
                        const next = new Set(selected);
                        e.target.checked ? next.add(s.id) : next.delete(s.id);
                        setSelected(next);
                      }}
                    />
                  </div>
                  
                  <div className="flex flex-col items-center text-center mt-2">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black mb-4 shadow-inner ${s.isDeleted ? 'bg-danger/10 text-danger' : 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary'}`}>
                      {s.name.split(" ").map(n=>n[0]).slice(0,2).join("")}
                    </div>
                    {s.isDeleted ? (
                      <div className="font-extrabold text-lg line-clamp-1 mb-1 text-muted-foreground line-through opacity-70">
                        {s.name}
                      </div>
                    ) : (
                      <Link to="/students/$id" params={{ id: s.id }} className="font-extrabold text-lg hover:text-primary transition-colors line-clamp-1 mb-1">
                        {s.name}
                      </Link>
                    )}
                    <span className="text-xs text-muted-foreground tabular-nums bg-accent px-2 py-0.5 rounded-md mb-4">{s.id}</span>
                    
                    <div className="w-full space-y-2 mt-2 pt-4 border-t border-border/50 text-right">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">الصف:</span>
                        <span className="font-bold">{s.grade}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">الشعبة:</span>
                        <span className="font-bold">{sec ? sec.name : "-"}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">الحالة:</span>
                        {s.isDeleted ? (
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-danger/10 text-danger flex items-center gap-1"><Trash2 className="h-3 w-3"/> محذوف</span>
                        ) : (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${s.status === "نشط" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                            {s.status || "نشط"}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {s.isDeleted ? (
                      <button onClick={() => {
                        if(confirm("استعادة الطالب؟")) restoreStudent(s.id);
                      }} className="w-full mt-5 rounded-xl bg-success/10 text-success py-2.5 text-sm font-bold hover:bg-success hover:text-success-foreground transition-colors flex items-center justify-center gap-2">
                        <Undo2 className="h-4 w-4" /> استعادة الطالب
                      </button>
                    ) : (
                      <Link to="/students/$id" params={{ id: s.id }} className="w-full mt-5 rounded-xl bg-primary/10 text-primary py-2.5 text-sm font-bold hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center gap-2">
                        <Eye className="h-4 w-4" /> عرض الملف
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
            
            {filtered.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground font-bold border border-dashed border-border/50 rounded-3xl">
                لا توجد نتائج مطابقة للبحث في العرض الحالي.
              </div>
            )}
          </div>
        )}
      </div>
      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        data={statusFilter === "trash" ? allDeletedStudents : selected.size > 0 ? filtered.filter(s => selected.has(s.id)) : filtered}
        templates={printTemplates} 
      />
    </AppShell>
  );
}
