import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search, Calculator, Calendar, Users, Settings, Briefcase, Wrench, Shield, CreditCard } from 'lucide-react';
import { useGlobalStore } from '@/contexts/GlobalStoreContext';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
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
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Static routes
  const staticCommands = [
    { id: '1', title: 'لوحة التحكم الإدارية', icon: Shield, to: '/admin/dashboard', keywords: 'admin dashboard إدارة' },
    { id: '2', title: 'إعدادات النظام المركزية', icon: Settings, to: '/settings', keywords: 'settings اعدادات إعدادات' },
    { id: '3', title: 'المرافق والخدمات', icon: Wrench, to: '/facilities/dashboard', keywords: 'facilities صيانة مرافق' },
    { id: '4', title: 'الموارد البشرية (HR)', icon: Briefcase, to: '/hr/dashboard', keywords: 'hr موظفين رواتب' },
    { id: '5', title: 'السجل المالي', icon: CreditCard, to: '/finance', keywords: 'finance مالية رسوم' },
  ];

  // Dynamic search from GlobalStore
  const dynamicCommands: any[] = [];
  
  if (query.length > 1) {
    // Search Students
    globalStore.allStudents.forEach(s => {
      if (s.name.includes(query) || s.id.includes(query)) {
        dynamicCommands.push({ id: `stu-${s.id}`, title: `الطالب: ${s.name}`, icon: Users, to: `/students/${s.id}`, keywords: '' });
      }
    });
    // Search Staff
    globalStore.allStaff.forEach(s => {
       if (s.name.includes(query) || s.id.includes(query)) {
         dynamicCommands.push({ id: `staff-${s.id}`, title: `الموظف: ${s.name} (${s.role})`, icon: Briefcase, to: `/hr/evaluations`, keywords: '' });
       }
    });
    // Search Rooms
    globalStore.allRooms?.forEach(r => {
       if (r.name.includes(query) || r.type.includes(query)) {
         dynamicCommands.push({ id: `room-${r.id}`, title: `المرفق: ${r.name}`, icon: Wrench, to: `/facilities/rooms`, keywords: '' });
       }
    });
  }

  const allCommands = [...staticCommands, ...dynamicCommands].filter(cmd => {
    if (!query) return staticCommands.includes(cmd); // show static by default
    const q = query.toLowerCase();
    return cmd.title.toLowerCase().includes(q) || cmd.keywords.includes(q);
  }).slice(0, 8); // limit results

  const handleSelect = (to: string) => {
    setIsOpen(false);
    navigate({ to });
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh] sm:pt-[20vh] bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} dir="rtl">
      <div 
        className="w-full max-w-xl bg-background/80 backdrop-blur-xl rounded-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)] border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            className="flex h-14 w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
            placeholder="ابحث عن صفحات، طلاب، موظفين... (أو اضغط Esc للإلغاء)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="text-[10px] font-bold text-muted-foreground border px-1.5 py-0.5 rounded shrink-0">ESC</div>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
          {allCommands.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة لبحثك.</div>
          ) : (
            <div className="space-y-1">
              {allCommands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => handleSelect(cmd.to)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold text-right hover:bg-primary hover:text-primary-foreground transition-all duration-200 focus:bg-primary focus:text-primary-foreground focus:outline-none group"
                  >
                    <div className="bg-muted group-hover:bg-primary-foreground/20 p-2 rounded-lg transition-colors"><Icon className="w-4 h-4 opacity-70 group-hover:opacity-100" /></div>
                    {cmd.title}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="border-t border-border p-2 bg-muted/30 flex items-center gap-4 text-xs text-muted-foreground font-medium justify-center">
           <span>استخدم الأسهم للتنقل</span>
           <span>•</span>
           <span>Enter للاختيار</span>
        </div>
      </div>
    </div>
  );
}
