import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageCard, Badge } from "@/components/app-shell";
import { DataTable } from "@/components/data-table";
import { useGlobalStore, StaffLeave } from "@/contexts/GlobalStoreContext";
import { useStage } from "@/contexts/StageContext";
import { ArabicDatePicker } from "@/components/ui/arabic-date-picker";
import { 
  Calendar, Plus, Check, X, Search, Clock, UserCheck, 
  UserX, Printer, AlertCircle, FileText, QrCode, Trash2, 
  CalendarDays, CheckCircle2, XCircle, Sparkles, Filter, ShieldCheck, User
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/hr/leaves")({
  head: () => ({ meta: [{ title: "إدارة إجازات الموظفين | منصة مدارس" }] }),
  component: HrLeaves,
});

const leaveTypeLabels: Record<StaffLeave["type"], string> = {
  annual: "سنوية اعتيادية",
  sick: "مرضية بتقرير طبي",
  issued: "استثنائية بدون راتب",
  emergency: "اضطرارية / عاجلة",
};

const leaveTypeTones: Record<StaffLeave["type"], "primary" | "info" | "danger" | "warning"> = {
  annual: "primary",
  sick: "info",
  issued: "danger",
  emergency: "warning",
};

const statusLabels: Record<StaffLeave["status"], string> = {
  pending: "قيد المراجعة والاعتماد",
  approved: "معتمدة رسمياً",
  rejected: "مرفوضة من الإدارة",
};

function countDays(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

function HrLeaves() {
  const { stage, getStageLabel } = useStage();
  const { 
    activeStageStaff, 
    allStaffLeaves, 
    addStaffLeave, 
    updateStaffLeave, 
    deleteStaffLeave,
    currency 
  } = useGlobalStore();

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [decisionLeave, setDecisionLeave] = useState<StaffLeave | null>(null);
  const [voucherLeave, setVoucherLeave] = useState<StaffLeave | null>(null);
  const [deleteLeaveId, setDeleteLeaveId] = useState<string | null>(null);

  // Filters
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StaffLeave["status"] | "all">("all");
  const [typeFilter, setTypeFilter] = useState<StaffLeave["type"] | "all">("all");

  // Form states
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [formStaffId, setFormStaffId] = useState("");
  const [formType, setFormType] = useState<StaffLeave["type"]>("annual");
  const [formReplacementId, setFormReplacementId] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formAutoOnLeave, setFormAutoOnLeave] = useState(false);

  // Decision Modal form state
  const [decisionAction, setDecisionAction] = useState<"approved" | "rejected">("approved");
  const [decisionReason, setDecisionReason] = useState("");
  const [syncStatusOnDecision, setSyncStatusOnDecision] = useState(true);

  const staffInScope = useMemo(
    () => activeStageStaff.filter(item => !item.isDeleted && item.status !== "terminated"),
    [activeStageStaff]
  );
  const staffIds = useMemo(() => new Set(staffInScope.map(item => item.id)), [staffInScope]);

  const scopedLeaves = useMemo(() => {
    return allStaffLeaves
      .filter(item => staffIds.has(item.staffId))
      .filter(item => statusFilter === "all" || item.status === statusFilter)
      .filter(item => typeFilter === "all" || item.type === typeFilter)
      .filter(item => {
        if (!q.trim()) return true;
        const term = q.trim().toLowerCase();
        return (
          item.staffName.toLowerCase().includes(term) ||
          item.id.toLowerCase().includes(term) ||
          (leaveTypeLabels[item.type] || "").toLowerCase().includes(term) ||
          (item.notes || "").toLowerCase().includes(term)
        );
      });
  }, [allStaffLeaves, q, staffIds, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const stageLeaves = allStaffLeaves.filter(item => staffIds.has(item.staffId));
    return {
      total: stageLeaves.length,
      pending: stageLeaves.filter(item => item.status === "pending").length,
      approved: stageLeaves.filter(item => item.status === "approved").length,
      rejected: stageLeaves.filter(item => item.status === "rejected").length,
      approvedDays: stageLeaves.filter(item => item.status === "approved").reduce((sum, item) => sum + item.days, 0),
    };
  }, [allStaffLeaves, staffIds]);

  const openAdd = () => {
    setFormStaffId("");
    setFormType("annual");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
    setFormReplacementId("");
    setFormNotes("");
    setFormAutoOnLeave(false);
    setShowAddModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffInScope.find(item => item.id === formStaffId);
    const replacementStaff = staffInScope.find(item => item.id === formReplacementId);
    const days = countDays(startDate, endDate);

    if (!staff) {
      toast.error("يرجى اختيار الموظف صاحب الإجازة");
      return;
    }
    if (days <= 0) {
      toast.error("تاريخ نهاية الإجازة يجب أن يكون مساوياً أو بعد تاريخ البداية");
      return;
    }

    addStaffLeave({
      staffId: staff.id,
      staffName: staff.name,
      type: formType,
      startDate,
      endDate,
      days,
      status: "pending",
      notes: formNotes.trim() || undefined,
      replacementStaffId: replacementStaff?.id,
      replacementStaffName: replacementStaff?.name,
    }, formAutoOnLeave);

    toast.success("تم تسجيل طلب الإجازة بنجاح وإرساله لدائرة الموارد البشرية للاعتماد");
    setShowAddModal(false);
  };

  const openDecision = (leave: StaffLeave, initialAction: "approved" | "rejected") => {
    setDecisionLeave(leave);
    setDecisionAction(initialAction);
    setDecisionReason(initialAction === "approved" ? "تم استيفاء الشروط وتكليف البديل" : "تعذر الموافقة لضغط العمل وحاجة القسم");
    setSyncStatusOnDecision(true);
  };

  const handleDecisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionLeave) return;

    updateStaffLeave(
      decisionLeave.id,
      {
        status: decisionAction,
        decisionReason: decisionReason.trim(),
        approvedAt: new Date().toISOString().split("T")[0],
        approvedBy: "مدير الموارد البشرية",
      },
      syncStatusOnDecision
    );

    toast.success(
      decisionAction === "approved"
        ? "تم اعتماد الإجازة بنجاح وتحديث سجل الموظف"
        : "تم تسجيل رفض طلب الإجازة وحفظ المبرر في السجل"
    );
    setDecisionLeave(null);
  };

  const handleDelete = (id: string) => {
    deleteStaffLeave(id);
    toast.success("تم حذف طلب الإجازة بنجاح");
    setDeleteLeaveId(null);
  };

  return (
    <AppShell
      breadcrumb={[
        { label: "الرئيسية", to: "/" },
        { label: "شؤون الموظفين" },
        { label: "طلبات الإجازات" },
      ]}
      actions={
        <button
          onClick={openAdd}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" /> طلب إجازة جديد
        </button>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-3 rounded-2xl border border-primary/20 shadow-sm">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">إدارة إجازات الموظفين والكوادر ({getStageLabel(stage)})</h1>
              <p className="text-sm font-medium text-muted-foreground mt-0.5">
                متابعة واعتماد الإجازات السنوية والمرضية وتكاملها مع مسير الرواتب وجدول البدلاء
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-muted/60 text-muted-foreground px-3 py-1.5 rounded-lg border border-border flex items-center gap-1.5 font-bold">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              تحديث تلقائي لحالة الموظف واحتساب أثر الرواتب
            </span>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">إجمالي الطلبات</span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums mt-2">{stats.total}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">سجل إجازات المرحلة</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">قيد المراجعة</span>
              <div className="h-8 w-8 rounded-lg bg-warning/15 text-warning grid place-items-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums text-warning mt-2">{stats.pending}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">بانتظار قرار الإدارة</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">طلبات معتمدة</span>
              <div className="h-8 w-8 rounded-lg bg-success/10 text-success grid place-items-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums text-success mt-2">{stats.approved}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">إجازات سارية وموافق عليها</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">طلبات مرفوضة</span>
              <div className="h-8 w-8 rounded-lg bg-danger/10 text-danger grid place-items-center">
                <XCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums text-danger mt-2">{stats.rejected}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">لم تحظَ بالموافقة</div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">أيام الإجازات المعتمدة</span>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 grid place-items-center">
                <CalendarDays className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tabular-nums text-purple-600 mt-2">{stats.approvedDays}</div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">يوماً معتمداً هذا الفصل</div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="البحث باسم الموظف، رقم الطلب، نوع الإجازة، أو الملاحظات..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pr-9 pl-4 py-2 text-sm focus:border-primary focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold focus:border-primary focus:outline-hidden"
              >
                <option value="all">كل الحالات ({allStaffLeaves.length})</option>
                <option value="pending">قيد المراجعة ({allStaffLeaves.filter(l => l.status === "pending").length})</option>
                <option value="approved">معتمدة ({allStaffLeaves.filter(l => l.status === "approved").length})</option>
                <option value="rejected">مرفوضة ({allStaffLeaves.filter(l => l.status === "rejected").length})</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold focus:border-primary focus:outline-hidden"
              >
                <option value="all">كل أنواع الإجازات</option>
                <option value="annual">سنوية اعتيادية</option>
                <option value="sick">مرضية بتقرير</option>
                <option value="emergency">اضطرارية / عاجلة</option>
                <option value="issued">استثنائية بدون راتب</option>
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
            rows={scopedLeaves}
            columns={[
              {
                key: "id",
                header: "رقم الطلب",
                cell: (r) => (
                  <span className="font-mono text-xs font-bold bg-muted/60 px-2 py-1 rounded inline-block">
                    {r.id}
                  </span>
                ),
              },
              {
                key: "staffName",
                header: "الموظف",
                cell: (r) => {
                  const staff = staffInScope.find(s => s.id === r.staffId);
                  return (
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary" />
                        {r.staffName}
                      </div>
                      {staff && (
                        <div className="text-[11px] text-muted-foreground">
                          {staff.role} • {staff.department}
                        </div>
                      )}
                    </div>
                  );
                },
              },
              {
                key: "type",
                header: "نوع الإجازة",
                cell: (r) => (
                  <Badge tone={leaveTypeTones[r.type]}>
                    {leaveTypeLabels[r.type] || r.type}
                  </Badge>
                ),
              },
              {
                key: "period",
                header: "فترة الإجازة",
                cell: (r) => (
                  <div className="text-xs space-y-0.5 font-medium tabular-nums">
                    <div>من: <strong>{r.startDate}</strong></div>
                    <div>إلى: <strong>{r.endDate}</strong></div>
                  </div>
                ),
              },
              {
                key: "days",
                header: "المدة",
                cell: (r) => (
                  <span className="font-black text-xs tabular-nums bg-muted px-2 py-1 rounded-md">
                    {r.days} يوم
                  </span>
                ),
              },
              {
                key: "replacement",
                header: "الموظف البديل",
                cell: (r) => (
                  <div className="text-xs">
                    {r.replacementStaffName ? (
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5 text-success" />
                        {r.replacementStaffName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-normal">لم يعين بديل</span>
                    )}
                  </div>
                ),
              },
              {
                key: "status",
                header: "الحالة",
                cell: (r) => (
                  <Badge tone={r.status === "approved" ? "success" : r.status === "rejected" ? "danger" : "warning"}>
                    {r.status === "approved" ? "معتمدة" : r.status === "rejected" ? "مرفوضة" : "قيد المراجعة"}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "الإجراءات الإدارية",
                cell: (r) => (
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Quick Decision Buttons if Pending */}
                    {r.status === "pending" && (
                      <>
                        <button
                          onClick={() => openDecision(r, "approved")}
                          className="flex items-center gap-1 text-[11px] font-bold text-success bg-success/10 hover:bg-success/20 px-2 py-1.5 rounded-lg transition-colors"
                          title="اعتماد الإجازة"
                        >
                          <Check className="h-3.5 w-3.5" /> اعتماد
                        </button>
                        <button
                          onClick={() => openDecision(r, "rejected")}
                          className="flex items-center gap-1 text-[11px] font-bold text-danger bg-danger/10 hover:bg-danger/20 px-2 py-1.5 rounded-lg transition-colors"
                          title="رفض الإجازة"
                        >
                          <X className="h-3.5 w-3.5" /> رفض
                        </button>
                      </>
                    )}

                    {/* Change decision if already resolved */}
                    {r.status !== "pending" && (
                      <button
                        onClick={() => openDecision(r, r.status === "approved" ? "rejected" : "approved")}
                        className="text-[11px] font-bold text-muted-foreground hover:bg-muted px-2 py-1.5 rounded-lg transition-colors"
                        title="تعديل القرار"
                      >
                        تعديل القرار
                      </button>
                    )}

                    {/* Print Leave Voucher */}
                    <button
                      onClick={() => setVoucherLeave(r)}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      title="طباعة إشعار الإجازة الرسمي"
                    >
                      <Printer className="h-4 w-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setDeleteLeaveId(r.id)}
                      className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                      title="حذف الطلب"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            empty="لا توجد طلبات إجازة مطابقة لمعايير البحث الحالية"
          />

          <div className="mt-4 p-3.5 bg-primary/5 text-primary-foreground/90 rounded-xl border border-primary/20 flex items-start gap-3">
            <div className="bg-primary/10 text-primary p-2 rounded-lg shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-xs space-y-1">
              <div className="font-bold text-foreground">تكامل إجازات الموظفين مع مسير الرواتب والحضور:</div>
              <p className="text-muted-foreground">
                الإجازات غير مدفوعة الأجر ("بدون راتب") تنعكس تلقائياً في مسير الرواتب الشهري كحسم على أيام الغياب الفعلي. كما يتم تحديث الحالة الوظيفية للموظف في بطاقة الموظف إلى "في إجازة" طوال فترة سريانها لحماية النصاب التدريسي.
              </p>
            </div>
          </div>
        </PageCard>
      </div>

      {/* ========================================================
          MODAL 1: ADD LEAVE REQUEST
         ======================================================== */}
      {showAddModal && (
        <div className="modal-backdrop-luxury">
          <div className="modal-card-luxury max-w-xl w-full">
            <div className="p-5 border-b border-border/70 flex justify-between items-center bg-primary/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary grid place-items-center shadow-xs">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">تسجيل طلب إجازة موظف</h3>
                  <p className="text-xs text-muted-foreground font-bold">تقديم طلب إجازة رسمي وتحديد الفترة والموظف البديل</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="h-8 w-8 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-foreground mb-1 block">الموظف صاحب الطلب *</label>
                  <select
                    required
                    value={formStaffId}
                    onChange={(e) => setFormStaffId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs font-bold focus:border-primary focus:outline-hidden"
                  >
                    <option value="">-- اختر الموظف --</option>
                    {staffInScope.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.role} - {item.department}) [{item.status === "on_leave" ? "حالياً في إجازة" : "على رأس العمل"}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">نوع الإجازة</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs font-bold focus:border-primary focus:outline-hidden"
                  >
                    <option value="annual">سنوية اعتيادية</option>
                    <option value="sick">مرضية (مرفق تقرير طبي)</option>
                    <option value="emergency">اضطرارية / عاجلة</option>
                    <option value="issued">استثنائية (بدون راتب)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">الموظف / المعلم البديل</label>
                  <select
                    value={formReplacementId}
                    onChange={(e) => setFormReplacementId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs font-bold focus:border-primary focus:outline-hidden"
                  >
                    <option value="">-- اختياري (تغطية الحصص والعمل) --</option>
                    {staffInScope.filter(s => s.id !== formStaffId).map(item => (
                      <option key={item.id} value={item.id}>{item.name} - {item.role}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <ArabicDatePicker
                    label="تاريخ بداية الإجازة *"
                    required
                    value={startDate}
                    onChange={setStartDate}
                  />
                </div>

                <div>
                  <ArabicDatePicker
                    label="تاريخ نهاية الإجازة *"
                    required
                    value={endDate}
                    onChange={setEndDate}
                  />
                </div>

                <div className="md:col-span-2 p-3 bg-muted/40 rounded-xl border border-border/70 text-xs flex justify-between items-center">
                  <span className="font-bold text-muted-foreground">المدة الإجمالية المحتسبة:</span>
                  <span className="text-sm font-black text-primary tabular-nums">
                    {countDays(startDate, endDate)} يوم
                  </span>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-foreground mb-1 block">ملاحظات الطلب أو مسوغات الغياب</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="بيان سبب الإجازة، أرقام التقارير الطبية، أو ظروف السفر..."
                    className="w-full rounded-xl border border-input bg-background p-2.5 text-xs font-bold focus:border-primary focus:outline-hidden resize-none"
                  />
                </div>

                <div className="md:col-span-2 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold select-none">
                    <input
                      type="checkbox"
                      checked={formAutoOnLeave}
                      onChange={(e) => setFormAutoOnLeave(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>تغيير حالة الموظف فورياً إلى (في إجازة) في السجل العام</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-border/70 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-10 px-5 text-xs font-bold text-muted-foreground border border-input rounded-xl hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 text-xs font-black text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-md glow-primary"
                >
                  حفظ وإرسال الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: LEAVE DECISION (APPROVE / REJECT)
         ======================================================== */}
      {decisionLeave && (
        <div className="modal-backdrop-luxury">
          <div className="modal-card-luxury max-w-lg w-full">
            <div className="p-5 border-b border-border/70 flex justify-between items-center bg-primary/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-2xl grid place-items-center shadow-xs ${
                  decisionAction === "approved" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                }`}>
                  {decisionAction === "approved" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    {decisionAction === "approved" ? "اعتماد طلب الإجازة" : "رفض طلب الإجازة"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-bold">اتخاذ القرار الإداري وإشعار الموظف وتحديث ملفه</p>
                </div>
              </div>
              <button
                onClick={() => setDecisionLeave(null)}
                className="h-8 w-8 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 text-xs">
              <div className="p-3.5 bg-muted/40 rounded-xl border border-border/70 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-bold">الموظف:</span>
                  <span className="font-black text-foreground">{decisionLeave.staffName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-bold">نوع الإجازة:</span>
                  <span className="font-bold">{leaveTypeLabels[decisionLeave.type]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-bold">الفترة:</span>
                  <span className="font-mono text-primary font-bold">{decisionLeave.startDate} إلى {decisionLeave.endDate} ({decisionLeave.days} يوم)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">تغيير القرار الإداري</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setDecisionAction("approved"); setDecisionReason("تمت الموافقة وتكليف البديل"); }}
                    className={`h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      decisionAction === "approved"
                        ? "bg-success text-white border-success shadow-xs font-black"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" /> موافقة واعتماد
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDecisionAction("rejected"); setDecisionReason("تعذر القبول لحاجة القسم والجدول"); }}
                    className={`h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      decisionAction === "rejected"
                        ? "bg-danger text-white border-danger shadow-xs font-black"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <XCircle className="h-4 w-4" /> رفض الطلب
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">مبرر القرار وملاحظات الإدارة *</label>
                <textarea
                  rows={2}
                  required
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background p-2.5 text-xs font-bold focus:border-primary focus:outline-hidden resize-none"
                />
              </div>

              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={syncStatusOnDecision}
                    onChange={(e) => setSyncStatusOnDecision(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span>
                    {decisionAction === "approved" 
                      ? "مزامنة حالة الموظف تلقائياً إلى (في إجازة)" 
                      : "إعادة حالة الموظف إلى (على رأس العمل)"}
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-border/70 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setDecisionLeave(null)}
                  className="h-10 px-5 text-xs font-bold text-muted-foreground border border-input rounded-xl hover:bg-accent transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`h-10 px-6 text-xs font-black text-white rounded-xl transition-all shadow-md ${
                    decisionAction === "approved" ? "bg-success hover:bg-success/90" : "bg-danger hover:bg-danger/90"
                  }`}
                >
                  تأكيد وحفظ القرار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: OFFICIAL PRINTABLE LEAVE VOUCHER
         ======================================================== */}
      {voucherLeave && (
        <div className="modal-backdrop-luxury">
          <div className="modal-card-luxury max-w-2xl w-full">
            {/* Header Controls (Hidden on Print) */}
            <div className="p-5 border-b border-border/70 flex items-center justify-between bg-primary/5 shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-primary" />
                <h3 className="text-base font-black text-foreground">إشعار إجازة معتمد وإذن غياب رسمي</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 transition-colors shadow-xs"
                >
                  <Printer className="h-4 w-4" /> طباعة المستند
                </button>
                <button
                  onClick={() => setVoucherLeave(null)}
                  className="h-8 w-8 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Document Print Sheet */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 text-slate-900 bg-white">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-4">
                <div className="space-y-1">
                  <div className="text-base font-black text-slate-900">منظومة مدارس الريادة الحديثة</div>
                  <div className="text-xs text-slate-600 font-bold">إدارة الموارد البشرية وشؤون الموظفين • قسم الإجازات والدوام</div>
                  <div className="text-[11px] text-slate-500 font-mono">رقم الإشعار المعتمد: LV-{voucherLeave.id}</div>
                </div>
                <div className="text-center p-2 rounded-lg border border-slate-300 bg-slate-50">
                  <div className="text-[10px] font-bold text-slate-500 mb-1">الباركود الرسمي</div>
                  <div className="w-14 h-14 bg-white p-1 rounded border border-slate-300 grid place-items-center mx-auto">
                    <QrCode className="w-12 h-12 text-slate-800" />
                  </div>
                  <div className="text-[9px] font-mono text-slate-600 mt-0.5">{voucherLeave.id}</div>
                </div>
              </div>

              {/* Title Banner */}
              <div className="text-center py-2.5 bg-slate-100 border border-slate-300 rounded-lg mb-4">
                <h2 className="text-base font-black text-slate-900">إشعار إجازة نظامية معتمدة</h2>
                <p className="text-[11px] text-slate-600 font-medium">مستند رسمي صادر بموجب لوائح وأنظمة العمل المدرسي</p>
              </div>

              {/* Staff Details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-xs">
                <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                  <span className="text-slate-500 block font-bold text-[10px]">اسم الموظف / المعلم</span>
                  <span className="font-bold text-slate-800">{voucherLeave.staffName}</span>
                </div>
                <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                  <span className="text-slate-500 block font-bold text-[10px]">نوع الإجازة</span>
                  <span className="font-bold text-slate-800">{leaveTypeLabels[voucherLeave.type]}</span>
                </div>
                <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                  <span className="text-slate-500 block font-bold text-[10px]">حالة الاعتماد</span>
                  <span className="font-bold text-slate-800">{statusLabels[voucherLeave.status]}</span>
                </div>
                <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                  <span className="text-slate-500 block font-bold text-[10px]">تاريخ البداية</span>
                  <span className="font-bold text-slate-800 font-mono">{voucherLeave.startDate}</span>
                </div>
                <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                  <span className="text-slate-500 block font-bold text-[10px]">تاريخ النهاية</span>
                  <span className="font-bold text-slate-800 font-mono">{voucherLeave.endDate}</span>
                </div>
                <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                  <span className="text-slate-500 block font-bold text-[10px]">إجمالي الأيام المعتمدة</span>
                  <span className="font-black text-slate-900 font-mono">{voucherLeave.days} يوم</span>
                </div>
              </div>

              {/* Substitute Staff & Notes */}
              <div className="mb-4 text-xs space-y-2">
                <div className="p-3 rounded border border-slate-200 bg-white">
                  <span className="text-slate-500 font-bold block mb-1">الموظف / المعلم المكلف كبديل:</span>
                  <span className="font-bold text-slate-800">
                    {voucherLeave.replacementStaffName || "تمت إعادة توزيع النصاب داخلياً من خلال إدارة القسم"}
                  </span>
                </div>
                {voucherLeave.decisionReason && (
                  <div className="p-3 rounded border border-slate-200 bg-white">
                    <span className="text-slate-500 font-bold block mb-1">قرار واعتماد الموارد البشرية:</span>
                    <span className="text-slate-800">{voucherLeave.decisionReason}</span>
                  </div>
                )}
              </div>

              {/* Official Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t-2 border-slate-300 text-center text-xs">
                <div className="space-y-8">
                  <div className="font-bold text-slate-700">توقيع الموظف</div>
                  <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1 text-slate-500 font-mono text-[10px]">
                    {voucherLeave.staffName}
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="font-bold text-slate-700">المدير المباشر / رئيس القسم</div>
                  <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1 text-slate-500 text-[10px]">
                    الموافقة والتنسيق
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="font-bold text-slate-700">مدير الموارد البشرية والاعتماد</div>
                  <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto pb-1 text-slate-500 text-[10px]">
                    الختم الرسمي
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions (Hidden on Print) */}
            <div className="p-4 border-t border-border/70 flex justify-end gap-2.5 print:hidden bg-muted/10 shrink-0">
              <button
                type="button"
                onClick={() => setVoucherLeave(null)}
                className="h-10 px-5 text-xs font-bold text-muted-foreground border border-input rounded-xl hover:bg-accent transition-colors"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="h-10 inline-flex items-center gap-1.5 px-6 text-xs font-black text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-xs glow-primary"
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
      {deleteLeaveId && (
        <div className="modal-backdrop-luxury">
          <div className="modal-card-luxury max-w-sm w-full text-center p-6">
            <div className="h-12 w-12 rounded-2xl bg-danger/10 text-danger grid place-items-center mx-auto mb-3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black text-foreground">تأكيد حذف طلب الإجازة</h3>
            <p className="text-xs text-muted-foreground font-bold mt-1 mb-4 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف طلب الإجازة هذا؟ سيتم حذف السجل وإلغاء أثره على الحسابات.
            </p>
            <div className="flex justify-center gap-2.5">
              <button
                onClick={() => setDeleteLeaveId(null)}
                className="flex-1 h-10 text-xs font-bold border border-input rounded-xl hover:bg-accent transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDelete(deleteLeaveId)}
                className="flex-1 h-10 text-xs font-black text-white bg-danger hover:bg-danger/90 rounded-xl transition-colors shadow-xs"
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
