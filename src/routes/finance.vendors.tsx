import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore, Vendor } from "@/contexts/GlobalStoreContext";
import { AdminModal } from "@/components/admin/admin-modal";
import { FinanceNavTabs } from "@/components/finance/finance-nav";
import { 
  Building, 
  Plus, 
  Phone, 
  Mail, 
  FileText, 
  CheckCircle2, 
  X, 
  CreditCard, 
  DollarSign, 
  Search, 
  Download, 
  Edit3, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  Receipt, 
  MapPin, 
  Landmark, 
  Clock, 
  Briefcase,
  ShieldCheck,
  Filter
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/finance/vendors")({
  component: FinanceVendors,
});

const VENDOR_CATEGORIES = [
  "صيانة وتشغيل ومرافق",
  "تقنية معلومات وأجهزة",
  "توريدات مكتبية وقرطاسية",
  "خدمات تغذية ومقصف",
  "كتب ومناهج ومطبوعات",
  "نقل وترحيل مدرسي",
  "استشارات وتدريب",
  "تجهيزات رياضية وفنية",
  "أخرى"
];

function FinanceVendors() {
  const { 
    allVendors, 
    currency, 
    addVendor, 
    updateVendor, 
    deleteVendor, 
    payVendor, 
    allBankAccounts,
    allExpenses,
    addExpense,
    addAuditLog
  } = useGlobalStore();

  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState<"all" | "has_balance" | "settled">("all");

  // Modals state
  const [addVendorModal, setAddVendorModal] = useState(false);
  const [editVendorData, setEditVendorData] = useState<Vendor | null>(null);
  const [payModalData, setPayModalData] = useState<Vendor | null>(null);
  const [statementVendor, setStatementVendor] = useState<Vendor | null>(null);
  const [deleteConfirmVendor, setDeleteConfirmVendor] = useState<Vendor | null>(null);

  // Form Handlers
  const handleAddVendor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();
    if (!name) {
      toast.error("اسم المورد أو الشركة مطلوب");
      return;
    }

    const newVendorData: Omit<Vendor, "id"> = {
      name,
      companyName: (formData.get("companyName") as string)?.trim() || name,
      contactPerson: (formData.get("contactPerson") as string)?.trim() || "",
      phone: (formData.get("phone") as string)?.trim() || "",
      email: (formData.get("email") as string)?.trim() || "",
      category: (formData.get("category") as string) || "أخرى",
      taxId: (formData.get("taxId") as string)?.trim() || "",
      address: (formData.get("address") as string)?.trim() || "",
      notes: (formData.get("notes") as string)?.trim() || "",
      balance: Number(formData.get("balance") || 0),
      status: "active",
    };

    addVendor(newVendorData);
    toast.success("تم تسجيل المورد في السجل التجاري والمالي بنجاح");
    setAddVendorModal(false);
  };

  const handleEditVendor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editVendorData) return;
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();
    if (!name) {
      toast.error("اسم المورد مطلوب");
      return;
    }

    updateVendor(editVendorData.id, {
      name,
      companyName: (formData.get("companyName") as string)?.trim() || name,
      contactPerson: (formData.get("contactPerson") as string)?.trim() || "",
      phone: (formData.get("phone") as string)?.trim() || "",
      email: (formData.get("email") as string)?.trim() || "",
      category: (formData.get("category") as string) || editVendorData.category,
      taxId: (formData.get("taxId") as string)?.trim() || "",
      address: (formData.get("address") as string)?.trim() || "",
      notes: (formData.get("notes") as string)?.trim() || "",
      status: (formData.get("status") as "active" | "inactive") || "active",
    });

    toast.success(`تم تحديث بيانات المورد "${name}" بنجاح`);
    setEditVendorData(null);
  };

  const handlePayVendor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!payModalData) return;
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    const method = formData.get("method") as "bank_transfer" | "cash" | "cheque" | "card";
    const bankAccountId = formData.get("bankAccountId") as string;
    const referenceNo = (formData.get("referenceNo") as string)?.trim() || `VP-${Date.now().toString().slice(-6)}`;
    const recordExpense = formData.get("recordExpense") === "on";
    const paymentNotes = (formData.get("notes") as string)?.trim() || "";

    if (!amount || amount <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }

    if (amount > (payModalData.balance || 0)) {
      toast.error("مبلغ السداد أكبر من رصيد المستحقات المتبقية للمورد");
      return;
    }

    // 1. Pay Vendor in store
    payVendor(payModalData.id, amount);

    // 2. If requested, automatically post to Expenses ledger
    if (recordExpense) {
      addExpense({
        title: `سداد مستحقات مورد: ${payModalData.name}`,
        amount,
        date: new Date().toISOString().split("T")[0],
        categoryId: "EXP-CAT-VENDORS",
        beneficiary: payModalData.name,
        method: method === "cheque" ? "bank_transfer" : method,
        referenceNo,
        notes: `سداد فواتير مورد ${payModalData.name}. ${paymentNotes}`.trim(),
        status: "approved"
      });
    }

    addAuditLog({
      action: "update",
      details: `سداد مستحقات المورد ${payModalData.name} بمبلغ ${amount.toLocaleString()} ${currency} عبر ${method}`,
      entityType: "system",
      entityId: payModalData.id,
      userId: "SYS",
      userName: "مدير الحسابات"
    });

    toast.success(`تم سداد مبلغ ${amount.toLocaleString()} ${currency} للمورد ${payModalData.name} بنجاح`);
    setPayModalData(null);
  };

  const handleDeleteVendor = () => {
    if (!deleteConfirmVendor) return;
    deleteVendor(deleteConfirmVendor.id);
    toast.success(`تم حذف المورد "${deleteConfirmVendor.name}" من السجل نهائياً`);
    setDeleteConfirmVendor(null);
  };

  // Filtered list
  const filteredVendors = useMemo(() => {
    return allVendors.filter((v: any) => {
      // Search
      if (q) {
        const qLower = q.toLowerCase();
        const matchName = v.name?.toLowerCase().includes(qLower);
        const matchComp = v.companyName?.toLowerCase().includes(qLower);
        const matchContact = v.contactPerson?.toLowerCase().includes(qLower);
        const matchTax = v.taxId?.toLowerCase().includes(qLower);
        const matchPhone = v.phone?.includes(q);
        if (!matchName && !matchComp && !matchContact && !matchTax && !matchPhone) return false;
      }

      // Category
      if (categoryFilter !== "all" && v.category !== categoryFilter) {
        return false;
      }

      // Balance
      if (balanceFilter === "has_balance" && (!v.balance || v.balance <= 0)) {
        return false;
      }
      if (balanceFilter === "settled" && v.balance > 0) {
        return false;
      }

      return true;
    });
  }, [allVendors, q, categoryFilter, balanceFilter]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const totalVendors = allVendors.length;
    const totalBalance = allVendors.reduce((sum: number, v: any) => sum + (v.balance || 0), 0);
    const activeVendorsWithBalance = allVendors.filter((v: any) => (v.balance || 0) > 0).length;
    const settledVendors = totalVendors - activeVendorsWithBalance;
    return { totalVendors, totalBalance, activeVendorsWithBalance, settledVendors };
  }, [allVendors]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredVendors.length === 0) {
      toast.error("لا توجد بيانات لتصديرها");
      return;
    }

    const headers = [
      "رقم المورد",
      "اسم المورد والشركة",
      "التصنيف",
      "مسؤول التواصل",
      "رقم الهاتف",
      "البريد الإلكتروني",
      "الرقم الضريبي",
      "الرصيد المستحق (دائن)",
      "الحالة"
    ];

    const rows = filteredVendors.map((v: any) => [
      v.id,
      `"${v.name?.replace(/"/g, '""') || ''}"`,
      `"${v.category || ''}"`,
      `"${v.contactPerson || ''}"`,
      `"${v.phone || ''}"`,
      `"${v.email || ''}"`,
      `"${v.taxId || ''}"`,
      v.balance || 0,
      v.balance > 0 ? "مستحقات معلقة" : "مسوى بالكامل"
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `سجل_الموردين_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير سجل الموردين بنجاح");
  };

  // Vendor Statement helper: Find all expenses linked to this vendor
  const vendorExpenses = useMemo(() => {
    if (!statementVendor) return [];
    return allExpenses.filter(e => 
      e.beneficiary?.toLowerCase() === statementVendor.name.toLowerCase() ||
      e.title?.includes(statementVendor.name)
    );
  }, [statementVendor, allExpenses]);

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance/dashboard" },
        { label: "سجل الموردين والمقاولين (الذمم الدائنة)" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-card border border-border/70 text-foreground px-3.5 text-xs font-bold shadow-sm hover:bg-accent transition-all"
          >
            <Download className="h-4 w-4 text-primary" /> تصدير كشف الموردين
          </button>
          <button 
            onClick={() => setAddVendorModal(true)} 
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 text-xs font-extrabold shadow-sm hover:bg-primary/90 transition-all shadow-primary/20"
          >
            <Plus className="h-4 w-4" /> إضافة مورد / مقاول جديد
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        {/* Unified Finance Navigation Tabs */}
        <FinanceNavTabs activeTab="vendors" />
        
        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <PageCard className="p-4 flex items-center gap-4 bg-card border border-border/60 rounded-2xl shadow-sm">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي الشركات والموردين</p>
              <p className="text-2xl font-black tabular-nums">{aggregateStats.totalVendors}</p>
            </div>
          </PageCard>

          <PageCard className="p-4 flex items-center gap-4 border-r-4 border-r-danger bg-card rounded-2xl shadow-sm">
            <div className="p-3 bg-danger/10 text-danger rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي المستحقات الدائنة</p>
              <p className="text-xl font-black tabular-nums text-danger">
                {aggregateStats.totalBalance.toLocaleString()} {currency}
              </p>
            </div>
          </PageCard>

          <PageCard className="p-4 flex items-center gap-4 border-r-4 border-r-amber-500 bg-card rounded-2xl shadow-sm">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">موردون برصيد مستحق</p>
              <p className="text-xl font-black tabular-nums text-amber-600">
                {aggregateStats.activeVendorsWithBalance} مورد
              </p>
            </div>
          </PageCard>

          <PageCard className="p-4 flex items-center gap-4 border-r-4 border-r-success bg-card rounded-2xl shadow-sm">
            <div className="p-3 bg-success/10 text-success rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">حسابات مسواة بالكامل</p>
              <p className="text-xl font-black tabular-nums text-success">
                {aggregateStats.settledVendors} مورد
              </p>
            </div>
          </PageCard>
        </div>

        {/* Filters and Search Toolbar */}
        <PageCard className="p-4 bg-card/60 backdrop-blur-sm border border-border/60 rounded-2xl shadow-sm">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث بالاسم، المسؤول، الهاتف، الضريبي..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full pr-10 pl-3 py-2 bg-background border border-border/70 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/30 outline-none transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <Filter className="w-3.5 h-3.5" />
                <span>التصنيف:</span>
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-background border border-border/70 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/30 outline-none"
              >
                <option value="all">كافة التصنيفات</option>
                {VENDOR_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mr-2">
                <span>حالة الرصيد:</span>
              </div>
              <select
                value={balanceFilter}
                onChange={(e) => setBalanceFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-background border border-border/70 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/30 outline-none"
              >
                <option value="all">الكل</option>
                <option value="has_balance">مستحقات معلقة فقط</option>
                <option value="settled">مسوى (صفر) فقط</option>
              </select>

              {(q || categoryFilter !== "all" || balanceFilter !== "all") && (
                <button
                  onClick={() => { setQ(""); setCategoryFilter("all"); setBalanceFilter("all"); }}
                  className="px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/60 rounded-xl transition-all"
                >
                  إعادة ضبط
                </button>
              )}
            </div>
          </div>
        </PageCard>

        {/* Vendors Data Table */}
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <DataTable
            columns={[
              { 
                key: "name", 
                header: "المورد / الشركة والتصنيف", 
                cell: (v: any) => (
                  <div>
                    <div className="font-extrabold text-sm flex items-center gap-2">
                      {v.name}
                      {v.status === "inactive" && <Badge tone="neutral">موقوف</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {v.category && (
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[11px]">
                          {v.category}
                        </span>
                      )}
                      {v.taxId && (
                        <span className="font-mono text-[11px] bg-muted/60 px-1.5 py-0.5 rounded">
                          ضريبي: {v.taxId}
                        </span>
                      )}
                    </div>
                  </div>
                )
              },
              { 
                key: "contactPerson", 
                header: "بيانات الاتصال والتواصل", 
                cell: (v: any) => (
                  <div>
                    <div className="font-bold text-xs">{v.contactPerson || "غير محدد"}</div>
                    <div className="flex flex-col gap-1 mt-1 text-xs text-muted-foreground">
                      {v.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-primary" /> {v.phone}
                        </span>
                      )}
                      {v.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-muted-foreground" /> {v.email}
                        </span>
                      )}
                    </div>
                  </div>
                )
              },
              { 
                key: "balance", 
                header: "الرصيد المستحق (دائن)", 
                cell: (v: any) => (
                  <div>
                    <span className={`font-black tabular-nums text-base ${v.balance > 0 ? "text-danger" : "text-success"}`}>
                      {(v.balance || 0).toLocaleString()} {currency}
                    </span>
                    {v.balance > 0 ? (
                      <div className="text-[11px] text-danger/80 font-bold flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3" /> التزام قائم
                      </div>
                    ) : (
                      <div className="text-[11px] text-success/80 font-bold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> لا توجد مطالبات
                      </div>
                    )}
                  </div>
                )
              },
              { 
                key: "actions", 
                header: "العمليات والإجراءات", 
                cell: (v: any) => (
                  <div className="flex items-center gap-1.5">
                    {/* Pay Button */}
                    <button 
                      onClick={() => setPayModalData(v)}
                      disabled={!v.balance || v.balance <= 0}
                      title="سداد مستحقات"
                      className={`text-xs font-extrabold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                        v.balance > 0
                          ? "bg-success/15 text-success hover:bg-success hover:text-white"
                          : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" /> سداد
                    </button>

                    {/* Statement Button */}
                    <button 
                      onClick={() => setStatementVendor(v)}
                      title="كشف حساب وسجل المدفوعات"
                      className="text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
                    >
                      <Receipt className="w-3.5 h-3.5" /> كشف حساب
                    </button>

                    {/* Edit Button */}
                    <button 
                      onClick={() => setEditVendorData(v)}
                      title="تعديل بيانات المورد"
                      className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button 
                      onClick={() => setDeleteConfirmVendor(v)}
                      title="حذف المورد"
                      className="p-1.5 hover:bg-danger/10 rounded-lg text-muted-foreground hover:text-danger transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              }
            ]}
            rows={filteredVendors}
            pageSize={10}
            pageSizeOptions={[10, 25, 50]}
            empty="لا يوجد موردون مسجلون يطابقون شروط البحث الحالية"
          />
        </div>
      </div>

      {/* ==================== ADD VENDOR MODAL ==================== */}
      <AdminModal
        isOpen={addVendorModal}
        onClose={() => setAddVendorModal(false)}
        title="إضافة مورد / مقاول جديد"
        description="تسجيل بيانات المؤسسة، المسؤول، والالتزامات المالية في سجل الموردين"
        icon={Plus}
        tone="primary"
        maxWidth="xl"
      >
        <form onSubmit={handleAddVendor} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                اسم المورد أو المؤسسة <span className="text-danger">*</span>
              </label>
              <input 
                type="text" 
                name="name" 
                required 
                placeholder="مثال: شركة الرواد للتجهيزات" 
                className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl font-bold text-xs focus:ring-2 focus:ring-primary/40 outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                التصنيف التوريدي <span className="text-danger">*</span>
              </label>
              <select 
                name="category" 
                required 
                className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl font-bold text-xs focus:ring-2 focus:ring-primary/40 outline-none"
              >
                {VENDOR_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                المسؤول أو المندوب
              </label>
              <input 
                type="text" 
                name="contactPerson" 
                placeholder="اسم المندوب أو المدير المسؤول..." 
                className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl font-bold text-xs focus:ring-2 focus:ring-primary/40 outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                رقم الهاتف / الجوال
              </label>
              <input 
                type="text" 
                name="phone" 
                placeholder="05xxxxxxxx" 
                className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/40 outline-none font-mono" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                البريد الإلكتروني
              </label>
              <input 
                type="email" 
                name="email" 
                placeholder="info@company.com" 
                className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs focus:ring-2 focus:ring-primary/40 outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                الرقم الضريبي (VAT)
              </label>
              <input 
                type="text" 
                name="taxId" 
                placeholder="300xxxxxxxxx" 
                className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs focus:ring-2 focus:ring-primary/40 outline-none font-mono" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                العنوان والمقر
              </label>
              <input 
                type="text" 
                name="address" 
                placeholder="المدينة، الحي، الشارع..." 
                className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs focus:ring-2 focus:ring-primary/40 outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                الرصيد الافتتاحي المستحق للمورد ({currency})
              </label>
              <input 
                type="number" 
                name="balance" 
                defaultValue="0" 
                min="0" 
                className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs font-black text-danger focus:ring-2 focus:ring-primary/40 outline-none tabular-nums" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1">
              ملاحظات أو شروط التوريد
            </label>
            <textarea 
              name="notes" 
              rows={2} 
              placeholder="أي تفاصيل خاصة بالحساب أو شروط الدفع والآجال..." 
              className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs focus:ring-2 focus:ring-primary/40 outline-none" 
            />
          </div>

          <div className="pt-3 flex gap-3 border-t border-border/40">
            <button 
              type="submit" 
              className="flex-1 btn-primary font-extrabold py-2.5 rounded-xl shadow-md text-xs"
            >
              حفظ وتسجيل المورد
            </button>
            <button 
              type="button" 
              onClick={() => setAddVendorModal(false)} 
              className="flex-1 btn-secondary py-2.5 rounded-xl text-xs font-bold"
            >
              إلغاء
            </button>
          </div>
        </form>
      </AdminModal>

      {/* ==================== EDIT VENDOR MODAL ==================== */}
      <AdminModal
        isOpen={!!editVendorData}
        onClose={() => setEditVendorData(null)}
        title={`تعديل بيانات المورد: ${editVendorData?.name || ""}`}
        description="تحديث أرقام التواصل، السجل الضريبي وحالة التعامل"
        icon={Edit3}
        tone="primary"
        maxWidth="xl"
      >
        {editVendorData && (
          <form onSubmit={handleEditVendor} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  اسم المورد أو المؤسسة <span className="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  name="name" 
                  defaultValue={editVendorData.name}
                  required 
                  className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl font-bold text-xs focus:ring-2 focus:ring-primary/40 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  التصنيف التوريدي <span className="text-danger">*</span>
                </label>
                <select 
                  name="category" 
                  defaultValue={editVendorData.category}
                  required 
                  className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl font-bold text-xs focus:ring-2 focus:ring-primary/40 outline-none"
                >
                  {VENDOR_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  المسؤول أو المندوب
                </label>
                <input 
                  type="text" 
                  name="contactPerson" 
                  defaultValue={editVendorData.contactPerson}
                  className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl font-bold text-xs focus:ring-2 focus:ring-primary/40 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  رقم الهاتف / الجوال
                </label>
                <input 
                  type="text" 
                  name="phone" 
                  defaultValue={editVendorData.phone}
                  className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/40 outline-none font-mono" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  البريد الإلكتروني
                </label>
                <input 
                  type="email" 
                  name="email" 
                  defaultValue={editVendorData.email}
                  className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs focus:ring-2 focus:ring-primary/40 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  الرقم الضريبي (VAT)
                </label>
                <input 
                  type="text" 
                  name="taxId" 
                  defaultValue={editVendorData.taxId}
                  className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs focus:ring-2 focus:ring-primary/40 outline-none font-mono" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  العنوان والمقر
                </label>
                <input 
                  type="text" 
                  name="address" 
                  defaultValue={editVendorData.address}
                  className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs focus:ring-2 focus:ring-primary/40 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  حالة التعامل
                </label>
                <select 
                  name="status" 
                  defaultValue={editVendorData.status || "active"}
                  className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl font-bold text-xs focus:ring-2 focus:ring-primary/40 outline-none"
                >
                  <option value="active">نشط ومعتمد</option>
                  <option value="inactive">موقوف مؤقتاً</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                ملاحظات
              </label>
              <textarea 
                name="notes" 
                rows={2} 
                defaultValue={editVendorData.notes}
                className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs focus:ring-2 focus:ring-primary/40 outline-none" 
              />
            </div>

            <div className="pt-3 flex gap-3 border-t border-border/40">
              <button 
                type="submit" 
                className="flex-1 btn-primary font-extrabold py-2.5 rounded-xl shadow-md text-xs"
              >
                حفظ التعديلات
              </button>
              <button 
                type="button" 
                onClick={() => setEditVendorData(null)} 
                className="flex-1 btn-secondary py-2.5 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </AdminModal>

      {/* ==================== PAY VENDOR MODAL ==================== */}
      <AdminModal
        isOpen={!!payModalData}
        onClose={() => setPayModalData(null)}
        title="سداد مستحقات المورد"
        description="صرف دفعة مالية وقيدها في حسابات المورد مع إمكانية الترحيل لسجل المصروفات"
        icon={CreditCard}
        tone="success"
        maxWidth="lg"
      >
        {payModalData && (
          <form onSubmit={handlePayVendor} className="space-y-4">
            <div className="p-4 bg-muted/40 rounded-2xl border border-border/60 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-bold">اسم المورد</p>
                <p className="font-black text-sm text-foreground">{payModalData.name}</p>
                {payModalData.taxId && <p className="text-[11px] font-mono text-muted-foreground mt-0.5">ضريبي: {payModalData.taxId}</p>}
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground font-bold">الرصيد المستحق حالياً</p>
                <p className="font-black text-lg text-danger tabular-nums">
                  {(payModalData.balance || 0).toLocaleString()} {currency}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                المبلغ المراد سداده ({currency}) <span className="text-danger">*</span>
              </label>
              <input 
                type="number" 
                name="amount" 
                required 
                defaultValue={payModalData.balance} 
                max={payModalData.balance} 
                min="1" 
                className="w-full px-3.5 py-2.5 bg-background border border-border/60 rounded-xl font-black text-base text-success focus:ring-2 focus:ring-success/50 outline-none tabular-nums" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  طريقة السداد <span className="text-danger">*</span>
                </label>
                <select 
                  name="method" 
                  required 
                  className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl font-bold text-xs focus:ring-2 focus:ring-success/50 outline-none"
                >
                  <option value="bank_transfer">تحويل بنكي مباشر</option>
                  <option value="cash">نقداً (كاش الصندوق / الخزينة)</option>
                  <option value="cheque">شيك مصرفي</option>
                  <option value="card">بطاقة مدى / ائتمان</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  الحساب البنكي المسحوب منه
                </label>
                <select 
                  name="bankAccountId" 
                  className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl font-bold text-xs focus:ring-2 focus:ring-success/50 outline-none"
                >
                  <option value="">حساب المدرسة الافتراضي</option>
                  {allBankAccounts.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} - {b.accountNumber.slice(-4)} ({(b.currentBalance ?? b.balance ?? 0).toLocaleString()} {currency})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                الرقم المرجعي للإيصال / التحويل
              </label>
              <input 
                type="text" 
                name="referenceNo" 
                placeholder={`TRF-${Math.floor(100000 + Math.random() * 900000)}`}
                className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs font-mono focus:ring-2 focus:ring-success/50 outline-none" 
              />
            </div>

            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 flex items-center gap-3">
              <input 
                type="checkbox" 
                id="recordExpense" 
                name="recordExpense" 
                defaultChecked 
                className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer" 
              />
              <label htmlFor="recordExpense" className="text-xs font-bold text-foreground cursor-pointer select-none">
                تسجيل هذا السداد تلقائياً كمصروف رسمي في الدفاتر المحاسبية
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1">
                ملاحظات السداد
              </label>
              <input 
                type="text" 
                name="notes" 
                placeholder="مثال: دفعة من فاتورة صيانة المكيفات لشهر مايو..." 
                className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs focus:ring-2 focus:ring-success/50 outline-none" 
              />
            </div>

            <div className="pt-3 flex gap-3 border-t border-border/40">
              <button 
                type="submit" 
                className="flex-1 btn-primary bg-success hover:bg-success/90 font-extrabold py-2.5 rounded-xl shadow-md text-xs"
              >
                تأكيد وسداد المستحقات
              </button>
              <button 
                type="button" 
                onClick={() => setPayModalData(null)} 
                className="flex-1 btn-secondary py-2.5 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </AdminModal>

      {/* ==================== VENDOR STATEMENT MODAL ==================== */}
      <AdminModal
        isOpen={!!statementVendor}
        onClose={() => setStatementVendor(null)}
        title="كشف حساب وسجل مدفوعات المورد"
        description={statementVendor ? `${statementVendor.name} - ${statementVendor.category}` : ""}
        icon={Receipt}
        tone="primary"
        maxWidth="2xl"
        footer={
          <div className="flex justify-end w-full">
            <button 
              type="button"
              onClick={() => setStatementVendor(null)} 
              className="btn-secondary px-6 py-2 rounded-xl text-xs font-bold"
            >
              إغلاق الكشف
            </button>
          </div>
        }
      >
        {statementVendor && (
          <div className="space-y-5">
            {/* Vendor Ledger Summary Banner */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-muted/40 rounded-2xl border border-border/60 text-center">
              <div>
                <p className="text-xs font-bold text-muted-foreground">الرصيد المتبقي (دائن)</p>
                <p className="text-lg font-black text-danger tabular-nums mt-0.5">
                  {(statementVendor.balance || 0).toLocaleString()} {currency}
                </p>
              </div>
              <div className="border-x border-border/60">
                <p className="text-xs font-bold text-muted-foreground">عدد الحركات المسجلة</p>
                <p className="text-lg font-black text-foreground tabular-nums mt-0.5">
                  {vendorExpenses.length} حركة
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">إجمالي المسدد المسجل</p>
                <p className="text-lg font-black text-success tabular-nums mt-0.5">
                  {vendorExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()} {currency}
                </p>
              </div>
            </div>

            {/* Transactions List */}
            <div>
              <h4 className="font-extrabold text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" /> سجل المصروفات والمدفوعات المرتبطة بالمورد
              </h4>
              {vendorExpenses.length > 0 ? (
                <div className="border border-border/60 rounded-xl overflow-hidden divide-y divide-border/40">
                  {vendorExpenses.map((exp: any) => (
                    <div key={exp.id} className="p-3 bg-card hover:bg-muted/30 transition-all flex items-center justify-between text-xs">
                      <div>
                        <div className="font-extrabold text-foreground">{exp.title}</div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                          <span>التاريخ: {exp.date}</span>
                          <span>المرجع: {exp.referenceNo || exp.id}</span>
                          <span>الطريقة: {exp.method === "cash" ? "نقداً" : "تحويل بنكي"}</span>
                        </div>
                      </div>
                      <div className="text-left font-black text-success tabular-nums text-sm">
                        {exp.amount.toLocaleString()} {currency}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/70">
                  لا توجد سندات صرف أو فواتير مؤرشفة لهذا المورد حتى الآن.
                </div>
              )}
            </div>
          </div>
        )}
      </AdminModal>

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      <AdminModal
        isOpen={!!deleteConfirmVendor}
        onClose={() => setDeleteConfirmVendor(null)}
        title="تأكيد حذف المورد"
        description="حذف المورد نهائياً من سجل الموردين والذمم الدائنة"
        icon={AlertTriangle}
        tone="danger"
        maxWidth="md"
      >
        {deleteConfirmVendor && (
          <div className="space-y-4">
            <p className="text-xs font-bold text-foreground">
              هل أنت متأكد من رغبتك في حذف المورد <span className="text-primary font-black">"{deleteConfirmVendor.name}"</span> نهائياً من سجل الموردين؟
            </p>

            {deleteConfirmVendor.balance > 0 && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs text-danger font-bold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  تنبيه مالي: يوجد رصيد مستحق للمورد قدره 
                  {" "}<span className="font-black underline">{deleteConfirmVendor.balance.toLocaleString()} {currency}</span>.
                  حذف المورد سيؤدي إلى إسقاط الالتزام الدائن من الشاشة.
                </div>
              </div>
            )}

            <div className="pt-3 flex gap-3">
              <button 
                type="button"
                onClick={handleDeleteVendor}
                className="flex-1 btn-primary bg-danger hover:bg-danger/90 font-extrabold py-2.5 rounded-xl shadow-md text-xs"
              >
                تأكيد الحذف النهائي
              </button>
              <button 
                type="button" 
                onClick={() => setDeleteConfirmVendor(null)}
                className="flex-1 btn-secondary py-2.5 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </AdminModal>

    </AppShell>
  );
}
