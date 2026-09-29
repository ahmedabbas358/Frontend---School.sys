import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore, StaffContract } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { ArabicDatePicker } from "@/components/ui/arabic-date-picker";
import { 
  FileBadge, Plus, Calendar, Settings, Search, Printer, 
  Trash2, Edit2, RefreshCw, X, AlertCircle, FileText, 
  QrCode, CheckCircle2, ShieldCheck, DollarSign, Clock, User
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/hr/contracts")({
  head: () => ({ meta: [{ title: "إدارة العقود والوثائق الرسمية | منصة مدارس" }] }),
  component: ContractsPage,
});

const contractTypeLabels: Record<string, string> = {
  full_time: "دوام كامل (سنوي)",
  part_time: "دوام جزئي",
  contractor: "عقد مقاولة / بالساعة",
};

const contractStatusLabels: Record<string, string> = {
  active: "ساري ومعتمد",
  renewing: "قيد التجديد",
  expired: "منتهي الصلاحية",
};

function isExpiringSoon(endDate: string) {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= 45;
}

function isAlreadyExpired(endDate: string) {
  const end = new Date(endDate);
  const now = new Date();
  return end < now;
}

function ContractsPage() {
  const { 
    currency, 
    activeStageStaff, 
    allStaffContracts, 
    addStaffContract, 
    updateStaffContract, 
    deleteStaffContract 
  } = useGlobalStore();
  const { stage, getStageLabel } = useStage();

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContract, setEditingContract] = useState<StaffContract | null>(null);
  const [renewingContract, setRenewingContract] = useState<StaffContract | null>(null);
  const [printContract, setPrintContract] = useState<StaffContract | null>(null);
  const [deleteContractId, setDeleteContractId] = useState<string | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Form State for Add / Edit
  const [formState, setFormState] = useState({
    staffId: "",
    type: "full_time" as "full_time" | "part_time" | "contractor",
    jobTitle: "",
    department: "",
    basicSalary: 6000,
    allowances: 800,
    deductions: 0,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    status: "active" as "active" | "renewing" | "expired",
    terms: "يخضع هذا العقد للوائح وأنظمة وزارة التعليم وقانون العمل، ويلتزم الطرف الثاني بالحصص المكلف بها وسرية العمل المدرسي.",
  });

  // Renewal Form State
  const [renewalEndDate, setRenewalEndDate] = useState(
    new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0]
  );
  const [renewalSalary, setRenewalSalary] = useState(0);

  const activeStaff = useMemo(() => activeStageStaff.filter(s => !s.isDeleted), [activeStageStaff]);
  const activeStaffIds = useMemo(() => new Set(activeStaff.map(item => item.id)), [activeStaff]);

  const scopedContracts = useMemo(() => {
    return allStaffContracts
      .filter(item => activeStaffIds.has(item.staffId))
      .filter(item => {
        if (statusFilter === "expiring_soon") {
          return item.status === "active" && isExpiringSoon(item.endDate);
        }
        return statusFilter === "all" || item.status === statusFilter;
      })
      .filter(item => typeFilter === "all" || (item.type || item.contractType) === typeFilter)
      .filter(item => {
        if (!q.trim()) return true;
        const term = q.trim().toLowerCase();
        return (
          item.staffName.toLowerCase().includes(term) ||
          item.id.toLowerCase().includes(term) ||
          (item.jobTitle || "").toLowerCase().includes(term) ||
          (item.department || "").toLowerCase().includes(term)
        );
      });
  }, [activeStaffIds, allStaffContracts, q, statusFilter, typeFilter]);

  // KPIs
  const stats = useMemo(() => {
    const list = allStaffContracts.filter(item => activeStaffIds.has(item.staffId));
    const active = list.filter(item => item.status === "active").length;
    const renewing = list.filter(item => item.status === "renewing").length;
    const expired = list.filter(item => item.status === "expired" || isAlreadyExpired(item.endDate)).length;
    const expiringSoon = list.filter(item => item.status === "active" && isExpiringSoon(item.endDate)).length;
    const totalSalaries = list
      .filter(item => item.status === "active")
      .reduce((sum, item) => sum + (item.basicSalary || 0) + (item.allowances || 0), 0);

    return { total: list.length, active, renewing, expired, expiringSoon, totalSalaries };
  }, [activeStaffIds, allStaffContracts]);

  // Open Add
  const openAdd = () => {
    setFormState({
      staffId: "",
      type: "full_time",
      jobTitle: "",
      department: "",
      basicSalary: 6000,
      allowances: 800,
      deductions: 0,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      status: "active",
      terms: "يخضع هذا العقد للوائح وأنظمة وزارة التعليم وقانون العمل، ويلتزم الطرف الثاني بالحصص المكلف بها وسرية العمل المدرسي.",
    });
    setShowAddModal(true);
  };

  // Open Edit
  const openEdit = (contract: StaffContract) => {
    setEditingContract(contract);
    setFormState({
      staffId: contract.staffId,
      type: (contract.type || contract.contractType || "full_time") as any,
      jobTitle: contract.jobTitle || "",
      department: contract.department || "",
      basicSalary: contract.basicSalary,
      allowances: contract.allowances || 0,
      deductions: contract.deductions || 0,
      startDate: contract.startDate,
      endDate: contract.endDate,
      status: contract.status,
      terms: contract.terms || "يخضع هذا العقد للوائح وأنظمة وزارة التعليم وقانون العمل.",
    });
  };

  // Open Renewal
  const openRenewal = (contract: StaffContract) => {
    setRenewingContract(contract);
    const nextYear = new Date(contract.endDate);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setRenewalEndDate(nextYear.toISOString().split("T")[0]);
    setRenewalSalary(contract.basicSalary);
  };

  // Handle Add Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = activeStaff.find(s => s.id === formState.staffId);
    if (!staff) {
      toast.error("يرجى اختيار الموظف");
      return;
    }

    addStaffContract({
      staffId: staff.id,
      staffName: staff.name,
      type: formState.type,
      contractType: formState.type,
      jobTitle: formState.jobTitle || staff.role,
      department: formState.department || staff.department,
      basicSalary: Number(formState.basicSalary) || 0,
      allowances: Number(formState.allowances) || 0,
      deductions: Number(formState.deductions) || 0,
      startDate: formState.startDate,
      endDate: formState.endDate,
      status: formState.status,
      terms: formState.terms,
    });

    toast.success("تم تسجيل العقد بنجاح وتحديث الراتب الأساسي في سجل الموظف والرواتب");
    setShowAddModal(false);
  };

  // Handle Edit Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;

    updateStaffContract(editingContract.id, {
      type: formState.type,
      contractType: formState.type,
      jobTitle: formState.jobTitle,
      department: formState.department,
      basicSalary: Number(formState.basicSalary) || 0,
      allowances: Number(formState.allowances) || 0,
      deductions: Number(formState.deductions) || 0,
      startDate: formState.startDate,
      endDate: formState.endDate,
      status: formState.status,
      terms: formState.terms,
    });

    toast.success("تم تحديث بيانات العقد ومزامنة الراتب بنجاح");
    setEditingContract(null);
  };

  // Handle Renewal Submit
  const handleRenewalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingContract) return;

    updateStaffContract(renewingContract.id, {
      endDate: renewalEndDate,
      basicSalary: Number(renewalSalary) || renewingContract.basicSalary,
      status: "active",
    });

    toast.success(`تم تجديد عقد (${renewingContract.staffName}) بنجاح حتى ${renewalEndDate}`);
    setRenewingContract(null);
  };

  // Delete
  const handleDelete = (id: string) => {
    deleteStaffContract(id);
    toast.success("تم حذف العقد بنجاح");
    setDeleteContractId(null);
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "شؤون الموظفين" },
        { label: "العقود والوثائق" },
      ]}
      actions={
        <button
          onClick={openAdd}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" /> تسجيل عقد موظف
        </button>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-3 rounded-2xl border border-primary/20 shadow-sm">
              <FileBadge className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">إدارة العقود والوثائق الرسمية ({getStageLabel(stage)})</h1>
              <p className="text-sm font-medium text-muted-foreground mt-0.5">
                تتبع سريان العقود، التجديد الدوري، طباعة نماذج التكليف، ومزامنة الرواتب الأساسية
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-muted/60 text-muted-foreground px-3 py-1.5 rounded-lg border border-border flex items-center gap-1.5 font-bold">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              ربط تلقائي مع مسير الرواتب والمركز المالي
            </span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">إجمالي العقود</span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums mt-2">{stats.total}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">سجل عقود الكادر</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">عقود سارية</span>
              <div className="h-8 w-8 rounded-lg bg-success/10 text-success grid place-items-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums text-success mt-2">{stats.active}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">معتمدة وقيد العمل</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">تنتهي قريباً (30-45 يوم)</span>
              <div className="h-8 w-8 rounded-lg bg-warning/15 text-warning grid place-items-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums text-warning mt-2">{stats.expiringSoon}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">تتطلب إشعاراً أو تجديداً</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">قيد التجديد</span>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 grid place-items-center">
                <RefreshCw className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums text-blue-600 mt-2">{stats.renewing}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">مفاوضات جارية</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">عقود منتهية</span>
              <div className="h-8 w-8 rounded-lg bg-danger/10 text-danger grid place-items-center">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums text-danger mt-2">{stats.expired}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">بحاجة للتمديد أو الأرشفة</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">التزام الرواتب التعاقدية</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 grid place-items-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="text-lg font-black tabular-nums text-emerald-600 mt-2">
              {stats.totalSalaries.toLocaleString()} <span className="text-xs font-bold">{currency}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">شهرياً للعقود السارية</div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="البحث باسم الموظف، المسمى الوظيفي، القسم، أو رقم العقد..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pr-9 pl-4 py-2 text-sm focus:border-primary focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold focus:border-primary focus:outline-hidden"
              >
                <option value="all">كل حالات العقود ({allStaffContracts.length})</option>
                <option value="active">سارية فقط</option>
                <option value="expiring_soon">تنتهي قريباً (30-45 يوماً)</option>
                <option value="renewing">قيد التجديد</option>
                <option value="expired">منتهية الصلاحية</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold focus:border-primary focus:outline-hidden"
              >
                <option value="all">كل أنواع العقود</option>
                <option value="full_time">دوام كامل (سنوي)</option>
                <option value="part_time">دوام جزئي</option>
                <option value="contractor">عقد مقاولة / بالساعة</option>
              </select>

              {(q || statusFilter !== "all" || typeFilter !== "all") && (
                <button
                  onClick={() => { setQ(""); setStatusFilter("all"); setTypeFilter("all"); }}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
                >
                  إعادة ضبط
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <PageCard>
          <DataTable
            rows={scopedContracts}
            columns={[
              {
                key: "id",
                header: "رقم العقد",
                cell: (r) => (
                  <span className="font-mono text-xs font-bold bg-muted/60 px-2 py-1 rounded inline-block">
                    {r.id}
                  </span>
                ),
              },
              {
                key: "staffName",
                header: "الموظف والمسمى التعاقدي",
                cell: (r) => {
                  const staff = activeStaff.find(s => s.id === r.staffId);
                  return (
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary" />
                        {r.staffName}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.jobTitle || staff?.role || "كادر وظيفي"} • {r.department || staff?.department || "عام"}
                      </div>
                    </div>
                  );
                },
              },
              {
                key: "type",
                header: "نوع العقد",
                cell: (r) => (
                  <Badge tone={r.type === "full_time" ? "primary" : r.type === "part_time" ? "warning" : "neutral"}>
                    {contractTypeLabels[r.type || r.contractType || "full_time"] || "سنوي"}
                  </Badge>
                ),
              },
              {
                key: "period",
                header: "سريان العقد",
                cell: (r) => {
                  const expiring = isExpiringSoon(r.endDate);
                  const expired = isAlreadyExpired(r.endDate);
                  return (
                    <div className="text-xs space-y-0.5 tabular-nums">
                      <div>من: <strong>{r.startDate}</strong></div>
                      <div className={expired ? "text-danger font-bold" : expiring ? "text-warning font-bold" : ""}>
                        إلى: <strong>{r.endDate}</strong>
                        {expiring && <span className="mr-1 text-[10px] bg-warning/15 px-1 py-0.5 rounded">ينتهي قريباً</span>}
                        {expired && <span className="mr-1 text-[10px] bg-danger/15 px-1 py-0.5 rounded">منتهي</span>}
                      </div>
                    </div>
                  );
                },
              },
              {
                key: "salary",
                header: "الراتب والمستحقات",
                cell: (r) => (
                  <div className="text-xs tabular-nums space-y-0.5">
                    <div className="font-black text-foreground">
                      {r.basicSalary.toLocaleString()} {currency}
                    </div>
                    {r.allowances ? (
                      <div className="text-[11px] text-emerald-600 font-bold">
                        + {r.allowances.toLocaleString()} بدلات
                      </div>
                    ) : null}
                  </div>
                ),
              },
              {
                key: "status",
                header: "الحالة",
                cell: (r) => (
                  <Badge tone={r.status === "active" ? "success" : r.status === "renewing" ? "info" : "danger"}>
                    {contractStatusLabels[r.status] || r.status}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "الإجراءات والتوثيق",
                cell: (r) => (
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Renew Contract Button */}
                    <button
                      onClick={() => openRenewal(r)}
                      className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1.5 rounded-lg transition-colors"
                      title="تجديد أو تمديد سريان العقد"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> تجديد
                    </button>

                    {/* Print Contract */}
                    <button
                      onClick={() => setPrintContract(r)}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      title="طباعة عقد العمل الرسمي"
                    >
                      <Printer className="h-4 w-4" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEdit(r)}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="تعديل بنود العقد"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteContractId(r.id)}
                      className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                      title="حذف العقد"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            empty="لا توجد عقود عمل مطابقة لمعايير البحث الحالية"
          />

          <div className="mt-4 p-3.5 bg-primary/5 text-primary-foreground/90 rounded-xl border border-primary/20 flex items-start gap-3">
            <div className="bg-primary/10 text-primary p-2 rounded-lg shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-xs space-y-1">
              <div className="font-bold text-foreground">الحماية القانونية والتوثيق المالي:</div>
              <p className="text-muted-foreground">
                تعتبر هذه العقود هي المرجع الأساسي لتغذية مسير الرواتب بالراتب الأساسي المعتمد. عند تعديل الراتب أو تجديد العقد، يتم تحديث بيانات الموظف المحاسبية بشكل فوري وآمن.
              </p>
            </div>
          </div>
        </PageCard>
      </div>

      {/* ========================================================
          MODAL 1: ADD / EDIT CONTRACT
         ======================================================== */}
      {(showAddModal || editingContract) && (
        <div className="modal-backdrop-luxury">
          <div className="modal-card-luxury max-w-2xl w-full">
            <div className="flex items-center justify-between border-b border-border/70 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <FileBadge className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black">
                    {editingContract ? `تعديل عقد العمل (${editingContract.id})` : "تسجيل عقد موظف جديد"}
                  </h3>
                  <p className="text-xs text-muted-foreground">توثيق بنود العمل، الرواتب، وسريان الصلاحية</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setEditingContract(null); }}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={editingContract ? handleEditSubmit : handleAddSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!editingContract && (
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-foreground mb-1 block">الموظف المعني بالعقد *</label>
                    <select
                      required
                      value={formState.staffId}
                      onChange={(e) => {
                        const sid = e.target.value;
                        const s = activeStaff.find(st => st.id === sid);
                        setFormState(prev => ({
                          ...prev,
                          staffId: sid,
                          jobTitle: s ? s.role : prev.jobTitle,
                          department: s ? s.department : prev.department,
                          basicSalary: s?.basicSalary || prev.basicSalary,
                          allowances: s?.allowance || prev.allowances,
                        }));
                      }}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-hidden"
                    >
                      <option value="">-- اختر الموظف --</option>
                      {activeStaff.map(s => (
                        <option key={s.id} value={s.id}>{s.name} - {s.role} ({s.department})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">المسمى الوظيفي في العقد</label>
                  <input
                    type="text"
                    value={formState.jobTitle}
                    onChange={(e) => setFormState(prev => ({ ...prev, jobTitle: e.target.value }))}
                    placeholder="مثال: معلم أول لغة عربية، محاسب..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">نوع العقد</label>
                  <select
                    value={formState.type}
                    onChange={(e) => setFormState(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-hidden"
                  >
                    <option value="full_time">دوام كامل (سنوي)</option>
                    <option value="part_time">دوام جزئي</option>
                    <option value="contractor">عقد مقاولة / استشاري</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">الراتب الأساسي التعاقدي ({currency}) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formState.basicSalary}
                    onChange={(e) => setFormState(prev => ({ ...prev, basicSalary: Number(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-black tabular-nums focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">البدلات والمزايا الشهرية ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={formState.allowances}
                    onChange={(e) => setFormState(prev => ({ ...prev, allowances: Number(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-emerald-600 font-bold tabular-nums focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div>
                  <ArabicDatePicker
                    label="تاريخ بداية العقد *"
                    required
                    value={formState.startDate}
                    onChange={(d) => setFormState(prev => ({ ...prev, startDate: d }))}
                  />
                </div>

                <div>
                  <ArabicDatePicker
                    label="تاريخ نهاية العقد *"
                    required
                    value={formState.endDate}
                    onChange={(d) => setFormState(prev => ({ ...prev, endDate: d }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">حالة العقد</label>
                  <select
                    value={formState.status}
                    onChange={(e) => setFormState(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-hidden"
                  >
                    <option value="active">ساري ومعتمد</option>
                    <option value="renewing">قيد التجديد</option>
                    <option value="expired">منتهي الصلاحية</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-foreground mb-1 block">بنود وشروط العقد الإضافية</label>
                  <textarea
                    rows={2}
                    value={formState.terms}
                    onChange={(e) => setFormState(prev => ({ ...prev, terms: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border/70 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingContract(null); }}
                  className="px-4 py-2 text-xs font-bold text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-all shadow-xs"
                >
                  {editingContract ? "حفظ التعديلات التعاقدية" : "اعتماد وتسجيل العقد"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: CONTRACT RENEWAL / EXTENSION
         ======================================================== */}
      {renewingContract && (
        <div className="modal-backdrop-luxury">
          <div className="modal-card-luxury max-w-md w-full">
            <div className="flex items-center justify-between border-b border-border/70 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/15 text-blue-600 grid place-items-center">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black">تجديد عقد العمل</h3>
                  <p className="text-xs text-muted-foreground">تمديد سريان العقد وتحديث الراتب السنوي</p>
                </div>
              </div>
              <button
                onClick={() => setRenewingContract(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRenewalSubmit} className="space-y-4 pt-4">
              <div className="p-3 bg-muted/60 rounded-xl border border-border text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-bold">الموظف:</span>
                  <span className="font-black text-foreground">{renewingContract.staffName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-bold">المسمى:</span>
                  <span className="font-bold">{renewingContract.jobTitle || "كادر تعليمي/إداري"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-bold">تاريخ الانتهاء الحالي:</span>
                  <span className="font-mono text-danger font-bold">{renewingContract.endDate}</span>
                </div>
              </div>

              <div>
                <ArabicDatePicker
                  label="تاريخ نهاية العقد الجديد بعد التمديد *"
                  required
                  value={renewalEndDate}
                  onChange={setRenewalEndDate}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">
                  الراتب الأساسي الجديد ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  value={renewalSalary}
                  onChange={(e) => setRenewalSalary(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-black tabular-nums focus:border-primary focus:outline-hidden"
                />
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setRenewalSalary(Math.round(renewingContract.basicSalary * 1.05))}
                    className="text-[10px] font-bold bg-muted px-2 py-1 rounded hover:bg-muted/80 text-primary"
                  >
                    +5% علاوة سنوية
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenewalSalary(Math.round(renewingContract.basicSalary * 1.10))}
                    className="text-[10px] font-bold bg-muted px-2 py-1 rounded hover:bg-muted/80 text-primary"
                  >
                    +10% ترقية
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border/70 pt-4">
                <button
                  type="button"
                  onClick={() => setRenewingContract(null)}
                  className="px-4 py-2 text-xs font-bold text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-xs"
                >
                  تأكيد التجديد وتحديث الراتب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: OFFICIAL PRINTABLE EMPLOYMENT CONTRACT
         ======================================================== */}
      {printContract && (
        <div className="modal-backdrop-luxury">
          <div className="modal-card-luxury max-w-3xl w-full max-h-[92vh] overflow-y-auto">
            {/* Header Controls (Hidden on Print) */}
            <div className="flex items-center justify-between border-b border-border/70 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-black">عقد عمل مدرسي موحد ومصدق</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs"
                >
                  <Printer className="h-4 w-4" /> طباعة العقد
                </button>
                <button
                  onClick={() => setPrintContract(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Document Sheet */}
            <div className="p-8 bg-white text-slate-900 rounded-xl my-2 border border-slate-200 shadow-xs print:p-0 print:border-none print:shadow-none font-sans">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-5">
                <div className="space-y-1">
                  <div className="text-lg font-black text-slate-900">منظومة مدارس الريادة الحديثة الأهلية</div>
                  <div className="text-xs text-slate-600 font-bold">إدارة الشؤون القانونية والموارد البشرية • السجل العقدي الموحد</div>
                  <div className="text-[11px] text-slate-500 font-mono">رقم العقد الرسمي: CTR-{printContract.id}</div>
                </div>
                <div className="text-center p-2 rounded-lg border border-slate-300 bg-slate-50">
                  <div className="text-[10px] font-bold text-slate-500 mb-1">الختم المشفر</div>
                  <div className="w-14 h-14 bg-white p-1 rounded border border-slate-300 grid place-items-center mx-auto">
                    <QrCode className="w-12 h-12 text-slate-800" />
                  </div>
                  <div className="text-[9px] font-mono text-slate-600 mt-0.5">{printContract.id}</div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center py-2 bg-slate-100 border border-slate-300 rounded-lg mb-5">
                <h2 className="text-base font-black text-slate-900">عـقـد عـمـل وتـعـيـيـن مـدرسـي مـعـتـمـد</h2>
                <p className="text-[11px] text-slate-600">وفقاً لأحكام ولوائح العمل المعتمدة في قطاع التعليم</p>
              </div>

              {/* Preamble */}
              <div className="text-xs leading-relaxed mb-5 p-3 rounded bg-slate-50 border border-slate-200">
                <p>
                  إنه في يوم <strong>{printContract.startDate}</strong>، تم الاتفاق والتراضي بين كل من:
                </p>
                <div className="mt-2 space-y-1.5">
                  <p>
                    <strong>الطرف الأول:</strong> إدارة مدارس الريادة الحديثة، ويمثلها في هذا العقد مدير الموارد البشرية.
                  </p>
                  <p>
                    <strong>الطرف الثاني:</strong> الأستاذ/ة <strong>{printContract.staffName}</strong>، بصفته/ا <strong>{printContract.jobTitle || "كادر تعليمي وإداري"}</strong>.
                  </p>
                </div>
              </div>

              {/* Articles & Terms */}
              <div className="space-y-3 text-xs leading-relaxed mb-6">
                <div>
                  <h4 className="font-bold text-slate-800 mb-0.5">البند الأول (المهام الوظيفية والتبعية):</h4>
                  <p className="text-slate-600">
                    يعمل الطرف الثاني لدى الطرف الأول بوظيفة ({printContract.jobTitle || "كادر تعليمي"}) بقسم ({printContract.department || "التعليم العام"})، ويلتزم بأداء المهام التدريسية والإدارية الموكلة إليه بكفاءة وأمانة مهنية.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-0.5">البند الثاني (مدة العقد وسريانه):</h4>
                  <p className="text-slate-600">
                    مدة هذا العقد من تاريخ <strong>{printContract.startDate}</strong> وحتى <strong>{printContract.endDate}</strong>، ويتجدد تلقائياً ما لم يُخطر أحد الطرفين الآخر برغبته في عدم التجديد قبل انتهاء المدة بـ 30 يوماً على الأقل.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-0.5">البند الثالث (الراتب والمستحقات المالية):</h4>
                  <div className="p-3 rounded border border-slate-200 bg-white grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block">الراتب الأساسي الشهري:</span>
                      <span className="font-black text-slate-900">{printContract.basicSalary.toLocaleString()} {currency}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">البدلات الشهرية:</span>
                      <span className="font-bold text-slate-900">{printContract.allowances ? `${printContract.allowances.toLocaleString()} ${currency}` : "لا يوجد"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">إجمالي المستحق الشهري:</span>
                      <span className="font-black text-emerald-700">{((printContract.basicSalary || 0) + (printContract.allowances || 0)).toLocaleString()} {currency}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-0.5">البند الرابع (الشروط والأحكام الخاصة):</h4>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                    {printContract.terms || "يلتزم الطرفان بالحفاظ على سرية العمل المدرسي والتقيد بالتقويم الدراسي المعتمد."}
                  </p>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-6 mt-6 border-t-2 border-slate-300 text-center text-xs">
                <div className="space-y-8">
                  <div className="font-bold text-slate-800">الطرف الثاني (الموظف)</div>
                  <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1 text-slate-500 font-mono text-[10px]">
                    الاسم: {printContract.staffName}
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="font-bold text-slate-800">الطرف الأول (إدارة المدرسة)</div>
                  <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1 text-slate-500 text-[10px]">
                    الختم والتوقيع الرسمي
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-2 border-t border-border/70 pt-4 print:hidden">
              <button
                type="button"
                onClick={() => setPrintContract(null)}
                className="px-4 py-2 text-xs font-bold text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-all shadow-xs"
              >
                <Printer className="h-4 w-4" /> طباعة فورية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: DELETE CONFIRMATION
         ======================================================== */}
      {deleteContractId && (
        <div className="modal-backdrop-luxury">
          <div className="modal-card-luxury max-w-sm w-full text-center">
            <div className="h-12 w-12 rounded-full bg-danger/10 text-danger grid place-items-center mx-auto mb-3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black">تأكيد حذف العقد</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              هل أنت متأكد من رغبتك في حذف هذا العقد من السجلات؟ لن يتم حذف الموظف ولكن سيتم إزالة التوثيق العقدي.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setDeleteContractId(null)}
                className="px-4 py-2 text-xs font-bold text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDelete(deleteContractId)}
                className="px-4 py-2 text-xs font-bold text-white bg-danger hover:bg-danger/90 rounded-lg transition-colors shadow-xs"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
