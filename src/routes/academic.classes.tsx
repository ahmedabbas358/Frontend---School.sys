import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { EducationalStage, useStage, GRADE_OPTIONS } from "@/contexts/StageContext";
import { Plus, Pencil, Trash2, X, Users, AlertCircle, Search, ChevronDown, Check, Printer, LayoutGrid, List, ArrowRight, UserPlus, UserMinus, FileText, Download, FileSpreadsheet, Eye, DollarSign } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/academic/classes")({
  component: AcademicSectionsPage,
});


function TeacherSelect({ 
  value, 
  onChange, 
  options 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: {id: string, name: string, role: string}[] 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    o.role.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(o => o.name === value);

  return (
    <div className="relative" ref={ref}>
      <div 
        className="flex items-center justify-between w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 cursor-pointer hover:border-primary transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? "text-foreground font-bold" : "text-muted-foreground"}>
          {selectedOption ? `${selectedOption.name} (${selectedOption.role})` : "-- ابحث واختر المعلم --"}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 rounded-xl border border-border bg-card shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-border flex items-center gap-2 px-3 bg-background/50">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input 
              autoFocus
              type="text" 
              placeholder="ابحث بالاسم أو التخصص..." 
              className="w-full bg-transparent border-none focus:outline-none text-sm py-1 font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            <div 
              className={`px-3 py-2 text-sm rounded-lg cursor-pointer flex items-center justify-between hover:bg-accent ${!value ? "bg-primary/10 text-primary font-bold" : ""}`}
              onClick={() => { onChange(""); setIsOpen(false); setSearch(""); }}
            >
              <span className="font-bold">بدون رائد فصل</span>
              {!value && <Check className="h-4 w-4" />}
            </div>
            
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-center text-muted-foreground font-bold">لا يوجد نتائج للبحث</div>
            ) : (
              filteredOptions.map(t => (
                <div 
                  key={t.id}
                  className={`px-3 py-2 text-sm rounded-lg cursor-pointer flex items-center justify-between hover:bg-accent transition-colors ${value === t.name ? "bg-primary/10 text-primary font-bold" : ""}`}
                  onClick={() => { onChange(t.name); setIsOpen(false); setSearch(""); }}
                >
                  <div className="flex flex-col">
                    <span className="font-bold">{t.name}</span>
                    <span className="text-xs text-muted-foreground opacity-80">{t.role}</span>
                  </div>
                  {value === t.name && <Check className="h-4 w-4" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Print Engine has been moved to src/components/print-engine.tsx ---

// --- Section Detail View ---
function SectionDetailView({ sectionId, onBack }: { sectionId: string, onBack: () => void }) {
  const { currency, activeStageSections, activeStageStudents, assignStudentToSection, allInvoices, allPayments, allRooms, assignSectionToRoom } = useGlobalStore();
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const section = activeStageSections.find(s => s.id === sectionId);
  if (!section) return <div className="text-center p-8 font-bold">شعبة غير موجودة</div>;

  const sectionStudents = activeStageStudents.filter(s => s.sectionId === section.id);
  const unassignedStudents = activeStageStudents.filter(s => s.grade === section.grade && s.sectionId !== section.id);
  
  const filteredUnassigned = unassignedStudents.filter(s => s.name.includes(searchQuery) || s.nationalId?.includes(searchQuery));

  // Financial data for this section's students
  const sectionStudentIds = useMemo(() => new Set(sectionStudents.map(s => s.id)), [sectionStudents]);
  const sectionInvoices = useMemo(() => allInvoices.filter(inv => sectionStudentIds.has(inv.studentId)), [allInvoices, sectionStudentIds]);
  const sectionInvoiceIds = useMemo(() => new Set(sectionInvoices.map(i => i.id)), [sectionInvoices]);
  const sectionPayments = useMemo(() => allPayments.filter(p => p.invoiceId && sectionInvoiceIds.has(p.invoiceId)), [allPayments, sectionInvoiceIds]);
  
  const financeStats = useMemo(() => {
    const totalExpected = sectionInvoices.reduce((sum, inv) => sum + (inv.netAmount ?? inv.amount), 0);
    const totalPaid = sectionPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = totalExpected - totalPaid;
    const overdueStudents = sectionInvoices.filter(inv => inv.status === 'issued' || inv.status === 'partial').length;
    return { totalExpected, totalPaid, totalDue, overdueStudents };
  }, [sectionInvoices, sectionPayments]);

  // Per-student financial status
  const getStudentFinanceStatus = (studentId: string) => {
    const studentInvoices = sectionInvoices.filter(inv => inv.studentId === studentId);
    if (studentInvoices.length === 0) return { status: 'none' as const, due: 0 };
    const totalExpected = studentInvoices.reduce((s, i) => s + (i.netAmount ?? i.amount), 0);
    const totalPaid = studentInvoices.reduce((s, i) => s + i.paid, 0);
    const due = totalExpected - totalPaid;
    if (due <= 0) return { status: 'paid' as const, due: 0 };
    if (totalPaid > 0) return { status: 'partial' as const, due };
    return { status: 'issued' as const, due };
  };

  const handleAddStudent = (studentId: string) => {
    assignStudentToSection(studentId, section.id);
    toast.success("تم إضافة الطالب للشعبة");
  };

  const handleRemoveStudent = (studentId: string) => {
    assignStudentToSection(studentId, undefined);
    toast.success("تم إزالة الطالب من الشعبة");
  };

  const occupancyRate = sectionStudents.length / section.capacity;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-card border border-border/50 rounded-3xl p-6 shadow-sm relative overflow-hidden glass">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="flex items-center gap-4 z-10">
          <button onClick={onBack} className="p-3 bg-muted hover:bg-accent rounded-xl transition-colors">
            <ArrowRight className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-extrabold">{section.grade} - شعبة {section.name}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <p className="text-muted-foreground font-bold">رائد الفصل: {section.homeroomTeacher || "غير محدد"}</p>
              <span className="text-border">•</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">القاعة:</span>
                <select 
                  value={section.roomId || ""} 
                  onChange={(e) => {
                    assignSectionToRoom(section.id, e.target.value || undefined);
                    toast.success("تم تحديث القاعة المخصصة للشعبة بنجاح");
                  }}
                  className="text-xs font-bold bg-background border border-border rounded-lg px-2.5 py-1 text-primary focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="">-- بدون قاعة مخصصة --</option>
                  {allRooms.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.building} - {r.floor}) {r.assignedSectionId && r.assignedSectionId !== section.id ? `[مشغولة بـ ${r.assignedSectionName}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 z-10 bg-background/50 p-4 rounded-2xl border border-border/50">
          <div>
            <p className="text-xs text-muted-foreground font-bold mb-1">الطلاب</p>
            <p className="text-2xl font-black tabular-nums">{sectionStudents.length}</p>
          </div>
          <div className="h-10 w-px bg-border/50"></div>
          <div>
            <p className="text-xs text-muted-foreground font-bold mb-1">الاستيعاب</p>
            <p className="text-2xl font-black tabular-nums">{section.capacity}</p>
          </div>
          <div className="w-24">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>الإشغال</span>
              <span className="tabular-nums">{Math.round(occupancyRate * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${occupancyRate > 0.9 ? 'bg-danger' : occupancyRate > 0.7 ? 'bg-warning' : 'bg-success'}`}
                style={{ width: `${Math.min(100, occupancyRate * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary Card */}
      <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm mb-6 relative overflow-hidden glass">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-bold">الملخص المالي للشعبة</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-1">إجمالي المطالبات</p>
            <p className="text-2xl font-black text-primary tabular-nums">{financeStats.totalExpected.toLocaleString()} <span className="text-sm">{currency}</span></p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-1">إجمالي المحصل</p>
            <p className="text-2xl font-black text-success tabular-nums">{financeStats.totalPaid.toLocaleString()} <span className="text-sm">{currency}</span></p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-1">المتبقي للتحصيل</p>
            <p className="text-2xl font-black text-danger tabular-nums">{financeStats.totalDue.toLocaleString()} <span className="text-sm">{currency}</span></p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-1">فواتير متأخرة</p>
            <p className="text-2xl font-black text-warning tabular-nums">{financeStats.overdueStudents}</p>
          </div>
        </div>
        
        {/* Collection Rate Progress */}
        <div className="mt-6 pt-6 border-t border-border/50 relative z-10">
          <div className="flex justify-between items-center text-sm font-bold mb-2">
            <span>نسبة التحصيل:</span>
            <span>{financeStats.totalExpected > 0 ? Math.round((financeStats.totalPaid / financeStats.totalExpected) * 100) : 0}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div 
              className="h-full bg-success transition-all duration-1000"
              style={{ width: `${financeStats.totalExpected > 0 ? Math.min(100, (financeStats.totalPaid / financeStats.totalExpected) * 100) : 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <PageCard 
            title={`قائمة الطلاب (${sectionStudents.length})`}
            actions={
              <button 
                onClick={() => setIsAddStudentOpen(true)}
                className="flex items-center gap-2 text-sm font-bold bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow-sm hover:scale-105 transition-all"
              >
                <UserPlus className="h-4 w-4" /> إضافة طلاب للشعبة
              </button>
            }
          >
            <DataTable
              rows={sectionStudents}
              empty="لا يوجد طلاب مسجلين في هذه الشعبة بعد."
              columns={[
                { key: "nm", header: "اسم الطالب", cell: s => (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <Link to="/students/$id" params={{ id: s.id }} className="font-bold hover:text-primary transition-colors">{s.name}</Link>
                  </div>
                )},
                { key: "nid", header: "رقم الهوية", cell: s => <span className="tabular-nums text-muted-foreground font-medium">{s.nationalId}</span> },
                { key: "finance", header: "الحالة المالية", cell: s => {
                  const fs = getStudentFinanceStatus(s.id);
                  if (fs.status === 'none') return <span className="text-xs text-muted-foreground">—</span>;
                  return (
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                      fs.status === 'paid' ? 'bg-success/10 text-success' :
                      fs.status === 'partial' ? 'bg-warning/10 text-warning' :
                      'bg-danger/10 text-danger'
                    }`}>
                      {fs.status === 'paid' ? 'مسدد' : fs.status === 'partial' ? `جزئي (${fs.due.toLocaleString()} {currency})` : `معلق (${fs.due.toLocaleString()} {currency})`}
                    </span>
                  );
                }},
                { key: "act", header: "", cell: s => (
                  <div className="flex justify-end gap-2">
                    <Link to="/students/$id" params={{ id: s.id }} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors" title="عرض الملف">
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button onClick={() => handleRemoveStudent(s.id)} className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors" title="إزالة من الشعبة">
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </div>
                )}
              ]}
            />
          </PageCard>
        </div>

        {/* Add Student Sidebar Modal-like */}
        {isAddStudentOpen && (
          <div className="md:col-span-1">
            <div className="bg-card border border-border/50 rounded-3xl p-5 shadow-xl glass sticky top-6 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">طلاب غير موزعين</h3>
                <button onClick={() => setIsAddStudentOpen(false)} className="p-1.5 hover:bg-accent rounded-lg transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="ابحث بالاسم أو الهوية..." 
                  className="w-full bg-background border border-border/50 rounded-xl pr-9 pl-4 py-2 text-sm font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredUnassigned.length === 0 ? (
                  <div className="text-center py-6 text-sm font-bold text-muted-foreground">لا يوجد طلاب مطابقين للبحث</div>
                ) : (
                  filteredUnassigned.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50 hover:border-primary/30 transition-colors group">
                      <div>
                        <p className="text-sm font-bold mb-0.5 truncate max-w-[150px]">{s.name}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">{s.nationalId}</p>
                      </div>
                      <button 
                        onClick={() => handleAddStudent(s.id)}
                        className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Page Component ---
function AcademicSectionsPage() {
  const { currency, activeStageSections, activeStageStudents, activeStageInvoices, addSection, updateSection, deleteSection, activeStageStaff  } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  
  const [viewMode, setViewMode] = useState<"grades" | "list">("grades");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", grade: "", capacity: 30, homeroomTeacher: "" });

  const [searchQ, setSearchQ] = useState("");
  const [sortBy, setSortBy] = useState("grade"); // "grade" | "name" | "capacity"

  // Enrich sections with actual assigned students count
  const enrichedSections = useMemo(() => {
    return activeStageSections.map(sec => {
      const assignedCount = activeStageStudents.filter(s => s.sectionId === sec.id).length;
      return { ...sec, used: assignedCount };
    });
  }, [activeStageSections, activeStageStudents]);

  // Group sections by grade for Grid View
  const groupedByGrade = useMemo(() => {
    const groups: Record<string, typeof enrichedSections> = {};
    (GRADE_OPTIONS[stage] || []).forEach(g => groups[g] = []);
    enrichedSections.forEach(sec => {
      if (groups[sec.grade]) groups[sec.grade].push(sec);
    });
    return groups;
  }, [enrichedSections, stage]);

  // Filtered and Sorted list for List View
  const processedList = useMemo(() => {
    let result = [...enrichedSections];
    if (searchQ) {
      const q = searchQ.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.grade.toLowerCase().includes(q) || 
        (s.homeroomTeacher || "").toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "capacity") return b.capacity - a.capacity;
      return a.grade.localeCompare(b.grade);
    });
    return result;
  }, [enrichedSections, searchQ, sortBy]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", grade: (GRADE_OPTIONS[stage] || [])[0] || "", capacity: 30, homeroomTeacher: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (sec: typeof activeStageSections[0], e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(sec.id);
    setFormData({ name: sec.name, grade: sec.grade, capacity: sec.capacity, homeroomTeacher: sec.homeroomTeacher || "" });
    setIsModalOpen(true);
  };

  const openDeleteModal = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSectionToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.grade) return toast.error("الرجاء تعبئة الحقول الإلزامية");
    
    if (editingId) {
      updateSection(editingId, { name: formData.name, grade: formData.grade, capacity: Number(formData.capacity), homeroomTeacher: formData.homeroomTeacher || undefined });
      toast.success("تم تعديل الشعبة بنجاح");
    } else {
      addSection({ name: formData.name, grade: formData.grade, capacity: Number(formData.capacity), stage, homeroomTeacher: formData.homeroomTeacher || undefined });
      toast.success("تمت إضافة الشعبة بنجاح");
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (sectionToDelete) {
      deleteSection(sectionToDelete);
      toast.success("تم حذف الشعبة بنجاح");
      setIsDeleteModalOpen(false);
      setSectionToDelete(null);
      if (selectedSectionId === sectionToDelete) setSelectedSectionId(null);
    }
  };

  // If a specific section is selected, render the Detail View
  if (selectedSectionId) {
    return (
      <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "إدارة الفصول", onClick: () => setSelectedSectionId(null) }, { label: "تفاصيل الشعبة" }]}>
        <SectionDetailView sectionId={selectedSectionId} onBack={() => setSelectedSectionId(null)} />
      </AppShell>
    );
  }

  // Print templates for section lists
  const printTemplates: PrintTemplate[] = useMemo(() => {
    return [
      {
        id: "attendance", name: "سجل غياب وحضور", category: "سجلات يومية", type: "table",
        columns: [
          { key: "name", label: "اسم الطالب" },
          { key: "nationalId", label: "رقم الهوية" },
        ],
        extraDynamicColumns: 10,
        extraDynamicColumnLabel: "يوم {i}",
      },
      {
        id: "marks", name: "سجل متابعة درجات", category: "أكاديمي", type: "table",
        columns: [
          { key: "name", label: "اسم الطالب" },
          { key: "participation", label: "المشاركة", render: () => "" },
          { key: "hw", label: "الواجبات", render: () => "" },
          { key: "exam", label: "الاختبار القصير", render: () => "" },
          { key: "total", label: "المجموع الكلي", render: () => "" },
        ]
      },
      {
        id: "contact", name: "دليل هواتف أولياء الأمور", category: "عام", type: "table",
        columns: [
          { key: "name", label: "اسم الطالب" },
          { key: "guardianPhone", label: "رقم التواصل", render: () => "05XXXXXXXX" }, // Placeholder phone if missing
        ]
      },
      {
        id: "desk_labels", name: "ملصقات جلوس", category: "عام", type: "document",
        renderDocument: () => {
          const sectionStudents = selectedSectionId ? activeStageStudents.filter(s => s.sectionId === selectedSectionId) : [];
          return (
            <div className="grid grid-cols-2 gap-x-6 gap-y-8">
              {sectionStudents.map((s, i) => (
                <div key={i} className="border-2 border-gray-800 rounded-xl p-4 flex gap-4 h-36 break-inside-avoid shadow-sm bg-white">
                  <div className="w-24 border-2 border-dashed border-gray-400 bg-gray-50 flex items-center justify-center text-gray-400 text-xs text-center rounded">صورة</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-center border-b-2 border-gray-800 pb-1 mb-2">مدارس الأهلية</h3>
                    <p className="text-xs mb-1.5"><span className="text-gray-500 font-bold inline-block w-12">الاسم:</span> <span className="font-bold text-sm">{s.name}</span></p>
                    <p className="text-xs mb-1.5"><span className="text-gray-500 font-bold inline-block w-12">الصف:</span> <span className="font-bold">{activeStageSections.find(sec => sec.id === selectedSectionId)?.grade}</span></p>
                    <p className="text-xs"><span className="text-gray-500 font-bold inline-block w-12">الشعبة:</span> <span className="font-bold">{activeStageSections.find(sec => sec.id === selectedSectionId)?.name}</span></p>
                  </div>
                </div>
              ))}
            </div>
          );
        }
      }
    ];
  }, [activeStageStudents, selectedSectionId, activeStageSections]);

  return (
    <AppShell
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الإدارة الأكاديمية" }, { label: "إدارة الفصول" }]}
      actions={
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-card border border-border/50 px-4 text-sm font-bold hover:bg-accent transition-colors shadow-sm"
          >
            <Printer className="h-4 w-4" /> الطباعة
          </button>
          <button 
            onClick={openAddModal}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4" /> شعبة جديدة
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
        
        {/* View Toggle & Search Bar */}
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between bg-card p-3 rounded-2xl border border-border/50 shadow-sm glass">
          <div className="flex bg-muted/50 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode("grades")} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === "grades" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="h-4 w-4" /> عرض البطاقات
            </button>
            <button 
              onClick={() => setViewMode("list")} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="h-4 w-4" /> عرض القائمة
            </button>
          </div>

          <div className="flex-1 w-full md:max-w-md relative">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="ابحث عن شعبة، صف، أو معلم..."
              className="h-11 w-full rounded-xl border border-border/50 bg-background pr-11 pl-4 text-sm font-bold shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* --- View Rendering --- */}
        {viewMode === "grades" ? (
          <div className="space-y-10">
            {Object.entries(groupedByGrade).map(([grade, secs]) => (
              <div key={grade} className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-black">{grade}</h2>
                  <div className="flex-1 h-px bg-border/50"></div>
                  <span className="text-sm font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full">{secs.length} شعب</span>
                </div>
                
                {secs.length === 0 ? (
                  <div className="text-center py-8 bg-card/50 border border-dashed border-border/50 rounded-3xl text-muted-foreground font-bold">لا يوجد شُعب مضافة في هذا الصف</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {secs.map(sec => {
                      const occRate = sec.used / sec.capacity;
                      return (
                        <div 
                          key={sec.id} 
                          onClick={() => setSelectedSectionId(sec.id)}
                          className="group relative bg-card border border-border/50 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all cursor-pointer overflow-hidden flex flex-col h-full"
                        >
                          <div className={`absolute top-0 left-0 w-full h-1 ${occRate > 0.9 ? 'bg-danger' : occRate > 0.7 ? 'bg-warning' : 'bg-success'}`}></div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 text-primary font-black text-xl group-hover:scale-110 transition-transform">
                              {sec.name}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => openEditModal(sec, e)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg"><Pencil className="h-3.5 w-3.5"/></button>
                              <button onClick={(e) => openDeleteModal(sec.id, e)} className="p-1.5 text-danger hover:bg-danger/10 rounded-lg"><Trash2 className="h-3.5 w-3.5"/></button>
                            </div>
                          </div>
                          <p className="text-muted-foreground font-bold text-sm mb-1">{sec.homeroomTeacher || "بدون رائد فصل"}</p>
                          <div className="mt-auto pt-4 space-y-3">
                            <div className="flex items-end justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground font-bold mb-1">الطلاب</p>
                                <p className="text-lg font-black tabular-nums">{sec.used} <span className="text-xs font-normal text-muted-foreground">/ {sec.capacity}</span></p>
                              </div>
                              <div className="w-16">
                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div className={`h-full rounded-full ${occRate > 0.9 ? 'bg-danger' : occRate > 0.7 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${Math.min(100, occRate * 100)}%` }}></div>
                                </div>
                              </div>
                            </div>
                            {(() => {
                              const secStudentIds = new Set(activeStageStudents.filter(s => s.sectionId === sec.id).map(s => s.id));
                              const secInvoices = activeStageInvoices.filter(inv => secStudentIds.has(inv.studentId));
                              const secExpected = secInvoices.reduce((sum, inv) => sum + (inv.netAmount ?? inv.amount), 0);
                              const secPaid = secInvoices.reduce((sum, inv) => sum + inv.paid, 0);
                              const secDue = secExpected - secPaid;
                              if (secExpected === 0) return null;
                              const paidRate = secExpected > 0 ? Math.round((secPaid / secExpected) * 100) : 0;
                              return (
                                <div className="pt-3 border-t border-border/30">
                                  <div className="flex items-center gap-1 mb-1">
                                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-[10px] font-bold text-muted-foreground">تحصيل {paidRate}%</span>
                                  </div>
                                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                                    <div className={`h-full rounded-full ${paidRate >= 80 ? 'bg-success' : paidRate >= 50 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${paidRate}%` }}></div>
                                  </div>
                                  {secDue > 0 && <p className="text-[10px] text-danger font-bold mt-1 tabular-nums">متبقي: {secDue.toLocaleString()} {currency}</p>}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <PageCard>
            <DataTable
              rows={processedList}
              empty="لا توجد شعب مطابقة للبحث."
              columns={[
                { key: "n", header: "الشعبة", cell: s => <span className="font-bold text-primary cursor-pointer hover:underline" onClick={() => setSelectedSectionId(s.id)}>شعبة {s.name}</span> },
                { key: "g", header: "الصف الدراسي", cell: s => <span className="font-bold">{s.grade}</span> },
                { key: "t", header: "رائد الفصل", cell: s => <span className="text-muted-foreground font-medium">{s.homeroomTeacher || "غير محدد"}</span> },
                { key: "u", header: "معدل الإشغال", cell: s => (
                  <div className="flex items-center gap-3 w-48">
                    <span className="tabular-nums font-bold text-sm w-12 text-left">{s.used}/{s.capacity}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted border border-border/50">
                      <div className={`h-full rounded-full transition-all duration-1000 ${(s.used/s.capacity) > 0.9 ? "bg-danger" : (s.used/s.capacity) > 0.7 ? "bg-warning" : "bg-success"}`} style={{ width: `${Math.min(100, (s.used/s.capacity) * 100)}%` }} />
                    </div>
                  </div>
                )},
                { key: "act", header: "", cell: s => (
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setSelectedSectionId(s.id)} className="rounded-lg p-2 text-primary hover:bg-primary/10 transition-colors" title="التفاصيل"><ArrowRight className="h-4 w-4" /></button>
                    <button onClick={() => openEditModal(s)} className="rounded-lg p-2 text-primary hover:bg-primary/10 transition-colors" title="تعديل"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => openDeleteModal(s.id)} className="rounded-lg p-2 text-danger hover:bg-danger/10 transition-colors" title="حذف"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )},
              ]}
            />
          </PageCard>
        )}

      </div>

      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title={`كشوف قوائم شعبة (${activeStageSections.find(s => s.id === selectedSectionId)?.name || ""})`}
        subtitle={`الصف: ${activeStageSections.find(s => s.id === selectedSectionId)?.grade || ""} \nمربي الفصل: ${activeStageSections.find(s => s.id === selectedSectionId)?.homeroomTeacher || ""}`}
        data={selectedSectionId ? activeStageStudents.filter(s => s.sectionId === selectedSectionId) : []}
        templates={printTemplates}
      />

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-7 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingId ? "تعديل بيانات الشعبة" : "إضافة شعبة جديدة"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="rounded-full p-2 hover:bg-accent transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-muted-foreground">الصف الدراسي المستهدف *</label>
                  <select
                    required
                    className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold cursor-pointer"
                    value={formData.grade}
                    onChange={e => setFormData({...formData, grade: e.target.value})}
                  >
                    <option value="" disabled>-- اختر الصف --</option>
                    {(GRADE_OPTIONS[stage] || []).map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-muted-foreground">اسم/رمز الشعبة *</label>
                  <input
                    required
                    placeholder="مثال: أ، ب، ج..."
                    className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">رائد الفصل (اختياري)</label>
                <TeacherSelect 
                  value={formData.homeroomTeacher}
                  onChange={(val) => setFormData({...formData, homeroomTeacher: val})}
                  options={activeStageStaff}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-muted-foreground">الطاقة الاستيعابية القصوى</label>
                <input 
                  type="number" 
                  min="5" max="100"
                  required
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-bold tabular-nums"
                  value={formData.capacity}
                  onChange={e => setFormData({...formData, capacity: Number(e.target.value)})}
                />
              </div>

              <div className="pt-5 mt-2 border-t border-border/50 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl px-5 py-2.5 font-bold hover:bg-accent transition-colors">إلغاء</button>
                <button type="submit" className="rounded-xl bg-primary px-8 py-2.5 font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm hover:scale-105">
                  {editingId ? "حفظ التعديلات" : "إضافة الشعبة"}
                </button>
              </div>
            </form>
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
              <p className="text-muted-foreground mb-6 font-bold">هل أنت متأكد أنك تريد حذف هذه الشعبة؟ لا يمكن التراجع.</p>
              
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
        title="تقارير الإدارة الأكاديمية"
        subtitle={selectedSectionId ? `للشعبة: ${activeStageSections.find(s => s.id === selectedSectionId)?.name}` : `للمرحلة: ${getStageLabel(stage)}`}
        data={selectedSectionId ? activeStageStudents.filter(s => s.sectionId === selectedSectionId) : activeStageStudents}
        templates={printTemplates}
      />
    </AppShell>
  );
}
