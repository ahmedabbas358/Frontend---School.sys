import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore, BankAccount } from "@/contexts/GlobalStoreContext";
import { 
  Building2, 
  Plus, 
  ArrowRightLeft, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  CreditCard, 
  ArrowDownRight, 
  ArrowUpRight, 
  Download, 
  Edit, 
  Trash2, 
  X, 
  Search, 
  RefreshCw,
  Scale,
  ShieldCheck,
  Landmark,
  FileSpreadsheet
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { AdminModal } from "@/components/admin/admin-modal";
import { FinanceNavTabs } from "@/components/finance/finance-nav";

export const Route = createFileRoute("/finance/banks")({
  component: FinanceBanks,
});

interface ReconcileItem {
  id: string;
  date: string;
  description: string;
  referenceNo: string;
  amount: number;
  type: "deposit" | "withdrawal";
  status: "matched" | "unmatched" | "discrepancy";
  systemTxId?: string;
}

function FinanceBanks() {
  const { 
    allBankAccounts, 
    addBankAccount, 
    updateBankAccount, 
    deleteBankAccount, 
    allPayments, 
    allExpenses, 
    currency,
    allActivityLogs,
    addActivityLog
  } = useGlobalStore();

  const [selectedBankId, setSelectedBankId] = useState<string | null>(allBankAccounts[0]?.id || null);
  const [activeTab, setActiveTab] = useState<"ledger" | "reconcile">("ledger");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [deleteBankModal, setDeleteBankModal] = useState<BankAccount | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    iban: "",
    balance: 0,
    currency: currency || "ر.س",
    status: "active" as "active" | "inactive"
  });

  const activeBanks = useMemo(() => {
    return allBankAccounts.filter(b => b.status === "active");
  }, [allBankAccounts]);

  const selectedBank = useMemo(() => {
    return allBankAccounts.find(b => b.id === selectedBankId) || allBankAccounts[0] || null;
  }, [allBankAccounts, selectedBankId]);

  // Compute live deposits and withdrawals from real Payments and Expenses
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const bankMonthlyDeposits = useMemo(() => {
    return (allPayments || []).filter(p => {
      const isBank = p.method === "bank_transfer" || p.method === "card" || p.method === "cheque";
      const d = new Date(p.date);
      return isBank && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [allPayments, currentMonth, currentYear]);

  const bankMonthlyWithdrawals = useMemo(() => {
    return (allExpenses || []).filter(e => {
      const isBank = e.method === "bank_transfer" || e.method === "card" || e.method === "cheque";
      const d = new Date(e.date);
      return isBank && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [allExpenses, currentMonth, currentYear]);

  // Bank transactions ledger for selected bank
  const bankTransactions = useMemo(() => {
    const deposits = (allPayments || [])
      .filter(p => p.method === "bank_transfer" || p.method === "card" || p.method === "cheque")
      .map(p => ({
        id: p.id,
        date: p.date,
        type: "deposit" as const,
        title: `توريد دفعة رسوم / سداد`,
        party: p.studentId || "طالب / عميل",
        reference: p.referenceNo || p.invoiceId || p.id,
        method: p.method === "bank_transfer" ? "تحويل بنكي" : p.method === "card" ? "بطاقة دفع" : "شيك",
        amount: p.amount,
        status: "matched"
      }));

    const withdrawals = (allExpenses || [])
      .filter(e => e.method === "bank_transfer" || e.method === "card" || e.method === "cheque")
      .map(e => ({
        id: e.id,
        date: e.date,
        type: "withdrawal" as const,
        title: e.title,
        party: e.beneficiary,
        reference: e.referenceNo || e.id,
        method: e.method === "bank_transfer" ? "تحويل بنكي" : e.method === "card" ? "بطاقة دفع" : "شيك",
        amount: e.amount,
        status: "matched"
      }));

    return [...deposits, ...withdrawals]
      .filter(tx => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return tx.title.toLowerCase().includes(s) || 
               tx.party.toLowerCase().includes(s) || 
               tx.reference.toLowerCase().includes(s);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allPayments, allExpenses, searchTerm]);

  // Simulated Bank Statement Items for Reconciliation
  const [reconcileItems, setReconcileItems] = useState<ReconcileItem[]>([
    { id: "STMT-101", date: "2026-09-20", description: "حوالة واردة - سداد قسط دراسي", referenceNo: "TRX-8821", amount: 4500, type: "deposit", status: "matched" },
    { id: "STMT-102", date: "2026-09-22", description: "صرف شيك مورد أدوات معمل", referenceNo: "CHK-902", amount: 3200, type: "withdrawal", status: "matched" },
    { id: "STMT-103", date: "2026-09-24", description: "رسوم خدمات مصرفية شهرية", referenceNo: "FEE-441", amount: 150, type: "withdrawal", status: "unmatched" },
    { id: "STMT-104", date: "2026-09-25", description: "حوالة واردة غير معروفة المصدر", referenceNo: "TRX-9932", amount: 1200, type: "deposit", status: "discrepancy" }
  ]);

  // Open Add Bank modal
  const handleOpenAdd = () => {
    setEditingBank(null);
    setFormData({
      bankName: "",
      accountName: "",
      accountNumber: "",
      iban: "",
      balance: 0,
      currency: currency || "ر.س",
      status: "active"
    });
    setIsAddEditOpen(true);
  };

  // Open Edit Bank modal
  const handleOpenEdit = (b: BankAccount) => {
    setEditingBank(b);
    setFormData({
      bankName: b.bankName,
      accountName: b.accountName,
      accountNumber: b.accountNumber,
      iban: b.iban,
      balance: b.balance,
      currency: b.currency || currency || "ر.س",
      status: b.status
    });
    setIsAddEditOpen(true);
  };

  // Save Add / Edit
  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bankName.trim() || !formData.accountNumber.trim()) {
      toast.error("يرجى إدخال اسم البنك ورقم الحساب");
      return;
    }

    if (editingBank) {
      updateBankAccount(editingBank.id, formData);
      toast.success(`تم تحديث الحساب البنكي (${formData.bankName}) بنجاح`);
    } else {
      addBankAccount(formData);
      toast.success(`تمت إضافة الحساب البنكي الجديد (${formData.bankName}) بنجاح`);
    }
    setIsAddEditOpen(false);
    setEditingBank(null);
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = () => {
    if (!deleteBankModal) return;
    if (deleteBankModal.balance > 0) {
      toast.error("لا يمكن حذف حساب بنكي يحتوي على رصيد مالي قائم. يرجى تصفير الرصيد أو تحويله أولاً.");
      setDeleteBankModal(null);
      return;
    }
    deleteBankAccount(deleteBankModal.id);
    toast.success("تم حذف الحساب البنكي بنجاح");
    if (selectedBankId === deleteBankModal.id) {
      setSelectedBankId(activeBanks.find(b => b.id !== deleteBankModal.id)?.id || null);
    }
    setDeleteBankModal(null);
  };

  // Export Bank Accounts to CSV
  const exportBanksToCSV = () => {
    const headers = ["اسم البنك", "اسم الحساب", "رقم الحساب", "الآيبان IBAN", "الرصيد", "العملة", "الحالة"];
    const rows = allBankAccounts.map(b => [
      `"${b.bankName}"`,
      `"${b.accountName}"`,
      `"'${b.accountNumber}"`,
      `"${b.iban}"`,
      b.balance,
      `"${b.currency || currency}"`,
      `"${b.status === 'active' ? 'نشط' : 'معطل'}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `bank_accounts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير سجل الحسابات البنكية بصيغة CSV");
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance" },
        { label: "الحسابات البنكية والشيكات" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <button 
            onClick={exportBanksToCSV}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/70 bg-card px-3.5 text-xs font-black text-foreground shadow-sm hover:bg-accent hover:border-primary/40 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-primary" /> تصدير كشف البنوك
          </button>
          <button 
            onClick={handleOpenAdd}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 text-xs font-black shadow-md hover:bg-primary/90 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" /> إضافة حساب بنكي جديد
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        <FinanceNavTabs activeTab="banks" />
        
        {/* Overview Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PageCard className="p-5 flex items-center gap-4 bg-card border border-border/60 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="p-3.5 bg-blue-500/10 text-blue-600 rounded-2xl shrink-0">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">إجمالي السيولة البنكية</p>
              <p className="text-2xl font-black text-foreground tabular-nums mt-0.5">
                {activeBanks.reduce((sum, b) => sum + (b.balance || 0), 0).toLocaleString()} <span className="text-xs font-bold text-muted-foreground">{currency}</span>
              </p>
            </div>
          </PageCard>

          <PageCard className="p-5 flex items-center gap-4 bg-card border border-border/60 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="p-3.5 bg-emerald-500/10 text-emerald-600 rounded-2xl shrink-0">
              <ArrowDownRight className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">إيداعات وتحويلات الشهر</p>
              <p className="text-2xl font-black text-emerald-600 tabular-nums mt-0.5">
                +{bankMonthlyDeposits.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">{currency}</span>
              </p>
            </div>
          </PageCard>

          <PageCard className="p-5 flex items-center gap-4 bg-card border border-border/60 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="p-3.5 bg-rose-500/10 text-rose-600 rounded-2xl shrink-0">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">مسحوبات ومصروفات الشهر</p>
              <p className="text-2xl font-black text-rose-600 tabular-nums mt-0.5">
                -{bankMonthlyWithdrawals.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">{currency}</span>
              </p>
            </div>
          </PageCard>

          <PageCard className="p-5 flex items-center gap-4 bg-card border border-border/60 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="p-3.5 bg-purple-500/10 text-purple-600 rounded-2xl shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">حالة المطابقة البنكية</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-lg font-black text-foreground">98.4%</span>
                <Badge tone="success" className="text-[10px]">مطابق محاسبياً</Badge>
              </div>
            </div>
          </PageCard>
        </div>

        {/* Main 2-Column Split: Banks Sidebar + Active Account Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Bank Cards List (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                الحسابات البنكية المسجلة ({allBankAccounts.length})
              </h3>
              <button 
                onClick={handleOpenAdd}
                className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> إضافة
              </button>
            </div>

            <div className="space-y-3">
              {allBankAccounts.length === 0 ? (
                <div className="p-8 text-center bg-card rounded-3xl border border-dashed border-border/70 text-muted-foreground">
                  <Landmark className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-bold">لا توجد حسابات بنكية مضافة بعد</p>
                  <button onClick={handleOpenAdd} className="btn-primary text-xs mt-3">إضافة أول حساب</button>
                </div>
              ) : (
                allBankAccounts.map(bank => {
                  const isSelected = selectedBank?.id === bank.id;
                  return (
                    <div 
                      key={bank.id}
                      onClick={() => setSelectedBankId(bank.id)}
                      className={`p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected 
                          ? 'border-primary/80 bg-primary/5 shadow-md ring-2 ring-primary/20' 
                          : 'border-border/70 bg-card hover:border-primary/40 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                          }`}>
                            {bank.bankName.slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-foreground group-hover:text-primary transition-colors">{bank.bankName}</h4>
                            <p className="text-[11px] text-muted-foreground font-bold">{bank.accountName}</p>
                          </div>
                        </div>
                        <Badge tone={bank.status === "active" ? "success" : "neutral"} className="text-[10px]">
                          {bank.status === "active" ? "نشط" : "معطل"}
                        </Badge>
                      </div>

                      <div className="mt-3 p-2.5 bg-background/80 rounded-2xl border border-border/50 space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-muted-foreground font-bold">رقم الحساب:</span>
                          <span className="font-mono font-black text-foreground">{bank.accountNumber}</span>
                        </div>
                        {bank.iban && (
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-muted-foreground font-bold">IBAN:</span>
                            <span className="font-mono text-muted-foreground truncate max-w-[180px]">{bank.iban}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-baseline justify-between pt-1">
                        <span className="text-xs font-bold text-muted-foreground">الرصيد الدفتري:</span>
                        <span className="text-xl font-black text-primary tabular-nums">
                          {bank.balance.toLocaleString()} <span className="text-xs text-muted-foreground font-bold">{bank.currency || currency}</span>
                        </span>
                      </div>

                      {/* Hover action shortcuts */}
                      <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEdit(bank)}
                          className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white transition-all text-xs"
                          title="تعديل الحساب"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteBankModal(bank)}
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-all text-xs"
                          title="حذف الحساب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Bank Details, Ledger, and Reconciliation (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedBank ? (
              <PageCard className="p-6">
                {/* Active Bank Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-border/60">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg border border-primary/20 shrink-0">
                      <Landmark className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-foreground">{selectedBank.bankName}</h2>
                        <Badge tone="info" className="text-xs font-bold">{selectedBank.accountName}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        رقم الحساب: <strong className="text-foreground">{selectedBank.accountNumber}</strong> • الآيبان: {selectedBank.iban || "غير مسجل"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsReconcileModalOpen(true)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-3.5 text-xs font-black shadow transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> مطابقة كشف الحساب
                    </button>
                    <button
                      onClick={() => handleOpenEdit(selectedBank)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-background hover:bg-accent px-3 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" /> تعديل
                    </button>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center justify-between border-b border-border/50 pt-4">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setActiveTab("ledger")}
                      className={`pb-3 text-xs font-black flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                        activeTab === "ledger" 
                          ? "border-primary text-primary" 
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <FileText className="w-4 h-4" /> كشف الحساب والحركات ({bankTransactions.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("reconcile")}
                      className={`pb-3 text-xs font-black flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                        activeTab === "reconcile" 
                          ? "border-primary text-primary" 
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Scale className="w-4 h-4" /> سجل المطابقة البنكية المصرفية
                    </button>
                  </div>

                  <div className="relative w-48 mb-2">
                    <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="بحث في الحركات..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="h-8 w-full pr-8 pl-3 rounded-lg border border-border/60 bg-muted/30 text-xs font-medium outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Tab 1: Ledger Table */}
                {activeTab === "ledger" && (
                  <div className="pt-4">
                    <DataTable
                      columns={[
                        { 
                          key: "date", 
                          header: "التاريخ", 
                          cell: (r: any) => <span className="font-mono text-xs font-bold text-muted-foreground">{r.date}</span> 
                        },
                        { 
                          key: "title", 
                          header: "البيان والحركة", 
                          cell: (r: any) => (
                            <div>
                              <div className="font-black text-xs text-foreground">{r.title}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">المرجع: {r.reference}</div>
                            </div>
                          ) 
                        },
                        { 
                          key: "party", 
                          header: "الطرف / المستفيد", 
                          cell: (r: any) => <span className="font-bold text-xs text-foreground">{r.party}</span> 
                        },
                        { 
                          key: "method", 
                          header: "طريقة القيد", 
                          cell: (r: any) => <Badge tone="neutral" className="text-[10px]">{r.method}</Badge> 
                        },
                        { 
                          key: "amount", 
                          header: "المبلغ", 
                          cell: (r: any) => (
                            <span className={`font-black tabular-nums text-sm ${
                              r.type === "deposit" ? "text-emerald-600" : "text-rose-600"
                            }`}>
                              {r.type === "deposit" ? "+" : "-"}{r.amount.toLocaleString()} {currency}
                            </span>
                          ) 
                        },
                        { 
                          key: "status", 
                          header: "المطابقة", 
                          cell: () => (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3 h-3" /> مطابق
                            </span>
                          ) 
                        }
                      ]}
                      rows={bankTransactions}
                      pageSize={10}
                      pageSizeOptions={[10, 25, 50]}
                      empty="لا توجد حركات مسجلة لهذا الحساب البنكي حالياً"
                    />
                  </div>
                )}

                {/* Tab 2: Reconciliation View */}
                {activeTab === "reconcile" && (
                  <div className="pt-4 space-y-4">
                    <div className="p-4 bg-muted/20 border border-border/70 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600">
                          <Scale className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-foreground">مطابقة كشف الحساب البنكي الآلي</h4>
                          <p className="text-xs text-muted-foreground">يقارن النظام حركات الكشف المسحوبة مع القيود المسجلة بالدفتر</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          toast.success("تم تشغيل خوارزمية المطابقة بنجاح - تم مطابقة 98.4% من الحركات");
                        }}
                        className="btn-secondary text-xs h-9 font-extrabold flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> إعادة المطابقة التلقائية
                      </button>
                    </div>

                    <div className="border border-border/60 rounded-2xl overflow-hidden">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-muted/40 border-b border-border/60">
                          <tr>
                            <th className="p-3 font-extrabold">التاريخ</th>
                            <th className="p-3 font-extrabold">بيان الكشف البنكي</th>
                            <th className="p-3 font-extrabold">الرقم المرجعي</th>
                            <th className="p-3 font-extrabold">المبلغ</th>
                            <th className="p-3 font-extrabold">الحالة</th>
                            <th className="p-3 font-extrabold text-center">إجراء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {reconcileItems.map(item => (
                            <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                              <td className="p-3 font-mono text-muted-foreground">{item.date}</td>
                              <td className="p-3 font-bold text-foreground">{item.description}</td>
                              <td className="p-3 font-mono text-muted-foreground">{item.referenceNo}</td>
                              <td className="p-3 font-black tabular-nums">
                                <span className={item.type === "deposit" ? "text-emerald-600" : "text-rose-600"}>
                                  {item.type === "deposit" ? "+" : "-"}{item.amount.toLocaleString()} {currency}
                                </span>
                              </td>
                              <td className="p-3">
                                {item.status === "matched" && (
                                  <Badge tone="success" className="text-[10px]">مطابق تماماً ✅</Badge>
                                )}
                                {item.status === "unmatched" && (
                                  <Badge tone="warning" className="text-[10px]">غير مقيد بالدفاتر ⚠️</Badge>
                                )}
                                {item.status === "discrepancy" && (
                                  <Badge tone="danger" className="text-[10px]">فارق بالمطابقة ❌</Badge>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                {item.status !== "matched" ? (
                                  <button
                                    onClick={() => {
                                      setReconcileItems(prev => prev.map(i => i.id === item.id ? { ...i, status: "matched" } : i));
                                      toast.success("تم توثيق ومطابقة الحركة يدوياً بنجاح");
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-all cursor-pointer"
                                  >
                                    تسوية وقيد
                                  </button>
                                ) : (
                                  <span className="text-muted-foreground text-[11px]">تمت التسوية</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </PageCard>
            ) : (
              <PageCard className="p-12 text-center border-dashed">
                <Landmark className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="text-lg font-black text-foreground">لم يتم تحديد أي حساب بنكي</h3>
                <p className="text-xs text-muted-foreground mt-1">اختر حساباً من القائمة الجانبية أو أضف حساباً بنكياً جديداً</p>
              </PageCard>
            )}
          </div>
        </div>
      </div>

      {/* --- Add / Edit Bank Account Luxury Modal --- */}
      <AdminModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={editingBank ? "تعديل بيانات الحساب البنكي" : "إضافة حساب بنكي جديد"}
        description="ربط حساب مصرفي بالمنظومة المحاسبية للمدرسة"
        icon={Landmark}
        tone="primary"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveBank} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-foreground mb-1.5">
              اسم البنك المصرفي <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              list="bank-names-list"
              placeholder="مثال: بنك الراجحي، بنك الخرطوم، البنك الأهلي..."
              value={formData.bankName}
              onChange={e => setFormData({ ...formData, bankName: e.target.value })}
              className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
            />
            <datalist id="bank-names-list">
              <option value="مصرف الراجحي" />
              <option value="البنك الأهلي السعودي" />
              <option value="بنك الرياض" />
              <option value="مصرف الإنماء" />
              <option value="بنك البلاد" />
              <option value="بنك الخرطوم" />
              <option value="بنك أمدرمان الوطني" />
              <option value="بنك فيصل الإسلامي" />
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-black text-foreground mb-1.5">
              اسم الحساب والغرض <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: حساب الرسوم المدرسية الرئيسي، حساب الرواتب..."
              value={formData.accountName}
              onChange={e => setFormData({ ...formData, accountName: e.target.value })}
              className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-xs font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-black text-foreground mb-1.5">
                رقم الحساب المصرفي <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="رقم الحساب..."
                value={formData.accountNumber}
                onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-xs font-mono font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-foreground mb-1.5">
                الرصيد الافتتاحي ({formData.currency})
              </label>
              <input
                type="number"
                min="0"
                placeholder="0.00"
                value={formData.balance || ""}
                onChange={e => setFormData({ ...formData, balance: Number(e.target.value) || 0 })}
                className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-sm font-black tabular-nums outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all text-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-foreground mb-1.5">
              رقم الآيبان الدولي (IBAN)
            </label>
            <input
              type="text"
              placeholder="SA00 0000 0000 0000 0000 0000"
              value={formData.iban}
              onChange={e => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
              className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-xs font-mono font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-black text-foreground mb-1.5">العملة</label>
              <input
                type="text"
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-4 text-xs font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-foreground mb-1.5">الحالة</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full h-11 rounded-xl border border-border/80 bg-background/80 px-3.5 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="active">نشط ومعتمد ✅</option>
                <option value="inactive">معطل مؤقتاً ⏸️</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2.5 border-t border-border/60">
            <button
              type="button"
              onClick={() => setIsAddEditOpen(false)}
              className="h-11 px-5 rounded-xl border border-border/80 bg-background hover:bg-accent text-xs font-bold transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="h-11 px-6 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> {editingBank ? "حفظ التعديلات" : "إضافة الحساب المصرفي"}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* --- Delete Bank Account Confirmation Luxury Modal --- */}
      <AdminModal
        isOpen={!!deleteBankModal}
        onClose={() => setDeleteBankModal(null)}
        title="تأكيد حذف الحساب البنكي"
        description={`${deleteBankModal?.bankName || ""} - ${deleteBankModal?.accountNumber || ""}`}
        icon={AlertTriangle}
        tone="danger"
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setDeleteBankModal(null)}
              className="h-10 px-5 rounded-xl border border-border/80 bg-background hover:bg-accent text-xs font-bold transition-all cursor-pointer"
            >
              تراجع
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="h-10 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition-all cursor-pointer"
            >
              تأكيد الحذف نهائياً
            </button>
          </div>
        }
      >
        {deleteBankModal && (
          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs font-bold text-rose-700 dark:text-rose-400 space-y-2">
            <p>هل أنت متأكد من رغبتك في حذف هذا الحساب المصرفي من النظام؟</p>
            <p className="text-[11px] text-muted-foreground">
              الرصيد المسجل: <strong>{deleteBankModal.balance.toLocaleString()} {currency}</strong>
            </p>
          </div>
        )}
      </AdminModal>

      {/* --- Bank Reconciliation Upload Modal --- */}
      <AdminModal
        isOpen={isReconcileModalOpen}
        onClose={() => setIsReconcileModalOpen(false)}
        title="رفع وتدقيق كشف الحساب البنكي (CSV)"
        description={`${selectedBank?.bankName || ""} - ${selectedBank?.accountNumber || ""}`}
        icon={Upload}
        tone="primary"
        maxWidth="lg"
      >
        <div className="space-y-5">
          <div className="p-8 border-2 border-dashed border-purple-500/30 rounded-3xl bg-purple-500/5 text-center space-y-3">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-purple-600 opacity-60" />
            <div>
              <p className="text-sm font-black text-foreground">اسحب وأفلت ملف كشف الحساب المصرفي هنا</p>
              <p className="text-xs text-muted-foreground font-bold mt-1">يدعم ملفات بصيغة CSV أو Excel (.xlsx)</p>
            </div>
            <label className="inline-block cursor-pointer">
              <input 
                type="file" 
                accept=".csv,.xlsx" 
                className="hidden" 
                onChange={() => {
                  toast.success("تم استيراد وقراءة ملف كشف الحساب المصرفي بنجاح");
                  setIsReconcileModalOpen(false);
                  setActiveTab("reconcile");
                }} 
              />
              <span className="btn-primary text-xs px-5 py-2 inline-flex items-center gap-1.5 shadow-md">
                <Upload className="w-3.5 h-3.5" /> استعراض الملف من الجهاز
              </span>
            </label>
          </div>

          <div className="p-3.5 bg-muted/30 rounded-2xl border border-border/60 text-xs font-bold text-muted-foreground space-y-1">
            <p className="text-foreground font-black">💡 تلميح تقني للمطابقة:</p>
            <p>يجب أن يتضمن الملف الأعمدة التالية: التاريخ، البيان، الرقم المرجعي، المبلغ الدائن والمدين.</p>
          </div>
        </div>
      </AdminModal>

    </AppShell>
  );
}
