import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard } from "@/components/app-shell";
import { ShieldCheck, Save, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/permissions")({
  head: () => ({ meta: [{ title: "منشئ الصلاحيات الديناميكي | منصة مدارس" }] }),
  component: RBACBuilderPage,
});

type PermissionModule = "الطلاب" | "المالية" | "الموارد البشرية" | "المرافق" | "الإدارة الأكاديمية" | "الإعدادات";
type PermissionAction = "قراءة" | "إضافة" | "تعديل" | "حذف" | "اعتماد";

interface RoleDef {
  id: string;
  name: string;
  permissions: Record<PermissionModule, PermissionAction[]>;
}

const MODULES: PermissionModule[] = ["الطلاب", "المالية", "الموارد البشرية", "المرافق", "الإدارة الأكاديمية", "الإعدادات"];
const ACTIONS: PermissionAction[] = ["قراءة", "إضافة", "تعديل", "حذف", "اعتماد"];

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
  const [roles, setRoles] = useState<RoleDef[]>(DEFAULT_ROLES);
  const [activeRoleId, setActiveRoleId] = useState<string>(DEFAULT_ROLES[0].id);

  const activeRole = roles.find(r => r.id === activeRoleId);

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
  };

  const handleAddRole = () => {
    const newRole: RoleDef = {
      id: `r${Date.now()}`,
      name: "دور مخصص جديد",
      permissions: MODULES.reduce((acc, m) => ({ ...acc, [m]: [] }), {} as any)
    };
    setRoles([...roles, newRole]);
    setActiveRoleId(newRole.id);
  };

  const handleDeleteRole = (id: string) => {
    if (roles.length === 1) return toast.error("لا يمكن حذف الدور الأخير");
    setRoles(roles.filter(r => r.id !== id));
    if (activeRoleId === id) setActiveRoleId(roles[0].id);
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
                    <button onClick={() => handleDeleteRole(activeRole.id)} className="text-danger hover:bg-danger/10 p-2 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                       {MODULES.map(module => (
                         <tr key={module} className="hover:bg-muted/30 transition-colors">
                           <td className="px-4 py-4 font-bold">{module}</td>
                           {ACTIONS.map(action => {
                             const hasPerm = activeRole.permissions[module]?.includes(action);
                             return (
                               <td key={action} className="px-4 py-4 text-center">
                                 <label className="inline-flex relative items-center cursor-pointer">
                                   <input 
                                     type="checkbox" 
                                     className="sr-only peer" 
                                     checked={hasPerm}
                                     onChange={() => handleTogglePermission(module, action)}
                                   />
                                   <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
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
                   <button onClick={() => toast.success("تم حفظ مصفوفة الصلاحيات بنجاح")} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-md">
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
