import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore, Section } from "@/contexts/GlobalStoreContext";
import { EducationalStage, useStage, GRADE_OPTIONS } from "@/contexts/StageContext";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Users, 
  AlertCircle, 
  Search, 
  ChevronDown, 
  Check, 
  Printer, 
  LayoutGrid, 
  List, 
  ArrowRight, 
  UserPlus, 
  UserMinus, 
  FileText, 
  Eye, 
  DollarSign, 
  School, 
  Sparkles, 
  ArrowLeftRight, 
  DoorOpen, 
  GraduationCap, 
  CheckCircle2, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Filter, 
  ChevronLeft, 
  Building2, 
  UserCheck, 
  RefreshCw, 
  Layers3, 
  BookOpen,
  ArrowUpRight,
  ChevronRight
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";

export const Route = createFileRoute("/academic/classes")({
  head: () => ({ meta: [{ title: "إدارة الصفوف والشُعب الدراسية | منصة مدارس" }] }),
  component: AcademicSectionsPage,
});

// =========================================================================
// Component: Teacher Luxury Search & Select
// =========================================================================
function TeacherSelect({ 
  value, 
  onChange, 
  options 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: { id: string; name: string; role: string; department?: string }[];
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

  const filteredOptions = useMemo(() => {
    const q = search.toLowerCase();
    return options.filter(o => 
      o.name.toLowerCase().includes(q) || 
      (o.role || "").toLowerCase().includes(q) ||
      (o.department || "").toLowerCase().includes(q)
    );
  }, [options, search]);

  const selectedOption = useMemo(() => options.find(o => o.name === value), [options, value]);

  return (
    <div className="relative" ref={ref} dir="rtl">
      <div 
        tabIndex={0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex items-center justify-between w-full h-11 rounded-xl border px-3.5 text-xs font-bold cursor-pointer transition-all duration-200 shadow-xs outline-none ${
          isOpen
            ? "border-primary ring-4 ring-primary/15 bg-background text-foreground"
            : "border-input bg-background/80 hover:border-primary/45 text-foreground"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 truncate">
          <div className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] shrink-0">
            {selectedOption ? selectedOption.name.charAt(0) : <UserCheck className="w-3.5 h-3.5" />}
          </div>
          <span className={selectedOption ? "text-foreground font-bold truncate" : "text-muted-foreground/60"}>
            {selectedOption ? `${selectedOption.name} (${selectedOption.role})` : "-- ابحث واختر رائد الفصل المشرف --"}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground opacity-70 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 rounded-2xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2.5 border-b border-border/60 flex items-center gap-2 bg-muted/20">
            <Search className="h-4 w-4 text-muted-foreground opacity-60 shrink-0" />
            <input 
              autoFocus
              type="text" 
              placeholder="ابحث بالاسم أو التخصص..." 
              className="w-full bg-transparent border-none focus:outline-none text-xs font-bold placeholder:text-muted-foreground/60 text-foreground"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar-modal space-y-0.5">
            <div 
              className={`px-3 py-2 text-xs rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                !value ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted/60"
              }`}
              onClick={() => { onChange(""); setIsOpen(false); setSearch(""); }}
            >
              <span className="font-bold">بدون رائد فصل (غير محدد)</span>
              {!value && <Check className="h-4 w-4" />}
            </div>
            
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-xs text-center text-muted-foreground font-bold">لا توجد نتائج مطابقة للبحث</div>
            ) : (
              filteredOptions.map(t => (
                <div 
                  key={t.id}
                  className={`px-3 py-2 text-xs rounded-xl cursor-pointer flex items-center justify-between transition-all active:scale-[0.99] ${
                    value === t.name ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-muted/60 font-medium"
                  }`}
                  onClick={() => { onChange(t.name); setIsOpen(false); setSearch(""); }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold">{t.name}</span>
                    <span className="text-[11px] text-muted-foreground opacity-80">{t.role} {t.department ? `• ${t.department}` : ""}</span>
                  </div>
                  {value === t.name && <Check className="h-4 w-4 text-primary font-bold shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// Component: Room Luxury Search & Select
// =========================================================================
function RoomSelect({
  value,
  currentSectionId,
  onChange,
  rooms
}: {
  value: string;
  currentSectionId?: string;
  onChange: (roomId: string) => void;
  rooms: { id: string; name: string; building: string; floor: string; capacity?: number; assignedSectionId?: string; assignedSectionName?: string }[];
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

  const filteredRooms = useMemo(() => {
    const q = search.toLowerCase();
    return rooms.filter(r => 
      r.name.toLowerCase().includes(q) || 
      (r.building || "").toLowerCase().includes(q) || 
      (r.floor || "").toLowerCase().includes(q)
    );
  }, [rooms, search]);

  const selectedRoom = useMemo(() => rooms.find(r => r.id === value), [rooms, value]);

  return (
    <div className="relative" ref={ref} dir="rtl">
      <div 
        tabIndex={0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`flex items-center justify-between w-full h-11 rounded-xl border px-3.5 text-xs font-bold cursor-pointer transition-all duration-200 shadow-xs outline-none ${
          isOpen
            ? "border-primary ring-4 ring-primary/15 bg-background text-foreground"
            : "border-input bg-background/80 hover:border-primary/45 text-foreground"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 truncate">
          <DoorOpen className="w-4 h-4 text-primary shrink-0" />
          <span className={selectedRoom ? "text-foreground font-bold truncate" : "text-muted-foreground/60"}>
            {selectedRoom 
              ? `${selectedRoom.name} (${selectedRoom.building} - ${selectedRoom.floor})` 
              : "-- اختر القاعة الدراسية المخصصة --"}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground opacity-70 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 rounded-2xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2.5 border-b border-border/60 flex items-center gap-2 bg-muted/20">
            <Search className="h-4 w-4 text-muted-foreground opacity-60 shrink-0" />
            <input 
              autoFocus
              type="text" 
              placeholder="ابحث باسم القاعة، المبنى، أو الدور..." 
              className="w-full bg-transparent border-none focus:outline-none text-xs font-bold placeholder:text-muted-foreground/60 text-foreground"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar-modal space-y-0.5">
            <div 
              className={`px-3 py-2 text-xs rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                !value ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted/60"
              }`}
              onClick={() => { onChange(""); setIsOpen(false); setSearch(""); }}
            >
              <span className="font-bold">بدون قاعة دراسية (مختبر/غير محدد)</span>
              {!value && <Check className="h-4 w-4" />}
            </div>
            
            {filteredRooms.length === 0 ? (
              <div className="px-3 py-6 text-xs text-center text-muted-foreground font-bold">لا توجد قاعات مطابقة للبحث</div>
            ) : (
              filteredRooms.map(r => {
                const isOccupiedByOther = r.assignedSectionId && r.assignedSectionId !== currentSectionId;
                return (
                  <div 
                    key={r.id}
                    className={`px-3 py-2 text-xs rounded-xl cursor-pointer flex items-center justify-between transition-all active:scale-[0.99] ${
                      value === r.id ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-muted/60 font-medium"
                    }`}
                    onClick={() => { onChange(r.id); setIsOpen(false); setSearch(""); }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{r.name}</span>
                        {isOccupiedByOther ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            مشغولة بـ {r.assignedSectionName}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            قاعة شاغرة
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground opacity-80">{r.building} - {r.floor} {r.capacity ? `(سعة ${r.capacity} مقعد)` : ''}</span>
                    </div>
                    {value === r.id && <Check className="h-4 w-4 text-primary font-bold shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// Component: Section Detail & Student Management View
// (Hook Calls hoisted unconditionally to prevent any render crash)
// =========================================================================
function SectionDetailView({ 
  sectionId, 
  onBack,
  onEditSection
}: { 
  sectionId: string; 
  onBack: () => void;
  onEditSection: (sec: Section) => void;
}) {
  const { 
    currency, 
    activeStageSections, 
    activeStageStudents, 
    assignStudentToSection, 
    allInvoices, 
    allPayments, 
    allRooms, 
    assignSectionToRoom 
  } = useGlobalStore();

  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transferModalStudent, setTransferModalStudent] = useState<{ id: string; name: string } | null>(null);
  const [targetTransferSectionId, setTargetTransferSectionId] = useState<string>("");

  // Hoist all hooks unconditionally
  const section = useMemo(() => activeStageSections.find(s => s.id === sectionId), [activeStageSections, sectionId]);
  const sectionStudents = useMemo(() => activeStageStudents.filter(s => s.sectionId === sectionId), [activeStageStudents, sectionId]);
  
  const unassignedStudents = useMemo(() => {
    if (!section) return [];
    return activeStageStudents.filter(s => s.grade === section.grade && s.sectionId !== section.id);
  }, [activeStageStudents, section]);
  
  const filteredUnassigned = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return unassignedStudents.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.nationalId && s.nationalId.includes(q))
    );
  }, [unassignedStudents, searchQuery]);

  const otherSectionsInGrade = useMemo(() => {
    if (!section) return [];
    return activeStageSections.filter(s => s.grade === section.grade && s.id !== section.id);
  }, [activeStageSections, section]);

  // Financial calculations
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
    if (!section) return;
    if (sectionStudents.length >= section.capacity) {
      toast.warning("تنبيه: الشعبة بلغت طاقتها الاستيعابية القصوى");
    }
    assignStudentToSection(studentId, section.id);
    toast.success("تم تسكين الطالب في الشعبة بنجاح");
  };

  const handleRemoveStudent = (studentId: string) => {
    assignStudentToSection(studentId, undefined);
    toast.success("تم إلغاء تسكين الطالب من الشعبة (أصبح غير موزع)");
  };

  const handleExecuteTransfer = () => {
    if (!transferModalStudent || !targetTransferSectionId) {
      toast.error("الرجاء اختيار الشعبة المستهدفة للنقل");
      return;
    }
    const targetSection = activeStageSections.find(s => s.id === targetTransferSectionId);
    assignStudentToSection(transferModalStudent.id, targetTransferSectionId);
    toast.success(`تم نقل الطالب (${transferModalStudent.name}) إلى شعبة (${targetSection?.name}) بنجاح`);
    setTransferModalStudent(null);
    setTargetTransferSectionId("");
  };

  const handleAddAllUnassigned = () => {
    if (!section || filteredUnassigned.length === 0) return;
    const availableSlots = Math.max(0, section.capacity - sectionStudents.length);
    const toAdd = availableSlots > 0 ? filteredUnassigned.slice(0, availableSlots) : filteredUnassigned;
    toAdd.forEach(s => assignStudentToSection(s.id, section.id));
    toast.success(`تم تسكين ${toAdd.length} طالب في الشعبة بنجاح`);
    setIsAddStudentOpen(false);
  };

  // Safe fallback if section not found (hooks were already called)
  if (!section) {
    return (
      <div className="text-center p-12 bg-card rounded-3xl border border-border/60 max-w-xl mx-auto my-12 space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive grid place-items-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-black text-lg">الشعبة الدراسية غير موجودة</h3>
        <p className="text-xs text-muted-foreground font-medium">ربما تم حذف هذه الشعبة أو نقلها إلى مرحلة أخرى.</p>
        <button 
          onClick={onBack}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 transition-all"
        >
          العودة لقائمة الصفوف والشعب
        </button>
      </div>
    );
  }

  const occupancyRate = section.capacity > 0 ? (sectionStudents.length / section.capacity) : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-400" dir="rtl">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-card/90 border border-border/70 rounded-3xl p-6 shadow-sm backdrop-blur-xl relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <button 
            onClick={onBack} 
            className="h-11 w-11 rounded-2xl bg-muted/70 hover:bg-muted text-foreground flex items-center justify-center transition-all active:scale-95 border border-border/50 shrink-0"
            title="الرجوع لقائمة الصفوف"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-3 py-1 rounded-xl bg-primary/10 text-primary font-black text-xs">
                {section.grade}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                شعبة ({section.name})
              </h1>
              <button
                onClick={() => onEditSection(section)}
                className="h-8 w-8 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-all"
                title="تعديل بيانات الشعبة والقاعة"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-muted-foreground mt-1">
              <span className="flex items-center gap-1.5 text-foreground">
                <UserCheck className="w-4 h-4 text-primary" />
                <span>رائد الفصل: {section.homeroomTeacher || "غير محدد"}</span>
              </span>
              <span className="text-border">•</span>
              <div className="flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-primary" />
                <span>القاعة:</span>
                <select 
                  value={section.roomId || ""} 
                  onChange={(e) => {
                    assignSectionToRoom(section.id, e.target.value || undefined);
                    toast.success("تم تحديث القاعة المخصصة للشعبة");
                  }}
                  className="text-xs font-black bg-background/80 border border-border rounded-xl px-3 py-1 text-primary focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
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

        {/* Occupancy Indicator */}
        <div className="flex items-center gap-6 z-10 bg-background/70 p-4 rounded-2xl border border-border/60">
          <div>
            <p className="text-[11px] text-muted-foreground font-bold mb-0.5">الطلاب المقيدين</p>
            <p className="text-2xl font-black text-foreground tabular-nums">{sectionStudents.length}</p>
          </div>
          <div className="h-10 w-px bg-border/60"></div>
          <div>
            <p className="text-[11px] text-muted-foreground font-bold mb-0.5">الطاقة الاستيعابية</p>
            <p className="text-2xl font-black text-foreground tabular-nums">{section.capacity}</p>
          </div>
          <div className="w-28">
            <div className="flex justify-between text-xs font-black mb-1.5">
              <span>نسبة الإشغال</span>
              <span className="tabular-nums">{Math.round(occupancyRate * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  occupancyRate > 0.95 ? 'bg-destructive' : occupancyRate > 0.75 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, occupancyRate * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary Card */}
      <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-black text-foreground">الموقف المالي ورسوم طلاب الشعبة</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          <div className="p-3 rounded-2xl bg-muted/20 border border-border/40">
            <p className="text-[11px] font-bold text-muted-foreground mb-1">إجمالي المطالبات</p>
            <p className="text-xl font-black text-primary tabular-nums">{financeStats.totalExpected.toLocaleString()} <span className="text-xs">{currency}</span></p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-[11px] font-bold text-muted-foreground mb-1">إجمالي المحصل</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{financeStats.totalPaid.toLocaleString()} <span className="text-xs">{currency}</span></p>
          </div>
          <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20">
            <p className="text-[11px] font-bold text-muted-foreground mb-1">المتبقي للتحصيل</p>
            <p className="text-xl font-black text-destructive tabular-nums">{financeStats.totalDue.toLocaleString()} <span className="text-xs">{currency}</span></p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-[11px] font-bold text-muted-foreground mb-1">فواتير متأخرة</p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums">{financeStats.overdueStudents}</p>
          </div>
        </div>
      </div>

      {/* Main Student List & Unassigned Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PageCard 
            title={`قائمة الطلاب المقيدين بالشعبة (${sectionStudents.length} طالب)`}
            actions={
              <button 
                onClick={() => setIsAddStudentOpen(!isAddStudentOpen)}
                className="flex items-center gap-1.5 text-xs font-black bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow-md hover:bg-primary/90 transition-all active:scale-95 glow-primary"
              >
                <UserPlus className="h-4 w-4" /> 
                <span>تسكين طلاب إضافيين ({unassignedStudents.length} متاح)</span>
              </button>
            }
          >
            <DataTable
              rows={sectionStudents}
              empty="لا يوجد طلاب مقيدين في هذه الشعبة بعد. يمكنك تسكين الطلاب من القائمة الجانبية."
              columns={[
                { key: "nm", header: "اسم الطالب", cell: s => (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <Link to="/students/$id" params={{ id: s.id }} className="font-bold hover:text-primary transition-colors text-xs">
                        {s.name}
                      </Link>
                      <span className="block text-[10px] text-muted-foreground">{s.guardianPhone || s.guardianName || "لا توجد بيانات اتصال"}</span>
                    </div>
                  </div>
                )},
                { key: "nid", header: "رقم الهوية / الإقامة", cell: s => (
                  <span className="tabular-nums text-muted-foreground font-medium text-xs">{s.nationalId || "—"}</span>
                )},
                { key: "finance", header: "الموقف المالي", cell: s => {
                  const fs = getStudentFinanceStatus(s.id);
                  if (fs.status === 'none') return <span className="text-xs text-muted-foreground">—</span>;
                  return (
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                      fs.status === 'paid' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                      fs.status === 'partial' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                      'bg-destructive/15 text-destructive'
                    }`}>
                      {fs.status === 'paid' ? 'مسدد' : fs.status === 'partial' ? `جزئي (${fs.due.toLocaleString()} ${currency})` : `معلق (${fs.due.toLocaleString()} ${currency})`}
                    </span>
                  );
                }},
                { key: "act", header: "إجراءات التسكين", cell: s => (
                  <div className="flex items-center justify-end gap-1.5">
                    <button 
                      onClick={() => {
                        setTransferModalStudent({ id: s.id, name: s.name });
                        setTargetTransferSectionId(otherSectionsInGrade[0]?.id || "");
                      }}
                      className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-1 text-[11px] font-bold"
                      title="نقل الطالب إلى شعبة أخرى في نفس الصف"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">نقل لشعبة</span>
                    </button>
                    <button 
                      onClick={() => handleRemoveStudent(s.id)} 
                      className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all" 
                      title="إلغاء التسكين من الشعبة"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                    <Link to="/students/$id" params={{ id: s.id }} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="عرض الملف الكامل">
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              ]}
            />
          </PageCard>
        </div>

        {/* Unassigned Students Sidebar Drawer */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <h3 className="font-black text-sm text-foreground">طلاب بانتظار التسكين</h3>
                <p className="text-[11px] text-muted-foreground font-medium">مسجلين في {section.grade} بدون شعبة</p>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-black">
                {filteredUnassigned.length} متاح
              </span>
            </div>
            
            <div className="relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="ابحث بالاسم أو الهوية..." 
                className="w-full bg-background/80 border border-input rounded-xl pr-9 pl-4 py-2 text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/60 text-foreground"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {filteredUnassigned.length > 0 && (
              <button
                onClick={handleAddAllUnassigned}
                className="w-full py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-black transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تسكين جميع الطلاب في الشعبة</span>
              </button>
            )}

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredUnassigned.length === 0 ? (
                <div className="text-center py-8 text-xs font-bold text-muted-foreground">
                  لا يوجد طلاب غير مسكنين في هذا الصف
                </div>
              ) : (
                filteredUnassigned.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-background/60 hover:border-primary/40 transition-colors group">
                    <div className="truncate">
                      <p className="text-xs font-bold text-foreground truncate max-w-[140px]">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">{s.nationalId || "بدون هوية"}</p>
                    </div>
                    <button 
                      onClick={() => handleAddStudent(s.id)}
                      className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all shrink-0"
                      title="تسكين في هذه الشعبة"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Student Modal */}
      {transferModalStudent && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200"
          onClick={() => setTransferModalStudent(null)}
        >
          <div 
            className="w-full max-w-md modal-card-luxury p-6 rounded-3xl border border-border/80 bg-card/98 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-foreground">نقل الطالب إلى شعبة أخرى</h3>
                  <p className="text-[11px] text-muted-foreground">نقل الطالب داخل نفس الصف الدراسي ({section.grade})</p>
                </div>
              </div>
              <button onClick={() => setTransferModalStudent(null)} className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 text-xs space-y-1">
              <span className="font-bold text-muted-foreground">اسم الطالب:</span>
              <p className="font-black text-foreground text-sm">{transferModalStudent.name}</p>
              <p className="text-[11px] text-muted-foreground">الشعبة الحالية: <span className="font-bold text-foreground">شعبة ({section.name})</span></p>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">اختر الشعبة المستهدفة للنقل:</label>
              {otherSectionsInGrade.length === 0 ? (
                <p className="text-xs text-amber-600 font-bold p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  لا توجد شعب أخرى مسجلة في هذا الصف. يرجى إنشاء شعبة إضافية أولاً.
                </p>
              ) : (
                <select
                  value={targetTransferSectionId}
                  onChange={e => setTargetTransferSectionId(e.target.value)}
                  className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-bold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all cursor-pointer"
                >
                  <option value="">-- اختر الشعبة المستهدفة --</option>
                  {otherSectionsInGrade.map(s => {
                    const assigned = activeStageStudents.filter(st => st.sectionId === s.id).length;
                    return (
                      <option key={s.id} value={s.id}>
                        شعبة {s.name} (الإشغال: {assigned} / {s.capacity} طالب) {s.homeroomTeacher ? `- رائد: ${s.homeroomTeacher}` : ''}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div className="pt-3 border-t border-border/50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTransferModalStudent(null)}
                className="px-4 py-2 rounded-xl border border-input bg-background text-xs font-bold text-foreground hover:bg-muted"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={!targetTransferSectionId}
                onClick={handleExecuteTransfer}
                className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md hover:bg-primary/90 disabled:opacity-50 transition-all glow-primary"
              >
                تأكيد نقل الطالب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// Main Classes & Sections Management Hub
// =========================================================================
function AcademicSectionsPage() {
  const { 
    currency, 
    activeStageSections, 
    activeStageStudents, 
    activeStageInvoices, 
    addSection, 
    updateSection, 
    deleteSection, 
    activeStageStaff,
    allRooms,
    assignSectionToRoom,
    assignStudentToSection
  } = useGlobalStore();

  const { stage, getStageLabel } = useStage();

  // Navigation & View Mode
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grades" | "list">("grades");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("all");
  const [searchQ, setSearchQ] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    grade: "", 
    capacity: 30, 
    homeroomTeacher: "", 
    roomId: "" 
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);

  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printTargetSectionId, setPrintTargetSectionId] = useState<string | null>(null);

  // Auto-distribute state
  const [isAutoDistributeModalOpen, setIsAutoDistributeModalOpen] = useState(false);
  const [autoDistributeGrade, setAutoDistributeGrade] = useState<string>("");

  // Print templates hoisted unconditionally
  const printTemplates: PrintTemplate[] = useMemo(() => {
    return [
      {
        id: "attendance", 
        name: "كشف الغياب والحضور الفصلي", 
        category: "سجلات يومية", 
        type: "table",
        columns: [
          { key: "name", label: "اسم الطالب" },
          { key: "nationalId", label: "رقم الهوية / الإقامة" },
        ],
        extraDynamicColumns: 10,
        extraDynamicColumnLabel: "يوم {i}",
      },
      {
        id: "marks", 
        name: "سجل متابعة ورصد الدرجات الأكاديمية", 
        category: "أكاديمي", 
        type: "table",
        columns: [
          { key: "name", label: "اسم الطالب" },
          { key: "participation", label: "المشاركة والنشاط", render: () => "" },
          { key: "hw", label: "الواجبات والمهام", render: () => "" },
          { key: "exam", label: "الاختبار القصير", render: () => "" },
          { key: "total", label: "المجموع الكلي", render: () => "" },
        ]
      },
      {
        id: "contact", 
        name: "دليل هواتف وتواصل أولياء الأمور", 
        category: "شؤون الطلاب", 
        type: "table",
        columns: [
          { key: "name", label: "اسم الطالب" },
          { key: "guardianName", label: "ولي الأمر" },
          { key: "guardianPhone", label: "رقم التواصل" },
        ]
      },
      {
        id: "desk_labels", 
        name: "ملصقات طاولات الجلوس للامتحانات", 
        category: "تنظيم القاعات", 
        type: "document",
        renderDocument: () => {
          const targetSec = activeStageSections.find(sec => sec.id === printTargetSectionId);
          const studentsToPrint = printTargetSectionId 
            ? activeStageStudents.filter(s => s.sectionId === printTargetSectionId) 
            : activeStageStudents;

          return (
            <div className="grid grid-cols-2 gap-x-6 gap-y-8" dir="rtl">
              {studentsToPrint.map((s, i) => (
                <div key={i} className="border-2 border-gray-800 rounded-2xl p-4 flex gap-4 h-36 break-inside-avoid shadow-sm bg-white text-gray-900">
                  <div className="w-20 border border-dashed border-gray-400 bg-gray-50 flex items-center justify-center text-gray-400 text-xs text-center rounded-xl">صورة</div>
                  <div className="flex-1 text-right">
                    <h3 className="font-black text-xs border-b border-gray-400 pb-1 mb-1.5 text-primary">منصة مدارس الأهلية</h3>
                    <p className="text-xs mb-1"><span className="text-gray-500 font-bold inline-block w-14">الاسم:</span> <span className="font-black text-sm">{s.name}</span></p>
                    <p className="text-xs mb-1"><span className="text-gray-500 font-bold inline-block w-14">الصف:</span> <span className="font-bold">{targetSec?.grade || s.grade}</span></p>
                    <p className="text-xs"><span className="text-gray-500 font-bold inline-block w-14">الشعبة:</span> <span className="font-bold">شعبة {targetSec?.name || "أ"}</span></p>
                  </div>
                </div>
              ))}
            </div>
          );
        }
      }
    ];
  }, [activeStageStudents, printTargetSectionId, activeStageSections]);

  // Derived Sections with actual counts and room details
  const enrichedSections = useMemo(() => {
    return activeStageSections.map(sec => {
      const assignedStudents = activeStageStudents.filter(s => s.sectionId === sec.id);
      const room = allRooms.find(r => r.id === sec.roomId);
      return { 
        ...sec, 
        used: assignedStudents.length,
        roomDetails: room ? `${room.name} (${room.building} - ${room.floor})` : sec.roomName || undefined
      };
    });
  }, [activeStageSections, activeStageStudents, allRooms]);

  // Overall Statistics
  const totalCapacity = useMemo(() => enrichedSections.reduce((acc, s) => acc + s.capacity, 0), [enrichedSections]);
  const totalOccupied = useMemo(() => enrichedSections.reduce((acc, s) => acc + s.used, 0), [enrichedSections]);
  const totalUnassignedStudents = useMemo(() => activeStageStudents.filter(s => !s.sectionId).length, [activeStageStudents]);
  const totalRoomsOccupied = useMemo(() => allRooms.filter(r => r.assignedSectionId).length, [allRooms]);

  // Group sections by grade
  const configuredGrades = useMemo(() => GRADE_OPTIONS[stage] || [], [stage]);

  const groupedByGrade = useMemo(() => {
    const groups: Record<string, typeof enrichedSections> = {};
    configuredGrades.forEach(g => { groups[g] = []; });
    enrichedSections.forEach(sec => {
      if (!groups[sec.grade]) groups[sec.grade] = [];
      groups[sec.grade].push(sec);
    });
    return groups;
  }, [enrichedSections, configuredGrades]);

  // List of unassigned students grouped by grade
  const unassignedByGrade = useMemo(() => {
    const counts: Record<string, number> = {};
    configuredGrades.forEach(g => { counts[g] = 0; });
    activeStageStudents.filter(s => !s.sectionId).forEach(s => {
      counts[s.grade] = (counts[s.grade] || 0) + 1;
    });
    return counts;
  }, [activeStageStudents, configuredGrades]);

  // Processed list for table view
  const processedList = useMemo(() => {
    let result = [...enrichedSections];
    if (selectedGradeFilter !== "all") {
      result = result.filter(s => s.grade === selectedGradeFilter);
    }
    if (searchQ) {
      const q = searchQ.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.grade.toLowerCase().includes(q) || 
        (s.homeroomTeacher || "").toLowerCase().includes(q) ||
        (s.roomDetails || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [enrichedSections, selectedGradeFilter, searchQ]);

  // Modal Handlers
  const openAddModal = (gradePreset?: string) => {
    setEditingId(null);
    setFormData({ 
      name: "", 
      grade: gradePreset || configuredGrades[0] || "", 
      capacity: 30, 
      homeroomTeacher: "",
      roomId: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sec: Section | typeof enrichedSections[0], e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(sec.id);
    setFormData({ 
      name: sec.name, 
      grade: sec.grade, 
      capacity: sec.capacity, 
      homeroomTeacher: sec.homeroomTeacher || "",
      roomId: sec.roomId || ""
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSectionToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.grade.trim()) {
      toast.error("الرجاء إدخال اسم الشعبة وتحديد الصف الدراسي");
      return;
    }

    const selectedRoomObj = allRooms.find(r => r.id === formData.roomId);

    if (editingId) {
      updateSection(editingId, { 
        name: formData.name.trim(), 
        grade: formData.grade, 
        capacity: Number(formData.capacity), 
        homeroomTeacher: formData.homeroomTeacher || undefined,
        roomId: formData.roomId || undefined,
        roomName: selectedRoomObj ? `${selectedRoomObj.name} (${selectedRoomObj.building})` : undefined
      });

      // Synchronize room assignment
      assignSectionToRoom(editingId, formData.roomId || undefined);
      toast.success("تم تحديث بيانات الشعبة والقاعة بنجاح");
    } else {
      addSection({ 
        name: formData.name.trim(), 
        grade: formData.grade, 
        capacity: Number(formData.capacity), 
        stage, 
        homeroomTeacher: formData.homeroomTeacher || undefined,
        roomId: formData.roomId || undefined,
        roomName: selectedRoomObj ? `${selectedRoomObj.name} (${selectedRoomObj.building})` : undefined
      });
      toast.success("تمت إضافة الشعبة الجديدة بنجاح");
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (sectionToDelete) {
      // Free room if assigned
      assignSectionToRoom(sectionToDelete, undefined);
      // Unassign students from this section
      const studentsInSection = activeStageStudents.filter(s => s.sectionId === sectionToDelete);
      studentsInSection.forEach(s => assignStudentToSection(s.id, undefined));

      deleteSection(sectionToDelete);
      toast.success("تم حذف الشعبة وفك ارتباط طلابها بنجاح");
      setIsDeleteModalOpen(false);
      setSectionToDelete(null);
      if (selectedSectionId === sectionToDelete) setSelectedSectionId(null);
    }
  };

  const executeAutoDistribution = (grade: string) => {
    const unassignedInThisGrade = activeStageStudents.filter(s => s.grade === grade && !s.sectionId);
    const sectionsInThisGrade = activeStageSections.filter(s => s.grade === grade);

    if (sectionsInThisGrade.length === 0) {
      toast.error(`لا توجد أي شعب مسجلة في ${grade} لتوزيع الطلاب عليها`);
      return;
    }

    if (unassignedInThisGrade.length === 0) {
      toast.info(`جميع طلاب ${grade} مسكنين بالفعل في الشعب الدراسية`);
      return;
    }

    // Round-robin distribution
    let distributedCount = 0;
    unassignedInThisGrade.forEach((student, index) => {
      const targetSec = sectionsInThisGrade[index % sectionsInThisGrade.length];
      assignStudentToSection(student.id, targetSec.id);
      distributedCount++;
    });

    toast.success(`تم التوزيع التلقائي المتوازن لـ ${distributedCount} طالب على شعب ${grade}`);
    setIsAutoDistributeModalOpen(false);
  };

  const openPrintForSection = (secId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPrintTargetSectionId(secId);
    setIsPrintOpen(true);
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "الإدارة الأكاديمية", to: "/academic/classes" },
        ...(selectedSectionId 
          ? [
              { label: "الصفوف والشُعب", onClick: () => setSelectedSectionId(null) },
              { label: `تفاصيل شعبة (${activeStageSections.find(s => s.id === selectedSectionId)?.name || ""})` }
            ]
          : [{ label: "الصفوف والشُعب الدراسية" }]
        )
      ]}
      actions={
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => {
              setPrintTargetSectionId(null);
              setIsPrintOpen(true);
            }}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-card border border-border/60 px-4 text-xs font-bold hover:bg-accent text-foreground transition-all shadow-xs active:scale-95"
          >
            <Printer className="h-4 w-4 text-primary" /> 
            <span>كشوف الطباعة الرسمية</span>
          </button>
          
          <button 
            onClick={() => openAddModal()}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-black text-primary-foreground shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 glow-primary"
          >
            <Plus className="h-4 w-4" /> 
            <span>إضافة شُعبة جديدة</span>
          </button>
        </div>
      }
    >
      {/* If viewing a single section detail */}
      {selectedSectionId ? (
        <SectionDetailView 
          sectionId={selectedSectionId} 
          onBack={() => setSelectedSectionId(null)}
          onEditSection={(sec) => openEditModal(sec)}
        />
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-400 max-w-7xl mx-auto" dir="rtl">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-card border border-border/70 shadow-xs relative overflow-hidden group hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <Layers3 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {getStageLabel(stage)}
                </span>
              </div>
              <p className="text-xs font-bold text-muted-foreground mb-1">إجمالي الشُعب المفتوحة</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-foreground tabular-nums">{enrichedSections.length}</h3>
                <span className="text-xs text-muted-foreground font-bold">شعبة دراسية</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-card border border-border/70 shadow-xs relative overflow-hidden group hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  {totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0}% إشغال
                </span>
              </div>
              <p className="text-xs font-bold text-muted-foreground mb-1">الطلاب المسكنين بالشعب</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-foreground tabular-nums">{totalOccupied}</h3>
                <span className="text-xs text-muted-foreground font-bold">من أصل {totalCapacity} مقعد</span>
              </div>
            </div>

            <div className={`p-5 rounded-3xl bg-card border shadow-xs relative overflow-hidden group transition-all ${
              totalUnassignedStudents > 0 ? "border-amber-500/40 bg-amber-500/5" : "border-border/70"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-black ${
                  totalUnassignedStudents > 0 ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground"
                }`}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                {totalUnassignedStudents > 0 ? (
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse">
                    بحاجة لتسكين
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    مكتمل 100%
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-muted-foreground mb-1">طلاب بانتظار التسكين</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-foreground tabular-nums">{totalUnassignedStudents}</h3>
                <span className="text-xs text-muted-foreground font-bold">طالب بدون شعبة</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-card border border-border/70 shadow-xs relative overflow-hidden group hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                  <DoorOpen className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {allRooms.length} قاعة بالمبنى
                </span>
              </div>
              <p className="text-xs font-bold text-muted-foreground mb-1">القاعات الدراسية المخصصة</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-foreground tabular-nums">{totalRoomsOccupied}</h3>
                <span className="text-xs text-muted-foreground font-bold">قاعة مشغولة بشعب</span>
              </div>
            </div>
          </div>

          {/* Controls, Grade Filter Bar & Search */}
          <div className="bg-card p-4 rounded-3xl border border-border/70 shadow-xs space-y-3.5">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Grade Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                <button
                  onClick={() => setSelectedGradeFilter("all")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                    selectedGradeFilter === "all"
                      ? "bg-primary text-primary-foreground shadow-sm glow-primary"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  جميع الصفوف ({enrichedSections.length})
                </button>
                {configuredGrades.map(g => {
                  const gradeSecCount = (groupedByGrade[g] || []).length;
                  const unassignedInGrade = unassignedByGrade[g] || 0;
                  return (
                    <button
                      key={g}
                      onClick={() => setSelectedGradeFilter(g)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                        selectedGradeFilter === g
                          ? "bg-primary text-primary-foreground shadow-sm glow-primary"
                          : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{g}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/30 font-black">
                        {gradeSecCount}
                      </span>
                      {unassignedInGrade > 0 && (
                        <span className="h-2 w-2 rounded-full bg-amber-500" title={`${unassignedInGrade} طلاب بانتظار التسكين`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* View Switcher */}
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl shrink-0 self-end md:self-auto">
                <button 
                  onClick={() => setViewMode("grades")} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === "grades" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" /> 
                  <span>بطاقات الصفوف</span>
                </button>
                <button 
                  onClick={() => setViewMode("list")} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === "list" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List className="h-3.5 w-3.5" /> 
                  <span>جدول الشُعب</span>
                </button>
              </div>
            </div>

            {/* Search and Secondary Filter */}
            <div className="relative">
              <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-70" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="ابحث عن شعبة، صف دراسي، رائد فصل، أو قاعة..."
                className="h-11 w-full rounded-xl border border-input bg-background/80 pr-11 pl-4 text-xs font-bold shadow-xs hover:border-primary/45 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60 text-foreground"
              />
            </div>
          </div>

          {/* VIEW: Grades Cards Grouped */}
          {viewMode === "grades" ? (
            <div className="space-y-10">
              {Object.entries(groupedByGrade)
                .filter(([grade]) => selectedGradeFilter === "all" || selectedGradeFilter === grade)
                .map(([grade, secs]) => {
                  const filteredSecs = secs.filter(s => {
                    if (!searchQ) return true;
                    const q = searchQ.toLowerCase();
                    return (
                      s.name.toLowerCase().includes(q) ||
                      (s.homeroomTeacher || "").toLowerCase().includes(q) ||
                      (s.roomDetails || "").toLowerCase().includes(q)
                    );
                  });

                  const unassignedInGrade = unassignedByGrade[grade] || 0;
                  const totalStudentsInGrade = secs.reduce((sum, s) => sum + s.used, 0);
                  const totalCapacityInGrade = secs.reduce((sum, s) => sum + s.capacity, 0);

                  return (
                    <div key={grade} className="space-y-4">
                      {/* Grade Header & Controls */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                            <GraduationCap className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-lg font-black text-foreground">{grade}</h2>
                              <span className="text-xs font-bold text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full">
                                {secs.length} شُعب
                              </span>
                              <span className="text-xs font-bold text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full">
                                {totalStudentsInGrade} طالب ({totalCapacityInGrade} مقعد)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Grade Batch Actions */}
                        <div className="flex items-center gap-2">
                          {unassignedInGrade > 0 && (
                            <button
                              onClick={() => {
                                setAutoDistributeGrade(grade);
                                setIsAutoDistributeModalOpen(true);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black transition-all flex items-center gap-1.5 border border-amber-500/20 shadow-xs"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>توزيع {unassignedInGrade} طالب متخلف</span>
                            </button>
                          )}

                          <button
                            onClick={() => openAddModal(grade)}
                            className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-black transition-all flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة شعبة للـ {grade}</span>
                          </button>
                        </div>
                      </div>

                      {/* Section Cards */}
                      {filteredSecs.length === 0 ? (
                        <div className="text-center py-10 bg-card/60 border border-dashed border-border/80 rounded-3xl text-muted-foreground font-bold text-xs space-y-2">
                          <p>لا توجد شُعب دراسية مضافة في {grade}</p>
                          <button 
                            onClick={() => openAddModal(grade)}
                            className="text-primary font-black underline hover:text-primary/80"
                          >
                            + اضغط هنا لإنشاء أول شعبة لهذا الصف
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredSecs.map(sec => {
                            const occRate = sec.capacity > 0 ? (sec.used / sec.capacity) : 0;
                            const isFull = occRate >= 1.0;
                            const isNearFull = occRate >= 0.85;

                            return (
                              <div 
                                key={sec.id} 
                                onClick={() => setSelectedSectionId(sec.id)}
                                className="group relative bg-card border border-border/70 rounded-3xl p-5 shadow-xs hover:shadow-xl hover:border-primary/50 transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
                              >
                                {/* Top Occupancy Line */}
                                <div className={`absolute top-0 left-0 w-full h-1.5 transition-all ${
                                  isFull ? 'bg-destructive' : isNearFull ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} />

                                <div>
                                  {/* Header Box */}
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 text-primary font-black text-xl group-hover:scale-105 transition-transform shadow-xs">
                                        {sec.name}
                                      </div>
                                      <div>
                                        <h3 className="font-black text-sm text-foreground">شعبة ({sec.name})</h3>
                                        <span className="text-[11px] font-bold text-muted-foreground block">{sec.grade}</span>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={(e) => openPrintForSection(sec.id, e)}
                                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                        title="طباعة كشف الشعبة"
                                      >
                                        <Printer className="h-3.5 w-3.5" />
                                      </button>
                                      <button 
                                        onClick={(e) => openEditModal(sec, e)} 
                                        className="p-1.5 text-primary hover:bg-primary/10 rounded-xl transition-all"
                                        title="تعديل بيانات الشعبة"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                      <button 
                                        onClick={(e) => openDeleteModal(sec.id, e)} 
                                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                        title="حذف الشعبة"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Homeroom & Room Meta */}
                                  <div className="space-y-1.5 my-3 text-xs">
                                    <div className="flex items-center gap-1.5 text-muted-foreground font-semibold truncate">
                                      <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                                      <span className="truncate">{sec.homeroomTeacher ? `رائد: ${sec.homeroomTeacher}` : "بدون رائد فصل"}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 text-muted-foreground font-semibold truncate">
                                      <DoorOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                                      <span className="truncate">{sec.roomDetails ? sec.roomDetails : "بدون قاعة مخصصة"}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Bottom Progress & Stats */}
                                <div className="pt-3 border-t border-border/50 space-y-2 mt-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-muted-foreground">الطلاب المقيدين:</span>
                                    <span className="font-black text-foreground tabular-nums">
                                      {sec.used} <span className="text-[10px] text-muted-foreground font-normal">/ {sec.capacity}</span>
                                    </span>
                                  </div>

                                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-700 ${
                                        isFull ? 'bg-destructive' : isNearFull ? 'bg-amber-500' : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${Math.min(100, occRate * 100)}%` }}
                                    />
                                  </div>

                                  {/* Quick Link */}
                                  <div className="pt-1 flex items-center justify-between text-[11px] font-black text-primary group-hover:underline">
                                    <span>إدارة وتسكين الطلاب</span>
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            /* VIEW: List / Table View */
            <PageCard>
              <DataTable
                rows={processedList}
                empty="لا توجد شُعب دراسية مطابقة للبحث."
                columns={[
                  { 
                    key: "n", 
                    header: "اسم الشعبة", 
                    cell: s => (
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                          {s.name}
                        </div>
                        <div>
                          <span 
                            className="font-black text-xs text-primary cursor-pointer hover:underline" 
                            onClick={() => setSelectedSectionId(s.id)}
                          >
                            شعبة ({s.name})
                          </span>
                          <span className="block text-[10px] text-muted-foreground">{s.roomDetails || "بدون قاعة"}</span>
                        </div>
                      </div>
                    )
                  },
                  { key: "g", header: "الصف الدراسي", cell: s => <span className="font-bold text-xs">{s.grade}</span> },
                  { key: "t", header: "رائد الفصل المشرف", cell: s => (
                    <span className="text-muted-foreground font-medium text-xs">
                      {s.homeroomTeacher || "غير محدد"}
                    </span>
                  )},
                  { 
                    key: "u", 
                    header: "نسبة الإشغال والاستيعاب", 
                    cell: s => {
                      const rate = s.capacity > 0 ? (s.used / s.capacity) : 0;
                      return (
                        <div className="flex items-center gap-3 w-48">
                          <span className="tabular-nums font-black text-xs w-12 text-left">
                            {s.used}/{s.capacity}
                          </span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted border border-border/50">
                            <div 
                              className={`h-full rounded-full transition-all duration-700 ${
                                rate >= 1.0 ? "bg-destructive" : rate >= 0.85 ? "bg-amber-500" : "bg-emerald-500"
                              }`} 
                              style={{ width: `${Math.min(100, rate * 100)}%` }} 
                            />
                          </div>
                        </div>
                      );
                    }
                  },
                  { 
                    key: "act", 
                    header: "التحكم والإجراءات", 
                    cell: s => (
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => setSelectedSectionId(s.id)} 
                          className="rounded-xl p-2 text-primary hover:bg-primary/10 transition-colors flex items-center gap-1 text-xs font-bold" 
                          title="تفاصيل وتسكين الطلاب"
                        >
                          <Users className="h-4 w-4" />
                          <span className="hidden sm:inline">الطلاب</span>
                        </button>
                        <button 
                          onClick={(e) => openPrintForSection(s.id, e)} 
                          className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" 
                          title="طباعة الكشف"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => openEditModal(s, e)} 
                          className="rounded-xl p-2 text-primary hover:bg-primary/10 transition-colors" 
                          title="تعديل بيانات الشعبة"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => openDeleteModal(s.id, e)} 
                          className="rounded-xl p-2 text-destructive hover:bg-destructive/10 transition-colors" 
                          title="حذف الشعبة"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  },
                ]}
              />
            </PageCard>
          )}

          {/* Modal: Add or Edit Section */}
          {isModalOpen && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200 overflow-y-auto"
              onClick={() => setIsModalOpen(false)}
              dir="rtl"
            >
              <div 
                className="w-full max-w-lg modal-card-luxury p-6 sm:p-7 rounded-3xl border border-border/80 bg-card/98 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150 my-8 space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary shrink-0 shadow-xs">
                      <Layers3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-foreground">
                        {editingId ? "تعديل بيانات وإعدادات الشعبة" : "إنشاء شعبة دراسية جديدة"}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                        تحديد الصف الدراسي، اسم الشعبة، رائد الفصل، وتخصيص القاعة
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)} 
                    className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all active:scale-95"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Grade Target */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-foreground">الصف الدراسي المستهدف *</label>
                      <select
                        required
                        className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-bold text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs cursor-pointer"
                        value={formData.grade}
                        onChange={e => setFormData({...formData, grade: e.target.value})}
                      >
                        <option value="" disabled>-- اختر الصف الدراسي --</option>
                        {configuredGrades.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Section Name/Code */}
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-foreground">اسم أو رمز الشعبة *</label>
                      <input
                        required
                        placeholder="مثال: أ، ب، ج أو 1، 2، تحفيظ..."
                        className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-bold text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Homeroom Teacher */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-foreground">رائد الفصل المشرف (اختياري)</label>
                    <TeacherSelect 
                      value={formData.homeroomTeacher}
                      onChange={(val) => setFormData({...formData, homeroomTeacher: val})}
                      options={activeStageStaff}
                    />
                  </div>

                  {/* Classroom / Room Assignment */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-foreground">القاعة الدراسية المخصصة (اختياري)</label>
                    <RoomSelect
                      value={formData.roomId}
                      currentSectionId={editingId || undefined}
                      onChange={(roomId) => setFormData({...formData, roomId})}
                      rooms={allRooms}
                    />
                  </div>

                  {/* Capacity */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-foreground">الطاقة الاستيعابية القصوى (عدد المقاعد)</label>
                    <input 
                      type="number" 
                      min="5" 
                      max="100"
                      required
                      className="w-full h-11 rounded-xl border border-input bg-background/80 px-3.5 text-xs font-bold text-foreground outline-none hover:border-primary/45 focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-xs tabular-nums"
                      value={formData.capacity}
                      onChange={e => setFormData({...formData, capacity: Number(e.target.value)})}
                    />
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-4 border-t border-border/60 flex justify-end gap-2.5">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)} 
                      className="rounded-xl px-5 py-2.5 text-xs font-bold border border-input bg-background hover:bg-accent text-foreground transition-colors"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit" 
                      className="rounded-xl bg-primary px-7 py-2.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-[0.98] glow-primary"
                    >
                      {editingId ? "حفظ تعديلات الشعبة" : "إنشاء واعتماد الشعبة"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal: Delete Section Confirmation */}
          {isDeleteModalOpen && (
            <div 
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200"
              onClick={() => setIsDeleteModalOpen(false)}
              dir="rtl"
            >
              <div 
                className="w-full max-w-sm rounded-3xl border border-border/80 bg-card/98 dark:bg-card/95 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-2xl bg-destructive/10 p-3.5 text-destructive mb-4 shadow-xs">
                    <AlertCircle className="h-7 w-7" />
                  </div>
                  <h2 className="text-base font-black text-foreground mb-1.5">تأكيد حذف الشعبة الدراسية</h2>
                  <p className="text-xs text-muted-foreground mb-6 font-medium leading-relaxed">
                    هل أنت متأكد من رغبتك في حذف هذه الشعبة؟ سيتم فك ارتباط طلابها ليصبحوا غير مسكنين، وتحرير القاعة الدراسية المرتبطة بها.
                  </p>
                  
                  <div className="flex w-full gap-2.5">
                    <button 
                      onClick={() => setIsDeleteModalOpen(false)} 
                      className="flex-1 rounded-xl px-4 py-2.5 text-xs font-bold border border-input bg-background hover:bg-accent text-foreground transition-colors"
                    >
                      إلغاء
                    </button>
                    <button 
                      onClick={confirmDelete} 
                      className="flex-1 rounded-xl bg-destructive px-4 py-2.5 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 transition-all active:scale-[0.98] shadow-md"
                    >
                      نعم، احذف الشعبة
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal: Auto-Distribute Confirmation */}
          {isAutoDistributeModalOpen && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop-luxury animate-in fade-in duration-200"
              onClick={() => setIsAutoDistributeModalOpen(false)}
              dir="rtl"
            >
              <div 
                className="w-full max-w-md modal-card-luxury p-6 rounded-3xl border border-border/80 bg-card/98 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150 space-y-4"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-foreground">التوزيع التلقائي المتوازن للطلاب</h3>
                      <p className="text-[11px] text-muted-foreground">توزيع الطلاب غير المسكنين في {autoDistributeGrade}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsAutoDistributeModalOpen(false)} className="h-8 w-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-muted-foreground">الصف المستهدف:</span>
                    <span className="font-black text-foreground">{autoDistributeGrade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-muted-foreground">الطلاب غير المسكنين:</span>
                    <span className="font-black text-amber-600 dark:text-amber-400">{unassignedByGrade[autoDistributeGrade] || 0} طالب</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-muted-foreground">الشُعب المتاحة للتوزيع:</span>
                    <span className="font-black text-foreground">{(groupedByGrade[autoDistributeGrade] || []).length} شُعب</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/30 leading-relaxed font-semibold">
                    سيقوم النظام بتوزيع الطلاب بالتساوي والعدل على شعب هذا الصف لتفادي تكدس الطلاب في شعبة واحدة.
                  </p>
                </div>

                <div className="pt-3 border-t border-border/50 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAutoDistributeModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-input bg-background text-xs font-bold text-foreground hover:bg-muted"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={() => executeAutoDistribution(autoDistributeGrade)}
                    className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md hover:bg-primary/90 transition-all glow-primary flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>بدء التوزيع الآن</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Print Engine */}
          <AdvancedPrintEngine 
            isOpen={isPrintOpen} 
            onClose={() => setIsPrintOpen(false)} 
            title={printTargetSectionId 
              ? `كشوف قوائم شعبة (${activeStageSections.find(s => s.id === printTargetSectionId)?.name || ""})` 
              : `كشوف قوائم الصفوف والشعب - ${getStageLabel(stage)}`}
            subtitle={printTargetSectionId 
              ? `الصف: ${activeStageSections.find(s => s.id === printTargetSectionId)?.grade || ""} • رائد الفصل: ${activeStageSections.find(s => s.id === printTargetSectionId)?.homeroomTeacher || "غير محدد"}` 
              : `المرحلة التعليمية: ${getStageLabel(stage)} • العام الدراسي المعتمد`}
            data={printTargetSectionId 
              ? activeStageStudents.filter(s => s.sectionId === printTargetSectionId) 
              : activeStageStudents}
            templates={printTemplates}
          />
        </div>
      )}
    </AppShell>
  );
}
