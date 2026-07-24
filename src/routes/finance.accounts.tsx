import { createFileRoute } from '@tanstack/react-router';
import { useGlobalStore, Account, JournalEntry, JournalLine } from '../contexts/GlobalStoreContext';
import { useState, useMemo } from 'react';
import { AppShell, PageCard, Badge } from '@/components/app-shell';
import { 
  FolderTree, Search, Plus, Edit, Trash2, Power, Eye, 
  Building2, Briefcase, Star, CheckCircle2, Clock, 
  Scale, Wallet, TrendingUp, TrendingDown, Sparkles, Printer, Download, Filter, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { FinancialCard, FilterBar } from '@/components/financial-components';
import { DataTable } from '@/components/data-table';
import { AdvancedPrintEngine, PrintTemplate } from '@/components/print-engine';

export const Route = createFileRoute('/finance/accounts')({
  component: FinanceAccounts,
});

function FinanceAccounts() {
  const { 
    allAccounts, addAccount, updateAccount, deleteAccount, toggleAccountStatus, 
    allJournalEntries, allJournalLines, currency, currentAcademicYearId 
  } = useGlobalStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'revenue' | 'expense' | 'asset' | 'liability' | 'equity'>('all');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [statementAccount, setStatementAccount] = useState<Account | null>(null);

  // Form State for Add / Edit Account
  const [formData, setFormData] = useState({ 
    name: '', 
    type: 'expense' as Account['type'], 
    code: '', 
    description: '',
    normalBalance: 'debit' as 'debit' | 'credit'
  });

  const getTypeName = (type: string) => {
    switch (type) {
      case 'asset': return 'الأصول (Assets)';
      case 'liability': return 'الخصوم (Liabilities)';
      case 'equity': return 'حقوق الملكية (Equity)';
      case 'revenue': return 'الإيرادات (Revenues)';
      case 'expense': return 'المصروفات (Expenses)';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'asset': return <Building2 className="w-5 h-5 text-blue-500" />;
      case 'liability': return <Briefcase className="w-5 h-5 text-red-500" />;
      case 'equity': return <Star className="w-5 h-5 text-purple-500" />;
      case 'revenue': return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      case 'expense': return <TrendingDown className="w-5 h-5 text-amber-500" />;
      default: return <FolderTree className="w-5 h-5" />;
    }
  };

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return allAccounts.filter(acc => {
      const matchSearch = acc.name.includes(searchTerm) || acc.code.includes(searchTerm) || (acc.description || '').includes(searchTerm);
      const matchTab = activeTab === 'all' || acc.type === activeTab;
      return matchSearch && matchTab;
    });
  }, [allAccounts, searchTerm, activeTab]);

  // Statistics
  const stats = useMemo(() => {
    const total = allAccounts.length;
    const systemCount = allAccounts.filter(a => a.isSystemAccount).length;
    const customCount = total - systemCount;
    const activeCount = allAccounts.filter(a => a.isActive !== false).length;
    
    const revenues = allAccounts.filter(a => a.type === 'revenue').length;
    const expenses = allAccounts.filter(a => a.type === 'expense').length;
    const assets = allAccounts.filter(a => a.type === 'asset').length;
    const liabilities = allAccounts.filter(a => a.type === 'liability').length;

    return { total, systemCount, customCount, activeCount, revenues, expenses, assets, liabilities };
  }, [allAccounts]);

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("يرجى إدخال اسم الحساب");
      return;
    }

    if (editingAccount) {
      updateAccount(editingAccount.id, formData);
      toast.success(`تم تحديث بيانات الحساب (${formData.name}) بنجاح`);
    } else {
      const generatedCode = formData.code.trim() || `${formData.type === 'asset' ? '1' : formData.type === 'liability' ? '2' : formData.type === 'equity' ? '3' : formData.type === 'revenue' ? '4' : '5'}${Math.floor(10 + Math.random() * 90)}`;
      addAccount({
        ...formData,
        code: generatedCode,
        isSystemAccount: false,
        isActive: true
      });
      toast.success(`تمت إضافة الحساب الفرعي الجديد (${formData.name}) بنجاح`);
    }
    setIsAddOpen(false);
    setEditingAccount(null);
  };

  const handleDelete = (acc: Account) => {
    if (acc.isSystemAccount) {
      toast.error("لا يمكن حذف حسابات النظام الأساسية المعتمدة");
      return;
    }
    if (window.confirm(`هل أنت متأكد من حذف الحساب الفرعي (${acc.name}) نهائياً؟`)) {
      deleteAccount(acc.id);
      toast.success("تم حذف الحساب بنجاح");
    }
  };

  const openEdit = (acc: Account) => {
    setEditingAccount(acc);
    setFormData({ 
      name: acc.name, 
      type: acc.type, 
      code: acc.code, 
      description: acc.description || '',
      normalBalance: acc.normalBalance || (acc.type === 'asset' || acc.type === 'expense' ? 'debit' : 'credit')
    });
    setIsAddOpen(true);
  };

  const openAdd = () => {
    setEditingAccount(null);
    setFormData({ name: '', type: 'expense', code: '', description: '', normalBalance: 'debit' });
    setIsAddOpen(true);
  };

  const openStatement = (acc: Account) => {
    setStatementAccount(acc);
    setIsStatementOpen(true);
  };

  // Statement Calculation for Selected Account
  const statementLines = useMemo(() => {
    if (!statementAccount) return [];
    
    const validEntryIds = new Set(
      allJournalEntries
        .filter(e => e.academicYearId === currentAcademicYearId && e.status === 'posted')
        .map(e => e.id)
    );

    const lines = allJournalLines.filter(l => validEntryIds.has(l.journalEntryId) && l.accountId === statementAccount.id);
    
    return lines.map(l => {
      const entry = allJournalEntries.find(e => e.id === l.journalEntryId);
      return {
        ...l,
        date: entry?.date || '',
        description: l.description || entry?.description || '',
        entryRef: entry?.referenceId || '',
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [statementAccount, allJournalEntries, allJournalLines, currentAcademicYearId]);

  const stmtTotalDebit = statementLines.reduce((sum, l) => sum + l.debit, 0);
  const stmtTotalCredit = statementLines.reduce((sum, l) => sum + l.credit, 0);
  
  let stmtBalance = stmtTotalDebit - stmtTotalCredit;
  if (statementAccount?.type === 'liability' || statementAccount?.type === 'equity' || statementAccount?.type === 'revenue' || statementAccount?.normalBalance === 'credit') {
    stmtBalance = stmtTotalCredit - stmtTotalDebit;
  }

  const printTemplates: PrintTemplate[] = [
    {
      id: "chart-of-accounts",
      name: "الدليل المحاسبي الشامل",
      category: "التقارير المحاسبية",
      type: "table",
      columns: [
        { label: "رمز الحساب", key: "code" },
        { label: "اسم الحساب", key: "name" },
        { label: "نوع الحساب", key: "typeName" },
        { label: "الوصف والبيان", key: "description" },
        { label: "الحالة", key: "statusLabel" },
      ]
    }
  ];

  const printData = filteredAccounts.map(acc => ({
    ...acc,
    typeName: getTypeName(acc.type),
    statusLabel: acc.isActive !== false ? 'نشط' : 'موقوف'
  }));

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المركز المالي", to: "/finance/dashboard" },
        { label: "الدليل المحاسبي الشامل" },
      ]}
      actions={
        <div className="flex gap-2">
          <button onClick={() => setIsPrintOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-bold hover:bg-accent shadow-sm">
            <Printer className="h-4 w-4" /> طباعة شجرة الحسابات
          </button>
          <button 
            onClick={openAdd}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-extrabold text-primary-foreground hover:bg-primary/90 shadow-md transition-all"
          >
            <Plus className="h-4 w-4" /> إضافة حساب فرعي جديد
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
        
        {/* Header Banner */}
        <div className="bg-card p-6 rounded-3xl border border-border/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 bg-primary/10 text-primary rounded-2xl border border-primary/20">
              <FolderTree className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
                الدليل المحاسبي الشامل (Chart of Accounts)
              </h1>
              <p className="text-xs text-muted-foreground font-bold mt-1">
                الإدارة والتحكم اليدوي الكامل في هيكل شجرة الحسابات المالية الموحدة للمدرسة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold bg-muted/40 p-2 rounded-2xl border border-border/50">
            <Badge tone="info" className="font-black text-xs px-3 py-1">
              شجرة الحسابات متزنة 100%
            </Badge>
            <span className="text-muted-foreground font-bold px-2">{stats.activeCount} حساب نشط</span>
          </div>
        </div>

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FinancialCard title="إجمالي الحسابات" value={stats.total} currency="حساب" icon={FolderTree} colorClass="text-primary bg-primary" />
          <FinancialCard title="حسابات الإيرادات" value={stats.revenues} currency="حساب" icon={TrendingUp} colorClass="text-emerald-600 bg-emerald-500" />
          <FinancialCard title="حسابات المصروفات" value={stats.expenses} currency="حساب" icon={TrendingDown} colorClass="text-amber-600 bg-amber-500" />
          <FinancialCard title="الأصول والخصوم" value={stats.assets + stats.liabilities} currency="حساب" icon={Building2} colorClass="text-blue-600 bg-blue-500" />
        </div>

        {/* Filter Bar & Tabs */}
        <PageCard>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-4">
              
              {/* Type Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                    activeTab === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-accent'
                  }`}
                >
                  جميع الحسابات ({stats.total})
                </button>
                <button
                  onClick={() => setActiveTab('revenue')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                    activeTab === 'revenue' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-accent'
                  }`}
                >
                  الإيرادات ({stats.revenues})
                </button>
                <button
                  onClick={() => setActiveTab('expense')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                    activeTab === 'expense' ? 'bg-amber-600 text-white shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-accent'
                  }`}
                >
                  المصروفات ({stats.expenses})
                </button>
                <button
                  onClick={() => setActiveTab('asset')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                    activeTab === 'asset' ? 'bg-blue-600 text-white shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-accent'
                  }`}
                >
                  الأصول ({stats.assets})
                </button>
                <button
                  onClick={() => setActiveTab('liability')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                    activeTab === 'liability' ? 'bg-rose-600 text-white shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-accent'
                  }`}
                >
                  الخصوم ({stats.liabilities})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث بالرمز أو اسم الحساب..."
                  className="w-full pl-3 pr-10 py-2 bg-background border border-border/60 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
            </div>

            {/* Accounts Table */}
            <DataTable
              rows={filteredAccounts}
              columns={[
                {
                  key: "code",
                  header: "رمز الحساب",
                  cell: (r: Account) => (
                    <span className="font-mono font-black text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                      {r.code}
                    </span>
                  )
                },
                {
                  key: "name",
                  header: "اسم الحساب والتصنيف",
                  cell: (r: Account) => (
                    <div>
                      <div className="font-black text-sm text-foreground flex items-center gap-2">
                        {r.name}
                        {r.isSystemAccount && (
                          <Badge tone="info" className="text-[10px] px-2 py-0.5">نظام رئيسي 🔒</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-bold mt-0.5 flex items-center gap-1.5">
                        {getTypeIcon(r.type)}
                        <span>{getTypeName(r.type)}</span>
                        {r.description && <span className="opacity-75">• {r.description}</span>}
                      </div>
                    </div>
                  )
                },
                {
                  key: "normalBalance",
                  header: "طبيعة الحساب",
                  cell: (r: Account) => (
                    <Badge tone={r.type === 'asset' || r.type === 'expense' ? 'warning' : 'success'} className="text-xs font-bold">
                      {r.type === 'asset' || r.type === 'expense' ? 'مدين (Debit)' : 'دائن (Credit)'}
                    </Badge>
                  )
                },
                {
                  key: "isActive",
                  header: "الحالة",
                  cell: (r: Account) => (
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${r.isActive !== false ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {r.isActive !== false ? 'نشط' : 'موقوف'}
                    </span>
                  )
                },
                {
                  key: "actions",
                  header: "التحكم والإجراءات",
                  cell: (r: Account) => (
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openStatement(r)}
                        className="px-2.5 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-extrabold transition-all flex items-center gap-1"
                        title="كشف حساب تفصيلي بالدفتر العام"
                      >
                        <Eye className="w-3.5 h-3.5" /> كشف الحساب
                      </button>

                      <button
                        onClick={() => openEdit(r)}
                        disabled={r.isSystemAccount}
                        className="p-1.5 bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white disabled:opacity-30 rounded-lg transition-all"
                        title="تعديل الحساب"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleAccountStatus(r.id)}
                        disabled={r.isSystemAccount}
                        className="p-1.5 bg-slate-500/10 text-slate-600 hover:bg-slate-500 hover:text-white disabled:opacity-30 rounded-lg transition-all"
                        title="تغيير حالة التفعيل"
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      {!r.isSystemAccount && (
                        <button
                          onClick={() => handleDelete(r)}
                          className="p-1.5 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-lg transition-all"
                          title="حذف الحساب نهائياً"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )
                }
              ]}
              pageSize={15}
              pageSizeOptions={[10, 15, 25, 50]}
              empty="لا توجد حسابات مطابقة للبحث الحالية"
            />
          </div>
        </PageCard>
      </div>

      {/* Add / Edit Account Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-primary/10">
              <h3 className="font-black text-lg text-primary flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-primary" />
                {editingAccount ? 'تعديل بيانات الحساب المحاسبي' : 'إضافة حساب فرعي جديد للشجرة'}
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-1.5 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-muted-foreground mb-1.5">اختر نوع التصنيف الرئيسي <span className="text-danger">*</span></label>
                <select 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value as any})}
                  className="w-full h-11 bg-background border-2 border-border/60 rounded-xl px-4 font-extrabold text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                  disabled={!!editingAccount?.isSystemAccount}
                >
                  <option value="revenue">💰 الإيرادات (Revenues)</option>
                  <option value="expense">💸 المصروفات والأجور (Expenses)</option>
                  <option value="asset">🏢 الأصول والموجودات (Assets)</option>
                  <option value="liability">⚖️ الخصوم والموردين (Liabilities)</option>
                  <option value="equity">⭐️ حقوق الملكية (Equity)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-muted-foreground mb-1.5">رمز الحساب (Account Code)</label>
                  <input 
                    type="text" 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    className="w-full h-11 bg-background border border-border/60 rounded-xl px-4 font-mono font-bold text-sm focus:border-primary outline-none"
                    placeholder="مثال: 5015"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-muted-foreground mb-1.5">طبيعة الحساب (Normal Balance)</label>
                  <select
                    value={formData.normalBalance}
                    onChange={e => setFormData({...formData, normalBalance: e.target.value as any})}
                    className="w-full h-11 bg-background border border-border/60 rounded-xl px-4 font-bold text-sm outline-none cursor-pointer"
                  >
                    <option value="debit">مدين (Debit)</option>
                    <option value="credit">دائن (Credit)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-muted-foreground mb-1.5">اسم الحساب الدفتري <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full h-11 bg-background border border-border/60 rounded-xl px-4 font-black text-sm focus:border-primary outline-none"
                  placeholder="مثال: مصروفات نظافة وتطهير فرعية..."
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-muted-foreground mb-1.5">الوصف والبيان المحاسبي</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  rows={2}
                  className="w-full p-3 bg-background border border-border/60 rounded-xl font-bold text-xs focus:border-primary outline-none"
                  placeholder="ملاحظات توضيحية حول الغرض من الحساب..."
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-border/50">
                <button type="submit" className="flex-1 bg-primary text-primary-foreground font-extrabold py-3 rounded-xl hover:bg-primary/90 transition-all shadow-md text-sm">
                  {editingAccount ? 'حفظ التعديلات' : 'إضافة الحساب للشجرة'}
                </button>
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-6 bg-muted text-muted-foreground font-bold py-3 rounded-xl hover:bg-accent transition-all text-sm">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Statement Detailed Modal */}
      {isStatementOpen && statementAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-card w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-border/50 flex justify-between items-center bg-primary/10 shrink-0">
              <div>
                <h3 className="font-black text-xl text-primary flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" /> كشف حساب: {statementAccount.name}
                </h3>
                <div className="text-xs text-muted-foreground font-bold mt-1">
                  الرمز: <span className="font-mono text-foreground font-black">{statementAccount.code}</span> • التصنيف: <span className="text-foreground font-black">{getTypeName(statementAccount.type)}</span>
                </div>
              </div>
              <button onClick={() => setIsStatementOpen(false)} className="p-2 bg-muted hover:bg-accent rounded-full text-muted-foreground">✕</button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/20 space-y-1">
                  <div className="text-xs text-rose-700 font-extrabold">إجمالي حركات المدين (+)</div>
                  <div className="text-2xl font-black text-rose-900 tabular-nums">{stmtTotalDebit.toLocaleString()} {currency}</div>
                </div>

                <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 space-y-1">
                  <div className="text-xs text-emerald-700 font-extrabold">إجمالي حركات الدائن (-)</div>
                  <div className="text-2xl font-black text-emerald-900 tabular-nums">{stmtTotalCredit.toLocaleString()} {currency}</div>
                </div>

                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 space-y-1">
                  <div className="text-xs text-primary font-extrabold">الرصيد الدفتري الحالي</div>
                  <div className="text-2xl font-black text-primary tabular-nums">{stmtBalance.toLocaleString()} {currency}</div>
                </div>
              </div>

              <PageCard title="سجل حركات القيود المسجلة بالدفتر العام">
                <DataTable
                  rows={statementLines}
                  columns={[
                    { key: "date", header: "التاريخ", cell: (r) => <span className="font-bold text-xs font-mono">{r.date}</span> },
                    { key: "journalEntryId", header: "مرجع القيد", cell: (r) => <span className="font-mono font-black text-xs text-primary">{r.entryRef || r.journalEntryId}</span> },
                    { key: "description", header: "البيان والشارحة المحاسبية", cell: (r) => <span className="text-xs font-bold text-foreground">{r.description}</span> },
                    { key: "debit", header: "مدين (+)", cell: (r) => r.debit > 0 ? <span className="text-rose-600 font-black tabular-nums text-xs">+{r.debit.toLocaleString()} {currency}</span> : <span className="text-muted-foreground/30">-</span> },
                    { key: "credit", header: "دائن (-)", cell: (r) => r.credit > 0 ? <span className="text-emerald-600 font-black tabular-nums text-xs">-{r.credit.toLocaleString()} {currency}</span> : <span className="text-muted-foreground/30">-</span> },
                  ]}
                  pageSize={10}
                  empty="لا توجد حركات مسجلة في هذا الحساب للعام الحالي"
                />
              </PageCard>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Print Engine */}
      <AdvancedPrintEngine
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        title="شجرة الدليل المحاسبي الشامل للمدرسة"
        data={printData}
        templates={printTemplates}
      />
    </AppShell>
  );
}

