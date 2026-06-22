import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { useGlobalStore } from "@/contexts/GlobalStoreContext";
import { Network, UserCircle2, ChevronDown, Search, ZoomIn, ZoomOut, Printer, Building2, GraduationCap, Users, Edit, Trash2, Plus, X } from "lucide-react";
import { useState, useMemo } from "react";
import { AdvancedPrintEngine, PrintTemplate } from "@/components/print-engine";
import { toast } from "sonner";

export const Route = createFileRoute("/hr/org-chart")({
  head: () => ({ meta: [{ title: "الهيكل التنظيمي | منصة مدارس" }] }),
  component: OrgChartPage,
});

function OrgNode({ 
  id,
  role, 
  name, 
  children, 
  department,
  avatar,
  isHighlighted = false,
  defaultOpen = true,
  onEdit,
  onDelete
}: { 
  id: string,
  role: string, 
  name: string, 
  children?: React.ReactNode,
  department?: string,
  avatar?: string,
  isHighlighted?: boolean,
  defaultOpen?: boolean,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const deptColor = useMemo(() => {
    if (department === "الإدارة العليا" || role.includes("مدير")) return "from-primary/20 to-primary/5 border-primary/50 text-primary";
    if (department === "الهيئة التعليمية") return "from-success/20 to-success/5 border-success/50 text-success";
    if (department === "الهيئة الإدارية") return "from-warning/20 to-warning/5 border-warning/50 text-warning";
    return "from-muted/50 to-muted/10 border-border text-foreground";
  }, [department, role]);

  return (
    <div className="flex flex-col items-center group/node">
      <div 
        className={`
          relative bg-gradient-to-b bg-card border-[1.5px] rounded-2xl p-4 shadow-sm min-w-[240px] max-w-[280px] text-center z-10 cursor-pointer 
          transition-all duration-300 hover:-translate-y-1 hover:shadow-md
          ${deptColor}
          ${isHighlighted ? 'ring-4 ring-primary ring-offset-2 ring-offset-background' : ''}
        `}
      >
        <div className="absolute top-2 right-2 flex gap-1">
          {department === "الهيئة التعليمية" && <GraduationCap className="w-4 h-4 opacity-50" />}
          {department === "الهيئة الإدارية" && <Building2 className="w-4 h-4 opacity-50" />}
          {(department === "الإدارة العليا" || role.includes("مدير")) && <Network className="w-4 h-4 opacity-50" />}
        </div>
        
        {/* Actions overlay visible on hover */}
        {id !== "pr-1" && (
          <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover/node:opacity-100 transition-opacity">
             <button onClick={(e) => { e.stopPropagation(); onEdit(id); }} className="p-1.5 bg-background/80 hover:bg-background rounded text-foreground backdrop-blur-sm border border-border shadow-sm"><Edit className="w-3 h-3" /></button>
             <button onClick={(e) => { e.stopPropagation(); onDelete(id); }} className="p-1.5 bg-danger/80 hover:bg-danger text-white rounded backdrop-blur-sm border border-danger shadow-sm"><Trash2 className="w-3 h-3" /></button>
          </div>
        )}

        <div onClick={() => setIsOpen(!isOpen)}>
          <div className="mx-auto w-14 h-14 bg-background border-2 border-current rounded-full flex items-center justify-center mb-3 shadow-inner overflow-hidden">
            {avatar ? (
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
              <UserCircle2 className="h-8 w-8 opacity-80" />
            )}
          </div>
          
          <div className="font-black text-base text-foreground mb-1">{name}</div>
          <div className="text-xs font-bold px-2 py-1 rounded-full bg-background/50 inline-block text-current mb-2 backdrop-blur-sm border border-current/10">
            {role}
          </div>
          
          {department && (
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{department}</div>
          )}
        </div>

        {children && (
          <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 bg-background border border-border rounded-full p-1 text-muted-foreground shadow-sm transition-transform duration-300 pointer-events-none ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronDown className="h-3 w-3" />
          </div>
        )}
      </div>
      
      <div className={`transition-all duration-500 origin-top overflow-hidden flex flex-col items-center ${isOpen ? 'max-h-[2000px] opacity-100 scale-y-100' : 'max-h-0 opacity-0 scale-y-0'}`}>
        {children && (
          <>
            <div className="w-px h-8 bg-border border-l-2 border-dashed border-border/50"></div>
            <div className="border-t-2 border-dashed border-border/50 flex justify-between relative" style={{ width: 'calc(100% - 240px)' }}>
              <div className="absolute top-0 left-0 w-px h-8 bg-border border-l-2 border-dashed border-border/50 -mt-[2px]"></div>
              <div className="absolute top-0 right-0 w-px h-8 bg-border border-l-2 border-dashed border-border/50 -mt-[2px]"></div>
            </div>
            <div className="flex gap-12 mt-8">
              {children}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OrgChartPage() {
  const { allStaff, addStaff, updateStaff, deleteStaff } = useGlobalStore();
  const [zoom, setZoom] = useState(1);
  const [searchQ, setSearchQ] = useState("");
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [filterDept, setFilterDept] = useState("all");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    department: "الهيئة التعليمية",
    status: "active" as any,
  });

  const management = allStaff.filter(s => s.department === "الإدارة العليا" && !s.isDeleted);
  const teachers = allStaff.filter(s => s.department === "الهيئة التعليمية" && !s.isDeleted);
  const admins = allStaff.filter(s => s.department === "الهيئة الإدارية" && !s.isDeleted);
  
  const principal = management.find(s => s.role.includes("مدير")) || { id: "pr-1", name: "شاغر", role: "مدير المدرسة", department: "الإدارة العليا" };
  const deputies = management.filter(s => !s.role.includes("مدير"));

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 1.5));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.5));
  const handleZoomReset = () => setZoom(1);

  const isHighlighted = (name: string, role: string) => {
    if (!searchQ) return false;
    const q = searchQ.toLowerCase();
    return name.toLowerCase().includes(q) || role.toLowerCase().includes(q);
  };

  const handleEdit = (id: string) => {
    const staff = allStaff.find(s => s.id === id);
    if (!staff) return;
    setEditingStaffId(id);
    setFormData({ name: staff.name, role: staff.role, department: staff.department, status: staff.status });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا الموظف؟")) {
      deleteStaff(id);
      toast.success("تم الحذف بنجاح");
    }
  };

  const handleAdd = () => {
    setEditingStaffId(null);
    setFormData({ name: "", role: "", department: "الهيئة التعليمية", status: "active" });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaffId) {
      updateStaff(editingStaffId, formData);
      toast.success("تم تحديث الموظف بنجاح");
    } else {
      addStaff({ ...formData, stage: "all" });
      toast.success("تم إضافة الموظف بنجاح");
    }
    setIsModalOpen(false);
  };

  const printTemplates: PrintTemplate[] = [
    {
      id: "org_chart_list", name: "قائمة موظفي الهيكل التنظيمي", category: "الموارد البشرية", type: "table",
      columns: [
        { key: "name", label: "الاسم" },
        { key: "role", label: "المسمى الوظيفي" },
        { key: "department", label: "القسم" },
      ]
    }
  ];

  return (
    <AppShell 
      breadcrumb={[{ label: "الرئيسية", to: "/" }, { label: "الموارد البشرية" }, { label: "الهيكل التنظيمي" }]}
      actions={
        <div className="flex gap-2">
          <button onClick={handleAdd} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all">
            <Plus className="h-4 w-4" /> إضافة موظف
          </button>
          <button onClick={() => setIsPrintOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-bold shadow-sm hover:bg-accent transition-all">
            <Printer className="h-4 w-4" /> طباعة الهيكل / تصدير
          </button>
        </div>
      }
    >
      <div className="space-y-6 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 text-primary p-2.5 rounded-xl shadow-inner">
                <Network className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-black">الهيكل التنظيمي التفاعلي المتقدم</h1>
            </div>
            <p className="text-sm font-bold text-muted-foreground">استعرض تسلسل الصلاحيات، الكوادر، الأقسام، مع إمكانية التعديل والإضافة المباشرة</p>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:min-w-[250px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="ابحث عن موظف أو منصب..." 
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="w-full pl-3 pr-9 py-2 bg-background border border-input rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
              />
            </div>
            <select 
              value={filterDept} 
              onChange={e => setFilterDept(e.target.value)}
              className="bg-background border border-input rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            >
              <option value="all">كل الأقسام</option>
              <option value="الإدارة العليا">الإدارة العليا</option>
              <option value="الهيئة التعليمية">الهيئة التعليمية</option>
              <option value="الهيئة الإدارية">الهيئة الإدارية</option>
            </select>
          </div>
        </div>

        <PageCard className="relative overflow-hidden bg-dot-pattern bg-[size:20px_20px]">
          {/* Controls Overlay */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-background/80 backdrop-blur border border-border p-1.5 rounded-xl shadow-md">
            <button onClick={handleZoomIn} className="p-2 hover:bg-accent rounded-lg text-foreground transition-colors" title="تكبير">
              <ZoomIn className="h-5 w-5" />
            </button>
            <div className="w-full h-px bg-border my-0.5"></div>
            <button onClick={handleZoomReset} className="p-2 hover:bg-accent rounded-lg text-foreground font-black text-xs text-center transition-colors" title="استعادة الحجم الأصلي">
              {Math.round(zoom * 100)}%
            </button>
            <div className="w-full h-px bg-border my-0.5"></div>
            <button onClick={handleZoomOut} className="p-2 hover:bg-accent rounded-lg text-foreground transition-colors" title="تصغير">
              <ZoomOut className="h-5 w-5" />
            </button>
          </div>

          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <Badge tone="primary" className="shadow-sm backdrop-blur-md bg-primary/20"><Network className="w-3 h-3 ml-1"/> إدارة عليا</Badge>
            <Badge tone="success" className="shadow-sm backdrop-blur-md bg-success/20"><GraduationCap className="w-3 h-3 ml-1"/> تعليمية</Badge>
            <Badge tone="warning" className="shadow-sm backdrop-blur-md bg-warning/20"><Building2 className="w-3 h-3 ml-1"/> إدارية</Badge>
          </div>

          <div 
            className="w-full min-h-[700px] overflow-auto custom-scrollbar flex justify-center items-start pt-16 pb-24"
            style={{ 
              backgroundImage: 'radial-gradient(circle, var(--color-border) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          >
            <div 
              className="transition-transform duration-300 origin-top flex justify-center" 
              style={{ transform: `scale(${zoom})` }}
            >
              <OrgNode 
                id={principal.id}
                role={principal.role} 
                name={principal.name} 
                department={principal.department}
                isHighlighted={isHighlighted(principal.name, principal.role)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              >
                 {deputies.map(dep => (
                   <div key={dep.id} className="flex flex-col items-center">
                     <div className="w-px h-8 bg-border border-l-2 border-dashed border-border/50 mb-[-2px]"></div>
                     <OrgNode 
                       id={dep.id}
                       role={dep.role} 
                       name={dep.name} 
                       department={dep.department}
                       isHighlighted={isHighlighted(dep.name, dep.role)}
                       onEdit={handleEdit}
                       onDelete={handleDelete}
                     >
                        
                        {dep.role.includes("شؤون الطلاب") && (filterDept === "all" || filterDept === "الهيئة التعليمية") ? (
                          <div className="flex flex-col items-center">
                             <div className="w-px h-8 bg-border border-l-2 border-dashed border-border/50 mb-[-2px]"></div>
                             <OrgNode id="node-edu" role="إدارة المعلمين" name={`الهيئة التعليمية (${teachers.length})`} department="الهيئة التعليمية" defaultOpen={false} onEdit={()=>{}} onDelete={()=>{}}>
                               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 bg-card/50 p-6 rounded-3xl border border-border shadow-inner backdrop-blur-sm">
                                 {teachers.map(t => (
                                   <div key={t.id} className="flex flex-col items-center group/smallnode">
                                     <div className={`
                                       relative bg-background border-2 rounded-xl p-3 text-center text-xs w-40 shadow-sm transition-all hover:scale-105 hover:shadow-md cursor-pointer
                                       ${isHighlighted(t.name, t.role) ? 'border-primary ring-2 ring-primary/50' : 'border-border hover:border-success/50'}
                                     `}>
                                       <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover/smallnode:opacity-100 transition-opacity">
                                          <button onClick={(e) => { e.stopPropagation(); handleEdit(t.id); }} className="p-1 bg-background/80 hover:bg-background rounded text-foreground backdrop-blur-sm border border-border shadow-sm"><Edit className="w-3 h-3" /></button>
                                          <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="p-1 bg-danger/80 hover:bg-danger text-white rounded backdrop-blur-sm border border-danger shadow-sm"><Trash2 className="w-3 h-3" /></button>
                                       </div>
                                       <div className="mx-auto w-10 h-10 bg-success/10 text-success rounded-full flex items-center justify-center mb-2">
                                          <Users className="w-5 h-5" />
                                       </div>
                                       <div className="font-bold mb-1">{t.name}</div>
                                       <div className="text-muted-foreground text-[10px] bg-muted px-2 py-0.5 rounded-full inline-block">{t.role}</div>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             </OrgNode>
                          </div>
                        ) : dep.role.includes("شؤون إدارية") && (filterDept === "all" || filterDept === "الهيئة الإدارية") ? (
                          <div className="flex flex-col items-center">
                             <div className="w-px h-8 bg-border border-l-2 border-dashed border-border/50 mb-[-2px]"></div>
                             <OrgNode id="node-adm" role="إدارة الموظفين" name={`الهيئة الإدارية (${admins.length})`} department="الهيئة الإدارية" defaultOpen={false} onEdit={()=>{}} onDelete={()=>{}}>
                               <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-card/50 p-6 rounded-3xl border border-border shadow-inner backdrop-blur-sm">
                                 {admins.map(a => (
                                   <div key={a.id} className="flex flex-col items-center group/smallnode">
                                     <div className={`
                                       relative bg-background border-2 rounded-xl p-3 text-center text-xs w-40 shadow-sm transition-all hover:scale-105 hover:shadow-md cursor-pointer
                                       ${isHighlighted(a.name, a.role) ? 'border-primary ring-2 ring-primary/50' : 'border-border hover:border-warning/50'}
                                     `}>
                                       <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover/smallnode:opacity-100 transition-opacity">
                                          <button onClick={(e) => { e.stopPropagation(); handleEdit(a.id); }} className="p-1 bg-background/80 hover:bg-background rounded text-foreground backdrop-blur-sm border border-border shadow-sm"><Edit className="w-3 h-3" /></button>
                                          <button onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }} className="p-1 bg-danger/80 hover:bg-danger text-white rounded backdrop-blur-sm border border-danger shadow-sm"><Trash2 className="w-3 h-3" /></button>
                                       </div>
                                       <div className="mx-auto w-10 h-10 bg-warning/10 text-warning rounded-full flex items-center justify-center mb-2">
                                          <Building2 className="w-5 h-5" />
                                       </div>
                                       <div className="font-bold mb-1">{a.name}</div>
                                       <div className="text-muted-foreground text-[10px] bg-muted px-2 py-0.5 rounded-full inline-block">{a.role}</div>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             </OrgNode>
                          </div>
                        ) : null}

                     </OrgNode>
                   </div>
                 ))}
              </OrgNode>
            </div>
          </div>
        </PageCard>
      </div>

      <AdvancedPrintEngine 
        isOpen={isPrintOpen} 
        onClose={() => setIsPrintOpen(false)} 
        title="تقرير موظفي الهيكل التنظيمي" 
        data={allStaff} 
        templates={printTemplates} 
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
               <h2 className="text-xl font-bold">{editingStaffId ? "تعديل بيانات الموظف" : "إضافة موظف للهيكل"}</h2>
               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-accent rounded-full text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-bold block mb-1">الاسم رباعي</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-xl border border-input bg-background px-4 py-2" />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1">المسمى الوظيفي</label>
                <input required type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full rounded-xl border border-input bg-background px-4 py-2" />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1">القسم</label>
                <select required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full rounded-xl border border-input bg-background px-4 py-2">
                  <option value="الإدارة العليا">الإدارة العليا</option>
                  <option value="الهيئة التعليمية">الهيئة التعليمية</option>
                  <option value="الهيئة الإدارية">الهيئة الإدارية</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border border-border font-bold">إلغاء</button>
                 <button type="submit" className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90">{editingStaffId ? "حفظ التعديلات" : "إضافة"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
