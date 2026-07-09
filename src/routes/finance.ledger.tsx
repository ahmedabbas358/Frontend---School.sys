import { createFileRoute } from '@tanstack/react-router';
import { useGlobalStore } from '../contexts/GlobalStoreContext';
import { useState, useMemo } from 'react';
import { BookOpen, Search, ArrowRight, ArrowLeft, ArrowDownUp, BarChart2, Plus, Filter, Calendar, LayoutList, CheckCircle2, TrendingUp, DollarSign, FileText, Wallet, Printer, ShieldCheck } from 'lucide-react';
import { AppShell, PageCard } from '@/components/app-shell';
import { FinancialCard, EmptyState, SmartAlert } from '@/components/financial-components';
import { AccountBrowserModal } from '@/components/account-browser';
import { AdvancedPrintEngine, PrintTemplate } from '@/components/print-engine';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export const Route = createFileRoute('/finance/ledger')({
  component: FinanceLedger,
});

function FinanceLedger() {
  const { allJournalEntries, allJournalLines, allAccounts, currentAcademicYearId, allStudents, currency, addJournalEntry, allAuditLogs } = useGlobalStore();
  const [activeTab, setActiveTab] = useState<'journal' | 'general_ledger' | 'trial_balance' | 'audit'>('journal');
  
  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Print
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printDocType, setPrintDocType] = useState<'journal' | 'general_ledger' | 'trial_balance' | 'audit'>('journal');

  // Manual Entry Modal
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [browserTargetLine, setBrowserTargetLine] = useState<number | null>(null);
  const [manualDescription, setManualDescription] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualReference, setManualReference] = useState('');
  const [manualLines, setManualLines] = useState<{accountId: string, debit: number, credit: number, description: string, referenceId?: string, referenceType?: string}[]>([
    { accountId: '', debit: 0, credit: 0, description: '' },
    { accountId: '', debit: 0, credit: 0, description: '' }
  ]);

  const handleAddManualLine = () => {
    setManualLines([...manualLines, { accountId: '', debit: 0, credit: 0, description: '' }]);
  };

  const handleRemoveManualLine = (index: number) => {
    setManualLines(manualLines.filter((_, i) => i !== index));
  };

  const handleManualLineChange = (index: number, field: string, value: any) => {
    const newLines = [...manualLines];
    (newLines[index] as any)[field] = value;
    if (field === 'debit' && value > 0) newLines[index].credit = 0;
    if (field === 'credit' && value > 0) newLines[index].debit = 0;
    setManualLines(newLines);
  };

  const totalManualDebit = manualLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalManualCredit = manualLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isManualBalanced = totalManualDebit > 0 && totalManualDebit === totalManualCredit;
  const isManualValid = isManualBalanced && manualDescription && manualLines.every(l => l.accountId && (l.debit > 0 || l.credit > 0));

  const submitManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManualValid) return;

    addJournalEntry({
      date: manualDate,
      description: manualDescription,
      referenceId: manualReference || undefined,
      academicYearId: currentAcademicYearId,
      moduleId: 'manual'
    }, manualLines.map(l => ({
      accountId: l.accountId,
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0,
      description: l.description || manualDescription,
      referenceId: l.referenceId,
      referenceType: l.referenceType as any,
    })));

    setIsManualEntryOpen(false);
    setManualDescription('');
    setManualReference('');
    setManualLines([{ accountId: '', debit: 0, credit: 0, description: '' }, { accountId: '', debit: 0, credit: 0, description: '' }]);
  };

  // Data processing
  const filteredEntries = useMemo(() => {
    return allJournalEntries
      .filter((entry) => entry.academicYearId === currentAcademicYearId)
      .filter((entry) => {
        if (dateRange.start && new Date(entry.date) < new Date(dateRange.start)) return false;
        if (dateRange.end && new Date(entry.date) > new Date(dateRange.end)) return false;
        return true;
      })
      .filter((entry) => {
        const lines = allJournalLines.filter((l) => l.journalEntryId === entry.id);
        const matchSearch =
          entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.referenceId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchAccount = filterAccount === 'all' || lines.some((l) => l.accountId === filterAccount);
        return matchSearch && matchAccount;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allJournalEntries, allJournalLines, currentAcademicYearId, searchTerm, filterAccount, dateRange]);

  const totalVolume = useMemo(() => {
    return filteredEntries.reduce((acc, entry) => {
      const lines = allJournalLines.filter((l) => l.journalEntryId === entry.id);
      const debitTotal = lines.reduce((sum, line) => sum + line.debit, 0);
      return acc + debitTotal;
    }, 0);
  }, [filteredEntries, allJournalLines]);

  // Chart Data
  const chartData = useMemo(() => {
    const dailyVolumes: Record<string, number> = {};
    const days = [...filteredEntries].reverse();
    days.forEach(entry => {
      const date = entry.date;
      const lines = allJournalLines.filter((l) => l.journalEntryId === entry.id);
      const debitTotal = lines.reduce((sum, line) => sum + line.debit, 0);
      dailyVolumes[date] = (dailyVolumes[date] || 0) + debitTotal;
    });
    return Object.keys(dailyVolumes).map(date => ({
      date,
      volume: dailyVolumes[date]
    })).slice(-15); // last 15 active days
  }, [filteredEntries, allJournalLines]);

  // Trial Balance Data
  const trialBalance = useMemo(() => {
    const balances = allAccounts.map(acc => {
      let debit = 0;
      let credit = 0;
      allJournalLines.filter(l => l.accountId === acc.id).forEach(l => {
        debit += l.debit;
        credit += l.credit;
      });
      const balance = debit - credit;
      return {
        ...acc,
        totalDebit: debit,
        totalCredit: credit,
        finalDebit: balance > 0 ? balance : 0,
        finalCredit: balance < 0 ? Math.abs(balance) : 0
      };
    }).filter(acc => acc.totalDebit > 0 || acc.totalCredit > 0);
    return balances;
  }, [allAccounts, allJournalLines]);

  const tbTotalDebit = trialBalance.reduce((sum, acc) => sum + acc.finalDebit, 0);
  const tbTotalCredit = trialBalance.reduce((sum, acc) => sum + acc.finalCredit, 0);

  // General Ledger Data
  const selectedAccountGL = useMemo(() => {
    if (filterAccount === 'all') return null;
    const account = allAccounts.find(a => a.id === filterAccount);
    if (!account) return null;

    let runningBalance = 0;
    const lines = allJournalLines
      .filter(l => l.accountId === account.id)
      .map(line => {
        const entry = allJournalEntries.find(e => e.id === line.journalEntryId);
        return { line, entry };
      })
      .filter(item => item.entry && item.entry.academicYearId === currentAcademicYearId)
      .sort((a, b) => new Date(a.entry!.date).getTime() - new Date(b.entry!.date).getTime())
      .map(item => {
        runningBalance += item.line.debit - item.line.credit;
        return {
          ...item,
          runningBalance
        };
      });

    return { account, lines, finalBalance: runningBalance };
  }, [filterAccount, allAccounts, allJournalLines, allJournalEntries, currentAcademicYearId]);

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "المالية والمحاسبة" },
        { label: "المركز المحاسبي المتقدم" },
      ]}
    >
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        
        {/* Top Action Bar & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-2 rounded-2xl border border-border/50 shadow-sm">
          <div className="flex bg-muted/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button 
              onClick={() => setActiveTab('journal')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'journal' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <BookOpen className="w-4 h-4" /> دفتر اليومية
            </button>
            <button 
              onClick={() => setActiveTab('general_ledger')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'general_ledger' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutList className="w-4 h-4" /> دفتر الأستاذ
            </button>
            <button 
              onClick={() => setActiveTab('trial_balance')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'trial_balance' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <BarChart2 className="w-4 h-4" /> ميزان المراجعة
            </button>
            <button 
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'audit' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <ShieldCheck className="w-4 h-4" /> مركز التدقيق
            </button>
          </div>
          <div className="flex gap-2 px-2 pb-2 sm:pb-0 sm:px-0">
            <button 
              onClick={() => { setPrintDocType(activeTab); setIsPrintOpen(true); }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
            >
              <Printer className="w-4 h-4" /> طباعة
            </button>
            <button 
              onClick={() => setIsManualEntryOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> قيد يدوي
            </button>
          </div>
        </div>

        {/* Global Filters */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground border-l border-border/50 pl-4">
            <Filter className="w-5 h-5" />
            <span className="font-bold">تصفية:</span>
          </div>
          
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="بحث في البيان أو رقم المرجع..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 bg-background border border-border/50 rounded-xl pr-9 pl-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
            />
          </div>

          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="h-10 bg-background border border-border/50 rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold min-w-[200px]"
          >
            <option value="all">جميع الحسابات</option>
            {allAccounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name} ({acc.code})</option>
            ))}
          </select>

          <div className="flex items-center gap-2 bg-background border border-border/50 rounded-xl px-3 h-10">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
              className="bg-transparent border-none text-sm outline-none w-32 tabular-nums font-bold"
            />
            <span className="text-muted-foreground">-</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
              className="bg-transparent border-none text-sm outline-none w-32 tabular-nums font-bold"
            />
          </div>
        </div>

        {/* Tab Content: Journal */}
        {activeTab === 'journal' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <PageCard className="h-full">
                  <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> التدفق المالي للقيود</h3>
                  <div className="h-[120px] w-full">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="date" hide />
                          <YAxis hide />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontWeight: 'bold' }}
                            formatter={(value: number) => [`${value.toLocaleString()} ${currency}`, 'التداول']}
                            labelFormatter={(label) => `التاريخ: ${label}`}
                          />
                          <Area type="monotone" dataKey="volume" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground font-bold">لا توجد بيانات كافية للرسم البياني</div>
                    )}
                  </div>
                </PageCard>
              </div>
              <div className="flex flex-col gap-4">
                <FinancialCard 
                  title="حجم التداول المالي" 
                  value={totalVolume} 
                  currency={currency} 
                  icon={ArrowDownUp} 
                  colorClass="text-primary bg-primary" 
                />
                <FinancialCard 
                  title="القيود المحاسبية" 
                  value={filteredEntries.length} 
                  currency="قيد" 
                  icon={BookOpen} 
                  colorClass="text-foreground bg-muted" 
                />
              </div>
            </div>

            <PageCard title="سجل قيود اليومية">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="px-4 py-3 text-sm font-bold text-muted-foreground w-32">التاريخ</th>
                      <th className="px-4 py-3 text-sm font-bold text-muted-foreground w-24">الرقم</th>
                      <th className="px-4 py-3 text-sm font-bold text-muted-foreground">البيان والمرجع</th>
                      <th className="px-4 py-3 text-sm font-bold text-muted-foreground w-[400px]">تفاصيل الحركة (مدين / دائن)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredEntries.map((entry) => {
                      const lines = allJournalLines.filter((l) => l.journalEntryId === entry.id);
                      const debitLines = lines.filter((l) => l.debit > 0);
                      const creditLines = lines.filter((l) => l.credit > 0);

                      return (
                        <tr key={entry.id} className="hover:bg-accent/10 transition-colors group">
                          <td className="px-4 py-4 align-top">
                            <div className="text-sm font-bold tabular-nums bg-muted/50 inline-block px-2 py-1 rounded-lg border border-border/50">{entry.date}</div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="text-sm font-black text-primary bg-primary/5 inline-block px-2 py-1 rounded-lg border border-primary/20">{entry.id.replace('JE-', '')}</div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="text-sm font-bold leading-relaxed">{entry.description}</div>
                            {entry.referenceId && (
                              <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <FileText className="w-3 h-3" /> المرجع: <span className="font-bold">{entry.referenceId}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="space-y-1.5">
                              {debitLines.map((line) => {
                                const acc = allAccounts.find((a) => a.id === line.accountId);
                                return (
                                  <div key={line.id} className="flex justify-between items-center text-sm bg-success/5 px-3 py-2 rounded-lg border border-success/20 group-hover:bg-success/10 transition-colors">
                                    <div className="flex items-center gap-2 font-bold text-success">
                                      <ArrowLeft className="w-4 h-4 shrink-0" />
                                      <span className="truncate max-w-[200px]" title={`من ح/ ${acc?.name}`}>من ح/ {acc?.name}</span>
                                    </div>
                                    <span className="font-black tabular-nums text-success">{line.debit.toLocaleString()}</span>
                                  </div>
                                );
                              })}
                              {creditLines.map((line) => {
                                const acc = allAccounts.find((a) => a.id === line.accountId);
                                return (
                                  <div key={line.id} className="flex justify-between items-center text-sm bg-danger/5 px-3 py-2 rounded-lg border border-danger/20 group-hover:bg-danger/10 transition-colors ml-6">
                                    <div className="flex items-center gap-2 font-bold text-danger">
                                      <ArrowRight className="w-4 h-4 shrink-0" />
                                      <span className="truncate max-w-[180px]" title={`إلى ح/ ${acc?.name}`}>إلى ح/ {acc?.name}</span>
                                    </div>
                                    <span className="font-black tabular-nums text-danger">{line.credit.toLocaleString()}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredEntries.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8">
                          <EmptyState title="لا توجد قيود مسجلة" description="لم يتم العثور على أي قيود محاسبية تطابق محددات البحث." icon={BookOpen} />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </PageCard>
          </div>
        )}

        {/* Tab Content: General Ledger */}
        {activeTab === 'general_ledger' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {filterAccount === 'all' ? (
              <EmptyState 
                title="اختر حساباً لعرض دفتر الأستاذ" 
                description="يُرجى اختيار حساب من شريط التصفية بالأعلى لعرض كافة الحركات والرصيد التراكمي الخاص به." 
                icon={LayoutList} 
              />
            ) : selectedAccountGL ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <FinancialCard 
                      title={`حساب: ${selectedAccountGL.account.name} (${selectedAccountGL.account.code})`} 
                      value={Math.abs(selectedAccountGL.finalBalance)} 
                      currency={currency} 
                      icon={Wallet} 
                      colorClass={selectedAccountGL.finalBalance >= 0 ? "text-success bg-success" : "text-danger bg-danger"} 
                      trend={{
                        value: 0,
                        isPositive: selectedAccountGL.finalBalance >= 0,
                        label: selectedAccountGL.finalBalance > 0 ? 'رصيد مدين' : selectedAccountGL.finalBalance < 0 ? 'رصيد دائن' : 'رصيد صفري'
                      }}
                    />
                  </div>
                  <FinancialCard 
                    title="عدد الحركات" 
                    value={selectedAccountGL.lines.length} 
                    currency="حركة" 
                    icon={LayoutList} 
                    colorClass="text-primary bg-primary" 
                  />
                </div>
                
                <PageCard title="كشف الحركات التفصيلي">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border">
                          <th className="px-4 py-3 text-sm font-bold text-muted-foreground w-32">التاريخ</th>
                          <th className="px-4 py-3 text-sm font-bold text-muted-foreground w-24">القيد</th>
                          <th className="px-4 py-3 text-sm font-bold text-muted-foreground">البيان</th>
                          <th className="px-4 py-3 text-sm font-bold text-muted-foreground text-center">مدين</th>
                          <th className="px-4 py-3 text-sm font-bold text-muted-foreground text-center">دائن</th>
                          <th className="px-4 py-3 text-sm font-bold text-muted-foreground text-left">الرصيد</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {selectedAccountGL.lines.map((item, idx) => (
                          <tr key={item.line.id} className="hover:bg-accent/10 transition-colors">
                            <td className="px-4 py-3 text-sm font-bold tabular-nums">{item.entry!.date}</td>
                            <td className="px-4 py-3 text-sm font-bold text-primary">{item.entry!.id.replace('JE-', '')}</td>
                            <td className="px-4 py-3 text-sm">{item.line.description || item.entry!.description}</td>
                            <td className="px-4 py-3 text-sm font-black text-center tabular-nums text-success">{item.line.debit > 0 ? item.line.debit.toLocaleString() : '-'}</td>
                            <td className="px-4 py-3 text-sm font-black text-center tabular-nums text-danger">{item.line.credit > 0 ? item.line.credit.toLocaleString() : '-'}</td>
                            <td className={`px-4 py-3 text-sm font-black text-left tabular-nums ${item.runningBalance >= 0 ? 'text-success' : 'text-danger'}`} dir="ltr">
                              {Math.abs(item.runningBalance).toLocaleString()} {item.runningBalance >= 0 ? '(مدين)' : '(دائن)'}
                            </td>
                          </tr>
                        ))}
                        {selectedAccountGL.lines.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8">
                              <EmptyState title="لا توجد حركات" description="هذا الحساب لم يسجل أي حركات مالية في الفترة المحددة." icon={LayoutList} />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </PageCard>
              </>
            ) : null}
          </div>
        )}

        {/* Tab Content: Trial Balance */}
        {activeTab === 'trial_balance' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {isManualBalanced ? null : <SmartAlert type="info" title="ميزان المراجعة متوازن" description="إجمالي الأرصدة المدينة يطابق الأرصدة الدائنة بصورة صحيحة." />}
            
            <PageCard title="ميزان المراجعة بالأرصدة (Trial Balance)">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="px-4 py-4 text-sm font-bold rounded-tr-xl">رمز الحساب</th>
                      <th className="px-4 py-4 text-sm font-bold">اسم الحساب</th>
                      <th className="px-4 py-4 text-sm font-bold text-center">أرصدة مدينة</th>
                      <th className="px-4 py-4 text-sm font-bold text-center rounded-tl-xl">أرصدة دائنة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {trialBalance.map(acc => (
                      <tr key={acc.id} className="hover:bg-accent/10 transition-colors">
                        <td className="px-4 py-3 text-sm font-black text-primary/80">{acc.code}</td>
                        <td className="px-4 py-3 text-sm font-bold">{acc.name}</td>
                        <td className="px-4 py-3 text-sm font-black text-center tabular-nums text-success">
                          {acc.finalDebit > 0 ? acc.finalDebit.toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-black text-center tabular-nums text-danger">
                          {acc.finalCredit > 0 ? acc.finalCredit.toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted font-black border-t-2 border-border">
                      <td colSpan={2} className="px-4 py-4 text-left">الإجمالي:</td>
                      <td className="px-4 py-4 text-center tabular-nums text-success text-lg">{tbTotalDebit.toLocaleString()} {currency}</td>
                      <td className="px-4 py-4 text-center tabular-nums text-danger text-lg">{tbTotalCredit.toLocaleString()} {currency}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </PageCard>
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <PageCard title="مركز المراجعة والتدقيق (Audit Center)">
            {(allAuditLogs || []).length === 0 ? (
              <EmptyState title="لا توجد سجلات تدقيق" description="لم يتم تسجيل أي عمليات تستدعي المراجعة حتى الآن." icon={ShieldCheck} />
            ) : (
              <div className="space-y-4">
                {(allAuditLogs || [])
                  .filter(log => {
                    const matchSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        log.details.toLowerCase().includes(searchTerm.toLowerCase());
                    return matchSearch;
                  })
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map(log => (
                  <div key={log.id} className="p-4 bg-card border border-border/50 rounded-xl hover:border-primary/50 transition-colors flex gap-4">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold">{log.action}</h4>
                        <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString('ar-EG')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{log.details}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded font-bold">بواسطة: {log.performedBy}</span>
                        <span className="bg-muted px-2 py-1 rounded">الكيان: {log.entityType} ({log.entityId})</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PageCard>
        )}

      </div>

      {/* Manual Entry Modal */}
      {isManualEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsManualEntryOpen(false)} />
          <div className="relative bg-card w-full max-w-3xl rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
              <h2 className="text-xl font-black flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> قيد يومية يدوي جديد</h2>
              <button onClick={() => setIsManualEntryOpen(false)} className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            
            <form onSubmit={submitManualEntry} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1.5">البيان الرئيسي للقيد</label>
                  <input 
                    type="text" 
                    required 
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    className="w-full h-11 bg-background border border-border rounded-xl px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="مثال: تسوية عهدة, قيد افتتاحي..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-muted-foreground mb-1.5">التاريخ</label>
                  <input 
                    type="date" 
                    required 
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full h-11 bg-background border border-border rounded-xl px-4 font-bold tabular-nums focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-muted-foreground mb-1.5">رقم المرجع (اختياري)</label>
                  <input 
                    type="text" 
                    value={manualReference}
                    onChange={(e) => setManualReference(e.target.value)}
                    className="w-full h-11 bg-background border border-border rounded-xl px-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="رقم الفاتورة أو المستند الخارجي..."
                  />
                </div>
              </div>

              <div className="border border-border rounded-xl overflow-hidden mb-4">
                <table className="w-full text-right text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 font-bold w-1/3">الحساب</th>
                      <th className="p-3 font-bold w-1/4">بيان السطر (اختياري)</th>
                      <th className="p-3 font-bold w-1/6 text-center">مدين</th>
                      <th className="p-3 font-bold w-1/6 text-center">دائن</th>
                      <th className="p-3 font-bold w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {manualLines.map((line, idx) => (
                      <tr key={idx} className="bg-background">
                        <td className="p-2">
                          <button 
                            type="button"
                            onClick={() => {
                              setBrowserTargetLine(idx);
                              setIsBrowserOpen(true);
                            }}
                            className={`w-full h-10 bg-transparent border border-border rounded-lg px-2 font-bold outline-none hover:border-primary text-right flex items-center justify-between transition-colors ${!line.accountId ? 'text-muted-foreground' : 'text-foreground'}`}
                          >
                            <span className="truncate">
                              {line.accountId ? allAccounts.find(a => a.id === line.accountId)?.name : 'تصفح الحسابات...'}
                            </span>
                            <Search className="w-4 h-4 opacity-50" />
                          </button>
                        </td>
                        <td className="p-2">
                          <input 
                            type="text" 
                            value={line.description}
                            onChange={(e) => handleManualLineChange(idx, 'description', e.target.value)}
                            className="w-full h-10 bg-transparent border border-border rounded-lg px-2 outline-none focus:border-primary text-xs"
                            placeholder="يطابق الرئيسي"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            min="0"
                            step="0.01"
                            value={line.debit || ''}
                            onChange={(e) => handleManualLineChange(idx, 'debit', parseFloat(e.target.value))}
                            className="w-full h-10 bg-transparent border border-success/30 focus:border-success rounded-lg px-2 text-center font-black text-success tabular-nums outline-none"
                            placeholder="0.00"
                            disabled={line.credit > 0}
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            min="0"
                            step="0.01"
                            value={line.credit || ''}
                            onChange={(e) => handleManualLineChange(idx, 'credit', parseFloat(e.target.value))}
                            className="w-full h-10 bg-transparent border border-danger/30 focus:border-danger rounded-lg px-2 text-center font-black text-danger tabular-nums outline-none"
                            placeholder="0.00"
                            disabled={line.debit > 0}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button 
                            type="button"
                            onClick={() => handleRemoveManualLine(idx)}
                            disabled={manualLines.length <= 2}
                            className="p-2 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mb-6">
                <button 
                  type="button" 
                  onClick={handleAddManualLine}
                  className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> إضافة سطر
                </button>
                <div className="flex gap-6 text-sm font-black tabular-nums bg-muted/50 px-4 py-2 rounded-xl border border-border/50">
                  <div className="flex flex-col items-center">
                    <span className="text-muted-foreground text-xs font-bold">إجمالي المدين</span>
                    <span className="text-success">{totalManualDebit.toLocaleString()} {currency}</span>
                  </div>
                  <div className="w-px bg-border"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-muted-foreground text-xs font-bold">إجمالي الدائن</span>
                    <span className="text-danger">{totalManualCredit.toLocaleString()} {currency}</span>
                  </div>
                  <div className="w-px bg-border"></div>
                  <div className="flex flex-col items-center">
                    <span className="text-muted-foreground text-xs font-bold">الفرق</span>
                    <span className={Math.abs(totalManualDebit - totalManualCredit) === 0 ? "text-primary" : "text-danger"}>
                      {Math.abs(totalManualDebit - totalManualCredit).toLocaleString()} {currency}
                    </span>
                  </div>
                </div>
              </div>

              {!isManualBalanced && totalManualDebit > 0 && (
                <div className="mb-6">
                  <SmartAlert type="danger" title="القيد غير متوازن" description="يجب أن يتساوى إجمالي المدين مع إجمالي الدائن لحفظ القيد." />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => setIsManualEntryOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-bold hover:bg-accent transition-colors border border-border"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  disabled={!isManualValid}
                  className="px-8 py-2.5 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> ترحيل القيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Engine Integration */}
      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)}
        title={
          printDocType === 'journal' ? 'سجل قيود اليومية الموحد' : 
          printDocType === 'general_ledger' ? `دفتر الأستاذ ${selectedAccountGL ? `- ${selectedAccountGL.account.name}` : ''}` : 
          'ميزان المراجعة بالأرصدة'
        }
        subtitle={`العام الدراسي الحالي ${dateRange.start || dateRange.end ? ` | الفترة: ${dateRange.start || 'البداية'} إلى ${dateRange.end || 'النهاية'}` : ''}`} 
        defaultTemplateId={printDocType}
        data={
          printDocType === 'journal' 
            ? filteredEntries.flatMap(entry => {
                const lines = allJournalLines.filter((l) => l.journalEntryId === entry.id);
                const debitLines = lines.filter((l) => l.debit > 0);
                const creditLines = lines.filter((l) => l.credit > 0);
                
                const rows = [];
                rows.push({
                  date: entry.date, 
                  id: entry.id.replace('JE-', ''), 
                  desc: entry.description, 
                  debit: '', 
                  credit: ''
                });
                
                debitLines.forEach(l => {
                  const acc = allAccounts.find(a => a.id === l.accountId);
                  rows.push({ date: '', id: '', desc: `من ح/ ${acc?.name}`, debit: `${l.debit.toLocaleString()}`, credit: '' });
                });
                creditLines.forEach(l => {
                  const acc = allAccounts.find(a => a.id === l.accountId);
                  rows.push({ date: '', id: '', desc: `إلى ح/ ${acc?.name}`, debit: '', credit: `${l.credit.toLocaleString()}` });
                });
                
                return rows;
              })
            : printDocType === 'general_ledger' && selectedAccountGL
              ? selectedAccountGL.lines.map(item => ({
                  date: item.entry!.date,
                  id: item.entry!.id.replace('JE-', ''),
                  desc: item.line.description || item.entry!.description,
                  debit: item.line.debit > 0 ? item.line.debit.toLocaleString() : '-',
                  credit: item.line.credit > 0 ? item.line.credit.toLocaleString() : '-',
                  balance: `${Math.abs(item.runningBalance).toLocaleString()} ${item.runningBalance >= 0 ? '(مدين)' : '(دائن)'}`
                }))
              : printDocType === 'trial_balance'
                ? [
                    ...trialBalance.map(acc => ({
                      code: acc.code,
                      name: acc.name,
                      debit: acc.finalDebit > 0 ? acc.finalDebit.toLocaleString() : '-',
                      credit: acc.finalCredit > 0 ? acc.finalCredit.toLocaleString() : '-'
                    })),
                    { code: '', name: 'الإجمالي المالي:', debit: tbTotalDebit.toLocaleString(), credit: tbTotalCredit.toLocaleString() }
                  ]
                : []
        }
        templates={[
          {
            id: "journal",
            name: "سجل قيود اليومية الموحد",
            category: "المالية والمحاسبة",
            type: "table",
            columns: [
              { key: "date", label: "التاريخ" },
              { key: "id", label: "رقم القيد" },
              { key: "desc", label: "البيان" },
              { key: "debit", label: "حركة مدينة" },
              { key: "credit", label: "حركة دائنة" },
            ]
          },
          {
            id: "general_ledger",
            name: "دفتر الأستاذ العام",
            category: "المالية والمحاسبة",
            type: "table",
            columns: [
              { key: "date", label: "التاريخ" },
              { key: "id", label: "رقم القيد" },
              { key: "desc", label: "البيان" },
              { key: "debit", label: "مدين" },
              { key: "credit", label: "دائن" },
              { key: "balance", label: "الرصيد" },
            ]
          },
          {
            id: "trial_balance",
            name: "ميزان المراجعة بالأرصدة",
            category: "المالية والمحاسبة",
            type: "table",
            columns: [
              { key: "code", label: "رمز الحساب" },
              { key: "name", label: "اسم الحساب" },
              { key: "debit", label: "أرصدة مدينة" },
              { key: "credit", label: "أرصدة دائنة" },
            ]
          }
        ]}
      />

      <AccountBrowserModal
        isOpen={isBrowserOpen}
        onClose={() => {
          setIsBrowserOpen(false);
          setBrowserTargetLine(null);
        }}
        onSelect={(account, entity) => {
          if (browserTargetLine !== null) {
            handleManualLineChange(browserTargetLine, 'accountId', account.id);
            if (entity.type !== 'none') {
              handleManualLineChange(browserTargetLine, 'description', `مرتبط بـ: ${entity.name}`);
              handleManualLineChange(browserTargetLine, 'referenceId', entity.id);
              handleManualLineChange(browserTargetLine, 'referenceType', entity.type);
            } else {
              handleManualLineChange(browserTargetLine, 'referenceId', undefined);
              handleManualLineChange(browserTargetLine, 'referenceType', undefined);
            }
          }
        }}
      />

    </AppShell>
  );
}
