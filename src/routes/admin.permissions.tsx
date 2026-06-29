import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { ShieldCheck, Save, Plus, Trash2, CheckCircle2, Search, LockKeyhole } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";

export const Route = createFileRoute("/admin/permissions")({
  head: () => ({ meta: [{ title: "منشئ الصلاحيات الديناميكي | منصة مدارس" }] }),
  component: RBACBuilderPage,
});

type PermissionModule = "الطلاب" | "المالية" | "الموارد البشرية" | "النقل المدرسي" | "المكتبة والكتب" | "المرافق" | "الإدارة الأكاديمية" | "الاختبارات" | "الطباعة" | "API والتكاملات" | "الإعدادات";
type PermissionAction = "قراءة" | "إضافة" | "تعديل" | "حذف" | "اعتماد" | "تصدير";

interface RoleDef {
  id: string;
  name: string;
  permissions: Record<PermissionModule, PermissionAction[]>;
}

const MODULES: PermissionModule[] = ["الطلاب", "المالية", "الموارد البشرية", "النقل المدرسي", "المكتبة والكتب", "المرافق", "الإدارة الأكاديمية", "الاختبارات", "الطباعة", "API والتكاملات", "الإعدادات"];
const ACTIONS: PermissionAction[] = ["قراءة", "إضافة", "تعديل", "حذف", "اعتماد", "تصدير"];

const DEFAULT_ROLES: RoleDef[] = [
  {
    id: "r1",
    name: "مدير النظام (Super Admin)",
    permissions: MODULES.reduce((acc, m) => ({ ...acc, [m]: ACTIONS }), {} as any)
  },
  {
    id: "r2",
    name: "محاسب مالي",
    permissions: {
      "الطلاب": ["قراءة"],
      "المالية": ["قراءة", "إضافة", "تعديل", "اعتماد"],
      "الموارد البشرية": ["قراءة"],
      "المرافق": [],
      "الإدارة الأكاديمية": [],
      "الإعدادات": []
    } as any
  }
];

function RBACBuilderPage() {
  const { addActivityLog } = useGlobalStore();

  const [roles, setRoles] = useState<RoleDef[]>(() => {
    try {
      const saved = localStorage.getItem("darasi_rbac_roles");
      if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore */ }
    return DEFAULT_ROLES;
  });
  const [activeRoleId, setActiveRoleId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("darasi_rbac_roles");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0].id;
      }
    } catch (e) { /* ignore */ }
    return DEFAULT_ROLES[0].id;
  });
  const [moduleSearch, setModuleSearch] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const activeRole = roles.find(r => r.id === activeRoleId);
  const visibleModules = MODULES.filter(module => module.includes(moduleSearch.trim()));
  const activePermCount = activeRole
    ? Object.values(activeRole.permissions).reduce((sum, actions) => sum + actions.length, 0)
    : 0;
  const maxPermCount = MODULES.length * ACTIONS.length;

  const handleTogglePermission = (module: PermissionModule, action: PermissionAction) => {
    setRoles(prev => prev.map(r => {
      if (r.id !== activeRoleId) return r;
      const currentModulePerms = r.permissions[module] || [];
      const newModulePerms = currentModulePerms.includes(action)
        ? currentModulePerms.filter(a => a !== action)
        : [...currentModulePerms, action];
      return {
        ...r,
        permissions: { ...r.permissions, [module]: newModulePerms }
      };
    }));
    setHasUnsavedChanges(true);
  };

  const handleAddRole = () => {
    const newRole: RoleDef = {
      id: `r${Date.now()}`,
      name: "دور مخصص جديد",
      permissions: MODULES.reduce((acc, m) => ({ ...acc, [m]: [] }), {} as any)
    };
    setRoles([...roles, newRole]);
    setActiveRoleId(newRole.id);
    setHasUnsavedChanges(true);
  };

  const handleDuplicateRole = (id: string) => {
    const roleToCopy = roles.find(r => r.id === id);
    if (!roleToCopy) return;
    const newRole: RoleDef = {
      id: `r${Date.now()}`,
      name: `${roleToCopy.name} (نسخة)`,
      permissions: JSON.parse(JSON.stringify(roleToCopy.permissions))
    };
    setRoles([...roles, newRole]);
    setActiveRoleId(newRole.id);
    setHasUnsavedChanges(true);
    toast.success("تم نسخ الصلاحيات وتكرار الدور بنجاح");
  };

  const handleDeleteRole = (id: string) => {
    if (roles.length === 1) return toast.error("لا يمكن حذف الدور الأخير");
    setRoles(roles.filter(r => r.id !== id));
    if (activeRoleId === id) setActiveRoleId(roles[0].id);
    setHasUnsavedChanges(true);
    toast.success("تم حذف الدور");
  };

  return (
    <AppShell breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الإدارة العامة" }, { label: "منشئ الصلاحيات (RBAC)" }]}>
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="bg-primary/10 text-primary p-3 rounded-xl">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">منشئ الصلاحيات (RBAC Builder)</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">تخصيص الصلاحيات الدقيقة لكل دور في النظام</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          <PageCard title="الأدوار المتاحة" className="lg:col-span-1 border-primary/20 bg-card">
             <div className="space-y-2">
                {roles.map(role => (
                   <div 
                     key={role.id}
                     onClick={() => setActiveRoleId(role.id)}
                     className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center ${activeRoleId === role.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent hover:bg-muted/50'}`}
                   >
                     <span className={`font-bold text-sm ${activeRoleId === role.id ? 'text-primary' : ''}`}>{role.name}</span>
                     {activeRoleId === role.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                   </div>
                ))}
             </div>
             <button onClick={handleAddRole} className="w-full mt-4 flex items-center justify-center gap-2 py-2 border border-dashed border-primary text-primary rounded-lg text-sm font-bold hover:bg-primary/5 transition-colors">
               <Plus className="w-4 h-4" /> إنشاء دور جديد
             </button>
          </PageCard>

          <PageCard title={`صلاحيات دور: ${activeRole?.name}`} className="lg:col-span-3">
             {activeRole && (
               <div className="space-y-6">
                 <div className="flex items-center gap-4 border-b border-border pb-4">
                    <input 
                      type="text" 
                      value={activeRole.name}
                      onChange={(e) => setRoles(roles.map(r => r.id === activeRoleId ? { ...r, name: e.target.value } : r))}
                      className="flex-1 font-bold text-lg bg-transparent border-b border-dashed border-muted-foreground/50 focus:border-primary outline-none px-2 py-1"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleDuplicateRole(activeRole.id)} className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors font-bold text-sm flex items-center gap-1">
                        نسخ الدور
                      </button>
                      <button onClick={() => handleDeleteRole(activeRole.id)} className="text-danger hover:bg-danger/10 p-2 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                 </div>

                 <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="text-xs font-bold text-muted-foreground">الصلاحيات المفعلة</div>
                    <div className="mt-1 text-2xl font-black text-primary">{activePermCount}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="text-xs font-bold text-muted-foreground">نسبة الوصول</div>
                    <div className="mt-1 text-2xl font-black">{Math.round((activePermCount / maxPermCount) * 100)}%</div>
                  </div>
                  <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-danger"><LockKeyhole className="h-4 w-4" /> عمليات حساسة</div>
                    <div className="mt-1 text-xs text-muted-foreground">الحذف، الاعتماد والتصدير تظهر باللون الأحمر.</div>
                  </div>
                 </div>

                 <div className="relative">
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={moduleSearch} onChange={event => setModuleSearch(event.target.value)} placeholder="بحث في الوحدات..." className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
                 </div>

                 <div className="overflow-x-auto rounded-xl border border-border">
                   <table className="w-full text-sm text-right">
                     <thead className="bg-muted/50 border-b border-border">
                       <tr>
                         <th className="px-4 py-3 font-bold text-muted-foreground">الوحدة (Module)</th>
                         {ACTIONS.map(a => <th key={a} className="px-4 py-3 font-bold text-muted-foreground text-center">{a}</th>)}
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-border">
                       {visibleModules.map(module => (
                         <tr key={module} className="hover:bg-muted/30 transition-colors">
                           <td className="px-4 py-4 font-bold">{module}</td>
                           {ACTIONS.map(action => {
                             const hasPerm = activeRole.permissions[module]?.includes(action);
                             const isCritical = action === "حذف" || action === "اعتماد" || action === "تصدير";
                             return (
                               <td key={action} className="px-4 py-4 text-center">
                                 <label className="inline-flex relative items-center cursor-pointer">
                                   <input 
                                     type="checkbox" 
                                     className="sr-only peer" 
                                     checked={hasPerm}
                                     onChange={() => handleTogglePermission(module, action)}
                                   />
                                   <div className={`w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${isCritical ? 'peer-checked:bg-danger' : 'peer-checked:bg-primary'}`}></div>
                                 </label>
                               </td>
                             )
                           })}
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>

                  <div className="flex justify-end gap-2 pt-4">
                    {hasUnsavedChanges && (
                      <span className="flex items-center gap-1 text-xs font-bold text-warning-foreground ml-auto">● تغييرات غير محفوظة</span>
                    )}
                    <button onClick={() => {
                      localStorage.setItem("darasi_rbac_roles", JSON.stringify(roles));
                      setHasUnsavedChanges(false);
                      addActivityLog({ user: "مدير النظام", action: "اعتماد صلاحيات", entity: "مصفوفة الصلاحيات (RBAC)", details: `تم حفظ صلاحيات ${roles.length} أدوار بنجاح` });
                      toast.success("تم حفظ مصفوفة الصلاحيات بنجاح");
                    }} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-md">
                      <Save className="w-4 h-4" /> تطبيق وحفظ الصلاحيات
                    </button>
                  </div>
               </div>
             )}
          </PageCard>

        </div>
      </div>
    </AppShell>
  );
}
