import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { 
  Search, 
  Users, 
  Settings, 
  Briefcase, 
  Wrench, 
  Shield, 
  CreditCard,
  PanelRightOpen,
  PanelRightClose,
  Maximize2,
  Minimize2,
  GraduationCap,
  Sparkles,
  Sun,
  Moon,
  ChevronLeft
} from 'lucide-react';
import { useGlobalStore } from '@/contexts/GlobalStoreContext';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [deferredQuery, setDeferredQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const globalStore = useGlobalStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    const onCustomOpen = () => setIsOpen(true);

    document.addEventListener('keydown', down);
    document.addEventListener('open-command-palette', onCustomOpen);
    
    return () => {
      document.removeEventListener('keydown', down);
      document.removeEventListener('open-command-palette', onCustomOpen);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setDeferredQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredQuery(query);
      setSelectedIndex(0);
    }, 100);
    return () => clearTimeout(timer);
  }, [query]);

  // Static quick actions and main sections
  const systemActions = [
    { 
      id: 'sidebar-exp', 
      category: 'التحكم في العرض',
      title: 'الشريط الجانبي: الوضع الكامل (Expanded)', 
      icon: PanelRightOpen, 
      action: () => {
        localStorage.setItem("darasi_sidebar_mode", "expanded");
        window.dispatchEvent(new Event("storage"));
      }, 
      keywords: 'sidebar expand شريط كامل عرض' 
    },
    { 
      id: 'sidebar-rail', 
      category: 'التحكم في العرض',
      title: 'الشريط الجانبي: وضع الأيقونات (Rail)', 
      icon: Minimize2, 
      action: () => {
        localStorage.setItem("darasi_sidebar_mode", "rail");
        window.dispatchEvent(new Event("storage"));
      }, 
      keywords: 'sidebar rail ايقونات مصغر مدمج' 
    },
    { 
      id: 'sidebar-full', 
      category: 'التحكم في العرض',
      title: 'الشريط الجانبي: وضع ملء الشاشة (Zen)', 
      icon: Maximize2, 
      action: () => {
        localStorage.setItem("darasi_sidebar_mode", "fullscreen");
        window.dispatchEvent(new Event("storage"));
      }, 
      keywords: 'sidebar fullscreen كامل شاشة إخفاء' 
    },
  ];

  const staticCommands = [
    { id: '1', category: 'الأقسام الرئيسية', title: 'لوحة التحكم الرئيسية', icon: Sparkles, to: '/', keywords: 'home dashboard رئيسية لوحة' },
    { id: 'sup-1', category: 'الحضور وتطبيقات المشرفين', title: 'بوابة المشرفين الميدانيين', icon: Shield, to: '/supervisor', keywords: 'supervisor مشرفين حضور ميداني بوابة' },
    { id: 'sup-2', category: 'الحضور وتطبيقات المشرفين', title: 'تطبيق رصد حضور الفصول (للهاتف)', icon: Users, to: '/supervisor/classes', keywords: 'supervisor classes فصول غياب رصد هاتف سريع طلاب' },
    { id: 'sup-3', category: 'الحضور وتطبيقات المشرفين', title: 'بوابة تحضير العمال والكادر', icon: Briefcase, to: '/supervisor/gate', keywords: 'gate عمال نظافة حراس أمن صيانة سائقين استقبال بوابة' },
    { id: '2', category: 'الأقسام الرئيسية', title: 'سجل الطلاب والتسجيل', icon: Users, to: '/students', keywords: 'students طلاب تسجيل جديد' },
    { id: '3', category: 'الأقسام الرئيسية', title: 'المركز المالي والحسابات', icon: CreditCard, to: '/finance', keywords: 'finance مالية رسوم سندات خزينة' },
    { id: '4', category: 'الأقسام الرئيسية', title: 'شؤون الموظفين والرواتب', icon: Briefcase, to: '/hr/dashboard', keywords: 'hr موظفين رواتب إجازات' },
    { id: '5', category: 'الأقسام الرئيسية', title: 'الإدارة الأكاديمية والصفوف', icon: GraduationCap, to: '/academic/classes', keywords: 'academic صفوف مواد اسناد' },
    { id: '6', category: 'الأقسام الرئيسية', title: 'المرافق والصيانة', icon: Wrench, to: '/facilities/dashboard', keywords: 'facilities صيانة مرافق مستودعات' },
    { id: '7', category: 'الأقسام الرئيسية', title: 'إعدادات النظام المركزية', icon: Settings, to: '/settings', keywords: 'settings اعدادات إعدادات تخصيص' },
  ];

  // Dynamic search from GlobalStore
  const dynamicCommands: any[] = [];
  
  if (deferredQuery.length > 0) {
    const q = deferredQuery.toLowerCase();
    
    // Search Students
    let count = 0;
    for (let i = 0; i < (globalStore.allStudents || []).length; i++) {
      if (count >= 4) break;
      const s = globalStore.allStudents[i];
      if (s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || (s.nationalId && s.nationalId.includes(q))) {
        dynamicCommands.push({ 
          id: `stu-${s.id}`, 
          category: 'الطلاب',
          title: `الطالب: ${s.name} (${s.grade || 'طالب'})`, 
          icon: Users, 
          to: `/students/${s.id}`, 
          keywords: '' 
        });
        count++;
      }
    }
    
    // Search Staff
    count = 0;
    for (let i = 0; i < (globalStore.allStaff || []).length; i++) {
      if (count >= 3) break;
      const s = globalStore.allStaff[i];
      if (s.name.toLowerCase().includes(q) || (s.role && s.role.toLowerCase().includes(q))) {
        dynamicCommands.push({ 
          id: `staff-${s.id}`, 
          category: 'الكادر التعليمي والإداري',
          title: `الموظف: ${s.name} — ${s.role}`, 
          icon: Briefcase, 
          to: `/hr/staff/${s.id}`, 
          keywords: '' 
        });
        count++;
      }
    }
    
    // Search Rooms
    count = 0;
    const rooms = globalStore.allRooms || [];
    for (let i = 0; i < rooms.length; i++) {
      if (count >= 2) break;
      const r = rooms[i];
      if (r.name.toLowerCase().includes(q) || (r.type && r.type.toLowerCase().includes(q))) {
        dynamicCommands.push({ 
          id: `room-${r.id}`, 
          category: 'المرافق والقاعات',
          title: `المرفق: ${r.name} (${r.type})`, 
          icon: Wrench, 
          to: `/facilities/rooms`, 
          keywords: '' 
        });
        count++;
      }
    }
  }

  const allCommands = [...systemActions, ...staticCommands, ...dynamicCommands].filter(cmd => {
    if (!deferredQuery) return true;
    const q = deferredQuery.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) || 
      (cmd.keywords && cmd.keywords.toLowerCase().includes(q)) ||
      cmd.category.toLowerCase().includes(q)
    );
  }).slice(0, 12);

  const handleSelect = (item: any) => {
    setIsOpen(false);
    if (item.action) {
      item.action();
    } else if (item.to) {
      navigate({ to: item.to });
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(allCommands.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allCommands.length) % Math.max(allCommands.length, 1));
    } else if (e.key === 'Enter' && allCommands[selectedIndex]) {
      e.preventDefault();
      handleSelect(allCommands[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[999] flex items-start justify-center pt-[10vh] sm:pt-[15vh] bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200 p-4" 
      onClick={() => setIsOpen(false)} 
      dir="rtl"
    >
      <div 
        className="w-full max-w-xl bg-card/98 dark:bg-card/95 backdrop-blur-2xl border border-border/80 shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-border/60 bg-muted/30 gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground/60 text-foreground"
            placeholder="ابحث عن صفحات، طلاب، موظفين، أو أوامر تحكم... (Esc للإلغاء)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="text-[10px] font-extrabold text-muted-foreground border border-border/60 bg-muted/80 px-2.5 py-1 rounded-xl shrink-0">
            ESC
          </div>
        </div>
        
        {/* Command List */}
        <div className="overflow-y-auto custom-scrollbar-modal p-2 space-y-1 max-h-[420px]">
          {allCommands.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <Search className="w-8 h-8 opacity-30" />
              <span>لا توجد نتائج مطابقة لبحثك.</span>
            </div>
          ) : (
            allCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold text-right transition-all duration-150 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm scale-[0.99]'
                      : 'hover:bg-accent text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl transition-colors shrink-0 ${
                      isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-foreground'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-extrabold">{cmd.title}</div>
                      <div className={`text-[10px] truncate ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {cmd.category}
                      </div>
                    </div>
                  </div>
                  <ChevronLeft className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? '-translate-x-1' : 'opacity-40'}`} />
                </button>
              );
            })
          )}
        </div>
        
        {/* Footer shortcuts hint */}
        <div className="border-t border-border p-2.5 bg-muted/20 flex items-center gap-4 text-[11px] text-muted-foreground font-semibold justify-center">
           <span>↑↓ للتنقل</span>
           <span>•</span>
           <span>Enter للاختيار</span>
           <span>•</span>
           <span>Ctrl+B لتبديل الشريط الجانبي</span>
        </div>
      </div>
    </div>
  );
}
