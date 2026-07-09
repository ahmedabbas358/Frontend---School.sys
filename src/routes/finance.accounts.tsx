import { createFileRoute } from '@tanstack/react-router';
import { useGlobalStore, Account, JournalEntry, JournalLine } from '../contexts/GlobalStoreContext';
import { useState, useMemo } from 'react';
import { AppShell, PageCard } from '@/components/app-shell';
import { FolderTree, Search, Plus, Edit, Trash2, Power, Eye, Building2, Briefcase, Star, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/finance/accounts')({
  component: FinanceAccounts,
});

function FinanceAccounts() {
  const { allAccounts, addAccount, updateAccount, toggleAccountStatus, allJournalEntries, allJournalLines, currency, currentAcademicYearId } = useGlobalStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [statementAccount, setStatementAccount] = useState<Account | null>(null);

  // Form State
  const [formData, setFormData] = useState({ name: '', type: 'expense' as Account['type'], code: '', description: '' });

  const getTypeName = (type: string) => {
    switch (type) {
      case 'asset': return 'الأصول';
      case 'liability': return 'الخصوم';
      case 'equity': return 'حقوق الملكية';
      case 'revenue': return 'الإيرادات';
      case 'expense': return 'المصروفات';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'asset': return <Building2 className="w-5 h-5 text-blue-500" />;
      case 'liability': return <Briefcase className="w-5 h-5 text-red-500" />;
      case 'equity': return <Star className="w-5 h-5 text-purple-500" />;
      case 'revenue': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'expense': return <Clock className="w-5 h-5 text-orange-500" />;
      default: return <FolderTree className="w-5 h-5" />;
    }
  };

  const filteredAccounts = useMemo(() => {
    return allAccounts.filter(acc => 
      acc.name.includes(searchTerm) || acc.code.includes(searchTerm)
    );
  }, [allAccounts, searchTerm]);

  // Group by type
  const grouped = {
    revenue: filteredAccounts.filter(a => a.type === 'revenue'),
    expense: filteredAccounts.filter(a => a.type === 'expense'),
    asset: filteredAccounts.filter(a => a.type === 'asset'),
    liability: filteredAccounts.filter(a => a.type === 'liability'),
    equity: filteredAccounts.filter(a => a.type === 'equity'),
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      updateAccount(editingAccount.id, formData);
      toast.success("تم تحديث الحساب بنجاح");
    } else {
      addAccount(formData);
      toast.success("تمت إضافة الحساب بنجاح");
    }
    setIsAddOpen(false);
    setEditingAccount(null);
  };

  const openEdit = (acc: Account) => {
    setEditingAccount(acc);
    setFormData({ name: acc.name, type: acc.type, code: acc.code, description: acc.description || '' });
    setIsAddOpen(true);
  };

  const openAdd = () => {
    setEditingAccount(null);
    setFormData({ name: '', type: 'expense', code: '', description: '' });
    setIsAddOpen(true);
  };

  const openStatement = (acc: Account) => {
    setStatementAccount(acc);
    setIsStatementOpen(true);
  };

  // Statement Calculation
  const statementLines = useMemo(() => {
    if (!statementAccount) return [];
    
    // Get all valid entry IDs for current year
    const validEntryIds = new Set(
      allJournalEntries
        .filter(e => e.academicYearId === currentAcademicYearId && e.status === 'posted')
        .map(e => e.id)
    );

    const lines = allJournalLines.filter(l => validEntryIds.has(l.journalEntryId) && l.accountId === statementAccount.id);
    
    // Sort by date (we need to get date from entry)
    const linesWithDate = lines.map(l => {
      const entry = allJournalEntries.find(e => e.id === l.journalEntryId);
      return {
        ...l,
        date: entry?.date || '',
        description: l.description || entry?.description || '',
        entryRef: entry?.referenceId || '',
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return linesWithDate;
  }, [statementAccount, allJournalEntries, allJournalLines, currentAcademicYearId]);

  const stmtTotalDebit = statementLines.reduce((sum, l) => sum + l.debit, 0);
  const stmtTotalCredit = statementLines.reduce((sum, l) => sum + l.credit, 0);
  let stmtBalance = stmtTotalDebit - stmtTotalCredit;
  if (statementAccount?.type === 'liability' || statementAccount?.type === 'equity' || statementAccount?.type === 'revenue') {
    stmtBalance = stmtTotalCredit - stmtTotalDebit;
  }

  const renderGroup = (type: string, title: string, accounts: Account[]) => {
    if (accounts.length === 0) return null;
    return (
      <div className="mb-8">
        <h3 className="text-lg font-black flex items-center gap-2 mb-4">
          {getTypeIcon(type)} {title}
        </h3>
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-right">
            <thead className="bg-muted/50 border-b border-border/50">
              <tr>
                <th className="py-3 px-4 font-bold w-24">الرمز</th>
                <th className="py-3 px-4 font-bold">اسم الحساب</th>
                <th className="py-3 px-4 font-bold">الوصف</th>
                <th className="py-3 px-4 font-bold w-24 text-center">الحالة</th>
                <th className="py-3 px-4 font-bold w-48 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {accounts.map(acc => (
                <tr key={acc.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-muted-foreground">{acc.code}</td>
                  <td className="py-3 px-4 font-bold">{acc.name} {acc.isSystemAccount && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full mr-2">أساسي</span>}</td>
                  <td className="py-3 px-4 text-muted-foreground">{acc.description || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${acc.isActive !== false ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {acc.isActive !== false ? 'نشط' : 'موقوف'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openStatement(acc)} className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-500/20 transition-colors tooltip-trigger" title="كشف الحساب">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openEdit(acc)} 
                        disabled={acc.isSystemAccount}
                        className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg hover:bg-amber-500/20 disabled:opacity-30 transition-colors" 
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => toggleAccountStatus(acc.id)} 
                        disabled={acc.isSystemAccount}
                        className="p-1.5 bg-slate-500/10 text-slate-600 rounded-lg hover:bg-slate-500/20 disabled:opacity-30 transition-colors" 
                        title="إيقاف / تفعيل"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-3xl border border-border shadow-sm">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2 text-primary">
              <FolderTree className="w-7 h-7" /> إدارة الحسابات
            </h1>
            <p className="text-muted-foreground mt-1">التحكم الدقيق بشجرة الحسابات واستعراض تقاريرها</p>
          </div>
          <button 
            onClick={openAdd}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25"
          >
            <Plus className="w-5 h-5" /> إضافة حساب جديد
          </button>
        </div>

        <PageCard>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="ابحث برقم الحساب أو اسمه..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-12 h-12 bg-muted/30 border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            {renderGroup('revenue', 'الإيرادات المدرسية', grouped.revenue)}
            {renderGroup('expense', 'المصروفات والرواتب', grouped.expense)}
            {renderGroup('asset', 'الأصول والموجودات', grouped.asset)}
            {renderGroup('liability', 'الخصوم والموردين', grouped.liability)}
          </div>
        </PageCard>

        {/* Add/Edit Modal */}
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />
            <div className="relative bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
                <h3 className="font-black text-lg">{editingAccount ? 'تعديل الحساب' : 'حساب فرعي جديد'}</h3>
                <button onClick={() => setIsAddOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
              <form onSubmit={handleSaveAccount} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1.5">نوع الحساب</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                    className="w-full h-11 bg-background border border-border rounded-xl px-4 font-bold outline-none"
                    disabled={!!editingAccount}
                  >
                    <option value="revenue">إيرادات</option>
                    <option value="expense">مصروفات</option>
                    <option value="asset">أصول</option>
                    <option value="liability">خصوم</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1.5">رمز الحساب (اختياري)</label>
                  <input 
                    type="text" 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    className="w-full h-11 bg-background border border-border rounded-xl px-4 font-mono outline-none"
                    placeholder="مثال: 5012"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1.5">اسم الحساب</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full h-11 bg-background border border-border rounded-xl px-4 font-bold outline-none"
                    placeholder="مثال: مصروفات نظافة فرعية"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1.5">وصف الحساب</label>
                  <input 
                    type="text" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full h-11 bg-background border border-border rounded-xl px-4 outline-none"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors">
                    حفظ الحساب
                  </button>
                  <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 bg-muted text-foreground font-bold py-3 rounded-xl hover:bg-accent transition-colors">
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Statement Modal */}
        {isStatementOpen && statementAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsStatementOpen(false)} />
            <div className="relative bg-card w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-muted/30">
                <div>
                  <h3 className="font-black text-xl flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" /> كشف حساب: {statementAccount.name}
                  </h3>
                  <div className="text-sm text-muted-foreground font-mono mt-1">{statementAccount.code} • {getTypeName(statementAccount.type)}</div>
                </div>
                <button onClick={() => setIsStatementOpen(false)} className="p-2 bg-muted rounded-full text-muted-foreground hover:text-foreground">✕</button>
              </div>
              
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-muted/30 p-4 rounded-2xl border border-border">
                    <div className="text-sm text-muted-foreground mb-1 font-bold">إجمالي مدين</div>
                    <div className="text-xl font-black text-success tabular-nums">{stmtTotalDebit.toLocaleString()} {currency}</div>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-2xl border border-border">
                    <div className="text-sm text-muted-foreground mb-1 font-bold">إجمالي دائن</div>
                    <div className="text-xl font-black text-danger tabular-nums">{stmtTotalCredit.toLocaleString()} {currency}</div>
                  </div>
                  <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20">
                    <div className="text-sm text-primary mb-1 font-bold">الرصيد الفعلي (Balance)</div>
                    <div className="text-2xl font-black text-primary tabular-nums">{stmtBalance.toLocaleString()} {currency}</div>
                  </div>
                </div>

                <div className="border border-border/50 rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-muted/50 border-b border-border/50">
                      <tr>
                        <th className="py-3 px-4 font-bold">التاريخ</th>
                        <th className="py-3 px-4 font-bold">رقم القيد</th>
                        <th className="py-3 px-4 font-bold">البيان</th>
                        <th className="py-3 px-4 font-bold text-center">مدين</th>
                        <th className="py-3 px-4 font-bold text-center">دائن</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {statementLines.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground font-bold">لا توجد حركات مسجلة في هذا الحساب للعام الحالي</td>
                        </tr>
                      ) : (
                        statementLines.map(line => (
                          <tr key={line.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-4 text-muted-foreground font-mono">{line.date}</td>
                            <td className="py-3 px-4 font-mono font-bold">{line.journalEntryId}</td>
                            <td className="py-3 px-4">{line.description}</td>
                            <td className="py-3 px-4 text-center tabular-nums text-success font-bold">{line.debit > 0 ? line.debit.toLocaleString() : '-'}</td>
                            <td className="py-3 px-4 text-center tabular-nums text-danger font-bold">{line.credit > 0 ? line.credit.toLocaleString() : '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
