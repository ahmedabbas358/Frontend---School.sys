import React, { useState, useMemo } from 'react';
import { Search, FolderTree, ChevronDown, ChevronLeft, Star, Clock, User, Users, GraduationCap, Briefcase, Building2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useGlobalStore, Account, JournalLine, EntityType } from "@/contexts/GlobalStoreContext";

export type SelectedEntity = {
  id: string;
  name: string;
  type: 'student' | 'staff' | 'guardian' | 'none';
  details?: string;
};

interface AccountBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (account: Account, entity: SelectedEntity) => void;
}

export function AccountBrowserModal({ isOpen, onClose, onSelect }: AccountBrowserModalProps) {
  const { allAccounts, allStudents, allStaff, allGuardians } = useGlobalStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<Account['type'] | 'all'>('all');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  
  // Entity Selection State
  const [entitySearch, setEntitySearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);

  // Group accounts by type for the tree view
  const accountsByType = useMemo(() => {
    const grouped: Record<string, Account[]> = {
      asset: [],
      liability: [],
      equity: [],
      revenue: [],
      expense: [],
    };
    
    const filtered = allAccounts.filter(acc => {
      if (acc.isActive === false) return false;
      const matchesSearch = acc.name.includes(searchTerm) || acc.code.includes(searchTerm);
      const matchesType = selectedType === 'all' || acc.type === selectedType;
      return matchesSearch && matchesType;
    });

    filtered.forEach(acc => {
      if (grouped[acc.type]) {
        grouped[acc.type].push(acc);
      }
    });
    
    return grouped;
  }, [allAccounts, searchTerm, selectedType]);

  const getTypeName = (type: string) => {
    switch (type) {
      case 'asset': return 'الأصول (الموجودات)';
      case 'liability': return 'الخصوم (المطلوبات)';
      case 'equity': return 'حقوق الملكية';
      case 'revenue': return 'الإيرادات';
      case 'expense': return 'المصروفات';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'asset': return <Building2 className="w-4 h-4 text-blue-500" />;
      case 'liability': return <Briefcase className="w-4 h-4 text-red-500" />;
      case 'equity': return <Star className="w-4 h-4 text-purple-500" />;
      case 'revenue': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'expense': return <Clock className="w-4 h-4 text-orange-500" />;
      default: return <FolderTree className="w-4 h-4" />;
    }
  };

  // Determine what kind of entity is needed based on account code or name
  const getRequiredEntityType = (account: Account | null): EntityType => {
    if (!account) return 'none';
    if (account.requiredEntityType) return account.requiredEntityType;
    if (account.code === '103' || account.name.includes('طالب') || account.name.includes('رسوم')) return 'student';
    if (account.code === '104' || account.name.includes('أولياء')) return 'guardian';
    if (account.code === '105' || account.code === '106' || account.name.includes('موظف') || account.name.includes('معلم') || account.name.includes('رواتب')) return 'staff';
    return 'none';
  };

  const requiredEntity = getRequiredEntityType(selectedAccount);

  const handleConfirm = () => {
    if (!selectedAccount) return;
    
    if (requiredEntity !== 'none' && !selectedEntity) {
      // Should not be possible due to disabled button, but as a fallback
      return;
    }

    onSelect(selectedAccount, selectedEntity || { id: '', name: '', type: 'none' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" dir="rtl">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2">
              <FolderTree className="w-6 h-6 text-primary" /> 
              مستعرض دليل الحسابات الذكي
            </h2>
            <p className="text-sm text-muted-foreground mt-1 font-bold">ابحث، تصفح، واختر الحساب والوحدة المرتبطة لإتمام القيد</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground bg-background shadow-sm border border-border">
            ✕
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Tree Browser */}
          <div className="w-1/2 border-l border-border flex flex-col bg-background/50">
            <div className="p-4 border-b border-border space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="ابحث برقم أو اسم الحساب..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 bg-background border border-border rounded-xl pr-10 pl-4 font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'asset', 'liability', 'equity', 'revenue', 'expense'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      selectedType === type 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {type === 'all' ? 'الكل' : getTypeName(type)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {Object.entries(accountsByType).map(([type, accounts]) => {
                if (accounts.length === 0) return null;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-black text-muted-foreground sticky top-0 bg-background/95 backdrop-blur z-10 rounded-md">
                      {getTypeIcon(type)}
                      {getTypeName(type)}
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full mr-auto">{accounts.length}</span>
                    </div>
                    <div className="pr-4 space-y-1 border-r-2 border-border/50 mr-3 mt-1">
                      {accounts.map(account => (
                        <button
                          key={account.id}
                          onClick={() => {
                            setSelectedAccount(account);
                            setSelectedEntity(null);
                            setEntitySearch('');
                          }}
                          className={`w-full text-right flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                            selectedAccount?.id === account.id 
                              ? 'bg-primary/10 border border-primary/20 shadow-sm' 
                              : 'hover:bg-accent border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`font-mono text-xs px-2 py-1 rounded-md ${
                              selectedAccount?.id === account.id ? 'bg-primary text-primary-foreground' : 'bg-muted font-bold text-muted-foreground'
                            }`}>
                              {account.code}
                            </span>
                            <span className={`font-bold text-sm ${selectedAccount?.id === account.id ? 'text-primary' : ''}`}>
                              {account.name}
                            </span>
                          </div>
                          {getRequiredEntityType(account) !== 'none' && (
                            <span className="text-[10px] bg-accent text-muted-foreground px-2 py-1 rounded-md font-bold flex items-center gap-1">
                              {getRequiredEntityType(account) === 'student' ? <GraduationCap className="w-3 h-3"/> : <Users className="w-3 h-3"/>}
                              كيان مرتبط
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {allAccounts.filter(a => selectedType === 'all' || a.type === selectedType).length === 0 && (
                <div className="text-center py-10 text-muted-foreground font-bold">
                  لا توجد حسابات تطابق بحثك
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Account Details & Entity Selection */}
          <div className="w-1/2 flex flex-col bg-muted/10 relative">
            {!selectedAccount ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <FolderTree className="w-10 h-10 opacity-50" />
                </div>
                <h3 className="text-lg font-black mb-2 text-foreground">الرجاء اختيار حساب</h3>
                <p className="text-sm font-bold max-w-xs">قم باختيار حساب من القائمة الجانبية لعرض تفاصيله واختيار الوحدة المرتبطة به إن وجدت.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Account Info Card */}
                <div className="p-6 border-b border-border bg-card shrink-0">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-primary text-primary-foreground text-xs font-mono font-bold px-2 py-1 rounded-md">
                          {selectedAccount.code}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground bg-accent px-2 py-1 rounded-md flex items-center gap-1">
                          {getTypeIcon(selectedAccount.type)}
                          {getTypeName(selectedAccount.type)}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-foreground">{selectedAccount.name}</h3>
                    </div>
                  </div>
                  {selectedAccount.description && (
                    <p className="text-sm font-bold text-muted-foreground mb-4">
                      {selectedAccount.description}
                    </p>
                  )}
                </div>

                {/* Entity Selector */}
                <div className="flex-1 overflow-y-auto p-6">
                  {requiredEntity !== 'none' ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <div className="flex items-center gap-2 text-primary font-black mb-2">
                        {requiredEntity === 'student' ? <GraduationCap className="w-5 h-5" /> : 
                         requiredEntity === 'staff' ? <Briefcase className="w-5 h-5" /> : 
                         <Users className="w-5 h-5" />}
                        <h3>
                          {requiredEntity === 'student' ? 'تحديد الطالب المرتبط' : 
                           requiredEntity === 'staff' ? 'تحديد الموظف/المعلم المرتبط' : 
                           'تحديد ولي الأمر المرتبط'}
                        </h3>
                      </div>
                      
                      {/* Search Entity */}
                      <div className="relative">
                        <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input 
                          type="text" 
                          placeholder={`ابحث عن ${requiredEntity === 'student' ? 'طالب' : 'موظف'} بالاسم أو الرقم...`}
                          value={entitySearch}
                          onChange={(e) => setEntitySearch(e.target.value)}
                          className="w-full h-12 bg-card border-2 border-primary/20 rounded-xl pr-10 pl-4 font-bold focus:border-primary outline-none transition-all shadow-sm"
                        />
                      </div>

                      {/* Entity Results */}
                      <div className="space-y-2 mt-4">
                        {requiredEntity === 'student' && allStudents
                          .filter(s => s.name.includes(entitySearch) || s.id.includes(entitySearch))
                          .slice(0, 5)
                          .map(student => (
                            <button
                              key={student.id}
                              onClick={() => setSelectedEntity({ id: student.id, name: student.name, type: 'student', details: `الصف: ${student.grade}` })}
                              className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                                selectedEntity?.id === student.id 
                                  ? 'border-primary bg-primary/5 shadow-md' 
                                  : 'border-border bg-card hover:border-primary/50'
                              }`}
                            >
                              <div>
                                <p className="font-black text-foreground">{student.name}</p>
                                <p className="text-xs font-bold text-muted-foreground mt-1">
                                  رقم: <span className="font-mono">{student.id}</span> | الصف: {student.grade}
                                </p>
                              </div>
                              {selectedEntity?.id === student.id && <CheckCircle2 className="w-6 h-6 text-primary" />}
                            </button>
                        ))}

                        {requiredEntity === 'staff' && allStaff
                          .filter(s => s.name.includes(entitySearch) || s.id.includes(entitySearch))
                          .slice(0, 5)
                          .map(staff => (
                            <button
                              key={staff.id}
                              onClick={() => setSelectedEntity({ id: staff.id, name: staff.name, type: 'staff', details: staff.role })}
                              className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                                selectedEntity?.id === staff.id 
                                  ? 'border-primary bg-primary/5 shadow-md' 
                                  : 'border-border bg-card hover:border-primary/50'
                              }`}
                            >
                              <div>
                                <p className="font-black text-foreground">{staff.name}</p>
                                <p className="text-xs font-bold text-muted-foreground mt-1">
                                  الدور: {staff.role} | القسم: {staff.department}
                                </p>
                              </div>
                              {selectedEntity?.id === staff.id && <CheckCircle2 className="w-6 h-6 text-primary" />}
                            </button>
                        ))}

                        {requiredEntity === 'guardian' && allGuardians
                          .filter(g => g.name.includes(entitySearch) || g.id.includes(entitySearch))
                          .slice(0, 5)
                          .map(guardian => (
                            <button
                              key={guardian.id}
                              onClick={() => setSelectedEntity({ id: guardian.id, name: guardian.name, type: 'guardian', details: `هاتف: ${guardian.phone}` })}
                              className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                                selectedEntity?.id === guardian.id 
                                  ? 'border-primary bg-primary/5 shadow-md' 
                                  : 'border-border bg-card hover:border-primary/50'
                              }`}
                            >
                              <div>
                                <p className="font-black text-foreground">{guardian.name}</p>
                                <p className="text-xs font-bold text-muted-foreground mt-1">
                                  هاتف: <span className="font-mono" dir="ltr">{guardian.phone}</span> | المهنة: {guardian.profession || 'غير محدد'}
                                </p>
                              </div>
                              {selectedEntity?.id === guardian.id && <CheckCircle2 className="w-6 h-6 text-primary" />}
                            </button>
                        ))}
                      </div>

                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                      <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-black text-foreground mb-1">حساب عام جاهز للاستخدام</h3>
                      <p className="text-sm font-bold max-w-xs">هذا الحساب لا يتطلب ربطاً بكيان محدد (طالب أو موظف). يمكنك استخدامه مباشرة في القيد.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-card shrink-0 flex items-center justify-between">
          <div className="text-sm font-bold text-muted-foreground flex items-center gap-2">
            {selectedAccount && (
              <>
                تم اختيار: <span className="text-foreground bg-accent px-2 py-1 rounded-md">{selectedAccount.name}</span>
                {selectedEntity && (
                  <>
                    <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                    مرتبط بـ: <span className="text-primary bg-primary/10 px-2 py-1 rounded-md">{selectedEntity.name}</span>
                  </>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold hover:bg-accent transition-colors border border-border"
            >
              إلغاء
            </button>
            <button 
              onClick={handleConfirm}
              disabled={!selectedAccount || (requiredEntity !== 'none' && !selectedEntity)}
              className="px-8 py-2.5 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" /> 
              اعتماد الحساب
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
