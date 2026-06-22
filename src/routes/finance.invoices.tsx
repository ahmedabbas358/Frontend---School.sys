import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { FileText, Search, Filter, Printer, Eye, X, Plus, DollarSign, Users, AlertTriangle, CheckCircle2, GraduationCap, Building } from "lucide-react";
import { useState, useMemo } from "react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { useGlobalStore, Invoice } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { toast } from "sonner";

export const Route = createFileRoute("/finance/invoices")({
  component: FinanceInvoices,
});

function FinanceInvoices() {
  const { currency, activeStageInvoices, activeStageStudents, activeStageFeeStructures, activeStageSections, addInvoice, allDiscounts  } = useGlobalStore();
  const { stage, getStageLabel } = useStage();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  
  // New Mass-Assignment States
  const [invoiceTargetType, setInvoiceTargetType] = useState<"student" | "section" | "grade">("student");
  const [invoiceTargetIds, setInvoiceTargetIds] = useState<string[]>([]);
  const [targetSearchQ, setTargetSearchQ] = useState("");

  const [newInvoiceData, setNewInvoiceData] = useState({
    title: "",
    amount: 0,
    discountId: "",
    dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });

  // Available grades from sections
  const uniqueGrades = useMemo(() => {
    return Array.from(new Set(activeStageSections.map(s => s.grade))).filter(Boolean).sort();
  }, [activeStageSections]);

  // Available sections for selected grade
  const availableSections = useMemo(() => {
    if (!gradeFilter) return activeStageSections;
    return activeStageSections.filter(s => s.grade === gradeFilter);
  }, [activeStageSections, gradeFilter]);

  // Build a map of studentId -> student for quick lookup
  const studentMap = useMemo(() => {
    const map = new Map<string, typeof activeStageStudents[0]>();
    activeStageStudents.forEach(s => map.set(s.id, s));
    return map;
  }, [activeStageStudents]);

  const filtered = useMemo(() => {
    return activeStageInvoices.filter(inv => {
      if (q && !inv.studentName.includes(q) && !inv.id.includes(q)) return false;
      if (statusFilter && inv.status !== statusFilter) return false;
      
      // Grade filter
      if (gradeFilter) {
        const student = studentMap.get(inv.studentId);
        if (!student || student.grade !== gradeFilter) return false;
      }
      
      // Section filter
      if (sectionFilter) {
        const student = studentMap.get(inv.studentId);
        if (!student || student.sectionId !== sectionFilter) return false;
      }
      
      return true;
    });
  }, [q, activeStageInvoices, statusFilter, gradeFilter, sectionFilter, studentMap]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalAmount = filtered.reduce((sum, inv) => sum + (inv.netAmount ?? inv.amount), 0);
    const totalPaid = filtered.reduce((sum, inv) => sum + inv.paid, 0);
    const totalDue = totalAmount - totalPaid;
    const paidCount = filtered.filter(inv => inv.status === "paid").length;
    const partialCount = filtered.filter(inv => inv.status === "partial").length;
    const unpaidCount = filtered.filter(inv => inv.status === "unpaid").length;
    return { totalAmount, totalPaid, totalDue, paidCount, partialCount, unpaidCount, total: filtered.length };
  }, [filtered]);

  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isPrintSingleOpen, setIsPrintSingleOpen] = useState(false);

  const printTemplates: PrintTemplate[] = [
    {
      id: "invoices-list",
      name: "سجل الفواتير",
      category: "المالية والمحاسبة",
      type: "table",
      columns: [
        { label: "رقم الفاتورة", key: "id" },
        { label: "اسم الطالب", key: "studentName" },
        { label: "البيان", key: "title" },
        { label: "المبلغ الإجمالي", key: "netAmount" },
        { label: "المدفوع", key: "paid" },
        { label: "المتبقي", key: "due", render: (r) => (r.netAmount ?? r.amount) - r.paid },
        { label: "تاريخ الاستحقاق", key: "dueDate" },
        { label: "الحالة", key: "status", render: (r) => r.status === "paid" ? "مسدد" : r.status === "partial" ? "مسدد جزئياً" : "غير مسدد" },
      ]
    }
  ];

  const singlePrintTemplate: PrintTemplate[] = [
    {
      id: "invoice-single",
      name: "طباعة الفاتورة",
      category: "المالية والمحاسبة",
      type: "receipt",
      columns: [
        { label: "الرسوم الأساسية", key: "amount" },
        { label: "قيمة الخصم", key: "discountAmount" },
        { label: "الصافي المطلوب", key: "netAmount" },
        { label: "المدفوع حتى الآن", key: "paid" },
      ],
      customControls: [
        { key: "notes", label: "ملاحظات", type: "text", defaultValue: "تعتبر هذه الفاتورة إشعاراً بالمطالبة المالية" }
      ]
    }
  ];

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (invoiceTargetIds.length === 0 || !newInvoiceData.title || !newInvoiceData.amount) {
      toast.error("يرجى تعبئة الحقول المطلوبة واختيار المستهدفين");
      return;
    }
    
    // Resolve target students
    let targetStudents: typeof activeStageStudents = [];
    if (invoiceTargetType === "student") {
      targetStudents = activeStageStudents.filter(s => invoiceTargetIds.includes(s.id));
    } else if (invoiceTargetType === "section") {
      targetStudents = activeStageStudents.filter(s => invoiceTargetIds.includes(s.sectionId));
    } else if (invoiceTargetType === "grade") {
      targetStudents = activeStageStudents.filter(s => invoiceTargetIds.includes(s.grade));
    }

    if (targetStudents.length === 0) {
      toast.error("لم يتم العثور على طلاب مطابقين للمستهدفين في هذه المرحلة");
      return;
    }

    let discountAmount = 0;
    if (newInvoiceData.discountId) {
      const discount = allDiscounts.find(d => d.id === newInvoiceData.discountId);
      if (discount) {
        if (discount.type === "percentage") {
          discountAmount = (newInvoiceData.amount * discount.value) / 100;
        } else {
          discountAmount = discount.value;
        }
      }
    }

    let count = 0;
    targetStudents.forEach(student => {
      addInvoice({
        studentId: student.id,
        studentName: student.name,
        title: newInvoiceData.title,
        amount: newInvoiceData.amount,
        discountId: newInvoiceData.discountId || undefined,
        discountAmount,
        netAmount: Math.max(0, newInvoiceData.amount - discountAmount),
        dueDate: newInvoiceData.dueDate,
        issueDate: new Date().toISOString().split('T')[0],
        stage: student.stage
      });
      count++;
    });
    
    toast.success(`تم إصدار ${count} فاتورة بنجاح وتخصيصها لملفات الطلاب`);
    setIsNewInvoiceOpen(false);
    setNewInvoiceData({
      title: "",
      amount: 0,
      discountId: "",
      dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
    });
    setInvoiceTargetIds([]);
    setTargetSearchQ("");
  };

  const toggleTarget = (id: string) => {
    setInvoiceTargetIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Get section name for display
  const getSectionName = (studentId: string) => {
    const student = studentMap.get(studentId);
    if (!student?.sectionId) return "-";
    const section = activeStageSections.find(s => s.id === student.sectionId);
    return section ? `${section.grade} / ${section.name}` : "-";
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المالية والمحاسبة" },
        { label: "إدارة الفواتير" },
      ]}
      actions={
        <div className="flex gap-2">
          <button 
            onClick={() => setIsNewInvoiceOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Plus className="h-4 w-4" /> إصدار فاتورة / إضافة رسوم
          </button>
          <button 
            onClick={() => setIsPrintOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary/10 px-4 text-sm font-bold text-primary hover:bg-primary/20 transition-all border border-primary/20"
          >
            <Printer className="h-4 w-4" /> طباعة السجل
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground">إجمالي المطلوب</p>
                <p className="mt-1 text-xl font-black text-primary tabular-nums">{summaryStats.totalAmount.toLocaleString()} <span className="text-sm font-bold">{currency}</span></p>
              </div>
              <div className="rounded-full bg-primary/10 p-2 text-primary"><DollarSign className="h-4 w-4" /></div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground">إجمالي المحصل</p>
                <p className="mt-1 text-xl font-black text-success tabular-nums">{summaryStats.totalPaid.toLocaleString()} <span className="text-sm font-bold">{currency}</span></p>
              </div>
              <div className="rounded-full bg-success/10 p-2 text-success"><CheckCircle2 className="h-4 w-4" /></div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground">إجمالي المتبقي</p>
                <p className="mt-1 text-xl font-black text-danger tabular-nums">{summaryStats.totalDue.toLocaleString()} <span className="text-sm font-bold">{currency}</span></p>
              </div>
              <div className="rounded-full bg-danger/10 p-2 text-danger"><AlertTriangle className="h-4 w-4" /></div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs font-bold text-muted-foreground mb-2">توزيع الحالات ({summaryStats.total})</p>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> {summaryStats.paidCount} مسدد</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> {summaryStats.partialCount} جزئي</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-danger" /> {summaryStats.unpaidCount} معلق</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-primary">فلاتر التصفية</span>
            {(gradeFilter || sectionFilter || statusFilter || q) && (
              <button 
                onClick={() => { setQ(""); setStatusFilter(""); setGradeFilter(""); setSectionFilter(""); }}
                className="mr-auto text-xs font-bold text-danger hover:text-danger/80 transition-colors bg-danger/10 px-3 py-1 rounded-full"
              >
                مسح الكل ✕
              </button>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`البحث في فواتير ${getStageLabel(stage)}...`}
                className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <select 
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold cursor-pointer"
              value={gradeFilter}
              onChange={e => { setGradeFilter(e.target.value); setSectionFilter(""); }}
            >
              <option value="">الصف (الكل)</option>
              {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select 
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold cursor-pointer"
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
              disabled={!gradeFilter}
            >
              <option value="">الشعبة (الكل)</option>
              {availableSections.map(s => <option key={s.id} value={s.id}>شعبة {s.name}</option>)}
            </select>
            <select 
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-bold cursor-pointer"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">حالة السداد (الكل)</option>
              <option value="paid">مسدد بالكامل</option>
              <option value="partial">مسدد جزئياً</option>
              <option value="unpaid">غير مسدد</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
        </div>

        <PageCard>
          <div className="mb-4 flex flex-col gap-1 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">سجل فواتير الرسوم</h2>
            </div>
            <p className="text-sm text-muted-foreground">تتضمن جميع المطالبات المالية (رسوم دراسية، ترحيل، وغيرها) الخاصة بمرحلة: {getStageLabel(stage)}</p>
          </div>
          
          <DataTable
            rows={filtered}
            columns={[
              { key: "id", header: "رقم الفاتورة", cell: (r) => <span className="font-bold">{r.id}</span> },
              { key: "student", header: "الطالب", cell: (r) => (
                <div>
                  <span className="font-medium text-primary block">{r.studentName}</span>
                  <span className="text-xs text-muted-foreground">{getSectionName(r.studentId)}</span>
                </div>
              )},
              { key: "title", header: "البيان", cell: (r) => <span className="text-sm font-medium">{r.title}</span> },
              { key: "amount", header: "إجمالي الفاتورة", cell: (r) => <span className="font-bold">{(r.netAmount ?? r.amount).toLocaleString()} {currency}</span> },
              { key: "paid", header: "المدفوع", cell: (r) => <span className="text-success font-bold">{r.paid.toLocaleString()} {currency}</span> },
              { key: "due", header: "المتبقي", cell: (r) => {
                const due = (r.netAmount ?? r.amount) - r.paid;
                return <span className={due > 0 ? "text-danger font-bold" : "text-muted-foreground"}>{due.toLocaleString()} {currency}</span>;
              }},
              { key: "dueDate", header: "الاستحقاق", cell: (r) => <span className="text-sm">{r.dueDate}</span> },
              {
                key: "status",
                header: "الحالة",
                cell: (r) => (
                  <Badge tone={r.status === "paid" ? "success" : r.status === "partial" ? "warning" : r.status === "cancelled" ? "neutral" : "danger"}>
                    {r.status === "paid" ? "مسدد" : r.status === "partial" ? "جزئي" : r.status === "cancelled" ? "ملغاة" : "غير مسدد"}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "إجراءات",
                cell: (r) => (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSelectedInvoice(r)}
                      className="rounded-md p-2 text-primary hover:bg-primary/10 transition-colors"
                      title="عرض التفاصيل"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedInvoice(r);
                        setIsPrintSingleOpen(true);
                      }}
                      className="rounded-md p-2 text-muted-foreground hover:bg-accent transition-colors"
                      title="طباعة"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </div>
                )
              }
            ]}
            empty={`لا توجد فواتير لهذه المرحلة.`}
          />
        </PageCard>
      </div>

      {isNewInvoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto pt-24 pb-12 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl rounded-3xl bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-full">
            <div className="bg-primary/5 p-6 flex items-center justify-between border-b border-border/50 shrink-0">
              <div>
                <h2 className="text-2xl font-black flex items-center gap-2 text-primary">
                  <FileText className="h-6 w-6" /> إصدار فاتورة رسوم جديدة
                </h2>
                <p className="text-sm text-muted-foreground mt-1">يمكنك تعيين الفاتورة لطالب محدد، أو تخصيصها لمجموعة من الطلاب بشكل جماعي.</p>
              </div>
              <button onClick={() => { setIsNewInvoiceOpen(false); setInvoiceTargetIds([]); }} className="rounded-full p-2 hover:bg-accent transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateInvoice} className="flex flex-col md:flex-row overflow-hidden flex-1">
              {/* Left Column - Target Selection */}
              <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-l border-border/50 flex flex-col gap-4 bg-muted/30 overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">تحديد المستهدفين</h3>
                </div>

                {/* Target Type Selector */}
                <div className="flex bg-background border border-border/50 rounded-xl p-1 gap-1">
                  <button 
                    type="button"
                    onClick={() => { setInvoiceTargetType("student"); setInvoiceTargetIds([]); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${invoiceTargetType === "student" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent text-muted-foreground"}`}
                  >
                    <Users className="h-4 w-4" /> فردي
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setInvoiceTargetType("section"); setInvoiceTargetIds([]); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${invoiceTargetType === "section" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent text-muted-foreground"}`}
                  >
                    <Building className="h-4 w-4" /> شعبة
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setInvoiceTargetType("grade"); setInvoiceTargetIds([]); }}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${invoiceTargetType === "grade" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-accent text-muted-foreground"}`}
                  >
                    <GraduationCap className="h-4 w-4" /> صف دراسي
                  </button>
                </div>

                {/* Target Search & Selection Area */}
                <div className="flex-1 min-h-[300px] flex flex-col gap-3">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="البحث للفلترة..."
                      value={targetSearchQ}
                      onChange={e => setTargetSearchQ(e.target.value)}
                      className="w-full h-10 bg-background border border-border/50 rounded-xl pr-9 pl-4 text-sm font-medium outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex-1 bg-background border border-border/50 rounded-xl overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {invoiceTargetType === "student" && activeStageStudents
                      .filter(s => s.name.includes(targetSearchQ) || s.nationalId?.includes(targetSearchQ))
                      .map(s => (
                      <label key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${invoiceTargetIds.includes(s.id) ? "bg-primary/5 border-primary/30" : "border-transparent hover:bg-accent"}`}>
                        <input type="checkbox" checked={invoiceTargetIds.includes(s.id)} onChange={() => toggleTarget(s.id)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                        <div>
                          <p className="font-bold text-sm">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.grade} - {getSectionName(s.id)}</p>
                        </div>
                      </label>
                    ))}

                    {invoiceTargetType === "section" && activeStageSections
                      .filter(s => s.name.includes(targetSearchQ) || s.grade.includes(targetSearchQ))
                      .map(s => (
                      <label key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${invoiceTargetIds.includes(s.id) ? "bg-primary/5 border-primary/30" : "border-transparent hover:bg-accent"}`}>
                        <input type="checkbox" checked={invoiceTargetIds.includes(s.id)} onChange={() => toggleTarget(s.id)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                        <div>
                          <p className="font-bold text-sm">شعبة {s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.grade}</p>
                        </div>
                      </label>
                    ))}

                    {invoiceTargetType === "grade" && uniqueGrades
                      .filter(g => g.includes(targetSearchQ))
                      .map(g => (
                      <label key={g} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${invoiceTargetIds.includes(g) ? "bg-primary/5 border-primary/30" : "border-transparent hover:bg-accent"}`}>
                        <input type="checkbox" checked={invoiceTargetIds.includes(g)} onChange={() => toggleTarget(g)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                        <div>
                          <p className="font-bold text-sm">{g}</p>
                          <p className="text-xs text-muted-foreground">سيتم تطبيق الرسوم على جميع شعب هذا الصف</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="bg-primary/10 text-primary text-xs font-bold p-3 rounded-xl flex items-center justify-between">
                    <span>العناصر المحددة:</span>
                    <span className="bg-background px-2 py-1 rounded-md border border-primary/20">{invoiceTargetIds.length}</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Invoice Details */}
              <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto">
                <div className="flex items-center gap-2 mb-6">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">تفاصيل الرسوم</h3>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-muted-foreground">البيان (نوع الرسوم) <span className="text-danger">*</span></label>
                    <input
                      required
                      type="text"
                      placeholder="مثال: رسوم نقل مدرسي، رسوم زي..."
                      className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                      value={newInvoiceData.title}
                      onChange={e => setNewInvoiceData({...newInvoiceData, title: e.target.value})}
                      list="fee-templates"
                    />
                    <datalist id="fee-templates">
                      {activeStageFeeStructures.map(f => <option key={f.id} value={f.name} />)}
                    </datalist>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-muted-foreground">المبلغ (ر.س) <span className="text-danger">*</span></label>
                    <input
                      required
                      type="number"
                      min="1"
                      className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-black text-xl text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors tabular-nums"
                      value={newInvoiceData.amount || ""}
                      onChange={e => setNewInvoiceData({...newInvoiceData, amount: Number(e.target.value)})}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-muted-foreground">تطبيق خصم مسبق الإعداد (اختياري)</label>
                    <select 
                      className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-bold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                      value={newInvoiceData.discountId}
                      onChange={e => setNewInvoiceData({...newInvoiceData, discountId: e.target.value})}
                    >
                      <option value="">بدون خصم</option>
                      {allDiscounts.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.type === 'percentage' ? d.value + '%' : d.value + ' {currency}'})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-muted-foreground">تاريخ الاستحقاق <span className="text-danger">*</span></label>
                    <input
                      required
                      type="date"
                      className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                      value={newInvoiceData.dueDate}
                      onChange={e => setNewInvoiceData({...newInvoiceData, dueDate: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-auto pt-8 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => { setIsNewInvoiceOpen(false); setInvoiceTargetIds([]); }}
                    className="rounded-xl px-5 py-2.5 font-bold hover:bg-accent transition-colors"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit" 
                    className="rounded-xl bg-primary px-8 py-2.5 font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    إصدار الفواتير
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedInvoice && !isPrintSingleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-primary/5 p-6 flex items-center justify-between border-b border-border/50">
              <h2 className="text-xl font-black flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" /> تفاصيل الفاتورة
              </h2>
              <button onClick={() => setSelectedInvoice(null)} className="rounded-full p-2 hover:bg-accent transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-border/50">
                <span className="text-muted-foreground">رقم الفاتورة</span>
                <span className="font-black text-lg">{selectedInvoice.id}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-border/50">
                <span className="text-muted-foreground">الطالب</span>
                <span className="font-bold">{selectedInvoice.studentName}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-border/50">
                <span className="text-muted-foreground">الصف / الشعبة</span>
                <span className="font-bold text-sm">{getSectionName(selectedInvoice.studentId)}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-border/50">
                <span className="text-muted-foreground">البيان</span>
                <span className="font-bold">{selectedInvoice.title}</span>
              </div>
              
              <div className="bg-accent/30 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-muted-foreground">المبلغ الأساسي</span>
                  <span className="font-bold">{selectedInvoice.amount.toLocaleString()} {currency}</span>
                </div>
                {selectedInvoice.discountAmount ? (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-danger">الخصم المطبق</span>
                    <span className="font-bold text-danger">-{selectedInvoice.discountAmount.toLocaleString()} {currency}</span>
                  </div>
                ) : null}
                <div className="flex justify-between items-center pt-3 border-t border-border/50">
                  <span className="font-black">الإجمالي المطلوب</span>
                  <span className="font-black text-xl text-primary">{(selectedInvoice.netAmount ?? selectedInvoice.amount).toLocaleString()} {currency}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-muted-foreground">تاريخ الإصدار</span>
                <span className="font-bold">{selectedInvoice.issueDate || "-"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">تاريخ الاستحقاق</span>
                <span className="font-bold text-warning">{selectedInvoice.dueDate}</span>
              </div>
            </div>

            <div className="p-4 bg-muted flex gap-2">
               <button 
                onClick={() => setIsPrintSingleOpen(true)}
                className="w-full rounded-xl bg-card border border-border px-4 py-3 font-bold text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="h-4 w-4" /> طباعة
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <AdvancedPrintEngine
          isOpen={isPrintSingleOpen}
          onClose={() => {
            setIsPrintSingleOpen(false);
            setSelectedInvoice(null);
          }}
          title={`فاتورة رقم - ${selectedInvoice.id}`}
          data={[selectedInvoice]}
          templates={singlePrintTemplate}
        />
      )}
      
      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title={`سجل الفواتير - ${getStageLabel(stage)}`}
        data={filtered}
        templates={printTemplates}
      />
    </AppShell>
  );
}
